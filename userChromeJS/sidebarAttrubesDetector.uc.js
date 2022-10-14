// ==UserScript==
// @name           sidebarAttrubesDetector.uc.js
// @description    主窗口新增 sidebarCommand 属性
// @version        1.0
// @author         Ryan
// @include        main
// @compatibility  Firefox 78
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// ==/UserScript==

(function () {
    "use strict";
    class sidebarAttrubesDetector {
        constructor() {
            this.sidebarBox = document.getElementById("sidebar-box");
            this.observer = new MutationObserver(this.observe);
            this.observer.observe(this.sidebarBox, {
                attributes: true,
                attributeFilter: [
                    "hidden",
                    "sidebarcommand",
                    "hidden"
                ]
            });
            document.documentElement.setAttribute('sidebarCommand', document.getElementById("sidebar-box").getAttribute("sidebarcommand") || "");
            document.documentElement.setAttribute('sidebarHidden', document.getElementById("sidebar-box").getAttribute("hidden") || "");
        }
        observe() {
            document.documentElement.setAttribute('sidebarCommand', document.getElementById("sidebar-box").getAttribute("sidebarcommand") || "");
            document.documentElement.setAttribute('sidebarHidden', document.getElementById("sidebar-box").getAttribute("hidden") || "");
        }
    }

    if (gBrowserInit.delayedStartupFinished) new sidebarAttrubesDetector();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new sidebarAttrubesDetector();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();