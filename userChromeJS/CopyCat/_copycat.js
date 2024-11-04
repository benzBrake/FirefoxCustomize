css(`
    #CopyCat-InsertPoint, #toolbar-menubar, #toggle_toolbar-menubar, #TabsToolbar > .titlebar-spacer[type="pre-tabs"] {
        display: none;
    }
    :root:not([chromehidden~="menubar"], [inFullscreen]) #toolbar-menubar[autohide="false"] + #TabsToolbar > .titlebar-buttonbox-container {
        display: -moz-box !important;
        display: flex !important;
    }
    #fullScreenItem:not([checked="true"]) {
        position: relative;
    }
    #fullScreenItem:not([checked="true"])::before {
        content: "";
        width: 16px;
        height: 16px;
        display: -moz-box;
        display: flex;
        background-image: url(chrome://browser/skin/fullscreen.svg);
        position: absolute;
        left: 1em;
    }
    #TabsToolbar-customization-target > #CopyCat-Btn:first-child {
        width: 90px;
        border: none !important;
        background-clip: padding-box !important;
        padding-inline: .5em;
        margin-inline: .5em;
        margin-bottom: 4px !important;
        border-radius: 0 0 6px 6px;
        height: 32px;
        & > .toolbarbutton-icon {
            list-style-image: url("chrome://devtools/skin/images/browsers/firefox.svg") !important;
            fill: white;
            --toolbarbutton-hover-background: transparent;
            --toolbarbutton-active-background: transparent;
            padding: 0 !important;
            height: 16px !important;
            width: 16px !important;
            appearance: none;
        }
        &:not([open=true]):not(:hover):not(:active) {
            background-image: linear-gradient(rgb(247, 182, 82), rgb(215, 98, 10) 95%);
            box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset, 0 0 0 1px rgba(255, 255, 255, 0.25) inset;
        }
        &:hover:not([open=true]):not(:active) {
            background-image: radial-gradient(farthest-side at center bottom, rgba(252, 240, 89, 0.5) 10%, rgba(252, 240, 89, 0) 70%), radial-gradient(farthest-side at center bottom, rgb(236, 133, 0), rgba(255, 229, 172, 0)), linear-gradient(rgb(246, 170, 69), rgb(209, 74, 0) 95%);
            box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset, 0 0 2px 1px rgba(250, 234, 169, 0.7) inset, 0 -1px 0 rgba(250, 234, 169, 0.5) inset;
        }
        &:hover:active, 
        &[open] {
            background-image: linear-gradient(rgb(246, 170, 69), rgb(209, 74, 0) 95%);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.4) inset, 0 1px 1px rgba(0, 0, 0, 0.2) inset;
        }
        &:after {
            content: "Firefox";
            display: flex !important;
            align-items: center;
            padding-inline: 4px 0;
            color: white !important;
            font-weight: bold !important;
            text-shadow: 0 0 1px rgba(0, 0, 0, 0.7), 0 1px 1.5px rgba(0, 0, 0, 0.5) !important;
            margin-block: 0px !important;
            border: unset !important;
            box-shadow: unset !important;
            height: 100% !important;
        }
    }
    `)
