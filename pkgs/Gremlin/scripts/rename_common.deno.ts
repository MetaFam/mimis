import { parseArgs } from 'jsr:@std/cli@1.0.27'
import { ensureDirSync, existsSync } from 'jsr:@std/fs'

async function pass(
  { dryRun = false, dir }: { dryRun?: boolean, dir: string }
) {
  const prefixes: { [key: string]: Array<Array<string>> } = {}
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
      let [prefix, ...rest] = name.split(/[- ]/g)
      if(rest.length > 0) {
        if(prefix.length === 1) {
          prefix += `-${rest.shift()}`
        }
        prefixes[prefix] ??= []
        prefixes[prefix].push(rest)
      }
    }
  }
  for(const [prefix, suffixes] of Object.entries(prefixes)) {
    for(const suffix of suffixes) {
      if(suffix.length === 0) continue
      const mkSubdir = suffixes.length > 1
      const sep = suffix.at(0)?.length === 1 ? '-' : ' '
      const path = (mkSubdir ? ({
        old: `${prefix}-${suffix.join('-')}`,
        new: `${prefix}/${suffix.join(sep)}`,
      }) : ({
        old: `${prefix}-${suffix.join('-')}`,
        new: `${prefix}${sep}${suffix.join(sep)}`,
      }))
      if(path.old === path.new) continue
      if(!existsSync(`${dir}/${path.old}`)) {
        console.warn(`Skipping Nonexistent: ${path.old}`)
        continue
      }
      if(dryRun) {
        console.log(`Would rename: ${path.old} to ${path.new}`)
      } else {
        if(mkSubdir) ensureDirSync(`${dir}/${prefix}/`)
        Deno.renameSync(`${dir}/${path.old}`, `${dir}/${path.new}`)
      }
    }
  }
}

const args = parseArgs(Deno.args, {
  boolean: ['dry-run'],
  string: ['base'],
  alias: { n: 'dry-run', b: 'base' },
  default: { 'dry-run': false },
})
const dryRun: boolean = args['dry-run']
const dir: string | undefined = args.base ?? args._ [0] as string

if(!dir) {
  console.error("Usage: deno rename.ts [-n] [--base] <directory>")
  Deno.exit(1)
}

pass({ dryRun, dir })