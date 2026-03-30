# 适用于 Firefox 136 + 以及更高版本的脚本

如果你的脚本在 Firefox 136 版本失效，下面可能帮到你。

## 1. 移除 `Cu.import`（Bug 1881888）

Firefox 136+ 逐步推进 ESM 模块化，部分场景下旧式 `Cu.import` 写法会失效或不可用。

把

```javascript
const { AddonManagerPrivate } = Cu.import("resource://gre/modules/AddonManager.jsm");
```

替换为

```javascript
const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
});
const { AddonManagerPrivate } = lazy;
```

## 2. 地址栏中键复制失效

Firefox 136+ 下，地址栏中键复制在仅监听单一点击事件时可能不稳定。

把

```javascript
input.addEventListener("click", handleUrlbarMiddleClick, true);
```

替换为

```javascript
input.addEventListener("auxclick", handleUrlbarMiddleClick, true);
input.addEventListener("click", handleUrlbarMiddleClick, true);
```

这样可覆盖更稳定的中键触发路径，修复部分场景下中键复制不生效的问题。
