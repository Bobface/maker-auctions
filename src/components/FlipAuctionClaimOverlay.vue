<template>
    <div 
    :class="{overlay: true, hide: !showFlipAuctionClaimOverlay}"
    v-if="flipAuctionParams !== undefined"
    >
        <div class="content" style="min-width: 600px; max-width: 950px;">
            <md-steppers :md-active-step.sync="active" md-linear>
                <md-step :md-error="confirmError" :md-editable="false" id="confirm" md-label="Confirm" :md-done.sync="confirm">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Confirm & Claim</h3>
                        <div style="cursor: pointer;" @click="confirmCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    <div style="margin-top: 15px;"><center>You will claim</center></div>
                    <div style="margin-top: 10px;">
                        <center>
                            {{displayClaimAmount}}
                            <img v-if="flipAuctionParams.currency === 'ETH'" src="../assets/ethereum-logo.png" style="margin-left: 5px; max-height: 20px;"/>
                            <img v-if="flipAuctionParams.currency === 'BAT'" src="../assets/bat-logo.png" style="margin-left: 5px; max-height: 20px;"/>
                            <img v-if="flipAuctionParams.currency === 'USDC'" src="../assets/usdc-logo.png" style="margin-left: 5px; max-height: 20px;"/>

                            {{ flipAuctionParams.currency }}
                        </center>
                    </div>
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    <div style="margin-top: 15px;">
                        <center>
                            <md-checkbox :disabled="!confirmCheckboxEnabled" v-model="confirmCheckboxSet">I have read and understood the above, <a @click="openHowItWorks" class="link">HOW IT WORKS</a> and <a @click="openAbout" class="link">ABOUT</a></md-checkbox>
                        </center>
                    </div>
                    <div>
                        <center>
                            <md-button @click="confirmClicked" style="margin-top: 5px;" class="md-raised md-accent" :disabled="!confirmButtonEnabled || !confirmCheckboxSet">
                                Claim
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

  name: 'FlipAuctionClaimOverlay',
  data() {
      return this.getInitialState()
  },
  methods: {
      getInitialState() {
        return {

            active: 'confirm',
            confirm: true,

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
      confirmClicked: function() {

          this.confirmButtonEnabled = false
          this.confirmCheckboxEnabled = false

          this.flipClaimAndExit({
              auctionParams: this.flipAuctionParams,
              txCallback: this.confirmTxCallback,
              finishedCallback: this.confirmFinishedCallback,
          })
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

          this.setShowFlipAuctionClaimOverlay(false)
      },
      confirmCloseClicked: function() {
          if(this.confirmTx !== undefined) {
              return
          }
          this.setShowFlipAuctionClaimOverlay(false)
      },
      openHowItWorks: function() {
          window.open('/#/howitworks')
          
      },
      openAbout: function() {
          window.open('/#/about')
      },
       ...mapActions(['setShowFlipAuctionClaimOverlay', 'deployProxy', 'flipClaimAndExit'])
  },
  computed: {
      displayClaimAmount: function() {
          const BN45 = BigNumber.clone({ DECIMAL_PLACES: 45})
          const bn = BN45(this.flipAuctionParams.raw.lot).dividedBy(BN45(10).exponentiatedBy(BN45(18)))
          return bn.toFixed(this.displayDecimalsOfToken(this.flipAuctionParams.currency), BigNumber.ROUND_DOWN)
      },
      ...mapGetters([
        'web3',
        'flipAuctionParams',
        'showFlipAuctionClaimOverlay',
        'displayDecimalsOfToken',
        'decimalsOfToken'
        ]),
  }, 
  watch: {
      showFlipAuctionClaimOverlay: function() {
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
