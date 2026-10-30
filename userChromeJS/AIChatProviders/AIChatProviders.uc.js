// ==UserScript==
// @name           AIChatProviders.uc.js
// @description    扩展 Firefox 原生 AI 侧栏和提问菜单，支持 Kimi
// @author         Ryan
// @include        main
// @compatibility  Firefox 153
// @version        0.1.0
// @license        MIT License
// @charset        UTF-8
// @shutdown       window.AIChatProviders?.destroy();
// @note           2026-10-31 添加 Kimi 提供商、原生提问入口 hook 与跨进程草稿填入
// @note           2026-10-31 重命名为 AIChatProviders，统一模块与 actor 标识
// ==/UserScript==

/* 安装：本文件和 AIChatProviders.sys.mjs 一起放入 userChromeJS 目录。
 * 在原生 AI 侧栏的提供商下拉框选择 Kimi，再从右键菜单或选中文字浮层提问。
 * 提示词填入后手动发送；已有草稿时不覆盖。不会自动切换当前提供商。
 * Firefox 私有 GenAI API 可能变化，目前仅在 153.6.0 验证。
 */
(() => {
    "use strict";
    if (location.href !== "chrome://browser/content/browser.xhtml") return;
    window.AIChatProviders?.destroy();
    const { AIChatProviders } = ChromeUtils.importESModule(
        "chrome://userchromejs/content/userChromeJS/AIChatProviders.sys.mjs?v=0.1.0"
    );
    let stopped = false;
    const observer = (subject) => {
        if (subject !== window) return;
        Services.obs.removeObserver(observer, "browser-delayed-startup-finished");
        if (!stopped) AIChatProviders.attach(window);
    };
    const destroy = () => {
        if (stopped) return;
        stopped = true;
        try { Services.obs.removeObserver(observer, "browser-delayed-startup-finished"); } catch {}
        window.removeEventListener("unload", destroy);
        AIChatProviders.detach(window);
        delete window.AIChatProviders;
    };
    window.AIChatProviders = { destroy };
    window.addEventListener("unload", destroy, { once: true });
    if (window.gBrowserInit?.delayedStartupFinished) AIChatProviders.attach(window);
    else Services.obs.addObserver(observer, "browser-delayed-startup-finished");
})();
