import{l as g}from"./8HslT92O.js";import{g as f}from"./M1RXKuGZ.js";import{p as w}from"./BdZBV5Ue.js";class y extends Error{}function O({condition:r=()=>!0,branch:t={if:()=>{},else:()=>{}}}){return(()=>r?.()?t?.if?.():t?.else?.())}const R=r=>r.map(u),N=r=>R(r)[0],u=r=>Object.fromEntries(r.keys.map(t=>[t,r.get(t)]));let T=0;const H=r=>r.map((t,e)=>({id:++T,...t}));class E{point=this;neo4j=null;#e=null;static#t=null;constructor(t){this.#e=t}static get root(){return this.#t||(this.#t=this.get.root().then(t=>this.#t=t)),this.#t}static gen={child:t=>{const e=this.create({path:t??"∅/sys/points/new/"});if(!Array.isArray(e))throw new Error(`\`this.create()\` didn’t return an \`Array\` (${typeof e}).`);if(e.length!==1)throw new Error(`\`this.create()\` returned ${e.length} points.`);if(e.length===1)return e[0]}};static create=async({path:t,sep:e="/"})=>{const s=f();if(!s)throw new Error("`neo4j` is unset.");const n=s.session();typeof t=="string"&&(t=t.split(e));let a=await this.get.root();for(const h in t){const l=`
        MERGE (current)-[:CONTAINS { path: $elem }]->(new:Nöopoint)
        WHERE current.mïmid = $current
        RETURN new.mïmid
      `,{records:o}=await n.run(l,{current:a,elem:h});if(o.length!=1)throw new Error(`${o.length} records returned.`);a=o[0].get("id")}};static get={root:async()=>{const t=f();if(!t)throw new Error("`neo4j` is unset.");const e=t.session();try{const s=`
          MERGE (root:Root)
          RETURN root.mïmid
        `,{records:n}=await e.run(s);if(n.length!=1)throw new Error(`${n.length} records returned.`);return u(n[0])}finally{e.close(),t.close()}},children:async(t,{offset:e=0,limit:s,onlyCurrent:n=!1,sep:a="/",parent:h}={})=>{const l=f(),o=l.session();try{typeof t=="string"&&(t=t.split(a).filter(Boolean));let p=!1;for(;!p;)try{let i=h?.id;i==null&&(p=!0,i=E.root);const c={limit:s!=null?Number(s):0,offset:Number(e)},m=`
              WITH $elems as pathElems
              MATCH path = (start)-[:CONTAINS*]->(terminal)
              WHERE start.mïmid = $rootId
              MATCH (terminal)-[:REPRESENTED_BY]->(point)
              ${n?"WHERE NOT ()-[:PREVIOUS]->(point)":""}
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
              ${c.limit>0?`LIMIT ${c.offset+c.limit}`:""}
              SKIP ${c.offset}
              RETURN DISTINCT
                elements as path,
                terminal as pathEnd,
                point as nöopoint
            `,{records:d}=await o.run(m,{elems:t,rootId:i});return N(d)}catch(i){if(!(i instanceof y))throw i;p=!1}}finally{await o.close(),await l.close()}},partial:async t=>{const e=f();await e.session().close(),await e.close()}}}const A=(r=new Date)=>r.toISOString().slice(0,19).replace("T","@").replace(/-/g,"⁄");function S(r){return function(e){if(console.debug({msg:e}),typeof e!="string")try{e=g.stringify(e,null,2)}catch(s){e=`Error: ${s.message}`}r.unshift(e)}}class W{static for(t){return t}static get path(){return w.url.pathname}}export{W as L,E as N,O as a,H as i,S as l,N as r,A as t};
