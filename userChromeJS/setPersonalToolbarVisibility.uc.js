// ==UserScript==
// @name            指定页面显示书签工具栏
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    const URLS = [
        'about:newtab',
        'about:blank',
        'about:privatebrowsing',
        'about:home'
    ]
    setTimeout(function () {
        let event = (event) => {
            const win = event.target.ownerGlobal;
            win.console.log(event.type);
            const bar = win.document.getElementById("PersonalToolbar");
            win.setToolbarVisibility(bar, URLS.contain(win.gBrowser.currentURI.spec));
        }
        setToolbarVisibility(document.getElementById("PersonalToolbar"), URLS.contain(gBrowser.currentURI.spec));
        gBrowser.tabContainer.addEventListener('TabSelect', event);
    }, 2000);
})();