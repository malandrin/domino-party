import _ from 'lodash'

const KEYS_MAPPING = [
  {keyCode: 'KeyZ',   ctrlPressed: true,  shiftPressed: false, method: 'undoAction'},
  {keyCode: 'KeyZ',   ctrlPressed: true,  shiftPressed: true,  method: 'redoAction'},
  {keyCode: 'KeyY',   ctrlPressed: true,  shiftPressed: false, method: 'redoAction'},
  //{keyCode: 'KeyS',   ctrlPressed: true,  shiftPressed: false, method: 'saveScene' },
  {keyCode: 'KeyQ',   ctrlPressed: false, shiftPressed: false, method: function(context) {context.selectTransform('select')}},
  {keyCode: 'KeyW',   ctrlPressed: false, shiftPressed: false, method: function(context) {context.selectTransform('translate')}},
  {keyCode: 'KeyE',   ctrlPressed: false, shiftPressed: false, method: function(context) {context.selectTransform('rotate')}},
  {keyCode: 'Delete', ctrlPressed: false, shiftPressed: false, method: 'removeSelectedEntities'},
  {keyCode: 'Space',  ctrlPressed: false, shiftPressed: false, method: function(context) {
    if (context.state === 'idle') {
      context.play()
    } else if (context.state === 'playing' || context.state === 'playingFromSelection' || context.state === 'paused') {
      context.stop()
    }
  }},
  {keyCode: 'Space',  ctrlPressed: true,  shiftPressed: false, method: function(context) {
    if (context.state === 'idle') {
      if ((context.selectEntities.length === 1) && (context.selectEntities[0].type === 'tile')) {
        context.play(true)
      }
    } else if (context.state === 'playing' || context.state === 'playingFromSelection' || context.state === 'paused') {
      context.stop()
    }
  }}
]

export default class {
  constructor(editor) {
    this.editor = editor
    this.keysDown = {}

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  onDestroyed() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  onKeyDown(event) {
    if (!this.keysDown[event.key]) {
      // ignore keydown if there is a input field active or a modal opened
      if (this.editor.dialogVisible === null && (!document.activeElement || document.activeElement.tagName.toLowerCase() !== 'input')) {
        for (const km of KEYS_MAPPING) {
          if ((event.code === km.keyCode) && (event.ctrlKey === km.ctrlPressed) && (event.shiftKey === km.shiftPressed)) {
            if (_.isFunction(km.method)) {
              km.method(this.editor)
            } else {
              this.editor[km.method]()
            }
          }
        }
        this.keysDown[event.key] = true
      }
    }
  }

  onKeyUp(event) {
    this.keysDown[event.key] = false
  }

  isKeyPressed(key) {
    return this.keysDown[key]
  }
}
