// ==UserScript==
// @name           OpenWithHelper.uc.js
// @version        1.0.7
// @author         Ryan
// @include        main
// @sandbox        true
// @compatibility  Firefox 72   
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    使用第三方应用打开网页
// @note           1.0.7 减少管理面板 inline css，集中样式定义
// @note           1.0.6 改用 ModalDialog 来配置应用, 优化拖拽体验
// @note           1.0.5 Bug 1369833 Remove `alertsService.showAlertNotification` call once Firefox 147
// @note           1.0.4 修复 Fx143 图标显示异常
// @note           1.0.3 增加选择目录功能
// @note           1.0.2 增加选择目录参数，修复选项打不开的问题
// @note           1.0.1 修复
// ==/UserScript==
if (location.href.startsWith("chrome://browser/content/browser.x")) {
    (async function (CSS, DEFINED_DIRS /* 预定义的一些路径 */, FILE_PATH /* 配置文件路径 */, versionGE /* 版本号大于等于 */, syncify) {
        const DEFAULT_SAVE_DIR = DEFINED_DIRS['Desk']; // 默认保存路径为桌面
        if (window.OpenWithHelper) return;

        const AlertNotification = Components.Constructor(
            "@mozilla.org/alert-notification;1",
            "nsIAlertNotification",
            "initWithObject"
        );

        const AlertImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwMDAwMDAiPjxkZWZzPjxwYXRoIGlkPSJmZU5vdGljZVB1c2gwIiBkPSJNMTcgMTFhNCA0IDAgMSAxIDAtOGE0IDQgMCAwIDEgMCA4Wk01IDVoNnYySDV2MTJoMTJ2LTZoMnY2YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjdhMiAyIDAgMCAxIDItMloiLz48L2RlZnM+PGcgaWQ9ImZlTm90aWNlUHVzaDEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiPjxnIGlkPSJmZU5vdGljZVB1c2gyIj48bWFzayBpZD0iZmVOb3RpY2VQdXNoMyIgZmlsbD0iIzAwMDAwMCI+PHVzZSBocmVmPSIjZmVOb3RpY2VQdXNoMCIvPjwvbWFzaz48dXNlIGlkPSJmZU5vdGljZVB1c2g0IiBmaWxsPSIjMDAwMDAwIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGhyZWY9IiNmZU5vdGljZVB1c2gwIi8+PC9nPjwvZz48L3N2Zz4=';

        window.OpenWithHelper = {
            get saveDir () {
                let dir = Services.prefs.getStringPref("userChromeJS.OpenWithHelper.SAVE_DIR", DEFAULT_SAVE_DIR);
                if (dir.startsWith("{") && dir.endsWith("}")) {
                    let matched = (dir.match(/^\{[^\}]+\}$/) || ["", ""])[1]
                    if (matched.length > 0 && Object.keys(DEFINED_DIRS).includes(matched)) {
                        return DEFINED_DIRS[matched]
                    }
                }
                return dir;
            },
            set saveDir (dir) {
                dir = dir.replace(/[\\\/]*$/g, ""); // 处理 Windows 下反斜杠的问题
                for (let [key, value] of Object.entries(DEFINED_DIRS)) {
                    if (dir === value) {
                        dir = "{" + key + "}";
                    }
                }
                Services.prefs.setStringPref("userChromeJS.OpenWithHelper.SAVE_DIR", dir);
            },
            openSaveDir () {
                this.exec(this.saveDir);
            },
            getAppList: async function () {
                let APPS_LIST;
                try {
                    if (!await IOUtils.exists(FILE_PATH)) {
                        await IOUtils.writeUTF8(FILE_PATH, JSON.stringify([]));
                        APPS_LIST = [];
                    } else {
                        let data = await IOUtils.readUTF8(FILE_PATH);
                        APPS_LIST = JSON.parse(data);
                    }
                } catch (e) {
                    APPS_LIST = [];
                }
                return APPS_LIST;
            },
            async selectDirectory (titleKey = "change-download-dir") {
                const mode = Ci.nsIFilePicker.modeGetFolder;
                const title = await this.l10n.formatValue(titleKey);
                return new Promise(resolve => {
                    const fp = makeFilePicker();
                    fp.init(
                        !("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                            ? window.browsingContext
                            : window,
                        title,
                        mode
                    );
                    fp.open(result => {
                        if (result === Ci.nsIFilePicker.returnOK) {
                            resolve({ result, path: fp.file.path });
                        } else {
                            resolve({ result, path: null });
                        }
                    });
                });
            },
            async changeSaveDir () {
                const status = await this.selectDirectory("change-download-dir");
                if (status.result === Ci.nsIFilePicker.returnOK) {
                    this.saveDir = status.path;
                    const textIfOK = await this.l10n.formatValue("operation-succeeded");
                    alerts(textIfOK);
                } else {
                    const textIfCanceled = await this.l10n.formatValue("operation-canceled");
                    alerts(textIfCanceled);
                }
            },
            init: async function () {
                this.initRegexp();
                if (versionGE("143a1")) {
                    CSS = CSS.replaceAll('list-style-image', '--menuitem-icon');
                    CSS = `#OpenWithHelper-Btn { list-style-image: var(--menuitem-icon); }\n` + CSS;
                }
                let pi = document.createProcessingInstruction(
                    'xml-stylesheet',
                    'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(CSS) + '"'
                );
                this.style = document.insertBefore(pi, document.documentElement);

                if (typeof userChrome_js === "object" && "L10nRegistry" in userChrome_js) {
                    this.l10n = new DOMLocalization(["OpenWithHelper.ftl"], false, userChrome_js.L10nRegistry);
                } else {
                    this.l10n = {
                        formatValue: async function () {
                            return "";
                        },
                        formatMessages: async function () {
                            return "";
                        }
                    }
                }

                let tp = gBrowser.tabpanels;["mouseup", "keydown"].forEach(type => tp.addEventListener(type, this, false));

                if (!(CustomizableUI.getWidget('OpenWithHelper-Btn') && CustomizableUI.getWidget('OpenWithHelper-Btn').forWindow(window)?.node)) {
                    try {
                        CustomizableUI.createWidget({
                            id: 'OpenWithHelper-Btn',
                            removable: true,
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onCreated: node => {
                                for (let [key, value] of Object.entries({
                                    'data-l10n-id': 'open-with-helper',
                                    contextmenu: false,
                                    type: "menu"
                                })) {
                                    node.setAttribute(key, value);
                                }
                                let popup = this.createBasicPopup(node.ownerDocument);
                                popup.id = 'OpenWithHelper-Btn-Popup';
                                node.appendChild(popup);
                            },
                            onDestroyed: node => {

                            }
                        });
                    } catch (e) { }
                }

                this.btn = CustomizableUI.getWidget('OpenWithHelper-Btn').forWindow(window)?.node;

                this.BTN_POPUP = $(":scope>menupopup", this.btn);

                this.BTN_POPUP.addEventListener("popupshowing", this, false);
                this.btn.addEventListener("mouseover", (event) => {
                    if (event.target.id !== "OpenWithHelper-Btn") return;
                    // 调整弹出菜单位置，按钮放在浏览器4个角都不一样
                    const menupopup = event.target.querySelector("#OpenWithHelper-Btn-Popup");
                    if (!menupopup) return;
                    const { innerWidth: w, innerHeight: h } = event.target.ownerGlobal;
                    const position = event.clientX > w / 2
                        ? (event.clientY < h / 2 ? 'after_end' : 'topright bottomright')
                        : (event.clientY < h / 2 ? '' : 'topleft bottomleft');
                    menupopup.setAttribute("position", position);
                });

                this.initMenu(false);

                $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
                $("tabContextMenu").addEventListener("popupshowing", this, false);

                [this.btn, this.CTX_MENU, this.TAB_MENU].forEach(node => {
                    setText(node);
                    $$('[data-l10n-id]', node, async el => setText(el));
                    async function setText (el) {
                        if (!el) return;
                        const l10nId = el.getAttribute("data-l10n-id");
                        const l10nArgs = el.getAttribute("data-l10n-args");
                        const args = l10nArgs ? JSON.parse(l10nArgs) : undefined;
                        const [msg] = await OpenWithHelper.l10n.formatMessages([
                            { id: l10nId, args },
                        ]);
                        if (msg) {
                            let label = msg.attributes.find(a => a.name === "label")?.value;
                            if (label)
                                el.setAttribute("label", label);
                            let tooltiptext = msg.attributes.find(a => a.name === "tooltiptext")?.value;
                            if (tooltiptext)
                                el.setAttribute("tooltiptext", tooltiptext);
                        }
                    }
                });
            },
            initRegexp: function () {
                // 初始化正则
                let he = "(?:_HTML(?:IFIED)?|_ENCODE|_QUOT|_TXT)?";
                let rTITLE = "%TITLE" + he + "%|%t\\b";
                let rTITLES = "%TITLES" + he + "%|%t\\b";
                let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
                let rSEL = "%SEL" + he + "%|%s\\b";
                let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
                let rIMAGE = "%IMAGE_(?:URL|ALT|TITLE)" + he + "%|%i\\b";
                let rMEDIA = "%MEDIA_URL" + he + "%|%m\\b";
                let rExt = "%EOL" + he + "%";
                let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
                let rRLT_OR_UT = "%RLT_OR_UT" + he + "%";
                let rCOOKIE = "%COOKIE" + he + "%";
                let rCOOKIE_NESCAPE = "%COOKIE_NETSCAPE" + he + "%|%cn\\b";
                let rCOOKIE_HOST = "%COOKIE_HOST" + he + "%|%ch\\b";
                let rCOOKIES_SQLITE = "%COOKIES_SQLITE" + he + "%|%cs\\b";
                let rSAVE_DIR = "%SAVE_DIR" + he + "%|%sd\\b";
                let rPROFILE_DIR = "%PROFILE_DIR" + he + "%|%pd\\b";
                let rCHOOSE_DIR = "%CHOOSE_DIR" + he + "%|%cd\\b";

                let R = { rTITLE, rTITLES, rURL, rSEL, rLINK, rIMAGE, rMEDIA, rCLIPBOARD, rExt, rRLT_OR_UT, rCOOKIE, rCOOKIE_NESCAPE, rCOOKIE_HOST, rCOOKIES_SQLITE, rSAVE_DIR, rPROFILE_DIR, rCHOOSE_DIR };
                for (let [k, v] of Object.entries(R)) {
                    this[k] = new RegExp(v, "i");
                }
                this.regexp = new RegExp(Object.values(R).join("|"), "ig");
            },
            // ========== 管理面板相关代码开始 ==========
            openManagePanel: async function () {
                if (!this._managePanel) {
                    this._managePanel = new ManageAppsPanel(this);
                }
                await this._managePanel.show();
            },
            // ========== 管理面板相关代码结束 ==========
            initMenu: async function (isAlert, doc) {
                doc || (doc = document);
                let CTX_POPUP = this.createBasicPopup(doc);
                CTX_POPUP.id = 'OpenWithHelper-Ctx-Popup';
                CTX_POPUP.addEventListener("popupshowing", this, false);
                let CTX_MENU = createElement(doc, 'menu', { id: 'OpenWithHelper-Ctx-Menu', 'data-l10n-id': 'open-with-applications', label: "使用应用打开" });
                // remove the comment to hide context menu icon for firefox 90+
                // if (GE_90) {
                //     CTX_MENU.classList.remove("menu-iconic");
                // }
                CTX_MENU.addEventListener('click', function (e) {
                    // 增加右键一级菜单点击功能
                    if (e.target !== e.currentTarget) return;
                    CTX_MENU.querySelector("[dynamic=true][exec]").doCommand();
                }, false);
                this.CTX_MENU = CTX_MENU;
                this.CTX_POPUP = CTX_MENU.appendChild(CTX_POPUP);
                $('contentAreaContextMenu')?.insertBefore(CTX_MENU, $('#contentAreaContextMenu > menuseparator:last-child'));
                let TAB_POPUP = this.createBasicPopup(doc);
                TAB_POPUP.id = 'OpenWithHelper-Tab-Popup';
                TAB_POPUP.addEventListener("popupshowing", this, false);
                let TAB_MENU = createElement(doc, 'menu', { id: 'OpenWithHelper-Tab-Menu', 'data-l10n-id': 'open-with-applications', label: "使用应用打开" });
                this.TAB_MENU = TAB_MENU;
                this.TAB_POPUP = TAB_MENU.appendChild(TAB_POPUP);
                $('tabContextMenu')?.insertBefore(TAB_MENU, $('context_reopenInContainer')?.nextElementSibling);
                if (isAlert) {
                    OpenWithHelper.l10n.formatValue("menu-refreshed").then(text => alerts(text));
                }
            },
            createBasicPopup: function (doc) {
                let menupopup = createElement(doc, 'menupopup', { class: 'owh-popup', 'need-reload': true });
                menupopup.appendChild(createElement(doc, 'menuseparator', { static: true, class: 'owh-separator' }));
                menupopup.appendChild(createElement(doc, "menuitem", { static: true, 'data-l10n-id': 'open-download-dir', label: "打开下载目录", class: "folder", oncommand: function (event) { OpenWithHelper.openSaveDir(event); } }));
                menupopup.appendChild(createElement(doc, "menuitem", { static: true, 'data-l10n-id': 'change-download-dir', label: "更改下载目录", class: "settings", oncommand: function (event) { OpenWithHelper.changeSaveDir(event); } }));
                menupopup.appendChild(createElement(doc, 'menuitem', { static: true, 'data-l10n-id': 'manage-applications', label: "管理应用", class: "settings", oncommand: function (event) { OpenWithHelper.openManagePanel(event); } }));
                menupopup.appendChild(createElement(doc, 'menuitem', { static: true, 'data-l10n-id': 'about-open-with-helper', label: "关于", class: "info", url: 'https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS/OpenWithHelper', where: 'tab', oncommand: function (event) { OpenWithHelper.onCommand(event); } }));
                return menupopup;
            },
            reload (isAlert = false) {
                if (this.BTN_POPUP)
                    this.BTN_POPUP.setAttribute("need-reload", "true");
                if (this.CTX_POPUP)
                    this.CTX_POPUP.setAttribute("need-reload", "true");
                if (this.TAB_POPUP)
                    this.TAB_POPUP.setAttribute("need-reload", "true");
                if (isAlert) {
                    OpenWithHelper.l10n.formatValue("menu-refreshed").then(text => alerts(text));
                }
            },
            reloadApps: async function (menupopup) {
                const doc = menupopup.ownerDocument;
                menupopup.querySelectorAll("[dynamic=true]").forEach(el => {
                    el.parentNode.removeChild(el);
                });
                let insertPoint = menupopup.querySelector(".owh-separator");
                (await this.getAppList()).forEach((app) => {
                    if (isSeparatorConfig(app)) {
                        let sep = menupopup.insertBefore(createElement(doc, "menuseparator", app), insertPoint);
                        sep.setAttribute("dynamic", true);
                        this.setCondition(sep, app.condition);
                        return;
                    }
                    if (!"exec" in app && !"url" in app) return;
                    let { label, exec, url, text, oncommand } = app;
                    if ("exec" in app) app.filename = exec.split(/\\|\//).pop();
                    if (typeof label === "undefined") {
                        if (typeof exec === "string") {
                            // 没有标签则取可执行文件的名字为标签
                            label = exec.split(/\\|\//).pop();
                        } else if (typeof url === "string") {
                            // 没有标签则取 url 为标签
                            label = url;
                        } else {
                            label = text;
                        }
                    }
                    if (typeof exec !== "undefined") {
                        app.exec = handleRelativePath(exec);
                    }
                    if (typeof oncommand === "undefined") {
                        app.oncommand = function (event) {
                            OpenWithHelper.onCommand(event);
                        }
                    }
                    Object.assign(app, { label, dynamic: true });
                    let menuitem = createElement(doc, 'menuitem', app);
                    this.setIcon(menuitem, app);
                    this.setCondition(menuitem, app.condition);
                    menupopup.insertBefore(menuitem, insertPoint);
                });
                this.updateDynamicVisibility(menupopup);
                menupopup.setAttribute("need-reload", "false");
            },
            getConditionContextTokens: function () {
                return ["page", "frame", "input", "select", "link", "mailto", "image", "canvas", "media"];
            },
            getConditionPageKinds: function () {
                return ["web", "internal", "local"];
            },
            getDefaultConditionModel: function () {
                return {
                    targets: {
                        button: true,
                        tab: false,
                        context: true
                    },
                    pageScope: {
                        button: ["web"],
                        tab: ["web"]
                    },
                    contexts: ["page", "link"],
                    legacyExcludes: []
                };
            },
            normalizeConditionModel: function (model) {
                const pageKinds = new Set(this.getConditionPageKinds());
                const contextTokens = new Set(this.getConditionContextTokens());
                const supportedTokens = new Set([
                    "button",
                    "tab",
                    "normal",
                    ...this.getConditionPageKinds(),
                    ...this.getConditionContextTokens()
                ]);
                const normalized = {
                    targets: {
                        button: !!model?.targets?.button,
                        tab: !!model?.targets?.tab,
                        context: !!model?.targets?.context
                    },
                    pageScope: {
                        button: uniqueArray((model?.pageScope?.button || []).filter(token => pageKinds.has(token))),
                        tab: uniqueArray((model?.pageScope?.tab || []).filter(token => pageKinds.has(token)))
                    },
                    contexts: uniqueArray((model?.contexts || []).map(token => token === "normal" ? "page" : token).filter(token => contextTokens.has(token))),
                    legacyExcludes: uniqueArray((model?.legacyExcludes || []).map(token => token === "normal" ? "page" : token).filter(token => supportedTokens.has(token)))
                };

                if (!normalized.targets.button) {
                    normalized.pageScope.button = [];
                }
                if (!normalized.targets.tab) {
                    normalized.pageScope.tab = [];
                }
                if (!normalized.targets.context) {
                    normalized.contexts = [];
                }

                return normalized;
            },
            isSameTokenList: function (a = [], b = []) {
                if (a.length !== b.length) {
                    return false;
                }
                return a.every((token, index) => token === b[index]);
            },
            isDefaultConditionModel: function (model) {
                const normalized = this.normalizeConditionModel(model);
                const defaults = this.normalizeConditionModel(this.getDefaultConditionModel());
                return normalized.targets.button === defaults.targets.button
                    && normalized.targets.tab === defaults.targets.tab
                    && normalized.targets.context === defaults.targets.context
                    && this.isSameTokenList(normalized.pageScope.button, defaults.pageScope.button)
                    && this.isSameTokenList(normalized.pageScope.tab, defaults.pageScope.tab)
                    && this.isSameTokenList(normalized.contexts, defaults.contexts)
                    && normalized.legacyExcludes.length === 0;
            },
            parseConditionModel: function (menu, condition) {
                const tokens = (condition || "")
                    .toLowerCase()
                    .split(/\s+/)
                    .map(token => token.trim())
                    .filter(Boolean);

                if (!tokens.length) {
                    return this.getDefaultConditionModel(menu);
                }

                const pageKinds = new Set(this.getConditionPageKinds());
                const contextTokens = new Set(this.getConditionContextTokens());
                const model = {
                    targets: {
                        button: false,
                        tab: false,
                        context: false
                    },
                    pageScope: {
                        button: [],
                        tab: []
                    },
                    contexts: [],
                    legacyExcludes: []
                };
                const explicitTargetScopes = {
                    button: false,
                    tab: false
                };
                const explicitTargets = new Set();
                const globalPageKinds = [];

                for (const token of tokens) {
                    const isNegative = token.startsWith("no");
                    const normalized = isNegative ? token.slice(2) : token;
                    if (!normalized) {
                        continue;
                    }

                    const scopedMatch = normalized.match(/^(button|tab)-(web|internal|local)$/);
                    if (scopedMatch) {
                        if (isNegative) {
                            continue;
                        }
                        const [, target, pageKind] = scopedMatch;
                        model.targets[target] = true;
                        model.pageScope[target].push(pageKind);
                        explicitTargetScopes[target] = true;
                        explicitTargets.add(target);
                        continue;
                    }

                    if (normalized === "button" || normalized === "tab") {
                        if (isNegative) {
                            model.legacyExcludes.push(normalized);
                        } else {
                            model.targets[normalized] = true;
                            explicitTargets.add(normalized);
                        }
                        continue;
                    }

                    if (pageKinds.has(normalized)) {
                        if (isNegative) {
                            model.legacyExcludes.push(normalized);
                        } else {
                            globalPageKinds.push(normalized);
                        }
                        continue;
                    }

                    const contextToken = normalized === "normal" ? "page" : normalized;
                    if (contextTokens.has(contextToken)) {
                        if (isNegative) {
                            model.legacyExcludes.push(contextToken);
                        } else {
                            model.targets.context = true;
                            model.contexts.push(contextToken);
                        }
                    }
                }

                if (globalPageKinds.length) {
                    const targets = explicitTargets.size ? [...explicitTargets] : ["button", "tab"];
                    for (const target of targets) {
                        model.targets[target] = true;
                        model.pageScope[target].push(...globalPageKinds);
                    }
                }

                const allPageKinds = this.getConditionPageKinds();
                for (const target of ["button", "tab"]) {
                    if (!model.targets[target]) {
                        continue;
                    }
                    if (!model.pageScope[target].length && !explicitTargetScopes[target]) {
                        model.pageScope[target] = [...allPageKinds];
                    }
                }

                return this.normalizeConditionModel(model);
            },
            serializeConditionModel: function (model) {
                const normalized = this.normalizeConditionModel(model);
                if (this.isDefaultConditionModel(normalized)) {
                    return "";
                }

                const tokens = [];
                if (normalized.targets.button) {
                    tokens.push("button");
                    normalized.pageScope.button.forEach(pageKind => tokens.push(`button-${pageKind}`));
                }
                if (normalized.targets.tab) {
                    tokens.push("tab");
                    normalized.pageScope.tab.forEach(pageKind => tokens.push(`tab-${pageKind}`));
                }
                if (normalized.targets.context) {
                    tokens.push(...normalized.contexts);
                }

                return uniqueArray(tokens).join(" ");
            },
            collectContextStates: function () {
                const states = [];
                const contextMenu = gContextMenu;
                if (!contextMenu) {
                    return states;
                }

                if (contextMenu.onTextInput) {
                    states.push("input");
                }
                if (contextMenu.isContentSelected || contextMenu.isTextSelected) {
                    states.push("select");
                }
                const openCurrentItem = $("contentAreaContextMenu")?.querySelector("#context-openlinkincurrent");
                const hasLinkTarget = contextMenu.onLink || (!!openCurrentItem && openCurrentItem.getAttribute("hidden") !== "true" /* 兼容 textLink.uc.js */);
                if (hasLinkTarget) {
                    states.push(contextMenu.onMailtoLink ? "mailto" : "link");
                }
                if (contextMenu.onCanvas) {
                    states.push("canvas", "image");
                }
                if (contextMenu.onImage) {
                    states.push("image");
                }
                if (contextMenu.onVideo || contextMenu.onAudio) {
                    states.push("media");
                }
                if (contextMenu.inFrame) {
                    states.push("frame");
                }
                if (!states.some(token => ["input", "select", "link", "mailto", "image", "canvas", "media"].includes(token))) {
                    states.push("page", "normal");
                }

                return uniqueArray(states);
            },
            getBrowserURI: function (browser) {
                const uriList = [browser?.currentURI, browser?.documentURI, browser?.originalURI].filter(Boolean);
                return uriList.find(uri => uri?.spec && uri.spec !== "about:blank") || uriList[0] || null;
            },
            getPageKindFromURI: function (uri) {
                const scheme = (uri?.scheme || "").toLowerCase();
                if (["http", "https"].includes(scheme)) {
                    return "web";
                }
                if (["about", "chrome", "resource", "moz-extension"].includes(scheme)) {
                    return "internal";
                }
                if (["file", "data", "blob"].includes(scheme)) {
                    return "local";
                }
                return "other";
            },
            getPopupPageKind: function (popupType) {
                const tab = popupType === "tab"
                    ? (TabContextMenu.contextTab || gBrowser.selectedTab)
                    : gBrowser.selectedTab;
                return this.getPageKindFromURI(this.getBrowserURI(tab?.linkedBrowser));
            },
            matchesCondition: function (menu, popupType, contextStates = [], pageKind = "other") {
                const model = menu._owhConditionModel || this.parseConditionModel(menu, menu.getAttribute("condition") || "");
                const negatives = new Set(model.legacyExcludes || []);

                if (popupType === "button" || popupType === "tab") {
                    if (negatives.has(popupType) || negatives.has(pageKind)) {
                        return false;
                    }
                    if (!model.targets?.[popupType]) {
                        return false;
                    }
                    return !!model.pageScope?.[popupType]?.includes(pageKind);
                }

                if (!model.targets?.context) {
                    return false;
                }

                const contextTokenSet = new Set(contextStates);
                if (contextTokenSet.has("page")) {
                    contextTokenSet.add("normal");
                }
                if (contextTokenSet.has("normal")) {
                    contextTokenSet.add("page");
                }

                if ([...negatives].some(token => contextTokenSet.has(token))) {
                    return false;
                }

                return model.contexts.some(token => contextTokenSet.has(token));
            },
            normalizeDynamicSeparators: function (menupopup) {
                const dynamicNodes = [...menupopup.querySelectorAll(":scope > :is(menu, menuitem, menugroup, menuseparator)[dynamic=true]")];
                let previousVisibleIsSeparator = true;

                for (const node of dynamicNodes) {
                    if (node.hidden) {
                        continue;
                    }

                    if (node.nodeName === "menuseparator") {
                        if (previousVisibleIsSeparator) {
                            node.hidden = true;
                            continue;
                        }
                        previousVisibleIsSeparator = true;
                        continue;
                    }

                    previousVisibleIsSeparator = false;
                }

                for (let i = dynamicNodes.length - 1; i >= 0; i--) {
                    const node = dynamicNodes[i];
                    if (node.hidden) {
                        continue;
                    }
                    if (node.nodeName === "menuseparator") {
                        node.hidden = true;
                    }
                    break;
                }
            },
            updateDynamicVisibility: function (menupopup) {
                const popupType = {
                    "OpenWithHelper-Btn-Popup": "button",
                    "OpenWithHelper-Tab-Popup": "tab",
                    "OpenWithHelper-Ctx-Popup": "context"
                }[menupopup?.id];
                if (!popupType) {
                    return;
                }

                const contextStates = popupType === "context" ? this.collectContextStates() : [];
                const pageKind = popupType === "context" ? "other" : this.getPopupPageKind(popupType);
                const dynamicNodes = menupopup.querySelectorAll(":scope > :is(menu, menuitem, menugroup, menuseparator)[dynamic=true]");
                for (const node of dynamicNodes) {
                    node.hidden = !this.matchesCondition(node, popupType, contextStates, pageKind);
                }

                this.normalizeDynamicSeparators(menupopup);

                const staticSeparator = menupopup.querySelector(".owh-separator");
                if (staticSeparator) {
                    staticSeparator.hidden = !menupopup.querySelector(":scope > menuitem[dynamic=true]:not([hidden])");
                }
            },
            destroy: function () {
                gBrowser.tabpanels.removeEventListener("mouseup", this, false);
                $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
                $("tabContextMenu").removeEventListener("popupshowing", this, false);
                document.querySelectorAll(".owh-popup").forEach(el => {
                    if (el.parentNode)
                        el.parentNode.removeChild(el)
                });
                CustomizableUI.destroyWidget('OpenWithHelper-Btn');
            },
            handleEvent: async function (event) {
                let isSelectKeyDown = false;
                switch (event.type) {
                    case "keydown":
                        // 如果不是 Ctrl + A 则返回
                        if (!event.ctrlKey || event.keyCode !== 65) isSelectKeyDown = true;
                    case "mouseup":
                        if (event.button !== 0 && !isSelectKeyDown) return;
                        // 鼠标按键释放时读取选中文本
                        if (content) {
                            this.selectedText = content.getSelection().toString();
                        } else {
                            try {
                                // 这个 API 有问题
                                gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                                    this.selectedText = r.selectedText;
                                })
                            } catch (e) { }
                        }
                        break;
                    case "popupshowing":
                        if (event.target != event.currentTarget) return;
                        event.stopPropagation();
                        if (event.target.getAttribute("need-reload") === "true") {
                            await this.reloadApps(event.target);
                        }
                        if (event.target.id == 'contentAreaContextMenu') {
                            $("OpenWithHelper-Ctx-Menu").setAttribute("openWith", this.collectContextStates().join(" "));
                        } else if (event.target.id === "tabContextMenu") {

                        } else if (event.target.classList.contains("owh-popup")) {
                            this.updateDynamicVisibility(event.target);
                        }
                        break;
                }
            },
            convertText (text) {
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
                    if (str.indexOf("_TXT") >= 0) {
                        // 相比 addMenu 新增保存为 TXT 文件后缀 eg  %COOKIE_HOST_TXT% 保存当前网站的 COOKIE 为 域名.TXT 文件
                        let data = convert(str.replace("_TXT", ""));
                        let filename = (convert("%RLINK_HOST%") || convert("%H")) + ".txt";
                        let filepath = PathUtils.join(DEFINED_DIRS["TmpD"], filename);
                        saveFile(filepath, data);
                        return filepath;
                    }
                    if (str.indexOf("_QUOT") >= 0)
                        return convert(str.replace("_QUOT", "")).replace(/"/g, '\\"');
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
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%SEL%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%SL":
                        case "%SEL_OR_LT%":
                        case "%SEL_OR_LINK_TEXT%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || context.linkText();
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
                        case "%M":
                            return context.mediaURL || "";
                        case "%MEDIA_URL%":
                            return context.mediaURL || "";
                        case "%P":
                            return readFromClipboard() || "";
                        case "%CLIPBOARD%":
                            return readFromClipboard() || "";
                        case "%PD":
                        case "%PROFILE_DIR%":
                            // 配置文件夹路径
                            return PathUtils.profileDir || "";
                        case "%SD":
                        case "%SAVE_DIR%":
                            return OpenWithHelper.saveDir || DEFAULT_SAVE_DIR;
                        case "%COOKIE%":
                            return collectCookies(OpenWithHelper.convertText("%LINK_OR_URL%"));
                        case "%CN":
                        case "%COOKIE_NETSCAPE%":
                            let netscapeStyle = true; // Nescapte 格式 Cookie
                        case "%CH":
                        case "%COOKIE_HOST%":
                            let cookiesURL = OpenWithHelper.convertText("%LINK_OR_URL%");
                            let cookiesURI;
                            try {
                                cookiesURI = Services.io.newURI(cookiesURL, null, null);
                            } catch (e) {
                                return "";
                            }
                            let cookies = collectCookies(cookiesURI.prePath, netscapeStyle);
                            return cookies;
                        case "%CS":
                        case "%COOKIES_SQLITE%":
                            // 读取 Firefox Cookies 文件 cookies.sqlite 的路径
                            return PathUtils.join(PathUtils.profileDir, "cookies.sqlite");
                        case "%CD":
                        case "%CHOOSE_DIR%":
                            let targetDir = "";
                            const status = syncify(() => OpenWithHelper.selectDirectory("choose-directory"));
                            if (status.result === Ci.nsIFilePicker.returnOK) {
                                targetDir = status.path;
                            } else {
                                const directoryNotChoosedStr = syncify(() => OpenWithHelper.l10n.formatValue("directory-not-choosed"));
                                const operationCanceledStr = syncify(() => OpenWithHelper.l10n.formatValue("operation-canceled"));
                                alerts(directoryNotChoosedStr, operationCanceledStr);
                                throw new Error("用户取消或未选择目录。");
                            }
                            return targetDir;
                        case "%EOL%":
                            return "\r\n";
                    }
                    return str;
                }

                function htmlEscape (s) {
                    return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
                }

                function getUrl () {
                    const pendingURL = typeof bw?.userTypedValue === "string" ? bw.userTypedValue.trim() : "";
                    const uriList = [bw?.currentURI, bw?.documentURI, bw?.originalURI].filter(Boolean);
                    const URI = uriList.find(uri => uri?.spec && uri.spec !== "about:blank") || uriList[0];

                    if (!URI) {
                        return pendingURL;
                    }

                    if (URI.schemeIs?.("about")) {
                        switch (URI.filePath) {
                            case "neterror":
                                return new URLSearchParams(URI.query).get("u") || pendingURL || URI.spec;
                            case "blank":
                                return pendingURL || URI.spec;
                            default:
                                return pendingURL || URI.spec;
                        }
                    }

                    return URI.spec;
                }

                function getHost () {
                    const url = getUrl();
                    try {
                        return Services.io.newURI(url).host;
                    } catch (e) {
                        return "";
                    }
                }
            },
            onCommand: function (event) {
                let url = event.target.getAttribute('url') || "";
                let where = event.target.getAttribute('where') || "";
                let text = event.target.getAttribute('text') || "";
                let exec = event.target.getAttribute('exec') || "";
                if (url) {
                    this.openCommand(event, url, where);
                } else if (exec) {
                    this.exec(exec, this.convertText(text));
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
            exec: function (path, arg) {
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
                        this.error("File not found: %s".replace("%s", path));
                        return;
                    }

                    // Linux 下目录也是 executable
                    if (!file.isDirectory() && file.isExecutable()) {
                        process.init(file);
                        process.runw(false, a, a.length);
                    } else {
                        file.launch();
                    }
                } catch (e) {
                    this.log(e);
                }
            },
            setIcon: function (menu, obj) {
                for (let attr of ["image", "src", "icon"]) {
                    if (menu.getAttribute(attr)) {
                        setImageCSS(menu, "url(" + menu.getAttribute(attr) + ")");
                        menu.removeAttribute(attr);
                        return;
                    }
                }

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
                    } else if (aFile.isFile()) {
                        let fileURL = getURLSpecFromFile(aFile);
                        setImageCSS(menu, `url("moz-icon://${fileURL}?size=16")`);
                    } else {
                        setImageCSS(menu, `url("chrome://global/skin/icons/folder.svg"`)
                    }
                    return;
                }

                function setImageCSS (menu, cssValue) {
                    if (!cssValue) {
                        menu.classList.remove("menu-iconic");
                        menu.classList.remove("menuitem-iconic");
                    }
                    if (versionGE("143a1")) {
                        menu.style.setProperty('--menuitem-icon', cssValue);
                    } else {
                        menu.style.setProperty('list-style-image', cssValue);
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
                                let iconURL = aURI && aURI.spec ?
                                    "moz-anno:favicon:" + aURI.spec :
                                    "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico";
                                menu.setAttribute("image", iconURL);
                            } catch (e) { }
                        }
                    });
                }

                PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                    let url;
                    if (entry) {
                        url = entry.url.href;
                    } else {
                        url = (obj.url + '').replace(R.REGEXP, "");
                    }
                    setIconCallback(url);
                }, e => {
                    this.log(e)
                }).catch(e => { });
            },
            setCondition: function (menu, condition) {
                const rawCondition = typeof condition === "string" ? condition.trim() : "";
                const model = this.parseConditionModel(menu, rawCondition);
                const normalizedCondition = model.legacyExcludes.length && rawCondition
                    ? rawCondition
                    : this.serializeConditionModel(model);
                menu._owhConditionModel = model;
                if (normalizedCondition) {
                    menu.setAttribute("condition", normalizedCondition);
                } else {
                    menu.removeAttribute("condition");
                }
            },
            log: console.log,
            error: console.error
        }

        window.OpenWithHelper.init();
        /**
             * 选取 DOM 元素
             * 
             * @param {string} s id 或者 css 选择器
             * @param {Document|null} d 指定 document，不提供就是全局 document
             * @returns 
             */
        function $ (s, d) {
            return /[#\.[:]/i.test(s.trim()) ? (d || document).querySelector(s) : (d instanceof HTMLDocument ? d : d?.ownerDocument || document).getElementById(s);
        }

        function $$ (s, d, fn) {
            let elems = /[#\.[:]/i.test(s.trim()) ? (d || document).querySelectorAll(s) : (d instanceof HTMLDocument ? d : d?.ownerDocument || document).getElementsByTagName(s);
            if (typeof fn === "function") {
                for (let el of [...elems]) { fn.call(el, el) };
            } return elems;
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
            e = applyAttr(e, o, s);
            if (["menu", "menuitem"].includes(e.nodeName.toLowerCase())) {
                e.classList.add(e.nodeName.toLowerCase() + "-iconic");
            }
            return e;
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
                if (k.startsWith('on') && typeof v === 'function') {
                    e.addEventListener(k.slice(2), v, false);
                } else {
                    e.setAttribute(k, v);
                }
            }
            return e;
        }

        function handleRelativePath (path, parentPath) {
            if (path) {
                var ffdir = parentPath ? parentPath : Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
                // windows 的目录分隔符不一样
                if (AppConstants.platform === "win") {
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

        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        function getURLSpecFromFile (f) {
            return fph.getURLSpecFromActualFile(f);
        }

        function saveFile (path, data) {
            let isCompleted = false, fileExists = false, isError = false;
            IOUtils.exists(path).then(() => {
                isCompleted = true;
                fileExists = true;
            }).catch(() => {
                isCompleted = true;
            });

            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (!isCompleted) {
                thread.processNextEvent(true);
            }

            if (fileExists) {
                isCompleted = false;
                IOUtils.remove(path).then(() => {
                    isCompleted = true;
                }).catch((e) => {
                    isCompleted = true;
                    isError = true;
                    console.error(e);
                });

                var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                while (!isCompleted) {
                    thread.processNextEvent(true);
                }

                if (isError) return;
            }

            isCompleted = false;
            IOUtils.writeUTF8(path, data).then(() => {
                isCompleted = true;
            }).catch((e) => {
                isCompleted = true;
                console.error(e);
            })

            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (!isCompleted) {
                thread.processNextEvent(true);
            }
        }

        function collectCookies (url, NetscapeStyle) {
            let uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) { return ""; }

            let cookies = Services.cookies.getCookiesFromHost(uri.host, {});

            if (NetscapeStyle) {
                return cookies.map(formatCookieNetscapeStyle).join("");
            } else {
                return cookies.map(formatCookie).join("; ");
            }

            function formatCookie (cookiePair) {
                return cookiePair.name + "=" + cookiePair.value;
            }

            function formatCookieNetscapeStyle (cookiePair) {
                return [
                    [
                        cookiePair.isHttpOnly ? '#HttpOnly_' : '',
                        cookiePair.host
                    ].join(''),
                    cookiePair.isDomain ? 'TRUE' : 'FALSE',
                    cookiePair.path,
                    cookiePair.isSecure ? 'TRUE' : 'FALSE',
                    cookiePair.expires,
                    cookiePair.name,
                    cookiePair.value + '\n'
                ].join('\t');
            }
        }

        function randomString (e) {
            e = e || 32;
            var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
                a = t.length,
                n = "";
            for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
            return n
        }

        function alerts (aMsg, aTitle, aCallback) {
            let alertOptions = {};
            let callback = null;

            // === 新模式：alert(aAlertObject, aCallback)
            if (typeof aMsg === 'object' && aMsg !== null) {
                alertOptions = {
                    title: aMsg.title || "OpenWithHelper",
                    text: aMsg.text + "",
                    textClickable: !!aMsg.textClickable,
                    imageURL: aMsg.imageURL || AlertImage,
                };
                callback = aTitle; // 第二个参数是 callback
            }
            // === 旧模式：alert(aMsg, aTitle, aCallback)
            else {
                alertOptions = {
                    title: aTitle || "OpenWithHelper",
                    text: aMsg + "",
                    textClickable: !!aCallback,
                    imageURL: AlertImage,
                };
                callback = aCallback;
            }

            const callbackObject = callback
                ? {
                    observe: function (subject, topic, data) {
                        if (topic === "alertclickcallback") {
                            callback.call(null);
                        }
                    },
                }
                : null;

            const alertsService = Cc["@mozilla.org/alerts-service;1"]
                .getService(Ci.nsIAlertsService);

            if (versionGE("147a1")) {
                let alert = new AlertNotification({
                    imageURL: alertOptions.imageURL,
                    title: alertOptions.title,
                    text: alertOptions.text,
                    textClickable: alertOptions.textClickable,
                });

                alertsService.showAlert(
                    alert,
                    callbackObject && callbackObject.observe
                        ? callbackObject.observe
                        : null
                );
            } else {
                alertsService.showAlertNotification(
                    alertOptions.imageURL,
                    alertOptions.title,
                    alertOptions.text,
                    alertOptions.textClickable,
                    "",
                    callbackObject
                );
            }
        }

        function uniqueArray (arr) {
            return arr.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            });
        }

        function isSeparatorConfig (app) {
            return !!app && (Object.keys(app).length === 0 || (Object.keys(app).length === 1 && "condition" in app));
        }

        /**
         * ManageAppsPanel - 使用 HTML 模态对话框的应用配置面板
         */
        class ManageAppsPanel {
            constructor(helper) {
                this.helper = helper;
                this.container = null;
                this.dialog = null;
                this.paramEditor = null;
                this.paramEditorTextarea = null;
                this.paramEditorTarget = null;
                this.paramEditorInitialValue = '';
                this.savedAppsSnapshot = '[]';
                this.doc = document;
                this.EMPTY_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NgAAIAAAUAAR4f7BQAAAAASUVORK5CYII=";
                this.strings = {};
            }

            async loadStrings() {
                const defaults = {
                    "manage-applications-list": "管理应用列表",
                    "application-icon": "图标",
                    "application-title": "标题",
                    "application-condition": "条件",
                    "application-path": "可执行文件路径",
                    "application-params": "参数",
                    "application-operate": "操作",
                    "edit-application-params": "编辑参数",
                    "set-application-path": "设置可执行文件路径",
                    "change-path": "更改",
                    "edit": "编辑",
                    "separator": "分隔符",
                    "add-application": "添加应用",
                    "add-separator": "添加分隔符",
                    "dont-do-that": "请勿这样操作！",
                    "delete-application": "❌",
                    "save": "保存",
                    "cancel": "取消",
                    "validation-error-title": "保存失败",
                    "validation-error-prefix": "请先完善以下必填项：",
                    "application-title-required": "请填写应用标题",
                    "application-path-required": "请设置可执行文件路径",
                    "save-failed": "保存失败，请检查配置或稍后重试。",
                    "discard-unsaved-changes": "有未保存的更改，确定要关闭并放弃吗？",
                    "discard-unsaved-param-changes": "参数编辑器中有未保存的更改，确定要放弃吗？",
                    "drag-to-sort": "拖动排序",
                    "fit-for-all": "适用于全部",
                    "fit-for-context-menu": "适用于右键菜单",
                    "condition-default": "默认",
                    "condition-button-menu": "显示在按钮菜单",
                    "condition-tab-menu": "显示在标签页菜单",
                    "condition-page-scope-web": "网页",
                    "condition-page-scope-internal": "内部页面",
                    "condition-page-scope-local": "本地/临时页面",
                    "condition-context-menu": "显示在右键菜单",
                    "condition-show-details": "展开详细条件",
                    "condition-hide-details": "收起详细条件",
                    "context-menu-input": "输入框右键菜单",
                    "context-menu-select": "选中文本右键菜单",
                    "context-menu-link": "链接右键菜单",
                    "context-menu-mailto": "邮件链接右键菜单",
                    "context-menu-image": "图片右键菜单",
                    "context-menu-canvas": "Canvas 右键菜单",
                    "context-menu-media": "媒体右键菜单",
                    "context-menu-page": "页面右键菜单",
                    "context-menu-frame": "框架右键菜单",
                    "condition-help-page-scope": "按钮菜单和标签页菜单可分别勾选：网页、内部页面、本地/临时页面。",
                    "condition-help-context": "右键菜单可勾选：页面、链接、邮件链接、输入框、选中文本、图片、Canvas、媒体、框架。",
                    "condition-legacy-exclude-note": "包含旧版排除条件；未修改条件前会原样保留，修改后将按新条件模型保存。",
                    "param-quick-insert": "快捷插入",
                    "param-editor-tip": "点击下方按钮可在当前光标位置插入占位符。",
                    "call-params-description-label": "调用应用时传递的参数",
                    "param-eol-description": "换行符 (\\r\\n)",
                    "param-title-description": "当前页面标题",
                    "param-titles-description": "简化的当前页面标题",
                    "param-sel-description": "选中的文本",
                    "param-url-description": "当前页面 URL",
                    "param-link-or-url-description": "链接 URL 或当前页面 URL",
                    "param-link-description": "链接 URL",
                    "param-link-text-description": "链接文本",
                    "param-link-host-description": "链接域名",
                    "param-link-text-or-title-description": "链接文本或当前页面标题",
                    "param-image-url-description": "图片 URL",
                    "param-image-alt-description": "图片 ALT 文本",
                    "param-image-title-description": "图片标题",
                    "param-media-url-description": "媒体 URL",
                    "param-profile-dir-description": "Firefox 配置文件目录路径",
                    "param-save-dir-description": "保存目录（默认桌面）",
                    "param-cookie-description": "当前链接或页面的 Cookie",
                    "param-cookie-netscape-description": "当前链接或页面的 Cookie（Netscape 格式）",
                    "param-cookie-host-description": "当前链接或页面所属站点的 Cookie",
                    "param-cookie-txt-description": "COOKIE 保存到临时路径",
                    "param-cookies-sqlite-description": "cookies.sqlite 路径",
                    "param-choose-dir-description": "选择目录",
                    "param-clipboard-description": "剪贴板内容",
                    "param-modifier-description": "支持后缀：_ENCODE（URL 编码）、_QUOT（转义双引号）、_HTML/_HTMLIFIED（HTML 转义）、_TXT（写入临时 txt 后返回路径），例如 %URL_ENCODE% / %COOKIE_HOST_TXT%。",
                    "operation-succeeded": "操作成功！",
                    "operation-canceled": "操作已取消！"
                };

                for (const [key, defaultValue] of Object.entries(defaults)) {
                    this.strings[key] = await this.helper.l10n.formatValue(key) || defaultValue;
                }
            }

            async show() {
                if (!this.container) {
                    await this.loadStrings();
                    this.createModal();
                }
                if (!this.container.open) {
                    this.container.showModal();
                    document.documentElement.setAttribute('owh-modal-open', 'true');
                }
                await this.loadApps();
            }

            isEditableTarget(target) {
                if (!(target instanceof this.doc.defaultView.Element)) {
                    return false;
                }

                const editable = target.closest('input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]');
                return !!editable;
            }

            shouldAllowModalKeyEvent(event) {
                if (!this.dialog?.contains(event.target)) {
                    return false;
                }

                if (event.key === 'Tab') {
                    return true;
                }

                if (!this.isEditableTarget(event.target)) {
                    return false;
                }

                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    return true;
                }

                if (event.altKey) {
                    return false;
                }

                const allowedShortcutKeys = new Set(['a', 'c', 'v', 'x', 'z', 'y', 'backspace', 'delete', 'arrowleft', 'arrowright', 'home', 'end']);
                return allowedShortcutKeys.has(event.key.toLowerCase());
            }

            getAppListColumnTemplate() {
                return '20px 16px 120px 280px minmax(0, 1fr) 52px 220px 32px';
            }

            createGridSpacer() {
                const spacer = this.doc.createElement('div');
                spacer.setAttribute('aria-hidden', 'true');
                return spacer;
            }

            createListHeader() {
                const header = this.doc.createElement('div');
                header.className = 'owh-list-header';
                header.style.setProperty('--owh-app-list-columns', this.getAppListColumnTemplate());

                const columns = [
                    { label: '' },
                    { label: this.strings["application-icon"], textAlign: 'center' },
                    { label: this.strings["application-title"] },
                    { label: this.strings["application-condition"] },
                    { label: this.strings["application-path"] },
                    { label: this.strings["application-operate"], textAlign: 'center' },
                    { label: this.strings["application-params"] },
                    { label: '' }
                ];

                for (const column of columns) {
                    const cell = this.doc.createElement('div');
                    cell.className = 'owh-list-header-cell';
                    cell.textContent = column.label;
                    cell.style.textAlign = column.textAlign || 'left';
                    header.appendChild(cell);
                }

                return header;
            }

            createModal() {
                // 获取系统 DPI 缩放比例
                const dpiScale = window.devicePixelRatio || 1;
                // 计算合适的缩放比例（限制在 0.8-1.5 之间）
                const modalScale = Math.min(Math.max(dpiScale, 0.8), 1.5);

                // 使用原生 dialog，避免自绘遮罩层被地址栏弹层覆盖
                const modal = this.doc.createElementNS('http://www.w3.org/1999/xhtml', 'dialog');
                modal.className = 'owh-modal-overlay';
                modal.style.setProperty('--owh-modal-scale', modalScale);

                // 创建对话框
                const dialog = this.doc.createElement('div');
                dialog.className = 'owh-modal-dialog';

                // 创建标题栏
                const header = this.doc.createElement('div');
                header.className = 'owh-modal-header';

                const title = this.doc.createElement('span');
                title.className = 'owh-modal-title';
                title.textContent = this.strings["manage-applications-list"];

                const closeBtn = this.doc.createElement('button');
                closeBtn.className = 'owh-modal-close';
                closeBtn.textContent = '×';
                closeBtn.addEventListener('click', () => this.hide());

                header.appendChild(title);
                header.appendChild(closeBtn);

                // 创建内容区
                const content = this.doc.createElement('div');
                content.className = 'owh-modal-content';

                // 工具栏
                const toolbar = this.doc.createElement('div');
                toolbar.className = 'owh-toolbar';

                const addAppBtn = this.createButton(this.strings["add-application"], () => this.addApplication());
                const addSepBtn = this.createButton(this.strings["add-separator"], () => this.addSeparator());
                const saveBtn = this.createButton(this.strings["save"], () => this.save());
                saveBtn.classList.add('owh-btn-success');

                toolbar.appendChild(addAppBtn);
                toolbar.appendChild(addSepBtn);
                toolbar.appendChild(saveBtn);

                content.appendChild(toolbar);

                // 应用列表
                const listContainer = this.doc.createElement('div');
                listContainer.className = 'owh-list-container';
                listContainer.id = 'owh-apps-list';

                content.appendChild(listContainer);

                // 帮助信息
                const helpBox = this.createHelpBox();
                content.appendChild(helpBox);

                const paramEditor = this.createParamEditor();

                dialog.appendChild(header);
                dialog.appendChild(content);
                dialog.appendChild(paramEditor);
                modal.appendChild(dialog);

                modal.addEventListener('cancel', (e) => {
                    e.preventDefault();
                    this.hide();
                });

                modal.addEventListener('close', () => {
                    document.documentElement.removeAttribute('owh-modal-open');
                });

                // 点击 backdrop 关闭
                modal.addEventListener('click', (e) => {
                    if (e.target !== modal) {
                        return;
                    }
                    const rect = dialog.getBoundingClientRect();
                    const isBackdropClick =
                        e.clientX < rect.left ||
                        e.clientX > rect.right ||
                        e.clientY < rect.top ||
                        e.clientY > rect.bottom;
                    if (isBackdropClick) {
                        this.hide();
                    }
                });

                // 拦截键盘事件
                this.keydownHandler = (e) => {
                    if (document.documentElement.hasAttribute('owh-modal-open')) {
                        if (this.isParamEditorOpen()) {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                this.closeParamEditor(false);
                                return;
                            }
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                this.closeParamEditor(true);
                                return;
                            }
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            this.hide();
                        } else if (e.altKey && e.key === 'F4') {
                            return;
                        } else if (this.shouldAllowModalKeyEvent(e)) {
                            return;
                        } else {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    }
                };
                this.keypressHandler = (e) => {
                    if (document.documentElement.hasAttribute('owh-modal-open')) {
                        if (e.altKey && e.key === 'F4') return;
                        if (this.shouldAllowModalKeyEvent(e)) return;
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                };
                this.keyupHandler = (e) => {
                    if (document.documentElement.hasAttribute('owh-modal-open')) {
                        if (e.altKey && e.key === 'F4') return;
                        if (this.shouldAllowModalKeyEvent(e)) return;
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                };
                window.addEventListener('keydown', this.keydownHandler, true);
                window.addEventListener('keypress', this.keypressHandler, true);
                window.addEventListener('keyup', this.keyupHandler, true);

                this.doc.body.appendChild(modal);
                this.container = modal;
                this.dialog = dialog;
                this.paramEditor = paramEditor;

                // 设置拖拽排序
                this.setupDragDrop();
            }

            createButton(label, callback) {
                const btn = this.doc.createElement('button');
                btn.textContent = label;
                btn.classList.add('owh-btn-primary');
                btn.addEventListener('click', callback);
                return btn;
            }

            getParamTokenItems() {
                return [
                    { token: '%EOL%', description: this.strings["param-eol-description"] },
                    { token: '%TITLE%', description: this.strings["param-title-description"] },
                    { token: '%TITLES%', description: this.strings["param-titles-description"] },
                    { token: '%SEL%', description: this.strings["param-sel-description"] },
                    { token: '%URL%', description: this.strings["param-url-description"] },
                    { token: '%LINK_OR_URL%', description: this.strings["param-link-or-url-description"] },
                    { token: '%LINK%', description: this.strings["param-link-description"] },
                    { token: '%LINK_TEXT%', description: this.strings["param-link-text-description"] },
                    { token: '%LINK_HOST%', description: this.strings["param-link-host-description"] },
                    { token: '%RLT_OR_UT%', description: this.strings["param-link-text-or-title-description"] },
                    { token: '%IMAGE_URL%', description: this.strings["param-image-url-description"] },
                    { token: '%IMAGE_ALT%', description: this.strings["param-image-alt-description"] },
                    { token: '%IMAGE_TITLE%', description: this.strings["param-image-title-description"] },
                    { token: '%MEDIA_URL%', description: this.strings["param-media-url-description"] },
                    { token: '%PROFILE_DIR%', description: this.strings["param-profile-dir-description"] },
                    { token: '%SAVE_DIR%', description: this.strings["param-save-dir-description"] },
                    { token: '%COOKIE%', description: this.strings["param-cookie-description"] },
                    { token: '%COOKIE_NETSCAPE%', description: this.strings["param-cookie-netscape-description"] },
                    { token: '%COOKIE_HOST%', description: this.strings["param-cookie-host-description"] },
                    { token: '%COOKIE_TXT%', description: this.strings["param-cookie-txt-description"] },
                    { token: '%COOKIES_SQLITE%', description: this.strings["param-cookies-sqlite-description"] },
                    { token: '%CHOOSE_DIR%', description: this.strings["param-choose-dir-description"] },
                    { token: '%CLIPBOARD%', description: this.strings["param-clipboard-description"] }
                ];
            }

            insertTextAtCursor(text) {
                const textarea = this.paramEditorTextarea;
                if (!textarea) {
                    return;
                }

                const start = textarea.selectionStart ?? textarea.value.length;
                const end = textarea.selectionEnd ?? start;
                textarea.focus();
                textarea.setRangeText(text, start, end, 'end');
                textarea.dispatchEvent(new this.doc.defaultView.Event('input', { bubbles: true }));
            }

            markConditionEditorDirty(editor) {
                if (editor) {
                    editor.dataset.conditionDirty = 'true';
                }
            }

            syncConditionGroupState(editor, target) {
                const master = editor?.querySelector(`.owh-condition-target[data-target="${target}"]`);
                const options = [...(editor?.querySelectorAll(`.owh-condition-option[data-target="${target}"]`) || [])];
                if (!master || !options.length) {
                    return;
                }
                master.checked = options.some(node => node.checked);
            }

            setConditionEditorExpanded(editor, expanded) {
                const details = editor?.querySelector('.owh-condition-details');
                const toggleBtn = editor?.querySelector('.owh-condition-toggle');
                if (!details || !toggleBtn) {
                    return;
                }
                details.style.display = expanded ? 'grid' : 'none';
                toggleBtn.textContent = expanded
                    ? this.strings["condition-hide-details"]
                    : this.strings["condition-show-details"];
                editor.dataset.conditionExpanded = expanded ? 'true' : 'false';
            }

            createConditionEditor(condition = '') {
                const editor = this.doc.createElement('div');
                editor.className = 'owh-condition-editor';

                const rawCondition = typeof condition === 'string' ? condition.trim() : '';
                const model = this.helper.parseConditionModel(null, rawCondition);
                editor.dataset.originalCondition = rawCondition;
                editor.dataset.conditionDirty = 'false';
                editor.dataset.hasLegacyExcludes = model.legacyExcludes.length ? 'true' : 'false';
                editor.dataset.conditionExpanded = 'false';

                const groups = [
                    {
                        target: 'button',
                        label: this.strings["condition-button-menu"],
                        options: [
                            { value: 'web', label: this.strings["condition-page-scope-web"] },
                            { value: 'internal', label: this.strings["condition-page-scope-internal"] },
                            { value: 'local', label: this.strings["condition-page-scope-local"] }
                        ]
                    },
                    {
                        target: 'tab',
                        label: this.strings["condition-tab-menu"],
                        options: [
                            { value: 'web', label: this.strings["condition-page-scope-web"] },
                            { value: 'internal', label: this.strings["condition-page-scope-internal"] },
                            { value: 'local', label: this.strings["condition-page-scope-local"] }
                        ]
                    },
                    {
                        target: 'context',
                        label: this.strings["condition-context-menu"],
                        options: [
                            { value: 'page', label: this.strings["context-menu-page"] },
                            { value: 'link', label: this.strings["context-menu-link"] },
                            { value: 'mailto', label: this.strings["context-menu-mailto"] },
                            { value: 'input', label: this.strings["context-menu-input"] },
                            { value: 'select', label: this.strings["context-menu-select"] },
                            { value: 'image', label: this.strings["context-menu-image"] },
                            { value: 'canvas', label: this.strings["context-menu-canvas"] },
                            { value: 'media', label: this.strings["context-menu-media"] },
                            { value: 'frame', label: this.strings["context-menu-frame"] }
                        ]
                    }
                ];

                const summary = this.doc.createElement('div');
                summary.className = 'owh-condition-summary';

                const mainTargets = this.doc.createElement('div');
                mainTargets.className = 'owh-condition-main-targets';

                const details = this.doc.createElement('div');
                details.className = 'owh-condition-details';

                for (const group of groups) {
                    const targetLabel = this.doc.createElement('label');
                    targetLabel.className = 'owh-condition-target-label';

                    const targetInput = this.doc.createElement('input');
                    targetInput.type = 'checkbox';
                    targetInput.className = 'owh-condition-target';
                    targetInput.dataset.target = group.target;
                    targetInput.checked = !!model.targets[group.target];
                    targetInput.addEventListener('change', () => {
                        if (!targetInput.checked) {
                            editor.querySelectorAll(`.owh-condition-option[data-target="${group.target}"]`).forEach(node => {
                                node.checked = false;
                            });
                        }
                        this.markConditionEditorDirty(editor);
                    });

                    const targetText = this.doc.createElement('span');
                    targetText.textContent = group.label;

                    targetLabel.appendChild(targetInput);
                    targetLabel.appendChild(targetText);
                    mainTargets.appendChild(targetLabel);

                    const section = this.doc.createElement('div');
                    section.className = 'owh-condition-section';

                    const sectionTitle = this.doc.createElement('div');
                    sectionTitle.textContent = group.label;
                    sectionTitle.className = 'owh-condition-section-title';

                    const optionsWrap = this.doc.createElement('div');
                    optionsWrap.className = 'owh-condition-options-wrap';

                    for (const option of group.options) {
                        const optionLabel = this.doc.createElement('label');
                        optionLabel.className = 'owh-condition-option-label';

                        const optionInput = this.doc.createElement('input');
                        optionInput.type = 'checkbox';
                        optionInput.className = 'owh-condition-option';
                        optionInput.dataset.target = group.target;
                        optionInput.value = option.value;
                        optionInput.checked = group.target === 'context'
                            ? model.contexts.includes(option.value)
                            : model.pageScope[group.target]?.includes(option.value);
                        optionInput.addEventListener('change', () => {
                            this.syncConditionGroupState(editor, group.target);
                            this.markConditionEditorDirty(editor);
                        });

                        const optionText = this.doc.createElement('span');
                        optionText.textContent = option.label;

                        optionLabel.appendChild(optionInput);
                        optionLabel.appendChild(optionText);
                        optionsWrap.appendChild(optionLabel);
                    }

                    section.appendChild(sectionTitle);
                    section.appendChild(optionsWrap);
                    details.appendChild(section);
                    this.syncConditionGroupState(editor, group.target);
                }

                const toggleBtn = this.doc.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'owh-btn-secondary owh-condition-toggle';
                toggleBtn.addEventListener('click', () => {
                    this.setConditionEditorExpanded(editor, editor.dataset.conditionExpanded !== 'true');
                });

                summary.appendChild(mainTargets);
                summary.appendChild(toggleBtn);
                editor.appendChild(summary);
                editor.appendChild(details);
                this.setConditionEditorExpanded(editor, false);

                if (model.legacyExcludes.length) {
                    const note = this.doc.createElement('div');
                    note.className = 'owh-condition-legacy-note';
                    note.textContent = this.strings["condition-legacy-exclude-note"];
                    editor.appendChild(note);
                }

                return editor;
            }

            getConditionEditorModel(editor) {
                const readTarget = (target) => !!editor.querySelector(`.owh-condition-target[data-target="${target}"]`)?.checked;
                const readOptions = (target) => [...editor.querySelectorAll(`.owh-condition-option[data-target="${target}"]:checked`)].map(node => node.value);
                const buttonOptions = readOptions('button');
                const tabOptions = readOptions('tab');
                const contextOptions = readOptions('context');
                return {
                    targets: {
                        button: readTarget('button') && buttonOptions.length > 0,
                        tab: readTarget('tab') && tabOptions.length > 0,
                        context: readTarget('context') && contextOptions.length > 0
                    },
                    pageScope: {
                        button: readTarget('button') ? buttonOptions : [],
                        tab: readTarget('tab') ? tabOptions : []
                    },
                    contexts: readTarget('context') ? contextOptions : [],
                    legacyExcludes: []
                };
            }

            getConditionValueFromEditor(editor) {
                if (!editor) {
                    return '';
                }
                const originalCondition = editor.dataset.originalCondition || '';
                const hasLegacyExcludes = editor.dataset.hasLegacyExcludes === 'true';
                const wasDirty = editor.dataset.conditionDirty === 'true';
                if (hasLegacyExcludes && !wasDirty) {
                    return originalCondition;
                }
                return this.helper.serializeConditionModel(this.getConditionEditorModel(editor));
            }

            createParamEditor() {
                const overlay = this.doc.createElement('div');
                overlay.className = 'owh-param-editor';

                const panel = this.doc.createElement('div');
                panel.className = 'owh-param-editor-panel';

                const title = this.doc.createElement('div');
                title.className = 'owh-param-editor-title';
                title.textContent = this.strings["edit-application-params"];

                const shortcuts = this.doc.createElement('div');
                shortcuts.className = 'owh-param-editor-shortcuts';

                const shortcutsTitle = this.doc.createElement('div');
                shortcutsTitle.className = 'owh-param-editor-shortcuts-title';
                shortcutsTitle.textContent = this.strings["param-quick-insert"];

                const shortcutButtons = this.doc.createElement('div');
                shortcutButtons.className = 'owh-param-editor-shortcut-buttons';

                for (const item of this.getParamTokenItems()) {
                    const shortcutBtn = this.createButton(item.token, () => this.insertTextAtCursor(item.token));
                    shortcutBtn.type = 'button';
                    shortcutBtn.classList.remove('owh-btn-primary');
                    shortcutBtn.classList.add('owh-btn-secondary', 'owh-param-editor-shortcut-btn');
                    shortcutBtn.title = item.description;
                    shortcutButtons.appendChild(shortcutBtn);
                }

                const shortcutTip = this.doc.createElement('div');
                shortcutTip.className = 'owh-param-editor-tip';
                shortcutTip.textContent = `${this.strings["param-editor-tip"]} ${this.strings["param-modifier-description"]}`;

                shortcuts.appendChild(shortcutsTitle);
                shortcuts.appendChild(shortcutButtons);
                shortcuts.appendChild(shortcutTip);

                const textarea = this.doc.createElement('textarea');
                textarea.className = 'owh-param-editor-textarea';
                textarea.placeholder = this.strings["application-params"];

                const actions = this.doc.createElement('div');
                actions.className = 'owh-param-editor-actions';

                const cancelBtn = this.createButton(this.strings["cancel"], () => this.closeParamEditor(false));
                cancelBtn.classList.add('owh-btn-secondary');

                const saveBtn = this.createButton(this.strings["save"], () => this.closeParamEditor(true));
                saveBtn.classList.add('owh-btn-success');

                actions.appendChild(cancelBtn);
                actions.appendChild(saveBtn);

                panel.appendChild(title);
                panel.appendChild(shortcuts);
                panel.appendChild(textarea);
                panel.appendChild(actions);
                overlay.appendChild(panel);

                overlay.addEventListener('click', (event) => {
                    if (event.target === overlay) {
                        this.closeParamEditor(false);
                    }
                });

                this.paramEditorTextarea = textarea;
                return overlay;
            }

            isParamEditorOpen() {
                return this.paramEditor?.style.display === 'flex';
            }

            confirmDiscardChanges(message) {
                return Services.prompt.confirm(
                    this.doc.defaultView,
                    this.strings["manage-applications-list"],
                    message
                );
            }

            hasPendingParamEditorChanges() {
                if (!this.isParamEditorOpen() || !this.paramEditorTextarea) {
                    return false;
                }
                return this.paramEditorTextarea.value !== this.paramEditorInitialValue;
            }

            openParamEditor(input) {
                if (!input || !this.paramEditor || !this.paramEditorTextarea) {
                    return;
                }

                this.paramEditorTarget = input;
                this.paramEditorInitialValue = input.value || '';
                this.paramEditorTextarea.value = input.value || '';
                this.paramEditor.style.display = 'flex';
                this.paramEditorTextarea.focus();
                this.paramEditorTextarea.setSelectionRange(this.paramEditorTextarea.value.length, this.paramEditorTextarea.value.length);
            }

            closeParamEditor(shouldApply) {
                if (!this.paramEditor || !this.paramEditorTextarea) {
                    return true;
                }

                if (!shouldApply && this.hasPendingParamEditorChanges()) {
                    const shouldDiscard = this.confirmDiscardChanges(this.strings["discard-unsaved-param-changes"]);
                    if (!shouldDiscard) {
                        return false;
                    }
                }

                if (shouldApply && this.paramEditorTarget) {
                    this.paramEditorTarget.value = this.paramEditorTextarea.value;
                    this.paramEditorTarget.title = this.paramEditorTextarea.value || this.strings["application-params"];
                }

                const focusTarget = this.paramEditorTarget;
                this.paramEditor.style.display = 'none';
                this.paramEditorTarget = null;
                this.paramEditorInitialValue = '';

                if (focusTarget) {
                    focusTarget.focus();
                }

                return true;
            }

            collectAppsFromUI() {
                if (!this.doc) {
                    return [];
                }

                const list = this.doc.getElementById('owh-apps-list');
                if (!list) {
                    return [];
                }

                const rows = list.querySelectorAll('.owh-app-row, .owh-separator-row');
                const apps = [];

                for (const row of rows) {
                    const conditionEditor = row.querySelector('.owh-condition-editor');
                    if (row.dataset.separator === 'true') {
                        const condition = this.getConditionValueFromEditor(conditionEditor);
                        apps.push(condition ? { condition } : {});
                        continue;
                    }

                    const img = row.querySelector('.owh-icon-img');
                    const titleInput = row.querySelector('.owh-title-input');
                    const paramsInput = row.querySelector('.owh-param-input');
                    const pathLabel = row.querySelector('.owh-path-label');
                    const app = {
                        exec: pathLabel?.textContent || '',
                        text: paramsInput?.value || '%LINK_OR_URL%'
                    };

                    const condition = this.getConditionValueFromEditor(conditionEditor);
                    if (titleInput?.value) app.label = titleInput.value;
                    if (condition) app.condition = condition;
                    if (img?.src && img.src !== this.EMPTY_IMG) app.image = img.src;

                    apps.push(app);
                }

                return apps;
            }

            refreshSavedAppsSnapshot() {
                this.savedAppsSnapshot = JSON.stringify(this.collectAppsFromUI());
            }

            hasUnsavedAppChanges() {
                return JSON.stringify(this.collectAppsFromUI()) !== this.savedAppsSnapshot;
            }

            showAlertMessage(title, message) {
                Services.prompt.alert(this.doc.defaultView, title, message);
            }

            clearValidationState() {
                if (!this.doc) {
                    return;
                }

                const invalidNodes = this.doc.querySelectorAll('.owh-invalid-field');
                for (const node of invalidNodes) {
                    node.classList.remove('owh-invalid-field');
                    node.style.removeProperty('outline');
                    node.style.removeProperty('outline-offset');
                    node.style.removeProperty('border-color');
                    node.style.removeProperty('background-color');
                }
            }

            markInvalidField(field) {
                if (!field) {
                    return;
                }

                field.classList.add('owh-invalid-field');
                field.style.outline = '2px solid #d93025';
                field.style.outlineOffset = '1px';
                field.style.borderColor = '#d93025';
                field.style.backgroundColor = 'rgba(217, 48, 37, 0.08)';
            }

            validateAppsBeforeSave() {
                this.clearValidationState();

                const list = this.doc.getElementById('owh-apps-list');
                if (!list) {
                    return { valid: true };
                }

                const rows = list.querySelectorAll('.owh-app-row');
                const errors = [];
                let firstInvalidField = null;

                rows.forEach((row, index) => {
                    const rowNumber = index + 1;
                    const titleInput = row.querySelector('.owh-title-input');
                    const pathLabel = row.querySelector('.owh-path-label');
                    const changeBtn = row.querySelector('.owh-change');

                    if (!titleInput?.value.trim()) {
                        this.markInvalidField(titleInput);
                        if (!firstInvalidField) {
                            firstInvalidField = titleInput;
                        }
                        errors.push(`第 ${rowNumber} 行：${this.strings["application-title-required"]}`);
                    }

                    if (!pathLabel?.textContent.trim()) {
                        this.markInvalidField(pathLabel);
                        this.markInvalidField(changeBtn);
                        if (!firstInvalidField) {
                            firstInvalidField = changeBtn || pathLabel;
                        }
                        errors.push(`第 ${rowNumber} 行：${this.strings["application-path-required"]}`);
                    }
                });

                if (errors.length > 0) {
                    return {
                        valid: false,
                        message: `${this.strings["validation-error-prefix"]}\n\n${errors.join('\n')}`,
                        firstInvalidField
                    };
                }

                return { valid: true };
            }

            setRowDragEnabled(row, enabled) {
                row.draggable = enabled;
                if (enabled) {
                    row.dataset.dragEnabled = 'true';
                } else {
                    delete row.dataset.dragEnabled;
                }
            }

            bindDragHandle(row, dragHandle) {
                this.setRowDragEnabled(row, false);
                dragHandle.title = this.strings["drag-to-sort"];
                dragHandle.style.cursor = 'grab';

                const releaseDrag = () => {
                    if (row.dataset.dragging === 'true') {
                        return;
                    }
                    this.setRowDragEnabled(row, false);
                    window.removeEventListener('mouseup', releaseDrag, true);
                };

                dragHandle.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) {
                        return;
                    }
                    this.setRowDragEnabled(row, true);
                    window.addEventListener('mouseup', releaseDrag, true);
                });

                row._owhReleaseDrag = releaseDrag;
            }

            createDragHandle() {
                const dragHandle = this.doc.createElement('span');
                dragHandle.className = 'owh-drag-handle';
                dragHandle.style.cssText = `
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ij48cGF0aCBkPSJNMjMuOTc4NTE2IDQgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuOTM5NDUzIDQuNDM5NDUzMUwxNy45Mzk0NTMgOS40Mzk0NTMxIEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDIwLjA2MDU0NyAxMS41NjA1NDdMMjQgNy42MjEwOTM4TDI3LjkzOTQ1MyAxMS41NjA1NDcgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgMzAuMDYwNTQ3IDkuNDM5NDUzMUwyNS4wNjA1NDcgNC40Mzk0NTMxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIzLjk3ODUxNiA0IHogTSA1LjUgMTYgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgNS41IDE5TDQyLjUgMTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgNDIuNSAxNkw1LjUgMTYgeiBNIDUuNSAyMyBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCA1LjUgMjZMNDIuNSAyNiBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCA0Mi41IDIzTDUuNSAyMyB6IE0gNS41IDMwIEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDUuNSAzM0w0Mi41IDMzIEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDQyLjUgMzBMNS41IDMwIHoiLz48L3N2Zz4=");
                    background-size: 16px;
                    background-repeat: no-repeat;
                    background-position: center;
                `;
                return dragHandle;
            }

            createHelpBox() {
                const box = this.doc.createElement('div');
                box.className = 'owh-help-box';
                box.style.cssText = `
                    border: 1px solid var(--chrome-content-separator-color, #ccc);
                    border-radius: 4px;
                    padding: 12px;
                    font-size: 12px;
                `;

                const condTitle = this.doc.createElement('div');
                condTitle.textContent = this.strings["application-condition"];
                condTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px;';

                const cond1 = this.doc.createElement('div');
                cond1.textContent = this.strings["condition-help-page-scope"];

                const cond2 = this.doc.createElement('div');
                cond2.textContent = this.strings["condition-help-context"];
                cond2.style.cssText = 'margin-bottom: 12px;';

                const paramTitle = this.doc.createElement('div');
                paramTitle.textContent = this.strings["application-params"];
                paramTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px;';

                const paramList = this.doc.createElement('div');
                paramList.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 6px 12px;';

                for (const paramItem of this.getParamTokenItems()) {
                    const item = this.doc.createElement('div');
                    item.textContent = `${paramItem.token} - ${paramItem.description}`;
                    item.style.cssText = 'line-height: 1.5; overflow-wrap: anywhere;';
                    paramList.appendChild(item);
                }

                const paramModifierNote = this.doc.createElement('div');
                paramModifierNote.textContent = this.strings["param-modifier-description"];
                paramModifierNote.style.cssText = 'margin-top: 10px; color: #5f6368; line-height: 1.5; overflow-wrap: anywhere;';

                box.appendChild(condTitle);
                box.appendChild(cond1);
                box.appendChild(cond2);
                box.appendChild(paramTitle);
                box.appendChild(paramList);
                box.appendChild(paramModifierNote);

                return box;
            }

            hide() {
                if (!this.closeParamEditor(false)) {
                    return false;
                }
                if (this.hasUnsavedAppChanges()) {
                    const shouldDiscard = this.confirmDiscardChanges(this.strings["discard-unsaved-changes"]);
                    if (!shouldDiscard) {
                        return false;
                    }
                }
                if (this.container) {
                    if (this.container.open) {
                        this.container.close();
                    }
                    document.documentElement.removeAttribute('owh-modal-open');
                }
                return true;
            }

            setupDragDrop() {
                const listContainer = this.doc.getElementById('owh-apps-list');
                if (!listContainer) return;

                let draggedItem = null;

                listContainer.addEventListener('dragstart', (e) => {
                    const item = e.target.closest('.owh-app-row, .owh-separator-row');
                    if (item) {
                        if (item.dataset.dragEnabled !== 'true') {
                            e.preventDefault();
                            return;
                        }
                        draggedItem = item;
                        item.dataset.dragging = 'true';
                        e.dataTransfer.effectAllowed = 'move';
                        item.style.opacity = '0.5';
                    }
                });

                listContainer.addEventListener('dragend', (e) => {
                    const item = e.target.closest('.owh-app-row, .owh-separator-row');
                    if (item) {
                        item.style.opacity = '1';
                        delete item.dataset.dragging;
                        this.setRowDragEnabled(item, false);
                        if (item._owhReleaseDrag) {
                            window.removeEventListener('mouseup', item._owhReleaseDrag, true);
                        }
                        draggedItem = null;
                    }
                });

                listContainer.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const item = e.target.closest('.owh-app-row, .owh-separator-row');
                    if (item && item !== draggedItem) {
                        e.dataTransfer.dropEffect = 'move';
                    }
                });

                listContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const dropTarget = e.target.closest('.owh-app-row, .owh-separator-row');
                    if (dropTarget && draggedItem && dropTarget !== draggedItem) {
                        const rect = dropTarget.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;

                        if (e.clientY < midY) {
                            dropTarget.parentNode.insertBefore(draggedItem, dropTarget);
                        } else {
                            dropTarget.parentNode.insertBefore(draggedItem, dropTarget.nextSibling);
                        }
                    }
                });
            }

            async loadApps() {
                if (!this.doc) return;

                const listContainer = this.doc.getElementById('owh-apps-list');
                if (!listContainer) return;

                // 清空列表
                while (listContainer.lastChild) {
                    listContainer.removeChild(listContainer.lastChild);
                }

                listContainer.appendChild(this.createListHeader());

                const apps = await this.helper.getAppList();
                for (const app of apps) {
                    if (isSeparatorConfig(app)) {
                        this.addSeparatorRow(app);
                    } else {
                        await this.addAppRow(app);
                    }
                }

                this.refreshSavedAppsSnapshot();
            }

            async addAppRow(app) {
                if (!this.doc) return;

                const listContainer = this.doc.getElementById('owh-apps-list');
                if (!listContainer) return;

                const row = this.doc.createElement('div');
                row.className = 'owh-app-row';
                row.dataset.appData = JSON.stringify(app);
                row.style.cssText = `
                    display: grid;
                    grid-template-columns: ${this.getAppListColumnTemplate()};
                    align-items: center;
                    padding: 8px;
                    border-bottom: 1px solid var(--chrome-content-separator-color, #eee);
                    column-gap: 8px;
                    cursor: default;
                `;

                // 拖拽手柄
                const dragHandle = this.createDragHandle();
                this.bindDragHandle(row, dragHandle);

                // 图标
                const iconWrapper = this.doc.createElement('div');
                iconWrapper.className = 'owh-icon-wrapper';
                iconWrapper.style.cssText = 'width: 16px; height: 16px; flex-shrink: 0; cursor: pointer;';
                const img = this.doc.createElement('img');
                img.className = 'owh-icon-img';
                img.src = app.image || this.EMPTY_IMG;
                img.style.cssText = 'width: 16px; height: 16px; object-fit: contain;';
                iconWrapper.appendChild(img);
                iconWrapper.addEventListener('click', (e) => this.changeIcon(e));

                // 标题输入
                const titleInput = this.doc.createElement('input');
                titleInput.className = 'owh-input owh-title-input';
                titleInput.placeholder = this.strings["application-title"];
                titleInput.title = this.strings["application-title"];
                titleInput.value = app.label || '';
                titleInput.style.cssText = 'width: 100%; min-width: 0; padding: 4px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box;';

                const conditionEditor = this.createConditionEditor(app.condition || '');

                // 路径显示
                const pathLabel = this.doc.createElement('div');
                pathLabel.className = 'owh-path-label';
                pathLabel.textContent = app.exec || '';
                pathLabel.style.cssText = 'width: 100%; min-width: 0; min-height: 26px; padding: 4px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 18px; box-sizing: border-box; border: 1px solid transparent; border-radius: 3px; display: flex; align-items: center;';

                const changeBtn = this.createButton(this.strings["change-path"], (e) => this.changePath(e, pathLabel));
                changeBtn.classList.add('owh-change');
                changeBtn.style.cssText = 'width: 100%; min-width: 0; box-sizing: border-box;';

                // 参数输入
                const paramsInput = this.doc.createElement('input');
                paramsInput.className = 'owh-input owh-param-input';
                paramsInput.placeholder = this.strings["application-params"];
                paramsInput.title = this.strings["application-params"];
                paramsInput.value = app.text || '%LINK_OR_URL%';
                paramsInput.title = paramsInput.value || this.strings["application-params"];
                paramsInput.style.cssText = 'width: 160px; min-width: 0; padding: 4px 8px; border: none; background: transparent; font-family: Consolas, "Courier New", monospace; outline: none; box-sizing: border-box;';
                paramsInput.addEventListener('input', () => {
                    paramsInput.title = paramsInput.value || this.strings["application-params"];
                });
                paramsInput.addEventListener('dblclick', () => this.openParamEditor(paramsInput));

                const editParamsBtn = this.createButton(this.strings["edit"], () => this.openParamEditor(paramsInput));
                editParamsBtn.classList.add('owh-btn-secondary', 'owh-param-edit-btn');

                const paramsWrapper = this.doc.createElement('div');
                paramsWrapper.className = 'owh-param-cell';
                paramsWrapper.style.cssText = 'width: 100%; min-width: 0; box-sizing: border-box;';
                paramsWrapper.appendChild(paramsInput);
                paramsWrapper.appendChild(editParamsBtn);

                // 删除按钮
                const deleteBtn = this.createButton(this.strings["delete-application"], (e) => this.deleteRow(e));
                deleteBtn.classList.add('owh-btn-danger');
                deleteBtn.style.cssText = 'width: 100%; min-width: 0; padding: 4px 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; writing-mode: horizontal-tb; line-height: 1;';

                row.appendChild(dragHandle);
                row.appendChild(iconWrapper);
                row.appendChild(titleInput);
                row.appendChild(conditionEditor);
                row.appendChild(pathLabel);
                row.appendChild(changeBtn);
                row.appendChild(paramsWrapper);
                row.appendChild(deleteBtn);

                listContainer.appendChild(row);
            }

            addSeparatorRow(app) {
                if (!this.doc) return;

                const listContainer = this.doc.getElementById('owh-apps-list');
                if (!listContainer) return;

                const row = this.doc.createElement('div');
                row.className = 'owh-separator-row';
                row.dataset.separator = 'true';
                row.style.cssText = `
                    display: grid;
                    grid-template-columns: ${this.getAppListColumnTemplate()};
                    align-items: center;
                    padding: 8px;
                    border-bottom: 1px solid var(--chrome-content-separator-color, #eee);
                    column-gap: 8px;
                    cursor: default;
                `;

                const dragHandle = this.createDragHandle();
                this.bindDragHandle(row, dragHandle);

                const sep = this.doc.createElement('div');
                sep.textContent = `--- ${this.strings["separator"]} ---`;
                sep.style.cssText = 'grid-column: 5 / 8; min-width: 0; text-align: center; color: #999;';

                const conditionEditor = this.createConditionEditor(app.condition || '');

                const deleteBtn = this.createButton(this.strings["delete-application"], (e) => this.deleteRow(e));
                deleteBtn.classList.add('owh-btn-danger');
                deleteBtn.style.cssText = 'width: 100%; min-width: 0; padding: 4px 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; writing-mode: horizontal-tb; line-height: 1;';

                row.appendChild(dragHandle);
                row.appendChild(this.createGridSpacer());
                row.appendChild(this.createGridSpacer());
                row.appendChild(conditionEditor);
                row.appendChild(sep);
                row.appendChild(deleteBtn);

                listContainer.appendChild(row);
            }

            addApplication() {
                const newApp = {
                    label: '',
                    exec: '',
                    text: '%LINK_OR_URL%',
                    condition: ''
                };
                this.addAppRow(newApp);
            }

            addSeparator() {
                this.addSeparatorRow({ condition: '' });
            }

            deleteRow(event) {
                const row = event.target.closest('.owh-app-row, .owh-separator-row');
                if (row && row.parentNode) {
                    row.parentNode.removeChild(row);
                }
            }

            async changeIcon(event) {
                const wrapper = event.target.closest('.owh-icon-wrapper');
                if (!wrapper) return;

                const img = wrapper.querySelector('.owh-icon-img');
                if (event.ctrlKey) {
                    img.src = this.EMPTY_IMG;
                    return;
                }

                const fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
                fp.init(window.browsingContext, null, Ci.nsIFilePicker.modeOpen);
                fp.appendFilters(Ci.nsIFilePicker.filterImages);

                const result = await new Promise(resolve => {
                    fp.open(resolve);
                });

                if (result === Ci.nsIFilePicker.returnOK) {
                    const extension = fp.file.path.split('.').pop();
                    const path = "file:///" + fp.file.path.replace(/\\/g, '/');
                    const resp = await fetch(path);
                    let base64;
                    if (extension === "svg") {
                        const svgString = await resp.text();
                        base64 = "data:image/svg+xml;base64," + btoa(svgString);
                    } else {
                        const blob = await resp.blob();
                        base64 = await this.blobToDataURL(blob);
                    }
                    img.src = base64;
                }
            }

            blobToDataURL(blob) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener('loadend', () => resolve(reader.result));
                    reader.addEventListener('error', reject);
                    reader.readAsDataURL(blob);
                });
            }

            async changePath(event, label) {
                const fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
                fp.init(window.browsingContext, this.strings["set-application-path"], Ci.nsIFilePicker.modeOpen);
                fp.appendFilters(Ci.nsIFilePicker.filterApps);

                const result = await new Promise(resolve => {
                    fp.open(resolve);
                });

                if (result === Ci.nsIFilePicker.returnOK) {
                    label.textContent = fp.file.path;
                }
            }

            async save() {
                if (!this.doc) return;

                if (this.isParamEditorOpen()) {
                    this.closeParamEditor(true);
                }

                const validation = this.validateAppsBeforeSave();
                if (!validation.valid) {
                    this.showAlertMessage(this.strings["validation-error-title"], validation.message);
                    validation.firstInvalidField?.focus?.();
                    return;
                }

                try {
                    const apps = this.collectAppsFromUI();
                    await IOUtils.writeUTF8(FILE_PATH, JSON.stringify(apps));
                    this.savedAppsSnapshot = JSON.stringify(apps);

                    // 刷新所有窗口的菜单
                    const enumerator = Services.wm.getEnumerator(null);
                    while (enumerator.hasMoreElements()) {
                        const win = enumerator.getNext();
                        win?.OpenWithHelper?.reload(false);
                    }

                    alerts(this.strings["operation-succeeded"]);
                    this.hide();
                } catch (error) {
                    this.showAlertMessage(
                        this.strings["validation-error-title"],
                        `${this.strings["save-failed"]}\n\n${error}`
                    );
                }
            }

            destroy() {
                if (this.keydownHandler) {
                    window.removeEventListener('keydown', this.keydownHandler, true);
                    window.removeEventListener('keypress', this.keypressHandler, true);
                    window.removeEventListener('keyup', this.keyupHandler, true);
                    this.keydownHandler = null;
                    this.keypressHandler = null;
                    this.keyupHandler = null;
                }
                if (this.container && this.container.parentNode) {
                    if (this.container.open) {
                        this.container.close();
                    }
                    this.container.parentNode.removeChild(this.container);
                }
                document.documentElement.removeAttribute('owh-modal-open');
                this.paramEditor = null;
                this.paramEditorTextarea = null;
                this.paramEditorTarget = null;
                this.paramEditorInitialValue = '';
                this.savedAppsSnapshot = '[]';
                this.container = null;
                this.dialog = null;
            }
        }
    }(`
#OpenWithHelper-Btn,
#OpenWithHelper-Ctx-Menu,
#OpenWithHelper-Tab-Menu {
    list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjM1KSI+DQogIDxwYXRoIGZpbGw9IiM5MGE0YWUiIGQ9Ik02LDMzdjVjMCwxLjcsMS4zLDMsMywzaDMwYzEuNywwLDMtMS4zLDMtM3YtNUg2eiIgLz4NCiAgPHBhdGggZmlsbD0iI2NmZDhkYyIgZD0iTTQyLDMzYy0wLjEsMS43LTEuNSwzLTMuMSwzSDljLTEuNiwwLTMtMS4zLTMtM1YxMGMwLTEuNywxLjMtMywzLTNoMjkuOWMxLjYsMCwzLDEuMywzLjEsM0w0MiwzM0w0MiwzM3oiIC8+DQogIDxwYXRoIGZpbGw9IiM1NDZlN2EiIGQ9Ik0yMiwyMGgtMy41Yy0xLjksMC0zLjUtMS42LTMuNS0zLjVzMS42LTMuNSwzLjUtMy41czMuNSwxLjYsMy41LDMuNVYyMHogTTE4LjUsMTVjLTAuOCwwLTEuNSwwLjctMS41LDEuNSBzMC43LDEuNSwxLjUsMS41SDIwdi0xLjVDMjAsMTUuNywxOS4zLDE1LDE4LjUsMTV6IiAvPg0KICA8cGF0aCBmaWxsPSIjNTQ2ZTdhIiBkPSJNMjkuNSwyMEgyNnYtMy41YzAtMS45LDEuNi0zLjUsMy41LTMuNXMzLjUsMS42LDMuNSwzLjVTMzEuNCwyMCwyOS41LDIweiBNMjgsMThoMS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNSBTMzAuMywxNSwyOS41LDE1UzI4LDE1LjcsMjgsMTYuNVYxOHoiIC8+DQogIDxwYXRoIGZpbGw9IiM1NDZlN2EiIGQ9Ik0xOC41LDMwYy0xLjksMC0zLjUtMS42LTMuNS0zLjVzMS42LTMuNSwzLjUtMy41SDIydjMuNUMyMiwyOC40LDIwLjQsMzAsMTguNSwzMHogTTE4LjUsMjUgYy0wLjgsMC0xLjUsMC43LTEuNSwxLjVzMC43LDEuNSwxLjUsMS41czEuNS0wLjcsMS41LTEuNVYyNUgxOC41eiIgLz4NCiAgPHBhdGggZmlsbD0iIzU0NmU3YSIgZD0iTTI5LjUsMzBjLTEuOSwwLTMuNS0xLjYtMy41LTMuNVYyM2gzLjVjMS45LDAsMy41LDEuNiwzLjUsMy41UzMxLjQsMzAsMjkuNSwzMHogTTI4LDI1djEuNSBjMCwwLjgsMC43LDEuNSwxLjUsMS41czEuNS0wLjcsMS41LTEuNVMzMC4zLDI1LDI5LjUsMjVIMjh6IiAvPg0KICA8cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSI1IiB4PSIyMCIgeT0iMTkiIGZpbGw9IiM1NDZlN2EiIC8+DQogIDxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjIiIHg9IjIxIiB5PSIxOCIgZmlsbD0iIzU0NmU3YSIgLz4NCiAgPHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iNSIgeD0iMjYiIHk9IjE5IiBmaWxsPSIjNTQ2ZTdhIiAvPg0KICA8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSIyIiB4PSIyMSIgeT0iMjMiIGZpbGw9IiM1NDZlN2EiIC8+DQo8L3N2Zz4=)
}
.owh-popup menugroup > .menuitem-iconic {
    -moz-box-flex: 1;
    -moz-box-pack: center;
    -moz-box-align: center;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    padding-block: 6px;
    padding-inline-start: 1em;
}
.owh-popup menugroup > .menuitem-iconic > .menu-iconic-left {
    -moz-appearance: none;
    padding-top: 0;
}
.owh-popup menugroup > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
    width: 16px;
    height: 16px;
}
.owh-popup menuitem[style*="file:///"]:is([filename="MyChrome.exe"], [filename="chrome.exe"]) {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMTUpIj48cGF0aCBmaWxsPSIjNGNhZjUwIiBkPSJNNDQsMjRjMCwxMS4wNDQtOC45NTYsMjAtMjAsMjBTNCwzNS4wNDQsNCwyNFMxMi45NTYsNCwyNCw0UzQ0LDEyLjk1Niw0NCwyNHoiLz48cGF0aCBmaWxsPSIjZmZjMTA3IiBkPSJNMjQsNHYyMGw4LDRsLTguODQzLDE2YzAuMzE3LDAsMC41MjYsMCwwLjg0MywwYzExLjA1MywwLDIwLTguOTQ3LDIwLTIwUzM1LjA1Myw0LDI0LDR6Ii8+PHBhdGggZmlsbD0iIzNkZGFiNCIgZD0iTTQ0LDI0YzAsMTEuMDQ0LTguOTU2LDIwLTIwLDIwUzQsMzUuMDQ0LDQsMjRTMTIuOTU2LDQsMjQsNFM0NCwxMi45NTYsNDQsMjR6Ii8+PHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTI0LDR2MjBsOCw0bC04Ljg0MywxNmMwLjMxNywwLDAuNTI2LDAsMC44NDMsMGMxMS4wNTMsMCwyMC04Ljk0NywyMC0yMFMzNS4wNTMsNCwyNCw0eiIvPjxwYXRoIGZpbGw9IiNmNTUzNzYiIGQ9Ik00MS44NCwxNUgyNHYxM2wtMy0xTDcuMTYsMTMuMjZINy4xNEMxMC42OCw3LjY5LDE2LjkxLDQsMjQsNEMzMS44LDQsMzguNTUsOC40OCw0MS44NCwxNXoiLz48cGF0aCBmaWxsPSIjZWIwMDAwIiBkPSJNNy4xNTgsMTMuMjY0bDguODQzLDE0Ljg2MkwyMSwyN0w3LjE1OCwxMy4yNjR6Ii8+PHBhdGggZmlsbD0iIzAwYjU2OSIgZD0iTTIzLjE1Nyw0NGw4LjkzNC0xNi4wNTlMMjgsMjVMMjMuMTU3LDQ0eiIvPjxwYXRoIGZpbGw9IiNlYjAwMDAiIGQ9Ik00MS44NjUsMTVIMjRsLTEuNTc5LDQuNThMNDEuODY1LDE1eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0zMywyNGMwLDQuOTY5LTQuMDMxLDktOSw5cy05LTQuMDMxLTktOXM0LjAzMS05LDktOVMzMywxOS4wMzEsMzMsMjR6Ii8+PHBhdGggZmlsbD0iI2E2NGFmZiIgZD0iTTMxLDI0YzAsMy44NjctMy4xMzMsNy03LDdzLTctMy4xMzMtNy03czMuMTMzLTcsNy03UzMxLDIwLjEzMywzMSwyNHoiLz48L3N2Zz4=) !important;
}
.owh-popup menuitem[filename="you-get.exe"][style*="file:///"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDQ4IDQ4IiB0cmFuc2Zvcm09InNjYWxlKDEuMjUpIj48cGF0aCBmaWxsPSIjOEJDMzRBIiBkPSJNMzgsNDJIMTBjLTIuMjA5LDAtNC0xLjc5MS00LTRWMTBjMC0yLjIwOSwxLjc5MS00LDQtNGgyOGMyLjIwOSwwLDQsMS43OTEsNCw0djI4QzQyLDQwLjIwOSw0MC4yMDksNDIsMzgsNDIiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMzEgMjRMMjAgMTYgMjAgMzJ6Ii8+PC9zdmc+) !important;
}
.owh-modal-overlay {
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    font-size: calc(var(--owh-modal-scale, 1) * 1rem) !important;
}
.owh-modal-overlay::backdrop {
    background: rgba(0, 0, 0, 0.5) !important;
}
.owh-modal-dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    width: calc(var(--owh-modal-scale, 1) * 1180px);
    max-width: 95vw;
    max-height: 90vh;
    background: var(--toolbar-bgcolor, #fff);
    border-radius: calc(var(--owh-modal-scale, 1) * 8px);
    box-shadow: 0 calc(var(--owh-modal-scale, 1) * 4px) calc(var(--owh-modal-scale, 1) * 20px) rgba(0, 0, 0, 0.3);
}
.owh-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--owh-modal-scale, 1) * 12px) calc(var(--owh-modal-scale, 1) * 16px);
    border-bottom: 1px solid var(--chrome-content-separator-color, #e0e0e0);
}
.owh-modal-title {
    font-size: calc(var(--owh-modal-scale, 1) * 16px);
    font-weight: 600;
}
.owh-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--owh-modal-scale, 1) * 28px);
    height: calc(var(--owh-modal-scale, 1) * 28px);
    padding: 0;
    border: none;
    background: none;
    color: var(--chrome-color, #333);
    cursor: pointer;
    font-size: calc(var(--owh-modal-scale, 1) * 24px);
}
.owh-modal-content {
    flex: 1;
    overflow: auto;
    padding: calc(var(--owh-modal-scale, 1) * 16px);
}
.owh-toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: calc(var(--owh-modal-scale, 1) * 8px);
    margin-bottom: calc(var(--owh-modal-scale, 1) * 12px);
}
.owh-list-container {
    margin-bottom: 12px;
    overflow-y: auto;
    max-height: 400px;
    border: 1px solid var(--chrome-content-separator-color, #ccc);
    border-radius: 4px;
}
.owh-list-header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: var(--owh-app-list-columns);
    align-items: center;
    column-gap: 8px;
    padding: 8px;
    background: var(--toolbar-bgcolor, #fff);
    border-bottom: 1px solid var(--chrome-content-separator-color, #eee);
    font-size: 12px;
    font-weight: 600;
}
.owh-list-header-cell {
    min-width: 0;
}
.owh-popup menuitem[filename="yt-dlp.exe"][style*="file:///"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHRyYW5zZm9ybT0ic2NhbGUoMS40KSI+PHBhdGggZmlsbD0iI2ZmNjk3YiIgZD0iTTg2LjIsMTA0SDQxLjhDMzIsMTA0LDI0LDk2LDI0LDg2LjJWNDEuOEMyNCwzMiwzMiwyNCw0MS44LDI0aDQ0LjRDOTYsMjQsMTA0LDMyLDEwNCw0MS44djQ0LjRDMTA0LDk2LDk2LDEwNCw4Ni4yLDEwNHoiLz48cGF0aCBmaWxsPSIjZmY2OTdiIiBkPSJNODYuMiwxMDRINDEuOEMzMiwxMDQsMjQsOTYsMjQsODYuMlY0MS44QzI0LDMyLDMyLDI0LDQxLjgsMjRoNDQuNEM5NiwyNCwxMDQsMzIsMTA0LDQxLjh2NDQuNEMxMDQsOTYsOTYsMTA0LDg2LjIsMTA0eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNCw0MS44djE0LjdjMTQuNS0xMS4xLDQxLjItMjQuOSw3OS41LTE5QzEwMS41LDI5LjcsOTQuNiwyNCw4Ni4yLDI0SDQxLjhDMzIsMjQsMjQsMzIsMjQsNDEuOHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNTMuNSA0OUw1My41IDc5IDc5LjUgNjR6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNDQ0YjU0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iNiIgZD0iTTg2LjIsMTA0SDQxLjhDMzIsMTA0LDI0LDk2LDI0LDg2LjJWNDEuOEMyNCwzMiwzMiwyNCw0MS44LDI0aDQ0LjRDOTYsMjQsMTA0LDMyLDEwNCw0MS44djQ0LjRDMTA0LDk2LDk2LDEwNCw4Ni4yLDEwNHoiLz48L3N2Zz4=) !important;
}
.owh-popup menuitem[filename="lux.exe"][style*="file:///"]{
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjQsIDEuMSkiPg0KICA8cGF0aCBmaWxsPSIjMDBiNTY5IiBkPSJNMjksMTZIMTl2LTVjMC0yLjc2MSwyLjIzOS01LDUtNWgwYzIuNzYxLDAsNSwyLjIzOSw1LDVWMTZ6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNNDIuNzU0LDI5LjU2NEMzOS42ODEsMjcuMTE1LDMyLjk1MSwyNiwyOCwyNnYtNGM1LjM4OCwwLDEzLjEzOCwxLjE2MiwxNy4yNDYsNC40MzZMNDIuNzU0LDI5LjU2NHoiIC8+DQogIDxwYXRoIGZpbGw9IiNmNWJjMDAiIGQ9Ik0yOC43NDMsMjMuODU3bC0xLjQ4Ni0zLjcxNEMzMS4zLDE4LjUyNiwzNiwxMi40MzIsMzYsN2g0QzQwLDEzLjU4MSwzNC43MzksMjEuNDU4LDI4Ljc0MywyMy44NTd6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNNDMsNDRoLTRjMC01Ljk1Mi03LjA1Ny0xMi0xMS0xMnYtNEMzNC4yNzIsMjgsNDMsMzYuMDYzLDQzLDQ0eiIgLz4NCiAgPHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTUuMjQ2LDI5LjU2NGwtMi40OTItMy4xMjhDNi44NjIsMjMuMTYyLDE0LjYxMiwyMiwyMCwyMnY0QzE1LjA0OSwyNiw4LjMxOSwyNy4xMTUsNS4yNDYsMjkuNTY0eiIgLz4NCiAgPHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTE5LjI1NywyMy44NTdDMTMuMjYxLDIxLjQ1OCw4LDEzLjU4MSw4LDdoNGMwLDUuNDMyLDQuNywxMS41MjYsOC43NDMsMTMuMTQzTDE5LjI1NywyMy44NTd6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNOSw0NEg1YzAtNy45MzgsOC43MjgtMTYsMTUtMTZ2NEMxNi4wNTcsMzIsOSwzOC4wNDgsOSw0NHoiIC8+DQogIDxwYXRoIGZpbGw9IiMzZGRhYjQiIGQ9Ik0yNCw5TDI0LDljLTUuNTIzLDAtMTAsNC40NzctMTAsMTB2MWM1LDUsMTUsNSwyMCwwdi0xQzM0LDEzLjQ3NywyOS41MjMsOSwyNCw5eiIgLz4NCiAgPHBhdGggZmlsbD0iIzNkZGFiNCIgZD0iTTE0LDIwdjl2NWMwLDUuNTIzLDQuNDc3LDEwLDEwLDEwczEwLTQuNDc3LDEwLTEwdi01di05QzI5LDE1LDE5LDE1LDE0LDIweiIgLz4NCiAgPHBhdGggZmlsbD0iIzAwYjU2OSIgZD0iTTE0LDIwYzUsNSwxNSw1LDIwLDBDMjksMTUsMTksMTUsMTQsMjB6IiAvPg0KICA8cGF0aCBmaWxsPSIjMDBiNTY5IiBkPSJNMjQsNDRjMC44OTYsMCwxLjc2MS0wLjEyNCwyLjU4Ni0wLjM0N0wyNCwyOWwtMi41ODYsMTQuNjUzQzIyLjIzOSw0My44NzYsMjMuMTA0LDQ0LDI0LDQ0eiIgLz4NCjwvc3ZnPg==) !important;
}
.owh-popup menuitem.folder {
    list-style-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBmaWxsPSIjZmVkYzc3IiBkPSJNMiAxLjUgMSAyIC41IDN2MTBsLjUgMSAxIC41aDEybDEtLjUuNS0xVjQuNWwtLjUtMS0xLS41SDcuNWwtMi0xLjV6Ii8+CiAgPHBhdGggZmlsbD0iI2E5N2EwNCIgZD0ibTIuNSAxLS4xNjQuMDA2QTIuNSAyLjUgMCAwIDAgMCAzLjV2OWwuMDA2LjE2NEEyLjUgMi41IDAgMCAwIDIuNSAxNWgxMWwuMTY0LS4wMDZBMi41IDIuNSAwIDAgMCAxNiAxMi41VjVsLS4wMDYtLjE2NC0uMDE2LS4xNjJBMi41IDIuNSAwIDAgMCAxMy41IDIuNUg3LjY2OEw2LjA2NiAxLjNsLS4xMzQtLjA4OWExLjUgMS41IDAgMCAwLS43NjYtLjIxem0wIDFoMi42NjZsLjA4LjAwNmMuMDguMDEzLjE1Ni4wNDUuMjIuMDk0bDEuMjI4LjkyMi0xLjI2IDEuMzI0LS4wNi4wNTJhLjQ5OS40OTkgMCAwIDEtLjMwMi4xMDJMMSA0LjQ5OFYzLjVsLjAwOC0uMTQ1QTEuNDk5IDEuNDk5IDAgMCAxIDIuNSAyem01LjExNyAxLjVIMTMuNWwuMTQ0LjAwOEMxNC40MDUgMy41OCAxNSA0LjIyIDE1IDV2Ny41bC0uMDA4LjE0NEExLjQ5OSAxLjQ5OSAwIDAgMSAxMy41IDE0aC0xMWwtLjE0NS0uMDA3QTEuNDk5IDEuNDk5IDAgMCAxIDEgMTIuNVY1LjQ5OGw0LjA3Mi4wMDEuMTUzLS4wMDdhMS41IDEuNSAwIDAgMCAuOTMzLS40NTd6Ii8+Cjwvc3ZnPgo=);
}
.owh-popup menuitem.info {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjIpIj4NCiAgPHBhdGggZmlsbD0iIzIxOTZmMyIgZD0iTTQ0LDI0YzAsMTEuMDQ1LTguOTU1LDIwLTIwLDIwUzQsMzUuMDQ1LDQsMjRTMTIuOTU1LDQsMjQsNFM0NCwxMi45NTUsNDQsMjR6IiAvPg0KICA8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjIgMjJoNHYxMWgtNFYyMnpNMjYuNSAxNi41YzAgMS4zNzktMS4xMjEgMi41LTIuNSAyLjVzLTIuNS0xLjEyMS0yLjUtMi41UzIyLjYyMSAxNCAyNCAxNCAyNi41IDE1LjEyMSAyNi41IDE2LjV6IiAvPg0KPC9zdmc+);
}
.owh-popup menuitem.settings {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB0cmFuc2Zvcm09InNjYWxlKDEuMDUpIj4NCiAgPHBhdGggZmlsbD0iIzMyQkVBNiIgZD0iTTUwNC4xLDI1NkM1MDQuMSwxMTksMzkzLDcuOSwyNTYsNy45QzExOSw3LjksNy45LDExOSw3LjksMjU2QzcuOSwzOTMsMTE5LDUwNC4xLDI1Niw1MDQuMUMzOTMsNTA0LjEsNTA0LjEsMzkzLDUwNC4xLDI1NnoiIC8+DQogIDxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik00MTYuMiwyNzUuM3YtMzguNmwtMzYuNi0xMS41Yy0zLjEtMTIuNC04LTI0LjEtMTQuNS0zNC44bDE3LjgtMzQuMUwzNTUuNiwxMjlsLTM0LjIsMTcuOGMtMTAuNi02LjQtMjIuMi0xMS4yLTM0LjYtMTQuM2wtMTEuNi0zNi44aC0zOC43bC0xMS42LDM2LjhjLTEyLjMsMy4xLTI0LDcuOS0zNC42LDE0LjNMMTU2LjQsMTI5TDEyOSwxNTYuNGwxNy44LDM0LjFjLTYuNCwxMC43LTExLjQsMjIuMy0xNC41LDM0LjhsLTM2LjYsMTEuNXYzOC42bDM2LjQsMTEuNWMzLjEsMTIuNSw4LDI0LjMsMTQuNSwzNS4xTDEyOSwzNTUuNmwyNy4zLDI3LjNsMzMuNy0xNy42YzEwLjgsNi41LDIyLjcsMTEuNSwzNS4zLDE0LjZsMTEuNCwzNi4yaDM4LjdsMTEuNC0zNi4yYzEyLjYtMy4xLDI0LjQtOC4xLDM1LjMtMTQuNmwzMy43LDE3LjZsMjcuMy0yNy4zbC0xNy42LTMzLjhjNi41LTEwLjgsMTEuNC0yMi42LDE0LjUtMzUuMUw0MTYuMiwyNzUuM3ogTTI1NiwzNDAuOGMtNDYuNywwLTg0LjYtMzcuOS04NC42LTg0LjZjMC00Ni43LDM3LjktODQuNiw4NC42LTg0LjZjNDYuNywwLDg0LjUsMzcuOSw4NC41LDg0LjZDMzQwLjUsMzAzLDMwMi43LDM0MC44LDI1NiwzNDAuOHoiIC8+DQo8L3N2Zz4=);
}
#tabContextMenu[photoncompact="true"] #OpenWithHelper-Tab-Menu > .menu-iconic-left {
    display: none;
}
/* Modal 按钮样式 */
.owh-btn-primary {
    padding: 6px 12px !important;
    border: 1px solid #4a90e2 !important;
    border-radius: 4px !important;
    background: #4a90e2 !important;
    color: white !important;
    cursor: pointer !important;
    font-size: 13px !important;
}
.owh-btn-primary:hover {
    background: #357ae8 !important;
}
.owh-btn-success {
    border-color: #2e7d32 !important;
    background: #34a853 !important;
}
.owh-btn-success:hover {
    background: #2e8b57 !important;
}
.owh-btn-secondary {
    padding: 4px 8px !important;
    border: 1px solid #9aa0a6 !important;
    border-radius: 4px !important;
    background: #f1f3f4 !important;
    color: #202124 !important;
    font-size: 11px !important;
    cursor: pointer !important;
}
.owh-btn-secondary:hover {
    background: #e8eaed !important;
}
.owh-condition-editor {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding: 6px 8px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.02);
}
.owh-condition-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
}
.owh-condition-main-targets {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    min-width: 0;
}
.owh-condition-details {
    display: none;
    gap: 8px;
}
.owh-condition-target-label,
.owh-condition-option-label {
    display: inline-flex;
    align-items: center;
    user-select: none;
    -moz-user-select: none;
}
.owh-condition-target-label {
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
}
.owh-condition-option-label {
    gap: 4px;
    font-size: 12px;
}
.owh-condition-section {
    display: grid;
    gap: 4px;
}
.owh-condition-section-title {
    font-size: 12px;
    font-weight: 600;
}
.owh-condition-options-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 10px;
    padding-inline-start: 12px;
}
.owh-condition-toggle {
    padding: 2px 8px !important;
    font-size: 12px !important;
    white-space: nowrap;
}
.owh-condition-legacy-note {
    font-size: 11px;
    line-height: 1.4;
    color: #a15c00;
}
.owh-param-editor {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.45);
}
.owh-param-editor-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(680px, 100%);
    max-height: 100%;
    padding: 16px;
    border-radius: 8px;
    background: var(--toolbar-bgcolor, #fff);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.owh-param-editor-title {
    font-size: 14px;
    font-weight: 600;
}
.owh-param-editor-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.owh-param-editor-shortcuts-title {
    font-size: 12px;
    font-weight: 600;
}
.owh-param-editor-shortcut-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.owh-param-editor-shortcut-btn {
    padding: 4px 8px !important;
    font: 12px/1.4 Consolas, "Courier New", monospace !important;
    white-space: nowrap;
}
.owh-param-editor-tip {
    color: #5f6368;
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
}
.owh-param-editor-textarea {
    width: 100%;
    min-height: 220px;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    font: 12px/1.5 Consolas, "Courier New", monospace;
}
.owh-param-editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
.owh-param-cell {
    display: flex;
    align-items: stretch;
    overflow: hidden;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
}
.owh-param-cell:focus-within {
    border-color: #4a90e2;
    box-shadow: 0 0 0 1px rgba(74, 144, 226, 0.2);
}
.owh-param-input {
    flex: 1;
}
.owh-param-input::placeholder {
    color: #80868b;
}
.owh-param-edit-btn {
    flex: 0 0 auto;
    min-width: 42px;
    border: none !important;
    border-left: 1px solid #d2d6dc !important;
    border-radius: 0 !important;
    background: #f8f9fa !important;
}
.owh-param-edit-btn:hover {
    background: #eef3fd !important;
}
.owh-change {
    padding: 4px 8px !important;
    border: 1px solid #4a90e2 !important;
    border-radius: 4px !important;
    background: #4a90e2 !important;
    color: white !important;
    font-size: 11px !important;
    cursor: pointer !important;
}
.owh-change:hover {
    background: #357ae8 !important;
}
.owh-btn-danger {
    padding: 4px 8px !important;
    border: 1px solid #f44336 !important;
    border-radius: 4px !important;
    background: #f44336 !important;
    color: white !important;
    font-size: 11px !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    white-space: nowrap !important;
    writing-mode: horizontal-tb !important;
    line-height: 1 !important;
}
.owh-btn-danger:hover {
    background: #d32f2f !important;
}
`, (function () {
        let PATHS = [];
        ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
            let path = Services.dirsvc.get(key, Ci.nsIFile);
            PATHS[key] = path.path;
        });
        return PATHS;
    })(), PathUtils.join(PathUtils.profileDir, "chrome",
        ...(Services.prefs.getStringPref("userChromeJS.OpenWithHelper.FILE_PATH", "_openwith.json").replace(/\\/g, "/").split("/"))),
        v => {
            return Services.vc.compare(Services.appinfo.version, v) >= 0;
        },
        function (promiser) {
            // promiser 是一个无参函数，返回 Promise
            // 例如：() => OpenWithHelper.selectDirectory("choose-directory")
            let isDone = false;            // 标记 Promise 是否已经完成
            let result;                    // 存储成功时的结果
            let error;                     // 存储错误信息
            const threadManager = Cc["@mozilla.org/thread-manager;1"].getService();
            const mainThread = threadManager.mainThread;
            // 调用传入的异步函数，并将结果/错误分别存储
            promiser()
                .then(res => {
                    result = res;
                    isDone = true;
                })
                .catch(err => {
                    error = err;
                    isDone = true;
                });
            // 轮询主线程事件，阻塞直到 Promise 执行完毕
            while (!isDone) {
                mainThread.processNextEvent(true);
            }
            // 如果有错误，则抛出错误
            if (error) {
                throw error;
            }
            // 返回结果
            return result;
        }
    ))
}
