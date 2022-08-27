// ==UserScript==
// @name            movableOverflowButton.uc.js
// @description     Make overflow button draggable
// @author          Ryan
// @include         main
// @version         0.1.0
// @compatibility   Firefox 100
// @shutdown        window.movableOverflowButton.destroy()
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    if (window.movableOverflowButton) {
        window.movableOverflowButton.destroy();
    }

    window.movableOverflowButton = {
        widgetId: 'movable-overflow-button',
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
            CustomizableUI.createWidget({
                id: this.widgetId,
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                onCreated: function (node) {
                    let doc = node.ownerDocument;
                    let originalMenu = doc.getElementById("nav-bar").overflowable;
                    ['label', 'tooltiptext'].forEach(attr => {
                        node.setAttribute(attr, doc.getElementById('nav-bar-overflow-button').getAttribute(attr));
                    })

                    // helper function to not repeat so much code
                    function setEvent(event) {
                        node.addEventListener(event, function () {
                            originalMenu._chevron = node;
                        }, { "capture": true });
                        node.addEventListener(event, originalMenu);
                    }

                    setEvent("mousedown");
                    setEvent("keypress");
                    //setEvent("dragend");
                    //setEvent("dragover");
                }
            });
        },
        destroy: function () {
            CustomizableUI.removeListener(this.listener);
            this.sss.unregisterSheet(this.styleIcon.url, this.styleIcon.type);
            this.sss.unregisterSheet(this.styleDisplay.url, this.styleDisplay.type);
            CustomizableUI.destroyWidget(this.widgetId);
        }
    }

    window.movableOverflowButton.init();
})();