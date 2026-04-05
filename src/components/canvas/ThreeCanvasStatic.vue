<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FrameState } from '../../lib/affine'
import { buildWireframeEdges } from '../../lib/wireframe'
import type { LocalFrameState, WireframeMode } from '../../types/cg'

const props = defineProps<{
  currentStep: number
  totalSteps: number
  basePoints: number[][]
  currentPoints: number[][]
  finalPoints: number[][]
  currentFrame: FrameState
  finalFrame: FrameState
  localFrame: LocalFrameState
  wireframeMode: WireframeMode
  showBaseObject: boolean
}>()

type ThreeModule = typeof import('three')
type OrbitControlsModule = typeof import('three/examples/jsm/controls/OrbitControls.js')

const host = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
let THREERef: ThreeModule | null = null
let OrbitControlsRef: OrbitControlsModule['OrbitControls'] | null = null
let renderer: import('three').WebGLRenderer | null = null
let scene: import('three').Scene | null = null
let camera: import('three').PerspectiveCamera | null = null
let controls: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls | null = null
let resizeObserver: ResizeObserver | null = null
let worldAxes: import('three').AxesHelper | null = null
let baseObject: import('three').LineSegments | null = null
let currentObject: import('three').LineSegments | null = null
let finalObject: import('three').LineSegments | null = null
let currentLocalAxes: import('three').LineSegments | null = null
let finalLocalAxes: import('three').LineSegments | null = null
let isRendering = false

function createLineObject(color: number, opacity: number) {
  if (!THREERef) return null
  const geometry = new THREERef.BufferGeometry()
  const material = new THREERef.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  return new THREERef.LineSegments(geometry, material)
}

function updateLineGeometry(target: import('three').LineSegments | null, points: number[][]) {
  if (!target || !THREERef) return
  const vertices: number[] = []
  const edges = buildWireframeEdges('3d', points, props.wireframeMode)

  for (const [start, end] of edges) {
    const a = points[start]
    const b = points[end]
    if (!a || !b) continue
    vertices.push(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0)
    vertices.push(b[0] ?? 0, b[1] ?? 0, b[2] ?? 0)
  }

  target.geometry.dispose()
  const geometry = new THREERef.BufferGeometry()
  geometry.setAttribute('position', new THREERef.Float32BufferAttribute(vertices, 3))
  target.geometry = geometry
}

function createFrameObject() {
  if (!THREERef) return null
  const geometry = new THREERef.BufferGeometry()
  const material = new THREERef.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 })
  return new THREERef.LineSegments(geometry, material)
}

function updateFrameGeometry(target: import('three').LineSegments | null, frame: FrameState, opacity: number) {
  if (!target || !THREERef) return
  const origin = frame.origin
  const xAxis = frame.axes[0]
  const yAxis = frame.axes[1]
  const zAxis = frame.axes[2]
  const positions: number[] = []
  const colors: number[] = []

  const pushAxis = (endpoint: number[] | undefined, color: [number, number, number]) => {
    if (!endpoint) return
    positions.push(origin[0] ?? 0, origin[1] ?? 0, origin[2] ?? 0)
    positions.push(endpoint[0] ?? 0, endpoint[1] ?? 0, endpoint[2] ?? 0)
    colors.push(color[0], color[1], color[2])
    colors.push(color[0], color[1], color[2])
  }

  pushAxis(xAxis, [1, 0.35, 0.3])
  pushAxis(yAxis, [0.2, 0.85, 0.45])
  pushAxis(zAxis, [0.25, 0.45, 1])

  target.geometry.dispose()
  const geometry = new THREERef.BufferGeometry()
  geometry.setAttribute('position', new THREERef.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREERef.Float32BufferAttribute(colors, 3))
  target.geometry = geometry

  const material = target.material
  if (!Array.isArray(material)) {
    material.opacity = opacity
  }
}

function renderScene() {
  if (!renderer || !scene || !camera || isRendering) return

  isRendering = true
  try {
    if (worldAxes) {
      worldAxes.visible = props.localFrame.showWorld
    }
    if (currentLocalAxes) {
      currentLocalAxes.visible = props.localFrame.showLocal
    }
    if (finalLocalAxes) {
      finalLocalAxes.visible = props.localFrame.showLocal
    }

    if (baseObject) {
      baseObject.visible = props.showBaseObject
    }
    if (props.showBaseObject) {
      updateLineGeometry(baseObject, props.basePoints)
    }
    updateLineGeometry(currentObject, props.currentPoints)
    updateLineGeometry(finalObject, props.finalPoints)
    updateFrameGeometry(currentLocalAxes, props.currentFrame, 1)
    updateFrameGeometry(finalLocalAxes, props.finalFrame, 0.2)

    renderer.render(scene, camera)
  } finally {
    isRendering = false
  }
}

