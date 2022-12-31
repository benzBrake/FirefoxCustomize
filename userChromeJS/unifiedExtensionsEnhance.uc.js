// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Unified Extensions Button Enhance script, left click open options page, right click to swith addon status.
// Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.1.5
// @compatibility   Firefox 109
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
            #unified-extensions,
            #unified-extensions-button {
                display: none !important;
            }
            #movable-unified-extensions {
                list-style-image: url("chrome://mozapps/skin/extensions/extension.svg");
            }
            panelview#unified-extensions-view .toolbaritem-combined-buttons {
                margin: var(--arrowpanel-menuitem-margin);
                max-width: max-content;
            }
            #unified-extensions-area {
                padding-right: 20px;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action  {
                margin: var(--arrowpanel-menuitem-margin);
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action:hover {
                background-color: var(--panel-item-hover-bgcolor) !important;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action > .toolbarbutton-badge-stack {
                margin-inline-end: 0 !important;
            }
            panel .unified-extensions-item[unified-extensions="true"] .webextension-browser-action:hover > .toolbarbutton-badge-stack {
                background-color: transparent !important;
            }
            unified-extensions-item.addon-disabled .unified-extensions-item-contents {
                font-style: italic;
                color: Gray;
            }
            #unified-extensions-view .unified-extensions-item-menu-button {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTI0My4yIDUxMm0tODMuMiAwYTEuMyAxLjMgMCAxIDAgMTY2LjQgMCAxLjMgMS4zIDAgMSAwLTE2Ni40IDBaIiBwLWlkPSIzNjAxIj48L3BhdGg+PHBhdGggZD0iTTUxMiA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiIgcC1pZD0iMzYwMiI+PC9wYXRoPjxwYXRoIGQ9Ik03ODAuOCA1MTJtLTgzLjIgMGExLjMgMS4zIDAgMSAwIDE2Ni40IDAgMS4zIDEuMyAwIDEgMC0xNjYuNCAwWiI+PC9wYXRoPjwvc3ZnPg==");
            }
            #unified-extensions-view .unified-extensions-item-enable {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTMuNDU1IDFBMS41MDIgMS41MDIgMCAwMDIgMi41djExYTEuNSAxLjUgMCAwMDIuMjIzIDEuMzEzbDkuOTk4LTUuNWExLjQ5NyAxLjQ5NyAwIDAwMC0yLjYyNmwtOS45OTgtNS41QTEuNDgzIDEuNDgzIDAgMDAzLjQ1NSAxem0uMDMgMWEuNDk0LjQ5NCAwIDAxLjI1NS4wNjNsOS45OTggNS41YS41LjUgMCAwMTAgLjg3NWwtOS45OTggNS41QS41LjUgMCAwMTMgMTMuNXYtMTFhLjUuNSAwIDAxLjQ4NC0uNXoiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSIvPjwvc3ZnPg==")
            }
            #unified-extensions-view .unified-extensions-item-disable {
                list-style-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNMCAwaDI0djI0SDBWMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTIgMjMuNjU2QzUuNTYyIDIzLjY1Ni4zNDQgMTguNDM4LjM0NCAxMlM1LjU2Mi4zNDQgMTIgLjM0NCAyMy42NTYgNS41NjIgMjMuNjU2IDEyIDE4LjQzOCAyMy42NTYgMTIgMjMuNjU2em0wLTIuMzMxYTkuMzI1IDkuMzI1IDAgMTAwLTE4LjY1IDkuMzI1IDkuMzI1IDAgMDAwIDE4LjY1ek04LjUwMyA4LjUwM2g2Ljk5NHY2Ljk5NEg4LjUwM1Y4LjUwM3oiLz48L3N2Zz4=")
            }
            #unified-extensions-view .unified-extensions-item:not(.addon-disabled) .unified-extensions-item-enable {
                display: none;
            }
            #unified-extensions-view .unified-extensions-item.addon-disabled .unified-extensions-item-disable {
                display: none;
            }
            #unified-extensions-view .subviewbutton-iconic:not([disabled]) {
                padding: var(--arrowpanel-menuitem-padding-inline) !important;
            }
            #unified-extensions-view .subviewbutton-iconic:not([disabled]):hover {
                background-color: var(--panel-item-hover-bgcolor) !important;
            }
            `)),
            type: 2
        },
        init: function () {
            if (!Services.prefs.getBoolPref('extensions.unifiedExtensions.enabled', false) || !gUnifiedExtensions) {
                return;
            }

            if (this.appVersion < 109) {
                console.error("仅支持 Firefox 109(包括)+")
                return;
            }

            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

            if (!CustomizableUI.getPlacementOfWidget("movable-unified-extensions", true))
                CustomizableUI.createWidget({
                    id: 'movable-unified-extensions',
                    type: "view",
                    viewId: "unified-extensions-view",
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    onCreated: node => this.initButton(node)
                });

        },
        initButton: function (node) {
            let { ownerDocument: document } = node,
                originalMenu = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            $A(node, {
                label: originalMenu.getAttribute('label'),
                tooltiptext: originalMenu.getAttribute('tooltiptext'),
                style: 'list-style-image: url("chrome://mozapps/skin/extensions/extension.svg")',
                contextmenu: false,
                onclick: function (event) {
                    if (event.target.id === "movable-unified-extensions" && event.button === 2) {
                        event.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/extension");
                    }
                }
            });
            gUnifiedExtensions.panel;
            let view = PanelMultiView.getViewNode(
                document,
                "unified-extensions-view"
            );
            view.addEventListener('ViewShowing', this);
            view.addEventListener('click', this);
            view.querySelector("#unified-extensions-manage-extensions").before($C(document, 'toolbarbutton', {
                id: 'unified-extensions-disable-all',
                class: "subviewbutton",
                label: "Disable all extensions",
                onclick: "unifiedExtensionsEnhance.handleEvent(event); "
            }));
        },
        handleEvent: async function (event) {
            if (event.type === "ViewShowing") {
                // 删掉多余扩展项目
                $QA("unified-extensions-item", $Q("#unified-extensions-list", event.target)).forEach(elm => $R(elm));
                const panelview = event.target;
                const list = panelview.querySelector(".unified-extensions-list");
                const extensions = await this.getAllExtensions();

                for (const extension of extensions) {
                    let sel = extension.id.replace(/[@.{}]/g, "_") + "-browser-action";
                    if (!document.getElementById(sel)) {
                        const item = document.createElement("unified-extensions-item");
                        if (!extension.isActive) {
                            item.classList.add("addon-disabled");
                        }
                        if (!extension.optionsURL) {
                            item.classList.add('addon-no-options');
                        }
                        item.setAddon(extension);
                        list.appendChild(item);
                    }
                }

                $QA("toolbaritem", $Q("#unified-extensions-area", panelview)).forEach(elm => {
                    if (!$Q(".unified-extensions-item-enable", elm))
                        $Q(".unified-extensions-item-menu-button", elm).before($C(panelview.ownerDocument, "toolbarbutton", {
                            label: "启用",
                            class: "unified-extensions-item-enable subviewbutton subviewbutton-iconic"
                        }));
                    if (!$Q(".unified-extensions-item-disable", elm))
                        $Q(".unified-extensions-item-menu-button", elm).before($C(panelview.ownerDocument, "toolbarbutton", {
                            label: "禁用",
                            class: "unified-extensions-item-disable subviewbutton subviewbutton-iconic"
                        }));
                });
            } else if (event.type === "click") {
                if (event.target.id === "unified-extensions-disable-all") {
                    let extensions = await gUnifiedExtensions.getActiveExtensions();
                    for (let extension of extensions)
                        extension.disable();
                }

                if (event.target.classList.contains("unified-extensions-item-disable")) {
                    let item = event.target.closest(".unified-extensions-item");
                    let addonId = item.getAttribute("data-extensionid");
                    let extension = await AddonManager.getAddonByID(addonId);
                    extension.disable();
                }
            }
        },
        onClick: function (event) {
            const { itemTag } = window.unifiedExtensionsEnhance;
            if (!event.target.closest(itemTag)) return;
            var { addon } = vbox = event.target.closest(itemTag);
            var { classList } = event.target;
            if (classList.contains('unified-extensions-item-action') || classList.contains('unified-extensions-item-contents') || classList.contains('unified-extensions-item-name') || classList.contains('unified-extensions-item-message') || classList.contains('unified-extensions-item-icon')) {
                switch (event.button) {
                    case 0:
                        unifiedExtensionsEnhance.openAddonOptions(addon, event.target.ownerGlobal);
                        break;
                    case 1:
                        break;
                    case 2:
                        if (addon.userDisabled) {
                            addon.enable();
                            vbox.classList.remove('disabled');
                        } else {
                            addon.disable();
                            vbox.classList.add('disabled');
                        }
                        break;
                }
            }
        },
        getAllExtensions: async function (event) {
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
            CustomizableUI.destroyWidget('movable-unified-extensions');
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