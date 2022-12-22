// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, ding
// @include         main
// @charset         UTF-8
// @version         2022.12.22
// @shutdown        window.BMMultiColumn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @notes           2022.12.22 融合 bookmarksmenu_scrollbar.uc.js，修复没超过最大宽度也会显示横向滚动条的 bug，支持主菜单的书签菜单
// @note            2022.12.17 修复宽度异常，书签栏太多的话无法横向滚动，需要搭配 bookmarksmenu_scrollbar.uc.js 使用
// @note            2022.11.19 fx 108 不完美修复
// @note            2022.09.02 修复菜单延迟调整宽度的 BUG
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
        menupopup: ["historyMenuPopup",
            "bookmarksMenuPopup",
            'PlacesToolbar',
            'BMB_bookmarksPopup'],
        timer: [],
        count: [],
        sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
        init: function () {
            this.style = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
            this.sss.loadAndRegisterSheet(this.style, 2);
            window.removeEventListener("load", this, false);
            window.addEventListener('unload', this, false);
            window.addEventListener("aftercustomization", this, false);
            this.delayedStartup();
        },
        delayedStartup: function () {
            //wait till construction of bookmarksBarContent is completed.
            for (var i = 0; i < this.menupopup.length; i++) {
                this.count[i] = 0;
                this.timer[i] = setInterval(function (self, i) {
                    if (++self.count[i] > 50 || document.getElementById(self.menupopup[i])) {
                        clearInterval(self.timer[i]);
                        var menupopup = document.getElementById(self.menupopup[i]);
                        if (menupopup) {
                            menupopup.addEventListener('popupshowing', self, false);
                        }
                    }
                }, 250, this, i);
            }
        },
        uninit: function () {
            for (var i = 0; i < this.menupopup.length; i++) {
                this.count[i] = 0;
                this.timer[i] = setInterval(function (self, i) {
                    if (++self.count[i] > 50 || document.getElementById(self.menupopup[i])) {
                        clearInterval(self.timer[i]);
                        var menupopup = document.getElementById(self.menupopup[i]);
                        self.resetPopup(menupopup);
                        if (menupopup) {
                            menupopup.removeEventListener('popupshowing', self, false);
                        }
                    }
                }, 250, this, i);
            }
        },
        destroy() {
            window.removeEventListener('unload', this, false);
            window.removeEventListener("aftercustomization", this, false);
            this.uninit();
            this.sss.unregisterSheet(this.style, 2);
        },
        handleEvent(event) {
            switch (event.type) {
                case 'popupshowing':
                    let menupopup;
                    if (event.target.tagName == 'menu' || event.target.tagName == 'toolbarbutton') {
                        menupopup = event.target.menupopup;
                    } else if (event.target.tagName == 'menupopup') {
                        menupopup = event.target;
                    } else return;
                    this.initPopup(menupopup, event);
                    break;
                case 'aftercustomization':
                    setTimeout(function (self) { self.delayedStartup(self); }, 0, this);
                    break;
                case 'unload':
                    this.destroy();
                    break;
            }
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
                scrollbox.style.width = "unset";
                arrowscrollbox.style.maxHeight = "calc(100vh - 129px)";
            }
            menupopup.style.maxWidth = "calc(100vw - 20px)";

            if (inited) {
                let maxWidth = parseInt(getComputedStyle(menupopup)['max-width']);
                scrollbox.style.width = Math.min(maxWidth, scrollbox.scrollWidth) + "px";
                if (maxWidth < scrollbox.scrollWidth) {
                    scrollbox.style.setProperty("overflow-x", "auto", "important");
                    scrollbox.style.setProperty("margin-top", "0", "important");
                    scrollbox.style.setProperty("margin-bottom", "0", "important");
                    // 上下のスクロールボタン
                    event.originalTarget.on_DOMMenuItemActive = function (event) { };
                    arrowscrollbox._scrollButtonUp.style.display = "none";
                    arrowscrollbox._scrollButtonDown.style.display = "none";
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
`)