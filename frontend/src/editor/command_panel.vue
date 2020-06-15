<template>
  <div class="commandPanel">
    <input type="file" class="fileSelector" ref="fileSelector" v-on:change="loadFile">
    <div class="panelContent">
      <div
        class="container"
        v-bind:class="{collapsed: containerCollapsed.sceneInspector}"
        v-bind:style="{'margin-bottom': '5px'}"
      >
        <div class="header">
          <div
            class="caret"
            v-on:click="toggleCollapseState('sceneInspector')"
          >
            <i v-if="containerCollapsed.sceneInspector" class="fas fa-caret-right"></i>
            <i v-else class="fas fa-caret-down"></i>
          </div>
          <div class="title">Board Inspector</div>
        </div>
        <div class="content">
          <SceneInspector
            ref="sceneInspector"
            v-bind:editingGroup="editingGroup"
            v-bind:selectedEntities="selectedEntities"
            v-on:select-entities="selectEntities"
            v-on:deselect-entities="deselectEntities"
          />
        </div>
      </div>
      <div
        class="container"
        v-bind:class="{collapsed: containerCollapsed.createBatch}"
      >
        <div class="header">
          <div
            class="caret"
            v-on:click="toggleCollapseState('createBatch')"
          >
            <i v-if="containerCollapsed.createBatch" class="fas fa-caret-right"></i>
            <i v-else class="fas fa-caret-down"></i>
          </div>
          <div class="title">Create Batch</div>
        </div>
        <div class="content grid">
          <div
            class="toggleButton"
            v-for="type in batchTypes"
            v-bind:key="type.id"
            v-bind:class="{active: activeBatchType === type.id, disabled: type.disabled}"
            v-on:click="selectBatchType(type.id)"
          >
            {{type.name}}
          </div>
        </div>
      </div>
      <div
        class="container"
        v-bind:class="{collapsed: containerCollapsed.stamperParameters}"
        v-if="activeBatchType !== null"
      >
        <div class="header">
          <div
            class="caret"
            v-on:click="toggleCollapseState('stamperParameters')"
          >
            <i v-if="containerCollapsed.stamperParameters" class="fas fa-caret-right"></i>
            <i v-else class="fas fa-caret-down"></i>
          </div>
          <div class="title">Batch Stamper Parameters</div>
        </div>
        <div class="content">
          <div
            class="row"
            v-for="(parameter, pindex) in activeBatchStamperParametersList"
            v-bind:key="`stamper_parameter_${pindex}`"
          >
            <div class="label">{{parameter.label}}:</div>
            <div
              v-if="parameter.inputType === 'image'"
              class="value image"
              v-bind:title="activeBatchStamperParameters[parameter.field]"
              v-on:click="onBatchStamperParameterClick(parameter)"
            >
              <img
                v-if="activeBatchStamperParameters.rawData"
                ref="image"
                v-bind:src="activeBatchStamperParameters.rawData"
              />
            </div>
            <input
              v-else
              class="value"
              v-bind:class="{
                textInput: parameter.inputType === 'number' || parameter.inputType === 'text',
                checkboxInput: parameter.inputType === 'checkbox',
                disabled: parameter.isEnabled && !parameter.isEnabled()
              }"
              v-bind:type="parameter.inputType"
              v-bind:readonly="parameter.isEnabled && !parameter.isEnabled()"
              v-model="activeBatchStamperParameters[parameter.field]"
              v-on:change="updateBatchStamperParameter(parameter, $event)"
            >
          </div>
        </div>
      </div>
      <div
        class="container"
        v-if="entity !== null || entities.length > 0"
        v-bind:class="{collapsed: containerCollapsed.entityParameters}"
      >
        <div class="header">
          <div
            class="caret"
            v-on:click="toggleCollapseState('entityParameters')"
          >
            <i v-if="containerCollapsed.entityParameters" class="fas fa-caret-right"></i>
            <i v-else class="fas fa-caret-down"></i>
          </div>
          <div class="title">{{entity !== null ? 'Parameters' : 'Multi Parameters'}}</div>
        </div>
        <div class="content">
          <div class="row"
            v-for="(parameter, pindex) in entityParametersList"
            v-bind:key="`entity_parameter_${pindex}`"
          >
            <div class="label">{{parameter.label}}:</div>
            <input
              class="value"
              v-bind:placeholder="parameter.placeholder"
              v-bind:class="{textInput: parameter.inputType === 'number' || parameter.inputType === 'text'}"
              v-bind:type="parameter.inputType"
              v-model="entityParameters[parameter.field]"
              v-on:change="updateEntityParameter(parameter, $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import * as THREE from 'three'
