// ==UserScript==
// @name            AutoCopySelectionText.uc.mjs
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2026.04.07
// @compatibility   Firefox 136
// @charset         UTF-8
// @system          windows
// @license         MIT License
// @include         main
// @actor           ACST
// @actor:allframes true
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @thanks          Dumby
// @note            20260407 Move actor registration to loader, add alice0775 legacy loader adapter support, and switch success notice to a selection-near animation
// ==/UserScript==
// Configurations, implement read from about:config preferences in future
const ACST_COPY_SUCCESS_NOTICE = "Auto Copied!";
const ACST_WAIT_TIME = 0; // Change it to any number as you want
const ACST_BLACK_LIST = ["input", "textarea"]; // disable auto copy when focus on textboxes
const ACST_SHOW_SUCCESS_NOTICE = true; // show notice on webpace when copyed successful
const ACST_COPY_WITHOUT_RELEASE_KEY = false; // when the popup appears you can release the mouse button (work is not perfect, need to set ACST_WAIT_TIME as a reasonable number)
const ACST_COPY_AS_PLAIN_TEXT = false; // copy as plain text
// =================================================================

const ACSTSelectionUtils = (() => {
    if (globalThis.SelectionUtils?.getSelectionDetails) {
        return globalThis.SelectionUtils;
    }
    if (globalThis.BrowserOrSelectionUtils?.getSelectionDetails) {
        return globalThis.BrowserOrSelectionUtils;
    }
    try {
        return ChromeUtils.importESModule("resource://gre/modules/SelectionUtils.sys.mjs").SelectionUtils;
    } catch (ex) { }
    try {
        return ChromeUtils.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
    } catch (ex) { }
    throw new Error("AutoCopySelectionText: SelectionUtils module is unavailable");
})();

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
                    text: ACSTSelectionUtils.getSelectionDetails(win).fullText
                }

                if (obj.text && obj.text.length) {
                    actor.sendAsyncMessage("ACST:setSelectedText", obj);
                }
                break;
        }
    }
}
class ACSTParent extends JSWindowActorParent {
    receiveMessage ({ name, data }) {
        // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
        let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
        let browser = windowGlobal.rootFrameLoader.ownerElement;
        let win = browser.ownerGlobal;
        switch (name) {
            case "ACST:setSelectedText":
                win.AutoCopySelectionText?.setSelectedText(data.text, data.tag || "");
                break;
        }
    }
}

export { ACSTChild, ACSTParent, ACSTChild as ActorChild, ACSTParent as ActorParent };

