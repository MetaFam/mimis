import{i as u,r as p,e as b,d as f,a as h,x as w}from"./WRHwwoH-.js";import{n as c,c as m}from"./Dr37uUxP.js";const v=u`
  button {
    border-radius: var(--local-border-radius);
    color: var(--wui-color-fg-100);
    padding: var(--local-padding);
  }

  @media (max-width: 700px) {
    :host(:not([size='sm'])) button {
      padding: var(--wui-spacing-s);
    }
  }

  button > wui-icon {
    pointer-events: none;
  }

  button:disabled > wui-icon {
    color: var(--wui-color-bg-300) !important;
  }

  button:disabled {
    background-color: transparent;
  }
`;var s=function(r,i,e,n){var a=arguments.length,o=a<3?i:n===null?n=Object.getOwnPropertyDescriptor(i,e):n,d;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(r,i,e,n);else for(var l=r.length-1;l>=0;l--)(d=r[l])&&(o=(a<3?d(o):a>3?d(i,e,o):d(i,e))||o);return a>3&&o&&Object.defineProperty(i,e,o),o};let t=class extends h{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="inherit"}render(){this.dataset.size=this.size;let i="",e="";switch(this.size){case"lg":i="--wui-border-radius-xs",e="--wui-spacing-1xs";break;case"sm":i="--wui-border-radius-3xs",e="--wui-spacing-xxs";break;default:i="--wui-border-radius-xxs",e="--wui-spacing-2xs";break}return this.style.cssText=`
    --local-border-radius: var(${i});
    --local-padding: var(${e});
    `,w`
      <button ?disabled=${this.disabled}>
        <wui-icon color=${this.iconColor} size=${this.size} name=${this.icon}></wui-icon>
      </button>
    `}};t.styles=[p,b,f,v];s([c()],t.prototype,"size",void 0);s([c({type:Boolean})],t.prototype,"disabled",void 0);s([c()],t.prototype,"icon",void 0);s([c()],t.prototype,"iconColor",void 0);t=s([m("wui-icon-link")],t);
