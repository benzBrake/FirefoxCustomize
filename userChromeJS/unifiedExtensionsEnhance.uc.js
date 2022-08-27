// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     Unified Extensions Button Enhance script, left click open options page, right click to swith addon status.
// Once Firefox has implemented the functionality, the script can be removed.
// @author          Ryan
// @include         main
// @version         0.1.1
// @compatibility   Firefox 104
// @shutdown        window.unifiedExtensionsEnhance.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            参考了 https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    if (!Services.prefs.getBoolPref('extensions.unifiedExtensions.enabled', false)) {
        uAlert('Please set extensions.unifiedExtensions.enabled to true and restart browser\n Click here to set immediately!', null, function () {
            Services.prefs.setBoolPref('extensions.unifiedExtensions.enabled', true);
            Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit);
            return;
        });
    }

    if (window.unifiedExtensionsEnhance) {
        window.unifiedExtensionsEnhance.destroy();
    }

    window.unifiedExtensionsEnhance = {
        get appVersion() {
            delete this.appVersion;
            return this.appVersion = Services.appinfo.version.split(".")[0];
        },
        init: function () {
            this.originalBtn = CustomizableUI.getWidget('unified-extensions').forWindow(window).node || CustomizableUI.getWidget('unified-extensions-button').forWindow(window).node;
            if (!this.originalBtn) {
                throw new Error("Do not support this vesion[%s] of firefox!".replace("%s", this.appVersion));
            }
            CustomizableUI.createWidget({
                id: 'movable-unified-extensions',
                label: this.originalBtn.getAttribute('label'),
                tooltiptext: this.originalBtn.getAttribute('tooltiptext'),
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                style: 'list-style-image: url("chrome://mozapps/skin/extensions/extension.svg")',
                onCreated: function (node) {
                    var events = ['click', 'keypress'];
                    events.forEach(name => node.addEventListener(name, async function (event) {
                        if (!gUnifiedExtensions._listView) {
                            gUnifiedExtensions._listView = PanelMultiView.getViewNode(
                                document,
                                "unified-extensions-view"
                            );
                            gUnifiedExtensions._listView.addEventListener("ViewShowing", unifiedExtensionsEnhance);
                            gUnifiedExtensions._listView.addEventListener("click", unifiedExtensionsEnhance);
                            gUnifiedExtensions._listView.addEventListener("ViewHiding", gUnifiedExtensions);

                            if (unifiedExtensionsEnhance.appVersion == 104)
                                gUnifiedExtensions._listView.classList.add('scroll');

                            // Lazy-load the l10n strings.
                            if (document
                                .getElementById("unified-extensions-context-menu"))
                                document
                                    .getElementById("unified-extensions-context-menu")
                                    .querySelectorAll("[data-lazy-l10n-id]")
                                    .forEach(el => {
                                        el.setAttribute(
                                            "data-l10n-id",
                                            el.getAttribute("data-lazy-l10n-id")
                                        )
                                            ;
                                        el.removeAttribute("data-lazy-l10n-id");
                                    });
                        }
                        if (gUnifiedExtensions._listView.getAttribute('visible') === "true") {
                            PanelMultiView.hidePopup(gUnifiedExtensions._listView.closest("panel"));
                        } else {
                            await PanelUI.showSubView("unified-extensions-view", event.target, event);
                            window.unifiedExtensionsEnhance.onViewShowing(gUnifiedExtensions._listView);
                        }
                    }, false))

                }
            });

            this.btn = CustomizableUI.getWidget('movable-unified-extensions').forWindow(window).node;

            var pi = document.createProcessingInstruction(
                'xml-stylesheet',
                'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(`
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
                }`) + '"'
            );
            this.style = document.insertBefore(pi, document.documentElement);
        },
        handleEvent(event) {
            switch (event.type) {
                case 'ViewShowing':
                    this.onViewShowing(event);
                    break;
                case 'click':
                    this.onClick(event);
                    break;
            }
        },
        async onViewShowing(event) {

            const list = gUnifiedExtensions._listView.querySelector(".unified-extensions-list");
            const extensions = await gUnifiedExtensions.getActiveExtensions();

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
        },
        onClick(event) {
            var { addon } = getParentOfLocalName(event.target, 'unified-extensions-item');
            var { classList } = event.target;
            if (classList.contains('unified-extensions-item-action') || classList.contains('unified-extensions-item-contents') || classList.contains('unified-extensions-item-name') || classList.contains('unified-extensions-item-message') || classList.contains('unified-extensions-item-icon')) {
                switch (event.button) {
                    case 0:
                        this.openAddonOptions(addon, event.target.ownerGlobal);
                        break;
                    case 1:
                        break;
                    case 2:
                        if (addon.userDisabled) {
                            addon.enable();
                            event.target.classList.remove('disabled');
                        } else {
                            addon.disable();
                            event.target.classList.add('disabled');
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
            if (this.btn)
                CustomizableUI.destroyWidget(this.btn.id);
            if (gUnifiedExtensions._listView) {
                gUnifiedExtensions._listView.removeEventListener("ViewShowing", unifiedExtensionsEnhance)
                gUnifiedExtensions._listView.removeEventListener("click", unifiedExtensionsEnhance)
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

    function uAlert(aMsg, aTitle, aCallback) {
        var callback = aCallback ? {
            observe: function (subject, topic, data) {
                if ("alertclickcallback" != topic)
                    return;
                aCallback.call(null);
            }
        } : null;
        var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        alertsService.showAlertNotification("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "unifiedExtensionsEnhance",
            aMsg + "", !!callback, "", callback);
    }

    function getParentOfLocalName(el, localName) {
        if (el == document) return;
        if (el.localName == localName) return el;
        return getParentOfLocalName(el.parentNode, localName);
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