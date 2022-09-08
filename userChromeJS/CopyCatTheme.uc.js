// ==UserScript==
// @name            CopyCatTheme.uc.js
// @description     CopyCat 主题专用加载脚本
// @license         MIT License
// @shutdown        UC.CopyCatTheme.destroy();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

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

    UC.CopyCatTheme = {
        PREF_LISTENER_LIST: {},
        CACHED_VIEWS: [],
        get THEME_RELATED_PATH() {
            return "\\chrome\\UserThemes";
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
            return this.THEME_URL_PREFIX = "resource://userchromejs/" + URI;
        },
        get browserWin() { return Services.wm.getMostRecentWindow("navigator:browser"); },
        get debug() { return xPref.get("userChromeJS.CopyCat.debug", false, false); },
        STYLE: {
            url: Services.io.newURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)),
            type: 2,
        },
        init: function () {
            this.STYLE = _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
            let viewCache = getViewCache(document);
            let view = document.getElementById("CopyCat-ThemeMenu-View") || viewCache.querySelector("#CopyCat-ThemeMenu-View");
            if (!view) {
                viewCache.appendChild(window.MozXULElement.parseXULToFragment(`
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
                style: 'list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);',
            }, {
                label: $L("open themes directory"),
                action: "OpenThemesDirectory",
            }, {}, {
                type: 'html:h2',
                class: 'subview-subheader',
                content: $L("themes list")
            }, {
                label: $L("close theme"),
                internal: 'true',
                type: 'radio',
                skin: true,
                pref: 'userChromeJS.CopyCat.theme',
                value: '',
                action: 'SetTheme'
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
            this.refreshThemesList();
            this.refreshThemeOptions();

            if (this.debug) {
                CustomizableUI.createWidget({
                    id: 'CopyCat-ReloadTheme',
                    label: $L("reload themes"),
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    onCreated: node => {
                        $A(node, {
                            oncommand: 'UC.CopyCatTheme.reloadAllThemes();',
                            style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+DQogIDxwYXRoIGZpbGw9IiM1MGU2ZmYiIGQ9Ik0xMC4yMjgsMTUuODg1TDcuMzIsMTIuOTc3QzUuMjI2LDE2LjEzOCw0LDE5LjkyNCw0LDI0YzAsMy42NjgsMC45OTMsNy4xMDMsMi43MTksMTAuMDU4YzAuMjkzLDAuNTAyLDAuOTk0LDAuNTczLDEuNDA1LDAuMTYxbDEuNjQtMS42NGMwLjI3NS0wLjI3NSwwLjMyNi0wLjY5MywwLjE0Mi0xLjAzNUM4LjY5NywyOS4yOTUsOCwyNi43MzIsOCwyNEM4LDIxLjAzNCw4LjgyMSwxOC4yNjcsMTAuMjI4LDE1Ljg4NXoiIC8+DQogIDxwYXRoIGZpbGw9IiMxOTliZTIiIGQ9Ik00MCwyNGMwLDIuOTY2LTAuODIxLDUuNzMzLTIuMjI4LDguMTE1bDIuOTA4LDIuOTA4QzQyLjc3NCwzMS44NjIsNDQsMjguMDc1LDQ0LDI0YzAtMy42NjgtMC45OTMtNy4xMDMtMi43MTktMTAuMDU4Yy0wLjI5My0wLjUwMi0wLjk5NC0wLjU3Mi0xLjQwNS0wLjE2MWwtMS42NCwxLjY0Yy0wLjI3NSwwLjI3NS0wLjMyNiwwLjY5My0wLjE0MiwxLjAzNUMzOS4zMDMsMTguNzA1LDQwLDIxLjI2OCw0MCwyNHoiIC8+DQogIDxwYXRoIGZpbGw9IiMzNWMxZjEiIGQ9Ik0xNS40MjEsOS43NjRjMC4yNzUsMC4yNzUsMC42OTMsMC4zMjYsMS4wMzUsMC4xNDJDMTguNzA1LDguNjk3LDIxLjI2OCw4LDI0LDhjMi45NjYsMCw1LjczMywwLjgyMSw4LjExNSwyLjIyOGwyLjkwOS0yLjkwOUMzMS44NjIsNS4yMjYsMjguMDc2LDQsMjQsNGMtMy42NSwwLTcuMDY4LDAuOTgzLTEwLjAxMywyLjY5M2MtMC41MjEsMC4zMDMtMC42MzEsMS4wMDYtMC4yMDUsMS40MzJMMTUuNDIxLDkuNzY0eiIgLz4NCiAgPHBhdGggZmlsbD0iIzAwNzhkNCIgZD0iTTMyLjU3OSwzOC4yMzZjLTAuMjc1LTAuMjc1LTAuNjkzLTAuMzI2LTEuMDM1LTAuMTQyQzI5LjI5NSwzOS4zMDMsMjYuNzMyLDQwLDI0LDQwYy0yLjk2NiwwLTUuNzMzLTAuODIxLTguMTE1LTIuMjI4bC0yLjkwOCwyLjkwOEMxNi4xMzgsNDIuNzc0LDE5LjkyNSw0NCwyNCw0NGMzLjY2OCwwLDcuMTAzLTAuOTkzLDEwLjA1OC0yLjcxOWMwLjUwMi0wLjI5MywwLjU3My0wLjk5NCwwLjE2MS0xLjQwNUwzMi41NzksMzguMjM2eiIgLz4NCiAgPHBhdGggZmlsbD0iIzM1YzFmMSIgZD0iTTM1LjkzNCwxMi4wNzVMMzEuMSwxMS45MDljLTAuMzQyLTAuMDEyLTAuNTEyLTAuNDIxLTAuMjc3LTAuNjcxbDQuNjU3LTQuOTc1YzAuMjQyLTAuMjU5LDAuNjc2LTAuMDk3LDAuNjksMC4yNTdsMC4yMDEsNS4xMTdDMzYuMzgsMTEuODgyLDM2LjE3OSwxMi4wODMsMzUuOTM0LDEyLjA3NXoiIC8+DQogIDxwYXRoIGZpbGw9IiMwMDc4ZDQiIGQ9Ik0xMi4wNjYsMzUuOTI1bDQuODM0LDAuMTY2YzAuMzQyLDAuMDEyLDAuNTEyLDAuNDIxLDAuMjc3LDAuNjcxbC00LjY1Nyw0Ljk3NWMtMC4yNDIsMC4yNTktMC42NzYsMC4wOTctMC42OS0wLjI1N2wtMC4yMDEtNS4xMTdDMTEuNjIsMzYuMTE4LDExLjgyMSwzNS45MTcsMTIuMDY2LDM1LjkyNXoiIC8+DQogIDxwYXRoIGZpbGw9IiMxOTliZTIiIGQ9Ik0zNS45MjUsMzUuOTM0bDAuMTY2LTQuODM0YzAuMDEyLTAuMzQyLDAuNDIxLTAuNTEyLDAuNjcxLTAuMjc3bDQuOTc1LDQuNjU3YzAuMjU5LDAuMjQyLDAuMDk3LDAuNjc2LTAuMjU3LDAuNjlsLTUuMTE3LDAuMjAxQzM2LjExOCwzNi4zOCwzNS45MTcsMzYuMTc5LDM1LjkyNSwzNS45MzR6IiAvPg0KICA8cGF0aCBmaWxsPSIjNTBlNmZmIiBkPSJNMTIuMDc1LDEyLjA2NkwxMS45MDksMTYuOWMtMC4wMTIsMC4zNDItMC40MjEsMC41MTItMC42NzEsMC4yNzdMNi4yNjIsMTIuNTJjLTAuMjU5LTAuMjQyLTAuMDk3LTAuNjc2LDAuMjU3LTAuNjlsNS4xMTctMC4yMDFDMTEuODgyLDExLjYyLDEyLjA4MywxMS44MjEsMTIuMDc1LDEyLjA2NnoiIC8+DQo8L3N2Zz4=)'
                        })
                    }
                })
            }
        },
        handleEvent: function (event) {
            switch (event.type) {
                case 'ViewShowing':
                    let { target: view } = event;
                    let name = xPref.get("userChromeJS.CopyCat.theme", false, "");
                    view.querySelectorAll('[action="SetTheme"]').forEach(el => el.removeAttribute("checked"));
                    view.querySelector(`[action="SetTheme"][value="${name}"]`)?.setAttribute("checked", "true");
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
                    this.loadThemes();
                    this.loadTheme();
                    this.refreshThemesList();
                    this.refreshThemeOptions();
                    break;
                case 'SetTheme':
                    if (event.button === 2) {
                        let name = item.getAttribute('value');
                        if (name && this.themes[name]) {
                            let theme = this.themes[name];
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
                        xPref.set("userChromeJS.CopyCat.theme", item.getAttribute('value'));
                        this.loadTheme();
                        this.refreshThemesList();
                        this.refreshThemeOptions();
                    }
                    break;
                case 'SetOption':
                    let pref = item.getAttribute('pref');
                    let value = xPref.get(pref, false, false);
                    xPref.set(pref, !value);
                    item.checked = !value;
                    this.loadTheme();
                    break;
                default:
                    this.log(item.getAttribute('action'));
            }
        },
        handleRelativePath: function (path) {
            if (path) {
                path = path.replace(/\//g, '\\').toLocaleLowerCase();
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
                    this.themes[theme.filename] = theme;
                }
            }
        },
        loadTheme: function () {
            if (this.theme) {
                // 卸载主题
                this.theme.unregister();
                delete this.theme;
            }
            let name = xPref.get("userChromeJS.CopyCat.theme", false, "");
            if (name && this.themes[name]) {
                this.theme = this.themes[name]
                this.theme.register();
            }
        },
        refreshThemesList: function () {
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
                        value: theme.filename,
                        onclick: 'UC.CopyCatTheme._onclick(event)'
                    }), ins);
                });
                let name = xPref.get("userChromeJS.CopyCat.theme", false, "");
                view.querySelectorAll('[action="SetTheme"]').forEach(el => el.removeAttribute("checked"));
                view.querySelector(`[action="SetTheme"][value="${name}"]`).setAttribute("checked", "true");
            }
        },
        refreshThemeOptions() {
            let viewCache = getViewCache(document),
                view = document.getElementById('CopyCat-ThemeMenu-View') || viewCache?.querySelector("#CopyCat-ThemeMenu-View")
            if (this.theme?.options && view) {
                view.querySelectorAll('[action="SetOption"]').forEach(el => $R(el));
                let ins = view.querySelector("#CopyCat-ThemeMenu-Options-InsertPoint");
                Object.values(this.theme.options).forEach(option => {
                    let el = ins.parentNode.insertBefore($C(view.ownerDocument, 'toolbarbutton', {
                        label: option.name,
                        class: "subviewbutton",
                        type: 'checkbox',
                        pref: option.pref,
                        action: 'SetOption',
                        checked: xPref.get(option.pref, false, false),
                        onclick: 'UC.CopyCatTheme._onclick(event)'
                    }), ins);
                });
            }
        },
        edit: function (pathOrFile, aLineNumber) {
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
        getFile(pathOrFile) {
            let aFile;
            if (pathOrFile instanceof Ci.nsIFile) {
                aFile = pathOrFile;
            } else if (typeof pathOrFile === "string") {
                aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                aFile.initWithPath(pathOrFile);
            } else {
                this.error($L("param is invalid", "CopyCatTheme.getFile", "pathOrFile"));
            }
            return aFile;
        },
        getURLSpecFromFile: function (aFile) {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return fph.getURLSpecFromFile ? fph.getURLSpecFromFile(aFile) : fph.getURLSpecFromActualFile(aFile);
        },
        destroy: function () {
            CustomizableUI.destroyWidget("CopyCat-ReloadTheme");
            let view = $('CopyCat-ThemeMenu-View')
            if (view) {
                view.closest('panelmultiview').goBack();
                $R(view);
            } else {
                $R(getViewCache(document).querySelector("#CopyCat-ThemeMenu-View"));
            }
            let button = $('CopyCat-ThemeMenu');
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
            this.id = aFile.leafName.replace(/\.css$/, '');
            if (aFile.isDirectory()) {
                let themeJson = aFile.clone();
                themeJson.append("theme.json");
                if (themeJson.exists()) {
                    // 存在主题数据 // 暂时不实现
                } else {
                    let userChromeCss = aFile.clone();
                    userChromeCss.append('userChrome.css');
                    if (userChromeCss.exists()) {
                        Object.entries(readStyleInfo(userChromeCss)).forEach(([key, value]) => {
                            this[key] = value;
                        });
                        this.styles.push({
                            url: Services.io.newURI(UC.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName + '/userChrome.css'),
                            type: getStyleType(aFile.leafName),
                            file: userChromeCss
                        });
                        this.isTheme = true;
                        this.filename = aFile.leafName;
                    }
                    ["userChrome.au.css", "userChrome.ag.css", "userChrome.us.css"].forEach(name => {
                        let tFile = aFile.clone();
                        tFile.append(name);
                        if (tFile.exists()) {
                            this.styles.push({
                                url: Services.io.newURI(UC.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName + '/' + tFile.leafName),
                                type: getStyleType(tFile.leafName),
                                file: tFile
                            });
                        }
                    });
                }
            } else if (aFile.leafName.endsWith('.css')) {
                this.isTheme = true;
                Object.entries(readStyleInfo(aFile)).forEach(([key, value]) => {
                    this[key] = value;
                });
                this.styles.push({
                    url: Services.io.newURI(UC.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName),
                    type: getStyleType(aFile.leafName),
                    file: aFile
                });
            }
            if ((this.name || "").length === 0) this.name = this.id;
            this.isEnabled = false;
        }

        register() {
            if (!this.isEnabled)
                this.styles.forEach(style => _uc.sss.loadAndRegisterSheet(style.url, style.type));
            this.isEnabled = true;
        }

        unregister() {
            if (this.isEnabled)
                this.styles.forEach(style => _uc.sss.unregisterSheet(style.url, style.type));
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
                    let content = readFile(style.file),
                        optionKeys = content.match(/-moz-bool-pref\("([\w\.\-]+)"\)/gm);
                    if (optionKeys)
                        optionKeys.forEach(option => {
                            let [, key] = option.match(/"([\w\.\-]+)"/);
                            let name = this.lang[key] || key;
                            if (!keys[key]) {
                                this._options.push({
                                    name: name,
                                    pref: key,
                                    get value() {
                                        return xPref.get(key, false, false)
                                    },
                                    toggle: function (value) {
                                        xPref.set(key, !!this.value);
                                    }
                                });
                                keys[key] = true;
                            }
                        });
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
                    type = _uc.sss.AUTHOR_SHEET;
                    break;
                case "ag":
                    type = _uc.sss.AGENT_SHEET;
                    break;
                case "us":
                    type = _uc.sss.USER_SHEET;
                    break;
            }
        } else {
            type = _uc.sss.AUTHOR_SHEET;
        }
        return type;
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

    if (gBrowserInit.delayedStartupFinished) UC.CopyCatTheme.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                UC.CopyCatTheme.init();
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
