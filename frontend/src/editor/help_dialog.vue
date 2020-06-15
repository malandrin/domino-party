<template>
  <div class="mask"
    v-on:click.stop=""
  >
    <div
      class="helpDialog"
    >
      <div class="closeButton" v-on:click="close">&#128473;</div>
      <div class="step">
        <div v-if="activeStep === 1" class="step1">
          <img class="animation" src="@/assets/viewer.gif">
          <div class="title">Domino Party</div>
          <div class="description">Use the tools in the editor to populate your one square meter board with domino tiles and balls, make it as good as you can and share it with the world!</div>
        </div>
        <div v-else-if="activeStep === 2" class="step2">
          <div class="title">Interface</div>
          <div class="content">
            <div>CAMERA</div>
            <ul>
              <li>Mouse right button: Pan.</li>
              <li>Mouse middle button: Zoom.</li>
              <li>Ctrl + mouse right button: Rotate.</li>
            </ul>
            <div>STAMPER MODE</div>
            <ul>
              <li>Single, Ball, Image: Left click on the board to put the element in the selected position.</li>
              <li>Free, Line, Rectangle, Triangle: Left click on the board to select the starting position. Move the mouse and click again to select the ending position.
              <li>Right click to exit the stamper mode.</li>
            </ul>
            <div>SELECTION</div>
            <ul>
              <li>Elements can't be selected in stamper mode.</li>
              <li>Left click on an element (tile or ball) to select it.</li>
              <li>Ctrl + left click on an element to add it to the current selection.</li>
              <li>Shift + left click on an element to select its parent.</li>
              <li>Left button down and drag mouse = multi selection.</li>
              <li>Selected elements will be show with a fading color animation.</li>
            </ul>
            <div>BOARD INSPECTOR</div>
            <ul>
              <li>Left click to select.</li>
              <li>Ctrl + left click to add element to selection.</li>
              <li>Shift + left click to selection by range.</li>
              <li>Click the eye icon to hide/display the element.</li>
              <li>Click the snowflake icon to frozen/unfrozen the element. This means it can be moved/rotated.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="controls">
        <div class="leftArrow" v-on:click="incStep(-1)"/>
        <div v-for="i in numSteps" v-bind:key="i" class="step" v-bind:class="{active: activeStep === i}" v-on:click="setStep(i)"/>
        <div class="rightArrow" v-on:click="incStep(1)"/>
      </div>
      <div class="checkboxContainer">
        <input type="checkbox" v-model="showDialogAtStartup" v-on:change="updateShowDialogAtStartup" class="checkboxInput"/>
        <div>Show this Welcome Screen at startup</div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'HelpDialog',
  data: function() {
    return {
      activeStep: 2,
      numSteps: 2,
      showDialogAtStartup: false,
    }
  },
  methods: {
    open: function() {
      this.activeStep = 1
      const showDialog = window.localStorage.getItem('showDialogAtStartup')

      if (!showDialog  || showDialog === 'true') {
        this.showDialogAtStartup = true
      }
    },
    close: function() {
      this.$emit('close')
    },
    updateShowDialogAtStartup: function(event) {
      this.showDialogAtStartup = event.target.checked
      window.localStorage.setItem('showDialogAtStartup', this.showDialogAtStartup)
    },
    incStep: function(inc) {
      this.setStep(this.activeStep + inc)
    },
    setStep: function(step) {
      this.activeStep = step

      if (this.activeStep > this.numSteps) {
        this.activeStep = 1
      } else if (this.activeStep < 1) {
        this.activeStep = this.numSteps
      }
    }
  }
}
</script>

<style lang="less">
.mask {
  z-index: 2;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .helpDialog {
    width: 940px;
    background: #444444;
    border: 1px solid #2B2B2B;
    display: flex;
    flex-direction: column;

    .closeButton {
      background: #646464;
      border: 1px solid #3E3E3E;
      color: #CACACA;
      width: 20px;
      height: 18px;
      padding-bottom: 3px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      margin: 8px 8px 0px auto;

      &:hover {
        background: #3E3E3E;
      }
    }

    .checkboxContainer {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      font-size: 12px;
      color: white;
      margin: 10px;

      .checkboxInput {
        appearance: none;
        background: #646464;
        border: 1px solid #4A4A4A;
        width: 12px;
        height: 12px;
        cursor: pointer;
        outline: none;
        margin-right: 5px;

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
            font-size: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #DCDCDC;
          }
        }
      }

    }

    .step {
      height: 470px;
      padding: 10px 40px;

      .title {
        color: #45B1B1;
        font-size: 32px;
      }

      .content {
        margin-top: 10px;
        color: #B9B9B9;
        text-align: left;
        max-height: 430px;
        overflow: auto;
      }
    }

    .step1 {
      position: relative;
      height: 100%;

      .title {
        position: absolute;
        bottom: 80px;
        left: 50px;
        color: white;
        font-size: 38px;
        text-transform: uppercase;
        letter-spacing: 4px;
        background: rgba(0, 0, 0, 0.5);
      }

      .description {
        position: absolute;
        bottom: 26px;
        left: 50px;
        font-size: 22px;
        color: #B9B9B9;
        text-align: left;
        background: rgba(0, 0, 0, 0.5);
      }

      .animation {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 10px;

      div {
        width: 18px;
        height: 18px;
        cursor: pointer;
        background: #6E6E6E;
        padding: 0;
      }

      .leftArrow {
        margin-right: 8px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 9px 15.6px 9px 0;
        background: transparent;
        border-color: transparent #6E6E6E transparent transparent;

        &:hover {
          border-color: transparent #D0D0D0 transparent transparent;
        }
      }

      .rightArrow {
        margin-left: 8px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 9px 0 9px 15.6px;
        background: transparent;
        border-color: transparent transparent transparent #6E6E6E;

        &:hover {
          border-color: transparent transparent transparent #D0D0D0;
        }
      }

      .step {
        border-radius: 50%;
        margin: 0 2.5px;

        &:hover {
          &:not(.active) {
            background: #D0D0D0;
          }
        }

        &.active {
          background: #47C0C0;
          cursor: default;
        }
      }
    }
  }
}
</style>