import SceneInspector from './scene_inspector'

export default {
  name: 'commandPanel',
  props: ['batchStamperParameters', 'editingGroup', 'selectedEntities'],
  components: {
    SceneInspector
  },
  data: function() {
    return {
      entity: null,
      entities: [],
      entityParameters: null,
      entityParametersList: [],
      activeBatchType: null,
      activeBatchStamperParameters: {},
      activeBatchStamperParametersList: [],
      containerCollapsed: {
        sceneInspector: true
      },
      batchTypes: [{
        id: 'free',
        name: 'Free'
      }, {
        id: 'single',
        name: 'Single'
      }, {
        id: 'line',
        name: 'Line'
      }, {
        id: 'rectangle',
        name: 'Rectangle'
      }, {
        id: 'triangle',
        name: 'Triangle'
      }, {
        id: 'image',
        name: 'Image'
      }, {
        id: 'ball',
        name: 'Ball'
      }, {
        id: 'spiral',
        name: 'Spiral',
        disabled: true
      }]
    }
  },
  methods: {
    refresh: function() {
      if (this.entity) {
        const posXRounded = Math.round(this.entity.position.x)
        const posZRounded = Math.round(this.entity.position.z)

        this.entityParameters = {
          name: this.entity.name,
          rotation: Math.round(THREE.MathUtils.radToDeg(this.entity.getRotationY()) % 360),
          positionX: (posXRounded === this.entity.position.x) ? posXRounded : this.entity.position.x.toFixed(2),
          positionZ: (posZRounded === this.entity.position.z) ? posZRounded : this.entity.position.z.toFixed(2),
          color: this.entity.getColor()
        }

        if (this.entity.type === 'group') {
          this.entityParameters.childrenPosX = ''
          this.entityParameters.childrenPosZ = ''
          this.entityParameters.childrenRot = ''
          this.entityParameters.childrenColor = '#ffffff'
        }
      } else if (this.entities) {
        this.entityParameters = {
          rotation: '',
          positionX: '',
          positionY: '',
          color: '#ffffff'
        }
      }
    },
    setEntities: function(entities) {
      this.entity = null
      this.entities = []

      if (entities.length === 0) {
        return
      }

      if (entities.length === 1) {
        this.entity = entities[0]
        this.entityParametersList = []

        if (this.entity) {
          this.entityParametersList = [{
            field: 'name',
            label: 'Name',
            inputType: 'text'
          }]

          if (this.entity.type === 'ground') {
            this.entityParametersList.push({
              field: 'color',
              label: 'Color',
              inputType: 'color'
            })
          }
          else if (this.entity.type === 'group') {
            this.entityParametersList.push({
              field: 'positionX',
              label: 'X',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'positionZ',
              label: 'Z',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'rotation',
              label: 'Rotation',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'childrenPosX',
              label: 'Children Position X',
              placeholder: 'Set Position X',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'childrenPosZ',
              label: 'Children Position Z',
              placeholder: 'Set Position Z',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'childrenRot',
              label: 'Children Rotation',
              placeholder: 'Set Rotation',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'childrenColor',
              label: 'Children Color',
              inputType: 'color'
            })
          } else if (this.entity.type === 'ball') {
            this.entityParametersList.push({
              field: 'positionX',
              label: 'X',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'positionZ',
              label: 'Z',
              inputType: 'number'
            })

            this.entityParametersList.push({
              field: 'color',
              label: 'Color',
              inputType: 'color'
            })
          } else {
            this.entityParametersList.push({
              field: 'positionX',
              label: 'X',
              inputType: 'number'
            })

            if (!this.entity.userData.isFixed) {
              this.entityParametersList.push({
                field: 'positionZ',
                label: 'Z',
                inputType: 'number'
              })

              this.entityParametersList.push({
                field: 'rotation',
                label: 'Rotation',
                inputType: 'number'
              })
            }
            this.entityParametersList.push({
              field: 'color',
              label: 'Color',
              inputType: 'color'
            })
          }
        }
      } else {
        this.entities = entities
        this.entityParametersList = [{
          field: 'positionX',
          label: 'X',
          inputType: 'number',
          placeholder: 'Set Position X'
        }, {
          field: 'positionZ',
          label: 'Z',
          inputType: 'number',
          placeholder: 'Set Position Z'
        }, {
          field: 'rotation',
          label: 'Rotation',
          inputType: 'number',
          placeholder: 'Set Rotation'
        }, {
          field: 'color',
          label: 'Color',
          inputType: 'color'
        }]
      }

      this.refresh()
    },
    selectEntities: function(entities, adding) {
      this.$emit('select-entities', entities, adding)
    },
    deselectEntities: function(entities) {
      this.$emit('deselect-entities', entities)
    },
    selectBatchType: function(type) {
      this.activeBatchType = type
      this.activeBatchStamperParametersList = []

      const self = this

      if (type) {
        this.activeBatchStamperParameters = this.batchStamperParameters[type]

        switch(type) {
          case 'single':
            this.activeBatchStamperParametersList = [{
              field: 'rotation',
              label: 'Rotation',
              inputType: 'number'
            }]
          break

          case 'line':
            this.activeBatchStamperParametersList = [{
              field: 'forwardOffset',
              label: 'Forward Offset',
              inputType: 'number'
            }, {
              field: 'fixedRotation',
              label: 'Fixed Rotation',
              inputType: 'checkbox'
            }, {
              field: 'rotation',
              label: 'Children Rotation',
              inputType: 'number',
              isEnabled: function() {
                return self.activeBatchStamperParameters.fixedRotation
              }
            }]
            break

          case 'free':
            this.activeBatchStamperParametersList = [{
              field: 'forwardOffset',
              label: 'Forward Offset',
              inputType: 'number'
            }, {
              field: 'fixedRotation',
              label: 'Fixed Rotation',
              inputType: 'checkbox'
            }, {
              field: 'rotation',
              label: 'Rotation',
              inputType: 'number',
              isEnabled: function() {
                return self.activeBatchStamperParameters.fixedRotation
              }
            }]
            break

          case 'triangle':
            this.activeBatchStamperParametersList = [{
              field: 'forwardOffset',
              label: 'Forward Offset',
              inputType: 'number'
            }, {
              field: 'rightOffset',
              label: 'Right Offset',
              inputType: 'number'
            }, {
              field: 'fixedRotation',
              label: 'Fixed Rotation',
              inputType: 'checkbox'
            }, {
              field: 'rotation',
              label: 'Children Rotation',
              inputType: 'number',
              isEnabled: function() {
                return self.activeBatchStamperParameters.fixedRotation
              }
            }]
            break

          case 'rectangle':
            this.activeBatchStamperParametersList = [{
              field: 'forwardOffset',
              label: 'Forward Offset',
              inputType: 'number'
            }, {
              field: 'rightOffset',
              label: 'Right Offset',
              inputType: 'number'
            }, {
              field: 'rotation',
              label: 'Children Rotation',
              inputType: 'number'
            }]
            break

          case 'image':
            this.activeBatchStamperParametersList = [{
              field: 'filename',
              label: 'Image',
              inputType: 'image'
            }, {
              field: 'forwardOffset',
              label: 'Forward Offset',
              inputType: 'number'
            }, {
              field: 'rightOffset',
              label: 'Right Offset',
              inputType: 'number'
            }, {
              field: 'rotation',
              label: 'Children Rotation',
              inputType: 'number'
            }, {
              field: 'horSize',
              label: 'Horizontal Size',
              inputType: 'number'
            }, {
              field: 'verSize',
              label: 'Vertical Size',
              inputType: 'number'
            }]
            break
        }

        if (type !== 'image') {
          this.activeBatchStamperParametersList.push({
            field: 'color',
            label: (type !== 'single' && type !== 'ball') ? 'Children Color' : 'Color',
            inputType: 'color'
          })
        }

        this.$emit('batch-stamper-on', type)
      } else {
        this.activeBatchStamperParametersList = []
        this.activeBatchStamperParameters = {}
        this.$emit('batch-stamper-off')
      }
    },
    updateEntityParameter: function(parameter, event) {
      let value = event.target.value

      switch(parameter.field) {
        case 'name':
          if (value) {
            this.entity.name = value
          } else {
            event.target.value = this.entity.name
          }
          break

        case 'rotation':
          if (value !== '') {
            this.$emit('rotate-selected-entities', THREE.MathUtils.degToRad(parseFloat(value)))
          } else {
            event.target.value = Math.round(THREE.MathUtils.radToDeg(this.entity.getRotationY()) % 360)
          }
          break

        case 'positionX':
          if (value !== '') {
            this.$emit('move-selected-entities', {x: parseFloat(value)})
          } else {
            event.target.value = this.entity.position.x
          }
          break

        case 'positionZ':
          if (value !== '') {
            this.$emit('move-selected-entities', {z: parseFloat(value)})
          } else {
            event.target.value = this.entity.position.z
          }
          break

        case 'color':
          this.$emit('colorize-selected-entities', value)
          break

        case 'childrenPosX':
          if (value !== '') {
            this.$emit('move-group-entities', this.entity, {x: parseFloat(value)})
          }
          event.target.value = ''
          break

        case 'childrenPosZ':
          if (value !== '') {
            this.$emit('move-group-entities', this.entity, {z: parseFloat(value)})
          }
          event.target.value = ''
          break

        case 'childrenRot':
          if (value !== '') {
            this.$emit('rotate-group-entities', this.entity, THREE.MathUtils.degToRad(parseFloat(value)))
          }
          event.target.value = ''
          break

        case 'childrenColor':
          if (value !== '') {
            this.$emit('colorize-group-entities', this.entity, value)
          }
          event.target.value = ''
          break
      }

      if (this.entities.length > 0) {
        event.target.value = ''
      }
    },
    color2Hex: function(components) {
      let values = []

      for (const c of components) {
        let h = c.toString(16)
        if (h.length === 1) {
          h = '0' + h
        }
        values.push(h)
      }

      return `#${values[0]}${values[1]}${values[2]}`
    },
    loadFile: function(ev) {
      const file = ev.target.files[0]
      const reader = new FileReader()
      const self = this

      reader.onload = function() {
        self.activeBatchStamperParameters.filename = file.name
        self.activeBatchStamperParameters.rawData = reader.result

        // get image pixels
        _.delay(function() {
          const image = self.$refs.image[0]
          let canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height)

          let data = []
          let idata = canvas.getContext('2d').getImageData(0, 0, image.width, image.height).data
          for (let i = 0; i < idata.length; i += 4) {
            data.push(self.color2Hex([idata[i], idata[i + 1], idata[i + 2]]))
          }

          self.activeBatchStamperParameters.width = image.width
          self.activeBatchStamperParameters.height = image.height
          self.activeBatchStamperParameters.data = data

          self.$emit('rebuild-batch-stamper')
        }, 100)
      }

      reader.readAsDataURL(file)
    },
    onBatchStamperParameterClick: function(parameter) {
      if (parameter.field === 'filename') {
        this.$refs.fileSelector.click()
      }
    },
    updateBatchStamperParameter: function(parameter, event) {
      if (parameter.inputType === 'number') {
        this.activeBatchStamperParameters[parameter.field] = parseFloat(event.target.value)

        if (parameter.field === 'horSize' || parameter.field === 'verSize') {
          this.activeBatchStamperParameters[parameter.field] = Math.min(Math.max(this.activeBatchStamperParameters[parameter.field], 1), 30)
        } else if (parameter.field === 'rotation') {
          this.activeBatchStamperParameters[parameter.field] = this.activeBatchStamperParameters[parameter.field]
        }
      }

      this.$emit('rebuild-batch-stamper', parameter.inputType === 'color')
    },
    toggleCollapseState: function(container) {
      Vue.set(this.containerCollapsed, container, !this.containerCollapsed[container])
    }
  }
}
</script>

