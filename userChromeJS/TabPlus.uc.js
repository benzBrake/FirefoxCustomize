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
                    // 自动切换到鼠标指向标签页
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
        createMenuItems: function () {
            // 依赖 CopyCat 脚本
            let ins = document.getElementById('copycat-insert-point');
            if (!ins || !CopyCat?.createMenuItem) return;
            let cfg = [{
                label: "标签设置",
                image: "data:image/svg+xml;base64,77u/PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik05MDguOCAxMDA1LjQ0SDExNS4yYTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyLTEwMS43NlYxMTAuNzJBMTAxLjc2IDEwMS43NiAwIDAgMSAxMTUuMiA4Ljk2aDI5Ni45NmEzMi42NCAzMi42NCAwIDAgMSAzMiAzMlYyNjIuNGEzMiAzMiAwIDAgMS0zMiAzMiAzMiAzMiAwIDAgMS0zMi0zMnYtMTkySDExNS4yYTM3Ljc2IDM3Ljc2IDAgMCAwLTM3LjEyIDM3Ljc2djc5NS41MmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMiAzNy43Nmg3OTMuNmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMi0zNy43NlYyNjcuNTJhMzIgMzIgMCAwIDEgMzItMzIgMzIgMzIgMCAwIDEgMzIgMzJ2NjM2LjE2YTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyIDEwMS43NnoiPjwvcGF0aD48cGF0aCBkPSJNOTc3LjkyIDI5OS41MmEzMi42NCAzMi42NCAwIDAgMS0zMi0zMlYxODAuNDhhMzcuMTIgMzcuMTIgMCAwIDAtMzcuMTItMzcuNzZINDIxLjEyYTMyIDMyIDAgMCAxLTMyLTMyIDMyIDMyIDAgMCAxIDMyLTMyaDQ4Ny42OGExMDEuNzYgMTAxLjc2IDAgMCAxIDEwMS4xMiAxMDEuNzZ2ODcuMDRhMzIgMzIgMCAwIDEtMzIgMzJ6Ij48L3BhdGg+PHBhdGggZD0iTTk3Ny45MiAyOTkuNTJINjRhMzIgMzIgMCAwIDEtMzItMzIgMzIgMzIgMCAwIDEgMzItMzJoOTEzLjkyYTMyIDMyIDAgMCAxIDMyIDMyIDMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjxwYXRoIGQ9Ik02OTkuNTIgMjk5LjUyYTMyIDMyIDAgMCAxLTMyLTMyVjExMC43MmEzMiAzMiAwIDAgMSA2NCAwdjE1Ni44YTMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjwvc3ZnPg==",
                popup: [{
                    label: '新标签页打开',
                    image: "data:image/svg+xml;base64,77u/PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik05MDguOCAxMDA1LjQ0SDExNS4yYTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyLTEwMS43NlYxMTAuNzJBMTAxLjc2IDEwMS43NiAwIDAgMSAxMTUuMiA4Ljk2aDI5Ni45NmEzMi42NCAzMi42NCAwIDAgMSAzMiAzMlYyNjIuNGEzMiAzMiAwIDAgMS0zMiAzMiAzMiAzMiAwIDAgMS0zMi0zMnYtMTkySDExNS4yYTM3Ljc2IDM3Ljc2IDAgMCAwLTM3LjEyIDM3Ljc2djc5NS41MmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMiAzNy43Nmg3OTMuNmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMi0zNy43NlYyNjcuNTJhMzIgMzIgMCAwIDEgMzItMzIgMzIgMzIgMCAwIDEgMzIgMzJ2NjM2LjE2YTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyIDEwMS43NnoiPjwvcGF0aD48cGF0aCBkPSJNOTc3LjkyIDI5OS41MmEzMi42NCAzMi42NCAwIDAgMS0zMi0zMlYxODAuNDhhMzcuMTIgMzcuMTIgMCAwIDAtMzcuMTItMzcuNzZINDIxLjEyYTMyIDMyIDAgMCAxLTMyLTMyIDMyIDMyIDAgMCAxIDMyLTMyaDQ4Ny42OGExMDEuNzYgMTAxLjc2IDAgMCAxIDEwMS4xMiAxMDEuNzZ2ODcuMDRhMzIgMzIgMCAwIDEtMzIgMzJ6Ij48L3BhdGg+PHBhdGggZD0iTTk3Ny45MiAyOTkuNTJINjRhMzIgMzIgMCAwIDEtMzItMzIgMzIgMzIgMCAwIDEgMzItMzJoOTEzLjkyYTMyIDMyIDAgMCAxIDMyIDMyIDMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjxwYXRoIGQ9Ik02OTkuNTIgMjk5LjUyYTMyIDMyIDAgMCAxLTMyLTMyVjExMC43MmEzMiAzMiAwIDAgMSA2NCAwdjE1Ni44YTMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjwvc3ZnPg==",
                    popup: [{
                        label: '地址栏',
                        type: 'checkbox',
                        pref: 'browser.urlbar.openintab'
                    },
                    {
                        label: '搜索栏',
                        type: 'checkbox',
                        pref: 'browser.search.openintab'
                    },
                    {
                        label: '书签',
                        type: 'checkbox',
                        pref: 'browser.tabs.loadBookmarksInTabs'
                    }]
                },
                {
                    label: "后台打开",
                    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik0zNSAzOWMtMi43NTcgMC01LTIuMjQzLTUtNXMyLjI0My01IDUtNSA1IDIuMjQzIDUgNVMzNy43NTcgMzkgMzUgMzl6TTggMTVBMyAzIDAgMTA4IDIxIDMgMyAwIDEwOCAxNXpNMTQgMzdBMiAyIDAgMTAxNCA0MSAyIDIgMCAxMDE0IDM3ek0zMC4wMDEgMTRDMzAgMTQgMzAgMTQgMzAgMTRoLS4wMDJjLTIuMjA1LS4wMDEtMy45OTktMS43OTYtMy45OTgtNC4wMDEgMC0xLjA2OC40MTctMi4wNzMgMS4xNzItMi44MjhDMjcuOTI4IDYuNDE2IDI4LjkzMiA2IDI5Ljk5OSA2IDMwIDYgMzAgNiAzMCA2YzIuMjA3LjAwMSA0IDEuNzk2IDQgNC4wMDEgMCAxLjA2OC0uNDE3IDIuMDczLTEuMTcyIDIuODI4QzMyLjA3MiAxMy41ODQgMzEuMDY4IDE0IDMwLjAwMSAxNHpNMjQuNSAzOUExLjUgMS41IDAgMTAyNC41IDQyIDEuNSAxLjUgMCAxMDI0LjUgMzl6TTE3LjUgMTNjLTEuOTMgMC0zLjUtMS41Ny0zLjUtMy41UzE1LjU3IDYgMTcuNSA2IDIxIDcuNTcgMjEgOS41IDE5LjQzIDEzIDE3LjUgMTN6TTcuNSAzM2MxLjM4MSAwIDIuNS0xLjExOSAyLjUtMi41UzguODgxIDI4IDcuNSAyOGwwIDBDNi4xMTkgMjggNSAyOS4xMTkgNSAzMC41UzYuMTE5IDMzIDcuNSAzM3pNMzguNSAyNWMtMi40ODEgMC00LjUtMi4wMTktNC41LTQuNXMyLjAxOS00LjUgNC41LTQuNSA0LjUgMi4wMTkgNC41IDQuNVM0MC45ODEgMjUgMzguNSAyNXoiLz48L3N2Zz4=",
                    popup: [{
                        label: '打开图片',
                        type: 'checkbox',
                        default: 1,
                        pref: 'browser.tabs.loadImageInBackground'
                    }, {
                        label: '中键点击链接',
                        type: 'checkbox',
                        default: 1,
                        pref: 'browser.tabs.loadInBackground',
                    }]
                },
                {
                    label: "关闭标签页",
                    image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTYuMDA3ODEzIDYuMDAzOTA2QzQuMzU5Mzc1IDYuMDAzOTA2IDMuMDA3ODEzIDcuMzU5Mzc1IDMuMDA3ODEzIDkuMDAzOTA2TDMuMDA3ODEzIDE1TDMuMDExNzE5IDE1TDMuMDExNzE5IDQxQzMuMDExNzE5IDQyLjA5Mzc1IDMuOTE3OTY5IDQzIDUuMDExNzE5IDQzTDMwLjQ2NDg0NCA0M0MzMS43NDYwOTQgNDcuMDQ2ODc1IDM1LjU0Mjk2OSA1MCA0MCA1MEM0NS41IDUwIDUwIDQ1LjUgNTAgNDBDNTAgMzcuMjE4NzUgNDguODQ3NjU2IDM0LjY5OTIxOSA0NyAzMi44Nzg5MDZMNDcgMTVDNDcgMTMuOTA2MjUgNDYuMDkzNzUgMTMgNDUgMTNMNDEgMTNMNDEgOS4wMDM5MDZDNDEgNy4zNTkzNzUgMzkuNjQ0NTMxIDYuMDAzOTA2IDM4IDYuMDAzOTA2TDMwIDYuMDAzOTA2QzI5LjIzMDQ2OSA2LjAwMzkwNiAyOC41MzUxNTYgNi4zMDg1OTQgMjggNi43ODkwNjNDMjcuNDY0ODQ0IDYuMzA4NTk0IDI2Ljc2OTUzMSA2LjAwMzkwNiAyNiA2LjAwMzkwNkwxOCA2LjAwMzkwNkMxNy4yMzA0NjkgNi4wMDM5MDYgMTYuNTM1MTU2IDYuMzA4NTk0IDE2IDYuNzg5MDYzQzE1LjQ2NDg0NCA2LjMwODU5NCAxNC43Njk1MzEgNi4wMDM5MDYgMTQgNi4wMDM5MDYgWiBNIDYuMDA3ODEzIDguMDAzOTA2TDE0IDguMDAzOTA2QzE0LjU2NjQwNiA4LjAwMzkwNiAxNSA4LjQzNzUgMTUgOS4wMDM5MDZMMTUgMTVMNDUgMTVMNDUgMzEuMzU5Mzc1QzQzLjczNDM3NSAzMC42MjEwOTQgNDIuMzAwNzgxIDMwLjE1NjI1IDQwLjc2OTUzMSAzMC4wMzkwNjNDNDAuNTE1NjI1IDMwLjAxNTYyNSA0MC4yNjE3MTkgMzAgNDAgMzBDMzkuMzEyNSAzMCAzOC42NDA2MjUgMzAuMDcwMzEzIDM3Ljk5MjE4OCAzMC4yMDMxMjVDMzcuNjY3OTY5IDMwLjI2OTUzMSAzNy4zNDc2NTYgMzAuMzU1NDY5IDM3LjAzNTE1NiAzMC40NTMxMjVDMzMuOTAyMzQ0IDMxLjQyNTc4MSAzMS40MjU3ODEgMzMuOTAyMzQ0IDMwLjQ1MzEyNSAzNy4wMzUxNTZDMzAuMzU1NDY5IDM3LjM0NzY1NiAzMC4yNjk1MzEgMzcuNjY0MDYzIDMwLjIwMzEyNSAzNy45ODgyODFDMzAuMjAzMTI1IDM3Ljk4ODI4MSAzMC4yMDMxMjUgMzcuOTkyMTg4IDMwLjIwMzEyNSAzNy45OTIxODhDMzAuMDcwMzEzIDM4LjY0MDYyNSAzMCAzOS4zMTI1IDMwIDQwQzMwIDQwLjMzNTkzOCAzMC4wMTk1MzEgNDAuNjcxODc1IDMwLjA1MDc4MSA0MUw1LjAxMTcxOSA0MUw1LjAxMTcxOSAxM0w1LjAwNzgxMyAxM0w1LjAwNzgxMyA5LjAwMzkwNkM1LjAwNzgxMyA4LjQzNzUgNS40NDE0MDYgOC4wMDM5MDYgNi4wMDc4MTMgOC4wMDM5MDYgWiBNIDE4IDguMDAzOTA2TDI2IDguMDAzOTA2QzI2LjU2NjQwNiA4LjAwMzkwNiAyNyA4LjQzNzUgMjcgOS4wMDM5MDZMMjcgMTNMMTcgMTNMMTcgOS4wMDM5MDZDMTcgOC40Mzc1IDE3LjQzMzU5NCA4LjAwMzkwNiAxOCA4LjAwMzkwNiBaIE0gMzAgOC4wMDM5MDZMMzggOC4wMDM5MDZDMzguNTY2NDA2IDguMDAzOTA2IDM5IDguNDM3NSAzOSA5LjAwMzkwNkwzOSAxM0wyOSAxM0wyOSA5LjAwMzkwNkMyOSA4LjQzNzUgMjkuNDMzNTk0IDguMDAzOTA2IDMwIDguMDAzOTA2IFogTSA0MCAzMkM0MC4yNjk1MzEgMzIgNDAuNTM1MTU2IDMyLjAxNTYyNSA0MC43OTY4NzUgMzIuMDQyOTY5QzQwLjg0NzY1NiAzMi4wNDY4NzUgNDAuODk4NDM4IDMyLjA1NDY4OCA0MC45NTMxMjUgMzIuMDYyNUM0MS4xNjQwNjMgMzIuMDg5ODQ0IDQxLjM3NSAzMi4xMTcxODggNDEuNTc4MTI1IDMyLjE2MDE1NkM0MS42MzY3MTkgMzIuMTcxODc1IDQxLjY5MTQwNiAzMi4xODc1IDQxLjc0NjA5NCAzMi4xOTkyMTlDNDEuOTM3NSAzMi4yNDIxODggNDIuMTI1IDMyLjI4OTA2MyA0Mi4zMTI1IDMyLjM0Mzc1QzQyLjM5MDYyNSAzMi4zNzEwOTQgNDIuNDY4NzUgMzIuMzk4NDM4IDQyLjU0Njg3NSAzMi40MjU3ODFDNDIuNzEwOTM4IDMyLjQ4MDQ2OSA0Mi44NzEwOTQgMzIuNTM5MDYzIDQzLjAzMTI1IDMyLjYwNTQ2OUM0My4xMTMyODEgMzIuNjM2NzE5IDQzLjE5OTIxOSAzMi42NzU3ODEgNDMuMjgxMjUgMzIuNzE0ODQ0QzQzLjQyMTg3NSAzMi43NzczNDQgNDMuNTU4NTk0IDMyLjg0Mzc1IDQzLjY5NTMxMyAzMi45MTc5NjlDNDMuNzg1MTU2IDMyLjk2NDg0NCA0My44NzUgMzMuMDE1NjI1IDQzLjk2MDkzOCAzMy4wNjI1QzQ0LjA4OTg0NCAzMy4xNDA2MjUgNDQuMjE4NzUgMzMuMjE4NzUgNDQuMzQzNzUgMzMuMjk2ODc1QzQ0LjQzNzUgMzMuMzU5Mzc1IDQ0LjUyMzQzOCAzMy40MTc5NjkgNDQuNjEzMjgxIDMzLjQ4NDM3NUM0NC43MTg3NSAzMy41NTQ2ODggNDQuODIwMzEzIDMzLjYzMjgxMyA0NC45MjE4NzUgMzMuNzEwOTM4QzQ1LjAxOTUzMSAzMy43ODkwNjMgNDUuMTE3MTg4IDMzLjg2NzE4OCA0NS4yMTQ4NDQgMzMuOTUzMTI1QzQ2LjkxNDA2MyAzNS40MjE4NzUgNDggMzcuNTg5ODQ0IDQ4IDQwQzQ4IDQ0LjM5ODQzOCA0NC4zOTg0MzggNDggNDAgNDhDMzYuMTk5MjE5IDQ4IDMzIDQ1LjMxMjUgMzIuMTk5MjE5IDQxLjc0NjA5NEMzMi4xNDA2MjUgNDEuNDg4MjgxIDMyLjA5NzY1NiA0MS4yMzA0NjkgMzIuMDYyNSA0MC45Njg3NUMzMi4wNjI1IDQwLjk0MTQwNiAzMi4wNTQ2ODggNDAuOTE0MDYzIDMyLjA1MDc4MSA0MC44ODY3MTlDMzIuMDE5NTMxIDQwLjU5Mzc1IDMyIDQwLjI5Njg3NSAzMiA0MEMzMiAzOS43MjY1NjMgMzIuMDE1NjI1IDM5LjQ1MzEyNSAzMi4wNDI5NjkgMzkuMTg3NUMzMi4wNDI5NjkgMzkuMTgzNTk0IDMyLjAzOTA2MyAzOS4xNzk2ODggMzIuMDQyOTY5IDM5LjE3OTY4OEMzMi40MjU3ODEgMzUuNDI5Njg4IDM1LjQyOTY4OCAzMi40MjU3ODEgMzkuMTc5Njg4IDMyLjA0Mjk2OUMzOS4xNzk2ODggMzIuMDM5MDYzIDM5LjE4MzU5NCAzMi4wNDI5NjkgMzkuMTg3NSAzMi4wNDI5NjlDMzkuNDUzMTI1IDMyLjAxMTcxOSAzOS43MjY1NjMgMzIgNDAgMzIgWiBNIDM2LjUgMzUuNUMzNi4yNSAzNS41IDM2IDM1LjYwMTU2MyAzNS44MDA3ODEgMzUuODAwNzgxQzM1LjQwMjM0NCAzNi4xOTkyMTkgMzUuNDAyMzQ0IDM2LjgwMDc4MSAzNS44MDA3ODEgMzcuMTk5MjE5TDM4LjU5NzY1NiA0MEwzNS44MDA3ODEgNDIuODAwNzgxQzM1LjQwMjM0NCA0My4xOTkyMTkgMzUuNDAyMzQ0IDQzLjgwMDc4MSAzNS44MDA3ODEgNDQuMTk5MjE5QzM2IDQ0LjM5ODQzOCAzNi4zMDA3ODEgNDQuNSAzNi41IDQ0LjVDMzYuNjk5MjE5IDQ0LjUgMzcgNDQuMzk4NDM4IDM3LjE5OTIxOSA0NC4xOTkyMTlMNDAgNDEuNDAyMzQ0TDQyLjgwMDc4MSA0NC4xOTkyMTlDNDMgNDQuMzk4NDM4IDQzLjMwMDc4MSA0NC41IDQzLjUgNDQuNUM0My42OTkyMTkgNDQuNSA0NCA0NC4zOTg0MzggNDQuMTk5MjE5IDQ0LjE5OTIxOUM0NC41OTc2NTYgNDMuODAwNzgxIDQ0LjU5NzY1NiA0My4xOTkyMTkgNDQuMTk5MjE5IDQyLjgwMDc4MUw0MS40MDIzNDQgNDBMNDQuMTk5MjE5IDM3LjE5OTIxOUM0NC41OTc2NTYgMzYuODAwNzgxIDQ0LjU5NzY1NiAzNi4xOTkyMTkgNDQuMTk5MjE5IDM1LjgwMDc4MUM0My44MDA3ODEgMzUuNDAyMzQ0IDQzLjE5OTIxOSAzNS40MDIzNDQgNDIuODAwNzgxIDM1LjgwMDc4MUw0MCAzOC41OTc2NTZMMzcuMTk5MjE5IDM1LjgwMDc4MUMzNyAzNS42MDE1NjMgMzYuNzUgMzUuNSAzNi41IDM1LjVaIiAvPg0KPC9zdmc+",
                    popup: [{
                        label: '左键双击',
                        type: 'checkbox',
                        pref: 'browser.tabs.closeTabByDblclick'
                    },
                    {
                        label: '右键',
                        type: 'checkbox',
                        pref: 'browser.tabs.closeTabByRightClick'
                    }
                    ]
                },
                {
                    label: '在当前标签右侧打开新标签页',
                    type: 'checkbox',
                    default: 0,
                    pref: 'browser.tabs.insertAfterCurrent'
                },
                {
                    label: '关闭最后一个标签页后关闭窗口',
                    type: 'checkbox',
                    default: 1,
                    pref: 'browser.tabs.closeWindowWithLastTab'
                },
                {
                    label: '自动选中鼠标指向标签页',
                    type: 'checkbox',
                    pref: 'browser.tabs.swithOnHover'
                },
                {
                    label: '滚轮切换标签页',
                    type: 'checkbox',
                    pref: 'browser.tabs.swithOnScroll'
                },
                {
                    label: '右键单击新建标签按钮打开剪贴板地址',
                    type: 'checkbox',
                    pref: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard'
                },
                {
                    label: '中键打开书签不关闭书签菜单',
                    type: 'checkbox',
                    pref: 'browser.bookmarks.openInTabClosesMenu',
                },
                {
                    label: '关闭标签页选中左侧标签页',
                    type: 'checkbox',
                    pref: 'browser.tabs.selectLeftTabOnClose'
                }
                ]
            }];
            this.menuitems = [];
            cfg.forEach(item => {
                console.log(item);
                let menuitem = CopyCat.createMenu(item, document);
                ins.parentNode.insertBefore(menuitem, ins);
                this.menuitems.push(menuitem);
            });

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
            this.createMenuItems();
        },
        unload: function () {
            Object.keys(this.lsnList).forEach((pref) => {
                this.removeObs(pref);
            })
            if (this.menuitems && this.menuitems.length) {
                this.menuitems.forEach(menuitem => {
                    menuitem.parentNode.removeChild(menuitem);
                });
            }
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