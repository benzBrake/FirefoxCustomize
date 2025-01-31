// ==UserScript==
// @name            StatusBar.uc.js
// @description     状态栏
// @license         MIT License
// @compatibility   Firefox 107
// @version         0.0.2
// @charset         UTF-8
// @include         chrome://browser/content/browser.xul
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            0.0.2 修正启用 TabMixPlus 扩展后看不见状态栏
// @note            参考自 Floorp 浏览器的状态栏脚本
// ==/UserScript==
(function (css) {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const MENU_LABEL = "状态栏";

    window.StatusBar = {
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
            <toolbar id="status-bar" customizable="true" style="border-top: 1px solid var(--chrome-content-separator-color)"
                     class="browser-toolbar customization-target" mode="icons" context="toolbar-context-menu" accesskey="A">
                     <hbox id="status-text" align="center" flex="1" class="statusbar-padding">
                         <vbox id="status-text-inner" flex="1" hidden="true" />
                     </hbox>
            </toolbar>
            `
            );

            //insert style
            this.style = addStyle(css);

            document.getElementById("navigator-toolbox").appendChild(toolbarElem);

            CustomizableUI.registerArea("status-bar", {
                type: CustomizableUI.TYPE_TOOLBAR,
                defaultPlacements: [
                    "status-text",
                    "screenshot-button",
                    "zoom-controls",
                    "fullscreen-button",
                ],
            });

            CustomizableUI.registerToolbarNode(document.getElementById("status-bar"));


            //move elem to bottom of window
            document.body.appendChild(document.getElementById("status-bar"));

            //menuitem for status bar
            let toggleItem = $C("menuitem", {
                id: "toggle_status-bar",
                label: MENU_LABEL,
                type: "checkbox",
                accesskey: "S",
                checked: String(Services.prefs.getBoolPref("browser.display.statusbar", false)),
                oncommand: "StatusBar.togglePref();",
            });
            document.getElementById("toolbarItemsMenuSeparator").after(toggleItem);

            let checked = Services.prefs.getBoolPref("browser.display.statusbar", false);
            document.getElementById("toggle_status-bar").setAttribute("checked", String(checked));
            if (checked) {
                this.show();
            } else {
                this.hide();
            }

            Services.prefs.addObserver("browser.display.statusbar", function () {
                let checked = Services.prefs.getBoolPref("browser.display.statusbar", false);
                document.getElementById("toggle_status-bar").setAttribute("checked", String(checked));
                if (checked) {
                    StatusBar.show();
                } else {
                    StatusBar.hide();
                }
            });

            this.observer = new MutationObserver(this.observe);
            this.observer.observe(document.getElementById("statuspanel"), {
                attributes: true,
                attributeFilter: [
                    "hidden",
                    "inactive",
                    "previoustype"
                ]
            });
        },
        togglePref: function () {
            let checked = document.getElementById("toggle_status-bar").getAttribute("checked") == "true";
            Services.prefs.setBoolPref("browser.display.statusbar", checked);
        },
        show: function () {
            //move statustext to statusbar
            document.getElementById("status-text-inner").appendChild(document.getElementById("statuspanel-label"));

            //remove hidden attribute
            document.getElementById("status-bar").removeAttribute("hidden");
        },
        hide: function () {
            //add hidden attribute
            document.getElementById("status-bar").setAttribute("hidden", "true");

            //revert statustext to statuspanel
            document.getElementById("statuspanel").appendChild(document.getElementById("statuspanel-label"));
        },
        observe: function (mutationList, observer) {
            const statusText = document.getElementById("status-text-inner");
            for (const mutation of mutationList) {
                if (mutation.type === 'attributes') {
                    if (mutation.target.hasAttribute(mutation.attributeName)) {
                        statusText.setAttribute(mutation.attributeName, mutation.target.getAttribute(mutation.attributeName));
                    } else {
                        statusText.removeAttribute(mutation.attributeName);
                    }
                }
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
            if (n.startsWith("on")) {
                const [e, fn] = [n.slice(2), attr[n]];
                el.addEventListener(e, typeof fn === "string" ? new Function(fn) : fn);
            } else {
                el.setAttribute(n, attr[n])
            }
        });
        return el;
    }

    function addStyle (css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    if (gBrowserInit.delayedStartupFinished) window.StatusBar.delayedInit();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.StatusBar.delayedInit();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
#status-text-inner[inactive="true"] {
    display: none;
}
#status-text-inner #statuspanel-label {
    background: var(--toolbar-bgcolor);
    border: none !important;
}
:root[customizing] #status-bar {
    display: inherit !important;
}
`)