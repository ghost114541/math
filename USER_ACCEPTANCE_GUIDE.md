# 用户使用与验收指南

## 说明
本项目是一个基于 Vue 3 + Vite 的 2D/3D 仿射变换教学演示程序，用来展示齐次坐标下的点集、局部坐标系、矩阵链和逐步动画之间的对应关系。

当前程序的主入口只有两个页面：
- `/#/affine-2d`
- `/#/affine-3d`

当前版本已经具备三层验证：
- `npm run test:affine`：脚本级仿射计算与状态回归
- `npm run test:e2e`：浏览器层关键交互回归
- `npm run build`：生产构建验证

当前已知说明：
- 构建时仍可能看到 `vendor-p5` 与 `vendor-three` 的 chunk size warning。
- 这是已知非阻断项，不代表程序构建失败，也不应直接当成 bug。

这份文档面向第一次使用程序并希望手工确认是否还有 bug 的人。建议按本文顺序执行，不要跳步。

## 1. 使用前准备

### 1.1 环境前提
请先确认本机具备以下条件：
- 已安装 Node.js
- 当前目录为 `C:\download\biye\1`
- 依赖已经安装完成；如果没有安装，请先运行 `npm install`

### 1.2 启动开发环境
在项目根目录打开终端，执行：

```bash
npm run dev
```

正常现象：
- 终端会输出一个本地访问地址
- 一般会类似 `http://localhost:5173/`
- 打开后会默认进入 `/#/affine-2d`

异常现象：
- 终端直接报错，无法启动 Vite
- 浏览器打开地址后白屏
- 页面元素长时间停留在加载状态，如 `Loading p5.js canvas...` 或 `Loading 3D renderer...`

### 1.3 查看生产包
如果你想确认生产环境构建和预览是否正常，可以执行：

```bash
npm run build
npm run preview
```

说明：
- `npm run build` 用于生成生产包
- `npm run preview` 用于本地预览生产包效果
- 如果 `build` 成功，但出现 chunk size warning，当前版本仍视为通过

## 2. 先做自动化自检
在手工验收前，先跑一遍自动化命令，确认程序基础链路是通的。

### 2.1 运行脚本级仿射测试
执行：

```bash
npm run test:affine
```

看到什么结果算正常：
- 终端最后出现 `18 test(s) passed.`

如果异常：
- 记录完整命令
- 记录完整报错内容
- 记录执行时间
- 暂时不要急着手工排页面，先把失败信息保留下来

### 2.2 运行浏览器层关键交互回归
执行：

```bash
npm run test:e2e
```

看到什么结果算正常：
- 终端显示 `4 passed`

说明：
- 当前浏览器层回归以 Edge Playwright 为主
- 主要覆盖 2D 主链、3D 主链、键盘输入回退、窄屏可用性

### 2.3 运行生产构建
执行：

```bash
npm run build
```

看到什么结果算正常：
- 终端成功完成构建
- 即使出现 `vendor-p5` 或 `vendor-three` 的 chunk size warning，也仍算通过

如果这里失败：
- 先记录命令、报错全文、执行时间
- 再进入页面手工检查，不要只凭印象描述问题

## 3. 2D 页面一步步使用与验收
2D 页面地址：`/#/affine-2d`

建议从默认场景 `Step Chain` 开始，按左侧控制面板的五个区块逐项检查。

### 3.1 Teaching Scenarios 场景切换
先看页面顶部的 `Teaching Scenarios` 区域。

操作：
- 点击 `Step Chain`
- 点击 `Reflect + Shear`
- 点击 `Local Frame Story`
- 最后点击 `Restore Default Scenario`

正常现象：
- 被点击的场景卡片会进入激活态
- 画布图形、点集、局部原点、变换链会立即切换到该场景对应内容
- 点击 `Restore Default Scenario` 后，应回到 `Step Chain`

异常现象：
- 卡片高亮不变化
- 场景标题切换了，但点集或变换链没有同步变化
- 恢复默认后没有回到 `Step Chain`

