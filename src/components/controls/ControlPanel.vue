<script setup lang="ts">
import { computed } from 'vue'
import MatrixCard from '../math/MatrixCard.vue'
import type { DimensionalMode, LocalFrameState, TransformDraftField, TransformItem, TransformType, ValidationState } from '../../types/cg'

const props = defineProps<{
  mode: DimensionalMode
  points: number[][]
  pointDrafts: string[][]
  localFrame: LocalFrameState
  localOriginDrafts: string[]
  transforms: TransformItem[]
  currentStep: number
  isPlaying: boolean
  speed: number
  draftType: TransformType
  draftFields: TransformDraftField[]
  draftValues: Record<string, string>
  draftPreview: string
  typeOptions: ReadonlyArray<{ label: string; value: TransformType }>
  compositeLatex: string
  validation: ValidationState
}>()

const emit = defineEmits<{
  addPoint: []
  clearPoints: []
  loadPoints: []
  updatePoint: [rowIndex: number, colIndex: number, value: string]
  commitPointInput: [rowIndex: number, colIndex: number]
  revertPointInput: [rowIndex: number, colIndex: number]
  removePoint: [rowIndex: number]
  loadLocalDefault: []
  resetLocalToWorld: []
  updateLocalOrigin: [index: number, value: string]
  commitLocalOriginInput: [index: number]
  revertLocalOriginInput: [index: number]
  setShowWorld: [value: boolean]
  setShowLocal: [value: boolean]
  addTransform: []
  moveUp: [index: number]
  moveDown: [index: number]
  removeTransform: [index: number]
  start: []
  pause: []
  step: []
  reset: []
  updateSpeed: [value: number]
  updateDraftType: [value: TransformType]
  updateDraftField: [key: string, value: string]
  resetDraft: []
}>()

const pointHeader = computed(() => (props.mode === '2d' ? ['x', 'y', 'w'] : ['x', 'y', 'z', 'w']))
const pointSectionTitle = computed(() => (props.mode === '2d' ? '2D Point Set (Homogeneous)' : '3D Vertex Set (Homogeneous)'))
const localOriginLabel = computed(() => (props.mode === '2d' ? 'Local Origin (x, y)' : 'Local Origin (x, y, z)'))
const homogeneousIndex = computed(() => pointHeader.value.length - 1)

function pointFieldError(rowIndex: number, colIndex: number) {
  return props.validation.pointFieldErrors[`${rowIndex}:${colIndex}`] ?? ''
}

function localOriginError(index: number) {
  return props.validation.localOriginErrors[String(index)] ?? ''
}

function draftFieldError(key: string) {
  return props.validation.draftFieldErrors[key] ?? ''
}
</script>

