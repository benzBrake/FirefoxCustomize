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
- 没有明确兼容性原因时，不要重组版本归档目录。
- 文档中优先使用仓库相对路径。
- 运行 Python 命令时，使用 `uv` 管理和执行 Python。
- 修改 userChromeJS 后如果无法在 Firefox 中运行验证，需要明确说明。

## CLAUDE.md 兼容

编辑前先读取当前工作区域或其父目录中的 `CLAUDE.md` 并遵循其中约定；对某个文件来说，距离它最近且适用的 `CLAUDE.md` 优先级最高，冲突时遵循更具体的规则。

- 提交信息规范见根目录 `CLAUDE.md`：中文 Conventional Commits，作用域后必须包含文件名。
- 修改 `userChromeJS` 下的脚本、元数据、README 或版本归档目录时，始终遵循 `userChromeJS/CLAUDE.md`（涵盖 `@compatibility`、`@note`、归档工作流和 README 版本指向规则）。

## 与 Codex 协作

- 请叫我 BOSS，并使用中文回答。
- 如果存在 `AGENTS.local.md`，其中的本地偏好优先于本文件。
- 主动指出可能的兼容性风险、缺失的元数据更新、损坏的 README 路径以及归档/版本管理错误。
- 避免无关重构、格式噪音、大范围目录移动，或在任务不需要时修改生成文件。
- 没有明确请求时，不要修改项目对外身份、许可协议或部署相关设置。
