<template>
  <div class="viewer">
    <div v-if="activeScene" class="sceneInfo">
      <div class="title">{{activeScene.title}}</div>
      <div class="author">by {{activeScene.author}}</div>
    </div>
    <div
      class="scene"
      ref="scene"
    />
    <div v-if="message" class="message">
      {{message}}
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import * as THREE from 'three'
import Ammo from 'ammo.js'
import World from '@/world/world'
import {Ground, Tile, Group, Ball} from '@/world/entities'
import {TILE_Y_POSITION, BALL_Y_POSITION, INITIAL_IMPULSE_VALUE, SCENE_INITIAL_TILE_IDX, SCENE_LAST_TILE_IDX} from '@/defines'

const CAMERA_POSITION = {x: -110, y: 100, z: 0}
const WAITING_FOR_FALLING_TILE_TIME = 0.5

let SceneId = 0

export default {
  name: 'Viewer',
  data: function() {
    return {
      activeScene: null,
      message: 'Loading. Please, wait...'
    }
  },
  mounted: function() {
    this.animFrameId = window.requestAnimationFrame(this.tick)
    this.start = Date.now()
    this.scenePositionZ = -10000
    this.state = 'playing'
    this.timer = 0
    this.cameraDest = new THREE.Vector3(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z + this.scenePositionZ)

    this.world = new World({
      domElement: this.$refs.scene,
      cameraPosition: this.cameraDest,
      numTiles: 10000,
      numBalls: 5000,
      numGrounds: 10
    })

    this.world.camera.lookAt(new THREE.Vector3(20, 0, this.cameraDest.z))

    this.activeScenes = []
    this.activeSceneIdx = 0
    this.nextSceneDefs = []
    this.loadedSceneId = this.$route.params.id

    const self = this

    this.fetchScenes(10, this.loadedSceneId, function() {
      if (self.loadedSceneId) {
        self.addNextSceneToWorld(true, false)
      } else {
        for (let i = 0; i < 4; ++i) {
          self.addNextSceneToWorld(i < 2, false)
        }
      }

      _.delay(function() {
        self.message = null
      }, 2000)

      _.delay(function() {
        self.activeSceneIdx = 0
        self.activeScene = self.activeScenes[self.activeSceneIdx]
        self.impulseTile(self.activeScene.initialTile)
      }, 3000)
    })

    window.addEventListener('resize', function() {
      self.world.onWindowResize()
    }, false)
  },
  destroyed: function() {
    if (this.animFrameId) {
      window.cancelAnimationFrame(this.animFrameId)
    }
  },
  methods: {
    fetchScenes: function(count, sceneId, callback) {
      const self = this
      let url = 'scenes?'

      if (sceneId) {
        url += `id=${sceneId}`
      } else {
        url += `count=${count}`
      }

      this.$http.get(url).then(function(response) {
        if (response.body.ok) {
          for (const sceneDef of response.body.scenes) {
            sceneDef.id = SceneId++
            self.nextSceneDefs.push(sceneDef)
          }

          if (callback) {
            callback()
          }
        } else {
          self.message = 'Error loading boards. Probably the server free tier daily quota is over.'
        }
      }).catch(function() {
        self.message = 'Error loading boards. Probably the server free tier daily quota is over.'
      })
    },
    tick: function() {
      const current = Date.now()
      const delta = Math.min((current - this.start) / 1000, 0.016)

      this.start = current

      this.world.tick(delta)
      this.world.render()

      if (this.activeScene) {
        if (!this.loadedSceneId) {
          const nextSceneIdx = this.activeSceneIdx + 1
          const nextScene = this.activeScenes[nextSceneIdx]

          if (nextScene.initialTile.state === 'falling') {
            // finish scene streaming
            const sceneToStream = this.activeScenes[nextSceneIdx + 2]

            if (sceneToStream.state === 'streaming') {
              this.streamScene(sceneToStream, -1, this.activeScenes[nextSceneIdx + 1])
            }

            // ...
            this.activeScene = nextScene
            this.activeSceneIdx = nextSceneIdx

            // visible scenes: [activeScene - 2, activeScene - 1, activeScene, activeScene + 1, activeScene + 2, activeScene + 3]
            // physical scenes: [activeScene - 1, activeScene, activeScene + 1]
            for (let i = 0; i <= nextSceneIdx - 4; ++i) {
              let removedScene = this.activeScenes.shift()
              removedScene.group.removeFromRenderWorld()
              removedScene.group.removeFromPhysicalWorld(this.world)
              this.world.group.removeChild(removedScene.group)
              --this.activeSceneIdx
            }

            this.activeScenes[this.activeSceneIdx + 1].group.addToPhysicalWorld(this.world)
            this.addNextSceneToWorld(false, true)
          } else {
            const sceneToStream = this.activeScenes[nextSceneIdx + 2]

            if (sceneToStream.state === 'streaming') {
              this.streamScene(sceneToStream, 10, this.activeScenes[nextSceneIdx + 1])
            }
          }

          const lookAtZ = this.getLookAtZ()

          if (lookAtZ) {
            if (lookAtZ > this.world.camera.position.z) {
              this.cameraDest.z = lookAtZ + CAMERA_POSITION.z
            }

            let dir = this.cameraDest.clone()
            dir.sub(this.world.camera.position)
            let speed = dir.length() * 0.8
            dir.normalize()

            this.world.camera.position.z += dir.z * delta * speed

            this.world.lightTarget.position.set(this.world.camera.position.x + 90, 0, this.world.camera.position.z)
            this.world.directionalLight.position.set(this.world.camera.position.x + 110, this.world.camera.position.y + 70, this.world.camera.position.z - 20)

            this.state = 'playing'
          } else {
            if (this.state === 'playing') {
              this.state = 'waiting'
              this.timer = WAITING_FOR_FALLING_TILE_TIME
            } else if (this.state === 'waiting') {
              this.timer -= delta
              if (this.timer <= 0) {
                // No more tiles falling. Move to the next scene
                this.impulseTile(this.activeScenes[this.activeSceneIdx + 1].initialTile)
                this.state = 'playing'
              }
            }
          }
        }
      }

      // camera position update to the newest tiles falling
      this.animFrameId = window.requestAnimationFrame(this.tick)
    },
    getLookAtZ: function() {
      let lastTileFalling = null

      for (const child of this.activeScene.group.children) {
        if (child.type === 'ground' || child.state !== 'falling') {
          continue
        }

        if (!lastTileFalling || (child.fallingTimer > lastTileFalling.fallingTimer)) {
          lastTileFalling = child
        }
      }

      if (lastTileFalling) {
        return lastTileFalling.getWorldPosition().z
      }

      return null
    },
    createEntity(scene, entityDef, entityIdx, prevScene) {
      if (entityIdx === SCENE_LAST_TILE_IDX) {
        scene.lastTileDef = entityDef
        return // the last tile is replaced by the initial tile of the next scene
      }

      let entity

      switch(entityDef.type) {
        case 'ground':
          entity = new Ground({
            position: new THREE.Vector3(entityDef.position.x, 0, entityDef.position.z),
            color: entityDef.color,
            iMesh: this.world.imGrounds
          })
          break

        case 'tile':
          entity = new Tile({
            position: new THREE.Vector3(entityDef.position.x, TILE_Y_POSITION, entityDef.position.z),
            angleY: entityDef.rotation,
            color: entityDef.color,
            iMesh: this.world.imTiles
          })
          break

        case 'ball':
          entity = new Ball({
            position: new THREE.Vector3(entityDef.position.x, BALL_Y_POSITION, entityDef.position.z),
            color: entityDef.color,
            iMesh: this.world.imBalls
          })
          break
      }

      if (entityIdx === SCENE_INITIAL_TILE_IDX) {
        if (prevScene) {
          // mix the color con the last tile of the previous scene
          const prevColor = new THREE.Color(prevScene.lastTileDef.color)
          entity.color = `#${prevColor.lerp(new THREE.Color(entity.color), 0.5).getHexString()}`
        }

        scene.initialTile = entity
      }

      scene.group.addChild(entity)

      return entity
    },
    streamScene(scene, numEntities, prevScene) {
      const numChildren = scene.contentDef.length
      const from = scene.streamingFrom
      const to = numEntities === -1 ? numChildren : Math.min(from + numEntities, numChildren)

      for (let i = from; i < to; ++i) {
        const entity = this.createEntity(scene, scene.contentDef[i], i, prevScene)

        if (!entity) {
          continue
        }

        entity.addToRenderWorld()
        entity.addToPhysicalWorld(this.world)
      }

      scene.streamingFrom += numEntities

      if (scene.streamingFrom >= numChildren) {
        scene.state = 'ready'
      }
    },
    createScene(sceneDef, prevScene, streamingIt) {
      const contentDef = JSON.parse(sceneDef.content)

      let scene = {
        id: sceneDef.id,
        title: sceneDef.title,
        author: sceneDef.author,
        group: new Group(),
        initialTile: null,
        state: streamingIt ? 'streaming' : 'ready'
      }

      if (streamingIt) {
        scene.contentDef = contentDef
        scene.streamingFrom = 0
      } else {
        for (const [i, entityDef] of contentDef.entries()) {
          this.createEntity(scene, entityDef, i, prevScene)
        }
      }

      let offsetX = 0

      if (prevScene) {
        let prevX
        let thisX


        if (prevScene.lastTileDef) {
          prevX = prevScene.lastTileDef.position.x
        } else {
          prevX = prevScene.contentDef[SCENE_LAST_TILE_IDX].position.x
        }

        if (scene.initialTile) {
          thisX = scene.initialTile.position.x
        } else {
          thisX = scene.contentDef[SCENE_INITIAL_TILE_IDX].position.x
        }

        offsetX = prevScene.group.position.x + prevX - thisX
      }

      scene.group.setPosition(offsetX, 0, this.scenePositionZ)

      return scene
    },
    addNextSceneToWorld: function(andPhysicalWorld, streamingIt) {
      const scene = this.createScene(this.nextSceneDefs.shift(), this.activeScenes[this.activeScenes.length -1], streamingIt)

      if (!streamingIt) {
        scene.group.addToRenderWorld()

        if (andPhysicalWorld) {
          scene.group.addToPhysicalWorld(this.world)
        }
      }

      this.world.group.addChild(scene.group)
      this.activeScenes.push(scene)
      this.scenePositionZ += 100

      // ...
      if (this.nextSceneDefs.length <= 5) {
        this.fetchScenes(1)
      }
    },
    impulseTile: function(tile) {
      if (!tile.body.isActive()) {
        tile.body.activate()
      }

      tile.body.applyImpulse(new Ammo.btVector3(0, 0, INITIAL_IMPULSE_VALUE))
    }
  }
}

</script>

<style lang="less" scoped>
.viewer {
  .sceneInfo {
    background: rgba(0, 0, 0, 0.2);
    width: 400px;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    color: white;
    text-align: left;
    padding: 20px;
    overflow: hidden;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;

    .title {
      font-size: 26px;
    }

    .author {
      font-size: 18px;
    }
  }

  .scene {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .message {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    position: absolute;
    color: #DCDCDC;
    background: black;
    font-size: 30px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
