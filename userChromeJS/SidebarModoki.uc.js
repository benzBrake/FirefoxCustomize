// ==UserScript==
// @name           SidebarModoki
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    TST
// @include        main
// @compatibility  Firefox 113
// @author         Alice0775
// @note           Tree Style Tab がある場合にブックマークと履歴等を別途"サイドバーもどき"で表示
// @note           SidebarModoki.uc.js.css をuserChrome.cssに読み込ませる必要あり
// @version        2023/03/09 Bug 1820534 - Move front-end to modern flexbox.
// @version        2022/10/12 Bug 1794630
// @version        2022/09/29 fix Bug 1689816 
// @version        2022/09/28 ordinal position
// @version        2022/09/14 fix Bug 1790299
// @version        2022/09/14 use toolbarspring instead of spacer
// @version        2022/08/26 Bug 1695435 - Remove @@hasInstance for IDL interfaces in chrome context
// @version        2022/04/01 23:00 Convert Components.utils.import to ChromeUtils.import
// @version        2022/03/26 23:00 Bug 1760342 - Remove :-moz-lwtheme-{brighttext,darktext}
// @version        2021/11/21 18:00 Bug 1742111 - Rename internal accentcolor and textcolor properties to be more consistent with the webext theme API
// @version        2021/11/14 13:00 wip change css(Bug 1740230 - moz-lwtheme* pseudo-classes don't get invalidated correctly)
// @version        2021/09/30 22:00 change splitter color
// @version        2021/05/18 20:00 fix margin of tabpanels
// @version        2021/02/09 20:00 Rewrite `X.setAttribute("hidden", Y)` to `X.hidden = Y`
// @version       2020/06/18 fix SidebarModoki position(Bug 1603830 - Remove support for XULElement.ordinal)
// @version       2019/12/11 fix for 73 Bug 1601094 - Rename remaining .xul files to .xhtml in browser
// @version        2019/11/14 03:00 workarround Ctrl+tab/Ctrl+pageUP/Down
// @version        2019/10/20 22:00 fix surplus loading
// @version        2019/10/20 12:30 workaround Bug 1497200: Apply Meta CSP to about:downloads, Bug 1513325 - Remove textbox binding
// @version        2019/09/05 13:00 fix listitem
// @version        2019/08/07 15:00 fix adding key(renamde from key to keyvalue in jsonToDOM)
// @version        2019/07/13 13:00 fix wrong commit
// @version        2019/07/10 10:00 fix 70 Bug 1558914 - Disable Array generics in Nightly
// @version        2019/05/29 16:00 Bug 1519514 - Convert tab bindings
// @version        2018/12/23 14:00 Adjust margin
// @version        2018/12/23 00:00 Add option of SidebarModoki posiotion SM_RIGHT
// @version        2018/05/10 00:00 for 61 wip Bug 1448810 - Rename the Places sidebar files
// @version        2018/05/08 21:00 use jsonToDOM(https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Overlay_Extensions/XUL_School/DOM_Building_and_HTML_Insertion)
// @version        2018/05/08 19:00 get rid loadoverlay
// @version        2017/11/24 19:50 do nothing if window is popup(window.open)
// @version        2017/11/24 19:20 change close button icon style to 57
// @version        2017/11/24 19:10 add key(accel(ctrl)+alt+s) and close button
// @version        2017/11/24 19:00 hack for DL manager
// @version        2017/11/24 15:00 remove unused variable
// @version        2017/11/23 13:10 restore initial tab index/width and more unique id
// @version        2017/11/23 12:30 try catch.  download manager
// @version        2017/11/23 00:30 Make button icon
// @version        2017/11/23 00:00 Make button customizable
// @version        2017/11/22 23:00 fullscreen
// @version        2017/11/22 23:00 DOM fullscreen
// @version        2017/11/22 22:00 F11 fullscreen
// @version        2017/11/15 09:00
// ==/UserScript==


