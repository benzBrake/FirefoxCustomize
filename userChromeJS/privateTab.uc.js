// ==UserScript==
// @name            PrivateTab
// @description     无痕标签
// @author          Ryan, xiaoxiaoflood
// @include         main
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @startup         UC.privateTab.exec(win);
// @shutdown        UC.privateTab.destroy();
// @note            2020-11-29 修改右键功能，汉化
// @onlyonce
// ==/UserScript==

UC.privateTab = {
  config: {
    neverClearData: false, // 关闭标签后是否保留数据 开启这个功能就不是无痕标签了 if you want to not record history but don't care about other data, maybe even want to keep private logins
    restoreTabsOnRestart: true,
    doNotClearDataUntilFxIsClosed: true,
    deleteContainerOnDisable: false,
    clearDataOnDisable: false,
    profileName: '无痕',
  },

  openTabs: new Set(),
  strstr: function(str) {
      return str.replace('%s', this.config.profileName);
  },
  exec: function (win) {
    if (win.PrivateBrowsingUtils.isWindowPrivate(win))
      return;

    let {document} = win;

    let openAll = document.getElementById('placesContext_openContainer:tabs');
    let openAllPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openAllPrivate',
      label: this.strstr('在%s标签中全部打开'),
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAll.getAttribute('oncommand'),
      onclick: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAll.getAttribute('onclick'),
    });
    openAll.insertAdjacentElement('afterend', openAllPrivate);

    let openAllLinks = document.getElementById('placesContext_openLinks:tabs');
    let openAllLinksPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openAllLinksPrivate',
      label: this.strstr('在%s标签中全部打开'),
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('oncommand'),
      onclick: 'event.userContextId = ' + UC.privateTab.container.userContextId + '; ' + openAllLinks.getAttribute('onclick'),
    });
    openAllLinks.insertAdjacentElement('afterend', openAllLinksPrivate);

    let openTab = document.getElementById('placesContext_open:newtab');
    let openPrivate = _uc.createElement(document, 'menuitem', {
      id: 'openPrivate',
      label: this.strstr('在%s标签中打开'),
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'let view = event.target.parentElement._view; PlacesUIUtils._openNodeIn(view.selectedNode, "tab", view.ownerWindow, false, ' + UC.privateTab.container.userContextId + ')',
    });
    openTab.insertAdjacentElement('afterend', openPrivate);

    document.getElementById('placesContext').addEventListener('popupshowing', this.placesContext);

    if (win.location.href != _uc.BROWSERCHROME)
      return;

    let {customElements, gBrowser, MozElements} = win;

    let keyset =  _uc.createElement(document, 'keyset', { id: 'privateTab-keyset' });
    document.getElementById('mainKeyset').insertAdjacentElement('afterend', keyset);

    let toggleKey = _uc.createElement(document, 'key', {
      id: 'togglePrivateTab-key',
      modifiers: 'alt control',
      key: 'T',
      oncommand: 'UC.privateTab.togglePrivate(window)',
    });
    keyset.appendChild(toggleKey);

    let newPrivateTabKey = _uc.createElement(document, 'key', {
      id: 'newPrivateTab-key',
      modifiers: 'alt control',
      key: 'P',
      oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
    });
    keyset.appendChild(newPrivateTabKey);

    let menuOpenLink = _uc.createElement(document, 'menuitem', {
      id: 'menu_newPrivateTab',
      label: this.strstr('打开新%s标签'),
      accesskey: 'v',
      acceltext: 'Ctrl+Alt+P',
      class: 'menuitem-iconic privatetab-icon',
      oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
    });
    document.getElementById('menu_newNavigatorTab').insertAdjacentElement('afterend', menuOpenLink);

    let openLink = _uc.createElement(document, 'menuitem', {
      id: 'openLinkInPrivateTab',
      label: this.strstr('在%s标签中打开'),
      accesskey: 'v',
      class: 'menuitem-iconic privatetab-icon',
    });

    openLink.addEventListener('command', (e) => {
      let {gContextMenu} = win;
      win.openLinkIn(gContextMenu.linkURL, 'tab', gContextMenu._openLinkInParameters({
        userContextId: UC.privateTab.container.userContextId,
        triggeringPrincipal: document.nodePrincipal,
      }));
    }, false);

    document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', this.contentContext);
    document.getElementById('context-openlinkintab').insertAdjacentElement('afterend', openLink);

    let toggleTab = _uc.createElement(document, 'menuitem', {
      id: 'toggleTabPrivateState',
      label: this.strstr('%s标签'),
      type: 'checkbox',
      accesskey: 'v',
      acceltext: 'Ctrl+Alt+T',
      oncommand: 'UC.privateTab.togglePrivate(window, TabContextMenu.contextTab)',
    });
    document.getElementById('context_pinTab').insertAdjacentElement('afterend', toggleTab);
    document.getElementById('tabContextMenu').addEventListener('popupshowing', this.tabContext);

    let privateMask = document.getElementsByClassName('private-browsing-indicator')[0];
    privateMask.id = 'private-mask';

    let btn2 = _uc.createElement(document, 'toolbarbutton', {
      id: this.BTN2_ID,
      label: this.strstr('打开新%s标签'),
      tooltiptext: this.strstr('打开新%s标签(Ctrl+Alt+P)'),
      class: 'toolbarbutton-1 chromeclass-toolbar-additional',
    });

    btn2.addEventListener('click', function (e) {
      if (e.button == 0) {
        UC.privateTab.BrowserOpenTabPrivate(win);
      } else if (e.button == 2) {
        document.popupNode = document.getElementById(UC.privateTab.BTN_ID);
        document.getElementById('new-tab-button-popup').openPopup(this, 'after_start', 14, -10, false, false);
        document.getElementsByClassName('customize-context-removeFromToolbar')[0].disabled = false;
        document.getElementsByClassName('customize-context-moveToPanel')[0].disabled = false;
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

        if ('useGlobalHistory' in browser.browsingContext) // fx78+
          browser.browsingContext.useGlobalHistory = false;
        else // fx77-
          browser.messageManager.loadFrameScript(this.frameScript, false);
    }

    win.addEventListener('XULFrameLoaderCreated', gBrowser.privateListener);

    if(this.observePrivateTabs)
      gBrowser.tabContainer.addEventListener('TabClose', this.onTabClose);

    MozElements.MozTab.prototype.getAttribute = function (att) {
      if (att == 'usercontextid' && this.isToggling) {
        delete this.isToggling;
        return UC.privateTab.orig_getAttribute.call(this, att) ? 0 : UC.privateTab.container.userContextId;
      } else {
        return UC.privateTab.orig_getAttribute.call(this, att);
      }
    };

    win.Object.defineProperty(customElements.get('tabbrowser-tabs').prototype, 'allTabs', {
      get: function allTabs() {
        let children = Array.from(this.arrowScrollbox.children);
        while (children.length && children[children.length - 1].tagName != 'tab')
          children.pop();
        return children;
      }
    });

    customElements.get('tabbrowser-tabs').prototype.insertBefore = function (tab, node) {
      if (!this.arrowScrollbox) {
        throw new Error("错误: arrowscrollbox 不存在！");
      }

      let { arrowScrollbox } = this;
      if (node == null) {
        node = arrowScrollbox.lastChild.previousSibling.previousSibling;
      }
      return arrowScrollbox.insertBefore(tab, node);
    }

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
      let adjacentNetTab = sibling("new-tab-button", UC.privateTab.BTN_ID);
      if (adjacentNetTab) {
        this.setAttribute(kAttr, "true");
      } else {
        this.removeAttribute(kAttr);
      }

      const kAttr2 = "hasadjacentnewprivatetabbutton";
      let adjacentPrivateTab = sibling(UC.privateTab.BTN_ID, "new-tab-button");
      if (adjacentPrivateTab) {
        this.setAttribute(kAttr2, "true");
      } else {
        this.removeAttribute(kAttr2);
      }

      if (adjacentNetTab && adjacentPrivateTab) {
        let doc = adjacentPrivateTab.ownerDocument;
        if (newTabFirst)
          doc.getElementById('tabs-newtab-button').insertAdjacentElement('afterend', doc.getElementById(UC.privateTab.BTN2_ID));
        else
          doc.getElementById(UC.privateTab.BTN2_ID).insertAdjacentElement('afterend', doc.getElementById('tabs-newtab-button'));
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
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);

    let { gSeenWidgets } = Cu.import('resource:///modules/CustomizableUI.jsm');
    let firstRun = !gSeenWidgets.has(this.BTN_ID);

    if (firstRun) {
      let listener = {
        onWidgetAfterCreation: function (id) {
          if (id == UC.privateTab.BTN_ID) {
            setTimeout(() => {
              let newTabPlacement = CustomizableUI.getPlacementOfWidget('new-tab-button')?.position;
              if (newTabPlacement && Services.wm.getMostRecentBrowserWindow().gBrowser.tabContainer.hasAttribute('hasadjacentnewtabbutton'))
                CustomizableUI.addWidgetToArea(UC.privateTab.BTN_ID, CustomizableUI.AREA_TABSTRIP, newTabPlacement + 1);
            }, 0);
            CustomizableUI.removeListener(this);
          }
        }
      }
      CustomizableUI.addListener(listener);
    }

    CustomizableUI.createWidget({
      id: UC.privateTab.BTN_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      showInPrivateBrowsing: false,
      onBuild: (doc) => {
        let btn = _uc.createElement(doc, 'toolbarbutton', {
          id: UC.privateTab.BTN_ID,
          label: this.strstr('打开新%s标签') ,
          tooltiptext: this.strstr("打开新%s标签(Ctrl+Alt+P)"),
          class: 'toolbarbutton-1 chromeclass-toolbar-additional',
          oncommand: 'UC.privateTab.BrowserOpenTabPrivate(window)',
        });

        return btn;
      }
    });

    let { getBrowserWindow } = Cu.import('resource:///modules/PlacesUIUtils.jsm');
    eval('PlacesUIUtils.openTabset = function ' +
          PlacesUIUtils.openTabset.toString().replace(/(\s+)(inBackground: loadInBackground,)/,
                                                      '$1$2$1userContextId: aEvent.userContextId || 0,'));
                                                      
    eval('PlacesUIUtils._openNodeIn = ' +
          PlacesUIUtils._openNodeIn.toString().replace(/(\s+)(aPrivate = false)\n/,
                                                       '$1$2,$1userContextId = 0\n')
                                              .replace(/(\s+)(private: aPrivate,)\n/,
                                                       '$1$2$1userContextId,\n'));

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
          _uc.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
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
    let {gBrowser} = win;
    tab.isToggling = true;
    let shouldSelect = tab == win.gBrowser.selectedTab;
    let newTab = gBrowser.duplicateTab(tab);
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
    let {gBrowser} = win;
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
    let isPrivate = UC.privateTab.isPrivate(tab);
    if (isPrivate)
      gContextMenu.showItem('context-openlinkincontainertab', false);
  },

  tabContext: function (e) {
    let win = e.view;
    win.document.getElementById('toggleTabPrivateState').setAttribute('checked', win.TabContextMenu.contextTab.userContextId == UC.privateTab.container.userContextId);
  },

  placesContext: function (e) {
    let win = e.view;
    let {document} = win;
    document.getElementById('openPrivate').disabled = document.getElementById('placesContext_open:newtab').disabled;
    document.getElementById('openPrivate').hidden = document.getElementById('placesContext_open:newtab').hidden;
    document.getElementById('openAllPrivate').disabled = document.getElementById('placesContext_openContainer:tabs').disabled;
    document.getElementById('openAllPrivate').hidden = document.getElementById('placesContext_openContainer:tabs').hidden;
    document.getElementById('openAllLinksPrivate').disabled = document.getElementById('placesContext_openLinks:tabs').disabled;
    document.getElementById('openAllLinksPrivate').hidden = document.getElementById('placesContext_openLinks:tabs').hidden;
  },

  onTabSelect: function (e) {
    let tab = e.target;
    let win = tab.ownerGlobal;
    let prevTab = e.detail.previousTab;
    if (tab.userContextId != prevTab.userContextId)
      UC.privateTab.toggleMask(win);
  },

  onTabClose: function (e) {
    let tab = e.target;
    if (UC.privateTab.isPrivate(tab)) {
      UC.privateTab.openTabs.delete(tab);
      if (!UC.privateTab.openTabs.size)
        UC.privateTab.clearData();
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
  orig__openNodeIn: PlacesUIUtils._openNodeIn,

  frameScript: 'data:application/javascript;charset=UTF-8,' + encodeURIComponent('(' + (() => {
    content.docShell.useGlobalHistory = false;
  }).toString() + ')();'),

  BTN_ID: 'privateTab-button',
  BTN2_ID: 'newPrivateTab-button',

  setStyle: function () {
    this.STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}') {
          #private-mask[enabled="true"] {
            display: block !important;
          }

          .privatetab-icon {
            list-style-image: url(chrome://browser/skin/privatebrowsing/favicon.svg) !important;
          }

          #${UC.privateTab.BTN_ID}, #${UC.privateTab.BTN2_ID} {
            list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNTAgNTAiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTIxLjk4MDQ2OSAyQzE4LjEzNjcxOSAyLjA4NTkzOCAxNS4zNzUgMy4xOTkyMTkgMTMuNzY1NjI1IDUuMzEyNUMxMS45NDkyMTkgNy43MDMxMjUgMTEuNjMyODEzIDExLjI2NTYyNSAxMi43OTY4NzUgMTYuMTk1MzEzQzEyLjM4NjcxOSAxNi43MjY1NjMgMTIuMDExNzE5IDE3LjU3NDIxOSAxMi4xMDkzNzUgMTguNzM0Mzc1QzEyLjQwMjM0NCAyMC44OTg0MzggMTMuMjI2NTYzIDIxLjc4OTA2MyAxMy44OTg0MzggMjIuMTUyMzQ0QzE0LjIzNDM3NSAyMy45NTMxMjUgMTUuMjE4NzUgMjUuODYzMjgxIDE2LjEwMTU2MyAyNi43NjU2MjVDMTYuMTA1NDY5IDI2Ljk4ODI4MSAxNi4xMDkzNzUgMjcuMjAzMTI1IDE2LjExMzI4MSAyNy40MTc5NjlDMTYuMTMyODEzIDI4LjM3NSAxNi4xNDQ1MzEgMjkuMjAzMTI1IDE2LjAxOTUzMSAzMC4yNjU2MjVDMTUuNDcyNjU2IDMxLjY3MTg3NSAxMy40NDE0MDYgMzIuNDc2NTYzIDExLjA5Mzc1IDMzLjQwNjI1QzcuMTkxNDA2IDM0Ljk1MzEyNSAyLjMzNTkzOCAzNi44Nzg5MDYgMiA0Mi45NDkyMTlMMS45NDUzMTMgNDRMMjUuMzcxMDk0IDQ0QzI1LjE3OTY4OCA0My42MDU0NjkgMjUuMDE1NjI1IDQzLjE5NTMxMyAyNC44NTkzNzUgNDIuNzgxMjVDMjQuNTY2NDA2IDM5LjI1IDIyLjUgMzUuODAwNzgxIDIyLjUgMzUuODAwNzgxTDI0LjY2Nzk2OSAzMy45MDIzNDRDMjQuMzkwNjI1IDMzLjM0NzY1NiAyNC4wNTg1OTQgMzIuOTI1NzgxIDIzLjczMDQ2OSAzMi41ODIwMzFMMjUuNTg5ODQ0IDMxLjU1MDc4MUMyNS43MzgyODEgMzEuMjY1NjI1IDI1LjkwNjI1IDMwLjk5MjE4OCAyNi4wNzQyMTkgMzAuNzE4NzVDMjYuMjgxMjUgMzAuMzc4OTA2IDI2LjUwMzkwNiAzMC4wNTA3ODEgMjYuNzM0Mzc1IDI5LjczNDM3NUMyNi43ODkwNjMgMjkuNjY0MDYzIDI2LjgzNTkzOCAyOS41ODk4NDQgMjYuODkwNjI1IDI5LjUxOTUzMUMyNy4xNzk2ODggMjkuMTQwNjI1IDI3LjQ4ODI4MSAyOC43NzM0MzggMjcuODEyNSAyOC40MjU3ODFDMjcuODA0Njg4IDI3Ljg3ODkwNiAyNy44MDA3ODEgMjcuMzQzNzUgMjcuODAwNzgxIDI2Ljc1MzkwNkMyOC42Njc5NjkgMjUuODM5ODQ0IDI5LjU4OTg0NCAyMy45MjU3ODEgMjkuOTcyNjU2IDIyLjE5MTQwNkMzMC42OTE0MDYgMjEuODUxNTYzIDMxLjU4OTg0NCAyMC45Njg3NSAzMS43OTY4NzUgMTguNjgzNTk0QzMxLjg5MDYyNSAxNy41NTg1OTQgMzEuNTgyMDMxIDE2LjczMDQ2OSAzMS4xNTYyNSAxNi4xOTkyMTlDMzEuODE2NDA2IDE0LjEyODkwNiAzMi45Mzc1IDkuNTM1MTU2IDMxLjA5Mzc1IDYuNDg4MjgxQzMwLjI1MzkwNiA1LjEwMTU2MyAyOC45NDE0MDYgNC4yMzA0NjkgMjcuMTgzNTk0IDMuODgyODEzQzI2LjIxODc1IDIuNjY0MDYzIDI0LjM5ODQzOCAyIDIxLjk4MDQ2OSAyIFogTSAyMiA0QzIzLjg5MDYyNSA0IDI1LjI1MzkwNiA0LjQ3NjU2MyAyNS43MzQzNzUgNS4zMDQ2ODhMMjUuOTgwNDY5IDUuNzIyNjU2TDI2LjQ1NzAzMSA1Ljc4OTA2M0MyNy44MzU5MzggNS45ODQzNzUgMjguNzkyOTY5IDYuNTUwNzgxIDI5LjM3ODkwNiA3LjUyMzQzOEMzMC42NjQwNjMgOS42NDA2MjUgMzAuMDA3ODEzIDEzLjUgMjkuMDU4NTk0IDE2LjE2MDE1NkwyOC43NDIxODggMTYuOTg0Mzc1TDI5LjUzNTE1NiAxNy4zODI4MTNDMjkuNjI1IDE3LjQ0NTMxMyAyOS44NjMyODEgMTcuNzg5MDYzIDI5LjgwNDY4OCAxOC41MDc4MTNDMjkuNjY3OTY5IDE5Ljk4ODI4MSAyOS4xOTkyMTkgMjAuMzgyODEzIDI5LjA5NzY1NiAyMC40MDIzNDRMMjguMjM0Mzc1IDIwLjQwMjM0NEwyOC4xMDkzNzUgMjEuMjYxNzE5QzI3LjgzNTkzOCAyMy4xODM1OTQgMjYuNjgzNTk0IDI1LjE1NjI1IDI2LjMwNDY4OCAyNS40MzM1OTRMMjUuODAwNzgxIDI1LjcxODc1TDI1LjgwMDc4MSAyNi4zMDA3ODFDMjUuODAwNzgxIDI3LjMyMDMxMyAyNS44MTI1IDI4LjE5NTMxMyAyNS44NDM3NSAyOS4xMjEwOTRMMjIgMzEuMjUzOTA2TDE4LjEwNTQ2OSAyOS4wOTM3NUMxOC4xMjUgMjguNTAzOTA2IDE4LjEyMTA5NCAyNy45NDUzMTMgMTguMTA5Mzc1IDI3LjM3ODkwNkMxOC4xMDU0NjkgMjcuMDM1MTU2IDE4LjA5NzY1NiAyNi42Nzk2ODggMTguMDk3NjU2IDI2LjI5Njg3NUwxOC4wMzUxNTYgMjUuNzM0Mzc1TDE3LjYwOTM3NSAyNS40Mzc1QzE3LjIxNDg0NCAyNS4xNjc5NjkgMTUuOTcyNjU2IDIzLjE3MTg3NSAxNS43OTY4NzUgMjEuMzA0Njg4TDE1Ljc4MTI1IDIwLjQwNjI1TDE0Ljg3NSAyMC40MDYyNUMxNC43MzA0NjkgMjAuMzUxNTYzIDE0LjI4NTE1NiAxOS44Nzg5MDYgMTQuMDkzNzUgMTguNTE1NjI1QzE0LjAyNzM0NCAxNy42Nzk2ODggMTQuNDUzMTI1IDE3LjMzMjAzMSAxNC40NTMxMjUgMTcuMzMyMDMxTDE1LjA0Njg3NSAxNi45Mzc1TDE0Ljg3MTA5NCAxNi4yNTM5MDZDMTMuNzA3MDMxIDExLjY2Nzk2OSAxMy44NjcxODggOC40ODQzNzUgMTUuMzU5Mzc1IDYuNTIzNDM4QzE2LjU3ODEyNSA0LjkyMTg3NSAxOC44MjAzMTMgNC4wNzAzMTMgMjIgNCBaIE0gMzggMjZDMzEuMzkwNjI1IDI2IDI2IDMxLjM5NDUzMSAyNiAzOEMyNiA0NC42MDU0NjkgMzEuMzkwNjI1IDUwIDM4IDUwQzQ0LjYwOTM3NSA1MCA1MCA0NC42MDU0NjkgNTAgMzhDNTAgMzEuMzk0NTMxIDQ0LjYwOTM3NSAyNiAzOCAyNiBaIE0gMzggMjhDNDMuNTIzNDM4IDI4IDQ4IDMyLjQ3NjU2MyA0OCAzOEM0OCA0My41MjM0MzggNDMuNTIzNDM4IDQ4IDM4IDQ4QzMyLjQ3NjU2MyA0OCAyOCA0My41MjM0MzggMjggMzhDMjggMzIuNDc2NTYzIDMyLjQ3NjU2MyAyOCAzOCAyOCBaIE0gMTcuNzczNDM4IDMxLjE5NTMxM0wyMC4yNjk1MzEgMzIuNTgyMDMxTDE3Ljk4ODI4MSAzNS40MTc5NjlMMTYuMTIxMDk0IDMzLjE1MjM0NEMxNi44NDM3NSAzMi42MTcxODggMTcuNDE0MDYzIDMxLjk4NDM3NSAxNy43NzM0MzggMzEuMTk1MzEzIFogTSAzNyAzMkwzNyAzN0wzMiAzN0wzMiAzOUwzNyAzOUwzNyA0NEwzOSA0NEwzOSAzOUw0NCAzOUw0NCAzN0wzOSAzN0wzOSAzMiBaIE0gMTQuMzc1IDM0LjE3OTY4OEwxNy4yMzA0NjkgMzcuNjM2NzE5QzE3LjQxNzk2OSAzNy44NjcxODggMTcuNzA3MDMxIDM4LjAwMzkwNiAxOC4wMDc4MTMgMzhDMTguMzA4NTk0IDM4IDE4LjU4OTg0NCAzNy44NTkzNzUgMTguNzgxMjUgMzcuNjI1TDIwLjc0MjE4OCAzNS4xODc1TDIxLjUgMzUuODAwNzgxQzIxLjUgMzUuODAwNzgxIDE5Ljc0NjA5NCAzOC44MTI1IDE5LjI0MjE4OCA0Mkw0LjEyMTA5NCA0MkM0Ljg1NTQ2OSAzOC4wMjczNDQgOC4zOTg0MzggMzYuNjI1IDExLjgyODEyNSAzNS4yNjU2MjVDMTIuNzE0ODQ0IDM0LjkxNDA2MyAxMy41NzgxMjUgMzQuNTY2NDA2IDE0LjM3NSAzNC4xNzk2ODhaIi8+PC9zdmc+);
          }

          #tabbrowser-tabs[hasadjacentnewprivatetabbutton]:not([overflow="true"]) ~ #${UC.privateTab.BTN_ID},
          #tabbrowser-tabs[overflow="true"] > #tabbrowser-arrowscrollbox > #${UC.privateTab.BTN2_ID},
          #tabbrowser-tabs:not([hasadjacentnewprivatetabbutton]) > #tabbrowser-arrowscrollbox > #${UC.privateTab.BTN2_ID},
          #TabsToolbar[customizing="true"] #${UC.privateTab.BTN2_ID} {
            display: none;
          }

          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"] .tab-label {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"][pinned] .tab-icon-image,
          .tabbrowser-tab[usercontextid="${UC.privateTab.container.userContextId}"][pinned] .tab-throbber {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },

  setTstStyle: function (uuid) {
    this.TST_STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document  url-prefix(moz-extension://${uuid}/sidebar/sidebar.html) {
          .tab.contextual-identity-firefox-container-${UC.privateTab.container.userContextId} .label-content {
            text-decoration: underline !important;
            text-decoration-color: -moz-nativehyperlinktext !important;
            text-decoration-style: dashed !important;
          }
          .tab.contextual-identity-firefox-container-${UC.privateTab.container.userContextId} tab-favicon {
            border-bottom: 1px dashed -moz-nativehyperlinktext !important;
          }
        }
      `)),
      type: _uc.sss.USER_SHEET
    };
    _uc.sss.loadAndRegisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);
  },

  destroy: function () {
    if (this.config.deleteContainerOnDisable)
      ContextualIdentityService.remove(this.container.userContextId);
    else if (this.config.clearDataOnDisable)
      Services.clearData.deleteDataFromOriginAttributesPattern({ userContextId: this.container.userContextId });

    this.openTabs.forEach(tab => tab.ownerGlobal.gBrowser.removeTab(tab));

    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
    if (this.TST_STYLE)
      _uc.sss.unregisterSheet(this.TST_STYLE.url, this.TST_STYLE.type);

    _uc.windows((doc, win) => {
      if (!doc.getElementById('openAllPrivate'))
        return;
      doc.getElementById('openAllPrivate').remove();
      doc.getElementById('openAllLinksPrivate').remove();
      doc.getElementById('openPrivate').remove();
      doc.getElementById('placesContext').removeEventListener('popupshowing', this.placesContext);
      let {gBrowser} = win;
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
    PlacesUIUtils._openNodeIn = this.orig__openNodeIn;

    delete UC.privateTab;
  }
}

UC.privateTab.init();
