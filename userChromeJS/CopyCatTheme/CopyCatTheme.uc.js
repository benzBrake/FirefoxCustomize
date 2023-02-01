// ==UserScript==
// @name            CopyCatTheme.uc.js
// @description     CopyCat 主题专用加载脚本
// @license         MIT License
// @shutdown        window.CopyCatTheme.destroy(win);
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://userchrome/content/utils/ThemeOptions.html
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    const LANG = {
        "zh-CN": {
            "copycat themes management": "CopyCat 主题管理",
            "copycat themes management tooltip": "CopyCat 主题管理\n左键：菜单\n中建：重载",
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
            "reload theme success": "主题重载完成"
        }
    }

    const MENUS = [{
        action: 'ReloadAllThemes',
        label: $L("reload themes"),
        oncommand: 'window.CopyCatTheme._onclick(event)',
        style: 'list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);',
        notice: true
    }, {
        label: $L("open themes directory"),
        action: "OpenThemesDirectory",
        style: 'list-style-image: url(chrome://global/skin/icons/folder.svg)',
        oncommand: 'window.CopyCatTheme._onclick(event)'
    }, {}, {
        label: $L("theme options"),
        style: 'list-style-image: url("chrome://global/skin/icons/settings.svg");',
        action: "OpenThemesOptions",
        oncommand: 'window.CopyCatTheme._onclick(event)'
    }];

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

    if (location.href.startsWith("chrome://userchrome/content/utils/ThemeOptions.html")) {
        window.CopyCatThemeManagement = {
            init: function () {
                this.refreshThemeList();
                this.refreshThemeOptions();
            },
            refreshThemeList: function () {
                const themeList = $("themeList");
                [...themeList.childNodes].forEach(elm => $R(elm));
                let closeTheme = $C(document, "li");
                closeTheme.appendChild($C(document, "html:input", {
                    type: "radio",
                    id: "no-theme",
                    name: "theme",
                    value: ""
                }));
                let label = closeTheme.appendChild($C(document, "html:label", {
                    for: "no-theme",
                }));
                label.innerText = $L("close theme");
                closeTheme.addEventListener("click", function (event) {
                    if (event.target.localName !== "input") return;
                    const { CopyCatTheme } = TopWindow;
                    CopyCatTheme.sPrefs("theme", "");
                    CopyCatTheme.loadTheme();
                    CopyCatThemeManagement.refreshThemeOptions();
                });
                themeList.appendChild(closeTheme);
                Object.values(TopWindow.CopyCatTheme.themes).forEach(theme => {
                    let li = $C(document, "li");
                    let input = $C(document, "html:input", {
                        type: "radio",
                        id: theme.id,
                        name: "theme",
                        value: theme.id
                    });
                    li.appendChild(input);
                    let label = $C(document, "html:label", {
                        for: theme.id
                    });
                    label.innerText = theme.name;
                    li.appendChild(label);
                    li.addEventListener("click", function (event) {
                        if (event.target.localName !== "input") return;
                        let item = event.target;
                        let id = item.getAttribute('value');
                        const { CopyCatTheme } = TopWindow;
                        if (id && CopyCatTheme.themes[id]) {
                            CopyCatTheme.sPrefs("theme", id);
                        }
                        CopyCatTheme.loadTheme();
                        CopyCatThemeManagement.refreshThemeOptions();
                    });
                    themeList.appendChild(li);
                });
                if (typeof TopWindow.CopyCatTheme.theme !== "undefined") {
                    let item = themeList.querySelector(`[value="${TopWindow.CopyCatTheme.theme.id}"]`);
                    if (item)
                        item.checked = true;
                } else {
                    $("no-theme").checked = true;
                }
            },
            refreshThemeOptions: function () {
                const themeOptions = $("themeOptions");
                [...themeOptions.childNodes].forEach(elm => $R(elm));
                if (typeof TopWindow.CopyCatTheme.theme === "undefined") return;
                Object.values(TopWindow.CopyCatTheme.theme.options).forEach(option => {
                    let li = $C(document, "li");
                    if (option.options) {
                        let label = $C(document, "html:label", {
                            for: option.pref.replace(".", "-")
                        });
                        label.innerText = option.name;
                        li.appendChild(label);
                        let select = $C(document, "html:select", {
                            id: option.pref.replace(".", "-"),
                            name: option.pref,
                        });
                        option.options.forEach(obj => {
                            let opt = $C(document, "html:option", {
                                value: obj.value,
                            });
                            opt.innerText = TopWindow.CopyCatTheme.theme.lang[obj["data-l10n-id"]] || obj.value;
                            if (option.value === obj.value) opt.selected = true;
                            select.appendChild(opt);
                        });
                        select.addEventListener("change", function (event) {
                            const { CopyCatTheme } = TopWindow;
                            let { target: item } = event;
                            cPref.set(item.getAttribute("name"), item.value);
                            CopyCatTheme.loadTheme();
                        });
                        li.appendChild(select);
                    } else if (option.toggle) {
                        let input = $C(document, "html:input", {
                            id: option.pref.replace(".", "-"),
                            type: "checkbox",
                            name: option.pref,
                        });
                        if (cPref.get(option.pref, false, false)) {
                            input.checked = true;
                        }
                        input.addEventListener("click", function (event) {
                            if (event.target.localName !== "input") return;
                            const { CopyCatTheme } = TopWindow;
                            let item = event.target;
                            let pref = item.getAttribute("name");
                            let newVal = !cPref.get(pref, false, false);
                            cPref.set(pref, newVal);
                            item.checked = newVal;
                            CopyCatTheme.loadTheme();
                        });
                        li.appendChild(input);
                        let label = $C(document, "html:label", {
                            for: option.pref.replace(".", "-")
                        });
                        label.innerText = option.name;
                        li.appendChild(label);
                    }
                    themeOptions.appendChild(li);
                });
            }
        }
        window.CopyCatThemeManagement.init();
    } else {
        window.CopyCatTheme = {
            PREF_LISTENER_LIST: {},
            CACHED_VIEWS: [],
            get appVersion() {
                delete this.appVersion;
                return this.appVersion = Services.appinfo.version.split(".")[0];
            },
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
            get buildPanel() {
                delete this.buildPanel;
                return this.buildPanel = this.gPrefs("buildPanel", false);
            },
            sPrefs(key, val) {
                cPref.set("userChromeJS.CopyCat." + key, val);
            },
            gPrefs(key, defaultValue) {
                return cPref.get("userChromeJS.CopyCat." + key, defaultValue);
            },
            get showInToolsMenu() { return this.gPrefs("showInToolsMenu", false) },
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
            get reloadTarget() {
                delete this.reloadTarget;
                return this.reloadTarget = $C(document, "menuitem", {
                    action: "ReloadAllThemes",
                })
            },
            get reloadTargetWithNotice() {
                delete this.reloadTargetWithNotice;
                return this.reloadTargetWithNotice = $C(document, "menuitem", {
                    action: "ReloadAllThemes",
                    notice: "true"
                })
            },
            init: async function () {
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
                window.addEventListener('CopyCatThemeUnloaded', this);
                window.addEventListener('CopyCatThemeLoaded', this);

                if (this.buildPanel) {
                    if (!(CustomizableUI.getWidget('CopyCatTheme-Btn') && CustomizableUI.getWidget('CopyCatTheme-Btn').forWindow(window)?.node)) {
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
                        view.addEventListener('ViewShowing', this, { once: true });
                        let themeMenu = $C(document, 'toolbarbutton', {
                            id: 'CopyCatTheme-Menu',
                            class: 'subviewbutton subviewbutton-nav',
                            type: 'view',
                            view: "CopyCat-ThemeMenu-View",
                            closemenu: "none",
                            label: $L("theme settings"),
                            oncommand: "PanelUI.showSubView('CopyCat-ThemeMenu-View', this)"
                        });
                        let mainView = getViewCache(document).querySelector('#appMenu-protonMainView'),
                            ins = mainView.querySelector('#appMenu-more-button2');
                        ins.before(themeMenu);
                    }
                } else {
                    if (this.showInToolsMenu) {
                        let ins = $("devToolsSeparator", document);
                        let menu = $C(document, "menu", {
                            id: "CopyCatTheme-Menu",
                            label: $L("theme settings"),
                            class: "menu-iconic",
                            style: "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTE1LjU5Mzc1IDIuOTY4NzVDMTUuMDYyNSAyLjk4NDM3NSAxNC41MTU2MjUgMy4wNDI5NjkgMTMuOTY4NzUgMy4xMjVMMTMuOTM3NSAzLjEyNUM4LjYxMzI4MSAzLjk5NjA5NCA0LjMwMDc4MSA4LjE5MTQwNiAzLjIxODc1IDEzLjVDMi44OTQ1MzEgMTUuMDExNzE5IDIuOTE0MDYzIDE2LjQyMTg3NSAzLjEyNSAxNy44MTI1QzMuMTMyODEzIDE3LjgxNjQwNiAzLjEyNSAxNy44MzU5MzggMy4xMjUgMTcuODQzNzVDMy40NTMxMjUgMjAuMTkxNDA2IDYuNSAyMS4yMTg3NSA4LjIxODc1IDE5LjVDOS40NDkyMTkgMTguMjY5NTMxIDExLjI2OTUzMSAxOC4yNjk1MzEgMTIuNSAxOS41QzEzLjczMDQ2OSAyMC43MzA0NjkgMTMuNzMwNDY5IDIyLjU1MDc4MSAxMi41IDIzLjc4MTI1QzEwLjc4MTI1IDI1LjUgMTEuODA4NTk0IDI4LjU0Njg3NSAxNC4xNTYyNSAyOC44NzVDMTQuMTY0MDYzIDI4Ljg3NSAxNC4xODM1OTQgMjguODY3MTg4IDE0LjE4NzUgMjguODc1QzE1LjU2NjQwNiAyOS4wODU5MzggMTYuOTY4NzUgMjkuMDk3NjU2IDE4LjQ2ODc1IDI4Ljc4MTI1QzE4LjQ4MDQ2OSAyOC43ODEyNSAxOC40ODgyODEgMjguNzgxMjUgMTguNSAyOC43ODEyNUMyMy44MjQyMTkgMjcuNzg5MDYzIDI4LjAwNzgxMyAyMy4zNzUgMjguODc1IDE4LjA2MjVMMjguODc1IDE4LjAzMTI1QzMwLjAwNzgxMyAxMC4zOTA2MjUgMjQuNDIxODc1IDMuNzE4NzUgMTcuMTU2MjUgMy4wMzEyNUMxNi42MzY3MTkgMi45ODA0NjkgMTYuMTI1IDIuOTUzMTI1IDE1LjU5Mzc1IDIuOTY4NzUgWiBNIDE1LjYyNSA0Ljk2ODc1QzE2LjA3ODEyNSA0Ljk1MzEyNSAxNi41MjczNDQgNC45NjA5MzggMTYuOTY4NzUgNUMyMy4xNjQwNjMgNS41NjY0MDYgMjcuODc1IDExLjIxNDg0NCAyNi45MDYyNSAxNy43NUMyNi4xNzU3ODEgMjIuMjI2NTYzIDIyLjU4NTkzOCAyNS45OTIxODggMTguMTI1IDI2LjgxMjVMMTguMDkzNzUgMjYuODEyNUMxNi44MTY0MDYgMjcuMDg1OTM4IDE1LjYzNjcxOSAyNy4wODk4NDQgMTQuNDM3NSAyNi45MDYyNUMxMy42MTcxODggMjYuODA0Njg4IDEzLjIzODI4MSAyNS44ODY3MTkgMTMuOTA2MjUgMjUuMjE4NzVDMTUuODc1IDIzLjI1IDE1Ljg3NSAyMC4wNjI1IDEzLjkwNjI1IDE4LjA5Mzc1QzExLjkzNzUgMTYuMTI1IDguNzUgMTYuMTI1IDYuNzgxMjUgMTguMDkzNzVDNi4xMTMyODEgMTguNzYxNzE5IDUuMTk1MzEzIDE4LjM4MjgxMyA1LjA5Mzc1IDE3LjU2MjVDNC45MTAxNTYgMTYuMzYzMjgxIDQuOTE0MDYzIDE1LjE4MzU5NCA1LjE4NzUgMTMuOTA2MjVDNi4xMDU0NjkgOS40MTc5NjkgOS43NzM0MzggNS44MjQyMTkgMTQuMjUgNS4wOTM3NUMxNC43MTg3NSA1LjAyMzQzOCAxNS4xNzE4NzUgNC45ODQzNzUgMTUuNjI1IDQuOTY4NzUgWiBNIDE0IDdDMTIuODk0NTMxIDcgMTIgNy44OTQ1MzEgMTIgOUMxMiAxMC4xMDU0NjkgMTIuODk0NTMxIDExIDE0IDExQzE1LjEwNTQ2OSAxMSAxNiAxMC4xMDU0NjkgMTYgOUMxNiA3Ljg5NDUzMSAxNS4xMDU0NjkgNyAxNCA3IFogTSAyMSA5QzE5Ljg5NDUzMSA5IDE5IDkuODk0NTMxIDE5IDExQzE5IDEyLjEwNTQ2OSAxOS44OTQ1MzEgMTMgMjEgMTNDMjIuMTA1NDY5IDEzIDIzIDEyLjEwNTQ2OSAyMyAxMUMyMyA5Ljg5NDUzMSAyMi4xMDU0NjkgOSAyMSA5IFogTSA5IDExQzcuODk0NTMxIDExIDcgMTEuODk0NTMxIDcgMTNDNyAxNC4xMDU0NjkgNy44OTQ1MzEgMTUgOSAxNUMxMC4xMDU0NjkgMTUgMTEgMTQuMTA1NDY5IDExIDEzQzExIDExLjg5NDUzMSAxMC4xMDU0NjkgMTEgOSAxMSBaIE0gMjMgMTZDMjEuODk0NTMxIDE2IDIxIDE2Ljg5NDUzMSAyMSAxOEMyMSAxOS4xMDU0NjkgMjEuODk0NTMxIDIwIDIzIDIwQzI0LjEwNTQ2OSAyMCAyNSAxOS4xMDU0NjkgMjUgMThDMjUgMTYuODk0NTMxIDI0LjEwNTQ2OSAxNiAyMyAxNiBaIE0gMTkgMjFDMTcuODk0NTMxIDIxIDE3IDIxLjg5NDUzMSAxNyAyM0MxNyAyNC4xMDU0NjkgMTcuODk0NTMxIDI1IDE5IDI1QzIwLjEwNTQ2OSAyNSAyMSAyNC4xMDU0NjkgMjEgMjNDMjEgMjEuODk0NTMxIDIwLjEwNTQ2OSAyMSAxOSAyMVoiIC8+DQo8L3N2Zz4=);"
                        });
                        let menupopup = menu.appendChild($C(document, "menupopup", {
                            id: 'CopyCatTheme-Popup',
                        }));
                        menupopup.addEventListener("popupshowing", CopyCatTheme.handleEvent, { once: true });
                        ins.parentNode.insertBefore(menu, ins);
                    } else {
                        if (!(CustomizableUI.getWidget('CopyCatTheme-Btn') && CustomizableUI.getWidget('CopyCatTheme-Btn').forWindow(window)?.node)) {
                            CustomizableUI.createWidget({
                                id: 'CopyCatTheme-Btn',
                                removable: true,
                                defaultArea: CustomizableUI.AREA_NAVBAR,
                                localized: false,
                                onCreated: node => {
                                    let menupopup = node.appendChild($C(node.ownerDocument, "menupopup", {
                                        id: 'CopyCatTheme-Popup',
                                        onpopuphidden: (event) => {
                                            event.target.closest("toolbarbutton").removeAttribute("open");
                                        }
                                    }));
                                    menupopup.addEventListener("popupshowing", CopyCatTheme.handleEvent, { once: true });
                                    $A(node, {
                                        label: $L("copycat themes management"),
                                        tooltiptext: $L("copycat themes management tooltip"),
                                        style: "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTE1LjU5Mzc1IDIuOTY4NzVDMTUuMDYyNSAyLjk4NDM3NSAxNC41MTU2MjUgMy4wNDI5NjkgMTMuOTY4NzUgMy4xMjVMMTMuOTM3NSAzLjEyNUM4LjYxMzI4MSAzLjk5NjA5NCA0LjMwMDc4MSA4LjE5MTQwNiAzLjIxODc1IDEzLjVDMi44OTQ1MzEgMTUuMDExNzE5IDIuOTE0MDYzIDE2LjQyMTg3NSAzLjEyNSAxNy44MTI1QzMuMTMyODEzIDE3LjgxNjQwNiAzLjEyNSAxNy44MzU5MzggMy4xMjUgMTcuODQzNzVDMy40NTMxMjUgMjAuMTkxNDA2IDYuNSAyMS4yMTg3NSA4LjIxODc1IDE5LjVDOS40NDkyMTkgMTguMjY5NTMxIDExLjI2OTUzMSAxOC4yNjk1MzEgMTIuNSAxOS41QzEzLjczMDQ2OSAyMC43MzA0NjkgMTMuNzMwNDY5IDIyLjU1MDc4MSAxMi41IDIzLjc4MTI1QzEwLjc4MTI1IDI1LjUgMTEuODA4NTk0IDI4LjU0Njg3NSAxNC4xNTYyNSAyOC44NzVDMTQuMTY0MDYzIDI4Ljg3NSAxNC4xODM1OTQgMjguODY3MTg4IDE0LjE4NzUgMjguODc1QzE1LjU2NjQwNiAyOS4wODU5MzggMTYuOTY4NzUgMjkuMDk3NjU2IDE4LjQ2ODc1IDI4Ljc4MTI1QzE4LjQ4MDQ2OSAyOC43ODEyNSAxOC40ODgyODEgMjguNzgxMjUgMTguNSAyOC43ODEyNUMyMy44MjQyMTkgMjcuNzg5MDYzIDI4LjAwNzgxMyAyMy4zNzUgMjguODc1IDE4LjA2MjVMMjguODc1IDE4LjAzMTI1QzMwLjAwNzgxMyAxMC4zOTA2MjUgMjQuNDIxODc1IDMuNzE4NzUgMTcuMTU2MjUgMy4wMzEyNUMxNi42MzY3MTkgMi45ODA0NjkgMTYuMTI1IDIuOTUzMTI1IDE1LjU5Mzc1IDIuOTY4NzUgWiBNIDE1LjYyNSA0Ljk2ODc1QzE2LjA3ODEyNSA0Ljk1MzEyNSAxNi41MjczNDQgNC45NjA5MzggMTYuOTY4NzUgNUMyMy4xNjQwNjMgNS41NjY0MDYgMjcuODc1IDExLjIxNDg0NCAyNi45MDYyNSAxNy43NUMyNi4xNzU3ODEgMjIuMjI2NTYzIDIyLjU4NTkzOCAyNS45OTIxODggMTguMTI1IDI2LjgxMjVMMTguMDkzNzUgMjYuODEyNUMxNi44MTY0MDYgMjcuMDg1OTM4IDE1LjYzNjcxOSAyNy4wODk4NDQgMTQuNDM3NSAyNi45MDYyNUMxMy42MTcxODggMjYuODA0Njg4IDEzLjIzODI4MSAyNS44ODY3MTkgMTMuOTA2MjUgMjUuMjE4NzVDMTUuODc1IDIzLjI1IDE1Ljg3NSAyMC4wNjI1IDEzLjkwNjI1IDE4LjA5Mzc1QzExLjkzNzUgMTYuMTI1IDguNzUgMTYuMTI1IDYuNzgxMjUgMTguMDkzNzVDNi4xMTMyODEgMTguNzYxNzE5IDUuMTk1MzEzIDE4LjM4MjgxMyA1LjA5Mzc1IDE3LjU2MjVDNC45MTAxNTYgMTYuMzYzMjgxIDQuOTE0MDYzIDE1LjE4MzU5NCA1LjE4NzUgMTMuOTA2MjVDNi4xMDU0NjkgOS40MTc5NjkgOS43NzM0MzggNS44MjQyMTkgMTQuMjUgNS4wOTM3NUMxNC43MTg3NSA1LjAyMzQzOCAxNS4xNzE4NzUgNC45ODQzNzUgMTUuNjI1IDQuOTY4NzUgWiBNIDE0IDdDMTIuODk0NTMxIDcgMTIgNy44OTQ1MzEgMTIgOUMxMiAxMC4xMDU0NjkgMTIuODk0NTMxIDExIDE0IDExQzE1LjEwNTQ2OSAxMSAxNiAxMC4xMDU0NjkgMTYgOUMxNiA3Ljg5NDUzMSAxNS4xMDU0NjkgNyAxNCA3IFogTSAyMSA5QzE5Ljg5NDUzMSA5IDE5IDkuODk0NTMxIDE5IDExQzE5IDEyLjEwNTQ2OSAxOS44OTQ1MzEgMTMgMjEgMTNDMjIuMTA1NDY5IDEzIDIzIDEyLjEwNTQ2OSAyMyAxMUMyMyA5Ljg5NDUzMSAyMi4xMDU0NjkgOSAyMSA5IFogTSA5IDExQzcuODk0NTMxIDExIDcgMTEuODk0NTMxIDcgMTNDNyAxNC4xMDU0NjkgNy44OTQ1MzEgMTUgOSAxNUMxMC4xMDU0NjkgMTUgMTEgMTQuMTA1NDY5IDExIDEzQzExIDExLjg5NDUzMSAxMC4xMDU0NjkgMTEgOSAxMSBaIE0gMjMgMTZDMjEuODk0NTMxIDE2IDIxIDE2Ljg5NDUzMSAyMSAxOEMyMSAxOS4xMDU0NjkgMjEuODk0NTMxIDIwIDIzIDIwQzI0LjEwNTQ2OSAyMCAyNSAxOS4xMDU0NjkgMjUgMThDMjUgMTYuODk0NTMxIDI0LjEwNTQ2OSAxNiAyMyAxNiBaIE0gMTkgMjFDMTcuODk0NTMxIDIxIDE3IDIxLjg5NDUzMSAxNyAyM0MxNyAyNC4xMDU0NjkgMTcuODk0NTMxIDI1IDE5IDI1QzIwLjEwNTQ2OSAyNSAyMSAyNC4xMDU0NjkgMjEgMjNDMjEgMjEuODk0NTMxIDIwLjEwNTQ2OSAyMSAxOSAyMVoiIC8+DQo8L3N2Zz4=);",
                                        contextmenu: false,
                                        onclick: function (event) {
                                            switch (event.button) {
                                                case 0:
                                                    if (event.target.getAttribute("open") === "true") {
                                                        closeMenus(event.target.querySelector("menupopup"));
                                                    } else {
                                                        event.target.setAttribute("open", "true");
                                                        let pos = "after_end", x, y;
                                                        if ((event.target.ownerGlobal.innerWidth / 2) > event.pageX) {
                                                            pos = "after_position";
                                                            x = 0;
                                                            y = 0 + event.target.clientHeight;
                                                        }
                                                        event.target.querySelector("menupopup").openPopup(event.target, pos, x, y);
                                                    }
                                                    break;
                                                case 1:
                                                    window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTargetWithNotice });
                                                    break;
                                            }

                                        }
                                    });

                                },
                            });
                        }
                    }
                }

                if (!this.debug) return;
                if (CustomizableUI.getWidget('CopyCat-ReloadTheme') && CustomizableUI.getWidget('CopyCat-ReloadTheme').forWindow(window)?.node) return;
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
                            style: 'list-style-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTcuOTggMGE3Ljk3IDcuOTcgMCAwIDAtMy4zNjUuNzUyIDguMDA4IDguMDA4IDAgMCAwLTQuMjI3IDkuNzE1IDguMDA2IDguMDA2IDAgMCAwIDkuMTIgNS4zODkgOC4wMDUgOC4wMDUgMCAwIDAgNi40NzQtOC4zODUuNS41IDAgMCAwLS41MzEtLjQ2Ny41LjUgMCAwIDAtLjQ2Ny41MzMgNi45OTQgNi45OTQgMCAwIDEtNS42NjQgNy4zMzggNi45OTQgNi45OTQgMCAwIDEtNy45OC00LjcxNyA2Ljk5MyA2Ljk5MyAwIDAgMSAzLjY5Ni04LjVBNi45OTYgNi45OTYgMCAwIDEgMTMuNzQ1IDRoLTMuMjQ2YS41LjUgMCAwIDAtLjUuNS41LjUgMCAwIDAgLjUuNWg0YS41LjUgMCAwIDAgLjUtLjV2LTRhLjUuNSAwIDAgMC0uNS0uNS41LjUgMCAwIDAtLjUuNXYyLjIxNUE4LjAxNCA4LjAxNCAwIDAgMCA3Ljk3OSAweiIvPg0KPC9zdmc+DQo=)'
                        })
                    }
                });
            },
            handleEvent: function (event) {
                switch (event.type) {
                    case "CopyCatThemeLoaded":
                        this.refreshGlobalStyle(event.target.document, this.gPrefs("theme", "") !== "");
                        break;
                    case "CopyCatThemeUnloaded":
                        this.refreshGlobalStyle(event.target.document, false);
                        break;
                    case "popupshowing":
                        MENUS.forEach(obj => {
                            let type = obj.type;
                            if (!type || ["radio", "checkbox"].includes(type)) type = "menuitem";
                            if (!obj.label && !obj.content) type = "menuseparator";
                            let item = $C(event.target.ownerDocument, type, obj);
                            if (type === "menuitem")
                                item.classList.add('menuitem-iconic');
                            event.target.appendChild(item);
                        });
                        break;
                    case "ViewShowing":
                        MENUS.forEach(obj => {
                            let type = obj.type;
                            if (!type || ["radio", "checkbox"].includes(type)) type = "toolbarbutton";
                            if (!obj.label && !obj.content) type = "toolbarseparator";
                            let item = $C(event.target.ownerDocument, type, obj);
                            item.classList.add("subviewbutton")
                            event.target.querySelector(':scope>vbox').appendChild(item);
                        });
                        break;
                }
            },
            _onclick: function (event) {
                let { target: item } = event;
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
                        if (item.getAttribute("notice") == "true") {
                            this.alert($L("reload theme success"))
                        }
                        break;
                    case 'OpenThemesOptions':
                        openUILinkIn("chrome://userchrome/content/utils/ThemeOptions.html", "tab", {
                            postData: null,
                            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                        });
                        break;
                    default:
                        this.log(item.getAttribute('action'));
                }
            },
            handleRelativePath: function (path) {
                if (path) {
                    path = path.replace(/\//g, '\\');
                    var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
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
            globalStyleListener: {
                onCustomizeEnd() {
                    window.CopyCatTheme.loadTheme();
                }
            },
            globalStyleObserver: function () {
                window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTarget });
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
                    let css = ':root{\n' + cssArr.join("\n") + "}\n";
                    window.CopyCatTheme.SYNCED_STYLE = {
                        url: Services.io.newURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)),
                        type: window.CopyCatTheme.sss.AUTHOR_SHEET,
                    }
                    window.CopyCatTheme.sss.loadAndRegisterSheet(window.CopyCatTheme.SYNCED_STYLE.url, window.CopyCatTheme.SYNCED_STYLE.type);
                }
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
                        themeConfig.options.forEach(obj => {
                            let name, type, pref, defaultValue;
                            if (typeof obj === "string") {
                                pref = obj;
                                type = "bool";
                                defaultValue = false;
                            } else if (typeof obj === "object" && obj.pref) {
                                pref = obj.pref;
                                type = obj.type || "string"
                                defaultValue = obj.defaultValue || "";
                            }
                            name = this.lang[pref] || pref;
                            switch (type) {
                                case "bool":
                                    this._options.push({
                                        name: name,
                                        pref: pref,
                                        get value() {
                                            return cPref.get(pref, defaultValue)
                                        },
                                        toggle: function (value) {
                                            cPref.set(key, !!this.value);
                                        }
                                    });
                                    break;
                                case "string":
                                    this._options.push({
                                        name: name,
                                        pref: pref,
                                        get value() {
                                            return cPref.get(pref, defaultValue)
                                        },
                                        set value(value) {
                                            cPref.set(key, value);
                                        }
                                    });
                                    break;
                                case "select":
                                    this._options.push({
                                        name: name,
                                        pref: pref,
                                        options: obj.options,
                                        get value() {
                                            return cPref.get(pref, defaultValue)
                                        },
                                        set value(value) {
                                            cPref.set(key, value);
                                        }
                                    });
                                    break;
                            }

                        })
                    }
                    if (themeConfig.monitors) {
                        themeConfig.monitors.forEach(item => {
                            if (item.pref) {
                                this.PrefObservers[item.pref] = {
                                    target: window.document.querySelector(item.target) || window.document.querySelector("#main-window"),
                                    targetAttr: item.targetAttr || item.pref
                                }
                                if (item.defaultValue) {
                                    this.PrefObservers[item.pref].defaultValue = item.defaultValue;
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
                    if (this.PrefObservers[pref].target) this.PrefObservers[pref].target.setAttribute(this.PrefObservers[pref].targetAttr, cPref.get(pref, this.PrefObservers[pref].defaultValue));
                    if (this.PrefObservers[pref].target && !this.PrefObservers[pref].listener) {
                        const { target, targetAttr, defaultValue } = this.PrefObservers[pref];
                        this.PrefObservers[pref].listener = cPref.addListener(pref, (value) => {
                            target.setAttribute(targetAttr, value || defaultValue);
                        });
                    }
                }
                this.MutationObservers.forEach(config => {
                    let { from, attr, target, targetAttr } = config;
                    target.setAttribute(targetAttr, from.getAttribute(attr));
                    config.observer.observe(from, { attributes: true });
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
                    // 扫描 CSS 文件中的 PREF
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

        window.CopyCatTheme.init(window);

        if (gBrowserInit.delayedStartupFinished) window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTarget })
        else {
            let delayedListener = (subject, topic) => {
                if (topic == "browser-delayed-startup-finished" && subject == window) {
                    Services.obs.removeObserver(delayedListener, topic);
                    window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTarget });
                }
            };
            Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
        }
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
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
            el = doc.createElement(tag.substr(5));
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
                this.error(e);
            }
        }
        return false;
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
})(``);
