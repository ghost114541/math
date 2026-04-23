export type ExampleId =
  | 'affine-2d'
  | 'affine-3d'
  | 'projection-axonometric'
  | 'projection-perspective'
  | 'model-view-matrix'
  | 'clipping-3d'
export type DimensionalMode = '2d' | '3d'
export type TransformType = 'translate' | 'rotate' | 'scale' | 'shear' | 'reflect'
export type WireframeMode = 'auto' | 'cube' | 'sequential'

export interface ExampleDefinition {
  id: ExampleId
  title: string
  subtitle: string
  group: string
  route: string
}

export interface TransformItem {
  id: number
  type: TransformType
  params: string
  enabled: boolean
  matrixLatex: string
}

export interface TransformDraftField {
  key: string
  label: string
  inputMode: 'number' | 'select'
  placeholder?: string
  options?: Array<{ label: string; value: string }>
}

export interface ValidationState {
  draft: string | null
  points: string | null
  localFrame: string | null
  draftFieldErrors: Record<string, string>
  pointFieldErrors: Record<string, string>
  localOriginErrors: Record<string, string>
}

export interface LocalFrameState {
  origin: number[]
  showWorld: boolean
  showLocal: boolean
}

export interface DemoScenario {
  id: string
  mode: DimensionalMode
  label: string
  summary: string
  points: number[][]
  localOrigin: number[]
  transforms: Array<{
    type: TransformType
    params: string
  }>
}

export interface MockPlaybackState {
  isPlaying: boolean
  currentStep: number
  speed: number
  mode: 'loop' | 'step'
}

export interface ThemeState {
  theme: 'light' | 'dark'
}
