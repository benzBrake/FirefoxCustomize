// ==UserScript==
// @name            TabPlus.uc.js
// @description     设置标签的打开方式
// @license         MIT License
// @startup         window.TabPlus.init(win);
// @shutdown        window.TabPlus.unload();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    if (window.TabPlus) {
        window.TabPlus.unload();
        delete window.TabPlus;
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

    const MENU_CFG = [{
        label: "标签设置",
        id: "TabPlus-menu",
        image: "data:image/svg+xml;base64,77u/PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik05MDguOCAxMDA1LjQ0SDExNS4yYTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyLTEwMS43NlYxMTAuNzJBMTAxLjc2IDEwMS43NiAwIDAgMSAxMTUuMiA4Ljk2aDI5Ni45NmEzMi42NCAzMi42NCAwIDAgMSAzMiAzMlYyNjIuNGEzMiAzMiAwIDAgMS0zMiAzMiAzMiAzMiAwIDAgMS0zMi0zMnYtMTkySDExNS4yYTM3Ljc2IDM3Ljc2IDAgMCAwLTM3LjEyIDM3Ljc2djc5NS41MmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMiAzNy43Nmg3OTMuNmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMi0zNy43NlYyNjcuNTJhMzIgMzIgMCAwIDEgMzItMzIgMzIgMzIgMCAwIDEgMzIgMzJ2NjM2LjE2YTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyIDEwMS43NnoiPjwvcGF0aD48cGF0aCBkPSJNOTc3LjkyIDI5OS41MmEzMi42NCAzMi42NCAwIDAgMS0zMi0zMlYxODAuNDhhMzcuMTIgMzcuMTIgMCAwIDAtMzcuMTItMzcuNzZINDIxLjEyYTMyIDMyIDAgMCAxLTMyLTMyIDMyIDMyIDAgMCAxIDMyLTMyaDQ4Ny42OGExMDEuNzYgMTAxLjc2IDAgMCAxIDEwMS4xMiAxMDEuNzZ2ODcuMDRhMzIgMzIgMCAwIDEtMzIgMzJ6Ij48L3BhdGg+PHBhdGggZD0iTTk3Ny45MiAyOTkuNTJINjRhMzIgMzIgMCAwIDEtMzItMzIgMzIgMzIgMCAwIDEgMzItMzJoOTEzLjkyYTMyIDMyIDAgMCAxIDMyIDMyIDMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjxwYXRoIGQ9Ik02OTkuNTIgMjk5LjUyYTMyIDMyIDAgMCAxLTMyLTMyVjExMC43MmEzMiAzMiAwIDAgMSA2NCAwdjE1Ni44YTMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjwvc3ZnPg==",
        popup: [{
            label: '新标签页打开',
            image: "data:image/svg+xml;base64,77u/PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik05MDguOCAxMDA1LjQ0SDExNS4yYTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyLTEwMS43NlYxMTAuNzJBMTAxLjc2IDEwMS43NiAwIDAgMSAxMTUuMiA4Ljk2aDI5Ni45NmEzMi42NCAzMi42NCAwIDAgMSAzMiAzMlYyNjIuNGEzMiAzMiAwIDAgMS0zMiAzMiAzMiAzMiAwIDAgMS0zMi0zMnYtMTkySDExNS4yYTM3Ljc2IDM3Ljc2IDAgMCAwLTM3LjEyIDM3Ljc2djc5NS41MmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMiAzNy43Nmg3OTMuNmEzNy43NiAzNy43NiAwIDAgMCAzNy4xMi0zNy43NlYyNjcuNTJhMzIgMzIgMCAwIDEgMzItMzIgMzIgMzIgMCAwIDEgMzIgMzJ2NjM2LjE2YTEwMS43NiAxMDEuNzYgMCAwIDEtMTAxLjEyIDEwMS43NnoiPjwvcGF0aD48cGF0aCBkPSJNOTc3LjkyIDI5OS41MmEzMi42NCAzMi42NCAwIDAgMS0zMi0zMlYxODAuNDhhMzcuMTIgMzcuMTIgMCAwIDAtMzcuMTItMzcuNzZINDIxLjEyYTMyIDMyIDAgMCAxLTMyLTMyIDMyIDMyIDAgMCAxIDMyLTMyaDQ4Ny42OGExMDEuNzYgMTAxLjc2IDAgMCAxIDEwMS4xMiAxMDEuNzZ2ODcuMDRhMzIgMzIgMCAwIDEtMzIgMzJ6Ij48L3BhdGg+PHBhdGggZD0iTTk3Ny45MiAyOTkuNTJINjRhMzIgMzIgMCAwIDEtMzItMzIgMzIgMzIgMCAwIDEgMzItMzJoOTEzLjkyYTMyIDMyIDAgMCAxIDMyIDMyIDMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjxwYXRoIGQ9Ik02OTkuNTIgMjk5LjUyYTMyIDMyIDAgMCAxLTMyLTMyVjExMC43MmEzMiAzMiAwIDAgMSA2NCAwdjE1Ni44YTMyIDMyIDAgMCAxLTMyIDMyeiI+PC9wYXRoPjwvc3ZnPg==",
            popup: [{
                label: '地址栏',
                type: 'checkbox',
                pref: 'browser.urlbar.openintab'
            },
            {
                label: '搜索栏',
                type: 'checkbox',
                pref: 'browser.search.openintab'
            },
            {
                label: '书签',
                type: 'checkbox',
                pref: 'browser.tabs.loadBookmarksInTabs'
            }, {
                label: '历史',
                type: 'checkbox',
                pref: 'browser.tabs.loadHistoryInTabs'
            }]
        },
        {
            label: "后台打开",
            image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik0zNSAzOWMtMi43NTcgMC01LTIuMjQzLTUtNXMyLjI0My01IDUtNSA1IDIuMjQzIDUgNVMzNy43NTcgMzkgMzUgMzl6TTggMTVBMyAzIDAgMTA4IDIxIDMgMyAwIDEwOCAxNXpNMTQgMzdBMiAyIDAgMTAxNCA0MSAyIDIgMCAxMDE0IDM3ek0zMC4wMDEgMTRDMzAgMTQgMzAgMTQgMzAgMTRoLS4wMDJjLTIuMjA1LS4wMDEtMy45OTktMS43OTYtMy45OTgtNC4wMDEgMC0xLjA2OC40MTctMi4wNzMgMS4xNzItMi44MjhDMjcuOTI4IDYuNDE2IDI4LjkzMiA2IDI5Ljk5OSA2IDMwIDYgMzAgNiAzMCA2YzIuMjA3LjAwMSA0IDEuNzk2IDQgNC4wMDEgMCAxLjA2OC0uNDE3IDIuMDczLTEuMTcyIDIuODI4QzMyLjA3MiAxMy41ODQgMzEuMDY4IDE0IDMwLjAwMSAxNHpNMjQuNSAzOUExLjUgMS41IDAgMTAyNC41IDQyIDEuNSAxLjUgMCAxMDI0LjUgMzl6TTE3LjUgMTNjLTEuOTMgMC0zLjUtMS41Ny0zLjUtMy41UzE1LjU3IDYgMTcuNSA2IDIxIDcuNTcgMjEgOS41IDE5LjQzIDEzIDE3LjUgMTN6TTcuNSAzM2MxLjM4MSAwIDIuNS0xLjExOSAyLjUtMi41UzguODgxIDI4IDcuNSAyOGwwIDBDNi4xMTkgMjggNSAyOS4xMTkgNSAzMC41UzYuMTE5IDMzIDcuNSAzM3pNMzguNSAyNWMtMi40ODEgMC00LjUtMi4wMTktNC41LTQuNXMyLjAxOS00LjUgNC41LTQuNSA0LjUgMi4wMTkgNC41IDQuNVM0MC45ODEgMjUgMzguNSAyNXoiLz48L3N2Zz4=",
            popup: [{
                label: '打开图片',
                type: 'checkbox',
                default: 1,
                pref: 'browser.tabs.loadImageInBackground'
            }, {
                label: '中键点击链接',
                type: 'checkbox',
                default: 1,
                pref: 'browser.tabs.loadInBackground',
            }]
        },
        {
            label: "关闭标签页",
            image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTYuMDA3ODEzIDYuMDAzOTA2QzQuMzU5Mzc1IDYuMDAzOTA2IDMuMDA3ODEzIDcuMzU5Mzc1IDMuMDA3ODEzIDkuMDAzOTA2TDMuMDA3ODEzIDE1TDMuMDExNzE5IDE1TDMuMDExNzE5IDQxQzMuMDExNzE5IDQyLjA5Mzc1IDMuOTE3OTY5IDQzIDUuMDExNzE5IDQzTDMwLjQ2NDg0NCA0M0MzMS43NDYwOTQgNDcuMDQ2ODc1IDM1LjU0Mjk2OSA1MCA0MCA1MEM0NS41IDUwIDUwIDQ1LjUgNTAgNDBDNTAgMzcuMjE4NzUgNDguODQ3NjU2IDM0LjY5OTIxOSA0NyAzMi44Nzg5MDZMNDcgMTVDNDcgMTMuOTA2MjUgNDYuMDkzNzUgMTMgNDUgMTNMNDEgMTNMNDEgOS4wMDM5MDZDNDEgNy4zNTkzNzUgMzkuNjQ0NTMxIDYuMDAzOTA2IDM4IDYuMDAzOTA2TDMwIDYuMDAzOTA2QzI5LjIzMDQ2OSA2LjAwMzkwNiAyOC41MzUxNTYgNi4zMDg1OTQgMjggNi43ODkwNjNDMjcuNDY0ODQ0IDYuMzA4NTk0IDI2Ljc2OTUzMSA2LjAwMzkwNiAyNiA2LjAwMzkwNkwxOCA2LjAwMzkwNkMxNy4yMzA0NjkgNi4wMDM5MDYgMTYuNTM1MTU2IDYuMzA4NTk0IDE2IDYuNzg5MDYzQzE1LjQ2NDg0NCA2LjMwODU5NCAxNC43Njk1MzEgNi4wMDM5MDYgMTQgNi4wMDM5MDYgWiBNIDYuMDA3ODEzIDguMDAzOTA2TDE0IDguMDAzOTA2QzE0LjU2NjQwNiA4LjAwMzkwNiAxNSA4LjQzNzUgMTUgOS4wMDM5MDZMMTUgMTVMNDUgMTVMNDUgMzEuMzU5Mzc1QzQzLjczNDM3NSAzMC42MjEwOTQgNDIuMzAwNzgxIDMwLjE1NjI1IDQwLjc2OTUzMSAzMC4wMzkwNjNDNDAuNTE1NjI1IDMwLjAxNTYyNSA0MC4yNjE3MTkgMzAgNDAgMzBDMzkuMzEyNSAzMCAzOC42NDA2MjUgMzAuMDcwMzEzIDM3Ljk5MjE4OCAzMC4yMDMxMjVDMzcuNjY3OTY5IDMwLjI2OTUzMSAzNy4zNDc2NTYgMzAuMzU1NDY5IDM3LjAzNTE1NiAzMC40NTMxMjVDMzMuOTAyMzQ0IDMxLjQyNTc4MSAzMS40MjU3ODEgMzMuOTAyMzQ0IDMwLjQ1MzEyNSAzNy4wMzUxNTZDMzAuMzU1NDY5IDM3LjM0NzY1NiAzMC4yNjk1MzEgMzcuNjY0MDYzIDMwLjIwMzEyNSAzNy45ODgyODFDMzAuMjAzMTI1IDM3Ljk4ODI4MSAzMC4yMDMxMjUgMzcuOTkyMTg4IDMwLjIwMzEyNSAzNy45OTIxODhDMzAuMDcwMzEzIDM4LjY0MDYyNSAzMCAzOS4zMTI1IDMwIDQwQzMwIDQwLjMzNTkzOCAzMC4wMTk1MzEgNDAuNjcxODc1IDMwLjA1MDc4MSA0MUw1LjAxMTcxOSA0MUw1LjAxMTcxOSAxM0w1LjAwNzgxMyAxM0w1LjAwNzgxMyA5LjAwMzkwNkM1LjAwNzgxMyA4LjQzNzUgNS40NDE0MDYgOC4wMDM5MDYgNi4wMDc4MTMgOC4wMDM5MDYgWiBNIDE4IDguMDAzOTA2TDI2IDguMDAzOTA2QzI2LjU2NjQwNiA4LjAwMzkwNiAyNyA4LjQzNzUgMjcgOS4wMDM5MDZMMjcgMTNMMTcgMTNMMTcgOS4wMDM5MDZDMTcgOC40Mzc1IDE3LjQzMzU5NCA4LjAwMzkwNiAxOCA4LjAwMzkwNiBaIE0gMzAgOC4wMDM5MDZMMzggOC4wMDM5MDZDMzguNTY2NDA2IDguMDAzOTA2IDM5IDguNDM3NSAzOSA5LjAwMzkwNkwzOSAxM0wyOSAxM0wyOSA5LjAwMzkwNkMyOSA4LjQzNzUgMjkuNDMzNTk0IDguMDAzOTA2IDMwIDguMDAzOTA2IFogTSA0MCAzMkM0MC4yNjk1MzEgMzIgNDAuNTM1MTU2IDMyLjAxNTYyNSA0MC43OTY4NzUgMzIuMDQyOTY5QzQwLjg0NzY1NiAzMi4wNDY4NzUgNDAuODk4NDM4IDMyLjA1NDY4OCA0MC45NTMxMjUgMzIuMDYyNUM0MS4xNjQwNjMgMzIuMDg5ODQ0IDQxLjM3NSAzMi4xMTcxODggNDEuNTc4MTI1IDMyLjE2MDE1NkM0MS42MzY3MTkgMzIuMTcxODc1IDQxLjY5MTQwNiAzMi4xODc1IDQxLjc0NjA5NCAzMi4xOTkyMTlDNDEuOTM3NSAzMi4yNDIxODggNDIuMTI1IDMyLjI4OTA2MyA0Mi4zMTI1IDMyLjM0Mzc1QzQyLjM5MDYyNSAzMi4zNzEwOTQgNDIuNDY4NzUgMzIuMzk4NDM4IDQyLjU0Njg3NSAzMi40MjU3ODFDNDIuNzEwOTM4IDMyLjQ4MDQ2OSA0Mi44NzEwOTQgMzIuNTM5MDYzIDQzLjAzMTI1IDMyLjYwNTQ2OUM0My4xMTMyODEgMzIuNjM2NzE5IDQzLjE5OTIxOSAzMi42NzU3ODEgNDMuMjgxMjUgMzIuNzE0ODQ0QzQzLjQyMTg3NSAzMi43NzczNDQgNDMuNTU4NTk0IDMyLjg0Mzc1IDQzLjY5NTMxMyAzMi45MTc5NjlDNDMuNzg1MTU2IDMyLjk2NDg0NCA0My44NzUgMzMuMDE1NjI1IDQzLjk2MDkzOCAzMy4wNjI1QzQ0LjA4OTg0NCAzMy4xNDA2MjUgNDQuMjE4NzUgMzMuMjE4NzUgNDQuMzQzNzUgMzMuMjk2ODc1QzQ0LjQzNzUgMzMuMzU5Mzc1IDQ0LjUyMzQzOCAzMy40MTc5NjkgNDQuNjEzMjgxIDMzLjQ4NDM3NUM0NC43MTg3NSAzMy41NTQ2ODggNDQuODIwMzEzIDMzLjYzMjgxMyA0NC45MjE4NzUgMzMuNzEwOTM4QzQ1LjAxOTUzMSAzMy43ODkwNjMgNDUuMTE3MTg4IDMzLjg2NzE4OCA0NS4yMTQ4NDQgMzMuOTUzMTI1QzQ2LjkxNDA2MyAzNS40MjE4NzUgNDggMzcuNTg5ODQ0IDQ4IDQwQzQ4IDQ0LjM5ODQzOCA0NC4zOTg0MzggNDggNDAgNDhDMzYuMTk5MjE5IDQ4IDMzIDQ1LjMxMjUgMzIuMTk5MjE5IDQxLjc0NjA5NEMzMi4xNDA2MjUgNDEuNDg4MjgxIDMyLjA5NzY1NiA0MS4yMzA0NjkgMzIuMDYyNSA0MC45Njg3NUMzMi4wNjI1IDQwLjk0MTQwNiAzMi4wNTQ2ODggNDAuOTE0MDYzIDMyLjA1MDc4MSA0MC44ODY3MTlDMzIuMDE5NTMxIDQwLjU5Mzc1IDMyIDQwLjI5Njg3NSAzMiA0MEMzMiAzOS43MjY1NjMgMzIuMDE1NjI1IDM5LjQ1MzEyNSAzMi4wNDI5NjkgMzkuMTg3NUMzMi4wNDI5NjkgMzkuMTgzNTk0IDMyLjAzOTA2MyAzOS4xNzk2ODggMzIuMDQyOTY5IDM5LjE3OTY4OEMzMi40MjU3ODEgMzUuNDI5Njg4IDM1LjQyOTY4OCAzMi40MjU3ODEgMzkuMTc5Njg4IDMyLjA0Mjk2OUMzOS4xNzk2ODggMzIuMDM5MDYzIDM5LjE4MzU5NCAzMi4wNDI5NjkgMzkuMTg3NSAzMi4wNDI5NjlDMzkuNDUzMTI1IDMyLjAxMTcxOSAzOS43MjY1NjMgMzIgNDAgMzIgWiBNIDM2LjUgMzUuNUMzNi4yNSAzNS41IDM2IDM1LjYwMTU2MyAzNS44MDA3ODEgMzUuODAwNzgxQzM1LjQwMjM0NCAzNi4xOTkyMTkgMzUuNDAyMzQ0IDM2LjgwMDc4MSAzNS44MDA3ODEgMzcuMTk5MjE5TDM4LjU5NzY1NiA0MEwzNS44MDA3ODEgNDIuODAwNzgxQzM1LjQwMjM0NCA0My4xOTkyMTkgMzUuNDAyMzQ0IDQzLjgwMDc4MSAzNS44MDA3ODEgNDQuMTk5MjE5QzM2IDQ0LjM5ODQzOCAzNi4zMDA3ODEgNDQuNSAzNi41IDQ0LjVDMzYuNjk5MjE5IDQ0LjUgMzcgNDQuMzk4NDM4IDM3LjE5OTIxOSA0NC4xOTkyMTlMNDAgNDEuNDAyMzQ0TDQyLjgwMDc4MSA0NC4xOTkyMTlDNDMgNDQuMzk4NDM4IDQzLjMwMDc4MSA0NC41IDQzLjUgNDQuNUM0My42OTkyMTkgNDQuNSA0NCA0NC4zOTg0MzggNDQuMTk5MjE5IDQ0LjE5OTIxOUM0NC41OTc2NTYgNDMuODAwNzgxIDQ0LjU5NzY1NiA0My4xOTkyMTkgNDQuMTk5MjE5IDQyLjgwMDc4MUw0MS40MDIzNDQgNDBMNDQuMTk5MjE5IDM3LjE5OTIxOUM0NC41OTc2NTYgMzYuODAwNzgxIDQ0LjU5NzY1NiAzNi4xOTkyMTkgNDQuMTk5MjE5IDM1LjgwMDc4MUM0My44MDA3ODEgMzUuNDAyMzQ0IDQzLjE5OTIxOSAzNS40MDIzNDQgNDIuODAwNzgxIDM1LjgwMDc4MUw0MCAzOC41OTc2NTZMMzcuMTk5MjE5IDM1LjgwMDc4MUMzNyAzNS42MDE1NjMgMzYuNzUgMzUuNSAzNi41IDM1LjVaIiAvPg0KPC9zdmc+",
            popup: [{
                label: '左键双击',
                type: 'checkbox',
                pref: 'browser.tabs.closeTabByDblclick'
            },
            {
                label: '右键',
                type: 'checkbox',
                pref: 'browser.tabs.closeTabByRightClick'
            }
            ]
        },
        {
            label: '在当前标签右侧打开新标签页',
            type: 'checkbox',
            default: 0,
            pref: 'browser.tabs.insertAfterCurrent'
        },
        {
            label: '关闭最后一个标签页后关闭窗口',
            type: 'checkbox',
            default: 1,
            pref: 'browser.tabs.closeWindowWithLastTab'
        },
        {
            group: [{
                label: '自动选中鼠标指向标签页',
                type: 'checkbox',
                pref: 'browser.tabs.switchOnHover'
            }, {
                label: '设置延时',
                pref: 'browser.tabs.switchOnHoverDelay',
                type: 'int',
                default: 150,
                style: 'list-style-image: url("chrome://browser/skin/history.svg");'
            }]
        },
        {
            label: '滚轮切换标签页',
            type: 'checkbox',
            pref: 'browser.tabs.swithOnScroll'
        },
        {
            label: '右键单击新建标签按钮打开剪贴板地址',
            type: 'checkbox',
            pref: 'browser.tabs.newTabBtn.rightClickLoadFromClipboard'
        },
        {
            label: '中键打开书签不关闭书签菜单',
            type: 'checkbox',
            pref: 'browser.bookmarks.openInTabClosesMenu',
        },
        {
            label: '关闭标签页选中左侧标签页',
            type: 'checkbox',
            pref: 'browser.tabs.selectLeftTabOnClose'
        },
        {
            label: '显示 Firefox 今日按钮',
            type: 'checkbox',
            pref: 'browser.tabs.firefox-view',
            style: 'list-style-image: url(chrome://devtools/skin/images/browsers/firefox.svg);',
            postcommand: 'Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);'
        }
        ]
    }];

    const FUNCTION_LIST = {
        'browser.tabs.closeTabByDblclick': {
            el: gBrowser.tabContainer,
            event: 'dblclick',
            callback: function (event) {
                // 双击标签页关闭标签页
                if (event.button == 0 && !event.ctrlKey) {
                    const tab = event.target.closest('.tabbrowser-tab');
                    if (!tab) return;
                    gBrowser.removeTab(tab);
                    gBrowser.removeTab(tab, { animate: true });
                }
            }
        },
        'browser.tabs.switchOnHover': {
            el: gBrowser.tabContainer.parentNode,
            event: 'mouseover',
            callback: function (event) {
                // 自动切换到鼠标指向标签页
                if (!window.TabPlus && !cPref.get('browser.tabs.switchOnHover')) return;
                if (event.target.ownerGlobal.document.getElementById('TabsToolbar').getAttribute('customizing') === "true") return;
                const tab = event.target.closest('#firefox-view-button,.tabbrowser-tab');
                if (!tab) return;
                timeout = setTimeout(() =>
                    tab.id === "firefox-view-button" ? tab.click() : gBrowser.selectedTab = tab
                    , cPref.get('browser.tabs.swithOnHoverDelay', 150));
            },
        },
        'browser.tabs.closeTabByRightClick': {
            el: gBrowser.tabContainer,
            event: 'click',
            callback: function (event) {
                // 右键关闭标签页
                if (event.button == 2 && !event.shiftKey) {
                    const tab = event.target.closest('.tabbrowser-tab');
                    if (!tab) return;
                    gBrowser.removeTab(tab);
                    gBrowser.removeTab(tab, { animate: false });
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        },
        'browser.tabs.swithOnScroll': {
            el: gBrowser.tabContainer,
            event: 'wheel',
            callback: function (event) {
                let dir = -1 * Math.sign(event.deltaY);
                setTimeout(function () {
                    gBrowser.tabContainer.advanceSelectedTab(dir, true);
                }, 0);
            }
        },
        'browser.tabs.loadHistoryInTabs': {
            init: function () {
                TabPlus.ORIGINAL_LIST['PlacesUIUtils_openNodeWithEvent'] = PlacesUIUtils.openNodeWithEvent.toString();
                eval('PlacesUIUtils.openNodeWithEvent = ' + PlacesUIUtils.openNodeWithEvent.toString()
                    .replace(' && lazy.PlacesUtils.nodeIsBookmark(aNode)', '')
                    .replace(' && PlacesUtils.nodeIsBookmark(aNode)', '')
                    .replace('getBrowserWindow(window)',
                        '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()')
                );
            },
            destroy: function () {
                eval('PlacesUIUtils.openNodeWithEvent = ' + TabPlus.ORIGINAL_LIST['PlacesUIUtils_openNodeWithEvent']
                    .replace('getBrowserWindow(window)',
                        '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()')
                    .replace('lazy.', '')
                );
            }
        },
        'browser.tabs.loadImageInBackground': {
            trigger: false,
            el: document.getElementById('context-viewimage'),
            event: 'command',
            init: function () {
                document.getElementById('context-viewimage').setAttribute('oncommand', null);
            },
            destroy: function () {
                document.getElementById('context-viewimage').setAttribute('oncommand', 'gContextMenu.viewMedia(event);');
            },
            callback: function (e) {
                e.preventDefault();
                let where = whereToOpenLink(e, false, false);
                if (where == "current") {
                    where = "tab";
                }
                let referrerInfo = gContextMenu.contentData.referrerInfo;
                let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
                if (gContextMenu.onCanvas) {
                    gContextMenu._canvasToBlobURL(gContextMenu.targetIdentifier).then(function (blobURL) {
                        openLinkIn(blobURL, where, {
                            referrerInfo,
                            triggeringPrincipal: systemPrincipal,
                            inBackground: e.button !== 0
                        });
                    }, Cu.reportError);
                } else {
                    urlSecurityCheck(
                        gContextMenu.mediaURL,
                        gContextMenu.principal,
                        Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT
                    );

                    // Default to opening in a new tab.
                    openLinkIn(gContextMenu.mediaURL, where, {
                        referrerInfo,
                        forceAllowDataURI: true,
                        triggeringPrincipal: gContextMenu.principal,
                        csp: gContextMenu.csp,
                        inBackground: e.button !== 0
                    });
                }
            }
        },
        'browser.tabs.selectLeftTabOnClose': {
            el: gBrowser.tabContainer,
            event: "TabClose",
            callback: function (event) {
                // 关闭标签页后选择左侧标签
                var tab = event.target;
                gBrowser.selectedTab = tab;
                if (gBrowser.selectedTab._tPos != 0) {
                    gBrowser.tabContainer.advanceSelectedTab(-1, true);
                }
            }
        },
        'browser.tabs.newTabBtn.rightClickLoadFromClipboard': {
            el: gBrowser.tabContainer,
            event: 'click',
            callback: function (e) {
                if (e.target.id === 'tabs-newtab-button' && e.button === 2 && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    let win = e.target.ownerGlobal;
                    let url = win.readFromClipboard();
                    if (!url) {
                        win.BrowserOpenTab();
                    } else {
                        try {
                            switchToTabHavingURI(url, true);
                        } catch (ex) {
                            if (/((https?|ftp|gopher|telnet|file|notes|ms-help|chrome|resource):((\/\/)|(\\\\))+[\w\d:#@%\/;$()~_\+-=\\\.&]*)/.test(url)) {
                                win.gBrowser.loadOneTab(encodeURIComponent(url), {
                                    inBackground: false,
                                    relatedToCurrent: false,
                                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) //FF63
                                });
                            } else {
                                Services.search.getDefault().then(
                                    engine => {
                                        let submission = engine.getSubmission(url, null, 'search');
                                        win.openLinkIn(submission.uri.spec, 'tab', {
                                            private: false,
                                            postData: submission.postData,
                                            inBackground: false,
                                            relatedToCurrent: true,
                                            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                                        });
                                    }
                                );
                            }

                        }
                    }
                }
            }
        },
    };

    window.TabPlus = {
        PREF_LISTENER_LIST: {},
        MENU_LISTENER_LIST: {},
        ORIGINAL_LIST: {},
        FUNCTION_LIST: FUNCTION_LIST,
        get id() {
            if (!this._id) this._id = 1;
            return this._id++;
        },
        callback: (obj, pref) => {
            if (!!TabPlus.FUNCTION_LIST[pref]) {
                let val = TabPlus.FUNCTION_LIST[pref];
                let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                if (obj === trigger) {
                    if (typeof val.init === "function") val.init();
                    if (typeof TabPlus.FUNCTION_LIST[pref].callback === "function") val.el.addEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.args || false);
                } else {
                    if (typeof TabPlus.FUNCTION_LIST[pref].callback === "function") val.el.removeEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback);
                    if (typeof val.destroy === "function") val.destroy();
                }
            }
        },
        createMenuItems: function () {
            let toolIns = $("prefSep") || $("webDeveloperMenu");
            this.menuitems = [];
            MENU_CFG.forEach(item => {
                let menuitem = TabPlus.createMenu(item);
                toolIns.parentNode.insertBefore(menuitem, toolIns);
                this.menuitems.push(menuitem);
            });

        },
        createMenu(obj, aDoc) {
            if (!obj) return;
            aDoc || (aDoc = this.win.document);
            let el, item;
            if (obj.popup) {
                el = $C(aDoc, 'menupopup', obj, ['popup']);
                obj.popup.forEach(child => el.appendChild(TabPlus.createMenuItem(child, aDoc)));
            }
            if (obj.group) {
                el = $C(aDoc, 'menugroup', obj, ['group']);
                obj.group.forEach(child => el.appendChild(TabPlus.createMenuItem(child, aDoc)));
                item = el;
            } else {
                item = $C(aDoc, 'menu', obj, ['popup']);
                item.classList.add('menu-iconic');
                if (el) item.appendChild(el);
            }
            return item;
        },
        createMenuItem(obj, aDoc) {
            if (!obj) return;
            aDoc || (aDoc = this.win.document);
            let item,
                classList = [],
                tagName = 'menuitem';
            if (['separator', 'menuseparator'].includes(obj.type) || !obj.pref && !obj.popup && !obj.group) {
                return $C(aDoc, 'menuseparator', obj, ['type', 'group', 'popup']);
            }

            if (obj.popup) {
                return this.createMenu(obj, aDoc);
            }

            if (obj.group) {
                return this.createMenu(obj, aDoc);
            }

            if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
            classList.push(tagName + '-iconic');

            item = $C(aDoc, tagName, obj, ['popup']);
            if (classList.length) item.setAttribute('class', classList.join(' '));

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
                this.addMenuListener(obj.pref, function (value, pref) {
                    item.setAttribute('checked', value);
                    if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                });
            } else {
                let value = cPref.get(obj.pref);
                if (value) {
                    item.setAttribute('value', value);
                    item.setAttribute('label', $S(obj.label, value));
                }
                this.addMenuListener(obj.pref, function (value, pref) {
                    item.setAttribute('label', $S(obj.label, value || item.getAttribute('default')));
                    if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                });
            }

            if (!obj.pref && !obj.onclick)
                item.setAttribute("onclick", "checkForMiddleClick(this, event)");
            item.setAttribute("oncommand", "CopyCat.onCommand(event);");
            return item;
        },
        addPrefListener: function (pref, callback) {
            this.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, callback);
        },
        addMenuListener: function (pref, callback) {
            this.MENU_LISTENER_LIST[pref] = cPref.addListener(pref, callback);
        },
        onCommand: function (event) {
            let item = event.target;
            let pref = item.getAttribute("pref") || "";
            if (pref) this.handlePref(event, pref);
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
        init: function (win) {
            this.win = win || Services.wm.getMostRecentWindow("navigator:browser");
            Object.keys(FUNCTION_LIST).forEach((pref) => {
                try {
                    let val = TabPlus.FUNCTION_LIST[pref];
                    let trigger = typeof val.trigger === "boolean" ? val.trigger : true;
                    if (typeof val.callback === "function") {

                        if (trigger === cPref.get(pref, false)) {
                            val.el.addEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.arg || false);
                        }

                        TabPlus.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, TabPlus.callback);
                    }
                    if (typeof val.init === "function") {
                        if (trigger === cPref.get(pref, false)) {
                            val.init();
                        }
                        let callback = function (value, pref) {
                            if (value === trigger)
                                TabPlus.FUNCTION_LIST[pref].init();
                            else
                                TabPlus.FUNCTION_LIST[pref].destroy();
                        }
                        TabPlus.PREF_LISTENER_LIST[pref] = cPref.addListener(pref, callback);
                    }
                } catch (e) { log(e); }
            });
            this.createMenuItems();
        },
        unload: function () {
            Object.keys(this.FUNCTION_LIST).forEach(pref => {
                val = TabPlus.FUNCTION_LIST[pref];
                if (val.el && val.event && val.callback)
                    val.el.removeEventListener(val.event, TabPlus.FUNCTION_LIST[pref].callback, val.arg || false);
                if (typeof val.destroy === "function")
                    val.destroy();
            });
            Object.values(this.PREF_LISTENER_LIST).forEach(l => cPref.removeListener(l));
            Object.values(this.MENU_LISTENER_LIST).forEach(l => cPref.removeListener(l));
            if (this.menuitems && this.menuitems.length) {
                this.menuitems.forEach(menuitem => {
                    menuitem.parentNode.removeChild(menuitem);
                });
            }
            delete window.TabPlus;
        }
    }

    function log(e) {
        Cu.reportError(e);
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
        var el = aDoc.createXULElement(tag);
        return $A(el, attrs, skipAttrs);
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

    if (gBrowserInit.delayedStartupFinished) window.TabPlus.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.TabPlus.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();