<style lang="less" scoped>
// command panel style "inspired" by 3DSMax
.commandPanel {
  padding: 10px;
  background: #444444;
  height: 100%;
  overflow: auto;

  .fileSelector {
    display: none;
  }

  .panelContent {
    border: 1px solid #383838;
    margin-top: -1px;
    padding: 10px 5px;

    .container {
      border: 1px solid #3E3E3E;
      border-radius: 2px;
      background: #515151;
      padding: 5px;

      &:not(:first-child) {
        margin-top: 5px;
      }

      &.collapsed {
        .content {
          height: 0px;
          overflow: hidden;
          padding: 0;
        }
      }

      .header {
        display: flex;
        align-items: center;
        height: 18px;

        .caret {
          color: #B9B9B9;
          cursor: pointer;
          width: 8px;

          &:hover {
            color: white;
          }

          i.fa-caret-right {
            margin-left: 4px;
          }
        }

        .title {
          color: white;
          font-size: 14px;
          text-align: left;
          margin-left: 8px;
        }
      }

      .content {
        padding: 0 5px;

        &.grid {
          display: flex;
          flex-wrap: wrap;
          margin-right: -10px;
        }

        .row {
          display: flex;
          align-items: center;
          margin-top: 10px;
          font-size: 14px;

          .label {
            width: 50%;
            text-align: right;
            color: white;
            font-size: 13px;
          }

          .value {
            width: 50%;
            margin-left: 10px;
            color: #DCDCDC;

            &.image {
              background: white;
              width: 150px;
              height: 150px;
              border: 1px solid #4A4A4A;
              cursor: pointer;

              img {
                width: 150px;
                height: 150px;
                object-fit: contain;
              }
            }

            &.textInput {
              background: #646464;
              border: 1px solid #4A4A4A;
              padding-left: 5px;
              height: 18px;

              &:not(.disabled) {
                &:focus {
                  outline: 1px solid #4A4A4A;
                  border: 1px solid #D0D0D0;
                }
              }

              &.disabled {
                outline: none;
                background: #595959;
                border: 1px solid #4A4A4A;
                color: #8F8F8F;
              }
            }

            &.checkboxInput {
              appearance: none;
              background: #646464;
              border: 1px solid #4A4A4A;
              width: 18px;
              height: 18px;
              cursor: pointer;
              outline: none;
              margin-left: 2px;

              &:hover {
                border: 1px solid #555555;
                background: #383838;
              }

              &:checked {
                background: #646464;

                &:hover {
                  border: 1px solid #555555;
                  background: #383838;
                }

                &:after {
                  content: '\2714';
                  font-size: 12px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  color: #DCDCDC;
                }
              }
            }
          }
        }

        .toggleButton {
          padding: 5px 10px;
          margin-top: 10px;
          flex-grow: 1;
          flex-basis: 30%;
          margin-right: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 4px;
          border: 1px solid #4A4A4A;
          background: #646464;
          color: #DCDCDC;
          cursor: pointer;

          &:hover {
            border: 1px solid #555555;
            background: #383838;

            &.active {
              background: #496A93;
            }
          }

          &.active {
            background: #5F8AC1;
          }

          &.disabled {
            visibility: hidden;
          }
        }
      }
    }
  }
}
</style>
