// ==UserScript==
// @name            syncTabsMod.uc.js
// @description     增强受同步的标签页按钮
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @id              [KFSRX773]
// @shutdown        window.syncTabsMod.onDestroy(win);
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/
// @onlyonce
// ==/UserScript==
(function (window, document) {
    window.syncTabsMod = {
        OPEN_ALL_BTN: {
            id: "PanelUI-remotetabs-openAll",
            label: "打开所有",
            onclick: "window.syncTabsMod.openAll(event);",
            class: "subviewbutton",
        },
        init: function () {
            window.addEventListener("aftercustomization", this, false);
            this.delayedStartup(this);
        },
        delayedStartup: function (self) {
            self.view = PanelMultiView.getViewNode(
                document,
                "PanelUI-remotetabs"
            );
            if (!self.view) return;
            if (!self.view.querySelector('#PanelUI-remotetabs-openAll')) {
                self.view.querySelector('#PanelUI-remotetabs-separator').before($C(document, "toolbarbutton", self.OPEN_ALL_BTN));
            }

            this.view.querySelectorAll('.subviewbutton[itemtype="tab"]').forEach((node) => {
                node.addEventListener('click', this, true)
            });

            this.observer = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            node.addEventListener('click', this, true)
                        })
                    }
                }
            });

            this.observer.observe(self.view.querySelector("#PanelUI-remotetabs-tabslist"), { childList: true });
        },
        openAll: function (event) {
            this.view.querySelectorAll('.subviewbutton[itemtype="tab"]').forEach(el => {
                let url = el.getAttribute('targetURI');
                if (url) {
                    this.openWebLink(url, 'tab');
                }
            });
        },
        handleEvent: function (event) {
            if (event.type === "click") {
                const { target: node } = event;
                switch (event.button) {
                    case 2:
                        event.preventDefault();
                        event.stopPropagation();
                        this.openWebLink(node.getAttribute("targetURI"), "tabshifted");
                        break;
                }
            } else if (event.type === "aftercustomization") {
                setTimeout(function (self) { self.delayedStartup(self); }, 0, this);
            }
        },
        openWebLink: function (url, where) {
            openWebLinkIn(url, where, {
                triggeringPrincipal: where === 'current' ?
                    gBrowser.selectedBrowser.contentPrincipal :
                    Services.scriptSecurityManager.createNullPrincipal({
                        userContextId: gBrowser.selectedBrowser.getAttribute(
                            "userContextId"
                        )
                    })
            });
        },
        onDestroy: function (win) {
            $R(this.view.querySelector("#" + this.OPEN_ALL_BTN.id));
            win.removeEventListener("aftercustomization", this, false);
            this.observer.disconnect();
            delete win.syncTabsMod;
        }
    }

    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    function $R(el) {
        if (!el || !el.parentNode) return;
        el.parentNode.removeChild(el);
    }

    if (typeof _ucUtils !== 'undefined') {
        _ucUtils.startupFinished()
            .then(() => {
                window.syncTabsMod.init();
            });
    } else {
        if (gBrowserInit.delayedStartupFinished) window.BMMultiColumn.init();
        else {
            let delayedListener = (subject, topic) => {
                if (topic == "browser-delayed-startup-finished" && subject == window) {
                    Services.obs.removeObserver(delayedListener, topic);
                    window.syncTabsMod.init();
                }
            };
            Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
        }
    }
})(window, window.document)