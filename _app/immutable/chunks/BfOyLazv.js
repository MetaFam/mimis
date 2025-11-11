import{cP as $,cQ as T,cR as N,cS as w,cT as l,cv as u,cD as b,dF as Pe,df as E,cx as g,de as B,cW as ne,cw as C,dl as me,d5 as m,c$ as A,cZ as p,cC as L,cy as W,d0 as Ae,d1 as le,c_ as y,dG as gn,eT as ce,eU as Ee,eV as X,dz as yn,dK as k,eW as De,d3 as en,dy as xn,dx as vn,dP as $n,dw as Cn,dg as si,dH as mi,dI as bi,eX as Sn,eY as En,dJ as Ri}from"./DgjbO070.js";import{n as c,c as f,U as F,r as d,a as tn,e as An,i as kn,t as In}from"./BvzJc2UN.js";import{o as h}from"./CtmwZb_8.js";import"./BVMZgy6Y.js";import"./iaSQj7lr.js";import"./Bm6Wts52.js";import"./D_llTcOA.js";import{a as ca,W as da}from"./B_Rh8HH8.js";import"./CbKQpjBq.js";import"./BMBCIC-K.js";import"./CxGiiovH.js";import{H as gi}from"./CW2kEcsZ.js";import"./9RPqwTfQ.js";import"./CzKhd3kD.js";import{M as It}from"./C6Sp7O4C.js";import"./CKm5XvKv.js";import"./BoikEvTK.js";import"./CtQuecvI.js";import{e as yi,n as xi,p as Wn,v as Oe,s as lt,M as oi,m as _n}from"./CM0mOKsn.js";import"./5o37v23G.js";import{n as Tn}from"./DGwAGOgE.js";import"./D1tnaAHL.js";import"./DHSPB30N.js";import"./BylOuJBE.js";import{O as Wt}from"./BfrDb0sC.js";import{e as Rn}from"./BAzi8DGq.js";import"./A_Nk8MfW.js";import"./DQQ5PI3X.js";import"./De88iMpS.js";import{N as Nn}from"./DmfK5sOV.js";import"./ByKEUrKf.js";const On=$`
  :host {
    display: block;
  }

  button {
    border-radius: ${({borderRadius:t})=>t[20]};
    background: ${({tokens:t})=>t.theme.foregroundPrimary};
    display: flex;
    gap: ${({spacing:t})=>t[1]};
    padding: ${({spacing:t})=>t[1]};
    color: ${({tokens:t})=>t.theme.textSecondary};
    border-radius: ${({borderRadius:t})=>t[16]};
    height: 32px;
    transition: box-shadow ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: box-shadow;
  }

  button wui-flex.avatar-container {
    width: 28px;
    height: 24px;
    position: relative;

    wui-flex.network-image-container {
      position: absolute;
      bottom: 0px;
      right: 0px;
      width: 12px;
      height: 12px;
    }

    wui-avatar {
      width: 24px;
      min-width: 24px;
      height: 24px;
    }

    wui-icon {
      width: 12px;
      height: 12px;
    }
  }

  wui-image,
  wui-icon {
    border-radius: ${({borderRadius:t})=>t[16]};
  }

  wui-text {
    white-space: nowrap;
  }

  button wui-flex.balance-container {
    height: 100%;
    border-radius: ${({borderRadius:t})=>t[16]};
    padding-left: ${({spacing:t})=>t[1]};
    padding-right: ${({spacing:t})=>t[1]};
    background: ${({tokens:t})=>t.theme.foregroundSecondary};
    color: ${({tokens:t})=>t.theme.textPrimary};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button:hover:enabled,
  button:focus-visible:enabled,
  button:active:enabled {
    box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);

    wui-flex.balance-container {
      background: ${({tokens:t})=>t.theme.foregroundTertiary};
    }
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled wui-text,
  button:disabled wui-flex.avatar-container {
    opacity: 0.3;
  }
`;var he=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Q=class extends w{constructor(){super(...arguments),this.networkSrc=void 0,this.avatarSrc=void 0,this.balance=void 0,this.isUnsupportedChain=void 0,this.disabled=!1,this.loading=!1,this.address="",this.profileName="",this.charsStart=4,this.charsEnd=6}render(){return l`
      <button
        ?disabled=${this.disabled}
        class=${h(this.balance?void 0:"local-no-balance")}
        data-error=${h(this.isUnsupportedChain)}
      >
        ${this.imageTemplate()} ${this.addressTemplate()} ${this.balanceTemplate()}
      </button>
    `}imageTemplate(){const e=this.networkSrc?l`<wui-image src=${this.networkSrc}></wui-image>`:l` <wui-icon size="inherit" color="inherit" icon="networkPlaceholder"></wui-icon> `;return l`<wui-flex class="avatar-container">
      <wui-avatar
        .imageSrc=${this.avatarSrc}
        alt=${this.address}
        address=${this.address}
      ></wui-avatar>

      <wui-flex class="network-image-container">${e}</wui-flex>
    </wui-flex>`}addressTemplate(){return l`<wui-text variant="md-regular" color="inherit">
      ${this.address?F.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?18:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"}):null}
    </wui-text>`}balanceTemplate(){if(this.balance){const e=this.loading?l`<wui-loading-spinner size="md" color="inherit"></wui-loading-spinner>`:l`<wui-text variant="md-regular" color="inherit"> ${this.balance}</wui-text>`;return l`<wui-flex alignItems="center" justifyContent="center" class="balance-container"
        >${e}</wui-flex
      >`}return null}};Q.styles=[T,N,On];he([c()],Q.prototype,"networkSrc",void 0);he([c()],Q.prototype,"avatarSrc",void 0);he([c()],Q.prototype,"balance",void 0);he([c({type:Boolean})],Q.prototype,"isUnsupportedChain",void 0);he([c({type:Boolean})],Q.prototype,"disabled",void 0);he([c({type:Boolean})],Q.prototype,"loading",void 0);he([c()],Q.prototype,"address",void 0);he([c()],Q.prototype,"profileName",void 0);he([c()],Q.prototype,"charsStart",void 0);he([c()],Q.prototype,"charsEnd",void 0);Q=he([f("wui-account-button")],Q);var V=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};class H extends w{constructor(){super(...arguments),this.unsubscribe=[],this.disabled=!1,this.balance="show",this.charsStart=4,this.charsEnd=6,this.namespace=void 0,this.isSupported=b.state.allowUnsupportedChain?!0:u.state.activeChain?u.checkIfSupportedNetwork(u.state.activeChain):!0}connectedCallback(){super.connectedCallback(),this.setAccountData(u.getAccountData(this.namespace)),this.setNetworkData(u.getNetworkData(this.namespace))}firstUpdated(){const e=this.namespace;e?this.unsubscribe.push(u.subscribeChainProp("accountState",n=>{this.setAccountData(n)},e),u.subscribeChainProp("networkState",n=>{this.setNetworkData(n),this.isSupported=u.checkIfSupportedNetwork(e,n?.caipNetwork?.caipNetworkId)},e)):this.unsubscribe.push(Pe.subscribeNetworkImages(()=>{this.networkImage=E.getNetworkImage(this.network)}),u.subscribeKey("activeCaipAddress",n=>{this.caipAddress=n}),u.subscribeChainProp("accountState",n=>{this.setAccountData(n)}),u.subscribeKey("activeCaipNetwork",n=>{this.network=n,this.networkImage=E.getNetworkImage(n),this.isSupported=n?.chainNamespace?u.checkIfSupportedNetwork(n?.chainNamespace):!0,this.fetchNetworkImage(n)}))}updated(){this.fetchNetworkImage(this.network)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!u.state.activeChain)return null;const e=this.balance==="show",n=typeof this.balanceVal!="string",{formattedText:o}=g.parseBalance(this.balanceVal,this.balanceSymbol);return l`
      <wui-account-button
        .disabled=${!!this.disabled}
        .isUnsupportedChain=${b.state.allowUnsupportedChain?!1:!this.isSupported}
        address=${h(g.getPlainAddress(this.caipAddress))}
        profileName=${h(this.profileName)}
        networkSrc=${h(this.networkImage)}
        avatarSrc=${h(this.profileImage)}
        balance=${e?o:""}
        @click=${this.onClick.bind(this)}
        data-testid=${`account-button${this.namespace?`-${this.namespace}`:""}`}
        .charsStart=${this.charsStart}
        .charsEnd=${this.charsEnd}
        ?loading=${n}
      >
      </wui-account-button>
    `}onClick(){this.isSupported||b.state.allowUnsupportedChain?B.open({namespace:this.namespace}):B.open({view:"UnsupportedChain"})}async fetchNetworkImage(e){e?.assets?.imageId&&(this.networkImage=await E.fetchNetworkImage(e?.assets?.imageId))}setAccountData(e){e&&(this.caipAddress=e.caipAddress,this.balanceVal=e.balance,this.balanceSymbol=e.balanceSymbol,this.profileName=e.profileName,this.profileImage=e.profileImage)}setNetworkData(e){e&&(this.network=e.caipNetwork,this.networkImage=E.getNetworkImage(e.caipNetwork))}}V([c({type:Boolean})],H.prototype,"disabled",void 0);V([c()],H.prototype,"balance",void 0);V([c()],H.prototype,"charsStart",void 0);V([c()],H.prototype,"charsEnd",void 0);V([c()],H.prototype,"namespace",void 0);V([d()],H.prototype,"caipAddress",void 0);V([d()],H.prototype,"balanceVal",void 0);V([d()],H.prototype,"balanceSymbol",void 0);V([d()],H.prototype,"profileName",void 0);V([d()],H.prototype,"profileImage",void 0);V([d()],H.prototype,"network",void 0);V([d()],H.prototype,"networkImage",void 0);V([d()],H.prototype,"isSupported",void 0);let Ni=class extends H{};Ni=V([f("w3m-account-button")],Ni);let Oi=class extends H{};Oi=V([f("appkit-account-button")],Oi);const Pn=ne`
  :host {
    display: block;
    width: max-content;
  }
`;var pe=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};class oe extends w{constructor(){super(...arguments),this.unsubscribe=[],this.disabled=!1,this.balance=void 0,this.size=void 0,this.label=void 0,this.loadingLabel=void 0,this.charsStart=4,this.charsEnd=6,this.namespace=void 0}firstUpdated(){this.caipAddress=this.namespace?u.getAccountData(this.namespace)?.caipAddress:u.state.activeCaipAddress,this.namespace?this.unsubscribe.push(u.subscribeChainProp("accountState",e=>{this.caipAddress=e?.caipAddress},this.namespace)):this.unsubscribe.push(u.subscribeKey("activeCaipAddress",e=>this.caipAddress=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return this.caipAddress?l`
          <appkit-account-button
            .disabled=${!!this.disabled}
            balance=${h(this.balance)}
            .charsStart=${h(this.charsStart)}
            .charsEnd=${h(this.charsEnd)}
            namespace=${h(this.namespace)}
          >
          </appkit-account-button>
        `:l`
          <appkit-connect-button
            size=${h(this.size)}
            label=${h(this.label)}
            loadingLabel=${h(this.loadingLabel)}
            namespace=${h(this.namespace)}
          ></appkit-connect-button>
        `}}oe.styles=Pn;pe([c({type:Boolean})],oe.prototype,"disabled",void 0);pe([c()],oe.prototype,"balance",void 0);pe([c()],oe.prototype,"size",void 0);pe([c()],oe.prototype,"label",void 0);pe([c()],oe.prototype,"loadingLabel",void 0);pe([c()],oe.prototype,"charsStart",void 0);pe([c()],oe.prototype,"charsEnd",void 0);pe([c()],oe.prototype,"namespace",void 0);pe([d()],oe.prototype,"caipAddress",void 0);let Pi=class extends oe{};Pi=pe([f("w3m-button")],Pi);let Di=class extends oe{};Di=pe([f("appkit-button")],Di);const Dn=$`
  :host {
    position: relative;
    display: block;
  }

  button {
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  button[data-size='sm'] {
    padding: ${({spacing:t})=>t[2]};
  }

  button[data-size='md'] {
    padding: ${({spacing:t})=>t[3]};
  }

  button[data-size='lg'] {
    padding: ${({spacing:t})=>t[4]};
  }

  button[data-variant='primary'] {
    background: ${({tokens:t})=>t.core.backgroundAccentPrimary};
  }

  button[data-variant='secondary'] {
    background: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  button:hover:enabled {
    border-radius: ${({borderRadius:t})=>t[3]};
  }

  button:disabled {
    cursor: not-allowed;
  }

  button[data-loading='true'] {
    cursor: not-allowed;
  }

  button[data-loading='true'][data-size='sm'] {
    border-radius: ${({borderRadius:t})=>t[32]};
    padding: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]};
  }

  button[data-loading='true'][data-size='md'] {
    border-radius: ${({borderRadius:t})=>t[20]};
    padding: ${({spacing:t})=>t[3]} ${({spacing:t})=>t[4]};
  }

  button[data-loading='true'][data-size='lg'] {
    border-radius: ${({borderRadius:t})=>t[16]};
    padding: ${({spacing:t})=>t[4]} ${({spacing:t})=>t[5]};
  }
`;var xt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Le=class extends w{constructor(){super(...arguments),this.size="md",this.variant="primary",this.loading=!1,this.text="Connect Wallet"}render(){return l`
      <button
        data-loading=${this.loading}
        data-variant=${this.variant}
        data-size=${this.size}
        ?disabled=${this.loading}
      >
        ${this.contentTemplate()}
      </button>
    `}contentTemplate(){const e={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},n={primary:"invert",secondary:"accent-primary"};return this.loading?l`<wui-loading-spinner
      color=${n[this.variant]}
      size=${this.size}
    ></wui-loading-spinner>`:l` <wui-text variant=${e[this.size]} color=${n[this.variant]}>
        ${this.text}
      </wui-text>`}};Le.styles=[T,N,Dn];xt([c()],Le.prototype,"size",void 0);xt([c()],Le.prototype,"variant",void 0);xt([c({type:Boolean})],Le.prototype,"loading",void 0);xt([c()],Le.prototype,"text",void 0);Le=xt([f("wui-connect-button")],Le);var Te=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};class Re extends w{constructor(){super(),this.unsubscribe=[],this.size="md",this.label="Connect Wallet",this.loadingLabel="Connecting...",this.open=B.state.open,this.loading=this.namespace?B.state.loadingNamespaceMap.get(this.namespace):B.state.loading,this.unsubscribe.push(B.subscribe(e=>{this.open=e.open,this.loading=this.namespace?e.loadingNamespaceMap.get(this.namespace):e.loading}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-connect-button
        size=${h(this.size)}
        .loading=${this.loading}
        @click=${this.onClick.bind(this)}
        data-testid=${`connect-button${this.namespace?`-${this.namespace}`:""}`}
      >
        ${this.loading?this.loadingLabel:this.label}
      </wui-connect-button>
    `}onClick(){this.open?B.close():this.loading||B.open({view:"Connect",namespace:this.namespace})}}Te([c()],Re.prototype,"size",void 0);Te([c()],Re.prototype,"label",void 0);Te([c()],Re.prototype,"loadingLabel",void 0);Te([c()],Re.prototype,"namespace",void 0);Te([d()],Re.prototype,"open",void 0);Te([d()],Re.prototype,"loading",void 0);let Li=class extends Re{};Li=Te([f("w3m-connect-button")],Li);let ji=class extends Re{};ji=Te([f("appkit-connect-button")],ji);const Ln=$`
  :host {
    display: block;
  }

  button {
    border-radius: ${({borderRadius:t})=>t[32]};
    display: flex;
    gap: ${({spacing:t})=>t[1]};
    padding: ${({spacing:t})=>t[1]} ${({spacing:t})=>t[2]}
      ${({spacing:t})=>t[1]} ${({spacing:t})=>t[1]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }

  button[data-size='sm'] > wui-icon-box,
  button[data-size='sm'] > wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='md'] > wui-icon-box,
  button[data-size='md'] > wui-image {
    width: 20px;
    height: 20px;
  }

  button[data-size='lg'] > wui-icon-box,
  button[data-size='lg'] > wui-image {
    width: 24px;
    height: 24px;
  }

  wui-image,
  wui-icon-box {
    border-radius: ${({borderRadius:t})=>t[32]};
  }
`;var vt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let je=class extends w{constructor(){super(...arguments),this.imageSrc=void 0,this.isUnsupportedChain=void 0,this.disabled=!1,this.size="lg"}render(){const e={sm:"sm-regular",md:"md-regular",lg:"lg-regular"};return l`
      <button data-size=${this.size} data-testid="wui-network-button" ?disabled=${this.disabled}>
        ${this.visualTemplate()}
        <wui-text variant=${e[this.size]} color="primary">
          <slot></slot>
        </wui-text>
      </button>
    `}visualTemplate(){return this.isUnsupportedChain?l` <wui-icon-box color="error" icon="warningCircle"></wui-icon-box> `:this.imageSrc?l`<wui-image src=${this.imageSrc}></wui-image>`:l` <wui-icon-box color="default" icon="networkPlaceholder"></wui-icon-box> `}};je.styles=[T,N,Ln];vt([c()],je.prototype,"imageSrc",void 0);vt([c({type:Boolean})],je.prototype,"isUnsupportedChain",void 0);vt([c({type:Boolean})],je.prototype,"disabled",void 0);vt([c()],je.prototype,"size",void 0);je=vt([f("wui-network-button")],je);const jn=ne`
  :host {
    display: block;
    width: max-content;
  }
`;var Ce=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};class ge extends w{constructor(){super(),this.unsubscribe=[],this.disabled=!1,this.network=u.state.activeCaipNetwork,this.networkImage=E.getNetworkImage(this.network),this.caipAddress=u.state.activeCaipAddress,this.loading=B.state.loading,this.isSupported=b.state.allowUnsupportedChain?!0:u.state.activeChain?u.checkIfSupportedNetwork(u.state.activeChain):!0,this.unsubscribe.push(Pe.subscribeNetworkImages(()=>{this.networkImage=E.getNetworkImage(this.network)}),u.subscribeKey("activeCaipAddress",e=>{this.caipAddress=e}),u.subscribeKey("activeCaipNetwork",e=>{this.network=e,this.networkImage=E.getNetworkImage(e),this.isSupported=e?.chainNamespace?u.checkIfSupportedNetwork(e.chainNamespace):!0,E.fetchNetworkImage(e?.assets?.imageId)}),B.subscribeKey("loading",e=>this.loading=e))}firstUpdated(){E.fetchNetworkImage(this.network?.assets?.imageId)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.network?u.checkIfSupportedNetwork(this.network.chainNamespace):!0;return l`
      <wui-network-button
        .disabled=${!!(this.disabled||this.loading)}
        .isUnsupportedChain=${b.state.allowUnsupportedChain?!1:!e}
        imageSrc=${h(this.networkImage)}
        @click=${this.onClick.bind(this)}
        data-testid="w3m-network-button"
      >
        ${this.getLabel()}
        <slot></slot>
      </wui-network-button>
    `}getLabel(){return this.network?!this.isSupported&&!b.state.allowUnsupportedChain?"Switch Network":this.network.name:this.label?this.label:this.caipAddress?"Unknown Network":"Select Network"}onClick(){this.loading||(C.sendEvent({type:"track",event:"CLICK_NETWORKS"}),B.open({view:"Networks"}))}}ge.styles=jn;Ce([c({type:Boolean})],ge.prototype,"disabled",void 0);Ce([c({type:String})],ge.prototype,"label",void 0);Ce([d()],ge.prototype,"network",void 0);Ce([d()],ge.prototype,"networkImage",void 0);Ce([d()],ge.prototype,"caipAddress",void 0);Ce([d()],ge.prototype,"loading",void 0);Ce([d()],ge.prototype,"isSupported",void 0);let Bi=class extends ge{};Bi=Ce([f("w3m-network-button")],Bi);let Ui=class extends ge{};Ui=Ce([f("appkit-network-button")],Ui);const Bn=$`
  :host {
    display: block;
  }

  button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:t})=>t[4]};
    padding: ${({spacing:t})=>t[3]};
    border-radius: ${({borderRadius:t})=>t[4]};
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  wui-flex > wui-icon {
    padding: ${({spacing:t})=>t[2]};
    color: ${({tokens:t})=>t.theme.textInvert};
    background-color: ${({tokens:t})=>t.core.backgroundAccentPrimary};
    border-radius: ${({borderRadius:t})=>t[2]};
    align-items: normal;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:t})=>t.core.foregroundAccent020};
    }
  }
