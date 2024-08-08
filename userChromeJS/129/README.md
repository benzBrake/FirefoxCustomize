# 适用于 Firefox 129 + 以及更高版本的脚本

如果你的脚本在 Firefox 127 版本失效，下面可能帮到你

1. *// Bug 1904909 PlacesUtils::GatherDataText and GatherDataHtml should not recurse into queries*

   如果遇到

   ```
   Uncaught TypeError: PlacesUtils.nodeIsFolder is not a function
   ```

   在你的脚本最前边加入

   ```javascript
   if (typeof PlacesUtils.nodeIsFolder === "undefined") PlacesUtils.nodeIsFolder = PlacesUtils.nodeIsFolderOrShortcut;
   ```

   

