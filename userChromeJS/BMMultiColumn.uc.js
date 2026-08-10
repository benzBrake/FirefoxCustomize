// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, ding
// @include         main
// @charset         UTF-8
// @version         2026.04.10
// @compatibility   Firefox 133
// @async
// @shutdown        window.BMMultiColumn?.destroy?.();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @note            2026.08.10 修复 Loader 热重载时重复 destroy，并避免多窗口提前注销共享样式和延迟清理污染新实例
// @note            2026.04.09 兼容新版 Firefox 书签菜单宽度规则，修复多列书签标题被撑宽后显示不全
// @note            2025.07.03 修复书签工具栏溢出菜单显示不全 #50
// @note            2025.05.13 优化横向滚动，感谢 ylcs006
// @note            2025.03.27 修复 Height Width 弄混导致宽度异常，支持纵向滚轮
// @note            2025.02.19 fx133
// @note            2024.10.18 fx131
// @note            2024.10.07 fx131
// @note            2024.04.20 修复在【不支持 @include main注释】的UC环境里的一处报错
// @note            2022.12.22 融合 bookmarksmenu_scrollbar.uc.js，修复没超过最大宽度也会显示横向滚动条的 bug，支持主菜单的书签菜单
// @note            2022.12.17 修复宽度异常，书签栏太多的话无法横向滚动，需要搭配 bookmarksmenu_scrollbar.uc.js 使用
// @note            2022.11.19 fx 108 不完美修复
// @note            2022.09.02 修复菜单延迟调整宽度的 BUG
// @note            修复边距问题，支持书签工具栏溢出菜单
// @note            修复有时候无法启用
// @note            适配Firefox57+
// @ignorecache
// ==/UserScript==
location.href.startsWith("chrome://browser/content/browser.x") && (function (css) {
    function uninitBMMultiColumn (instance) {
        for (let i = 0; i < instance.menupopup.length; i++) {
            clearInterval(instance.timer[i]);
            instance.timer[i] = null;
            const menupopup = document.getElementById(instance.menupopup[i]);
            if (!menupopup) continue;
            instance.resetPopup(menupopup);
            menupopup.removeEventListener('popupshowing', instance, false);
            menupopup.removeEventListener('DOMMenuItemActive', instance, false);
        }
    }

    function hasOtherBMMultiColumnWindow () {
        const windows = Services.wm.getEnumerator("navigator:browser");
        while (windows.hasMoreElements()) {
            const win = windows.getNext();
            if (win !== window && win.BMMultiColumn && !win.BMMultiColumn._destroyed) {
                return true;
            }
        }
        return false;
    }

    function destroyBMMultiColumn (instance) {
        if (!instance || instance._destroyed) return;
        instance._destroyed = true;
        window.removeEventListener('unload', instance, false);
        window.removeEventListener("aftercustomization", instance, false);
        if (window.BMMultiColumn === instance) {
            delete window.BMMultiColumn;
        }
        uninitBMMultiColumn(instance);
        if (!hasOtherBMMultiColumnWindow()
            && instance.style
            && instance.sss.sheetRegistered(instance.style, instance.sss.AUTHOR_SHEET)) {
            instance.sss.unregisterSheet(instance.style, instance.sss.AUTHOR_SHEET);
        }
        instance.style = null;
    }

    destroyBMMultiColumn(window.BMMultiColumn);

    window.BMMultiColumn = {
        _destroyed: false,
        menupopup: ["historyMenuPopup",
            "bookmarksMenuPopup",
            'PlacesToolbar',
            'BMB_bookmarksPopup'],
        timer: [],
        count: [],
        sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
        init: function () {
            this.style = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
            if (!this.sss.sheetRegistered(this.style, this.sss.AUTHOR_SHEET)) {
                this.sss.loadAndRegisterSheet(this.style, this.sss.AUTHOR_SHEET);
            }
            window.removeEventListener("load", this, false);
            window.addEventListener('unload', this, false);
            window.addEventListener("aftercustomization", this, false);
            this.delayedStartup();
        },
        delayedStartup: function () {
            if (this._destroyed) return;
            //wait till construction of bookmarksBarContent is completed.
            for (var i = 0; i < this.menupopup.length; i++) {
                clearInterval(this.timer[i]);
                this.count[i] = 0;
                this.timer[i] = setInterval(function (self, i) {
                    if (self._destroyed || ++self.count[i] > 50 || document.getElementById(self.menupopup[i])) {
                        clearInterval(self.timer[i]);
                        var menupopup = document.getElementById(self.menupopup[i]);
                        if (!self._destroyed && menupopup) {
                            menupopup.addEventListener('popupshowing', self, false);
                            menupopup.addEventListener('DOMMenuItemActive', self, false);
                        }
                    }
                }, 250, this, i);
            }
        },
        uninit: function () {
            uninitBMMultiColumn(this);
        },
        destroy () {
            destroyBMMultiColumn(this);
        },
        hasOtherActiveWindow () {
            return hasOtherBMMultiColumnWindow();
        },
        handleEvent (event) {
            if (this._destroyed) return;
            switch (event.type) {
                case 'popupshowing':
                    let menupopup;
                    if (event.target.tagName == 'menu' || event.target.tagName == 'toolbarbutton') {
                        menupopup = event.target.menupopup;
                    } else if (event.target.tagName == 'menupopup') {
                        menupopup = event.target;
                    } else return;
                    this.initHorizontalScroll(event);
                    if (menupopup.id === "PlacesChevronPopup") {
                        setTimeout(_ => {
                            if (!this._destroyed) {
                                this.initMultiColumn(menupopup, event);
                            }
                        }, 10);
                    } else {
                        this.initMultiColumn(menupopup, event);
                    }
                    break;
                case 'aftercustomization':
                    setTimeout(() => this.delayedStartup(), 0);
                    break;
                case 'unload':
                    this.destroy();
                    break;
            }
        },
        initHorizontalScroll (event) {
            let scrollBox = event.originalTarget.scrollBox;
            scrollBox.scrollbox.style.setProperty("overflow-y", "auto", "important");
            scrollBox.scrollbox.style.setProperty("margin-top", "0", "important");
            scrollBox.scrollbox.style.setProperty("margin-bottom", "0", "important");
            scrollBox.scrollbox.style.setProperty("padding-top", "0", "important");
            scrollBox.scrollbox.style.setProperty("padding-bottom", "0", "important");

            // 上下のスクロールボタン
            event.originalTarget.on_DOMMenuItemActive = function (event) {
                /*
                if (super.on_DOMMenuItemActive) {
                  super.on_DOMMenuItemActive(event);
                }
                */
                let elt = event.target;
                if (elt.parentNode != this) {
                    return;
                }

                if (window.XULBrowserWindow) {
                    let placesNode = elt._placesNode;

                    var linkURI;
                    if (placesNode && PlacesUtils.nodeIsURI(placesNode)) {
                        linkURI = placesNode.uri;
                    } else if (elt.hasAttribute("targetURI")) {
                        linkURI = elt.getAttribute("targetURI");
                    }

                    if (linkURI) {
                        window.XULBrowserWindow.setOverLink(linkURI);
                    }
                }
            }.bind(event.originalTarget);
            scrollBox._scrollButtonUp.style.display = "none";
            scrollBox._scrollButtonDown.style.display = "none";
        },
        initMultiColumn (menupopup) {
            menupopup.style.maxWidth = "calc(100vw - 20px)";
            let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part~=scrollbox]');
            if (scrollbox) {
                Object.assign(scrollbox.style, {
                    minHeight: "21px",
                    height: "auto",
                    display: "flex",
                    flexFlow: "column wrap",
                    // overflow: "-moz-hidden-unscrollable",
                    width: "unset",
                    scrollSnapType: "x mandatory",
                });
                arrowscrollbox.style.width = "auto";
                arrowscrollbox.style.maxHeight = "calc(100vh - 129px)";
                let slot = scrollbox.querySelector('slot');
                slot.style.display = "contents";
                let maxWidth = calcWidth(-129);
                let columnWidth = getColumnWidth(menupopup, maxWidth);
                for (let item = menupopup.firstElementChild; item; item = item.nextElementSibling) {
                    if (!item.matches?.("menu, menuitem, menuseparator")) {
                        continue;
                    }
                    item.style.setProperty("min-width", "0", "important");
                    item.style.setProperty("max-width", columnWidth + "px", "important");
                    item.style.setProperty("width", columnWidth + "px", "important");
                }
                if (maxWidth < scrollbox.scrollWidth) {
                    scrollbox.style.setProperty("overflow-x", "auto", "important");
                    scrollbox.style.setProperty("width", maxWidth + "px");
                } else {
                    scrollbox.style.setProperty("width", scrollbox.scrollWidth + "px", "important");
                    scrollbox.clientWidth = scrollbox.scrollWidth;
                }
                bindWheelEvent(scrollbox);
            }
            function bindWheelEvent (item) {
                if (item._bmMultiColumnWheelHandler) return;
                const wheelHandler = (e) => {
                    e.preventDefault();
                    const delta = e.deltaY || e.detail || e.wheelDelta;
                    item.scrollLeft += delta * 50;
                };
                item.addEventListener('wheel', wheelHandler, { passive: false });
                item._bmMultiColumnWheelHandler = wheelHandler;
            }
        },
        resetPopup (menupopup) {
            let arrowscrollbox = menupopup?.shadowRoot?.querySelector("::part(arrowscrollbox)");
            if (!arrowscrollbox) return;
            menupopup.style.maxWidth = "";
            arrowscrollbox.style.width = "";
            arrowscrollbox.style.maxHeight = "";
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part~=scrollbox]');

            if (!scrollbox) return;
            if (scrollbox._bmMultiColumnWheelHandler) {
                scrollbox.removeEventListener('wheel', scrollbox._bmMultiColumnWheelHandler);
                delete scrollbox._bmMultiColumnWheelHandler;
            }
            let slot = scrollbox.querySelector('slot');
            if (slot) {
                slot.style.display = "";
            }
            Object.assign(scrollbox.style, {
                minHeight: "",
                height: "",
                display: "",
                flexFlow: "",
                overflow: "",
                overflowX: "",
                overflowY: "",
                maxHeight: "",
                width: "",
                scrollSnapType: "",
            });

            let menuitem = menupopup.lastElementChild;
            while (menuitem) {
                menuitem.style.minWidth = "";
                menuitem.style.maxWidth = "";
                menuitem.style.width = "";
                menuitem = menuitem.previousElementSibling;
            }
        }
    }

    function getColumnWidth (menupopup, maxWidth) {
        let fontSize = parseFloat(getComputedStyle(menupopup).fontSize) || 16;
        let preferredWidth = Math.round(fontSize * 26);
        let minWidth = Math.round(fontSize * 18);
        return Math.max(Math.min(preferredWidth, maxWidth), Math.min(minWidth, maxWidth));
    }

    function calcWidth (offset) {
        if (typeof offset == 'number') {
            return window.innerWidth + offset;
        } else if (typeof offset == 'string') {
            if (/^-?\d+px$/.test(offset.trim())) {
                return window.innerWidth + parseInt(offset.trim().match(/^-?(\d+)px$/)[1]);
            }
        }
        throw new Error('Invalid offset value');
    }

    window.BMMultiColumn.init();
})(`
#PlacesToolbarItems menupopup {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 129px);
}
#PlacesToolbarItems menupopup > * {
    scroll-snap-align: start;
}
`)
