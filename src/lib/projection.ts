export type ProjectionKind = 'isometric' | 'dimetric' | 'trimetric'

export type NumericMatrix = number[][]

export interface ProjectionPreset {
  id: string
  kind: ProjectionKind
  label: string
  summary: string
  yAngle: number
  xAngle: number
}

export interface ProjectionAxis {
  label: 'x' | 'y' | 'z'
  end: number[]
  shortening: number
}

export interface ProjectionState {
  rotationYMatrix: NumericMatrix
  rotationXMatrix: NumericMatrix
  projectionMatrix: NumericMatrix
  finalMatrix: NumericMatrix
  rotationYLatex: string
  rotationXLatex: string
  projectionLatex: string
  finalLatex: string
  projectedPoints: number[][]
  axes: ProjectionAxis[]
}

export type ProjectionEdge = [number, number]

export const AXONOMETRIC_PRESETS: ProjectionPreset[] = [
  {
    id: 'isometric',
    kind: 'isometric',
    label: 'Isometric',
    summary: 'Equal shortening on the x, y, and z axes.',
    yAngle: 45,
    xAngle: 35.264,
  },
  {
    id: 'dimetric',
    kind: 'dimetric',
    label: 'Dimetric',
    summary: 'Two axes share the same shortening, while the third differs.',
    yAngle: 45,
    xAngle: 20,
  },
  {
    id: 'trimetric-a',
    kind: 'trimetric',
    label: 'Trimetric Example A',
    summary: 'Class preset A: rotate 45 deg around Oy, then 35 deg around X.',
    yAngle: 45,
    xAngle: 35,
  },
  {
    id: 'trimetric-b',
    kind: 'trimetric',
    label: 'Trimetric Example B',
    summary: 'Class preset B: rotate 60 deg around Oy, then 25 deg around X.',
    yAngle: 60,
    xAngle: 25,
  },
  {
    id: 'trimetric-c',
    kind: 'trimetric',
    label: 'Trimetric Example C',
    summary: 'Class preset C: rotate 30 deg around Oy, then 50 deg around X.',
    yAngle: 30,
    xAngle: 50,
  },
]

export const PROJECTION_MODEL_POINTS: number[][] = [
  [0, 0, 0, 1],
  [2, 0, 0, 1],
  [2, 1.4, 0, 1],
  [0, 1.4, 0, 1],
  [0, 0, 1.4, 1],
  [2, 0, 1.4, 1],
  [2, 1.4, 1.4, 1],
  [0, 1.4, 1.4, 1],
  [1, 2.25, 0, 1],
  [1, 2.25, 1.4, 1],
  [0.35, 0, 0, 1],
  [0.35, 0.75, 0, 1],
  [0.75, 0.75, 0, 1],
  [0.75, 0, 0, 1],
  [1.28, 0.72, 0, 1],
  [1.72, 0.72, 0, 1],
  [1.72, 1.12, 0, 1],
  [1.28, 1.12, 0, 1],
]

export const PROJECTION_MODEL_EDGES: ProjectionEdge[] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
  [3, 8], [8, 2], [7, 9], [9, 6], [8, 9],
  [10, 11], [11, 12], [12, 13],
  [14, 15], [15, 16], [16, 17], [17, 14],
]

const AXIS_LENGTH = 2.8

export function computeProjectionState(yAngle: number, xAngle: number, points: number[][] = PROJECTION_MODEL_POINTS): ProjectionState {
  const rotationYMatrix = rotationY(yAngle)
  const rotationXMatrix = rotationX(xAngle)
  const projectionMatrix = orthographicProjectionMatrix()
  const finalMatrix = multiplyMatrices(projectionMatrix, multiplyMatrices(rotationXMatrix, rotationYMatrix))
  const projectedPoints = points.map((point) => toScreenPoint(applyMatrix(finalMatrix, ensurePoint(point))))
  const axes = buildProjectedAxes(finalMatrix)

  return {
    rotationYMatrix,
    rotationXMatrix,
    projectionMatrix,
    finalMatrix,
    rotationYLatex: latexWithLabel('R_y', rotationYMatrix),
    rotationXLatex: latexWithLabel('R_x', rotationXMatrix),
    projectionLatex: latexWithLabel('P', projectionMatrix),
    finalLatex: latexWithLabel('M', finalMatrix),
    projectedPoints,
    axes,
  }
}

export function rotationY(degrees: number): NumericMatrix {
  const theta = degreesToRadians(degrees)
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  return [
    [cos, 0, sin, 0],
    [0, 1, 0, 0],
    [-sin, 0, cos, 0],
    [0, 0, 0, 1],
  ]
}

export function rotationX(degrees: number): NumericMatrix {
  const theta = degreesToRadians(degrees)
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  return [
    [1, 0, 0, 0],
    [0, cos, -sin, 0],
    [0, sin, cos, 0],
    [0, 0, 0, 1],
  ]
}

export function orthographicProjectionMatrix(): NumericMatrix {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1],
  ]
}

export function multiplyMatrices(left: NumericMatrix, right: NumericMatrix): NumericMatrix {
  const columns = right[0] ?? []
  return left.map((row) =>
    columns.map((_, colIndex) =>
      row.reduce((sum, value, innerIndex) => sum + value * (right[innerIndex]?.[colIndex] ?? 0), 0),
    ),
  )
}

export function applyMatrix(matrix: NumericMatrix, point: number[]) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * (point[index] ?? 0), 0))
}

export function matrixToDataAttribute(matrix: NumericMatrix) {
  return matrix.map((row) => row.map(formatNumber).join(',')).join(';')
}

function buildProjectedAxes(finalMatrix: NumericMatrix): ProjectionAxis[] {
  const origin = toScreenPoint(applyMatrix(finalMatrix, [0, 0, 0, 1]))
  const axisDefinitions: Array<{ label: ProjectionAxis['label']; point: number[] }> = [
    { label: 'x', point: [AXIS_LENGTH, 0, 0, 1] },
    { label: 'y', point: [0, AXIS_LENGTH, 0, 1] },
    { label: 'z', point: [0, 0, AXIS_LENGTH, 1] },
  ]

  return axisDefinitions.map((axis) => {
    const end = toScreenPoint(applyMatrix(finalMatrix, axis.point))
    return {
      label: axis.label,
      end,
      shortening: distance2d(origin, end) / AXIS_LENGTH,
    }
  })
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

function ensurePoint(point: number[]) {
  return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0, point[3] ?? 1]
}

function toScreenPoint(point: number[]) {
  return [point[0] ?? 0, point[1] ?? 0]
}

function distance2d(left: number[], right: number[]) {
  const dx = (left[0] ?? 0) - (right[0] ?? 0)
  const dy = (left[1] ?? 0) - (right[1] ?? 0)
  return Math.sqrt(dx * dx + dy * dy)
}

function latexWithLabel(label: string, matrix: NumericMatrix) {
  return `${label} = ${latexMatrix(matrix)}`
}

function latexMatrix(matrix: NumericMatrix) {
  const rows = matrix.map((row) => row.map(formatNumber).join('&')).join('\\\\')
  return String.raw`\begin{bmatrix}${rows}\end{bmatrix}`
}

function formatNumber(value: number) {
  const rounded = Math.abs(value) < 1e-9 ? 0 : value
  const fixed = rounded.toFixed(3)
  return fixed.replace(/\.000$/, '').replace(/(\.\d*?)0+$/, '$1')
}
