import Vue from 'vue'
import VueRouter from 'vue-router'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import App from './App'
import Auctions from './Auctions'
import HowItWorks from './HowItWorks'
import About from './About'

import store from './store'
import { 
  MdButton,
  MdContent,
  MdTabs,
  MdToolbar,
  MdDivider,
  MdTable,
  MdCard,
  MdRipple,
  MdSubheader,
  MdList,
  MdIcon,
  MdProgress,
  MdEmptyState,
  MdSteppers,
  MdField,
  MdCheckbox,
} from 'vue-material/dist/components'

import 'vue-material/dist/vue-material.min.css'
import './css/theme.scss'

Vue.use(MdButton)
Vue.use(MdContent)
Vue.use(MdTabs)
Vue.use(MdToolbar)
Vue.use(MdDivider)
Vue.use(MdTable)
Vue.use(MdCard)
Vue.use(MdRipple)
Vue.use(MdSubheader)
Vue.use(MdList)
Vue.use(MdIcon)
Vue.use(MdProgress)
Vue.use(MdEmptyState)
Vue.use(MdSteppers)
Vue.use(MdField)
Vue.use(MdCheckbox)
Vue.use(ElementUI)

Vue.config.productionTip = false

Vue.use(VueRouter)

const routes = [
  { path: '/', component: Auctions },
  { path: '/howitworks', component:  HowItWorks },
  { path: '/about', component:  About }
]

const router = new VueRouter({
  routes
})


new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})