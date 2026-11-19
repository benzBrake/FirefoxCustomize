# userChromeJS README 路径维护

归档目录中的脚本可能是旧版副本，不一定是唯一或最新版本。更新 README 条目或修改脚本路径前，先核对所有同名脚本，再让 README 指向最新维护版本。

## 检查流程

1. 搜索 `userChromeJS/` 下所有同名脚本。

   ```bash
   rg --files userChromeJS -g 'ScriptName.uc.js'
   ```

2. 比较各副本的 `@compatibility` 和 `@version`，确定哪个是最新维护版本。
3. 更新 README，使其指向最新维护版本；必要时保留归档版本说明。

## 示例：AutoPopup

```text
userChromeJS/
├── 57/AutoPopup.uc.js   # Firefox 57+，归档版本
└── 109/AutoPopup.uc.js  # Firefox 109+，较新的维护版本
```

README 应指向 `109/AutoPopup.uc.js`，同时保留 `57/AutoPopup.uc.js` 作为历史归档。不能仅因文件位于版本目录就认定它是唯一版本。

## 检查清单

- [ ] 搜索所有同名脚本。
- [ ] 对比各版本的 `@compatibility` 和 `@version`。
- [ ] 确认最新维护版本的位置。
- [ ] 更新 README 指向最新版本，并在需要时说明归档版本。

## 经验记录

ReloadAllTabs.uc.js 归档操作曾导致 README 错误地从 `109/AutoPopup.uc.js` 指向 `57/AutoPopup.uc.js`。问题原因是没有检查多个版本目录；撤销错误引用后，应继续指向较新的维护版本。该案例记录日期为 2026-04-07，强调归档操作前核对所有版本及其引用关系。
