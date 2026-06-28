// ==UserScript==
// @name            LocationBar.uc.js
// @description     地址栏内工具栏
// @license         MIT License
// @compatibility   Firefox 149
// @version         0.0.5
// @charset         UTF-8
// @include         chrome://browser/content/browser.xul
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            2025-08-26 增加固定扩展按钮到地址栏内工具栏的功能
// @note            2026-04-05 升级兼容性至 Firefox 149+，修复 checkbox checked 属性检测
// @note            2026-06-17 修复 Firefox 152 中按钮图标显示异常
// @note            2026-06-28 修复右键菜单勾选状态持久化错误
// @note            参考自 Floorp 浏览器的状态栏脚本
// ==/UserScript==
(function (css) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const MENU_LABEL = "地址栏快捷工具";
    const PIN_ADDON_BUTTON_TO_LOCATION_BAR = false; // 是否默认将扩展按钮固定到地址栏
    const PIN_ADDON_BUTTON_TO_LOCATION_BAR_START = true; // 是否固定扩展按钮到地址栏开始处

    window.LocationBar = {
        delayedInit: function () {
            if (typeof Tabmix !== "undefined") {
                Tabmix._deferredInitialized.promise.then(() => {
                    this.init();
                })
            } else {
                this.init();
            }
        },
        init: function () {
            const toolbarElem = window.MozXULElement.parseXULToFragment(
                `
            <toolbar id="location-bar" customizable="true"
                     class="browser-toolbar customization-target" mode="icons"
                     context="toolbar-context-menu" align="center">
            </toolbar>
            `
            );

            //insert style
            const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
            const style = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)),
                type: sss.AUTHOR_SHEET
            }
            sss.loadAndRegisterSheet(style.url, style.type);

            document.getElementById("navigator-toolbox").appendChild(toolbarElem);

            CustomizableUI.registerArea("location-bar", {
                type: CustomizableUI.TYPE_TOOLBAR
            });

            CustomizableUI.registerToolbarNode(document.getElementById("location-bar"));

            //move elem into urlbar
            document.getElementById("page-action-buttons").after(document.getElementById("location-bar"));

            //menuitem for status bar
            let toggleItem = $C("menuitem", {
                id: "toggle_location-bar",
                label: MENU_LABEL,
                type: "checkbox",
                accesskey: "L"
            });

            this.setMenuItemChecked(toggleItem, Services.prefs.getBoolPref("browser.display.locationbar", false));

            toggleItem.addEventListener("command", function () {
                LocationBar.togglePref();
            });

            document.getElementById('toolbar-context-menu').addEventListener('popupshowing', function () {
                if (window.LocationBar) {
                    this.insertBefore(toggleItem, this.querySelector("#viewToolbarsMenuSeparator"));
                }
            }, { once: true });

            let checked = Services.prefs.getBoolPref("browser.display.locationbar", false);
            if (checked) {
                this.show();
            } else {
                this.hide();
            }

            Services.prefs.addObserver("browser.display.locationbar", function () {
                let checked = Services.prefs.getBoolPref("browser.display.locationbar", false);
                const toggleItem = document.getElementById("toggle_location-bar");

                LocationBar.setMenuItemChecked(toggleItem, checked);
                if (checked) {
                    LocationBar.show();
                } else {
                    LocationBar.hide();
                }
            });

            if (PIN_ADDON_BUTTON_TO_LOCATION_BAR) {
                this.ORIGINAL_PIN_FN = gUnifiedExtensions.pinToToolbar;
                gUnifiedExtensions.pinToToolbar = function (widgetId, shouldPinToToolbar) {
                    let newArea = shouldPinToToolbar
                        ? "location-bar"
                        : CustomizableUI.AREA_ADDONS;
                    let newPosition = 0;
                    if (!PIN_ADDON_BUTTON_TO_LOCATION_BAR_START && shouldPinToToolbar) {
                        newPosition = undefined;
                    }
                    CustomizableUI.addWidgetToArea(widgetId, newArea, newPosition);
                }
            }

            syncStyles(document.getElementById("urlbar"), document.getElementById("location-bar"));

            window.addEventListener("beforecustomization", this, false);
            window.addEventListener("aftercustomization", this, false);
        },
        togglePref: function () {
            let checked = Services.prefs.getBoolPref("browser.display.locationbar", false);
            Services.prefs.setBoolPref("browser.display.locationbar", !checked);
        },
        isMenuItemChecked: function (menuItem) {
            return menuItem?.getAttribute("checked") === "true";
        },
        setMenuItemChecked: function (menuItem, checked) {
            if (!menuItem) {
                return;
            }
            if (checked) {
                menuItem.setAttribute("checked", "true");
            } else {
                menuItem.removeAttribute("checked");
            }
        },
        show: function () {
            document.getElementById("location-bar").classList.remove("optional-hidden");
        },
        hide: function () {
            document.getElementById("location-bar").classList.add("optional-hidden");
        },
        handleEvent: function (event) {
            const locationBar = document.getElementById("location-bar");
            const urlbar = document.getElementById("urlbar");
            const navBar = document.getElementById("nav-bar");
            const pageActionButtons = document.getElementById("page-action-buttons");

            if (!locationBar) {
                return;
            }

            switch (event.type) {
                case "beforecustomization":
                    navBar?.appendChild(locationBar);
                    break;
                case "aftercustomization":
                    pageActionButtons?.after(locationBar);
                    syncStyles(urlbar, locationBar);
                    break;
            }
        }
    }

    function $C (name, attr) {
        const appVersion = Services.appinfo.version.split(".")[0];
        attr || (attr = {});
        var el;
        if (appVersion >= 69) {
            el = document.createXULElement(name);
        } else {
            el = document.createElement(name);
        }
        if (attr) Object.keys(attr).forEach(function (n) {
            el.setAttribute(n, attr[n])
        });
        return el;
    }

    function syncStyles (source, target, key = {
        '--urlbar-inner-border-radius': '--location-bar-button-radius'
    }) {
        if (!source || !target) return;
        let styles = getComputedStyle(source);
        for (const [sourceKey, targetKey] of Object.entries(key)) {
            const value = styles.getPropertyValue(sourceKey);
            if (value) {
                target.style.setProperty(targetKey, value);
            }
        }
    }

    if (gBrowserInit.delayedStartupFinished) window.LocationBar.delayedInit();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.LocationBar.delayedInit();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
