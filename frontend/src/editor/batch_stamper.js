import * as THREE from 'three'
import {TILE_Y_POSITION, BALL_Y_POSITION, NUM_MAX_ENTITIES_IN_EDITOR, TILE_GEOMETRY, BALL_GEOMETRY} from '@/defines'
import {Tile, Ball} from '@/world/entities'
import {IMesh} from '@/world/imesh'

export default class {
  constructor() {
    this.active = false
    this.type = null
    this.stamperInitialPos = null
    this.stamperFinalPos = null
    this.stamperPos = null
    this.batchDef = {}
    this.freeModePoints = []
    this.parameters = {
      single: {
        rotation: 0,
        color: '#02ACA5'
      },
      line: {
        forwardOffset: 2,
        fixedRotation: false,
        rotation: 0,
        color: '#02ACA5'
      },
      free: {
        forwardOffset: 2,
        fixedRotation: false,
        rotation: 0,
        color: '#02ACA5'
      },
      triangle: {
        forwardOffset: 2,
        rightOffset: 2.5,
        fixedRotation: false,
        rotation: 0,
        color: '#02ACA5'
      },
      rectangle: {
        forwardOffset: 3,
        rightOffset: 3,
        rotation: 0,
        color: '#02ACA5'
      },
      image: {
        filename: 'None',
        width: 0,
        height: 0,
        rawData: null,
        data: null,
        forwardOffset: 3,
        rightOffset: 2,
        rotation: 0,
        horSize: 25,
        verSize: 25
      },
      ball: {
        color: '#EA7251'
      }
    }
  }

  init(editor) {
    this.editor = editor
    this.imTiles = new IMesh(NUM_MAX_ENTITIES_IN_EDITOR, TILE_GEOMETRY, true)
    this.imBalls = new IMesh(1, BALL_GEOMETRY, true)

    editor.world.scene.add(this.imTiles.mesh)
    editor.world.scene.add(this.imBalls.mesh)
  }

  render() {
    this.imTiles.prepareRender()
    this.imBalls.prepareRender()
  }

  reset() {
    this.stamperInitialPos = null
    this.stamperFinalPos = null
    this.stamperPos = null
    this.freeModePoints = []
    this.imTiles.setCount(0)
    this.imBalls.setCount(0)
  }

  setType(type) {
    this.type = type
  }

  show(show) {
    if (!show) {
      this.imTiles.setCount(0)
      this.imBalls.setCount(0)
    }
  }

  onMouseUp(event) {
    const hitPoint = this.editor.getGroundHitPoint(event.offsetX, event.offsetY)

    if (hitPoint) {
      if (this.type === 'single' || this.type === 'image' || this.type === 'ball') {
        return {x: hitPoint.x, z: hitPoint.z}
      } else {
        if (this.stamperInitialPos) {
          return {x: this.stamperInitialPos.x, z: this.stamperInitialPos.z}
        } else {
          this.stamperInitialPos = hitPoint.clone()

          if (this.type === 'free') {
            this.freeModePoints.push({x: hitPoint.x, z: hitPoint.z})
          }
        }
      }
    }

    return null
  }

  onMouseMove(event) {
    if (this.active) {
      const hitPoint = this.editor.getGroundHitPoint(event.offsetX, event.offsetY)

      if (hitPoint) {
        if (this.type === 'free') {
          if (this.freeModePoints.length > 0) {
            const prevPoint = this.freeModePoints[this.freeModePoints.length - 1]
            const dist = Math.sqrt(Math.pow(hitPoint.x - prevPoint.x, 2) + Math.pow(hitPoint.z - prevPoint.z, 2))

            if (dist >= this.parameters[this.type].forwardOffset) {
              this.freeModePoints.push({x: hitPoint.x, z: hitPoint.z})
              this.rebuild()
            }
          } else {
            this.stamperPos = hitPoint.clone()
          }
        }
        else if (this.type === 'single' || this.type === 'ball') {
          this.stamperPos = hitPoint.clone()
        } else {
          if (!this.stamperInitialPos) {
            this.stamperPos = hitPoint.clone()
          } else {
            this.stamperFinalPos = hitPoint.clone()
          }
        }
        this.rebuild()
      } else if (!this.stamperInitialPos && (this.type !== 'free' || this.freeModePoints.length === 0)) {
        this.show(false)
      }
    }
  }

