import{ak as $,ap as x,X as k,T as m,K as A,aq as _,J as f,ar as W,A as B,L as N,I as P,Z as g,R as O,M as T,D as H,F,i as G,a as V,x as d,a4 as j,a2 as L,a3 as K}from"./C_tEtCOc.js";import{o as b,r as h,c as Y}from"./CnLVzxgI.js";import"./J1C6UMTk.js";import"./DuZ9Rn8W.js";import"./BRJGcySo.js";import"./CmvmBMU_.js";import"./D4F5-60K.js";import"./BI55ZrNv.js";import"./UiBVIAem.js";import"./CZQXhfnh.js";const o={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS"},E={[o.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[o.INVALID_RECIPIENT]:"Invalid recipient address",[o.INVALID_ASSET]:"Invalid asset specified",[o.INVALID_AMOUNT]:"Invalid payment amount",[o.UNKNOWN_ERROR]:"Unknown payment error occurred",[o.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[o.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[o.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[o.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[o.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[o.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[o.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status"};class c extends Error{get message(){return E[this.code]}constructor(e,s){super(E[e]),this.name="AppKitPayError",this.code=e,this.details=s,Error.captureStackTrace&&Error.captureStackTrace(this,c)}}const q="https://rpc.walletconnect.org/v1/json-rpc";class z extends Error{}function X(){const n=$.getSnapshot().projectId;return`${q}?projectId=${n}`}async function U(n,e){const s=X(),i=await(await fetch(s,{method:"POST",body:JSON.stringify({jsonrpc:"2.0",id:1,method:n,params:e}),headers:{"Content-Type":"application/json"}})).json();if(i.error)throw new z(i.error.message);return i}async function M(n){return(await U("reown_getExchanges",n)).result}async function J(n){return(await U("reown_getExchangePayUrl",n)).result}async function Z(n){return(await U("reown_getExchangeBuyStatus",n)).result}const Q=["eip155","solana"],ee={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function v(n,e){const{chainNamespace:s,chainId:a}=x.parseCaipNetworkId(n),r=ee[s];if(!r)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${s}`);let i=r.native.assetNamespace,u=r.native.assetReference;return e!=="native"&&(i=r.defaultTokenNamespace,u=e),`${`${s}:${a}`}/${i}:${u}`}function te(n){const{chainNamespace:e}=x.parseCaipNetworkId(n);return Q.includes(e)}async function ne(n){const{paymentAssetNetwork:e,activeCaipNetwork:s,approvedCaipNetworkIds:a,requestedCaipNetworks:r}=n,u=k.sortRequestedNetworks(a,r).find(C=>C.caipNetworkId===e);if(!u)throw new c(o.INVALID_PAYMENT_CONFIG);if(u.caipNetworkId===s.caipNetworkId)return;const p=m.getNetworkProp("supportsAllNetworks",u.chainNamespace);if(!((a==null?void 0:a.includes(u.caipNetworkId))||p))throw new c(o.INVALID_PAYMENT_CONFIG);try{await m.switchActiveNetwork(u)}catch(C){throw new c(o.GENERIC_PAYMENT_ERROR,C)}}async function se(n,e,s){var p;if(e!==A.CHAIN.EVM)throw new c(o.INVALID_CHAIN_NAMESPACE);if(!s.fromAddress)throw new c(o.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const a=typeof s.amount=="string"?parseFloat(s.amount):s.amount;if(isNaN(a))throw new c(o.INVALID_PAYMENT_CONFIG);const r=((p=n.metadata)==null?void 0:p.decimals)??18,i=f.parseUnits(a.toString(),r);if(typeof i!="bigint")throw new c(o.GENERIC_PAYMENT_ERROR);return await f.sendTransaction({chainNamespace:e,to:s.recipient,address:s.fromAddress,value:i,data:"0x"})??void 0}async function ae(n,e){if(!e.fromAddress)throw new c(o.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const s=n.asset,a=e.recipient,r=Number(n.metadata.decimals),i=f.parseUnits(e.amount.toString(),r);if(i===void 0)throw new c(o.GENERIC_PAYMENT_ERROR);return await f.writeContract({fromAddress:e.fromAddress,tokenAddress:s,args:[a,i],method:"transfer",abi:W.getERC20Abi(s),chainNamespace:A.CHAIN.EVM})??void 0}async function re(n,e){if(n!==A.CHAIN.SOLANA)throw new c(o.INVALID_CHAIN_NAMESPACE);if(!e.fromAddress)throw new c(o.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");const s=typeof e.amount=="string"?parseFloat(e.amount):e.amount;if(isNaN(s)||s<=0)throw new c(o.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!_.getProvider(n))throw new c(o.GENERIC_PAYMENT_ERROR,"No Solana provider available.");const r=await f.sendTransaction({chainNamespace:A.CHAIN.SOLANA,to:e.recipient,value:s,tokenMint:e.tokenMint});if(!r)throw new c(o.GENERIC_PAYMENT_ERROR,"Transaction failed.");return r}catch(a){throw a instanceof c?a:new c(o.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${a}`)}}const D=0,R="unknown",t=B({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0}),l={state:t,subscribe(n){return F(t,()=>n(t))},subscribeKey(n,e){return H(t,n,e)},async handleOpenPay(n){this.resetState(),this.setPaymentConfig(n),this.subscribeEvents(),this.initializeAnalytics(),t.isConfigured=!0,N.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:t.exchanges,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount}}}),await T.open({view:"Pay"})},resetState(){t.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},t.recipient="0x0",t.amount=0,t.isConfigured=!1,t.error=null,t.isPaymentInProgress=!1,t.isLoading=!1,t.currentPayment=void 0},setPaymentConfig(n){if(!n.paymentAsset)throw new c(o.INVALID_PAYMENT_CONFIG);try{t.paymentAsset=n.paymentAsset,t.recipient=n.recipient,t.amount=n.amount,t.openInNewTab=n.openInNewTab??!0,t.redirectUrl=n.redirectUrl,t.payWithExchange=n.payWithExchange,t.error=null}catch(e){throw new c(o.INVALID_PAYMENT_CONFIG,e.message)}},getPaymentAsset(){return t.paymentAsset},getExchanges(){return t.exchanges},async fetchExchanges(){try{t.isLoading=!0;const n=await M({page:D,asset:v(t.paymentAsset.network,t.paymentAsset.asset),amount:t.amount.toString()});t.exchanges=n.exchanges.slice(0,2)}catch{throw P.showError(E.UNABLE_TO_GET_EXCHANGES),new c(o.UNABLE_TO_GET_EXCHANGES)}finally{t.isLoading=!1}},async getAvailableExchanges(n){var e;try{const s=n!=null&&n.asset&&(n!=null&&n.network)?v(n.network,n.asset):void 0;return await M({page:(n==null?void 0:n.page)??D,asset:s,amount:(e=n==null?void 0:n.amount)==null?void 0:e.toString()})}catch{throw new c(o.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(n,e,s=!1){try{const a=Number(e.amount),r=await J({exchangeId:n,asset:v(e.network,e.asset),amount:a.toString(),recipient:`${e.network}:${e.recipient}`});return N.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{exchange:{id:n},configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:a},currentPayment:{type:"exchange",exchangeId:n},headless:s}}),s&&(this.initiatePayment(),N.sendEvent({type:"track",event:"PAY_INITIATED",properties:{paymentId:t.paymentId||R,configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:a},currentPayment:{type:"exchange",exchangeId:n}}})),r}catch(a){throw a instanceof Error&&a.message.includes("is not supported")?new c(o.ASSET_NOT_SUPPORTED):new Error(a.message)}},async openPayUrl(n,e,s=!1){try{const a=await this.getPayUrl(n.exchangeId,e,s);if(!a)throw new c(o.UNABLE_TO_GET_PAY_URL);const i=n.openInNewTab??!0?"_blank":"_self";return k.openHref(a.url,i),a}catch(a){throw a instanceof c?t.error=a.message:t.error=E.GENERIC_PAYMENT_ERROR,new c(o.UNABLE_TO_GET_PAY_URL)}},subscribeEvents(){t.isConfigured||(_.subscribeProviders(async n=>{_.getProvider(m.state.activeChain)&&await this.handlePayment()}),g.subscribeKey("caipAddress",async n=>{n&&await this.handlePayment()}))},async handlePayment(){t.currentPayment={type:"wallet",status:"IN_PROGRESS"};const n=g.state.caipAddress;if(!n)return;const{chainId:e,address:s}=x.parseCaipAddress(n),a=m.state.activeChain;if(!s||!e||!a||!_.getProvider(a))return;const i=m.state.activeCaipNetwork;if(i&&!t.isPaymentInProgress)try{this.initiatePayment();const u=m.getAllRequestedCaipNetworks(),p=m.getAllApprovedCaipNetworkIds();switch(await ne({paymentAssetNetwork:t.paymentAsset.network,activeCaipNetwork:i,approvedCaipNetworkIds:p,requestedCaipNetworks:u}),await T.open({view:"PayLoading"}),a){case A.CHAIN.EVM:t.paymentAsset.asset==="native"&&(t.currentPayment.result=await se(t.paymentAsset,a,{recipient:t.recipient,amount:t.amount,fromAddress:s})),t.paymentAsset.asset.startsWith("0x")&&(t.currentPayment.result=await ae(t.paymentAsset,{recipient:t.recipient,amount:t.amount,fromAddress:s})),t.currentPayment.status="SUCCESS";break;case A.CHAIN.SOLANA:t.currentPayment.result=await re(a,{recipient:t.recipient,amount:t.amount,fromAddress:s,tokenMint:t.paymentAsset.asset==="native"?void 0:t.paymentAsset.asset}),t.currentPayment.status="SUCCESS";break;default:throw new c(o.INVALID_CHAIN_NAMESPACE)}}catch(u){u instanceof c?t.error=u.message:t.error=E.GENERIC_PAYMENT_ERROR,t.currentPayment.status="FAILED",P.showError(t.error)}finally{t.isPaymentInProgress=!1}},getExchangeById(n){return t.exchanges.find(e=>e.id===n)},validatePayConfig(n){const{paymentAsset:e,recipient:s,amount:a}=n;if(!e)throw new c(o.INVALID_PAYMENT_CONFIG);if(!s)throw new c(o.INVALID_RECIPIENT);if(!e.asset)throw new c(o.INVALID_ASSET);if(a==null||a<=0)throw new c(o.INVALID_AMOUNT)},handlePayWithWallet(){const n=g.state.caipAddress;if(!n){O.push("Connect");return}const{chainId:e,address:s}=x.parseCaipAddress(n),a=m.state.activeChain;if(!s||!e||!a){O.push("Connect");return}this.handlePayment()},async handlePayWithExchange(n){try{t.currentPayment={type:"exchange",exchangeId:n};const{network:e,asset:s}=t.paymentAsset,a={network:e,asset:s,amount:t.amount,recipient:t.recipient},r=await this.getPayUrl(n,a);if(!r)throw new c(o.UNABLE_TO_INITIATE_PAYMENT);return t.currentPayment.sessionId=r.sessionId,t.currentPayment.status="IN_PROGRESS",t.currentPayment.exchangeId=n,this.initiatePayment(),{url:r.url,openInNewTab:t.openInNewTab}}catch(e){return e instanceof c?t.error=e.message:t.error=E.GENERIC_PAYMENT_ERROR,t.isPaymentInProgress=!1,P.showError(t.error),null}},async getBuyStatus(n,e){var s,a;try{const r=await Z({sessionId:e,exchangeId:n});return(r.status==="SUCCESS"||r.status==="FAILED")&&N.sendEvent({type:"track",event:r.status==="SUCCESS"?"PAY_SUCCESS":"PAY_ERROR",properties:{paymentId:t.paymentId||R,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount},currentPayment:{type:"exchange",exchangeId:(s=t.currentPayment)==null?void 0:s.exchangeId,sessionId:(a=t.currentPayment)==null?void 0:a.sessionId,result:r.txHash}}}),r}catch{throw new c(o.UNABLE_TO_GET_BUY_STATUS)}},async updateBuyStatus(n,e){try{const s=await this.getBuyStatus(n,e);t.currentPayment&&(t.currentPayment.status=s.status,t.currentPayment.result=s.txHash),(s.status==="SUCCESS"||s.status==="FAILED")&&(t.isPaymentInProgress=!1)}catch{throw new c(o.UNABLE_TO_GET_BUY_STATUS)}},initiatePayment(){t.isPaymentInProgress=!0,t.paymentId=crypto.randomUUID()},initializeAnalytics(){t.analyticsSet||(t.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",n=>{var e;if((e=t.currentPayment)!=null&&e.status&&t.currentPayment.status!=="UNKNOWN"){const s={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[t.currentPayment.status];N.sendEvent({type:"track",event:s,properties:{paymentId:t.paymentId||R,configuration:{network:t.paymentAsset.network,asset:t.paymentAsset.asset,recipient:t.recipient,amount:t.amount},currentPayment:{type:t.currentPayment.type,exchangeId:t.currentPayment.exchangeId,sessionId:t.currentPayment.sessionId,result:t.currentPayment.result}}})}}))}},ie=G`
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
`;var y=function(n,e,s,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,s):a,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(n,e,s,a);else for(var p=n.length-1;p>=0;p--)(u=n[p])&&(i=(r<3?u(i):r>3?u(e,s,i):u(e,s))||i);return r>3&&i&&Object.defineProperty(e,s,i),i};let w=class extends V{constructor(){super(),this.unsubscribe=[],this.amount="",this.tokenSymbol="",this.networkName="",this.exchanges=l.state.exchanges,this.isLoading=l.state.isLoading,this.loadingExchangeId=null,this.connectedWalletInfo=g.state.connectedWalletInfo,this.initializePaymentDetails(),this.unsubscribe.push(l.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(l.subscribeKey("isLoading",e=>this.isLoading=e)),this.unsubscribe.push(g.subscribe(e=>this.connectedWalletInfo=e.connectedWalletInfo)),l.fetchExchanges()}get isWalletConnected(){return g.state.status==="connected"}render(){return d`
      <wui-flex flexDirection="column">
        <wui-flex flexDirection="column" .padding=${["0","l","l","l"]} gap="s">
          ${this.renderPaymentHeader()}

          <wui-flex flexDirection="column" gap="s">
            ${this.renderPayWithWallet()} ${this.renderExchangeOptions()}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}initializePaymentDetails(){const e=l.getPaymentAsset();this.networkName=e.network,this.tokenSymbol=e.metadata.symbol,this.amount=l.state.amount.toString()}renderPayWithWallet(){return te(this.networkName)?d`<wui-flex flexDirection="column" gap="s">
        ${this.isWalletConnected?this.renderConnectedView():this.renderDisconnectedView()}
      </wui-flex>
      <wui-separator text="or"></wui-separator>`:d``}renderPaymentHeader(){let e=this.networkName;if(this.networkName){const a=m.getAllRequestedCaipNetworks().find(r=>r.caipNetworkId===this.networkName);a&&(e=a.name)}return d`
      <wui-flex flexDirection="column" alignItems="center">
        <wui-flex alignItems="center" gap="xs">
          <wui-text variant="large-700" color="fg-100">${this.amount||"0.0000"}</wui-text>
          <wui-flex class="token-display" alignItems="center" gap="xxs">
            <wui-text variant="paragraph-600" color="fg-100">
              ${this.tokenSymbol||"Unknown Asset"}
            </wui-text>
            ${e?d`
                  <wui-text variant="small-500" color="fg-200"> on ${e} </wui-text>
                `:""}
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderConnectedView(){var s,a,r;const e=((s=this.connectedWalletInfo)==null?void 0:s.name)||"connected wallet";return d`
      <wui-list-item
        @click=${this.onWalletPayment}
        ?chevron=${!0}
        data-testid="wallet-payment-option"
      >
        <wui-flex alignItems="center" gap="s">
          <wui-wallet-image
            size="sm"
            imageSrc=${b((a=this.connectedWalletInfo)==null?void 0:a.icon)}
            name=${b((r=this.connectedWalletInfo)==null?void 0:r.name)}
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
    `}renderDisconnectedView(){return d`<wui-list-item
      variant="icon"
      iconVariant="overlay"
      icon="walletPlaceholder"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="paragraph-500" color="inherit">Pay from wallet</wui-text>
    </wui-list-item>`}renderExchangeOptions(){return this.isLoading?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-spinner size="md"></wui-spinner>
      </wui-flex>`:this.exchanges.length===0?d`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="paragraph-500" color="fg-100">No exchanges available</wui-text>
      </wui-flex>`:this.exchanges.map(e=>d`
        <wui-list-item
          @click=${()=>this.onExchangePayment(e.id)}
          data-testid="exchange-option-${e.id}"
          ?chevron=${!0}
          ?disabled=${this.loadingExchangeId!==null}
        >
          <wui-flex alignItems="center" gap="s">
            ${this.loadingExchangeId===e.id?d`<wui-loading-spinner color="accent-100" size="md"></wui-loading-spinner>`:d`<wui-wallet-image
                  size="sm"
                  imageSrc=${b(e.imageUrl)}
                  name=${e.name}
                ></wui-wallet-image>`}
            <wui-text flexGrow="1" variant="paragraph-500" color="inherit"
              >Pay with ${e.name} <wui-spinner size="sm" color="fg-200"></wui-spinner
            ></wui-text>
          </wui-flex>
        </wui-list-item>
      `)}onWalletPayment(){l.handlePayWithWallet()}async onExchangePayment(e){try{this.loadingExchangeId=e;const s=await l.handlePayWithExchange(e);s&&(await T.open({view:"PayLoading"}),k.openHref(s.url,s.openInNewTab?"_blank":"_self"))}catch(s){console.error("Failed to pay with exchange",s),P.showError("Failed to pay with exchange")}finally{this.loadingExchangeId=null}}async onDisconnect(e){e.stopPropagation();try{await f.disconnect()}catch{console.error("Failed to disconnect"),P.showError("Failed to disconnect")}}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}};w.styles=ie;y([h()],w.prototype,"amount",void 0);y([h()],w.prototype,"tokenSymbol",void 0);y([h()],w.prototype,"networkName",void 0);y([h()],w.prototype,"exchanges",void 0);y([h()],w.prototype,"isLoading",void 0);y([h()],w.prototype,"loadingExchangeId",void 0);y([h()],w.prototype,"connectedWalletInfo",void 0);w=y([Y("w3m-pay-view")],w);const oe=G`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }
`;var S=function(n,e,s,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,s):a,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(n,e,s,a);else for(var p=n.length-1;p>=0;p--)(u=n[p])&&(i=(r<3?u(i):r>3?u(e,s,i):u(e,s))||i);return r>3&&i&&Object.defineProperty(e,s,i),i};const ce=4e3;let I=class extends V{constructor(){super(),this.loadingMessage="",this.subMessage="",this.paymentState="in-progress",this.paymentState=l.state.isPaymentInProgress?"in-progress":"completed",this.updateMessages(),this.setupSubscription(),this.setupExchangeSubscription()}disconnectedCallback(){clearInterval(this.exchangeSubscription)}render(){return d`
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
    `}updateMessages(){var e;switch(this.paymentState){case"completed":this.loadingMessage="Payment completed",this.subMessage="Your transaction has been successfully processed";break;case"error":this.loadingMessage="Payment failed",this.subMessage="There was an error processing your transaction";break;case"in-progress":default:((e=l.state.currentPayment)==null?void 0:e.type)==="exchange"?(this.loadingMessage="Payment initiated",this.subMessage="Please complete the payment on the exchange"):(this.loadingMessage="Awaiting payment confirmation",this.subMessage="Please confirm the payment transaction in your wallet");break}}getStateIcon(){switch(this.paymentState){case"completed":return this.successTemplate();case"error":return this.errorTemplate();case"in-progress":default:return this.loaderTemplate()}}setupExchangeSubscription(){var e;((e=l.state.currentPayment)==null?void 0:e.type)==="exchange"&&(this.exchangeSubscription=setInterval(async()=>{var r,i,u;const s=(r=l.state.currentPayment)==null?void 0:r.exchangeId,a=(i=l.state.currentPayment)==null?void 0:i.sessionId;s&&a&&(await l.updateBuyStatus(s,a),((u=l.state.currentPayment)==null?void 0:u.status)==="SUCCESS"&&clearInterval(this.exchangeSubscription))},ce))}setupSubscription(){l.subscribeKey("isPaymentInProgress",e=>{var s;!e&&this.paymentState==="in-progress"&&(l.state.error||!((s=l.state.currentPayment)!=null&&s.result)?this.paymentState="error":this.paymentState="completed",this.updateMessages(),setTimeout(()=>{f.state.status!=="disconnected"&&T.close()},3e3))}),l.subscribeKey("error",e=>{e&&this.paymentState==="in-progress"&&(this.paymentState="error",this.updateMessages())})}loaderTemplate(){const e=j.state.themeVariables["--w3m-border-radius-master"],s=e?parseInt(e.replace("px",""),10):4,a=this.getPaymentIcon();return d`
      <wui-flex justifyContent="center" alignItems="center" style="position: relative;">
        ${a?d`<wui-wallet-image size="lg" imageSrc=${a}></wui-wallet-image>`:null}
        <wui-loading-thumbnail radius=${s*9}></wui-loading-thumbnail>
      </wui-flex>
    `}getPaymentIcon(){var s;const e=l.state.currentPayment;if(e){if(e.type==="exchange"){const a=e.exchangeId;if(a){const r=l.getExchangeById(a);return r==null?void 0:r.imageUrl}}if(e.type==="wallet"){const a=(s=g.state.connectedWalletInfo)==null?void 0:s.icon;if(a)return a;const r=m.state.activeChain;if(!r)return;const i=L.getConnectorId(r);if(!i)return;const u=L.getConnectorById(i);return u?K.getConnectorImage(u):void 0}}}successTemplate(){return d`<wui-icon size="xl" color="success-100" name="checkmark"></wui-icon>`}errorTemplate(){return d`<wui-icon size="xl" color="error-100" name="close"></wui-icon>`}};I.styles=oe;S([h()],I.prototype,"loadingMessage",void 0);S([h()],I.prototype,"subMessage",void 0);S([h()],I.prototype,"paymentState",void 0);I=S([Y("w3m-pay-loading-view")],I);async function Ne(n){return l.handleOpenPay(n)}function Pe(){return l.getExchanges()}function _e(){var n;return(n=l.state.currentPayment)==null?void 0:n.result}function xe(){return l.state.error}function Te(){return l.state.isPaymentInProgress}const Se={network:"eip155:8453",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}},Ce={network:"eip155:8453",asset:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",metadata:{name:"USD Coin",symbol:"USDC",decimals:6}},be={network:"eip155:84532",asset:"native",metadata:{name:"Ethereum",symbol:"ETH",decimals:18}};export{I as W3mPayLoadingView,w as W3mPayView,Se as baseETH,be as baseSepoliaETH,Ce as baseUSDC,Pe as getExchanges,Te as getIsPaymentInProgress,xe as getPayError,_e as getPayResult,Ne as openPay};
