import { computed, reactive, ref } from 'vue'
import { computeAffineState, defaultFrame } from '../lib/affine.js'
import type { DemoScenario, DimensionalMode, LocalFrameState, TransformDraftField, TransformItem, TransformType, ValidationState } from '../types/cg.js'
import { useMockPlayback } from './useMockPlayback.js'

interface DraftTemplate {
  fields: TransformDraftField[]
  defaults: Record<string, string>
}

const TRANSFORM_TYPES: ReadonlyArray<{ label: string; value: TransformType }> = [
  { label: 'Translation', value: 'translate' },
  { label: 'Rotation', value: 'rotate' },
  { label: 'Scaling', value: 'scale' },
  { label: 'Shear', value: 'shear' },
  { label: 'Reflection', value: 'reflect' },
]

const DRAFT_LIBRARY: Record<DimensionalMode, Record<TransformType, DraftTemplate>> = {
  '2d': {
    translate: {
      defaults: { dx: '20', dy: '10' },
      fields: [
        { key: 'dx', label: 'dx', inputMode: 'number', placeholder: '20' },
        { key: 'dy', label: 'dy', inputMode: 'number', placeholder: '10' },
      ],
    },
    rotate: {
      defaults: { theta: '30' },
      fields: [{ key: 'theta', label: 'Angle (deg)', inputMode: 'number', placeholder: '30' }],
    },
    scale: {
      defaults: { sx: '1.2', sy: '0.9' },
      fields: [
        { key: 'sx', label: 'sx', inputMode: 'number', placeholder: '1.2' },
        { key: 'sy', label: 'sy', inputMode: 'number', placeholder: '0.9' },
      ],
    },
    shear: {
      defaults: { shx: '0.4', shy: '0' },
      fields: [
        { key: 'shx', label: 'shx', inputMode: 'number', placeholder: '0.4' },
        { key: 'shy', label: 'shy', inputMode: 'number', placeholder: '0' },
      ],
    },
    reflect: {
      defaults: { axis: 'x' },
      fields: [
        {
          key: 'axis',
          label: 'Reflect About',
          inputMode: 'select',
          options: [
            { label: 'X-axis', value: 'x' },
            { label: 'Y-axis', value: 'y' },
          ],
        },
      ],
    },
  },
  '3d': {
    translate: {
      defaults: { dx: '0.8', dy: '0.4', dz: '-0.5' },
      fields: [
        { key: 'dx', label: 'dx', inputMode: 'number', placeholder: '0.8' },
        { key: 'dy', label: 'dy', inputMode: 'number', placeholder: '0.4' },
        { key: 'dz', label: 'dz', inputMode: 'number', placeholder: '-0.5' },
      ],
    },
    rotate: {
      defaults: { theta: '20', axis: 'y' },
      fields: [
        { key: 'theta', label: 'Angle (deg)', inputMode: 'number', placeholder: '20' },
        {
          key: 'axis',
          label: 'Axis',
          inputMode: 'select',
          options: [
            { label: 'X-axis', value: 'x' },
            { label: 'Y-axis', value: 'y' },
            { label: 'Z-axis', value: 'z' },
          ],
        },
      ],
    },
    scale: {
      defaults: { sx: '1.1', sy: '1.1', sz: '0.8' },
      fields: [
        { key: 'sx', label: 'sx', inputMode: 'number', placeholder: '1.1' },
        { key: 'sy', label: 'sy', inputMode: 'number', placeholder: '1.1' },
        { key: 'sz', label: 'sz', inputMode: 'number', placeholder: '0.8' },
      ],
    },
    shear: {
      defaults: { shxy: '0.2', shxz: '0', shyx: '0', shyz: '0', shzx: '0', shzy: '0' },
      fields: [
        { key: 'shxy', label: 'shxy', inputMode: 'number', placeholder: '0.2' },
        { key: 'shxz', label: 'shxz', inputMode: 'number', placeholder: '0' },
        { key: 'shyx', label: 'shyx', inputMode: 'number', placeholder: '0' },
        { key: 'shyz', label: 'shyz', inputMode: 'number', placeholder: '0' },
        { key: 'shzx', label: 'shzx', inputMode: 'number', placeholder: '0' },
        { key: 'shzy', label: 'shzy', inputMode: 'number', placeholder: '0' },
      ],
    },
    reflect: {
      defaults: { axis: 'z' },
      fields: [
        {
          key: 'axis',
          label: 'Reflect About',
          inputMode: 'select',
          options: [
            { label: 'YZ plane (flip x)', value: 'x' },
            { label: 'XZ plane (flip y)', value: 'y' },
            { label: 'XY plane (flip z)', value: 'z' },
          ],
        },
      ],
    },
  },
}