  createEntitiesFromStamper(world, parent) {
    let entities = []

    for (let i = 0; i < this.batchDef.entities.length; ++i) {
      const entityDef = this.batchDef.entities[i]
      let position = new THREE.Vector3(entityDef.offset.x, entityDef.entityType === 'ball' ? BALL_Y_POSITION : TILE_Y_POSITION, entityDef.offset.z)

      if (this.stamperInitialPos) {
        position.x -= this.stamperInitialPos.x
        position.z -= this.stamperInitialPos.z
      } else if (this.type === 'image') {
        position.x -= this.stamperPos.x
        position.z -= this.stamperPos.z
      }

      let entity

      if (entityDef.entityType === 'ball') {
        entity = new Ball({
          name: 'Ball',
          position: position,
          iMesh: world.imBalls,
          color: entityDef.color || this.parameters[this.type].color
        })
      } else {
        entity = new Tile({
          name: 'Tile',
          position: position,
          angleY: entityDef.rotation,
          iMesh: world.imTiles,
          color: entityDef.color || this.parameters[this.type].color
        })
      }

      entities.push(entity)

      if (parent) {
        parent.addChild(entity)
      }
    }

    return entities
  }

  getParameters() {
    return this.parameters[this.type]
  }

  rebuild() {
    if (!this.active) {
      return
    }

    this.batchDef = {
      rotation: 0,
      entities: []
    }

    const stamperParameters = this.parameters[this.type]

    switch(this.type) {
      case 'single':
        if (this.stamperPos) {
          this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}, rotation:THREE.MathUtils.degToRad( parseFloat(stamperParameters.rotation))})
        }
        break

      case 'ball':
        if (this.stamperPos) {
          this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}, entityType: 'ball'})
        }
        break

      case 'line':
        if (!this.stamperInitialPos) {
          if (this.stamperPos) {
            this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}})
          }
        } else {
          let dir = this.stamperFinalPos.clone()
          dir.sub(this.stamperInitialPos)
          const length = dir.length()
          dir.normalize()

          const forwardOffset = parseFloat(stamperParameters.forwardOffset)
          const rotation = THREE.MathUtils.degToRad(parseFloat(stamperParameters.rotation))
          let dist = 0
          let i = 0

          while (dist < length) {
            const offsetValue = (i * forwardOffset)
            const offset = {
              x: this.stamperInitialPos.x + (dir.x * offsetValue),
              z: this.stamperInitialPos.z + (dir.z * offsetValue)
            }
            const rot = stamperParameters.fixedRotation ? rotation : Math.atan2(dir.x, dir.z)

            this.batchDef.entities.push({offset: offset, rotation: rot})
            dist += forwardOffset;
            ++i
          }
        }
        break

      case 'triangle':
        if (!this.stamperInitialPos) {
          if (this.stamperPos) {
            this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}})
          }
        } else {
          let dir = this.stamperFinalPos.clone()
          dir.sub(this.stamperInitialPos)
          const length = dir.length()
          dir.normalize()

          const forwardOffset = parseFloat(stamperParameters.forwardOffset)
          const rightOffset = parseFloat(stamperParameters.rightOffset)
          const rotation = THREE.MathUtils.degToRad(parseFloat(stamperParameters.rotation))
          let normal = {x: -dir.z, z: dir.x}
          let dist = 0
          let i = 0

          while (dist < length) {
            const fwd = (i * forwardOffset)
            let right = (rightOffset * i) / 2

            for (let k = 0; k < i + 1; ++k) {
              const offset = {
                x: this.stamperInitialPos.x + (dir.x * fwd) + (normal.x * right),
                z: this.stamperInitialPos.z + (dir.z * fwd) + (normal.z * right)
              }
              const rot = stamperParameters.fixedRotation ? rotation : Math.atan2(dir.x, dir.z)

              this.batchDef.entities.push({offset: offset, rotation: rot})
              right -= rightOffset
            }

            dist += forwardOffset;
            ++i
          }
        }
        break

      case 'rectangle':
        if (!this.stamperInitialPos) {
          if (this.stamperPos) {
            this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}})
          }
        } else {
          let length = this.stamperFinalPos.clone()
          length.sub(this.stamperInitialPos)

          const multX = length.x < 0 ? -1 : 1
          const multZ = length.z < 0 ? -1 : 1

          length.x = Math.abs(length.x)
          length.z = Math.abs(length.z)

          const forwardOffset = parseFloat(stamperParameters.forwardOffset)
          const rightOffset = parseFloat(stamperParameters.rightOffset)
          const rotation = THREE.MathUtils.degToRad(parseFloat(stamperParameters.rotation))

          let offset = {x: 0, z: 0}
          let distX = 0

          while (distX < length.x) {
            let distZ = 0

            while (distZ < length.z) {
              this.batchDef.entities.push({offset: {x: this.stamperInitialPos.x + offset.x, z: this.stamperInitialPos.z + offset.z}, rotation: rotation})
              offset.z += rightOffset * multZ
              distZ += rightOffset
            }

            offset.x += forwardOffset * multX
            offset.z = 0
            distX += forwardOffset
          }
        }
        break

      case 'image':
        if (stamperParameters.data && this.stamperPos) {
          const forwardOffset = parseFloat(stamperParameters.forwardOffset)
          const rightOffset = parseFloat(stamperParameters.rightOffset)
          const rotation = THREE.MathUtils.degToRad(parseFloat(stamperParameters.rotation))

          let offset = {x: 0, z: 0}

          const ratioX = Math.floor(stamperParameters.width / stamperParameters.horSize)
          const ratioY = Math.floor(stamperParameters.height / stamperParameters.verSize)

          for (let y = 0; y < stamperParameters.verSize; ++y) {
            let idx = y * ratioY * stamperParameters.width

            for (let x = 0; x < stamperParameters.horSize; ++x) {
              const color = stamperParameters.data[idx]
              this.batchDef.entities.push({offset: {x: this.stamperPos.x + offset.x, z: this.stamperPos.z + offset.z}, rotation: rotation, color: color})
              offset.z += rightOffset
              idx += ratioX
            }

            offset.z = 0
            offset.x -= forwardOffset
          }
        }
        break

      case 'free': {
        const rotation = THREE.MathUtils.degToRad(parseFloat(stamperParameters.rotation))

        if (this.freeModePoints.length > 0) {
          for (const [i, p] of this.freeModePoints.entries()) {
            let dir = {x: 0, z: 0}

            if (!stamperParameters.fixedRotation) {
              if (i === 0) {
                if (this.freeModePoints.length > 1) {
                  dir.x = this.freeModePoints[1].x - this.freeModePoints[0].x
                  dir.z = this.freeModePoints[1].z - this.freeModePoints[0].z
                }
              } else {
                dir.x = this.freeModePoints[i].x - this.freeModePoints[i - 1].x
                dir.z = this.freeModePoints[i].z - this.freeModePoints[i - 1].z
              }
            }

            const rot = stamperParameters.fixedRotation ? rotation : Math.atan2(dir.x, dir.z)
            this.batchDef.entities.push({offset: {x: p.x, z: p.z}, rotation: rot})
          }
        } else if (this.stamperPos) {
          this.batchDef.entities.push({offset: {x: this.stamperPos.x, z: this.stamperPos.z}, rotation: stamperParameters.fixedRotation ? rotation : 0})
        }
      }
      break
    }

    // ...
    const imMesh = this.type === 'ball' ? this.imBalls : this.imTiles

    imMesh.setCount(Math.min(this.batchDef.entities.length, NUM_MAX_ENTITIES_IN_EDITOR))

    for (let i = 0; i < this.batchDef.entities.length; ++i) {
      const entityDef = this.batchDef.entities[i]
      imMesh.setColorAt(i, entityDef.color || stamperParameters.color)
      imMesh.setTransformAt(i, entityDef.offset.x, entityDef.entityType === 'ball' ? BALL_Y_POSITION : TILE_Y_POSITION, entityDef.offset.z, entityDef.rotation || 0)
    }
  }
}