import _ from 'lodash'

class Action {
  constructor(options, editor) {
    this.options = options || {}
    this.editor = editor
  }

  redo() {
    this.do()
  }

  do() {}
  undo() {}
}

export class AddEntities extends Action {
  constructor(options, editor) {
    super(options, editor)
    this.entities = _.clone(this.options.entities)
  }

  do() {
    for (const entity of this.entities) {
      entity.addToRenderWorld()
      this.options.group.addChild(entity)
    }
  }

  undo() {
    for (const entity of this.entities) {
      entity.removeFromRenderWorld()
      this.options.group.removeChild(entity)
    }
  }
}

export class MoveEntities extends Action {
  constructor(options, editor) {
    super(options, editor)

    this.previousPosition = {}
    for (const entity of options.entities) {
      this.previousPosition[entity.id] = entity.position.clone()
    }
  }

  do() {
    for (const entity of this.options.entities) {
      entity.setPosition(entity.position.x + this.options.offset.x, entity.position.y + this.options.offset.y, entity.position.z + this.options.offset.z)
    }
  }

  undo() {
    for (const entity of this.options.entities) {
      const prevPos = this.previousPosition[entity.id]
      entity.setPosition(prevPos.x, prevPos.y, prevPos.z)
    }
  }
}

export class RotateEntities extends Action {
  constructor(options, editor) {
    super(options, editor)

    this.previousRotation = {}
    for (const entity of options.entities) {
      this.previousRotation[entity.id] = entity.angleY
    }
  }

  do() {
    for (const entity of this.options.entities) {
      entity.setRotation(entity.angleY + this.options.offset)
    }
  }

  undo() {
    for (const entity of this.options.entities) {
      entity.setRotation(this.previousRotation[entity.id])
    }
  }
}

export class RemoveEntities extends Action {
  constructor(options, editor) {
    super(options, editor)

    this.entities = _.clone(this.options.entities)
  }

  do() {
    let toRemove = []

    for (const entity of this.entities) {
      entity.removeFromRenderWorld()
      this.options.group.removeChild(entity)
      toRemove.push(entity)
    }

    this.editor.deselectEntities(toRemove)
  }

  undo() {
    let toSelect = []

    for (const entity of this.entities) {
      entity.addToRenderWorld()
      this.options.group.addChild(entity)
      toSelect.push(entity)
    }

    this.editor.selectEntities(toSelect, true)
  }
}

export class SelectEntities extends Action {
  constructor(options, editor) {
    super(options, editor)
    this.entities = _.clone(this.options.entities)
    this.prevSelection = _.clone(this.editor.selectedEntities)
  }

  do() {
    this.editor.selectEntities(this.entities, this.options.adding)
  }

  undo() {
    this.editor.selectEntities(this.prevSelection)
  }
}

export class DeselectEntities extends Action {
  constructor(options, editor) {
    super(options, editor)

    this.entities = _.clone(this.options.entities)
  }

  do() {
    this.editor.deselectEntities(this.entities)
  }

  undo() {
    this.editor.selectEntities(this.entities, true)
  }
}

export class CombinedActions extends Action {
  constructor(options, editor) {
    super(options, editor)

    for (const action of this.options.actions) {
      action.editor = editor
    }
  }

  do() {
    for (const action of this.options.actions) {
      action.do()
    }
  }

  undo() {
    for (const action of this.options.actions) {
      action.undo()
    }
  }
}

export class ColorizeEntities extends Action {
  constructor(options, editor) {
    super(options, editor)

    this.entities = _.clone(this.options.entities)
    this.prevColors = {}
  }

  do() {
    for (const entity of this.entities) {
      if (entity.type !== 'group') {
        this.prevColors[entity.id] = entity.getColor()
        entity.setColor(this.options.color)
      }
    }
  }

  undo() {
    for (const entity of this.entities) {
      if (entity.type !== 'group') {
        entity.setColor(this.prevColors[entity.id])
      }
    }
  }
}