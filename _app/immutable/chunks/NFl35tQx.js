var N=Object.defineProperty;var R=e=>{throw TypeError(e)};var S=(e,t,s)=>t in e?N(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var h=(e,t,s)=>S(e,typeof t!="symbol"?t+"":t,s),T=(e,t,s)=>t.has(e)||R("Cannot "+s);var m=(e,t,s)=>(T(e,t,"read from private field"),s?s.call(e):t.get(e)),p=(e,t,s)=>t.has(e)?R("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,s),g=(e,t,s,r)=>(T(e,t,"write to private field"),r?r.call(e,s):t.set(e,s),s);import{d as W,b as H,e as A,f as C,g as M,c as z,h as B}from"./tjeNqwSm.js";import{g as y}from"./n2082k40.js";import{l as U}from"./8HslT92O.js";const x=W,F=({writer:e,settings:t=x(),metadata:s={}})=>new O({writer:e,metadata:s,settings:t,entries:new Map,closed:!1}),P=(e,t,s,{overwrite:r=!1}={})=>{const i=I(e.state);if(t.includes("/"))throw new Error(`Directory entry name "${t}" contains forbidden "/" character`);if(!r&&i.entries.has(t))throw new Error(`Directory already contains entry with name "${t}"`);return i.entries.set(t,s),e},G=(e,t)=>(I(e.state).entries.delete(t),e),I=e=>{if(e.closed)throw new Error("Can not change written directory, but you can .fork() and make changes to it");return e},K=async(e,{closeWriter:t=!1,releaseLock:s=!1}={})=>{const{writer:r,settings:i,metadata:u}=I(e.state);e.state.closed=!0;const l=[...j(e)],f=H(l,u),n=A(f),d=await i.hasher.digest(n),o=i.linker.createLink(C,d);return(r.desiredSize||0)<=0&&await r.ready,r.write({cid:o,bytes:n}),t?await r.close():s&&r.releaseLock(),{cid:o,dagByteLength:M(n,l)}},j=function*({state:e}){for(const[t,{dagByteLength:s,cid:r}]of e.entries)yield{name:t,dagByteLength:s,cid:r}},Q=({state:e},{writer:t=e.writer,metadata:s=e.metadata,settings:r=e.settings}={})=>new O({writer:t,metadata:s,settings:r,entries:new Map(e.entries.entries()),closed:!1});class O{constructor(t){this.state=t}get writer(){return this.state.writer}get settings(){return this.state.settings}links(){return j(this)}set(t,s,r){return P(this,t,s,r)}remove(t){return G(this,t)}fork(t){return Q(this,t)}close(t){return K(this,t)}entries(){return this.state.entries.entries()}has(t){return this.state.entries.has(t)}get size(){return this.state.entries.size}}const rt=({writable:e,settings:t=W()})=>new Y({writer:e.getWriter(),settings:t}),V=async(e,{releaseLock:t=!0,closeWriter:s=!0}={})=>(s?await e.writer.close():t&&e.writer.releaseLock(),e);class Y{constructor({writer:t,settings:s}){this.writer=t,this.settings=z(s)}createFileWriter({settings:t=this.settings,metadata:s}={}){return B({writer:this.writer,settings:t,metadata:s})}createDirectoryWriter({settings:t=this.settings,metadata:s}={}){return F({writer:this.writer,settings:t,metadata:s})}close(t){return V(this,t)}}const Z=1048576,q=Z*100,it=(e=q)=>({highWaterMark:e,size:t=>t.bytes.length});class J extends Error{}function nt({condition:e=()=>!0,branch:t={if:()=>{},else:()=>{}}}){return()=>{var s,r;return e!=null&&e()?(s=t==null?void 0:t.if)==null?void 0:s.call(t):(r=t==null?void 0:t.else)==null?void 0:r.call(t)}}const X=e=>e.map(k),b=e=>X(e)[0],k=e=>Object.fromEntries(e.keys.map(t=>[t,e.get(t)]));let v=0;const ot=e=>e.map((t,s)=>({id:++v,...t}));var E,c;const a=class a{constructor(t){h(this,"point",this);h(this,"neo4j",null);p(this,E,null);g(this,E,t)}static get root(){return m(this,c)||g(this,c,this.get.root().then(t=>g(this,c,t))),m(this,c)}};E=new WeakMap,c=new WeakMap,p(a,c,null),h(a,"gen",{child:t=>{const s=a.create({path:t??"∅/sys/points/new/"});if(!Array.isArray(s))throw new Error(`\`this.create()\` didn’t return an \`Array\` (${typeof s}).`);if(s.length!==1)throw new Error(`\`this.create()\` returned ${s.length} points.`);if(s.length===1)return s[0]}}),h(a,"create",async({path:t,sep:s="/"})=>{const r=y();if(!r)throw new Error("`neo4j` is unset.");const i=r.session();typeof t=="string"&&(t=t.split(s));let u=await a.get.root();for(const l in t){const f=`
        MERGE (current)-[:CONTAINS { path: $elem }]->(new:Nöopoint)
        WHERE elementId(current) = $current
        RETURN elementId(new)
      `,{records:n}=await i.run(f,{current:u,elem:l});if(n.length!=1)throw new Error(`${n.length} records returned.`);u=n[0].get("id")}}),h(a,"get",{root:async()=>{const t=y();if(!t)throw new Error("`neo4j` is unset.");const s=t.session();try{const r=`
          MERGE (root:Root)
          RETURN elementId(root)
        `,{records:i}=await s.run(r);if(i.length!=1)throw new Error(`${i.length} records returned.`);return k(i[0])}finally{s.close(),t.close()}},children:async(t,{offset:s=0,limit:r,onlyCurrent:i=!1,sep:u="/",parent:l}={})=>{const f=y(),n=f.session();try{typeof t=="string"&&(t=t.split(u).filter(Boolean));let d=!1;for(;!d;)try{let o=l==null?void 0:l.id;o==null&&(d=!0,o=a.root);const w={limit:r!=null?Number(r):0,offset:Number(s)},D=`
              WITH $elems as pathElems
              MATCH path = (start)-[:CONTAINS*]->(terminal)
              WHERE elementId(start) = $rootId
              MATCH (terminal)-[:REPRESENTED_BY]->(point)
              ${i?"WHERE NOT ()-[:PREVIOUS]->(point)":""}
              WITH pathElems, path, terminal, point, [
                rel in relationships(path)
                WHERE NOT isEmpty(rel.path)
                | rel.path
              ] as elements
              WHERE size(elements) = size(pathElems)
              AND ALL(
                i IN range(0, size(pathElems) - 1)
                WHERE (
                  pathElems[i] = '*'
                  OR elements[i] = pathElems[i]
                )
              )
              ${w.limit>0?`LIMIT ${w.offset+w.limit}`:""}
              SKIP ${w.offset}
              RETURN DISTINCT
                elements as path,
                terminal as pathEnd,
                point as nöopoint
            `,{records:L}=await n.run(D,{elems:t,rootId:o});return b(L)}catch(o){if(!(o instanceof J))throw o;d=!1}}finally{await n.close(),await f.close()}},partial:async t=>{const s=y(),r=s.session();try{}finally{await r.close(),await s.close()}}});let $=a;const at=(e=new Date)=>e.toISOString().slice(0,19).replace("T","@").replace(/-/g,"⁄");function lt(e){return function(s){if(console.debug({msg:s}),typeof s!="string")try{s=U.stringify(s,null,2)}catch(r){s=`Error: ${r.message}`}e.unshift(s)}}export{$ as N,nt as a,G as b,rt as c,F as d,ot as i,lt as l,b as r,P as s,at as t,it as w};
