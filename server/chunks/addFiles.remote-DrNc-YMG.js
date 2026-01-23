import { process, driver } from 'gremlin';
import * as v from 'valibot';
import './exports-CBVwhdWM.js';
import { c as command } from './command-Dy7y8azP.js';
import { c as connect, s as settings, i as init_remote_functions } from './janusgraph-BdUXYw6T.js';
import './shared-server-CjdfL4f1.js';

const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get addFiles() {
    return addFiles;
  }
}, Symbol.toStringTag, { value: "Module" }));
const { P, t: T, merge: Merge } = process;
const { statics: __ } = process;
const { DriverRemoteConnection } = driver;
const NewFilesSchema = v.object({
  containerId: v.number(),
  files: v.array(v.object({
    cid: v.string(),
    type: v.string(),
    name: v.string(),
    size: v.number()
  }))
});
const addFiles = command(
  NewFilesSchema,
  async ({ containerId, files }) => {
    const { g, connection } = connect();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      let traversal = g.V().has(T.id, containerId);
      for (const { cid, name, type, size } of files) {
        const [_, title, ext] = name.match(/^(.*)\.([^.]+)$/) ?? [null, name, ""];
        if (settings.debugging) {
          console.debug({
            Add: `${title}⁄${ext}: ${cid} @ ${containerId} (${type})`
          });
        }
        if (title !== ext && title.length > 0) {
          traversal = traversal.as("grandparent").coalesce(
            __.outE("CONTAINS").has("path", title).inV(),
            __.addV("Spot").property({ createdAt: now }).addE("CONTAINS").from_("grandparent").property({ path: title, createdAt: now }).inV()
          );
        }
        traversal = traversal.as("parent").coalesce(
          __.outE("CONTAINS").has("path", ext).inV(),
          __.addV("Spot").property({ createdAt: now }).addE("CONTAINS").from_("parent").property({ path: ext, createdAt: now }).inV()
        ).as("new");
        traversal = traversal.coalesce(
          __.outE("REPRESENTATION").has("type", type).inV().has("cid", cid).not(__.inE("PREVIOUS")),
          __.addV("File").property({ createdAt: now, cid, size }).as("file").addE("REPRESENTATION").from_("new").property({ type, createdAt: now }).outV().outE("REPRESENTATION").has("type", type).inV().where(P.neq("file")).not(__.inE("PREVIOUS")).addE("PREVIOUS").from_("file").property({ createdAt: now })
        );
      }
      await traversal.iterate();
      return { success: true };
    } catch (error) {
      console.error({ "In addFiles": error });
      return { error: error.message };
    } finally {
      await connection.close();
    }
  }
);
init_remote_functions(m, "src/lib/addFiles.remote.ts", "1ugnjef");
for (const [name, fn] of Object.entries(m)) {
  fn.__.id = "1ugnjef/" + name;
  fn.__.name = name;
}

export { m };
//# sourceMappingURL=addFiles.remote-DrNc-YMG.js.map
