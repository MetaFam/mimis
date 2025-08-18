import{i as h,r as c,a as l,x as f}from"./C_tEtCOc.js";import{n as m,c as p}from"./CnLVzxgI.js";const v=h`
  :host {
    display: block;
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  svg {
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  rect {
    fill: none;
    stroke: var(--wui-color-accent-100);
    stroke-width: 4px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var u=function(o,t,s,r){var i=arguments.length,e=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,s):r,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(o,t,s,r);else for(var d=o.length-1;d>=0;d--)(a=o[d])&&(e=(i<3?a(e):i>3?a(t,s,e):a(t,s))||e);return i>3&&e&&Object.defineProperty(t,s,e),e};let n=class extends l{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const t=this.radius>50?50:this.radius,r=36-t,i=116+r,e=245+r,a=360+r*1.75;return f`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${t}
          stroke-dasharray="${i} ${e}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};n.styles=[c,v];u([m({type:Number})],n.prototype,"radius",void 0);n=u([p("wui-loading-thumbnail")],n);
