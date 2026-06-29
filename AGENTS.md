# AGENTS.md

## 项目概览

FirefoxCustomize 是 Ryan 的 Firefox 自定义资源集合，包含 userChromeJS 脚本、用户样式、主题、扩展、配置示例、工具和参考图片。

本仓库之前使用 Claude Code CLI 维护。在当前工作区域或其父目录中存在 `CLAUDE.md` 时，编辑前必须先读取并遵循其中约定。

## 技术栈

- JavaScript 和 userChromeJS 脚本，用于 Firefox 浏览器自定义。
- CSS 和 SCSS，用于 Firefox UI 样式和主题。
- Markdown，用于资源文档和兼容性说明。
- Node.js 工具链仅存在于 `UserThemes/Sidra`。

## 关键目录

- `userChromeJS`
  收集和修改过的 userChromeJS 脚本，包含 Firefox 版本归档目录和脚本文档。
- `UserStyles`
  收集和修改过的 CSS 用户样式。
- `UserScript`
  收集和修改过的用户脚本。
- `UserThemes`
  自定义 Firefox CSS 主题。`UserThemes/Sidra` 包含基于 npm 的 SCSS 工作流。
- `UserConfig`
  配置文件和示例。
- `UserTools`
  相关工具信息和参考资料。
- `extensions`
  收集的 Firefox 扩展资源。
- `images`
  文档使用的截图和相关图片。

## 常用命令

处理 Sidra 主题时，在 `UserThemes/Sidra` 目录下运行这些命令：

```bash
npm install
npm run build
npm run watch
npm test
```

仓库根目录没有统一的构建或测试命令。

## 开发约定

- 修改范围应尽量限制在用户请求涉及的资源或脚本内。
- 除非任务明确要求修改，否则保留现有文件名、路径、元数据头、文档风格和语言。
- 没有明确兼容性原因时，不要重组版本归档目录。
- 文档中优先使用仓库相对路径。
- 运行 Python 命令时，使用 `uv` 管理和执行 Python。
- 如需使用 GitHub CLI，使用 `ghp` 而不是 `gh`；不要设置全局 `HTTP_PROXY` 或 `HTTPS_PROXY`。

## Claude Code 兼容约定

- 根目录 `CLAUDE.md` 定义了本项目的提交信息规范。提交时必须遵循：中文 Conventional Commits，并且作用域后必须包含文件名。
- 目录级 `CLAUDE.md` 会为对应子树补充局部规则。对某个文件来说，距离它最近且适用的 `CLAUDE.md` 优先级最高。
- 修改 `userChromeJS` 下的脚本、元数据、README 条目或 Firefox 兼容性归档目录时，始终遵循 `userChromeJS/CLAUDE.md`。
- 如果 `CLAUDE.md` 规则与本文件冲突，对受影响路径遵循更具体的 `CLAUDE.md` 规则。

## userChromeJS 规则

- 将 `// @compatibility Firefox <version>` 视为最低兼容 Firefox 版本。
- 记录脚本变更时，添加 `// @note YYYY-MM-DD <description>` 条目。
- 提升脚本的 `@compatibility` 版本前，必须按照 `userChromeJS/CLAUDE.md` 归档旧版本。
- 更新 README 脚本链接时，必须跨版本目录查找该脚本的所有副本，并指向最新维护版本，而不是只使用最先找到的归档副本。
- 重命名脚本文件时，必须同步更新 `userChromeJS/README.md` 中对应条目的文件名和链接。
- 新增或修改版本兼容性文档时，遵循现有版本 README 的结构，例如 `userChromeJS/149/README.md` 和 `userChromeJS/136/README.md`。

## 测试与验证

- 修改 `UserThemes/Sidra` 的 SCSS、生成的 CSS、主题选项或相关测试时，运行 `npm test` 和/或 `npm run build`。
- 修改 userChromeJS 时，按目标 Firefox 兼容性规则进行检查，并更新元数据说明。如果无法在 Firefox 中运行验证，需要明确说明。
- 仅修改文档时，检查链接、路径和版本引用。

## 与 Codex 协作

- 请叫我 BOSS，并使用中文回答。
- 如果存在 `AGENTS.local.md`，其中的本地偏好优先于本文件。
- 修改包含 `CLAUDE.md` 的区域前，先读取相关 `CLAUDE.md` 文件。
- 主动指出可能的兼容性风险、缺失的元数据更新、损坏的 README 路径以及归档/版本管理错误。
- 避免无关重构、格式噪音、大范围目录移动，或在任务不需要时修改生成文件。
- 没有明确请求时，不要修改项目对外身份、许可协议或部署相关设置。
