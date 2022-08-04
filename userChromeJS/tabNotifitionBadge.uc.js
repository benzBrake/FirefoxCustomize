// ==UserScript==
// @name            tabNotifitionBadge.uc.js
// @license         MIT License
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    class tabNotifitionBadge {
        constructor() {
            gBrowser.tabs.forEach(t => this.getNumFromTab(t));
            gBrowser.tabContainer.addEventListener('TabAttrModified', this, false);
            this.MAX_NUM = 100;
            this.style = addStyle(css);
        }
        handleEvent(event) {
            let tab = event.target;
            let num = this.getNumFromTab(tab);
            let badge = tab.querySelector('.tab-badge');
            if (!badge) {
                badge = this.createBadge(0);
                tab.querySelector(".tab-icon-stack").appendChild(badge);
                tab.setAttribute('notifition', 0);
            }
            if (num > this.MAX_NUM) return;
            badge.setAttribute('num', num);
            badge.innerHTML = num;
            tab.setAttribute('notifition', num);
        }
        getNumFromTab(tab) {
            let title = tab.querySelector(".tab-text").innerHTML;
            let matches = title.match(/^\((\d+)\+?\)/);
            if (matches && matches.length === 2 && matches[1] < this.MAX_NUM) {
                return matches[1];
            }
            return 0;
        }
        createBadge(num) {
            let badge = this.createElementNS(null, 'html:label', {
                class: 'tab-badge toolbarbutton-badge',
                num: num,
            });
            badge.innerHTML = num;
            return badge;
        }
        createElementNS(namespace, type, props) {
            if (!type) return null;
            namespace || (namespace = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
            if (type.startsWith("html:") && typeof namespace !== "string") namespace = "http://www.w3.org/1999/xhtml";
            let el = document.createElementNS(namespace, type);
            for (let prop in props) {
                el.setAttribute(prop, props[prop])
            }
            return el;
        }
    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    if (gBrowserInit.delayedStartupFinished) window.tabNotifitionBadge = new tabNotifitionBadge();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.tabNotifitionBadge = new tabNotifitionBadge();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
.tabbrowser-tab[pinned="true"][soundplaying="true"]:not([notifition="0"]) .tab-icon-overlay {
    visibility: collapse;
}
/* ↓ remove the block comment to hide sound indicator on unpinned tabs.↓ */
/*
.tabbrowser-tab[soundplaying="true"]:not([pinned="true"]):not([notifition="0"]) .tab-icon-overlay {
    visibility: collapse;
}
.tabbrowser-tab[soundplaying="true"]:not([pinned="true"]):not([notifition="0"]) :not(.tab-icon-overlay) {
    opacity: 1 !important;
}
*/
.tabbrowser-tab .tab-icon-stack .tab-badge[num="0"] {
    visibility: collapse;
}
.tabbrowser-tab .tab-icon-stack .tab-badge {
    margin-inline-end: 0px !important;
    /* write your style here */
}
`);