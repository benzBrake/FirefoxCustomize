// ==UserScript==
// @name            CopyCatTheme.uc.js
// @description     CopyCat 主题专用加载脚本
// @version         0.1.6
// @license         MIT License
// @shutdown        window.CopyCatTheme.destroy(win);
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://userchrome/content/utils/ThemeOptions.html
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    if (!globalThis.fetch) Cu.importGlobalProperties(["fetch"]);
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const showInAppMenu = Services.prefs.getBoolPref('userChromeJS.CopyCat.buildPanel', false);
    const showMenuIcon = parseInt(Services.appinfo.version) < 90;


    const LANG = {
        "zh-CN": {
            "copycat themes management": "CopyCat 主题管理",
            "copycat themes management tooltip": "CopyCat 主题管理\n左键：菜单\n中建：重载",
            "theme settings": "主题设置",
            "reload themes": "重新加载主题",
            "open themes directory": "打开主题目录",
            "theme options": "主题选项",
            "file not found": "文件不存在：%s",
            "param is invalid": "函数 [%s], 调用参数[%s]有误",
            "reload theme success": "主题重载完成",
            "Operation failed, please try again later": "操作失败，请稍后重试"
        },
        "en-US": {
            "copycat themes management": "CopyCat Themes Management",
            "copycat themes management tooltip": "CopyCat Themes Management\nLeft click: menu\nMiddle click: reload",
            "theme settings": "Theme Settings",
            "reload themes": "Reload Themes",
            "open themes directory": "Open Themes Directory",
            "theme options": "Theme Options",
            "file not found": "File not found: %s",
            "param is invalid": "Function [%s], parameter [%s] is invalid",
            "reload theme success": "Reload theme success",
            "Operation failed, please try again later": "Operation failed, please try again later"
        }
    }

    const MENUS = [{
        action: 'ReloadAllThemes',
        label: formatStr("reload themes"),
        oncommand: 'window.CopyCatTheme._onclick(event)',
        style: (!showInAppMenu || showMenuIcon) ? 'list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);' : '',
        notice: true
    }, {
        label: formatStr("open themes directory"),
        action: "OpenThemesDirectory",
        style: (!showInAppMenu || showMenuIcon) ? 'list-style-image: url(chrome://global/skin/icons/folder.svg)' : '',
        oncommand: 'window.CopyCatTheme._onclick(event)'
    }, {}, {
        label: formatStr("theme options"),
        style: (!showInAppMenu || showMenuIcon) ? 'list-style-image: url("chrome://global/skin/icons/settings.svg");' : '',
        action: "OpenThemesOptions",
        oncommand: 'window.CopyCatTheme._onclick(event)'
    }];

    const TopWindow = Services.wm.getMostRecentWindow("navigator:browser");
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    const FF_VERSION = Services.appinfo.version.split('.')[0];
    const AUTHOR_SHEET = FF_VERSION >= 119 ? sss.USER_SHEET : sss.AUTHOR_SHEET;
    const { USER_SHEET, AGENT_SHEET } = sss;


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
                type: USER_SHEET,
            }
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
        get sss() {
            delete this.sss;
            return this.sss = sss;
        },
        get reloadTarget() {
            delete this.reloadTarget;
            return this.reloadTarget = createEl(document, "menuitem", {
                action: "ReloadAllThemes",
            })
        },
        get reloadTargetWithNotice() {
            delete this.reloadTargetWithNotice;
            return this.reloadTargetWithNotice = createEl(document, "menuitem", {
                action: "ReloadAllThemes",
                notice: "true"
            })
        },
        init: async function () {
            this.STYLE = css;
            const { CustomizableUI } = window;
            window.addEventListener('CopyCatThemeUnloaded', this);
            window.addEventListener('CopyCatThemeLoaded', this);
            if (showInAppMenu) {
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
                        applyAttrs(view.querySelector('.subviewbutton-back'), {
                            oncommand: function () {
                                var mView = this.closest('panelmultiview');
                                if (mView) mView.goBack();
                            }
                        });
                    }
                    view.addEventListener('ViewShowing', this, { once: true });
                    let themeMenu = createEl(document, 'toolbarbutton', {
                        id: 'CopyCatTheme-Menu',
                        class: 'subviewbutton subviewbutton-nav',
                        type: 'view',
                        view: "CopyCat-ThemeMenu-View",
                        closemenu: "none",
                        label: formatStr("theme settings"),
                        oncommand: "PanelUI.showSubView('CopyCat-ThemeMenu-View', this)"
                    });
                    let mainView = getViewCache(document).querySelector('#appMenu-protonMainView'),
                        ins = mainView.querySelector('#appMenu-more-button2');
                    ins.before(themeMenu);
                }
            } else {
                if (this.showInToolsMenu) {
                    let ins = $("devToolsSeparator", document);
                    if (ins) {
                        let menu = createEl(document, "menu", {
                            id: "CopyCatTheme-Menu",
                            label: formatStr("theme settings"),
                            class: showMenuIcon ? "menu-iconic" : "",
                            style: showMenuIcon ? "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPg0KICA8cGF0aCBkPSJNMTUuNTkzNzUgMi45Njg3NUMxNS4wNjI1IDIuOTg0Mzc1IDE0LjUxNTYyNSAzLjA0Mjk2OSAxMy45Njg3NSAzLjEyNUwxMy45Mzc1IDMuMTI1QzguNjEzMjgxIDMuOTk2MDk0IDQuMzAwNzgxIDguMTkxNDA2IDMuMjE4NzUgMTMuNUMyLjg5NDUzMSAxNS4wMTE3MTkgMi45MTQwNjMgMTYuNDIxODc1IDMuMTI1IDE3LjgxMjVDMy4xMzI4MTMgMTcuODE2NDA2IDMuMTI1IDE3LjgzNTkzOCAzLjEyNSAxNy44NDM3NUMzLjQ1MzEyNSAyMC4xOTE0MDYgNi41IDIxLjIxODc1IDguMjE4NzUgMTkuNUM5LjQ0OTIxOSAxOC4yNjk1MzEgMTEuMjY5NTMxIDE4LjI2OTUzMSAxMi41IDE5LjVDMTMuNzMwNDY5IDIwLjczMDQ2OSAxMy43MzA0NjkgMjIuNTUwNzgxIDEyLjUgMjMuNzgxMjVDMTAuNzgxMjUgMjUuNSAxMS44MDg1OTQgMjguNTQ2ODc1IDE0LjE1NjI1IDI4Ljg3NUMxNC4xNjQwNjMgMjguODc1IDE0LjE4MzU5NCAyOC44NjcxODggMTQuMTg3NSAyOC44NzVDMTUuNTY2NDA2IDI5LjA4NTkzOCAxNi45Njg3NSAyOS4wOTc2NTYgMTguNDY4NzUgMjguNzgxMjVDMTguNDgwNDY5IDI4Ljc4MTI1IDE4LjQ4ODI4MSAyOC43ODEyNSAxOC41IDI4Ljc4MTI1QzIzLjgyNDIxOSAyNy43ODkwNjMgMjguMDA3ODEzIDIzLjM3NSAyOC44NzUgMTguMDYyNUwyOC44NzUgMTguMDMxMjVDMzAuMDA3ODEzIDEwLjM5MDYyNSAyNC40MjE4NzUgMy43MTg3NSAxNy4xNTYyNSAzLjAzMTI1QzE2LjYzNjcxOSAyLjk4MDQ2OSAxNi4xMjUgMi45NTMxMjUgMTUuNTkzNzUgMi45Njg3NSBaIE0gMTUuNjI1IDQuOTY4NzVDMTYuMDc4MTI1IDQuOTUzMTI1IDE2LjUyNzM0NCA0Ljk2MDkzOCAxNi45Njg3NSA1QzIzLjE2NDA2MyA1LjU2NjQwNiAyNy44NzUgMTEuMjE0ODQ0IDI2LjkwNjI1IDE3Ljc1QzI2LjE3NTc4MSAyMi4yMjY1NjMgMjIuNTg1OTM4IDI1Ljk5MjE4OCAxOC4xMjUgMjYuODEyNUwxOC4wOTM3NSAyNi44MTI1QzE2LjgxNjQwNiAyNy4wODU5MzggMTUuNjM2NzE5IDI3LjA4OTg0NCAxNC40Mzc1IDI2LjkwNjI1QzEzLjYxNzE4OCAyNi44MDQ2ODggMTMuMjM4MjgxIDI1Ljg4NjcxOSAxMy45MDYyNSAyNS4yMTg3NUMxNS44NzUgMjMuMjUgMTUuODc1IDIwLjA2MjUgMTMuOTA2MjUgMTguMDkzNzVDMTEuOTM3NSAxNi4xMjUgOC43NSAxNi4xMjUgNi43ODEyNSAxOC4wOTM3NUM2LjExMzI4MSAxOC43NjE3MTkgNS4xOTUzMTMgMTguMzgyODEzIDUuMDkzNzUgMTcuNTYyNUM0LjkxMDE1NiAxNi4zNjMyODEgNC45MTQwNjMgMTUuMTgzNTk0IDUuMTg3NSAxMy45MDYyNUM2LjEwNTQ2OSA5LjQxNzk2OSA5Ljc3MzQzOCA1LjgyNDIxOSAxNC4yNSA1LjA5Mzc1QzE0LjcxODc1IDUuMDIzNDM4IDE1LjE3MTg3NSA0Ljk4NDM3NSAxNS42MjUgNC45Njg3NSBaIE0gMTQgN0MxMi44OTQ1MzEgNyAxMiA3Ljg5NDUzMSAxMiA5QzEyIDEwLjEwNTQ2OSAxMi44OTQ1MzEgMTEgMTQgMTFDMTUuMTA1NDY5IDExIDE2IDEwLjEwNTQ2OSAxNiA5QzE2IDcuODk0NTMxIDE1LjEwNTQ2OSA3IDE0IDcgWiBNIDIxIDlDMTkuODk0NTMxIDkgMTkgOS44OTQ1MzEgMTkgMTFDMTkgMTIuMTA1NDY5IDE5Ljg5NDUzMSAxMyAyMSAxM0MyMi4xMDU0NjkgMTMgMjMgMTIuMTA1NDY5IDIzIDExQzIzIDkuODk0NTMxIDIyLjEwNTQ2OSA5IDIxIDkgWiBNIDkgMTFDNy44OTQ1MzEgMTEgNyAxMS44OTQ1MzEgNyAxM0M3IDE0LjEwNTQ2OSA3Ljg5NDUzMSAxNSA5IDE1QzEwLjEwNTQ2OSAxNSAxMSAxNC4xMDU0NjkgMTEgMTNDMTEgMTEuODk0NTMxIDEwLjEwNTQ2OSAxMSA5IDExIFogTSAyMyAxNkMyMS44OTQ1MzEgMTYgMjEgMTYuODk0NTMxIDIxIDE4QzIxIDE5LjEwNTQ2OSAyMS44OTQ1MzEgMjAgMjMgMjBDMjQuMTA1NDY5IDIwIDI1IDE5LjEwNTQ2OSAyNSAxOEMyNSAxNi44OTQ1MzEgMjQuMTA1NDY5IDE2IDIzIDE2IFogTSAxOSAyMUMxNy44OTQ1MzEgMjEgMTcgMjEuODk0NTMxIDE3IDIzQzE3IDI0LjEwNTQ2OSAxNy44OTQ1MzEgMjUgMTkgMjVDMjAuMTA1NDY5IDI1IDIxIDI0LjEwNTQ2OSAyMSAyM0MyMSAyMS44OTQ1MzEgMjAuMTA1NDY5IDIxIDE5IDIxWiIvPg0KPC9zdmc+);" : ""
                        });
                        let menupopup = menu.appendChild(createEl(document, "menupopup", {
                            id: 'CopyCatTheme-Popup',
                        }));
                        menupopup.addEventListener("popupshowing", CopyCatTheme.handleEvent, { once: true });
                        ins.parentNode.insertBefore(menu, ins);
                    }
                } else {
                    if (!(CustomizableUI.getWidget('CopyCatTheme-Btn') && CustomizableUI.getWidget('CopyCatTheme-Btn').forWindow(window)?.node)) {
                        CustomizableUI.createWidget({
                            id: 'CopyCatTheme-Btn',
                            removable: true,
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onCreated: node => {
                                let menupopup = node.appendChild(createEl(node.ownerDocument, "menupopup", {
                                    id: 'CopyCatTheme-Popup',
                                    onpopuphidden: (event) => {
                                        event.target.closest("toolbarbutton").removeAttribute("open");
                                    }
                                }));
                                menupopup.addEventListener("popupshowing", CopyCatTheme.handleEvent, { once: true });
                                applyAttrs(node, {
                                    label: formatStr("copycat themes management"),
                                    tooltiptext: formatStr("copycat themes management tooltip"),
                                    style: "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPg0KICA8cGF0aCBkPSJNMTUuNTkzNzUgMi45Njg3NUMxNS4wNjI1IDIuOTg0Mzc1IDE0LjUxNTYyNSAzLjA0Mjk2OSAxMy45Njg3NSAzLjEyNUwxMy45Mzc1IDMuMTI1QzguNjEzMjgxIDMuOTk2MDk0IDQuMzAwNzgxIDguMTkxNDA2IDMuMjE4NzUgMTMuNUMyLjg5NDUzMSAxNS4wMTE3MTkgMi45MTQwNjMgMTYuNDIxODc1IDMuMTI1IDE3LjgxMjVDMy4xMzI4MTMgMTcuODE2NDA2IDMuMTI1IDE3LjgzNTkzOCAzLjEyNSAxNy44NDM3NUMzLjQ1MzEyNSAyMC4xOTE0MDYgNi41IDIxLjIxODc1IDguMjE4NzUgMTkuNUM5LjQ0OTIxOSAxOC4yNjk1MzEgMTEuMjY5NTMxIDE4LjI2OTUzMSAxMi41IDE5LjVDMTMuNzMwNDY5IDIwLjczMDQ2OSAxMy43MzA0NjkgMjIuNTUwNzgxIDEyLjUgMjMuNzgxMjVDMTAuNzgxMjUgMjUuNSAxMS44MDg1OTQgMjguNTQ2ODc1IDE0LjE1NjI1IDI4Ljg3NUMxNC4xNjQwNjMgMjguODc1IDE0LjE4MzU5NCAyOC44NjcxODggMTQuMTg3NSAyOC44NzVDMTUuNTY2NDA2IDI5LjA4NTkzOCAxNi45Njg3NSAyOS4wOTc2NTYgMTguNDY4NzUgMjguNzgxMjVDMTguNDgwNDY5IDI4Ljc4MTI1IDE4LjQ4ODI4MSAyOC43ODEyNSAxOC41IDI4Ljc4MTI1QzIzLjgyNDIxOSAyNy43ODkwNjMgMjguMDA3ODEzIDIzLjM3NSAyOC44NzUgMTguMDYyNUwyOC44NzUgMTguMDMxMjVDMzAuMDA3ODEzIDEwLjM5MDYyNSAyNC40MjE4NzUgMy43MTg3NSAxNy4xNTYyNSAzLjAzMTI1QzE2LjYzNjcxOSAyLjk4MDQ2OSAxNi4xMjUgMi45NTMxMjUgMTUuNTkzNzUgMi45Njg3NSBaIE0gMTUuNjI1IDQuOTY4NzVDMTYuMDc4MTI1IDQuOTUzMTI1IDE2LjUyNzM0NCA0Ljk2MDkzOCAxNi45Njg3NSA1QzIzLjE2NDA2MyA1LjU2NjQwNiAyNy44NzUgMTEuMjE0ODQ0IDI2LjkwNjI1IDE3Ljc1QzI2LjE3NTc4MSAyMi4yMjY1NjMgMjIuNTg1OTM4IDI1Ljk5MjE4OCAxOC4xMjUgMjYuODEyNUwxOC4wOTM3NSAyNi44MTI1QzE2LjgxNjQwNiAyNy4wODU5MzggMTUuNjM2NzE5IDI3LjA4OTg0NCAxNC40Mzc1IDI2LjkwNjI1QzEzLjYxNzE4OCAyNi44MDQ2ODggMTMuMjM4MjgxIDI1Ljg4NjcxOSAxMy45MDYyNSAyNS4yMTg3NUMxNS44NzUgMjMuMjUgMTUuODc1IDIwLjA2MjUgMTMuOTA2MjUgMTguMDkzNzVDMTEuOTM3NSAxNi4xMjUgOC43NSAxNi4xMjUgNi43ODEyNSAxOC4wOTM3NUM2LjExMzI4MSAxOC43NjE3MTkgNS4xOTUzMTMgMTguMzgyODEzIDUuMDkzNzUgMTcuNTYyNUM0LjkxMDE1NiAxNi4zNjMyODEgNC45MTQwNjMgMTUuMTgzNTk0IDUuMTg3NSAxMy45MDYyNUM2LjEwNTQ2OSA5LjQxNzk2OSA5Ljc3MzQzOCA1LjgyNDIxOSAxNC4yNSA1LjA5Mzc1QzE0LjcxODc1IDUuMDIzNDM4IDE1LjE3MTg3NSA0Ljk4NDM3NSAxNS42MjUgNC45Njg3NSBaIE0gMTQgN0MxMi44OTQ1MzEgNyAxMiA3Ljg5NDUzMSAxMiA5QzEyIDEwLjEwNTQ2OSAxMi44OTQ1MzEgMTEgMTQgMTFDMTUuMTA1NDY5IDExIDE2IDEwLjEwNTQ2OSAxNiA5QzE2IDcuODk0NTMxIDE1LjEwNTQ2OSA3IDE0IDcgWiBNIDIxIDlDMTkuODk0NTMxIDkgMTkgOS44OTQ1MzEgMTkgMTFDMTkgMTIuMTA1NDY5IDE5Ljg5NDUzMSAxMyAyMSAxM0MyMi4xMDU0NjkgMTMgMjMgMTIuMTA1NDY5IDIzIDExQzIzIDkuODk0NTMxIDIyLjEwNTQ2OSA5IDIxIDkgWiBNIDkgMTFDNy44OTQ1MzEgMTEgNyAxMS44OTQ1MzEgNyAxM0M3IDE0LjEwNTQ2OSA3Ljg5NDUzMSAxNSA5IDE1QzEwLjEwNTQ2OSAxNSAxMSAxNC4xMDU0NjkgMTEgMTNDMTEgMTEuODk0NTMxIDEwLjEwNTQ2OSAxMSA5IDExIFogTSAyMyAxNkMyMS44OTQ1MzEgMTYgMjEgMTYuODk0NTMxIDIxIDE4QzIxIDE5LjEwNTQ2OSAyMS44OTQ1MzEgMjAgMjMgMjBDMjQuMTA1NDY5IDIwIDI1IDE5LjEwNTQ2OSAyNSAxOEMyNSAxNi44OTQ1MzEgMjQuMTA1NDY5IDE2IDIzIDE2IFogTSAxOSAyMUMxNy44OTQ1MzEgMjEgMTcgMjEuODk0NTMxIDE3IDIzQzE3IDI0LjEwNTQ2OSAxNy44OTQ1MzEgMjUgMTkgMjVDMjAuMTA1NDY5IDI1IDIxIDI0LjEwNTQ2OSAyMSAyM0MyMSAyMS44OTQ1MzEgMjAuMTA1NDY5IDIxIDE5IDIxWiIvPg0KPC9zdmc+);",
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
            if (!CustomizableUI || CustomizableUI.getWidget('CopyCat-ReloadTheme') && CustomizableUI.getWidget('CopyCat-ReloadTheme').forWindow(window)?.node) return;
            CustomizableUI.createWidget({
                id: 'CopyCat-ReloadTheme',
                label: formatStr("reload themes"),
                tooltiptext: formatStr("reload themes"),
                removable: true,
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                onCreated: node => {
                    applyAttrs(node, {
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
                    break;
                case "CopyCatThemeUnloaded":
                    break;
                case "popupshowing":
                    MENUS.forEach(obj => {
                        let type = obj.type;
                        if (!type || ["radio", "checkbox"].includes(type)) type = "menuitem";
                        if (!obj.label && !obj.content) type = "menuseparator";
                        let item = createEl(event.target.ownerDocument, type, obj);
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
                        let item = createEl(event.target.ownerDocument, type, obj);
                        item.classList.add("subviewbutton")
                        event.target.querySelector(':scope>vbox').appendChild(item);
                    });
                    break;
            }
        },
        _onclick: async function (event) {
            let { target: item } = event;
            switch (item.getAttribute('action')) {
                case undefined:
                    this.error("Operation not allowed!")
                    break;
                case 'OpenThemesDirectory':
                    this.log("Open themes directory :", this.THEME_PATH);
                    this.exec(this.THEME_PATH);
                    break;
                case 'ReloadAllThemes':
                    this.log("Reload all themes");
                    this.loadThemes(event.target.ownerDocument);
                    await this.loadTheme(event.target.ownerDocument);
                    if (item.getAttribute("notice") == "true") {
                        this.alert(formatStr("reload theme success"))
                    }
                    break;
                case 'OpenThemesOptions':
                    this.log("Open themes options page: chrome://userchrome/content/utils/ThemeOptions.html");
                    openTrustedLinkIn("chrome://userchrome/content/utils/ThemeOptions.html", "tab", {
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
        loadTheme: async function () {
            if (this.theme) {
                // 卸载主题
                await this.theme.unregister();
                delete this.theme;
                window.dispatchEvent(new CustomEvent("CopyCatThemeUnloaded"));
            }
            let name = cPref.get("userChromeJS.CopyCat.theme", false, "");
            if (name && this.themes[name]) {
                this.theme = this.themes[name]
                await this.theme.register();
                window.dispatchEvent(new CustomEvent("CopyCatThemeLoaded"));
            }
        },
        exec: function (pathOrFile, arg) {
            let aFile = this.getFile(pathOrFile);
            if (!aFile) {
                this.error(formatStr("param is invalid", "CopyCatTheme.exec", "pathOrFile"));
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
                    this.error(formatStr("file not found", aFile.path));
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
                this.error(formatStr("param is invalid", "CopyCatTheme.getFile", "pathOrFile", pathOrFile));
            }
            return aFile;
        },
        getURLSpecFromFile: function (aFile) {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return fph.getURLSpecFromFile ? fph.getURLSpecFromFile(aFile) : fph.getURLSpecFromActualFile(aFile);
        },
        destroy: function (win) {
            const { document, CustomizableUI } = win;
            win.removeEventListener('CopyCatThemeLoaded', this);
            win.removeEventListener('CopyCatThemeUnloaded', this);
            try {
                CustomizableUI.destroyWidget("CopyCat-ReloadTheme");
            } catch (e) { }
            let view = $('CopyCat-ThemeMenu-View', document)
            if (view) {
                view.closest('panelmultiview').goBack();
                removeEl(view);
            } else {
                removeEl(getViewCache(document).querySelector("#CopyCat-ThemeMenu-View"));
            }
            let button = $('CopyCat-ThemeMenu', document);
            if (button) {
                removeEl(button);
            } else {
                removeEl(getViewCache(document).querySelector("#CopyCat-ThemeMenu"));
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
        error(...args) {
            if (this.debug)
                TopWindow.console.error("[CopyCatTheme]", ...args);
        },
        log(...args) {
            if (this.debug)
                TopWindow.console.log("[CopyCatTheme]", ...args);
        }
    }

    class UserStyle {
        constructor(aFile) {
            this.isOperating = false;
            this.file = aFile;
            this.isTheme = false;
            this.styles = [];
            this.PrefObservers = {};
            this.MutationObservers = [];
            this.IntervalObservers = [];
            this.id = aFile.leafName.replace(/\.css$/, '');
            this.filename = '';
            this.lang = {};
            this.processFile(aFile);
            this.globalVariables = null;
            this.addonEventListener = {
                onEnabled: (addon) => this.handleAddon(addon)
            }
        }

        processFile(aFile) {
            if (aFile.isDirectory()) {
                this.processDirectory(aFile);
            } else if (aFile.leafName.endsWith('.css')) {
                this.processCSSFile(aFile);
            }
        }

        processDirectory(aFile) {
            let themeConfig;
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
            }, {
                filename: "userContent.css"
            }];

            if (themeConfigFile.exists()) {
                themeConfig = JSON.parse(readFile(themeConfigFile, false));
                fileList = themeConfig.files;
                this._options = [];
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

                    if (file.filename === "userContent.css") {
                        this.styles.push({
                            url: Services.io.newURI(window.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName + '/' + tFile.leafName),
                            type: USER_SHEET,
                            file: tFile
                        });
                    } else {
                        this.styles.push({
                            url: Services.io.newURI(window.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName + '/' + tFile.leafName),
                            type: file.hasOwnProperty("type") ? file.type : getStyleType(tFile.leafName),
                            file: tFile
                        });
                    }
                }
            });

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
                    this.processOptions(themeConfig.options);
                }

                if (themeConfig.monitors) {
                    this.processMonitors(themeConfig.monitors);
                }


                if ("options-page-style" in themeConfig) {
                    this.optionsPageStyle = themeConfig["options-page-style"];
                }
            }

            if ((this.name || "").length === 0) {
                this.name = this.id;
            }

            this.isEnabled = false;
        }

        processOptions(options) {
            options.forEach(obj => {
                let name, type, pref, defaultValue, group;
                if (typeof obj === "string") {
                    pref = obj;
                    type = "bool";
                    defaultValue = false;
                } else if (typeof obj === "object" && obj.pref) {
                    pref = obj.pref;
                    type = obj.type || "bool"
                    defaultValue = obj.defaultValue || "";
                }

                group = obj.group || "general";

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
                            },
                            group: group
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
                            },
                            group: group
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
                            },
                            group: group
                        });
                        break;
                }
            });
        }

        processMonitors(monitors) {
            if (typeof CopyCatTheme === "undefined") {
                CopyCatTheme = TopWindow.CopyCatTheme;
            }
            monitors.forEach(item => {
                if ("isAvailable" in item && !evil(item.isAvailable)) {
                    return;
                }

                let target = document.querySelector(item.target) || document.documentElement;

                if (item.pref) {
                    // 同步 pref 参数
                    this.PrefObservers[item.pref] = {
                        target: target,
                        targetAttr: item.targetAttr || item.pref
                    };

                    if (item.defaultValue) {
                        this.PrefObservers[item.pref].defaultValue = item.defaultValue;
                    }
                } else if ("eval" in item) {
                    let processFn = null;
                    if ("targetAttr" in item) {
                        processFn = function (val) {
                            target.setAttribute(item.targetAttr, val);
                        }
                    } else if ("targetStyle" in item) {
                        processFn = function (val) {
                            target.style.setProperty(item.targetStyle, val);
                        }
                    }
                    let restoreFn = function () {
                        // do nothing 
                    };
                    if ("targetAttr" in item) {
                        if (target.hasAttribute(item.targetAttr)) {
                            let originalValue = target.getAttribute(item.targetAttr);
                            restoreFn = function () {
                                CopyCatTheme.log("Restoring " + item.targetAttr + " to " + originalValue);
                                target.setAttribute(item.targetAttr, originalValue);
                            }
                        } else {
                            restoreFn = function () {
                                CopyCatTheme.log("Removing attribute " + item.targetAttr + " from " + target.tagName + " " + target.id);
                                target.removeAttribute(item.targetAttr);
                            }
                        }
                    } else if ("targetStyle" in item) {
                        if (Object.values(target.style).includes(item.targetStyle)) {
                            let originalValue = target.style.getPropertyValue(item.targetStyle);
                            restoreFn = function () {
                                CopyCatTheme.log("Restoring " + item.targetStyle + " to " + originalValue, target);
                                target.style.setProperty(item.targetStyle, originalValue);
                            }
                        } else {
                            restoreFn = function () {
                                CopyCatTheme.log("Removing style: " + item.targetStyle, target);
                                target.style.removeProperty(item.targetStyle);
                            }
                        }
                    }
                    if (typeof processFn === "function") {
                        if ("interval" in item) {
                            this.IntervalObservers.push({
                                eval: item.eval,
                                lastVal: null,
                                start() {
                                    CopyCatTheme.log("Starging IntervalObserver:", item);
                                    processFn(evil(item.eval));
                                    this.flag = setInterval(() => {
                                        let newVal = evil(item.eval);
                                        if (newVal !== this.lastVal) {
                                            this.lastVal = newVal;
                                            processFn(newVal);
                                        }
                                    }, this.interval);
                                },
                                stop() {
                                    CopyCatTheme.log("Stopping IntervalObserver:", item);
                                    clearInterval(this.flag);
                                    restoreFn();
                                }
                            });
                        } else {
                            this.IntervalObservers.push({
                                eval: item.eval,
                                start() {
                                    CopyCatTheme.log("Starting Job:", item);
                                    this.flag = setTimeout(() => {
                                        let val = evil(item.eval);
                                        processFn(val);
                                        delete this.flag;
                                    }, item.timeOut || 50);
                                },
                                stop() {
                                    CopyCatTheme.log("Stopping Job:", item);
                                    clearTimeout(this.flag);
                                    restoreFn();
                                }
                            });
                        }
                    }
                } else if (item.from && item.attr) {
                    let from = window.document.querySelector(item.from),
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

                if ("start" in item || "stop" in item) {
                    let obj = {};
                    if (item.start) {
                        obj.start = function () {
                            CopyCatTheme.log("Starting job: ", item);
                            evil(item.start);
                        };
                    }
                    if (item.stop) {
                        obj.stop = function () {
                            CopyCatTheme.log("Stopping job: ", item);
                            evil(item.stop);
                        }
                    }
                    this.IntervalObservers.push(obj);
                }
            });
        }

        processCSSFile(aFile) {
            this.isTheme = true;
            TopWindow.CopyCatTheme.log("Processing CSS file: ", aFile);
            Object.entries(readStyleInfo(aFile)).forEach(([key, value]) => {
                this[key] = value;
            });
            let style = {
                url: Services.io.newURI(window.CopyCatTheme.THEME_URL_PREFIX + "/" + aFile.leafName),
                type: getStyleType(aFile.leafName),
                file: aFile
            };
            this.styles.push(style);
            TopWindow.CopyCatTheme.log("Added style: ", style);
        }

        async register() {
            const { CopyCatTheme } = TopWindow;
            if (this.isOperating) {
                CopyCatTheme.alert(formatStr("Operation failed, please try again later"))
                return;
            }
            this.isOperating = true;
            await this.collectCSSVariables();
            this.bindAddonEvent();
            CopyCatTheme.log("Registering theme: ", this);
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
            this.IntervalObservers.forEach(iob => {
                iob.start();
            });
            if (!this.isEnabled) {
                this.styles.forEach(style => {
                    if (TopWindow.CopyCatTheme.sss.sheetRegistered(style.url, style.type)) {
                        CopyCatTheme.log("Style[%s] already registered: %s".replace("%s", getStyleTypeName(style.type)).replace("%s", style.url.spec), style.url);
                    } else {
                        CopyCatTheme.log("Registering Style[%s] from: %s".replace("%s", getStyleTypeName(style.type)).replace("%s", style.url.spec), style.url);
                        CopyCatTheme.sss.loadAndRegisterSheet(style.url, style.type);
                    }
                });
            }
            this.isEnabled = true;
            this.isOperating = false;
        }

        async unregister() {
            const { CopyCatTheme } = TopWindow;
            if (this.isOperating) {
                CopyCatTheme.alert(formatStr("Operation failed, please try again later"))
                return;
            }
            this.isOperating = true;
            CopyCatTheme.log("Unregistering theme:", this);
            for (let pref in this.PrefObservers) {
                if (this.PrefObservers[pref].hasOwnProperty("listener")) {
                    try {
                        this.PrefObservers[pref].target.removeAttribute(this.PrefObservers[pref].targetAttr);
                        cPref.removeListener(pref, this.PrefObservers[pref].listener);
                        delete this.PrefObservers[pref].listener;
                    } catch (e) {

                    }
                }
            }
            this.IntervalObservers.forEach(iob => {
                iob.stop();
            });
            if (this.isEnabled) {
                this.MutationObservers.forEach(config => {
                    CopyCatTheme.log("unregistering mutation observer", config);
                    config.target.removeAttribute(config.targetAttr);
                    config.observer.disconnect();
                });
                this.styles.forEach(style => {
                    if (!CopyCatTheme.sss.sheetRegistered(style.url, style.type)) return;
                    CopyCatTheme.log("Registering Style[%s] from: %s".replace("%s", getStyleTypeName(style.type)).replace("%s", style.url.spec), style.url);
                    CopyCatTheme.sss.unregisterSheet(style.url, style.type)
                });
            }
            this.removeAddonEvent();
            await this.removeCSSVariables();
            this.isEnabled = false;
            this.isOperating = false;
        }

        async reload() {
            await this.unregister();
            await this.register();
        }

        async toggle() {
            if (this.isEnabled)
                await this.unregister();
            else
                await this.register();
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

        get isOperating() {
            return this._isOperating;
        }

        set isOperating(value) {
            this._isOperating = value;
        }

        async collectCSSVariables() {
            const { CopyCatTheme } = TopWindow;
            CopyCatTheme.log('Collecting CSS variables');
            let addons = (await AddonManager.getActiveAddons()).addons;
            addons = addons.filter(addon => addon.type == 'theme');
            if (addons.length == 0) {
                return;
            }
            let policy = WebExtensionPolicy.getByID(addons[0].id);
            let manifestUrl = policy.getURL('manifest.json');
            let manifestJSON = await fetch(manifestUrl).then(response => response.json(), () => {
                return {};
            });
            let CSSVariables = [];
            if ("theme" in manifestJSON && "colors" in manifestJSON.theme) {
                let colors = manifestJSON.theme.colors;
                for (let key in colors) {
                    let value = colors[key];
                    key = '--uc-' + key.replaceAll('_', '-');
                    CSSVariables.push(`${key}: ${value};`);
                }
            }
            let mw = TopWindow.document.documentElement;
            let styles = TopWindow.getComputedStyle(mw);
            if ("theme_experiment" in manifestJSON && "colors" in manifestJSON.theme_experiment) {
                let colors = manifestJSON.theme_experiment.colors;
                for (let key in colors) {
                    let value = colors[key];
                    key = '--uc-' + key.replaceAll('_', '-');
                    if (value.startsWith("--")) {
                        key = '--uc' + value.slice(1);
                        value = styles.getPropertyValue(value);
                    }
                    CSSVariables.push(`${key}: ${value};`);
                }
            }
            if (CSSVariables.length > 0) {
                let css = '@-moz-document url-prefix("chrome://"), url-prefix("moz-extension://"), url-prefix("about:")\n{\n:root{\n' + CSSVariables.join("\n") + "\n}\n}";
                this.globalVariables = {
                    url: Services.io.newURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)),
                    type: Ci.nsIStyleSheetService.AGENT_SHEET
                }

                let style = this.globalVariables;
                if (CopyCatTheme.sss.sheetRegistered(style.url, style.type)) return;
                CopyCatTheme.sss.loadAndRegisterSheet(style.url, style.type);
            }

        }

        async removeCSSVariables() {
            const { CopyCatTheme } = TopWindow;
            CopyCatTheme.log('Removing CSS variables');
            if (typeof this.globalVariables === "object" && "url" in this.globalVariables && "type" in this.globalVariables) {
                if (!CopyCatTheme.sss.sheetRegistered(this.globalVariables.url, this.globalVariables.type)) return;
                CopyCatTheme.sss.unregisterSheet(this.globalVariables.url, this.globalVariables.type);
                this.globalVariables = null;
            }
        }

        bindAddonEvent() {
            const { AddonManager } = TopWindow;
            AddonManager.addAddonListener(this.addonEventListener);
        }

        removeAddonEvent() {
            const { AddonManager } = TopWindow;
            AddonManager.removeAddonListener(this.addonEventListener);
        }

        async handleAddon(addon) {
            await this.removeCSSVariables();
            await this.collectCSSVariables();
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
            lang: lang,
            // url: Services.io.newURI(getURLSpecFromFile(aFile)) 使用这种方式 @supports -moz-bool-pref 不生效
        }
    }

    function readFile(aFile, metaOnly) {
        if (!aFile) {
            TopWindow.console.error(formatStr("param is invalid", "readFile", "aFile"));
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
                    type = AUTHOR_SHEET;
                    break;
                case "ag":
                    type = AGENT_SHEET;
                    break;
                case "us":
                    type = USER_SHEET;
                    break;
            }
        } else {
            type = AUTHOR_SHEET;
        }
        return type;
    }

    function getStyleTypeName(type) {
        switch (type) {
            case AUTHOR_SHEET:
                return 'AUTHOR_SHEED';
            case AGENT_SHEET:
                return 'AGENT_SHEED';
            case USER_SHEET:
                return 'USER_SHEED';
        }
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
        /**
         * @update 2024.02.04 兼容 @media / @support (not) -moz-bool-pref
         */
        const regexPref = /-moz-bool-pref[:\s\(]*"([\w\d\.\-])+"\)/gm;
        let matches = content.match(regexPref);
        let options = [];
        if (matches) {
            matches.forEach(m => {
                let [, key] = m.match(/"([\w\d\.\-]+)"/);
                if (!options.includes(key)) options.push(key);
            })
        }
        return options;
    }

    window.CopyCatTheme.init(window);

    if (typeof gBrowserInit === "object" && gBrowserInit.delayedStartupFinished) window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTarget })
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.CopyCatTheme._onclick({ target: window.CopyCatTheme.reloadTarget });
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }


    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
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
            el = doc.createElement(tag.substr(5));
        else
            el = doc.createXULElement(tag);
        return applyAttrs(el, attrs, skipAttrs);
    }

    function applyAttrs(el, attrs, skipAttrs) {
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

    function removeEl(el) {
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
        const LOCALE = LANG[Services.locale.appLocaleAsBCP47] ? Services.locale.appLocaleAsBCP47 : 'zh-CN';
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = LANG[LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace(/%(s|d)/, arguments[i]);
            }
            return str;
        } else return "";
    }

    /**
     * 执行字符串表达式并获得返回值
     * 
     * @param {*} fn 
     * @returns 
     */
    function evil(fn) {
        let Fn = Function;
        try {
            let status = new Fn('return ' + fn)();
            return status;
        } catch (e) {
            return false;
        }
    }
})(``);