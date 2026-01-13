// ==UserScript==
// @name           ScreenshotTools.uc.js
// @long-description
// @description
/* 高级截图工具

软件包：https://pan.quark.cn/s/1d61f88f7a79
*/
// @namespace      https://github.com/benzBrake/FirefoxCustomize
// @author         Ryan
// @include        main
// @license        MIT License
// @compatibility  Firefox 127
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @downloadURL    https://github.com/benzBrake/FirefoxCustomize/raw/master/ScreenshotTools.uc.js.
// @version        0.0.3
// @note           0.0.3 修复 Bug 1937080 Block inline event handlers in Nightly and collect telemetry
// @note           0.0.2 修复无法打开系统画板
// @note           0.0.1
// ==/UserScript==
(async function (versionGE) {
    const CustomizableUI = imp('CustomizableUI');
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    window.ScreenshotTools = {
        ID_PREFIX: 'ScreenshotTools',
        MENUS: [
            {
                label: "隐藏火狐截图",
                exec: "\\UserTools\\SGScreencapture\\screencapture.exe",
                precommand: function () {
                    window.minimize();
                    setTimeout(() => {
                    }, 500);
                },
                image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy4zNjcgNC43OCBMIDMuODM3IDQuNzggTCAzLjgzNyA4LjI5NyBMIDUuNjAyIDguMjk3IEwgNS42MDIgNi41MzggTCA3LjM2NyA2LjUzOCBNIDE2LjE5MSA4LjI5NyBMIDE0LjQyNiA4LjI5NyBMIDE0LjQyNiAxMC4wNTUgTCAxMi42NiAxMC4wNTUgTCAxMi42NiAxMS44MTQgTCAxNi4xOTEgMTEuODE0IE0gMTcuOTU1IDEzLjU3MiBMIDIuMDczIDEzLjU3MiBMIDIuMDczIDMuMDIxIEwgMTcuOTU1IDMuMDIxIE0gMTcuOTU1IDEuMjYzIEwgMi4wNzMgMS4yNjMgQyAxLjA5MyAxLjI2MyAwLjMwOCAyLjA0NiAwLjMwOCAzLjAyMSBMIDAuMzA4IDEzLjU3MiBDIDAuMzA4IDE0LjU0MyAxLjA5NyAxNS4zMzIgMi4wNzMgMTUuMzMyIEwgOC4yNDkgMTUuMzMyIEwgOC4yNDkgMTcuMDkgTCA2LjQ4NCAxNy4wOSBMIDYuNDg0IDE4Ljg0OSBMIDEzLjU0NCAxOC44NDkgTCAxMy41NDQgMTcuMDkgTCAxMS43NzggMTcuMDkgTCAxMS43NzggMTUuMzMyIEwgMTcuOTU1IDE1LjMzMiBDIDE4LjkzIDE1LjMzMiAxOS43MiAxNC41NDMgMTkuNzIgMTMuNTcyIEwgMTkuNzIgMy4wMjEgQyAxOS43MiAyLjA1IDE4LjkzIDEuMjYzIDE3Ljk1NSAxLjI2MyIgc3R5bGU9IiIvPgo8L3N2Zz4='
            }, {}, {
                label: "滚动截图工具",
                oncommand: (event) => event.target.ownerDocument.getElementById('key_screenshot').doCommand(),
                image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4zKSI+PHBhdGggZD0iTTQgNEw0IDZMNiA2TDYgNCBaIE0gOCA0TDggNkwxMCA2TDEwIDQgWiBNIDEyIDRMMTIgNkwxNCA2TDE0IDQgWiBNIDE2IDRMMTYgNkwxOCA2TDE4IDQgWiBNIDIwIDRMMjAgNkwyMiA2TDIyIDQgWiBNIDI0IDRMMjQgNkwyNiA2TDI2IDQgWiBNIDQgOEw0IDEwTDYgMTBMNiA4IFogTSAyNCA4TDI0IDEwTDI2IDEwTDI2IDggWiBNIDQgMTJMNCAxNEw2IDE0TDYgMTIgWiBNIDI0IDEyTDI0IDE0TDI2IDE0TDI2IDEyIFogTSAxNC41IDEzTDE0LjE4NzUgMTMuNDA2MjVMMTMgMTVMOCAxNUw4IDI4TDI4IDI4TDI4IDE1TDIzIDE1TDIxLjgxMjUgMTMuNDA2MjVMMjEuNSAxMyBaIE0gMTUuNSAxNUwyMC41IDE1TDIxLjY4NzUgMTYuNTkzNzVMMjIgMTdMMjYgMTdMMjYgMjZMMTAgMjZMMTAgMTdMMTQgMTdMMTQuMzEyNSAxNi41OTM3NSBaIE0gNCAxNkw0IDE4TDYgMThMNiAxNiBaIE0gMTggMTdDMTUuODAwNzgxIDE3IDE0IDE4LjgwMDc4MSAxNCAyMUMxNCAyMy4xOTkyMTkgMTUuODAwNzgxIDI1IDE4IDI1QzIwLjE5OTIxOSAyNSAyMiAyMy4xOTkyMTkgMjIgMjFDMjIgMTguODAwNzgxIDIwLjE5OTIxOSAxNyAxOCAxNyBaIE0gMTggMTlDMTkuMTE3MTg4IDE5IDIwIDE5Ljg4MjgxMyAyMCAyMUMyMCAyMi4xMTcxODggMTkuMTE3MTg4IDIzIDE4IDIzQzE2Ljg4MjgxMyAyMyAxNiAyMi4xMTcxODggMTYgMjFDMTYgMTkuODgyODEzIDE2Ljg4MjgxMyAxOSAxOCAxOSBaIE0gNCAyMEw0IDIyTDYgMjJMNiAyMFoiLz48L3N2Zz4="
            }, {
                label: "网页所有区域",
                oncommand: event => window.ScreenshotTools.takeWebpageScreenShot(event.target.ownerDocument, true),
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4zKSI+PHBhdGggZD0iTTUgNkw1IDE0TDcgMTRMNyAxMUw5IDExTDkgOUw3IDlMNyA4TDEwIDhMMTAgNiBaIE0gMTEgNkwxMSAxMUMxMSAxMi42NDQ1MzEgMTIuMzU1NDY5IDE0IDE0IDE0QzE1LjY0NDUzMSAxNCAxNyAxMi42NDQ1MzEgMTcgMTFMMTcgNkwxNSA2TDE1IDExQzE1IDExLjU2NjQwNiAxNC41NjY0MDYgMTIgMTQgMTJDMTMuNDMzNTk0IDEyIDEzIDExLjU2NjQwNiAxMyAxMUwxMyA2IFogTSAxOCA2TDE4IDE0TDIyIDE0TDIyIDEyTDIwIDEyTDIwIDYgWiBNIDIzIDZMMjMgMTRMMjcgMTRMMjcgMTJMMjUgMTJMMjUgNiBaIE0gNSAxNkw1IDI2TDcgMjZMNyAxOEwxNSAxOEwxNSAyMi41NjI1TDEzLjcxODc1IDIxLjI4MTI1TDEyLjI4MTI1IDIyLjcxODc1TDE1LjI4MTI1IDI1LjcxODc1TDE2IDI2LjQwNjI1TDE2LjcxODc1IDI1LjcxODc1TDE5LjcxODc1IDIyLjcxODc1TDE4LjI4MTI1IDIxLjI4MTI1TDE3IDIyLjU2MjVMMTcgMThMMjUgMThMMjUgMjZMMjcgMjZMMjcgMTZaIi8+PC9zdmc+'
            }, {
                label: "网页可见区域",
                oncommand: event => window.ScreenshotTools.takeWebpageScreenShot(event.target.ownerDocument),
                image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4yKSI+PHBhdGggZD0iTTMgM0wzIDVMMyA4TDUgOEw1IDVMOCA1TDggM0w1IDNMMyAzIHogTSAxNiAzTDE2IDVMMTkgNUwxOSA4TDIxIDhMMjEgM0wxNiAzIHogTSAxMiAxMSBBIDEgMSAwIDAgMCAxMSAxMiBBIDEgMSAwIDAgMCAxMiAxMyBBIDEgMSAwIDAgMCAxMyAxMiBBIDEgMSAwIDAgMCAxMiAxMSB6IE0gMyAxNkwzIDIxTDUgMjFMOCAyMUw4IDE5TDUgMTlMNSAxNkwzIDE2IHogTSAxOSAxNkwxOSAxOUwxNiAxOUwxNiAyMUwyMSAyMUwyMSAxOUwyMSAxNkwxOSAxNiB6Ii8+PC9zdmc+"
            }, {}, {
                label: "颜色拾取工具",
                exec: '\\UserTools\\jcpicker4beta.exe',
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xKSI+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPjxwYXRoIGQ9Ik0xMiAzLjFMNy4wNSA4LjA1YTcgNyAwIDEgMCA5LjkgMEwxMiAzLjF6bTAtMi44MjhsNi4zNjQgNi4zNjRhOSA5IDAgMSAxLTEyLjcyOCAwTDEyIC4yNzJ6Ii8+PC9zdmc+'
            }, {
                label: "录制动态图片",
                exec: "\\UserTools\\ScreenToGif.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
            }, {
                label: "完整截图工具",
                exec: "\\UserTools\\FSCapture\\FSCapture.exe",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4zKSI+PHBhdGggZD0iTTUgM0MzLjg5NSAzIDMgMy44OTUgMyA1TDUgNUw1IDMgeiBNIDcgM0w3IDVMOSA1TDkgM0w3IDMgeiBNIDExIDNMMTEgNUwxMyA1TDEzIDNMMTEgMyB6IE0gMTUgM0wxNSA1TDE3IDVMMTcgM0wxNSAzIHogTSAxOSAzTDE5IDVMMjEgNUMyMSAzLjg5NSAyMC4xMDUgMyAxOSAzIHogTSAzIDdMMyA5TDUgOUw1IDdMMyA3IHogTSAxOSA3TDE5IDlMMjEgOUwyMSA3TDE5IDcgeiBNIDEyIDlMMTAuNjY3OTY5IDExTDguNSAxMUM3LjY3MiAxMSA3IDExLjY3MiA3IDEyLjVMNyAxOS41QzcgMjAuMzI4IDcuNjcyIDIxIDguNSAyMUwxOS41IDIxQzIwLjMyOCAyMSAyMSAyMC4zMjggMjEgMTkuNUwyMSAxMi41QzIxIDExLjY3MiAyMC4zMjggMTEgMTkuNSAxMUwxNy4zMzIwMzEgMTFMMTYgOUwxMiA5IHogTSAzIDExTDMgMTNMNSAxM0w1IDExTDMgMTEgeiBNIDEzLjA3MDMxMiAxMUwxNC45Mjk2ODggMTFMMTUuNjY5OTIyIDEyLjEwOTM3NUwxNi4yNjM2NzIgMTNMMTcuMzMyMDMxIDEzTDE5IDEzTDE5IDE5TDkgMTlMOSAxM0wxMC42Njc5NjkgMTNMMTEuNzM2MzI4IDEzTDEyLjMzMDA3OCAxMi4xMDkzNzVMMTMuMDcwMzEyIDExIHogTSAxNCAxNCBBIDIgMiAwIDAgMCAxMiAxNiBBIDIgMiAwIDAgMCAxNCAxOCBBIDIgMiAwIDAgMCAxNiAxNiBBIDIgMiAwIDAgMCAxNCAxNCB6IE0gMyAxNUwzIDE3TDUgMTdMNSAxNUwzIDE1IHogTSAzIDE5QzMgMjAuMTA1IDMuODk1IDIxIDUgMjFMNSAxOUwzIDE5IHoiLz48L3N2Zz4='
            }, {
                label: "打开系统画板",
                image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xKSI+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPjxwYXRoIGQ9Ik0xOS4yMjggMTguNzMybDEuNzY4LTEuNzY4IDEuNzY3IDEuNzY4YTIuNSAyLjUgMCAxIDEtMy41MzUgMHpNOC44NzggMS4wOGwxMS4zMTQgMTEuMzEzYTEgMSAwIDAgMSAwIDEuNDE1bC04LjQ4NSA4LjQ4NWExIDEgMCAwIDEtMS40MTQgMGwtOC40ODUtOC40ODVhMSAxIDAgMCAxIDAtMS40MTVsNy43NzgtNy43NzgtMi4xMjItMi4xMjFMOC44OCAxLjA4ek0xMSA2LjAzTDMuOTI5IDEzLjEgMTEgMjAuMTczbDcuMDcxLTcuMDcxTDExIDYuMDI5eiIvPjwvc3ZnPg==',
                oncommand: function () {
                    var environment = Components.classes["@mozilla.org/process/environment;1"].
                        getService(Components.interfaces.nsIEnvironment);

                    var cmd = PathUtils.join(environment.get("SystemRoot"), "System32", "cmd.exe");
                    ScreenshotTools.exec(cmd, "/c start /b mspaint.exe", { startHidden: true });
                }
            }
        ],
        HIDE_COMPONENT: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`#screenshots-component, #screenshotsPagePanel { visibility:hidden }`)),
            type: 0,
        },
        get sss () {
            delete this.sss;
            return this.sss = sss;
        },
        get isCapturing () {
            return !!this._isCapturing;
        },
        set isCapturing (val) {
            if (val) {
                addStyle(this.HIDE_COMPONENT);
            } else {
                removeStyle(this.HIDE_COMPONENT);
            }
            this._isCapturing = !!val;
        },
        getId (suffix) {
            return this.ID_PREFIX + '-' + suffix;
        },
        init () {
            document.addEventListener('DOMContentLoaded', this);
            const BTN_ID = this.getId('button');
            try {
                CustomizableUI.createWidget({
                    id: BTN_ID,
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    type: "custom",
                    onBuild: doc => this.createButton(doc, BTN_ID, this.getId('popup'))
                });
            } catch (ex) { }
        },
        createButton (doc, BTN_ID, POPUP_ID) {
            let btn = cEl(doc, 'toolbarbutton', {
                id: BTN_ID,
                label: "截图工具",
                tooltiptext: "左键：框选截图\n中键：截取网页可见区域\n右键：截图菜单",
                class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                type: "contextmenu",
                contextmenu: POPUP_ID,
                style: "list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4zKSI+PHBhdGggZD0iTTUgM0MzLjg5NSAzIDMgMy44OTUgMyA1TDUgNUw1IDMgeiBNIDcgM0w3IDVMOSA1TDkgM0w3IDMgeiBNIDExIDNMMTEgNUwxMyA1TDEzIDNMMTEgMyB6IE0gMTUgM0wxNSA1TDE3IDVMMTcgM0wxNSAzIHogTSAxOSAzTDE5IDVMMjEgNUMyMSAzLjg5NSAyMC4xMDUgMyAxOSAzIHogTSAzIDdMMyA5TDUgOUw1IDdMMyA3IHogTSAxOSA3TDE5IDlMMjEgOUwyMSA3TDE5IDcgeiBNIDEyIDlMMTAuNjY3OTY5IDExTDguNSAxMUM3LjY3MiAxMSA3IDExLjY3MiA3IDEyLjVMNyAxOS41QzcgMjAuMzI4IDcuNjcyIDIxIDguNSAyMUwxOS41IDIxQzIwLjMyOCAyMSAyMSAyMC4zMjggMjEgMTkuNUwyMSAxMi41QzIxIDExLjY3MiAyMC4zMjggMTEgMTkuNSAxMUwxNy4zMzIwMzEgMTFMMTYgOUwxMiA5IHogTSAzIDExTDMgMTNMNSAxM0w1IDExTDMgMTEgeiBNIDEzLjA3MDMxMiAxMUwxNC45Mjk2ODggMTFMMTUuNjY5OTIyIDEyLjEwOTM3NUwxNi4yNjM2NzIgMTNMMTcuMzMyMDMxIDEzTDE5IDEzTDE5IDE5TDkgMTlMOSAxM0wxMC42Njc5NjkgMTNMMTEuNzM2MzI4IDEzTDEyLjMzMDA3OCAxMi4xMDkzNzVMMTMuMDcwMzEyIDExIHogTSAxNCAxNCBBIDIgMiAwIDAgMCAxMiAxNiBBIDIgMiAwIDAgMCAxNCAxOCBBIDIgMiAwIDAgMCAxNiAxNiBBIDIgMiAwIDAgMCAxNCAxNCB6IE0gMyAxNUwzIDE3TDUgMTdMNSAxNUwzIDE1IHogTSAzIDE5QzMgMjAuMTA1IDMuODk1IDIxIDUgMjFMNSAxOUwzIDE5IHoiLz48L3N2Zz4=); fill: #3AADE2" // 修改为你喜欢的颜色
            });
            let menupopup = cEl(doc, 'menupopup', {
                id: POPUP_ID
            });
            menupopup.addEventListener('popupshowing', this, { once: true });
            btn.appendChild(menupopup);
            btn.addEventListener('click', this, false);
            return btn;
        },
        handleEvent (event) {
            switch (event.type) {
                case 'DOMContentLoaded':
                    this.initScreenPopupUIHanler(event.target);
                    break;
                case 'popupshowing':
                    this.initPopupMenu(event.target);
                    break;
                case 'click':
                    if (event.explicitOriginalTarget.localName !== "toolbarbutton") return;
                    switch (event.button) {
                        case 0:
                            // 搜狗截图工具
                            this.exec(this.handleRelativePath("\\UserTools\\Snapshot.exe"));
                            break;
                        case 1:
                            // 截图网页可视区域
                            this.takeWebpageScreenShot(event.target.ownerDocument);
                            break;
                    }
                    break;
            }
        },
        async initScreenPopupUIHanler (win) {
            const { location, documentElement: doc } = win;
            if (location.href.startsWith("chrome://browser/content/screenshots/screenshots-preview.html?")) {
                if (this.isCapturing) doc.style.display = "none";
                let preview_area = await new Promise(resolve => {
                    let count = 0;
                    let timer = setInterval(() => {
                        let area = doc.querySelector("screenshots-preview");
                        if (area) {
                            clearInterval(timer);
                            resolve(area);
                        }
                        if (count++ > 300) {
                            clearInterval(timer);
                            reject(null);
                        }
                    }, 10);
                });
                if (!preview_area) {
                    this.alert("获取截图预览窗口失败，请手动操作");
                    return;
                }
                let download_btn = await new Promise(resolve => {
                    let count = 0;
                    let timer = setInterval(() => {
                        let btn = preview_area.shadowRoot.querySelector("#download");
                        if (btn) {
                            clearInterval(timer);
                            resolve(btn);
                        }
                        if (count++ > 300) {
                            clearInterval(timer);
                            reject(null);
                        }
                    }, 10);
                });
                if (!download_btn) {
                    this.alert("无法自动点击下载按钮，请手动操作");
                    return;
                }
                download_btn.click();
                this.isCapturing = false;
            }
        },
        initPopupMenu (popup) {
            const doc = popup.ownerDocument;
            this.MENUS.forEach(cfg => {
                let el;
                if (Object.keys(cfg).length === 0) {
                    el = cEl(doc, 'menuseparator');
                } else {
                    if ("exec" in cfg) {
                        cfg.exec = this.handleRelativePath(cfg.exec);
                    }
                    el = cEl(doc, 'menuitem', cfg, ["image"]);
                    el.classList.add('menuitem-iconic');
                    this.setIcon(el, cfg);
                    if (!("oncommand" in cfg)) {
                        el.addEventListener("command", function (event) {
                            window.ScreenshotTools.onCommand(event);
                        });
                    }
                }
                if (el) popup.appendChild(el);
            });
        },
        handleRelativePath (path, parentPath) {
            if (path) {
                path = path.replace(/\//g, '\\');
                if (/^(\\)/.test(path)) {
                    if (!parentPath) {
                        parentPath = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("UChrm", Components.interfaces.nsIFile).path;
                    }
                    path = parentPath + path;
                    path = path.replace("\\\\", "\\");
                }
                return path;
            }
        },
        setIcon (menu, cfg) {
            if (menu.hasAttribute("src") || menu.hasAttribute("icon"))
                return;

            if (cfg.image) {
                setImage(menu, cfg.image)
                return;
            }

            if (cfg.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(cfg.exec);
                } catch (e) {
                    return;
                }
                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = this.getURLSpecFromFile(aFile);
                        setImage(menu, "moz-icon://" + fileURL + "?size=16");
                    } else {
                        setImage(menu, "chrome://global/skin/icons/folder.svg")
                    }
                }
                return;
            }

            function setImage(item, image) {
                if (versionGE('143a1')) {
                    item.style.setProperty("--menuitem-icon", "url(" + image + ")");
                } else {
                    item.style.listStyleImage = "url(" + image + ")";
                }
            }

        },
        getURLSpecFromFile (aFile) {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            return fph.getURLSpecFromActualFile(aFile);
        },
        onCommand (event) {
            let item = event.target;
            let precommand = item.getAttribute('precommand') || "",
                postcommand = item.getAttribute("postcommand") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "";
            if (precommand) eval(precommand);
            if (exec)
                this.exec(exec, text);
            if (postcommand) eval(postcommand);
        },
        exec (path, arg, opt = { startHidden: false }) {
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
                    console.error("file not found %s".replace("%s", path));
                    return;
                }

                if (file.isExecutable()) {
                    process.init(file);
                    process.runw(false, a, a.length);
                } else {
                    file.launch();
                }
            } catch (e) {
                console.error(e);
            }
        },
        async takeWebpageScreenShot (doc, isFullPage) {
            this.isCapturing = true;
            doc.getElementById('key_screenshot').doCommand();
            let btn = await this.getScreenSortButton(doc, isFullPage);
            if (btn) {
                btn.click();
            } else {
                this.alert("截图按钮未找到，请手动截图");
                this.isCapturing = false;
            }
        },
        async getScreenSortButton (doc, isFullPage) {
            let screenshotsPagePanel = await new Promise(resolve => {
                let count = 0;
                let interval = setInterval(() => {
                    let screenshotsPagePanel = doc.getElementById("screenshotsPagePanel");
                    if (count++ > 200) {
                        clearInterval(interval);
                        resolve(null);
                    }
                    if (screenshotsPagePanel) {
                        clearInterval(interval);
                        resolve(screenshotsPagePanel);
                    }
                }, 10);
            });
            return screenshotsPagePanel.querySelector("screenshots-buttons").shadowRoot.querySelector(isFullPage ? "#full-page" : "#visible-page");
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
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "addMenuPlus",
                aMsg + "", !!callback, "", callback);
        },
        destroy () {
            document.removeEventListener('DOMContentLoaded', this);
            CustomizableUI.destroyWidget(this.getId('button'));
        }
    }

    window.ScreenshotTools.init();

    function imp (name) {
        if (name in globalThis) return globalThis[name];
        var url = `resource:///modules/${name}.`;
        try { var exp = ChromeUtils.importESModule(url + "sys.mjs"); }
        catch { exp = ChromeUtils.import(url + "jsm"); }
        return exp[name];
    }

    /**
     * 创建 DOM 元素
     * 
     * @param {Document} d HTML 文档
     * @param {string} t DOM 元素标签
     * @param {Object} o DOM 元素属性键值对
     * @returns 
     */
    function cEl (d, t, o = {}, s) {
        if (!d) return;
        if (!Array.isArray(s)) s = [];
        let e = /^html:/.test(t) ? d.createElement(t) : d.createXULElement(t);
        for (let [k, v] of Object.entries(o)) {
            if (s.includes(k)) continue;
            if (k.startsWith('on')) {
                if (typeof v === 'function') {
                    const ev = k.replace(/^on/, '');
                    ev === 'wheel' ? e.addEventListener(ev, v, { passive: true }) : e.addEventListener(ev, v);
                } else {
                    let error = new Error('addMenuPlus: $C: ' + key + ' is not a function');
                    console.error(error);
                }
            } else {
                e.setAttribute(k, v);
            }
        }
        return e;
    }

    function addStyle (style) {
        if (sss.sheetRegistered(style.url, style.type)) return false;
        sss.loadAndRegisterSheet(style.url, style.type);
        return true;
    }

    function removeStyle (style) {
        if (sss.sheetRegistered(style.url, style.type)) {
            sss.unregisterSheet(style.url, style.type);
            return true;
        }
        return false;
    }
})(v => Services.vc.compare(Services.appinfo.version, v) >= 0)