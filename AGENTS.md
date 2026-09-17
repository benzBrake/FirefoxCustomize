# AGENTS.md

## 项目概览

FirefoxCustomize 是 Ryan 的 Firefox 自定义资源集合，包含 userChromeJS 脚本、用户样式、主题、扩展、配置示例、工具和参考图片。技术栈为 JavaScript/userChromeJS、CSS/SCSS 和 Markdown；Node.js 工具链仅存在于 `UserThemes/Sidra`。

## 关键目录

- `userChromeJS`：userChromeJS 脚本，含 Firefox 版本归档目录和脚本文档。
- `UserStyles` / `UserScript`：CSS 用户样式与用户脚本。
- `UserThemes`：自定义 Firefox CSS 主题；`UserThemes/Sidra` 为基于 npm 的 SCSS 工作流。
- `UserConfig` / `UserTools` / `extensions` / `images`：配置示例、工具资料、扩展资源、文档图片。

## 常用命令

仓库根目录没有统一的构建或测试命令。处理 Sidra 主题时，在 `UserThemes/Sidra` 目录下运行：

```bash
npm install
npm run build
npm run watch
npm test
```

修改 Sidra 的 SCSS、生成的 CSS、主题选项或相关测试时，运行 `npm test` 和/或 `npm run build`。

## 开发约定

- 修改范围应尽量限制在用户请求涉及的资源或脚本内。
- 除非任务明确要求修改，否则保留现有文件名、路径、元数据头、文档风格和语言。
- 文档中优先使用仓库相对路径。
- 运行 Python 命令时，使用 `uv` 管理和执行 Python。
- 修改 userChromeJS 后如果无法在 Firefox 中运行验证，需要明确说明。

## userChromeJS 版本管理

- 修改 `userChromeJS` 下的脚本、元数据、README 或版本归档目录时，始终遵循 `userChromeJS/AGENTS.md`，包括 `@compatibility`、`@note`、归档工作流和 README 版本指向规则。
- 用户说“停止维护”“不再维护”“废弃”或“弃用”时，均表示归档：按当前最低兼容版本移动到版本号目录并添加 `@note`，不得直接删除。
- 没有明确兼容性原因时，不要重组版本归档目录。

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

## 与 Codex 协作

- 请叫我 BOSS，并使用中文回答。
- 如果存在 `AGENTS.local.md`，其中的本地偏好优先于本文件。
- 主动指出可能的兼容性风险、缺失的元数据更新、损坏的 README 路径以及归档/版本管理错误。
- 避免无关重构、格式噪音、大范围目录移动，或在任务不需要时修改生成文件。
- 没有明确请求时，不要修改项目对外身份、许可协议或部署相关设置。

## Firefox 调试

- 使用 `debugging-firefox` skill 调试 Firefox 浏览器界面、扩展或 userChrome 脚本。
- 本文件只定义与具体环境无关的调试流程。Firefox 可执行文件、RDP 端口、配置文件目录等本机参数应由用户在任务中指定，或写入 `AGENTS.local.md`。
- 不硬编码 Firefox 安装路径、调试端口、用户配置目录、代理地址或进程 ID。
- 未指定端口时，先检查 `AGENTS.local.md`；仍无法确定时，应向用户确认或选择一个当前空闲的高位端口，并在执行前明确告知。
- RDP 连接仅使用回环地址 `127.0.0.1`。启动监听前检查目标端口占用情况，禁止连接或监听非回环地址。
- 启动调试服务时，参数形式为 `--start-debugger-server <PORT>`，并传给实际的 Firefox 浏览器可执行文件，而不是便携版或第三方启动器。
- 优先连接用户已启动且已授权调试的 Firefox 实例。不得擅自终止、重启或修改现有 Firefox 实例及其配置；确需重启时先取得用户明确同意。
- 首次连接可能触发 Firefox 的远程调试授权提示，应由用户在浏览器中确认，不得绕过或自动接受。
- 任务完成后关闭本次创建的调试客户端，并报告仍在运行的 Firefox 进程或监听端口。关闭客户端不代表调试监听已经关闭。

## 本地覆盖文件示例

`AGENTS.local.md` 可记录如下内容，但不要将具体值写入本文件：

```markdown
# 本地环境

- Firefox 可执行文件：`<absolute-path-to-firefox>`
- Firefox RDP 端口：`<port>`
- Firefox 配置文件：`<profile-path-or-identifier>`
```
