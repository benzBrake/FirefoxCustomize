// ==UserScript==
// @name            tabNotifitionBadge.uc.js
// @license         MIT License
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @compatibility   Firefox 69+
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    class tabNotificationBadge {
        static MAX_NUM = 99;

        constructor() {
            this.style = addStyle(css);
            this.titleObservers = new WeakMap();
            this.pendingTabs = new Set();
            this.flushScheduled = false;

            gBrowser.tabContainer.addEventListener("TabAttrModified", this, false);
            gBrowser.tabContainer.addEventListener("TabOpen", this, false);
            gBrowser.tabContainer.addEventListener("TabClose", this, false);
            gBrowser.tabContainer.addEventListener("TabSelect", this, false);

            gBrowser.tabs.forEach(tab => this.trackTab(tab));
            this.refreshAllTabs();
        }

        handleEvent(event) {
            const tab = event.target;
            switch (event.type) {
                case "TabOpen":
                    this.trackTab(tab);
                    this.queueUpdate(tab);
                    break;
                case "TabClose":
                    this.untrackTab(tab);
                    break;
                case "TabAttrModified":
                case "TabSelect":
                    this.queueUpdate(tab);
                    break;
            }
        }

        trackTab(tab) {
            this.ensureBadge(tab);
            this.observeTitle(tab);
        }

        untrackTab(tab) {
            const current = this.titleObservers.get(tab);
            if (current) {
                current.observer.disconnect();
                this.titleObservers.delete(tab);
            }
            this.pendingTabs.delete(tab);
        }

        refreshAllTabs() {
            gBrowser.tabs.forEach(tab => this.queueUpdate(tab));
        }

        queueUpdate(tab) {
            if (!tab?.isConnected) {
                return;
            }
            this.pendingTabs.add(tab);
            if (this.flushScheduled) {
                return;
            }
            this.flushScheduled = true;
            window.requestAnimationFrame(() => this.flushUpdates());
        }

        flushUpdates() {
            this.flushScheduled = false;
            const tabs = Array.from(this.pendingTabs);
            this.pendingTabs.clear();
            tabs.forEach(tab => this.updateTab(tab));
        }

        observeTitle(tab) {
            const titleNode = tab.querySelector(".tab-text");
            if (!titleNode) {
                return;
            }
            const current = this.titleObservers.get(tab);
            if (current?.node === titleNode) {
                return;
            }
            if (current) {
                current.observer.disconnect();
            }
            const observer = new MutationObserver(() => this.queueUpdate(tab));
            observer.observe(titleNode, {
                attributes: true,
                attributeFilter: ["label", "value"],
                childList: true,
                characterData: true,
                subtree: true,
            });
            this.titleObservers.set(tab, { node: titleNode, observer });
        }

        updateTab(tab) {
            if (!tab?.isConnected) {
                return;
            }

            this.observeTitle(tab);
            const badge = this.ensureBadge(tab);
            const state = this.resolveBadgeState(tab);
            const displayValue = state.mode === "number" ? String(state.value) : "";

            if (tab.getAttribute("tab-badge-state") !== state.mode) {
                tab.setAttribute("tab-badge-state", state.mode);
            }
            if (tab.getAttribute("notification") !== displayValue) {
                tab.setAttribute("notification", displayValue);
            }
            if (badge.getAttribute("badge-mode") !== state.mode) {
                badge.setAttribute("badge-mode", state.mode);
            }
            if (badge.getAttribute("num") !== displayValue) {
                badge.setAttribute("num", displayValue);
            }
            if (badge.textContent !== displayValue) {
                badge.textContent = displayValue;
            }
        }

        resolveBadgeState(tab) {
            const title = this.getTabTitle(tab);
            const numericValue = this.extractNumber(title);
            if (numericValue > 0) {
                return {
                    mode: "number",
                    value: numericValue,
                };
            }

            if (this.hasAttentionState(tab)) {
                return {
                    mode: "dot",
                    value: 0,
                };
            }

            return {
                mode: "none",
                value: 0,
            };
        }

        hasAttentionState(tab) {
            return tab.hasAttribute("attention") && tab.getAttribute("attention") !== "false";
        }

        getTabTitle(tab) {
            const titleNode = tab.querySelector(".tab-text");
            const rawTitle = [
                tab.getAttribute("label"),
                tab.label,
                titleNode?.getAttribute("label"),
                titleNode?.getAttribute("value"),
                titleNode?.textContent,
            ].find(value => typeof value === "string" && value.trim());

            return rawTitle ? rawTitle.replace(/^[\u200e\u200f\u202a-\u202e]+/, "").trim() : "";
        }

        extractNumber(title) {
            if (!title) {
                return 0;
            }

            const normalizedTitle = title.replace(/\s+/g, " ").trim();
            const candidates = [
                normalizedTitle,
                normalizedTitle.split(/\s[-|:]\s/u, 1)[0].trim(),
            ];

            for (const candidate of candidates) {
                const value = this.extractNumberFromCandidate(candidate);
                if (value > 0) {
                    return value;
                }
            }

            return 0;
        }

        extractNumberFromCandidate(candidate) {
            if (!candidate || candidate.length > 32) {
                return 0;
            }

            const patterns = [
                /^\s*[\(\[]\s*(\d{1,3})(?:\+)?\s*[\)\]]/,
                /[\(\[]\s*(\d{1,3})(?:\+)?\s*[\)\]]\s*$/,
                /^[^\(\[]{0,12}[\(\[]\s*(\d{1,3})(?:\+)?\s*[\)\]]/,
            ];

            for (const pattern of patterns) {
                const match = candidate.match(pattern);
                if (!match) {
                    continue;
                }
                const value = Number.parseInt(match[1], 10);
                if (!Number.isInteger(value) || value <= 0) {
                    continue;
                }
                return Math.min(value, tabNotificationBadge.MAX_NUM);
            }

            return 0;
        }

        ensureBadge(tab) {
            let badge = tab.querySelector(".tab-badge");
            if (badge) {
                return badge;
            }

            badge = this.createElementNS(null, "html:label", {
                class: "tab-badge toolbarbutton-badge",
                "badge-mode": "none",
                num: "",
            });
            badge.textContent = "";

            const iconStack = tab.querySelector(".tab-icon-stack");
            if (iconStack) {
                iconStack.appendChild(badge);
            }
            return badge;
        }

        createElementNS(namespace, type, props) {
            if (!type) {
                return null;
            }
            namespace ||= "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
            if (type.startsWith("html:")) {
                namespace = "http://www.w3.org/1999/xhtml";
            }
            const el = document.createElementNS(namespace, type);
            for (const prop in props) {
                el.setAttribute(prop, props[prop]);
            }
            return el;
        }
    }

    function addStyle(styleText) {
        const pi = document.createProcessingInstruction(
            "xml-stylesheet",
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(styleText) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    function init() {
        window.tabNotificationBadge = new tabNotificationBadge();
        window.tabNotifitionBadge = window.tabNotificationBadge;
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        const delayedListener = (subject, topic) => {
            if (topic === "browser-delayed-startup-finished" && subject === window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
.tabbrowser-tab[pinned="true"][soundplaying="true"]:not([tab-badge-state="none"]) .tab-icon-overlay {
    visibility: collapse;
}
/* ↓ remove the block comment to hide sound indicator on unpinned tabs.↓ */
/*
.tabbrowser-tab[soundplaying="true"]:not([pinned="true"]):not([tab-badge-state="none"]) .tab-icon-overlay {
    visibility: collapse;
}
.tabbrowser-tab[soundplaying="true"]:not([pinned="true"]):not([tab-badge-state="none"]) :not(.tab-icon-overlay) {
    opacity: 1 !important;
}
*/
.tabbrowser-tab .tab-icon-stack .tab-badge[badge-mode="none"] {
    visibility: collapse;
}
.tabbrowser-tab .tab-icon-stack .tab-badge {
    margin-inline-end: 0 !important;
}
.tabbrowser-tab .tab-icon-stack .tab-badge[badge-mode="dot"] {
    min-width: 8px;
    width: 8px;
    height: 8px;
    margin-top: 0;
    padding: 0;
    border-radius: 999px;
    font-size: 0;
    line-height: 0;
}
`);
