# 适用于 Firefox 152 + 以及更高版本的脚本

如果你的脚本在 Firefox 152 版本失效，下面可能帮到你。

## 1. `ownerGlobal` 重命名为 `relevantGlobal`（Bug 2033243）

Firefox 152+ 重构了 DOM 全局对象访问 API，将 `ownerGlobal` 重命名为 `relevantGlobal`，并引入了 `documentGlobal` 作为更推荐的方法。

**问题表现：**
- 脚本中出现 `undefined` 或 `Cannot read property 'ownerGlobal' of undefined` 错误
- 事件处理中无法正确获取窗口对象
- 跨框架访问窗口对象失败

**背景说明：**
根据 [Bug 2033243](https://bugzilla.mozilla.org/show_bug.cgi?id=2033243)，此次变更的原因包括：
- HTML 规范中 `relevant` 这一术语更加准确（参考 [HTML Spec: relevant](https://html.spec.whatwg.org/#relevant)）
- 前端代码几乎总是需要 `.documentGlobal`，而不是原来的 `.ownerGlobal`
- 消除节点被 `adoptNode` 后行为不一致的问题

**解决方案：**

### 1.1 简单场景：直接替换

把

```javascript
const win = node.ownerGlobal;
```

替换为

```javascript
const win = node.documentGlobal || node.relevantGlobal;
```

**说明：** 优先使用 `documentGlobal`（更推荐），fallback 到 `relevantGlobal`（原 `ownerGlobal` 的新名称）。

### 1.2 复杂场景：fallback 链式调用

把

```javascript
const win = trg.documentGlobal || trg.ownerGlobal || trg.ownerDocument?.defaultView || window;
```

替换为

```javascript
const win = trg.documentGlobal || trg.relevantGlobal || trg.ownerDocument?.defaultView || window;
```

**说明：** 保持多层 fallback 策略，确保在不同上下文中都能正确获取窗口对象。

### 1.3 特殊场景：windowRoot 访问

把

```javascript
const browserWin = win.windowRoot.ownerGlobal || win.opener;
```

替换为

```javascript
const browserWin = win.documentGlobal?.browsingContext?.embedderWindowGlobal?.browsingContext?.window
    || win.windowRoot.relevantGlobal || win.opener;
```

**说明：** 使用新的 `browsingContext` API 优先，fallback 到 `relevantGlobal`。

### 1.4 事件处理中的常见模式

把

```javascript
handleEvent: function (event) {
    const { target } = event;
    const win = target.ownerGlobal || target.ownerDocument?.defaultView || window;
    // ... 处理逻辑
}
```

替换为

```javascript
handleEvent: function (event) {
    const { target } = event;
    const win = target.documentGlobal || target.relevantGlobal || target.ownerDocument?.defaultView || window;
    // ... 处理逻辑
}
```

**完整示例：**

```javascript
// 修改前（Firefox 151 及更早版本）
function getBrowserWindow(node) {
    return node.ownerGlobal || window;
}

// 修改后（Firefox 152+）
function getBrowserWindow(node) {
    return node.documentGlobal || node.relevantGlobal || window;
}

// 实际使用示例
function handleContextMenu(event) {
    const { target } = event;
    const targetWin = target.documentGlobal || target.relevantGlobal || target.ownerDocument?.defaultView || window;
    const { gBrowser } = targetWin;
    
    if (!gBrowser) {
        console.warn("无法获取浏览器窗口");
        return;
    }
    
    // ... 继续处理
}
```

**注意事项：**
- ⚠️ `ownerGlobal` 已从 JS 绑定中移除，不再暴露给 Web 内容
- ✅ `documentGlobal` 是推荐的方法，语义更清晰
- ✅ `relevantGlobal` 是 `ownerGlobal` 的直接替代品，在少数特殊场景下使用
- ✅ 保持 `ownerDocument?.defaultView` 作为最后的 fallback
- ✅ 始终保持最后的 `|| window` 作为终极 fallback，确保代码健壮性
- 🔍 如遇到节点跨文档转移（`document.adoptNode`）的场景，必须使用 `documentGlobal`

## 2. `nsISound::Play` 被移除（Bug 2033673）

Firefox 152+ 移除了 `nsISound` 接口的 `play(nsIURL)` 方法，无法再通过 XPCOM 组件播放系统声音。

**问题表现：**
- 脚本中调用 `sound.play(uri)` 时报错 `sound.play is not a function`
- 下载完成提示音、通知音等声音播放功能失效

**解决方案：**

### 2.1 简单场景：使用 Web Audio API 替代

把

```javascript
var sound = Components.classes["@mozilla.org/sound;1"]
  .createInstance(Components.interfaces["nsISound"]);
sound.play(aUri);
```

替换为

```javascript
let audio = new Audio(aUri.spec);
audio.volume = 1.0;
let promise = audio.play();
if (promise && typeof promise.catch == "function") {
  promise.catch(error => {
    Cu.reportError(error);
  });
}
```

**说明：** 使用 HTML5 `Audio` 对象替代 `nsISound`，传入 URL 的 `.spec` 字符串即可播放。

### 2.2 完整场景：带资源清理的播放函数

```javascript
// 在对象中维护活跃的 audio 实例，避免内存泄漏
_activeAudio: new Set(),

play: function (aUri) {
  var sound = Components.classes["@mozilla.org/sound;1"]
    .createInstance(Components.interfaces["nsISound"]);

  // 兼容旧版本：如果 nsISound::Play 仍可用则继续使用
  if (typeof sound.play == "function") {
    sound.play(aUri);
    return;
  }

  // Firefox 152+：使用 HTML5 Audio 替代
  let audio = new Audio(aUri.spec);
  audio.volume = 1.0;
  let clear = () => {
    audio.removeEventListener("ended", clear);
    audio.removeEventListener("error", clear);
    this._activeAudio.delete(audio);
    audio = null;
  };
  audio.addEventListener("ended", clear, { once: true });
  audio.addEventListener("error", clear, { once: true });
  this._activeAudio.add(audio);
  let promise = audio.play();
  if (promise && typeof promise.catch == "function") {
    promise.catch(error => {
      clear();
      Cu.reportError(error);
    });
  }
},
```

**注意事项：**
- ⚠️ `nsISound::Play` 从 Firefox 152 起不再可用
- ✅ `Audio` 构造函数接受 URL 字符串，需使用 `aUri.spec` 获取
- ✅ `audio.play()` 返回 Promise，应处理可能的播放拒绝（如自动播放策略限制）
- ✅ 建议在播放结束或出错时清理引用，避免内存泄漏
- ✅ 可通过 `typeof sound.play == "function"` 检测兼容性，同时支持新旧版本

**参考：**
- [Bug 2033673 - remove nsISound::Play](https://bugzilla.mozilla.org/show_bug.cgi?id=2033673)
- [Firefox-downloadPlus.uc.js 适配 commit](https://github.com/benzBrake/Firefox-downloadPlus.uc.js/commit/d6e9c361bb5b8b528142e5bbfe6849224d597853)

## 相关资源

- [Bug 2033243 - Rename ownerGlobal to relevantGlobal](https://bugzilla.mozilla.org/show_bug.cgi?id=2033243)
- [Bug 2033242 - Rename ownerDocGlobal to documentGlobal](https://bugzilla.mozilla.org/show_bug.cgi?id=2033242)
- [Bug 2033673 - remove nsISound::Play](https://bugzilla.mozilla.org/show_bug.cgi?id=2033673)
- [Bug 1470017 - ownerGlobal behavior change with node adoption](https://bugzilla.mozilla.org/show_bug.cgi?id=1470017)
- [HTML Spec: Relevant global object](https://html.spec.whatwg.org/#relevant)
- [Mozilla.dev-platform discussion](https://groups.google.com/a/mozilla.org/g/dev-platform/c/LKU2-9Bkfc4/m/GC2LA10wBAAJ)
