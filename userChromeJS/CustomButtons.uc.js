// ==UserScript==
// @name            CustomButtons.uc.js
// @description     添加多个自定义按钮，截图、UndoCloseTab、证书管理器、放大缩小、清除历史记录、高级首选项、受同步的标签页、下载历史、管理书签
// @author          Ryan
// @version         0.1.2
// @charset         UTF-8
// @compatibility   Firefox 73
// @startup         window.CustomButtons.init();
// @shutdown        window.CustomButtons.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            从 CopyCat.uc.js 修改而来
// ==/UserScript==
location.href.startsWith('chrome://browser/content/browser.x') && (function (css, debug) {
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    ChromeUtils.import("resource:///modules/CustomizableUI.jsm");
    ChromeUtils.import("resource://gre/modules/Services.jsm");


    if (window.CustomButtons) {
        window.CustomButtons.destroy();
        delete window.CustomButtons;
    }

    const TOOLS_PATH = "chrome\\resources\\tools"; // 工具路径

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
        }
    }

    if (!window.cPref) {
        window.cPref = {
            get: function (prefPath, defaultValue, setDefaultValueIfUndefined) {
                const sPrefs = Services.prefs;
                setDefaultValueIfUndefined = setDefaultValueIfUndefined || false;
                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            return defaultValue;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    if (setDefaultValueIfUndefined && typeof defaultValue !== undefined) this.set(prefPath, defaultValue);
                    return defaultValue;
                }
                return
            },
            getType: function (prefPath) {
                const sPrefs = Services.prefs;
                const map = {
                    0: undefined,
                    32: 'string',
                    64: 'int',
                    128: 'boolean'
                }
                try {
                    return map[sPrefs.getPrefType(prefPath)];
                } catch (ex) {
                    return map[0];
                }
            },
            set: function (prefPath, value) {
                const sPrefs = Services.prefs;
                switch (typeof value) {
                    case 'string':
                        return sPrefs.setCharPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },
            addListener: (a, b) => {
                let o = (q, w, e) => (b(cPref.get(e), e));
                Services.prefs.addObserver(a, o);
                return { pref: a, observer: o }
            },
            removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        };
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
            image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNNzkzIDI0MkgzNjZ2LTc0YzAtNi43LTcuNy0xMC40LTEyLjktNi4zbC0xNDIgMTEyYTggOCAwIDAgMCAwIDEyLjZsMTQyIDExMmM1LjIgNC4xIDEyLjkgMC40IDEyLjktNi4zdi03NGg0MTV2NDcwSDE3NWMtNC40IDAtOCAzLjYtOCA4djYwYzAgNC40IDMuNiA4IDggOGg2MThjMzUuMyAwIDY0LTI4LjcgNjQtNjRWMzA2YzAtMzUuMy0yOC43LTY0LTY0LTY0eiI+PC9wYXRoPjwvc3ZnPg==",
            onclick: function (event) {
                if (event.button === 1) {
                    try {
                        SessionStore.restoreLastSession();
                    } catch (e) { }
                    return;
                }
                if (event.button !== 2) return;
                const doc = (event.view && event.view.document) || document;
                const menu = doc.getElementById(event.target.getAttribute('contextmenu'));
                menu.querySelectorAll('.undo-item').forEach(i => i.remove());
                let data = SessionStore.getClosedTabData(window);
                if (typeof (data) === "string") {
                    data = JSON.parse(data);
                }
                const tabLength = data.length;

                for (let i = 0; i < tabLength; i++) {
                    const item = data[i];
                    const m = CustomButtons.createMenu({
                        label: item.title,
                        class: 'undo-item bookmark-item menuitem-with-favicon',
                        value: i,
                        oncommand: 'event.stopPropagation();event.preventDefault();undoCloseTab(event.originalTarget.getAttribute("value"));',
                    }, doc);

                    const state = item.state;
                    let idx = state.index;
                    if (idx == 0)
                        idx = state.entries.length;
                    if (--idx >= 0 && state.entries[idx])
                        m.setAttribute("targetURI", state.entries[idx].url);

                    if (typeof item.image === 'string') m.setAttribute('image', item.image);
                    menu.insertBefore(m, doc.getElementById('CB-undoCloseTab-menuseparator'));
                }
            },
            type: "contextmenu",
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
            id: 'zoom-control-ToolBarbutton',
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
            id: 'context-viewcert-ToolBarButton',
            label: $L("certificate manager"),
            tooltiptext: $L("certificate manager tooltip"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI1IDJDMTIuMjk2ODc1IDIgMiAxMi4yOTY4NzUgMiAyNUMyIDM3LjcwMzEyNSAxMi4yOTY4NzUgNDggMjUgNDhDMzcuNzAzMTI1IDQ4IDQ4IDM3LjcwMzEyNSA0OCAyNUM0OCAxMi4yOTY4NzUgMzcuNzAzMTI1IDIgMjUgMiBaIE0gMjUgNEMzNi41NzgxMjUgNCA0NiAxMy40MjE4NzUgNDYgMjVDNDYgMzYuNTc4MTI1IDM2LjU3ODEyNSA0NiAyNSA0NkMxMy40MjE4NzUgNDYgNCAzNi41NzgxMjUgNCAyNUM0IDEzLjQyMTg3NSAxMy40MjE4NzUgNCAyNSA0IFogTSAyNSA4QzIwLjAzNTE1NiA4IDE2IDEyLjAzNTE1NiAxNiAxN0wxNiAyMUwyMiAyMUwyMiAxN0MyMiAxNS4zNDc2NTYgMjMuMzQ3NjU2IDE0IDI1IDE0QzI2LjY1MjM0NCAxNCAyOCAxNS4zNDc2NTYgMjggMTdMMjggMjFMMzQgMjFMMzQgMTdDMzQgMTIuMDM1MTU2IDI5Ljk2NDg0NCA4IDI1IDggWiBNIDI1IDEwQzI4Ljg2NzE4OCAxMCAzMiAxMy4xMzI4MTMgMzIgMTdMMzIgMTlMMzAgMTlMMzAgMTdDMzAgMTQuMjM4MjgxIDI3Ljc2MTcxOSAxMiAyNSAxMkMyMi4yMzgyODEgMTIgMjAgMTQuMjM4MjgxIDIwIDE3TDIwIDE5TDE4IDE5TDE4IDE3QzE4IDEzLjEzMjgxMyAyMS4xMzI4MTMgMTAgMjUgMTAgWiBNIDE2IDIyQzEzLjc5Mjk2OSAyMiAxMiAyMy43OTI5NjkgMTIgMjZMMTIgMzZDMTIgMzguMjA3MDMxIDEzLjc5Mjk2OSA0MCAxNiA0MEwzNCA0MEMzNi4yMDcwMzEgNDAgMzggMzguMjA3MDMxIDM4IDM2TDM4IDI2QzM4IDIzLjc5Mjk2OSAzNi4yMDcwMzEgMjIgMzQgMjIgWiBNIDE2IDI0TDM0IDI0QzM1LjEwNTQ2OSAyNCAzNiAyNC44OTQ1MzEgMzYgMjZMMzYgMzZDMzYgMzcuMTA1NDY5IDM1LjEwNTQ2OSAzOCAzNCAzOEwxNiAzOEMxNC44OTQ1MzEgMzggMTQgMzcuMTA1NDY5IDE0IDM2TDE0IDI2QzE0IDI0Ljg5NDUzMSAxNC44OTQ1MzEgMjQgMTYgMjQgWiBNIDE3IDI2QzE2LjQ0OTIxOSAyNiAxNiAyNi40NDkyMTkgMTYgMjdMMTYgMzVDMTYgMzUuNTUwNzgxIDE2LjQ0OTIxOSAzNiAxNyAzNkMxNy41NTA3ODEgMzYgMTggMzUuNTUwNzgxIDE4IDM1TDE4IDI3QzE4IDI2LjQ0OTIxOSAxNy41NTA3ODEgMjYgMTcgMjYgWiBNIDI1IDI2QzIzLjg5NDUzMSAyNiAyMyAyNi44OTQ1MzEgMjMgMjhDMjMgMjguNzE0ODQ0IDIzLjM4MjgxMyAyOS4zNzUgMjQgMjkuNzMwNDY5TDI0IDM1TDI2IDM1TDI2IDI5LjczMDQ2OUMyNi42MTcxODggMjkuMzcxMDk0IDI3IDI4LjcxNDg0NCAyNyAyOEMyNyAyNi44OTQ1MzEgMjYuMTA1NDY5IDI2IDI1IDI2WiIgLz4NCjwvc3ZnPg==",
            oncommand: "window.open('chrome://pippki/content/certManager.xhtml', 'mozilla:certmanager', 'chrome,resizable=yes,all,width=830,height=400');"

        }, {
            id: 'context-deletehistory-ToolBarButton',
            label: $L("clean history"),
            tooltiptext: $L("clean history toolip"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy42MjQgMi45NTggQyA3LjY0IDIuNTIgNy43NzMgMi4wMjEgNy45NzMgMS42ODkgQyA4LjE3NSAxLjM1MiA4LjUzNyAxLjAyIDguODU5IDAuODIgQyA5LjE5MiAwLjY0MiA5LjY1OCAwLjQ5NiAxMC4wNTEgMC40ODkgQyAxMC40MzkgMC40ODMgMTAuOTM5IDAuNjE3IDExLjMyNiAwLjgyMiBDIDExLjUwMSAwLjkyNyAxMS42OTggMS4wOCAxMS44NCAxLjIxOCBDIDExLjk3OSAxLjM2MyAxMi4xMjkgMS41NiAxMi4yMjkgMS43MjcgQyAxMi4zMjQgMS44OTkgMTIuNDIgMi4xMjUgMTIuNDcyIDIuMzE1IEMgMTIuNTI0IDIuNTA3IDEyLjU1NCAyLjc1NSAxMi41NTcgMi45NTggTCAxMi41NTcgNy4zNTggTCAxNy43MDggNy4zNTggTCAxNy43MDggMTkuMTU5IEwgMi40NzQgMTkuMTU5IEwgMi40NzQgNy4zNTggTCA3LjYyNCA3LjM1OCBaIE0gOS4xMjQgOC44NTggTCAzLjk3NCA4Ljg1OCBMIDMuOTc0IDEwLjc5MSBMIDE2LjIwOCAxMC43OTEgTCAxNi4yMDggOC44NTggTCAxMS4wNTcgOC44NTggTCAxMS4wNTcgMi45NTggQyAxMS4wNiAyLjg1NSAxMS4wNSAyLjgwMyAxMS4wMjQgMi43MDcgQyAxMC45OTggMi42MDkgMTAuOTggMi41NTkgMTAuOTI4IDIuNDc0IEMgMTAuODggMi4zODYgMTAuODUgMi4zNDQgMTAuNzc4IDIuMjc3IEMgMTAuNzA5IDIuMjA0IDEwLjY2NiAyLjE2OSAxMC41NzUgMi4xMiBDIDEwLjM5IDEuOTk2IDEwLjI3OSAxLjk4NSAxMC4wNzcgMS45ODkgQyA5Ljg4IDEuOTkyIDkuNzc2IDIuMDExIDkuNjA3IDIuMTIxIEMgOS40MyAyLjIxMSA5LjM2MSAyLjI5MiA5LjI1OSAyLjQ2MSBDIDkuMTU1IDIuNjM1IDkuMTA4IDIuNzM2IDkuMTI0IDIuOTU4IFogTSAzLjk3NCAxNy42NTkgTCA1LjkwNyAxNy42NTkgTCA1LjkwNyAxMy41NzIgTCA3LjQwNyAxMy41NzIgTCA3LjQwNyAxNy42NTkgTCA5LjM0MSAxNy42NTkgTCA5LjM0MSAxMy41NzIgTCAxMC44NDEgMTMuNTcyIEwgMTAuODQxIDE3LjY1OSBMIDEyLjc3NSAxNy42NTkgTCAxMi43NzUgMTMuNTcyIEwgMTQuMjc1IDEzLjU3MiBMIDE0LjI3NSAxNy42NTkgTCAxNi4yMDggMTcuNjU5IEwgMTYuMjA4IDEyLjI5MSBMIDMuOTc0IDEyLjI5MSBaIiBzdHlsZT0iIi8+Cjwvc3ZnPg==",
            oncommand: "window.open('chrome://browser/content/sanitize.xhtml', 'Toolkit:SanitizeDialog', 'chrome,resizable=yes');"
        }, {
            label: $L("about config"),
            image: "chrome://global/skin/icons/settings.svg",
            oncommand: `openTrustedLinkIn('about:config', gBrowser.currentURI.spec === AboutNewTab.newTabURL || gBrowser.currentURI.spec === HomePage.get(window) ? "current" : "tab")`,
        }, {
            label: $L("synced tabs"),
            tooltiptext: $L("synced tabs"),
            image: "chrome://browser/skin/tab.svg",
            oncommand: "SidebarUI.toggle('viewTabsSidebar');",
        }, {
            label: $L("downloads history"),
            tooltiptext: $L("downloads history"),
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIuNDE0IDVIMjFhMSAxIDAgMCAxIDEgMXYxNGExIDEgMCAwIDEtMSAxSDNhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMSAxLTFoNy40MTRsMiAyek00IDV2MTRoMTZWN2gtOC40MTRsLTItMkg0em05IDhoM2wtNCA0LTQtNGgzVjloMnY0eiIvPjwvc3ZnPg==",
            oncommand: "DownloadsPanel.showDownloadsHistory();"
        }, {
            label: $L("bookmarks manager"),
            tooltiptext: $L("bookmarks manager"),
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTMgMjF2MmgtMnYtMkgzYTEgMSAwIDAgMS0xLTFWNGExIDEgMCAwIDEgMS0xaDZhMy45OSAzLjk5IDAgMCAxIDMgMS4zNTRBMy45OSAzLjk5IDAgMCAxIDE1IDNoNmExIDEgMCAwIDEgMSAxdjE2YTEgMSAwIDAgMS0xIDFoLTh6bTctMlY1aC01YTIgMiAwIDAgMC0yIDJ2MTJoN3ptLTkgMFY3YTIgMiAwIDAgMC0yLTJINHYxNGg3eiIvPjwvc3ZnPg==",
            oncommand: "PlacesCommandHook.showPlacesOrganizer('AllBookmarks');"
        }];

    window.CustomButtons = {
        PREF_LISTENER: [],
        FUNCTION_LIST: [],
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get win() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get eventId() {
            if (!this._eventId) this._eventId = 1;
            return this._eventId++;
        },
        get btnId() {
            if (!this._btnId) this._btnId = 1;
            return this._btnId++;
        },
        get debug() {
            if (this._debug) {
                this._debug = debug;
            }
            return this._debug;
        },
        get toolsPath() {
            if (!this._toolsPath) {
                let path = Services.dirsvc.get("ProfD", Ci.nsIFile);
                path.appendRelativePath(TOOLS_PATH || "chrome\\resources\\tools");
                if (!path.exists()) {
                    path.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
                }
                this._toolsPath = path;
            }
            return this._toolsPath;
        },
        get btnCfg() {
            if (!this._btnCfg) {
                this._btnCfg = [];
                BTN_CONFIG.forEach(obj => this._btnCfg.push(cloneObj(obj)));
            }
            return this._btnCfg;
        },
        init() {
            if (this.debug) this.log("CustomButtons init");
            this.style = addStyle(css);
            if (!BTN_CONFIG) {
                if (this.debug) this.log($L("buttons config has some mistake"));
                return;
            }
            this.rebuild();
        },
        uninit() {
            if (this.btnIds?.length) {
                this.btnIds.forEach(id => {
                    if (this.debug) this.log($L("destroying button"), id);
                    CustomizableUI.destroyWidget(id);
                });
            }
            this.btnIds = null;
            this.PREF_LISTENER.forEach(l => cPref.removeListener(l));
            this.PREF_LISTENER = [];
        },
        rebuild() {
            this.uninit();
            this.btnIds = this.createButtons();
        },
        destroy() {
            this.uninit();
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.CustomButtons;
        },
        createButtons() {
            if (!this.btnCfg) {
                if (this.debug) this.log($L("no buttons configuration"));
                return;
            }
            if (this.debug) this.log($L("creating buttons"));
            let btnIds = [];
            Object.values(this.btnCfg).forEach(obj => {
                let btn = this.createButton(obj);
                btnIds.push(btn.getAttribute('id'));
            });
            return btnIds;
        },
        createButton(obj) {
            obj.id = obj.id || "CustomButtons-Button-" + this.btnId;
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
                onBuild: function (doc) {
                    let btn;
                    try {
                        btn = $C(doc, 'toolbarbutton', obj, ['type', 'group', 'popup', 'onBuild']);
                        'toolbarbutton-1 chromeclass-toolbar-additional'.split(' ').forEach(c => btn.classList.add(c));
                        if (obj.popup) {
                            let id = obj.id + '-popup';
                            btn.setAttribute('type', obj.type || "menu");
                            btn.setAttribute(obj.type || "menu", id);
                            let popup = $C(doc, 'menupopup', { id: id, class: 'CustomButtons-Popup' });
                            btn.appendChild(popup);
                            obj.popup.forEach(child => popup.appendChild(CustomButtons.createMenu(child, doc, popup, true)));
                        }
                        if (obj.onBuild && typeof obj.onBuild == 'function') obj.onBuild(btn, doc);
                        if (!obj.oncommand)
                            btn.setAttribute("oncommand", "CustomButtons.onCommand(event);");
                    } catch (e) {
                        CustomButtons.error(e);
                    }
                    return btn;
                }
            });
            return CustomizableUI.getWidget(obj.id).forWindow(window).node;
        },
        createMenu(obj, aDoc, parent) {
            if (!obj) return;
            aDoc = aDoc || parent?.ownerDocument || this.win.document;
            let el;
            if (obj.group) {
                el = $C(aDoc, 'menugroup', obj, ['group', 'popup']);
                el.classList.add('CustomButtons-Group');
                obj.group.forEach(child => el.appendChild(CustomButtons.createMenu(child, aDoc, el)));

                // menugroup 无需嵌套在 menu 中
                return el;
            } else if (obj.popup) {
                el = $C(aDoc, 'menupopup', obj, ['group', 'popup']);
                el.classList.add('CustomButtons-Popup');
                obj.popup.forEach(child => el.appendChild(CustomButtons.createMenu(child, aDoc, el)));
            }

            let item = this.createMenuItem(obj, aDoc, parent);
            if (el) item.appendChild(el);
            return item;
        },
        createMenuItem: function (obj, aDoc, parent) {
            if (!obj) return;
            aDoc = aDoc || parent?.ownerDocument || this.win.document;
            let item,
                classList = [],
                tagName = obj.type || 'menuitem';
            if (inObject(['separator', 'menuseparator'], obj.type) || !obj.group && !obj.popup && !obj.label && !obj.image && !obj.command && !obj.pref) {
                return $C(aDoc, 'menuseparator', obj, ['type', 'group', 'popup']);
            }
            if (inObject['checkbox', 'radio'], obj.type) tagName = 'menuitem';
            if (obj.group) tagName = 'menu';
            if (obj.popup) tagName = 'menu';
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
                // todo: add clone menuitem function
            } else {
                item = $C(aDoc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group']);
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

            if (debug) this.log('createMenuItem', tagName, item);

            if (obj.oncommand || obj.command)
                return item;

            item.setAttribute("oncommand", "CustomButtons.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            return item;
        },
        onCommand: function (event) {
            event.stopPropagation();
            if (event.button === 0 && event.target.hasAttribute('skin')) return;
            let item = event.target;
            let precommand = item.getAttribute("precommand") || "",
                pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "";
            where = item.getAttribute("where") || "";
            if (precommand) eval(precommand);
            if (pref) this.handlePref(event, pref);
            else if (exec) this.exec(exec, text);
            else if (edit) this.edit(edit);
            else if (url) this.openCommand(event, url, where);
        },
        handlePref(event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = cPref.get(pref, false, !!item.getAttribute('defaultValue'));
                cPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), cPref.get(pref, item.getAttribute('default') || ""));
                if (val) {
                    switch (type) {
                        case 'int':
                            val = parseInt(val);
                            break;
                        case 'boolean':
                            val = !!val;
                            break;
                        case 'string':
                        default:
                            val = "" + val;
                            break;
                    }
                    cPref.set(pref, val);
                }

            }
            if (item.hasAttribute("postcommand")) {
                eval(item.getAttribute('postcommand'));
            }
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
            if (debug) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), edit);
            else
                this.exec(this.handleRelativePath(obj.edit));
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
        addPrefListener(pref, callback) {
            this.PREF_LISTENER[pref] = cPref.addListener(pref, callback);
        },
        handleRelativePath: function (path, parentPath) {
            if (path) {
                let handled = false;
                Object.keys(OS.Constants.Path).forEach(key => {
                    if (path.includes("{" + key + "}")) {
                        path = path.replace("{" + key + "}", OS.Constants.Path[key]);
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
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(obj.edit ? this.handleRelativePath(obj.edit) : obj.exec);
                } catch (e) {
                    return;
                }

                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = getURLSpecFromFile(aFile);
                        menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                    } else {
                        menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            var setIconCallback = function (url) {
                let uri, iconURI;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) { }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ?
                                "moz-anno:favicon:" + aURI.spec :
                                "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
                        } catch (e) { }
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
                CustomButtons.error(e)
            }).catch(e => { });

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
                this.appVersion >= 78 ? "chrome://global/skin/icons/info.svg" : "chrome://global/skin/icons/information-32.png", aTitle || "CustomButtons",
                aMsg + "", !!callback, "", callback);
        },
        error: function () {
            Cu.reportError(Array.prototype.slice.call(arguments));
        },
        log: function () {
            this.win.console.log(Array.prototype.slice.call(arguments));
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

    function $J(selector, aDoc) {
        return (aDoc || document).querySelector(selector);
    }

    function $JJ(selector, aDoc) {
        return (aDoc || document).querySelectorAll(selector);
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
            if (!inObject(skipAttrs, key)) {
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

    /**
    * 数组/对象中是否包含某个关键字
     * @param {object} obj 
     * @param {any} key 
    * @returns 
    */
    function inObject(obj, key) {
        if (obj.indexOf) {
            return obj.indexOf(key) > -1;
        } else if (obj.hasAttribute) {
            return obj.hasAttribute(key);
        } else {
            for (var i = 0; i < obj.length; i++) {
                if (obj[i] === key) return true;
            }
            return false;
        }
    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
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

    window.CustomButtons.init();
})(`
@-moz-document url('chrome://browser/content/browser.xhtml') {
    #context-take-screenshot, #context-sep-screenshots {
        display: none;
    }
    .CustomButtons-Group > .menuitem-iconic {
        padding-block: 0.5em;
    }
    
    .CustomButtons-Group > .menuitem-iconic:first-child {
        padding-inline-start: 1em;
    }
    .CustomButtons-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
    .CustomButtons-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
    .CustomButtons-Group > :is(menu, menuitem) > .menu-accel-container {
        display: none;
    }

    .CustomButtons-Group.showFirstText > :is(menu, menuitem):first-child,
    .CustomButtons-Group.showText > :is(menu, menuitem) {
        -moz-box-flex: 1;
        padding-inline-end: .5em;
    }
    .CustomButtons-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
        padding-left: 0;
        -moz-box-flex: 0;
    }
    .CustomButtons-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) > .menu-iconic-left {
        margin-inline-start: 8px;
        margin-inline-end: 8px;
    }
    .CustomButtons-Popup menuseparator+menuseparator {
        visibility: collapse;
    }
    .CustomButtons-Popup menuseparator:last-child {
        /* 懒得研究为什么多了一个分隔符 */
        visibility: collapse;
    }

    .CustomButtons-Popup .menuitem-iconic.reload {
        list-style-image: url(chrome://devtools/content/debugger/images/reload.svg) !important;
    }

    .CustomButtons-Popup .menuitem-iconic.option {
        list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
    }

    .CustomButtons-Popup .menu-iconic.skin,
    .CustomButtons-Popup .menuitem-iconic.skin {
        list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik03MDYuNTQ1IDEyOC4wMTlhNjMuOTg1IDYzLjk4NSAwIDAgMSA0OC41OTkgMjIuMzYzbDE3Mi44MzUgMjAxLjc2My02My45OTYgMTI3Ljg1Ny00MS4zNzQtNDEuMzcxYy02LjI1LTYuMjQ4LTE0LjQzNy05LjM3Mi0yMi42MjQtOS4zNzItOC4xODggMC0xNi4zNzQgMy4xMjQtMjIuNjI0IDkuMzcyYTMyLjAwNiAzMi4wMDYgMCAwIDAtOS4zNzUgMjIuNjI2djQwMi43MjdjMCAxNy42NzItMTQuMzI3IDMxLjk5OC0zMS45OTkgMzEuOTk4SDMyMC4wMWMtMTcuNjcxIDAtMzEuOTk4LTE0LjMyNi0zMS45OTgtMzEuOTk4VjQ2MS4yNTZjMC0xNy42NzItMTQuMzI4LTMxLjk5OC0zMi0zMS45OThhMzEuOTk3IDMxLjk5NyAwIDAgMC0yMi42MjQgOS4zNzJsLTQxLjM3MyA0MS4zNzFMOTYuMDIgMzUyLjAwN2wxNzIuODM1LTIwMS42NGE2My45ODcgNjMuOTg3IDAgMCAxIDQ4LjU5Mi0yMi4zNDhoNi41MDdhOTUuOTcgOTUuOTcgMCAwIDEgNTAuMTMgMTQuMTMyQzQyOC4zNyAxNzUuMzk0IDQ3NC4zMzggMTkyLjAxNSA1MTIgMTkyLjAxNXM4My42MjktMTYuNjIxIDEzNy45MTUtNDkuODY0YTk1Ljk2OCA5NS45NjggMCAwIDEgNTAuMTMtMTQuMTMyaDYuNW0wLTYzLjk5OGgtNi41YTE1OS44OSAxNTkuODkgMCAwIDAtODMuNTU3IDIzLjU1OEM1NjEuOTA0IDEyMSA1MjkuNTM3IDEyOC4wMTggNTEyIDEyOC4wMThjLTE3LjUzOCAwLTQ5LjkwNC03LjAxNy0xMDQuNDk1LTQwLjQ0NmExNTkuODgxIDE1OS44ODEgMCAwIDAtODMuNTUtMjMuNTVoLTYuNTA4YTEyNy44MjMgMTI3LjgyMyAwIDAgMC05Ny4xODIgNDQuNzAxTDQ3LjQyOCAzMTAuMzZjLTE5LjUyMiAyMi43NzQtMjAuNiA1Ni4wNS0yLjYxIDgwLjA0N0wxNDAuODE1IDUxOC40YTYzLjk5OCA2My45OTggMCAwIDAgODMuMTk5IDE3LjAyNXYzMjguNTU4YzAgNTIuOTMyIDQzLjA2IDk1Ljk5NSA5NS45OTUgOTUuOTk1aDQxNS45OGM1Mi45MzUgMCA5NS45OTYtNDMuMDYzIDk1Ljk5Ni05NS45OTVWNTM1LjQyNWE2NC4wMjggNjQuMDI4IDAgMCAwIDQyLjI0IDcuNzQ5IDY0LjAxNCA2NC4wMTQgMCAwIDAgNDYuOTktMzQuNTI4bDYzLjk5Ny0xMjcuODU3YzExLjUyMi0yMy4wMjggOC4xMjUtNTAuNzIyLTguNjMzLTcwLjI3OUw4MDMuNzQ0IDEwOC43NDdjLTI0LjMzNi0yOC40MjItNTkuNzctNDQuNzI2LTk3LjItNDQuNzI2eiIgcC1pZD0iMTI4MiI+PC9wYXRoPjwvc3ZnPg==) !important;
    }
}
`, false);