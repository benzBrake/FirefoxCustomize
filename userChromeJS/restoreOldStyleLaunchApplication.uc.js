// ==UserScript==
// @name            restoreOldStyleLaunchApplication.uc.js
// @author          ylcs006
// @include         main
// @homepage        https://bbs.kafan.cn/forum.php?mod=redirect&goto=findpost&ptid=2231355&pid=50729688&fromuid=1278361
// ==/UserScript==
location.href == 'chrome://browser/content/browser.xhtml' && setTimeout(() => {
        const { nsContentDispatchChooser } = ChromeUtils.import(
                'resource://gre/modules/ContentDispatchChooser.jsm'
        );

        eval('nsContentDispatchChooser.prototype._openDialog = ' +
                nsContentDispatchChooser.prototype._openDialog.toString()
                        .replace('_openDialog', 'function')
                        .replace('DIALOG_URL_APP_CHOOSER', '"chrome://mozapps/content/handling/appChooser.xhtml"')
                        .replace('if (aBrowsingContext)', 'if (0)')
        );
}, 1000);