### 3.2 点集编辑区
左侧第一个区块标题是 `2D Point Set (Homogeneous)`。

建议检查以下按钮和输入框：
- `Add Point`
- `Clear`
- `Load Default`
- 每行末尾的 `Delete`
- 点坐标输入框

#### 步骤 A：修改一个点
操作：
- 修改第一行的 `x` 或 `y`
- 按 `Enter`

正常现象：
- 输入值被提交
- 画布中的当前图形和最终图形联动更新
- 下方矩阵展示与步骤逻辑仍保持正常

异常现象：
- 输入框显示改了，但画布不变
- 画布变了，但后续动画或矩阵不同步

#### 步骤 B：检查 `w` 列锁定
操作：
- 尝试编辑 `w` 列

正常现象：
- `w` 列应保持只读锁定
- 不应允许被改成其他值

异常现象：
- `w` 列可以被随意修改
- `w` 列被改动后程序没有保护

#### 步骤 C：检查非法输入提示
操作：
- 在某个 `x` 或 `y` 输入框里输入 `-` 或其他未完成数字
- 观察提示后按 `Esc`

正常现象：
- 会出现字段级错误提示，例如提示继续完成数字输入
- 按 `Esc` 后恢复为上一次合法值

异常现象：
- 非法输入没有任何提示
- 按 `Esc` 无法回退
- 回退后保留了非法值

#### 步骤 D：检查增删点
操作：
- 点击 `Add Point`
- 给新点输入合法坐标
- 再点击对应行 `Delete`
- 点击 `Load Default`

正常现象：
- 可以新增点
- 删除后画布立即变化
- `Load Default` 可以恢复默认点集

异常现象：
- 新增点后表格有变化但画布无变化
- 删除点后局部坐标系或动画状态异常
- `Load Default` 不能恢复默认内容

### 3.3 Local Coordinate Frame 区域
左侧第二个区块标题是 `Local Coordinate Frame`。

建议检查以下项：
- `Local Origin (x, y)` 输入框
- `Show World Frame`
- `Show Local Frame`
- `Load Center Default`
- `Reset to World Frame`

#### 步骤 A：修改局部原点
操作：
- 修改局部原点的 `x` 或 `y`
- 按 `Enter`

正常现象：
- 画布中的局部坐标系位置立即变化
- 后续动画播放时局部坐标系会跟随变换链同步更新

异常现象：
- 输入值改了，但局部坐标系位置不变
- 局部坐标系变化了，但动画播放后又回到旧位置

#### 步骤 B：检查显示开关
操作：
- 取消 `Show World Frame`
- 取消 `Show Local Frame`
- 再重新勾选

正常现象：
- 世界坐标系和局部坐标系应真实隐藏/显示
- 只是显示状态变化，不应破坏点集和变换链数据

异常现象：
- 复选框能切换，但画布无任何变化
- 切换后图形或矩阵异常重置

#### 步骤 C：检查重置按钮
操作：
- 点击 `Load Center Default`
- 点击 `Reset to World Frame`

正常现象：
- `Load Center Default` 应把局部原点恢复到默认教学位置
- `Reset to World Frame` 应把局部原点对齐回世界原点

异常现象：
- 按钮点击后输入框变了，但画布中的局部坐标系没变
- 或者画布变了，但输入框内容没同步

### 3.4 Transformation Sequence 区域
左侧第三个区块标题是 `Transformation Sequence`。

建议重点检查：
- `Transformation Type`
- 动态字段输入区
- `Add Transformation`
- `Reset Fields`
- 已加入的变换列表
- `Move Up` / `Move Down` / `Delete`

#### 步骤 A：新增不同类型变换
操作：
- 依次测试 `translate`、`rotate`、`scale`
- 如果页面当前可选，也继续测试 `shear`、`reflect`
- 填写字段后点击 `Add Transformation`

