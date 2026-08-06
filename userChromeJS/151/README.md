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
