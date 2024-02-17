// ==UserScript==
// @name            CustomButtons.uc.js
// @description     添加多个自定义按钮，截图、UndoCloseTab、清除历史记录、高级首选项、受同步的标签页、下载历史、管理书签
// @author          Ryan
// @version         0.1.6
// @compatibility   Firefox 70 +
// @include         main
// @shutdown        window.CustomButtons.destroy(win);
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
            tool: "\\SnapShot.exe",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNMiAyYTIgMiAwIDAgMC0yIDJ2LjVhLjUuNSAwIDAgMCAxIDBWNGExIDEgMCAwIDEgMS0xaC41YS41LjUgMCAwIDAgMC0xSDJ6bTIuNSAwYS41LjUgMCAxIDAgMCAxSDdhLjUuNSAwIDAgMCAwLTFINC41ek05IDJhLjUuNSAwIDEgMCAwIDFoMi41YS41LjUgMCAwIDAgMC0xSDl6bTQuNSAwYS41LjUgMCAxIDAgMCAxaC41YTEgMSAwIDAgMSAxIDF2LjVhLjUuNSAwIDAgMCAxIDBWNGEyIDIgMCAwIDAtMi0yaC0uNXpNLjUgNi4wMDRhLjUuNSAwIDAgMC0uNS41djJhLjUuNSAwIDAgMCAxIDB2LTJhLjUuNSAwIDAgMC0uNS0uNXptMTUgMGEuNS41IDAgMCAwLS41LjV2MmEuNS41IDAgMCAwIDEgMHYtMmEuNS41IDAgMCAwLS41LS41em0tMTAgLjAwNGEuNDk3LjQ5NyAwIDAgMC0uNDIuNzc1bDIuMzE4IDMuNDgtMS4yMzggMS44NTRhMiAyIDAgMSAwIC44MzUuNTUyTDggMTEuMTYzbDEuMDA4IDEuNTE0YTIgMiAwIDEgMCAuODMyLS41NTRsLTEuMjM4LTEuODYuMDAyLS4wMDQtLjYwMi0uOS0uMDAyLjAwMi0yLjA4Ni0zLjEyN2EuNTAzLjUwMyAwIDAgMC0uNDE0LS4yMjV6bTUgMGEuNTAzLjUwMyAwIDAgMC0uNDE0LjIyNUw4LjYwNCA4LjQ1NmwuNi45MDIgMS43MTctMi41NzRhLjQ5Ny40OTcgMCAwIDAtLjQyLS43NzZ6bS05Ljk5NiA0YS41LjUgMCAwIDAtLjUuNXYuNWEyIDIgMCAwIDAgMiAyaC4yNWEuNS41IDAgMCAwIDAtMWgtLjI1YTEgMSAwIDAgMS0xLTF2LS41YS41LjUgMCAwIDAtLjUtLjV6bTE1IDBhLjUuNSAwIDAgMC0uNS41di41YTEgMSAwIDAgMS0xIDFoLS4yNTJhLjUuNSAwIDEgMCAwIDFoLjI1MmEyIDIgMCAwIDAgMi0ydi0uNWEuNS41IDAgMCAwLS41LS41em0tMTAgMi45OTZhMSAxIDAgMSAxIDAgMiAxIDEgMCAwIDEgMC0yem01IDBhMSAxIDAgMSAxIDAgMiAxIDEgMCAwIDEgMC0yeiIvPgo8L3N2Zz4K",
            popup: [{
                label: $L("hide firefox to take snapshot"),
                tool: "\\SnapShot.exe",
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
                tool: "\\mspaint.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTkuMjI4IDE4LjczMmwxLjc2OC0xLjc2OCAxLjc2NyAxLjc2OGEyLjUgMi41IDAgMSAxLTMuNTM1IDB6TTguODc4IDEuMDhsMTEuMzE0IDExLjMxM2ExIDEgMCAwIDEgMCAxLjQxNWwtOC40ODUgOC40ODVhMSAxIDAgMCAxLTEuNDE0IDBsLTguNDg1LTguNDg1YTEgMSAwIDAgMSAwLTEuNDE1bDcuNzc4LTcuNzc4LTIuMTIyLTIuMTIxTDguODggMS4wOHpNMTEgNi4wM0wzLjkyOSAxMy4xIDExIDIwLjE3M2w3LjA3MS03LjA3MUwxMSA2LjAyOXoiLz48L3N2Zz4='
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
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNOCAwYS41LjUgMCAwIDAtLjUuNXYxMC43OUwzLjg1NCA3LjY0NGEuNS41IDAgMSAwLS43MDcuNzA3bDQuNSA0LjVhLjUuNSAwIDAgMCAuNzA3IDBsNC41LTQuNWEuNS41IDAgMCAwLS43MDctLjcwN0w4LjUwMSAxMS4yOVYuNWEuNS41IDAgMCAwLS41LS41eiIvPgogIDxwYXRoIGQ9Ik0xLjUgMTJhLjUuNSAwIDAgMC0uNS41djFDMSAxNC44NzUgMi4xMjUgMTYgMy41IDE2aDljMS4zNzUgMCAyLjUtMS4xMjUgMi41LTIuNXYtMWEuNS41IDAgMCAwLTEgMHYxYzAgLjgzNC0uNjY2IDEuNS0xLjUgMS41aC05Yy0uODM0IDAtMS41LS42NjYtMS41LTEuNXYtMWEuNS41IDAgMCAwLS41LS41eiIvPgo8L3N2Zz4K",
            oncommand: "DownloadsPanel.showDownloadsHistory();"
        }, {
            id: 'CB-BookmarksManager',
            label: $L("bookmarks manager"),
            tooltiptext: $L("bookmarks manager"),
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjb250ZXh0LWZpbGwiIHN0cm9rZS1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuMDAxIj4KICA8cGF0aCBkPSJtOCAxMi45NS00LjA5IDIuMTUxYS41MDEuNTAxIDAgMCAxLS43MjctLjUyOGwuNzMxLTQuMjY2YS41NjEuNTYyIDAgMCAwLS4xNjEtLjQ5OEwuNjU1IDYuNzlhLjUwMS41MDEgMCAwIDEgLjI3OC0uODU1bDQuMjgtLjYyM2EuNTYxLjU2MiAwIDAgMCAuNDIzLS4zMDdMNy41NSAxLjEyM2EuNTAxLjUwMSAwIDAgMSAuOSAwbDIuMDMxIDQuMTE1YS40NzUuNDc1IDAgMCAwIC40MjYuMjY0SDE1LjUiLz4KICA8cGF0aCBkPSJNMTUuNSA4LjVoLTVNMTAuNSAxMS41aDUiLz4KPC9zdmc+Cg==",
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
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log('openCommand', 'url is invalid', url);
            }
            if (uri.scheme === "javascript") {
                try {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                } catch (e) {
                    gBrowser.loadURI(uri, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                if (this.appVersion < 78) {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } else {
                    openTrustedLinkIn(uri.spec, where, {
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
                    openTrustedLinkIn(uri.spec, 'tab', {
                        postData: postData || null,
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal()
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
            if (this.isDebugMode) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg) {
            if (isDebugMode) this.log('exec', path, arg);
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
                        // menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                        menu.style.listStyleImage = "url(moz-icon://" + fileURL + "?size=16)";
                    } else {
                        // menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                        menu.style.listStyleImage = "url(chrome://global/skin/icons/folder.svg)";
                    }
                }
                return;
            }

            if (obj.keyword) {
                let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                if (engine) {
                    if (isPromise(engine)) {
                        engine.then(function (engine) {
                            if (engine.iconURI) {
                                // menu.setAttribute("image", engine.iconURI.spec);
                                menu.style.listStyleImage = "url(" + engine.iconURI.spec + ")";
                            }
                        });
                    } else if (engine.iconURI) {
                        // menu.setAttribute("image", engine.iconURI.spec);
                        menu.style.listStyleImage = "url(" + engine.iconURI.spec + ")";
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

    function isDef(v) {
        return v !== undefined && v !== null
    }

    function isPromise(val) {
        return (
            isDef(val) &&
            typeof val.then === 'function' &&
            typeof val.catch === 'function'
        )
    }

    window.CustomButtons.init(window);
})(``, false);