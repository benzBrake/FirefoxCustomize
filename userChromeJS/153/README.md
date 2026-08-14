# 适用于 Firefox 153 + 以及更高版本的脚本

如果你的脚本在 Firefox 153 版本失效，下面可能帮到你。

## 1. `#sidebar-main` 重命名为 `#sidebar-container`（Bug 1904860）

Firefox 153 将侧栏主容器的元素 ID 从 `sidebar-main` 改为 `sidebar-container`。

**问题表现：**

- 针对 `#sidebar-main` 的 CSS 样式不再生效
- 通过 `document.getElementById("sidebar-main")` 获取元素时返回 `null`
- 依赖旧 ID 的侧栏布局、宽度或显示控制失效

**解决方案：**

把

```css
#sidebar-main {
  /* 自定义样式 */
}
```

替换为

```css
#sidebar-container {
  /* 自定义样式 */
}
```

JavaScript 中同样需要替换 ID：

```javascript
const sidebar = document.getElementById("sidebar-container");
```

**注意事项：**

- 只替换 ID 选择器 `#sidebar-main`；`sidebar-main` 自定义元素标签仍然存在，不能全局替换

## 2. 搜索引擎的 `isConfigEngine` 和 `isAppProvided` 属性被移除（Bug 2028198）

Firefox 153 移除了搜索引擎对象上的 `isConfigEngine` 和 `isAppProvided` 属性，改为通过具体类型判断引擎来源。

**问题表现：**

- `engine.isConfigEngine` 或 `engine.isAppProvided` 返回 `undefined`
- 依赖这些布尔属性的条件分支静默走向错误路径
- 自定义搜索引擎的筛选、排序或菜单显示逻辑异常

**解决方案：**

把

```javascript
if (engine.isConfigEngine) {
  // ...
}

if (engine.isAppProvided) {
  // ...
}
```

替换为

```javascript
const {
  ConfigSearchEngine,
  AppProvidedConfigEngine,
} = ChromeUtils.importESModule(
  "moz-src:///toolkit/components/search/ConfigSearchEngine.sys.mjs"
);

if (engine instanceof ConfigSearchEngine) {
  // ...
}

if (engine instanceof AppProvidedConfigEngine) {
  // ...
}
```

**注意事项：**

- 旧属性不会一定抛出异常，`undefined` 可能使问题不易察觉
- 如果脚本同时支持旧版 Firefox，应先检测属性或模块是否存在，再选择判断方式
- `AppProvidedConfigEngine` 是 `ConfigSearchEngine` 的具体类型；判断顺序取决于脚本是否需要区分应用内置引擎

## 3. `Services.logins` 同步方法被移除（Bug 2022270）

Firefox 153 移除了登录管理器的一批同步方法，调用方需要改用对应的异步方法。

**受影响的方法：**

- `removeLogin`
- `modifyLogin`
- `recordPasswordUse`
- `removeAllUserFacingLogins`
- `removeAllLogins`
- `searchLogins`
- `countLogins`

**问题表现：**

- 调用上述方法时报错 `is not a function`
- 登录信息查询、修改或删除功能失效
- `findLogins()` 抛出 `NS_ERROR_NOT_IMPLEMENTED`

**解决方案：**

把同步调用改为对应的 `*Async` 方法，并等待 Promise：

```javascript
await Services.logins.removeLoginAsync(login);
await Services.logins.modifyLoginAsync(oldLogin, newLogin);
await Services.logins.recordPasswordUseAsync(
  login,
  privateContextWithoutExplicitConsent,
  loginType,
  filled
);
await Services.logins.removeAllUserFacingLoginsAsync();
await Services.logins.removeAllLoginsAsync();

const logins = await Services.logins.searchLoginsAsync({
  origin: "https://example.com",
});

const count = await Services.logins.countLoginsAsync(
  "https://example.com",
  "",
  null
);
```

原来使用 `findLogins()` 的代码也应改为条件查询：

```javascript
const logins = await Services.logins.searchLoginsAsync({
  origin: "https://example.com",
  formActionOrigin: "https://example.com",
});
```

**注意事项：**

- 调用这些方法的函数也需要声明为 `async`，或者显式处理返回的 Promise
- 不要继续使用 `findLogins()`；Firefox 153 中仅保留了会抛出异常的兼容 stub
- 异步调用的异常应通过 `try...catch` 或 Promise rejection handler 处理

## 4. Urlbar 内部模块路径改变（Bug 2039297、Bug 2039298）

Firefox 153 将 `UrlbarView` 和 `UrlbarEventBufferer` 移到浏览器内容目录，并更改了模块 URL 和文件名。

