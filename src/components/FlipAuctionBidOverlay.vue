<template>
    <div 
    :class="{overlay: true, hide: !showFlipAuctionBidOverlay}"
    v-if="flipAuctionParams !== undefined"
    >
        <div class="content" style="max-width: 950px;">
            <md-steppers :md-active-step.sync="active" md-linear>
                <md-step :md-error="proxySetupError" :md-editable="false" id="proxySetup" md-label="Setup" :md-done.sync="proxySetup">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Welcome!</h3>
                        <div style="cursor: pointer;" @click="setupProxyCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    <p>It looks like this is your first interaction on the website.</p>
                    <p>
                        Before we can get started, we need to set you up with your personal proxy contract. This way you will get the smoothest experience possible.
                    </p>
                    <center>
                        <md-button class="md-raised md-accent" @click="setupClicked" :disabled="!proxySetupButtonEnabled">
                            Setup
                        </md-button>
                    </center>

                    <md-divider v-if="proxySetupTx !== undefined || proxySetupError !== undefined" style="margin: 15px 0 15px 0;" />
                    <div v-if="proxySetupTx !== undefined && proxySetupError === undefined">
                        <div style="display: flex; margin-bottom: 5px;">
                            <span style="flex: 1;"><center>Waiting for your transaction to be confirmed</center></span>
                            <span style="flex: 1;"><center><a target="_blank" :href="'https://etherscan.io/tx/' + proxySetupTx">{{ proxySetupTx.substring(0, 6) + '...' + proxySetupTx.substring(proxySetupTx.length - 4) }}</a></center></span>
                        </div>
                        <md-progress-bar class="md-accent" md-mode="indeterminate"></md-progress-bar>
                    </div>
                    <div v-if="proxySetupError !== undefined">
                        <h3 class="md-title" style="color: #ff1744 !important;">Oops!</h3>
                        <span>Your transaction <a target="_blank" :href="'https://etherscan.io/tx/' + proxySetupTx">{{ proxySetupTx.substring(0, 6) + '...' + proxySetupTx.substring(proxySetupTx.length - 4) }}</a> did not succeed. Maybe it ran out of gas?</span>
                    </div>
                </md-step>
                <md-step :md-editable="false" id="setBid" md-label="Set Bid" :md-done.sync="setBid">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Set Bid</h3>
                        <div style="cursor: pointer;" @click="setBidCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    <p v-if="flipAuctionParams.raw.phase === 'DAI'">
                        The auction is currently in the <strong>{{ flipAuctionParams.phase }}</strong> phase.<br />
                        Bidders bid an increasing amount of DAI for a fixed amount {{ flipAuctionParams.currency }}.
                    </p>
                    <p v-if="flipAuctionParams.raw.phase === 'GEM'">
                        The auction is currently in the <strong>{{ flipAuctionParams.phase }}</strong> phase.<br />
                        Bidders bid a fixed amount of DAI for an decreasing amount of {{ flipAuctionParams.currency }}.
                    </p>
                    <md-table style="border: 1px solid #ABABAB;">
                        <md-table-row>
                            <md-table-head>ID</md-table-head>
                            <md-table-head>PHASE</md-table-head>
                            <md-table-head>CURRENCY</md-table-head>
                            <md-table-head>AMOUNT</md-table-head>
                            <md-table-head>MAX BID (DAI)</md-table-head>
                            <md-table-head>BID (DAI)</md-table-head>
                        </md-table-row>
                        <md-table-row>
                            <md-table-cell>{{ flipAuctionParams.id }}</md-table-cell>
                            <md-table-cell>{{ flipAuctionParams.phase }}</md-table-cell>
                            <md-table-cell>{{ flipAuctionParams.currency }}</md-table-cell>
                            <md-table-cell :class="{accent: flipAuctionParams.raw.phase === 'GEM'}">{{ flipAuctionParams.amount }}</md-table-cell>
                            <md-table-cell>{{ flipAuctionParams.max }}</md-table-cell>
                            <md-table-cell  :class="{accent: flipAuctionParams.raw.phase === 'DAI'}">{{ flipAuctionParams.bid }}</md-table-cell>
                        </md-table-row>
                    </md-table>
                    <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                        <md-field style="margin: 0 0 5px 0;">
                            <label>Bid</label>
                            <span class="md-prefix">{{ flipAuctionParams.raw.phase === 'DAI' ? 'DAI' : flipAuctionParams.currency}}</span>
                            <md-input v-model="setBidAmount" @input="setBidAmountChanged"></md-input>
                        </md-field>
                        <md-button @click="setBidAutoClicked" style="flex: 1;" class=" md-raised md-primary">Auto</md-button>
                    </div>
                    <div style="color: #ff1744 !important;" :class="{noDisplay: setBidAmountError === ''}">{{setBidAmountError}}</div>
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    <center>
                        <md-button @click="setBidContinueClicked" :disabled="this.setBidAmount === '' || this.setBidAmountError !== ''" class="md-raised md-accent" >
                            Continue
                        </md-button>
                    </center>
                </md-step>
                <md-step :md-error="approveError" :md-editable="false" id="approve" md-label="Approve Transfer" :md-done.sync="approve">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Approve Token Transfer</h3>
                        <div style="cursor: pointer;" @click="approveCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    <p>Your proxy contract needs to be allowed to access your DAI to transfer them for you.<br />
                    You can either allow only this transaction or set a permanent approval.
                    </p>

                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <md-button :disabled="!approveAlwaysButtonEnabled" @click="approveAlways = true; approveSingle = false;" :class="{'md-raised': approveAlways, 'md-accent': approveAlways}" style="flex: 1;">
                            Always allow
                        </md-button>
                        <md-button :disabled="!approveSingleButtonEnabled" @click="approveSingle = true; approveAlways = false;" :class="{'md-raised': approveSingle, 'md-accent': approveSingle}" style="flex: 1;">
                            Allow only this transaction
                        </md-button>
                    </div>

                    <center>
                        <md-button @click="approveClicked" style="margin-top: 20px;" class="md-raised md-accent" :disabled="(!approveAlways && !approveSingle) || !approveButtonEnabled">
                            Approve
                        </md-button>
                    </center>
                    <md-divider v-if="approveTx !== undefined || approveError !== undefined" style="margin: 20px 0 10px 0;"></md-divider>
                    <div v-if="approveTx !== undefined && approveError === undefined">
                        <div style="display: flex; margin-bottom: 5px;">
                            <span style="flex: 1;"><center>Waiting for your transaction to be confirmed</center></span>
                            <span style="flex: 1;"><center><a target="_blank" :href="'https://etherscan.io/tx/' + approveTx">{{ approveTx.substring(0, 6) + '...' + approveTx.substring(approveTx.length - 4) }}</a></center></span>
                        </div>
                        <md-progress-bar class="md-accent" md-mode="indeterminate"></md-progress-bar>
                    </div>
                    <div v-if="approveError !== undefined">
                        <h3 class="md-title" style="color: #ff1744 !important;">Oops!</h3>
                        <span>Your transaction <a target="_blank" :href="'https://etherscan.io/tx/' + approveTx">{{ approveTx.substring(0, 6) + '...' + approveTx.substring(approveTx.length - 4) }}</a> did not succeed. Maybe it ran out of gas?</span>
                    </div>
                </md-step>
                <md-step :md-error="confirmError" :md-editable="false" id="confirm" md-label="Confirm" :md-done.sync="confirm">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Confirm & Place Bid</h3>
                        <div style="cursor: pointer;" @click="confirmCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    <div><center>You will place a bid of</center></div>
                    <div style="margin-top: 10px;"><center>{{ displayDaiBidAmount }}<img src="../assets/dai-logo.png" style="margin-left: 5px; max-height: 20px;"/> DAI</center></div>  
                    <div style="margin-top: 5px;"><center>for</center></div>
                    <div v-if="flipAuctionParams.currency == 'ETH'" style="margin-top: 5px;"><center>{{ displayGemBidAmount }} <img src="../assets/ethereum-logo.png" style="margin-left: 5px; max-height: 20px;"/> ETH</center></div>
                    <div v-if="flipAuctionParams.currency == 'BAT'" style="margin-top: 5px;"><center>{{ displayGemBidAmount }} <img src="../assets/bat-logo.png" style="margin-left: 5px; max-height: 20px;"/> BAT</center></div>
                    <div v-if="flipAuctionParams.currency == 'USDC'" style="margin-top: 5px;"><center>{{ displayGemBidAmount }} <img src="../assets/usdc-logo.png" style="margin-left: 5px; max-height: 20px;"/> USDC</center></div>
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    The auction can run until {{ flipAuctionParams.lateEndDate }}.<br />
                    Your DAI will be locked in the auction until it ends or someone else places a higher bid than you.
                    <div style="margin-top: 15px;">
                        <center>
                            <md-checkbox :disabled="!confirmCheckboxEnabled" v-model="confirmCheckboxSet">I have read and understood the above, <a @click="openHowItWorks" class="link">HOW IT WORKS</a> and <a @click="openAbout" class="link">ABOUT</a></md-checkbox>
                        </center>
                    </div>
                    <div>
                        <center>
                            <md-button @click="confirmClicked" style="margin-top: 5px;" class="md-raised md-accent" :disabled="!confirmButtonEnabled || !confirmCheckboxSet">
                                Place Bid
                            </md-button>
                        </center>
                    </div>
                    <md-divider v-if="confirmTx !== undefined || confirmError !== undefined" style="margin: 20px 0 10px 0;"></md-divider>
                    <div v-if="confirmTx !== undefined && confirmError === undefined">
                        <div style="display: flex; margin-bottom: 5px;">
                            <span style="flex: 1;"><center>Waiting for your transaction to be confirmed</center></span>
                            <span style="flex: 1;"><center><a target="_blank" :href="'https://etherscan.io/tx/' + confirmTx">{{ confirmTx.substring(0, 6) + '...' + confirmTx.substring(confirmTx.length - 4) }}</a></center></span>
                        </div>
                        <md-progress-bar class="md-accent" md-mode="indeterminate"></md-progress-bar>
                    </div>
                    <div v-if="confirmError !== undefined">
                        <h3 class="md-title" style="color: #ff1744 !important;">Oops!</h3>
                        <span>Your transaction <a target="_blank" :href="'https://etherscan.io/tx/' + confirmTx">{{ confirmTx.substring(0, 6) + '...' + confirmTx.substring(confirmTx.length - 4) }}</a> did not succeed. Someone probably placed a higher bid.</span>
                    </div>
                </md-step>
            </md-steppers>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BigNumber from 'bignumber.js'

