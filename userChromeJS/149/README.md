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
