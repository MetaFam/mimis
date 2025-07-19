import{al as Y,aq as _,G as R,D as h,y as U,v as f,ar as $,p as W,z as N,u as I,I as E,R as O,as as S,M as P,o as B,q as H,i as M,a as G,x as p,V as F}from"./DK3AaC1z.js";import{o as C,r as w,c as V}from"./BSWjf9Ht.js";import"./uHgR8rpM.js";import"./svFhHu8t.js";import"./RH3fYreF.js";import"./BS7T96IV.js";import"./Bv9cTpjQ.js";import"./Sj4p6qXn.js";import"./CpPPmmjJ.js";import"./C1blH4wQ.js";const o={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS"},g={[o.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[o.INVALID_RECIPIENT]:"Invalid recipient address",[o.INVALID_ASSET]:"Invalid asset specified",[o.INVALID_AMOUNT]:"Invalid payment amount",[o.UNKNOWN_ERROR]:"Unknown payment error occurred",[o.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[o.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[o.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[o.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[o.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[o.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[o.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status"};class c extends Error{get message(){return g[this.code]}constructor(e,s){super(g[e]),this.name="AppKitPayError",this.code=e,this.details=s,Error.captureStackTrace&&Error.captureStackTrace(this,c)}}const j="https://rpc.walletconnect.org/v1/json-rpc";class K extends Error{}function q(){const t=Y.getSnapshot().projectId;return`${j}?projectId=${t}`}async function k(t,e){const s=q(),i=await(await fetch(s,{method:"POST",body:JSON.stringify({jsonrpc:"2.0",id:1,method:t,params:e}),headers:{"Content-Type":"application/json"}})).json();if(i.error)throw new K(i.error.message);return i}async function L(t){return(await k("reown_getExchanges",t)).result}async function z(t){return(await k("reown_getExchangePayUrl",t)).result}async function X(t){return(await k("reown_getExchangeBuyStatus",t)).result}const J=["eip155"],Q={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function b(t,e){const{chainNamespace:s,chainId:a}=_.parseCaipNetworkId(t),r=Q[s];if(!r)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${s}`);let i=r.native.assetNamespace,u=r.native.assetReference;return e!=="native"&&(i=r.defaultTokenNamespace,u=e),`${`${s}:${a}`}/${i}:${u}`}function Z(t){const{chainNamespace:e}=_.parseCaipNetworkId(t);return J.includes(e)}async function ee(t){const{paymentAssetNetwork:e,activeCaipNetwork:s,approvedCaipNetworkIds:a,requestedCaipNetworks:r}=t,u=R.sortRequestedNetworks(a,r).find(T=>T.caipNetworkId===e);if(!u)throw new c(o.INVALID_PAYMENT_CONFIG);if(u.caipNetworkId===s.caipNetworkId)return;const d=h.getNetworkProp("supportsAllNetworks",u.chainNamespace);if(!((a==null?void 0:a.includes(u.caipNetworkId))||d))throw new c(o.INVALID_PAYMENT_CONFIG);try{await h.switchActiveNetwork(u)}catch(T){throw new c(o.GENERIC_PAYMENT_ERROR,T)}}async function te(t,e,s){var d;if(e!==U.CHAIN.EVM)throw new c(o.INVALID_CHAIN_NAMESPACE);if(!s.fromAddress)throw new c(o.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const a=typeof s.amount=="string"?parseFloat(s.amount):s.amount;if(isNaN(a))throw new c(o.INVALID_PAYMENT_CONFIG);const r=((d=t.metadata)==null?void 0:d.decimals)??18,i=f.parseUnits(a.toString(),r);if(typeof i!="bigint")throw new c(o.GENERIC_PAYMENT_ERROR);return await f.sendTransaction({chainNamespace:e,to:s.recipient,address:s.fromAddress,value:i,data:"0x"})??void 0}async function ne(t,e){if(!e.fromAddress)throw new c(o.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const s=t.asset,a=e.recipient,r=Number(t.metadata.decimals),i=f.parseUnits(e.amount.toString(),r);if(i===void 0)throw new c(o.GENERIC_PAYMENT_ERROR);return await f.writeContract({fromAddress:e.fromAddress,tokenAddress:s,args:[a,i],method:"transfer",abi:$.getERC20Abi(s),chainNamespace:U.CHAIN.EVM})??void 0}const D=0,v="unknown",n=W({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),l={state:n,subscribe(t){return H(n,()=>t(n))},subscribeKey(t,e){return B(n,t,e)},async handleOpenPay(t){this.resetState(),this.setPaymentConfig(t),this.subscribeEvents(),this.initializeAnalytics(),n.isConfigured=!0,N.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:n.exchanges,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount}}}),await P.open({view:"Pay"})},resetState(){n.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},n.recipient="0x0",n.amount=0,n.isConfigured=!1,n.error=null,n.isPaymentInProgress=!1,n.isLoading=!1,n.currentPayment=void 0},setPaymentConfig(t){if(!t.paymentAsset)throw new c(o.INVALID_PAYMENT_CONFIG);try{n.paymentAsset=t.paymentAsset,n.recipient=t.recipient,n.amount=t.amount,n.openInNewTab=t.openInNewTab??!0,n.redirectUrl=t.redirectUrl,n.payWithExchange=t.payWithExchange,n.error=null}catch(e){throw new c(o.INVALID_PAYMENT_CONFIG,e.message)}},getPaymentAsset(){return n.paymentAsset},getExchanges(){return n.exchanges},async fetchExchanges(){try{n.isLoading=!0;const t=await L({page:D,asset:b(n.paymentAsset.network,n.paymentAsset.asset),amount:n.amount.toString()});n.exchanges=t.exchanges.slice(0,2)}catch{throw I.showError(g.UNABLE_TO_GET_EXCHANGES),new c(o.UNABLE_TO_GET_EXCHANGES)}finally{n.isLoading=!1}},async getAvailableExchanges(t){var e;try{const s=t!=null&&t.asset&&(t!=null&&t.network)?b(t.network,t.asset):void 0;return await L({page:(t==null?void 0:t.page)??D,asset:s,amount:(e=t==null?void 0:t.amount)==null?void 0:e.toString()})}catch{throw new c(o.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(t,e,s=!1){try{const a=Number(e.amount),r=await z({exchangeId:t,asset:b(e.network,e.asset),amount:a.toString(),recipient:`${e.network}:${e.recipient}`});return N.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{exchange:{id:t},configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:a},currentPayment:{type:"exchange",exchangeId:t},headless:s}}),s&&(this.initiatePayment(),N.sendEvent({type:"track",event:"PAY_INITIATED",properties:{paymentId:n.paymentId||v,configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:a},currentPayment:{type:"exchange",exchangeId:t}}})),r}catch(a){throw a instanceof Error&&a.message.includes("is not supported")?new c(o.ASSET_NOT_SUPPORTED):new Error(a.message)}},async openPayUrl(t,e,s=!1){try{const a=await this.getPayUrl(t.exchangeId,e,s);if(!a)throw new c(o.UNABLE_TO_GET_PAY_URL);const i=t.openInNewTab??!0?"_blank":"_self";return R.openHref(a.url,i),a}catch(a){throw a instanceof c?n.error=a.message:n.error=g.GENERIC_PAYMENT_ERROR,new c(o.UNABLE_TO_GET_PAY_URL)}},subscribeEvents(){n.isConfigured||(S.subscribeProviders(async t=>{S.getProvider(h.state.activeChain)&&await this.handlePayment()}),E.subscribeKey("caipAddress",async t=>{t&&await this.handlePayment()}))},async handlePayment(){n.currentPayment={type:"wallet",status:"IN_PROGRESS"};const t=E.state.caipAddress;if(!t)return;const{chainId:e,address:s}=_.parseCaipAddress(t),a=h.state.activeChain;if(!s||!e||!a||!S.getProvider(a))return;const i=h.state.activeCaipNetwork;if(i&&!n.isPaymentInProgress)try{this.initiatePayment();const u=h.getAllRequestedCaipNetworks(),d=h.getAllApprovedCaipNetworkIds();switch(await ee({paymentAssetNetwork:n.paymentAsset.network,activeCaipNetwork:i,approvedCaipNetworkIds:d,requestedCaipNetworks:u}),await P.open({view:"PayLoading"}),a){case U.CHAIN.EVM:n.paymentAsset.asset==="native"&&(n.currentPayment.result=await te(n.paymentAsset,a,{recipient:n.recipient,amount:n.amount,fromAddress:s})),n.paymentAsset.asset.startsWith("0x")&&(n.currentPayment.result=await ne(n.paymentAsset,{recipient:n.recipient,amount:n.amount,fromAddress:s})),n.currentPayment.status="SUCCESS";break;default:throw new c(o.INVALID_CHAIN_NAMESPACE)}}catch(u){u instanceof c?n.error=u.message:n.error=g.GENERIC_PAYMENT_ERROR,n.currentPayment.status="FAILED",I.showError(n.error)}finally{n.isPaymentInProgress=!1}},getExchangeById(t){return n.exchanges.find(e=>e.id===t)},validatePayConfig(t){const{paymentAsset:e,recipient:s,amount:a}=t;if(!e)throw new c(o.INVALID_PAYMENT_CONFIG);if(!s)throw new c(o.INVALID_RECIPIENT);if(!e.asset)throw new c(o.INVALID_ASSET);if(a==null||a<=0)throw new c(o.INVALID_AMOUNT)},handlePayWithWallet(){const t=E.state.caipAddress;if(!t){O.push("Connect");return}const{chainId:e,address:s}=_.parseCaipAddress(t),a=h.state.activeChain;if(!s||!e||!a){O.push("Connect");return}this.handlePayment()},async handlePayWithExchange(t){try{n.currentPayment={type:"exchange",exchangeId:t};const{network:e,asset:s}=n.paymentAsset,a={network:e,asset:s,amount:n.amount,recipient:n.recipient},r=await this.getPayUrl(t,a);if(!r)throw new c(o.UNABLE_TO_INITIATE_PAYMENT);return n.currentPayment.sessionId=r.sessionId,n.currentPayment.status="IN_PROGRESS",n.currentPayment.exchangeId=t,this.initiatePayment(),{url:r.url,openInNewTab:n.openInNewTab}}catch(e){return e instanceof c?n.error=e.message:n.error=g.GENERIC_PAYMENT_ERROR,n.isPaymentInProgress=!1,I.showError(n.error),null}},async getBuyStatus(t,e){var s,a;try{const r=await X({sessionId:e,exchangeId:t});return(r.status==="SUCCESS"||r.status==="FAILED")&&N.sendEvent({type:"track",event:r.status==="SUCCESS"?"PAY_SUCCESS":"PAY_ERROR",properties:{paymentId:n.paymentId||v,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount},currentPayment:{type:"exchange",exchangeId:(s=n.currentPayment)==null?void 0:s.exchangeId,sessionId:(a=n.currentPayment)==null?void 0:a.sessionId,result:r.txHash}}}),r}catch{throw new c(o.UNABLE_TO_GET_BUY_STATUS)}},async updateBuyStatus(t,e){try{const s=await this.getBuyStatus(t,e);n.currentPayment&&(n.currentPayment.status=s.status,n.currentPayment.result=s.txHash),(s.status==="SUCCESS"||s.status==="FAILED")&&(n.isPaymentInProgress=!1)}catch{throw new c(o.UNABLE_TO_GET_BUY_STATUS)}},initiatePayment(){n.isPaymentInProgress=!0,n.paymentId=crypto.randomUUID()},initializeAnalytics(){n.analyticsSet||(n.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",t=>{var e;if((e=n.currentPayment)!=null&&e.status&&n.currentPayment.status!=="UNKNOWN"){const s={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[n.currentPayment.status];N.sendEvent({type:"track",event:s,properties:{paymentId:n.paymentId||v,configuration:{network:n.paymentAsset.network,asset:n.paymentAsset.asset,recipient:n.recipient,amount:n.amount},currentPayment:{type:n.currentPayment.type,exchangeId:n.currentPayment.exchangeId,sessionId:n.currentPayment.sessionId,result:n.currentPayment.result}}})}}))}},se=M`
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }

  .token-display {
    padding: var(--wui-spacing-s) var(--wui-spacing-m);
    border-radius: var(--wui-border-radius-s);
    background-color: var(--wui-color-bg-125);
    margin-top: var(--wui-spacing-s);
    margin-bottom: var(--wui-spacing-s);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--wui-spacing-xs);
  }