:is(#urlbar-input-container,.urlbar-input-container) .optional-hidden {
    visibility: collapse;
}
:is(#urlbar-input-container,.urlbar-input-container) #location-bar {
    --toolbarbutton-padding-outer: 0;
    background-color: transparent;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:not([disabled="true"]):is([open], [checked], :hover:active) > .toolbarbutton-icon, :is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:not([disabled="true"]):is([open], [checked], :hover:active) > .toolbarbutton-text, :is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:not([disabled="true"]):is([open], [checked], :hover:active) > .toolbarbutton-badge-stack {
    background-color: transparent;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .chromeclass-toolbar-additional {
    height: unset;
    width: unset;
    margin-inline: 0px;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:has(> .toolbarbutton-badge-stack) {
    width: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
    height: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
    border-radius: var(--location-bar-button-radius);
    padding: 0 var(--urlbar-icon-padding) !important;
    color: inherit;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1 > .toolbarbutton-badge-stack {
    padding: var(--urlbar-icon-padding) !important;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1 > .toolbarbutton-icon {
    padding: 0 var(--urlbar-icon-padding) !important;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar :where(#reload-button, #stop-button) > .toolbarbutton-icon {
    width: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
    height: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:hover {
    background-color: var(--urlbar-box-hover-bgcolor);
    color: var(--urlbar-box-hover-text-color);
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:hover:active {
    background-color: var(--urlbar-box-active-bgcolor);
    color: var(--urlbar-box-hover-text-color);
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:not(#reload-button):not(#stop-button) {
    padding: 0 !important;
}
:is(#urlbar-input-container,.urlbar-input-container) > #location-bar .toolbarbutton-1:not(#reload-button):not(#stop-button) > .toolbarbutton-icon {
    width: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
    height: calc(var(--urlbar-min-height) - 2px - 2 * var(--urlbar-container-padding));
    padding: var(--urlbar-icon-padding) !important;
}
:is(#urlbar-input-container,.urlbar-input-container) #location-bar toolbarbutton {
    --toolbarbutton-hover-background: transparent;
}
:root[uidensity="compact"] :is(#urlbar-input-container,.urlbar-input-container) #location-bar toolbarbutton > .toolbarbutton-badge-stack > .toolbarbutton-badge {
    margin-inline-end: 0 !important;
}

:is(#urlbar-input-container,.urlbar-input-container) #location-bar #stop-reload-button[animate] > #reload-button > .toolbarbutton-icon, :is(#urlbar-input-container,.urlbar-input-container) #location-bar #stop-reload-button[animate] > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon {
    fill: var(--urlbar-box-hover-text-color);
}
`)
