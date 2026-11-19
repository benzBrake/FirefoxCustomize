# 仓库约定与提交格式

## 项目概览

FirefoxCustomize 是 Ryan 的 Firefox 自定义资源集合，包含 userChromeJS 脚本、用户样式、主题、扩展、配置示例、工具和参考图片。主要技术栈为 JavaScript/userChromeJS、CSS/SCSS 和 Markdown；Node.js 工具链仅存在于 `UserThemes/Sidra`。

## 关键目录

- `userChromeJS`：userChromeJS 脚本，含 Firefox 版本归档目录和脚本文档。
- `UserStyles` / `UserScript`：CSS 用户样式与用户脚本。
- `UserThemes`：自定义 Firefox CSS 主题；`UserThemes/Sidra` 使用 npm 管理 SCSS 工作流。
- `UserConfig` / `UserTools` / `extensions` / `images`：配置示例、工具资料、扩展资源和文档图片。
- `docs/agent-guides`：本仓库协作规则的详细文档。

## 常用命令

仓库根目录没有统一的构建或测试命令。处理 Sidra 主题时，在 `UserThemes/Sidra` 目录下运行：

```bash
npm install
npm run build
npm run watch
npm test
```

修改 Sidra 的 SCSS、生成的 CSS、主题选项或相关测试时，按变更范围运行 `npm test` 和/或 `npm run build`。

## 开发约定

- 修改范围应尽量限制在用户请求涉及的资源或脚本内。
- 除非任务明确要求修改，否则保留现有文件名、路径、元数据头、文档风格和语言。
- 文档中优先使用仓库相对路径。
- 运行 Python 命令时，使用 `uv` 管理和执行 Python。
- 修改 userChromeJS 后如果无法在 Firefox 中运行验证，需要明确说明。
- 使用中文与用户沟通，并称呼用户为 BOSS。
- 没有明确请求时，不要修改项目对外身份、许可协议或部署相关设置。
- 主动检查与本次变更相关的兼容性风险、元数据更新、README 路径和归档版本管理问题。
- 避免无关重构、格式噪音、大范围目录移动，或在任务不需要时修改生成文件。

## Git 提交规范

提交信息使用中文 Conventional Commits，并在作用域后包含文件名：

```text
<type>(<scope>): <filename> <subject>

<body>
```

- `type` 使用 `feat`、`fix`、`docs`、`refactor`、`style`、`test`、`chore` 等标准类型。
- `scope` 使用文件扩展名或技术栈，如 `JS`、`CSS`、`DOC`、`JSON`、`HTML`。
- `filename` 必须填写；多文件变更可写主要文件，必要时拆分提交。
- `subject` 使用简短中文描述。
- 可选正文使用 `-` 列表，以动词开头说明具体变更。

示例：

```text
fix(JS): TabPlus.uc.js 修复 Firefox 149+ 搜索服务初始化失败问题
feat(CSS): tab_busy_thinking.css 添加标签页载入提示样式
docs(DOC): README.md 更新下载链接
```
