import type { DimensionalMode, TransformItem } from '../types/cg.js'

type NumericMatrix = number[][]

interface ParsedTransformData {
  matrix: NumericMatrix
  matrixLatex: string
}

export interface FrameState {
  origin: number[]
  axes: number[][]
}

export interface AffineComputation {
  matrices: NumericMatrix[]
  matrixLatexList: string[]
  cumulativeMatrices: NumericMatrix[]
  stepPoints: number[][][]
  frameSteps: FrameState[]
  compositeMatrix: NumericMatrix
  compositeLatex: string
}

const AXIS_LENGTH = 24

export function computeAffineState(mode: DimensionalMode, points: number[][], transforms: TransformItem[], localOrigin: number[]): AffineComputation {
  const safePoints = ensurePoints(mode, points)
  const parsed = transforms.map((item) => parseTransform(mode, item))
  const matrices = parsed.map((item) => item.matrix)
  const matrixLatexList = parsed.map((item) => item.matrixLatex)

  const cumulativeMatrices: NumericMatrix[] = []
  let running = identityMatrix(mode)
  for (const matrix of matrices) {
    running = multiplyMatrices(matrix, running)
    cumulativeMatrices.push(running)
  }

  const stepPoints = cumulativeMatrices.map((matrix) => safePoints.map((point) => applyMatrix(matrix, point)))
  const frameSteps = cumulativeMatrices.map((matrix) => frameFromMatrix(mode, matrix, localOrigin))
  const compositeMatrix = cumulativeMatrices.length > 0 ? (cumulativeMatrices[cumulativeMatrices.length - 1] as NumericMatrix) : identityMatrix(mode)

  return {
    matrices,
    matrixLatexList,
    cumulativeMatrices,
    stepPoints,
    frameSteps,
    compositeMatrix,
    compositeLatex: latexWithLabel('M', compositeMatrix),
  }
}

export function defaultFrame(mode: DimensionalMode, localOrigin: number[]) {
  return frameFromMatrix(mode, identityMatrix(mode), localOrigin)
}

function ensurePoints(mode: DimensionalMode, points: number[][]) {
  return points.map((point) => {
    if (mode === '2d') {
      return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 1]
    }
    return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0, point[3] ?? 1]
  })
}

function frameFromMatrix(mode: DimensionalMode, matrix: NumericMatrix, localOrigin: number[]): FrameState {
  if (mode === '2d') {
    const ox = localOrigin[0] ?? 0
    const oy = localOrigin[1] ?? 0
    const origin = applyMatrix(matrix, [ox, oy, 1])
    const xAxis = applyMatrix(matrix, [ox + AXIS_LENGTH, oy, 1])
    const yAxis = applyMatrix(matrix, [ox, oy + AXIS_LENGTH, 1])

    return {
      origin: [origin[0] ?? 0, origin[1] ?? 0],
      axes: [
        [xAxis[0] ?? 0, xAxis[1] ?? 0],
        [yAxis[0] ?? 0, yAxis[1] ?? 0],
      ],
    }
  }

  const ox = localOrigin[0] ?? 0
  const oy = localOrigin[1] ?? 0
  const oz = localOrigin[2] ?? 0
  const origin = applyMatrix(matrix, [ox, oy, oz, 1])
  const xAxis = applyMatrix(matrix, [ox + 1, oy, oz, 1])
  const yAxis = applyMatrix(matrix, [ox, oy + 1, oz, 1])
  const zAxis = applyMatrix(matrix, [ox, oy, oz + 1, 1])

  return {
    origin: [origin[0] ?? 0, origin[1] ?? 0, origin[2] ?? 0],
    axes: [
      [xAxis[0] ?? 0, xAxis[1] ?? 0, xAxis[2] ?? 0],
      [yAxis[0] ?? 0, yAxis[1] ?? 0, yAxis[2] ?? 0],
      [zAxis[0] ?? 0, zAxis[1] ?? 0, zAxis[2] ?? 0],
    ],
  }
}

