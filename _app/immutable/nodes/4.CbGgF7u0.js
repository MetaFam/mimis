import"../chunks/CWj6FrbW.js";import{o as ye}from"../chunks/B8CADLDv.js";import{w as Ie,C as xe,h as B,G as Re,aL as ae,J as Ce,K as ke,D as Ae,L as se,ab as re,T as G,V as oe,U as ie,P as K,v as He,M as we,aM as le,aN as ne,aO as ce,e as Se,Y as he,Z,au as Le,p as Oe,al as ue,aj as Pe,g as De,f as m,b as u,c as Me,$ as $e,l as a,ak as fe,d,z as de,r,s as L,aP as je,a as me,aQ as J,t as Q}from"../chunks/DZGWyE00.js";import{d as Be,b as Ue,e as We,s as U}from"../chunks/j-tIMm_a.js";import{i as V}from"../chunks/qJDjqx1W.js";import{e as ve,i as pe}from"../chunks/CHiJpNAM.js";import{h as ze}from"../chunks/BJ8MXW2t.js";import{s as O}from"../chunks/D117-Z4F.js";import{g as Fe,T as Ye}from"../chunks/wP1rRefP.js";import{p as W}from"../chunks/CzQBNjWo.js";import{t as _e}from"../chunks/Ce7-ILAV.js";import{s as qe}from"../chunks/DOPGH-7y.js";const X=0,z=1,ee=2;function Ge(v,f,s,b,_){B&&Re();var o=v,E=Ie(),y=Se,i=re,l,n,A,I=E?oe(void 0):ie(void 0,!1,!1),P=E?oe(void 0):ie(void 0,!1,!1),x=!1;function R(t,c){x=!0,c&&(le(e),ne(e),ce(y));try{t===X&&s&&(l?he(l):l=K(()=>s(o))),t===z&&b&&(n?he(n):n=K(()=>b(o,I))),t!==X&&l&&Z(l,()=>l=null),t!==z&&n&&Z(n,()=>n=null),t!==ee&&A&&Z(A,()=>A=null)}finally{c&&(ce(null),ne(null),le(null),Le())}}var e=xe(()=>{if(i===(i=f()))return;let t=B&&ae(i)===(o.data===Ce);if(t&&(o=ke(),Ae(o),se(!1),t=!0),ae(i)){var c=i;x=!1,c.then(T=>{c===i&&(G(I,T),R(z,!0))},T=>{if(c===i)throw G(P,T),R(ee,!0),P.v}),B?s&&(l=K(()=>s(o))):He(()=>{x||R(X,!0)})}else G(I,i),R(z,!1);return t&&se(!0),()=>i=re});B&&(o=we)}const Ke=async({path:v,limit:f=200,offset:s=0})=>{const b=Fe();try{const _=b.session();v=v.filter(y=>y.trim()!==""),f=parseInt(Number(f).toFixed(0)),s=parseInt(Number(s).toFixed(0));const o=v.length===0?`
        MATCH (start:Root)-[next:CONTAINS|CONNECTS]->(child)
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
        CALL {
          WITH end
            MATCH (end)-[next:CONTAINS]->(child)
            RETURN next, child
        UNION
          WITH end
            MATCH (end)-[:REPRESENTED_BY]->(intermediate)-[next:EMBODIED_AS]->(child)
            RETURN next, child
        }
        // ORDER BY rel.order
        LIMIT ${s+f}
        SKIP ${s}
        RETURN DISTINCT
          elements as path,
          next,
          child
      `,E=await _.run(o,{elems:v,limit:BigInt(f),offset:BigInt(s)});return await _.close(),E.records}finally{}};var Ze=m('<link rel="icon" href="infinity%20eyes.svg"/>'),Je=m('<li class="svelte-165lhoa"> <a class="button svelte-165lhoa">⨯</a></li>'),Qe=m('<ul id="path" class="svelte-165lhoa"></ul>'),Ve=m('<h2 class="svelte-165lhoa">No Results</h2>'),Xe=m('<h2 class="svelte-165lhoa"> </h2> <object class="svelte-165lhoa"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(v,f,s)=>{f(a(s).chip)},tt=m('<a class="button svelte-165lhoa"> </a>'),at=m("<li><!></li>"),st=m('<ul id="result" class="svelte-165lhoa"></ul>'),rt=m('<h2 class="svelte-165lhoa">Searching…</h2>'),ot=m('<main class="svelte-165lhoa"><form><input id="chip" placeholder="Path Element"/> <button>Add Path Element</button></form> <!> <section id="result" class="svelte-165lhoa"><!></section></main>');function gt(v,f){Oe(f,!0);let s=ue(Pe([])),b=J(async()=>{try{const e=W.url.searchParams.get("limit"),t=W.url.searchParams.get("offset");return Ke({path:a(s),limit:e?Number(e):qe.limit,offset:Number(t)})}catch(e){Ye({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=ue("");ye(()=>{fe(s,W.params.path.split("/").filter(Boolean),!0);const e=W.url.hash.split("/").filter(Boolean);fe(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const o=e=>{e.preventDefault();const t=e.target.elements.chip;E(t.value),t.value=""},E=e=>{e=e.trim(),e&&a(s).push(e)},y=e=>{a(s).splice(e,1)},i=()=>{y(-1)};De(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&i()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var l=ot();ze(e=>{var t=Ze();$e.title="Mïmis: Search",u(e,t)});var n=d(l),A=d(n);Ue(A),de(2),r(n);var I=L(n,2);{var P=e=>{var t=Qe();ve(t,21,()=>a(s),pe,(c,T,D)=>{var H=Je(),p=d(H),g=L(p);g.__click=()=>y(D),r(H),Q(F=>{U(p,`${a(T)??""} `),O(g,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(D,1).join("/")}`]),u(c,H)}),r(t),u(e,t)};V(I,e=>{a(s).length>0&&e(P)})}var x=L(I,2),R=d(x);Ge(R,()=>a(b),e=>{var t=rt();u(e,t)},(e,t)=>{var c=je(),T=me(c);{var D=p=>{var g=Ve();u(p,g)},H=p=>{var g=st();ve(g,21,()=>a(t),pe,(F,M)=>{var Y=at(),ge=d(Y);{var Ee=C=>{var h=Xe();const N=J(()=>{var j;const{cid:k}=(j=a(M).get("child"))==null?void 0:j.properties;return{cid:k}});var w=me(h),S=d(w);r(w);var $=L(w,2),te=d($),q=L(d(te)),Ne=d(q);r(q),de(),r(te),r($),Q((k,j,be)=>{U(S,`/${k??""}`),O($,"data",j),O($,"title",`ipfs://${a(N).cid}`),O(q,"href",be),U(Ne,`ipfs://${a(N).cid??""}`)},[()=>{var k;return(k=a(M).get("path"))==null?void 0:k.join("/")},()=>_e({cid:a(N).cid}),()=>_e({cid:a(N).cid})]),u(C,h)},Te=C=>{var h=tt();const N=J(()=>{const{path:S}=a(M).get("next").properties;return{chip:S}});h.__click=[et,E,N];var w=d(h,!0);r(h),Q(S=>{O(h,"href",S),U(w,a(N).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),u(C,h)};V(ge,C=>{var h;(h=a(M).get("child"))!=null&&h.labels.includes("File")?C(Ee):C(Te,!1)})}r(Y),u(F,Y)}),r(g),u(p,g)};V(T,p=>{!a(t)||a(t).length===0?p(D):p(H,!1)})}u(e,c)}),r(x),r(l),We("submit",n,o),u(v,l),Me()}Be(["click"]);export{gt as component};
