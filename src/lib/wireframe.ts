import type { DimensionalMode, WireframeMode } from '../types/cg.js'

export type WireframeEdge = [number, number]

const EPSILON = 1e-6
const CUBE_EDGES: WireframeEdge[] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

export function buildWireframeEdges(mode: DimensionalMode, points: number[][], wireframeMode: WireframeMode = 'auto'): WireframeEdge[] {
  const count = points.length

  if (count < 2) {
    return []
  }

  if (count === 2) {
    return [[0, 1]]
  }

  if (wireframeMode === 'sequential') {
    return buildSequentialEdges(count)
  }

  if (wireframeMode === 'cube') {
    return buildCubeEdges(count)
  }

  const spatial = points.map((point) => point.slice(0, mode === '2d' ? 2 : 3))
  const targetDegree = mode === '3d' ? Math.min(3, count - 1) : Math.min(2, count - 1)
  const nearest = Array.from({ length: count }, () => new Set<number>())

  for (let index = 0; index < count; index += 1) {
    const neighbors: Array<{ index: number; distance: number }> = []
    for (let other = 0; other < count; other += 1) {
      if (index === other) continue
      const distance = computeDistance(spatial[index] ?? [], spatial[other] ?? [])
      neighbors.push({ index: other, distance })
    }

    neighbors.sort((left, right) => left.distance - right.distance)
    const thresholdDistance = neighbors[Math.max(0, targetDegree - 1)]?.distance ?? neighbors[neighbors.length - 1]?.distance ?? 0
    for (const neighbor of neighbors) {
      if (neighbor.distance <= thresholdDistance + EPSILON) {
        nearest[index]?.add(neighbor.index)
      }
    }
  }

  const edges: WireframeEdge[] = []
  for (let index = 0; index < count; index += 1) {
    for (let other = index + 1; other < count; other += 1) {
      const isMutual = nearest[index]?.has(other) && nearest[other]?.has(index)
      if (isMutual) {
        edges.push([index, other])
      }
    }
  }

  if (edges.length > 0) {
    return edges
  }

  return buildSequentialEdges(count)
}

function buildCubeEdges(count: number): WireframeEdge[] {
  if (count !== 8) {
    return buildSequentialEdges(count)
  }
  return [...CUBE_EDGES]
}

function buildSequentialEdges(count: number): WireframeEdge[] {
  const edges: WireframeEdge[] = []
  for (let index = 0; index < count - 1; index += 1) {
    edges.push([index, index + 1])
  }
  return edges
}

function computeDistance(left: number[], right: number[]) {
  const size = Math.max(left.length, right.length)
  let total = 0
  for (let index = 0; index < size; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0)
    total += delta * delta
  }
  return Math.sqrt(total)
}