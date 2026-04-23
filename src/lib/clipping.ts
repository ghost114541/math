import {
  applyMatrix,
  latexWithLabel,
  matrixToDataAttribute,
  perspectiveDivide3d,
  standardPerspectiveMatrix,
  type NumericMatrix,
} from './perspective.js'

export type ClipStatus = 'inside' | 'outside' | 'intersecting'
export type ClipPlane = 'left' | 'right' | 'bottom' | 'top' | 'near' | 'far'

export interface ClippingState {
  fov: number
  near: number
  far: number
  projectionMatrix: NumericMatrix
  viewTriangle: number[][]
  clipTriangle: number[][]
  clippedTriangle: number[][]
  ndcTriangle: number[][]
  lineClip: {
    before: number[][]
    after: number[][]
    status: ClipStatus
  }
  triangleStatus: ClipStatus
  pointStatuses: ClipStatus[]
  projectionLatex: string
}

const PLANES: ClipPlane[] = ['left', 'right', 'bottom', 'top', 'near', 'far']

export function computeClippingState(fov: number, near: number, far: number, offsetX: number): ClippingState {
  const safeNear = Math.max(0.1, near)
  const safeFar = Math.max(safeNear + 0.5, far)
  const projectionMatrix = standardPerspectiveMatrix(fov, 1, safeNear, safeFar)
  const viewTriangle = [
    [-0.9 + offsetX, -0.65, -1.6, 1],
    [1.2 + offsetX, -0.45, -2.8, 1],
    [0.1 + offsetX, 0.95, -4.4, 1],
  ]
  const clipTriangle = viewTriangle.map((point) => applyMatrix(projectionMatrix, point))
  const clippedTriangle = clipPolygon(clipTriangle)
  const ndcTriangle = clippedTriangle.map(perspectiveDivide3d)
  const lineView = [
    [-1.4 + offsetX, 0.15, -1.2, 1],
    [1.5 + offsetX, 0.42, -3.5, 1],
  ]
  const lineClipBefore = lineView.map((point) => applyMatrix(projectionMatrix, point))
  const lineClipAfter = clipLineSegment(lineClipBefore[0] ?? [0, 0, 0, 1], lineClipBefore[1] ?? [0, 0, 0, 1])
  const pointStatuses = clipTriangle.map(classifyPoint)

  return {
    fov,
    near: safeNear,
    far: safeFar,
    projectionMatrix,
    viewTriangle,
    clipTriangle,
    clippedTriangle,
    ndcTriangle,
    lineClip: {
      before: lineClipBefore,
      after: lineClipAfter,
      status: classifyPrimitive(lineClipBefore, lineClipAfter),
    },
    triangleStatus: classifyPrimitive(clipTriangle, clippedTriangle),
    pointStatuses,
    projectionLatex: latexWithLabel('P_{std}', projectionMatrix),
  }
}

export function classifyPoint(point: number[]): ClipStatus {
  return PLANES.every((plane) => signedDistance(plane, point) >= -1e-9) ? 'inside' : 'outside'
}

export function classifyPrimitive(original: number[][], clipped: number[][]): ClipStatus {
  if (clipped.length === 0) return 'outside'
  if (original.length === clipped.length && original.every((point) => classifyPoint(point) === 'inside')) return 'inside'
  return 'intersecting'
}

export function clipLineSegment(start: number[], end: number[]) {
  let segment = [start, end]

  for (const plane of PLANES) {
    if (segment.length < 2) return []
    const clipped = clipPolygonAgainstPlane(segment, plane)
    if (clipped.length === 0) return []
    segment = clipped.length > 2 ? [clipped[0] ?? start, clipped[clipped.length - 1] ?? end] : clipped
  }

  return segment
}

export function clipPolygon(points: number[][]) {
  return PLANES.reduce((subject, plane) => clipPolygonAgainstPlane(subject, plane), points)
}

export { matrixToDataAttribute }

function clipPolygonAgainstPlane(points: number[][], plane: ClipPlane) {
  if (points.length === 0) return []
  const result: number[][] = []

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index] ?? [0, 0, 0, 1]
    const previous = points[(index + points.length - 1) % points.length] ?? current
    const currentInside = signedDistance(plane, current) >= -1e-9
    const previousInside = signedDistance(plane, previous) >= -1e-9

    if (currentInside) {
      if (!previousInside) result.push(intersect(previous, current, plane))
      result.push(current)
    } else if (previousInside) {
      result.push(intersect(previous, current, plane))
    }
  }

  return result
}

function intersect(start: number[], end: number[], plane: ClipPlane) {
  const startDistance = signedDistance(plane, start)
  const endDistance = signedDistance(plane, end)
  const denominator = startDistance - endDistance
  const t = Math.abs(denominator) < 1e-9 ? 0 : startDistance / denominator

  return start.map((value, index) => value + t * ((end[index] ?? 0) - value))
}

function signedDistance(plane: ClipPlane, point: number[]) {
  const x = point[0] ?? 0
  const y = point[1] ?? 0
  const z = point[2] ?? 0
  const w = point[3] ?? 1

  switch (plane) {
    case 'left':
      return x + w
    case 'right':
      return w - x
    case 'bottom':
      return y + w
    case 'top':
      return w - y
    case 'near':
      return z + w
    case 'far':
      return w - z
  }
}
