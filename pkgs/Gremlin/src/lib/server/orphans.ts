type ScriptClient = {
  submit(
    script: string, bindings?: Record<string, unknown>,
  ): Promise<{ toArray(): Array<unknown> }>
}

/**
 * Groovy for the JanusGraph transactions whose BerkeleyDB JE
 * transaction belongs to a thread that has died, & so can never be
 * committed or rolled back by it. With `rollback`, it rolls back those
 * in `only`, or all of them when `only` is null.
 */
const ORPHANS = `
def field = { o, name ->
  for(def c = o?.getClass(); c != null; c = c.superclass) {
    def f = c.declaredFields.find { it.name == name }
    if(f) {
      f.accessible = true
      return f.get(o)
    }
  }
  null
}
// JanusGraph wraps the JE transaction a few layers deep.
def jeOf
jeOf = { o, depth ->
  if(o == null || depth > 6) return null
  if(o instanceof com.sleepycat.je.Transaction) return o
  for(def c = o.getClass(); c != null && c != Object; c = c.superclass) {
    for(def f in c.declaredFields) {
      if(java.lang.reflect.Modifier.isStatic(f.modifiers)) continue
      if(!(f.type.name =~ /Transaction|Tx/)) continue
      f.accessible = true
      def found = jeOf(f.get(o), depth + 1)
      if(found) return found
    }
  }
  null
}
def chosen = only == null ? null : (only.collect { it as long } as Set)
graph.getOpenTransactions().findAll { it.isOpen() }.findResults { tx ->
  def je = jeOf(tx.getTxHandle(), 0)
  def thread = field(field(je, 'txn'), 'thread')
  if(thread == null || thread.isAlive()) return null
  def id = je.getId()
  def rolledBack = rollback && (chosen == null || chosen.contains(id))
  if(rolledBack) tx.rollback()
  [id: id, thread: thread.getName(), rolledBack: rolledBack]
}
`

/**
 * The transactions orphaned by Gremlin sessions whose connection
 * closed mid-transaction, as when the process holding one dies. The
 * server drops such a session & its thread but leaves the transaction
 * open, holding its locks until the server restarts, so a write to
 * anything it read times out. With `rollback`, rolls back those in
 * `only`, or all of them.
 */
export async function orphanedTransactions(
  client: ScriptClient,
  { rollback = false, only = null }: {
    rollback?: boolean
    only?: Array<number> | null
  } = {},
) {
  const rows = (await client.submit(ORPHANS, { rollback, only })).toArray()
  return rows.map((row) => {
    if(!(row instanceof Map)) {
      throw new Error(`Expected an orphan’s fields, got ${JSON.stringify(row)}.`)
    }
    return {
      id: Number(row.get('id')),
      thread: String(row.get('thread')),
      rolledBack: row.get('rolledBack') === true,
    }
  })
}
