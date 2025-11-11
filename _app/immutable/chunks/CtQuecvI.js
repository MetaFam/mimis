import{cP as p,cQ as d,cS as f,cT as l}from"./DgjbO070.js";import{n as m,c as h}from"./BvzJc2UN.js";const x=p`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: ${({tokens:e})=>e.theme.borderPrimary};
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 8px;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }
`;var u=function(e,r,o,n){var i=arguments.length,t=i<3?r:n===null?n=Object.getOwnPropertyDescriptor(r,o):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(e,r,o,n);else for(var s=e.length-1;s>=0;s--)(a=e[s])&&(t=(i<3?a(t):i>3?a(r,o,t):a(r,o))||t);return i>3&&t&&Object.defineProperty(r,o,t),t};let c=class extends f{constructor(){super(...arguments),this.text=""}render(){return l`${this.template()}`}template(){return this.text?l`<wui-text variant="md-regular" color="secondary">${this.text}</wui-text>`:null}};c.styles=[d,x];u([m()],c.prototype,"text",void 0);c=u([h("wui-separator")],c);
