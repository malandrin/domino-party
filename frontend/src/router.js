import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/home'
import Editor from '@/editor/editor'
import Viewer from '@/viewer'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/create',
      name: 'create',
      component: Editor
    }, {
      path: '/view/:id',
      name: 'viewScene',
      component: Viewer
    }, {
      path: '/view',
      name: 'view',
      component: Viewer
    }, {
      path: '*',
      name: 'home',
      component: Home,
      meta: {
        title: 'orejas'
      }
    }
  ]
})
