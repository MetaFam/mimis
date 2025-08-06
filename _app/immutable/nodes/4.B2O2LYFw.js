import"../chunks/CWj6FrbW.js";import{o as ye}from"../chunks/Cd99Ulqw.js";import{w as Ie,C as xe,n as B,G as Re,aL as ae,J as Ce,K as ke,D as Ae,L as se,ab as re,T as G,V as oe,U as ie,P as K,v as He,M as we,aM as ne,aN as le,aO as ce,e as Se,Y as he,Z,aE as Le,p as Oe,al as fe,aj as Pe,g as De,f as d,b as f,c as Me,$ as $e,k as a,ak as ue,d as m,z as me,r,s as L,aP as je,a as de,aQ as J,t as Q}from"../chunks/OurnOBNA.js";import{d as Be,b as Ue,e as We,s as U}from"../chunks/DcJFUVwT.js";import{i as V}from"../chunks/CQH9xS8N.js";import{e as ve,i as pe}from"../chunks/K4FgsFi4.js";import{h as ze}from"../chunks/DJC3azkA.js";import{s as O}from"../chunks/CtB8sARI.js";import{T as Fe}from"../chunks/BI_kri7R.js";import{p as W}from"../chunks/Uwxv_ApA.js";import{g as Ye}from"../chunks/BM23hdiM.js";import{t as _e}from"../chunks/DdfHuYpf.js";import{s as qe}from"../chunks/Cj7HL-nn.js";const X=0,z=1,ee=2;function Ge(v,u,s,k,_){B&&Re();var o=v,E=Ie(),b=Se,i=re,n,l,A,y=E?oe(void 0):ie(void 0,!1,!1),P=E?oe(void 0):ie(void 0,!1,!1),I=!1;function x(t,c){I=!0,c&&(ne(e),le(e),ce(b));try{t===X&&s&&(n?he(n):n=K(()=>s(o))),t===z&&k&&(l?he(l):l=K(()=>k(o,y))),t!==X&&n&&Z(n,()=>n=null),t!==z&&l&&Z(l,()=>l=null),t!==ee&&A&&Z(A,()=>A=null)}finally{c&&(ce(null),le(null),ne(null),Le())}}var e=xe(()=>{if(i===(i=u()))return;let t=B&&ae(i)===(o.data===Ce);if(t&&(o=ke(),Ae(o),se(!1),t=!0),ae(i)){var c=i;I=!1,c.then(T=>{c===i&&(G(y,T),x(z,!0))},T=>{if(c===i)throw G(P,T),x(ee,!0),P.v}),B?s&&(n=K(()=>s(o))):He(()=>{I||x(X,!0)})}else G(y,i),x(z,!1);return t&&se(!0),()=>i=re});B&&(o=we)}const Ke=async({path:v,limit:u=200,offset:s=0})=>{const _=Ye().session();try{v=v.filter(b=>b.trim()!==""),u=parseInt(Number(u).toFixed(0)),s=parseInt(Number(s).toFixed(0));const o=v.length===0?`
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
        LIMIT ${s+u}
        SKIP ${s}
        RETURN DISTINCT
          elements as path,
          next,
          child
      `,{records:E}=await _.run(o,{elems:v,limit:BigInt(u),offset:BigInt(s)});return E}finally{await _.close()}};var Ze=d('<link rel="icon" href="infinity%20eyes.svg"/>'),Je=d('<li class="svelte-165lhoa"> <a class="button svelte-165lhoa">⨯</a></li>'),Qe=d('<ul id="path" class="svelte-165lhoa"></ul>'),Ve=d('<h2 class="svelte-165lhoa">No Results</h2>'),Xe=d('<h2 class="svelte-165lhoa"> </h2> <object class="svelte-165lhoa"><p>Could not display <a target="_blank"> </a>.</p></object>',1),et=(v,u,s)=>{u(a(s).chip)},tt=d('<a class="button svelte-165lhoa"> </a>'),at=d("<li><!></li>"),st=d('<ul id="result" class="svelte-165lhoa"></ul>'),rt=d('<h2 class="svelte-165lhoa">Searching…</h2>'),ot=d('<main class="svelte-165lhoa"><form><input id="chip" placeholder="Path Element"/> <button>Add Path Element</button></form> <!> <section id="result" class="svelte-165lhoa"><!></section></main>');function Et(v,u){Oe(u,!0);let s=fe(Pe([])),k=J(async()=>{try{const e=W.url.searchParams.get("limit"),t=W.url.searchParams.get("offset");return Ke({path:a(s),limit:e?Number(e):qe.limit,offset:Number(t)})}catch(e){Fe({text:e.message,duration:16e3,close:!0,gravity:"bottom",position:"center",stopOnFocus:!0,style:{background:"linear-gradient(to right, #00b09b, #96c93d)"}}).showToast()}}),_=fe("");ye(()=>{ue(s,W.params.path.split("/").filter(Boolean),!0);const e=W.url.hash.split("/").filter(Boolean);ue(_,e.slice(0,e.length-a(s).length).join("/"),!0)});const o=e=>{e.preventDefault();const t=e.target.elements.chip;E(t.value),t.value=""},E=e=>{e=e.trim(),e&&a(s).push(e)},b=e=>{a(s).splice(e,1)},i=()=>{b(-1)};De(()=>{const e=t=>{t.key==="ArrowLeft"&&t.target===document.body&&i()};return window.addEventListener("keydown",e),()=>{window.removeEventListener("keydown",e)}});var n=ot();ze(e=>{var t=Ze();$e.title="Mïmis: Search",f(e,t)});var l=m(n),A=m(l);Ue(A),me(2),r(l);var y=L(l,2);{var P=e=>{var t=Qe();ve(t,21,()=>a(s),pe,(c,T,D)=>{var H=Je(),p=m(H),g=L(p);g.__click=()=>b(D),r(H),Q(F=>{U(p,`${a(T)??""} `),O(g,"href",F)},[()=>`${a(_)}/${a(s).toSpliced(D,1).join("/")}`]),f(c,H)}),r(t),f(e,t)};V(y,e=>{a(s).length>0&&e(P)})}var I=L(y,2),x=m(I);Ge(x,()=>a(k),e=>{var t=rt();f(e,t)},(e,t)=>{var c=je(),T=de(c);{var D=p=>{var g=Ve();f(p,g)},H=p=>{var g=st();ve(g,21,()=>a(t),pe,(F,M)=>{var Y=at(),ge=m(Y);{var Ee=R=>{var h=Xe();const N=J(()=>{var j;const{cid:C}=(j=a(M).get("child"))==null?void 0:j.properties;return{cid:C}});var w=de(h),S=m(w);r(w);var $=L(w,2),te=m($),q=L(m(te)),Ne=m(q);r(q),me(),r(te),r($),Q((C,j,be)=>{U(S,`/${C??""}`),O($,"data",j),O($,"title",`ipfs://${a(N).cid}`),O(q,"href",be),U(Ne,`ipfs://${a(N).cid??""}`)},[()=>{var C;return(C=a(M).get("path"))==null?void 0:C.join("/")},()=>_e({cid:a(N).cid}),()=>_e({cid:a(N).cid})]),f(R,h)},Te=R=>{var h=tt();const N=J(()=>{const{path:S}=a(M).get("next").properties;return{chip:S}});h.__click=[et,E,N];var w=m(h,!0);r(h),Q(S=>{O(h,"href",S),U(w,a(N).chip)},[()=>`${a(_)}/${a(s).join("/")}${a(s).length>0?"/":""}`]),f(R,h)};V(ge,R=>{var h;(h=a(M).get("child"))!=null&&h.labels.includes("File")?R(Ee):R(Te,!1)})}r(Y),f(F,Y)}),r(g),f(p,g)};V(T,p=>{!a(t)||a(t).length===0?p(D):p(H,!1)})}f(e,c)}),r(I),r(n),We("submit",l,o),f(v,n),Me()}Be(["click"]);export{Et as component};
