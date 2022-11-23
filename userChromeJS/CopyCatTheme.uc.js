// ==UserScript==
// @name            CopyCatTheme.uc.js
// @description     CopyCat 主题专用加载脚本
// @license         MIT License
// @shutdown        window.CopyCatTheme.destroy(win);
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @onlyonce
// ==/UserScript==
(function (css) {
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const { gBrowserInit } = window;

    const LANG = {
        "zh-CN": {
            "theme settings": "主题设置",
            "reload themes": "重新加载主题",
            "open themes directory": "打开主题目录",
            "themes list": "主题列表",
            "close theme": "关闭主题",
            "theme item tooltip text": "主题：{name}\n作者：{author}\n简介：{description}\n左键：更换主题\n右键：修改主题",
            "theme options": "主题选项",
            "file not found": "文件不存在：%s",
            "param is invalid": "函数 [%s], 调用参数[%s]有误",
            "please set editor path": "请设置编辑器路径",
            "set global editor": "设置全局编辑器",
        }
    }

    const TopWindow = Services.wm.getMostRecentWindow("navigator:browser");
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    const resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
    if (!resourceHandler.hasSubstitution("copycat-uchrm")) {
        resourceHandler.setSubstitution("copycat-uchrm", Services.io.newFileURI(Services.dirsvc.get('UChrm', Ci.nsIFile)));
    }

    const cPref = {
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

    window.CopyCatTheme = {
        PREF_LISTENER_LIST: {},
        CACHED_VIEWS: [],
        get locale() {
            delete this.locale;
            try {
                this.locale = Services.prefs.getCharPref("general.useragent.locale");
            } catch (e) { }

            if (!this.locale) {
                this.locale = Services.locale.appLocaleAsBCP47 || "en-US";
            }
            return this.locale;
        },
        get THEME_RELATED_PATH() {
            delete this.THEME_RELATED_PATH;
            return this.gPrefs("THEME_RELATED_PATH", "\\chrome\\UserThemes");
        },
        get THEME_PATH() {
            delete this.THEME_PATH;
            return this.THEME_PATH = this.handleRelativePath(this.THEME_RELATED_PATH);
        },
        get THEME_URL_PREFIX() {
            delete this.THEME_URL_PREFIX;
            let URI = this.THEME_PATH.replace(Services.dirsvc.get('UChrm', Ci.nsIFile).path, "");
            URI = URI.replace(/(\w)\/\//g, "$1/").replaceAll("\\", "/");
            if (URI.charAt(0) == "/") URI = URI.substring(1);
            return this.THEME_URL_PREFIX = "resource://copycat-uchrm/" + URI;
        },
        sPrefs(key, val) {
            cPref.set("userChromeJS.CopyCat." + key, val);
        },
        gPrefs(key, defaultValue) {
            return cPref.get("userChromeJS.CopyCat." + key, defaultValue);
        },
        get debug() { return this.gPrefs("debug", false); },
        set STYLE(css) {
            delete this.STYLE;
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)),
                type: this.sss.USER_SHEET,
            }
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
        get sss() {
            delete this.sss;
            return this.sss = sss;
        },
        init: function (win) {
            let { document, CustomizableUI, MutationObserver } = win;
            this.STYLE = css;
            this.globalStyleMutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.loadTheme();
                    }
                });
            });
            this.globalStyleMutationObserver.observe(document.documentElement, {
                attributes: true,
            });
            CustomizableUI.addListener(this.globalStyleListener);
            Services.prefs.addObserver('browser.uidensity', this.globalStyleObserver);
            win.addEventListener('CopyCatThemeUnloaded', this);
            win.addEventListener('CopyCatThemeLoaded', this);

            let viewCache = getViewCache(document);
            let view = document.getElementById("CopyCat-ThemeMenu-View") || viewCache.querySelector("#CopyCat-ThemeMenu-View");
            if (!view) {
                viewCache.appendChild(win.MozXULElement.parseXULToFragment(`
            <panelview id="CopyCat-ThemeMenu-View" class="CopyCatTheme-View PanelUI-subView">
                <box class="panel-header">
                    <toolbarbutton class="subviewbutton subviewbutton-iconic subviewbutton-back" closemenu="none" tabindex="0"><image class="toolbarbutton-icon"/><label class="toolbarbutton-text" crop="right" flex="1"/></toolbarbutton>
                    <h1><span></span></h1>
                </box>
                <toolbarseparator />
                <vbox class="panel-subview-body" panelId="CopyCat-ThemeMenu-View">
                </vbox>
            </panelview>
            `))
                view = viewCache.querySelector('#CopyCat-ThemeMenu-View');
                $A(view.querySelector('.subviewbutton-back'), {
                    oncommand: function () {
                        var mView = this.closest('panelmultiview');
                        if (mView) mView.goBack();
                    }
                });
            }
            view.addEventListener('ViewShowing', this);
            [{
                action: 'ReloadAllThemes',
                label: $L("reload themes"),
                onclick: 'window.CopyCatTheme._onclick(event)',
                style: 'list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);',
            }, {
                label: $L("open themes directory"),
                action: "OpenThemesDirectory",
                style: 'list-style-image: url(chrome://global/skin/icons/folder.svg)',
                onclick: 'window.CopyCatTheme._onclick(event)'
            }, {}, {
                type: 'html:h2',
                class: 'subview-subheader',
                content: $L("themes list")
            }, {
                label: $L("close theme"),
                internal: 'true',
                type: 'radio',
                skin: true,
                value: '',
                action: 'SetTheme',
                closemenu: true,
                onclick: 'window.CopyCatTheme._onclick(event)'
            }, {
                id: 'CopyCat-ThemeMenu-Themes-InsertPoint'
            }, {
                type: 'html:h2',
                class: 'subview-subheader',
                content: $L("theme options")
            }, {
                id: 'CopyCat-ThemeMenu-Options-InsertPoint',
                hidden: true,
            }].forEach(obj => {
                let type = obj.type;
                if (!type || ["radio", "checkbox"].includes(type)) type = "toolbarbutton";
                if (!obj.label && !obj.content) type = "toolbarseparator";
                let item = $C(view.ownerDocument, type, obj);
                if (type === "toolbarbutton")
                    item.classList.add('subviewbutton');
                if (obj.content) {
                    item.removeAttribute('content');
                    item.innerHTML = obj.content;
                }
                view.querySelector(':scope>vbox').appendChild(item);
            });

            let themeMenu = $C(document, 'toolbarbutton', {
                id: 'CopyCat-ThemeMenu',
                class: 'subviewbutton subviewbutton-nav',
                type: 'view',
                view: "CopyCat-ThemeMenu-View",
                closemenu: "none",
                label: $L("theme settings"),
                oncommand: "PanelUI.showSubView('CopyCat-ThemeMenu-View', this)"
            }),
                mainView = getViewCache(document).querySelector('#appMenu-protonMainView'),
                ins = mainView.querySelector('#appMenu-more-button2');
            ins.before(themeMenu);

            this.loadThemes();
            this.loadTheme();
            this.refreshThemesList(document);
            this.refreshThemeOptions(document);

            if (!this.debug) return;
            if (CustomizableUI.getPlacementOfWidget("CopyCat-ReloadTheme", true)) return;
            CustomizableUI.createWidget({
                id: 'CopyCat-ReloadTheme',
                label: $L("reload themes"),
                tooltiptext: $L("reload themes"),
                removable: true,
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                onCreated: node => {
                    $A(node, {
                        badged: true,
                        action: 'ReloadAllThemes',
                        onclick: 'window.CopyCatTheme._onclick(event)',
                        notice: true,
                        style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+DQogIDxwYXRoIGZpbGw9IiM1MGU2ZmYiIGQ9Ik0xMC4yMjgsMTUuODg1TDcuMzIsMTIuOTc3QzUuMjI2LDE2LjEzOCw0LDE5LjkyNCw0LDI0YzAsMy42NjgsMC45OTMsNy4xMDMsMi43MTksMTAuMDU4YzAuMjkzLDAuNTAyLDAuOTk0LDAuNTczLDEuNDA1LDAuMTYxbDEuNjQtMS42NGMwLjI3NS0wLjI3NSwwLjMyNi0wLjY5MywwLjE0Mi0xLjAzNUM4LjY5NywyOS4yOTUsOCwyNi43MzIsOCwyNEM4LDIxLjAzNCw4LjgyMSwxOC4yNjcsMTAuMjI4LDE1Ljg4NXoiIC8+DQogIDxwYXRoIGZpbGw9IiMxOTliZTIiIGQ9Ik00MCwyNGMwLDIuOTY2LTAuODIxLDUuNzMzLTIuMjI4LDguMTE1bDIuOTA4LDIuOTA4QzQyLjc3NCwzMS44NjIsNDQsMjguMDc1LDQ0LDI0YzAtMy42NjgtMC45OTMtNy4xMDMtMi43MTktMTAuMDU4Yy0wLjI5My0wLjUwMi0wLjk5NC0wLjU3Mi0xLjQwNS0wLjE2MWwtMS42NCwxLjY0Yy0wLjI3NSwwLjI3NS0wLjMyNiwwLjY5My0wLjE0MiwxLjAzNUMzOS4zMDMsMTguNzA1LDQwLDIxLjI2OCw0MCwyNHoiIC8+DQogIDxwYXRoIGZpbGw9IiMzNWMxZjEiIGQ9Ik0xNS40MjEsOS43NjRjMC4yNzUsMC4yNzUsMC42OTMsMC4zMjYsMS4wMzUsMC4xNDJDMTguNzA1LDguNjk3LDIxLjI2OCw4LDI0LDhjMi45NjYsMCw1LjczMywwLjgyMSw4LjExNSwyLjIyOGwyLjkwOS0yLjkwOUMzMS44NjIsNS4yMjYsMjguMDc2LDQsMjQsNGMtMy42NSwwLTcuMDY4LDAuOTgzLTEwLjAxMywyLjY5M2MtMC41MjEsMC4zMDMtMC42MzEsMS4wMDYtMC4yMDUsMS40MzJMMTUuNDIxLDkuNzY0eiIgLz4NCiAgPHBhdGggZmlsbD0iIzAwNzhkNCIgZD0iTTMyLjU3OSwzOC4yMzZjLTAuMjc1LTAuMjc1LTAuNjkzLTAuMzI2LTEuMDM1LTAuMTQyQzI5LjI5NSwzOS4zMDMsMjYuNzMyLDQwLDI0LDQwYy0yLjk2NiwwLTUuNzMzLTAuODIxLTguMTE1LTIuMjI4bC0yLjkwOCwyLjkwOEMxNi4xMzgsNDIuNzc0LDE5LjkyNSw0NCwyNCw0NGMzLjY2OCwwLDcuMTAzLTAuOTkzLDEwLjA1OC0yLjcxOWMwLjUwMi0wLjI5MywwLjU3My0wLjk5NCwwLjE2MS0xLjQwNUwzMi41NzksMzguMjM2eiIgLz4NCiAgPHBhdGggZmlsbD0iIzM1YzFmMSIgZD0iTTM1LjkzNCwxMi4wNzVMMzEuMSwxMS45MDljLTAuMzQyLTAuMDEyLTAuNTEyLTAuNDIxLTAuMjc3LTAuNjcxbDQuNjU3LTQuOTc1YzAuMjQyLTAuMjU5LDAuNjc2LTAuMDk3LDAuNjksMC4yNTdsMC4yMDEsNS4xMTdDMzYuMzgsMTEuODgyLDM2LjE3OSwxMi4wODMsMzUuOTM0LDEyLjA3NXoiIC8+DQogIDxwYXRoIGZpbGw9IiMwMDc4ZDQiIGQ9Ik0xMi4wNjYsMzUuOTI1bDQuODM0LDAuMTY2YzAuMzQyLDAuMDEyLDAuNTEyLDAuNDIxLDAuMjc3LDAuNjcxbC00LjY1Nyw0Ljk3NWMtMC4yNDIsMC4yNTktMC42NzYsMC4wOTctMC42OS0wLjI1N2wtMC4yMDEtNS4xMTdDMTEuNjIsMzYuMTE4LDExLjgyMSwzNS45MTcsMTIuMDY2LDM1LjkyNXoiIC8+DQogIDxwYXRoIGZpbGw9IiMxOTliZTIiIGQ9Ik0zNS45MjUsMzUuOTM0bDAuMTY2LTQuODM0YzAuMDEyLTAuMzQyLDAuNDIxLTAuNTEyLDAuNjcxLTAuMjc3bDQuOTc1LDQuNjU3YzAuMjU5LDAuMjQyLDAuMDk3LDAuNjc2LTAuMjU3LDAuNjlsLTUuMTE3LDAuMjAxQzM2LjExOCwzNi4zOCwzNS45MTcsMzYuMTc5LDM1LjkyNSwzNS45MzR6IiAvPg0KICA8cGF0aCBmaWxsPSIjNTBlNmZmIiBkPSJNMTIuMDc1LDEyLjA2NkwxMS45MDksMTYuOWMtMC4wMTIsMC4zNDItMC40MjEsMC41MTItMC42NzEsMC4yNzdMNi4yNjIsMTIuNTJjLTAuMjU5LTAuMjQyLTAuMDk3LTAuNjc2LDAuMjU3LTAuNjlsNS4xMTctMC4yMDFDMTEuODgyLDExLjYyLDEyLjA4MywxMS44MjEsMTIuMDc1LDEyLjA2NnoiIC8+DQo8L3N2Zz4=)'
                    })
                }
            });
        },
        handleEvent: function (event) {
            switch (event.type) {
                case 'ViewShowing':
                    let { target: view } = event;
                    this.refreshThemesList(view.ownerDocument);
                    this.refreshThemeOptions(view.ownerDocument);
                    let name = this.gPrefs("theme", "");
                    view.querySelectorAll('[action="SetTheme"]').forEach(el => el.removeAttribute("checked"));
                    view.querySelector(`[action="SetTheme"][value="${name}"]`)?.setAttribute("checked", "true");
                    break;

                case "CopyCatThemeLoaded":
                    this.refreshGlobalStyle(event.target.document, true);
                    break;
                case "CopyCatThemeUnloaded":
                    this.refreshGlobalStyle(event.target.document, false);
                    break;
            }
        },
        _onclick: function (event) {
            let { target: item } = event;
            if (item.localName !== "toolbarbutton") return;
            switch (item.getAttribute('action')) {
                case undefined:
                    this.error("operation not allowed!")
                    break;
                case 'OpenThemesDirectory':
                    this.exec(this.THEME_PATH);
                    break;
                case 'ReloadAllThemes':
                    this.loadThemes(event.target.ownerDocument);
                    this.loadTheme(event.target.ownerDocument);
                    this.refreshThemesList(event.target.ownerDocument);
                    this.refreshThemeOptions(event.target.ownerDocument);
                    if (item.getAttribute("notice") == "true") {
                        this.alert("Reload Theme Success")
                    }
                    break;
                case 'SetTheme':
                    if (event.button === 2) {
                        let id = item.getAttribute('value');
                        if (id && this.themes[id]) {
                            let theme = this.themes[id];
                            if (theme.file.isDirectory()) {
                                if (theme.styles.length === 1)
                                    this.edit(theme.styles[0].file.path);
                                else
                                    this.exec(theme.file.path);
                            } else {
                                this.edit(theme.file.path);
                            }
                        }
                    } else {
                        this.sPrefs("theme", item.getAttribute('value'));
                        if (event.button === 1) // 避免相对定位导致面板被假隐藏
                            item.ownerDocument.querySelectorAll("panelview[visible=true]").forEach(view => view.closest('panel').hidePopup());
                        this.loadTheme();
                    }
                    break;
                case 'SetOption':
                    let pref = item.getAttribute('pref');
                    let value = cPref.get(pref, false);
                    cPref.set(pref, !value);
                    item.checked = !value;
                    this.loadTheme();
                    break;
                default:
                    this.log(item.getAttribute('action'));
            }
        },
        handleRelativePath: function (path) {
            if (path) {
                path = path.replace(/\//g, '\\');
                var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                if (/^(\\)/.test(path)) {
                    return ffdir + path;
                } else {
                    return path;
                }
            }
        },
        loadThemes: function () {
            // load themes
            this.themes = {};
            let file = this.getFile(this.THEME_PATH);
            let files = file.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
            while (files.hasMoreElements()) {
                let file = files.getNext().QueryInterface(Ci.nsIFile);
                let theme = new UserStyle(file);
                if (theme.isTheme) {
                    this.themes[theme.id] = theme;
                }
            }
        },
        loadTheme: function () {
            if (this.theme) {
                // 卸载主题
                this.theme.unregister();
                delete this.theme;
                window.dispatchEvent(new CustomEvent("CopyCatThemeUnloaded"));
            }
            let name = cPref.get("userChromeJS.CopyCat.theme", false, "");
            if (name && this.themes[name]) {
                this.theme = this.themes[name]
                this.theme.register();
                window.dispatchEvent(new CustomEvent("CopyCatThemeLoaded"));
            }

        },
        refreshThemesList: function (document) {
            let viewCache = getViewCache(document),
                view = document.getElementById('CopyCat-ThemeMenu-View') || viewCache?.querySelector("#CopyCat-ThemeMenu-View")
            if (view) {
                view.querySelectorAll('[action="SetOption"]').forEach(el => $R(el));
                view.querySelectorAll('[action="SetTheme"]').forEach(el => {
                    if (!el.hasAttribute("internal"))
                        $R(el);
                });
                let ins = view.querySelector("#CopyCat-ThemeMenu-Themes-InsertPoint");
                Object.values(this.themes).forEach(theme => {
                    let el = ins.parentNode.insertBefore($C(view.ownerDocument, 'toolbarbutton', {
                        label: theme.name,
                        class: "subviewbutton",
                        type: 'radio',
                        action: 'SetTheme',
                        value: theme.id,
                        onclick: 'window.CopyCatTheme._onclick(event)'
                    }), ins);
                });
                let name = window.CopyCatTheme.gPrefs("theme", false, "");
                view.querySelectorAll('[action="SetTheme"]').forEach(el => el.removeAttribute("checked"));
                view.querySelector(`[action="SetTheme"][value="${name}"]`).setAttribute("checked", "true");
            }
        },
        refreshThemeOptions: function (document) {
            let viewCache = getViewCache(document),
                view = document.getElementById('CopyCat-ThemeMenu-View') || viewCache?.querySelector("#CopyCat-ThemeMenu-View")
            if (this.theme?.options && view) {
                view.querySelectorAll('[action="SetOption"]').forEach(el => $R(el));
                let ins = view.querySelector("#CopyCat-ThemeMenu-Options-InsertPoint");
                Object.values(this.theme.options).forEach(option => {
                    let el = ins.parentNode.insertBefore($C(view.ownerDocument, 'toolbarbutton', {
                        label: option.name,
                        tooltiptext: option.name,
                        class: "subviewbutton",
                        type: 'checkbox',
                        pref: option.pref,
                        action: 'SetOption',
                        closemenu: false,
                        checked: cPref.get(option.pref, false, false),
                        onclick: 'window.CopyCatTheme._onclick(event)'
                    }), ins);
                });
            }
        },
        globalStyleListener: {
            onCustomizeEnd(win) {
                window.CopyCatTheme.loadTheme();
            }
        },
        globalStyleObserver: function () {
            let reloadTarget = $C(window.document, 'toolbarbutton', {
                action: "ReloadAllThemes"
            });
            window.CopyCatTheme._onclick({ target: reloadTarget });
        },
        refreshGlobalStyle: function (document, isEnabled = true) {
            document || (document = window.document);
            if (!document) throw new Error("document is required");
            const { getComputedStyle, Services } = document.ownerGlobal;
            if (this.SYNCED_STYLE) {
                window.CopyCatTheme.sss.unregisterSheet(window.CopyCatTheme.SYNCED_STYLE.url, window.CopyCatTheme.SYNCED_STYLE.type);
                delete this.SYNCED_STYLE;
            }
            if (isEnabled) {
                let styles = getComputedStyle(document.documentElement);
                let cssArr = [];
                [...styles].forEach(function (name) {
                    if (name.startsWith('--')) {
                        let val = styles.getPropertyValue(name);
                        cssArr.push(`${name}: ${val};`);
                    }
                });
                let css = ':root{\n' + cssArr.join("\n") + "\n}";
                window.CopyCatTheme.SYNCED_STYLE = {
                    url: Services.io.newURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)),
                    type: window.CopyCatTheme.sss.AUTHOR_SHEET,
                }
                window.CopyCatTheme.sss.loadAndRegisterSheet(window.CopyCatTheme.SYNCED_STYLE.url, window.CopyCatTheme.SYNCED_STYLE.type);
            }
        },
        edit: (pathOrFile, aLineNumber) => {
            let aFile = this.getFile(pathOrFile), editor;
            if (!aFile) {
                this.error($L("param is invalid", "CopyCatTheme.edit", "pathOrFile"));
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

            let aURL = this.getURLSpecFromFile(aFile);
            let aDocument = null;
            let aCallBack = null;
            let aPageDescriptor = null;
            gViewSourceUtils.openInExternalEditor({
                URL: aURL,
                lineNumber: aLineNumber
            }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
        },
        exec: function (pathOrFile, arg) {
            let aFile = this.getFile(pathOrFile);
            if (!aFile) {
                this.error($L("param is invalid", "CopyCatTheme.exec", "pathOrFile"));
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
                    this.error($L("file not found", path));
                    return;
                }

                if (aFile.isExecutable()) {
                    process.init(aFile);
                    process.runw(false, a, a.length);
                } else {
                    aFile.launch();
                }
            } catch (e) {
                this.error(e);
            }
        },
        getFile: function (pathOrFile) {
            let aFile;
            if (pathOrFile instanceof Ci.nsIFile) {
                aFile = pathOrFile;
            } else if (typeof pathOrFile === "string") {
                aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                aFile.initWithPath(pathOrFile);
            } else {
                this.error($L("param is invalid", "CopyCatTheme.getFile", "pathOrFile", pathOrFile));
            }
            return aFile;
        },
        getURLSpecFromFile: function (aFile) {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return fph.getURLSpecFromFile ? fph.getURLSpecFromFile(aFile) : fph.getURLSpecFromActualFile(aFile);
        },
        destroy: function (win) {
            const { document, CustomizableUI, Services } = win;
            if (this.globalStyleMutationObserver)
                this.globalStyleMutationObserver.disconnect();
            Services.prefs.removeObserver("browser.uidensity", this.globalStyleObserver);
            CustomizableUI.removeListener(this.globalStyleListener);
            win.removeEventListener('CopyCatThemeUnloaded', this);
            win.removeEventListener('CopyCatThemeLoaded', this);
            this.refreshGlobalStyle(document, false);
            try {
                CustomizableUI.destroyWidget("CopyCat-ReloadTheme");
            } catch (e) { }
            let view = $('CopyCat-ThemeMenu-View', document)
            if (view) {
                view.closest('panelmultiview').goBack();
                $R(view);
            } else {
                $R(getViewCache(document).querySelector("#CopyCat-ThemeMenu-View"));
            }
            let button = $('CopyCat-ThemeMenu', document);
            if (button) {
                $R(button);
            } else {
                $R(getViewCache(document).querySelector("#CopyCat-ThemeMenu"));
            }
            if (this.theme)
                this.theme.unregister();
            if (this.STYLE) {
                _uc.unregisterSheet(this.STYLE.url, this.STYLE.type);
                delete this.STYLE
            }
            delete window.CopyCatTheme;
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
        error: TopWindow.console.error,
        log: TopWindow.console.log
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function getViewCache(aDoc) {
        return ($('appMenu-viewCache', aDoc) && $('appMenu-viewCache', aDoc).content) || $('appMenu-multiView', aDoc);
    }

    function $L() {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
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

    class UserStyle {
        constructor(aFile) {
            this.file = aFile;
            this.isTheme = false;
            this.styles = [];
            this.PrefObservers = {};
            this.MutationObservers = [];
            this.id = aFile.leafName.replace(/\.css$/, '');
            let themeConfig;
            if (aFile.isDirectory()) {
                let themeConfigFile = aFile.clone();
                themeConfigFile.append("userChrome.json");
                let fileList = [{
                    filename: "userChrome.css"
                }, {

                    filename: "userChrome.au.css"
                }, {
                    filename: "userChrome.ag.css"
                }, {
                    filename: "userChrome.us.css"
                }];
                if (themeConfigFile.exists()) {
                    themeConfig = JSON.parse(readFile(themeConfigFile, false));
                    fileList = themeConfig.files;
                }
                fileList.forEach(file => {
                    let tFile = aFile.clone();
                    tFile.append(file.filename);
                    if (tFile.exists()) {
                        this.isTheme = true;
                        this.filename = aFile.leafName;
                        if (file.filename === "userChrome.css" && !themeConfig) {
                            Object.entries(readStyleInfo(tFile)).forEach(([key, value]) => {
                                this[key] = value;
                            });
                        }
                        this.styles.push({
                            url: Services.io.newURI(window.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName + '/' + tFile.leafName),
                            type: file.hasOwnProperty("type") ? file.type : getStyleType(tFile.leafName),
                            file: tFile
                        });
                    }
                });
            } else if (aFile.leafName.endsWith('.css')) {
                this.isTheme = true;
                Object.entries(readStyleInfo(aFile)).forEach(([key, value]) => {
                    this[key] = value;
                });
                this.styles.push({
                    url: Services.io.newURI(window.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName),
                    type: getStyleType(aFile.leafName),
                    file: aFile
                });
            }
            if (themeConfig) {
                const attrKeys = ["name", "author", "charset", "version", "description", "homepageURL", "downloadURL", "updateURL", "optionsURL", "license", "licenseURL"];
                attrKeys.forEach((key) => {
                    if (themeConfig.hasOwnProperty(key)) {
                        this[key] = themeConfig[key];
                    }
                });
                if (themeConfig.locales) {
                    let arr = Object.keys(themeConfig.locales);
                    this.lang = arr.includes(window.CopyCatTheme.locale) ? themeConfig.locales[window.CopyCatTheme.locale] : themeConfig.locales[arr[0]];
                }
                if (themeConfig.options) {
                    this._options = [];
                    themeConfig.options.forEach(key => {
                        let name = this.lang[key] || key;
                        this._options.push({
                            name: name,
                            pref: key,
                            get value() {
                                return cPref.get(key, false)
                            },
                            toggle: function (value) {
                                cPref.set(key, !!this.value);
                            }
                        });
                    })
                }
                if (themeConfig.monitors) {
                    themeConfig.monitors.forEach(item => {
                        if (item.pref) {
                            this.PrefObservers[item.pref] = {
                                target: window.document.querySelector(item.target) || window.document.querySelector("#main-window"),
                                targetAttr: item.targetAttr || item.pref
                            }
                        }
                        if (item.from && item.attr) {
                            let from = window.document.querySelector(item.from),
                                target = window.document.querySelector(item.target) || window.document.querySelector("#main-window"),
                                targetAttr = item.targetAttr || item.attr;
                            if (from && target) {
                                let config = {
                                    from: from,
                                    attr: item.attr,
                                    target: target,
                                    targetAttr: targetAttr,
                                    observer: new window.MutationObserver((mutations) => {
                                        mutations.forEach((mutation) => {
                                            if (mutation.type === 'attributes' && mutation.attributeName === item.attr) {
                                                target.setAttribute(targetAttr, mutation.target.getAttribute(item.attr));
                                            }
                                        });
                                    })
                                };
                                this.MutationObservers.push(config);
                            }
                        }
                    });
                }
            }
            if ((this.name || "").length === 0) this.name = this.id;
            this.isEnabled = false;
        }

        register() {
            for (let pref in this.PrefObservers) {
                if (this.PrefObservers[pref].target) this.PrefObservers[pref].target.setAttribute(this.PrefObservers[pref].targetAttr, cPref.get(pref));
                if (this.PrefObservers[pref].target && !this.PrefObservers[pref].listener) {
                    const { target, targetAttr } = this.PrefObservers[pref];
                    this.PrefObservers[pref].listener = cPref.addListener(pref, (value) => {
                        target.setAttribute(targetAttr, value);
                    });
                }
            }
            this.MutationObservers.forEach(config => {
                config.observer.observe(config.from, { attributes: true });
            });
            if (!this.isEnabled) {
                this.styles.forEach(style => sss.loadAndRegisterSheet(style.url, style.type));
            }
            this.isEnabled = true;
        }

        unregister() {
            for (let pref in this.PrefObservers) {
                if (this.PrefObservers[pref].hasOwnProperty("listener")) {
                    try {
                        this.PrefObservers[pref].target.removeAttribute(this.PrefObservers[pref].targetAttr);
                        cPref.removeListener(pref, this.PrefObservers[pref].listener);
                        delete this.PrefObservers[pref].listener;
                    } catch (e) { }
                }
            }
            if (this.isEnabled) {
                this.MutationObservers.forEach(config => {
                    config.target.removeAttribute(config.targetAttr);
                    config.observer.disconnect();
                });
                this.styles.forEach(style => window.CopyCatTheme.sss.unregisterSheet(style.url, style.type));
            }
            this.isEnabled = false;
        }

        reload() {
            this.unregister();
            this.register();
        }

        toggle() {
            if (this.isEnabled)
                this.unregister();
            else
                this.register();
            this.isEnabled = !this.isEnabled;
        }

        get options() {
            if (!this._options) {
                this._options = [];
                let keys = {};
                this.styles.forEach(style => {
                    let prefs = getPrefsFromFile(style.file);
                    prefs.forEach(key => {
                        if (!keys[key]) {
                            let name = this.lang[key] || key;
                            this._options.push({
                                name: name,
                                pref: key,
                                get value() {
                                    return cPref.get(key, false, false)
                                },
                                toggle: function (value) {
                                    cPref.set(key, !!this.value);
                                }
                            });
                        }
                        keys[key] = true;
                    })
                });
            }
            return this._options;
        }
    }

    function readStyleInfo(aFile) {
        let content = readFile(aFile, true);
        let header = (content.match(/^\/\*\s*==UserStyle==\s*\n(?:.*\n)*?==\/UserStyle==\s*\*\/\s*\n/m) || [''])[0];
        let def = ['', ''];
        let lang = (header.match(/\* @l10n\s+(.+)\s*$/im) || def)[1];
        try {
            lang = eval("(" + lang + ")");
        } catch (e) {
            lang = {};
        }
        return {
            filename: aFile.leafName || '',
            content: content,
            name: (header.match(/\* @name\s+(.+)\s*$/im) || def)[1],
            charset: (header.match(/\* @charset\s+(.+)\s*$/im) || def)[1],
            version: (header.match(/\* @version\s+(.+)\s*$/im) || def)[1],
            description: (header.match(/\* @description\s+(.+)\s*$/im) || def)[1],
            homepageURL: (header.match(/\* @homepageURL\s+(.+)\s*$/im) || def)[1],
            downloadURL: (header.match(/\* @downloadURL\s+(.+)\s*$/im) || def)[1],
            updateURL: (header.match(/\* @updateURL\s+(.+)\s*$/im) || def)[1],
            optionsURL: (header.match(/\* @optionsURL\s+(.+)\s*$/im) || def)[1],
            author: (header.match(/\* @author\s+(.+)\s*$/im) || def)[1],
            license: (header.match(/\* @license\s+(.+)\s*$/im) || def)[1],
            licenseURL: (header.match(/\* @licenseURL\s+(.+)\s*$/im) || def)[1],
            lang: lang, // url: Services.io.newURI(getURLSpecFromFile(aFile)) 使用这种方式 @supports -moz-bool-pref 不生效
        }
    }

    function readFile(aFile, metaOnly) {
        if (!aFile) {
            TopWindow.console.error($L("param is invalid", "readFile", "aFile"));
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

    function getStyleType(name) {
        var type;
        if (/\.(?:au||ag||us)\.css$/i.test(name)) {
            var typePrefix = name.substring(name.length - 6, name.length - 4);
            switch (typePrefix) {
                case "au":
                    type = sss.AUTHOR_SHEET;
                    break;
                case "ag":
                    type = sss.AGENT_SHEET;
                    break;
                case "us":
                    type = sss.USER_SHEET;
                    break;
            }
        } else {
            type = sss.AUTHOR_SHEET;
        }
        return type;
    }

    function getPrefsFromFile(aFile) {
        const regexImport = /@import url\("([^"]+)"\)/m;
        let content = readFile(aFile, false);
        let prefs = [];
        prefs = matchPrefs(content);
        let files = content.match(regexImport);
        if (files) {
            files.filter(m => !m.startsWith("@import")).map(m => m.replaceAll(/\//g, "\\\\")).forEach(m => {
                let file = aFile.parent.clone();
                file.appendRelativePath(m);
                if (file.exists()) {
                    let content = readFile(file, false);
                    let ps = matchPrefs(content);
                    ps.forEach(p => {
                        if (!prefs.includes(p)) prefs.push(p);
                    })
                }
            });
        }
        return prefs;
    }

    function matchPrefs(content) {
        const regexPref = /-moz-bool-pref\("([^"]+)"\)/gm;
        let matches = content.match(regexPref);
        let options = [];
        if (matches) {
            matches.forEach(m => {
                let [, key] = m.match(/"([\w\.\-]+)"/);
                if (!options.includes(key)) options.push(key);
            })
        }
        return options;
    }

    function $R(el) {
        if (el && el.parentNode) {
            try {
                el.parentNode.removeChild(el);
                return true;
            } catch (e) {
                this.error(e);
            }
        }
        return false;
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

    window.CopyCatTheme.init(window);
    let reloadTarget = $C(window.document, 'toolbarbutton', {
        action: "ReloadAllThemes"
    })
    if (gBrowserInit.delayedStartupFinished) window.CopyCatTheme._onclick({ target: reloadTarget })
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.CopyCatTheme._onclick({ target: reloadTarget });
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
#CopyCat-ThemeMenu-View toolbaritem.toolbaritem-combined-buttons {
    padding: 0 !important;
}
#CopyCat-ThemeMenu-View toolbaritem.toolbaritem-combined-buttons > .subviewbutton {
    padding: var(--arrowpanel-menuitem-padding) !important;
    margin-inline-start: 0 !important;
}
#CopyCat-ThemeMenu-View toolbaritem.toolbaritem-combined-buttons.showFirstText > .subviewbutton:first-child {
    -moz-box-flex: 1 !important;
}
#CopyCat-ThemeMenu-View .subviewbutton > .toolbarbutton-icon {
    width: 16px;
    height: 16px;
}
#CopyCat-ThemeMenu-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-text,
#CopyCat-ThemeMenu-View .subviewbutton > .toolbarbutton-text {
    padding-inline-start: 8px !important;
}
#CopyCat-ThemeMenu-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:first-child > .toolbarbutton-text {
    display: -moz-inline-box !important;
}
#CopyCat-ThemeMenu-View .toolbaritem-combined-buttons.showFirstText > .subviewbutton:not(:first-child) > .toolbarbutton-text {
    display: none !important;
}
#CopyCat-ThemeMenu-View .toolbaritem-combined-buttons > .subviewbutton-iconic > .toolbarbutton-text, #CopyCat-ThemeMenu-View .toolbaritem-combined-buttons > .subviewbutton:not(.subviewbutton-iconic) > .toolbarbutton-icon {
    display: -moz-inline-box !important;
}

`);
