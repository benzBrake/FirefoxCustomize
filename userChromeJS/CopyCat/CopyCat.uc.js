// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.3.0
// @compatibility   Firefox 80
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            0.3.0 整理代码，移除 tool 属性支持，减小 css 影响范围，修复移动主菜单栏项目事件失效，增加多语言支持
// ==/UserScript==
(async function (CSS, SS_SERVICE, DEFINED_MENUS_OBJ, SEPARATOR_TYPE) {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    let _bmSource = await new Promise((resolve, reject) => {
        if (Services.vc.compare(Services.appinfo.version, "130a1")) {
            resolve("");
        }
        fetch("chrome://browser/content/browser-menubar.js")
            .then(response => {
                if (!response.ok) {
                    reject(`Error: ${response.status}`);
                }
                return response.text();
            })
            .then(data => resolve(data))
            .catch(error => reject(error));
    });

    const bmSource = typeof _bmSource === "string" ? _bmSource.replace(/.*let mainMenuBar/is, 'let mainMenuBar').replace(/},\n\s+{ once: true }.*/is, '').replace("main-menubar", "CopyCat-Popup").replace('.getElementById("historyMenuPopup")', '.querySelector("#CopyCat-Popup #historyMenuPopup")').replaceAll('getElementById("history-menu")', 'querySelector("#CopyCat-Popup #history-menu")').replace('.getElementById("menu_EditPopup")', '.querySelector("#CopyCat-Popup #menu_EditPopup")') : "";

    const xPref = {
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
            let o = (q, w, e) => (b(xPref.get(e), e));
            Services.prefs.addObserver(a, o);
            return { pref: a, observer: o }
        },
        removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
    };

    const CopyCat = {
        _style: null,
        get PLATFORM () {
            delete this.PLATFORM;
            return this.PLATFORM = AppConstants.platform;
        },
        get DEGUG () {
            return xPref.get("extensions.CopyCat.debug", false);
        },
        get FILE () {
            var path = xPref.get("userChromeJS.CopyCat.FILE_PATH", "_copycat.js")
            var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);
            if (!aFile.exists()) {
                alerts('配置文件为空');
            }
            delete this.FILE;
            return this.FILE = aFile;
        },
        EXEC_BMS: false,
        STYLE: {
            url: makeURI("data:text/css;charset=utf-8," + encodeURIComponent(CSS)),
            type: Services.vc.compare(Services.appinfo.version, "118.0.2") ? SS_SERVICE.USER_SHEET : SS_SERVICE.AUTHOR_SHEET
        },
        init: async function () {
            // 载入样式
            if (!SS_SERVICE.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
                SS_SERVICE.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
            }
            if (typeof userChrome_js === "object" && "L10nRegistry" in userChrome_js) {
                this.l10n = new DOMLocalization(["CopyCat.ftl"], false, userChrome_js.L10nRegistry);
                let keys = ["copycat-button", "copycat-open-chrome-folder", "copycat-menu-restart", "copycat-edit-config", "copycat-reload-config", "copycat-about"];
                messages = await this.l10n.formatValues(keys);
                this.MESSAGES = (() => {
                    let obj = {};
                    for (let index of messages.keys()) {
                        obj[keys[index]] = messages[index];
                    }
                    return obj;
                })();
            } else {
                this.l10n = {
                    formatValue: async function () {
                        return "";
                    },
                    formatMessages: async function () {
                        return "";
                    },
                    translateRoots () { },
                    connectRoot () { }
                }
                this.MESSAGES = {
                    "copycat-button": "CopyCat Button",
                    "copycat-open-chrome-folder": "Open chrome folder",
                    "copycat-menu-restart": "Restart Firefox",
                    "copycat-edit-config": "Modify CopyCat config",
                    "copycat-reload-config": "Reload CopyCat config",
                    "copycat-about": "About CopyCat"
                }
            }

            this.MESSAGES.format = function (str_key, ...args) {
                let str;
                if (str_key in this) {
                    str = this[str_key];
                    for (let i = 0; i < args.length; i++) {
                        if (!str.includes('%s')) break;
                        str = str.replace(/%(s|d)/, args[i]);
                    }
                } else {
                    str = ''
                }
                return str;
            }

            // 避免第二个窗口报错
            try {
                CustomizableUI.createWidget({
                    id: 'CopyCat-Btn',
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    type: "custom",
                    onBuild: doc => this.createButton(doc)
                });

            } catch (ex) { }
            this.btn = CustomizableUI.getWidget('CopyCat-Btn').forWindow(window)?.node;
            if (!this.btn) return;
            this.l10n.connectRoot(this.btn);
            this.btn.appendChild(this.createDefaultPopup(this.btn.ownerDocument));
            await this.rebuild();
        },
        createButton: function (doc) {
            let btn = createElement(doc, 'toolbarbutton', {
                id: 'CopyCat-Btn',
                label: 'CopyCat Button',
                'data-l10n-id': 'copycat-button',
                type: 'menu',
                class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                onclick: function (event) {
                    if (event.target.id !== "CopyCat-Btn") return;
                    if (event.button === 2) {
                        if (window.AM_Helper) {
                            event.preventDefault();
                            event.stopPropagation();
                            const b = 'openAddonsMgr';
                            eval(`${parseInt(Services.appinfo.version) < 126
                                ? "Browser" + b[0].toUpperCase() + b.slice(1)
                                : "BrowserAddonUI." + b}("addons://list/userchromejs")`);
                        }
                    }
                }
            });
            return btn;
        },
        createDefaultPopup: function (doc) {
            let mp = createElement(doc, "menupopup", {
                id: "CopyCat-Popup",
                class: "CopyCat-Popup"
            });
            if (Array.isArray(DEFINED_MENUS_OBJ)) {
                DEFINED_MENUS_OBJ.forEach(obj => {
                    let menuitem = this.newMenuitem(doc, obj);
                    mp.appendChild(menuitem);
                });
            }
            mp.addEventListener("popupshowing", this, false);
            mp.addEventListener("popuphiding", this, false);
            return mp;
        },
        handleEvent: function (event) {
            if (typeof this["on" + event.type] === "function") {
                this["on" + event.type](event);
            } else {
                this.log('[handleEvent] Unhandled event: ' + event.type);
            }
        },
        onpopupshowing: async function (event) {
            let mp = event.target;
            mp.setAttribute("HideNoneDynamicItems", xPref.get("userChromeJS.CopyCat.hideInternal", false));
        },
        newMenugroup: function (doc, obj) {
            if (!doc || !obj) return;
            let group = createElement(doc, "menugroup", obj, ["group"]);
            group.classList.add("CopyCat-Group");
            obj.group.forEach(o => {
                group.appendChild(this.newMenuitem(doc, o));
            })
            this.log("[newMenugroup] Creating Menugroup: " + (obj.label || "<empty label>"), group);
            return group;
        },
        newMenupopup: function (doc, obj) {
            if (!doc || !obj) return;
            let aItem;

            aItem = createElement(doc, "menu", obj, ["popup", "onBuild"]);
            this.log("[newMenupopup] Creating Menu " + (obj.label || "<empty label>"), aItem);
            aItem.classList.add("menu-iconic");
            let menupopup = aItem.appendChild(createElement(doc, "menupopup"));
            obj.popup.forEach(mObj => menupopup.appendChild(this.newMenuitem(doc, mObj)));

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
            let classList = [], tagName = obj.type || "menuitem";
            // 分隔符
            if (SEPARATOR_TYPE.includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.labelRef && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref) {
                return createElement(doc, "menuseparator", obj, ['type', 'group', 'popup']);
            }
            if (['checkbox', 'radio'].includes(obj.type)) tagName = "menuitem";
            if (obj.class) obj.class.split(' ').forEach(c => {
                if (!classList.includes(c)) classList.push(c);
            });

            if (obj.type && obj.type.startsWith("html:")) {
                tagName = obj.type;
                delete obj.type;
            }

            classList.push("menuitem-iconic");

            if (obj.exec) {
                obj.exec = handleRelativePath(obj.exec);
            }

            if (obj.command) {
                // 移动菜单
                obj.clone = obj.clone || false;
                let org = $(obj.command, doc),
                    dest;
                if (org) {
                    dest = dest = obj.clone ? org.cloneNode(true) : org;
                    if (dest.localName === "menu") {
                        // fix close menu
                        if (dest.hasAttribute('closemenu'))
                            dest.setAttribute('orgClosemenu', dest.getAttribute('closemenu'));
                        dest.setAttribute('closemenu', 'none');

                        if (obj.clone && obj['fix-id']) {
                            // fix id
                            if (dest.id) {
                                dest.id += '_clone';
                            }
                            dest.querySelectorAll('menu,menupopup,menuseparator').forEach(item => {
                                if (item.id) item.id += '_clone';
                            });
                            // add command
                            let menuitems = dest.querySelectorAll('menuitem');
                            for (let i = 0; i < menuitems.length; i++) {
                                let item = menuitems[i];
                                if (item.localName === 'menuitem') {
                                    command_id = item.getAttribute('id');
                                    if (command_id && !dest.getAttribute('command')) {
                                        item.setAttribute('id', command_id + '_clone');
                                        item.setAttribute('command', command_id);
                                        item.setAttribute("oncommand", "CopyCat.onCommand(event);");
                                    }
                                }
                            }
                        }
                    }
                    if (org.closest('#main-menubar')) {
                        dest.setAttribute("fromMenubar", true);
                        this.EXEC_BMS = true;
                    }
                    if ('class' in obj) {
                        // fix menu icon
                        dest.setAttribute('orgClass', dest.getAttribute('class'));
                        dest.setAttribute('class', obj.class);
                        if (obj.class.split(' ').includes("menu-iconic")) {
                            // fix menu left icon
                            if (!dest.querySelector(':scope>.menu-iconic-left')) {
                                let left = dest.insertBefore(createElement(doc, 'hbox', {
                                    class: 'menu-iconic-left',
                                    align: 'center',
                                    pack: 'center',
                                    'aria-hidden': true
                                }), dest.firstChild);
                                left.appendChild(createElement(doc, 'image', {
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
                            let orgName = 'org' + attr.slice(0, 1).toUpperCase() + attr.slice(1);
                            if (dest.hasAttribute(attr)) {
                                dest.setAttribute(orgName, org.getAttribute(attr));
                            } else {
                                dest.setAttribute(orgName, "")
                            }
                            if (attr === "image") {
                                dest.style.listStyleImage = `url(${obj['image']})`;
                                dest.removeAttribute("image");
                            } else {
                                dest.setAttribute(attr, obj[attr]);
                            }
                        }
                    });

                    // fix menu-right
                    if (!obj.clone && obj["menu-right"]) {
                        dest.setAttribute("removeMenuRight", "true");
                        let right = dest.appendChild(createElement(doc, 'hbox', {
                            class: 'menu-right',
                            align: 'center',
                            'aria-hidden': true
                        }));
                        right.appendChild(createElement(doc, 'image'));
                    }

                    if ('onBuild' in obj && typeof dest !== 'undefined') {
                        if (typeof obj.onBuild === "function") {
                            obj.onBuild.call(org, doc, dest);
                        } else {
                            eval("(" + obj.onBuild + ").call(org, doc, dest)");
                        }
                    }

                    let replacement = createElement(doc, 'menuseparator', {
                        hidden: true, class: 'CopyCat-Replacement', 'original-id': obj.command
                    });
                    if (!obj.clone) {
                        dest.setAttribute('restoreBeforeUnload', 'true');
                        dest.restoreHolder = replacement;
                        dest.parentNode.insertBefore(replacement, dest);
                        this.log('Moving Item: ' + obj.command, dest);
                    } else {
                        this.log('Cloning Item: ' + obj.command, dest);
                    }

                    return dest;
                } else if (!'placehoder' in obj || obj.placeholder) {
                    return createElement(doc, 'menuseparator', {
                        class: "CopyCat-Replacement",
                        hidden: true
                    });
                } else {
                    return;
                }
            } else {
                item = createElement(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                if (classList.length) item.setAttribute('class', classList.join(' '));
                applyAttr(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type', 'value']);
                let label = obj.label || obj.command || obj.oncommand || "";
                if (label)
                    item.setAttribute('label', label);

                if (obj.pref) {
                    let type = obj.type || xPref.getType(obj.pref) || 'prompt';
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
                        item.setAttribute('checked', !!xPref.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                    } else {
                        let value = xPref.get(obj.pref);
                        if (type === "prompt") {
                            item.setAttribute('value', value);
                            item.setAttribute('label', sprintf(obj.labelRef || obj.label, value));
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

            this.log("Creating Item: ", (item.label || "<empty label>"), item);

            return item;
        },
        setIcon: function (menu, obj) {
            if (menu.getAttribute("type") === "checkbox") return;
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon")) return;
            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    this.error(e);
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
                } catch (e) { }
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
        onCommand: function (event) {
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
                let setVal = xPref.get(pref, false, !!item.getAttribute('defaultValue'));
                xPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'radio') {
                if (item.hasAttribute('value')) {
                    xPref.set(pref, item.getAttribute('value'));
                }
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), xPref.get(pref, item.getAttribute('default') || ""));
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
                    xPref.set(pref, val);
                }
            }
        },
        openCommand: function (event, url, aWhere, aAllowThirdPartyFixup = {}, aPostData, aReferrerInfo) {
            const isJavaScriptURL = url.startsWith("javascript:");
            const isWebURL = /^(f|ht)tps?:/.test(url);
            const where = event.button === 1 ? 'tab' : aWhere;

            // Assign values to allowThirdPartyFixup if provided, or initialize with an empty object
            const allowThirdPartyFixup = { ...aAllowThirdPartyFixup };

            // 遵循容器设定
            if (!allowThirdPartyFixup.userContextId && isWebURL) {
                allowThirdPartyFixup.userContextId = gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.getAttribute("userContextId") || null;
            }

            if (aPostData) {
                allowThirdPartyFixup.postData = aPostData;
            }
            if (aReferrerInfo) {
                allowThirdPartyFixup.referrerInfo = aReferrerInfo;
            }

            // Set triggeringPrincipal based on 'where' and URL scheme
            allowThirdPartyFixup.triggeringPrincipal = (() => {
                if (where === 'current' && !isJavaScriptURL) {
                    return gBrowser.selectedBrowser.contentPrincipal;
                }

                const userContextId = isWebURL ? allowThirdPartyFixup.userContextId : null;
                return isWebURL ?
                    Services.scriptSecurityManager.createNullPrincipal({ userContextId }) :
                    Services.scriptSecurityManager.getSystemPrincipal();
            })();

            if (isJavaScriptURL) {
                openTrustedLinkIn(url, 'current', {
                    allowPopups: true,
                    inBackground: allowThirdPartyFixup.inBackground || false,
                    allowInheritPrincipal: true,
                    private: PrivateBrowsingUtils.isWindowPrivate(window),
                    userContextId: allowThirdPartyFixup.userContextId,
                });
            } else if (where || event.button === 1) {
                openTrustedLinkIn(url, where, allowThirdPartyFixup);
            } else {
                openUILink(url, event, {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                });
            }
        },
        editConfig: function () {
            this.edit(this.FILE.path);
        },
        edit: function (path, aLineNumber) {
            let aFile = getFile(path), editor;
            if (!aFile) {
                this.error("[edit] Param is invalid: " + path);
                return;
            }

            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) { }

            if (!editor || !editor.exists()) {
                alert("Please set editor path");
                let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
                fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                    ? window.browsingContext
                    : window, "Choose a global editor.", fp.modeOpen);

                fp.appendFilters(Ci.nsIFilePicker.filterApps);

                var isCompleted = false;
                if (typeof fp.show !== 'undefined') {
                    if (fp.show() == fp.returnCancel || !fp.file)
                        return;
                    else {
                        editor = fp.file;
                        Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        isCompleted = true;
                    }
                } else {
                    fp.open(res => {
                        if (res != Ci.nsIFilePicker.returnOK) return;
                        editor = fp.file;
                        Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        isCompleted = true;
                    });
                }
                var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                while (!isCompleted) {
                    thread.processNextEvent(true);
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
        exec: function (path, arg) {
            let aFile = getFile(path);
            if (!aFile) {
                this.error("[exec] path is invalid" + path);
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
                    console.error("[exec] file not found", path);
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
                this.error(e);
            }
        },
        rebuild: async function (isAlert = false) {
            if (this.initializing) return;
            this.initializing = true;
            this.uninit();
            this.btn.appendChild(this.createDefaultPopup(this.btn.ownerDocument));
            await this.makeMenus();
            if (isAlert || this.NEED_ALERT) {
                this.NEED_ALERT = false;
                alerts("CopyCat 重新加载完毕");
            }
            this.initializing = false;
        },
        makeMenus: async function () {
            let mp = $('#CopyCat-Popup', this.btn);
            if (!mp) return;
            if (!this.FILE.exists()) {
                await IOUtils.writeUTF8(this.FILE.path, '');
            }
            let d = await IOUtils.readUTF8(this.FILE.path);
            if (!d) return;
            let sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
            sandbox.Components = Components;
            sandbox.Cc = Cc;
            sandbox.Ci = Ci;
            sandbox.Cr = Cr;
            sandbox.Cu = Cu;
            sandbox.Services = Services;
            sandbox.CustomizableUI = CustomizableUI;
            sandbox.CopyCat = this;
            sandbox.console = console;
            sandbox['_menus'] = [];
            sandbox['_css'] = [];
            sandbox['menus'] = function (itemObj) {
                ps(itemObj, sandbox['_menus']);
            }
            function ps (item, array) {
                ("join" in item && "unshift" in item) ? [].push.apply(array, item) : array.push(item);
            }

            try {
                var lineFinder = new Error();
                Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\nfunction lang(obj) { Object.assign(this._lang, obj); }" + d, sandbox, "1.8");
            } catch (e) {
                let line = e.lineNumber - lineFinder.lineNumber - 1;
                alerts(e + sprintf("\nPlease check config file by line %s", line), null, function () {
                    this.edit(this.FILE, line);
                });
                return console.error(e);
            }

            let { ownerDocument: aDoc } = mp;
            sandbox._menus.forEach((itemObj) => {
                this.insertMenuitem(aDoc, itemObj, this.newMenuitem(aDoc, itemObj));
            });
            if (sandbox._css.length) {
                this.MENU_STYLE = addStyle(sandbox.css.join('\n'));
            }

            if (this.EXEC_BMS && bmSource) {
                eval(bmSource);
                this.EXEC_BMS = false;
            }
        },
        insertMenuitem (doc, obj, item) {
            if (!item) {
                this.log("[insertMenuitem] Item to be inserted is null!");
                return;
            } else {
                this.log("[insertMenuitem] Inserting item: " + item.getAttribute('label'), item);
            }
            if (item.getAttribute('restoreBeforeUnload') !== 'true') {
                item.classList.add('CopyCat-Dynamic');
            }

            const aPopup = $('CopyCat-Popup', doc);
            if (obj && obj.insertBefore && $(obj.insertBefore, doc)) {
                $(obj.insertBefore, doc).before(item)
            } else if (obj && obj.insertAfter && $(obj.insertAfter, doc)) {
                $(obj.insertBefore, doc).after(item)
            } else if ($('#CopyCat-InsertPoint', aPopup)) {
                aPopup.insertBefore(item, $('#CopyCat-InsertPoint', aPopup));
            } else {
                aPopup.appendChild(item);
            }
        },
        uninit () {
            let mp = $('#CopyCat-Popup', this.btn);
            if (mp) {
                mp.removeEventListener("popupshowing", this, false);
                mp.removeEventListener("popuphiding", this, false);
                rmip(mp);
                /**
                 * 删除菜单具体函数，根据菜单属性判定是移回原位还是直接删除
                 * 
                 * @param {HTMLElement} mp 弹出菜单对象
                 */
                function rmip (mp) {
                    $$('[restoreBeforeUnload="true"]', mp, item => {
                        item.removeAttribute("closemenu");
                        item.removeAttribute("fromMenubar")
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
                            removeElement(item.querySelector(":scope > .menu-iconic-left"));
                            item.removeAttribute("removeMenuLeft");
                            item.classList.remove("menu-iconic");
                            let label = item.querySelector(':scope>.menu-iconic-text');
                            if (label) label.className = 'menu-text';
                        }
                        if (item.getAttribute("removeMenuRight") == "true") {
                            removeElement(item.querySelector(":scope > .menu-right"));
                            item.removeAttribute("removeMenuRight")
                        }
                        let { restoreHolder } = item;
                        if (restoreHolder) {
                            restoreHolder.parentNode.insertBefore(item, restoreHolder);
                            removeElement(restoreHolder);
                            item.restoreHolder = null;
                        }
                        item.removeAttribute("restoreBeforeUnload");
                    });
                }
            }
            removeElement(mp, this.MENU_STYLE);
        },
        destroy () {
            if (this._style && SS_SERVICE.sheetRegistered(this._style.url, this._style.type)) {
                SS_SERVICE.unregisterSheet(this._style.url, this._style.type);
            }
        },
        log: function (...args) {
            if (!this.DEGUG) return;
            console.log('CopyCat:', ...args);
        },
        error: function (...args) {
            console.error('CopyCat:', ...args);
        }
    };

    /**
     * 选取 DOM 元素
     * 
     * @param {string} s id 或者 css 选择器
     * @param {Document|null} d 指定 document，不提供就是全局 document
     * @returns 
     */
    function $ (s, d) {
        s = s.trim();
        const isComplexSelector = /[#\.[:]/i.test(s);
        const doc = d instanceof Document ? d : (d ? d.ownerDocument : document);
        return isComplexSelector ? (d || document).querySelector(s) : doc.getElementById(s);
    }

    function $$ (s, d, fn) {
        s = s.trim();
        const isComplexSelector = /[#\.[:]/i.test(s);
        const doc = d instanceof Document ? d : (d ? d.ownerDocument : document);
        const elems = isComplexSelector ? (d || document).querySelectorAll(s) : doc.getElementsByTagName(s);

        if (typeof fn === "function") {
            // Avoids converting NodeList forEach in environments that support it natively
            elems.forEach ? elems.forEach(fn) : Array.from(elems).forEach(fn);
        }

        return elems;
    }

    /**
     * 创建 DOM 元素
     * 
     * @param {Document} d HTML 文档
     * @param {string} t DOM 元素标签
     * @param {Object} o DOM 元素属性键值对
     * @param {Array} s 跳过属性
     * @returns 
     */
    function createElement (d, t, o = {}, s = []) {
        if (!d) return;
        let e = /^html:/.test(t) ? d.createElement(t) : d.createXULElement(t);
        return applyAttr(e, o, s);
    }


    /**
     * 给 DOM 元素应用属性
     * 
     * @param {HTMLElement} e DOM 元素
     * @param {Object|null} o 属性键值对，使用 Object 方式存储
     * @param {Object|null} s 跳过属性
     * @returns 
     */
    function applyAttr (e, o = {}, s = []) {
        for (let [k, v] of Object.entries(o)) {
            if (s.includes(k)) continue;
            if (typeof v == "function") {
                e.setAttribute(k, typeof v === 'function' ? "(" + v.toString() + ").call(this, event);" : v);
            } else {
                e.setAttribute(k, v);
            }
        }
        return e;
    }

    /**
     * 删除多个 HTML 元素
     * 
     * @param {...HTMLElement} args - 一个或多个要删除的元素
     * @returns {Array<HTMLElement|null>} 已删除的元素数组，若元素不存在则返回 null
     */
    function removeElement (...args) {
        return args.map(e => e && e.parentNode ? e.parentNode.removeChild(e) : null);
    }

    /**
     * 右下角通知
     * 
     * @param {string} aMsg 消息内容
     * @param {string|null} aTitle 消息标题，不提供则为 CopyCat Button
     * @param {Function} aCallback 回掉函数
     */
    function alerts (aMsg, aTitle, aCallback) {
        var callback = aCallback ? {
            observe: function (subject, topic, data) {
                if ("alertclickcallback" != topic)
                    return;
                aCallback.call(null);
            }
        } : null;
        var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        alertsService.showAlertNotification(
            "chrome://devtools/skin/images/browsers/firefox.svg", aTitle || "CopyCat Button",
            aMsg + "", !!callback, "", callback);
    }

    /**
     * 格式化字符串
     * 
     * @param {string} f 格式字符串
     * @param  {...any} args 剩余参数，只能是数字和字符串
     * @returns 
     */
    function sprintf (f, ...args) {
        let s = f; for (let a of args) s = s.replace(/%[sd]/, a); return s;
    }

    /**
     * 获取 file:/// 链接
     * @param {Ci.nsIFile} f 
     * @returns 
     */
    function getURLSpecFromFile (f) {
        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        return fph.getURLSpecFromActualFile(f);
    }

    /**
     * 获取 nsIFile 对象
     * 
     * @param {path|nsIFile} path 
     * @returns 
     */
    function getFile (path) {
        let aFile;
        if (path instanceof Ci.nsIFile) {
            aFile = path;
        } else if (typeof path === "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            aFile.initWithPath(path);
        }
        return aFile;
    }

    /**
     * 处理相对路径
     * 
     * @param {string} path 疑似相对路径的路径
     * @param {string} parentPath 相对路径从哪里来，默认为 profile 目录
     * @returns 
     */
    function handleRelativePath (path, parentPath) {
        if (path) {
            var ffdir = parentPath ? parentPath : PathUtils.profileDir
            // windows 的目录分隔符不一样
            if (CopyCat.PLATFORM === "win") {
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

    function addStyle (css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    window.CopyCat = CopyCat;
    CopyCat.init();

    setTimeout("CopyCat.rebuild()", 3000);
})(`
@-moz-document url-prefix("chrome://browser/content/browser.x") {
#CopyCat-Btn > .toolbarbutton-icon {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPg0KICA8cGF0aCBkPSJNMjYuNDYwOTM4IDQuNDY2Nzk2OUMyNC42Njg4IDQuNTI1NjUwMyAyMyA1Ljk4MzQ3NjIgMjMgNy45NDUzMTI1TDIzIDE0LjcwNzAzMUMyMyAxNS4xNTgwNjUgMjMuMTg1NTI3IDE1LjU2MDU3MiAyMy4yNDIxODggMTZMMjEuNSAxNkMxNS45MzM0NjkgMTYgMTAuOTkyNzczIDE4LjgwODA1MyA4IDIzLjA2ODM1OUw4IDE5LjVDOCAxNi41MTY0MzggOS4wMDE4MzgxIDEzLjU3Mzk5MiAxMC42ODk0NTMgMTEuNDQ3MjY2QzEyLjM3NzA2OCA5LjMyMDUzODYgMTQuNjY3MzM2IDggMTcuNSA4IEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDE3LjUgNUMxMy43MDU2NjQgNSAxMC40OTU0NzkgNi44NjU1MDc5IDguMzM5ODQzOCA5LjU4MjAzMTJDNi4xODQyMDg4IDEyLjI5ODU1NSA1IDE1Ljg1NjU2MiA1IDE5LjVMNSAzMi41IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDUuMDA3ODEyNSAzMi42Njk5MjJDNS4wOTE5ODEyIDM4LjM3NDEzIDkuMzYzMDQxNCA0My4wODM3MzEgMTQuODc1IDQzLjg3MTA5NCBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAxNS41IDQ0TDM5LjUgNDRDNDEuNDE0OTU1IDQ0IDQzIDQyLjQxNDk1NSA0MyA0MC41QzQzIDM4LjM1Nzc0IDQxLjc2MzY0MiAzNi40ODI0ODggMzkuOTU3MDMxIDM1LjU4MDA3OEwzOS45NTUwNzggMzUuNTc4MTI1QzM5LjMxNzM0OCAzNS4yNTg1MzUgMzQuMjAzNTU5IDMyLjg5MDAyMSAzNC4wMTc1NzggMjQuOTMzNTk0QzM5LjAzOTM3MSAyNC40MTYwMzYgNDMgMjAuMTU4MTg4IDQzIDE0Ljk5ODA0N0w0MyA3Ljk0NTMxMjVDNDMgNS4zMjkyMzQ0IDQwLjAzNDQyNCAzLjYxMDE0NCAzNy43NjM2NzIgNC45MDgyMDMxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM3LjQwMDM5MSA1LjE5NzI2NTZMMzQuODM3ODkxIDhMMzEuMTYwMTU2IDhMMjguNTk5NjA5IDUuMTk3MjY1NiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyOC4yMzYzMjggNC45MDgyMDMxQzI3LjY2ODUxNyA0LjU4MzYxODIgMjcuMDU4MzE2IDQuNDQ3MTc5MSAyNi40NjA5MzggNC40NjY3OTY5IHogTSAzOS41ODIwMzEgNy40NDMzNTk0QzM5LjY1MzY2MiA3LjQzNDYzNzUgMzkuNzIwNDk3IDcuNDQwODM4NyAzOS43NzUzOTEgNy40NzI2NTYyQzM5LjkxMjg4IDcuNTUyMzQ3NSA0MCA3LjcxNzM1MTYgNDAgNy45NDUzMTI1TDQwIDE0Ljk5ODA0N0M0MCAxOS4wMzcxNTUgMzYuNjQxNzA3IDIyLjI1MDg3OCAzMi41MzEyNSAyMS45ODQzNzVDMjguODMzOTc4IDIxLjc0NDYwMSAyNiAxOC40Nzk0NDggMjYgMTQuNzA3MDMxTDI2IDcuOTQ1MzEyNUMyNiA3LjUzNzAzNTkgMjYuMjk4MjMyIDcuMzc3NzQwNSAyNi42NDI1NzggNy41MDM5MDYyTDI5LjM5MjU3OCAxMC41MTE3MTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMzAuNSAxMUwzNS41IDExIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM2LjYwNzQyMiAxMC41MTE3MTlMMzkuMzU3NDIyIDcuNTAzOTA2MkMzOS40MzM5NzIgNy40NzU3MjYzIDM5LjUxMDQgNy40NTIwODEyIDM5LjU4MjAzMSA3LjQ0MzM1OTQgeiBNIDI5LjUgMTMgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTYgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTMgeiBNIDM2LjUgMTMgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTYgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTMgeiBNIDIzLjk3NjU2MiAxOC45Mjc3MzRDMjUuMjc0ODM3IDIxLjg0NTY2NSAyNy44MTIzMzggMjQuMTI3MiAzMS4wMTM2NzIgMjQuNzk2ODc1QzMxLjE1NzkzOSAzNC4yNDk0NzUgMzcuOTM3OTQ2IDM3LjkyMzAzNCAzOC42MTMyODEgMzguMjYxNzE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM4LjYxNTIzNCAzOC4yNjE3MTlDMzkuNDMzMjA4IDM4LjY2OTc5NSA0MCAzOS41MDcyNTUgNDAgNDAuNUM0MCA0MC43OTUwNDUgMzkuNzk1MDQ1IDQxIDM5LjUgNDFMMjguOTQ3MjY2IDQxQzI4Ljk3MjY1IDQwLjgzMTU5NSAyOSA0MC42NjMxMzMgMjkgNDAuNDg4MjgxQzI5IDM3Ljk1Mzg3MyAyNy4yNDc0NiAzNS44MDYzMSAyNC44OTg0MzggMzUuMTg1NTQ3QzI0LjI1MzAwMiAzMC41NzUzNDUgMjAuMjgxOTg2IDI3IDE1LjUgMjdMMTQuNSAyNyBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxNC41IDMwTDE1LjUgMzBDMTkuMDczNTkxIDMwIDIxLjk0MDg4NSAzMi44NDAxODcgMjEuOTk0MTQxIDM2LjQwMDM5MSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMi4xMDM1MTYgMzcuMDcwMzEyIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIyLjExMTMyOCAzNy4wOTE3OTcgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuMTMyODEyIDM3LjEzODY3MiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMy42NDY0ODQgMzguMDEzNjcyQzI0Ljk3MjQ2NiAzOC4wODMzODYgMjYgMzkuMTQyMzY0IDI2IDQwLjQ4ODI4MUMyNiA0MC43ODgzIDI1Ljc4NzQ3IDQxIDI1LjQ4ODI4MSA0MUwxNi41IDQxQzExLjc4NzYxIDQxIDggMzcuMjEyMzkgOCAzMi41QzggMjUuMDY4MTgyIDE0LjA2ODE4MiAxOSAyMS41IDE5TDIzLjUgMTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjMuOTc2NTYyIDE4LjkyNzczNCB6Ii8+DQo8L3N2Zz4=);
}
#CopyCat-Btn > .toolbarbutton {
    -moz-context-properties: fill, fill-opacity, stroke, stroke-opacity !important;
    fill: var(--lwt-toolbarbutton-icon-fill, currentColor) !important;
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
    display: block;
}
.CopyCat-View menupopup[needsgutter] menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon,
.CopyCat-Popup menupopup[needsgutter] menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon {
    display: none;
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
#CopyCat-Popup[HideNoneDynamicItems="true"] :is(menu, menuitem, menuseparator, menugroup):not(.CopyCat-Dynamic) {
    display: none;
    visibility: collapsed;
}
}`, Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
    [{
        class: 'showFirstText',
        group: [{
            label: 'Open chrome folder',
            'data-l10n-id': 'copycat-open-chrome-folder',
            exec: '\\chrome',
        }, {
            label: 'Restart Firefox',
            tooltiptext: 'Restart Firefox',
            'data-l10n-id': 'copycat-menu-restart',
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
            label: 'Modify CopyCat config',
            'data-l10n-id': 'copycat-edit-config',
            image: "chrome://browser/skin/preferences/category-general.svg",
            oncommand: 'CopyCat.editConfig();'
        }, {
            label: 'Reload CopyCat config',
            tooltiptext: 'Reload CopyCat config',
            'data-l10n-id': 'copycat-reload-config',
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
            oncommand: 'CopyCat.rebuild(true);'
        }]
    }, {
        label: 'About CopyCat',
        'data-l10n-id': 'copycat-about',
        where: 'tab',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
        url: 'https://blog.iplayloli.com/firefox-ryan-personal-customization.html'
    }], ["separator", "menuseparator"])