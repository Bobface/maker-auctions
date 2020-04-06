<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF">
    <md-toolbar style="background-color: #FFFFFF; display: flex; flex: 0;" md-elevation="1">
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
      <!--<div style="flex: 0 0 50%; display: flex; flex-direction: column; max-height: 50%;">
        <md-empty-state
          v-if="getAuctions.length === 0 && flipAuctionsInitialized"
          md-icon="block"
          md-label="No auctions available"
          md-description="New auctions will appear here as soon as they are available.">
        </md-empty-state>
        
        <el-table :data="getAuctions" style="width: 100%;" height="100%" >
          <el-table-column prop="id" label="ID" ></el-table-column>
          <el-table-column prop="phase" label="PHASE" ></el-table-column>
          <el-table-column prop="currency" label="CURRENCY" ></el-table-column>
          <el-table-column prop="amount" label="AMOUNT" ></el-table-column>
          <el-table-column prop="max" label="MAX BID (DAI)" ></el-table-column>
          <el-table-column prop="bid" label="BID (DAI)" ></el-table-column>
          <el-table-column label="BIDDER" >
            <template slot-scope="scope"><a target="_blank" :href="'https://etherscan.io/address/' + scope.row.raw.guy">{{ getFormattedBidder(scope.row) }}</a></template>
          </el-table-column>
          <el-table-column prop="end" label="END" ></el-table-column>
          <el-table-column label="ACTION" >
            <template slot-scope="scope">
              <md-button 
                v-if="scope.row.raw.phase === 'DAI' || scope.row.raw.phase === 'GEM'" 
                @click="bidClicked(scope.row)"
                style="margin: 0;"
                :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
                :disabled="!web3 || (proxyAddress.toLowerCase() === scope.row.raw.guy.toLowerCase())">
                  PLACE BID
              </md-button>
                
              <md-button 
                v-if="scope.row.raw.phase == 'RES'" 
                style="margin: 0;"
                :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
                :disabled="true">
                  RESTART
              </md-button>

              <md-button 
                @click="claimClicked(scope.row)"
                v-if="scope.row.raw.phase == 'FIN'" 
                style="margin: 0;"
                :class="{'md-dense': true, 'md-accent': true, 'md-raised': true,}" 
                :disabled="!web3 || (proxyAddress.toLowerCase() !== scope.row.raw.guy.toLowerCase())">
                  CLAIM
              </md-button>
            </template>
          </el-table-column>
        </el-table>

        <md-table style="min-height: 100%; height: 100%;" md-fixed-header v-model="getAuctions" class="auction-table-container" md-card v-if="getFlipAuctions(selectedToken).length !== 0 && flipAuctionsInitialized">
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
      </div>-->

    <div style="flex: 1; display: flex; flex-direction: column;">
      <div style="overflow-y: auto; height: 50%;">
        <div style="display: flex; height: 40px; border-bottom: 1px solid #EEEEEE;">
          <div class="tableField tableHeaderField">ID</div>
          <div class="tableField tableHeaderField">CURRENCY</div>
          <div class="tableField tableHeaderField">AMOUNT</div>
          <div class="tableField tableHeaderField">MAX BID (DAI)</div>
          <div class="tableField tableHeaderField">BID (DAI)</div>
          <div class="tableField tableHeaderField">WINNER</div>
          <div class="tableField tableHeaderField">END</div>
        </div>

        <div>
        <div v-for="item in getAuctions.concat(...getAuctions)" :key="item.id" style="display: flex;  border-bottom: 1px solid #EEEEEE; min-height: 0px;">
          <div class="tableField">{{item.id}}</div>
          <div class="tableField">{{item.currency}}</div>
          <div class="tableField">{{item.amount}}</div>
          <div class="tableField">{{item.max}}</div>
          <div class="tableField">{{item.bid}}</div>
          <div class="tableField">{{item.bidder}}</div>
          <div class="tableField">{{item.end}}</div>
        </div>
        </div>
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
    getHistory: function() {
      return this.getFlipHistory(this.selectedToken)
    },
    ...mapGetters(['getFlipAuctions', 'getFlipHistory', 'web3', 'proxyAddress', 'flipAuctionsInitialized'])
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

/* Fixes the horizontal scroll bar appearing */
.auction-table-container .md-table-fixed-header {
  padding-right: 0px !important;
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

.tableHeaderField {
  font-weight: bold;
  color: #909399;
}

.tableField {
  flex: 0 0 14.288%;
  height: 60px;
}

</style>
