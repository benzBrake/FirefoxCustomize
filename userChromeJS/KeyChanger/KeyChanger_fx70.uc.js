// ==UserScript==
// @name           KeyChanger.uc.js
// @author         Ryan, Griever
// @namespace      http://d.hatena.ne.jp/Griever/
// @include        main
// @description    Additional shortcuts for Firefox
// @license        MIT License
// @charset        UTF-8
// @include        main
// @version        2023.07.27
// @note           2023.07.27 修复 openCommand 不遵循容器设定
// @note           2023.07.16 优化 openCommand 函数
// @note           2023.06.17 修复 gBrowser.loadURI 第一个参数类型修改为 URI, Bug 1815439 - Remove useless loadURI wrapper from browser.js
// @note           2023.03.15 修复 openUILinkIn 被移除
// @note           2023.01.01 JSActor 化
// @note           2022.11.27 修复 gBrowser is undefined
// @note           2022.06.03 新增 getSelctionText()，修增 saveFile 不存在
// @note           0.0.2 メニューを右クリックで設定ファイルを開けるようにした
// @note           0.0.2 Meta キーを装飾キーに使えるようになったかもしれない（未テスト）
// @note           0.0.2 Windows キーを装飾キーに使えるようになったかもしれない（未テスト Firefox 17 以降）
// @note           2018.1.25.2 Firefox59+ 修复
// ==/UserScript==
let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
if (typeof window === "undefined" || globalThis !== window) {
    let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
    try {
        if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
            BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
        }
    } catch (e) { }
    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["KeyChangerParent"];
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
            ChromeUtils.registerWindowActor("KeyChanger", actorParams);
            this.add
        } catch (e) { console.error(e); }

        this.KeyChangerParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
                let browser = windowGlobal.rootFrameLoader.ownerElement;
                let win = browser.ownerGlobal;
                let KeyChanger = win.KeyChanger;
                switch (name) {
                    case "KC:SetSeletedText":
                        KeyChanger.setSelectedText(data.text);
                        break;
                    case "KC:ExectueScriptEnd":
                        break;
                }
            }
        }
    } else {
        this.EXPORTED_SYMBOLS = ["KeyChangerChild"];

        this.KeyChangerChild = class extends JSWindowActorChild {
            actorCreated() {

            }
            receiveMessage({ name, data }) {
                const win = this.contentWindow;
                const console = win.console;
                const doc = win.document;
                const actor = win.windowGlobalChild.getActor("KeyChanger");
                switch (name) {
                    case "KC:GetSelectedText":
                        let obj = {
                            text: BrowserOrSelectionUtils.getSelectionDetails(win).fullText
                        }
                        actor.sendAsyncMessage("KC:SetSeletedText", obj);
                        break;
                    case "KC:ExectueScript":
                        if (data && data.script) {
                            eval('(' + decodeURIComponent(atob(data.script)) + ').call(this, doc, win, actor)');
                        }
                        break;
                }
            }
        }
    }
} else {
    try {
        if (parseInt(Services.appinfo.version) < 101) {
            ChromeUtils.import(Components.stack.filename);
        } else {
            let fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            let scriptPath = Components.stack.filename;
            if (scriptPath.startsWith("chrome")) {
                scriptPath = resolveChromeURL(scriptPath);
                function resolveChromeURL(str) {
                    const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                    try {
                        return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec
                    } catch (e) {
                        console.error(e);
                        return ""
                    }
                }
            }
            let scriptFile = fileHandler.getFileFromURLSpec(scriptPath);
            let resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
            if (!resourceHandler.hasSubstitution("keychanger-ucjs")) {
                resourceHandler.setSubstitution("keychanger-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://keychanger-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        }
    } catch (e) { console.error(e); }
    var useScraptchpad = true;  // If the editor does not exist, use the code snippet shorthand, otherwise set the editor path @deprecated

    (function () {


        let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
        try {
            if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
                BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
            }
        } catch (e) { }

        const INTERNAL_MAP = {
            tab: {
                close: {
                    current: function () {
                        gBrowser.removeTab(gBrowser.selectedTab);
                    },
                    all: function () {
                        gBrowser.removeTabs(gBrowser.tabs);
                    },
                    other: function () {
                        gBrowser.removeAllTabsBut(gBrowser.selectedTab);
                    }
                },
                pin: {
                    current: function () {
                        gBrowser.pinTab(gBrowser.selectedTab);
                    },
                    all: function (event) {
                        gBrowser.tabs.forEach(t => gBrowser.pinTab(t));
                    },
                },
                unpin: {
                    current: function () {
                        gBrowser.unpinTab(gBrowser.selectedTab);
                    },
                    all: function (event) {
                        gBrowser.tabs.forEach(t => gBrowser.unpinTab(t));
                    },
                },
                "toggle-pin": {
                    current: function () {
                        if (gBrowser.selectedTab.pinned)
                            gBrowser.unpinTab(gBrowser.selectedTab);
                        else
                            gBrowser.pinTab(gBrowser.selectedTab);
                    },
                    all: function (event) {
                    },
                },
                prev: function () {
                    gBrowser.tabContainer.advanceSelectedTab(-1, true);
                },
                next: function () {
                    gBrowser.tabContainer.advanceSelectedTab(1, true);
                },
                duplicate: function () {
                    duplicateTabIn(gBrowser.selectedTab, 'tab');
                }
            }
        }
        window.KeyChanger = {
            get appVersion() {
                return Services.appinfo.version.split(".")[0];
            },
            get FILE() {
                delete this.FILE;
                let path;
                try {
                    path = this.prefs.getStringPref("FILE_PATH")
                } catch (e) {
                    path = '_keychanger.js';
                }
                aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);
                if (!aFile.exists()) {
                    saveFile(aFile, '');
                    alert('_keychanger.js 配置为空');
                }
                return this.FILE = aFile;
            },
            get prefs() {
                delete this.prefs;
                return this.prefs = Services.prefs.getBranch("keyChanger.")
            },
            isBuilding: false,
            _selectedText: "",
            KEYSETID: "keychanger-keyset",
            addEventListener: function () {
                (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);
            },
            handleEvent: function (event) {
                switch (event.type) {
                    case 'mouseup':
                        // get selected text
                        if (content) {
                            // 内置页面
                            this.setSelectedText(BrowserOrSelectionUtils.getSelectionDetails(content).fullText || "");
                        } else {
                            // 网页
                            let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("KeyChanger");
                            actor.sendAsyncMessage("KC:GetSelectedText", {});
                        }
                        break;
                }
            },
            getSelectedText: function () {
                return this._selectedText || "";
            },
            setSelectedText: function (text) {
                this._selectedText = text;
            },
            makeKeyset: function (isAlert) {
                this.isBuilding = true;
                var s = new Date();
                var keys = this.makeKeys();
                if (!keys) {
                    this.isBuilding = false;
                    return this.alert('KeyChanger', 'Load error.');
                }
                $R(document.getElementById(this.KEYSETID)); // 删除 KeySet
                let keyset = $C(document, "keyset", {
                    id: this.KEYSETID
                })
                keyset.appendChild(keys);

                var df = document.createDocumentFragment();
                Array.prototype.slice.call(document.getElementsByTagName('keyset')).forEach(function (elem) {
                    df.appendChild(elem);
                });
                var insPos = document.getElementById('mainPopupSet');
                insPos.parentNode.insertBefore(keyset, insPos);
                insPos.parentNode.insertBefore(df, insPos);
                var e = new Date() - s;
                if (isAlert) {
                    this.alert('KeyChanger: Loaded', e + 'ms');
                }
                setTimeout(function () {
                    KeyChanger.isBuilding = false;
                }, 100);

            },
            makeKeys: function () {
                var str = loadText(this.FILE);
                if (!str)
                    return null;

                var sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
                var keys = Cu.evalInSandbox('var keys = {};\n' + str + ';\nkeys;', sandbox);
                if (!keys)
                    return null;
                var dFrag = document.createDocumentFragment();

                Object.keys(keys).forEach(function (n) {
                    let keyString = n.toUpperCase().split("+");
                    let modifiers = "", key, keycode, k;

                    for (let i = 0, l = keyString.length; i < l; i++) {
                        k = keyString[i];
                        switch (k) {
                            case "CTRL":
                            case "CONTROL":
                            case "ACCEL":
                                modifiers += "accel,";
                                break;
                            case "SHIFT":
                                modifiers += "shift,";
                                break;
                            case "ALT":
                            case "OPTION":
                                modifiers += "alt,";
                                break;
                            case "META":
                            case "COMMAND":
                                modifiers += "meta,";
                                break;
                            case "OS":
                            case "WIN":
                            case "WINDOWS":
                            case "HYPER":
                            case "SUPER":
                                modifiers += "os,";
                                break;
                            case "":
                                key = "+";
                                break;
                            case "BACKSPACE":
                            case "BKSP":
                            case "BS":
                                keycode = "VK_BACK";
                                break;
                            case "RET":
                            case "ENTER":
                                keycode = "VK_RETURN";
                                break;
                            case "ESC":
                                keycode = "VK_ESCAPE";
                                break;
                            case "PAGEUP":
                            case "PAGE UP":
                            case "PGUP":
                            case "PUP":
                                keycode = "VK_PAGE_UP";
                                break;
                            case "PAGEDOWN":
                            case "PAGE DOWN":
                            case "PGDN":
                            case "PDN":
                                keycode = "VK_PAGE_DOWN";
                                break;
                            case "TOP":
                                keycode = "VK_UP";
                                break;
                            case "BOTTOM":
                                keycode = "VK_DOWN";
                                break;
                            case "INS":
                                keycode = "VK_INSERT";
                                break;
                            case "DEL":
                                keycode = "VK_DELETE";
                                break;
                            default:
                                if (k.length === 1) {
                                    key = k;
                                } else if (k.indexOf("VK_") === -1) {
                                    keycode = "VK_" + k;
                                } else {
                                    keycode = k;
                                }
                                break;
                        }
                    }
                    let elem = document.createXULElement('key');
                    if (modifiers !== '')
                        elem.setAttribute('modifiers', modifiers.slice(0, -1));
                    if (key)
                        elem.setAttribute('key', key);
                    else if (keycode)
                        elem.setAttribute('keycode', keycode);

                    let cmd = keys[n];
                    switch (typeof cmd) {
                        case 'function':
                            elem.setAttribute('oncommand', '(' + cmd.toString() + ').call(this, event);');
                            break;
                        case 'object':
                            Object.keys(cmd).forEach(function (a) {
                                if (a === 'oncommand' && cmd[a] === "internal")
                                    cmd[a] = "KeyChanger.internalCommand(event);";
                                elem.setAttribute(a, cmd[a]);
                            }, this);
                            break;
                        default:
                            elem.setAttribute('oncommand', cmd);
                    }
                    dFrag.appendChild(elem);
                }, this);
                return dFrag;
            },
            createMenuitem: function () {
                var menuitem = document.createXULElement('menuitem');
                menuitem.setAttribute('id', 'toolsbar_KeyChanger_rebuild');
                menuitem.setAttribute('label', 'KeyChanger');
                menuitem.setAttribute('tooltiptext', '左键：重载配置\n右键：编辑配置');
                menuitem.setAttribute('oncommand', 'setTimeout(function(){ KeyChanger.makeKeyset(true); }, 10);');
                menuitem.setAttribute('onclick', 'if (event.button == 2) { event.preventDefault();KeyChanger.edit(KeyChanger.FILE); }');
                var insPos = document.getElementById('devToolsSeparator');
                insPos.parentNode.insertBefore(menuitem, insPos);
            },
            internalCommand: function (event) {
                let params = event.target.getAttribute('params');
                let cmd = this.internalParamsParse(params);
                if (typeof cmd === "function") {
                    cmd.call(this, event);
                } else {
                    this.log("Internal command is not complete or too long", params, cmd);
                }
            },
            internalParamsParse: function (params) {
                let args = params.split(',');
                let cmd = INTERNAL_MAP;
                for (let i = 0; i < args.length; i++) {
                    if (cmd.hasOwnProperty(args[i])) {
                        cmd = cmd[args[i]];
                    } else {
                        return "";
                    }
                }
                return cmd;
            },
            openCommand: function (url, where, postData) {
                var uri;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    return this.log("URL 有问题: %s".replace("%s", url));
                }
                if (uri.scheme === "javascript") {
                    this.loadURI(uri);
                } else {
                    this.openUILinkIn(uri.spec, where || 'tab', gBrowser.contentPrincipal.originAttributes.userContextId ? {
                        userContextId: gBrowser.contentPrincipal.originAttributes.userContextId
                    } : null, postData);
                }
            },
            loadURI: function (url) {
                if ("loadURI" in window) {
                    var loadURI = (url) => {
                        gBrowser.loadURI(url instanceof Ci.nsIURI ? url.spec : url, { triggeringPrincipal: gBrowser.contentPrincipal });
                    }
                } else {
                    var loadURI = (url) => {
                        try {
                            gBrowser.loadURI(url instanceof Ci.nsIURI ? url : Services.io.newURI(url, null, null), { triggeringPrincipal: gBrowser.contentPrincipal });
                        } catch (ex) {
                            console.error(ex);
                        }
                    }
                }
                (this.loadURI = loadURI)(url);
            },
            openUILinkIn: function (url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo) {
                const createFixUp = (url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo) => {
                    aAllowThirdPartyFixup = aAllowThirdPartyFixup instanceof Object ? aAllowThirdPartyFixup : {};
                    aAllowThirdPartyFixup.triggeringPrincipal = aAllowThirdPartyFixup.triggeringPrincipal || (where === 'current' ? gBrowser.selectedBrowser.contentPrincipal : (
                        /^(f|ht)tps?:/.test(url) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    ));
                    aAllowThirdPartyFixup.postData = aPostData || null;
                    aAllowThirdPartyFixup.referrerInfo = aReferrerInfo || null;
                    return aAllowThirdPartyFixup;
                }
                if ("openTrustedLinkIn" in window) {
                    var _openURL = (url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo) => {
                        openTrustedLinkIn(url, where, createFixUp(url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo));
                    }
                } else {
                    var _openURL = (url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo) =>
                        openUILinkIn(url, where, false, aPostData || null, aReferrerInfo);
                }
                (this.openUILinkIn = _openURL)(url, where, aAllowThirdPartyFixup, aPostData, aReferrerInfo);
            },
            edit: function (aFile, aLineNumber) {
                if (KeyChanger.isBuilding) return;
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
                        function setPath() {
                            var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                            // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
                            fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                                ? window.browsingContext
                                : window, "设置全局脚本编辑器", fp.modeOpen);
                            fp.appendFilter("执行文件", "*.exe");

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
                        KeyChanger.alert("请先设置编辑器的路径!!!", "提示", setPath);
                    }
                }

                var aURL = "";
                aURL = this.getURLSpecFromFile(aFile);

                var aDocument = null;
                var aCallBack = null;
                var aPageDescriptor = null;
                gViewSourceUtils.openInExternalEditor({
                    URL: aURL,
                    lineNumber: aLineNumber
                }, aPageDescriptor, aDocument, aLineNumber, aCallBack);

            },
            openScriptInScratchpad: function (parentWindow, file) {
                let spWin = window.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
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
            },
            exec: function (path, arg) {
                var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
                try {
                    var a = (typeof arg == 'string' || arg instanceof String) ? arg.split(/\s+/) : [arg];
                    file.initWithPath(path);
                    process.init(file);
                    process.run(false, a, a.length);
                } catch (e) {
                    this.log(e);
                }
            },
            getURLSpecFromFile(aFile) {
                var aURL;
                if (this.appVersion < 92) {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
                } else {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
                }
                return aURL;
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
                    "chrome://global/skin/icons/information-32.png", aTitle || "KeyChanger",
                    aMsg + "", !!callback, "", callback);
            },
            log: function () {
                Services.console.logStringMessage("[KeyChanger] " + Array.prototype.slice.call(arguments));
            },
            init: function () {
                this.createMenuitem();
                this.addEventListener();
                this.makeKeyset();
            }
        }

        function saveFile(fileOrName, data) {
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
            foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0);
            foStream.write(data, data.length);
            foStream.close();
        }

        function loadText(aFile) {
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);

            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) {
            }
            sstream.close();
            fstream.close();
            return data;
        }

        function $C(aDoc, tag, attrs, skipAttrs) {
            attrs = attrs || {};
            skipAttrs = skipAttrs || [];
            var el = (aDoc || document).createXULElement(tag);
            return $A(el, attrs, skipAttrs);
        }

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

        function $R(el) {
            if (!el || !el.parentNode) return;
            el.parentNode.removeChild(el);
        }

        if (gBrowserInit.delayedStartupFinished) window.KeyChanger.init();
        else {
            let delayedListener = (subject, topic) => {
                if (topic == "browser-delayed-startup-finished" && subject == window) {
                    Services.obs.removeObserver(delayedListener, topic);
                    window.KeyChanger.init();
                }
            };
            Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
        }
    })()
}