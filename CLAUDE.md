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

## 归档操作注意事项

### 脚本版本管理原则

**重要认知：** 归档目录中的文件可能是**旧版本归档**，而不是**唯一版本**。

### 版本检查流程

在更新 README.md 或修改脚本路径前，必须执行以下检查：

1. **检查所有归档目录**
   ```bash
   # 查找所有包含同名脚本的目录
   find userChromeJS -name "ScriptName.uc.js" -type f
   ```

2. **比对版本信息**
   - 读取每个版本的 `@compatibility` 版本号
   - 读取每个版本的 `@version` 日期
   - 确定哪个是**最新维护版本**

3. **选择主入口**
   - README.md 应指向**最新维护版本**
   - 归档目录中的文件为历史版本保留

### 典型案例：AutoPopup

```
userChromeJS/
├── 57/AutoPopup.uc.js          # Firefox 57+（归档版本，2024年）
└── 109/AutoPopup.uc.js         # Firefox 109+（当前版本，2025.07.10）
```

**正确做法：**
- README.md 指向 `109/AutoPopup.uc.js`（较新版本）
- `57/AutoPopup.uc.js` 保留作为历史归档

**错误做法：**
- ❌ 看到文件在归档目录就认为是唯一版本
- ❌ 将 README.md 路径改为归档目录路径
- ❌ 未检查其他版本目录就修改路径

### 检查清单

更新 README.md 脚本条目前：

- [ ] 使用 `find` 或 `ls` 查找所有同名文件
- [ ] 对比各版本的 `@compatibility` 和 `@version`
- [ ] 确认最新维护版本的位置
- [ ] 更新 README.md 指向最新版本
- [ ] 保留归档版本说明（如需要）

### 经验教训来源

**事件：** ReloadAllTabs.uc.js 归档操作
- **日期：** 2026-04-07
- **问题：** 错误地将 `109/AutoPopup.uc.js` 改为 `57/AutoPopup.uc.js`
- **原因：** 未检查多个版本目录，误认为归档目录是唯一版本
- **修复：** 撤销提交，保持指向较新版本（109/）

**教训：** 归档操作时，必须充分了解项目的版本管理结构，避免破坏现有的版本引用关系。
