// ==UserScript==
// @name           Baidu Translator
// @author         Ryan, BSTweaker
// @include        main
// @compatibility  Firefox 117
// @homepageURL	   https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @description    在上下文菜单中添加使用百度翻译所选文本的功能
// @note           从 DLTranslator (https://bitbucket.org/BSTweaker/userchromejs/src/master/DeepLTranslator.uc.js)修改而来
// @charset        UTF-8
// ==/UserScript==
const BDT_OPTIONS = {
    defaultLang: "zh",
    enableContextMenu: true,
    hotkey: {
        enabled: true,
        code: "AltLeft",
        repeat: 2,
        timeout: 500,
    },
    supportedLangs: {
        //"ara": "Arabic",
        //"bul": "Bulgarian",
        //"cs": "Czech",
        //"dan": "Danish",
        "de": "German",
        //"el": "Greek",
        "en": "English",
        //"est": "Estonian",
        //"fin": "Finnish",
        //"fra": "French",
        //"hu": "Hungarian",
        //"it": "Italian",
        //"jp": "Japanese",
        //"lit": "Lithuanian",
        //"lav": "Latvian",
        //"nl": "Dutch",
        //"pl": "Polish",
        "pt": "Portuguese",
        "pot": "Portuguese (Brazilian)",
        //"rom": "Romanian",
        //"ru": "Russian",
        //"sk": "Slovak",
        //"slo": "Slovenian",
        "spa": "Spanish",
        //"swe": "Swedish",
        "th": "Thai",
        "vie": "Vietnamese",
        "zh": "简体中文",
        "cht": "繁體中文",
        "wyw": "文言文",
    }
}

