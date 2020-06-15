<template>
  <div class="home">
    <div class="title">Welcome to Domino Party</div>
    <div class="message">What do you want to do today?</div>
    <div class="options">
      <div class="option" v-on:click="gotoPage('create')">
        <div class="title">Create</div>
        <img class="capture" src="@/assets/editor.gif">
        <div class="description">You have one square meter board. Use the editor to populate it with domino tiles and share it with the world. The only requirement is: the last tile must fall.</div>
      </div>
      <div class="option" v-on:click="gotoPage('view')">
        <div class="title">View</div>
        <img class="capture" src="@/assets/viewer.gif">
        <div class="description">Relax and enjoy watching other users creations put one after other creating an infinite tiles falling stream.</div>
      </div>
    </div>
    <div class="footer">
      <div>
        <span>An experiment made by <a class="link" href="https://www.cesarbotana.com">César Botana</a></span>
      </div>
      <div v-bind:style="{'margin-left': 'auto'}">
        Source code available at GitHub <a href="https://github.com/malandrin/domino-party"><img v-bind:style="{'margin-left': '10px'}" class="githubImage" src="@/assets/github.png"></a>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  methods: {
    gotoPage: function(page) {
      this.$router.push(`/${page}`)
    }
  }
}

</script>

<style lang="less" scoped>
  .home {
    background: #272838;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    color: white;
    padding: 30px;

    .title {
      font-weight: 700;
      font-size: 56px;
    }

    .message {
      font-size: 26px;
      margin-top: 20px;
    }

    .options {
      margin-top: 100px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-evenly;

      .option {
        background: #5D536B;
        border-radius: 10px;
        height: 100%;
        width: 450px;
        cursor: pointer;
        padding: 10px;
        border: 2px solid transparent;

        &:hover {
          border: 2px solid white;
        }

        .title {
          font-size: 24px;
          font-weight: 100;
          margin-top: 5px;
          margin-bottom: 5px;
        }

        .description {
          padding: 5px;
          text-align: justify;
        }

        .capture {
          width: 100%;
        }
      }
    }

    .footer {
      position: absolute;
      bottom: 30px;
      left: 50px;
      right: 50px;
      text-align: center;
      display: flex;
      align-items: center;
      padding-right: 30px;

      div {
        display: flex;
        align-items: center;
      }

      .githubImage {
        width: 50px;
      }

      .link {
        color: #193;
        text-decoration: none;
      }
    }
  }
</style>