正常现象：
- 每新增一次，变换列表中会多一条记录
- `Current expression` 预览会反映当前草稿参数
- 矩阵展示区会同步新增对应矩阵卡片

异常现象：
- 列表新增了，但矩阵卡片没新增
- 矩阵卡片新增了，但画布与最终结果不变化
- 草稿字段切换类型后仍保留错误字段，不可恢复

#### 步骤 B：检查键盘提交与回退
操作：
- 在草稿参数字段中按 `Enter`
- 再故意留空一个必填字段后按 `Enter`
- 然后按 `Esc`

正常现象：
- 合法输入按 `Enter` 可以直接新增变换
- 非法输入会出现字段级错误提示和区块级提示
- 按 `Esc` 后字段恢复为当前变换类型的默认值

异常现象：
- 合法输入按 `Enter` 没反应
- 非法输入没有提示却仍然被加入列表
- `Esc` 无法清除错误状态

#### 步骤 C：检查顺序调整
操作：
- 对已有变换点击 `Move Up`
- 再点击 `Move Down`
- 最后点击 `Delete`

正常现象：
- 变换顺序改变后，最终矩阵应立即变化
- 画布中的最终图形也应随顺序改变而变化
- 删除后对应矩阵卡片也应同步消失

异常现象：
- 列表顺序改了，但矩阵和画布不变
- 删除后列表没了，但动画步骤数量没同步

### 3.5 Matrix Display 区域
左侧第四个区块标题是 `Matrix Display`。

操作：
- 观察每个 `M1`、`M2`、`M3` 等矩阵卡片
- 观察 `Final Composite Matrix`
- 结合动画控制执行 `Step Forward`

正常现象：
- 当前步骤对应的矩阵卡片会高亮
- `Final Composite Matrix` 应随变换顺序和参数变化而更新
- 不应出现 LaTeX 排版错乱、空矩阵或明显乱码

异常现象：
- 高亮步骤与动画当前步骤不一致
- 调整变换顺序后最终矩阵没有更新
- 出现矩阵显示断裂、空白或排版异常

### 3.6 Animation Controls 区域
左侧第五个区块标题是 `Animation Controls`。

建议检查：
- `Start Step-by-Step Animation`
- `Pause`
- `Step Forward`
- `Reset`
- `Animation Speed`

#### 步骤 A：逐步播放
操作：
- 点击 `Start Step-by-Step Animation`
- 观察当前高亮变换项、矩阵卡片高亮和画布图形变化
- 点击 `Pause`

正常现象：
- 当前步骤会按顺序推进
- 变换列表高亮、矩阵高亮、画布中的当前图形应同步
- 暂停后应停留在当前步骤

异常现象：
- 列表在跳，画布不动
- 画布在变，但高亮步骤不变
- 暂停后仍继续播放

#### 步骤 B：单步和重置
操作：
- 点击 `Step Forward`
- 点击 `Reset`
- 调整 `Animation Speed`

正常现象：
- `Step Forward` 每次只前进一步
- `Reset` 后回到初始步骤
- 改变速度后，播放节奏有明显变化

异常现象：
- 单步会跳过多步
- 重置后没有回到初始状态
- 速度滑块变化对播放无影响

## 4. 3D 页面一步步使用与验收
3D 页面地址：`/#/affine-3d`

建议按 `Cube Basics` -> `Axis Tour` -> `Point Cloud Sketch` 的顺序检查。

### 4.1 Teaching Scenarios 场景切换
操作：
- 点击 `Cube Basics`
- 点击 `Axis Tour`
- 点击 `Point Cloud Sketch`
- 最后点击 `Restore Default Scenario`

正常现象：
- 场景卡片激活态正确切换
- 顶点集、局部原点、变换链、线框模式提示会同步变化
- `Restore Default Scenario` 应回到 `Cube Basics`

异常现象：
- 场景卡片亮了，但 3D 对象或变换链没换
- 恢复默认后没有回到 `Cube Basics`

### 4.2 默认可视范围与 base ghost 检查
先在默认 `Cube Basics` 场景观察 3D 画布。

