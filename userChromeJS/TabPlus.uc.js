// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @version         1.0.1
// @license         MIT License
// @shutdown        window.TabPlus.destroy();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(async function (css) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    let addon = await AddonManager.getAddonByID("{dc572301-7619-498c-a57d-39143191b318}");

    const isTMPActive = addon && addon.isActive;
    if (isTMPActive) {
        console.log("检测到 TabMixPlus，为避免冲突，脚本只有部分功能生效！");
    }

    if (!window.cPref) {
        window.cPref = {
            get: function (prefPath, defaultValue) {
                const sPrefs = Services.prefs;
                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            return defaultValue;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    return defaultValue;
                }
                return
            },
            getType: function (prefPath) {
                const sPrefs = Services.prefs;
                const map = {
                    0: undefined,
                    32: 'string',
                    64: 'int',
                    128: 'boolean'
                }
                try {
                    return map[sPrefs.getPrefType(prefPath)];
                } catch (ex) {
                    return map[0];
                }
            },
            set: function (prefPath, value) {
                const sPrefs = Services.prefs;
                switch (typeof value) {
                    case 'string':
                        return sPrefs.setCharPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },
            addListener: (a, b) => {
                let o = (q, w, e) => (b(cPref.get(e), e));
                Services.prefs.addObserver(a, o);
                return { pref: a, observer: o }
            },
            removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        };
    }

    const { gBrowser, cPref } = window;

    const LANG = {
        'zh-CN': {
            "tabplus settings": "标签设置",
            "middle click not close popup": "中键点击不关闭菜单",
            "open in newtab": "新标签页打开",
            "location bar": "地址栏",
            "search bar": "搜索栏",
            "bookmarks": "书签",
            "history": "历史",
            "load in background": "后台打开",
            "right click": "右键单击",
            "image link": "图片链接",
            "middle click link": "中键点击链接",
            "close tab operation": "关闭标签页",
            "double left click": "左键双击",
            "switch to tab on hover": "自动选中鼠标指向标签页",
            "set delay": "设置延时",
            "horizontal tabs panel": "横向标签栏",
            "vertical tabs panel": "垂直标签栏",
            "other options": "其他选项",
            "show all tabs button": "显示所有标签按钮",
            "insert tab after current tab": "在当前标签右侧打开新标签页",
            "close window with last tab": "关闭最后一个标签页后关闭窗口",
            "right click new tab button open url in clipboard": "右键新标签按钮打开剪贴板内容",
            "switch tab on scroll": "滚轮切换标签页",
            "keep menupopup opened when middle click bookmark menu": "中键打开书签后关闭书签菜单",
            "select left tab after close current tab": "关闭标签页选中左侧标签页",
            "show drag images": "拖拽标签时显示缩略图"
        }
    }

    let TabPlus = {
        listeners: {},
        modules: {},
        get showOptionsInToolsMenu() {
            return typeof CopyCat === "undefined" ? cPref.get("userChromeJS.TabPlus.showOptionsInToolsMenu", true) : !cPref.get("userChromeJS.CopyCat.buildPanel", true);
        },
        get menuitemTag() {
            return this.showOptionsInToolsMenu ? "menuitem" : "toolbarbutton";
        },
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        init(win) {
            this.menus = [];
            Object.values(this.modules).forEach(module => {
                if (!isTMPActive || module.compactWithTMP) {
                    if (module.menus && module.menus instanceof Array) {
                        this.menus = this.menus.concat(module.menus);
                    } else if (typeof module.menus === "object") {
                        this.menus.push(module.menus);
                    }
                    if (typeof module.init === "function")
                        module.init(win);
                }
            });
            if (this.showOptionsInToolsMenu)
                this.createOptionsMenu(win.document, this.menus);
            else
                this.createOptionsPanel(win.document, this.menus);
            if (!this.style)
                this.style = addStyle(this.sss, css);
        },
        destroy() {
            if (this.showOptionsInToolsMenu) {
                let menu = $("TabPlus-menu");
                if (menu)
                    menu.parentNode.removeChild(menu);
            } else {
                let view = getViewCache(document);
                let panel = view.querySelector("#TabPlus-Panel");
                if (panel)
                    panel.parentNode.removeChild(panel);
                let btn = view.querySelector("#TabPlus-menu");
                if (btn)
                    btn.parentNode.removeChild(btn);
            }
            Object.values(this.listeners).forEach(l => cPref.removeListener(l));
            Object.values(this.modules).forEach(module => {
                if (typeof module.destroy === "function")
                    module.init(win);
                module.destroy(window);
            });
            if (this.style)
                removeStyle(this.sss, this.style);
        },
        createOptionsMenu(doc, obj) {
            let ins = $("devToolsSeparator", doc);
            let menu = ins.parentNode.insertBefore($C(doc, "menu", {
                id: 'TabPlus-menu',
                class: "menu-iconic",
                label: $L("tabplus settings"),
            }), ins);
            let menupopup = menu.appendChild($C(document, "menupopup", {
                id: 'TabPlus-menupopup',
            }));
            menupopup.addEventListener("popupshowing", (event) => {
                if (event.target.id !== "TabPlus-menupopup");
                event.target.querySelectorAll("menuitem").forEach(elm => elm.setAttribute("closemenu", "none"));
            });
            if (obj && obj instanceof Array) {
                obj.forEach(itemObj => {
                    menupopup.appendChild(this.newMenuitem(doc, itemObj));
                })
            }
        },
        createOptionsPanel(doc, obj) {
            let panelId = "TabPlus-Panel";
            let viewCache = getViewCache(doc);
            if ($(panelId, viewCache)) return;
            let viewFragment = doc.ownerGlobal.MozXULElement.parseXULToFragment(`
            <panelview id="${panelId}" class="TabPlus-View PanelUI-subView">
                <box class="panel-header">
                    <toolbarbutton class="subviewbutton subviewbutton-iconic subviewbutton-back" closemenu="none" tabindex="0"><image class="toolbarbutton-icon"/><label class="toolbarbutton-text" crop="right" flex="1"/></toolbarbutton>
                    <h1><span></span></h1>
                </box>
                <toolbarseparator />
                <vbox class="panel-subview-body" panelId="${panelId}">
                </vbox>
            </panelview>
            `);
            viewCache.appendChild(viewFragment);
            let view = viewCache.querySelector("#" + panelId);
            $A(view.querySelector('.subviewbutton-back'), {
                oncommand: function () {
                    var mView = this.closest('panelmultiview');
                    if (mView) mView.goBack();
                }
            });

            let vbox = view.querySelector(':scope>vbox');
            if (obj && obj instanceof Array) {
                obj.forEach(itemObj => {
                    vbox.appendChild(this.newMenuitem(doc, itemObj));
                })
            }

            let btn = $C(doc, 'toolbarbutton', {
                id: 'TabPlus-menu',
                label: $L("tabplus settings"),
                type: "view",
                closemenu: "none",
                viewId: panelId,
                oncommand: `PanelUI.showSubView('${panelId}', this)`,
                class: 'subviewbutton subviewbutton-nav'
            });
            let protonView = viewCache.querySelector('#appMenu-protonMainView'),
                ins = protonView.querySelector('#appMenu-more-button2');
            ins.before(btn);
        },
        newMenuitem(doc, obj) {
            if (!obj || !doc) return;
            let item, classList = [], tagName = obj.type || this.menuitemTag;
            if (['separator', 'toolbarseparator'].includes(obj.type) || !obj.group && !obj.label && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref) {
                return $C(doc, 'toolbarseparator', obj, ['type', 'group', 'popup']);
            }

            // 选项菜单 hack
            if (['checkbox', 'radio', 'prompt'].includes(obj.type)) tagName = this.menuitemTag;

            // 设置 class
            if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
            if (obj.type && obj.type.startsWith("html:")) {

                if (this.showOptionsInToolsMenu) {
                    obj.disabled = true;
                } else {
                    tagName = obj.type;
                }
                delete obj.type;
            } else {
                if (this.showOptionsInToolsMenu) {
                    classList.push("menuitem-iconic");
                } else {
                    classList.push("subviewbutton");
                }
            }

            item = $C(doc, tagName, obj, ['class', 'onBuild']);

            if (!obj.content)
                item.setAttribute('label', obj.label || obj.command || obj.oncommand);


            // 选项设置
            if (obj.pref) {
                let valType = cPref.getType(obj.pref) || obj.valueType || 'unknown';
                const map = {
                    string: 'prompt', int: 'prompt', bool: 'checkbox', boolean: 'checkbox'
                }
                const defaultVal = {
                    string: '', int: 0, bool: false, boolean: false
                }
                let objType = map[valType] || obj.type;
                if (objType) item.setAttribute('type', objType);
                if (!obj.defaultValue && Object.keys(defaultVal).includes(objType)) item.setAttribute('defaultValue', defaultVal[objType]);
                if (objType === 'checkbox') {
                    let setVal = cPref.get(obj.pref);
                    if (typeof setVal === 'undefined') {
                        cPref.set(obj.pref, item.getAttribute('defaultValue') || true);
                    }
                    item.setAttribute('checked', !!cPref.get(obj.pref));
                    this.addPrefListener(obj.pref, function (value, pref) {
                        item.setAttribute('checked', value);
                    });
                } else {
                    let value = cPref.get(obj.pref);
                    if (value) {
                        item.setAttribute('value', value);
                        item.setAttribute('label', $S(obj.label, value));
                    }
                    this.addPrefListener(obj.pref, function (value, pref) {
                        item.setAttribute('label', $S(obj.label, value || item.getAttribute('default')));
                    });
                }
            }

            item.setAttribute('class', classList.join(" "));

            // 调用 onBuild 函数
            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)")
                }
            }

            // 插入内容
            if (obj.content) {
                item.innerHTML = obj.content;
                item.removeAttribute('content');
            }

            // 设置 command
            if (obj.oncommand || obj.command) return item;
            item.setAttribute("oncommand", "TabPlus.onCommand(event);");
            return item;
        },
        addPrefListener: function (pref, callback) {
            this.listeners[pref] = cPref.addListener(pref, callback);
        },
        onCommand(event) {
            let item = event.target;
            let precommand = item.hasAttribute("precommand"),
                pref = item.getAttribute("pref") || "",
                postcommand = item.hasAttribute("postcommand");
            if (precommand)
                eval(item.getAttribute(precommand));
            if (pref) this.handlePref(event, pref);
            if (postcommand)
                eval(item.getAttribute(postcommand));
            if (event.button == 0)
                closeMenus(event.target.closest("menupopup"));

        },
        handlePref(event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = cPref.get(pref);
                let defaultValue = item.getAttribute('defaultValue') || true;
                if (typeof setVal === "undefined") {
                    cPref.set(pref, false, defaultValue);
                }
                setVal = cPref.get(pref);
                cPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), cPref.get(pref, item.getAttribute('defaultValue') || ""));
                if (val) {
                    switch (type) {
                        case 'int':
                            val = parseInt(val);
                            break;
                        case 'boolean':
                            val = !!val;
                            break;
                        case 'string':
                        default:
                            val = "" + val;
                            break;
                    }
                    cPref.set(pref, val);
                }

            }
        },
    }
    TabPlus.modules.title = {
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("middle click not close popup")
        }]
    }
    TabPlus.modules.loadHistoryInTabs = {
        PREF: 'browser.tabs.loadHistoryInTabs',
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("open in newtab")
        }, {
            label: $L("location bar"), type: 'checkbox', pref: 'browser.urlbar.openintab'
        }, {
            label: $L("search bar"), type: 'checkbox', pref: 'browser.search.openintab'
        }, {
            label: $L('bookmarks'), type: 'checkbox', pref: 'browser.tabs.loadBookmarksInTabs'
        }, {
            label: $L('history'), type: 'checkbox', pref: 'browser.tabs.loadHistoryInTabs'
        }],
        replace(win) {
            window || (window = win);
            this.ORIG_FUNC = PlacesUIUtils.openNodeWithEvent.toString();
            eval('PlacesUIUtils.openNodeWithEvent = ' + PlacesUIUtils.openNodeWithEvent.toString()
                .replace(' && lazy.PlacesUtils.nodeIsBookmark(aNode)', '')
                .replace(' && PlacesUtils.nodeIsBookmark(aNode)', '')
                .replace('getBrowserWindow(window)', '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()'));
        },
        restore(win) {
            window || (window = win);
            if (this.ORIG_FUNC) {
                eval('PlacesUIUtils.openNodeWithEvent = ' + this.ORIG_FUNC
                    .replace('getBrowserWindow(window)', '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()')
                    .replace('lazy.', ''));
                delete this.ORIG_FUNC;
            }
        },
        init(win) {
            if (cPref.get(this.PREF, false))
                this.replace(win);
            function callback(value, pref) {
                if (value)
                    TabPlus.modules.loadHistoryInTabs.replace();
                else
                    TabPlus.modules.loadHistoryInTabs.restore();
            }
            this.PREF_LISTENER = cPref.addListener(this.PREF, callback);
        },
        destroy(win) {
            this.restore(win);
            if (this.PREF_LISTENER)
                cPref.removeListener(this.PREF_LISTENER);
        }
    }

    TabPlus.modules.closeTabOpertate = {
        PREF_DBLCLICK: 'browser.tabs.closeTabByDblclick',
        PREF_CLICK: 'browser.tabs.closeTabByRightClick',
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("close tab operation")
        }, {
            label: $L("double left click"), type: 'checkbox', pref: 'browser.tabs.closeTabByDblclick'
        }, {
            label: $L("right click"), type: 'checkbox', pref: 'browser.tabs.closeTabByRightClick'
        }, {}],
        init(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('dblclick', this, false);
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        handleEvent(event) {
            switch (event.type) {
                case 'dblclick':
                    if (!cPref.get(this.PREF_DBLCLICK, false)) return;
                    if (event.button == 0 && !event.ctrlKey) {
                        const { gBrowser } = event.target.ownerGlobal;
                        const tab = event.target.closest('.tabbrowser-tab');
                        if (!tab) return;
                        gBrowser.removeTab(tab);
                        gBrowser.removeTab(tab, { animate: true });
                    }
                    break;
                case 'click':
                    if (!cPref.get(this.PREF_CLICK, false)) return;
                    let { target } = event,
                        { ownerGlobal: win } = target,
                        { gBrowser } = win;
                    if (event.button == 2 && !event.shiftKey) {
                        const tab = event.target.closest('.tabbrowser-tab');
                        if (!tab) return;
                        event.preventDefault();
                        gBrowser.removeTab(tab);
                        gBrowser.removeTab(tab, { animate: true });
                    }
                    break;
            }

        },
        destroy(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('dblclick', this, false);
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }

    TabPlus.modules.loadImageInBackground = {
        PREF: 'browser.tabs.loadImageInBackground',
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("load in background")
        }, {
            label: $L("image link"), type: 'checkbox', pref: 'browser.tabs.loadImageInBackground'
        }, {
            label: $L("middle click link"), type: 'checkbox', pref: 'browser.tabs.loadInBackground',
        }, {}],
        replace(win) {
            win || (win = window);
            win.document.getElementById('context-viewimage').setAttribute('oncommand', null);
            win.document.getElementById('context-viewimage').addEventListener('command', this, false);
        },
        handleEvent(e) {
            e.preventDefault();
            let where = whereToOpenLink(e, false, false);
            if (where == "current") {
                where = cPref.get(this.PREF, false) ? "tab" : "tabshifted";
            }
            let referrerInfo = gContextMenu.contentData.referrerInfo;
            let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
            if (gContextMenu.onCanvas) {
                gContextMenu._canvasToBlobURL(gContextMenu.targetIdentifier).then(function (blobURL) {
                    openLinkIn(blobURL, where, {
                        referrerInfo, triggeringPrincipal: systemPrincipal, inBackground: e.button !== 0
                    });
                }, Cu.reportError);
            } else {
                urlSecurityCheck(gContextMenu.mediaURL, gContextMenu.principal, Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT);

                // Default to opening in a new tab.
                openLinkIn(gContextMenu.mediaURL, where, {
                    referrerInfo,
                    forceAllowDataURI: true,
                    triggeringPrincipal: gContextMenu.principal,
                    csp: gContextMenu.csp,
                    inBackground: e.button !== 0
                });
            }
        },
        restore(win) {
            win || (win = window);
            win.document.getElementById('context-viewimage').removeEventListener('command', this, false);
            win.document.getElementById('context-viewimage').setAttribute('oncommand', 'gContextMenu.viewMedia(event);');
        },
        init(win) {
            window || (window = win);
            this.replace(window);
        },
        destroy(win) {
            window || (window = win);
            this.restore(window);
        }
    }

    TabPlus.modules.baseMenu = {
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("switch to tab on hover")
        }, {
            label: $L("set delay"),
            pref: 'browser.tabs.switchOnHoverDelay',
            type: 'prompt',
            valueType: 'int',
            defaultValue: 150,
            style: 'list-style-image: url("chrome://browser/skin/history.svg");'
        }],
        compactWithTMP: true,
    }

    TabPlus.modules.switchOnHover = {
        // 首选项键名
        PREF: 'browser.tabs.switchOnHover',
        // 是否触发标志
        isTriggered: false,
        // 菜单配置
        menus: [{
            label: $L("水平标签面板"),
            pref: 'browser.tabs.switchOnHover',
            type: 'checkbox'
        }],
        // 初始化方法
        init(win) {
            let { gBrowser } = win || window;
            // 监听鼠标移入事件
            gBrowser.tabContainer.parentNode.addEventListener('mouseover', this, false);
            // 监听标签点击事件
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        // 事件处理方法
        handleEvent(event) {
            let { target } = event,
                { ownerGlobal: win } = target,
                { gBrowser } = win;
            // 如果首选项被禁用，则返回
            if (!cPref.get(this.PREF, true)) return;
            const tab = target.closest('#firefox-view-button,.tabbrowser-tab');
            let dblclick = false;
            switch (event.type) {
                // 处理鼠标移入事件
                case 'mouseover':
                    if (win.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
                    if (!tab) return;
                    if (!tab.getAttribute("selected") &&
                        !event.shiftKey &&
                        !event.ctrlKey
                    ) {
                        this._onTabHover(tab);
                    }
                    break;
                // 处理双击事件
                case 'dblclick':
                    dblclick = true;
                // 处理点击事件
                case 'click':
                    // 如果已经触发，则返回
                    if (this.isTriggered) return;
                    if (['tabs-newtab-button', 'new-tab-button', 'newPrivateTab-button'].includes(target.id) || (tab && cPref.get("browser.tabs.closeTabByDblclick", false) && dblclick) || (tab && event.button === 1) || (tab && cPref.get('browser.tabs.closeTabByRightClick', false) && event.button === 2)) {
                        // 暂时禁用自动切换功能
                        this.isTriggered = true;
                        let that = this;
                        let lastValue = cPref.get(that.PREF, true);
                        gBrowser.tabContainer.addEventListener('mouseleave', restorePref, false);
                        cPref.set(that.PREF, false);
                        setTimeout(() => {
                            restorePref();
                        }, 3000);
                        function restorePref() {
                            that.isTriggered = false;
                            cPref.set(that.PREF, lastValue);
                            gBrowser.tabContainer.removeEventListener('mouseleave', restorePref, false);
                        }
                    }
                    break;
            }
        },
        // 处理标签悬停方法
        _onTabHover(tab, wait) {
            tab.addEventListener("mouseleave", function () {
                clearTimeout(wait);
                tab.removeEventListener("mouseleave", tab);
            });
            wait = setTimeout(function () {
                if (tab.id === "firefox-view-button") {
                    tab.click();
                } else {
                    gBrowser.selectedTab = tab;
                }
            }, cPref.get('browser.tabs.switchOnHoverDelay', 150));
        },
        // 销毁方法
        destroy(win) {
            let { gBrowser } = win || window;
            // 移除事件监听器
            gBrowser.tabContainer.parentNode.removeEventListener('mouseover', this, false);
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }


    TabPlus.modules.verticalTabPaneSwitchOnHover = {
        PREF: 'userChrome.tabs.verticalTabsPane.switchOnHover',
        menus: [{
            label: $L("vertical tabs panel"),
            pref: 'userChrome.tabs.verticalTabsPane.switchOnHover',
            type: 'checkbox'
        }, {}],
        compactWithTMP: true,
        init(win) {
            win || (win = window);
            let list = win.document.getElementById("vertical-tabs-list");
            if (list) list.addEventListener('mouseover', this, false);
        },
        handleEvent(event) {
            if (!cPref.get(this.PREF, false)) return;
            let { target } = event,
                { ownerGlobal: win } = target;
            if (!window.TabPlus && !cPref.get('browser.tabs.switcHover')) return;
            if (win.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
            const tab = target.closest('.all-tabs-item');
            if (!tab) return;
            var timeout = setTimeout(() => tab.click(), cPref.get('browser.tabs.switchOnHoverDelay', cPref.get('browser.tabs.switchOnHoverDelay', 150)));
        },
        destroy(win) {
            win || (win = window);
            let list = win.document.getElementById("vertical-tabs-list");
            if (list) list.removeEventListener('mouseover', this, false);
        }
    }

    TabPlus.modules.other = {
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("other options")
        }, {
            label: $L("show all tabs button"),
            type: 'checkbox',
            defaultValue: false,
            pref: 'browser.tabs.tabmanager.enabled'
        }, {
            label: $L("insert tab after current tab"),
            type: 'checkbox',
            defaultValue: false,
            pref: 'browser.tabs.insertAfterCurrent'
        }, {
            label: $L("close window with last tab"),
            type: 'checkbox',
            defaultValue: true,
            pref: 'browser.tabs.closeWindowWithLastTab'
        }, {
            label: $L("keep menupopup opened when middle click bookmark menu"),
            defaultValue: true,
            type: 'checkbox',
            pref: 'browser.bookmarks.openInTabClosesMenu',
        }],
        compactWithTMP: true,
    }

    TabPlus.modules.rightClickLoadFromClipboard = {
        PREF: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard',
        menus: {
            label: $L("right click new tab button open url in clipboard"),
            type: 'checkbox',
            pref: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard'
        },
        compactWithTMP: true,
        init(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        handleEvent(e) {
            if (!cPref.get(this.PREF, false)) return;
            let { target } = e;
            if (['tabs-newtab-button', 'new-tab-button'].includes(target.id) && e.button === 2 && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                let win = e.target.ownerGlobal;
                let url = win.readFromClipboard();
                if (!url) {
                    win.BrowserOpenTab();
                } else {
                    url = url.trim();
                    try {
                        switchToTabHavingURI(url, true);
                    } catch (ex) {
                        if (/^((https?|ftp|gopher|telnet|file|notes|ms-help|chrome|resource):((\/\/)|(\\\\))+[\w\d:#@%\/;$()~_\+-=\\\.&]*)/.test(url)) {
                            win.gBrowser.loadOneTab(encodeURIComponent(url), {
                                inBackground: false,
                                relatedToCurrent: false,
                                triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) //FF63
                            });
                        } else {
                            Services.search.getDefault().then(engine => {
                                let submission = engine.getSubmission(url, null, 'search');
                                win.openLinkIn(submission.uri.spec, 'tab', {
                                    private: false,
                                    postData: submission.postData,
                                    inBackground: false,
                                    relatedToCurrent: true,
                                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                                });
                            });
                        }
                    }
                }
            }
        },
        destroy(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }

    TabPlus.modules.switchOnScroll = {
        menus: {
            label: $L("switch tab on scroll"),
            type: 'checkbox',
            pref: 'toolkit.tabbox.switchByScrolling'
        },
        compactWithTMP: true
    }

    TabPlus.modules.selectLeftTabOnClose = {
        PREF: 'browser.tabs.selectLeftTabOnClose',
        menus: {
            label: $L("select left tab after close current tab"),
            type: 'checkbox',
            pref: 'browser.tabs.selectLeftTabOnClose'
        },
        init(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('TabClose', this, false);
        },
        handleEvent(event) {
            if (!cPref.get(this.PREF, false)) return;
            var tab = event.target;
            gBrowser.selectedTab = tab;
            if (gBrowser.selectedTab._tPos != 0) {
                gBrowser.tabContainer.advanceSelectedTab(-1, true);
            }
        },
        destroy(win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('TabClose', this, false);
        }
    }

    TabPlus.modules.showDragImages = {
        PREF: 'nglayout.enable_drag_images',
        menus: {
            label: $L("show drag images"),
            type: 'checkbox',
            defaultValue: true,
            pref: 'nglayout.enable_drag_images'
        },
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function getViewCache(aDoc) {
        return ($('appMenu-viewCache', aDoc) && $('appMenu-viewCache', aDoc).content) || $('appMenu-multiView', aDoc);
    }

    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el;
        if (tag.startsWith('html:')) {
            el = (aDoc || document).createElement(tag);
        } else {
            el = (aDoc || document).createXULElement(tag);
        }

        return $A(el, attrs, skipAttrs);
    }

    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    function $L(str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else return "";
    }

    function $S(str, replace) {
        str || (str = '');
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    function addStyle(sss, css, type = 0) {
        if (sss instanceof Ci.nsIStyleSheetService && typeof css === "string") {
            let STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)), type: type
            }
            sss.loadAndRegisterSheet(STYLE.url, STYLE.type);
            return STYLE;
        }
    }

    function removeStyle(sss, style) {
        if (sss instanceof Ci.nsIStyleSheetService && style && style.url && style.type) {
            sss.unregisterSheet(STYLE.url, STYLE.type);
            return true;
        }
        return false;
    }

    window.TabPlus = TabPlus;
    // 延时启动
    if (gBrowserInit.delayedStartupFinished) window.TabPlus.init(window);
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.TabPlus.init(subject);
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
menu#TabPlus-menu {
    list-style-image: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTUuNzUgM0M1LjM5NSAzIDUuMDY1NzE4OCAzLjE4OTA5MzcgNC44ODY3MTg4IDMuNDk2MDkzOEwzLjEzNjcxODggNi40OTYwOTM4QzMuMDQ3NzE4OCA2LjY0OTA5MzcgMyA2LjgyMyAzIDdMMyAxOUMzIDIwLjEwMyAzLjg5NyAyMSA1IDIxTDEyLjI5NDkyMiAyMUMxMi4xMDU5MjIgMjAuMzY2IDEyIDE5LjY5NSAxMiAxOUw1IDE5TDUgOUwxOSA5TDE5IDEyQzE5LjY5NSAxMiAyMC4zNjYgMTIuMTA1OTIyIDIxIDEyLjI5NDkyMkwyMSA3QzIxIDYuODIzIDIwLjk1MjI4MSA2LjY0OTA5MzggMjAuODYzMjgxIDYuNDk2MDkzOEwxOS4xMTMyODEgMy40OTYwOTM4QzE4LjkzNDI4MSAzLjE4OTA5MzcgMTguNjA1IDMgMTguMjUgM0w1Ljc1IDMgeiBNIDYuMzI0MjE4OCA1TDE3LjY3NTc4MSA1TDE4Ljg0MTc5NyA3TDUuMTU4MjAzMSA3TDYuMzI0MjE4OCA1IHogTSA5IDExTDkgMTNMMTUgMTNMMTUgMTFMOSAxMSB6IE0gMTguMDQ4ODI4IDE0QzE3LjkxOTgyOCAxNCAxNy44MTE4NzUgMTQuMDk2NjA5IDE3Ljc5Njg3NSAxNC4yMjQ2MDlMMTcuNjc5Njg4IDE1LjIzNjMyOEMxNy4xOTU2ODcgMTUuNDA0MzI4IDE2Ljc1NzkwNiAxNS42NjAyODEgMTYuMzc4OTA2IDE1Ljk4ODI4MUwxNS40NDMzNTkgMTUuNTgyMDMxQzE1LjMyNTM1OSAxNS41MzEwMzEgMTUuMTg3MDQ3IDE1LjU3ODQ1MyAxNS4xMjMwNDcgMTUuNjg5NDUzTDE0LjE4NzUgMTcuMzEwNTQ3QzE0LjEyMzUgMTcuNDIxNTQ3IDE0LjE1Mjg1OSAxNy41NjM2MjUgMTQuMjU1ODU5IDE3LjY0MDYyNUwxNS4wNjI1IDE4LjI0MDIzNEMxNS4wMTQ1IDE4LjQ4NzIzNCAxNC45ODQzNzUgMTguNzQgMTQuOTg0Mzc1IDE5QzE0Ljk4NDM3NSAxOS4yNiAxNS4wMTQ1IDE5LjUxMjc2NiAxNS4wNjI1IDE5Ljc1OTc2NkwxNC4yNTU4NTkgMjAuMzU5Mzc1QzE0LjE1Mjg1OSAyMC40MzYzNzUgMTQuMTIyNSAyMC41Nzg0NTMgMTQuMTg3NSAyMC42ODk0NTNMMTUuMTIzMDQ3IDIyLjMxMDU0N0MxNS4xODcwNDcgMjIuNDIyNTQ3IDE1LjMyNTM1OSAyMi40NjcwMTYgMTUuNDQzMzU5IDIyLjQxNjAxNkwxNi4zNzg5MDYgMjIuMDExNzE5QzE2Ljc1NzkwNiAyMi4zNDA3MTkgMTcuMTk1Njg3IDIyLjU5NTY3MiAxNy42Nzk2ODggMjIuNzYzNjcyTDE3Ljc5Njg3NSAyMy43NzUzOTFDMTcuODExODc1IDIzLjkwMzM5MSAxNy45MTk4MjggMjQgMTguMDQ4ODI4IDI0TDE5LjkyMTg3NSAyNEMyMC4wNTA4NzUgMjQgMjAuMTU4ODI4IDIzLjkwMzM5MSAyMC4xNzM4MjggMjMuNzc1MzkxTDIwLjI4OTA2MiAyMi43NjM2NzJDMjAuNzczMDYzIDIyLjU5NTY3MiAyMS4yMTI3OTcgMjIuMzM5NzE5IDIxLjU5MTc5NyAyMi4wMTE3MTlMMjIuNTI3MzQ0IDIyLjQxNzk2OUMyMi42NDUzNDQgMjIuNDY4OTY5IDIyLjc4MzY1NiAyMi40MjE1NDcgMjIuODQ3NjU2IDIyLjMxMDU0N0wyMy43ODMyMDMgMjAuNjg5NDUzQzIzLjg0NzIwMyAyMC41Nzc0NTMgMjMuODE3ODQ0IDIwLjQzNTM3NSAyMy43MTQ4NDQgMjAuMzU5Mzc1TDIyLjkwODIwMyAxOS43NTk3NjZDMjIuOTU2MjAzIDE5LjUxMjc2NiAyMi45ODQzNzUgMTkuMjYgMjIuOTg0Mzc1IDE5QzIyLjk4NDM3NSAxOC43NCAyMi45NTYyMDMgMTguNDg3MjM0IDIyLjkwODIwMyAxOC4yNDAyMzRMMjMuNzE0ODQ0IDE3LjY0MDYyNUMyMy44MTc4NDQgMTcuNTYzNjI1IDIzLjg0ODIwMyAxNy40MjE1NDcgMjMuNzgzMjAzIDE3LjMxMDU0N0wyMi44NDc2NTYgMTUuNjg5NDUzQzIyLjc4MzY1NiAxNS41Nzg0NTMgMjIuNjQ1MzQ0IDE1LjUzMTAzMSAyMi41MjczNDQgMTUuNTgyMDMxTDIxLjU5MTc5NyAxNS45ODgyODFDMjEuMjEyNzk3IDE1LjY2MDI4MSAyMC43NzMwNjIgMTUuNDA0MzI4IDIwLjI4OTA2MiAxNS4yMzYzMjhMMjAuMTczODI4IDE0LjIyNDYwOUMyMC4xNTg4MjggMTQuMDk2NjA5IDIwLjA1MDg3NSAxNCAxOS45MjE4NzUgMTRMMTguMDQ4ODI4IDE0IHogTSAxOC45ODQzNzUgMTdDMjAuMDg4Mzc1IDE3IDIwLjk4NDM3NSAxNy44OTUgMjAuOTg0Mzc1IDE5QzIwLjk4NDM3NSAyMC4xMDQgMjAuMDg4Mzc1IDIxIDE4Ljk4NDM3NSAyMUMxNy44ODAzNzUgMjEgMTYuOTg0Mzc1IDIwLjEwNCAxNi45ODQzNzUgMTlDMTYuOTg0Mzc1IDE3Ljg5NSAxNy44ODAzNzUgMTcgMTguOTg0Mzc1IDE3IHoiLz4NCjwvc3ZnPg==") !important;
}
.TabPlus-View toolbaritem.toolbaritem-combined-buttons {
    padding: 0 !important;
}
.TabPlus-View toolbaritem.toolbaritem-combined-buttons > .subviewbutton {
    padding: var(--arrowpanel-menuitem-padding) !important;
    margin-inline-start: 0 !important;
}
.TabPlus-View toolbaritem.toolbaritem-combined-buttons.showFirstText > .subviewbutton:first-child {
    -moz-box-flex: 1 !important;
}
.TabPlus-View .subviewbutton > .toolbarbutton-icon {
    width: 16px;
    height: 16px;
}
.TabPlus-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-text,
.TabPlus-View .subviewbutton > .toolbarbutton-text {
    padding-inline-start: 8px !important;
}
.TabPlus-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:first-child > .toolbarbutton-text {
    display: -moz-inline-box !important;
}
.TabPlus-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:not(:first-child) > .toolbarbutton-text {
    display: none !important;
}
.TabPlus-View .toolbaritem-combined-buttons > .subviewbutton-iconic > .toolbarbutton-text, .TabPlus-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-icon {
    display: -moz-inline-box !important;
}
`);
