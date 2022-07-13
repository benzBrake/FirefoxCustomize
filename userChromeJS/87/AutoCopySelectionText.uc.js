
// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2022.07.13
// @compatibility   Firefox 87
// @include         main
// @system          windows
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// ==/UserScript==
location.href.startsWith('chrome://browser/content/browser.x') && setTimeout(() => {
    Components.utils.import("resource://gre/modules/ctypes.jsm");
    var lib = ctypes.open("user32.dll");
    const getKeyState = lib.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
    gBrowser.tabpanels.addEventListener("mouseup", function () {
        try {
            if (getKeyState(0x91)) return;
            // 0x91 是 ScrLk 的按键码，ScrLk 灯亮起时不复制
            gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                if (r.selectedText) {
                    Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(r.selectedText);
                }
            })
        } catch (e) { }
    }, false);
}, 1000);