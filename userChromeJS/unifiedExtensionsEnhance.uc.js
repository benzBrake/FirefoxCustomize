// ==UserScript==
// @name            unifiedExtensionsEnhance.uc.js
// @description     扩展管理按钮增强，左键点击切换状态，点击设置按钮打开设置页面
// @author          Ryan
// @include         main
// @version         0.1.0
// @shutdown        window.unifiedExtensionsEnhance.destroy();
// @compatibility   Firefox 104
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
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
        viewInited: false,
        init: function () {
            var originalBtn = CustomizableUI.getWidget('unified-extensions').forWindow(window).node;
            if (!originalBtn) {
                throw new Error("Do not support this vesion[%s] of firefox!".replace("%s", this.appVersion));
            }
            CustomizableUI.createWidget({
                id: 'movable-unified-extensions',
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                style: 'list-style-image: url("chrome://mozapps/skin/extensions/extension.svg")',
                onCreated: function (node) {
                    ["kepress", "mousedown"].forEach(aEvent => {
                        node.addEventListener(aEvent, (event) => {
                            event.stopPropagation();
                            const view = document.getElementById('unified-extensions-view');
                            if (view) {
                                if (!unifiedExtensionsEnhance.inited) {
                                    view.addEventListener('click', unifiedExtensionsEnhance, false);
                                    view.addEventListener('ViewShowing', unifiedExtensionsEnhance, false);
                                    unifiedExtensionsEnhance.inited = true;
                                }
                            }
                            if (view.getAttribute('visible') === "true")
                                view.parentNode.parentNode.parentNode.parentNode.hidePopup();
                            else
                                gUnifiedExtensions.togglePanel(node, event);
                        })
                    })
                }
            });

            var pi = document.createProcessingInstruction(
                'xml-stylesheet',
                'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(`
                #unified-extensions {
                    display: none !important;
                }
                #movable-unified-extensions {
                    list-style-image: url("chrome://mozapps/skin/extensions/extension.svg");
                }`) + '"'
            );
            this.style = document.insertBefore(pi, document.documentElement);
        },
        handleEvent: function (event) {
            let { target } = event
            switch (event.type) {
                case 'ViewShowing':
                    let list = $Q('.unified-extensions-list', target);
                    setTimeout(function () {
                        list.querySelectorAll('unified-extensions-item').forEach(uItem => {
                            if (!uItem.addon.optionsURL) {
                                $Q('.unified-extensions-item-open-submenu', uItem).setAttribute('disabled', true);
                            }
                        });
                    }, 300);
                    break;
                case 'click':
                    var uItem = getParentOfLocalName(target, 'unified-extensions-item');
                    var { addon } = uItem;
                    if (target.localName = "unified-extensions-item" || target.classList.contains("unified-extensions-item-contents")) {
                        switch (event.button) {
                            case 0:
                                if (addon.userDisabled) {
                                    addon.enable();
                                    uItem.classList.remove('disabled');
                                } else {
                                    addon.disable();
                                    uItem.classList.add('disabled');
                                }
                                break;
                        }
                    }

                    if (target.classList.contains('unified-extensions-item-open-submenu')) {
                        var { addon } = target.parentNode;
                        unifiedExtensionsEnhance.openAddonOptions(addon, window);
                    }
                    break;
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
            CustomizableUI.destroyWidget('movable-unified-extensions');
            var view = $('unified-extensions-view');
            if (view && this.inited) {
                view.removeEventListener('click', unifiedExtensionsEnhance, false);
                view.removeEventListener('ViewShowing', unifiedExtensionsEnhance, false);
            }
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.unifiedExtensionsEnhance;
        },
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }
    function $Q(sel, aDoc) {
        return (aDoc || document).querySelector(sel);
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

    function getParentOfLocalName(el, localName) {
        if (el == document) return;
        if (el.localName == localName) return el;
        return getParentOfLocalName(el.parentNode, localName);
    }

    window.unifiedExtensionsEnhance.init();
})()