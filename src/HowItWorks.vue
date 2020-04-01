<template>
  <div style="height: 100%; display:flex; flex-direction: column;">
    <Header selected="howItWorks" />
    <div class="md-layout" style="flex: 1;">
      <div class="md-layout-item md-size-75" style="text-align: justify; background-color: white !important; padding: 30px;">
          <div class="md-display-1" ref="auctionsHeader">1. AUCTIONS</div>
          <p>
              There are three different kinds of auctions in the MakerDAO system: Flip, Flap and Flop.
              <br />
              Each of them serves a different purpose - however all of them are required to keep the system stable.
              Unlike classical centralized exchanges (CEX) MakerDAO auctions run completely on the Ethereum blockchain by utilizing smart contracts,
              thereby enabling anyone to participate.
              <br />
              <br />
              <strong>
                The auctions are not in any way held or managed by this service.
                This website solely provides an interface to the MakerDAO auctions running on the Ethereum blockchain.
              </strong>
          </p>
          <div class="md-title" ref="flipAuctionsSubheader">1.1 Flip auctions</div>
          <p>
              When a user's Collateralized Dept Position (CDP) falls below the collateralization ratio his/her collateral 
              is auctioned off in exchange for Dai in a flip auction.
              <i>His/Her collateral is flipped for Dai</i>. 
              This way the system can remain stable (i.e. not become undercollateralized) in most market situations.
              <br /><br />
              The flip auction starts with an initial bid of 0 Dai for the liquidated collateral. 
              Participants can then place their bids in Dai up to the maximum value which is the total debt in Dai of the liquidated CDP. Placing a higher Dai bid than the maximum bid is not possible.
              <br />
              When the maximum Dai bid is reached the auction enters the second phase. Instead of bidding more Dai, participants now bid 
              the maximum Dai value for an decreasing amount of the liquidated collateral.
              <br />
              It is important to note that the second phase does not have to be reached. The auction can end successfully with a lower Dai bid than the total debt of the liquidated CDP.
          </p>
          <div class="md-title" ref="flapAuctionsSubheader">1.2 Flap auctions</div>
          <p>
              The Dai debt from a CDP accrues interest - the interest rate is known as the Stability Fee (SF). On the other hand, Dai holders
              can freeze their Dai and be paid interest - called the Dai Savings Rate (DSR). Since all Dai in existence originate from a CDP and not all
              Dai holders freeze their Dai there is a difference in interest accrued and interest paid out. This difference is known as <i>Surplus</i>
              which is partly auctioned off in flap auctions in exchange for MKR tokens.
              <br />
              <br />
              Unlike flip auctions the flap auction does not have two phases and is more like a classic auction - the highest bid wins.
          </p>
          <div class="md-title" ref="flopAuctionsSubheader">1.3 Flop auctions</div>
          <p>
              As described above, flip auctions can handle most market situations. However, there can be negative price movements so fast that the system cannot
              maintain its collateralization and becomes undercollateralized. This is where the flop auctions come in. 
              <i>The system flopped and is undercollateralized</i>.
              <br />
              <br />
              Flop auctions are the opposite of flap auctions. New MKR are minted and auctioned off to cover the Dai debt of the system. 
              The auction asks for a fixed amount of Dai. Bidders decrease the amount of MKR they accept for paying the fixed amount of Dai. The lowest bid wins.
          </p>
          <div class="md-title" ref="auctionsBehaviourSubheader">1.4 Behaviour across all auction types</div>
          <p>
              All auction types share some similar behaviour:
              <ul>
                  <li>
                      Bids are not retractable
                  </li>
                  <li>
                      Bids have to be paid directly, not at the end of the auction.
                      If a higher bid is placed the overbid participant's funds will be refunded automatically
                  </li>
                  <li>
                      When an auction ends without a single bid it can be restarted.
                      Flop auctions also increase the amount of MKR they offer when restarted
                  </li>
                  <li>
                      Bids must at least increase (or decrease for the second phase of flip auctions) by a given percentage
                  </li>
                  <li>
                      The winner of an auction is not automatically paid out. He/she has to claim the funds
                  </li>
                  <li>
                      Auctions can end in two ways. After the first bid is placed, a timer starts with a fixed duration.
                      If no higher bid is received within that duration the auction ends.
                      If a higher bid is received within that duration the timer resets and starts again
                      <br />
                      However auctions also have a fixed end at which they will end no matter if bids are still actively being placed.
                  </li>
              </ul>
          </p>
          <div class="md-display-1" style="margin-top: 30px;" ref="balancesHeader">2. BALANCES</div>
          <p>
              You will see two different kinds of balances: Wallet and Deposited. Funds can be moved between them freely.
              <br />
              <br />
              <strong>
                  This service does not in any way hold custody of your funds.
                  Only you are responsible for and have access to your funds and your wallet's private key.
              </strong>
          </p>
          <div class="md-title" ref="balancesWalletSubheader">2.1 Wallet</div>
          <p>
              Just as you would expect, this is the balance of a given token in your wallet.
          </p>
          <div class="md-title" ref="balancesDepositedSubheader">2.2 Deposited</div>
          <p>
              Funds deposited into the MakerDAO system. If you participate in an auction and are overbid your bid will be refunded here.
              <br />
              <strong>It is not necessary to manually deposit funds to take part in an auction</strong>.
          </p>
          <div class="md-display-1" style="margin-top: 30px;" ref="faqHeader">3. FAQ</div>
          <ul>
            <li>
              <strong>Is this an official MakerDAO product?</strong><br />
              No. Maker Auctions is an independent project and is in no way associated with MakerDAO
            </li>
            <br />
            <li>
              <strong>Are there any fees?</strong><br />
              There are no fees apart from the gas fee which is required to make transactions on the Ethereum blockchain
            </li>
            <br />
            <li>
              <strong>How can I get in touch?</strong><br />
              Have a look at the <i>Community</i> section at <router-link class="link" to="/about">ABOUT</router-link>
            </li>
          </ul>
      </div>
      <div class="md-layout-item md-size-25" style="border-left: 1px solid #DBDBDB; padding: 30px 15px 15px 15px;">
        <div class="md-subheading sidebarHeader" style="margin-top: 0px;" @click="scrollTo('auctionsHeader')">1. AUCTIONS</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('flipAuctionsSubheader')">1.1 Flip auctions</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('flapAuctionsSubheader')">1.2 Flap auctions</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('flopAuctionsSubheader')">1.3 Flop auctions</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('auctionsBehaviourSubheader')">1.4 Behaviour across all auction types</div>

        <div class="md-subheading sidebarHeader" @click="scrollTo('balancesHeader')">2. BALANCES</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('balancesWalletSubheader')">2.1 Wallet</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('balancesDepositedSubheader')">2.2 Deposited</div>

        <div class="md-subheading sidebarHeader" @click="scrollTo('faqHeader')">3. FAQ</div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'

export default {
  name: 'HowItWorks',
  methods: {
    scrollTo(ref) {
        const element = this.$refs[ref];
        const top = element.offsetTop;
        window.scrollTo(0, top);
    }
  },
  components: {
    Header,
  },
}
</script>

<style>

html, body {
  height: 100%;
  min-height: 100%;
}

.selected {
  color: #16a085 !important;
  font-weight: bold !important;
}

.notSelected {
  color: #ABABAB !important;
}

.sidebarHeader {
    margin-top: 15px;
    cursor: pointer;
}

.sidebarSubheader {
    padding-left: 15px;
    cursor: pointer;
}

.link {
  text-decoration: none;
}

</style>
