// ==UserScript==
// @name            syncTabsMod.uc.js
// @description     增强受同步的标签页，强制新标签页面打开，增加打开全部
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/syncedtabs/sidebar.xhtml
// @shutdown        window.syncTabsMod.onDestroy(win);
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/
// ==/UserScript==
(function () {
    window.syncTabsMod = {
        OPEN_ALL_BTN: {
            id: "PanelUI-remotetabs-openAll",
            label: gNavigatorBundle.getString("menuOpenAllInTabs.label"),
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
                self.view.querySelector('#PanelUI-remotetabs-separator').before(createXULElement(document, "toolbarbutton", self.OPEN_ALL_BTN));
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
        initSidebar: function () {
            this.onOpenSelected = syncedTabsDeckComponent.tabListComponent._view.onOpenSelected;
            const regex = /\s*let\s+where.*/gm;
            const subst = `\n    let { getChromeWindow } = ChromeUtils.import('resource:///modules/syncedtabs/util.js');\n    let where = event.button === 0 ? 'tabshifted' : getChromeWindow(syncedTabsDeckComponent.tabListComponent._view._window).whereToOpenLink(event);`;
            eval('syncedTabsDeckComponent.tabListComponent._view.onOpenSelected = function ' + syncedTabsDeckComponent.tabListComponent._view.onOpenSelected.toString().replace(regex, subst));
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
                let url;
                if (node.hasAttribute("targetURI")) {
                    url = node.getAttribute("targetURI");
                } else {
                    let tab = node.parentNode.parentNode;
                    if (tab.classList.contains("tab") && tab.hasAttribute("data-url")) {
                        url = tab.getAttribute("data-url");
                    }
                }
                if (url)
                    switch (event.button) {
                        case 0:
                            event.preventDefault();
                            event.stopPropagation();
                            this.openWebLink(url, "tabshifted");
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
            if (this.view) {
                removeElement(this.view.querySelector("#" + this.OPEN_ALL_BTN.id));
                win.removeEventListener("aftercustomization", this, false);
                this.observer.disconnect();
            } else if (this.onOpenSelected) {
                syncedTabsDeckComponent.tabListComponent._view.onOpenSelected = this.onOpenSelected;
            }
            delete win.syncTabsMod;
        }
    }

    function createXULElement (aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return setAttributes(el, attrs, skipAttrs);
    }

    function setAttributes (el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (key.startsWith('on')) {
                    const [e, f] = [key.slice(2), obj[key]];
                    const fn = typeof f === 'function' ? f : new Function(f);
                    el.addEventListener(e, fn, false)
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    function removeElement (el) {
        if (!el || !el.parentNode) return;
        el.parentNode.removeChild(el);
    }
    if (location.href.startsWith("chrome://browser/content/browser.x")) {
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
    } else if (location.href.startsWith("chrome://browser/content/syncedtabs/sidebar.xhtml")) {
        window.syncTabsMod.initSidebar();
    }
})()