操作：
- 不做任何编辑，直接观察默认视图
- 切到 `Axis Tour` 再观察

正常现象：
- 默认对象应处在世界原点附近的可观察范围
- `Cube Basics` 与 `Axis Tour` 不应显示中心 base ghost 虚影
- 动画对象应是当前正在参与变换的主体

异常现象：
- 默认对象飞离主视区
- 中心仍有多余的灰色原始立方体虚影
- 用户容易误以为“中间物体不动，远处小物体在动”

### 4.3 Wireframe Mode 检查
3D 画布上方有 `Wireframe Mode` 下拉框。

操作：
- 切到 `Point Cloud Sketch`
- 观察默认模式
- 分别切换 `Auto Nearest`、`Cube Edges`、`Sequential`
- 观察右侧 pill 文案和画布连线变化

正常现象：
- `Point Cloud Sketch` 默认应切到 `Sequential`
- 下拉框切换后，`Current mode:` 文案应同步变化
- 不同模式下连线表现应有差异

异常现象：
- 模式值变化了，但 pill 文案不变
- 文案变了，但画布连线不变
- 切到 `Cube Edges` 后程序异常报错

### 4.4 轨道控制与 Reset View
3D 画布工具栏里有 `Reset View` 按钮。

操作：
- 鼠标拖拽旋转视角
- 滚轮缩放
- 平移视图
- 然后点击 `Reset View`

正常现象：
- 可以正常旋转、缩放、平移
- 点击 `Reset View` 后能回到正常教学观察位
- 不应出现卡死、栈溢出或视角完全跑飞

异常现象：
- 拖动后画面不刷新
- 点击 `Reset View` 后视角没有恢复
- 操作相机时出现明显报错，例如递归渲染类错误

### 4.5 3D 点集、局部坐标系、变换链检查
左侧控制面板结构与 2D 相同，但点集为 `3D Vertex Set (Homogeneous)`。

操作：
- 修改一个顶点坐标并按 `Enter`
- 修改 `Local Origin (x, y, z)` 并按 `Enter`
- 切换 `Show World Frame` 和 `Show Local Frame`
- 新增一个变换并观察矩阵与画布

正常现象：
- 顶点变化后，线框形状会立即变化
- 局部原点变化后，局部坐标系位置会变化
- 世界/局部坐标系开关会真实影响显示
- 新增变换后，变换列表、矩阵卡片和 3D 对象姿态同步变化

异常现象：
- 表格和输入框变了，但 3D 模型不变
- 坐标系显示开关不生效
- 矩阵变化了，但 3D 对象姿态不变

### 4.6 3D 动画播放检查
操作：
- 在任一 3D 场景点击 `Start Step-by-Step Animation`
- 观察变换列表高亮、矩阵高亮和 3D 对象姿态
- 点击 `Pause`
- 点击 `Step Forward`
- 点击 `Reset`

正常现象：
- 当前步骤推进时，3D 对象姿态明显变化
- 变换列表高亮、矩阵高亮和对象姿态应同步
- `Reset` 后应回到初始步骤和初始对象状态

异常现象：
- 矩阵在高亮，但 3D 对象不动
- 对象在动，但步骤高亮不同步
- 重置后对象仍停留在中间状态

### 4.7 小屏检查
当前自动化已经覆盖 3D 页面窄屏可用性，你也建议手工再看一遍。

操作：
- 打开浏览器开发者工具
- 切换到窄屏视口，例如接近手机宽度
- 进入 `/#/affine-3d`
- 修改 `Local Origin (x, y, z)` 的某一项并按 `Enter`
- 点击 `Start Step-by-Step Animation`
- 再点击 `Pause`

正常现象：
- 控制面板能正常滚动
- 输入框仍可编辑和提交
- 播放按钮仍能点击，不会被布局挤出可视区

异常现象：
- 按钮被遮挡或无法点击
- 输入框提交后无响应
- 页面布局错乱到无法使用

