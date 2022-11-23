// ==UserScript==
// @name           addMenuPlus.uc.js
// @description    通过配置文件增加修改菜单，修改版
// @namespace      http://d.hatena.ne.jp/Griever/
// @author         Ryan, ywzhaiqi, Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 70
// @charset        UTF-8
// @version        0.2.0
// @shutdown       window.addMenu.destroy(win);
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @downloadURL    https://github.com/ywzhaiqi/userChromeJS/raw/master/addmenuPlus/addMenuPlus.uc.js
// @reviewURL      
// @note           0.2.0 采用 JSWindowActor 与内容进程通信（替代 e10s 时代的 loadFrameScript，虽然目前还能用），修复 onshowing 仅在页面右键生效的 bug
// @note           0.1.4 onshowing/onshowinglabel 在所有右键菜单生效
// @note           0.1.3 修正 Firefox 78 (?应该是吧) openUILinkIn 参数变更；Firefox 92 getURLSpecFromFile 废止，切换到 getURLSpecFromActualFile；添加到文件菜单的 app/appmenu 菜单自动移动到汉堡菜单, 修复 keyword 调用搜索引擎失效的问题，没有 label 并使用 keyword 调用搜索引擎时设置 label 为搜素引擎名称；增加 onshowinglabel 属性，增加本地化属性 data-l10n-href 以及 data-l10n-id；修正右键未显示时无法获取选中文本，增加菜单类型 nav （navigator-toolbox的右键菜单），兼容 textLink_e10s.uc.js，增加移动的菜单无需重启浏览器即可还原，增加 identity-box 右键菜单, getSelectionText 完美修复，支持内置页面，修复右键菜单获取选中文本不完整
// @note           0.1.2 增加多语言；修复 %I %IMAGE_URL% %IMAGE_BASE64% 转换为空白字符串；GroupMenu 增加 onshowing 事件
// @note           0.1.1 Places keywords API を使うようにした
// @note           0.1.0 menugroup をとりあえず利用できるようにした
// @note           0.0.9 Firefox 29 の Firefox Button 廃止に伴いファイルメニューに追加するように変更
// @note           0.0.8 Firefox 25 の getShortcutOrURI 廃止に仮対応
// @note           0.0.7 Firefox 21 の Favicon 周りの変更に対応
// @note           0.0.6 Firefox 19 に合わせて修正
// @note           0.0.5 Remove E4X
// @note           0.0.4 設定ファイルから CSS を追加できるようにした
// @note           0.0.4 label の無い menu を splitmenu 風の動作にした
// @note           0.0.4 Vista でアイコンがズレる問題を修正…したかも
// @note           0.0.4 %SEL% の改行が消えてしまうのを修正
// @note           0.0.3 keyword の新しい書式で古い書式が動かない場合があったのを修正
// @note           %URL_HTMLIFIED%, %EOL_ENCODE% が変換できなかったミスを修正
// @note           %LINK_OR_URL% 変数を作成（リンク URL がなければページの URL を返す）
// @note           タブの右クリックメニューでは %URL% や %SEL% はそのタブのものを返すようにした
// @note           keyword で "g %URL%" のような記述を可能にした
// @note           ツールの再読み込みメニューの右クリックで設定ファイルを開くようにした
// @note           修复支持57+
// ==/UserScript==
if (typeof window === "undefined" || globalThis !== window) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
    try {
        if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
            BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
        }
    } catch (e) { }
    const PrivateBrowsingUtils = globalThis.PrivateBrowsingUtils || Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm").PrivateBrowsingUtils;

    var useScraptchpad = true; // @Deprecated 如果不存在编辑器，则使用代码片段速记器，否则设置编辑器路径 
    var enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
    var onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
    var enableIdentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单
    var enableContentAreaContextMenuCompact = false; // Photon 界面下右键菜单兼容开关，有需要再开
    const ADDMENU_LANG = {
        'zh-CN': {
            'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件' +
                '\n\n' +
                'tab({\n    label: "addMenuPlus 配置",\n    oncommand: "AddMenu.edit(AddMenu.FILE);"\n});',
            'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
            'custom showing method error': 'addMenuPlus 自定义显示错误',
            'url is invalid': 'URL 不正确: %s',
            'config file': '配置文件',
            'not exists': ' 不存在',
            'check config file with line': '\n请重新检查配置文件第 %s 行',
            'file not found': '文件不存在: %s',
            'config has reload': '配置已经重新载入',
            'please set editor path': '请先设置编辑器的路径!!!',
            'set global editor': '设置全局脚本编辑器',
            'executable files': '执行文件',
            'could not load': '无法载入：%s'
        },
        'en-US': {
            'config example': '// This is an addMenuPlus configuration file.\n' +
                '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                '\n\n' +
                'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: "AddMenu.edit(AddMenu.FILE);"\n});',
            'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
            'custom showing method error': 'addMenuPlus customize popupshow error',
            'url is invalid': 'URL is invalid: %s',
            'config file': 'Configuration file',
            'not exists': ' not exists',
            'check config file with line': '\nPlease recheck line %s of the configuration file',
            'file not found': 'File not found: %s',
            'config has reload': 'The configuration has been reloaded',
            'please set editor path': 'Please set the path to the editor first!!!',
            'set global editor': 'Setting up the global script editor',
            'executable files': 'Executable files',
            'could not load': 'Could not load：%s'
        },
    }

    const ADDMENU_STYLE = `
addMenuHide
{ display: none !important; }
#contentAreaContextMenu:not([addMenu~="select"]) .addMenu[condition~="select"],
#contentAreaContextMenu:not([addMenu~="link"])   .addMenu[condition~="link"],
#contentAreaContextMenu:not([addMenu~="mailto"]) .addMenu[condition~="mailto"],
#contentAreaContextMenu:not([addMenu~="image"])  .addMenu[condition~="image"],
#contentAreaContextMenu:not([addMenu~="canvas"])  .addMenu[condition~="canvas"],
#contentAreaContextMenu:not([addMenu~="media"])  .addMenu[condition~="media"],
#contentAreaContextMenu:not([addMenu~="input"])  .addMenu[condition~="input"],
#contentAreaContextMenu[addMenu~="select"] .addMenu[condition~="noselect"],
#contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="nolink"],
#contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="nomailto"],
#contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="noimage"],
#contentAreaContextMenu[addMenu~="canvas"]  .addMenu[condition~="nocanvas"],
#contentAreaContextMenu[addMenu~="media"]  .addMenu[condition~="nomedia"],
#contentAreaContextMenu[addMenu~="input"]  .addMenu[condition~="noinput"],
#contentAreaContextMenu:not([addMenu=""])  .addMenu[condition~="normal"]
{ display: none; }
#toolbar-context-menu:not([addMenu~="menubar"]) .addMenu[condition~="menubar"],
#toolbar-context-menu:not([addMenu~="tabs"]) .addMenu[condition~="tabs"],
#toolbar-context-menu:not([addMenu~="navbar"]) .addMenu[condition~="navbar"],
#toolbar-context-menu:not([addMenu~="personal"]) .addMenu[condition~="personal"],
#toolbar-context-menu:not([addMenu~="button"]) .addMenu[condition~="button"],
#toolbar-context-menu[addMenu~="menubar"] .addMenu[condition~="nomenubar"],
#toolbar-context-menu[addMenu~="tabs"] .addMenu[condition~="notabs"],
#toolbar-context-menu[addMenu~="navbar"] .addMenu[condition~="nonavbar"],
#toolbar-context-menu[addMenu~="personal"] .addMenu[condition~="nopersonal"],
#toolbar-context-menu[addMenu~="button"] .addMenu[condition~="nobutton"],
#toolbar-context-menu:not([addMenu=""]) .addMenu[condition~="normal"]
{ display: none !important; }
.addMenu-insert-point
{ display: none !important; }
.addMenu[url] {
list-style-image: url("chrome://mozapps/skin/places/defaultFavicon.png");
}
.addMenu.exec,
.addMenu[exec] {
list-style-image: url("chrome://devtools/content/debugger/images/window.svg");
}
.addMenu.copy,
menuitem.addMenu[text]:not([url]):not([keyword]):not([exec])
{
list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik00IDJDMi44OTUgMiAyIDIuODk1IDIgNEwyIDE3QzIgMTcuNTUyIDIuNDQ4IDE4IDMgMThDMy41NTIgMTggNCAxNy41NTIgNCAxN0w0IDRMMTcgNEMxNy41NTIgNCAxOCAzLjU1MiAxOCAzQzE4IDIuNDQ4IDE3LjU1MiAyIDE3IDJMNCAyIHogTSA4IDZDNi44OTUgNiA2IDYuODk1IDYgOEw2IDIwQzYgMjEuMTA1IDYuODk1IDIyIDggMjJMMjAgMjJDMjEuMTA1IDIyIDIyIDIxLjEwNSAyMiAyMEwyMiA4QzIyIDYuODk1IDIxLjEwNSA2IDIwIDZMOCA2IHogTSA4IDhMMjAgOEwyMCAyMEw4IDIwTDggOCB6Ii8+PC9zdmc+);
-moz-image-region: rect(0pt, 16px, 16px, 0px);
}
.addMenu.checkbox .menu-iconic-icon {
-moz-appearance: checkbox;
}
.addMenu > .menu-iconic-left {
-moz-appearance: menuimage;
}
.addMenu > .menu-iconic-left > .menu-iconic-icon {
-moz-context-properties: fill, fill-opacity !important;
fill: currentColor !important;
}
#contentAreaContextMenu[photoncompact="true"]:not([needsgutter]) > .addMenu:is(menu, menuitem) > .menu-iconic-left,
#contentAreaContextMenu[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu >.addMenu:first-child > .menu-iconic-left {
visibility: collapse;
}
/* menugroup.addMenu {
padding-bottom: 2px;
} */
menugroup.addMenu > .menuitem-iconic.fixedSize {
-moz-box-flex: 0;
padding-inline-end: 8px;
}
menugroup.addMenu > .menuitem-iconic:nth-child(2).noIcon {
padding-inline-start: 0;
}
menugroup.addMenu > .menuitem-iconic:nth-child(2).noIcon > .menu-iconic-text {
padding-inline-start: 0 !important;
}
menugroup.addMenu > .menuitem-iconic.noIcon > .menu-iconic-left {
display: none !important;
padding-inline-end: 0px !important;
}
menugroup.addMenu > .menuitem-iconic {
-moz-box-flex: 1;
-moz-box-pack: center;
-moz-box-align: center;
padding-block: 4px;
padding-inline-start: 1em;
}
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left {
-moz-appearance: none;
/* padding-top: 2px; */
}
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
width: 16px;
height: 16px;
}
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-text,
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child) > .menu-iconic-text,
menugroup.addMenu > .menuitem-iconic > .menu-accel-container {
display: none;
}
menugroup.addMenu > .menuitem-iconic {
padding-inline-end: 1em;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) {
padding-left: 0;
-moz-box-flex: 0;
padding-inline-end: 0;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > .menu-iconic-left {
margin-inline-start: 8px;
margin-inline-end: 8px;
}
#addMenu-app-insertpoint+toolbarseparator {
display: none;
}
    `;


    // 读取语言代码
    let _locale;
    try {
        let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
        if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
            _locales = osPrefs.getRegionalPrefsLocales();
        else
            _locales = osPrefs.regionalPrefsLocales;
        for (let i = 0; i < _locales.length; i++) {
            if (ADDMENU_LANG.hasOwnProperty(_locales[i])) {
                _locale = _locales[i];
                break;
            }
        }
    } catch (e) { }
    const ADDMENU_LOCALE = _locale || "en-US";

    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["AddMenu", "AddMenuParent"];
        try {
            const actorParams = {
                parent: {
                    moduleURI: __URI__,
                },
                child: {
                    moduleURI: __URI__,
                    events: {},
                },
                allFrames: true,
                messageManagerGroups: ["browsers"],
                matches: ["*://*/*", "file:///*", "about:*", "view-source:*"],
            };
            ChromeUtils.registerWindowActor("AddMenu", actorParams);
        } catch (e) { Cu.reportError(e); }

        this.AddMenu = new class {
            async init(win) {
                const { Localization, alert, document: doc, PanelUI, gBrowser, console } = win;
                this.win = win;
                this.log = console.log;
                this.error = console.error;
                this.prefs = Services.prefs.getBranch("addMenu.");
                this.appVersion = parseFloat(Services.appinfo.version);
                this.locale = ADDMENU_LOCALE;
                this.panelId = Math.floor(Math.random() * 900000 + 99999);
                // 读取配置文件路径
                var path, aFile;
                try {
                    // addMenu.FILE_PATH があればそれを使う
                    path = this.prefs.getStringPref("FILE_PATH")
                } catch (e) {
                    path = '_addmenu.js';
                }

                aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);

                if (!aFile.exists()) {
                    await IOUtils.writeUTF8(aFile.path, $L('config example'));
                    alert($L('example is empty'));
                    this.openCommand({
                        target: this
                    }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
                }
                this._modifiedTime = aFile.lastModifiedTime;
                this.FILE = aFile;
                this.supportLocalization = typeof Localization === "function";

                // 设置正则表达式
                let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
                let rTITLE = "%TITLE" + he + "%|%t\\b";
                let rTITLES = "%TITLES" + he + "%|%t\\b";
                let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
                let rHOST = "%HOST" + he + "%|%h\\b";
                let rSEL = "%SEL" + he + "%|%s\\b";
                let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
                let rIMAGE = "%IMAGE(?:_URL|_ALT|_TITLE)" + he + "%|%i\\b";
                let rIMAGE_BASE64 = "%IMAGE_BASE64" + he + "%|%i\\b";
                let rSVG_BASE64 = "%SVG_BASE64" + he + "%|%i\\b";
                let rMEDIA = "%MEDIA_URL" + he + "%|%m\\b";
                let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
                let rFAVICON = "%FAVICON" + he + "%";
                let rEMAIL = "%EMAIL" + he + "%";
                let rExt = "%EOL" + he + "%";

                let rFAVICON_BASE64 = "%FAVICON_BASE64" + he + "%";
                let rRLT_OR_UT = "%RLT_OR_UT" + he + "%"; // 链接文本或网页标题

                this.rTITLE = new RegExp(rTITLE, "i");
                this.rTITLES = new RegExp(rTITLES, "i");
                this.rURL = new RegExp(rURL, "i");
                this.rHOST = new RegExp(rHOST, "i");
                this.rSEL = new RegExp(rSEL, "i");
                this.rLINK = new RegExp(rLINK, "i");
                this.rIMAGE = new RegExp(rIMAGE, "i");
                this.rMEDIA = new RegExp(rMEDIA, "i");
                this.rCLIPBOARD = new RegExp(rCLIPBOARD, "i");
                this.rFAVICON = new RegExp(rFAVICON, "i");
                this.rEMAIL = new RegExp(rEMAIL, "i");
                this.rExt = new RegExp(rExt, "i");
                this.rFAVICON_BASE64 = new RegExp(rFAVICON_BASE64, "i");
                this.rIMAGE_BASE64 = new RegExp(rIMAGE_BASE64, "i");
                this.rSVG_BASE64 = new RegExp(rSVG_BASE64, "i");
                this.rRLT_OR_UT = new RegExp(rRLT_OR_UT, "i");

                this.regexp = new RegExp(
                    [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rIMAGE, rIMAGE_BASE64, rMEDIA, rSVG_BASE64, rCLIPBOARD, rFAVICON, rFAVICON_BASE64, rEMAIL, rExt, rRLT_OR_UT].join("|"), "ig");

                this.MENU_ATTRS = {
                    tab: {
                        insRef: $("context_closeTab", doc),
                        current: "tab",
                        submenu: "TabMenu",
                        groupmenu: "TabGroup"
                    },
                    page: {
                        insRef: $("context-viewsource", doc),
                        current: "page",
                        submenu: "PageMenu",
                        groupmenu: "PageGroup"
                    },
                    tool: {
                        insRef: $("prefSep", doc) || $("webDeveloperMenu", doc),
                        current: "tool",
                        submenu: "ToolMenu",
                        groupmenu: "ToolGroup"
                    },
                    app: {
                        insRef: $("appmenu-quit", doc) || $("appMenu-quit-button", doc) || $("appMenu-quit-button2", doc) || $("menu_FileQuitItem", doc),
                        current: "app",
                        submenu: "AppMenu",
                        groupmenu: "AppGroup"
                    },
                    nav: {
                        insRef: $("toolbar-context-undoCloseTab", doc) || $("toolbarItemsMenuSeparator", doc),
                        current: "nav",
                        submenu: "NavMenu",
                        groupmenu: "NavGroup"
                    }
                };

                // add menuitem insertpoint
                for (let type in this.MENU_ATTRS) {
                    let ins = this.MENU_ATTRS[type].insRef;
                    if (ins) {
                        let tag = ins.localName.startsWith("menu") ? "menuseparator" : "toolbarseparator";
                        let insertPoint = $C(doc, tag, {
                            id: `addMenu-${type}-insertpoint`,
                            class: "addMenu-insert-point",
                            hidden: true
                        })
                        this.MENU_ATTRS[type].insertId = insertPoint.id;
                        ins.parentNode.insertBefore(insertPoint, ins.nextSibling);
                        delete this.MENU_ATTRS[type].insRef;
                    } else {
                        delete this.MENU_ATTRS[type];
                    }
                }

                // old style groupmenu compatibility
                this.MENU_ATTRS['group'] = {
                    current: "group",
                    submenu: "GroupMenu",
                    insertId: "addMenu-page-insertpoint"
                }

                // add menu popup events
                $("contentAreaContextMenu", doc).addEventListener("popupshowing", this, false);
                $("tabContextMenu", doc).addEventListener("popupshowing", this, false);
                $("toolbar-context-menu", doc).addEventListener("popupshowing", this, false);
                $("menu_FilePopup", doc).addEventListener("popupshowing", this, false);
                $("menu_ToolsPopup", doc).addEventListener("popupshowing", this, false);

                // move menuitems to Hamburger menu when firstly clicks the PanelUI button 
                PanelUI.mainView.addEventListener("ViewShowing", this.moveToAppMenu, {
                    once: true
                });

                this.identityBox = $('identity-icon', doc) || $('identity-box', doc)
                if (enableIdentityBoxContextMenu && this.identityBox) {
                    this.identityBox.addEventListener("click", this, false);
                    this.identityBox.setAttribute('contextmenu', false);
                    var popup = $C(doc, 'menupopup', {
                        id: 'identity-box-contextmenu'
                    });
                    popup.addEventListener("popupshowing", this, false);
                    popup.appendChild($C(doc, "menuseparator", {
                        id: "addMenu-identity-insertpoint",
                        class: "addMenu-insert-point",
                        hidden: true
                    }));
                    $("mainPopupSet", doc).appendChild(popup);
                    this.MENU_ATTRS['ident'] = {
                        current: "ident",
                        submenu: "IdentMenu",
                        groupmenu: "IdentGroup",
                        insertId: 'addMenu-identity-insertpoint'
                    }
                }

                // 增加工具菜单
                let ins = $("devToolsSeparator", doc);
                ins.parentNode.insertBefore($C(doc, "menuitem", {
                    id: "addMenu-rebuild",
                    label: $L('addmenuplus label'),
                    tooltiptext: $L('addmenuplus tooltip'),
                    oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
                    onclick: "if (event.button == 2) { event.preventDefault(); addMenu.edit(addMenu.FILE); }",
                }), ins);

                // Photon Compact
                if (enableContentAreaContextMenuCompact)
                    $("contentAreaContextMenu", doc).setAttribute("photoncompact", "true");

                // 响应鼠标键释放事件（eg：获取选中文本）
                (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);

                this._selectedText = "";

                this.style = addStyle(ADDMENU_STYLE, doc);

                this.rebuild(false, win);
            }
            rebuild(isAlert, win) {
                win || (win = this.win);
                var aFile = this.FILE;

                if (!aFile || !aFile.exists() || !aFile.isFile()) {
                    this.log(aFile ? aFile.path : U($L('config file')) + U($L('not exists')));
                    return;
                }

                var data = loadText(aFile);

                var sandbox = new Cu.Sandbox(new XPCNativeWrapper(win));

                // sandbox.Components = Components;
                sandbox.Cc = Cc;
                sandbox.Ci = Ci;
                sandbox.Cr = Cr;
                sandbox.Cu = Cu;
                sandbox.Services = Services;
                sandbox.locale = this.locale;
                sandbox.addMenu = this;
                sandbox.$L = $L;

                var includeSrc = "";
                sandbox.include = function (aLeafName) {
                    var data = loadFile(aLeafName);
                    if (data)
                        includeSrc += data + "\n";
                };
                sandbox._css = [];

                Object.values(this.MENU_ATTRS).forEach(function ({
                    current,
                    submenu,
                    groupmenu
                }) {
                    sandbox["_" + current] = [];
                    if (submenu !== "GroupMenu") {
                        sandbox[current] = function (itemObj) {
                            ps(itemObj, sandbox["_" + current]);
                        }
                    }
                    sandbox[submenu] = function (menuObj) {
                        if (!menuObj)
                            menuObj = {};
                        menuObj._items = [];
                        if (submenu == 'GroupMenu')
                            menuObj._group = true;
                        sandbox["_" + current].push(menuObj);
                        return function (itemObj) {
                            ps(itemObj, menuObj._items);
                        }
                    }
                    if (isDef(groupmenu))
                        sandbox[groupmenu] = function (menuObj) {
                            if (!menuObj)
                                menuObj = {};
                            menuObj._items = [];
                            menuObj._group = true;
                            sandbox["_" + current].push(menuObj);
                            return function (itemObj) {
                                ps(itemObj, menuObj._items);
                            }
                        }
                }, this);

                function ps(item, array) {
                    ("join" in item && "unshift" in item) ? [].push.apply(array, item) :
                        array.push(item);
                }

                try {
                    var lineFinder = new Error();
                    Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\n" + data, sandbox, "1.8");
                    Cu.evalInSandbox(includeSrc, sandbox, "1.8");
                } catch (e) {
                    let line = e.lineNumber - lineFinder.lineNumber - 1;
                    this.alert(e + $L("check config file with line", line), null, function () {
                        AddMenu.edit(AddMenu.FILE, line);
                    });
                    return this.log(e);
                }

                if (this.style2 && this.style2.parentNode)
                    this.style2.parentNode.removeChild(this.style2);
                if (sandbox._css.length)
                    this.style2 = addStyle(sandbox._css.join("\n"), win.document);

                this.removeMenuitem(win.document);

                this.customShowings = [];

                Object.values(this.MENU_ATTRS).forEach(function ({
                    current,
                    submenu,
                    groupmenu,
                    insertId
                }) {
                    if (!sandbox["_" + current] || sandbox["_" + current].length == 0) return;
                    let insertPoint = $(insertId, win.document);
                    this.createMenuitem(sandbox["_" + current], insertPoint, win.document);
                }, this);

                if (isAlert) this.alert($L('config has reload'));
            }
            removeMenuitem(doc) {
                var remove = function (e) {
                    if (e.classList.contains('addMenuNot')) return;
                    e.parentNode.removeChild(e);
                };

                $$('.addMenuOriginal', doc).forEach((e) => {
                    let id = e.getAttribute('original-id');
                    if (id && $(id))
                        e.parentNode.insertBefore($(id), e);
                    e.parentNode.removeChild(e);
                });

                $$('menu.addMenu, menugroup.addMenu', doc).forEach(remove);
                $$('.addMenu', doc).forEach(remove);
                // 恢复原隐藏菜单
                $$('.addMenuHide', doc).forEach(function (e) {
                    e.classList.remove('addMenuHide');
                });
            }
            destroy(win) {
                win || (win = this.win);
                const { document: doc } = win;
                $("contentAreaContextMenu", doc).removeEventListener("popupshowing", this, false);
                $("tabContextMenu", doc).removeEventListener("popupshowing", this, false);
                $("toolbar-context-menu", doc).removeEventListener("popupshowing", this, false);
                $("menu_FilePopup", doc).removeEventListener("popupshowing", this, false);
                $("menu_ToolsPopup", doc).removeEventListener("popupshowing", this, false);
                (gBrowser.mPanelContainer || gBrowser.tabpanels).removeEventListener("mouseup", this, false);
                this.removeMenuitem();
                $$('#addMenu-rebuild, .addMenu-insert-point', doc).forEach(function (e) {
                    e.parentNode.removeChild(e)
                });
                $("contentAreaContextMenu", doc).removeAttribute("photoncompact");
                if ($('identity-box-contextmenu', doc)) {
                    var popup = $('identity-box-contextmenu', doc);
                    popup.parentNode.removeChild(popup);
                }
                if (this.identityBox) {
                    this.identityBox.removeAttribute('contextmenu');
                    this.identityBox.removeEventListener("click", this, false);
                }
                if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
                if (this.style2 && this.style2.parentNode) this.style2.parentNode.removeChild(this.style2);
                delete window.AddMenu;
            }
            handleEvent(event) {
                let { ownerDocument: doc, ownerGlobal: win } = event.target;
                win || (win = this.win);
                switch (event.type) {
                    case "popupshowing":
                        if (event.target != event.currentTarget) return;

                        if (enableFileRefreshing) {
                            this.updateModifiedFile();
                        }

                        if (event.target.id == 'contentAreaContextMenu') {
                            const { gContextMenu } = win;
                            var state = [];
                            if (gContextMenu.onTextInput)
                                state.push("input");
                            if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                                state.push("select");
                            if (gContextMenu.onLink || event.target.querySelector("#context-openlinkincurrent").getAttribute("hidden") !== "true")
                                state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                            if (gContextMenu.onCanvas)
                                state.push("canvas image");
                            if (gContextMenu.onImage)
                                state.push("image");
                            if (gContextMenu.onVideo || gContextMenu.onAudio)
                                state.push("media");
                            event.currentTarget.setAttribute("addMenu", state.join(" "));

                            event.target.querySelectorAll(`.addMenu[condition]`).forEach(m => {
                                // 显示时自动更新标签
                                if (m.hasAttribute('onshowinglabel')) {
                                    onshowinglabelMaxLength = onshowinglabelMaxLength || 15;
                                    var sel = this.convertText(m.getAttribute('onshowinglabel'))
                                    if (sel && sel.length > 15)
                                        sel = sel.substr(0, 15) + "...";
                                    m.setAttribute('label', sel);
                                }
                            }, this);
                        }

                        if (event.target.id === "toolbar-context-menu") {
                            let triggerNode = event.target.triggerNode;
                            var state = [];
                            const map = {
                                'toolbar-menubar': 'menubar',
                                'TabsToolbar': 'tabs',
                                'nav-bar': 'navbar',
                                'PersonalToolbar': 'personal',
                            }
                            Object.keys(map).map(e => $(e, doc).contains(triggerNode) && state.push(map[e]));
                            if (triggerNode && triggerNode.localName === "toolbarbutton") {
                                state.push("button");
                            }
                            event.currentTarget.setAttribute("addMenu", state.join(" "));
                        }
                        const window = event.originalTarget.ownerGlobal;
                        this.customShowings.forEach(function (obj) {
                            var curItem = obj.item;
                            try {
                                eval('(' + obj.fnSource + ').call(curItem, curItem)');
                            } catch (ex) {
                                console.error($L('custom showing method error'), obj.fnSource, ex);
                            }
                        });
                        break;
                    case 'click':
                        if (event.button == 2 && event.target.id === this.identityBox.id)
                            $("identity-box-contextmenu", doc).openPopup(event.target, "after_pointer", 0, 0, true, false);
                        break;
                    case 'mouseup':
                        // get selected text
                        if (win.gBrowser && win.gBrowser.selectedBrowser) {
                            // 网页
                            let actor = win.gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("AddMenu");
                            actor.sendAsyncMessage("AM:GetSelectedText", {});
                        } else {
                            // 内置页面
                            this._selectedText = BrowserOrSelectionUtils.getSelectionDetails(win).fullText;
                        }
                        break;
                }
            }
            async moveToAppMenu(event) {
                const { ownerDocument: doc } = event.target;
                let ins = $('addMenu-app-insertpoint', doc);
                if (ins && ins.localName === 'menuseparator') {
                    let separator = $('appMenu-quit-button2', doc).previousSibling;
                    if (separator) {
                        ins.remove();
                        // AddMenu.removeMenuitem();
                        ins = $C(doc, 'toolbarseparator', {
                            'id': 'addMenu-app-insertpoint',
                            class: "addMenu-insert-point",
                            hidden: true
                        });
                        separator.parentNode.insertBefore(ins, separator);
                        AddMenu.rebuild();
                    }
                }
            }
            createMenuitem(itemArray, insertPoint, doc) {
                var chldren = $AC(insertPoint.parentNode.children);
                //Symbol.iterator
                for (let obj of itemArray) {
                    if (!obj) continue;
                    let menuitem;

                    // clone menuitem and set attribute
                    if (obj.id && (menuitem = $(obj.id, doc))) {
                        let dupMenuitem;
                        let isDupMenu = (obj.clone != false);
                        if (isDupMenu) {
                            dupMenuitem = menuitem.cloneNode(true);

                            // 隐藏原菜单
                            // menuitem.classList.add("addMenuHide");
                        } else {
                            dupMenuitem = menuitem;
                            // 增加用于还原已移动菜单的标记
                            if (dupMenuitem)
                                dupMenuitem.parentNode.insertBefore($C(doc, insertPoint.localName, {
                                    'original-id': dupMenuitem.getAttribute('id'),
                                    hidden: true,
                                    class: 'addMenuOriginal',
                                }), dupMenuitem);
                        }
                        for (let key in obj) {
                            let val = obj[key];
                            if (key === "framescript") {
                                if (typeof val !== "string")
                                    val = val.toString();

                                obj[key] = val = btoa(encodeURIComponent(val));
                            }
                            if (typeof val == "function") {
                                obj[key] = val = "(" + val.toString() + ").call(this, event);";
                            }

                            dupMenuitem.setAttribute(key, val);
                        }

                        // 如果没有则添加 menuitem-iconic 或 menu-iconic，给菜单添加图标用。
                        let type = dupMenuitem.nodeName,
                            cls = dupMenuitem.classList;
                        if (type == 'menuitem' || type == 'menu')
                            if (!cls.contains(type + '-iconic'))
                                cls.add(type + '-iconic');

                        if (!cls.contains('addMenu'))
                            cls.add('addMenu');
                        if (!isDupMenu && !cls.contains('addMenuNot'))
                            cls.add('addMenuNot');

                        // // 没有插入位置的默认放在原来那个菜单的后面
                        // if(isDupMenu && !obj.insertAfter && !obj.insertBefore && !obj.position){
                        //     obj.insertAfter = obj.id;
                        // }
                        let noMove = !isDupMenu;
                        insertMenuItem(doc, obj, dupMenuitem, noMove);
                        continue;
                    }

                    menuitem = obj._items ? this.newMenu(obj, {
                        insertPoint: insertPoint
                    }, doc) : this.newMenuitem(obj, {
                        isTopMenuitem: true,
                        insertPoint: insertPoint
                    }, doc);

                    insertMenuItem(doc, obj, menuitem);

                    function insertMenuItem(doc, obj, menuitem, noMove) {
                        let ins;
                        if (obj.parent && (ins = $(obj.parent, doc))) {
                            ins.appendChild(menuitem);
                            return;
                        }
                        if (obj.insertAfter && (ins = $(obj.insertAfter, doc))) {
                            ins.parentNode.insertBefore(menuitem, ins.nextSibling);
                            return;
                        }
                        if (obj.insertBefore && (ins = $(obj.insertBefore, doc))) {
                            ins.parentNode.insertBefore(menuitem, ins);
                            return;
                        }
                        if (obj.position && parseInt(obj.position, 10) > 0) {
                            (ins = chldren[parseInt(obj.position, 10) - 1]) ?
                                ins.parentNode.insertBefore(menuitem, ins) :
                                insertPoint.parentNode.appendChild(menuitem);
                            return;
                        }
                        if (!noMove) {
                            insertPoint.parentNode.insertBefore(menuitem, insertPoint);
                        }
                    }
                }
            }
            newMenu(menuObj, opt, doc) {
                doc || (doc = this.win.document);
                opt || (opt = {});
                if (menuObj._group) {
                    return this.newGroupMenu(menuObj, doc);
                }
                var isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menu",
                    menu = $C(doc, menuitemType),
                    popup,
                    panelId;

                // fix for appmenu
                const viewCache = ($('appMenu-viewCache', doc) && $('appMenu-viewCache', doc).content) || $('appMenu-multiView', doc);
                if (isAppMenu && viewCache) {
                    menu.setAttribute('closemenu', "none");
                    panelId = menuObj.id ? menuObj.id + "-panel" : "addMenu-panel-" + this.panelId++;
                    popup = viewCache.appendChild($C(doc, 'panelview', {
                        'id': panelId,
                        'class': 'addMenu PanelUI-subView'
                    }));
                    popup = popup.appendChild($C(doc, 'vbox', {
                        class: 'panel-subview-body',
                        panelId: panelId
                    }));
                } else {
                    popup = menu.appendChild($C(doc, "menupopup"));
                }
                for (let key in menuObj) {
                    let val = menuObj[key];
                    if (key === "_items") continue;

                    if (!isAppMenu && key === 'onshowing') {
                        this.customShowings.push({
                            item: menu,
                            fnSource: menuObj.onshowing.toString()
                        });
                        delete menuObj.onshowing;
                        continue;
                    }
                    if (key === "framescript") {
                        if (typeof val !== "string")
                            val = val.toString();

                        menuObj[key] = val = btoa(encodeURIComponent(val));
                    }
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);"
                    menu.setAttribute(key, val);

                }

                let cls = menu.classList;
                cls.add("addMenu");
                if (isAppMenu) {
                    cls.add("subviewbutton");
                    cls.add("subviewbutton-nav");
                } else {
                    cls.add("menu-iconic");
                }


                // 表示 / 非表示の設定
                if (menuObj.condition)
                    this.setCondition(menu, menuObj.condition);

                menuObj._items.forEach(function (obj) {
                    popup.appendChild(this.newMenuitem(obj, opt, doc));
                }, this);

                // menu に label が無い場合、最初の menuitem の label 等を持ってくる
                // menu 部分をクリックで実行できるようにする(splitmenu みたいな感じ)
                if (isAppMenu) {
                    menu.setAttribute('oncommand', `PanelUI.showSubView('${panelId}', this)`);
                } else if (!menu.hasAttribute('label')) {
                    let firstItem = menu.querySelector('menuitem');
                    if (firstItem) {
                        let command = firstItem.getAttribute('command');
                        if (command)
                            firstItem = doc.getElementById(command) || firstItem;
                        ['label', 'accesskey', 'image', 'icon'].forEach(function (n) {
                            if (!menu.hasAttribute(n) && firstItem.hasAttribute(n))
                                menu.setAttribute(n, firstItem.getAttribute(n));
                        }, this);
                        menu.setAttribute('onclick', "\
                        if (event.target != event.currentTarget) return;\
                        var firstItem = event.currentTarget.querySelector('menuitem');\
                        if (!firstItem) return;\
                        if (event.button === 1) {\
                            checkForMiddleClick(firstItem, event);\
                        } else {\
                            firstItem.doCommand();\
                            closeMenus(event.currentTarget);\
                        }\
                    ");
                    }
                }
                return menu;
            }
            newGroupMenu(menuObj, doc) {
                doc || (doc = this.win.document);
                let group = $C(doc, 'menugroup');
                // 增加 onshowing 事件
                if (menuObj.onshowing) {
                    this.customShowings.push({
                        item: group,
                        fnSource: menuObj.onshowing
                    });
                    delete menuObj.onshowing;
                }

                Object.keys(menuObj).map(function (key) {
                    var val = menuObj[key];
                    if (key === "_items") return;
                    if (key === "_group") return;
                    if (key === "framescript") {
                        if (typeof val !== "string")
                            val = val.toString();

                        menuObj[key] = val = btoa(encodeURIComponent(val));
                    }
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);";
                    group.setAttribute(key, val);
                }, this);
                let cls = group.classList;
                cls.add('addMenu');

                // 表示 / 非表示の設定
                if (menuObj.condition)
                    this.setCondition(group, menuObj.condition);

                menuObj._items.forEach(function (obj) {
                    group.appendChild(this.newMenuitem(obj, {
                        isMenuGroup: true
                    }, doc));
                }, this);
                return group;
            }
            newMenuitem(obj, opt, doc) {
                opt || (opt = {});
                doc || (opt = this.win.document);
                var menuitem,
                    isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menuitem",
                    noDefaultLabel = false;

                // label == separator か必要なプロパティが足りない場合は区切りとみなす
                if (obj.label === "separator" ||
                    (!obj.label && !obj.image && !obj.text && !obj.keyword && !obj.url && !obj.oncommand && !obj.command)) {
                    menuitem = $C(doc, separatorType);
                } else if (obj.oncommand || obj.command) {
                    let org = obj.command ? $(obj.command, doc) : null;
                    if (org && org.localName === separatorType) {
                        menuitem = $C(doc, separatorType);
                    } else {
                        menuitem = $C(doc, menuitemType);
                        if (obj.command)
                            menuitem.setAttribute("command", obj.command);

                        noDefaultLabel = !obj.label;
                        if (noDefaultLabel)
                            obj.label = obj.command || obj.oncommand;
                    }
                } else {
                    menuitem = $C(doc, menuitemType);

                    // property fix
                    noDefaultLabel = !obj.label;
                    if (noDefaultLabel)
                        obj.label = obj.exec || obj.keyword || obj.url || obj.text;

                    if (obj.keyword && !obj.text) {
                        let index = obj.keyword.search(/\s+/);
                        if (index > 0) {
                            obj.text = obj.keyword.substr(index).trim();
                            obj.keyword = obj.keyword.substr(0, index);
                        }
                    }

                    if (obj.where && /\b(tab|tabshifted|window|current)\b/i.test(obj.where))
                        obj.where = RegExp.$1.toLowerCase();

                    if (obj.where && !("acceltext" in obj))
                        obj.acceltext = obj.where;

                    if (!obj.condition && (obj.url || obj.text)) {
                        // 表示 / 非表示の自動設定
                        let condition = "";
                        if (this.rSEL.test(obj.url || obj.text)) condition += " select";
                        if (this.rLINK.test(obj.url || obj.text)) condition += " link";
                        if (this.rEMAIL.test(obj.url || obj.text)) condition += " mailto";
                        if (this.rIMAGE.test(obj.url || obj.text)) condition += " image";
                        if (this.rMEDIA.test(obj.url || obj.text)) condition += " media";
                        if (condition)
                            obj.condition = condition;
                    }

                    if (obj.exec) {
                        obj.exec = this.handleRelativePath(obj.exec);
                    }
                }

                // 右键第一层菜单添加 onpopupshowing 事件
                if (opt.isTopMenuitem && obj.onshowing) {
                    this.customShowings.push({
                        item: menuitem,
                        fnSource: obj.onshowing.toString()
                    });
                    delete obj.onshowing;
                }


                for (let key in obj) {
                    let val = obj[key];
                    if (key === "command") continue;
                    if (key === "framescript") {
                        if (typeof val !== "string")
                            val = val.toString();

                        obj[key] = val = btoa(encodeURIComponent(val));
                    }
                    if (typeof val == "function")
                        obj[key] = val = "(" + val.toString() + ").call(this, event);";
                    menuitem.setAttribute(key, val);
                }

                if (noDefaultLabel && menuitem.localName !== separatorType) {
                    if (this.supportLocalization && obj['data-l10n-href'] && obj["data-l10n-href"].endsWith(".ftl") && obj['data-l10n-id']) {
                        // Localization 支持
                        let strings = new Localization([obj["data-l10n-href"]]);
                        strings.formatValue([obj['data-l10n-id']]).then(
                            text => {
                                menuitem.setAttribute('label', text || menuitem.getAttribute("label"));
                            }
                        )
                    } else if (obj.keyword) {
                        // 调用搜索引擎 Label hack
                        let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                        if (isPromise(engine)) {
                            engine.then(s => {
                                if (s && s._name) menuitem.setAttribute('label', s._name);
                            });
                        } else {
                            if (engine && engine._name) menuitem.setAttribute('label', engine._name);
                        }
                    }
                }

                /** obj を属性にする
                 for (let [key, val] in Iterator(obj)) {
                if (key === "command") continue;
                if (typeof val == "function")
                    obj[key] = val = "(" + val.toString() + ").call(this, event);";
                    menuitem.setAttribute(key, val);
                }**/

                var cls = menuitem.classList;
                cls.add("addMenu");

                if (isAppMenu) {
                    if (menuitem.localName == "toolbarbutton") cls.add("subviewbutton");
                } else {
                    cls.add("menuitem-iconic");
                }
                // 表示 / 非表示の設定
                if (obj.condition)
                    this.setCondition(menuitem, obj.condition);

                // separator はここで終了
                if (menuitem.localName == separatorType)
                    return menuitem;

                if (!obj.onclick)
                    menuitem.setAttribute("onclick", "checkForMiddleClick(this, event)");

                // 给 MenuGroup 的菜单加上 tooltiptext
                if (opt.isMenuGroup && !obj.tooltiptext && obj.label) {
                    menuitem.setAttribute('tooltiptext', obj.label);
                }

                // oncommand, command はここで終了
                if (obj.oncommand || obj.command)
                    return menuitem;

                menuitem.setAttribute("oncommand", "addMenu.onCommand(event);");

                // 可能ならばアイコンを付ける
                this.setIcon(menuitem, obj);

                return menuitem;
            }
            setIcon(menu, obj) {
                const { PlacesUtils } = this.win;
                if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                    return;

                if (obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(obj.exec);
                    } catch (e) {
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
                    } catch (e) {
                        this.log(e)
                    }
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
            }
            setCondition(menu, condition) {
                if (/\bnormal\b/i.test(condition)) {
                    menu.setAttribute("condition", "normal");
                } else {
                    let match = condition.toLowerCase().match(/\b(?:no)?(?:select|link|mailto|image|canvas|media|input)\b/ig);
                    if (!match || !match[0])
                        return;
                    match = match.filter(function (c, i, a) {
                        return a.indexOf(c) === i
                    });
                    menu.setAttribute("condition", match.join(" "));
                }
            }
            updateModifiedFile() {
                if (!this.FILE.exists()) return;

                if (this._modifiedTime != this.FILE.lastModifiedTime) {
                    this._modifiedTime = this.FILE.lastModifiedTime;

                    setTimeout(function () {
                        addMenu.rebuild(true);
                    }, 10);
                }
            }
            onCommand(event) {
                var menuitem = event.target;
                var text = menuitem.getAttribute("text") || "";
                var keyword = menuitem.getAttribute("keyword") || "";
                var url = menuitem.getAttribute("url") || "";
                var where = menuitem.getAttribute("where") || "";
                var exec = menuitem.getAttribute("exec") || "";
                var framescript = menuitem.getAttribute("framescript") || "";

                if (keyword) {
                    let param = (text ? (text = this.convertText(text)) : "");
                    let engine = keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(keyword);
                    if (engine) {
                        if (isPromise(engine)) {
                            engine.then(function (engine) {
                                let submission = engine.getSubmission(param);
                                AddMenu.openCommand(event, submission.uri.spec, where);
                            });
                        } else {
                            let submission = engine.getSubmission(param);
                            this.openCommand(event, submission.uri.spec, where);
                        }
                    } else {
                        PlacesUtils.keywords.fetch(keyword || '').then(entry => {
                            if (!entry) return;
                            // 文字化けの心配が…
                            let newurl = entry.url.href.replace('%s', encodeURIComponent(param));
                            this.openCommand(event, newurl, where);
                        });
                    }
                } else if (url)
                    this.openCommand(event, this.convertText(url), where);
                else if (exec)
                    this.exec(exec, this.convertText(text));
                else if (text)
                    this.copy(this.convertText(text));

                if (framescript)
                    this.execInCurrentContentWindow(framescript);
            }
            openCommand(event, url, where, postData) {
                var uri;
                const { gBrowser, openUILink, openUILinkIn } = this.win;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    return this.log(($L('url is invalid', url)));
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
                        openUILinkIn(uri.spec, 'tab');
                    } else {
                        openUILinkIn(uri.spec, 'tab', {
                            triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                                Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal()
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
            }
            convertText(text) {
                const { gContextMenu, TabContextMenu, gBrowser, document } = this.win;
                var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                    link: {
                        href: "",
                        host: ""
                    },
                    target: {
                        alt: "",
                        title: ""
                    },
                    __noSuchMethod__: function (id, args) {
                        return ""
                    },
                };
                let tab = document.popupNode || TabContextMenu ? TabContextMenu.contextTab : null;
                var bw = (tab && tab.linkedBrowser) || context.browser || gBrowser.selectedTab.linkedBrowser;

                return text.replace(this.regexp, function (str) {
                    str = str.toUpperCase().replace("%LINK", "%RLINK");
                    if (str.indexOf("_HTMLIFIED") >= 0)
                        return htmlEscape(convert(str.replace("_HTMLIFIED", "")));
                    if (str.indexOf("_HTML") >= 0)
                        return htmlEscape(convert(str.replace("_HTML", "")));
                    if (str.indexOf("_ENCODE") >= 0)
                        return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                    return convert(str);
                });

                function convert(str) {
                    switch (str) {
                        case "%T":
                            return bw.contentTitle;
                        case "%TITLE%":
                            return bw.contentTitle;
                        case "%TITLES%":
                            return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "");
                        case "%U":
                            return bw.documentURI.spec;
                        case "%URL%":
                            return bw.documentURI.spec;
                        case "%H":
                            return bw.documentURI.host;
                        case "%HOST%":
                            return bw.documentURI.host;
                        case "%S":
                            return (context.selectionInfo && context.selectionInfo.fullText) || AddMenu.getSelectedText() || "";
                        case "%SEL%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || AddMenu.getSelectedText() || "";
                        case "%L":
                            return context.linkURL || "";
                        case "%RLINK%":
                            return context.linkURL || "";
                        case "%RLINK_HOST%":
                            return context.link.host || "";
                        case "%RLINK_TEXT%":
                            return context.linkText() || "";
                        case "%RLINK_OR_URL%":
                            return context.linkURL || bw.documentURI.spec;
                        case "%RLT_OR_UT%":
                            return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                        case "%IMAGE_ALT%":
                            return context.target.alt || "";
                        case "%IMAGE_TITLE%":
                            return context.target.title || "";
                        case "%I":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_URL%":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_BASE64%":
                            return typeof context.imageURL === "undefined" ? img2base64(context.mediaURL) : img2base64(context.imageURL);
                        case "%SVG_BASE64%":
                            let url = context.linkURL || bw.documentURI.spec || "";
                            return url.endsWith("svg") ? svg2base64(url) : "";
                        case "%M":
                            return context.mediaURL || "";
                        case "%MEDIA_URL%":
                            return context.mediaURL || "";
                        case "%P":
                            return readFromClipboard() || "";
                        case "%CLIPBOARD%":
                            return readFromClipboard() || "";
                        case "%FAVICON%":
                            return gBrowser.getIcon(tab ? tab : null) || "";
                        case "%FAVICON_BASE64%":
                            return img2base64(gBrowser.getIcon(tab ? tab : null));
                        case "%EMAIL%":
                            return getEmailAddress() || "";
                        case "%EOL%":
                            return "\r\n";
                    }
                    return str;
                }

                function htmlEscape(s) {
                    return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
                }

                function getEmailAddress() {
                    var url = context.linkURL;
                    if (!url || !/^mailto:([^?]+).*/i.test(url)) return "";
                    var addresses = RegExp.$1;
                    try {
                        var characterSet = context.target.ownerDocument.characterSet;
                        const textToSubURI = Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI);
                        addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
                    } catch (ex) { }
                    return addresses;
                }

                function img2base64(imgSrc, imgType) {
                    if (typeof imgSrc == 'undefined') return "";
                    imgType = imgType || "image/png";
                    const NSURI = "http://www.w3.org/1999/xhtml";
                    var img = new Image();
                    var that = this;
                    var canvas,
                        isCompleted = false;
                    img.onload = function () {
                        var width = this.naturalWidth,
                            height = this.naturalHeight;
                        if (that.appVersion <= 72) {
                            canvas = document.createXULElementNS(NSURI, "canvas");
                        } else {
                            canvas = document.createElementNS(NSURI, "canvas")
                        }
                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(this, 0, 0);
                        isCompleted = true;
                    };
                    img.onerror = function () {
                        Cu.reportError($L('could not load', imgSrc));
                        isCompleted = true;
                    };
                    img.src = imgSrc;

                    var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                    while (!isCompleted) {
                        thread.processNextEvent(true);
                    }

                    var data = canvas ? canvas.toDataURL(imgType) : "";
                    canvas = null;
                    return data;
                }

                function svg2base64(svgSrc) {
                    if (typeof svgSrc == 'undefined') return "";
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.open("GET", svgSrc, false);
                    xmlhttp.send();
                    var svg = xmlhttp.responseText;
                    // svg string to data url
                    var svg64 = "data:image/svg+xml;base64," + btoa(svg);
                    return svg64;
                }
            }
            getSelectedText() {
                return this._selectedText;
            }
            execInCurrentContentWindow(script) {
                if (typeof script === undefined) return;
                if (typeof script === "function") {
                    script = btoa(script.toString());
                }
                let actor = this.win.gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("AddMenu");
                actor.sendAsyncMessage("AM:ExectueScript", { script: script });
            }
            exec(path, arg) {
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
                        this.error($L("file not found", path));
                        return;
                    }

                    if (file.isExecutable()) {
                        process.init(file);
                        process.runw(false, a, a.length);
                    } else {
                        file.launch();
                    }
                } catch (e) {
                    this.log(e);
                }
            }
            handleRelativePath(path) {
                if (path) {
                    path = path.replace(/\//g, '\\');
                    var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                    if (/^(\\)/.test(path)) {
                        return ffdir + path;
                    } else {
                        return path;
                    }
                }
            }
            getURLSpecFromFile(aFile) {
                var aURL;
                if (this.appVersion < 92) {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
                } else {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
                }
                return aURL;
            }
            edit(aFile, aLineNumber) {
                if (!aFile || !aFile.exists() || !aFile.isFile()) return;

                var editor;
                try {
                    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                } catch (e) { }

                if (!editor || !editor.exists()) {
                    if (useScraptchpad && this.appVersion <= 72) {
                        this.openScriptInScratchpad(window, aFile);
                        return;
                    } else {
                        alert($L('please set editor path'));
                        var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(window, $L('set global editor'), fp.modeOpen);
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
                }

                var aURL = this.getURLSpecFromFile(aFile);
                var aDocument = null;
                var aCallBack = null;
                var aPageDescriptor = null;
                this.win.gViewSourceUtils.openInExternalEditor({
                    URL: aURL,
                    lineNumber: aLineNumber
                }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
            }
            openScriptInScratchpad(parentWindow, file) {
                let spWin = this.win.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
                spWin.top.moveTo(0, 0);
                spWin.top.resizeTo(screen.availWidth, screen.availHeight);

                spWin.addEventListener("load", function spWinLoaded() {
                    spWin.removeEventListener("load", spWinLoaded, false);

                    let Scratchpad = spWin.Scratchpad;
                    Scratchpad.setFilename(file.path);
                    Scratchpad.addObserver({
                        onReady: function () {
                            Scratchpad.removeObserver(this);
                            Scratchpad.importFromFile.call(Scratchpad, file);
                        }
                    });
                }, false);
            }
            copy(aText) {
                Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
                //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
            }
            copyLink(copyURL, copyLabel) {
                // generate the Unicode and HTML versions of the Link
                var textUnicode = copyURL;
                var textHtml = ("<a href=\"" + copyURL + "\">" + copyLabel + "</a>");

                // make a copy of the Unicode
                var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                if (!str) return false; // couldn't get string obj
                str.data = textUnicode; // unicode string?

                // make a copy of the HTML
                var htmlstring = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                if (!htmlstring) return false; // couldn't get string obj
                htmlstring.data = textHtml;

                // add Unicode & HTML flavors to the transferable widget
                var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                if (!trans) return false; //no transferable widget found

                trans.addDataFlavor("text/unicode");
                trans.setTransferData("text/unicode", str, textUnicode.length * 2); // *2 because it's unicode

                trans.addDataFlavor("text/html");
                trans.setTransferData("text/html", htmlstring, textHtml.length * 2); // *2 because it's unicode

                // copy the transferable widget!
                var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
                if (!clipboard) return false; // couldn't get the clipboard

                clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
                return true;
            }
            alert(aMsg, aTitle, aCallback) {
                var callback = aCallback ? {
                    observe: function (subject, topic, data) {
                        if ("alertclickcallback" != topic)
                            return;
                        aCallback.call(null);
                    }
                } : null;
                var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
                alertsService.showAlertNotification(
                    this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "addMenuPlus",
                    aMsg + "", !!callback, "", callback);
            }
        }

        this.AddMenuParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                switch (name) {
                    case "AM:OpenLink":
                        var obj = Object.assign({
                            event: {
                                target: this
                            },
                            referer: this.win.gBrowser.currentURI.spec,
                            url: null,
                            where: "tab",
                            postData: null,
                        }, data);
                        AddMenu.openCommand(obj.event, obj.url, obj.where, obj.postData);
                        break;
                    case "AM:SaveImageURL":
                        var obj = Object.assign({
                            url: null,
                        }, data);
                        if (obj.url)
                            AddMenu.win.saveURL(obj.url, null, obj.filename, null, false,
                                true,
                                null,
                                null,
                                null,
                                PrivateBrowsingUtils.isWindowPrivate(AddMenu.win),
                                Services.scriptSecurityManager.createNullPrincipal({}));
                        break;
                    case "AM:SeletedText":
                        AddMenu._selectedText = data.text;
                        break;
                }
            }
        }
    } else {
        this.EXPORTED_SYMBOLS = ["AddMenuChild"];

        this.AddMenuChild = class extends JSWindowActorChild {
            actorCreated() {

            }
            receiveMessage({ name, data }) {
                const win = this.contentWindow;
                const console = win.console;
                const doc = win.document;
                const actor = win.windowGlobalChild.getActor("AddMenu");
                switch (name) {
                    case "AM:GetSelectedText":
                        let obj = {
                            text: BrowserOrSelectionUtils.getSelectionDetails(win).fullText
                        }

                        actor.sendAsyncMessage("AM:SeletedText", obj);
                        break;
                    case "AM:ExectueScript":
                        if (data && data.script) {
                            eval('(' + decodeURIComponent(atob(data.script)) + ').call(this, doc, win, actor)');
                        }
                        break;
                }
            }
        }
    }

    function $(id, doc) {
        return doc.getElementById(id);
    }

    function $$(exp, doc) {
        return Array.prototype.slice.call(doc.querySelectorAll(exp));
    }

    function $AC(args) {
        return Array.prototype.slice.call(args);
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

    function $L() {
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = ADDMENU_LANG[ADDMENU_LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace("%s", arguments[i]);
            }
            return str;
        } else return "";
    }


    function addStyle(css, doc) {
        var pi = doc.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return doc.insertBefore(pi, doc.documentElement);
    }

    function loadText(aFile) {
        var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(aFile, -1, 0, 0);
        sstream.init(fstream);

        var data = sstream.read(sstream.available());
        try {
            data = decodeURIComponent(escape(data));
        } catch (e) { }
        sstream.close();
        fstream.close();
        return data;
    }

    function isDef(v) {
        return v !== undefined && v !== null
    }

    function isPromise(val) {
        return (
            isDef(val) &&
            typeof val.then === 'function' &&
            typeof val.catch === 'function'
        )
    }
} else {
    try {
        if (parseInt(Services.appinfo.version) < 101) {
            window.addMenu = ChromeUtils.import(Components.stack.filename).AddMenu;
            window.addMenu.init(window);
        } else {
            const fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            const scriptFile = fileHandler.getFileFromURLSpec(Components.stack.filename);
            const resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
            if (!resourceHandler.hasSubstitution("addmenu-ucjs")) {
                resourceHandler.setSubstitution("addmenu-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            window.addMenu = ChromeUtils.import(`resource://addmenu-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`).AddMenu;
            window.addMenu.init(window);
        }
    } catch (e) { console.error(e); }
}