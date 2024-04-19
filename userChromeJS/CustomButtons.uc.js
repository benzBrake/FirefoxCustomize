// ==UserScript==
// @name            CustomButtons.uc.js
// @description     添加多个自定义按钮，截图、UndoCloseTab、清除历史记录、高级首选项、受同步的标签页、下载历史、管理书签
// @author          Ryan
// @version         0.1.8
// @compatibility   Firefox 70 +
// @include         main
// @shutdown        window.CustomButtons.destroy(win);
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            0.1.8 画板改为调用系统自带，修改 openCommand 函数，exec 增加第三个参数，移除部分无用代码
// @note            0.1.7 修改【我的足迹：下载】，【我的足迹：书签】图标
// @note            0.1.6 默认截图工具改为搜狗截图，支持联网 OCR，移除证书管理按钮和缩放控制按钮，修改部分图标，移除无用函数
// @note            0.1.5 修复 firefox 115 无法读取已关闭标签列表
// @note            从 CopyCat.uc.js 修改而来
// ==/UserScript==
(function (css, isDebugMode) {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

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
            "clean history": "清除历史记录",
            "clean history toolip": "清除最近的历史记录",
            "about config": "高级首选项",
            "synced tabs": "侧边栏：受同步的标签页",
            "downloads history": "我的足迹：下载",
            "bookmarks manager": "我的足迹：书签",
            "toggle bookmarks toolbar": "显示/隐藏书签工具栏"
        }
    }

    const BUTTONS_CONFIG = [
        {
            id: 'CB-SnapShot',
            label: $L("take snapshot"),
            tooltiptext: $L("take snapshot tooltip"),
            type: "contextmenu",
            tool: "\\SGScreencapture\\screencapture.exe",
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzAgMzAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMykiPg0KICA8cGF0aCBkPSJNNiA0QzQuODk1IDQgNCA0Ljg5NSA0IDZMNCA3QzQgNy41NTIgNC40NDggOCA1IDhDNS41NTIgOCA2IDcuNTUyIDYgN0w2IDZMNyA2QzcuNTUyIDYgOCA1LjU1MiA4IDVDOCA0LjQ0OCA3LjU1MiA0IDcgNEw2IDQgeiBNIDExIDRDMTAuNDQ4IDQgMTAgNC40NDggMTAgNUMxMCA1LjU1MyAxMC40NDggNiAxMSA2TDEzIDZDMTMuNTUyIDYgMTQgNS41NTIgMTQgNUMxNCA0LjQ0OCAxMy41NTIgNCAxMyA0TDExIDQgeiBNIDE3IDRDMTYuNDQ4IDQgMTYgNC40NDggMTYgNUMxNiA1LjU1MiAxNi40NDggNiAxNyA2TDE5IDZDMTkuNTUyIDYgMjAgNS41NTIgMjAgNUMyMCA0LjQ0OCAxOS41NTIgNCAxOSA0TDE3IDQgeiBNIDIzIDRDMjIuNDQ4IDQgMjIgNC40NDggMjIgNUMyMiA1LjU1MiAyMi40NDggNiAyMyA2TDI0IDZMMjQgN0MyNCA3LjU1MiAyNC40NDggOCAyNSA4QzI1LjU1MiA4IDI2IDcuNTUyIDI2IDdMMjYgNkMyNiA0Ljg5NSAyNS4xMDUgNCAyNCA0TDIzIDQgeiBNIDUgMTBDNC40NDggMTAgNCAxMC40NDggNCAxMUw0IDEzQzQgMTMuNTUyIDQuNDQ4IDE0IDUgMTRDNS41NTMgMTQgNiAxMy41NTIgNiAxM0w2IDExQzYgMTAuNDQ4IDUuNTUyIDEwIDUgMTAgeiBNIDI1IDEwQzI0LjQ0OCAxMCAyNCAxMC40NDggMjQgMTFMMjQgMTMuMDAxOTUzQzI0IDEzLjU1Mzk1MyAyNC40NDggMTQuMDAxOTUzIDI1IDE0LjAwMTk1M0MyNS41NTIgMTQuMDAxOTUzIDI2IDEzLjU1Mzk1MyAyNiAxMy4wMDE5NTNMMjYgMTFDMjYgMTAuNDQ4IDI1LjU1MiAxMCAyNSAxMCB6IE0gMTUuNjE3MTg4IDE0QzE1LjIzODE4OCAxNCAxNC44OTM2MDkgMTQuMjEzNzM0IDE0LjcyNDYwOSAxNC41NTI3MzRMMTQuNTUyNzM0IDE0Ljg5NDUzMUMxNC4yMTM3MzQgMTUuNTcxNTMxIDEzLjUyMDY3MiAxNiAxMi43NjM2NzIgMTZMMTEgMTZDMTAuNDQ4IDE2IDEwIDE2LjQ0OCAxMCAxN0wxMCAyNUMxMCAyNS41NTIgMTAuNDQ4IDI2IDExIDI2TDI1IDI2QzI1LjU1MiAyNiAyNiAyNS41NTIgMjYgMjVMMjYgMTdDMjYgMTYuNDQ4IDI1LjU1MiAxNiAyNSAxNkwyMy4yMzYzMjggMTZDMjIuNDc4MzI4IDE2IDIxLjc4NjI2NiAxNS41NzI1MzEgMjEuNDQ3MjY2IDE0Ljg5NDUzMUwyMS4yNzUzOTEgMTQuNTUyNzM0QzIxLjEwNjM5MSAxNC4yMTQ3MzQgMjAuNzYxODEzIDE0IDIwLjM4MjgxMiAxNEwxNS42MTcxODggMTQgeiBNIDUgMTZDNC40NDggMTYgNCAxNi40NDggNCAxN0w0IDE5QzQgMTkuNTUyIDQuNDQ4IDIwIDUgMjBDNS41NTIgMjAgNiAxOS41NTIgNiAxOUw2IDE3QzYgMTYuNDQ4IDUuNTUyIDE2IDUgMTYgeiBNIDE4IDE3QzIwLjIwOSAxNyAyMiAxOC43OTEgMjIgMjFDMjIgMjMuMjA5IDIwLjIwOSAyNSAxOCAyNUMxNS43OTEgMjUgMTQgMjMuMjA5IDE0IDIxQzE0IDE4Ljc5MSAxNS43OTEgMTcgMTggMTcgeiBNIDE4IDE5IEEgMiAyIDAgMCAwIDE2IDIxIEEgMiAyIDAgMCAwIDE4IDIzIEEgMiAyIDAgMCAwIDIwIDIxIEEgMiAyIDAgMCAwIDE4IDE5IHogTSA1IDIyQzQuNDQ4IDIyIDQgMjIuNDQ4IDQgMjNMNCAyNEM0IDI1LjEwNSA0Ljg5NSAyNiA2IDI2TDcgMjZDNy41NTIgMjYgOCAyNS41NTIgOCAyNUM4IDI0LjQ0OCA3LjU1MiAyNCA3IDI0TDYgMjRMNiAyM0M2IDIyLjQ0OCA1LjU1MiAyMiA1IDIyIHoiIC8+DQo8L3N2Zz4=",
            popup: [{
                label: $L("hide firefox to take snapshot"),
                tool: "\\SGScreencapture\\screencapture.exe",
                oncommand: function (event) {
                    window.minimize();
                    setTimeout(() => {
                        CustomButtons.onCommand(event);
                    }, 500);
                },
                image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy4zNjcgNC43OCBMIDMuODM3IDQuNzggTCAzLjgzNyA4LjI5NyBMIDUuNjAyIDguMjk3IEwgNS42MDIgNi41MzggTCA3LjM2NyA2LjUzOCBNIDE2LjE5MSA4LjI5NyBMIDE0LjQyNiA4LjI5NyBMIDE0LjQyNiAxMC4wNTUgTCAxMi42NiAxMC4wNTUgTCAxMi42NiAxMS44MTQgTCAxNi4xOTEgMTEuODE0IE0gMTcuOTU1IDEzLjU3MiBMIDIuMDczIDEzLjU3MiBMIDIuMDczIDMuMDIxIEwgMTcuOTU1IDMuMDIxIE0gMTcuOTU1IDEuMjYzIEwgMi4wNzMgMS4yNjMgQyAxLjA5MyAxLjI2MyAwLjMwOCAyLjA0NiAwLjMwOCAzLjAyMSBMIDAuMzA4IDEzLjU3MiBDIDAuMzA4IDE0LjU0MyAxLjA5NyAxNS4zMzIgMi4wNzMgMTUuMzMyIEwgOC4yNDkgMTUuMzMyIEwgOC4yNDkgMTcuMDkgTCA2LjQ4NCAxNy4wOSBMIDYuNDg0IDE4Ljg0OSBMIDEzLjU0NCAxOC44NDkgTCAxMy41NDQgMTcuMDkgTCAxMS43NzggMTcuMDkgTCAxMS43NzggMTUuMzMyIEwgMTcuOTU1IDE1LjMzMiBDIDE4LjkzIDE1LjMzMiAxOS43MiAxNC41NDMgMTkuNzIgMTMuNTcyIEwgMTkuNzIgMy4wMjEgQyAxOS43MiAyLjA1IDE4LjkzIDEuMjYzIDE3Ljk1NSAxLjI2MyIgc3R5bGU9IiIvPgo8L3N2Zz4='
            }, {
                label: $L("scroll snapshot"),
                oncommand: function () {
                    const ScreenshotsUtils = globalThis.ScreenshotsUtils || Cu.import("resource:///modules/ScreenshotsUtils.jsm");
                    ScreenshotsUtils.notify(window, "shortcut");
                },
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
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTkuMjI4IDE4LjczMmwxLjc2OC0xLjc2OCAxLjc2NyAxLjc2OGEyLjUgMi41IDAgMSAxLTMuNTM1IDB6TTguODc4IDEuMDhsMTEuMzE0IDExLjMxM2ExIDEgMCAwIDEgMCAxLjQxNWwtOC40ODUgOC40ODVhMSAxIDAgMCAxLTEuNDE0IDBsLTguNDg1LTguNDg1YTEgMSAwIDAgMSAwLTEuNDE1bDcuNzc4LTcuNzc4LTIuMTIyLTIuMTIxTDguODggMS4wOHpNMTEgNi4wM0wzLjkyOSAxMy4xIDExIDIwLjE3M2w3LjA3MS03LjA3MUwxMSA2LjAyOXoiLz48L3N2Zz4=',
                oncommand: function () {
                    var environment = Components.classes["@mozilla.org/process/environment;1"].
                        getService(Components.interfaces.nsIEnvironment);

                    var cmd = PathUtils.join(environment.get("SystemRoot"), "System32", "cmd.exe");
                    CustomButtons.exec(cmd, "/c start /b mspaint.exe", { startHidden: true });
                }
            }]
        }, {
            id: 'CB-undoCloseTab',
            label: $L("undo close tab"),
            tooltiptext: $L("undo close tab tooltip"),
            defaultArea: CustomizableUI.AREA_TABSTRIP,
            oncommand: function (event) { if (event.explicitOriginalTarget.tagName === "toolbarbutton") undoCloseTab(); },
            type: "contextmenu",
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSIgZmlsbD0iY29udGV4dC1maWxsIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNNS44MjggN2wyLjUzNiAyLjUzNkw2Ljk1IDEwLjk1IDIgNmw0Ljk1LTQuOTUgMS40MTQgMS40MTRMNS44MjggNUgxM2E4IDggMCAxIDEgMCAxNkg0di0yaDlhNiA2IDAgMSAwIDAtMTJINS44Mjh6Ii8+PC9zdmc+",
            onclick: function (event) {
                if (event.explicitOriginalTarget.localName !== "toolbarbutton") return;
                if (event.button === 1) {
                    try {
                        SessionStore.restoreLastSession();
                    } catch (e) {
                    }
                    return;
                }
                if (event.button !== 2) return;
                const doc = (event.view && event.view.document) || event.target.ownerDocument;
                const menu = event.target.querySelector("menupopup");
                menu.querySelectorAll('.undo-item').forEach(i => i.remove());
                const getClosedTabData = "getClosedTabDataForWindow" in SessionStore ? SessionStore.getClosedTabDataForWindow : SessionStore.getClosedTabData;
                let data = getClosedTabData(window);
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
                let pos = "after_end", x, y;
                if ((event.target.ownerGlobal.innerWidth / 2) > event.pageX) {
                    pos = "after_position";
                    x = 0;
                    y = 0 + event.target.clientHeight;
                }
                menu.openPopup(event.target, pos, x, y);
            },
            popup: [{
                id: 'CB-undoCloseTab-menuseparator'
            }, {
                label: gNavigatorBundle.getString("menuOpenAllInTabs.label"),
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNOC4wMiAwYTcuOTcgNy45NyAwIDAgMSAzLjM2NS43NTIgOC4wMDggOC4wMDggMCAwIDEgNC4yMjcgOS43MTUgOC4wMDYgOC4wMDYgMCAwIDEtOS4xMiA1LjM4OUE4LjAwNSA4LjAwNSAwIDAgMSAuMDE3IDcuNDdhLjUuNSAwIDAgMSAuNTMxLS40NjcuNS41IDAgMCAxIC40NjcuNTMzIDYuOTk0IDYuOTk0IDAgMCAwIDUuNjY0IDcuMzM4IDYuOTk0IDYuOTk0IDAgMCAwIDcuOTgtNC43MTcgNi45OTMgNi45OTMgMCAwIDAtMy42OTYtOC41QTYuOTk2IDYuOTk2IDAgMCAwIDIuMjU1IDRoMy4yNDZhLjUuNSAwIDAgMSAuNS41LjUuNSAwIDAgMS0uNS41aC00YS41LjUgMCAwIDEtLjUtLjV2LTRhLjUuNSAwIDAgMSAuNS0uNS41LjUgMCAwIDEgLjUuNXYyLjIxNUE4LjAxNCA4LjAxNCAwIDAgMSA4LjAyMSAweiIvPgogIDxwYXRoIGQ9Ik03LjUgNGEuNS41IDAgMCAwLS41LjVWOWEuNS41IDAgMCAwIC41LjVoM0EuNS41IDAgMCAwIDExIDlhLjUuNSAwIDAgMC0uNS0uNUg4di00YS41LjUgMCAwIDAtLjUtLjV6Ii8+Cjwvc3ZnPgo=",
                onclick: function (event) {
                    this.parentNode.querySelectorAll('.undo-item').forEach(m => m.doCommand());
                }
            }]
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
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNMi41IDFBMS41IDEuNSAwIDAgMCAxIDIuNVY0aDFWMi41YS41LjUgMCAwIDEgLjUtLjVoMTFhLjUuNSAwIDAgMSAuNS41djdhLjUuNSAwIDAgMS0uNS41SDh2MWg1LjVBMS41IDEuNSAwIDAgMCAxNSA5LjV2LTdBMS41IDEuNSAwIDAgMCAxMy41IDFoLTExem0tMSA0QTEuNSAxLjUgMCAwIDAgMCA2LjV2OEExLjUgMS41IDAgMCAwIDEuNSAxNmg0QTEuNSAxLjUgMCAwIDAgNyAxNC41di04QTEuNSAxLjUgMCAwIDAgNS41IDVoLTR6bTAgMWg0YS41LjUgMCAwIDEgLjUuNXY4YS41LjUgMCAwIDEtLjUuNWgtNGEuNS41IDAgMCAxLS41LS41di04YS41LjUgMCAwIDEgLjUtLjV6TTggMTJ2MWg3LjVhLjUuNSAwIDAgMCAwLTFIOHptLTUgMWEuNS41IDAgMCAwIDAgMWgxYS41LjUgMCAwIDAgMC0xSDN6Ii8+Cjwvc3ZnPgo=",
            oncommand: "SidebarUI.toggle('viewTabsSidebar');",
        }, {
            id: 'CB-DownloadHistory',
            label: $L("downloads history"),
            tooltiptext: $L("downloads history"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMykiPg0KICA8cGF0aCBkPSJNNS43NSAzIEEgMS4wMDAxIDEuMDAwMSAwIDAgMCA0Ljg4NjcxODggMy40OTYwOTM4TDMuMTM2NzE4OCA2LjQ5NjA5MzggQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDMgN0wzIDE5QzMgMjAuMDkzMDYzIDMuOTA2OTM3MiAyMSA1IDIxTDE5IDIxQzIwLjA5MzA2MyAyMSAyMSAyMC4wOTMwNjMgMjEgMTlMMjEgNyBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMjAuODYzMjgxIDYuNDk2MDkzOEwxOS4xMTMyODEgMy40OTYwOTM4IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAxOC4yNSAzTDUuNzUgMyB6IE0gNi4zMjQyMTg4IDVMMTcuNjc1NzgxIDVMMTguODQxNzk3IDdMNS4xNTgyMDMxIDdMNi4zMjQyMTg4IDUgeiBNIDUgOUwxOSA5TDE5IDE5TDUgMTlMNSA5IHogTSAxMSAxMUwxMSAxNEw4IDE0TDEyIDE4TDE2IDE0TDEzIDE0TDEzIDExTDExIDExIHoiLz4NCjwvc3ZnPg==",
            oncommand: "DownloadsPanel.showDownloadsHistory();"
        }, {
            id: 'CB-BookmarksManager',
            label: $L("bookmarks manager"),
            tooltiptext: $L("bookmarks manager"),
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMikiPg0KICA8cGF0aCBkPSJNMTAuNSA2QzguMDM2NSA2IDUuOTQ1NjI4OSA3LjYyNzY3NiA1LjI0ODA0NjkgOS44NjUyMzQ0QzUuMjQ3ODY0MSA5Ljg2NTgyIDUuMjQ4MjI5NSA5Ljg2NjYwMTggNS4yNDgwNDY5IDkuODY3MTg3NUM1LjE0MTAyNzEgMTAuMjEwODggNS4wNjY4NjQ0IDEwLjU2ODc4OCA1LjAyOTI5NjkgMTAuOTM3NUM1LjAyOTIzMDkgMTAuOTM4MTQ1IDUuMDI5MzYyNiAxMC45Mzg4MDggNS4wMjkyOTY5IDEwLjkzOTQ1M0M1LjAxMDYwOSAxMS4xMjM1MDkgNSAxMS4zMTEwOTQgNSAxMS41TDUgMTMuNUw1IDM2LjVDNSAzOS41MzMgNy40NjggNDIgMTAuNSA0MkwyNC4wNTY2NDEgNDJDMjMuNDYyNjQxIDQxLjA3MyAyMi45Nzk3NjYgNDAuMDY4IDIyLjYzNDc2NiAzOUwxMC41IDM5QzkuMTIxIDM5IDggMzcuODc4IDggMzYuNUw4IDE1TDQwIDE1TDQwIDIzQzQxLjA4NCAyMy40NTIgNDIuMDg4IDI0LjA1MzU3OCA0MyAyNC43Njc1NzhMNDMgMTMuNUw0MyAxMS41QzQzIDExLjMwOTgzOCA0Mi45ODk2NSAxMS4xMjI3NTUgNDIuOTcwNzAzIDEwLjkzNzVDNDIuOTMzMTM2IDEwLjU2ODc4OCA0Mi44NTg5NzMgMTAuMjEwODggNDIuNzUxOTUzIDkuODY3MTg3NUM0Mi43NTE3NzEgOS44NjY2MDE4IDQyLjc1MjEzNiA5Ljg2NTgyIDQyLjc1MTk1MyA5Ljg2NTIzNDRDNDIuMDU0MzcxIDcuNjI3Njc2IDM5Ljk2MzUgNiAzNy41IDZMMTAuNSA2IHogTSAxMC41IDlDMTEuMzI4IDkgMTIgOS42NzIgMTIgMTAuNUMxMiAxMS4zMjggMTEuMzI4IDEyIDEwLjUgMTJDOS42NzIgMTIgOSAxMS4zMjggOSAxMC41QzkgOS43NzU1IDkuNTEzOTQ1MyA5LjE3MTE5NTMgMTAuMTk3MjY2IDkuMDMxMjVDMTAuMjk0ODgzIDkuMDExMjU3OCAxMC4zOTY1IDkgMTAuNSA5IHogTSAxNS41IDlDMTYuMzI4IDkgMTcgOS42NzIgMTcgMTAuNUMxNyAxMS4zMjggMTYuMzI4IDEyIDE1LjUgMTJDMTQuNjcyIDEyIDE0IDExLjMyOCAxNCAxMC41QzE0IDkuNjcyIDE0LjY3MiA5IDE1LjUgOSB6IE0gMzUgMjRDMjguOTI1IDI0IDI0IDI4LjkyNSAyNCAzNUMyNCA0MS4wNzUgMjguOTI1IDQ2IDM1IDQ2QzQxLjA3NSA0NiA0NiA0MS4wNzUgNDYgMzVDNDYgMjguOTI1IDQxLjA3NSAyNCAzNSAyNCB6IE0gMzUgMjhDMzUuNDggMjggMzUuOTA4NDUzIDI4LjMwNTc2NiAzNi4wNjQ0NTMgMjguNzU5NzY2TDM3LjE3NzczNCAzMkw0MC44NzUgMzJDNDEuMzU4IDMyIDQxLjc4NzQwNiAzMi4zMDg2MjUgNDEuOTQxNDA2IDMyLjc2NTYyNUM0Mi4wOTU0MDYgMzMuMjIzNjI1IDQxLjkzOTY4NyAzMy43Mjk0ODQgNDEuNTU0Njg4IDM0LjAyMTQ4NEwzOC41NjA1NDcgMzYuMjkyOTY5TDM5LjU3NDIxOSAzOS41MzkwNjJDMzkuNzIwMjE5IDQwLjAwNTA2MyAzOS41NDgzOTEgNDAuNTEwOTY5IDM5LjE1MDM5MSA0MC43OTI5NjlDMzguOTU1MzkxIDQwLjkzMDk2OSAzOC43MjcgNDEgMzguNSA0MUMzOC4yNjMgNDEgMzguMDI1MTcyIDQwLjkyNTM5MSAzNy44MjYxNzIgNDAuNzc1MzkxTDM1IDM4LjY2MDE1NkwzMi4xNzM4MjggNDAuNzc1MzkxQzMxLjc4MzgyOCA0MS4wNjgzOTEgMzEuMjQ4NjA5IDQxLjA3NjkyMiAzMC44NDk2MDkgNDAuNzk0OTIyQzMwLjQ1MTYwOSA0MC41MTI5MjIgMzAuMjc5NzgxIDQwLjAwNTA2MyAzMC40MjU3ODEgMzkuNTM5MDYyTDMxLjQzOTQ1MyAzNi4yOTQ5MjJMMjguNDQ1MzEyIDM0LjAyMTQ4NEMyOC4wNjAzMTIgMzMuNzI5NDg0IDI3LjkwNDU5NCAzMy4yMjU1NzggMjguMDU4NTk0IDMyLjc2NzU3OEMyOC4yMTM1OTQgMzIuMzA5NTc4IDI4LjY0MiAzMiAyOS4xMjUgMzJMMzIuODIyMjY2IDMyTDMzLjkzNTU0NyAyOC43NTk3NjZDMzQuMDkxNTQ3IDI4LjMwNTc2NiAzNC41MiAyOCAzNSAyOCB6Ii8+DQo8L3N2Zz4=",
            oncommand: "PlacesCommandHook.showPlacesOrganizer('AllBookmarks');"
        }];

    window.CustomButtons = {
        _buttonId: 1,
        $C: $C,
        $L: $L,
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get browserWindow() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get btnId() {
            return this._buttonId++;
        },
        get isDebugMode() {
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
        get styleSheetService() {
            delete this.styleSheetService;
            return this.styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        init: function () {
            if (this.isDebugMode) this.log("Init process started!");
            this.style = addStyle(this.styleSheetService, css);
            if (!BUTTONS_CONFIG) {
                if (this.isDebugMode) this.log($L("Buttons config has some mistake"));
                return;
            }
            this.rebuild();
            if (this.isDebugMode) this.log("Init complete!");
        },
        uninit: function (win) {
            if (this.buttonIds instanceof Array) {
                this.buttonIds.forEach(id => {
                    if (this.isDebugMode) this.log($L("Destroying button [%s]"), id);
                    win.CustomizableUI.destroyWidget(id);
                });
            }
            this.buttonIds = null;
        },
        rebuild() {
            this.uninit();
            this.buttonIds = this.createButtons();
        },
        destroy(win) {
            this.uninit(win);
            if (this.style) removeStyle(this.styleSheetService, this.style);
            delete win.CustomButtons;
        },
        createButtons() {
            if (!BUTTONS_CONFIG) {
                if (this.isDebugMode) this.log("No buttons created!");
                return;
            }
            if (this.isDebugMode) this.log("Creating buttons");
            let buttonIds = [];
            Object.values(BUTTONS_CONFIG).forEach(obj => {
                obj.id = obj.id || "CB-" + this.btnId;
                if (CustomizableUI.getWidget(obj.id) && CustomizableUI.getWidget(obj.id).forWindow(window)?.node) return;
                this.createButton(obj);
                buttonIds.push(obj.id);
            });
            return buttonIds;
        },
        createButton(obj) {
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
                        btn = this.$C(aDoc, 'toolbarbutton', obj, ['image', 'type', 'popup', 'onBuild']);
                        if (this.isDebugMode) this.log('Creating button', btn);
                        'toolbarbutton-1 chromeclass-toolbar-additional'.split(' ').forEach(c => btn.classList.add(c));
                        if (obj.image) {
                            btn.style.listStyleImage = 'url(' + obj.image + ')';
                        }
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
                            $A(btn, {
                                oncommand: `if (event.target !== event.explicitOriginalTarget) return; if (event.target.localName !== "toolbarbutton") return; CustomButtons.onCommand(event);`
                            });
                    } catch (e) {
                        this.error(e);
                    }
                    return btn;
                }
            });
            let btn = CustomizableUI.getWidget(obj.id).forWindow(window).node;
            if (obj.onCreated && typeof obj.onCreated == 'function') {
                obj.onCreated(btn);
            }
        },
        newMenuPopup(doc, obj) {
            if (!obj) return;
            let popup = $C(doc, 'menupopup');
            obj.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) popup.appendChild(el);
            });
            popup.classList.add("CustomButtons-Popup");
            if (this.isDebugMode) this.log('Creating ' + popup.tagName, popup);
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
            if (this.isDebugMode) this.log('Creating ' + group.tagName, group);
            return group;
        },
        newMenuitem(doc, obj) {
            if (!obj) return;
            if (obj.group) {
                return this.newMenuGroup(doc, obj);
            }
            let item
            if (obj.popup) {
                item = $C(doc, "menu", obj, ["popup", "image"]);
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
                    return $C(doc, 'menuseparator', obj, ['type', 'group', 'popup', 'image']);
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
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild', 'image']);
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
            if (this.isDebugMode) this.log('Creating ' + item.tagName, item);
            return item;
        },
        onCommand: function (event) {
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
        openCommand: function (event, url, aWhere, aAllowThirdPartyFixup = {}, aPostData, aReferrerInfo) {
            const isJavaScriptURL = url.startsWith("javascript:");
            const isWebURL = /^(f|ht)tps?:/.test(url);
            const where = event.button === 1 ? 'tab' : aWhere;

            // Assign values to allowThirdPartyFixup if provided, or initialize with an empty object
            const allowThirdPartyFixup = { ...aAllowThirdPartyFixup };

            // 遵循容器设定
            if (!allowThirdPartyFixup.userContextId && isWebURL) {
                allowThirdPartyFixup.userContextId = gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.getAttribute("userContextId") || null;
            }

            if (aPostData) {
                allowThirdPartyFixup.postData = aPostData;
            }
            if (aReferrerInfo) {
                allowThirdPartyFixup.referrerInfo = aReferrerInfo;
            }

            // Set triggeringPrincipal based on 'where' and URL scheme
            allowThirdPartyFixup.triggeringPrincipal = (() => {
                if (where === 'current' && !isJavaScriptURL) {
                    return gBrowser.selectedBrowser.contentPrincipal;
                }

                const userContextId = isWebURL ? allowThirdPartyFixup.userContextId : null;
                return isWebURL ?
                    Services.scriptSecurityManager.createNullPrincipal({ userContextId }) :
                    Services.scriptSecurityManager.getSystemPrincipal();
            })();

            if (isJavaScriptURL) {
                openTrustedLinkIn(url, 'current', {
                    allowPopups: true,
                    inBackground: allowThirdPartyFixup.inBackground || false,
                    allowInheritPrincipal: true,
                    private: PrivateBrowsingUtils.isWindowPrivate(window),
                    userContextId: allowThirdPartyFixup.userContextId,
                });
            } else if (where || event.button === 1) {
                openTrustedLinkIn(url, where, allowThirdPartyFixup);
            } else {
                openUILink(url, event, {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                });
            }
        },
        edit: function (edit) {
            if (this.isDebugMode) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg, opt = { startHidden: false }) {
            if (isDebugMode) this.log('exec', path, arg);
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            if (opt.startHidden) process.startHidden = true;
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
                    this.error($L("file not found %s").replace("%s", path))
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
                path = path.replace(/\//g, '\\').toLocaleLowerCase();
                if (/^(\\)/.test(path)) {
                    if (!parentPath) {
                        parentPath = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                    }
                    path = parentPath + path;
                    path = path.replace("\\\\", "\\");
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
            if (menu.hasAttribute("src") || menu.hasAttribute("icon"))
                return;

            if (obj.image) {
                menu.style.listStyleImage = "url(" + obj.image + ")";
                return;
            }

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(this.handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    if (this.isDebugMode) this.error(e);
                    return;
                }
                // if (!aFile.exists() || !aFile.isExecutable()) {
                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = this.getURLSpecFromFile(aFile);
                        menu.style.listStyleImage = "url(moz-icon://" + fileURL + "?size=16)";
                    } else {
                        menu.style.listStyleImage = "url(chrome://global/skin/icons/folder.svg)";
                    }
                }
                return;
            }
        },
        error: function (...args) {
            this.browserWindow.console.error("[CB]", ...args);
        },
        log: function (...args) {
            this.browserWindow.console.log("[CB]", ...args);
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

    function addStyle(styleSheetService, css, type = 0) {
        if (styleSheetService instanceof Ci.nsIStyleSheetService && typeof css === "string") {
            let STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)), type: type
            }
            styleSheetService.loadAndRegisterSheet(STYLE.url, STYLE.type);
            return STYLE;
        }
    }

    function removeStyle(styleSheetService, style) {
        if (styleSheetService instanceof Ci.nsIStyleSheetService && style && style.url && style.type) {
            styleSheetService.unregisterSheet(style.url, style.type);
            return true;
        }
        return false;
    }

    window.CustomButtons.init(window);
})(``, false);