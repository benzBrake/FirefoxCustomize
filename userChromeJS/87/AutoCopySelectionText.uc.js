// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2022.07.16
// @compatibility   Firefox 87
// @charset         UTF-8
// @system          windows
// @license         MIT License
// @include         main
// @shutdown        window.AutoCopySelectionText.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @version         2022.07.16 重写代码，支持热插拔，采用 异步消息，支持 Firefox 内置页面
// @version         2022.07.13 初始化版本
// ==/UserScript==
(function () {
    class AutoCopySelectionText {
        constructor() {
            Components.utils.import("resource://gre/modules/ctypes.jsm");
            let user32 = ctypes.open("user32.dll");
            this.getKeyState = user32.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
            function frameScript() {
                content.acst_Content = {
                    init: function () {
                        addMessageListener("acst_getSelectedText", this);
                        addMessageListener("acst_destroy", this);
                    },
                    receiveMessage: function (message) {
                        switch (message.name) {
                            case 'acst_getSelectedText':
                                let sel = content.getSelection();
                                let data = { text: sel.toString() }
                                sendSyncMessage("acst_selectionData", data);
                                break;
                            case 'acst_destroy':
                                this.destroy();
                                break;
                        }
                    },
                    destroy() {
                        removeMessageListener("acst_getSelectedText", this);
                        removeMessageListener("acst_destroy", this);
                        delete content.acst_Content;
                    }
                }
                content.acst_Content.init();
            }
            let frameScriptURI = 'data:application/javascript,'
                + encodeURIComponent('(' + frameScript.toString() + ')()');
            window.messageManager.loadFrameScript(frameScriptURI, true);
            window.messageManager.addMessageListener("acst_selectionData", this);

            gBrowser.tabpanels.addEventListener("mouseup", this, false);
        }
        trigger(browser) {
            browser || (browser = gBrowser.selectedTab.linkedBrowser);
            browser.messageManager.sendAsyncMessage("acst_getSelectedText");
        }
        receiveMessage(message) {
            switch (message.name) {
                case 'acst_selectionData':
                    if (message.data.text)
                        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(message.data.text);
                    break;
            }
        }
        handleEvent(event) {
            switch (event.type) {
                case 'mouseup':
                    // 鼠标按键释放时读取选中文本
                    if (this.getKeyState(0x91)) return;
                    try {
                        gBrowser.selectedTab.linkedBrowser.messageManager.sendAsyncMessage("acst_getSelectedText");
                    } catch (e) { }
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