function fitRenderer() {
  if (!host.value || !renderer || !camera) return
  const width = host.value.clientWidth || 900
  const height = Math.max(420, Math.round(width * 0.66))
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderScene()
}

function resetView() {
  if (!camera || !controls) return
  controls.target.set(0, 0, 0)
  camera.position.set(3.2, 2.8, 4.2)
  controls.update()
  renderScene()
}

onMounted(async () => {
  if (!host.value) return

  try {
    const [{ OrbitControls }, threeModule] = await Promise.all([
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three'),
    ])

    THREERef = threeModule
    OrbitControlsRef = OrbitControls

    renderer = new THREERef.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.value.appendChild(renderer.domElement)

    scene = new THREERef.Scene()
    camera = new THREERef.PerspectiveCamera(45, 1, 0.1, 100)

    controls = new OrbitControlsRef(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = true
    controls.minDistance = 2
    controls.maxDistance = 18
    controls.addEventListener('change', renderScene)

    const light = new THREERef.DirectionalLight(0xffffff, 0.9)
    light.position.set(5, 6, 4)
    scene.add(light)
    scene.add(new THREERef.AmbientLight(0xffffff, 0.4))
    scene.add(new THREERef.GridHelper(8, 16, 0x8190a5, 0xd0d6df))

    worldAxes = new THREERef.AxesHelper(2.2)
    scene.add(worldAxes)

    baseObject = createLineObject(0x7b8798, 0.45)
    currentObject = createLineObject(0x2f67ff, 1)
    finalObject = createLineObject(0x2f67ff, 0.2)
    currentLocalAxes = createFrameObject()
    finalLocalAxes = createFrameObject()

    if (baseObject) scene.add(baseObject)
    if (finalObject) scene.add(finalObject)
    if (currentObject) scene.add(currentObject)
    if (finalLocalAxes) scene.add(finalLocalAxes)
    if (currentLocalAxes) scene.add(currentLocalAxes)

    resizeObserver = new ResizeObserver(() => fitRenderer())
    resizeObserver.observe(host.value)

    resetView()
    fitRenderer()
    isLoading.value = false
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load 3D canvas.'
    isLoading.value = false
  }
})

watch(
  () => [props.currentStep, props.basePoints, props.currentPoints, props.finalPoints, props.currentFrame, props.finalFrame, props.localFrame.showWorld, props.localFrame.showLocal, props.wireframeMode],
  () => renderScene(),
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  controls?.dispose()
  if (renderer && host.value) {
    host.value.removeChild(renderer.domElement)
  }
  baseObject?.geometry.dispose()
  currentObject?.geometry.dispose()
  finalObject?.geometry.dispose()
  currentLocalAxes?.geometry.dispose()
  finalLocalAxes?.geometry.dispose()
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  controls = null
  worldAxes = null
  baseObject = null
  currentObject = null
  finalObject = null
  currentLocalAxes = null
  finalLocalAxes = null
  THREERef = null
  OrbitControlsRef = null
})
</script>

<template>
  <div class="three-wrap">
    <div class="toolbar">
      <div class="label">Step {{ Math.min(currentStep + 1, Math.max(totalSteps, 1)) }} / {{ Math.max(totalSteps, 1) }} - 3D Affine Transform Preview</div>
      <button type="button" class="reset-btn" :disabled="isLoading || !!loadError" @click="resetView">Reset View</button>
    </div>
    <div v-if="isLoading" class="three-message">Loading 3D renderer...</div>
    <div v-else-if="loadError" class="three-message error">{{ loadError }}</div>
    <div v-show="!isLoading && !loadError" ref="host" class="three-host" />
  </div>
</template>

<style scoped>
.three-wrap {
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.label {
  color: var(--text-dim);
  font-size: 0.85rem;
}

.reset-btn {
  border: 1px solid var(--border);
  background: var(--panel-bg);
  color: var(--text-main);
  padding: 7px 10px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
}

.reset-btn:hover:not(:disabled) {
  background: var(--surface-hover);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.three-message,
.three-host {
  width: min(100%, 900px);
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: radial-gradient(circle at 15% 10%, #ffffff 0%, #f2f4f8 55%, #e8edf5 100%);
}

.three-message {
  min-height: 420px;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  font-size: 0.92rem;
}

.three-message.error {
  color: #a33a3a;
}

.three-host :deep(canvas) {
  display: block;
  width: 100%;
  height: auto;
}
</style>