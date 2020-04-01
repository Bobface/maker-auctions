<template>
    <md-toolbar class="md-primary md-dense" md-elevation="1" style="z-index: 3;">
      <h3 class="md-title" style="flex: 1;" ><router-link class="link" to="/">MAKER AUCTIONS</router-link></h3>
      <h3 style="flex: 1; color: red !important;" v-if="webtest">WEBTEST MODE</h3>
      <md-button @click="auctionsClicked" :class="{selected: (selected === 'auctions')}">Auctions</md-button>
      <md-button @click="howItWorksClicked" :class="{selected: (selected === 'howItWorks')}">How it works</md-button>
      <md-button @click="aboutClicked" :class="{selected: (selected === 'about')}">About</md-button>
    </md-toolbar>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      webtest: process.env.VUE_APP_WEBTEST === 'TRUE'
    }
  },
  props: {
    selected: String,
  },
  methods: {
    auctionsClicked () {
      this.$router.push({path: '/'})
    },
    howItWorksClicked() {
      this.$router.push({path: '/howitworks'})
    },
    aboutClicked() {
      this.$router.push({path: '/about'})
    }
  }
}
</script>

<style scoped>
.selected {
  color: #16a085 !important;
  font-weight: bold;
}

.link {
  text-decoration: none !important;
  color: unset !important;
}
</style>
