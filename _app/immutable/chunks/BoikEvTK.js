import{cP as u,cQ as p,cS as m,cT as c}from"./DgjbO070.js";import{n as s,c as f}from"./BvzJc2UN.js";import"./BVMZgy6Y.js";import"./D_llTcOA.js";const w=u`
  :host {
    position: relative;
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-image='true']) {
    background-color: transparent;
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-size='sm']) {
    width: 32px;
    height: 32px;
  }

  :host([data-size='md']) {
    width: 40px;
    height: 40px;
  }

  :host([data-size='lg']) {
    width: 56px;
    height: 56px;
  }

  :host([name='Extension'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid ${({colors:e})=>e.accent010};
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 32px;
    height: 32px;
  }

  wui-icon[data-parent-size='md'] {
    width: 40px;
    height: 40px;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid ${({tokens:e})=>e.theme.backgroundPrimary};
    padding: 1px;
  }
`;var r=function(e,t,o,n){var l=arguments.length,a=l<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,o):n,d;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(e,t,o,n);else for(var h=e.length-1;h>=0;h--)(d=e[h])&&(a=(l<3?d(a):l>3?d(t,o,a):d(t,o))||a);return l>3&&a&&Object.defineProperty(t,o,a),a};let i=class extends m{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let t="1";return this.size==="lg"?t="4":this.size==="md"?t="2":this.size==="sm"&&(t="1"),this.style.cssText=`
       --local-border-radius: var(--apkt-borderRadius-${t});
   `,this.dataset.size=this.size,this.imageSrc&&(this.dataset.image="true"),this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),c`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?c`<wui-icon size="md" color="default" name=${this.walletIcon}></wui-icon>`:c`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="wallet"
    ></wui-icon>`}};i.styles=[p,w];r([s()],i.prototype,"size",void 0);r([s()],i.prototype,"name",void 0);r([s()],i.prototype,"imageSrc",void 0);r([s()],i.prototype,"walletIcon",void 0);r([s({type:Boolean})],i.prototype,"installed",void 0);r([s()],i.prototype,"badgeSize",void 0);i=r([f("wui-wallet-image")],i);
