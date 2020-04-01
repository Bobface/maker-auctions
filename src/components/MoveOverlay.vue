<template>
    <div 
    :class="{overlay: true, hide: !showMoveOverlay}"
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

                <md-step :md-editable="false" id="selectToken" md-label="Select Token" :md-done.sync="selectToken">
                    <div style="display: flex; align-items: center;">
                        <h3 class="md-title" style="flex: 1;">Select Token</h3>
                        <div style="cursor: pointer;" @click="selectTokenCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; flex-direction: row;">
                        <md-button @click="selectTokenTokenSelected('ETH')" :class="{'md-raised': selectTokenSelectedToken === 'ETH', 'md-accent': selectTokenSelectedToken === 'ETH'}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <img src="../assets/ethereum-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                                    <span>ETH</span>
                                </div>
                            </div>
                        </md-button>
                        <md-button @click="selectTokenTokenSelected('MKR')" :class="{'md-raised': selectTokenSelectedToken === 'MKR', 'md-accent': selectTokenSelectedToken === 'MKR'}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <img src="../assets/mkr-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                                    <span>MKR</span>
                                </div>
                            </div>
                        </md-button>
                        <md-button @click="selectTokenTokenSelected('DAI')" :class="{'md-raised': selectTokenSelectedToken === 'DAI', 'md-accent': selectTokenSelectedToken === 'DAI'}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <img src="../assets/dai-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                                    <span>DAI</span>
                                </div>
                            </div>
                        </md-button>
                        <md-button @click="selectTokenTokenSelected('BAT')" :class="{'md-raised': selectTokenSelectedToken === 'BAT', 'md-accent': selectTokenSelectedToken === 'BAT'}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <img src="../assets/bat-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                                    <span>BAT</span>
                                </div>
                            </div>
                        </md-button>
                        <md-button @click="selectTokenTokenSelected('USDC')" :class="{'md-raised': selectTokenSelectedToken === 'USDC', 'md-accent': selectTokenSelectedToken === 'USDC'}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <img src="../assets/usdc-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                                    <span>USDC</span>
                                </div>
                            </div>
                        </md-button>
                    </div>
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    <h3 class="md-title" style="flex: 1;">Select Direction</h3>

                    <div style="display: flex; align-items: center; flex-direction: row;">
                        <md-button @click="selectTokenDepositClicked" :class="{'md-raised': selectTokenDeposit, 'md-accent': selectTokenDeposit}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <span>Deposit</span>
                                </div>
                            </div>
                        </md-button>
                        <md-button @click="selectTokenWithdrawClicked" :class="{'md-raised': selectTokenWithdraw, 'md-accent': selectTokenWithdraw}" style="flex: 1; margin: 0; padding: 0;">
                            <div style="display:flex; flex-direction: row;">
                                <div style="flex: 1;">
                                    <span>Withdraw</span>
                                </div>
                            </div>
                        </md-button>
                    </div>
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    <h3 class="md-title" style="flex: 1;">Select Amount</h3>

                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <md-field style="margin: 0 0 5px 0;">
                            <label>Amount</label>
                            <span class="md-prefix">{{selectTokenSelectedToken}}</span>
                            <md-input v-model="selectTokenAmount" @input="selectTokenAmountChanged" :disabled="selectTokenSelectedToken === '' || (!selectTokenDeposit && !selectTokenWithdraw)"></md-input>
                        </md-field>
                        <md-button @click="selectTokenSetMaxClicked" style="flex: 1;" class="md-dense md-raised md-primary" :disabled="selectTokenSelectedToken === '' || (!selectTokenDeposit && !selectTokenWithdraw)">Set Max</md-button>
                    </div>
                    <div style="color: #ff1744 !important;" :class="{noDisplay: selectTokenAmountError === ''}">{{selectTokenAmountError}}</div>
                    <span :class="{'notVisible': selectTokenSelectedToken === '' || (!selectTokenDeposit && !selectTokenWithdraw), 'md-caption' : true}">Available in {{selectTokenDeposit ? 'Wallet' : 'Deposited'}}: {{selectTokenDeposit ? walletDisplayBalanceOfToken(selectTokenSelectedToken) : depositedDisplayBalanceOfToken(selectTokenSelectedToken)}}</span>
                
                    <md-divider style="margin: 20px 0 10px 0;"></md-divider>
                    <center>
                        <md-button @click="selectTokenContinueClicked" class="md-raised md-accent" :disabled="selectTokenSelectedToken === '' || (!selectTokenDeposit && !selectTokenWithdraw) || selectTokenAmount === '' || selectTokenAmountError !== ''">
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
                    <p>Your proxy contract needs to be allowed to access your {{ selectTokenSelectedToken }} to transfer them for you.<br />
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
                        <h3 class="md-title" style="flex: 1;">Confirm & Send</h3>
                        <div style="cursor: pointer;" @click="confirmCloseClicked">
                            <center><span ><md-icon class="md-size-1x">close</md-icon></span></center>
                            <center><span class="md-caption" style="margin-top: 10px; color: #ABABAB;" >CLOSE</span></center>
                        </div>
                    </div>
                    
                    <center>
                        <span class="md-title">{{ this.selectTokenDeposit ? 'Deposit' : 'Withdraw' }}</span><br />
                        <div style="margin: 10px 0 10px 0;">
                            <img v-if="selectTokenSelectedToken === 'ETH'" src="../assets/ethereum-logo.png" style="max-height: 30px; margin-right: 5px;"/>
                            <img v-if="selectTokenSelectedToken === 'DAI'" src="../assets/dai-logo.png" style="max-height: 30px; margin-right: 5px;"/> 
                            <img v-if="selectTokenSelectedToken === 'BAT'" src="../assets/bat-logo.png" style="max-height: 30px; margin-right: 5px;"/>
                            <img v-if="selectTokenSelectedToken === 'USDC'" src="../assets/usdc-logo.png" style="max-height: 30px; margin-right: 5px;"/>
                            <img v-if="selectTokenSelectedToken === 'MKR'" src="../assets/mkr-logo.png" style="max-height: 30px; margin-right: 5px;"/>
                            <span class="md-caption" style="color: #ABABAB !important;">{{ selectTokenSelectedToken }}</span>
                            <span style="margin-left: 15px;">{{ selectTokenAmount }}</span>
                        </div>
                        <div style="margin-top: 30px;">
                            <center>
                                <md-checkbox :disabled="!confirmCheckboxEnabled" v-model="confirmCheckboxSet">I have read and understood the above, <a @click="openHowItWorks" class="link">HOW IT WORKS</a> and <a @click="openAbout" class="link">ABOUT</a></md-checkbox>
                            </center>
                        </div>
                        <md-button style="margin-top: 5px;" @click="confirmClicked" class="md-raised md-accent" :disabled="!confirmButtonEnabled || !confirmCheckboxSet">
                            Confirm
                        </md-button>
                    </center>
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
                        <span>Your transaction <a target="_blank" :href="'https://etherscan.io/tx/' + confirmTx">{{ confirmTx.substring(0, 6) + '...' + confirmTx.substring(confirmTx.length - 4) }}</a> did not succeed. Maybe it ran out of gas?</span>
                    </div>
                </md-step>
            </md-steppers>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BigNumber from 'bignumber.js';

