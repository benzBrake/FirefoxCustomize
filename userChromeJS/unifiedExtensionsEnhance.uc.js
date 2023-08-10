// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.2.1
// @compatibility   Firefox 115
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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

    const BUTTONS = {
        MOVE_UP: {
            label: "上移",
            tooltiptext: "上移",
            "uni-action": "up",
            closemenu: "none",
            class: "unified-extensions-item-up subviewbutton subviewbutton-iconic",
        },
        MOVE_DOWN: {
            label: "下移",
            tooltiptext: "下移",
            "uni-action": "down",
            closemenu: "none",
            class: "unified-extensions-item-down subviewbutton subviewbutton-iconic",
        },
        PIN_TO_TOOLBAR: {
            label: "在工具栏中显示",
            tooltiptext: "在工具栏中显示",
            "uni-action": "pin",
            class: "unified-extensions-item-pin subviewbutton subviewbutton-iconic",
            onclick: "unifiedExtensionsEnhance.handleEvent(event); "
        },
        UNPIN_FROM_TOOLBAR: {
            label: "从工具栏移除",
            tooltiptext: "从工具栏移除",
            "uni-action": "unpin",
            class: "unified-extensions-item-unpin subviewbutton subviewbutton-iconic",
            onclick: "unifiedExtensionsEnhance.handleEvent(event); "
        },
        PLUGIN_OPTION: {
            label: "选项",
            tooltiptext: "扩展选项",
            "uni-action": "option",
            class: "unified-extensions-item-option subviewbutton subviewbutton-iconic",
        },
        ENABLE_ADDON: {
            label: "启用",
            tooltiptext: "启用扩展",
            "uni-action": "enable",
            closemenu: "none",
            class: "unified-extensions-item-enable subviewbutton subviewbutton-iconic",
        },
        DISABLE_ADDON: {
            label: "禁用",
            tooltiptext: "禁用扩展",
            closemenu: "none",
            "uni-action": "disable",
            class: "unified-extensions-item-disable subviewbutton subviewbutton-iconic",
        },
        DISABLE_ALL_ADDONS: {
            id: 'unified-extensions-disable-all',
            class: "subviewbutton",
            "uni-action": "disable-all",
            label: "禁用所有扩展",
        },
    }

    const MENUS = {
        COPY_ID: {
            class: "unified-extensions-context-menu-copy-id",
            "uni-action": "copy-id",
            label: "复制 ID",
        }
    }

    const createElWithClickEvent = (document, tag, attrs, skipAttrs) => {
        let el = $C(document, tag, attrs, skipAttrs);
        el.classList.add("ue-btn");
        el.setAttribute("onclick", "unifiedExtensionsEnhance.handleEvent(event);");
        return el;
    }

    window.unifiedExtensionsEnhance = {
        get appVersion() {
            delete this.appVersion;
            return this.appVersion = Services.appinfo.version.split(".")[0];
        },
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        get showDisabled() {
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
                align-items: center;
                margin-inline: 0;
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
                margin-inline-end: var(--arrowpanel-menuitem-margin-inline);
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTI0My4yIDUxMm0tODMuMiAwYTEuMyAxLjMgMCAxIDAgMTY2LjQgMCAxLjMgMS4zIDAgMSAwLTE2Ni40IDBaIiBwLWlkPSIzNjAxIj48L3BhdGg+PHBhdGggZD0iTTUxMiA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiIgcC1pZD0iMzYwMiI+PC9wYXRoPjxwYXRoIGQ9Ik03ODAuOCA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiI+PC9wYXRoPjwvc3ZnPg==");
            }
            #unified-extensions-view .unified-extensions-item-up {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMTAuODI4bC00Ljk1IDQuOTUtMS40MTQtMS40MTRMMTIgOGw2LjM2NCA2LjM2NC0xLjQxNCAxLjQxNHoiLz48L3N2Zz4=")
            }
            #unified-extensions-view .unified-extensions-item-down {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMTMuMTcybDQuOTUtNC45NSAxLjQxNCAxLjQxNEwxMiAxNiA1LjYzNiA5LjYzNiA3LjA1IDguMjIyeiIvPjwvc3ZnPg==")
            }
            #unified-extensions-view .unified-extensions-item-pin {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiBmaWxsPSJjb250ZXh0LWZpbGwiPjxwYXRoIGQ9Ik0xMi4wMDAzIDNDMTcuMzkyNCAzIDIxLjg3ODQgNi44Nzk3NiAyMi44MTg5IDEyQzIxLjg3ODQgMTcuMTIwMiAxNy4zOTI0IDIxIDEyLjAwMDMgMjFDNi42MDgxMiAyMSAyLjEyMjE1IDE3LjEyMDIgMS4xODE2NCAxMkMyLjEyMjE1IDYuODc5NzYgNi42MDgxMiAzIDEyLjAwMDMgM1pNMTIuMDAwMyAxOUMxNi4yMzU5IDE5IDE5Ljg2MDMgMTYuMDUyIDIwLjc3NzcgMTJDMTkuODYwMyA3Ljk0ODAzIDE2LjIzNTkgNSAxMi4wMDAzIDVDNy43NjQ2IDUgNC4xNDAyMiA3Ljk0ODAzIDMuMjIyNzggMTJDNC4xNDAyMiAxNi4wNTIgNy43NjQ2IDE5IDEyLjAwMDMgMTlaTTEyLjAwMDMgMTYuNUM5LjUxNDk4IDE2LjUgNy41MDAyNiAxNC40ODUzIDcuNTAwMjYgMTJDNy41MDAyNiA5LjUxNDcyIDkuNTE0OTggNy41IDEyLjAwMDMgNy41QzE0LjQ4NTUgNy41IDE2LjUwMDMgOS41MTQ3MiAxNi41MDAzIDEyQzE2LjUwMDMgMTQuNDg1MyAxNC40ODU1IDE2LjUgMTIuMDAwMyAxNi41Wk0xMi4wMDAzIDE0LjVDMTMuMzgxIDE0LjUgMTQuNTAwMyAxMy4zODA3IDE0LjUwMDMgMTJDMTQuNTAwMyAxMC42MTkzIDEzLjM4MSA5LjUgMTIuMDAwMyA5LjVDMTAuNjE5NiA5LjUgOS41MDAyNiAxMC42MTkzIDkuNTAwMjYgMTJDOS41MDAyNiAxMy4zODA3IDEwLjYxOTYgMTQuNSAxMi4wMDAzIDE0LjVaIi8+PC9zdmc+")
            }
            #unified-extensions-view .unified-extensions-item-unpin > .toolbarbutton-icon {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJtMTIuMDAwMywzYzUuMzkyMSwwIDkuODc4MSwzLjg3OTc2IDEwLjgxODYsOWMtMC45NDA1LDUuMTIwMiAtNS40MjY1LDkgLTEwLjgxODYsOWMtNS4zOTIxOCwwIC05Ljg3ODE1LC0zLjg3OTggLTEwLjgxODY2LC05YzAuOTQwNTEsLTUuMTIwMjQgNS40MjY0OCwtOSAxMC44MTg2NiwtOXptMCwxNmM0LjIzNTYsMCA3Ljg2LC0yLjk0OCA4Ljc3NzQsLTdjLTAuOTE3NCwtNC4wNTE5NyAtNC41NDE4LC03IC04Ljc3NzQsLTdjLTQuMjM1NywwIC03Ljg2MDA4LDIuOTQ4MDMgLTguNzc3NTIsN2MwLjkxNzQ0LDQuMDUyIDQuNTQxODIsNyA4Ljc3NzUyLDd6bTAsLTIuNWMtMi40ODUzMiwwIC00LjUwMDA0LC0yLjAxNDcgLTQuNTAwMDQsLTQuNWMwLC0yLjQ4NTI4IDIuMDE0NzIsLTQuNSA0LjUwMDA0LC00LjVjMi40ODUyLDAgNC41LDIuMDE0NzIgNC41LDQuNWMwLDIuNDg1MyAtMi4wMTQ4LDQuNSAtNC41LDQuNXptMCwtMmMxLjM4MDcsMCAyLjUsLTEuMTE5MyAyLjUsLTIuNWMwLC0xLjM4MDcgLTEuMTE5MywtMi41IC0yLjUsLTIuNWMtMS4zODA3LDAgLTIuNTAwMDQsMS4xMTkzIC0yLjUwMDA0LDIuNWMwLDEuMzgwNyAxLjExOTM0LDIuNSAyLjUwMDA0LDIuNXoiLz4KICA8bGluZSBzdHJva2Utd2lkdGg9IjIiIHkyPSIyMy4xMzc4NSIgeDI9IjIzLjIwMDM1IiB5MT0iMC42Mzc1IiB4MT0iMC43IiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4=") !important;
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
            .unified-extensions-item-option > .toolbarbutton-text,
            .unified-extensions-item-enable > .toolbarbutton-text,
            .unified-extensions-item-disable > .toolbarbutton-text,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-pin,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-option,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-enable,
            toolbar toolbaritem.unified-extensions-item .unified-extensions-item-disable,
            unified-extensions-item.addon-disabled .unified-extensions-item-option,
            unified-extensions-item.addon-disabled .unified-extensions-item-unpin,
            unified-extensions-item.addon-no-option-page .unified-extensions-item-option,
            unified-extensions-item .unified-extensions-item-pin,
            unified-extensions-item.addon-no-unpin .unified-extensions-item-unpin,
            unified-extensions-item .unified-extensions-item-up,
            unified-extensions-item .unified-extensions-item-down {
                display: none;
            }
            .toolbaritem-combined-buttons.unified-extensions-item > *:not(.unified-extensions-item-action-button) {
                padding: 0;
                padding-inline-end: 0;
                flex: 0;
                border: 1px solid transparent;
            }
            .toolbaritem-combined-buttons.unified-extensions-item > *:not(.unified-extensions-item-action-button) > .toolbarbutton-icon {
                box-sizing: content-box;
                padding: var(--arrowpanel-menuitem-padding-inline);
                border: 1px solid transparent;
                border-radius: var(--arrowpanel-menuitem-border-radius);
            }
            .unified-extensions-list unified-extensions-item > .unified-extensions-item-action-button {
                margin: var(--arrowpanel-menuitem-margin-inline);
            }
            `)),
            type: 2
        },
        init: function () {
            if (this.appVersion < 111) {
                // 限定版本号
                return;
            }

            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

            gUnifiedExtensions.panel;
            let view = PanelMultiView.getViewNode(
                document,
                "unified-extensions-view"
            );

            let origBtn = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            if (origBtn) origBtn.addEventListener('click', this.openAddonsMgr);

            this.onPinToToolbarChange = gUnifiedExtensions.onPinToToolbarChange;
            eval("gUnifiedExtensions.onPinToToolbarChange = " + gUnifiedExtensions.onPinToToolbarChange.toString().replace("async onPinToToolbarChange", "async function").replace("this.pinToToolbar", "unifiedExtensionsEnhance.onPinToolbarChange(menu, event);this.pinToToolbar"));

            // 增加禁用所有
            view.querySelector("#unified-extensions-manage-extensions").before(createElWithClickEvent(document, 'toolbarbutton', BUTTONS.DISABLE_ALL_ADDONS));

            // 复制 ID
            if (!$Q("." + MENUS.COPY_ID.class.replace(" ", "."))) {
                $('unified-extensions-context-menu').insertBefore(createElWithClickEvent(document, 'menuitem', MENUS.COPY_ID), $Q('.unified-extensions-context-menu-manage-extension'));
            }

            view.addEventListener('ViewShowing', this);
        },
        onPinToolbarChange(menu, event) {
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
        openAddonsMgr(event) {
            if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                event.preventDefault();
                event.target.ownerGlobal.BrowserOpenAddonsMgr('addons://list/extension');
            }
        },
        createAdditionalButtons(node) {
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
        removeAdditionalButtons(node) {
            $QA(".ue-btn", node).forEach(el => $R(el));
        },
        handleEvent: async function (event) {
            if (event.type === "ViewShowing") {
                await this.refreshAddonsList(event.target);
            } else if (event.type === "click") {
                const { target: button } = event;
                const panelview = button.closest("panelview");
                if (!button.hasAttribute("uni-action")) return;
                let item;
                const uniAction = button.getAttribute("uni-action");
                switch (uniAction) {
                    case "disable-all":
                        let extensions = await AddonManager.getAddonsByTypes(['extension']);
                        for (let extension of extensions)
                            if (extension.isActive && !extensions.isBuiltin) extension.disable();
                        break;
                    case "enable":
                        item = button.closest("unified-extensions-item");
                        await (item.addon || item.extension).enable();
                        this.refreshAddonsList(panelview);
                        break;
                    case "disable":
                        item = button.closest(".unified-extensions-item");
                        let addonId = item.getAttribute("data-extensionid") || item.getAttribute("extension-id");
                        let extension = await AddonManager.getAddonByID(addonId);
                        await extension.disable();
                        this.refreshAddonsList(panelview);
                        break;
                    case "option":
                        let { parentNode } = button, addon;
                        if (parentNode.localName === "unified-extensions-item") {
                            addon = parentNode.addon;
                        } else {
                            addon = await AddonManager.getAddonByID(parentNode.getAttribute("data-extensionid"));
                        }
                        this.openAddonOptions(addon, button.ownerGlobal);
                        break;
                    case "pin":
                        uniItem = event.target.closest(".unified-extensions-item");
                        if (uniItem) {
                            this.removeAdditionalButtons(uniItem);
                            gUnifiedExtensions.pinToToolbar(uniItem.id, true);
                            this.refreshAddonsList(panelview);
                        }
                        break;
                    case "unpin":
                        uniItem = event.target.closest("unified-extensions-item");
                        if (uniItem) {
                            let extensionId = uniItem.getAttribute("extension-id");
                            let actionId = extensionId.replace("@", "_").replace(".", "_").replace("{", "_").replace("}", "_") + "-browser-action";
                            gUnifiedExtensions.pinToToolbar(actionId, false);
                            this.refreshAddonsList(panelview);
                        }
                        break;
                    case "up":
                    case "down":
                        let moveWidget;
                        eval('moveWidget = ' + gUnifiedExtensions.moveWidget.toString("").replace("menu.triggerNode.closest", "menu.closest").replace("async moveWidget", "async function moveWidget"));
                        moveWidget(event.target, uniAction);
                        break;
                    case "copy-id":
                        const _addonId = gUnifiedExtensions._getExtensionId(event.target.parentElement);
                        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(_addonId);
                        break;
                }

                if (!button.hasAttribute("closemenu") && event.button !== 1)
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
            } else if (event.type === "toolbarvisibilitychange") {
                console.log(event.target);
            }
        },
        refreshAddonsList: async function (aView) {
            const area = $Q("#unified-extensions-area", aView);
            area.querySelectorAll('.unified-extensions-item').forEach(el => {
                this.removeAdditionalButtons(el);
                this.createAdditionalButtons(el);
            });
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

            switch (Number(addon.optionsType)) {
                case 5:
                    win.BrowserOpenAddonsMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
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
            let origBtn = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            $R($Q(".unified-extensions-context-menu-copy-id", $('unified-extensions-context-menu')))
            if (origBtn) origBtn.removeEventListener('click', this.openAddonsMgr);
            delete window.unifiedExtensionsEnhance;
        }
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function $Q(sel, aDoc) {
        return (aDoc || document).querySelector(sel);
    }

    function $QA(sel, aDoc) {
        return (aDoc || document).querySelectorAll(sel);
    }

    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

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

    function $R(el) {
        if (!el || !el.parentNode) return;
        el.parentNode.removeChild(el);
    }

    if (gBrowserInit.delayedStartupFinished) window.unifiedExtensionsEnhance.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.unifiedExtensionsEnhance.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})()