// ==UserScript==
// @name            UndoCloseTabButtonN
// @description		閉じたタブを復元するツールバーボタン＆タブバーの空き上の中クリックで最後に閉じたタブを復元
// @version         1.2.8
// @include         main
// @charset         UTF-8
// @note            2025/08/28 Try to fix #57, #54
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
    try {
        ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs");
    } catch (e) { }

    const CONFIG = {
        useTabbarMiddleClick: true, // Enable middle-click on tab bar to restore last closed tab
        BUTTON_ID: "ucjs-undo-close-tab-button",
        POPUP_ID: "ucjs-undo-close-tab-popup",
        LOCALE: Services.locale.appLocaleAsBCP47.includes("zh-"),
        LABELS: {
            closedTab: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的标签" : "閉じたタブ",
            closedWindow: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的窗口" : "閉じたウインドウ",
            tooltip: Services.locale.appLocaleAsBCP47.includes("zh-")
                ? "查看已经关闭的标签\n中键快速打开最后一个关闭的标签"
                : "閉じたタブ\n中クリックで最後に閉じたタブを復元"
        }
    };

    const $C = (doc, tag, attrs) => {
        const el = doc.createXULElement(tag);
        for (const a in attrs) {
            el.setAttribute(a, attrs[a]);
        }
        return el;
    };


    window.ucjsUndoCloseTabButtonService = {
        init: function () {
            try {
                CustomizableUI.createWidget({
                    id: CONFIG.BUTTON_ID,
                    defaultArea: CustomizableUI.AREA_TABSTRIP,
                    type: "custom",
                    onBuild: doc => {
                        const btn = $C(doc, "toolbarbutton", {
                            id: CONFIG.BUTTON_ID,
                            class: "toolbarbutton-1 chromeclass-toolbar-additional",
                            label: CONFIG.LABELS.closedTab,
                            tooltiptext: CONFIG.LABELS.tooltip,
                            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj4KICAgIDxwYXRoIHN0cm9rZS13aWR0aD0iMjQiIGZpbGw9IiM1NTU1NTUiIHN0cm9rZT0iI2ZmZmZmZiIgZD0iTSA2IDQ4MCBsIDUwMCAwIGwgMCAtNjAgbCAtNTAgMCBsIDAgLTIyMCBsIC00MDAgMCBsIDAgMjIwIGwgLTUwIDAgeiIvPgogICAgPHBhdGggc3Ryb2tlLXdpZHRoPSIzMCIgZmlsbD0iIzQ0ODhmZiIgc3Ryb2tlPSIjZGRlZWZmIiBkPSJNIDI3MiAzMiBsIC0xNjAgMTMwIGwgMTYwIDEzMCBsIDAgLTc1IGwgNjAgMCBhIDYwIDYwIDAgMCAxIDAgMTIwIGwgLTIwIDAgbCAwIDExMCBsIDIwIDAgYSAxNzAgMTcwIDAgMCAwIDAgLTM0MCBsIC02MCAwIHoiLz4KPC9zdmc+",
                        });


                        const menupopup = $C(doc, "menupopup", {
                            tooltip: "bhTooltip",
                            popupsinherittooltip: "true",
                            id: CONFIG.POPUP_ID,
                        });

                        btn.appendChild(menupopup);
                        return btn;
                    },
                });

            } catch (e) {
                console.error(e);
            }

            const btn = CustomizableUI.getWidget(CONFIG.BUTTON_ID).forWindow(window)?.node;
            if (btn) {
                btn.addEventListener("click", this, false);
                const popup = btn.querySelector(`#${CONFIG.POPUP_ID}`);
                if (popup) {
                    popup.addEventListener("popupshowing", this, false);
                }
            }
            if (CONFIG.useTabbarMiddleClick) {
                gBrowser.tabContainer.addEventListener("click", this, true);
            }
        },
        handleEvent (event) {
            this[`on${event.type}`](event);
        },
        onclick (event) {
            const { button, originalTarget: target } = event;
            switch (button) {
                case 0:
                    if (target.id === CONFIG.BUTTON_ID) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.undoTab(void 0, event.target.ownerGlobal);
                    }
                    break;
                case 1:
                    switch (target.localName) {
                        case "box":	// -Fx65
                        case "scrollbox":	// Fx66-
                        case "slot":	// Fx131-
                        case "toolbarbutton":
                            event.preventDefault();
                            event.stopPropagation();
                            this.undoTab(void 0, event.target.ownerGlobal);
                            break;
                    }
                    break;
                case 2:
                    if (target.id === CONFIG.BUTTON_ID) {
                        event.preventDefault();
                        event.stopPropagation();
                        const pos = (event.target.ownerGlobal.innerWidth / 2) > event.pageX
                            ? { position: "after_position", x: 0, y: event.target.clientHeight }
                            : { position: "after_end", x: 0, y: 0 };
                        target.querySelector("menupopup").openPopup(event.target, pos.position, pos.x, pos.y);
                    }
                    break;
            }
        },
        onpopupshowing (event) {
            const popup = event.originalTarget;
            const win = popup.ownerGlobal;
            const doc = popup.ownerDocument;

            this.clearPopup(popup);

            // Populate closed tabs
            const tabData = "getClosedTabDataForWindow" in SessionStore
                ? SessionStore.getClosedTabDataForWindow(win)
                : SessionStore.getClosedTabData(win);

            const tabLength = tabData.length;
            for (let i = 0; i < tabLength; i++) {
                const item = tabData[i];
                const m = this.createFaviconMenuitem(doc, item.title, item.image, i, (event) => {
                    this.undoTab(event.target.value, event.target.ownerGlobal);
                });

                const state = item.state;
                let idx = state.index;
                if (idx == 0)
                    idx = state.entries.length;
                if (--idx >= 0 && state.entries[idx])
                    m.setAttribute("targetURI", state.entries[idx].url);

                popup.appendChild(m);
            }

            // Populate closed windows
            const windowData = SessionStore.getClosedWindowData();
            if (typeof (windowData) === "string") {
                windowData = JSON.parse(windowData);
            }
            if (windowData.length > 0) {
                if (tabData.length > 0) {
                    popup.appendChild($C(doc, "menuseparator"));
                }
                popup.appendChild($C(doc, "menuitem", {
                    disabled: true,
                    label: CONFIG.LABELS.closedWindow
                }));
                this.addWindowMenuItems(doc, popup, windowData);
            }
        },
        addWindowMenuItems (doc, menu, data) {
            data.forEach((item, index) => {
                let title = item.title;
                const tabsCount = item.tabs.length - 1;
                if (tabsCount > 0) {
                    title += CONFIG.LOCALE
                        ? ` (总计:${tabsCount})` // Chinese locale
                        : ` (${tabsCount} tabs)`; // Non-Chinese locale (e.g., English)
                }
                const tab = item.tabs[item.selected - 1];
                menu.appendChild(this.createFaviconMenuitem(doc, title, tab.image, index, (event) => {
                    this.undoWindow(event.target.value, event.target.ownerGlobal);
                }));
            });
        },
        createFaviconMenuitem (doc, label, icon, value, command) {
            const attr = {
                class: "menuitem-iconic bookmark-item menuitem-with-favicon",
                label: label,
                value: value
            };
            if (icon) {
                if (/^https?:/.test(icon))
                    icon = "moz-anno:favicon:" + icon;
                attr.image = icon;
            }
            const m = $C(doc, "menuitem", attr);
            m.addEventListener("command", command, false);
            return m;
        },
        clearPopup (popup) {
            while (popup.firstChild) {
                popup.removeChild(popup.firstChild);
            }
        },
        get undoTab () {
            return this.undoTab = typeof SessionWindowUI !== "undefined" ? (index, win) => {
                SessionWindowUI.undoCloseTab(win, index);
            } : (index, win) => {
                win.undoCloseTab(index);
            };
        },
        get undoWindow () {
            return this.undoWindow = typeof SessionWindowUI !== "undefined" ? index => {
                SessionWindowUI.undoCloseWindow(index);
            } : (index, win) => {
                win.undoCloseWindow(index);
            };
        }
    };

    window.ucjsUndoCloseTabButtonService.init();
})();