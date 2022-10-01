// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Unified Extensions Button Enhance script, left click open options page, right click to swith addon status.
// Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.1.2
// @compatibility   Firefox 104
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
            unified-extensions-item.no-options .unified-extensions-item-name {
                color: color-mix(in srgb, currentColor 50%, transparent);
            }
            unified-extensions-item.disabled .unified-extensions-item-name {
                font-style: italic;
            }`)),
        },
        init: function () {
            if (!gUnifiedExtensions) {
                return;
            }
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

            let list = view.querySelector(".unified-extensions-list");
            let extensions = await gUnifiedExtensions.getActiveExtensions();

            for (const extension of extensions) {
                if (unifiedExtensionsEnhance.appVersion > 104) {
                    const item = document.createElement("unified-extensions-item");
                    if (!extension.optionsURL) {
                        item.classList.add('no-options');
                    }
                    item.setAddon(extension);
                    list.appendChild(item);
                } else {
                    $QA('unified-extensions-item', list).forEach(item => {
                        if (!item.addon.optionsURL)
                            item.classList.add('no-options');
                    })
                }
            }
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
            var { addon } = vbox = event.target.closest('unified-extensions-item');
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
                let btn = $Q("unified-extensions-disable-all", view);
                if (btn)
                    btn.parentNode.removeChild(btn);
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