<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF; min-height: 0px;">
    <div style="height: 40px; align-items: center; background-color: #FFFFFF; display: flex;">
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
    </div>
    <md-divider />
    <md-divider />
 
    <div style="flex: 1; display: flex; flex-direction: column; min-height: 0px; padding: 0 0 10px 0;">

      <div style="flex: 0 0 50%; display: flex; flex-direction: column; min-height: 0px;">
        <div style="display: flex; height: 40px; border-bottom: 1px solid #EEEEEE; align-items: center;">
          <div class="auctionsTableField tableHeaderField">ID</div>
          <div class="auctionsTableField tableHeaderField">PHASE</div>
          <div class="auctionsTableField tableHeaderField">CURRENCY</div>
          <div class="auctionsTableField tableHeaderField">AMOUNT</div>
          <div class="auctionsTableField tableHeaderField">MAX BID (DAI)</div>
          <div class="auctionsTableField tableHeaderField">BID (DAI)</div>
          <div class="auctionsTableField tableHeaderField">BIDDER</div>
          <div class="auctionsTableField tableHeaderField">END</div>
          <div class="auctionsTableField tableHeaderField">ACTION</div>
        </div>

        <md-content style="flex: 1; overflow: auto;" class="md-scrollbar" v-if="getAuctions.length !== 0 && flipAuctionsInitialized">
          <div v-for="item in getAuctions" :key="item.id" style="display: flex; height: 40px; align-items: center;  border-bottom: 1px solid #EEEEEE; min-height: 0px;">
            <div class="auctionsTableField">{{item.id}}</div>
            <div class="auctionsTableField">{{item.phase}}</div>
            <div class="auctionsTableField">{{item.currency}}</div>
            <div class="auctionsTableField">{{item.amount}}</div>
            <div class="auctionsTableField">{{item.max}}</div>
            <div class="auctionsTableField">{{item.bid}}</div>
            <div class="auctionsTableField"><a target="_blank" :href="'https://etherscan.io/address/' + item.raw.guy">{{ getFormattedBidder(item) }}</a></div>
            <div class="auctionsTableField">{{item.end}}</div>
            <div class="auctionsTableField">
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
            </div>
          </div>
        </md-content>
      </div>

      <div style="flex: 0 0 50%; display: flex; flex-direction: column; min-height: 0px;">
        
        <span style="color: #ABABAB !important; margin: 30px 0 15px 15px;" class="md-title">HISTORY</span>
        
        <div style="display: flex; height: 40px; border-bottom: 1px solid #EEEEEE; align-items: center;">
          <div class="historyTableField tableHeaderField">ID</div>
          <div class="historyTableField tableHeaderField">CURRENCY</div>
          <div class="historyTableField tableHeaderField">AMOUNT</div>
          <div class="historyTableField tableHeaderField">MAX BID (DAI)</div>
          <div class="historyTableField tableHeaderField">BID (DAI)</div>
          <div class="historyTableField tableHeaderField">WINNER</div>
          <div class="historyTableField tableHeaderField">END</div>
        </div>

        <md-content style="flex: 1; overflow: auto;" class="md-scrollbar">
          <div v-for="item in getHistory" :key="item.id" style="display: flex; height: 40px; align-items: center;  border-bottom: 1px solid #EEEEEE; min-height: 0px;">
            <div class="historyTableField">{{item.id}}</div>
            <div class="historyTableField">{{item.currency}}</div>
            <div class="historyTableField">{{item.amount}}</div>
            <div class="historyTableField">{{item.max}}</div>
            <div class="historyTableField">{{item.bid}}</div>
            <div class="historyTableField"><a target="_blank" :href="'https://etherscan.io/address/' + item.raw.guy">{{ getFormattedBidder(item) }}</a></div>
            <div class="historyTableField">{{item.end}}</div>
          </div>
        </md-content>
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

.auctionsTableField {
  flex: 0 0 11.11%;
  padding-left: 10px;
}


.historyTableField {
  flex: 0 0 14.288%;
  padding-left: 10px;
}

</style>

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