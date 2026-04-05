<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { EXAMPLE_DEFINITIONS } from '../../config/examples'

const route = useRoute()

const grouped = computed(() => {
  const groups = new Map<string, typeof EXAMPLE_DEFINITIONS>()
  EXAMPLE_DEFINITIONS.forEach((item) => {
    const list = groups.get(item.group) || []
    list.push(item)
    groups.set(item.group, list)
  })
  return Array.from(groups.entries())
})

const isActive = (path: string) => route.path === path
</script>

<template>
  <aside class="sidebar">
    <header class="brand">
      <div class="logo">CG</div>
      <div>
        <h1>CG Viz</h1>
        <p>Interactive Illustrations</p>
      </div>
    </header>

    <nav class="menu">
      <section v-for="([group, items], index) in grouped" :key="group" class="group">
        <h2>{{ index + 1 }}. {{ group }}</h2>
        <RouterLink
          v-for="item in items"
          :key="item.id"
          :to="item.route"
          class="menu-item"
          :class="{ active: isActive(item.route) }"
        >
          <span>{{ item.title }}</span>
          <small>{{ item.subtitle }}</small>
        </RouterLink>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  border-right: 1px solid var(--border);
  background: var(--panel-bg);
  height: 100vh;
  overflow-y: auto;
  position: sticky;
  top: 0;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 20px 18px;
  border-bottom: 1px solid var(--border);
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  font-weight: 700;
  display: grid;
  place-items: center;
}

h1 {
  margin: 0;
  font-size: 1.1rem;
}

.brand p {
  margin: 2px 0 0;
  color: var(--text-dim);
  font-size: 0.78rem;
}

.menu {
  padding: 16px 12px 28px;
}

.group {
  margin-bottom: 18px;
}

h2 {
  margin: 0 0 8px;
  color: var(--text-dim);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.menu-item {
  display: block;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--text-main);
  border: 1px solid transparent;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.menu-item span {
  display: block;
  font-size: 0.93rem;
  font-weight: 600;
}

.menu-item small {
  color: var(--text-dim);
  font-size: 0.72rem;
}

.menu-item:hover {
  background: var(--surface-hover);
}

.menu-item.active {
  border-color: var(--accent-soft);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

@media (max-width: 960px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
}
</style>