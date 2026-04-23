import { applyMatrix, latexWithLabel, matrixToDataAttribute, type NumericMatrix } from './perspective.js'

export interface ModelViewState {
  modelMatrix: NumericMatrix
  viewMatrix: NumericMatrix
  modelViewMatrix: NumericMatrix
  localPoint: number[]
  worldPoint: number[]
  viewPoint: number[]
  cameraPosition: number[]
  modelLatex: string
  viewLatex: string
  modelViewLatex: string
}

export function computeModelViewState(modelYaw: number, modelX: number, modelZ: number, cameraX: number): ModelViewState {
  const localPoint = [1, 0.8, 0.6, 1]
  const modelMatrix = multiplyMatrices(translation(modelX, 0.2, modelZ), rotationY(modelYaw))
  const cameraPosition = [cameraX, 2.2, 5.2]
  const viewMatrix = lookAtViewMatrix(cameraPosition, [0, 0.4, 0], [0, 1, 0])
  const modelViewMatrix = multiplyMatrices(viewMatrix, modelMatrix)
  const worldPoint = applyMatrix(modelMatrix, localPoint)
  const viewPoint = applyMatrix(modelViewMatrix, localPoint)

  return {
    modelMatrix,
    viewMatrix,
    modelViewMatrix,
    localPoint,
    worldPoint,
    viewPoint,
    cameraPosition,
    modelLatex: latexWithLabel('M_{model}', modelMatrix),
    viewLatex: latexWithLabel('M_{view}', viewMatrix),
    modelViewLatex: latexWithLabel('M_{modelView}', modelViewMatrix),
  }
}

export function multiplyMatrices(left: NumericMatrix, right: NumericMatrix): NumericMatrix {
  const columns = right[0] ?? []
  return left.map((row) =>
    columns.map((_, colIndex) =>
      row.reduce((sum, value, innerIndex) => sum + value * (right[innerIndex]?.[colIndex] ?? 0), 0),
    ),
  )
}

export function translation(x: number, y: number, z: number): NumericMatrix {
  return [
    [1, 0, 0, x],
    [0, 1, 0, y],
    [0, 0, 1, z],
    [0, 0, 0, 1],
  ]
}

export function rotationY(degrees: number): NumericMatrix {
  const theta = (degrees * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  return [
    [cos, 0, sin, 0],
    [0, 1, 0, 0],
    [-sin, 0, cos, 0],
    [0, 0, 0, 1],
  ]
}

export function lookAtViewMatrix(eye: number[], target: number[], up: number[]): NumericMatrix {
  const zAxis = normalize(subtract(eye, target))
  const xAxis = normalize(cross(up, zAxis))
  const yAxis = cross(zAxis, xAxis)

  return [
    [xAxis[0] ?? 0, xAxis[1] ?? 0, xAxis[2] ?? 0, -dot(xAxis, eye)],
    [yAxis[0] ?? 0, yAxis[1] ?? 0, yAxis[2] ?? 0, -dot(yAxis, eye)],
    [zAxis[0] ?? 0, zAxis[1] ?? 0, zAxis[2] ?? 0, -dot(zAxis, eye)],
    [0, 0, 0, 1],
  ]
}

export { matrixToDataAttribute }

function subtract(left: number[], right: number[]) {
  return [(left[0] ?? 0) - (right[0] ?? 0), (left[1] ?? 0) - (right[1] ?? 0), (left[2] ?? 0) - (right[2] ?? 0)]
}

function dot(left: number[], right: number[]) {
  return (left[0] ?? 0) * (right[0] ?? 0) + (left[1] ?? 0) * (right[1] ?? 0) + (left[2] ?? 0) * (right[2] ?? 0)
}

function cross(left: number[], right: number[]) {
  return [
    (left[1] ?? 0) * (right[2] ?? 0) - (left[2] ?? 0) * (right[1] ?? 0),
    (left[2] ?? 0) * (right[0] ?? 0) - (left[0] ?? 0) * (right[2] ?? 0),
    (left[0] ?? 0) * (right[1] ?? 0) - (left[1] ?? 0) * (right[0] ?? 0),
  ]
}

function normalize(vector: number[]) {
  const length = Math.hypot(vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0) || 1
  return [(vector[0] ?? 0) / length, (vector[1] ?? 0) / length, (vector[2] ?? 0) / length]
}
