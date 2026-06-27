// ==UserScript==
// @name            中键打开标签菜单
// @description     中键点击标签时弹出标签页菜单，方便配合右键关闭标签页使用
// @version         0.2.0
// @license         MIT License
// @compatibility   Firefox 136+
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            2026/06/27 重写为独立事件监听，移除对 tabContainer.handleEvent 的 eval 篡改，兼容新版 Firefox
// ==/UserScript==

(function () {
    if (!location.href.startsWith("chrome://browser/content/browser.x")) {
        return;
    }

    const SERVICE_KEY = "ucjsMiddleClickTabMenu";

    window[SERVICE_KEY]?.destroy?.();

    const service = {
        _initRetryCount: 0,
        _lastOpenAt: 0,
        tabContainer: null,
        popup: null,

        init () {
            this.tabContainer = gBrowser?.tabContainer || null;
            this.popup = document.getElementById("tabContextMenu");

            if (!this.tabContainer || !this.popup) {
                if (this._initRetryCount++ < 40) {
                    setTimeout(() => this.init(), 250);
                }
                return;
            }

            this.tabContainer.addEventListener("auxclick", this, true);
            this.tabContainer.addEventListener("click", this, true);
        },

        destroy () {
            this.tabContainer?.removeEventListener("auxclick", this, true);
            this.tabContainer?.removeEventListener("click", this, true);
            if (window[SERVICE_KEY] === this) {
                delete window[SERVICE_KEY];
            }
        },

        handleEvent (event) {
            switch (event.type) {
                case "auxclick":
                case "click":
                    this.onMiddleClick(event);
                    break;
            }
        },

        onMiddleClick (event) {
            if (event.button !== 1 || event.defaultPrevented) {
                return;
            }

            const tab = this.getTabFromEvent(event);
            if (!tab) {
                return;
            }

            const now = Date.now();
            if (now - this._lastOpenAt < 50) {
                return;
            }
            this._lastOpenAt = now;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();

            TabContextMenu.contextTab = tab;
            document.popupNode = tab;
            this.popup.openPopup(null, "after_pointer", event.clientX, event.clientY, true, false, event);
        },

        getTabFromEvent (event) {
            const target = event.composedTarget || event.target || event.originalTarget;
            if (!target) {
                return null;
            }

            if (target.closest) {
                return target.closest(".tabbrowser-tab");
            }

            let node = target;
            while (node) {
                if (node.classList?.contains("tabbrowser-tab")) {
                    return node;
                }
                node = node.parentNode;
            }
            return null;
        },
    };

    window[SERVICE_KEY] = service;
    service.init();
})();
