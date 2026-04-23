# CG Viz 计算机图形学交互可视化系统

CG Viz 是一个基于 Vue 3、TypeScript、Vite、SVG、p5.js、Three.js 和 KaTeX 构建的计算机图形学教学可视化系统。项目用于演示几何变换、投影、ModelViewMatrix 合成和 3D 裁剪算法，并将参数控制、图形结果、公式和矩阵同步展示。

## 主要功能

### 2D 与 3D 仿射变换

- 提供 2D 仿射变换交互页面。
- 提供 3D 仿射变换交互页面。
- 支持编辑点坐标、组合变换链、显示局部/世界坐标系、动画播放和矩阵卡片。
- 3D 页面支持不同线框模式，包括立方体边、顺序点云连线和自动推断连线。

### 轴测投影

- 支持等测投影、二测投影和三测投影预设。
- 支持调节投影构造中的旋转角度。
- 使用 SVG 展示投影结果和各坐标轴缩短系数。
- 展示矩阵合成关系：`M = P * R_x * R_y`。

### 一点透视投影

- 明确采用右手 view space 坐标约定。
- 相机位于原点并看向 `-Z` 方向。
- 投影平面定义为 `z = -d`。
- 同时展示函数计算形式和齐次矩阵计算形式。
- 区分展示：
  - 几何一点透视变换；
  - 标准透视投影矩阵。
- 用于说明函数形式和矩阵形式得到的投影点是一致的。

### ModelViewMatrix

- 分别解释 `M_model`、`M_view` 和 `M_modelView`。
- 展示合成关系：`M_modelView = M_view * M_model`。
- 可视化 local -> world -> view 的坐标变化过程。
- 说明教学矩阵与 three.js 中相关概念的对应关系，例如 `object.matrixWorld`、`camera.matrixWorldInverse` 和 shader 中的 `modelViewMatrix`。

### 3D Clipping

- 明确采用 OpenGL/WebGL 裁剪空间语义。
- NDC 范围为 `x, y, z in [-1, 1]`。
- 使用 clip-space 判断条件：
  - `-w <= x <= w`
  - `-w <= y <= w`
  - `-w <= z <= w`
- 展示管线顺序：
  - view space -> clip space -> clipping -> perspective divide -> NDC -> screen。
- 实现点分类以及线段、三角形的真实裁剪。
- 明确不扩展到完整 rasterization pipeline、深度测试、背面剔除或遮挡剔除。

## 页面路由

- `/#/affine-2d`：2D 仿射变换
- `/#/affine-3d`：3D 仿射变换
- `/#/projection-axonometric`：轴测投影
- `/#/projection-perspective`：一点透视投影
- `/#/model-view-matrix`：ModelViewMatrix
- `/#/clipping-3d`：3D Clipping

## 项目结构

- `src/views`
  - 页面级教学可视化模块。
- `src/lib`
  - 数学和算法模块，包括仿射变换、投影、ModelViewMatrix 和裁剪算法。
- `src/components`
  - 通用控制组件、矩阵卡片、SVG/Canvas/Three.js 渲染组件和布局组件。
- `src/config`
  - 页面定义和教学场景配置。
- `tests`
  - TypeScript 数学回归测试和 Playwright 端到端测试。
- `advisor_delivery_materials`
  - 给导师分阶段发送的中文材料草稿。

## 安装依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173
```

## 构建项目

```bash
npm run build
```

构建结果会输出到 `dist/` 目录。

## 预览生产构建

```bash
npm run preview
```

## 测试

运行 TypeScript 数学回归测试：

```bash
npm run test:affine
```

运行浏览器端到端测试：

```bash
npm run test:e2e
```

数学测试中，矩阵、投影点和裁剪交点使用 epsilon 容差比较，而不是直接使用浮点数全等比较。

## 当前说明

- 一点透视投影和 3D Clipping 页面采用列向量记法以及 OpenGL/WebGL 风格约定。
- Clipping 模块重点展示 perspective divide 之前的视锥体裁剪。
- `advisor_delivery_materials` 中的材料用于和导师阶段性沟通，不属于程序运行所必需的源代码。
