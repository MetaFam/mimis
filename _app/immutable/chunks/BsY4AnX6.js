import{cW as f,cS as a,cT as d}from"./DgjbO070.js";import{c as u}from"./BvzJc2UN.js";import"./9RPqwTfQ.js";const w=f`
  :host > wui-flex:first-child {
    height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  :host > wui-flex:first-child::-webkit-scrollbar {
    display: none;
  }
`;var m=function(n,t,i,o){var r=arguments.length,e=r<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,i):o,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")e=Reflect.decorate(n,t,i,o);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(e=(r<3?l(e):r>3?l(t,i,e):l(t,i))||e);return r>3&&e&&Object.defineProperty(t,i,e),e};let s=class extends a{render(){return d`
      <wui-flex flexDirection="column" .padding=${["0","3","3","3"]} gap="3">
        <w3m-activity-list page="activity"></w3m-activity-list>
      </wui-flex>
    `}};s.styles=w;s=m([u("w3m-transactions-view")],s);export{s as W3mTransactionsView};