(function () {
    if (typeof window === "undefined" || window !== window.top) {
        return;
    }

    const ctypes = globalThis.ctypes || ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs").ctypes;

    if (window.AutoCopySelectionText) {
        return;
    }

    let user32 = ctypes.open("user32.dll");
    let getKeyState = user32.declare("GetKeyState", ctypes.winapi_abi, ctypes.bool, ctypes.int);
    let LONG_PRESS = false;
    let TIMEOUT_ID = null;
    let START_COPY = false;
    let DBL_NOTICE = false;

    window.AutoCopySelectionText = {
        init: function () {
            ["mousedown", "mousemove", "dblclick", "mouseup"].forEach(type => {
                (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener(type, this, false);
            });
            this.ensureNoticeUI();
        },
        ensureNoticeUI: function () {
            if (!document.getElementById("acst-chrome-notice-style")) {
                const style = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
                style.id = "acst-chrome-notice-style";
                style.textContent = `
                    #acst-chrome-notice {
                        position: fixed;
                        left: 0;
                        top: 0;
                        z-index: 2147483647;
                        pointer-events: none;
                        padding: 6px 14px;
                        border-radius: 999px;
                        border: 1px solid rgb(255 255 255 / 0.36);
                        background: linear-gradient(180deg, rgb(34 197 94 / 0.96), rgb(22 163 74 / 0.96));
                        color: white;
                        box-shadow: 0 10px 30px rgb(22 163 74 / 0.28), 0 3px 12px rgb(0 0 0 / 0.18);
                        font: 600 12px/1.4 system-ui;
                        letter-spacing: 0.02em;
                        white-space: nowrap;
                        opacity: 0;
                        transform: translate(-50%, calc(-100% - 14px)) scale(0.92);
                        transition: opacity 0.18s ease, transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
                    }
                    #acst-chrome-notice[data-state="show"] {
                        opacity: 1;
                        transform: translate(-50%, calc(-100% - 20px)) scale(1);
                    }
                    #acst-chrome-notice[data-state="hide"] {
                        opacity: 0;
                        transform: translate(-50%, calc(-100% - 28px)) scale(0.96);
                    }
                `;
                document.documentElement.appendChild(style);
            }
            if (!document.getElementById("acst-chrome-notice")) {
                const notice = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
                notice.id = "acst-chrome-notice";
                notice.textContent = ACST_COPY_SUCCESS_NOTICE;
                const host = document.getElementById("mainPopupSet") || document.documentElement;
                host.appendChild(notice);
            }
        },
        recordPointer: function (event) {
            this._lastPointer = {
                x: event.screenX - window.mozInnerScreenX,
                y: event.screenY - window.mozInnerScreenY,
            };
        },
        showSuccessInfo: function () {
            const notice = document.getElementById("acst-chrome-notice");
            if (!notice) {
                return;
            }
            const x = this._lastPointer?.x ?? window.innerWidth - 120;
            const y = this._lastPointer?.y ?? 72;
            notice.textContent = ACST_COPY_SUCCESS_NOTICE;
            notice.style.left = `${Math.min(Math.max(x, 72), window.innerWidth - 72)}px`;
            notice.style.top = `${Math.min(Math.max(y, 48), window.innerHeight - 24)}px`;
            notice.dataset.state = "";
            void notice.offsetWidth;
            notice.dataset.state = "show";
            clearTimeout(this._noticeTimer);
            this._noticeTimer = window.setTimeout(() => {
                notice.dataset.state = "hide";
            }, 900);
        },
        handleEvent: function (event) {
            if (getKeyState(0x91)) {
                return;
            }

            let that = this;
            const { clearTimeout, setTimeout } = event.target.ownerGlobal;

            switch (event.type) {
                case "mousedown":
                    this.recordPointer(event);
                    START_COPY = true;
                    if (DBL_NOTICE) {
                        // 双击判定
                        setTimeout(function () {
                            LONG_PRESS = true;
                        }, ACST_WAIT_TIME);
                    }
                    break;
                case "mousemove":
                    if (LONG_PRESS) {
                        return;
                    }
                    if (TIMEOUT_ID) {
                        clearTimeout(TIMEOUT_ID);
                    }
                    TIMEOUT_ID = setTimeout(function () {
                        // 长按判定
                        LONG_PRESS = true;
                        if (ACST_COPY_WITHOUT_RELEASE_KEY) {
                            // 无需释放左键就复制
                            copyText(content);
                        }
                    }, ACST_WAIT_TIME);
                    break;
                case "dblclick":
                case "mouseup":
                    this.recordPointer(event);
                    if (!START_COPY) {
                        return;
                    }
                    // 不响应左键事件
                    if (event.button !== 0) {
                        return;
                    }
                    // copy text on mouse button up
                    if (LONG_PRESS && !ACST_COPY_WITHOUT_RELEASE_KEY) {
                        copyText(content);
                    }
                    START_COPY = false;
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
                    let activeElement = info?.anchorNode?.ownerDocument?.activeElement;
                    // 黑名单不获取选中文本
                    if (activeElement && ACST_ifItemTagInBackList(activeElement)) {
                        return;
                    }
                    let text = ACSTSelectionUtils.getSelectionDetails(content).fullText;
                    if (text && text.length) {
                        that.setSelectedText(text);
                    }
                } else {
                    // 网页
                    let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("ACST");
                    actor.sendAsyncMessage("ACST:getSelectedText", { ACST_SHOW_SUCCESS_NOTICE });
                }
            }
        },
        setSelectedText: function (text, tag) {
            if (tag && ACST_BLACK_LIST.includes(tag)) {
                return;
            }
            if (typeof text !== "undefined") {
                if (ACST_COPY_AS_PLAIN_TEXT) {
                    this.copyText(text);
                } else {
                    goDoCommand("cmd_copy");
                }
                if (ACST_SHOW_SUCCESS_NOTICE) {
                    this.showSuccessInfo();
                }
            }
        },
        copyText: function (text) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
        }
    };
    window.AutoCopySelectionText.init();
})();

/**
 * 检查是否在黑名单内选中文本
 * @param {HTMLElement} item
 * @returns {boolean}
 */
function ACST_ifItemTagInBackList (item) {
    const tagName = item?.tagName?.toLowerCase();
    if (tagName && ACST_BLACK_LIST.includes(tagName)) {
        return true;
    }
    return ACST_BLACK_LIST.some(tag => item?.closest?.(tag));
}
