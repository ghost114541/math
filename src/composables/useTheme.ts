import { computed, ref, watch } from 'vue'
import type { ThemeState } from '../types/cg'

const STORAGE_KEY = 'cg-viz-theme'

export function useTheme() {
  const initialTheme = (localStorage.getItem(STORAGE_KEY) as ThemeState['theme']) || 'light'
  const theme = ref<ThemeState['theme']>(initialTheme)

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value
      localStorage.setItem(STORAGE_KEY, value)
    },
    { immediate: true },
  )

  const isDark = computed(() => theme.value === 'dark')
  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return { theme, isDark, toggleTheme }
}