**问题表现：**

- 导入模块时报错找不到 `UrlbarView.sys.mjs` 或 `UrlbarEventBufferer.sys.mjs`
- 地址栏结果视图或键盘事件缓冲相关的自定义功能无法初始化

**解决方案：**

把

```javascript
ChromeUtils.importESModule(
  "moz-src:///browser/components/urlbar/UrlbarView.sys.mjs"
);
ChromeUtils.importESModule(
  "moz-src:///browser/components/urlbar/UrlbarEventBufferer.sys.mjs"
);
```

替换为

```javascript
ChromeUtils.importESModule(
  "chrome://browser/content/urlbar/UrlbarView.mjs"
);
ChromeUtils.importESModule(
  "chrome://browser/content/urlbar/UrlbarEventBufferer.mjs"
);
```

如果只需要当前浏览器窗口中的现有对象，优先直接使用：

```javascript
const urlbarView = gURLBar.view;
const eventBufferer = gURLBar.eventBufferer;
```

**注意事项：**

- 这些属于 Firefox 内部模块，路径和导出内容没有稳定性保证
- 使用 `gURLBar` 已创建的实例通常比自行导入并实例化内部类更稳妥
- 同时兼容旧版本时，可以先使用现有实例，再按版本或导入结果选择模块路径

## 5. `LayoutUtils.sys.mjs` 被移除（Bug 2024649）

Firefox 153 移除了 `LayoutUtils.sys.mjs`。原模块中的屏幕坐标转换功能已由 `WindowUtils` 提供。

**问题表现：**

- 导入 `LayoutUtils.sys.mjs` 时报错模块不存在
- 弹窗定位、元素屏幕坐标计算或窗口坐标转换功能失效

**解决方案：**

获取元素在屏幕上的矩形：

```javascript
const rect = element.documentGlobal.windowUtils
  .getElementBoundingScreenRect(element);
```

将窗口坐标转换为屏幕坐标：

```javascript
const rect = win.windowUtils.toScreenRect(left, top, width, height);
```

将窗口坐标转换为顶层组件坐标：

```javascript
const rect = win.windowUtils.toTopLevelWidgetRect(
  left,
  top,
  width,
  height
);
```

**注意事项：**

- 根据原来调用的 `LayoutUtils` 方法选择对应的 `WindowUtils` API，不能只替换模块路径
- `element.documentGlobal` 可能为空时，应在调用前检查元素是否仍连接到文档
- 坐标系含义不同，修改后需要实际检查弹窗位置和多屏幕环境下的表现

## 6. CSS 变量 `--color-gray-05` 重命名为 `--color-gray-0`（Bug 2008877）

Firefox 153 将旧的灰色设计变量 `--color-gray-05` 重命名为 `--color-gray-0`。

**问题表现：**

- 使用旧变量的颜色声明失效
- 未提供 fallback 时，相关背景色、边框色或文字颜色恢复为默认值

**解决方案：**

把

```css
color: var(--color-gray-05);
```

替换为

```css
color: var(--color-gray-0);
```

如需兼容新旧版本，可以提供 fallback：

```css
color: var(--color-gray-0, var(--color-gray-05));
```

**注意事项：**

- 本仓库当前未发现 `--color-gray-05` 的引用
- Firefox 内部设计变量可能继续变化，关键颜色可以考虑提供最终的静态颜色 fallback

## Firefox 153.2.0 ESR 后续安全变化

以下变化是后续回移到 Firefox ESR 153.2.0 分支的安全加固，不应视为 Firefox 153.0 首发时就存在的行为。

## 7. `loadSubScript` 可加载的 URL 被限制（Bug 1974213）

Firefox ESR 153.2.0 收紧了 `Services.scriptloader.loadSubScript()` 和 `loadSubScriptWithOptions()` 接受的 URL。默认只允许 `chrome:`、`resource:` 和 `moz-src:`。

**问题表现：**

- 从本地 `file:` URL 加载 userChromeJS 脚本时被拒绝
- 使用 `data:application/javascript,...` 动态执行代码时失败
- 原本能加载的 `jar:` 或 `moz-extension:` URL 不再默认可用

**解决方案：**

加载受信任的本地文件时，使用 `loadSubScriptWithOptions()` 并显式允许受支持的非默认 URL：

```javascript
Services.scriptloader.loadSubScriptWithOptions(fileURI.spec, {
  target: sandbox,
  allowUnsafeURL: true,
});
```

如果确实需要执行动态字符串，可以改用沙箱：

