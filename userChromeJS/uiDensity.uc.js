// ==UserScript==
// @name           UI Density
// @version        1.0
// @author         Ryan
// @include        *
// @compatibility  Firefox 78
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    非浏览器主窗口增加 udensity 属性
// ==/UserScript==

!location.href.startsWith('chrome://browser/content/browser.x') && (function () {
    Components.utils.import("resource://gre/modules/Services.jsm");
    let win = Services.wm.getMostRecentWindow("navigator:browser");
    let uidensity = win.document.documentElement.getAttribute("uidensity");
    document.documentElement.setAttribute("uidensity", uidensity);
})();
