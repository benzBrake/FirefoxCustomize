// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2025.03.11
// @compatibility   Firefox 136
// @charset         UTF-8
// @system          windows
// @license         MIT License
// @include         main
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @thanks          Dumby
// ==/UserScript==
export { ACSTChild, ACSTParent };
// Configurations, implement read from about:config preferences in future
const ACST_COPY_SUCCESS_NOTICE = "Auto Copied!";
const ACST_WAIT_TIME = 0; // Change it to any number as you want
const ACST_BLACK_LIST = ["input", "textarea"]; // disable auto copy when focus on textboxes
const ACST_SHOW_SUCCESS_NOTICE = true; // show notice on webpace when copyed successful
const ACST_COPY_WITHOUT_RELEASE_KEY = false; // when the popup appears you can release the mouse button (work is not perfect, need to set ACST_WAIT_TIME as a reasonable number)
const ACST_COPY_AS_PLAIN_TEXT = false; // copy as plain text
// =================================================================

class ACSTChild extends JSWindowActorChild {
    receiveMessage ({ name, data }) {
        let win = this.contentWindow;
        let actor = this.contentWindow.windowGlobalChild.getActor("ACST");
        switch (name) {
            case "ACST:getSelectedText":
                if (win.document.activeElement) {
                    if (ACST_ifItemTagInBackList(win.document.activeElement)) return;
                }

                let obj = {
                    text: BrowserOrSelectionUtils.getSelectionDetails(win).fullText
                }

                if (obj.text && obj.text.length) {
                    actor.sendAsyncMessage("ACST:setSelectedText", obj);
                    if (data.ACST_SHOW_SUCCESS_NOTICE)
                        ACST_showSuccessInfo(this.contentWindow);
                }
                break;
        }
    }
}
if (!ChromeUtils.domProcessChild.childID) {
    var ACSTParent = class extends JSWindowActorParent {
        receiveMessage ({ name, data }) {
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
    try {
        let esModuleURI = Components.stack.filename;
        ChromeUtils.registerWindowActor("ACST", {
            allFrames: true,
            parent: { esModuleURI },
            messageManagerGroups: ["browsers"],
            child: { esModuleURI, events: { mousedown: { capture: true }, mouseup: { capture: true }, mousemove: { capture: true } } },
            matches: ["*://*/*", "file:///*", "about:*", "view-source:*"],
        });
    } catch (e) {
        console.error(e);
    }
    (function () {
        const ctypes = globalThis.ctypes || ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs").ctypes;
        const { SelectionUtils } = ChromeUtils.importESModule("resource://gre/modules/SelectionUtils.sys.mjs");
        if (window.AutoCopySelectionText) {
            return;
        }
        let user32 = ctypes.open("user32.dll");
        let getKeyState = user32.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
        var LONG_PRESS = false;
        var TIMEOUT_ID = null;
        var START_COPY = false;
        var DBL_NOTICE = false;
        var DBL_CLICK = false;
        window.AutoCopySelectionText = {
            init: function () {
                ["mousedown", "mousemove", "dblclick", "mouseup"].forEach(type => {
                    (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener(type, this, false);
                });
            },
            handleEvent: function (event) {
                if (getKeyState(0x91)) return;
                let that = this;
                const { clearTimeout, setTimeout } = event.target.ownerGlobal;
                switch (event.type) {
                    case 'mousedown':
                        START_COPY = true;
                        if (DBL_NOTICE) {
                            // 双击判定
                            setTimeout(function () {
                                LONG_PRESS = true;
                            }, ACST_WAIT_TIME);
                        }
                        break;
                    case 'mousemove':
                        if (LONG_PRESS) return;
                        if (TIMEOUT_ID) clearTimeout(TIMEOUT_ID);
                        TIMEOUT_ID = setTimeout(function () {
                            // 长按判定
                            LONG_PRESS = true;
                            if (ACST_COPY_WITHOUT_RELEASE_KEY) {
                                // 无需释放左键就复制
                                copyText(content);
                            }
                        }, ACST_WAIT_TIME);
                        break;
                    case 'dblclick':
                    case 'mouseup':
                        if (!START_COPY) return;
                        // 不响应左键事件
                        if (event.button !== 0) return;
                        // copy text on mouse button up
                        if (LONG_PRESS && !ACST_COPY_WITHOUT_RELEASE_KEY) {
                            copyText(content);
                        }
                        START_COPY = false;
                        DBL_CLICK = false;
                        // 限定时间内判定双击
                        DBL_NOTICE = true;
                        setTimeout(() => {
                            DBL_NOTICE = false;
                        }, 150);
                        break;
                }
                LONG_PRESS = false;

                function copyText (content) {
                    if (content) {
                        // 内置页面
                        let info = content.getSelection();
                        // 黑名单不获取选中文本
                        if (info && info.anchorNode && info.anchorNode.activeElement && ACST_ifItemTagInBackList(info.anchorNode.activeElement)) return;
                        let text = SelectionUtils.getSelectionDetails(content).fullText;
                        if (text && text.length) {
                            that.setSelectedText(text);
                            if (ACST_SHOW_SUCCESS_NOTICE)
                                ACST_showSuccessInfo(content);
                        }
                    } else {
                        // 网页
                        let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("ACST");
                        actor.sendAsyncMessage("ACST:getSelectedText", { ACST_SHOW_SUCCESS_NOTICE: ACST_SHOW_SUCCESS_NOTICE });
                    }
                }
            },
            setSelectedText: function (text, tag) {
                if (tag && ACST_BLACK_LIST.includes(tag)) return;
                if (typeof text !== undefined) {
                    if (ACST_COPY_AS_PLAIN_TEXT)
                        this.copyText(text);
                    else
                        goDoCommand('cmd_copy');
                }
            },
            copyText: function (text) {
                Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
            }
        }
        window.AutoCopySelectionText.init();
    })()

    /**
 * 检查是否在黑名单内选中文本
 * @param {HTMLElement} item 
 * @returns 
 */
    function ACST_ifItemTagInBackList (item) {
        if (ACST_BLACK_LIST.includes(item.tagName.toLowerCase())) return true;
        ACST_BLACK_LIST.forEach(tag => {
            if (item.closest(tag)) return true;
        });
        return false;
    }

    /**
     * 显示复制成功通知
     * @param {*} win 
     */
    function ACST_showSuccessInfo (win) {
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
}
