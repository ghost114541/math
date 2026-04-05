import { getCurrentInstance, onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useMockPlayback(steps: Ref<number>) {
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const speed = ref(55)
  const mode = ref<'loop' | 'step'>('loop')

  let timer: number | null = null

  const clearTimer = () => {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  const advance = () => {
    if (steps.value <= 0) {
      currentStep.value = 0
      return
    }
    currentStep.value = (currentStep.value + 1) % steps.value
  }

  const start = () => {
    if (steps.value <= 0) {
      return
    }
    isPlaying.value = true
  }

  const pause = () => {
    isPlaying.value = false
  }

  const stepForward = () => {
    mode.value = 'step'
    advance()
  }

  const reset = () => {
    isPlaying.value = false
    currentStep.value = 0
    mode.value = 'loop'
  }

  watch(
    [isPlaying, speed, steps],
    ([playing, speedValue, totalSteps]) => {
      clearTimer()
      if (!playing || totalSteps <= 0) {
        return
      }

      const delay = Math.max(180, 1700 - speedValue * 15)
      timer = window.setInterval(advance, delay)
    },
    { immediate: true },
  )

  if (getCurrentInstance()) {
    onBeforeUnmount(clearTimer)
  }

  return {
    isPlaying,
    currentStep,
    speed,
    mode,
    start,
    pause,
    stepForward,
    reset,
  }
}