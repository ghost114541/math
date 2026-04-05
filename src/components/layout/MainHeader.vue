<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  themeLabel: string
}>()

const emit = defineEmits<{
  toggleTheme: []
}>()
</script>

<template>
  <header class="main-header">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>
    <button class="theme-btn" type="button" @click="emit('toggleTheme')">
      {{ themeLabel }}
    </button>
  </header>
</template>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  font-size: 1.35rem;
}

p {
  margin: 3px 0 0;
  color: var(--text-dim);
  font-size: 0.88rem;
}

.theme-btn {
  border: 1px solid var(--border);
  background: var(--panel-bg);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.theme-btn:hover {
  background: var(--surface-hover);
}
</style>