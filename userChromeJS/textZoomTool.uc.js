// ==UserScript==
// @name           textZoomTool
// @version        0.0.2
// @author         Ryan
// @include        main
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    给应用主菜单添加文本缩放工具条
// @note           改自 Kaslanka Querp https://lottafox.bliemhax.com 的 textZoomTool.uc.js
// @needtodo       把缩放倍数按域名存起来，快捷键
// ==/UserScript==
(this.textZoomTool = {
    init(win) {
        this.win = win;
        this.doc = win.document;
        var style = "data:text/css;charset=utf-8," + encodeURIComponent(`
        /* text Zoom By lottaFox */
        #appMenu-textZoom-controls {
          padding-block: max(0px, var(--arrowpanel-menuitem-padding-block) - 4px);
        }
        
        #appMenu-textZoom-controls > .subviewbutton {
          margin-inline-start: 2px;
          padding: 4px;
        }
        
        /* hover and active color changes are applied to child elements not the button itself */
        #appMenu-textZoom-controls > .subviewbutton:not([disabled]):is(:hover, :hover:active) {
          color: unset;
          background-color: unset;
        }
        
        #appMenu-textZoom-controls > .subviewbutton:focus-visible {
          outline: none;
        }
        
        #appMenu-textZoom-controls > .subviewbutton-iconic:focus-visible > .toolbarbutton-icon,
        #appMenu-zoomReset-button2:focus-visible > .toolbarbutton-text {
          outline: var(--focus-outline);
        }
        
        #appMenu-textZoomReduce-button2 > .toolbarbutton-icon,
        #appMenu-textZoomEnlarge-button2 > .toolbarbutton-icon {
          -moz-context-properties: fill, stroke;
          fill: var(--button-color);
          /* the stroke color is used to fill the circle in the icon */
          stroke: var(--button-bgcolor);
          border-radius: 50%;
          padding: 0;
        }
        
        #appMenu-textZoomReset-button2 > .toolbarbutton-text  {
          border-radius: 2px;
        }
        
        #appMenu-textZoomReset-button2:not([disabled]):hover > .toolbarbutton-text {
          background-color: var(--panel-item-hover-bgcolor);
        }
        
        #appMenu-textZoomReduce-button2:not([disabled]):hover > .toolbarbutton-icon,
        #appMenu-textZoomEnlarge-button2:not([disabled]):hover > .toolbarbutton-icon {
          stroke: var(--panel-item-hover-bgcolor);
        }
        
        #appMenu-textZoomReset-button2:not([disabled]):active:hover > .toolbarbutton-text {
          background-color: var(--panel-item-active-bgcolor);
        }
        #appMenu-textZoomReduce-button2:not([disabled]):active:hover > .toolbarbutton-icon,
        #appMenu-textZoomEnlarge-button2:not([disabled]):active:hover > .toolbarbutton-icon {
          stroke: var(--panel-item-active-bgcolor);
        }
        
        #appMenu-textZoomReset-button2[disabled] {
          opacity: 1;
        }
        
        #appMenu-textZoomEnlarge-button2 {
          list-style-image: url(chrome://browser/skin/add-circle-fill.svg);
        }
        
        #appMenu-textZoomReduce-button2 {
          list-style-image: url(chrome://browser/skin/subtract-circle-fill.svg);
        }
        /* text Zoom By lottaFox */
        `);
        windowUtils.loadSheetUsingURIString(style, windowUtils.AUTHOR_SHEET);
        PanelUI.mainView.addEventListener("ViewShowing", this, {
            once: true
        });
        XPCOMUtils.defineLazyGetter(this, "menubarLocalization", () => {
            return new Localization(["browser/menubar.ftl"], true);
        });
        gBrowser.tabs.forEach(t => t.setAttribute("textZoom", 1));
        gBrowser.tabContainer.addEventListener('TabOpen', this);
        gBrowser.tabContainer.addEventListener('TabSelect', this);
    },
    handleEvent(event) {
        switch (event.type) {
            case "ViewShowing":
                this.initOnce(event);
                break;
            case "TabSelect":
                let val = parseFloat(event.target.getAttribute("textZoom")) || 1;
                event.target.linkedBrowser.textZoom = val;
                if (this.textZoomTool)
                    this.updateStatus();
                break;
            case "TabOpen":
                event.target.setAttribute("textZoom", 1)
                break;
        }
    },
    onCommand(event) {
        let id = event.target.id || "unknown";
        switch (id) {
            case this.reduceButton.id:
                gBrowser.selectedBrowser.textZoom = gBrowser.selectedBrowser.textZoom - 0.10;
                break;
            case this.resetButton.id:
                gBrowser.textZoom = 1.00;
                break;
            case this.enlargeButton.id:
                gBrowser.selectedBrowser.textZoom = gBrowser.selectedBrowser.textZoom + 0.10;
                break;
        }
        gBrowser.selectedTab.setAttribute("textZoom", gBrowser.selectedBrowser.textZoom);
        this.updateStatus();
    },
    updateStatus() {
        if (gBrowser.selectedBrowser.textZoom < 0.3) {
            gBrowser.selectedBrowser.textZoom = 0.3
        }
        if (gBrowser.selectedBrowser.textZoom > 5.0) {
            gBrowser.selectedBrowser.textZoom = 5.0
        }
        var dul = (parseFloat(gBrowser.selectedBrowser.textZoom.toFixed(2)) * 100).toFixed(0) + "%";
        this.resetButton.disabled = dul == "100%";
        this.reduceButton.disabled = dul == "30%";
        this.enlargeButton.disabled = dul == "500%";
        this.resetButton.setAttribute("label", dul);
    },
    initOnce(event) {
        let zoomControl = event.target.querySelector("#appMenu-zoom-controls");
        if (zoomControl) {
            let textZoomTool = zoomControl.cloneNode(true);
            textZoomTool.setAttribute("id", "appMenu-textZoom-controls");
            let [zoomToggleMsg] = this.menubarLocalization.formatMessagesSync([{ id: "menu-view-full-zoom-toggle" }]);
            let labelAttr = zoomToggleMsg.attributes.find(a => a.name == "label");
            $A(textZoomTool.querySelector(".toolbarbutton-text"), {
                "data-l10n-id": "",
                value: labelAttr.value
            })
            let [zoomReduceMsg] = this.menubarLocalization.formatMessagesSync([{ id: "menu-view-full-zoom-reduce" }]);
            labelAttr = zoomReduceMsg.attributes.find(a => a.name == "label");
            $A(textZoomTool.querySelector("#appMenu-zoomReduce-button2"), {
                "data-l10n-id": "",
                command: "",
                tooltip: labelAttr.value,
                tooltiptext: labelAttr.value,
                id: "appMenu-textZoomReduce-button2",
                oncommand: "textZoomTool.onCommand(event);",
            })
            let [zoomResetMsg] = this.menubarLocalization.formatMessagesSync([{ id: "menu-view-full-zoom-actual-size" }]);
            labelAttr = zoomResetMsg.attributes.find(a => a.name == "label");
            $A(textZoomTool.querySelector("#appMenu-zoomReset-button2"), {
                "data-l10n-id": "",
                command: "",
                tooltip: labelAttr.value,
                tooltiptext: labelAttr.value,
                id: "appMenu-textZoomReset-button2",
                oncommand: "textZoomTool.onCommand(event);",
            });
            let [zoomEnlargeMsg] = this.menubarLocalization.formatMessagesSync([{ id: "menu-view-full-zoom-enlarge" }]);
            labelAttr = zoomEnlargeMsg.attributes.find(a => a.name == "label");
            $A(textZoomTool.querySelector("#appMenu-zoomEnlarge-button2"), {
                "data-l10n-id": "",
                command: "",
                tooltip: labelAttr.value,
                tooltiptext: labelAttr.value,
                id: "appMenu-textZoomEnlarge-button2",
                oncommand: "textZoomTool.onCommand(event);",
            });
            $R(textZoomTool.querySelector("#appMenu-fullscreen-button2"));
            this.textZoomTool = zoomControl.parentNode.insertBefore(textZoomTool, zoomControl);
            this.reduceButton = this.textZoomTool.querySelector("#appMenu-textZoomReduce-button2");
            this.resetButton = this.textZoomTool.querySelector("#appMenu-textZoomReset-button2");
            this.enlargeButton = this.textZoomTool.querySelector("#appMenu-textZoomEnlarge-button2");
            this.updateStatus();
        } else {
            PanelUI.mainView.addEventListener("ViewShowing", this, {
                once: true
            });
        }
        function $A(el, attrs, skipAttrs) {
            skipAttrs = skipAttrs || [];
            if (attrs) Object.keys(attrs).forEach(function (key) {
                if (!skipAttrs.includes(key)) {
                    if (typeof attrs[key] === 'function')
                        el.setAttribute(key, "(" + attrs[key].toString() + ").call(this, event);");
                    else
                        el.setAttribute(key, attrs[key]);
                }
            });
            return el;
        }
        function $R(el) {
            if (el && el.parentNode)
                el.parentNode.removeChild(el);
        }
    },

}).init(this);