## 5. 建议的手工回归清单
建议按下面顺序做，每项完成后再勾下一项。

### 5.1 2D 默认场景
- [ ] 打开 `/#/affine-2d`
- [ ] 默认场景是 `Step Chain`
- [ ] `Restore Default Scenario` 可恢复默认
- [ ] `Start Step-by-Step Animation`、`Pause`、`Step Forward`、`Reset` 都可用
- [ ] 矩阵高亮与画布步骤同步

通过标准：
- 2D 默认链路完整可走通，没有白屏、无响应或不同步现象

### 5.2 2D 自定义编辑
- [ ] 修改点坐标后画布立即变化
- [ ] `w` 列保持只读
- [ ] 非法输入会提示，`Esc` 可回退
- [ ] 新增至少一个变换后，列表和矩阵卡片同步新增
- [ ] `Move Up` / `Move Down` / `Delete` 会影响最终矩阵和最终图形

通过标准：
- 2D 输入、校验、矩阵链和动画之间没有脱节

### 5.3 3D 默认立方体
- [ ] 打开 `/#/affine-3d`
- [ ] 默认场景是 `Cube Basics`
- [ ] 对象位于原点附近可观察范围
- [ ] 中心不显示多余 base ghost 虚影
- [ ] `Reset View` 正常恢复视角

通过标准：
- 3D 默认教学视角清晰，主体对象容易观察，轨道控制可正常使用

### 5.4 3D 点云模式
- [ ] 切到 `Point Cloud Sketch`
- [ ] 默认 `Wireframe Mode` 为 `Sequential`
- [ ] 切换 `Auto Nearest` / `Cube Edges` / `Sequential` 后文案和连线同步变化
- [ ] 播放、暂停、重置都正常

通过标准：
- 3D 点云场景下线框模式切换稳定，不报错，不丢状态

### 5.5 最后再跑自动化命令
- [ ] `npm run test:affine`
- [ ] `npm run test:e2e`
- [ ] `npm run build`

通过标准：
- `test:affine` 显示 `18 test(s) passed.`
- `test:e2e` 显示 `4 passed`
- `build` 成功完成，即使存在 chunk size warning 也仍算通过

## 6. 发现疑似 bug 时怎么记录
如果你发现疑似 bug，建议至少记录以下 6 个字段：
- 页面
- 场景
- 操作步骤
- 实际结果
- 预期结果
- 控制台/命令输出

建议直接按下面模板记录：

```md
### Bug 记录
- 页面：
- 场景：
- 操作步骤：
- 实际结果：
- 预期结果：
- 控制台/命令输出：
- 是否稳定复现：
- 附件：截图/录屏路径
```

记录建议：
- 能截图就截图
- 能录屏就录屏
- 如果是命令报错，尽量保留完整终端输出
- 如果是页面问题，尽量写清楚是 2D 还是 3D、在哪个场景下发生
- 如果只出现一次，也请记录“是否稳定复现”

## 7. 当前版本已知说明
以下事项是当前版本已知说明，不应直接视为阻断 bug：
- `npm run build` 时可能出现 `vendor-p5` / `vendor-three` 的 chunk size warning，这属于已知非阻断项
- 浏览器层自动化目前以 Edge Playwright 回归为主
- 3D 复杂点云的线框仍是教学友好的启发式预览，不是严格拓扑重建

## 建议的使用顺序
如果你只想用最短路径快速确认当前程序是否稳定，建议按下面顺序：
1. 运行 `npm run test:affine`
2. 运行 `npm run test:e2e`
3. 启动 `npm run dev`
4. 先检查 `/#/affine-2d` 默认场景和一次自定义编辑
5. 再检查 `/#/affine-3d` 默认立方体、点云场景和 `Wireframe Mode`
6. 最后运行 `npm run build`

这样做的好处是：
- 先确认自动化底线没坏
- 再确认你最关心的可视化交互
- 最后确认生产构建链路正常
