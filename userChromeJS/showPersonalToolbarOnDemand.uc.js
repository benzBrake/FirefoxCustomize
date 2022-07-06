// ==UserScript==
// @name            showPersonalToolbarOnDemand.uc.js
// @description     按需显示书签工具栏
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @shutdown        window. showPersonalToolbarOnDemand.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    class showPersonalToolbarOnDemand {
        NOT_FOCUS_ON_URLBAR = true;
        TOOLBAR_ID = "PersonalToolbar";
        NEWTAB_URLS = [
            'about:newtab',
            'about:blank',
            'about:privatebrowsing',
            'about:home'
        ]
        constructor() {
            this.toggle();
            this.originalVisibility = Services.prefs.getStringPref("browser.toolbars.bookmarks.visibility");
            gBrowser.tabContainer.addEventListener('TabSelect', this);
            gBrowser.tabContainer.addEventListener('TabAttrModified', this);
        }
        toggle(win) {
            win || (win = Services.wm.getMostRecentWindow("navigator:browser"));
            let aDoc = win.document;
            const toolbar = aDoc.getElementById(this.TOOLBAR_ID);
            win.setToolbarVisibility(toolbar, this.NEWTAB_URLS.contain(win.gBrowser.currentURI.spec));
            if (this.NOT_FOCUS_ON_URLBAR) aDoc.getElementById("urlbar-input").blur();
        }
        handleEvent(event) {
            this.toggle(event.target.ownerGlobal);
        }
        destroy() {
            gBrowser.tabContainer.removeEventListener('TabSelect', this);
            gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
            Services.prefs.setStringPref("browser.toolbars.bookmarks.visibility", this.originalVisibility || "newtab");
        }
    }

    if (gBrowserInit.delayedStartupFinished) window.showPersonalToolbarOnDemand = new showPersonalToolbarOnDemand();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.showPersonalToolbarOnDemand = new showPersonalToolbarOnDemand();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

})();