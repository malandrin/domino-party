<template>
  <div class="sceneInspector">
    <div class="filter">
      <input type="text" v-model="filter" placeholder="filter">
      <div
        class="clear"
        v-on:click="filter = ''"
        title="Remove Filter"
      >
        &#x2715;
      </div>
    </div>
    <div class="list">
      <div class="entitiesList">
        <div
          v-for="(info, eindex) in entitiesInfo"
          class="entityItem"
          v-bind:key="info.entity.id"
          v-bind:class="{
            odd: (eindex % 2) !== 0,
            child: info.isChild,
            frozen: info.entity.frozen,
            selected: info.selected
          }"
        >
          <div class="info">
            <div
              class="connection"
              v-bind:class="{
                hasCaret: info.isGroup,
                collapsed: info.isCollapsed
              }"
            >
              <div
                class="caret" v-if="info.isGroup"
                v-on:click="toggleCollapseState(info)"
              >
                <i v-if="info.isCollapsed" class="fas fa-caret-right"></i>
                <i v-else class="fas fa-caret-down"></i>
              </div>
              <div class="verticalLine"/>
              <div class="horizontalLine"/>
            </div>
            <div
              class="visibility"
              v-on:click="toggleVisibility(info.entity.id)"
            >
              <i v-if="info.entity.visible" class="far fa-eye"></i>
              <i v-else class="far fa-eye-slash"></i>
            </div>
            <div
              class="name"
              v-on:click="selectEntity(info.entity, $event)"
            >
              {{info.entity.name}}
            </div>
            <div
              class="frozen"
              v-on:click="toggleFrozenbility(info.entity.id)"
            >
              <i class="far fa-snowflake"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'

