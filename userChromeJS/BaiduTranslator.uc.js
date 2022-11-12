// ==UserScript==
// @name           Baidu Translator
// @author         Ryan, BSTweaker
// @include        main
// @compatibility  Firefox 78+
// @homepageURL	   https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @description    在上下文菜单中添加使用百度翻译所选文本的功能
// @note           需要申请百度翻译API（有免费额度：https://api.fanyi.baidu.com/），没有api会使用deepl后门翻译从 DLTranslator (https://bitbucket.org/BSTweaker/userchromejs/src/master/DeepLTranslator.uc.js)修改而来
// @charset        UTF-8
// ==/UserScript==

"use strict";
if (typeof window === "undefined" || globalThis !== window) {
    /* --- 設定ここから --- */
    const apiId = "";
    const apiSecret = "";
    const apiEndpoint = "https://api.fanyi.baidu.com/api/trans/vip/";
    const apiNewTab = "https://fanyi.baidu.com/#{sourceLang}/${targetLang}/{sourceText}";
    const hotkey = {
        enabled: true,
        code: "AltLeft",
        repeat: 2,
        timeout: 500,
    };
    const contextmenu = {
        enabled: true
    }
    const defaultLang = "zh";
    const supportedLangs = {
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
    };
    /* --- 設定ここまで --- */

    const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
    ChromeUtils.defineModuleGetter(this, "ContentDOMReference", "resource://gre/modules/ContentDOMReference.jsm");
    ChromeUtils.defineModuleGetter(this, "NetUtil", "resource://gre/modules/NetUtil.jsm");

    const BDT_LANG = {
        'zh-CN': {
            "translate selected text": "翻译选中文本",
            "translateing": "翻译中...",
            "more": "更多",
            "translate result": "翻译结果",
            "appid or appsecret not set": "未填写 appid/appsecret"
        },
        'en-US': {
            "translate selected text": "Translate selected text",
            "translating": "Translating...",
            "more": "More",
            "translate result": "Translate result",
            "appid or appsecret not set": "Appid or appsecret not set"
        }
    }

    // 读取语言代码
    let _locale;
    try {
        _locale = Services.prefs.getCharPref("general.useragent.locale");
    } catch (e) { }

    if (!_locale) {
        _locale = Services.locale.appLocaleAsBCP47;
    }

    if (!_locale || !BDT_LANG.hasOwnProperty(_locale)) _locale = "en-US";
    const BDT_LOCALE = _locale;

    var MD5 = function (string) {

        function RotateLeft(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }

        function AddUnsigned(lX, lY) {
            var lX4, lY4, lX8, lY8, lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }

        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }

        function FF(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function GG(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function HH(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function II(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function ConvertToWordArray(string) {
            var lWordCount;
            var lMessageLength = string.length;
            var lNumberOfWords_temp1 = lMessageLength + 8;
            var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
            var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
            var lWordArray = Array(lNumberOfWords - 1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        };

        function WordToHex(lValue) {
            var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
            }
            return WordToHexValue;
        };

        function Utf8Encode(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        };

        var x = Array();
        var k, AA, BB, CC, DD, a, b, c, d;
        var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

        string = Utf8Encode(string);

        x = ConvertToWordArray(string);

        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for (k = 0; k < x.length; k += 16) {
            AA = a; BB = b; CC = c; DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
            b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
            c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
            c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
            a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
            d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
            a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
            a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
            a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
            c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
            a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
            c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
            b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
            c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
            d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
            c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
            a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
            d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
            b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
            a = AddUnsigned(a, AA);
            b = AddUnsigned(b, BB);
            c = AddUnsigned(c, CC);
            d = AddUnsigned(d, DD);
        }

        var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

        return temp.toLowerCase();
    }

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
            if (hotkey.enabled) {
                if (hotkey.repeat <= 0) hotkey.repeat = 2;
                if (hotkey.timeout <= 0) hotkey.timeout = 500;
                actorParams.child.events.keyup = {};
            }
            ChromeUtils.registerWindowActor("BDTranslator", actorParams);
        } catch (e) { Cu.reportError(e); }

        this.BDTranslator = new class {
            attachToWindow(win) {
                if (contextmenu.enabled) {
                    let menuPopup = win.document.getElementById("contentAreaContextMenu");
                    let menuItem = win.document.createXULElement("menuitem");
                    menuItem.label = $L("translate selected text");
                    menuItem.id = "menu-translate-selected";
                    menuItem.addEventListener("command", this);
                    menuPopup.appendChild(menuItem);
                    menuPopup.addEventListener("popupshowing", this);
                }
                win.addEventListener("unload", this, { once: true });
            }
            detachFromWindow(win) {
                win.removeEventListener("unload", this, { once: true }); // this might be unnecessary, but do anyway
                win.document.getElementById("contentAreaContextMenu").removeEventListener("popupshowing", this);
                const menu = win.document.getElementById("menu-translate-selected");
                if (menu)
                    menu.parentNode.removeChild(menu);
            }
            handleEvent({ type, target }) {
                switch (type) {
                    case "popupshowing":
                        this.handlePopup(target.ownerGlobal);
                        break;
                    case "command":
                        this.beginTranslate(target.ownerGlobal.gContextMenu?.contentData);
                        break;
                    case "unload":
                        this.detachFromWindow(target.ownerGlobal);
                        break;
                }
            }
            handlePopup(win) {
                let selectionText = win.gContextMenu?.contentData?.selectionInfo?.text;
                win.document.getElementById("menu-translate-selected").hidden = !selectionText;
            }
            beginTranslate(contextMenuContentData) {
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
                actor.sendAsyncMessage("BDT:CreatePopup", {
                    targetIdentifier,
                    screenX, screenY,
                    fixupX, fixupY,
                    fromLang: null,
                    toLang: null,
                    sourceText: selectionText,
                });
            }
        }();

        this.BDTranslatorParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                switch (name) {
                    case "BDT:OpenTranlatorInTab":
                        const win = this.browsingContext.top.embedderElement.ownerGlobal;
                        win.openLinkIn(apiNewTab.replace("{sourceLang}", data.sourceLang).replace("{targetLang}", data.targetLang).replace("{sourceText}", data.sourceText),
                            "tab", {
                            relatedToCurrent: true,
                            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                        }
                        );
                        break;
                }
            }
        }
    }
    else {
        Cu.importGlobalProperties(["fetch"]);
        this.EXPORTED_SYMBOLS = ["BDTranslatorChild"];
        this.DLPopupTranslator = class {
            constructor(win, x, y, sourceText) {
                this.sourceLang = "auto";
                this.targetLang = win.windowGlobalChild.getActor("BDTranslator").defaultLang;
                this.sourceText = sourceText.trim();
                const popup = this.popup = win.document.createElement("div");
                Object.assign(popup.style, {
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
                logo.textContent = $L("translate result");
                Object.assign(logo.style, {
                    width: "auto",
                    fontWeight: "bold",
                    flexGrow: "1",
                });
                header.appendChild(logo);
                const langSelector = win.document.createElement("select");
                for (let [lang, desc] of Object.entries(supportedLangs)) {
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
                more.textContent = $L("more");
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
                win.document.body.appendChild(popup);
                win.setTimeout(() => win.addEventListener("click", this), 0);
            }
            handleEvent(event) {
                const { type, target } = event;
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
                            const actor = target.ownerGlobal.windowGlobalChild.getActor("BDTranslator");
                            actor.sendAsyncMessage("BDT:OpenTranlatorInTab", {
                                sourceText: this.sourceText,
                                sourceLang: this.sourceLang,
                                targetLang: this.targetLang,
                            });
                            event.stopPropagation();
                        }
                        break;
                    case "change":
                        this.targetLang = target.value;
                        this.translate(null, this.targetLang);
                        break;
                }
            }
            setText(text, color) {
                let box = this.popup.querySelector(".baidu-translator-box");
                if (color) box.style.color = color;
                else box.style.color = null;
                box.textContent = text;
            }
            translate(from, to) {
                this.setText($L("translating"), "lightgray");
                if (to) {
                    this.popup.querySelector("select").value = this.targetLang = to;
                    this.popup.ownerGlobal.windowGlobalChild.getActor("BDTranslator").defaultLang = to;
                }
                if (!apiId || !apiSecret) {
                    this.setText($L("appid or appsecret not set"), "red");
                    return;
                }

                let sourceText = this.sourceText;
                const UC = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                UC.charset = "UTF-8";
                try { sourceText = UI.ConvertToUnicode(sourceText) } catch (e) { }
                let salt = (new Date).getTime();
                let needSign = apiId + sourceText + salt + apiSecret;
                let data = {
                    q: sourceText,
                    from: from ? from : "auto",
                    to: this.targetLang,
                    appid: apiId,
                    salt: salt,
                    sign: MD5(needSign)
                }
                var formBody = [];
                for (var property in data) {
                    var encodedKey = encodeURIComponent(property);
                    var encodedValue = encodeURIComponent(data[property]);
                    formBody.push(encodedKey + "=" + encodedValue);
                }
                formBody = formBody.join("&");

                return fetch(`${apiEndpoint}/translate`, {
                    method: "POST",
                    referrerPolicy: "no-referrer",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formBody,
                }).then(resp => {
                    if (resp.status != 200) {
                        throw new Error(`Server returned ${resp.status} ${resp.statusText}`);
                    }
                    return resp.json();
                }).then(json => {
                    if (!json.trans_result) throw new Error(`${json.error_code} ${json.error_msg}`);
                    this.setText(json.trans_result[0]['dst']);
                    this.sourceLang = json.trans_result.from;
                }).catch(e => {
                    this.setText(e.message, "red");
                    Cu.reportError(e);
                });
            }
        }

        this.BDTranslatorChild = class extends JSWindowActorChild {
            actorCreated() {
                this.defaultLang = defaultLang;
                this.keyRepeat = 0;
            }
            createPopupWithScreenCoordinate(screenX, screenY, sourceText) {
                let x = screenX - this.contentWindow.screenX - this.contentWindow.outerWidth + this.contentWindow.innerWidth;
                let y = screenY - this.contentWindow.screenY - this.contentWindow.outerHeight + this.contentWindow.innerHeight;
                return this.createPopupWithClientCoordinate(x, y, sourceText);
            }
            createPopupWithClientCoordinate(clientX, clientY, sourceText) {
                let x = clientX;
                let y = clientY;
                let clientWidth = this.contentWindow.document.documentElement.clientWidth;
                let clientHeight = this.contentWindow.document.documentElement.clientHeight;
                if (x + 400 > clientWidth) x = clientWidth - 400;
                if (y + 200 > clientHeight) y = clientHeight - 200;
                x = Math.max(x, 0);
                y = Math.max(y, 0);
                return new DLPopupTranslator(this.contentWindow, x, y, sourceText);
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
                        this.createPopupWithScreenCoordinate(data.screenX + fixupX, data.screenY + fixupY, data.sourceText).translate(data.fromLang, data.toLang);
                        break;
                    case "BDT:CreatePopupWithClientCoordinate":
                        this.createPopupWithClientCoordinate(data.clientX, data.clientY, data.sourceText).translate(data.fromLang, data.toLang);
                        break;
                }
            }
            handleEvent(event) {
                switch (event.type) {
                    case "keyup":
                        if (event.code === hotkey.code && this.contentWindow.getSelection()?.toString()) {
                            if (!this.keyRepeat) {
                                new Promise((resolve, reject) => {
                                    this.hotkeyResolver = resolve;
                                    this.hotkeyRejector = reject;
                                    this.contentWindow.setTimeout(() => reject(), hotkey.timeout);
                                }).then(() => {
                                    this.keyRepeat = 0;
                                    this.hotkeyResolver = null;
                                    this.hotkeyRejector = null;
                                    this.createPopupWithSelection()?.translate(null, this.defaultLang);
                                }).catch(() => {
                                    this.keyRepeat = 0;
                                    this.hotkeyResolver = null;
                                    this.hotkeyRejector = null;
                                });
                            }
                            if (++this.keyRepeat === hotkey.repeat) {
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

    function $L() {
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = BDT_LANG[BDT_LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace("%s", arguments[i]);
            }
            return str;
        } else return "";
    }
} else {
    try {
        if (parseInt(Services.appinfo.version) < 101) {
            ChromeUtils.import(Components.stack.filename).BDTranslator.attachToWindow(window);
        } else {
            const fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            const scriptFile = fileHandler.getFileFromURLSpec(Components.stack.filename);
            const resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
            if (!resourceHandler.hasSubstitution("baidu-ucjs")) {
                resourceHandler.setSubstitution("baidu-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://baidu-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`).BDTranslator.attachToWindow(window);
        }
    } catch (e) { console.error(e) }
}
