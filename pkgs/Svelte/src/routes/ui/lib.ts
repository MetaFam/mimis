export class Rectangle {
	public x: number
	public y: number
	public w: number
	public h: number
	public center: { x: number, y: number }

	constructor({
		x = 0,
		y = 0,
		w = 0,
		h = 0,
	} = {}) {
		this.x = Math.min(x, x + w)
		this.y = Math.min(y, y + h)
		this.w = Math.abs(w)
		this.h = Math.abs(h)
		this.center = {
			x: this.x + this.w / 2,
			y: this.y + this.h / 2,
		}
	}

	get top() { return this.y }
	get bottom() { return this.y + this.height }
	get left() { return this.x }
	get right() { return this.x + this.width }

	get width() { return this.w }
	set width(w) { this.w = w }
	get height() { return this.h }
	set height(h) { this.h = h }
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

export function screen2SVGWithin(
	elem: SVGGraphicsElement, screen: Position | null,
) {
	if (!elem || !screen) return null
	if (!elem.closest) {
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
	if (!point) {
		throw new Error(`No SVG parent of ${elem.nodeName}.`)
	}

	point.x = screen.x
	point.y = screen.y

	const ctm = elem.getScreenCTM()
	if(!ctm) throw new Error('`ctm` wasn’t set.')
	return point.matrixTransform(ctm.inverse())
}

export class Dimensions {
	w: number
	h: number

	constructor({
		// Says "`public` is a reserved word"
		// public w = window.innerWidth,
		// public h = window.innerHeight,
		w = 0,
		h = 0,
	} = {}) {
		this.w = w
		this.h = h
	}

	get width() { return this.w }
	set width(w) { this.w = w }
	get height() { return this.h }
	set height(h) { this.h = h }
}

export type IntersectionReturn = {
	x: number
	y: number
	edge: 'top' | 'right' | 'bottom' | 'left'
	t: number
	progress?: number
}

export function intersection({
	points,
	bounds = new Rectangle({
		x: 0,
		y: 0,
		w: window.innerWidth,
		h: window.innerHeight,
	}),
	forward = true
}: {
	points: { start: Position, inline: Position }
	bounds?: Rectangle
	forward?: boolean
}) {
	const [ps, pi] = [points.start, points.inline]
	if(ps.x === pi.x && ps.y === pi.y) return null

	const direction = forward ? 1 : -1
	const Δ = {
		x: (pi.x - ps.x) * direction,
		y: (pi.y - ps.y) * direction,
	}

	const intersections: Array<IntersectionReturn> = []

	if(Δ.y !== 0) {
		const t = (bounds.top - ps.y) / Δ.y
		if(t > 0) {
			const x = ps.x + t * Δ.x
			if(x >= bounds.left && x <= bounds.right) {
				intersections.push({ x, y: bounds.top, edge: 'top', t })
			}
		}
	}

	if(Δ.y !== 0) {
		const t = (bounds.bottom - ps.y) / Δ.y
		if(t > 0) {
			const x = ps.x + t * Δ.x
			if(x >= bounds.left && x <= bounds.right) {
				intersections.push({ x, y: bounds.bottom, edge: 'bottom', t })
			}
		}
	}

	if(Δ.x !== 0) {
		const t = (bounds.left - ps.x) / Δ.x
		if(t > 0) {
			const y = ps.y + t * Δ.y
			if(y >= bounds.top && y <= bounds.bottom) {
				intersections.push({ x:bounds.left, y, edge: 'left', t })
			}
		}
	}

	if(Δ.x !== 0) {
		const t = (bounds.right - ps.x) / Δ.x
		if(t > 0) {
			const y = ps.y + t * Δ.y
			if(y >= bounds.top && y <= bounds.bottom) {
				intersections.push({ x: bounds.right, y, edge: 'right', t })
			}
		}
	}

	if (intersections.length > 0) {
		const result = intersections.reduce((min, curr) =>
			curr.t < min.t ? curr : min
		)
		result.progress = (1 / result.t)
		return result
	}

	return null
}