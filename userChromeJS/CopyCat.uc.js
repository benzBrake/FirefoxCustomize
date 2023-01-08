// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.1.8
// @compatibility   Firefox 78
// @include         main
// @include         chrome://userchrome/content/SubScript/CopyCat.html
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
            get buildPanel() {
                return CopyCatUtils.prefs.get("userChromeJS.CopyCat.buildPanel", true);
            },
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
            get TOOLS_RELATIVE_PATH() {
                delete this.TOOLS_RELATIVE_PATH;
                return this.TOOLS_RELATIVE_PATH = "\\chrome\\UserTools";
            },
            get TOOLS_PATH() {
                delete this.TOOLS_PATH;
                return this.TOOLS_PATH = handleRelativePath(this.TOOLS_RELATIVE_PATH);
            },
        }
    }

    const PRE_MENUS = [{
        class: 'showFirstText',
        group: [{
            label: $L("chrome-folder"),
            exec: '\\chrome',
        }, {
            label: $L("restart-firefox"),
            tooltiptext: $L("restart-firefox"),
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
            label: $L("modify-copycat-js"),
            edit: CopyCatUtils.config.FILE.path,
        }, {
            label: $L("reload-copycat-js"),
            tooltiptext: $L("reload-copycat-js"),
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
            oncommand: function (event) {
                CopyCat.SHOW_NOTICE = true;
                CopyCat.rebuild(CopyCatUtils.config.buildPanel ? event.target.closest('panelview') : event.target.ownerDocument.querySelector("#CopyCat-Popup"));
            }
        }]
    }, {
        label: $L("about-copycat"),
        where: 'tab',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
        url: 'https://kkp.disk.st/firefox-ryan-personal-customization.html'

    }];

    const SEPARATOR_TYPE = ['separator', 'toolbarseparator', 'menuseparator']

    if (location.href.startsWith("chrome://browser/content/browser.x")) {
        window.CopyCat = {
            CACHED_VIEWS: [],
            get debug() {
                return CopyCatUtils.prefs.get("userChromeJS.CopyCat.debug", false);
            },
            $C: $C,
            $L: $L,
            initializing: false,
            NEED_INIT: false,
            NEED_BUILD: false,
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
                return CopyCatUtils.config.buildPanel ? "subviewbutton toolbaritem-combined-buttons" : "zhanweifu";
            },
            get separatorTag() {
                return CopyCatUtils.config.buildPanel ? "toolbarseparator" : "menuseparator";
            },
            init: function () {
                // load default style
                this.STYLE = "data:text/css;charset=utf-8," + encodeURIComponent(css);
                windowUtils.loadSheetUsingURIString(this.STYLE, windowUtils.USER_SHEET);

                // create CopyCat button
                if (!(CustomizableUI.getWidget('CopyCat-Btn') && CustomizableUI.getWidget('CopyCat-Btn').forWindow(window)?.node)) {
                    if (CopyCatUtils.config.buildPanel) {
                        CustomizableUI.createWidget({
                            id: 'CopyCat-Btn',
                            removable: true,
                            type: 'view',
                            viewId: 'CopyCat-View',
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onBeforeCreated: document => {
                                let view = $C(document, "panelview", {
                                    id: 'CopyCat-View',
                                    flex: 1, class:
                                        'CopyCat-View',
                                }), box = $C(document, "vbox", {
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
                                    view.box.appendChild(this.newMenuitem(document, obj));
                                });
                            },
                            onCreated: node => {
                                $A(node, {
                                    label: $L("copycat-brand"),
                                    tooltiptext: $L("ccopycat-btn-tooltip"),
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
                            },
                        });
                    } else {
                        CustomizableUI.createWidget({
                            id: 'CopyCat-Btn',
                            removable: true,
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onCreated: node => {
                                const { ownerDocument: document } = node;
                                $A(node, {
                                    label: $L("copycat-brand"),
                                    tooltiptext: $L("ccopycat-btn-tooltip"),
                                    contextmenu: false,
                                    onclick: function (event) {
                                        if (event.target.id !== "CopyCat-Btn") return;
                                        if (event.button === 0) {
                                            if (event.target.getAttribute("open") === "true") {
                                                closeMenus(event.target.ownerDocument.querySelector("#CopyCat-Popup"));
                                            } else {
                                                let pos = "after_end", x, y;
                                                if ((event.target.ownerGlobal.innerWidth / 2) > event.pageX) {
                                                    pos = "after_position";
                                                    x = 0;
                                                    y = 0 + event.target.clientHeight;
                                                }
                                                event.target.setAttribute("open", true);
                                                event.target.ownerDocument.querySelector("#CopyCat-Popup").openPopup(event.target, pos, x, y);
                                            }
                                        } else if (event.button === 2) {
                                            if (window.AM_Helper) {
                                                event.preventDefault();
                                                event.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/userchromejs");
                                            }
                                        }
                                    }
                                });
                                let mp = $("mainPopupSet", document);
                                if (!mp.querySelector("#CopyCat-Popup")) {
                                    let menupopup = mp.appendChild($C(document, "menupopup", {
                                        id: "CopyCat-Popup",
                                        class: "CopyCat-Popup",
                                    }));
                                    PRE_MENUS.forEach(obj => {
                                        menupopup.appendChild(this.newMenuitem(document, obj));
                                    });
                                    this.rebuild(menupopup);
                                    menupopup.addEventListener('popupshowing', (event) => {
                                        if (event.target.id === "CopyCat-Popup") {
                                            CopyCat.rebuild(event.target.ownerDocument.querySelector("#CopyCat-Popup"));
                                        }
                                    });
                                    menupopup.addEventListener('popuphidden', (event) => {
                                        if (event.target.id === "CopyCat-Popup") {
                                            event.target.ownerDocument.querySelector("#CopyCat-Btn").removeAttribute("open");
                                        }
                                    });
                                }
                            },
                        });
                    }
                    this.NEED_BUILD = true;
                }
            },
            handleEvent: function (event) {
                switch (event.type) {
                    case "popupshowing":
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
                let group = $C(doc, this.groupTag, obj, ["group"]);
                this.groupClass.split(' ').forEach(c => group.classList.add(c));
                group.classList.add("CopyCat-Group");
                obj.group.forEach(o => {
                    group.appendChild(this.newMenuitem(doc, o));
                })
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
                    aItem = $C(doc, "toolbarbutton", obj, ["popup", "onBuild"]);
                    aItem.classList.add("subviewbutton");
                    aItem.classList.add("subviewbutton-nav");
                    $A(aItem, {
                        closemenu: "none",
                        viewId: panelId,
                        oncommand: `PanelUI.showSubView('${panelId}', this)`
                    });
                } else {
                    aItem = $C(doc, "menu", obj, ["popup", "onBuild"]);
                    aItem.classList.add("menu-iconic");
                    let menupopup = aItem.appendChild($C(doc, "menupopup"));
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
                    return $C(doc, this.separatorTag, obj, ['type', 'group', 'popup']);
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
                    let org = $(obj.command, doc) || $Q('#' + obj.command, getViewCache(doc));
                    if (org) {
                        let replacement = $C(doc, 'menuseparator', {
                            hidden: true, class: 'CopyCat-Replacement', 'original-id': obj.command
                        });
                        org.setAttribute('restoreBeforeUnload', 'true');
                        org.parentNode.insertBefore(replacement, org);
                        org.restoreHolder = replacement;
                        if (org.localName === "menu") {
                            if (org.hasAttribute('closemenu'))
                                org.setAttribute('orgClosemenu', org.getAttribute('closemenu'));
                            org.setAttribute('closemenu', 'none');
                        }
                        if (obj.onBuild) {
                            if (typeof obj.onBuild === "function") {
                                obj.onBuild(doc, org);
                            } else {
                                eval("(" + obj.onBuild + ").call(org, doc, org)")
                            }
                        }
                        return org;
                    } else {
                        return $C(doc, 'menuseparator', {
                            class: "CopyCat-Replacement",
                            hidden: true
                        });
                    }
                } else {
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
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

                return item;
            },
            setIcon: function (menu, obj) {
                if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon")) return;
                if (obj.edit || obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(handleRelativePath(obj.edit) || obj.exec);
                    } catch (e) {
                        if (this.debug) console.error(e);
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
                    CopyCatUtils.alert($L("reload-copycat-js-complete"));
                }
                this.SHOW_NOTICE = false;
            },
            makeMenus(aViewOrPopup) {
                if (!aViewOrPopup) return;
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
                sandbox.$L = $L;
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
                    this.alert(e + $L("check-config-file-with-line", line), null, function () {
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
                        loadURI(url);
                    } catch (e) {
                        gBrowser.loadURI(url, {
                            triggeringPrincipal: gBrowser.contentPrincipal
                        });
                    }
                } else if (where) {
                    if (CopyCatUtils.appVersion < 78) {
                        openUILinkIn(uri.spec, where, false, postData || null);
                    } else {
                        openUILinkIn(uri.spec, where, {
                            postData: postData || null,
                            triggeringPrincipal: where === 'current' ? gBrowser.selectedBrowser.contentPrincipal : (/^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal())
                        });
                    }
                } else if (event.button == 1) {
                    if (typeof openNewTabWith !== "undefined") {
                        openNewTabWith(uri.spec);
                    } else {
                        openUILinkIn(uri.spec, 'tab', {
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
                    console.error($L("param is invalid", "this.edit", "pathOrFile"));
                    return;
                }

                try {
                    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                } catch (e) { }

                if (!editor || !editor.exists()) {
                    alert($L('please set editor path'));
                    let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                    fp.init(window, $L('set global editor'), fp.modeOpen);
                    if (this.platform === "win")
                        fp.appendFilter($L('executable files'), "*.exe");

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
                    console.error($L("param is invalid", "this.exec", "pathOrFile"));
                    return;
                }
                var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
                try {
                    var a;
                    if (typeof arg == "undefined") arg = []; // fix slice error
                    if (typeof arg == 'string' || arg instanceof String) {
                        a = arg.split(/\s+/)
                    } else if (Array.isArray(arg)) {
                        a = arg;
                    } else {
                        a = [arg];
                    }

                    if (!aFile.exists()) {
                        console.error($L("file not found", path));
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
                    console.log("Insert item is null!");
                    return;
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
                        if (item.hasAttribute('orgClosemenu')) {
                            item.setAttribute('closemenu', item.getAttribute('orgClosemenu'));
                            item.removeAttribute('orgClosemenu');
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

    function $C(doc, tag, attrs, skipAttrs) {
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

    function $L() {
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
            console.error($L("param is invalid", "CopyCat.getFile", "pathOrFile: %s", pathOrFile));
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
            console.error($L("param is invalid", "CopyCat.saveFile", "pathOrFile"));
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
            console.error($L("param is invalid", "CopyCat.readFile", "pathOrFile"));
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
    list-style-image:url(data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI2LjQ2MDkzOCA0LjQ2Njc5NjlDMjQuNjY4OCA0LjUyNTY1MDMgMjMgNS45ODM0NzYyIDIzIDcuOTQ1MzEyNUwyMyAxNC43MDcwMzFDMjMgMTUuMTU4MDY1IDIzLjE4NTUyNyAxNS41NjA1NzIgMjMuMjQyMTg4IDE2TDIxLjUgMTZDMTUuOTMzNDY5IDE2IDEwLjk5Mjc3MyAxOC44MDgwNTMgOCAyMy4wNjgzNTlMOCAxOS41QzggMTYuNTE2NDM4IDkuMDAxODM4MSAxMy41NzM5OTIgMTAuNjg5NDUzIDExLjQ0NzI2NkMxMi4zNzcwNjggOS4zMjA1Mzg2IDE0LjY2NzMzNiA4IDE3LjUgOCBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxNy41IDVDMTMuNzA1NjY0IDUgMTAuNDk1NDc5IDYuODY1NTA3OSA4LjMzOTg0MzggOS41ODIwMzEyQzYuMTg0MjA4OCAxMi4yOTg1NTUgNSAxNS44NTY1NjIgNSAxOS41TDUgMzIuNSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCA1LjAwNzgxMjUgMzIuNjY5OTIyQzUuMDkxOTgxMiAzOC4zNzQxMyA5LjM2MzA0MTQgNDMuMDgzNzMxIDE0Ljg3NSA0My44NzEwOTQgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMTUuNSA0NEwzOS41IDQ0QzQxLjQxNDk1NSA0NCA0MyA0Mi40MTQ5NTUgNDMgNDAuNUM0MyAzOC4zNTc3NCA0MS43NjM2NDIgMzYuNDgyNDg4IDM5Ljk1NzAzMSAzNS41ODAwNzhMMzkuOTU1MDc4IDM1LjU3ODEyNUMzOS4zMTczNDggMzUuMjU4NTM1IDM0LjIwMzU1OSAzMi44OTAwMjEgMzQuMDE3NTc4IDI0LjkzMzU5NEMzOS4wMzkzNzEgMjQuNDE2MDM2IDQzIDIwLjE1ODE4OCA0MyAxNC45OTgwNDdMNDMgNy45NDUzMTI1QzQzIDUuMzI5MjM0NCA0MC4wMzQ0MjQgMy42MTAxNDQgMzcuNzYzNjcyIDQuOTA4MjAzMSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzNy40MDAzOTEgNS4xOTcyNjU2TDM0LjgzNzg5MSA4TDMxLjE2MDE1NiA4TDI4LjU5OTYwOSA1LjE5NzI2NTYgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjguMjM2MzI4IDQuOTA4MjAzMUMyNy42Njg1MTcgNC41ODM2MTgyIDI3LjA1ODMxNiA0LjQ0NzE3OTEgMjYuNDYwOTM4IDQuNDY2Nzk2OSB6IE0gMzkuNTgyMDMxIDcuNDQzMzU5NEMzOS42NTM2NjIgNy40MzQ2Mzc1IDM5LjcyMDQ5NyA3LjQ0MDgzODcgMzkuNzc1MzkxIDcuNDcyNjU2MkMzOS45MTI4OCA3LjU1MjM0NzUgNDAgNy43MTczNTE2IDQwIDcuOTQ1MzEyNUw0MCAxNC45OTgwNDdDNDAgMTkuMDM3MTU1IDM2LjY0MTcwNyAyMi4yNTA4NzggMzIuNTMxMjUgMjEuOTg0Mzc1QzI4LjgzMzk3OCAyMS43NDQ2MDEgMjYgMTguNDc5NDQ4IDI2IDE0LjcwNzAzMUwyNiA3Ljk0NTMxMjVDMjYgNy41MzcwMzU5IDI2LjI5ODIzMiA3LjM3Nzc0MDUgMjYuNjQyNTc4IDcuNTAzOTA2MkwyOS4zOTI1NzggMTAuNTExNzE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMwLjUgMTFMMzUuNSAxMSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzNi42MDc0MjIgMTAuNTExNzE5TDM5LjM1NzQyMiA3LjUwMzkwNjJDMzkuNDMzOTcyIDcuNDc1NzI2MyAzOS41MTA0IDcuNDUyMDgxMiAzOS41ODIwMzEgNy40NDMzNTk0IHogTSAyOS41IDEzIEEgMS41IDEuNSAwIDAgMCAyOS41IDE2IEEgMS41IDEuNSAwIDAgMCAyOS41IDEzIHogTSAzNi41IDEzIEEgMS41IDEuNSAwIDAgMCAzNi41IDE2IEEgMS41IDEuNSAwIDAgMCAzNi41IDEzIHogTSAyMy45NzY1NjIgMTguOTI3NzM0QzI1LjI3NDgzNyAyMS44NDU2NjUgMjcuODEyMzM4IDI0LjEyNzIgMzEuMDEzNjcyIDI0Ljc5Njg3NUMzMS4xNTc5MzkgMzQuMjQ5NDc1IDM3LjkzNzk0NiAzNy45MjMwMzQgMzguNjEzMjgxIDM4LjI2MTcxOSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzOC42MTUyMzQgMzguMjYxNzE5QzM5LjQzMzIwOCAzOC42Njk3OTUgNDAgMzkuNTA3MjU1IDQwIDQwLjVDNDAgNDAuNzk1MDQ1IDM5Ljc5NTA0NSA0MSAzOS41IDQxTDI4Ljk0NzI2NiA0MUMyOC45NzI2NSA0MC44MzE1OTUgMjkgNDAuNjYzMTMzIDI5IDQwLjQ4ODI4MUMyOSAzNy45NTM4NzMgMjcuMjQ3NDYgMzUuODA2MzEgMjQuODk4NDM4IDM1LjE4NTU0N0MyNC4yNTMwMDIgMzAuNTc1MzQ1IDIwLjI4MTk4NiAyNyAxNS41IDI3TDE0LjUgMjcgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgMTQuNSAzMEwxNS41IDMwQzE5LjA3MzU5MSAzMCAyMS45NDA4ODUgMzIuODQwMTg3IDIxLjk5NDE0MSAzNi40MDAzOTEgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuMTAzNTE2IDM3LjA3MDMxMiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMi4xMTEzMjggMzcuMDkxNzk3IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIyLjEzMjgxMiAzNy4xMzg2NzIgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjMuNjQ2NDg0IDM4LjAxMzY3MkMyNC45NzI0NjYgMzguMDgzMzg2IDI2IDM5LjE0MjM2NCAyNiA0MC40ODgyODFDMjYgNDAuNzg4MyAyNS43ODc0NyA0MSAyNS40ODgyODEgNDFMMTYuNSA0MUMxMS43ODc2MSA0MSA4IDM3LjIxMjM5IDggMzIuNUM4IDI1LjA2ODE4MiAxNC4wNjgxODIgMTkgMjEuNSAxOUwyMy41IDE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIzLjk3NjU2MiAxOC45Mjc3MzQgeiIgLz4NCjwvc3ZnPg==);
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
}
.CopyCat-View .subviewbutton:not(.noIcon) > .toolbarbutton-icon {
    display: -moz-inline-box !important;
    width: 16px;
    height: 16px;
}
.CopyCat-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-text,
.CopyCat-View .subviewbutton > .toolbarbutton-text {
    padding-inline-start: 8px !important;
}
.CopyCat-View .toolbaritem-combined-buttons:is(.showFirstText,.showText) > .subviewbutton:first-child > .toolbarbutton-text {
    display: -moz-inline-box !important;
    padding-inline-start: 8px !important;
}
.CopyCat-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:not(:first-child) > .toolbarbutton-text {
    display: none !important;
}
.CopyCat-View .toolbaritem-combined-buttons > .subviewbutton-iconic > .toolbarbutton-text, .TabPlus-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-icon {
    display: -moz-inline-box !important;
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
    padding-block: 0.5em;
}

.CopyCat-Group > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup:not(.showFirstText) > .menuitem-iconic {
    padding-inline-start: 1em;
}
.CopyCat-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
.CopyCat-Group > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menugroup > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menuseparator + menuseparator {
    display: none;
}

.CopyCat-Group.showFirstText > :is(menu, menuitem):first-child,
.CopyCat-Group.showText > :is(menu, menuitem) {
    -moz-box-flex: 1;
    padding-inline-end: .5em;
}
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
    padding-left: 0;
    -moz-box-flex: 0;
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
`)
