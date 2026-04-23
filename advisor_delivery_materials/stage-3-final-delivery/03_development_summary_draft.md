# 第三阶段：开发总结草稿

## 新增页面

本系统新增了三个计算机图形学交互可视化页面：

1. `Perspective Projection`
   - 演示一点透视投影；
   - 区分几何一点透视变换和标准透视投影矩阵；
   - 验证函数计算形式和齐次矩阵计算形式的一致性。

2. `ModelView Matrix`
   - 解释 `M_model`、`M_view` 和 `M_modelView`；
   - 展示 local -> world -> view 的坐标变化过程；
   - 说明教学矩阵与 three.js 中相关矩阵概念的对应关系。

3. `3D Clipping`
   - 采用 OpenGL/WebGL clip-space 约定；
   - 展示从 view space 到 screen 的管线顺序；
   - 演示 inside/outside/intersecting 分类；
   - 实现线段和三角形的真实裁剪。

## 新增数学和算法模块

新增模块包括：

- 透视投影相关计算；
- model / view / modelView 矩阵计算；
- OpenGL/WebGL clip-space 分类和裁剪算法。

## 测试

实现完成后进行了 TypeScript 数学测试、构建验证和 Playwright 端到端测试。数学测试中，矩阵、投影点和裁剪交点使用 epsilon 容差比较，而不是直接使用浮点数全等比较。

## 当前范围和可继续优化点

当前版本有意不扩展完整 rasterization pipeline、depth testing、back-face culling、occlusion culling，以及单独的一般多边形裁剪完整页面。这些内容可以作为后续扩展方向在论文中提及，但不属于当前三个新增模块的主线范围。
