# userChromeJS 脚本元数据规范

## `@compatibility`

- 格式：`// @compatibility Firefox <版本号>`。
- 含义：脚本的最低兼容 Firefox 版本。例如 `Firefox 149` 表示需要 Firefox 149 或更高版本。

```javascript
// @compatibility Firefox 149
```

## `@note`

- 有脚本版本号时，格式为 `// @note <版本号> <日期> <日志>`；无脚本版本号时，格式为 `// @note <日期> <日志>`。
- 日期使用完整格式 `YYYY-MM-DD`。
- 版本号填写该条变更所属的脚本版本（不是 Firefox 版本），并保留脚本现有的版本管理方式。
- 新增或修改的记录遵循上述格式；不要为统一格式批量改写旧记录，也不要臆造未知的历史日期。

```javascript
// @note 0.4.4 2026-11-16 修复搜索服务兼容性，保留旧版本支持
// @note 2026-03-29 修复 Firefox 149+ 兼容性：更新 API，移除 hidden 属性
```
