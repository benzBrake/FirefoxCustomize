// ==UserScript==
// @name            ucf_drag_ModR.uc.js
// @description     鼠标拖拽 Drag & Go，来自于 Mozilla-Russia 论坛，Ryan 修改自用
// @author          Ryan, Dumby
// @include         main
// @version         2026.05.18
// @compatibility   Firefox 149
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/ucf_drag_ModR
// @referenceURL    https://forum.mozilla-russia.org/viewtopic.php?pid=797234#p797234
// @note            2026.05.18 脚本迁移到 ucf_drag_ModR/ 目录，默认配置文件改为与脚本同目录
// @note            2026.04.24 重构为外置配置 + 动作注册表 + 自绘拖拽 tooltip
// @note            2026.04.24 可在 about:config 设置 userChromeJS.UCFDrag.FILE_PATH 自定义配置文件路径；默认读取与脚本同目录下的 _ucf_drag_ModR.config.js，自定义相对路径基于 chrome 目录，也支持绝对路径
// @note            2026.04.03 修复搜索失效
// @note            2025.04.10 替换 Yandex 以图搜图为 AI反查图片，简化代码
// @note            2025.04.05 修复保存非英文文本乱码
// @note            2024.03.06 增加复制链接文本
// @note            2024.02.29 修复站内搜索失效
// @note            2026.04.02 升级兼容性至 Firefox 149+，使用 ESM 模块化搜索服务
// @onlyonce
// ==/UserScript==
(function () {
    if (window.UCFDrag) {
        return;
    }

    const PREF_BRANCH = "userChromeJS.UCFDrag.";
    const DEFAULT_FILE_PATH = "_ucf_drag_ModR.config.js";
    const TOOLTIP_STYLE_ID = "ucf-drag-tooltip-style";
    const TOOLTIP_ID = "ucf-drag-tooltip";
    const TOOLTIP_TIMEOUT_MS = 1800;
    const VISUAL_EDITOR_STYLE_ID = "ucf-drag-visual-editor-style";
    const VISUAL_EDITOR_ID = "ucf-drag-visual-editor";
    const LOG_PREFIX = "[UCFDrag]";
    const XHTML_NS = "http://www.w3.org/1999/xhtml";
    const DEFAULT_CONFIG_DIR = (() => {
        try {
            let spec = (Components.stack.filename || Error().fileName || "").split("?")[0];
            if (spec.startsWith("chrome://")) {
                const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                spec = registry.convertChromeURL(Services.io.newURI(spec)).spec;
            }
            if (spec.startsWith("file://")) {
                const fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
                return fileHandler.getFileFromURLSpec(spec).parent;
            }
        } catch (error) { }
        const fallback = Services.dirsvc.get("UChrm", Ci.nsIFile);
        fallback.append("ucf_drag_ModR");
        return fallback;
    })();
    const DEFAULT_CONFIG_SOURCE = `({
    version: 1,
    actions: {
        openLinkForeground: { type: "builtin", name: "open", args: { where: "tab" } },
        openLinkBackground: { type: "builtin", name: "open", args: { where: "tabshifted" } },
        openLinkCurrent: { type: "builtin", name: "open", args: { where: "current" } },
        saveUrl: { type: "builtin", name: "saveUrl" },
        copyLinkText: { type: "builtin", name: "copy", args: { valueSource: "linkText" } },
        copyValue: { type: "builtin", name: "copy" },
        searchDefaultForeground: { type: "builtin", name: "search", args: { engine: "@default", where: "tab" } },
        searchDefaultBackground: { type: "builtin", name: "search", args: { engine: "@default", where: "tabshifted" } },
        searchBaiduForeground: { type: "builtin", name: "search", args: { engine: "百度", where: "tab" } },
        searchBaiduBackground: { type: "builtin", name: "search", args: { engine: "百度", where: "tabshifted" } },
        saveText: { type: "builtin", name: "saveText" },
        siteSearchCurrent: { type: "builtin", name: "siteSearch", args: { engine: "@default", where: "current" } },
        siteSearchForeground: { type: "builtin", name: "siteSearch", args: { engine: "@default", where: "tab" } },
        openSimilarSites: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tab",
                prefix: "https://www.similarsites.com/site/",
                valueSource: "value",
                transform: "hostnameNoWWW"
            }
        },
        openWebArchive: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tab",
                prefix: "https://web.archive.org/web/*/",
                valueSource: "value",
                transform: "hostnameNoWWW"
            }
        },
        openCambridgeForeground: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tab",
                prefix: "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/",
                valueSource: "value",
                transform: "encode"
            }
        },
        openCambridgeBackground: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tabshifted",
                prefix: "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/",
                valueSource: "value",
                transform: "encode"
            }
        },
        openGoogleLens: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tab",
                prefix: "https://lens.google.com/uploadbyurl?url=",
                valueSource: "value",
                transform: "encode"
            }
        },
        openLenso: {
            type: "builtin",
            name: "openBuiltUrl",
            args: {
                where: "tabshifted",
                prefix: "https://lenso.ai/en/search-by-url?url=",
                valueSource: "value",
                transform: "encode"
            }
        }
        // 示例：
        // customAsyncAction: async ({ input, api }) => {
        //     await api.open("https://example.com?q=" + encodeURIComponent(input.value), "tab");
        // }
    },
    gestures: {
        link: [
            { dir: "U", name: "打开链接（新标签，前台）", action: "openLinkForeground" },
            { dir: "R", name: "打开链接（新标签，后台）", action: "openLinkBackground" },
            { dir: "RD", name: "另存链接", action: "saveUrl" },
            { dir: "L", name: "复制链接文本", action: "copyLinkText" },
            { dir: "L", shift: true, name: "复制链接", action: "copyValue" },
            { dir: "D", name: "打开链接（当前标签）", action: "openLinkCurrent" },
            { dir: "LD", name: "以站搜站（新标签，前台）", action: "openSimilarSites" },
            { dir: "LD", shift: true, name: "网页历史（新标签，前台）", action: "openWebArchive" }
        ],
        text: [
            { dir: "U", name: "搜索文本（新标签，前台）", action: "searchDefaultForeground" },
            { dir: "U", shift: true, name: "搜索文本（新标签，后台）", action: "searchDefaultBackground" },
            { dir: "R", name: "百度搜索（新标签，前台）", action: "searchBaiduForeground" },
            { dir: "U", shift: true, name: "百度搜索（新标签，后台）", action: "searchBaiduBackground" },
            { dir: "RD", name: "另存文本", action: "saveText" },
            { dir: "D", name: "站内搜索（当前标签）", action: "siteSearchCurrent" },
            { dir: "D", ctrl: true, name: "站内搜索（新标签，前台）", action: "siteSearchForeground" },
            { dir: "L", name: "复制文本", action: "copyValue" },
            { dir: "LD", name: "剑桥词典（新标签，前台）", action: "openCambridgeForeground" },
            { dir: "LD", shift: true, name: "剑桥词典（新标签，后台）", action: "openCambridgeBackground" }
        ],
        image: [
            { dir: "U", name: "打开图像（新标签，前台）", action: "openLinkForeground" },
            { dir: "R", name: "打开图像（新标签，后台）", action: "openLinkBackground" },
            { dir: "RD", name: "另存图像", action: "saveUrl" },
            { dir: "L", name: "复制图片链接", action: "copyValue" },
            { dir: "LD", name: "谷歌搜图（新标签，前台）", action: "openGoogleLens" },
            { dir: "LD", shift: true, name: "AI 反向图像搜索（新标签，前台）", action: "openLenso" }
        ]
    }
})`;

    window.UCFDrag = {
        lazy: {},
        currentDrag: null,
        activeConfig: null,
        rawConfigSnapshot: null,
        configSandbox: null,
        observedWindows: new WeakSet(),
        resolvedGestures: {
            link: [],
            text: [],
            image: []
        },
        textLinkRe: /^([a-z]+:\/\/)?([a-z]([a-z0-9\-]*\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-z][a-z0-9_]*)?$|^custombutton:\/\/\S+$/,
        imageLinkRe: /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg|avif|webp))/,
        events: ["dragover", "drop", "dragend"],
        get prefs () {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch(PREF_BRANCH);
        },
        get debug () {
            return this.prefs.getBoolPref("DEBUG", false);
        },
        set debug (value) {
            this.prefs.setBoolPref("DEBUG", !!value);
            return !!value;
        },
        get allowCustomActions () {
            return this.prefs.getBoolPref("ALLOW_CUSTOM_ACTIONS", true);
        },
        get builtinActionMeta () {
            delete this.builtinActionMeta;
            return this.builtinActionMeta = {
                open: { label: "打开链接" },
                search: { label: "搜索文本" },
                siteSearch: { label: "站内搜索" },
                copy: { label: "复制内容" },
                saveText: { label: "保存文本" },
                saveUrl: { label: "保存链接/图片" },
                openBuiltUrl: { label: "按模板构造并打开 URL" },
                notify: { label: "显示提示" }
            };
        },
        get defaultActionLabels () {
            delete this.defaultActionLabels;
            return this.defaultActionLabels = {
                openLinkForeground: "打开链接（新标签，前台）",
                openLinkBackground: "打开链接（新标签，后台）",
                openLinkCurrent: "打开链接（当前标签）",
                saveUrl: "另存链接/图像",
                copyLinkText: "复制链接文本",
                copyValue: "复制当前值",
                searchDefaultForeground: "搜索文本（新标签，前台）",
                searchDefaultBackground: "搜索文本（新标签，后台）",
                searchBaiduForeground: "百度搜索（新标签，前台）",
                searchBaiduBackground: "百度搜索（新标签，后台）",
                saveText: "另存文本",
                siteSearchCurrent: "站内搜索（当前标签）",
                siteSearchForeground: "站内搜索（新标签，前台）",
                openSimilarSites: "相似站点",
                openWebArchive: "网页历史",
                openCambridgeForeground: "剑桥词典（前台）",
                openCambridgeBackground: "剑桥词典（后台）",
                openGoogleLens: "谷歌搜图",
                openLenso: "AI 反向图像搜索"
            };
        },
        getBuiltinActionDisplayName (name) {
            const meta = this.builtinActionMeta[name];
            return meta?.label || name;
        },
        getActionDisplayLabel (action) {
            if (!action) {
                return "";
            }
            if (action.label) {
                return action.label;
            }
            if (action.id && this.defaultActionLabels[action.id]) {
                return this.defaultActionLabels[action.id];
            }
            if (action.type === "builtin" && action.name) {
                return this.getBuiltinActionDisplayName(action.name);
            }
            return action.id || "";
        },
        get fileURLGetter () {
            delete this.fileURLGetter;
            const handler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return this.fileURLGetter = ("getURLSpecFromFile" in handler)
                ? file => handler.getURLSpecFromFile(file)
                : file => handler.getURLSpecFromActualFile(file);
        },
        get actionRegistry () {
            delete this.actionRegistry;
            return this.actionRegistry = {
                open: async (context, args = {}) => {
                    const url = this.resolveActionValue(args.valueSource || "value", context);
                    if (!url) {
                        return;
                    }
                    this.openLink(url, args.where || "tab", context.browserWindow, args.options);
                },
                search: async (context, args = {}) => {
                    const value = this.resolveActionValue(args.valueSource || "value", context);
                    if (!value) {
                        return;
                    }
                    await this.searchWithEngine(
                        value,
                        args.where || "tab",
                        args.engine || "@default",
                        !!args.addToHistory,
                        context.browserWindow
                    );
                },
                siteSearch: async (context, args = {}) => {
                    const value = this.resolveActionValue(args.valueSource || "value", context);
                    const query = this.buildSiteSearchTerm(value, context.env.currentUrl);
                    if (!query) {
                        return;
                    }
                    await this.searchWithEngine(
                        query,
                        args.where || "current",
                        args.engine || "@default",
                        !!args.addToHistory,
                        context.browserWindow
                    );
                },
                copy: async (context, args = {}) => {
                    const value = this.resolveActionValue(args.valueSource || "value", context);
                    if (!value) {
                        return;
                    }
                    this.copyString(value);
                },
                saveText: async (context, args = {}) => {
                    const value = this.resolveActionValue(args.valueSource || "value", context);
                    if (!value) {
                        return;
                    }
                    await this.saveText(value, context.browserWindow);
                },
                saveUrl: async (context, args = {}) => {
                    const value = this.resolveActionValue(args.valueSource || "value", context);
                    if (!value) {
                        return;
                    }
                    this.saveAs(value, null, null, null, null, null, context.browserWindow);
                },
                openBuiltUrl: async (context, args = {}) => {
                    const url = this.buildConfiguredUrl(args, context);
                    if (!url) {
                        return;
                    }
                    this.openLink(url, args.where || "tab", context.browserWindow, args.options);
                },
                notify: async (context, args = {}) => {
                    const title = args.title || "UCFDrag";
                    const message = args.message || this.resolveActionValue(args.valueSource || "value", context);
                    if (!message) {
                        return;
                    }
                    this.flashTooltip(context.browserWindow, `${title}: ${message}`, !!args.error);
                }
            };
        },
        async initSearchService () {
            if (this._searchServiceInitPromise) {
                return this._searchServiceInitPromise;
            }
            this._searchServiceInitPromise = (async () => {
                if (typeof Services.search !== "undefined") {
                    this.searchService = Services.search;
                } else {
                    ChromeUtils.defineESModuleGetters(this.lazy, {
                        SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
                    });
                    this.searchService = this.lazy.SearchService;
                }
                if (!this.searchService.isInitialized) {
                    await this.searchService.init();
                }
                return this.searchService;
            })();
            return this._searchServiceInitPromise;
        },
        getSearchbar (browserWindow) {
            return browserWindow?.BrowserSearch?.searchBar || browserWindow?.document?.getElementById("searchbar") || null;
        },
        async searchWithEngine (val, where, engine, addToHistory, browserWindow) {
            await this.initSearchService();
            const resolvedEngine = await this.getEngineByName(engine, browserWindow);
            const submission = resolvedEngine.getSubmission(val, null);
            this.openLink(
                submission.uri.spec,
                where,
                browserWindow,
                { postData: submission.postData }
            );
            if (addToHistory) {
                this.updateSearchbarHistory(val, browserWindow);
            }
        },
        async getEngineByName (engineName, browserWindow) {
            await this.initSearchService();
            const UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                .createInstance(Ci.nsIScriptableUnicodeConverter);
            UI.charset = "UTF-8";
            const searchService = this.searchService;
            if (String(engineName).toUpperCase() === "CURRENT") {
                const searchbar = this.getSearchbar(browserWindow);
                if (searchbar) {
                    return searchbar.currentEngine;
                }
            } else {
                try {
                    engineName = UI.ConvertToUnicode(engineName);
                } catch (error) { }
                const engine = searchService.getEngineByName(engineName);
                if (engine) {
                    return engine;
                }
            }
            return searchService.defaultEngine;
        },
        copyToSearchBar (searchText, browserWindow) {
            const searchbar = this.getSearchbar(browserWindow);
            if (!searchbar) {
                return;
            }
            searchbar.value = searchText;
        },
        updateSearchbarHistory (searchText, browserWindow) {
            this.copyToSearchBar(searchText, browserWindow);
            const searchbar = this.getSearchbar(browserWindow);
            if (!searchbar) {
                return;
            }
            if (typeof searchbar.FormHistory === "object") {
                if (searchText && !browserWindow.PrivateBrowsingUtils.isWindowPrivate(browserWindow)) {
                    searchbar.FormHistory.update({
                        op: "bump",
                        fieldname: searchbar._textbox.getAttribute("autocompletesearchparam"),
                        value: searchText
                    }, {
                        handleError (aError) {
                            Components.utils.reportError("Saving search to form history failed: " + aError.message);
                        }
                    });
                }
                return;
            }
            if (searchText) {
                searchbar._textbox._formHistSvc
                    .addEntry(searchbar._textbox.getAttribute("autocompletesearchparam"), searchText);
            }
        },
        copyString (text) {
            const cs = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
            cs.copyString(text);
        },
        saveAs (aURL, aFileName, aReferrer, aSourceDocument, aContentType, aContentDisposition, browserWindow = window) {
            const { gBrowser, PrivateBrowsingUtils, internalSave, saveImageURL, saveURL } = browserWindow;
            const createContentPrincipal = Services.scriptSecurityManager.createContentPrincipal
                || Services.scriptSecurityManager.createCodebasePrincipal;
            const aPrincipal = createContentPrincipal(Services.io.newURI(aURL), {});
            const isPrivate = PrivateBrowsingUtils.isBrowserPrivate(gBrowser.selectedBrowser);
            const firefoxVer = parseFloat(Services.appinfo.version);
            const imageLinkRegExp = /(.+)\.(png|jpg|jpeg|gif|bmp)$/i;
            if (aReferrer instanceof HTMLDocument) {
                aReferrer = aReferrer.documentURIObject;
            } else if (typeof aReferrer === "string") {
                aReferrer = Services.io.newURI(aReferrer);
            }
            if (firefoxVer >= 70) {
                const referrerInfo = Cc["@mozilla.org/referrer-info;1"].createInstance(Ci.nsIReferrerInfo);
                referrerInfo.init(
                    Ci.nsIHttpChannel.REFERRER_POLICY_NO_REFERRER_WHEN_DOWNGRADE,
                    true,
                    aReferrer
                );
                aReferrer = referrerInfo;
            }
            if (imageLinkRegExp.test(aURL) || /^image\//i.test(aContentType)) {
                if (firefoxVer >= 102.3) {
                    const cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else if (firefoxVer >= 84) {
                    const cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else if (firefoxVer >= 77) {
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else {
                    if (/^data:/.test(aURL)) {
                        saveImageURL(aURL, "index.png", null, true, false, aReferrer, aSourceDocument, aContentType, aContentDisposition, isPrivate, aPrincipal);
                    } else {
                        saveImageURL(aURL, null, null, false, false, aReferrer, aSourceDocument, aContentType, aContentDisposition, isPrivate, aPrincipal);
                    }
                }
                return;
            }
            if (firefoxVer >= 102.3) {
                const cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                saveURL(aURL, null, aFileName, null, true, false, aReferrer, cookieJarSettings, aSourceDocument, isPrivate, aPrincipal);
            } else if (firefoxVer >= 84) {
                const cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                saveURL(aURL, aFileName, null, true, false, aReferrer, cookieJarSettings, aSourceDocument, isPrivate, aPrincipal);
            } else {
                saveURL(aURL, aFileName, null, true, false, aReferrer, aSourceDocument, isPrivate, aPrincipal);
            }
        },
        async saveText (text, browserWindow = window) {
            const { Cc, Ci, gBrowser } = browserWindow;
            const { nsIFilePicker } = Ci;
            const fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
            fp.init(
                !("inIsolatedMozBrowser" in browserWindow.browsingContext.originAttributes)
                    ? browserWindow.browsingContext
                    : browserWindow,
                "Select a File",
                Ci.nsIFilePicker.modeSave
            );
            fp.appendFilters(nsIFilePicker.filterText);
            fp.defaultString = gBrowser.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "") + ".txt";
            let file = null;
            switch (await new Promise(resolve => fp.open(resolve))) {
                case nsIFilePicker.returnOK:
                case nsIFilePicker.returnReplace:
                    file = fp.file;
                    break;
                case nsIFilePicker.returnCancel:
                default:
                    return null;
            }
            await IOUtils.writeUTF8(file.path, text);
            return file;
        },
        getDroppedURL_Fixup (url) {
            if (!url) {
                return null;
            }
            if (/^h?.?.p(s?):(.+)$/i.test(url)) {
                url = "http" + RegExp.$1 + ":" + RegExp.$2;
                if (!RegExp.$2) {
                    return null;
                }
            }
            try {
                url = Services.uriFixup.getFixupURIInfo(
                    url,
                    Services.uriFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP
                ).preferredURI.spec;
                if (!url
                    || !url.length
                    || url.includes(" ")
                    || /^\s*javascript:/.test(url)
                    || (/^\s*data:/.test(url) && !/^\s*data:image\//.test(url))) {
                    return null;
                }
                return url;
            } catch (error) {
                return null;
            }
        },
        printDataTransferTypes (event) {
            const dt = event.dataTransfer;
            console.info(LOG_PREFIX, "print dataTransfer type:");
            for (const type of dt.types) {
                console.info(LOG_PREFIX, type + ":", dt.getData(type));
            }
        },
        openLink (url, where = "tab", browserWindow = window, opts = null) {
            if (!url) {
                return;
            }
            browserWindow.openTrustedLinkIn(url, where, {
                ...this.getOpenOptions(browserWindow),
                ...(opts || {})
            });
        },
        getOpenOptions (browserWindow = window) {
            const options = {
                triggeringPrincipal: Cu.getObjectPrincipal(this)
            };
            const userContextId = parseInt(browserWindow.gBrowser.selectedBrowser.getAttribute("usercontextid"));
            if (!Number.isNaN(userContextId)) {
                options.userContextId = userContextId;
            }
            options.private = browserWindow.PrivateBrowsingUtils.isWindowPrivate(browserWindow);
            return options;
        },
        createConfigSandbox () {
            return Cu.Sandbox(null, {
                sandboxName: "UCFDragConfig",
                wantGlobalProperties: ["URL", "URLSearchParams", "TextEncoder", "TextDecoder", "atob", "btoa"]
            });
        },
        destroyConfigSandbox (sandbox) {
            if (!sandbox) {
                return;
            }
            try {
                Cu.nukeSandbox(sandbox);
            } catch (error) { }
        },
        async ensureConfigFileExists () {
            const file = this.resolveConfigFile();
            if (await IOUtils.exists(file.path)) {
                return file;
            }
            await IOUtils.makeDirectory(PathUtils.parent(file.path), {
                createAncestors: true,
                ignoreExisting: true
            });
            await IOUtils.writeUTF8(file.path, DEFAULT_CONFIG_SOURCE);
            this.flashTooltip(window, `已创建默认拖拽配置：${file.leafName}`);
            return file;
        },
        resolveConfigFile () {
            let prefPath = DEFAULT_FILE_PATH;
            try {
                prefPath = this.prefs.getStringPref("FILE_PATH", DEFAULT_FILE_PATH).trim() || DEFAULT_FILE_PATH;
            } catch (error) { }
            if (this.isAbsolutePath(prefPath)) {
                const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                file.initWithPath(prefPath);
                return file;
            }
            if (prefPath === DEFAULT_FILE_PATH) {
                const file = DEFAULT_CONFIG_DIR.clone();
                file.append(DEFAULT_FILE_PATH);
                return file;
            }
            const file = Services.dirsvc.get("UChrm", Ci.nsIFile);
            for (const part of prefPath.replace(/\\/g, "/").split("/").filter(Boolean)) {
                file.append(part);
            }
            return file;
        },
        createMenuNode (browserWindow, tag, attrs = {}) {
            const node = browserWindow.document.createXULElement(tag);
            for (const [key, value] of Object.entries(attrs)) {
                if (value === undefined || value === null) {
                    continue;
                }
                node.setAttribute(key, String(value));
            }
            return node;
        },
        createHtmlNode (browserWindow, tag, attrs = {}, styles = {}) {
            const node = browserWindow.document.createElementNS(XHTML_NS, tag);
            for (const [key, value] of Object.entries(attrs)) {
                if (value === undefined || value === null) {
                    continue;
                }
                if (key === "textContent") {
                    node.textContent = value;
                    continue;
                }
                if (key === "className") {
                    node.className = value;
                    continue;
                }
                node.setAttribute(key, String(value));
            }
            Object.assign(node.style, styles);
            return node;
        },
        stringifyArgs (value) {
            if (!value || typeof value !== "object" || !Object.keys(value).length) {
                return "{}";
            }
            return JSON.stringify(value, null, 2);
        },
        captureRawConfig (rawConfig) {
            const actions = [];
            const rawActions = rawConfig?.actions || {};
            for (const [id, rawAction] of Object.entries(rawActions)) {
                if (typeof rawAction === "function") {
                    actions.push({
                        id,
                        type: "function",
                        label: this.defaultActionLabels[id] || "",
                        source: rawAction.toString()
                    });
                    continue;
                }
                if (rawAction?.type === "builtin") {
                    actions.push({
                        id,
                        type: "builtin",
                        label: rawAction.label || this.defaultActionLabels[id] || "",
                        name: rawAction.name || "",
                        argsText: this.stringifyArgs(this.cloneArgs(rawAction.args))
                    });
                    continue;
                }
                if (rawAction?.type === "function" && typeof rawAction.run === "function") {
                    actions.push({
                        id,
                        type: "function",
                        label: rawAction.label || this.defaultActionLabels[id] || "",
                        source: rawAction.run.toString()
                    });
                    continue;
                }
            }
            const cloneRules = rules => (Array.isArray(rules) ? rules : []).map(rule => ({
                dir: String(rule.dir || ""),
                shift: !!rule.shift,
                ctrl: !!rule.ctrl,
                name: String(rule.name || ""),
                action: String(rule.action || "")
            }));
            return {
                version: rawConfig?.version || 1,
                actions,
                gestures: {
                    link: cloneRules(rawConfig?.gestures?.link),
                    text: cloneRules(rawConfig?.gestures?.text),
                    image: cloneRules(rawConfig?.gestures?.image)
                }
            };
        },
        cloneVisualDraft (draft) {
            return {
                version: draft?.version || 1,
                actions: (draft?.actions || []).map(action => ({ ...action })),
                gestures: {
                    link: (draft?.gestures?.link || []).map(rule => ({ ...rule })),
                    text: (draft?.gestures?.text || []).map(rule => ({ ...rule })),
                    image: (draft?.gestures?.image || []).map(rule => ({ ...rule }))
                }
            };
        },
        isAbsolutePath (path) {
            return /^[a-z]:[\\/]/i.test(path) || path.startsWith("/") || path.startsWith("\\\\");
        },
        async getOrSetEditorPath (browserWindow = window) {
            try {
                const editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                if (editor?.exists()) {
                    return editor;
                }
            } catch (error) { }

            this.flashTooltip(browserWindow, "请先设置外部编辑器路径", true);
            const fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            fp.init(
                !("inIsolatedMozBrowser" in browserWindow.browsingContext.originAttributes)
                    ? browserWindow.browsingContext
                    : browserWindow,
                "设置全局脚本编辑器",
                fp.modeOpen
            );
            fp.appendFilters(Ci.nsIFilePicker.filterApps);
            const file = await new Promise(resolve => {
                if (typeof fp.show !== "undefined") {
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
        async editConfig (browserWindow = window) {
            const file = await this.ensureConfigFileExists();
            const editor = await this.getOrSetEditorPath(browserWindow);
            if (!editor || !file?.exists() || !file.isFile()) {
                return;
            }
            const url = this.fileURLGetter(file);
            browserWindow.gViewSourceUtils.openInExternalEditor(
                { URL: url, lineNumber: null },
                null,
                null,
                null,
                null
            );
        },
        createMenuitem (browserWindow = window) {
            const doc = browserWindow.document;
            if (doc.getElementById("toolsbar_UCFDrag_menu")) {
                return;
            }
            const menu = this.createMenuNode(browserWindow, "menu", {
                id: "toolsbar_UCFDrag_menu",
                label: "UCFDrag 鼠标拖拽",
                tooltiptext: "拖拽手势设置\n左键展开菜单\n右键编辑配置"
            });
            const popup = this.createMenuNode(browserWindow, "menupopup", {
                id: "toolsbar_UCFDrag_popup"
            });

            const visualItem = this.createMenuNode(browserWindow, "menuitem", {
                id: "toolsbar_UCFDrag_visual",
                label: "可视化编辑"
            });
            visualItem.addEventListener("command", () => {
                void this.openVisualEditor(browserWindow);
            });

            const editItem = this.createMenuNode(browserWindow, "menuitem", {
                id: "toolsbar_UCFDrag_edit",
                label: "编辑配置"
            });
            editItem.addEventListener("command", () => {
                void this.editConfig(browserWindow);
            });

            const reloadItem = this.createMenuNode(browserWindow, "menuitem", {
                id: "toolsbar_UCFDrag_reload",
                label: "重载配置"
            });
            reloadItem.addEventListener("command", () => {
                void this.reloadConfig({ silent: false, browserWindow });
            });

            popup.appendChild(visualItem);
            popup.appendChild(editItem);
            popup.appendChild(reloadItem);
            menu.appendChild(popup);
            menu.addEventListener("click", event => {
                if (event.button === 2) {
                    event.preventDefault();
                    event.stopPropagation();
                    void this.editConfig(browserWindow);
                }
            });

            const insertPoint = doc.getElementById("devToolsSeparator") || doc.getElementById("menu_preferences");
            if (insertPoint?.parentNode) {
                insertPoint.parentNode.insertBefore(menu, insertPoint);
            } else {
                doc.getElementById("menu_ToolsPopup")?.appendChild(menu);
            }
        },
        ensureVisualEditorStyle (browserWindow = window) {
            const doc = browserWindow.document;
            if (doc.getElementById(VISUAL_EDITOR_STYLE_ID)) {
                return;
            }
            const style = doc.createElementNS(XHTML_NS, "style");
            style.id = VISUAL_EDITOR_STYLE_ID;
            style.textContent = `
                #${VISUAL_EDITOR_ID} {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    margin: 0;
                    border: none;
                    background: transparent;
                    box-sizing: border-box;
                    width: 100vw;
                    height: 100vh;
                    min-width: 100vw;
                    min-height: 100vh;
                    max-width: none;
                    max-height: none;
                    font: menu;
                }
                #${VISUAL_EDITOR_ID}::backdrop {
                    background: rgba(15, 23, 42, .38);
                    backdrop-filter: blur(6px);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-panel {
                    width: min(1100px, calc(100vw - 40px));
                    max-height: calc(100vh - 40px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                    border-radius: 16px;
                    background: var(--arrowpanel-background, #fff);
                    color: var(--arrowpanel-color, #1f2937);
                    box-shadow: 0 20px 50px rgba(15, 23, 42, .22);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-header {
                    padding: 18px 20px 12px;
                    border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-title {
                    font-size: 18px;
                    font-weight: 700;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-subtitle {
                    margin-top: 6px;
                    font-size: 12px;
                    color: color-mix(in srgb, currentColor 62%, transparent);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-content {
                    display: grid;
                    grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
                    gap: 0;
                    min-height: 0;
                    flex: 1;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-section {
                    min-height: 0;
                    overflow: auto;
                    padding: 18px 20px 20px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-section + .ucfd-ve-section {
                    border-left: 1px solid color-mix(in srgb, currentColor 10%, transparent);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-section-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 12px;
                    font-size: 14px;
                    font-weight: 700;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-card {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 12px;
                    border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                    border-radius: 12px;
                    background: color-mix(in srgb, currentColor 2%, transparent);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-card-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-card-title {
                    font-size: 13px;
                    font-weight: 700;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 0;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-field-wide {
                    grid-column: 1 / -1;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: color-mix(in srgb, currentColor 72%, transparent);
                }
                #${VISUAL_EDITOR_ID} :is(input, select, textarea) {
                    width: 100%;
                    min-width: 0;
                    padding: 8px 10px;
                    border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
                    border-radius: 10px;
                    background: color-mix(in srgb, currentColor 1%, var(--arrowpanel-background, #fff));
                    color: inherit;
                    font: inherit;
                    box-sizing: border-box;
                }
                #${VISUAL_EDITOR_ID} textarea {
                    min-height: 108px;
                    resize: vertical;
                    font-family: Consolas, "Microsoft YaHei UI", monospace;
                    font-size: 12px;
                    line-height: 1.5;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-checks {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                    padding-top: 2px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-check input {
                    width: auto;
                    margin: 0;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-tab {
                    padding: 7px 12px;
                    border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                    border-radius: 999px;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    font: inherit;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-tab[data-active="true"] {
                    background: #2563eb;
                    border-color: #2563eb;
                    color: #fff;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 14px 20px 20px;
                    border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-actions-right {
                    display: flex;
                    gap: 10px;
                }
                #${VISUAL_EDITOR_ID} button {
                    border: none;
                    border-radius: 10px;
                    padding: 8px 14px;
                    font: inherit;
                    cursor: pointer;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-btn-secondary {
                    background: color-mix(in srgb, currentColor 8%, transparent);
                    color: inherit;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-btn-danger {
                    background: #b42318;
                    color: #fff;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-btn-primary {
                    background: #2563eb;
                    color: #fff;
                    font-weight: 700;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-note {
                    font-size: 12px;
                    line-height: 1.55;
                    color: color-mix(in srgb, currentColor 72%, transparent);
                    margin-bottom: 12px;
                }
                #${VISUAL_EDITOR_ID} .ucfd-ve-hidden {
                    display: none !important;
                }
                @media (max-width: 900px) {
                    #${VISUAL_EDITOR_ID} .ucfd-ve-content {
                        grid-template-columns: 1fr;
                    }
                    #${VISUAL_EDITOR_ID} .ucfd-ve-section + .ucfd-ve-section {
                        border-left: none;
                        border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
                    }
                }
            `;
            doc.documentElement.appendChild(style);
        },
        closeVisualEditor (browserWindow = window) {
            const root = browserWindow.document.getElementById(VISUAL_EDITOR_ID);
            if (!root) {
                return;
            }
            try {
                if (root.open) {
                    root.close();
                }
            } catch (error) { }
            root.remove();
        },
        serializeVisualAction (action, indent) {
            if (action.type === "function") {
                return `${indent}${JSON.stringify(action.id)}: { type: "function", label: ${JSON.stringify(action.label || "")}, run: ${action.source.trim()} }`;
            }
            return `${indent}${JSON.stringify(action.id)}: { type: "builtin", label: ${JSON.stringify(action.label || "")}, name: ${JSON.stringify(action.name)}, args: ${this.stringifyArgs(action.args || {})} }`;
        },
        serializeVisualRule (rule, indent) {
            const parts = [
                `dir: ${JSON.stringify(rule.dir)}`,
                rule.shift ? "shift: true" : null,
                rule.ctrl ? "ctrl: true" : null,
                `name: ${JSON.stringify(rule.name)}`,
                `action: ${JSON.stringify(rule.action)}`
            ].filter(Boolean);
            return `${indent}{ ${parts.join(", ")} }`;
        },
        serializeVisualDraft (draft) {
            const actionIndent = "        ";
            const ruleIndent = "            ";
            const actionsSource = draft.actions.length
                ? draft.actions.map(action => this.serializeVisualAction(action, actionIndent)).join(",\n")
                : "";
            const serializeRules = rules => rules.length
                ? rules.map(rule => this.serializeVisualRule(rule, ruleIndent)).join(",\n")
                : "";
            return `({
    version: ${draft.version || 1},
    actions: {
${actionsSource}
    },
    gestures: {
        link: [
${serializeRules(draft.gestures.link)}
        ],
        text: [
${serializeRules(draft.gestures.text)}
        ],
        image: [
${serializeRules(draft.gestures.image)}
        ]
    }
})`;
        },
        collectVisualEditorDraft (root) {
            const actions = [...root.querySelectorAll(".ucfd-ve-action-card")].map(card => {
                const id = card.querySelector("[data-field='id']").value.trim();
                const label = card.querySelector("[data-field='label']").value.trim();
                const type = card.querySelector("[data-field='type']").value;
                if (!id) {
                    throw new Error("动作 ID 不能为空");
                }
                if (type === "builtin") {
                    const builtinName = card.querySelector("[data-field='builtinName']").value.trim();
                    if (!builtinName) {
                        throw new Error(`动作 ${id} 缺少内建动作名`);
                    }
                    const argsText = card.querySelector("[data-field='args']").value.trim() || "{}";
                    let args = {};
                    try {
                        args = JSON.parse(argsText);
                    } catch (error) {
                        throw new Error(`动作 ${id} 的参数 JSON 无效`);
                    }
                    return { id, type, label, name: builtinName, args };
                }
                const source = card.querySelector("[data-field='source']").value.trim();
                if (!source) {
                    throw new Error(`动作 ${id} 的函数体不能为空`);
                }
                return { id, type, label, source };
            });
            const actionIds = new Set();
            for (const action of actions) {
                if (actionIds.has(action.id)) {
                    throw new Error(`动作 ID 重复：${action.id}`);
                }
                actionIds.add(action.id);
            }
            const collectRules = type => [...root.querySelectorAll(`.ucfd-ve-rule-card[data-context='${type}']`)].map(card => {
                const dir = card.querySelector("[data-field='dir']").value.trim().toUpperCase();
                const name = card.querySelector("[data-field='name']").value.trim();
                const action = card.querySelector("[data-field='action']").value.trim();
                if (!dir) {
                    throw new Error(`${type} 手势存在空方向`);
                }
                if (!action) {
                    throw new Error(`${type} 手势 ${dir} 缺少动作`);
                }
                if (!actionIds.has(action)) {
                    throw new Error(`${type} 手势 ${dir} 引用了不存在的动作：${action}`);
                }
                return {
                    dir,
                    shift: card.querySelector("[data-field='shift']").checked,
                    ctrl: card.querySelector("[data-field='ctrl']").checked,
                    name: name || action,
                    action
                };
            });
            return {
                version: 1,
                actions,
                gestures: {
                    link: collectRules("link"),
                    text: collectRules("text"),
                    image: collectRules("image")
                }
            };
        },
        refreshVisualEditorActionOptions (root) {
            const browserWindow = root.ownerDocument.defaultView;
            const ids = [...root.querySelectorAll(".ucfd-ve-action-card [data-field='id']")]
                .map(input => {
                    const card = input.closest(".ucfd-ve-action-card");
                    const id = input.value.trim();
                    const label = card?.querySelector("[data-field='label']")?.value.trim() || "";
                    return { id, label, card };
                })
                .filter(item => item.id);
            for (const select of root.querySelectorAll(".ucfd-ve-rule-card [data-field='action']")) {
                const current = select.dataset.currentValue || select.value || "";
                select.textContent = "";
                const empty = this.createHtmlNode(browserWindow, "option", { value: "", textContent: "选择动作" });
                select.appendChild(empty);
                for (const item of ids) {
                    const display = item.label || this.defaultActionLabels[item.id] || item.id;
                    select.appendChild(this.createHtmlNode(browserWindow, "option", {
                        value: item.id,
                        textContent: `${display} (${item.id})`
                    }));
                }
                select.value = ids.some(item => item.id === current) ? current : "";
            }
        },
        createVisualEditorField (browserWindow, labelText, input, wide = false) {
            const field = this.createHtmlNode(browserWindow, "label", {
                className: `ucfd-ve-field${wide ? " ucfd-ve-field-wide" : ""}`
            });
            field.appendChild(this.createHtmlNode(browserWindow, "span", {
                className: "ucfd-ve-label",
                textContent: labelText
            }));
            field.appendChild(input);
            return field;
        },
        createActionCard (browserWindow, root, action) {
            const builtins = Object.keys(this.actionRegistry);
            const card = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-card ucfd-ve-action-card" });
            const head = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-card-head" });
            const title = this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-card-title",
                textContent: this.getActionDisplayLabel(action) || "新动作"
            });
            const removeBtn = this.createHtmlNode(browserWindow, "button", {
                type: "button",
                className: "ucfd-ve-btn-danger",
                textContent: "删除"
            });
            removeBtn.addEventListener("click", () => {
                card.remove();
                this.refreshVisualEditorActionOptions(root);
            });
            head.appendChild(title);
            head.appendChild(removeBtn);

            const grid = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-grid" });
            const idInput = this.createHtmlNode(browserWindow, "input", {
                type: "text",
                value: action.id || "",
                "data-field": "id",
                placeholder: "actionId"
            });
            const labelInput = this.createHtmlNode(browserWindow, "input", {
                type: "text",
                value: action.label || "",
                "data-field": "label",
                placeholder: "中文显示名称"
            });
            const updateTitle = () => {
                title.textContent = labelInput.value.trim() || this.defaultActionLabels[idInput.value.trim()] || idInput.value.trim() || "新动作";
            };
            idInput.addEventListener("input", () => {
                updateTitle();
                this.refreshVisualEditorActionOptions(root);
            });
            labelInput.addEventListener("input", () => {
                updateTitle();
                this.refreshVisualEditorActionOptions(root);
            });

            const typeSelect = this.createHtmlNode(browserWindow, "select", { "data-field": "type" });
            [
                { value: "builtin", label: "内建动作" },
                { value: "function", label: "自定义函数" }
            ].forEach(item => {
                typeSelect.appendChild(this.createHtmlNode(browserWindow, "option", {
                    value: item.value,
                    textContent: item.label
                }));
            });
            typeSelect.value = action.type || "builtin";

            const builtinSelect = this.createHtmlNode(browserWindow, "select", { "data-field": "builtinName" });
            for (const builtin of builtins) {
                builtinSelect.appendChild(this.createHtmlNode(browserWindow, "option", {
                    value: builtin,
                    textContent: `${this.getBuiltinActionDisplayName(builtin)} (${builtin})`
                }));
            }
            builtinSelect.value = action.name || builtins[0] || "";

            const argsTextarea = this.createHtmlNode(browserWindow, "textarea", {
                "data-field": "args",
                placeholder: "{\n  \"where\": \"tab\"\n}"
            });
            argsTextarea.value = action.argsText || "{}";

            const sourceTextarea = this.createHtmlNode(browserWindow, "textarea", {
                "data-field": "source",
                placeholder: "async ({ input, api }) => {\n    await api.open(\"https://example.com?q=\" + encodeURIComponent(input.value), \"tab\");\n}"
            });
            sourceTextarea.value = action.source || "async ({ input, api }) => {\n    await api.notify(\"UCFDrag\", input.value);\n}";

            const toggleMode = () => {
                const isFunction = typeSelect.value === "function";
                builtinField.classList.toggle("ucfd-ve-hidden", isFunction);
                argsField.classList.toggle("ucfd-ve-hidden", isFunction);
                sourceField.classList.toggle("ucfd-ve-hidden", !isFunction);
            };

            const idField = this.createVisualEditorField(browserWindow, "动作 ID", idInput);
            const labelField = this.createVisualEditorField(browserWindow, "显示名称", labelInput);
            const typeField = this.createVisualEditorField(browserWindow, "类型", typeSelect);
            const builtinField = this.createVisualEditorField(browserWindow, "内建动作", builtinSelect);
            const argsField = this.createVisualEditorField(browserWindow, "参数 JSON", argsTextarea, true);
            const sourceField = this.createVisualEditorField(browserWindow, "函数源码", sourceTextarea, true);
            typeSelect.addEventListener("change", toggleMode);

            grid.appendChild(idField);
            grid.appendChild(labelField);
            grid.appendChild(typeField);
            grid.appendChild(builtinField);
            grid.appendChild(argsField);
            grid.appendChild(sourceField);

            card.appendChild(head);
            card.appendChild(grid);
            toggleMode();
            updateTitle();
            return card;
        },
        createRuleCard (browserWindow, root, contextType, rule) {
            const card = this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-card ucfd-ve-rule-card",
                "data-context": contextType
            });
            const head = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-card-head" });
            const title = this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-card-title",
                textContent: rule.name || "新手势"
            });
            const removeBtn = this.createHtmlNode(browserWindow, "button", {
                type: "button",
                className: "ucfd-ve-btn-danger",
                textContent: "删除"
            });
            removeBtn.addEventListener("click", () => card.remove());
            head.appendChild(title);
            head.appendChild(removeBtn);

            const grid = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-grid" });
            const dirInput = this.createHtmlNode(browserWindow, "input", {
                type: "text",
                value: rule.dir || "",
                "data-field": "dir",
                placeholder: "如 U / LD / RD"
            });
            dirInput.addEventListener("input", () => {
                dirInput.value = dirInput.value.toUpperCase();
            });
            const nameInput = this.createHtmlNode(browserWindow, "input", {
                type: "text",
                value: rule.name || "",
                "data-field": "name",
                placeholder: "显示名称"
            });
            nameInput.addEventListener("input", () => {
                title.textContent = nameInput.value.trim() || "新手势";
            });
            const actionSelect = this.createHtmlNode(browserWindow, "select", {
                "data-field": "action"
            });
            actionSelect.dataset.currentValue = rule.action || "";
            const checks = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-checks" });
            const shiftCheck = this.createHtmlNode(browserWindow, "input", {
                type: "checkbox",
                "data-field": "shift"
            });
            shiftCheck.checked = !!rule.shift;
            const ctrlCheck = this.createHtmlNode(browserWindow, "input", {
                type: "checkbox",
                "data-field": "ctrl"
            });
            ctrlCheck.checked = !!rule.ctrl;
            const shiftWrap = this.createHtmlNode(browserWindow, "label", { className: "ucfd-ve-check" });
            shiftWrap.appendChild(shiftCheck);
            shiftWrap.appendChild(this.createHtmlNode(browserWindow, "span", { textContent: "Shift" }));
            const ctrlWrap = this.createHtmlNode(browserWindow, "label", { className: "ucfd-ve-check" });
            ctrlWrap.appendChild(ctrlCheck);
            ctrlWrap.appendChild(this.createHtmlNode(browserWindow, "span", { textContent: "Ctrl" }));
            checks.appendChild(shiftWrap);
            checks.appendChild(ctrlWrap);

            grid.appendChild(this.createVisualEditorField(browserWindow, "方向", dirInput));
            grid.appendChild(this.createVisualEditorField(browserWindow, "动作", actionSelect));
            grid.appendChild(this.createVisualEditorField(browserWindow, "名称", nameInput, true));
            grid.appendChild(this.createVisualEditorField(browserWindow, "修饰键", checks, true));

            card.appendChild(head);
            card.appendChild(grid);
            this.refreshVisualEditorActionOptions(root);
            actionSelect.value = rule.action || "";
            return card;
        },
        async saveVisualEditor (browserWindow, root) {
            const draft = this.collectVisualEditorDraft(root);
            const source = this.serializeVisualDraft(draft);
            const preview = await this.loadConfigSource(source, "visual-editor-preview");
            this.destroyConfigSandbox(preview.sandbox);
            const file = await this.ensureConfigFileExists();
            await IOUtils.writeUTF8(file.path, source);
            await this.reloadConfig({ silent: false, browserWindow });
            this.closeVisualEditor(browserWindow);
        },
        async openVisualEditor (browserWindow = window) {
            if (!this.rawConfigSnapshot) {
                await this.reloadConfig({ startup: true, silent: true, browserWindow });
            }
            this.ensureVisualEditorStyle(browserWindow);
            this.closeVisualEditor(browserWindow);
            const draft = this.cloneVisualDraft(this.rawConfigSnapshot || this.captureRawConfig({
                version: 1,
                actions: {},
                gestures: { link: [], text: [], image: [] }
            }));
            const root = this.createHtmlNode(browserWindow, "dialog", { id: VISUAL_EDITOR_ID });
            const panel = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-panel" });
            const header = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-header" });
            header.appendChild(this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-title",
                textContent: "UCFDrag 可视化编辑器"
            }));
            header.appendChild(this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-subtitle",
                textContent: "编辑动作和手势规则，保存后会重写外置配置文件并立即重载。函数动作支持源码编辑。"
            }));

            const content = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-content" });
            const actionSection = this.createHtmlNode(browserWindow, "section", { className: "ucfd-ve-section" });
            const gestureSection = this.createHtmlNode(browserWindow, "section", { className: "ucfd-ve-section" });
            const actionSectionTitle = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-section-title" });
            actionSectionTitle.appendChild(this.createHtmlNode(browserWindow, "span", { textContent: "动作" }));
            const addActionBtn = this.createHtmlNode(browserWindow, "button", {
                type: "button",
                className: "ucfd-ve-btn-secondary",
                textContent: "新增动作"
            });
            actionSectionTitle.appendChild(addActionBtn);
            const actionNote = this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-note",
                textContent: "内建动作的参数使用 JSON 编辑。自定义函数直接填写函数源码，例如 async ({ input, api }) => { ... }。"
            });
            const actionList = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-stack", "data-role": "action-list" });
            actionSection.appendChild(actionSectionTitle);
            actionSection.appendChild(actionNote);
            actionSection.appendChild(actionList);

            const gestureTitle = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-section-title" });
            gestureTitle.appendChild(this.createHtmlNode(browserWindow, "span", { textContent: "手势" }));
            const tabs = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-tabs" });
            const ruleLists = {};
            const tabOrder = [
                { key: "link", label: "链接" },
                { key: "text", label: "文本" },
                { key: "image", label: "图片" }
            ];
            const listWrap = this.createHtmlNode(browserWindow, "div");
            const setActiveTab = key => {
                for (const button of tabs.querySelectorAll(".ucfd-ve-tab")) {
                    button.setAttribute("data-active", String(button.dataset.key === key));
                }
                for (const [contextKey, list] of Object.entries(ruleLists)) {
                    list.classList.toggle("ucfd-ve-hidden", contextKey !== key);
                }
            };
            for (const tab of tabOrder) {
                const button = this.createHtmlNode(browserWindow, "button", {
                    type: "button",
                    className: "ucfd-ve-tab",
                    textContent: tab.label
                });
                button.dataset.key = tab.key;
                button.addEventListener("click", () => setActiveTab(tab.key));
                tabs.appendChild(button);

                const block = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-stack" });
                const addRuleBtn = this.createHtmlNode(browserWindow, "button", {
                    type: "button",
                    className: "ucfd-ve-btn-secondary",
                    textContent: `新增${tab.label}手势`
                }, { alignSelf: "flex-start" });
                addRuleBtn.addEventListener("click", () => {
                    const card = this.createRuleCard(browserWindow, root, tab.key, {
                        dir: "",
                        shift: false,
                        ctrl: false,
                        name: "",
                        action: ""
                    });
                    block.appendChild(card);
                    this.refreshVisualEditorActionOptions(root);
                });
                block.appendChild(addRuleBtn);
                for (const rule of draft.gestures[tab.key]) {
                    block.appendChild(this.createRuleCard(browserWindow, root, tab.key, rule));
                }
                ruleLists[tab.key] = block;
                listWrap.appendChild(block);
            }
            gestureSection.appendChild(gestureTitle);
            gestureSection.appendChild(this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-note",
                textContent: "方向使用 U / D / L / R 组合。名称是拖拽时 tooltip 显示的文本。"
            }));
            gestureSection.appendChild(tabs);
            gestureSection.appendChild(listWrap);
            content.appendChild(actionSection);
            content.appendChild(gestureSection);

            for (const action of draft.actions) {
                actionList.appendChild(this.createActionCard(browserWindow, root, action));
            }
            addActionBtn.addEventListener("click", () => {
                actionList.appendChild(this.createActionCard(browserWindow, root, {
                    id: "",
                    label: "",
                    type: "builtin",
                    name: "open",
                    argsText: "{}",
                    source: ""
                }));
                this.refreshVisualEditorActionOptions(root);
            });

            const footer = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-actions" });
            footer.appendChild(this.createHtmlNode(browserWindow, "div", {
                className: "ucfd-ve-note",
                textContent: "提示：保存前会先做一次预解析校验。保存后配置文件格式会按编辑器的导出模板重写。"
            }));
            const footerRight = this.createHtmlNode(browserWindow, "div", { className: "ucfd-ve-actions-right" });
            const cancelBtn = this.createHtmlNode(browserWindow, "button", {
                type: "button",
                className: "ucfd-ve-btn-secondary",
                textContent: "取消"
            });
            cancelBtn.addEventListener("click", () => this.closeVisualEditor(browserWindow));
            const saveBtn = this.createHtmlNode(browserWindow, "button", {
                type: "button",
                className: "ucfd-ve-btn-primary",
                textContent: "保存并重载"
            });
            saveBtn.addEventListener("click", async () => {
                try {
                    saveBtn.disabled = true;
                    await this.saveVisualEditor(browserWindow, root);
                } catch (error) {
                    this.reportError("保存可视化编辑配置失败", error);
                    this.flashTooltip(browserWindow, error.message || "保存失败", true, 3200);
                } finally {
                    saveBtn.disabled = false;
                }
            });
            footerRight.appendChild(cancelBtn);
            footerRight.appendChild(saveBtn);
            footer.appendChild(footerRight);

            panel.appendChild(header);
            panel.appendChild(content);
            panel.appendChild(footer);
            root.appendChild(panel);
            root.addEventListener("cancel", event => {
                event.preventDefault();
                this.closeVisualEditor(browserWindow);
            });
            root.addEventListener("click", event => {
                if (event.target !== root) {
                    return;
                }
                const rect = panel.getBoundingClientRect();
                const isBackdropClick =
                    event.clientX < rect.left ||
                    event.clientX > rect.right ||
                    event.clientY < rect.top ||
                    event.clientY > rect.bottom;
                if (isBackdropClick) {
                    this.closeVisualEditor(browserWindow);
                }
            });
            browserWindow.document.body.appendChild(root);
            this.refreshVisualEditorActionOptions(root);
            setActiveTab("link");
            root.showModal();
        },
        async loadConfigSource (source, sourceName) {
            const sandbox = this.createConfigSandbox();
            try {
                const config = Cu.evalInSandbox(source, sandbox, "latest", sourceName, 1);
                if (!config || typeof config !== "object") {
                    throw new Error("配置文件必须返回一个对象");
                }
                return { config, sandbox, sourceName };
            } catch (error) {
                this.destroyConfigSandbox(sandbox);
                throw error;
            }
        },
        cloneArgs (value) {
            if (!value || typeof value !== "object") {
                return {};
            }
            try {
                return JSON.parse(JSON.stringify(value));
            } catch (error) {
                return {};
            }
        },
        normalizeAction (actionId, rawAction) {
            if (typeof rawAction === "function") {
                return {
                    id: actionId,
                    type: "function",
                    handler: rawAction,
                    label: actionId
                };
            }
            if (!rawAction || typeof rawAction !== "object") {
                throw new Error(`动作 ${actionId} 无效`);
            }
            if (rawAction.type === "builtin") {
                if (!rawAction.name || typeof this.actionRegistry[rawAction.name] !== "function") {
                    throw new Error(`动作 ${actionId} 引用了不存在的内建动作: ${rawAction.name}`);
                }
                return {
                    id: actionId,
                    type: "builtin",
                    builtinName: rawAction.name,
                    args: this.cloneArgs(rawAction.args),
                    label: rawAction.label || actionId
                };
            }
            if (rawAction.type === "function" && typeof rawAction.run === "function") {
                return {
                    id: actionId,
                    type: "function",
                    handler: rawAction.run,
                    label: rawAction.label || actionId
                };
            }
            throw new Error(`动作 ${actionId} 类型不受支持`);
        },
        normalizeRule (contextType, rawRule, actionMap) {
            if (!rawRule || typeof rawRule !== "object") {
                throw new Error(`${contextType} 手势规则无效`);
            }
            const dir = String(rawRule.dir || "").toUpperCase().trim();
            if (!dir) {
                throw new Error(`${contextType} 手势缺少 dir`);
            }
            const actionId = rawRule.action;
            if (!actionId || !actionMap.has(actionId)) {
                throw new Error(`${contextType} 手势 ${dir} 引用了不存在的动作: ${actionId}`);
            }
            const action = actionMap.get(actionId);
            return {
                dir,
                shift: !!rawRule.shift,
                ctrl: !!rawRule.ctrl,
                name: rawRule.name || action.label || action.id,
                actionId,
                action
            };
        },
        resolveLoadedConfig (rawConfig, sourceName) {
            const actionMap = new Map();
            const gestures = {
                link: [],
                text: [],
                image: []
            };
            const rawActions = rawConfig?.actions || {};
            for (const [actionId, rawAction] of Object.entries(rawActions)) {
                actionMap.set(actionId, this.normalizeAction(actionId, rawAction));
            }
            for (const contextType of ["link", "text", "image"]) {
                const list = Array.isArray(rawConfig?.gestures?.[contextType]) ? rawConfig.gestures[contextType] : [];
                gestures[contextType] = list.map(rule => this.normalizeRule(contextType, rule, actionMap));
            }
            return {
                version: rawConfig?.version || 1,
                sourceName,
                actions: actionMap,
                gestures
            };
        },
        async applyResolvedConfigFromSource (source, sourceName) {
            const { config, sandbox } = await this.loadConfigSource(source, sourceName);
            try {
                const resolved = this.resolveLoadedConfig(config, sourceName);
                const previousSandbox = this.configSandbox;
                this.activeConfig = resolved;
                this.rawConfigSnapshot = this.captureRawConfig(config);
                this.resolvedGestures = resolved.gestures;
                this.configSandbox = sandbox;
                if (previousSandbox && previousSandbox !== sandbox) {
                    this.destroyConfigSandbox(previousSandbox);
                }
                return resolved;
            } catch (error) {
                this.destroyConfigSandbox(sandbox);
                throw error;
            }
        },
        async fallbackToDefaultConfig (reason, browserWindow = window) {
            this.reportError("配置加载失败，回退到默认配置", reason);
            await this.applyResolvedConfigFromSource(DEFAULT_CONFIG_SOURCE, "default:ucf_drag_ModR");
            this.flashTooltip(browserWindow, "UCFDrag 已回退到默认配置", true);
            return this.activeConfig;
        },
        async reloadConfig ({ startup = false, silent = false, browserWindow = window } = {}) {
            const file = await this.ensureConfigFileExists();
            try {
                const source = await IOUtils.readUTF8(file.path);
                await this.applyResolvedConfigFromSource(source, file.path);
                if (!silent) {
                    this.flashTooltip(browserWindow, "UCFDrag 配置已重载");
                }
                return this.activeConfig;
            } catch (error) {
                this.reportError("加载拖拽配置失败", error);
                if (this.activeConfig && !startup) {
                    this.flashTooltip(browserWindow, "配置加载失败，已保留当前生效配置", true);
                    return this.activeConfig;
                }
                return this.fallbackToDefaultConfig(error, browserWindow);
            }
        },
        getResolvedConfig () {
            if (!this.activeConfig) {
                return null;
            }
            const serialize = rules => rules.map(rule => ({
                dir: rule.dir,
                shift: rule.shift,
                ctrl: rule.ctrl,
                name: rule.name,
                actionId: rule.actionId,
                actionType: rule.action.type,
                builtinName: rule.action.builtinName || null
            }));
            return {
                sourceName: this.activeConfig.sourceName,
                version: this.activeConfig.version,
                gestures: {
                    link: serialize(this.resolvedGestures.link),
                    text: serialize(this.resolvedGestures.text),
                    image: serialize(this.resolvedGestures.image)
                }
            };
        },
        createExecutionContext (dragState, event) {
            const browserWindow = dragState.browserWindow;
            const currentUrl = browserWindow.gBrowser.currentURI?.spec || "";
            return {
                browserWindow,
                event,
                input: Object.freeze({
                    type: dragState.type,
                    value: dragState.value,
                    linkText: dragState.linkText || ""
                }),
                env: Object.freeze({
                    ctrlKey: !!event.ctrlKey,
                    shiftKey: !!event.shiftKey,
                    currentUrl
                })
            };
        },
        createActionApi (context) {
            const api = {
                open: (url, where = "tab", options = null) => this.openLink(url, where, context.browserWindow, options),
                search: (text, where = "tab", engine = "@default", addToHistory = false) => this.searchWithEngine(text, where, engine, addToHistory, context.browserWindow),
                copy: text => this.copyString(text),
                saveText: text => this.saveText(text, context.browserWindow),
                saveUrl: url => this.saveAs(url, null, null, null, null, null, context.browserWindow),
                notify: (title, message, error = false) => {
                    const parts = [title, message].filter(Boolean);
                    if (!parts.length) {
                        return;
                    }
                    this.flashTooltip(context.browserWindow, parts.join(": "), error);
                },
                build: Object.freeze({
                    siteSearch: (text, pageUrl = context.env.currentUrl) => this.buildSiteSearchTerm(text, pageUrl),
                    appendUrl: (prefix, value, { encode = true, suffix = "" } = {}) => {
                        if (!value) {
                            return null;
                        }
                        return `${prefix || ""}${encode ? encodeURIComponent(value) : value}${suffix || ""}`;
                    }
                })
            };
            return Object.freeze(api);
        },
        resolveActionValue (source, context) {
            switch (source) {
                case "linkText":
                    return context.input.linkText || "";
                case "currentUrl":
                    return context.env.currentUrl || "";
                case "value":
                default:
                    return context.input.value || "";
            }
        },
        extractHostname (url, stripWWW = true) {
            try {
                const hostname = new URL(url).hostname;
                return stripWWW ? hostname.replace(/^www\./i, "") : hostname;
            } catch (error) {
                return "";
            }
        },
        buildSiteSearchTerm (text, pageUrl) {
            if (!text) {
                return null;
            }
            const host = this.extractHostname(pageUrl, true);
            if (!host) {
                return null;
            }
            return `site:${host} ${text}`;
        },
        buildConfiguredUrl (args, context) {
            const rawValue = this.resolveActionValue(args.valueSource || "value", context);
            if (!rawValue) {
                return null;
            }
            let value = rawValue;
            switch (args.transform) {
                case "hostnameNoWWW":
                    value = this.extractHostname(rawValue, true);
                    break;
                case "hostname":
                    value = this.extractHostname(rawValue, false);
                    break;
                case "encode":
                    value = encodeURIComponent(rawValue);
                    break;
                case "raw":
                default:
                    break;
            }
            if (!value) {
                return null;
            }
            return `${args.prefix || ""}${value}${args.suffix || ""}`;
        },
        async executeAction (rule, context) {
            const action = rule.action;
            if (action.type === "builtin") {
                return this.actionRegistry[action.builtinName](context, action.args);
            }
            if (!this.allowCustomActions) {
                this.flashTooltip(context.browserWindow, `已阻止自定义动作：${rule.name}`, true);
                return;
            }
            const payload = Object.freeze({
                input: context.input,
                env: context.env,
                api: this.createActionApi(context)
            });
            return await action.handler(payload);
        },
        ensureTooltip (browserWindow = window) {
            const doc = browserWindow.document;
            let style = doc.getElementById(TOOLTIP_STYLE_ID);
            if (!style) {
                style = doc.createElementNS(XHTML_NS, "style");
                style.id = TOOLTIP_STYLE_ID;
                style.textContent = `
                    #${TOOLTIP_ID} {
                        position: fixed;
                        left: 50%;
                        bottom: 44px;
                        z-index: 2147483647;
                        pointer-events: none;
                        min-width: 96px;
                        max-width: min(70vw, 720px);
                        padding: 8px 14px;
                        border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
                        border-radius: 999px;
                        background: color-mix(in srgb, var(--toolbar-bgcolor, rgba(28, 32, 36, .92)) 88%, black 12%);
                        color: var(--toolbar-color, #fff);
                        font: menu;
                        font-size: 12px;
                        line-height: 1.45;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, .22);
                        backdrop-filter: blur(10px);
                        opacity: 0;
                        transform: translate(-50%, 12px) scale(.96);
                        transition: opacity .16s ease, transform .18s cubic-bezier(.22, 1, .36, 1);
                    }
                    #${TOOLTIP_ID}[data-visible="true"] {
                        opacity: 1;
                        transform: translate(-50%, 0) scale(1);
                    }
                    #${TOOLTIP_ID}[data-error="true"] {
                        background: color-mix(in srgb, #a12727 82%, black 18%);
                        color: #fff;
                    }
                `;
                doc.documentElement.appendChild(style);
            }
            let tooltip = doc.getElementById(TOOLTIP_ID);
            if (!tooltip) {
                tooltip = doc.createElementNS(XHTML_NS, "div");
                tooltip.id = TOOLTIP_ID;
                doc.documentElement.appendChild(tooltip);
            }
            return tooltip;
        },
        showTooltip (browserWindow, text, { error = false } = {}) {
            const tooltip = this.ensureTooltip(browserWindow);
            if (tooltip._hideTimer) {
                browserWindow.clearTimeout(tooltip._hideTimer);
                tooltip._hideTimer = null;
            }
            tooltip.textContent = text;
            if (error) {
                tooltip.setAttribute("data-error", "true");
            } else {
                tooltip.removeAttribute("data-error");
            }
            tooltip.setAttribute("data-visible", "true");
            return tooltip;
        },
        hideTooltip (browserWindow = window) {
            const tooltip = browserWindow.document.getElementById(TOOLTIP_ID);
            if (!tooltip) {
                return;
            }
            if (tooltip._hideTimer) {
                browserWindow.clearTimeout(tooltip._hideTimer);
                tooltip._hideTimer = null;
            }
            tooltip.removeAttribute("data-visible");
            tooltip.removeAttribute("data-error");
        },
        flashTooltip (browserWindow, text, error = false, timeout = TOOLTIP_TIMEOUT_MS) {
            const tooltip = this.showTooltip(browserWindow, text, { error });
            tooltip._hideTimer = browserWindow.setTimeout(() => {
                tooltip.removeAttribute("data-visible");
                tooltip.removeAttribute("data-error");
                tooltip._hideTimer = null;
            }, timeout);
        },
        getDragTypeLabel (type) {
            switch (type) {
                case "image":
                    return "图像";
                case "text":
                    return "文本";
                case "link":
                default:
                    return "链接";
            }
        },
        handleEvent (event) {
            const handler = this[event.type];
            if (typeof handler === "function") {
                return handler.call(this, event);
            }
        },
        dragstart (event) {
            const browserWindow = event.view?.windowRoot?.ownerGlobal || event.view || window;
            if (!event.dataTransfer.mozItemCount || !browserWindow.gBrowser.selectedBrowser.matches(":hover")) {
                return;
            }
            if (this.debug) {
                this.printDataTransferTypes(event);
            }
            const dt = event.dataTransfer;
            const dragState = {
                browserWindow,
                type: "link",
                dir: "",
                value: "",
                linkText: "",
                x: event.screenX,
                y: event.screenY
            };
            const url = dt.getData("text/x-moz-url-data");
            if (url) {
                dragState.value = url;
                if (this.imageLinkRe.test(url)) {
                    dragState.type = "image";
                } else {
                    const promiseUrl = dt.getData("application/x-moz-file-promise-url");
                    const dragHTML = dt.getData("text/html");
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(dragHTML || "", "text/html");
                    const firstElement = doc.body?.firstElementChild;
                    const onImage = firstElement?.tagName === "IMG" || !!firstElement?.querySelector?.("img");
                    if (onImage && event.ctrlKey) {
                        dragState.type = "image";
                        dragState.value = promiseUrl || url;
                    } else {
                        const anchor = doc.querySelector("a");
                        dragState.linkText = anchor?.innerText || anchor?.href || "";
                    }
                }
            } else {
                const text = dt.getData("text/plain");
                if (!text) {
                    return;
                }
                dragState.value = text;
                if (!this.textLinkRe.test(text)) {
                    dragState.type = "text";
                }
                if (this.imageLinkRe.test(text)) {
                    dragState.type = "image";
                }
            }
            this.currentDrag = dragState;
            this.toggleDragListeners(browserWindow, true);
            this.showTooltip(browserWindow, `拖拽开始：${this.getDragTypeLabel(dragState.type)}`);
        },
        toggleDragListeners (browserWindow, enable) {
            const method = enable ? "addEventListener" : "removeEventListener";
            for (const type of this.events) {
                browserWindow[method](type, this, true);
            }
            if (!enable) {
                this.hideTooltip(browserWindow);
            }
        },
        dragover (event) {
            const dragState = this.currentDrag;
            if (!dragState) {
                return;
            }
            const cx = event.screenX;
            const cy = event.screenY;
            const dx = cx - dragState.x;
            const dy = cy - dragState.y;
            const ax = Math.abs(dx);
            const ay = Math.abs(dy);
            if (ax < 10 && ay < 10) {
                return;
            }
            dragState.x = cx;
            dragState.y = cy;
            const dir = ax > ay ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U");
            if (dragState.dir.endsWith(dir)) {
                return;
            }
            dragState.dir += dir;
            const matches = filterGestures(this.resolvedGestures[dragState.type], dragState.dir, event);
            const message = matches.length
                ? matches.map(rule => `鼠标手势：${dragState.dir} ${rule.name}`).join(", ")
                : `未知手势：${dragState.dir}`;
            this.showTooltip(dragState.browserWindow, message);
        },
        drop (event) {
            const dragState = this.currentDrag;
            if (!dragState) {
                return;
            }
            this.toggleDragListeners(dragState.browserWindow, false);
            this.currentDrag = null;
        },
        async dragend (event) {
            const dragState = this.currentDrag;
            if (!dragState) {
                return;
            }
            this.toggleDragListeners(dragState.browserWindow, false);
            this.currentDrag = null;
            const matches = filterGestures(this.resolvedGestures[dragState.type], dragState.dir, event);
            if (this.debug) {
                console.info(LOG_PREFIX, dragState.dir, matches);
            }
            if (!matches.length || event.dataTransfer.mozUserCancelled) {
                return;
            }
            const x = event.screenX;
            const y = event.screenY;
            const browserWindow = dragState.browserWindow;
            const wx = browserWindow.mozInnerScreenX;
            const wy = browserWindow.mozInnerScreenY;
            if (!(x > wx && y > wy && x < wx + browserWindow.innerWidth && y < wy + browserWindow.innerHeight)) {
                return;
            }
            const context = this.createExecutionContext(dragState, event);
            for (const rule of matches) {
                try {
                    await this.executeAction(rule, context);
                } catch (error) {
                    this.reportError(`执行动作失败: ${rule.name}`, error);
                    this.flashTooltip(browserWindow, `执行失败：${rule.name}`, true);
                }
            }
        },
        attachToWindow (browserWindow) {
            if (!browserWindow?.gBrowser?.tabpanels || this.observedWindows.has(browserWindow)) {
                return;
            }
            this.observedWindows.add(browserWindow);
            this.createMenuitem(browserWindow);
            browserWindow.gBrowser.tabpanels.addEventListener("dragstart", this, true);
            browserWindow.addEventListener("unload", () => {
                browserWindow.gBrowser?.tabpanels?.removeEventListener("dragstart", this, true);
            }, { once: true });
        },
        observe (subject) {
            this.attachToWindow(subject);
        },
        log (...args) {
            if (this.debug) {
                console.log(LOG_PREFIX, ...args);
            }
        },
        reportError (...args) {
            console.error(LOG_PREFIX, ...args);
        },
        init (topic, self) {
            delete this.init;
            Services.obs.addObserver(self = this, topic);
            Services.obs.addObserver(function quit (subject, shutdownTopic) {
                Services.obs.removeObserver(self, topic);
                Services.obs.removeObserver(quit, shutdownTopic);
                self.destroyConfigSandbox(self.configSandbox);
                self.configSandbox = null;
            }, "quit-application-granted");
            this.attachToWindow(window);
            void this.reloadConfig({ startup: true, silent: true });
            void this.initSearchService();
        }
    };

    function filterGestures (gestureList, dir, event) {
        let matches = gestureList.filter(rule => rule.dir === dir);
        matches = event.shiftKey ? matches.filter(rule => rule.shift) : matches.filter(rule => !rule.shift);
        matches = event.ctrlKey ? matches.filter(rule => rule.ctrl) : matches.filter(rule => !rule.ctrl);
        return matches;
    }

    window.UCFDrag.init("browser-delayed-startup-finished");
})();
