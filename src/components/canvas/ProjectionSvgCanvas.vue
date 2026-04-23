<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectionAxis, ProjectionEdge } from '../../lib/projection'

const props = defineProps<{
  points: number[][]
  edges: ProjectionEdge[]
  axes: ProjectionAxis[]
}>()

const viewWidth = 760
const viewHeight = 520
const padding = 58

const projectedAxisColors: Record<ProjectionAxis['label'], string> = {
  x: '#e24c4b',
  y: '#1d9b78',
  z: '#2f67ff',
}

const drawablePoints = computed(() => [
  ...props.points,
  [0, 0],
  ...props.axes.map((axis) => axis.end),
])

const bounds = computed(() => {
  const prepared = drawablePoints.value.map(([x = 0, y = 0]) => [x, -y])
  const xs = prepared.map((point) => point[0] ?? 0)
  const ys = prepared.map((point) => point[1] ?? 0)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  const scale = Math.min((viewWidth - padding * 2) / width, (viewHeight - padding * 2) / height)

  return { minX, minY, scale }
})

function mapPoint(point: number[]) {
  const x = point[0] ?? 0
  const y = -(point[1] ?? 0)
  return {
    x: padding + (x - bounds.value.minX) * bounds.value.scale,
    y: padding + (y - bounds.value.minY) * bounds.value.scale,
  }
}

function edgeLine(edge: ProjectionEdge) {
  const start = mapPoint(props.points[edge[0]] ?? [])
  const end = mapPoint(props.points[edge[1]] ?? [])
  return { start, end }
}

function axisLine(axis: ProjectionAxis) {
  return {
    start: mapPoint([0, 0]),
    end: mapPoint(axis.end),
  }
}
</script>

<template>
  <div class="projection-stage" data-testid="projection-svg-wrap">
    <svg
      data-testid="projection-svg"
      :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
      role="img"
      aria-label="Orthographic screen projection of a house model after Oy then X rotations"
    >
      <rect class="plane" x="1" y="1" :width="viewWidth - 2" :height="viewHeight - 2" rx="8" />
      <g class="grid-lines">
        <line v-for="x in 11" :key="`v-${x}`" :x1="x * 64" y1="28" :x2="x * 64" :y2="viewHeight - 28" />
        <line v-for="y in 7" :key="`h-${y}`" x1="28" :y1="y * 62" :x2="viewWidth - 28" :y2="y * 62" />
      </g>
      <g class="axes">
        <g v-for="axis in axes" :key="axis.label">
          <line
            :x1="axisLine(axis).start.x"
            :y1="axisLine(axis).start.y"
            :x2="axisLine(axis).end.x"
            :y2="axisLine(axis).end.y"
            :stroke="projectedAxisColors[axis.label]"
          />
          <text :x="axisLine(axis).end.x + 8" :y="axisLine(axis).end.y - 8" :fill="projectedAxisColors[axis.label]">
            {{ axis.label }}
          </text>
        </g>
      </g>
      <g class="house-lines">
        <line
          v-for="(edge, index) in edges"
          :key="index"
          :x1="edgeLine(edge).start.x"
          :y1="edgeLine(edge).start.y"
          :x2="edgeLine(edge).end.x"
          :y2="edgeLine(edge).end.y"
        />
      </g>
      <g class="vertices">
        <circle v-for="(point, index) in points.slice(0, 10)" :key="index" :cx="mapPoint(point).x" :cy="mapPoint(point).y" r="3" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.projection-stage {
  width: 100%;
  min-width: 0;
}

svg {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f8faff;
}

.plane {
  fill: #f8faff;
}

.grid-lines line {
  stroke: color-mix(in srgb, var(--border) 58%, transparent);
  stroke-width: 1;
}

.axes line {
  stroke-width: 4;
  stroke-linecap: round;
}

.axes text {
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
}

.house-lines line {
  stroke: var(--text-main);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.vertices circle {
  fill: var(--accent);
}
</style>
