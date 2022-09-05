// ==UserScript==
// @name            movableOverflowButton.uc.js
// @description     Make overflow button draggable
// @author          Ryan
// @include         main
// @version         0.1.1
// @compatibility   Firefox 100
// @shutdown        window.movableOverflowButton.destroy()
// @note            0.1.1 修正多窗口报错，无法显示 Overflow Panel
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    if (window.movableOverflowButton) {
        window.movableOverflowButton.destroy();
        delete window.movableOverflowButton;
    }

    window.movableOverflowButton = {
        listener: {
            onCustomizeStart(win) {
                let { styleDisplay: style, sss } = win.movableOverflowButton;
                sss.unregisterSheet(style.url, style.type);
            },
            onCustomizeEnd(win) {
                let { styleDisplay: style, sss } = win.movableOverflowButton;
                sss.loadAndRegisterSheet(style.url, style.type);
            }
        },
        init: function () {
            this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
            this.styleIcon = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
                #movable-overflow-button {
                    list-style-image: url("chrome://global/skin/icons/chevron.svg");
                }
                `)),
                type: this.sss.AGENT_SHEET
            }
            this.styleDisplay = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
                #nav-bar-overflow-button {
                    display: none !important;
                }
                `)),
                type: this.sss.AGENT_SHEET
            }
            this.sss.loadAndRegisterSheet(this.styleIcon.url, this.styleIcon.type);
            this.sss.loadAndRegisterSheet(this.styleDisplay.url, this.styleDisplay.type);
            CustomizableUI.addListener(this.listener);

            if (CustomizableUI.getWidget('movable-overflow-button')) {
                let { node } = CustomizableUI.getWidget('movable-overflow-button').forWindow(window);
                node.addEventListener('mousedown', movableOverflowButton);
                node.addEventListener('keypress', movableOverflowButton);
            } else {
                CustomizableUI.createWidget({
                    id: 'movable-overflow-button',
                    type: "button",
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    onCreated: function (node) {
                        node.addEventListener('mousedown', movableOverflowButton);
                        node.addEventListener('keypress', movableOverflowButton);
                    }
                });
            }
        },
        handleEvent: function (event) {
            if (event.type === "mousedown" && event.button !== 0) return;
            let { target: node } = event;
            let { ownerDocument: document } = node;
            const { overflowable } = document.getElementById('nav-bar');
            overflowable._chevron = node;
            overflowable.show();
        },
        destroy: function () {
            CustomizableUI.removeListener(this.listener);
            this.sss.unregisterSheet(this.styleIcon.url, this.styleIcon.type);
            this.sss.unregisterSheet(this.styleDisplay.url, this.styleDisplay.type);
            CustomizableUI.destroyWidget('movable-overflow-button');
            delete this;
        }
    }

    window.movableOverflowButton.init();
})();