function parseTransform(mode: DimensionalMode, item: TransformItem): ParsedTransformData {
  const tokens = parseParams(item.params)

  if (mode === '2d') {
    switch (item.type) {
      case 'translate': {
        const dx = pick(tokens, ['dx', 'x'], 0)
        const dy = pick(tokens, ['dy', 'y'], 0)
        return fromMatrix([
          [1, 0, dx],
          [0, 1, dy],
          [0, 0, 1],
        ])
      }
      case 'rotate': {
        const theta = degreesToRadians(pick(tokens, ['theta', 'angle'], 0))
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)
        return fromMatrix([
          [cos, -sin, 0],
          [sin, cos, 0],
          [0, 0, 1],
        ])
      }
      case 'scale': {
        const sx = pick(tokens, ['sx', 'x'], 1)
        const sy = pick(tokens, ['sy', 'y'], 1)
        return fromMatrix([
          [sx, 0, 0],
          [0, sy, 0],
          [0, 0, 1],
        ])
      }
      case 'shear': {
        const shx = pick(tokens, ['shx', 'x'], 0)
        const shy = pick(tokens, ['shy', 'y'], 0)
        return fromMatrix([
          [1, shx, 0],
          [shy, 1, 0],
          [0, 0, 1],
        ])
      }
      case 'reflect': {
        const axis = parseAxis(item.params, ['x', 'y'], 'x')
        return axis === 'y'
          ? fromMatrix([
              [-1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ])
          : fromMatrix([
              [1, 0, 0],
              [0, -1, 0],
              [0, 0, 1],
            ])
      }
      default:
        throw new Error(`Unsupported 2D transform type: ${String(item.type)}`)
    }
  }

  switch (item.type) {
    case 'translate': {
      const dx = pick(tokens, ['dx', 'x'], 0)
      const dy = pick(tokens, ['dy', 'y'], 0)
      const dz = pick(tokens, ['dz', 'z'], 0)
      return fromMatrix([
        [1, 0, 0, dx],
        [0, 1, 0, dy],
        [0, 0, 1, dz],
        [0, 0, 0, 1],
      ])
    }
    case 'rotate': {
      const theta = degreesToRadians(pick(tokens, ['theta', 'angle'], 0))
      const axis = parseAxis(item.params, ['x', 'y', 'z'], 'y')
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      if (axis === 'x') {
        return fromMatrix([
          [1, 0, 0, 0],
          [0, cos, -sin, 0],
          [0, sin, cos, 0],
          [0, 0, 0, 1],
        ])
      }
      if (axis === 'z') {
        return fromMatrix([
          [cos, -sin, 0, 0],
          [sin, cos, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ])
      }
      return fromMatrix([
        [cos, 0, sin, 0],
        [0, 1, 0, 0],
        [-sin, 0, cos, 0],
        [0, 0, 0, 1],
      ])
    }
    case 'scale': {
      const sx = pick(tokens, ['sx', 'x'], 1)
      const sy = pick(tokens, ['sy', 'y'], 1)
      const sz = pick(tokens, ['sz', 'z'], 1)
      return fromMatrix([
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1],
      ])
    }
    case 'shear': {
      const shxy = pick(tokens, ['shxy'], 0)
      const shxz = pick(tokens, ['shxz'], 0)
      const shyx = pick(tokens, ['shyx'], 0)
      const shyz = pick(tokens, ['shyz'], 0)
      const shzx = pick(tokens, ['shzx'], 0)
      const shzy = pick(tokens, ['shzy'], 0)
      return fromMatrix([
        [1, shxy, shxz, 0],
        [shyx, 1, shyz, 0],
        [shzx, shzy, 1, 0],
        [0, 0, 0, 1],
      ])
    }
    case 'reflect': {
      const axis = parseAxis(item.params, ['x', 'y', 'z'], 'z')
      if (axis === 'x') {
        return fromMatrix([
          [-1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ])
      }
      if (axis === 'y') {
        return fromMatrix([
          [1, 0, 0, 0],
          [0, -1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ])
      }
      return fromMatrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, 1],
      ])
    }
    default:
      throw new Error(`Unsupported 3D transform type: ${String(item.type)}`)
  }
}

function fromMatrix(matrix: NumericMatrix): ParsedTransformData {
  return {
    matrix,
    matrixLatex: latexMatrix(matrix),
  }
}

function parseParams(input: string) {
  const pairs = input.matchAll(/([a-zA-Z_]+)\s*=\s*(-?\d+(?:\.\d+)?)/g)
  const map = new Map<string, number>()
  for (const match of pairs) {
    const key = match[1]?.toLowerCase()
    const value = Number(match[2])
    if (key && Number.isFinite(value)) {
      map.set(key, value)
    }
  }
  return map
}

function parseAxis(input: string, allowed: string[], fallback: string) {
  const match = input.match(/axis\s*=\s*([a-z])/i)
  const axis = match?.[1]?.toLowerCase()
  return axis && allowed.includes(axis) ? axis : fallback
}

function pick(tokens: Map<string, number>, keys: string[], fallback: number) {
  for (const key of keys) {
    const found = tokens.get(key)
    if (typeof found === 'number') {
      return found
    }
  }
  return fallback
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function identityMatrix(mode: DimensionalMode): NumericMatrix {
  return mode === '2d'
    ? [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]
    : [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ]
}

function multiplyMatrices(left: NumericMatrix, right: NumericMatrix): NumericMatrix {
  const columns = right[0] ?? []
  return left.map((row) =>
    columns.map((_, colIndex) =>
      row.reduce((sum, value, innerIndex) => sum + value * (right[innerIndex]?.[colIndex] ?? 0), 0),
    ),
  )
}

function applyMatrix(matrix: NumericMatrix, point: number[]) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * (point[index] ?? 0), 0))
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
  const fixed = rounded.toFixed(2)
  return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}