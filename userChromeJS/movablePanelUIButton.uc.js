// ==UserScript==
// @name
// @description     可移动 PanelUI 按钮
// @author          Ryan, firefox
// @include         main
// @startup         window.movablePanelUIButton.init(win)
// @shutdown        window.movablePanelUIButton.unload()
// @compatibility   Firefox 78
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            2022.07.02 非 xiaoxiaoflood 的 userChromeJS 环境测试可用
// @note            2022.04.20 修改为可热插拔（不知道非 xiaoxiaoflood 的 userChromeJS 环境是否可用）
// @onlyonce
// ==/UserScript==
location.href.startsWith('chrome://browser/content/browser.x') && (async function (css) {
    Components.utils.import("resource:///modules/CustomizableUI.jsm");

    if (window.movablePanelUIButton) {
        window.movablePanelUIButton.destroy();
        delete window.movablePanelUIButton;
    }

    window.movablePanelUIButton = {
        widgetId: "movable-PanelUI-button",
        init: async function () {
            CustomizableUI.createWidget({
                id: this.widgetId,
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                image: "chrome://browser/skin/menu.svg",
                onCreated: function (node) {
                    let originalMenu = node.ownerDocument.defaultView.PanelUI;

                    // helper function to not repeat so much code
                    function setEvent(event) {
                        node.addEventListener(event, function () {
                            originalMenu.menuButton = node;
                        }, { "capture": true });
                        node.addEventListener(event, originalMenu);
                    }

                    setEvent("mousedown");
                    setEvent("keypress");
                    document.getElementById('appMenu-popup').setAttribute('position', 'bottomcenter topleft');
                }
            });
            this.style = addStyle(css.replace("{widgetId}", this.widgetId))
        },
        unload: async function () {
            CustomizableUI.destroyWidget(this.widgetId);
            gBrowser.ownerDocument.defaultView.PanelUI.menuButton = document.getElementById('PanelUI-button');
            document.getElementById('appMenu-popup').setAttribute('position', 'bottomcenter topright');
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.movablePanelUIButton;
        }
    }
    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }
    await window.movablePanelUIButton.init();
})(`
@-moz-document url('chrome://browser/content/browser.xhtml') {
    #PanelUI-button {
        display: none !important;
    }
    #{widgetId} {
        list-style-image: url("chrome://browser/skin/menu.svg");
    }
}
`)