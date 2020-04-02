<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF">

    <md-empty-state
      v-if="getFlipAuctions.length === 0 && flipAuctionsInitialized"
      md-icon="block"
      md-label="No auctions available"
      md-description="New auctions will appear here as soon as they are available.">
    </md-empty-state>
    
    <md-table v-model="getFlipAuctions" class="auction-table-container" md-fixed-header md-card v-if="getFlipAuctions.length !== 0 && flipAuctionsInitialized">
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="ID">{{ item.id }}</md-table-cell>
        <md-table-cell md-label="PHASE">{{ item.phase }}</md-table-cell>
        <md-table-cell md-label="CURRENCY">{{ item.currency }}</md-table-cell>
        <md-table-cell md-label="AMOUNT">{{ item.amount }}</md-table-cell>
        <md-table-cell md-label="MAX BID (DAI)">{{ item.max }}</md-table-cell>
        <md-table-cell md-label="BID (DAI)">{{ item.bid }}</md-table-cell>
        <md-table-cell md-label="BIDDER"><a target="_blank" :href="'https://etherscan.io/address/' + item.raw.guy">{{ getFormattedBidder(item) }}</a></md-table-cell>
        <md-table-cell md-label="END">{{ item.end }}</md-table-cell>
        <md-table-cell md-label="ACTION">
            
          <md-button 
            v-if="item.raw.phase === 'DAI' || item.raw.phase === 'GEM'" 
            @click="bidClicked(item)"
            style="margin: 0;"
            :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
            :disabled="!web3 || (proxyAddress.toLowerCase() === item.raw.guy.toLowerCase())">
              PLACE BID
          </md-button>
            
          <md-button 
            v-if="item.raw.phase == 'RES'" 
            style="margin: 0;"
            :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
            :disabled="true">
              RESTART
          </md-button>

          <md-button 
            @click="claimClicked(item)"
            v-if="item.raw.phase == 'FIN'" 
            style="margin: 0;"
            :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
            :disabled="!web3 || (proxyAddress.toLowerCase() !== item.raw.guy.toLowerCase())">
              CLAIM
          </md-button>

        </md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'FlipAuctions',
  methods: {
    bidClicked: function(params) {
      this.setFlipAuctionParams(params)
      this.setShowFlipAuctionBidOverlay(true)
    },
    claimClicked: function(params) {
      this.setFlipAuctionParams(params)
      this.setShowFlipAuctionClaimOverlay(true);
    },
    getFormattedBidder: function(params) {
      if(params.raw.guy.toLowerCase() === this.proxyAddress.toLowerCase()) {
        return 'YOU'
      } else {
        return params.bidder
      }
    },
    ...mapActions(['setFlipAuctionParams', 'setShowFlipAuctionBidOverlay', 'setShowFlipAuctionClaimOverlay']),
  },
  computed: {
    
    ...mapGetters(['getFlipAuctions', 'web3', 'proxyAddress', 'flipAuctionsInitialized'])
  },
}
</script>

<style>
a {
  color: #16a085 !important;
}


.auction-table-container .md-content {
  max-height: 100% !important;
  height: 100% !important;
}

</style>
