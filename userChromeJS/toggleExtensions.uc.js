// ==UserScript==
// @name            toggleExtensions.uc.js
// @description     一键切换扩展状态，用于修复便携版扩展图标问题
// @license         MIT License
// @startup         window.toggleExtensions.init();
// @shutdown        window.toggleExtensions.unload();
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

    if (window.toggleExtensions) {
        window.toggleExtensions.unload();
        delete window.toggleExtensions;
    }

    window.toggleExtensions = {
        init: function () {
            let ins = $("prefSep") || $("webDeveloperMenu") || $("browserToolsMenu");

            ins.parentNode.insertBefore($C('menuitem', {
                id: 'toggle-extensions',
                class: 'menuitem-iconic',
                label: '切换扩展状态(特殊用途)',
                image: 'chrome://global/skin/icons/settings.svg',
                onclick: 'toggleExtensions.toggle(event);',
            }), ins);

            let inited;
            try {
                inited = this.prefs.getBoolPref('inited');
            } catch (e) {
                inited = false;
            }

            if (!inited) {
                this.prefs.setBoolPref('inited', true);
                this.toggle();
            }
        },
        toggle: function (event) {
            if (event && event.shiftKey) toggleExtensions.prefs.setBoolPref('inited', false);
            AddonManager.getAddonsByTypes(['extension']).then(addons => addons.forEach(a => {
                if (!a.isSystem && !a.isBuiltin) {
                    if (a.isActive)
                        a.disable();
                    else
                        a.enable();
                }
            }))
        },
        unload: function () {
            let menu = $("toggle-extensions");
            menu && menu.parentNode.removeChild(menu);
            delete window.toggleExtensions;
        },
        get prefs() {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch("userChrome.toggleExtensions.")
        },
    }

    if (gBrowserInit.delayedStartupFinished) window.toggleExtensions.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.toggleExtensions.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

    function $(sel, aDoc) {
        return (aDoc || document).getElementById(sel);
    }

    function $C(name, attr) {
        let el = document.createXULElement(name);
        if (attr) Object.keys(attr).forEach(function (n) {
            el.setAttribute(n, attr[n])
        });
        return el;
    }

    function log(e) {
        Cu.reportError(e);
    }


})();