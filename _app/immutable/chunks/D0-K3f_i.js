import{E as o}from"./CetwRb33.js";import{e as n,f as c}from"./DpgXNEDH.js";/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const a=()=>new r;class r{}const e=new WeakMap,G=n(class extends c{render(t){return o}update(t,[i]){var h;const s=i!==this.G;return s&&this.G!==void 0&&this.rt(void 0),(s||this.lt!==this.ct)&&(this.G=i,this.ht=(h=t.options)==null?void 0:h.host,this.rt(this.ct=t.element)),o}rt(t){if(this.isConnected||(t=void 0),typeof this.G=="function"){const i=this.ht??globalThis;let s=e.get(i);s===void 0&&(s=new WeakMap,e.set(i,s)),s.get(this.G)!==void 0&&this.G.call(this.ht,void 0),s.set(this.G,t),t!==void 0&&this.G.call(this.ht,t)}else this.G.value=t}get lt(){var t,i;return typeof this.G=="function"?(t=e.get(this.ht??globalThis))==null?void 0:t.get(this.G):(i=this.G)==null?void 0:i.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});export{a as e,G as n};
