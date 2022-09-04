// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @license         MIT License
// @shutdown        window.TabPlus.unload();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    if (window.TabPlus) {
        window.TabPlus.unload();
        delete window.TabPlus;
    }

    if (!window.cPref) {
        window.cPref = {
            get: function (prefPath, defaultValue, setDefaultValueIfUndefined) {
                const sPrefs = Services.prefs;
                setDefaultValueIfUndefined = setDefaultValueIfUndefined || false;
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
                    if (setDefaultValueIfUndefined && typeof defaultValue !== undefined) this.set(prefPath, defaultValue);
                    return defaultValue;
                }
                return
            }, getType: function (prefPath) {
                const sPrefs = Services.prefs;
                const map = {
                    0: undefined, 32: 'string', 64: 'int', 128: 'boolean'
                }
                try {
                    return map[sPrefs.getPrefType(prefPath)];
                } catch (ex) {
                    return map[0];
                }
            }, set: function (prefPath, value) {
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
            }, addListener: (a, b) => {
                let o = (q, w, e) => (b(cPref.get(e), e));
                Services.prefs.addObserver(a, o);
                return {pref: a, observer: o}
            }, removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        };
    }

    const LANG = {
        'zh-CN': {
            "tabplus settings": "标签设置",
            "open in newtab": "新标签页打开",
            "location bar": "地址栏",
            "search bar": "搜索栏",
            "bookmarks": "书签",
            "history": "历史",
            "load in background": "后台打开",
            "image link": "图片链接",
            "middle click link": "中键点击链接",
            "close tab operation": "关闭标签页",
            "double left click": "左键双击",
            "right click": "右键单击",
            "other options": "其他选项",
            "insert tab after current tab": "在当前标签右侧打开新标签页",
            "close window with last tab": "关闭最后一个标签页后关闭窗口"
        }
    }

    const MENU_CFG = [{
        label: $L("tabplus settings"), id: "TabPlus-menu", popup: [{
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
        }, {}, {
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("load in background")
        }, {
            label: $L("image link"), type: 'checkbox', default: 1, pref: 'browser.tabs.loadImageInBackground'
        }, {
            label: $L("middle click link"), type: 'checkbox', default: 1, pref: 'browser.tabs.loadInBackground',
        }, {}, {
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("close tab operation")
        }, {
            label: $L("double left click"), type: 'checkbox', pref: 'browser.tabs.closeTabByDblclick'
        }, {
            label: $L("right click"), type: 'checkbox', pref: 'browser.tabs.closeTabByRightClick'
        }, {
            type: 'html:h2',
            class: 'subview-subheader',
            content: $L("other options")
        }, {}, {
            label: $L("insert tab after current tab"),
            type: 'checkbox',
            default: 0,
            pref: 'browser.tabs.insertAfterCurrent'
        }, {
            label: $L("close window with last tab"),
            type: 'checkbox',
            default: 1,
            pref: 'browser.tabs.closeWindowWithLastTab'
        }, {
            group: [{
                label: '自动选中鼠标指向标签页', type: 'checkbox', pref: 'browser.tabs.switchOnHover'
            }, {
                label: '设置延时',
                pref: 'browser.tabs.switchOnHoverDelay',
                type: 'prompt',
                valueType: 'int',
                default: 150,
                style: 'list-style-image: url("chrome://browser/skin/history.svg");'
            }]
        }, {
            label: '滚轮切换标签页', type: 'checkbox', pref: 'browser.tabs.swithOnScroll'
        }, {
            label: '右键单击新建标签按钮打开剪贴板地址',
            type: 'checkbox',
            pref: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard'
        }, {
            label: '中键打开书签不关闭书签菜单',
            defaultValue: true,
            type: 'checkbox',
            pref: 'browser.bookmarks.openInTabClosesMenu',
        }, {
            label: '关闭标签页选中左侧标签页', type: 'checkbox', pref: 'browser.tabs.selectLeftTabOnClose'
        }, {
            label: '显示 Firefox 今日按钮',
            type: 'checkbox',
            pref: 'browser.tabs.firefox-view',
            postcommand: 'Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);'
        }]
    }];

    const FUNCTION_LIST = {
        'browser.tabs.closeTabByDblclick': {
            el: gBrowser.tabContainer,
            event: 'dblclick',
            callback: function (event) {
                // 双击标签页关闭标签页
                if (event.button == 0 && !event.ctrlKey) {
                    const tab = event.target.closest('.tabbrowser-tab');
                    if (!tab) return;
                    gBrowser.removeTab(tab);
                    gBrowser.removeTab(tab, {animate: true});
                }
            }
        },
        'browser.tabs.switchOnHover': {
            el: gBrowser.tabContainer.parentNode,
            event: 'mouseover',
            callback: function (event) {
                // 自动切换到鼠标指向标签页
                if (!window.TabPlus && !cPref.get('browser.tabs.switchOnHover')) return;
                if (event.target.ownerGlobal.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
                const tab = event.target.closest('#firefox-view-button,.tabbrowser-tab');
                if (!tab) return;
                timeout = setTimeout(() => tab.id === "firefox-view-button" ? tab.click() : gBrowser.selectedTab = tab, cPref.get('browser.tabs.swithOnHoverDelay', 150));
            },
            handleEvent(event) {
                // 自动切换到鼠标指向标签页
                if (!window.TabPlus && !cPref.get('browser.tabs.switchOnHover')) return;
                if (event.target.ownerGlobal.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
                const tab = event.target.closest('.all-tabs-item');
                if (!tab) return;
                timeout = setTimeout(() => tab.click(), cPref.get('browser.tabs.swithOnHoverDelay', 150));
            },
            init: function () {
                let vTabList = $('vertical-tabs-list');
                if (vTabList)
                    vTabList.addEventListener('mouseover', TabPlus.FUNCTION_LIST['browser.tabs.switchOnHover'], false);
            },
            destroy: function () {
                let vTabList = $('vertical-tabs-list');
                if (vTabList)
                    vTabList.removeEventListener('mouseover', TabPlus.FUNCTION_LIST['browser.tabs.switchOnHover'], false);
            },

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
                    gBrowser.removeTab(tab, {animate: false});
                    event.stopPropagation();
                    event.preventDefault();
                }
            },
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
        'browser.tabs.loadHistoryInTabs': {
            init: function () {
                TabPlus.ORIGINAL_LIST['PlacesUIUtils_openNodeWithEvent'] = PlacesUIUtils.openNodeWithEvent.toString();
                eval('PlacesUIUtils.openNodeWithEvent = ' + PlacesUIUtils.openNodeWithEvent.toString()
                    .replace(' && lazy.PlacesUtils.nodeIsBookmark(aNode)', '')
                    .replace(' && PlacesUtils.nodeIsBookmark(aNode)', '')
                    .replace('getBrowserWindow(window)', '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()'));
            },
            destroy: function () {
                eval('PlacesUIUtils.openNodeWithEvent = ' + TabPlus.ORIGINAL_LIST['PlacesUIUtils_openNodeWithEvent']
                    .replace('getBrowserWindow(window)', '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()')
                    .replace('lazy.', ''));
            }
        }, 'browser.tabs.loadImageInBackground': {
            trigger: false, el: document.getElementById('context-viewimage'),
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
            }
        }, 'browser.tabs.selectLeftTabOnClose': {
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
        }, 'browser.tabs.newTabBtn.rightClickLoadFromClipboard': {
            el: gBrowser.tabContainer,
            event: 'click',
            callback: function (e) {
                if (['tabs-newtab-button', 'new-tab-button'].includes(e.target.id) && e.button === 2 && !e.shiftKey) {
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
            }
        },
    };

    window.TabPlus = {
        PREF_LISTENER_LIST: {},
        MENU_LISTENER_LIST: {},
        ORIGINAL_LIST: {},
        CACHED_VIEWS: [],
        FUNCTION_LIST: FUNCTION_LIST,
        get id() {
            if (!this._id) this._id = 1;
            return this._id++;
        },
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        callback: (obj, pref) => {
            if (!!TabPlus.FUNCTION_LIST[pref]) {
                let val = TabPlus.FUNCTION_LIST[pref];
                let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                if (obj === trigger) {
                    if (typeof val.init === "function") val.init();
                    if (typeof TabPlus.FUNCTION_LIST[pref].callback === "function") val.el.addEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.args || false);
                } else {
                    if (typeof TabPlus.FUNCTION_LIST[pref].callback === "function") val.el.removeEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback);
                    if (typeof val.destroy === "function") val.destroy();
                }
            }
        },
        createMenuItems() {
            let view = getViewCache(document).querySelector('#appMenu-protonMainView'),
                ins = view.querySelector('#appMenu-more-button2');
            MENU_CFG.forEach(obj => {
                ins.parentNode.insertBefore(this.newBtn(document, obj), ins);
            })
        },
        newBtnPopup(doc, obj) {
            if (!obj) return;
            let viewCache = getViewCache(doc);
            let panelId = "TabPlus-Panel-" + Math.floor(Math.random() * 900000 + 99999);
            while (viewCache.querySelector("#" + panelId)) panelId += Math.floor(Math.random() * 900000 + 99999);


            let view = doc.ownerGlobal.MozXULElement.parseXULToFragment(`
<panelview id="${panelId}" class="TabPlus-View PanelUI-subView">
    <box class="panel-header">
        <toolbarbutton class="subviewbutton subviewbutton-iconic subviewbutton-back" closemenu="none" tabindex="0"><image class="toolbarbutton-icon"/><label class="toolbarbutton-text" crop="right" flex="1"/></toolbarbutton>
        <h1><span></span></h1>
    </box>
    <toolbarseparator />
    <vbox class="panel-subview-body" panelId="${panelId}">
    </vbox>
</panelview>
`)
            $A(view.querySelector('.subviewbutton-back'), {
                oncommand: function () {
                    var mView = getParentOfLocalName(this, 'panelmultiview');
                    if (mView) mView.goBack();

                    function getParentOfLocalName(el, localName) {
                        if (el == document) return;
                        if (el.localName == localName) return el;
                        return getParentOfLocalName(el.parentNode, localName);
                    }
                }
            });
            view.box = view.querySelector('vbox');
            obj.forEach(o => {
                var el = this.newBtn(doc, o);
                if (el) view.box.appendChild(el);
            });
            viewCache.appendChild(view);
            return viewCache.querySelector("#" + panelId);
        },
        newBtnGroup(doc, obj) {
            if (!obj) return;
            let group = $C(doc, 'toolbaritem', obj, ["group", "popup"]);
            group.classList.add("subviewbutton");
            group.classList.add("toolbaritem-combined-buttons");
            obj.group.forEach(o => {
                var el = this.newBtn(doc, o);
                if (el) group.appendChild(el);
            })
            return group;
        },
        newBtn(doc, obj) {
            if (!obj || !doc) return;
            if (obj.group) {
                return this.newBtnGroup(doc, obj);
            }
            let item;
            if (obj.popup) {
                item = $C(doc, "toolbarbutton", obj, ["popup"]);
                item.classList.add("subviewbutton");
                item.classList.add("subviewbutton-nav");
                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    } else {
                        eval("(" + obj.onBuild + ").call(el, doc, item)")
                    }
                }
                let view = this.newBtnPopup(doc, obj.popup);
                this.CACHED_VIEWS.push(view);
                $A(item, {
                    type: "view",
                    closemenu: "none",
                    viewId: view.id,
                    oncommand: `PanelUI.showSubView('${view.id}', this)`
                })
                obj.oncommand = true;
            } else {
                let classList = [], tagName = obj.type || 'toolbarbutton';
                if (['separator', 'toolbarseparator'].includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.labelRef && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref) {
                    return $C(doc, 'toolbarseparator', obj, ['type', 'group', 'popup']);
                }

                if (['checkbox', 'radio', 'prompt'].includes(obj.type)) tagName = 'toolbarbutton';
                if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));

                if (obj.type && obj.type.startsWith("html:")) {
                    tagName = obj.type;
                    delete obj.type;
                } else {
                    classList.push("subviewbutton");
                }

                if (obj.tool) {
                    obj.exec = this.handleRelativePath(obj.tool, this.toolPath);
                    delete obj.tool;
                }

                if (obj.exec) {
                    obj.exec = this.handleRelativePath(obj.exec);
                }

                if (obj.command) {
                    // 移动菜单
                    let org = $(obj.command, doc);
                    if (org) {
                        let replacement = $C(doc, 'menuseparator', {
                            hidden: true, class: 'TabPlus-Replacement', 'original-id': obj.command
                        });
                        org.setAttribute('restoreBeforeUnload', 'true');
                        org.parentNode.insertBefore(replacement, org);
                        org.restoreHolder = replacement;
                        if (org.localName === "menu") {
                            if (org.hasAttribute('closemenu')) org.setAttribute('orgClosemenu', org.getAttribute('closemenu'));
                            org.setAttribute('closemenu', 'none');
                        }
                        return org;
                    } else {
                        return $C(doc, 'menuseparator', {
                            hidden: true
                        });
                    }
                } else {
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                    if (classList.length) item.setAttribute('class', classList.join(' '));
                    $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type']);
                    item.setAttribute('label', obj.label || obj.command || obj.oncommand);

                    if (obj.pref) {
                        let type = cPref.getType(obj.pref) || obj.valueType || 'unknown';
                        const map = {
                            string: 'prompt', int: 'prompt', bool: 'checkbox', boolean: 'checkbox'
                        }
                        const defaultVal = {
                            string: '', int: 0, bool: false, boolean: false
                        }
                        if (map[type]) item.setAttribute('type', map[type]);
                        if (!obj.defaultValue) item.setAttribute('defaultValue', defaultVal[type]);
                        if (map[type] === 'checkbox') {
                            item.setAttribute('checked', !!cPref.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                            this.addPrefListener(obj.pref, function (value, pref) {
                                item.setAttribute('checked', value);
                                if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                            });
                        } else {
                            let value = cPref.get(obj.pref);
                            if (value) {
                                item.setAttribute('value', value);
                                item.setAttribute('label', $S(obj.label, value));
                            }
                            this.addPrefListener(obj.pref, function (value, pref) {
                                item.setAttribute('label', $S(obj.label, value || item.getAttribute('default')));
                                if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                            });
                        }
                    }
                }

                if (!obj.oncommand && !obj.pref && !obj.onclick) item.setAttribute("onclick", "checkForMiddleClick(this, event)");

                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    }
                }

                if (this.debug) this.log('createMenuItem', tagName, item);
            }

            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)")
                }
            }

            if (obj.content) {
                item.innerHTML = obj.content;
                item.removeAttribute('content');
            }

            if (obj.oncommand || obj.command) return item;

            item.setAttribute("oncommand", "TabPlus.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            return item;
        },
        addPrefListener: function (pref, callback) {
            this.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, callback);
        },
        onCommand: function (event) {
            let item = event.target;
            let pref = item.getAttribute("pref") || "";
            if (pref) this.handlePref(event, pref);
        },
        handlePref(event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = cPref.get(pref, false, !!item.getAttribute('defaultValue'));
                cPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), cPref.get(pref, item.getAttribute('default') || ""));
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
            if (item.hasAttribute("postcommand")) {
                eval(item.getAttribute('postcommand'));
            }
        },
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon")) return;

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(this.handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    if (this.debug) this.error(e);
                    return;
                }
                // if (!aFile.exists() || !aFile.isExecutable()) {
                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = this.getURLSpecFromFile(aFile);
                        menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                    } else {
                        menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            if (obj.keyword) {
                let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                if (engine) {
                    if (isPromise(engine)) {
                        engine.then(function (engine) {
                            if (engine.iconURI) menu.setAttribute("image", engine.iconURI.spec);
                        });
                    } else if (engine.iconURI) {
                        menu.setAttribute("image", engine.iconURI.spec);
                    }
                    return;
                }
            }
            var setIconCallback = function (url) {
                let uri, iconURI;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    this.error(e)
                }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ? "moz-anno:favicon:" + aURI.spec : "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
                        } catch (e) {
                        }
                    }
                });
            }
            PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                let url;
                if (entry) {
                    url = entry.url.href;
                } else {
                    url = (obj.url + '').replace(this.regexp, "");
                }
                setIconCallback(url);
            }, e => {
                this.error(e)
            }).catch(e => {
            });
        },
        init: function (win) {
            this.win = win || Services.wm.getMostRecentWindow("navigator:browser");
            this.STYLE = addStyle(this.sss, css);
            Object.keys(FUNCTION_LIST).forEach((pref) => {
                try {
                    let val = TabPlus.FUNCTION_LIST[pref];
                    let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                    if (typeof val.callback === "function") {

                        if (trigger === cPref.get(pref, false)) {
                            val.el.addEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.arg || false);
                        }

                        TabPlus.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, TabPlus.callback);
                    }
                    if (typeof val.init === "function") {
                        if (trigger === cPref.get(pref, false)) {
                            val.init();
                        }
                        let callback = function (value, pref) {
                            if (value === trigger) TabPlus.FUNCTION_LIST[pref].init(); else TabPlus.FUNCTION_LIST[pref].destroy();
                        }
                        TabPlus.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, callback);
                    }
                } catch (e) {
                    log(e);
                }
            });
            this.createMenuItems();
        },
        unload: function () {
            Object.keys(this.FUNCTION_LIST).forEach(pref => {
                val = TabPlus.FUNCTION_LIST[pref];
                if (val.el && val.event && val.callback) val.el.removeEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.arg || false);
                if (typeof val.destroy === "function") val.destroy();
            });
            Object.values(this.PREF_LISTENER_LIST).forEach(l => cPref.removeListener(l));
            Object.values(this.MENU_LISTENER_LIST).forEach(l => cPref.removeListener(l));
            if (this.menuitems && this.menuitems.length) {
                this.menuitems.forEach(menuitem => {
                    menuitem.parentNode.removeChild(menuitem);
                });
            }
            if (this.STYLE) {
                removeStyle(this.sss, this.STYLE)
                delete this.STYLE
            }
            delete window.TabPlus;
        }
    }

    function log(e) {
        Cu.reportError(e);
    }

    /**
     * 获取  DOM 元素
     * @param {string} id
     * @param {Document} aDoc
     * @returns
     */
    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function getViewCache(aDoc) {
        return ($('appMenu-viewCache', aDoc) && $('appMenu-viewCache', aDoc).content) || $('appMenu-multiView', aDoc);
    }

    /**
     * 创建 DOM 元素
     * @param {Document} aDoc 文档
     * @param {string} tag DOM 元素标签
     * @param {object} attrs 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns
     */
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

    /**
     * 应用属性
     * @param {Element} el DOM 对象
     * @param {object} obj 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns
     */
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

    /**
     * 获取本地化文本
     * @param {string} str
     * @param {string|null} replace
     * @returns
     */
    function $L(str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else return "";
    }

    /**
     * 替换 %s 为指定文本
     * @param {string} str
     * @param {string} replace
     * @returns
     */
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

    if (gBrowserInit.delayedStartupFinished) window.TabPlus.init(); else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.TabPlus.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
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