`;var Kt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ye=class extends w{constructor(){super(...arguments),this.label="",this.description="",this.icon="wallet"}render(){return l`
      <button>
        <wui-flex gap="2" alignItems="center">
          <wui-icon weight="fill" size="md" name=${this.icon} color="inherit"></wui-icon>
          <wui-flex flexDirection="column" gap="1">
            <wui-text variant="md-medium" color="primary">${this.label}</wui-text>
            <wui-text variant="md-regular" color="tertiary">${this.description}</wui-text>
          </wui-flex>
        </wui-flex>
        <wui-icon size="lg" color="accent-primary" name="chevronRight"></wui-icon>
      </button>
    `}};Ye.styles=[T,N,Bn];Kt([c()],Ye.prototype,"label",void 0);Kt([c()],Ye.prototype,"description",void 0);Kt([c()],Ye.prototype,"icon",void 0);Ye=Kt([f("wui-notice-card")],Ye);var nn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ai=class extends w{constructor(){super(),this.unsubscribe=[],this.socialProvider=me.getConnectedSocialProvider(),this.socialUsername=me.getConnectedSocialUsername(),this.namespace=u.state.activeChain,this.unsubscribe.push(u.subscribeKey("activeChain",e=>{this.namespace=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=m.getConnectorId(this.namespace),n=m.getAuthConnector();if(!n||e!==A.CONNECTOR_ID.AUTH)return this.style.cssText="display: none",null;const o=n.provider.getEmail()??"";return!o&&!this.socialUsername?(this.style.cssText="display: none",null):l`
      <wui-list-item
        ?rounded=${!0}
        icon=${this.socialProvider??"mail"}
        data-testid="w3m-account-email-update"
        ?chevron=${!this.socialProvider}
        @click=${()=>{this.onGoToUpdateEmail(o,this.socialProvider)}}
      >
        <wui-text variant="lg-regular" color="primary">${this.getAuthName(o)}</wui-text>
      </wui-list-item>
    `}onGoToUpdateEmail(e,n){n||p.push("UpdateEmailWallet",{email:e,redirectView:"Account"})}getAuthName(e){return this.socialUsername?this.socialProvider==="discord"&&this.socialUsername.endsWith("0")?this.socialUsername.slice(0,-1):this.socialUsername:e.length>30?`${e.slice(0,-3)}...`:e}};nn([d()],ai.prototype,"namespace",void 0);ai=nn([f("w3m-account-auth-button")],ai);var ye=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let de=class extends w{constructor(){super(),this.usubscribe=[],this.networkImages=Pe.state.networkImages,this.address=u.getAccountData()?.address,this.profileImage=u.getAccountData()?.profileImage,this.profileName=u.getAccountData()?.profileName,this.network=u.state.activeCaipNetwork,this.disconnecting=!1,this.loading=!1,this.switched=!1,this.text="",this.remoteFeatures=b.state.remoteFeatures,this.usubscribe.push(u.subscribeChainProp("accountState",e=>{e&&(this.address=e.address,this.profileImage=e.profileImage,this.profileName=e.profileName)}),u.subscribeKey("activeCaipNetwork",e=>{e?.id&&(this.network=e)}),b.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}))}disconnectedCallback(){this.usubscribe.forEach(e=>e())}render(){if(!this.address)throw new Error("w3m-account-settings-view: No account provided");const e=this.networkImages[this.network?.assets?.imageId??""];return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="4"
        .padding=${["0","5","3","5"]}
      >
        <wui-avatar
          alt=${this.address}
          address=${this.address}
          imageSrc=${h(this.profileImage)}
          size="lg"
        ></wui-avatar>
        <wui-flex flexDirection="column" alignItems="center">
          <wui-flex gap="1" alignItems="center" justifyContent="center">
            <wui-text variant="h5-medium" color="primary" data-testid="account-settings-address">
              ${F.getTruncateString({string:this.address,charsStart:4,charsEnd:6,truncate:"middle"})}
            </wui-text>
            <wui-icon-link
              size="md"
              icon="copy"
              iconColor="default"
              @click=${this.onCopyAddress}
            ></wui-icon-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
      <wui-flex flexDirection="column" gap="4">
        <wui-flex flexDirection="column" gap="2" .padding=${["6","4","3","4"]}>
          ${this.authCardTemplate()}
          <w3m-account-auth-button></w3m-account-auth-button>
          <wui-list-item
            imageSrc=${h(e)}
            ?chevron=${this.isAllowedNetworkSwitch()}
            ?fullSize=${!0}
            ?rounded=${!0}
            @click=${this.onNetworks.bind(this)}
            data-testid="account-switch-network-button"
          >
            <wui-text variant="lg-regular" color="primary">
              ${this.network?.name??"Unknown"}
            </wui-text>
          </wui-list-item>
          ${this.togglePreferredAccountBtnTemplate()} ${this.chooseNameButtonTemplate()}
          <wui-list-item
            ?rounded=${!0}
            icon="power"
            iconColor="error"
            ?chevron=${!1}
            .loading=${this.disconnecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <wui-text variant="lg-regular" color="primary">Disconnect</wui-text>
          </wui-list-item>
        </wui-flex>
      </wui-flex>
    `}chooseNameButtonTemplate(){const e=this.network?.chainNamespace,n=m.getConnectorId(e),o=m.getAuthConnector();return!u.checkIfNamesSupported()||!o||n!==A.CONNECTOR_ID.AUTH||this.profileName?null:l`
      <wui-list-item
        icon="id"
        ?rounded=${!0}
        ?chevron=${!0}
        @click=${this.onChooseName.bind(this)}
        data-testid="account-choose-name-button"
      >
        <wui-text variant="lg-regular" color="primary">Choose account name </wui-text>
      </wui-list-item>
    `}authCardTemplate(){const e=m.getConnectorId(this.network?.chainNamespace),n=m.getAuthConnector(),{origin:o}=location;return!n||e!==A.CONNECTOR_ID.AUTH||o.includes(L.SECURE_SITE)?null:l`
      <wui-notice-card
        @click=${this.onGoToUpgradeView.bind(this)}
        label="Upgrade your wallet"
        description="Transition to a self-custodial wallet"
        icon="wallet"
        data-testid="w3m-wallet-upgrade-card"
      ></wui-notice-card>
    `}isAllowedNetworkSwitch(){const e=u.getAllRequestedCaipNetworks(),n=e?e.length>1:!1,o=e?.find(({id:r})=>r===this.network?.id);return n||!o}onCopyAddress(){try{this.address&&(g.copyToClopboard(this.address),W.showSuccess("Address copied"))}catch{W.showError("Failed to copy")}}togglePreferredAccountBtnTemplate(){const e=this.network?.chainNamespace,n=u.checkIfSmartAccountEnabled(),o=m.getConnectorId(e);return!m.getAuthConnector()||o!==A.CONNECTOR_ID.AUTH||!n?null:(this.switched||(this.text=Ae(e)===le.ACCOUNT_TYPES.SMART_ACCOUNT?"Switch to your EOA":"Switch to your Smart Account"),l`
      <wui-list-item
        icon="swapHorizontal"
        ?rounded=${!0}
        ?chevron=${!0}
        ?loading=${this.loading}
        @click=${this.changePreferredAccountType.bind(this)}
        data-testid="account-toggle-preferred-account-type"
      >
        <wui-text variant="lg-regular" color="primary">${this.text}</wui-text>
      </wui-list-item>
    `)}onChooseName(){p.push("ChooseAccountName")}async changePreferredAccountType(){const e=this.network?.chainNamespace,n=u.checkIfSmartAccountEnabled(),o=Ae(e)===le.ACCOUNT_TYPES.SMART_ACCOUNT||!n?le.ACCOUNT_TYPES.EOA:le.ACCOUNT_TYPES.SMART_ACCOUNT;m.getAuthConnector()&&(this.loading=!0,await y.setPreferredAccountType(o,e),this.text=o===le.ACCOUNT_TYPES.SMART_ACCOUNT?"Switch to your EOA":"Switch to your Smart Account",this.switched=!0,gn.resetSend(),this.loading=!1,this.requestUpdate())}onNetworks(){this.isAllowedNetworkSwitch()&&p.push("Networks")}async onDisconnect(){try{this.disconnecting=!0;const e=this.network?.chainNamespace,o=y.getConnections(e).length>0,r=e&&m.state.activeConnectorIds[e],i=this.remoteFeatures?.multiWallet;await y.disconnect(i?{id:r,namespace:e}:{}),o&&i&&(p.push("ProfileWallets"),W.showSuccess("Wallet deleted"))}catch{C.sendEvent({type:"track",event:"DISCONNECT_ERROR",properties:{message:"Failed to disconnect"}}),W.showError("Failed to disconnect")}finally{this.disconnecting=!1}}onGoToUpgradeView(){C.sendEvent({type:"track",event:"EMAIL_UPGRADE_FROM_MODAL"}),p.push("UpgradeEmailWallet")}};ye([d()],de.prototype,"address",void 0);ye([d()],de.prototype,"profileImage",void 0);ye([d()],de.prototype,"profileName",void 0);ye([d()],de.prototype,"network",void 0);ye([d()],de.prototype,"disconnecting",void 0);ye([d()],de.prototype,"loading",void 0);ye([d()],de.prototype,"switched",void 0);ye([d()],de.prototype,"text",void 0);ye([d()],de.prototype,"remoteFeatures",void 0);de=ye([f("w3m-account-settings-view")],de);const Un=$`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:t})=>t[1]} ${({spacing:t})=>t[2]};
    column-gap: ${({spacing:t})=>t[1]};
    color: ${({tokens:t})=>t.theme.textSecondary};
    border-radius: ${({borderRadius:t})=>t[20]};
    background-color: transparent;
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:t})=>t.theme.textPrimary};
    background-color: ${({tokens:t})=>t.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:t})=>t.theme.textPrimary};
    }
  }
`;var $t=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const zn={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},Fn={lg:"md",md:"sm",sm:"sm"};let Be=class extends w{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return l`
      <button data-active=${this.active}>
        ${this.icon?l`<wui-icon size=${Fn[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${zn[this.size]}> ${this.label} </wui-text>
      </button>
    `}};Be.styles=[T,N,Un];$t([c()],Be.prototype,"icon",void 0);$t([c()],Be.prototype,"size",void 0);$t([c()],Be.prototype,"label",void 0);$t([c({type:Boolean})],Be.prototype,"active",void 0);Be=$t([f("wui-tab-item")],Be);const Mn=$`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    border-radius: ${({borderRadius:t})=>t[32]};
    padding: ${({spacing:t})=>t["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var Ct=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ue=class extends w{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((e,n)=>{const o=n===this.activeTab;return l`
        <wui-tab-item
          @click=${()=>this.onTabClick(n)}
          icon=${e.icon}
          size=${this.size}
          label=${e.label}
          ?active=${o}
          data-active=${o}
          data-testid="tab-${e.label?.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(e){this.activeTab=e,this.onTabChange(e)}};Ue.styles=[T,N,Mn];Ct([c({type:Array})],Ue.prototype,"tabs",void 0);Ct([c()],Ue.prototype,"onTabChange",void 0);Ct([c()],Ue.prototype,"size",void 0);Ct([d()],Ue.prototype,"activeTab",void 0);Ue=Ct([f("wui-tabs")],Ue);const Vn=$`
  button {
    display: flex;
    align-items: center;
    height: 40px;
    padding: ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[4]};
    column-gap: ${({spacing:t})=>t[1]};
    background-color: transparent;
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  wui-image,
  .icon-box {
    width: ${({spacing:t})=>t[6]};
    height: ${({spacing:t})=>t[6]};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-text {
    flex: 1;
  }

  .icon-box {
    position: relative;
  }

  .icon-box[data-active='true'] {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  .circle {
    position: absolute;
    left: 16px;
    top: 15px;
    width: 8px;
    height: 8px;
    background-color: ${({tokens:t})=>t.core.textSuccess};
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: 50%;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }
  }
`;var xe=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ie=class extends w{constructor(){super(...arguments),this.address="",this.profileName="",this.alt="",this.imageSrc="",this.icon=void 0,this.iconSize="md",this.loading=!1,this.charsStart=4,this.charsEnd=6}render(){return l`
      <button>
        ${this.leftImageTemplate()} ${this.textTemplate()} ${this.rightImageTemplate()}
      </button>
    `}leftImageTemplate(){const e=this.icon?l`<wui-icon
          size=${h(this.iconSize)}
          color="default"
          name=${this.icon}
          class="icon"
        ></wui-icon>`:l`<wui-image src=${this.imageSrc} alt=${this.alt}></wui-image>`;return l`
      <wui-flex
        alignItems="center"
        justifyContent="center"
        class="icon-box"
        data-active=${!!this.icon}
      >
        ${e}
        <wui-flex class="circle"></wui-flex>
      </wui-flex>
    `}textTemplate(){return l`
      <wui-text variant="lg-regular" color="primary">
        ${F.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?16:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"})}
      </wui-text>
    `}rightImageTemplate(){return l`<wui-icon name="chevronBottom" size="sm" color="default"></wui-icon>`}};ie.styles=[T,N,Vn];xe([c()],ie.prototype,"address",void 0);xe([c()],ie.prototype,"profileName",void 0);xe([c()],ie.prototype,"alt",void 0);xe([c()],ie.prototype,"imageSrc",void 0);xe([c()],ie.prototype,"icon",void 0);xe([c()],ie.prototype,"iconSize",void 0);xe([c({type:Boolean})],ie.prototype,"loading",void 0);xe([c({type:Number})],ie.prototype,"charsStart",void 0);xe([c({type:Number})],ie.prototype,"charsEnd",void 0);ie=xe([f("wui-wallet-switch")],ie);const Hn=$`
  wui-icon-link {
    margin-right: calc(${({spacing:t})=>t[8]} * -1);
  }

  wui-notice-card {
    margin-bottom: ${({spacing:t})=>t[1]};
  }

  wui-list-item > wui-text {
    flex: 1;
  }

  w3m-transactions-view {
    max-height: 200px;
  }

  .tab-content-container {
    height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .tab-content-container::-webkit-scrollbar {
    display: none;
  }

  .account-button {
    width: auto;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({spacing:t})=>t[3]};
    height: 48px;
    padding: ${({spacing:t})=>t[2]};
    padding-right: ${({spacing:t})=>t[3]};
    box-shadow: inset 0 0 0 1px ${({tokens:t})=>t.theme.foregroundPrimary};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[6]};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
  }

  .account-button:hover {
    background-color: ${({tokens:t})=>t.core.glass010};
  }

  .avatar-container {
    position: relative;
  }

  wui-avatar.avatar {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.core.glass010};
  }

  wui-wallet-switch {
    margin-top: ${({spacing:t})=>t[2]};
  }

  wui-avatar.network-avatar {
    width: 16px;
    height: 16px;
    position: absolute;
    left: 100%;
    top: 100%;
    transform: translate(-75%, -75%);
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.core.glass010};
  }

  .account-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .account-links wui-flex {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: red;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 10px;
    flex: 1 0 0;
    border-radius: var(--XS, 16px);
    border: 1px solid var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    background: var(--dark-accent-glass-010, rgba(71, 161, 255, 0.1));
    transition:
      background-color ${({durations:t})=>t.md}
        ${({easings:t})=>t["ease-out-power-1"]},
      opacity ${({durations:t})=>t.md} ${({easings:t})=>t["ease-out-power-1"]};
    will-change: background-color, opacity;
  }

  .account-links wui-flex:hover {
    background: var(--dark-accent-glass-015, rgba(71, 161, 255, 0.15));
  }

  .account-links wui-flex wui-icon {
    width: var(--S, 20px);
    height: var(--S, 20px);
  }

  .account-links wui-flex wui-icon svg path {
    stroke: #667dff;
  }
`;var re=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let K=class extends w{constructor(){super(),this.unsubscribe=[],this.caipAddress=u.getAccountData()?.caipAddress,this.address=g.getPlainAddress(u.getAccountData()?.caipAddress),this.profileImage=u.getAccountData()?.profileImage,this.profileName=u.getAccountData()?.profileName,this.disconnecting=!1,this.balance=u.getAccountData()?.balance,this.balanceSymbol=u.getAccountData()?.balanceSymbol,this.features=b.state.features,this.remoteFeatures=b.state.remoteFeatures,this.namespace=u.state.activeChain,this.activeConnectorIds=m.state.activeConnectorIds,this.unsubscribe.push(u.subscribeChainProp("accountState",e=>{this.address=g.getPlainAddress(e?.caipAddress),this.caipAddress=e?.caipAddress,this.balance=e?.balance,this.balanceSymbol=e?.balanceSymbol,this.profileName=e?.profileName,this.profileImage=e?.profileImage}),b.subscribeKey("features",e=>this.features=e),b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e),m.subscribeKey("activeConnectorIds",e=>{this.activeConnectorIds=e}),u.subscribeKey("activeChain",e=>this.namespace=e),u.subscribeKey("activeCaipNetwork",e=>{e?.chainNamespace&&(this.namespace=e?.chainNamespace)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(!this.caipAddress||!this.namespace)return null;const e=this.activeConnectorIds[this.namespace],n=e?m.getConnectorById(e):void 0,o=E.getConnectorImage(n),{value:r,decimals:i,symbol:s}=g.parseBalance(this.balance,this.balanceSymbol);return l`<wui-flex
        flexDirection="column"
        .padding=${["0","5","4","5"]}
        alignItems="center"
        gap="3"
      >
        <wui-avatar
          alt=${h(this.caipAddress)}
          address=${h(g.getPlainAddress(this.caipAddress))}
          imageSrc=${h(this.profileImage===null?void 0:this.profileImage)}
          data-testid="single-account-avatar"
        ></wui-avatar>
        <wui-wallet-switch
          profileName=${this.profileName}
          address=${this.address}
          imageSrc=${o}
          alt=${n?.name}
          @click=${this.onGoToProfileWalletsView.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>
        <wui-flex flexDirection="row" alignItems="flex-end" justifyContent="center" gap="1">
          <wui-text variant="h3-regular" color="primary">${r}</wui-text>
          <wui-text variant="h3-regular" color="secondary">.${i}</wui-text>
          <wui-text variant="h6-medium" color="primary">${s}</wui-text>
        </wui-flex>
        ${this.explorerBtnTemplate()}
      </wui-flex>

      <wui-flex flexDirection="column" gap="2" .padding=${["0","3","3","3"]}>
        ${this.authCardTemplate()} <w3m-account-auth-button></w3m-account-auth-button>
        ${this.orderedFeaturesTemplate()} ${this.activityTemplate()}
        <wui-list-item
          .rounded=${!0}
          icon="power"
          iconColor="error"
          ?chevron=${!1}
          .loading=${this.disconnecting}
          .rightIcon=${!1}
          @click=${this.onDisconnect.bind(this)}
          data-testid="disconnect-button"
        >
          <wui-text variant="lg-regular" color="primary">Disconnect</wui-text>
        </wui-list-item>
      </wui-flex>`}fundWalletTemplate(){if(!this.namespace)return null;const e=L.ONRAMP_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace),n=L.PAY_WITH_EXCHANGE_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace),o=!!this.features?.receive,r=this.remoteFeatures?.onramp&&e,i=this.remoteFeatures?.payWithExchange&&n;return!r&&!o&&!i?null:l`
      <wui-list-item
        .rounded=${!0}
        data-testid="w3m-account-default-fund-wallet-button"
        iconVariant="blue"
        icon="dollar"
        ?chevron=${!0}
        @click=${this.handleClickFundWallet.bind(this)}
      >
        <wui-text variant="lg-regular" color="primary">Fund wallet</wui-text>
      </wui-list-item>
    `}orderedFeaturesTemplate(){return(this.features?.walletFeaturesOrder||L.DEFAULT_FEATURES.walletFeaturesOrder).map(n=>{switch(n){case"onramp":return this.fundWalletTemplate();case"swaps":return this.swapsTemplate();case"send":return this.sendTemplate();default:return null}})}activityTemplate(){return this.namespace&&this.remoteFeatures?.activity&&L.ACTIVITY_ENABLED_CHAIN_NAMESPACES.includes(this.namespace)?l` <wui-list-item
          .rounded=${!0}
          icon="clock"
          ?chevron=${!0}
          @click=${this.onTransactions.bind(this)}
          data-testid="w3m-account-default-activity-button"
        >
          <wui-text variant="lg-regular" color="primary">Activity</wui-text>
        </wui-list-item>`:null}swapsTemplate(){const e=this.remoteFeatures?.swaps,n=u.state.activeChain===A.CHAIN.EVM;return!e||!n?null:l`
      <wui-list-item
        .rounded=${!0}
        icon="recycleHorizontal"
        ?chevron=${!0}
        @click=${this.handleClickSwap.bind(this)}
        data-testid="w3m-account-default-swaps-button"
      >
        <wui-text variant="lg-regular" color="primary">Swap</wui-text>
      </wui-list-item>
    `}sendTemplate(){const e=this.features?.send,n=u.state.activeChain;if(!n)throw new Error("SendController:sendTemplate - namespace is required");const o=L.SEND_SUPPORTED_NAMESPACES.includes(n);return!e||!o?null:l`
      <wui-list-item
        .rounded=${!0}
        icon="send"
        ?chevron=${!0}
        @click=${this.handleClickSend.bind(this)}
        data-testid="w3m-account-default-send-button"
      >
        <wui-text variant="lg-regular" color="primary">Send</wui-text>
      </wui-list-item>
    `}authCardTemplate(){const e=u.state.activeChain;if(!e)throw new Error("AuthCardTemplate:authCardTemplate - namespace is required");const n=m.getConnectorId(e),o=m.getAuthConnector(),{origin:r}=location;return!o||n!==A.CONNECTOR_ID.AUTH||r.includes(L.SECURE_SITE)?null:l`
      <wui-notice-card
        @click=${this.onGoToUpgradeView.bind(this)}
        label="Upgrade your wallet"
        description="Transition to a self-custodial wallet"
        icon="wallet"
        data-testid="w3m-wallet-upgrade-card"
      ></wui-notice-card>
    `}handleClickFundWallet(){p.push("FundWallet")}handleClickSwap(){p.push("Swap")}handleClickSend(){p.push("WalletSend")}explorerBtnTemplate(){return u.getAccountData()?.addressExplorerUrl?l`
      <wui-button size="md" variant="accent-primary" @click=${this.onExplorer.bind(this)}>
        <wui-icon size="sm" color="inherit" slot="iconLeft" name="compass"></wui-icon>
        Block Explorer
        <wui-icon size="sm" color="inherit" slot="iconRight" name="externalLink"></wui-icon>
      </wui-button>
    `:null}onTransactions(){C.sendEvent({type:"track",event:"CLICK_TRANSACTIONS",properties:{isSmartAccount:Ae(u.state.activeChain)===le.ACCOUNT_TYPES.SMART_ACCOUNT}}),p.push("Transactions")}async onDisconnect(){try{this.disconnecting=!0;const n=y.getConnections(this.namespace).length>0,o=this.namespace&&m.state.activeConnectorIds[this.namespace],r=this.remoteFeatures?.multiWallet;await y.disconnect(r?{id:o,namespace:this.namespace}:{}),n&&r&&(p.push("ProfileWallets"),W.showSuccess("Wallet deleted"))}catch{C.sendEvent({type:"track",event:"DISCONNECT_ERROR",properties:{message:"Failed to disconnect"}}),W.showError("Failed to disconnect")}finally{this.disconnecting=!1}}onExplorer(){const e=u.getAccountData()?.addressExplorerUrl;e&&g.openHref(e,"_blank")}onGoToUpgradeView(){C.sendEvent({type:"track",event:"EMAIL_UPGRADE_FROM_MODAL"}),p.push("UpgradeEmailWallet")}onGoToProfileWalletsView(){p.push("ProfileWallets")}};K.styles=Hn;re([d()],K.prototype,"caipAddress",void 0);re([d()],K.prototype,"address",void 0);re([d()],K.prototype,"profileImage",void 0);re([d()],K.prototype,"profileName",void 0);re([d()],K.prototype,"disconnecting",void 0);re([d()],K.prototype,"balance",void 0);re([d()],K.prototype,"balanceSymbol",void 0);re([d()],K.prototype,"features",void 0);re([d()],K.prototype,"remoteFeatures",void 0);re([d()],K.prototype,"namespace",void 0);re([d()],K.prototype,"activeConnectorIds",void 0);K=re([f("w3m-account-default-widget")],K);const Kn=$`
  span {
    font-weight: 500;
    font-size: 38px;
    color: ${({tokens:t})=>t.theme.textPrimary};
    line-height: 38px;
    letter-spacing: -2%;
    text-align: center;
    font-family: var(--apkt-fontFamily-regular);
  }

  .pennies {
    color: ${({tokens:t})=>t.theme.textSecondary};
  }
`;var vi=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let dt=class extends w{constructor(){super(...arguments),this.dollars="0",this.pennies="00"}render(){return l`<span>$${this.dollars}<span class="pennies">.${this.pennies}</span></span>`}};dt.styles=[T,Kn];vi([c()],dt.prototype,"dollars",void 0);vi([c()],dt.prototype,"pennies",void 0);dt=vi([f("wui-balance")],dt);const qn=$`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
  }

  /* -- Variants --------------------------------------------------------- */
  :host([data-variant='fill']) {
    background-color: ${({colors:t})=>t.neutrals100};
  }

  :host([data-variant='shade']) {
    background-color: ${({colors:t})=>t.neutrals900};
  }

  :host([data-variant='fill']) > wui-text {
    color: ${({colors:t})=>t.black};
  }

  :host([data-variant='shade']) > wui-text {
    color: ${({colors:t})=>t.white};
  }

  :host([data-variant='fill']) > wui-icon {
    color: ${({colors:t})=>t.neutrals100};
  }

  :host([data-variant='shade']) > wui-icon {
    color: ${({colors:t})=>t.neutrals900};
  }

  /* -- Sizes --------------------------------------------------------- */
  :host([data-size='sm']) {
    padding: ${({spacing:t})=>t[1]} ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  :host([data-size='md']) {
    padding: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]};
    border-radius: ${({borderRadius:t})=>t[3]};
  }

  /* -- Placements --------------------------------------------------------- */
  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }
`;var St=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Gn={sm:"sm-regular",md:"md-regular"};let ze=class extends w{constructor(){super(...arguments),this.placement="top",this.variant="fill",this.size="md",this.message=""}render(){return this.dataset.variant=this.variant,this.dataset.size=this.size,l`<wui-icon data-placement=${this.placement} size="inherit" name="cursor"></wui-icon>
      <wui-text variant=${Gn[this.size]}>${this.message}</wui-text>`}};ze.styles=[T,N,qn];St([c()],ze.prototype,"placement",void 0);St([c()],ze.prototype,"variant",void 0);St([c()],ze.prototype,"size",void 0);St([c()],ze.prototype,"message",void 0);ze=St([f("wui-tooltip")],ze);const Yn=ne`
  :host {
    width: 100%;
    max-height: 280px;
    overflow: scroll;
    scrollbar-width: none;
  }

  :host::-webkit-scrollbar {
    display: none;
  }
`;var Xn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let li=class extends w{render(){return l`<w3m-activity-list page="account"></w3m-activity-list>`}};li.styles=Yn;li=Xn([f("w3m-account-activity-widget")],li);const Qn=$`
  :host {
    width: 100%;
  }

  button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${({spacing:t})=>t[4]};
    padding: ${({spacing:t})=>t[4]};
    background-color: transparent;
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-text {
    max-width: 174px;
  }

  .tag-container {
    width: fit-content;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }
  }
`;var tt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ke=class extends w{constructor(){super(...arguments),this.icon="card",this.text="",this.description="",this.tag=void 0,this.disabled=!1}render(){return l`
      <button ?disabled=${this.disabled}>
        <wui-flex alignItems="center" gap="3">
          <wui-icon-box padding="2" color="secondary" icon=${this.icon} size="lg"></wui-icon-box>
          <wui-flex flexDirection="column" gap="1">
            <wui-text variant="md-medium" color="primary">${this.text}</wui-text>
            ${this.description?l`<wui-text variant="md-regular" color="secondary">
                  ${this.description}</wui-text
                >`:null}
          </wui-flex>
        </wui-flex>

        <wui-flex class="tag-container" alignItems="center" gap="1" justifyContent="flex-end">
          ${this.tag?l`<wui-tag tagType="main" size="sm">${this.tag}</wui-tag>`:null}
          <wui-icon size="md" name="chevronRight" color="default"></wui-icon>
        </wui-flex>
      </button>
    `}};ke.styles=[T,N,Qn];tt([c()],ke.prototype,"icon",void 0);tt([c()],ke.prototype,"text",void 0);tt([c()],ke.prototype,"description",void 0);tt([c()],ke.prototype,"tag",void 0);tt([c({type:Boolean})],ke.prototype,"disabled",void 0);ke=tt([f("wui-list-description")],ke);const Jn=ne`
  :host {
    width: 100%;
  }

  wui-flex {
    width: 100%;
  }

  .contentContainer {
    max-height: 280px;
    overflow: scroll;
    scrollbar-width: none;
  }

  .contentContainer::-webkit-scrollbar {
    display: none;
  }
`;var $i=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ut=class extends w{constructor(){super(),this.unsubscribe=[],this.tokenBalance=u.getAccountData()?.tokenBalance,this.remoteFeatures=b.state.remoteFeatures,this.unsubscribe.push(u.subscribeChainProp("accountState",e=>{this.tokenBalance=e?.tokenBalance}),b.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`${this.tokenTemplate()}`}tokenTemplate(){return this.tokenBalance&&this.tokenBalance?.length>0?l`<wui-flex class="contentContainer" flexDirection="column" gap="2">
        ${this.tokenItemTemplate()}
      </wui-flex>`:l` <wui-flex flexDirection="column">
      ${this.onRampTemplate()}
      <wui-list-description
        @click=${this.onReceiveClick.bind(this)}
        text="Receive funds"
        description="Scan the QR code and receive funds"
        icon="qrCode"
        iconColor="fg-200"
        iconBackgroundColor="fg-200"
        data-testid="w3m-account-receive-button"
      ></wui-list-description
    ></wui-flex>`}onRampTemplate(){return this.remoteFeatures?.onramp?l`<wui-list-description
        @click=${this.onBuyClick.bind(this)}
        text="Buy Crypto"
        description="Easy with card or bank account"
        icon="card"
        iconColor="success-100"
        iconBackgroundColor="success-100"
        tag="popular"
        data-testid="w3m-account-onramp-button"
      ></wui-list-description>`:l``}tokenItemTemplate(){return this.tokenBalance?.map(e=>l`<wui-list-token
          tokenName=${e.name}
          tokenImageUrl=${e.iconUrl}
          tokenAmount=${e.quantity.numeric}
          tokenValue=${e.value}
          tokenCurrency=${e.symbol}
        ></wui-list-token>`)}onReceiveClick(){p.push("WalletReceive")}onBuyClick(){C.sendEvent({type:"track",event:"SELECT_BUY_CRYPTO",properties:{isSmartAccount:Ae(u.state.activeChain)===le.ACCOUNT_TYPES.SMART_ACCOUNT}}),p.push("OnRampProviders")}};ut.styles=Jn;$i([d()],ut.prototype,"tokenBalance",void 0);$i([d()],ut.prototype,"remoteFeatures",void 0);ut=$i([f("w3m-account-tokens-widget")],ut);const Zn=$`
  wui-flex {
    width: 100%;
  }

  wui-promo {
    position: absolute;
    top: -32px;
  }

  wui-profile-button {
    margin-top: calc(-1 * ${({spacing:t})=>t[4]});
  }

  wui-promo + wui-profile-button {
    margin-top: ${({spacing:t})=>t[4]};
  }

  wui-tabs {
    width: 100%;
  }

  .contentContainer {
    height: 280px;
  }

  .contentContainer > wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: ${({borderRadius:t})=>t[3]};
  }

  .contentContainer > .textContent {
    width: 65%;
  }
