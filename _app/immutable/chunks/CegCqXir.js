import{i as v,a as h,M as E,x as l,a2 as M,a4 as N,ax as j,a0 as _,r as D,K as C,ay as c,Z as A,X as U,L as x,O as y,T,Q as S,I as P,R as k}from"./M6cbFFaq.js";import{r as p,c as f,n as g,o as z}from"./CHHLyLOr.js";import{N as H}from"./BUEhu73t.js";import{e as V,n as F}from"./CBndZLrM.js";import"./BWCMv-7R.js";import"./D_ceDH6Y.js";import"./BIz7hMq9.js";import"./xtTKQHpD.js";import"./Cnrq4iVD.js";import"./CFHoVGJm.js";import"./DP3LSpXc.js";const G=v`
  div {
    width: 100%;
  }

  [data-ready='false'] {
    transform: scale(1.05);
  }

  @media (max-width: 430px) {
    [data-ready='false'] {
      transform: translateY(-50px);
    }
  }
`;var W=function(o,e,i,n){var s=arguments.length,t=s<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var a=o.length-1;a>=0;a--)(r=o[a])&&(t=(s<3?r(t):s>3?r(e,i,t):r(e,i))||t);return s>3&&t&&Object.defineProperty(e,i,t),t};const $=600,I=360,L=64;let b=class extends h{constructor(){super(),this.bodyObserver=void 0,this.unsubscribe=[],this.iframe=document.getElementById("w3m-iframe"),this.ready=!1,this.unsubscribe.push(E.subscribeKey("open",e=>{e||this.onHideIframe()}),E.subscribeKey("shake",e=>{e?this.iframe.style.animation="w3m-shake 500ms var(--wui-ease-out-power-2)":this.iframe.style.animation="none"}))}disconnectedCallback(){var e;this.onHideIframe(),this.unsubscribe.forEach(i=>i()),(e=this.bodyObserver)==null||e.unobserve(window.document.body)}async firstUpdated(){var i;await this.syncTheme(),this.iframe.style.display="block";const e=(i=this==null?void 0:this.renderRoot)==null?void 0:i.querySelector("div");this.bodyObserver=new ResizeObserver(n=>{var r,a;const s=(r=n==null?void 0:n[0])==null?void 0:r.contentBoxSize,t=(a=s==null?void 0:s[0])==null?void 0:a.inlineSize;this.iframe.style.height=`${$}px`,e.style.height=`${$}px`,t&&t<=430?(this.iframe.style.width="100%",this.iframe.style.left="0px",this.iframe.style.bottom="0px",this.iframe.style.top="unset"):(this.iframe.style.width=`${I}px`,this.iframe.style.left=`calc(50% - ${I/2}px)`,this.iframe.style.top=`calc(50% - ${$/2}px + ${L/2}px)`,this.iframe.style.bottom="unset"),this.ready=!0,this.onShowIframe()}),this.bodyObserver.observe(window.document.body)}render(){return l`<div data-ready=${this.ready} id="w3m-frame-container"></div>`}onShowIframe(){const e=window.innerWidth<=430;this.iframe.style.animation=e?"w3m-iframe-zoom-in-mobile 200ms var(--wui-ease-out-power-2)":"w3m-iframe-zoom-in 200ms var(--wui-ease-out-power-2)"}onHideIframe(){this.iframe.style.display="none",this.iframe.style.animation="w3m-iframe-fade-out 200ms var(--wui-ease-out-power-2)"}async syncTheme(){const e=M.getAuthConnector();if(e){const i=N.getSnapshot().themeMode,n=N.getSnapshot().themeVariables;await e.provider.syncTheme({themeVariables:n,w3mThemeVariables:j(n,i)})}}};b.styles=G;W([p()],b.prototype,"ready",void 0);b=W([f("w3m-approve-transaction-view")],b);var Y=function(o,e,i,n){var s=arguments.length,t=s<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var a=o.length-1;a>=0;a--)(r=o[a])&&(t=(s<3?r(t):s>3?r(e,i,t):r(e,i))||t);return s>3&&t&&Object.defineProperty(e,i,t),t};let O=class extends h{render(){return l`
      <wui-flex flexDirection="column" alignItems="center" gap="xl" padding="xl">
        <wui-text variant="paragraph-400" color="fg-100">Follow the instructions on</wui-text>
        <wui-chip
          icon="externalLink"
          variant="fill"
          href=${_.SECURE_SITE_DASHBOARD}
          imageSrc=${_.SECURE_SITE_FAVICON}
          data-testid="w3m-secure-website-button"
        >
        </wui-chip>
        <wui-text variant="small-400" color="fg-200">
          You will have to reconnect for security reasons
        </wui-text>
      </wui-flex>
    `}};O=Y([f("w3m-upgrade-wallet-view")],O);const K=v`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  .error {
    margin: var(--wui-spacing-xxs) var(--wui-spacing-m) var(--wui-spacing-0) var(--wui-spacing-m);
  }

  .base-name {
    position: absolute;
    right: 45px;
    top: 15px;
    text-align: right;
  }
`;var w=function(o,e,i,n){var s=arguments.length,t=s<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var a=o.length-1;a>=0;a--)(r=o[a])&&(t=(s<3?r(t):s>3?r(e,i,t):r(e,i))||t);return s>3&&t&&Object.defineProperty(e,i,t),t};let d=class extends h{constructor(){super(...arguments),this.disabled=!1,this.loading=!1}render(){return l`
      <wui-input-text
        value=${z(this.value)}
        ?disabled=${this.disabled}
        .value=${this.value||""}
        data-testid="wui-ens-input"
        inputRightPadding="5xl"
      >
        ${this.baseNameTemplate()} ${this.errorTemplate()}${this.loadingTemplate()}
      </wui-input-text>
    `}baseNameTemplate(){return l`<wui-text variant="paragraph-400" color="fg-200" class="base-name">
      ${C.WC_NAME_SUFFIX}
    </wui-text>`}loadingTemplate(){return this.loading?l`<wui-loading-spinner size="md" color="accent-100"></wui-loading-spinner>`:null}errorTemplate(){return this.errorMessage?l`<wui-text variant="tiny-500" color="error-100" class="error"
        >${this.errorMessage}</wui-text
      >`:null}};d.styles=[D,K];w([g()],d.prototype,"errorMessage",void 0);w([g({type:Boolean})],d.prototype,"disabled",void 0);w([g()],d.prototype,"value",void 0);w([g({type:Boolean})],d.prototype,"loading",void 0);d=w([f("wui-ens-input")],d);const B=v`
  wui-flex {
    width: 100%;
  }

  .suggestion {
    background: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }

  .suggestion:hover {
    background-color: var(--wui-color-gray-glass-005);
    cursor: pointer;
  }

  .suggested-name {
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  form {
    width: 100%;
  }

  wui-icon-link {
    position: absolute;
    right: 20px;
    transform: translateY(11px);
  }
`;var m=function(o,e,i,n){var s=arguments.length,t=s<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var a=o.length-1;a>=0;a--)(r=o[a])&&(t=(s<3?r(t):s>3?r(e,i,t):r(e,i))||t);return s>3&&t&&Object.defineProperty(e,i,t),t};let u=class extends h{constructor(){super(),this.formRef=V(),this.usubscribe=[],this.name="",this.error="",this.loading=c.state.loading,this.suggestions=c.state.suggestions,this.registered=!1,this.profileName=A.state.profileName,this.onDebouncedNameInputChange=U.debounce(e=>{c.validateName(e)?(this.error="",this.name=e,c.getSuggestions(e),c.isNameRegistered(e).then(i=>{this.registered=i})):e.length<4?this.error="Name must be at least 4 characters long":this.error="Can only contain letters, numbers and - characters"}),this.usubscribe.push(c.subscribe(e=>{this.suggestions=e.suggestions,this.loading=e.loading}),A.subscribeKey("profileName",e=>{this.profileName=e,e&&(this.error="You already own a name")}))}firstUpdated(){var e;(e=this.formRef.value)==null||e.addEventListener("keydown",this.onEnterKey.bind(this))}disconnectedCallback(){var e;super.disconnectedCallback(),this.usubscribe.forEach(i=>i()),(e=this.formRef.value)==null||e.removeEventListener("keydown",this.onEnterKey.bind(this))}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="m"
        .padding=${["0","s","m","s"]}
      >
        <form ${F(this.formRef)} @submit=${this.onSubmitName.bind(this)}>
          <wui-ens-input
            @inputChange=${this.onNameInputChange.bind(this)}
            .errorMessage=${this.error}
            .value=${this.name}
          >
          </wui-ens-input>
          ${this.submitButtonTemplate()}
          <input type="submit" hidden />
        </form>
        ${this.templateSuggestions()}
      </wui-flex>
    `}submitButtonTemplate(){return this.isAllowedToSubmit()?l`
          <wui-icon-link
            size="sm"
            icon="chevronRight"
            iconcolor="accent-100"
            @click=${this.onSubmitName.bind(this)}
          >
          </wui-icon-link>
        `:null}onSelectSuggestion(e){return()=>{this.name=e,this.registered=!1,this.requestUpdate()}}onNameInputChange(e){this.onDebouncedNameInputChange(e.detail)}nameSuggestionTagTemplate(){return this.loading?l`<wui-loading-spinner size="lg" color="fg-100"></wui-loading-spinner>`:this.registered?l`<wui-tag variant="shade" size="lg">Registered</wui-tag>`:l`<wui-tag variant="success" size="lg">Available</wui-tag>`}templateSuggestions(){if(!this.name||this.name.length<4||this.error)return null;const e=this.registered?this.suggestions.filter(i=>i.name!==this.name):[];return l`<wui-flex flexDirection="column" gap="xxs" alignItems="center">
      <wui-flex
        data-testid="account-name-suggestion"
        .padding=${["m","m","m","m"]}
        justifyContent="space-between"
        class="suggestion"
        @click=${this.onSubmitName.bind(this)}
      >
        <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
          ${this.name}</wui-text
        >${this.nameSuggestionTagTemplate()}
      </wui-flex>
      ${e.map(i=>this.availableNameTemplate(i.name))}
    </wui-flex>`}availableNameTemplate(e){return l` <wui-flex
      data-testid="account-name-suggestion"
      .padding=${["m","m","m","m"]}
      justifyContent="space-between"
      class="suggestion"
      @click=${this.onSelectSuggestion(e)}
    >
      <wui-text color="fg-100" variant="paragraph-400" class="suggested-name">
        ${e}
      </wui-text>
      <wui-tag variant="success" size="lg">Available</wui-tag>
    </wui-flex>`}isAllowedToSubmit(){return!this.loading&&!this.registered&&!this.error&&!this.profileName&&c.validateName(this.name)}async onSubmitName(){try{if(!this.isAllowedToSubmit())return;const e=`${this.name}${C.WC_NAME_SUFFIX}`;x.sendEvent({type:"track",event:"REGISTER_NAME_INITIATED",properties:{isSmartAccount:y(T.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:e}}),await c.registerName(e),x.sendEvent({type:"track",event:"REGISTER_NAME_SUCCESS",properties:{isSmartAccount:y(T.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:e}})}catch(e){P.showError(e.message),x.sendEvent({type:"track",event:"REGISTER_NAME_ERROR",properties:{isSmartAccount:y(T.state.activeChain)===S.ACCOUNT_TYPES.SMART_ACCOUNT,ensName:`${this.name}${C.WC_NAME_SUFFIX}`,error:(e==null?void 0:e.message)||"Unknown error"}})}}onEnterKey(e){e.key==="Enter"&&this.isAllowedToSubmit()&&this.onSubmitName()}};u.styles=B;m([g()],u.prototype,"errorMessage",void 0);m([p()],u.prototype,"name",void 0);m([p()],u.prototype,"error",void 0);m([p()],u.prototype,"loading",void 0);m([p()],u.prototype,"suggestions",void 0);m([p()],u.prototype,"registered",void 0);m([p()],u.prototype,"profileName",void 0);u=m([f("w3m-register-account-name-view")],u);const X=v`
  .continue-button-container {
    width: 100%;
  }
`;var q=function(o,e,i,n){var s=arguments.length,t=s<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var a=o.length-1;a>=0;a--)(r=o[a])&&(t=(s<3?r(t):s>3?r(e,i,t):r(e,i))||t);return s>3&&t&&Object.defineProperty(e,i,t),t};let R=class extends h{render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="xxl"
        .padding=${["0","0","l","0"]}
      >
        ${this.onboardingTemplate()} ${this.buttonsTemplate()}
        <wui-link
          @click=${()=>{U.openHref(H.URLS.FAQ,"_blank")}}
        >
          Learn more
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-link>
      </wui-flex>
    `}onboardingTemplate(){return l` <wui-flex
      flexDirection="column"
      gap="xxl"
      alignItems="center"
      .padding=${["0","xxl","0","xxl"]}
    >
      <wui-flex gap="s" alignItems="center" justifyContent="center">
        <wui-icon-box
          size="xl"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="s">
        <wui-text align="center" variant="medium-600" color="fg-100">
          Account name chosen successfully
        </wui-text>
        <wui-text align="center" variant="paragraph-400" color="fg-100">
          You can now fund your account and trade crypto
        </wui-text>
      </wui-flex>
    </wui-flex>`}buttonsTemplate(){return l`<wui-flex
      .padding=${["0","2l","0","2l"]}
      gap="s"
      class="continue-button-container"
    >
      <wui-button fullWidth size="lg" borderRadius="xs" @click=${this.redirectToAccount.bind(this)}
        >Let's Go!
      </wui-button>
    </wui-flex>`}redirectToAccount(){k.replace("Account")}};R.styles=X;R=q([f("w3m-register-account-name-success-view")],R);export{b as W3mApproveTransactionView,R as W3mRegisterAccountNameSuccess,u as W3mRegisterAccountNameView,O as W3mUpgradeWalletView};
