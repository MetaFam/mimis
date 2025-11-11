import{cv as s,cw as S,cZ as h,d5 as g,cy as w,cx as u,dk as _,dl as $,c$ as E,cP as m,cQ as y,cS as b,cT as v,cR as R}from"./DgjbO070.js";import{n as d,c as C}from"./BvzJc2UN.js";import{o as T}from"./CtmwZb_8.js";function O(){try{return u.returnOpenHref(`${E.SECURE_SITE_SDK_ORIGIN}/loading`,"popupWindow","width=600,height=800,scrollbars=yes")}catch{throw new Error("Could not open social popup")}}async function U(){h.push("ConnectingFarcaster");const e=g.getAuthConnector();if(e&&!s.getAccountData()?.farcasterUrl)try{const{url:t}=await e.provider.getFarcasterUri();s.setAccountProp("farcasterUrl",t,s.state.activeChain)}catch(t){h.goBack(),w.showError(t)}}async function j(e){h.push("ConnectingSocial");const r=g.getAuthConnector();let t=null;try{const n=setTimeout(()=>{throw new Error("Social login timed out. Please try again.")},45e3);if(r&&e){if(u.isTelegram()||(t=O()),t)s.setAccountProp("socialWindow",_(t),s.state.activeChain);else if(!u.isTelegram())throw new Error("Could not create social popup");const{uri:i}=await r.provider.getSocialRedirectUri({provider:e});if(!i)throw t?.close(),new Error("Could not fetch the social redirect uri");if(t&&(t.location.href=i),u.isTelegram()){$.setTelegramSocialProvider(e);const o=u.formatTelegramSocialLoginUrl(i);u.openHref(o,"_top")}clearTimeout(n)}}catch(n){t?.close(),w.showError(n?.message)}}async function D(e){s.setAccountProp("socialProvider",e,s.state.activeChain),S.sendEvent({type:"track",event:"SOCIAL_LOGIN_STARTED",properties:{provider:e}}),e==="farcaster"?await U():await j(e)}const A=m`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: ${({borderRadius:e})=>e[20]};
    overflow: hidden;
  }

  wui-icon {
    width: 100%;
    height: 100%;
  }
`;var x=function(e,r,t,n){var i=arguments.length,o=i<3?r:n===null?n=Object.getOwnPropertyDescriptor(r,t):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(e,r,t,n);else for(var c=e.length-1;c>=0;c--)(a=e[c])&&(o=(i<3?a(o):i>3?a(r,t,o):a(r,t))||o);return i>3&&o&&Object.defineProperty(r,t,o),o};let f=class extends b{constructor(){super(...arguments),this.logo="google"}render(){return v`<wui-icon color="inherit" size="inherit" name=${this.logo}></wui-icon> `}};f.styles=[y,A];x([d()],f.prototype,"logo",void 0);f=x([C("wui-logo")],f);const I=m`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-text {
    text-transform: capitalize;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var p=function(e,r,t,n){var i=arguments.length,o=i<3?r:n===null?n=Object.getOwnPropertyDescriptor(r,t):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(e,r,t,n);else for(var c=e.length-1;c>=0;c--)(a=e[c])&&(o=(i<3?a(o):i>3?a(r,t,o):a(r,t))||o);return i>3&&o&&Object.defineProperty(r,t,o),o};let l=class extends b{constructor(){super(...arguments),this.logo="google",this.name="Continue with google",this.disabled=!1}render(){return v`
      <button ?disabled=${this.disabled} tabindex=${T(this.tabIdx)}>
        <wui-flex gap="2" alignItems="center">
          <wui-image ?boxed=${!0} logo=${this.logo}></wui-image>
          <wui-text variant="lg-regular" color="primary">${this.name}</wui-text>
        </wui-flex>
        <wui-icon name="chevronRight" size="lg" color="default"></wui-icon>
      </button>
    `}};l.styles=[y,R,I];p([d()],l.prototype,"logo",void 0);p([d()],l.prototype,"name",void 0);p([d()],l.prototype,"tabIdx",void 0);p([d({type:Boolean})],l.prototype,"disabled",void 0);l=p([C("wui-list-social")],l);export{D as e};
