// ==UserScript==
// @name            movableOverflowButton.uc.js
// @description     Make overflow button draggable
// @author          Ryan
// @include         main
// @version         0.1.2
// @compatibility   Firefox 100
// @shutdown        window.movableOverflowButton.destroy()
// @note            0.1.2 修正新窗口不能定制
// @note            0.1.1 修正多窗口报错，无法显示 Overflow Panel
// @onlyonce
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    if (window.movableOverflowButton) {
        window.movableOverflowButton.destroy();
    }

    window.movableOverflowButton = {
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        STYLE_ICON: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            #movable-overflow-button {
                list-style-image: url("chrome://global/skin/icons/chevron.svg");
            }
            `)),
            type: 0
        },
        STYLE_DISPLAY: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            #nav-bar-overflow-button {
                display: none !important;
            }
            `)),
            type: 0
        },
        listener: {
            windows,
            onCustomizeStart(win) {
                this.windows(function (doc, win, location) {
                    win.dispatchEvent(new CustomEvent("OriginalOverflowButtonShow"));
                })
            },
            onCustomizeEnd(win) {
                this.windows(function (doc, win, location) {
                    win.dispatchEvent(new CustomEvent("OriginalOverflowButtonHide"));
                })
            }
        },
        init: function () {
            this.sss.loadAndRegisterSheet(this.STYLE_ICON.url, this.STYLE_ICON.type);
            this.sss.loadAndRegisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
            CustomizableUI.addListener(this.listener);
            CustomizableUI.createWidget({
                id: 'movable-overflow-button',
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                onCreated: function (node) {
                    node.addEventListener('mousedown', this);
                    node.addEventListener('keypress', this);
                    let pNode = node.ownerDocument.getElementById('nav-bar-overflow-button');
                    ['label', 'tooltiptext'].forEach(attr => node.setAttribute(attr, pNode.getAttribute(attr)));
                }
            });
            window.addEventListener('OriginalOverflowButtonShow', this);
            window.addEventListener('OriginalOverflowButtonHide', this);
        },
        handleEvent: function (event) {
            if (event.type === "mousedown" && event.button !== 0) return;
            switch (event.type) {
                case 'mousedown':
                case 'keypress':
                    let { target: node } = event;
                    let { ownerDocument: document } = node;
                    const { overflowable } = document.getElementById('nav-bar');
                    overflowable._chevron = node;
                    overflowable.show();
                    break;
                case 'OriginalOverflowButtonShow':
                    this.sss.unregisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
                    break;
                case 'OriginalOverflowButtonHide':
                    this.sss.loadAndRegisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
                    break;
            }
        },
        destroy: function () {
            CustomizableUI.removeListener(this.listener);
            window.removeEventListener('OriginalOverflowButtonShow', this);
            window.removeEventListener('OriginalOverflowButtonHide', this);
            this.sss.unregisterSheet(this.STYLE_ICON.url, this.STYLE_ICON.type);
            this.sss.unregisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
            CustomizableUI.destroyWidget('movable-overflow-button');
            delete this;
        }
    }

    function windows(fun) {
        let windows = Services.wm.getEnumerator('navigator:browser');
        while (windows.hasMoreElements()) {
            let win = windows.getNext();
            if (!win._uc)
                continue;
            let { document, location } = win;
            if (fun(document, win, location))
                break;
        }
    }

    window.movableOverflowButton.init();
})();