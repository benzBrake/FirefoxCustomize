# userChromeJS 版本归档工作流

## 重要原则

需要修改脚本的 `@compatibility` 版本号时，必须先归档旧版本，再修改新版本。

版本号目录仅用于归档旧脚本和保存版本兼容性文档；活跃脚本不应放在版本号目录中：

- `userChromeJS/` 根目录存放活跃的单文件脚本和系统引导文件（`*.sys.mjs`）。
- 命名子目录存放带配置、本地化或其他资源的活跃多文件脚本。
- 版本号目录（如 `57/`、`80/`、`149/`）仅存放旧版本归档和兼容性文档（`README.md`）。
- 除非存在明确兼容性原因，不要重组版本归档目录。

## 简单归档：脚本不再更新

1. 读取当前 `@compatibility`，确认最低兼容版本。
2. 将脚本移动到 `userChromeJS/` 下与其当前最低兼容 Firefox 版本对应的版本目录。
3. 在归档脚本中增加 `@note`，记录归档日期和原因。
4. 确认根目录或原命名目录中的活跃版本已移除。

示例归档记录：

```javascript
// @note 2026-03-29 归档：不再更新
```

用户提出“停止维护”“不再维护”“废弃”或“弃用”时，都按简单归档处理，不直接删除。

## 升级归档：继续维护但提高最低版本

### 适用情况

- 使用新版 Firefox 特有 API。
- 移除旧版 Firefox 兼容代码。
- 重构导致不再兼容旧版本。
- 修复仅影响新版 Firefox 的 bug。

### 操作步骤

1. 读取当前 `@compatibility`，确认旧版本最低兼容版本。
2. 将旧脚本**复制**到对应的 Firefox 版本目录，保留原脚本作为后续修改基础。
3. 在归档副本中增加 `@note`，记录归档日期和新版本的最低 Firefox 要求。
4. 检查对应版本目录是否已有兼容性 `README.md`。如无则创建；如有则补充实际遇到的 API 变化、问题表现、解决方案、代码示例和注意事项。
5. 在原位置更新活跃脚本，修改 `@compatibility` 并增加变更 `@note`。
6. 在相应 Firefox 版本中测试新旧版本脚本兼容性。

归档副本示例：

```javascript
// @compatibility Firefox 80
// @note 2025-01-01 初始版本
// @note 2026-03-29 归档：新版本升级至 Firefox 149+
```

活跃版本示例：

```javascript
// @compatibility Firefox 149
// @note 2025-01-01 初始版本
// @note 2026-03-29 升级兼容性至 Firefox 149+，更新 API 调用
```

### 版本兼容性文档

版本目录 README 记录该 Firefox 版本特有的兼容性变化，并尽量提供从实际修改中提取的代码示例。可参考现有文档：

- `126/`：ESM 模块化、Browser 命令改名、`nsIFilePicker` 参数变化
- `127/`：`whereToOpenLink`、`historyPopup` ID 变化
- `129/`：`PlacesUtils.nodeIsFolder` 移除
- `135/`：内联事件处理器禁用
- `139/`：`Function()` CSP 限制
- `147/`：`showAlertNotification` 移除
- `136/`：可参考的简单兼容性文档示例
- `149/`：可参考的详细兼容性文档示例

建议文档结构：

```markdown
# 适用于 Firefox <版本号> + 以及更高版本的脚本

如果你的脚本在 Firefox <版本号> 版本失效，下面可能帮到你

## 1. <变化标题>

<问题描述>

**问题表现：**
- <具体错误或现象>

**解决方案：**
把

<旧代码>

替换为

<新代码>

**注意事项：**
- <重要提醒>
```

## 目录示例

简单归档后，旧版只保留在归档目录：

```text
userChromeJS/
├── 100/
│   └── MenubarReplaceWithButton.uc.js  # 归档版本
└── NewScript.uc.js                     # 活跃脚本
```

升级归档后，归档副本与活跃脚本并存，活跃版本留在原位置：

```text
userChromeJS/
├── 80/
│   └── ScriptName.uc.js                # 旧版本归档
├── ScriptName.uc.js                    # 最新活跃版本
└── MultiFileScript/                    # 活跃多文件脚本
    ├── MultiFileScript.uc.js
    └── _config.js
```

## 检查清单

简单归档：

- [ ] 确认脚本不再更新。
- [ ] 读取当前最低兼容 Firefox 版本。
- [ ] 将脚本移动到对应版本目录并添加归档 `@note`。
- [ ] 确认原位置的活跃文件已移除。

升级归档：

- [ ] 确认需要提高 `@compatibility`。
- [ ] 将旧脚本复制到对应版本目录并添加归档 `@note`。
- [ ] 检查或创建版本兼容性文档。
- [ ] 在原位置修改活跃脚本、更新 `@compatibility` 和 `@note`。
- [ ] 测试新旧版本在对应 Firefox 版本中的兼容性。
