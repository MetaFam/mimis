import{Y as d,Q as w,K as _,R as p,a1 as v,G as m,V as c,ai as E,J as $,i as y,r as b,a as x,x as h,e as R}from"./DPZqRhbA.js";import{n as u,c as C,o as O}from"./DCQoFiFM.js";function T(){try{return c.returnOpenHref(`${$.SECURE_SITE_SDK_ORIGIN}/loading`,"popupWindow","width=600,height=800,scrollbars=yes")}catch{throw new Error("Could not open social popup")}}async function U(){p.push("ConnectingFarcaster");const t=v.getAuthConnector();if(t&&!d.state.farcasterUrl)try{const{url:o}=await t.provider.getFarcasterUri();d.setFarcasterUrl(o,w.state.activeChain)}catch(o){p.goBack(),m.showError(o)}}async function j(t){p.push("ConnectingSocial");const o=v.getAuthConnector();let e=null;try{const i=setTimeout(()=>{throw new Error("Social login timed out. Please try again.")},45e3);if(o&&t){if(c.isTelegram()||(e=T()),e)d.setSocialWindow(e,w.state.activeChain);else if(!c.isTelegram())throw new Error("Could not create social popup");const{uri:n}=await o.provider.getSocialRedirectUri({provider:t});if(!n)throw e==null||e.close(),new Error("Could not fetch the social redirect uri");if(e&&(e.location.href=n),c.isTelegram()){E.setTelegramSocialProvider(t);const r=c.formatTelegramSocialLoginUrl(n);c.openHref(r,"_top")}clearTimeout(i)}}catch(i){e==null||e.close(),m.showError(i==null?void 0:i.message)}}async function D(t){d.setSocialProvider(t,w.state.activeChain),_.sendEvent({type:"track",event:"SOCIAL_LOGIN_STARTED",properties:{provider:t}}),t==="farcaster"?await U():await j(t)}const L=y`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-3xl);
    border: 1px solid var(--wui-color-gray-glass-005);
    overflow: hidden;
  }

  wui-icon {
    width: 100%;
    height: 100%;
  }
`;var S=function(t,o,e,i){var n=arguments.length,r=n<3?o:i===null?i=Object.getOwnPropertyDescriptor(o,e):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,o,e,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(o,e,r):a(o,e))||r);return n>3&&r&&Object.defineProperty(o,e,r),r};let f=class extends x{constructor(){super(...arguments),this.logo="google"}render(){return h`<wui-icon color="inherit" size="inherit" name=${this.logo}></wui-icon> `}};f.styles=[b,L];S([u()],f.prototype,"logo",void 0);f=S([C("wui-logo")],f);const I=y`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    justify-content: flex-start;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-text[data-align='left'] {
    display: flex;
    flex: 1;
  }

  wui-text[data-align='center'] {
    display: flex;
    flex: 1;
    justify-content: center;
  }

  .invisible {
    opacity: 0;
    pointer-events: none;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }
`;var g=function(t,o,e,i){var n=arguments.length,r=n<3?o:i===null?i=Object.getOwnPropertyDescriptor(o,e):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,o,e,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(o,e,r):a(o,e))||r);return n>3&&r&&Object.defineProperty(o,e,r),r};let l=class extends x{constructor(){super(...arguments),this.logo="google",this.name="Continue with google",this.align="left",this.disabled=!1}render(){return h`
      <button ?disabled=${this.disabled} tabindex=${O(this.tabIdx)}>
        <wui-logo logo=${this.logo}></wui-logo>
        <wui-text
          data-align=${this.align}
          variant="paragraph-500"
          color="inherit"
          align=${this.align}
          >${this.name}</wui-text
        >
        ${this.templatePlacement()}
      </button>
    `}templatePlacement(){return this.align==="center"?h` <wui-logo class="invisible" logo=${this.logo}></wui-logo>`:null}};l.styles=[b,R,I];g([u()],l.prototype,"logo",void 0);g([u()],l.prototype,"name",void 0);g([u()],l.prototype,"align",void 0);g([u()],l.prototype,"tabIdx",void 0);g([u({type:Boolean})],l.prototype,"disabled",void 0);l=g([C("wui-list-social")],l);export{D as e};
