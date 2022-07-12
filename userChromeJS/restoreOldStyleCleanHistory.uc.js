// ==UserScript==
// @name                restoreOldStyleCleanHistory.uc.js
// @description         还原清除历史记录为旧版对话
// @author              ylcs006         
// @compatibility       Firefox 98
// @onlyonce
// ==/UserScript==
location.href == 'chrome://browser/content/browser.xhtml' && setTimeout(() => {
        eval('Sanitizer.showUI = ' +
                Sanitizer.showUI.toString()
                        .replace('showUI', 'function')
                        .replace('parentWindow\?\.gDialogBox', 'false && $&')
        );
}, 1000);