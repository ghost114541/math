<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarNav from './components/layout/SidebarNav.vue'
import MainHeader from './components/layout/MainHeader.vue'
import { EXAMPLE_DEFINITIONS } from './config/examples'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const fallback = {
  title: 'CG Viz',
  subtitle: 'Interactive Illustrations for Computer Graphics Algorithms',
}

const active = computed(() => {
  const found = EXAMPLE_DEFINITIONS.find((item) => item.route === route.path)
  return found ? { title: found.title, subtitle: found.subtitle } : fallback
})

const themeLabel = computed(() => (isDark.value ? 'Switch to Light Theme' : 'Switch to Dark Theme'))
</script>

<template>
  <div class="app-shell">
    <SidebarNav />

    <main class="main-area">
      <MainHeader :title="active.title" :subtitle="active.subtitle" :theme-label="themeLabel" @toggle-theme="toggleTheme" />
      <RouterView />
    </main>
  </div>
</template>