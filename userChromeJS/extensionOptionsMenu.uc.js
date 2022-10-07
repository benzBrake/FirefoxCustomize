// ==UserScript==
// @name            Extension Options Menu
// @author          xiaoxiaoflood
// @include         main
// @shutdown        UC.extensionOptionsMenu.destroy();
// @onlyonce
// ==/UserScript==

// inspired by https://addons.mozilla.org/en-US/firefox/addon/extension-options-menu/
let { CustomizableUI } = window;
UC.extensionOptionsMenu = {
  // config
  showVersion: true,
  showHidden: false,
  showDisabled: true,
  enabledFirst: true,
  blackListArray: [],

  init: function () {
    CustomizableUI.createWidget({
      id: 'eom-button',
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      onBuild: function (doc) {
        let btn = _uc.createElement(doc, 'toolbarbutton', {
          id: 'eom-button',
          label: '拓展设置菜单',
          tooltiptext: '拓展设置菜单',
          type: 'menu',
          class: 'toolbarbutton-1 chromeclass-toolbar-additional',
        });

        let mp = _uc.createElement(doc, 'menupopup', {
          id: 'eom-button-popup',
          onclick: function () {
            event.preventDefault();
            event.stopPropagation();
          },
        });
        btn.appendChild(mp);

        mp.addEventListener('popupshowing', UC.extensionOptionsMenu.evalPopulateMenu);

        return btn;
      }
    });

    this.setStyle();
    _uc.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
  },

  evalPopulateMenu: function (e) {
    new e.view.Function('e', `
      AddonManager.getAddonsByTypes(['extension']).then(addons => UC.extensionOptionsMenu.populateMenu(e, addons));
    `).call(null, e);
  },

  populateMenu: function (e, addons) {
    let prevState;
    let popup = e.target;
    let doc = e.view.document;
    let enabledFirst = UC.extensionOptionsMenu.enabledFirst;
    let showVersion = UC.extensionOptionsMenu.showVersion;
    let showDisabled = UC.extensionOptionsMenu.showDisabled;
    let blackListArray = UC.extensionOptionsMenu.blackListArray;

    while (popup.hasChildNodes())
      popup.removeChild(popup.firstChild);

    addons.sort((a, b) => {
      let ka = (enabledFirst ? a.isActive ? '0' : '1' : '') + a.name.toLowerCase();
      let kb = (enabledFirst ? b.isActive ? '0' : '1' : '') + b.name.toLowerCase();
      return (ka < kb) ? -1 : 1;
    }).forEach(addon => {
      if (!blackListArray.includes(addon.id) &&
        (!addon.hidden || UC.extensionOptionsMenu.showHidden) &&
        (!addon.userDisabled || UC.extensionOptionsMenu.showDisabled)) {
        if (showDisabled && enabledFirst && prevState && addon.isActive != prevState)
          popup.appendChild(doc.createXULElement('menuseparator'));
        prevState = addon.isActive;

        let mi = _uc.createElement(doc, 'menuitem', {
          label: addon.name + (showVersion ? ' ' + addon.version : ''),
          class: 'menuitem-iconic',
          tooltiptext: addon.description + '\nID : ' + addon.id + '\n\n左键: 选项\n中键: 打开主页\n右击: 启用/禁用\nCtrl + 左键: 查看源文件\nCtrl + 中键: 复制 ID\nCtrl + 右键: 卸载',
          image: addon.iconURL || UC.extensionOptionsMenu.iconURL,
        });
        mi.addEventListener('click', UC.extensionOptionsMenu.handleClick);
        mi._Addon = addon;
        mi.setAttribute('context', '');

        UC.extensionOptionsMenu.setDisable(mi, addon, 0);

        popup.appendChild(mi);
      }
    });
  },

  handleClick: function (e) {
    e.preventDefault();
    e.stopPropagation();
    let win = e.view;
    let mi = e.target;
    if (!('_Addon' in mi)) {
      return;
    }

    let addon = mi._Addon;
    let hasMdf = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;

    switch (e.button) {
      case 0:
        if (addon.optionsURL && !hasMdf)
          UC.extensionOptionsMenu.openAddonOptions(addon, win);
        else if (e.ctrlKey)
          UC.extensionOptionsMenu.browseDir(addon);
        break;
      case 1:
        if (addon.homepageURL && !hasMdf) {
          openURL(addon.homepageURL);
          closeMenus(mi);
        } else if (e.ctrlKey) {
          Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(addon.id);
          closeMenus(mi);
        }
        break;
      case 2:
        if (!hasMdf) {
          if (addon.userDisabled)
            addon.enable();
          else
            addon.disable();
          UC.extensionOptionsMenu.setDisable(mi, addon, 1);
        } else if (e.ctrlKey) {
          if (Services.prompt.confirm(null, null, '是否永久卸载 ' + addon.name + ' ?')) {
            if (addon.pendingOperations & AddonManager.PENDING_UNINSTALL)
              addon.cancelUninstall();
            else {
              addon.uninstall();
              return;
            }
            cls.remove('enabling');
            cls.remove('disabling');
            cls.add('uninstalling');
            cls.add('disabled');
          }
        }
    }
  },

  setDisable: function (mi, addon, toggling) {
    let cls = mi.classList;

    if (addon.operationsRequiringRestart) {
      if (toggling)
        if (addon.userDisabled)
          if (addon.isActive)
            cls.add('disabling');
          else
            cls.remove('enabling');
        else
          if (addon.isActive)
            cls.remove('disabling');
          else
            cls.add('enabling');
      else if (addon.userDisabled && addon.isActive)
        cls.add('disabling');
      else if (!addon.userDisabled && !addon.isActive)
        cls.add('enabling');
    } else {
      if (toggling) {
        if (addon.isActive) {
          if (addon.optionsURL)
            cls.remove('noOptions');
          cls.remove('disabled');
          cls.remove('disabling');
          cls.add('enabling');
        } else {
          cls.remove('enabling');
          cls.add('disabling');
        }
      }
    }

    if (!addon.isActive)
      cls.add('disabled');

    if (!addon.optionsURL)
      cls.add('noOptions');
  },

  openAddonOptions: function (addon, win) {
    if (!addon.isActive || !addon.optionsURL)
      return;

    switch (Number(addon.optionsType)) {
      case 5:
        win.BrowserOpenAddonsMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
        break;
      case 3:
        win.switchToTabHavingURI(addon.optionsURL, true);
        break;
      case 1:
        var windows = Services.wm.getEnumerator(null);
        while (windows.hasMoreElements()) {
          var win2 = windows.getNext();
          if (win2.closed) {
            continue;
          }
          if (win2.document.documentURI == addon.optionsURL) {
            win2.focus();
            return;
          }
        }
        win.openDialog(addon.optionsURL, addon.id, 'chrome,titlebar,toolbar,centerscreen');
    }
  },

  browseDir: function (addon) {
    let dir = Services.dirsvc.get('ProfD', Ci.nsIFile);
    dir.append('extensions');
    dir.append(addon.id + '.xpi');
    dir.launch();
  },

  iconURL: 'chrome://global/skin/icons/plugin.svg',

  setStyle: function () {
    this.STYLE = {
      url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
        @-moz-document url('${_uc.BROWSERCHROME}') {
          .enabling label:after { content: "+" !important; }
          .disabling label:after { content: "-" !important; }
          .uninstalling label:after { content: '!' !important; }
          .noOptions { color: gray; }
          .disabled { color: gray; font-style: italic; }
          #eom-button { list-style-image: url("chrome://mozapps/skin/extensions/extension.svg"); }
        }
      `)),
      type: _uc.sss.USER_SHEET
    }
  },

  destroy: function () {
    CustomizableUI.destroyWidget('eom-button');
    _uc.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
    delete UC.extensionOptionsMenu;
  }
}

UC.extensionOptionsMenu.init();