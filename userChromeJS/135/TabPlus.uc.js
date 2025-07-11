// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @version         1.0.7
// @license         MIT License
// @async
// @shutdown        window.TabPlus.destroy();
// @compatibility   Firefox 135
// @charset         UTF-8
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            1.0.7 适配新版 userChrome.js @async 注解，去除无用的 CSS 加载代码
// @note            1.0.6 修正菜单样式问题
// @note            1.0.5 移除 BuildPanel 支持
// @note            1.0.4 修复右键新标签页按钮不能兼容data:image 链接的bug
// @note            1.0.3 兼容 TST 扩展 Switch Tab On Hover，依赖扩展 TST Hoverswitch
// ==/UserScript==
(async function () {
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

    class TabPlus {
        constructor() {
            this.listeners = {};
            this.modules = {};
            this.menus = [];
            this.win = window;
            this.gBrowser = window.gBrowser;
            this.cPref = window.cPref;
        }

        get showMenuIcon() {
            return parseInt(Services.appinfo.version) < 90;
        }

        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        }

        async init() {
            // 初始化模块
            for (const [name, module] of Object.entries(this.modules)) {
                if (!isTMPActive || module.compactWithTMP) {
                    if (module.menus) {
                        if (Array.isArray(module.menus)) {
                            this.menus = this.menus.concat(module.menus);
                        } else if (typeof module.menus === "object") {
                            this.menus.push(module.menus);
                        }
                    }
                    if (typeof module.init === "function") {
                        module.init(this.win);
                    }
                }
            }
            
            this.createOptionsMenu(this.win.document, this.menus);
        }

        destroy() {
            const menu = this.$("TabPlus-menu");
            if (menu) {
                menu.parentNode.removeChild(menu);
            }
            
            // 移除所有pref监听器
            Object.values(this.listeners).forEach(l => this.cPref.removeListener(l));
            
            // 销毁所有模块
            Object.values(this.modules).forEach(module => {
                if (typeof module.destroy === "function") {
                    module.destroy(this.win);
                }
            });
        }

        createOptionsMenu(doc, obj) {
            const ins = this.$("devToolsSeparator", doc);
            const menu = ins.parentNode.insertBefore(this.$C(doc, "menu", {
                id: 'TabPlus-menu',
                class: this.showMenuIcon ? "menu-iconic" : "",
                label: this.$L("tabplus settings"),
                image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTUuNzUgM0M1LjM5NSAzIDUuMDY1NzE4OCAzLjE4OTA5MzcgNC44ODY3MTg4IDMuNDk2MDkzOEwzLjEzNjcxODggNi40OTYwOTM4QzMuMDQ3NzE4OCA2LjY0OTA5MzcgMyA2LjgyMyAzIDdMMyAxOUMzIDIwLjEwMyAzLjg5NyAyMSA1IDIxTDEyLjI5NDkyMiAyMUMxMi4xMDU5MjIgMjAuMzY2IDEyIDE5LjY5NSAxMiAxOUw1IDE5TDUgOUwxOSA5TDE5IDEyQzE5LjY5NSAxMiAyMC4zNjYgMTIuMTA1OTIyIDIxIDEyLjI5NDkyMkwyMSA3QzIxIDYuODIzIDIwLjk1MjI4MSA2LjY0OTA5MzggMjAuODYzMjgxIDYuNDk2MDkzOEwxOS4xMTMyODEgMy40OTYwOTM4QzE4LjkzNDI4MSAzLjE4OTA5MzcgMTguNjA1IDMgMTguMjUgM0w1Ljc1IDMgeiBNIDYuMzI0MjE4OCA1TDE3LjY3NTc4MSA1TDE4Ljg0MTc5NyA3TDUuMTU4MjAzMSA3TDYuMzI0MjE4OCA1IHogTSA5IDExTDkgMTNMMTUgMTNMMTUgMTFMOSAxMSB6IE0gMTguMDQ4ODI4IDE0QzE3LjkxOTgyOCAxNCAxNy44MTE4NzUgMTQuMDk2NjA5IDE3Ljc5Njg3NSAxNC4yMjQ2MDlMMTcuNjc5Njg4IDE1LjIzNjMyOEMxNy4xOTU2ODcgMTUuNDA0MzI4IDE2Ljc1NzkwNiAxNS42NjAyODEgMTYuMzc4OTA2IDE1Ljk4ODI4MUwxNS40NDMzNTkgMTUuNTgyMDMxQzE1LjMyNTM1OSAxNS41MzEwMzEgMTUuMTg3MDQ3IDE1LjU3ODQ1MyAxNS4xMjMwNDcgMTUuNjg5NDUzTDE0LjE4NzUgMTcuMzEwNTQ3QzE0LjEyMzUgMTcuNDIxNTQ3IDE0LjE1Mjg1OSAxNy41NjM2MjUgMTQuMjU1ODU5IDE3LjY0MDYyNUwxNS4wNjI1IDE4LjI0MDIzNEMxNS4wMTQ1IDE4LjQ4NzIzNCAxNC45ODQzNzUgMTguNzQgMTQuOTg0Mzc1IDE5QzE0Ljk4NDM3NSAxOS4yNiAxNS4wMTQ1IDE5LjUxMjc2NiAxNS4wNjI1IDE5Ljc1OTc2NkwxNC4yNTU4NTkgMjAuMzU5Mzc1QzE0LjE1Mjg1OSAyMC40MzYzNzUgMTQuMTIyNSAyMC41Nzg0NTMgMTQuMTg3NSAyMC42ODk0NTNMMTUuMTIzMDQ3IDIyLjMxMDU0N0MxNS4xODcwNDcgMjIuNDIyNTQ3IDE1LjMyNTM1OSAyMi40NjcwMTYgMTUuNDQzMzU5IDIyLjQxNjAxNkwxNi4zNzg5MDYgMjIuMDExNzE5QzE2Ljc1NzkwNiAyMi4zNDA3MTkgMTcuMTk1Njg3IDIyLjU5NTY3MiAxNy42Nzk2ODggMjIuNzYzNjcyTDE3Ljc5Njg3NSAyMy43NzUzOTFDMTcuODExODc1IDIzLjkwMzM5MSAxNy45MTk4MjggMjQgMTguMDQ4ODI4IDI0TDE5LjkyMTg3NSAyNEMyMC4wNTA4NzUgMjQgMjAuMTU4ODI4IDIzLjkwMzM5MSAyMC4xNzM4MjggMjMuNzc1MzkxTDIwLjI4OTA2MiAyMi43NjM2NzJDMjAuNzczMDYzIDIyLjU5NTY3MiAyMS4yMTI3OTcgMjIuMzM5NzE5IDIxLjU5MTc5NyAyMi4wMTE3MTlMMjIuNTI3MzQ0IDIyLjQxNzk2OUMyMi42NDUzNDQgMjIuNDY4OTY5IDIyLjc4MzY1NiAyMi40MjE1NDcgMjIuODQ3NjU2IDIyLjMxMDU0N0wyMy43ODMyMDMgMjAuNjg5NDUzQzIzLjg0NzIwMyAyMC41Nzc0NTMgMjMuODE3ODQ0IDIwLjQzNTM3NSAyMy43MTQ4NDQgMjAuMzU5Mzc1TDIyLjkwODIwMyAxOS43NTk3NjZDMjIuOTU2MjAzIDE5LjUxMjc2NiAyMi45ODQzNzUgMTkuMjYgMjIuOTg0Mzc1IDE5QzIyLjk4NDM3NSAxOC43NCAyMi45NTYyMDMgMTguNDg3MjM0IDIyLjkwODIwMyAxOC4yNDAyMzRMMjMuNzE0ODQ0IDE3LjY0MDYyNUMyMy44MTc4NDQgMTcuNTYzNjI1IDIzLjg0ODIwMyAxNy40MjE1NDcgMjMuNzgzMjAzIDE3LjMxMDU0N0wyMi44NDc2NTYgMTUuNjg5NDUzQzIyLjc4MzY1NiAxNS41Nzg0NTMgMjIuNjQ1MzQ0IDE1LjUzMTAzMSAyMi41MjczNDQgMTUuNTgyMDMxTDIxLjU5MTc5NyAxNS45ODgyODFDMjEuMjEyNzk3IDE1LjY2MDI4MSAyMC43NzMwNjIgMTUuNDA0MzI4IDIwLjI4OTA2MiAxNS4yMzYzMjhMMjAuMTczODI4IDE0LjIyNDYwOUMyMC4xNTg4MjggMTQuMDk2NjA5IDIwLjA1MDg3NSAxNCAxOS45MjE4NzUgMTRMMTguMDQ4ODI4IDE0IHogTSAxOC45ODQzNzUgMTdDMjAuMDg4Mzc1IDE3IDIwLjk4NDM3NSAxNy44OTUgMjAuOTg0Mzc1IDE5QzIwLjk4NDM3NSAyMC4xMDQgMjAuMDg4Mzc1IDIxIDE4Ljk4NDM3NSAyMUMxNy44ODAzNzUgMjEgMTYuOTg0Mzc1IDIwLjEwNCAxNi45ODQzNzUgMTlDMTYuOTg0Mzc1IDE3Ljg5NSAxNy44ODAzNzUgMTcgMTguOTg0Mzc1IDE3IHoiLz4NCjwvc3ZnPg=="
            }), ins);
            
            const menupopup = menu.appendChild(this.$C(document, "menupopup", {
                id: 'TabPlus-menupopup',
            }));
            
            menupopup.addEventListener("popupshowing", (event) => {
                if (event.target.id !== "TabPlus-menupopup") return;
                event.target.querySelectorAll("menuitem").forEach(elm => elm.setAttribute("closemenu", "none"));
            });
            
            if (obj && Array.isArray(obj)) {
                obj.forEach(itemObj => {
                    menupopup.appendChild(this.newMenuitem(doc, itemObj));
                });
            }
        }

        newMenuitem(doc, obj) {
            if (!obj || !doc) return;
            
            let item, classList = [], tagName = obj.type || "menuitem";
            
            if (['separator', 'toolbarseparator'].includes(obj.type) || 
                (!obj.group && !obj.label && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref)) {
                return this.$C(doc, 'toolbarseparator', obj, ['type', 'group', 'popup']);
            }

            // 选项菜单 hack
            if (['checkbox', 'radio', 'prompt'].includes(obj.type)) {
                tagName = "menuitem";
            }

            // 设置 class
            if (obj.class) {
                obj.class.split(' ').forEach(c => classList.push(c));
            }
            
            if (obj.type && obj.type.startsWith("html:")) {
                obj.disabled = true;
                delete obj.type;
            } else {
                classList.push("menuitem-iconic");
            }

            item = this.$C(doc, tagName, obj, ['class', 'onBuild']);

            if (!obj.content) {
                item.setAttribute('label', obj.label || obj.command || obj.oncommand);
            }

            // 选项设置
            if (obj.pref) {
                let valType = this.cPref.getType(obj.pref) || obj.valueType || 'unknown';
                const map = {
                    string: 'prompt', int: 'prompt', bool: 'checkbox', boolean: 'checkbox'
                };
                const defaultVal = {
                    string: '', int: 0, bool: false, boolean: false
                };
                
                let objType = map[valType] || obj.type;
                if (objType) item.setAttribute('type', objType);
                
                if (!obj.defaultValue && Object.keys(defaultVal).includes(objType)) {
                    item.setAttribute('defaultValue', defaultVal[objType]);
                }
                
                if (objType === 'checkbox') {
                    let setVal = this.cPref.get(obj.pref);
                    if (typeof setVal === 'undefined') {
                        this.cPref.set(obj.pref, item.getAttribute('defaultValue') || true);
                    }
                    item.setAttribute('checked', !!this.cPref.get(obj.pref));
                    this.addPrefListener(obj.pref, (value, pref) => {
                        item.setAttribute('checked', value);
                    });
                } else {
                    let value = this.cPref.get(obj.pref);
                    if (value) {
                        item.setAttribute('value', value);
                        item.setAttribute('label', this.$S(obj.label, value));
                    }
                    this.addPrefListener(obj.pref, (value, pref) => {
                        item.setAttribute('label', this.$S(obj.label, value || item.getAttribute('default')));
                    });
                }
            }

            item.setAttribute('class', classList.join(" "));

            // 调用 onBuild 函数
            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)");
                }
            }

            // 插入内容
            if (obj.content) {
                item.innerHTML = obj.content;
                item.removeAttribute('content');
            }

            // 设置 command
            if (obj.oncommand || obj.command) return item;
            
            item.addEventListener("command", this.onCommand.bind(this), false);
            return item;
        }

        addPrefListener(pref, callback) {
            this.listeners[pref] = this.cPref.addListener(pref, callback);
        }

        onCommand(event) {
            let item = event.target;
            let precommand = item.hasAttribute("precommand"),
                pref = item.getAttribute("pref") || "",
                postcommand = item.hasAttribute("postcommand");
                
            if (precommand) {
                eval(item.getAttribute(precommand));
            }
            
            if (pref) {
                this.handlePref(event, pref);
            }
            
            if (postcommand) {
                eval(item.getAttribute(postcommand));
            }
            
            if (event.button == 0) {
                closeMenus(event.target.closest("menupopup"));
            }
        }

        handlePref(event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = this.cPref.get(pref);
                let defaultValue = item.getAttribute('defaultValue') || true;
                
                if (typeof setVal === "undefined") {
                    this.cPref.set(pref, false, defaultValue);
                }
                
                setVal = this.cPref.get(pref);
                this.cPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), this.cPref.get(pref, item.getAttribute('defaultValue') || ""));
                    
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
                    this.cPref.set(pref, val);
                }
            }
        }

        // DOM 辅助方法
        $(id, aDoc) {
            return (aDoc || document).getElementById(id);
        }

        $C(aDoc, tag, attrs, skipAttrs) {
            attrs = attrs || {};
            skipAttrs = skipAttrs || [];
            let el;
            
            if (tag.startsWith('html:')) {
                el = (aDoc || document).createElement(tag);
            } else {
                el = (aDoc || document).createXULElement(tag);
            }

            return this.$A(el, attrs, skipAttrs);
        }

        $A(el, obj, skipAttrs) {
            skipAttrs = skipAttrs || [];
            if (obj) {
                Object.keys(obj).forEach(key => {
                    if (!skipAttrs.includes(key)) {
                        if (key.startsWith('on')) {
                            const [e, f] = [key.slice(2), obj[key]];
                            const fn = typeof f === 'function' ? f : new Function(f);
                            el.addEventListener(e, fn, false);
                        } else {
                            el.setAttribute(key, obj[key]);
                        }
                    }
                });
            }
            return el;
        }

        $L(str, replace) {
            const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
            if (str) {
                str = LANG[LOCALE][str] || str;
                return this.$S(str, replace);
            }
            return "";
        }

        $S(str, replace) {
            str || (str = '');
            if (typeof replace !== "undefined") {
                str = str.replace("%s", replace);
            }
            return str || "";
        }
    }

    // 初始化模块
    const tabPlus = new TabPlus();

    tabPlus.modules.title = {
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("middle click not close popup")
        }]
    }
    tabPlus.modules.loadInTabs = {
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
        }],
    }
    tabPlus.modules.loadHistoryInTabs = {
        PREF: 'browser.tabs.loadHistoryInTabs',
        menus: [{
            label: $L('history'), type: 'checkbox', pref: 'browser.tabs.loadHistoryInTabs'
        }],
        replace (win) {
            window || (window = win);
            const bu = BrowserUtils, { whereToOpenLink: w } = bu;
            if (!bu.o_whereToOpenLink) {
                const trees = ["places", "historySidebar"];
                const sel = "#historyMenuPopup,#PanelUI-history";
                bu.o_whereToOpenLink = bu.whereToOpenLink;
                bu.whereToOpenLink = function (e) {
                    var res = w.apply(BrowserUtils, arguments);
                    if (!cPref.get("browser.tabs.loadHistoryInTabs", false)) return res;
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
        restore (win) {
            window || (window = win);
            let bu = BrowserUtils;
            if (bu.o_whereToOpenLink) {
                bu.whereToOpenLink = bu.o_whereToOpenLink;
                bu.o_whereToOpenLink = null;
            }
        },
        init (win) {
            if (cPref.get(this.PREF, false))
                this.replace(win);
            function callback (value, pref) {
                if (value)
                    tabPlus.modules.loadHistoryInTabs.replace();
                else
                    tabPlus.modules.loadHistoryInTabs.restore();
            }
            this.PREF_LISTENER = cPref.addListener(this.PREF, callback);
        },
        destroy (win) {
            this.restore(win);
            if (this.PREF_LISTENER)
                cPref.removeListener(this.PREF_LISTENER);
        }
    }

    tabPlus.modules.closeTabOpertate = {
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
        init (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('dblclick', this, false);
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        handleEvent (event) {
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
        destroy (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('dblclick', this, false);
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }
    tabPlus.modules.loadInBackground = {
        menus: [{
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("load in background")
        }, {
            label: $L("middle click link"), type: 'checkbox', pref: 'browser.tabs.loadInBackground',
        }]
    }
    tabPlus.modules.loadImageInBackground = {
        PREF: 'browser.tabs.loadImageInBackground',
        menus: [{
            label: $L("image link"), type: 'checkbox', pref: 'browser.tabs.loadImageInBackground'
        }, {}],
        replace (win) {
            win || (win = window);
            const m = win.document.getElementById('context-viewimage');
            if (m.hasAttribute('oncommand'))
                m.setAttribute('oncommand', null);
            m.addEventListener('command', this, false);
        },
        handleEvent (e) {
            e.preventDefault();
            e.stopPropagation();
            let where = (BrowserUtils || window).whereToOpenLink(e, false, false);
            if (where == "current") {
                where = cPref.get(this.PREF, false) ? "tabshifted" : "tab";
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
        restore (win) {
            win || (win = window);
            win.document.getElementById('context-viewimage').removeEventListener('command', this, false);
            win.document.getElementById('context-viewimage').setAttribute('oncommand', 'gContextMenu.viewMedia(event);');
        },
        init (win) {
            window || (window = win);
            this.replace(window);
        },
        destroy (win) {
            window || (window = win);
            this.restore(window);
        }
    }

    tabPlus.modules.baseMenu = {
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

    tabPlus.modules.switchOnHover = {
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
        init (win) {
            let { gBrowser } = win || window;
            // 监听鼠标移入事件
            gBrowser.tabContainer.addEventListener('mouseover', this, false);
            // 监听标签点击事件
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        // 事件处理方法
        handleEvent (event) {
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
                        function restorePref () {
                            that.isTriggered = false;
                            cPref.set(that.PREF, lastValue);
                            gBrowser.tabContainer.removeEventListener('mouseleave', restorePref, false);
                        }
                    }
                    break;
            }
        },
        // 处理标签悬停方法
        _onTabHover (tab, wait) {
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
        destroy (win) {
            let { gBrowser } = win || window;
            // 移除事件监听器
            gBrowser.tabContainer.parentNode.removeEventListener('mouseover', this, false);
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }


    tabPlus.modules.verticalTabPaneSwitchOnHover = {
        PREF: 'userChrome.tabs.verticalTabsPane.switchOnHover',
        menus: [{
            label: $L("vertical tabs panel"),
            pref: 'userChrome.tabs.verticalTabsPane.switchOnHover',
            type: 'checkbox'
        }, {}],
        compactWithTMP: true,
        init (win) {
            win || (win = window);
            let list = win.document.getElementById("vertical-tabs-list");
            if (list) list.addEventListener('mouseover', this, false);
            AddonManager.getAddonByID('tst-hoverswitch@klemens.io').then(addon => {
                if (addon) {
                    if (cPref.get("userChrome.tabs.verticalTabsPane.switchOnHover", true)) {
                        addon.isActive || addon.enable();
                    } else {
                        addon.isActive && addon.disable();
                    }
                }
            })
            cPref.addListener(this.PREF, this.listener);
        },
        listener (value, pref) {
            AddonManager.getAddonByID('tst-hoverswitch@klemens.io').then(addon => {
                if (addon) {
                    if (value) {
                        addon.isActive || addon.enable();
                    } else {
                        addon.isActive && addon.disable();
                    }
                }
            })
        },
        handleEvent (event) {
            if (!cPref.get(this.PREF, false)) return;
            let { target } = event,
                { ownerGlobal: win } = target;
            if (!window.TabPlus && !cPref.get('browser.tabs.switcHover')) return;
            if (win.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
            const tab = target.closest('.all-tabs-item');
            if (!tab) return;
            var timeout = setTimeout(() => tab.click(), cPref.get('browser.tabs.switchOnHoverDelay', cPref.get('browser.tabs.switchOnHoverDelay', 150)));
        },
        destroy (win) {
            win || (win = window);
            let list = win.document.getElementById("vertical-tabs-list");
            if (list) list.removeEventListener('mouseover', this, false);
        }
    }

    tabPlus.modules.other = {
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

    tabPlus.modules.rightClickLoadFromClipboard = {
        PREF: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard',
        menus: {
            label: $L("right click new tab button open url in clipboard"),
            type: 'checkbox',
            pref: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard'
        },
        compactWithTMP: true,
        init (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('click', this, false);
        },
        handleEvent (e) {
            if (!cPref.get(this.PREF, false)) return;
            let { target } = e;
            if (['tabs-newtab-button', 'new-tab-button'].includes(target.id) && e.button === 2 && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                let win = e.target.ownerGlobal;
                let url = (win.readFromClipboard() || "").trim();
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
            }

            function isDataURLBase64 (url) {
                if (typeof url !== 'string') {
                    return false;
                }

                // 判断是否为 data URI scheme
                if (!url.startsWith('data:')) {
                    return false;
                }

                // 去除 data: 部分
                const dataPart = url.slice(5);

                // 检查是否包含 base64 编码
                if (!dataPart.includes('base64,')) {
                    return false;
                }

                // 检查 base64 编码是否有效
                const base64Data = dataPart.split('base64,')[1];
                return isValidBase64(base64Data);
            }

            function isValidBase64 (base64String) {
                try {
                    // 使用 atob 解码 base64
                    atob(base64String);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        },
        destroy (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('click', this, false);
        }
    }

    tabPlus.modules.switchOnScroll = {
        menus: {
            label: $L("switch tab on scroll"),
            type: 'checkbox',
            pref: 'toolkit.tabbox.switchByScrolling'
        },
        compactWithTMP: true
    }

    tabPlus.modules.selectLeftTabOnClose = {
        PREF: 'browser.tabs.selectLeftTabOnClose',
        menus: {
            label: $L("select left tab after close current tab"),
            type: 'checkbox',
            pref: 'browser.tabs.selectLeftTabOnClose'
        },
        init (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.addEventListener('TabClose', this, false);
        },
        handleEvent (event) {
            if (!cPref.get(this.PREF, false)) return;
            var tab = event.target;
            gBrowser.selectedTab = tab;
            if (gBrowser.selectedTab._tPos != 0) {
                gBrowser.tabContainer.advanceSelectedTab(-1, true);
            }
        },
        destroy (win) {
            let { gBrowser } = win || window;
            gBrowser.tabContainer.removeEventListener('TabClose', this, false);
        }
    }

    tabPlus.modules.showDragImages = {
        PREF: 'nglayout.enable_drag_images',
        menus: {
            label: $L("show drag images"),
            type: 'checkbox',
            defaultValue: true,
            pref: 'nglayout.enable_drag_images'
        },
    }

    function $L (str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else return "";
    }

    function $S (str, replace) {
        str || (str = '');
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    window.TabPlus = tabPlus;
    window.TabPlus.init(window);
})();
