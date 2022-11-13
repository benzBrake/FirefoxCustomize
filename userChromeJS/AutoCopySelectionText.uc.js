// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2022.11.13
// @compatibility   Firefox 57
// @charset         UTF-8
// @system          windows
// @license         MIT License
// @include         main
// @shutdown        window.AutoCopySelectionText.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @version         2022.11.13 修复移动鼠标即复制
// @version         2022.10.11 增加文本框开关
// @version         2022.07.28 网页支持文本框
// @version         2022.07.18 支持长按延时
// @version         2022.07.16 重写代码，支持热插拔，采用 异步消息，支持 Firefox 内置页面
// @version         2022.07.13 初始化版本
// ==/UserScript==
(function () {
    class AutoCopySelectionText {
        constructor() {
            Components.utils.import("resource://gre/modules/ctypes.jsm");
            // will be transfered to control by toolbar button
            let user32 = ctypes.open("user32.dll");
            this.getKeyState = user32.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
            function frameScript() {
                const Services = Components.utils.import("resource://gre/modules/Services.jsm").Services;
                let BrowserOrSelectionUtils = Components.utils.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
                try {
                    if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
                        BrowserOrSelectionUtils = Components.utils.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
                    }
                } catch (e) { }

                // implement read from about:config preferences in future
                var WAIT_TIME = 0; // Change it to any number as you want
                var DISABLE_IN_TEXTBOX = true; // disable auto copy when focus on textboxes

                // Do not modify below ------------------------------------------
                var LONG_PRESS = false;
                var TIMEOUT_ID = null;

                var isOnTextInput = function (elem) {
                    return elem instanceof HTMLTextAreaElement ||
                        (elem instanceof HTMLInputElement && elem.mozIsTextField(true));
                };
                function handleEvent(event) {
                    let win = event.target.ownerGlobal;
                    if (event.button !== 0) return; // only trigger when left button up
                    if (TIMEOUT_ID)
                        content.clearTimeout(TIMEOUT_ID);

                    switch (event.type) {
                        case 'mousemove':
                            TIMEOUT_ID = content.setTimeout(function () {
                                LONG_PRESS = true;
                            }, WAIT_TIME);
                            break;
                        case 'mouseup':
                            // copy text on mouse button up
                            if (LONG_PRESS) {
                                let focusedElement =
                                    Services.focus.focusedElement ||
                                    (event.originalTarget.ownerDocument ? event.originalTarget.ownerDocument.activeElement : null);

                                if (focusedElement && DISABLE_IN_TEXTBOX && isOnTextInput(focusedElement)) return;
                                let selctionDetails = BrowserOrSelectionUtils.getSelectionDetails(win);
                                if (!selctionDetails.fullText) return;
                                let data = { text: selctionDetails.fullText }
                                sendSyncMessage("acst_selectionData", data);
                            }
                            break;
                    }
                    LONG_PRESS = false;
                }

                ["mousemove", "mouseup"].forEach((t) => addEventListener(t, handleEvent, false));

                function receiveMessage(message) {
                    switch (message.name) {
                        case 'acst_destroy':
                            ["mousemove", "mouseup"].forEach((t) => removeEventListener(t, handleEvent, false));
                            removeMessageListener("acst_destroy", receiveMessage);
                            handleEvent = null;
                            receiveMessage = null;
                            break;
                    }
                }
                addMessageListener("acst_destroy", receiveMessage);
            }
            let frameScriptURI = 'data:application/javascript,'
                + encodeURIComponent('(' + frameScript.toString() + ')()');
            window.messageManager.loadFrameScript(frameScriptURI, true);
            window.messageManager.addMessageListener("acst_selectionData", this);
        }
        receiveMessage({ name, data }) {
            switch (name) {
                case 'acst_selectionData':
                    if (this.getKeyState(0x91)) return;
                    if (data.text)
                        Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(data.text);
                    break;
            }
        }
        destroy() {
            window.messageManager.broadcastAsyncMessage("acst_destroy");
            window.messageManager.removeMessageListener("acst_selectionData", this);
            delete window.AutoCopySelectionText;
        }
    }

    window.AutoCopySelectionText = new AutoCopySelectionText();
})()