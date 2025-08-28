// ==UserScript==
// @include         main
// @author          garywill, Ryan
// @name            about:config shortcut menu
// @long-description
// @description
/* 修改 about:config 配置的快捷菜单
默认包含的选项有的是 TabPlus.uc.js 提供的功能：
*/
// @homepageURL     https://garywill.github.io/
// @downloadURL     https://github.com/benzBrake/FirefoxCustomize/raw/refs/heads/master/userChromeJS/136/aboutconfig_menu.uc.js
// @compatibility   Firefox 136
// @onlyonce
// ==/UserScript==

(function (toCssURI, prefs) {
    'use strict';

    // --- 配置区 ---

    // 定义菜单类型: 0=顶部菜单栏中的菜单, 1=可移动的工具栏按钮
    const MENU_TYPE = 0;
    // 定义菜单和图标的常量
    const MENU_ID = MENU_TYPE === 0 ? "aboutconfig-menu" : "aboutconfig-button";
    const MENUPOPUP_ID = "aboutconfig-popup";
    const MENU_LABEL = "about:config 快捷配置";
    const MENU_ICON = "chrome://devtools/skin/images/tool-profiler.svg";
    const USE_MULTI_COLUMN = true; // 是否使用多列菜单，有的系统里会闪屏不知道为什么

    /**
     * 在此数组中添加或修改 about:config 项目。
     * 自带的部分参数需要 TabPlus.uc.js 才能正常工作。
     * 结构说明:
     * {
     *   name: "菜单中显示的名称",
     *   image: "菜单项图标 (可以是 Emoji 或 URL)",
     *   type: prefs.PREF_BOOL / PREF_INT / PREF_STRING (首选项类型),
     *   pref: "about:config 中的首选项名称",
     *   defaultVal: true / false / 具体值 (当 type 为 PREF_BOOL 时，该值只能是 true 或 false),
     *   possibleVals: [ // 可选值列表
     *     { name: "值的显示名称 (可选)", val: "具体的值" },
     *     // ...
     *   ],
     *   warnbadge: true, // 当此值被选中时，在工具栏按钮上显示红色警告标记
     *   sign: '‼️' // 当此值被选中时，在菜单项旁显示的特殊符号，该符号的设计意思可能是会造成漏洞？的选项
     * }
     * "seperator" // 用于在菜单中添加分割线
     */
    const prefItems = [
        {
            name: "关闭最后一个标签页后关闭窗口",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.closeWindowWithLastTab",
            possibleVals: [
                { val: false },
                { val: true }
            ]
        },
        {
            name: "地址栏输入的 URL 在新标签页打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.urlbar.openintab",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "搜索栏查询在新标签页打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.search.openintab",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "书签在新标签页打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.loadBookmarksInTabs",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "历史记录在新标签页打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.loadHistoryInTabs",
            defaultVal: true,
            possibleVals: [
                { val: false },
                { val: true },
            ],
        },
        {
            name: "双击左键关闭标签页",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.closeTabByDblclick",
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ],
        },
        {
            name: "右键单击关闭标签页",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.closeTabByRightClick",
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ],
        }, {
            name: "中键点击链接在后台加载",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.loadInBackground",
            possibleVals: [
                { val: false },
                { val: true },
            ],
        }, {
            name: "图片链接在后台加载",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.loadImageInBackground",
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ],
        }, {
            name: "标签页悬停切换",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_INT,
            pref: "browser.tabs.mouseOverDelayMS",
            defaultVal: 150,
            possibleVals: [
                { val: 0, name: "0 - 关闭" },
                { val: 50, name: "50 - 很快" },
                { val: 150, name: "150 - 稍快(默认)" },
                { val: 200, name: "200 - 正常" },
                { val: 500, name: "500 - 稍慢" }
            ]
        }, {
            name: "新建标签页跟随当前标签页容器",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.openNewTabInContainer",
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "新标签页在当前标签右侧打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.insertAfterCurrent",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "关闭最后一个标签页时关闭窗口",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.closeWindowWithLastTab",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "中键点击书签后保持书签菜单打开",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.bookmarks.openInTabClosesMenu",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "右键新标签按钮打开剪贴板 URL",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.newTabBtn.rightClickLoadFromClipboard",
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "使用鼠标滚轮切换标签页",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "toolkit.tabbox.switchByScrolling",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        }, {
            name: "关闭当前标签后选中左侧标签",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "browser.tabs.selectLeftTabOnClose",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "拖拽标签时显示缩略图",
            image: "resource:///chrome/browser/skin/classic/browser/tab.svg",
            type: prefs.PREF_BOOL,
            pref: "nglayout.enable_drag_images",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        "seperator",
        {
            name: "使用新版侧边栏",
            image: "resource:///chrome/browser/skin/classic/browser/sidebars.svg",
            type: prefs.PREF_BOOL,
            pref: "sidebar.revamp",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "网页区域圆角(新版侧边栏有效)",
            pref: "sidebar.revamp.round-content-area",
            type: prefs.PREF_BOOL,
            image: "resource:///chrome/browser/skin/classic/browser/sidebars.svg",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "窗口开启 Mica 效果",
            pref: "widget.windows.mica",
            image: "resource:///chrome/browser/skin/classic/browser/window.svg",
            type: prefs.PREF_BOOL,
            defaultVal: false,
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "右键菜单开启 Mica 效果",
            pref: "widget.windows.mica.popups",
            image: "resource:///chrome/browser/skin/classic/browser/menu.svg",
            type: prefs.PREF_INT,
            possibleVals: [
                { val: 0, name: "0 - 关闭" },
                { val: 2, name: "2 - 开启 (默认)" },
            ]
        },
        "seperator",
        {
            name: "禁用 IPv6",
            image: "🌐",
            type: prefs.PREF_BOOL,
            pref: "network.dns.disableIPv6",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "DNS over HTTPS 模式",
            image: "🔐",
            type: prefs.PREF_INT,
            pref: "network.trr.mode",
            possibleVals: [
                { name: "0 - 默认", val: 0 },
                { name: "2 - DoH, 回退到普通DNS", val: 2 },
                { name: "3 - 仅 DoH", val: 3 },
                { name: "5 - 仅普通DNS", val: 5 }
            ]
        },
        {
            name: "DoH 服务器",
            image: "🔐",
            type: prefs.PREF_STRING,
            pref: "network.trr.uri",
            possibleVals: [
                { name: "Cloudflare", val: "https://mozilla.cloudflare-dns.com/dns-query" },
                { name: "NextDNS", val: "https://firefox.dns.nextdns.io/" }
            ]
        },
        {
            name: "启用已弃用的 TLS 版本",
            image: "🔐",
            type: prefs.PREF_BOOL,
            pref: "security.tls.version.enable-deprecated",
            possibleVals: [
                { val: false },
                { name: "true ⚠️", val: true, sign: '‼️' },
            ]
        },
        "seperator",
        {
            name: "鼠标滚轮 Y 轴乘数",
            image: "🖱️",
            type: prefs.PREF_INT,
            pref: "mousewheel.default.delta_multiplier_y",
            possibleVals: [
                { val: 250 },
            ]
        },
        {
            name: "系统滚动垂直因子",
            image: "🖱️",
            type: prefs.PREF_INT,
            pref: "mousewheel.system_scroll_override.vertical.factor",
            possibleVals: [
                { val: 250 },
            ]
        },
        "seperator",
        {
            name: "媒体自动播放默认设置",
            image: "▶️",
            type: prefs.PREF_INT,
            pref: "media.autoplay.default",
            possibleVals: [
                { val: 0, name: "0 - 允许" },
                { val: 1, name: "1 - 阻止有声 (推荐)" },
                { val: 5, name: "5 - 全部阻止" },
            ]
        },
        {
            name: "允许扩展后台自动播放",
            image: "▶️",
            type: prefs.PREF_BOOL,
            pref: "media.autoplay.allow-extension-background-pages",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "媒体自动播放阻止策略",
            image: "▶️",
            type: prefs.PREF_INT,
            pref: "media.autoplay.blocking_policy",
            possibleVals: [
                { val: 0, name: "0 - 不阻止" },
                { val: 1, name: "1 - 阻止 (推荐)" },
                { val: 2, name: "2 - 进一步阻止" },
            ]
        },
        {
            name: "WebAudio API",
            image: "▶️",
            type: prefs.PREF_BOOL,
            pref: "dom.webaudio.enabled",
            possibleVals: [
                { val: false },
                { val: true, sign: '‼️', warnbadge: true },
            ]
        },
        "seperator",
        {
            name: "允许网页自定义字体",
            image: "resource:///chrome/browser/skin/classic/browser/characterEncoding.svg",
            style: "fill: #197cf4",
            type: prefs.PREF_INT,
            pref: "browser.display.use_document_fonts",
            possibleVals: [
                { name: "1 - 允许", val: 1 },
                { name: "0 - 禁止", val: 0 },
            ]
        },
        {
            name: "CSS 字体可见性级别",
            style: "fill:#197cf4",
            image: "resource:///chrome/browser/skin/classic/browser/characterEncoding.svg",
            type: prefs.PREF_INT,
            pref: "layout.css.font-visibility.level",
            possibleVals: [
                { val: 1, name: "1 - 仅基础系统字体" },
                { val: 2, name: "2 - 包含可选语言包字体" },
                { val: 3, name: "3 - 包含用户安装的字体" },
            ]
        },
        {
            name: "字体白名单 (font.system.whitelist)",
            style: "fill: #197cf4",
            image: "resource:///chrome/browser/skin/classic/browser/characterEncoding.svg",
            type: prefs.PREF_STRING,
            pref: "font.system.whitelist",
            possibleVals: [
                { val: "" },
                { val: "sans, serif, monospace", },
            ]
        },
        "seperator",
        {
            name: "抵抗指纹追踪 (RFP)",
            image: "🛡️",
            type: prefs.PREF_BOOL,
            pref: "privacy.resistFingerprinting",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "RFP: 自动拒绝无用户输入的画布提示",
            image: "🛡️",
            type: prefs.PREF_BOOL,
            pref: "privacy.resistFingerprinting.autoDeclineNoUserInputCanvasPrompts",
            possibleVals: [
                { val: false },
                { val: true },
            ]
        },
        {
            name: "RFP: Letterboxing (防窗口大小探测)",
            image: "🛡️",
            type: prefs.PREF_BOOL,
            pref: "privacy.resistFingerprinting.letterboxing",
            possibleVals: [
                { val: false },
                { val: true },
            ],
        },
        "seperator",
        {
            name: "接受的语言 (Accept-Languages)",
            image: 'resource:///chrome/browser/skin/classic/browser/characterEncoding.svg',
            style: "fill: #197cf4",
            type: prefs.PREF_STRING,
            pref: "intl.accept_languages",
            defaultVal: "	zh-CN, zh, zh-TW, zh-HK, en-US, en",
            possibleVals: [
                { name: "简体中文默认", val: "	zh-CN, zh, zh-TW, zh-HK, en-US, en" },
                { name: "en-US, en", val: "en-US, en" },
                { name: "优先英文", val: "en-US, en, zh-CN, zh, zh-TW, zh-HK" },
                { name: "优先繁体", val: "zh-TW, zh-HK, zh, en-US, en" }
            ]
        },
        "seperator",
        {
            name: "默认 Referrer 策略",
            image: "🛡️",
            type: prefs.PREF_INT,
            pref: "network.http.referer.defaultPolicy",
            possibleVals: [
                { name: "0 - no-referrer", val: 0 },
                { name: "1 - same-origin", val: 1 },
                { name: "2 - strict-origin-when-cross-origin", val: 2 },
                { name: "3 - no-referrer-when-downgrade", val: 3 },

            ]
        },
        {
            name: "跨域 Referrer 策略",
            image: "🛡️",
            type: prefs.PREF_INT,
            pref: "network.http.referer.XOriginPolicy",
            possibleVals: [
                { name: "0 - 总是发送", val: 0 },
                { name: "1 - 仅当主域名相同时发送", val: 1 },
                { name: "2 - 仅当同源时发送", val: 2 },
            ]
        },
        {
            name: "Referrer 修剪策略",
            image: "🛡️",
            type: prefs.PREF_INT,
            pref: "network.http.referer.trimmingPolicy",
            possibleVals: [
                { name: "0 - 发送完整 URL", val: 0 },
                { name: "1 - 移除查询字符串", val: 1 },
                { name: "2 - 仅发送源", val: 2 },
            ]
        },
        {
            name: "跨域 Referrer 修剪策略",
            image: "🛡️",
            type: prefs.PREF_INT,
            pref: "network.http.referer.XOriginTrimmingPolicy",
            possibleVals: [
                { name: "0 - 发送完整 URL", val: 0 },
                { name: "1 - 移除查询字符串", val: 1 },
                { name: "2 - 仅发送源", val: 2 },
            ]
        },
        "seperator",
        {
            name: "开发者工具连接时需要确认",
            image: "💻",
            type: prefs.PREF_BOOL,
            pref: "devtools.debugger.prompt-connection",
            possibleVals: [
                { val: true },
                { name: "false ⚠️", val: false, sign: '‼️' },
            ]
        },
    ];


    // --- 初始化和模块加载 ---
    const { CustomizableUI } = globalThis || ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs");
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);


    // --- CSS 样式 ---
    let mainCss = `
        #${MENU_ID} {
            --menuitem-icon: url("${MENU_ICON}") !important;
        }
        #${MENU_ID} .toolbarbutton-badge {
            background-color: #009f00 !important;
        }
        menu#${MENU_ID} {
            position: relative;
            &:before {
                content: "!";
                font-size: 10px;
                color: white;
                background-color: #009f00;
                position: absolute;
                top: 2px;
                left: calc(1em + 14px);
                height: 11px;
                padding: 1px 4px;
                box-shadow: 0 1px 0 hsla(0, 100%, 100%, .2) inset, 0 -1px 0 hsla(0, 0%, 0%, .1) inset, 0 1px 0 hsla(206, 50%, 10%, .2);
                line-height: 10px;
                text-align: center;
            }
        }
        #${MENUPOPUP_ID} {
            max-width: calc(100vw - 20px);
            max-height: calc(100vh - 129px);
            & > menu {
                position: relative;

    
                padding-inline-start: 36px !important;
                &:before {
                    content: attr(image-emoji);
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                    position: absolute;
                    top: 50%;
                    left: 1em;
                    transform: translateY(-50%);
                    background-image: var(--menu-image);
                    background-size: 16px 16px;
                    background-repeat: no-repeat;
                    background-position: center;
                }
                

                & > .menu-icon {
                    display: none !important;
                }
            }
        }
        .aboutconfig-reset-menuitem {
            fill: #ff5033;
            --menuitem-icon: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xKSI+CiAgPHBhdGggZD0iTTI0IDRDMTguNTU2MjQxIDQgMTMuNjExMTA1IDYuMTg5MzEwNyAxMCA5LjczMDQ2ODhMMTAgOCBBIDIuMDAwMiAyLjAwMDIgMCAwIDAgNy45NzA3MDMxIDUuOTcyNjU2MiBBIDIuMDAwMiAyLjAwMDIgMCAwIDAgNiA4TDYgMTUgQSAyLjAwMDIgMi4wMDAyIDAgMCAwIDggMTdMMTUgMTcgQSAyLjAwMDIgMi4wMDAyIDAgMSAwIDE1IDEzTDEyLjM4MjgxMiAxM0MxNS4yOTU1NjYgOS45MjE0OTIxIDE5LjQxMjc0MyA4IDI0IDhDMzIuODYwMDg5IDggNDAgMTUuMTM5OTExIDQwIDI0QzQwIDMyLjg2MDA4OSAzMi44NjAwODkgNDAgMjQgNDAgQSAyLjAwMDIgMi4wMDAyIDAgMSAwIDI0IDQ0QzM1LjAyMTkxMSA0NCA0NCAzNS4wMjE5MTEgNDQgMjRDNDQgMTIuOTc4MDg5IDM1LjAyMTkxMSA0IDI0IDQgeiBNIDYgMjIgQSAyLjAwMDIgMi4wMDAyIDAgMSAwIDYgMjYgQSAyLjAwMDIgMi4wMDAyIDAgMSAwIDYgMjIgeiBNIDcuMzY5MTQwNiAyOC44ODg2NzJMNS44NjMyODEyIDI5LjU3NDIxOUw1LjM4ODY3MTkgMzEuMTYwMTU2TDYuMjcxNDg0NCAzMi41NjA1NDdMNy4zNjkxNDA2IDMyLjg4ODY3Mkw4Ljg3Njk1MzEgMzIuMjAzMTI1TDkuMzUxNTYyNSAzMC42MTcxODhMOC40Njg3NSAyOS4yMTY3OTdMNy4zNjkxNDA2IDI4Ljg4ODY3MiB6IE0gMTEuMjc3MzQ0IDM0LjcyMDcwM0w5Ljc2OTUzMTIgMzUuNDA2MjVMOS4yOTQ5MjE5IDM2Ljk5MjE4OEwxMC4xNzc3MzQgMzguMzkyNTc4TDExLjI3NzM0NCAzOC43MjA3MDNMMTIuNzgzMjAzIDM4LjAzNzEwOUwxMy4yNTc4MTIgMzYuNDUxMTcyTDEyLjM3NSAzNS4wNTA3ODFMMTEuMjc3MzQ0IDM0LjcyMDcwMyB6IE0gMTcuMTA3NDIyIDM4LjYzMjgxMkwxNS41OTk2MDkgMzkuMzE4MzU5TDE1LjEyNSA0MC45MDQyOTdMMTYuMDA3ODEyIDQyLjMwNDY4OEwxNy4xMDc0MjIgNDIuNjMyODEyTDE4LjYxMzI4MSA0MS45NDcyNjZMMTkuMDg3ODkxIDQwLjM2MTMyOEwxOC4yMDUwNzggMzguOTYwOTM4TDE3LjEwNzQyMiAzOC42MzI4MTIgeiIvPgo8L3N2Zz4=) !important;
        }
        @media -moz-pref("userChromeJS.aboutconfig.warn_badge") {
            #${MENU_ID} .toolbarbutton-badge {
                background-color: #ff5033 !important;
            }
            menu#${MENU_ID}:before {
                background-color: #ff5033 !important;
            }
        }
    `;
    const mainCssUri = toCssURI(mainCss);

    // --- 核心功能函数 ---

    /**
     * 判断字符串是否为 Emoji。
     * @param {string} str - 需要检查的字符串。
     * @returns {boolean} 如果是 Emoji 则返回 true。
     */
    function isEmoji (str) {
        if (!str || typeof str !== 'string') return false;
        // 简单的 Emoji 正则表达式，覆盖大部分常见场景。
        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
        // 检查是否匹配且长度较短，避免误判。
        return emojiRegex.test(str) && str.length <= 5;
    }

    /**
     * 将首选项的值转换为用于显示的字符串。
     * @param {object} item - prefItems 中的配置对象。
     * @param {string|number|boolean} val - 首选项的值。
     * @returns {string} 用于显示的字符串。
     */
    function prefValToDisplay (item, val) {
        if (val === null) return "null";
        if (item.type === prefs.PREF_STRING) return `'${val.toString()}'`;
        return val.toString();
    }

    /**
     * 获取指定首选项的当前用户设置值。
     * @param {object} item - prefItems 中的配置对象。
     * @returns {string|number|boolean|null} 当前值，如果用户未设置则返回 null。
     */
    function getItemCurrentVal (item) {
        if (!prefs.prefHasUserValue(item.pref)) {
            return null; // 用户未修改，使用默认值
        }
        try {
            switch (item.type) {
                case prefs.PREF_BOOL: return prefs.getBoolPref(item.pref);
                case prefs.PREF_INT: return prefs.getIntPref(item.pref);
                case prefs.PREF_STRING: return prefs.getStringPref(item.pref);
                default: return null;
            }
        } catch (e) {
            console.error(`[about:config shortcut] 获取首选项 "${item.pref}" 的值时出错:`, e);
            return null;
        }
    }

    /**
     * 获取指定首选项的默认值。
     * @param {object} item - prefItems 中的配置对象。
     * @returns {string|number|boolean|null|undefined} 默认值。如果不存在默认值则为 null。
     */
    function getItemDefaultVal (item) {
        if (item.defaultVal) return item.defaultVal;
        try {
            const defaultBranch = prefs.getDefaultBranch(item.pref);
            switch (item.type) {
                case prefs.PREF_BOOL: return defaultBranch.getBoolPref('');
                case prefs.PREF_INT: return defaultBranch.getIntPref('');
                case prefs.PREF_STRING: return defaultBranch.getStringPref('');
            }
        } catch (e) {
            // 没有默认值是正常情况
            return null;
        }
        return undefined;
    }

    /**
     * 设置指定首选项的值。
     * @param {object} item - prefItems 中的配置对象。
     * @param {string|number|boolean} newVal - 要设置的新值。
     */
    function setItemPrefVal (item, newVal) {
        try {
            switch (item.type) {
                case prefs.PREF_BOOL: prefs.setBoolPref(item.pref, newVal); break;
                case prefs.PREF_INT: prefs.setIntPref(item.pref, newVal); break;
                case prefs.PREF_STRING: prefs.setStringPref(item.pref, newVal); break;
            }
        } catch (e) {
            console.error(`[about:config shortcut] 设置首选项 "${item.pref}" 的值时出错:`, e);
        }
        updateBadge();
    }

    /**
     * 切换警告角标的显示状态。
     * @param {boolean} show - 是否显示警告角标。
     */
    function toggleWarnBadge (show) {
        Services.prefs.setBoolPref("userChromeJS.aboutconfig.warn_badge", show);
    }

    /**
     * 检查并更新工具栏按钮上的警告角标。
     */
    function updateBadge () {

        let showWarn = false;
        for (const item of prefItems) {
            if (typeof item === "string") continue;

            // 获取实际生效的值（用户设置值或默认值）
            const effVal = prefs.prefHasUserValue(item.pref)
                ? getItemCurrentVal(item)
                : getItemDefaultVal(item);

            // 检查当前生效值是否有警告标记
            const hasWarn = item.possibleVals.some(pv =>
                pv.val === effVal && pv.warnbadge === true
            );

            if (hasWarn) {
                showWarn = true;
                break;
            }
        }

        toggleWarnBadge(showWarn);
    }


    /**
     * 创建完整的菜单弹出层 (menupopup)。
     * @param {Document} doc - 当前窗口的 document 对象。
     * @returns {XULElement} 创建好的 menupopup 元素。
     */
    function createMenuPopup (doc) {
        const mainPopup = doc.createXULElement("menupopup");
        mainPopup.id = MENUPOPUP_ID;
        mainPopup.onclick = (event) => event.preventDefault(); // 防止点击菜单项时关闭整个菜单

        prefItems.forEach((item, itemIndex) => {
            // 添加分割线
            if (item === "seperator" || (!item.name && !item.pref)) {
                mainPopup.appendChild(doc.createXULElement('menuseparator'));
                return;
            }

            // 创建主菜单项 (作为子菜单的容器)
            const menu = doc.createXULElement("menu");
            menu.label = item.name || item.pref;
            menu.id = `aboutconfig_menu_${itemIndex}`;
            menu.className = 'menuitem-iconic';
            if (item.image) {
                if (isEmoji(item.image)) {
                    menu.setAttribute('image-emoji', item.image);
                } else {
                    menu.style.setProperty('--menu-image', `url("${item.image}")`);
                }
            }
            if (item.style && (typeof item.style === 'string' || typeof item.style === 'object')) {
                let style = item.style;
                if (typeof style === 'string') {
                    const parsedStyle = style.split(';').reduce((acc, rule) => {
                        const match = rule.match(/([^:]+):\s*(.+)/);
                        if (match) {
                            acc[match[1].trim()] = match[2].trim();
                        }
                        return acc;
                    }, {});
                    style = parsedStyle;
                }
                for (const [prop, val] of Object.entries(style)) {
                    menu.style.setProperty(prop, val);
                }
            }


            // 创建子菜单弹出层
            const subPopup = doc.createXULElement("menupopup");
            subPopup.id = `aboutconfig_menupopup_${itemIndex}`;
            subPopup.className = 'menuitem-iconic';

            // 为每个可能的值创建单选菜单项
            item.possibleVals.forEach((pv, valIndex) => {
                const menuItem = doc.createXULElement("menuitem");
                menuItem.id = `aboutconfig_menu_${itemIndex}__${valIndex}`;
                menuItem.label = pv.name || prefValToDisplay(item, pv.val);
                menuItem.setAttribute('type', 'radio');
                menuItem.tooltipText = prefValToDisplay(item, pv.val);
                if (pv.sign) {
                    menuItem.label += `　　${pv.sign}`;
                }
                menuItem.addEventListener('click', () => setItemPrefVal(item, pv.val));
                subPopup.appendChild(menuItem);
            });

            // 添加子菜单分割线
            subPopup.appendChild(doc.createXULElement('menuseparator'));

            // 创建重置按钮
            const defaultVal = getItemDefaultVal(item);
            const defaultValDisplay = (defaultVal !== null && defaultVal !== undefined)
                ? prefValToDisplay(item, defaultVal)
                : '(默认值不存在)';

            const resetItem = doc.createXULElement("menuitem");
            resetItem.id = `aboutconfig_menu_${itemIndex}__default`;
            resetItem.label = `重置: ${defaultValDisplay}`;
            resetItem.className = 'menuitem-iconic aboutconfig-reset-menuitem';
            resetItem.tooltipText = `将 ${item.pref} 恢复为默认值`;
            resetItem.addEventListener('click', () => {
                prefs.clearUserPref(item.pref);
                updateBadge();
            });
            subPopup.appendChild(resetItem);

            menu.appendChild(subPopup);
            mainPopup.appendChild(menu);
        });

        return mainPopup;
    }

    /**
     * 当菜单显示时，动态更新所有菜单项的状态。
     * @param {XULElement} popupMenu - 正在显示的 menupopup 元素。
     */
    function populateMenuOnShow (popupMenu) {
        prefItems.forEach((item, itemIndex) => {
            if (item === "seperator") return;

            const menu = popupMenu.querySelector(`#aboutconfig_menu_${itemIndex}`);
            if (!menu) return;

            const currentVal = getItemCurrentVal(item);
            const defaultVal = getItemDefaultVal(item);
            const isModified = prefs.prefHasUserValue(item.pref);

            // 更新主菜单项标签和样式
            let label = item.name || item.pref;
            const displayVal = (currentVal !== null) ? currentVal : (defaultVal !== undefined ? defaultVal : '');

            if (isModified) {
                if (item.type === prefs.PREF_BOOL) {
                    label += `　　[${displayVal ? 'T' : 'F'}]`;
                } else if (item.type === prefs.PREF_STRING) {
                    const shortVal = displayVal.length > 8 ? `${displayVal.substring(0, 6)}..` : displayVal;
                    label += `　　[${shortVal}]`;
                } else {
                    label += `　　[${displayVal}]`;
                }
                menu.style.fontWeight = "bold";
            } else {
                menu.style.fontWeight = "";
            }

            menu.label = label;
            menu.tooltipText = `Pref: ${item.pref}\n当前值: ${prefValToDisplay(item, displayVal)}`;

            // 更新子菜单项的选中状态和特殊标记
            item.possibleVals.forEach((pv, valIndex) => {
                const menuItem = popupMenu.querySelector(`#aboutconfig_menu_${itemIndex}__${valIndex}`);
                if (!menuItem) return;

                const isChecked = (isModified && currentVal === pv.val) || (!isModified && defaultVal === pv.val);
                menuItem.setAttribute("checked", isChecked);

                if (isChecked && pv.sign) {
                    menu.label += `　${pv.sign}`;
                }
            });
        });
    }

    function enhancePopup (event) {
        const menupopup = event.originalTarget;
        if (menupopup.id !== MENUPOPUP_ID) return;
        let arrowscrollBox = menupopup.scrollBox;
        let scrollbox = arrowscrollBox.scrollbox;
        scrollbox.style.setProperty("overflow-y", "auto", "important");
        scrollbox.style.setProperty("margin-top", "0", "important");
        scrollbox.style.setProperty("margin-bottom", "0", "important");
        scrollbox.style.setProperty("padding-top", "0", "important");
        scrollbox.style.setProperty("padding-bottom", "0", "important");
        arrowscrollBox._scrollButtonUp.style.display = "none";
        arrowscrollBox._scrollButtonDown.style.display = "none";
        if (USE_MULTI_COLUMN) {
            menupopup.style.maxWidth = "calc(100vw - 20px)";
            Object.assign(scrollbox.style, {
                minHeight: "21px",
                height: "auto",
                display: "flex",
                flexFlow: "column wrap",
                // overflow: "-moz-hidden-unscrollable",
                width: "unset",
                scrollSnapType: "x mandatory",
            });
            arrowscrollBox.style.width = "auto";
            arrowscrollBox.style.maxHeight = "calc(100vh - 129px)";
            let slot = scrollbox.querySelector('slot');
            slot.style.display = "contents";
            let maxWidth = calcWidth(-129, event.originalTarget.ownerGlobal);
            if (maxWidth < scrollbox.scrollWidth) {
                scrollbox.style.setProperty("overflow-x", "auto", "important");
                scrollbox.style.setProperty("width", maxWidth + "px");
            } else {
                scrollbox.style.setProperty("width", scrollbox.scrollWidth + "px", "important");
            }
            bindWheelEvent(scrollbox);

            function bindWheelEvent (item) {
                if (item._bmMultiColumnWheelHandler) return;
                const wheelHandler = (e) => {
                    e.preventDefault();
                    const delta = e.deltaY || e.detail || e.wheelDelta;
                    item.scrollLeft += delta * 50;
                };
                item.addEventListener('wheel', wheelHandler, { passive: false });
                item._bmMultiColumnWheelHandler = wheelHandler;
            }
        }
    }

    function calcWidth (offset, win) {
        if (typeof offset == 'number') {
            return win.innerWidth + offset;
        } else if (typeof offset == 'string') {
            if (/^-?\d+px$/.test(offset.trim())) {
                return win.innerWidth + parseInt(offset.trim().match(/^-?(\d+)px$/)[1]);
            }
        }
        throw new Error('Invalid offset value');
    }

    // --- UI 创建与初始化 ---

    function init () {
        // 注册主样式表
        sss.loadAndRegisterSheet(mainCssUri, sss.AGENT_SHEET);

        if (MENU_TYPE === 1) { // 工具栏按钮模式
            CustomizableUI.createWidget({
                id: MENU_ID,
                type: "custom",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                removable: true,
                onBuild: function (doc) {
                    const btn = doc.createXULElement('toolbarbutton');
                    btn.id = MENU_ID;
                    btn.label = MENU_LABEL;
                    btn.tooltipText = MENU_LABEL;
                    btn.type = 'menu';
                    btn.className = 'toolbarbutton-1 chromeclass-toolbar-additional';
                    btn.setAttribute("badged", "true");
                    btn.setAttribute("badge", "!");

                    const popup = createMenuPopup(doc);
                    btn.appendChild(popup);

                    // 每次显示菜单时更新状态
                    popup.addEventListener('popupshowing', function (event) {
                        populateMenuOnShow(this);
                        setTimeout(() => {
                            enhancePopup(event);
                        }, 10);
                    });

                    // 中键点击打开 about:config
                    btn.onclick = function (event) {
                        if (event.button === 1) {
                            const win = Services.wm.getMostRecentWindow("navigator:browser");
                            if (win) {
                                win.gBrowser.addTrustedTab('about:config');
                            }
                        }
                    };

                    btn.onmouseover = function () {
                        const rect = btn.getBoundingClientRect();
                        // 获取窗口的宽度和高度
                        const windowWidth = btn.ownerGlobal.innerWidth;
                        const windowHeight = btn.ownerGlobal.innerHeight;

                        const x = rect.left + rect.width / 2;  // 按钮的水平中心点
                        const y = rect.top + rect.height / 2;  // 按钮的垂直中心点

                        if (x < windowWidth / 2 && y < windowHeight / 2) {
                            popup.removeAttribute("position");
                        } else if (x >= windowWidth / 2 && y < windowHeight / 2) {
                            popup.setAttribute("position", "after_end");
                        } else if (x >= windowWidth / 2 && y >= windowHeight / 2) {
                            popup.setAttribute("position", "before_end");
                        } else {
                            popup.setAttribute("position", "before_start");
                        }
                    }

                    return btn;
                }
            });
        } else { // 顶部菜单栏模式
            const menu = document.createXULElement('menu');
            menu.id = MENU_ID;
            menu.setAttribute('label', MENU_LABEL);
            menu.setAttribute('class', 'menu-iconic');

            const popup = createMenuPopup(document);
            menu.appendChild(popup);

            popup.addEventListener('popupshowing', function (event) {
                populateMenuOnShow(this);
                setTimeout(() => {
                    enhancePopup(event);
                }, 10);
            });

            // 插入到 "工具" -> "开发者工具" 分割线之前
            const devToolsSeparator = document.getElementById('devToolsSeparator');
            if (devToolsSeparator) {
                devToolsSeparator.before(menu);
            }
        }

        // 初始化时检查一次角标状态
        updateBadge();
    }

    // 延迟执行以确保UI已准备就绪
    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

})(s => Services.io.newURI(`data:text/css,${encodeURIComponent(s)}`), Services.prefs);

