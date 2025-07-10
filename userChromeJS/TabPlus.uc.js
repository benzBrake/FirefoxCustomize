// ==UserScript==
// @name            TabPlus.uc.js
// @long-description
// @description
/* 自定义 Firefox 标签页的打开和关闭行为。通过 about:config 配置选项（修改后需重启浏览器）。
选项说明：
    - browser.urlbar.openintab (布尔值): 地址栏输入的 URL 在新标签页打开
    - browser.search.openintab (布尔值): 搜索栏查询在新标签页打开
    - browser.tabs.loadBookmarksInTabs (布尔值): 书签在新标签页打开
    - browser.tabs.loadHistoryInTabs (布尔值): 历史记录在新标签页打开
    - browser.tabs.closeTabByDblclick (布尔值): 双击左键关闭标签页
    - browser.tabs.closeTabByRightClick (布尔值): 右键单击关闭标签页
    - browser.tabs.loadInBackground (布尔值): 中键点击链接在后台加载
    - browser.tabs.loadImageInBackground (布尔值): 图片链接在后台加载
    - browser.tabs.mouseOverDelayMS (整数): 标签页悬停切换的延迟（毫秒）, 0 表示关闭该功能
    - browser.tabs.insertAfterCurrent (布尔值): 新标签页在当前标签右侧打开
    - browser.tabs.closeWindowWithLastTab (布尔值): 关闭最后一个标签页时关闭窗口
    - browser.bookmarks.openInTabClosesMenu (布尔值): 中键点击书签后保持书签菜单打开
    - browser.tabs.newTabBtn.rightClickLoadFromClipboard (布尔值): 右键新标签按钮打开剪贴板 URL
    - toolkit.tabbox.switchByScrolling (布尔值): 使用鼠标滚轮切换标签页
    - browser.tabs.selectLeftTabOnClose (布尔值): 关闭当前标签后选中左侧标签
    - nglayout.enable_drag_images (布尔值): 拖拽标签时显示缩略图 */
