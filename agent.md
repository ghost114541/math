# Agent 开发指南

这份文档给后续接手本项目的 AI agent 或开发者使用。目标是先理解当前系统边界，再做小步、可验证的修改。

## 项目概览

本项目是一个基于 Vue 3 + TypeScript + Vite 的 2D/3D 仿射变换教学演示程序，用来展示齐次坐标下的点集、局部坐标系、矩阵链、逐步动画和画布渲染之间的对应关系。

当前主入口：
- `/#/affine-2d`
- `/#/affine-3d`

核心依赖：
- `vue` / `vue-router`：应用与路由。
- `p5`：2D 画布渲染。
- `three`：3D 画布渲染与轨道控制。
- `katex`：矩阵 LaTeX 展示。
- `@playwright/test`：端到端回归测试。

## 常用命令

```bash
npm run dev
npm run build
npm run test:affine
npm run test:e2e
npm run preview
```

说明：
- `npm run dev` 使用 Vite，固定在 `127.0.0.1:5173`。
- `npm run build` 会先运行 `vue-tsc -b`，再打生产包。
- `npm run test:affine` 会编译 `tsconfig.tests.json`，再运行脚本级数学与状态回归。
- `npm run test:e2e` 使用 Playwright，默认通过生产预览服务 `127.0.0.1:4173` 跑 Edge 项目。
- 构建时如果只出现 `vendor-p5` 或 `vendor-three` chunk size warning，按现有验收文档视为非阻断项。

## 目录地图

- `src/main.ts`：Vue 应用入口。
- `src/App.vue`：主壳层，组合侧边导航、顶部标题和路由视图。
- `src/router/index.ts`：hash 路由配置，默认跳转到 `/affine-2d`。
- `src/config/examples.ts`：侧边导航和标题区使用的示例元数据。
- `src/config/scenarios.ts`：2D/3D 教学场景数据，包含点集、局部原点和变换链。
- `src/types/cg.ts`：图形学演示相关类型定义。
- `src/lib/affine.ts`：仿射变换计算核心，负责参数解析、矩阵生成、矩阵复合、点变换和局部坐标系变换。
- `src/lib/wireframe.ts`：3D 线框边推断逻辑。
- `src/composables/useAffineDemo.ts`：页面主要状态机，管理点草稿、局部原点、变换草稿、校验、场景加载和播放状态。
- `src/composables/useMockPlayback.ts`：播放、暂停、步进和速度控制。
- `src/composables/useTheme.ts`：浅色/深色主题状态。
- `src/views/Affine2DView.vue`：2D 页面装配层。
- `src/views/Affine3DView.vue`：3D 页面装配层，包含 wireframe mode 控制。
- `src/components/controls/ControlPanel.vue`：点、局部坐标系、变换链、播放和矩阵控制面板。
- `src/components/canvas/P5CanvasStatic.vue`：2D p5 画布。
- `src/components/canvas/ThreeCanvasStatic.vue`：3D three.js 画布。
- `src/components/math/MatrixCard.vue`：矩阵展示。
- `src/components/layout/*`：应用导航和头部。
- `src/components/shared/GuideText.vue`：教学说明文本。
- `tests/run-affine-tests.ts`：脚本级回归，覆盖数学计算、状态管理、输入草稿、场景加载和线框推断。
- `tests/e2e/affine-smoke.spec.ts`：浏览器层关键交互回归。
- `USER_ACCEPTANCE_GUIDE.md`：人工验收指南。
- `FINAL_DELIVERY_PLAN.md`：功能交付计划历史文档。
- `THREAD_HANDOFF_LOG.md`：历史交接日志，内容很长，只有追溯上下文时再读。

## 开发原则