function defaultTransforms(mode: DimensionalMode): TransformItem[] {
  return [
    {
      id: 1,
      type: 'translate',
      params: mode === '2d' ? 'dx=80, dy=20' : 'dx=0.8, dy=0.4, dz=-0.5',
      enabled: true,
      matrixLatex: '',
    },
    {
      id: 2,
      type: 'rotate',
      params: mode === '2d' ? 'theta=30 deg' : 'theta=20 deg, axis=y',
      enabled: true,
      matrixLatex: '',
    },
    {
      id: 3,
      type: 'scale',
      params: mode === '2d' ? 'sx=1.2, sy=0.9' : 'sx=1.1, sy=1.1, sz=0.8',
      enabled: true,
      matrixLatex: '',
    },
  ]
}

export function useAffineDemo(mode: DimensionalMode) {
  const points = ref(mode === '2d' ? default2DPoints() : default3DPoints())
  const pointDrafts = ref(points.value.map((row) => row.map((value) => formatDraftNumber(value))))

  const localFrame = reactive<LocalFrameState>({
    origin: mode === '2d' ? [0, 0] : [0, 0, 0],
    showWorld: true,
    showLocal: true,
  })
  const localOriginDrafts = ref(localFrame.origin.map((value) => formatDraftNumber(value)))

  const validation = reactive<ValidationState>({
    draft: null,
    points: null,
    localFrame: null,
    draftFieldErrors: {},
    pointFieldErrors: {},
    localOriginErrors: {},
  })

  const transformItems = ref<TransformItem[]>(defaultTransforms(mode))
  const draftType = ref<TransformType>('translate')
  const draftValues = ref(createDraftValues(mode, draftType.value))

  const transformTypeOptions = TRANSFORM_TYPES
  const steps = computed(() => transformItems.value.length || 1)
  const playback = useMockPlayback(steps)

  const affineState = computed(() => computeAffineState(mode, points.value, transformItems.value, localFrame.origin))
  const draftFields = computed(() => DRAFT_LIBRARY[mode][draftType.value].fields)
  const draftParams = computed(() => serializeDraft(mode, draftType.value, draftValues.value))

  const transforms = computed(() =>
    transformItems.value.map((item, index) => ({
      ...item,
      matrixLatex: affineState.value.matrixLatexList[index] ?? item.matrixLatex,
    })),
  )

  const currentStepIndex = computed(() => {
    if (transformItems.value.length === 0) return -1
    return Math.min(playback.currentStep.value, transformItems.value.length - 1)
  })

  const currentPoints = computed(() => {
    const index = currentStepIndex.value
    if (index < 0) return points.value
    return affineState.value.stepPoints[index] ?? points.value
  })

  const finalPoints = computed(() => {
    const list = affineState.value.stepPoints
    return list.length > 0 ? (list[list.length - 1] ?? points.value) : points.value
  })

  const currentFrame = computed(() => {
    const index = currentStepIndex.value
    if (index < 0) return defaultFrame(mode, localFrame.origin)
    return affineState.value.frameSteps[index] ?? defaultFrame(mode, localFrame.origin)
  })

  const finalFrame = computed(() => {
    const list = affineState.value.frameSteps
    return list.length > 0 ? (list[list.length - 1] ?? defaultFrame(mode, localFrame.origin)) : defaultFrame(mode, localFrame.origin)
  })

  const validatePointSet = () => {
    const expectedLength = mode === '2d' ? 3 : 4
    const nextErrors: Record<string, string> = {}

    if (points.value.length === 0) {
      validation.points = 'Point set is empty. Add at least one point or load the default example.'
      validation.pointFieldErrors = nextErrors
      return false
    }

    for (const [rowIndex, row] of points.value.entries()) {
      if (row.length !== expectedLength) {
        validation.points = `Each ${mode === '2d' ? '2D point' : '3D vertex'} must contain ${expectedLength} homogeneous coordinates.`
        validation.pointFieldErrors = nextErrors
        return false
      }

      const lastIndex = expectedLength - 1
      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        const key = pointErrorKey(rowIndex, colIndex)
        if (colIndex === lastIndex) {
          if ((row[colIndex] ?? 1) !== 1) {
            row[colIndex] = 1
            nextErrors[key] = 'w is fixed at 1.'
            updatePointDraftCell(rowIndex, colIndex, '1')
          }
          continue
        }

        if (!Number.isFinite(row[colIndex])) {
          nextErrors[key] = 'Enter a valid number.'
        }
      }
    }

    validation.pointFieldErrors = nextErrors
    validation.points = Object.keys(nextErrors).length > 0 ? 'Fix the highlighted point fields before continuing.' : null
    return Object.keys(nextErrors).length === 0
  }

  const validateLocalFrame = () => {
    const nextErrors: Record<string, string> = {}
    for (const [index, value] of localFrame.origin.entries()) {
      if (!Number.isFinite(value)) {
        nextErrors[String(index)] = 'Enter a valid number.'
      }
    }

    validation.localOriginErrors = nextErrors
    validation.localFrame = Object.keys(nextErrors).length > 0 ? 'Fix the highlighted local origin fields.' : null
    return Object.keys(nextErrors).length === 0
  }

  const validateDraft = () => {
    const fields = DRAFT_LIBRARY[mode][draftType.value].fields
    const nextErrors: Record<string, string> = {}
    for (const field of fields) {
      const rawValue = draftValues.value[field.key]
      if (field.inputMode === 'select') {
        if (!rawValue) {
          nextErrors[field.key] = `Please choose ${field.label.toLowerCase()}.`
        }
        continue
      }

      if (rawValue == null || rawValue.trim() === '') {
        nextErrors[field.key] = `${field.label} is required.`
        continue
      }

      const parsed = Number(rawValue)
      if (!Number.isFinite(parsed)) {
        nextErrors[field.key] = `${field.label} must be a valid number.`
      }
    }

    validation.draftFieldErrors = nextErrors
    validation.draft = Object.keys(nextErrors).length > 0 ? 'Fix the highlighted transform parameter fields.' : null
    return Object.keys(nextErrors).length === 0
  }

  const addTransform = () => {
    if (!validateDraft()) {
      return
    }

    transformItems.value.push({
      id: Date.now(),
      type: draftType.value,
      params: draftParams.value,
      enabled: true,
      matrixLatex: '',
    })
  }

  const removeTransform = (index: number) => {
    transformItems.value.splice(index, 1)
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const current = transformItems.value[index]
    const previous = transformItems.value[index - 1]
    if (!current || !previous) return
    transformItems.value[index - 1] = current
    transformItems.value[index] = previous
  }

  const moveDown = (index: number) => {
    if (index >= transformItems.value.length - 1) return
    const current = transformItems.value[index]
    const next = transformItems.value[index + 1]
    if (!current || !next) return
    transformItems.value[index] = next
    transformItems.value[index + 1] = current
  }

  const resetLocalToWorld = () => {
    localFrame.origin = mode === '2d' ? [0, 0] : [0, 0, 0]
    syncLocalOriginDrafts()
    validateLocalFrame()
  }

  const loadLocalDefault = () => {
    localFrame.origin = mode === '2d' ? [4, -2] : [0.25, -0.25, 0]
    syncLocalOriginDrafts()
    validateLocalFrame()
  }

  const loadDefaultPoints = () => {
    points.value = mode === '2d' ? default2DPoints() : default3DPoints()
    syncPointDrafts()
    validatePointSet()
  }

  const clearPoints = () => {
    points.value = []
    pointDrafts.value = []
    validatePointSet()
  }

  const updatePoint = (rowIndex: number, colIndex: number, rawValue: string) => {
    const row = points.value[rowIndex]
    if (!row || colIndex < 0 || colIndex >= row.length) return
    const lastIndex = row.length - 1
    const key = pointErrorKey(rowIndex, colIndex)

    updatePointDraftCell(rowIndex, colIndex, rawValue)

    if (colIndex === lastIndex) {
      row[colIndex] = 1
      updatePointDraftCell(rowIndex, colIndex, '1')
      validation.pointFieldErrors = {
        ...validation.pointFieldErrors,
        [key]: 'w is fixed at 1.',
      }
      validation.points = 'Homogeneous coordinate w is fixed at 1 for this teaching demo.'
      return
    }

    const normalized = rawValue.trim()
    if (normalized === '') {
      setPointFieldError(key, 'This field is required.')
      return
    }

    if (isIntermediateNumberDraft(normalized)) {
      setPointFieldError(key, 'Continue typing the number.')
      return
    }

    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
      setPointFieldError(key, 'Enter a valid number.')
      return
    }

    row[colIndex] = parsed
    validation.pointFieldErrors = omitKey(validation.pointFieldErrors, key)
    validatePointSet()
  }

  const commitPointInput = (rowIndex: number, colIndex: number) => {
    const row = points.value[rowIndex]
    const draftRow = pointDrafts.value[rowIndex]
    if (!row || !draftRow) return
    const key = pointErrorKey(rowIndex, colIndex)
    const lastIndex = row.length - 1

    if (colIndex === lastIndex) {
      draftRow[colIndex] = '1'
      validation.pointFieldErrors = omitKey(validation.pointFieldErrors, key)
      validatePointSet()
      return
    }

    const rawValue = draftRow[colIndex] ?? ''
    const normalized = rawValue.trim()
    if (normalized === '' || isIntermediateNumberDraft(normalized) || Number.isNaN(Number(normalized))) {
      draftRow[colIndex] = formatDraftNumber(row[colIndex] ?? 0)
      validation.pointFieldErrors = omitKey(validation.pointFieldErrors, key)
      validatePointSet()
      return
    }

    const parsed = Number(normalized)
    row[colIndex] = parsed
    draftRow[colIndex] = formatDraftNumber(parsed)
    validation.pointFieldErrors = omitKey(validation.pointFieldErrors, key)
    validatePointSet()
  }

  const revertPointInput = (rowIndex: number, colIndex: number) => {
    const row = points.value[rowIndex]
    const draftRow = pointDrafts.value[rowIndex]
    if (!row || !draftRow) return

    const fallback = colIndex === row.length - 1 ? 1 : (row[colIndex] ?? 0)
    draftRow[colIndex] = formatDraftNumber(fallback)
    validation.pointFieldErrors = omitKey(validation.pointFieldErrors, pointErrorKey(rowIndex, colIndex))
    validatePointSet()
  }

  const removePoint = (rowIndex: number) => {
    if (rowIndex < 0 || rowIndex >= points.value.length) return
    points.value.splice(rowIndex, 1)
    pointDrafts.value.splice(rowIndex, 1)
    syncPointDrafts()
    validatePointSet()
  }

  const addPoint = () => {
    if (mode === '2d') {
      points.value.push([0, 0, 1])
    } else {
      points.value.push([0, 0, 0, 1])
    }
    syncPointDrafts()
    validatePointSet()
  }

  const setShowWorld = (value: boolean) => {
    localFrame.showWorld = value
  }

  const setShowLocal = (value: boolean) => {
    localFrame.showLocal = value
  }

  const updateLocalOrigin = (index: number, rawValue: string) => {
    if (index < 0 || index >= localFrame.origin.length) return
    localOriginDrafts.value[index] = rawValue

    const normalized = rawValue.trim()
    if (normalized === '') {
      setLocalOriginError(index, 'This field is required.')
      return
    }

    if (isIntermediateNumberDraft(normalized)) {
      setLocalOriginError(index, 'Continue typing the number.')
      return
    }

    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
      setLocalOriginError(index, 'Enter a valid number.')
      return
    }

    localFrame.origin[index] = parsed
    validation.localOriginErrors = omitKey(validation.localOriginErrors, String(index))
    validateLocalFrame()
  }

  const commitLocalOriginInput = (index: number) => {
    if (index < 0 || index >= localFrame.origin.length) return
    const rawValue = localOriginDrafts.value[index] ?? ''
    const normalized = rawValue.trim()

    if (normalized === '' || isIntermediateNumberDraft(normalized) || Number.isNaN(Number(normalized))) {
      localOriginDrafts.value[index] = formatDraftNumber(localFrame.origin[index] ?? 0)
      validation.localOriginErrors = omitKey(validation.localOriginErrors, String(index))
      validateLocalFrame()
      return
    }

    const parsed = Number(normalized)
    localFrame.origin[index] = parsed
    localOriginDrafts.value[index] = formatDraftNumber(parsed)
    validation.localOriginErrors = omitKey(validation.localOriginErrors, String(index))
    validateLocalFrame()
  }

  const revertLocalOriginInput = (index: number) => {
    if (index < 0 || index >= localFrame.origin.length) return
    localOriginDrafts.value[index] = formatDraftNumber(localFrame.origin[index] ?? 0)
    validation.localOriginErrors = omitKey(validation.localOriginErrors, String(index))
    validateLocalFrame()
  }

  const updateDraftType = (value: TransformType) => {
    draftType.value = value
    resetDraft(value)
  }

  const resetDraft = (type?: TransformType) => {
    const nextType = isTransformType(type) ? type : draftType.value
    draftValues.value = createDraftValues(mode, nextType)
    validation.draft = null
    validation.draftFieldErrors = {}
  }

  const applyScenario = (scenario: DemoScenario) => {
    if (scenario.mode !== mode) return

    points.value = scenario.points.map((row) => [...row])
    pointDrafts.value = points.value.map((row) => row.map((value) => formatDraftNumber(value)))
    localFrame.origin = [...scenario.localOrigin]
    localFrame.showWorld = true
    localFrame.showLocal = true
    localOriginDrafts.value = localFrame.origin.map((value) => formatDraftNumber(value))
    transformItems.value = scenario.transforms.map((item, index) => ({
      id: Date.now() + index,
      type: item.type,
      params: item.params,
      enabled: true,
      matrixLatex: '',
    }))

    const nextDraftType = scenario.transforms[0]?.type ?? 'translate'
    draftType.value = nextDraftType
    resetDraft(nextDraftType)
    playback.reset()
    validatePointSet()
    validateLocalFrame()
  }

  const updateDraftField = (key: string, value: string) => {
    draftValues.value = {
      ...draftValues.value,
      [key]: value,
    }
    if (value.trim() === '') {
      validation.draftFieldErrors = {
        ...validation.draftFieldErrors,
        [key]: 'This field is required.',
      }
      validation.draft = 'Fix the highlighted transform parameter fields.'
      return
    }

    validation.draftFieldErrors = omitKey(validation.draftFieldErrors, key)
    validation.draft = Object.keys(validation.draftFieldErrors).filter((fieldKey) => fieldKey !== key).length > 0 ? 'Fix the highlighted transform parameter fields.' : null
    validateDraft()
  }

  const start = () => {
    const validPoints = validatePointSet()
    const validLocalFrame = validateLocalFrame()
    if (!validPoints || !validLocalFrame) {
      playback.pause()
      return
    }
    playback.start()
  }

  const stepForward = () => {
    const validPoints = validatePointSet()
    const validLocalFrame = validateLocalFrame()
    if (!validPoints || !validLocalFrame) {
      return
    }
    playback.stepForward()
  }

  const compositeMatrixLatex = computed(() => affineState.value.compositeLatex)

  validatePointSet()
  validateLocalFrame()
  validateDraft()

  return {
    points,
    pointDrafts,
    currentPoints,
    finalPoints,
    currentFrame,
    finalFrame,
    localFrame,
    localOriginDrafts,
    transforms,
    transformTypeOptions,
    draftType,
    draftFields,
    draftValues,
    draftParams,
    validation,
    addTransform,
    removeTransform,
    moveUp,
    moveDown,
    loadLocalDefault,
    resetLocalToWorld,
    loadDefaultPoints,
    clearPoints,
    updatePoint,
    commitPointInput,
    revertPointInput,
    removePoint,
    addPoint,
    setShowWorld,
    setShowLocal,
    updateLocalOrigin,
    commitLocalOriginInput,
    revertLocalOriginInput,
    updateDraftType,
    updateDraftField,
    resetDraft,
    applyScenario,
    compositeMatrixLatex,
    isPlaying: playback.isPlaying,
    currentStep: playback.currentStep,
    speed: playback.speed,
    mode: playback.mode,
    start,
    pause: playback.pause,
    stepForward,
    reset: playback.reset,
  }

  function syncPointDrafts() {
    pointDrafts.value = points.value.map((row) => row.map((value) => formatDraftNumber(value)))
  }

  function updatePointDraftCell(rowIndex: number, colIndex: number, value: string) {
    if (!pointDrafts.value[rowIndex]) {
      pointDrafts.value[rowIndex] = []
    }
    pointDrafts.value[rowIndex]![colIndex] = value
  }

  function syncLocalOriginDrafts() {
    localOriginDrafts.value = localFrame.origin.map((value) => formatDraftNumber(value))
  }

  function setPointFieldError(key: string, message: string) {
    validation.pointFieldErrors = {
      ...validation.pointFieldErrors,
      [key]: message,
    }
    validation.points = 'Fix the highlighted point fields before continuing.'
  }

  function setLocalOriginError(index: number, message: string) {
    validation.localOriginErrors = {
      ...validation.localOriginErrors,
      [String(index)]: message,
    }
    validation.localFrame = 'Fix the highlighted local origin fields.'
  }
}

