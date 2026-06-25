// ==UserScript==
// @name            adjustPanelViewPosition.uc.js
// @description     调整弹出面板位置
// @author          Ryan
// @license         MIT License
// @version         0.0.1
// @compatibility   Firefox 72
// @charset         UTF-8
// @include         main
// @sandbox         true
// @shutdown        window.adjustPanelViewPosition.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @downloadURL     https://github.com/benzBrake/FirefoxCustomize/raw/master/userChromeJS/adjustPanelViewPosition.uc.js
// ==/UserScript==
(adjustPanelViewPosition = {
    ENABLE_BLACKLIST: false, // 是否启用黑名单，不启用则处理所有弹出面板
    BLACKLIST: [ // 从哪个按钮触发
        "#alltabs-button",
        "#tracking-protection-icon-container",
    ],
    isBlacklisted: function (btn) {
        const BLACKLIST_SEL = this.BLACKLIST.join(", ");
        this.isBlacklisted = btn => btn.closest(BLACKLIST_SEL)!== null;
        return this.isBlacklisted(btn);
    },
    init: function () {
        if (!this.ENABLE_BLACKLIST) {
            this.isBlacklisted = () => true;
        }
        this.openPopup = PanelMultiView.openPopup;
        const { openPopup } = this;
        PanelMultiView.openPopup = function (panel, anchor, options) {
            if (adjustPanelViewPosition.isBlacklisted(anchor) && options.triggerEvent) {
                const { originalTarget: btn } = options.triggerEvent;
                const win = btn.ownerDocument.defaultView;
                const rect = btn.getBoundingClientRect();
                const windowWidth = win.innerWidth;
                const windowHeight = win.innerHeight;
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                if (x < windowWidth / 2 && y < windowHeight / 2) {
                    options.position = "bottomleft topleft";
                } else if (x >= windowWidth / 2 && y < windowHeight / 2) {
                    options.position = "bottomright topright";
                } else if (x >= windowWidth / 2 && y >= windowHeight / 2) {
                    options.position = "topright bottomright";
                } else {
                    options.position = "topleft bottomleft";
                }
            }
            return openPopup.call(this, panel, anchor, options);
        };
    },
    destroy: function () {
        PanelMultiView.openPopup = this.openPopup;
    }
}).init();