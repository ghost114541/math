<script setup lang="ts">
import { computed } from 'vue'
import type { DimensionalMode } from '../../types/cg'

const props = defineProps<{
  mode: DimensionalMode
}>()

const title = computed(() => (props.mode === '2d' ? '2D Affine Demo Guide' : '3D Affine Demo Guide'))
const theory = computed(() => (props.mode === '2d' ? 'Use 3x3 homogeneous matrices to map points (x, y, 1).' : 'Use 4x4 homogeneous matrices to map vertices (x, y, z, 1).'))
const checklist = computed(() =>
  props.mode === '2d'
    ? [
        'Edit star vertices in the coordinate table.',
        'Append translation / rotation / scaling steps.',
        'Play animation and check highlighted matrix card each step.',
        'Compare world frame (fixed) and local frame (object-attached).',
      ]
    : [
        'Edit cube vertex coordinates in homogeneous form.',
        'Build a transform chain and observe matrix order.',
        'Run step animation to track orientation changes.',
        'Toggle world/local frame visibility for explanation.',
      ],
)
</script>

<template>
  <section class="guide">
    <h4>{{ title }}</h4>
    <p class="theory">{{ theory }}</p>
    <ol>
      <li v-for="(item, idx) in checklist" :key="idx">{{ item }}</li>
    </ol>
    <p class="tip">Teaching tip: pause on each highlighted matrix and explain what changes in geometry versus coordinate frame.</p>
  </section>
</template>

<style scoped>
.guide {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface));
}

h4 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.theory {
  margin: 0 0 8px;
  color: var(--text-dim);
  font-size: 0.84rem;
}

ol {
  margin: 0;
  padding-left: 18px;
  color: var(--text-main);
  line-height: 1.5;
  font-size: 0.88rem;
}

.tip {
  margin: 10px 0 0;
  color: var(--text-dim);
  font-size: 0.8rem;
}
</style>