export default {

  name: 'MoveOverlay',
  data() {
      return this.getInitialState()
  },
  methods: {
      getInitialState() {
        return {
            active: this.isProxyDeployed ? 'selectToken' : 'proxySetup',
            proxySetup: this.isProxyDeployed ? true : false,
            selectToken: false,
            approve: false,
            confirm: false,

            proxySetupButtonEnabled: true,
            proxySetupTx: undefined,
            proxySetupError: undefined,

            selectTokenSelectedToken: '',
            selectTokenDeposit: false,
            selectTokenWithdraw: false,
            selectTokenAmount: '',
            selectTokenAmountError: '',

            approveAlways: false,
            approveSingle: false,
            approveAlwaysButtonEnabled: true,
            approveSingleButtonEnabled: true,
            approveButtonEnabled: true,
            approveTx: undefined,
            approveError: undefined,

            confirmButtonEnabled: true,
            confirmCheckboxEnabled: true,
            confirmCheckboxSet: false,
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

          this.active = 'selectToken'
      },
      setupProxyCloseClicked: function() {
          if(this.proxySetupError === undefined && !this.proxySetupButtonEnabled) {
              return
          }
          this.setShowMoveOverlay(false)
      },
      selectTokenCloseClicked: function() {
          this.setShowMoveOverlay(false)
      },
      selectTokenTokenSelected: function(token) {
          this.selectTokenSelectedToken = token
      },
      selectTokenDepositClicked: function() {
          this.selectTokenDeposit = true
          this.selectTokenWithdraw = false
      },
      selectTokenWithdrawClicked: function() {
          this.selectTokenDeposit = false
          this.selectTokenWithdraw = true
      },
      selectTokenAmountChanged: function() {

          if(this.selectTokenAmount === '') {
              this.selectTokenAmountError = ''
              return
          }

          let bal
          if(this.selectTokenDeposit) {
              bal = this.walletBNBalanceOfToken(this.selectTokenSelectedToken)
          } else {
              bal = this.depositedBNBalanceOfToken(this.selectTokenSelectedToken)
          }

          const float = +this.selectTokenAmount // strict conversion to number
          if(isNaN(float) || !(float > 0.0)) {
              this.selectTokenAmountError = 'Invalid input'
          } else {

              const floatBN = BigNumber(float).multipliedBy(BigNumber(10).exponentiatedBy(BigNumber(18)))
              if(floatBN.isGreaterThan(bal)) {
                  this.selectTokenAmountError = 'Amount too high'
              } else {
                this.selectTokenAmountError = ''
              }
          }
      },
      selectTokenSetMaxClicked: function() {
          let bal
          if(this.selectTokenDeposit) {
              bal = this.walletDisplayBalanceOfToken(this.selectTokenSelectedToken).replace(/,/g, '')
          } else {
              bal = this.depositedDisplayBalanceOfToken(this.selectTokenSelectedToken).replace(/,/g, '')
          }

          this.selectTokenAmount = bal
      },
      selectTokenContinueClicked: function() {
          if(this.selectTokenSelectedToken === 'ETH' || this.selectTokenWithdraw) {
              this.active = 'confirm'
          } else {
              const amount = BigNumber(this.selectTokenAmount).multipliedBy(BigNumber(10).exponentiatedBy(BigNumber(18)))
              const allowance = this.allowanceBNOfToken(this.selectTokenSelectedToken)

              if(allowance.isLessThan(amount)) {
                  this.active = 'approve'
              } else {
                  this.active = 'confirm'
              }
          }

      },
      approveClicked: function() {
          
          this.approveButtonEnabled = false
          this.approveSingleButtonEnabled = false
          this.approveAlwaysButtonEnabled = false
          
          if(this.approveAlways) {
              this.approveTokenMax({
                  token: this.selectTokenSelectedToken,
                  txCallback: this.approveTxCallback,
                  finishedCallback: this.approveFinishedCallback,
              })
          } else {
              this.approveTokenAmount({
                  token: this.selectTokenSelectedToken,
                  amount: this.selectTokenAmount,
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
          this.setShowMoveOverlay(false)
      },
      confirmClicked: function() {
          if(this.selectTokenDeposit) {
              this.depositToken({
                  token: this.selectTokenSelectedToken,
                  amount: this.selectTokenAmount,
                  txCallback: this.confirmTxCallback,
                  finishedCallback: this.confirmFinishedCallback,
              })
          } else {
              this.withdrawToken({
                  token: this.selectTokenSelectedToken,
                  amount: this.selectTokenAmount,
                  txCallback: this.confirmTxCallback,
                  finishedCallback: this.confirmFinishedCallback,
              })
          }

          this.confirmButtonEnabled = false
          this.confirmCheckboxEnabled = false
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

          this.setShowMoveOverlay(false)
      },
      confirmCloseClicked: function() {
          if(this.confirmTx !== undefined) {
              return
          }
          this.setShowMoveOverlay(false)
      },
      openHowItWorks: function() {
          window.open('/#/howitworks')
          
      },
      openAbout: function() {
          window.open('/#/about')
      },
       ...mapActions(['setShowMoveOverlay', 'deployProxy', 'approveTokenMax', 'approveTokenAmount', 'depositToken', 'withdrawToken'])
  },
  computed: mapGetters([
    'showMoveOverlay',
    'isProxyDeployed',
    'walletDisplayBalanceOfToken',
    'depositedDisplayBalanceOfToken',
    'walletBNBalanceOfToken',
    'depositedBNBalanceOfToken',
    'allowanceBNOfToken']),
  watch: {
      showMoveOverlay: function() {
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

</style>