export default {

  name: 'FlipAuctionBidOverlay',
  data() {
      return this.getInitialState()
  },
  methods: {
      getInitialState() {
        return {

            active: this.isProxyDeployed ? 'setBid' : 'proxySetup',
            proxySetup: this.isProxyDeployed ? true : false,
            setBid: false,
            approve: false,
            confirm: false,

            proxySetupButtonEnabled: true,
            proxySetupTx: undefined,
            proxySetupError: undefined,

            setBidAmount: '',
            setBidAmountError: '',
            setBidPull: BigNumber(0),

            approveAlways: false,
            approveSingle: false,
            approveAlwaysButtonEnabled: true,
            approveSingleButtonEnabled: true,
            approveButtonEnabled: true,
            approveTx: undefined,
            approveError: undefined,

            confirmButtonEnabled: true,
            confirmCheckboxSet: false,
            confirmCheckboxEnabled: true,
            confirmTx: undefined,
            confirmError: undefined,
        }
      },
      reset: function() {
          Object.assign(this.$data, this.getInitialState())
      },
      setupClicked: function() {
          this.proxySetupButtonEnabled = false
          this.deployProxy({
              txCallback: this.setupProxyTxCallback,
              finishedCallback: this.setupFinishedCallback,
              })
      },
      setupProxyTxCallback: function(tx) {
          this.proxySetupTx = tx
      },
      setupFinishedCallback: function(success) {

          if(!success) {
              if(this.proxySetupTx !== undefined) {
                  this.proxySetupError = 'Error'
              } else {
                  this.proxySetupButtonEnabled = true
              }
              return
          }

          this.active = 'setBid'
      },
      setupProxyCloseClicked: function() {
          if(this.proxySetupError === undefined && !this.proxySetupButtonEnabled) {
              return
          }
          this.setShowFlipAuctionBidOverlay(false)
      },
      setBidAmountChanged: function() {

          if(this.setBidAmount === '') {
              this.setBidAmountError = ''
              return
          }

          const float = +this.setBidAmount
          if(isNaN(float) || !(float > 0.0)) {
              this.setBidAmountError = 'Invalid input'
              return
          }

          if(this.flipAuctionParams.raw.phase === 'DAI') {
              const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
              const bid = BN45(this.setBidAmount).multipliedBy(BN45(10).exponentiatedBy(BN45(45)))
              const tab = BN45(this.flipAuctionParams.raw.tab)
              const totalBalance = BN45(this.totalBalanceBNOfToken('DAI')).multipliedBy(BN45(10).exponentiatedBy(BN45(27)))

              if(bid.isGreaterThan(totalBalance)) {
                  this.setBidAmountError = 'Not enough DAI balance'
                  return
              }

              const currentBid = BN45(this.flipAuctionParams.raw.bid)
              if(bid.isGreaterThan(tab)) {
                  this.setBidAmountError = 'Higher than max. bid'
                  return
              }

              
              const one = BigNumber('10').exponentiatedBy('18')
              const beg = this.flipperBeg(this.flipAuctionParams.currency)

              if(!(bid.isEqualTo(tab)) &&
                 !(bid.multipliedBy(one).isGreaterThanOrEqualTo(currentBid.multipliedBy(beg)))) {
                  this.setBidAmountError = 'Insufficient DAI increase'
                  return
              }

              this.setBidAmountError = ''

          } else {
              const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
              const requiredBalance = BN45(this.flipAuctionParams.raw.bid)
              const totalBalance = BN45(this.totalBalanceBNOfToken('DAI')).multipliedBy(BN45(10).exponentiatedBy(BN45(27)))
              if(requiredBalance.isGreaterThan(totalBalance)) {
                  this.setBidAmountError = 'Not enough DAI balance'
                  return
              }

              const currentLot = this.flipAuctionParams.raw.lot
              const lot = BigNumber(this.setBidAmount).multipliedBy(BigNumber(10).exponentiatedBy(BigNumber(18)))
              const one = BigNumber('10').exponentiatedBy('18')
              const beg = this.flipperBeg(this.flipAuctionParams.currency)

              if(!(beg.multipliedBy(lot).isLessThanOrEqualTo(currentLot.multipliedBy(one)))) {
                  this.setBidAmountError = `Insufficient ${this.flipAuctionParams.currency} decrease`
                  return
              }

              this.setBidAmountError = ''
          }
      },
      setBidAutoClicked: function() {
          if(this.flipAuctionParams.raw.phase === 'DAI') {
              const currentBid = this.flipAuctionParams.raw.bid

              if(currentBid.isEqualTo(BigNumber(0))) {
                  this.setBidAmount = '0.0001'
                  return
              }

              const beg = this.flipperBeg(this.flipAuctionParams.currency)
              const one = BigNumber('10').exponentiatedBy('18')
              const bid = beg.multipliedBy(currentBid).dividedBy(one)

              if(bid.isGreaterThan(this.flipAuctionParams.raw.tab)) {
                  // We need very high precision here
                  const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
                  this.setBidAmount = BN45(this.flipAuctionParams.raw.tab).dividedBy(BN45(10).exponentiatedBy(BN45(45))).toString(10).replace(/,/g, '')
              } else {
                  const formattedBid = bid.dividedBy(BigNumber('10').exponentiatedBy('45'))
                            .toFormat(this.displayDecimalsOfToken('DAI'), BigNumber.ROUND_UP)

                  // Can we format it nicely?
                  const formattedBidBN = BigNumber(formattedBid).multipliedBy(BigNumber(10).exponentiatedBy(45))
                  if(formattedBidBN.isGreaterThan(this.flipAuctionParams.raw.tab)) {
                      // nope
                      // We need very high precision here
                    const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
                    this.setBidAmount = BN45(this.flipAuctionParams.raw.tab).dividedBy(BN45(10).exponentiatedBy(BN45(45))).toString(10).replace(/,/g, '')
                  } else {
                      this.setBidAmount = formattedBid.replace(/,/g, '')
                  }
              }
          } else {
              const currentLot = this.flipAuctionParams.raw.lot
              const beg = this.flipperBeg(this.flipAuctionParams.currency)
              const one = BigNumber('10').exponentiatedBy('18')
              const lot = currentLot.multipliedBy(one).dividedBy(beg)
              
              this.setBidAmount = lot.dividedBy(BigNumber('10').exponentiatedBy('18'))
                                  .toFormat(this.displayDecimalsOfToken(this.flipAuctionParams.currency), BigNumber.ROUND_DOWN).replace(/,/g, '')
          }
      },
      setBidCloseClicked: function() {
          this.setShowFlipAuctionBidOverlay(false)
      },
      setBidContinueClicked: function() {

          const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
          let requiredDai
          if(this.flipAuctionParams.raw.phase == 'DAI') {
              requiredDai = BN45(this.setBidAmount).multipliedBy(BN45(10).exponentiatedBy(BN45(45)))
          } else {
              requiredDai = BN45(this.flipAuctionParams.raw.tab)
          }

          const depositedBalance = this.depositedBNBalanceOfToken('DAI').multipliedBy(BN45(10).exponentiatedBy(BN45(27)))
          const diff = requiredDai.minus(depositedBalance)
          if(diff.isGreaterThan(BN45(0))) {
              this.setBidPull = diff.dividedBy(BN45(10).exponentiatedBy(BN45(27)))
          } else {
              this.setBidPull = BN45(0)
          }

          const allowance = this.allowanceBNOfToken('DAI')
          if(this.setBidPull.isEqualTo(BN45(0)) ||
             allowance.isGreaterThan(this.setBidPull)) {
             this.active = 'confirm'
          } else {
              this.active = 'approve'
          }
      },
      approveClicked: function() {
          
          this.approveButtonEnabled = false
          this.approveSingleButtonEnabled = false
          this.approveAlwaysButtonEnabled = false
          
          if(this.approveAlways) {
              this.approveTokenMax({
                  token: 'DAI',
                  txCallback: this.approveTxCallback,
                  finishedCallback: this.approveFinishedCallback,
              })
          } else {
              this.approveTokenAmountBN({
                  token: 'DAI',
                  amount: this.setBidPull,
                  txCallback: this.approveTxCallback,
                  finishedCallback: this.approveFinishedCallback,
              })
          }
      },
      approveTxCallback: function(tx) {
          this.approveTx = tx
      },
      approveFinishedCallback: function(success) {

          if(!success) {
              if(this.approveTx !== undefined) {
                  this.approveError = 'Error'
              } else {
                  this.approveSingleButtonEnabled = true
                  this.approveAlwaysButtonEnabled = true
                  this.approveButtonEnabled = true
              }
              return
          }

          this.active = 'confirm'
      },
      approveCloseClicked: function() {
          if(this.approveError === undefined && !this.approveButtonEnabled) {
              return
          }
          this.setShowFlipAuctionBidOverlay(false)
      },
      confirmClicked: function() {

          this.confirmButtonEnabled = false
          this.confirmCheckboxEnabled = false

          const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
          if(this.flipAuctionParams.raw.phase === 'DAI') {
              this.flipBidDai({
                  auctionParams: this.flipAuctionParams,
                  pullBN: this.setBidPull,
                  bidBN: BN45(this.setBidAmount).multipliedBy(BN45(10).exponentiatedBy(BN45(45))),
                  txCallback: this.confirmTxCallback,
                  finishedCallback: this.confirmFinishedCallback,
              })
          } else {
              this.flipReduceLot({
                  auctionParams: this.flipAuctionParams,
                  pullBN: this.setBidPull,
                  lotBN: BN45(this.setBidAmount).multipliedBy(BN45(10).exponentiatedBy(BN45(18))),
                  txCallback: this.confirmTxCallback,
                  finishedCallback: this.confirmFinishedCallback,
              })
          }
          
      },
      confirmTxCallback: function(tx) {
          this.confirmTx = tx
      },
      confirmFinishedCallback: function(success) {
          if(!success) {
              if(this.confirmTx !== undefined) {
                  this.confirmError = 'Error'
              } else {
                  this.confirmCheckboxEnabled = true
                  this.confirmButtonEnabled = true
              }
              return
          }

          this.setShowFlipAuctionBidOverlay(false)
      },
      confirmCloseClicked: function() {
          if(this.confirmError === undefined && !this.confirmButtonEnabled) {
              return
          }
          this.setShowFlipAuctionBidOverlay(false)
      },
      openHowItWorks: function() {
          window.open('/#/howitworks')
          
      },
      openAbout: function() {
          window.open('/#/about')
      },
       ...mapActions(['setShowFlipAuctionBidOverlay', 'deployProxy', 'approveTokenMax', 'approveTokenAmountBN', 'flipBidDai', 'flipReduceLot'])
  },
  computed: {
      displayDaiBidAmount: function() {
        if(this.flipAuctionParams.raw.phase === 'DAI') {
            return BigNumber(this.setBidAmount).toFixed(this.displayDecimalsOfToken('DAI'), BigNumber.ROUND_UP)
        } else {
            return BigNumber(this.flipAuctionParams.raw.bid).dividedBy(BigNumber(10).exponentiatedBy(BigNumber(45))).toFixed(this.displayDecimalsOfToken('DAI'), BigNumber.ROUND_UP)
        }
      },
      displayGemBidAmount: function() {
          if(this.flipAuctionParams.raw.phase === 'DAI') {
              return BigNumber(this.flipAuctionParams.raw.lot).dividedBy(BigNumber(10).exponentiatedBy(BigNumber(18))).toFixed(this.displayDecimalsOfToken(this.flipAuctionParams.currency), BigNumber.ROUND_DOWN)
          } else {
              return BigNumber(this.setBidAmount).toFixed(this.displayDecimalsOfToken(this.flipAuctionParams.currency), BigNumber.ROUND_DOWN)
          }
          
      },
      ...mapGetters([
        'web3',
        'showFlipAuctionBidOverlay',
        'flipAuctionParams',
        'flipperBeg',
        'isProxyDeployed',
        'walletDisplayBalanceOfToken',
        'depositedBNBalanceOfToken',
        'depositedDisplayBalanceOfToken',
        'totalBalanceBNOfToken',
        'displayDecimalsOfToken',
        'allowanceBNOfToken']),
  }, 
  watch: {
      showFlipAuctionBidOverlay: function() {
          this.reset()
      }
  }
}
</script>

<style scoped>

@keyframes overlayAnimation {
 0% {background-color: rgba(50, 50, 50, 0.0);}
 100% {background-color: rgba(50, 50, 50, 0.8);}
}

.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(50, 50, 50, 0.8);
    z-index: 99;

    animation-name: overlayAnimation;
    -webkit-animation-name: overlayAnimation;
    animation-duration: 0.5s;
}

.hide {
    display: none;
}

.content {
    position: absolute;
    left: 50%;
    top: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    background-color: white;
}


.greyText {
    text-align: left;
    color: var(--md-theme-default-text-accent-on-background, rgba(0, 0, 0, 0.54));
}

.notVisible {
    visibility: hidden;
}

.noDisplay {
    display: none;
}

.accent {
    color: #16a085 !important;
}

.link {
    text-decoration: none !important;
}

</style>
