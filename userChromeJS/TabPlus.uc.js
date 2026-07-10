// ==UserScript==
// @name            TabPlus.uc.js
// @long-description
// @description
/* 自定义 Firefox 标签页的打开和关闭行为。通过 about:config 配置选项（修改后需重启浏览器）。
选项说明：
    - browser.urlbar.openintab (布尔值): 地址栏输入的 URL 在新标签页打开
    - browser.search.openintab (布尔值): 搜索栏查询在新标签页打开
    - browser.tabs.openNewTabInContainer (布尔值): 新标签页在当前标签页的相同容器中打开
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
// @version         1.1.10
// @license         MIT License
// @async
// @compatibility   Firefox 136+
// @charset         UTF-8
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            1.1.10 剪贴板 data URL base64 校验改为轻量结构检查，避免大型 payload 同步全量解码
// @note            1.1.9 缓存标签页悬停切换延迟配置，减少 mouseover 高频路径 pref 查询
// @note            1.1.8 合并侧边栏历史 patch 重试调度，避免 MutationObserver 高频变化时堆积 timeout
// @note            1.1.7 layout.css.animation.enabled 为 false 时，标签页悬停切换回退到 setTimeout
// @note            1.1.6 标签页悬停切换改用 CSS animationend 驱动延迟，减少 JS 计时器调度
// @note            1.1.5 修复新版 Firefox 右键标签页不触发 click 导致的右键关闭失效，并保留旧版 click 兼容
// @note            1.1.4 修复新版侧边栏历史第二次打开后 browser.tabs.loadHistoryInTabs 失效的问题
// @note            1.1.3 修正新版 Firefox 右键图片菜单改走 viewMedia 后，browser.tabs.loadImageInBackground 不生效的问题
// @note            1.1.2 历史在新标签页中打开兼容新版侧边栏
// @note            1.1.1 修复右键新标签按钮无法搜索 Services.search is undefined 的 bug
// @note            1.1.0 修复开启右键关闭标签页的功能后无法打开标签右键菜单的问题
// @note            1.0.9 增加选项 browser.tabs.openNewTabInContainer (布尔值) 新标签页在当前标签页的相同容器中打开
// @note            1.0.8 重写，去除内嵌菜单，不再使用模块化，大幅度减少代码量，不再支持 destroy 方法，不再兼容 Tab Mix Plus 扩展
// @note            1.0.7 适配新版 userChrome.js @async 注解，去除无用 CSS 加载代码
// @note            1.0.6 修正菜单样式问题
// @note            1.0.5 移除 BuildPanel 支持
// @note            1.0.4 修复右键新标签页按钮兼容 data:image 链接的 bug
// @note            1.0.3 兼容 TST 扩展 Switch Tab On Hover，依赖扩展 TST Hoverswitch
// ==/UserScript==
(async function () {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    window.TabPlus?._removeMouseOverDelayPrefObserver?.();

    window.TabPlus = {
        _closeTimer: null,
        _diableMouseOver: false,
        _lastMouseX: 0, // 用于记录关闭标签时的鼠标X坐标
        _moveThreshold: 100, // 移动恢复的距离阈值（会动态设为标签宽度）
        _mouseOverDelayPref: "browser.tabs.mouseOverDelayMS",
        _mouseOverDelayMS: 150,
        _mouseOverPrefObserverInstalled: false,
        _boundSidebarBrowser: null,
        _sidebarHistoryPatchObserver: null,
        _sidebarHistoryPatchPending: false,
        _sidebarHistoryPatchTimers: new Set(),
        _patchedSidebarHistoryWindows: new WeakSet(),
        _hoverTab: null,
        _hoverTimer: null,
        _hoverSwitchStyle: null,
        _hoverLeaveListeners: new WeakMap(),
        lazy: {},

        init: function () {
            let sb = window.userChrome_js?.sb;
            if (!sb) {
                sb = Cu.Sandbox(window, {
                    sandboxPrototype: window,
                    sameZoneAs: window,
                });

                /* toSource() is not available in sandbox */
                Cu.evalInSandbox(`
          Function.prototype.toSource = window.Function.prototype.toSource;
          Object.defineProperty(Function.prototype, "toSource", {enumerable : false})
          Object.prototype.toSource = window.Object.prototype.toSource;
          Object.defineProperty(Object.prototype, "toSource", {enumerable : false})
          Array.prototype.toSource = window.Array.prototype.toSource;
          Object.defineProperty(Array.prototype, "toSource", {enumerable : false})
      `, sb);
                window.addEventListener("unload", () => {
                    setTimeout(() => {
                        Cu.nukeSandbox(sb);
                    }, 0);
                }, { once: true });
            }
            this.sb = sb;
            this.initSearchService();
            this.initWhereToOpenLinkMod();
            this.initSidebarHistoryRevampMod();
            this.initOpenInContainerMod();
            this.initMouseOverDelayPrefCache();
            const tabContainer = gBrowser.tabContainer;
            this.installHoverSwitchStyle();
            tabContainer.addEventListener('mouseover', this, false);
            tabContainer.addEventListener('mouseleave', this, false);
            tabContainer.addEventListener('animationend', this, true);
            tabContainer.addEventListener('dblclick', (event) => this.handleEvent(event, 'closetab'), false);
            tabContainer.addEventListener('contextmenu', (event) => this.handleEvent(event, 'closetab'), true);
            tabContainer.addEventListener('click', (event) => {
                this.handleEvent(event, 'clipboard');
                this.handleEvent(event, 'closetab');
            }, false);
        },
        
        initSearchService: async function () {
            if (this._searchServiceInitPromise) {
                return this._searchServiceInitPromise;
            }
            this._searchServiceInitPromise = (async () => {
                if (typeof Services.search !== 'undefined') {
                    this.searchService = Services.search;
                } else { // Fx 149
                    ChromeUtils.defineESModuleGetters(this.lazy, {
                        SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
                    });
                    this.searchService = this.lazy.SearchService;
                }
                if (!this.searchService.isInitialized) {
                    await this.searchService.init();
                }
                return this.searchService;
            })();
            return this._searchServiceInitPromise;
        },

        initWhereToOpenLinkMod: function () {
            const bu = BrowserUtils, { whereToOpenLink: w } = bu;
            if (!bu.o_whereToOpenLink) {
                const legacyTrees = ["places", "historySidebar"];
                const sel = "#historyMenuPopup,#PanelUI-history";
                bu.o_whereToOpenLink = bu.whereToOpenLink;
                bu.whereToOpenLink = function (e) {
                    let res = w.apply(BrowserUtils, arguments);
                    if (e?.target?.id === "context-viewimage") {
                        const rootEvent = bu.getRootEvent?.(e) || e;
                        const hasModifier =
                            rootEvent?.button == 1 ||
                            rootEvent?.ctrlKey ||
                            rootEvent?.metaKey ||
                            rootEvent?.shiftKey ||
                            rootEvent?.altKey;
                        const imageInBackground = Services.prefs.getBoolPref("browser.tabs.loadImageInBackground", false);
                        const loadInBackground = Services.prefs.getBoolPref("browser.tabs.loadInBackground", false);
                        if (!hasModifier && imageInBackground !== loadInBackground) {
                            return res == "current" || res == "tab" ? "tabshifted" : res;
                        }
                        return res;
                    }
                    if (!Services.prefs.getBoolPref("browser.tabs.loadHistoryInTabs", false)) {
                        return res;
                    }
                    if (res != "current" || !Event.isInstance(e)) return res;
                    try {
                        var skip = true, trg = e.composedTarget || e.target;
                        var win = trg.documentGlobal || trg.relevantGlobal || trg.ownerGlobal || trg.ownerDocument?.defaultView || window;
                        var name = win.document.documentURIObject
                            .QueryInterface(Ci.nsIURL).fileName.replace(/\.[^.]+$/, "");
                        if (name == "browser") {
                            skip = win.gBrowser.selectedTab.isEmpty || !trg.closest?.(sel);
                        } else if (legacyTrees.includes(name)) {
                            skip = (win.opener || win.windowRoot.documentGlobal || win.windowRoot.relevantGlobal || win.windowRoot.ownerGlobal).gBrowser.selectedTab.isEmpty
                                || trg.closest("tree").selectedNode.itemId != -1;
                        } else if (name == "sidebar-history") {
                            let browserWin = win.documentGlobal?.browsingContext?.embedderWindowGlobal?.browsingContext?.window
                                || win.windowRoot.documentGlobal || win.windowRoot.relevantGlobal || win.windowRoot.ownerGlobal || win.opener;
                            skip = !browserWin?.gBrowser || browserWin.gBrowser.selectedTab.isEmpty
                                || !trg.closest?.("sidebar-tab-row");
                        }
                        return skip ? res : "tab";
                    }
                    catch { return res; }
                }
            }
        },

        initSidebarHistoryRevampMod: function () {
            const sidebar = document.getElementById("sidebar");
            if (!sidebar) {
                return;
            }
            const patchCurrentSidebar = () => {
                try {
                    const win = sidebar.contentWindow;
                    const href = sidebar.contentDocument?.location?.href?.split("?")[0];
                    if (href !== "chrome://browser/content/sidebar/sidebar-history.html") {
                        return;
                    }
                    this.patchSidebarHistoryWindow(win);
                } catch { }
            };
            if (this._boundSidebarBrowser !== sidebar) {
                this._boundSidebarBrowser = sidebar;
                sidebar.addEventListener("load", () => this.scheduleSidebarHistoryPatch(patchCurrentSidebar), true);
            }
            if (!this._sidebarHistoryPatchObserver) {
                const sidebarBox = document.getElementById("sidebar-box");
                this._sidebarHistoryPatchObserver = new MutationObserver(() => {
                    this.scheduleSidebarHistoryPatch(patchCurrentSidebar);
                });
                sidebarBox && this._sidebarHistoryPatchObserver.observe(sidebarBox, {
                    attributes: true,
                    attributeFilter: ["hidden", "sidebarcommand", "src", "style", "class"],
                });
                this._sidebarHistoryPatchObserver.observe(sidebar, {
                    attributes: true,
                    attributeFilter: ["src"],
                });
            }
            this.scheduleSidebarHistoryPatch(patchCurrentSidebar);
        },

        scheduleSidebarHistoryPatch: function (patchCurrentSidebar) {
            if (this._sidebarHistoryPatchPending) {
                return;
            }
            this._sidebarHistoryPatchPending = true;
            for (const delay of [0, 50, 150, 300, 700]) {
                const timer = setTimeout(() => {
                    this._sidebarHistoryPatchTimers.delete(timer);
                    try {
                        patchCurrentSidebar();
                    } catch { }
                    if (!this._sidebarHistoryPatchTimers.size) {
                        this._sidebarHistoryPatchPending = false;
                    }
                }, delay);
                this._sidebarHistoryPatchTimers.add(timer);
            }
        },

        patchSidebarHistoryWindow: function (win) {
            if (!win?.customElements) {
                return;
            }
            const applyPatch = () => {
                try {
                    const ctor = win.customElements.get("sidebar-history");
                    if (!ctor) {
                        return;
                    }
                    const proto = ctor.prototype;
                    const openSidebarHistoryLink = (sidebarHistory, e, forceNewTab = false) => {
                        const url = e?.originalTarget?.url;
                        const originalEvent = e?.detail?.originalEvent || e;
                        const currentWindow = sidebarHistory?.topWindow
                            || e?.target?.ownerGlobal?.browsingContext?.embedderWindowGlobal?.browsingContext?.window
                            || win.browsingContext?.embedderWindowGlobal?.browsingContext?.window;
                        if (url && currentWindow?.openTrustedLinkIn) {
                            let where = BrowserUtils.whereToOpenLink(originalEvent, false, true);
                            if ((forceNewTab || Services.prefs.getBoolPref("browser.tabs.loadHistoryInTabs", false)) && where == "current") {
                                where = "tab";
                            }
                            currentWindow.openTrustedLinkIn(url, where);
                        }
                    };

                    if (!proto._tabPlusPatchedHandleNavigateToLink) {
                        proto._tabPlusPatchedHandleNavigateToLink = true;
                        proto.handleNavigateToLink = function (e) {
                            const treeView = this.treeView;
                            openSidebarHistoryLink(this, e, false);
                            Glean.sidebar.link.history.add(1);
                            if (typeof treeView?.resetSelection == "function") {
                                treeView.resetSelection();
                            }
                            if (typeof treeView?.selectRowInList == "function") {
                                treeView.selectRowInList(e.originalTarget, e.currentTarget);
                            }
                        };
                    }

                    if (!proto._tabPlusPatchedPrimaryActions) {
                        proto._tabPlusPatchedPrimaryActions = true;
                        proto.onPrimaryAction = function (e) {
                            if (this.isMultipleRowsSelected) {
                                return;
                            }
                            openSidebarHistoryLink(this, e, false);
                            this.treeView?.clearSelection?.();
                        };
                        proto.onMiddleClickAction = function (e) {
                            if (this.isMultipleRowsSelected) {
                                return;
                            }
                            openSidebarHistoryLink(this, e, true);
                            this.treeView?.clearSelection?.();
                        };
                    }

                    this._patchedSidebarHistoryWindows.add(win);
                } catch { }
            };
            const ctor = win.customElements.get("sidebar-history");
            if (ctor) {
                applyPatch();
            } else {
                win.customElements.whenDefined("sidebar-history").then(applyPatch).catch(() => { });
            }
        },

        initOpenInContainerMod: function () {
            let func = BrowserCommands.openTab.toString();
            if (!/browser.tabs.openNewTabInContainer/.test(func)) {
                func = func.replace(
                    'openTrustedLinkIn(url, where, options);',
                    'if (Services.prefs.getBoolPref("browser.tabs.openNewTabInContainer", false)) {\n            options.userContextId = gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.getAttribute("userContextId") || null;\n          };\n          openTrustedLinkIn(url, where, options);'
                );
                Cu.evalInSandbox("BrowserCommands.openTab = function " + func.replace(/^function/, ''), this.sb);
            }
        },

        installHoverSwitchStyle: function () {
            if (this._hoverSwitchStyle) {
                return;
            }
            const styleText = `
.tabbrowser-tab[tabplus-hover-switch-pending] {
    animation-name: tabplus-hover-switch;
    animation-duration: var(--tabplus-hover-switch-delay, 150ms);
    animation-timing-function: step-end;
    animation-iteration-count: 1;
}

@keyframes tabplus-hover-switch {
    from { outline-offset: 0; }
    to { outline-offset: 0; }
}`;
            this._hoverSwitchStyle = document.createProcessingInstruction(
                "xml-stylesheet",
                `type="text/css" href="data:text/css;utf-8,${encodeURIComponent(styleText)}"`
            );
            document.insertBefore(this._hoverSwitchStyle, document.documentElement);
        },

        initMouseOverDelayPrefCache: function () {
            this._updateMouseOverDelayCache();
            if (this._mouseOverPrefObserverInstalled) {
                return;
            }
            Services.prefs.addObserver(this._mouseOverDelayPref, this);
            this._mouseOverPrefObserverInstalled = true;
            window.addEventListener("unload", () => {
                this._removeMouseOverDelayPrefObserver();
            }, { once: true });
        },

        _updateMouseOverDelayCache: function () {
            try {
                this._mouseOverDelayMS = Services.prefs.getIntPref(this._mouseOverDelayPref, 150);
            } catch {
                this._mouseOverDelayMS = 150;
            }
            if (!this._mouseOverDelayMS) {
                this._cancelTabHover();
            }
        },

        _removeMouseOverDelayPrefObserver: function () {
            if (!this._mouseOverPrefObserverInstalled) {
                return;
            }
            try {
                Services.prefs.removeObserver(this._mouseOverDelayPref, this);
            } catch { }
            this._mouseOverPrefObserverInstalled = false;
        },

        observe: function (_subject, topic, data) {
            if (topic === "nsPref:changed" && data === this._mouseOverDelayPref) {
                this._updateMouseOverDelayCache();
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
            this._cancelTabHover();
            this._diableMouseOver = false;
            this._lastMouseX = 0;
        },

        _getEventTarget: function (event) {
            return event.composedTarget || event.target || event.originalTarget || null;
        },

        _getEventWindow: function (event) {
            const t = this._getEventTarget(event);
            return t?.documentGlobal || t?.relevantGlobal || t?.ownerGlobal || t?.ownerDocument?.defaultView || event.view || window;
        },

        _getTabFromEvent: function (event) {
            const findTab = (node) => node?.closest?.(".tabbrowser-tab")
                || (node?.classList?.contains?.("tabbrowser-tab") ? node : null);

            for (const node of [event.composedTarget, event.target, event.originalTarget]) {
                const tab = findTab(node);
                if (tab) {
                    return tab;
                }
            }

            const path = event.composedPath?.();
            if (path) {
                for (const node of path) {
                    const tab = findTab(node);
                    if (tab) {
                        return tab;
                    }
                }
            }

            return null;
        },

        _closeTabByEvent: function (event, tab, gBrowser) {
            if (!tab || tab.closing) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            // 在移除标签之前调用禁用函数，因为移除后 tab 对象可能无效
            this._disableMouseOverTemporarily(event, tab);
            gBrowser.removeTab(tab, { animate: true });
        },

        handleEvent: function (event, trigger) {
            const { button: b } = event;
            let dblclick = false;

            switch (event.type) {
                case 'dblclick':
                    dblclick = true;
                case 'click':
                    {
                        const targetWin = this._getEventWindow(event);
                        const targetServices = targetWin.Services || Services;
                        const { prefs } = targetServices;
                        switch (trigger) {
                            case 'clipboard':
                                if (!prefs.getBoolPref("browser.tabs.newTabBtn.rightClickLoadFromClipboard", false)) return;
                                const t = this._getEventTarget(event);
                                if (t?.matches?.('#new-tab-button, #newPrivateTab-button, #tabs-newtab-button') && b == 2) {
                                    this._clipboardCommand(event);
                                }
                                break;
                            case 'closetab':
                                const tab = this._getTabFromEvent(event);
                                if (!tab) return;
                                if ((prefs.getBoolPref("browser.tabs.closeTabByDblclick", false) && b === 0 && dblclick)
                                    || (prefs.getBoolPref("browser.tabs.closeTabByRightClick", false) && b === 2)) {
                                    const gBrowser = targetWin.gBrowser || window.gBrowser;
                                    this._closeTabByEvent(event, tab, gBrowser);
                                }
                                break;
                        }
                    }
                    break;

                case 'contextmenu':
                    if (trigger !== 'closetab' || b !== 2) {
                        return;
                    }
                    {
                        const targetWin = this._getEventWindow(event);
                        const targetServices = targetWin.Services || Services;
                        const { prefs } = targetServices;
                        if (!prefs.getBoolPref("browser.tabs.closeTabByRightClick", false)) {
                            return;
                        }
                        const tab = this._getTabFromEvent(event);
                        if (!tab) {
                            return;
                        }
                        const gBrowser = targetWin.gBrowser || window.gBrowser;
                        this._closeTabByEvent(event, tab, gBrowser);
                    }
                    break;

                case 'mouseover':
                    const mouseOverDelay = this._mouseOverDelayMS;
                    if (!mouseOverDelay) return;
                    if (this._diableMouseOver) {
                        const distance = Math.abs(event.screenX - this._lastMouseX);
                        if (distance > this._moveThreshold) {
                            this.resumeMouseOver();
                        } else {
                            return;
                        }
                    }

                    const tab = this._getTabFromEvent(event);
                    if (!tab) return;
                    if (!tab.getAttribute("selected") && !event.shiftKey && !event.ctrlKey) {
                        this._armTabHover(tab, mouseOverDelay);
                    }
                    break;
                case 'mouseleave':
                    this.resumeMouseOver();
                    break;
                case 'animationend':
                    this._onHoverSwitchAnimationEnd(event);
                    break;
            }
        },

        _clipboardCommand: async function (e) {
            const { target } = e;
            const win = target.documentGlobal || target.relevantGlobal || target.ownerGlobal || target.ownerDocument?.defaultView || window;
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
                let searchService = await this.initSearchService();
                let engine = await searchService.getDefault();
                let submission = engine.getSubmission(url, null, 'search');
                let aAllowThirdPartyFixup = {
                    private: false,
                    referrerInfo: submission.referrerInfo,
                    postData: submission.postData,
                    inBackground: e.shiftKey,
                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                }
                openTrustedLinkIn(submission.uri.spec, 'tab', aAllowThirdPartyFixup);
            }
        },

        _armTabHover: function (tab, delay) {
            if (this._hoverTab === tab) {
                return;
            }
            this._cancelTabHover();
            if (!tab || delay <= 0) {
                return;
            }

            const leaveListener = () => this._cancelTabHover(tab);
            this._hoverTab = tab;
            this._hoverLeaveListeners.set(tab, leaveListener);
            tab.style.setProperty("--tabplus-hover-switch-delay", `${delay}ms`);
            tab.addEventListener("mouseleave", leaveListener, { once: true });

            if (!Services.prefs.getBoolPref("layout.css.animation.enabled", true)) {
                this._hoverTimer = setTimeout(() => {
                    this._selectHoveredTab(tab);
                }, delay);
                return;
            }

            tab.setAttribute("tabplus-hover-switch-pending", "true");
        },

        _cancelTabHover: function (tab = this._hoverTab) {
            if (!tab) {
                return;
            }
            if (this._hoverTab === tab && this._hoverTimer) {
                clearTimeout(this._hoverTimer);
                this._hoverTimer = null;
            }
            const leaveListener = this._hoverLeaveListeners.get(tab);
            if (leaveListener) {
                tab.removeEventListener("mouseleave", leaveListener);
                this._hoverLeaveListeners.delete(tab);
            }
            tab.removeAttribute("tabplus-hover-switch-pending");
            tab.style.removeProperty("--tabplus-hover-switch-delay");
            if (this._hoverTab === tab) {
                this._hoverTab = null;
            }
        },

        _onHoverSwitchAnimationEnd: function (event) {
            if (event.animationName !== "tabplus-hover-switch") {
                return;
            }
            const tab = this._getTabFromEvent(event);
            this._selectHoveredTab(tab);
        },

        _selectHoveredTab: function (tab) {
            if (!tab || tab !== this._hoverTab || tab.closing || tab.getAttribute("selected") || !tab.matches(":hover")) {
                this._cancelTabHover(tab);
                return;
            }
            this._cancelTabHover(tab);
            if (tab.id === "firefox-view-button") {
                tab.click();
            } else {
                const win = tab.documentGlobal || tab.relevantGlobal || tab.ownerDocument?.defaultView || window;
                (win.gBrowser || gBrowser).selectedTab = tab;
            }
        },
    }
    window.TabPlus.init();

    const BASE64_FULL_CHECK_MAX_LENGTH = 8192;
    const BASE64_SAMPLE_LENGTH = 1024;

    function isDataURLBase64 (url) {
        if (typeof url !== 'string') {
            return false;
        }
        if (!/^data:/i.test(url)) {
            return false;
        }
        const commaIndex = url.indexOf(',');
        if (commaIndex <= 5) {
            return false;
        }
        const metadata = url.slice(5, commaIndex);
        if (!/(?:^|;)base64$/i.test(metadata)) {
            return false;
        }
        return isValidBase64(url.slice(commaIndex + 1));
    }

    function isValidBase64 (base64String) {
        if (typeof base64String !== 'string' || !base64String.length) {
            return false;
        }
        if (base64String.length % 4 === 1) {
            return false;
        }
        if (base64String.length <= BASE64_FULL_CHECK_MAX_LENGTH) {
            return hasValidBase64Chars(base64String, 0, base64String.length, true);
        }
        if (!hasValidBase64Chars(base64String, 0, BASE64_SAMPLE_LENGTH, false)) {
            return false;
        }
        return hasValidBase64Chars(base64String, base64String.length - BASE64_SAMPLE_LENGTH, base64String.length, true);
    }

    function hasValidBase64Chars (base64String, start, end, allowPadding) {
        let paddingStarted = false;
        for (let i = start; i < end; i++) {
            const charCode = base64String.charCodeAt(i);
            if (charCode === 61) {
                if (!allowPadding || base64String.length % 4 !== 0 || i < base64String.length - 2) {
                    return false;
                }
                paddingStarted = true;
                continue;
            }
            if (paddingStarted || !isBase64CharCode(charCode)) {
                return false;
            }
        }
        return true;
    }

    function isBase64CharCode (charCode) {
        return (charCode >= 65 && charCode <= 90) ||
            (charCode >= 97 && charCode <= 122) ||
            (charCode >= 48 && charCode <= 57) ||
            charCode === 43 ||
            charCode === 47;
    }
})();
