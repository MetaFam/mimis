import { parseArgs } from 'jsr:@std/cli@1.0.27'
import { ensureDirSync, existsSync } from 'jsr:@std/fs'

type Entry = {
  rest: Array<string>
  name: string
}

async function pass(
  { dryRun = false, dir }: { dryRun?: boolean, dir: string }
) {
  let changes = false
  const prefixes: { [key: string]: Array<Entry> } = {}
  for await (const { name } of Deno.readDir(dir)) {
    const path = `${dir}/${name}`
    const stats = await Deno.lstat(path)
    if(stats.isSymlink) {
      console.warn(`Skipping symlink: ${name}`)
      continue
    } else if(stats.isDirectory) {
      console.debug(`Descending into directory: ${name}`)
      await pass({ dryRun, dir: path })
      console.debug(`Finished processing directory: ${name}`)
    } else {
      // eslint-disable-next-line prefer-const
      let [prefix, ...rest] = name.split(/[-. ]/g)
      if(rest.length >= 2) {
        const ext = rest.pop()
        const terminal = rest.pop()
        rest.push(`${terminal}.${ext}`)
        if(prefix.length === 1) {
          prefix += `-${rest.shift()}`
        }
        prefixes[prefix] ??= []
        prefixes[prefix].push({ rest, name })
      }
    }
  }
  for(const [prefix, entries] of Object.entries(prefixes)) {
    for(const { rest: suffix, name } of entries) {
      if(suffix.length === 0) {
        if(dryRun) {
          console.debug(`Skipping suffixless: ${name}`)
        }
        continue
      }
      const mkSubdir = entries.length > 1
      const sep = suffix.at(0)?.length === 1 ? '-' : ' '
      const path = (mkSubdir ? (
        `${prefix}/${suffix.join(sep)}`
      ) : (
        `${prefix}${sep}${suffix.join(sep)}`
      ))
      if(name === path) {
        if(dryRun) {
          console.debug(`No change to: "${name}"`)
        }
        continue
      }
      if(!existsSync(`${dir}/${name}`)) {
        console.warn(`Skipping Nonexistent: ${name}`)
        continue
      }
      if(dryRun) {
        console.log(`Would rename: ${name} to ${path}`)
      } else {
        if(mkSubdir) ensureDirSync(`${dir}/${prefix}/`)
        console.debug(`Renaming: ${dir}/${name} to ${dir}/${path}`)
        Deno.renameSync(`${dir}/${name}`, `${dir}/${path}`)
        changes = true
      }
    }
  }
  return changes
}

const args = parseArgs(Deno.args, {
  boolean: ['dry-run'],
  string: ['base'],
  number: ['passes'],
  alias: { n: 'dry-run', b: 'base', p: 'passes' },
  default: { 'dry-run': false, passes: 50 },
})
const dryRun: boolean = args['dry-run']
const dir: string | undefined = args.base ?? args._ [0] as string
let passes = args.passes

if(!dir) {
  console.error("Usage: deno rename.ts [-n] [-p <max passes>] [--base] <directory>")
  Deno.exit(1)
}

let changes = false
do {
  changes = false
  changes = await pass({ dryRun, dir })
} while(changes && --passes > 0)