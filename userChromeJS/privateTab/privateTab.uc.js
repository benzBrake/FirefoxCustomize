// ==UserScript==
// @name            PrivateTab
// @author          xiaoxiaoflood
// @include         main
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @startup         window.privateTab.exec(win);
// @shutdown        window.privateTab.destroy();
// @onlyonce
// ==/UserScript==
(function () {
    const {
        AddonManager,
        BrowserWindowTracker,
        ContextualIdentityService,
        customElements,
        CustomizableUI,
        gBrowser,
        MozElements,
        PlacesUIUtils,
        PlacesUtils,
        PrivateBrowsingUtils
    } = window;

    window.privateTabUtils = {
        BROWSERTYPE: AppConstants.MOZ_APP_NAME == 'thunderbird' ? 'mail:3pane' : 'navigator:browser',
        BROWSERCHROME: AppConstants.MOZ_APP_NAME == 'thunderbird' ? 'chrome://messenger/content/messenger.xhtml' : 'chrome://browser/content/browser.xhtml',
        sss: Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        createElement: function (doc, tag, atts, XUL = true) {
            let el = XUL ? doc.createXULElement(tag) : doc.createElement(tag);
            for (let att in atts) {
                el.setAttribute(att, atts[att]);
            }
            return el
        },
        windows: function (fun, onlyBrowsers = true) {
            let windows = Services.wm.getEnumerator(onlyBrowsers ? this.BROWSERTYPE : null);
            while (windows.hasMoreElements()) {
                let win = windows.getNext();
                if (!win.privateTabUtils)
                    continue;
                if (!onlyBrowsers) {
                    let frames = win.docShell.getAllDocShellsInSubtree(Ci.nsIDocShellTreeItem.typeAll, Ci.nsIDocShell.ENUMERATE_FORWARDS);
                    let res = frames.some(frame => {
                        let fWin = frame.domWindow;
                        let { document, location } = fWin;
                        if (fun(document, fWin, location))
                            return true;
                    });
                    if (res)
                        break;
                } else {
                    let { document, location } = win;
                    if (fun(document, win, location))
                        break;
                }
            }
        },
    }

    window.privateTab = {
        config: {
            neverClearData: false, // if you want to not record history but don't care about other data, maybe even want to keep private logins
            restoreTabsOnRestart: true,
            doNotClearDataUntilFxIsClosed: true,
            deleteContainerOnDisable: false,
            clearDataOnDisable: false,
            profileName: '无痕',
        },

        strstr: function (str) {
            return str.replace("%s", this.config.profileName);
        },

        openTabs: new Set(),

        exec: function (win) {
            if (win.PrivateBrowsingUtils.isWindowPrivate(win))
                return;

            let { document } = win;

            let openAll = document.getElementById('placesContext_openBookmarkContainer:tabs');
            let openAllPrivate = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'openAllPrivate',
                label: this.strstr('在%s标签中全部打开'),
                accesskey: 'v',
                class: 'menuitem-iconic privatetab-icon',
                oncommand: 'event.userContextId = ' + window.privateTab.container.userContextId + '; ' + openAll.getAttribute('oncommand'),
                onclick: 'event.userContextId = ' + window.privateTab.container.userContextId + '; ' + openAll.getAttribute('onclick'),
            });
            openAll.insertAdjacentElement('afterend', openAllPrivate);

            let openAllLinks = document.getElementById('placesContext_openLinks:tabs');
            let openAllLinksPrivate = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'openAllLinksPrivate',
                label: this.strstr('在%s标签中全部打开'),
                accesskey: 'v',
                class: 'menuitem-iconic privatetab-icon',
                oncommand: 'event.userContextId = ' + window.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('oncommand'),
                onclick: 'event.userContextId = ' + window.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('onclick'),
            });
            openAllLinks.insertAdjacentElement('afterend', openAllLinksPrivate);

            let openTab = document.getElementById('placesContext_open:newtab');
            let openPrivate = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'openPrivate',
                label: this.strstr('在%s标签中打开'),
                accesskey: 'v',
                class: 'menuitem-iconic privatetab-icon',
                oncommand: 'let view = event.target.parentElement._view; PlacesUIUtils._openNodeIn(view.selectedNode, "tab", view.ownerWindow, { aPrivate: false, userContextId: ' + window.privateTab.container.userContextId + '})',
            });
            openTab.insertAdjacentElement('afterend', openPrivate);

            document.getElementById('placesContext').addEventListener('popupshowing', this.placesContext);

            if (win.location.href != window.privateTabUtils.BROWSERCHROME)
                return;

            let { customElements, gBrowser, MozElements } = win;

            let keyset = window.privateTabUtils.createElement(document, 'keyset', { id: 'privateTab-keyset' });
            document.getElementById('mainKeyset').insertAdjacentElement('afterend', keyset);

            let toggleKey = window.privateTabUtils.createElement(document, 'key', {
                id: 'togglePrivateTab-key',
                modifiers: 'alt control',
                key: 'T',
                oncommand: 'window.privateTab.togglePrivate(window)',
            });
            keyset.appendChild(toggleKey);

            let newPrivateTabKey = window.privateTabUtils.createElement(document, 'key', {
                id: 'newPrivateTab-key',
                modifiers: 'alt control',
                key: 'P',
                oncommand: 'window.privateTab.BrowserOpenTabPrivate(window)',
            });
            keyset.appendChild(newPrivateTabKey);

            let menuOpenLink = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'menu_newPrivateTab',
                label: this.strstr('打开新%s标签'),
                accesskey: 'v',
                acceltext: 'Ctrl+Alt+P',
                class: 'menuitem-iconic privatetab-icon',
                oncommand: 'window.privateTab.BrowserOpenTabPrivate(window)',
            });
            document.getElementById('menu_newNavigatorTab').insertAdjacentElement('afterend', menuOpenLink);

            let openLink = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'openLinkInPrivateTab',
                label: this.strstr('在%s标签中打开'),
                accesskey: 'v',
                class: 'menuitem-iconic privatetab-icon',
                hidden: true
            });

            openLink.addEventListener('command', (e) => {
                let { gContextMenu } = win;
                win.openLinkIn(gContextMenu.linkURL, 'tab', gContextMenu._openLinkInParameters({
                    userContextId: window.privateTab.container.userContextId,
                    triggeringPrincipal: document.nodePrincipal,
                }));
            }, false);

            document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', this.contentContext);
            document.getElementById('contentAreaContextMenu').addEventListener('popuphidden', this.hideContext);
            document.getElementById('context-openlinkintab').insertAdjacentElement('afterend', openLink);

            let toggleTab = window.privateTabUtils.createElement(document, 'menuitem', {
                id: 'toggleTabPrivateState',
                label: this.strstr('%s标签'),
                type: 'checkbox',
                accesskey: 'v',
                acceltext: 'Ctrl+Alt+T',
                oncommand: 'window.privateTab.togglePrivate(window, TabContextMenu.contextTab)',
            });
            document.getElementById('context_pinTab').insertAdjacentElement('afterend', toggleTab);
            document.getElementById('tabContextMenu').addEventListener('popupshowing', this.tabContext);

            let privateMask = document.getElementsByClassName('private-browsing-indicator')[0];
            privateMask.id = 'private-mask';

            let btn2 = window.privateTabUtils.createElement(document, 'toolbarbutton', {
                id: this.BTN2_ID,
                label: this.strstr('打开新%s标签'),
                tooltiptext: this.strstr('打开新%s标签(Ctrl+Alt+P)'),
                class: 'toolbarbutton-1 chromeclass-toolbar-additional',
            });

            btn2.addEventListener('click', function (e) {
                if (e.button == 0) {
                    window.privateTab.BrowserOpenTabPrivate(win);
                } else if (e.button == 2) {
                    document.getElementById('toolbar-context-menu').openPopup(this, 'after_start', 14, -10, false, false);
                    //document.getElementsByClassName('customize-context-removeFromToolbar')[0].disabled = false;
                    //document.getElementsByClassName('customize-context-moveToPanel')[0].disabled = false;
                    e.preventDefault();
                }
            });

            document.getElementById('tabs-newtab-button').insertAdjacentElement('afterend', btn2);

            gBrowser.tabContainer.addEventListener('TabSelect', this.onTabSelect);

            gBrowser.privateListener = (e) => {
                let browser = e.target;
                let tab = gBrowser.getTabForBrowser(browser);
                if (!tab)
                    return;
                let isPrivate = this.isPrivate(tab);

                if (!isPrivate) {
                    if (this.observePrivateTabs) {
                        this.openTabs.delete(tab);
                        if (!this.openTabs.size)
                            this.clearData();
                    }
                    return;
                }

                if (this.observePrivateTabs)
                    this.openTabs.add(tab)

                browser.browsingContext.useGlobalHistory = false;
            }

            win.addEventListener('XULFrameLoaderCreated', gBrowser.privateListener);

            if (this.observePrivateTabs)
                gBrowser.tabContainer.addEventListener('TabClose', this.onTabClose);

            MozElements.MozTab.prototype.getAttribute = function (att) {
                if (att == 'usercontextid' && this.isToggling) {
                    delete this.isToggling;
                    return window.privateTab.orig_getAttribute.call(this, att) ==
                        window.privateTab.container.userContextId ? 0 : window.privateTab.container.userContextId;
                } else {
                    return window.privateTab.orig_getAttribute.call(this, att);
                }
            };

            customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility = function () {
                let wrap = n =>
                    n.parentNode.localName == "toolbarpaletteitem" ? n.parentNode : n;
                let unwrap = n =>
                    n && n.localName == "toolbarpaletteitem" ? n.firstElementChild : n;

                let newTabFirst = false;
                let sibling = (id, otherId) => {
                    let sib = this;
                    do {
                        if (sib.id == "new-tab-button")
                            newTabFirst = true;
                        sib = unwrap(wrap(sib).nextElementSibling);
                    } while (sib && (sib.hidden || sib.id == "alltabs-button" || sib.id == otherId));
                    return sib?.id == id && sib;
                }

                const kAttr = "hasadjacentnewtabbutton";
                let adjacentNetTab = sibling("new-tab-button", window.privateTab.BTN_ID);
                if (adjacentNetTab) {
                    this.setAttribute(kAttr, "true");
                } else {
                    this.removeAttribute(kAttr);
                }

                const kAttr2 = "hasadjacentnewprivatetabbutton";
                let adjacentPrivateTab = sibling(window.privateTab.BTN_ID, "new-tab-button");
                if (adjacentPrivateTab) {
                    this.setAttribute(kAttr2, "true");
                } else {
                    this.removeAttribute(kAttr2);
                }

                if (adjacentNetTab && adjacentPrivateTab) {
                    let doc = adjacentPrivateTab.ownerDocument;
                    if (newTabFirst)
                        doc.getElementById('tabs-newtab-button').insertAdjacentElement('afterend', doc.getElementById(window.privateTab.BTN2_ID));
                    else
                        doc.getElementById(window.privateTab.BTN2_ID).insertAdjacentElement('afterend', doc.getElementById('tabs-newtab-button'));
                }
            };
        },

        init: function () {
            ContextualIdentityService.ensureDataReady();
            this.container = ContextualIdentityService._identities.find(container => container.name == this.config.profileName);
            if (!this.container) {
                ContextualIdentityService.create(this.config.profileName, 'fingerprint', 'purple');
                this.container = ContextualIdentityService._identities.find(container => container.name == this.config.profileName);
            } else if (!this.config.neverClearData) {
                this.clearData();
            }

            this.setStyle();
            window.privateTabUtils.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

            ChromeUtils.import('resource:///modules/sessionstore/TabStateCache.jsm', this);

            let { gSeenWidgets } = Cu.import('resource:///modules/CustomizableUI.jsm');
            let firstRun = !gSeenWidgets.has(this.BTN_ID);

            if (firstRun) {
                let listener = {
                    onWidgetAfterCreation: function (id) {
                        if (id == window.privateTab.BTN_ID) {
                            setTimeout(() => {
                                let newTabPlacement = CustomizableUI.getPlacementOfWidget('new-tab-button')?.position;
                                if (newTabPlacement && Services.wm.getMostRecentBrowserWindow().gBrowser.tabContainer.hasAttribute('hasadjacentnewtabbutton'))
                                    CustomizableUI.addWidgetToArea(window.privateTab.BTN_ID, CustomizableUI.AREA_TABSTRIP, newTabPlacement + 1);
                            }, 0);
                            CustomizableUI.removeListener(this);
                        }
                    }
                }
                CustomizableUI.addListener(listener);
            }

            if (!(CustomizableUI.getWidget(window.privateTab.BTN_ID) && CustomizableUI.getWidget(window.privateTab.BTN_ID).forWindow(window)?.node)) {
                CustomizableUI.createWidget({
                    id: window.privateTab.BTN_ID,
                    type: 'custom',
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    showInPrivateBrowsing: false,
                    onBuild: (doc) => {
                        let btn = window.privateTabUtils.createElement(doc, 'toolbarbutton', {
                            id: window.privateTab.BTN_ID,
                            label: this.strstr('打开新%s标签'),
                            tooltiptext: this.strstr("打开新%s标签(Ctrl+Alt+P)"),
                            class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                            oncommand: 'window.privateTab.BrowserOpenTabPrivate(window)',
                        });

                        return btn;
                    }
                });
            }

            const lazy = {
                BrowserWindowTracker,
                PrivateBrowsingUtils,
            };

            // resource:///modules/PlacesUIUtils.sys.mjs
            function getBrowserWindow(aWindow) {
                return aWindow &&
                    aWindow.document.documentElement.getAttribute('windowtype') ==
                    'navigator:browser'
                    ? aWindow
                    : lazy.BrowserWindowTracker.getTopWindow();
            }

            eval('PlacesUIUtils.openTabset = function ' +
                PlacesUIUtils.openTabset.toString().replace(/(\s+)(inBackground: loadInBackground,)/,
                    '$1$2$1userContextId: aEvent.userContextId || 0,'));

            let { UUIDMap } = Cu.import('resource://gre/modules/Extension.jsm');
            let TST_ID = 'treestyletab@piro.sakura.ne.jp';
            this.TST_UUID = UUIDMap.get(TST_ID, false);//null se nao tiver

            if (this.TST_UUID)
                this.setTstStyle(this.TST_UUID);
            AddonManager.addAddonListener({
                onInstalled: addon => {
                    if (addon.id == TST_ID)
                        this.setTstStyle(UUIDMap.get(TST_ID, false));
                },
                onUninstalled: addon => {
                    if (addon.id == TST_ID)
                        window.privateTabUtils.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
                }
            });

            if (!this.config.neverClearData) {
                let observe = () => {
                    this.clearData();
                    if (!this.config.restoreTabsOnRestart)
                        this.closeTabs();
                }
                Services.obs.addObserver(observe, 'quit-application-granted');
            }

            if (typeof _uc === "undefined") {
                this.exec(window);
            }
        },

        clearData: function () {
            Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId: this.container.userContextId });
        },

        closeTabs: function () {
            ContextualIdentityService._forEachContainerTab((tab, tabbrowser) => {
                if (tab.userContextId == this.container.userContextId)
                    tabbrowser.removeTab(tab);
            });
        },

        togglePrivate: function (win, tab = win.gBrowser.selectedTab) {
            let { gBrowser } = win;
            tab.isToggling = true;
            let shouldSelect = tab == win.gBrowser.selectedTab;
            let newTab = gBrowser.duplicateTab(tab);
            let newBrowser = newTab.linkedBrowser;
            win.addEventListener('SSWindowStateReady', () => {
                this.TabStateCache.update(newBrowser.permanentKey, {
                    userContextId: newTab.userContextId
                });
            }, { once: true });
            if (shouldSelect) {
                let gURLBar = win.gURLBar;
                let focusUrlbar = gURLBar.focused;
                gBrowser.selectedTab = newTab;
                if (focusUrlbar)
                    gURLBar.focus();
            }
            gBrowser.removeTab(tab);
        },

        toggleMask: function (win) {
            let { gBrowser } = win;
            let privateMask = win.document.getElementById('private-mask');
            if (gBrowser.selectedTab.isToggling)
                privateMask.setAttribute('enabled', gBrowser.selectedTab.userContextId == this.container.userContextId ? 'false' : 'true');
            else
                privateMask.setAttribute('enabled', gBrowser.selectedTab.userContextId == this.container.userContextId ? 'true' : 'false');
        },

        BrowserOpenTabPrivate: function (win) {
            win.openTrustedLinkIn(win.BROWSER_NEW_TAB_URL, 'tab', {
                userContextId: this.container.userContextId,
            });
        },

        isPrivate: function (tab) {
            return tab.getAttribute('usercontextid') == this.container.userContextId;
        },

        contentContext: function (e) {
            let win = e.view;
            let gContextMenu = win.gContextMenu;
            let tab = win.gBrowser.getTabForBrowser(gContextMenu.browser);
            gContextMenu.showItem('openLinkInPrivateTab', gContextMenu.onSaveableLink || gContextMenu.onPlainTextLink);
            let isPrivate = window.privateTab.isPrivate(tab);
            if (isPrivate)
                gContextMenu.showItem('context-openlinkincontainertab', false);
        },

        hideContext: function (e) {
            if (e.target == this)
                e.view.document.getElementById('openLinkInPrivateTab').hidden = true;
        },

        tabContext: function (e) {
            let win = e.view;
            win.document.getElementById('toggleTabPrivateState').setAttribute('checked', win.TabContextMenu.contextTab.userContextId == window.privateTab.container.userContextId);
        },

        placesContext: function (e) {
            let win = e.view;
            let { document } = win;
            document.getElementById('openPrivate').disabled = document.getElementById('placesContext_open:newtab').disabled;
            document.getElementById('openPrivate').hidden = document.getElementById('placesContext_open:newtab').hidden;
            document.getElementById('openAllPrivate').disabled = document.getElementById('placesContext_openBookmarkContainer:tabs').disabled;
            document.getElementById('openAllPrivate').hidden = document.getElementById('placesContext_openBookmarkContainer:tabs').hidden;
            document.getElementById('openAllLinksPrivate').disabled = document.getElementById('placesContext_openLinks:tabs').disabled;
            document.getElementById('openAllLinksPrivate').hidden = document.getElementById('placesContext_openLinks:tabs').hidden;
        },

        onTabSelect: function (e) {
            let tab = e.target;
            let win = tab.ownerGlobal;
            let prevTab = e.detail.previousTab;
            if (tab.userContextId != prevTab.userContextId)
                window.privateTab.toggleMask(win);
        },

        onTabClose: function (e) {
            let tab = e.target;
            if (window.privateTab.isPrivate(tab)) {
                window.privateTab.openTabs.delete(tab);
                if (!window.privateTab.openTabs.size)
                    window.privateTab.clearData();
            }
        },

        get observePrivateTabs() {
            return this.observePrivateTabs = !this.config.neverClearData && !this.config.doNotClearDataUntilFxIsClosed;
        },

        orig_getAttribute: MozElements.MozTab.prototype.getAttribute,
        orig_allTabs: Object.getOwnPropertyDescriptor(Object.getPrototypeOf(gBrowser.tabContainer), 'allTabs').get,
        orig_insertBefore: customElements.get('tabbrowser-tabs').prototype.insertBefore,
        orig__updateNewTabVisibility: customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility,
        orig_openTabset: PlacesUIUtils.openTabset,

        BTN_ID: 'privateTab-button',
        BTN2_ID: 'newPrivateTab-button',

        setStyle: function () {
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${window.privateTabUtils.BROWSERCHROME}'), url-prefix('chrome://browser/content/places/') {
          #private-mask[enabled="true"] {
            display: block !important;
          }

          .privatetab-icon {
            list-style-image: url(chrome://browser/skin/privatebrowsing/favicon.svg) !important;
          }

          #${window.privateTab.BTN_ID}, #${window.privateTab.BTN2_ID} {
            list-style-image: url(chrome://browser/skin/privateBrowsing.svg);
          }

          #tabbrowser-tabs[hasadjacentnewprivatetabbutton]:not([overflow="true"]) ~ #${window.privateTab.BTN_ID},
          #tabbrowser-tabs[overflow="true"] > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${window.privateTab.BTN2_ID},
          #tabbrowser-tabs:not([hasadjacentnewprivatetabbutton]) > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${window.privateTab.BTN2_ID},
          #TabsToolbar[customizing="true"] #${window.privateTab.BTN2_ID} {
            display: none;
          }

          .tabbrowser-tab[usercontextid="${window.privateTab.container.userContextId}"] .tab-label {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tabbrowser-tab[usercontextid="${window.privateTab.container.userContextId}"][pinned] .tab-icon-image,
          .tabbrowser-tab[usercontextid="${window.privateTab.container.userContextId}"][pinned] .tab-throbber {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
                type: window.privateTabUtils.sss.USER_SHEET
            }
        },

        setTstStyle: function (uuid) {
            this.TST_STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document  url-prefix(moz-extension://${uuid}/sidebar/sidebar.html) {
          .tab.contextual-identity-firefox-container-${window.privateTab.container.userContextId} .label-content {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tab.contextual-identity-firefox-container-${window.privateTab.container.userContextId} tab-favicon {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
                type: window.privateTabUtils.sss.USER_SHEET
            };
            window.privateTabUtils.sss.loadAndRegisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
        },

        destroy: function () {
            const {
                ContextualIdentityService,
                CustomizableUI,
                PlacesUIUtils
            } = Services.wm.getMostRecentBrowserWindow();

            if (this.config.deleteContainerOnDisable)
                ContextualIdentityService.remove(this.container.userContextId);
            else if (this.config.clearDataOnDisable)
                Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId: this.container.userContextId });

            this.openTabs.forEach(tab => tab.ownerGlobal.gBrowser.removeTab(tab));

            window.privateTabUtils.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            if (this.TST_STYLE)
                window.privateTabUtils.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);

            window.privateTabUtils.windows((doc, win) => {
                if (!doc.getElementById('openAllPrivate'))
                    return;
                doc.getElementById('openAllPrivate').remove();
                doc.getElementById('openAllLinksPrivate').remove();
                doc.getElementById('openPrivate').remove();
                doc.getElementById('placesContext').removeEventListener('popupshowing', this.placesContext);
                let { gBrowser } = win;
                if (!gBrowser)
                    return;
                doc.getElementById('privateTab-keyset').remove();
                doc.getElementById('menu_newPrivateTab').remove();
                doc.getElementById('openLinkInPrivateTab').remove();
                doc.getElementById('toggleTabPrivateState').remove();
                doc.getElementById(this.BTN2_ID).remove();
                gBrowser.tabContainer.removeEventListener('TabSelect', this.onTabSelect);
                gBrowser.tabContainer.removeEventListener('TabClose', this.onTabClose);
                win.addEventListener('XULFrameLoaderCreated', gBrowser.privateListener);
                doc.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', this.contentContext);
                doc.getElementById('contentAreaContextMenu').removeEventListener('popuphidden', this.hideContext);
                doc.getElementById('tabContextMenu').removeEventListener('popupshowing', this.tabContext);
                win.MozElements.MozTab.prototype.getAttribute = this.orig_getAttribute;
                win.Object.defineProperty(gBrowser.tabContainer, 'allTabs', {
                    get: (this.orig_allTabs),
                    configurable: true
                });
                win.customElements.get('tabbrowser-tabs').prototype.insertBefore = this.orig_insertBefore;
                win.customElements.get('tabbrowser-tabs').prototype._updateNewTabVisibility = this.orig__updateNewTabVisibility;
                gBrowser.tabContainer.removeAttribute('hasadjacentnewprivatetabbutton');
                doc.getElementById('private-mask').removeAttribute('enabled');
                doc.getElementById('private-mask').removeAttribute('id');
            }, false);

            CustomizableUI.destroyWidget(this.BTN_ID);

            PlacesUIUtils.openTabset = this.orig_openTabset;

            delete window.privateTab;
        }
    }

    window.privateTab.init();
})();
