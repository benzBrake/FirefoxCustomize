// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Unified Extensions Button Enhance script, left click open options page, right click to swith addon status.
// Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.1.4
// @compatibility   Firefox 104
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
            #unified-extensions-view.scroll {
                overflow-x: hidden;
                overflow-y: scroll;
            }
            new-unified-extensions-item {
                display: flex;
            }
            unified-extensions-item.no-options .unified-extensions-item-name,
            new-unified-extensions-item.no-options .unified-extensions-item-name {
                color: var(--menu-disabled-color, var(--panel-disabled-color));
            }
            unified-extensions-item.disabled .unified-extensions-item-name,
            new-unified-extensions-item.disabled .unified-extensions-item-name {
                font-style: italic;
            }`)),
        },
        init: function () {
            if (!Services.prefs.getBoolPref('extensions.unifiedExtensions.enabled', false) || !gUnifiedExtensions) {
                return;
            }

            this.itemTag = 'unified-extensions-item';

            let definedItem;
            if (this.appVersion >= 107) {
                // Tempoarily compat for legacy addons
                definedItem = customElements.get("unified-extensions-item").toString().replace("lazy.OriginControls.getAttention(policy, this.ownerGlobal)", "this.addon.isWebExtension && this.addon.isActive ? lazy.OriginControls.getAttention(policy, this.ownerGlobal): ''").replaceAll("this._updateStateMessage", "if (this.addon.isWebExtension && this.addon.isActive) this._updateStateMessage").replace("let policy = WebExtensionPolicy.getByID(this.addon.id);", "let policy = this.addon.isWebExtension ? WebExtensionPolicy.getByID(this.addon.id) : '';");
                this.itemTag = 'new-unified-extensions-item';
            }

            if (this.appVersion >= 108) {
                definedItem = definedItem.replace("_hasAction() {", "_hasAction() {\n      if(!this.addon.isWebExtension) return false;");
                gUnifiedExtensions.panel
            }

            if (definedItem) eval('customElements.define("new-unified-extensions-item",' + definedItem + ');');


            if (!CustomizableUI.getPlacementOfWidget("movable-unified-extensions", true))
                CustomizableUI.createWidget({
                    id: 'movable-unified-extensions',
                    type: "view",
                    viewId: "unified-extensions-view",
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    onCreated: node => this.initButton(node)
                });
            if (gUnifiedExtensions.togglePanel.length === 2 && !gUnifiedExtensions.togglePanel.toString().includes("UnifiedExtensionsTogglePanel")) {
                gUnifiedExtensions.togglePanel = async function (anchor, aEvent) {
                    if (anchor.getAttribute("open") == "true") {
                        PanelUI.hide();
                    } else {
                        PanelUI.showSubView("unified-extensions-view", anchor, aEvent);
                    }
                    window.dispatchEvent(new CustomEvent("UnifiedExtensionsTogglePanel"));
                }
            }
            window.addEventListener('UnifiedExtensionsTogglePanel', this);
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
        initButton: function (node) {
            let { ownerDocument: document } = node,
                originalMenu = CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node || CustomizableUI.getWidget('unified-extensions').forWindow(window).node;
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
            let view = PanelMultiView.getViewNode(
                document,
                "unified-extensions-view"
            );
            if (view)
                view.addEventListener('ViewShowing', unifiedExtensionsEnhance);
            else
                node.addEventListener('click', unifiedExtensionsEnhance.onceEvent);
        },
        onceEvent: async function (event) {
            if (event.target.id === "movable-unified-extensions") {
                let { ownerDocument: document } = target = event.target;
                target.removeEventListener('click', unifiedExtensionsEnhance.onceEvent);
                let view = PanelMultiView.getViewNode(
                    document,
                    "unified-extensions-view"
                );
                if (view)
                    view.addEventListener('ViewShowing', unifiedExtensionsEnhance);
            }
        },
        handleEvent: async function (event) {
            if (event.type === "ViewShowing") {
                this.onViewShowing(event);
            }
            if (event.target.id === "unified-extensions-disable-all") {
                let extensions = await gUnifiedExtensions.getActiveExtensions();
                for (let extension of extensions)
                    extension.disable();
            }
        },
        onViewShowing: async function (event) {
            let { ownerDocument: document } = view = event.target;
            if ((await gUnifiedExtensions.getActiveExtensions()).length == 0) {
                await BrowserOpenAddonsMgr("addons://discover/");
                view.closest("panel").hidePopup();
                return;
            }
            if (this.appVersion == 104) view.classList.add("scroll");
            if ($('unified-extensions-context-menu', document))
                $('unified-extensions-context-menu', document)
                    .querySelectorAll("[data-lazy-l10n-id]")
                    .forEach(el => {
                        if (!el.hasAttribute('data-l10n-id')) {
                            el.setAttribute(
                                "data-l10n-id",
                                el.getAttribute("data-lazy-l10n-id")
                            );
                            el.removeAttribute("data-lazy-l10n-id");
                        }
                    });
            view.addEventListener('click', this.onClick);

            let list = $Q('.unified-extensions-list', view);
            $QA(this.itemTag, list).forEach(item => {
                $R(item);
            })
            $R($Q('.generated-separator', list))
            let extensions = await this.getAllExtensions(),
                prevState;

            extensions.sort((a, b) => {
                let ka = (a.isActive ? '0' : '1') + a.name.toLowerCase();
                let kb = (b.isActive ? '0' : '1') + b.name.toLowerCase();
                return (ka < kb) ? -1 : 1;
            }).forEach(addon => {
                if (this.showDisabled && prevState && prevState != addon.isActive) {
                    list.appendChild($C(document, 'toolbarseparator', { class: 'generated-separator' }));
                }
                prevState = addon.isActive;
                const item = document.createElement(this.itemTag);
                if (!addon.optionsURL) {
                    item.classList.add('no-options');
                }
                item.setAddon(addon);
                list.appendChild(item);
            });
            $QA(this.itemTag, list).forEach(item => {
                if (!item.addon.optionsURL)
                    item.classList.add('no-options');
                if (!item.addon.isActive)
                    item.classList.add('disabled');
            })
            if (!$Q("#unified-extensions-disable-all", view)) {
                let disableAll = view.insertBefore($C(document, 'toolbarbutton', {
                    id: 'unified-extensions-disable-all',
                    class: "subviewbutton",
                    label: "Disable all extensions",
                }), $Q("#unified-extensions-manage-extensions", view));
                disableAll.addEventListener('click', this);
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
            let view = PanelMultiView.getViewNode(
                document,
                "unified-extensions-view"
            );
            if (view) {
                let list = $Q('.unified-extensions-list', view);
                $QA('unified-extensions-item', list).forEach(item => {
                    $R(item);
                })
                $R($Q('.generated-separator', list))
                $R($Q("unified-extensions-disable-all", view));
            }
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