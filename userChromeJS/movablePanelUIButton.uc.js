// ==UserScript==
// @name
// @description     可移动 PanelUI 按钮
// @author          Ryan, firefox
// @include         main
// @shutdown        window.movablePanelUIButton.unload()
// @compatibility   Firefox 78
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            2022.08.27 fx 102+
// @note            2022.07.02 非 xiaoxiaoflood 的 userChromeJS 环境测试可用
// @note            2022.04.20 修改为可热插拔（不知道非 xiaoxiaoflood 的 userChromeJS 环境是否可用）
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;

    if (window.movablePanelUIButton) {
        window.movablePanelUIButton.destroy();
        delete window.movablePanelUIButton;
    }

    var css = `
        #PanelUI-button {
            display: none !important;
        }
        #{widgetId} {
            list-style-image: url("chrome://browser/skin/menu.svg");
        }
    `;

    window.movablePanelUIButton = {
        widgetId: "movable-PanelUI-button",
        init: function () {
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
            var pi = document.createProcessingInstruction(
                'xml-stylesheet',
                'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css.replace("{widgetId}", this.widgetId)) + '"'
            );
            this.style = document.insertBefore(pi, document.documentElement);
        },
        unload: function () {
            CustomizableUI.destroyWidget(this.widgetId);
            gBrowser.ownerDocument.defaultView.PanelUI.menuButton = document.getElementById('PanelUI-button');
            document.getElementById('appMenu-popup').setAttribute('position', 'bottomcenter topright');
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            delete window.movablePanelUIButton;
        }
    }
    window.movablePanelUIButton.init();
})();