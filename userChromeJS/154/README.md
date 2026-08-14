# 适用于 Firefox 154 + 以及更高版本的脚本

如果你的脚本在 Firefox 154 版本失效，下面可能帮到你。

## 1. JSWindowActor 必须明确允许在 web/file 进程中运行（Bug 2041784、Bug 2047680）

Firefox 154 启用了 `dom.jsipc.check_safeForUntrustedWebProcess`。注册 `JSWindowActor` 或 `JSProcessActor` 时，`safeForUntrustedWebProcess` 默认是 `false`；未显式声明安全的 Actor 不会被加载到 `web` 或 `file` 内容进程。

这是安全加固：可进入网页内容进程的 Actor 可能成为沙箱逃逸的攻击面，必须由实现者审查消息边界后主动选择加入。

**问题表现：**

- 在普通网页或 `file:` 页面调用 `windowGlobalChild.getActor()` 抛出 `NotSupportedError`
- 已注册的 Actor 在 `about:` 特权页面正常，但网页中的事件、选区或消息功能失效
- `matches` 中包含 `*://*/*` 或 `file:///*` 并不能替代安全声明

**解决方案：**

注册 Actor 时，在顶层选项中加入 `safeForUntrustedWebProcess: true`：

```javascript
ChromeUtils.registerWindowActor("ExampleActor", {
  parent: {
    esModuleURI: "chrome://userchrome/content/ExampleActor.sys.mjs",
  },
  child: {
    esModuleURI: "chrome://userchrome/content/ExampleActor.sys.mjs",
  },
  matches: ["*://*/*", "file:///*"],
  allFrames: true,
  safeForUntrustedWebProcess: true,
});
```

使用支持 Actor 元数据的 userChrome.js Loader 时，添加对应元数据：

```javascript
// @actor ExampleActor
// @actor:allframes true
// @actor:safeForUntrustedWebProcess true
```

**注意事项：**

- 只在 Actor 确实需要处理网页或本地文件内容时设置为 `true`；仅服务于浏览器特权页面的 Actor 应保持默认值。
- 将内容进程消息视为不可信输入：校验消息名称、类型、长度和允许值，不能让网页传入的字符串直接驱动 chrome 权限代码执行。
- 导航和进程销毁期间可能收到延迟消息；父进程应确认请求仍存在、目标窗口仍有效，再处理返回数据。
- 本仓库的 `addMenuPlus`、`LinkGopher`、`UserCSSLoader` 和 Loader 版 `AutoCopySelectionText` 已完成此项适配。旧式 `AutoCopySelectionText.uc.js` 与 `KeyChanger_fx70.uc.js` 若仍单独安装，需要按上面的注册方式补充声明。

## 相关资源

- [Bug 2041784 - Add support for safeForUntrustedWebProcess JS actor property](https://bugzilla.mozilla.org/show_bug.cgi?id=2041784)
- [Bug 2047680 - Enable dom.jsipc.check_safeForUntrustedWebProcess](https://bugzilla.mozilla.org/show_bug.cgi?id=2047680)
- [Firefox 154 source commit - add JS actor safety property](https://github.com/mozilla-firefox/firefox/commit/84fc31638ea66be2df092c9125629908eba6c5cd)
- [Firefox 154 source commit - enable JS actor safety check](https://github.com/mozilla-firefox/firefox/commit/cfcedb5eb52390d2c8e4a89c953e8a41955179bd)
