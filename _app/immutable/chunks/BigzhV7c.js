import{cv as V,c_ as _,cD as p,cw as c,cZ as s,de as g,cy as f,cx as C,cP as D,cS as y,d5 as d,cT as m,cW as $,dw as W,c$ as N}from"./DgjbO070.js";import{c as u,r as E}from"./BvzJc2UN.js";import{W as b}from"./02KTgZY8.js";import"./D_llTcOA.js";import"./A_Nk8MfW.js";import{e as P,n as T}from"./CM0mOKsn.js";import"./CxGiiovH.js";import"./BylOuJBE.js";var U=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let I=class extends b{constructor(){super(...arguments),this.onOtpSubmit=async e=>{try{if(this.authConnector){const t=V.state.activeChain,r=_.getConnections(t),n=p.state.remoteFeatures?.multiWallet,i=r.length>0;if(await this.authConnector.provider.connectOtp({otp:e}),c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),t)await _.connectExternal(this.authConnector,t);else throw new Error("Active chain is not set on ChainControll");if(c.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"email",name:this.authConnector.name||"Unknown",view:s.state.view,walletRank:void 0}}),p.state.remoteFeatures?.emailCapture)return;if(p.state.siwx){g.close();return}if(i&&n){s.replace("ProfileWallets"),f.showSuccess("New Wallet Added");return}g.close()}}catch(t){throw c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:C.parseError(t)}}),t}},this.onOtpResend=async e=>{this.authConnector&&(await this.authConnector.provider.connectEmail({email:e}),c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}))}}};I=U([u("w3m-email-verify-otp-view")],I);const F=D`
  wui-icon-box {
    height: ${({spacing:a})=>a[16]};
    width: ${({spacing:a})=>a[16]};
  }
`;var R=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let w=class extends y{constructor(){super(),this.email=s.state.data?.email,this.authConnector=d.getAuthConnector(),this.loading=!1,this.listenForDeviceApproval()}render(){if(!this.email)throw new Error("w3m-email-verify-device-view: No email provided");if(!this.authConnector)throw new Error("w3m-email-verify-device-view: No auth connector provided");return m`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["6","3","6","3"]}
        gap="4"
      >
        <wui-icon-box size="xl" color="accent-primary" icon="sealCheck"></wui-icon-box>

        <wui-flex flexDirection="column" alignItems="center" gap="3">
          <wui-flex flexDirection="column" alignItems="center">
            <wui-text variant="md-regular" color="primary">
              Approve the login link we sent to
            </wui-text>
            <wui-text variant="md-regular" color="primary"><b>${this.email}</b></wui-text>
          </wui-flex>

          <wui-text variant="sm-regular" color="secondary" align="center">
            The code expires in 20 minutes
          </wui-text>

          <wui-flex alignItems="center" id="w3m-resend-section" gap="2">
            <wui-text variant="sm-regular" color="primary" align="center">
              Didn't receive it?
            </wui-text>
            <wui-link @click=${this.onResendCode.bind(this)} .disabled=${this.loading}>
              Resend email
            </wui-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}async listenForDeviceApproval(){if(this.authConnector)try{await this.authConnector.provider.connectDevice(),c.sendEvent({type:"track",event:"DEVICE_REGISTERED_FOR_EMAIL"}),c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_SENT"}),s.replace("EmailVerifyOtp",{email:this.email})}catch{s.goBack()}}async onResendCode(){try{if(!this.loading){if(!this.authConnector||!this.email)throw new Error("w3m-email-login-widget: Unable to resend email");this.loading=!0,await this.authConnector.provider.connectEmail({email:this.email}),this.listenForDeviceApproval(),f.showSuccess("Code email resent")}}catch(e){f.showError(e)}finally{this.loading=!1}}};w.styles=F;R([E()],w.prototype,"loading",void 0);w=R([u("w3m-email-verify-device-view")],w);const j=$`
  wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }
`;var O=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let h=class extends y{constructor(){super(...arguments),this.formRef=P(),this.initialEmail=s.state.data?.email??"",this.redirectView=s.state.data?.redirectView,this.email="",this.loading=!1}firstUpdated(){this.formRef.value?.addEventListener("keydown",e=>{e.key==="Enter"&&this.onSubmitEmail(e)})}render(){return m`
      <wui-flex flexDirection="column" padding="4" gap="4">
        <form ${T(this.formRef)} @submit=${this.onSubmitEmail.bind(this)}>
          <wui-email-input
            value=${this.initialEmail}
            .disabled=${this.loading}
            @inputChange=${this.onEmailInputChange.bind(this)}
          >
          </wui-email-input>
          <input type="submit" hidden />
        </form>
        ${this.buttonsTemplate()}
      </wui-flex>
    `}onEmailInputChange(e){this.email=e.detail}async onSubmitEmail(e){try{if(this.loading)return;this.loading=!0,e.preventDefault();const t=d.getAuthConnector();if(!t)throw new Error("w3m-update-email-wallet: Auth connector not found");const r=await t.provider.updateEmail({email:this.email});c.sendEvent({type:"track",event:"EMAIL_EDIT"}),r.action==="VERIFY_SECONDARY_OTP"?s.push("UpdateEmailSecondaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView}):s.push("UpdateEmailPrimaryOtp",{email:this.initialEmail,newEmail:this.email,redirectView:this.redirectView})}catch(t){f.showError(t),this.loading=!1}}buttonsTemplate(){const e=!this.loading&&this.email.length>3&&this.email!==this.initialEmail;return this.redirectView?m`
      <wui-flex gap="3">
        <wui-button size="md" variant="neutral" fullWidth @click=${s.goBack}>
          Cancel
        </wui-button>

        <wui-button
          size="md"
          variant="accent-primary"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      </wui-flex>
    `:m`
        <wui-button
          size="md"
          variant="accent-primary"
          fullWidth
          @click=${this.onSubmitEmail.bind(this)}
          .disabled=${!e}
          .loading=${this.loading}
        >
          Save
        </wui-button>
      `}};h.styles=j;O([E()],h.prototype,"email",void 0);O([E()],h.prototype,"loading",void 0);h=O([u("w3m-update-email-wallet-view")],h);var L=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let A=class extends b{constructor(){super(),this.email=s.state.data?.email,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailPrimaryOtp({otp:e}),c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),s.replace("UpdateEmailSecondaryOtp",s.state.data))}catch(t){throw c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:C.parseError(t)}}),t}},this.onStartOver=()=>{s.replace("UpdateEmailWallet",s.state.data)}}};A=L([u("w3m-update-email-primary-otp-view")],A);var M=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let x=class extends b{constructor(){super(),this.email=s.state.data?.newEmail,this.redirectView=s.state.data?.redirectView,this.onOtpSubmit=async e=>{try{this.authConnector&&(await this.authConnector.provider.updateEmailSecondaryOtp({otp:e}),c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_PASS"}),this.redirectView&&s.reset(this.redirectView))}catch(t){throw c.sendEvent({type:"track",event:"EMAIL_VERIFICATION_CODE_FAIL",properties:{message:C.parseError(t)}}),t}},this.onStartOver=()=>{s.replace("UpdateEmailWallet",s.state.data)}}};x=M([u("w3m-update-email-secondary-otp-view")],x);var S=function(a,e,t,r){var n=arguments.length,i=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,t):r,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(a,e,t,r);else for(var l=a.length-1;l>=0;l--)(o=a[l])&&(i=(n<3?o(i):n>3?o(e,t,i):o(e,t))||i);return n>3&&i&&Object.defineProperty(e,t,i),i};let v=class extends y{constructor(){super(),this.authConnector=d.getAuthConnector(),this.isEmailEnabled=p.state.remoteFeatures?.email,this.isAuthEnabled=this.checkIfAuthEnabled(d.state.connectors),this.connectors=d.state.connectors,d.subscribeKey("connectors",e=>{this.connectors=e,this.isAuthEnabled=this.checkIfAuthEnabled(this.connectors)})}render(){if(!this.isEmailEnabled)throw new Error("w3m-email-login-view: Email is not enabled");if(!this.isAuthEnabled)throw new Error("w3m-email-login-view: No auth connector provided");return m`<wui-flex flexDirection="column" .padding=${["1","3","3","3"]} gap="4">
      <w3m-email-login-widget></w3m-email-login-widget>
    </wui-flex> `}checkIfAuthEnabled(e){const t=e.filter(n=>n.type===W.CONNECTOR_TYPE_AUTH).map(n=>n.chain);return N.AUTH_CONNECTOR_SUPPORTED_CHAINS.some(n=>t.includes(n))}};S([E()],v.prototype,"connectors",void 0);v=S([u("w3m-email-login-view")],v);export{v as W3mEmailLoginView,b as W3mEmailOtpWidget,w as W3mEmailVerifyDeviceView,I as W3mEmailVerifyOtpView,A as W3mUpdateEmailPrimaryOtpView,x as W3mUpdateEmailSecondaryOtpView,h as W3mUpdateEmailWalletView};
