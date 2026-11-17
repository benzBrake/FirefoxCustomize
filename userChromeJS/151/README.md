# 适用于 Firefox 151 + 以及更高版本的脚本

如果你的脚本在 Firefox 151 版本失效，下面可能帮到你

## 1. sidebars.svg 图标文件移除

Firefox 151 删除了 `sidebars.svg` 和 `sidebars-right.svg` 图标文件，替换为 `sidebar-collapsed.svg`。

**相关变更：**
- Bug 1910902（提交时间 2026-03-26）：Update sidebar icons and references to use collapsed versions
- Firefox 150 的 `browser/themes/shared/jar.inc.mn` 仍包含 `skin/classic/browser/sidebars.svg`
- Firefox 153.0.3 已验证：`browser/omni.ja` 中存在 `sidebar-collapsed.svg`，不存在 `sidebars.svg`

**问题表现：**
- 引用 `resource:///chrome/browser/skin/classic/browser/sidebars.svg` 的图标无法显示
- 控制台报错图标资源找不到

**解决方案：**

把

```javascript
image: "resource:///chrome/browser/skin/classic/browser/sidebars.svg"
```

替换为

```javascript
image: "chrome://browser/skin/sidebar-collapsed.svg"
```

**完整示例：**

```javascript
// 修改前（Firefox 150 及更早）
{
    name: "使用新版侧边栏",
    image: "resource:///chrome/browser/skin/classic/browser/sidebars.svg",
    type: prefs.PREF_BOOL,
    pref: "sidebar.revamp",
    possibleVals: [
        { val: false },
        { val: true },
    ]
}

// 修改后（Firefox 151+）
{
    name: "使用新版侧边栏",
    image: "chrome://browser/skin/sidebar-collapsed.svg",
    type: prefs.PREF_BOOL,
    pref: "sidebar.revamp",
    possibleVals: [
        { val: false },
        { val: true },
    ]
}
```

**注意事项：**
- `resource:///` 协议路径不可用于新图标，需使用 `chrome://` 协议
- 脚本中所有引用 `sidebars.svg` 的位置都需替换

## 2. 地址栏 hover / active 颜色变量改名（Bug 2008598）

Firefox 151 将地址栏颜色变量转换为设计令牌，并调整了变量名称。

**相关变更：**

- Bug 2008598：Convert urlbar variables to design tokens，目标版本为 Firefox 151
- 变量迁移提交 `28f0d28d26ee` 于 2026-04-06（UTC）合入；Firefox 150 正式版仍使用旧名，151 正式版已使用新名

| 旧变量 | 新变量 |
|---|---|
| `--urlbar-box-hover-bgcolor` | `--urlbar-box-background-color-hover` |
| `--urlbar-box-active-bgcolor` | `--urlbar-box-background-color-active` |
| `--urlbar-box-hover-text-color` | `--urlbar-box-text-color-hover` |

**问题表现：**

- 引用旧变量且没有 fallback 的颜色声明失效
- LocationBar 旧版使用这些变量设置按钮外框的 hover / active 背景、文字和停止 / 刷新图标颜色，导致按钮状态颜色无法跟随原生 page action

**解决方案：**

将旧变量替换为新变量；如需兼容旧版，可保留 fallback，例如：

```css
#location-bar .toolbarbutton-1:hover {
  background-color: var(--urlbar-box-background-color-hover, var(--urlbar-box-hover-bgcolor));
  color: var(--urlbar-box-text-color-hover, var(--urlbar-box-hover-text-color));
}

#location-bar .toolbarbutton-1:hover:active {
  background-color: var(--urlbar-box-background-color-active, var(--urlbar-box-active-bgcolor));
  color: var(--urlbar-box-text-color-hover, var(--urlbar-box-hover-text-color));
}

#location-bar #stop-reload-button[animate] > #reload-button > .toolbarbutton-icon,
#location-bar #stop-reload-button[animate] > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon {
  fill: var(--urlbar-box-text-color-hover, var(--urlbar-box-hover-text-color));
}
```

**注意事项：**

- 同时检查 `color` 和 `fill` 中的旧文字颜色变量，不要只替换背景色
- 以上为保留旧版兼容性的示例；本仓库 [LocationBar.uc.js](../LocationBar.uc.js) 自 0.0.7 起直接使用新变量，最低兼容版本提升至 Firefox 151
- Firefox 149–150 使用 [0.0.6 归档版](../149/LocationBar.uc.js)；原有 [Firefox 107 归档版](../107/LocationBar.uc.js) 保持不变
- 本次修复已进行 JavaScript 语法检查和静态核对，尚未在 Firefox 中加载修改后的脚本验证实际交互效果

**补充：按钮内外层背景叠加**

即使地址栏变量已更新，若 LocationBar 按钮仍比原生 page action 更深，还需检查内部 `.toolbarbutton-icon` 或 `.toolbarbutton-badge-stack` 是否绘制了工具栏按钮背景。新版 Firefox 的工具栏样式读取 `--toolbarbutton-background-color-hover` 和 `--toolbarbutton-background-color-active`，只设置旧的 `--toolbarbutton-hover-background` 无法清除这层背景。

LocationBar 0.0.7 在保留旧变量的同时，补充以下规则，让状态背景仅由外层按钮绘制：

```css
#location-bar toolbarbutton {
  --toolbarbutton-background-color-hover: transparent;
  --toolbarbutton-background-color-active: transparent;
  --toolbarbutton-hover-background: transparent;
}
```

此处是工具栏内部背景的兼容处理，不应把工具栏变量改名也归因于上述 Bug 2008598；该 Bug 的源码对照确认的是地址栏变量迁移。

Firefox 160 中临时应用上述补丁并锁定 hover 伪类后，已确认 LocationBar 按钮内层背景为透明，外层背景与原生收藏按钮一致；测试后已移除临时样式并恢复原有伪类锁定状态。这是运行时计算样式验证，完整脚本重新加载及实际鼠标交互仍待验证。

**参考：**

- [Bug 2008598 - Convert urlbar variables to design tokens](https://bugzilla.mozilla.org/show_bug.cgi?id=2008598)
- [上游变量迁移提交](https://github.com/mozilla-firefox/firefox/commit/28f0d28d26ee)
- [Firefox 150 正式版地址栏样式](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_150_0_RELEASE/browser/themes/shared/urlbar-searchbar.css)
- [Firefox 151 正式版地址栏样式](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_151_0_RELEASE/browser/themes/shared/urlbar-searchbar.css)