1. 先保护计算正确性。涉及变换矩阵、复合顺序、局部坐标系或点集结构的修改，优先改 `src/lib/affine.ts` 和 `tests/run-affine-tests.ts`。
2. UI 层不要重复实现数学逻辑。画布组件应只消费 `currentPoints`、`finalPoints`、`currentFrame`、`finalFrame` 等计算结果。
3. `useAffineDemo.ts` 是状态协调中心。点输入、草稿输入、校验、场景切换和播放控制都尽量在这里统一维护。
4. 新增教学场景时，优先改 `src/config/scenarios.ts`，并确认场景 `mode`、点维度、`localOrigin` 维度和变换参数一致。
5. 新增页面或示例时，同步更新 `src/config/examples.ts`、`src/router/index.ts` 和必要的导航/验收测试。
6. 不要随意删除或改名 `data-testid`。e2e 测试大量依赖这些选择器。
7. 3D 线框显示涉及 `WireframeMode`、`buildWireframeEdges` 和 `ThreeCanvasStatic.vue`。点云场景默认使用 `sequential`，默认立方体场景默认使用 `auto`。
8. 齐次坐标的最后一位目前固定为 `1`。如果要允许编辑 `w`，需要同步修改校验、计算、测试和文案。
9. 保持路由为 hash history，当前验收路径依赖 `/#/affine-2d` 和 `/#/affine-3d`。
10. 样式变量集中在 `src/style.css`，组件内样式多为 scoped。修改视觉时注意浅色/深色主题变量都要可读。

## 变换数据约定

`TransformItem.params` 目前是可解析字符串，不是结构化对象。`src/lib/affine.ts` 通过正则解析形如：

```text
dx=80, dy=20
theta=30 deg
sx=1.2, sy=0.9
axis=y
```

支持的变换类型：
- 2D：`translate`、`rotate`、`scale`、`shear`、`reflect`
- 3D：`translate`、`rotate`、`scale`、`shear`、`reflect`

矩阵复合顺序是后一个变换左乘前面的累计矩阵，也就是用户看到的步骤链按顺序应用，最终矩阵形如 `Tn ... T2 T1`。改这里一定要跑 `npm run test:affine`。

## 测试策略

小改文案或样式：
- 至少运行 `npm run build`，如果只改纯文档可不跑测试，但要说明未运行。

改数学计算、状态管理、场景数据、点输入、局部原点或变换草稿：
- 运行 `npm run test:affine`
- 运行 `npm run build`

改页面交互、按钮、选择器、路由、响应式布局、画布加载或播放行为：
- 运行 `npm run test:affine`
- 运行 `npm run test:e2e`
- 运行 `npm run build`

改 3D 画布、OrbitControls、wireframe、canvas 尺寸或窄屏布局：
- 运行 `npm run test:e2e`
- 手工检查 `/#/affine-3d`，特别是 point-cloud 场景、wireframe mode 切换、播放/暂停和 Reset View。

## 常见修改入口

添加一个新的教学场景：
1. 在 `src/config/scenarios.ts` 增加场景。
2. 确认 2D 点是 `[x, y, 1]`，3D 点是 `[x, y, z, 1]`。
3. 如需特殊 3D 线框默认模式，在 `Affine3DView.vue` 的 `loadScenario` 中处理。
4. 为关键场景行为补充 `tests/run-affine-tests.ts` 或 e2e 断言。

添加一种新的变换类型：
1. 更新 `TransformType`。
2. 更新 `DRAFT_LIBRARY` 和 `serializeDraft`。
3. 更新 `parseTransform` 的 2D/3D 分支。
4. 确认 LaTeX 矩阵输出正确。
5. 增加脚本级测试覆盖矩阵和点变换结果。

修改点输入或草稿校验：
1. 优先在 `useAffineDemo.ts` 修改。
2. 保持 `commit`、`revert`、中间态输入如 `-`、`.`、`-.` 的行为一致。
3. 同步检查 `ControlPanel.vue` 的事件名和 `data-testid`。
4. 增加或更新 `tests/run-affine-tests.ts` 中的状态回归。

修改画布渲染：
1. 2D 改 `P5CanvasStatic.vue`，3D 改 `ThreeCanvasStatic.vue`。
2. 不要在画布组件里重新计算矩阵链。
3. 对 three.js 几何体更新要注意释放旧 geometry，当前代码会在 `updateLineGeometry` / `updateFrameGeometry` 中 dispose。
4. 观察 `showWorld`、`showLocal`、`currentStep` 和 final ghost 的显示是否仍同步。

## 仓库注意事项

- 当前仓库根目录可能有未纳入版本控制的大文件 `1.zip`。它不是应用源码，除非用户明确要求，不要移动、删除或提交它。
- `dist/`、`.test-dist/`、`test-results/`、`node_modules/` 是生成或依赖目录，通常不需要手动编辑。
- 不要把历史交接文档当成最新实现，优先以源码、测试和 `USER_ACCEPTANCE_GUIDE.md` 为准。
- 如果修改 npm 依赖，必须同步维护 `package.json` 和 `package-lock.json`。

