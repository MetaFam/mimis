import{i as p,a as h,R as l,C as o,x as e}from"./Dw6aEOe4.js";import{r as u,c as d}from"./DUVF8HDt.js";import{T as g}from"./hrYO3qY6.js";const f=p`
  :host {
    --prev-height: 0px;
    --new-height: 0px;
    display: block;
  }

  div.w3m-router-container {
    transform: translateY(0);
    opacity: 1;
  }

  div.w3m-router-container[view-direction='prev'] {
    animation:
      slide-left-out 150ms forwards ease,
      slide-left-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  div.w3m-router-container[view-direction='next'] {
    animation:
      slide-right-out 150ms forwards ease,
      slide-right-in 150ms forwards ease;
    animation-delay: 0ms, 200ms;
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(10px);
      opacity: 0;
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px);
      opacity: 1;
    }
    to {
      transform: translateX(-10px);
      opacity: 0;
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;var v=function(s,t,i,r){var w=arguments.length,a=w<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(s,t,i,r);else for(var m=s.length-1;m>=0;m--)(c=s[m])&&(a=(w<3?c(a):w>3?c(t,i,a):c(t,i))||a);return w>3&&a&&Object.defineProperty(t,i,a),a};let n=class extends h{constructor(){super(),this.resizeObserver=void 0,this.prevHeight="0px",this.prevHistoryLength=1,this.unsubscribe=[],this.view=l.state.view,this.viewDirection="",this.unsubscribe.push(l.subscribeKey("view",t=>this.onViewChange(t)))}firstUpdated(){var t;this.resizeObserver=new ResizeObserver(([i])=>{const r=`${i==null?void 0:i.contentRect.height}px`;this.prevHeight!=="0px"&&(this.style.setProperty("--prev-height",this.prevHeight),this.style.setProperty("--new-height",r),this.style.animation="w3m-view-height 150ms forwards ease",this.style.height="auto"),setTimeout(()=>{this.prevHeight=r,this.style.animation="unset"},o.ANIMATION_DURATIONS.ModalHeight)}),(t=this.resizeObserver)==null||t.observe(this.getWrapper())}disconnectedCallback(){var t;(t=this.resizeObserver)==null||t.unobserve(this.getWrapper()),this.unsubscribe.forEach(i=>i())}render(){return e`<div class="w3m-router-container" view-direction="${this.viewDirection}">
      ${this.viewTemplate()}
    </div>`}viewTemplate(){switch(this.view){case"AccountSettings":return e`<w3m-account-settings-view></w3m-account-settings-view>`;case"Account":return e`<w3m-account-view></w3m-account-view>`;case"AllWallets":return e`<w3m-all-wallets-view></w3m-all-wallets-view>`;case"ApproveTransaction":return e`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case"BuyInProgress":return e`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case"ChooseAccountName":return e`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case"Connect":return e`<w3m-connect-view></w3m-connect-view>`;case"Create":return e`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case"ConnectingWalletConnect":return e`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case"ConnectingWalletConnectBasic":return e`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case"ConnectingExternal":return e`<w3m-connecting-external-view></w3m-connecting-external-view>`;case"ConnectingSiwe":return e`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case"ConnectWallets":return e`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case"ConnectSocials":return e`<w3m-connect-socials-view></w3m-connect-socials-view>`;case"ConnectingSocial":return e`<w3m-connecting-social-view></w3m-connecting-social-view>`;case"Downloads":return e`<w3m-downloads-view></w3m-downloads-view>`;case"EmailLogin":return e`<w3m-email-login-view></w3m-email-login-view>`;case"EmailVerifyOtp":return e`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case"EmailVerifyDevice":return e`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case"GetWallet":return e`<w3m-get-wallet-view></w3m-get-wallet-view>`;case"Networks":return e`<w3m-networks-view></w3m-networks-view>`;case"SwitchNetwork":return e`<w3m-network-switch-view></w3m-network-switch-view>`;case"ProfileWallets":return e`<w3m-profile-wallets-view></w3m-profile-wallets-view>`;case"Transactions":return e`<w3m-transactions-view></w3m-transactions-view>`;case"OnRampProviders":return e`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case"OnRampActivity":return e`<w3m-onramp-activity-view></w3m-onramp-activity-view>`;case"OnRampTokenSelect":return e`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case"OnRampFiatSelect":return e`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case"UpgradeEmailWallet":return e`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case"UpdateEmailWallet":return e`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case"UpdateEmailPrimaryOtp":return e`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case"UpdateEmailSecondaryOtp":return e`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case"UnsupportedChain":return e`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case"Swap":return e`<w3m-swap-view></w3m-swap-view>`;case"SwapSelectToken":return e`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case"SwapPreview":return e`<w3m-swap-preview-view></w3m-swap-preview-view>`;case"WalletSend":return e`<w3m-wallet-send-view></w3m-wallet-send-view>`;case"WalletSendSelectToken":return e`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case"WalletSendPreview":return e`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case"WhatIsABuy":return e`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case"WalletReceive":return e`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case"WalletCompatibleNetworks":return e`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case"WhatIsAWallet":return e`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case"ConnectingMultiChain":return e`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case"WhatIsANetwork":return e`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case"ConnectingFarcaster":return e`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case"SwitchActiveChain":return e`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case"RegisterAccountName":return e`<w3m-register-account-name-view></w3m-register-account-name-view>`;case"RegisterAccountNameSuccess":return e`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case"SmartSessionCreated":return e`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case"SmartSessionList":return e`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case"SIWXSignMessage":return e`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case"Pay":return e`<w3m-pay-view></w3m-pay-view>`;case"PayLoading":return e`<w3m-pay-loading-view></w3m-pay-loading-view>`;default:return e`<w3m-connect-view></w3m-connect-view>`}}onViewChange(t){g.hide();let i=o.VIEW_DIRECTION.Next;const{history:r}=l.state;r.length<this.prevHistoryLength&&(i=o.VIEW_DIRECTION.Prev),this.prevHistoryLength=r.length,this.viewDirection=i,setTimeout(()=>{this.view=t},o.ANIMATION_DURATIONS.ViewTransition)}getWrapper(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("div")}};n.styles=f;v([u()],n.prototype,"view",void 0);v([u()],n.prototype,"viewDirection",void 0);n=v([d("w3m-router")],n);export{n as W};