```javascript
const sandbox = Cu.Sandbox(window, {
  sandboxName: "userChromeJS",
  wantXrays: false,
});

Cu.evalInSandbox(sourceCode, sandbox, "latest");
```

**注意事项：**

- `allowUnsafeURL: true` 只额外允许 `file:`、`jar:` 和 `moz-extension:`
- `data:` URL 即使设置 `allowUnsafeURL: true` 也不允许，不能把旧调用机械地改成带选项的调用
- 本仓库 `userChromeJS/139/README.md` 中的 `data:application/javascript` 示例在 153.2.0 ESR 后会失效
- 只应加载可信文件或执行可信字符串，并尽量缩小沙箱可访问的对象范围

## 8. system-principal 文档强制应用基线 CSP（Bug 2040297）

Firefox ESR 153.2.0 为所有使用 system principal 的文档强制应用基线内容安全策略：

```text
script-src chrome: resource: moz-src:
```

**问题表现：**

- 空白的 system-principal iframe 中脚本不再执行
- 动态设置的 `onclick`、`oncommand` 等内联事件处理器被拦截
- `data:` URL、内联脚本或部分字符串代码执行方式触发 CSP 错误

**解决方案：**

把内联事件处理器改为事件监听器：

```javascript
// 修改前
button.setAttribute("oncommand", "doSomething();");

// 修改后
button.addEventListener("command", () => {
  doSomething();
});
```

需要执行受信任的动态代码时，使用明确创建的沙箱，而不是把代码写入 system-principal 文档：

```javascript
const sandbox = Cu.Sandbox(window, {
  sandboxName: "userChromeJS",
  wantXrays: false,
});

Cu.evalInSandbox(sourceCode, sandbox, "latest");
```

**注意事项：**

- 基线 CSP 会与文档已有策略共同生效，已有策略不能放宽这条基线限制
- 优先使用 `addEventListener()` 绑定事件，不要生成带内联处理器属性的元素
- CSP 报错通常会显示在浏览器工具箱控制台中，可据此定位被阻止的脚本来源

## 相关资源

- [Bug 1904860 - Rename sidebar-main ID](https://bugzilla.mozilla.org/show_bug.cgi?id=1904860)
- [Bug 2028198 - Remove isConfigEngine and isAppProvided](https://bugzilla.mozilla.org/show_bug.cgi?id=2028198)
- [Bug 2022270 - Remove synchronous login manager methods](https://bugzilla.mozilla.org/show_bug.cgi?id=2022270)
- [Bug 2039298 - Move UrlbarView](https://bugzilla.mozilla.org/show_bug.cgi?id=2039298)
- [Bug 2039297 - Move UrlbarEventBufferer](https://bugzilla.mozilla.org/show_bug.cgi?id=2039297)
- [Bug 2024649 - Remove LayoutUtils](https://bugzilla.mozilla.org/show_bug.cgi?id=2024649)
- [Bug 2008877 - Rename color-gray-05](https://bugzilla.mozilla.org/show_bug.cgi?id=2008877)
- [Bug 1974213 - Restrict loadSubScript URLs](https://bugzilla.mozilla.org/show_bug.cgi?id=1974213)
- [Bug 2040297 - Apply baseline CSP to system-principal documents](https://bugzilla.mozilla.org/show_bug.cgi?id=2040297)
- [Firefox 153 source commit - sidebar container rename](https://github.com/mozilla-firefox/firefox/commit/67bbd6e30d03)
- [Firefox 153 source commit - search engine properties](https://github.com/mozilla-firefox/firefox/commit/070411976f16)
- [Firefox 153 source commit - login manager async methods](https://github.com/mozilla-firefox/firefox/commit/0825590217a8)
- [Firefox 153 source commit - UrlbarView](https://github.com/mozilla-firefox/firefox/commit/31d43aafec0a)
- [Firefox 153 source commit - UrlbarEventBufferer](https://github.com/mozilla-firefox/firefox/commit/025853a93643)
- [Firefox 153 source commit - LayoutUtils](https://github.com/mozilla-firefox/firefox/commit/677fcfdeaa2c)
- [Firefox 153 source commit - color variable](https://github.com/mozilla-firefox/firefox/commit/b0ac1c45e430)
- [Firefox ESR 153.2.0 source commit - loadSubScript restrictions](https://github.com/mozilla-firefox/firefox/commit/aacd7a7298b059a2c1220d9db9da4c908b1f4791)
- [Firefox ESR 153.2.0 source commit - baseline CSP](https://github.com/mozilla-firefox/firefox/commit/49dc9c716fa125a35092e848e13f477dfc14d9f6)
