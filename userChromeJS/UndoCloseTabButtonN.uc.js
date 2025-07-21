// ==UserScript==
// @name            UndoCloseTabButtonN
// @description		閉じたタブを復元するツールバーボタン＆タブバーの空き上の中クリックで最後に閉じたタブを復元
// @version         1.2.7
// @include         main
// @sandbox         true
// @charset         UTF-8
// @note            2025/07/21 Fx141
// @note            2025/01/31 Fx136 fix Remove Cu.import, per Bug Bug 1881888, Bug 1937080 Block inline event handlers in Nightly and collect telemetry
// @note            2023/08/16 Fx117 fix this is undefined
// @note            2023/06/08 Fx115 SessionStore.getClosedTabData → SessionStore.getClosedTabDataForWindow
// @note            2022/11/12 修改左中右按键行为
// @note            2021/12/12 Fx95 SessionStore.getClosedTabData / getClosedWindowData の戻り値がJSONからArrayに変更
// @note            2019/01/23 Fx66でタブバー中クリックが効かないのを修正
// @note            2019/07/04 Fx69
// @note            2019/09/03 Fx70
// @note            2019/12/09 Fx72
// ==/UserScript==
// アイコン初期位置はタブバーです
(function () {
    "use strict";

    const CONFIG = {
        useTabbarMiddleClick: true, // Enable middle-click on tab bar to restore last closed tab
        XULNS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
        BUTTON_ID: "ucjs-undo-close-tab-button",
        LOCALE: Services.locale.appLocaleAsBCP47.includes("zh-"),
        LABELS: {
            closedTab: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的标签" : "閉じたタブ",
            closedWindow: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的窗口" : "閉じたウインドウ",
            tooltip: Services.locale.appLocaleAsBCP47.includes("zh-")
                ? "查看已经关闭的标签\n中键快速打开最后一个关闭的标签"
                : "閉じたタブ\n中クリックで最後に閉じたタブを復元"
        }
    };

    if (typeof undoCloseTab === "undefined") {
        window.undoCloseTab = function (aIndex, sourceWindowSSId) {
            // the window we'll open the tab into
            let targetWindow = window;
            // the window the tab was closed from
            let sourceWindow;
            if (sourceWindowSSId) {
                sourceWindow = SessionStore.getWindowById(sourceWindowSSId);
                if (!sourceWindow) {
                    throw new Error(
                        "sourceWindowSSId argument to undoCloseTab didn't resolve to a window"
                    );
                }
            } else {
                sourceWindow = window;
            }

            // wallpaper patch to prevent an unnecessary blank tab (bug 343895)
            let blankTabToRemove = null;
            if (
                targetWindow.gBrowser.visibleTabs.length == 1 &&
                targetWindow.gBrowser.selectedTab.isEmpty
            ) {
                blankTabToRemove = targetWindow.gBrowser.selectedTab;
            }

            // We are specifically interested in the lastClosedTabCount for the source window.
            // When aIndex is undefined, we restore all the lastClosedTabCount tabs.
            let lastClosedTabCount = SessionStore.getLastClosedTabCount(sourceWindow);
            let tab = null;
            // aIndex is undefined if the function is called without a specific tab to restore.
            let tabsToRemove =
                aIndex !== undefined ? [aIndex] : new Array(lastClosedTabCount).fill(0);
            let tabsRemoved = false;
            for (let index of tabsToRemove) {
                if (SessionStore.getClosedTabCountForWindow(sourceWindow) > index) {
                    tab = SessionStore.undoCloseTab(sourceWindow, index, targetWindow);
                    tabsRemoved = true;
                }
            }

            if (tabsRemoved && blankTabToRemove) {
                targetWindow.gBrowser.removeTab(blankTabToRemove);
            }

            return tab;
        }
    }

    const UndoCloseTabService = {
        prepareMenu (event) {
            const doc = event.view?.document || document;
            const menu = event.originalTarget;
            this.clearMenu(menu);

            // Populate closed tabs
            const tabData = this.getClosedTabData();
            this.addTabMenuItems(doc, menu, tabData);

            // Populate closed windows
            const windowData = this.getClosedWindowData();
            if (windowData.length > 0) {
                if (tabData.length > 0) {
                    menu.appendChild(this.createElement(doc, "menuseparator"));
                }
                menu.appendChild(this.createElement(doc, "menuitem", {
                    disabled: true,
                    label: CONFIG.LABELS.closedWindow
                }));
                this.addWindowMenuItems(doc, menu, windowData);
            }

            if (tabData.length + windowData.length === 0) {
                event.preventDefault();
            }
        },

        getClosedTabData () {
            let data = "getClosedTabDataForWindow" in SessionStore
                ? SessionStore.getClosedTabDataForWindow(window)
                : SessionStore.getClosedTabData(window);
            return typeof data === "string" ? JSON.parse(data) : data;
        },

        getClosedWindowData () {
            let data = SessionStore.getClosedWindowData(window);
            return typeof data === "string" ? JSON.parse(data) : data;
        },

        addTabMenuItems (doc, menu, data) {
            data.forEach((item, index) => {
                const menuItem = this.createFaviconMenuitem(doc, item.title, item.image, index, this.undoTab);
                const state = item.state;
                let idx = state.index;
                if (idx === 0) idx = state.entries.length;
                if (--idx >= 0 && state.entries[idx]) {
                    menuItem.setAttribute("targetURI", state.entries[idx].url);
                }
                menu.appendChild(menuItem);
            });
        },

        addWindowMenuItems (doc, menu, data) {
            data.forEach((item, index) => {
                let title = item.title;
                const tabsCount = item.tabs.length - 1;
                if (tabsCount > 0) title += ` (总计:${tabsCount})`;
                const tab = item.tabs[item.selected - 1];
                menu.appendChild(this.createFaviconMenuitem(doc, title, tab.image, index, this.undoWindow));
            });
        },

        createFaviconMenuitem (doc, label, icon, value, command) {
            const attrs = {
                class: "menuitem-iconic bookmark-item menuitem-with-favicon",
                label,
                value
            };
            if (icon) {
                attrs.image = /^https?:/.test(icon) ? `moz-anno:favicon:${icon}` : icon;
            }
            const menuItem = this.createElement(doc, "menuitem", attrs);
            menuItem.addEventListener("command", command, false);
            return menuItem;
        },

        undoTab (event) {
            undoCloseTab(event.originalTarget.getAttribute("value"));
        },

        undoWindow (event) {
            undoCloseWindow(event.originalTarget.getAttribute("value"));
        },

        clearMenu (element) {
            const range = document.createRange();
            range.selectNodeContents(element);
            range.deleteContents();
        },

        onClick (event) {
            if (event.button === 0 && event.target.id === CONFIG.BUTTON_ID) {
                event.preventDefault();
                event.stopPropagation();
                undoCloseTab();
            } else if (event.button === 1 && ["box", "scrollbox"].includes(event.originalTarget.localName)) {
                event.preventDefault();
                event.stopPropagation();
                undoCloseTab();
            } else if (event.button === 2 && event.target.id === CONFIG.BUTTON_ID) {
                event.preventDefault();
                event.stopPropagation();
                const pos = (event.target.ownerGlobal.innerWidth / 2) > event.pageX
                    ? { position: "after_position", x: 0, y: event.target.clientHeight }
                    : { position: "after_end", x: 0, y: 0 };
                event.target.querySelector("menupopup").openPopup(event.target, pos.position, pos.x, pos.y);
            }
        },

        createElement (doc, tag, attrs = {}) {
            const element = doc.createElementNS(CONFIG.XULNS, tag);
            Object.entries(attrs).forEach(([key, value]) => {
                if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.slice(2).toLowerCase(), value, false);
                } else {
                    element.setAttribute(key, value);
                }
            });
            return element;
        }
    };

    function initialize () {
        if (CONFIG.useTabbarMiddleClick) {
            gBrowser.tabContainer.addEventListener("click", UndoCloseTabService.onClick, true);
        }

        if (document.getElementById(CONFIG.BUTTON_ID)) return;

        try {
            const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
            CustomizableUI.createWidget({
                id: CONFIG.BUTTON_ID,
                defaultArea: CustomizableUI.AREA_TABSTRIP,
                type: "custom",
                onBuild: doc => {
                    const button = UndoCloseTabService.createElement(doc, "toolbarbutton", {
                        id: CONFIG.BUTTON_ID,
                        class: "toolbarbutton-1 chromeclass-toolbar-additional",
                        type: "contextmenu",
                        anchor: "dropmarker",
                        label: CONFIG.LABELS.closedTab,
                        tooltiptext: CONFIG.LABELS.tooltip,
                        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj4KICAgIDxwYXRoIHN0cm9rZS13aWR0aD0iMjQiIGZpbGw9IiM1NTU1NTUiIHN0cm9rZT0iI2ZmZmZmZiIgZD0iTSA2IDQ4MCBsIDUwMCAwIGwgMCAtNjAgbCAtNTAgMCBsIDAgLTIyMCBsIC00MDAgMCBsIDAgMjIwIGwgLTUwIDAgeiIvPgogICAgPHBhdGggc3Ryb2tlLXdpZHRoPSIzMCIgZmlsbD0iIzQ0ODhmZiIgc3Ryb2tlPSIjZGRlZWZmIiBkPSJNIDI3MiAzMiBsIC0xNjAgMTMwIGwgMTYwIDEzMCBsIDAgLTc1IGwgNjAgMCBhIDYwIDYwIDAgMCAxIDAgMTIwIGwgLTIwIDAgbCAwIDExMCBsIDIwIDAgYSAxNzAgMTcwIDAgMCAwIDAgLTM0MCBsIC02MCAwIHoiLz4KPC9zdmc+",
                        onclick: UndoCloseTabService.onClick
                    });
                    const menu = UndoCloseTabService.createElement(doc, "menupopup", {
                        tooltip: "bhTooltip",
                        popupsinherittooltip: "true",
                        oncontextmenu: event => event.preventDefault(),
                        onpopupshowing: event => UndoCloseTabService.prepareMenu(event)
                    });
                    button.appendChild(menu);
                    return button;
                }
            });
        } catch (e) {
            console.error("Failed to create widget:", e);
        }
    }

    if (gBrowserInit.delayedStartupFinished) {
        initialize();
    } else {
        const observer = (subject, topic) => {
            if (topic === "browser-delayed-startup-finished" && subject === window) {
                Services.obs.removeObserver(observer, topic);
                initialize();
            }
        };
        Services.obs.addObserver(observer, "browser-delayed-startup-finished");
    }
})();