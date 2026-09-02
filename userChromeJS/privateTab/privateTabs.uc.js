// ==UserScript==
// @name           Private Tabs
// @version        1.5.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    An fx-autoconfig port of [Private Tab](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js) by xiaoxiaoflood. Adds buttons and menu items allowing you to open a "private tab" in nearly any circumstance in which you'd be able to open a normal tab. Instead of opening a link in a private window, you can open it in a private tab instead. This will use a special container and prevent history storage, depending on user configuration. You can also toggle tabs back and forth between private and normal mode. This script adds two hotkeys: Ctrl+Alt+P to open a new private tab, and Ctrl+Alt+T to toggle private mode for the active tab. These hotkeys can be configured along with several other options at the top of the script file.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/privateTabs.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/privateTabs.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @include        chrome://browser/content/places/bookmarksSidebar.xhtml
// @include        chrome://browser/content/places/historySidebar.xhtml
// @include        chrome://browser/content/places/places.xhtml
// @note           2026-07-31 1.4.2 Use the public SessionStore.sys.mjs API for Firefox 153 and Firefox 152+ window-global fallbacks
// @note           2026-07-31 1.4.3 Replace the CSP-blocked PlacesUIUtils eval patch with a scoped loadTabs wrapper
// @note           2026-07-31 1.4.4 Anchor the toolbar context menu to the clicked button instead of the event-listener object
// @note           2026-07-31 1.5.0 Add embedded Chinese and English UI text and locale-specific default container names
// @note           2026-09-02 1.5.1 Load ContextualIdentityService via moz-src on Firefox 154+ with a resource URI fallback for older versions
// ==/UserScript==

class PrivateTabManager {
  // user preferences. set these in about:config if you want them to persist
  // between script updates without having to reapply them.
  defaultPrefs = [
    // if you want to not record history but don't care about other data, maybe
    // even want to keep private logins
    ["neverClearData", false],
    ["restoreTabsOnRestart", true],
    ["doNotClearDataUntilFxIsClosed", true],
    ["deleteContainerOnDisable", false],
    ["clearDataOnDisable", false],
    // key to toggle private mode for the active tab. ctrl + alt + T by default.
    ["toggleHotkey", "T"],
    // key for opening a new private tab. ctrl + alt + P by default.
    ["newTabHotkey", "P"],
    // modifiers for toggle hotkey. alt+ctrl on windows; alt+cmd on mac
    ["toggleModifiers", "alt accel"],
    // modifiers for new tab hotkey.
    ["newTabModifiers", "alt accel"],
  ];
  setupPrefs() {
    let defaultBranch = Services.prefs.getDefaultBranch("");
    for (let [name, value] of this.defaultPrefs) {
      let prefName = `privateTabs.${name}`;
      XPCOMUtils.defineLazyPreferenceGetter(this.config, name, prefName, value);
      switch (typeof value) {
        case "boolean":
          defaultBranch.setBoolPref(prefName, value);
          break;
        case "number":
          defaultBranch.setIntPref(prefName, value);
          break;
        case "string":
          defaultBranch.setStringPref(prefName, value);
          break;
      }
    }
  }
  config = {};
  openTabs = new Set();
  BTN_ID = "privateTab-button";
  BTN2_ID = "newPrivateTab-button";
  messages = {
    "en-US": {
      containerName: "Private",
      newPrivateTab: "New Private Tab",
      newPrivateTabTooltip: "Open a new private tab ({shortcut})",
      openAllInPrivateTabs: "Open All in Private Tabs",
      openInNewPrivateTab: "Open in New Private Tab",
      openLinkInNewPrivateTab: "Open Link in New Private Tab",
      privateTab: "Private Tab",
      accessKey: "v",
    },
    "zh-CN": {
      containerName: "隐私",
      newPrivateTab: "新建隐私标签页",
      newPrivateTabTooltip: "打开新的隐私标签页（{shortcut}）",
      openAllInPrivateTabs: "全部在隐私标签页中打开",
      openInNewPrivateTab: "在新隐私标签页中打开",
      openLinkInNewPrivateTab: "在新隐私标签页中打开链接",
      privateTab: "隐私标签页",
      accessKey: "隐",
    },
  };
  locale = (Services.locale.appLocaleAsBCP47 || "en-US")
    .toLowerCase()
    .startsWith("zh")
    ? "zh-CN"
    : "en-US";
  l10n = this.messages[this.locale];

