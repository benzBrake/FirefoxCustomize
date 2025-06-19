// ==UserScript==
// @name           addMenuPlus.uc.mjs
// @long-description
// @description
/*
通过配置文件增加修改菜单，修改版

此版本仅能通过我改过的 userChrome.js 引导：https://github.com/benzBrake/userChrome.js-Loader/blob/main/profile/chrome/userChrome.js，其他 UC 环境需要修改 resolveChromeURL 函数
*/
// @version        0.3.0
// @author         Ryan, ywzhaiqi, Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 136
// @charset        UTF-8
// @require        https://github.com/benzBrake/FirefoxCustomize/raw/refs/heads/master/userChromeJS/000-$.sys.mjs
// @require        https://github.com/benzBrake/FirefoxCustomize/raw/refs/heads/master/userChromeJS/000-syncify.sys.mjs
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @downloadURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus/addMenuPlus.uc.mjs
// @reviewURL      https://bbs.kafan.cn/thread-2246475-1-1.html
// @note           0.3.0 ESMifying
// ==/UserScript==
import { $, $$ } from "./000-$.sys.mjs";
import { syncify } from "./000-syncify.sys.mjs";
(async (css, getURLSpecFromFile, loadText, versionGE, shouldSetIcon, isDef) => {
    if (typeof window === 'undefined') return;

    const enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
    const onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
    const enableidentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单
    const enableContentAreaContextMenuCompact = false; // Photon 界面下右键菜单兼容开关（网页右键隐藏非纯图标菜单的图标，Firefox 版本号小于90无效）
    const enableConvertImageAttrToListStyleImage = false; // 将图片属性转换为 css 属性 list-style-image 
    const enableConvertHiddenStyleToAttribue = false; // 将隐藏元素的样式转换为属性

    /** 不要修改以下代码 DON'T MODIFY THE CODE BELOW */
    const { windowUtils } = globalThis;
    const runJS = (code, sandbox = window) => {
        try {
            Services.scriptloader.loadSubScript("data:application/javascript;," + encodeURIComponent(code), sandbox);
        } catch (e) {
            console.error(e);
        }
    }

    window?.addMenu?.destroy();

    const ADDMENU_LANG = {
        'zh-CN': {
            'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件' +
                '\n\n' +
                'tab({\n    label: "addMenuPlus 配置",\n    oncommand: function(){ addMenu.edit(addMenu.FILE); }\n});',
            'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
            'addmenuplus btn tooltip': 'addMenuPlus 自定义菜单',
            'modify menu config': '修改菜单',
            'reload config': '重新载入配置',
            'custom showing method error': 'addMenuPlus 自定义显示错误',
            'url is invalid': 'URL 不正确: %s',
            'config file': '配置文件',
            'not exists': ' 不存在',
            'check config file with line': '\n请重新检查配置文件第 %s 行',
            'file not found': '文件不存在: %s',
            'config file not exists': '配置文件不存在: %s',
            'config has reload': '配置已经重新载入',
            'configuration file does not exist or is not a valid file': '配置文件不存在或不是文件: %s',
            'please set editor path': '请先设置编辑器的路径!!!',
            'set global editor': '设置全局脚本编辑器',
            'editor not set': '脚本编辑器未设置, 无法继续!!!',
            'could not load': '无法载入：%s',
            'error occurred while editing the file': '编辑文件时出错: %s',
            'process command error': '执行命令错误，原因%s',
            'open chrome folder': '打开 Chrome 文件夹',
        },
        'en-US': {
            'config example': '// This is an addMenuPlus configuration file.\n' +
                '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                '\n\n' +
                'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: function(){ addMenu.edit(addMenu.FILE); }\n});',
            'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
            'addmenuplus btn tooltip': 'addMenuPlus custom menu',
            'modify menu config': 'Modify Menu',
            'reload config': 'Reload Configuration',
            'custom showing method error': 'addMenuPlus customize popupshow error',
            'url is invalid': 'URL is invalid: %s',
            'config file': 'Configuration file',
            'not exists': ' not exists',
            'check config file with line': '\nPlease recheck line %s of the configuration file',
            'file not found': 'File not found: %s',
            'config file not exists': 'config file not exists: %s',
            'config has reload': 'The configuration has been reloaded',
            'configuration file does not exist or is not a valid file': 'Configuration file does not exist or is not a valid file %s',
            'please set editor path': 'Please set the path to the editor first!!!',
            'set global editor': 'Setting up the global script editor',
            'editor not set': 'The script editor is not set, cannot continue!!!',
            'could not load': 'Could not load：%s',
            'error occurred while editing the file': 'Error occurred while editing the file: %s',
            'process command error': 'process command error, resson: %s',
            'open chrome folder': 'Open Chrome folder',
        },
    }

    // 读取语言代码
    let _locale;
    try {
        const osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
        const _locales = typeof osPrefs.getRegionalPrefsLocales === "function"
            ? osPrefs.getRegionalPrefsLocales()
            : osPrefs.regionalPrefsLocales;

        _locale = _locales.find(locale => ADDMENU_LANG.hasOwnProperty(locale));
    } catch (e) { }

    const ADDMENU_LOCALE = _locale || "en-US";

    // 增加菜单类型请在这里加入插入点，不能是 IdentGroup
    const MENU_ATTRS = {
        tab: {
            insRef: $("#context_closeTab"),
            current: "tab",
            submenu: "TabMenu",
            groupmenu: "TabGroup",
        },
        page: {
            insRef: $("#context-viewsource"),
            current: "page",
            submenu: "PageMenu",
            groupmenu: "PageGroup",
        },
        tool: {
            insRef: $("#prefSep, #webDeveloperMenu"),
            current: "tool",
            submenu: "ToolMenu",
            groupmenu: "ToolGroup",
        },
        app: {
            insRef: $("#appmenu-quit, #appMenu-quit-button, #appMenu-quit-button2, #menu_FileQuitItem"),
            current: "app",
            submenu: "AppMenu",
            groupmenu: "AppGroup",
        },
        nav: {
            insRef: $("#toolbar-context-undoCloseTab, #toolbarItemsMenuSeparator"),
            current: "nav",
            submenu: "NavMenu",
            groupmenu: "NavGroup",
        },
        group: {
            current: "group",
            groupmenu: "GroupMenu",
            insertId: "addMenu-page-insertpoint",
        },
        btn: {
            current: "btn",
            submenu: "BtnMenu",
            groupmenu: "BtnGroup",
            insertId: "addMenu-btn-insertpoint",
        },
        mod: {
            current: "mod"
        },
    };

    window.addMenu = {
        get FILE () {
            let path;
            try {
                // addMenu.FILE_PATH があればそれを使う
                path = Services.prefs.getStringPref("addMenu.FILE_PATH")
            } catch (e) {
                path = '_addmenu.js';
            }

            const aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);

            this._modifiedTime = aFile.lastModifiedTime;
            delete this.FILE;
            return this.FILE = aFile;
        },
        get platform () {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        get locale () {
            delete this.locale;
            return this.locale = ADDMENU_LOCALE || "en-US";
        },
        get panelId () {
            delete this.panelId;
            return this.panelId = Math.floor(Math.random() * 900000 + 99999);
        },
        get onshowinglabelMaxLength () {
            delete this.onshowinglabelMaxLength;
            return this.onshowinglabelMaxLength = onshowinglabelMaxLength;
        },
        ContextMenu: {
            onSvg: false,
            svgHTML: "",
            onInput: false,
            inputValue: "",
            inputHTML: "",
            onTextarea: false,
            textareaValue: "",
            textareaHTML: "",
            onElement: false,
            elementHTML: ""
        },
        customShowings: [],
        undoFunctions: [],
        init: async function () {
            await this.ensureConfigFileExists();
            try {
                // 注册 Actor
                const esModuleURI = resolveChromeURL(Components.stack.filename);
                ChromeUtils.registerWindowActor("AddMenu", {
                    parent: {
                        esModuleURI
                    },
                    child: {
                        esModuleURI,
                        events: {
                            contextmenu: {
                                capture: true,
                            }
                        }
                    },
                    allFrames: true,
                });
            } catch (ex) { }

            this.initRegex();
            this.initButton();

            // add menuitem insertpoint
            for (let type in MENU_ATTRS) {
                let ins = MENU_ATTRS[type].insRef;
                if (ins) {
                    let tag = ins.matches("menu, menuitem, menuseparator") ? "menuseparator" : "toolbarseparator";
                    let insertPoint = $C(tag, {
                        id: `addMenu-${type}-insertpoint`,
                        class: "addMenu-insert-point",
                        hidden: true
                    })
                    MENU_ATTRS[type].insertId = insertPoint.id;
                    ins.before(insertPoint);
                    delete MENU_ATTRS[type].insRef;
                } else if (!["btn", "mod"].includes(type)) {
                    delete MENU_ATTRS[type];
                }
            }

            this.identityBox = $('#identity-icon, #identity-box')
            if (enableidentityBoxContextMenu && this.identityBox) {
                // SSL 小锁右键菜单
                this.identityBox.on("click", this, false);
                this.identityBox.attr('contextmenu', false);
                $("#mainPopupSet").append($C('menupopup', {
                    id: 'identity-box-contextmenu'
                }));
                $("#identity-box-contextmenu").append($C("menuseparator", {
                    id: "addMenu-identity-insertpoint",
                    class: "addMenu-insert-point",
                    hidden: true
                }));
                MENU_ATTRS['ident'] = {
                    current: "ident",
                    submenu: "IdentMenu",
                    groupmenu: "IdentGroup",
                    insertId: 'addMenu-identity-insertpoint'
                }
            }

            // Photon Compact
            if (enableContentAreaContextMenuCompact && versionGE("90a1")) {
                $("#contentAreaContextMenu").attr("photoncompact", "true");
                $("#tabContextMenu").attr("photoncompact", "true");
            }

            // 绑定事件
            $("#contentAreaContextMenu").on("popupshowing", this, false);
            $("#contentAreaContextMenu").on("popuphiding", this, false);
            $("#tabContextMenu").on("popupshowing", this, false);
            $("#toolbar-context-menu").on("popupshowing", this, false);
            $("#menu_FilePopup").on("popupshowing", this, false);
            $("#menu_ToolsPopup").on("popupshowing", this, false);
            // 响应鼠标键事件（eg：获取选中文本）
            gBrowser.tabpanels.addEventListener("mousedown", this);
            gBrowser.tabpanels.addEventListener("mouseup", this);
            // 响应标签修改事件
            gBrowser.tabContainer.addEventListener('TabAttrModified', this);
            // move menuitems to Hamburger menu when firstly clicks the PanelUI button 
            PanelUI.mainView.addEventListener("ViewShowing", this.moveToAppMenu, {
                once: true
            });
            // PanelUI 增加 CustomShowing 支持
            PanelUI.mainView.addEventListener("ViewShowing", this);
            this.APP_LITENER_REMOVER = function () {
                PanelUI.mainView.removeEventListener("ViewShowing", this);
            }

            // 增加样式
            this.style = addStyle(css);

            await this.rebuild();
        },
        ensureConfigFileExists: async function () {
            const aFile = this.FILE;
            if (!aFile.exists()) {
                await IOUtils.writeUTF8(aFile.path, lprintf('config example'))
                alert(lprintf('example is empty'));
                addMenu.openCommand({
                    target: this
                }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
            }
        },
        initRegex: function () {
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
            let rSEL_OR_LT = "%(?:SEL_OR_LINK_TEXT|SEL_OR_LT)" + he + "%|%sl\\b"; // 选中文本或者链接文本

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
            this.rSEL_OR_LT = new RegExp(rSEL_OR_LT, "i");

            this.regexp = new RegExp(
                [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rIMAGE, rIMAGE_BASE64, rMEDIA, rSVG_BASE64, rCLIPBOARD, rFAVICON, rFAVICON_BASE64, rEMAIL, rExt, rRLT_OR_UT, rSEL_OR_LT].join("|"), "ig");

        },
        initButton: function () {
            try {
                CustomizableUI.createWidget({
                    id: "addMenu-button",
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    type: "custom",
                    onBuild: function (doc) {
                        const button = $C('toolbarbutton', {
                            id: 'addMenu-button',
                            label: 'addMenuPlus',
                            image: 'chrome://devtools/skin/images/browsers/firefox.svg',
                            type: 'menu',
                            class: 'toolbarbutton-1 chromeclass-toolbar-additional'
                        }, doc);
                        const menupopup = $C('menupopup', {
                            id: 'addMenu-button-popup'
                        }, doc);
                        button.appendChild(menupopup);
                        [
                            ['menugroup', (() => {
                                const group = $C('menugroup', {
                                    class: 'addMenu addMenuNot showText',
                                    id: 'addMenu-config-group'
                                }, doc);
                                const item1 = $C('menuitem', {
                                    id: 'addMenu-modify-config',
                                    class: 'menuitem-iconic addMenu addMenuNot edit',
                                    label: lprintf('modify menu config'),
                                    oncommand: async () => {
                                        let editor = await addMenu.getOrSetEditorPath();
                                        if (!editor) {
                                            addMenu.alert(lprintf('editor not set'));
                                            return;
                                        }
                                        const regex = /include\("([^"]+)"\)/gm;
                                        let paths = [addMenu.FILE.path];
                                        let text = await IOUtils.readUTF8(addMenu.FILE.path), m;
                                        while (m = regex.exec(text)) {
                                            if (m.index === regex.lastIndex) {
                                                regex.lastIndex++;
                                            }
                                            let path = m[1];
                                            if (!path.startsWith("\\")) {
                                                path = "\\" + path;
                                            }
                                            paths.push(addMenu.handleRelativePath(path, addMenu.FILE.parent.path));
                                        }
                                        paths.forEach(p => {
                                            setTimeout(async () => {
                                                addMenu.edit(await IOUtils.getFile(p));
                                            }, 10);
                                        });
                                    }
                                }, doc);
                                const item2 = $C('menuitem', {
                                    id: 'addMenu-reload-config',
                                    class: 'addMenu addMenuNot menuitem-iconic sync',
                                    label: lprintf('reload config'),
                                    oncommand: () => setTimeout(async () => await addMenu.rebuild(true), 10)
                                }, doc);
                                group.appendChild(item1);
                                group.appendChild(item2);
                                return group;
                            })()],
                            ['menuseparator', {
                                id: 'addMenu-btn-insertpoint',
                                class: 'addMenu-insert-point',
                                hidden: true
                            }],
                            ['menuseparator', {}],
                            ['menuitem', {
                                id: 'addMenu-quit-browser',
                                class: 'menuitem-iconic addMenu addMenuNot quit',
                                'data-l10n-id': 'menu-quit',
                                key: 'key_quitApplication',
                                oncommand: (event) => goQuitApplication(event)
                            }]
                        ].forEach(obj => {
                            let type = obj[0];
                            let item;
                            let attrs = obj[1];
                            if (attrs.nodeName) {
                                item = menupopup.appendChild(attrs);
                            } else {
                                item = $C(type, attrs, doc);
                            }
                            menupopup.appendChild(item);
                        });
                        return button;
                    }
                });
            } catch (e) {
                console.error(e);
            }
            this.BTN = CustomizableUI.getWidget("addMenu-button").forWindow(window)?.node;
        },
        destroy: function () {
            $("#contentAreaContextMenu").off("popupshowing", this, false);
            $("#contentAreaContextMenu").off("popuphiding", this, false);
            $("#tabContextMenu").off("popupshowing", this, false);
            $("#toolbar-context-menu").off("popupshowing", this, false);
            $("#menu_FilePopup").off("popupshowing", this, false);
            $("#menu_ToolsPopup").off("popupshowing", this, false);
            $("#contentAreaContextMenu").removeAttr("photoncompact");
            $("#tabContextMenu").removeAttr("photoncompact");
            if (typeof this.APP_LITENER_REMOVER === "function")
                this.APP_LITENER_REMOVER();
            gBrowser.tabpanels.removeEventListener("mouseup", this);
            gBrowser.tabpanels.removeEventListener("mousedown", this);
            gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
            this.undoMods();
            this.removeMenuitem();
            $$('#addMenu-rebuild, .addMenu-insert-point').remove();
            if (this.BTN) {
                CustomizableUI.destroyWidget("addMenu-button");
            }
            this.identityBox?.removeAttr('contextmenu').off("click", this, false);
            $('#identity-box-contextmenu')?.remove();
            this.style?.destroy();
            this.style2?.destroy();
            delete window.addMenu;
        },
        getActor: function (browser = gBrowser.selectedBrowser, name = "AddMenu") {
            return browser.browsingContext.currentWindowGlobal.getActor(name);
        },
        sendAsyncMessage: function (key, data = {}, browser = gBrowser.selectedBrowser) {
            return this.getActor(browser).sendAsyncMessage(key, data);
        },
        handleEvent: async function (event) {
            const { type, target, button } = event;
            const $target = $(event.target);
            const $currentTarget = $(event.currentTarget);

            switch (type) {
                case "ViewShowing":
                case "popupshowing":
                    if (target !== event.currentTarget) return;

                    // File refreshing logic
                    if (enableFileRefreshing) {
                        await this.updateModifiedFile();
                    }

                    // Process all .addMenu elements
                    $$('.addMenu[onshowinglabel]', $target.get()).forEach($menu => {
                        $menu.removeAttr("hidden");
                        const showingLabel = $menu.attr('onshowinglabel');
                        if (showingLabel) {
                            let maxLength = onshowinglabelMaxLength || 15;
                            let sel = addMenu.convertText(showingLabel);
                            if (sel.length > maxLength) sel = sel.substr(0, maxLength) + "...";
                            $menu.attr('label', sel);
                        }
                    });

                    // Determine insert point based on menu type
                    let insertPoint = "";
                    const menuHandlers = {
                        'contentAreaContextMenu': () => {
                            const state = [];
                            const { gContextMenu } = window;

                            if (gContextMenu.onTextInput) state.push("input");
                            if (gContextMenu.isContentSelected || gContextMenu.isTextSelected) state.push("select");
                            if (gContextMenu.onLink || !$('#context-openlinkincurrent').attr('hidden')) {
                                state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                            }
                            if (gContextMenu.onCanvas) state.push("canvas image");
                            if (gContextMenu.onImage) state.push("image");
                            if (/\.(?:jpe?g|png|gif|bmp|webp|svg|ico|jxl)$/i.test(gContextMenu.browser.currentURI.spec)) {
                                state.push("completed-image");
                            }
                            if (gContextMenu.onVideo || gContextMenu.onAudio) state.push("media");
                            if (addMenu.ContextMenu.onSvg) state.push("svg");

                            $currentTarget.attr("addMenu", state.join(" "));
                            return "addMenu-page-insertpoint";
                        },
                        'toolbar-context-menu': () => {
                            const triggerNode = event.target.triggerNode;
                            const state = [];
                            const toolbarMap = {
                                'toolbar-menubar': 'menubar',
                                'TabsToolbar': 'tabs',
                                'nav-bar': 'navbar',
                                'PersonalToolbar': 'personal'
                            };

                            Object.entries(toolbarMap).forEach(([id, value]) => {
                                if ($('#' + id).get().contains(triggerNode)) state.push(value);
                            });

                            if (triggerNode?.localName === "toolbarbutton") {
                                state.push("button");
                            }

                            $currentTarget.attr("addMenu", state.join(" "));
                            return "addMenu-nav-insertpoint";
                        },
                        'tabContextMenu': () => {
                            triggerFavMsg(TabContextMenu.contextTab);
                            return "`addMenu-tab-insertpoint`";
                        },
                        'identity-box-contextmenu': () => "addMenu-identity-insertpoint",
                        'menu_FilePopup': () => "addMenu-app-insertpoint",
                        'appMenu-protonMainView': () => "addMenu-app-insertpoint",
                        'menu_ToolsPopup': () => "addMenu-tool-insertpoint"
                    };

                    insertPoint = menuHandlers[$target.attr('id')]?.() || "";

                    const ev = obj => {
                        try {
                            obj.fn ? obj.fn.call(obj.item, obj.item) : runJS('(' + obj.fnSource + ').call(obj.item, obj.item)', {
                                obj
                            });
                        } catch (ex) {
                            console.error(lprintf('custom showing method error'), obj.fnSource, ex);
                        }
                    }

                    // Execute custom showing methods with runJS
                    this.customShowings
                        .filter(obj => obj.insertPoint === insertPoint)
                        .forEach(obj => ev(obj));

                    this.customShowings
                        .filter(obj => obj.insertPoint === "addMenu-all-insertpoint")
                        .forEach(obj => ev(obj));

                    // Delayed DOM updates
                    setTimeout(() => {
                        $$('menuitem.addMenu[command], menu.addMenu[command]', $target.get()).forEach($elem => {
                            if (/^menugroup$/i.test($elem.parent().get().nodeName)) return;

                            const $original = $('#' + $elem.attr('command'));
                            if ($original.get()) {
                                $elem.attr('hidden', $original.attr('hidden') || "false")
                                    .attr('collapsed', $original.attr('collapsed') || "false")
                                    .attr('disabled', $original.attr('disabled') || "false");
                            }
                        });

                        $$('menugroup.addMenu', $target.get()).forEach($group => {
                            $group.children().forEach($elem => {
                                if ((/menu$/i.test($elem.get().nodeName) || /menuitem$/i.test($elem.get().nodeName)) &&
                                    $elem.hasAttr('command')) {
                                    $elem.removeAttr('hidden');
                                    const $original = $('#' + $elem.attr('command'));
                                    if ($original.get()) {
                                        $elem.attr('disabled', $original.attr('hidden'));
                                    }
                                }
                            });
                        });

                        if (enableConvertHiddenStyleToAttribue) {
                            $$('menuitem.addMenu, menu.addMenu, menugroup.addMenu').forEach($elem => {
                                if (!isVisible($elem)) {
                                    $elem.attr('hidden', true);
                                }
                            });

                            function isVisible ($elem) {
                                let style = getComputedStyle($elem.get());
                                return style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse";
                            }
                        }
                    }, 10);
                    break;
                case 'popuphiding':
                    if ($target.attr('id') === "contentAreaContextMenu") {
                        $$('.addMenu[hidden]', $target.get()).forEach($elem => {
                            $elem.removeAttr('hidden');
                        });
                        Object.keys(this.ContextMenu).forEach(key => {
                            this.ContextMenu[key] = key.startsWith("on") ? false : "";
                        });
                        $target.attr("addMenu", "");
                    }
                    break;

                case 'click':
                    if (button === 2 && $target.closest('#identity-box')) {
                        $("#identity-box-contextmenu").openPopup(target, "after_pointer", 0, 0, true, false);
                    }
                    break;
                case 'mousedown': {
                    Object.keys(this.ContextMenu).forEach(key => {
                        this.ContextMenu[key] = key.startsWith("on") ? false : "";
                    });
                }
                case 'mouseup':
                    if (button === 0) {
                        this.sendAsyncMessage("AddMenuPlus:GetSelectedText");
                    }
                    break;

                case 'TabAttrModified':
                    triggerFavMsg(target);
                    break;
            }

            function triggerFavMsg (tab) {
                if (content || !tab) return;

                const browser = gBrowser.getBrowserForTab(tab);
                const URI = browser.currentURI || browser.documentURI;
                if (!URI) return;

                const hash = calculateHashFromStr(URI.spec);
                tab.faviconHash = hash;
                addMenu.sendAsyncMessage("AddMenuPlus:GetFaviconLink", { hash });
            }

            function calculateHashFromStr (data) {
                const gCryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
                gCryptoHash.init(gCryptoHash.MD5);
                gCryptoHash.update(
                    data.split("").map(c => c.charCodeAt(0)),
                    data.length
                );
                return gCryptoHash.finish(true);
            }
        },
        executeInContent: function (browser = gBrowser.selectedBrowser, func) {
            try {
                this.sendAsyncMessage("AddMenuPlus:ExecuteInContent", { script: func.toString() }, browser);
                return true;
            } catch (ex) {
                console.error("Error in executeInContent : ", ex);
            }
            return false;
        },
        executeInChrome: function (func, args = []) {
            try {
                const functionObj = new Function(
                    func.match(/\((.*)\)\s*\{/)[1],
                    func.replace(/^function\s*.*\s*\(.*\)\s*\{/, '').replace(/}$/, '')
                );
                functionObj.apply(window, args);
            } catch (ex) {
                console.error("Error in executeInChrome : ", ex);
            }
        },
        updateModifiedFile: async function () {
            if (!this.FILE.exists()) return;

            if (this._modifiedTime != this.FILE.lastModifiedTime) {
                this._modifiedTime = this.FILE.lastModifiedTime;
                await addMenu.rebuild(true);
            }
        },
        onCommand: async function (event) {
            try {
                const menuitem = event.target;
                const text = menuitem.getAttribute("text") || "";
                const keyword = menuitem.getAttribute("keyword") || "";
                const url = menuitem.getAttribute("url") || "";
                const where = menuitem.getAttribute("where") || "";
                const exec = menuitem.getAttribute("exec") || "";
                const edit = menuitem.getAttribute("edit") || "";

                if (keyword) {
                    const param = text ? this.convertText(text) : "";
                    const engine = keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(keyword);
                    if (engine) {
                        const resolvedEngine = await engine;
                        const submission = resolvedEngine.getSubmission(param);
                        addMenu.openCommand(event, submission.uri.spec, where);
                    } else {
                        const entry = await PlacesUtils.keywords.fetch(keyword || '');
                        if (entry) {
                            const newurl = entry.url.href.replace('%s', encodeURIComponent(param));
                            this.openCommand(event, newurl, where);
                        }
                    }
                } else if (url) {
                    this.openCommand(event, this.convertText(url), where);
                } else if (exec) {
                    this.exec(exec, this.convertText(text));
                } else if (edit) {
                    let file = await IOUtils.getFile(edit);
                    this.edit(file);
                } else if (text) {
                    this.copy(this.convertText(text));
                }
            } catch (error) {
                console.error(lprintf("process command error", error.message), error);
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
        exec: function (path, arg, options = { blocking: false, startHidden: false }) {
            let file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            let process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            if (options.startHidden) process.startHidden = true;
            let result = { success: false, error: null };

            // 规范化路径函数
            function normalizePath (path) {
                if (AppConstants.platform === "win") {
                    path = path.replace(/\//g, '\\');
                } else {
                    path = path.replace(/\\/g, '/');
                }
                return path;
            }

            try {
                // 规范化路径
                let normalizedPath = normalizePath(path);
                file.initWithPath(normalizedPath);

                // 检查文件是否存在
                if (!file.exists()) {
                    result.error = new Error(`File not found: ${normalizedPath}`);
                    console.error(result.error);
                    return result;
                }

                // 处理参数
                let argsArray = [];
                if (typeof arg === "undefined") {
                    argsArray = [];
                } else if (typeof arg === 'string' || arg instanceof String) {
                    if (arg.trim() === "") {
                        argsArray = [];
                    } else {
                        argsArray = arg.split(/\s+/);
                    }
                } else if (Array.isArray(arg)) {
                    argsArray = arg.filter(item => typeof item === 'string'); // 过滤非字符串参数
                } else {
                    argsArray = [String(arg)];
                }

                // 检查文件类型和权限
                if (!file.isDirectory() && file.isExecutable()) {
                    process.init(file);
                    process.runw(options.blocking, argsArray, argsArray.length);
                    result.success = true;
                } else {
                    file.launch();
                    result.success = true;
                }

            } catch (e) {
                result.error = e;
                console.error(`Execution failed: ${e}`);
            }
            return result;
        },
        handleRelativePath: function (path, parentPath) {
            if (path) {
                var ffdir = parentPath ? parentPath : Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
                // windows 的目录分隔符不一样
                if (this.platform === "win") {
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
        },
        moveToAppMenu: async function (_e) {
            let ins = $('#addMenu-app-insertpoint');
            if (ins && ins.localName === 'menuseparator') {
                ins.remove();
                ins = $C('toolbarseparator', {
                    'id': 'addMenu-app-insertpoint',
                    class: "addMenu-insert-point",
                    hidden: true
                });
                $("#appMenu-quit-button2").before(ins);
                addMenu.rebuild();
            }
        },
        rebuild: async function (isAlert) {
            const aFile = this.FILE;
            if (!aFile || !aFile.exists() || !aFile.isFile()) {
                console.log(lprintf("config file not exists", aFile ? aFile.path : "null"));
                return;
            }

            const data = loadText(aFile.path);

            const sandbox = new Cu.Sandbox(new XPCNativeWrapper(window), {
                sandboxPrototype: window,
                sameZoneAs: window,
            });

            sandbox.locale = this.locale;

            var includeSrc = "";
            sandbox.include = function (aLeafName) {
                var file = addMenu.FILE.parent.clone();
                file.appendRelativePath(aLeafName);
                var data = loadText(file.path);
                if (data)
                    includeSrc += data + "\n";
            };
            sandbox._css = [];

            Object.values(MENU_ATTRS).forEach(function ({
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
                if (isDef(submenu)) {
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
                }
                if (isDef(groupmenu)) {
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
                }
            }, this);

            function ps (item, array) {
                ("join" in item && "unshift" in item) ? [].push.apply(array, item) :
                    array.push(item);
            }

            try {
                var lineFinder = new Error();
                Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\n" + data, sandbox, "1.8");
                Cu.evalInSandbox(includeSrc, sandbox, "1.8");
            } catch (e) {
                let line = e.lineNumber - lineFinder.lineNumber - 1;
                this.alert(e + lprintf("check config file with line", line), null, function () {
                    addMenu.edit(addMenu.FILE, line);
                });
                return console.log(e);
            }
            this.style2?.destroy();
            if (sandbox._css.length)
                this.style2 = addStyle(`@namespace xul url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")\n@namespace html url("http://www.w3.org/1999/xhtml");\n${sandbox._css.join('\n')}`, 'AGENT_SHEET');

            this.undoMods();
            this.removeMenuitem();
            this.customShowings = [];

            Object.values(MENU_ATTRS).forEach(function ({
                current,
                submenu,
                groupmenu,
                insertId
            }) {
                if (current === "mod") {
                    sandbox["_" + current].forEach((obj) => {
                        this.modMenuitem(obj);
                    });
                } else {
                    if (!sandbox["_" + current] || sandbox["_" + current].length == 0) return;

                    if (current === "btn") {
                        this.createMenuitem(sandbox["_" + current], $("#addMenu-btn-insertpoint", this.BTN), this.BTN.ownerDocument || document);
                    } else {
                        let insertPoint = $(insertId);
                        this.createMenuitem(sandbox["_" + current], insertPoint);
                    }

                }
            }, this);

            if (isAlert) this.alert((lprintf('config has reload')));
        },
        newGroupMenu: function (menuObj, opt = {}, doc = document) {
            var group = $C('menugroup', {}, doc);

            // 增加 onshowing 事件
            processOnShowing.call(this, group, menuObj, opt.insertPoint);

            // 绑定事件
            addEventListeners(group, menuObj);

            // 设置属性
            setAttributes(group, menuObj, ["_items", "_group"])

            let cls = group.classList;
            cls.add('addMenu');

            // 表示 / 非表示の設定
            this.setCondition(group, menuObj, opt);
            // Sync condition attribute to child menus
            menuObj._items.forEach(function (obj) {
                if (!Object.keys(obj).includes("condition")) {
                    obj.condition = group.getAttribute("condition");
                }
            });

            menuObj._items.forEach(function (obj) {
                group.appendChild(this.newMenuitem(obj, {
                    isMenuGroup: true
                }, doc));
            }, this);
            return group;
        },
        newMenu: function (menuObj, opt = {}, doc = document) {
            if (menuObj._group) {
                return this.newGroupMenu(menuObj, opt, doc);
            }
            var isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                menuitemType = isAppMenu ? "toolbarbutton" : "menu",
                menu = $C(menuitemType),
                popup,
                panelId;

            // fix for appmenu
            const viewCache = ($('appMenu-viewCache') && $('appMenu-viewCache').content) || $('appMenu-multiView');
            if (isAppMenu && viewCache) {
                menu.setAttribute('closemenu', "none");
                panelId = menuObj.id ? menuObj.id + "-panel" : "addMenu-panel-" + this.panelId++;
                popup = viewCache.appendChild($C('panelview', {
                    'id': panelId,
                    'class': 'addMenu PanelUI-subView'
                }));
                popup = popup.appendChild($C('vbox', {
                    class: 'panel-subview-body',
                    panelId: panelId
                }));
            } else {
                popup = menu.appendChild($C("menupopup", {}, doc));
            }

            // 增加 onshowing 事件
            processOnShowing.call(this, menu, menuObj, opt.insertPoint);

            // 绑定事件
            addEventListeners(menu, menuObj);

            // 设置属性
            setAttributes(menu, menuObj, ["_items"]);

            let cls = menu.classList;
            cls.add("addMenu");
            if (isAppMenu) {
                cls.add("subviewbutton");
                cls.add("subviewbutton-nav");
            } else {
                cls.add("menu-iconic");
            }

            // 表示 / 非表示の設定
            this.setCondition(menu, menuObj, opt);

            menuObj._items.forEach(function (obj) {
                popup.appendChild(this.newMenuitem(obj, opt, doc));
            }, this);

            // menu に label が無い場合、最初の menuitem の label 等を持ってくる
            // menu 部分をクリックで実行できるようにする(splitmenu みたいな感じ)
            if (isAppMenu) {
                menu.addEventListener('command', function () { PanelUI.showSubView(`${panelId}`, this) });
            } else if (!menu.hasAttribute('label')) {
                let firstItem = menu.querySelector('menuitem');
                if (firstItem) {
                    if (firstItem.classList.contains('copy')) {
                        menu.classList.add('copy');
                    }
                    let command = firstItem.getAttribute('command');
                    if (command)
                        firstItem = doc.getElementById(command) || firstItem;
                    ['label', 'data-l10n-href', 'data-l10n-id', 'accesskey', 'icon', 'tooltiptext'].forEach(function (n) {
                        if (!menu.hasAttribute(n) && firstItem.hasAttribute(n))
                            menu.setAttribute(n, firstItem.getAttribute(n));
                    }, this);
                    setImage(menu, menuObj.image || firstItem.getAttribute("image") || firstItem.style.listStyleImage.slice(4, -1));
                    menu.addEventListener('click', function (event) {
                        if (event.target != event.currentTarget) return;
                        var firstItem = event.currentTarget.querySelector('menuitem');
                        if (!firstItem) return;
                        if (event.button === 1) {
                            checkForMiddleClick(firstItem, event);
                        } else {
                            firstItem.doCommand();
                            closeMenus(event.currentTarget);
                        }
                    });
                }
            }

            return menu;
        },
        newMenuitem: function (obj, opt = {}, doc = document) {
            var menuitem,
                isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                menuitemType = isAppMenu ? "toolbarbutton" : "menuitem",
                noDefaultLabel = false;

            if (obj.label === "separator" ||
                (!obj.label && !obj.image && !obj.text && !obj.keyword && !obj.url && !obj.oncommand && !obj.command)) {
                // label == separator か必要なプロパティが足りない場合は区切りとみなす
                menuitem = $C(separatorType);
            } else if (obj.oncommand || obj.command) {
                let org = obj.command ? doc.getElementById(obj.command) : null;
                if (org && org.localName === separatorType) {
                    menuitem = $C(separatorType);
                } else {
                    menuitem = $C(menuitemType);
                    if (obj.command)
                        menuitem.setAttribute("command", obj.command);

                    noDefaultLabel = !obj.label;
                    if (noDefaultLabel)
                        obj.label = obj.command || obj.oncommand;

                    if (obj.class) {
                        obj.class.split(" ").forEach(c => menuitem.classList.add(c));
                    }
                }
            } else {
                menuitem = $C(menuitemType);

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

                if (obj.edit) {
                    obj.edit = this.handleRelativePath(obj.edit);
                }
            }

            // 右键第一层菜单添加 onpopupshowing 事件
            if (opt.isTopMenuitem) {
                processOnShowing.call(this, menuitem, obj, opt.insertPoint);
            }

            // 绑定事件
            addEventListeners(menuitem, obj);

            // 设置属性
            setAttributes(menuitem, obj, ["command"]);

            (async () => {
                if (noDefaultLabel && menuitem.localName !== separatorType) {
                    if (obj['data-l10n-href'] && obj["data-l10n-href"].endsWith(".ftl") && obj['data-l10n-id']) {
                        // Localization 支持
                        let strings = new Localization([obj["data-l10n-href"]]);
                        if ("formatValue" in strings) {
                            const label = await strings.formatValue([obj['data-l10n-id']]);
                            if (label) menuitem.setAttribute('label', label);
                        } else {
                            menuitem.setAttribute('label', strings.formatValueSync([obj['data-l10n-id']]) || menuitem.getAttribute("label"));
                        }
                    } else if (obj.keyword) {
                        // 调用搜索引擎 Label hack
                        let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                        engine = await engine;
                        if (engine && engine._name) menuitem.setAttribute('label', engine._name);
                    }
                }
            })()

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
            this.setCondition(menuitem, obj, opt);

            // separator はここで終了
            if (menuitem.localName == "menuseparator")
                return menuitem;

            if (!obj.onclick) {
                // menuitem.setAttribute("onclick", "checkForMiddleClick(this, event)");
                menuitem.addEventListener("click", function (event) {
                    checkForMiddleClick(this, event);
                }, false);
            }

            // 给 MenuGroup 的菜单加上 tooltiptext
            if (opt.isMenuGroup && !obj.tooltiptext && obj.label) {
                menuitem.setAttribute('tooltiptext', obj.label);
            }

            // 如果没有 command 和 oncommand 则增加 oncommand
            if (!(obj.oncommand || obj.command)) {
                // menuitem.setAttribute("oncommand", "(event);");
                menuitem.addEventListener("command", (event) => {
                    addMenu.onCommand(event);
                }, false);
            }

            // 可能ならばアイコンを付ける
            this.setIcon(menuitem, obj);

            return menuitem;
        },
        createMenuitem: function (itemArray, insertPoint, doc = document) {
            //Symbol.iterator
            for (let obj of itemArray) {
                if (!obj) continue;
                let menuitem;

                // clone menuitem and set attribute
                // 2025.06.05 ignore obj.clone
                let sel = obj.id || obj.selector;
                if (sel && (menuitem = $(sel))) {
                    let dupMenuitem = menuitem.cloneNode(true);
                    addEventListeners(dupMenuitem, obj);
                    setAttributes(dupMenuitem, obj);

                    // 如果没有则添加 menuitem-iconic 或 menu-iconic，给菜单添加图标用。
                    let type = dupMenuitem.nodeName,
                        cls = dupMenuitem.classList;
                    if (type == 'menuitem' || type == 'menu')
                        if (!cls.contains(type + '-iconic'))
                            cls.add(type + '-iconic');

                    if (!cls.contains('addMenu'))
                        cls.add('addMenu');

                    insertMenuItem(obj, dupMenuitem, insertPoint, doc);
                } else {
                    menuitem = obj._items ? this.newMenu(obj, {
                        insertPoint: insertPoint
                    }) : this.newMenuitem(obj, {
                        isTopMenuitem: true,
                        insertPoint: insertPoint
                    });
                    insertMenuItem(obj, menuitem, insertPoint, doc);
                }
            }
        },
        modMenuitem: function (obj) {
            const sel = obj.id || obj.selector;
            if (sel && $(sel)) {
                const menuitem = $(sel);
                const originalAttributes = {};
                menuitem.getAttributeNames().forEach((attr) => {
                    originalAttributes[attr] = menuitem.getAttribute(attr);
                });
                this.undoFunctions.push(() => {
                    menuitem.getAttributeNames().forEach((attr) => {
                        if (attr in originalAttributes) {
                            menuitem.setAttribute(attr, originalAttributes[attr]);
                        } else {
                            menuitem.removeAttribute(attr);
                        }
                    });
                });
                let popup = menuitem.closest("#contentAreaContextMenu,#toolbar-context-menu,#tabContextMenu,#identity-box-contextmenu,#menu_FilePopup,#appMenu-protonMainView,#menu_ToolsPopup");
                if (popup) {
                    let insertPoint = popup.querySelector("menuseparator.addMenu-insert-point");
                    processOnShowing.call(this, menuitem, obj, insertPoint);
                } else {
                    processOnShowing.call(this, menuitem, obj);
                }
                setAttributes(menuitem.get(), obj, ['id', 'sel']);
                let fn = addEventListeners(menuitem, obj);
                if (typeof fn === "function") this.undoFunctions.push(fn);
                let placeholder = $C('menuseparator', {
                    hidden: true,
                });
                menuitem.before(placeholder);
                this.undoFunctions.push(() => {
                    placeholder.after(menuitem.get());
                    placeholder.remove();
                });
                if (obj.parent && $(obj.parent)) {
                    let children = $(obj.parent).children;
                    let position = obj.position || children.length;
                    if (position > children.length) position = children.length;
                    $(obj.parent).insertBefore(menuitem, children[position - 1]);
                } else if (obj.insertAfter && $(obj.insertAfter)) {
                    $(obj.insertAfter).after(menuitem);
                } else if (obj.insertBefore && $(obj.insertBefore)) {
                    $(obj.insertBefore).before(menuitem);
                } else if (obj.position && parseInt(obj.position, 10) > 0) {
                    let children = menuitem.parent().get().children;
                    let position = obj.position || children.length;
                    if (position > children.length) position = children.length;
                    menuitem.parent().insertBefore(menuitem.get(), children[position - 1]);
                }
            } else {
                console.warn("menuObj.selector or menuObj.id not found:", obj);
            }
        },
        undoMods: function () {
            this.undoFunctions.forEach(f => f());
            this.undoFunctions = [];
        },
        removeMenuitem: function () {
            $$('.addMenuOriginal').forEach((e) => {
                let id = e.attr('original-id');
                if (id && $(id))
                    e.before($(id));
                e.remove();
            });

            $$('menu.addMenu:not(.addMenuNot), menugroup.addMenu:not(.addMenuNot)').forEach(e => e.remove());
            $$('.addMenu:not(.addMenuNot)').forEach(e => e.remove());
            // 恢复原隐藏菜单
            $$('.addMenuHide').forEach(function (e) {
                e.removeClass('addMenuHide');
            });
        },
        setIcon: async function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("icon"))
                return;

            if (obj?.image && shouldSetIcon(menu)) {
                setImage(menu, obj.image);
                return;
            }

            if (obj?.exec) {
                await this._setExecIcon(menu, obj.exec);
                return;
            }

            if (obj?.edit) {
                await this._setExecIcon(menu, obj.edit);
            }

            if (obj?.keyword) {
                await this._setEngineIcon(menu, obj.keyword);
                return;
            }
            await this._setPageIcon(menu, obj?.url);
        },
        _setExecIcon: async function (menu, execPath) {
            const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            try {
                file.initWithPath(execPath);
                if (!file.exists()) {
                    menu.setAttribute("disabled", "true");
                    return;
                }
                const iconUrl = file.isFile()
                    ? `moz-icon://${getURLSpecFromFile(file)}?size=16`
                    : "chrome://global/skin/icons/folder.svg";
                setImage(menu, iconUrl);
            } catch (e) {
                console.error("Failed to set exec icon:", e);
            }
        },
        _setEngineIcon: async function (menu, keyword) {
            try {
                const engine = keyword === "@default"
                    ? await Services.search.getDefault()
                    : await Services.search.getEngineByAlias(keyword);
                if (!engine) return;

                // Bug 1870644 - Provide a single function for obtaining icon URLs from search engines
                const iconUrl = engine.getIconURL
                    ? await engine.getIconURL(16)
                    : engine.iconURI?.spec || "chrome://browser/skin/search-engine-placeholder.png";
                setImage(menu, iconUrl);
            } catch (e) {
                console.error("Failed to set engine icon:", e);
            }
        },
        _setPageIcon: async function (menu, url) {
            if (!url) return;

            try {
                // 获取可能的搜索引擎条目
                const entry = await PlacesUtils.keywords.fetch("");
                const targetUrl = entry?.url?.href || url.replace(this.regexp, "");
                if (!targetUrl) return;

                // 解析URI并设置图标
                const uri = Services.io.newURI(targetUrl, null, null);
                menu.setAttribute("scheme", uri.scheme);

                const faviconData = await new Promise(resolve => {
                    PlacesUtils.favicons.getFaviconDataForPage(uri, {
                        onComplete: (aURI, aDataLen, aData, aMimeType) => resolve({ aURI, aData, aMimeType })
                    });
                });

                if (faviconData?.aURI?.spec) {
                    setImage(menu, `page-icon:${faviconData.aURI.spec}`);
                }
            } catch (e) {
                console.error("Failed to set page icon:", e);
            }
        },
        setCondition: function (menu, obj, opt = {}) {
            if (obj.condition) {
                const validConditions = ["normal", "select", "link", "mailto", "image", "canvas", "media", "input", "svg", "completed-image"];
                const conditions = obj.condition.split(' ')
                    .filter(c => c && (c === "normal" || validConditions.includes(c.replace(/^no/, ""))));

                if (conditions.length) {
                    menu.setAttribute("condition", conditions.join(" "));
                }
            } else if (opt.insertPoint?.id === "addMenu-page-insertpoint") {
                // menu.setAttribute("condition", "normal");
            }
        },
        convertText: function (text) {
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

            let tab = TabContextMenu.contextTab || gBrowser.selectedTab || document.popupNode;
            var bw = gContextMenu ? context.browser : tab.linkedBrowser;

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

            function convert (str) {
                switch (str) {
                    case "%T":
                        return bw.contentTitle;
                    case "%TITLE%":
                        return bw.contentTitle;
                    case "%TITLES%":
                        return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "");
                    case "%U":
                        return getUrl();
                    case "%URL%":
                        return getUrl();
                    case "%H":
                        return getHost();
                    case "%HOST%":
                        return getHost();
                    case "%S":
                        return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || "";
                    case "%SEL%":
                        return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || "";
                    case "%SL":
                    case "%SEL_OR_LT%":
                    case "%SEL_OR_LINK_TEXT%":
                        return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || context.linkText();
                    case "%L":
                        return context.linkURL || "";
                    case "%RLINK%":
                        return context.linkURL || "";
                    case "%RLINK_HOST%":
                        return context.link.host || "";
                    case "%RLINK_TEXT%":
                        return context.linkText() || "";
                    case "%RLINK_OR_URL%":
                        return context?.linkURL || getUrl() || "";
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
                        return isDef(context.mediaURL) ? img2base64(context.mediaURL) : img2base64(context.imageURL);
                    case "%SVG_BASE64%":
                        if (addMenu.ContextMenu.onSvg) {
                            return svg2base64(addMenu.ContextMenu.svgHTML);
                        }
                        let url = context.linkURL || bw.documentURI.spec || "";
                        return svg2base64(url);
                    case "%M":
                        return context.mediaURL || "";
                    case "%MEDIA_URL%":
                        return context.mediaURL || "";
                    case "%P":
                        return readFromClipboard() || "";
                    case "%CLIPBOARD%":
                        return readFromClipboard() || "";
                    case "%FAVICON%":
                        return tab.faviconUrl || gBrowser.getIcon(tab ? tab : null) || "";
                    case "%FAVICON_BASE64%":
                        let image = tab.faviconUrl || gBrowser.getIcon(tab ? tab : null);
                        if (image && image.startsWith("data:image")) return image;
                        return img2base64(image);
                    case "%EMAIL%":
                        return getEmailAddress() || "";
                    case "%EOL%":
                        return "\r\n";
                }
                return str;
            }

            function htmlEscape (s) {
                return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
            }

            function getUrl () {
                const URI = bw.currentURI;
                if (URI.schemeIs("about")) {
                    switch (URI.filePath) {
                        case "neterror":
                            return new URLSearchParams(URI.query).get('u');
                        default:
                            return URI.spec;
                    }

                } else {
                    return URI.spec;
                }
            }

            function getHost () {
                const url = getUrl();
                try {
                    const uri = Services.io.newURI(url);
                    return uri.host;
                } catch (ex) {
                    return "";
                }
            }

            function getEmailAddress () {
                var url = context.linkURL;
                if (!url) return "";

                const match = url.match(/^mailto:([^?]+).*/i);
                if (!match) return "";
                let addresses = match[1];
                try {
                    var characterSet = context.target.ownerDocument.characterSet;
                    const textToSubURI = Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI);
                    addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
                } catch (ex) { }
                return addresses;
            }

            function img2base64 (imgSrc, imgType = "image/png") {
                if (typeof imgSrc === 'undefined') return "";
                if (imgSrc.includes("data:")) return imgSrc;
                if (imgSrc.includes("<svg") || /\.(svg|SVG)$/i.test(imgSrc)) {
                    return svg2base64(imgSrc);
                }

                return syncify(() => {
                    return new Promise((resolve) => {
                        const NSURI = "http://www.w3.org/1999/xhtml";
                        const img = new Image();

                        img.onload = function () {
                            try {
                                const canvas = document.createElementNS(NSURI, "canvas");
                                canvas.width = this.naturalWidth;
                                canvas.height = this.naturalHeight;
                                canvas.getContext("2d").drawImage(this, 0, 0);
                                resolve(canvas.toDataURL(imgType));
                            } catch (e) {
                                console.error('Canvas error:', e);
                                resolve("");
                            }
                        };

                        img.onerror = () => {
                            console.error('Image load failed:', imgSrc);
                            resolve("");
                        };

                        img.src = imgSrc;
                    });
                });
            }

            function svg2base64 (svgSrc) {
                if (/^(https?:\/\/|ftp:\/\/|chrome:\/\/|resource:\/\/|\/\/)/.test(svgSrc)) {
                    // 使用 NetUtil 读取 SVG 文件内容
                    const channel = NetUtil.newChannel({
                        uri: Services.io.newURI(svgSrc),
                        loadUsingSystemPrincipal: true
                    });
                    const input = channel.open();
                    svgSrc = NetUtil.readInputStreamToString(input, input.available());
                    input.close();
                }
                const encoder = new TextEncoder();
                const data = encoder.encode(svgSrc);
                return "data:image/svg+xml;base64," + btoa(String.fromCharCode(...data));
            }
        },
        getSelectedText () {
            return this._selectedText;
        },
        setSelectedText (aText) {
            this._selectedText = aText;
        },
        setFaviconLink ({ hash, href }) {
            if (hash && href)
                gBrowser.tabs.filter(t => t.faviconHash === hash).forEach(t => t.faviconUrl = href);
        },
        edit: async function (aFile, aLineNumber) {
            if (!aFile?.exists() || !aFile.isFile()) {
                console.warn(lprintf("configuration file does not exist or is not a valid file", aFile?.path));
                return;
            }

            try {
                // 1. 获取或设置编辑器路径
                let editor = await this.getOrSetEditorPath();
                if (!editor) return; // 用户取消了操作

                // 2. 打开文件
                const aURL = getURLSpecFromFile(aFile);
                await new Promise((resolve) => {
                    gViewSourceUtils.openInExternalEditor({
                        URL: aURL,
                        lineNumber: aLineNumber
                    }, null, null, aLineNumber, resolve);
                });

            } catch (e) {
                console.error(lprintf("error occurred while editing the file", error.message), e);
                this.alert(lprintf('process command error', e.message));
            }
        },
        getOrSetEditorPath: async function () {
            // 尝试从首选项获取现有编辑器路径
            try {
                const editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                if (editor.exists()) return editor;
            } catch (e) {
                // 首选项不存在或无效
            }

            // 提示用户设置编辑器路径
            this.alert(lprintf('please set editor path'));

            const fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
            fp.init(
                !("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                    ? window.browsingContext
                    : window,
                lprintf('set global editor'),
                fp.modeOpen
            );
            fp.appendFilters(Ci.nsIFilePicker.filterApps);

            const file = await new Promise(resolve => {
                if (typeof fp.show !== 'undefined') {
                    resolve(fp.show() === fp.returnOK ? fp.file : null);
                } else {
                    fp.open(res => resolve(res === Ci.nsIFilePicker.returnOK ? fp.file : null));
                }
            });

            if (file) {
                Services.prefs.setCharPref("view_source.editor.path", file.path);
                return file;
            }

            return null;
        },
        copy: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
            //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
        },
        copyLink: function (copyURL, copyLabel) {
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
        },
        alert: function (aMsg, aTitle, aCallback) {
            var callback = aCallback ? {
                observe: function (subject, topic, data) {
                    if ("alertclickcallback" != topic)
                        return;
                    aCallback.call(null);
                }
            } : null;
            var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            alertsService.showAlertNotification(
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "addMenuPlus",
                aMsg + "", !!callback, "", callback);
        },
        $$: function (selector, callback, context = gBrowser.selectedBrowser) {
            // 如果 callback 是函数，转换为字符串
            const callbackStr = typeof callback === 'function'
                ? callback.toString()
                : callback;

            // 构造要执行的代码
            const script = `
                const elements = Array.from(this.document.querySelectorAll('${selector}'));
                elements.forEach(e => (${callbackStr})(e));
            `;

            // 使用 executeInContent 执行
            this.executeInContent(context, script);
        }
    };

    function $C (name, attr = {}, doc = document) {
        const el = doc.createXULElement(name);
        for (let [key, value] of Object.entries(attr)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (typeof value === 'function') {
                    el.addEventListener(eventName, value);
                } else {
                    let error = new Error('addMenuPlus: $C: ' + key + ' is not a function');
                    console.error(error);
                }
            } else {
                el.setAttribute(key, value);
            }
        }
        return el;
    }

    function insertMenuItem (obj, menuitem, insertPoint, doc = document) {
        let ins;
        if (obj.parent && (ins = $('#' + obj.parent, doc))) {
            ins.append(menuitem);
            return;
        }
        if (obj.insertAfter && (ins = $('#' + obj.insertAfter, doc))) {
            ins.after(menuitem);
            return;
        }
        if (obj.insertBefore && (ins = $('#' + obj.insertBefore, doc))) {
            ins.before(menuitem);
            return;
        }
        if (obj.position && parseInt(obj.position, 10) > 0) {
            let children = Array.from(insertPoint.parentNode.children);
            (ins = children[parseInt(obj.position, 10) - 1]) ?
                ins.parentNode.insertBefore(menuitem, ins) :
                insertPoint.parentNode.appendChild(menuitem);
            return;
        }
        insertPoint.before(menuitem);
    }

    function unwrap (menu) {
        return menu?.$self || menu;
    }

    function addEventListener (element, type, listener) {
        element = unwrap(element);
        if (typeof listener === 'function') {
            element.addEventListener(type, listener);
            return () => element.removeEventListener(type, listener);
        } else {
            console.warn(`addMenuPlus: addEventListener: ${type} is not a function, ignored, value is ${listener}`);
            return () => { }
        };
    }

    function addEventListeners (element, obj) {
        element = unwrap(element);
        const unlisteners = [];
        Object.keys(obj).forEach(key => {
            if (key.startsWith('on') && key !== "onshowinglabel") {
                const val = obj[key];
                if (typeof val === 'function') {
                    unlisteners.push(addEventListener(element, key.slice(2).toLowerCase(), val));
                } else {
                    console.warn(`addMenuPlus: addEventListeners: ${key} is not a function, ignored, value is ${val}`);
                }
            }
        });
        return () => unlisteners.forEach(unlistener => unlistener());
    }

    function setAttributes (element, obj, exclude = []) {
        element = unwrap(element);
        Object.keys(obj).forEach(key => {
            if (key === "onshowinglabel" || !exclude.includes(key) && !key.startsWith('on')) {
                element.setAttribute(key, obj[key]);
            }
        });
    }

    function addStyle (css, type = 'AUTHOR_SHEET') {
        let errorFlag = false;
        if (typeof type === 'string') {
            if (!['USER_SHEET', 'AGENT_SHEET', 'AUTHOR_SHEET'].includes(type)) {
                errorFlag = true;
            }
            if (!errorFlag)
                type = windowUtils[type]; // 转换为 windowUtils 对应的值
        } else if (typeof type === 'number' && ![0, 1, 2].includes(type)) {
            errorFlag = true;
        }
        if (errorFlag) {
            throw new Error('addMenuPlus: addStyle: type must be USER_SHEET, AGENT_SHEET or AUTHOR_SHEET or 0 or 1 or 2');
        }
        const uriString = 'data:text/css,' + encodeURIComponent(css);
        windowUtils.loadSheetUsingURIString(uriString, type);
        return {
            uriString,
            type,
            destroy: function() { windowUtils.removeSheetUsingURIString(this.uriString, this.type) }
        }
    }

    function capitalize (s) {
        return s && s[0].toUpperCase() + s.slice(1);
    }

    function lprintf (key, ...args) {
        const localeData = ADDMENU_LANG[ADDMENU_LOCALE];
        if (key && localeData?.[key]) {
            return args.reduce((str, arg) => str.replace('%s', arg), localeData[key]);
        }
        return capitalize(key || '');
    }

    function processOnShowing (menu, menuObj, insertPoint) {
        if (menuObj.onshowing) {
            const obj = {
                item: unwrap(menu),
                insertPoint: insertPoint?.id || "addMenu-all-insertpoint",
            }
            if (typeof menuObj.onshowing === 'function') {
                obj.fn = menuObj.onshowing;
            } else {
                obj.fnSource = menuObj.onshowing;
            }
            this.customShowings.push(obj);
            delete menuObj.onshowing;
        }
    }

    function setImage (menu, imageUrl) {
        if (imageUrl) {
            if (enableConvertImageAttrToListStyleImage) {
                menu.style.listStyleImage = `url(${imageUrl})`;
                menu.removeAttribute("image");
            } else {
                menu.setAttribute("image", imageUrl);
            }
        }
    }

    function resolveChromeURL (fileUrl) {
        return fileUrl.replace("file:///" + PathUtils.profileDir.replace(/\\/g, '/') + "/chrome", "chrome://userchrome/content")
    }

    window.addMenu.init();

    setTimeout(() => {
        window.addMenu.rebuild();
    }, 1000);

    setTimeout(() => {
        window.addMenu.rebuild();
    }, 3000);
})(`
.addMenuHide {
    display: none !important;
}
#contentAreaContextMenu > .addMenu[condition]:not(menugroup),
#contentAreaContextMenu > menugroup > .addMenu[condition],
#contentAreaContextMenu menugroup.addMenu[condition] {
    display: none;
}
#contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="link"],
#contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="mailto"],
#contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="image"],
#contentAreaContextMenu[addMenu~="svg"]  .addMenu[condition~="svg"],
#contentAreaContextMenu[addMenu~="completed-image"]  .addMenu[condition~="completed-image"],
#contentAreaContextMenu[addMenu~="canvas"] .addMenu[condition~="canvas"],
#contentAreaContextMenu[addMenu~="media"]  .addMenu[condition~="media"],
#contentAreaContextMenu[addMenu~="input"]  .addMenu[condition~="input"],
#contentAreaContextMenu[addMenu~="select"]  .addMenu[condition~="select"],
#contentAreaContextMenu[addMenu=""] .addMenu[condition~="normal"],
#contentAreaContextMenu:not([addMenu~="select"]) .addMenu[condition~="noselect"],
#contentAreaContextMenu:not([addMenu~="link"])   .addMenu[condition~="nolink"],
#contentAreaContextMenu:not([addMenu~="mailto"]) .addMenu[condition~="nomailto"],
#contentAreaContextMenu:not([addMenu~="image"])  .addMenu[condition~="noimage"],
#contentAreaContextMenu:not([addMenu~="svg"])  .addMenu[condition~="nosvg"],
#contentAreaContextMenu:not([addMenu~="completed-image"])  .addMenu[condition~="nocompleted-image"],
#contentAreaContextMenu:not([addMenu~="canvas"])  .addMenu[condition~="nocanvas"],
#contentAreaContextMenu:not([addMenu~="media"])  .addMenu[condition~="nomedia"],
#contentAreaContextMenu:not([addMenu~="input"])  .addMenu[condition~="noinput"],
#contentAreaContextMenu:not([addMenu~="select"])  .addMenu[condition~="noselect"] {
    display: flex !important; display: -moz-box !important;
}
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
#toolbar-context-menu:not([addMenu=""]) .addMenu[condition~="normal"] {
    display: none !important;
}
.addMenu-insert-point,
toolbarseparator:not(.addMenu-insert-point)+toolbarseparator {
    display: none !important;
}
.addMenu.exec,
.addMenu[exec] {
    list-style-image: url("data:image/svg+xml;base64,PCEtLSBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljCiAgIC0gTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcwogICAtIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9ImNvbnRleHQtZmlsbCI+CiAgPHBhdGggZD0iTTEgM2ExIDEgMCAwMTEtMWgxMmExIDEgMCAwMTEgMXYxMGExIDEgMCAwMS0xIDFIMmExIDEgMCAwMS0xLTFWM3ptMTMgMEgydjJoMTJWM3ptMCAzSDJ2N2gxMlY2eiIvPgo8L3N2Zz4K");
}
.addMenu.copy,
menuitem.addMenu[text]:not([url]):not([keyword]):not([exec]) {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg==);
}
.addMenu.edit {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNMTEuMjUuODE1YTIuNzgzIDIuNzgzIDAgMCAxIDQuMDY2IDMuNzk2bC0uMTMuMTQtOS42MDYgOS42MDVhMiAyIDAgMCAxLS43MjMuNDYzbC0uMTY1LjA1My00LjA1NSAxLjEwNmEuNS41IDAgMCAxLS42My0uNTM1bC4wMTYtLjA4TDEuMTMgMTEuMzFhMiAyIDAgMCAxIC4zOTgtLjc2bC4xMTctLjEyOHptLS44NiAyLjI3NS04LjA0IDguMDM4YTEgMSAwIDAgMC0uMjE1LjMyMWwtLjA0Mi4xMjMtLjg3NiAzLjIxMSAzLjIxMi0uODc2YTEgMSAwIDAgMCAuMjM4LS4xbC4xMDgtLjA3MS4wOTgtLjA4NiA4LjAzOC04LjA0em00LjA4OS0xLjU2OGExLjc4NCAxLjc4NCAwIDAgMC0yLjQwMi0uMTFsLS4xMi4xMS0uODYuODYgMi41MiAyLjUyMi44NjEtLjg2YTEuNzg0IDEuNzg0IDAgMCAwIC4xMS0yLjQwMnoiLz4KPC9zdmc+)
}
.addMenu.sync {
    list-style-image: url(chrome://browser/skin/preferences/category-sync.svg)
}
.addMenu.reload {
    list-style-image: url(chrome://global/skin/icons/reload.svg)
}
.addMenu.quit {
    list-style-image: url(chrome://global/skin/icons/close.svg)
}
.addMenu.checkbox :is(.menu-iconic-icon,.menu-icon) {
    appearance: checkbox;
}
.addMenu > :is(.menu-iconic-left, .menu-icon) {
    appearance: menuimage;
}
.addMenu > .menu-iconic-left > .menu-iconic-icon,
.addMenu > .menu-icon {
    -moz-context-properties: fill, fill-opacity !important;
    fill: currentColor !important;
}
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > .addMenu:is(menu, menuitem) > :is(.menu-iconic-left, .menu-icon),
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu >.addMenu.showText > :is(.menu-iconic-left, .menu-icon),
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showText >.addMenu > :is(.menu-iconic-left, .menu-icon),
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showFirstText > .menuitem-iconic:first-child > :is(.menu-iconic-left, .menu-icon) {
    visibility: collapse;
}
menugroup.addMenu > .menuitem-iconic.fixedSize {
    flex-grow: 0;
    flex-shrink: 0;
    padding-inline-end: 8px;
}
menugroup.addMenu > .menuitem-iconic {
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    padding-block: var(--arrowpanel-menuitem-padding-block, 6px);
    padding-inline-start: 1em;
}
menugroup.addMenu > .menuitem-iconic > :is(.menu-iconic-left,.menu-icon) {
    appearance: none;
    padding-top: 0;
}
menugroup.addMenu > .menuitem-iconic > .menu-icon,
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
    width: 16px;
    height: 16px;
}
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > :is(.menu-iconic-text,.menu-text),
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child) > :is(.menu-iconic-text,.menu-text) {
    display: none;
}
menugroup.addMenu > .menuitem-iconic > :is(.menu-accel,.menu-accel) {
    display: none;
}
menugroup.addMenu > .menuitem-iconic {
    padding-inline-end: 1em;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText),
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) {
    padding-left: 0;
    flex-grow: 0;
    flex-shrink: 0;
    padding-inline-end: 0;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > :is(.menu-iconic-left,.menu-icon),
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > :is(.menu-iconic-left,.menu-icon) {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
}
`, f => {
    return Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(f);
}, p => {
    return syncify(() => {
        return IOUtils.readUTF8(p).then(data => {
            try {
                return decodeURIComponent(escape(data));
            } catch (e) {
                // console.error(e);
                return data; // 返回原始数据如果解码失败
            }
        });
    });
}, v => {
    return Services.vc.compare(Services.appinfo.version, v) >= 0;
}, menu => menu.matches(".menuitem-iconic, .menu-iconic"),
    v => v !== undefined && v !== null);
export { AddMenuChild, AddMenuParent };
class AddMenuChild extends JSWindowActorChild {
    handleEvent (event) {
        this[event.type]?.(event);
    }
    contextmenu (event) {
        const { contentWindow: win } = this;
        const { target } = event;
        const svgEl = target.closest("svg");
        const inputEl = target.closest("input");
        const textareaEl = target.closest("textarea");
        const isSvg = !!svgEl;
        const isInput = !!inputEl;
        const isTextarea = !!textareaEl;
        const data = {
            onSvg: isSvg,
            svgHTML: isSvg ? svgEl.outerHTML : "",
            onInput: isInput,
            inputValue: isInput ? inputEl.value : "",
            inputHTML: isInput ? inputEl.outerHTML : "",
            onTextarea: isTextarea,
            textareaValue: isTextarea ? textareaEl.value : "",
            textareaHTML: isTextarea ? textareaEl.outerHTML : "",
            onElement: true,
            elementHTML: target.outerHTML
        };
        this.sendAsyncMessage("AddMenuPlus:SetContextMenu", data);
    }
    executeInChrome (func, args) {
        let json = {
            func: func.toString(),
            args: JSON.stringify(args)
        }
        this.sendAsyncMessage("AddMenuPlus:executeInChrome",
            json
        );
    }
    receiveMessage ({ name, data }) {
        const { contentWindow: win } = this;
        const { document: doc } = win;
        switch (name) {
            case "AddMenuPlus:GetFaviconLink":
                if (!doc.head || !data.hash) return;
                const getFaviconUrl = () => {
                    const link = doc.head.querySelector('[rel~="shortcut"],[rel="icon"]');
                    return link ? processRelLink(link.href)
                        : `${doc.location.origin}/favicon.ico`;
                };

                const processRelLink = href => {
                    if (/^(https?:|chrome:|resource:|data:|\/\/)/.test(href)) {
                        return href.startsWith('//') ? `${doc.location.protocol}${href}` : href;
                    }
                    return `${doc.location.origin}/${href.replace(/^\.?\//, '')}`;
                };

                const href = getFaviconUrl();
                this.sendAsyncMessage("AddMenuPlus:SetFaviconLink", { hash: data.hash, href });
                break;
            case "AddMenuPlus:GetSelectedText":
                this.sendAsyncMessage("AddMenuPlus:SetSelectedText", {
                    textSelected: getSelectedText(win),
                });
                break;
            case "AddMenuPlus:ExecuteInContent":
                const { script } = data;
                new Function(script).apply(win);
                break;
        }

        function getSelectedText (win) {
            let text = "", doc = win.document;
            if (win.getSelection) {
                text = win.getSelection().toString();
            } else if (doc?.selection?.type != "Control") {
                text = doc.selection.createRange().text;
            }
            return text;
        }
    }
}
class AddMenuParent extends JSWindowActorParent {
    receiveMessage ({ name, data }) {
        try {
            const windowGlobal = this.manager.browsingContext.currentWindowGlobal;
            const browser = windowGlobal.rootFrameLoader.ownerElement;
            const win = browser.ownerGlobal;
            const { addMenu } = win;
            switch (name) {
                case 'AddMenuPlus:SetSelectedText':
                    addMenu.setSelectedText(data.textSelected);
                    break;
                case 'AddMenuPlus:SetFaviconLink':
                    addMenu.setFaviconLink(data);
                    break;
                case 'AddMenuPlus:SetContextMenu':
                    Object.assign(addMenu.ContextMenu, data);
                    break;
                case 'AddMenuPlus:executeInChrome':
                    addMenu.executeInChrome(data.func, data.args);
                    break;
            }
        } catch (e) { }
    }
}