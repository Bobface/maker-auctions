<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF">

    <div style="flex: 1; display: flex; flex-direction: column; min-height: 0px; padding: 0 0 10px 0;">

      <div style="flex: 0 0 50%; display: flex; flex-direction: column; min-height: 0px;">
        <div style="display: flex; height: 40px; border-bottom: 1px solid #EEEEEE; align-items: center;">
          <div class="auctionsTableField tableHeaderField">ID</div>
          <div class="auctionsTableField tableHeaderField">AMOUNT (MKR)</div>
          <div class="auctionsTableField tableHeaderField">BID (DAI)</div>
          <div class="auctionsTableField tableHeaderField">BIDDER</div>
          <div class="auctionsTableField tableHeaderField">END</div>
        </div>

        <md-content style="flex: 1; overflow: auto;" class="md-scrollbar">
          <div v-for="item in getFlopAuctions" :key="item.id" style="display: flex; height: 40px; align-items: center;  border-bottom: 1px solid #EEEEEE; min-height: 0px;">
            <div class="auctionsTableField">{{item.id}}</div>
            <div class="auctionsTableField">{{item.amount}}</div>
            <div class="auctionsTableField">{{item.bid}}</div>
            <div class="auctionsTableField"><a target="_blank" :href="'https://etherscan.io/address/' + item.raw.guy">{{ getFormattedBidder(item) }}</a></div>
            <div class="auctionsTableField">{{item.end}}</div>
          </div>
        </md-content>
      </div>

      <div style="flex: 0 0 50%; display: flex; flex-direction: column; min-height: 0px;">
        
        <span style="color: #ABABAB !important; margin: 30px 0 15px 15px;" class="md-title">HISTORY</span>
        
        <div style="display: flex; height: 40px; border-bottom: 1px solid #EEEEEE; align-items: center;">
          <div class="historyTableField tableHeaderField">ID</div>
          <div class="historyTableField tableHeaderField">AMOUNT (MKR)</div>
          <div class="historyTableField tableHeaderField">BID (DAI)</div>
          <div class="historyTableField tableHeaderField">WINNER</div>
          <div class="historyTableField tableHeaderField">END</div>
        </div>

        <md-content style="flex: 1; overflow: auto;" class="md-scrollbar">
          <div v-for="item in getFlopHistory" :key="item.id" style="display: flex; height: 40px; align-items: center;  border-bottom: 1px solid #EEEEEE; min-height: 0px;">
            <div class="historyTableField">{{item.id}}</div>
            <div class="historyTableField">{{item.amount}}</div>
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
import { mapGetters } from 'vuex'

export default {
  name: 'FlopAuctions',
  methods: {
    getFormattedBidder: function(params) {
      if(params.raw.guy.toLowerCase() === this.proxyAddress.toLowerCase()) {
        return 'YOU'
      } else {
        return params.bidder
      }
    },
  },
  computed: {
    ...mapGetters(['proxyAddress', 'getFlopAuctions', 'getFlopHistory', 'flopAuctionsInitialized']),
  }
}
</script>


<style scoped>
a {
  color: #16a085 !important;
}

.tableHeaderField {
  font-weight: bold;
  color: #909399;
}

.auctionsTableField {
  flex: 0 0 20%;
  padding-left: 10px;
}


.historyTableField {
  flex: 0 0 20%;
  padding-left: 10px;
}
</style>