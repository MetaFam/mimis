import Folder from '#assets/folder.svg?url'
import PDF from '#assets/pdf.svg?url'
import JavaScript from '#assets/javascript.svg?url'
import HTML from '#assets/html.svg?url'
import JSON from '#assets/json.svg?url'
import CSS from '#assets/css.svg?url'
import Unknown from '#assets/unknown.svg?url'

export type KnownTypes = keyof typeof icons

export const icons = {
  'application/pdf': [PDF, '🗐'],
  '(application|text)/(java|type)script': [JavaScript, '䷢'],
  'text/html': [HTML, '🌏'],
  '(text|application)/json': [JSON, '✣'],
  'text/css': [CSS, '🖌️']
} as const

export function iconFor(type?: KnownTypes) {
  if(!type) return [Folder, '📁']
  let icon = icons[type]
  if(!icon) {
    for(const [desc, val] of Object.entries(icons)) {
      if(new RegExp(desc).test(type)) {
        icon = val
        break
      }
    }
  }
  return icon ?? [Unknown, '❔']
}

export default icons