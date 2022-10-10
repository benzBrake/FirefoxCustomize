// ==UserScript==
// @name           PersonalToolbarAutoHide.uc.js
// @description    书签工具栏自动隐藏
// @compatibility  Firefox 68
// @author         Ryan
// @included       chrome://browser/content/browser.xhtml
// @shutdown       UC.PersonalToolbarAutoHide.unload();
// @homepage       https://github.com/benzBrake/FirefoxCustomize
// @version        1.0
// @onlyonce
// ==/UserScript==
UC.PersonalToolbarAutoHide = {
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
            this.setStyle();
            if (this.context) {
                this.context.addEventListener('popupshowing', UC.PersonalToolbarAutoHide.popupshowing, false);
                this.context.addEventListener('popuphiding', UC.PersonalToolbarAutoHide.popuphiding, false);
            }
            let timeOut, config = { childList: true };
            this.observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    if (m.type == 'childList') {
                        clearTimeout(timeOut);
                        setTimeout(function () {
                            UC.PersonalToolbarAutoHide.addEvent();
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
                if (!e.getAttribute('pbah')) {
                    e.setAttribute('pbah', 'true');
                    e.addEventListener('popupshowing', UC.PersonalToolbarAutoHide.popupshowing, true);
                    e.addEventListener('popuphiding', UC.PersonalToolbarAutoHide.popuphiding, true);
                }
            }
        });
    },
    unload: function () {
        if (this.toolbar) {
            this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            this.toolbar.classList.remove('context-open');
            this.toolbar.classList.remove('folder-open');
        }
        if (this.context) {
            this.context.removeEventListener('popupshowing', UC.PersonalToolbarAutoHide.popupshowing);
            this.context.removeEventListener('popuphiding', UC.PersonalToolbarAutoHide.popuphiding);
        }
        let target = document.getElementById('PlacesToolbarItems');
        target.querySelectorAll("menupopup").forEach(e => {
            if (e.getAttribute('pbah')) {
                e.removeAttribute('pbah');
                if (!e.getAttribute('pbah')) {
                    e.setAttribute('pbah', 'true');
                    e.addEventListener('popupshowing', UC.PersonalToolbarAutoHide.popupshowing, true);
                    e.addEventListener('popuphiding', UC.PersonalToolbarAutoHide.popuphiding, true);
                }
            }
        });
        delete UC.PersonalToolbarAutoHide;
    },

    popupshowing: function (e) {
        let that = UC.PersonalToolbarAutoHide,
            toolbar = that.toolbar;
        if (e.id == 'placesContext') {
            toolbar.classList.add('context-open');
        } else {
            toolbar.classList.add('folder-open');
        }
    },


    popuphiding: function (e) {
        let that = UC.PersonalToolbarAutoHide,
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
                #nav-bar {
                    position: relative;
                    z-index: 101;
                  }
                #PersonalToolbar:not([customizing="true"]) {
                  position: absolute;
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
                #PersonalToolbar:not([customizing="true"]):before {
                  position: absolute;
                  content: "";
                  display: block;
                  background-color: var(--toolbar-bgcolor) !important;
                  height: calc(0px - var(--margin-fix));
                  width: 100%;
                }
                #PersonalToolbar.folder-open,
                #PersonalToolbar.context-open,
                #PersonalToolbar:hover,
                #nav-bar:hover+#PersonalToolbar:not([customizing="true"]) {
                  opacity: 1.0 !important;
                  transition-delay: .2s !important; /* 可以根据习惯修改延时 */
                  margin-top: 0 !important;
                  margin-bottom: var(--margin-fix);
                  z-index: 100;
                }
                
                #PersonalToolbar:not([customizing="true"]) {
                  -moz-window-dragging: no-drag !important;
                }
            }
          `)),
            type: this.sss.AGENT_SHEET
        }
        this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
    },
}
UC.PersonalToolbarAutoHide.init();