<template>
  <div class="editor">
    <div class="toolbar" v-show="state !== 'validating'">
      <div class="controlsSection">
        <div
          class="toolbarButton"
          title="Undo (Ctrl + Z)"
          v-bind:class="{disabled: state !== 'idle' || actionsQueue.idx === 0}"
          v-on:click="undoAction"
        >
          <i class="fas fa-arrow-left"></i>
        </div>
        <div
          class="toolbarButton"
          title="Redo (Ctrl + Y)"
          v-bind:class="{disabled: state !== 'idle' || (actionsQueue.idx >= actionsQueue.queue.length)}"
          v-on:click="redoAction"
        >
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
      <div class="controlsSection">
        <div
          class="toolbarButton"
          v-bind:class="{active: activeTransform === 'select', disabled: state !== 'idle'}"
          v-on:click="selectTransform('select')"
          title="Select (Q)"
        >
          <i class="fas fa-mouse-pointer"></i>
        </div>
        <div
          class="toolbarButton"
          v-on:click="selectTransform('translate')"
          v-bind:class="{active: activeTransform === 'translate', disabled: state !== 'idle'}"
          title="Select and Move (W)"
        >
          <i class="fas fa-arrows-alt"></i>
        </div>
        <div
          class="toolbarButton"
          v-on:click="selectTransform('rotate')"
          v-bind:class="{active: activeTransform === 'rotate', disabled: state !== 'idle'}"
          title="Select and Rotate (E)"
        >
          <i class="fas fa-undo"></i>
        </div>
        <div
          class="toolbarButton"
          v-on:click="removeSelectedEntities"
          v-bind:class="{disabled: state !== 'idle' || selectedEntities.length === 0}"
          title="Delete Selected (Supr)"
        >
          <i class="far fa-trash-alt"></i>
        </div>
      </div>
      <div class="controlsSection">
        <div
          class="toolbarButton"
          v-bind:class="{
            invisible: state === 'playingFromSelection' || (state === 'paused' && stateBeforePause === 'playingFromSelection'),
            hidden: state === 'playing' || (state === 'paused' && stateBeforePause !== 'playingFromSelection')
          }"
          v-on:click="play(false)"
          title="Play (Space)"
        >
          <i class="fas fa-play"></i>
        </div>
        <div
          v-if="state !== 'idle'"
          class="toolbarButton"
          v-on:click="stop"
          title="Stop (Space)"
        >
          <i class="fas fa-stop"></i>
        </div>
        <div
          v-if="state === 'idle' && selectedEntities.length === 1 && selectedEntities[0].type === 'tile'"
          class="toolbarButton"
          v-on:click="play(true)"
          title="Play from Selection (Ctrl + Space)"
        >
          <i class="far fa-play-circle"></i>
        </div>
        <div
          v-show="state !== 'idle'"
          class="toolbarButton"
          v-on:click="togglePause"
          title="Pause"
          v-bind:class="{active: state === 'paused'}"
        >
          <i class="fas fa-pause"></i>
        </div>
        <div
          v-show="state === 'paused'"
          class="toolbarButton"
          v-on:click="stepForward"
          title="Step Forward"
        >
          <i class="fas fa-step-forward"></i>
        </div>
      </div>
      <div class="entitiesStats">{{numValidEntitiesInTheScene}} of {{maxNumEntitiesInScene}} elements used</div>
      <div class="controlsSection" v-bind:style="{'margin-left': 'auto', 'margin-right': '40px'}">
        <div
          v-if="sceneUuid"
          class="sceneUuid"
        >
          <div
            class="toolbarButton"
            v-on:click="copySceneUrlToClipboard"
            title="Copy board URL to the clipboard"
          >
            <i class="fas fa-share-square"></i>
          </div>
        </div>
        <div
          v-else
          class="toolbarButton"
          v-bind:class="{disabled: state !== 'idle' || numValidEntitiesInTheScene > maxNumEntitiesInScene}"
          v-on:click="publishScene"
          title="Publish Board"
        >
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <div
          class="toolbarButton"
          v-bind:class="{disabled: state !== 'idle'}"
          title="Help"
          v-on:click="openHelpDialog"
        >
          <i class="fas fa-question"></i>
        </div>
      </div>
    </div>
    <div class="validatingScene" v-show="state === 'validating'">
      <div class="mask">
        <div class="messageArea">
          <div class="message">Validating board...</div>
          <div class="toolbarButton" v-on:click="cancelValidation">Cancel</div>
        </div>
      </div>
    </div>
    <div
      class="scene"
      ref="scene"
      v-bind:class="{batchStamperActive: batchStamper.active}"
      v-on:mousedown="onMouseDown"
      v-on:mouseup="onMouseUp"
      v-on:mousemove="onMouseMove"
    >
      <div class="stamperMessage" v-if="batchStamper.active">Stamper Mode</div>
    </div>
    <div class="panel">
      <CommandPanel
        ref="commandPanel"
        v-bind:batchStamperParameters="batchStamper.parameters"
        v-bind:selectedEntities="selectedEntities"
        v-bind:editingGroup="world ? world.group : null"
        v-on:batch-stamper-on="onBatchStamperOn"
        v-on:batch-stamper-off="onBatchStamperOff"
        v-on:rebuild-batch-stamper="rebuildBatchStamper"
        v-on:rotate-selected-entities="rotateSelectedEntities"
        v-on:move-selected-entities="moveSelectedEntities"
        v-on:colorize-selected-entities="colorizeSelectedEntities"
        v-on:rotate-group-entities="rotateGroupEntities"
        v-on:move-group-entities="moveGroupEntities"
        v-on:colorize-group-entities="colorizeGroupEntities"
        v-on:select-entities="onSelectEntities"
        v-on:deselect-entities="onDeselectEntities"
      />
    </div>
    <IODialog
      v-show="dialogVisible === 'ioDialog'"
      ref="ioDialog"
      v-on:close="dialogVisible = null"
    />
    <PublishDialog
      v-show="dialogVisible === 'publishDialog'"
      ref="publishDialog"
      v-on:close="closePublishDialog"
    />
    <HelpDialog
      v-show="dialogVisible === 'helpDialog'"
      ref="helpDialog"
      v-on:close="dialogVisible = null"
    />
    <div
      v-if="selectionBox"
      ref="selectionBox"
      class="selectionBox"
      v-bind:style="{top: selectionBox.top + 'px', left: selectionBox.left + 'px', width: selectionBox.width + 'px', height: selectionBox.height + 'px'}"
    />
  </div>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import * as THREE from 'three'
