export type NumericMatrix = number[][]

export interface PerspectiveState {
  distance: number
  viewPoint: number[]
  geometricMatrix: NumericMatrix
  standardMatrix: NumericMatrix
  homogeneousPoint: number[]
  functionPoint: number[]
  matrixPoint: number[]
  ndcPoint: number[]
  functionLatex: string
  geometricLatex: string
  standardLatex: string
}

export function computePerspectiveState(distance: number, zView: number, xView: number, yView: number): PerspectiveState {
  const safeDistance = Math.max(0.1, distance)
  const safeZ = zView < -0.05 ? zView : -0.05
  const viewPoint = [xView, yView, safeZ, 1]
  const geometricMatrix = onePointPerspectiveMatrix(safeDistance)
  const standardMatrix = standardPerspectiveMatrix(60, 1, 0.5, 12)
  const homogeneousPoint = applyMatrix(geometricMatrix, viewPoint)
  const matrixPoint = perspectiveDivide2d(homogeneousPoint)
  const positiveDepth = -safeZ
  const functionPoint = [
    (safeDistance * xView) / positiveDepth,
    (safeDistance * yView) / positiveDepth,
  ]
  const ndcPoint = perspectiveDivide3d(applyMatrix(standardMatrix, viewPoint))

  return {
    distance: safeDistance,
    viewPoint,
    geometricMatrix,
    standardMatrix,
    homogeneousPoint,
    functionPoint,
    matrixPoint,
    ndcPoint,
    functionLatex: String.raw`x_p=\frac{d x_{view}}{s}=-\frac{d x_{view}}{z_{view}},\quad y_p=\frac{d y_{view}}{s}=-\frac{d y_{view}}{z_{view}},\quad s=-z_{view}>0`,
    geometricLatex: latexWithLabel('G_{1p}', geometricMatrix),
    standardLatex: latexWithLabel('P_{std}', standardMatrix),
  }
}

export function onePointPerspectiveMatrix(distance: number): NumericMatrix {
  return [
    [distance, 0, 0, 0],
    [0, distance, 0, 0],
    [0, 0, 1, 0],
    [0, 0, -1, 0],
  ]
}

export function standardPerspectiveMatrix(fovYDegrees: number, aspect: number, near: number, far: number): NumericMatrix {
  const f = 1 / Math.tan((fovYDegrees * Math.PI) / 360)
  const nf = 1 / (near - far)

  return [
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, (far + near) * nf, 2 * far * near * nf],
    [0, 0, -1, 0],
  ]
}

export function applyMatrix(matrix: NumericMatrix, point: number[]) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * (point[index] ?? 0), 0))
}

export function perspectiveDivide2d(point: number[]) {
  const w = point[3] ?? 1
  if (Math.abs(w) < 1e-9) return [0, 0]
  return [(point[0] ?? 0) / w, (point[1] ?? 0) / w]
}

export function perspectiveDivide3d(point: number[]) {
  const w = point[3] ?? 1
  if (Math.abs(w) < 1e-9) return [0, 0, 0]
  return [(point[0] ?? 0) / w, (point[1] ?? 0) / w, (point[2] ?? 0) / w]
}

export function matrixToDataAttribute(matrix: NumericMatrix) {
  return matrix.map((row) => row.map(formatNumber).join(',')).join(';')
}

export function latexWithLabel(label: string, matrix: NumericMatrix) {
  return `${label} = ${latexMatrix(matrix)}`
}

export function latexMatrix(matrix: NumericMatrix) {
  const rows = matrix.map((row) => row.map(formatNumber).join('&')).join('\\\\')
  return String.raw`\begin{bmatrix}${rows}\end{bmatrix}`
}

export function formatNumber(value: number) {
  const rounded = Math.abs(value) < 1e-9 ? 0 : value
  const fixed = rounded.toFixed(3)
  return fixed.replace(/\.000$/, '').replace(/(\.\d*?)0+$/, '$1')
}
