<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'

const props = defineProps<{
  title: string
  latex: string
  highlighted?: boolean
}>()

const html = computed(() =>
  katex.renderToString(props.latex, {
    throwOnError: false,
    output: 'html',
    displayMode: true,
  }),
)
</script>

<template>
  <article class="matrix-card" :class="{ highlighted: highlighted }">
    <h5>{{ title }}</h5>
    <div class="katex-box" v-html="html" />
  </article>
</template>

<style scoped>
.matrix-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: var(--surface);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.matrix-card.highlighted {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
}

h5 {
  margin: 0 0 6px;
  font-size: 0.82rem;
  color: var(--text-dim);
}

.katex-box {
  overflow-x: auto;
}
.matrix-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.katex-box {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>

