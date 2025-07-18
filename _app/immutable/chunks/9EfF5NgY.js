import{i as _,a as N,x as a,r as Y,D as A,ak as h,G as I,R as L,al as z,z as E,A as F,B as W}from"./Dw6aEOe4.js";import{n as l,c as S,o as k,r as v}from"./DUVF8HDt.js";import{T as C,D as U}from"./Dhx9UUmD.js";import"./aH3y_YSS.js";import"./CmkX7J63.js";import"./k3I7VePj.js";var R;(function(r){r.approve="approved",r.bought="bought",r.borrow="borrowed",r.burn="burnt",r.cancel="canceled",r.claim="claimed",r.deploy="deployed",r.deposit="deposited",r.execute="executed",r.mint="minted",r.receive="received",r.repay="repaid",r.send="sent",r.sell="sold",r.stake="staked",r.trade="swapped",r.unstake="unstaked",r.withdraw="withdrawn"})(R||(R={}));const V=_`
  :host > wui-flex {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 40px;
    height: 40px;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-gray-glass-005);
  }

  :host > wui-flex wui-image {
    display: block;
  }

  :host > wui-flex,
  :host > wui-flex wui-image,
  .swap-images-container,
  .swap-images-container.nft,
  wui-image.nft {
    border-top-left-radius: var(--local-left-border-radius);
    border-top-right-radius: var(--local-right-border-radius);
    border-bottom-left-radius: var(--local-left-border-radius);
    border-bottom-right-radius: var(--local-right-border-radius);
  }

  wui-icon {
    width: 20px;
    height: 20px;
  }

  wui-icon-box {
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(20%, 20%);
  }

  .swap-images-container {
    position: relative;
    width: 40px;
    height: 40px;
    overflow: hidden;
  }

  .swap-images-container wui-image:first-child {
    position: absolute;
    width: 40px;
    height: 40px;
    top: 0;
    left: 0%;
    clip-path: inset(0px calc(50% + 2px) 0px 0%);
  }

  .swap-images-container wui-image:last-child {
    clip-path: inset(0px 0px 0px calc(50% + 2px));
  }
`;var m=function(r,t,e,o){var s=arguments.length,i=s<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,e):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,t,e,o);else for(var c=r.length-1;c>=0;c--)(n=r[c])&&(i=(s<3?n(i):s>3?n(t,e,i):n(t,e))||i);return s>3&&i&&Object.defineProperty(t,e,i),i};let g=class extends N{constructor(){super(...arguments),this.images=[],this.secondImage={type:void 0,url:""}}render(){const[t,e]=this.images,o=(t==null?void 0:t.type)==="NFT",s=e!=null&&e.url?e.type==="NFT":o,i=o?"var(--wui-border-radius-xxs)":"var(--wui-border-radius-s)",n=s?"var(--wui-border-radius-xxs)":"var(--wui-border-radius-s)";return this.style.cssText=`
    --local-left-border-radius: ${i};
    --local-right-border-radius: ${n};
    `,a`<wui-flex> ${this.templateVisual()} ${this.templateIcon()} </wui-flex>`}templateVisual(){const[t,e]=this.images,o=t==null?void 0:t.type;return this.images.length===2&&(t!=null&&t.url||e!=null&&e.url)?a`<div class="swap-images-container">
        ${t!=null&&t.url?a`<wui-image src=${t.url} alt="Transaction image"></wui-image>`:null}
        ${e!=null&&e.url?a`<wui-image src=${e.url} alt="Transaction image"></wui-image>`:null}
      </div>`:t!=null&&t.url?a`<wui-image src=${t.url} alt="Transaction image"></wui-image>`:o==="NFT"?a`<wui-icon size="inherit" color="fg-200" name="nftPlaceholder"></wui-icon>`:a`<wui-icon size="inherit" color="fg-200" name="coinPlaceholder"></wui-icon>`}templateIcon(){let t="accent-100",e;return e=this.getIcon(),this.status&&(t=this.getStatusColor()),e?a`
      <wui-icon-box
        size="xxs"
        iconColor=${t}
        backgroundColor=${t}
        background="opaque"
        icon=${e}
        ?border=${!0}
        borderColor="wui-color-bg-125"
      ></wui-icon-box>
    `:null}getDirectionIcon(){switch(this.direction){case"in":return"arrowBottom";case"out":return"arrowTop";default:return}}getIcon(){return this.onlyDirectionIcon?this.getDirectionIcon():this.type==="trade"?"swapHorizontalBold":this.type==="approve"?"checkmark":this.type==="cancel"?"close":this.getDirectionIcon()}getStatusColor(){switch(this.status){case"confirmed":return"success-100";case"failed":return"error-100";case"pending":return"inverse-100";default:return"accent-100"}}};g.styles=[V];m([l()],g.prototype,"type",void 0);m([l()],g.prototype,"status",void 0);m([l()],g.prototype,"direction",void 0);m([l({type:Boolean})],g.prototype,"onlyDirectionIcon",void 0);m([l({type:Array})],g.prototype,"images",void 0);m([l({type:Object})],g.prototype,"secondImage",void 0);g=m([S("wui-transaction-visual")],g);const G=_`
  :host > wui-flex:first-child {
    align-items: center;
    column-gap: var(--wui-spacing-s);
    padding: 6.5px var(--wui-spacing-xs) 6.5px var(--wui-spacing-xs);
    width: 100%;
  }

  :host > wui-flex:first-child wui-text:nth-child(1) {
    text-transform: capitalize;
  }

  wui-transaction-visual {
    width: 40px;
    height: 40px;
  }

  wui-flex {
    flex: 1;
  }

  :host wui-flex wui-flex {
    overflow: hidden;
  }

  :host .description-container wui-text span {
    word-break: break-all;
  }

  :host .description-container wui-text {
    overflow: hidden;
  }

  :host .description-separator-icon {
    margin: 0px 6px;
  }

  :host wui-text > span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
`;var w=function(r,t,e,o){var s=arguments.length,i=s<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,e):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,t,e,o);else for(var c=r.length-1;c>=0;c--)(n=r[c])&&(i=(s<3?n(i):s>3?n(t,e,i):n(t,e))||i);return s>3&&i&&Object.defineProperty(t,e,i),i};let p=class extends N{constructor(){super(...arguments),this.type="approve",this.onlyDirectionIcon=!1,this.images=[],this.price=[],this.amount=[],this.symbol=[]}render(){return a`
      <wui-flex>
        <wui-transaction-visual
          .status=${this.status}
          direction=${k(this.direction)}
          type=${this.type}
          onlyDirectionIcon=${k(this.onlyDirectionIcon)}
          .images=${this.images}
        ></wui-transaction-visual>
        <wui-flex flexDirection="column" gap="3xs">
          <wui-text variant="paragraph-600" color="fg-100">
            ${R[this.type]||this.type}
          </wui-text>
          <wui-flex class="description-container">
            ${this.templateDescription()} ${this.templateSecondDescription()}
          </wui-flex>
        </wui-flex>
        <wui-text variant="micro-700" color="fg-300"><span>${this.date}</span></wui-text>
      </wui-flex>
    `}templateDescription(){var e;const t=(e=this.descriptions)==null?void 0:e[0];return t?a`
          <wui-text variant="small-500" color="fg-200">
            <span>${t}</span>
          </wui-text>
        `:null}templateSecondDescription(){var e;const t=(e=this.descriptions)==null?void 0:e[1];return t?a`
          <wui-icon class="description-separator-icon" size="xxs" name="arrowRight"></wui-icon>
          <wui-text variant="small-400" color="fg-200">
            <span>${t}</span>
          </wui-text>
        `:null}};p.styles=[Y,G];w([l()],p.prototype,"type",void 0);w([l({type:Array})],p.prototype,"descriptions",void 0);w([l()],p.prototype,"date",void 0);w([l({type:Boolean})],p.prototype,"onlyDirectionIcon",void 0);w([l()],p.prototype,"status",void 0);w([l()],p.prototype,"direction",void 0);w([l({type:Array})],p.prototype,"images",void 0);w([l({type:Array})],p.prototype,"price",void 0);w([l({type:Array})],p.prototype,"amount",void 0);w([l({type:Array})],p.prototype,"symbol",void 0);p=w([S("wui-transaction-list-item")],p);const M=_`
  :host {
    min-height: 100%;
  }

  .group-container[last-group='true'] {
    padding-bottom: var(--wui-spacing-m);
  }

  .contentContainer {
    height: 280px;
  }

  .contentContainer > wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-xxs);
  }

  .contentContainer > .textContent {
    width: 65%;
  }

  .emptyContainer {
    height: 100%;
  }
`;var x=function(r,t,e,o){var s=arguments.length,i=s<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,e):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,t,e,o);else for(var c=r.length-1;c>=0;c--)(n=r[c])&&(i=(s<3?n(i):s>3?n(t,e,i):n(t,e))||i);return s>3&&i&&Object.defineProperty(t,e,i),i};const D="last-transaction",P=7;let f=class extends N{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.page="activity",this.caipAddress=A.state.activeCaipAddress,this.transactionsByYear=h.state.transactionsByYear,this.loading=h.state.loading,this.empty=h.state.empty,this.next=h.state.next,h.clearCursor(),this.unsubscribe.push(A.subscribeKey("activeCaipAddress",t=>{t&&this.caipAddress!==t&&(h.resetTransactions(),h.fetchTransactions(t)),this.caipAddress=t}),A.subscribeKey("activeCaipNetwork",()=>{this.updateTransactionView()}),h.subscribe(t=>{this.transactionsByYear=t.transactionsByYear,this.loading=t.loading,this.empty=t.empty,this.next=t.next}))}firstUpdated(){this.updateTransactionView(),this.createPaginationObserver()}updated(){this.setPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return a` ${this.empty?null:this.templateTransactionsByYear()}
    ${this.loading?this.templateLoading():null}
    ${!this.loading&&this.empty?this.templateEmpty():null}`}updateTransactionView(){h.resetTransactions(),this.caipAddress&&h.fetchTransactions(I.getPlainAddress(this.caipAddress))}templateTransactionsByYear(){return Object.keys(this.transactionsByYear).sort().reverse().map(e=>{const o=parseInt(e,10),s=new Array(12).fill(null).map((i,n)=>{var u;const c=C.getTransactionGroupTitle(o,n),d=(u=this.transactionsByYear[o])==null?void 0:u[n];return{groupTitle:c,transactions:d}}).filter(({transactions:i})=>i).reverse();return s.map(({groupTitle:i,transactions:n},c)=>{const d=c===s.length-1;return n?a`
          <wui-flex
            flexDirection="column"
            class="group-container"
            last-group="${d?"true":"false"}"
            data-testid="month-indexes"
          >
            <wui-flex
              alignItems="center"
              flexDirection="row"
              .padding=${["xs","s","s","s"]}
            >
              <wui-text variant="paragraph-500" color="fg-200" data-testid="group-title"
                >${i}</wui-text
              >
            </wui-flex>
            <wui-flex flexDirection="column" gap="xs">
              ${this.templateTransactions(n,d)}
            </wui-flex>
          </wui-flex>
        `:null})})}templateRenderTransaction(t,e){const{date:o,descriptions:s,direction:i,isAllNFT:n,images:c,status:d,transfers:u,type:y}=this.getTransactionListItemProps(t),b=(u==null?void 0:u.length)>1;return(u==null?void 0:u.length)===2&&!n?a`
        <wui-transaction-list-item
          date=${o}
          .direction=${i}
          id=${e&&this.next?D:""}
          status=${d}
          type=${y}
          .images=${c}
          .descriptions=${s}
        ></wui-transaction-list-item>
      `:b?u.map(($,j)=>{const B=C.getTransferDescription($),T=e&&j===u.length-1;return a` <wui-transaction-list-item
          date=${o}
          direction=${$.direction}
          id=${T&&this.next?D:""}
          status=${d}
          type=${y}
          .onlyDirectionIcon=${!0}
          .images=${[c[j]]}
          .descriptions=${[B]}
        ></wui-transaction-list-item>`}):a`
      <wui-transaction-list-item
        date=${o}
        .direction=${i}
        id=${e&&this.next?D:""}
        status=${d}
        type=${y}
        .images=${c}
        .descriptions=${s}
      ></wui-transaction-list-item>
    `}templateTransactions(t,e){return t.map((o,s)=>{const i=e&&s===t.length-1;return a`${this.templateRenderTransaction(o,i)}`})}emptyStateActivity(){return a`<wui-flex
      class="emptyContainer"
      flexGrow="1"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      .padding=${["3xl","xl","3xl","xl"]}
      gap="xl"
      data-testid="empty-activity-state"
    >
      <wui-icon-box
        backgroundColor="gray-glass-005"
        background="gray"
        iconColor="fg-200"
        icon="wallet"
        size="lg"
        ?border=${!0}
        borderColor="wui-color-bg-125"
      ></wui-icon-box>
      <wui-flex flexDirection="column" alignItems="center" gap="xs">
        <wui-text align="center" variant="paragraph-500" color="fg-100"
          >No Transactions yet</wui-text
        >
        <wui-text align="center" variant="small-500" color="fg-200"
          >Start trading on dApps <br />
          to grow your wallet!</wui-text
        >
      </wui-flex>
    </wui-flex>`}emptyStateAccount(){return a`<wui-flex
      class="contentContainer"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap="l"
      data-testid="empty-account-state"
    >
      <wui-icon-box
        icon="swapHorizontal"
        size="inherit"
        iconColor="fg-200"
        backgroundColor="fg-200"
        iconSize="lg"
      ></wui-icon-box>
      <wui-flex
        class="textContent"
        gap="xs"
        flexDirection="column"
        justifyContent="center"
        flexDirection="column"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100">No activity yet</wui-text>
        <wui-text variant="small-400" align="center" color="fg-200"
          >Your next transactions will appear here</wui-text
        >
      </wui-flex>
      <wui-link @click=${this.onReceiveClick.bind(this)}>Trade</wui-link>
    </wui-flex>`}templateEmpty(){return this.page==="account"?a`${this.emptyStateAccount()}`:a`${this.emptyStateActivity()}`}templateLoading(){return this.page==="activity"?Array(P).fill(a` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `).map(t=>t):null}onReceiveClick(){L.push("WalletReceive")}createPaginationObserver(){const{projectId:t}=z.state;this.paginationObserver=new IntersectionObserver(([e])=>{e!=null&&e.isIntersecting&&!this.loading&&(h.fetchTransactions(I.getPlainAddress(this.caipAddress)),E.sendEvent({type:"track",event:"LOAD_MORE_TRANSACTIONS",properties:{address:I.getPlainAddress(this.caipAddress),projectId:t,cursor:this.next,isSmartAccount:F(A.state.activeChain)===W.ACCOUNT_TYPES.SMART_ACCOUNT}}))},{}),this.setPaginationObserver()}setPaginationObserver(){var e,o,s;(e=this.paginationObserver)==null||e.disconnect();const t=(o=this.shadowRoot)==null?void 0:o.querySelector(`#${D}`);t&&((s=this.paginationObserver)==null||s.observe(t))}getTransactionListItemProps(t){var d,u,y,b,O;const e=U.formatDate((d=t==null?void 0:t.metadata)==null?void 0:d.minedAt),o=C.getTransactionDescriptions(t),s=t==null?void 0:t.transfers,i=(u=t==null?void 0:t.transfers)==null?void 0:u[0],n=!!i&&((y=t==null?void 0:t.transfers)==null?void 0:y.every($=>!!$.nft_info)),c=C.getTransactionImages(s);return{date:e,direction:i==null?void 0:i.direction,descriptions:o,isAllNFT:n,images:c,status:(b=t.metadata)==null?void 0:b.status,transfers:s,type:(O=t.metadata)==null?void 0:O.operationType}}};f.styles=M;x([l()],f.prototype,"page",void 0);x([v()],f.prototype,"caipAddress",void 0);x([v()],f.prototype,"transactionsByYear",void 0);x([v()],f.prototype,"loading",void 0);x([v()],f.prototype,"empty",void 0);x([v()],f.prototype,"next",void 0);f=x([S("w3m-activity-list")],f);
