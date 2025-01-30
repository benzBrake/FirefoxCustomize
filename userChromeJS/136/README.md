# 适用于 Firefox 136 + 以及更高版本的脚本

如果你的脚本在 Firefox 127 版本失效，下面可能帮到你

1. // Bug 1881888 - Part 8: Remove Cu.import

   把

   ````javascript
   const { AddonManagerPrivate } = Cu.import("resource://gre/modules/AddonManager.jsm")
   ````

   替换为

   ```javascript
   ChromeUtils.defineESModuleGetters(lazy, {
       AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
   });
   const { AddonManagerPrivate } = lazy
   ```