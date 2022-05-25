// ==UserScript==
// @name            右键「新建标签按钮」访问剪切板内容
// @author          Ryan
// @include         main
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @shutdown        UC.rightClickOpenClipboard.unload();
// @compatibility   Firefox 70 +
// @update          2022-04-23 遵循默认引擎 非 xiaoxiaoflood 和环境也可以用了
// @update          2022-04-17 剪贴板为空时弹出原来的菜单
// @onlyonce
// ==/UserScript==
UC.rightClickOpenClipboard = {
    showOrigMenu: false,
    clickNewTab: function (e) {
        if (e.button === 2) {
            let url = readFromClipboard();
            if (!url) {
                if (this.showOrigMenu) {
                    goDoCommand("cmd_newNavigatorTab");
                } else {
                    BrowserOpenTab();
                }
            } else {
                try {
                    switchToTabHavingURI(url, true);
                } catch (ex) {
                    if (/((https?|ftp|gopher|telnet|file|notes|ms-help|chrome|resource):((\/\/)|(\\\\))+[\w\d:#@%\/;$()~_\+-=\\\.&]*)/.test(url)) {
                        gBrowser.loadOneTab(encodeURIComponent(url), {
                            inBackground: false,
                            relatedToCurrent: false,
                            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) //FF63
                        });
                    } else {
                        Services.search.getDefault().then(
                            engine => {
                                let submission = engine.getSubmission(url, null, 'search');
                                openLinkIn(submission.uri.spec, 'tab', {
                                    private: false,
                                    postData: submission.postData,
                                    inBackground: false,
                                    relatedToCurrent: true,
                                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                                });
                            }
                        );
                    }

                }
            }
            e.preventDefault();
            e.stopPropagation();
        }
    },
    init: function () {
        let btn1 = document.getElementById('tabs-newtab-button');
        if (btn1) {
            btn1.addEventListener("click", UC.rightClickOpenClipboard.clickNewTab, false);
        }
        let btn2 = document.getElementById('new-tab-button');
        if (btn2) {
            btn2.addEventListener("click", UC.rightClickOpenClipboard.clickNewTab, false);
        }
    },
    unload: function () {
        let btn1 = document.getElementById('tabs-newtab-button');
        if (btn1) {
            btn1.removeEventListener("click", UC.rightClickOpenClipboard.clickNewTab);
        }
        let btn2 = document.getElementById('new-tab-button');
        if (btn2) {
            btn2.removeEventListener("click", UC.rightClickOpenClipboard.clickNewTab);
        }
        delete UC.rightClickOpenClipboard;
    }
}
UC.rightClickOpenClipboard.init();