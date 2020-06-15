<template>
  <div class="mask"
    v-on:click.stop=""
  >
    <div
      class="publishDialog"
    >
      <div class="title">Publish Board</div>
      <div class="form">
        <div class="row">
          <div class="label">Title:</div>
          <input ref="title" type="text" v-model="title" v-bind:maxlength="maxTitleLength">
        </div>
        <div class="row">
          <div class="label">Author:</div>
          <input type="text" v-model="author" v-bind:maxlength="maxAuthorLength">
        </div>
      </div>
      <div class="recaptchaMessage">
        This site is protected by reCAPTCHA and the Google
        <a href="https://policies.google.com/privacy">Privacy Policy</a> and
        <a href="https://policies.google.com/terms">Terms of Service</a> apply.
      </div>
      <div class="footer">
        <div class="btn" v-on:click="cancel">Cancel</div>
        <div class="btn accept" v-on:click="accept">Accept</div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import {MAX_SCENE_TITLE_LENGTH, MAX_SCENE_AUTHOR_LENGTH} from '@/defines'

export default {
  name: 'PublishDialog',
  data: function() {
    return {
      title: 'New Board',
      author: 'New Author',
      maxTitleLength: MAX_SCENE_TITLE_LENGTH,
      maxAuthorLength: MAX_SCENE_AUTHOR_LENGTH,
    }
  },
  methods: {
    open: function() {
      const self = this

      Vue.nextTick(function() {
        self.$refs.title.focus()
        self.$refs.title.select()
      })
    },
    cancel: function() {
      this.$emit('close', null, null)
    },
    accept() {
      const self = this

      this.$recaptcha('publish_scene').then(function(token) {
        self.$emit('close', self.title, self.author, token)
      })
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

  .publishDialog {
    width: 500px;
    height: 250px;
    background: #444444;
    border: 1px solid #2B2B2B;
    padding: 10px 40px;

    .title {
      font-size: 24px;
      color: white;
      padding: 5px;
      border-bottom: 1px solid #383838;
    }

    .form {
      display: flex;
      flex-direction: column;
      margin-top: 10px;
      font-size: 16px;
      color: #DCDCDC;

      .row {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-top: 20px;

        .label {
          text-align: right;
          width: 60px;
          margin-right: 15px;
        }

        input {
          background: #646464;
          border: 1px solid #4A4A4A;
          padding-left: 5px;
          height: 20px;
          width: 100%;
          font-size: 16px;
          color: white;
        }
      }
    }

    .recaptchaMessage {
      margin-top: 20px;
      color: #DCDCDC;
      font-size: 12px;
      text-align: left;

      a {
        color: black;
      }
    }

    .footer {
      display: flex;
      align-items: center;
      margin-top: 20px;
      width: 100%;
      height: 40px;
      border-top: 1px solid #383838;
      padding: 5px;

      .btn {
        font-size: 16px;
        color: #D0D0D0;
        cursor: pointer;

        &.accept {
          margin-left: auto;
        }

        &:hover {
          color: white;
        }
      }
    }
  }
}
</style>