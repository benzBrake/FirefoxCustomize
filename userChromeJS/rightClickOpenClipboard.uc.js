// ==UserScript==
// @name            rightClickOpenClipboard.uc.js
// @description     右键「新建标签按钮」访问剪切板内容  
// @author          Ryan
// @include         main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @shutdown        UC.rightClickOpenClipboard.unload();
// @compatibility   Firefox 70 +
// @onlyonce
// ==/UserScript==
UC.rightClickOpenClipboard = {
    clickNewTab: function(e) {
        if (e.button === 2) {
            let url = readFromClipboard();
            try {
                switchToTabHavingURI(url, true);
            } catch (ex) {
                if (url) {
                    url = 'https://www.baidu.com/s?wd='+ encodeURIComponent(url);;
                } else {
                    url = 'https://www.baidu.com/';
                }
                gBrowser.loadOneTab(url, {
                    inBackground: false,
                        relatedToCurrent: false,
                        triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) //FF63
                });
            }
            e.preventDefault();
            e.stopPropagation();
        }
    },
    init: function() {
        let btn1 = document.getElementById('tabs-newtab-button');
        if (btn1) {
            btn1.addEventListener("click", UC.rightClickOpenClipboard.clickNewTab, false);
        }
        let btn2 =  document.getElementById('new-tab-button');
        if (btn2) {
            btn2.addEventListener("click", UC.rightClickOpenClipboard.clickNewTab, false);
        }
    },
    unload: function() {
        let btn1 = document.getElementById('tabs-newtab-button');
        if (btn1) {
            btn1.removeEventListener("click", UC.rightClickOpenClipboard.clickNewTab);
        }
        let btn2 =  document.getElementById('new-tab-button');
        if (btn2) {
            btn2.removeEventListener("click", UC.rightClickOpenClipboard.clickNewTab);
        }
    }
}
UC.rightClickOpenClipboard.init();