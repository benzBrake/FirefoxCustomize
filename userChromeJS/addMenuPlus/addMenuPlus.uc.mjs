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
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @downloadURL    https://github.com/ywzhaiqi/userChromeJS/raw/master/addmenuPlus/addMenuPlus.uc.mjs
// @reviewURL      https://bbs.kafan.cn/thread-2246475-1-1.html
// @note           0.3.0 ESMifying
// ==/UserScript==
(async (css, getURLSpecFromFile, loadText, writeText, versionGE, shouldSetIcon, isDef) => {
    if (typeof window === 'undefined') return;

    const enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
    const onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
    const enableidentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单
    const enableContentAreaContextMenuCompact = true; // Photon 界面下右键菜单兼容开关（网页右键隐藏非纯图标菜单的图标，Firefox 版本号小于90无效）
    const enableConvertImageAttrToListStyleImage = false; // 将图片属性转换为 css 属性 list-style-image 

    window?.addMenu?.destroy();

    const ADDMENU_LANG = {
        'zh-CN': {
            'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件' +
                '\n\n' +
                'tab({\n    label: "addMenuPlus 配置",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
            'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
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
            'could not load': '无法载入：%s',
            'error occurred while editing the file': '编辑文件时出错: %s',
            'process command error': '执行命令错误，原因%s',
        },
        'en-US': {
            'config example': '// This is an addMenuPlus configuration file.\n' +
                '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                '\n\n' +
                'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
            'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
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
            'could not load': 'Could not load：%s',
            'error occurred while editing the file': 'Error occurred while editing the file: %s',
            'process command error': 'process command error, resson: %s',
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
            groupmenu: "TabGroup"
        },
        page: {
            insRef: $("#context-viewsource"),
            current: "page",
            submenu: "PageMenu",
            groupmenu: "PageGroup"
        },
        tool: {
            insRef: $("#prefSep, #webDeveloperMenu"),
            current: "tool",
            submenu: "ToolMenu",
            groupmenu: "ToolGroup"
        },
        app: {
            insRef: $("#appmenu-quit, #appMenu-quit-button, #appMenu-quit-button2, #menu_FileQuitItem"),
            current: "app",
            submenu: "AppMenu",
            groupmenu: "AppGroup"
        },
        nav: {
            insRef: $("#toolbar-context-undoCloseTab, #toolbarItemsMenuSeparator"),
            current: "nav",
            submenu: "NavMenu",
            groupmenu: "NavGroup"
        },
        group: {
            current: "group",
            groupmenu: "GroupMenu",
            insertId: "addMenu-page-insertpoint"
        }
    };

    window.addMenu = {
        get platform() {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        get FILE() {
            let path;
            try {
                // addMenu.FILE_PATH があればそれを使う
                path = Services.prefs.getStringPref("addMenu.FILE_PATH")
            } catch (e) {
                path = '_addmenu.js';
            }

            const aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);

            if (!aFile.exists()) {
                writeText(aFile.path, lprintf('config example'));
                alert(lprintf('example is empty'));
                addMenu.openCommand({
                    target: this
                }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
            }

            this._modifiedTime = aFile.lastModifiedTime;
            delete this.FILE;
            return this.FILE = aFile;
        },
        get locale() {
            delete this.locale;
            return this.locale = ADDMENU_LOCALE || "en-US";
        },
        get panelId() {
            delete this.panelId;
            return this.panelId = Math.floor(Math.random() * 900000 + 99999);
        },
        ContextMenu: {
            onSvg: false,
            svgHTML: "",
            onInput: false,
            inputValue: "",
            inputHTML: "",
            onTextarea: false,
            textareaValue: "",
            textareaHTML: ""
        },
        customShowings: [],
        init: async function () {
            // 注册 Actor
            const esModuleURI = resolveChromeURL(Components.stack.filename)
            ChromeUtils.registerWindowActor("AddMenu", {
                parent: {
                    esModuleURI
                },
                child: {
                    esModuleURI,
                },
                allFrames: true,
            });

            this.initRegex();

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
                } else {
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

            // 增加工具菜单
            $("#devToolsSeparator").before($C("menuitem", {
                id: "addMenu-rebuild",
                label: lprintf('addmenuplus label'),
                tooltiptext: lprintf('addmenuplus tooltip'),
                oncommand: "setTimeout(async function(){ await addMenu.rebuild(true); }, 10);",
                onclick: "if (event.button == 2) { event.preventDefault(); addMenu.edit(addMenu.FILE); }",
            }))

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
            // 响应鼠标键释放事件（eg：获取选中文本）
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
            gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
            this.removeMenuitem();
            $$('#addMenu-rebuild, .addMenu-insert-point').remove();
            this.identityBox?.removeAttr('contextmenu').off("click", this, false);
            $('#identity-box-contextmenu')?.remove();
            this.style?.remove();
            this.style2?.remove();
            delete window.addMenu;
        },
        getActor: function (browser = gBrowser.selectedBrowser, name = "AddMenu") {
            return browser.browsingContext.currentWindowGlobal.getActor(name);
        },
        sendAsyncMessage: function (key, data = {}, browser = gBrowser.selectedBrowser) {
            return this.getActor(browser).sendAsyncMessage(key, data);
        },
        handleEvent: function (event) {
            const { type, target, button } = event;
            const $target = $(event.target);
            const $currentTarget = $(event.currentTarget);

            switch (type) {
                case "ViewShowing":
                case "popupshowing":
                    if (target !== event.currentTarget) return;

                    // File refreshing logic
                    if (enableFileRefreshing) {
                        this.updateModifiedFile();
                    }

                    // Process all .addMenu elements
                    $$('.addMenu', $target.get()).forEach($menu => {
                        $menu.removeAttr("hidden");

                        const showingLabel = $menu.attr('onshowinglabel');
                        if (showingLabel) {
                            onshowinglabelMaxLength = onshowinglabelMaxLength || 15;
                            let sel = addMenu.convertText(showingLabel);
                            if (sel.length > 15) sel = sel.substr(0, 15) + "...";
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
                            return "addMenu-tab-insertpoint";
                        },
                        'identity-box-contextmenu': () => "addMenu-identity-insertpoint",
                        'menu_FilePopup': () => "addMenu-app-insertpoint",
                        'appMenu-protonMainView': () => "addMenu-app-insertpoint",
                        'menu_ToolsPopup': () => "addMenu-tool-insertpoint"
                    };

                    insertPoint = menuHandlers[$target.attr('id')]?.() || "";

                    // Execute custom showing methods with eval
                    this.customShowings
                        .filter(obj => obj.insertPoint === insertPoint)
                        .forEach(obj => {
                            try {
                                eval('(' + obj.fnSource + ').call(obj.item, obj.item)');
                            } catch (ex) {
                                console.error(lprintf('custom showing method error'), obj.fnSource, ex);
                            }
                        });

                    // Delayed DOM updates
                    setTimeout(() => {
                        $$('menuitem.addMenu[command], menu.addMenu[command]', $target.get()).forEach($elem => {
                            if (/^menugroup$/i.test($elem.parent().get().nodeName)) return;

                            const $original = $('#' + $elem.attr('command'));
                            if ($original.get()) {
                                $elem.attr('hidden', $original.attr('hidden'))
                                    .attr('collapsed', $original.attr('collapsed'))
                                    .attr('disabled', $original.attr('disabled'));
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
                    }, 10);
                    break;

                case 'popuphiding':
                    if ($target.attr('id') === "contentAreaContextMenu") {
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

                case 'mouseup':
                    if (button === 2 || button === 0) {
                        this.sendAsyncMessage("AddMenuPlus:ContextMenu");
                        if (button === 0) {
                            this.sendAsyncMessage("AddMenuPlus:GetSelectedText");
                        }
                    }
                    break;

                case 'TabAttrModified':
                    triggerFavMsg(target);
                    break;
            }

            function triggerFavMsg(tab) {
                if (content || !tab) return;

                const browser = gBrowser.getBrowserForTab(tab);
                const URI = browser.currentURI || browser.documentURI;
                if (!URI) return;

                const hash = calculateHashFromStr(URI.spec);
                tab.faviconHash = hash;
                addMenu.sendAsyncMessage("AddMenuPlus:GetFaviconLink", { hash });
            }

            function calculateHashFromStr(data) {
                const gCryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
                gCryptoHash.init(gCryptoHash.MD5);
                gCryptoHash.update(
                    data.split("").map(c => c.charCodeAt(0)),
                    data.length
                );
                return gCryptoHash.finish(true);
            }
        },
        executeInContent(browser = gBrowser.selectedBrowser, func) {
            try {
                this.sendAsyncMessage("AddMenuPlus:ExecuteInContent", { script: func.toString() }, browser);

            } catch (ex) {
                console.error("Error in executeInContent : ", ex);
            }
        },
        executeInChrome(func, args = []) {
            try {
                const functionobj = new Function(
                    func.match(/\((.*)\)\s*\{/)[1],
                    func.replace(/^function\s*.*\s*\(.*\)\s*\{/, '').replace(/}$/, '')
                );
                functionobj.apply(window, args);
            } catch (ex) {
                console.error("Error in executeInChrome : ", ex);
            }
        },
        updateModifiedFile() {
            if (!this.FILE.exists()) return;

            if (this._modifiedTime != this.FILE.lastModifiedTime) {
                this._modifiedTime = this.FILE.lastModifiedTime;

                setTimeout(async function () {
                    await addMenu.rebuild(true);
                }, 10);
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
        exec: function (path, arg, options = { blocking: false }) {
            let file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            let process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            let result = { success: false, error: null };

            // 规范化路径函数
            function normalizePath(path) {
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
                    argsArray = arg.split(/\s+/); // 简单分割，需改进
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
            let ins = document.getElementById('addMenu-app-insertpoint');
            if (ins && ins.localName === 'menuseparator') {
                let separator = $('appMenu-quit-button2').previousSibling;
                if (separator) {
                    ins.remove();
                    // addMenu.removeMenuitem();
                    ins = $C('toolbarseparator', {
                        'id': 'addMenu-app-insertpoint',
                        class: "addMenu-insert-point",
                        hidden: true
                    });
                    separator.parentNode.insertBefore(ins, separator);
                    addMenu.rebuild();
                }
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
                this.alert(e + lprintf("check config file with line", line), null, function () {
                    addMenu.edit(addMenu.FILE, line);
                });
                return console.log(e);
            }
            if (this.style2 && this.style2.parentNode)
                this.style2.parentNode.removeChild(this.style2);
            if (sandbox._css.length)
                this.style2 = addStyle(sandbox._css.join("\n"));

            this.removeMenuitem();

            this.customShowings = [];

            Object.values(MENU_ATTRS).forEach(function ({
                current,
                submenu,
                groupmenu,
                insertId
            }) {
                if (!sandbox["_" + current] || sandbox["_" + current].length == 0) return;
                let insertPoint = $('#' + insertId);
                this.createMenuitem(sandbox["_" + current], insertPoint);
            }, this);


            if (isAlert) this.alert((lprintf('config has reload')));
        },
        newGroupMenu: function (menuObj, opt = {}) {
            var group = $C('menugroup');

            // 增加 onshowing 事件
            processOnShowing.call(this, group, menuObj, opt.insertPoint);

            Object.keys(menuObj).map(function (key) {
                var val = menuObj[key];
                if (key === "_items") return;
                if (key === "_group") return;
                if (key.startsWith('on') && key !== "onshowinglabel") {
                    const fn = typeof val === "string" ? (() => {
                        if (val.trim().startsWith("function") || val.trim().startsWith("async function")) {
                            return "(" + val + ").call(this, event)";
                        }
                        return val;
                    })() : "(" + val.toString() + ").call(this, event)";
                    group.addEventListener(key.slice(2).toLocaleLowerCase(), (event) => {
                        eval(fn);
                    }, false);
                } else {
                    group.setAttribute(key, val);
                }
            }, this);
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
                }));
            }, this);
            return group;
        },
        newMenu: function (menuObj, opt = {}) {
            if (menuObj._group) {
                return this.newGroupMenu(menuObj, opt);
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
                popup = menu.appendChild($C("menupopup"));
            }

            // 增加 onshowing 事件
            processOnShowing.call(this, menu, menuObj, opt.insertPoint);

            for (let key in menuObj) {
                let val = menuObj[key];
                if (key === "_items") continue;
                if (key.startsWith('on') && key !== "onshowinglabel") {
                    const fn = typeof val === "string" ? (() => {
                        if (val.trim().startsWith("function") || val.trim().startsWith("async function")) {
                            return "(" + val + ").call(this, event)";
                        }
                        return val;
                    })() : "(" + val.toString() + ").call(this, event)";
                    menu.addEventListener(key.slice(2).toLocaleLowerCase(), (event) => {
                        eval(fn);
                    }, false);
                    continue;
                }
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
            this.setCondition(menu, menuObj, opt);

            menuObj._items.forEach(function (obj) {
                popup.appendChild(this.newMenuitem(obj, opt));
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
                        firstItem = document.getElementById(command) || firstItem;
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
        newMenuitem: function (obj, opt = {}) {
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
                let org = obj.command ? document.getElementById(obj.command) : null;
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
            }

            // 右键第一层菜单添加 onpopupshowing 事件
            if (opt.isTopMenuitem) {
                processOnShowing.call(this, menuitem, obj, opt.insertPoint);
            }

            for (let key in obj) {
                let val = obj[key];
                if (key === "command") continue;
                if (key.startsWith('on') && key !== "onshowinglabel") {
                    const fn = typeof val === "string" ? (() => {
                        if (val.trim().startsWith("function") || val.trim().startsWith("async function")) {
                            return "(" + val + ").call(this, event)";
                        }
                        return val;
                    })() : "(" + val.toString() + ").call(this, event)";
                    menuitem.addEventListener(key.slice(2).toLocaleLowerCase(), (event) => {
                        eval(fn);
                    }, false);
                } else {
                    menuitem.setAttribute(key, val);
                }
            }

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
        createMenuitem: function (itemArray, insertPoint) {
            var chldren = Array.from(insertPoint.parentNode.children);
            //Symbol.iterator
            for (let obj of itemArray) {
                if (!obj) continue;
                let menuitem;

                // clone menuitem and set attribute
                if (obj.id && (menuitem = $(obj.id))) {
                    let dupMenuitem;
                    let isDupMenu = (obj.clone === true);
                    if (isDupMenu) {
                        dupMenuitem = menuitem.cloneNode(true);
                    } else {
                        dupMenuitem = menuitem;
                        dupMenuitem.originAttributes = {}
                        dupMenuitem.getAttributeNames().forEach(function (attr) {
                            dupMenuitem.originAttributes[attr] = dupMenuitem.getAttribute(attr);
                        });
                        dupMenuitem.classList.add("addMenuNot");
                    }
                    for (let key in obj) {
                        let val = obj[key];
                        if (key.startsWith('on') && key !== "onshowinglabel") {
                            const fn = typeof val === "string" ? function (event) {
                                if (val.trim().startsWith("function") || val.trim().startsWith("async function")) {
                                    eval("(" + val + ").call(this, event)");
                                } else {
                                    eval(val);
                                }
                            } : val;
                            dupMenuitem.addEventListener(key.slice(2).toLocaleLowerCase(), fn, false);
                            continue;
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

                    // // 没有插入位置的不动
                    if (!obj.parent && !obj.insertAfter && !obj.insertBefore && !obj.position) {
                        continue;
                    } else {
                        // 增加用于还原已移动菜单的标记
                        dupMenuitem.parentNode.insertBefore($C(insertPoint.localName, {
                            'original-id': dupMenuitem.getAttribute('id'),
                            hidden: true,
                            class: 'addMenuOriginal',
                        }), dupMenuitem);
                        insertMenuItem(obj, dupMenuitem);
                    }
                } else {
                    menuitem = obj._items ? this.newMenu(obj, {
                        insertPoint: insertPoint
                    }) : this.newMenuitem(obj, {
                        isTopMenuitem: true,
                        insertPoint: insertPoint
                    });
                    insertMenuItem(obj, menuitem);
                }
            }

            function insertMenuItem(obj, menuitem) {
                let ins;
                if (obj.parent && (ins = $('#' + obj.parent))) {
                    ins.append(menuitem);
                    return;
                }
                if (obj.insertAfter && (ins = $('#' + obj.insertAfter))) {
                    ins.after(menuitem);
                    return;
                }
                if (obj.insertBefore && (ins = $('#' + obj.insertBefore))) {
                    ins.before(menuitem);
                    return;
                }
                if (obj.position && parseInt(obj.position, 10) > 0) {
                    (ins = chldren[parseInt(obj.position, 10) - 1]) ?
                        ins.parentNode.insertBefore(menuitem, ins) :
                        insertPoint.parentNode.appendChild(menuitem);
                    return;
                }
                insertPoint.before(menuitem);
            }
        },
        removeMenuitem: function () {
            var remove = function (e) {
                if (e.matches('.addMenuNot')) {
                    if (typeof e.originAttributes === "object") {
                        e.getAttributeNames().forEach(function (attr) {
                            e.removeAttr(attr);
                        });
                        for (let key in e.originAttributes) {
                            e.attr(key, e.originAttributes[key]);
                        }
                    }
                    e.removeClass('addMenuNot');
                    return;
                }
                e.remove();
            };

            $$('.addMenuOriginal').forEach((e) => {
                let id = e.attr('original-id');
                if (id && $(id))
                    e.before($(id));
                e.remove();
            });

            $$('menu.addMenu, menugroup.addMenu').forEach(remove);
            $$('.addMenu').forEach(remove);
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
                const validConditions = ["normal", "select", "link", "mailto", "image", "canvas", "media", "input", "completed-image"];
                const conditions = obj.condition.split(' ')
                    .filter(c => c && (c === "normal" || validConditions.includes(c.replace(/^no/, ""))));

                if (conditions.length) {
                    menu.setAttribute("condition", conditions.join(" "));
                }
            } else if (opt.insertPoint?.id === "addMenu-page-insertpoint") {
                menu.setAttribute("condition", "normal");
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

            function convert(str) {
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
                            return "data:image/svg+xml;base64," + btoa(addMenu.ContextMenu.svgHTML);
                        }
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

            function htmlEscape(s) {
                return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
            }

            function getUrl() {
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

            function getHost() {
                const url = getUrl();
                try {
                    const uri = Services.io.newURI(url);
                    return uri.host;
                } catch (ex) {
                    return "";
                }
            }

            function getEmailAddress() {
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

            function img2base64(imgSrc, imgType) {
                if (typeof imgSrc == 'undefined') return "";
                imgType = imgType || "image/png";
                const NSURI = "http://www.w3.org/1999/xhtml";
                var img = new Image();
                var canvas,
                    isCompleted = false;
                img.onload = function () {
                    var width = this.naturalWidth,
                        height = this.naturalHeight;
                    canvas = document.createElementNS(NSURI, "canvas");
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0);
                    isCompleted = true;
                };
                img.onerror = () => {
                    console.error(lprintf('could not load', imgSrc));
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
        },
        getSelectedText() {
            return this._selectedText;
        },
        setSelectedText(aText) {
            this._selectedText = aText;
        },
        setFaviconLink({ hash, href }) {
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
            alert(lprintf('please set editor path'));

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
    function $C(name, attr = {}) {
        const el = document.createXULElement(name);
        for (let [key, value] of Object.entries(attr)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                el.addEventListener(eventName, typeof value === 'string' ? new Function('event', value) : value);
            } else {
                el.setAttribute(key, value);
            }
        }
        return el;
    }
    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    function capitalize(s) {
        return s && s[0].toUpperCase() + s.slice(1);
    }

    function lprintf(key, ...args) {
        const localeData = ADDMENU_LANG[ADDMENU_LOCALE];
        if (key && localeData?.[key]) {
            return args.reduce((str, arg) => str.replace('%s', arg), localeData[key]);
        }
        return capitalize(key || '');
    }
    function processOnShowing(menu, menuObj, insertPoint) {
        if (menuObj.onshowing) {
            this.customShowings.push({
                item: menu,
                insertPoint: insertPoint.id,
                fnSource: menuObj.onshowing.toString()
            });
            delete menuObj.onshowing;
        }

        if (menuObj.onshowinglabel) {
            menu.dataset.onshowinglabel = menuObj.onshowinglabel;
            this.customShowings.push({
                item: menu,
                insertPoint: insertPoint.id,
                fnSource: function () {
                    let t = addMenu.convertText(this.dataset.onshowinglabel);
                    if (t && t.length > onshowinglabelMaxLength)
                        t = t.substr(0, onshowinglabelMaxLength) + "...";
                    this.setAttribute('label', t);
                }.toString()
            });
            delete menuObj.onshowinglabel;
        }
    }

    function setImage(menu, imageUrl) {
        if (imageUrl) {
            if (enableConvertImageAttrToListStyleImage) {
                menu.style.listStyleImage = `url(${imageUrl})`;
                menu.removeAttribute("image");
            } else {
                menu.setAttribute("image", imageUrl);
            }
        }
    }

    function resolveChromeURL(fileUrl) {
        return fileUrl.replace("file:///" + PathUtils.profileDir.replace(/\\/g, '/') + "/chrome", "chrome://userchrome/content")
    }

    window.addMenu.init();
})(`
.addMenuHide {
    display: none !important;
}
#contentAreaContextMenu > .addMenu[condition]:not(menugroup),
#contentAreaContextMenu > menugroup > .addMenu[condition],
#contentAreaContextMenu menugroup.addMenu[condition] {
    display: none;
    visibility: collsapse;
}
#contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="link"],
#contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="mailto"],
#contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="image"],
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
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > .addMenu:is(menu, menuitem) > .menu-iconic-left,
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu >.addMenu.showText > .menu-iconic-left,
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showText >.addMenu > .menu-iconic-left,
:is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showFirstText > .menuitem-iconic:first-child > .menu-iconic-left {
    visibility: collapse;
}
menugroup.addMenu > .menuitem-iconic.fixedSize {
    -moz-box-flex: 0;
    flex-grow: 0;
    flex-shrink: 0;
    padding-inline-end: 8px;
}
menugroup.addMenu > .menuitem-iconic {
    -moz-box-flex: 1;
    -moz-box-pack: center;
    -moz-box-align: center;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    padding-block: 6px;
    padding-inline-start: 1em;
}
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left {
    -moz-appearance: none;
    padding-top: 0;
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
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText),
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) {
    padding-left: 0;
    -moz-box-flex: 0;
    flex-grow: 0;
    flex-shrink: 0;
    padding-inline-end: 0;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > .menu-iconic-left,
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-left {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
}
`, f => {
    return Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(f);
}, p => {
    let ic = false, data = "";
    IOUtils.readUTF8(p).then((d) => {
        data = d;
    }).catch(e => {
        console.error(e);
    }).finally(_ => {
        ic = true;
    });
    const t = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
    while (!ic) {
        t.processNextEvent(true);
    }
    try {
        data = decodeURIComponent(escape(data));
    } catch (e) { }
    return data;
}, (p, d = "") => {
    if (!d) return false;
    let ic = false, flag = false
    IOUtils.writeUTF8(p, d).then(() => {
        flag = true;
    }).catch(e => {
        console.error(e);
    }).finally(_ => {
        ic = true;
    });
    const t = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
    while (!ic) {
        t.processNextEvent(true);
    }
    return flag;
}, v => {
    return Services.vc.compare(Services.appinfo.version, v) >= 0;
}, menu => menu.matches(".menuitem-iconic, .menu-iconic"),
    v => v !== undefined && v !== null);
export { AddMenuChild, AddMenuParent };
class AddMenuChild extends JSWindowActorChild {
    executeInChrome(func, args) {
        let json = {
            func: func.toString(),
            args: JSON.stringify(args)
        }
        this.sendAsyncMessage("AddMenuPlus:executeInChrome",
            json
        );
    }
    receiveMessage({ name, data }) {
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
            case "AddMenuPlus:ContextMenu":
                // 获取鼠标 focus 的元素
                const focusedElement = doc.activeElement;
                const svgEl = focusedElement.closest("svg");
                const inputEl = focusedElement.closest("input");
                const textareaEl = focusedElement.closest("textarea");
                this.sendAsyncMessage("AddMenuPlus:SetFocusStatus", {
                    onSvg: !!svgEl,
                    svgHTML: svgEl ? svgEl.outerHTML : "",
                    onInput: !!inputEl,
                    inputValue: inputEl ? inputEl.value : "",
                    inputHTML: inputEl ? inputEl.outerHTML : "",
                    onTextarea: !!textareaEl,
                    textareaValue: textareaEl ? textareaEl.value : "",
                    textareaHTML: textareaEl ? textareaEl.outerHTML : "",
                });
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

        function getSelectedText(win) {
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
    receiveMessage({ name, data }) {
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
                case 'AddMenuPlus:SetFocusStatus':
                    Object.assign(addMenu.ContextMenu, data);
                    break;
                case 'AddMenuPlus:executeInChrome':
                    addMenu.executeInChrome(data.func, data.args);
                    break;
            }
        } catch (e) { }
    }
}