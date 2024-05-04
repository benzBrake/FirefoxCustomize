// ==UserScript==
// @name           UserCSSLoader
// @description    Stylish みたいなもの
// @namespace      https://github.com/benzBrake/FirefoxCustomize
// @author         Ryan, Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 80
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @downloadURL    https://github.com/benzBrake/FirefoxCustomize/raw/master/userChromeJS/UserCSSLoader.uc.js
// @version        0.0.5
// @charset        UTF-8
// @note           FileUtils 改为 IOUtils，不兼容Fireofox 80以下，把主菜单项目改成工具按钮了。
// ==/UserScript==

/****** 使い方 ******

默认从 profileDir\chrome\UserSyles 读取样式

.as.css/.ag.css结尾的是 AGENT_SHEET
.us.css 结尾的是 USER_SHEET
其他.css是 AUTHOR_SHEET (默认)
不忘忘记添加 @namespace 此脚本不会检查 css 内容

支持关闭编辑器后自动重载 CSS（不支持 Code.exe），建议使用非多标签的独立编辑器比如 notepad2.exe 作为默认编辑器

about:config
"view_source.editor.path" 指定编辑器路径
"userChromeJS.UserCSSLoader.FOLDER" CSS 文件夹路径，相对于 chrome 文件夹
"userChromeJS.UserCSSLoader.reloadOnEdit" 编辑的时候只要文件修改时间发生变化就重载 (true/false， 默认为 true)
"userChromeJS.UserCSSLoader.showInToolsMenu" 显示在工具菜单中，开发中，不可用 (true/false， 默认为 false)

 **** 説明終わり ****/
