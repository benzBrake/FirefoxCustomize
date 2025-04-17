// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.2.8
// @async           true
// @compatibility   Firefox 135
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            0.2.8 修复样式问题
// @note            0.2.7 修复上移功能，去除一部分无用代码
// @note            0.2.6 适配 Firefox 135
// @note            0.2.5 BrowserOpenAddonsMgr改名，适配 userChrome.js Loader 的调整
// @note            0.2.4 给工具栏扩展图标右键菜单增加禁用扩展功能
// @note            0.2.3 给工具栏扩展图标右键菜单增加复制 ID 功能
// @note            0.2.2 转换 unified-extensions-item 的图标为 CSS，方便使用 userChrome.css 覆盖图标，修复向上/向下按钮一处无影响报错以及显示问题，修复部分扩展无法打开设置页面的问题，调整几个图标的尺寸
// @note            0.2.1 增加从工具栏隐藏按钮
// @note            0.2.0 增加复制 ID 功能
// @note            0.1.9 新增固定到工具栏，上移，下移按钮，调整面板宽度
// @note            0.1.8 fx115
// @note            0.1.7 修复禁用所有扩展，修复 destroy 报错，增加右键图标快速打开扩展管理页面
// @note            0.1.6 Firefox 109 补全快速启用禁用和快速选项功能
// @note            0.1.5 仅支持 Firefox 109 + 半成品
// @note            0.1.4 Fx 107 Tempoarily compat for legacy addons & disabled addons
// @note            参考了 https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    if (window.unifiedExtensionsEnhance) {
        window.unifiedExtensionsEnhance.destroy();
    }

    const COMPACT_LIST = true;

    const BUTTONS = {
        MOVE_UP: { label: "上移", tooltiptext: "上移", "uni-action": "up", closemenu: "none", class: "unified-extensions-item-up subviewbutton subviewbutton-iconic" },
        MOVE_DOWN: { label: "下移", tooltiptext: "下移", "uni-action": "down", closemenu: "none", class: "unified-extensions-item-down subviewbutton subviewbutton-iconic" },
        PIN_TO_TOOLBAR: { label: "在工具栏中显示", tooltiptext: "在工具栏中显示", "uni-action": "pin", class: "unified-extensions-item-pin subviewbutton subviewbutton-iconic" },
        UNPIN_FROM_TOOLBAR: { label: "从工具栏移除", tooltiptext: "从工具栏移除", "uni-action": "unpin", class: "unified-extensions-item-unpin subviewbutton subviewbutton-iconic" },
        PLUGIN_OPTION: { label: "选项", tooltiptext: "扩展选项", "uni-action": "option", class: "unified-extensions-item-option subviewbutton subviewbutton-iconic" },
        ENABLE_ADDON: { label: "启用", tooltiptext: "启用扩展", "uni-action": "enable", closemenu: "none", class: "unified-extensions-item-enable subviewbutton subviewbutton-iconic" },
        DISABLE_ADDON: { label: "禁用", tooltiptext: "禁用扩展", closemenu: "none", "uni-action": "disable", class: "unified-extensions-item-disable subviewbutton subviewbutton-iconic" },
        ENABLE_ALL_ADDONS: { id: 'unified-extensions-enable-all', class: "subviewbutton", "uni-action": "enable-all", "no-icon": true, label: "启用所有扩展" },
        DISABLE_ALL_ADDONS: { id: 'unified-extensions-disable-all', class: "subviewbutton", "uni-action": "disable-all", "no-icon": true, label: "禁用所有扩展" },
    };


    const MENUS = {
        COPY_ID: { "uni-action": "copy-id", label: "复制 ID" },
        DISABLE_ADDON: { "uni-action": "disable", label: "禁用扩展" }
    };

    const createElWithClickEvent = (doc, tag, attrs) => {
        const el = doc.createXULElement(tag);
        Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
        el.classList.add("ue-btn");
        el.addEventListener("click", window.unifiedExtensionsEnhance, false);
        return el;
    };

    window.unifiedExtensionsEnhance = {
        get appVersion () {
            delete this.appVersion;
            return this.appVersion = Services.appinfo.version.split(".")[0];
        },
        get sss () {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        get showDisabled () {
            return Services.prefs.getBoolPref("extensions.unifiedExtensions.showDisabled", true);
        },
        STYLE: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            #movable-unified-extensions {
                list-style-image: url("chrome://mozapps/skin/extensions/extension.svg");
            }
            #unified-extensions-panel toolbaritem.unified-extensions-item {
                max-width: unset;
            }
            panelview#unified-extensions-view {
                width: 35em;
            }
            panelview#unified-extensions-view .toolbaritem-combined-buttons {
                display: flex;
            }
            panelview#unified-extensions-view .toolbaritem-combined-buttons > .subviewbutton {
                -moz-box-pack: start;
                justify-content: flex-start;
            }
            panelview#unified-extensions-view .toolbaritem-combined-buttons > .subviewbutton.webextension-browser-action {
                margin: var(--arrowpanel-menuitem-margin);
            }
            panelview#unified-extensions-view :is(.unified-extensions-item-name, .unified-extensions-item-message) {
                padding-inline-start: 0;
            }
            
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action  {
                margin: var(--arrowpanel-menuitem-margin);
                flex-grow: 1;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action:hover {
                background-color: var(--panel-item-hover-bgcolor) !important;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action > .toolbarbutton-badge-stack {
                margin-inline-end: 6px;
                padding-left: 0;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action:hover > .toolbarbutton-badge-stack {
                background-color: transparent !important;
            }
            unified-extensions-item > .unified-extensions-item-action-button {
                flex: 1;
            }
            unified-extensions-item.addon-disabled .unified-extensions-item-contents {
                font-style: italic;
                color: Gray;
            }
            #unified-extensions-view .addon-no-options .unified-extensions-item-option {
                visibility: hidden;
            }
            #unified-extensions-view .unified-extensions-item-menu-button {
                margin-inline-end: 0;
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTI0My4yIDUxMm0tODMuMiAwYTEuMyAxLjMgMCAxIDAgMTY2LjQgMCAxLjMgMS4zIDAgMSAwLTE2Ni40IDBaIiBwLWlkPSIzNjAxIj48L3BhdGg+PHBhdGggZD0iTTUxMiA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiIgcC1pZD0iMzYwMiI+PC9wYXRoPjxwYXRoIGQ9Ik03ODAuOCA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiI+PC9wYXRoPjwvc3ZnPg==");
            }
            #unified-extensions-view .unified-extensions-item-up {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMikiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMTAuODI4bC00Ljk1IDQuOTUtMS40MTQtMS40MTRMMTIgOGw2LjM2NCA2LjM2NC0xLjQxNCAxLjQxNHoiLz48L3N2Zz4=")
            }
            #unified-extensions-view .unified-extensions-item-down {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMikiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMTMuMTcybDQuOTUtNC45NSAxLjQxNCAxLjQxNEwxMiAxNiA1LjYzNiA5LjYzNiA3LjA1IDguMjIyeiIvPjwvc3ZnPg==")
            }
            #unified-extensions-view .unified-extensions-item-pin {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiBmaWxsPSJjb250ZXh0LWZpbGwiIHRyYW5zZm9ybT0ic2NhbGUoMS4xLCAxLjIpIj48cGF0aCBkPSJNMTIuMDAwMyAzQzE3LjM5MjQgMyAyMS44Nzg0IDYuODc5NzYgMjIuODE4OSAxMkMyMS44Nzg0IDE3LjEyMDIgMTcuMzkyNCAyMSAxMi4wMDAzIDIxQzYuNjA4MTIgMjEgMi4xMjIxNSAxNy4xMjAyIDEuMTgxNjQgMTJDMi4xMjIxNSA2Ljg3OTc2IDYuNjA4MTIgMyAxMi4wMDAzIDNaTTEyLjAwMDMgMTlDMTYuMjM1OSAxOSAxOS44NjAzIDE2LjA1MiAyMC43Nzc3IDEyQzE5Ljg2MDMgNy45NDgwMyAxNi4yMzU5IDUgMTIuMDAwMyA1QzcuNzY0NiA1IDQuMTQwMjIgNy45NDgwMyAzLjIyMjc4IDEyQzQuMTQwMjIgMTYuMDUyIDcuNzY0NiAxOSAxMi4wMDAzIDE5Wk0xMi4wMDAzIDE2LjVDOS41MTQ5OCAxNi41IDcuNTAwMjYgMTQuNDg1MyA3LjUwMDI2IDEyQzcuNTAwMjYgOS41MTQ3MiA5LjUxNDk4IDcuNSAxMi4wMDAzIDcuNUMxNC40ODU1IDcuNSAxNi41MDAzIDkuNTE0NzIgMTYuNTAwMyAxMkMxNi41MDAzIDE0LjQ4NTMgMTQuNDg1NSAxNi41IDEyLjAwMDMgMTYuNVpNMTIuMDAwMyAxNC41QzEzLjM4MSAxNC41IDE0LjUwMDMgMTMuMzgwNyAxNC41MDAzIDEyQzE0LjUwMDMgMTAuNjE5MyAxMy4zODEgOS41IDEyLjAwMDMgOS41QzEwLjYxOTYgOS41IDkuNTAwMjYgMTAuNjE5MyA5LjUwMDI2IDEyQzkuNTAwMjYgMTMuMzgwNyAxMC42MTk2IDE0LjUgMTIuMDAwMyAxNC41WiIvPjwvc3ZnPg==")
            }
            #unified-extensions-view .unified-extensions-item-unpin > .toolbarbutton-icon {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMSwgMS4yKSI+DQogIDxwYXRoIGQ9Im0xMi4wMDAzLDNjNS4zOTIxLDAgOS44NzgxLDMuODc5NzYgMTAuODE4Niw5Yy0wLjk0MDUsNS4xMjAyIC01LjQyNjUsOSAtMTAuODE4Niw5Yy01LjM5MjE4LDAgLTkuODc4MTUsLTMuODc5OCAtMTAuODE4NjYsLTljMC45NDA1MSwtNS4xMjAyNCA1LjQyNjQ4LC05IDEwLjgxODY2LC05em0wLDE2YzQuMjM1NiwwIDcuODYsLTIuOTQ4IDguNzc3NCwtN2MtMC45MTc0LC00LjA1MTk3IC00LjU0MTgsLTcgLTguNzc3NCwtN2MtNC4yMzU3LDAgLTcuODYwMDgsMi45NDgwMyAtOC43Nzc1Miw3YzAuOTE3NDQsNC4wNTIgNC41NDE4Miw3IDguNzc3NTIsN3ptMCwtMi41Yy0yLjQ4NTMyLDAgLTQuNTAwMDQsLTIuMDE0NyAtNC41MDAwNCwtNC41YzAsLTIuNDg1MjggMi4wMTQ3MiwtNC41IDQuNTAwMDQsLTQuNWMyLjQ4NTIsMCA0LjUsMi4wMTQ3MiA0LjUsNC41YzAsMi40ODUzIC0yLjAxNDgsNC41IC00LjUsNC41em0wLC0yYzEuMzgwNywwIDIuNSwtMS4xMTkzIDIuNSwtMi41YzAsLTEuMzgwNyAtMS4xMTkzLC0yLjUgLTIuNSwtMi41Yy0xLjM4MDcsMCAtMi41MDAwNCwxLjExOTMgLTIuNTAwMDQsMi41YzAsMS4zODA3IDEuMTE5MzQsMi41IDIuNTAwMDQsMi41eiIvPg0KICA8bGluZSBzdHJva2Utd2lkdGg9IjIiIHkyPSIyMy4xMzc4NSIgeDI9IjIzLjIwMDM1IiB5MT0iMC42Mzc1IiB4MT0iMC43IiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPg0KPC9zdmc+") !important;
            }
            #unified-extensions-view .unified-extensions-item-option {
                list-style-image: url("chrome://global/skin/icons/settings.svg");
            }
            #unified-extensions-view .unified-extensions-item-enable {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTMuNDU1IDFBMS41MDIgMS41MDIgMCAwMDIgMi41djExYTEuNSAxLjUgMCAwMDIuMjIzIDEuMzEzbDkuOTk4LTUuNWExLjQ5NyAxLjQ5NyAwIDAwMC0yLjYyNmwtOS45OTgtNS41QTEuNDgzIDEuNDgzIDAgMDAzLjQ1NSAxem0uMDMgMWEuNDk0LjQ5NCAwIDAxLjI1NS4wNjNsOS45OTggNS41YS41LjUgMCAwMTAgLjg3NWwtOS45OTggNS41QS41LjUgMCAwMTMgMTMuNXYtMTFhLjUuNSAwIDAxLjQ4NC0uNXoiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSIvPjwvc3ZnPg==")
            }
            #unified-extensions-view .unified-extensions-item-disable {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNMCAwaDI0djI0SDBWMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTIgMjMuNjU2QzUuNTYyIDIzLjY1Ni4zNDQgMTguNDM4LjM0NCAxMlM1LjU2Mi4zNDQgMTIgLjM0NCAyMy42NTYgNS41NjIgMjMuNjU2IDEyIDE4LjQzOCAyMy42NTYgMTIgMjMuNjU2em0wLTIuMzMxYTkuMzI1IDkuMzI1IDAgMTAwLTE4LjY1IDkuMzI1IDkuMzI1IDAgMDAwIDE4LjY1ek04LjUwMyA4LjUwM2g2Ljk5NHY2Ljk5NEg4LjUwM1Y4LjUwM3oiLz48L3N2Zz4=")
            }
            #unified-extensions-area .unified-extensions-item-unpin,
            #unified-extensions-view .unified-extensions-item:not(.addon-disabled) .unified-extensions-item-enable,
            #unified-extensions-view .unified-extensions-item.addon-disabled .unified-extensions-item-disable,
            #unified-extensions-view .unified-extensions-item.addon-no-option-page .unified-extensions-item-option,
            .unified-extensions-item-option > .toolbarbutton-text,
            .unified-extensions-item-enable > .toolbarbutton-text,
            .unified-extensions-item-disable > .toolbarbutton-text,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-pin,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-option,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-enable,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-disable,
            unified-extensions-item.addon-disabled .unified-extensions-item-option,
            unified-extensions-item:not(.addon-disabled) .unified-extensions-item-pin
            unified-extensions-item.addon-disabled .unified-extensions-item-unpin,
            unified-extensions-item.addon-no-option-page .unified-extensions-item-option,
            unified-extensions-item.addon-no-unpin .unified-extensions-item-unpin {
                display: none;
            }
            unified-extensions-item.addon-disabled .unified-extensions-item-pin,
            .unified-extensions-list :is(.unified-extensions-item-up, .unified-extensions-item-down) {
                opacity: .2;
                pointer-events: none;
            }
            toolbarbutton.ue-btn:not([no-icon=true]) {
                padding: calc(var(--arrowpanel-menuitem-margin-inline) - 1px) var(--arrowpanel-menuitem-margin-inline);
                padding-inline-end: 0;
                box-shadow: none !important;
                outline: none !important;
                background-color: transparent;
            }
            toolbarbutton.ue-btn:not([no-icon=true]):hover {
                background-color: transparent !important;
            }
            toolbarbutton.ue-btn:not([no-icon=true]) > .toolbarbutton-icon {
                box-sizing: content-box;
                padding: var(--arrowpanel-menuitem-padding-inline);
                border: 1px solid transparent;
                border-radius: var(--arrowpanel-menuitem-border-radius);
            }
            toolbarbutton.ue-btn:not([no-icon=true]):hover > .toolbarbutton-icon {
                background-color: var(--uei-button-hover-bgcolor);
            }
            toolbarbutton.ue-btn:not([no-icon=true]):active > .toolbarbutton-icon {
                background-color: var(--uei-button-active-bgcolor);
            }
            .unified-extensions-list unified-extensions-item > .unified-extensions-item-action-button {
                margin: var(--arrowpanel-menuitem-margin);
            }
            #unified-extensions-area > toolbaritem:first-child > .unified-extensions-item-up,
            #unified-extensions-area > toolbaritem:last-child > .unified-extensions-item-down,
            unified-extensions-item > :is(.unified-extensions-item-up,.unified-extensions-item-down) {
                opacity: .2;
                cursor: not-allowed;
            }
            .unified-extensions-list .addon-disabled {
                order: 99;
            }
            ${COMPACT_LIST ? `
            :root {
                --uei-icon-size: 16px !important;
            }
            #unified-extensions-messages-container {
                margin-block: 0 !important;
            }
            .unified-extensions-item-message-deck {
                display: none !important;
            }
            toolbaritem:is([overflowedItem="true"], [cui-areatype="panel"]) > .webextension-browser-action {
                list-style-image: var(
                    --webextension-toolbar-image,
                    var(--webextension-menupanel-image, inherit)
                ) !important;
            }
            @media (-moz-platform: windows) {
                #unified-extensions-panel .toolbarbutton-text {
                    font: menu !important;
                    font-family: inherit !important;
                }
            }
            .unified-extensions-item-contents {
                flex: 1 !important;

                & > .unified-extensions-item-name,
                & > .unified-extensions-item-message-deck
                > .unified-extensions-item-message {
                    max-width: calc(100% - 4px) !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }
            }
            .unified-extensions-item-row-wrapper > [class^="unified-extensions-item"] {
                padding: 0 !important;

                & > .toolbarbutton-icon {
                    border: none !important;
                }
            }
            ` : ""}
            `)),
            type: 2
        },
        init: function () {
            if (this.appVersion < 135) {
                console.log("Unified Extensions Enhance: 仅支持Firefox 135+");
                // 限定版本号
                return;
            }

            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

            gUnifiedExtensions.panel;
            const view = PanelMultiView.getViewNode(document, "unified-extensions-view");
            const origBtn = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            if (origBtn) origBtn.addEventListener('click', this.openAddonsMgr);

            this.togglePanel = gUnifiedExtensions.togglePanel.toString();
            eval("gUnifiedExtensions.togglePanel = " + this.togglePanel.toString().replace("async togglePanel", "async function").replace("!this.hasExtensionsInPanel()", "false"));

            this.onPinToToolbarChange = gUnifiedExtensions.onPinToToolbarChange;
            eval("gUnifiedExtensions.onPinToToolbarChange = " + gUnifiedExtensions.onPinToToolbarChange.toString().replace("async onPinToToolbarChange", "async function").replace("this.pinToToolbar", "unifiedExtensionsEnhance.onPinToolbarChange(menu, event);this.pinToToolbar"));

            // 增加启用所有
            view.querySelector("#unified-extensions-manage-extensions").before(createElWithClickEvent(document, 'toolbarbutton', BUTTONS.ENABLE_ALL_ADDONS));

            // 增加禁用所有
            view.querySelector("#unified-extensions-manage-extensions").before(createElWithClickEvent(document, 'toolbarbutton', BUTTONS.DISABLE_ALL_ADDONS));

            view.addEventListener('ViewShowing', this);

            if ("COPY_ID" in MENUS) {
                const menuitem = createElWithClickEvent(document, 'menuitem', MENUS.COPY_ID);
                menuitem.classList.add('unified-extensions-context-menu-copy-id');
                $('unified-extensions-context-menu').insertBefore(menuitem, $Q('.unified-extensions-context-menu-manage-extension'));
            }

            if ("DISABLE_ADDON" in MENUS) {
                const menuitem = createElWithClickEvent(document, 'menuitem', MENUS.DISABLE_ADDON);
                menuitem.classList.add('customize-context-disableExtension');
                $Q('#toolbar-context-menu .customize-context-removeExtension').before(menuitem);
            }

            $('toolbar-context-menu').addEventListener('popupshowing', this);
        },
        onPinToolbarChange (menu, event) {
            let shouldPinToToolbar = event.target.getAttribute("checked") == "true";
            let widgetId = gUnifiedExtensions._getWidgetId(menu);
            if (!widgetId) return;
            let node = CustomizableUI.getWidget(widgetId)?.forWindow(window)?.node;
            if (!node) return;
            if (shouldPinToToolbar) {
                this.createAdditionalButtons(node);
            } else {
                this.removeAdditionalButtons(node);
            }
        },
        openAddonsMgr (event) {
            if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                event.preventDefault();
                const addonMgr = "BrowserOpenAddonsMgr" in window ? event.target.ownerGlobal.BrowserOpenAddonsMgr : event.target.ownerGlobal.BrowserAddonUI.openAddonsMgr;
                addonMgr('addons://list/extension');
            }
        },
        createAdditionalButtons (node) {
            let ins = $Q(".webextension-browser-action,.unified-extensions-item-action-button", node);
            if (ins) {
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.MOVE_DOWN));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.MOVE_UP));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.UNPIN_FROM_TOOLBAR));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.PIN_TO_TOOLBAR));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.DISABLE_ADDON));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.ENABLE_ADDON));
                ins.after(createElWithClickEvent(node.ownerDocument, "toolbarbutton", BUTTONS.PLUGIN_OPTION));
            }
        },
        removeAdditionalButtons (node) {
            $QA(".ue-btn", node).forEach(el => $R(el));
        },
        convertSrcToStyle (node) {
            if (node.tagName.toLowerCase() === "unified-extensions-item") {
                ;
                let btn = node.firstElementChild;
                let image = btn.querySelector(":scope>image");
                if (image && image.hasAttribute("src")) {
                    btn.style.listStyleImage = `url("${image.getAttribute("src")}")`;
                    image.setAttribute("src", "");
                }
            } else if (node.classList.contains("unified-extensions-item-action-button")) {
                let btn = node.firstElementChild;
                let image = btn.querySelector(".toolbarbutton-icon");
                if (image && image.hasAttribute("src")) {
                    btn.style.listStyleImage = `url("${image.getAttribute("src")}")`;
                    image.setAttribute("src", "");
                }
            }
        },
        handleEvent: async function (event) {
            if (event.type === "ViewShowing") {
                await this.refreshAddonsList(event.target);
            } else if (event.type === "click") {
                const { target: triggerItem } = event;
                const panelview = triggerItem.closest("panelview");
                if (!triggerItem.hasAttribute("uni-action")) return;
                let item, extension;
                const uniAction = triggerItem.getAttribute("uni-action");
                switch (uniAction) {
                    case "enable-all":
                        let extensionsToBeEnable = await AddonManager.getAddonsByTypes(['extension']);
                        for (let extension of extensionsToBeEnable)
                            if (!extension.isActive && !extension.isBuiltin) extension.enable();
                        break;
                    case "disable-all":
                        let extensionsToBeDisable = await AddonManager.getAddonsByTypes(['extension']);
                        for (let extension of extensionsToBeDisable)
                            if (extension.isActive && !extension.isBuiltin) extension.disable();
                        break;
                    case "enable":
                        item = triggerItem.closest("unified-extensions-item");
                        await (item.addon || item.extension).enable();
                        this.refreshAddonsList(panelview);
                        break;
                    case "disable":
                        if (triggerItem.closest("menupopup#toolbar-context-menu")) {
                            let popup = triggerItem.closest("menupopup#toolbar-context-menu");
                            if (popup) {
                                // 从工具栏右键菜单触发
                                item = popup.triggerNode;
                            }
                        } else {
                            // 从按钮触发
                            item = triggerItem.closest(".unified-extensions-item");
                        }
                        let addonId = item.getAttribute("data-extensionid") || item.getAttribute("extension-id");
                        extension = await AddonManager.getAddonByID(addonId);
                        await extension.disable();
                        this.refreshAddonsList(panelview);
                        break;
                    case "option":
                        let addon;
                        if (triggerItem.closest('unified-extensions-item')) {
                            const uei = triggerItem.closest('unified-extensions-item');
                            addon = "addon" in uei ? uei.addon : uei.extension;
                        } else if (triggerItem.closest('[data-extensionid]')) {
                            const dei = triggerItem.closest('[data-extensionid]');
                            addon = await AddonManager.getAddonByID(dei.getAttribute("data-extensionid"));
                        }
                        this.openAddonOptions(addon, triggerItem.ownerGlobal);
                        break;
                    case "pin":
                        uniItem = triggerItem.closest(".unified-extensions-item");
                        if (uniItem) {
                            this.removeAdditionalButtons(uniItem);
                            gUnifiedExtensions.pinToToolbar(uniItem.id, true);
                            this.refreshAddonsList(panelview);
                        }
                        break;
                    case "unpin":
                        uniItem = triggerItem.closest("unified-extensions-item");
                        if (uniItem) {
                            let extensionId = uniItem.getAttribute("extension-id");
                            let actionId = extensionId.replace("@", "_").replace(".", "_").replace("{", "_").replace("}", "_") + "-browser-action";
                            gUnifiedExtensions.pinToToolbar(actionId, false);
                            this.refreshAddonsList(panelview);
                        }
                        break;
                    case "up":
                    case "down":
                        let moveWidget = eval('(' + gUnifiedExtensions.moveWidget.toString().replace("menu.triggerNode.closest", "menu.closest").replace("async moveWidget", "function moveWidget") + ')');
                        moveWidget(event.target, uniAction);
                        break;
                    case "copy-id":
                        const _addonId = gUnifiedExtensions._getExtensionId(event.target.parentElement);
                        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(_addonId);
                        break;
                }

                if (!triggerItem.hasAttribute("closemenu") && event.button !== 1)
                    event.target.closest("panel")?.hidePopup();
            } else if (event.type === "DOMSubtreeModified") {
                let elm = event.target;
                if (elm.tagName === "toolbarbutton" && elm.classList.contains("webextension-browser-action")) {
                    let parent = elm.parentNode;
                    let extension = await AddonManager.getAddonByID(parent.getAttribute("data-extensionid") || parent.getAttribute("extension-id"));
                    if (!extension.optionsURL) {
                        parent.classList.add('addon-no-options');
                    }
                    this.createAdditionalButtons(parent);
                }
            } else if (event.type === "popupshowing") {
                let elm = event.target;
                if (!elm.querySelector('.customize-context-manageExtension')) return;
                if (elm.querySelector('.customize-context-copyExtensionId')) {
                    elm.querySelector('.customize-context-copyExtensionId').hidden = elm.querySelector('.customize-context-manageExtension').hidden;
                }
                if (elm.querySelector('.customize-context-disableExtension')) {
                    elm.querySelector('.customize-context-disableExtension').hidden = elm.querySelector('.customize-context-manageExtension').hidden;
                }
            }
        },
        refreshAddonsList: async function (aView) {
            const area = $Q("#unified-extensions-area", aView);
            for (const el of area.querySelectorAll('.unified-extensions-item')) {
                this.removeAdditionalButtons(el);
                this.createAdditionalButtons(el);
                this.convertSrcToStyle(el);
                const extensionId = el.getAttribute('data-extensionid');
                const extension = await AddonManager.getAddonByID(extensionId);
                if (!extension.optionsURL) {
                    el.classList.add("addon-no-option-page");
                }
            };
            // 删掉多余扩展项目
            const list = $Q(".unified-extensions-list", aView);
            [...list.childNodes].forEach(node => $R(node));
            const aDoc = aView.ownerDocument;
            const extensions = await this.getAllExtensions();
            for (const extension of extensions) {
                if (!aView.querySelector(`[data-extensionid="${extension.id}"]`)) {
                    let item = aDoc.createElement("unified-extensions-item");
                    if (typeof item.setExtension === "function") {
                        item.setExtension(extension);
                    } else {
                        item.setAddon(extension);
                    }
                    item = list.appendChild(item);
                }
            }
            for (const el of list.querySelectorAll("unified-extensions-item")) {
                this.removeAdditionalButtons(el);
                this.createAdditionalButtons(el);
                const extensionId = el.getAttribute('extension-id');
                const extension = await AddonManager.getAddonByID(extensionId);
                if (!extension.optionsURL) {
                    el.classList.add("addon-no-option-page");
                }
                if (!extension.isActive) {
                    el.classList.add("addon-disabled");
                }
                const actionId = extensionId.replace("@", "_").replace(".", "_").replace("{", "_").replace("}", "_") + "-browser-action";
                if (!document.getElementById(actionId)) {
                    el.classList.add("addon-no-unpin");
                }
                this.convertSrcToStyle(el);
            };
        },
        getAllExtensions: async function () {
            let addons = await AddonManager.getAddonsByTypes(["extension"]);
            addons = addons.filter(addon => !addon.hidden);
            if (!this.showDisabled) {
                addons = addons.filter(addon => addon.isActive);
            }
            return addons;
        },
        openAddonOptions: function (addon, win) {
            if (!addon.isActive || !addon.optionsURL)
                return;

            switch (Number(addon.__AddonInternal__.optionsType)) {
                case 5:
                    const addonMgr = "BrowserOpenAddonsMgr" in window ? BrowserOpenAddonsMgr : BrowserAddonUI.openAddonsMgr;
                    addonMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
                    break;
                case 3:
                    win.switchToTabHavingURI(addon.optionsURL, true);
                    break;
                case 1:
                    var windows = Services.wm.getEnumerator(null);
                    while (windows.hasMoreElements()) {
                        var win2 = windows.getNext();
                        if (win2.closed) {
                            continue;
                        }
                        if (win2.document.documentURI == addon.optionsURL) {
                            win2.focus();
                            return;
                        }
                    }
                    win.openDialog(addon.optionsURL, addon.id, 'chrome,titlebar,toolbar,centerscreen');
            }
        },
        destroy: function () {
            this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            window.removeEventListener("toolbarvisibilitychange", this);
            let view = PanelMultiView.getViewNode(
                document,
                "unified-extensions-view"
            );
            view.querySelectorAll("[uni-action]").forEach(el => {
                $R(el);
            })
            view.removeEventListener('ViewShowing', this);
            gUnifiedExtensions.onPinToToolbarChange = this.onPinToToolbarChange;
            gUnifiedExtensions.togglePanel = this.togglePanel;
            let origBtn = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            $R($Q(".unified-extensions-context-menu-copy-id", $('unified-extensions-context-menu')));
            $R($Q(".customize-context-copyExtensionId", $('toolbar-context-menu')));
            $R($Q(".customize-context-disableExtension", $('toolbar-context-menu')));
            $('toolbar-context-menu').addEventListener('popupshowing', this);
            if (origBtn) origBtn.removeEventListener('click', this.openAddonsMgr);
            delete window.unifiedExtensionsEnhance;
        }
    }

    function $ (id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function $Q (sel, aDoc) {
        return (aDoc || document).querySelector(sel);
    }

    function $QA (sel, aDoc) {
        return (aDoc || document).querySelectorAll(sel);
    }


    function $R (el) {
        if (!el || !el.parentNode) return;
        el.parentNode.removeChild(el);
    }

    window.unifiedExtensionsEnhance.init();
})()