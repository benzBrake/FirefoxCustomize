// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, ding
// @include         main
// @charset         UTF-8
// @version         2022.09.12
// @compatibility   Firefox 102
// @shutdown        window.BMMultiColumn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @note            修复菜单延迟调整宽度的 BUG
// @note            修复边距问题，支持书签工具栏溢出菜单
// @note            修复有时候无法启用
// @note            适配Firefox57+
// ==/UserScript==
(function () {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;


    if (window.BMMultiColumn) {
        window.BMMultiColumn.destroy();
        delete window.BMMultiColumn;
    }

    window.BMMultiColumn = {
        BUTTON_INITED: false,
        init() {
            this.TOOLBAR = $("PlacesToolbar");
            if (this.TOOLBAR) {
                this.TOOLBAR.querySelectorAll("menupopup").forEach(menupopup => this.initPopup(menupopup));
                this.TOOLBAR.addEventListener('popupshowing', this, false);
            }
            this.BMB_POPUP = document.getElementById('BMB_bookmarksPopup')
            if (this.BMB_POPUP) {
                this.BMB_POPUP.addEventListener('popupshowing', this)
            }
        },
        destroy() {
            if (this.TOOLBAR) {
                this.TOOLBAR.querySelectorAll("menupopup").forEach(menupopup => this.resetPopup(menupopup));
                this.TOOLBAR.removeEventListener('popupshowing', this, false);
            }
            if (this.BMB_POPUP) {
                this.BMB_POPUP.querySelectorAll("menupopup").forEach(menupopup => this.resetPopup(menupopup));
                this.BMB_POPUP.removeEventListener('popupshowing', this, false);
            }
        },
        handleEvent(event) {
            let { target: menupopup, type } = event;
            switch (type) {
                case 'popupshowing':
                    if (menupopup.id === "BMB_bookmarksPopup") return;
                    this.initPopup(menupopup);
                    break;
                case 'popuphiding':
                    break;
                default:
                    break;
            }
        },
        initPopup(menupopup) {
            if (!menupopup.firstChild) return;
            let scrollbox = menupopup._scrollBox;
            let firstMenu = menupopup.querySelectorAll('.bookmark-item')[0];
            let box = firstMenu.parentElement._scrollBox.scrollbox;
            let inited = false;

            if (box) {
                inited = true;
                box.style.minHeight = "21px";
                box.style.height = "auto";
                box.style.display = "inline-flex";
                box.style.flexFlow = "column wrap";
                box.style.overflow = "-moz-hidden-unscrollable";
                box.style.maxHeight = "calc(100vh - 129px)";
                scrollbox.style.maxHeight = "calc(100vh - 129px)";
            }
            menupopup.style.maxWidth = "calc(100vw - 20px)";

            if (inited) {
                let menuitem = menupopup.lastChild;
                while (menuitem) {
                    menuitem.style.width = "240px";
                    // menuitem.style.minWidth = "100px";
                    // menuitem.style.maxWidth = "300px";
                    menuitem = menuitem.previousSibling;
                }
                if (!(scrollbox.width == box.scrollWidth)) {
                    let firstItem = menupopup.querySelector('menuitem');
                    let offset = 0;
                    let BMB = $('BMB_bookmarksPopup', menupopup.ownerDocument)
                    if (BMB && BMB.contains(menupopup) && firstItem) {
                        offset = offsetX(firstItem);
                    }
                    scrollbox.width = box.scrollWidth - offset;
                }
            }
        },
        resetPopup(menupopup) {
            if (!menupopup.firstChild) return;
            let scrollbox = menupopup._scrollBox;
            let firstMenu = menupopup.querySelectorAll('.bookmark-item')[0];
            let box = firstMenu.parentElement._scrollBox.scrollbox;

            if (box) {
                box.style.minHeight = "";
                box.style.height = "";
                box.style.display = "";
                box.style.flexFlow = "";
                box.style.overflow = "";
                box.style.maxHeight = "";
                scrollbox.style.maxHeight = "";
            }

            let menuitem = menupopup.lastChild;
            while (menuitem) {
                menuitem.style.width = "";
                menuitem = menuitem.previousSibling;
            }

            scrollbox.width = "";
        }
    }


    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }

    function offsetX(elm) {
        var elmMargin, elmPadding = 0;
        elmMargin = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-inline-start')) + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-right'));
        // elmPadding = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-inline-end')) + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-inline-end'));
        return elmMargin + elmPadding;
    }

    if (gBrowserInit.delayedStartupFinished) window.BMMultiColumn.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.BMMultiColumn.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})()