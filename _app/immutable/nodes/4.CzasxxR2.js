import"../chunks/CWj6FrbW.js";import{o as Ie}from"../chunks/BLXvhIrk.js";import{w as xe,D as Ae,n as j,H as Re,aM as ae,K as ke,L as Ce,F as Se,M as se,ab as re,V as K,X as ie,W as oe,Q as Y,v as we,N as He,aN as ne,aO as le,aP as ce,e as Le,_ as fe,a0 as G,aE as De,p as Pe,al as ue,aj as Me,g as Oe,f as d,b as u,c as $e,$ as je,k as a,ak as me,d as m,z as de,r,s as L,aQ as Ue,a as pe,aL as V,t as X}from"../chunks/obqp2paV.js";import{d as Be,b as We,e as Fe,s as U}from"../chunks/BSrLC8Pd.js";import{i as Z}from"../chunks/bj9lDj3h.js";import{e as ve,i as he}from"../chunks/0qJetFIX.js";import{h as ze}from"../chunks/CES1JxZU.js";import{s as D}from"../chunks/BMo-HCLs.js";import{T as Qe}from"../chunks/izcudvy4.js";import{p as B}from"../chunks/_YLMXk_1.js";import{g as qe}from"../chunks/DNNdfCMU.js";import{s as ge}from"../chunks/D1e6ghzX.js";import{t as _e}from"../chunks/CIEBSZH7.js";const J=0,W=1,ee=2;function Ke(p,v,s,S,_){j&&Re();var i=p,g=xe(),y=Le,o=re,n,l,w,I=g?ie(void 0):oe(void 0,!1,!1),P=g?ie(void 0):oe(void 0,!1,!1),x=!1;function A(t,c){x=!0,c&&(ne(e),le(e),ce(y));try{t===J&&s&&(n?fe(n):n=Y(()=>s(i))),t===W&&S&&(l?fe(l):l=Y(()=>S(i,I))),t!==J&&n&&G(n,()=>n=null),t!==W&&l&&G(l,()=>l=null),t!==ee&&w&&G(w,()=>w=null)}finally{c&&(ce(null),le(null),ne(null),De())}}var e=Ae(()=>{if(o===(o=v()))return;let t=j&&ae(o)===(i.data===ke);if(t&&(i=Ce(),Se(i),se(!1),t=!0),ae(o)){var c=o;x=!1,c.then(N=>{c===o&&(K(I,N),A(W,!0))},N=>{if(c===o)throw K(P,N),A(ee,!0),P.v}),j?s&&(n=Y(()=>s(i))):we(()=>{x||A(J,!0)})}else K(I,o),A(W,!1);return t&&se(!0),()=>o=re});j&&(i=He)}const Ye=async({path:p,limit:v=200,offset:s=0})=>{const _=qe().session();try{p=p.filter(y=>y.trim()!==""),v=parseInt(Number(v).toFixed(0)),s=parseInt(Number(s).toFixed(0));const i=p.length===0?`
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
      `,{records:g}=await _.run(i,{elems:p,limit:BigInt(v||ge.limit),offset:BigInt(s)});return console.debug({query:i,records:g}),g}finally{await _.close()}};var Ge=d('<link rel="icon" href="infinity%20eyes.svg"/>'),Ve=d('<li class="svelte-1f7r4e4"> <a class="button svelte-1f7r4e4"><span>⨯</span></a></li>'),Xe=d('<ul id="path" class="svelte-1f7r4e4"></ul>'),Ze=d('<h2 class="svelte-1f7r4e4">No Results</h2>'),Je=d('<h2 class="svelte-1f7r4e4"> </h2> <object class="svelte-1f7r4e4"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(p,v,s)=>{v(a(s).chip)},tt=d('<a class="button"><span> </span></a>'),at=d('<li class="svelte-1f7r4e4"><!></li>'),st=d('<ul id="result" class="svelte-1f7r4e4"></ul>'),rt=d('<h2 class="svelte-1f7r4e4">Searching…</h2>'),it=d('<main class="svelte-1f7r4e4"><form class="svelte-1f7r4e4"><input id="chip" placeholder="Path Element" class="svelte-1f7r4e4"/> <button><span>Add Path Element</span></button></form> <!> <section id="result" class="svelte-1f7r4e4"><!></section></main>');function Et(p,v){Pe(v,!0);let s=ue(Me([])),S=V(async()=>{try{const e=B.url.searchParams.get("limit"),t=B.url.searchParams.get("offset");return Ye({path:a(s),limit:e?Number(e):ge.limit,offset:Number(t)})}catch(e){Qe({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=ue("");Ie(()=>{me(s,B.params.path.split("/").filter(Boolean),!0);const e=B.url.hash.split("/").filter(Boolean);me(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const i=e=>{e.preventDefault();const t=e.target.elements.chip;g(t.value),t.value=""},g=e=>{e=e.trim(),e&&a(s).push(e)},y=e=>{a(s).splice(e,1)},o=()=>{y(-1)};Oe(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&o()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var n=it();ze(e=>{var t=Ge();je.title="Mïmis: Search",u(e,t)});var l=m(n),w=m(l);We(w),de(2),r(l);var I=L(l,2);{var P=e=>{var t=Xe();ve(t,21,()=>a(s),he,(c,N,M)=>{var H=Ve(),h=m(H),E=L(h);E.__click=()=>y(M),r(H),X(F=>{U(h,`${a(N)??""} `),D(E,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(M,1).join("/")}`]),u(c,H)}),r(t),u(e,t)};Z(I,e=>{a(s).length>0&&e(P)})}var x=L(I,2),A=m(x);Ke(A,()=>a(S),e=>{var t=rt();u(e,t)},(e,t)=>{var c=Ue(),N=pe(c);{var M=h=>{var E=Ze();u(h,E)},H=h=>{var E=st();ve(E,21,()=>a(t),he,(F,O)=>{var z=at(),Ee=m(z);{var be=R=>{var f=Je();const T=V(()=>{var $;const{cid:C}=($=a(O).get("child"))==null?void 0:$.properties;return{cid:C}});var k=pe(f),Q=m(k);r(k);var b=L(k,2),te=m(b),q=L(m(te)),Te=m(q);r(q),de(),r(te),r(b),X((C,$,ye)=>{U(Q,`/${C??""}`),D(b,"data",$),D(b,"title",`ipfs://${a(T).cid}`),D(q,"href",ye),U(Te,`ipfs://${a(T).cid??""}`)},[()=>{var C;return(C=a(O).get("path"))==null?void 0:C.join("/")},()=>_e({cid:a(T).cid}),()=>_e({cid:a(T).cid})]),u(R,f)},Ne=R=>{var f=tt();const T=V(()=>{const{path:b}=a(O).get("next").properties;return{chip:b}});f.__click=[et,g,T];var k=m(f),Q=m(k,!0);r(k),r(f),X(b=>{D(f,"href",b),U(Q,a(T).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),u(R,f)};Z(Ee,R=>{var f;(f=a(O).get("child"))!=null&&f.labels.includes("File")?R(be):R(Ne,!1)})}r(z),u(F,z)}),r(E),u(h,E)};Z(N,h=>{!a(t)||a(t).length===0?h(M):h(H,!1)})}u(e,c)}),r(x),r(n),Fe("submit",l,i),u(p,n),$e()}Be(["click"]);export{Et as component};
