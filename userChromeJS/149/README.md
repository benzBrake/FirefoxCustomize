# 适用于 Firefox 149 + 以及更高版本的脚本

如果你的脚本在 Firefox 149 版本失效，下面可能帮到你

## 1. Services.search 模块化

Firefox 149 将搜索服务移至 ESM 模块，需要使用新的导入方式。

**问题表现：**
- `Services.search is undefined` 错误
- 搜索相关功能失效

**解决方案：**

把

```javascript
const searchService = Services.search;
await searchService.getDefault();
```

替换为

```javascript
const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
    SearchService: "resource:///modules/SearchService.sys.mjs",
});
const searchService = lazy.SearchService;
if (!searchService.isInitialized) {
    await searchService.init();
}
const engine = await searchService.getDefault();
```

**完整示例：**

```javascript
initSearchService: async function () {
    if (this._searchServiceInitPromise) {
        return this._searchServiceInitPromise;
    }
    this._searchServiceInitPromise = (async () => {
        if (typeof Services.search !== 'undefined') {
            // Firefox 148 及更早版本
            this.searchService = Services.search;
        } else {
            // Firefox 149+
            ChromeUtils.defineESModuleGetters(this.lazy, {
                SearchService: "resource:///modules/SearchService.sys.mjs",
            });
            this.searchService = this.lazy.SearchService;
        }
        if (!this.searchService.isInitialized) {
            await this.searchService.init();
        }
        return this.searchService;
    })();
    return this._searchServiceInitPromise;
}
```

**注意事项：**
- ESM 模块需要手动调用 `init()` 方法初始化
- 使用前检查 `isInitialized` 属性
- 建议使用 Promise 缓存避免重复初始化
- 保持对旧版本的兼容性（通过 `typeof Services.search !== 'undefined'` 判断）

## 2. 菜单项 hidden 属性行为变化

Firefox 149+ 的 XUL 渲染行为发生变化，**只要元素存在 `hidden` 属性，无论值是 `true` 还是 `false`，都会被强制隐藏**。

**问题表现：**
- 设置 `menu.hidden = false` 后菜单项仍然隐藏
- 使用 `menu.setAttribute('hidden', 'false')` 无法显示菜单项

**解决方案：**

使用 `removeAttribute` 方法移除 `hidden` 属性来显示元素：

```javascript
// 显示菜单项（正确方法）
menu.removeAttribute('hidden');

// 隐藏菜单项
menu.setAttribute('hidden', 'true');

// 或者使用移除-重建模式
areaMenu.addEventListener('popupshowing', function () {
    const _menu = document.getElementById('myMenu');
    if (_menu) this.removeChild(_menu);

    if (shouldShowMenu) {
        const menu = document.createXULElement('menuitem');
        // ...
        this.appendChild(menu);
    }
}, false);
```

**注意事项：**
- `menu.hidden = false` 无效，必须使用 `removeAttribute('hidden')`
- 推荐使用移除-重建模式，避免 hidden 属性问题
