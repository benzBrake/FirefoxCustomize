// ==UserScript==
// @name           UI Density
// @version        1.0
// @author         Ryan
// @include        *
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    非浏览器主窗口增加 udensity 属性
// ==/UserScript==

!location.href.startsWith('chrome://browser/content/browser.x') && (function () {
    Components.utils.import("resource://gre/modules/Services.jsm");

    const { setTimeout } = window;

    function setUiDensity() {
        const UIDENSITY = ['', 'compact', 'touch']
        let uidensity = 0;
        try {
            uidensity = Services.prefs.getIntPref("browser.uidensity");
        } catch (e) {
            uidensity = 0;
        }
        document.documentElement.setAttribute("uidensity", UIDENSITY[uidensity] || "");
    }

    function init() {
        Services.prefs.addObserver("browser.uidensity", function () {
            setUiDensity();
        });
        setTimeout(setUiDensity, 300);
    }

})();
