// ==UserScript==
// @name		restoreOldStyleCleanHistory.uc.js
// @author		ylcs006
// @onlyonce
// ==/UserScript==
location.href == 'chrome://browser/content/browser.xhtml' && setTimeout(() => {
        eval('Sanitizer.showUI = ' +
                Sanitizer.showUI.toString()
                        .replace('showUI', 'function')
                        .replace('parentWindow\?\.gDialogBox', 'false && $&')
        );
}, 1000);