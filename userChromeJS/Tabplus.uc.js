// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @license         MIT License
// @startup         window.TabPlus.init();
// @shutdown        window.TabPlus.unload();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
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
            'browser.places.loadInTab': {
                init: function () {
                    TabPlus.orgList['openNodeWithEvent'] = PlacesUIUtils.openNodeWithEvent.toString();
                    PlacesUIUtils['openNodeWithEvent'] = PlacesUIUtils.openNodeWithEvent.toString()
                        .replace(' && PlacesUtils.nodeIsBookmark(aNode);', 'console.log(aEvent);');
                },
                destroy: function () {
                    eval('PlacesUIUtils.openNodeWithEvent = ' + PlacesUIUtils.openNodeWithEvent.toString());
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
                val.el.removeEventListener(val.event, TabPlus.funcList[pref].callback);
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