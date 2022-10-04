// ==UserScript==
// @name           Sync Styles
// @version        1.0
// @author         Ryan
// @include        *
// @compatibility  Firefox 78
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    非浏览器同步主窗口 CSS 属性
// ==/UserScript==
(function () {
    'use strict';
    const { Components, document, location } = window;
    const { Cu } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    class SyncStyles {
        constructor() {
            if (location.href.startsWith('chrome://browser/content/browser.x')) {
                this.initMain();
            } else {
                this.initStyles();
            }
        }
        initMain() {
            // add a mutation for attribute styles
            this.mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.trigger();
                    }
                });
            });
            this.mutationObserver.observe(document.documentElement, {
                attributes: true,
            });
        }
        initStyles() {
            let bw = Services.wm.getMostRecentWindow("navigator:browser");
            this.syncStyles(bw, window);
            window.addEventListener('unload', function () {
                if (window.document.documentElement.styles) {
                    removeElement(window.document.documentElement.styles);
                    delete window.document.documentElement.styles;
                }
            })
        }
        trigger() {
            clearTimeout(this.timer);
            const { syncStyles } = this;
            this.timer = setTimeout(() => {
                windows(function (document, win, location) {
                    if (!location.href.startsWith('chrome://browser/content/browser.x')) {
                        let bw = Services.wm.getMostRecentWindow("navigator:browser");
                        syncStyles(bw, win);
                    }
                })
            }, 200);
        }
        syncStyles(fromWin, toWin) {
            let doc = toWin.document;
            let styles = getComputedStyle(fromWin.document.documentElement);
            let cssArr = [];
            [...styles].forEach(function (name) {
                if (name.startsWith('--')) {
                    let val = styles.getPropertyValue(name);
                    cssArr.push(`${name}: ${val};`);
                }
            });
            let css = ":root{\n" + cssArr.join("\n") + "\n}";
            removeElement(doc.documentElement.syncedStyles);
            doc.documentElement.syncedStyles = addStyle(doc, css);
        }
    }

    function addStyle(doc, css) {
        var pi = doc.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return doc.insertBefore(pi, doc.documentElement);
    }

    function removeElement(elm) {
        if (elm && elm.parentNode) elm.parentNode.removeChild(elm);
    }

    function windows(fun) {
        let windows = Services.wm.getEnumerator(null);
        while (windows.hasMoreElements()) {
            let win = windows.getNext();
            let frames = win.docShell.getAllDocShellsInSubtree(Ci.nsIDocShellTreeItem.typeAll, Ci.nsIDocShell.ENUMERATE_FORWARDS);
            let res = frames.some(frame => {
                let fWin = frame.domWindow;
                let { document, location } = fWin;
                if (fun(document, fWin, location))
                    return true;
            });
            if (res)
                break;
        }
    }

    new SyncStyles();
})();