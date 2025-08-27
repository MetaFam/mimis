import"../chunks/CWj6FrbW.js";import{o as Ie}from"../chunks/C36IRxIb.js";import{w as xe,C as Ae,n as $,G as Re,aM as ae,J as ke,K as Ce,D as Se,L as se,a9 as re,U as K,W as ie,V as oe,P as Q,v as we,M as Le,aN as ne,aO as le,aP as ce,e as He,Z as fe,_ as Y,au as Pe,p as De,al as ue,aj as Me,g as Oe,f as d,b as u,c as je,ai as $e,k as a,ak as me,d as m,ah as de,r,s as H,aQ as Ue,a as pe,aL as Z,t as J}from"../chunks/DT345vJT.js";import{d as Be,b as We,e as Fe,s as U}from"../chunks/CQsOHSfA.js";import{i as V}from"../chunks/BI-RejmI.js";import{e as ve,i as he}from"../chunks/wtRIEkiG.js";import{h as ze}from"../chunks/CIVYj_3Q.js";import{s as P}from"../chunks/DFqy6DhR.js";import{T as qe}from"../chunks/izcudvy4.js";import{p as B}from"../chunks/DDDzjR65.js";import{g as Ge}from"../chunks/BtRcn-ld.js";import{s as ge}from"../chunks/Bclqp6kc.js";import{t as _e}from"../chunks/B4-6h78h.js";const X=0,W=1,ee=2;function Ke(p,v,s,S,_){$&&Re();var i=p,g=xe(),y=He,o=re,n,l,w,I=g?ie(void 0):oe(void 0,!1,!1),D=g?ie(void 0):oe(void 0,!1,!1),x=!1;function A(t,c){x=!0,c&&(ne(e),le(e),ce(y));try{t===X&&s&&(n?fe(n):n=Q(()=>s(i))),t===W&&S&&(l?fe(l):l=Q(()=>S(i,I))),t!==X&&n&&Y(n,()=>n=null),t!==W&&l&&Y(l,()=>l=null),t!==ee&&w&&Y(w,()=>w=null)}finally{c&&(ce(null),le(null),ne(null),Pe())}}var e=Ae(()=>{if(o===(o=v()))return;let t=$&&ae(o)===(i.data===ke);if(t&&(i=Ce(),Se(i),se(!1),t=!0),ae(o)){var c=o;x=!1,c.then(b=>{c===o&&(K(I,b),A(W,!0))},b=>{if(c===o)throw K(D,b),A(ee,!0),D.v}),$?s&&(n=Q(()=>s(i))):we(()=>{x||A(X,!0)})}else K(I,o),A(W,!1);return t&&se(!0),()=>o=re});$&&(i=Le)}const Qe=async({path:p,limit:v=200,offset:s=0})=>{const _=Ge().session();try{p=p.filter(y=>y.trim()!==""),v=parseInt(Number(v).toFixed(0)),s=parseInt(Number(s).toFixed(0));const i=p.length===0?`
        MATCH (start:Root)-[next:CONTAINS]->(child)
        RETURN [] as path, next, child
      `:`
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS|EQUALS*]->(end)
        WITH pathElems, path, end,
            [
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
        CALL (end) {
          MATCH (end)-[next:CONTAINS]->(child)
            RETURN next, child
          UNION DISTINCT
          MATCH (end)-[:REPRESENTED_BY]->(mediate)-[next:EMBODIED_AS]->(child)
            RETURN next, child
        }
        RETURN DISTINCT
          elements AS path,
          elementId(end) as id,
          next,
          child
        SKIP $offset
        LIMIT $limit
      `,{records:g}=await _.run(i,{elems:p,limit:BigInt(v||ge.limit),offset:BigInt(s)});return console.debug({query:i,records:g}),g}finally{await _.close()}};var Ye=d('<link rel="icon" href="infinity%20eyes.svg"/>'),Ze=d('<li class="svelte-1f7r4e4"> <a class="button svelte-1f7r4e4"><span>⨯</span></a></li>'),Je=d('<ul id="path" class="svelte-1f7r4e4"></ul>'),Ve=d('<h2 class="svelte-1f7r4e4">No Results</h2>'),Xe=d('<h2 class="svelte-1f7r4e4"> </h2> <object class="svelte-1f7r4e4"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(p,v,s)=>{v(a(s).chip)},tt=d('<a class="button"><span> </span></a>'),at=d('<li class="svelte-1f7r4e4"><!></li>'),st=d('<ul id="result" class="svelte-1f7r4e4"></ul>'),rt=d('<h2 class="svelte-1f7r4e4">Searching…</h2>'),it=d('<main class="svelte-1f7r4e4"><form class="svelte-1f7r4e4"><input id="chip" placeholder="Path Element" class="svelte-1f7r4e4"/> <button><span>Add Path Element</span></button></form> <!> <section id="result" class="svelte-1f7r4e4"><!></section></main>');function Et(p,v){De(v,!0);let s=ue(Me([])),S=Z(async()=>{try{const e=B.url.searchParams.get("limit"),t=B.url.searchParams.get("offset");return Qe({path:a(s),limit:e?Number(e):ge.limit,offset:Number(t)})}catch(e){qe({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=ue("");Ie(()=>{me(s,B.params.path.split("/").filter(Boolean),!0);const e=B.url.hash.split("/").filter(Boolean);me(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const i=e=>{e.preventDefault();const t=e.target.elements.chip;g(t.value),t.value=""},g=e=>{e=e.trim(),e&&a(s).push(e)},y=e=>{a(s).splice(e,1)},o=()=>{y(-1)};Oe(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&o()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var n=it();ze(e=>{var t=Ye();$e.title="Mïmis: Search",u(e,t)});var l=m(n),w=m(l);We(w),de(2),r(l);var I=H(l,2);{var D=e=>{var t=Je();ve(t,21,()=>a(s),he,(c,b,M)=>{var L=Ze(),h=m(L),E=H(h);E.__click=()=>y(M),r(L),J(F=>{U(h,`${a(b)??""} `),P(E,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(M,1).join("/")}`]),u(c,L)}),r(t),u(e,t)};V(I,e=>{a(s).length>0&&e(D)})}var x=H(I,2),A=m(x);Ke(A,()=>a(S),e=>{var t=rt();u(e,t)},(e,t)=>{var c=Ue(),b=pe(c);{var M=h=>{var E=Ve();u(h,E)},L=h=>{var E=st();ve(E,21,()=>a(t),he,(F,O)=>{var z=at(),Ee=m(z);{var Te=R=>{var f=Xe();const N=Z(()=>{var j;const{cid:C}=(j=a(O).get("child"))==null?void 0:j.properties;return{cid:C}});var k=pe(f),q=m(k);r(k);var T=H(k,2),te=m(T),G=H(m(te)),Ne=m(G);r(G),de(),r(te),r(T),J((C,j,ye)=>{U(q,`/${C??""}`),P(T,"data",j),P(T,"title",`ipfs://${a(N).cid}`),P(G,"href",ye),U(Ne,`ipfs://${a(N).cid??""}`)},[()=>{var C;return(C=a(O).get("path"))==null?void 0:C.join("/")},()=>_e({cid:a(N).cid}),()=>_e({cid:a(N).cid})]),u(R,f)},be=R=>{var f=tt();const N=Z(()=>{const{path:T}=a(O).get("next").properties;return{chip:T}});f.__click=[et,g,N];var k=m(f),q=m(k,!0);r(k),r(f),J(T=>{P(f,"href",T),U(q,a(N).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),u(R,f)};V(Ee,R=>{var f;(f=a(O).get("child"))!=null&&f.labels.includes("File")?R(Te):R(be,!1)})}r(z),u(F,z)}),r(E),u(h,E)};V(b,h=>{!a(t)||a(t).length===0?h(M):h(L,!1)})}u(e,c)}),r(x),r(n),Fe("submit",l,i),u(p,n),je()}Be(["click"]);export{Et as component};
