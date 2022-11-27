// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, ding
// @include         main
// @charset         UTF-8
// @version         2022.11.19
// @shutdown        window.BMMultiColumn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @note            fx 108 不完美修复
// @note            修复菜单延迟调整宽度的 BUG
// @note            修复边距问题，支持书签工具栏溢出菜单
// @note            修复有时候无法启用
// @note            适配Firefox57+
// @ignorecache
// ==/UserScript==
(function (css) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;


    if (window.BMMultiColumn) {
        window.BMMultiColumn.destroy();
        delete window.BMMultiColumn;
    }

    window.BMMultiColumn = {
        BUTTON_INITED: false,
        sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
        init() {
            this.style = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
            this.sss.loadAndRegisterSheet(this.style, 2);
            this.TOOLBAR = $("PlacesToolbarItems");
            if (this.TOOLBAR) {
                this.TOOLBAR.addEventListener('popupshowing', this, false);
            }
            this.BMB_POPUP = document.getElementById('BMB_bookmarksPopup')
            if (this.BMB_POPUP) {
                this.BMB_POPUP.addEventListener('click', this)
                this.BMB_POPUP.addEventListener('popupshowing', this)
            }
        },
        destroy() {
            this.sss.unregisterSheet(this.style, 2);
            if (this.TOOLBAR) {
                this.TOOLBAR.querySelectorAll("menupopup").forEach(menupopup => this.resetPopup(menupopup));
                this.TOOLBAR.removeEventListener('popupshowing', this, false);
            }
            if (this.BMB_POPUP) {
                this.BMB_POPUP.querySelectorAll("menupopup").forEach(menupopup => this.resetPopup(menupopup));
                this.BMB_POPUP.removeEventListener('click', this, false);
                this.BMB_POPUP.removeEventListener('popupshowing', this, false);
            }
        },
        handleEvent(event) {
            let menupopup;
            if (event.target.tagName == 'menu' || event.target.tagName == 'toolbarbutton') {
                menupopup = event.target.menupopup;
            } else if (event.target.tagName == 'menupopup') {
                menupopup = event.target;
            } else return;
            this.initPopup(menupopup, event);
        },
        initPopup(menupopup, event) {
            let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part=scrollbox]');
            let inited = false;
            if (scrollbox) {
                inited = true;
                scrollbox.style.minHeight = "21px";
                scrollbox.style.height = "auto";
                scrollbox.style.display = "flex";
                scrollbox.style.flexFlow = "column wrap";
                scrollbox.style.overflow = "-moz-hidden-unscrollable";
                arrowscrollbox.style.maxHeight = "calc(100vh - 129px)";
            }
            menupopup.style.maxWidth = "calc(100vw - 20px)";

            if (inited) {
                scrollbox.style.width = scrollbox.scrollWidth + "px";
                if (event.type == "click") {
                    if (!(arrowscrollbox.clientWidth == scrollbox.scrollWidth)) {
                        arrowscrollbox.width = scrollbox.scrollWidth;
                    }
                }
                let lastmenu = menupopup.lastChild;
                while (lastmenu) {
                    if (lastmenu.scrollWidth >= 90) break;
                    lastmenu = lastmenu.previousSibling;
                }

                if (lastmenu && lastmenu.scrollWidth >= 90) {
                    let pos1 = lastmenu.x - 0 + lastmenu.clientWidth;
                    let pos2 = scrollbox.x - 0 + arrowscrollbox.clientWidth;
                    if (pos2 - pos1 > 30) {
                        arrowscrollbox.width = "";
                        arrowscrollbox.width = scrollbox.scrollWidth;
                    }
                }
            }
        },
        resetPopup(menupopup) {
            let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
            if (!arrowscrollbox) return;
            arrowscrollbox.style.maxHeight = "";
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part=scrollbox]');

            if (!scrollbox) return;
            scrollbox.style.minHeight = "";
            scrollbox.style.height = "";
            scrollbox.style.display = "";
            scrollbox.style.flexFlow = "";
            scrollbox.style.overflow = "";
            scrollbox.style.maxHeight = "";
            scrollbox.style.width = "";

            let menuitem = menupopup.lastChild;
            while (menuitem) {
                menuitem.style.width = "";
                menuitem = menuitem.previousSibling;
            }
        }
    }


    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }

    if (typeof _ucUtils !== 'undefined') {
        _ucUtils.startupFinished()
            .then(() => {
                window.BMMultiColumn.init();
            });
    } else {
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
    }
})(`
#PlacesToolbarItems menupopup {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 129px);
  }
#PlacesToolbarItems menupopup > :is(menuitem, menuseparator) {
    width: 240px;
}
`)