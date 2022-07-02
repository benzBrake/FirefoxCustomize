// ==UserScript==
// @name            showPersonalToolbarOnDemand.uc.js
// @description     按需显示书签工具栏
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            需要把书签工具栏模式设置为在新标签页显示
// ==/UserScript==
(function () {
    const URLS = [
        'about:newtab',
        'about:blank',
        'about:privatebrowsing',
        'about:home'
    ];
    setTimeout(function () {
        let event = (event) => {
            const win = event.target.ownerGlobal;
            const bar = win.document.getElementById("PersonalToolbar");
            win.setToolbarVisibility(bar, URLS.contain(win.gBrowser.currentURI.spec));
        }
        setToolbarVisibility(document.getElementById("PersonalToolbar"), URLS.contain(gBrowser.currentURI.spec));
        gBrowser.tabContainer.addEventListener('TabSelect', event);
        gBrowser.tabContainer.addEventListener('TabAttrModified', event);
    }, 2000);
})();