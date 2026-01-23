import { process, driver } from 'gremlin';
import * as v from 'valibot';
import './exports-CBVwhdWM.js';
import { c as command } from './command-Dy7y8azP.js';
import { c as connect, s as settings, i as init_remote_functions } from './janusgraph-BdUXYw6T.js';
import './shared-server-CjdfL4f1.js';

const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get createSpot() {
    return createSpot;
  }
}, Symbol.toStringTag, { value: "Module" }));
const { t: T, merge: Merge } = process;
const { statics: __ } = process;
const { DriverRemoteConnection } = driver;
const NewSpotSchema = v.object({
  containerId: v.optional(v.number()),
  path: v.array(v.pipe(v.string(), v.nonEmpty()))
});
const createSpot = command(
  NewSpotSchema,
  async ({ containerId, path }) => {
    const { g, connection } = connect();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (settings.debugging) console.debug({ Create: path });
    try {
      let traversal = g.mergeV(/* @__PURE__ */ new Map([[T.id, containerId]])).option(Merge.onCreate, { createdAt: now });
      for (const elem of path) {
        traversal = traversal.as("parent").coalesce(
          __.outE("CONTAINS").has("path", elem).inV(),
          __.addV("Spot").property({ createdAt: now }).addE("CONTAINS").from_("parent").property({ path: elem, createdAt: now }).inV()
        );
      }
      await traversal.iterate();
      return { success: true };
    } catch (error) {
      console.error({ error });
      return { error: error.message };
    } finally {
      await connection.close();
    }
  }
);
init_remote_functions(m, "src/lib/createSpot.remote.ts", "x98l3z");
for (const [name, fn] of Object.entries(m)) {
  fn.__.id = "x98l3z/" + name;
  fn.__.name = name;
}

export { m };
//# sourceMappingURL=createSpot.remote-Djpeaah9.js.map
