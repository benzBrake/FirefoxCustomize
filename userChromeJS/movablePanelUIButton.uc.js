// ==UserScript==
// @name
// @description     可移动 PanelUI 按钮
// @author          Ryan, firefox
// @include         main
// @shutdown        window.movablePanelUIButton.unload()
// @compatibility   Firefox 78
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            2022.09.05 修正窗口报错
// @note            2022.08.27 fx 102+
// @note            2022.07.02 非 xiaoxiaoflood 的 userChromeJS 环境测试可用
// @note            2022.04.20 修改为可热插拔（不知道非 xiaoxiaoflood 的 userChromeJS 环境是否可用）
// @onlyonce
// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;

    if (window.movablePanelUIButton) {
        window.movablePanelUIButton.destroy();
    }

    window.movablePanelUIButton = {
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        STYLE_ICON: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            #movable-PanelUI-button {
                list-style-image: url(chrome://browser/skin/menu.svg);
            }
            `)),
        },
        STYLE_DISPLAY: {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            #PanelUI-button {
                display: none;
            }
            `)),
        },
        listener: {
            windows: windows,
            onCustomizeStart(win) {
                this.windows(function (doc, win, location) {
                    win.dispatchEvent(new CustomEvent("MovablePanelUIButtonShow"));
                })
            },
            onCustomizeEnd(win) {
                this.windows(function (doc, win, location) {
                    win.dispatchEvent(new CustomEvent("MovablePanelUIButtonHide"));
                })
            }
        },
        init: function () {
            this.sss.loadAndRegisterSheet(this.STYLE_ICON.url, this.STYLE_ICON.type);
            this.sss.loadAndRegisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
            CustomizableUI.addListener(this.listener);
            CustomizableUI.createWidget({
                id: "movable-PanelUI-button",
                type: "button",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                localized: false,
                removable: true,
                onCreated: node => {
                    node.addEventListener('mousedown', this);
                    node.addEventListener('keypress', this);
                    let pNode = node.ownerDocument.getElementById('PanelUI-menu-button');
                    ['label', 'tooltiptext'].forEach(attr => node.setAttribute(attr, pNode.getAttribute(attr)));
                }
            });
            window.addEventListener('MovablePanelUIButtonShow', this);
            window.addEventListener('MovablePanelUIButtonHide', this);
        },
        handleEvent: function (event) {
            if (event.type === "mousedown" && event.button !== 0) return;
            switch (event.type) {
                case 'mousedown':
                case 'keypress':
                    let { target: node } = event;
                    let { ownerDocument: document } = node;
                    const { PanelUI } = document.defaultView;
                    PanelUI.menuButton = node;
                    PanelUI.show();
                    break;
                case 'MovablePanelUIButtonShow':
                    this.sss.unregisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
                    break;
                case 'MovablePanelUIButtonHide':
                    this.sss.loadAndRegisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
                    break;
            }

        },
        unload: function () {
            this.sss.unregisterSheet(this.STYLE_ICON.url, this.STYLE_ICON.type);
            this.sss.unregisterSheet(this.STYLE_DISPLAY.url, this.STYLE_DISPLAY.type);
            CustomizableUI.destroyWidget("movable-PanelUI-button");
            document.defaultView.PanelUI.menuButton = document.getElementById('PanelUI-button');
            window.removeEventListener('MovablePanelUIButtonShow', this);
            window.removeEventListener('MovablePanelUIButtonHide', this);
            delete window.movablePanelUIButton;
        }
    }
    window.movablePanelUIButton.init();

    function windows(fun) {
        let windows = Services.wm.getEnumerator('navigator:browser');
        while (windows.hasMoreElements()) {
            let win = windows.getNext();
            if (!win._uc)
                continue;
            let { document, location } = win;
            if (fun(document, win, location))
                break;
        }
    }
})();