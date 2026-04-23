# 第二阶段：页面功能说明

## 仓库信息

- 仓库链接：[仓库链接]
- 本地页面路由：
  - `/#/projection-perspective`
  - `/#/model-view-matrix`
  - `/#/clipping-3d`

## 页面 1：一点透视投影

已实现右手 view space、相机看向 `-Z`、投影平面 `z = -d`、几何公式、齐次矩阵形式和 perspective divide。用户可以调节投影平面距离、`x_view`、`y_view`、`z_view`。

页面重点：说明函数形式和齐次矩阵形式得到的投影点是一致的。

截图或 GIF：

- `[perspective_projection_screenshot.png]`
- `[perspective_projection_demo.gif]`

## 页面 2：ModelViewMatrix

已实现 `M_model`、`M_view`、`M_modelView` 分开展示，展示 local -> world -> view 坐标变化链，并说明与 `object.matrixWorld`、`camera.matrixWorldInverse`、shader `modelViewMatrix` 的关系。

用户可以调节模型绕 Y 轴旋转、模型世界坐标位置、相机世界坐标位置。

页面重点：说明 ModelViewMatrix 不是孤立矩阵，而是 `M_view * M_model` 的合成结果。

截图或 GIF：

- `[model_view_matrix_screenshot.png]`
- `[model_view_matrix_demo.gif]`

## 页面 3：3D Clipping

已实现 OpenGL/WebGL clip-space 约定、NDC 范围 `[-1, 1]`、管线顺序、inside/outside/intersecting 分类，以及线段和三角形的真实裁剪。

用户可以调节视场角、near 平面、far 平面和三角形偏移量。

页面重点：区分分类/剔除和真正裁剪，并说明 clipping 发生在 perspective divide 之前。

截图或 GIF：

- `[clipping_screenshot.png]`
- `[clipping_demo.gif]`
