import { e as escape_html } from './async-DnrCyTpF.js';
import { h as head, b as attr_class, a as attr, s as stringify, e as ensure_array_like, c as bind_props } from './index-BUgi64Qk.js';
import { p as page } from './index2-B9sDY5Qn.js';
import './exports-CBVwhdWM.js';
import './client-Cmhiik-v.js';
import { s as searchFor } from './searchFor.remote-RYy3AXw5.js';
import './createSpot.remote-Djpeaah9.js';
import './addFiles.remote-DrNc-YMG.js';
import { s as spotId } from './spotId.remote-CJDY_YBe.js';
import { s as settings, S as Settings } from './janusgraph-BdUXYw6T.js';
import './utils2-CxAejeQK.js';
import 'gremlin';
import 'valibot';
import './shared-server-CjdfL4f1.js';
import './command-Dy7y8azP.js';

function ConfigDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { self = void 0, onsubmit = void 0 } = $$props;
    const values = new Settings(settings);
    $$renderer2.push(`<dialog><form class="svelte-c6pxa5"><fieldset class="svelte-c6pxa5"><legend>General Settings</legend> <label class="svelte-c6pxa5"><input type="checkbox"${attr("checked", values.debugging, true)} class="svelte-c6pxa5"/> <span class="svelte-c6pxa5">Debug Logging</span></label> <label class="svelte-c6pxa5"><span class="svelte-c6pxa5">Details Zoom</span> <input type="text" inputmode="numeric" pattern="[0-9]*\\.?[0-9]*"${attr("value", settings.detailsZoom)} class="svelte-c6pxa5"/></label></fieldset> <fieldset class="svelte-c6pxa5"><legend>IPFS Settings</legend> <label class="svelte-c6pxa5"><span class="svelte-c6pxa5">Gateway URL Pattern</span> <input${attr("value", values.ipfsURLPattern)} class="svelte-c6pxa5"/></label></fieldset> <fieldset class="svelte-c6pxa5"><legend>Kubo Settings</legend> <label class="svelte-c6pxa5"><input type="checkbox"${attr("checked", values.useKubo, true)} class="svelte-c6pxa5"/> <span class="svelte-c6pxa5">Save to Kubo</span></label> <label class="svelte-c6pxa5"><span class="svelte-c6pxa5">URL</span> <input${attr("value", values.ipfsAPI)} class="svelte-c6pxa5"/></label> <label class="svelte-c6pxa5"><span class="svelte-c6pxa5">Username</span> <input${attr("value", values.kuboUsername)} placeholder="Leave blank to disable authentication…" autocomplete="username" class="svelte-c6pxa5"/></label> <label class="svelte-c6pxa5"><span class="svelte-c6pxa5">Password</span> <input type="password"${attr("value", values.kuboPassword)} autocomplete="new-password" class="svelte-c6pxa5"/></label></fieldset> <menu class="svelte-c6pxa5"><button type="button" class="svelte-c6pxa5">Cancel</button> <button class="svelte-c6pxa5">Save</button></menu></form></dialog>`);
    bind_props($$props, { self, onsubmit });
  });
}
function CSSRange($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      min = 0,
      max = 100,
      step = 1,
      property,
      prefix = "",
      suffix = "",
      label = null,
      value = 0
    } = $$props;
    $$renderer2.push(`<form class="svelte-ear2p7"><label class="svelte-ear2p7">`);
    if (label) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span>${escape_html(label)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <input type="range"${attr("value", value)}${attr("min", min)}${attr("max", max)}${attr("step", step)} class="svelte-ear2p7"/></label></form>`);
    bind_props($$props, { value });
  });
}
const root = "/_app/immutable/assets/root.DxdJSLNx.svg";
function Breadcrumbs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { path = [] } = $$props;
    $$renderer2.push(`<ol class="svelte-1ci3tk1"><!--[-->`);
    const each_array = ensure_array_like({ length: path.length + 1 });
    for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
      const whole = `/${path.slice(0, idx).join("/")}${idx > 0 ? "/" : ""}`;
      const elem = `${path.at(idx - 1)}`;
      const decoded = decodeURI(elem);
      $$renderer2.push(`<li class="svelte-1ci3tk1"><button>⇨</button> <a${attr("href", whole)}${attr("title", idx === 0 ? "𝙍𝙤𝙤𝙩" : decoded)} class="svelte-1ci3tk1">`);
      if (idx === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<img${attr("src", root)} alt="🪾" class="svelte-1ci3tk1"/>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`${escape_html(decoded)}/`);
      }
      $$renderer2.push(`<!--]--></a></li>`);
    }
    $$renderer2.push(`<!--]--></ol>`);
  });
}
const folder = "/_app/immutable/assets/folder.I7zX7laP.svg";
function toHTTP({
  url,
  cid
}) {
  if (!url && !cid || url && cid) {
    throw new Error("Must provide either `url` xor `cid`.");
  }
  let path = [];
  if (url != null) {
    [, cid, ...path] = Array.from(
      /^(?:ipfs:\/\/)?([^/]+)(\/.*)?$/.exec(url) ?? []
    );
  } else if (cid != null) {
    [cid, ...path] = cid.split("/");
  }
  if (cid == null) {
    throw new Error("Could not determine `cid`.");
  }
  return settings.ipfsURLPattern.replace("{cid}", cid).replace("{path}", `/${path.join("/")}`);
}
function valueOrThrow(test) {
  if (isError(test)) throw new Error(test.error);
  return test;
}
function isError(maybe) {
  return typeof maybe === "object" && maybe != null && Object.keys(maybe).length === 1 && Object.keys(maybe).at(0) === "error" && typeof Object.values(maybe).at(0) === "string";
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let path = page.params.path?.split("/").filter(Boolean) ?? [];
    var files, menued, configModal;
    var $$promises = $$renderer2.run([
      async () => files = valueOrThrow(await searchFor({ path })),
      () => menued = false,
      () => void 0,
      () => void 0,
      () => configModal = void 0,
      async () => valueOrThrow(await spotId({ path })),
      () => void 0
    ]);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1pgso1u", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>ï: `);
          $$renderer5.async([$$promises[6]], ($$renderer6) => {
            $$renderer6.push(() => escape_html(path));
          });
          $$renderer5.push(`</title>`);
        });
      });
      $$renderer3.push(`<main class="svelte-1pgso1u">`);
      $$renderer3.async([$$promises[1]], ($$renderer4) => {
        $$renderer4.child(async ($$renderer5) => {
          $$renderer5.push(`<menu id="actions"${attr_class("svelte-1pgso1u", void 0, { "open": menued })}><ul class="svelte-1pgso1u"><li><button class="svelte-1pgso1u">Add Directory</button></li> <li><button class="svelte-1pgso1u">Import Files</button></li> <li><button class="svelte-1pgso1u">Import Directory</button></li> <li><button class="svelte-1pgso1u">Export to CAR</button></li> <li><button class="svelte-1pgso1u">Export to CBOR-DAG</button></li> <li><button class="menu-open svelte-1pgso1u">Settings</button></li> <li>`);
          CSSRange($$renderer5, {
            min: 0.1,
            max: 1.5,
            step: 0.1,
            property: "--zoom",
            label: "🔎",
            get value() {
              return settings.detailsZoom;
            },
            set value($$value) {
              settings.detailsZoom = $$value;
              $$settled = false;
            }
          });
          $$renderer5.push(`<!----></li></ul></menu>`);
        });
      });
      $$renderer3.push(` <section id="locations" class="svelte-1pgso1u"><section class="general tools svelte-1pgso1u">`);
      $$renderer3.async([$$promises[1]], ($$renderer4) => {
        $$renderer4.child(async ($$renderer5) => {
          $$renderer5.push(`<button${attr("title", `${stringify(menued ? "Close" : "Open")} Actions`)}${attr_class("svelte-1pgso1u", void 0, { "actions-open": menued })}><span class="svelte-1pgso1u">🢗</span><span class="svelte-1pgso1u">☰</span><span class="svelte-1pgso1u">🢗</span></button>`);
        });
      });
      $$renderer3.push(` <input type="search" class="svelte-1pgso1u"/></section> <nav class="system locations"><ul class="svelte-1pgso1u"><li class="svelte-1pgso1u"><a href="/">Root</a></li> <li class="svelte-1pgso1u">Recent</li> <li class="svelte-1pgso1u">Categories</li> <li class="svelte-1pgso1u">Volumes</li></ul></nav> <nav class="user locations"><ul class="svelte-1pgso1u"><li class="svelte-1pgso1u"><a href="/media/book/by/">Books</a></li> <li class="svelte-1pgso1u"><a href="/media/movies/entitled/">Movies</a></li> <li class="svelte-1pgso1u"><a href="/science/biology/papers/ordered/by/publication date/">Biology Papers</a></li> <li class="svelte-1pgso1u"><button type="button" class="svelte-1pgso1u">➕</button></li></ul></nav></section> <section id="files" class="svelte-1pgso1u"><nav id="crumbs" class="svelte-1pgso1u">`);
      $$renderer3.async_block([$$promises[6]], ($$renderer4) => {
        Breadcrumbs($$renderer4, { path });
      });
      $$renderer3.push(`</nav> <nav id="details" class="svelte-1pgso1u"><ul class="svelte-1pgso1u"><!--[-->`);
      $$renderer3.async_block([$$promises[0]], ($$renderer4) => {
        const each_array = ensure_array_like(files);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let { name, type, cid } = each_array[$$index];
          $$renderer4.push(`<li>`);
          if (type === "spot") {
            $$renderer4.push("<!--[-->");
            $$renderer4.async([$$promises[6]], ($$renderer5) => {
              $$renderer5.child(async ($$renderer6) => {
                $$renderer6.push(`<a${attr("href", `${stringify(path.length > 0 ? "/" : "")}${stringify(path.join("/"))}/${stringify(name)}`)}${attr("title", name)} class="svelte-1pgso1u"><img${attr("src", folder)} alt="📁" class="svelte-1pgso1u"/> <span class="svelte-1pgso1u">${escape_html(name)}</span></a>`);
              });
            });
          } else {
            $$renderer4.push("<!--[!-->");
            if (type === "image" && cid) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<img${attr("src", toHTTP({ cid }))}${attr("alt", name)} class="svelte-1pgso1u"/> <span class="svelte-1pgso1u">${escape_html(name)}</span>`);
            } else {
              $$renderer4.push("<!--[!-->");
              $$renderer4.push(`<aside>Unknown Type: ${escape_html(type)}</aside>`);
            }
            $$renderer4.push(`<!--]-->`);
          }
          $$renderer4.push(`<!--]--></li>`);
        }
      });
      $$renderer3.push(`<!--]--></ul></nav></section> <dialog id="add-spot" class="svelte-1pgso1u"><form><fieldset><legend>Path to New Spot</legend> <input name="path" value="" class="svelte-1pgso1u"/> <button class="svelte-1pgso1u">Add</button></fieldset></form></dialog> <dialog id="add-files"><form><fieldset><legend>Files to Add</legend> <input name="files" type="file" multiple class="svelte-1pgso1u"/> <button class="svelte-1pgso1u">Add</button></fieldset></form></dialog> `);
      $$renderer3.async_block([$$promises[4]], ($$renderer4) => {
        ConfigDialog($$renderer4, {
          get self() {
            return configModal;
          },
          set self($$value) {
            configModal = $$value;
            $$settled = false;
          }
        });
      });
      $$renderer3.push(`</main>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-nAnLubkB.js.map
