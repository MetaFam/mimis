import{i as u,r as b,e as p,a as f,x as v}from"./BsreV6Dk.js";import{n as d,c as m,o as x}from"./8Hiw-s1E.js";const g=u`
  button {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
    border-radius: var(--wui-border-radius-3xs);
    background-color: transparent;
    color: var(--wui-color-accent-100);
  }

  button:disabled {
    background-color: transparent;
    color: var(--wui-color-gray-glass-015);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var l=function(n,o,r,i){var s=arguments.length,t=s<3?o:i===null?i=Object.getOwnPropertyDescriptor(o,r):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(n,o,r,i);else for(var c=n.length-1;c>=0;c--)(a=n[c])&&(t=(s<3?a(t):s>3?a(o,r,t):a(o,r))||t);return s>3&&t&&Object.defineProperty(o,r,t),t};let e=class extends f{constructor(){super(...arguments),this.tabIdx=void 0,this.disabled=!1,this.color="inherit"}render(){return v`
      <button ?disabled=${this.disabled} tabindex=${x(this.tabIdx)}>
        <slot name="iconLeft"></slot>
        <wui-text variant="small-600" color=${this.color}>
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}};e.styles=[b,p,g];l([d()],e.prototype,"tabIdx",void 0);l([d({type:Boolean})],e.prototype,"disabled",void 0);l([d()],e.prototype,"color",void 0);e=l([m("wui-link")],e);
