/** The bookmarks shown in the Places sidebar, grouped into sections. */

import { HOME } from './data'

export interface Place {
  label: string
  path: string
  glyph: string
}

export interface PlaceSection {
  title: string
  places: Place[]
}

export const PLACE_SECTIONS: PlaceSection[] = [
  {
    title: 'Places',
    places: [
      { label: 'Home', path: HOME, glyph: '🏠' },
      { label: 'Desktop', path: `${HOME}/Desktop`, glyph: '🖥️' },
      { label: 'Documents', path: `${HOME}/Documents`, glyph: '📑' },
      { label: 'Downloads', path: `${HOME}/Downloads`, glyph: '⬇️' },
      { label: 'Music', path: `${HOME}/Music`, glyph: '🎵' },
      { label: 'Pictures', path: `${HOME}/Pictures`, glyph: '🖼️' },
      { label: 'Videos', path: `${HOME}/Videos`, glyph: '🎬' },
    ],
  },
  {
    title: 'Devices',
    places: [
      { label: 'Root', path: '/', glyph: '💽' },
      { label: 'USB Drive', path: '/media/USB Drive', glyph: '🔌' },
    ],
  },
]
