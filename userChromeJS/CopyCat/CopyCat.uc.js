// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.3.3
// @compatibility   Firefox 80
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            0.3.3 fix unsave eval 使用 sandbox 替代 eval
// @note            0.3.2 修复 precommand / postcommand 触发，修复 pref 菜单 defaultValue 无效，修复 onCommand 兜底失效
// @note            0.3.1 修复重复绑定事件
// @note            0.3.0 整理代码，移除 tool 属性支持，减小 css 影响范围，修复移动主菜单栏项目事件失效，增加多语言支持
// ==/UserScript==
(async function (CSS, SS_SERVICE, DEFINED_MENUS_OBJ, SEPARATOR_TYPE, OPTION_TYPE, PATH_ATTRS) {
    const AUTOFIT_POPUP_POSITION = true;
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const alt = (aMsg, aTitle) => Services.prompt.alert(window, aTitle ?? Services.appinfo.name, aMsg)

    const sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
    Object.assign(sandbox, {
        window,
        document,
        Cc,
        Cu,
        Cr,
        Ci,
        Services
    });

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
                const that = this;
                alerts(this.MESSAGES.format("copycat-config-file-is-empty"), null, function () {
                    that.edit(aFile.path);
                });
            }
            delete this.FILE;
            return this.FILE = aFile;
        },
        CUSTOM_SHOWINGS: [],
        EXEC_BMS: false,
        STYLE: {
            url: makeURI("data:text/css;charset=utf-8," + encodeURIComponent(CSS)),
            type: Services.vc.compare(Services.appinfo.version, "118.0.2") ? SS_SERVICE.USER_SHEET : SS_SERVICE.AUTHOR_SHEET
        },
        init: async function () {
            sandbox.CopyCat = this;
            // 载入样式
            if (!SS_SERVICE.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
                SS_SERVICE.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
            }
            let _messages = {
                "copycat-button": "CopyCat Button",
                "copycat-open-chrome-folder": "Open chrome folder",
                "copycat-menu-restart": "Restart Firefox",
                "copycat-edit-config": "Modify CopyCat config",
                "copycat-reload-config": "Reload CopyCat config",
                "copycat-about": "About CopyCat",
                "copycat-reload-config-success": "Config reloaded successfully!",
                "copycat-config-file-is-empty": "Config file is empty, Click to edit!",
                "copycat-please-set-editor-path": "Please set editor path, please choose a text editor after clicking confirm.",
                "copycat-choose-a-text-editor": "Choose a text editor",
                "copycat-config-error-message": "Please check config file by line %s"
            };
            if (typeof userChrome_js === "object" && "L10nRegistry" in userChrome_js) {
                this.l10n = new DOMLocalization(["CopyCat.ftl"], false, userChrome_js.L10nRegistry);
                let keys = Object.keys(_messages);
                let messages = await this.l10n.formatValues(keys);
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
                this.MESSAGES = _messages;
            }

            this.MESSAGES.format = function (str_key, ...args) {
                let str;
                if (str_key in this) {
                    str = this[str_key];
                    str = sprintf(str, ...args);
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
            this.setPopupPosition();
            window.addEventListener("aftercustomization", this, false);
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
                class: "CopyCat-Popup",
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
        setPopupPosition: function () {
            if (!AUTOFIT_POPUP_POSITION) return;
            if (!this.btn) return;
            const { btn } = this;
            let mp = $("#CopyCat-Popup", btn);
            if (!mp) return;
            // 获取按钮的位置信息
            const rect = btn.getBoundingClientRect();
            // 获取窗口的宽度和高度
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const x = rect.left + rect.width / 2;  // 按钮的水平中心点
            const y = rect.top + rect.height / 2;  // 按钮的垂直中心点

            if (x < windowWidth / 2 && y < windowHeight / 2) {
                mp.removeAttribute("position");
            } else if (x >= windowWidth / 2 && y < windowHeight / 2) {
                mp.setAttribute("position", "after_end");
            } else if (x >= windowWidth / 2 && y >= windowHeight / 2) {
                mp.setAttribute("position", "before_end");
            } else {
                mp.setAttribute("position", "before_start");
            }
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
            if (mp.id !== "CopyCat-Popup") return;
            mp.setAttribute("HideNoneDynamicItems", xPref.get("userChromeJS.CopyCat.hideInternal", false));
            this.CUSTOM_SHOWINGS.filter(o => !o.disabled).forEach(function (obj) {
                var curItem = obj.item;
                try {
                    eval('(' + obj.fnSource + ').call(obj, curItem)');
                } catch (ex) {
                    console.error('Custom showing method error', obj.fnSource, ex);
                }
                if (obj.once) obj.disabled = true;
            });
        },
        onaftercustomization: function (event) {
            this.setPopupPosition();
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

            aItem = createElement(doc, "menu", obj, ["popup", "onbuild"]);
            this.log("[newMenupopup] Creating Menu " + (obj.label || "<empty label>"), aItem);
            aItem.classList.add("menu-iconic");
            let menupopup = aItem.appendChild(createElement(doc, "menupopup"));
            obj.popup.forEach(mObj => menupopup.appendChild(this.newMenuitem(doc, mObj)));
            if (obj.onbuild) {
                if (typeof obj.onbuild === "function") {
                    obj.onbuild(doc, item);
                } else {
                    eval("(" + obj.onbuild + ").call(item, doc, item)")
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
            let classList = [], tagName = obj.type || "menuitem", noDefaultLabel = !obj.label;

            // 分隔符
            if (SEPARATOR_TYPE.includes(obj.type) || obj.label === "separator" || !obj.group && !obj.popup && noDefaultLabel && !obj.tooltiptext && !obj.image && !obj.content && !obj.url && !obj.command && !obj.pref && !obj['data-l10n-id']) {
                return createElement(doc, "menuseparator", obj, ['type', 'group', 'popup']);
            }
            if (OPTION_TYPE.includes(obj.type)) tagName = "menuitem";
            if (obj.class) obj.class.split(' ').forEach(c => {
                if (!classList.includes(c)) classList.push(c);
            });

            if (obj.type && obj.type.startsWith("html:")) {
                tagName = obj.type;
                delete obj.type;
            }

            if (tagName === "menuitem") {
                classList.push("menuitem-iconic");
            } else if (tagName === "menu") {
                classList.push("menu-iconic");
            }

            // process relative path
            PATH_ATTRS.forEach(attr => {
                if (obj[attr]) {
                    obj[attr] = handleRelativePath(obj[attr]);
                }
            });

            if (obj.command) {
                // 移动菜单
                obj.clone = obj.clone || false;
                let org = $(obj.command, doc),
                    dest;
                if (org) {
                    dest = dest = obj.clone ? org.cloneNode(true) : org;

                    if (!obj.clone) {
                        // Save original attributes
                        const attrs = {};
                        dest.getAttributeNames().forEach(n => attrs[n] = dest.getAttribute(n));
                        dest.originalAttrs = attrs;
                    }

                    if (dest.localName === "menu") {
                        // fix close menu
                        if (dest.hasAttribute('closemenu'))
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

                    // Firefox 130 + need to bind events after move menuitem from main-menubar
                    if (org.closest('#main-menubar')) {
                        this.EXEC_BMS = true;
                    }

                    // fix menupopup indicator
                    if ($(':scope>.menubar-text', dest)) {
                        dest.setAttribute('menuright', true);
                    }

                    // convert class
                    if (obj.class) {
                        dest.setAttribute('class', obj.class.replace('...', dest.getAttribute('class') || ""));
                    }

                    // Support attribute insert for clone node
                    ["image", "style", "label", "tooltiptext", "type"].forEach(attr => {
                        if (attr in obj) {
                            dest.setAttribute(attr, obj[attr]);
                        }
                    });

                    // fix menuitem without icon struct
                    if (dest.hasAttribute('image') && (!dest.hasAttribute('menu-iconic') && !dest.hasAttribute('menuitem-iconic'))) {
                        this.CUSTOM_SHOWINGS.push({
                            item: dest,
                            fnSource: function (item) {
                                if (item.hasAttribute("image")) {
                                    if (item.querySelector(':scope>.menu-text, :scope>.menubar-text')) {
                                        item.style.setProperty('--menu-image', `url(${item.getAttribute('image')})`);
                                    }
                                }
                            }.toString(),
                            once: true
                        });
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
                } else {
                    return;
                }

                if ('onBuild' in obj && typeof dest !== 'undefined') {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild.call(org, doc, dest);
                    } else {
                        eval("(" + obj.onBuild + ").call(org, doc, dest)");
                    }
                }

                return dest;
            } else {
                item = createElement(doc, tagName, obj, ['popup', 'class', 'group', 'onBuild', 'precommand', 'postcommand']);
                if (classList.length) item.setAttribute('class', classList.join(' '));
                let label = obj.label || obj.command || obj.oncommand || obj.url || "";
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
                    if (!("defaultValue" in obj)) item.setAttribute('defaultValue', defaultVal[type]);
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

            if (noDefaultLabel && obj['data-l10n-href'] && obj["data-l10n-href"].endsWith(".ftl") && obj['data-l10n-id']) {
                // Localization 支持
                let strings = new Localization([obj["data-l10n-href"]], true); // 第二个参数为 true 则是同步返回
                item.setAttribute('label', strings.formatValueSync([obj['data-l10n-id']]) || item.getAttribute("label"));
            }

            if (obj.content) {
                item.innerHTML = obj.content;
                item.removeAttribute('content');
            }

            if (obj.oncommand || obj.command) return item;

            applyAttr(item, {
                'oncommand': 'CopyCat.onCommand(event);',
            });

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            this.log("Creating Item: ", (item.label || "<empty label>"), item);

            return item;
        },
        setIcon: function (menu, obj) {
            if (OPTION_TYPE.includes(menu.getAttribute("type") || "other")) return;
            if (menu.hasAttribute("src") || menu.hasAttribute("icon")) return;
            if (obj.image) {
                return setMenuImage(menu, obj.image);
            }
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
                        setMenuImage(menu, "moz-icon://" + getURLSpecFromFile(aFile) + "?size=16");
                    } else {
                        setMenuImage(menu, "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            if (obj.keyword) {
                let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                if (engine) {
                    if (engine.iconURI) {
                        engine.then(function (engine) {
                            setMenuImage(menu, getIconURL(engine));
                        });
                    }
                    return;
                    function getIconURL (engine) {
                        // Bug 1870644 - Provide a single function for obtaining icon URLs from search engines
                        return (engine._iconURI || engine.iconURI)?.spec || "chrome://browser/skin/search-engine-placeholder.png";
                    }
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
                            let iconURL = aURI && aURI.spec ?
                                "page-icon:" + aURI.spec :
                                "page-icon:" + uri.spec;
                            setMenuImage(menu, iconURL);
                        } catch (e) { }
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
            pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "",
                where = item.getAttribute("where") || "";

            const preCommandEvent = new Event('precommand', {
                bubbles: true,
                cancelable: true
            });
            item.dispatchEvent(preCommandEvent);

            if (pref)
                this.handlePref(event, pref);
            else if (edit)
                this.edit(edit);
            else if (exec)
                this.exec(exec, text);
            else if (url)
                this.openCommand(event, url, where);

            const postCommandEvent = new Event('postcommand', {
                bubbles: true,
                cancelable: true
            });
            item.dispatchEvent(postCommandEvent);

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
            if (aWhere?.indexOf('tab') >= 0 && gBrowser.selectedTab.isEmpty) {
                // remove empty tab
                aWhere = 'current';
            }
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
                alt(this.MESSAGES.format("copycat-please-set-editor-path"));
                let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
                fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                    ? window.browsingContext
                    : window, this.MESSAGES.format("copycat-choose-a-text-editor"), fp.modeOpen);

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
        exec: function (path, arg = []) {
            let aFile = getFile(path);
            if (!aFile) return this.error(`[exec] path is invalid: ${path}`);

            const process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);

            try {
                let a = Array.isArray(arg)
                    ? arg
                    : typeof arg === 'string' && arg.trim()
                        ? arg.split(/\s+/)
                        : [arg];

                if (!aFile.exists()) return console.error("[exec] file not found", path);

                // 检查是否为可执行文件，非目录情况下初始化进程
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
            this.setPopupPosition();
            let isError = !await this.makeMenus();
            if (!isError) {
                if (isAlert || this.NEED_ALERT) {
                    this.NEED_ALERT = false;
                    alerts(this.MESSAGES.format("copycat-reload-config-success"));
                }
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

            // 使用解构赋值来减少冗余声明
            Object.assign(sandbox, {
                window, document,
                Cu, Ci, Cr, Cc, Services, XPCOMUtils, ChromeUtils, AppConstants,
                gBrowser, updateEditUIVisibility, SessionStore,
                CopyCat: this, _menus: [], _css: []
            });

            sandbox.Components = Components;

            ["chrome://browser/content/places/controller.js", "chrome://browser/content/places/browserPlacesViews.js", "chrome://browser/content/browser-places.js"].forEach(scriptUrl => {
                ChromeUtils.compileScript(scriptUrl).then((r) => {
                    if (r) {
                        r.executeInGlobal(sandbox, { reportExceptions: true });
                    }
                }).catch(ex => console.error);
            });

            // 简化 menus 函数定义
            sandbox.menus = itemObj => ps(itemObj, sandbox._menus);
            function ps (item, array) {
                ("join" in item && "unshift" in item) ? [].push.apply(array, item) : array.push(item);
            }

            try {
                var lineFinder = new Error();
                Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\nfunction lang(obj) { Object.assign(this._lang, obj); }" + d, sandbox, "1.8"); 3
            } catch (e) {
                let line = e.lineNumber - lineFinder.lineNumber - 1;
                alerts(e + this.MESSAGES.format("copycat-config-error-message", line), null, function () {
                    this.edit(this.FILE, line);
                });
                console.error(e);
                return false;
            }

            let { ownerDocument: aDoc } = mp;
            sandbox._menus.forEach((itemObj) => {
                this.insertMenuitem(aDoc, itemObj, this.newMenuitem(aDoc, itemObj));
            });
            if (sandbox._css.length) {
                this.MENU_STYLE = addStyle(sandbox._css.join('\n'));
            }

            if (this.EXEC_BMS && $('#main-menubar > script')) {
                const CCjs = {};
                CCjs.res = await fetch($('#main-menubar > script').src);
                CCjs.text = (await CCjs.res.text()).replace(/.*let mainMenuBar/is, 'let mainMenuBar').replace(/},\n\s+{ once: true }.*/is, '').replace("main-menubar", "CopyCat-Popup").replace(/\.getElementById\("historyMenuPopup"\)\s*\./gm, '.querySelector("#CopyCat-Popup #historyMenuPopup")?.').replaceAll(/getElementById\("history-menu"\)\s*\./gm, 'querySelector("#CopyCat-Popup #history-menu")?.').replace(/.getElementById\("menu_EditPopup"\)\s*\./gm, '.querySelector("#CopyCat-Popup #menu_EditPopup")?.').replaceAll('?;', ';');
                try {
                    Cu.evalInSandbox(CCjs.text, sandbox);
                } catch (e) {
                    console.log(e);
                }
                this.EXEC_BMS = false;
            }
            return true;
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
                $(obj.insertAfter, doc).after(item)
            } else if ($('#CopyCat-InsertPoint', aPopup)) {
                aPopup.insertBefore(item, $('#CopyCat-InsertPoint', aPopup));
            } else {
                aPopup.appendChild(item);
            }
        },
        uninit () {
            this.CUSTOM_SHOWINGS = [];
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
                        if (item.originalAttrs) {
                            const originalKeys = Object.keys(item.originalAttrs);

                            // remove attrs not in originalAttrs
                            item.getAttributeNames().forEach(attr => {
                                if (!originalKeys.includes(attr)) item.removeAttribute(attr);
                            });

                            // restore attrs in originalAttrs
                            Object.entries(item.originalAttrs).forEach(([key, value]) => {
                                item.setAttribute(key, value);
                            });
                        }

                        $$(':scope>[deleteOnRemove]', item, item => removeElement(item));

                        let { restoreHolder } = item;
                        if (restoreHolder) {
                            // restore element to original position
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
        if (s.startsWith(">")) {
            s = ':scope' + s;
        }
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
            if (k.startsWith('on')) {
                let fn = (typeof v === "function") ? v : new Function('event', v);
                e.addEventListener(k.slice(2).toLocaleLowerCase(), fn, false);
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
     * @param {Function} aCallback 回调函数
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
        if (!args.length) return f;
        if (!args.indexOf("%")) return f;
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

    /**
     * 插入样式
     * @param {string} css 
     * @returns 
     */
    function addStyle (css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    /**
     * 设置菜单图标
     * 
     * @param {MozMenuItem|MozMenu} menu 
     * @param {string} imageUrl 
     */
    function setMenuImage (menu, imageUrl) {
        if (imageUrl) {
            if (menu.className.match(/-iconic/)) {
                menu.setAttribute("image", imageUrl);
            } else {
                menu.classList.add('menu-pesudo-icon');
                menu.style.setProperty("--menu-image", `url(${imageUrl})`);
            }
        }
    }

    window.CopyCat = CopyCat;
    CopyCat.init();

    setTimeout(() => {
        CopyCat.rebuild();
    }, 3000);
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
    padding-block: 0.5em;
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
.CopyCat-Popup :is(menu, menuitem)[style*="--menu-image"]:not([class*="iconic"]) {
    --cc-icon-size: 16px;
    --cc-icon-gap: 8px;
    padding-inline-start: calc(1em + var(--cc-icon-size) + var(--cc-icon-gap)) !important; 
}
.subviewbutton.reload,
.CopyCat-Popup .menuitem-iconic.reload {
    list-style-image: url(chrome://global/skin/icons/reload.svg) !important;
}
.CopyCat-Popup .menuitem-iconic.option {
    list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
}
.CopyCat-Popup .menuitem-iconic[type="checkbox"] > .menu-iconic-left[aria-hidden="true"]::before {
    display: flex;
    content: "";
    width: 16px;
    height: 16px;
}

.CopyCat-Popup :is(menu, menuitem)[style*="--menu-image"] {
    position: relative;
    background-image: var(--menu-image);
    background-size: var(--cc-icon-size) var(--cc-icon-size);
    background-repeat: no-repeat;
    background-position: 1em center;
}
.CopyCat-Popup menu[menuright="true"]:not(:has(>.menu-right)):not(.menu-iconic)::after {
    content: "";
    display: block;
    width: 16px;
    height: 16px;
    fill: currentColor;
    fill-opacity: var(--menu-icon-opacity);
    background-image: url("chrome://global/skin/icons/arrow-right.svg");
    margin-inline-end: 1em;
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
        id: 'CopyCat-Function-Group',
        class: 'showFirstText',
        group: [{
            id: 'CopyCat-OpenChromeFolder-Item',
            label: 'Open chrome folder',
            'data-l10n-id': 'copycat-open-chrome-folder',
            exec: '\\chrome',
        }, {
            id: 'CopyCat-Restart-Item',
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
        'data-l10n-id': "appmenuitem-more-tools",
        id: 'CopyCat-MoreTools-Item',
        image: 'data:image/svg+xml;utf8,%EF%BB%BF<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M7.6289062 3.0429688L6.2148438 4.4570312L11.095703 9.3378906L2.7363281 17.697266C1.7543281 18.680266 1.7533281 20.279719 2.7363281 21.261719C3.2123281 21.738719 3.8465313 22 4.5195312 22C5.1925313 22 5.8247813 21.737719 6.3007812 21.261719L14.660156 12.902344L18.585938 16.828125L19.292969 16.121094L22.824219 12.589844L18.919922 8.6445312L20.28125 7.28125L19.662109 6.6621094L17.337891 4.3378906L16.71875 3.71875L15.373047 5.0625L13.375 3.0429688L7.6289062 3.0429688 z M 9.6289062 5.0429688L12.539062 5.0429688L20.003906 12.582031L18.585938 14L9.6289062 5.0429688 z" /></svg>',
        popup: [{
            id: 'Copycat-Config-Group',
            class: 'showFirstText',
            group: [{
                label: 'Modify CopyCat config',
                'data-l10n-id': 'copycat-edit-config',
                image: 'chrome://browser/skin/preferences/category-general.svg',
                oncommand: 'CopyCat.editConfig();'
            }, {
                label: 'Reload CopyCat config',
                tooltiptext: 'Reload CopyCat config',
                'data-l10n-id': 'copycat-reload-config',
                style: 'list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);',
                oncommand: 'CopyCat.rebuild(true);'
            }]
        }, {
            label: 'About CopyCat',
            id: 'Copycat-About-Item',
            'data-l10n-id': 'copycat-about',
            where: 'tab',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
            url: 'https://blog.iplayloli.com/firefox-ryan-personal-customization.html'
        }]
    }, {
        id: 'CopyCat-Exit-Item',
        'data-l10n-id': 'appmenuitem-exit2',
        oncommand: "goQuitApplication(event);",
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M5.561 3.112c-.132-.32-.5-.474-.807-.314a7 7 0 1 0 6.492 0c-.306-.16-.675-.006-.807.314s.021.683.325.85a5.747 5.747 0 1 1-5.528 0c.303-.167.457-.53.325-.85Z"/><path fill-rule="evenodd" d="M8 1.375c.345 0 .625.28.625.625v6a.625.625 0 1 1-1.25 0V2c0-.345.28-.625.625-.625Z" clip-rule="evenodd"/></svg>'
    }], ["separator", "menuseparator"], ['checkbox', 'radio'], ['exec', 'edit'])