const isZh = Cc["@mozilla.org/intl/localeservice;1"].getService(Ci.mozILocaleService).requestedLocale.includes("zh");
menus([{
    command: 'file-menu',
    image: 'chrome://devtools/content/debugger/images/folder.svg'
}, {
    command: 'edit-menu',
    image: 'chrome://global/skin/icons/edit.svg'
}, {
    command: 'view-menu',
    image: 'chrome://devtools/skin/images/command-frames.svg',
    style: 'fill-opacity: 0;'
}, {
    command: 'history-menu',
    image: 'chrome://browser/skin/history.svg'
}, {
    command: 'bookmarksMenu',
    image: 'chrome://browser/skin/bookmark.svg'
}, {
    command: 'tools-menu',
    image: 'chrome://devtools/skin/images/tool-application.svg'
}, {}, {
    label: isZh ? "修改配置文件" : "Edit Config File",
    image: 'chrome://browser/skin/preferences/category-general.svg',
    popup: [{ label: 'user.js', edit: '\\user.js', },
    { label: 'userChrome.css', edit: '\\chrome\\userChrome.css' },
    { label: 'userContent.css', edit: '\\chrome\\userContent.css' }, {},
    {
        label: isZh ? 'user.js 推荐' : 'Recommended user.js', where: 'tab',
        url: 'https://github.com/arkenfox/user.js'
    },
    {
        label: isZh ? 'Firefox CSS 商店' : 'Firefox CSS Store', where: 'tab',
        url: 'https://firefoxcss-store.github.io/'
    }]
}, {
    command: 'CopyCatTheme-Menu',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPjxwYXRoIGQ9Ik0xNS41OTM3NSAyLjk2ODc1QzE1LjA2MjUgMi45ODQzNzUgMTQuNTE1NjI1IDMuMDQyOTY5IDEzLjk2ODc1IDMuMTI1TDEzLjkzNzUgMy4xMjVDOC42MTMyODEgMy45OTYwOTQgNC4zMDA3ODEgOC4xOTE0MDYgMy4yMTg3NSAxMy41QzIuODk0NTMxIDE1LjAxMTcxOSAyLjkxNDA2MyAxNi40MjE4NzUgMy4xMjUgMTcuODEyNUMzLjEzMjgxMyAxNy44MTY0MDYgMy4xMjUgMTcuODM1OTM4IDMuMTI1IDE3Ljg0Mzc1QzMuNDUzMTI1IDIwLjE5MTQwNiA2LjUgMjEuMjE4NzUgOC4yMTg3NSAxOS41QzkuNDQ5MjE5IDE4LjI2OTUzMSAxMS4yNjk1MzEgMTguMjY5NTMxIDEyLjUgMTkuNUMxMy43MzA0NjkgMjAuNzMwNDY5IDEzLjczMDQ2OSAyMi41NTA3ODEgMTIuNSAyMy43ODEyNUMxMC43ODEyNSAyNS41IDExLjgwODU5NCAyOC41NDY4NzUgMTQuMTU2MjUgMjguODc1QzE0LjE2NDA2MyAyOC44NzUgMTQuMTgzNTk0IDI4Ljg2NzE4OCAxNC4xODc1IDI4Ljg3NUMxNS41NjY0MDYgMjkuMDg1OTM4IDE2Ljk2ODc1IDI5LjA5NzY1NiAxOC40Njg3NSAyOC43ODEyNUMxOC40ODA0NjkgMjguNzgxMjUgMTguNDg4MjgxIDI4Ljc4MTI1IDE4LjUgMjguNzgxMjVDMjMuODI0MjE5IDI3Ljc4OTA2MyAyOC4wMDc4MTMgMjMuMzc1IDI4Ljg3NSAxOC4wNjI1TDI4Ljg3NSAxOC4wMzEyNUMzMC4wMDc4MTMgMTAuMzkwNjI1IDI0LjQyMTg3NSAzLjcxODc1IDE3LjE1NjI1IDMuMDMxMjVDMTYuNjM2NzE5IDIuOTgwNDY5IDE2LjEyNSAyLjk1MzEyNSAxNS41OTM3NSAyLjk2ODc1IFogTSAxNS42MjUgNC45Njg3NUMxNi4wNzgxMjUgNC45NTMxMjUgMTYuNTI3MzQ0IDQuOTYwOTM4IDE2Ljk2ODc1IDVDMjMuMTY0MDYzIDUuNTY2NDA2IDI3Ljg3NSAxMS4yMTQ4NDQgMjYuOTA2MjUgMTcuNzVDMjYuMTc1NzgxIDIyLjIyNjU2MyAyMi41ODU5MzggMjUuOTkyMTg4IDE4LjEyNSAyNi44MTI1TDE4LjA5Mzc1IDI2LjgxMjVDMTYuODE2NDA2IDI3LjA4NTkzOCAxNS42MzY3MTkgMjcuMDg5ODQ0IDE0LjQzNzUgMjYuOTA2MjVDMTMuNjE3MTg4IDI2LjgwNDY4OCAxMy4yMzgyODEgMjUuODg2NzE5IDEzLjkwNjI1IDI1LjIxODc1QzE1Ljg3NSAyMy4yNSAxNS44NzUgMjAuMDYyNSAxMy45MDYyNSAxOC4wOTM3NUMxMS45Mzc1IDE2LjEyNSA4Ljc1IDE2LjEyNSA2Ljc4MTI1IDE4LjA5Mzc1QzYuMTEzMjgxIDE4Ljc2MTcxOSA1LjE5NTMxMyAxOC4zODI4MTMgNS4wOTM3NSAxNy41NjI1QzQuOTEwMTU2IDE2LjM2MzI4MSA0LjkxNDA2MyAxNS4xODM1OTQgNS4xODc1IDEzLjkwNjI1QzYuMTA1NDY5IDkuNDE3OTY5IDkuNzczNDM4IDUuODI0MjE5IDE0LjI1IDUuMDkzNzVDMTQuNzE4NzUgNS4wMjM0MzggMTUuMTcxODc1IDQuOTg0Mzc1IDE1LjYyNSA0Ljk2ODc1IFogTSAxNCA3QzEyLjg5NDUzMSA3IDEyIDcuODk0NTMxIDEyIDlDMTIgMTAuMTA1NDY5IDEyLjg5NDUzMSAxMSAxNCAxMUMxNS4xMDU0NjkgMTEgMTYgMTAuMTA1NDY5IDE2IDlDMTYgNy44OTQ1MzEgMTUuMTA1NDY5IDcgMTQgNyBaIE0gMjEgOUMxOS44OTQ1MzEgOSAxOSA5Ljg5NDUzMSAxOSAxMUMxOSAxMi4xMDU0NjkgMTkuODk0NTMxIDEzIDIxIDEzQzIyLjEwNTQ2OSAxMyAyMyAxMi4xMDU0NjkgMjMgMTFDMjMgOS44OTQ1MzEgMjIuMTA1NDY5IDkgMjEgOSBaIE0gOSAxMUM3Ljg5NDUzMSAxMSA3IDExLjg5NDUzMSA3IDEzQzcgMTQuMTA1NDY5IDcuODk0NTMxIDE1IDkgMTVDMTAuMTA1NDY5IDE1IDExIDE0LjEwNTQ2OSAxMSAxM0MxMSAxMS44OTQ1MzEgMTAuMTA1NDY5IDExIDkgMTEgWiBNIDIzIDE2QzIxLjg5NDUzMSAxNiAyMSAxNi44OTQ1MzEgMjEgMThDMjEgMTkuMTA1NDY5IDIxLjg5NDUzMSAyMCAyMyAyMEMyNC4xMDU0NjkgMjAgMjUgMTkuMTA1NDY5IDI1IDE4QzI1IDE2Ljg5NDUzMSAyNC4xMDU0NjkgMTYgMjMgMTYgWiBNIDE5IDIxQzE3Ljg5NDUzMSAyMSAxNyAyMS44OTQ1MzEgMTcgMjNDMTcgMjQuMTA1NDY5IDE3Ljg5NDUzMSAyNSAxOSAyNUMyMC4xMDU0NjkgMjUgMjEgMjQuMTA1NDY5IDIxIDIzQzIxIDIxLjg5NDUzMSAyMC4xMDU0NjkgMjEgMTkgMjFaIi8+PC9zdmc+'
}, { command: 'TabPlus-menu' }, {
    label: isZh ? "Firefox 功能" : "Firefox functions",
    image: "chrome://branding/content/about-logo.svg",
    popup: [{
        label: isZh ? "Web 开发者工具" : "Web Developer Tools",
        oncommand: function () {
            var { require } = ChromeUtils.importESModule('resource://devtools/shared/loader/Loader.sys.mjs', {});
            var { gDevToolsBrowser } = require('devtools/client/framework/devtools-browser');
            gDevToolsBrowser.toggleToolboxCommand(window.gBrowser, Cu.now());
        },
        image: 'chrome://global/skin/icons/performance.svg'
    }, {
        class: 'showFirstText',
        group: [{
            label: isZh ? "浏览器内容工具箱" : "Browser Toolbox",
            image: "chrome://devtools/skin/images/command-frames.svg",
            oncommand: function (event) {
                var doc = event.target.ownerDocument;
                if (document.querySelector("#main-menubar > script")) {
                    let { require } = ChromeUtils.importESModule('resource://devtools/shared/loader/Loader.sys.mjs', {});
                    let { BrowserToolboxLauncher } = require('resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs');
                    BrowserToolboxLauncher.init();
                } else {
                    if (!doc.getElementById('menu_browserToolbox')) {
                        let { require } = Cu.import("resource://devtools/shared/loader/Loader.jsm", {});
                        require("devtools/client/framework/devtools-browser");
                    };
                    doc.getElementById('menu_browserToolbox').click();
                }
            }
        },
        {
            label: isZh ? "修复浏览器内容工具箱" : "Repair Browser Toolbox",
            tooltiptext: isZh ? "修复浏览器内容工具箱" : "Repair Browser Toolbox",
            insertBefore: 'Copycat-Config-Group',
            oncommand: async function () {
                const targetPath = PathUtils.join(PathUtils.profileDir, "chrome_debugger_profile");
                await IOUtils.remove(targetPath, { recursive: true });
                await IOUtils.setPermissions(targetPath, 0o660);
            },
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M20.71,3.29c-1.04-1.04-2.5-1.55-4.12-1.45c-1.5,0.1-2.95,0.74-3.98,1.77c-1.06,1.06-1.49,2.35-1.25,3.72c0.04,0.24,0.1,0.47,0.18,0.71l-3.5,3.5c-0.24-0.08-0.47-0.14-0.71-0.18c-1.37-0.24-2.66,0.19-3.72,1.25c-1.03,1.03-1.67,2.48-1.77,3.98c-0.1,1.62,0.41,3.08,1.45,4.12c0.95,0.95,2.26,1.46,3.71,1.46c0.13,0,0.27,0,0.41-0.01c1.5-0.1,2.95-0.74,3.98-1.77c1.06-1.06,1.49-2.35,1.25-3.72c-0.04-0.24-0.1-0.47-0.18-0.71l3.5-3.5c0.24,0.08,0.47,0.14,0.71,0.18c0.25,0.05,0.49,0.07,0.73,0.07c1.1,0,2.12-0.45,2.99-1.32c1.03-1.03,1.67-2.48,1.77-3.98C22.26,5.79,21.75,4.33,20.71,3.29z M18.98,9.97c-0.39,0.39-0.79,0.63-1.23,0.7c-0.24,0.05-0.48,0.05-0.74,0c-0.46-0.08-0.95-0.3-1.45-0.65l-1.43,1.43l-2.68,2.68l-1.43,1.43c0.35,0.5,0.57,0.99,0.65,1.45c0.02,0.13,0.04,0.26,0.04,0.39c0,0.1-0.01,0.2-0.02,0.29c-0.07,0.46-0.31,0.88-0.71,1.28c-0.69,0.69-1.68,1.12-2.7,1.19c-0.634,0.043-1.215-0.074-1.721-0.304l2.148-2.149c0.391-0.391,0.391-1.023,0-1.414s-1.023-0.391-1.414,0l-2.148,2.149c-0.231-0.506-0.348-1.088-0.305-1.722c0.07-1.02,0.5-2.01,1.18-2.69c0.41-0.41,0.84-0.65,1.3-0.71c0.09-0.02,0.19-0.03,0.29-0.03c0.12,0,0.25,0.01,0.38,0.04c0.46,0.08,0.95,0.3,1.45,0.65l1.43-1.43l2.68-2.68l1.43-1.43c-0.35-0.5-0.57-0.99-0.65-1.45c-0.04-0.24-0.05-0.46-0.02-0.68c0.07-0.46,0.31-0.88,0.71-1.28c0.69-0.69,1.68-1.12,2.7-1.19c0.1-0.01,0.19-0.01,0.28-0.01c0.53,0,1.01,0.1,1.44,0.31h0.005l-2.153,2.153c-0.391,0.391-0.391,1.023,0,1.414C16.488,7.902,16.744,8,17,8s0.512-0.098,0.707-0.293l2.163-2.163V5.55c0.23,0.5,0.33,1.1,0.29,1.73C20.09,8.3,19.66,9.29,18.98,9.97z"/></svg>'
        }]
    }, {
        'data-l10n-id': 'appmenuitem-passwords',
        oncommand: "LoginHelper.openPasswordManager(window, { entryPoint: 'mainmenu' })",
        image: 'chrome://browser/skin/login.svg'
    }]
}, {
    label: "about:",
    image: "chrome://global/skin/icons/developer.svg",
    onclick: "event.target.querySelector('menuitem').click()",
    popup: [{ url: 'about:about', where: 'tab', image: 'chrome://branding/content/about-logo.svg' },
    { url: 'about:cache', where: 'tab', image: 'chrome://global/skin/icons/developer.svg' },
    { url: 'about:certificate', where: 'tab', image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M25 2C12.296875 2 2 12.296875 2 25C2 37.703125 12.296875 48 25 48C37.703125 48 48 37.703125 48 25C48 12.296875 37.703125 2 25 2 Z M 25 4C36.578125 4 46 13.421875 46 25C46 36.578125 36.578125 46 25 46C13.421875 46 4 36.578125 4 25C4 13.421875 13.421875 4 25 4 Z M 25 8C20.035156 8 16 12.035156 16 17L16 21L22 21L22 17C22 15.347656 23.347656 14 25 14C26.652344 14 28 15.347656 28 17L28 21L34 21L34 17C34 12.035156 29.964844 8 25 8 Z M 25 10C28.867188 10 32 13.132813 32 17L32 19L30 19L30 17C30 14.238281 27.761719 12 25 12C22.238281 12 20 14.238281 20 17L20 19L18 19L18 17C18 13.132813 21.132813 10 25 10 Z M 16 22C13.792969 22 12 23.792969 12 26L12 36C12 38.207031 13.792969 40 16 40L34 40C36.207031 40 38 38.207031 38 36L38 26C38 23.792969 36.207031 22 34 22 Z M 16 24L34 24C35.105469 24 36 24.894531 36 26L36 36C36 37.105469 35.105469 38 34 38L16 38C14.894531 38 14 37.105469 14 36L14 26C14 24.894531 14.894531 24 16 24 Z M 17 26C16.449219 26 16 26.449219 16 27L16 35C16 35.550781 16.449219 36 17 36C17.550781 36 18 35.550781 18 35L18 27C18 26.449219 17.550781 26 17 26 Z M 25 26C23.894531 26 23 26.894531 23 28C23 28.714844 23.382813 29.375 24 29.730469L24 35L26 35L26 29.730469C26.617188 29.371094 27 28.714844 27 28C27 26.894531 26.105469 26 25 26Z" /></svg>' },
    { url: 'about:checkerboard', where: 'tab', image: 'chrome://global/skin/icons/clipboard.svg' },
    { url: 'about:compat', where: 'tab', image: 'resource://devtools-shared-images/alert-small.svg' },
    { url: 'about:config', where: 'tab', image: 'chrome://global/skin/icons/settings.svg' },
    { url: 'about:crashes', where: 'tab', image: 'chrome://global/skin/icons/loading.svg' },
    { url: 'about:debugging', where: 'tab', image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M5 5a3 3 0 0 1 6 0v7a3 3 0 1 1-6 0V5Z"/><path fill-rule="evenodd" d="M6.369 0c.345 0 .625.28.625.625v1.371a1.006 1.006 0 0 0 2.012 0V.626a.625.625 0 1 1 1.25 0v1.37a2.256 2.256 0 1 1-4.512 0V.626c0-.346.28-.626.625-.626ZM2.627 1c.345 0 .625.28.625.626v1.871c0 .76.616 1.376 1.376 1.376h6.745c.76 0 1.376-.616 1.376-1.376V1.626a.625.625 0 0 1 1.25 0v1.871a2.627 2.627 0 0 1-2.626 2.627H4.628A2.627 2.627 0 0 1 2 3.497V1.626c0-.345.28-.625.626-.625ZM0 8.63c0-.345.28-.625.625-.625h14.75a.625.625 0 1 1 0 1.25H.625A.625.625 0 0 1 0 8.63Zm4.628 3.498c-.76 0-1.376.616-1.376 1.375v1.872a.625.625 0 1 1-1.25 0v-1.872a2.627 2.627 0 0 1 2.626-2.626h6.745a2.627 2.627 0 0 1 2.626 2.626v1.872a.625.625 0 1 1-1.25 0v-1.872c0-.76-.616-1.375-1.376-1.375H4.628Z" clip-rule="evenodd"/></svg>' },
    { url: 'about:downloads', where: 'tab', image: 'chrome://browser/skin/downloads/downloads.svg' },
    { url: 'about:logging', where: 'tab', image: 'chrome://devtools/skin/images/tool-webconsole.svg' },
    { url: 'about:logins', where: 'tab', image: 'chrome://browser/skin/login.svg' },
    { url: 'about:memory', where: 'tab', image: 'chrome://devtools/skin/images/tool-memory.svg' },
    { url: 'about:networking', where: 'tab', image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"><path fill-rule="evenodd" d="m12.499 9.154 1.326-1.326a4 4 0 0 0-5.657-5.656L6.842 3.497a.625.625 0 0 0 0 .884l4.773 4.773c.244.244.64.244.884 0ZM9.052 3.055a2.75 2.75 0 0 1 3.889 3.89l-.878.878-3.89-3.89.879-.878ZM3.497 6.842 2.172 8.168a4 4 0 0 0 5.656 5.657l1.326-1.326a.625.625 0 0 0 0-.884L4.381 6.842a.625.625 0 0 0-.884 0Zm3.448 6.099a2.75 2.75 0 0 1-3.89-3.89l.876-.875 3.889 3.89-.875.875Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M15.812.188a.625.625 0 0 1 0 .884l-2 2a.625.625 0 1 1-.884-.884l2-2a.625.625 0 0 1 .884 0Zm-8.37 6.37a.625.625 0 0 1 0 .884l-1.5 1.5a.625.625 0 0 1-.884-.884l1.5-1.5a.625.625 0 0 1 .884 0Zm2 2a.625.625 0 0 1 0 .884l-1.5 1.5a.625.625 0 1 1-.884-.884l1.5-1.5a.625.625 0 0 1 .884 0Zm-6.5 4.5a.625.625 0 0 1 0 .884l-1.87 1.87a.625.625 0 0 1-.884-.884l1.87-1.87a.625.625 0 0 1 .884 0Z" clip-rule="evenodd"/></svg>' },
    { url: 'about:processes', where: 'tab', image: 'chrome://global/skin/icons/performance.svg' },
    { url: 'about:policies', where: 'tab', image: 'chrome://browser/content/policies/policies-active.svg' },
    { url: 'about:profiles', where: 'tab', image: 'chrome://global/skin/icons/info.svg' },
    { url: 'about:profiling', where: 'tab', image: 'chrome://devtools/skin/images/profiler-stopwatch.svg' },
    { url: 'about:protections', where: 'tab', image: 'chrome://browser/skin/tracking-protection.svg' },
    { url: 'about:rights', where: 'tab', image: 'chrome://global/skin/illustrations/about-rights.svg' },
    { url: 'about:serviceworkers', where: 'tab', image: 'chrome://global/skin/icons/developer.svg' },
    { url: 'about:studies', where: 'tab', image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" transform="scale(1.1)"><path fill="context-fill light-dark(black, white)" d="M13.9 9.81a1.23 1.23 0 0 0 0-.17v-.08a5.67 5.67 0 0 0-2.4-3.36 1.17 1.17 0 0 1-.56-.95V3a1 1 0 0 0-1-1H6.06a1 1 0 0 0-1 1v2.25a1.17 1.17 0 0 1-.56 1 5.66 5.66 0 0 0-2.35 3.33v.12a.53.53 0 0 0 0 .11 5.35 5.35 0 0 0-.11 1 5.65 5.65 0 0 0 3.24 5.09 1 1 0 0 0 .44.1h4.57a1 1 0 0 0 .44-.1A5.65 5.65 0 0 0 14 10.83a5.3 5.3 0 0 0-.1-1.02zm-8.27-2a3.18 3.18 0 0 0 1.43-2.6V4h1.88v1.25a3.18 3.18 0 0 0 1.43 2.6 3.68 3.68 0 0 1 1.54 2.24v.22a2.82 2.82 0 0 1-3.68-.59A3.48 3.48 0 0 0 4.56 9a3.76 3.76 0 0 1 1.07-1.15z"></path></svg>' },
    { url: 'about:support', where: 'tab', image: 'chrome://devtools/skin/images/browsers/firefox.svg' },
    { url: 'about:sync-log', where: 'tab', image: 'chrome://browser/skin/sync.svg' },
    { url: 'about:telemetry', where: 'tab', image: 'chrome://global/skin/icons/arrow-down.svg' },
    { url: 'about:third-party', where: 'tab', image: 'chrome://browser/skin/library.svg' },
    { url: 'about:unloads', where: 'tab', image: 'chrome://mozapps/skin/extensions/category-available.svg' },
    { url: 'about:url-classifier', where: 'tab', image: 'chrome://global/skin/icons/link.svg' },
    { url: 'about:webrtc', where: 'tab', image: 'chrome://browser/skin/notification-icons/screen.svg' },
    { url: 'about:windows-messages', where: 'tab', image: 'chrome://browser/skin/window.svg' }]
}, {
    label: isZh ? "编辑器设置" : "Set Text Editor",
    insertBefore: 'Copycat-Config-Group',
    image: 'chrome://browser/skin/preferences/category-general.svg',
    oncommand: async function () {
        let isZh = Cc["@mozilla.org/intl/localeservice;1"].getService(Ci.mozILocaleService).requestedLocale.includes("zh");
        let editor = await new Promise(resolve => {
            let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                ? window.browsingContext
                : window, isZh ? "选择编辑器" : "Select Editor", Ci.nsIFilePicker.modeOpen);
            fp.appendFilters(Ci.nsIFilePicker.filterApps);
            fp.appendFilters(Ci.nsIFilePicker.filterAll);
            fp.open(async (result) => {
                if (result == Ci.nsIFilePicker.returnOK) {
                    Services.prefs.setComplexValue("view_source.editor.path", Ci.nsIFile, fp.file);
                    resolve(fp.file);
                } else {
                    resolve(null);
                }
            })
        });
        let alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        if (editor) {
            alertsService.showAlertNotification(
                "chrome://global/skin/icons/info.svg", "CopyCat",
                isZh ? "编辑器设置成功!" : "Text editor changed successfully!", false, "", null);
        } else {
            alertsService.showAlertNotification(
                'data:image/svg+xml;utf8,<svg width="32" height="32" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="24" fill="red" stroke-width="0"/><line x1="15" y1="15" x2="35" y2="35" stroke="white" stroke-width="4" stroke-linecap="round"/><line x1="35" y1="15" x2="15" y2="35" stroke="white" stroke-width="4" stroke-linecap="round"/></svg>', "CopyCat",
                "编辑器设置失败", false, "", null);
        }

    }
}, {
    label: isZh ? "复制扩展清单" : "Copy Extension Manifest",
    tooltiptext: isZh ? "左键：名称 + 相关网页\nShift+左键：Markdown 表格" : "Left click: Copy Extension Manifest\nShift+Left click: Markdown Table",
    image: "chrome://mozapps/skin/extensions/extension.svg",
    insertBefore: 'Copycat-Config-Group',
    onclick: async function (e) {
        e.preventDefault();
        let isZh = Cc["@mozilla.org/intl/localeservice;1"].getService(Ci.mozILocaleService).requestedLocale.includes("zh");
        let AddonRepository;
        try {
            AddonRepository = ChromeUtils.importESModule("resource://gre/modules/addons/AddonRepository.sys.mjs", {}).AddonRepository
        } catch (ex) {
            AddonRepository = Cu.import("resource://gre/modules/addons/AddonRepository.jsm", {}).AddonRepository;
        }
        let addons = await AddonManager.getAddonsByTypes(['extension']);
        addons = addons.filter(addon => !addon.isBuiltin).map(addon => {
            let data = [],
                repositoryAddon = AddonRepository._parseAddon(addon);

            data['url'] = addon.homepageURL || addon.installTelemetryInfo?.sourceURL || '';;
            ["name", "command", "isWebExtension", "version", "isActive"].forEach(k => {
                data[k] = addon[k] || '';
            });
            data['name'] = data['name'].replaceAll('|', '丨');
            data['description'] = repositoryAddon.fullDescription.replaceAll('|', '丨');
            return data;
        })
        let text = e.shiftKey ? (isZh ? "| 名称 | 版本 | 介绍 | 默 |" : "| Name | Version | Description | Enabled |") + " \n| ---- | ---- | ---- | ---- |\n" : "",
            glue = e.shiftKey ? "|" : " ";
        addons.forEach(item => {
            let nameWithUrl = item.name;
            if (item.url) {
                nameWithUrl = `[${item.name}](${item.url})`;
            }
            let line = (e.shiftKey ? [nameWithUrl, item.version, item.description, item.isActive ? '✔' : '✘'] : [item.name, item.version, item.url, item.isActive ? '✔' : '✘']).join(glue);
            if (e.shiftKey) line = [glue, glue].join(line);
            text += line + '\n';
        });
        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
    }
}, {
    label: isZh ? "复制UC脚本清单" : "Copy userChrome.js Scripts List",
    insertBefore: 'Copycat-Config-Group',
    tooltiptext: isZh ? "左键：名称 + 主页\nShift+左键：Markdown 表格" : "Left click: Copy userChrome.js Scripts List\nShift+Left click: Markdown Table",
    image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC",
    onclick: function (e) {
        e.preventDefault();
        if (e.button > 0) return;
        var scripts;
        if (window.userChrome_js) {
            scripts = window.userChrome_js.scripts.concat(window.userChrome_js.overlays);

            scripts = scripts.map(script => {
                let meta = readScriptInfo(script.file);
                return {
                    filename: script.filename,
                    url: script.url.indexOf("http") === 0 ? script.url : "",
                    isEnabled: !userChrome_js.scriptDisable[this.name],
                    description: script.description,
                    version: meta.version.split(" ")[0],
                    charset: meta.charset,
                    url: meta.homepage || meta.homepageURL || meta.downloadURL || ""
                }
            });
        } else if (window._uc && !window._uc.isFaked) {
            scripts = Object.values(_uc.scripts);
        } else if (typeof _ucUtils === 'object') {
            scripts = _ucUtils.getScriptData().map(script => {
                let aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                let path = resolveChromeURL(`chrome://userscripts/content/${script.filename}`);
                path = path.replace("file:///", "").replace(/\//g, '\\\\');
                aFile.initWithPath(path);
                return Object.assign(script, {
                    file: aFile
                });
            });
            function resolveChromeURL (str) {
                const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                try {
                    return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec
                } catch (e) {
                    console.error(e);
                    return ""
                }
            }
        }
        let text = e.shiftKey ? (isZh ? "| 名称 | 版本 | 介绍 | 默 |" : "| Name | Version | Description | Enabled") + " \n| ---- | ---- | ---- | ---- |\n" : "",
            glue = e.shiftKey ? "|" : " ";
        scripts.forEach(item => {
            let line = (e.shiftKey ? [item.url ? `[${item.filename}](${item.url})` : item.filename, item.version, item.description, item.isEnabled ? '✔' : '✘'] : [item.filename, item.url]).join(glue);
            if (e.shiftKey) line = [glue, glue].join(line);
            text += line + '\n';
        })
        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);

        function readFile (aFile, metaOnly) {
            if (!aFile) {
                console.error("No file provided");
                return;
            }
            let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
            stream.init(aFile, 0x01, 0, 0);
            let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
            cvstream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            let content = '', data = {};
            while (cvstream.readString(4096, data)) {
                content += data.value;
                if (metaOnly && (content.indexOf('// ==/UserScript==' || content.indexOf('==/UserStyle=='))) > 0) {
                    break;
                }
            }
            cvstream.close();
            return content.replace(/\r\n?/g, '\n');
        }

        function readScriptInfo (aFile) {
            let header = readFile(aFile, true);
            let def = ['', ''];
            return {
                filename: aFile.leafName || '',
                name: (header.match(/@name\s+(.+)\s*$/im) || def)[1],
                charset: (header.match(/@charset\s+(.+)\s*$/im) || def)[1],
                version: (header.match(/@version\s+(.+)\s*$/im) || def)[1],
                description: (header.match(/@description\s+(.+)\s*$/im) || def)[1],
                homepage: (header.match(/@homepage\s+(.+)\s*$/im) || def)[1],
                homepageURL: (header.match(/@homepageURL\s+(.+)\s*$/im) || def)[1],
                downloadURL: (header.match(/@downloadURL\s+(.+)\s*$/im) || def)[1],
                updateURL: (header.match(/@updateURL\s+(.+)\s*$/im) || def)[1],
                optionsURL: (header.match(/@optionsURL\s+(.+)\s*$/im) || def)[1],
                author: (header.match(/@author\s+(.+)\s*$/im) || def)[1],
                license: (header.match(/@license\s+(.+)\s*$/im) || def)[1],
                licenseURL: (header.match(/@licenseURL\s+(.+)\s*$/im) || def)[1],
            }
        }
    }
}, { insertBefore: 'Copycat-Config-Group' },
// { insertBefore: 'Copycat-Config-Group' }, {
//     'data-l10n-href': 'toolkit/about/aboutSupport.ftl',
//     'data-l10n-id': 'restart-button-label',
//     insertAfter: 'CopyCat-MoreTools-Item',
//     class: 'reload',
//     oncommand: `if (event.shiftKey || (AppConstants.platform == "macosx" ? event.metaKey : event.ctrlKey)) Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`,
//     onclick: `if (event.button === 0) return; Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`
// }, 
{ command: 'fullScreenItem', clone: true, insertAfter: 'CopyCat-MoreTools-Item' }, {
    insertAfter: 'CopyCat-MoreTools-Item'
}, {
    command: 'helpMenu',
    insertAfter: 'CopyCat-MoreTools-Item',
    image: 'chrome://global/skin/icons/help.svg'
}, {
    insertAfter: 'CopyCat-MoreTools-Item'
}])