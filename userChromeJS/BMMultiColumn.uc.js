// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, ding
// @include         main
// @charset         UTF-8
// @version         2022.08.08
// @shutdown        window.BMMultiColumn.destroy();
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
        init: function () {
            this.TOOLBAR = $("PersonalToolbar");
            this.BUTTON = CustomizableUI.getWidget("bookmarks-menu-button")?.forWindow(window)?.node;
            if (this.TOOLBAR) {
                $("PlacesToolbarItems").addEventListener('popupshowing', this, false);
                $("PlacesToolbarItems").addEventListener('popuphiding', this, false);
            }
            if (this.BUTTON) {
                this.BUTTON.addEventListener('click', this, { once: true });
            }
        },
        destroy: function () {
            if (this.TOOLBAR) {
                $("PlacesToolbarItems").removeEventListener('popupshowing', this, false);
                $("PlacesToolbarItems").removeEventListener('popuphiding', this, false);
            }
            if (this.BMB_POPUP && this.BMB_POPUP.childNodes) {
                this.BMB_POPUP.childNodes.forEach(element => {
                    if (element.localName === "menu") {
                        let popup = element.lastChild;
                        if (popup) {
                            popup.removeEventListener('popupshowing', this, false);
                            popup.removeEventListener('popuphiding', this, false);
                        }
                    }
                });
            }
        },
        handleEvent: function (event) {
            let { target, type } = event;
            switch (type) {
                case 'popupshowing':
                    let menupopup = target;
                    if (this.TOOLBAR || this.BMB_POPUP) {
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
                                var leftFix = parseInt(getComputedStyle(menupopup).paddingInlineStart);
                                var rightFix = parseInt(getComputedStyle(menupopup).paddingInlineEnd);
                                var firstItem = menupopup.querySelector('menuitem');
                                var columns = 0;
                                if (firstItem) {
                                    columns = parseInt(box.scrollWidth / parseInt(getComputedStyle(firstItem).width))
                                }
                                scrollbox.width = box.scrollWidth + (columns || 1) * (leftFix || 0 + rightFix || 0);
                            }
                        }
                    }
                    break;
                case 'popuphiding':
                    if (this.TOOLBAR || this.BMB_POPUP) {
                        let menupopup = target;
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
                    break;
                case 'click':
                    if (target.id === "bookmarks-menu-button") {
                        this.BMB_POPUP = $("BMB_bookmarksPopup");
                        if (this.BMB_POPUP && this.BMB_POPUP.childNodes) {
                            this.BMB_POPUP.childNodes.forEach(element => {
                                if (element.localName === "menu") {
                                    let popup = element.lastChild;
                                    if (popup) {
                                        popup.addEventListener('popupshowing', this, false);
                                        popup.addEventListener('popuphiding', this, false);
                                    }
                                }
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
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