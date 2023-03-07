// ==UserScript==
// @name           PersonalToolbarAutoHide.uc.js
// @description    书签工具栏自动隐藏
// @compatibility  Firefox 68
// @author         Ryan
// @included       chrome://browser/content/browser.xhtml
// @shutdown       window.PersonalToolbarAutoHide.unload();
// @homepage       https://github.com/benzBrake/FirefoxCustomize
// @version        1.1
// @onlyonce
// ==/UserScript==
(function () {
    if (window.PersonalToolbarAutoHide) return;
    window.PersonalToolbarAutoHide = {
        appVersion: parseInt(Services.appinfo.version),
        init: function () {
            const { document, console, getComputedStyle } = window;
            if (
                this.appversion >= 76 &&
                location != "chrome://browser/content/browser.xhtml"
            ) return;
            try {
                this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
                this.toolbar = document.getElementById('PersonalToolbar');
                if (this.toolbar == null) return;
                this.context = document.getElementById('placesContext');
                this.toolbarHeight = getComputedStyle(this.toolbar).height;
                this.position = this.appVersion >= 108 ? "relative" : "absolute";
                this.setStyle();
                if (this.context) {
                    this.context.addEventListener('popupshowing', window.PersonalToolbarAutoHide.popupshowing, false);
                    this.context.addEventListener('popuphiding', window.PersonalToolbarAutoHide.popuphiding, false);
                }
                if (Services.prefs.getStringPref("browser.toolbars.bookmarks.visibility", "always") === "auto") {
                    document.getElementById("main-window").setAttribute("auto-hide-personaltoolbar", "");
                }
                $("toolbar-context-menu").addEventListener("popupshowing", (event) => {
                    let doc = event.target.ownerDocument;
                    if (!event.target.querySelector("#bookmarkOpt_autoHidePersonalToolbar"))
                        $('toggle_PersonalToolbar').querySelector("menupopup").appendChild($C("menuitem", {
                            id: "bookmarkOpt_autoHidePersonalToolbar",
                            type: "radio",
                            checked: Services.prefs.getStringPref("browser.toolbars.bookmarks.visibility", "always") === "auto",
                            'data-bookmarks-toolbar-visibility': true,
                            'data-visibility-enum': 'auto',
                            label: "自动隐藏",
                            accesskey: 'H',
                            onclick: 'Services.prefs.setStringPref("browser.toolbars.bookmarks.visibility", "auto")'
                        }, doc));
                });
                Services.prefs.addObserver("browser.toolbars.bookmarks.visibility", this);
                let timeOut, config = { childList: true };
                this.observer = new MutationObserver(mutations => {
                    mutations.forEach(m => {
                        if (m.type == 'childList') {
                            clearTimeout(timeOut);
                            setTimeout(function () {
                                window.PersonalToolbarAutoHide.addEvent();
                            }, 300);
                        }
                    });
                });
                this.observer.observe(document.getElementById('PlacesToolbarItems'), config)
            } catch (e) { console.log(e) }
        },
        addEvent() {
            const target = document.getElementById('PlacesToolbarItems');
            target.querySelectorAll("menupopup").forEach(e => {
                if (e.getAttribute('context') === 'placesContext') {
                    if (!e.getAttribute("auto-hide-personaltoolbar")) {
                        e.setAttribute("auto-hide-personaltoolbar", 'true');
                        e.addEventListener('popupshowing', window.PersonalToolbarAutoHide.popupshowing, true);
                        e.addEventListener('popuphiding', window.PersonalToolbarAutoHide.popuphiding, true);
                    }
                }
            });
        },
        observe: function (subj, topic, data) {
            if (topic === "nsPref:changed" && subj.getStringPref("browser.toolbars.bookmarks.visibility", "always") === "auto") {
                document.getElementById("main-window").setAttribute("auto-hide-personaltoolbar", "");
            } else {
                document.getElementById("main-window").removeAttribute("auto-hide-personaltoolbar");
            }
        },
        unload: function () {
            if (this.toolbar) {
                this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
                this.toolbar.classList.remove('context-open');
                this.toolbar.classList.remove('folder-open');
            }
            if (this.context) {
                this.context.removeEventListener('popupshowing', window.PersonalToolbarAutoHide.popupshowing);
                this.context.removeEventListener('popuphiding', window.PersonalToolbarAutoHide.popuphiding);
            }
            Services.prefs.removeObserver("browser.toolbars.bookmarks.visibility", this);
            let target = document.getElementById('PlacesToolbarItems');
            target.querySelectorAll("menupopup").forEach(e => {
                if (e.getAttribute("auto-hide-personaltoolbar")) {
                    e.removeAttribute("auto-hide-personaltoolbar");
                    if (!e.getAttribute("auto-hide-personaltoolbar")) {
                        e.setAttribute("auto-hide-personaltoolbar", 'true');
                        e.addEventListener('popupshowing', window.PersonalToolbarAutoHide.popupshowing, true);
                        e.addEventListener('popuphiding', window.PersonalToolbarAutoHide.popuphiding, true);
                    }
                }
            });
            delete window.PersonalToolbarAutoHide;
        },

        popupshowing: function (e) {
            let that = window.PersonalToolbarAutoHide,
                toolbar = that.toolbar;
            if (e.id == 'placesContext') {
                toolbar.classList.add('context-open');
            } else {
                toolbar.classList.add('folder-open');
            }
        },


        popuphiding: function (e) {
            let that = window.PersonalToolbarAutoHide,
                toolbar = that.toolbar;
            if (e.id == 'placesContext') {
                toolbar.classList.remove('context-open');
            } else {
                toolbar.classList.remove('folder-open');
            }
        },

        setStyle: function () {
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
                @-moz-document url('chrome://browser/content/browser.xhtml') {
                    #main-window[auto-hide-personaltoolbar] #nav-bar {
                        position: relative;
                        z-index: 101;
                    }
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar:not([customizing="true"]) {
                        position: ${this.position};
                        width: 100%;
                        --margin-fix: -${this.toolbarHeight};
                        opacity: 0 !important;
                        transition: all 0.5s ease 0s !important;
                        z-index: -100;
                        margin-top: var(--margin-fix) !important;
                        background-image: var(--lwt-header-image), var(--lwt-additional-images);
                        background-repeat: no-repeat, var(--lwt-background-tiling);
                        background-position: right top, var(--lwt-background-alignment);
                        box-shadow: 0 calc(1 * var(--tabs-navbar-shadow-size)) 0 var(--lwt-tabs-border-color, rgba(0,0,0,.3));
                    }
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar:not([customizing="true"]):before {
                        position: absolute;
                        content: "";
                        display: block;
                        background-color: var(--toolbar-bgcolor) !important;
                        height: calc(0px - var(--margin-fix));
                        width: 100%;
                    }
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar.folder-open,
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar.context-open,
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar:hover,
                    #main-window[auto-hide-personaltoolbar] #nav-bar:hover+#PersonalToolbar:not([customizing="true"]) {
                        opacity: 1.0 !important;
                        transition-delay: .2s !important; /* 可以根据习惯修改延时 */
                        margin-top: 0 !important;
                        margin-bottom: var(--margin-fix);
                        z-index: 100;
                    }
                    
                    #main-window[auto-hide-personaltoolbar] #PersonalToolbar:not([customizing="true"]) {
                        -moz-window-dragging: no-drag !important;
                    }
                }
              `)),
                type: this.sss.AGENT_SHEET
            }
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        }
    }

    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }

    function $C(type, props = {}, aDoc) {
        const appVersion = Services.appinfo.version.split(".")[0];
        var el;
        if (appVersion >= 69) {
            el = aDoc.createXULElement(type);
        } else {
            el = aDoc.createElement(type);
        }
        el = $A(el, props);
        el.classList.add('bmopt');
        if (type === "menu" || type === "menuitem") {
            el.classList.add(type + "-iconic");
        }
        return el;
    }

    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }
    window.PersonalToolbarAutoHide.init();
})();