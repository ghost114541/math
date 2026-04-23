<script setup lang="ts">
import { computed, ref } from 'vue'
import MatrixCard from '../components/math/MatrixCard.vue'
import { computeClippingState, matrixToDataAttribute } from '../lib/clipping'
import { formatNumber } from '../lib/perspective'

const fov = ref(62)
const near = ref(0.8)
const far = ref(6)
const offsetX = ref(0.45)

const state = computed(() => computeClippingState(fov.value, near.value, far.value, offsetX.value))
const projectionData = computed(() => matrixToDataAttribute(state.value.projectionMatrix))

function statusClass(status: string) {
  return `status ${status}`
}

function ndcToSvg(point: number[]) {
  return `${380 + (point[0] ?? 0) * 145},${222 - (point[1] ?? 0) * 145}`
}

const clippedPolygonPoints = computed(() => state.value.ndcTriangle.map(ndcToSvg).join(' '))
const originalPolygonPoints = computed(() =>
  state.value.clipTriangle
    .map((point) => {
      const rawW = point[3] ?? 1
      const w = Math.abs(rawW) < 1e-9 ? 1 : rawW
      return [(point[0] ?? 0) / w, (point[1] ?? 0) / w, (point[2] ?? 0) / w]
    })
    .map(ndcToSvg)
    .join(' '),
)

function numberList(values: number[]) {
  return values.map((value) => formatNumber(value)).join(', ')
}
</script>

<template>
  <section class="teaching-page" data-testid="clipping-view">
    <section class="workspace">
      <aside class="controls">
        <div class="section-kicker">3D Clipping</div>
        <h3>OpenGL/WebGL Clip Space</h3>
        <p class="note" data-testid="clipping-convention-note">
          This page uses OpenGL/WebGL semantics: NDC x, y, z are in [-1, 1], and clip-space tests are -w &lt;= x,y,z &lt;= w before perspective divide.
        </p>

        <div class="field-grid">
          <label>
            <span>Field of view</span>
            <input data-testid="clipping-fov" type="number" step="1" v-model.number="fov" />
            <input type="range" min="35" max="95" step="1" v-model.number="fov" />
          </label>
          <label>
            <span>Near plane</span>
            <input data-testid="clipping-near" type="number" step="0.1" v-model.number="near" />
            <input type="range" min="0.2" max="2.5" step="0.1" v-model.number="near" />
          </label>
          <label>
            <span>Far plane</span>
            <input data-testid="clipping-far" type="number" step="0.1" v-model.number="far" />
            <input type="range" min="3" max="10" step="0.1" v-model.number="far" />
          </label>
          <label>
            <span>Triangle X offset</span>
            <input data-testid="clipping-offset" type="number" step="0.1" v-model.number="offsetX" />
            <input type="range" min="-1.8" max="1.8" step="0.1" v-model.number="offsetX" />
          </label>
        </div>

        <dl class="metric-grid">
          <div>
            <dt>Triangle status</dt>
            <dd data-testid="clipping-triangle-status" :class="statusClass(state.triangleStatus)">{{ state.triangleStatus }}</dd>
          </div>
          <div>
            <dt>Line status</dt>
            <dd data-testid="clipping-line-status" :class="statusClass(state.lineClip.status)">{{ state.lineClip.status }}</dd>
          </div>
          <div>
            <dt>Clipped vertices</dt>
            <dd data-testid="clipping-vertex-count">{{ state.clippedTriangle.length }}</dd>
          </div>
        </dl>
      </aside>

      <div class="visual">
        <div class="pipeline" aria-label="Clipping pipeline">
          <span>view space</span>
          <span>clip space</span>
          <span>clipping</span>
          <span>perspective divide</span>
          <span>NDC</span>
          <span>screen</span>
        </div>
        <svg data-testid="clipping-svg" viewBox="0 0 760 430" role="img" aria-label="Clip-space triangle clipping">
          <rect class="plane-bg" x="1" y="1" width="758" height="428" rx="8" />
          <rect class="ndc-box" x="235" y="77" width="290" height="290" />
          <line class="axis" x1="235" y1="222" x2="525" y2="222" />
          <line class="axis" x1="380" y1="77" x2="380" y2="367" />
          <polygon v-if="originalPolygonPoints" class="original-poly" :points="originalPolygonPoints" />
          <polygon v-if="clippedPolygonPoints" class="clipped-poly" :points="clippedPolygonPoints" />
          <circle
            v-for="(point, index) in state.ndcTriangle"
            :key="index"
            class="clipped-vertex"
            :cx="380 + (point[0] ?? 0) * 145"
            :cy="222 - (point[1] ?? 0) * 145"
            r="5"
          />
          <text class="svg-label" x="246" y="66">NDC box [-1, 1]</text>
          <text class="svg-label" x="44" y="390">faint: projected original, solid: after true clipping</text>
        </svg>
        <p class="caption">
          Classification decides whether the primitive is inside, outside, or intersecting. Intersecting line segments and triangles are then clipped to create new vertices before perspective divide.
        </p>
      </div>
    </section>

    <section class="matrix-section">
      <div class="matrix-heading">
        <div>
          <h4>Clip-Space Result</h4>
          <p>First clip vertex: [{{ numberList(state.clipTriangle[0] ?? []) }}]. First clipped vertex: [{{ numberList(state.clippedTriangle[0] ?? []) }}].</p>
        </div>
      </div>
      <div class="matrix-grid">
        <div data-testid="clipping-projection-matrix" :data-matrix="projectionData">
          <MatrixCard title="Standard Perspective Projection Matrix" :latex="state.projectionLatex" highlighted />
        </div>
        <article class="algorithm-card">
          <h5>Core Algorithm</h5>
          <p>Point classification plus real line and triangle clipping in homogeneous clip space. General polygon clipping follows the same per-plane idea.</p>
        </article>
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
h4,
h5 {
  margin: 4px 0 8px;
}

.note,
.caption,
.matrix-heading p,
.algorithm-card p {
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

.metric-grid div,
.algorithm-card {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  padding: 10px;
}

.metric-grid dd {
  margin: 2px 0 0;
  font-weight: 700;
}

.status.inside {
  color: var(--accent-2);
}

.status.intersecting {
  color: var(--accent);
}

.status.outside {
  color: #b94d4d;
}

.pipeline {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.pipeline span {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  padding: 7px;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.74rem;
}

svg {
  width: 100%;
  min-height: 410px;
}

.plane-bg {
  fill: var(--surface);
  stroke: var(--border);
}

.ndc-box {
  fill: color-mix(in srgb, var(--accent) 5%, transparent);
  stroke: var(--accent);
  stroke-width: 2;
}

.axis {
  stroke: var(--border);
}

.original-poly {
  fill: color-mix(in srgb, var(--accent) 10%, transparent);
  stroke: var(--text-dim);
  stroke-width: 2;
  stroke-dasharray: 8 6;
}

.clipped-poly {
  fill: color-mix(in srgb, var(--accent-2) 22%, transparent);
  stroke: var(--accent-2);
  stroke-width: 3;
}

.clipped-vertex {
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
  grid-template-columns: minmax(0, 1fr) 320px;
}

@media (max-width: 1280px) {
  .workspace,
  .matrix-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .pipeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
