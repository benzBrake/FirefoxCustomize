# 适用于 Firefox 126 + 以及更高版本的脚本

如果你的脚本在 Firefox 126 版本失效，下面可能帮到你。

## 导入变化

```javascript
ChromeUtils.import("resource:///modules/CustomizableUI.jsm");
```

修改为

```javascript
ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs");
```

因为 Firefox 已经完全 ESMify，所有模块都必须改成`ChromeUtils.importESModule`这种导入，如果你想兼容老版本，可以是用`Services.appinfo.version`判别版本自行处理

## nsIFilePicker 参数变化

`fp.init`不再接受`window`作为第一个参数，兼容代码

```javascript
// Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
    ? window.browsingContext
    : window, "Choose a file", fp.modeOpen);
```



