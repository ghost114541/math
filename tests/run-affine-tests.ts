import assert from 'node:assert/strict'
import { computeAffineState, defaultFrame } from '../src/lib/affine.js'
import { AFFINE_SCENARIOS } from '../src/config/scenarios.js'
import { buildWireframeEdges } from '../src/lib/wireframe.js'
import { useAffineDemo } from '../src/composables/useAffineDemo.js'
import type { DemoScenario, TransformItem } from '../src/types/cg.js'
import {
  AXONOMETRIC_PRESETS,
  applyMatrix,
  computeProjectionState,
  multiplyMatrices,
  orthographicProjectionMatrix,
  rotationX,
  rotationY,
} from '../src/lib/projection.js'
import {
  applyMatrix as applyPerspectiveMatrix,
  computePerspectiveState,
  onePointPerspectiveMatrix,
  perspectiveDivide2d,
} from '../src/lib/perspective.js'
import {
  computeModelViewState,
  lookAtViewMatrix,
  multiplyMatrices as multiplyModelViewMatrices,
  translation,
} from '../src/lib/modelView.js'
import { classifyPoint, clipLineSegment, clipPolygon, computeClippingState } from '../src/lib/clipping.js'

Object.assign(globalThis, { window: globalThis })

function createTransform(type: TransformItem['type'], params: string): TransformItem {
  return {
    id: Date.now(),
    type,
    params,
    enabled: true,
    matrixLatex: '',
  }
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: '2D composite transform applies in step order',
    run: () => {
      const state = computeAffineState(
        '2d',
        [[1, 0, 1]],
        [createTransform('translate', 'dx=2, dy=3'), createTransform('rotate', 'theta=90 deg')],
        [0, 0],
      )

      assert.deepEqual(state.stepPoints[0], [[3, 3, 1]])
      assert.deepEqual(roundPoints(state.stepPoints[1] ?? []), [[-3, 3, 1]])
      assert.deepEqual(roundMatrix(state.compositeMatrix), [
        [0, -1, -3],
        [1, 0, 2],
        [0, 0, 1],
      ])
    },
  },
  {
    name: '3D scale then translate computes expected final point',
    run: () => {
      const state = computeAffineState(
        '3d',
        [[1, 2, 3, 1]],
        [createTransform('scale', 'sx=2, sy=3, sz=4'), createTransform('translate', 'dx=5, dy=-1, dz=2')],
        [0, 0, 0],
      )

      assert.deepEqual(state.stepPoints[0], [[2, 6, 12, 1]])
      assert.deepEqual(state.stepPoints[1], [[7, 5, 14, 1]])
    },
  },
  {
    name: '2D shear and reflection produce expected matrices and points',
    run: () => {
      const state = computeAffineState(
        '2d',
        [[2, 1, 1]],
        [createTransform('shear', 'shx=1, shy=0'), createTransform('reflect', 'axis=y')],
        [0, 0],
      )

      assert.deepEqual(state.stepPoints[0], [[3, 1, 1]])
      assert.deepEqual(state.stepPoints[1], [[-3, 1, 1]])
      assert.deepEqual(roundMatrix(state.matrices[0] ?? []), [
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 1],
      ])
    },
  },
  {
    name: '3D reflection across XY plane flips z and preserves x/y',
    run: () => {
      const state = computeAffineState(
        '3d',
        [[2, -1, 4, 1]],
        [createTransform('reflect', 'axis=z')],
        [0, 0, 0],
      )

      assert.deepEqual(state.stepPoints[0], [[2, -1, -4, 1]])
      assert.deepEqual(roundMatrix(state.matrices[0] ?? []), [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, 1],
      ])
    },
  },
  {
    name: 'missing numeric params fall back to identity-like defaults',
    run: () => {
      const state = computeAffineState(
        '2d',
        [[5, 6, 1]],
        [createTransform('translate', 'bad input'), createTransform('scale', 'sx=2')],
        [0, 0],
      )

      assert.deepEqual(state.stepPoints[0], [[5, 6, 1]])
      assert.deepEqual(state.stepPoints[1], [[10, 6, 1]])
    },
  },
  {
    name: 'empty transform chain keeps identity composite and no steps',
    run: () => {
      const state = computeAffineState('3d', [[1, 2, 3, 1]], [], [1, 1, 1])
      assert.equal(state.stepPoints.length, 0)
      assert.deepEqual(roundMatrix(state.compositeMatrix), [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ])
      assert.equal(state.compositeLatex.includes('bmatrix'), true)
      assert.equal(state.compositeLatex.includes('\\\\'), true)
    },
  },
  {
    name: '3D rotation respects explicit axis parameter',
    run: () => {
      const state = computeAffineState(
        '3d',
        [[0, 1, 0, 1]],
        [createTransform('rotate', 'theta=90 deg, axis=z')],
        [0, 0, 0],
      )

      assert.deepEqual(roundPoints(state.stepPoints[0] ?? []), [[-1, 0, 0, 1]])
    },
  },
  {
    name: 'local frame follows transformed origin and axes',
    run: () => {
      const frame = defaultFrame('2d', [1, 2])
      assert.deepEqual(frame.origin, [1, 2])
      assert.deepEqual(frame.axes, [
        [25, 2],
        [1, 26],
      ])

      const state = computeAffineState('3d', [[0, 0, 0, 1]], [createTransform('translate', 'dx=3, dy=4, dz=5')], [1, 2, 3])
      assert.deepEqual(state.frameSteps[0]?.origin, [4, 6, 8])
      assert.deepEqual(state.frameSteps[0]?.axes, [
        [5, 6, 8],
        [4, 7, 8],
        [4, 6, 9],
      ])
    },
  },
  {
    name: 'wireframe inference preserves cube edge count and connects simple point sets',
    run: () => {
      const cubePoints = [
        [-1, -1, -1, 1],
        [1, -1, -1, 1],
        [1, 1, -1, 1],
        [-1, 1, -1, 1],
        [-1, -1, 1, 1],
        [1, -1, 1, 1],
        [1, 1, 1, 1],
        [-1, 1, 1, 1],
      ]

      const cubeEdges = buildWireframeEdges('3d', cubePoints)
      assert.equal(cubeEdges.length, 12)
      assert.ok(cubeEdges.some(([a, b]) => a === 0 && b === 1))
      assert.ok(cubeEdges.some(([a, b]) => a === 0 && b === 4))

      const triangle = buildWireframeEdges('2d', [
        [0, 0, 1],
        [4, 0, 1],
        [2, 3, 1],
      ])
      assert.equal(triangle.length, 3)
    },
  },
  {
    name: 'wireframe mode switch supports explicit cube and sequential strategies',
    run: () => {
      const cubePoints = [
        [-1, -1, -1, 1],
        [1, -1, -1, 1],
        [1, 1, -1, 1],
        [-1, 1, -1, 1],
        [-1, -1, 1, 1],
        [1, -1, 1, 1],
        [1, 1, 1, 1],
        [-1, 1, 1, 1],
      ]

      assert.deepEqual(buildWireframeEdges('3d', cubePoints, 'cube'), [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ])
      assert.deepEqual(buildWireframeEdges('3d', cubePoints.slice(0, 4), 'sequential'), [
        [0, 1], [1, 2], [2, 3],
      ])
    },
  },
  {
    name: 'cube mode falls back safely for non-cube point counts',
    run: () => {
      assert.deepEqual(buildWireframeEdges('3d', [[0, 0, 0, 1], [1, 0, 0, 1], [1, 1, 0, 1]], 'cube'), [
        [0, 1], [1, 2],
      ])
    },
  },
  {
    name: 'wireframe fallback handles tiny point sets',
    run: () => {
      assert.deepEqual(buildWireframeEdges('3d', [[0, 0, 0, 1]]), [])
      assert.deepEqual(buildWireframeEdges('3d', [[0, 0, 0, 1], [1, 0, 0, 1]]), [[0, 1]])
    },
  },
  {
    name: 'point draft commits numeric value on demand',
    run: () => {
      const demo = useAffineDemo('2d')
      demo.updatePoint(0, 0, '12.5')
      demo.commitPointInput(0, 0)

      assert.equal(demo.points.value[0]?.[0], 12.5)
      assert.equal(demo.pointDrafts.value[0]?.[0], '12.5')
      assert.equal(demo.validation.pointFieldErrors['0:0'], undefined)
    },
  },
  {
    name: 'point draft escape-style revert restores last valid value',
    run: () => {
      const demo = useAffineDemo('2d')
      const original = demo.points.value[0]?.[0]
      demo.updatePoint(0, 0, '-')
      assert.equal(demo.validation.pointFieldErrors['0:0'], 'Continue typing the number.')

      demo.revertPointInput(0, 0)

      assert.equal(demo.points.value[0]?.[0], original)
      assert.equal(demo.pointDrafts.value[0]?.[0], String(original))
      assert.equal(demo.validation.pointFieldErrors['0:0'], undefined)
    },
  },
  {
    name: 'local origin revert clears transient invalid drafts',
    run: () => {
      const demo = useAffineDemo('3d')
      const original = demo.localFrame.origin[1]
      demo.updateLocalOrigin(1, '.')
      assert.equal(demo.validation.localOriginErrors['1'], 'Continue typing the number.')

      demo.revertLocalOriginInput(1)

      assert.equal(demo.localFrame.origin[1], original)
      assert.equal(demo.localOriginDrafts.value[1], String(original))
      assert.equal(demo.validation.localOriginErrors['1'], undefined)
    },
  },
  {
    name: 'applying a scenario resets points, transforms, local frame, and playback step',
    run: () => {
      const demo = useAffineDemo('2d')
      demo.stepForward()
      demo.updatePoint(0, 0, '99')
      demo.commitPointInput(0, 0)

      const scenario: DemoScenario = {
        id: 'test-scenario',
        mode: '2d',
        label: 'Test Scenario',
        summary: 'Scenario for regression coverage.',
        points: [
          [5, 5, 1],
          [10, -4, 1],
          [-6, -8, 1],
        ],
        localOrigin: [2, 3],
        transforms: [
          { type: 'reflect', params: 'axis=x' },
          { type: 'translate', params: 'dx=12, dy=-6' },
        ],
      }

      demo.applyScenario(scenario)

      assert.deepEqual(demo.points.value, scenario.points)
      assert.deepEqual(demo.localFrame.origin, scenario.localOrigin)
      assert.equal(demo.transforms.value.length, 2)
      assert.equal(demo.transforms.value[0]?.params, 'axis=x')
      assert.equal(demo.currentStep.value, 0)
      assert.equal(demo.draftType.value, 'reflect')
    },
  },  {
    name: 'transform draft reset restores defaults and clears errors',
    run: () => {
      const demo = useAffineDemo('2d')
      demo.updateDraftField('dx', '')
      assert.equal(demo.validation.draftFieldErrors.dx, 'This field is required.')

      demo.resetDraft()

      assert.deepEqual(demo.draftValues.value, { dx: '20', dy: '10' })
      assert.equal(demo.validation.draft, null)
      assert.deepEqual(demo.validation.draftFieldErrors, {})
    },
  },
  {
    name: 'add transform uses current structured draft values',
    run: () => {
      const demo = useAffineDemo('3d')
      const before = demo.transforms.value.length
      demo.updateDraftType('rotate')
      demo.updateDraftField('theta', '45')
      demo.updateDraftField('axis', 'x')

      demo.addTransform()

      assert.equal(demo.transforms.value.length, before + 1)
      assert.equal(demo.transforms.value.at(-1)?.type, 'rotate')
      assert.equal(demo.transforms.value.at(-1)?.params, 'theta=45 deg, axis=x')
    },
  },
  {
    name: '3D point cloud scenario keeps translation in the visible teaching range',
    run: () => {
      const pointCloudScenario = AFFINE_SCENARIOS['3d'].find((item) => item.id === '3d-point-cloud')

      assert.ok(pointCloudScenario)
      assert.equal(pointCloudScenario.transforms[2]?.params, 'dx=1, dy=1.6, dz=-0.8')
    },
  },
  {
    name: 'axonometric projection composes final matrix as P * Rx * Ry',
    run: () => {
      const state = computeProjectionState(60, 25)
      const expected = multiplyMatrices(orthographicProjectionMatrix(), multiplyMatrices(rotationX(25), rotationY(60)))

      assert.deepEqual(roundMatrix(state.finalMatrix), roundMatrix(expected))
    },
  },
  {
    name: 'axonometric projection applies Oy rotation before X rotation',
    run: () => {
      const state = computeProjectionState(90, 90, [[1, 0, 0, 1]])

      assert.deepEqual(roundPoints([applyMatrix(state.finalMatrix, [1, 0, 0, 1])]), [[0, 1, 0, 1]])
      assert.deepEqual(roundPoints(state.projectedPoints), [[0, 1]])
    },
  },
  {
    name: 'isometric projection preset keeps equal axis shortening',
    run: () => {
      const preset = AXONOMETRIC_PRESETS.find((item) => item.id === 'isometric')
      assert.ok(preset)
      const state = computeProjectionState(preset.yAngle, preset.xAngle)
      const [x, y, z] = state.axes.map((axis) => axis.shortening)

      assert.ok(Math.abs((x ?? 0) - (y ?? 0)) < 0.00002)
      assert.ok(Math.abs((y ?? 0) - (z ?? 0)) < 0.00002)
    },
  },
  {
    name: 'dimetric projection preset keeps x and z shortening equal only',
    run: () => {
      const preset = AXONOMETRIC_PRESETS.find((item) => item.id === 'dimetric')
      assert.ok(preset)
      const state = computeProjectionState(preset.yAngle, preset.xAngle)
      const [x, y, z] = state.axes.map((axis) => axis.shortening)

      assert.ok(Math.abs((x ?? 0) - (z ?? 0)) < 0.000001)
      assert.ok(Math.abs((x ?? 0) - (y ?? 0)) > 0.05)
    },
  },
  {
    name: 'trimetric class presets keep the requested angle pairs',
    run: () => {
      const presets = Object.fromEntries(AXONOMETRIC_PRESETS.map((item) => [item.id, item]))

      assert.equal(presets['trimetric-a']?.yAngle, 45)
      assert.equal(presets['trimetric-a']?.xAngle, 35)
      assert.equal(presets['trimetric-b']?.yAngle, 60)
      assert.equal(presets['trimetric-b']?.xAngle, 25)
      assert.equal(presets['trimetric-c']?.yAngle, 30)
      assert.equal(presets['trimetric-c']?.xAngle, 50)
    },
  },
  {
    name: 'one-point perspective function matches homogeneous matrix divide',
    run: () => {
      const state = computePerspectiveState(2, -4, 1.25, 0.5)
      const matrixResult = perspectiveDivide2d(applyPerspectiveMatrix(onePointPerspectiveMatrix(2), [1.25, 0.5, -4, 1]))

      assertAlmostEqual(state.functionPoint[0] ?? 0, matrixResult[0] ?? 0)
      assertAlmostEqual(state.functionPoint[1] ?? 0, matrixResult[1] ?? 0)
      assertAlmostEqual(state.matrixPoint[0] ?? 0, matrixResult[0] ?? 0)
      assert.ok(state.viewPoint[2] < 0)
    },
  },
  {
    name: 'model view matrix composes view times model and moves camera to view origin',
    run: () => {
      const state = computeModelViewState(25, 0.8, -1.2, 0.6)
      const expected = multiplyModelViewMatrices(state.viewMatrix, state.modelMatrix)
      const cameraView = applyPerspectiveMatrix(state.viewMatrix, [...state.cameraPosition, 1])

      assertAlmostMatrix(state.modelViewMatrix, expected)
      assertAlmostArray(cameraView, [0, 0, 0, 1])
    },
  },
  {
    name: 'lookAt view matrix treats camera world transform inverse as world to view',
    run: () => {
      const view = lookAtViewMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0])
      const model = translation(1, 2, -3)
      const modelView = multiplyModelViewMatrices(view, model)
      const result = applyPerspectiveMatrix(modelView, [0, 0, 0, 1])

      assertAlmostArray(result, [1, 2, -8, 1])
    },
  },
  {
    name: 'clip-space point classification uses OpenGL WebGL -w to w rule',
    run: () => {
      assert.equal(classifyPoint([0.2, -0.4, 0.5, 1]), 'inside')
      assert.equal(classifyPoint([1.2, 0, 0, 1]), 'outside')
      assert.equal(classifyPoint([0, 0, -1.2, 1]), 'outside')
    },
  },
  {
    name: 'intersecting clip-space line segment creates clipped endpoints',
    run: () => {
      const clipped = clipLineSegment([-2, 0, 0, 1], [0.5, 0, 0, 1])

      assert.equal(clipped.length, 2)
      assertAlmostEqual(clipped[0]?.[0] ?? 0, -1)
      assertAlmostEqual(clipped[1]?.[0] ?? 0, 0.5)
      assert.equal(clipped.every((point) => classifyPoint(point) === 'inside'), true)
    },
  },
  {
    name: 'intersecting clip-space triangle produces true clipped polygon vertices',
    run: () => {
      const clipped = clipPolygon([
        [-1.5, -0.2, 0, 1],
        [0.6, -0.3, 0, 1],
        [0.2, 0.8, 0, 1],
      ])

      assert.ok(clipped.length >= 3)
      assert.equal(clipped.every((point) => classifyPoint(point) === 'inside'), true)
      assert.ok(clipped.some((point) => Math.abs((point[0] ?? 0) + 1) < 1e-6))
    },
  },
  {
    name: 'clipping state keeps pipeline data responsive to fov near far and offset',
    run: () => {
      const state = computeClippingState(62, 0.8, 6, 0.45)

      assert.ok(['inside', 'outside', 'intersecting'].includes(state.triangleStatus))
      assert.ok(state.clipTriangle.length === 3)
      assert.ok(state.clippedTriangle.length > 0)
      assert.equal(state.ndcTriangle.length, state.clippedTriangle.length)
    },
  },
]

let failures = 0
for (const testCase of tests) {
  try {
    testCase.run()
    console.log(`PASS ${testCase.name}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${testCase.name}`)
    console.error(error)
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`)
  process.exit(1)
}

console.log(`\n${tests.length} test(s) passed.`)

function roundPoints(points: number[][]) {
  return points.map((point) => point.map(roundNumber))
}

function roundMatrix(matrix: number[][]) {
  return matrix.map((row) => row.map(roundNumber))
}

function roundNumber(value: number) {
  return Math.abs(value) < 1e-6 ? 0 : Number(value.toFixed(6))
}

function assertAlmostEqual(actual: number, expected: number, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) < epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`)
}

function assertAlmostArray(actual: number[], expected: number[], epsilon = 1e-6) {
  assert.equal(actual.length, expected.length)
  actual.forEach((value, index) => assertAlmostEqual(value, expected[index] ?? 0, epsilon))
}

function assertAlmostMatrix(actual: number[][], expected: number[][], epsilon = 1e-6) {
  assert.equal(actual.length, expected.length)
  actual.forEach((row, index) => assertAlmostArray(row, expected[index] ?? [], epsilon))
}