// @version         1.0.8
// @license         MIT License
// @async
// @compatibility   Firefox 136
// @charset         UTF-8
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            1.0.8 重写，去除内嵌菜单，不再使用模块化，大幅度减少代码量，不再支持 destroy 方法，不再兼容 Tab Mix Plus 扩展
// @note            1.0.7 适配新版 userChrome.js @async 注解，去除无用 CSS 加载代码
// @note            1.0.6 修正菜单样式问题
// @note            1.0.5 移除 BuildPanel 支持
// @note            1.0.4 修复右键新标签页按钮兼容 data:image 链接的 bug
// @note            1.0.3 兼容 TST 扩展 Switch Tab On Hover，依赖扩展 TST Hoverswitch
// ==/UserScript==
(async function () {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    window.TabPlus = {
        _closeTimer: null,
        _diableMouseOver: false,
        _lastMouseX: 0, // 用于记录关闭标签时的鼠标X坐标
        _moveThreshold: 100, // 移动恢复的距离阈值（会动态设为标签宽度）

        init: function () {
            this.initWhereToOpenLinkMod();
            const tabContainer = gBrowser.tabContainer;
            tabContainer.addEventListener('mouseover', this, false);
            tabContainer.addEventListener('mouseleave', this, false);
            tabContainer.addEventListener('dblclick', (event) => this.handleEvent(event, 'closetab'), false);
            tabContainer.addEventListener('click', (event) => {
                this.handleEvent(event, 'clipboard');
                this.handleEvent(event, 'closetab');
            }, false);
        },

        initWhereToOpenLinkMod: function () {
            const bu = BrowserUtils, { whereToOpenLink: w } = bu;
            if (!bu.o_whereToOpenLink) {
                const trees = ["places", "historySidebar"];
                const sel = "#historyMenuPopup,#PanelUI-history";
                bu.o_whereToOpenLink = bu.whereToOpenLink;
                bu.whereToOpenLink = function (e) {
                    let res = w.apply(BrowserUtils, arguments);
                    if (e?.target?.id === "context-viewimage") {
                        return Services.prefs.getBoolPref("browser.tabs.loadImageInBackground", false) ? "tab" : res;
                    }
                    if (!Services.prefs.getBoolPref("browser.tabs.loadHistoryInTabs", false)) {
                        return res;
                    }
                    if (res != "current" || !Event.isInstance(e)) return res;
                    try {
                        var skip = true, trg = e.composedTarget, win = trg.ownerGlobal;
                        var name = win.document.documentURIObject
                            .QueryInterface(Ci.nsIURL).fileName.slice(0, -6);
                        if (name == "browser") {
                            skip = win.gBrowser.selectedTab.isEmpty || !trg.closest(sel);
                        } else if (trees.includes(name)) {
                            skip = (win.opener || win.windowRoot.ownerGlobal).gBrowser.selectedTab.isEmpty
                                || trg.closest("tree").selectedNode.itemId != -1;
                        }
                        return skip ? res : "tab";
                    }
                    catch { return res; }
                }
            }
        },

        /**
         * 暂时禁用悬停切换功能
         * @param {MouseEvent} event - 触发的事件对象
         * @param {XULElement} tab - 被关闭的标签页元素
         */
        _disableMouseOverTemporarily: function (event, tab) {
            this.resumeMouseOver();
            this._diableMouseOver = true;
            this._lastMouseX = event.screenX;
            this._moveThreshold = tab.clientWidth;

            this._closeTimer = setTimeout(() => {
                this.resumeMouseOver();
            }, 2000);
        },

        /**
         * 恢复悬停切换功能
         */
        resumeMouseOver: function () {
            if (this._closeTimer) {
                clearTimeout(this._closeTimer);
                this._closeTimer = null;
            }
            this._diableMouseOver = false;
            this._lastMouseX = 0;
        },

        handleEvent: function (event, trigger) {
            const { target: t, button: b } = event;
            const { gBrowser, Services } = t.ownerGlobal;
            const { prefs } = Services;
            const tab = t.closest('.tabbrowser-tab');
            let dblclick = false;

            switch (event.type) {
                case 'dblclick':
                    dblclick = true;
                case 'click':
                    switch (trigger) {
                        case 'clipboard':
                            if (!prefs.getBoolPref("browser.tabs.newTabBtn.rightClickLoadFromClipboard", false)) return;
                            if (t.matches('#new-tab-button, #newPrivateTab-button, #tabs-newtab-button') && b == 2) {
                                this._clipboardCommand(event);
                            }
                            break;
                        case 'closetab':
                            if (!tab) return;
                            if ((prefs.getBoolPref("browser.tabs.closeTabByDblclick", false) && b === 0 && dblclick)
                                || (prefs.getBoolPref("browser.tabs.closeTabByRightClick", false) && b === 2)) {
                                event.preventDefault();
                                event.stopPropagation();
                                // 在移除标签之前调用禁用函数，因为移除后 tab 对象可能无效
                                this._disableMouseOverTemporarily(event, tab);
                                gBrowser.removeTab(tab, { animate: true });
                            }
                            break;
                    }
                    break;

                case 'mouseover':
                    if (this._diableMouseOver) {
                        const distance = Math.abs(event.screenX - this._lastMouseX);
                        if (distance > this._moveThreshold) {
                            this.resumeMouseOver();
                        } else {
                            return;
                        }
                    }

                    if (!prefs.getIntPref("browser.tabs.mouseOverDelayMS", 150)) return;
                    if (!tab) return;
                    if (!tab.getAttribute("selected") && !event.shiftKey && !event.ctrlKey) {
                        this._onTabHover(tab);
                    }
                    break;
                case 'mouseleave':
                    this.resumeMouseOver();
                    break;
            }
        },

        _clipboardCommand: function (e) {
            const { target } = e;
            const { ownerGlobal: win } = target;
            let url = (win.readFromClipboard() || "").trim();
            if (!url) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            let where = !(e.ctrlKey || Services.prefs.getBoolPref("browser.urlbar.openintab", false)) ? 'current' : (e.shiftKey ? 'tabshifted' : 'tab');
            if (isDataURLBase64(url) || /^((https?|ftp|gopher|telnet|file|notes|ms-help|chrome|resource):((\/\/)|(\\\\))+[\w\d:#@%\/;$()~_\+-=\\\.&]*)/.test(url)) {
                try {
                    switchToTabHavingURI(url, true);
                } catch (e) {
                    openUILinkIn(url, where, {
                        triggeringPrincipal: (where === 'current' ? gBrowser.selectedBrowser.contentPrincipal : (
                            /^(f|ht)tps?:/.test(url) ?
                                Services.scriptSecurityManager.createNullPrincipal({}) :
                                Services.scriptSecurityManager.getSystemPrincipal()
                        ))
                    });
                }
            } else {
                Services.search.getDefault().then(engine => {
                    let submission = engine.getSubmission(url, null, 'search');
                    let aAllowThirdPartyFixup = {
                        private: false,
                        referrerInfo: submission.referrerInfo,
                        postData: submission.postData,
                        inBackground: e.shiftKey,
                        triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                    }
                    openTrustedLinkIn(submission.uri.spec, 'tab', aAllowThirdPartyFixup);
                });
            }
        },

        _onTabHover (tab, wait) {
            tab.addEventListener("mouseleave", function () {
                clearTimeout(wait);
            }, { once: true });
            wait = setTimeout(function () {
                if (tab.id === "firefox-view-button") {
                    tab.click();
                } else {
                    gBrowser.selectedTab = tab;
                }
            }, Services.prefs.getIntPref('browser.tabs.mouseOverDelayMS', 150));
        },
    }
    window.TabPlus.init();

    function isDataURLBase64 (url) {
        if (typeof url !== 'string') {
            return false;
        }
        if (!url.startsWith('data:')) {
            return false;
        }
        const dataPart = url.slice(5);
        if (!dataPart.includes('base64,')) {
            return false;
        }
        const base64Data = dataPart.split('base64,')[1];
        return isValidBase64(base64Data);
    }

    function isValidBase64 (base64String) {
        try {
            atob(base64String);
            return true;
        } catch (e) {
            return false;
        }
    }
})();