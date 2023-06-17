// ==UserScript==
// @name            HomeEndFixer.uc.js
// @description     让 Home / End 按键全局生效（部分全局鼠标手势软胶通过模拟点击 Home / End 实现回到顶部，前往底部，但是默认情况下焦点在输入框内内不生效会导致鼠标手势失效，而这个脚本可以让这两个按键全局生效）
// @license         MIT License
// @compatibility   Firefox 57
// @version         0.0.1
// @charset         UTF-8
// @include         chrome://browser/content/browser.xul
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    const openInCurrent = (url) => {
        let uri;
        try {
            uri = Services.io.newURI(url, null, null);
        } catch (e) {
            console.log("URL 有问题: %s".replace("%s", url));
            return;
        }
        try {
            gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
        } catch (e) {
            gBrowser.loadURI(uri, { triggeringPrincipal: gBrowser.contentPrincipal });
        }
    }
    window.addEventListener('keypress', function (event) {
        switch (event.key) {
            case 'Home':
                if (content) {
                    goDoCommand('cmd_scrollPageUp')
                } else {
                    openInCurrent('javascript:(function()%7Bwindow.document.firstElementChild.scrollIntoView(%7B%20behavior%3A%20%22smooth%22%7D)%7D)()%3B');
                }
                break;
            case 'End':
                if (content) {
                    goDoCommand('cmd_scrollPageDown')
                } else {
                    openInCurrent('javascript:(function()%7Bwindow.document.lastElementChild.scrollIntoView(%7B%20block%3A%20%22end%22%2C%20behavior%3A%20%22smooth%22%7D)%7D)()%3B');
                }
                break;
        }
    });
})()