<template>
  <aside class="control-panel">
    <section class="panel-section">
      <div class="section-title">{{ pointSectionTitle }}</div>
      <p v-if="validation.points" class="validation-text">{{ validation.points }}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="item in pointHeader" :key="item">{{ item }}</th>
              <th>ops</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in points.slice(0, 12)" :key="rowIndex">
              <td v-for="(_, colIndex) in row" :key="colIndex" :class="{ 'cell-error': pointFieldError(rowIndex, colIndex) }">
                <input
                  :data-testid="`point-input-${rowIndex}-${colIndex}`"
                  :value="pointDrafts[rowIndex]?.[colIndex] ?? ''"
                  :readonly="colIndex === homogeneousIndex"
                  :class="{ locked: colIndex === homogeneousIndex, invalid: pointFieldError(rowIndex, colIndex) }"
                  @input="emit('updatePoint', rowIndex, colIndex, ($event.target as HTMLInputElement).value)"
                  @blur="emit('commitPointInput', rowIndex, colIndex)"
                  @keydown.enter.prevent="emit('commitPointInput', rowIndex, colIndex)"
                  @keydown.esc.prevent="emit('revertPointInput', rowIndex, colIndex)"
                />
                <small v-if="pointFieldError(rowIndex, colIndex)" class="field-error">{{ pointFieldError(rowIndex, colIndex) }}</small>
              </td>
              <td>
                <button type="button" class="danger" @click="emit('removePoint', rowIndex)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="btn-row">
        <button type="button" @click="emit('addPoint')">Add Point</button>
        <button type="button" @click="emit('clearPoints')">Clear</button>
        <button type="button" @click="emit('loadPoints')">Load Default</button>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">Local Coordinate Frame</div>
      <p v-if="validation.localFrame" class="validation-text">{{ validation.localFrame }}</p>
      <label class="field">
        <span>{{ localOriginLabel }}</span>
        <div class="input-inline">
          <div v-for="(_, i) in localFrame.origin" :key="i" class="input-stack">
            <input
              :data-testid="`local-origin-input-${i}`"
              :value="localOriginDrafts[i] ?? ''"
              :class="{ invalid: localOriginError(i) }"
              @input="emit('updateLocalOrigin', i, ($event.target as HTMLInputElement).value)"
              @blur="emit('commitLocalOriginInput', i)"
              @keydown.enter.prevent="emit('commitLocalOriginInput', i)"
              @keydown.esc.prevent="emit('revertLocalOriginInput', i)"
            />
            <small v-if="localOriginError(i)" class="field-error">{{ localOriginError(i) }}</small>
          </div>
        </div>
      </label>
      <label class="check-row">
        <input type="checkbox" :checked="localFrame.showWorld" @change="emit('setShowWorld', ($event.target as HTMLInputElement).checked)" />
        <span>Show World Frame</span>
      </label>
      <label class="check-row">
        <input type="checkbox" :checked="localFrame.showLocal" @change="emit('setShowLocal', ($event.target as HTMLInputElement).checked)" />
        <span>Show Local Frame</span>
      </label>
      <div class="btn-row">
        <button type="button" @click="emit('loadLocalDefault')">Load Center Default</button>
        <button type="button" @click="emit('resetLocalToWorld')">Reset to World Frame</button>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">Transformation Sequence</div>
      <div class="field">
        <span>Transformation Type</span>
        <select data-testid="draft-type-select" :value="draftType" @change="emit('updateDraftType', ($event.target as HTMLSelectElement).value as TransformType)">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
      <div class="field-grid">
        <label v-for="field in draftFields" :key="field.key" class="field inline-field">
          <span>{{ field.label }}</span>
          <select
            v-if="field.inputMode === 'select'"
            :data-testid="`draft-field-${field.key}`"
            :value="draftValues[field.key] ?? ''"
            :class="{ invalid: draftFieldError(field.key) }"
            @change="emit('updateDraftField', field.key, ($event.target as HTMLSelectElement).value)"
            @keydown.enter.prevent="emit('addTransform')"
            @keydown.esc.prevent="emit('resetDraft')"
          >
            <option v-for="option in field.options ?? []" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <input
            v-else
            :data-testid="`draft-field-${field.key}`"
            :value="draftValues[field.key] ?? ''"
            :class="{ invalid: draftFieldError(field.key) }"
            :placeholder="field.placeholder"
            inputmode="decimal"
            @input="emit('updateDraftField', field.key, ($event.target as HTMLInputElement).value)"
            @keydown.enter.prevent="emit('addTransform')"
            @keydown.esc.prevent="emit('resetDraft')"
          />
          <small v-if="draftFieldError(field.key)" class="field-error">{{ draftFieldError(field.key) }}</small>
        </label>
      </div>
      <p class="draft-preview">Current expression: {{ draftPreview }}</p>
      <p class="keyboard-hint">Press Enter to add this transform, or Esc to restore the default fields for the selected type.</p>
      <p v-if="validation.draft" class="validation-text">{{ validation.draft }}</p>
      <div class="btn-row">
        <button data-testid="add-transform-button" type="button" @click="emit('addTransform')">Add Transformation</button>
        <button data-testid="reset-draft-button" type="button" @click="emit('resetDraft')">Reset Fields</button>
      </div>

      <div class="transform-list">
        <div
          v-for="(item, index) in transforms"
          :key="item.id"
          class="transform-item"
          :class="{ active: index === currentStep }"
          :data-testid="`transform-item-${index}`"
        >
          <div class="transform-meta">
            <strong>{{ index + 1 }}. {{ typeOptions.find((x) => x.value === item.type)?.label }}</strong>
            <small>{{ item.params }}</small>
          </div>
          <div class="mini-btns">
            <button type="button" @click="emit('moveUp', index)">Move Up</button>
            <button type="button" @click="emit('moveDown', index)">Move Down</button>
            <button type="button" @click="emit('removeTransform', index)">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">Matrix Display</div>
      <div class="matrix-list">
        <MatrixCard
          v-for="(item, index) in transforms"
          :key="item.id"
          :title="`M${index + 1} (${typeOptions.find((x) => x.value === item.type)?.label})`"
          :latex="item.matrixLatex"
          :highlighted="index === currentStep"
        />
        <MatrixCard title="Final Composite Matrix" :latex="compositeLatex" />
      </div>
      <p class="order-note">Multiplication order: recently added transforms appear on the left (column-vector right-multiplication convention).</p>
    </section>

    <section class="panel-section">
      <div class="section-title">Animation Controls</div>
      <div class="btn-row">
        <button data-testid="start-animation-button" type="button" class="primary" :disabled="isPlaying" @click="emit('start')">Start Step-by-Step Animation</button>
        <button data-testid="pause-animation-button" type="button" :disabled="!isPlaying" @click="emit('pause')">Pause</button>
        <button data-testid="step-forward-button" type="button" @click="emit('step')">Step Forward</button>
        <button data-testid="reset-animation-button" type="button" @click="emit('reset')">Reset</button>
      </div>
      <label class="field">
        <span>Animation Speed: {{ speed }}</span>
        <input data-testid="speed-slider" type="range" min="1" max="100" :value="speed" @input="emit('updateSpeed', Number(($event.target as HTMLInputElement).value))" />
      </label>
    </section>
  </aside>