  formatMessage(key, replacements = {}) {
    return this.l10n[key].replace(/\{(\w+)\}/g, (placeholder, name) =>
      Object.hasOwn(replacements, name) ? replacements[name] : placeholder
    );
  }

  constructor() {
    this.setupPrefs();
    ChromeUtils.defineESModuleGetters(this, {
      SessionStore:
        "resource:///modules/sessionstore/SessionStore.sys.mjs",
      Management: "resource://gre/modules/Extension.sys.mjs",
    });
    ChromeUtils.defineLazyGetter(this, "ContextualIdentityService", () => {
      let lastError;
      for (let uri of [
        "moz-src:///toolkit/components/contextualidentity/ContextualIdentityService.sys.mjs",
        "resource://gre/modules/ContextualIdentityService.sys.mjs",
      ]) {
        try {
          return ChromeUtils.importESModule(uri).ContextualIdentityService;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    });
    this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let iconsSheet = UC_API.FileSystem.chromeDir().entry();
    iconsSheet.append("uc-context-menu-icons.css");
    this.menuClass = iconsSheet.exists()
      ? `menuitem-iconic privatetab-icon`
      : "";
    this.orig_getAttribute = MozElements.MozTab.prototype.getAttribute;
    this.init();
    if (location.href !== "chrome://browser/content/browser.xhtml") {
      return this.exec();
    }
    if (gBrowserInit.delayedStartupFinished) {
      this.exec();
    } else {
      let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
          Services.obs.removeObserver(delayedListener, topic);
          this.exec();
        }
      };
      Services.obs.addObserver(
        delayedListener,
        "browser-delayed-startup-finished"
      );
    }
  }

