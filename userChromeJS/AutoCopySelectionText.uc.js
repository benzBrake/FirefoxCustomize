// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2023.02.01
// @compatibility   Firefox 70
// @charset         UTF-8
// @system          windows
// @license         MIT License
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @version         2023.02.01 framescript 更换为 JSActor，增加复制成功通知
// @version         2022.11.13 修复移动鼠标即复制
// @version         2022.10.11 增加文本框开关
// @version         2022.07.28 网页支持文本框
// @version         2022.07.18 支持长按延时
// @version         2022.07.16 重写代码，支持热插拔，采用 异步消息，支持 Firefox 内置页面
// @version         2022.07.13 初始化版本
// ==/UserScript==

const ACST_COPY_SUCCESS_NOTICE = "Auto Copied!";
if (typeof window === "undefined" || globalThis !== window) {
    let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
    try {
        if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
            BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
        }
    } catch (e) { }

    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["ACSTParent"];
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
            ChromeUtils.registerWindowActor("ACST", actorParams);
            this.add
        } catch (e) { console.error(e); }

        this.ACSTParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
                let browser = windowGlobal.rootFrameLoader.ownerElement;
                let win = browser.ownerGlobal;
                switch (name) {
                    case "ACST:setSelectedText":
                        win.AutoCopySelectionText.setSelectedText(data.text, data.tag || "");
                        break;
                }
            }
        }
    } else {
        this.EXPORTED_SYMBOLS = ["ACSTChild"];
        this.ACSTChild = class extends JSWindowActorChild {
            receiveMessage({ name, data }) {
                let win = this.contentWindow;
                let actor = this.contentWindow.windowGlobalChild.getActor("ACST");
                switch (name) {
                    case "ACST:getConfiguration":
                        this.config = data;
                        break;
                    case "ACST:getSelectedText":
                        let obj = {
                            text: BrowserOrSelectionUtils.getSelectionDetails(win).fullText
                        }

                        if (win.document.activeElement) {
                            obj.tag = win.document.activeElement.tagName.toLowerCase();
                        }

                        if (obj.text) {
                            actor.sendAsyncMessage("ACST:setSelectedText", obj);
                            if (data.SHOW_SUCCESS_NOTICE)
                                ACST_showSuccessInfo(this.contentWindow);
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
            if (!resourceHandler.hasSubstitution("acst-ucjs")) {
                resourceHandler.setSubstitution("acst-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://acst-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        }
    } catch (e) { console.error(e); }
    (function () {
        Cu.import("resource://gre/modules/ctypes.jsm");
        if (window.AutoCopySelectionText) {
            return;
        }
        // Configurations, implement read from about:config preferences in future
        const WAIT_TIME = 0; // Change it to any number as you want
        const BLACK_TAG_LIST = ["input", "textarea"]; // disable auto copy when focus on textboxes
        const SHOW_SUCCESS_NOTICE = true; // show notice on webpace when copyed successful

        // =========================================
        let user32 = ctypes.open("user32.dll");
        let getKeyState = user32.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
        let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
        try {
            if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
                BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
            }
        } catch (e) { }
        var LONG_PRESS = false;
        var TIMEOUT_ID = null;
        window.AutoCopySelectionText = {
            config: {
                BLACK_TAG_LIST: BLACK_TAG_LIST
            },
            init: function () {
                ["mousemove", "mouseup"].forEach(type => {
                    (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener(type, this, false);
                });
            },
            handleEvent: function (event) {
                if (getKeyState(0x91)) return;
                const { clearTimeout, setTimeout } = event.target.ownerGlobal;
                if (TIMEOUT_ID)
                    clearTimeout(TIMEOUT_ID);
                switch (event.type) {
                    case 'mousemove':
                        TIMEOUT_ID = setTimeout(function () {
                            LONG_PRESS = true;
                        }, WAIT_TIME);
                        break;
                    case 'mouseup':
                        if (event.button !== 0) return;
                        // copy text on mouse button up
                        if (LONG_PRESS) {
                            // get selected text
                            if (content) {
                                // 内置页面
                                let info = content.getSelection();
                                // 黑名单不获取选中文本
                                if (info && info.anchorNode && info.anchorNode.activeElement && BLACK_TAG_LIST.includes(info.anchorNode.activeElement.localName)) return;
                                let text = BrowserOrSelectionUtils.getSelectionDetails(content).fullText;
                                if (text && text.length) {
                                    this.setSelectedText();
                                    if (SHOW_SUCCESS_NOTICE)
                                        ACST_showSuccessInfo(content);
                                }
                            } else {
                                // 网页
                                let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("ACST");
                                actor.sendAsyncMessage("ACST:getSelectedText", { SHOW_SUCCESS_NOTICE: SHOW_SUCCESS_NOTICE });
                            }
                        }
                        break;
                }
                LONG_PRESS = false;
            },
            setSelectedText: function (text, tag) {
                if (tag && BLACK_TAG_LIST.includes(tag)) return;
                if (typeof text !== undefined) {
                    this.copyText(text);
                }
            },
            copyText: function (text) {
                Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
            }
        }
        window.AutoCopySelectionText.init();
    })()
}

/**
* 显示复制成功通知
*/
function ACST_showSuccessInfo(win) {
    let { document } = win;
    let main = document.querySelector("body") || document.documentElement;
    let wrapper = document.querySelector("#acst-success-info-wrapper");
    if (!wrapper) {
        let wEl = document.createElement("div");
        wEl.setAttribute("id", "acst-success-info-wrapper");
        wEl.setAttribute("style", "z-index: 9999999; position: fixed; top: 20px; right: 20px; display: none; pointer-events:none; transition:all .2s")
        wrapper = main.appendChild(wEl);
        wrapper.addEventListener("DOMSubtreeModified", function (event) {
            let target = event.target
            if (target.childNodes.length) {
                target.style.display = "block";
            } else {
                target.style.display = "none";
            }
        });
    }
    let div = document.createElement("div");
    div.innerText = ACST_COPY_SUCCESS_NOTICE;
    div.setAttribute("style", "pointer-events: initial; cursor: pointer; position: relative; opacity: 1; transition:all .2s; margin-top: 10px; padding: 10px 20px; color: white; background-color: #4ade80; border-radius: 5px;");
    div = wrapper.appendChild(div);
    div.addEventListener("click", (event) => {
        event.target.parentNode.removeChild(event.target);
    });
    win.setTimeout(() => {
        div.style.opacity = 0;
        win.setTimeout(() => {
            div.parentNode.removeChild(div);
        }, 200);
    }, 2000);
}
