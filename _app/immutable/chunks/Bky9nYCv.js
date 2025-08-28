import{i as P,a as y,av as l,aw as $,aj as _,x as u,M as C,Q as I,a2 as F,K as E,L as z,O as V,R as W,V as U,I as K,a3 as N,G as B}from"./BeTPpg_-.js";import{o as m,r as c,c as b,n as p}from"./BDCv2B6_.js";import"./BxUcGUt1.js";import{O as j}from"./8jQM5yCv.js";import"./C2XrN-vg.js";import"./CkwDxcAi.js";import"./CXxuevlC.js";import"./CsMgqBH2.js";import"./BU7rqx6e.js";import"./eXpy_AJ7.js";import"./D4kM6Vyz.js";import"./CuTOeaPC.js";const Y=P`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var A=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let R=class extends y{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=l.state.paymentCurrency,this.currencies=l.state.paymentCurrencies,this.currencyImages=$.state.currencyImages,this.checked=j.state.isLegalCheckboxChecked,this.unsubscribe.push(l.subscribe(e=>{this.selectedCurrency=e.paymentCurrency,this.currencies=e.paymentCurrencies}),$.subscribeKey("currencyImages",e=>this.currencyImages=e),j.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var a;const{termsConditionsUrl:e,privacyPolicyUrl:t}=_.state,r=(a=_.state.features)==null?void 0:a.legalCheckbox,n=!!(e||t)&&!!r&&!this.checked;return u`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${m(n?"disabled":void 0)}
      >
        ${this.currenciesTemplate(n)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.currencies.map(t=>{var r;return u`
        <wui-list-item
          imageSrc=${m((r=this.currencyImages)==null?void 0:r[t.id])}
          @click=${()=>this.selectCurrency(t)}
          variant="image"
          tabIdx=${m(e?-1:void 0)}
        >
          <wui-text variant="paragraph-500" color="fg-100">${t.id}</wui-text>
        </wui-list-item>
      `})}selectCurrency(e){e&&(l.setPaymentCurrency(e),C.close())}};R.styles=Y;A([c()],R.prototype,"selectedCurrency",void 0);A([c()],R.prototype,"currencies",void 0);A([c()],R.prototype,"currencyImages",void 0);A([c()],R.prototype,"checked",void 0);R=A([b("w3m-onramp-fiat-select-view")],R);const q=P`
  button {
    padding: var(--wui-spacing-s);
    border-radius: var(--wui-border-radius-xs);
    border: none;
    outline: none;
    background-color: var(--wui-color-gray-glass-002);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--wui-spacing-s);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }

  .provider-image {
    width: var(--wui-spacing-3xl);
    min-width: var(--wui-spacing-3xl);
    height: var(--wui-spacing-3xl);
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    position: relative;
    overflow: hidden;
  }

  .provider-image::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-xs) - calc(var(--wui-spacing-s) / 2));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  .network-icon {
    width: var(--wui-spacing-m);
    height: var(--wui-spacing-m);
    border-radius: calc(var(--wui-spacing-m) / 2);
    overflow: hidden;
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-002),
      0 0 0 3px var(--wui-color-modal-bg);
    transition: box-shadow var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: box-shadow;
  }

  button:hover .network-icon {
    box-shadow:
      0 0 0 3px var(--wui-color-gray-glass-005),
      0 0 0 3px var(--wui-color-modal-bg);
  }
`;var v=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let h=class extends y{constructor(){super(...arguments),this.disabled=!1,this.color="inherit",this.label="",this.feeRange="",this.loading=!1,this.onClick=null}render(){return u`
      <button ?disabled=${this.disabled} @click=${this.onClick} ontouchstart>
        <wui-visual name=${m(this.name)} class="provider-image"></wui-visual>
        <wui-flex flexDirection="column" gap="4xs">
          <wui-text variant="paragraph-500" color="fg-100">${this.label}</wui-text>
          <wui-flex alignItems="center" justifyContent="flex-start" gap="l">
            <wui-text variant="tiny-500" color="fg-100">
              <wui-text variant="tiny-400" color="fg-200">Fees</wui-text>
              ${this.feeRange}
            </wui-text>
            <wui-flex gap="xxs">
              <wui-icon name="bank" size="xs" color="fg-150"></wui-icon>
              <wui-icon name="card" size="xs" color="fg-150"></wui-icon>
            </wui-flex>
            ${this.networksTemplate()}
          </wui-flex>
        </wui-flex>
        ${this.loading?u`<wui-loading-spinner color="fg-200" size="md"></wui-loading-spinner>`:u`<wui-icon name="chevronRight" color="fg-200" size="sm"></wui-icon>`}
      </button>
    `}networksTemplate(){var r;const e=I.getAllRequestedCaipNetworks(),t=(r=e==null?void 0:e.filter(o=>{var i;return(i=o==null?void 0:o.assets)==null?void 0:i.imageId}))==null?void 0:r.slice(0,5);return u`
      <wui-flex class="networks">
        ${t==null?void 0:t.map(o=>u`
            <wui-flex class="network-icon">
              <wui-image src=${m(F.getNetworkImage(o))}></wui-image>
            </wui-flex>
          `)}
      </wui-flex>
    `}};h.styles=[q];v([p({type:Boolean})],h.prototype,"disabled",void 0);v([p()],h.prototype,"color",void 0);v([p()],h.prototype,"name",void 0);v([p()],h.prototype,"label",void 0);v([p()],h.prototype,"feeRange",void 0);v([p({type:Boolean})],h.prototype,"loading",void 0);v([p()],h.prototype,"onClick",void 0);h=v([b("w3m-onramp-provider-item")],h);const Q=P`
  wui-flex {
    border-top: 1px solid var(--wui-color-gray-glass-005);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--wui-spacing-3xs);
  }
`;var H=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let L=class extends y{render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=_.state;return!e&&!t?null:u`
      <wui-flex
        .padding=${["m","s","s","s"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="s"
      >
        <wui-text color="fg-250" variant="small-400" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `}howDoesItWorkTemplate(){return u` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){E.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:z(I.state.activeChain)===V.ACCOUNT_TYPES.SMART_ACCOUNT}}),W.push("WhatIsABuy")}};L.styles=[Q];L=H([b("w3m-onramp-providers-footer")],L);var M=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let S=class extends y{constructor(){super(),this.unsubscribe=[],this.providers=l.state.providers,this.unsubscribe.push(l.subscribeKey("providers",e=>{this.providers=e}))}render(){return u`
      <wui-flex flexDirection="column" .padding=${["0","s","s","s"]} gap="xs">
        ${this.onRampProvidersTemplate()}
      </wui-flex>
      <w3m-onramp-providers-footer></w3m-onramp-providers-footer>
    `}onRampProvidersTemplate(){return this.providers.filter(e=>e.supportedChains.includes(I.state.activeChain??"eip155")).map(e=>u`
          <w3m-onramp-provider-item
            label=${e.label}
            name=${e.name}
            feeRange=${e.feeRange}
            @click=${()=>{this.onClickProvider(e)}}
            ?disabled=${!e.url}
            data-testid=${`onramp-provider-${e.name}`}
          ></w3m-onramp-provider-item>
        `)}onClickProvider(e){var t;l.setSelectedProvider(e),W.push("BuyInProgress"),U.openHref(((t=l.state.selectedProvider)==null?void 0:t.url)||e.url,"popupWindow","width=600,height=800,scrollbars=yes"),E.sendEvent({type:"track",event:"SELECT_BUY_PROVIDER",properties:{provider:e.name,isSmartAccount:z(I.state.activeChain)===V.ACCOUNT_TYPES.SMART_ACCOUNT}})}};M([c()],S.prototype,"providers",void 0);S=M([b("w3m-onramp-providers-view")],S);const X=P`
  :host > wui-grid {
    max-height: 360px;
    overflow: auto;
  }

  wui-flex {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var T=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let k=class extends y{constructor(){super(),this.unsubscribe=[],this.selectedCurrency=l.state.purchaseCurrencies,this.tokens=l.state.purchaseCurrencies,this.tokenImages=$.state.tokenImages,this.checked=j.state.isLegalCheckboxChecked,this.unsubscribe.push(l.subscribe(e=>{this.selectedCurrency=e.purchaseCurrencies,this.tokens=e.purchaseCurrencies}),$.subscribeKey("tokenImages",e=>this.tokenImages=e),j.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var a;const{termsConditionsUrl:e,privacyPolicyUrl:t}=_.state,r=(a=_.state.features)==null?void 0:a.legalCheckbox,n=!!(e||t)&&!!r&&!this.checked;return u`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${["0","s","s","s"]}
        gap="xs"
        class=${m(n?"disabled":void 0)}
      >
        ${this.currenciesTemplate(n)}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `}currenciesTemplate(e=!1){return this.tokens.map(t=>{var r;return u`
        <wui-list-item
          imageSrc=${m((r=this.tokenImages)==null?void 0:r[t.symbol])}
          @click=${()=>this.selectToken(t)}
          variant="image"
          tabIdx=${m(e?-1:void 0)}
        >
          <wui-flex gap="3xs" alignItems="center">
            <wui-text variant="paragraph-500" color="fg-100">${t.name}</wui-text>
            <wui-text variant="small-400" color="fg-200">${t.symbol}</wui-text>
          </wui-flex>
        </wui-list-item>
      `})}selectToken(e){e&&(l.setPurchaseCurrency(e),C.close())}};k.styles=X;T([c()],k.prototype,"selectedCurrency",void 0);T([c()],k.prototype,"tokens",void 0);T([c()],k.prototype,"tokenImages",void 0);T([c()],k.prototype,"checked",void 0);k=T([b("w3m-onramp-token-select-view")],k);const G=P`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-visual {
    width: var(--wui-wallet-image-size-lg);
    height: var(--wui-wallet-image-size-lg);
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    position: relative;
    overflow: hidden;
  }

  wui-visual::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: calc(var(--wui-border-radius-5xs) * 9 - var(--wui-border-radius-xxs));
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity var(--wui-ease-out-power-2) var(--wui-duration-lg),
      transform var(--wui-ease-out-power-2) var(--wui-duration-lg);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
  }
`;var f=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let d=class extends y{constructor(){super(),this.unsubscribe=[],this.selectedOnRampProvider=l.state.selectedProvider,this.uri=K.state.wcUri,this.ready=!1,this.showRetry=!1,this.buffering=!1,this.error=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(l.subscribeKey("selectedProvider",e=>{this.selectedOnRampProvider=e}))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}render(){var r,o;let e="Continue in external window";this.error?e="Buy failed":this.selectedOnRampProvider&&(e=`Buy in ${(r=this.selectedOnRampProvider)==null?void 0:r.label}`);const t=this.error?"Buy can be declined from your side or due to and error on the provider app":"We’ll notify you once your Buy is processed";return u`
      <wui-flex
        data-error=${m(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-visual
            name=${m((o=this.selectedOnRampProvider)==null?void 0:o.name)}
            size="lg"
            class="provider-image"
          >
          </wui-visual>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${e}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${t}</wui-text>
        </wui-flex>

        ${this.error?this.tryAgainTemplate():null}
      </wui-flex>

      <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
        <wui-link @click=${this.onCopyUri} color="fg-200">
          <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
          Copy link
        </wui-link>
      </wui-flex>
    `}onTryAgain(){this.selectedOnRampProvider&&(this.error=!1,U.openHref(this.selectedOnRampProvider.url,"popupWindow","width=600,height=800,scrollbars=yes"))}tryAgainTemplate(){var e;return(e=this.selectedOnRampProvider)!=null&&e.url?u`<wui-button size="md" variant="accent" @click=${this.onTryAgain.bind(this)}>
      <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
      Try again
    </wui-button>`:null}loaderTemplate(){const e=N.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return u`<wui-loading-thumbnail radius=${t*9}></wui-loading-thumbnail>`}onCopyUri(){var e;if(!((e=this.selectedOnRampProvider)!=null&&e.url)){B.showError("No link found"),W.goBack();return}try{U.copyToClopboard(this.selectedOnRampProvider.url),B.showSuccess("Link copied")}catch{B.showError("Failed to copy")}}};d.styles=G;f([c()],d.prototype,"intervalId",void 0);f([c()],d.prototype,"selectedOnRampProvider",void 0);f([c()],d.prototype,"uri",void 0);f([c()],d.prototype,"ready",void 0);f([c()],d.prototype,"showRetry",void 0);f([c()],d.prototype,"buffering",void 0);f([c()],d.prototype,"error",void 0);f([p({type:Boolean})],d.prototype,"isMobile",void 0);f([p()],d.prototype,"onRetry",void 0);d=f([b("w3m-buy-in-progress-view")],d);var J=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let D=class extends y{render(){return u`
      <wui-flex
        flexDirection="column"
        .padding=${["xxl","3xl","xl","3xl"]}
        alignItems="center"
        gap="xl"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="xs" alignItems="center">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Quickly and easily buy digital assets!
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Simply select your preferred onramp provider and add digital assets to your account
            using your credit card or bank transfer
          </wui-text>
        </wui-flex>
        <wui-button @click=${W.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `}};D=J([b("w3m-what-is-a-buy-view")],D);const Z=P`
  :host {
    width: 100%;
  }

  wui-loading-spinner {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
  }

  .currency-container {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: var(--wui-spacing-1xs);
    height: 40px;
    padding: var(--wui-spacing-xs) var(--wui-spacing-1xs) var(--wui-spacing-xs)
      var(--wui-spacing-xs);
    min-width: 95px;
    border-radius: var(--FULL, 1000px);
    border: 1px solid var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    cursor: pointer;
  }

  .currency-container > wui-image {
    height: 24px;
    width: 24px;
    border-radius: 50%;
  }
`;var O=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};let g=class extends y{constructor(){var e;super(),this.unsubscribe=[],this.type="Token",this.value=0,this.currencies=[],this.selectedCurrency=(e=this.currencies)==null?void 0:e[0],this.currencyImages=$.state.currencyImages,this.tokenImages=$.state.tokenImages,this.unsubscribe.push(l.subscribeKey("purchaseCurrency",t=>{!t||this.type==="Fiat"||(this.selectedCurrency=this.formatPurchaseCurrency(t))}),l.subscribeKey("paymentCurrency",t=>{!t||this.type==="Token"||(this.selectedCurrency=this.formatPaymentCurrency(t))}),l.subscribe(t=>{this.type==="Fiat"?this.currencies=t.purchaseCurrencies.map(this.formatPurchaseCurrency):this.currencies=t.paymentCurrencies.map(this.formatPaymentCurrency)}),$.subscribe(t=>{this.currencyImages={...t.currencyImages},this.tokenImages={...t.tokenImages}}))}firstUpdated(){l.getAvailableCurrencies()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var r;const e=((r=this.selectedCurrency)==null?void 0:r.symbol)||"",t=this.currencyImages[e]||this.tokenImages[e];return u`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency?u` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${()=>C.open({view:`OnRamp${this.type}Select`})}
          >
            <wui-image src=${m(t)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`:u`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`}formatPaymentCurrency(e){return{name:e.id,symbol:e.id}}formatPurchaseCurrency(e){return{name:e.name,symbol:e.symbol}}};g.styles=Z;O([p({type:String})],g.prototype,"type",void 0);O([p({type:Number})],g.prototype,"value",void 0);O([c()],g.prototype,"currencies",void 0);O([c()],g.prototype,"selectedCurrency",void 0);O([c()],g.prototype,"currencyImages",void 0);O([c()],g.prototype,"tokenImages",void 0);g=O([b("w3m-onramp-input")],g);const ee=P`
  :host > wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > wui-flex {
    border-radius: var(--wui-border-radius-l);
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`;var x=function(s,e,t,r){var o=arguments.length,i=o<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(s,e,t,r);else for(var a=s.length-1;a>=0;a--)(n=s[a])&&(i=(o<3?n(i):o>3?n(e,t,i):n(e,t))||i);return o>3&&i&&Object.defineProperty(e,t,i),i};const te={USD:"$",EUR:"€",GBP:"£"},ie=[100,250,500,1e3];let w=class extends y{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.caipAddress=I.state.activeCaipAddress,this.loading=C.state.loading,this.paymentCurrency=l.state.paymentCurrency,this.paymentAmount=l.state.paymentAmount,this.purchaseAmount=l.state.purchaseAmount,this.quoteLoading=l.state.quotesLoading,this.unsubscribe.push(I.subscribeKey("activeCaipAddress",e=>this.caipAddress=e),C.subscribeKey("loading",e=>{this.loading=e}),l.subscribe(e=>{this.paymentCurrency=e.paymentCurrency,this.paymentAmount=e.paymentAmount,this.purchaseAmount=e.purchaseAmount,this.quoteLoading=e.quotesLoading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return u`
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center">
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <w3m-onramp-input
            type="Fiat"
            @inputChange=${this.onPaymentAmountChange.bind(this)}
            .value=${this.paymentAmount||0}
          ></w3m-onramp-input>
          <w3m-onramp-input
            type="Token"
            .value=${this.purchaseAmount||0}
            .loading=${this.quoteLoading}
          ></w3m-onramp-input>
          <wui-flex justifyContent="space-evenly" class="amounts-container" gap="xs">
            ${ie.map(e=>{var t;return u`<wui-button
                  variant=${this.paymentAmount===e?"accent":"neutral"}
                  size="md"
                  textVariant="paragraph-600"
                  fullWidth
                  @click=${()=>this.selectPresetAmount(e)}
                  >${`${te[((t=this.paymentCurrency)==null?void 0:t.id)||"USD"]} ${e}`}</wui-button
                >`})}
          </wui-flex>
          ${this.templateButton()}
        </wui-flex>
      </wui-flex>
    `}templateButton(){return this.caipAddress?u`<wui-button
          @click=${this.getQuotes.bind(this)}
          variant="main"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Get quotes
        </wui-button>`:u`<wui-button
          @click=${this.openModal.bind(this)}
          variant="accent"
          fullWidth
          size="lg"
          borderRadius="xs"
        >
          Connect wallet
        </wui-button>`}getQuotes(){this.loading||C.open({view:"OnRampProviders"})}openModal(){C.open({view:"Connect"})}async onPaymentAmountChange(e){l.setPaymentAmount(Number(e.detail)),await l.getQuote()}async selectPresetAmount(e){l.setPaymentAmount(e),await l.getQuote()}};w.styles=ee;x([p({type:Boolean})],w.prototype,"disabled",void 0);x([c()],w.prototype,"caipAddress",void 0);x([c()],w.prototype,"loading",void 0);x([c()],w.prototype,"paymentCurrency",void 0);x([c()],w.prototype,"paymentAmount",void 0);x([c()],w.prototype,"purchaseAmount",void 0);x([c()],w.prototype,"quoteLoading",void 0);w=x([b("w3m-onramp-widget")],w);export{d as W3mBuyInProgressView,S as W3mOnRampProvidersView,R as W3mOnrampFiatSelectView,k as W3mOnrampTokensView,w as W3mOnrampWidget,D as W3mWhatIsABuyView};
