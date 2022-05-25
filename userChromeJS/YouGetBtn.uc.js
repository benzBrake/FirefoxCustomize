// ==UserScript==
// @name            YouGetBtn.uc.js
// @description     调用 You-Get 下载网页视频
// @author          Ryan
// @include         main
// @aversion        0.0.1
// @shutdown        window.youGetBtn.unload();
// @compatibility   Firefox 70 +
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            感谢 ylcs006 帮忙解决路径乱码问题
// @onlyonce
// ==/UserScript==
window.youGetBtn = {
    arguments: [
        '-c',
        function () {
            return window.youGetBtn.getCookiePathForSite(gBrowser.currentURI.host);
        },
        '-o',
        function () {
            return window.youGetBtn.savePath;
        },
        function () {
            return gBrowser.currentURI.spec;
        }
    ], // 自行修改参数
    cookiesPath: FileUtils.getDir("UChrm", ["resources", "cookies"], true), // 自行修改 Cookies 路径
    menuObject: {
        type: 'menupopup',
        id: 'YouGetBtn_pop',
        children: [{
            type: 'menugroup',
            children: [{
                label: '{{openSavePath}}',
                oncommand: 'window.youGetBtn.openSavePath()',
                image: 'data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTQuOTk4MDQ2OSA0QzMuMzUzMDc3IDQgMS45OTgwNDY5IDUuMzU1MDMwMiAxLjk5ODA0NjkgN0wxLjk5ODA0NjkgMTZMMS45OTgwNDY5IDI2TDEuOTk4MDQ2OSA0M0MxLjk5ODA0NjkgNDQuNjQ0OTcgMy4zNTMwNzcgNDYgNC45OTgwNDY5IDQ2TDQ0Ljk5ODA0NyA0NkM0Ni42NDMwMTcgNDYgNDcuOTk4MDQ3IDQ0LjY0NDk3IDQ3Ljk5ODA0NyA0M0w0Ny45OTgwNDcgMTFDNDcuOTk4MDQ3IDkuMzU1MDMwMiA0Ni42NDMwMTcgOCA0NC45OTgwNDcgOEwxNy45OTgwNDcgOEMxOC4wODQ2MiA4IDE3Ljk2NzAzOSA4LjAwMDM2NCAxNy43MjI2NTYgNy43MTg3NUMxNy40NzgyNzQgNy40MzcxMzYgMTcuMTc3NDY1IDYuOTY5OTQxMiAxNi44NjMyODEgNi40Njg3NUMxNi41NDkwOTcgNS45Njc1NTg4IDE2LjIyMTc3NyA1LjQzMjc4OTkgMTUuODA2NjQxIDQuOTYyODkwNkMxNS4zOTE1MDQgNC40OTI5OTE0IDE0LjgxNjgwMSA0IDEzLjk5ODA0NyA0TDQuOTk4MDQ2OSA0IHogTSA0Ljk5ODA0NjkgNkwxMy45OTgwNDcgNkMxMy45MzcyOTcgNiAxNC4wNTkxODcgNi4wMDcwMSAxNC4zMDY2NDEgNi4yODcxMDk0QzE0LjU1NDA5OCA2LjU2NzIxMDEgMTQuODU3MjMxIDcuMDMyNDQxMiAxNS4xNjk5MjIgNy41MzEyNUMxNS40ODI2MTMgOC4wMzAwNTg4IDE1LjgwNjQyOSA4LjU2Mjg2NCAxNi4yMTI4OTEgOS4wMzEyNUMxNi42MTkzNTIgOS40OTk2MzYgMTcuMTc2OTczIDEwIDE3Ljk5ODA0NyAxMEw0NC45OTgwNDcgMTBDNDUuNTYzMDc3IDEwIDQ1Ljk5ODA0NyAxMC40MzQ5NyA0NS45OTgwNDcgMTFMNDUuOTk4MDQ3IDEzLjE4NzVDNDUuNjgzMTU1IDEzLjA3Mzk0IDQ1LjM0OTg4OSAxMyA0NC45OTgwNDcgMTNMNC45OTgwNDY5IDEzQzQuNjQ2MjA0MyAxMyA0LjMxMjkzODQgMTMuMDczOTQgMy45OTgwNDY5IDEzLjE4NzVMMy45OTgwNDY5IDdDMy45OTgwNDY5IDYuNDM0OTY5OCA0LjQzMzAxNjcgNiA0Ljk5ODA0NjkgNiB6IE0gNC45OTgwNDY5IDE1TDQ0Ljk5ODA0NyAxNUM0NS41NjMwNzcgMTUgNDUuOTk4MDQ3IDE1LjQzNDk3IDQ1Ljk5ODA0NyAxNkw0NS45OTgwNDcgNDNDNDUuOTk4MDQ3IDQzLjU2NTAzIDQ1LjU2MzA3NyA0NCA0NC45OTgwNDcgNDRMNC45OTgwNDY5IDQ0QzQuNDMzMDE2NyA0NCAzLjk5ODA0NjkgNDMuNTY1MDMgMy45OTgwNDY5IDQzTDMuOTk4MDQ2OSAxNkMzLjk5ODA0NjkgMTUuNDM0OTcgNC40MzMwMTY3IDE1IDQuOTk4MDQ2OSAxNSB6IE0gMjQuNSAxOEMxOS4yNjUxNCAxOCAxNSAyMi4yNjUxNCAxNSAyNy41QzE1IDMyLjczNDg2IDE5LjI2NTE0IDM3IDI0LjUgMzdDMjYuNzU4MjE5IDM3IDI4LjgzMjA3NiAzNi4yMDE3NjEgMzAuNDY0ODQ0IDM0Ljg3ODkwNkwzNi41NDI5NjkgNDAuOTU3MDMxTDM3Ljk1NzAzMSAzOS41NDI5NjlMMzEuODc4OTA2IDMzLjQ2NDg0NEMzMy4yMDE3NjEgMzEuODMyMDc2IDM0IDI5Ljc1ODIxOSAzNCAyNy41QzM0IDIyLjI2NTE0IDI5LjczNDg2IDE4IDI0LjUgMTggeiBNIDI0LjUgMjBDMjguNjUzOTggMjAgMzIgMjMuMzQ2MDIgMzIgMjcuNUMzMiAzMS42NTM5OCAyOC42NTM5OCAzNSAyNC41IDM1QzIwLjM0NjAyIDM1IDE3IDMxLjY1Mzk4IDE3IDI3LjVDMTcgMjMuMzQ2MDIgMjAuMzQ2MDIgMjAgMjQuNSAyMCB6IiAvPg0KPC9zdmc+'
            }, {
                tooltiptext: '{{setSavePath}}',
                oncommand: 'window.youGetBtn.setSavePath()',
                image: 'data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTQgNEMyLjkgNCAyIDQuOSAyIDZMMiAxOEMyIDE5LjEgMi45IDIwIDQgMjBMMTIuMDgwMDc4IDIwQzEyLjAzMzA3OCAxOS42NzMgMTIgMTkuMzQgMTIgMTlDMTIgMTguNjYgMTIuMDMzMDc4IDE4LjMyNyAxMi4wODAwNzggMThMNCAxOEw0IDhMMjAgOEwyMCAxMi4wODAwNzhDMjAuNzA3IDEyLjE4MTA3OCAyMS4zNzggMTIuMzg3NTk0IDIyIDEyLjY4MzU5NEwyMiA4QzIyIDYuOSAyMS4xIDYgMjAgNkwxMiA2TDEwIDRMNCA0IHogTSAxNy44OTY0ODQgMTRDMTcuNzY3NDg0IDE0IDE3LjY1OTUzMSAxNC4wOTY2MDkgMTcuNjQ0NTMxIDE0LjIyNDYwOUwxNy41MjczNDQgMTUuMjM2MzI4QzE3LjA0MzM0NCAxNS40MDQzMjggMTYuNjA1NTYyIDE1LjY2MDI4MSAxNi4yMjY1NjIgMTUuOTg4MjgxTDE1LjI4OTA2MiAxNS41ODIwMzFDMTUuMTcxMDYyIDE1LjUzMTAzMSAxNS4wMzQ3MDMgMTUuNTc4NDUzIDE0Ljk3MDcwMyAxNS42ODk0NTNMMTQuMDMzMjAzIDE3LjMxMDU0N0MxMy45NjkyMDMgMTcuNDIxNTQ3IDEzLjk5ODU2MiAxNy41NjM2MjUgMTQuMTAxNTYyIDE3LjY0MDYyNUwxNC45MDgyMDMgMTguMjQwMjM0QzE0Ljg2MDIwMyAxOC40ODcyMzQgMTQuODMyMDMxIDE4Ljc0IDE0LjgzMjAzMSAxOUMxNC44MzIwMzEgMTkuMjYgMTQuODYwMjAzIDE5LjUxMjc2NiAxNC45MDgyMDMgMTkuNzU5NzY2TDE0LjEwMTU2MiAyMC4zNTkzNzVDMTMuOTk4NTYzIDIwLjQzNjM3NSAxMy45NjgyMDMgMjAuNTc4NDUzIDE0LjAzMzIwMyAyMC42ODk0NTNMMTQuOTcwNzAzIDIyLjMxMDU0N0MxNS4wMzQ3MDMgMjIuNDIyNTQ3IDE1LjE3MTA2MyAyMi40NjcwMTYgMTUuMjg5MDYyIDIyLjQxNjAxNkwxNi4yMjY1NjIgMjIuMDExNzE5QzE2LjYwNTU2MyAyMi4zNDA3MTkgMTcuMDQzMzQ0IDIyLjU5NTY3MiAxNy41MjczNDQgMjIuNzYzNjcyTDE3LjY0NDUzMSAyMy43NzUzOTFDMTcuNjU5NTMxIDIzLjkwMzM5MSAxNy43Njc0ODQgMjQgMTcuODk2NDg0IDI0TDE5Ljc2NzU3OCAyNEMxOS44OTY1NzggMjQgMjAuMDA0NTMxIDIzLjkwMzM5MSAyMC4wMTk1MzEgMjMuNzc1MzkxTDIwLjEzNjcxOSAyMi43NjM2NzJDMjAuNjIwNzE5IDIyLjU5NTY3MiAyMS4wNTg1IDIyLjMzOTcxOSAyMS40Mzc1IDIyLjAxMTcxOUwyMi4zNzMwNDcgMjIuNDE3OTY5QzIyLjQ5MTA0NyAyMi40Njg5NjkgMjIuNjI5MzU5IDIyLjQyMTU0NyAyMi42OTMzNTkgMjIuMzEwNTQ3TDIzLjYzMDg1OSAyMC42ODk0NTNDMjMuNjk0ODU5IDIwLjU3NzQ1MyAyMy42NjU1IDIwLjQzNTM3NSAyMy41NjI1IDIwLjM1OTM3NUwyMi43NTU4NTkgMTkuNzU5NzY2QzIyLjgwMzg1OSAxOS41MTI3NjYgMjIuODMyMDMxIDE5LjI2IDIyLjgzMjAzMSAxOUMyMi44MzIwMzEgMTguNzQgMjIuODAzODU5IDE4LjQ4NzIzNCAyMi43NTU4NTkgMTguMjQwMjM0TDIzLjU2MjUgMTcuNjQwNjI1QzIzLjY2NTUgMTcuNTYzNjI1IDIzLjY5NTg1OSAxNy40MjE1NDcgMjMuNjMwODU5IDE3LjMxMDU0N0wyMi42OTMzNTkgMTUuNjg5NDUzQzIyLjYyOTM1OSAxNS41Nzg0NTMgMjIuNDkxMDQ3IDE1LjUzMTAzMSAyMi4zNzMwNDcgMTUuNTgyMDMxTDIxLjQzNzUgMTUuOTg4MjgxQzIxLjA1ODUgMTUuNjYwMjgxIDIwLjYyMDcxOSAxNS40MDQzMjggMjAuMTM2NzE5IDE1LjIzNjMyOEwyMC4wMTk1MzEgMTQuMjI0NjA5QzIwLjAwNDUzMSAxNC4wOTY2MDkgMTkuODk2NTc4IDE0IDE5Ljc2NzU3OCAxNEwxNy44OTY0ODQgMTQgeiBNIDE4LjgzMjAzMSAxN0MxOS45MzYwMzEgMTcgMjAuODMyMDMxIDE3Ljg5NSAyMC44MzIwMzEgMTlDMjAuODMyMDMxIDIwLjEwNCAxOS45MzYwMzEgMjEgMTguODMyMDMxIDIxQzE3LjcyODAzMSAyMSAxNi44MzIwMzEgMjAuMTA0IDE2LjgzMjAzMSAxOUMxNi44MzIwMzEgMTcuODk1IDE3LjcyODAzMSAxNyAxOC44MzIwMzEgMTcgeiIgLz4NCjwvc3ZnPg=='
            }]
        }, {
            type: 'menugroup',
            children: [{
                label: '{{downloadYouGet}}',
                oncommand: "window.youGetBtn.downloadYouGet();",
                image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTQgNEw0IDI4TDI4IDI4TDI4IDRMMTggNEMxOCA1LjExNzE4OCAxNy4xMTcxODggNiAxNiA2QzE0Ljg4MjgxMyA2IDE0IDUuMTE3MTg4IDE0IDQgWiBNIDYgNkwxMi41NjI1IDZDMTMuMjU3ODEzIDcuMTgzNTk0IDE0LjUzNTE1NiA4IDE2IDhDMTcuNDY0ODQ0IDggMTguNzQyMTg4IDcuMTgzNTk0IDE5LjQzNzUgNkwyNiA2TDI2IDI2TDYgMjYgWiBNIDE1IDExTDE1IDE5LjI1TDEyLjcxODc1IDE2Ljk2ODc1TDExLjI4MTI1IDE4LjM3NUwxNiAyMy4wOTM3NUwyMC43MTg3NSAxOC4zNzVMMTkuMjgxMjUgMTYuOTY4NzVMMTcgMTkuMjVMMTcgMTFaIiAvPg0KPC9zdmc+"
            }, {
                tooltiptext: "{{setYouGetPath}}",
                oncommand: "window.youGetBtn.setYouGetPath();",
                image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTIyLjIwNTA3OCAyIEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAyMS4yMTg3NSAyLjgzNzg5MDZMMjAuMjQ2MDk0IDguNzkyOTY4OEMxOS4wNzY1MDkgOS4xMzMxOTcxIDE3Ljk2MTI0MyA5LjU5MjI3MjggMTYuOTEwMTU2IDEwLjE2NDA2MkwxMS45OTYwOTQgNi42NTQyOTY5IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAxMC43MDg5ODQgNi43NTk3NjU2TDYuODE4MzU5NCAxMC42NDY0ODQgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDYuNzA3MDMxMiAxMS45Mjc3MzRMMTAuMTY0MDYyIDE2Ljg3MzA0N0M5LjU4MzQ1NCAxNy45MzAyNzEgOS4xMTQyMDk4IDE5LjA1MTgyNCA4Ljc2NTYyNSAyMC4yMzI0MjJMMi44MzU5Mzc1IDIxLjIxODc1IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAyLjAwMTk1MzEgMjIuMjA1MDc4TDIuMDAxOTUzMSAyNy43MDUwNzggQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDIuODI2MTcxOSAyOC42OTE0MDZMOC43NTk3NjU2IDI5Ljc0MjE4OEM5LjEwNjQ2MDcgMzAuOTIwNzM5IDkuNTcyNzIyNiAzMi4wNDMwNjUgMTAuMTU0Mjk3IDMzLjEwMTU2Mkw2LjY1NDI5NjkgMzcuOTk4MDQ3IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCA2Ljc1OTc2NTYgMzkuMjg1MTU2TDEwLjY0ODQzOCA0My4xNzU3ODEgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDExLjkyNzczNCA0My4yODkwNjJMMTYuODgyODEyIDM5LjgyMDMxMkMxNy45MzY5OTkgNDAuMzk1NDggMTkuMDU0OTk0IDQwLjg1NzkyOCAyMC4yMjg1MTYgNDEuMjAxMTcyTDIxLjIxODc1IDQ3LjE2NDA2MiBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMjIuMjA1MDc4IDQ4TDI3LjcwNTA3OCA0OCBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMjguNjkxNDA2IDQ3LjE3MzgyOEwyOS43NTE5NTMgNDEuMTg3NUMzMC45MjA2MzMgNDAuODM4OTk3IDMyLjAzMzM3MiA0MC4zNjk2OTcgMzMuMDgyMDMxIDM5Ljc5MTAxNkwzOC4wNzAzMTIgNDMuMjkxMDE2IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAzOS4zNTE1NjIgNDMuMTc5Njg4TDQzLjI0MDIzNCAzOS4yODcxMDkgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDQzLjM0Mzc1IDM3Ljk5NjA5NEwzOS43ODcxMDkgMzMuMDU4NTk0QzQwLjM1NTc4MyAzMi4wMTQ5NTggNDAuODEzOTE1IDMwLjkwODg3NSA0MS4xNTQyOTcgMjkuNzQ4MDQ3TDQ3LjE3MTg3NSAyOC42OTMzNTkgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDQ3Ljk5ODA0NyAyNy43MDcwMzFMNDcuOTk4MDQ3IDIyLjIwNzAzMSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgNDcuMTYwMTU2IDIxLjIyMDcwM0w0MS4xNTIzNDQgMjAuMjM4MjgxQzQwLjgwOTY4IDE5LjA3ODgyNyA0MC4zNTAyODEgMTcuOTc0NzIzIDM5Ljc4MTI1IDE2LjkzMTY0MUw0My4yODkwNjIgMTEuOTMzNTk0IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCA0My4xNzc3MzQgMTAuNjUyMzQ0TDM5LjI4NzEwOSA2Ljc2MzY3MTkgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDM3Ljk5NjA5NCA2LjY2MDE1NjJMMzMuMDcyMjY2IDEwLjIwMTE3MkMzMi4wMjMxODYgOS42MjQ4MTAxIDMwLjkwOTcxMyA5LjE1Nzk5MTYgMjkuNzM4MjgxIDguODEyNUwyOC42OTE0MDYgMi44MjgxMjUgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDI3LjcwNTA3OCAyTDIyLjIwNTA3OCAyIHogTSAyMy4wNTY2NDEgNEwyNi44NjUyMzQgNEwyNy44NjEzMjggOS42ODU1NDY5IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAyOC42MDM1MTYgMTAuNDg0Mzc1QzMwLjA2NjAyNiAxMC44NDg4MzIgMzEuNDM5NjA3IDExLjQyNjU0OSAzMi42OTMzNTkgMTIuMTg1NTQ3IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAzMy43OTQ5MjIgMTIuMTQyNTc4TDM4LjQ3NDYwOSA4Ljc3OTI5NjlMNDEuMTY3OTY5IDExLjQ3MjY1NkwzNy44MzU5MzggMTYuMjIwNzAzIEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAzNy43OTY4NzUgMTcuMzEwNTQ3QzM4LjU0ODM2NiAxOC41NjE0NzEgMzkuMTE4MzMzIDE5LjkyNjM3OSAzOS40ODI0MjIgMjEuMzgwODU5IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCA0MC4yOTEwMTYgMjIuMTI1TDQ1Ljk5ODA0NyAyMy4wNTg1OTRMNDUuOTk4MDQ3IDI2Ljg2NzE4OEw0MC4yNzkyOTcgMjcuODcxMDk0IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAzOS40ODI0MjIgMjguNjE3MTg4QzM5LjEyMjU0NSAzMC4wNjk4MTcgMzguNTUyMjM0IDMxLjQzNDY4NyAzNy44MDA3ODEgMzIuNjg1NTQ3IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAzNy44NDU3MDMgMzMuNzg1MTU2TDQxLjIyNDYwOSAzOC40NzQ2MDlMMzguNTMxMjUgNDEuMTY5OTIyTDMzLjc5MTAxNiAzNy44NDM3NSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMzIuNjk3MjY2IDM3LjgwODU5NEMzMS40NDk3NSAzOC41Njc1ODUgMzAuMDc0NzU1IDM5LjE0ODAyOCAyOC42MTcxODggMzkuNTE3NTc4IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAyNy44NzY5NTMgNDAuMzEyNUwyNi44NjcxODggNDZMMjMuMDUyNzM0IDQ2TDIyLjExMTMyOCA0MC4zMzc4OTEgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDIxLjM2NTIzNCAzOS41MzEyNUMxOS45MDE4NSAzOS4xNzA1NTcgMTguNTIyMDk0IDM4LjU5MzcxIDE3LjI1OTc2NiAzNy44MzU5MzggQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDE2LjE3MTg3NSAzNy44NzVMMTEuNDY4NzUgNDEuMTY5OTIyTDguNzczNDM3NSAzOC40NzA3MDNMMTIuMDk3NjU2IDMzLjgyNDIxOSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMTIuMTM4NjcyIDMyLjcyNDYwOUMxMS4zNzI2NTIgMzEuNDU4ODU1IDEwLjc5MzMxOSAzMC4wNzkyMTMgMTAuNDI3NzM0IDI4LjYwOTM3NSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgOS42MzI4MTI1IDI3Ljg2NzE4OEw0LjAwMTk1MzEgMjYuODY3MTg4TDQuMDAxOTUzMSAyMy4wNTI3MzRMOS42Mjg5MDYyIDIyLjExNzE4OCBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMTAuNDM1NTQ3IDIxLjM3MzA0N0MxMC44MDQyNzMgMTkuODk4MTQzIDExLjM4MzMyNSAxOC41MTg3MjkgMTIuMTQ2NDg0IDE3LjI1NTg1OSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMTIuMTExMzI4IDE2LjE2NDA2Mkw4LjgyNjE3MTkgMTEuNDY4NzVMMTEuNTIzNDM4IDguNzczNDM3NUwxNi4xODU1NDcgMTIuMTA1NDY5IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAxNy4yODEyNSAxMi4xNDg0MzhDMTguNTM2OTA4IDExLjM5NDI5MyAxOS45MTk4NjcgMTAuODIyMDgxIDIxLjM4NDc2NiAxMC40NjI4OTEgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDIyLjEzMjgxMiA5LjY1MjM0MzhMMjMuMDU2NjQxIDQgeiBNIDI1IDE3QzIwLjU5MzU2NyAxNyAxNyAyMC41OTM1NjcgMTcgMjVDMTcgMjkuNDA2NDMzIDIwLjU5MzU2NyAzMyAyNSAzM0MyOS40MDY0MzMgMzMgMzMgMjkuNDA2NDMzIDMzIDI1QzMzIDIwLjU5MzU2NyAyOS40MDY0MzMgMTcgMjUgMTcgeiBNIDI1IDE5QzI4LjMyNTU1MyAxOSAzMSAyMS42NzQ0NDcgMzEgMjVDMzEgMjguMzI1NTUzIDI4LjMyNTU1MyAzMSAyNSAzMUMyMS42NzQ0NDcgMzEgMTkgMjguMzI1NTUzIDE5IDI1QzE5IDIxLjY3NDQ0NyAyMS42NzQ0NDcgMTkgMjUgMTkgeiIgLz4NCjwvc3ZnPg=="
            }]
        }],
    },
    get lang() {
        const lang = {
            'zh-CN': {
                'btnName': 'You-Get 视频下载',
                'btnTooltip': 'You-Get 视频下载\n左键：下载视频\n中键：打开下载目录\n右键：高级菜单',
                'openSavePath': '打开保存目录',
                'setSavePath': '设置视频保存路径',
                'setYouGetPath': '设置 you-get.exe 路径',
                'pleaseSetYouGetPath': "请先设置 you-get.exe 的路径!!!",
                'executableFile': "可执行文件",
                'downloadYouGet': "下载 You Get"
            },
            'en-US': {
                'btnName': 'You-Get Download Helper',
                'btnTooltip': 'You-Get Download Helper\nLeft Click：Download Video\nMiddle Click：Open Save Path\nRight Click：Advanced Menu',
                'openSavePath': 'Open Save Path',
                'setSavePath': 'Set Video Save Path',
                'setYouGetPath': 'Set you-get.exe Path',
                'pleaseSetYouGetPath': "Please set you-get.exe path first!!!",
                'executableFile': "Executable file",
                'downloadYouGet': "Download You Get"
            }
        };
        const locale = lang.hasOwnProperty(Services.locale.appLocaleAsBCP47) ? Services.locale.appLocaleAsBCP47 : 'en-US';
        return lang[locale];
    },
    tR: function (text) {
        const that = this, regexp = /{{(\w*)}}/gm;
        return text.replace(regexp, function () {
            return that.t(arguments[1]);
        });
    },
    t: function (key, replace) {
        if (key) {
            replace = replace || "";
            return this.lang.hasOwnProperty(key) ? this.lang[key].replace("%s", replace) : "";
        } else {
            return "";
        }
    },
    inArray(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return true;
            }
        }
        return false;
    },
    createMenu(config, aDoc) {
        let doc = aDoc || document;
        // 递归构建菜单
        let item, that = this, classList = new Array(), type = config.type;
        if (!youGetBtn.inArray(['menupopup', 'menugroup'], type)) {
            if (config.type === 'menuseparator' || !config.label && !config.image && !config.command) {
                type = 'menuseparator';
            }
            if (config.label) {
                type = 'menuitem';
                classList.push("menuitem-iconic");
            } else if (config.image) {
                type = 'toolbarbutton';
                classList.push("toolbarbutton-1");
            }
        }

        item = doc.createXULElement(type);

        children = config.children;
        delete config.type;
        delete config.children;

        config.class = classList.join(" ");
        for (let key in config) {
            let val = config[key];
            if (key === "label") {
                item.setAttribute('label', that.tR(config['label']));
                continue
            }
            if (key === "tooltiptext") {
                item.setAttribute('tooltiptext', that.tR(config['tooltiptext']));
                continue
            }
            if (typeof val == "function")
                val = "(" + val.toString() + ").call(this, event);";
            item.setAttribute(key, val);
        }

        if (children) {
            children.forEach(config => {
                item.appendChild(that.createMenu(config, doc));
            });
        }
        return item;
    },
    get binPath() {
        return Services.prefs.getStringPref(this.PREF_BIN, "");
    },
    get savePath() {
        return Services.prefs.getStringPref(window.youGetBtn.PREF_SAVE, "");
    },
    get window() {
        const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        return wm.getMostRecentWindow("navigator:browser");
    },
    convertEncoding: function (str) {
        if (Services.locale.appLocaleAsBCP47.includes("zh-CN")) {
            // 针对简体中文转换编码
            let converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
            converter.charset = 'gbk';
            return converter.ConvertFromUnicode(str) + converter.Finish();
        }
        return str;
    },
    openLink(url, where, inBackground) {
        if (!url) console.log('openLink: URL is invalid!');
        openLinkIn(url, where || 'tab', {
            private: false,
            inBackground: inBackground || false,
            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
        });
    },
    downloadYouGet() {
        if (Services.locale.appLocaleAsBCP47.includes("zh-")) {
            this.openLink('https://lussac.lanzoui.com/b00nc5aab', 'tab')
        } else {
            this.openLink('https://github.com/LussacZheng/you-get.exe/releases', 'tab');
        }
    },
    setYouGetPath() {
        alert(this.t("pleaseSetYouGetPath"));
        this.downloadYouGet();
        let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
        fp.init(window, this.t("setYouGetPath"), Ci.nsIFilePicker.modeOpen);
        fp.appendFilter(this.t("executableFile"), "*.exe");
        fp.open(res => {
            if (res != Ci.nsIFilePicker.returnOK) return;
            Services.prefs.setStringPref(window.youGetBtn.PREF_BIN, fp.file.path);
        });
    },
    setSavePath() {
        let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
        fp.init(window, this.t('setSavePath'), Ci.nsIFilePicker.modeGetFolder);
        fp.open(res => {
            if (res != Ci.nsIFilePicker.returnOK) return;
            Services.prefs.setStringPref(window.youGetBtn.PREF_SAVE, fp.file.path + '\\');
        });
    },
    openSavePath() {
        if (this.savePath && this.isFileExists(this.savePath)) {
            let folder = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
            try {
                folder.initWithPath(this.savePath);
                folder.launch();
            } catch (e) {
                console.log(e);
                return;
            }
        } else {
            this.setSavePath();
        }
    },
    isFileExists(path) {
        if (!path || path === "") return false;
        let app = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
        app.initWithPath(path);
        return app.exists();
    },
    formatCookie(co) {
        // 转换成 netscape 格式，抄袭自 cookie_txt 扩展
        return [
            [
                co.isHttpOnly ? '#HttpOnly_' : '',
                co.host
            ].join(''),
            co.isDomain ? 'TRUE' : 'FALSE',
            co.path,
            co.isSecure ? 'TRUE' : 'FALSE',
            co.expires,
            co.name,
            co.value + '\n'
        ].join('\t');
    },
    getCookiePathForSite(host) {
        // 保存 cookie 并返回路径
        if (!host) return;
        let cookies = Services.cookies.getCookiesFromHost(host, {});
        let string = cookies.map(this.formatCookie).join('');

        let file = this.cookiesPath.clone();
        file.append(`${host}.txt`);
        if (file.exists()) {
            file.remove(0);
        }
        file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);

        // 保存文件，抄袭自 saveUCJS.uc.js
        const charset = 'UTF-8';
        const fileStream = Components.classes['@mozilla.org/network/file-output-stream;1']
            .createInstance(Components.interfaces.nsIFileOutputStream);
        fileStream.init(file, 0x02 | 0x08 | 0x20, -1, 0);

        const converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1']
            .createInstance(Components.interfaces.nsIConverterOutputStream);
        converterStream.init(
            fileStream,
            charset,
            string.length,
            Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
        );

        converterStream.writeString(string);
        converterStream.close();
        fileStream.close();
        return file.path;
    },
    handleClick(e) {
        if (e.target.id !== 'YouGetBtn') return;
        let win = youGetBtn.window;
        if (e.button == 0) {
            // 非网页不响应，可以细化为匹配 you-get.exe 支持的网站，我懒得写正则了
            let uri = win.gBrowser.selectedBrowser.currentURI,
                youget = win.youGetBtn;
            if (!youget.binPath || !youget.isFileExists(youget.binPath)) {
                youget.setYouGetPath();
                return;
            }
            console.log(youget.savePath);
            if (!youget.savePath || !youget.isFileExists(youget.savePath)) {
                youget.setSavePath();
                return;
            }
            if (uri.spec.startsWith('http')) {
                let youGet = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                try {
                    youGet.initWithPath(this.binPath);
                    let p = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
                    let args = new Array();
                    for (let k in youget.arguments) {
                        val = youget.arguments[k];
                        args.push(typeof val == "function" ? val() : val);
                    }
                    p.init(youGet);
                    p.runw(false, args, args.length);
                } catch (e) {
                    alert(e);
                    return;
                }
            }
        } else if (e.button == 1) {
            window.youGetBtn.openSavePath();
        }
    },
    init: function () {
        if (!location.href.startsWith("chrome://browser/content/browser.x")) return;
        this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
        CustomizableUI.createWidget({
            id: 'YouGetBtn',
            label: this.t('btnName'),
            tooltiptext: this.t('btnTooltip'),
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onCreated: function (aNode) {
                aNode.setAttribute('onclick', "window.youGetBtn.handleClick(event);");
                aNode.setAttribute('contextmenu', 'YouGetBtn_pop');
                aNode.appendChild(window.youGetBtn.createMenu(window.youGetBtn.menuObject, aNode.ownerGlobal.document));
            }
        });
        this.setStyle();
    },
    setStyle: function () {
        this.STYLE = {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            @-moz-document url('chrome://browser/content/browser.xhtml') {
                #YouGetBtn > .toolbarbutton-icon {
                    list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBzdHlsZT0iZmlsbDpjb250ZXh0LWZpbGw7ZmlsbC1vcGFjaXR5OmNvbnRleHQtZmlsbC1vcGFjaXR5IiBkPSJNMi41IDFBMi41IDIuNSAwIDAgMCAwIDMuNXY5QTIuNSAyLjUgMCAwIDAgMi41IDE1aDExYTIuNSAyLjUgMCAwIDAgMi41LTIuNXYtOUEyLjUgMi41IDAgMCAwIDEzLjUgMWgtMTF6bTAgMWgxMUExLjUgMS41IDAgMCAxIDE1IDMuNXY5YTEuNSAxLjUgMCAwIDEtMS41IDEuNWgtMTFBMS41IDEuNSAwIDAgMSAxIDEyLjV2LTlBMS41IDEuNSAwIDAgMSAyLjUgMnptNC4wMTQgM0EuNS41IDAgMCAwIDYgNS41djUuMTVhLjQ5OS40OTkgMCAwIDAgLjc3NS40MTZsNC0yLjY0OGEuNTAxLjUwMSAwIDAgMC0uMDEtLjg0bC00LTIuNTAyQS41LjUgMCAwIDAgNi41MTUgNXoiLz4KPC9zdmc+Cg==);
                    width: 16px;
                    height: 16px;
                }
            }
          `)),
            type: 1
        }
        this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
    },
    unload: function () {
        CustomizableUI.destroyWidget('YouGetBtn');
        this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
        delete window.youGetBtn;
    },
    PREF_BIN: 'userChrome.youGetBtn.BINPATH',
    PREF_SAVE: 'userChrome.youGetBtn.SAVEPATH',
}
window.youGetBtn.init();