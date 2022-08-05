// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.1.5
// @compatibility   Firefox 78
// @include         main
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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

    if (window.CopyCat) {
        window.CopyCat.destroy();
        delete window.CopyCat;
    }

    const LANG = {
        'zh-CN': {
            "copycat btn name": "CopyCat",
            "copycat btn tooltip": "左键：快捷功能\n右键：管理 UC 脚本",
            "main button config has some mistake": "主按钮配置有错误",
            "chrome folder": "Chrome 文件夹",
            "restart firefox": "重启 Firefox",
            "theme settings": "主题设置",
            "reload theme": "重新加载主题",
            "open themes directory": "打开主题目录",
            "open images directory": "打开图片目录",
            "no theme": "关闭主题",
            "theme item tooltip text": "主题：{name}\n作者：{author}\n简介：{description}\n左键：更换主题\n右键：修改主题",
            "theme options": "主题选项",
            "modify config file": "修改配置文件",
            "addMenuPlus config file": "菜单",
            "reload config file": "重新载入配置",
            "KeyChanger config file": "快捷键",
            "portable configure": "便携配置",
            "browser toolbox": "浏览器内容工具箱",
            "fix browser toolbox": "修复浏览器内容工具箱",
            "usefull tools": "实用工具",
            "speedyfox": "配置优化",
            "mouse guestures": "鼠标手势",
            "notepad2": "Notepad2",
            "copy addons list": "复制扩展清单",
            "copy addons list tooltip": "左键：名称 + 相关网页\nShift+左键：Markdown 表格",
            "copy userchromejs list": "复制UC脚本清单",
            "copy userchromejs list tooltip": "左键：名称 + 主页\n中键：名称",
            "about copycat": "关于 CopyCat"
        }
    }

    if (!window.cPref) {
        window.cPref = {
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
    }

    const MENU_CONFIG = {
        id: 'CopyCat-btn',
        type: cPref.get("userChromeJS.CopyCat.showInToolMenu", false) ? 'toolbarbutton' : 'menu',
        label: $L("copycat btn name"),
        tooltiptext: $L("copycat btn tooltip"),
        style: "list-style-image:url(data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI2LjQ2MDkzOCA0LjQ2Njc5NjlDMjQuNjY4OCA0LjUyNTY1MDMgMjMgNS45ODM0NzYyIDIzIDcuOTQ1MzEyNUwyMyAxNC43MDcwMzFDMjMgMTUuMTU4MDY1IDIzLjE4NTUyNyAxNS41NjA1NzIgMjMuMjQyMTg4IDE2TDIxLjUgMTZDMTUuOTMzNDY5IDE2IDEwLjk5Mjc3MyAxOC44MDgwNTMgOCAyMy4wNjgzNTlMOCAxOS41QzggMTYuNTE2NDM4IDkuMDAxODM4MSAxMy41NzM5OTIgMTAuNjg5NDUzIDExLjQ0NzI2NkMxMi4zNzcwNjggOS4zMjA1Mzg2IDE0LjY2NzMzNiA4IDE3LjUgOCBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxNy41IDVDMTMuNzA1NjY0IDUgMTAuNDk1NDc5IDYuODY1NTA3OSA4LjMzOTg0MzggOS41ODIwMzEyQzYuMTg0MjA4OCAxMi4yOTg1NTUgNSAxNS44NTY1NjIgNSAxOS41TDUgMzIuNSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCA1LjAwNzgxMjUgMzIuNjY5OTIyQzUuMDkxOTgxMiAzOC4zNzQxMyA5LjM2MzA0MTQgNDMuMDgzNzMxIDE0Ljg3NSA0My44NzEwOTQgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMTUuNSA0NEwzOS41IDQ0QzQxLjQxNDk1NSA0NCA0MyA0Mi40MTQ5NTUgNDMgNDAuNUM0MyAzOC4zNTc3NCA0MS43NjM2NDIgMzYuNDgyNDg4IDM5Ljk1NzAzMSAzNS41ODAwNzhMMzkuOTU1MDc4IDM1LjU3ODEyNUMzOS4zMTczNDggMzUuMjU4NTM1IDM0LjIwMzU1OSAzMi44OTAwMjEgMzQuMDE3NTc4IDI0LjkzMzU5NEMzOS4wMzkzNzEgMjQuNDE2MDM2IDQzIDIwLjE1ODE4OCA0MyAxNC45OTgwNDdMNDMgNy45NDUzMTI1QzQzIDUuMzI5MjM0NCA0MC4wMzQ0MjQgMy42MTAxNDQgMzcuNzYzNjcyIDQuOTA4MjAzMSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzNy40MDAzOTEgNS4xOTcyNjU2TDM0LjgzNzg5MSA4TDMxLjE2MDE1NiA4TDI4LjU5OTYwOSA1LjE5NzI2NTYgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjguMjM2MzI4IDQuOTA4MjAzMUMyNy42Njg1MTcgNC41ODM2MTgyIDI3LjA1ODMxNiA0LjQ0NzE3OTEgMjYuNDYwOTM4IDQuNDY2Nzk2OSB6IE0gMzkuNTgyMDMxIDcuNDQzMzU5NEMzOS42NTM2NjIgNy40MzQ2Mzc1IDM5LjcyMDQ5NyA3LjQ0MDgzODcgMzkuNzc1MzkxIDcuNDcyNjU2MkMzOS45MTI4OCA3LjU1MjM0NzUgNDAgNy43MTczNTE2IDQwIDcuOTQ1MzEyNUw0MCAxNC45OTgwNDdDNDAgMTkuMDM3MTU1IDM2LjY0MTcwNyAyMi4yNTA4NzggMzIuNTMxMjUgMjEuOTg0Mzc1QzI4LjgzMzk3OCAyMS43NDQ2MDEgMjYgMTguNDc5NDQ4IDI2IDE0LjcwNzAzMUwyNiA3Ljk0NTMxMjVDMjYgNy41MzcwMzU5IDI2LjI5ODIzMiA3LjM3Nzc0MDUgMjYuNjQyNTc4IDcuNTAzOTA2MkwyOS4zOTI1NzggMTAuNTExNzE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMwLjUgMTFMMzUuNSAxMSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzNi42MDc0MjIgMTAuNTExNzE5TDM5LjM1NzQyMiA3LjUwMzkwNjJDMzkuNDMzOTcyIDcuNDc1NzI2MyAzOS41MTA0IDcuNDUyMDgxMiAzOS41ODIwMzEgNy40NDMzNTk0IHogTSAyOS41IDEzIEEgMS41IDEuNSAwIDAgMCAyOS41IDE2IEEgMS41IDEuNSAwIDAgMCAyOS41IDEzIHogTSAzNi41IDEzIEEgMS41IDEuNSAwIDAgMCAzNi41IDE2IEEgMS41IDEuNSAwIDAgMCAzNi41IDEzIHogTSAyMy45NzY1NjIgMTguOTI3NzM0QzI1LjI3NDgzNyAyMS44NDU2NjUgMjcuODEyMzM4IDI0LjEyNzIgMzEuMDEzNjcyIDI0Ljc5Njg3NUMzMS4xNTc5MzkgMzQuMjQ5NDc1IDM3LjkzNzk0NiAzNy45MjMwMzQgMzguNjEzMjgxIDM4LjI2MTcxOSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAzOC42MTUyMzQgMzguMjYxNzE5QzM5LjQzMzIwOCAzOC42Njk3OTUgNDAgMzkuNTA3MjU1IDQwIDQwLjVDNDAgNDAuNzk1MDQ1IDM5Ljc5NTA0NSA0MSAzOS41IDQxTDI4Ljk0NzI2NiA0MUMyOC45NzI2NSA0MC44MzE1OTUgMjkgNDAuNjYzMTMzIDI5IDQwLjQ4ODI4MUMyOSAzNy45NTM4NzMgMjcuMjQ3NDYgMzUuODA2MzEgMjQuODk4NDM4IDM1LjE4NTU0N0MyNC4yNTMwMDIgMzAuNTc1MzQ1IDIwLjI4MTk4NiAyNyAxNS41IDI3TDE0LjUgMjcgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgMTQuNSAzMEwxNS41IDMwQzE5LjA3MzU5MSAzMCAyMS45NDA4ODUgMzIuODQwMTg3IDIxLjk5NDE0MSAzNi40MDAzOTEgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuMTAzNTE2IDM3LjA3MDMxMiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMi4xMTEzMjggMzcuMDkxNzk3IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIyLjEzMjgxMiAzNy4xMzg2NzIgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjMuNjQ2NDg0IDM4LjAxMzY3MkMyNC45NzI0NjYgMzguMDgzMzg2IDI2IDM5LjE0MjM2NCAyNiA0MC40ODgyODFDMjYgNDAuNzg4MyAyNS43ODc0NyA0MSAyNS40ODgyODEgNDFMMTYuNSA0MUMxMS43ODc2MSA0MSA4IDM3LjIxMjM5IDggMzIuNUM4IDI1LjA2ODE4MiAxNC4wNjgxODIgMTkgMjEuNSAxOUwyMy41IDE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIzLjk3NjU2MiAxOC45Mjc3MzQgeiIgLz4NCjwvc3ZnPg==);",
        onclick: function (e) {
            if (e.button == 2 && e.target.localName == 'toolbarbutton') {
                if (window.AM_Helper) {
                    e.preventDefault();
                    e.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/userchromejs");
                }
            }
        },
        popup: [{
            class: 'showFirstText',
            group: [{
                label: $L("chrome folder"),
                exec: '\\chrome',
            }, {
                label: $L("restart firefox"),
                tooltiptext: $L("restart firefox"),
                class: 'reload',
                oncommand: 'Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);',
            }]
        }, {
            label: "userChromeJS",
            exec: "\\chrome\\userChromeJS"
        }, {}, {
            id: 'CopyCat-ThemeMenu',
            label: $L("theme settings"),
            style: "list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik03MDYuNTQ1IDEyOC4wMTlhNjMuOTg1IDYzLjk4NSAwIDAgMSA0OC41OTkgMjIuMzYzbDE3Mi44MzUgMjAxLjc2My02My45OTYgMTI3Ljg1Ny00MS4zNzQtNDEuMzcxYy02LjI1LTYuMjQ4LTE0LjQzNy05LjM3Mi0yMi42MjQtOS4zNzItOC4xODggMC0xNi4zNzQgMy4xMjQtMjIuNjI0IDkuMzcyYTMyLjAwNiAzMi4wMDYgMCAwIDAtOS4zNzUgMjIuNjI2djQwMi43MjdjMCAxNy42NzItMTQuMzI3IDMxLjk5OC0zMS45OTkgMzEuOTk4SDMyMC4wMWMtMTcuNjcxIDAtMzEuOTk4LTE0LjMyNi0zMS45OTgtMzEuOTk4VjQ2MS4yNTZjMC0xNy42NzItMTQuMzI4LTMxLjk5OC0zMi0zMS45OThhMzEuOTk3IDMxLjk5NyAwIDAgMC0yMi42MjQgOS4zNzJsLTQxLjM3MyA0MS4zNzFMOTYuMDIgMzUyLjAwN2wxNzIuODM1LTIwMS42NGE2My45ODcgNjMuOTg3IDAgMCAxIDQ4LjU5Mi0yMi4zNDhoNi41MDdhOTUuOTcgOTUuOTcgMCAwIDEgNTAuMTMgMTQuMTMyQzQyOC4zNyAxNzUuMzk0IDQ3NC4zMzggMTkyLjAxNSA1MTIgMTkyLjAxNXM4My42MjktMTYuNjIxIDEzNy45MTUtNDkuODY0YTk1Ljk2OCA5NS45NjggMCAwIDEgNTAuMTMtMTQuMTMyaDYuNW0wLTYzLjk5OGgtNi41YTE1OS44OSAxNTkuODkgMCAwIDAtODMuNTU3IDIzLjU1OEM1NjEuOTA0IDEyMSA1MjkuNTM3IDEyOC4wMTggNTEyIDEyOC4wMThjLTE3LjUzOCAwLTQ5LjkwNC03LjAxNy0xMDQuNDk1LTQwLjQ0NmExNTkuODgxIDE1OS44ODEgMCAwIDAtODMuNTUtMjMuNTVoLTYuNTA4YTEyNy44MjMgMTI3LjgyMyAwIDAgMC05Ny4xODIgNDQuNzAxTDQ3LjQyOCAzMTAuMzZjLTE5LjUyMiAyMi43NzQtMjAuNiA1Ni4wNS0yLjYxIDgwLjA0N0wxNDAuODE1IDUxOC40YTYzLjk5OCA2My45OTggMCAwIDAgODMuMTk5IDE3LjAyNXYzMjguNTU4YzAgNTIuOTMyIDQzLjA2IDk1Ljk5NSA5NS45OTUgOTUuOTk1aDQxNS45OGM1Mi45MzUgMCA5NS45OTYtNDMuMDYzIDk1Ljk5Ni05NS45OTVWNTM1LjQyNWE2NC4wMjggNjQuMDI4IDAgMCAwIDQyLjI0IDcuNzQ5IDY0LjAxNCA2NC4wMTQgMCAwIDAgNDYuOTktMzQuNTI4bDYzLjk5Ny0xMjcuODU3YzExLjUyMi0yMy4wMjggOC4xMjUtNTAuNzIyLTguNjMzLTcwLjI3OUw4MDMuNzQ0IDEwOC43NDdjLTI0LjMzNi0yOC40MjItNTkuNzctNDQuNzI2LTk3LjItNDQuNzI2eiIgcC1pZD0iMTI4MiI+PC9wYXRoPjwvc3ZnPg==) !important;",
            onBuild: function (aDoc, aItem) {
                CopyCat = aDoc.ownerGlobal.CopyCat;
                CopyCat.PREF_THEME = "userChromeJS.CopyCat.theme";
                CopyCat.getCurrentThemeName = function () {
                    return cPref.get(CopyCat.PREF_THEME, "");
                }
                CopyCat.loadThemes = function () {
                    let file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                    file.initWithPath(CopyCat.themePath);
                    let files = file.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
                    CopyCat.themes = {};
                    while (files.hasMoreElements()) {
                        let file = files.getNext().QueryInterface(Ci.nsIFile);
                        if (file.leafName.endsWith('.css')) {
                            let theme = new UserStyle(file);
                            CopyCat.themes[theme.id] = theme;
                        }
                    }
                }

                CopyCat.loadTheme = loadTheme = function (themeName) {
                    themeName || (themeName = CopyCat.getCurrentThemeName() || "");
                    if (CopyCat.theme)
                        try {
                            CopyCat.theme.unregister();
                        } catch (ex) { }
                    if (themeName && themeName.length > 0) {
                        if (CopyCat.themes[themeName]) {
                            CopyCat.theme = CopyCat.themes[themeName];
                            CopyCat.theme.register();
                        } else {
                            cPref.set(CopyCat.PREF_THEME, "");
                            CopyCat.log("loadTheme", `${themeName} not exists`);
                        }
                    }
                }

                CopyCat.refreshThemeList = function (popup) {
                    if (!popup)
                        return;
                    let aDoc = popup.ownerDocument;
                    let ins = popup.querySelector("#copycat-theme-menu-separator");
                    if (CopyCat.debug) CopyCat.log(["refresh theme list", popup]);
                    popup.querySelectorAll('[skin="true"]').forEach(skin => skin.parentNode.removeChild(skin));
                    if (CopyCat.themes) {
                        Object.values(CopyCat.themes).forEach(theme => {
                            let tooltiptext = CopyCat.$L("theme item tooltip text");
                            tooltiptext = tooltiptext.replace("{name}", theme.name).replace("{author}", theme.author).replace("{description}", theme.description).replace("\\n", "\n");
                            let menuitem = CopyCat.$C(aDoc, 'menuitem', {
                                type: 'radio',
                                class: 'menuitem-iconic',
                                tooltiptext: tooltiptext,
                                skin: true,
                                edit: theme.file.path,
                                value: theme.id,
                                label: theme.name,
                                checked: theme.id === cPref.get(CopyCat.PREF_THEME, "")
                            })
                            if (ins)
                                ins.parentNode.insertBefore(menuitem, ins)
                            else
                                popup.appendChild(menuitem);
                        })
                    }
                }

                CopyCat.refreshThemeOptions = function (popup) {
                    if (!popup)
                        return;
                    let aDoc = popup.ownerDocument;
                    if (this.debug) this.log(["refresh theme options", popup]);
                    popup.querySelectorAll('[option="true"]').forEach(function (option) {
                        let pref = option.getAttribute('pref');
                        if (pref && CopyCat.PREF_LISTENER[pref])
                            cPref.removeListener(CopyCat.PREF_LISTENER[pref]);
                        option.parentNode.removeChild(option);
                    });
                    if (this.theme?.options) {
                        Object.values(this.theme.options).forEach(option => {
                            let item = popup.appendChild(CopyCat.newMenuitem(aDoc, {
                                label: option.name,
                                type: 'checkbox',
                                option: true,
                                pref: option.pref,
                                defaultValue: 0,
                                checked: cPref.get(option.pref, false)
                            }));
                            function callback() {
                                item.setAttribute("checked", cPref.get(option.pref, false));
                                CopyCat.loadTheme();
                            }
                            this.addPrefListener(option.pref, callback);
                        });
                    }
                }

                CopyCat.addPrefListener(CopyCat.PREF_THEME, function (value, pref) {
                    setTimeout(function () {
                        loadTheme();
                    }, 10);
                });

                CopyCat.loadThemes();
                CopyCat.loadTheme();

                CopyCat.needRefreshThemeList = true;
                CopyCat.needRefreshThemeOptions = true;
            },
            onpopupshowing: function (e) {
                let popup = e.target,
                    aDoc = e.ownerDocument,
                    CopyCat = popup.ownerGlobal.CopyCat;
                if (CopyCat?.needRefreshThemeList) {
                    CopyCat.refreshThemeList(popup)
                    CopyCat.needRefreshThemeList = false;
                }

                if (CopyCat?.needRefreshThemeOptions) {
                    CopyCat.refreshThemeOptions(popup);
                    CopyCat.needRefreshThemeOptions = false;
                }

                let themeName = cPref.get(CopyCat?.PREF_THEME, "");
                popup.querySelectorAll("[skin]").forEach(item => {
                    item.setAttribute("checked", false);
                });
                if (themeName?.length) {
                    popup.querySelector(`[skin][value="${themeName}"]`).setAttribute("checked", true);
                } else {
                    popup.querySelector(`[skin="false"]`).setAttribute("checked", true);
                }
            },
            onclick: function (event) {
                let target = event.target;
                if (target.parentNode.localName === "menupopup" && target.hasAttribute("skin")) {
                    if (target.getAttribute("skin") === "true") {
                        if (event.button === 0)
                            cPref.set(CopyCat?.PREF_THEME, target.getAttribute("value"));
                        else if (event.button === 2) {
                            event.preventDefault();
                            CopyCat.onCommand(event);
                        }
                    } else {
                        cPref.set(CopyCat?.PREF_THEME, "");
                    }
                    CopyCat.needRefreshThemeOptions = true;
                }
            },
            popup: [{
                id: 'copycat-theme-menu-reload',
                label: $L("reload theme"),
                class: 'reload',
                oncommand: function () {
                    if (CopyCat) {
                        if (CopyCat.theme) {
                            CopyCat.theme.unregister();
                            delete CopyCat.theme;
                        }
                        if (CopyCat.themes) {
                            delete CopyCat.themes;
                            CopyCat.loadThemes();
                            CopyCat.needRefreshThemeList = true;
                            CopyCat.needRefreshThemeOptions = true;
                        }
                        CopyCat.loadTheme();
                    }
                }
            }, {
                label: $L("open themes directory"),
                exec: "\\" + cPref.get("userChromeJS.CopyCat.THEMES_PATH", "chrome\\resources\\themes")
            }, {
                label: $L("open images directory"),
                exec: "\\chrome\\resources\\images"
            }, {}, {
                label: $L("no theme"),
                id: 'copycat-theme-menu-no-theme',
                type: 'radio',
                skin: 'false',
            }, {
                id: 'copycat-theme-menu-separator'
            }, {
                label: $L("theme options"),
                image: "chrome://global/skin/icons/arrow-down.svg",
                disabled: true
            }]
        }, {
            type: 'menuitem',
            label: $L("modify config file"),
            image: 'chrome://browser/skin/preferences/category-general.svg',
            popup: [{
                class: 'showFirstText',
                group: [{
                    label: $L("addMenuPlus config file"),
                    oncommand: "addMenu.edit(addMenu.FILE);",
                    image: "chrome://browser/skin/menu.svg"
                },
                {
                    label: $L("reload config file"),
                    tooltiptext: $L("reload config file"),
                    oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
                    image: 'chrome://browser/skin/preferences/category-sync.svg',
                }]
            },
            {
                class: 'showFirstText',
                group: [{
                    label: $L("KeyChanger config file"),
                    oncommand: "KeyChanger.edit(KeyChanger.file);",
                    image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuNjggMi44NDIgTCA5Ljk1IDIuODQyIEwgMi4yMiAyLjg0MiBDIDEuNzQ3IDIuODQyIDEuMzE4IDMuMDM1IDEuMDA3IDMuMzQ3IEMgMC42OTUgMy42NTggMC41MDIgNC4wODggMC41MDIgNC41NiBMIDAuNTAyIDEwLjE0MyBMIDAuNTAyIDE1LjcyNSBDIDAuNTAyIDE2LjE5OCAwLjY5NSAxNi42MjcgMS4wMDcgMTYuOTM4IEMgMS4zMTggMTcuMjUgMS43NDcgMTcuNDQzIDIuMjIgMTcuNDQzIEwgOS45NSAxNy40NDMgTCAxNy42OCAxNy40NDMgQyAxOC4xNTIgMTcuNDQzIDE4LjU4MSAxNy4yNSAxOC44OTMgMTYuOTM4IEMgMTkuMjA0IDE2LjYyNyAxOS4zOTcgMTYuMTk4IDE5LjM5NyAxNS43MjUgTCAxOS4zOTcgMTAuMTQzIEwgMTkuMzk3IDQuNTYgQyAxOS4zOTcgNC4wODggMTkuMjA0IDMuNjU4IDE4Ljg5MyAzLjM0NyBDIDE4LjU4MSAzLjAzNSAxOC4xNTIgMi44NDIgMTcuNjggMi44NDIgWiBNIDE3LjY4IDE1LjcyNSBMIDkuOTUgMTUuNzI1IEwgMi4yMiAxNS43MjUgTCAyLjIyIDEwLjE0MyBMIDIuMjIgNC41NiBMIDkuOTUgNC41NiBMIDE3LjY4IDQuNTYgTCAxNy42OCAxMC4xNDMgWiBNIDcuMzczIDYuMjc4IEwgOC4yMzIgNi4yNzggTCA5LjA5MSA2LjI3OCBMIDkuMDkxIDcuMTM3IEwgOS4wOTEgNy45OTUgTCA4LjIzMiA3Ljk5NSBMIDcuMzczIDcuOTk1IEwgNy4zNzMgNy4xMzcgWiBNIDMuOTM4IDYuMjc4IEwgNC43OTcgNi4yNzggTCA1LjY1NSA2LjI3OCBMIDUuNjU1IDcuMTM3IEwgNS42NTUgNy45OTUgTCA0Ljc5NyA3Ljk5NSBMIDMuOTM4IDcuOTk1IEwgMy45MzggNy4xMzcgWiBNIDYuNTE0IDEzLjE0OSBMIDkuOTUgMTMuMTQ5IEwgMTMuMzg1IDEzLjE0OSBMIDEzLjM4NSAxMy41NzggTCAxMy4zODUgMTQuMDA3IEwgOS45NSAxNC4wMDcgTCA2LjUxNCAxNC4wMDcgTCA2LjUxNCAxMy41NzggWiBNIDEwLjgwOSA2LjI3OCBMIDExLjY2NyA2LjI3OCBMIDEyLjUyNiA2LjI3OCBMIDEyLjUyNiA3LjEzNyBMIDEyLjUyNiA3Ljk5NSBMIDExLjY2NyA3Ljk5NSBMIDEwLjgwOSA3Ljk5NSBMIDEwLjgwOSA3LjEzNyBaIE0gNy4zNzMgOS43MTMgTCA4LjIzMiA5LjcxMyBMIDkuMDkxIDkuNzEzIEwgOS4wOTEgMTAuNTcyIEwgOS4wOTEgMTEuNDMxIEwgOC4yMzIgMTEuNDMxIEwgNy4zNzMgMTEuNDMxIEwgNy4zNzMgMTAuNTcyIFogTSAzLjkzOCA5LjcxMyBMIDQuNzk3IDkuNzEzIEwgNS42NTUgOS43MTMgTCA1LjY1NSAxMC41NzIgTCA1LjY1NSAxMS40MzEgTCA0Ljc5NyAxMS40MzEgTCAzLjkzOCAxMS40MzEgTCAzLjkzOCAxMC41NzIgWiBNIDEwLjgwOSA5LjcxMyBMIDExLjY2NyA5LjcxMyBMIDEyLjUyNiA5LjcxMyBMIDEyLjUyNiAxMC41NzIgTCAxMi41MjYgMTEuNDMxIEwgMTEuNjY3IDExLjQzMSBMIDEwLjgwOSAxMS40MzEgTCAxMC44MDkgMTAuNTcyIFogTSAxNC4yNDQgNi4yNzggTCAxNS4xMDMgNi4yNzggTCAxNS45NjIgNi4yNzggTCAxNS45NjIgNy4xMzcgTCAxNS45NjIgNy45OTUgTCAxNS4xMDMgNy45OTUgTCAxNC4yNDQgNy45OTUgTCAxNC4yNDQgNy4xMzcgWiBNIDE0LjI0NCA5LjcxMyBMIDE1LjEwMyA5LjcxMyBMIDE1Ljk2MiA5LjcxMyBMIDE1Ljk2MiAxMC41NzIgTCAxNS45NjIgMTEuNDMxIEwgMTUuMTAzIDExLjQzMSBMIDE0LjI0NCAxMS40MzEgTCAxNC4yNDQgMTAuNTcyIFoiIHN0eWxlPSIiLz4KPC9zdmc+"
                },
                {
                    label: $L("reload config file"),
                    tooltiptext: $L("reload config file"),
                    oncommand: 'setTimeout(function(){ KeyChanger.makeKeyset(true);},10)',
                    image: 'chrome://browser/skin/preferences/category-sync.svg'
                }
                ]
            }, {
                label: 'user.js',
                edit: '\\user.js',
            }, {
            }, {
                label: $L("portable configure"),
                tooltiptext: $L("portable configure"),
                exec: "\\..\\CopyCat.exe",
                text: "-set"
            }]
        }, {
            command: 'TabPlus-menu',
        }, {
            id: 'copycat-insert-point'
        }, {
            class: 'showFirstText',
            group: [{
                label: $L("browser toolbox"),
                oncommand: function (event) {
                    var doc = event.target.ownerDocument;
                    if (!doc.getElementById('menu_browserToolbox')) {
                        let {
                            require
                        } = Cu.import("resource://devtools/shared/loader/Loader.jsm", {});
                        require("devtools/client/framework/devtools-browser");
                    };
                    doc.getElementById('menu_browserToolbox').click();
                },
                image: "chrome://devtools/skin/images/tool-inspector.svg"
            },
            {
                label: $L("fix browser toolbox"),
                tooltiptext: $L("fix browser toolbox"),
                oncommand: function () {
                    let targetPath;
                    if (CopyCat.appVersion >= 100) {
                        // 先记录一下，下边的也能用
                        targetPath = PathUtils.join(
                            PathUtils.profileDir,
                            "chrome_debugger_profile"
                        );
                    } else {
                        targetPath = FileUtils.getFile("ProfD", [
                            "chrome_debugger_profile"
                        ], false).path;
                    }
                    IOUtils.setPermissions(targetPath,
                        0o660);
                    IOUtils.remove(targetPath, {
                        recursive: true
                    });
                },
                image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTIwLjcxLDMuMjljLTEuMDQtMS4wNC0yLjUtMS41NS00LjEyLTEuNDVjLTEuNSwwLjEtMi45NSwwLjc0LTMuOTgsMS43N2MtMS4wNiwxLjA2LTEuNDksMi4zNS0xLjI1LDMuNzJjMC4wNCwwLjI0LDAuMSwwLjQ3LDAuMTgsMC43MWwtMy41LDMuNWMtMC4yNC0wLjA4LTAuNDctMC4xNC0wLjcxLTAuMThjLTEuMzctMC4yNC0yLjY2LDAuMTktMy43MiwxLjI1Yy0xLjAzLDEuMDMtMS42NywyLjQ4LTEuNzcsMy45OGMtMC4xLDEuNjIsMC40MSwzLjA4LDEuNDUsNC4xMmMwLjk1LDAuOTUsMi4yNiwxLjQ2LDMuNzEsMS40NmMwLjEzLDAsMC4yNywwLDAuNDEtMC4wMWMxLjUtMC4xLDIuOTUtMC43NCwzLjk4LTEuNzdjMS4wNi0xLjA2LDEuNDktMi4zNSwxLjI1LTMuNzJjLTAuMDQtMC4yNC0wLjEtMC40Ny0wLjE4LTAuNzFsMy41LTMuNWMwLjI0LDAuMDgsMC40NywwLjE0LDAuNzEsMC4xOGMwLjI1LDAuMDUsMC40OSwwLjA3LDAuNzMsMC4wN2MxLjEsMCwyLjEyLTAuNDUsMi45OS0xLjMyYzEuMDMtMS4wMywxLjY3LTIuNDgsMS43Ny0zLjk4QzIyLjI2LDUuNzksMjEuNzUsNC4zMywyMC43MSwzLjI5eiBNMTguOTgsOS45N2MtMC4zOSwwLjM5LTAuNzksMC42My0xLjIzLDAuN2MtMC4yNCwwLjA1LTAuNDgsMC4wNS0wLjc0LDBjLTAuNDYtMC4wOC0wLjk1LTAuMy0xLjQ1LTAuNjVsLTEuNDMsMS40M2wtMi42OCwyLjY4bC0xLjQzLDEuNDNjMC4zNSwwLjUsMC41NywwLjk5LDAuNjUsMS40NWMwLjAyLDAuMTMsMC4wNCwwLjI2LDAuMDQsMC4zOWMwLDAuMS0wLjAxLDAuMi0wLjAyLDAuMjljLTAuMDcsMC40Ni0wLjMxLDAuODgtMC43MSwxLjI4Yy0wLjY5LDAuNjktMS42OCwxLjEyLTIuNywxLjE5Yy0wLjYzNCwwLjA0My0xLjIxNS0wLjA3NC0xLjcyMS0wLjMwNGwyLjE0OC0yLjE0OWMwLjM5MS0wLjM5MSwwLjM5MS0xLjAyMywwLTEuNDE0cy0xLjAyMy0wLjM5MS0xLjQxNCwwbC0yLjE0OCwyLjE0OWMtMC4yMzEtMC41MDYtMC4zNDgtMS4wODgtMC4zMDUtMS43MjJjMC4wNy0xLjAyLDAuNS0yLjAxLDEuMTgtMi42OWMwLjQxLTAuNDEsMC44NC0wLjY1LDEuMy0wLjcxYzAuMDktMC4wMiwwLjE5LTAuMDMsMC4yOS0wLjAzYzAuMTIsMCwwLjI1LDAuMDEsMC4zOCwwLjA0YzAuNDYsMC4wOCwwLjk1LDAuMywxLjQ1LDAuNjVsMS40My0xLjQzbDIuNjgtMi42OGwxLjQzLTEuNDNjLTAuMzUtMC41LTAuNTctMC45OS0wLjY1LTEuNDVjLTAuMDQtMC4yNC0wLjA1LTAuNDYtMC4wMi0wLjY4YzAuMDctMC40NiwwLjMxLTAuODgsMC43MS0xLjI4YzAuNjktMC42OSwxLjY4LTEuMTIsMi43LTEuMTljMC4xLTAuMDEsMC4xOS0wLjAxLDAuMjgtMC4wMWMwLjUzLDAsMS4wMSwwLjEsMS40NCwwLjMxaDAuMDA1bC0yLjE1MywyLjE1M2MtMC4zOTEsMC4zOTEtMC4zOTEsMS4wMjMsMCwxLjQxNEMxNi40ODgsNy45MDIsMTYuNzQ0LDgsMTcsOHMwLjUxMi0wLjA5OCwwLjcwNy0wLjI5M2wyLjE2My0yLjE2M1Y1LjU1YzAuMjMsMC41LDAuMzMsMS4xLDAuMjksMS43M0MyMC4wOSw4LjMsMTkuNjYsOS4yOSwxOC45OCw5Ljk3eiIvPg0KPC9zdmc+"
            }
            ]
        }, {
            label: $L("usefull tools"),
            image: 'data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTcuNjI4OTA2MiAzLjA0Mjk2ODhMNi4yMTQ4NDM4IDQuNDU3MDMxMkwxMS4wOTU3MDMgOS4zMzc4OTA2TDIuNzM2MzI4MSAxNy42OTcyNjZDMS43NTQzMjgxIDE4LjY4MDI2NiAxLjc1MzMyODEgMjAuMjc5NzE5IDIuNzM2MzI4MSAyMS4yNjE3MTlDMy4yMTIzMjgxIDIxLjczODcxOSAzLjg0NjUzMTMgMjIgNC41MTk1MzEyIDIyQzUuMTkyNTMxMyAyMiA1LjgyNDc4MTMgMjEuNzM3NzE5IDYuMzAwNzgxMiAyMS4yNjE3MTlMMTQuNjYwMTU2IDEyLjkwMjM0NEwxOC41ODU5MzggMTYuODI4MTI1TDE5LjI5Mjk2OSAxNi4xMjEwOTRMMjIuODI0MjE5IDEyLjU4OTg0NEwxOC45MTk5MjIgOC42NDQ1MzEyTDIwLjI4MTI1IDcuMjgxMjVMMTkuNjYyMTA5IDYuNjYyMTA5NEwxNy4zMzc4OTEgNC4zMzc4OTA2TDE2LjcxODc1IDMuNzE4NzVMMTUuMzczMDQ3IDUuMDYyNUwxMy4zNzUgMy4wNDI5Njg4TDcuNjI4OTA2MiAzLjA0Mjk2ODggeiBNIDkuNjI4OTA2MiA1LjA0Mjk2ODhMMTIuNTM5MDYyIDUuMDQyOTY4OEwyMC4wMDM5MDYgMTIuNTgyMDMxTDE4LjU4NTkzOCAxNEw5LjYyODkwNjIgNS4wNDI5Njg4IHoiIC8+DQo8L3N2Zz4=',
            onclick: function (e) {
                if (e.button === 2) {
                    CopyCat.exec(CopyCat.handleRelativePath("\\chrome\\resources\\tools"));
                }
            },
            closemenu: true,
            contextmenu: false,
            popup: [{
                label: $L("speedyfox"),
                tool: '\\speedyfox.exe',
            }, {
                label: $L("mouse guestures"),
                tool: '\\MouseInc\\MouseInc.exe'
            }, {
                label: $L("notepad2"),
                tool: '\\Notepad2\\Notepad2.exe'
            }, {
                label: $L("copy addons list"),
                tooltiptext: $L("copy addons list tooltip"),
                image: "chrome://mozapps/skin/extensions/extension.svg",
                onclick: function (e) {
                    e.preventDefault();
                    AddonManager.getAddonsByTypes(['extension']).then(
                        addons => {
                            return addons.map(addon => {
                                let data = []
                                if (addon.isBuiltin) return data;
                                data['url'] = addon.homepageURL || addon.installTelemetryInfo?.sourceURL || '';;
                                ["name", "id", "isWebExtension", "version", "isActive"].forEach(k => {
                                    data[k] = addon[k] || '';
                                });
                                return data;
                            });
                        }
                    ).then(arr => arr = arr.filter(m => !!m.id)).then(arr => {
                        let text = e.shiftKey ? "| 名称 | 版本 | 链接 | 默 | \n| ---- | ---- | ---- | ---- |\n" : "",
                            glue = e.shiftKey ? "|" : " ";
                        arr.forEach(item => {
                            let line = [item.name, item.version, item.url, item.isActive ? '✔' : '✘'].join(glue);
                            if (e.shiftKey) line = [glue, glue].join(line);
                            text += line + '\n';
                        })
                        CopyCat.copyText(text);
                    });
                }
            }, {
                label: $L("copy userchromejs list"),
                tooltiptext: $L("copy userchromejs list tooltip"),
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC",
                onclick: function (e) {
                    e.preventDefault();
                    AddonManager.getAddonsByTypes(['userchromejs']).then(
                        addons => {
                            return addons.map(addon => {
                                let str = "{name}";
                                switch (e.button) {
                                    case 0:
                                        str += ' ' + (addon.homepageURL || '');
                                    default:
                                        break;
                                }
                                return str.replace("{name}", addon.name);
                            }
                            )
                        }
                    ).then(arr => CopyCat.copyText(arr.join('\n')));
                }
            }]
        }, {}, {
            label: $L("about copycat"),
            where: 'tab',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
            url: 'https://kkp.disk.st/firefox-ryan-personal-customization.html'
        }]
    }

    window.CopyCat = {
        PREF_LISTENER: [],
        THEME_LISTENER: [],
        FUNCTION_LIST: [],
        DESTROY_LIST: [],
        URL_PREFIX: "resource://copycat-profd/",
        _eventId: 1,
        _btnId: 1,
        menuCfg: cloneObj(MENU_CONFIG),
        $C: $C,
        $L: $L,
        sss: Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        _paths: {},
        get appVersion() { return Services.appinfo.version.split(".")[0]; },
        get browserWin() { return Services.wm.getMostRecentWindow("navigator:browser"); },
        get eventId() { return this._eventId++; },
        get btnId() { return this._btnId++; },
        get debug() { return cPref.get("userChromeJS.CopyCat.debug", false); },
        get themeRelatedPath() { return cPref.get("userChromeJS.CopyCat.THEMES_PATH", "chrome\\resources\\themes"); },
        get themePath() {
            if (!this._themePath) {
                let path = this.themeRelatedPath;
                let aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                aFile.initWithPath(this.handleRelativePath("\\" + path));
                if (!aFile.exists()) {
                    aFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
                }
                this._themePath = aFile.path;
            }
            return this._themePath;
        },
        get toolPath() {
            if (!this._toolPath) {
                let path = cPref.get("userChromeJS.CopyCat.TOOLS_PATH", "chrome\\resources\\tools");
                let aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                aFile.initWithPath(this.handleRelativePath("\\" + path));
                if (!aFile.exists()) {
                    aFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
                }
                this._toolPath = aFile.path;
            }
            return this._toolPath;
        },
        get themeUrlPrefix() {
            if (!this._themeUrlPrefix) {
                this._themeUrlPrefix = this.URL_PREFIX + this.themeRelatedPath.replace(/(\w)\/\//g, "$1/").replaceAll("\\", "/");
            }
            return this._themeUrlPrefix;
        },
        init: function (win) {
            try {
                ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
                    var path = Services.dirsvc.get(key, Ci.nsIFile);
                    this._paths[key] = path;
                });
                // add resource path
                let aFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
                const resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
                if (!resourceHandler.hasSubstitution("copycat-profd")) {
                    resourceHandler.setSubstitution("copycat-profd", Services.io.newFileURI(aFile));
                }
                if (this.debug) this.log("CopyCat init");
                if (!MENU_CONFIG) {
                    if (this.debug) this.log($L("main button config has some mistake"));
                    return;
                }
                this.rebuild(win);
            } catch (e) {
                Cu.reportError(e);
            }
            this.style = addStyle(css);
        },
        uninit() {
            if (this.DESTROY_LIST.length) {
                // need to implement
            }
            if (this.mainEl) {
                if (this.debug) this.log($L("CopyCat: estoring moved menuitems."));
                $QA('.CopyCat-Replacement[original-id]').forEach(item => {
                    // 还原移动的菜单
                    let orgId = item.getAttribute('original-id') || "";
                    if (orgId.length) {
                        let org = $(orgId);
                        if (org && item && item.parentNode) {
                            item.parentNode.insertBefore(org, item);
                            item.parentNode.removeChild(item);
                        }
                    }
                });
                if (this.debug) this.log($L("CopyCat: destroying element"), this.mainEl);
                if (this.mainEl) {
                    if (this.mainEl.localName === 'toolbarbutton')
                        CustomizableUI.destroyWidget(this.mainEl.id);
                    else
                        this.mainEl.parentNode.removeChild(this.mainEl);
                }
            }
            if (this.theme) {
                this.theme.unregister();
                delete this.theme;
            }
            if (this.themes)
                delete this.themes;

            this.PREF_LISTENER.forEach(l => cPref.removeListener(l));
            this.PREF_LISTENER = [];
        },
        rebuild: function (win) {
            win || (win = window);
            this.uninit();
            if (cPref.get(this.PREF_SWITCH_TO_TOOLMENU, false)) {
                let menu = $C(doc, 'menu',);
                let ins = $("prefSep", doc) || $("webDeveloperMenu", doc);
                if (ins) {
                    ins.parentNode.insertBefore(menu, ins);
                } else {
                    this.error($L("CopyCat: toolmenu has no insert point"));
                }
                this.mainEl = menu;
                if (this.menuCfg.popup)
                    this.mainEl.appendChild(this.newMenuPopup(this.mainEl.ownerDocument, this.menuCfg.popup));
            } else {
                let widgetId = this.menuCfg.id || "CopyCat-Button-" + this.btnId;
                CustomizableUI.createWidget({
                    id: widgetId,
                    type: 'custom',
                    localized: false,
                    defaultArea: this.menuCfg.defaultArea || CustomizableUI.AREA_NAVBAR,
                    onBuild: function (aDoc) {
                        let btn;
                        try {
                            btn = CopyCat.$C(aDoc, 'toolbarbutton', CopyCat.menuCfg, ['type', 'group', 'popup']);
                            'toolbarbutton-1 chromeclass-toolbar-additional'.split(' ').forEach(c => btn.classList.add(c));
                            if (CopyCat.menuCfg.popup) {
                                let popup = CopyCat.newMenuPopup(aDoc, CopyCat.menuCfg.popup);
                                if (popup) {
                                    $A(btn, {
                                        type: "menu",
                                        menu: btn.id + "-popup"
                                    });
                                    popup.setAttribute('id', btn.id + "-popup");
                                    btn.appendChild(popup);
                                }
                            }
                        } catch (e) {
                            CopyCat.error(e);
                        }
                        return btn;
                    }
                });
                this.mainEl = CustomizableUI.getWidget(widgetId).forWindow(win).node;
            }
        },
        newMenuPopup(doc, obj) {
            if (!obj) return;
            let popup = $C(doc, 'menupopup');
            obj.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) popup.appendChild(el);
            });
            popup.classList.add("CopyCat-Popup");
            return popup;
        },
        newMenuGroup(doc, obj) {
            if (!obj) return;
            let group = $C(doc, 'menugroup', obj, ["group", "popup"]);
            obj.group.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) group.appendChild(el);
            })
            group.classList.add("CopyCat-Group");
            return group;
        },
        newMenuitem(doc, obj) {
            if (!obj) return;
            if (obj.group) {
                return this.newMenuGroup(doc, obj);
            }
            let item
            if (obj.popup) {
                item = $C(doc, "menu", obj, ["popup"]);
                item.classList.add("menu-iconic");
                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    } else {
                        eval("(" + obj.onBuild + ").call(el, doc, item)")
                    }
                }
                item.appendChild(this.newMenuPopup(doc, obj.popup));
            } else {

                let classList = [],
                    tagName = obj.type || 'menuitem';
                if (['separator', 'menuseparator'].includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.image && !obj.command && !obj.pref) {
                    return $C(doc, 'menuseparator', obj, ['type', 'group', 'popup']);
                }

                if (['checkbox', 'radio'].includes(obj.type)) tagName = 'menuitem';
                if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
                classList.push(tagName + '-iconic');

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
                        let replacement = $C(doc, 'menuseparator', { hidden: true, class: 'CopyCat-Replacement', 'original-id': obj.command });
                        org.parentNode.insertBefore(replacement, org);
                        return org;
                    } else {
                        return $C(doc, 'menuseparator', { hidden: true });
                    }
                } else {
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                    if (classList.length) item.setAttribute('class', classList.join(' '));
                    $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type']);
                    item.setAttribute('label', obj.label || obj.command || obj.oncommand);

                    if (obj.pref) {
                        let type = cPref.getType(obj.pref) || obj.type || 'unknown';
                        const map = {
                            string: 'prompt',
                            int: 'prompt',
                            boolean: 'checkbox',
                        }
                        const defaultVal = {
                            string: '',
                            int: 0,
                            bool: false
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


                if (!obj.pref && !obj.onclick)
                    item.setAttribute("onclick", "checkForMiddleClick(this, event)");

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

            if (obj.oncommand || obj.command)
                return item;

            item.setAttribute("oncommand", "CopyCat.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            return item;
        },
        onCommand: function (event) {
            event.stopPropagation();
            if (event.button === 0 && event.target.hasAttribute('skin')) return;
            let item = event.target;
            let pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "";
            where = item.getAttribute("where") || "";
            if (pref) this.handlePref(event, pref);
            else if (exec) this.exec(exec, text);
            else if (edit) this.edit(edit);
            else if (url) this.openCommand(event, url, where);
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
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log('openCommand', 'url is invalid', url);
            }
            if (uri.scheme === "javascript") {
                try {
                    loadURI(url);
                } catch (e) {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                if (this.appVersion < 78) {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } else {
                    openUILinkIn(uri.spec, where, {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(uri.spec) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            )
                    });
                }
            } else if (event.button == 1) {
                if (this.appVersion < 78) {
                    openNewTabWith(uri.spec);
                } else {
                    openNewTabWith(uri.spec, 'tab', {
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } else {
                if (this.appVersion < 78)
                    openUILink(uri.spec, event);
                else {
                    openUILink(uri.spec, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            }
        },
        edit: function (edit) {
            if (this.debug) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg) {
            if (this.debug) this.log('exec', path, arg);
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
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

                file.initWithPath(path);
                if (!file.exists()) {
                    this.error($L("file not found").replace("%s", path))
                    return;
                }

                if (file.isExecutable()) {
                    process.init(file);
                    process.runw(false, a, a.length);
                } else {
                    file.launch();
                }
            } catch (e) {
                this.error(e);
            }
        },
        addPrefListener(pref, callback) {
            this.PREF_LISTENER[pref] = cPref.addListener(pref, callback);
        },
        handleRelativePath: function (path, parentPath) {
            if (path) {
                let handled = false;
                path = this.replaceArray(path, [
                    "{homeDir}",
                    "{libDir}",
                    "{localProfileDir}",
                    "{profileDir}",
                    "{tmpDir}"
                ], [
                    "{Home}",
                    "{GreD}",
                    "{ProfLD}",
                    "{ProfD}",
                    "{TmpD}"
                ]);
                ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
                    if (path.includes("{" + key + "}")) {
                        path = path.replace("{" + key + "}", this._paths[key] || "");
                        handled = true;
                    }
                })
                if (!handled) {
                    path = path.replace(/\//g, '\\').toLocaleLowerCase();
                    if (/^(\\)/.test(path)) {
                        if (!parentPath) {
                            parentPath = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                        }
                        path = parentPath + path;
                        path = path.replace("\\\\", "\\");
                    }
                }
                return path;
            }
        },
        replaceArray: function (replaceString, find, replace) {
            var regex;
            for (var i = 0; i < find.length; i++) {
                regex = new RegExp(find[i], "g");
                replaceString = replaceString.replace(regex, replace[i]);
            }
            return replaceString;
        },
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

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
                } catch (e) { this.log(e) }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ?
                                "moz-anno:favicon:" + aURI.spec :
                                "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
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
                this.log(e)
            }).catch(e => { });
        },
        readFile(fileOrName, metaOnly = false) {
            var file;
            if (typeof fileOrName == "string") {
                file = Services.dirsvc.get('UChrm', Ci.nsIFile);
                file.appendRelativePath(fileOrName);
            } else {
                file = fileOrName;
            }
            let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
            stream.init(file, 0x01, 0, 0);
            let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
            cvstream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            let content = '',
                data = {};
            while (cvstream.readString(4096, data)) {
                content += data.value;
                if (metaOnly && (content.indexOf('// ==/UserScript==' || content.indexOf('==/UserStyle=='))) > 0) {
                    break;
                }
            }
            cvstream.close();
            return content.replace(/\r\n?/g, '\n');
        },
        copyText: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
            //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
        },
        saveFile(fileOrName, data) {
            var file;
            if (typeof fileOrName == "string") {
                file = Services.dirsvc.get('UChrm', Ci.nsIFile);
                file.appendRelativePath(fileOrName);
            } else {
                file = fileOrName;
            }

            var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            suConverter.charset = 'UTF-8';
            data = suConverter.ConvertFromUnicode(data);

            var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
            foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
            foStream.write(data, data.length);
            foStream.close();
        },
        getURLSpecFromFile(aFile) {
            var aURL;
            if (typeof userChrome !== "undefined" && typeof userChrome.getURLSpecFromFile !== "undefined") {
                aURL = userChrome.getURLSpecFromFile(aFile);
            } else if (this.appVersion < 92) {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
            } else {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
            }
            return aURL;
        },
        destroy: function () {
            this.uninit();
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.CopyCat;
        },
        log: function () {
            console.log(Array.prototype.slice.call(arguments));
        },
        error: function () {
            Cu.reportError(Array.prototype.slice.call(arguments));
        },
    }

    class UserStyle {
        constructor(aFile) {
            this.file = aFile;
            this.type = 2;
            Object.entries(readStyleInfo(aFile)).forEach(([key, value]) => {
                this[key] = value;
            });
            this.id = aFile.leafName.replace(/\.css$/, '');
            if ((this.name || "").length === 0)
                this.name = this.id;

            this.url = Services.io.newURI(CopyCat.themeUrlPrefix + "/" + aFile.leafName);
        }
        get enabled() {
            return CopyCat?.theme?.id === this.id;
        }
        register() {
            CopyCat.sss.loadAndRegisterSheet(this.url, this.type);
        }
        unregister() {
            CopyCat.sss.unregisterSheet(this.url, this.type);
        }
        reload() {
            if (this.enabled) {
                this.unregister();
                this.register();
            }
        }
        get options() {
            if (!this._options) {
                let content = CopyCat.readFile(this.file),
                    options = content.match(/-moz-bool-pref\("([\w\.\-]+)"\)/gm);
                this._options = [];
                let keys = {};
                if (options)
                    options.forEach(option => {
                        let [, key] = option.match(/"([\w\.\-]+)"/);
                        let name = this.lang[key] || key;
                        if (!keys[key]) {
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
                            keys[key] = true;
                        }
                    });
            }
            return this._options;
        }
    }

    function readStyleInfo(aFile) {
        let content = CopyCat.readFile(aFile, true);
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

    /**
     * 创建 DOM 元素
     * @param {string} tag DOM 元素标签
     * @param {object} attr 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns 
     */
    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
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
        } else
            return "";
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

    /**
     * 克隆对象
     * @param {object} o 
     * @returns 
     */
    function cloneObj(o) {
        if (typeof (o) === typeof (1) || typeof ('') === typeof (o) || typeof (o) === typeof (true) ||
            typeof (o) === typeof (undefined)) {
            return o
        }
        if (Array.isArray(o)) {
            let arr = []
            for (let key in o) {
                arr.push(cloneObj(o[key]))
            }
            return arr
        }
        if (typeof (o) === typeof ({})) {
            if (o === null) {
                return o
            }
            let obj = {}
            for (let key in o) {
                obj[key] = cloneObj(o[key])
            }
            return obj
        }
        return o;
    }

    /**
     * 增加样式
     * @param {string} css 
     * @returns 
     */
    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    window.CopyCat.init(window);
    setTimeout(function () { window.CopyCat.rebuild(window); }, 1000);//1秒
    setTimeout(function () { window.CopyCat.rebuild(window); }, 3000);//3秒
})(`
.CopyCat-Group > .menuitem-iconic {
    padding-block: 0.5em;
}

.CopyCat-Group > .menuitem-iconic:first-child {
    padding-inline-start: 1em;
}
.CopyCat-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
.CopyCat-Group > :is(menu, menuitem) > .menu-accel-container {
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
.CopyCat-Popup menuseparator+menuseparator {
    visibility: collapse;
}
.CopyCat-Popup menuseparator:last-child {
    /* 懒得研究为什么多了一个分隔符 */
    visibility: collapse;
}

.CopyCat-Popup .menuitem-iconic.reload {
    list-style-image: url(chrome://global/skin/icons/reload.svg) !important;
}

.CopyCat-Popup .menuitem-iconic.option {
    list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
}
`)