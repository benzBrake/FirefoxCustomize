// ==UserScript==
// @name            browsertoolbox.uc.js
// @description     添加一个快捷打开浏览器内容工具箱的按钮
// @author          Endor8
// @include         main
// @charset         UTF-8
// @compatibility   Firefox 100
// @homepage        https://github.com/Endor8/userChrome.js/blob/master/Firefox-96/browsertoolbox.uc.js
// @version         2025.01.31 Remove Cu.import, per Bug Bug 1881888
// ==/UserScript==
(function () {
    if (location != 'chrome://browser/content/browser.xhtml')
        return;

    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;

    try {

        CustomizableUI.createWidget({
            id: 'browser-toolbox-button',
            type: 'custom',
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onBuild: function (aDocument) {
                var toolbaritem = aDocument.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbarbutton');
                var props = {
                    id: 'browser-toolbox-button',
                    class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                    label: '浏览器内容工具箱',
                    tooltiptext: '浏览器内容工具箱',
                    style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAdUlEQVQokZVSwRHAIAgLPYfoXs7RCTpG53Avt7APrhaFU8gLMEEJAkEQgFbc7IxkVjt0r6Sp7VIVITumBpKt00FA2ThmjXzkfMMWO8EZFSj8LrUyjsG9b9DaJXq+qAIVxEUxtLHpaXE95dj1NcK2rmbwaGJ4Af0tIg00j/6iAAAAAElFTkSuQmCC)',
                    oncommand: '(' + onCommand.toString() + ')()'
                };
                for (var p in props)
                    toolbaritem.setAttribute(p, props[p]);

                return toolbaritem;
            }
        });
    } catch (e) { };

    function onCommand (event) {
        var document = event.target.ownerDocument;
        if (!document.getElementById('menu_browserToolbox')) {
            let { require } = "import" in Cu ? Cu.import("resource://devtools/shared/loader/Loader.jsm", {}) : ChromeUtils.importESModule("resource://devtools/shared/loader/base-loader.sys.mjs")
            require("devtools/client/framework/devtools-browser");
        };
        document.getElementById('menu_browserToolbox').click();
    };
})();
