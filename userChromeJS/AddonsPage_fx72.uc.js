// ==UserScript==
// @name            AddonsPage.uc.js
// @description     附件组件页面右键新增查看所在目录，详细信息页面新增安装地址或路径，新增 uc脚本管理页面。
// @author          ywzhaiqi
// @include         main
// @charset         utf-8
// @compatibility   Firefox 72
// @version         2022.11.18 支持 fx-autoconfig
// @version         2022.10.01 支持隐藏自身
// @version         2022.09.27 Fx106
// @version         2022.02.04 Fx98
// @version         2021.03.31 Fx89
// @version         2021.02.05 Fx87
// @version         2021.01.30 Fx85
// @version         2020.06.28 Fx78
// @version         2019.12.07
// @downloadURL     https://raw.github.com/ywzhaiqi/userChromeJS/master/AddonsPage/AddonsPage.uc.js
// @homepageURL     https://github.com/ywzhaiqi/userChromeJS/tree/master/AddonsPage
// @reviewURL       http://bbs.kafan.cn/thread-1617407-1-1.html
// @optionsURL      about:config?filter=view_source.editor.path
// @note            - 附件组件页面右键新增查看所在目录（支持扩展、主题、插件）、复制名字。Greasemonkey、Scriptish 自带已经存在
// @note            - 附件组件详细信息页面新增GM脚本、扩展、主题安装地址和插件路径，右键即复制
// @note            - 新增 uc脚本管理页面
// @note            - uc脚本管理界面
// @note            - 启用禁用需要 rebuild_userChrome.uc.js
// @note            - 编辑命令需要首先设置 view_source.editor.path 的路径
// @note            - 图标请自行添加样式，详细信息见主页
// @note            其它信息见主页
// ==/UserScript==
(function () {
    "use strict";

    const iconURL = "chrome://mozapps/skin/extensions/extensionGeneric.svg";  // uc 脚本列表的图标
    const AM_FILENAME = Components.stack.filename.split("/").pop().split("?")[0];
    const EXCLUED_SCRIPTS = [AM_FILENAME];

    if (window.AM_Helper) {  // 修改调试用，重新载入无需重启
        window.AM_Helper.uninit();
        delete window.AM_Helper;
    }
    if (window.userChromeJSAddon) {
        window.userChromeJSAddon.uninit();
        delete window.userChromeJSAddon;
    }



    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/AddonManager.jsm");

    const LANG = {
        'zh-CN': {
            "set editor path": "请打开 about:config 页面并设置 view_source.editor.path 的值为编辑器路径。",
            "edit": "编辑",
            "browse directory": "浏览路径",
            "open url": "打开安装网址",
            "copy name": "复制名称"
        }
    }

    window.AM_Helper = {
        init() {
            document.addEventListener("DOMContentLoaded", this, false);
        },
        uninit() {
            document.removeEventListener("DOMContentLoaded", this, false);
        },
        handleEvent(event) {
            switch (event.type) {
                case "DOMContentLoaded":
                    this.onDOMContentLoaded(event);
                    break;

                case "click":
                    this.onClick(event);
                    break;
                case "change":
                    this.onChange(event);
                    break;
            }
        },

        onDOMContentLoaded(event) {
            const doc = event.target;
            if (!["about:addons"].includes(doc.URL))
                return;

            const htmlBrowser = doc.getElementById("html-view-browser");
            if (htmlBrowser) {
                htmlBrowser.addEventListener("load", event => {
                    const cDoc = htmlBrowser.contentDocument;
                    if (cDoc) {
                        this.replace_l10n_setAttributes(cDoc);
                        this.injectCategory(cDoc);
                    }
                });

                // Fx85- #html-view要素が無くなってloading属性で遷移検出できなくなったのでイベント駆動に変更
                doc.addEventListener("ViewChanged", event => {
                    const cDoc = htmlBrowser.contentDocument;
                    if (cDoc) {
                        this.injectView(cDoc);
                    }
                });

            } else if (doc.querySelector('title[data-l10n-id="addons-page-title"]')) {
                // Fx87-
                this.replace_l10n_setAttributes(doc);
                this.injectCategory(doc);

                const loadedEvent = event => {
                    this.injectView(doc);
                };
                doc.addEventListener("ViewChanged", loadedEvent);   // -Fx88
                doc.addEventListener("view-loaded", loadedEvent);   // Fx89-
            }
        },

        browseDir(aAddon) {
            switch (aAddon.type) {
                case "plugin":
                    var pathes = aAddon.pluginFullpath;
                    for (var i = 0; i < pathes.length; i++) {
                        this.revealPath(pathes[i]);
                    }
                    return;
                case "userchromejs":
                    var file = aAddon._script.file;
                    if (file.exists())
                        file.reveal();
                    return;
            }

            // addon
            var nsLocalFile = Components.Constructor("@mozilla.org/file/local;1", "nsIFile", "initWithPath");

            var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
            dir.append("extensions");
            dir.append(aAddon.id);
            var fileOrDir = dir.path + (dir.exists() ? "" : ".xpi");
            try {
                (new nsLocalFile(fileOrDir)).reveal();
            } catch (ex) {
                var addonDir = /.xpi$/.test(fileOrDir) ? dir.parent : dir;
                try {
                    if (addonDir.exists()) {
                        addonDir.launch();
                    }
                } catch (ex) {
                    var uri = Services.io.newFileURI(addonDir);
                    var protSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                        getService(Ci.nsIExternalProtocolService);
                    protSvc.loadUrl(uri);
                }
            }
        },
        editScript(aAddon) {
            if (aAddon.type == "userchromejs") {
                var path = aAddon._script.file.path;
                this.launchEditor(path);
            }
        },
        launchEditor(path) {
            var editor = Services.prefs.getCharPref("view_source.editor.path");
            if (!editor) {
                alert($L("set editor path"));
                return;
            }

            var UI = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
            var platform = window.navigator.platform.toLowerCase();
            UI.charset = platform.indexOf('win') > -1 ? 'Shift_JIS' : 'UTF-8';
            path = UI.ConvertFromUnicode(path);

            var appfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            appfile.initWithPath(editor);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            process.init(appfile);
            process.runw(false, [path], 1, {});
        },
        copyName(aAddon) {
            this.copyToClipboard(aAddon.name);
        },

        // Fx78: ローカライズ出来ないと動作しない対策
        replace_l10n_setAttributes(doc) {
            if (!doc.l10n) return;

            const tr1 = {
                "userchromejs-heading": "userChrome JS",
                "addon-category-userchromejs": "userChrome JS", // fx 106
            }
            const tr2 = {
                "userchromejs-enabled-heading": "extension-enabled-heading",
                "userchromejs-disabled-heading": "extension-disabled-heading",
            };

            const true_l10n_setAttributes = doc.l10n.setAttributes;
            doc.l10n.setAttributes = (elem, id, ...args) => {
                if (id in tr1) {
                    elem.textContent = tr1[id];
                } else {
                    if (id in tr2) {
                        id = tr2[id];
                    }
                    true_l10n_setAttributes.call(doc.l10n, elem, id, ...args);
                }
            }
        },

        injectView(doc) {
            const header = doc.getElementById("page-header");
            if (!header) return;
            doc.querySelectorAll("addon-card").forEach(card => {
                const addon = card.addon;
                if (addon.type === "userchromejs") {
                    // 有効・無効スイッチを追加
                    const input = $C(doc, "input", {
                        type: "checkbox",
                        action: "AM-switch",
                        class: "toggle-button extension-enable-button",
                        "data-l10n-id": "extension-enable-addon-button-label",
                        "aria-label": "Enable",
                    });
                    input.checked = !addon.userDisabled;
                    input.addEventListener("click", this, true);
                    input.addEventListener("change", this);

                    const name = card.querySelector(".addon-name-container");
                    name.insertBefore(input, name.querySelector(".more-options-button"));
                }

                /* …メニュー追加 */
                const optionMenu = card.querySelector('panel-list[role="menu"]');
                if (optionMenu) {
                    $C(doc, "panel-item-separator", {}, optionMenu);
                    let item;

                    if (addon.type === "userchromejs") {
                        item = $C(doc, "panel-item", {
                            action: "AM-edit-script",
                            "#text": $L("edit"),
                        }, optionMenu);
                        item.addEventListener("click", this, true);
                    }

                    item = $C(doc, "panel-item", {
                        action: "AM-browse-dir",
                        "#text": $L("browse directory")
                    }, optionMenu);
                    item.addEventListener("click", this, true);

                    if (this.getInstallURL(addon)) {
                        item = $C(doc, "panel-item", {
                            action: "AM-open-url",
                            "#text": $L("open url")
                        }, optionMenu);
                        item.addEventListener("click", this, true);
                    }

                    item = $C(doc, "panel-item", {
                        action: "AM-copy-name",
                        "#text": $L("copy name")
                    }, optionMenu);
                    item.addEventListener("click", this, true);
                }
            });

            this.setUrlOrPath(doc);
        },

        injectCategory(doc) {
            // Fx76 about:addonsのサイドバーhtml化でカテゴリーが自動で挿入されなくなった対策
            const cat = doc.getElementById("categories");
            if (cat && !doc.querySelector('.category[name="userchromejs"]')) {
                // 拡張ボタンを複製して作る
                const ucjsBtn = cat.querySelector('.category[name="extension"]').cloneNode(false);
                ucjsBtn.removeAttribute("aria-selected");
                ucjsBtn.removeAttribute("tabindex");
                ucjsBtn.removeAttribute("data-l10n-id");
                ucjsBtn.setAttribute("viewid", "addons://list/userchromejs");
                ucjsBtn.setAttribute("name", "userchromejs");
                ucjsBtn.setAttribute("title", "userChrome JS");

                $C(doc, "span", {
                    class: "category-name",
                    "#text": "userChrome JS"
                }, ucjsBtn);

                const localeBtn = cat.querySelector('.category[name="locale"]');
                localeBtn.parentElement.insertBefore(ucjsBtn, localeBtn);
            }
        },

        getTargetAddon(target) {
            const card = target.closest("[addon-id]");
            return (card && card.addon) ? card.addon : null;
        },

        onClick(event) {
            event.stopPropagation();
            const target = event.target;
            const action = target.getAttribute("action");
            const addon = this.getTargetAddon(target);
            if (action && addon) {
                switch (action) {
                    case "AM-edit-script":
                        this.editScript(addon);
                        break;
                    case "AM-browse-dir":
                        this.browseDir(addon);
                        break;
                    case "AM-open-url":
                        event.preventDefault();
                        this.openUrl(target.href ? target.href : this.getInstallURL(addon));
                        break;
                    case "AM-copy-name":
                        this.copyName(addon);
                        break;

                    case "AM-switch":
                        break;
                }
            }

            const panel = target.closest("panel-list");
            if (panel && panel.hasAttribute("open")) {
                panel.removeAttribute("open");
            }
        },

        onChange(event) {
            event.stopPropagation();
            const target = event.target;
            const addon = this.getTargetAddon(target);
            if (addon) {
                if (target.checked) {
                    addon.enable();
                } else {
                    addon.disable();
                }
            }
        },

        getInstallURL(aAddon) {
            if (!aAddon) return null;

            var url = null;
            switch (aAddon.type) {
                case "extension":
                case "theme":
                    url = (/*aAddon.contributionURL ||*/ aAddon.reviewURL) || null;
                    return url && url.replace(/\/developers|\/reviews/g, "") || (aAddon.creator && aAddon.creator.url);
                case "greasemonkey-user-script":
                    return aAddon._script._downloadURL || aAddon._script._updateURL;
                case "userscript":
                    url = aAddon._downloadURL || aAddon._updateURL;
                    return url;
                case "userchromejs":
                    return aAddon.homepageURL || aAddon.reviewURL || aAddon.downloadURL || aAddon.updateURL;
                default:
                    return aAddon.homepageURL;
            }
        },

        getPath(aAddon) {
            if (!aAddon) return false;

            let path = aAddon.pluginFullpath;
            if (!path && aAddon._script && aAddon._script.file) {
                path = aAddon._script.file.path;
            }
            if (Array.isArray(path)) {
                path = path[0];
            }
            return path || false;
        },

        setUrlOrPath(doc) {
            let addon;
            const detail = doc.querySelector('#main [current-view="detail"]');
            if (detail) {
                const card = detail.querySelector("addon-card");
                addon = card.addon;
            }
            if (!addon) return;

            const installURL = this.getInstallURL(addon);
            const pluginPath = this.getPath(addon);
            if (!installURL && !pluginPath) return;

            if (!doc.getElementById("detail-InstallURL-row")) {
                let value = "", label = "";
                switch (addon.type) {
                    case "extension":
                    case "theme":
                    case "greasemonkey-user-script":
                        value = installURL;
                        label = "Install Page";
                        break;
                    case "plugin":
                    case "userchromejs":
                        value = pluginPath;
                        label = "Path";
                        break;
                }

                if (!!value && !!label) {
                    const row = $C(doc, "div", {
                        id: "detail-InstallURL-row",
                        class: "addon-detail-row",
                    });
                    $C(doc, "label", {
                        class: "detail-row-label",
                        "#text": label
                    }, row);

                    const link = $C(doc, "a", {
                        href: value,
                        action: "AM-open-url",
                        "#text": value
                    }, row);
                    link.addEventListener("click", this);

                    doc.querySelector('section[name="details"]').appendChild(row);
                }
            }
        },

        openUrl(url) {
            if (/^https?:/.test(url)) {
                openURL(url);
            } else {
                this.revealPath(url);
            }
        },

        revealPath(path) {
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            file.initWithPath(path);
            if (file.exists())
                file.reveal();
        },
        copyToClipboard(aString) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].
                getService(Ci.nsIClipboardHelper).copyString(aString);
        }
    };

    window.userChromeJSAddon = {
        scripts: [],
        unloads: [],

        init() {
            if (AddonManager.hasAddonType && AddonManager.hasAddonType("userchromejs") ||
                AddonManager.addonTypes && 'userchromejs' in AddonManager.addonTypes)
                return;

            this.initScripts();
            this.registerProvider();
            this.addStyle();
        },
        uninit() {
            this.unloads.forEach(function (func) { func(); });
        },
        initScripts() {
            this.scripts = [];
            let scripts;
            if (window.userChrome_js) {
                scripts = window.userChrome_js.scripts.concat(window.userChrome_js.overlays);
            } else if (window._uc && !window._uc.isFaked) {
                scripts = Object.values(_uc.scripts);
            } else if (typeof _ucUtils === 'object') {
                scripts = _ucUtils.getScriptData().map(script => {
                    let aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    let path = resolveChromeURL(`chrome://userscripts/content/${script.filename}`);
                    path = path.replace("file:///", "").replace(/\//g, '\\\\');
                    aFile.initWithPath(path);
                    return Object.assign(script, {
                        file: aFile
                    });
                });
                function resolveChromeURL(str) {
                    const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                    try {
                        return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec
                    } catch (e) {
                        console.error(e);
                        return ""
                    }
                }

            } else {
                // 不支持其他环境
                window.AM_Helper.uninit();
                delete window.AM_Helper;
            }

            scripts.forEach((script) => {
                if (!EXCLUED_SCRIPTS.includes(script.filename))
                    this.scripts.push(new ScriptAddon(script));
            });
        },
        getScriptById(aId) {
            for (var i = 0; i < this.scripts.length; i++) {
                if (this.scripts[i].id == aId)
                    return this.scripts[i];
            }
            return null;
        },
        registerProvider() {
            const provider = {
                async getAddonByID(aId) {
                    return userChromeJSAddon.getScriptById(aId);
                },

                async getAddonsByTypes(aTypes) {
                    if (aTypes && !aTypes.includes("userchromejs")) {
                        return [];
                    } else {
                        userChromeJSAddon.initScripts();
                        return userChromeJSAddon.scripts;
                    }
                },
            };

            AddonManagerPrivate.registerProvider(provider, [
                AddonManagerPrivate.AddonType ?
                    new AddonManagerPrivate.AddonType(
                        "userchromejs",
                        "",
                        "userChrome JS",
                        AddonManager.VIEW_TYPE_LIST,
                        9000
                    ) :
                    "userchromejs"
            ]);

            this.unloads.push(function () {
                AddonManagerPrivate.unregisterProvider(provider);
            });
        },
        addStyle() {
            let data = `@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
                @namespace html url(http://www.w3.org/1999/xhtml);
                @-moz-document url("about:addons"), url("chrome://mozapps/content/extensions/extensions.xul") {
                    #category-userchromejs > .category-icon {
                        list-style-image: url(chrome://mozapps/skin/extensions/experimentGeneric.svg);
                    }
                }
                @-moz-document url("about:addons"), url("chrome://mozapps/content/extensions/aboutaddons.html") {
                    html|*.category[name="userchromejs"] {
                        background-image: url(chrome://mozapps/skin/extensions/category-extensions.svg);
                    }
                }`;
            let styleService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
            let styleURI = Services.io.newURI("data:text/css," + encodeURIComponent(data), null, null);
            styleService.loadAndRegisterSheet(styleURI, Ci.nsIStyleSheetService.USER_SHEET);

            this.unloads.push(function () {
                styleService.unregisterSheet(styleURI, Ci.nsIStyleSheetService.USER_SHEET);
            });
        },
    };

    function ScriptAddon(aScript) {
        this._script = aScript;

        this.id = "ucjs:" + this._script.filename;  //this._script.url.replace(/\//g, "|");
        this.name = this._script.filename;
        this.description = this._script.description || "";
        if (this._script.hasOwnProperty("isEnabled")) {
            this.enabled = this._script.isEnabled;
        } else {
            this.enabled = !userChrome_js.scriptDisable[this.name];
        }

        // 我修改过的 userChrome.js 新增的
        this.version = this._script.version || "";
        this.author = this._script.author || null;
        this.homepageURL = this._script.homepageURL || null;
        this.reviewURL = this._script.reviewURL || null;
        this.reviewCount = 0;
        this.fullDescription = this._script.fullDescription || null;
        this.downloadURL = this._script.downloadURL || null;

        this.iconURL = iconURL;
    }

    ScriptAddon.prototype = {
        version: null,
        type: "userchromejs",
        isCompatible: true,
        blocklistState: Ci.nsIBlocklistService.STATE_NOT_BLOCKED,
        appDisabled: false,
        scope: AddonManager.SCOPE_PROFILE,
        name: null,
        creator: null,
        pendingOperations: AddonManager.PENDING_NONE,  // 必须，否则所有都显示 restart
        operationsRequiringRestart: AddonManager.OP_NEEDS_RESTART_ENABLE | AddonManager.OP_NEEDS_RESTART_DISABLE | AddonManager.OP_NEEDS_RESTART_UNINSTALL,
        // operationsRequiringRestart: AddonManager.OP_NEEDS_RESTART_DISABLE,

        get optionsURL() {
            if (this.isActive && this._script.optionsURL)
                return this._script.optionsURL;
        },

        get isActive() {
            return !this.userDisabled ? true : false;
        },
        get userDisabled() {
            return !this.enabled ? true : false;
        },
        set userDisabled(val) {
            if (val == this.userDisabled) {
                return val;
            }

            AddonManagerPrivate.callAddonListeners(val ? 'onEnabling' : 'onDisabling', this, false);

            if (this.pendingOperations == AddonManager.PENDING_NONE) {
                this.pendingOperations = val ? AddonManager.PENDING_DISABLE : AddonManager.PENDING_ENABLE;
            } else {
                this.pendingOperations = AddonManager.PENDING_NONE;
            }

            this.enabled = !val;
            if (window.userChromejs) {
                userChromejs.chgScriptStat(this.name);
            } else if (typeof userChrome_js !== "undefined") {
                var s = Services.prefs.getStringPref("userChrome.disable.script", "");
                var afilename = this.name;
                if (!userChrome_js.scriptDisable[afilename]) {
                    s = (s + ',').replace(afilename + ',', '') + afilename + ',';
                } else {
                    s = (s + ',').replace(afilename + ',', '');
                }
                s = s.replace(/,,/g, ',').replace(/^,/, '');
                Services.prefs.setStringPref("userChrome.disable.script", s);
                userChrome_js.scriptDisable = restoreState(s.split(','));
            } else if (typeof _ucUtils === "object") {
                let obj = _ucUtils.toggleScript(this.name);
                this.enabled = obj.enabled;
            }

            AddonManagerPrivate.callAddonListeners(val ? 'onEnabled' : 'onDisabled', this);

            function restoreState(arr) {
                var disable = [];
                for (var i = 0, len = arr.length; i < len; i++)
                    disable[arr[i]] = true;
                return disable;
            }

        },
        get permissions() {
            // var perms = AddonManager.PERM_CAN_UNINSTALL;
            // perms |= this.userDisabled ? AddonManager.PERM_CAN_ENABLE : AddonManager.PERM_CAN_DISABLE;
            var perms = this.userDisabled ? AddonManager.PERM_CAN_ENABLE : AddonManager.PERM_CAN_DISABLE;
            // if (this.updateURL) perms |= AddonManager.PERM_CAN_UPGRADE;
            return perms;
        },

        uninstall() {
            AddonManagerPrivate.callAddonListeners("onUninstalling", this, false);
            this.needsUninstall = true;
            this.pendingOperations |= AddonManager.PENDING_UNINSTALL;
            AddonManagerPrivate.callAddonListeners("onUninstalled", this);
        },
        cancelUninstall() {
            this.needsUninstall = false;
            this.pendingOperations ^= AddonManager.PENDING_UNINSTALL;
            AddonManagerPrivate.callAddonListeners("onOperationCancelled", this);
        },

        // Fx62.0-
        async enable() {
            if (typeof _uc !== "undefined" && !_uc.isFaked) {
                let script = _uc.scripts[this.name];
                xPref.set(_uc.PREF_SCRIPTSDISABLED, xPref.get(_uc.PREF_SCRIPTSDISABLED).replace(new RegExp('^' + script.filename + ',|,' + script.filename), ''));
                if (!_uc.everLoaded.includes(script.id)) {
                    script = _uc.getScriptData(script.file);
                    Services.obs.notifyObservers(null, 'startupcache-invalidate');
                    _uc.windows((doc, win, loc) => {
                        if (win._uc && script.regex.test(loc.href)) {
                            _uc.loadScript(script, win);
                        }
                    }, false);
                }
            }
            this.userDisabled = false;
        },
        async disable() {
            if (typeof _uc !== "undefined" && !_uc.isFaked) {
                let script = _uc.scripts[this.name];
                xPref.set(_uc.PREF_SCRIPTSDISABLED, script.filename + ',' + xPref.get(_uc.PREF_SCRIPTSDISABLED));
                if (script.isRunning && !!script.shutdown) {
                    _uc.windows((doc, win, loc) => {
                        if (script.regex.test(loc.href)) {
                            try {
                                eval(script.shutdown);
                            } catch (ex) {
                                Cu.reportError(ex);
                            }
                            if (script.onlyonce)
                                return true;
                        }
                    }, false);
                    script.isRunning = false;
                }
            }
            this.userDisabled = true;
        },
    };

    function $C(doc, tag, attrs, parent, reference) {
        let node;
        if (tag instanceof Node) {
            node = tag;
        } else if (tag === "#text") {
            node = doc.createTextNode(attrs);
            attrs = null;
        } else {
            node = doc.createElement(tag);
        }
        if (attrs) {
            Object.entries(attrs).forEach(([name, val]) => {
                if (name === "#text") {
                    node.appendChild(doc.createTextNode(val));
                } else {
                    node.setAttribute(name, val);
                }
            });
        }
        // if(parent instanceof Node) {
        if (parent && typeof parent.insertBefore === "function") { // fx 106
            parent.insertBefore(node, reference);
        }
        return node;
    }

    if (!window.xPref) {
        window.xPref = {
            // Retorna o valor da preferência, seja qual for o tipo, mas não
            // testei com tipos complexos como nsIFile, não sei como detectar
            // uma preferência assim, na verdade nunca vi uma
            get: function (prefPath, def = false, valueIfUndefined, setDefault = true) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            if (valueIfUndefined != undefined)
                                return this.set(prefPath, valueIfUndefined, setDefault);
                            else
                                return undefined;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    return undefined;
                }
                return;
            },

            set: function (prefPath, value, def = false) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                switch (typeof value) {
                    case 'string':
                        return sPrefs.setStringPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },

            lock: function (prefPath, value) {
                let sPrefs = Services.prefs;
                this.lockedBackupDef[prefPath] = this.get(prefPath, true);
                if (sPrefs.prefIsLocked(prefPath))
                    sPrefs.unlockPref(prefPath);

                this.set(prefPath, value, true);
                sPrefs.lockPref(prefPath);
            },

            lockedBackupDef: {},

            unlock: function (prefPath) {
                Services.prefs.unlockPref(prefPath);
                let bkp = this.lockedBackupDef[prefPath];
                if (bkp == undefined)
                    Services.prefs.deleteBranch(prefPath);
                else
                    this.set(prefPath, bkp, true);
            },

            clear: Services.prefs.clearUserPref,

            // Detecta mudanças na preferência e retorna:
            // return[0]: valor da preferência alterada
            // return[1]: nome da preferência alterada
            // Guardar chamada numa var se quiser interrompê-la depois
            addListener: function (prefPath, trat) {
                this.observer = function (aSubject, aTopic, prefPath) {
                    return trat(xPref.get(prefPath), prefPath);
                }

                Services.prefs.addObserver(prefPath, this.observer);
                return {
                    prefPath: prefPath,
                    observer: this.observer
                };
            },

            // Encerra pref observer
            // Só precisa passar a var definida quando adicionou
            removeListener: function (obs) {
                Services.prefs.removeObserver(obs.prefPath, obs.observer);
            }
        }
    }

    function $L(key, replace) {
        const _LOCALE = getLocale() || "zh-CN";
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = LANG[_LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace("%s", arguments[i]);
            }
            return str;
        } else return "";
    }

    function getLocale() {
        let LOCALE = Services.prefs.getCharPref("general.useragent.locale", "");
        if (!LOCALE) {
            let sLocales = Services.locale.appLocalesAsBCP47;
            for (let key in sLocales) {
                if (LANG.hasOwnProperty(sLocales[key])) {
                    LOCALE = sLocales[key];
                    break;
                }
            }
        }
        return LOCALE;
    }

    AM_Helper.init();

    userChromeJSAddon.init();
})();