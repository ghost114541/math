<script setup lang="ts">
import { ref } from 'vue'
import type { DemoScenario } from '../types/cg'
import { AFFINE_SCENARIOS } from '../config/scenarios'
import ControlPanel from '../components/controls/ControlPanel.vue'
import P5CanvasStatic from '../components/canvas/P5CanvasStatic.vue'
import GuideText from '../components/shared/GuideText.vue'
import { useAffineDemo } from '../composables/useAffineDemo'

const demo = useAffineDemo('2d')
const scenarios = AFFINE_SCENARIOS['2d']
const defaultScenario = scenarios[0]
const activeScenarioId = ref(defaultScenario?.id ?? '')

const points = demo.points
const pointDrafts = demo.pointDrafts
const currentPoints = demo.currentPoints
const finalPoints = demo.finalPoints
const currentFrame = demo.currentFrame
const finalFrame = demo.finalFrame
const localFrame = demo.localFrame
const localOriginDrafts = demo.localOriginDrafts
const transforms = demo.transforms
const currentStep = demo.currentStep
const isPlaying = demo.isPlaying
const speed = demo.speed
const draftType = demo.draftType
const draftFields = demo.draftFields
const draftValues = demo.draftValues
const draftPreview = demo.draftParams
const validation = demo.validation
const typeOptions = demo.transformTypeOptions
const compositeLatex = demo.compositeMatrixLatex

const onSpeed = (value: number) => {
  demo.speed.value = value
}

const resetDraftFields = () => {
  demo.resetDraft()
}

const loadScenario = (scenario: DemoScenario) => {
  activeScenarioId.value = scenario.id
  demo.applyScenario(scenario)
}

const restoreDefaultScenario = () => {
  if (!defaultScenario) return
  loadScenario(defaultScenario)
}
</script>

<template>
  <section data-testid="affine-2d-view">
    <article class="intro-card">
      <h3>Example Focus</h3>
      <p>
        This prototype demonstrates how a 2D shape in homogeneous coordinates passes through an affine transform chain.
        Use the left panel to edit points, compose transforms, and explain each matrix-highlighted step.
      </p>
    </article>

    <section class="scenario-strip">
      <div class="scenario-heading scenario-heading-row">
        <div>
          <h4>Teaching Scenarios</h4>
          <p>Load a ready-made 2D lesson setup when you want to start from a known geometry and transform chain.</p>
        </div>
        <button data-testid="restore-default-scenario-button" type="button" class="scenario-reset" @click="restoreDefaultScenario">
          Restore Default Scenario
        </button>
      </div>
      <div class="scenario-grid">
        <button
          v-for="item in scenarios"
          :key="item.id"
          :data-testid="`scenario-card-${item.id}`"
          type="button"
          class="scenario-card"
          :class="{ active: activeScenarioId === item.id }"
          :aria-pressed="activeScenarioId === item.id"
          @click="loadScenario(item)"
        >
          <strong>{{ item.label }}</strong>
          <span>{{ item.summary }}</span>
        </button>
      </div>
    </section>

    <div class="example-grid">
      <ControlPanel
        mode="2d"
        :points="points"
        :point-drafts="pointDrafts"
        :local-frame="localFrame"
        :local-origin-drafts="localOriginDrafts"
        :transforms="transforms"
        :current-step="currentStep"
        :is-playing="isPlaying"
        :speed="speed"
        :draft-type="draftType"
        :draft-fields="draftFields"
        :draft-values="draftValues"
        :draft-preview="draftPreview"
        :validation="validation"
        :type-options="typeOptions"
        :composite-latex="compositeLatex"
        @add-point="demo.addPoint"
        @clear-points="demo.clearPoints"
        @load-points="demo.loadDefaultPoints"
        @update-point="demo.updatePoint"
        @commit-point-input="demo.commitPointInput"
        @revert-point-input="demo.revertPointInput"
        @remove-point="demo.removePoint"
        @load-local-default="demo.loadLocalDefault"
        @reset-local-to-world="demo.resetLocalToWorld"
        @update-local-origin="demo.updateLocalOrigin"
        @commit-local-origin-input="demo.commitLocalOriginInput"
        @revert-local-origin-input="demo.revertLocalOriginInput"
        @set-show-world="demo.setShowWorld"
        @set-show-local="demo.setShowLocal"
        @add-transform="demo.addTransform"
        @move-up="demo.moveUp"
        @move-down="demo.moveDown"
        @remove-transform="demo.removeTransform"
        @start="demo.start"
        @pause="demo.pause"
        @step="demo.stepForward"
        @reset="demo.reset"
        @update-speed="onSpeed"
        @update-draft-type="demo.updateDraftType"
        @update-draft-field="demo.updateDraftField"
        @reset-draft="resetDraftFields"
      />

      <div class="stage-wrap">
        <article class="canvas-card">
          <P5CanvasStatic
            :current-step="currentStep"
            :total-steps="transforms.length"
            :base-points="points"
            :current-points="currentPoints"
            :final-points="finalPoints"
            :current-frame="currentFrame"
            :final-frame="finalFrame"
            :local-frame="localFrame"
          />
        </article>
        <GuideText mode="2d" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro-card,
.scenario-strip {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel-bg);
  padding: 12px;
  margin-bottom: 14px;
}

.intro-card h3,
.scenario-heading h4 {
  margin: 0 0 6px;
  font-size: 0.96rem;
}

.intro-card p,
.scenario-heading p {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.86rem;
  line-height: 1.5;
}

.scenario-heading-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.scenario-reset {
  white-space: nowrap;
}

.scenario-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 10px;
}

.scenario-card {
  text-align: left;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface));
  color: var(--text-main);
  padding: 10px 12px;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.scenario-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.84rem;
}

.scenario-card span {
  display: block;
  color: var(--text-dim);
  font-size: 0.76rem;
  line-height: 1.45;
}

.scenario-card:hover {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--surface)), var(--surface-hover));
}

.scenario-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--surface)), var(--surface-hover));
}

.example-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
}

.canvas-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel-bg);
  padding: 10px;
}

@media (max-width: 1360px) {
  .example-grid {
    grid-template-columns: 1fr;
  }
}
</style>
