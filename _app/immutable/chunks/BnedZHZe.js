import{A as $,D as _,F as R,i as f,r as m,a as b,x as l,au as s,e as O}from"./D3Lnneyv.js";import{n as j,c as w,o as P,r as y}from"./BaZEMA-x.js";import{e as T,n as U}from"./z57hFEls.js";import{R as B}from"./Dmg8YACJ.js";const u=$({isLegalCheckboxChecked:!1}),g={state:u,subscribe(n){return R(u,()=>n(u))},subscribeKey(n,e){return _(u,n,e)},setIsLegalCheckboxChecked(n){u.isLegalCheckboxChecked=n}},E=f`
  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    column-gap: var(--wui-spacing-1xs);
  }

  label > input[type='checkbox'] {
    height: 0;
    width: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
  }

  label > span {
    width: var(--wui-spacing-xl);
    height: var(--wui-spacing-xl);
    min-width: var(--wui-spacing-xl);
    min-height: var(--wui-spacing-xl);
    border-radius: var(--wui-border-radius-3xs);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-010);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-lg);
    will-change: background-color;
  }

  label > span:hover,
  label > input[type='checkbox']:focus-visible + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  label input[type='checkbox']:checked + span {
    background-color: var(--wui-color-blue-base-90);
  }

  label > span > wui-icon {
    opacity: 0;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-lg);
    will-change: opacity;
  }

  label > input[type='checkbox']:checked + span wui-icon {
    opacity: 1;
  }
`;var v=function(n,e,r,o){var i=arguments.length,t=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(n,e,r,o);else for(var a=n.length-1;a>=0;a--)(c=n[a])&&(t=(i<3?c(t):i>3?c(e,r,t):c(e,r))||t);return i>3&&t&&Object.defineProperty(e,r,t),t};let h=class extends b{constructor(){super(...arguments),this.inputElementRef=T(),this.checked=void 0}render(){return l`
      <label>
        <input
          ${U(this.inputElementRef)}
          ?checked=${P(this.checked)}
          type="checkbox"
          @change=${this.dispatchChangeEvent}
        />
        <span>
          <wui-icon name="checkmarkBold" color="inverse-100" size="xxs"></wui-icon>
        </span>
        <slot></slot>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("checkboxChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};h.styles=[m,E];v([j({type:Boolean})],h.prototype,"checked",void 0);h=v([w("wui-checkbox")],h);const L=f`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  wui-checkbox {
    padding: var(--wui-spacing-s);
  }
  a {
    text-decoration: none;
    color: var(--wui-color-fg-150);
    font-weight: 500;
  }
`;var k=function(n,e,r,o){var i=arguments.length,t=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(n,e,r,o);else for(var a=n.length-1;a>=0;a--)(c=n[a])&&(t=(i<3?c(t):i>3?c(e,r,t):c(e,r))||t);return i>3&&t&&Object.defineProperty(e,r,t),t};let p=class extends b{constructor(){super(),this.unsubscribe=[],this.checked=g.state.isLegalCheckboxChecked,this.unsubscribe.push(g.subscribeKey("isLegalCheckboxChecked",e=>{this.checked=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var i;const{termsConditionsUrl:e,privacyPolicyUrl:r}=s.state,o=(i=s.state.features)==null?void 0:i.legalCheckbox;return!e&&!r||!o?null:l`
      <wui-checkbox
        ?checked=${this.checked}
        @checkboxChange=${this.onCheckboxChange.bind(this)}
        data-testid="wui-checkbox"
      >
        <wui-text color="fg-250" variant="small-400" align="left">
          I agree to our ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
        </wui-text>
      </wui-checkbox>
    `}andTemplate(){const{termsConditionsUrl:e,privacyPolicyUrl:r}=s.state;return e&&r?"and":""}termsTemplate(){const{termsConditionsUrl:e}=s.state;return e?l`<a rel="noreferrer" target="_blank" href=${e}>terms of service</a>`:null}privacyTemplate(){const{privacyPolicyUrl:e}=s.state;return e?l`<a rel="noreferrer" target="_blank" href=${e}>privacy policy</a>`:null}onCheckboxChange(){g.setIsLegalCheckboxChecked(!this.checked)}};p.styles=[L];k([y()],p.prototype,"checked",void 0);p=k([w("w3m-legal-checkbox")],p);const F=f`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }

  a {
    text-decoration: none;
    cursor: pointer;
  }

  a:hover {
    opacity: 0.9;
  }
`;var W=function(n,e,r,o){var i=arguments.length,t=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(n,e,r,o);else for(var a=n.length-1;a>=0;a--)(c=n[a])&&(t=(i<3?c(t):i>3?c(e,r,t):c(e,r))||t);return i>3&&t&&Object.defineProperty(e,r,t),t};let x=class extends b{render(){return l`
      <a
        data-testid="ux-branding-reown"
        href=${B}
        rel="noreferrer"
        target="_blank"
        style="text-decoration: none;"
      >
        <wui-flex
          justifyContent="center"
          alignItems="center"
          gap="xs"
          .padding=${["0","0","l","0"]}
        >
          <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
          <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
        </wui-flex>
      </a>
    `}};x.styles=[m,O,F];x=W([w("wui-ux-by-reown")],x);const D=f`
  :host > wui-flex {
    background-color: var(--wui-color-gray-glass-005);
  }

  :host wui-ux-by-reown {
    padding-top: 0;
  }

  :host wui-ux-by-reown.branding-only {
    padding-top: var(--wui-spacing-m);
  }

  a {
    text-decoration: none;
    color: var(--wui-color-fg-175);
    font-weight: 500;
  }
`;var C=function(n,e,r,o){var i=arguments.length,t=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,r):o,c;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(n,e,r,o);else for(var a=n.length-1;a>=0;a--)(c=n[a])&&(t=(i<3?c(t):i>3?c(e,r,t):c(e,r))||t);return i>3&&t&&Object.defineProperty(e,r,t),t};let d=class extends b{constructor(){super(),this.unsubscribe=[],this.remoteFeatures=s.state.remoteFeatures,this.unsubscribe.push(s.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var t;const{termsConditionsUrl:e,privacyPolicyUrl:r}=s.state,o=(t=s.state.features)==null?void 0:t.legalCheckbox;return!e&&!r||o?l`
        <wui-flex flexDirection="column"> ${this.reownBrandingTemplate(!0)} </wui-flex>
      `:l`
      <wui-flex flexDirection="column">
        <wui-flex .padding=${["m","s","s","s"]} justifyContent="center">
          <wui-text color="fg-250" variant="small-400" align="center">
            By connecting your wallet, you agree to our <br />
            ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
          </wui-text>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `}andTemplate(){const{termsConditionsUrl:e,privacyPolicyUrl:r}=s.state;return e&&r?"and":""}termsTemplate(){const{termsConditionsUrl:e}=s.state;return e?l`<a href=${e} target="_blank" rel="noopener noreferrer"
      >Terms of Service</a
    >`:null}privacyTemplate(){const{privacyPolicyUrl:e}=s.state;return e?l`<a href=${e} target="_blank" rel="noopener noreferrer"
      >Privacy Policy</a
    >`:null}reownBrandingTemplate(e=!1){var r;return(r=this.remoteFeatures)!=null&&r.reownBranding?e?l`<wui-ux-by-reown class="branding-only"></wui-ux-by-reown>`:l`<wui-ux-by-reown></wui-ux-by-reown>`:null}};d.styles=[D];C([y()],d.prototype,"remoteFeatures",void 0);d=C([w("w3m-legal-footer")],d);export{g as O};
