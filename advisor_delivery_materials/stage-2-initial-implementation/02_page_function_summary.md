# 第二阶段：页面功能说明

## 仓库信息

- 仓库链接：[仓库链接]
- 本地页面路由：
  - `/#/projection-perspective`
  - `/#/model-view-matrix`
  - `/#/clipping-3d`

## 页面 1：一点透视投影

已实现内容：

- 右手 view space 坐标约定；
- 相机看向 `-Z`；
- 投影平面 `z = -d`；
- 一点透视的几何函数公式；
- 齐次矩阵形式和 perspective divide；
- 区分展示几何透视变换和标准透视投影矩阵。

用户可以调节：

- 投影平面距离；
- `x_view`；
- `y_view`；
- `z_view`。

页面教学重点：

- 说明函数形式和齐次矩阵形式得到的投影点是一致的。

截图或 GIF：

- `[perspective_projection_screenshot.png]`
- `[perspective_projection_demo.gif]`

## 页面 2：ModelViewMatrix

已实现内容：

- 分别展示 `M_model`、`M_view` 和 `M_modelView`；
- 展示 local -> world -> view 的坐标变化链；
- 说明与 three.js 概念的对应关系：
  - `object.matrixWorld`；
  - `camera.matrixWorldInverse`；
  - shader 中的 `modelViewMatrix`。

用户可以调节：

- 模型绕 Y 轴旋转；
- 模型世界坐标位置；
- 相机世界坐标位置。

页面教学重点：

- 说明 ModelViewMatrix 不是孤立矩阵，而是 `M_view * M_model` 的合成结果。

截图或 GIF：

- `[model_view_matrix_screenshot.png]`
- `[model_view_matrix_demo.gif]`

## 页面 3：3D Clipping

已实现内容：

- OpenGL/WebGL clip-space 约定；
- NDC 范围 `[-1, 1]`；
- 管线顺序：
  - view space -> clip space -> clipping -> perspective divide -> NDC -> screen；
- inside/outside/intersecting 分类；
- 线段和三角形的真实裁剪。

用户可以调节：

- 视场角；
- near 平面；
- far 平面；
- 三角形偏移量。

页面教学重点：

- 区分分类/剔除和真正裁剪，并说明 clipping 发生在 perspective divide 之前。

截图或 GIF：

- `[clipping_screenshot.png]`
- `[clipping_demo.gif]`