function createDraftValues(mode: DimensionalMode, type: TransformType) {
  return { ...DRAFT_LIBRARY[mode][type].defaults }
}

function isTransformType(value: unknown): value is TransformType {
  return typeof value === 'string' && TRANSFORM_TYPES.some((item) => item.value === value)
}

function serializeDraft(mode: DimensionalMode, type: TransformType, values: Record<string, string>) {
  if (mode === '2d') {
    switch (type) {
      case 'translate':
        return `dx=${values.dx}, dy=${values.dy}`
      case 'rotate':
        return `theta=${values.theta} deg`
      case 'scale':
        return `sx=${values.sx}, sy=${values.sy}`
      case 'shear':
        return `shx=${values.shx}, shy=${values.shy}`
      case 'reflect':
        return `axis=${values.axis}`
    }
  }

  switch (type) {
    case 'translate':
      return `dx=${values.dx}, dy=${values.dy}, dz=${values.dz}`
    case 'rotate':
      return `theta=${values.theta} deg, axis=${values.axis}`
    case 'scale':
      return `sx=${values.sx}, sy=${values.sy}, sz=${values.sz}`
    case 'shear':
      return `shxy=${values.shxy}, shxz=${values.shxz}, shyx=${values.shyx}, shyz=${values.shyz}, shzx=${values.shzx}, shzy=${values.shzy}`
    case 'reflect':
      return `axis=${values.axis}`
  }
}

function omitKey(map: Record<string, string>, key: string) {
  const next = { ...map }
  delete next[key]
  return next
}

function pointErrorKey(rowIndex: number, colIndex: number) {
  return `${rowIndex}:${colIndex}`
}

function isIntermediateNumberDraft(value: string) {
  return value === '-' || value === '.' || value === '-.'
}

function formatDraftNumber(value: number) {
  return Number.isFinite(value) ? String(value) : ''
}

function default2DPoints() {
  return [
    [0, 40, 1],
    [14, 14, 1],
    [40, 8, 1],
    [20, -10, 1],
    [24, -38, 1],
    [0, -22, 1],
    [-24, -38, 1],
    [-20, -10, 1],
    [-40, 8, 1],
    [-14, 14, 1],
  ]
}

function default3DPoints() {
  return [
    [-1, -1, -1, 1],
    [1, -1, -1, 1],
    [1, 1, -1, 1],
    [-1, 1, -1, 1],
    [-1, -1, 1, 1],
    [1, -1, 1, 1],
    [1, 1, 1, 1],
    [-1, 1, 1, 1],
  ]
}
