// ==UserScript==
// @name           000-addToolbarInsideLocationBar.uc.js
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    add a Toolbar inside LocationBar
// @include        main
// @compatibility  Firefox 90
// @author         Alice0775
// @version        2022/07/06 22:30 Firefox 90+ 按钮不居中
// @version        2018/11/27 16:30 Firefox 67
// @version        2017/12/16 15:00 stop-reload button hack default/lightweight theme
// @version        2017/12/15 17:00 57
// @version        2016/01/23 1$:00 fix unexpectedly open url when reorder bookmarks
// @version        2015/08/11 18:00 fix icon size due to bug Bug 1147702
// @version        2015/04/11 12:00 fix icon size due to bug 1147702
// @version        2014/09/28 22:00 fix does not preserve position due to bug 1001090
// @version        2014/06/20 22:00 do not collapse in gullscreen
// @version        2014/06/07 20:00 slightly delayed to display toolbar
// @version        2014/05/23 00:00 preserve position after customize toolbar
// @version        2014/05/16 00:00 check for toolbar had been registered
// @version        2014/05/14 14:20 typ csso
// @version        2014/05/14 00:50 beforecustomization insted aftercustomization
// @version        2014/05/14 00:00 fix style of #bookmarks-menu-button and BookmarkingUI._currentAreaType
// @version        2014/05/13 23:30 fix style of |type=menu-button|
// @version        2014/05/13 21:30 add to view menu
// @version        2014/05/13 13:30 see note below
// @version        2014/05/13 10:30 cosmetic
// @version        2014/05/13 09:30 fix second window
// @version        2014/05/13
// @note           USAGE: View > Toolbars > Cutomize..., then, the "Toolbar Inside LocationBara"(red dotted) appeas at lefy side of nav bar. and you can drag and drop toolbarbutton on to the toolbar. The toolbarbutton will display inside locatonbar after exit customize mode. If you want to drag an item to the other toolbar, you should place the item on palette once, then move it to the other toolbar. i.e, this toolbar > palette > other toolbar
// @note           使い方: ツールバーのカスタマイズに入ると, "Toolbar Inside LocationBara"(赤点線)がナビゲーションバーの左端に表示されるので, そこにツールボタンをドラッグ&ドロップする。カスタマイズ終了後，ツールボタンがロケーションバーのに表示される。このツールバーから別のツールバーにボタンを移動する場合は，一旦パレット領域に置いてください。すなわち このツールバー > パレット > 別のツールバー
// ==/UserScript==
var addToolbarInsideLocationBar = {
    init: function () {
        let style = `
        @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
        #ucjs-Locationbar-toolbar {
            -moz-appearance: none;
            background-color: transparent;
            background-image: none;
            padding: 0px 2px;
            border: none;
            --locationbar-icon-width: 16px;
            --locationbar-icon-height: 16px;
        }
  
        #main-window[customizing] #ucjs-Locationbar-toolbar {
          min-width :30px;
          border: 1px dotted rgba(255,0,0,0.6) ;
        }
  
        /*default theme*/
        #nav-bar #ucjs-Locationbar-toolbar > toolbarbutton .toolbarbutton-icon{
            width: var(--locationbar-icon-width);
            padding: 0 !important;
        }
  
        #nav-bar .toolbarbutton-1[type=menu]:not(#back-button):not(#forward-button):not(#feed-button):not(#social-provider-button):not(#PanelUI-menu-button) {
            padding-left: 2px;
            padding-right: 2px;
        }
  
        #ucjs-Locationbar-toolbar .toolbarbutton-1:not([type=menu-button]),
        #ucjs-Locationbar-toolbar .toolbarbutton-1 > .toolbarbutton-menubutton-button,
        #ucjs-Locationbar-toolbar .toolbarbutton-1 > .toolbarbutton-menubutton-dropmarker {
            padding: 0 2px 0 2px !important;
        }
  
        #ucjs-Locationbar-toolbar .toolbarbutton-1:not(#bookmarks-menu-button) > .toolbarbutton-menubutton-dropmarker > .dropmarker-icon {
            padding: 5px 2px 4px 2px;
        }
  
        #ucjs-Locationbar-toolbar #bookmarks-menu-button[cui-areatype="toolbar"]:not(.bookmark-item):not([overflowedItem=true]) > .toolbarbutton-menubutton-dropmarker > .dropmarker-icon {
            padding: 0 2px 0 2px !important;
            width: 23px;
        }
        #ucjs-Locationbar-toolbar:not([customizing="true"]) #bookmarks-menu-button[cui-areatype="toolbar"] > .toolbarbutton-menubutton-button > .toolbarbutton-icon {
            width: var(--locationbar-icon-width);
            height: var(--locationbar-icon-height);
        }
  
        /* xxx stop-reload button hack default theme*/
        #ucjs-Locationbar-toolbar:not(:-moz-lwtheme) #stop-reload-button > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:not(:-moz-lwtheme) #stop-reload-button > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(0, 0, 0);
        }
        #ucjs-Locationbar-toolbar:not(:-moz-lwtheme) #stop-reload-button[animate] > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:not(:-moz-lwtheme) #stop-reload-button[animate] > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(0, 0, 0);
        }
        /* xxx stop-reload button hack lightweight theme (bright theme)*/
        #ucjs-Locationbar-toolbar:-moz-lwtheme-darktext #stop-reload-button > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:-moz-lwtheme-darktext #stop-reload-button > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(0, 0, 0);
        }
        #ucjs-Locationbar-toolbar:-moz-lwtheme-darktext #stop-reload-button[animate] > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:-moz-lwtheme-darktext #stop-reload-button[animate] > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(0, 0, 0);
        }
        /* xxx stop-reload button hack lightweight theme (dark theme)*/
        #ucjs-Locationbar-toolbar:-moz-lwtheme-brighttext #stop-reload-button > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:-moz-lwtheme-brighttext #stop-reload-button > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(255, 255, 255);
        }
        #ucjs-Locationbar-toolbar:-moz-lwtheme-brighttext #stop-reload-button[animate] > #reload-button > .toolbarbutton-icon,
        #ucjs-Locationbar-toolbar:-moz-lwtheme-brighttext #stop-reload-button[animate] > #reload-button[displaystop] + #stop-button > .toolbarbutton-icon
        {
            fill: rgb(255, 255, 255);
        }
        #nav-bar #ucjs-Locationbar-toolbar>.toolbarbutton-1 {
            width: calc(var(--urlbar-min-height) - 2 * var(--urlbar-container-padding)) !important;
            height: calc(var(--urlbar-min-height) - 2 * var(--urlbar-container-padding)) !important;
            border-radius: var(--urlbar-icon-border-radius);
        }
        #nav-bar #ucjs-Locationbar-toolbar>.toolbarbutton-1>.toolbarbutton-badge-stack {
            padding: 0 !important;
        }
        #nav-bar #ucjs-Locationbar-toolbar>.toolbarbutton-1>.toolbarbutton-icon,
        #nav-bar #ucjs-Locationbar-toolbar>.toolbarbutton-1>.toolbarbutton-badge-stack>.toolbarbutton-icon,
        #nav-bar #ucjs-Locationbar-toolbar #downloads-indicator-icon {
            width: calc(var(--locationbar-icon-width) + 2 * var(--urlbar-icon-padding)) !important;
            height: calc(var(--locationbar-icon-height) + 2 * var(--urlbar-icon-padding)) !important;
            padding: var(--urlbar-icon-padding) !important;
            -moz-context-properties: fill, fill-opacity;
            fill-opacity: var(--urlbar-icon-fill-opacity);
            border-radius: var(--urlbar-icon-border-radius);
        }
        #nav-bar #ucjs-Locationbar-toolbar .toolbarbutton-1:is(:hover,:active,:focus,:focus-within,[open="true"])>image,
        #nav-bar #ucjs-Locationbar-toolbar .toolbarbutton-1:is(:hover,:active,:focus,:focus-within,[open="true"])>.toolbarbutton-badge-stack>image,
        #nav-bar #ucjs-Locationbar-toolbar #downloads-button:is(:hover,:active,:focus,:focus-within,[open="true"]) #downloads-indicator-icon {
            background-color: var(--urlbar-box-hover-bgcolor) !important;
            color: var(--urlbar-box-hover-text-color) !important;
        }      
        `.replace(/\s+/g, " ");

        let sspi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
        );
        document.insertBefore(sspi, document.documentElement);
        sspi.getAttribute = function (name) {
            return document.documentElement.getAttribute(name);
        };

        const kNSXUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        Components.utils.import("resource:///modules/CustomizableUI.jsm");

        //create toolbar
        let toolbar = document.createElementNS(kNSXUL, "toolbar");
        toolbar.setAttribute("id", "ucjs-Locationbar-toolbar");
        toolbar.setAttribute("customizable", "true");
        toolbar.setAttribute("mode", "icons");
        toolbar.setAttribute("iconsize", "small");
        toolbar.setAttribute("context", "toolbar-context-menu");
        toolbar.setAttribute("class", "toolbar-primary chromeclass-toolbar customization-target");
        toolbar.setAttribute("fullscreentoolbar", "true");
        toolbar.setAttribute("toolbarname", "地址栏内工具栏");
        toolbar.setAttribute("toolboxid", "navigator-toolbox");
        toolbar.setAttribute("hidden", "true");
        setTimeout(function () { toolbar.removeAttribute("hidden"); }, 0)

        //register toolbar.id
        //already registered when opening the second or later window
        if (CustomizableUI.getAreaType("ucjs-Locationbar-toolbar")) {
            // do nothing
        } else
            try {
                CustomizableUI.registerToolbarNode(toolbar);
                CustomizableUI.registerArea("ucjs-Locationbar-toolbar", {
                    type: CustomizableUI.TYPE_TOOLBAR,
                    defaultPlacements: ["feed-button"]
                });
            } catch (e) { }

        let ref = this.getInsertPoint();
        ref.appendChild(toolbar);
        // xxxx toDo removing dirty hack
        gURLBar.onDrop_addToolbarInsideLocationBar = gURLBar.onDrop;
        gURLBar.onDrop = function (event) {
            var toolbar = document.getElementById("ucjs-Locationbar-toolbar");
            var target = event.originalTarget;
            while (target) {
                if (target == toolbar) {
                    return;
                }
                target = target.parentNode;
            }

            gURLBar.onDrop_addToolbarInsideLocationBar(event);
        };

        document.getElementById('urlbar-container').setAttribute('locationbarcollapsed', document.getElementById("ucjs-Locationbar-toolbar").getAttribute('collapsed') || "false");

        //
        window.addEventListener("beforecustomization", this, true);
        //BookmarkingUI._updateCustomizationState();

        var mutationObserver = new MutationObserver(function callback(mutationsList, observer) {
            mutationsList.forEach(m => {
                if (m.attributeName == "collapsed")
                    document.getElementById('urlbar-container').setAttribute('locationbarcollapsed', m.target.getAttribute('collapsed') || "false");

            })
        });
        mutationObserver.observe(document.getElementById("ucjs-Locationbar-toolbar"), {
            'attributes': true
        });
    },

    getInsertPoint: function () {
        return (document.getElementById("urlbar-icons")
            || document.getElementById("page-action-buttons")
        );
    },

    registerArea: function (name) {
        Components.utils.import("resource:///modules/CustomizableUI.jsm");
        CustomizableUI.registerArea(name, {
            type: CustomizableUI.TYPE_TOOLBAR,
            defaultPlacements: ["feed-button"],
            defaultCollapsed: null,
            legacy: true
        }, true);
        CustomizableUI.registerToolbarNode(document.getElementById(name));
    },

    fakeUnregisterArea: function (name) {
        let CustomizableUIBSPass =
            Cu.import("resource:///modules/CustomizableUI.jsm", null);
        CustomizableUIBSPass.gAreas.delete(name);
        CustomizableUIBSPass.gBuildAreas.delete(name);
    },

    handleEvent: function (event) {
        let toolbar = document.getElementById("ucjs-Locationbar-toolbar");
        switch (event.type) {
            case "beforecustomization":
                window.addEventListener("customizationending", this, false);
                this.registerArea("ucjs-Locationbar-toolbar");
                this.placeholder = toolbar.parentNode.insertBefore(document.createElement("hbox"), toolbar);
                let ref = document.getElementById("nav-bar-customization-target");
                toolbar.setAttribute("tooltiptext", "地址栏内工具栏");
                ref.parentNode.insertBefore(toolbar, ref);
                break;
            case "customizationending":
                window.removeEventListener("customizationending", this, false);
                this.placeholder.parentNode.replaceChild(toolbar, this.placeholder);
                toolbar.removeAttribute("tooltiptext");
                this.fakeUnregisterArea("ucjs-Locationbar-toolbar");
                //BookmarkingUI._updateCustomizationState();
                break;
        }
    },
};
addToolbarInsideLocationBar.init(); 
