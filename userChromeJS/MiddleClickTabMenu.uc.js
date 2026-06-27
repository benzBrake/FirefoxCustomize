// ==UserScript==
// @name            中键打开标签菜单
// @description     方便开启右键关闭标签页后使用中键打开标签菜单
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
location.href.startsWith('chrome://browser/content/browser.x') && setTimeout(() => {
    eval("gBrowser.tabContainer.__proto__.handleEvent = " + gBrowser.tabContainer.__proto__.handleEvent.toString().replace("handleEvent(aEvent)", "function handleEvent(aEvent)").replace('case "mouseout":', 'case "click":\n          if(event.button === 1) {\n            event.preventDefault();\n            const tab = event.target.closest(".tabbrowser-tab");\n            TabContextMenu.contextTab = tab;\n            document.getElementById("tabContextMenu").openPopup(null, "after_pointer", event.clientX, event.clientY, false, false);\n          }\n          break;\n        case "mouseout":'));
}, 1000);