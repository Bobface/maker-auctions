<template>
  <div style="flex: 1; display: flex; flex-direction: column; background-color: #FFFFFF">
    <md-empty-state
      v-if="getFlopAuctions.length === 0 && flopAuctionsInitialized"
      md-icon="block"
      md-label="No auctions available"
      md-description="New auctions will appear here as soon as they are available.">
    </md-empty-state>

    <md-table v-model="getFlopAuctions" class="auction-table-container" md-card v-if="getFlopAuctions.length !== 0 && flopAuctionsInitialized">
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="ID" md-sort-by="id" md-numeric>{{ item.id }}</md-table-cell>
        <md-table-cell md-label="PHASE" md-sort-by="phase">{{ item.phase }}</md-table-cell>
        <md-table-cell md-label="AMOUNT (MKR)" md-sort-by="amount">{{ item.amount }}</md-table-cell>
        <md-table-cell md-label="BID (DAI)" md-sort-by="bid">{{ item.bid }}</md-table-cell>
        <md-table-cell md-label="BIDDER" md-sort-by="bidder"><a target="_blank" :href="'https://etherscan.io/address/' + item.raw.guy">{{ item.bidder }}</a></md-table-cell>
        <md-table-cell md-label="END" md-sort-by="end">{{ item.end }}</md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FlopAuctions',
  computed: mapGetters(['getFlopAuctions', 'flopAuctionsInitialized']),
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