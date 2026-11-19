# 仓库协作入口

此文件适用于整个仓库。请按任务阅读 `docs/agent-guides/` 中对应的详细规范，并遵守 `userChromeJS/AGENTS.md` 对 userChromeJS 资源的补充要求。

## 通用要求

- 修改范围限于用户请求涉及的资源；保留现有文件名、路径、元数据、文档风格和语言，除非任务明确要求调整。
- 文档优先使用仓库相对路径；运行 Python 命令时使用 `uv`。
- 修改 Sidra 主题时遵循其 npm 工作流，相关变更按需运行 `npm test` 和/或 `npm run build`。
- 修改 userChromeJS 后如果无法在 Firefox 中验证，需在结果中说明。
- 提交信息遵循 `docs/agent-guides/repository-conventions.md` 中的中文 Conventional Commits 格式。
- 若存在 `AGENTS.local.md`，其中的本地偏好优先于仓库规范。不要把本机路径、端口等环境值写入通用规范。

## 按任务阅读

- 仓库约定与提交格式：[`repository-conventions.md`](docs/agent-guides/repository-conventions.md)
- Firefox 界面、扩展或 userChrome 调试：[`firefox-debugging.md`](docs/agent-guides/firefox-debugging.md)
- userChromeJS 元数据、版本归档及 README 路径：[`userchromejs/`](docs/agent-guides/userchromejs/README.md)
