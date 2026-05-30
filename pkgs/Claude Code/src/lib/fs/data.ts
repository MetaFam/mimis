/** Seed data for the in-memory virtual filesystem. */

import type { FsNode } from './types'

const DAY = 86_400_000
/** Fixed "now" so the seed tree is deterministic across reloads. */
const BASE = Date.UTC(2026, 4, 30, 9, 0, 0)

/** Days-ago timestamp helper for readable seed data. */
const ago = (days: number, hours = 0) => BASE - days * DAY - hours * 3_600_000

interface Opts {
  modified?: number
  hidden?: boolean
}

function file(name: string, size: number, opts: Opts = {}): FsNode {
  return { name, kind: 'file', size, modified: opts.modified ?? ago(7), hidden: opts.hidden }
}

function folder(name: string, children: FsNode[] = [], opts: Opts = {}): FsNode {
  return {
    name,
    kind: 'folder',
    size: 0,
    modified: opts.modified ?? ago(3),
    hidden: opts.hidden,
    children,
  }
}

const KB = 1024
const MB = 1024 * KB
const GB = 1024 * MB

/** Build a fresh copy of the seed tree (never share mutable state). */
export function createSeedTree(): FsNode {
  return folder('/', [
    folder('home', [
      folder('user', [
        folder('Desktop', [
          file('todo.txt', 480, { modified: ago(0, 2) }),
          file('screenshot.png', 1.4 * MB, { modified: ago(1) }),
        ]),
        folder('Documents', [
          folder('Projects', [
            folder('dolphin-web', [
              file('README.md', 3.2 * KB, { modified: ago(0, 5) }),
              file('package.json', 812, { modified: ago(0, 5) }),
              file('main.ts', 9.1 * KB, { modified: ago(0, 6) }),
              file('styles.css', 4.7 * KB, { modified: ago(1) }),
            ]),
            folder('thesis', [
              file('chapter-01.docx', 128 * KB, { modified: ago(12) }),
              file('chapter-02.docx', 96 * KB, { modified: ago(9) }),
              file('bibliography.pdf', 2.1 * MB, { modified: ago(20) }),
            ]),
          ]),
          file('budget-2026.xlsx', 54 * KB, { modified: ago(4) }),
          file('resume.pdf', 184 * KB, { modified: ago(45) }),
          file('meeting-notes.md', 6.4 * KB, { modified: ago(2) }),
        ]),
        folder('Downloads', [
          file('ubuntu-24.04.iso', 4.7 * GB, { modified: ago(30) }),
          file('drivers.zip', 38 * MB, { modified: ago(15) }),
          file('invoice.pdf', 72 * KB, { modified: ago(6) }),
          file('cat-meme.gif', 2.8 * MB, { modified: ago(3) }),
        ]),
        folder('Music', [
          folder('Daft Punk - Discovery', [
            file('01 - One More Time.flac', 41 * MB, { modified: ago(120) }),
            file('02 - Aerodynamic.flac', 33 * MB, { modified: ago(120) }),
            file('cover.jpg', 820 * KB, { modified: ago(120) }),
          ]),
          file('podcast-ep-42.mp3', 58 * MB, { modified: ago(8) }),
        ]),
        folder('Pictures', [
          folder('Vacation 2025', [
            file('beach.jpg', 5.2 * MB, { modified: ago(200) }),
            file('sunset.jpg', 4.1 * MB, { modified: ago(200) }),
            file('mountains.heic', 6.8 * MB, { modified: ago(199) }),
          ]),
          file('wallpaper.png', 3.4 * MB, { modified: ago(60) }),
          file('avatar.webp', 96 * KB, { modified: ago(90) }),
        ]),
        folder('Videos', [
          file('demo-recording.mp4', 312 * MB, { modified: ago(5) }),
          file('tutorial.mkv', 1.2 * GB, { modified: ago(40) }),
        ]),
        folder(
          '.config',
          [
            folder('dolphin', [file('dolphinrc', 2.1 * KB, { modified: ago(1) })]),
            file('user-dirs.dirs', 640, { modified: ago(300) }),
          ],
          { hidden: true },
        ),
        file('.bashrc', 3.7 * KB, { hidden: true, modified: ago(150) }),
        file('.gitconfig', 412, { hidden: true, modified: ago(150) }),
      ]),
    ]),
    folder('media', [folder('USB Drive', [file('backup.tar.gz', 820 * MB, { modified: ago(2) })])]),
    folder('tmp', [file('scratch.log', 14 * KB, { modified: ago(0, 1) })]),
  ])
}

/** Absolute path of the seed user's home directory. */
export const HOME = '/home/user'
