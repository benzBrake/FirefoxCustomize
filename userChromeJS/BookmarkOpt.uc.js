// ==UserScript==
// @name           BookmarkOpt.uc.js
// @description    书签操作增强
// @author         Ryan
// @include        main
// @include        chrome://browser/content/places/places.xhtml
// @include        chrome://browser/content/places/bookmarksSidebar.xhtml
// @include        chrome://browser/content/places/historySidebar.xhtml
// @version        1.1
// @shutdown       window.BookmarkOpt.destroy();
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note           合并 AddBookmarkHere 和 UpdateBookmarkLite，支持复制书签链接和标题
// @version        1.1 修复无法热插拔，添加书签使用新 API、修复部分情况无法添加，复制标题和复制链接支持书签文件夹和历史分类，临时移除双击地址栏 显示/隐藏书签工具栏
// @version        1.0 初始化版本
// ==/UserScript==
(function (css) {

    if (window.BookmarkOpt) {
        window.BookmarkOpt.destroy();
        delete window.BookmarkOpt;
    }

    const LANG = {
        'zh-CN': {
            "bookmarkopt options": "BookmarkOpt 选项",
            "add bookmark here": "添加书签到此处",
            "add bookmark here tooltip": "左键：添加到最后\nShift+左键：添加到最前",
            "update current bookmark": "替换为当前网址",
            "update current bookmark tooltip": "左键：替换当前网址\n中键：替换当前地址和标题\n右键：替换当前网址和自定义当前标题",
            "update current bookmark prompt": "更新当前书签标题，原标题为：\n %s",
            "copy bookmark title": "复制标题",
            "copy bookmark link": "复制链接",
            "show node type": "节点类型"
        },
        'en-US': {
            "add bookmark here": "Add Bookmark Here",
            "add bookmark here tooltip": "Left click: add bookmark to the end.\nShift + Left click: add bookmark to the first.",
            "update current bookmark tooltip": "Left click：replace with current url\nMiddle click：replace with current title and bookmark\nRight click：replace with current url and custom title.",
            "update current bookmark prompt": "Update current bookmark's title, original title is \n %s",
            "copy bookmark title": "Copy Title",
            "copy bookmark link": "Copy URL",
            "show node type": "Node type",
        }
    }

    const _LOCALE = LANG.hasOwnProperty(Services.locale.appLocaleAsBCP47) ? Services.locale.appLocaleAsBCP47 : 'zh-CN';

    // 右键菜单
    const PLACES_CONTEXT_ITEMS = [{
        id: 'placesContext_add:bookmark',
        label: $L("add bookmark here"),
        tooltiptext: $L("add bookmark here tooltip"),
        accesskey: "h",
        insertBefore: "placesContext_show_bookmark:info",
        condition: "toolbar folder bookmark",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        oncommand: "window.BookmarkOpt.operate(event, 'add', this.parentNode.triggerNode)"
    }, {
        id: "placesContext_update_bookmark:info",
        label: $L("update current bookmark"),
        tooltiptext: $L("update current bookmark tooltip"),
        accesskey: "u",
        insertBefore: "placesContext_show_bookmark:info",
        condition: "bookmark",
        'image': "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+DQogIDxwYXRoIGQ9Ik0zMi40NzA3MDMgNS45ODYzMjgxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMxLjQzOTQ1MyA2LjQzOTQ1MzFMMjcuNDM5NDUzIDEwLjQzOTQ1MyBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyNy40Mzk0NTMgMTIuNTYwNTQ3TDMxLjQzOTQ1MyAxNi41NjA1NDcgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgMzMuNTYwNTQ3IDE0LjQzOTQ1M0wzMi4xMjEwOTQgMTNMMzYuNSAxM0MzNy44OTgyMjYgMTMgMzkgMTQuMTAxNzc0IDM5IDE1LjVMMzkgMzMuNUMzOSAzNC44OTgyMjYgMzcuODk4MjI2IDM2IDM2LjUgMzZMMjguNSAzNiBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAyOC41IDM5TDM2LjUgMzlDMzkuNTE5Nzc0IDM5IDQyIDM2LjUxOTc3NCA0MiAzMy41TDQyIDE1LjVDNDIgMTIuNDgwMjI2IDM5LjUxOTc3NCAxMCAzNi41IDEwTDMyLjEyMTA5NCAxMEwzMy41NjA1NDcgOC41NjA1NDY5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMyLjQ3MDcwMyA1Ljk4NjMyODEgeiBNIDkuNSA2QzcuNTg1MDQ1MiA2IDYgNy41ODUwNDUyIDYgOS41TDYgMTIuNUM2IDE0LjQxNDk1NSA3LjU4NTA0NTIgMTYgOS41IDE2TDIxLjUgMTZDMjMuNDE0OTU1IDE2IDI1IDE0LjQxNDk1NSAyNSAxMi41TDI1IDkuNUMyNSA3LjU4NTA0NTIgMjMuNDE0OTU1IDYgMjEuNSA2TDkuNSA2IHogTSA5LjUgOUwyMS41IDlDMjEuNzk1MDQ1IDkgMjIgOS4yMDQ5NTQ4IDIyIDkuNUwyMiAxMi41QzIyIDEyLjc5NTA0NSAyMS43OTUwNDUgMTMgMjEuNSAxM0w5LjUgMTNDOS4yMDQ5NTQ4IDEzIDkgMTIuNzk1MDQ1IDkgMTIuNUw5IDkuNUM5IDkuMjA0OTU0OCA5LjIwNDk1NDggOSA5LjUgOSB6IE0gOS41IDE5QzcuNTg1MDQ1MiAxOSA2IDIwLjU4NTA0NSA2IDIyLjVMNiAyNS41QzYgMjcuNDE0OTU1IDcuNTg1MDQ1MiAyOSA5LjUgMjlMMjEuNSAyOUMyMy40MTQ5NTUgMjkgMjUgMjcuNDE0OTU1IDI1IDI1LjVMMjUgMjIuNUMyNSAyMC41ODUwNDUgMjMuNDE0OTU1IDE5IDIxLjUgMTlMOS41IDE5IHogTSA5LjUgMjJMMjEuNSAyMkMyMS43OTUwNDUgMjIgMjIgMjIuMjA0OTU1IDIyIDIyLjVMMjIgMjUuNUMyMiAyNS43OTUwNDUgMjEuNzk1MDQ1IDI2IDIxLjUgMjZMOS41IDI2QzkuMjA0OTU0OCAyNiA5IDI1Ljc5NTA0NSA5IDI1LjVMOSAyMi41QzkgMjIuMjA0OTU1IDkuMjA0OTU0OCAyMiA5LjUgMjIgeiBNIDkuNSAzMkM3LjU4NTA0NTIgMzIgNiAzMy41ODUwNDUgNiAzNS41TDYgMzguNUM2IDQwLjQxNDk1NSA3LjU4NTA0NTIgNDIgOS41IDQyTDIxLjUgNDJDMjMuNDE0OTU1IDQyIDI1IDQwLjQxNDk1NSAyNSAzOC41TDI1IDM1LjVDMjUgMzMuNTg1MDQ1IDIzLjQxNDk1NSAzMiAyMS41IDMyTDkuNSAzMiB6IE0gMTAuOTEyMTA5IDM1TDE2LjA4NTkzOCAzNSBBIDEuNSAxLjUgMCAwIDAgMTcuNSAzNiBBIDEuNSAxLjUgMCAwIDAgMTguOTEyMTA5IDM1TDIxLjUgMzVDMjEuNzk1MDQ1IDM1IDIyIDM1LjIwNDk1NSAyMiAzNS41TDIyIDM3LjA4NTkzOCBBIDEuNSAxLjUgMCAwIDAgMjEuNSAzNyBBIDEuNSAxLjUgMCAwIDAgMjAuMDg1OTM4IDM5TDE0LjkxMjEwOSAzOSBBIDEuNSAxLjUgMCAwIDAgMTMuNSAzNyBBIDEuNSAxLjUgMCAwIDAgMTIuMDg1OTM4IDM5TDkuNSAzOUM5LjIwNDk1NDggMzkgOSAzOC43OTUwNDUgOSAzOC41TDkgMzUuOTE0MDYyIEEgMS41IDEuNSAwIDAgMCA5LjUgMzYgQSAxLjUgMS41IDAgMCAwIDEwLjkxMjEwOSAzNSB6IiAvPg0KPC9zdmc+",
        oncommand: "window.BookmarkOpt.operate(event, 'update', this.parentNode.triggerNode)",
    }, {
        label: $L("copy bookmark title"),
        insertBefore: "placesContext_paste_group",
        condition: "container uri",
        accesskey: "A",
        oncommand: "window.BookmarkOpt.operate(event, 'copyTitle', this.parentNode.triggerNode)",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNi40NDIgMTkuMDUgTCA1LjU5OSAxOS4wNSBMIDQuNzU2IDE5LjA1IEwgMy45MTMgMTkuMDUgTCAzLjA3IDE5LjA1IEMgMi45NiAxOS4wMzkgMi44NCAxOS4wMTcgMi43MTggMTguOTg1IEMgMi41OTYgMTguOTUzIDIuNDcyIDE4LjkxMiAyLjM1MyAxOC44NjMgQyAyLjIzNSAxOC44MTUgMi4xMjEgMTguNzU5IDIuMDE5IDE4LjY5NyBDIDEuOTE4IDE4LjYzNSAxLjgyOSAxOC41NjggMS43NTkgMTguNDk2IEMgMS42OSAxOC40MjYgMS42MjUgMTguMzM2IDEuNTY2IDE4LjIzNCBDIDEuNTA2IDE4LjEzMiAxLjQ1MyAxOC4wMTkgMS40MDYgMTcuOSBDIDEuMzYgMTcuNzgyIDEuMzIgMTcuNjU4IDEuMjkgMTcuNTM3IEMgMS4yNiAxNy40MTYgMS4yMzkgMTcuMjk4IDEuMjI4IDE3LjE4OCBMIDEuMjI4IDE2LjMyNSBMIDEuMjI4IDE1LjQ2MiBMIDEuMjI4IDE0LjU5OSBMIDEuMjI4IDEzLjczNiBMIDEuNzI4IDEzLjczNiBMIDIuMjI4IDEzLjczNiBMIDIuMzk1IDEzLjczNiBMIDIuODk1IDEzLjczNiBMIDIuODk1IDE0LjU5OSBMIDIuODk1IDE1LjQ2MiBMIDIuODk1IDE2LjMyNSBMIDIuODk1IDE3LjYwNSBDIDIuODg1IDE3LjYxNSAyLjg3NSAxNy42MTIgMi44NjcgMTcuNjAzIEMgMi44NTkgMTcuNTk0IDIuODUzIDE3LjU3OSAyLjg0OSAxNy41NjMgQyAyLjg0NiAxNy41NDggMi44NDQgMTcuNTMzIDIuODQ1IDE3LjUyMyBDIDIuODQ2IDE3LjUxMyAyLjg1IDE3LjUwOSAyLjg1NyAxNy41MTYgQyAyLjg2NCAxNy41MjMgMi44NTkgMTcuNTI2IDIuODQ3IDE3LjUyNiBDIDIuODM1IDE3LjUyNiAyLjgxNyAxNy41MjQgMi43OTggMTcuNTE5IEMgMi43OCAxNy41MTQgMi43NjIgMTcuNTA3IDIuNzUgMTcuNDk4IEMgMi43MzcgMTcuNDg5IDIuNzMxIDE3LjQ3OSAyLjczNyAxNy40NjcgTCAzLjU4IDE3LjQ2NyBMIDQuNzU2IDE3LjQ2NyBMIDUuNTk5IDE3LjQ2NyBMIDYuNDQyIDE3LjQ2NyBMIDYuNDQyIDE3LjYzNCBMIDYuNDQyIDE4LjEzNCBMIDYuNDQyIDE4LjU1IEwgNi40NDIgMTkuMDUgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGQ9Ik0gMTEuMjI3IDEyLjAyMiBMIDEwLjg2NCAxMi4wMjIgTCAxMC41MDEgMTIuMDIyIEwgMTAuMTM4IDEyLjAyMiBMIDkuNzc1IDEyLjAyMiBMIDkuNDEyIDEyLjAyMiBMIDkuMDQ5IDEyLjAyMiBMIDguNjg2IDEyLjAyMiBMIDguMzIyIDEyLjAyMiBMIDguMjMyIDEyLjM2MSBMIDguMTQxIDEyLjcwMSBMIDguMDUxIDEzLjA0IEwgNy45NiAxMy4zNzkgTCA3Ljg3IDEzLjcxOCBMIDcuNzc5IDE0LjA1NyBMIDcuNjg5IDE0LjM5NiBMIDcuNTk4IDE0LjczNiBMIDcuMzAxIDE0LjczNiBMIDcuMDAzIDE0LjczNiBMIDYuNzA1IDE0LjczNiBMIDYuNDA3IDE0LjczNiBMIDYuMTEgMTQuNzM2IEwgNS44MTIgMTQuNzM2IEwgNS41MTQgMTQuNzM2IEwgNS4yMTYgMTQuNzM2IEwgNS42MDUgMTMuNDggTCA1Ljk5MyAxMi4yMjMgTCA2LjM4MSAxMC45NjcgTCA2Ljc2OSA5LjcxIEwgNy4xNTggOC40NTQgTCA3LjU0NiA3LjE5NyBMIDcuOTM0IDUuOTQxIEwgOC4zMjIgNC42ODUgTCA4LjY5OSA0LjY4NSBMIDkuMDc2IDQuNjg1IEwgOS40NTMgNC42ODUgTCA5LjgzIDQuNjg1IEwgMTAuMjA3IDQuNjg1IEwgMTAuNTg0IDQuNjg1IEwgMTAuOTYxIDQuNjg1IEwgMTEuMzM3IDQuNjg1IEwgMTEuNzMxIDUuOTQxIEwgMTIuMTI0IDcuMTk3IEwgMTIuNTE3IDguNDU0IEwgMTIuOTEgOS43MSBMIDEzLjMwNCAxMC45NjcgTCAxMy42OTcgMTIuMjIzIEwgMTQuMDkgMTMuNDggTCAxNC40ODMgMTQuNzM2IEwgMTQuMTc0IDE0LjczNiBMIDEzLjg2NSAxNC43MzYgTCAxMy41NTYgMTQuNzM2IEwgMTMuMjQ3IDE0LjczNiBMIDEyLjkzOCAxNC43MzYgTCAxMi42MjkgMTQuNzM2IEwgMTIuMzIgMTQuNzM2IEwgMTIuMDEgMTQuNzM2IEwgMTEuOTEzIDE0LjM5NiBMIDExLjgxNSAxNC4wNTcgTCAxMS43MTcgMTMuNzE4IEwgMTEuNjE5IDEzLjM3OSBMIDExLjUyMSAxMy4wNCBMIDExLjQyMyAxMi43MDEgTCAxMS4zMjUgMTIuMzYxIEwgMTEuMjI3IDEyLjAyMiBNIDguNjUzIDEwLjM5NCBMIDguOTM0IDEwLjM5NCBMIDkuMjE0IDEwLjM5NCBMIDkuNDk0IDEwLjM5NCBMIDkuNzc0IDEwLjM5NCBMIDEwLjA1NCAxMC4zOTQgTCAxMC4zMzQgMTAuMzk0IEwgMTAuNjE0IDEwLjM5NCBMIDEwLjg5NSAxMC4zOTQgTCAxMC44MTUgMTAuMTI3IEwgMTAuNzM2IDkuODYxIEwgMTAuNjU3IDkuNTk1IEwgMTAuNTc4IDkuMzI5IEwgMTAuNDk4IDkuMDYyIEwgMTAuNDE5IDguNzk2IEwgMTAuMzQgOC41MjkgTCAxMC4yNjEgOC4yNjMgTCAxMC4yMjggOC4xNDEgTCAxMC4xOTYgOC4wMTkgTCAxMC4xNjMgNy44OTcgTCAxMC4xMzEgNy43NzUgTCAxMC4wOTggNy42NTMgTCAxMC4wNjUgNy41MzEgTCAxMC4wMzIgNy40MDkgTCAxMCA3LjI4OCBMIDkuOTY4IDcuMTY3IEwgOS45MzcgNy4wNDYgTCA5LjkwNiA2LjkyNSBMIDkuODc1IDYuODA1IEwgOS44NDMgNi42ODQgTCA5LjgxMiA2LjU2NCBMIDkuNzggNi40NDMgTCA5Ljc0OSA2LjMyMyBMIDkuNzQ1IDYuMzIzIEwgOS43NDEgNi4zMjMgTCA5LjczNyA2LjMyMyBMIDkuNzM0IDYuMzIzIEwgOS43MyA2LjMyMyBMIDkuNzI2IDYuMzIzIEwgOS43MjIgNi4zMjMgTCA5LjcxOCA2LjMyMyBMIDkuNjkgNi40NDQgTCA5LjY2MyA2LjU2NiBMIDkuNjM1IDYuNjg4IEwgOS42MDggNi44MSBMIDkuNTgxIDYuOTMyIEwgOS41NTMgNy4wNTQgTCA5LjUyNiA3LjE3NiBMIDkuNDk4IDcuMjk4IEwgOS40NjggNy40MjEgTCA5LjQzOCA3LjU0NCBMIDkuNDA4IDcuNjY3IEwgOS4zNzcgNy43OTEgTCA5LjM0NyA3LjkxNCBMIDkuMzE3IDguMDM3IEwgOS4yODcgOC4xNiBMIDkuMjU2IDguMjgzIEwgOS4xODEgOC41NDcgTCA5LjEwNiA4LjgxMSBMIDkuMDMxIDkuMDc1IEwgOC45NTUgOS4zMzkgTCA4Ljg4IDkuNjAzIEwgOC44MDQgOS44NjcgTCA4LjcyOSAxMC4xMyBMIDguNjUzIDEwLjM5NCIgc3R5bGU9IiIvPgogIDxwYXRoIGQ9Ik0gNi40OTIgNi4zNjQgTCA1LjY0OSA2LjM2NCBMIDQuODA2IDYuMzY0IEwgMy45NjMgNi4zNjQgTCAzLjEyIDYuMzY0IEMgMy4wMSA2LjM1MyAyLjg5IDYuMzMxIDIuNzY4IDYuMjk5IEMgMi42NDYgNi4yNjcgMi41MjIgNi4yMjYgMi40MDMgNi4xNzcgQyAyLjI4NSA2LjEyOSAyLjE3MSA2LjA3MyAyLjA2OSA2LjAxMSBDIDEuOTY4IDUuOTQ5IDEuODc5IDUuODgyIDEuODA5IDUuODEgQyAxLjc0IDUuNzQgMS42NzUgNS42NSAxLjYxNiA1LjU0OCBDIDEuNTU2IDUuNDQ2IDEuNTAzIDUuMzMzIDEuNDU2IDUuMjE0IEMgMS40MSA1LjA5NiAxLjM3IDQuOTcyIDEuMzQgNC44NTEgQyAxLjMxIDQuNzMgMS4yODkgNC42MTIgMS4yNzggNC41MDIgTCAxLjI3OCAzLjYzOSBMIDEuMjc4IDIuNzc2IEwgMS4yNzggMS45MTMgTCAxLjI3OCAxLjA1IEwgMS43NzggMS4wNSBMIDIuMjc4IDEuMDUgTCAyLjQ0NSAxLjA1IEwgMi45NDUgMS4wNSBMIDIuOTQ1IDEuOTEzIEwgMi45NDUgMi43NzYgTCAyLjk0NSAzLjYzOSBMIDIuOTQ1IDQuOTE5IEMgMi45MzUgNC45MjkgMi45MjUgNC45MjYgMi45MTcgNC45MTcgQyAyLjkwOSA0LjkwOCAyLjkwMyA0Ljg5MyAyLjg5OSA0Ljg3NyBDIDIuODk2IDQuODYyIDIuODk0IDQuODQ3IDIuODk1IDQuODM3IEMgMi44OTYgNC44MjcgMi45IDQuODIzIDIuOTA3IDQuODMgQyAyLjkxNCA0LjgzNyAyLjkwOSA0Ljg0IDIuODk3IDQuODQgQyAyLjg4NSA0Ljg0IDIuODY3IDQuODM4IDIuODQ4IDQuODMzIEMgMi44MyA0LjgyOCAyLjgxMiA0LjgyMSAyLjggNC44MTIgQyAyLjc4NyA0LjgwMyAyLjc4MSA0Ljc5MyAyLjc4NyA0Ljc4MSBMIDMuNjMgNC43ODEgTCA0LjgwNiA0Ljc4MSBMIDUuNjQ5IDQuNzgxIEwgNi40OTIgNC43ODEgTCA2LjQ5MiA0Ljk0OCBMIDYuNDkyIDUuNDQ4IEwgNi40OTIgNS44NjQgTCA2LjQ5MiA2LjM2NCBaIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgwLCAxLCAtMSwgMCwgNy41OTIsIC0wLjE3OCkiLz4KICA8cGF0aCBkPSJNIDE4Ljg3IDYuMzE0IEwgMTguMDI3IDYuMzE0IEwgMTcuMTg0IDYuMzE0IEwgMTYuMzQxIDYuMzE0IEwgMTUuNDk4IDYuMzE0IEMgMTUuMzg4IDYuMzAzIDE1LjI2OCA2LjI4MSAxNS4xNDYgNi4yNDkgQyAxNS4wMjQgNi4yMTcgMTQuOSA2LjE3NiAxNC43ODEgNi4xMjcgQyAxNC42NjMgNi4wNzkgMTQuNTQ5IDYuMDIzIDE0LjQ0NyA1Ljk2MSBDIDE0LjM0NiA1Ljg5OSAxNC4yNTcgNS44MzIgMTQuMTg3IDUuNzYgQyAxNC4xMTggNS42OSAxNC4wNTMgNS42IDEzLjk5NCA1LjQ5OCBDIDEzLjkzNCA1LjM5NiAxMy44ODEgNS4yODMgMTMuODM0IDUuMTY0IEMgMTMuNzg4IDUuMDQ2IDEzLjc0OCA0LjkyMiAxMy43MTggNC44MDEgQyAxMy42ODggNC42OCAxMy42NjcgNC41NjIgMTMuNjU2IDQuNDUyIEwgMTMuNjU2IDMuNTg5IEwgMTMuNjU2IDIuNzI2IEwgMTMuNjU2IDEuODYzIEwgMTMuNjU2IDEgTCAxNC4xNTYgMSBMIDE0LjY1NiAxIEwgMTQuODIzIDEgTCAxNS4zMjMgMSBMIDE1LjMyMyAxLjg2MyBMIDE1LjMyMyAyLjcyNiBMIDE1LjMyMyAzLjU4OSBMIDE1LjMyMyA0Ljg2OSBDIDE1LjMxMyA0Ljg3OSAxNS4zMDMgNC44NzYgMTUuMjk1IDQuODY3IEMgMTUuMjg3IDQuODU4IDE1LjI4MSA0Ljg0MyAxNS4yNzcgNC44MjcgQyAxNS4yNzQgNC44MTIgMTUuMjcyIDQuNzk3IDE1LjI3MyA0Ljc4NyBDIDE1LjI3NCA0Ljc3NyAxNS4yNzggNC43NzMgMTUuMjg1IDQuNzggQyAxNS4yOTIgNC43ODcgMTUuMjg3IDQuNzkgMTUuMjc1IDQuNzkgQyAxNS4yNjMgNC43OSAxNS4yNDUgNC43ODggMTUuMjI2IDQuNzgzIEMgMTUuMjA4IDQuNzc4IDE1LjE5IDQuNzcxIDE1LjE3OCA0Ljc2MiBDIDE1LjE2NSA0Ljc1MyAxNS4xNTkgNC43NDMgMTUuMTY1IDQuNzMxIEwgMTYuMDA4IDQuNzMxIEwgMTcuMTg0IDQuNzMxIEwgMTguMDI3IDQuNzMxIEwgMTguODcgNC43MzEgTCAxOC44NyA0Ljg5OCBMIDE4Ljg3IDUuMzk4IEwgMTguODcgNS44MTQgTCAxOC44NyA2LjMxNCBaIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSwgMCwgMCwgLTEsIDMyLjUyNjAwMSwgNy4zMTQpIi8+CiAgPHBhdGggZD0iTSAxOC40NzIgMTkuMSBMIDE3LjYyOSAxOS4xIEwgMTYuNzg2IDE5LjEgTCAxNS45NDMgMTkuMSBMIDE1LjEgMTkuMSBDIDE0Ljk5IDE5LjA4OSAxNC44NyAxOS4wNjcgMTQuNzQ4IDE5LjAzNSBDIDE0LjYyNiAxOS4wMDMgMTQuNTAyIDE4Ljk2MiAxNC4zODMgMTguOTEzIEMgMTQuMjY1IDE4Ljg2NSAxNC4xNTEgMTguODA5IDE0LjA0OSAxOC43NDcgQyAxMy45NDggMTguNjg1IDEzLjg1OSAxOC42MTggMTMuNzg5IDE4LjU0NiBDIDEzLjcyIDE4LjQ3NiAxMy42NTUgMTguMzg2IDEzLjU5NiAxOC4yODQgQyAxMy41MzYgMTguMTgyIDEzLjQ4MyAxOC4wNjkgMTMuNDM2IDE3Ljk1IEMgMTMuMzkgMTcuODMyIDEzLjM1IDE3LjcwOCAxMy4zMiAxNy41ODcgQyAxMy4yOSAxNy40NjYgMTMuMjY5IDE3LjM0OCAxMy4yNTggMTcuMjM4IEwgMTMuMjU4IDE2LjM3NSBMIDEzLjI1OCAxNS41MTIgTCAxMy4yNTggMTQuNjQ5IEwgMTMuMjU4IDEzLjc4NiBMIDEzLjc1OCAxMy43ODYgTCAxNC4yNTggMTMuNzg2IEwgMTQuNDI1IDEzLjc4NiBMIDE0LjkyNSAxMy43ODYgTCAxNC45MjUgMTQuNjQ5IEwgMTQuOTI1IDE1LjUxMiBMIDE0LjkyNSAxNi4zNzUgTCAxNC45MjUgMTcuNjU1IEMgMTQuOTE1IDE3LjY2NSAxNC45MDUgMTcuNjYyIDE0Ljg5NyAxNy42NTMgQyAxNC44ODkgMTcuNjQ0IDE0Ljg4MyAxNy42MjkgMTQuODc5IDE3LjYxMyBDIDE0Ljg3NiAxNy41OTggMTQuODc0IDE3LjU4MyAxNC44NzUgMTcuNTczIEMgMTQuODc2IDE3LjU2MyAxNC44OCAxNy41NTkgMTQuODg3IDE3LjU2NiBDIDE0Ljg5NCAxNy41NzMgMTQuODg5IDE3LjU3NiAxNC44NzcgMTcuNTc2IEMgMTQuODY1IDE3LjU3NiAxNC44NDcgMTcuNTc0IDE0LjgyOCAxNy41NjkgQyAxNC44MSAxNy41NjQgMTQuNzkyIDE3LjU1NyAxNC43OCAxNy41NDggQyAxNC43NjcgMTcuNTM5IDE0Ljc2MSAxNy41MjkgMTQuNzY3IDE3LjUxNyBMIDE1LjYxIDE3LjUxNyBMIDE2Ljc4NiAxNy41MTcgTCAxNy42MjkgMTcuNTE3IEwgMTguNDcyIDE3LjUxNyBMIDE4LjQ3MiAxNy42ODQgTCAxOC40NzIgMTguMTg0IEwgMTguNDcyIDE4LjYgTCAxOC40NzIgMTkuMSBaIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgwLCAtMSwgMSwgMCwgLTAuNTc4LCAzMi4zMDgwMDEpIi8+Cjwvc3ZnPg=="
    }, {
        label: $L("copy bookmark link"),
        insertBefore: "placesContext_paste_group",
        condition: "container uri",
        accesskey: "L",
        text: "[%TITLE%](%URL%)",
        oncommand: "window.BookmarkOpt.operate(event, 'copyUrl', this.parentNode.triggerNode)",
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNMS41IDBDMC42NzU3ODEgMCAwIDAuNjc1NzgxIDAgMS41TDAgMTAuNUMwIDExLjMyNDIxOSAwLjY3NTc4MSAxMiAxLjUgMTJMMiAxMkwyIDEyLjVDMiAxMy4zMjQyMTkgMi42NzU3ODEgMTQgMy41IDE0TDEyLjUgMTRDMTMuMzI0MjE5IDE0IDE0IDEzLjMyNDIxOSAxNCAxMi41TDE0IDMuNUMxNCAyLjY3NTc4MSAxMy4zMjQyMTkgMiAxMi41IDJMMTIgMkwxMiAxLjVDMTIgMC42NzU3ODEgMTEuMzI0MjE5IDAgMTAuNSAwIFogTSAxLjUgMUwxMC41IDFDMTAuNzgxMjUgMSAxMSAxLjIxODc1IDExIDEuNUwxMSAyTDMuNSAyQzIuNjc1NzgxIDIgMiAyLjY3NTc4MSAyIDMuNUwyIDExTDEuNSAxMUMxLjIxODc1IDExIDEgMTAuNzgxMjUgMSAxMC41TDEgMS41QzEgMS4yMTg3NSAxLjIxODc1IDEgMS41IDEgWiBNIDMuNSAzTDEyLjUgM0MxMi43ODEyNSAzIDEzIDMuMjE4NzUgMTMgMy41TDEzIDEyLjVDMTMgMTIuNzgxMjUgMTIuNzgxMjUgMTMgMTIuNSAxM0wzLjUgMTNDMy4yMTg3NSAxMyAzIDEyLjc4MTI1IDMgMTIuNUwzIDMuNUMzIDMuMjE4NzUgMy4yMTg3NSAzIDMuNSAzIFogTSAxMC41IDRDMTAuMTE3MTg4IDQgOS43MzA0NjkgNC4xNDg0MzggOS40Mzc1IDQuNDM3NUw4LjQzNzUgNS40Mzc1QzcuOTgwNDY5IDUuODk4NDM4IDcuODk0NTMxIDYuNTc4MTI1IDguMTU2MjUgNy4xMzI4MTNDOC4xNTIzNDQgNy4xMzY3MTkgOC4xNDg0MzggNy4xNDA2MjUgOC4xNDg0MzggNy4xNDg0MzhMNy4xNDg0MzggOC4xNDg0MzhDNy4xNDQ1MzEgOC4xNDg0MzggNy4xNDA2MjUgOC4xNTIzNDQgNy4xMzY3MTkgOC4xNTYyNUM3LjEzNjcxOSA4LjE1NjI1IDcuMTM2NzE5IDguMTYwMTU2IDcuMTMyODEzIDguMTU2MjVDNi41NzgxMjUgNy44OTg0MzggNS44OTg0MzggNy45ODA0NjkgNS40Mzc1IDguNDM3NUw0LjQzNzUgOS40Mzc1QzMuODU1NDY5IDEwLjAyMzQzOCAzLjg1NTQ2OSAxMC45NzY1NjMgNC40Mzc1IDExLjU2MjVDNC43MjI2NTYgMTEuODQzNzUgNS4xMDE1NjMgMTIgNS41IDEyQzUuODk4NDM4IDEyIDYuMjc3MzQ0IDExLjg0Mzc1IDYuNTYyNSAxMS41NjI1TDcuNTYyNSAxMC41NjI1QzguMDE5NTMxIDEwLjEwMTU2MyA4LjEwNTQ2OSA5LjQyMTg3NSA3Ljg0Mzc1IDguODY3MTg4QzcuODQ3NjU2IDguODYzMjgxIDcuODUxNTYzIDguODU5Mzc1IDcuODUxNTYzIDguODUxNTYzTDguODUxNTYzIDcuODUxNTYzQzguODU1NDY5IDcuODUxNTYzIDguODU1NDY5IDcuODUxNTYzIDguODU5Mzc1IDcuODUxNTYzQzkuMDAzOTA2IDcuNzAzMTI1IDkuMDQyOTY5IDcuNDg4MjgxIDguOTY0ODQ0IDcuMjk2ODc1QzguODgyODEzIDcuMTA5Mzc1IDguNjk1MzEzIDYuOTkyMTg4IDguNDkyMTg4IDYuOTk2MDk0QzguMzcxMDk0IDcgOC4yNTc4MTMgNy4wNDI5NjkgOC4xNzE4NzUgNy4xMjVMOS4xNDg0MzggNi4xNDg0MzhMMTAuMTQ0NTMxIDUuMTQ4NDM4QzEwLjI0MjE4OCA1LjA1MDc4MSAxMC4zNzEwOTQgNSAxMC41IDVDMTAuNjI4OTA2IDUgMTAuNzUzOTA2IDUuMDUwNzgxIDEwLjg1NTQ2OSA1LjE0ODQzOEMxMS4wNDY4NzUgNS4zMzk4NDQgMTEuMDQ2ODc1IDUuNjYwMTU2IDEwLjg1NTQ2OSA1Ljg1MTU2M0w5Ljg1MTU2MyA2Ljg1MTU2M0w4Ljg1OTM3NSA3Ljg1MTU2M0M5LjA1NDY4OCA3Ljk0NTMxMyA5LjI3MzQzOCA4IDkuNSA4QzkuODk4NDM4IDggMTAuMjc3MzQ0IDcuODQzNzUgMTAuNTYyNSA3LjU2MjVMMTEuNTYyNSA2LjU2MjVDMTIuMTQ0NTMxIDUuOTc2NTYzIDEyLjE0NDUzMSA1LjAyMzQzOCAxMS41NjI1IDQuNDM3NUMxMS4yNjk1MzEgNC4xNDg0MzggMTAuODgyODEzIDQgMTAuNSA0IFogTSA3LjEwOTM3NSA4LjE4MzU5NEM2LjkzNzUgOC4zODI4MTMgNi45NDkyMTkgOC42ODM1OTQgNy4xMzY3MTkgOC44NzEwOTRDNy4zMjgxMjUgOS4wNTQ2ODggNy42Mjg5MDYgOS4wNjI1IDcuODI0MjE5IDguODgyODEzTDYuODUxNTYzIDkuODUxNTYzTDUuODUxNTYzIDEwLjg1NTQ2OUM1LjY2NDA2MyAxMS4wNDI5NjkgNS4zMzU5MzggMTEuMDQyOTY5IDUuMTQ4NDM4IDEwLjg1NTQ2OUM0Ljk1MzEyNSAxMC42NjAxNTYgNC45NTMxMjUgMTAuMzM5ODQ0IDUuMTQ4NDM4IDEwLjE0NDUzMUw2LjE0ODQzOCA5LjE0ODQzOFoiLz48L3N2Zz4=",
        accesskey: "L"
    }, {
        label: $L("show node type"),
        condition: 'shift',
        oncommand: 'window.BookmarkOpt.operate(event, "nodeType")',
        insertBefore: 'placesContext_openSeparator',
        image: 'chrome://global/skin/icons/info.svg',
    }];

    // 书签弹出面板菜单
    const PLACES_POPUP_ITEMS = [{
        'label': $L("add bookmark here"),
        'tooltiptext': $L("add bookmark here tooltip"),
        'image': "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        oncommand: "window.BookmarkOpt.operate(event, 'panelAdd', this.parentNode)"
    }, {

    }];

    let firstUpperCase = ([first, ...rest]) => first?.toUpperCase() + rest.join('');

    window.BookmarkOpt = {
        items: [],
        get topWin() {
            const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            return wm.getMostRecentWindow("navigator:browser");
        },
        get isBookarmkSidebar() {
            return location.href === "chrome://browser/content/places/bookmarksSidebar.xhtml";
        },
        get isHistorySidebar() {
            return location.href === "chrome://browser/content/places/historySidebar.xhtml";
        },
        get isMain() {
            return location.href === "chrome://browser/content/browser.xhtml";
        },
        addPlacesContextItems: function (ins) {
            PLACES_CONTEXT_ITEMS.forEach(p => {
                let item = $C('menuitem', p, document);
                if (!p.condition) item.setAttribute('condition', 'normal');
                this.items.push(item);
                ($(p.insertBefore) || ins || $('#placesContext').firstChild).before(item);
            });
        },
        handlePlacesContextEvent: function (event) {
            let target = event.target;
            if (event.type === 'popuphidden') {
                target.removeAttribute("bmopt");
            } else if (event.type === 'popupshowing') {
                let state = [],
                    triggerNode = event.currentTarget.triggerNode,
                    view = PlacesUIUtils.getViewForNode(triggerNode),
                    aNode = view?.selectedNode;
                if (triggerNode.id === "PlacesToolbarItems") {
                    target.setAttribute("bmopt", state.join("toolbar"));
                }
                ['bookmark', 'container', 'day', 'folder', 'historyContainer', 'host', 'query', 'separator', 'tagQuery'].forEach(condition => {
                    eval("if (PlacesUtils.nodeIs" + firstUpperCase(condition) + "(aNode)) state.push(condition)");
                });
                if (PlacesUtils.nodeIsURI(aNode)) state.push("uri");
                if (event.shiftKey) state.push('shift');
                target.setAttribute("bmopt", state.join(" "));
            }
        },
        handlePlacesToolbarEvent: function (event) {
            let { target } = event;
            if (event.type === 'popuphidden') {
                // 防止影响其他方式添加书签
                BookmarkOpt.clearPanelItems(target, true);
            } else if (event.type === 'popupshowing') {
                let firstItem = target.firstChild;
                if (firstItem?.classList.contains('bmopt-panel')) return;
                let last;
                PLACES_POPUP_ITEMS.forEach(c => {
                    let item;
                    if (c.label) {
                        item = $C('menuitem', c);
                        item.classList.add('bmopt-panel');
                    } else {
                        item = $C('menuseparator', {
                            'class': 'bmopt-separator'
                        })
                    }
                    if (last) {
                        last.after(item);
                    } else {
                        firstItem.parentNode.insertBefore(item, firstItem);
                    }
                    last = item;
                });
            }
        },
        clearPanelItems: function (target, doNotRecursive = false) {
            var menuitems = (target || document).querySelectorAll((doNotRecursive ? ":scope>" : "") + "[class*='bmopt']");
            console.log(menuitems);
            for (let menuitem of menuitems) {
                menuitem.parentNode.removeChild(menuitem);
            }
        },
        operate: function (event, aMethod, aTriggerNode) {
            let popupNode = aTriggerNode || PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
            if (!popupNode) return;
            let view = PlacesUIUtils.getViewForNode(popupNode),
                aNode = view?.selectedNode || popupNode._placesNode,
                aWin = BookmarkOpt.topWin,
                currentTitle = aWin.gBrowser.contentTitle,
                currentUrl = aWin.gBrowser.currentURI.spec,
                nodeIsFolder = PlacesUtils.nodeIsFolder(aNode),
                nodeIsHistoryFolder = PlacesUtils.nodeIsHistoryContainer(aNode);
            switch (aMethod) {
                case 'panelAdd':
                    BookmarkOpt.clearPanelItems(aTriggerNode);
                case 'add':
                    var info = {
                        title: currentTitle,
                        url: currentUrl,
                        index: nodeIsFolder ? (event.shiftKey ? 0 : PlacesUtils.bookmarks.DEFAULT_INDEX) : (event.shiftKey ? aNode.bookmarkIndex : aNode.bookmarkIndex + 1),
                        parentGuid: nodeIsFolder ? aNode.targetFolderGuid || aNode.bookmarkGuid : aNode.parent.targetFolderGuid
                    };
                    if (!info.parentGuid) return;
                    PlacesUtils.bookmarks.insert(info);
                    break;
                case 'update':
                    if (!aNode.bookmarkGuid) return;
                    var info = {
                        guid: aNode.bookmarkGuid,
                        title: aNode.title,
                        url: currentUrl,
                    }
                    if (event.button === 1) {
                        info.title = currentTitle;
                    } else if (event.button === 2) {
                        const title = window.prompt($L("update current bookmark prompt", aNode.title), currentTitle);
                        if (title === null) return;
                        if (title !== aNode.title)
                            info.title = title;
                    }
                    PlacesUtils.bookmarks.update(info);
                    break;
                case 'copyTitle':
                    var format = "%TITLE%"
                case 'copyUrl':
                case 'copy':
                    format || (format = event.target.getAttribute("text") || "%URL%")
                    let strs = [];
                    if (aNode.hasChildren) {
                        // aNode.childChild will cause error, use follow lines instead
                        let folder = nodeIsHistoryFolder ? aNode : PlacesUtils.getFolderContents(aNode.targetFolderGuid).root;
                        for (let i = 0; i < folder.childCount; i++) {
                            strs.push(convertText(folder.getChild(i), format));
                        }
                    } else {
                        strs.push(convertText(aNode, format));
                    }
                    copyText(strs.join("\n"));
                    function convertText(node, text) {
                        return text.replace(BookmarkOpt.regexp, function (str) {
                            str = str.toUpperCase().replace("%LINK", "%RLINK");
                            if (str.indexOf("_HTMLIFIED") >= 0)
                                return htmlEscape(convert(str.replace("_HTMLIFIED", "")));
                            if (str.indexOf("_HTML") >= 0)
                                return htmlEscape(convert(str.replace("_HTML", "")));
                            if (str.indexOf("_ENCODE") >= 0)
                                return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                            return convert(str);
                        });
                        function convert(str) {
                            switch (str) {
                                case "%T":
                                case "%TITLE%":
                                    return node.title.replaceAll(/\[/g, "【").replaceAll(/\]/g, "】");
                                case "%U":
                                case "%URL%":
                                    return node.uri;
                                case "%H":
                                case "%HOST%":
                                    throw new Error("Not yet implemented");
                                    break;
                            }
                        }
                    }
                    break;
                case 'nodeType':
                    let state = [];
                    ['bookmark', 'container', 'day', 'folder', 'historyContainer', 'host', 'query', 'separator', 'tagQuery'].forEach(condition => {
                        eval("if (PlacesUtils.nodeIs" + firstUpperCase(condition) + "(aNode)) state.push(condition)");
                    });
                    if (PlacesUtils.nodeIsURI(aNode)) state.push('uri');
                    alert(state.join(" "));
                    break;
            }
        },
        handleUrlBarEvent: function (event) {
            let { target, button } = event;
            switch (event.type) {
                case 'dblclick':
                    if (target.id === "urlbar-input" && button == 0) {
                        var bar = target.ownerGlobal.document.getElementById("PersonalToolbar");
                        target.ownerGlobal.setToolbarVisibility(bar, bar.collapsed);
                    }
                    break;
            }
        },
        init: function () {
            let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
            let rTITLE = "%TITLE" + he + "%|%t\\b";
            let rURL = "%URL" + he + "%|%u\\b";
            let rHOST = "%HOST" + he + "%|%h\\b";
            this.rTITLE = new RegExp(rTITLE, "i");
            this.rURL = new RegExp(rURL, "i");
            this.rHOST = new RegExp(rHOST, "i");
            this.regexp = new RegExp(
                [rTITLE, rURL, rHOST].join("|"), "ig");

            this.addPlacesContextItems();
            $('placesContext').addEventListener('popupshowing', this.handlePlacesContextEvent, false);
            $('placesContext').addEventListener('popuphidden', this.handlePlacesContextEvent, false);
            if (this.isMain) {
                // ($("prefSep") || $("webDeveloperMenu")).before(
                //     $C('menuitem', {
                //         id: "BookmarOpt-menu-options",
                //         label: $L("bookmarkopt options"),
                //         oncommand: "BookmarkOpt.showOptions();",
                //         style: 'list-style-image: url("chrome://browser/skin/bookmarks-toolbar.svg")'
                //     })
                // );
                $('PlacesToolbarItems').addEventListener('popupshowing', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').addEventListener('popuphidden', this.handlePlacesToolbarEvent, false);
                document.getElementById('urlbar').addEventListener('dblclick', BookmarkOpt.handleUrlBarEvent, false);
            }
            this.style = addStyle(css);
        },
        destroy: function () {
            $('placesContext').removeEventListener('popupshowing', this.handlePlacesContextEvent, false);
            $('placesContext').removeEventListener('popuphidden', this.handlePlacesContextEvent, false);
            $('placesContext').removeAttribute('bmopt');
            this.items.forEach(element => {
                element.remove();
            });
            if (this.isMain) {
                this.clearPanelItems(this.topWin.document);
                let m = $("BookmarOpt-menu-options");
                if (m) m.parentNode.removeChild(m);
                $('PlacesToolbarItems').removeEventListener('popupshowing', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').removeEventListener('popuphidden', this.handlePlacesToolbarEvent, false);
                document.getElementById('urlbar').removeEventListener('dblclick', BookmarkOpt.handleUrlBarEvent, false);
            }
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.BookmarkOpt;
        },
    }


    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }

    function $C(type, props = {}, aDoc) {
        let doc = aDoc || document;
        let el = doc.createXULElement(type);
        for (let p in props) {
            if (type === 'menuitem' && p === 'image') el.classList.add('menuitem-iconic');
            el.setAttribute(p, props[p]);
        }
        el.classList.add('bmopt');
        if (type === "menu" || type === "menuitem") {
            el.classList.add(type + "-iconic");
        }
        return el;
    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    function copyText(aText) {
        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
    }

    function $L(key, replace) {
        let str = LANG[_LOCALE].hasOwnProperty(key) ? LANG[_LOCALE][key] : (LANG['zh-CN'].hasOwnProperty(key) ? LANG['zh-CN'][key] : "");
        str = str.replace("%s", replace || "");
        return str;
    }

    window.BookmarkOpt.init();
})(`
.bmopt-separator+menuseparator{
    display: none;
}
#placesContext .bmopt[condition] {
    visibility: collapse;
}
#placesContext[bmopt~="bookmark"] .bmopt[condition~="bookmark"],
#placesContext[bmopt~="container"] .bmopt[condition~="container"],
#placesContext[bmopt~="day"] .bmopt[condition~="day"],
#placesContext[bmopt~="folder"] .bmopt[condition~="folder"],
#placesContext[bmopt~="historyContainer"] .bmopt[condition~="historyContainer"],
#placesContext[bmopt~="host"] .bmopt[condition~="host"],
#placesContext[bmopt~="query"] .bmopt[condition~="query"],
#placesContext[bmopt~="separator"] .bmopt[condition~="separator"],
#placesContext[bmopt~="tagQuery"] .bmopt[condition~="tagQuery"],
#placesContext[bmopt~="uri"] .bmopt[condition~="uri"],
#placesContext[bmopt~="shift"] .bmopt[condition~="shift"] {
    visibility: visible;
}
`)