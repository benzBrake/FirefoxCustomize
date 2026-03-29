# UserScript 脚本规范

## @compatibility 规则
- **格式**：`// @compatibility Firefox <版本号>`
- **含义**：表示**最低兼容版本**，例如 `Firefox 149` 表示需要 Firefox 149 或更高版本
- **示例**：
  ```
  // @compatibility Firefox 149
  ```

## @note 规则
- **格式**：`// @note <日期> <描述>`
- **日期格式**：使用完整的日期格式 `YYYY-MM-DD`
- **用途**：记录脚本修改历史、功能变更、bug 修复等
- **示例**：
  ```
  // @note 2026-03-29 修复 Firefox 149+ 兼容性：更新 API，移除 hidden 属性
  ```

## @compatibility 变更工作流

### 重要原则
**当需要修改脚本的 `@compatibility` 版本号时，必须先归档旧版本，再修改新版本**

### 完整工作流程

#### 步骤 1：识别需要归档的情况
以下情况需要归档旧版本并更新 `@compatibility`：
- 使用了新版 Firefox 特有的 API
- 移除了对旧版本 Firefox 的兼容代码
- 重构导致不兼容旧版本
- 修复了仅影响新版本的 bug

#### 步骤 2：归档旧版本脚本
1. **读取当前 `@compatibility`**：确认当前最低兼容版本
2. **创建归档目录**：在项目根目录创建对应版本号目录
   ```bash
   mkdir -p 80/
   ```
3. **复制脚本到归档目录**：
   ```bash
   cp ScriptName.uc.js 80/ScriptName.uc.js
   ```
4. **添加归档记录**：在归档脚本的 `@note` 中记录
   ```
   // @note 2026-03-29 归档：兼容 Firefox 80-148，新版本升级至 Firefox 149+
   ```

#### 步骤 2.5：创建/更新版本兼容性文档

**规范要求：**
1. **检查文档是否存在**：查看对应版本目录是否已有 README.md（如 `149/README.md`）
2. **创建兼容性文档**（如不存在）：
   - 使用统一的文档格式（参考 `149/README.md` 和 `136/README.md`）
   - 记录该版本特有的 API 变化和兼容性问题
   - 提供问题表现、解决方案和代码示例
3. **提交文档**：使用规范的提交信息

**文档内容指南：**

参考现有版本目录下的兼容性文档（如 `149/README.md` 和 `136/README.md`）的格式规范：

1. **基本结构：**
   ```markdown
   # 适用于 Firefox <版本号> + 以及更高版本的脚本
   
   如果你的脚本在 Firefox <版本号> 版本失效，下面可能帮到你
   
   ## <编号>. <变化标题>
   
   <问题描述>
   
   **问题表现：**
   - <具体错误或现象>
   
   **解决方案：**
   
   把
   
   <旧代码>
   
   替换为
   
   <新代码>
   
   **完整示例：**（可选）
   
   <包含上下文的完整代码示例>
   
   **注意事项：**
   - <重要提醒>
   ```

2. **内容要求：**
   - 针对 **该版本特有的兼容性变化**
   - 包含实际的代码示例（优先从实际修改中提取）
   - 提供问题表现、解决方案和注意事项
   - 如果有多个变化，使用编号区分

3. **现有版本兼容性文档清单：**
   - **126/** - ESM 模块化、Browser 命令改名、nsIFilePicker 参数变化
   - **127/** - whereToOpenLink、historyPopup ID 变化
   - **129/** - PlacesUtils.nodeIsFolder 移除
   - **135/** - 内联事件处理器禁用
   - **136/** - （简单文档模板示例）
   - **139/** - Function() CSP 限制
   - **147/** - showAlertNotification 移除
   - **149/** - （详细文档模板示例）

   根据实际遇到的兼容性问题，参考对应版本的文档进行修改。

**提交信息格式：**
   ```
   feat(DOC): <版本号>/README.md 添加 Firefox <版本号>+ 兼容性文档

   - 记录 <主要变化> 的兼容性变化
   - 提供完整的代码示例和解决方案
   - 引用相关脚本的修改经验
   ```

#### 步骤 3：修改主版本脚本
1. **在主目录的脚本上进行修改**
2. **更新 `@compatibility`**：
   ```
   // @compatibility Firefox 149
   ```
3. **添加变更记录**：
   ```
   // @note 2026-03-29 升级兼容性至 Firefox 149+，更新 API 调用
   ```

### 示例场景

**场景：脚本需要升级到 Firefox 149+**

```javascript
// ===== 步骤 1：归档前 (ScriptName.uc.js) =====
// @compatibility Firefox 80
// @note 2025-01-01 初始版本

// ===== 步骤 2：归档后 (80/ScriptName.uc.js) =====
// @compatibility Firefox 80
// @note 2025-01-01 初始版本
// @note 2026-03-29 归档：新版本升级至 Firefox 149+

// ===== 步骤 3：修改后 (ScriptName.uc.js - 主目录) =====
// @compatibility Firefox 149
// @note 2025-01-01 初始版本
// @note 2026-03-29 升级兼容性至 Firefox 149+，更新 API 调用
//                移除 hidden 属性，使用前置检查
```

### 目录结构示例
```
userChromeJS/
├── 80/
│   ├── ScriptName.uc.js          # Firefox 80-148 版本
│   └── AnotherScript.uc.js       # Firefox 80-148 版本
├── 147/
│   └── OldScript.uc.js           # Firefox 147-148 版本
├── ScriptName.uc.js              # Firefox 149+ 最新版本
├── AnotherScript.uc.js           # Firefox 149+ 最新版本
└── NewScript.uc.js               # Firefox 149+ 新脚本
```

### 归档检查清单
- [ ] 确认需要提升 `@compatibility` 版本
- [ ] 创建对应的版本号目录
- [ ] 复制脚本到归档目录
- [ ] 在归档脚本中添加归档记录 `@note`
- [ ] 检查并创建版本兼容性文档（如不存在）
- [ ] 在主目录脚本中修改代码
- [ ] 更新主目录脚本的 `@compatibility`
- [ ] 在主目录脚本中添加变更记录 `@note`
- [ ] 测试新旧版本脚本在对应 Firefox 版本中的兼容性