export default {
  name: 'SceneInspector',
  props: ['editingGroup', 'selectedEntities'],
  data: function() {
    return {
      groupCollapsed: {},
      filter: ''
    }
  },
  computed: {
    entitiesInfo: function() {
      if (!this.editingGroup) {
        return []
      }

      let entitiesInfo = []
      const filterLowercase = this.filter.toLowerCase()

      for (const entity of this.editingGroup.children) {
        let info = {
          entity: entity,
          selected: !!this.selectedEntities.find(e => e.id === entity.id)
        }

        if (filterLowercase) {
          const entityNameLowercase = entity.name.toLowerCase()

          if (entity.type === 'group') {
            info.isGroup = true
            info.isCollapsed = this.groupCollapsed[entity.id]
            const groupIdx = entitiesInfo.length

            for (const child of entity.children) {
              if (child.name.toLowerCase().indexOf(filterLowercase) !== -1) {
                entitiesInfo.push({
                  entity: child,
                  isChild: true,
                  selected: !!this.selectedEntities.find(e => e.id === child.id)
                })
              }
            }

            if (groupIdx !== entitiesInfo.length) {
              // there are children that pass the filter. Add the group no matter if it passes the filter and open it
              if (info.isCollapsed) {
                info.isCollapsed = false
              }
              entitiesInfo.splice(groupIdx, 0, info)
            } else if (entityNameLowercase.indexOf(filterLowercase) !== -1) {
              info.isGroup = false
              entitiesInfo.push(info)
            }
          } else if (entityNameLowercase.indexOf(filterLowercase) !== -1) {
            entitiesInfo.push(info)
          }
        } else {
          if (entity.type === 'group') {
            const isCollapsed = _.isUndefined(this.groupCollapsed[entity.id]) ? true : this.groupCollapsed[entity.id]

            entitiesInfo.push({
              isCollapsed: isCollapsed,
              isGroup: true,
              selected: info.selected,
              entity: info.entity
            })

            if (!isCollapsed) {
              for (const child of entity.children) {
                entitiesInfo.push({
                  entity: child,
                  isChild: true,
                  selected: !!this.selectedEntities.find(e => e.id === child.id)
                })
              }
            }
          } else {
            entitiesInfo.push(info)
          }
        }
      }

      return entitiesInfo
    }
  },
  methods: {
    selectEntity: function(entity, event) {
      if (event.ctrlKey) {
        // toggle entity selection
        const isSelected = !!this.selectedEntities.find(e => e.id === entity.id)

        if (isSelected) {
          this.$emit('deselect-entities', [entity])
        } else {
          this.$emit('select-entities', [entity], true)
        }
      } else if (event.shiftKey) {
        let selection = [entity]

        // select all the entities from the last select entity to the current one
        if (this.selectedEntities.length > 0) {
          const fromEntity = this.selectedEntities[this.selectedEntities.length - 1]
          let fromIdx = -1
          let toIdx = -1

          for (let i = 0; i < this.entitiesInfo.length; ++i ) {
            const entityInfo = this.entitiesInfo[i]

            if (entityInfo.entity.id === fromEntity.id) {
              fromIdx = i
            }

            if (entityInfo.entity.id === entity.id) {
              toIdx = i
            }

            if (fromIdx !== -1 && toIdx !== -1) {
              break
            }
          }

          if (fromIdx !== -1 && toIdx !== -1) {
            selection = []

            if (toIdx < fromIdx) {
              const aux = fromIdx
              fromIdx = toIdx
              toIdx = aux
            }

            for (let i = fromIdx; i <= toIdx; ++i) {
              selection.push(this.entitiesInfo[i].entity)
            }
          }
        }

        this.$emit('select-entities', selection)
      } else {
        this.$emit('select-entities', [entity])
      }
    },
    toggleCollapseState: function(entityInfo) {
      if (_.isUndefined(this.groupCollapsed[entityInfo.entity.id])) {
        Vue.set(this.groupCollapsed, entityInfo.entity.id, false)
      } else {
        Vue.set(this.groupCollapsed, entityInfo.entity.id, !this.groupCollapsed[entityInfo.entity.id])
      }
    },
    toggleVisibility: function(entityId) {
      const entity = this.editingGroup.findChildById(entityId)
      if (entity) {
        entity.setVisible(!entity.visible)
      }
    },
    toggleFrozenbility: function(entityId) {
      const entity = this.editingGroup.findChildById(entityId)
      if (entity) {
        entity.setFrozen(!entity.frozen)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.sceneInspector {
  background: #444444;
  margin-top: 5px;

  .filter {
    height: 30px;
    display: flex;
    align-items: center;
    padding-left: 5px;
    margin-bottom: 2px;

    .clear {
      padding-left: 5px;
      padding-right: 5px;
      margin-left: 1px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      height: 24px;
      display: flex;
      align-items: center;

      &:hover {
        background: #383838;
      }

      &:active {
        background: #5F8AC1;
      }
    }

    input {
      flex-grow: 1;
      color: white;
      height: 20px;
      background: #444444;
      border: 1px solid #646464;
      outline: none;
      padding-left: 2px;
      padding-right: 2px;
    }
  }

  .list {
    .entitiesList {
      height: 350px;
      overflow: auto;

      .entityItem {
        &.odd {
          .info {
            .name,
            .frozen {
              background: #5A5A5A;
            }
          }
        }

        &.frozen {
          .info {
            .frozen {
              color: #D0D0D0;
            }
          }
        }

        &.selected {
          .info {
            .name,
            .frozen {
              background: #5F8AC1;
            }
          }
        }

        &:first-child {
          .info {
            .connection {
              .verticalLine {
                top: 11px;
              }
            }
          }
        }

        &:last-child {
          .info {
            .connection {
              .verticalLine {
                height: 11px;
              }
            }
          }
        }

        &.child {
          margin-left: 14px;

          .info {
            .name {
              width: 157px;
            }
          }

          &.odd {
            .info {
              .name,
              .frozen {
                background: #5A5A5A;
              }
            }
          }

          &:not(.odd) {
            .info {
              .name,
              .frozen {
                background: #4F4F4F;
              }
            }
          }

          &.selected {
            .info {
              .name,
              .frozen {
                background: #5F8AC1;
              }
            }
          }
        }

        .info {
          display: flex;
          height: 25px;
          background: #444444;
          align-items: center;
          cursor: pointer;

          .connection {
            width: 16px;
            height: 25px;
            position: relative;
            overflow: hidden;

            &.hasCaret {
              &:not(.collapsed) {
                .verticalLine {
                  height: 11px;
                }
              }
            }

            .horizontalLine {
              position: absolute;
              top: 11px;
              left: 7px;
              width: 7px;
              height: 1px;
              border-top: 1px solid #5B5B5B;
              border-top-style: dotted;
            }

            .verticalLine {
              position: relative;
              top: 0;
              left: 7px;
              width: 1px;
              height: 25px;
              border-left: 1px solid #5B5B5B;
              border-left-style: dotted;
            }

            .caret {
              position: absolute;
              top: 3px;
              left: 2px;
              z-index: 1;
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
          }

          .visibility {
            color: #D0D0D0;
            font-size: 12px;
            cursor: pointer;

            i {
              width: 15px;
            }
          }

          .name {
            margin-left: 4px;
            padding-left: 4px;
            padding-right: 4px;
            height: 25px;
            text-align: left;
            line-height: 25px;
            background: #4F4F4F;
            border-left: 1px solid #5B5B5B;
            border-right: 1px solid #5B5B5B;
            color: white;
            font-size: 14px;
            cursor: pointer;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 171px;
          }

          .frozen {
            display: flex;
            justify-content: center;
            align-items: center;
            color: #313131;
            background: #4F4F4F;
            font-size: 14px;
            cursor: pointer;
            height: 25px;
            width: 30px;
          }
        }
      }
    }
  }
}
</style>
