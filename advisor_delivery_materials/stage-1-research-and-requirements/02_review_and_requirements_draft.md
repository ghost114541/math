# 第一阶段：综述与需求整理草稿

## 1. 一点透视投影

### 现有可视化主要关注什么

现有资料通常会用观察点、投影平面和从 3D 物体射向屏幕的投影线解释透视投影。WebGL/OpenGL 相关资料还会进一步说明顶点进入 clip space 后要进行 perspective divide。

### 做得好的地方

- 消失点和投影线的几何意义比较直观。
- 通过射线图可以把 3D 深度变化和屏幕上物体大小变化联系起来。
- 矩阵推导资料能说明透视投影如何进入图形学渲染管线。

### 存在的不足

- 很多资料没有先明确坐标约定，比如相机朝哪个方向、`z` 是正向深度还是负值。
- 函数形式和齐次矩阵形式经常分开讲，缺少同步验证。
- 标准透视投影矩阵同时包含几何投影和 near/far 深度映射，初学者容易混淆。

### 转化为本系统的设计要求

- 页面必须先明确坐标约定：列向量、右手 view space、相机看向 `-Z`，相机前方点满足 `z_view < 0`。
- 明确投影平面为 `z = -d`，正向深度为 `s = -z_view`。
- 同时显示函数形式和齐次矩阵形式。
- 区分两个概念：Geometric one-point perspective transform 与 Standard perspective projection matrix。
- 参数变化时，几何图形、投影点和矩阵结果必须同步更新。

## 2. ModelViewMatrix

### 现有可视化主要关注什么

大多数资料会把 model、view、projection 作为一条变换链来讲。有些 WebGL 和 three.js 示例会在 shader 中直接使用 `modelViewMatrix`。

### 做得好的地方

- 变换链结构清楚，符合现代图形学课程的讲法。
- 能帮助理解物体变换和相机变换之间的关系。
- 与实际图形学管线联系紧密。

### 存在的不足

- 有些资料只展示最终矩阵，没有说明每个矩阵的物理意义。
- three.js 内部矩阵名称容易和教学定义混在一起。
- View Matrix 是相机世界变换的逆矩阵，这一点经常没有被强调。

### 转化为本系统的设计要求

- 先讲 `M_model`：对象从 local/object space 到 world space。
- 再讲 `M_view`：从 world space 到 view/eye space，即相机世界变换的逆。
- 最后展示 `M_modelView = M_view * M_model`。
- 页面中说明和 three.js 的对应关系：`object.matrixWorld`、`camera.matrixWorldInverse`、shader 中的 `modelViewMatrix`。
- 可视化展示点的变化链：local space -> world space -> view space。

## 3. 3D 裁剪

### 现有可视化主要关注什么

许多图形学管线图会说明图元先变换到 clip space，然后进行裁剪，再除以 `w` 得到 NDC。算法资料则常见于平面测试、线段裁剪、多边形裁剪等内容。

### 做得好的地方

- clip-space 不等式表达紧凑、精确。
- 管线图能帮助区分 clipping 和最后的屏幕映射。
- 线段和三角形例子可以直观看到“部分在视锥体外”的情况。

### 存在的不足

- 有些资料会把分类、剔除和真正裁剪混在一起。
- 学生可能误以为裁剪发生在 perspective divide 之后。
- OpenGL/WebGL 和 Direct3D 的深度范围不同，如果不声明规范，容易产生理解冲突。

### 转化为本系统的设计要求

- 明确采用 OpenGL/WebGL 裁剪空间语义：NDC 的 `x, y, z` 范围为 `[-1, 1]`。
- 使用 clip-space 条件：`-w <= x <= w`、`-w <= y <= w`、`-w <= z <= w`。
- 页面展示完整顺序：view space -> clip space -> clipping -> perspective divide -> NDC -> screen。
- 同时展示 inside / outside / intersecting 分类。
- 对线段和三角形实现真正裁剪，生成新的裁剪后顶点。
- 一般多边形裁剪作为算法扩展说明，不作为核心实现范围。

## 拟新增页面结构

三个页面保持和现有系统一致的教学风格：

- 左侧控制面板；
- 中间可视化区域；
- 下方或侧边矩阵/公式展示区域；
- 参数、图形、矩阵、数值同步更新；
- 视觉风格与已有 2D/3D 仿射变换和轴测投影页面统一。
