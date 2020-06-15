import Vue from 'vue'
import VueResource from 'vue-resource'
import {VueReCaptcha} from 'vue-recaptcha-v3'
import App from './app.vue'
import router from './router'

Vue.config.productionTip = false

Vue.use(VueReCaptcha, {
  siteKey: '6LfzhvoUAAAAANbKFJGEioyZkX6xIvo3ByxgHwSm',
  loaderOptions: {
    autoHideBadge: true
  }
})
Vue.use(VueResource)

if (process.env.NODE_ENV === 'development') {
  Vue.http.options.root = 'http://localhost:9080/api/'
} else {
  Vue.http.options.root = 'https://dominos-party.ew.r.appspot.com/api/'
}

Vue.http.options.emulateJSON = true

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