  async exec() {
    if (PrivateBrowsingUtils.isWindowPrivate(window)) return;
    let openAll = document.getElementById(
      "placesContext_openBookmarkContainer:tabs"
    );
    let openAllPrivate = UC_API.Utils.createElement(document, "menuitem", {
      id: "openAllPrivate",
      label: this.l10n.openAllInPrivateTabs,
      accesskey: this.l10n.accessKey,
      "selection-type": "single|none",
      "node-type": "folder|query_tag",
      class: this.menuClass,
    });
    openAll.after(openAllPrivate);
    openAllPrivate.addEventListener("command", e => {
      e.userContextId = this.container.userContextId;
      PlacesUIUtils.openSelectionInTabs(e);
    });

    let openAllLinks = document.getElementById("placesContext_openLinks:tabs");
    let openAllLinksPrivate = UC_API.Utils.createElement(document, "menuitem", {
      id: "openAllLinksPrivate",
      label: this.l10n.openAllInPrivateTabs,
      accesskey: this.l10n.accessKey,
      class: this.menuClass,
      "selection-type": "multiple",
      "node-type": "link",
      "hide-if-node-type": "link_bookmark",
    });
    openAllLinks.after(openAllLinksPrivate);
    openAllLinksPrivate.addEventListener("command", e => {
      e.userContextId = this.container.userContextId;
      PlacesUIUtils.openSelectionInTabs(e);
    });

    let openTab = document.getElementById("placesContext_open:newtab");
    let openPrivate = UC_API.Utils.createElement(document, "menuitem", {
      id: "openPrivate",
      label: this.l10n.openInNewPrivateTab,
      accesskey: this.l10n.accessKey,
      class: this.menuClass,
      "selection-type": "single",
      "node-type": "link",
    });
    openTab.after(openPrivate);
    openPrivate.addEventListener("command", e => {
      let view = e.target.parentElement._view;
      PlacesUIUtils._openNodeIn(
        view.selectedNode,
        "tab",
        view.ownerWindow,
        false,
        this.container.userContextId
      );
    });

    document
      .getElementById("placesContext")
      .addEventListener("popupshowing", this);

    if (location.href !== "chrome://browser/content/browser.xhtml") return;

    await UC_API.Hotkeys.define({
      modifiers: this.config.toggleModifiers,
      key: this.config.toggleHotkey,
      id: "togglePrivateTab-key",
      command: win => {
        if (win === window) {
          win.privateTab.togglePrivate();
        }
      },
    }).attachToWindow(window, { suppressOriginalKey: true });

    await UC_API.Hotkeys.define({
      modifiers: this.config.newTabModifiers,
      key: this.config.newTabHotkey,
      id: "newPrivateTab-key",
      command: win => {
        if (win === window) {
          win.privateTab.BrowserOpenTabPrivate();
        }
      },
    }).attachToWindow(window, { suppressOriginalKey: true });

    let toggleKey = document.getElementById("togglePrivateTab-key");
    let newPrivateTabKey = document.getElementById("newPrivateTab-key");

    let menuOpenLink = UC_API.Utils.createElement(document, "menuitem", {
      id: "menu_newPrivateTab",
      label: this.l10n.newPrivateTab,
      accesskey: this.l10n.accessKey,
      acceltext: ShortcutUtils.prettifyShortcut(newPrivateTabKey),
      class: this.menuClass,
    });
    document.getElementById("menu_newNavigatorTab").after(menuOpenLink);
    menuOpenLink.addEventListener("command", e =>
      this.getWindowForNode(e.target).privateTab.BrowserOpenTabPrivate()
    );

    let openLink = UC_API.Utils.createElement(document, "menuitem", {
      id: "openLinkInPrivateTab",
      label: this.l10n.openLinkInNewPrivateTab,
      accesskey: this.l10n.accessKey,
      class: this.menuClass,
      hidden: true,
    });
    openLink.addEventListener("command", e => {
      let win = this.getWindowForNode(e.target);
      win.openLinkIn(
        win.gContextMenu.linkURL,
        "tab",
        win.gContextMenu._openLinkInParameters({
          userContextId: win.privateTab.container.userContextId,
          triggeringPrincipal: e.target.ownerDocument.nodePrincipal,
        })
      );
    });

    document
      .getElementById("contentAreaContextMenu")
      .addEventListener("popupshowing", this);
    document
      .getElementById("contentAreaContextMenu")
      .addEventListener("popuphidden", this);
    document.getElementById("context-openlinkintab").after(openLink);

    let toggleTab = UC_API.Utils.createElement(document, "menuitem", {
      id: "toggleTabPrivateState",
      label: this.l10n.privateTab,
      type: "checkbox",
      accesskey: this.l10n.accessKey,
      acceltext: ShortcutUtils.prettifyShortcut(toggleKey),
    });
    document.getElementById("context_pinTab").after(toggleTab);
    toggleTab.addEventListener("command", e => {
      let win = this.getWindowForNode(e.target);
      win.privateTab.togglePrivate(win.TabContextMenu.contextTab);
    });

    document
      .getElementById("tabContextMenu")
      .addEventListener("popupshowing", this);

    let privateMask = document.querySelector(
      ".private-browsing-indicator-with-label"
    );
    privateMask.classList.add("private-mask");

    let btn2 = UC_API.Utils.createElement(document, "toolbarbutton", {
      id: this.BTN2_ID,
      label: this.l10n.newPrivateTab,
      tooltiptext: this.formatMessage("newPrivateTabTooltip", {
        shortcut: ShortcutUtils.prettifyShortcut(newPrivateTabKey),
      }),
      class: "toolbarbutton-1 chromeclass-toolbar-additional",
    });

    btn2.addEventListener("click", this);

    document.getElementById("tabs-newtab-button").after(btn2);

    gBrowser.tabContainer.addEventListener("TabSelect", this);

    addEventListener("XULFrameLoaderCreated", this);

    if (this.observePrivateTabs) {
      gBrowser.tabContainer.addEventListener("TabClose", this);
    }

    MozElements.MozTab.prototype.getAttribute = function (att) {
      if (att == "usercontextid" && this.isToggling) {
        delete this.isToggling;
        return window.privateTab.orig_getAttribute.call(this, att) ==
          window.privateTab.container.userContextId
          ? 0
          : window.privateTab.container.userContextId;
      }
      return window.privateTab.orig_getAttribute.call(this, att);
    };

    customElements.get("tabbrowser-tabs").prototype._updateNewTabVisibility =
      function () {
        let wrap = n =>
          n.parentNode.localName == "toolbarpaletteitem" ? n.parentNode : n;
        let unwrap = n =>
          n && n.localName == "toolbarpaletteitem" ? n.firstElementChild : n;

        let newTabFirst = false;
        let sibling = (id, otherId) => {
          let sib = this;
          do {
            if (sib.id == "new-tab-button") newTabFirst = true;
            sib = unwrap(wrap(sib).nextElementSibling);
          } while (
            sib &&
            (sib.hidden || sib.id == "alltabs-button" || sib.id == otherId)
          );
          return sib?.id == id && sib;
        };

        const kAttr = "hasadjacentnewtabbutton";
        let adjacentNewTab = sibling(
          "new-tab-button",
          window.privateTab.BTN_ID
        );
        if (adjacentNewTab) {
          this.setAttribute(kAttr, "true");
        } else {
          this.removeAttribute(kAttr);
        }

        const kAttr2 = "hasadjacentnewprivatetabbutton";
        let adjacentPrivateTab = sibling(
          window.privateTab.BTN_ID,
          "new-tab-button"
        );
        if (adjacentPrivateTab) {
          this.setAttribute(kAttr2, "true");
        } else {
          this.removeAttribute(kAttr2);
        }

        if (adjacentNewTab && adjacentPrivateTab) {
          let doc = adjacentPrivateTab.ownerDocument;
          if (newTabFirst) {
            doc
              .getElementById("tabs-newtab-button")
              .after(doc.getElementById(window.privateTab.BTN2_ID));
          } else {
            doc
              .getElementById(window.privateTab.BTN2_ID)
              .after(doc.getElementById("tabs-newtab-button"));
          }
        }
      };
    gBrowser.tabContainer._updateNewTabVisibility();
    if (!Services.ppmm.sharedData.get("uc_privateTabs")) {
      CustomizableUI.createWidget({
        id: this.BTN_ID,
        type: "custom",
        defaultArea: CustomizableUI.AREA_NAVBAR,
        showInPrivateBrowsing: false,
        onBuild: doc => {
          let btn = UC_API.Utils.createElement(doc, "toolbarbutton", {
            id: this.BTN_ID,
            label: this.l10n.newPrivateTab,
            tooltiptext: this.formatMessage("newPrivateTabTooltip", {
              shortcut: ShortcutUtils.prettifyShortcut(newPrivateTabKey),
            }),
            class: "toolbarbutton-1 chromeclass-toolbar-additional",
          });
          btn.addEventListener("command", e =>
            this.getWindowForNode(e.target).privateTab.BrowserOpenTabPrivate()
          );

          return btn;
        },
      });
      Services.ppmm.sharedData.set("uc_privateTabs", true);
    }
  }

