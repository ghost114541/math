<script setup lang="ts">
import { computed, ref } from 'vue'
import MatrixCard from '../components/math/MatrixCard.vue'
import { computePerspectiveState, formatNumber, matrixToDataAttribute } from '../lib/perspective'

const distance = ref(2)
const xView = ref(0.9)
const yView = ref(0.45)
const zView = ref(-4)

const state = computed(() => computePerspectiveState(distance.value, zView.value, xView.value, yView.value))
const matrixData = computed(() => matrixToDataAttribute(state.value.geometricMatrix))
const agreement = computed(() => {
  const [fx, fy] = state.value.functionPoint
  const [mx, my] = state.value.matrixPoint
  return Math.abs((fx ?? 0) - (mx ?? 0)) < 1e-6 && Math.abs((fy ?? 0) - (my ?? 0)) < 1e-6
})

const camera = { x: 650, y: 210 }
const planeX = computed(() => camera.x - state.value.distance * 78)
const pointSvg = computed(() => ({ x: camera.x + zView.value * 78, y: camera.y - xView.value * 82 }))
const projectedSvg = computed(() => ({ x: planeX.value, y: camera.y - (state.value.matrixPoint[0] ?? 0) * 82 }))

function numberList(values: number[]) {
  return values.map((value) => formatNumber(value)).join(', ')
}
</script>

<template>
  <section class="teaching-page" data-testid="perspective-one-point-view">
    <section class="workspace">
      <aside class="controls">
        <div class="section-kicker">One-Point Perspective</div>
        <h3>Coordinate Convention First</h3>
        <p class="note" data-testid="perspective-convention-note">
          Column vectors are used. The camera is at the origin, looks along -Z, and visible points have z_view &lt; 0. Positive depth is s = -z_view.
        </p>

        <div class="field-grid">
          <label>
            <span>Projection plane distance d</span>
            <input data-testid="perspective-distance" type="number" step="0.1" min="0.1" v-model.number="distance" />
            <input type="range" min="0.5" max="4" step="0.1" v-model.number="distance" />
          </label>
          <label>
            <span>x_view</span>
            <input data-testid="perspective-x" type="number" step="0.1" v-model.number="xView" />
            <input type="range" min="-2" max="2" step="0.1" v-model.number="xView" />
          </label>
          <label>
            <span>y_view</span>
            <input data-testid="perspective-y" type="number" step="0.1" v-model.number="yView" />
            <input type="range" min="-1.5" max="1.5" step="0.1" v-model.number="yView" />
          </label>
          <label>
            <span>z_view</span>
            <input data-testid="perspective-z" type="number" step="0.1" max="-0.1" v-model.number="zView" />
            <input type="range" min="-7" max="-0.5" step="0.1" v-model.number="zView" />
          </label>
        </div>

        <dl class="metric-grid">
          <div>
            <dt>Function point</dt>
            <dd data-testid="perspective-function-point">{{ numberList(state.functionPoint) }}</dd>
          </div>
          <div>
            <dt>Matrix point</dt>
            <dd data-testid="perspective-matrix-point">{{ numberList(state.matrixPoint) }}</dd>
          </div>
          <div>
            <dt>Consistency</dt>
            <dd>{{ agreement ? 'Matches' : 'Check values' }}</dd>
          </div>
        </dl>
      </aside>

      <div class="visual">
        <svg data-testid="perspective-svg" viewBox="0 0 760 430" role="img" aria-label="One point perspective geometry">
          <rect class="plane-bg" x="1" y="1" width="758" height="428" rx="8" />
          <line class="axis" x1="80" y1="210" x2="700" y2="210" />
          <line class="projection-plane" :x1="planeX" y1="52" :x2="planeX" y2="370" />
          <text class="svg-label" :x="planeX - 44" y="42">z = -d</text>
          <circle class="camera" :cx="camera.x" :cy="camera.y" r="8" />
          <text class="svg-label" :x="camera.x - 35" :y="camera.y + 28">camera</text>
          <line class="ray" :x1="camera.x" :y1="camera.y" :x2="pointSvg.x" :y2="pointSvg.y" />
          <line class="ray projected" :x1="camera.x" :y1="camera.y" :x2="projectedSvg.x" :y2="projectedSvg.y" />
          <circle class="world-point" :cx="pointSvg.x" :cy="pointSvg.y" r="7" />
          <circle class="projected-point" :cx="projectedSvg.x" :cy="projectedSvg.y" r="7" />
          <text class="svg-label" :x="pointSvg.x - 20" :y="pointSvg.y - 14">P</text>
          <text class="svg-label" :x="projectedSvg.x + 10" :y="projectedSvg.y + 4">P'</text>
        </svg>
        <p class="caption">
          Geometric one-point perspective transform proves the function and homogeneous forms agree. The standard perspective projection matrix is named separately because it also maps depth for the rendering pipeline.
        </p>
      </div>
    </section>

    <section class="matrix-section">
      <div class="matrix-heading">
        <div>
          <h4>Function and Matrix Agreement</h4>
          <p>Current view point: [{{ numberList(state.viewPoint) }}]. Homogeneous result: [{{ numberList(state.homogeneousPoint) }}].</p>
        </div>
      </div>
      <div class="matrix-grid">
        <MatrixCard title="Geometric Formula" :latex="state.functionLatex" />
        <div data-testid="perspective-geometric-matrix" :data-matrix="matrixData">
          <MatrixCard title="Geometric One-Point Perspective Transform" :latex="state.geometricLatex" highlighted />
        </div>
        <MatrixCard title="Standard Perspective Projection Matrix" :latex="state.standardLatex" />
      </div>
    </section>
  </section>
</template>

<style scoped>
.teaching-page {
  display: grid;
  gap: 14px;
}

.workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 14px;
}

.controls,
.visual,
.matrix-section {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-bg);
  padding: 14px;
  min-width: 0;
}

.section-kicker {
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h3,
h4 {
  margin: 4px 0 8px;
}

.note,
.caption,
.matrix-heading p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.82rem;
  line-height: 1.5;
}

.field-grid {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

label {
  display: grid;
  gap: 6px;
}

label span,
.metric-grid dt {
  color: var(--text-dim);
  font-size: 0.78rem;
}

input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-main);
  padding: 7px 9px;
  font: inherit;
}

.metric-grid {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
}

.metric-grid div {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  padding: 8px;
}

.metric-grid dd {
  margin: 2px 0 0;
  font-weight: 700;
}

.visual {
  display: grid;
  gap: 10px;
}

svg {
  width: 100%;
  min-height: 420px;
}

.plane-bg {
  fill: var(--surface);
  stroke: var(--border);
}

.axis,
.projection-plane {
  stroke: var(--border);
  stroke-width: 2;
}

.projection-plane {
  stroke: var(--accent-2);
  stroke-dasharray: 8 6;
}

.ray {
  stroke: var(--accent);
  stroke-width: 2;
}

.ray.projected {
  stroke: var(--accent-2);
}

.camera {
  fill: var(--text-main);
}

.world-point {
  fill: var(--accent);
}

.projected-point {
  fill: var(--accent-2);
}

.svg-label {
  fill: var(--text-dim);
  font-size: 13px;
}

.matrix-heading {
  margin-bottom: 12px;
}

.matrix-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1280px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .matrix-grid {
    grid-template-columns: 1fr;
  }
}
</style>
