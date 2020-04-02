<template>
  <div style="height: 100%; display:flex; flex-direction: column;">
    <Header selected="about" />
    <div class="md-layout" style="flex: 1;">
      <div class="md-layout-item md-size-75" style="text-align: justify; background-color: white !important; padding: 30px;">
          <div class="md-display-1" ref="aboutHeader">1. ABOUT MAKER AUCTIONS</div>
          <p>
            Maker Auctions provides an interface to the MakerDAO auctions running on the Ethereum blockchain.<br />
            If you are looking for information on how these auctions work head over to <router-link class="link" to="/howitworks">HOW IT WORKS</router-link>.
          </p>
          <div class="md-title" ref="isOfficialSubheader">1.1 Is this an official MakerDAO product?</div>
          <p>
            <strong>No</strong>. Maker Auctions is an independent project and is in no way associated with MakerDAO. 
          </p>
          <div class="md-title" ref="communitySubheader">1.2 Community</div>
          <p>
            <ul>
              <li><a href="https://discord.gg/vKcXSvH" target="_blank"><img src="https://discordapp.com/api/guilds/277884550850281473/widget.png?style=shield" alt=""></a></li>
            </ul>
          </p>
          <div class="md-title" ref="externalSubheader">1.3 External resources</div>
          <p>
            <ul>
              <li>Github: <a class="link" href="https://github.com/Bobface/maker-auctions" target="_blank">Bobface/maker-auctions</a></li>
              <li>MakerDAO: <a class="link" href="https://docs.makerdao.com/" target="_blank">Official Documentation</a></li>
            </ul>
          </p>
          <div class="md-title" ref="donationsSubheader">1.4 Donations</div>
          <p>
            If you want to support this project and help me cover the costs I would be glad to receive your donation at 0xE9B3c292904114e6e6F04a363Ae4c0F800f3236D.
          </p>
          <div class="md-display-1" ref="disclaimerHeader" style="margin-top: 30px;">2. DISCLAIMER FOR MAKER AUCTIONS</div>
          <p>If you require any more information or have any questions about our site's disclaimer, please feel free to contact us by email at maker-auctions@outlook.com</p>
          <div class="md-title" ref="disclaimerSubheader">2.1 Disclaimers for Maker Auctions</div>
          <p>All the information on this website - maker-auctions.io - is published in good faith and for general information purpose only. Maker Auctions does not make any warranties about the completeness, reliability and accuracy of this information. Any action you take upon the information you find on this website (Maker Auctions), is strictly at your own risk. Maker Auctions will not be liable for any losses and/or damages in connection with the use of our website. All services and products on this site are provided in an "as-is" condition. No guarantee is made for their functionality, availability, or use for an intended purpose. Our Disclaimer was generated with the help of the <a href="https://disclaimergenerator.net/">Disclaimer Generator</a> and the <a href="https://disclaimer-template.com">Disclaimer Template</a>.</p>
          <p>From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. These links to other websites do not imply a recommendation for all the content found on these sites. Site owners and content may change without notice and may occur before we have the opportunity to remove a link which may have gone 'bad'.</p>
          <p>Please be also aware that when you leave our website, other sites may have different privacy policies and terms which are beyond our control. Please be sure to check the Privacy Policies of these sites as well as their "Terms of Service" before engaging in any business or uploading any information.</p>
          <div class="md-title" ref="consentSubheader">2.2 Consent</div>
          <p>By using our website, you hereby consent to our disclaimer and agree to its terms.</p>
          <div class="md-title" ref="updateSubheader">2.3 Update</div>
          <p>Should we update, amend or make any changes to this document, those changes will be prominently posted here.</p>
          
          <div class="md-display-1" style="margin-top: 30px;" ref="privacyPolicyHeader">3. PRIVACY POLICY FOR MAKER AUCTIONS</div>
          <p>At Maker Auctions, accessible from maker-auctions.io, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Maker Auctions and how we use it.</p>
          <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us through email maker-auctions@outlook.com</p>

          <div class="md-title" ref="gdprSubheader">3.1 General Data Protection Regulation (GDPR)</div>
          <p>We are a Data Controller of your information.</p>

          <p>Maker Auctions legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Information we collect and the specific context in which we collect the information:</p>
          <ul>
            <li>Maker Auctions needs to perform a contract with you</li>
              <li>You have given Maker Auctions permission to do so</li>
              <li>Processing your personal information is in Maker Auctions legitimate interests</li>
              <li>Maker Auctions needs to comply with the law</li>
          </ul>
                
          <p>Maker Auctions will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies. Our Privacy Policy was generated with the help of <a href="https://gdprprivacynotice.com/">GDPR Privacy Policy Generator</a> and the <a href="https://privacypolicytemplate.net/">GDPR Privacy Policy Template</a>.</p> 

          <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights. If you wish to be informed what Personal Information we hold about you and if you want it to be removed from our systems, please contact us.</p>
          <p>In certain circumstances, you have the following data protection rights:</p>
          <ul>
            <li>The right to access, update or to delete the information we have on you.</li>
            <li>The right of rectification.</li> 
              <li>The right to object.</li>
              <li>The right of restriction.</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
          </ul>

          <div class="md-title" ref="logfilesSubheader">3.2 Log Files</div>
          <p>Maker Auctions follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>

          <div class="md-title" ref="cookiesSubheader">3.3 Cookies and Web Beacons</div>
          <p>Like any other website, Maker Auctions uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

          <div class="md-title" ref="privacyPoliciesSubheader">3.4 Privacy Policies</div>

          <p>You may consult this list to find the Privacy Policy for each of the advertising partners of Maker Auctions.</p>
          <p>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Maker Auctions, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>
          <p>Note that Maker Auctions has no access to or control over these cookies that are used by third-party advertisers.</p>
          <div class="md-title" ref="thirdPartySubheader">3.5 Third Pary Privacy Policies</div>
          <p>Maker Auctions's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. You may find a complete list of these Privacy Policies and their links here: Privacy Policy Links.</p>
          <p>You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites. What Are Cookies?</p>
          <div class="md-title" ref="childrenSubheader">3.6 Children's Information</div>
          <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
          <p>Maker Auctions does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>
          <div class="md-title" ref="onlinePrivacySubheader">3.7 Online Privacy Policy Only</div>
          <p>Our Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Maker Auctions. This policy is not applicable to any information collected offline or via channels other than this website.</p>
          <div class="md-title" ref="consentSubheader">3.8 Consent</div>
          <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>
      </div>
      <div class="md-layout-item md-size-25" style="border-left: 1px solid #DBDBDB; padding: 30px 15px 15px 15px;">
        <div class="md-subheading sidebarHeader" style="margin-top: 0px;" @click="scrollTo('aboutHeader')">1. ABOUT MAKER AUCTIONS</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('isOfficialSubheader')">1.1 Is this an official MakerDAO product?</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('communitySubheader')">1.2 Community</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('externalSubheader')">1.3 External resources</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('donationsSubheader')">1.4 Donations</div>

        <div class="md-subheading sidebarHeader" @click="scrollTo('disclaimerHeader')">2. DISCLAIMER FOR MAKER AUCTIONS</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('disclaimerSubheader')">2.1 Disclaimers for Maker Auctions</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('consentSubheader')">2.2 Consent</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('updateSubheader')">2.3 Update</div>

        <div class="md-subheading sidebarHeader" @click="scrollTo('privacyPolicyHeader')">3. PRIVACY POLICY FOR MAKER AUCTIONS</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('gdprSubheader')">3.1 General Data Protection Regulation (GDPR)</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('logfilesSubheader')">3.2 Log Files</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('cookiesSubheader')">3.3 Cookies and Web Beacons</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('privacyPoliciesSubheader')">3.4 Privacy Policies</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('thirdPartySubheader')">3.5 Third Pary Privacy Policies</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('childrenSubheader')">3.6 Children's Information</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('onlinePrivacySubheader')">3.7 Online Privacy Policy Only</div>
        <div class="md-body-1 sidebarSubheader" @click="scrollTo('consentSubheader')">3.8 Consent</div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import Header from './components/Header'
import Footer from './components/Footer'

export default {
  name: 'About',
  methods: {
    scrollTo(ref) {
        const element = this.$refs[ref];
        const top = element.offsetTop;
        window.scrollTo(0, top);
    }
  },
  components: {
    Header,
    Footer,
  },
}
</script>

<style scoped>

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
  text-decoration: none !important;
}

</style>
