<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF">
    <md-toolbar style="background-color: #FFFFFF; " md-elevation="1">
      <div style="flex-grow: 1;">
        <center>
          <md-button @click="selectedToken = 'ETH'" :md-ripple="false">
            <span :class="{'md-title': true, pointer: true, selected: selectedToken === 'ETH', notSelected: !(selectedToken === 'ETH')}">
              ETH
            </span>
            <span :class="{'md-caption': true, count: true, pointer: true}">
              {{getFlipAuctions('ETH').length}}
            </span>
          </md-button>
        </center>
      </div>

      <div style="flex-grow: 1;">
        <center>
          <md-button @click="selectedToken = 'BAT'" :md-ripple="false">
            <span :class="{'md-title': true, pointer: true, selected: selectedToken === 'BAT', notSelected: !(selectedToken === 'BAT')}">
              BAT
            </span>
            <span :class="{'md-caption': true, count: true, pointer: true}">
              {{getFlipAuctions('BAT').length}}
            </span>
          </md-button>
        </center>
      </div>

      <div style="flex-grow: 1;">
        <center>
          <md-button @click="selectedToken = 'USDC'" :md-ripple="false">
            <span :class="{'md-title': true, pointer: true, selected: selectedToken === 'USDC', notSelected: !(selectedToken === 'USDC')}">
              USDC
            </span>
            <span :class="{'md-caption': true, count: true, pointer: true}">
              {{getFlipAuctions('USDC').length}}
            </span>
          </md-button>
        </center>
      </div>
    </md-toolbar>

    <div style="display: flex; flex-direction: column; flex: 1;">
      <div style="flex: 1; overflow-y: hidden;">
        <md-empty-state
          v-if="getAuctions.length === 0 && flipAuctionsInitialized"
          md-icon="block"
          md-label="No auctions available"
          md-description="New auctions will appear here as soon as they are available.">
        </md-empty-state>
        
        <md-table @scroll="console.log('scroll')" style="height: 100%; max-height: 100%;" md-fixed-header v-model="getAuctions" class="auction-table-container" md-card v-if="getFlipAuctions(selectedToken).length !== 0 && flipAuctionsInitialized">
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

      <div style="flex: 1; padding-top: 30px;">
        <span class="md-title" style="padding-left: 10px; color: #ABABAB !important">HISTORY</span>
      </div>

    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'FlipAuctions',
  data() {
    return {
      selectedToken: 'ETH',
    }
  },
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
    getAuctions: function() {
      return this.getFlipAuctions(this.selectedToken)
    },
    ...mapGetters(['getFlipAuctions', 'web3', 'proxyAddress', 'flipAuctionsInitialized'])
  },
}
</script>

<style scoped>
a {
  color: #16a085 !important;
}

.auction-table-container .md-content {
  max-height: 100% !important;
  height: 100% !important;
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