import Ammo from 'ammo.js'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js'
import {TILE_Y_POSITION, MAX_SCENE_TITLE_LENGTH, MAX_SCENE_AUTHOR_LENGTH, NUM_MAX_ENTITIES_IN_EDITOR, INITIAL_IMPULSE_VALUE, SCENE_INITIAL_TILE_IDX, SCENE_LAST_TILE_IDX} from '@/defines'
import {AddEntities, RemoveEntities, MoveEntities, RotateEntities, SelectEntities, DeselectEntities, CombinedActions, ColorizeEntities} from './actions'
import World from '@/world/world'
import {Ground, Tile, Group} from '@/world/entities'
import BatchStamper from './batch_stamper'
import Shortcuts from './shortcuts'
import CommandPanel from './command_panel'
import IODialog from './io_dialog'
import PublishDialog from './publish_dialog'
import HelpDialog from './help_dialog'

const CLICK_TIME = 300
const MAX_NUM_ENTITIES = 1500
const COLOR_FADING_TIME = 0.5
const CAMERA_POSITION = {x: -90, y: 80, z: 0}

export default {
  name: 'Editor',
  components: {
    CommandPanel,
    IODialog,
    PublishDialog,
    HelpDialog
  },
  data: function() {
    return {
      maxNumEntitiesInScene: MAX_NUM_ENTITIES,
      batchStamper: new BatchStamper(),
      selectedEntities: [],
      activeTransform: 'select',
      state: 'idle',
      stateBeforePause: null,
      actionsQueue: {
        queue: [],
        idx: 0
      },
      dialogVisible: null,
      dialogEntities: null,
      sceneUuid: null,
      world: null,
      batchId: 0,
      selectionBox: null
    }
  },
  computed: {
    numValidEntitiesInTheScene: function() {
      return this.world ? this.getNumValidEntitiesInGroup(this.world.group) : 0
    }
  },
  mounted: function() {
    this.world = new World({
      domElement: this.$refs.scene,
      cameraPosition: {x: -90, y: 80, z: 0},
      numTiles: NUM_MAX_ENTITIES_IN_EDITOR,
      numBalls: NUM_MAX_ENTITIES_IN_EDITOR,
      numGrounds: 1
    })

    this.orbitControl = new OrbitControls(this.world.camera, this.world.renderer.domElement)
    this.orbitControl.mouseButtons.LEFT = -1
    this.orbitControl.maxDistance = 200

    this.transformControlEnabled = false
    this.transformControl = new TransformControls(this.world.camera, this.world.renderer.domElement)
    this.selectTransform(this.activeTransform)

    this.colorFadingTimer = COLOR_FADING_TIME / 2

    this.raycaster = new THREE.Raycaster()
    this.world.scene.add(this.transformControl)
    this.batchStamper.init(this)

    // create ground, initial and last tiles
    this.ground = new Ground({
      name: 'Ground',
      iMesh: this.world.imGrounds,
      color: 0x444444
    })
    this.executeAction(AddEntities, {group: this.world.group, entities: [this.ground]}, true)

    let tiles = []

    for (const z of [-50, 50]) {
      tiles.push(new Tile({
        name: 'Tile',
        position: new THREE.Vector3(0, TILE_Y_POSITION, z),
        iMesh: this.world.imTiles,
        userData: {isFixed: true},
        color: 0x02ACA5
      }))
    }

    this.executeAction(AddEntities, {group: this.world.group, entities: tiles}, true)

    // dummy object used in the gizmo
    this.initialDummyPosition = new THREE.Vector3()
    this.prevDummyPosition = new THREE.Vector3()

    this.dummyObject = new THREE.Object3D()
    this.world.scene.add(this.dummyObject)

    this.animFrameId = window.requestAnimationFrame(this.tick)
    this.start = Date.now()

    this.shortcuts = new Shortcuts(this)
    this.manageTransformControlEvents()

    const showHelpDialog = window.localStorage.getItem('showDialogAtStartup')
    if (!showHelpDialog  || showHelpDialog === 'true') {
      this.openHelpDialog()
    }

    const self = this
    window.addEventListener('resize', function() {
      self.world.onWindowResize()
    }, false)
  },
  destroyed: function() {
    this.shortcuts.onDestroyed()

    if (this.animFrameId) {
      window.cancelAnimationFrame(this.animFrameId)
    }
  },
  methods: {
    manageTransformControlEvents: function() {
      const self = this

      this.transformControl.addEventListener('dragging-changed', function(event) {
        if (self.batchStamper.active) {
          return
        }

        self.orbitControl.enabled = !event.value
        self.transformControlEnabled = event.value

        if (event.value) {
          if (event.target.mode === 'translate' && self.shortcuts.isKeyPressed('Shift')) {
            // duplicate selected entities
            let newEntitiesByGroup = {}
            let groupById = {}
            let newEntities = []

            for (const entity of self.selectedEntities) {
              if (entity.userData.isFixed || entity.frozen) {
                continue
              }

              if ((entity.type === 'tile') || (entity.type === 'group')) {
                const newEntity = entity.clone()

                if (!(entity.parent.id in newEntitiesByGroup)) {
                  newEntitiesByGroup[entity.parent.id] = []
                  groupById[entity.parent.id] = entity.parent
                }

                newEntitiesByGroup[entity.parent.id].push(newEntity)
                newEntities.push(newEntity)
              }
            }

            let actions = []

            for (const k in newEntitiesByGroup) {
              actions.push(new AddEntities({group: groupById[k], entities: newEntitiesByGroup[k]}, self))
            }

            actions.push(new SelectEntities({entities: newEntities}, self))
            self.executeAction(CombinedActions, {actions: actions})
          }

          self.initialDummyPosition.copy(self.dummyObject.position)
          self.prevDummyPosition.copy(self.initialDummyPosition)
          self.prevDummyRotation = 0
          self.accumRotation = 0

          self.initialTransformValues = []

          for (const entity of self.selectedEntities) {
            self.initialTransformValues.push({
              position: entity.position.clone(),
              rotation: entity.angleY
            })
          }
        }
      })

      this.transformControl.addEventListener('objectChange', function(event) {
        if (self.batchStamper.active) {
          return
        }

        switch(event.target.mode) {
          case 'translate': {
            event.target.object.position.y = self.prevDummyPosition.y // remove vertical movement
            let offset = event.target.object.position.clone()
            offset.sub(self.prevDummyPosition)

            for (const entity of self.selectedEntities) {
              if (entity.frozen) {
                offset.x = 0
                offset.z = 0
              } else if (entity.userData.isFixed) {
                offset.z = 0
              }

              entity.move(offset.x, offset.y, offset.z)
            }

            self.prevDummyPosition.copy(event.target.object.position)
          }
          break

          case 'rotate': {
            let offset = event.target.rotationAngle - self.prevDummyRotation

            for (const entity of self.selectedEntities) {
              if (!entity.userData.isFixed && !entity.frozen) {
                entity.rotate(offset)
              }
            }

            self.prevDummyRotation = event.target.rotationAngle
            self.accumRotation += offset
          }
          break
        }

        self.$refs.commandPanel.refresh()
      })

      this.transformControl.addEventListener('mouseUp', function(event) {
        if (self.batchStamper.active) {
          return
        }

        switch(event.target.mode) {
          case 'translate': {
            let offset = self.dummyObject.position.clone()
            offset.sub(self.initialDummyPosition)
            offset.y = 0

            if (offset.lengthSq() > 0) {
              let fixedEntities = []
              let freeEntities = []

              for (let i = 0; i < self.selectedEntities.length; ++i) {
                // restore entities position to apply the move action
                const entity = self.selectedEntities[i]
                let position = self.initialTransformValues[i].position
                entity.setPosition(position.x, position.y, position.z)

                if (entity.frozen) {
                  continue
                }

                if (entity.userData.isFixed) {
                  if (offset.x !== 0) {
                    fixedEntities.push(entity)
                  }
                } else {
                  freeEntities.push(entity)
                }
              }

              // if all entities can move based on the offset we create only one action. If not (for instance, fixed tiles only can be moved on axis X) we create specific actions for them
              if (freeEntities.length === self.selectedEntities.length) {
                self.executeAction(MoveEntities, {offset: offset, entities: freeEntities})
              } else {
                let fixedOffset = offset.clone()
                fixedOffset.z = 0

                if (fixedEntities.length === self.selectedEntities.length) {
                  self.executeAction(MoveEntities, {offset: fixedOffset, entities: fixedEntities})
                } else {
                  let actions = []

                  if (freeEntities.length > 0) {
                    actions.push(new MoveEntities({offset: offset, entities: freeEntities}, this))
                  }

                  if (fixedEntities.length > 0) {
                    actions.push(new MoveEntities({offset: fixedOffset, entities: fixedEntities}, this))
                  }

                  if (actions.length > 0) {
                    self.executeAction(CombinedActions, {actions: actions})
                  }
                }
              }
            }
          }
          break

          case 'rotate': {
            let offset = self.accumRotation

            if (offset !== 0) {
              let freeEntities = []

              for (let i = 0; i < self.selectedEntities.length; ++i) {
                const entity = self.selectedEntities[i]

                if (!entity.userData.isFixed && !entity.frozen) {
                  // restore entities rotation to apply the rotate action
                  entity.rotate(self.initialTransformValues[i].rotation - entity.angleY)
                  freeEntities.push(entity)
                }
              }

              self.executeAction(RotateEntities, {offset: offset, entities: freeEntities})
            }
          }
          break
        }
      })
    },
    tick: function() {
      const current = Date.now()
      const delta = ((current - this.start) / 1000)

      this.start = current

      if (this.state !== 'idle' && this.state !== 'paused') {
        this.world.tick(delta)
      }

      if ((this.state === 'idle') && this.selectEntities.length > 0) {
        this.colorFadingTimer = (this.colorFadingTimer + delta) % (COLOR_FADING_TIME + COLOR_FADING_TIME)
        const d = Math.abs(this.colorFadingTimer - COLOR_FADING_TIME)

        for (const e of this.selectedEntities) {
          if (e.type !== 'group') {
            e.setFadingIntensity(d)
          }
        }
      }

      if (this.state === 'validating') {
        this.checkSceneValidation()
      }

      this.batchStamper.render()
      this.world.render()

      this.animFrameId = window.requestAnimationFrame(this.tick)
    },
    adjustDummyToSelectedEntities: function() {
      if ((this.selectedEntities.length > 0) && (this.transformControl.object)) {
        let x = 0
        let z = 0

        for (const entity of this.selectedEntities) {
          const entityWorldPosition = entity.getWorldPosition()
          x += entityWorldPosition.x
          z += entityWorldPosition.z
        }

        const entitiesLength = this.selectedEntities.length
        this.dummyObject.position.set(x / entitiesLength, 0, z / entitiesLength)
      }
    },
    selectEntities: function(entities, adding) {
      for (let entity of this.selectedEntities) {
        if (entity.type !== 'group') {
          entity.setFadingIntensity(0)
        }
      }

      if (adding) {
        this.selectedEntities = this.selectedEntities.concat(entities)
      } else {
        this.selectedEntities = _.clone(entities)
      }

      this.$refs.commandPanel.setEntities(this.selectedEntities)

      if (this.selectedEntities.length > 0) {
        for (let entity of this.selectedEntities) {
          entity.originalColor = entity.color
        }

        switch(this.activeTransform) {
          case 'translate': {
            let showZ = false

            for (const entity of this.selectedEntities) {
              if (!entity.userData.isFixed) {
                showZ = true
                break
              }
            }
            this.transformControl.showZ = showZ
          }
          break

          case 'rotate': {
            let rotateDisabled = true

            for (const entity of this.selectedEntities) {
              if (!entity.userData.isFixed) {
                rotateDisabled = false
                break
              }
            }

            this.transformControl.showX = false
            this.transformControl.showY = true
            this.transformControl.showZ = false
            this.transformControl.enabled = !rotateDisabled
          }
          break
        }

        if (this.selectedEntities.length === 1 && this.selectedEntities[0].type === 'ground') {
          this.transformControl.enabled = false
        }

        this.transformControl.attach(this.dummyObject)
        this.adjustDummyToSelectedEntities()
      } else {
        this.transformControl.detach()
      }
    },
    deselectEntities: function(entities) {
      const entitiesId = entities.map(e => e.id)
      this.selectEntities(this.selectedEntities.filter(e => entitiesId.indexOf(e.id) === -1))
    },
    onMouseMove: function(event) {
      this.batchStamper.onMouseMove(event)

      if (this.selectionBox && !this.transformControlEnabled) {
        if (this.selectionBox.leftDirection) {
          this.selectionBox.left = event.clientX
        } else {
          this.selectionBox.right = event.clientX
        }

        if (this.selectionBox.right < this.selectionBox.left) {
          const aux = this.selectionBox.right
          this.selectionBox.right = this.selectionBox.left
          this.selectionBox.left = aux
          this.selectionBox.leftDirection = !this.selectionBox.leftDirection
        }

        if (this.selectionBox.topDirection) {
          this.selectionBox.top = event.clientY
        } else {
          this.selectionBox.bottom = event.clientY
        }

        if (this.selectionBox.bottom < this.selectionBox.top) {
          const aux = this.selectionBox.top
          this.selectionBox.top = this.selectionBox.bottom
          this.selectionBox.bottom = aux
          this.selectionBox.topDirection = !this.selectionBox.topDirection
        }

        this.selectionBox.width = this.selectionBox.right - this.selectionBox.left
        this.selectionBox.height = this.selectionBox.bottom - this.selectionBox.top
      }
    },
    onMouseDown: function(event) {
      switch(event.which) {
        case 1: // left button
          if (this.state === 'idle') {
            this.clickStart = Date.now()
          }

          if (!this.batchStamper.active && !this.transformControlEnabled && this.state === 'idle') {
            this.selectionBox = {
              top: event.clientY,
              left: event.clientX,
              width: 0,
              height: 0
            }
          }
          break

        case 3: // right button
          if (this.batchStamper.active) {
            this.$refs.commandPanel.selectBatchType(null)
          }
          break
      }
    },
    onMouseUp: function(event) {
      if (this.state !== 'idle' || event.which !== 1 || this.ignoreNextMouseUpEvent) {
        return
      }

      const clickDelta = (Date.now() - this.clickStart) // time between mouse down and mouse up in ms

      if (clickDelta <= CLICK_TIME) { // if it is bigger it means the user is rotating the camera or using the transform control
        if (this.batchStamper.active) {
          const batchPosition = this.batchStamper.onMouseUp(event)

          if (batchPosition) {
            this.createBatch(batchPosition.x, batchPosition.z)
            this.batchStamper.reset()
          }
        } else {
          const entity = this.getEntityHit(event.offsetX, event.offsetY)

          if (entity) {
            if (event.ctrlKey) {
              const isSelected = !!this.selectedEntities.find(e => e.id === entity.id)

              if (isSelected) {
                this.onDeselectEntities([entity])
              } else {
                this.onSelectEntities([entity], true)
              }
            } else if (event.shiftKey) {
              // select parent. All entities have a parent (at least the scene group), but we only want to select the parents children of the scene group
              if (entity.parent.parent) {
                this.onSelectEntities([entity.parent])
              } else {
                this.onSelectEntities([entity])
              }
            } else {
              this.onSelectEntities([entity])
            }
          } else {
            this.onSelectEntities([])
          }
        }
      } else if (!this.transformControlEnabled && this.selectionBox) {
        let newSelection = this.getBoxedSelectedEntities(this.world.group)
        this.onSelectEntities(newSelection)
      }

      this.selectionBox = null
    },
    getBoxedSelectedEntities(group) {
      let entities = []
      const sb = this.selectionBox

      for (const e of group.children) {
        if (e.type === 'group') {
          entities = entities.concat(this.getBoxedSelectedEntities(e))
        } else if (e.type !== 'ground') {
          const position = e.getWorldPosition()

          position.project(this.world.camera)
          position.x = (position.x + 1) * this.$refs.scene.clientWidth / 2
          position.y = -(position.y - 1) * (this.$refs.scene.clientHeight / 2) + this.$refs.scene.offsetTop

          if ((position.x >= sb.left) && (position.x <= sb.right) && (position.y >= sb.top) && (position.y <= sb.bottom)) {
            entities.push(e)
          }
        }
      }

      return entities
    },
    prepareGroupToPlay(group) {
      for (const c of group.children) {
        if (c.type === 'group') {
          this.prepareGroupToPlay(c)
        } else{
          if (this.isEntityValidToBePublished(c)) {
            c.addToPhysicalWorld(this.world)
          } else {
            c.setVisible(false)
            c.hiddenByPlay = true
          }
        }
      }
    },
    restoreGroupToEdit(group) {
      for (const c of group.children) {
        if (c.type === 'group') {
          this.restoreGroupToEdit(c)
        } else{
          if (c.hiddenByPlay) {
            c.setVisible(true)
          }
        }
      }
    },
    play: function(fromSelection) {
      if (this.state !== 'idle') {
        return
      }

      if (fromSelection && (this.selectedEntities.length !== 1  || this.selectedEntities[0].type !== 'tile')) {
        return
      }

      const initialTile = fromSelection ? this.selectedEntities[0] : this.world.group.children[SCENE_INITIAL_TILE_IDX]
      this.prePlaySelectedEntities = _.clone(this.selectedEntities)
      this.state = fromSelection ? 'playingFromSelection' : 'playing'
      this.world.group.saveState()
      this.prepareGroupToPlay(this.world.group)
      this.selectEntities([])

      // calculate the impulse vector from the angle of the tile
      const angle = initialTile.getWorldRotationY()
      const impulseValue = INITIAL_IMPULSE_VALUE
      const impulseX = impulseValue * Math.sin(angle)
      const impulseZ = impulseValue * Math.cos(angle)

      _.delay(function() {
        initialTile.body.applyImpulse(new Ammo.btVector3(impulseX, 0, impulseZ))
      }, 200)

      return this.world.group.children[SCENE_LAST_TILE_IDX]
    },
    stop: function() {
      if (this.state === 'idle') {
        return
      }

      this.world.group.removeFromPhysicalWorld(this.world)
      this.restoreGroupToEdit(this.world.group)
      this.world.group.restoreState()
      this.selectEntities(this.prePlaySelectedEntities)
      this.prePlaySelectedEntities = null
      this.state = 'idle'
    },
    togglePause: function() {
      if (this.state === 'paused') {
        this.state = this.stateBeforePause
      } else {
        this.stateBeforePause = this.state
        this.state = 'paused'
      }
    },
    stepForward: function() {
      this.world.tick(0.016)
    },
    executeAction: function(actionClass, options, noRedo) {
      if (this.state !== 'idle') {
        return
      }

      var action = new actionClass(options, this)
      action.do()

      if (!noRedo) {
        // if it's in the middle of the queue, discard from current idx until the end
        if (this.actionsQueue.idx < this.actionsQueue.queue.length) {
          this.actionsQueue.queue.splice(this.actionsQueue.idx, this.actionsQueue.queue.length - this.actionsQueue.idx)
        }

        this.actionsQueue.queue.push(action)
        Vue.set(this.actionsQueue, 'idx', this.actionsQueue.queue.length)
      }
    },
    undoAction: function() {
      if (this.state !== 'idle') {
        return
      }

      if (this.actionsQueue.idx > 0) {
        Vue.set(this.actionsQueue, 'idx', this.actionsQueue.idx - 1)
        const action = this.actionsQueue.queue[this.actionsQueue.idx]

        action.undo()

        this.adjustDummyToSelectedEntities()
        this.$refs.commandPanel.refresh()
      }
    },
    redoAction: function() {
      if (this.state !== 'idle') {
        return
      }

      if (this.actionsQueue.idx < this.actionsQueue.queue.length) {
        const action = this.actionsQueue.queue[this.actionsQueue.idx]

        action.redo()
        this.adjustDummyToSelectedEntities()

        Vue.set(this.actionsQueue, 'idx', this.actionsQueue.idx + 1)
        this.$refs.commandPanel.refresh()
      }
    },
    onSelectEntities: function(entities, adding) {
      this.executeAction(SelectEntities, {entities: entities, adding: adding})
    },
    onDeselectEntities: function(entities) {
      this.executeAction(DeselectEntities, {entities: entities})
    },
    onBatchStamperOn: function(type) {
      Vue.set(this.batchStamper, 'active', true)
      this.batchStamper.setType(type)
      this.batchStamper.reset()
      this.selectEntities([])
    },
    onBatchStamperOff: function() {
      Vue.set(this.batchStamper, 'active', false)
      this.batchStamper.show(false)
    },
    removeSelectedEntities: function() {
      if (this.state === 'idle' && this.selectedEntities.length > 0) {
        let actions = []
        let groups = {}

        for (const entity of this.selectedEntities) {
          if (entity.userData.isFixed || entity.frozen) {
            continue
          }

          let group = this.world.group

          if (entity.parent) {
            group = entity.parent
          }

          if (!(group.id in groups)) {
            groups[group.id] = []
          }

          groups[group.id].push(entity)
        }

        for (const groupId in groups) {
          if (groups[groupId].length > 0) {
            actions.push(new RemoveEntities({group: groups[groupId][0].parent, entities: groups[groupId]}))
          }
        }

        this.executeAction(CombinedActions, {actions: actions})
      }

      new RemoveEntities()
    },
    createBatch: function(x, z) {
      if (this.batchStamper.type === 'image' && !this.batchStamper.parameters.image.data) {
        return
      }

      let group = null

      if (this.batchStamper.type !== 'single' && this.batchStamper.type !== 'ball') {
        let groupName = this.batchStamper.type[0].toUpperCase() + this.batchStamper.type.slice(1)
        group = new Group({
          name: `${groupName}_${this.batchId++}`,
          position: new THREE.Vector3(x, 0, z)
        })
      }

      const newEntities = this.batchStamper.createEntitiesFromStamper(this.world, group)
      this.executeAction(AddEntities, {group: this.world.group, entities: group ? [group] : newEntities})
    },
    selectTransform: function(transform) {
      if (this.state !== 'idle') {
        return
      }

      this.activeTransform = transform

      switch(transform) {
        case 'select':
          this.transformControl.setMode('translate')
          this.transformControl.enabled = false
          this.transformControl.showX = false
          this.transformControl.showY = false
          this.transformControl.showZ = false
          break;

        case 'translate':
          this.transformControl.setMode(transform)
          this.transformControl.enabled = true
          this.transformControl.showX = true
          this.transformControl.showY = false

          if (this.transformControl.object) {
            this.transformControl.showZ = false

            for (const entity of this.selectedEntities) {
              if (!entity.userData.isFixed) {
                this.transformControl.showZ = true
                break
              }
            }
          }
          break

        case 'rotate':
          this.transformControl.setMode(transform)
          this.transformControl.enabled = true
          this.transformControl.showX = false
          this.transformControl.showY = true
          this.transformControl.showZ = false

          if (this.transformControl.object) {
            this.transformControl.enabled = false

            for (const entity of this.selectedEntities) {
              if (!entity.userData.isFixed && entity.type !== 'ball' ) {
                this.transformControl.enabled = true
                break
              }
            }
          }
          break
      }

      if (this.selectedEntities.length === 1 && this.selectedEntities[0].type === 'ground') {
        this.transformControl.enabled = false
      }
    },
    rotateGroupEntities: function(group, rad) {
      let actions = []

      for (const entity of group.children) {
        if (entity.frozen) {
          continue
        }

        const offset = rad - entity.angleY

        if (offset !== 0) {
          actions.push(new RotateEntities({offset: offset, entities: [entity]}))
        }
      }

      if (actions.length > 0) {
        this.executeAction(CombinedActions, {actions: actions})
      }
    },
    rotateSelectedEntities: function(rad) {
      let actions = []

      for (const entity of this.selectedEntities) {
        if (entity.frozen || entity.userData.isFixed) {
          continue
        }

        const offset = rad - entity.angleY

        if (offset !== 0) {
          actions.push(new RotateEntities({offset: offset, entities: [entity]}))
        }
      }

      if (actions.length > 0) {
        this.executeAction(CombinedActions, {actions: actions})
        this.adjustDummyToSelectedEntities()
      }
    },
    moveGroupEntities: function(group, position) {
      let actions = []

      for (const entity of group.children) {
        if (entity.frozen) {
          continue
        }

        let offset = {x: 0, y: 0, z: 0}

        if (position.x) {
          offset.x = position.x - entity.position.x
        }

        if (position.z) {
          offset.z = position.z - entity.position.z
        }

        if (offset.x !== 0 || offset.z !== 0) {
          actions.push(new MoveEntities({offset: offset, entities: [entity]}))
        }
      }

      if (actions.length > 0) {
        this.executeAction(CombinedActions, {actions: actions})
      }
    },
    colorizeGroupEntities: function(group, color) {
      let entities = []

      for (const entity of group.children) {
        if (entity.frozen) {
          continue
        }

        entities.push(entity)
      }

      if (entities.length > 0) {
        this.executeAction(ColorizeEntities, {entities: entities, color: color})
      }
    },
    colorizeSelectedEntities: function(color) {
      let entities = []

      for (const entity of this.selectedEntities) {
        if (entity.frozen) {
          continue
        }

        entities.push(entity)
      }

      if (entities.length > 0) {
        this.executeAction(ColorizeEntities, {entities: entities, color: color})
      }
    },
    moveSelectedEntities: function(position) {
      let actions = []

      for (const entity of this.selectedEntities) {
        if (entity.frozen) {
          continue
        }

        let offset = {x: 0, y: 0, z: 0}

        if (!_.isUndefined(position.x)) {
          offset.x = position.x - entity.position.x
        }

        if (!_.isUndefined(position.z) && !entity.userData.isFixed) {
          offset.z = position.z - entity.position.z
        }

        if (offset.x !== 0 || offset.z !== 0) {
          actions.push(new MoveEntities({offset: offset, entities: [entity]}))
        }
      }

      if (actions.length > 0) {
        this.executeAction(CombinedActions, {actions: actions})
        this.adjustDummyToSelectedEntities()
      }
    },
    openIODialog: function(type, params) {
      if (this.state !== 'idle') {
        return
      }

      this.dialogVisible = 'ioDialog'
      this.$refs.ioDialog.open(type, params)
    },
    openHelpDialog: function() {
      if (this.state !== 'idle') {
        return
      }

      this.dialogVisible = 'helpDialog'
      this.$refs.helpDialog.open()
    },
    closeHelpDialog: function() {
      this.dialogVisible = null
    },
    publishScene: function() {
      if ((this.state !== 'idle') || (this.numValidEntitiesInTheScene > this.maxNumEntitiesInScene)) {
        return
      }

      this.cameraPositionPreValidating = this.world.camera.position.clone()
      this.cameraRotationPreValidating = this.world.camera.rotation.clone()
      this.world.camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z)
      this.world.camera.lookAt(new THREE.Vector3(0, 0, 0))
      this.lastTileValidating = this.play()
      this.state = 'validating'
    },
    saveEntities: function(group) {
      let entities = []

      for (const entity of group.children) {
        const position = entity.getWorldPosition()
        const rotation = entity.angleY

        let info = {
          type: entity.type,
          position: {x: position.x, z: position.z},
          rotation: rotation,
          color: entity.getColor(),
          visible: entity.visible
        }

        if (entity.type === 'group') {
          entities = entities.concat(this.saveEntities(entity))
        } else {
          entities.push(info)
        }
      }

      return entities
    },
    isEntityValidToBePublished: function(entity) {
      // entity should be visible
      if (!entity.visible) {
        return false
      }

      // entity should be inside the squared meter
      const position = entity.getWorldPosition ? entity.getWorldPosition() : entity.position
      return (position.x >= -50 && position.x <= 50 && position.z >= -50 && position.z <= 50)
    },
    checkSceneValidation: function() {
      if ((this.dialogVisible !== 'publishDialog') && this.lastTileValidating.state === 'falling') {
        this.stop()
        this.dialogVisible = 'publishDialog'
        this.$refs.publishDialog.open()
      }
    },
    cancelValidation: function() {
      this.stop()
      this.world.camera.position.copy(this.cameraPositionPreValidating)
      this.world.camera.rotation.copy(this.cameraRotationPreValidating)
    },
    copySceneUrlToClipboard: function() {
      navigator.clipboard.writeText(`https://malandrin.github.io/domino-party/#/view/${this.sceneUuid}`)
    },
    closePublishDialog: function(title, author, token) {
      this.dialogVisible = null
      if (title !== null) {
        let entitiesToPublish = []

        for (let entity of this.saveEntities(this.world.group)) {
          if (this.isEntityValidToBePublished(entity)) {
            delete entity.visible
            entitiesToPublish.push(entity)
          }
        }

        const scene = {
          title: (title || 'New Board').substring(0, MAX_SCENE_TITLE_LENGTH),
          author: (author || 'New Author').substring(0, MAX_SCENE_AUTHOR_LENGTH),
          content: JSON.stringify(entitiesToPublish)
        }

        const self = this

        this.$http.post(`scenes?token=${token}`, scene).then(function(response) {
          self.$refs.ioDialog.close()
          if (response.body.ok) {
            self.sceneUuid = response.body.uuid
            self.openIODialog('message', {type: 'info', message: 'Board published! Use the top right button to share it.'})
          } else {
            self.openIODialog('message', {type: 'error', message: 'Error publishing the board. Probably the server free tier daily quota is over.'})
          }
        }).catch(function() {
          self.openIODialog('message', {type: 'error', message: 'Error publishing the board. Probably the server free tier daily quota is over.'})
        })

        this.openIODialog('message', {type: 'info', noButton: true, message: 'Publishing board...'})
      }
    },
    getNumValidEntitiesInGroup: function(group) {
      let numEntities = 0

      for (const entity of group.children) {
        if (entity.type !== 'group') {
          if (this.isEntityValidToBePublished(entity)) {
            ++numEntities
          }
        } else {
          numEntities += this.getNumValidEntitiesInGroup(entity)
        }
      }

      return numEntities
    },
    getEntityHit: function(mouseX, mouseY) {
      let minDistance = 0
      let info = null

      // normalize coords
      const pos = new THREE.Vector2((mouseX / this.$refs.scene.clientWidth) * 2 - 1, -(mouseY / this.$refs.scene.clientHeight) * 2 + 1)
      this.raycaster.setFromCamera(pos, this.world.camera)
      const intersectInfo = this.raycaster.intersectObject(this.world.imTiles.mesh).concat(this.raycaster.intersectObject(this.world.imBalls.mesh))

      for (const i of intersectInfo) {
        if (i.distance < minDistance || !info) {
          info = i
          minDistance = info.distance
        }
      }

      if (info) {
        return this.world.group.findChildByIMeshEntry(info.object.iMesh.name, info.instanceId)
      }

      return null
    },
    getGroundHitPoint: function(mouseX, mouseY) {
      let minDistance = 0
      let info = null

      // normalize coords
      const pos = new THREE.Vector2((mouseX / this.$refs.scene.clientWidth) * 2 - 1, -(mouseY / this.$refs.scene.clientHeight) * 2 + 1)
      this.raycaster.setFromCamera(pos, this.world.camera)
      const intersectInfo = this.raycaster.intersectObject(this.world.imGrounds.mesh)

      for (const i of intersectInfo) {
        if ((i.distance < minDistance) || !info) {
          info = i
          minDistance = info.distance
        }
      }

      if (info) {
        return info.point
      }

      return null
    },
    rebuildBatchStamper: function(ignoreNextMouseUpEvent) {
      this.batchStamper.rebuild()

      if (ignoreNextMouseUpEvent) {
        this.ignoreNextMouseUpEvent = ignoreNextMouseUpEvent

        const self = this
        _.delay(function() {
          self.ignoreNextMouseUpEvent = false
        }, 200)
      }
    }
  }
}
</script>

