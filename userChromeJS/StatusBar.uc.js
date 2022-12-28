// ==UserScript==
// @name            StatusBar.uc.js
// @description     状态栏
// @license         MIT License
// @compatibility   Firefox 107
// @version         0.0.1
// @charset         UTF-8
// @include         chrome://browser/content/browser.xul
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            参考自 Floorp 浏览器的状态栏脚本
// ==/UserScript==
(function () {
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    window.StatusBar = {
        init: function () {
            const toolbarElem = window.MozXULElement.parseXULToFragment(
                `
            <toolbar id="status-bar" customizable="true" style="border-top: 1px solid var(--chrome-content-separator-color)"
                     class="browser-toolbar customization-target" mode="icons" context="toolbar-context-menu" accesskey="A">
                     <hbox id="status-text" align="center" flex="1" class="statusbar-padding"/>
            </toolbar>
            `
            );

            document.getElementById("navigator-toolbox").appendChild(toolbarElem);

            CustomizableUI.registerArea("status-bar", {
                type: CustomizableUI.TYPE_TOOLBAR,
                defaultPlacements: [
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
                label: "状态栏",
                type: "checkbox",
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
        },
        togglePref: function () {
            let checked = document.getElementById("toggle_status-bar").getAttribute("checked") == "true";
            Services.prefs.setBoolPref("browser.display.statusbar", checked);
        },
        displayStatusbar: `
            background: var(--toolbar-bgcolor);
            border: none !important;
        `,
        show: function () {
            //remove CSS
            document.getElementById("statusBarCSS")?.remove();

            //move statustext to statusbar
            document.getElementById("status-text").appendChild(document.getElementById("statuspanel-label"));

            //add CSS
            document.getElementById("statuspanel-label").setAttribute("style", this.displayStatusbar);
        },
        hiddenStatusBar: `
            #status-bar {
                display: none;
            }
            :root[customizing] #status-bar {
                display: inherit !important;
            }
        `,
        hide: function () {
            var Tag = document.createElement("style");
            Tag.setAttribute("id", "statusBarCSS");
            Tag.innerText = this.hiddenStatusBar;
            document.getElementsByTagName("head")[0].insertAdjacentElement("beforeend", Tag);

            //revert statustext to statuspanel
            document.getElementById("statuspanel").appendChild(document.getElementById("statuspanel-label"));

            //remove CSS
            document.getElementById("statuspanel-label").removeAttribute("style");
        }
    }

    function $C(name, attr) {
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

    if (gBrowserInit.delayedStartupFinished) window.StatusBar.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.StatusBar.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})()