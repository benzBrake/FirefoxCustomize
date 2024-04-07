// ==UserScript==
// @name           LinkGopher.uc.js
// @description    提取链接脚本版
// @namespace      https://github.com/benzBrake/FirefoxCustomize/
// @author         Ryan
// @include        main
// @license        MIT License
// @compatibility  Firefox 70
// @charset        UTF-8
// @version        0.1.5
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/
// ==/UserScript==
if (typeof window === "undefined" || globalThis !== window) {
    let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
    try {
        if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
            BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
        }
    } catch (e) { }
    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["LinkGopherParent"];
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
                matches: ["*://*/*", "file:///*", "about:*", "view-source:*", "moz-extension://*/*", "resource://*/*"],
            };
            ChromeUtils.registerWindowActor("LinkGopher", actorParams);
        } catch (e) { console.error(e); }

        this.LinkGopherParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
                let browser = windowGlobal.rootFrameLoader.ownerElement;
                let win = browser.ownerGlobal;
                const { LinkGopher } = win;
                switch (name) {
                    case "LG:ShowLinks":
                        LinkGopher.processLinksData(data);
                        break;
                }
            }
        }
    } else {
        this.EXPORTED_SYMBOLS = ["LinkGopherChild"];

        this.LinkGopherChild = class extends JSWindowActorChild {
            actorCreated() {

            }
            receiveMessage({ name, data }) {
                const win = this.contentWindow;
                const { document: doc } = win;
                const actor = win.windowGlobalChild.getActor("LinkGopher");
                switch (name) {
                    case "LG:ExtractLinks":
                        const { keyword, text, exclude } = data;
                        const links = [...doc.querySelectorAll('a')].map(link => {
                            let url;
                            try {
                                url = new URL(link.href);
                            } catch (e) {
                                url = {
                                    href: "",
                                    protocol: "",
                                    host: ""
                                }
                            }
                            return {
                                href: link.href || "",
                                host: url.host,
                                protocol: url.protocol,
                                title: link.getAttribute("title") || "",
                                innerText: link.innerText,
                                innerHTML: link.innerHTML,
                                outerHTML: link.outerHTML
                            }
                        });
                        actor.sendAsyncMessage("LG:ShowLinks", {
                            links,
                            keyword,
                            text,
                            exclude
                        });
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
            if (!resourceHandler.hasSubstitution("link-gopher")) {
                resourceHandler.setSubstitution("link-gopher", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://link-gopher/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        }
    } catch (e) { console.error(e); }
    (function (css) {
        let {
            classes: Cc,
            interfaces: Ci,
            utils: Cu,
            results: Cr
        } = Components;

        let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
        try {
            if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
                BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
            }
        } catch (e) { }


        if (window && window.LinkGopher) {
            window.LinkGopher.destroy();
            delete window.LinkGopher;
        }

        const LinkGopher_LANG = {
            'zh-CN': {
                "linkgopher-label": "链接提取",
                "linkgopher-tooltip": "一键提取网页链接",
                "extract all links": "提取所有链接",
                "extract all magnet links": "提取所有磁力链接",
                "extract by keyword": "根据关键字提取",
                "extract domain only": "只提取域名",
                "about link gopher": "关于 LinkGopher.uc.js"
            },
            'en-US': {
                "linkgopher-label": "Extract Links",
                "linkgopher-tooltip": "Extract links from webpage"
            },
        }

        // 读取语言代码
        let _locale;
        try {
            let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
            if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
                _locales = osPrefs.getRegionalPrefsLocales();
            else
                _locales = osPrefs.regionalPrefsLocales;
            for (let i = 0; i < _locales.length; i++) {
                if (LinkGopher_LANG.hasOwnProperty(_locales[i])) {
                    _locale = _locales[i];
                    break;
                }
            }
        } catch (e) { }
        const LinkGopher_LOCALE = _locale || "en-US";

        window.LinkGopher = {
            _selectedText: "",
            get prefs() {
                delete this.prefs;
                return this.prefs = Services.prefs.getBranch("userChromeJS.LinkGopher.")
            },
            get appVersion() {
                delete this.appVersion;
                return this.appVersion = parseFloat(Services.appinfo.version);
            },
            get platform() {
                delete this.platform;
                return this.platform = AppConstants.platform;
            },
            get locale() {
                delete this.locale;
                return this.locale = LinkGopher_LOCALE || "en-US";
            },
            init: function () {
                this.win = window;

                this.style = addStyle(css);
                this.initRegex();
                this.initButton();
            },
            initRegex() {
                let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
                let rTITLE = "%TEXT" + he + "%|%t\\b";
                let rURL = "%URL" + he + "%|%u\\b";
                let rHOST = "%HOST" + he + "%|%h\\b";
                let rExt = "%EOL" + he + "%";
                this.rTITLE = new RegExp(rTITLE, "i");
                this.rURL = new RegExp(rURL, "i");
                this.rHOST = new RegExp(rHOST, "i");
                this.rExt = new RegExp(rExt, "i");
                this.regexp = new RegExp([rTITLE, rURL, rHOST, rExt].join("|"), "ig");
            },
            initButton: function () {
                if ((CustomizableUI.getWidget('LinkGopher-Btn') && CustomizableUI.getWidget('LinkGopher-Btn').forWindow(this.win || window)?.node)) return;
                CustomizableUI.createWidget({
                    id: 'LinkGopher-Btn',
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    type: 'custom',
                    onBuild: doc => {
                        let btn = $C("toolbarbutton", {
                            id: "LinkGopher-Btn",
                            label: $L("linkgopher-label"),
                            tooltiptext: $L("linkgopher-tooltip"),
                            type: "menu",
                            class: "toolbarbutton-1 chromeclass-toolbar-additional"
                        }, doc);
                        let mp = $("mainPopupSet", doc);
                        if (!mp.querySelector("#LinkGopher-Popup")) {
                            let menupopup = mp.appendChild($C("menupopup", {
                                id: "LinkGopher-Popup",
                                class: "LinkGopher-Popup",
                            }, document));
                            [{
                                id: "LinkGopher-Extract-All",
                                label: $L("extract all links"),
                                oncommand: "window.LinkGopher.extract(event)",
                                keyword: "",
                                exclude: "^javascript:"
                            }, {
                                id: "LinkGopher-Extract-Magnet",
                                label: $L("extract all magnet links"),
                                oncommand: "window.LinkGopher.extract(event)",
                                keyword: "^magnet",
                            }, {
                                id: 'LinkGopher-Extract-By-Keyword',
                                label: $L("extract by keyword"),
                                oncommand: "window.LinkGopher.extract(event)",
                                prompt: true
                            }, {
                                id: "LinkGopher-Extract-Domain",
                                label: $L("extract domain only"),
                                oncommand: "window.LinkGopher.extract(event)",
                                exclude: "^javascript:",
                                text: "%h"
                            }, {

                            }, {
                                id: "LinkGopher-About",
                                label: $L("about link gopher"),
                                oncommand: "window.LinkGopher.extract(event)",
                                url: "https://github.com/benzBrake/FirefoxCustomize/"
                            }].forEach(obj => {
                                if (Object.entries(obj).length) {
                                    menupopup.appendChild($C("menuitem", obj, menupopup.ownerDocument));
                                } else {
                                    menupopup.appendChild($C("menuseparator", obj, menupopup.ownerDocument));
                                }
                            });
                            btn.appendChild(menupopup);
                        }
                        btn.addEventListener("mouseover", (event) => {
                            let menupopup = event.target.ownerDocument.querySelector("#LinkGopher-Popup");
                            if (menupopup.parentNode.id !== "LinkGopher-Btn") {
                                event.target.appendChild(menupopup);;
                            }
                            if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY < (event.target.ownerGlobal.innerHeight / 2)) {
                                menupopup.setAttribute("position", "after_end");
                            } else if (event.clientX < (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                                menupopup.setAttribute("position", "before_start");
                            } else if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                                menupopup.setAttribute("position", "before_start");
                            } else {
                                menupopup.removeAttribute("position", "after_end");
                            }
                        });
                        LinkGopher.btn = btn;
                        return btn;
                    },
                    onDestroyed: doc => {
                        let menupopup = doc.querySelector("#LinkGopher-Popup");
                        if (menupopup && menupopup.parentNode) { menupopup.parentNode.removeChild(menupopup) };
                    }
                });
            },
            extract(event) {
                const { target } = event;
                const prompt = target.getAttribute("prompt");
                const text = target.getAttribute("text") || "%u";
                const url = target.getAttribute("url");
                const exclude = target.getAttribute("exclude");
                const where = target.getAttribute("where") || "tab";
                if (url) {
                    openWebLinkIn(url, where, {
                        postData: null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(url) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            ),

                    })
                } else {
                    let keyword = event.target.getAttribute("keyword");
                    if (prompt === "true") {
                        let result = { value: keyword || "" };
                        let status = Services.prompt.prompt(window, LinkGopher_LOCALE.includes("zh-") ? "根据关键字过滤" : "Filter by keyword", LinkGopher_LOCALE.includes("zh-") ? "输入关键字" : "Please input keyword", result, null, {})
                        if (status) {
                            keyword = result.value;
                        }
                    }
                    if (this.btn) {
                        const { btn } = this;
                        btn.setAttribute("status", "loading");
                        this.timeOut = setTimeout(() => {
                            btn.removeAttribute("status");
                        }, 3000);
                    }
                    let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("LinkGopher");
                    actor.sendAsyncMessage("LG:ExtractLinks", {
                        keyword,
                        text,
                        exclude
                    });
                }
            },
            destroy: function () {
                ChromeUtils.unregisterWindowActor('LinkGopher');
                if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
                CustomizableUI.destroyWidget('LinkGopher-Btn');
                delete window.LinkGopher;
            },
            processLinksData({ links, keyword, exclude, text }) {
                if (links && links.length) {
                    const r = toRegex(keyword, exclude);
                    links = links.filter(link => r.test(link.href)).map(link => this.convertText(text, link)).filter(text => text.length);
                    if (/%H/.test(text.toUpperCase())) {
                        // 转换为主机名的时候需要去重
                        links = [...new Set(links)];
                    }
                    if (links.length) {
                        this.copy(links.join("\n"));
                        this.btn?.setAttribute("status", "success");
                    } else {
                        this.btn?.setAttribute("status", "failed");
                    }
                } else {
                    this.btn?.setAttribute("status", "failed");
                }
                clearTimeout(this.timeOut);
                setTimeout(() => {
                    LinkGopher.btn.removeAttribute("status");
                }, 2000);
            },
            convertText(text, link) {
                let result = text.replace(this.regexp, function (str) {
                    str = str.toUpperCase();
                    if (str.indexOf("_HTMLIFIED") >= 0)
                        return htmlEscape(convert(str.replace("_HTMLIFIED", ""), link));
                    if (str.indexOf("_HTML") >= 0)
                        return htmlEscape(convert(str.replace("_HTML", ""), link));
                    if (str.indexOf("_ENCODE") >= 0)
                        return encodeURIComponent(convert(str.replace("_ENCODE", ""), link));
                    return convert(str, link);
                });
                return result;

                function convert(str, link) {
                    switch (str) {
                        case "%T":
                        case "%TEXT%":
                            return link.innerText;
                        case "%U":
                        case "%URL%":
                            return link.href;
                        case "%H":
                        case "%HOST%":
                            return link.host;
                        case "%EOL%":
                            return "\r\n";
                    }
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
                        Cu.reportError($L("file not found", path));
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
            setSelectedText: function (text) {
                this._selectedText = text;
            },
            getSelectedText: function () {
                return this._selectedText;
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
                    this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "LinkGopher",
                    aMsg + "", !!callback, "", callback);
            },
            log: log,
        }

        function $(id) {
            return document.getElementById(id);
        }

        function $$(exp, doc) {
            return Array.prototype.slice.call((doc || document).querySelectorAll(exp));
        }

        function $A(args) {
            return Array.prototype.slice.call(args);
        }

        function log() {
            console.log(Array.prototype.slice.call(arguments));
        }

        function $C(name, attr, ownerDocument) {
            attr || (attr = {});
            ownerDocument || (ownerDocument = document);
            var el;
            if (name.startsWith("html:")) {
                el = ownerDocument.createElement(name);
            } else {
                el = ownerDocument.createXULElement(name);
            }
            if (attr) Object.keys(attr).forEach(function (n) {
                el.setAttribute(n, attr[n])
            });
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

        function $L() {
            let key = arguments[0];
            if (key) {
                if (!LinkGopher_LANG[LinkGopher_LOCALE].hasOwnProperty(key)) return capitalize(key);
                let str = LinkGopher_LANG[LinkGopher_LOCALE][key];
                for (let i = 1; i < arguments.length; i++) {
                    str = str.replace("%s", arguments[i]);
                }
                return str;
            } else return "";
        }

        function toRegex(keyword, excludeKeyword) {
            // 不转义 '^', '$', 和 '.*'
            const specialCharsToKeep = ['^', '$', '\\.*'];
            let escapedInput = keyword.replace(/[\\.^$*+?()[\]{}|]/g, (char) => {
                if (specialCharsToKeep.includes(char)) return char;
                return '\\' + char;
            });

            // 如果有排除关键词，则添加负向前瞻断言
            if (excludeKeyword) {
                // 同样处理 excludeKeyword 内的特殊字符
                const escapedExclude = excludeKeyword.replace(/[\\.^$*+?()[\]{}|]/g, (char) => {
                    if (specialCharsToKeep.includes(char)) return char;
                    return '\\' + char;
                });
                escapedInput = `(?!.*${escapedExclude}).*${escapedInput}`;
            }

            // 返回转换后的正则表达式
            return new RegExp(escapedInput);
        }

        window.LinkGopher.init();
    })(`
#LinkGopher-Btn {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHRyYW5zZm9ybT0ic2NhbGUoMS4wNSkiPjxwYXRoIGZpbGw9IiMyNUI3RDMiIGQ9Ik03LjksMjU2QzcuOSwxMTksMTE5LDcuOSwyNTYsNy45QzM5Myw3LjksNTA0LjEsMTE5LDUwNC4xLDI1NmMwLDEzNy0xMTEuMSwyNDguMS0yNDguMSwyNDguMUMxMTksNTA0LjEsNy45LDM5Myw3LjksMjU2eiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik00MDIuNCAxNTkuMmwtNDkuNi00OS42Yy0xMC43LTEwLjctMjguMS0xMC43LTM4LjggMGwtNzYuNiA3Ni42Yy0xMC43IDEwLjctMTAuNyAyOC4xIDAgMzguOGw0OS42IDQ5LjZjMTAuNyAxMC43IDI4LjEgMTAuNyAzOC44IDBsNzYuNi03Ni42QzQxMy4xIDE4Ny4zIDQxMy4xIDE3MCA0MDIuNCAxNTkuMnpNMzIwLjUgMjQzLjNjLTYuMyA2LjMtMTYuNSA2LjMtMjIuOCAwbC0yOS4xLTI5LjFjLTYuMy02LjMtNi4zLTE2LjUgMC0yMi44bDUwLjUtNTAuNWM2LjMtNi4zIDE2LjUtNi4zIDIyLjggMGwyOS4xIDI5LjFjNi4zIDYuMyA2LjMgMTYuNSAwIDIyLjhMMzIwLjUgMjQzLjN6TTI3NC43IDI4Ni45bC00OS42LTQ5LjZjLTEwLjctMTAuNy0yOC4xLTEwLjctMzguOCAwbC03Ni42IDc2LjZjLTEwLjcgMTAuNy0xMC43IDI4LjEgMCAzOC44bDQ5LjYgNDkuNmMxMC43IDEwLjcgMjguMSAxMC43IDM4LjggMGw3Ni42LTc2LjZDMjg1LjQgMzE1IDI4NS40IDI5Ny42IDI3NC43IDI4Ni45ek0xOTIuOCAzNzFjLTYuMyA2LjMtMTYuNSA2LjMtMjIuOCAwTDE0MSAzNDEuOWMtNi4zLTYuMy02LjMtMTYuNSAwLTIyLjhsNTAuNS01MC41YzYuMy02LjMgMTYuNS02LjMgMjIuOCAwbDI5LjEgMjkuMWM2LjMgNi4zIDYuMyAxNi41IDAgMjIuOEwxOTIuOCAzNzF6Ii8+PHBhdGggZmlsbD0iIzQ4QTFBRiIgZD0iTTMxNC44LDE5OS42bC0yLjQtMi40Yy03LjctNy43LTIwLjMtNy43LTI4LjEsMGwtODcuMiw4Ny4yYy03LjcsNy43LTcuNywyMC4zLDAsMjguMWwyLjQsMi40YzcuNyw3LjcsMjAuMyw3LjcsMjguMSwwbDg3LjItODcuMkMzMjIuNiwyMTkuOSwzMjIuNiwyMDcuMywzMTQuOCwxOTkuNnoiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMjIzLjMsMzEwLjVjLTUuMyw1LjMtMTQsNS4zLTE5LjQsMGwtMi40LTIuNGMtNS4zLTUuMy01LjMtMTQsMC0xOS40bDg3LjItODcuMmM1LjMtNS4zLDE0LTUuMywxOS40LDBsMi40LDIuNGM1LjMsNS4zLDUuMywxNCwwLDE5LjRMMjIzLjMsMzEwLjV6Ii8+PC9zdmc+);
}
#LinkGopher-Btn[status="loading"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPjxsaW5lYXJHcmFkaWVudCBpZD0ibmtZM2xUVmxQUlcxZ2FQNmZrSWd1YSIgeDE9IjE5LjU5NiIgeDI9IjI3LjU5NiIgeTE9IjM5IiB5Mj0iMzkiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNzgxOWEyIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzcxYWE5Ii8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBmaWxsPSJ1cmwoI25rWTNsVFZsUFJXMWdhUDZma0lndWEpIiBkPSJNNSwyMy41OTRjMC0yLjIwNywxLjc5MS0zLjk5OCw0LTMuOTk4YzIuMjEsMCw0LDEuNzkxLDQsMy45OThjMCwyLjIxMS0xLjc5LDQuMDAyLTQsNC4wMDJDNi43OTEsMjcuNTk2LDUsMjUuODA1LDUsMjMuNTk0eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibmtZM2xUVmxQUlcxZ2FQNmZrSWd1YiIgeDE9IjM2IiB4Mj0iNDIiIHkxPSIyMy40MDQiIHkyPSIyMy40MDQiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjOTEyZmJkIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjOTMzMmJmIi8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBmaWxsPSJ1cmwoI25rWTNsVFZsUFJXMWdhUDZma0lndWIpIiBkPSJNMjcuNTk2LDM5YzAtMS42NTctMS4zNDMtMy0zLTNzLTMsMS4zNDMtMywzczEuMzQzLDMsMywzUzI3LjU5Niw0MC42NTcsMjcuNTk2LDM5eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibmtZM2xUVmxQUlcxZ2FQNmZrSWd1YyIgeDE9IjMxLjUxNiIgeDI9IjM3LjUxNiIgeTE9IjEyLjQ5OCIgeTI9IjEyLjQ5OCIgZ3JhZGllbnRUcmFuc2Zvcm09InJvdGF0ZSg5MCAyNCAyNCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM5MTJmYmQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM5MzMyYmYiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjbmtZM2xUVmxQUlcxZ2FQNmZrSWd1YykiIGQ9Ik0zMi41MDIsMzQuNTE4YzAtMS42NTksMS4zNDQtMy4wMDIsMy0zLjAwMmMxLjY1NiwwLDMsMS4zNDMsMywzLjAwMmMwLDEuNjU0LTEuMzQ0LDIuOTk4LTMsMi45OThDMzMuODQ2LDM3LjUxNiwzMi41MDIsMzYuMTcyLDMyLjUwMiwzNC41MTh6Ii8+PGxpbmVhckdyYWRpZW50IGlkPSJua1kzbFRWbFBSVzFnYVA2ZmtJZ3VkIiB4MT0iMjAuNTk2IiB4Mj0iMjYuNTk2IiB5MT0iOCIgeTI9IjgiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjYWU0Y2Q1Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjYWM0YWQ1Ii8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBmaWxsPSJ1cmwoI25rWTNsVFZsUFJXMWdhUDZma0lndWQpIiBkPSJNMzcsMjMuNTk0YzAtMS42NTQsMS4zNDQtMi45OTgsMy4wMDItMi45OThjMS42NTUsMCwyLjk5OCwxLjM0MywyLjk5OCwyLjk5OGMwLDEuNjYtMS4zNDMsMy4wMDItMi45OTgsMy4wMDJDMzguMzQ0LDI2LjU5NiwzNywyNS4yNTQsMzcsMjMuNTk0eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibmtZM2xUVmxQUlcxZ2FQNmZrSWd1ZSIgeDE9IjYiIHgyPSIxMCIgeTE9IjIyLjg5MyIgeTI9IjIyLjg5MyIgZ3JhZGllbnRUcmFuc2Zvcm09InJvdGF0ZSg5MCAyNCAyNCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNjOTY1ZWIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNjNzY3ZTUiLz48L2xpbmVhckdyYWRpZW50PjxjaXJjbGUgY3g9IjI1LjEwNyIgY3k9IjgiIHI9IjIiIGZpbGw9InVybCgjbmtZM2xUVmxQUlcxZ2FQNmZrSWd1ZSkiLz48bGluZWFyR3JhZGllbnQgaWQ9Im5rWTNsVFZsUFJXMWdhUDZma0lndWYiIHgxPSIxMS4xNzYiIHgyPSIxNC4xNzYiIHkxPSIzNC4zMDkiIHkyPSIzNC4zMDkiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMjQpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjYzk2NWViIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjYzc2N2U1Ii8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBmaWxsPSJ1cmwoI25rWTNsVFZsUFJXMWdhUDZma0lndWYpIiBkPSJNMTIuMTkxLDEyLjY3OGMwLTAuODI4LDAuNjctMS41MDIsMS41LTEuNTAyYzAuODI0LDAsMS41LDAuNjc0LDEuNSwxLjUwMnMtMC42NzYsMS40OTgtMS41LDEuNDk4QzEyLjg2MSwxNC4xNzYsMTIuMTkxLDEzLjUwNiwxMi4xOTEsMTIuNjc4eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibmtZM2xUVmxQUlcxZ2FQNmZrSWd1ZyIgeDE9IjEwLjE3NyIgeDI9IjE1LjE3NyIgeTE9IjEyLjQ5OCIgeTI9IjEyLjQ5OCIgZ3JhZGllbnRUcmFuc2Zvcm09InJvdGF0ZSg5MCAyNCAyNCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNhZTRjZDUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNhYzRhZDUiLz48L2xpbmVhckdyYWRpZW50PjxjaXJjbGUgY3g9IjM1LjUwMiIgY3k9IjEyLjY3NyIgcj0iMi41IiBmaWxsPSJ1cmwoI25rWTNsVFZsUFJXMWdhUDZma0lndWcpIi8+PGxpbmVhckdyYWRpZW50IGlkPSJua1kzbFRWbFBSVzFnYVA2ZmtJZ3VoIiB4MT0iMzEuMDE2IiB4Mj0iMzguMDE2IiB5MT0iMzQuMzA5IiB5Mj0iMzQuMzA5IiBncmFkaWVudFRyYW5zZm9ybT0icm90YXRlKDkwIDI0IDI0KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzkxMmZiZCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzkzMzJiZiIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZmlsbD0idXJsKCNua1kzbFRWbFBSVzFnYVA2ZmtJZ3VoKSIgZD0iTTEwLjE5MSwzNC41MThjMC0xLjkzNSwxLjU2NS0zLjUwMiwzLjUtMy41MDJjMS45MzIsMCwzLjUsMS41NjcsMy41LDMuNTAyYzAsMS45My0xLjU2OCwzLjQ5OC0zLjUsMy40OThDMTEuNzU3LDM4LjAxNiwxMC4xOTEsMzYuNDQ3LDEwLjE5MSwzNC41MTh6Ii8+PC9zdmc+)
}
#LinkGopher-Btn[status="success"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPjxsaW5lYXJHcmFkaWVudCBpZD0iSTlHVjBTb3pRRmtueEhTUjZEQ3g1YSIgeDE9IjkuODU4IiB4Mj0iMzguMTQyIiB5MT0iOS44NTgiIHkyPSIzOC4xNDIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMyMWFkNjQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwODgyNDIiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjSTlHVjBTb3pRRmtueEhTUjZEQ3g1YSkiIGQ9Ik00NCwyNGMwLDExLjA0NS04Ljk1NSwyMC0yMCwyMFM0LDM1LjA0NSw0LDI0UzEyLjk1NSw0LDI0LDRTNDQsMTIuOTU1LDQ0LDI0eiIvPjxwYXRoIGQ9Ik0zMi4xNzIsMTYuMTcyTDIyLDI2LjM0NGwtNS4xNzItNS4xNzJjLTAuNzgxLTAuNzgxLTIuMDQ3LTAuNzgxLTIuODI4LDBsLTEuNDE0LDEuNDE0Yy0wLjc4MSwwLjc4MS0wLjc4MSwyLjA0NywwLDIuODI4bDgsOGMwLjc4MSwwLjc4MSwyLjA0NywwLjc4MSwyLjgyOCwwbDEzLTEzYzAuNzgxLTAuNzgxLDAuNzgxLTIuMDQ3LDAtMi44MjhMMzUsMTYuMTcyQzM0LjIxOSwxNS4zOTEsMzIuOTUzLDE1LjM5MSwzMi4xNzIsMTYuMTcyeiIgb3BhY2l0eT0iLjA1Ii8+PHBhdGggZD0iTTIwLjkzOSwzMy4wNjFsLTgtOGMtMC41ODYtMC41ODYtMC41ODYtMS41MzYsMC0yLjEyMWwxLjQxNC0xLjQxNGMwLjU4Ni0wLjU4NiwxLjUzNi0wLjU4NiwyLjEyMSwwTDIyLDI3LjA1MWwxMC41MjUtMTAuNTI1YzAuNTg2LTAuNTg2LDEuNTM2LTAuNTg2LDIuMTIxLDBsMS40MTQsMS40MTRjMC41ODYsMC41ODYsMC41ODYsMS41MzYsMCwyLjEyMWwtMTMsMTNDMjIuNDc1LDMzLjY0NiwyMS41MjUsMzMuNjQ2LDIwLjkzOSwzMy4wNjF6IiBvcGFjaXR5PSIuMDciLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjEuMjkzLDMyLjcwN2wtOC04Yy0wLjM5MS0wLjM5MS0wLjM5MS0xLjAyNCwwLTEuNDE0bDEuNDE0LTEuNDE0YzAuMzkxLTAuMzkxLDEuMDI0LTAuMzkxLDEuNDE0LDBMMjIsMjcuNzU4bDEwLjg3OS0xMC44NzljMC4zOTEtMC4zOTEsMS4wMjQtMC4zOTEsMS40MTQsMGwxLjQxNCwxLjQxNGMwLjM5MSwwLjM5MSwwLjM5MSwxLjAyNCwwLDEuNDE0bC0xMywxM0MyMi4zMTcsMzMuMDk4LDIxLjY4MywzMy4wOTgsMjEuMjkzLDMyLjcwN3oiLz48L3N2Zz4=)
}
#LinkGopher-Btn[status="failed"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPjxsaW5lYXJHcmFkaWVudCBpZD0id1JLWEZKc3FIQ3hMRTl5eU9ZSGt6YSIgeDE9IjkuODU4IiB4Mj0iMzguMTQyIiB5MT0iOS44NTgiIHkyPSIzOC4xNDIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNDRmNWEiLz48c3RvcCBvZmZzZXQ9Ii40NDMiIHN0b3AtY29sb3I9IiNlZTNkNGEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNlNTIwMzAiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjd1JLWEZKc3FIQ3hMRTl5eU9ZSGt6YSkiIGQ9Ik00NCwyNGMwLDExLjA0NS04Ljk1NSwyMC0yMCwyMFM0LDM1LjA0NSw0LDI0UzEyLjk1NSw0LDI0LDRTNDQsMTIuOTU1LDQ0LDI0eiIvPjxwYXRoIGQ9Ik0zMy4xOTIsMjguOTVMMjguMjQzLDI0bDQuOTUtNC45NWMwLjc4MS0wLjc4MSwwLjc4MS0yLjA0NywwLTIuODI4bC0xLjQxNC0xLjQxNGMtMC43ODEtMC43ODEtMi4wNDctMC43ODEtMi44MjgsMEwyNCwxOS43NTdsLTQuOTUtNC45NWMtMC43ODEtMC43ODEtMi4wNDctMC43ODEtMi44MjgsMGwtMS40MTQsMS40MTRjLTAuNzgxLDAuNzgxLTAuNzgxLDIuMDQ3LDAsMi44MjhsNC45NSw0Ljk1bC00Ljk1LDQuOTVjLTAuNzgxLDAuNzgxLTAuNzgxLDIuMDQ3LDAsMi44MjhsMS40MTQsMS40MTRjMC43ODEsMC43ODEsMi4wNDcsMC43ODEsMi44MjgsMGw0Ljk1LTQuOTVsNC45NSw0Ljk1YzAuNzgxLDAuNzgxLDIuMDQ3LDAuNzgxLDIuODI4LDBsMS40MTQtMS40MTRDMzMuOTczLDMwLjk5NywzMy45NzMsMjkuNzMxLDMzLjE5MiwyOC45NXoiIG9wYWNpdHk9Ii4wNSIvPjxwYXRoIGQ9Ik0zMi44MzksMjkuMzAzTDI3LjUzNiwyNGw1LjMwMy01LjMwM2MwLjU4Ni0wLjU4NiwwLjU4Ni0xLjUzNiwwLTIuMTIxbC0xLjQxNC0xLjQxNGMtMC41ODYtMC41ODYtMS41MzYtMC41ODYtMi4xMjEsMEwyNCwyMC40NjRsLTUuMzAzLTUuMzAzYy0wLjU4Ni0wLjU4Ni0xLjUzNi0wLjU4Ni0yLjEyMSwwbC0xLjQxNCwxLjQxNGMtMC41ODYsMC41ODYtMC41ODYsMS41MzYsMCwyLjEyMUwyMC40NjQsMjRsLTUuMzAzLDUuMzAzYy0wLjU4NiwwLjU4Ni0wLjU4NiwxLjUzNiwwLDIuMTIxbDEuNDE0LDEuNDE0YzAuNTg2LDAuNTg2LDEuNTM2LDAuNTg2LDIuMTIxLDBMMjQsMjcuNTM2bDUuMzAzLDUuMzAzYzAuNTg2LDAuNTg2LDEuNTM2LDAuNTg2LDIuMTIxLDBsMS40MTQtMS40MTRDMzMuNDI1LDMwLjgzOSwzMy40MjUsMjkuODg5LDMyLjgzOSwyOS4zMDN6IiBvcGFjaXR5PSIuMDciLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzEuMDcxLDE1LjUxNWwxLjQxNCwxLjQxNGMwLjM5MSwwLjM5MSwwLjM5MSwxLjAyNCwwLDEuNDE0TDE4LjM0MywzMi40ODVjLTAuMzkxLDAuMzkxLTEuMDI0LDAuMzkxLTEuNDE0LDBsLTEuNDE0LTEuNDE0Yy0wLjM5MS0wLjM5MS0wLjM5MS0xLjAyNCwwLTEuNDE0bDE0LjE0Mi0xNC4xNDJDMzAuMDQ3LDE1LjEyNCwzMC42ODEsMTUuMTI0LDMxLjA3MSwxNS41MTV6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTMyLjQ4NSwzMS4wNzFsLTEuNDE0LDEuNDE0Yy0wLjM5MSwwLjM5MS0xLjAyNCwwLjM5MS0xLjQxNCwwTDE1LjUxNSwxOC4zNDNjLTAuMzkxLTAuMzkxLTAuMzkxLTEuMDI0LDAtMS40MTRsMS40MTQtMS40MTRjMC4zOTEtMC4zOTEsMS4wMjQtMC4zOTEsMS40MTQsMGwxNC4xNDIsMTQuMTQyQzMyLjg3NiwzMC4wNDcsMzIuODc2LDMwLjY4MSwzMi40ODUsMzEuMDcxeiIvPjwvc3ZnPg==)
}
    `)
}