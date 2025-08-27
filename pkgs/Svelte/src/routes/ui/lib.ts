export class Rectangle {
	public x: number | null
	public y: number | null
	public w: number | null
	public h: number | null
	public center: { x: number, y: number }

	constructor({
		x = 0,
		y = 0,
		w = 0,
		h = 0,
	} = {}) {
		this.x = Math.min(x, x + w)
		this.y = Math.min(y, y + h)
		this.w = Math.max(x - w, w)
		this.h = Math.max(y - h, h)
		this.center = {
			x: this.x + this.w / 2,
			y: this.y + this.h / 2,
		}
	}
}

export class Position {
	public x: number
	public y: number

	constructor({
		x = 0,
		y = 0,
	} = {}) {
		this.x = x
		this.y = y
	}
}

export type CTMable = (
  SVGElement
  & { getScreenCTM: (() => {
    inverse: (() => DOMMatrixInit)
  }) }
)

export function screen2SVGWithin(
  elem: CTMable, screen: Position,
) {
	if(!elem) throw new Error('`elem` is not defined.')
	if(!elem.closest) {
    throw new Error('`elem.closest()` is not defined.')
  }
  const svg = (
    elem instanceof SVGSVGElement ? (
      elem
    ) : (
      elem.closest('svg')
    )
  )
  const point = svg?.createSVGPoint()
	if(!point) {
    throw new Error(`No SVG parent of ${elem.nodeName}.`)
  }

  point.x = screen.x
  point.y = screen.y

  const screenCTM = elem.getScreenCTM()
  const relative = point.matrixTransform(screenCTM.inverse())
  // console.debug({ x: relative.x, y: relative.y })
  return { x: relative.x, y: relative.y }
}

export class WinDims {
	constructor({
		// Says "`public` is a reserved word"
		// public w = window.innerWidth,
		// public h = window.innerHeight,
	} = {}) {}
}