<style lang="less">
.editor {
  .selectionBox {
    border: 1px solid #55aaff;
    background-color: rgba(75, 160, 255, 0.3);
    position: fixed;
    pointer-events: none;
  }

  .toolbarButton {
    font-size: 20px;
    color: #D0D0D0;
    cursor: pointer;
    padding: 3px 6px;
    width: 25px;
    height: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 4px;

    &.invisible {
      visibility: hidden;
    }

    &.hidden {
      display: none;
    }

    &:hover {
      &:not(.disabled) {
        background: #383838;
        border: 1px solid #474747;

        &.active {
          background: #496A93;
          border: 1px solid #3E3E3E;
        }
      }
    }

    &.active {
      &:not(.disabled) {
        background: #5F8AC1;
        border: 1px solid #3E3E3E;
      }
    }

    &:active {
      &:not(.disabled) {
        background: #496A93;
        border: 1px solid #3E3E3E;
      }
    }

    &.disabled {
      cursor: default;
    }
  }

  .toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 39px;
    background: #444444;
    border-bottom: 1px solid #6C6C6C;
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .controlsSection {
      display: flex;
      align-items: center;
      margin-left: 40px;
    }

    .entitiesStats {
      color: #D0D0D0;
      position: absolute;
      left: 600px;
    }

    .sceneUuid {
      color: #D0D0D0;
      margin-right: 20px;
      display: flex;
      align-items: center;

      div {
        &:not(:last-child) {
          margin-right: 10px;
        }
      }
    }
  }

  .validatingScene {
    .mask {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
    }

    .messageArea {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 39px;
      background: #444444;
      border-bottom: 1px solid #6C6C6C;
      display: flex;
      justify-content: center;
      align-items: center;

      .message {
        font-size: 24px;
        color: white;
      }

      .toolbarButton {
        width: auto;
        font-size: 14px;
        padding: 2px 10px;
        margin-left: 20px;
      }
    }
  }

  .scene {
    position: fixed;
    top: 40px;
    bottom: 0;
    left: 0;
    right: 300px;

    .stamperMessage {
      position: absolute;
      top: 10px;
      right: 10px;
      color: white;
    }

    &.batchStamperActive {
      cursor: crosshair;
    }
  }

  .panel {
    position: fixed;
    top: 40px;
    bottom: 0;
    right: 0;
    width: 300px;
    display: flex;
  }
}
</style>
