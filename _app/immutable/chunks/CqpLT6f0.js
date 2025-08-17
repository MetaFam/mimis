import{i as p,a as u,R as f,M as b,x as d}from"./BJKK_szU.js";import{n as g,r as m,c as M}from"./Cmc3lMyn.js";import{T as l}from"./CeVXm1rR.js";const x={interpolate(i,e,o){if(i.length!==2||e.length!==2)throw new Error("inputRange and outputRange must be an array of length 2");const n=i[0]||0,r=i[1]||0,t=e[0]||0,s=e[1]||0;return o<n?t:o>r?s:(s-t)/(r-n)*(o-n)+t}},v=p`
  :host {
    width: 100%;
    display: block;
  }
`;var a=function(i,e,o,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,o):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(i,e,o,n);else for(var c=i.length-1;c>=0;c--)(s=i[c])&&(t=(r<3?s(t):r>3?s(e,o,t):s(e,o))||t);return r>3&&t&&Object.defineProperty(e,o,t),t};let h=class extends u{constructor(){super(),this.unsubscribe=[],this.text="",this.open=l.state.open,this.unsubscribe.push(f.subscribeKey("view",()=>{l.hide()}),b.subscribeKey("open",e=>{e||l.hide()}),l.subscribeKey("open",e=>{this.open=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),l.hide()}render(){return d`
      <div
        @pointermove=${this.onMouseEnter.bind(this)}
        @pointerleave=${this.onMouseLeave.bind(this)}
      >
        ${this.renderChildren()}
      </div>
    `}renderChildren(){return d`<slot></slot> `}onMouseEnter(){const e=this.getBoundingClientRect();this.open||l.showTooltip({message:this.text,triggerRect:{width:e.width,height:e.height,left:e.left,top:e.top},variant:"shade"})}onMouseLeave(e){this.contains(e.relatedTarget)||l.hide()}};h.styles=[v];a([g()],h.prototype,"text",void 0);a([m()],h.prototype,"open",void 0);h=a([M("w3m-tooltip-trigger")],h);export{x as M};
