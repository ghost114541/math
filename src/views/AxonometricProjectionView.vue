<script setup lang="ts">
import { computed, ref } from 'vue'
import MatrixCard from '../components/math/MatrixCard.vue'
import ProjectionSvgCanvas from '../components/canvas/ProjectionSvgCanvas.vue'
import {
  AXONOMETRIC_PRESETS,
  PROJECTION_MODEL_EDGES,
  computeProjectionState,
  matrixToDataAttribute,
  type ProjectionPreset,
} from '../lib/projection'

const activePresetId = ref('trimetric-a')
const yAngle = ref(45)
const xAngle = ref(35)

const projectionState = computed(() => computeProjectionState(yAngle.value, xAngle.value))
const activePreset = computed(() => AXONOMETRIC_PRESETS.find((preset) => preset.id === activePresetId.value) ?? null)
const activeLabel = computed(() => activePreset.value?.label ?? 'Custom Trimetric')
const finalMatrixData = computed(() => matrixToDataAttribute(projectionState.value.finalMatrix))
const shorteningSummary = computed(() =>
  projectionState.value.axes.map((axis) => `${axis.label}: ${axis.shortening.toFixed(3)}`).join(' / '),
)

function selectPreset(preset: ProjectionPreset) {
  activePresetId.value = preset.id
  yAngle.value = preset.yAngle
  xAngle.value = preset.xAngle
}

function updateYAngle(value: number) {
  yAngle.value = normalizeAngle(value)
  activePresetId.value = 'custom'
}

function updateXAngle(value: number) {
  xAngle.value = normalizeAngle(value)
  activePresetId.value = 'custom'
}

function normalizeAngle(value: number) {
  return Number.isFinite(value) ? value : 0
}
</script>

<template>
  <section class="projection-page" data-testid="projection-axonometric-view">
    <section class="projection-workspace">
      <aside class="projection-controls">
        <div class="section-kicker">Axonometric Projections</div>
        <h3>{{ activeLabel }}</h3>
        <p data-testid="projection-construction-note" class="construction-note">
          Construction order: first rotate around Oy, then rotate around X, then orthographically project to the screen plane.
        </p>

        <div class="preset-list" aria-label="Projection presets">
          <button
            v-for="preset in AXONOMETRIC_PRESETS"
            :key="preset.id"
            type="button"
            class="preset-button"
            :class="{ active: activePresetId === preset.id }"
            :data-testid="`projection-preset-${preset.id}`"
            :aria-pressed="activePresetId === preset.id"
            @click="selectPreset(preset)"
          >
            <strong>{{ preset.label }}</strong>
            <span>{{ preset.summary }}</span>
            <small>Oy {{ preset.yAngle }} deg / X {{ preset.xAngle }} deg</small>
          </button>
        </div>

        <div class="angle-grid">
          <label class="angle-field">
            <span>Oy rotation angle</span>
            <input
              data-testid="projection-angle-y"
              type="number"
              step="0.001"
              :value="yAngle"
              @input="updateYAngle(Number(($event.target as HTMLInputElement).value))"
            />
            <input
              type="range"
              min="-90"
              max="90"
              step="0.001"
              :value="yAngle"
              @input="updateYAngle(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="angle-field">
            <span>X rotation angle</span>
            <input
              data-testid="projection-angle-x"
              type="number"
              step="0.001"
              :value="xAngle"
              @input="updateXAngle(Number(($event.target as HTMLInputElement).value))"
            />
            <input
              type="range"
              min="-90"
              max="90"
              step="0.001"
              :value="xAngle"
              @input="updateXAngle(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>

        <dl class="shortening-list" data-testid="projection-shortening">
          <div v-for="axis in projectionState.axes" :key="axis.label">
            <dt>{{ axis.label }} axis</dt>
            <dd>{{ axis.shortening.toFixed(3) }}</dd>
          </div>
        </dl>
      </aside>

      <div class="projection-visual">
        <ProjectionSvgCanvas
          :points="projectionState.projectedPoints"
          :edges="PROJECTION_MODEL_EDGES"
          :axes="projectionState.axes"
        />
        <p class="visual-caption" data-testid="projection-visual-caption">
          The screen image is a 2D SVG projection of an asymmetric house model with coordinate axes. There are no arbitrary 3D view controls here.
        </p>
      </div>
    </section>

    <section class="matrix-section">
      <div class="matrix-heading">
        <div>
          <h4>Resulting Matrix</h4>
          <p>M = P * R_x * R_y. Current shortening: {{ shorteningSummary }}</p>
        </div>
      </div>
      <div class="matrix-grid">
        <MatrixCard title="Rotation Around Oy" :latex="projectionState.rotationYLatex" />
        <MatrixCard title="Rotation Around X" :latex="projectionState.rotationXLatex" />
        <MatrixCard title="Orthographic Projection" :latex="projectionState.projectionLatex" />
        <div data-testid="projection-final-matrix" :data-matrix="finalMatrixData">
          <MatrixCard title="Final Matrix M" :latex="projectionState.finalLatex" highlighted />
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.projection-page {
  display: grid;
  gap: 14px;
}

.projection-workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 14px;
}

.projection-controls,
.projection-visual,
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

.construction-note,
.visual-caption,
.matrix-heading p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.82rem;
  line-height: 1.5;
}

.preset-list {
  display: grid;
  gap: 8px;
  margin: 14px 0;
}

.preset-button {
  width: 100%;
  text-align: left;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-main);
  padding: 10px;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.preset-button:hover,
.preset-button.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.preset-button.active {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent);
}

.preset-button strong,
.preset-button span,
.preset-button small {
  display: block;
}

.preset-button strong {
  font-size: 0.86rem;
}

.preset-button span,
.preset-button small {
  margin-top: 4px;
  color: var(--text-dim);
  font-size: 0.74rem;
  line-height: 1.35;
}

.angle-grid {
  display: grid;
  gap: 10px;
}

.angle-field {
  display: grid;
  gap: 6px;
}

.angle-field span {
  color: var(--text-dim);
  font-size: 0.78rem;
}

.angle-field input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-main);
  padding: 7px 9px;
  font: inherit;
}

.shortening-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0 0;
}

.shortening-list div {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--surface);
  padding: 8px;
}

.shortening-list dt {
  color: var(--text-dim);
  font-size: 0.72rem;
}

.shortening-list dd {
  margin: 2px 0 0;
  font-size: 1rem;
  font-weight: 700;
}

.projection-visual {
  display: grid;
  align-content: start;
  gap: 10px;
}

.matrix-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.matrix-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1280px) {
  .projection-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .matrix-grid,
  .shortening-list {
    grid-template-columns: 1fr;
  }
}
</style>
