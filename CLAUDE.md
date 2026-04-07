# Claude Code 项目配置

## Git 提交规范

### 提交信息格式

本项目遵循自定义的 Conventional Commits 格式规范：

```
<type>(<scope>): <filename> <subject>

<body>
```

### 格式要求

1. **类型 (type)**：使用 Conventional Commits 标准类型
   - `feat` - 新功能
   - `fix` - 缺陷修复
   - `docs` - 文档变更
   - `refactor` - 代码重构
   - `style` - 代码格式调整
   - `test` - 测试相关
   - `chore` - 构建/工具配置

2. **作用域 (scope)**：使用文件扩展名或技术栈
   - `(JS)` - JavaScript 文件
   - `(CSS)` - CSS 样式文件
   - `(DOC)` - 文档文件
   - 其他扩展名如 `(JSON)`、`(HTML)` 等

3. **文件名 (filename)**：必须包含，放在作用域后面
   - 示例：`TabPlus.uc.js`、`StatusBar.uc.js`、`tab_busy_thinking.css`

4. **主题 (subject)**：简短描述变更内容（中文）

5. **正文 (body)**（可选）：
   - 使用列表格式
   - 每项以 `-` 开头
   - 使用动词开头的祈使句
   - 详细说明变更内容

### 示例

```bash
# JavaScript 文件修复
fix(JS): TabPlus.uc.js 修复 Firefox 149+ 搜索服务初始化失败问题

- 新增 initSearchService 异步方法，兼容新版 ESM 搜索服务
- 修复右键新标签按钮搜索时 Services.search 未定义的错误
- 版本号更新至 1.1.1

# CSS 文件新功能
feat(CSS): UserStyles/tab_busy_thinking.css 添加标签页载入中显示"thinking..."样式

# JavaScript 文件重构
refactor(JS): KeyChanger 代码整理与安全增强

# 文档更新
feat(DOC): UserTools/README.md 更新下载链接
```

### 重要说明

- **文件名必须包含**在提交信息中，位于作用域之后
- 提交信息使用**中文**描述
- 遵循 Conventional Commits 规范，但添加了强制文件名要求
- 对于多文件变更，可选择主要文件或分别提交