`;var fe=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let J=class extends w{constructor(){super(...arguments),this.unsubscribe=[],this.network=u.state.activeCaipNetwork,this.profileName=u.getAccountData()?.profileName,this.address=u.getAccountData()?.address,this.currentTab=u.getAccountData()?.currentTab,this.tokenBalance=u.getAccountData()?.tokenBalance,this.features=b.state.features,this.namespace=u.state.activeChain,this.activeConnectorIds=m.state.activeConnectorIds,this.remoteFeatures=b.state.remoteFeatures}firstUpdated(){u.fetchTokenBalance(),this.unsubscribe.push(u.subscribeChainProp("accountState",e=>{e?.address?(this.address=e.address,this.profileName=e.profileName,this.currentTab=e.currentTab,this.tokenBalance=e.tokenBalance):B.close()}),m.subscribeKey("activeConnectorIds",e=>{this.activeConnectorIds=e}),u.subscribeKey("activeChain",e=>this.namespace=e),u.subscribeKey("activeCaipNetwork",e=>this.network=e),b.subscribeKey("features",e=>this.features=e),b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e)),this.watchSwapValues()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),clearInterval(this.watchTokenBalance)}render(){if(!this.address)throw new Error("w3m-account-features-widget: No account provided");if(!this.namespace)return null;const e=this.activeConnectorIds[this.namespace],n=e?m.getConnectorById(e):void 0,{icon:o,iconSize:r}=this.getAuthData();return l`<wui-flex
      flexDirection="column"
      .padding=${["0","3","4","3"]}
      alignItems="center"
      gap="4"
      data-testid="w3m-account-wallet-features-widget"
    >
      <wui-flex flexDirection="column" justifyContent="center" alignItems="center" gap="2">
        <wui-wallet-switch
          profileName=${this.profileName}
          address=${this.address}
          icon=${o}
          iconSize=${r}
          alt=${n?.name}
          @click=${this.onGoToProfileWalletsView.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>

        ${this.tokenBalanceTemplate()}
      </wui-flex>
      ${this.orderedWalletFeatures()} ${this.tabsTemplate()} ${this.listContentTemplate()}
    </wui-flex>`}orderedWalletFeatures(){const e=this.features?.walletFeaturesOrder||L.DEFAULT_FEATURES.walletFeaturesOrder;if(e.every(i=>i==="send"||i==="receive"?!this.features?.[i]:i==="swaps"||i==="onramp"?!this.remoteFeatures?.[i]:!0))return null;const o=e.map(i=>i==="receive"||i==="onramp"?"fund":i),r=[...new Set(o)];return l`<wui-flex gap="2">
      ${r.map(i=>{switch(i){case"fund":return this.fundWalletTemplate();case"swaps":return this.swapsTemplate();case"send":return this.sendTemplate();default:return null}})}
    </wui-flex>`}fundWalletTemplate(){if(!this.namespace)return null;const e=L.ONRAMP_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace),n=L.PAY_WITH_EXCHANGE_SUPPORTED_CHAIN_NAMESPACES.includes(this.namespace),o=this.features?.receive,r=this.remoteFeatures?.onramp&&e,i=this.remoteFeatures?.payWithExchange&&n;return!r&&!o&&!i?null:l`
      <w3m-tooltip-trigger text="Fund wallet">
        <wui-button
          data-testid="wallet-features-fund-wallet-button"
          @click=${this.onFundWalletClick.bind(this)}
          variant="accent-secondary"
          size="lg"
          fullWidth
        >
          <wui-icon name="dollar"></wui-icon>
        </wui-button>
      </w3m-tooltip-trigger>
    `}swapsTemplate(){const e=this.remoteFeatures?.swaps,n=u.state.activeChain===A.CHAIN.EVM;return!e||!n?null:l`
      <w3m-tooltip-trigger text="Swap">
        <wui-button
          fullWidth
          data-testid="wallet-features-swaps-button"
          @click=${this.onSwapClick.bind(this)}
          variant="accent-secondary"
          size="lg"
        >
          <wui-icon name="recycleHorizontal"></wui-icon>
        </wui-button>
      </w3m-tooltip-trigger>
    `}sendTemplate(){const e=this.features?.send,n=u.state.activeChain,o=L.SEND_SUPPORTED_NAMESPACES.includes(n);return!e||!o?null:l`
      <w3m-tooltip-trigger text="Send">
        <wui-button
          fullWidth
          data-testid="wallet-features-send-button"
          @click=${this.onSendClick.bind(this)}
          variant="accent-secondary"
          size="lg"
        >
          <wui-icon name="send"></wui-icon>
        </wui-button>
      </w3m-tooltip-trigger>
    `}watchSwapValues(){this.watchTokenBalance=setInterval(()=>u.fetchTokenBalance(e=>this.onTokenBalanceError(e)),1e4)}onTokenBalanceError(e){e instanceof Error&&e.cause instanceof Response&&e.cause.status===A.HTTP_STATUS_CODES.SERVICE_UNAVAILABLE&&clearInterval(this.watchTokenBalance)}listContentTemplate(){return this.currentTab===0?l`<w3m-account-tokens-widget></w3m-account-tokens-widget>`:this.currentTab===1?l`<w3m-account-activity-widget></w3m-account-activity-widget>`:l`<w3m-account-tokens-widget></w3m-account-tokens-widget>`}tokenBalanceTemplate(){if(this.tokenBalance&&this.tokenBalance?.length>=0){const e=g.calculateBalance(this.tokenBalance),{dollars:n="0",pennies:o="00"}=g.formatTokenBalance(e);return l`<wui-balance dollars=${n} pennies=${o}></wui-balance>`}return l`<wui-balance dollars="0" pennies="00"></wui-balance>`}tabsTemplate(){const e=gi.getTabsByNamespace(u.state.activeChain);return e.length===0?null:l`<wui-tabs
      .onTabChange=${this.onTabChange.bind(this)}
      .activeTab=${this.currentTab}
      .tabs=${e}
    ></wui-tabs>`}onTabChange(e){u.setAccountProp("currentTab",e,this.namespace)}onFundWalletClick(){p.push("FundWallet")}onSwapClick(){this.network?.caipNetworkId&&!L.SWAP_SUPPORTED_NETWORKS.includes(this.network?.caipNetworkId)?p.push("UnsupportedChain",{swapUnsupportedChain:!0}):(C.sendEvent({type:"track",event:"OPEN_SWAP",properties:{network:this.network?.caipNetworkId||"",isSmartAccount:Ae(u.state.activeChain)===le.ACCOUNT_TYPES.SMART_ACCOUNT}}),p.push("Swap"))}getAuthData(){const e=me.getConnectedSocialProvider(),n=me.getConnectedSocialUsername(),r=m.getAuthConnector()?.provider.getEmail()??"";return{name:ce.getAuthName({email:r,socialUsername:n,socialProvider:e}),icon:e??"mail",iconSize:e?"xl":"md"}}onGoToProfileWalletsView(){p.push("ProfileWallets")}onSendClick(){C.sendEvent({type:"track",event:"OPEN_SEND",properties:{network:this.network?.caipNetworkId||"",isSmartAccount:Ae(u.state.activeChain)===le.ACCOUNT_TYPES.SMART_ACCOUNT}}),p.push("WalletSend")}};J.styles=Zn;fe([d()],J.prototype,"watchTokenBalance",void 0);fe([d()],J.prototype,"network",void 0);fe([d()],J.prototype,"profileName",void 0);fe([d()],J.prototype,"address",void 0);fe([d()],J.prototype,"currentTab",void 0);fe([d()],J.prototype,"tokenBalance",void 0);fe([d()],J.prototype,"features",void 0);fe([d()],J.prototype,"namespace",void 0);fe([d()],J.prototype,"activeConnectorIds",void 0);fe([d()],J.prototype,"remoteFeatures",void 0);J=fe([f("w3m-account-wallet-features-widget")],J);var on=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ci=class extends w{constructor(){super(),this.unsubscribe=[],this.namespace=u.state.activeChain,this.unsubscribe.push(u.subscribeKey("activeChain",e=>{this.namespace=e}))}render(){if(!this.namespace)return null;const e=m.getConnectorId(this.namespace),n=m.getAuthConnector();return l`
      ${n&&e===A.CONNECTOR_ID.AUTH?this.walletFeaturesTemplate():this.defaultTemplate()}
    `}walletFeaturesTemplate(){return l`<w3m-account-wallet-features-widget></w3m-account-wallet-features-widget>`}defaultTemplate(){return l`<w3m-account-default-widget></w3m-account-default-widget>`}};on([d()],ci.prototype,"namespace",void 0);ci=on([f("w3m-account-view")],ci);const eo=$`
  wui-image {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  wui-image,
  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  wui-icon:not(.custom-icon, .icon-badge) {
    cursor: pointer;
  }

  .icon-box {
    position: relative;
    border-radius: ${({borderRadius:t})=>t[2]};
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  .icon-badge {
    position: absolute;
    top: 18px;
    left: 23px;
    z-index: 3;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
    border-radius: 50%;
    padding: ${({spacing:t})=>t["01"]};
  }

  .icon-badge {
    width: 8px;
    height: 8px;
  }
`;var Y=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let U=class extends w{constructor(){super(...arguments),this.address="",this.profileName="",this.content=[],this.alt="",this.imageSrc="",this.icon=void 0,this.iconSize="md",this.iconBadge=void 0,this.iconBadgeSize="md",this.buttonVariant="neutral-primary",this.enableMoreButton=!1,this.charsStart=4,this.charsEnd=6}render(){return l`
      <wui-flex flexDirection="column" rowgap="2">
        ${this.topTemplate()} ${this.bottomTemplate()}
      </wui-flex>
    `}topTemplate(){return l`
      <wui-flex alignItems="flex-start" justifyContent="space-between">
        ${this.imageOrIconTemplate()}
        <wui-icon-link
          variant="secondary"
          size="md"
          icon="copy"
          @click=${this.dispatchCopyEvent}
        ></wui-icon-link>
        <wui-icon-link
          variant="secondary"
          size="md"
          icon="externalLink"
          @click=${this.dispatchExternalLinkEvent}
        ></wui-icon-link>
        ${this.enableMoreButton?l`<wui-icon-link
              variant="secondary"
              size="md"
              icon="threeDots"
              @click=${this.dispatchMoreButtonEvent}
              data-testid="wui-active-profile-wallet-item-more-button"
            ></wui-icon-link>`:null}
      </wui-flex>
    `}bottomTemplate(){return l` <wui-flex flexDirection="column">${this.contentTemplate()}</wui-flex> `}imageOrIconTemplate(){return this.icon?l`
        <wui-flex flexGrow="1" alignItems="center">
          <wui-flex alignItems="center" justifyContent="center" class="icon-box">
            <wui-icon size="lg" color="default" name=${this.icon} class="custom-icon"></wui-icon>

            ${this.iconBadge?l`<wui-icon
                  color="accent-primary"
                  size="inherit"
                  name=${this.iconBadge}
                  class="icon-badge"
                ></wui-icon>`:null}
          </wui-flex>
        </wui-flex>
      `:l`
      <wui-flex flexGrow="1" alignItems="center">
        <wui-image objectFit="contain" src=${this.imageSrc} alt=${this.alt}></wui-image>
      </wui-flex>
    `}contentTemplate(){return this.content.length===0?null:l`
      <wui-flex flexDirection="column" rowgap="3">
        ${this.content.map(e=>this.labelAndTagTemplate(e))}
      </wui-flex>
    `}labelAndTagTemplate({address:e,profileName:n,label:o,description:r,enableButton:i,buttonType:s,buttonLabel:a,buttonVariant:x,tagVariant:v,tagLabel:_,alignItems:S="flex-end"}){return l`
      <wui-flex justifyContent="space-between" alignItems=${S} columngap="1">
        <wui-flex flexDirection="column" rowgap="01">
          ${o?l`<wui-text variant="sm-medium" color="secondary">${o}</wui-text>`:null}

          <wui-flex alignItems="center" columngap="1">
            <wui-text variant="md-regular" color="primary">
              ${F.getTruncateString({string:n||e,charsStart:n?16:this.charsStart,charsEnd:n?0:this.charsEnd,truncate:n?"end":"middle"})}
            </wui-text>

            ${v&&_?l`<wui-tag variant=${v} size="sm">${_}</wui-tag>`:null}
          </wui-flex>

          ${r?l`<wui-text variant="sm-regular" color="secondary">${r}</wui-text>`:null}
        </wui-flex>

        ${i?this.buttonTemplate({buttonType:s,buttonLabel:a,buttonVariant:x}):null}
      </wui-flex>
    `}buttonTemplate({buttonType:e,buttonLabel:n,buttonVariant:o}){return l`
      <wui-button
        size="sm"
        variant=${o}
        @click=${e==="disconnect"?this.dispatchDisconnectEvent.bind(this):this.dispatchSwitchEvent.bind(this)}
        data-testid=${e==="disconnect"?"wui-active-profile-wallet-item-disconnect-button":"wui-active-profile-wallet-item-switch-button"}
      >
        ${n}
      </wui-button>
    `}dispatchDisconnectEvent(){this.dispatchEvent(new CustomEvent("disconnect",{bubbles:!0,composed:!0}))}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("switch",{bubbles:!0,composed:!0}))}dispatchExternalLinkEvent(){this.dispatchEvent(new CustomEvent("externalLink",{bubbles:!0,composed:!0}))}dispatchMoreButtonEvent(){this.dispatchEvent(new CustomEvent("more",{bubbles:!0,composed:!0}))}dispatchCopyEvent(){this.dispatchEvent(new CustomEvent("copy",{bubbles:!0,composed:!0}))}};U.styles=[T,N,eo];Y([c()],U.prototype,"address",void 0);Y([c()],U.prototype,"profileName",void 0);Y([c({type:Array})],U.prototype,"content",void 0);Y([c()],U.prototype,"alt",void 0);Y([c()],U.prototype,"imageSrc",void 0);Y([c()],U.prototype,"icon",void 0);Y([c()],U.prototype,"iconSize",void 0);Y([c()],U.prototype,"iconBadge",void 0);Y([c()],U.prototype,"iconBadgeSize",void 0);Y([c()],U.prototype,"buttonVariant",void 0);Y([c({type:Boolean})],U.prototype,"enableMoreButton",void 0);Y([c({type:Number})],U.prototype,"charsStart",void 0);Y([c({type:Number})],U.prototype,"charsEnd",void 0);U=Y([f("wui-active-profile-wallet-item")],U);const to=$`
  wui-image,
  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  .right-icon {
    cursor: pointer;
  }

  .icon-box {
    position: relative;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  .icon-badge {
    position: absolute;
    top: 18px;
    left: 23px;
    z-index: 3;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
    border-radius: 50%;
    padding: ${({spacing:t})=>t["01"]};
  }

  .icon-badge {
    width: 8px;
    height: 8px;
  }
`;var z=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let P=class extends w{constructor(){super(...arguments),this.address="",this.profileName="",this.alt="",this.buttonLabel="",this.buttonVariant="accent-primary",this.imageSrc="",this.icon=void 0,this.iconSize="md",this.iconBadgeSize="md",this.rightIcon="signOut",this.rightIconSize="md",this.loading=!1,this.charsStart=4,this.charsEnd=6}render(){return l`
      <wui-flex alignItems="center" columngap="2">
        ${this.imageOrIconTemplate()} ${this.labelAndDescriptionTemplate()}
        ${this.buttonActionTemplate()}
      </wui-flex>
    `}imageOrIconTemplate(){return this.icon?l`
        <wui-flex alignItems="center" justifyContent="center" class="icon-box">
          <wui-flex alignItems="center" justifyContent="center" class="icon-box">
            <wui-icon size="lg" color="default" name=${this.icon} class="custom-icon"></wui-icon>

            ${this.iconBadge?l`<wui-icon
                  color="default"
                  size="inherit"
                  name=${this.iconBadge}
                  class="icon-badge"
                ></wui-icon>`:null}
          </wui-flex>
        </wui-flex>
      `:l`<wui-image objectFit="contain" src=${this.imageSrc} alt=${this.alt}></wui-image>`}labelAndDescriptionTemplate(){return l`
      <wui-flex
        flexDirection="column"
        flexGrow="1"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        <wui-text variant="lg-regular" color="primary">
          ${F.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?16:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"})}
        </wui-text>
      </wui-flex>
    `}buttonActionTemplate(){return l`
      <wui-flex columngap="1" alignItems="center" justifyContent="center">
        <wui-button
          size="sm"
          variant=${this.buttonVariant}
          .loading=${this.loading}
          @click=${this.handleButtonClick}
          data-testid="wui-inactive-profile-wallet-item-button"
        >
          ${this.buttonLabel}
        </wui-button>

        <wui-icon-link
          variant="secondary"
          size="md"
          icon=${h(this.rightIcon)}
          class="right-icon"
          @click=${this.handleIconClick}
        ></wui-icon-link>
      </wui-flex>
    `}handleButtonClick(){this.dispatchEvent(new CustomEvent("buttonClick",{bubbles:!0,composed:!0}))}handleIconClick(){this.dispatchEvent(new CustomEvent("iconClick",{bubbles:!0,composed:!0}))}};P.styles=[T,N,to];z([c()],P.prototype,"address",void 0);z([c()],P.prototype,"profileName",void 0);z([c()],P.prototype,"alt",void 0);z([c()],P.prototype,"buttonLabel",void 0);z([c()],P.prototype,"buttonVariant",void 0);z([c()],P.prototype,"imageSrc",void 0);z([c()],P.prototype,"icon",void 0);z([c()],P.prototype,"iconSize",void 0);z([c()],P.prototype,"iconBadge",void 0);z([c()],P.prototype,"iconBadgeSize",void 0);z([c()],P.prototype,"rightIcon",void 0);z([c()],P.prototype,"rightIconSize",void 0);z([c({type:Boolean})],P.prototype,"loading",void 0);z([c({type:Number})],P.prototype,"charsStart",void 0);z([c({type:Number})],P.prototype,"charsEnd",void 0);P=z([f("wui-inactive-profile-wallet-item")],P);const ri={getAuthData(t){const e=t.connectorId===A.CONNECTOR_ID.AUTH;if(!e)return{isAuth:!1,icon:void 0,iconSize:void 0,name:void 0};const n=t?.auth?.name??me.getConnectedSocialProvider(),o=t?.auth?.username??me.getConnectedSocialUsername(),i=m.getAuthConnector()?.provider.getEmail()??"";return{isAuth:!0,icon:n??"mail",iconSize:n?"xl":"md",name:e?ce.getAuthName({email:i,socialUsername:o,socialProvider:n}):void 0}}},io=$`
  :host {
    --connect-scroll--top-opacity: 0;
    --connect-scroll--bottom-opacity: 0;
  }

  .balance-amount {
    flex: 1;
  }

  .wallet-list {
    scrollbar-width: none;
    overflow-y: scroll;
    overflow-x: hidden;
    transition: opacity ${({easings:t})=>t["ease-out-power-1"]}
      ${({durations:t})=>t.md};
    will-change: opacity;
    mask-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, calc(1 - var(--connect-scroll--top-opacity))) 0px,
      rgba(200, 200, 200, calc(1 - var(--connect-scroll--top-opacity))) 1px,
      black 40px,
      black calc(100% - 40px),
      rgba(155, 155, 155, calc(1 - var(--connect-scroll--bottom-opacity))) calc(100% - 1px),
      rgba(0, 0, 0, calc(1 - var(--connect-scroll--bottom-opacity))) 100%
    );
  }

  .active-wallets {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  .active-wallets-box {
    height: 330px;
  }

  .empty-wallet-list-box {
    height: 400px;
  }

  .empty-box {
    width: 100%;
    padding: ${({spacing:t})=>t[4]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-separator {
    margin: ${({spacing:t})=>t[2]} 0 ${({spacing:t})=>t[2]} 0;
  }

  .active-connection {
    padding: ${({spacing:t})=>t[2]};
  }

  .recent-connection {
    padding: ${({spacing:t})=>t[2]} 0 ${({spacing:t})=>t[2]} 0;
  }

  @media (max-width: 430px) {
    .active-wallets-box,
    .empty-wallet-list-box {
      height: auto;
      max-height: clamp(360px, 470px, 80vh);
    }
  }
`;var Z=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const te={ADDRESS_DISPLAY:{START:4,END:6},BADGE:{SIZE:"md",ICON:"lightbulb"},SCROLL_THRESHOLD:50,OPACITY_RANGE:[0,1]},ct={eip155:"ethereum",solana:"solana",bip122:"bitcoin"},no=[{namespace:"eip155",icon:ct.eip155,label:"EVM"},{namespace:"solana",icon:ct.solana,label:"Solana"},{namespace:"bip122",icon:ct.bip122,label:"Bitcoin"}],oo={eip155:{title:"Add EVM Wallet",description:"Add your first EVM wallet"},solana:{title:"Add Solana Wallet",description:"Add your first Solana wallet"},bip122:{title:"Add Bitcoin Wallet",description:"Add your first Bitcoin wallet"}};let M=class extends w{constructor(){super(),this.unsubscribers=[],this.currentTab=0,this.namespace=u.state.activeChain,this.namespaces=Array.from(u.state.chains.keys()),this.caipAddress=void 0,this.profileName=void 0,this.activeConnectorIds=m.state.activeConnectorIds,this.lastSelectedAddress="",this.lastSelectedConnectorId="",this.isSwitching=!1,this.caipNetwork=u.state.activeCaipNetwork,this.user=u.getAccountData()?.user,this.remoteFeatures=b.state.remoteFeatures,this.currentTab=this.namespace?this.namespaces.indexOf(this.namespace):0,this.caipAddress=u.getAccountData(this.namespace)?.caipAddress,this.profileName=u.getAccountData(this.namespace)?.profileName,this.unsubscribers.push(y.subscribeKey("connections",()=>this.onConnectionsChange()),y.subscribeKey("recentConnections",()=>this.requestUpdate()),m.subscribeKey("activeConnectorIds",e=>{this.activeConnectorIds=e}),u.subscribeKey("activeCaipNetwork",e=>this.caipNetwork=e),u.subscribeChainProp("accountState",e=>{this.user=e?.user}),b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e)),this.chainListener=u.subscribeChainProp("accountState",e=>{this.caipAddress=e?.caipAddress,this.profileName=e?.profileName},this.namespace)}disconnectedCallback(){this.unsubscribers.forEach(e=>e()),this.resizeObserver?.disconnect(),this.removeScrollListener(),this.chainListener?.()}firstUpdated(){const e=this.shadowRoot?.querySelector(".wallet-list");if(!e)return;const n=()=>this.updateScrollOpacity(e);requestAnimationFrame(n),e.addEventListener("scroll",n),this.resizeObserver=new ResizeObserver(n),this.resizeObserver.observe(e),n()}render(){const e=this.namespace;if(!e)throw new Error("Namespace is not set");return l`
      <wui-flex flexDirection="column" .padding=${["0","4","4","4"]} gap="4">
        ${this.renderTabs()} ${this.renderHeader(e)} ${this.renderConnections(e)}
        ${this.renderAddConnectionButton(e)}
      </wui-flex>
    `}renderTabs(){const e=no.filter(o=>this.namespaces.includes(o.namespace));return e.length>1?l`
        <wui-tabs
          .onTabChange=${o=>this.handleTabChange(o)}
          .activeTab=${this.currentTab}
          .tabs=${e}
        ></wui-tabs>
      `:null}renderHeader(e){const o=this.getActiveConnections(e).flatMap(({accounts:r})=>r).length+(this.caipAddress?1:0);return l`
      <wui-flex alignItems="center" columngap="1">
        <wui-icon
          size="sm"
          name=${ct[e]??ct.eip155}
        ></wui-icon>
        <wui-text color="secondary" variant="lg-regular"
          >${o>1?"Wallets":"Wallet"}</wui-text
        >
        <wui-text
          color="primary"
          variant="lg-regular"
          class="balance-amount"
          data-testid="balance-amount"
        >
          ${o}
        </wui-text>
        <wui-link
          color="secondary"
          variant="secondary"
          @click=${()=>y.disconnect({namespace:e})}
          ?disabled=${!this.hasAnyConnections(e)}
          data-testid="disconnect-all-button"
        >
          Disconnect All
        </wui-link>
      </wui-flex>
    `}renderConnections(e){const n=this.hasAnyConnections(e);return l`
      <wui-flex flexDirection="column" class=${tn({"wallet-list":!0,"active-wallets-box":n,"empty-wallet-list-box":!n})} rowgap="3">
        ${n?this.renderActiveConnections(e):this.renderEmptyState(e)}
      </wui-flex>
    `}renderActiveConnections(e){const n=this.getActiveConnections(e),o=this.activeConnectorIds[e],r=this.getPlainAddress();return l`
      ${r||o||n.length>0?l`<wui-flex
            flexDirection="column"
            .padding=${["4","0","4","0"]}
            class="active-wallets"
          >
            ${this.renderActiveProfile(e)} ${this.renderActiveConnectionsList(e)}
          </wui-flex>`:null}
      ${this.renderRecentConnections(e)}
    `}renderActiveProfile(e){const n=this.activeConnectorIds[e];if(!n)return null;const{connections:o}=Ee.getConnectionsData(e),r=m.getConnectorById(n),i=E.getConnectorImage(r),s=this.getPlainAddress();if(!s)return null;const a=e===A.CHAIN.BITCOIN,x=ri.getAuthData({connectorId:n,accounts:[]}),v=this.getActiveConnections(e).flatMap(I=>I.accounts).length>0,_=o.find(I=>I.connectorId===n),S=_?.accounts.filter(I=>!X.isLowerCaseMatch(I.address,s));return l`
      <wui-flex flexDirection="column" .padding=${["0","4","0","4"]}>
        <wui-active-profile-wallet-item
          address=${s}
          alt=${r?.name}
          .content=${this.getProfileContent({address:s,connections:o,connectorId:n,namespace:e})}
          .charsStart=${te.ADDRESS_DISPLAY.START}
          .charsEnd=${te.ADDRESS_DISPLAY.END}
          .icon=${x.icon}
          .iconSize=${x.iconSize}
          .iconBadge=${this.isSmartAccount(s)?te.BADGE.ICON:void 0}
          .iconBadgeSize=${this.isSmartAccount(s)?te.BADGE.SIZE:void 0}
          imageSrc=${i}
          ?enableMoreButton=${x.isAuth}
          @copy=${()=>this.handleCopyAddress(s)}
          @disconnect=${()=>this.handleDisconnect(e,n)}
          @switch=${()=>{a&&_&&S?.[0]&&this.handleSwitchWallet(_,S[0].address,e)}}
          @externalLink=${()=>this.handleExternalLink(s)}
          @more=${()=>this.handleMore()}
          data-testid="wui-active-profile-wallet-item"
        ></wui-active-profile-wallet-item>
        ${v?l`<wui-separator></wui-separator>`:null}
      </wui-flex>
    `}renderActiveConnectionsList(e){const n=this.getActiveConnections(e);return n.length===0?null:l`
      <wui-flex flexDirection="column" .padding=${["0","2","0","2"]}>
        ${this.renderConnectionList(n,!1,e)}
      </wui-flex>
    `}renderRecentConnections(e){const{recentConnections:n}=Ee.getConnectionsData(e);return n.flatMap(r=>r.accounts).length===0?null:l`
      <wui-flex flexDirection="column" .padding=${["0","2","0","2"]} rowGap="2">
        <wui-text color="secondary" variant="sm-medium" data-testid="recently-connected-text"
          >RECENTLY CONNECTED</wui-text
        >
        <wui-flex flexDirection="column" .padding=${["0","2","0","2"]}>
          ${this.renderConnectionList(n,!0,e)}
        </wui-flex>
      </wui-flex>
    `}renderConnectionList(e,n,o){return e.filter(r=>r.accounts.length>0).map((r,i)=>{const s=m.getConnectorById(r.connectorId),a=E.getConnectorImage(s)??"",x=ri.getAuthData(r);return r.accounts.map((v,_)=>{const S=i!==0||_!==0,I=this.isAccountLoading(r.connectorId,v.address);return l`
            <wui-flex flexDirection="column">
              ${S?l`<wui-separator></wui-separator>`:null}
              <wui-inactive-profile-wallet-item
                address=${v.address}
                alt=${r.connectorId}
                buttonLabel=${n?"Connect":"Switch"}
                buttonVariant=${n?"neutral-secondary":"accent-secondary"}
                rightIcon=${n?"bin":"power"}
                rightIconSize="sm"
                class=${n?"recent-connection":"active-connection"}
                data-testid=${n?"recent-connection":"active-connection"}
                imageSrc=${a}
                .iconBadge=${this.isSmartAccount(v.address)?te.BADGE.ICON:void 0}
                .iconBadgeSize=${this.isSmartAccount(v.address)?te.BADGE.SIZE:void 0}
                .icon=${x.icon}
                .iconSize=${x.iconSize}
                .loading=${I}
                .showBalance=${!1}
                .charsStart=${te.ADDRESS_DISPLAY.START}
                .charsEnd=${te.ADDRESS_DISPLAY.END}
                @buttonClick=${()=>this.handleSwitchWallet(r,v.address,o)}
                @iconClick=${()=>this.handleWalletAction({connection:r,address:v.address,isRecentConnection:n,namespace:o})}
              ></wui-inactive-profile-wallet-item>
            </wui-flex>
          `})})}renderAddConnectionButton(e){if(!this.isMultiWalletEnabled()&&this.caipAddress||!this.hasAnyConnections(e))return null;const{title:n}=this.getChainLabelInfo(e);return l`
      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="plus"
        iconSize="sm"
        ?chevron=${!0}
        @click=${()=>this.handleAddConnection(e)}
        data-testid="add-connection-button"
      >
        <wui-text variant="md-medium" color="secondary">${n}</wui-text>
      </wui-list-item>
    `}renderEmptyState(e){const{title:n,description:o}=this.getChainLabelInfo(e);return l`
      <wui-flex alignItems="flex-start" class="empty-template" data-testid="empty-template">
        <wui-flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          rowgap="3"
          class="empty-box"
        >
          <wui-icon-box size="xl" icon="wallet" color="secondary"></wui-icon-box>

          <wui-flex flexDirection="column" alignItems="center" justifyContent="center" gap="1">
            <wui-text color="primary" variant="lg-regular" data-testid="empty-state-text"
              >No wallet connected</wui-text
            >
            <wui-text color="secondary" variant="md-regular" data-testid="empty-state-description"
              >${o}</wui-text
            >
          </wui-flex>

          <wui-link
            @click=${()=>this.handleAddConnection(e)}
            data-testid="empty-state-button"
            icon="plus"
          >
            ${n}
          </wui-link>
        </wui-flex>
      </wui-flex>
    `}handleTabChange(e){const n=this.namespaces[e];n&&(this.chainListener?.(),this.currentTab=this.namespaces.indexOf(n),this.namespace=n,this.caipAddress=u.getAccountData(n)?.caipAddress,this.profileName=u.getAccountData(n)?.profileName,this.chainListener=u.subscribeChainProp("accountState",o=>{this.caipAddress=o?.caipAddress},n))}async handleSwitchWallet(e,n,o){try{this.isSwitching=!0,this.lastSelectedConnectorId=e.connectorId,this.lastSelectedAddress=n,await y.switchConnection({connection:e,address:n,namespace:o,closeModalOnConnect:!1,onChange({hasSwitchedAccount:r,hasSwitchedWallet:i}){i?W.showSuccess("Wallet switched"):r&&W.showSuccess("Account switched")}})}catch{W.showError("Failed to switch wallet")}finally{this.isSwitching=!1}}handleWalletAction(e){const{connection:n,address:o,isRecentConnection:r,namespace:i}=e;r?(me.deleteAddressFromConnection({connectorId:n.connectorId,address:o,namespace:i}),y.syncStorageConnections(),W.showSuccess("Wallet deleted")):this.handleDisconnect(i,n.connectorId)}async handleDisconnect(e,n){try{await y.disconnectConnector({id:n,namespace:e}),W.showSuccess("Wallet disconnected")}catch{W.showError("Failed to disconnect wallet")}}handleCopyAddress(e){g.copyToClopboard(e),W.showSuccess("Address copied")}handleMore(){p.push("AccountSettings")}handleExternalLink(e){const n=this.caipNetwork?.blockExplorers?.default.url;n&&g.openHref(`${n}/address/${e}`,"_blank")}handleAddConnection(e){m.setFilterByNamespace(e),p.push("Connect",{addWalletForNamespace:e})}getChainLabelInfo(e){return oo[e]??{title:"Add Wallet",description:"Add your first wallet"}}isSmartAccount(e){if(!this.namespace)return!1;const n=this.user?.accounts?.find(o=>o.type==="smartAccount");return n&&e?X.isLowerCaseMatch(n.address,e):!1}getPlainAddress(){return this.caipAddress?g.getPlainAddress(this.caipAddress):void 0}getActiveConnections(e){const n=this.activeConnectorIds[e],{connections:o}=Ee.getConnectionsData(e),[r]=o.filter(x=>X.isLowerCaseMatch(x.connectorId,n));if(!n)return o;const i=e===A.CHAIN.BITCOIN,{address:s}=this.caipAddress?yn.parseCaipAddress(this.caipAddress):{};let a=[...s?[s]:[]];return i&&r&&(a=r.accounts.map(x=>x.address)||[]),Ee.excludeConnectorAddressFromConnections({connectorId:n,addresses:a,connections:o})}hasAnyConnections(e){const n=this.getActiveConnections(e),{recentConnections:o}=Ee.getConnectionsData(e);return!!this.caipAddress||n.length>0||o.length>0}isAccountLoading(e,n){return X.isLowerCaseMatch(this.lastSelectedConnectorId,e)&&X.isLowerCaseMatch(this.lastSelectedAddress,n)&&this.isSwitching}getProfileContent(e){const{address:n,connections:o,connectorId:r,namespace:i}=e,[s]=o.filter(x=>X.isLowerCaseMatch(x.connectorId,r));if(i===A.CHAIN.BITCOIN&&s?.accounts.every(x=>typeof x.type=="string"))return this.getBitcoinProfileContent(s.accounts,n);const a=ri.getAuthData({connectorId:r,accounts:[]});return[{address:n,tagLabel:"Active",tagVariant:"success",enableButton:!0,profileName:this.profileName,buttonType:"disconnect",buttonLabel:"Disconnect",buttonVariant:"neutral-secondary",...a.isAuth?{description:this.isSmartAccount(n)?"Smart Account":"EOA Account"}:{}}]}getBitcoinProfileContent(e,n){const o=e.length>1,r=this.getPlainAddress();return e.map(i=>{const s=X.isLowerCaseMatch(i.address,r);let a="PAYMENT";return i.type==="ordinal"&&(a="ORDINALS"),{address:i.address,tagLabel:X.isLowerCaseMatch(i.address,n)?"Active":void 0,tagVariant:X.isLowerCaseMatch(i.address,n)?"success":void 0,enableButton:!0,...o?{label:a,alignItems:"flex-end",buttonType:s?"disconnect":"switch",buttonLabel:s?"Disconnect":"Switch",buttonVariant:s?"neutral-secondary":"accent-secondary"}:{alignItems:"center",buttonType:"disconnect",buttonLabel:"Disconnect",buttonVariant:"neutral-secondary"}}})}removeScrollListener(){const e=this.shadowRoot?.querySelector(".wallet-list");e&&e.removeEventListener("scroll",()=>this.handleConnectListScroll())}handleConnectListScroll(){const e=this.shadowRoot?.querySelector(".wallet-list");e&&this.updateScrollOpacity(e)}isMultiWalletEnabled(){return!!this.remoteFeatures?.multiWallet}updateScrollOpacity(e){e.style.setProperty("--connect-scroll--top-opacity",It.interpolate([0,te.SCROLL_THRESHOLD],te.OPACITY_RANGE,e.scrollTop).toString()),e.style.setProperty("--connect-scroll--bottom-opacity",It.interpolate([0,te.SCROLL_THRESHOLD],te.OPACITY_RANGE,e.scrollHeight-e.scrollTop-e.offsetHeight).toString())}onConnectionsChange(){if(this.isMultiWalletEnabled()&&this.namespace){const{connections:e}=Ee.getConnectionsData(this.namespace);e.length===0&&p.reset("ProfileWallets")}this.requestUpdate()}};M.styles=io;Z([d()],M.prototype,"currentTab",void 0);Z([d()],M.prototype,"namespace",void 0);Z([d()],M.prototype,"namespaces",void 0);Z([d()],M.prototype,"caipAddress",void 0);Z([d()],M.prototype,"profileName",void 0);Z([d()],M.prototype,"activeConnectorIds",void 0);Z([d()],M.prototype,"lastSelectedAddress",void 0);Z([d()],M.prototype,"lastSelectedConnectorId",void 0);Z([d()],M.prototype,"isSwitching",void 0);Z([d()],M.prototype,"caipNetwork",void 0);Z([d()],M.prototype,"user",void 0);Z([d()],M.prototype,"remoteFeatures",void 0);M=Z([f("w3m-profile-wallets-view")],M);const ro=$`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      color ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      border ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      box-shadow ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      width ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      height ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      transform ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      opacity ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:t})=>t.neutrals300};
    border-radius: ${({borderRadius:t})=>t.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      color ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      border ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      box-shadow ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      width ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      height ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      transform ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      opacity ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:t})=>t.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:t})=>t.core.iconAccentPrimary};
    background-color: ${({tokens:t})=>t.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:t})=>t.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:t})=>t.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:t})=>t.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:t})=>t.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:t})=>t.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:t})=>t.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:t})=>t.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:t})=>t.theme.textTertiary};
  }
