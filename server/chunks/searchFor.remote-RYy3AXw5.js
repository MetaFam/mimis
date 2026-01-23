import { process } from 'gremlin';
import * as v from 'valibot';
import './exports-CBVwhdWM.js';
import { q as query, c as connect, i as init_remote_functions } from './janusgraph-BdUXYw6T.js';
import './shared-server-CjdfL4f1.js';

const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get searchFor() {
    return searchFor;
  }
}, Symbol.toStringTag, { value: "Module" }));
const { statics: __, t: T } = process;
const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false)
  }))
});
const searchFor = query(
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
      const results = await traversal.outE("CONTAINS").as("contains").values("path").as("name").select("contains").inV().coalesce(
        __.outE("REPRESENTATION").has("type", "image/svg+xml").inV().map(
          __.project("type", "cid").by(__.constant("image")).by(__.values("cid"))
        ),
        __.project("type", "cid").by(__.constant("spot")).by(__.constant(null))
      ).as("result").project("name", "type", "cid").by(__.select("name")).by(__.select("result").select("type")).by(__.select("result").select("cid")).dedup().toList();
      return results.map((entry) => ({
        name: entry.get("name")?.toString() ?? (() => {
          throw new Error("Name is missing.");
        })(),
        type: entry.get("type")?.toString() ?? (() => {
          throw new Error("Type is missing.");
        })(),
        cid: entry.get("cid")?.toString() ?? null
      }));
    } catch (error) {
      console.error({ error });
      return { error: error.message };
    } finally {
      await connection.close();
    }
  }
);
init_remote_functions(m, "src/lib/searchFor.remote.ts", "1a287au");
for (const [name, fn] of Object.entries(m)) {
  fn.__.id = "1a287au/" + name;
  fn.__.name = name;
}

export { m, searchFor as s };
//# sourceMappingURL=searchFor.remote-RYy3AXw5.js.map
