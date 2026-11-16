# 适用于 Firefox 149 + 以及更高版本的脚本

如果你的脚本在 Firefox 149 版本失效，下面可能帮到你

## 1. Services.search 改为模块单例（Bug 2000685）

Firefox 149 在 [Bug 2000685](https://bugzilla.mozilla.org/show_bug.cgi?id=2000685) 中将搜索服务从 XPCOM 服务实例改为 ESM 导出的单例，移除 `Services.search` 入口，同时改变模块的打包路径。此前搜索服务已是 ESM，并非从 Firefox 149 才开始模块化。

- Firefox 148：模块路径为 `resource://gre/modules/SearchService.sys.mjs`，导出 `SearchService` 类；调用方应通过 `Services.search` 获取已有服务实例。
- Firefox 149：模块路径改为 `moz-src:///toolkit/components/search/SearchService.sys.mjs`，导出的 `SearchService` 已是单例，可直接使用，无需 `new`。

因此，下方 Firefox 149+ 的两个示例均使用 `moz-src:///` 路径；`resource:///modules/SearchService.sys.mjs` 并不是 Firefox 148 的旧路径。

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
    SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
});
const searchService = lazy.SearchService;
if (!searchService.isInitialized) {
    await searchService.init();
}
const engine = await searchService.getDefault();
```

**完整示例：**

```javascript
lazy: {},
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
                SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
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
- 通过 ESM 获取单例后，如尚未初始化，应等待 `init()` 完成再使用搜索功能
- 使用前检查 `isInitialized` 属性
- 建议使用 Promise 缓存避免重复初始化
- 保持对旧版本的兼容性（通过 `typeof Services.search !== 'undefined'` 判断）

**参考依据：**

- [Bug 2000685 - Replace the search service instance with a singleton](https://bugzilla.mozilla.org/show_bug.cgi?id=2000685)（Firefox 149 修复）
- [Firefox 148 服务注册：旧模块路径及类实例化](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_148_0_RELEASE/toolkit/components/search/components.conf)
- [Firefox 148 模块导出](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_148_0_RELEASE/toolkit/components/search/SearchService.sys.mjs)
- [Firefox 149 模块打包配置](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_149_0_RELEASE/toolkit/components/search/moz.build)
- [Firefox 149 单例导出](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_149_0_RELEASE/toolkit/components/search/SearchService.sys.mjs)

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

## 3. checkbox menuitem checked 属性检测变化

Firefox 149+ 中，`type="checkbox"` 的 menuitem 元素的 `checked` 属性检测方式发生变化。

**问题表现：**
- `getAttribute("checked")` 在取消选中时返回 `"false"` 字符串，而不是 `null`
- 使用 `getAttribute("checked") == "true"` 判断会失效

**解决方案：**

使用 `hasAttribute("checked")` 来检测选中状态：

```javascript
// 错误方法（Firefox 149+ 失效）
let checked = menuitem.getAttribute("checked") == "true";

// 正确方法（Firefox 149+）
let checked = menuitem.hasAttribute("checked");
```

**完整示例：**

```javascript
// 设置菜单项初始状态
let toggleItem = document.createXULElement("menuitem");
toggleItem.setAttribute("type", "checkbox");

// 根据 pref 设置初始状态
let prefValue = Services.prefs.getBoolPref("extensions.myaddon.enabled", false);
if (prefValue) {
    toggleItem.setAttribute("checked", "true");
}

// 点击事件处理
toggleItem.addEventListener("command", function () {
    // 使用 hasAttribute 检测当前状态
    let isChecked = this.hasAttribute("checked");

    // 切换状态
    if (isChecked) {
        this.removeAttribute("checked");
        Services.prefs.setBoolPref("extensions.myaddon.enabled", false);
    } else {
        this.setAttribute("checked", "true");
        Services.prefs.setBoolPref("extensions.myaddon.enabled", true);
    }
});

// 或者在 togglePref 函数中使用
togglePref: function () {
    let menuitem = document.getElementById("my-toggle-item");
    Services.prefs.setBoolPref("extensions.myaddon.enabled", menuitem.hasAttribute("checked"));
}
```

**注意事项：**
- `hasAttribute("checked")` 返回布尔值，更加可靠
- 设置选中：`setAttribute("checked", "true")`
- 取消选中：`removeAttribute("checked")`
- 避免使用 `getAttribute("checked") == "true"` 的判断方式