if (typeof window === "undefined" || globalThis !== window) {
    const { Services } = globalThis;
    ChromeUtils.defineModuleGetter(this, "ContentDOMReference", "resource://gre/modules/ContentDOMReference.sys.mjs");
    ChromeUtils.defineModuleGetter(this, "NetUtil", "resource://gre/modules/NetUtil.sys.mjs");

    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["BDTranslator", "BDTranslatorParent"];
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
                matches: [`*://*/*`],
            };

            if (BDT_OPTIONS.hotkey.enabled) {
                if (BDT_OPTIONS.hotkey.repeat <= 0) BDT_OPTIONS.hotkey.repeat = 2;
                if (BDT_OPTIONS.hotkey.timeout <= 0) BDT_OPTIONS.hotkey.timeout = 500;
                actorParams.child.events.keyup = {};
            }
            ChromeUtils.registerWindowActor("BDTranslator", actorParams);
        } catch (e) { Cu.reportError(e); }

        this.BDTranslatorParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let browser = this.browsingContext.top.embedderElement;
                let win = browser.ownerGlobal;
                const { BDTranslator } = win;
                switch (name) {
                    case "BDT:OpenTranlatorInTab":
                        BDTranslator.translateTextInNewTab(data.sourceText, data.from, data.to);
                        break;
                    case "BDT:TranslateText":
                        BDTranslator.translateText(data.sourceText, data.from, data.to).then(result => {
                            this.sendAsyncMessage("BDT:TranslateReulult", {
                                ...data,
                                resultObject: result
                            })
                        })
                        break;
                }
            }
        }
    }
    else {
        Cu.importGlobalProperties(["fetch"]);
        this.EXPORTED_SYMBOLS = ["BDTranslatorChild"];
        const BDPopupTranslator = {
            popup: null,
            show(win, x, y, sourceText, resultObject) {
                const options = BDT_OPTIONS;
                if (resultObject && "trans_result" in resultObject) {
                    this.fromLang = resultObject["trans_result"].from || "auto";
                    this.targetLang = resultObject["trans_result"].to || options.defaultLang
                } else {
                    this.fromLang = "auto";
                    this.targetLang = options.defaultLang;
                }
                this.sourceText = sourceText.trim();
                if (!win.document.getElementById("baidu-translator")) {
                    this.popup = win.document.createElement("div");
                    this.popup.id = "baidu-translator"
                    Object.assign(this.popup.style, {
                        position: "absolute",
                        top: `${win.scrollY + y}px`,
                        left: `${win.scrollX + x}px`,
                        width: "400px",
                        maxHeight: "200px",
                        fontFamily: "sans-serif",
                        fontSize: "16px",
                        color: "black",
                        background: "floralwhite",
                        border: "1px solid darkgray",
                        borderRadius: "3px",
                        boxShadow: "3px 3px 5px lightgray",
                        transition: "opacity 0.2s ease",
                        zIndex: "1000",
                    });
                    const flex = win.document.createElement("div");
                    Object.assign(flex.style, {
                        display: "flex",
                        maxHeight: "200px",
                        flexDirection: "column",
                    });
                    const header = win.document.createElement("div");
                    Object.assign(header.style, {
                        display: "flex",
                        height: "auto",
                        margin: "2px 5px 1px",
                        fontSize: "smaller",
                        alignItems: "center",
                    });
                    const logo = win.document.createElement("div");
                    logo.textContent = "翻译结果";
                    Object.assign(logo.style, {
                        width: "auto",
                        fontWeight: "bold",
                        flexGrow: "1",
                    });
                    header.appendChild(logo);
                    const langSelector = win.document.createElement("select");
                    for (let [lang, desc] of Object.entries(options.supportedLangs)) {
                        const option = win.document.createElement("option");
                        option.value = lang;
                        option.textContent = desc;
                        langSelector.appendChild(option);
                    }
                    langSelector.value = this.targetLang;
                    Object.assign(langSelector.style, {
                        width: "auto",
                        marginRight: "5px",
                    });
                    langSelector.addEventListener("change", this);
                    header.appendChild(langSelector);
                    const more = win.document.createElement("div");
                    more.className = "baidu-translator-more";
                    more.textContent = "更多";
                    Object.assign(more.style, {
                        width: "auto",
                        cursor: "pointer",
                    });
                    more.addEventListener("click", this);
                    header.appendChild(more);
                    flex.appendChild(header);
                    const box = win.document.createElement("div");
                    box.className = "baidu-translator-box";
                    Object.assign(box.style, {
                        height: "auto",
                        overflow: "auto",
                        background: "white",
                        padding: "2px",
                        margin: "1px 5px 5px",
                        border: "1px solid darkgray",
                        flexGrow: "1",
                        whiteSpace: "pre-wrap",
                    });
                    flex.appendChild(box);
                    this.popup.appendChild(flex);
                    win.document.body.appendChild(this.popup);
                    win.setTimeout(() => win.addEventListener("click", this), 0);
                } else {
                    this.setPos(x, y);
                }
                if (resultObject && "trans_result" in resultObject) {
                    let data = resultObject.trans_result.data;
                    this.setText(data.map(el => el.dst).join("\n"));
                }
            },
            handleEvent(event) {
                const { type, target } = event;
                const actor = target.ownerGlobal.windowGlobalChild.getActor("BDTranslator");
                switch (type) {
                    case "click":
                        if (!this.popup.contains(target)) {
                            target.ownerGlobal.removeEventListener("click", this);
                            this.popup.addEventListener("transitionend", ({ target }) => {
                                target.parentNode.removeChild(target);
                            }, { once: true });
                            this.popup.style.opacity = 0;
                        }
                        else if (target.className === "baidu-translator-more") {
                            actor.sendAsyncMessage("BDT:OpenTranlatorInTab", {
                                sourceText: this.sourceText,
                                from: this.fromLang,
                                to: this.targetLang,
                            });
                            event.stopPropagation();
                        }
                        break;
                    case "change":
                        this.targetLang = target.value;
                        this.translate(actor, this.sourceText, this.fromLang, this.targetLang);
                        break;
                }
            },
            setPos(x, y) {
                Object.assign(this.popup.style, {
                    top: `${win.scrollY + y}px`,
                    left: `${win.scrollX + x}px`,
                    opacity: 1
                });
            },
            setText(text, color) {
                let box = this.popup.querySelector(".baidu-translator-box");
                if (color) box.style.color = color;
                else box.style.color = null;
                box.textContent = text;
            },
            translate(actor, text, from, to) {
                this.setText("正在翻译中...", "lightgray");
                actor.sendAsyncMessage("BDT:TranslateText", {
                    sourceText: text,
                    from: from || this.fromLang,
                    to: to || this.targetLang
                });
            }
        }

        this.BDTranslatorChild = class extends JSWindowActorChild {
            actorCreated() {
                this.keyRepeat = 0;
            }
            createPopupWithScreenCoordinate(screenX, screenY, sourceText, resultObject) {
                let x = screenX - this.contentWindow.screenX - this.contentWindow.outerWidth + this.contentWindow.innerWidth;
                let y = screenY - this.contentWindow.screenY - this.contentWindow.outerHeight + this.contentWindow.innerHeight;
                this.createPopupWithClientCoordinate(x, y, sourceText, resultObject);
            }
            createPopupWithClientCoordinate(clientX, clientY, sourceText, resultObject) {
                let x = clientX;
                let y = clientY;
                let clientWidth = this.contentWindow.document.documentElement.clientWidth;
                let clientHeight = this.contentWindow.document.documentElement.clientHeight;
                if (x + 400 > clientWidth) x = clientWidth - 400;
                if (y + 200 > clientHeight) y = clientHeight - 200;
                x = Math.max(x, 0);
                y = Math.max(y, 0);
                if (resultObject) {
                    BDPopupTranslator.show(this.contentWindow, x, y, sourceText, resultObject);
                } else {
                    BDPopupTranslator.show(this.contentWindow, x, y, sourceText);
                    BDPopupTranslator.translate(this.contentWindow.windowGlobalChild.getActor("BDTranslator"), sourceText);
                }
            }
            createPopupWithSelection() {
                const selection = this.contentWindow.getSelection();
                const text = selection.toString().trim();
                if (text) {
                    let rect = selection.getRangeAt(0).getBoundingClientRect();
                    return this.createPopupWithClientCoordinate(rect.left, rect.top + rect.height, text);
                }
                return null;
            }
            receiveMessage({ name, data }) {
                switch (name) {
                    case "BDT:CreatePopup":
                        let fixupX = 0;
                        let fixupY = 0;
                        if (data.fixupX) fixupX = data.fixupX;
                        if (data.fixupY) fixupY = data.fixupY;
                        this.createPopupWithScreenCoordinate(data.screenX + fixupX, data.screenY + fixupY, data.sourceText, data.resultObject);
                        break;
                    case "BDT:TranslateReulult":
                        let resultObject = data.resultObject;
                        if (resultObject && "trans_result" in resultObject) {
                            let data = resultObject.trans_result.data;
                            BDPopupTranslator.setText(data.map(el => el.dst).join("\n"));
                        } else {
                            BDPopupTranslator.setText("翻译失败！", "red");
                        }
                        break;
                    case "BDT:CreatePopupWithClientCoordinate":
                        this.createPopupWithClientCoordinate(data.clientX, data.clientY, data.sourceText).translate(data.fromLang, data.toLang);
                        break;
                }
            }
            handleEvent(event) {
                switch (event.type) {
                    case "keyup":
                        if (event.code === BDT_OPTIONS.hotkey.code && this.contentWindow.getSelection()?.toString()) {
                            if (!this.keyRepeat) {
                                new Promise((resolve, reject) => {
                                    this.hotkeyResolver = resolve;
                                    this.hotkeyRejector = reject;
                                    this.contentWindow.setTimeout(() => reject(), BDT_OPTIONS.hotkey.timeout);
                                }).then(() => {
                                    this.keyRepeat = 0;
                                    this.hotkeyResolver = null;
                                    this.hotkeyRejector = null;
                                    this.createPopupWithSelection();
                                }).catch(() => {
                                    this.keyRepeat = 0;
                                    this.hotkeyResolver = null;
                                    this.hotkeyRejector = null;
                                });
                            }
                            if (++this.keyRepeat === BDT_OPTIONS.hotkey.repeat) {
                                this.hotkeyResolver();
                            }
                        }
                        else if (this.keyRepeat) {
                            this.hotkeyRejector();
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
            if (!resourceHandler.hasSubstitution("bdt-ucjs")) {
                resourceHandler.setSubstitution("bdt-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://bdt-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        }
    } catch (e) { console.error(e) }
    (function () {
        window.BDTranslator = {
            get appVersion() {
                delete this.appVersion;
                return this.appVersion = parseFloat(Services.appinfo.version);
            },
            init: async function () {
                window.addEventListener('unload', this, false);

                /**
                 * 获取必备头
                 */
                let respText = await (await fetch("https://fanyi.baidu.com")).text();
                this.gtk = /window\.gtk = ('|")(.*?)('|")/.exec(respText)[2];
                this.token = /token: ('|")(.*?)('|")/.exec(respText)[2];
                if (BDT_OPTIONS.enableContextMenu)
                    this.addContextMenuitem();
            },
            /**
             * 添加右键菜单
             */
            addContextMenuitem() {
                const menuitem = $C("menuitem", {
                    id: 'menu-translate-selected',
                    class: "menuitem-iconic",
                    label: "翻译选中文本",
                    image: "data:image/png;base64,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",
                });
                menuitem.addEventListener('command', this, false);
                this.menuitem = $('contentAreaContextMenu').appendChild(menuitem);
                $('contentAreaContextMenu').addEventListener('popupshowing', this);
            },
            /**
             * 通过 API 获取语言
             * @param {string} text 待检测文本
             * @returns 
             */
            checkLang: async function (text) {
                const rawText = text.replace(/[\uD800-\uDBFF]$/, "").slice(0, 50);
                const data = new URLSearchParams();
                data.append('query', rawText);

                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: data,
                };

                try {
                    const response = await fetch('https://fanyi.baidu.com/langdetect', options);
                    const { lan } = await response.json();
                    return lan;
                } catch (error) {
                    console.log(error);
                    return;
                }
            },
            /**
             * 网页翻译接口
             * 
             * @param {string} text 带翻译文本
             * @param {string} from 源语言，不提供此参数则自动检测
             * @param {string} to 目标语言，不提供则默认翻译为默认语言
             * @returns 
             */
            translateText: async function (text, from, to) {
                if (!from) {
                    from = await this.checkLang(text);
                }
                to || (to = BDT_OPTIONS.defaultLang);
                const processedText = text.length > 30 ? (text.substring(0, 10) + text.substring(~~(text.length / 2) - 5, ~~(text.length / 2) + 5) + text.substring(text.length - 10)) : text;
                const data = new URLSearchParams();
                data.append('from', from);
                data.append('to', to);
                data.append('query', text);
                data.append('simple_means_flag', '3');
                data.append('sign', calcTk(processedText, this.gtk));
                data.append('token', this.token);
                data.append('domain', 'common');
                const options = {
                    method: 'POST',
                    headers: {
                        'referer': 'https://fanyi.baidu.com',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    },
                    body: data,
                };
                try {
                    const response = await fetch('https://fanyi.baidu.com/v2transapi', options);
                    const res = await response.json();
                    return res;
                    // Process the response as needed
                } catch (error) {
                    console.log(error);
                    return;
                }
            },
            /**
             * 打开翻译网页
             * @param {string} text 待翻译文本
             * @param {string} from 源语言
             * @param {string} to 目标语言
             */
            translateTextInNewTab: function (text, from, to) {
                const urlTemplate = "https://fanyi.baidu.com/#{sourceLang}/{targetLang}/{sourceText}";
                const url = urlTemplate.replace("{sourceLang}", from).replace("{targetLang}", to).replace("{sourceText}", text)
                if (this.appVersion < 78) {
                    openUILinkIn(url, 'tab', false, null);
                } else {
                    openWebLinkIn(url, 'tab', {
                        postData: null,
                        triggeringPrincipal:
                            Services.scriptSecurityManager.createNullPrincipal({
                                userContextId: gBrowser.selectedBrowser.getAttribute(
                                    "userContextId"
                                )
                            })
                    });
                }
            },
            /**
             * 事件处理
             * @param {*} event 
             */
            handleEvent: function (event) {
                switch (event.type) {
                    case "unload":
                        this.uninit();
                        break;
                    case "command":
                        this.beginTranslate(event.target.ownerGlobal.gContextMenu?.contentData);
                        break;
                    case "popupshowing":
                        this.popupshowing(event.target.ownerGlobal);
                        break;
                }
            },
            /**
             * 点击菜单开始翻译
             * 
             * @param {*} contextMenuContentData 
             * @returns 
             */
            beginTranslate: async function (contextMenuContentData) {
                if (!contextMenuContentData) return;
                const win = contextMenuContentData.browser.ownerGlobal;
                const selectionText = contextMenuContentData.selectionInfo?.fullText;
                const targetIdentifier = contextMenuContentData.context?.targetIdentifier;
                const screenX = contextMenuContentData.context?.screenX ?? contextMenuContentData.context?.screenXDevPx / win.devicePixelRatio;
                const screenY = contextMenuContentData.context?.screenY ?? contextMenuContentData.context?.screenYDevPx / win.devicePixelRatio;
                const browser = contextMenuContentData.browser;
                const browserBoundingRect = browser.getBoundingClientRect();
                const fixupX = browser.ownerGlobal.outerWidth - browserBoundingRect.left - browserBoundingRect.width;
                const fixupY = 20 + browser.ownerGlobal.outerHeight - browserBoundingRect.top - browserBoundingRect.height;
                const actor = contextMenuContentData.frameBrowsingContext.currentWindowGlobal.getActor("BDTranslator");
                let translatedResult = await this.translateText(selectionText);
                actor.sendAsyncMessage("BDT:CreatePopup", {
                    targetIdentifier,
                    screenX, screenY,
                    fixupX, fixupY,
                    sourceText: selectionText,
                    resultObject: translatedResult
                });
            },
            /**
             * 没有选中文本的时候隐藏右键菜单
             * @param {ChromeWindow} win 
             */
            popupshowing(win) {
                let selectionText = win.gContextMenu?.contentData?.selectionInfo?.text;
                if (!selectionText) {
                    this.menuitem.hidden = true;
                    return;
                }
                if (win.gContextMenu?.browser?.currentURI?.spec?.startsWith("about:")) {
                    this.menuitem.hidden = true;
                }
                this.menuitem.nextElementSibling.hidden = true;
            },
            uninit: async function () {
                window.removeEventListener('unload', this, false);
                $('contentAreaContextMenu').removeEventListener('popupshowing', this);
                if (this.menuitem) this.menuitem.parentNode.removeChild(this.menuitem);
                delete window.BDTranslator;
            }
        }

        function $(id) {
            return document.getElementById(id);
        }

        function $C(tag, attrs, skipAttrs) {
            var el;
            if (!tag) return el;
            attrs = attrs || {};
            skipAttrs = skipAttrs || [];
            if (tag.startsWith('html:'))
                el = document.createElement(tag);
            else
                el = document.createXULElement(tag);
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

        /** 签名计算 */
        function calcTk(a, b) {
            var d = b.split(".");
            b = Number(d[0]) || 0;
            for (var e = [], f = 0, g = 0; g < a.length; g++) {
                var k = a.charCodeAt(g);
                128 > k ? e[f++] = k : (2048 > k ? e[f++] = k >> 6 | 192 : (55296 == (k & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (k = 65536 + ((k & 1023) << 10) + (a.charCodeAt(++g) & 1023),
                    e[f++] = k >> 18 | 240,
                    e[f++] = k >> 12 & 63 | 128) : e[f++] = k >> 12 | 224,
                    e[f++] = k >> 6 & 63 | 128),
                    e[f++] = k & 63 | 128)
            }
            a = b;
            for (f = 0; f < e.length; f++)a = Fo(a + e[f], "+-a^+6");
            a = Fo(a, "+-3^+b+-f");
            a ^= Number(d[1]) || 0;
            0 > a && (a = (a & 2147483647) + 2147483648);
            a %= 1E6;
            return a.toString() + "." + (a ^ b)
        }
        function Fo(a, b) {
            for (var c = 0; c < b.length - 2; c += 3) {
                var d = b.charAt(c + 2);
                d = "a" <= d ? d.charCodeAt(0) - 87 : Number(d);
                d = "+" == b.charAt(c + 1) ? a >>> d : a << d;
                a = "+" == b.charAt(c) ? a + d & 4294967295 : a ^ d
            }
            return a
        }

        window.BDTranslator.init();
    })()
}
