<template>
    <div 
    :class="{overlay: true, hide: !showConnectWeb3Dialog}"
    >
        <div class="content">
            <h1 class="md-display-3" style="color: #FAFAFA; padding: 0; margin-bottom: 20px;">Select your Wallet</h1>
            <md-divider style="background-color: #FAFAFA;" />
            <div class="md-layout" style="margin-top: 20px;">
                <div class="md-layout-item">
                    <center>
                        <div>
                            <img style="cursor: pointer;" src="../assets/metamask-fox.png" alt="Metamask" width="108" height="100" @click="metamaskSelected"/><br />
                            <div style="margin-top: 10px; color: #ABABAB;">METAMASK</div>
                        </div>
                    </center>
                </div>
            </div>
            <div style="display: flex; margin: 30px 50px 30px 50px; align-items: center;">
                <div style="flex: 1; height: 1px; background-color: #ABABAB;"></div>
                <div style="color: #ABABAB; margin: 0 10px 0 10px;"><center>or</center></div>
                <div style="flex: 1; height: 1px; background-color: #ABABAB;"></div>
            </div>
            <center><span @click="closeClicked" style="cursor: pointer;"><md-icon class="md-size-3x">close</md-icon></span></center>
            <center><span style="margin-top: 10px; color: #ABABAB; cursor: pointer;" @click="closeClicked" >CLOSE</span></center>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'Web3Overlay',
  methods: {
      metamaskSelected: function() {
          this.connectMetamask()
      },
      closeClicked: function() {
          this.hideConnectWeb3Dialog()
      },
      ...mapActions(['hideConnectWeb3Dialog', 'connectMetamask'])
  },
  computed: mapGetters(['showConnectWeb3Dialog']),
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
}


</style>
