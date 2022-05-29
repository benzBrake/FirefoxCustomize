// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @license         MIT License
// @startup         window.TabPlus.init();
// @shutdown        window.TabPlus.unload();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {

    if (typeof _uc === "undefined") alert('仅支持 xiaoxiaoflood 的 UC 环境');
    if (typeof xPref === "undefined") alert('需要安装 xPref 组件');

    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

    if (window.TabPlus) {
        window.TabPlus.unload();
        delete window.TabPlus;
    }

    const OPTIONS = {
        autoSwitchTabDelay: 150
    }

    window.TabPlus = {
        funcList: {
            'browser.tabs.closeTabByDblclick': {
                el: gBrowser.tabContainer,
                event: 'dblclick',
                callback: function (event) {
                    // 双击标签页关闭标签页
                    if (event.button == 0 && !event.ctrlKey) {
                        const tab = event.target.closest('.tabbrowser-tab');
                        if (!tab) return;
                        gBrowser.removeTab(tab);
                        gBrowser.removeTab(tab, { animate: true });
                    }
                }
            },
            'browser.tabs.swithOnHover': {
                el: gBrowser.tabContainer,
                event: 'mouseover',
                callback: function (event) {
                    // 自动切换到鼠标移动到的标签页
                    if (!window.TabPlus && !xPref.get('browser.tabs.swithOnHover')) return;
                    const tab = event.target.closest('.tabbrowser-tab');
                    if (!tab) return;
                    timeout = setTimeout(() => gBrowser.selectedTab = tab, OPTIONS.autoSwitchTabDelay);
                }
            },
            'browser.tabs.closeTabByRightClick': {
                el: gBrowser.tabContainer,
                event: 'click',
                callback: function (event) {
                    // 右键关闭标签页
                    if (event.button == 2 && !event.shiftKey) {
                        const tab = event.target.closest('.tabbrowser-tab');
                        if (!tab) return;
                        gBrowser.removeTab(tab);
                        gBrowser.removeTab(tab, { animate: false });
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            },
            'browser.tabs.swithOnScroll': {
                el: gBrowser.tabContainer,
                event: 'wheel',
                callback: function (event) {
                    // 标签栏鼠标滚轮切换标签页
                    let dir = -1 * Math.sign(event.deltaY);
                    setTimeout(function () {
                        gBrowser.tabContainer.advanceSelectedTab(dir, true);
                    }, 0);
                }
            },
            'browser.tabs.loadImageInBackground': {
                trigger: false,
                el: document.getElementById('context-viewimage'),
                event: 'command',
                init: function () {
                    document.getElementById('context-viewimage').setAttribute('oncommand', null);
                },
                destroy: function () {
                    document.getElementById('context-viewimage').setAttribute('oncommand', 'gContextMenu.viewMedia(event);');
                },
                callback: function (e) {
                    // 在新标签页前台查看图片
                    e.preventDefault();
                    let where = whereToOpenLink(e, false, false);
                    if (where == "current") {
                        where = "tab";
                    }
                    let referrerInfo = gContextMenu.contentData.referrerInfo;
                    let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
                    if (gContextMenu.onCanvas) {
                        gContextMenu._canvasToBlobURL(gContextMenu.targetIdentifier).then(function (blobURL) {
                            openLinkIn(blobURL, where, {
                                referrerInfo,
                                triggeringPrincipal: systemPrincipal,
                                inBackground: e.button !== 0
                            });
                        }, Cu.reportError);
                    } else {
                        urlSecurityCheck(
                            gContextMenu.mediaURL,
                            gContextMenu.principal,
                            Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT
                        );

                        // Default to opening in a new tab.
                        openLinkIn(gContextMenu.mediaURL, where, {
                            referrerInfo,
                            forceAllowDataURI: true,
                            triggeringPrincipal: gContextMenu.principal,
                            csp: gContextMenu.csp,
                            inBackground: e.button !== 0
                        });
                    }
                }
            },
            'browser.tabs.selectLeftTabOnClose': {
                el: gBrowser.tabContainer,
                event: "TabClose",
                callback: function (event) {
                    // 关闭标签页后选择左侧标签
                    var tab = event.target;
                    gBrowser.selectedTab = tab;
                    if (gBrowser.selectedTab._tPos != 0) {
                        gBrowser.tabContainer.advanceSelectedTab(-1, true);
                    }
                }
            },
            'browser.tabs.newTabBtn.rightClickLoadFromClipboard': {
                el: gBrowser.tabContainer,
                event: 'click',
                callback: function (e) {
                    if (e.target.id === 'tabs-newtab-button' && e.button === 2 && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        let win = e.target.ownerGlobal;
                        let url = win.readFromClipboard();
                        if (!url) {
                            win.BrowserOpenTab();
                        } else {
                            try {
                                switchToTabHavingURI(url, true);
                            } catch (ex) {
                                if (/((https?|ftp|gopher|telnet|file|notes|ms-help|chrome|resource):((\/\/)|(\\\\))+[\w\d:#@%\/;$()~_\+-=\\\.&]*)/.test(url)) {
                                    win.gBrowser.loadOneTab(encodeURIComponent(url), {
                                        inBackground: false,
                                        relatedToCurrent: false,
                                        triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) //FF63
                                    });
                                } else {
                                    Services.search.getDefault().then(
                                        engine => {
                                            let submission = engine.getSubmission(url, null, 'search');
                                            win.openLinkIn(submission.uri.spec, 'tab', {
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
                    }
                }
            },
            'browser.tabs.warnOnClose': {
                init: function () {
                    // 关闭窗口时需要确认 Thanks ylcs006 https://bbs.kafan.cn/thread-2235927-1-1.html
                    // 默认时两个或以上标签才提示，改成一个
                    const { BrowserGlue } = ChromeUtils.import('resource:///modules/BrowserGlue.jsm');
                    const gTabbrowserBundle = Services.strings.createBundle('chrome://browser/locale/tabbrowser.properties');
                    TabPlus.orgList['_onQuitRequest'] = BrowserGlue.prototype._onQuitRequest.toString();
                    eval('BrowserGlue.prototype._onQuitRequest = ' +
                        BrowserGlue.prototype._onQuitRequest.toString()
                            .replace('pagecount >= 2', 'pagecount >= 1')
                    );
                },
                destroy: function () {
                    eval('BrowserGlue.prototype._onQuitRequest = ' +
                        TabPlus.orgList['_onQuitRequest']);
                }
            }
        },
        lsnList: {},
        orgList: {},
        callback: (obj, pref) => {
            if (!!TabPlus.funcList[pref]) {
                let val = TabPlus.funcList[pref];
                let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                if (obj === trigger) {
                    if (typeof val.init === "function") val.init();
                    if (typeof TabPlus.funcList[pref].callback === "function") val.el.addEventListener(val.event, TabPlus.funcList[pref].callback, val.args || false);
                } else {
                    if (typeof TabPlus.funcList[pref].callback === "function") val.el.removeEventListener(val.event, TabPlus.funcList[pref].callback);
                    if (typeof val.destroy === "function") val.destroy();
                }
            }
        },
        removeObs: (pref) => {
            if (TabPlus.lsnList[pref]) {
                let { obs } = TabPlus.lsnList[pref],
                    val = TabPlus.funcList[pref];
                val.el.removeEventListener(val.event, TabPlus.funcList[pref].callback, val.arg || false);
                if (typeof val.destroy === "function") val.destroy();
                xPref.removeListener(obs);
            }
        },
        init: function () {
            Object.keys(this.funcList).forEach((pref) => {
                try {
                    let val = this.funcList[pref];
                    if (typeof val.callback === "function") {
                        let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                        if (trigger === xPref.get(pref, false, false)) {
                            if (typeof val.init === "function") val.init();
                            val.el.addEventListener(val.event, TabPlus.funcList[pref].callback, val.arg || false);
                        }

                        let obs = xPref.addListener(pref, this.callback);
                        this.lsnList[pref] = {
                            obs: obs
                        }
                    }
                } catch (e) { log(e); }
            });
        },
        unload: function () {
            Object.keys(this.lsnList).forEach((pref) => {
                this.removeObs(pref);
            })
            delete window.TabPlus;
        }
    }

    if (gBrowserInit.delayedStartupFinished) window.TabPlus.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.TabPlus.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

    function log(e) {
        Cu.reportError(e);
    }


})();