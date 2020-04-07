<template>
    <MdContent class="sidebarRoot" style="flex: 1 0 100%; background-color: transparent;">
        <md-subheader><strong style="color: #16a085">WALLET</strong></md-subheader>
        <center v-if="web3 === undefined">
            <md-button 
            class="md-raised md-accent"
            v-on:click="showConnectWeb3Dialog">
                Connect Wallet
            </md-button>
            <div style="margin-top: 10px;" class="md-caption">
                Please connect your Wallet if you want to participate in auctions
            </div>
        </center>
        <div v-if="web3 !== undefined">
            
            <span class="md-caption" style="padding-left: 16px">{{web3.eth.defaultAccount}}</span>
            <md-divider style="margin-top: 15px; margin-bottom: 5px;"/>
            
            <md-list class="md-double-line" style="background-color: transparent;">
                <md-subheader><strong style="color: #16a085">BALANCES</strong></md-subheader>

                <md-list-item>
                    <div><img src="../assets/ethereum-logo.png" style="max-height: 30px; margin-right: 10px;"/></div>
                    <div class="md-list-item-text">
                        <span>{{ walletDisplayBalanceOfToken('ETH') }}</span>
                        <span>ETH</span>
                    </div>
                    <div class="md-list-item-text">
                        <span>{{ depositedDisplayBalanceOfToken('ETH') }}</span>
                        <span>Deposited</span>
                    </div>
                </md-list-item>
                <md-list-item>
                    <div> <img src="../assets/mkr-logo.png" style="max-height: 30px; margin-right: 10px;"/></div>
                    <div class="md-list-item-text">
                        <span>{{ walletDisplayBalanceOfToken('MKR') }}</span>
                        <span>MKR</span>
                    </div>
                    <div class="md-list-item-text">
                        <span>{{ depositedDisplayBalanceOfToken('MKR') }}</span>
                        <span>Deposited</span>
                    </div>
                </md-list-item>
                <md-list-item>
                    <div> <img src="../assets/dai-logo.png" style="max-height: 30px; margin-right: 10px;"/></div>
                    <div class="md-list-item-text">
                        <span>{{ walletDisplayBalanceOfToken('DAI') }}</span>
                        <span>DAI</span>
                    </div>
                    <div class="md-list-item-text">
                        <span>{{ depositedDisplayBalanceOfToken('DAI') }}</span>
                        <span>Deposited</span>
                    </div>
                </md-list-item>
                <md-list-item>
                    <div> <img src="../assets/bat-logo.png" style="max-height: 30px; margin-right: 10px;"/></div>
                    <div class="md-list-item-text">
                        <span>{{ walletDisplayBalanceOfToken('BAT') }}</span>
                        <span>BAT</span>
                    </div>
                    <div class="md-list-item-text">
                        <span>{{ depositedDisplayBalanceOfToken('BAT') }}</span>
                        <span>Deposited</span>
                    </div>
                </md-list-item>
                <md-list-item>
                    <div> <img src="../assets/usdc-logo.png" style="max-height: 30px; margin-right: 10px;"/></div>
                    <div class="md-list-item-text">
                        <span>{{ walletDisplayBalanceOfToken('USDC') }}</span>
                        <span>USDC</span>
                    </div>
                    <div class="md-list-item-text">
                        <span>{{ depositedDisplayBalanceOfToken('USDC') }}</span>
                        <span>Deposited</span>
                    </div>
                </md-list-item>
            </md-list>
            <md-progress-bar md-mode="indeterminate" :class="{'md-accent': true, hide: !balancesLoading}"></md-progress-bar>
            <div style="display: flex;">
                <md-button style="flex-grow: 1;" class="md-raised md-primary" @click="() => {this.setShowMoveOverlay(true)}">
                    <md-icon>swap_horiz</md-icon> Move
                </md-button>
                <md-button style="flex-grow: 1;" class="md-raised md-accent" @click="updateBalances">
                    <md-icon>cached</md-icon> Refresh
                </md-button>
            </div>
        </div>
    </MdContent>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Sidebar',
  methods: {
      ...mapActions(['showConnectWeb3Dialog', 'updateBalances', 'setShowMoveOverlay'])
  },
  computed: mapGetters([
        'web3',
        'balancesLoading',
        'walletDisplayBalanceOfToken',
        'depositedDisplayBalanceOfToken']),
}
</script>

<style scoped>
.sidebarRoot {
    border-left: 1px solid #DBDBDB;
    padding: 10px;
}

.hide {
    visibility: hidden;
}
</style>