(async function (css) {
  var { Services } = globalThis || ChromeUtils.import("resource://gre/modules/Services.jsm");
  var { CustomizableUI } = globalThis || ChromeUtils.import("resource:///modules/CustomizableUI.jsm");

  var sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

  const DIRECTORY_SEPARATOR = Services.appinfo.OS === "WINNT" ? "\\" : "/";

  const STYLES_NAME_MAP = {
    0: {
      name: "AGENT_SHEET",
      ext: ".ag.css",
    },
    1: {
      name: "USER_SHEET",
      ext: ".us.css",
    },
    2: {
      name: "AUTHOR_SHEET",
      ext: ".css",
    }
  }

  window.UserCSSLoader = {
    BTN_ID: 'UserCSSLoader-btn',
    AGENT_SHEET: sss.AGENT_SHEET,
    USER_SHEET: sss.USER_SHEET,
    AUTHOR_SHEET: sss.AUTHOR_SHEET,
    DEFAULT_FOLDER: "UserStyles",
    KEY_PREFIX: "userChromeJS.UserCSSLoader.",
    KEY_FOLDER: "FOLDER",
    KEY_ALL_DISABLED: "allDisabled",
    KEY_DISABLED_STYLES: "stylesDisabled",
    KEY_SHOW_IN_TOOLS_MENU: "showInToolsMenu",
    KEY_RELOAD_ON_EDIT: "reloadOnEdit",

    CSSEntries: [],
    customShowings: [],

    get allDisabled() {
      return this.prefs.getBoolPref(this.KEY_ALL_DISABLED, false);
    },

    set allDisabled(val) {
      this.prefs.setBoolPref(this.KEY_ALL_DISABLED, val);
    },

    get showInToolsMenu() {
      return this.prefs.getBoolPref(this.KEY_SHOW_IN_TOOLS_MENU, false);
    },

    get reloadOnEdit() {
      return this.prefs.getBoolPref(this.KEY_RELOAD_ON_EDIT, true);
    },

    get STYLE() {
      delete this.STYLE;
      return this.STYLE = {
        url: makeURI("data:text/css;charset=utf-8," + encodeURIComponent(css.replaceAll("{BTN_ID}", this.BTN_ID))),
        type: this.AUTHOR_SHEET
      }
    },

    get prefs() {
      delete this.prefs;
      return this.prefs = Services.prefs.getBranch(this.KEY_PREFIX);
    },

    get FOLDER() {
      delete this.FOLDER;
      var path = this.prefs.getStringPref(this.KEY_FOLDER, this.DEFAULT_FOLDER)
      var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
      aFile.appendRelativePath(path);
      if (!aFile.exists()) {
        aFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
      }
      return this.FOLDER = aFile;
    },

    init() {
      if (typeof userChrome_js === "object" && "L10nRegistry" in userChrome_js) {
        this.l10n = new DOMLocalization(["UserCSSLoader.ftl"], false, userChrome_js.L10nRegistry);
      } else {
        this.l10n = {
          formatValue: async function () {
            return "";
          },
          formatMessages: async function () {
            return "";
          }
        }
      }

      if (!sss.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
        sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
      }

      this.disabledStyles = new DisabledSet(JSON.parse(this.prefs.getStringPref(this.KEY_DISABLED_STYLES, "[]")).sort((a, b) => a[0].localeCompare(b[0])));

      if (this.showInToolsMenu) {
        let ins = document.getElementById("devToolsSeparator");
        let menu = createElement(document, "menu", {
          label: "UserCSSLoader",
          class: "menu-iconic"
        });
        this.MENU = ins.parentNode.insertBefore(menu, ins);
        let menupopup = createElement(document, "menupopup", {
          id: this.BTN_ID + "-popup",
          class: this.BTN_ID + "-popup"
        });
        this.menupopup = this.MENU.appendChild(menupopup);
      } else {
        if (!(CustomizableUI.getWidget(this.BTN_ID) && CustomizableUI.getWidget(this.BTN_ID).forWindow(window)?.node)) {
          CustomizableUI.createWidget({
            id: this.BTN_ID,
            removable: true,
            defaultArea: CustomizableUI.AREA_NAVBAR,
            type: "custom",
            onBuild: doc => this.createButton(doc)
          });
        }

        this.BTN = CustomizableUI.getWidget(this.BTN_ID).forWindow(window).node;
        this.BTN.addEventListener("mouseover", this, false);
        this.BTN.addEventListener("click", this, false);
        this.menupopup = this.BTN.querySelector("#" + this.BTN_ID + "-popup");
      }
      this.menupopup.addEventListener("popupshowing", this, false);

      this.rebuild();

      Services.prefs.addObserver(this.KEY_PREFIX, this);
      window.addEventListener("unload", this);
    },
    createButton(doc) {
      let btn = createElement(doc, 'toolbarbutton', {
        id: this.BTN_ID,
        label: "UserCSSLoader",
        type: 'menu',
        class: 'toolbarbutton-1 chromeclass-toolbar-additional',
        onclick: function (event) {
          if (event.target.id !== window.UserCSSLoader.BTN_ID) return;
        }
      });

      let menupopup = createElement(doc, "menupopup", {
        id: this.BTN_ID + "-popup",
        class: this.BTN_ID + "-popup"
      });

      btn.appendChild(menupopup);
      return btn;
    },
    initMenu(popup) {
      let popup_ = popup || this.menupopup || document.getElementById(this.BTN_ID + "-popup"), that = this;
      if (!popup) return;
      let doc = popup.ownerDocument;

      if (popup.getAttribute("initalized") === "true") return;

      while (popup_.firstChild) {
        popup_.removeChild(popup_.firstChild);
      }

      [{
        label: !this.prefs.getBoolPref("allDisabled", false) ? "Enabled" : "Disabled",
        class: "menuitem menuitem-iconic",
        type: "checkbox",
        oncommand: "UserCSSLoader.allDisabled = !UserCSSLoader.allDisabled;",
        onshowing: function () {
          this.setAttribute("label", !UserCSSLoader.allDisabled ? "Enabled" : "Disabled");
          this.setAttribute("checked", !UserCSSLoader.allDisabled);
        }
      }, {}, {
        label: "Reload all styles",
        class: "menuitem menuitem-iconic",
        oncommand: "window.UserCSSLoader.rebuild();"
      }, {
        label: "Open Style Folder",
        class: "menuitem menuitem-iconic",
        oncommand: "window.UserCSSLoader.openFolder();"
      }, {
        label: "Create Style",
        class: "menu menu-iconic",
        popup: [{
          label: "AUTHOR_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.AUTHOR_SHEET)"
        }, {
          label: "USER_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.USER_SHEET)"
        }, {
          label: "AGENT_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.AGENT_SHEET)"
        }]
      }, {

      }, {
        content: "Middle click not close menu",
        type: "html:h2",
        class: "subview-subheader"
      }].forEach(menuObj => {
        popup_.appendChild(createMenu(doc, menuObj));
      });
      if (!doc.getElementById("ucl-change-style-popup")) {
        let changeTypePopup = createElement(doc, "menupopup", {
          id: "ucl-change-style-popup"
        });
        [{
          type: "html:h2",
          class: "subview-subheader",
          content: "Change style type",
          style: "text-align: center;"
        }, {
          label: "AUTHOR_SHEET",
          flag: "AUTHOR_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "UserCSSLoader.changeStyleType(event, UserCSSLoader.AUTHOR_SHEET)"
        }, {
          label: "USER_SHEET",
          flag: "USER_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "UserCSSLoader.changeStyleType(event, UserCSSLoader.USER_SHEET)"
        }, {
          label: "AGENT_SHEET",
          flag: "AGENT_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: 'UserCSSLoader.changeStyleType(event, UserCSSLoader.AGENT_SHEET)'
        }].forEach(menuObj => {
          changeTypePopup.appendChild(createMenu(doc, menuObj));
        });
        doc.getElementById("mainPopupSet").appendChild(changeTypePopup);
      }

      popup.setAttribute("initalized", true);

      function createMenu(doc, menuObj) {
        if ((!menuObj.label && !menuObj['data-l10n-id']) && !menuObj.type || menuObj.type?.endsWith("separator")) {
          return createElement(doc, "menuseparator");
        }
        let isMenu = menuObj.popup && Array.isArray(menuObj.popup) && menuObj.popup.length;
        let menu = createElement(doc, menuObj.type?.startsWith("html") ? menuObj.type : isMenu ? "menu" : "menuitem", menuObj, ["showing", "popup"]);
        if (menuObj.onshowing) {
          that.customShowings.push({
            item: menu,
            fnSource: menuObj.onshowing.toString()
          });
        }
        if (isMenu) {
          let menupopup = createElement(doc, "menupopup");
          menuObj.popup.forEach(obj => {
            menupopup.appendChild(createElement(doc, "menuitem", obj));
          });
          menu.appendChild(menupopup);
        }
        return menu;
      }
    },
    refreshCSSEntries(popup) {
      if (!popup) return;
      if (popup.getAttribute("css-initalized") === "true") return;

      popup.querySelectorAll(".ucl-dynamic").forEach(item => {
        item?.parentNode?.removeChild(item);
      });
      const doc = popup.ownerDocument;
      this.CSSEntries.forEach(entry => {
        let group = createElement(doc, "menugroup", {
          class: 'ucl-dynamic showFirstText',
        });
        let item = createElement(doc, 'menuitem', {
          label: entry.name,
          type: "checkbox",
          class: "menuitem menuitem-iconic",
          checked: !entry.disabled,
          fullName: entry.fullName,
          css: true,
          closemenu: 'none',
          oncommand: `window.UserCSSLoader.toggleStyle(event, "${entry.fullName}");`
        });
        group.appendChild(item);
        let type = createElement(doc, 'menuitem', {
          class: "menuitem menuitem-iconic style-flag",
          flag: STYLES_NAME_MAP[entry.type]['name'],
          fullName: entry.fullName,
          closemenu: 'none',
          oncommand: `window.UserCSSLoader.changeTypePopup(event, "${entry.fullName}");`
        });
        group.appendChild(type);
        let edit = createElement(popup.ownerDocument, 'menuitem', {
          label: "Edit",
          class: "menuitem menuitem-iconic edit",
          oncommand: `window.UserCSSLoader.editStyle("${entry.fullName}");`
        });
        group.appendChild(edit);
        let del = createElement(popup.ownerDocument, 'menuitem', {
          label: "Delete",
          class: "menuitem menuitem-iconic delete",
          oncommand: `window.UserCSSLoader.deleteStyle("${entry.fullName}");`
        });
        group.appendChild(del);
        popup.appendChild(group);
      });
      popup.setAttribute("css-initalized", true);
    },
    refreshMenuItemStatus(popup) {
      if (!popup) return;
      this.customShowings.forEach(function (obj) {
        var curItem = obj.item;
        try {
          eval('(' + obj.fnSource + ').call(curItem, curItem)');
        } catch (ex) {
          console.error('custom showing method error', obj.fnSource, ex);
        }
      });
      popup.querySelectorAll('[type="checkbox"][css]').forEach(item => {
        let entry = this.CSSEntries.find(entry => entry.fullName === item.getAttribute("fullName"));
        if (!entry) return;
        item.setAttribute("checked", !entry.disabled);
      });
    },
    uninit() {
      this.CSSEntries.forEach(entry => {
        entry.unregister();
      });
      window.removeEventListener("unload", this);
    },
    destroy() {
      if (doc.getElementById("ucl-change-style-popup")) {
        doc.getElementById("ucl-change-style-popup").parentNode.removeChild(doc.getElementById("ucl-change-style-popup"));
      }
      if (this.BTN)
        CustomizableUI.removeWidget(this.BTN_ID);
      else
        this.MENU?.parentNode?.removeChild(this.MENU);
      this.uninit();
      delete this;
    },
    handleEvent(event) {
      switch (event.type) {
        case "mouseover":
          if (event.target.id !== this.BTN_ID) return;
          let win = event.target.ownerGlobal;
          let mp = event.target.querySelector(":scope>menupopup");
          if (event.clientX > (win.innerWidth / 2) && event.clientY < (win.innerHeight / 2)) {
            mp.setAttribute("position", "after_end");
          } else if (event.clientX < (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
            mp.setAttribute("position", "before_start");
          } else if (event.clientX > (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
            mp.setAttribute("position", "before_start");
          } else {
            mp.removeAttribute("position", "after_end");
          }
          break;
        case "click":
          if (event.target.id !== this.BTN_ID) return;
          if (event.button === 1) {
            this.allDisabled = !this.allDisabled;
          }
          break;
        case "popupshowing":
          if (event.target.id !== this.BTN_ID + "-popup") return;
          this.initMenu(event.target);
          this.refreshCSSEntries(event.target);
          this.refreshMenuItemStatus(event.target);
          break;
        case "unload":
          this.uninit();
          break;
      }
    },
    observe(aSubject, aTopic, aData) {
      switch (aTopic) {
        case "nsPref:changed":
          switch (aData) {
            case this.KEY_PREFIX + this.KEY_ALL_DISABLED:
              if (this.allDisabled) {
                this.BTN.classList.add("icon-disabled");
              } else {
                this.BTN.classList.remove("icon-disabled");
              }
              this.rebuild();
          }
          break;
      }
    },
    async rebuild() {
      if (this.initalizing) return;
      this.initalizing = true;
      this.CSSEntries.forEach(css => css.unregister());
      this.CSSEntries = [];
      let files = this.FOLDER.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
      while (files.hasMoreElements()) {
        let file = files.getNext().QueryInterface(Ci.nsIFile);
        if (file.leafName.endsWith('.css')) {
          let entry = new CSSEntry(file);
          if (!this.allDisabled)
            entry.register();
          this.CSSEntries.push(entry);
        }
      }
      this.initalizing = false;
      this.menupopup?.setAttribute("css-initalized", false);
    },
    openFolder() {
      this.FOLDER.launch();
    },
    createStyle(type) {
      if (STYLES_NAME_MAP[type] === undefined) {
        console.error("Invalid type:", type);
        return;
      }
      let result = { value: new Date().getTime() };
      let aTitle = "Create %s Style".replace("%s", STYLES_NAME_MAP[type]['name']), aDetail = "Enter a name for the new style";
      if (Services.prompt.prompt(
        window, aTitle, aDetail, result, null, {}
      )) {
        let name = result.value + STYLES_NAME_MAP[type]['ext'];
        if (!this.FOLDER.exists()) {
          this.FOLDER.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
        }
        this._createStyle(name).then(async file => {
          let entry = new CSSEntry(file);
          this.CSSEntries.push(entry);
          entry.register();
          this.menupopup?.setAttribute("css-initalized", false);
          await this.editStyle(entry.fullName);
        }).catch(err => {
          console.error(err);
        });
      }
    },
    _createStyle(fileName) {
      const path = this.FOLDER.path + DIRECTORY_SEPARATOR + fileName;
      return new Promise(async (resolve, reject) => {
        if (await IOUtils.exists(path)) {
          reject("File already exists");
        }
        try {
          await IOUtils.writeUTF8(path, "");
          resolve(await IOUtils.getFile(path));
        } catch (e) {
          reject(e);
        }
      });
    },
    toggleStyle(event, fullName) {
      let entry = (this.CSSEntries.filter(e => e.fullName === fullName) || [{}])[0];
      if (entry instanceof CSSEntry) {
        entry.toggleStyle();
        if (event.button !== 1) {
          closeMenus(event.target);
        }
      }
    },
    editStyle(fullName) {
      let entry = (this.CSSEntries.filter(e => e.fullName === fullName) || [{}])[0];
      if (entry instanceof CSSEntry) {
        if (this.reloadOnEdit) {
          entry.startObserver();
        }
        this._editCSSEntry(entry).then(_ => {
          entry.stopObserver();
          this.rebuild();
        });
      }

    },
    async _editCSSEntry(entry) {
      let editor;
      try {
        editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
      } catch (e) { }
      if (!editor || !editor.exists()) {
        editor = await new Promise(resolve => {
          let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
          try {
            fp.init(window.browsingContext, "Select Editor", Ci.nsIFilePicker.modeOpen);
          } catch (e) {
            fp.init(window, "Select Editor", Ci.nsIFilePicker.modeOpen);
          }
          fp.appendFilters(Ci.nsIFilePicker.filterApps);
          fp.appendFilters(Ci.nsIFilePicker.filterAll);
          fp.open(async (result) => {
            if (result == Ci.nsIFilePicker.returnOK) {
              Services.prefs.setComplexValue("view_source.editor.path", Ci.nsIFile, fp.file);
              resolve(fp.file);
            } else {
              resolve(null);
            }
          })
        });
      }
      if (editor) {
        let args = [entry.path];
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        try {
          process.init(editor);
          return await new Promise((resolve, reject) => {
            process.runwAsync(
              args,
              args.length,
              this._processObserver(resolve, reject)
            );
          });
        } catch (e) {
          console.error(e);
          this.alert("Cannot edit style, click here to open styles folder.", "UserCSSLoader", function () {
            this.openFolder();
          });
        }
      }
    },
    _processObserver(resolve, reject) {
      return {
        observe(subject, topic) {
          switch (topic) {
            case "process-finished":
              try {
                // Wait 1s after process to resolve
                setTimeout(resolve, 1000);
              } catch (ex) {
                reject(ex);
              }
              break;
            default:
              reject(topic);
              break;
          }
        },
      };
    },
    changeTypePopup(event) {
      if (document.getElementById("ucl-change-style-popup")) {
        let popup = document.getElementById("ucl-change-style-popup");
        popup.querySelectorAll('[disabled="true"]').forEach(el => el.removeAttribute("disabled"));
        if (popup.state !== "closed") {
          popup.hidePopup();
        }
        let flag = event.target.getAttribute("flag");
        popup.querySelector(`[flag="${flag}"]`)?.setAttribute("disabled", true);
        popup.openPopup(event.target, "after_end", 0, 0, false, false)
      }
    },
    changeStyleType(event, type) {
      if (STYLES_NAME_MAP[type] === undefined) {
        console.error("Invalid type:", type);
        return;
      }
      let { anchorNode } = event.target.closest("menupopup");
      let entry = (this.CSSEntries.filter(e => e.fullName === anchorNode.getAttribute("fullName")) || [{}])[0];
      if (entry instanceof CSSEntry) {
        let { file } = entry;
        try {
          entry.unregister();
          let newFilename = entry.name + STYLES_NAME_MAP[type]['ext'];
          let newPath = file.parent.path + DIRECTORY_SEPARATOR + newFilename;
          let that = this;
          (async function () {
            try {
              await IOUtils.move(file.path, newPath);
              that.CSSEntries = that.CSSEntries.filter(e => e.fullName !== entry.fullName);
              entry = new CSSEntry(await IOUtils.getFile(newPath));
              that.CSSEntries.push(entry);
              entry.register();
            } catch (e) {
              console.error(e);
            }
            that.menupopup?.setAttribute("css-initalized", false);
          })();
        } catch (e) {
          console.error(e);
        }
      }
    },
    deleteStyle(fullName) {
      let aTitle = "Delete Style", aMsg = "Are you sure you want to delete this style [%s]?".replace("%s", fullName);
      if (Services.prompt.confirm(window, aTitle, aMsg, false)) {
        let entry = (this.CSSEntries.filter(e => e.fullName === fullName) || [{}])[0];
        if (entry instanceof CSSEntry) {
          entry.unregister();
          entry.file.remove(false);
          this.disabledStyles.delete(fullName);
          this.rebuild();
        }
      }
    },
    alert: function (aMsg, aTitle, aCallback) {
      var callback = aCallback ? {
        observe: function (subject, topic, data) {
          if ("alertclickcallback" != topic)
            return;
          aCallback.call(null);
        }
      } : null;
      var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
      alertsService.showAlertNotification(
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "UserCSSLoader",
        aMsg + "", !!callback, "", callback);
    },
  };

  class DisabledSet extends Set {
    constructor(iterable) {
      super(iterable);
    }

    add(item) {
      let cache_add = Set.prototype.add.call(this, item);
      UserCSSLoader.prefs.setStringPref(UserCSSLoader.KEY_DISABLED_STYLES, JSON.stringify([...this]));
      return cache_add;
    }

    delete(item) {
      let cache_delete = Set.prototype.delete.call(this, item);
      UserCSSLoader.prefs.setStringPref(UserCSSLoader.KEY_DISABLED_STYLES, JSON.stringify([...this]));
      return cache_delete;
    }
  }

  function CSSEntry(aFile) {
    this.type = (aFile.leafName.endsWith('.us.css') || aFile.leafName.endsWith('.user.css')) ?
      sss.USER_SHEET :
      (aFile.leafName.endsWith('.as.css') || aFile.leafName.endsWith('.ag.css')) ?
        sss.AGENT_SHEET :
        sss.AUTHOR_SHEET;

    this.file = aFile;
    this.fullName = aFile.leafName;
    this.name = aFile.leafName.replace(/(?:\.(?:user|as|ag||us))?\.css$/, '');
    this.path = aFile.path;
    this.url = Services.io.newURI("chrome://userchrome/content/UserStyles/" + this.fullName)
    this.lastModifiedTime = aFile.lastModifiedTime;
  }

  CSSEntry.prototype = {
    get disabled() {
      return UserCSSLoader.disabledStyles.has(this.fullName);
    },
    set disabled(bool) {
      if (bool) {
        UserCSSLoader.disabledStyles.add(this.fullName);
        this.unregister();
      } else {
        UserCSSLoader.disabledStyles.delete(this.fullName);
        this.register();
      }
    },
    toggleStyle() {
      this.disabled = !this.disabled;
    },
    reloadStyle() {
      this.unregister();
      this.register();
    },
    startObserver() {
      this.timer = setInterval(() => {
        if (this.lastModifiedTime !== this.file.lastModifiedTime) {
          this.lastModifiedTime = this.file.lastModifiedTime;
          this.reloadStyle();
        }
      }, 500);
    },
    stopObserver() {
      clearInterval(this.timer);
    },
    isRunning: false,
    register() {
      if (!this.disabled) {
        IOUtils.stat(this.path).then((value) => {
          if (sss.sheetRegistered(this.url, this.type)) {
            if (this.lastModifiedTime != value.lastModified) {
              sss.unregisterSheet(uri, this.SHEET);
              sss.loadAndRegisterSheet(this.url, this.type);
              this.isRunning = true;
            }
          } else {
            sss.loadAndRegisterSheet(this.url, this.type);
            this.isRunning = true;
          }
        });
      }
    },
    unregister() {
      if (sss.sheetRegistered(this.url, this.type)) {
        sss.unregisterSheet(this.url, this.type);
      }
      this.isRunning = false;
    }
  };

  /**
   * 创建 DOM 元素
   * 
   * @param {Document} d HTML 文档
   * @param {string} t DOM 元素标签
   * @param {Object} o DOM 元素属性键值对
   * @param {Array} s 跳过属性
   * @returns 
   */
  function createElement(d, t, o = {}, s = []) {
    if (!d) return;
    let e = /^html:/.test(t) ? d.createElement(t) : d.createXULElement(t);
    return applyAttr(e, o, s);
  }

  /**
   * 给 DOM 元素应用属性
   * 
   * @param {HTMLElement} e DOM 元素
   * @param {Object|null} o 属性键值对，使用 Object 方式存储
   * @param {Object|null} s 跳过属性
   * @returns 
   */
  function applyAttr(e, o = {}, s = []) {
    for (let [k, v] of Object.entries(o)) {
      if (s.includes(k)) continue;
      if (k == "content") {
        e.innerHTML = v;
        continue;
      }
      if (typeof v == "function") {
        e.setAttribute(k, typeof v === 'function' ? "(" + v.toString() + ").call(this, event);" : v);
      } else {
        e.setAttribute(k, v);
      }
    }
    return e;
  }

  "canLoadToolbarContentPromise" in PlacesUIUtils ? PlacesUIUtils.canLoadToolbarContentPromise.then(_ => UserCSSLoader.init()) : UserCSSLoader.init();
})(`
#{BTN_ID} > .toolbarbutton-icon {
  list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA2NCA2NCIgdHJhbnNmb3JtPSJzY2FsZSgxLjMpIj4NCiAgPHJhZGlhbEdyYWRpZW50IGlkPSI3RGk0N3lGTzZFWnRsVkpnVlBqdHhhIiBjeD0iMzMuNzg3IiBjeT0iMzEuMzgzIiByPSIxOS45NTEiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAyKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPg0KICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2Y0ZTljMyIgLz4NCiAgICA8c3RvcCBvZmZzZXQ9Ii4yMTkiIHN0b3AtY29sb3I9IiNmOGVlY2QiIC8+DQogICAgPHN0b3Agb2Zmc2V0PSIuNjQ0IiBzdG9wLWNvbG9yPSIjZmRmNGRjIiAvPg0KICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmZjZlMSIgLz4NCiAgPC9yYWRpYWxHcmFkaWVudD4NCiAgPHBhdGggZmlsbD0idXJsKCM3RGk0N3lGTzZFWnRsVkpnVlBqdHhhKSIgZD0iTTQsOUw0LDljMi4yMDksMCw0LTEuNzkxLDQtNGwwLDBjMC0yLjIwOS0xLjc5MS00LTQtNGwwLDBDMS43OTEsMSwwLDIuNzkxLDAsNWwwLDBDMCw3LjIwOSwxLjc5MSw5LDQsOXoiIC8+DQogIDxyYWRpYWxHcmFkaWVudCBpZD0iN0RpNDd5Rk82RVp0bFZKZ1ZQanR4YiIgY3g9IjMyLjUwMSIgY3k9IjMwLjE0OSIgcj0iMjMuODk0IiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMikiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4NCiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNGU5YzMiIC8+DQogICAgPHN0b3Agb2Zmc2V0PSIuMjE5IiBzdG9wLWNvbG9yPSIjZjhlZWNkIiAvPg0KICAgIDxzdG9wIG9mZnNldD0iLjY0NCIgc3RvcC1jb2xvcj0iI2ZkZjRkYyIgLz4NCiAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmY2ZTEiIC8+DQogIDwvcmFkaWFsR3JhZGllbnQ+DQogIDxwYXRoIGZpbGw9InVybCgjN0RpNDd5Rk82RVp0bFZKZ1ZQanR4YikiIGQ9Ik00NSw0OS41TDQ1LDQ5LjVjMCwzLjU5LDIuOTEsNi41LDYuNSw2LjVoOGMyLDAsMy42LDEuNjcsMy41LDMuNjlDNjIuOSw2MS41OCw2MS4yLDYzLDU5LjMsNjNINy41QzUuNTY3LDYzLDQsNjEuNDMzLDQsNTkuNXYtMC4wMUM0LDU3LjYyLDUuNDYsNTYuMSw3LjMxLDU2YzAuMDYtMC4wMSwwLjEyLTAuMDEsMC4xOC0wLjAxSDEzVjU2bDAsMGMzLjMxNCwwLDYtMi42ODYsNi02bDAsMGMwLTMuMzE0LTIuNjg2LTYtNi02SDQuODhDMi43MzcsNDQsMSw0Mi4yNjMsMSw0MC4xMnYtMC4yNEMxLDM3LjczNywyLjczNywzNiw0Ljg4LDM2SDE1YzEuOTQsMCwzLjY4LTAuNzgsNC45NS0yLjA1YzEuMjE5LTEuMjE5LDEuOTg3LTIuODczLDIuMDQ2LTQuNzJjMC4xMjYtMy45NzQtMy4zMTEtNy4yMy03LjI4Ny03LjIzSDYuNWMtMi42MzEsMC00LjczMy0yLjI2My00LjQ4LTQuOTQ0QzIuMjQsMTQuNzE3LDQuMzQxLDEzLDYuNjksMTNIMTVjMS4xMDUsMCwyLTAuODk1LDItMnYwYzAtMS4xMDUtMC44OTUtMi0yLTJoLTFjLTIuMzQyLDAtNC4yMjItMi4wMjMtMy45NzktNC40MDVDMTAuMjMzLDIuNTE2LDEyLjEwOSwxLDE0LjE5OCwxTDU3LDFjMi4zNDIsMCw0LjIyMiwyLjAyMywzLjk3OSw0LjQwNUM2MC43NjcsNy40ODQsNTguODkxLDksNTYuODAyLDlINTVjLTAuMTYsMC0wLjMyLDAuMDEtMC40NywwLjAzQzUwLjg4LDkuNDUsNTEuMzcsMTUsNTUuMDUsMTVoNC40NWMyLjYzLDAsNC43NCwyLjI2LDQuNDgsNC45NEM2My43NiwyMi4yOCw2MS42NiwyNCw1OS4zMSwyNEg1NC41Yy0xLjUyLDAtMi45LDAuNjItMy44OSwxLjYxYy0wLjk2MSwwLjk2MS0xLjU3NCwyLjI5MS0xLjYwOSwzLjc2Yy0wLjA3MywzLjA5NiwyLjY0Myw1LjYzLDUuNzQsNS42M2g1LjA3M2MyLjA5LDAsMy45NjEsMS41MjMsNC4xNjUsMy42MDNDNjQuMjE0LDQwLjk4Nyw2Mi4zNDIsNDMsNjAsNDNoLTguNUM0Ny45MSw0Myw0NSw0NS45MSw0NSw0OS41eiIgLz4NCiAgPGxpbmVhckdyYWRpZW50IGlkPSI3RGk0N3lGTzZFWnRsVkpnVlBqdHhjIiB4MT0iMzIiIHgyPSIzMiIgeTE9IjUyIiB5Mj0iOS41NzQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4NCiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxNTVjZGUiIC8+DQogICAgPHN0b3Agb2Zmc2V0PSIuMjc4IiBzdG9wLWNvbG9yPSIjMWY3ZmU1IiAvPg0KICAgIDxzdG9wIG9mZnNldD0iLjU2OSIgc3RvcC1jb2xvcj0iIzI3OWNlYiIgLz4NCiAgICA8c3RvcCBvZmZzZXQ9Ii44MiIgc3RvcC1jb2xvcj0iIzJjYWZlZiIgLz4NCiAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyZWI1ZjAiIC8+DQogIDwvbGluZWFyR3JhZGllbnQ+DQogIDxwYXRoIGZpbGw9InVybCgjN0RpNDd5Rk82RVp0bFZKZ1ZQanR4YykiIGQ9Ik0zMS42NTgsOWM2LjM5NSwwLDE2LjEyMSwyLjY4LDE2LjEyMSw4Ljg4NmMwLDIuNzM0LTIuMjIyLDUuMTE0LTQuOTU2LDUuMTE0IGMtNC44LDAtNC44MzMtNi0xMS40NDktNmMtMy43MDMsMC01LjM4LDIuMTQtNS4zOCw0LjEzM2MwLDIuMTA4LDAuNTk1LDMuNjQ2LDQuOTI1LDQuNTU3bDYuOTQ5LDEuNDgxIEM0Ni41ODIsMjkuMDUxLDUwLDMzLjQ5NCw1MCwzOS45MzFDNTAsNDcuMjIyLDQ1LjQ0Myw1NCwzMi4wNTcsNTRDMjMuNDg4LDU0LDE0LDUxLjU2MSwxNCw0NC45NDRjMC0yLjg0OCwyLjMzNi00LjcyOSw1LjE4My00LjcyOSBjNC44MzEsMCw1LjU4Miw0Ljc4NSwxMi40MTgsNC43ODVDMzYuMTU4LDQ1LDM5LDQzLjQwNSwzOSw0MC42NzFjMC0xLjk5NC0xLjQ3NS0zLjM2MS01LjU3Ni00LjIxNGwtNy4wMDYtMS40ODEgQzE4LjQ0MywzMy4yNjYsMTUsMjkuMjc4LDE1LDIyLjIxNUMxNSwxNC43NTMsMjAuNzIxLDksMzEuNjU4LDl6IiAvPg0KPC9zdmc+)
}
#{BTN_ID}.icon-disabled .toolbarbutton-icon {
  filter: grayscale(1);
}
#{BTN_ID}-popup .showFirstText > menuitem:first-child {
  -moz-box-flex: 1;
  -moz-box-pack: center;
  -moz-box-align: center;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
}
#{BTN_ID}-popup .showFirstText > menuitem:not(:first-child) > :is(.menu-iconic-text,.menu-iconic-highlightable-text,.menu-accel-container) {
  display: none;
}
#{BTN_ID}-popup .edit {
  list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIg0KCSB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPg0KPHBhdGggZD0iTTE5MC4zLDQ1LjJMOTgsMTM3LjVINjQuN3YtMzMuM0wxNTcsMTEuOWMxLjMtMS4zLDMtMS45LDQuNy0xLjljMS43LDAsMy40LDAuNiw0LjcsMS45bDIzLjksMjMuOWMxLjMsMS4zLDEuOSwzLDEuOSw0LjcNCglDMTkyLjIsNDIuMiwxOTEuNiw0My45LDE5MC4zLDQ1LjJ6IE0xNjEuNywyOS40bC04MC40LDgwLjR2MTEuMWgxMS4xbDgwLjQtODAuNEwxNjEuNywyOS40TDE2MS43LDI5LjR6IE0xMDAuNywzNy43SDMxLjR2MTMzaDEzMw0KCXYtNjkuM2MwLTQuNiwzLjctOC4zLDguMy04LjNjNC42LDAsOC4zLDMuNyw4LjMsOC4zdjc0LjhjMCw2LjEtNSwxMS4xLTExLjEsMTEuMUgyNS45Yy02LjEsMC0xMS4xLTUtMTEuMS0xMS4xVjMyLjINCgljMC02LjEsNS0xMS4xLDExLjEtMTEuMWg3NC44YzQuNiwwLDguMywzLjcsOC4zLDguM1MxMDUuMywzNy43LDEwMC43LDM3Ljd6Ii8+DQo8L3N2Zz4NCg==);
}
#{BTN_ID}-popup .delete {
  list-style-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNOCAuNUEyLjUgMi41IDAgMCAwIDUuNSAzSDFhLjUuNSAwIDAgMC0uNS41bC4wMDguMDlBLjUuNSAwIDAgMCAxIDRoLjU1M0wyLjg1IDE0LjIyOUEyIDIgMCAwIDAgNC44MzYgMTZoNi4zMjhhMiAyIDAgMCAwIDEuOTg2LTEuNzcxTDE0LjQ0NSA0SDE1YS41LjUgMCAwIDAgMC0xaC00LjVBMi41IDIuNSAwIDAgMCA4IC41em0wIDFBMS41IDEuNSAwIDAgMSA5LjUgM2gtM0ExLjUgMS41IDAgMCAxIDggMS41ek0yLjU2IDRoMTAuODc3bC0xLjI4IDEwLjExNmEuOTk4Ljk5OCAwIDAgMS0uOTkzLjg4NEg0LjgzNmEuOTk4Ljk5OCAwIDAgMS0uOTkyLS44ODR6TTYuNSA2LjVjLS4yNzYgMC0uNS4xOTYtLjUuNDM4djUuMTI0bC4wMDguMDc4Yy4wNDIuMjA0LjI0Ny4zNi40OTIuMzYuMjc2IDAgLjUtLjE5Ni41LS40MzhWNi45MzhsLS4wMDgtLjA3OUM2Ljk1IDYuNjU1IDYuNzQ1IDYuNSA2LjUgNi41em0zIDBjLS4yNzYgMC0uNS4xOTYtLjUuNDM4djUuMTI0bC4wMDguMDc4Yy4wNDIuMjA0LjI0Ny4zNi40OTIuMzYuMjc2IDAgLjUtLjE5Ni41LS40MzhWNi45MzhsLS4wMDgtLjA3OUM5Ljk1IDYuNjU1IDkuNzQ1IDYuNSA5LjUgNi41eiIvPgo8L3N2Zz4K);
}
#{BTN_ID}-popup .style-flag .menu-iconic-left{
  position: relative;
}
#{BTN_ID}-popup .style-flag .menu-iconic-icon {
  visibility: hidden;
}
#{BTN_ID}-popup .style-flag .menu-iconic-left:after {
  content: "AS";
  position: absolute;
  display: -moz-box;
  display: flex;
  color: var(--panel-disabled-color);
  font-weight: bold;
}
#{BTN_ID}-popup .style-flag[flag="AGENT_SHEET"] .menu-iconic-left:after {
  content: "AG";
  color: #2a9fa2;
}
#{BTN_ID}-popup .style-flag[flag="USER_SHEET"] .menu-iconic-left:after {
  content: "US";
  color: #5b89f6;
}
`);