// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.2.3
// @compatibility   Firefox 78
// @include         main
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @version         0.2.3 完善 Debug 日志
// @version         0.2.2 Bug 1815439 - Remove useless loadURI wrapper from browser.js
// @version         0.2.1 修复 openUILinkIn 被移除
// @version         0.2.0 修正点击按钮无法关闭菜单
// @version         0.1.9 新增隐藏内置菜单选项 （userChromeJS.CopyCat.hideInternal）
// @version         0.1.8 支持切换 panelview 到 menupopup （userChromeJS.CopyCat.buildPanel），修复运行参数问题
// @version         0.1.7 主题设置分离到 CopyCatTheme.uc.js
// @version         0.1.6 分离菜单配置
// @version         0.1.5 重写部分代码，摆脱 osfile_async_front.jsm 依赖，预防性修改
// @version         0.1.4 Firefox Nightly 20220713 OS is not defined
// @version         0.1.3 修改主题列表 tooltiptext，尝试修复有时候 CSS 未加载
// @version         0.1.2 新增移动菜单功能，本地化覆盖所有菜单
// @version         0.1.1 修复 bug，自动读取主题选项
// @version         0.1.0 初始版本
// ==/UserScript==

(function (css) {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    const { windowUtils } = window;

    const LANG = {
        'zh-CN': {
            "copycat-brand": "CopyCat",
            "ccopycat-btn-tooltip": "左键：快捷功能\n右键：管理 UC 脚本",
            "chrome-folder": "Chrome 文件夹",
            "restart-firefox": "重启 Firefox",
            "about-copycat": "关于 CopyCat",
            'check-config-file-with-line': '\n请重新检查配置文件第 %s 行',
            "modify-copycat-js": "修改 _copycat.js",
            "reload-copycat-js": "重载 _copycat.js",
            "reload-copycat-js-complete": "重载 _copycat.js 完成",
            "save-config": "保存配置",
        }
    }

    const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';

    window.CopyCatUtils = {
        get win() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get appVersion() {
            delete this.appVersion;
            return this.appVersion = Services.appinfo.version.split(".")[0];
        },
        get platform() {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        prefs: {
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
                let o = (q, w, e) => (b(CopyCatUtils.prefs.get(e), e));
                Services.prefs.addObserver(a, o);
                return { pref: a, observer: o }
            },
            removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        },
        alert: function (aMsg, aTitle, aCallback) {
            var callback = aCallback ? {
                observe: function (subject, topic, data) {
                    if ("alertclickcallback" != topic) return;
                    aCallback.call(null);
                }
            } : null;
            const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            alertsService.showAlertNotification(this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "CopyCat", aMsg + "", !!callback, "", callback);
        },
        config: {
            /**
             * 是否构建 Panel，false 则构建弹出菜单
             */
            get buildPanel() {
                delete this.buildPanel;
                return this.buildPanel = CopyCatUtils.prefs.get("userChromeJS.CopyCat.buildPanel", true);
            },
            /**
             * 获取配置文件对象
             */
            get FILE() {
                var path = CopyCatUtils.prefs.get("userChromeJS.CopyCat.FILE_PATH", "_copycat.js")
                var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);
                if (!aFile.exists()) {
                    saveFile(aFile, '');
                    CopyCatUtils.alert('配置文件为空');
                }
                delete this.FILE;
                return this.FILE = aFile;
            },
            /**
             * 工具相对目录
             */
            get TOOLS_RELATIVE_PATH() {
                delete this.TOOLS_RELATIVE_PATH;
                return this.TOOLS_RELATIVE_PATH = "\\chrome\\UserTools";
            },
            /**
             * 工具绝对目录
             */
            get TOOLS_PATH() {
                delete this.TOOLS_PATH;
                return this.TOOLS_PATH = handleRelativePath(this.TOOLS_RELATIVE_PATH);
            }
        },
        get debug() {
            return this.prefs.get("userChromeJS.CopyCat.debug", false);
        },
        log: function (...args) {
            if (this.debug) {
                console.log('[CopyCatButton]', ...args);
            }
        },
        error: function (...args) {
            if (this.debug) {
                console.error('[CopyCatButton]', ...args);
            }
        }
    }

    const PRE_MENUS = [{
        class: 'showFirstText',
        group: [{
            label: formatStr("chrome-folder"),
            exec: '\\chrome',
        }, {
            label: formatStr("restart-firefox"),
            tooltiptext: formatStr("restart-firefox"),
            class: 'reload',
            oncommand: 'Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);',
        }]
    }, {
        id: 'CopyCat-ChromeFolder-Sep'
    }, {
        id: 'CopyCat-InsertPoint'
    }, {
        class: 'showFirstText',
        group: [{
            label: formatStr("modify-copycat-js"),
            edit: CopyCatUtils.config.FILE.path,
        }, {
            label: formatStr("reload-copycat-js"),
            tooltiptext: formatStr("reload-copycat-js"),
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
            oncommand: function (event) {
                CopyCat.SHOW_NOTICE = true;
                CopyCat.rebuild(CopyCatUtils.config.buildPanel ? event.target.closest('panelview') : event.target.ownerDocument.querySelector("#CopyCat-Popup"));
            }
        }]
    }, {
        label: formatStr("about-copycat"),
        where: 'tab',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
        url: 'https://kkp.disk.st/firefox-ryan-personal-customization.html'

    }];

    const SEPARATOR_TYPE = ['separator', 'toolbarseparator', 'menuseparator']

    if (location.href.startsWith("chrome://browser/content/browser.x")) {
        window.CopyCat = {
            CACHED_VIEWS: [],
            get hideInternalItems() {
                return CopyCatUtils.prefs.get("userChromeJS.CopyCat.hideInternal", false);
            },
            createEl: createEl,
            formatStr: formatStr,
            initializing: false, // 是否正在初始化
            NEED_INIT: false,
            NEED_BUILD: false, // 是否需要重新构建菜单
            get itemTag() {
                return CopyCatUtils.config.buildPanel ? "toolbarbutton" : "menuitem";
            },
            get itemClass() {
                return CopyCatUtils.config.buildPanel ? "subviewbutton subviewbutton-iconic" : "menuitem-iconic";
            },
            get popupItemTag() {
                return CopyCatUtils.config.buildPanel ? "toolbarbutton" : "menu";
            },
            get popupItemClass() {
                return CopyCatUtils.config.buildPanel ? "subviewbutton subviewbutton-nav subviewbutton-iconic" : "menu-iconic";
            },
            get groupTag() {
                return CopyCatUtils.config.buildPanel ? "toolbaritem" : "menugroup";
            },
            get groupClass() {
                return CopyCatUtils.config.buildPanel ? "subviewbutton toolbaritem-combined-buttons" : "copycat-placeholder";
            },
            get separatorTag() {
                return CopyCatUtils.config.buildPanel ? "toolbarseparator" : "menuseparator";
            },
            init: function () {
                // load default style
                this.STYLE = "data:text/css;charset=utf-8," + encodeURIComponent(css);
                windowUtils.loadSheetUsingURIString(this.STYLE, windowUtils.AUTHOR_SHEET);

                // create CopyCat button
                if (!(CustomizableUI.getWidget('CopyCat-Btn') && CustomizableUI.getWidget('CopyCat-Btn').forWindow(window)?.node)) {
                    CopyCatUtils.log("Creating CopyCat button");
                    if (CopyCatUtils.config.buildPanel) {
                        CustomizableUI.createWidget({
                            id: 'CopyCat-Btn',
                            removable: true,
                            type: 'view',
                            viewId: 'CopyCat-View',
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onBeforeCreated: document => {
                                let view = createEl(document, "panelview", {
                                    id: 'CopyCat-View',
                                    flex: 1, class:
                                        'CopyCat-View',
                                }), box = createEl(document, "vbox", {
                                    class: "panel-subview-body"
                                });
                                view = $("appMenu-viewCache", document).appendChild(view);
                                this.CACHED_VIEWS.push(view);
                                view.box = view.appendChild(box);
                                this.CACHED_VIEWS.forEach(v => {
                                    v.classList.remove("CopyCat-Dynamic");
                                    $QA(".CopyCat-Dynamic", v).forEach(elm => elm.classList.remove("CopyCat-Dynamic"));
                                })
                                PRE_MENUS.forEach(obj => {
                                    let menuitem = this.newMenuitem(document, obj);
                                    if (this.hideInternalItems) {
                                        menuitem.classList.add("hidden");
                                    }
                                    view.box.appendChild(menuitem);
                                });
                            },
                            onCreated: node => {
                                $A(node, {
                                    label: formatStr("copycat-brand"),
                                    tooltiptext: formatStr("ccopycat-btn-tooltip"),
                                    contextmenu: false,
                                    onclick: function (event) {
                                        if (event.target.id !== "CopyCat-Btn") return;
                                        if (event.button === 2) {
                                            if (window.AM_Helper) {
                                                event.preventDefault();
                                                event.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/userchromejs");
                                            }
                                        }
                                    }
                                });
                            },
                            onDestroyed: document => {
                                $R($("appMenu-viewCache", document).querySelector("#CopyCat-View"));
                            },
                            onViewShowing: async event => {
                                $QA("menu", event.target).forEach(elm => elm.removeAttribute("_moz-menuactive"));
                                if (this.NEED_BUILD) {
                                    this.NEED_BUILD = false;
                                    this.rebuild(event.target);
                                }
                            }
                        });
                    } else {
                        try {
                            CustomizableUI.createWidget({
                                id: 'CopyCat-Btn',
                                removable: true,
                                defaultArea: CustomizableUI.AREA_NAVBAR,
                                localized: false,
                                onCreated: node => {
                                    const { ownerDocument: document } = node;
                                    $A(node, {
                                        label: formatStr("copycat-brand"),
                                        tooltiptext: formatStr("ccopycat-btn-tooltip"),
                                        contextmenu: false,
                                        type: "menu",
                                        onclick: (event) => {
                                            if (event.target.id !== "CopyCat-Btn") return;
                                            if (event.button === 2) {
                                                if (window.AM_Helper) {
                                                    event.preventDefault();
                                                    event.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/userchromejs");
                                                }
                                            }
                                        }
                                    });
                                    let mp = $("mainPopupSet", document);
                                    if (!mp.querySelector("#CopyCat-Popup")) {
                                        let menupopup = mp.appendChild(createEl(document, "menupopup", {
                                            id: "CopyCat-Popup",
                                            class: "CopyCat-Popup",
                                        }));
                                        PRE_MENUS.forEach(obj => {
                                            let menuitem = this.newMenuitem(document, obj);
                                            if (this.hideInternalItems) {
                                                menuitem.classList.add("hidden");
                                            }
                                            menupopup.appendChild(menuitem);
                                        });
                                        this.rebuild(menupopup);
                                    }
                                    node.addEventListener("mouseover", (event) => {
                                        let menupopup = node.ownerDocument.querySelector("#CopyCat-Popup");
                                        if (menupopup.parentNode.id !== "CopyCat-Btn") {
                                            this.rebuild(menupopup);
                                            event.target.appendChild(menupopup);;
                                        }
                                        if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY < (event.target.ownerGlobal.innerHeight / 2)) {
                                            menupopup.setAttribute("position", "after_end");
                                        } else if (event.clientX < (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                                            menupopup.setAttribute("position", "before_start");
                                        } else if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                                            menupopup.setAttribute("position", "before_start");
                                        } else {
                                            menupopup.removeAttribute("position", "after_end");
                                        }
                                    });
                                },
                            });
                        } catch (e) { }
                    }
                    this.NEED_BUILD = true;
                }
            },
            handleEvent: function (event) {
                switch (event.type) {
                    case "popupshowing":
                        CopyCatUtils.log("CopyCat Panel showing!");
                        if (this.NEED_INIT) {
                            this.NEED_INIT = false;
                            PRE_MENUS.forEach(obj => {
                                event.target.appendChild(this.newMenuitem(event.target.ownerDocument, obj));
                            });
                        }
                        if (this.NEED_BUILD) {
                            this.NEED_BUILD = false;
                            this.rebuild(event.target);
                        }
                        break;
                }
            },
            newMenugroup: function (doc, obj) {
                if (!doc || !obj) return;
                let group = createEl(doc, this.groupTag, obj, ["group"]);
                this.groupClass.split(' ').forEach(c => group.classList.add(c));
                group.classList.add("CopyCat-Group");
                obj.group.forEach(o => {
                    group.appendChild(this.newMenuitem(doc, o));
                })
                CopyCatUtils.log("Creating Menugroup: " + (obj.label || "<empty label>"), group);
                return group;
            },
            newMenupopup: function (doc, obj) {
                if (!doc || !obj) return;
                let aItem;
                if (CopyCatUtils.config.buildPanel) {
                    let viewCache = getViewCache(doc);
                    let panelId = "CopyCat-Panel-" + Math.floor(Math.random() * 900000 + 99999);
                    while (viewCache.querySelector("#" + panelId)) panelId += Math.floor(Math.random() * 900000 + 99999);
                    let view = doc.ownerGlobal.MozXULElement.parseXULToFragment(`
                    <panelview id="${panelId}" class="CopyCat-View CopyCat-Dynamic PanelUI-subView">
                        <box class="panel-header">
                            <toolbarbutton class="subviewbutton subviewbutton-iconic subviewbutton-back" closemenu="none" tabindex="0"><image class="toolbarbutton-icon"/><label class="toolbarbutton-text" crop="right" flex="1"/></toolbarbutton>
                            <h1><span></span></h1>
                        </box>
                        <toolbarseparator />
                        <vbox class="panel-subview-body" panelId="${panelId}">
                        </vbox>
                    </panelview>
                    `);
                    CopyCatUtils.log("Creating panelId: " + panelId, view);
                    $A(view.querySelector('.subviewbutton-back'), {
                        oncommand: function () {
                            var mView = this.closest('panelmultiview');
                            if (mView) mView.goBack();
                        }
                    });
                    vbox = view.querySelector('vbox');
                    obj.popup.forEach(o => {
                        var el = this.newMenuitem(doc, o);
                        if (el) vbox.appendChild(el);
                    });
                    this.CACHED_VIEWS.push(view);
                    viewCache.appendChild(view);
                    aItem = createEl(doc, "toolbarbutton", obj, ["popup", "onBuild"]);
                    aItem.classList.add("subviewbutton");
                    aItem.classList.add("subviewbutton-nav");
                    $A(aItem, {
                        closemenu: "none",
                        viewId: panelId,
                        oncommand: `PanelUI.showSubView('${panelId}', this)`
                    });
                } else {
                    aItem = createEl(doc, "menu", obj, ["popup", "onBuild"]);
                    CopyCatUtils.log("Creating Menu " + (obj.label || "<empty label>"), aItem);
                    aItem.classList.add("menu-iconic");
                    let menupopup = aItem.appendChild(createEl(doc, "menupopup"));
                    obj.popup.forEach(mObj => menupopup.appendChild(this.newMenuitem(doc, mObj)));
                }

                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    } else {
                        eval("(" + obj.onBuild + ").call(item, doc, item)")
                    }
                }
                return aItem;
            },
            newMenuitem: function (doc, obj) {
                if (!doc || !obj) return;
                if (obj.group) {
                    return this.newMenugroup(doc, obj);
                }
                if (obj.popup) {
                    return this.newMenupopup(doc, obj);
                }
                let classList = [], tagName = obj.type || this.itemTag;
                // 分隔符
                if (SEPARATOR_TYPE.includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.labelRef && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref) {
                    return createEl(doc, this.separatorTag, obj, ['type', 'group', 'popup']);
                }
                if (['checkbox', 'radio'].includes(obj.type)) tagName = this.itemTag;
                if (obj.class) obj.class.split(' ').forEach(c => {
                    if (!classList.includes(c)) classList.push(c);
                });

                if (obj.type && obj.type.startsWith("html:")) {
                    tagName = obj.type;
                    delete obj.type;
                }

                this.itemClass.split(' ').forEach(c => {
                    if (!classList.includes(c)) classList.push(c);
                });


                if (obj.tool) {
                    obj.exec = handleRelativePath(obj.tool, CopyCatUtils.config.TOOLS_PATH);
                    delete obj.tool;
                }

                if (obj.exec) {
                    obj.exec = handleRelativePath(obj.exec);
                }

                if (obj.command) {
                    // 移动菜单
                    obj.clone = obj.clone || false;
                    let org = $(obj.command, doc) || $Q('#' + obj.command, getViewCache(doc)),
                        dest;
                    if (org) {
                        dest = dest = obj.clone ? org.cloneNode(true) : org;
                        if (dest.localName === "menu") {
                            // fix close menu
                            if (dest.hasAttribute('closemenu'))
                                dest.setAttribute('orgClosemenu', dest.getAttribute('closemenu'));
                            dest.setAttribute('closemenu', 'none');
                        }
                        if ('class' in obj) {
                            // fix menu icon
                            dest.setAttribute('orgClass', dest.getAttribute('class'));
                            dest.setAttribute('class', obj.class);
                            if (obj.class.split(' ').includes("menu-iconic")) {
                                // fix menu left icon
                                if (!dest.querySelector(':scope>.menu-iconic-left')) {
                                    let left = dest.insertBefore(createEl(doc, 'hbox', {
                                        class: 'menu-iconic-left',
                                        align: 'center',
                                        pack: 'center',
                                        'aria-hidden': true
                                    }), dest.firstChild);
                                    left.appendChild(createEl(doc, 'image', {
                                        class: 'menu-iconic-icon'
                                    }));
                                    dest.setAttribute('removeMenuLeft', 'true');
                                }

                                // fix menu-text
                                let nextEl = dest.querySelector(":scope>.menu-text")
                                if (nextEl && nextEl.localName.toLowerCase() === "label") {
                                    if (!nextEl.classList.contains("menu-iconic-text")) {
                                        nextEl.setAttribute('orgClass', nextEl.getAttribute("class"));
                                        nextEl.setAttribute('class', 'menu-iconic-text');
                                    }
                                }
                            }
                        }

                        // Support attribute insert for clone node
                        ["image", "style", "label", "tooltiptext", "type"].forEach(attr => {
                            if (attr in obj) {
                                dest.setAttribute('org' + attr.slice(0, 1).toUpperCase() + attr.slice(1), org.getAttribute(attr));
                                org.setAttribute(attr, obj[attr]);
                            }
                        });

                        // fix menu-right
                        if (!obj.clone && obj["menu-right"]) {
                            dest.setAttribute("removeMenuRight", "true");
                            let right = dest.appendChild(createEl(doc, 'hbox', {
                                class: 'menu-right',
                                align: 'center',
                                'aria-hidden': true
                            }));
                            right.appendChild(createEl(doc, 'image'));
                        }
                        if ('onBuild' in obj && typeof dest !== 'undefined') {
                            if (typeof obj.onBuild === "function") {
                                obj.onBuild(doc, org);
                            } else {
                                eval("(" + obj.onBuild + ").call(org, doc, dest)")
                            }
                        }
                        let replacement = createEl(doc, 'menuseparator', {
                            hidden: true, class: 'CopyCat-Replacement', 'original-id': obj.command
                        });
                        if (!obj.clone) {
                            dest.setAttribute('restoreBeforeUnload', 'true');
                            dest.restoreHolder = replacement;
                            dest.parentNode.insertBefore(replacement, dest);
                            CopyCatUtils.log('Moving Item: ' + obj.command, dest);
                        } else {
                            CopyCatUtils.log('Cloning Item: ' + obj.command, dest);
                        }

                        return dest;
                    } else if (!'placehoder' in obj || obj.placeholder) {
                        return createEl(doc, 'menuseparator', {
                            class: "CopyCat-Replacement",
                            hidden: true
                        });
                    } else {
                        return;
                    }
                } else {
                    item = createEl(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                    if (classList.length) item.setAttribute('class', classList.join(' '));
                    $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type', 'value']);
                    let label = obj.label || obj.command || obj.oncommand || "";
                    if (label)
                        item.setAttribute('label', label);

                    if (obj.pref) {
                        let type = obj.type || CopyCatUtils.prefs.getType(obj.pref) || 'prompt';
                        const defaultVal = {
                            string: '',
                            prompt: '',
                            radio: '',
                            int: 0,
                            bool: false,
                            boolean: false
                        }
                        item.setAttribute('type', type);

                        // 设置默认值
                        if (!obj.defaultValue) item.setAttribute('defaultValue', defaultVal[type]);
                        if (type === 'checkbox') {
                            item.setAttribute('checked', !!CopyCatUtils.prefs.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                        } else {
                            let value = CopyCatUtils.prefs.get(obj.pref);
                            if (type === "prompt") {
                                item.setAttribute('value', value);
                                item.setAttribute('label', $S(obj.labelRef || obj.label, value));
                            }
                        }
                    }
                }

                if (obj.content) {
                    item.innerHTML = obj.content;
                    item.removeAttribute('content');
                }

                if (obj.oncommand || obj.command) return item;

                item.setAttribute("oncommand", "CopyCat.onCommand(event);");

                // 可能ならばアイコンを付ける
                this.setIcon(item, obj);

                CopyCatUtils.log("Creating Item: ", (item.label || "<empty label>"), item);

                return item;
            },
            setIcon: function (menu, obj) {
                if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon")) return;
                if (obj.edit || obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(handleRelativePath(obj.edit) || obj.exec);
                    } catch (e) {
                        CopyCatUtils.error(e);
                        return;
                    }
                    // if (!aFile.exists() || !aFile.isExecutable()) {
                    if (!aFile.exists()) {
                        menu.setAttribute("disabled", "true");
                    } else {
                        if (aFile.isFile()) {
                            let fileURL = getURLSpecFromFile(aFile);
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
                        console.error(e)
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
                    console.error(e)
                }).catch(e => {
                    console.error(e)
                });
            },
            rebuild: function (aViewOrPopup) {
                if (this.initializing) return;
                this.uninit(aViewOrPopup);
                this.makeMenus(aViewOrPopup);
                this.initializing = false;
                if (this.SHOW_NOTICE) {
                    CopyCatUtils.alert(formatStr("reload-copycat-js-complete"));
                }
                this.SHOW_NOTICE = false;
            },
            makeMenus(aViewOrPopup) {
                if (typeof aViewOrPopup === "undefined") return;
                let data = readFile(CopyCatUtils.config.FILE);
                if (!data) return null;

                let sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
                sandbox.Components = Components;
                sandbox.Cc = Cc;
                sandbox.Ci = Ci;
                sandbox.Cr = Cr;
                sandbox.Cu = Cu;
                sandbox.Services = Services;
                sandbox.CopyCatUtils = CopyCatUtils;
                sandbox.CopyCat = this;
                sandbox.formatStr = formatStr;
                sandbox.locale = LOCALE;
                sandbox['_menus'] = [];
                sandbox['_css'] = [];
                sandbox['_lang'] = {
                    __noSuchMethod__: function () {
                        return "";
                    }
                };
                sandbox['menus'] = function (itemObj) {
                    ps(itemObj, sandbox['_menus']);
                }

                function ps(item, array) {
                    ("join" in item && "unshift" in item) ? [].push.apply(array, item) : array.push(item);
                }

                try {
                    var lineFinder = new Error();
                    Cu.evalInSandbox("function setLocale(locale) { this.locale = locale }; function css(code){ this._css.push(code+'') };\nfunction lang(obj) { Object.assign(this._lang, obj); }" + data, sandbox, "1.8");
                } catch (e) {
                    let line = e.lineNumber - lineFinder.lineNumber - 1;
                    CopyCatUtils.alert(e + formatStr("check-config-file-with-line", line), null, function () {
                        this.edit(CopyCatUtils.FILE, line);
                    });
                    return console.error(e);
                }

                let { ownerDocument: aDoc } = aViewOrPopup;

                sandbox._menus.forEach((itemObj) => {
                    this.insertMenuitem(aDoc, itemObj, this.newMenuitem(aDoc, itemObj));
                });

                this._lang = sandbox._lang;

                if (CopyCatUtils.config.buildPanel) {
                    let viewCache = getViewCache(aDoc);
                    ["label", "tooltiptext"].forEach((attr) => {
                        $QA(`.CopyCat-View [${attr}Ref]`, viewCache).forEach((btn) => {
                            if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                        });
                        $QA(`.CopyCat-View [${attr}Ref]`, aViewOrPopup).forEach((btn) => {
                            if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                        });
                    });
                } else {
                    ["label", "tooltiptext"].forEach((attr) => {
                        $QA(`.CopyCat-Popup [${attr}Ref]`, aViewOrPopup).forEach((btn) => {
                            if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                        });
                        $QA(`.CopyCat-Popup [${attr}Ref]`, aViewOrPopup).forEach((btn) => {
                            if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                        });
                    });
                }

                function setText(item, attr) {
                    var ref = item.getAttribute(attr + "Ref");
                    if (sandbox._lang[sandbox.locale]) {
                        if (sandbox._lang[sandbox.locale][ref]) {
                            item.setAttribute(attr, sandbox._lang[sandbox.locale][ref]);
                        } else {
                            item.setAttribute(attr, capitalizeFirstLetter(ref));
                        }
                    }
                }

                function capitalizeFirstLetter(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }

                if (sandbox._css.length) {
                    windows((doc, win, location) => {
                        if (win.CopyCat) {
                            if (win.CopyCat.STYLE2) $R(win.CopyCat.STYLE2);
                            win.CopyCat.STYLE2 = addStyle(sandbox._css.join("\n"))
                        }
                    });
                }
            },
            onCommand(event) {
                event.stopPropagation();
                let item = event.target;
                let precommand = item.getAttribute('precommand') || "",
                    postcommand = item.getAttribute("postcommand") || "",
                    pref = item.getAttribute("pref") || "",
                    text = item.getAttribute("text") || "",
                    exec = item.getAttribute("exec") || "",
                    edit = item.getAttribute("edit") || "",
                    url = item.getAttribute("url") || "",
                    where = item.getAttribute("where") || "";
                if (precommand) eval(precommand);
                if (pref)
                    this.handlePref(event, pref);
                else if (edit)
                    this.edit(handleRelativePath(edit));
                else if (exec)
                    this.exec(exec, text);
                else if (url)
                    this.openCommand(event, url, where);
                if (postcommand) eval(postcommand);

                if (event.button !== 2 && event.target.getAttribute("closemenu") !== "none") {
                    closeMenus(event.target.closest("menupopup"));
                }
            },
            handlePref: function (event, pref) {
                let item = event.target;
                if (item.getAttribute('type') === 'checkbox') {
                    let setVal = CopyCatUtils.prefs.get(pref, false, !!item.getAttribute('defaultValue'));
                    CopyCatUtils.prefs.set(pref, !setVal);
                    item.setAttribute('checked', !setVal);
                } else if (item.getAttribute('type') === 'radio') {
                    if (item.hasAttribute('value')) {
                        CopyCatUtils.prefs.set(pref, item.getAttribute('value'));
                    }
                } else if (item.getAttribute('type') === 'prompt') {
                    let type = item.getAttribute('valueType') || 'string',
                        val = prompt(item.getAttribute('label'), CopyCatUtils.prefs.get(pref, item.getAttribute('default') || ""));
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
                        CopyCatUtils.prefs.set(pref, val);
                    }
                }
            },
            openCommand: function (event, url, where, postData) {
                var uri;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    return console.error('openCommand', 'url is invalid', url);
                }
                if (uri.scheme === "javascript") {
                    try {
                        gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                    } catch (e) {
                        gBrowser.loadURI(uri, { triggeringPrincipal: gBrowser.contentPrincipal });
                    }
                } else if (where) {
                    if (CopyCatUtils.appVersion < 78) {
                        openUILinkIn(uri.spec, where, false, postData || null);
                    } else {
                        openTrustedLinkIn(uri.spec, where, {
                            postData: postData || null,
                            triggeringPrincipal: where === 'current' ? gBrowser.selectedBrowser.contentPrincipal : (/^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal())
                        });
                    }
                } else if (event.button == 1) {
                    if (typeof openNewTabWith !== "undefined") {
                        openNewTabWith(uri.spec);
                    } else {
                        openTrustedLinkIn(uri.spec, 'tab', {
                            postData: postData || null,
                            triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal()
                        });
                    }
                } else {
                    if (CopyCatUtils.appVersion < 78) openUILink(uri.spec, event); else {
                        openUILink(uri.spec, event, {
                            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                        });
                    }
                }
            },
            edit: function (pathOrFile, aLineNumber) {
                let aFile = getFile(pathOrFile), editor;
                if (!aFile) {
                    console.error(formatStr("param is invalid", "this.edit", "pathOrFile"));
                    return;
                }

                try {
                    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                } catch (e) { }

                if (!editor || !editor.exists()) {
                    alert(formatStr('please set editor path'));
                    let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                    fp.init(window, formatStr('set global editor'), fp.modeOpen);
                    if (this.platform === "win")
                        fp.appendFilter(formatStr('executable files'), "*.exe");

                    if (typeof fp.show !== 'undefined') {
                        if (fp.show() == fp.returnCancel || !fp.file)
                            return;
                        else {
                            editor = fp.file;
                            Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        }
                    } else {
                        fp.open(res => {
                            if (res != Ci.nsIFilePicker.returnOK) return;
                            editor = fp.file;
                            Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        });
                    }

                }

                let aURL = getURLSpecFromFile(aFile);
                let aDocument = null;
                let aCallBack = null;
                let aPageDescriptor = null;
                gViewSourceUtils.openInExternalEditor({
                    URL: aURL,
                    lineNumber: aLineNumber
                }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
            },
            exec: function (pathOrFile, arg) {
                let aFile = getFile(pathOrFile);
                if (!aFile) {
                    this.error(formatStr("param is invalid", "this.exec", "pathOrFile"));
                    return;
                }
                var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
                try {
                    var a;
                    if (typeof arg == "undefined") arg = []; // fix slice error
                    if (typeof arg == 'string' || arg instanceof String) {
                        if (arg === "") a = []
                        else a = arg.split(/\s+/)
                    } else if (Array.isArray(arg)) {
                        a = arg;
                    } else {
                        a = [arg];
                    }

                    if (!aFile.exists()) {
                        console.error(formatStr("file not found", path));
                        return;
                    }

                    // Linux 下目录也是 executable
                    if (!aFile.isDirectory() && aFile.isExecutable()) {
                        process.init(aFile);
                        process.runw(false, a, a.length);
                    } else {
                        aFile.launch();
                    }
                } catch (e) {
                    console.error(e);
                }
            },
            copyText: function (aText) {
                Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
            },
            insertMenuitem(doc, obj, item) {
                if (!item) {
                    CopyCatUtils.log("Item to be inserted is null!");
                    return;
                } else {
                    CopyCatUtils.log("Inserting item: " + item.getAttribute('label'), item);
                }
                if (item.getAttribute('restoreBeforeUnload') !== 'true') {
                    item.classList.add('CopyCat-Dynamic');
                }
                if (CopyCatUtils.config.buildPanel) {
                    const aView = doc.getElementById('CopyCat-View')
                    if (obj && obj.insertBefore && $(obj.insertBefore, doc)) {
                        $(obj.insertBefore, doc).before(item)
                    } else if (obj && obj.insertAfter && $(obj.insertAfter, doc)) {
                        $(obj.insertBefore, doc).after(item)
                    } else if ($Q('#CopyCat-InsertPoint', aView)) {
                        aView.box.insertBefore(item, $Q('#CopyCat-InsertPoint', aView));
                    } else {
                        aView.box.appendChild(item);
                    }
                } else {
                    const aPopup = doc.getElementById('CopyCat-Popup');
                    if (obj && obj.insertBefore && $(obj.insertBefore, doc)) {
                        $(obj.insertBefore, doc).before(item)
                    } else if (obj && obj.insertAfter && $(obj.insertAfter, doc)) {
                        $(obj.insertBefore, doc).after(item)
                    } else if ($Q('#CopyCat-InsertPoint', aPopup)) {
                        aPopup.insertBefore(item, $Q('#CopyCat-InsertPoint', aPopup));
                    } else {
                        aPopup.appendChild(item);
                    }
                }

            },
            uninit: function (aViewOrPopup) {
                if (this.initializing) return;
                if (!aViewOrPopup) return;
                restoreMenusInViewOrPopup(aViewOrPopup);
                this.CACHED_VIEWS.forEach(v => {
                    restoreMenusInViewOrPopup(v);
                })
                function restoreMenusInViewOrPopup(aViewOrPopup) {
                    $QA('[restoreBeforeUnload="true"]', aViewOrPopup).forEach(item => {
                        item.removeAttribute("closemenu");
                        item.getAttributeNames().filter(attr => attr.startsWith("org")).forEach(attr => {
                            item.setAttribute(attr.substring(3, attr.length).toLowerCase(), item.getAttribute(attr));
                            item.removeAttribute(attr);
                        });
                        let labels = [...item.childNodes].filter(el => el.localName.toLowerCase() === "label");
                        if (labels.length) {
                            labels.forEach(label => {
                                label.getAttributeNames().filter(attr => attr.startsWith("org")).forEach(attr => {
                                    label.setAttribute(attr.substring(3, attr.length).toLowerCase(), label.getAttribute(attr));
                                    label.removeAttribute(attr);
                                });
                            })
                        }
                        if (item.getAttribute("removeMenuLeft") == "true") {
                            $R(item.querySelector(":scope > .menu-iconic-left"));
                            item.removeAttribute("removeMenuLeft");
                            item.classList.remove("menu-iconic");
                            let label = item.querySelector(':scope>.menu-iconic-text');
                            if (label) label.className = 'menu-text';
                        }
                        if (item.getAttribute("removeMenuRight") == "true") {
                            $R(item.querySelector(":scope > .menu-right"));
                            item.removeAttribute("removeMenuRight")
                        }
                        let { restoreHolder } = item;
                        if (restoreHolder) {
                            restoreHolder.parentNode.insertBefore(item, restoreHolder);
                            $R(restoreHolder);
                            item.restoreHolder = null;
                        }
                        item.removeAttribute("restoreBeforeUnload");
                    });
                }
                $QA(".CopyCat-Dynamic", aViewOrPopup).forEach(elm => $R(elm));
            },
            destroy: function () {
                CustomizableUI.destroyWidget("CopyCat-Btn")
            }
        }
        if (gBrowserInit.delayedStartupFinished) window.CopyCat.init();
        else {
            let delayedListener = (subject, topic) => {
                if (topic == "browser-delayed-startup-finished" && subject == window) {
                    Services.obs.removeObserver(delayedListener, topic);
                    window.CopyCat.init();
                }
            };
            Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
        }
    } else {
        window.CopyCat = {
            get FILE() {
                var path = CopyCatUtils.prefs.get("userChromeJS.CopyCat.FILE_PATH", "_copycat.js")
                var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);
                if (!aFile.exists()) {
                    saveFile(aFile, '');
                    CopyCatUtils.alert('配置文件为空');
                }
                delete this.FILE;
                return this.FILE = aFile;
            },
            init: function (win) {
                let doc = win.document;
                if (LANG[LOCALE]) {
                    Object.keys(LANG[LOCALE]).forEach((k) => {
                        let el = doc.querySelector("[data-l10n-id=\"" + k + "\"]");
                        if (el) el.innerHTML = LANG[LOCALE][k];
                    })
                }
                $("editor", doc).value = readFile(this.FILE);
            }
        }

        window.CopyCat.init(window);

        setTimeout(() => {
            CopyCat.rebuild(CopyCatUtils.config.buildPanel ? getViewCache(document).querySelector('#CopyCat-View') : document.querySelector("#CopyCat-Popup"));
        }, 1000);

        setTimeout(() => {
            CopyCat.rebuild(CopyCatUtils.config.buildPanel ? getViewCache(document).querySelector('#CopyCat-View') : document.querySelector("#CopyCat-Popup"));
        }, 3000);

        setTimeout(() => {
            CopyCat.rebuild(CopyCatUtils.config.buildPanel ? getViewCache(document).querySelector('#CopyCat-View') : document.querySelector("#CopyCat-Popup"));
        }, 5000);
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

    function $Q(sel, aDoc) {
        return (aDoc || document).querySelector(sel);
    }

    function $QA(sel, aDoc) {
        return (aDoc || document).querySelectorAll(sel);
    }

    function getViewCache(aDoc) {
        return ($('appMenu-viewCache', aDoc) && $('appMenu-viewCache', aDoc).content) || $('appMenu-multiView', aDoc);
    }

    function createEl(doc, tag, attrs, skipAttrs) {
        var el;
        if (!doc || !tag) return el;
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        if (tag.startsWith('html:'))
            el = doc.createElement(tag);
        else
            el = doc.createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }


    function $A(el, attrs, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (attrs) Object.keys(attrs).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof attrs[key] === 'function')
                    el.setAttribute(key, "(" + attrs[key].toString() + ").call(this, event);");
                else
                    el.setAttribute(key, attrs[key]);
            }
        });
        return el;
    }

    function $R(el) {
        if (el && el.parentNode) {
            try {
                el.parentNode.removeChild(el);
                return true;
            } catch (e) {
                console.error(e);
            }
        }
        return false;
    }

    function formatStr() {
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = LANG[LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace("%s", arguments[i]);
            }
            return str;
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

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    function getFile(pathOrFile) {
        let aFile;
        if (pathOrFile instanceof Ci.nsIFile) {
            aFile = pathOrFile;
        } else if (typeof pathOrFile === "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            aFile.initWithPath(pathOrFile);
        } else {
            console.error(formatStr("param is invalid", "CopyCat.getFile", "pathOrFile: %s", pathOrFile));
        }
        return aFile;
    }

    function getURLSpecFromFile(aFile) {
        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        return fph.getURLSpecFromFile ? fph.getURLSpecFromFile(aFile) : fph.getURLSpecFromActualFile(aFile);
    }

    function saveFile(pathOrFile, data, charset = "UTF-8") {
        let aFile = getFile(pathOrFile);
        if (!aFile) {
            console.error(formatStr("param is invalid", "CopyCat.saveFile", "pathOrFile"));
            return;
        }

        let suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        suConverter.charset = charset;
        data = suConverter.ConvertFromUnicode(data);

        let foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        foStream.init(aFile, 0x02 | 0x08 | 0x20, 0664, 0);
        foStream.write(data, data.length);
        foStream.close();
    }

    function readFile(pathOrFile, metaOnly) {
        let aFile = getFile(pathOrFile);
        if (!aFile) {
            console.error(formatStr("param is invalid", "CopyCat.readFile", "pathOrFile"));
            return;
        }
        let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
        stream.init(aFile, 0x01, 0, 0);
        let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
        cvstream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        let content = '', data = {};
        while (cvstream.readString(4096, data)) {
            content += data.value;
            if (metaOnly && (content.indexOf('// ==/UserScript==' || content.indexOf('==/UserStyle=='))) > 0) {
                break;
            }
        }
        cvstream.close();
        return content.replace(/\r\n?/g, '\n');
    }

    function handleRelativePath(path, parentPath) {
        if (path) {
            var ffdir = parentPath ? parentPath : Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
            // windows 的目录分隔符不一样
            if (CopyCatUtils.platform === "win") {
                path = path.replace(/\//g, '\\');
                if (/^(\\)/.test(path)) {
                    return ffdir + path;
                }
            } else {
                path = path.replace(/\\/g, '//');
                if (/^(\/\/)/.test(path)) {
                    return ffdir + path.replace(/^\/\//, "/");
                }
            }
            return path;
        }
    }

    function windows(fun, onlyBrowsers = true) {
        let windows = Services.wm.getEnumerator(onlyBrowsers ? this.BROWSERTYPE : null);
        while (windows.hasMoreElements()) {
            let win = windows.getNext();
            if (!win.CopyCat)
                continue;
            if (!onlyBrowsers) {
                let frames = win.docShell.getAllDocShellsInSubtree(Ci.nsIDocShellTreeItem.typeAll, Ci.nsIDocShell.ENUMERATE_FORWARDS);
                let res = frames.some(frame => {
                    let fWin = frame.domWindow;
                    let { document, location } = fWin;
                    if (fun(document, fWin, location))
                        return true;
                });
                if (res)
                    break;
            } else {
                let { document, location } = win;
                if (fun(document, win, location))
                    break;
            }
        }
    }
})(`
#CopyCat-Btn {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMikiPg0KICA8cGF0aCBkPSJNMjYuNDYwOTM4IDQuNDY2Nzk2OUMyNC42Njg4IDQuNTI1NjUwMyAyMyA1Ljk4MzQ3NjIgMjMgNy45NDUzMTI1TDIzIDE0LjcwNzAzMUMyMyAxNS4xNTgwNjUgMjMuMTg1NTI3IDE1LjU2MDU3MiAyMy4yNDIxODggMTZMMjEuNSAxNkMxNS45MzM0NjkgMTYgMTAuOTkyNzczIDE4LjgwODA1MyA4IDIzLjA2ODM1OUw4IDE5LjVDOCAxNi41MTY0MzggOS4wMDE4MzgxIDEzLjU3Mzk5MiAxMC42ODk0NTMgMTEuNDQ3MjY2QzEyLjM3NzA2OCA5LjMyMDUzODYgMTQuNjY3MzM2IDggMTcuNSA4IEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDE3LjUgNUMxMy43MDU2NjQgNSAxMC40OTU0NzkgNi44NjU1MDc5IDguMzM5ODQzOCA5LjU4MjAzMTJDNi4xODQyMDg4IDEyLjI5ODU1NSA1IDE1Ljg1NjU2MiA1IDE5LjVMNSAzMi41IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDUuMDA3ODEyNSAzMi42Njk5MjJDNS4wOTE5ODEyIDM4LjM3NDEzIDkuMzYzMDQxNCA0My4wODM3MzEgMTQuODc1IDQzLjg3MTA5NCBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAxNS41IDQ0TDM5LjUgNDRDNDEuNDE0OTU1IDQ0IDQzIDQyLjQxNDk1NSA0MyA0MC41QzQzIDM4LjM1Nzc0IDQxLjc2MzY0MiAzNi40ODI0ODggMzkuOTU3MDMxIDM1LjU4MDA3OEwzOS45NTUwNzggMzUuNTc4MTI1QzM5LjMxNzM0OCAzNS4yNTg1MzUgMzQuMjAzNTU5IDMyLjg5MDAyMSAzNC4wMTc1NzggMjQuOTMzNTk0QzM5LjAzOTM3MSAyNC40MTYwMzYgNDMgMjAuMTU4MTg4IDQzIDE0Ljk5ODA0N0w0MyA3Ljk0NTMxMjVDNDMgNS4zMjkyMzQ0IDQwLjAzNDQyNCAzLjYxMDE0NCAzNy43NjM2NzIgNC45MDgyMDMxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM3LjQwMDM5MSA1LjE5NzI2NTZMMzQuODM3ODkxIDhMMzEuMTYwMTU2IDhMMjguNTk5NjA5IDUuMTk3MjY1NiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyOC4yMzYzMjggNC45MDgyMDMxQzI3LjY2ODUxNyA0LjU4MzYxODIgMjcuMDU4MzE2IDQuNDQ3MTc5MSAyNi40NjA5MzggNC40NjY3OTY5IHogTSAzOS41ODIwMzEgNy40NDMzNTk0QzM5LjY1MzY2MiA3LjQzNDYzNzUgMzkuNzIwNDk3IDcuNDQwODM4NyAzOS43NzUzOTEgNy40NzI2NTYyQzM5LjkxMjg4IDcuNTUyMzQ3NSA0MCA3LjcxNzM1MTYgNDAgNy45NDUzMTI1TDQwIDE0Ljk5ODA0N0M0MCAxOS4wMzcxNTUgMzYuNjQxNzA3IDIyLjI1MDg3OCAzMi41MzEyNSAyMS45ODQzNzVDMjguODMzOTc4IDIxLjc0NDYwMSAyNiAxOC40Nzk0NDggMjYgMTQuNzA3MDMxTDI2IDcuOTQ1MzEyNUMyNiA3LjUzNzAzNTkgMjYuMjk4MjMyIDcuMzc3NzQwNSAyNi42NDI1NzggNy41MDM5MDYyTDI5LjM5MjU3OCAxMC41MTE3MTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMzAuNSAxMUwzNS41IDExIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM2LjYwNzQyMiAxMC41MTE3MTlMMzkuMzU3NDIyIDcuNTAzOTA2MkMzOS40MzM5NzIgNy40NzU3MjYzIDM5LjUxMDQgNy40NTIwODEyIDM5LjU4MjAzMSA3LjQ0MzM1OTQgeiBNIDI5LjUgMTMgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTYgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTMgeiBNIDM2LjUgMTMgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTYgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTMgeiBNIDIzLjk3NjU2MiAxOC45Mjc3MzRDMjUuMjc0ODM3IDIxLjg0NTY2NSAyNy44MTIzMzggMjQuMTI3MiAzMS4wMTM2NzIgMjQuNzk2ODc1QzMxLjE1NzkzOSAzNC4yNDk0NzUgMzcuOTM3OTQ2IDM3LjkyMzAzNCAzOC42MTMyODEgMzguMjYxNzE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM4LjYxNTIzNCAzOC4yNjE3MTlDMzkuNDMzMjA4IDM4LjY2OTc5NSA0MCAzOS41MDcyNTUgNDAgNDAuNUM0MCA0MC43OTUwNDUgMzkuNzk1MDQ1IDQxIDM5LjUgNDFMMjguOTQ3MjY2IDQxQzI4Ljk3MjY1IDQwLjgzMTU5NSAyOSA0MC42NjMxMzMgMjkgNDAuNDg4MjgxQzI5IDM3Ljk1Mzg3MyAyNy4yNDc0NiAzNS44MDYzMSAyNC44OTg0MzggMzUuMTg1NTQ3QzI0LjI1MzAwMiAzMC41NzUzNDUgMjAuMjgxOTg2IDI3IDE1LjUgMjdMMTQuNSAyNyBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxNC41IDMwTDE1LjUgMzBDMTkuMDczNTkxIDMwIDIxLjk0MDg4NSAzMi44NDAxODcgMjEuOTk0MTQxIDM2LjQwMDM5MSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMi4xMDM1MTYgMzcuMDcwMzEyIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIyLjExMTMyOCAzNy4wOTE3OTcgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuMTMyODEyIDM3LjEzODY3MiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMy42NDY0ODQgMzguMDEzNjcyQzI0Ljk3MjQ2NiAzOC4wODMzODYgMjYgMzkuMTQyMzY0IDI2IDQwLjQ4ODI4MUMyNiA0MC43ODgzIDI1Ljc4NzQ3IDQxIDI1LjQ4ODI4MSA0MUwxNi41IDQxQzExLjc4NzYxIDQxIDggMzcuMjEyMzkgOCAzMi41QzggMjUuMDY4MTgyIDE0LjA2ODE4MiAxOSAyMS41IDE5TDIzLjUgMTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjMuOTc2NTYyIDE4LjkyNzczNCB6Ii8+DQo8L3N2Zz4=);
}
#CopyCat-Btn > .toolbarbutton {
    -moz-context-properties: fill, fill-opacity, stroke, stroke-opacity !important;
    fill: var(--lwt-toolbarbutton-icon-fill, currentColor) !important;
}
.CopyCat-View .hidden {
    display: none !important;
}
.CopyCat-View toolbaritem.toolbaritem-combined-buttons {
    padding: 0 !important;
}
.CopyCat-View toolbaritem.toolbaritem-combined-buttons > .subviewbutton {
    padding: var(--arrowpanel-menuitem-padding) !important;
    margin-inline-start: 0 !important;
}
.CopyCat-View toolbaritem.toolbaritem-combined-buttons.showFirstText > .subviewbutton:first-child {
    -moz-box-flex: 1 !important;
    flex: 1 !important;
}
.CopyCat-View .subviewbutton:not(.noIcon) > .toolbarbutton-icon {
    display: inherit !important;
    width: 16px;
    height: 16px;
}
.CopyCat-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-text,
.CopyCat-View .subviewbutton > .toolbarbutton-text {
    padding-inline-start: 8px !important;
}
.CopyCat-View .toolbaritem-combined-buttons:is(.showFirstText,.showText) > .subviewbutton:first-child > .toolbarbutton-text {
    display: inherit !important;
    padding-inline-start: 8px !important;
}
.CopyCat-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:not(:first-child) > .toolbarbutton-text {
    display: none !important;
}
.CopyCat-View .toolbaritem-combined-buttons > .subviewbutton-iconic > .toolbarbutton-text, .TabPlus-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-icon {
    display: inherit !important;
}
.CopyCat-View > vbox > :is(menu, menuitem) {
    margin: var(--arrowpanel-menuitem-margin);
    min-height: 24px;
    padding: var(--arrowpanel-menuitem-padding);
    border-radius: var(--arrowpanel-menuitem-border-radius);
    background-color: transparent;
}
.CopyCat-View > vbox > menu:hover,
.CopyCat-View > vbox > menu[_moz-menuactive="true"],
.CopyCat-View > vbox > menuitem:hover,
.CopyCat-View > vbox > menuitem[_moz-menuactive="true"] {
    color: inherit;
    background-color: var(--panel-item-hover-bgcolor) !important;
}
.CopyCat-View > vbox > menu > .menu-right {
    margin-inline-end: 0 !important;
}
.CopyCat-Group .menuitem-iconic,
.CopyCat-Popup menugroup .menuitem-iconic {
    padding-block: 4px;
}

.CopyCat-Popup .menu-iconic > .menu-iconic-left {
    order: -1;
    -moz-box-ordinal-group: 0;
}

.CopyCat-Group > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup:not(.showFirstText) > .menuitem-iconic {
    padding-inline-start: 1em;
}

.CopyCat-Popup .menu-iconic > .menu-iconic-left ~ .menu-iconic-left /** 不想研究为什么会多了一个结构 */,
.CopyCat-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
.CopyCat-Group > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menugroup > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menuseparator + menuseparator,
.CopyCat-Popup .hidden {
    display: none;
}

.CopyCat-Group.showFirstText > :is(menu, menuitem):first-child,
.CopyCat-Group.showText > :is(menu, menuitem) {
    -moz-box-flex: 1;
    flex: 1;
    padding-inline-end: .5em;
}
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
    padding-left: 0;
    -moz-box-flex: 0;
    flex: 0;
}
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) > .menu-iconic-left {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
}
.CopyCat-View menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon,
.CopyCat-Popup menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon {
    display: block !important;
}
.subviewbutton.reload,
.CopyCat-Popup .menuitem-iconic.reload {
    list-style-image: url(chrome://global/skin/icons/reload.svg) !important;
}
.CopyCat-Popup .menuitem-iconic.option {
    list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
}
.CopyCat-Popup menu:not(.menu-iconic),
.CopyCat-Popup menuitem:not(.menuitem-iconic) {
    padding-inline-start: 36px;
}
.CopyCat-Popup menu:not(.menu-iconic) > label {
    margin-left: 0 !important;
}
.CopyCat-Popup menu > label {
    -moz-box-flex: 1 !important;
    flex: 1 !important;
}
.CopyCat-Popup menu > label.menu-text ~ label {
    display: none;
}
`)