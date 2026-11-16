# 适用于 Firefox 157 + 以及更高版本的脚本

如果你的脚本或用户样式在 Firefox 157 版本失效，下面可能帮到你。

## 1. 地址栏移除 breakout 属性，改用 popover 状态（Bug 2069413）

Firefox 157 调整了浏览器工具栏地址栏的弹出层生命周期：仅在结果视图展开期间显示 popover，退出展开状态时隐藏。原来的 `breakout`、`breakout-extend` 属性被移除，动画属性、CSS 变量和相关内部方法也改用新的命名。

**问题表现：**

- `#urlbar[breakout]`、`#urlbar[breakout-extend]` 等选择器不再匹配，自定义地址栏布局、背景或结果列表样式失效
- 通过 `hasAttribute("breakout-extend")` 判断地址栏展开状态时始终得到 `false`
- 覆盖旧的 `--urlbar-*-breakout` 变量不再影响 Firefox 原生样式
- 调用或修改旧的地址栏布局方法时，可能出现 `is not a function` 或补丁失效

**解决方案：**

### 展开状态选择器

把

```css
#urlbar[breakout][breakout-extend] > .urlbar-background {
  box-shadow: none !important;
}
```

替换为

```css
#urlbar:popover-open > .urlbar-background {
  box-shadow: none !important;
}
```

JavaScript 中同样改为检查 popover 状态：

```javascript
// 修改前
const expanded = gURLBar.hasAttribute("breakout-extend");

// 修改后
const expanded = gURLBar.matches(":popover-open");
```

仅用 `[breakout]` 限定普通地址栏样式时，应根据原意去掉该属性条件；例如 `#urlbar[breakout] .urlbarView` 可改为 `#urlbar .urlbarView`。只有确实限定展开状态的规则才使用 `:popover-open`，不能把所有 `[breakout]` 都机械替换为该伪类。

需要同时保留旧版规则时，可以并列匹配：

```css
#urlbar:is([breakout-extend], :popover-open) > .urlbar-background {
  box-shadow: none !important;
}
```

### 动画属性与 CSS 变量

动画属性由 `[breakout-extend-animate]` 改为 `[popover-animate]`。它用于控制展开动画，不表示弹出层当前是否打开。

本次变更中的 CSS 变量对应关系如下：

| 旧变量 | 新变量 |
|---|---|
| `--urlbar-input-container-border-width-breakout` | `--urlbar-input-container-border-width-open` |
| `--urlbar-background-overhang-breakout` | `--urlbar-background-overhang-open` |
| `--urlbar-background-border-breakout` | `--urlbar-background-border-open` |
| `--urlbar-background-border-top-radius-breakout` | `--urlbar-background-border-top-radius-open` |
| `--urlbar-background-box-shadow-breakout` | `--urlbar-background-box-shadow-open` |
| `--urlbar-background-box-shadow-breakout-compact` | `--urlbar-background-box-shadow-open-compact` |
| `--urlbar-input-container-outline-breakout` | `--urlbar-input-container-outline-open` |
| `--urlbar-input-container-outline-breakout-focused` | `--urlbar-input-container-outline-open-focused` |
| `--urlbar-input-container-outline-offset-breakout` | `--urlbar-input-container-outline-offset-open` |
| `--urlbar-margin-block-start-breakout` | `--urlbar-margin-block-start-open` |

例如，原来通过变量关闭展开阴影的样式应改为：

```css
#urlbar {
  --urlbar-background-box-shadow-open: none;
  --urlbar-background-box-shadow-open-compact: none;
}
```

如果还要支持旧版 Firefox，覆盖变量时应同时声明旧名和新名；读取变量时则可以使用 `var(--新变量, var(--旧变量))` 回退。

### 地址栏内部方法

依赖 `UrlbarInputBase` 内部实现的脚本还需检查以下变化：

| 旧方法 | Firefox 157 中的变化 |
|---|---|
| `updateLayoutExtend()` | 由 `updatePopover()` 统一更新弹出层状态 |
| `startLayoutExtend()` | 改为私有方法 `#openPopover()` |
| `endLayoutExtend()` | 改为私有方法 `#closePopover()` |
| `incrementBreakoutBlockerCount()` | 改名为 `incrementPopoverBlockerCount()` |
| `decrementBreakoutBlockerCount()` | 改名为 `decrementPopoverBlockerCount()` |

私有方法不能从 userChromeJS 直接调用或覆盖。不要简单把调用改成 `gURLBar.#openPopover()`；应按实际用途重新检查结果视图与弹出层的控制逻辑。

**注意事项：**

- `breakout` 原来表示地址栏具备脱离工具栏布局的状态，并不等同于结果列表已打开，因此没有统一的一对一替代选择器。
- `:popover-open`、输入焦点和结果视图状态不能混用：判断焦点使用相应焦点状态，判断结果视图是否打开可使用 `gURLBar.view.isOpen`。
- 上游对可嵌入页面的 `.urlbar[in-page]` 有单独处理，其 popover 可能在聚焦时打开。共用 `.urlbar` 样式时，上游使用 `.urlbar:popover-open:where([open], :not([in-page]))` 限定原展开样式；上面的 `#urlbar` 示例针对浏览器工具栏地址栏。
- 并列旧、新选择器可覆盖旧属性和新状态，但部分较早版本的 popover 生命周期不同，不能据此保证所有旧版本的行为完全一致。
- 本仓库的 [Sidra 地址栏 SCSS](../../UserThemes/Sidra/src/urlbar.scss)、[oneline 主题](../../UserThemes/oneline/userChrome.css) 和 [IE8 地址栏样式](../../UserThemes/IE8/urlbar.css) 仍包含旧选择器，需要分别评估适配；本说明未修改这些主题，也不表示这些旧主题的其他结构已兼容 Firefox 157。
- 以上依据上游提交和仓库静态检索，未在 Firefox 157 中运行验证。

## 相关资源

- [Bug 2069413 - Show the address bar's popover only while its results view is open and drop the breakout attributes](https://bugzilla.mozilla.org/show_bug.cgi?id=2069413)
- [上游提交：调整 popover 显示周期](https://github.com/mozilla-firefox/firefox/commit/722299f76e71)
- [上游提交：以 :popover-open 替换 breakout-extend](https://github.com/mozilla-firefox/firefox/commit/84ab68a98ffc)
- [上游提交：移除 breakout 属性](https://github.com/mozilla-firefox/firefox/commit/8bf55ea5edae)
- [上游提交：重命名 breakout 相关属性、变量和方法](https://github.com/mozilla-firefox/firefox/commit/575ba140a404)
