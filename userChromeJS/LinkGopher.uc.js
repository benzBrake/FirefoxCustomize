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
                    case "LG:SendLinks":
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
                        const allLinks = [...doc.querySelectorAll('a')]
                            .map(link => {
                                let url;
                                try {
                                    url = new URL(link.href);
                                } catch (e) {
                                    url = {
                                        href: "",
                                        protocol: "",
                                        host: ""
                                    };
                                }
                                return {
                                    href: link.href || "",
                                    host: url.host,
                                    protocol: url.protocol,
                                    title: link.getAttribute("title") || "",
                                    innerText: link.innerText,
                                    innerHTML: link.innerHTML,
                                    outerHTML: link.outerHTML
                                };
                            });

                        actor.sendAsyncMessage("LG:SendLinks", {
                            links: allLinks,
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
    location.href.startsWith("chrome://browser/content/browser.x") && (async (id, css, i18n, $, createEl, applyAttr, removeEl, sprintf, addStyle, toRegex) => {
        var lprintf = (f, ...args) => { return sprintf(f in i18n ? i18n[f] : f, ...args); };
        var LinkMenus = () => ([{
            id: "LinkGopher-Extract-All",
            label: lprintf("extract all links"),
            oncommand: "window.LinkGopher.onCommand(event)",
            keyword: "",
            exclude: "^javascript:"
        }, {
            id: "LinkGopher-Extract-Magnet",
            label: lprintf("extract all magnet links"),
            oncommand: "window.LinkGopher.onCommand(event)",
            keyword: "^magnet",
        }, {
            id: "LinkGopher-Extract-Ed2k",
            label: lprintf("extract all ed2k links"),
            oncommand: "window.LinkGopher.onCommand(event)",
            keyword: "^ed2k",
        }, {
            id: 'LinkGopher-Extract-By-Keyword',
            label: lprintf("extract by keyword"),
            oncommand: "window.LinkGopher.onCommand(event)",
            prompt: true
        }, {
            id: "LinkGopher-Extract-Domain",
            label: lprintf("extract domain only"),
            oncommand: "window.LinkGopher.onCommand(event)",
            exclude: "^javascript:",
            text: "%h"
        }, {
            id: "LinkGopher-About",
            label: lprintf("about link gopher"),
            oncommand: "window.LinkGopher.onCommand(event)",
            url: "https://github.com/benzBrake/FirefoxCustomize/"
        }]);
        if (!window.LinkGopher) {
            window.LinkGopher = {
                get regexp() {
                    let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
                    let rTITLE = "%TEXT" + he + "%|%t\\b";
                    let rURL = "%URL" + he + "%|%u\\b";
                    let rHOST = "%HOST" + he + "%|%h\\b";
                    let rExt = "%EOL" + he + "%";
                    this.rTITLE = new RegExp(rTITLE, "i");
                    this.rURL = new RegExp(rURL, "i");
                    this.rHOST = new RegExp(rHOST, "i");
                    this.rExt = new RegExp(rExt, "i");
                    delete this.regexp;
                    return (this.regexp = new RegExp([rTITLE, rURL, rHOST, rExt].join("|"), "ig"));
                },
                init: async function () {
                    if (!(CustomizableUI.getWidget(id) && CustomizableUI.getWidget(id).forWindow(window)?.node)) {
                        try {
                            CustomizableUI.createWidget({
                                id,
                                removable: true,
                                defaultArea: CustomizableUI.AREA_NAVBAR,
                                localized: false,
                                onCreated: node => {
                                    const { ownerDocument: document } = node;
                                    applyAttr(node, {
                                        id,
                                        label: lprintf("linkgopher"),
                                        tooltiptext: lprintf("one click to pick up links"),
                                        contextmenu: false,
                                        type: "menu"
                                    });

                                    let mp = applyAttr(createEl("menupopup", document), {
                                        id: "LinkGopher-Popup",
                                        class: "LinkGopher-Popup",
                                    });

                                    let mps = $('mainPopupSet', document);
                                    mps ? mps.appendChild(mp) : node.appendChild(mp);

                                    this.buildMenu(mp);

                                    node.addEventListener("mouseover", (event) => {
                                        let win = event.target.ownerGlobal, mp = $("LinkGopher-Popup", win.document);

                                        if (mp)
                                            mp.parentNode.id !== id && $(id, win.document)?.appendChild(mp);
                                        else
                                            return;

                                        if (event.clientX > (win.innerWidth / 2) && event.clientY < (win.innerHeight / 2)) {
                                            mp.setAttribute("position", "after_end");
                                        } else if (event.clientX < (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
                                            mp.setAttribute("position", "before_start");
                                        } else if (event.clientX > (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
                                            mp.setAttribute("position", "before_start");
                                        } else {
                                            mp.removeAttribute("position", "after_end");
                                        }
                                    });

                                    LinkGopher.btn = node;
                                },
                            });
                        } catch (e) { }
                    }
                    if (this.style) removeEl(this.style);
                    this.style = addStyle(css);
                    window.addEventListener("beforeunload", async () => {
                        await this.destroy();
                    });
                },
                buildMenu: async function (mp) {
                    let { document } = mp.ownerGlobal;
                    LinkMenus().forEach(o => {
                        let tag = (Object.keys(o).length && o.type !== "menuseparator") ? "menuitem" : "menuseparator";
                        mp.appendChild(applyAttr(createEl(tag, document), o));
                    })
                },
                onCommand(event) {
                    const { target } = event;
                    const prompt = target.getAttribute("prompt");
                    const text = target.getAttribute("text") || "%u";
                    const exclude = target.getAttribute("exclude");
                    const url = target.getAttribute("url");
                    const where = target.getAttribute("where") || "tab";
                    if (url) {
                        openTrustedLinkIn(url, where, {
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
                copy: function (aText) {
                    Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
                    //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
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
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "LinkGopher",
                        aMsg + "", !!callback, "", callback);
                },
                log: console.log,
                destroy: async function () {
                    CustomizableUI.destroyWidget(id);
                    removeEl(this.style);
                    delete this;
                }
            }
            await window.LinkGopher.init();
        }
    })(
        "LinkGopher-Btn",
        `#LinkGopher-Btn {
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
}`,
        (function () {
            let LANG = {
                'zh-CN': {
                    "linkgopher": "链接提取",
                    "one click to pick up links": "一键提取网页链接",
                    "extract all links": "提取所有链接",
                    "extract all magnet links": "提取所有磁力链接",
                    "extract all ed2k links": "提取所有ed2k链接",
                    "extract by keyword": "根据关键字提取",
                    "extract domain only": "只提取域名",
                    "extract selection only": "只提取选中内容",
                    "about link gopher": "关于 LinkGopher.uc.js"
                },
                'en-US': {
                    "linkgopher": "LinkGopher",
                    "one click to pick up links": "One click to pick up links",
                    "extract all links": "Extract all links",
                    "extract all magnet links": "Extract all magnet links",
                    "extract all ed2k links": "Extract all ed2k links",
                    "extract by keyword": "Extract by keyword",
                    "extract domain only": "Extract domain only",
                    "extract selection only": "Extract selection only",
                    "about link gopher": "About LinkGopher.uc.js"
                },
            }
            let LOCALE;
            try {
                let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
                if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
                    _locales = osPrefs.getRegionalPrefsLocales();
                else
                    _locales = osPrefs.regionalPrefsLocales;
                for (let i = 0; i < _locales.length; i++) {
                    if (LANG.hasOwnProperty(_locales[i])) {
                        LOCALE = _locales[i];
                        break;
                    }
                }
            } catch (e) { }
            return LANG[Object.keys(LANG).includes(LOCALE) ? LOCALE : "en-US"];
        })(),
        (s, d) => /^[#\.\[]:/.test(s.trim()) ? (d || document).querySelector(s) : (d || document).getElementById(s),
        (t, d) => t ? (d || document).createXULElement(t) : null,
        (e, o = {}) => { for (let [k, v] of Object.entries(o)) e.setAttribute(k, typeof v === 'function' ? "(" + v.toString() + ").call(this, event);" : v); return e; },
        s => s && s.parentNode && s.parentNode.removeChild(s),
        (f, ...args) => { let s = f; for (let a of args) s = s.replace(/%[sd]/, a); return s; },
        (css, d) => (d || document).insertBefore((d || document).createProcessingInstruction('xml-stylesheet', 'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'), (d || document).documentElement),
        function (keyword, excludeKeyword) {
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
    )
}