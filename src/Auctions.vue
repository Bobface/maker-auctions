<template>
  <div style="height: 100%; display:flex; flex-direction: column;">
    <Header selected="auctions" />
    <div style="flex: 1; display: flex; min-height: 0px;">
      <div style="flex: 0 0 75%; display:flex; flex-direction: column;">
          <div style="display: flex; background-color: #FFFFFF; height: 60px; align-items: center;" md-elevation="1">
            <div style="flex-grow: 1;">
              <center>
                <md-button @click="flipClicked" :md-ripple="false">
                  <span :class="{'md-title': true, pointer: true, selected: flip, notSelected: !flip}">
                    FLIP AUCTIONS
                  </span>
                  <span :class="{'md-caption': true, count: true, pointer: true}">
                    {{getNumTotalFlipAuctions}}
                  </span>
                </md-button>
              </center>
            </div>

            <div style="flex-grow: 1;">
              <center>
                <md-button @click="flapClicked" :md-ripple="false">
                  <span :class="{'md-title': true, pointer: true, selected: flap, notSelected: !flap}">
                    FLAP AUCTIONS
                  </span>
                  <span :class="{'md-caption': true, count: true, pointer: true}">
                    {{getFlapAuctions.length}}
                  </span>
                </md-button>
              </center>
            </div>

            <div style="flex-grow: 1;">
              <center>
                <md-button @click="flopClicked" :md-ripple="false">
                  <span :class="{'md-title': true, pointer: true, selected: flop, notSelected: !flop}">
                    FLOP AUCTIONS
                  </span>
                  <span :class="{'md-caption': true, count: true, pointer: true}">
                    {{getFlopAuctions.length}}
                  </span>
                </md-button>
              </center>
            </div>
        </div>
        <md-divider />
        <md-divider />
        <FlipAuctions v-if="flip" />
        <FlapAuctions v-if="flap" />
        <FlopAuctions v-if="flop" />
      </div>
      <div style="flex: 0 0 25%;"><Sidebar /></div>
    </div>
    <Footer />
    <Web3Overlay />
    <MoveOverlay />
    <FlipAuctionBidOverlay />
    <FlipAuctionClaimOverlay />
    
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import FlipAuctions from './components/FlipAuctions'
import FlapAuctions from './components/FlapAuctions'
import FlopAuctions from './components/FlopAuctions'
import Web3Overlay from './components/Web3Overlay'
import MoveOverlay from './components/MoveOverlay'
import FlipAuctionBidOverlay from './components/FlipAuctionBidOverlay'
import FlipAuctionClaimOverlay from './components/FlipAuctionClaimOverlay'
import Footer from './components/Footer'

export default {
  name: 'Auctions',
  data() {
    return {
      flip: true,
      flap: false,
      flop: false,
    }
  },
  methods: {
    flipClicked() {
      this.flip = true
      this.flap = false
      this.flop = false
    },
    flapClicked() {
      this.flip = false
      this.flap = true
      this.flop = false
    },
    flopClicked() {
      this.flip = false
      this.flap = false
      this.flop = true
    },
  },
  components: {
    Header,
    Sidebar,
    FlipAuctions,
    FlapAuctions,
    FlopAuctions,
    Web3Overlay,
    MoveOverlay,
    FlipAuctionBidOverlay,
    FlipAuctionClaimOverlay,
    Footer,
  },
  computed: mapGetters(['getNumTotalFlipAuctions', 'getFlapAuctions', 'getFlopAuctions']),
}
</script>

<style>

html, body {
  height: 100%;
  min-height: 100%;
}

.pointer {
  cursor: pointer;
}

.count {
  padding-left: 0px;
}

.selected {
  color: #16a085 !important;
  font-weight: bold !important;
}

.notSelected {
  color: #ABABAB !important;
}

</style>