var SidebarModoki = {
  // -- config --
  get SM_RIGHT() {
    return this.getPref("sidebar.position_start", "bool", false);
  },
  SM_WIDTH: 230,
  SM_AUTOHIDE: false,  //F11 Fullscreen
  TABS: [{
    src: "chrome://browser/content/places/bookmarksSidebar.xhtml",
    "data-l10n-id": "library-bookmarks-menu",
    image: "chrome://browser/skin/bookmark-star-on-tray.svg",
    // shortcut: { key: "Q", modifiers: "accel,alt" } // uncomment to enable shortcut
  }, {
    src: "chrome://browser/content/places/historySidebar.xhtml",
    "data-l10n-id": "appmenuitem-history",
    image: "chrome://browser/skin/history.svg",
  }, {
    src: "chrome://browser/content/downloads/contentAreaDownloadsView.xhtml?SM",
    "data-l10n-id": "appmenuitem-downloads",
    image: "chrome://browser/skin/downloads/downloads.svg",
  }, {
    src: "https://music.youtube.com",
    label: "YouTube Music"
  }, {
    src: "https://translate.google.com",
    label: "谷歌翻译"
  }, {
    src: "https://papago.naver.com/",
    label: "papago"
  }, {
    src: "https://1password.com/zh-cn/password-generator/",
    label: "密码生成"
  }, {
    src: 'https://snapdrop.net',
    label: '文件传输'
  }],
  // -- config --

  kSM_Open: "userChrome.SidebarModoki.Open",
  kSM_Visible: "userChrome.SidebarModoki.Visible",
  kSM_lastSelectedTabIndex: "userChrome.SidebarModoki.lastSelectedTabIndex",
  kSM_lastSelectedTabWidth: "userChrome.SidebarModoki.lastSelectedTabWidth",
  ToolBox: null,
  Button: null,

  _selectedTab: null,
  _lastSelectedIndex: null,

  get prefs() {
    delete this.prefs;
    return this.prefs = Services.prefs;
  },

  jsonToDOM: function (jsonTemplate, doc, nodes) {
    jsonToDOM.namespaces = {
      html: "http://www.w3.org/1999/xhtml",
      xul: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
    };
    jsonToDOM.defaultNamespace = jsonToDOM.namespaces.xul;
    function jsonToDOM(jsonTemplate, doc, nodes) {
      function namespace(name) {
        var reElemNameParts = /^(?:(.*):)?(.*)$/.exec(name);
        return { namespace: jsonToDOM.namespaces[reElemNameParts[1]], shortName: reElemNameParts[2] };
      }

      // Note that 'elemNameOrArray' is: either the full element name (eg. [html:]div) or an array of elements in JSON notation
      function tag(elemNameOrArray, elemAttr) {
        // Array of elements?  Parse each one...
        if (Array.isArray(elemNameOrArray)) {
          var frag = doc.createDocumentFragment();
          Array.prototype.forEach.call(arguments, function (thisElem) {
            frag.appendChild(tag.apply(null, thisElem));
          });
          return frag;
        }

        // Single element? Parse element namespace prefix (if none exists, default to defaultNamespace), and create element
        var elemNs = namespace(elemNameOrArray);
        var elem = doc.createElementNS(elemNs.namespace || jsonToDOM.defaultNamespace, elemNs.shortName);

        // Set element's attributes and/or callback functions (eg. onclick)
        for (var key in elemAttr) {
          var val = elemAttr[key];
          if (nodes && key == "keyvalue") {  //for later convenient JavaScript access) by giving them a 'keyvalue' attribute; |nodes|.|keyvalue|
            nodes[val] = elem;
            continue;
          }

          var attrNs = namespace(key);
          if (typeof val == "function") {
            // Special case for function attributes; don't just add them as 'on...' attributes, but as events, using addEventListener
            elem.addEventListener(key.replace(/^on/, ""), val, false);
          } else {
            // Note that the default namespace for XML attributes is, and should be, blank (ie. they're not in any namespace)
            elem.setAttributeNS(attrNs.namespace || "", attrNs.shortName, val);
          }
        }

        // Create and append this element's children
        var childElems = Array.prototype.slice.call(arguments, 2);
        childElems.forEach(function (childElem) {
          if (childElem != null) {
            elem.appendChild(
              doc.defaultView.Node.isInstance(childElem)
                /*childElem instanceof doc.defaultView.Node*/ ? childElem :
                Array.isArray(childElem) ? tag.apply(null, childElem) :
                  doc.createTextNode(childElem));
          }
        });
        return elem;
      }
      return tag.apply(null, jsonTemplate);
    }

    return jsonToDOM(jsonTemplate, doc, nodes);
  },

  init: async function () {
    let chromehidden = document.getElementById("main-window").hasAttribute("chromehidden");
    if (chromehidden &&
      document.getElementById("main-window").getAttribute("chromehidden").includes("extrachrome")) {
      return; // do nothing
    }

    let MARGINHACK = this.SM_RIGHT ? "0 0 0 0" : "0 -2px 0 0";
    let style = `
      @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
      
      #SM_toolbox
      {
        background-color: var(--toolbar-bgcolor);
        color: -moz-dialogtext;
        text-shadow: none;
        position: relative;
      }
      #SM_toolbox[open="true"] {
        min-width: 14em;
        max-width: 42em;
      }
      #SM_toolbox[open="false"] {
        width: calc(2 * 2px + 16px + 2 * var(--toolbarbutton-inner-padding));
        overflow: hidden;
      }
      #SM_toolbox[open="false"] + #SM_splitter {
        display: none;
      }
      #SM_toolbox:-moz-lwtheme {
        /*background-color: var(--lwt-accent-color);*/
        background-color: var(--toolbar-bgcolor);
        color: var(--lwt-text-color);
      }
      #SM_toolbox[position="left"] {
        order: -1 !important;
        border-right: 1px solid var(--chrome-content-separator-color) !important;
      }
      #SM_toolbox[position="right"] {
        order: 10 !important;
        border-left: 1px solid var(--chrome-content-separator-color) !important;
      }
      #SM_toolbox[open="true"][position="left"] + #SM_splitter {
        border-right: 1px solid var(--chrome-content-separator-color) !important;
      }
      #SM_toolbox[open="true"][position="right"] + #SM_splitter {
        border-left: 1px solid var(--chrome-content-separator-color) !important;
      }
      .SM_toolbarspring {
          max-width: unset !important;
      }
      #SM_toolbox[collapsed] {
        visibility:visible;
      }
      #SM_toolbox[aria-hidden="true"],
      #SM_toolbox[moz-collapsed="true"]{
        display: none !important;
      }
      /*visibility*/
      #SM_splitter[collapsed],
      /*フルスクリーン*/
      
      #SM_splitter[moz-collapsed="true"]
      {
        visibility:collapse;
      }
      #SM_splitter {
        min-width: 1px !important;
        background-color: var(--toolbar-bgcolor) !important;
        border-inline-start-color: var(--toolbar-bgcolor) !important;
        border-inline-end-color: var(--toolbar-bgcolor) !important;
      }
      #SM_splitter[position="left"] {
        order: 0 !important;
      }
      #SM_splitter[position="right"] {
        order: 9 !important;
      }

      #SM_toolbox,
      #SM_splitter {
        /* Make room for the bookmarks toolbar so that it won't actually overlap the
           new tab page and sidebar contents. */
        padding-top: var(--bookmarks-toolbar-height);
      }

      /*ポップアップの時*/
      #main-window[chromehidden~="extrachrome"] #SM_toolbox,
      #main-window[chromehidden~="extrachrome"] #SM_splitter
      {
        visibility: collapse;
      }

      #SM_tabpanels
      { 
        appearance: none !important;
        padding: 0 !important;
        appearance: unset;
        color-scheme: unset !important;
        flex: 1 1 100%;
        margin-top: 34px;
      }

      #SM_toolbox:not([open="true"]) #SM_tabpanels {
        display: none;
      }

      #SM_header {
        background-color: var(var(--toolbar-bgcolor));
        padding: 6px !important;
        border-bottom: 0px solid transparent !important;
        color: inherit !important;
        font-size: 1.2em !important;
        color: var(--toolbar-color);
        position: absolute;
        z-index: 1;
        left: 0;
        right: calc(2 * 2px + 16px + 2 * var(--toolbarbutton-inner-padding) - 1px);
        z-index: 1;
        overflow: hidden;
      }

      #SM_toolbox:not([open="true"]) > #SM_header {
        display: none;
      }

      #SM_toolbox[position="left"] > #SM_header {
        right: -2px;
        left: calc(2 * 2px + 16px + 2 * var(--toolbarbutton-inner-padding));
      }

      #SM_controls {
        position: absolute;
        right: 0;
        height: 100%;
        background-color: var(--toolbar-bgcolor);
        padding-block: 4px;
        gap: 2px;
      }

      #SM_controls > toolbarbutton {
        appearance: none !important;
        -moz-context-properties: fill, fill-opacity;
        border-radius: 4px;
        color: inherit;
        fill: currentColor;
        padding: 2px !important;
        width: 20px;
        height: auto;
      }

      #SM_openInTabButton {
        list-style-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNNCAxYTMgMyAwIDAgMC0zIDN2OGEzIDMgMCAwIDAgMyAzaDQuNWEuNS41IDAgMCAwIDAtMUg0YTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yaDhhMiAyIDAgMCAxIDIgMnYyLjVhLjUuNSAwIDAgMCAxIDBWNGEzIDMgMCAwIDAtMy0zSDR6bTIuNTA4IDVBLjUuNSAwIDAgMCA2IDYuNDk0VjExLjVhLjUuNSAwIDEgMCAxIDBWNy43MDdsNi4xNDYgNi4xNDZhLjUuNSAwIDAgMCAuNzA3LS43MDdMNy43MDcgN0gxMS41YS41LjUgMCAwIDAgMC0xSDYuNTA4eiIvPgo8L3N2Zz4K");
        > image {
          transform: rotateY(180deg)
        }
      }

      toolbar[brighttext]:-moz-lwtheme #SM_tabbox {
        background-color: var(--toolbar-bgcolor);
      }

      #SM_tabbox {
        display: flex;
        flex-direction: row;
      }

      #SM_toolbox[position="right"] #SM_tabbox{
        flex-direction: row-reverse;
      }

      #SM_tabs {
        overflow-x: hidden;
        display: flex;
        flex-direction: column !important;
        width: calc(2 * 2px + 16px + 2 * var(--toolbarbutton-inner-padding));
        height: auto;
        justify-content: flex-start;
        align-items: center;
        flex-shrink: 0;
        padding: 0 2px;
      }
      #SM_toolbox[open="true"][position="left"] #SM_tabs {
        border-right: 1px solid var(--chrome-content-separator-color);
      }
      #SM_toolbox[open="true"][position="right"] #SM_tabs {
        border-left: 1px solid var(--chrome-content-separator-color);
      }
      #SM_tabs tab {
        appearance: none !important;
        padding: 0 !important;
        margin: 0 !important;
        margin-top: 4px;
        color: unset !important;
      }
      #SM_tabs tab:not([selected]) {
        opacity: 0.6 !important;
      }
      #SM_tabs tab:not([selected]):hover > hbox {
        background-color: var(--toolbarbutton-hover-background);
      }
      #SM_tabs tab[selected] > hbox {
        background-color: var(--toolbarbutton-active-background);
      }
      #SM_tabs tab > hbox {
        padding: var(--toolbarbutton-inner-padding) !important;
        border-radius: var(--toolbarbutton-border-radius) !important;
        height: calc(16px + 2* var(--toolbarbutton-inner-padding));
        width: calc(16px + 2* var(--toolbarbutton-inner-padding));
        outline: none !important;
      }
      #SM_tabs tab > hbox > .tab-icon {
        width: 16px;
        height: 16px;
        -moz-context-properties: fill, fill-opacity, stroke, stroke-opacity !important;
        fill: var(--lwt-toolbarbutton-icon-fill, currentColor) !important;
      }
      #SM_tabs tab[iconized="true"] .tab-text {
        visibility: collapse;
      }
     `;
    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(style.replace(/\s+/g, " ").replace(/\{SM_WIDTH\}/g, this.SM_WIDTH).replace(/\{MARGINHACK\}/g, MARGINHACK)));
    if (!sss.sheetRegistered(uri, sss.AGENT_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
    /*
        style = style.replace(/\s+/g, " ").replace(/\{SM_WIDTH\}/g, this.SM_WIDTH).replace(/\{MARGINHACK\}/g, MARGINHACK);
        let sspi = document.createProcessingInstruction(
          'xml-stylesheet',
          'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
        );
        document.insertBefore(sspi, document.documentElement);
        sspi.getAttribute = function(name) {
          return document.documentElement.getAttribute(name);
        };
    */
    // ChromeUtils.import("resource:///modules/CustomizableUI.jsm");
    // xxxx try-catch may need for 2nd window

    // to do, replace with MozXULElement.parseXULToFragment();
    // let template = ["command", { id: "cmd_SidebarModoki", oncommand: "SidebarModoki.toggle()" }];
    // document.getElementById("mainCommandSet").appendChild(this.jsonToDOM(template, document, {}));

    template = ["key", { id: "key_SidebarModoki", key: "B", modifiers: "accel,alt", command: "cmd_SidebarModoki", }];
    document.getElementById("mainKeyset").appendChild(this.jsonToDOM(template, document, {}));
    //to do xxx ordinal=xx shoud be replaced with style="-moz-box-ordinal-group: xx;"
    template =
      ["vbox", { id: "SM_toolbox", class: "browser-toolbar", position: this.SM_RIGHT ? "right" : "left" },
        ["hbox", { id: "SM_header", align: "center" },
          ["label", {}, "SidebarModoki"],
          ["toolbaritem", { id: "SM_controls", class: "chromeclass-toolbar-additional toolbaritem-combined-buttons" },
            ["toolbarbutton", { id: "SM_openInTabButton", class: "sm-icon tabbable", tooltiptext: "Open In New Tab", oncommand: "SidebarModoki.openInTab();" }],
            ["toolbarbutton", { id: "SM_closeButton", class: "close-icon tabbable", tooltiptext: "Close SidebarModoki", oncommand: "SidebarModoki.close();" }]
          ],
        ],
        ["tabbox", { id: "SM_tabbox", flex: "1", handleCtrlPageUpDown: false, handleCtrlTab: false },
          ["tabs", { id: "SM_tabs" },
          ],
          ["tabpanels", { id: "SM_tabpanels", flex: "1", style: "border: none;" },
          ]
        ]
      ];
    for (let i = 0; i < this.TABS.length; i++) {
      let tab = Object.assign(this.TABS[i], { id: "SM_tab" + i });
      if (tab.hasOwnProperty("addon-id")) {
        let policy = WebExtensionPolicy.getByID(tab["addon-id"]);
        if (policy && policy.active) {
          tab.src = "moz-extension://" + policy.mozExtensionHostname + "/" + tab.src.replace(/^\//g, "");
          this.TABS[i].src = tab.src;
        } else {
          tab.hidden = true;
        }
        if (!tab.hasOwnProperty("image")) {
          let addon = await AddonManager.getAddonByID(tab["addon-id"]);
          if (addon) {
            tab.image = addon.iconURL || addon.iconURL64 || this.iconURL || '';
            if (tab.image == "") delete tab.image;
          }
        }
      }
      if (tab.src.startsWith("http") && !("image" in tab)) {
        tab.image = "https://favicon.yandex.net/favicon/v2/" + tab.src + "?size=32"
      }
      if (tab.hasOwnProperty("image")) {
        tab.iconized = true;
      }
      if (tab.hasOwnProperty("shortcut")) {
        let shortcut = tab["shortcut"];
        shortcut.oncommand = `SidebarModoki.switchToTab(${i})`
        let template = ["key", shortcut];
        document.getElementById("mainKeyset").appendChild(this.jsonToDOM(template, document, {}));
        delete tab["shortcut"];
      }
      template[3][2].push(["tab", tab]);
      let browser = { id: "SM_tab" + i + "-browser", flex: "1", autoscroll: "false", src: "" };
      if (tab.src.startsWith("moz")) {
        browser.messagemanagergroup = "webext-browsers";
        browser.disableglobalhistory = true;
        browser["webextension-view-type"] = "sidebar";
        browser.type = "content";
        browser.remote = true;
        browser.maychangeremoteness = "true";
        browser.disablefullscreen = "true"
      } else if (tab.src.startsWith("http")) {
        browser.messagemanagergroup = "browsers";
        browser.disableglobalhistory = true;
        browser["webextension-view-type"] = "popup";
        browser.type = "content";
        browser.remote = true;
        browser.maychangeremoteness = "true";
        browser.disablefullscreen = "true"
      }
      template[3][3].push(["tabpanel", { id: "SM_tab" + i + "-container", orient: "vertical", flex: "1" }, ["browser", browser]]);
    }
    let sidebar = document.getElementById("sidebar-box");
    sidebar.parentNode.insertBefore(this.jsonToDOM(template, document, {}), sidebar);

    template =
      ["splitter", { id: "SM_splitter", position: this.SM_RIGHT ? "right" : "left", state: "open", collapse: this.SM_RIGHT ? "after" : "before", resizebefore: "sibling", resizeafter: "none" },
        ["grippy", {}]
      ];
    sidebar.parentNode.insertBefore(this.jsonToDOM(template, document, {}), sidebar);

    //xxx 69 hack
    let tabbox = document.getElementById("SM_tabbox");
    tabbox.handleEvent = function handleEvent(event) {
      if (!event.isTrusted) {
        // Don't let untrusted events mess with tabs.
        return;
      }

      // Skip this only if something has explicitly cancelled it.
      if (event.defaultCancelled) {
        return;
      }

      // Don't check if the event was already consumed because tab
      // navigation should always work for better user experience.
      const lazy = {};

      ChromeUtils.defineESModuleGetters(lazy, {
        ShortcutUtils: "resource://gre/modules/ShortcutUtils.sys.mjs",
      });

      switch (lazy.ShortcutUtils.getSystemActionForEvent(event)) {
        case lazy.ShortcutUtils.CYCLE_TABS:
          if (this.tabs && this.handleCtrlTab) {
            this.tabs.advanceSelectedTab(event.shiftKey ? -1 : 1, true);
            event.preventDefault();
          }
          break;
        case lazy.ShortcutUtils.PREVIOUS_TAB:
          if (this.tabs && this.handleCtrlPageUpDown) {
            this.tabs.advanceSelectedTab(-1, true);
            event.preventDefault();
          }
          break;
        case lazy.ShortcutUtils.NEXT_TAB:
          if (this.tabs && this.handleCtrlPageUpDown) {
            this.tabs.advanceSelectedTab(1, true);
            event.preventDefault();
          }
          break;
      }
    };

    let tabpannels = document.getElementById("SM_tabpanels");
    this.Tabpanels = tabpannels;
    this.Tabbox = tabbox;
    let index = tabpannels.selectedIndex;
    let tb0 = document.getElementById("SM_tab0");
    let tb1 = document.getElementById("SM_tab1");
    let tb2 = document.getElementById("SM_tab2");
    tb0.parentNode.insertBefore(tb0, tb1);
    tb0.parentNode.insertBefore(tb1, tb2);

    tabbox.selectedIndex = index;

    tabbox.querySelectorAll('tab').forEach(function (tab) {
      let aIndex = tab.id.slice(-1);
      let browser = document.getElementById("SM_tab" + aIndex + "-browser");
      tab.linkedBrowser = browser;
      browser.linkTab = tab;
    }.bind(this));

    this.addMenu();

    setTimeout(function () { this.observe(); this.onKSMOpen({}); }.bind(this), 0);

    //F11 fullscreen
    FullScreen.showNavToolbox_org = FullScreen.showNavToolbox;
    FullScreen.showNavToolbox = function (trackMouse = true) {
      FullScreen.showNavToolbox_org(trackMouse);
      if (!!SidebarModoki.ToolBox) {
        SidebarModoki.ToolBox.removeAttribute("moz-collapsed");
        SidebarModoki.Splitter.removeAttribute("moz-collapsed");
      }
    }
    FullScreen.hideNavToolbox_org = FullScreen.hideNavToolbox;
    FullScreen.hideNavToolbox = function (aAnimate = false) {
      FullScreen.hideNavToolbox_org(aAnimate);
      if (SidebarModoki.SM_AUTOHIDE && !!SidebarModoki.ToolBox) {
        SidebarModoki.ToolBox.setAttribute("moz-collapsed", "true");
        SidebarModoki.Splitter.setAttribute("moz-collapsed", "true");
      }
    }

    //DOM fullscreen
    window.addEventListener("MozDOMFullscreen:Entered", this,
                            /* useCapture */ true,
                            /* wantsUntrusted */ false);
    window.addEventListener("MozDOMFullscreen:Exited", this,
                            /* useCapture */ true,
                            /* wantsUntrusted */ false);
    /*
        SidebarUI.setPosition_org = SidebarUI.setPosition;
        SidebarUI.setPosition = function() {
          SidebarUI.setPosition_org();
          if (SidebarModoki && SidebarModoki.ToolBox) 
          SidebarModoki.ToolBox.style.setProperty("-moz-box-ordinal-group", SidebarModoki.SM_RIGHT ? "10" : "0", "");
          if (SidebarModoki && SidebarModoki.Splitter) 
          SidebarModoki.Splitter.style.setProperty("-moz-box-ordinal-group", SidebarModoki.SM_RIGHT ? "9" : "0", "");
        };
    */
  },

  addMenu: function () {
    document.getElementById("toolbarItemsMenuSeparator").after(this.jsonToDOM([
      'menuitem', { id: 'toggle_sidebar-modoki', label: 'SidebarModoki', type: 'checkbox', label: 'Sidebar Modoki', oncommand: 'SidebarModoki.toggleVisible(event);', checked: this.getPref(this.kSM_Visible, "bool", true) }
    ], document, {}))
  },

  toggleVisible: function (e) {
    this.isMenuTriggered = true;
    this.prefs.setBoolPref(this.kSM_Visible, e.target.getAttribute("checked") == "true");
  },

  observe: function () {
    this.ToolBox = document.getElementById("SM_toolbox");
    this.Splitter = document.getElementById("SM_splitter");
    this.ToolBox.setAttribute("position", this.SM_RIGHT ? "right" : "left");
    this.Splitter.setAttribute("position", this.SM_RIGHT ? "right" : "left");

    let status = this.getPref(this.kSM_Open, "bool", true);
    this.ToolBox.setAttribute("open", status);
    if (!status) {
      Array.from(this.ToolBox.querySelectorAll("[selected],[visuallyselected]")).forEach(el => {
        el.removeAttribute("selected");
        el.removeAttribute("visuallyselected");
      });
    }

    let tabs = document.getElementById("SM_tabs");
    tabs.addEventListener("focus", this, true);
    window.addEventListener("aftercustomization", this, false);

    let index = this.getPref(this.kSM_lastSelectedTabIndex, "int", 0);
    if (index > - 1) {
      this.switchToTab(index);
    }

    Services.prefs.addObserver(this.kSM_Open, (p, v) => {
      this.onKSMOpen({});
    });

    this.ToolBox.setAttribute("aria-hidden", !this.prefs.getBoolPref(this.kSM_Visible, true));

    Services.prefs.addObserver(this.kSM_Visible, (p, msg) => {
      let status = Services.prefs.getBoolPref(this.kSM_Visible, true)
      if (!this.isMenuTriggered) {
        if (status)
          document.getElementById('toggle_sidebar-modoki').setAttribute("checked", status);
        else
          document.getElementById('toggle_sidebar-modoki').removeAttribute("checked");
      }
      this.ToolBox.setAttribute("aria-hidden", !status);
      this.isMenuTriggered = false;
    });

    // xxxx native sidebar changes ordinal when change position of the native sidebar and open/close
    Services.prefs.addObserver("sidebar.position_start", () => {
      this.ToolBox.setAttribute("position", this.SM_RIGHT ? "right" : "left")
      this.Splitter.setAttribute("position", this.SM_RIGHT ? "right" : "left")
    });
  },

  onKSMOpen: function (event) {
    let status = this.getPref(this.kSM_Open, "bool", true);
    this.ToolBox.setAttribute("open", status);
    if (status) {
      addEventListener("resize", this, false);
      this.Splitter.addEventListener("mouseup", this, false);
      // document.getElementById("SM_toolbox").style.setProperty("width", width + "px", "");
    } else {
      removeEventListener("resize", this, false);
      this.Splitter.removeEventListener("mouseup", this, false);
      this.ToolBox.style.width = null;
      this.prefs.setIntPref(this.kSM_lastSelectedTabIndex, -1);
      Array.from(this.ToolBox.querySelectorAll("[selected],[visuallyselected]")).forEach(el => {
        el.removeAttribute("selected");
        el.removeAttribute("visuallyselected");
      });
    }
  },

  set selectedTab(tab) {
    if (!tab) return;
    this._selectedTab = tab;
    document.getElementById("SM_tabs").selectedIndex = tab.id.slice(-1);
    this.onSelect();
  },

  get selectedTab() {
    return this._selectedTab;
  },

  onSelect: function (event) {
    this.prefs.setBoolPref(this.kSM_Open, true);
    let aIndex = document.getElementById("SM_tabpanels").selectedIndex;
    if (aIndex != -1) {
      this.prefs.setIntPref(this.kSM_lastSelectedTabIndex, aIndex);
      width = this.getPanelWidth(aIndex);
      let { selectedTab } = this;
      if (selectedTab.linkedBrowser.src == "") {
        selectedTab.linkedBrowser.src = this.TABS[aIndex].src;
      }
      if (selectedTab.hasAttribute("label")) {
        document.querySelector("#SM_header label").innerHTML = selectedTab.getAttribute("label");
      }
      this.ToolBox.style.setProperty("width", width + "px", "");
      this.ToolBox.style.setProperty("--sm-width", width + "px", "");
      if (selectedTab.linkedBrowser.src.startsWith("http")) {
        document.getElementById("SM_openInTabButton").style.visibility = "visible";
      } else {
        document.getElementById("SM_openInTabButton").style.visibility = "collapse";
      }
      this._lastSelectedIndex = aIndex;
    }
  },

  switchToTab: function (tabNo) {
    this.prefs.setBoolPref(this.kSM_Open, true);
    let tab = document.getElementById("SM_tab" + tabNo);
    if (tab) {
      this.selectedTab = tab;
    }
  },

  advanceSelectedTab: function (dir) {
    if (typeof dir == "undefined") return;
    document.getElementById("SM_tabs").advanceSelectedTab(parseInt(dir) > 0 ? 1 : -1, true);
    this._selectedTab = tab;
    this.onSelect();
  },

  openInTab: function () {
    let uri;
    try {
      uri = Services.io.newURI(this.selectedTab.src, null, null);
    } catch (e) {
      return;
    }
    openWebLinkIn(uri.spec, 'tab', {
      postData: null,
      triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({
        userContextId: gBrowser.selectedBrowser.getAttribute(
          "userContextId"
        )
      })
    });
  },

  close: function () {
    this.prefs.setBoolPref(this.kSM_Open, false);
    this.ToolBox.style.width = null;
    this.ToolBox.style.removeProperty("--sm-width");
  },

  //ここからは, 大きさの調整
  onResize: function (event) {
    let width = this.ToolBox.getBoundingClientRect().width;
    let aIndex = this.selectedTab.id.slice(-1);
    this.setPanelWidth(aIndex, width);
  },

  handleEvent: function (event) {
    switch (event.type) {
      case 'focus':
        this.selectedTab = event.target;
        break;
      case 'mouseup':
      case 'resize':
        this.onResize(event);
        break;
      case 'MozDOMFullscreen:Entered':
        if (!!this.ToolBox) {
          this.ToolBox.setAttribute("moz-collapsed", "true");
          this.Splitter.setAttribute("moz-collapsed", "true");
        }
        break;
      case 'MozDOMFullscreen:Exited':
        if (!!this.ToolBox) {
          this.ToolBox.removeAttribute("moz-collapsed");
          this.Splitter.removeAttribute("moz-collapsed");
        }
        break;
      case 'aftercustomization':
        if (this.getPref(this.kSM_Open, "bool", true)) {
          this.Button.setAttribute("checked", true);
        }
        break;
    }
  },

  setPanelWidth: function (tabNo, width) {
    if (typeof width !== "number") {
      return false;
    }
    this.ToolBox.style.setProperty("--sm-width", width + "px", "");
    let aIndex = tabNo.toString();
    return this.prefs.setIntPref(this.kSM_lastSelectedTabWidth + aIndex, width);
  },

  getPanelWidth: function (tabNo) {
    let aIndex = tabNo.toString();
    let width = this.prefs.getIntPref(this.kSM_lastSelectedTabWidth + aIndex, this.SM_WIDTH);
    return width;
  },

  //pref読み込み
  getPref: function (aPrefString, aPrefType, aDefault) {
    try {
      switch (aPrefType) {
        case "str":
          return this.prefs.getCharPref(aPrefString).toString(); break;
        case "int":
          return this.prefs.getIntPref(aPrefString); break;
        case "bool":
        default:
          return this.prefs.getBoolPref(aPrefString); break;
      }
    } catch (e) {
    }
    return aDefault;
  }

}

SidebarModoki.init();
