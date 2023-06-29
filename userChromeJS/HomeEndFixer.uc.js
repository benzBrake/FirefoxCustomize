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
                    openInCurrent("javascript:(function()%7Bfunction%20scrollToBottomOnce()%20%7B%0A%20%20var%20previousScrollHeight%20%3D%200%3B%0A%0A%20%20function%20handleScroll()%20%7B%0A%20%20%20%20var%20scrollHeight%20%3D%20document.documentElement.scrollHeight%3B%0A%20%20%20%20var%20clientHeight%20%3D%20document.documentElement.clientHeight%3B%0A%20%20%20%20var%20scrollTop%20%3D%20document.documentElement.scrollTop%3B%0A%0A%20%20%20%20if%20(scrollHeight%20%3E%20previousScrollHeight%20%26%26%20scrollTop%20%2B%20clientHeight%20%3E%3D%20scrollHeight)%20%7B%0A%20%20%20%20%20%20%2F%2F%20%E9%A1%B5%E9%9D%A2%E9%AB%98%E5%BA%A6%E5%A2%9E%E5%8A%A0%EF%BC%8C%E5%B9%B6%E4%B8%94%E6%BB%9A%E5%8A%A8%E5%88%B0%E8%BE%BE%E5%BA%95%E9%83%A8%0A%20%20%20%20%20%20window.scrollTo(%7B%0A%20%20%20%20%20%20%20%20top%3A%20scrollHeight%2C%0A%20%20%20%20%20%20%20%20behavior%3A%20'smooth'%20%2F%2F%20%E4%BD%BF%E7%94%A8%E5%B9%B3%E6%BB%91%E6%BB%9A%E5%8A%A8%0A%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%2F%2F%20%E6%B3%A8%E9%94%80%E6%BB%9A%E5%8A%A8%E4%BA%8B%E4%BB%B6%E7%9B%91%E5%90%AC%0A%20%20%20%20%20%20window.removeEventListener('scroll'%2C%20handleScroll)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20previousScrollHeight%20%3D%20scrollHeight%3B%0A%20%20%7D%0A%0A%20%20%2F%2F%20%E7%9B%91%E5%90%AC%E7%AA%97%E5%8F%A3%E6%BB%9A%E5%8A%A8%E4%BA%8B%E4%BB%B6%0A%20%20window.addEventListener('scroll'%2C%20handleScroll)%3B%0A%0A%20%20%2F%2F%20%E5%88%9D%E5%A7%8B%E5%8C%96%E6%97%B6%E8%A7%A6%E5%8F%91%E4%B8%80%E6%AC%A1%E6%BB%9A%E5%8A%A8%E4%BA%8B%E4%BB%B6%E5%A4%84%E7%90%86%E5%87%BD%E6%95%B0%0A%20%20handleScroll()%3B%0A%7D%0A%0A%2F%2F%20%E8%B0%83%E7%94%A8%E5%87%BD%E6%95%B0%E6%9D%A5%E6%BB%9A%E5%8A%A8%E5%88%B0%E5%BA%95%E9%83%A8%0AscrollToBottomOnce()%3B%7D)()%3B");
                }
                break;
        }
    });
})()