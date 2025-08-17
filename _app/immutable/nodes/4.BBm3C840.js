import"../chunks/CWj6FrbW.js";import{o as ye}from"../chunks/CmcFV7AY.js";import{w as Ie,D as xe,n as j,H as Re,aL as ae,K as ke,L as Ae,F as Ce,M as se,ab as re,V as Q,X as ie,W as oe,Q as Y,v as Se,N as we,aM as ne,aN as le,aO as ce,e as He,_ as fe,a0 as G,aE as Le,p as De,al as ue,aj as Pe,g as Me,f as p,b as u,c as Oe,$ as $e,k as a,ak as me,d as m,z as pe,r,s as L,aP as je,a as ve,aQ as V,t as X}from"../chunks/8ZL4plC7.js";import{d as Be,b as Ue,e as We,s as B}from"../chunks/5ydkCp1N.js";import{i as Z}from"../chunks/DgOwyvh5.js";import{e as de,i as he}from"../chunks/CD0Uw8Ry.js";import{h as Fe}from"../chunks/MaUIUMe0.js";import{s as D}from"../chunks/LiIg-eof.js";import{T as ze}from"../chunks/CySfHL6V.js";import{p as U}from"../chunks/big-kpvY.js";import{g as qe}from"../chunks/Cgsv69So.js";import{t as _e}from"../chunks/UM8f62b2.js";import{s as Ke}from"../chunks/CPt5rNEH.js";const J=0,W=1,ee=2;function Qe(v,d,s,S,_){j&&Re();var i=v,g=Ie(),y=He,o=re,n,l,w,I=g?ie(void 0):oe(void 0,!1,!1),P=g?ie(void 0):oe(void 0,!1,!1),x=!1;function R(t,c){x=!0,c&&(ne(e),le(e),ce(y));try{t===J&&s&&(n?fe(n):n=Y(()=>s(i))),t===W&&S&&(l?fe(l):l=Y(()=>S(i,I))),t!==J&&n&&G(n,()=>n=null),t!==W&&l&&G(l,()=>l=null),t!==ee&&w&&G(w,()=>w=null)}finally{c&&(ce(null),le(null),ne(null),Le())}}var e=xe(()=>{if(o===(o=d()))return;let t=j&&ae(o)===(i.data===ke);if(t&&(i=Ae(),Ce(i),se(!1),t=!0),ae(o)){var c=o;x=!1,c.then(N=>{c===o&&(Q(I,N),R(W,!0))},N=>{if(c===o)throw Q(P,N),R(ee,!0),P.v}),j?s&&(n=Y(()=>s(i))):Se(()=>{x||R(J,!0)})}else Q(I,o),R(W,!1);return t&&se(!0),()=>o=re});j&&(i=we)}const Ye=async({path:v,limit:d=200,offset:s=0})=>{const _=qe().session();try{v=v.filter(y=>y.trim()!==""),d=parseInt(Number(d).toFixed(0)),s=parseInt(Number(s).toFixed(0));const i=v.length===0?`
        MATCH (start:Root)-[next:CONTAINS]->(child)
        RETURN [] as path, next, child
      `:`
        WITH $elems as pathElems
        MATCH path = (start:Root)-[:CONTAINS*]->(end)
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
          next,
          child
        SKIP $offset
        LIMIT $limit
      `,{records:g}=await _.run(i,{elems:v,limit:BigInt(d),offset:BigInt(s)});return console.debug({query:i,records:g}),g}finally{await _.close()}};var Ge=p('<link rel="icon" href="infinity%20eyes.svg"/>'),Ve=p('<li class="svelte-1f7r4e4"> <a class="button svelte-1f7r4e4"><span>⨯</span></a></li>'),Xe=p('<ul id="path" class="svelte-1f7r4e4"></ul>'),Ze=p('<h2 class="svelte-1f7r4e4">No Results</h2>'),Je=p('<h2 class="svelte-1f7r4e4"> </h2> <object class="svelte-1f7r4e4"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(v,d,s)=>{d(a(s).chip)},tt=p('<a class="button"><span> </span></a>'),at=p('<li class="svelte-1f7r4e4"><!></li>'),st=p('<ul id="result" class="svelte-1f7r4e4"></ul>'),rt=p('<h2 class="svelte-1f7r4e4">Searching…</h2>'),it=p('<main class="svelte-1f7r4e4"><form class="svelte-1f7r4e4"><input id="chip" placeholder="Path Element" class="svelte-1f7r4e4"/> <button><span>Add Path Element</span></button></form> <!> <section id="result" class="svelte-1f7r4e4"><!></section></main>');function Et(v,d){De(d,!0);let s=ue(Pe([])),S=V(async()=>{try{const e=U.url.searchParams.get("limit"),t=U.url.searchParams.get("offset");return Ye({path:a(s),limit:e?Number(e):Ke.limit,offset:Number(t)})}catch(e){ze({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=ue("");ye(()=>{me(s,U.params.path.split("/").filter(Boolean),!0);const e=U.url.hash.split("/").filter(Boolean);me(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const i=e=>{e.preventDefault();const t=e.target.elements.chip;g(t.value),t.value=""},g=e=>{e=e.trim(),e&&a(s).push(e)},y=e=>{a(s).splice(e,1)},o=()=>{y(-1)};Me(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&o()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var n=it();Fe(e=>{var t=Ge();$e.title="Mïmis: Search",u(e,t)});var l=m(n),w=m(l);Ue(w),pe(2),r(l);var I=L(l,2);{var P=e=>{var t=Xe();de(t,21,()=>a(s),he,(c,N,M)=>{var H=Ve(),h=m(H),E=L(h);E.__click=()=>y(M),r(H),X(F=>{B(h,`${a(N)??""} `),D(E,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(M,1).join("/")}`]),u(c,H)}),r(t),u(e,t)};Z(I,e=>{a(s).length>0&&e(P)})}var x=L(I,2),R=m(x);Qe(R,()=>a(S),e=>{var t=rt();u(e,t)},(e,t)=>{var c=je(),N=ve(c);{var M=h=>{var E=Ze();u(h,E)},H=h=>{var E=st();de(E,21,()=>a(t),he,(F,O)=>{var z=at(),ge=m(z);{var Ee=k=>{var f=Je();const T=V(()=>{var $;const{cid:C}=($=a(O).get("child"))==null?void 0:$.properties;return{cid:C}});var A=ve(f),q=m(A);r(A);var b=L(A,2),te=m(b),K=L(m(te)),Ne=m(K);r(K),pe(),r(te),r(b),X((C,$,Te)=>{B(q,`/${C??""}`),D(b,"data",$),D(b,"title",`ipfs://${a(T).cid}`),D(K,"href",Te),B(Ne,`ipfs://${a(T).cid??""}`)},[()=>{var C;return(C=a(O).get("path"))==null?void 0:C.join("/")},()=>_e({cid:a(T).cid}),()=>_e({cid:a(T).cid})]),u(k,f)},be=k=>{var f=tt();const T=V(()=>{const{path:b}=a(O).get("next").properties;return{chip:b}});f.__click=[et,g,T];var A=m(f),q=m(A,!0);r(A),r(f),X(b=>{D(f,"href",b),B(q,a(T).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),u(k,f)};Z(ge,k=>{var f;(f=a(O).get("child"))!=null&&f.labels.includes("File")?k(Ee):k(be,!1)})}r(z),u(F,z)}),r(E),u(h,E)};Z(N,h=>{!a(t)||a(t).length===0?h(M):h(H,!1)})}u(e,c)}),r(x),r(n),We("submit",l,i),u(v,n),Oe()}Be(["click"]);export{Et as component};