  init() {
    this.ContextualIdentityService.ensureDataReady();
    this.container = this.ContextualIdentityService._identities.find(
      container => container.name == this.l10n.containerName
    );
    if (!this.container) {
      this.ContextualIdentityService.create(
        this.l10n.containerName,
        "fingerprint",
        "purple"
      );
      this.container = this.ContextualIdentityService._identities.find(
        container => container.name == this.l10n.containerName
      );
    } else if (!this.config.neverClearData) {
      this.clearData();
    }

    let style = {
      url: Services.io.newURI(
        `data:text/css;charset=UTF-8,${encodeURIComponent(
          `.privatetab-icon, #${this.BTN_ID}, #${this.BTN2_ID} { list-style-image: url(chrome://browser/skin/privateBrowsing.svg) !important; fill: currentColor; -moz-context-properties: fill; } @-moz-document url('chrome://browser/content/browser.xhtml') { .private-mask[enabled="true"] { display: flex !important; } .private-mask:not([enabled="true"]) { display: none !important; } #tabbrowser-tabs[hasadjacentnewprivatetabbutton]:not([overflow]) ~ #${this.BTN_ID}, #tabbrowser-tabs[overflow] > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${this.BTN2_ID}, #tabbrowser-tabs:not([hasadjacentnewprivatetabbutton]) > #tabbrowser-arrowscrollbox > #tabbrowser-arrowscrollbox-periphery > #${this.BTN2_ID}, #TabsToolbar[customizing="true"] #${this.BTN2_ID} { display: none; } .tabbrowser-tab[usercontextid="${this.container.userContextId}"] .tab-label { text-decoration: underline !important; text-decoration-color: -moz-nativehyperlinktext !important; text-decoration-style: dashed !important; } .tabbrowser-tab[usercontextid="${this.container.userContextId}"][pinned] .tab-icon-image, .tabbrowser-tab[usercontextid="${this.container.userContextId}"][pinned] .tab-throbber { border-bottom: 1px dashed -moz-nativehyperlinktext !important; }}`
        )}`
      ),
      type: this.sss.USER_SHEET,
    };
    if (!this.sss.sheetRegistered(style.url, style.type)) {
      this.sss.loadAndRegisterSheet(style.url, style.type);
    }

    CustomizableUI.addListener(this);

    if (!Services.ppmm.sharedData.get("uc_privateTabs")) {
      const lazy = {};
      ChromeUtils.defineESModuleGetters(lazy, {
        BrowserWindowTracker:
          "resource:///modules/BrowserWindowTracker.sys.mjs",
      });
      function getBrowserWindow(aWindow) {
        // Prefer the caller window if it's a browser window, otherwise use
        // the top browser window.
        return aWindow &&
          aWindow.document.documentElement.getAttribute("windowtype") ==
            "navigator:browser"
          ? aWindow
          : lazy.BrowserWindowTracker.getTopWindow();
      }
      const originalOpenTabset = PlacesUIUtils.openTabset;
      PlacesUIUtils.openTabset = function (items, event, sourceWindow) {
        const userContextId = event?.userContextId;
        const browserWindow = getBrowserWindow(sourceWindow);
        const tabBrowser = browserWindow?.gBrowser;
        if (!userContextId || !tabBrowser) {
          return originalOpenTabset.call(this, items, event, sourceWindow);
        }

        const originalLoadTabs = tabBrowser.loadTabs;
        const loadTabsDescriptor = Object.getOwnPropertyDescriptor(
          tabBrowser,
          "loadTabs"
        );
        Object.defineProperty(tabBrowser, "loadTabs", {
          configurable: true,
          writable: true,
          value(urls, options = {}) {
            return originalLoadTabs.call(this, urls, {
              ...options,
              userContextId,
            });
          },
        });

        try {
          return originalOpenTabset.call(this, items, event, sourceWindow);
        } finally {
          if (loadTabsDescriptor) {
            Object.defineProperty(tabBrowser, "loadTabs", loadTabsDescriptor);
          } else {
            delete tabBrowser.loadTabs;
          }
        }
      };
    }

    const { WebExtensionPolicy } = Cu.getGlobalForObject(Services);
    let TST_ID = "treestyletab@piro.sakura.ne.jp";
    this.setTstStyle(WebExtensionPolicy.getByID(TST_ID)?.getURL());
    if (location.href === "chrome://browser/content/browser.xhtml") {
      this.Management.on("ready", (_ev, extension) => {
        if (extension.id === TST_ID) this.setTstStyle(extension.getURL());
      });
      this.Management.on("uninstall", (_ev, extension) => {
        if (extension.id === TST_ID && this.TST_STYLE) {
          this.sss.unregisterSheet(this.TST_STYLE.uri, this.TST_STYLE.type);
        }
      });
    }

    if (!this.config.neverClearData) {
      Services.obs.addObserver(this, "quit-application-granted");
    }
  }

  observe(sub, top, data) {
    this.clearData();
    if (!this.config.restoreTabsOnRestart) this.closeTabs();
  }

  clearData() {
    Services.clearData.deleteDataFromOriginAttributesPattern({
      userContextId: this.container.userContextId,
    });
  }

  closeTabs() {
    this.ContextualIdentityService._forEachContainerTab((tab, tabbrowser) => {
      if (tab.userContextId == this.container.userContextId) {
        tabbrowser.removeTab(tab);
      }
    });
  }

  duplicateTab(tab, { index, inBackground }) {
    // SessionStore owns the custom-value map and current restore pipeline.
    return this.SessionStore.duplicateTab(
      this.getWindowForNode(tab),
      tab,
      0,
      true,
      { inBackground, tabIndex: index }
    );
  }

  getWindowForNode(node) {
    return (
      node?.documentGlobal ||
      node?.relevantGlobal ||
      node?.ownerDocument?.defaultView ||
      window
    );
  }

  togglePrivate(tab = gBrowser.selectedTab) {
    tab.isToggling = true;
    let shouldSelect = tab == gBrowser.selectedTab;
    this.duplicateTab(tab, {
      index: shouldSelect ? tab._tPos + 1 : tab._tPos,
      inBackground: !shouldSelect,
    });
    if (shouldSelect && gURLBar.focused) gURLBar.focus();
    gBrowser.removeTab(tab, { animate: false, closeWindowWithLastTab: false });
  }

  toggleMask() {
    let privateMask = document.querySelector(
      ".private-browsing-indicator-with-label"
    );
    if (gBrowser.selectedTab.isToggling) {
      privateMask.setAttribute(
        "enabled",
        gBrowser.selectedTab.userContextId == this.container.userContextId
          ? "false"
          : "true"
      );
    } else {
      privateMask.setAttribute(
        "enabled",
        gBrowser.selectedTab.userContextId == this.container.userContextId
          ? "true"
          : "false"
      );
    }
  }

  BrowserOpenTabPrivate() {
    openTrustedLinkIn(BROWSER_NEW_TAB_URL, "tab", {
      userContextId: this.container.userContextId,
    });
  }

  isPrivate(tab) {
    return tab.getAttribute("usercontextid") == this.container.userContextId;
  }

  contentContext(_e) {
    let tab = gBrowser.getTabForBrowser(gContextMenu.browser);
    gContextMenu.showItem(
      "openLinkInPrivateTab",
      gContextMenu.onSaveableLink || gContextMenu.onPlainTextLink
    );
    if (this.isPrivate(tab)) {
      gContextMenu.showItem("context-openlinkincontainertab", false);
    }
  }

  hideContext(_e) {
    document.getElementById("openLinkInPrivateTab").hidden = true;
  }

  tabContext(_e) {
    document
      .getElementById("toggleTabPrivateState")
      .setAttribute(
        "checked",
        TabContextMenu.contextTab.userContextId == this.container.userContextId
      );
  }

  placesContext(_e) {
    document.getElementById("openPrivate").disabled = document.getElementById(
      "placesContext_open:newtab"
    ).disabled;
    document.getElementById("openPrivate").hidden = document.getElementById(
      "placesContext_open:newtab"
    ).hidden;
    document.getElementById("openAllPrivate").disabled =
      document.getElementById(
        "placesContext_openBookmarkContainer:tabs"
      ).disabled;
    document.getElementById("openAllPrivate").hidden = document.getElementById(
      "placesContext_openBookmarkContainer:tabs"
    ).hidden;
    document.getElementById("openAllLinksPrivate").disabled =
      document.getElementById("placesContext_openLinks:tabs").disabled;
    document.getElementById("openAllLinksPrivate").hidden =
      document.getElementById("placesContext_openLinks:tabs").hidden;
  }

  handleEvent(e) {
    switch (e.type) {
      case "TabSelect":
        this.onTabSelect(e);
        break;
      case "TabClose":
        this.onTabClose(e);
        break;
      case "XULFrameLoaderCreated":
        this.privateListener(e);
        break;
      case "popupshowing":
        if (e.target === document.getElementById("placesContext")) {
          this.placesContext(e);
        }
        if (e.target === document.getElementById("contentAreaContextMenu")) {
          this.contentContext(e);
        }
        if (e.target === document.getElementById("tabContextMenu")) {
          this.tabContext(e);
        }
        break;
      case "popuphidden":
        if (e.target === document.getElementById("contentAreaContextMenu")) {
          this.hideContext(e);
        }
        break;
      case "click":
        if (e.button == 0) {
          this.BrowserOpenTabPrivate();
        } else if (e.button == 2) {
          document.popupNode = document.getElementById(this.BTN_ID);
          document
            .getElementById("toolbar-context-menu")
            .openPopup(e.currentTarget, "after_start", 14, -10, false, false);
          document.getElementsByClassName(
            "customize-context-removeFromToolbar"
          )[0].disabled = false;
          document.getElementsByClassName(
            "customize-context-moveToPanel"
          )[0].disabled = false;
          e.preventDefault();
        }
        break;
    }
  }

  privateListener(e) {
    let browser = e.target;
    let tab = gBrowser.getTabForBrowser(browser);
    if (!tab) return;
    let isPrivate = this.isPrivate(tab);

    if (!isPrivate) {
      if (this.observePrivateTabs) {
        this.openTabs.delete(tab);
        if (!this.openTabs.size) this.clearData();
      }
      return;
    }

    if (this.observePrivateTabs) this.openTabs.add(tab);

    browser.browsingContext.useGlobalHistory = false;
  }

  onTabSelect(e) {
    if (e.target.userContextId !== e.detail.previousTab.userContextId) {
      this.toggleMask();
    }
  }

  onTabClose(e) {
    if (this.isPrivate(e.target)) {
      this.openTabs.delete(e.target);
      if (!this.openTabs.size) this.clearData();
    }
  }

  onWidgetAfterCreation(id) {
    if (id == this.BTN_ID) {
      let newTabPlacement =
        CustomizableUI.getPlacementOfWidget("new-tab-button")?.position;
      if (newTabPlacement) {
        CustomizableUI.addWidgetToArea(
          this.BTN_ID,
          CustomizableUI.AREA_TABSTRIP,
          newTabPlacement + 1
        );
      }
      gBrowser.tabContainer._updateNewTabVisibility();
      CustomizableUI.removeListener(this);
    }
  }

  get observePrivateTabs() {
    return (
      this._observePrivateTabs ||
      (this._observePrivateTabs =
        !this.config.neverClearData &&
        !this.config.doNotClearDataUntilFxIsClosed)
    );
  }

  setTstStyle(baseURL) {
    if (!baseURL) return;
    this.TST_STYLE = {
      uri: Services.io.newURI(
        `data:text/css;charset=UTF-8,${encodeURIComponent(
          `@-moz-document url-prefix(${baseURL}sidebar/sidebar.html) { .tab.contextual-identity-firefox-container-${this.container.userContextId} .label-content { text-decoration: underline !important; text-decoration-color: -moz-nativehyperlinktext !important; text-decoration-style: dashed !important; } .tab.contextual-identity-firefox-container-${this.container.userContextId} tab-favicon { border-bottom: 1px dashed -moz-nativehyperlinktext !important;}}`
        )}`
      ),
      type: this.sss.USER_SHEET,
    };
    if (!this.sss.sheetRegistered(this.TST_STYLE.uri, this.TST_STYLE.type)) {
      this.sss.loadAndRegisterSheet(this.TST_STYLE.uri, this.TST_STYLE.type);
    }
  }
}

window.privateTab = new PrivateTabManager();
