// ==UserScript==
// @name           autoHideTabsToolbar
// @description    只有一个标签时隐藏标签栏目
// @namespace      https://github.com/benzBrake/FirefoxCustomize/
// @author         Ryan, Dobrov
// @include        main
// @license        MIT License
// @compatibility  Firefox 90
// @charset        UTF-8
// @version        0.0.1
// @shutdown       window.autoHideTabsToolbar.destroy(win);
// @homepageURL    https://forum.mozilla-russia.org/viewtopic.php?id=76642
// @downloadURL    https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS/AutoHideTabsToolbar.uc.js
// ==/UserScript==
window.autoHideTabsToolbar = {
    init(win) {
        var newtab = this.newtab = document.querySelector("#tabs-newtab-button");
        if (!newtab) return;
        newtab.addEventListener("animationstart", this);
        this.style = "data:text/css;charset=utf-8," + encodeURIComponent(`
            :root[hideTabsToolbar="true"] #TabsToolbar:not([customizing]) {
                visibility: collapse !important;
            }
            :root[hideTabsToolbar="true"] #toolbar-menubar[autohide="true"][inactive="true"]:not([customizing="true"]) {
                visibility: visible !important;
                height: auto !important;
            }
            :root[hideTabsToolbar="true"] #toolbar-menubar[autohide="true"] #menubar-items{
                visibility: visible;
            }
            :root[hideTabsToolbar="true"] #toolbar-menubar[autohide="true"][inactive="true"] #menubar-items{
                visibility: collapse;
            }
            :root[hideTabsToolbar="true"] #toolbar-menubar[autohide="true"] .titlebar-buttonbox-container {
                visibility: visible !important;
                display: flex !important;
            }
            #main-window[hideTabsToolbar="true"]:not([customizing]) box > #navigator-toolbox {
                padding-bottom: 0 !important;
            }
            #tabs-newtab-button {
                opacity: 1;
                animation-name: toolbar_visible !important;
                animation-timing-function: step-start !important;
                animation-duration: .1s !important;
                animation-iteration-count: 1 !important;
                animation-delay: 0s !important;
            }
            .tabbrowser-tab[first-visible-tab="true"][last-visible-tab="true"] ~ #tabs-newtab-button,
            .tabbrowser-tab[first-visible-tab="true"][last-visible-tab="true"] ~ #tabbrowser-arrowscrollbox-periphery > #tabs-newtab-button {
                opacity: 0;
                animation-name: toolbar_hide !important;
            }
            @keyframes toolbar_visible {
                from { opacity: 0;}
                to {opacity: 1;}
            }
            @keyframes toolbar_hide {
                from {opacity: 1;}
                to {opacity: 0;}
            }
        `);
        windowUtils.loadSheetUsingURIString(this.style, windowUtils.USER_SHEET);
    },
    handleEvent(e) {
        this[e.animationName]?.();
    },
    toolbar_visible() {
        document.documentElement.setAttribute("hideTabsToolbar", "false");
    },
    toolbar_hide() {
        document.documentElement.setAttribute("hideTabsToolbar", "true");
    },
    destroy() {
        windowUtils.removeSheetUsingURIString(this.style, windowUtils.USER_SHEET);
        this.newtab.removeEventListener("animationstart", this);
    }
}
window.autoHideTabsToolbar.init(window);