</template>

<style scoped>
.control-panel {
  width: 320px;
  max-height: calc(100vh - 78px);
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel-bg);
  padding: 12px;
}

.panel-section {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  margin-bottom: 10px;
  min-width: 0;
}

.section-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.validation-text {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, #dd4d4d 12%, var(--panel-bg));
  border: 1px solid color-mix(in srgb, #dd4d4d 30%, var(--border));
  color: #9f2f2f;
  font-size: 0.76rem;
  line-height: 1.4;
}

.field-error {
  display: block;
  margin-top: 3px;
  color: #a33a3a;
  font-size: 0.68rem;
  line-height: 1.25;
  text-align: left;
}

.table-wrap {
  overflow-x: auto;
  margin-bottom: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid var(--border-soft);
  padding: 4px;
  text-align: center;
  vertical-align: top;
}

.cell-error {
  background: color-mix(in srgb, #dd4d4d 7%, var(--surface));
}

input,
select,
button {
  font: inherit;
}

td input,
.input-inline input,
.field input,
.field select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 6px;
  background: var(--panel-bg);
  color: var(--text-main);
}

.invalid {
  border-color: #d65b5b !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, #d65b5b 24%, transparent);
}

.locked {
  background: color-mix(in srgb, var(--surface) 75%, white);
  color: var(--text-dim);
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

button {
  border: 1px solid var(--border);
  background: var(--panel-bg);
  color: var(--text-main);
  border-radius: 9px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 0.8rem;
}

button:hover:not(:disabled) {
  background: var(--surface-hover);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  border-color: transparent;
}

button.danger {
  border-color: color-mix(in srgb, #dd4d4d 40%, var(--border));
}

.field {
  display: block;
  margin-bottom: 8px;
}

.field span {
  display: block;
  margin-bottom: 4px;
  color: var(--text-dim);
  font-size: 0.79rem;
}

.field-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
}

.inline-field {
  margin-bottom: 0;
}

.draft-preview {
  margin: 8px 0 4px;
  color: var(--text-dim);
  font-size: 0.75rem;
  line-height: 1.4;
}

.keyboard-hint {
  margin: 0 0 8px;
  color: var(--text-dim);
  font-size: 0.72rem;
  line-height: 1.45;
}

.input-inline {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
}

.input-stack {
  min-width: 0;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  margin-bottom: 6px;
}

.transform-list {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.transform-item {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 8px;
  background: var(--panel-bg);
}

.transform-item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
}

.transform-meta small {
  display: block;
  margin-top: 2px;
  color: var(--text-dim);
}

.mini-btns {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}

.matrix-list {
  display: grid;
  gap: 8px;
  min-width: 0;
  width: 100%;
  overflow-x: hidden;
}

.order-note {
  margin: 8px 0 0;
  color: var(--text-dim);
  font-size: 0.75rem;
}

@media (max-width: 1360px) {
  .control-panel {
    width: 100%;
    max-height: none;
  }
}
</style>