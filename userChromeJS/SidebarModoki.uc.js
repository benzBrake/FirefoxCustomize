// ==UserScript==
// @name           SidebarModoki
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    TST
// @include        main
// @author         Alice0775
// @compatibility  127
// @version        2024/05/05 Bug 1892965 - Rename Sidebar launcher and SidebarUI
// @note           Tree Style Tab がある場合にブックマークと履歴等を別途"サイドバーもどき"で表示
// @note           SidebarModoki.uc.js.css をuserChrome.cssに読み込ませる必要あり
// @version        2024/03/19 WIP Bug 1884792 - Remove chrome-only :-moz-lwtheme pseudo-class
// @version        2023/07/19 00:00 add padding-top due to Bug 1705215
// @version        2023/07/17 00:00 use ES module imports
// @version        2023/03/09 Bug 1820534 - Move front-end to modern flexbox.
// @version        2022/10/12 Bug 1794630
// @version        2022/09/29 fix Bug 1689816 
// @version        2022/09/28 ordinal position
// @version        2022/09/14 fix Bug 1790299
// @version        2022/09/14 use toolbarspring instead of spacer
// @version        2022/08/26 Bug 1695435 - Remove @@hasInstance for IDL interfaces in chrome context
// @version        2022/04/01 23:00 Convert Components.utils.import to ChromeUtils.import
// @version        2022/03/26 23:00 Bug 1760342 - Remove [lwtheme]-{brighttext,darktext}
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
  get SM_RIGHT () {
    return this.getPref("sidebar.position_start", "bool", false);
  },
  get SM_MARGINHACK () {
    return this.SM_RIGHT ? "0 0 0 0" : "0 -2px 0 0";
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
  kSM_lastSelectedTabIndex: "userChrome.SidebarModoki.lastSelectedTabIndex",
  kSM_lastSelectedTabWidth: "userChrome.SidebarModoki.lastSelectedTabWidth",
  ToolBox: null,
  Button: null,
  Splitter: null,
  ContentBox: null,
  _selectedTab: null,
  get selectedTab () {
    return this._selectedTab;
  },
  set selectedTab (tab) {
    if (tab) {
      if (tab.hasAttribute("label"))
        this.Header.firstChild.innerHTML = tab.hasAttribute("label") ? tab.getAttribute("label") : "SidebarModoki"
    }
    this._selectedTab = tab;
  },
  _selectedBrowser: null,
  set selectedBrowser (browser) {
    let tab = this.getTabForBrowser(browser);
    if (browser && tab && tab.src.startsWith("http") && !browser.hasAttribute("sm-bind", true)) {
      browser.webProgress.addProgressListener(SidebarModoki.progressListener, Ci.nsIWebProgress.NOTIFY_ALL);
      browser.setAttribute("sm-bind", true);
    }
    this._selectedBrowser = browser;
  },
  get selectedBrowser () {
    return this._selectedBrowser;
  },
  get prefs () {
    delete this.prefs;
    return this.prefs = Services.prefs;
  },

  jsonToDOM: function (jsonTemplate, doc, nodes) {
    jsonToDOM.namespaces = {
      html: "http://www.w3.org/1999/xhtml",
      xul: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
    };
    jsonToDOM.defaultNamespace = jsonToDOM.namespaces.xul;
    function jsonToDOM (jsonTemplate, doc, nodes) {
      function namespace (name) {
        var reElemNameParts = /^(?:(.*):)?(.*)$/.exec(name);
        return { namespace: jsonToDOM.namespaces[reElemNameParts[1]], shortName: reElemNameParts[2] };
      }

      // Note that 'elemNameOrArray' is: either the full element name (eg. [html:]div) or an array of elements in JSON notation
      function tag (elemNameOrArray, elemAttr) {
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

    let style = `
      @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
      #SM_toolbox {
        background-color: var(--toolbar-bgcolor);
        max-width: 42em;
      }
      #SM_toolbox:not(:has(#SM_contentbox[collapsed="true"])) {
        min-width: 200px;
      }
      .SM_toolbarspring {
          max-width: unset !important;
      }
      #SM_toolbox:not([open="true"]),
      #SM_splitter:not([open="true"]),
      /*visibility*/
      /*フルスクリーン*/
      #SM_toolbox[moz-collapsed="true"],
      #SM_splitter[moz-collapsed="true"]
      {
        visibility:collapse;
      }
      #SM_splitter {
        background-color: var(--toolbar-bgcolor) !important;
        border-inline-start-color: var(--toolbar-bgcolor) !important;
        border-inline-end-color: var(--toolbar-bgcolor) !important;
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
      }
      toolbar[brighttext] #SM_tabbox {
        background-color: var(--toolbar-bgcolor);
      }
      #SM_tabs {
        width: 34px;
        overflow: auto hidden;
        flex-shrink: 0;
      }
      #SM_tabs .toolbarbutton-1 {
        --toolbarbutton-outer-padding: 3px;
        --toolbarbutton-inner-padding: 6px;
      }
      #SM_tabs .toolbarbutton-1 .toolbarbutton-text {
        display: none;
      }
      #SM_contentbox {
        overflow: hidden;
      }
      #SM_header {
        padding-block: 3px;
        justify-content: space-between;
        flex-wrap: wrap-reverse;
        gap: 4px;
      }
      #SM_buttons_group {
        padding: 3px;
        justify-content: space-between;
      }
      #SM_buttons .toolbarbutton-1 {
        padding: 0 !important;
        appearance: none !important;
      }
      #SM_buttons .toolbarbutton-1 > .toolbarbutton-icon {
        padding: 2px !important;
        height: 20px !important;
        width: 20px !important;
      }
      #SM_buttons .toolbarbutton-1:hover,
      #SM_buttons .toolbarbutton-1:focus {
        background-color: var(--toolbarbutton-hover-background) !important;
      }
      #SM_buttons .toolbarbutton-1:hover > .toolbarbutton-icon,
      #SM_buttons .toolbarbutton-1:focus > .toolbarbutton-icon {
        background-color: transparent !important;
      }
      #SM_stopReloadButton {
        display:flex;
      }
      #SM_stopReloadButton:not([display-stop="true"]) > #SM_stopButton,
      #SM_stopReloadButton[display-stop="true"] > #SM_reloadButton {
        visibility: collapse;
      }
      #SM_Button
      {
        list-style-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQ0lEQVQ4jWNgoAL4z8DA8N/AwAArTQRGFSBBI4YBDHhonC6n3AA1NTUMZ6F5gyQXYFNEsheweWnUBfRyAbmYcgMoAgBFX4a/wlDliwAAAABJRU5ErkJggg==');
      }
      toolbar[brighttext] #SM_Button
      {
        list-style-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANklEQVQ4jWP4TyFg+P///38GBgayMHUNwEdjdTrVDcDnTKJdgEsRSV5ACaBRF9DZBQObFygBAMeIxVdCQIJTAAAAAElFTkSuQmCC');
      }
     `;

    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(style.replace(/\s+/g, " ").replace(/\{SM_WIDTH\}/g, this.SM_WIDTH)));
    if (!sss.sheetRegistered(uri, sss.AGENT_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
    // xxxx try-catch may need for 2nd window
    if (!document.getElementById("SM_Button"))
      try {
        CustomizableUI.createWidget({ //must run createWidget before windowListener.register because the register function needs the button added first
          id: 'SM_Button',
          type: 'custom',
          defaultArea: CustomizableUI.AREA_NAVBAR,
          onBuild: function (aDocument) {
            var toolbaritem = aDocument.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbarbutton');
            var props = {
              id: "SM_Button",
              class: "toolbarbutton-1 chromeclass-toolbar-additional",
              tooltiptext: "Sidebar Modoki",
              oncommand: "SidebarModoki.toggle();",
              type: "button",
              label: "Sidebar Modoki",
              removable: "true"
            };
            for (var p in props) {
              toolbaritem.setAttribute(p, props[p]);
            }

            return toolbaritem;
          }
        });
      } catch (e) { }

    // to do, replace with MozXULElement.parseXULToFragment();
    let template = ["command", { id: "cmd_SidebarModoki", oncommand: "SidebarModoki.toggle()" }];
    document.getElementById("mainCommandSet").appendChild(this.jsonToDOM(template, document, {}));

    template = ["key", { id: "key_SidebarModoki", key: "B", modifiers: "accel,alt", command: "cmd_SidebarModoki", }];
    document.getElementById("mainKeyset").appendChild(this.jsonToDOM(template, document, {}));
    template =
      ["hbox", { id: "SM_toolbox" },
        ["toolbar", { id: "SM_tabs", orient: 'vertical', flex: 0 },
        ],
        ["vbox", { id: "SM_contentbox", flex: 1 },
          ["hbox", { id: "SM_header", align: "center" },
            ["label", { flex: 1 }, "SidebarModoki"],
            ["hbox", { id: 'SM_buttons_group', flex: 1 },
              ["hbox", { id: "SM_buttons", align: "end" },
                ["toolbarbutton", { id: "SM_backButton", class: "tabbable toolbarbutton-1 chromeclass-toolbar-additional", tooltiptext: "Back", image: "chrome://browser/skin/back.svg", oncommand: "SidebarModoki.back()" }],
                ["toolbarbutton", { id: "SM_forwardButton", class: "tabbable toolbarbutton-1 chromeclass-toolbar-additional", tooltiptext: "Forward", image: "chrome://browser/skin/forward.svg", oncommand: "SidebarModoki.forward()" }],
                ["toolbaritem", { id: "SM_stopReloadButton", class: "tabbable" },
                  ["toolbarbutton", { id: "SM_reloadButton", class: "toolbarbutton-1 chromeclass-toolbar-additional", tooltiptext: "Reload", image: "chrome://global/skin/icons/reload.svg", oncommand: "SidebarModoki.reload()" }],
                  ["toolbarbutton", { id: "SM_stopButton", class: "toolbarbutton-1 chromeclass-toolbar-additional", tooltiptext: "Stop", image: "chrome://global/skin/icons/close.svg", oncommand: "" }]
                ],
                ["toolbarbutton", { id: "SM_homeButton", class: "tabbable toolbarbutton-1 chromeclass-toPolbar-additional", tooltiptext: "Home", image: "chrome://browser/skin/home.svg", oncommand: "SidebarModoki.home()" }],
              ],
              ["toolbarbutton", { id: "SM_closeButton", class: "close-icon tabbable", tooltiptext: "Hide Webpanel", oncommand: "SidebarModoki.switchToTab(-1, true)" }]
            ],
          ],
          ["tabbox", { id: "SM_tabbox", flex: "1", handleCtrlPageUpDown: false, handleCtrlTab: false },
            ["tabpanels", { id: "SM_tabpanels", flex: "1", style: "border: none;" },
            ]
          ]
        ]
      ];
    for (let i = 0; i < this.TABS.length; i++) {
      let tab = Object.assign(this.TABS[i], {
        id: "SM_tab" + i,
        class: 'toolbarbutton-1 chromeclass-toolbar-additional',
        oncommand: "SidebarModoki.switchTab(event);",
      });
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
      if (tab.src.startsWith("http")) {
        tab.iswebpage = true;
        if (!("image" in tab)) {
          tab.image = "https://favicon.yandex.net/favicon/v2/" + tab.src + "?size=32"
        }
      }
      if (tab.hasOwnProperty("image")) {
        tab.iconized = true;
      }
      if (tab.hasOwnProperty("shortcut")) {
        let shortcut = tab["shortcut"];
        shortcut.oncommand = `SidebarModoki.switchToTab(${i}, true)`
        let template = ["key", shortcut];
        document.getElementById("mainKeyset").appendChild(this.jsonToDOM(template, document, {}));
        delete tab["shortcut"];
      }
      template[2].push(["toolbarbutton", tab]);
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
      template[3][3][2].push(["tabpanel", { id: "SM_tab" + i + "-container", orient: "vertical", flex: "1" }, ["browser", browser]]);
    }

    let sidebar = document.getElementById("sidebar-box");
    sidebar.parentNode.insertBefore(this.jsonToDOM(template, document, {}), sidebar);

    template =
      ["splitter", { id: "SM_splitter", state: "open", collapse: this.SM_RIGHT ? "after" : "before", resizebefore: "sibling", resizeafter: "none", collapsed: "true" },
        ["grippy", {}]
      ];
    sidebar.parentNode.insertBefore(this.jsonToDOM(template, document, {}), sidebar);

    setTimeout(function () { this.observe(); }.bind(this), 0);
  },

  observe: function () {
    this.ToolBox = document.getElementById("SM_toolbox");
    this.Splitter = document.getElementById("SM_splitter");
    this.Header = document.getElementById("SM_header");
    this.ContentBox = document.getElementById("SM_contentbox");
    this.TabBox = document.getElementById("SM_tabbox");
    this.ControlButtons = document.getElementById("SM_buttons");

    this.updatePosition();

    this.ToolBox.addEventListener("resize", this, false);

    this.Splitter.addEventListener("mousedown", this, false);

    if (this.prefs.getBoolPref(this.kSM_Open, true)) {
      document.getElementById('SM_Button').setAttribute('checked', true);
      let index = this.getPref(this.kSM_lastSelectedTabIndex, "int", 0);
      this.ToolBox.setAttribute("open", true);
      this.switchToTab(index);
    }

    this.ToolBox.removeAttribute("collapsed");
    this.Splitter.removeAttribute("collapsed");
    window.addEventListener("aftercustomization", this, false);

    this.prefs.addObserver("sidebar.position_start", (p, v) => {
      setTimeout(() => {
        SidebarModoki.updatePosition();
      }, 1);
    })

    setTimeout(() => {
      this.selectedTab = this.selectedTab;
    }, 300)
  },

  switchTab ({ target }) {
    let index = target.id.replace(/^SM_tab/, "");
    this.switchToTab(target.getAttribute("checked") === "true" ? -1 : index, true);
  },

  switchToTab: function (index, saveIndex) {
    if (index >= 0) {
      let tabIndex = - 1;
      this.selectedTab = null;
      this.selectedBrowser = null;
      [...document.getElementById('SM_tabs').children].forEach(tab => {
        if (tab.id == "SM_tab" + index) {
          tab.setAttribute('checked', true);
          let browser = this.getBrowserForTab(tab);
          if (!browser.src)
            browser.src = tab.src;
          document.getElementById("SM_tabpanels").selectedIndex = index;
          this.ContentBox.removeAttribute("collapsed");
          this.ToolBox.setAttribute("open", true);
          this.ToolBox.style.setProperty("width", this.getPref(this.kSM_lastSelectedTabWidth + index, "int", this.SM_WIDTH) + "px", "");
          this.Splitter.setAttribute("open", true);
          tabIndex = index;
          this.selectedTab = tab;
          this.selectedBrowser = browser;
        } else {
          tab.removeAttribute('checked');
        }
      });
      index = tabIndex;
    } else {
      this.ContentBox.setAttribute("collapsed", true);
      this.Splitter.removeAttribute("open");
      this.ToolBox.style.removeProperty("width");
      document.querySelectorAll("#SM_tabs toolbarbutton[checked]").forEach(btn => btn.removeAttribute('checked'));
      index = -1;
    }
    if (this.selectedBrowser) {
      this.ControlButtons.collapsed = false;
      this.updateButtons();
    } else {
      this.ControlButtons.collapsed = true;
    }
    if (saveIndex) {
      this.prefs.setIntPref(this.kSM_lastSelectedTabIndex, index);
    }
  },

  updatePosition () {
    const { ToolBox, Splitter } = this;
    let posiotionend = this.SM_RIGHT;

    ToolBox.style.setProperty("order", posiotionend ? 10 : -1, "");
    ToolBox.style.setProperty("flex-direction", posiotionend ? "row-reverse" : "row");
    ToolBox.style.setProperty("margin", this.SM_MARGINHACK);
    Splitter.style.setProperty("order", posiotionend ? 9 : -1, "");
    Splitter.setAttribute("collapse", posiotionend ? "after" : "before");
    ToolBox.setAttribute("positionend", posiotionend);
    Splitter.setAttribute("positionend", posiotionend);
  },

  updateButtons () {
    if (this.selectedBrowser && this.selectedTab && this.selectedTab.src.startsWith("http")) {
      this.ControlButtons.collapsed = !this.selectedTab.src.startsWith("http");
      const { canGoBack, canGoForward, isNavigating } = this.selectedBrowser.webNavigation;
      if (canGoBack) {
        document.getElementById("SM_backButton").removeAttribute("disabled");
      } else {
        document.getElementById("SM_backButton").setAttribute("disabled", true);
      }
      if (canGoForward) {
        document.getElementById("SM_forwardButton").removeAttribute("disabled");
      } else {
        document.getElementById("SM_forwardButton").setAttribute("disabled", true);
      }
      document.getElementById("SM_stopReloadButton").setAttribute("display-stop", !!isNavigating);
    }
  },

  getBrowserForTab (tab) {
    if (tab instanceof Object && tab.id.startsWith("SM_tab")) {
      return document.getElementById(tab.id + "-browser");
    }
  },

  getTabForBrowser (browser) {
    if (browser instanceof Object && browser.id.startsWith("SM_tab")) {
      return document.getElementById(browser.id.replace("-browser", ""));
    }
  },

  progressListener: {
    QueryInterface: ChromeUtils.generateQI([
      "nsIWebProgressListener",
      "nsISupportsWeakReference",
    ]),
    onStateChange (progress, request, flag) {
      if (progress === SidebarModoki.selectedBrowser.webProgress) {
        const isStop = flag & Ci.nsIWebProgressListener.STATE_STOP;
        if (!!isStop) {
          document.getElementById("SM_stopReloadButton").removeAttribute("display-stop");
        } else {
          document.getElementById("SM_stopReloadButton").setAttribute("display-stop", true);
        }
      }
    },

    onLocationChange (progress, request, location, flag) {
      if (progress === SidebarModoki.selectedBrowser.webProgress) {
        SidebarModoki.updateButtons();
      }
    }
  },

  reload () {
    let b = this.getBrowserForTab(this.selectedTab);
    if (b) {
      document.getElementById('SM_stopReloadButton').setAttribute("display-stop", true);
      b.reload();
    }
  },

  stop () {
    this.getBrowserForTab(this.selectedTab)?.stop();
  },

  home () {
    if (this.selectedTab && this.selectedBrowser && this.selectedTab.src !== this.selectedBrowser.currentURI.spec) {
      this.selectedBrowser.src = "";
      this.selectedBrowser.src = this.selectedTab.src;
    }
  },

  back () {
    this.getBrowserForTab(this.selectedTab)?.goBack();
  },

  forward () {
    this.getBrowserForTab(this.selectedTab)?.goForward();
  },

  toggle: function () {
    this.Button = document.getElementById("SM_Button");
    if (!this.Button.hasAttribute("checked")) {
      this.Button.setAttribute("checked", true);
      this.ToolBox.setAttribute("open", true);
      this.Splitter.setAttribute("open", true);
      let index = this.getPref(this.kSM_lastSelectedTabIndex, "int", 0);
      width = this.getPref(this.kSM_lastSelectedTabWidth + index, "int", this.SM_WIDTH);
      this.ToolBox.style.setProperty("width", width + "px", "");
      this.prefs.setBoolPref(this.kSM_Open, true)
      this.switchToTab(index);
    } else {
      this.close();
    }
  },

  close: function () {
    removeEventListener("resize", this, false);
    this.Button = document.getElementById("SM_Button");
    this.Button.removeAttribute("checked");
    this.ToolBox.removeAttribute("open");
    this.Splitter.removeAttribute("open");
    this.prefs.setBoolPref(this.kSM_Open, false)
  },

  handleEvent: function (event) {
    switch (event.type) {
      case 'focus':
        this.onSelect(event);
        break;
      case 'resize':
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
        this.Button = document.getElementById("SM_Button");
        if (this.getPref(this.kSM_Open, "bool", true)) {
          this.Button.setAttribute("checked", true);
        } else {
          this.Button.removeAttribute("checked");
        }
        this.ToolBox.removeAttribute("collapsed");
        this.Splitter.removeAttribute("collapsed");
        break;
      case 'mousedown':
        this.isMouseDown = true;
        document.addEventListener("mousemove", this, false);
        document.addEventListener("mouseup", this, false);
        break;
      case 'mousemove':
      case 'mouseup':
        if (this.isMouseDown) {
          setTimeout(() => {
            if (this.ToolBox.getBoundingClientRect().width < 200) {
              this.ToolBox.removeAttribute("collapsed");
              this.ToolBox.setAttribute("width", 200);
              this.ToolBox.style.width = "200px";
            }
          }, 0)
          if (event.type == "mouseup") {
            this.isMouseDown = false;
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            let checkedTab = document.querySelectorAll("#SM_tabs toolbarbutton[checked]")[0];
            if (checkedTab) {
              let index = checkedTab.id.replace("SM_tab", "");
              this.prefs.setIntPref(this.kSM_lastSelectedTabWidth + index, this.ToolBox.getBoundingClientRect().width);
            }
          }
        }
        break;
    }
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
