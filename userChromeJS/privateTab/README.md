# 无痕（隐私）标签页

基于 [aminomancer/uc.css.js](https://github.com/aminomancer/uc.css.js) 的 Private Tabs 自行维护版本。

## 功能

- 新建隐私标签页（快捷键 Ctrl+Alt+P）
- 切换标签页隐私状态（快捷键 Ctrl+Alt+T）
- 书签/历史侧栏右键菜单中"在隐私标签页中打开"
- 链接右键菜单中"在隐私标签页中打开链接"
- 工具栏按钮支持（可自定义位置）
- 内嵌简体中文 / English 界面文本（自动跟随浏览器语言）
- Tree Style Tab 扩展视觉兼容

## 配置

所有配置项通过 `about:config` 设置，前缀 `privateTabs.`：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `neverClearData` | `false` | 不自动清除数据 |
| `restoreTabsOnRestart` | `true` | 重启时恢复隐私标签页 |
| `doNotClearDataUntilFxIsClosed` | `true` | 关闭 Firefox 时才清除数据 |
| `deleteContainerOnDisable` | `false` | 禁用时删除容器身份 |
| `clearDataOnDisable` | `false` | 禁用时清除数据 |
| `toggleHotkey` | `T` | 切换隐私状态快捷键 |
| `newTabHotkey` | `P` | 新建隐私标签页快捷键 |
| `toggleModifiers` | `alt accel` | 切换修饰键 |
| `newTabModifiers` | `alt accel` | 新建修饰键 |

## 版本历史

- **v1.5.0**（当前）：内嵌中英文界面文本，使用 `UC_API` / `SessionStore.duplicateTab()` API
- v1.3.0 及 xiaoxiaoflood 原版已归档至 `123/` 目录
