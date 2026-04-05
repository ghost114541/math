<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FrameState } from '../../lib/affine'
import type { LocalFrameState } from '../../types/cg'

const props = defineProps<{
  currentStep: number
  totalSteps: number
  basePoints: number[][]
  currentPoints: number[][]
  finalPoints: number[][]
  currentFrame: FrameState
  finalFrame: FrameState
  localFrame: LocalFrameState
}>()

interface P5Like {
  CLOSE: unknown
  drawingContext: unknown
  width: number
  height: number
  setup?: () => void
  draw?: () => void
  push: () => void
  pop: () => void
  stroke: (...args: unknown[]) => void
  fill: (...args: unknown[]) => void
  strokeWeight: (value: number) => void
  beginShape: () => void
  vertex: (x: number, y: number) => void
  endShape: (mode?: unknown) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  background: (value: number) => void
  translate: (x: number, y: number) => void
  noLoop: () => void
  createCanvas: (width: number, height: number) => void
  noStroke: () => void
  textSize: (value: number) => void
  text: (value: string, x: number, y: number) => void
}

interface P5Instance {
  redraw: () => void
  remove: () => void
}

const host = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
let sketch: P5Instance | null = null

function drawPolyline(s: P5Like, points: number[][], options: { stroke: string; fill: string; weight: number }) {
  if (points.length === 0) return
  s.push()
  s.stroke(options.stroke)
  s.fill(options.fill)
  s.strokeWeight(options.weight)
  s.beginShape()
  for (const point of points) {
    s.vertex(point[0] ?? 0, -(point[1] ?? 0))
  }
  s.endShape(s.CLOSE)
  s.pop()
}

function drawFrame(s: P5Like, frame: FrameState, xColor: string, yColor: string) {
  const origin = frame.origin
  const xAxis = frame.axes[0]
  const yAxis = frame.axes[1]
  if (!origin || !xAxis || !yAxis) return

  s.push()
  s.strokeWeight(2.5)
  s.stroke(xColor)
  s.line(origin[0] ?? 0, -(origin[1] ?? 0), xAxis[0] ?? 0, -(xAxis[1] ?? 0))
  s.stroke(yColor)
  s.line(origin[0] ?? 0, -(origin[1] ?? 0), yAxis[0] ?? 0, -(yAxis[1] ?? 0))
  s.pop()
}

onMounted(async () => {
  if (!host.value) return

  try {
    const p5Module = await import('p5')
    const P5 = p5Module.default as unknown as new (sketch: (s: P5Like) => void, node?: HTMLElement) => P5Instance
    const sketchFactory = (s: P5Like) => {
      s.setup = () => {
        s.createCanvas(900, 650)
        s.noLoop()
      }

      s.draw = () => {
        const ctx = s.drawingContext as CanvasRenderingContext2D

        s.background(248)
        s.translate(s.width / 2, s.height / 2)

        s.stroke(190)
        s.strokeWeight(1)
        ctx.setLineDash([5, 5])
        s.line(-430, 0, 430, 0)
        s.line(0, -300, 0, 300)
        ctx.setLineDash([])

        if (props.localFrame.showWorld) {
          s.stroke(223, 67, 74)
          s.line(0, 0, 220, 0)
          s.stroke(39, 160, 98)
          s.line(0, 0, 0, -220)
        }

        drawPolyline(s, props.finalPoints, {
          stroke: 'rgba(28, 102, 255, 0.28)',
          fill: 'rgba(28, 102, 255, 0.08)',
          weight: 2,
        })

        drawPolyline(s, props.basePoints, {
          stroke: 'rgba(130, 140, 160, 0.9)',
          fill: 'rgba(130, 140, 160, 0.12)',
          weight: 1.5,
        })

        drawPolyline(s, props.currentPoints, {
          stroke: 'rgba(28, 102, 255, 1)',
          fill: 'rgba(28, 102, 255, 0.28)',
          weight: 2.5,
        })

        if (props.localFrame.showLocal) {
          drawFrame(s, props.finalFrame, 'rgba(255, 146, 48, 0.25)', 'rgba(73, 94, 255, 0.25)')
          drawFrame(s, props.currentFrame, 'rgba(255, 146, 48, 1)', 'rgba(73, 94, 255, 1)')
        }

        s.noStroke()
        s.fill(50)
        s.textSize(14)
        s.text(`Step ${Math.min(props.currentStep + 1, Math.max(props.totalSteps, 1))} / ${Math.max(props.totalSteps, 1)}`, -420, -300)
        s.text('2D Affine Transform Preview (p5.js)', 185, -300)
      }
    }

    sketch = new P5(sketchFactory, host.value)
    isLoading.value = false
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load p5 canvas.'
    isLoading.value = false
  }
})

watch(
  () => [props.currentStep, props.basePoints, props.currentPoints, props.finalPoints, props.currentFrame, props.finalFrame, props.localFrame.showWorld, props.localFrame.showLocal],
  () => {
    sketch?.redraw()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  sketch?.remove()
  sketch = null
})
</script>

<template>
  <div class="canvas-shell">
    <div v-if="isLoading" class="canvas-message">Loading p5.js canvas...</div>
    <div v-else-if="loadError" class="canvas-message error">{{ loadError }}</div>
    <div v-show="!isLoading && !loadError" class="canvas-host" ref="host" />
  </div>
</template>

<style scoped>
.canvas-shell {
  width: 100%;
}

.canvas-host {
  width: 100%;
  display: grid;
  place-items: center;
}

.canvas-message {
  width: min(100%, 900px);
  min-height: 420px;
  display: grid;
  place-items: center;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #f8f8f8;
  color: var(--text-dim);
  font-size: 0.92rem;
}

.canvas-message.error {
  color: #a33a3a;
}

.canvas-host :deep(canvas) {
  width: min(100%, 900px);
  height: auto;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #f8f8f8;
}
</style>