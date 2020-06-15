<template>
  <div class="mask"
    v-on:click.stop=""
  >
    <div
      class="ioDialog"
      v-bind:class="type"
    >
      <div class="title">{{title}}</div>
      <div v-if="type === 'load'">
        <input ref="input" class="input center" type="text" v-model="input" placeholder="Enter Board UUID">
      </div>
      <div v-else-if="type === 'message'">
        <div class="message">{{message}}</div>
      </div>
      <div class="footer">
        <div v-if="type !== 'message'" class="button" v-on:click="cancel">Cancel</div>
        <div v-if="!noButton" class="button" v-on:click="accept">Accept</div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'IODialog',
  data: function() {
    return {
      type: null,
      title: '',
      message: '',
      input: '',
      noButton: false
    }
  },
  methods: {
    open: function(type, params) {
      const self = this

      switch(type) {
        case 'load':
          this.input = ''
          this.title = 'Load Board'
          Vue.nextTick(() => self.$refs.input.focus())
          break

        case 'message':
          this.title = params.type
          this.message = params.message
          this.noButton = params.noButton
          break
      }

      this.type = type
    },
    close: function() {
      this.$emit('close')
    },
    accept: function() {
      let params = null

      switch(this.type) {
        case 'load':
          if (this.input) {
            params = {uuid: this.input}
          }
          break
      }

      this.$emit('close', this.type, params)
    },
    cancel: function() {
      this.$emit('close', this.type)
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

  .ioDialog {
    width: 800px;
    height: 300px;
    background: #444444;
    border: 1px solid #2B2B2B;
    border-radius: 5px;
    padding: 10px 40px;

    &.load {
      height: 150px;
    }

    &.message {
      height: 130px;
    }

    .title {
      color: #DCDCDC;
      font-size: 20px;
      margin-bottom: 25px;
      text-transform: uppercase;
      border-bottom: 1px solid #DCDCDC;
      height: 30px;
    }

    .input {
      height: 30px;
      font-size: 20px;
      width: 100%;
      border: 1px solid #4A4A4A;
      padding-left: 5px;
      outline: none;

      &:focus {
        outline: 1px solid #4A4A4A;
        border: 1px solid #D0D0D0;
      }

    }

    .message {
      color: #DCDCDC;
      font-size: 18px;
    }

    .footer {
      margin-top: 15px;
      display: flex;
      align-items: center;
      justify-content: center;

      .button {
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px 10px;
        margin-left: 10px;
        background: #646464;
        border: 1px solid #4A4A4A;
        color: #DCDCDC;
        cursor: pointer;
        border-radius: 4px;

        &:hover {
          border: 1px solid #555555;
          background: #383838;
        }

        &:active {
          background: #5F8AC1;
        }
      }
    }
  }
}
</style>