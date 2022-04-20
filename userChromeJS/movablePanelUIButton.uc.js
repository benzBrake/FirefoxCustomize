// ==UserScript==
// @name            可移动 PanelUI 按钮
// @author          Ryan, firefox
// @include         main
// @shutdown        UC.movablePanelUIButton.unload()
// @compatibility   Firefox 90 +
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            2022.04.20 修改为可热插拔（不知道非 xiaoxiaoflood 的 userChrome 环境是否可用）
// @onlyonce
// ==/UserScript==

Components.utils.import("resource:///modules/CustomizableUI.jsm");
if (typeof Services === "undefined") {
    const { Services } = Components.utils.import("resource://gre/modules/Services.jsm", {});
}
UC.movablePanelUIButton = {
    widgetId: "movable-PanelUI-button",
    init: function() {
        this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

        CustomizableUI.createWidget({
            id: this.widgetId,
            type: "button",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            label: "主菜单",
            tooltiptext: "打开应用程序菜单",
            image: "chrome://browser/skin/menu.svg",
            onCreated: function(node) {
                let originalMenu = node.ownerDocument.defaultView.PanelUI;

                // helper function to not repeat so much code
                function setEvent(event) {
                    node.addEventListener(event, function() {
                        originalMenu.menuButton = node;
                    }, { "capture": true });
                    node.addEventListener(event, originalMenu);
                }

                setEvent("mousedown");
                setEvent("keypress");
            }
        });
        this.setStyle();
    },
    setStyle: function() {
        this.STYLE = {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            @-moz-document url('chrome://browser/content/browser.xhtml') {
                #PanelUI-button {
                    display: none !important;
                }
                #${this.widgetId} {
                    list-style-image: url("chrome://browser/skin/menu.svg");
                }
            }
          `)),
            type: this.sss.AGENT_SHEET
        }
        this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
    },
    unload: function() {
        CustomizableUI.destroyWidget(this.widgetId);
        this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
        gBrowser.ownerDocument.defaultView.PanelUI.menuButton = document.getElementById('PanelUI-button');
        delete UC.movablePanelUIButton;
    }
}
UC.movablePanelUIButton.init();