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
    function openInCurrent(url) {
        openTrustedLinkIn(url, 'current', {
            allowPopups: true,
            inBackground: false,
            allowInheritPrincipal: true,
            private: PrivateBrowsingUtils.isWindowPrivate(window),
            userContextId: gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.getAttribute("userContextId")
        });
    }
    window.addEventListener('keypress', function (event) {
        if (event.shiftKey || event.ctrlKey) return;
        switch (event.key) {
            case 'Home':
                if (content) {
                    goDoCommand('cmd_scrollPageUp')
                } else {
                    openInCurrent("javascript:(function()%7Bwindow.scrollTo(%7B%0A%20%20%20%20top%3A%200%2C%0A%20%20%20%20behavior%3A%20'smooth'%0A%7D)%3B%7D)()%3B");
                }
                break;
            case 'End':
                if (content) {
                    goDoCommand('cmd_scrollPageDown')
                } else {
                    openInCurrent("javascript:(function()%7Bwindow.scrollTo(%7B%0A%20%20%20%20top%3A%20document.documentElement.scrollHeight%2C%0A%20%20%20%20behavior%3A%20'smooth'%20%2F%2F%20%E4%BD%BF%E7%94%A8%E5%B9%B3%E6%BB%91%E6%BB%9A%E5%8A%A8%0A%20%20%7D)%3B%7D)()%3B");
                }
                break;
        }
    });
})()