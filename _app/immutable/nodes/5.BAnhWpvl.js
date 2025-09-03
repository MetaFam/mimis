import"../chunks/CWj6FrbW.js";import{o as Ie}from"../chunks/TiUsypHA.js";import{n as xe,C as Ae,x as j,G as Re,aI as ae,J as Ce,K as ke,D as Se,L as se,a9 as re,U as G,W as ie,V as oe,P as J,w as we,M as Le,aJ as ne,aK as le,aL as ce,e as He,Z as fe,_ as Y,aq as De,p as Pe,ac as ue,ah as Me,g as Oe,f as d,b as u,c as $e,ad as je,s as H,d as m,k as a,af as me,ag as de,r,aM as Ue,a as pe,ae as Z,t as Q}from"../chunks/CuKwMJ0M.js";import{d as Be,a as We,e as Fe,s as U}from"../chunks/DRICJ3qh.js";import{i as V}from"../chunks/DX5XkaxQ.js";import{e as he,i as ve}from"../chunks/CpRzmRWM.js";import{h as qe}from"../chunks/DjLVrDJo.js";import{a as D}from"../chunks/3AH-aWZb.js";import{T as ze}from"../chunks/BXQjxNSt.js";import{p as B}from"../chunks/C5nd8bkg.js";import{g as Ke}from"../chunks/CXtfRil7.js";import{s as ge}from"../chunks/DLUp0E8X.js";import{t as _e}from"../chunks/SpTG31iA.js";const X=0,W=1,ee=2;function Ge(p,h,s,S,_){j&&Re();var i=p,g=xe(),y=He,o=re,n,l,w,I=g?ie(void 0):oe(void 0,!1,!1),P=g?ie(void 0):oe(void 0,!1,!1),x=!1;function A(t,c){x=!0,c&&(ne(e),le(e),ce(y));try{t===X&&s&&(n?fe(n):n=J(()=>s(i))),t===W&&S&&(l?fe(l):l=J(()=>S(i,I))),t!==X&&n&&Y(n,()=>n=null),t!==W&&l&&Y(l,()=>l=null),t!==ee&&w&&Y(w,()=>w=null)}finally{c&&(ce(null),le(null),ne(null),De())}}var e=Ae(()=>{if(o===(o=h()))return;let t=j&&ae(o)===(i.data===Ce);if(t&&(i=ke(),Se(i),se(!1),t=!0),ae(o)){var c=o;x=!1,c.then(b=>{c===o&&(G(I,b),A(W,!0))},b=>{if(c===o)throw G(P,b),A(ee,!0),P.v}),j?s&&(n=J(()=>s(i))):we(()=>{x||A(X,!0)})}else G(I,o),A(W,!1);return t&&se(!0),()=>o=re});j&&(i=Le)}const Je=async({path:p,limit:h=200,offset:s=0})=>{const _=Ke().session();try{p=p.filter(y=>y.trim()!==""),h=parseInt(Number(h).toFixed(0)),s=parseInt(Number(s).toFixed(0));const i=p.length===0?`
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
      `,{records:g}=await _.run(i,{elems:p,limit:BigInt(h||ge.limit),offset:BigInt(s)});return console.debug({query:i,records:g}),g}finally{await _.close()}};var Ye=d('<link rel="icon" href="infinity%20eyes.svg"/>'),Ze=d('<li class="svelte-1f7r4e4"> <a class="button svelte-1f7r4e4"><span>⨯</span></a></li>'),Qe=d('<ul id="path" class="svelte-1f7r4e4"></ul>'),Ve=d('<h2 class="svelte-1f7r4e4">No Results</h2>'),Xe=d('<h2 class="svelte-1f7r4e4"> </h2> <object class="svelte-1f7r4e4"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(p,h,s)=>{h(a(s).chip)},tt=d('<a class="button"><span> </span></a>'),at=d('<li class="svelte-1f7r4e4"><!></li>'),st=d('<ul id="result" class="svelte-1f7r4e4"></ul>'),rt=d('<h2 class="svelte-1f7r4e4">Searching…</h2>'),it=d('<main class="svelte-1f7r4e4"><form class="svelte-1f7r4e4"><input id="chip" placeholder="Path Element" class="svelte-1f7r4e4"/> <button><span>Add Path Element</span></button></form> <!> <section id="result" class="svelte-1f7r4e4"><!></section></main>');function Et(p,h){Pe(h,!0);let s=ue(Me([])),S=Z(async()=>{try{const e=B.url.searchParams.get("limit"),t=B.url.searchParams.get("offset");return Je({path:a(s),limit:e?Number(e):ge.limit,offset:Number(t)})}catch(e){ze({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=ue("");Ie(()=>{me(s,B.params.path.split("/").filter(Boolean),!0);const e=B.url.hash.split("/").filter(Boolean);me(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const i=e=>{e.preventDefault();const t=e.target.elements.chip;g(t.value),t.value=""},g=e=>{e=e.trim(),e&&a(s).push(e)},y=e=>{a(s).splice(e,1)},o=()=>{y(-1)};Oe(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&o()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var n=it();qe(e=>{var t=Ye();je.title="Mïmis: Search",u(e,t)});var l=m(n),w=m(l);We(w,!0),de(2),r(l);var I=H(l,2);{var P=e=>{var t=Qe();he(t,21,()=>a(s),ve,(c,b,M)=>{var L=Ze(),v=m(L),E=H(v);E.__click=()=>y(M),r(L),Q(F=>{U(v,`${a(b)??""} `),D(E,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(M,1).join("/")}`]),u(c,L)}),r(t),u(e,t)};V(I,e=>{a(s).length>0&&e(P)})}var x=H(I,2),A=m(x);Ge(A,()=>a(S),e=>{var t=rt();u(e,t)},(e,t)=>{var c=Ue(),b=pe(c);{var M=v=>{var E=Ve();u(v,E)},L=v=>{var E=st();he(E,21,()=>a(t),ve,(F,O)=>{var q=at(),Ee=m(q);{var Te=R=>{var f=Xe();const N=Z(()=>{var $;const{cid:k}=($=a(O).get("child"))==null?void 0:$.properties;return{cid:k}});var C=pe(f),z=m(C);r(C);var T=H(C,2),te=m(T),K=H(m(te)),Ne=m(K);r(K),de(),r(te),r(T),Q((k,$,ye)=>{U(z,`/${k??""}`),D(T,"data",$),D(T,"title",`ipfs://${a(N).cid}`),D(K,"href",ye),U(Ne,`ipfs://${a(N).cid??""}`)},[()=>{var k;return(k=a(O).get("path"))==null?void 0:k.join("/")},()=>_e({cid:a(N).cid}),()=>_e({cid:a(N).cid})]),u(R,f)},be=R=>{var f=tt();const N=Z(()=>{const{path:T}=a(O).get("next").properties;return{chip:T}});f.__click=[et,g,N];var C=m(f),z=m(C,!0);r(C),r(f),Q(T=>{D(f,"href",T),U(z,a(N).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),u(R,f)};V(Ee,R=>{var f;(f=a(O).get("child"))!=null&&f.labels.includes("File")?R(Te):R(be,!1)})}r(q),u(F,q)}),r(E),u(v,E)};V(b,v=>{!a(t)||a(t).length===0?v(M):v(L,!1)})}u(e,c)}),r(x),r(n),Fe("submit",l,i),u(p,n),$e()}Be(["click"]);export{Et as component};
