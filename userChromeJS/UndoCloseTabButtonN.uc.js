// ==UserScript==
// @name            UndoCloseTabButtonN
// @description		閉じたタブを復元するツールバーボタン＆タブバーの空き上の中クリックで最後に閉じたタブを復元
// @version         1.2.6
// @include         main
// @charset         UTF-8
// @note            2021/12/12 Fx95 SessionStore.getClosedTabData / getClosedWindowData の戻り値がJSONからArrayに変更
// @note            2019/01/23 Fx66でタブバー中クリックが効かないのを修正
// @note            2019/07/04 Fx69
// @note            2019/09/03 Fx70
// @note            2019/12/09 Fx72
// ==/UserScript==
// アイコン初期位置はタブバーです
(function () {
    "use strict";

    const useTabbarMiddleClick = true; // タブバーの空き・タブ追加ボタン上の中クリックで最後に閉じたタブを復元するか？

    const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

    window.ucjsUndoCloseTabButtonService = {
        prepareMenu(event) {
            const doc = (event.view && event.view.document) || document;
            const menu = event.originalTarget;
            this.removeChilds(menu);

            // 閉じたタブ
            let data = SessionStore.getClosedTabData(window);
            if (typeof (data) === "string") {
                data = JSON.parse(data);
            }
            const tabLength = data.length;

            for (let i = 0; i < tabLength; i++) {
                const item = data[i];
                const m = this.createFaviconMenuitem(doc, item.title, item.image, i, this.undoTab);

                const state = item.state;
                let idx = state.index;
                if (idx == 0)
                    idx = state.entries.length;
                if (--idx >= 0 && state.entries[idx])
                    m.setAttribute("targetURI", state.entries[idx].url);

                menu.appendChild(m);
            }

            // 閉じたウィンドウ
            data = SessionStore.getClosedWindowData();
            if (typeof (data) === "string") {
                data = JSON.parse(data);
            }
            const winLength = data.length;
            if (winLength > 0) {
                if (tabLength > 0)
                    menu.appendChild(this.$C(doc, "menuseparator"));

                menu.appendChild(this.$C(doc, "menuitem", {
                    disabled: true,
                    label: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的窗口" : "閉じたウインドウ"
                }));

                for (let i = 0; i < winLength; i++) {
                    const item = data[i];

                    let title = item.title;
                    const tabsCount = item.tabs.length - 1;
                    if (tabsCount > 0)
                        title += " (他:" + tabsCount + ")";

                    const tab = item.tabs[item.selected - 1];

                    const m = this.createFaviconMenuitem(doc, title, tab.image, i, this.undoWindow);
                    menu.appendChild(m);
                }
            }

            if (tabLength + winLength === 0) {
                /*				menu.appendChild(this.$C(doc, "menuitem", {
                                    disabled: true,
                                    label	: "履歴がありません"
                                }));*/
                event.preventDefault();
            }
        },

        createFaviconMenuitem(doc, label, icon, value, command) {
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
            const m = this.$C(doc, "menuitem", attr);
            m.addEventListener("command", command, false);
            return m;
        },

        undoTab(event) {
            undoCloseTab(event.originalTarget.getAttribute("value"));
        },
        undoWindow(event) {
            undoCloseWindow(event.originalTarget.getAttribute("value"));
        },
        removeChilds(element) {
            const range = document.createRange();
            range.selectNodeContents(element);
            range.deleteContents();
        },

        onClick(event) {
            if (event.button === 1) {
                switch (event.originalTarget.localName) {
                    case "box": // -Fx65
                    case "scrollbox": // Fx66-
                    case "toolbarbutton":
                        event.preventDefault();
                        event.stopPropagation();
                        undoCloseTab();
                        break;
                }
            }
        },

        $C(doc, tag, attrs) {
            const e = tag instanceof Node ? tag : doc.createElementNS(XULNS, tag);
            if (attrs) {
                Object.entries(attrs).forEach(([key, value]) => e.setAttribute(key, value));
            }
            return e;
        },
    };

    function run() {
        if (useTabbarMiddleClick) {
            gBrowser.tabContainer.addEventListener("click", ucjsUndoCloseTabButtonService.onClick, true);
        }

        const buttonId = "ucjs-undo-close-tab-button";

        if (document.getElementById(buttonId)) {
            return;
        }

        try {
            Cu.import("resource:///modules/CustomizableUI.jsm");
            CustomizableUI.createWidget({
                id: buttonId,
                defaultArea: CustomizableUI.AREA_TABSTRIP,
                type: "custom",
                onBuild: doc => {
                    const btn = ucjsUndoCloseTabButtonService.$C(doc, "toolbarbutton", {
                        id: buttonId,
                        class: "toolbarbutton-1 chromeclass-toolbar-additional",
                        type: "menu",
                        anchor: "dropmarker",
                        label: Services.locale.appLocaleAsBCP47.includes("zh-") ? "已关闭的标签" : "閉じたタブ",
                        tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? "查看已经关闭的标签\n中键快速打开最后一个关闭的标签" : "閉じたタブ\n中クリックで最後に閉じたタブを復元",
                        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj4KICAgIDxwYXRoIHN0cm9rZS13aWR0aD0iMjQiIGZpbGw9IiM1NTU1NTUiIHN0cm9rZT0iI2ZmZmZmZiIgZD0iTSA2IDQ4MCBsIDUwMCAwIGwgMCAtNjAgbCAtNTAgMCBsIDAgLTIyMCBsIC00MDAgMCBsIDAgMjIwIGwgLTUwIDAgeiIvPgogICAgPHBhdGggc3Ryb2tlLXdpZHRoPSIzMCIgZmlsbD0iIzQ0ODhmZiIgc3Ryb2tlPSIjZGRlZWZmIiBkPSJNIDI3MiAzMiBsIC0xNjAgMTMwIGwgMTYwIDEzMCBsIDAgLTc1IGwgNjAgMCBhIDYwIDYwIDAgMCAxIDAgMTIwIGwgLTIwIDAgbCAwIDExMCBsIDIwIDAgYSAxNzAgMTcwIDAgMCAwIDAgLTM0MCBsIC02MCAwIHoiLz4KPC9zdmc+",
                        onclick: "ucjsUndoCloseTabButtonService.onClick(event);",
                        oncontextmenu: "event.preventDefault();",
                    });
                    const menu = ucjsUndoCloseTabButtonService.$C(doc, "menupopup", {
                        tooltip: "bhTooltip",
                        popupsinherittooltip: "true",
                        oncontextmenu: "event.preventDefault();",
                        onpopupshowing: "ucjsUndoCloseTabButtonService.prepareMenu(event);",
                    });
                    btn.appendChild(menu);
                    return btn;
                },
            });
        } catch (e) { }
    }

    if (gBrowserInit.delayedStartupFinished) {
        run();
    } else {
        const OBS_TOPIC = "browser-delayed-startup-finished";
        const delayedStartupFinished = (subject, topic) => {
            if (topic === OBS_TOPIC && subject === window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                run();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, OBS_TOPIC);
    }
})();