`;var qt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Xe=class extends w{constructor(){super(...arguments),this.inputElementRef=yi(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return l`
      <label data-size=${this.size}>
        <input
          ${xi(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};Xe.styles=[T,N,ro];qt([c({type:Boolean})],Xe.prototype,"checked",void 0);qt([c({type:Boolean})],Xe.prototype,"disabled",void 0);qt([c()],Xe.prototype,"size",void 0);Xe=qt([f("wui-toggle")],Xe);const so=$`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:t})=>t[2]};
    padding: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
    box-shadow: inset 0 0 0 1px ${({tokens:t})=>t.theme.foregroundPrimary};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var rn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let _t=class extends w{constructor(){super(...arguments),this.checked=!1}render(){return l`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(e){e.stopPropagation(),this.checked=e.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};_t.styles=[T,N,so];rn([c({type:Boolean})],_t.prototype,"checked",void 0);_t=rn([f("wui-certified-switch")],_t);const ao=$`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:t})=>t[3]};
    color: ${({tokens:t})=>t.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:t})=>t[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:t})=>t[4]};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }
`;var sn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Tt=class extends w{constructor(){super(...arguments),this.inputComponentRef=yi(),this.inputValue=""}render(){return l`
      <wui-input-text
        ${xi(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?l`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(e){this.inputValue=e.detail||""}clearValue(){const n=this.inputComponentRef.value?.inputElementRef.value;n&&(n.value="",this.inputValue="",n.focus(),n.dispatchEvent(new Event("input")))}};Tt.styles=[T,ao];sn([c()],Tt.prototype,"inputValue",void 0);Tt=sn([f("wui-search-bar")],Tt);const lo=$`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:t})=>t[2]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:t})=>t.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var an=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Rt=class extends w{constructor(){super(...arguments),this.type="wallet"}render(){return l`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?l` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${Tn}`:l`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};Rt.styles=[T,N,lo];an([c()],Rt.prototype,"type",void 0);Rt=an([f("wui-card-select-loader")],Rt);const co=ne`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var se=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let q=class extends w{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&F.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&F.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&F.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&F.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&F.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&F.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&F.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&F.getSpacingStyles(this.margin,3)};
    `,l`<slot></slot>`}};q.styles=[T,co];se([c()],q.prototype,"gridTemplateRows",void 0);se([c()],q.prototype,"gridTemplateColumns",void 0);se([c()],q.prototype,"justifyItems",void 0);se([c()],q.prototype,"alignItems",void 0);se([c()],q.prototype,"justifyContent",void 0);se([c()],q.prototype,"alignContent",void 0);se([c()],q.prototype,"columnGap",void 0);se([c()],q.prototype,"rowGap",void 0);se([c()],q.prototype,"gap",void 0);se([c()],q.prototype,"padding",void 0);se([c()],q.prototype,"margin",void 0);q=se([f("wui-grid")],q);const uo=$`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:t})=>t[2]};
    padding: ${({spacing:t})=>t[3]} ${({spacing:t})=>t[0]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:t})=>t[4]}, 20px);
    transition:
      color ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-1"]},
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-1"]},
      border-radius ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:t})=>t.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:t})=>t.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:t})=>t.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:t})=>t.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:t})=>t.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var Se=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ue=class extends w{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(n=>{n.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){const e=this.wallet?.badge_type==="certified";return l`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${h(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?l`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():l`
      <wui-wallet-image
        size="lg"
        imageSrc=${h(this.imageSrc)}
        name=${h(this.wallet?.name)}
        .installed=${this.wallet?.installed??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return l`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=E.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await E.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){!this.wallet||this.isImpressed||(this.isImpressed=!0,C.sendEvent({type:"track",event:"WALLET_IMPRESSION",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:p.state.view,query:this.walletQuery,certified:this.certified}}))}};ue.styles=uo;Se([d()],ue.prototype,"visible",void 0);Se([d()],ue.prototype,"imageSrc",void 0);Se([d()],ue.prototype,"imageLoading",void 0);Se([d()],ue.prototype,"isImpressed",void 0);Se([c()],ue.prototype,"explorerId",void 0);Se([c()],ue.prototype,"walletQuery",void 0);Se([c()],ue.prototype,"certified",void 0);Se([c({type:Object})],ue.prototype,"wallet",void 0);ue=Se([f("w3m-all-wallets-list-item")],ue);const ho=$`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:t})=>t.xl};
    animation-timing-function: ${({easings:t})=>t["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:t})=>t[4]};
    padding-bottom: ${({spacing:t})=>t[4]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var Ne=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const zi="local-paginator";let be=class extends w{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!k.state.wallets.length,this.wallets=k.state.wallets,this.recommended=k.state.recommended,this.featured=k.state.featured,this.filteredWallets=k.state.filteredWallets,this.mobileFullScreen=b.state.enableMobileFullScreen,this.unsubscribe.push(k.subscribeKey("wallets",e=>this.wallets=e),k.subscribeKey("recommended",e=>this.recommended=e),k.subscribeKey("featured",e=>this.featured=e),k.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),l`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;const e=this.shadowRoot?.querySelector("wui-grid");e&&(await k.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,n){return[...Array(e)].map(()=>l`
        <wui-card-select-loader type="wallet" id=${h(n)}></wui-card-select-loader>
      `)}getWallets(){const e=[...this.featured,...this.recommended];this.filteredWallets?.length>0?e.push(...this.filteredWallets):e.push(...this.wallets);const n=g.uniqueBy(e,"id"),o=De.markWalletsAsInstalled(n);return De.markWalletsWithDisplayIndex(o)}walletsTemplate(){return this.getWallets().map(n=>l`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${n.id}"
          @click=${()=>this.onConnectWallet(n)}
          .wallet=${n}
          explorerId=${n.id}
          certified=${this.badge==="certified"}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:n,featured:o,count:r,mobileFilteredOutWalletsLength:i}=k.state,s=window.innerWidth<352?3:4,a=e.length+n.length;let v=Math.ceil(a/s)*s-a+s;return v-=e.length?o.length%s:0,r===0&&o.length>0?null:r===0||[...o,...e,...n].length<r-(i??0)?this.shimmerTemplate(v,zi):null}createPaginationObserver(){const e=this.shadowRoot?.querySelector(`#${zi}`);e&&(this.paginationObserver=new IntersectionObserver(([n])=>{if(n?.isIntersecting&&!this.loading){const{page:o,count:r,wallets:i}=k.state;i.length<r&&k.fetchWalletsByPage({page:o+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){m.selectWalletConnector(e)}};be.styles=ho;Ne([d()],be.prototype,"loading",void 0);Ne([d()],be.prototype,"wallets",void 0);Ne([d()],be.prototype,"recommended",void 0);Ne([d()],be.prototype,"featured",void 0);Ne([d()],be.prototype,"filteredWallets",void 0);Ne([d()],be.prototype,"badge",void 0);Ne([d()],be.prototype,"mobileFullScreen",void 0);be=Ne([f("w3m-all-wallets-list")],be);const po=ne`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var Et=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Fe=class extends w{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=b.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?l`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await k.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=k.state,n=De.markWalletsAsInstalled(e);return e.length?l`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${n.map(o=>l`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(o)}
              .wallet=${o}
              data-testid="wallet-search-item-${o.id}"
              explorerId=${o.id}
              certified=${this.badge==="certified"}
              walletQuery=${this.query}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:l`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){m.selectWalletConnector(e)}};Fe.styles=po;Et([d()],Fe.prototype,"loading",void 0);Et([d()],Fe.prototype,"mobileFullScreen",void 0);Et([c()],Fe.prototype,"query",void 0);Et([c()],Fe.prototype,"badge",void 0);Fe=Et([f("w3m-all-wallets-search")],Fe);var Ci=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Nt=class extends w{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=g.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return l`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge==="certified"}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?l`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:l`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onCertifiedSwitchChange(e){e.detail?(this.badge="certified",W.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return g.isMobile()?l`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){p.push("ConnectingWalletConnect")}};Ci([d()],Nt.prototype,"search",void 0);Ci([d()],Nt.prototype,"badge",void 0);Nt=Ci([f("w3m-all-wallets-view")],Nt);const fo=$`
  button {
    display: flex;
    gap: ${({spacing:t})=>t[1]};
    padding: ${({spacing:t})=>t[4]};
    width: 100%;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
    justify-content: center;
    align-items: center;
  }

  :host([data-size='sm']) button {
    padding: ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  :host([data-size='md']) button {
    padding: ${({spacing:t})=>t[3]};
    border-radius: ${({borderRadius:t})=>t[3]};
  }

  button:hover {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  button:disabled {
    opacity: 0.5;
  }
`;var it=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ie=class extends w{constructor(){super(...arguments),this.text="",this.disabled=!1,this.size="lg",this.icon="copy",this.tabIdx=void 0}render(){this.dataset.size=this.size;const e=`${this.size}-regular`;return l`
      <button ?disabled=${this.disabled} tabindex=${h(this.tabIdx)}>
        <wui-icon name=${this.icon} size=${this.size} color="default"></wui-icon>
        <wui-text align="center" variant=${e} color="primary">${this.text}</wui-text>
      </button>
    `}};Ie.styles=[T,N,fo];it([c()],Ie.prototype,"text",void 0);it([c({type:Boolean})],Ie.prototype,"disabled",void 0);it([c()],Ie.prototype,"size",void 0);it([c()],Ie.prototype,"icon",void 0);it([c()],Ie.prototype,"tabIdx",void 0);Ie=it([f("wui-list-button")],Ie);const wo=$`
  wui-separator {
    margin: ${({spacing:t})=>t[3]} calc(${({spacing:t})=>t[3]} * -1);
    width: calc(100% + ${({spacing:t})=>t[3]} * 2);
  }

  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }

  wui-icon-link,
  wui-loading-spinner {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  wui-icon-link {
    right: ${({spacing:t})=>t[2]};
  }

  wui-loading-spinner {
    right: ${({spacing:t})=>t[3]};
  }

  wui-text {
    margin: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]}
      ${({spacing:t})=>t[0]} ${({spacing:t})=>t[3]};
  }
`;var nt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let We=class extends w{constructor(){super(),this.unsubscribe=[],this.formRef=yi(),this.email="",this.loading=!1,this.error="",this.remoteFeatures=b.state.remoteFeatures,this.unsubscribe.push(b.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}firstUpdated(){this.formRef.value?.addEventListener("keydown",e=>{e.key==="Enter"&&this.onSubmitEmail(e)})}render(){const e=y.hasAnyConnection(A.CONNECTOR_ID.AUTH);return l`
      <form ${xi(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
        <wui-email-input
          @focus=${this.onFocusEvent.bind(this)}
          .disabled=${this.loading}
          @inputChange=${this.onEmailInputChange.bind(this)}
          tabIdx=${h(this.tabIdx)}
          ?disabled=${e}
        >
        </wui-email-input>

        ${this.submitButtonTemplate()}${this.loadingTemplate()}
        <input type="submit" hidden />
      </form>
      ${this.templateError()}
    `}submitButtonTemplate(){return!this.loading&&this.email.length>3?l`
          <wui-icon-link
            size="sm"
            icon="chevronRight"
            iconcolor="accent-100"
            @click=${this.onSubmitEmail.bind(this)}
          >
          </wui-icon-link>
        `:null}loadingTemplate(){return this.loading?l`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:null}templateError(){return this.error?l`<wui-text variant="sm-medium" color="error">${this.error}</wui-text>`:null}onEmailInputChange(e){this.email=e.detail.trim(),this.error=""}async onSubmitEmail(e){if(!gi.isValidEmail(this.email)){en.open({displayMessage:xn.ALERT_WARNINGS.INVALID_EMAIL.displayMessage},"warning");return}if(!A.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(o=>o===u.state.activeChain)){const o=u.getFirstCaipNetworkSupportsAuthConnector();if(o){p.push("SwitchNetwork",{network:o});return}}try{if(this.loading)return;this.loading=!0,e.preventDefault();const o=m.getAuthConnector();if(!o)throw new Error("w3m-email-login-widget: Auth connector not found");const{action:r}=await o.provider.connectEmail({email:this.email});if(C.sendEvent({type:"track",event:"EMAIL_SUBMITTED"}),r==="VERIFY_OTP")C.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),p.push("EmailVerifyOtp",{email:this.email});else if(r==="VERIFY_DEVICE")p.push("EmailVerifyDevice",{email:this.email});else if(r==="CONNECT"){const i=this.remoteFeatures?.multiWallet;await y.connectExternal(o,u.state.activeChain),i?(p.replace("ProfileWallets"),W.showSuccess("New Wallet Added")):p.replace("Account")}}catch(o){g.parseError(o)?.includes("Invalid email")?this.error="Invalid email. Try again.":W.showError(o)}finally{this.loading=!1}}onFocusEvent(){C.sendEvent({type:"track",event:"EMAIL_LOGIN_SELECTED"})}};We.styles=wo;nt([c()],We.prototype,"tabIdx",void 0);nt([d()],We.prototype,"email",void 0);nt([d()],We.prototype,"loading",void 0);nt([d()],We.prototype,"error",void 0);nt([d()],We.prototype,"remoteFeatures",void 0);We=nt([f("w3m-email-login-widget")],We);const mo=$`
  :host {
    display: block;
    width: 100%;
  }

  button {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;var Gt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Qe=class extends w{constructor(){super(...arguments),this.logo="google",this.disabled=!1,this.tabIdx=void 0}render(){return l`
      <button ?disabled=${this.disabled} tabindex=${h(this.tabIdx)}>
        <wui-icon size="xxl" name=${this.logo}></wui-icon>
      </button>
    `}};Qe.styles=[T,N,mo];Gt([c()],Qe.prototype,"logo",void 0);Gt([c({type:Boolean})],Qe.prototype,"disabled",void 0);Gt([c()],Qe.prototype,"tabIdx",void 0);Qe=Gt([f("wui-logo-select")],Qe);const bo=$`
  wui-separator {
    margin: ${({spacing:t})=>t[3]} calc(${({spacing:t})=>t[3]} * -1)
      ${({spacing:t})=>t[3]} calc(${({spacing:t})=>t[3]} * -1);
    width: calc(100% + ${({spacing:t})=>t[3]} * 2);
  }
`;var qe=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Fi=2,Mi=6;let ve=class extends w{constructor(){super(),this.unsubscribe=[],this.walletGuide="get-started",this.tabIdx=void 0,this.connectors=m.state.connectors,this.remoteFeatures=b.state.remoteFeatures,this.authConnector=this.connectors.find(e=>e.type==="AUTH"),this.isPwaLoading=!1,this.unsubscribe.push(m.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(n=>n.type==="AUTH")}),b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}connectedCallback(){super.connectedCallback(),this.handlePwaFrameLoad()}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex
        class="container"
        flexDirection="column"
        gap="2"
        data-testid="w3m-social-login-widget"
      >
        ${this.topViewTemplate()}${this.bottomViewTemplate()}
      </wui-flex>
    `}topViewTemplate(){const e=this.walletGuide==="explore";let n=this.remoteFeatures?.socials;return!n&&e?(n=L.DEFAULT_SOCIALS,this.renderTopViewContent(n)):n?this.renderTopViewContent(n):null}renderTopViewContent(e){return e.length===2?l` <wui-flex gap="2">
        ${e.slice(0,Fi).map(n=>l`<wui-logo-select
              data-testid=${`social-selector-${n}`}
              @click=${()=>{this.onSocialClick(n)}}
              logo=${n}
              tabIdx=${h(this.tabIdx)}
              ?disabled=${this.isPwaLoading||this.hasConnection()}
            ></wui-logo-select>`)}
      </wui-flex>`:l` <wui-list-button
      data-testid=${`social-selector-${e[0]}`}
      @click=${()=>{this.onSocialClick(e[0])}}
      size="lg"
      icon=${h(e[0])}
      text=${`Continue with ${F.capitalize(e[0])}`}
      tabIdx=${h(this.tabIdx)}
      ?disabled=${this.isPwaLoading||this.hasConnection()}
    ></wui-list-button>`}bottomViewTemplate(){let e=this.remoteFeatures?.socials;const n=this.walletGuide==="explore";return(!this.authConnector||!e||e.length===0)&&n&&(e=L.DEFAULT_SOCIALS),!e||e.length<=Fi?null:e&&e.length>Mi?l`<wui-flex gap="2">
        ${e.slice(1,Mi-1).map(r=>l`<wui-logo-select
              data-testid=${`social-selector-${r}`}
              @click=${()=>{this.onSocialClick(r)}}
              logo=${r}
              tabIdx=${h(this.tabIdx)}
              ?focusable=${this.tabIdx!==void 0&&this.tabIdx>=0}
              ?disabled=${this.isPwaLoading||this.hasConnection()}
            ></wui-logo-select>`)}
        <wui-logo-select
          logo="more"
          tabIdx=${h(this.tabIdx)}
          @click=${this.onMoreSocialsClick.bind(this)}
          ?disabled=${this.isPwaLoading||this.hasConnection()}
          data-testid="social-selector-more"
        ></wui-logo-select>
      </wui-flex>`:e?l`<wui-flex gap="2">
      ${e.slice(1,e.length).map(r=>l`<wui-logo-select
            data-testid=${`social-selector-${r}`}
            @click=${()=>{this.onSocialClick(r)}}
            logo=${r}
            tabIdx=${h(this.tabIdx)}
            ?focusable=${this.tabIdx!==void 0&&this.tabIdx>=0}
            ?disabled=${this.isPwaLoading||this.hasConnection()}
          ></wui-logo-select>`)}
    </wui-flex>`:null}onMoreSocialsClick(){p.push("ConnectSocials")}async onSocialClick(e){if(!A.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(o=>o===u.state.activeChain)){const o=u.getFirstCaipNetworkSupportsAuthConnector();if(o){p.push("SwitchNetwork",{network:o});return}}e&&await Rn(e)}async handlePwaFrameLoad(){if(g.isPWA()){this.isPwaLoading=!0;try{this.authConnector?.provider instanceof vn&&await this.authConnector.provider.init()}catch(e){en.open({displayMessage:"Error loading embedded wallet in PWA",debugMessage:e.message},"error")}finally{this.isPwaLoading=!1}}}hasConnection(){return y.hasAnyConnection(A.CONNECTOR_ID.AUTH)}};ve.styles=bo;qe([c()],ve.prototype,"walletGuide",void 0);qe([c()],ve.prototype,"tabIdx",void 0);qe([d()],ve.prototype,"connectors",void 0);qe([d()],ve.prototype,"remoteFeatures",void 0);qe([d()],ve.prototype,"authConnector",void 0);qe([d()],ve.prototype,"isPwaLoading",void 0);ve=qe([f("w3m-social-login-widget")],ve);var ot=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Me=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=m.state.connectors,this.count=k.state.count,this.filteredCount=k.state.filteredWallets.length,this.isFetchingRecommendedWallets=k.state.isFetchingRecommendedWallets,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e),k.subscribeKey("count",e=>this.count=e),k.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),k.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(v=>v.id==="walletConnect"),{allWallets:n}=b.state;if(!e||n==="HIDE"||n==="ONLY_MOBILE"&&!g.isMobile())return null;const o=k.state.featured.length,r=this.count+o,i=r<10?r:Math.floor(r/10)*10,s=this.filteredCount>0?this.filteredCount:i;let a=`${s}`;this.filteredCount>0?a=`${this.filteredCount}`:s<r&&(a=`${s}+`);const x=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${a}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${h(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${x}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){C.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),p.push("AllWallets",{redirectView:p.state.data?.redirectView})}};ot([c()],Me.prototype,"tabIdx",void 0);ot([d()],Me.prototype,"connectors",void 0);ot([d()],Me.prototype,"count",void 0);ot([d()],Me.prototype,"filteredCount",void 0);ot([d()],Me.prototype,"isFetchingRecommendedWallets",void 0);Me=ot([f("w3m-all-wallets-widget")],Me);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Vi=(t,e,n)=>{const o=new Map;for(let r=e;r<=n;r++)o.set(t[r],r);return o},ln=An(class extends kn{constructor(t){if(super(t),t.type!==In.CHILD)throw Error("repeat() can only be used in text expressions")}dt(t,e,n){let o;n===void 0?n=e:e!==void 0&&(o=e);const r=[],i=[];let s=0;for(const a of t)r[s]=o?o(a,s):s,i[s]=n(a,s),s++;return{values:i,keys:r}}render(t,e,n){return this.dt(t,e,n).values}update(t,[e,n,o]){const r=Wn(t),{values:i,keys:s}=this.dt(e,n,o);if(!Array.isArray(r))return this.ut=s,i;const a=this.ut??=[],x=[];let v,_,S=0,I=r.length-1,R=0,O=i.length-1;for(;S<=I&&R<=O;)if(r[S]===null)S++;else if(r[I]===null)I--;else if(a[S]===s[R])x[R]=Oe(r[S],i[R]),S++,R++;else if(a[I]===s[O])x[O]=Oe(r[I],i[O]),I--,O--;else if(a[S]===s[O])x[O]=Oe(r[S],i[O]),lt(t,x[O+1],r[S]),S++,O--;else if(a[I]===s[R])x[R]=Oe(r[I],i[R]),lt(t,r[S],r[I]),I--,R++;else if(v===void 0&&(v=Vi(s,R,O),_=Vi(a,S,I)),v.has(a[S]))if(v.has(a[I])){const ee=_.get(s[R]),at=ee!==void 0?r[ee]:null;if(at===null){const j=lt(t,r[S]);Oe(j,i[R]),x[R]=j}else x[R]=Oe(at,i[R]),lt(t,r[S],at),r[ee]=null;R++}else oi(r[I]),I--;else oi(r[S]),S++;for(;R<=O;){const ee=lt(t,x[O+1]);Oe(ee,i[R]),x[R++]=ee}for(;S<=I;){const ee=r[S++];ee!==null&&oi(ee)}return this.ut=s,_n(t,x),$n}});var Yt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ht=class extends w{constructor(){super(),this.unsubscribe=[],this.connectors=[],this.connections=y.state.connections,this.unsubscribe.push(y.subscribeKey("connections",e=>this.connections=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(n=>n.type==="ANNOUNCED");return e?.length?l`
      <wui-flex flexDirection="column" gap="2">
        ${ln(e.filter(ce.showConnector),n=>n.id,n=>{const r=(this.connections.get(n.chain)??[]).some(i=>X.isLowerCaseMatch(i.connectorId,n.id));return l`
              <w3m-list-wallet
                imageSrc=${h(E.getConnectorImage(n))}
                name=${n.name??"Unknown"}
                @click=${()=>this.onConnector(n)}
                tagVariant=${r?"info":"success"}
                tagLabel=${r?"connected":"installed"}
                size="sm"
                data-testid=${`wallet-selector-${n.id}`}
                .installed=${!0}
                tabIdx=${h(this.tabIdx)}
                rdnsId=${h(n.explorerWallet?.rdns||void 0)}
                walletRank=${h(n.explorerWallet?.order)}
              >
              </w3m-list-wallet>
            `})}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){const n=p.state.data?.redirectView;e.id==="walletConnect"?g.isMobile()?p.push("AllWallets"):p.push("ConnectingWalletConnect",{redirectView:n}):p.push("ConnectingExternal",{connector:e,redirectView:n,wallet:e.explorerWallet})}};Yt([c({type:Number})],ht.prototype,"tabIdx",void 0);Yt([c({attribute:!1})],ht.prototype,"connectors",void 0);Yt([d()],ht.prototype,"connections",void 0);ht=Yt([f("w3m-connect-announced-widget")],ht);var Xt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let pt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=m.state.connectors,this.loading=!1,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e)),g.isTelegram()&&g.isIos()&&(this.loading=!y.state.wcUri,this.unsubscribe.push(y.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=b.state;if(!e?.length)return this.style.cssText="display: none",null;const n=this.filterOutDuplicateWallets(e),o=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`<wui-flex flexDirection="column" gap="2">
      ${n.map(r=>l`
          <w3m-list-wallet
            imageSrc=${h(E.getWalletImage(r))}
            name=${r.name??"Unknown"}
            @click=${()=>this.onConnectWallet(r)}
            size="sm"
            data-testid=${`wallet-selector-${r.id}`}
            tabIdx=${h(this.tabIdx)}
            ?loading=${this.loading}
            ?disabled=${o}
            rdnsId=${r.rdns}
            walletRank=${r.order}
          >
          </w3m-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const n=me.getRecentWallets(),o=this.connectors.map(a=>a.info?.rdns).filter(Boolean),r=n.map(a=>a.rdns).filter(Boolean),i=o.concat(r);if(i.includes("io.metamask.mobile")&&g.isMobile()){const a=i.indexOf("io.metamask.mobile");i[a]="io.metamask"}return e.filter(a=>!i.includes(String(a?.rdns)))}onConnectWallet(e){this.loading||p.push("ConnectingWalletConnect",{wallet:e,redirectView:p.state.data?.redirectView})}};Xt([c()],pt.prototype,"tabIdx",void 0);Xt([d()],pt.prototype,"connectors",void 0);Xt([d()],pt.prototype,"loading",void 0);pt=Xt([f("w3m-connect-custom-widget")],pt);var Si=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ot=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=m.state.connectors,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const o=this.connectors.filter(i=>i.type==="EXTERNAL").filter(ce.showConnector).filter(i=>i.id!==A.CONNECTOR_ID.COINBASE_SDK);if(!o?.length)return this.style.cssText="display: none",null;const r=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-flex flexDirection="column" gap="2">
        ${o.map(i=>l`
            <w3m-list-wallet
              imageSrc=${h(E.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              data-testid=${`wallet-selector-external-${i.id}`}
              size="sm"
              @click=${()=>this.onConnector(i)}
              tabIdx=${h(this.tabIdx)}
              ?disabled=${r}
              rdnsId=${i.explorerWallet?.rdns}
              walletRank=${i.explorerWallet?.order}
            >
            </w3m-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(e){p.push("ConnectingExternal",{connector:e,redirectView:p.state.data?.redirectView})}};Si([c()],Ot.prototype,"tabIdx",void 0);Si([d()],Ot.prototype,"connectors",void 0);Ot=Si([f("w3m-connect-external-widget")],Ot);var Ei=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Pt=class extends w{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){if(!this.wallets.length)return this.style.cssText="display: none",null;const e=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-flex flexDirection="column" gap="2">
        ${this.wallets.map(n=>l`
            <w3m-list-wallet
              data-testid=${`wallet-selector-featured-${n.id}`}
              imageSrc=${h(E.getWalletImage(n))}
              name=${n.name??"Unknown"}
              @click=${()=>this.onConnectWallet(n)}
              tabIdx=${h(this.tabIdx)}
              size="sm"
              ?disabled=${e}
              rdnsId=${n.rdns}
              walletRank=${n.order}
            >
            </w3m-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){m.selectWalletConnector(e)}};Ei([c()],Pt.prototype,"tabIdx",void 0);Ei([c()],Pt.prototype,"wallets",void 0);Pt=Ei([f("w3m-connect-featured-widget")],Pt);var Qt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ft=class extends w{constructor(){super(),this.unsubscribe=[],this.connectors=[],this.connections=y.state.connections,this.unsubscribe.push(y.subscribeKey("connections",e=>this.connections=e))}render(){const e=ce.sortConnectorsByExplorerWallet(this.connectors.filter(ce.showConnector));return e.length===0?(this.style.cssText="display: none",null):l`
      <wui-flex flexDirection="column" gap="2">
        ${ln(e,n=>n.id,n=>{const r=(this.connections.get(n.chain)??[]).some(i=>X.isLowerCaseMatch(i.connectorId,n.id));return l`
              <w3m-list-wallet
                imageSrc=${h(E.getConnectorImage(n))}
                .installed=${!0}
                name=${n.name??"Unknown"}
                tagVariant=${r?"info":"success"}
                tagLabel=${r?"connected":"installed"}
                data-testid=${`wallet-selector-${n.id}`}
                size="sm"
                @click=${()=>this.onConnector(n)}
                tabIdx=${h(this.tabIdx)}
                rdnsId=${h(n.explorerWallet?.rdns||void 0)}
                walletRank=${h(n.explorerWallet?.order)}
              >
              </w3m-list-wallet>
            `})}
      </wui-flex>
    `}onConnector(e){m.setActiveConnector(e),p.push("ConnectingExternal",{connector:e,redirectView:p.state.data?.redirectView,wallet:e.explorerWallet})}};Qt([c({type:Number})],ft.prototype,"tabIdx",void 0);Qt([c({attribute:!1})],ft.prototype,"connectors",void 0);Qt([d()],ft.prototype,"connections",void 0);ft=Qt([f("w3m-connect-injected-widget")],ft);var Ai=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Dt=class extends w{constructor(){super(),this.tabIdx=void 0,this.connectors=[]}render(){const e=this.connectors.filter(o=>o.type==="MULTI_CHAIN"&&o.name!=="WalletConnect");if(!e?.length)return this.style.cssText="display: none",null;const n=ce.sortConnectorsByExplorerWallet(e);return l`
      <wui-flex flexDirection="column" gap="2">
        ${n.map(o=>l`
            <w3m-list-wallet
              imageSrc=${h(E.getConnectorImage(o))}
              .installed=${!0}
              name=${o.name??"Unknown"}
              tagVariant="info"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${o.id}`}
              size="sm"
              @click=${()=>this.onConnector(o)}
              tabIdx=${h(this.tabIdx)}
              rdnsId=${h(o.explorerWallet?.rdns||void 0)}
              walletRank=${h(o.explorerWallet?.order)}
            >
            </w3m-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(e){m.setActiveConnector(e),p.push("ConnectingMultiChain",{redirectView:p.state.data?.redirectView})}};Ai([c()],Dt.prototype,"tabIdx",void 0);Ai([c()],Dt.prototype,"connectors",void 0);Dt=Ai([f("w3m-connect-multi-chain-widget")],Dt);var Jt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let wt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=m.state.connectors,this.loading=!1,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e)),g.isTelegram()&&g.isIos()&&(this.loading=!y.state.wcUri,this.unsubscribe.push(y.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const n=me.getRecentWallets().filter(r=>!De.isExcluded(r)).filter(r=>!this.hasWalletConnector(r)).filter(r=>this.isWalletCompatibleWithCurrentChain(r));if(!n.length)return this.style.cssText="display: none",null;const o=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-flex flexDirection="column" gap="2">
        ${n.map(r=>l`
            <w3m-list-wallet
              imageSrc=${h(E.getWalletImage(r))}
              name=${r.name??"Unknown"}
              @click=${()=>this.onConnectWallet(r)}
              tagLabel="recent"
              tagVariant="info"
              size="sm"
              tabIdx=${h(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${o}
              rdnsId=${r.rdns}
              walletRank=${r.order}
            >
            </w3m-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){this.loading||m.selectWalletConnector(e)}hasWalletConnector(e){return this.connectors.some(n=>n.id===e.id||n.name===e.name)}isWalletCompatibleWithCurrentChain(e){const n=u.state.activeChain;return n&&e.chains?e.chains.some(o=>{const r=o.split(":")[0];return n===r}):!0}};Jt([c()],wt.prototype,"tabIdx",void 0);Jt([d()],wt.prototype,"connectors",void 0);Jt([d()],wt.prototype,"loading",void 0);wt=Jt([f("w3m-connect-recent-widget")],wt);var Zt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Hi=4;let mt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,g.isTelegram()&&g.isIos()&&(this.loading=!y.state.wcUri,this.unsubscribe.push(y.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=m.state,{customWallets:n,featuredWalletIds:o}=b.state,r=e.find(j=>j.id==="walletConnect"),i=e.filter(j=>j.type==="INJECTED"||j.type==="ANNOUNCED"||j.type==="MULTI_CHAIN");if(!r&&!i.length&&!n?.length)return null;const s=!!(b.state.features?.email||b.state.remoteFeatures?.email),a=Array.isArray(b.state.features?.socials)&&b.state.features?.socials.length>0||Array.isArray(b.state.remoteFeatures?.socials)&&b.state.remoteFeatures?.socials.length>0,x=i.filter(j=>j.name!=="Browser Wallet"),v=o?.length||0,_=n?.length||0,S=x.length||0,I=s?1:0,R=a?1:0,O=v+_+S+I+R;if(O>=Hi)return this.style.cssText="display: none",null;const ee=De.filterOutDuplicateWallets(this.wallets).slice(0,Hi-O);if(!ee.length)return this.style.cssText="display: none",null;const at=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-flex flexDirection="column" gap="2">
        ${ee.map(j=>l`
            <w3m-list-wallet
              imageSrc=${h(E.getWalletImage(j))}
              name=${j?.name??"Unknown"}
              @click=${()=>this.onConnectWallet(j)}
              size="sm"
              tabIdx=${h(this.tabIdx)}
              ?loading=${this.loading}
              ?disabled=${at}
              rdnsId=${j.rdns}
              walletRank=${j.order}
            >
            </w3m-list-wallet>
          `)}
      </wui-flex>
    `}onConnectWallet(e){if(this.loading)return;const n=p.state.data?.redirectView,o=m.getConnector({id:e.id,rdns:e.rdns});o?p.push("ConnectingExternal",{connector:o,redirectView:n}):p.push("ConnectingWalletConnect",{wallet:e,redirectView:n})}};Zt([c()],mt.prototype,"tabIdx",void 0);Zt([c()],mt.prototype,"wallets",void 0);Zt([d()],mt.prototype,"loading",void 0);mt=Zt([f("w3m-connect-recommended-widget")],mt);var ei=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let bt=class extends w{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=m.state.connectors,this.connectorImages=Pe.state.connectorImages,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e),Pe.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(g.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(r=>r.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const n=e.imageUrl||this.connectorImages[e?.imageId??""],o=y.hasAnyConnection(A.CONNECTOR_ID.WALLET_CONNECT);return l`
      <w3m-list-wallet
        imageSrc=${h(n)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="accent"
        tabIdx=${h(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
        size="sm"
        ?disabled=${o}
        rdnsId=${e.explorerWallet?.rdns}
      >
      </w3m-list-wallet>
    `}onConnector(e){m.setActiveConnector(e),p.push("ConnectingWalletConnect",{redirectView:p.state.data?.redirectView})}};ei([c()],bt.prototype,"tabIdx",void 0);ei([d()],bt.prototype,"connectors",void 0);ei([d()],bt.prototype,"connectorImages",void 0);bt=ei([f("w3m-connect-walletconnect-widget")],bt);const go=$`
  :host {
    margin-top: ${({spacing:t})=>t[1]};
  }
  wui-separator {
    margin: ${({spacing:t})=>t[3]} calc(${({spacing:t})=>t[3]} * -1)
      ${({spacing:t})=>t[2]} calc(${({spacing:t})=>t[3]} * -1);
    width: calc(100% + ${({spacing:t})=>t[3]} * 2);
  }
`;var rt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let _e=class extends w{constructor(){super(),this.unsubscribe=[],this.connectors=m.state.connectors,this.recommended=k.state.recommended,this.featured=k.state.featured,this.explorerWallets=k.state.explorerWallets,this.unsubscribe.push(m.subscribeKey("connectors",e=>this.connectors=e),k.subscribeKey("recommended",e=>this.recommended=e),k.subscribeKey("featured",e=>this.featured=e),k.subscribeKey("explorerFilteredWallets",e=>{this.explorerWallets=e?.length?e:k.state.explorerWallets}),k.subscribeKey("explorerWallets",e=>{this.explorerWallets?.length||(this.explorerWallets=e)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}mapConnectorsToExplorerWallets(e,n){return e.map(o=>{if(o.type==="MULTI_CHAIN"&&o.connectors){const i=o.connectors.map(v=>v.id),s=o.connectors.map(v=>v.name),a=o.connectors.map(v=>v.info?.rdns),x=n?.find(v=>i.includes(v.id)||s.includes(v.name)||v.rdns&&(a.includes(v.rdns)||i.includes(v.rdns)));return o.explorerWallet=x??o.explorerWallet,o}const r=n?.find(i=>i.id===o.id||i.rdns===o.info?.rdns||i.name===o.name);return o.explorerWallet=r??o.explorerWallet,o})}processConnectorsByType(e,n=!0){if(!this.explorerWallets?.length)return e;const o=ce.sortConnectorsByExplorerWallet([...e]);return n?o.filter(ce.showConnector):o}connectorListTemplate(){const e=this.mapConnectorsToExplorerWallets(this.connectors,this.explorerWallets??[]),n=ce.getConnectorsByType(e,this.recommended,this.featured),o=this.processConnectorsByType(n.announced),r=this.processConnectorsByType(n.injected),i=this.processConnectorsByType(n.multiChain,!1),s=n.custom,a=n.recent,x=n.external,v=n.recommended,_=n.featured;return ce.getConnectorTypeOrder({custom:s,recent:a,announced:o,injected:r,multiChain:i,recommended:v,featured:_,external:x}).map(I=>{switch(I){case"injected":return l`
            ${i.length?l`<w3m-connect-multi-chain-widget
                  tabIdx=${h(this.tabIdx)}
                  .connectors=${i}
                ></w3m-connect-multi-chain-widget>`:null}
            ${o.length?l`<w3m-connect-announced-widget
                  tabIdx=${h(this.tabIdx)}
                  .connectors=${o}
                ></w3m-connect-announced-widget>`:null}
            ${r.length?l`<w3m-connect-injected-widget
                  .connectors=${r}
                  tabIdx=${h(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return l`<w3m-connect-walletconnect-widget
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return l`<w3m-connect-recent-widget
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return l`<w3m-connect-featured-widget
            .wallets=${_}
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return l`<w3m-connect-custom-widget
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return l`<w3m-connect-external-widget
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return l`<w3m-connect-recommended-widget
            .wallets=${v}
            tabIdx=${h(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${I}`),null}})}};_e.styles=go;rt([c({type:Number})],_e.prototype,"tabIdx",void 0);rt([d()],_e.prototype,"connectors",void 0);rt([d()],_e.prototype,"recommended",void 0);rt([d()],_e.prototype,"featured",void 0);rt([d()],_e.prototype,"explorerWallets",void 0);_e=rt([f("w3m-connector-list")],_e);var cn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let di=class extends w{constructor(){super(...arguments),this.tabIdx=void 0}render(){return l`
      <wui-flex flexDirection="column" gap="2">
        <w3m-connector-list tabIdx=${h(this.tabIdx)}></w3m-connector-list>
        <w3m-all-wallets-widget tabIdx=${h(this.tabIdx)}></w3m-all-wallets-widget>
      </wui-flex>
    `}};cn([c()],di.prototype,"tabIdx",void 0);di=cn([f("w3m-wallet-login-list")],di);const yo=$`
  :host {
    --connect-scroll--top-opacity: 0;
    --connect-scroll--bottom-opacity: 0;
    --connect-mask-image: none;
  }

  .connect {
    max-height: clamp(360px, 470px, 80vh);
    scrollbar-width: none;
    overflow-y: scroll;
    overflow-x: hidden;
    transition: opacity ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: opacity;
    mask-image: var(--connect-mask-image);
  }

  .guide {
    transition: opacity ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: opacity;
  }

  .connect::-webkit-scrollbar {
    display: none;
  }

  .all-wallets {
    flex-flow: column;
  }

  .connect.disabled,
  .guide.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }

  wui-separator {
    margin: ${({spacing:t})=>t[3]} calc(${({spacing:t})=>t[3]} * -1);
    width: calc(100% + ${({spacing:t})=>t[3]} * 2);
  }
`;var ae=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const xo=470;let G=class extends w{constructor(){super(),this.unsubscribe=[],this.connectors=m.state.connectors,this.authConnector=this.connectors.find(e=>e.type==="AUTH"),this.features=b.state.features,this.remoteFeatures=b.state.remoteFeatures,this.enableWallets=b.state.enableWallets,this.noAdapters=u.state.noAdapters,this.walletGuide="get-started",this.checked=Wt.state.isLegalCheckboxChecked,this.isEmailEnabled=this.remoteFeatures?.email&&!u.state.noAdapters,this.isSocialEnabled=this.remoteFeatures?.socials&&this.remoteFeatures.socials.length>0&&!u.state.noAdapters,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors),this.unsubscribe.push(m.subscribeKey("connectors",e=>{this.connectors=e,this.authConnector=this.connectors.find(n=>n.type==="AUTH"),this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)}),b.subscribeKey("features",e=>{this.features=e}),b.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e,this.setEmailAndSocialEnableCheck(this.noAdapters,this.remoteFeatures)}),b.subscribeKey("enableWallets",e=>this.enableWallets=e),u.subscribeKey("noAdapters",e=>this.setEmailAndSocialEnableCheck(e,this.remoteFeatures)),Wt.subscribeKey("isLegalCheckboxChecked",e=>this.checked=e))}disconnectedCallback(){this.unsubscribe.forEach(n=>n()),this.resizeObserver?.disconnect(),this.shadowRoot?.querySelector(".connect")?.removeEventListener("scroll",this.handleConnectListScroll.bind(this))}firstUpdated(){const e=this.shadowRoot?.querySelector(".connect");e&&(requestAnimationFrame(this.handleConnectListScroll.bind(this)),e?.addEventListener("scroll",this.handleConnectListScroll.bind(this)),this.resizeObserver=new ResizeObserver(()=>{this.handleConnectListScroll()}),this.resizeObserver?.observe(e),this.handleConnectListScroll())}render(){const{termsConditionsUrl:e,privacyPolicyUrl:n}=b.state,o=b.state.features?.legalCheckbox,s=!!(e||n)&&!!o&&this.walletGuide==="get-started"&&!this.checked,a={connect:!0,disabled:s},x=b.state.enableWalletGuide,v=this.enableWallets,_=this.isSocialEnabled||this.authConnector,S=s?-1:void 0;return l`
      <wui-flex flexDirection="column">
        ${this.legalCheckboxTemplate()}
        <wui-flex
          data-testid="w3m-connect-scroll-view"
          flexDirection="column"
          .padding=${["0","0","4","0"]}
          class=${tn(a)}
        >
          <wui-flex
            class="connect-methods"
            flexDirection="column"
            gap="2"
            .padding=${_&&v&&x&&this.walletGuide==="get-started"?["0","3","0","3"]:["0","3","3","3"]}
          >
            ${this.renderConnectMethod(S)}
          </wui-flex>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `}reownBrandingTemplate(){return gi.hasFooter()||!this.remoteFeatures?.reownBranding?null:l`<wui-ux-by-reown></wui-ux-by-reown>`}setEmailAndSocialEnableCheck(e,n){this.isEmailEnabled=n?.email&&!e,this.isSocialEnabled=n?.socials&&n.socials.length>0&&!e,this.remoteFeatures=n,this.noAdapters=e}checkIfAuthEnabled(e){const n=e.filter(r=>r.type===Cn.CONNECTOR_TYPE_AUTH).map(r=>r.chain);return A.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(r=>n.includes(r))}renderConnectMethod(e){const n=De.getConnectOrderMethod(this.features,this.connectors);return l`${n.map((o,r)=>{switch(o){case"email":return l`${this.emailTemplate(e)} ${this.separatorTemplate(r,"email")}`;case"social":return l`${this.socialListTemplate(e)}
          ${this.separatorTemplate(r,"social")}`;case"wallet":return l`${this.walletListTemplate(e)}
          ${this.separatorTemplate(r,"wallet")}`;default:return null}})}`}checkMethodEnabled(e){switch(e){case"wallet":return this.enableWallets;case"social":return this.isSocialEnabled&&this.isAuthEnabled;case"email":return this.isEmailEnabled&&this.isAuthEnabled;default:return null}}checkIsThereNextMethod(e){const o=De.getConnectOrderMethod(this.features,this.connectors)[e+1];return o?this.checkMethodEnabled(o)?o:this.checkIsThereNextMethod(e+1):void 0}separatorTemplate(e,n){const o=this.checkIsThereNextMethod(e),r=this.walletGuide==="explore";switch(n){case"wallet":return this.enableWallets&&o&&!r?l`<wui-separator data-testid="wui-separator" text="or"></wui-separator>`:null;case"email":{const i=o==="social";return this.isAuthEnabled&&this.isEmailEnabled&&!i&&o?l`<wui-separator
              data-testid="w3m-email-login-or-separator"
              text="or"
            ></wui-separator>`:null}case"social":{const i=o==="email";return this.isAuthEnabled&&this.isSocialEnabled&&!i&&o?l`<wui-separator data-testid="wui-separator" text="or"></wui-separator>`:null}default:return null}}emailTemplate(e){return!this.isEmailEnabled||!this.isAuthEnabled?null:l`<w3m-email-login-widget tabIdx=${h(e)}></w3m-email-login-widget>`}socialListTemplate(e){return!this.isSocialEnabled||!this.isAuthEnabled?null:l`<w3m-social-login-widget
      walletGuide=${this.walletGuide}
      tabIdx=${h(e)}
    ></w3m-social-login-widget>`}walletListTemplate(e){const n=this.enableWallets,o=this.features?.emailShowWallets===!1,r=this.features?.collapseWallets,i=o||r;return!n||(g.isTelegram()&&(g.isSafari()||g.isIos())&&y.connectWalletConnect().catch(a=>({})),this.walletGuide==="explore")?null:this.isAuthEnabled&&(this.isEmailEnabled||this.isSocialEnabled)&&i?l`<wui-list-button
        data-testid="w3m-collapse-wallets-button"
        tabIdx=${h(e)}
        @click=${this.onContinueWalletClick.bind(this)}
        text="Continue with a wallet"
      ></wui-list-button>`:l`<w3m-wallet-login-list tabIdx=${h(e)}></w3m-wallet-login-list>`}legalCheckboxTemplate(){return this.walletGuide==="explore"?null:l`<w3m-legal-checkbox data-testid="w3m-legal-checkbox"></w3m-legal-checkbox>`}handleConnectListScroll(){const e=this.shadowRoot?.querySelector(".connect");if(!e)return;e.scrollHeight>xo?(e.style.setProperty("--connect-mask-image",`linear-gradient(
          to bottom,
          rgba(0, 0, 0, calc(1 - var(--connect-scroll--top-opacity))) 0px,
          rgba(200, 200, 200, calc(1 - var(--connect-scroll--top-opacity))) 1px,
          black 100px,
          black calc(100% - 100px),
          rgba(155, 155, 155, calc(1 - var(--connect-scroll--bottom-opacity))) calc(100% - 1px),
          rgba(0, 0, 0, calc(1 - var(--connect-scroll--bottom-opacity))) 100%
        )`),e.style.setProperty("--connect-scroll--top-opacity",It.interpolate([0,50],[0,1],e.scrollTop).toString()),e.style.setProperty("--connect-scroll--bottom-opacity",It.interpolate([0,50],[0,1],e.scrollHeight-e.scrollTop-e.offsetHeight).toString())):(e.style.setProperty("--connect-mask-image","none"),e.style.setProperty("--connect-scroll--top-opacity","0"),e.style.setProperty("--connect-scroll--bottom-opacity","0"))}onContinueWalletClick(){p.push("ConnectWallets")}};G.styles=yo;ae([d()],G.prototype,"connectors",void 0);ae([d()],G.prototype,"authConnector",void 0);ae([d()],G.prototype,"features",void 0);ae([d()],G.prototype,"remoteFeatures",void 0);ae([d()],G.prototype,"enableWallets",void 0);ae([d()],G.prototype,"noAdapters",void 0);ae([c()],G.prototype,"walletGuide",void 0);ae([d()],G.prototype,"checked",void 0);ae([d()],G.prototype,"isEmailEnabled",void 0);ae([d()],G.prototype,"isSocialEnabled",void 0);ae([d()],G.prototype,"isAuthEnabled",void 0);G=ae([f("w3m-connect-view")],G);const vo=$`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[5]};
    padding-left: ${({spacing:t})=>t[3]};
    padding-right: ${({spacing:t})=>t[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:t})=>t[6]};
  }

  wui-text {
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var ti=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Je=class extends w{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return l`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};Je.styles=[T,N,vo];ti([c({type:Boolean})],Je.prototype,"disabled",void 0);ti([c()],Je.prototype,"label",void 0);ti([c()],Je.prototype,"buttonLabel",void 0);Je=ti([f("wui-cta-button")],Je);const $o=$`
  :host {
    display: block;
    padding: 0 ${({spacing:t})=>t[5]} ${({spacing:t})=>t[5]};
  }
`;var dn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Lt=class extends w{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:n,play_store:o,chrome_store:r,homepage:i}=this.wallet,s=g.isMobile(),a=g.isIos(),x=g.isAndroid(),v=[n,o,i,r].filter(Boolean).length>1,_=F.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return v&&!s?l`
        <wui-cta-button
          label=${`Don't have ${_}?`}
          buttonLabel="Get"
          @click=${()=>p.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!v&&i?l`
        <wui-cta-button
          label=${`Don't have ${_}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:n&&a?l`
        <wui-cta-button
          label=${`Don't have ${_}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:o&&x?l`
        <wui-cta-button
          label=${`Don't have ${_}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&g.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&g.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&g.openHref(this.wallet.homepage,"_blank")}};Lt.styles=[$o];dn([c({type:Object})],Lt.prototype,"wallet",void 0);Lt=dn([f("w3m-mobile-download-links")],Lt);const Co=$`
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

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:t})=>t[1]} * -1);
    bottom: calc(${({spacing:t})=>t[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:t})=>t.lg};
    transition-timing-function: ${({easings:t})=>t["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:t})=>t[4]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:t})=>t["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var we=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};class D extends w{constructor(){super(),this.wallet=p.state.data?.wallet,this.connector=p.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=E.getConnectorImage(this.connector)??E.getWalletImage(this.wallet),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=y.state.wcUri,this.error=y.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(y.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),y.subscribeKey("wcError",e=>this.error=e)),(g.isTelegram()||g.isSafari())&&g.isIos()&&y.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),y.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let n="";return this.label?n=this.label:(n=`Continue in ${this.name}`,this.error&&(n="Connection declined")),l`
      <wui-flex
        data-error=${h(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${h(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${n}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?l`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?l`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){this.error&&!this.showRetry&&(this.showRetry=!0,this.shadowRoot?.querySelector("wui-button")?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"}))}onTryAgain(){y.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){const e=si.state.themeVariables["--w3m-border-radius-master"],n=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${n*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(g.copyToClopboard(this.uri),W.showSuccess("Link copied"))}catch{W.showError("Failed to copy")}}}D.styles=Co;we([d()],D.prototype,"isRetrying",void 0);we([d()],D.prototype,"uri",void 0);we([d()],D.prototype,"error",void 0);we([d()],D.prototype,"ready",void 0);we([d()],D.prototype,"showRetry",void 0);we([d()],D.prototype,"label",void 0);we([d()],D.prototype,"secondaryBtnLabel",void 0);we([d()],D.prototype,"secondaryLabel",void 0);we([d()],D.prototype,"isLoading",void 0);we([c({type:Boolean})],D.prototype,"isMobile",void 0);we([c()],D.prototype,"onRetry",void 0);var So=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ki=class extends D{constructor(){if(super(),this.externalViewUnsubscribe=[],this.connectionsByNamespace=y.getConnections(this.connector?.chain),this.hasMultipleConnections=this.connectionsByNamespace.length>0,this.remoteFeatures=b.state.remoteFeatures,this.currentActiveConnectorId=m.state.activeConnectorIds[this.connector?.chain],!this.connector)throw new Error("w3m-connecting-view: No connector provided");const e=this.connector?.chain;this.isAlreadyConnected(this.connector)&&(this.secondaryBtnLabel=void 0,this.label=`This account is already linked, change your account in ${this.connector.name}`,this.secondaryLabel=`To link a new account, open ${this.connector.name} and switch to the account you want to link`),C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.connector.name??"Unknown",platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:p.state.view}}),this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),this.isWalletConnect=!1,this.externalViewUnsubscribe.push(m.subscribeKey("activeConnectorIds",n=>{const o=n[e],r=this.remoteFeatures?.multiWallet,{redirectView:i}=p.state.data??{};o!==this.currentActiveConnectorId&&(this.hasMultipleConnections&&r?(p.replace("ProfileWallets"),W.showSuccess("New Wallet Added")):i?p.replace(i):B.close())}),y.subscribeKey("connections",this.onConnectionsChange.bind(this)))}disconnectedCallback(){this.externalViewUnsubscribe.forEach(e=>e())}async onConnectProxy(){try{if(this.error=!1,this.connector){if(this.isAlreadyConnected(this.connector))return;(this.connector.id!==A.CONNECTOR_ID.COINBASE_SDK||!this.error)&&(await y.connectExternal(this.connector,this.connector.chain),C.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.connector.name||"Unknown",view:p.state.view,walletRank:this.wallet?.order}}))}}catch(e){e instanceof mi&&e.originalName===bi.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?C.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):C.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}onConnectionsChange(e){if(this.connector?.chain&&e.get(this.connector.chain)&&this.isAlreadyConnected(this.connector)){const n=e.get(this.connector.chain)??[],o=this.remoteFeatures?.multiWallet;if(n.length===0)p.replace("Connect");else{const r=Ee.getConnectionsByConnectorId(this.connectionsByNamespace,this.connector.id).flatMap(s=>s.accounts),i=Ee.getConnectionsByConnectorId(n,this.connector.id).flatMap(s=>s.accounts);i.length===0?this.hasMultipleConnections&&o?(p.replace("ProfileWallets"),W.showSuccess("Wallet deleted")):B.close():!r.every(a=>i.some(x=>X.isLowerCaseMatch(a.address,x.address)))&&o&&p.replace("ProfileWallets")}}}isAlreadyConnected(e){return!!e&&this.connectionsByNamespace.some(n=>X.isLowerCaseMatch(n.connectorId,e.id))}};Ki=So([f("w3m-connecting-external-view")],Ki);const Eo=ne`
  wui-flex,
  wui-list-wallet {
    width: 100%;
  }
`;var un=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let jt=class extends w{constructor(){super(),this.unsubscribe=[],this.activeConnector=m.state.activeConnector,this.unsubscribe.push(m.subscribeKey("activeConnector",e=>this.activeConnector=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3","5","5","5"]}
        gap="5"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image
            size="lg"
            imageSrc=${h(E.getConnectorImage(this.activeConnector))}
          ></wui-wallet-image>
        </wui-flex>
        <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["0","3","0","3"]}
        >
          <wui-text variant="lg-medium" color="primary">
            Select Chain for ${this.activeConnector?.name}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary"
            >Select which chain to connect to your multi chain wallet</wui-text
          >
        </wui-flex>
        <wui-flex
          flexGrow="1"
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","2","0"]}
        >
          ${this.networksTemplate()}
        </wui-flex>
      </wui-flex>
    `}networksTemplate(){return this.activeConnector?.connectors?.map(e=>e.name?l`
            <w3m-list-wallet
              imageSrc=${h(E.getChainImage(e.chain))}
              name=${A.CHAIN_NAME_MAP[e.chain]}
              @click=${()=>this.onConnector(e)}
              size="sm"
              data-testid="wui-list-chain-${e.chain}"
              rdnsId=${e.explorerWallet?.rdns}
            ></w3m-list-wallet>
          `:null)}onConnector(e){const n=this.activeConnector?.connectors?.find(r=>r.chain===e.chain),o=p.state.data?.redirectView;if(!n){W.showError("Failed to find connector");return}n.id==="walletConnect"?g.isMobile()?p.push("AllWallets"):p.push("ConnectingWalletConnect",{redirectView:o}):p.push("ConnectingExternal",{connector:n,redirectView:o,wallet:this.activeConnector?.explorerWallet})}};jt.styles=Eo;un([d()],jt.prototype,"activeConnector",void 0);jt=un([f("w3m-connecting-multi-chain-view")],jt);var ki=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Bt=class extends w{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return l`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(n=>n==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:n==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:n==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:n==="web"?{label:"Webapp",icon:"browser",platform:"web"}:n==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:n})=>n),e}onTabChange(e){const n=this.platformTabs[e];n&&this.onSelectPlatfrom?.(n)}};ki([c({type:Array})],Bt.prototype,"platforms",void 0);ki([c()],Bt.prototype,"onSelectPlatfrom",void 0);Bt=ki([f("w3m-connecting-header")],Bt);var Ao=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let qi=class extends D{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:p.state.view}})}async onConnectProxy(){try{this.error=!1;const{connectors:e}=m.state,n=e.find(o=>o.type==="ANNOUNCED"&&o.info?.rdns===this.wallet?.rdns||o.type==="INJECTED"||o.name===this.wallet?.name);if(n)await y.connectExternal(n,n.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");B.close(),C.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown",view:p.state.view,walletRank:this.wallet?.order}})}catch(e){e instanceof mi&&e.originalName===bi.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?C.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):C.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};qi=Ao([f("w3m-connecting-wc-browser")],qi);var ko=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Gi=class extends D{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:p.state.view}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:e,name:n}=this.wallet,{redirect:o,href:r}=g.formatNativeUrl(e,this.uri);y.setWcLinking({name:n,href:r}),y.setRecentWallet(this.wallet),g.openHref(o,"_blank")}catch{this.error=!0}}};Gi=ko([f("w3m-connecting-wc-desktop")],Gi);var st=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ve=class extends D{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=b.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:e,link_mode:n,name:o}=this.wallet,{redirect:r,redirectUniversalLink:i,href:s}=g.formatNativeUrl(e,this.uri,n);this.redirectDeeplink=r,this.redirectUniversalLink=i,this.target=g.isIframe()?"_top":"_self",y.setWcLinking({name:o,href:s}),y.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?g.openHref(this.redirectUniversalLink,this.target):g.openHref(this.redirectDeeplink,this.target)}catch(e){C.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:e instanceof Error?e.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=L.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(y.subscribeKey("wcUri",()=>{this.onHandleURI()})),C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:p.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){y.setWcError(!1),this.onConnect?.()}};st([d()],Ve.prototype,"redirectDeeplink",void 0);st([d()],Ve.prototype,"redirectUniversalLink",void 0);st([d()],Ve.prototype,"target",void 0);st([d()],Ve.prototype,"preferUniversalLinks",void 0);st([d()],Ve.prototype,"isLoading",void 0);Ve=st([f("w3m-connecting-wc-mobile")],Ve);const Io=$`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:t})=>t.xl};
    animation-timing-function: ${({easings:t})=>t["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var hn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ut=class extends D{constructor(){super(),this.basic=!1,this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate)}firstUpdated(){this.basic||C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:p.state.view}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,n=this.wallet?this.wallet.name:void 0;y.setWcLinking(void 0),y.setRecentWallet(this.wallet);let o=this.uri;if(this.wallet?.mobile_link){const{redirect:r}=g.formatNativeUrl(this.wallet?.mobile_link,this.uri,null);o=r}return l` <wui-qr-code
      size=${e}
      theme=${si.state.themeMode}
      uri=${o}
      imageSrc=${h(E.getWalletImage(this.wallet))}
      color=${h(si.state.themeVariables["--w3m-qr-color"])}
      alt=${h(n)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};Ut.styles=Io;hn([c({type:Boolean})],Ut.prototype,"basic",void 0);Ut=hn([f("w3m-connecting-wc-qrcode")],Ut);var Wo=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Yi=class extends w{constructor(){if(super(),this.wallet=p.state.data?.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:p.state.view}})}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${h(E.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};Yi=Wo([f("w3m-connecting-wc-unsupported")],Yi);var pn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let ui=class extends D{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=L.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(y.subscribeKey("wcUri",()=>{this.updateLoadingState()})),C.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:p.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:e,name:n}=this.wallet,{redirect:o,href:r}=g.formatUniversalUrl(e,this.uri);y.setWcLinking({name:n,href:r}),y.setRecentWallet(this.wallet),g.openHref(o,"_blank")}catch{this.error=!0}}};pn([d()],ui.prototype,"isLoading",void 0);ui=pn([f("w3m-connecting-wc-web")],ui);const _o=$`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`;var Ge=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let $e=class extends w{constructor(){super(),this.wallet=p.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!b.state.siwx,this.remoteFeatures=b.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return b.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),l`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return!this.remoteFeatures?.reownBranding||!this.displayBranding?null:l`<wui-ux-by-reown></wui-ux-by-reown>`}async initializeConnection(e=!1){if(!(this.platform==="browser"||b.state.manualWCControl&&!e))try{const{wcPairingExpiry:n,status:o}=y.state,{redirectView:r}=p.state.data??{};if(e||b.state.enableEmbedded||g.isPairingExpired(n)||o==="connecting"){const i=y.getConnections(u.state.activeChain),s=this.remoteFeatures?.multiWallet,a=i.length>0;await y.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(a&&s?(p.replace("ProfileWallets"),W.showSuccess("New Wallet Added")):r?p.replace(r):B.close())}}catch(n){if(n instanceof Error&&n.message.includes("An error occurred when attempting to switch chain")&&!b.state.enableNetworkSwitch&&u.state.activeChain){u.setActiveCaipNetwork(Sn.getUnsupportedNetwork(`${u.state.activeChain}:${u.state.activeCaipNetwork?.id}`)),u.showUnsupportedChainUI();return}n instanceof mi&&n.originalName===bi.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?C.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:n.message}}):C.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:n?.message??"Unknown"}}),y.setWcError(!0),W.showError(n.message??"Connection error"),y.resetWcConnection(),p.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:n,webapp_link:o,injected:r,rdns:i}=this.wallet,s=r?.map(({injected_id:O})=>O).filter(Boolean),a=[...i?[i]:s??[]],x=b.state.isUniversalProvider?!1:a.length,v=e,_=o,S=y.checkInstalled(a),I=x&&S,R=n&&!g.isMobile();I&&!u.state.noAdapters&&this.platforms.push("browser"),v&&this.platforms.push(g.isMobile()?"mobile":"qrcode"),_&&this.platforms.push("web"),R&&this.platforms.push("desktop"),!I&&x&&!u.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return l`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return l`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return l`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return l`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return l`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return l`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?l`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){const n=this.shadowRoot?.querySelector("div");n&&(await n.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,n.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};$e.styles=_o;Ge([d()],$e.prototype,"platform",void 0);Ge([d()],$e.prototype,"platforms",void 0);Ge([d()],$e.prototype,"isSiwxEnabled",void 0);Ge([d()],$e.prototype,"remoteFeatures",void 0);Ge([c({type:Boolean})],$e.prototype,"displayBranding",void 0);Ge([c({type:Boolean})],$e.prototype,"basic",void 0);$e=Ge([f("w3m-connecting-wc-view")],$e);var Ii=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let zt=class extends w{constructor(){super(),this.unsubscribe=[],this.isMobile=g.isMobile(),this.remoteFeatures=b.state.remoteFeatures,this.unsubscribe.push(b.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(this.isMobile){const{featured:e,recommended:n}=k.state,{customWallets:o}=b.state,r=me.getRecentWallets(),i=e.length||n.length||o?.length||r.length;return l`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${i?l`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return l`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?l` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};Ii([d()],zt.prototype,"isMobile",void 0);Ii([d()],zt.prototype,"remoteFeatures",void 0);zt=Ii([f("w3m-connecting-wc-basic-view")],zt);const To=ne`
  .continue-button-container {
    width: 100%;
  }
`;var fn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ft=class extends w{constructor(){super(...arguments),this.loading=!1}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="6"
        .padding=${["0","0","4","0"]}
      >
        ${this.onboardingTemplate()} ${this.buttonsTemplate()}
        <wui-link
          @click=${()=>{g.openHref(Nn.URLS.FAQ,"_blank")}}
        >
          Learn more about names
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-link>
      </wui-flex>
    `}onboardingTemplate(){return l` <wui-flex
      flexDirection="column"
      gap="6"
      alignItems="center"
      .padding=${["0","6","0","6"]}
    >
      <wui-flex gap="3" alignItems="center" justifyContent="center">
        <wui-icon-box icon="id" size="xl" iconSize="xxl" color="default"></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="3">
        <wui-text align="center" variant="lg-medium" color="primary">
          Choose your account name
        </wui-text>
        <wui-text align="center" variant="md-regular" color="primary">
          Finally say goodbye to 0x addresses, name your account to make it easier to exchange
          assets
        </wui-text>
      </wui-flex>
    </wui-flex>`}buttonsTemplate(){return l`<wui-flex
      .padding=${["0","8","0","8"]}
      gap="3"
      class="continue-button-container"
    >
      <wui-button
        fullWidth
        .loading=${this.loading}
        size="lg"
        borderRadius="xs"
        @click=${this.handleContinue.bind(this)}
        >Choose name
      </wui-button>
    </wui-flex>`}handleContinue(){p.push("RegisterAccountName"),C.sendEvent({type:"track",event:"OPEN_ENS_FLOW",properties:{isSmartAccount:Ae(u.state.activeChain)===le.ACCOUNT_TYPES.SMART_ACCOUNT}})}};Ft.styles=To;fn([d()],Ft.prototype,"loading",void 0);Ft=fn([f("w3m-choose-account-name-view")],Ft);var Ro=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Xi=class extends w{constructor(){super(...arguments),this.wallet=p.state.data?.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return l`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?l`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?l`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?l`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?l`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(e){e.href&&this.wallet&&(C.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:e.type}}),g.openHref(e.href,"_blank"))}onChromeStore(){this.wallet?.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){this.wallet?.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){this.wallet?.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){this.wallet?.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};Xi=Ro([f("w3m-downloads-view")],Xi);var No=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Oo="https://walletconnect.com/explorer";let Qi=class extends w{render(){return l`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="2">
        ${this.recommendedWalletsTemplate()}
        <w3m-list-wallet
          name="Explore all"
          showAllWallets
          walletIcon="allWallets"
          icon="externalLink"
          size="sm"
          @click=${()=>{g.openHref("https://walletconnect.com/explorer?type=wallet","_blank")}}
        ></w3m-list-wallet>
      </wui-flex>
    `}recommendedWalletsTemplate(){const{recommended:e,featured:n}=k.state,{customWallets:o}=b.state;return[...n,...o??[],...e].slice(0,4).map(i=>l`
        <w3m-list-wallet
          name=${i.name??"Unknown"}
          tagVariant="accent"
          size="sm"
          imageSrc=${h(E.getWalletImage(i))}
          @click=${()=>{this.onWalletClick(i)}}
        ></w3m-list-wallet>
      `)}onWalletClick(e){C.sendEvent({type:"track",event:"GET_WALLET",properties:{name:e.name,walletRank:void 0,explorerId:e.id,type:"homepage"}}),g.openHref(e.homepage??Oo,"_blank")}};Qi=No([f("w3m-get-wallet-view")],Qi);var wn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let hi=class extends w{constructor(){super(...arguments),this.data=[]}render(){return l`
      <wui-flex flexDirection="column" alignItems="center" gap="4">
        ${this.data.map(e=>l`
            <wui-flex flexDirection="column" alignItems="center" gap="5">
              <wui-flex flexDirection="row" justifyContent="center" gap="1">
                ${e.images.map(n=>l`<wui-visual size="sm" name=${n}></wui-visual>`)}
              </wui-flex>
            </wui-flex>
            <wui-flex flexDirection="column" alignItems="center" gap="1">
              <wui-text variant="md-regular" color="primary" align="center">${e.title}</wui-text>
              <wui-text variant="sm-regular" color="secondary" align="center"
                >${e.text}</wui-text
              >
            </wui-flex>
          `)}
      </wui-flex>
    `}};wn([c({type:Array})],hi.prototype,"data",void 0);hi=wn([f("w3m-help-widget")],hi);var Po=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Do=[{images:["login","profile","lock"],title:"One login for all of web3",text:"Log in to any app by connecting your wallet. Say goodbye to countless passwords!"},{images:["defi","nft","eth"],title:"A home for your digital assets",text:"A wallet lets you store, send and receive digital assets like cryptocurrencies and NFTs."},{images:["browser","noun","dao"],title:"Your gateway to a new web",text:"With your wallet, you can explore and interact with DeFi, NFTs, DAOs, and much more."}];let Ji=class extends w{render(){return l`
      <wui-flex
        flexDirection="column"
        .padding=${["6","5","5","5"]}
        alignItems="center"
        gap="5"
      >
        <w3m-help-widget .data=${Do}></w3m-help-widget>
        <wui-button variant="accent-primary" size="md" @click=${this.onGetWallet.bind(this)}>
          <wui-icon color="inherit" slot="iconLeft" name="wallet"></wui-icon>
          Get a wallet
        </wui-button>
      </wui-flex>
    `}onGetWallet(){C.sendEvent({type:"track",event:"CLICK_GET_WALLET_HELP"}),p.push("GetWallet")}};Ji=Po([f("w3m-what-is-a-wallet-view")],Ji);const Lo=$`
  wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    transition: opacity ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: opacity;
  }
  wui-flex::-webkit-scrollbar {
    display: none;
  }
  wui-flex.disabled {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
`;var mn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Mt=class extends w{constructor(){super(),this.unsubscribe=[],this.checked=Wt.state.isLegalCheckboxChecked,this.unsubscribe.push(Wt.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{termsConditionsUrl:e,privacyPolicyUrl:n}=b.state,o=b.state.features?.legalCheckbox,i=!!(e||n)&&!!o,s=i&&!this.checked,a=s?-1:void 0;return l`
      <w3m-legal-checkbox></w3m-legal-checkbox>
      <wui-flex
        flexDirection="column"
        .padding=${i?["0","3","3","3"]:"3"}
        gap="2"
        class=${h(s?"disabled":void 0)}
      >
        <w3m-wallet-login-list tabIdx=${h(a)}></w3m-wallet-login-list>
      </wui-flex>
    `}};Mt.styles=Lo;mn([d()],Mt.prototype,"checked",void 0);Mt=mn([f("w3m-connect-wallets-view")],Mt);const jo=$`
  :host {
    display: block;
    width: 120px;
    height: 120px;
  }

  svg {
    width: 120px;
    height: 120px;
    fill: none;
    stroke: transparent;
    stroke-linecap: round;
  }

  use {
    stroke: ${t=>t.colors.accent100};
    stroke-width: 2px;
    stroke-dasharray: 54, 118;
    stroke-dashoffset: 172;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var Bo=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let pi=class extends w{render(){return l`
      <svg viewBox="0 0 54 59">
        <path
          id="wui-loader-path"
          d="M17.22 5.295c3.877-2.277 5.737-3.363 7.72-3.726a11.44 11.44 0 0 1 4.12 0c1.983.363 3.844 1.45 7.72 3.726l6.065 3.562c3.876 2.276 5.731 3.372 7.032 4.938a11.896 11.896 0 0 1 2.06 3.63c.683 1.928.688 4.11.688 8.663v7.124c0 4.553-.005 6.735-.688 8.664a11.896 11.896 0 0 1-2.06 3.63c-1.3 1.565-3.156 2.66-7.032 4.937l-6.065 3.563c-3.877 2.276-5.737 3.362-7.72 3.725a11.46 11.46 0 0 1-4.12 0c-1.983-.363-3.844-1.449-7.72-3.726l-6.065-3.562c-3.876-2.276-5.731-3.372-7.032-4.938a11.885 11.885 0 0 1-2.06-3.63c-.682-1.928-.688-4.11-.688-8.663v-7.124c0-4.553.006-6.735.688-8.664a11.885 11.885 0 0 1 2.06-3.63c1.3-1.565 3.156-2.66 7.032-4.937l6.065-3.562Z"
        />
        <use xlink:href="#wui-loader-path"></use>
      </svg>
    `}};pi.styles=[T,jo];pi=Bo([f("wui-loading-hexagon")],pi);const Uo=ne`
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

  wui-loading-hexagon {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: 4px;
    bottom: 0;
    opacity: 0;
    transform: scale(0.5);
    z-index: 1;
  }

  wui-button {
    display: none;
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  wui-button[data-retry='true'] {
    display: block;
    opacity: 1;
  }
`;var Wi=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let gt=class extends w{constructor(){super(),this.network=p.state.data?.network,this.unsubscribe=[],this.showRetry=!1,this.error=!1}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}firstUpdated(){this.onSwitchNetwork()}render(){if(!this.network)throw new Error("w3m-network-switch-view: No network provided");this.onShowRetry();const e=this.getLabel(),n=this.getSubLabel();return l`
      <wui-flex
        data-error=${this.error}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","10","5"]}
        gap="7"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-network-image
            size="lg"
            imageSrc=${h(E.getNetworkImage(this.network))}
          ></wui-network-image>

          ${this.error?null:l`<wui-loading-hexagon></wui-loading-hexagon>`}

          <wui-icon-box color="error" icon="close" size="sm"></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="2">
          <wui-text align="center" variant="h6-regular" color="primary">${e}</wui-text>
          <wui-text align="center" variant="md-regular" color="secondary">${n}</wui-text>
        </wui-flex>

        <wui-button
          data-retry=${this.showRetry}
          variant="accent-primary"
          size="md"
          .disabled=${!this.error}
          @click=${this.onSwitchNetwork.bind(this)}
        >
          <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
          Try again
        </wui-button>
      </wui-flex>
    `}getSubLabel(){const e=m.getConnectorId(u.state.activeChain);return m.getAuthConnector()&&e===A.CONNECTOR_ID.AUTH?"":this.error?"Switch can be declined if chain is not supported by a wallet or previous request is still active":"Accept connection request in your wallet"}getLabel(){const e=m.getConnectorId(u.state.activeChain);return m.getAuthConnector()&&e===A.CONNECTOR_ID.AUTH?`Switching to ${this.network?.name??"Unknown"} network...`:this.error?"Switch declined":"Approve in wallet"}onShowRetry(){this.error&&!this.showRetry&&(this.showRetry=!0,this.shadowRoot?.querySelector("wui-button")?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"}))}async onSwitchNetwork(){try{this.error=!1,u.state.activeChain!==this.network?.chainNamespace&&u.setIsSwitchingNamespace(!0),this.network&&await u.switchActiveNetwork(this.network)}catch{this.error=!0}}};gt.styles=Uo;Wi([d()],gt.prototype,"showRetry",void 0);Wi([d()],gt.prototype,"error",void 0);gt=Wi([f("w3m-network-switch-view")],gt);const zo=$`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:t})=>t[3]};
    width: 100%;
    background-color: transparent;
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-text {
    text-transform: capitalize;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var At=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let He=class extends w{constructor(){super(...arguments),this.imageSrc="ethereum",this.name="Ethereum",this.disabled=!1}render(){return l`
      <button ?disabled=${this.disabled} tabindex=${h(this.tabIdx)}>
        <wui-flex gap="2" alignItems="center">
          <wui-image ?boxed=${!0} src=${this.imageSrc}></wui-image>
          <wui-text variant="lg-regular" color="primary">${this.name}</wui-text>
        </wui-flex>
        <wui-icon name="chevronRight" size="lg" color="default"></wui-icon>
      </button>
    `}};He.styles=[T,N,zo];At([c()],He.prototype,"imageSrc",void 0);At([c()],He.prototype,"name",void 0);At([c()],He.prototype,"tabIdx",void 0);At([c({type:Boolean})],He.prototype,"disabled",void 0);He=At([f("wui-list-network")],He);const Fo=ne`
  .container {
    max-height: 360px;
    overflow: auto;
  }

  .container::-webkit-scrollbar {
    display: none;
  }
`;var kt=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ke=class extends w{constructor(){super(),this.unsubscribe=[],this.network=u.state.activeCaipNetwork,this.requestedCaipNetworks=u.getCaipNetworks(),this.search="",this.onDebouncedSearch=g.debounce(e=>{this.search=e},100),this.unsubscribe.push(Pe.subscribeNetworkImages(()=>this.requestUpdate()),u.subscribeKey("activeCaipNetwork",e=>this.network=e),u.subscribe(()=>{this.requestedCaipNetworks=u.getAllRequestedCaipNetworks()}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      ${this.templateSearchInput()}
      <wui-flex
        class="container"
        .padding=${["0","3","3","3"]}
        flexDirection="column"
        gap="2"
      >
        ${this.networksTemplate()}
      </wui-flex>
    `}templateSearchInput(){return l`
      <wui-flex gap="2" .padding=${["0","3","3","3"]}>
        <wui-input-text
          @inputChange=${this.onInputChange.bind(this)}
          class="network-search-input"
          size="md"
          placeholder="Search network"
          icon="search"
        ></wui-input-text>
      </wui-flex>
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}networksTemplate(){const e=u.getAllApprovedCaipNetworkIds(),n=g.sortRequestedNetworks(e,this.requestedCaipNetworks);return this.search?this.filteredNetworks=n?.filter(o=>o?.name?.toLowerCase().includes(this.search.toLowerCase())):this.filteredNetworks=n,this.filteredNetworks?.map(o=>l`
        <wui-list-network
          .selected=${this.network?.id===o.id}
          imageSrc=${h(E.getNetworkImage(o))}
          type="network"
          name=${o.name??o.id}
          @click=${()=>this.onSwitchNetwork(o)}
          .disabled=${this.getNetworkDisabled(o)}
          data-testid=${`w3m-network-switch-${o.name??o.id}`}
        ></wui-list-network>
      `)}getNetworkDisabled(e){const n=e.chainNamespace,o=!!u.getAccountData(n)?.caipAddress,r=u.getAllApprovedCaipNetworkIds(),i=u.getNetworkProp("supportsAllNetworks",n)!==!1,s=m.getConnectorId(n),a=m.getAuthConnector(),x=s===A.CONNECTOR_ID.AUTH&&a;return!o||i||x?!1:!r?.includes(e.caipNetworkId)}onSwitchNetwork(e){En.onSwitchNetwork({network:e})}};Ke.styles=Fo;kt([d()],Ke.prototype,"network",void 0);kt([d()],Ke.prototype,"requestedCaipNetworks",void 0);kt([d()],Ke.prototype,"filteredNetworks",void 0);kt([d()],Ke.prototype,"search",void 0);Ke=kt([f("w3m-networks-view")],Ke);const Mo=$`
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
    border-radius: calc(
      ${({borderRadius:t})=>t[1]} * 9 - ${({borderRadius:t})=>t[3]}
    );
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
    border-radius: calc(
      ${({borderRadius:t})=>t[1]} * 9 - ${({borderRadius:t})=>t[3]}
    );
    box-shadow: inset 0 0 0 1px ${({tokens:t})=>t.core.glass010};
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:t})=>t[1]} * -1);
    bottom: calc(${({spacing:t})=>t[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      transform ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:t})=>t[4]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:t})=>t["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  wui-link {
    padding: ${({spacing:t})=>t["01"]} ${({spacing:t})=>t[2]};
  }

  .capitalize {
    text-transform: capitalize;
  }
`;var bn=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Vo={eip155:"eth",solana:"solana",bip122:"bitcoin",polkadot:void 0};let Vt=class extends w{constructor(){super(...arguments),this.unsubscribe=[],this.switchToChain=p.state.data?.switchToChain,this.caipNetwork=p.state.data?.network,this.activeChain=u.state.activeChain}firstUpdated(){this.unsubscribe.push(u.subscribeKey("activeChain",e=>this.activeChain=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.switchToChain?A.CHAIN_NAME_MAP[this.switchToChain]:"supported";if(!this.switchToChain)return null;const n=A.CHAIN_NAME_MAP[this.switchToChain];return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["4","2","2","2"]}
        gap="4"
      >
        <wui-flex justifyContent="center" flexDirection="column" alignItems="center" gap="2">
          <wui-visual
            size="md"
            name=${h(Vo[this.switchToChain])}
          ></wui-visual>
          <wui-flex gap="2" flexDirection="column">
            <wui-text
              data-testid=${`w3m-switch-active-chain-to-${n}`}
              variant="lg-regular"
              color="primary"
              align="center"
              >Switch to <span class="capitalize">${n}</span></wui-text
            >
            <wui-text variant="md-regular" color="secondary" align="center">
              Connected wallet doesn't support connecting to ${e} chain. You
              need to connect with a different wallet.
            </wui-text>
          </wui-flex>
          <wui-button
            data-testid="w3m-switch-active-chain-button"
            size="md"
            @click=${this.switchActiveChain.bind(this)}
            >Switch</wui-button
          >
        </wui-flex>
      </wui-flex>
    `}async switchActiveChain(){this.switchToChain&&(u.setIsSwitchingNamespace(!0),m.setFilterByNamespace(this.switchToChain),this.caipNetwork?await u.switchActiveNetwork(this.caipNetwork):u.setActiveNamespace(this.switchToChain),p.reset("Connect"))}};Vt.styles=Mo;bn([c()],Vt.prototype,"activeChain",void 0);Vt=bn([f("w3m-switch-active-chain-view")],Vt);var Ho=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};const Ko=[{images:["network","layers","system"],title:"The system’s nuts and bolts",text:"A network is what brings the blockchain to life, as this technical infrastructure allows apps to access the ledger and smart contract services."},{images:["noun","defiAlt","dao"],title:"Designed for different uses",text:"Each network is designed differently, and may therefore suit certain apps and experiences."}];let Zi=class extends w{render(){return l`
      <wui-flex
        flexDirection="column"
        .padding=${["6","5","5","5"]}
        alignItems="center"
        gap="5"
      >
        <w3m-help-widget .data=${Ko}></w3m-help-widget>
        <wui-button
          variant="accent-primary"
          size="md"
          @click=${()=>{g.openHref("https://ethereum.org/en/developers/docs/networks/","_blank")}}
        >
          Learn more
          <wui-icon color="inherit" slot="iconRight" name="externalLink"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};Zi=Ho([f("w3m-what-is-a-network-view")],Zi);const qo=ne`
  :host > wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
  }

  :host > wui-flex::-webkit-scrollbar {
    display: none;
  }
`;var _i=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let yt=class extends w{constructor(){super(),this.swapUnsupportedChain=p.state.data?.swapUnsupportedChain,this.unsubscribe=[],this.disconnecting=!1,this.remoteFeatures=b.state.remoteFeatures,this.unsubscribe.push(Pe.subscribeNetworkImages(()=>this.requestUpdate()),b.subscribeKey("remoteFeatures",e=>{this.remoteFeatures=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex class="container" flexDirection="column" gap="0">
        <wui-flex
          class="container"
          flexDirection="column"
          .padding=${["3","5","2","5"]}
          alignItems="center"
          gap="5"
        >
          ${this.descriptionTemplate()}
        </wui-flex>

        <wui-flex flexDirection="column" padding="3" gap="2"> ${this.networksTemplate()} </wui-flex>

        <wui-separator text="or"></wui-separator>
        <wui-flex flexDirection="column" padding="3" gap="2">
          <wui-list-item
            variant="icon"
            iconVariant="overlay"
            icon="signOut"
            ?chevron=${!1}
            .loading=${this.disconnecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <wui-text variant="md-medium" color="secondary">Disconnect</wui-text>
          </wui-list-item>
        </wui-flex>
      </wui-flex>
    `}descriptionTemplate(){return this.swapUnsupportedChain?l`
        <wui-text variant="sm-regular" color="secondary" align="center">
          The swap feature doesn’t support your current network. Switch to an available option to
          continue.
        </wui-text>
      `:l`
      <wui-text variant="sm-regular" color="secondary" align="center">
        This app doesn’t support your current network. Switch to an available option to continue.
      </wui-text>
    `}networksTemplate(){const e=u.getAllRequestedCaipNetworks(),n=u.getAllApprovedCaipNetworkIds(),o=g.sortRequestedNetworks(n,e);return(this.swapUnsupportedChain?o.filter(i=>L.SWAP_SUPPORTED_NETWORKS.includes(i.caipNetworkId)):o).map(i=>l`
        <wui-list-network
          imageSrc=${h(E.getNetworkImage(i))}
          name=${i.name??"Unknown"}
          @click=${()=>this.onSwitchNetwork(i)}
        >
        </wui-list-network>
      `)}async onDisconnect(){try{this.disconnecting=!0;const e=u.state.activeChain,o=y.getConnections(e).length>0,r=e&&m.state.activeConnectorIds[e],i=this.remoteFeatures?.multiWallet;await y.disconnect(i?{id:r,namespace:e}:{}),o&&i&&(p.push("ProfileWallets"),W.showSuccess("Wallet deleted"))}catch{C.sendEvent({type:"track",event:"DISCONNECT_ERROR",properties:{message:"Failed to disconnect"}}),W.showError("Failed to disconnect")}finally{this.disconnecting=!1}}async onSwitchNetwork(e){const n=u.getActiveCaipAddress(),o=u.getAllApprovedCaipNetworkIds(),r=u.getNetworkProp("supportsAllNetworks",e.chainNamespace),i=p.state.data;n?o?.includes(e.caipNetworkId)?await u.switchActiveNetwork(e):r?p.push("SwitchNetwork",{...i,network:e}):p.push("SwitchNetwork",{...i,network:e}):n||(u.setActiveCaipNetwork(e),p.push("Connect"))}};yt.styles=qo;_i([d()],yt.prototype,"disconnecting",void 0);_i([d()],yt.prototype,"remoteFeatures",void 0);yt=_i([f("w3m-unsupported-chain-view")],yt);const Go=$`
  wui-flex {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[4]};
    padding: ${({spacing:t})=>t[3]};
  }

  /* -- Types --------------------------------------------------------- */
  wui-flex[data-type='info'] {
    color: ${({tokens:t})=>t.theme.textSecondary};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  wui-flex[data-type='success'] {
    color: ${({tokens:t})=>t.core.textSuccess};
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
  }

  wui-flex[data-type='error'] {
    color: ${({tokens:t})=>t.core.textError};
    background-color: ${({tokens:t})=>t.core.backgroundError};
  }

  wui-flex[data-type='warning'] {
    color: ${({tokens:t})=>t.core.textWarning};
    background-color: ${({tokens:t})=>t.core.backgroundWarning};
  }

  wui-flex[data-type='info'] wui-icon-box {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  wui-flex[data-type='success'] wui-icon-box {
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
  }

  wui-flex[data-type='error'] wui-icon-box {
    background-color: ${({tokens:t})=>t.core.backgroundError};
  }

  wui-flex[data-type='warning'] wui-icon-box {
    background-color: ${({tokens:t})=>t.core.backgroundWarning};
  }

  wui-text {
    flex: 1;
  }
`;var ii=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ze=class extends w{constructor(){super(...arguments),this.icon="externalLink",this.text="",this.type="info"}render(){return l`
      <wui-flex alignItems="center" data-type=${this.type}>
        <wui-icon-box size="sm" color="inherit" icon=${this.icon}></wui-icon-box>
        <wui-text variant="md-regular" color="inherit">${this.text}</wui-text>
      </wui-flex>
    `}};Ze.styles=[T,N,Go];ii([c()],Ze.prototype,"icon",void 0);ii([c()],Ze.prototype,"text",void 0);ii([c()],Ze.prototype,"type",void 0);Ze=ii([f("wui-banner")],Ze);const Yo=ne`
  :host > wui-flex {
    max-height: clamp(360px, 540px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
  }

  :host > wui-flex::-webkit-scrollbar {
    display: none;
  }
`;var Xo=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let fi=class extends w{constructor(){super(),this.unsubscribe=[]}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l` <wui-flex flexDirection="column" .padding=${["2","3","3","3"]} gap="2">
      <wui-banner
        icon="warningCircle"
        text="You can only receive assets on these networks"
      ></wui-banner>
      ${this.networkTemplate()}
    </wui-flex>`}networkTemplate(){const e=u.getAllRequestedCaipNetworks(),n=u.getAllApprovedCaipNetworkIds(),o=u.state.activeCaipNetwork,r=u.checkIfSmartAccountEnabled();let i=g.sortRequestedNetworks(n,e);if(r&&Ae(o?.chainNamespace)===le.ACCOUNT_TYPES.SMART_ACCOUNT){if(!o)return null;i=[o]}return i.filter(a=>a.chainNamespace===o?.chainNamespace).map(a=>l`
        <wui-list-network
          imageSrc=${h(E.getNetworkImage(a))}
          name=${a.name??"Unknown"}
          ?transparent=${!0}
        >
        </wui-list-network>
      `)}};fi.styles=Yo;fi=Xo([f("w3m-wallet-compatible-networks-view")],fi);const Qo=$`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 56px;
    height: 56px;
    box-shadow: 0 0 0 8px ${({tokens:t})=>t.theme.borderPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
    overflow: hidden;
  }

  :host([data-border-radius-full='true']) {
    border-radius: 50px;
  }

  wui-icon {
    width: 32px;
    height: 32px;
  }
`;var ni=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let et=class extends w{render(){return this.dataset.borderRadiusFull=this.borderRadiusFull?"true":"false",l`${this.templateVisual()}`}templateVisual(){return this.imageSrc?l`<wui-image src=${this.imageSrc} alt=${this.alt??""}></wui-image>`:l`<wui-icon
      data-parent-size="md"
      size="inherit"
      color="inherit"
      name="wallet"
    ></wui-icon>`}};et.styles=[T,Qo];ni([c()],et.prototype,"imageSrc",void 0);ni([c()],et.prototype,"alt",void 0);ni([c({type:Boolean})],et.prototype,"borderRadiusFull",void 0);et=ni([f("wui-visual-thumbnail")],et);const Jo=$`
  :host {
    display: flex;
    justify-content: center;
    gap: ${({spacing:t})=>t[4]};
  }

  wui-visual-thumbnail:nth-child(1) {
    z-index: 1;
  }
`;var Zo=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let wi=class extends w{constructor(){super(...arguments),this.dappImageUrl=b.state.metadata?.icons,this.walletImageUrl=u.getAccountData()?.connectedWalletInfo?.icon}firstUpdated(){const e=this.shadowRoot?.querySelectorAll("wui-visual-thumbnail");e?.[0]&&this.createAnimation(e[0],"translate(18px)"),e?.[1]&&this.createAnimation(e[1],"translate(-18px)")}render(){return l`
      <wui-visual-thumbnail
        ?borderRadiusFull=${!0}
        .imageSrc=${this.dappImageUrl?.[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `}createAnimation(e,n){e.animate([{transform:"translateX(0px)"},{transform:n}],{duration:1600,easing:"cubic-bezier(0.56, 0, 0.48, 1)",direction:"alternate",iterations:1/0})}};wi.styles=Jo;wi=Zo([f("w3m-siwx-sign-message-thumbnails")],wi);var Ti=function(t,e,n,o){var r=arguments.length,i=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,n):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,o);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(i=(r<3?s(i):r>3?s(e,n,i):s(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let Ht=class extends w{constructor(){super(...arguments),this.dappName=b.state.metadata?.name,this.isCancelling=!1,this.isSigning=!1}render(){return l`
      <wui-flex justifyContent="center" .padding=${["8","0","6","0"]}>
        <w3m-siwx-sign-message-thumbnails></w3m-siwx-sign-message-thumbnails>
      </wui-flex>
      <wui-flex .padding=${["0","20","5","20"]} gap="3" justifyContent="space-between">
        <wui-text variant="lg-medium" align="center" color="primary"
          >${this.dappName??"Dapp"} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["0","10","4","10"]} gap="3" justifyContent="space-between">
        <wui-text variant="md-regular" align="center" color="secondary"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["4","5","5","5"]} gap="3" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral-secondary"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          ${this.isCancelling?"Cancelling...":"Cancel"}
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral-primary"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning?"Signing...":"Sign"}
        </wui-button>
      </wui-flex>
    `}async onSign(){this.isSigning=!0;try{await Ri.requestSignMessage()}catch(e){if(e instanceof Error&&e.message.includes("OTP is required")){W.showError({message:"Something went wrong. We need to verify your account again."}),p.replace("DataCapture");return}throw e}finally{this.isSigning=!1}}async onCancel(){this.isCancelling=!0,await Ri.cancelSignMessage().finally(()=>this.isCancelling=!1)}};Ti([d()],Ht.prototype,"isCancelling",void 0);Ti([d()],Ht.prototype,"isSigning",void 0);Ht=Ti([f("w3m-siwx-sign-message-view")],Ht);export{Oi as AppKitAccountButton,Di as AppKitButton,ji as AppKitConnectButton,Ui as AppKitNetworkButton,Ni as W3mAccountButton,de as W3mAccountSettingsView,ci as W3mAccountView,Nt as W3mAllWalletsView,Pi as W3mButton,Ft as W3mChooseAccountNameView,Li as W3mConnectButton,G as W3mConnectView,Mt as W3mConnectWalletsView,Ki as W3mConnectingExternalView,jt as W3mConnectingMultiChainView,zt as W3mConnectingWcBasicView,$e as W3mConnectingWcView,Xi as W3mDownloadsView,ca as W3mFooter,Qi as W3mGetWalletView,Bi as W3mNetworkButton,gt as W3mNetworkSwitchView,Ke as W3mNetworksView,M as W3mProfileWalletsView,da as W3mRouter,Ht as W3mSIWXSignMessageView,Vt as W3mSwitchActiveChainView,yt as W3mUnsupportedChainView,fi as W3mWalletCompatibleNetworksView,Zi as W3mWhatIsANetworkView,Ji as W3mWhatIsAWalletView};
