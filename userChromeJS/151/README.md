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

| 旧变量 | 新变量 |
|---|---|
| `--urlbar-box-hover-bgcolor` | `--urlbar-box-background-color-hover` |
| `--urlbar-box-active-bgcolor` | `--urlbar-box-background-color-active` |
| `--urlbar-box-hover-text-color` | `--urlbar-box-text-color-hover` |

**问题表现：**

- 引用旧变量且没有 fallback 的颜色声明失效
- 本仓库 [LocationBar.uc.js](../LocationBar.uc.js) 使用旧变量设置按钮外框的 hover / active 背景、文字和停止 / 刷新图标颜色，相关样式受影响

**解决方案：**

将旧变量替换为新变量；如需兼容旧版，可保留 fallback，例如：

```css
#location-bar .toolbarbutton-1:hover {
  background-color: var(--urlbar-box-background-color-hover, var(--urlbar-box-hover-bgcolor));
  color: var(--urlbar-box-text-color-hover, var(--urlbar-box-hover-text-color));
}

#location-bar .toolbarbutton-1:hover:active {
  background-color: var(--urlbar-box-background-color-active, var(--urlbar-box-active-bgcolor));
}
```

**注意事项：**

- 同时检查 `color` 和 `fill` 中的旧文字颜色变量，不要只替换背景色
- 以上为适配示例，当前脚本仍引用旧变量；影响依据上游差异和静态代码核对，未在 Firefox 中运行验证

**参考：**

- [Bug 2008598 - Convert urlbar variables to design tokens](https://bugzilla.mozilla.org/show_bug.cgi?id=2008598)
- [上游变量迁移提交](https://github.com/mozilla-firefox/firefox/commit/28f0d28d26ee)
