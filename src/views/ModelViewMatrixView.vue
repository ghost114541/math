<script setup lang="ts">
import { computed, ref } from 'vue'
import MatrixCard from '../components/math/MatrixCard.vue'
import { computeModelViewState, matrixToDataAttribute } from '../lib/modelView'
import { formatNumber } from '../lib/perspective'

const modelYaw = ref(35)
const modelX = ref(0.8)
const modelZ = ref(-1.2)
const cameraX = ref(0.6)

const state = computed(() => computeModelViewState(modelYaw.value, modelX.value, modelZ.value, cameraX.value))
const modelViewData = computed(() => matrixToDataAttribute(state.value.modelViewMatrix))

function numberList(values: number[]) {
  return values.map((value) => formatNumber(value)).join(', ')
}

function topDown(point: number[]) {
  return {
    x: 380 + (point[0] ?? 0) * 70,
    y: 220 + (point[2] ?? 0) * 48,
  }
}

const worldPointSvg = computed(() => topDown(state.value.worldPoint))
const cameraSvg = computed(() => topDown(state.value.cameraPosition))
const modelSvg = computed(() => topDown([modelX.value, 0, modelZ.value]))
</script>

<template>
  <section class="teaching-page" data-testid="model-view-matrix-view">
    <section class="workspace">
      <aside class="controls">
        <div class="section-kicker">ModelViewMatrix</div>
        <h3>Separate Model and View</h3>
        <p class="note" data-testid="model-view-definition-note">
          M_model maps local to world. M_view maps world to eye space as the inverse of the camera world transform. Then M_modelView = M_view * M_model.
        </p>

        <div class="field-grid">
          <label>
            <span>Model yaw</span>
            <input data-testid="model-view-yaw" type="number" step="1" v-model.number="modelYaw" />
            <input type="range" min="-90" max="90" step="1" v-model.number="modelYaw" />
          </label>
          <label>
            <span>Model world X</span>
            <input data-testid="model-view-model-x" type="number" step="0.1" v-model.number="modelX" />
            <input type="range" min="-2.5" max="2.5" step="0.1" v-model.number="modelX" />
          </label>
          <label>
            <span>Model world Z</span>
            <input data-testid="model-view-model-z" type="number" step="0.1" v-model.number="modelZ" />
            <input type="range" min="-4" max="2" step="0.1" v-model.number="modelZ" />
          </label>
          <label>
            <span>Camera world X</span>
            <input data-testid="model-view-camera-x" type="number" step="0.1" v-model.number="cameraX" />
            <input type="range" min="-2.5" max="2.5" step="0.1" v-model.number="cameraX" />
          </label>
        </div>

        <dl class="metric-grid">
          <div>
            <dt>Local point</dt>
            <dd>{{ numberList(state.localPoint) }}</dd>
          </div>
          <div>
            <dt>World point</dt>
            <dd data-testid="model-view-world-point">{{ numberList(state.worldPoint) }}</dd>
          </div>
          <div>
            <dt>View point</dt>
            <dd data-testid="model-view-view-point">{{ numberList(state.viewPoint) }}</dd>
          </div>
        </dl>
      </aside>

      <div class="visual">
        <svg data-testid="model-view-svg" viewBox="0 0 760 430" role="img" aria-label="Model and view matrix spaces">
          <rect class="plane-bg" x="1" y="1" width="758" height="428" rx="8" />
          <g class="grid">
            <line v-for="x in 10" :key="`vx-${x}`" :x1="x * 76" y1="30" :x2="x * 76" y2="400" />
            <line v-for="y in 6" :key="`hy-${y}`" x1="40" :y1="y * 62" x2="720" :y2="y * 62" />
          </g>
          <line class="world-axis" x1="70" y1="220" x2="710" y2="220" />
          <line class="world-axis" x1="380" y1="40" x2="380" y2="390" />
          <circle class="model-origin" :cx="modelSvg.x" :cy="modelSvg.y" r="10" />
          <line class="model-direction" :x1="modelSvg.x" :y1="modelSvg.y" :x2="worldPointSvg.x" :y2="worldPointSvg.y" />
          <circle class="world-point" :cx="worldPointSvg.x" :cy="worldPointSvg.y" r="7" />
          <circle class="camera" :cx="cameraSvg.x" :cy="cameraSvg.y" r="9" />
          <line class="look" :x1="cameraSvg.x" :y1="cameraSvg.y" x2="380" y2="239" />
          <text class="svg-label" :x="modelSvg.x + 12" :y="modelSvg.y - 10">model origin</text>
          <text class="svg-label" :x="cameraSvg.x + 12" :y="cameraSvg.y + 4">camera</text>
          <text class="svg-label" :x="worldPointSvg.x + 10" :y="worldPointSvg.y + 4">sample vertex</text>
        </svg>
        <p class="caption">
          The page keeps the teaching matrices explicit: M_model is local to world, M_view is camera.matrixWorldInverse, and shader modelViewMatrix corresponds to their product.
        </p>
      </div>
    </section>

    <section class="matrix-section">
      <div class="matrix-heading">
        <div>
          <h4>Model, View, Then ModelView</h4>
          <p>Column-vector order: v_view = M_modelView * v_local = M_view * M_model * v_local.</p>
        </div>
      </div>
      <div class="matrix-grid">
        <MatrixCard title="Model Matrix" :latex="state.modelLatex" />
        <MatrixCard title="View Matrix" :latex="state.viewLatex" />
        <div data-testid="model-view-final-matrix" :data-matrix="modelViewData">
          <MatrixCard title="ModelView Matrix" :latex="state.modelViewLatex" highlighted />
        </div>
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

.field-grid,
.metric-grid {
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

svg {
  width: 100%;
  min-height: 420px;
}

.plane-bg {
  fill: var(--surface);
  stroke: var(--border);
}

.grid line {
  stroke: var(--border-soft);
}

.world-axis {
  stroke: var(--border);
  stroke-width: 2;
}

.model-origin {
  fill: var(--accent);
}

.world-point {
  fill: var(--accent-2);
}

.camera {
  fill: var(--text-main);
}

.model-direction,
.look {
  stroke: var(--accent);
  stroke-width: 2;
}

.look {
  stroke: var(--accent-2);
  stroke-dasharray: 8 6;
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
  .workspace,
  .matrix-grid {
    grid-template-columns: 1fr;
  }
}
</style>
