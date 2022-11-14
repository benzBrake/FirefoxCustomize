// ==UserScript==
// @name           Sync Styles
// @version        1.0
// @author         Ryan
// @include        main
// @compatibility  Firefox 78
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    非浏览器同步主窗口 CSS 属性
// @onlyonce
// ==/UserScript==
(function () {
    'use strict';
    let { Components, setTimeout, clearTimeout } = window;
    let {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    window.SyncStyle = {
        init() {
            let { document } = window;
            this.initObserver();
            CustomizableUI.addListener(this.listener);
            Services.prefs.addObserver('browser.uidensity', this.observer);
            this.updateStyle(document.documentElement);
            window.addEventListener('unload', function () {
                if (this.mutationObserver)
                    this.mutationObserver.disconnect();
                if (this.STYLE) {
                    sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
                }
                Services.prefs.removeObserver("browser.uidensity", this.observer);
                CustomizableUI.removeListener(this.listener);
            });
        },
        initObserver() {
            let { document, MutationObserver } = window;
            // add a mutation for attribute styles
            this.mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.trigger(mutation.target)
                    }
                });
            });
            this.mutationObserver.observe(document.documentElement, {
                attributes: true,
            });
        },
        observer: function () {
            window.SyncStyle.trigger(window.document.documentElement);
        },
        listener: {
            onCustomizeEnd(win) {
                win.SyncStyle.trigger(win.document.documentElement);
            }
        },
        trigger(target) {
            clearTimeout(window.SyncStyle.timer);
            const { updateStyle } = window.SyncStyle;
            window.SyncStyle.timer = setTimeout(() => {
                updateStyle(target);
            }, 200);
        },
        updateStyle(documentElement) {
            const { ownerGlobal: window } = documentElement;
            const { getComputedStyle } = window;
            if (window.SyncStyle.STYLE) {
                sss.unregisterSheet(window.SyncStyle.STYLE.url, window.SyncStyle.STYLE.type);
            }
            let styles = getComputedStyle(documentElement);
            let cssArr = [];
            [...styles].forEach(function (name) {
                if (name.startsWith('--')) {
                    let val = styles.getPropertyValue(name);
                    cssArr.push(`${name}: ${val};`);
                }
            });
            let css = ':root{\n' + cssArr.join("\n") + "\n}";
            window.SyncStyle.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)),
                type: 2,
            }
            sss.loadAndRegisterSheet(window.SyncStyle.STYLE.url, window.SyncStyle.STYLE.type);
        }
    }

    window.SyncStyle.init();
})();