// ==UserScript==
// @name            CustomButtons.uc.js
// @description     添加多个自定义按钮，截图、UndoCloseTab、证书管理器、放大缩小、清除历史记录、高级首选项、受同步的标签页、下载历史、管理书签
// @author          Ryan
// @version         0.1.4
// @compatibility   Firefox90
// @include         main
// @shutdown        window.CustomButtons.destroy(win);
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            从 CopyCat.uc.js 修改而来
// ==/UserScript==
(function (css, debug) {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;


    if (window.CustomButtons) {
        window.CustomButtons.destroy(window);
        delete window.CustomButtons;
    }

    const LANG = {
        'zh-CN': {
            "take snapshot": "高级截图",
            "take snapshot tooltip": "左键：截图\n右键：截图菜单",
            "hide firefox to take snapshot": "隐藏火狐截图",
            "scroll snapshot": "滚动截图工具",
            "color picker": "颜色拾取工具",
            "screen to gif": "录制动态图片",
            "faststone capture": "完整截图工具",
            "microsoft paint": "打开系统画板",
            "undo close tab": "撤销关闭标签页",
            "undo close tab tooltip": "左键：撤销关闭标签页\n右键：已关闭标签页列表",
            "reopen all tabs": "重新打开所有标签页",
            "zoom control": "缩放控制",
            "zoom control tooltip": "'左或滚轮↑：放大 | 按下滚轮：复位 | 右或滚轮↓：缩小'",
            "certificate manager": "证书管理器",
            "certificate manager tooltip": "证书管理器",
            "clean history": "清除历史记录",
            "clean history toolip": "清除最近的历史记录",
            "about config": "高级首选项",
            "synced tabs": "受同步的标签页",
            "downloads history": "我的足迹：下载",
            "bookmarks manager": "我的足迹：书签",
            "toggle bookmarks toolbar": "显示/隐藏书签工具栏"
        }
    }

    const BTN_CONFIG = [
        {
            id: 'CB-SnapShot',
            label: $L("take snapshot"),
            tooltiptext: $L("take snapshot tooltip"),
            type: "contextmenu",
            tool: "\\SnapShot.exe",
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTEuOTkzIDE0LjQwN2wtMS41NTIgMS41NTJhNCA0IDAgMSAxLTEuNDE4LTEuNDFsMS41NTUtMS41NTYtMy4xMjQtMy4xMjVhMS41IDEuNSAwIDAgMSAwLTIuMTIxbC4zNTQtLjM1NCA0LjE4NSA0LjE4NSA0LjE4OS00LjE4OS4zNTMuMzU0YTEuNSAxLjUgMCAwIDEgMCAyLjEybC0zLjEyOCAzLjEzIDEuNTYxIDEuNTZhNCA0IDAgMSAxLTEuNDE0IDEuNDE0bC0xLjU2MS0xLjU2ek0xOSAxM1Y1SDV2OEgzVjRhMSAxIDAgMCAxIDEtMWgxNmExIDEgMCAwIDEgMSAxdjloLTJ6TTcgMjBhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0xMCAwYTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHoiLz48L3N2Zz4=",
            popup: [{
                label: $L("hide firefox to take snapshot"),
                precommand: 'window.minimize();',
                tool: "\\SnapShot.exe",
                image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy4zNjcgNC43OCBMIDMuODM3IDQuNzggTCAzLjgzNyA4LjI5NyBMIDUuNjAyIDguMjk3IEwgNS42MDIgNi41MzggTCA3LjM2NyA2LjUzOCBNIDE2LjE5MSA4LjI5NyBMIDE0LjQyNiA4LjI5NyBMIDE0LjQyNiAxMC4wNTUgTCAxMi42NiAxMC4wNTUgTCAxMi42NiAxMS44MTQgTCAxNi4xOTEgMTEuODE0IE0gMTcuOTU1IDEzLjU3MiBMIDIuMDczIDEzLjU3MiBMIDIuMDczIDMuMDIxIEwgMTcuOTU1IDMuMDIxIE0gMTcuOTU1IDEuMjYzIEwgMi4wNzMgMS4yNjMgQyAxLjA5MyAxLjI2MyAwLjMwOCAyLjA0NiAwLjMwOCAzLjAyMSBMIDAuMzA4IDEzLjU3MiBDIDAuMzA4IDE0LjU0MyAxLjA5NyAxNS4zMzIgMi4wNzMgMTUuMzMyIEwgOC4yNDkgMTUuMzMyIEwgOC4yNDkgMTcuMDkgTCA2LjQ4NCAxNy4wOSBMIDYuNDg0IDE4Ljg0OSBMIDEzLjU0NCAxOC44NDkgTCAxMy41NDQgMTcuMDkgTCAxMS43NzggMTcuMDkgTCAxMS43NzggMTUuMzMyIEwgMTcuOTU1IDE1LjMzMiBDIDE4LjkzIDE1LjMzMiAxOS43MiAxNC41NDMgMTkuNzIgMTMuNTcyIEwgMTkuNzIgMy4wMjEgQyAxOS43MiAyLjA1IDE4LjkzIDEuMjYzIDE3Ljk1NSAxLjI2MyIgc3R5bGU9IiIvPgo8L3N2Zz4='
            }, {
                label: $L("scroll snapshot"),
                oncommand: 'ScreenshotsUtils.notify(window, "shortcut");',
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik01IDZMNSAxNEw3IDE0TDcgMTFMOSAxMUw5IDlMNyA5TDcgOEwxMCA4TDEwIDYgWiBNIDExIDZMMTEgMTFDMTEgMTIuNjQ0NTMxIDEyLjM1NTQ2OSAxNCAxNCAxNEMxNS42NDQ1MzEgMTQgMTcgMTIuNjQ0NTMxIDE3IDExTDE3IDZMMTUgNkwxNSAxMUMxNSAxMS41NjY0MDYgMTQuNTY2NDA2IDEyIDE0IDEyQzEzLjQzMzU5NCAxMiAxMyAxMS41NjY0MDYgMTMgMTFMMTMgNiBaIE0gMTggNkwxOCAxNEwyMiAxNEwyMiAxMkwyMCAxMkwyMCA2IFogTSAyMyA2TDIzIDE0TDI3IDE0TDI3IDEyTDI1IDEyTDI1IDYgWiBNIDUgMTZMNSAyNkw3IDI2TDcgMThMMTUgMThMMTUgMjIuNTYyNUwxMy43MTg3NSAyMS4yODEyNUwxMi4yODEyNSAyMi43MTg3NUwxNS4yODEyNSAyNS43MTg3NUwxNiAyNi40MDYyNUwxNi43MTg3NSAyNS43MTg3NUwxOS43MTg3NSAyMi43MTg3NUwxOC4yODEyNSAyMS4yODEyNUwxNyAyMi41NjI1TDE3IDE4TDI1IDE4TDI1IDI2TDI3IDI2TDI3IDE2WiIvPjwvc3ZnPg=='
            }, {
                label: $L("color picker"),
                tool: '\\Colors\\Colors.exe',
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMy4xTDcuMDUgOC4wNWE3IDcgMCAxIDAgOS45IDBMMTIgMy4xem0wLTIuODI4bDYuMzY0IDYuMzY0YTkgOSAwIDEgMS0xMi43MjggMEwxMiAuMjcyeiIvPjwvc3ZnPg=='
            }, {}, {
                label: $L("screen to gif"),
                tool: "\\ScreenToGif.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
            }, {
                label: $L("faststone capture"),
                tool: "\\FSCapture\\FSCapture.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMyAzaDJ2MkgzVjN6bTQgMGgydjJIN1Yzem00IDBoMnYyaC0yVjN6bTQgMGgydjJoLTJWM3ptNCAwaDJ2MmgtMlYzem0wIDRoMnYyaC0yVjd6TTMgMTloMnYySDN2LTJ6bTAtNGgydjJIM3YtMnptMC00aDJ2Mkgzdi0yem0wLTRoMnYySDNWN3ptNy42NjcgNGwxLjAzNi0xLjU1NUExIDEgMCAwIDEgMTIuNTM1IDloMi45M2ExIDEgMCAwIDEgLjgzMi40NDVMMTcuMzMzIDExSDIwYTEgMSAwIDAgMSAxIDF2OGExIDEgMCAwIDEtMSAxSDhhMSAxIDAgMCAxLTEtMXYtOGExIDEgMCAwIDEgMS0xaDIuNjY3ek05IDE5aDEwdi02aC0yLjczN2wtMS4zMzMtMmgtMS44NmwtMS4zMzMgMkg5djZ6bTUtMWEyIDIgMCAxIDEgMC00IDIgMiAwIDAgMSAwIDR6Ii8+PC9zdmc+'
            }, {
                label: $L("microsoft paint"),
                tool: "\\mspaint.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTkuMjI4IDE4LjczMmwxLjc2OC0xLjc2OCAxLjc2NyAxLjc2OGEyLjUgMi41IDAgMSAxLTMuNTM1IDB6TTguODc4IDEuMDhsMTEuMzE0IDExLjMxM2ExIDEgMCAwIDEgMCAxLjQxNWwtOC40ODUgOC40ODVhMSAxIDAgMCAxLTEuNDE0IDBsLTguNDg1LTguNDg1YTEgMSAwIDAgMSAwLTEuNDE1bDcuNzc4LTcuNzc4LTIuMTIyLTIuMTIxTDguODggMS4wOHpNMTEgNi4wM0wzLjkyOSAxMy4xIDExIDIwLjE3M2w3LjA3MS03LjA3MUwxMSA2LjAyOXoiLz48L3N2Zz4='
            }]
        }, {
            id: 'CB-undoCloseTab',
            label: $L("undo close tab"),
            tooltiptext: $L("undo close tab tooltip"),
            defaultArea: CustomizableUI.AREA_TABSTRIP,
            oncommand: "undoCloseTab();",
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSIgZmlsbD0iY29udGV4dC1maWxsIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNNS44MjggN2wyLjUzNiAyLjUzNkw2Ljk1IDEwLjk1IDIgNmw0Ljk1LTQuOTUgMS40MTQgMS40MTRMNS44MjggNUgxM2E4IDggMCAxIDEgMCAxNkg0di0yaDlhNiA2IDAgMSAwIDAtMTJINS44Mjh6Ii8+PC9zdmc+",
            onclick: function (event) {
                if (event.target.localName !== "toolbarbutton") return;
                if (event.button === 1) {
                    try {
                        SessionStore.restoreLastSession();
                    } catch (e) {
                    }
                    return;
                }
                if (event.button !== 2) return;
                const doc = (event.view && event.view.document) || document;
                const menu = event.target.querySelector("menupopup");
                menu.querySelectorAll('.undo-item').forEach(i => i.remove());
                let data = SessionStore.getClosedTabData(window);
                if (typeof (data) === "string") {
                    data = JSON.parse(data);
                }
                const tabLength = data.length;

                for (let i = 0; i < tabLength; i++) {
                    const item = data[i];
                    const m = CustomButtons.newMenuitem(doc, {
                        label: item.title,
                        class: 'undo-item bookmark-item menuitem-with-favicon',
                        value: i,
                        oncommand: 'event.stopPropagation();event.preventDefault();undoCloseTab(event.originalTarget.getAttribute("value"));',
                    });

                    const state = item.state;
                    let idx = state.index;
                    if (idx == 0)
                        idx = state.entries.length;
                    if (--idx >= 0 && state.entries[idx])
                        m.setAttribute("targetURI", state.entries[idx].url);

                    if (typeof item.image === 'string') m.setAttribute('image', item.image);
                    menu.insertBefore(m, doc.getElementById('CB-undoCloseTab-menuseparator'));
                }

                event.preventDefault();
                menu.openPopup(event.target, "after_end", 0, 0);
            },
            popup: [{
                id: 'CB-undoCloseTab-menuseparator'
            }, {
                label: $L("reopen all tabs"),
                image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTI0IDZDMTQuNzcxOTQ4IDYgNy4xNTEyOTY5IDEyLjk4NjUwOSA2LjEyNjk1MzEgMjEuOTQ1MzEyTDQuMTIxMDkzOCAxOS45Mzk0NTMgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMy4wNDQ5MjE5IDE5LjQ4NDM3NSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyIDIyLjA2MDU0N0w2LjUgMjYuNTYwNTQ3IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDguNjIxMDkzOCAyNi41NjA1NDdMMTMuMTIxMDk0IDIyLjA2MDU0NyBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxMSAxOS45Mzk0NTNMOS4xODU1NDY5IDIxLjc1MzkwNkMxMC4yNjc3MzkgMTQuNTI1MzA5IDE2LjQ2MzM1IDkgMjQgOUMzMi4zMDI0IDkgMzkgMTUuNjk3NiAzOSAyNEMzOSAzMi4zMDI0IDMyLjMwMjQgMzkgMjQgMzlDMTguMTU4MzM3IDM5IDEzLjExNjYzNSAzNS42NzIwMDEgMTAuNjM0NzY2IDMwLjgxNjQwNiBBIDEuNTAwNjc2NiAxLjUwMDY3NjYgMCAwIDAgNy45NjI4OTA2IDMyLjE4MzU5NEMxMC45NDMwMjEgMzguMDEzOTk5IDE3LjAxNzY2MyA0MiAyNCA0MkMzMy45MjM2IDQyIDQyIDMzLjkyMzYgNDIgMjRDNDIgMTQuMDc2NCAzMy45MjM2IDYgMjQgNiB6IE0gMjQgMTlDMjIuNDU4MzM0IDE5IDIxLjExMjE0OCAxOS42MzIxMzMgMjAuMjUzOTA2IDIwLjU5NzY1NkMxOS4zOTU2NjQgMjEuNTYzMTc5IDE5IDIyLjc5MTY2NyAxOSAyNEMxOSAyNS4yMDgzMzMgMTkuMzk1NjY0IDI2LjQzNjgyMSAyMC4yNTM5MDYgMjcuNDAyMzQ0QzIxLjExMjE0OCAyOC4zNjc4NjcgMjIuNDU4MzM0IDI5IDI0IDI5QzI1LjU0MTY2NiAyOSAyNi44ODc4NTIgMjguMzY3ODY3IDI3Ljc0NjA5NCAyNy40MDIzNDRDMjguNjA0MzM2IDI2LjQzNjgyMSAyOSAyNS4yMDgzMzMgMjkgMjRDMjkgMjIuNzkxNjY3IDI4LjYwNDMzNiAyMS41NjMxNzkgMjcuNzQ2MDk0IDIwLjU5NzY1NkMyNi44ODc4NTIgMTkuNjMyMTMzIDI1LjU0MTY2NiAxOSAyNCAxOSB6IE0gMjQgMjJDMjQuNzkxNjY2IDIyIDI1LjE5NTQ4MiAyMi4yNDI4NjcgMjUuNTAzOTA2IDIyLjU4OTg0NEMyNS44MTIzMyAyMi45MzY4MjEgMjYgMjMuNDU4MzMzIDI2IDI0QzI2IDI0LjU0MTY2NyAyNS44MTIzMyAyNS4wNjMxNzkgMjUuNTAzOTA2IDI1LjQxMDE1NkMyNS4xOTU0ODIgMjUuNzU3MTMzIDI0Ljc5MTY2NiAyNiAyNCAyNkMyMy4yMDgzMzQgMjYgMjIuODA0NTE4IDI1Ljc1NzEzMyAyMi40OTYwOTQgMjUuNDEwMTU2QzIyLjE4NzY3IDI1LjA2MzE3OSAyMiAyNC41NDE2NjcgMjIgMjRDMjIgMjMuNDU4MzMzIDIyLjE4NzY3IDIyLjkzNjgyMSAyMi40OTYwOTQgMjIuNTg5ODQ0QzIyLjgwNDUxOCAyMi4yNDI4NjcgMjMuMjA4MzM0IDIyIDI0IDIyIHoiIC8+PC9zdmc+",
                onclick: function (event) {
                    this.parentNode.querySelectorAll('.undo-item').forEach(m => m.doCommand());
                }
            }]
        }, {
            id: 'CB-ZoomControl',
            label: $L("zoom control"),
            tooltiptext: $L("zoom control tooltip"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTY0MS40MDggMTYwYTMzNC40OTYgMzM0LjQ5NiAwIDAgMC0xOTcuMjgtNjRjLTE4NS42IDAtMzM2IDE1MC40MzItMzM2IDMzNnMxNTAuNCAzMzYgMzM2IDMzNmMxNjkuMjggMCAzMDkuMzEyLTEyNS4xODQgMzMyLjU3Ni0yODhoLTMyLjM1MmEzMDQgMzA0IDAgMSAxLTMwMC4yMjQtMzUyYzUyLjA5NiAwIDk2IDguODk2IDEzOC44OCAzMmg1OC40eiBtMzguNDk2IDUxMy45MmE0OCA0OCAwIDAgMCAwIDY3LjkwNGwxNTguNCAxNTguNGE0OCA0OCAwIDAgMCA2Ny44NzItNjcuOTA0bC0xNTguNC0xNTguNGE0OCA0OCAwIDAgMC02Ny44NzIgMHpNNzY0LjEyOCAyMDhoLTExMnYzMmgxMTJWMzUyaDMyVjI0MGgxMTJ2LTMyaC0xMTJWOTZoLTMydjExMnogbS0xMTIgMTkydjMyaDI1NnYtMzJoLTI1NnogbS0xNzMuNTM2LTE3My4xNTJsMjIuNzUyLTI3Ljk2OGEyNDAgMjQwIDAgMCAwLTI3My43OTIgMzM2LjY3MmwyMi43Mi0yNy45NjhhMjA4IDIwOCAwIDAgMSAyMjguMzItMjgwLjczNnoiPjwvcGF0aD48L3N2Zz4=",
            oncontextmenu: 'return(false);',
            onclick: 'if (event.button == 0) { \
        FullZoom.enlarge(); \
    }; \
    if (event.button == 1) { \
        FullZoom.reset(); \
    }; \
    if (event.button == 2) { \
        FullZoom.reduce(); \
    };',
            onwheel: 'if (event.deltaY < 0) { \
        FullZoom.enlarge(); \
    } else { \
        FullZoom.reduce(); \
    };'
        }, {
            id: 'CB-ViewCert',
            label: $L("certificate manager"),
            tooltiptext: $L("certificate manager tooltip"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI1IDJDMTIuMjk2ODc1IDIgMiAxMi4yOTY4NzUgMiAyNUMyIDM3LjcwMzEyNSAxMi4yOTY4NzUgNDggMjUgNDhDMzcuNzAzMTI1IDQ4IDQ4IDM3LjcwMzEyNSA0OCAyNUM0OCAxMi4yOTY4NzUgMzcuNzAzMTI1IDIgMjUgMiBaIE0gMjUgNEMzNi41NzgxMjUgNCA0NiAxMy40MjE4NzUgNDYgMjVDNDYgMzYuNTc4MTI1IDM2LjU3ODEyNSA0NiAyNSA0NkMxMy40MjE4NzUgNDYgNCAzNi41NzgxMjUgNCAyNUM0IDEzLjQyMTg3NSAxMy40MjE4NzUgNCAyNSA0IFogTSAyNSA4QzIwLjAzNTE1NiA4IDE2IDEyLjAzNTE1NiAxNiAxN0wxNiAyMUwyMiAyMUwyMiAxN0MyMiAxNS4zNDc2NTYgMjMuMzQ3NjU2IDE0IDI1IDE0QzI2LjY1MjM0NCAxNCAyOCAxNS4zNDc2NTYgMjggMTdMMjggMjFMMzQgMjFMMzQgMTdDMzQgMTIuMDM1MTU2IDI5Ljk2NDg0NCA4IDI1IDggWiBNIDI1IDEwQzI4Ljg2NzE4OCAxMCAzMiAxMy4xMzI4MTMgMzIgMTdMMzIgMTlMMzAgMTlMMzAgMTdDMzAgMTQuMjM4MjgxIDI3Ljc2MTcxOSAxMiAyNSAxMkMyMi4yMzgyODEgMTIgMjAgMTQuMjM4MjgxIDIwIDE3TDIwIDE5TDE4IDE5TDE4IDE3QzE4IDEzLjEzMjgxMyAyMS4xMzI4MTMgMTAgMjUgMTAgWiBNIDE2IDIyQzEzLjc5Mjk2OSAyMiAxMiAyMy43OTI5NjkgMTIgMjZMMTIgMzZDMTIgMzguMjA3MDMxIDEzLjc5Mjk2OSA0MCAxNiA0MEwzNCA0MEMzNi4yMDcwMzEgNDAgMzggMzguMjA3MDMxIDM4IDM2TDM4IDI2QzM4IDIzLjc5Mjk2OSAzNi4yMDcwMzEgMjIgMzQgMjIgWiBNIDE2IDI0TDM0IDI0QzM1LjEwNTQ2OSAyNCAzNiAyNC44OTQ1MzEgMzYgMjZMMzYgMzZDMzYgMzcuMTA1NDY5IDM1LjEwNTQ2OSAzOCAzNCAzOEwxNiAzOEMxNC44OTQ1MzEgMzggMTQgMzcuMTA1NDY5IDE0IDM2TDE0IDI2QzE0IDI0Ljg5NDUzMSAxNC44OTQ1MzEgMjQgMTYgMjQgWiBNIDE3IDI2QzE2LjQ0OTIxOSAyNiAxNiAyNi40NDkyMTkgMTYgMjdMMTYgMzVDMTYgMzUuNTUwNzgxIDE2LjQ0OTIxOSAzNiAxNyAzNkMxNy41NTA3ODEgMzYgMTggMzUuNTUwNzgxIDE4IDM1TDE4IDI3QzE4IDI2LjQ0OTIxOSAxNy41NTA3ODEgMjYgMTcgMjYgWiBNIDI1IDI2QzIzLjg5NDUzMSAyNiAyMyAyNi44OTQ1MzEgMjMgMjhDMjMgMjguNzE0ODQ0IDIzLjM4MjgxMyAyOS4zNzUgMjQgMjkuNzMwNDY5TDI0IDM1TDI2IDM1TDI2IDI5LjczMDQ2OUMyNi42MTcxODggMjkuMzcxMDk0IDI3IDI4LjcxNDg0NCAyNyAyOEMyNyAyNi44OTQ1MzEgMjYuMTA1NDY5IDI2IDI1IDI2WiIgLz4NCjwvc3ZnPg==",
            oncommand: "window.open('chrome://pippki/content/certManager.xhtml', 'mozilla:certmanager', 'chrome,resizable=yes,all,width=830,height=400');"

        }, {
            id: 'CB-CleanHistory',
            label: $L("clean history"),
            tooltiptext: $L("clean history toolip"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy42MjQgMi45NTggQyA3LjY0IDIuNTIgNy43NzMgMi4wMjEgNy45NzMgMS42ODkgQyA4LjE3NSAxLjM1MiA4LjUzNyAxLjAyIDguODU5IDAuODIgQyA5LjE5MiAwLjY0MiA5LjY1OCAwLjQ5NiAxMC4wNTEgMC40ODkgQyAxMC40MzkgMC40ODMgMTAuOTM5IDAuNjE3IDExLjMyNiAwLjgyMiBDIDExLjUwMSAwLjkyNyAxMS42OTggMS4wOCAxMS44NCAxLjIxOCBDIDExLjk3OSAxLjM2MyAxMi4xMjkgMS41NiAxMi4yMjkgMS43MjcgQyAxMi4zMjQgMS44OTkgMTIuNDIgMi4xMjUgMTIuNDcyIDIuMzE1IEMgMTIuNTI0IDIuNTA3IDEyLjU1NCAyLjc1NSAxMi41NTcgMi45NTggTCAxMi41NTcgNy4zNTggTCAxNy43MDggNy4zNTggTCAxNy43MDggMTkuMTU5IEwgMi40NzQgMTkuMTU5IEwgMi40NzQgNy4zNTggTCA3LjYyNCA3LjM1OCBaIE0gOS4xMjQgOC44NTggTCAzLjk3NCA4Ljg1OCBMIDMuOTc0IDEwLjc5MSBMIDE2LjIwOCAxMC43OTEgTCAxNi4yMDggOC44NTggTCAxMS4wNTcgOC44NTggTCAxMS4wNTcgMi45NTggQyAxMS4wNiAyLjg1NSAxMS4wNSAyLjgwMyAxMS4wMjQgMi43MDcgQyAxMC45OTggMi42MDkgMTAuOTggMi41NTkgMTAuOTI4IDIuNDc0IEMgMTAuODggMi4zODYgMTAuODUgMi4zNDQgMTAuNzc4IDIuMjc3IEMgMTAuNzA5IDIuMjA0IDEwLjY2NiAyLjE2OSAxMC41NzUgMi4xMiBDIDEwLjM5IDEuOTk2IDEwLjI3OSAxLjk4NSAxMC4wNzcgMS45ODkgQyA5Ljg4IDEuOTkyIDkuNzc2IDIuMDExIDkuNjA3IDIuMTIxIEMgOS40MyAyLjIxMSA5LjM2MSAyLjI5MiA5LjI1OSAyLjQ2MSBDIDkuMTU1IDIuNjM1IDkuMTA4IDIuNzM2IDkuMTI0IDIuOTU4IFogTSAzLjk3NCAxNy42NTkgTCA1LjkwNyAxNy42NTkgTCA1LjkwNyAxMy41NzIgTCA3LjQwNyAxMy41NzIgTCA3LjQwNyAxNy42NTkgTCA5LjM0MSAxNy42NTkgTCA5LjM0MSAxMy41NzIgTCAxMC44NDEgMTMuNTcyIEwgMTAuODQxIDE3LjY1OSBMIDEyLjc3NSAxNy42NTkgTCAxMi43NzUgMTMuNTcyIEwgMTQuMjc1IDEzLjU3MiBMIDE0LjI3NSAxNy42NTkgTCAxNi4yMDggMTcuNjU5IEwgMTYuMjA4IDEyLjI5MSBMIDMuOTc0IDEyLjI5MSBaIiBzdHlsZT0iIi8+Cjwvc3ZnPg==",
            oncommand: "window.open('chrome://browser/content/sanitize.xhtml', 'Toolkit:SanitizeDialog', 'chrome,resizable=yes');"
        }, {
            id: 'CB-AboutConfig',
            label: $L("about config"),
            image: "chrome://global/skin/icons/settings.svg",
            oncommand: `openTrustedLinkIn('about:config', gBrowser.currentURI.spec === AboutNewTab.newTabURL || gBrowser.currentURI.spec === HomePage.get(window) ? "current" : "tab")`,
        }, {
            id: 'CB-SyncedTabs',
            label: $L("synced tabs"),
            tooltiptext: $L("synced tabs"),
            image: "chrome://browser/skin/tab.svg",
            oncommand: "SidebarUI.toggle('viewTabsSidebar');",
        }, {
            id: 'CB-DownloadHistory',
            label: $L("downloads history"),
            tooltiptext: $L("downloads history"),
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIuNDE0IDVIMjFhMSAxIDAgMCAxIDEgMXYxNGExIDEgMCAwIDEtMSAxSDNhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMSAxLTFoNy40MTRsMiAyek00IDV2MTRoMTZWN2gtOC40MTRsLTItMkg0em05IDhoM2wtNCA0LTQtNGgzVjloMnY0eiIvPjwvc3ZnPg==",
            oncommand: "DownloadsPanel.showDownloadsHistory();"
        }, {
            id: 'CB-BookmarksManager',
            label: $L("bookmarks manager"),
            tooltiptext: $L("bookmarks manager"),
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTMgMjF2MmgtMnYtMkgzYTEgMSAwIDAgMS0xLTFWNGExIDEgMCAwIDEgMS0xaDZhMy45OSAzLjk5IDAgMCAxIDMgMS4zNTRBMy45OSAzLjk5IDAgMCAxIDE1IDNoNmExIDEgMCAwIDEgMSAxdjE2YTEgMSAwIDAgMS0xIDFoLTh6bTctMlY1aC01YTIgMiAwIDAgMC0yIDJ2MTJoN3ptLTkgMFY3YTIgMiAwIDAgMC0yLTJINHYxNGg3eiIvPjwvc3ZnPg==",
            oncommand: "PlacesCommandHook.showPlacesOrganizer('AllBookmarks');"
        }];

    window.CustomButtons = {
        _btnId: 1,
        $C: $C,
        $L: $L,
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get browserWin() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get btnId() {
            return this._btnId++;
        },
        get debug() {
            return Services.prefs.getBoolPref("userChromeJS.CopyCat.debug", false);
        },
        get toolsPath() {
            delete this.toolsPath
            let path = Services.dirsvc.get("ProfD", Ci.nsIFile);
            path.appendRelativePath("chrome\\UserTools");
            if (!path.exists()) {
                path.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
            }
            return this.toolsPath = path;
        },
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        init: function () {
            if (this.debug) this.log("CustomButtons: init started!");
            this.style = addStyle(this.sss, css);
            if (!BTN_CONFIG) {
                if (this.debug) this.log($L("buttons config has some mistake"));
                return;
            }
            this.rebuild();
            if (this.debug) this.log("CustomButtons: init complete!");
        },
        uninit: function (win) {
            if (this.btnIds instanceof Array) {
                this.btnIds.forEach(id => {
                    if (this.debug) this.log($L("CustomButtons: destroying button [%s]"), id);
                    win.CustomizableUI.destroyWidget(id);
                });
            }
            this.btnIds = null;
        },
        rebuild() {
            this.uninit();
            this.btnIds = this.createButtons();
        },
        destroy(win) {
            this.uninit(win);
            if (this.style) removeStyle(this.sss, this.style);
            delete win.CustomButtons;
        },
        createButtons() {
            if (!BTN_CONFIG) {
                if (this.debug) this.log($L("CustomButtons: no buttons configuration"));
                return;
            }
            if (this.debug) this.log($L("CustomButtons: creating buttons"));
            let btnIds = [];
            Object.values(BTN_CONFIG).forEach(obj => {
                if (obj.id && !CustomizableUI.getPlacementOfWidget(obj.id, true)) {
                    this.createButton(obj);
                }
                btnIds.push(obj.id);
            });
            return btnIds;
        },
        createButton(obj) {
            obj.id = obj.id || "CB-" + this.btnId;
            obj.label = obj.label || "Custom Button";
            obj.defaultArea = obj.defaultArea || CustomizableUI.AREA_NAVBAR;
            obj.class = obj.class ? obj.class + ' custom-button' : 'custom-button';
            if (obj.tool) {
                obj.exec = this.handleRelativePath(obj.tool, this.toolsPath.path);
                delete obj.tool;
            }
            if (obj.exec) {
                obj.exec = this.handleRelativePath(obj.exec);
            }
            CustomizableUI.createWidget({
                id: obj.id,
                type: 'custom',
                localized: false,
                defaultArea: obj.defaultArea,
                onBuild: aDoc => {
                    let btn;
                    try {
                        btn = this.$C(aDoc, 'toolbarbutton', obj, ['type', 'popup', 'onBuild']);
                        'toolbarbutton-1 chromeclass-toolbar-additional'.split(' ').forEach(c => btn.classList.add(c));
                        if (obj.popup) {
                            let popup = this.newMenuPopup(aDoc, obj.popup);
                            if (popup) {
                                let id = obj.id + '-popup';
                                btn.setAttribute('type', obj.type || "menu");
                                btn.setAttribute(obj.type || "menu", id);
                                btn.appendChild(popup);
                                popup.setAttribute('id', id);
                            }
                        }
                        if (obj.onBuild) {
                            if (typeof obj.onBuild == 'function') {
                                obj.onBuild(btn, doc);
                            } else {
                                // need to implement
                            }
                        }
                        if (!obj.oncommand)
                            btn.setAttribute("oncommand", "CustomButtons.onCommand(event);");
                    } catch (e) {
                        this.error(e);
                    }
                    return btn;
                }
            });
            return CustomizableUI.getWidget(obj.id).forWindow(window).node;
        },
        newMenuPopup(doc, obj) {
            if (!obj) return;
            let popup = $C(doc, 'menupopup');
            obj.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) popup.appendChild(el);
            });
            popup.classList.add("CustomButtons-Popup");
            return popup;
        },
        newMenuGroup(doc, obj) {
            if (!obj) return;
            let group = $C(doc, 'menugroup', obj, ["group", "popup"]);
            obj.group.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) group.appendChild(el);
            })
            group.classList.add("CustomButtons-Group");
            return group;
        },
        newMenuitem(doc, obj) {
            if (!obj) return;
            if (obj.group) {
                return this.newMenuGroup(doc, obj);
            }
            let item
            if (obj.popup) {
                item = $C(doc, "menu", obj, ["popup"]);
                item.classList.add("menu-iconic");
                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    } else {
                        eval("(" + obj.onBuild + ").call(el, doc, item)")
                    }
                }
                item.appendChild(this.newMenuPopup(doc, obj.popup));
            } else {

                let classList = [],
                    tagName = obj.type || 'menuitem';
                if (['separator', 'menuseparator'].includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.image && !obj.command && !obj.pref) {
                    return $C(doc, 'menuseparator', obj, ['type', 'group', 'popup']);
                }

                if (['checkbox', 'radio'].includes(obj.type)) tagName = 'menuitem';
                if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
                classList.push(tagName + '-iconic');

                if (obj.tool) {
                    obj.exec = this.handleRelativePath(obj.tool, this.toolsPath.path);
                    delete obj.tool;
                }

                if (obj.exec) {
                    obj.exec = this.handleRelativePath(obj.exec);
                }

                if (obj.command) {
                    // 移动菜单
                    let org = $(obj.command, doc);
                    if (org) {
                        let replacement = $C(doc, 'menuseparator', {
                            hidden: true,
                            class: 'CustomButtons-Replacement',
                            'original-id': obj.command
                        });
                        org.parentNode.insertBefore(replacement, org);
                        return org;
                    } else {
                        return $C(doc, 'menuseparator', { hidden: true });
                    }
                } else {
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                    if (classList.length) item.setAttribute('class', classList.join(' '));
                    $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type']);
                    item.setAttribute('label', obj.label || obj.command || obj.oncommand);

                    if (obj.pref) {
                        let type = cPref.getType(obj.pref) || obj.type || 'unknown';
                        const map = {
                            string: 'prompt',
                            int: 'prompt',
                            boolean: 'checkbox',
                        }
                        const defaultVal = {
                            string: '',
                            int: 0,
                            bool: false
                        }
                        if (map[type]) item.setAttribute('type', map[type]);
                        if (!obj.defaultValue) item.setAttribute('defaultValue', defaultVal[type]);
                        if (map[type] === 'checkbox') {
                            item.setAttribute('checked', !!cPref.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                            this.addPrefListener(obj.pref, function (value, pref) {
                                item.setAttribute('checked', value);
                                if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                            });
                        } else {
                            let value = cPref.get(obj.pref);
                            if (value) {
                                item.setAttribute('value', value);
                                item.setAttribute('label', $S(obj.label, value));
                            }
                            this.addPrefListener(obj.pref, function (value, pref) {
                                item.setAttribute('label', $S(obj.label, value || item.getAttribute('default')));
                                if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                            });
                        }
                    }
                }


                if (!obj.pref && !obj.onclick)
                    item.setAttribute("onclick", "checkForMiddleClick(this, event)");

                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    }
                }

                if (this.debug) this.log('createMenuItem', tagName, item);
            }

            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)")
                }
            }

            if (obj.oncommand || obj.command)
                return item;

            item.setAttribute("oncommand", "CustomButtons.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            return item;
        },
        onCommand: function (event) {
            event.stopPropagation();
            event.preventDefault();
            let item = event.target;
            let precommand = item.getAttribute('precommand') || "",
                postcommand = item.getAttribute("postcommand") || "",
                pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "",
                where = item.getAttribute("where") || "";
            if (precommand) eval(precommand);
            if (pref)
                this.handlePref(event, pref);
            else if (exec)
                this.exec(exec, text);
            else if (edit)
                this.edit(edit);
            else if (url)
                this.openCommand(event, url, where);
            if (postcommand) eval(postcommand);
        },
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log('openCommand', 'url is invalid', url);
            }
            if (uri.scheme === "javascript") {
                try {
                    loadURI(url);
                } catch (e) {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                if (this.appVersion < 78) {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } else {
                    openUILinkIn(uri.spec, where, {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(uri.spec) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            )
                    });
                }
            } else if (event.button == 1) {
                if (this.appVersion < 78) {
                    openNewTabWith(uri.spec);
                } else {
                    openNewTabWith(uri.spec, 'tab', {
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } else {
                if (this.appVersion < 78)
                    openUILink(uri.spec, event);
                else {
                    openUILink(uri.spec, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            }
        },
        edit: function (edit) {
            if (this.debug) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg) {
            if (debug) this.log('exec', path, arg);
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var a;
                if (typeof arg == "undefined") arg = []; // fix slice error
                if (typeof arg == 'string' || arg instanceof String) {
                    a = arg.split(/\s+/)
                } else if (Array.isArray(arg)) {
                    a = arg;
                } else {
                    a = [arg];
                }

                file.initWithPath(path);
                if (!file.exists()) {
                    this.error($L("file not found").replace("%s", path))
                    return;
                }

                if (file.isExecutable()) {
                    process.init(file);
                    process.runw(false, a, a.length);
                } else {
                    file.launch();
                }
            } catch (e) {
                this.error(e);
            }
        },
        handleRelativePath: function (path, parentPath) {
            if (path) {
                let handled = false;
                path = this.replaceArray(path, [
                    "{homeDir}",
                    "{libDir}",
                    "{localProfileDir}",
                    "{profileDir}",
                    "{tmpDir}"
                ], [
                    "{Home}",
                    "{GreD}",
                    "{ProfLD}",
                    "{ProfD}",
                    "{TmpD}"
                ]);
                ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
                    if (path.includes("{" + key + "}")) {
                        path = path.replace("{" + key + "}", this._paths[key] || "");
                        handled = true;
                    }
                })
                if (!handled) {
                    path = path.replace(/\//g, '\\').toLocaleLowerCase();
                    if (/^(\\)/.test(path)) {
                        if (!parentPath) {
                            parentPath = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                        }
                        path = parentPath + path;
                        path = path.replace("\\\\", "\\");
                    }
                }
                return path;
            }
        },
        replaceArray: function (replaceString, find, replace) {
            var regex;
            for (var i = 0; i < find.length; i++) {
                regex = new RegExp(find[i], "g");
                replaceString = replaceString.replace(regex, replace[i]);
            }
            return replaceString;
        },
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(this.handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    if (this.debug) this.error(e);
                    return;
                }
                // if (!aFile.exists() || !aFile.isExecutable()) {
                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = this.getURLSpecFromFile(aFile);
                        menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                    } else {
                        menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            if (obj.keyword) {
                let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                if (engine) {
                    if (isPromise(engine)) {
                        engine.then(function (engine) {
                            if (engine.iconURI) menu.setAttribute("image", engine.iconURI.spec);
                        });
                    } else if (engine.iconURI) {
                        menu.setAttribute("image", engine.iconURI.spec);
                    }
                    return;
                }
            }
            var setIconCallback = function (url) {
                let uri, iconURI;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    this.log(e)
                }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ?
                                "moz-anno:favicon:" + aURI.spec :
                                "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
                        } catch (e) {
                        }
                    }
                });
            }
            PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                let url;
                if (entry) {
                    url = entry.url.href;
                } else {
                    url = (obj.url + '').replace(this.regexp, "");
                }
                setIconCallback(url);
            }, e => {
                this.log(e)
            }).catch(e => {
            });
        },
        alert: function (aMsg, aTitle, aCallback) {
            var callback = aCallback ? {
                observe: function (subject, topic, data) {
                    if ("alertclickcallback" != topic)
                        return;
                    aCallback.call(null);
                }
            } : null;
            var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            alertsService.showAlertNotification(
                this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "DownloadPlus",
                aMsg + "", !!callback, "", callback);
        },
        error: function () {
            this.browserWin.console.error(Array.prototype.slice.call(arguments));
        },
        log: function () {
            this.browserWin.console.log(Array.prototype.slice.call(arguments));
        },
    }

    /**
     * 获取  DOM 元素
     * @param {string} id
     * @param {Document} aDoc
     * @returns
     */
    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    /**
     * 创建 DOM 元素
     * @param {string} tag DOM 元素标签
     * @param {object} attr 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns
     */
    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

    /**
     * 应用属性
     * @param {Element} el DOM 对象
     * @param {object} obj 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns
     */
    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    /**
     * 获取本地化文本
     * @param {string} str
     * @param {string|null} replace
     * @returns
     */
    function $L(str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else
            return "";
    }

    /**
     * 替换 %s 为指定文本
     * @param {string} str
     * @param {string} replace
     * @returns
     */
    function $S(str, replace) {
        str || (str = '');
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    function addStyle(sss, css, type = 0) {
        if (sss instanceof Ci.nsIStyleSheetService && typeof css === "string") {
            let STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)), type: type
            }
            sss.loadAndRegisterSheet(STYLE.url, STYLE.type);
            return STYLE;
        }
    }

    function removeStyle(sss, style) {
        if (sss instanceof Ci.nsIStyleSheetService && style && style.url && style.type) {
            sss.unregisterSheet(style.url, style.type);
            return true;
        }
        return false;
    }

    /**
     * 克隆对象
     * @param {object} o
     * @returns
     */
    function cloneObj(o) {
        if (typeof (o) === typeof (1) || typeof ('') === typeof (o) || typeof (o) === typeof (true) ||
            typeof (o) === typeof (undefined)) {
            return o
        }
        if (Array.isArray(o)) {
            let arr = []
            for (let key in o) {
                arr.push(cloneObj(o[key]))
            }
            return arr
        }
        if (typeof (o) === typeof ({})) {
            if (o === null) {
                return o
            }
            let obj = {}
            for (let key in o) {
                obj[key] = cloneObj(o[key])
            }
            return obj
        }
        return o;
    }

    function getURLSpecFromFile(aFile) {
        var aURL;
        if (typeof userChrome !== "undefined" && typeof userChrome.getURLSpecFromFile !== "undefined") {
            aURL = userChrome.getURLSpecFromFile(aFile);
        } else if (this.appVersion < 92) {
            aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
        } else {
            aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
        }
        return aURL;
    }

    function replaceArray(replaceString, find, replace) {
        var regex;
        for (var i = 0; i < find.length; i++) {
            regex = new RegExp(find[i], "g");
            replaceString = replaceString.replace(regex, replace[i]);
        }
        return replaceString;
    }

    window.CustomButtons.init(window);
})(`
    #context-take-screenshot, #context-sep-screenshots {
        display: none;
    }
    .CB-Group > .menuitem-iconic {
        padding-block: 0.5em;
    }
    
    .CB-Group > .menuitem-iconic:first-child {
        padding-inline-start: 1em;
    }
    .CB-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
    .CB-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
    .CB-Group > :is(menu, menuitem) > .menu-accel-container {
        display: none;
    }

    .CB-Group.showFirstText > :is(menu, menuitem):first-child,
    .CB-Group.showText > :is(menu, menuitem) {
        -moz-box-flex: 1;
        padding-inline-end: .5em;
    }
    .CB-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
        padding-left: 0;
        -moz-box-flex: 0;
    }
    .CB-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) > .menu-iconic-left {
        margin-inline-start: 8px;
        margin-inline-end: 8px;
    }
    .CB-Popup menuseparator+menuseparator {
        visibility: collapse;
    }
    .CB-Popup menuseparator:last-child {
        /* 懒得研究为什么多了一个分隔符 */
        visibility: collapse;
    }

    .CB-Popup .menuitem-iconic.reload {
        list-style-image: url(chrome://devtools/content/debugger/images/reload.svg) !important;
    }

    .CB-Popup .menuitem-iconic.option {
        list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
    }

    .CB-Popup .menu-iconic.skin,
    .CB-Popup .menuitem-iconic.skin {
        list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik03MDYuNTQ1IDEyOC4wMTlhNjMuOTg1IDYzLjk4NSAwIDAgMSA0OC41OTkgMjIuMzYzbDE3Mi44MzUgMjAxLjc2My02My45OTYgMTI3Ljg1Ny00MS4zNzQtNDEuMzcxYy02LjI1LTYuMjQ4LTE0LjQzNy05LjM3Mi0yMi42MjQtOS4zNzItOC4xODggMC0xNi4zNzQgMy4xMjQtMjIuNjI0IDkuMzcyYTMyLjAwNiAzMi4wMDYgMCAwIDAtOS4zNzUgMjIuNjI2djQwMi43MjdjMCAxNy42NzItMTQuMzI3IDMxLjk5OC0zMS45OTkgMzEuOTk4SDMyMC4wMWMtMTcuNjcxIDAtMzEuOTk4LTE0LjMyNi0zMS45OTgtMzEuOTk4VjQ2MS4yNTZjMC0xNy42NzItMTQuMzI4LTMxLjk5OC0zMi0zMS45OThhMzEuOTk3IDMxLjk5NyAwIDAgMC0yMi42MjQgOS4zNzJsLTQxLjM3MyA0MS4zNzFMOTYuMDIgMzUyLjAwN2wxNzIuODM1LTIwMS42NGE2My45ODcgNjMuOTg3IDAgMCAxIDQ4LjU5Mi0yMi4zNDhoNi41MDdhOTUuOTcgOTUuOTcgMCAwIDEgNTAuMTMgMTQuMTMyQzQyOC4zNyAxNzUuMzk0IDQ3NC4zMzggMTkyLjAxNSA1MTIgMTkyLjAxNXM4My42MjktMTYuNjIxIDEzNy45MTUtNDkuODY0YTk1Ljk2OCA5NS45NjggMCAwIDEgNTAuMTMtMTQuMTMyaDYuNW0wLTYzLjk5OGgtNi41YTE1OS44OSAxNTkuODkgMCAwIDAtODMuNTU3IDIzLjU1OEM1NjEuOTA0IDEyMSA1MjkuNTM3IDEyOC4wMTggNTEyIDEyOC4wMThjLTE3LjUzOCAwLTQ5LjkwNC03LjAxNy0xMDQuNDk1LTQwLjQ0NmExNTkuODgxIDE1OS44ODEgMCAwIDAtODMuNTUtMjMuNTVoLTYuNTA4YTEyNy44MjMgMTI3LjgyMyAwIDAgMC05Ny4xODIgNDQuNzAxTDQ3LjQyOCAzMTAuMzZjLTE5LjUyMiAyMi43NzQtMjAuNiA1Ni4wNS0yLjYxIDgwLjA0N0wxNDAuODE1IDUxOC40YTYzLjk5OCA2My45OTggMCAwIDAgODMuMTk5IDE3LjAyNXYzMjguNTU4YzAgNTIuOTMyIDQzLjA2IDk1Ljk5NSA5NS45OTUgOTUuOTk1aDQxNS45OGM1Mi45MzUgMCA5NS45OTYtNDMuMDYzIDk1Ljk5Ni05NS45OTVWNTM1LjQyNWE2NC4wMjggNjQuMDI4IDAgMCAwIDQyLjI0IDcuNzQ5IDY0LjAxNCA2NC4wMTQgMCAwIDAgNDYuOTktMzQuNTI4bDYzLjk5Ny0xMjcuODU3YzExLjUyMi0yMy4wMjggOC4xMjUtNTAuNzIyLTguNjMzLTcwLjI3OUw4MDMuNzQ0IDEwOC43NDdjLTI0LjMzNi0yOC40MjItNTkuNzctNDQuNzI2LTk3LjItNDQuNzI2eiIgcC1pZD0iMTI4MiI+PC9wYXRoPjwvc3ZnPg==) !important;
    }
`, false);