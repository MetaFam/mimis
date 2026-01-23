import { process, driver, structure } from 'gremlin';
import * as v from 'valibot';
import './exports-CBVwhdWM.js';
import { q as query, c as connect, i as init_remote_functions } from './janusgraph-BdUXYw6T.js';
import './shared-server-CjdfL4f1.js';

const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get spotId() {
    return spotId;
  }
}, Symbol.toStringTag, { value: "Module" }));
const { statics: __, t: T } = process;
const { DriverRemoteConnection } = driver;
const { Graph } = structure;
const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false)
  }))
});
const spotId = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false
    }
  }) => {
    const { maxMountDepth: maxDepth, allowCycles } = options;
    const { g, connection } = connect();
    try {
      path = path.filter(Boolean);
      let traversal = g.V().has(T.label, "Root");
      for (const element of path) {
        if (!allowCycles) {
          traversal = traversal.simplePath();
        }
        traversal = traversal.until(
          __.not(__.outE("MOUNT")).or().loops().is(maxDepth)
        ).repeat(
          __.outE("MOUNT").order().by("order").inV()
        ).outE("CONTAINS").has("path", element).inV();
      }
      traversal = traversal.id().limit(1);
      const result = await traversal.next();
      return result.value;
    } catch (err) {
      console.error({ "In spotId": err });
      return { error: err.message };
    } finally {
      await connection.close();
    }
  }
);
init_remote_functions(m, "src/lib/spotId.remote.ts", "froafq");
for (const [name, fn] of Object.entries(m)) {
  fn.__.id = "froafq/" + name;
  fn.__.name = name;
}

export { m, spotId as s };
//# sourceMappingURL=spotId.remote-CJDY_YBe.js.map