`;var y=function(t,e,s,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,s):a,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,s,a);else for(var d=t.length-1;d>=0;d--)(u=t[d])&&(i=(r<3?u(i):r>3?u(e,s,i):u(e,s))||i);return r>3&&i&&Object.defineProperty(e,s,i),i};let m=class extends G{constructor(){super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=l.state.exchanges,this.isLoading=l.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=E.state.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(l.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(l.subscribeKey("isLoading",e=>this.isLoading=e)),this.unsubscribe.push(E.subscribe(e=>this.connectedWalletInfo=e.connectedWalletInfo)),l.fetchExchanges()}get isWalletConnected(){return E.state.status==="connected"}render(){return p`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","l","l","l"]} gap="s">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="s">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const e=l.getPaymentAsset();this.networkName=e.network,this.tokenSymbol=e.metadata.symbol,this.amount=l.state.amount.toString()}renderPayWithWallet(){return Z(this.networkName)?p`<wui-flex flexDirection="column" gap="s">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:p``}renderPaymentHeader(){let e=this.networkName;if(this.networkName){const a=h.getAllRequestedCaipNetworks().find(r=>r.caipNetworkId===this.networkName);a&&(e=a.name)}return p`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="xs">
          <wui-text variant="large-700" color="fg-100">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="xxs">
            <wui-text variant="paragraph-600" color="fg-100">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${e?p`
                  <wui-text variant="small-500" color="fg-200"> on ${e} </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){var s,a,r;const e=((s=this.connectedWalletInfo)==null?void 0:s.name)||"connected wallet";return p`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        data-testid="wallet-payment-option"
      >
        <wui-flex alignItems="center" gap="s">
          <wui-wallet-image
            size="sm"
            imageSrc=${C((a=this.connectedWalletInfo)==null?void 0:a.icon)}
            name=${C((r=this.connectedWalletInfo)==null?void 0:r.name)}
          ></wui-wallet-image>
          <wui-text variant="paragraph-500" color="inherit">Pay with ${e}</wui-text>
        </wui-flex>
      </wui-list-item>

      <wui-list-item
        variant="icon"
        iconVariant="overlay"
        icon="disconnect"
        @click=${this.onDisconnect}
        data-testid="disconnect-button"
        ?chevron=${!1}
      >
        <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
      </wui-list-item>
    `}renderDisconnectedView(){return p`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="walletPlaceholder"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="paragraph-500" color="inherit">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?p`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:this.exchanges.length===0?p`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="paragraph-500" color="fg-100">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(e=>p`
        <wui-list-item
          @click=${()=>this.onExchangePayment(e.id)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          ?disabled=${this.loadingExchangeId!==null}
        >
          <wui-flex alignItems="center" gap="s">
            ${this.loadingExchangeId===e.id?p`<wui-loading-spinner color="accent-100" size="md"></wui-loading-spinner>`:p`<wui-wallet-image
                  size="sm"
                  imageSrc=${C(e.imageUrl)}
                  name=${e.name}
                ></wui-wallet-image>`}
            <wui-text flexGrow="1" variant="paragraph-500" color="inherit"
              >Pay with ${e.name} <wui-spinner size="sm" color="fg-200"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){l.handlePayWithWallet()}async onExchangePayment(e){try{this.loadingExchangeId=e;const s=await l.handlePayWithExchange(e);s&&(await P.open({view:"PayLoading"}),R.openHref(s.url,s.openInNewTab?"_blank":"_self"))}catch(s){console.error("Failed to pay with exchange",s),I.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(e){e.stopPropagation();try{await f.disconnect(),P.close()}catch{console.error("Failed to disconnect"),I.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}};m.styles=se;y([w()],m.prototype,"amount",void 0);y([w()],m.prototype,"tokenSymbol",void 0);y([w()],m.prototype,"networkName",void 0);y([w()],m.prototype,"exchanges",void 0);y([w()],m.prototype,"isLoading",void 0);y([w()],m.prototype,"loadingExchangeId",void 0);y([w()],m.prototype,"connectedWalletInfo",void 0);m=y([V("w3m-pay-view")],m);const ae=M`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }
`;var x=function(t,e,s,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,s):a,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,s,a);else for(var d=t.length-1;d>=0;d--)(u=t[d])&&(i=(r<3?u(i):r>3?u(e,s,i):u(e,s))||i);return r>3&&i&&Object.defineProperty(e,s,i),i};const re=4e3;let A=class extends G{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=l.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return p`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center"> ${this.getStateIcon()} </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            ${this.loadingMessage}
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            ${this.subMessage}
          </wui-text>
        </wui-flex>
      </wui-flex>
    `}updateMessages(){var e;switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;case"in-progress":default:((e=l.state.currentPayment)==null?void 0:e.type)==="exchange"?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet");break}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();case"in-progress":default:return this.loaderTemplate()}}setupExchangeSubscription(){var e;((e=l.state.currentPayment)==null?void 0:e.type)==="exchange"&&(this.exchangeSubscription=setInterval(async()=>{var r,i,u;const s=(r=l.state.currentPayment)==null?void 0:r.exchangeId,a=(i=l.state.currentPayment)==null?void 0:i.sessionId;s&&a&&(await l.updateBuyStatus(s,a),((u=l.state.currentPayment)==null?void 0:u.status)==="SUCCESS"&&clearInterval(this.exchangeSubscription))},re))}setupSubscription(){l.subscribeKey("isPaymentInProgress",e=>{var s;!e&&this.paymentState==="in-progress"&&(l.state.error||!((s=l.state.currentPayment)!=null&&s.result)?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{f.state.status!=="disconnected"&&P.close()},3e3))}),l.subscribeKey("error",e=>{e&&this.paymentState==="in-progress"&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const e=F.state.themeVariables["--w3m-border-radius-master"],s=e?parseInt(e.replace("px",""),10):4;return p`<wui-loading-thumbnail radius=${s*9}></wui-loading-thumbnail>`}successTemplate(){return p`<wui-icon size="xl" color="success-100" name="checkmark"></wui-icon>`}errorTemplate(){return p`<wui-icon size="xl" color="error-100" name="close"></wui-icon>`}};A.styles=ae;x([w()],A.prototype,"loadingMessage",void 0);x([w()],A.prototype,"subMessage",void 0);x([w()],A.prototype,"paymentState",void 0);A=x([V("w3m-pay-loading-view")],A);async function fe(t){return l.handleOpenPay(t)}function Ae(){return l.getExchanges()}function Ne(){var t;return(t=l.state.currentPayment)==null?void 0:t.result}function Ie(){return l.state.error}function Pe(){return l.state.isPaymentInProgress}const _e={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},xe={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},Te={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}};export{A as W3mPayLoadingView,m as W3mPayView,_e as baseETH,Te as baseSepoliaETH,xe as baseUSDC,Ae as getExchanges,Pe as getIsPaymentInProgress,Ie as getPayError,Ne as getPayResult,fe as openPay};
