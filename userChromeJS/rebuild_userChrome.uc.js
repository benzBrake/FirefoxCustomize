// ==UserScript==
// @name            userChromeJS Manager
// @include         main
// @author          xiaoxiaoflood
// @onlyonce
// ==/UserScript==

// original: https://github.com/alice0775/userChrome.js/blob/master/rebuild_userChrome.uc.xul

UC.rebuild = {
  PREF_TOOLSBUTTON: 'userChromeJS.showtoolbutton',

  menues: [],

  onpopup: function (event) {
    let document = event.target.ownerDocument;

    if (event.target != document.getElementById('userChromejs_options'))
      return;

    while (document.getElementById('uc-menuseparator').nextSibling) {
      document.getElementById('uc-menuseparator').nextSibling.remove();
    }

    let enabled = xPref.get(_uc.PREF_ENABLED);

    let mi = event.target.appendChild(this.elBuilder(document, 'menuitem', {
      label: enabled ? '已启用' : '已禁用 (点击启用)',
      oncommand: 'xPref.set(_uc.PREF_ENABLED, ' + !enabled + ');',
      type: 'checkbox',
      checked: enabled
    }));

    if (Object.keys(_uc.scripts).length > 1)
      event.target.appendChild(this.elBuilder(document, 'menuseparator'));

    Object.values(_uc.scripts).forEach(script => {
      if (script.filename === _uc.ALWAYSEXECUTE) {
        return;
      }

      mi = event.target.appendChild(this.elBuilder(document, 'menuitem', {
        label: script.description ? script.description : (script.name ? script.name : script.filename),
        onclick: 'UC.rebuild.clickScriptMenu(event)',
        onmouseup: 'UC.rebuild.shouldPreventHide(event)',
        type: 'checkbox',
        checked: script.isEnabled,
        class: 'userChromejs_script',
        restartless: !!script.shutdown
      }));
      mi.filename = script.filename;
      let homepage = script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
      if (homepage)
        mi.setAttribute('homeURL', homepage);
      mi.setAttribute('tooltiptext', `
        左键: 启用/禁用
        中键: 启用/禁用 并保持菜单打开
        右键: 修改
        Ctrl + 左键: 重载脚本
        Ctrl + 中键: 打开主页
        Ctrl + 右键: 卸载
      `.replace(/^\n| {2,}/g, '') + (script.description ? '\n简介: ' + script.description : '')
                                  + (homepage ? '\n主页: ' + homepage : ''));

      event.target.appendChild(mi);
    });

    document.getElementById('showToolsMenu').setAttribute('label', '切换到 ' + (this.showToolButton ? '导航栏按钮' : '工具菜单'));
  },

  onHamPopup: function (aEvent) {
    const enabledMenuItem = aEvent.target.querySelector('#appMenu-userChromeJS-enabled');
    enabledMenuItem.checked = xPref.get(_uc.PREF_ENABLED);

    // Clear existing scripts menu entries
    const scriptsSeparator = aEvent.target.querySelector('#appMenu-userChromeJS-scriptsSeparator');
    while (scriptsSeparator.nextSibling) {
      scriptsSeparator.nextSibling.remove();
    }

    // Populate with new entries
    let scriptMenuItems = [];
    Object.values(_uc.scripts).forEach(script => {
      if (_uc.ALWAYSEXECUTE.includes(script.filename))
        return;

      let scriptMenuItem = UC.rebuild.createMenuItem(scriptsSeparator.ownerDocument, null, null, script.name ? script.name : script.filename);
      scriptMenuItem.setAttribute('onclick', 'UC.rebuild.clickScriptMenu(event)');
      scriptMenuItem.type = 'checkbox';
      scriptMenuItem.checked = script.isEnabled;
      scriptMenuItem.setAttribute('restartless', !!script.shutdown);
      scriptMenuItem.filename = script.filename;
      let homepage = script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
      if (homepage)
        scriptMenuItem.setAttribute('homeURL', homepage);
      scriptMenuItem.setAttribute('tooltiptext', `
        左键: 启用/禁用
        中键: 启用/禁用 并保持菜单打开
        右键: 修改
        Ctrl + 左键: 重载脚本
        Ctrl + 中键: 打开主页
        Ctrl + 右键: 卸载
      `.replace(/^\n| {2,}/g, '') + (script.description ? '\n简介: ' + script.description : '')
                                  + (homepage ? '\n主页: ' + homepage : ''));      
      scriptMenuItems.push(scriptMenuItem);
    });

    scriptsSeparator.parentElement.append(...scriptMenuItems);
	},

  clickScriptMenu: function (event) {
    const { button, ctrlKey, target } = event;
    const script = _uc.scripts[target.filename];
    switch (button) {
      case 0:
        this.toggleScript(script);
        if (ctrlKey)
          this.toggleScript(script);
        closeMenus(target);
        break;
      case 1:
        if (ctrlKey) {
          let url = target.getAttribute('homeURL');
          if (url) {
            gBrowser.addTab(url, { triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) });
          }
          closeMenus(target);
        } else {
          this.toggleScript(script);
          if (target.tagName === 'toolbarbutton')
            target.setAttribute('checked', script.isEnabled);
        }
        break;
      case 2:
        if (ctrlKey)
          this.uninstall(script);
        else
          this.launchEditor(script);
        closeMenus(target);
    }
  },

  shouldPreventHide: function (event) {
    if (event.button == 1 && !event.ctrlKey) {
      const menuitem = event.target;
      menuitem.setAttribute('closemenu', 'none');
      menuitem.parentNode.addEventListener('popuphidden', () => {
        menuitem.removeAttribute('closemenu');
      }, { once: true });
    }
  },

  launchEditor: function (script) {
    let editor = xPref.get('view_source.editor.path');
    if (!editor) {
      editor = prompt('编辑器未设置。 请填入编辑器完整路径', 'C:\\WINDOWS\\system32\\notepad.exe');
      if (editor)
        xPref.set('view_source.editor.path', editor);
    }
    try {
      let appfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
      appfile.initWithPath(editor);
      let process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
      process.init(appfile);
      process.run(false, [script.file.path], 1, {});
    } catch {
      alert('无法打开编辑器。 请打开 about:config 页面并设置 view_source.editor.path 的值为浏览器路径。');
    }
  },

  restart: function () {
    Services.appinfo.invalidateCachesOnRestart();

    let cancelQuit = Cc['@mozilla.org/supports-PRBool;1'].createInstance(Ci.nsISupportsPRBool);
    Services.obs.notifyObservers(cancelQuit, 'quit-application-requested', 'restart');

    if (cancelQuit.data)
      return;

    if (Services.appinfo.inSafeMode)
      Services.startup.restartInSafeMode(Ci.nsIAppStartup.eAttemptQuit);
    else
      Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
  },

  toggleScript: function (script) {
    if (script.isEnabled) {
      xPref.set(_uc.PREF_SCRIPTSDISABLED, script.filename + ',' + xPref.get(_uc.PREF_SCRIPTSDISABLED));
    } else {
      xPref.set(_uc.PREF_SCRIPTSDISABLED, xPref.get(_uc.PREF_SCRIPTSDISABLED).replace(new RegExp('^' + script.filename + ',|,' + script.filename), ''));
    }

    if (script.isEnabled && !_uc.everLoaded.includes(script.id)) {
      this.install(script);
    } else if (script.isRunning && !!script.shutdown) {
      this.shutdown(script);
    }
  },

  toggleUI: function (byaboutconfig = false, startup = false) {
    this.showToolButton = xPref.get(this.PREF_TOOLSBUTTON);
    if (!byaboutconfig && !startup) {
      this.showToolButton = xPref.set(this.PREF_TOOLSBUTTON, !this.showToolButton);
    }

    _uc.windows((doc) => {
      doc.getElementById('userChromebtnMenu').hidden = this.showToolButton;
      doc.getElementById('userChromejs_Tools_Menu').hidden = !this.showToolButton;
      if (this.showToolButton) {
        doc.getElementById('userChromejs_Tools_Menu').appendChild(doc.getElementById('userChromejs_options'));
      } else if (!startup) {
        doc.getElementById('userChromebtnMenu').appendChild(doc.getElementById('userChromejs_options'));
      }
    });
  },

  createMenuItem: function (doc, id, icon, label, command) {
    const menuItem = doc.createXULElement('toolbarbutton');
    menuItem.className = 'subviewbutton subviewbutton-iconic';
    if (id)
      menuItem.id = 'appMenu-userChromeJS-' + id;
    menuItem.label = label;
    menuItem.style.listStyleImage = icon;
    if (command)
      menuItem.setAttribute('oncommand', command);
    return menuItem;
  },

  install: function (script) {
    script = _uc.getScriptData(script.file);
    Services.obs.notifyObservers(null, 'startupcache-invalidate');
    _uc.windows((doc, win, loc) => {
      if (win._uc && script.regex.test(loc.href)) {
        _uc.loadScript(script, win);
      }
    }, false);
  },

  uninstall: function(script) {
    if (!confirm('确认卸载此脚本? 脚本文件将被删除。'))
      return;

    this.shutdown(script);
    script.file.remove(false);
    xPref.set(_uc.PREF_SCRIPTSDISABLED, xPref.get(_uc.PREF_SCRIPTSDISABLED).replace(new RegExp('^' + script.filename + ',|,' + script.filename), ''));
  },

  shutdown: function (script) {
    if (script.shutdown) {
      _uc.windows((doc, win, loc) => {
        if (script.regex.test(loc.href)) {
          try {
            eval(script.shutdown);
          } catch (ex) {
            Cu.reportError(ex);
          }
          if (script.onlyonce)
            return true;
        }
      }, false);
      script.isRunning = false;
    }
  },
  
  elBuilder: function (doc, tag, props) {
    let el = doc.createXULElement(tag);
    for (let p in props) {
      el.setAttribute(p, props[p]);
    }
    return el;
  },

  init: function () {
    this.showToolButton = xPref.get(this.PREF_TOOLSBUTTON);
    if (this.showToolButton === undefined) {
      this.showToolButton = xPref.set(this.PREF_TOOLSBUTTON, false, true);
    }

    xPref.addListener(this.PREF_TOOLSBUTTON, function (value, prefPath) {
      UC.rebuild.toggleUI(true);
    });

    xPref.addListener(_uc.PREF_ENABLED, function (value, prefPath) {
      Object.values(_uc.scripts).forEach(script => {
        if (script.filename == _uc.ALWAYSEXECUTE)
          return;
        if (value && script.isEnabled && !_uc.everLoaded.includes(script.id)) {
          UC.rebuild.install(script);
        } else if (!value && script.isRunning && !!script.shutdown) {
          UC.rebuild.shutdown(script);
        }
      });
    });

    if (AppConstants.MOZ_APP_NAME !== 'thunderbird') {
      CustomizableUI.createWidget({
        id: 'userChromebtnMenu',
        type: 'custom',
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: (doc) => {
          return this.createButton(doc);
        }
      });
    } else {
      const btn = this.createButton(document);
      btn.setAttribute('removable', true);
      const toolbar = document.querySelector('toolbar[customizable=true].chromeclass-toolbar');
      if (toolbar.parentElement.palette)
        toolbar.parentElement.palette.appendChild(btn);
      else
        toolbar.appendChild(btn);

      if (xPref.get('userChromeJS.firstRun') !== false) {
        xPref.set('userChromeJS.firstRun', false);
        if (!toolbar.getAttribute('currentset').split(',').includes(btn.id)) {
          toolbar.appendChild(btn);
          toolbar.setAttribute('currentset', toolbar.currentSet);
          Services.xulStore.persist(toolbar, 'currentset');
        }
      } else {
        toolbar.currentSet = Services.xulStore.getValue(location.href, toolbar.id, 'currentset');
        toolbar.setAttribute('currentset', toolbar.currentSet);
      }
    }
  },

  createButton (aDocument) {
    let toolbaritem = UC.rebuild.elBuilder(aDocument, 'toolbarbutton', {
      id: 'userChromebtnMenu',
      label: 'userChromeJS',
      tooltiptext: 'userChromeJS 管理器',
      type: 'menu',
      class: 'toolbarbutton-1 chromeclass-toolbar-additional',
      style: 'list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDggNDgiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTMzLjUwOTc2NiAxQzMyLjE0NjgyMSAxIDMxLjAwOTc2NiAyLjEzNzA1NTEgMzEuMDA5NzY2IDMuNUwzMS4wMDk3NjYgNS4wNjQ0NTMxTDI5LjY1ODIwMyA0LjI3OTI5NjlMMjkuNjU0Mjk3IDQuMjc3MzQzOEMyOC40Mjc0MTMgMy41NzYzNDE1IDI2LjgxMzA5NiA0LjA2NTAyNSAyNi4xNzk2ODggNS4zMjgxMjVMMjYuMjMyNDIyIDUuMjMyNDIxOUwyNC43MDcwMzEgNy43ODkwNjI1TDI0LjcwMTE3MiA3Ljc5ODgyODFDMjQuMDE0ODI1IDguOTgzNjY1MiAyNC40Mzc0MDQgMTAuNTQ0NDU2IDI1LjYyNjk1MyAxMS4yMjI2NTZMMjYuOTgyNDIyIDEyTDI1LjYyNjk1MyAxMi43NzczNDRDMjQuNDM3NDA0IDEzLjQ1NTU0NCAyNC4wMTQ3OCAxNS4wMTYzMyAyNC43MDExNzIgMTYuMjAxMTcyTDI2LjE5NzI2NiAxOC43OTI5NjlDMjYuODc1NDY2IDE5Ljk4MjUxOCAyOC40MzYyNTIgMjAuNDA1MTQyIDI5LjYyMTA5NCAxOS43MTg3NUwyOS42MjMwNDcgMTkuNzE2Nzk3TDMwLjk3MDcwMyAxOC45MzU1NDdMMzAuOTcwNzAzIDIwLjVDMzAuOTcwNzAzIDIxLjg2Mjk0NSAzMi4xMDc3NTggMjMgMzMuNDcwNzAzIDIzTDM2LjQ3MDcwMyAyM0MzNy44MzM2NDggMjMgMzguOTcwNzAzIDIxLjg2Mjk0NSAzOC45NzA3MDMgMjAuNUwzOC45NzA3MDMgMTguOTM1NTQ3TDQwLjMxODM1OSAxOS43MTY3OTdMNDAuMzE4MzU5IDE5LjcxODc1QzQxLjUwMzIwMSAyMC40MDUxNDIgNDMuMDYzOTg2IDE5Ljk4MjUxOCA0My43NDIxODggMTguNzkyOTY5TDQ1LjIzODI4MSAxNi4yMDExNzJDNDUuOTI0NjI2IDE1LjAxNjI4MyA0NS41MDIwNDkgMTMuNDU1NTQ0IDQ0LjMxMjUgMTIuNzc3MzQ0TDQzLjAyMTQ4NCAxMi4wMDM5MDZMNDQuMzkwNjI1IDExLjIxODc1TDQ0LjM5NDUzMSAxMS4yMTY3OTdDNDUuNTc1MjcgMTAuNTMwMDM0IDQ1Ljk4NTUxOCA4Ljk2OTUxNiA0NS4yOTQ5MjIgNy43OTEwMTU2TDQ1LjI5MTAxNiA3Ljc4NzEwOTRMNDMuNzgzMjAzIDUuMjU3ODEyNUM0My4xMDUwMDMgNC4wNjgzMTM4IDQxLjU0MjI2MyAzLjY0NTYzOTEgNDAuMzU3NDIyIDQuMzMyMDMxMkwzOS4wMDk3NjYgNS4xMTUyMzQ0TDM5LjAwOTc2NiAzLjVDMzkuMDA5NzY2IDIuMTM3MDU1MSAzNy44NzI3MTEgMSAzNi41MDk3NjYgMUwzMy41MDk3NjYgMSB6IE0gMzQuMDA5NzY2IDRMMzYuMDA5NzY2IDRMMzYuMDA5NzY2IDUuMzk4NDM3NUMzNi4wMDIyNjYgNi4zMDY2NDYxIDM2LjQ5MzQwNiA3LjE1MjY1IDM3LjI4NTE1NiA3LjU5NzY1NjJDMzcuNDQ1MTU2IDcuNjg3NjU2MiAzNy41NzIyMDcgNy43NjEwMjg2IDM3LjY1ODIwMyA3LjgxODM1OTRMMzcuNjk3MjY2IDcuODQ1NzAzMUwzNy43NDAyMzQgNy44NjkxNDA2QzM4LjUxMTY1NSA4LjMxNDUyMDIgMzkuNDY4ODE0IDguMzE0NTIwMiA0MC4yNDAyMzQgNy44NjkxNDA2TDQwLjI0MjE4OCA3Ljg2OTE0MDZMNDEuNDMzNTk0IDcuMTc3NzM0NEw0Mi40NDcyNjYgOC44NzVMNDEuMjUxOTUzIDkuNTYwNTQ2OUw0MS4yNSA5LjU2MDU0NjlDNDAuNDY3ODA4IDEwLjAxMjAyOSAzOS45ODc0MjkgMTAuODU4NjY3IDQwIDExLjc2MTcxOUw0MCAxMi4yMzgyODFDMzkuOTg3NDMgMTMuMTQxMzMzIDQwLjQ2NzgwOCAxMy45ODc5NzEgNDEuMjUgMTQuNDM5NDUzTDQyLjM5NDUzMSAxNS4xMjVMNDEuMzg4NjcyIDE2Ljg3MTA5NEw0MC4yMDExNzIgMTYuMTgxNjQxTDQwLjE5OTIxOSAxNi4xODE2NDFDMzkuNDI3Nzk5IDE1LjczNjI2MSAzOC40NzA2MzkgMTUuNzM2MjYxIDM3LjY5OTIxOSAxNi4xODE2NDFMMzcuNjU4MjAzIDE2LjIwNTA3OEwzNy42MTcxODggMTYuMjMyNDIyQzM3LjUzMTE4OCAxNi4yODk3NTIgMzcuNDA0MTQxIDE2LjM2MzEyNSAzNy4yNDQxNDEgMTYuNDUzMTI1QzM2LjQ1MjM5IDE2Ljg5ODEzMSAzNS45NjMyMDMgMTcuNzQ0MTM1IDM1Ljk3MDcwMyAxOC42NTIzNDRMMzUuOTcwNzAzIDIwTDMzLjk3MDcwMyAyMEwzMy45NzA3MDMgMTguNjUyMzQ0QzMzLjk3ODIwMyAxNy43NDQxMzUgMzMuNDg3MDY0IDE2Ljg5ODEzMSAzMi42OTUzMTIgMTYuNDUzMTI1QzMyLjUzNTMxNCAxNi4zNjMxMjUgMzIuNDA4MjYyIDE2LjI4OTc1MyAzMi4zMjIyNjYgMTYuMjMyNDIyTDMyLjI4MTI1IDE2LjIwNTA3OEwzMi4yNDAyMzQgMTYuMTgxNjQxQzMxLjQ2ODgxNCAxNS43MzYyNjEgMzAuNTExNjU1IDE1LjczNjI2MSAyOS43NDAyMzQgMTYuMTgxNjQxTDI5LjczODI4MSAxNi4xODE2NDFMMjguNTUwNzgxIDE2Ljg3MTA5NEwyNy41NDg4MjggMTUuMTMyODEyTDI4Ljc1NzgxMiAxNC40Mzk0NTNMMjguNzU5NzY2IDE0LjQzOTQ1M0MyOS41NDE5NTggMTMuOTg3OTcxIDMwLjAyMjMzNiAxMy4xNDEzMzMgMzAuMDA5NzY2IDEyLjIzODI4MUwzMC4wMDk3NjYgMTEuNzYxNzE5QzMwLjAyMjMzNiAxMC44NTg2NjcgMjkuNTQxOTU4IDEwLjAxMjAyOSAyOC43NTk3NjYgOS41NjA1NDY5TDI4Ljc1NzgxMiA5LjU2MDU0NjlMMjcuNTU2NjQxIDguODcxMDkzOEwyOC41OTE3OTcgNy4xMjg5MDYyTDI5Ljc3OTI5NyA3LjgxODM1OTRDMzAuNTUwNzE3IDguMjYzNzM5IDMxLjUwNzg3NyA4LjI2MzczOSAzMi4yNzkyOTcgNy44MTgzNTk0TDMyLjMyMjI2NiA3Ljc5NDkyMTlMMzIuMzYxMzI4IDcuNzY3NTc4MUMzMi40NDY5ODggNy43MTA0NjkxIDMyLjU3NTI0NiA3LjYzNjM5ODggMzIuNzM0Mzc1IDcuNTQ2ODc1QzMzLjUyNjEyNSA3LjEwMTg2ODYgMzQuMDE3MjY2IDYuMjU1ODY0OSAzNC4wMDk3NjYgNS4zNDc2NTYyTDM0LjAwOTc2NiA0IHogTSAzMC43NzkyOTcgNS4yMjA3MDMxQzMwLjc4MDQ5NyA1LjIyMDAxNDcgMzAuNzgyMDAzIDUuMjIxMzgwOCAzMC43ODMyMDMgNS4yMjA3MDMxQzMwLjc1MTgzMyA1LjI0MDcxMjEgMzAuNzI5NjU2IDUuMjQ5ODkyNCAzMC42OTcyNjYgNS4yNzE0ODQ0TDMwLjc3OTI5NyA1LjIyMDcwMzEgeiBNIDM0Ljg3NSA5LjAwMTk1MzEgQSAzIDMgMCAwIDAgMzUgMTUgQSAzIDMgMCAwIDAgMzggMTIgQSAzIDMgMCAwIDAgMzQuODc1IDkuMDAxOTUzMSB6IE0gMTQuNSAxN0MxMy4xMzcwNTUgMTcgMTIgMTguMTM3MDU1IDEyIDE5LjVMMTIgMjAuMDgwMDc4QzEyLjAwMDM0NSAyMC42MTc3NzUgMTEuNzE2OTY1IDIxLjEwOTI2OCAxMS4yNTE5NTMgMjEuMzc4OTA2TDExLjI1IDIxLjM3ODkwNkMxMS4yNSAyMS4zNzg5MDYgMTEuMjUgMjEuMzgwODU5IDExLjI1IDIxLjM4MDg1OUw5LjE4MTY0MDYgMjIuNTcwMzEyTDkuMTc5Njg3NSAyMi41NzAzMTJDOC43MTM1MDMzIDIyLjgzOTQ2NCA4LjE0NTg3MTcgMjIuODM5NDY1IDcuNjc5Njg3NSAyMi41NzAzMTJMNy42NzU3ODEyIDIyLjU2ODM1OUw3LjE0NDUzMTIgMjIuMjY3NTc4TDcuMTI4OTA2MiAyMi4yNTc4MTJDNS45MTczMDI4IDIxLjYwNzkwNCA0LjM2MjY1MjYgMjIuMDg4NjQzIDMuNzI4NTE1NiAyMy4zMDg1OTRMMy43NTk3NjU2IDIzLjI1TDIuMjY1NjI1IDI1Ljg0MTc5N0MxLjU3NTAyODUgMjcuMDIwMjk3IDEuOTg1Mjc3IDI4LjU4MDgxNSAzLjE2NjAxNTYgMjkuMjY3NTc4TDMuMTc1NzgxMiAyOS4yNzM0MzhMMy42Njk5MjE5IDI5LjU0ODgyOEM0LjEzNjQxMDEgMjkuODE4MTU1IDQuNDIwMjY3MiAzMC4zMTA5NTUgNC40MTk5MjE5IDMwLjg0OTYwOUw0LjQxOTkyMTkgMzMuMjVDNC40MjAyNjcyIDMzLjc4ODY1NCA0LjEzNjQxMDEgMzQuMjgxNDU0IDMuNjY5OTIxOSAzNC41NTA3ODFMMy4xNzU3ODEyIDM0LjgyODEyNUwzLjE2NjAxNTYgMzQuODMzOTg0QzEuOTg1Mjc3IDM1LjUyMDcwNiAxLjU3NTAyODUgMzcuMDc5MzEzIDIuMjY1NjI1IDM4LjI1NzgxMkwzLjc1OTc2NTYgNDAuODQ5NjA5QzQuNDM3NTk1OCA0Mi4wMjQ4ODEgNS45ODAzMzU3IDQyLjQ0MzMxOSA3LjE2MDE1NjIgNDEuNzczNDM4TDcuNjc1NzgxMiA0MS40ODI0MjJMNy42Nzk2ODc1IDQxLjQ3ODUxNkM4LjE0NTg3MTcgNDEuMjA5MzY0IDguNzEzNTAzMyA0MS4yMDkzNjQgOS4xNzk2ODc1IDQxLjQ3ODUxNkw5LjE5MzM1OTQgNDEuNDg2MzI4TDExLjI1IDQyLjYxOTE0MUMxMS43MTY0ODggNDIuODg4NDY4IDEyLjAwMDM0NSA0My4zODEyNjggMTIgNDMuOTE5OTIyTDEyIDQ0LjVDMTIgNDUuODYyOTQ1IDEzLjEzNzA1NSA0NyAxNC41IDQ3TDE3LjUgNDdDMTguODYyOTQ1IDQ3IDIwIDQ1Ljg2Mjk0NSAyMCA0NC41TDIwIDQzLjkxOTkyMkMxOS45OTk2NTUgNDMuMzgxMjY4IDIwLjI4MzUxMiA0Mi44ODg0NjggMjAuNzUgNDIuNjE5MTQxTDIyLjgxODM1OSA0MS40Mjk2ODhMMjIuODIwMzEyIDQxLjQyOTY4OEMyMy4yODY0OTcgNDEuMTYwNTM2IDIzLjg1NDEyOCA0MS4xNjA1MzYgMjQuMzIwMzEyIDQxLjQyOTY4OEwyNC4zMjQyMTkgNDEuNDMxNjQxTDI0LjgzOTg0NCA0MS43MjQ2MDlDMjYuMDE5NjY0IDQyLjM5NDQ5MSAyNy41NjI0MDQgNDEuOTc0MSAyOC4yNDAyMzQgNDAuNzk4ODI4TDI5LjE4NzUgMzkuMTU0Mjk3TDI5LjE4OTQ1MyAzOS4xNDg0MzhDMzAuMTc0MzQ5IDM3LjQ0ODMyNiAyOS41ODM1ODggMzUuMjI3MDYxIDI3Ljg4MjgxMiAzNC4yNDIxODhDMjcuNjkzMjU1IDM0LjEzMjA1MyAyNy41ODA1MzcgMzMuOTM2MDI2IDI3LjU4MDA3OCAzMy43MTY3OTdMMjcuNTgwMDc4IDMwLjI4MzIwM0MyNy41ODA1MzcgMzAuMDYzOTc0IDI3LjY5MzI1NSAyOS44Njc5NDcgMjcuODgyODEyIDI5Ljc1NzgxMkMyOS41ODU0MzggMjguNzcxODY3IDMwLjE3NjkgMjYuNTQ2NTI3IDI5LjE4NzUgMjQuODQ1NzAzTDI5LjE4MzU5NCAyNC44Mzk4NDRMMjguMjQwMjM0IDIzLjI1QzI3LjU2MjQwNCAyMi4wNzQ3MjggMjYuMDE5NjY0IDIxLjY1NjI5IDI0LjgzOTg0NCAyMi4zMjYxNzJMMjQuMzI0MjE5IDIyLjYxOTE0MUwyNC4zMjAzMTIgMjIuNjIxMDk0QzIzLjg1NDczNiAyMi44ODk4OTUgMjMuMjg4MTA2IDIyLjg4OTE5NSAyMi44MjIyNjYgMjIuNjIxMDk0TDIyLjgyMDMxMiAyMi42MjEwOTRMMjAuNzU5NzY2IDIxLjM4NjcxOUwyMC43NSAyMS4zODA4NTlDMjAuMjgzNTEyIDIxLjExMTUzMiAxOS45OTk2NTUgMjAuNjE4NzMyIDIwIDIwLjA4MDA3OEwyMCAxOS41QzIwIDE4LjEzNzA1NSAxOC44NjI5NDUgMTcgMTcuNSAxN0wxNC41IDE3IHogTSAzMC42NTgyMDMgMTguNzI4NTE2QzMwLjY5MDU5MyAxOC43NTAxMDYgMzAuNzEyNzcxIDE4Ljc1OTI4NyAzMC43NDQxNDEgMTguNzc5Mjk3QzMwLjc0Mjk0MSAxOC43Nzg2MTkgMzAuNzQxNDM0IDE4Ljc3OTk4NSAzMC43NDAyMzQgMTguNzc5Mjk3TDMwLjY1ODIwMyAxOC43Mjg1MTYgeiBNIDM5LjI4MTI1IDE4LjcyODUxNkwzOS4xOTkyMTkgMTguNzc5Mjk3QzM5LjE5ODAxOSAxOC43Nzk5ODUgMzkuMTk2NTEyIDE4Ljc3ODYxOSAzOS4xOTUzMTIgMTguNzc5Mjk3QzM5LjIyNjY4MyAxOC43NTkyODcgMzkuMjQ4ODYgMTguNzUwMTA2IDM5LjI4MTI1IDE4LjcyODUxNiB6IE0gMTUgMjBMMTcgMjBMMTcgMjAuMDc4MTI1QzE2Ljk5OSAyMS42ODQ0MzkgMTcuODU4ODkxIDIzLjE3NTM1OSAxOS4yNSAyMy45Nzg1MTZMMjEuMzA4NTk0IDI1LjIxMjg5MUwyMS4zMjAzMTIgMjUuMjE4NzVDMjIuNzEwNTM1IDI2LjAyMTM5NSAyNC40MzAwOSAyNi4wMjEzOTUgMjUuODIwMzEyIDI1LjIxODc1TDI1Ljg5NDUzMSAyNS4xNzc3MzRMMjYuNTkzNzUgMjYuMzU1NDY5QzI2Ljc2NTMwMiAyNi42NTI1ODYgMjYuNjc2MjYgMjYuOTkwMDg5IDI2LjM3ODkwNiAyNy4xNjIxMDlMMjYuMzc2OTUzIDI3LjE2MjEwOUMyNS4yNjkyMDEgMjcuODA1NzE3IDI0LjU4Mjc2MiAyOC45OTYxOTcgMjQuNTgwMDc4IDMwLjI3NzM0NEwyNC41ODAwNzggMzAuMjc5Mjk3TDI0LjU4MDA3OCAzMy43MjA3MDNMMjQuNTgwMDc4IDMzLjcyMjY1NkMyNC41ODI3NzggMzUuMDAzODAzIDI1LjI2OTIwMSAzNi4xOTQyODMgMjYuMzc2OTUzIDM2LjgzNzg5MUwyNi4zNzg5MDYgMzYuODM3ODkxQzI2LjY3NjkzMiAzNy4wMTAzIDI2Ljc2Njg3NSAzNy4zNDg4NzQgMjYuNTkzNzUgMzcuNjQ2NDg0TDI2LjU5MTc5NyAzNy42NDg0MzhMMjUuODg4NjcyIDM4Ljg3MTA5NEwyNS44MTQ0NTMgMzguODI4MTI1QzI0LjQyNTIwMSAzOC4wMjg2NjQgMjIuNzA4Njk2IDM4LjAyODQ0OCAyMS4zMjAzMTIgMzguODMwMDc4TDE5LjI1MTk1MyA0MC4wMTk1MzFMMTkuMjUgNDAuMDIxNDg0QzE3Ljg1OTU0NiA0MC44MjQwNDEgMTYuOTk5NjY3IDQyLjMxNDM1MiAxNyA0My45MTk5MjJMMTcgNDRMMTUgNDRMMTUgNDMuOTIxODc1TDE1IDQzLjkxOTkyMkMxNS4wMDAzMzMgNDIuMzE0MzUyIDE0LjE0MDU0NiA0MC44MjQzMTYgMTIuNzUgNDAuMDIxNDg0TDEyLjczNjMyOCA0MC4wMTM2NzJMMTAuNjU0Mjk3IDM4Ljg2NTIzNEwxMC42Nzk2ODggMzguODgwODU5QzkuMjkxMzA0NyAzOC4wNzkyNzYgNy41NzQ3OTg2IDM4LjA3OTQ5MiA2LjE4NTU0NjkgMzguODc4OTA2TDYuMTExMzI4MSAzOC45MTk5MjJMNS4xMDkzNzUgMzcuMTgzNTk0TDUuMTYyMTA5NCAzNy4xNTQyOTdMNS4xNjk5MjE5IDM3LjE0ODQzOEM2LjU2MTAzMTEgMzYuMzQ1MjgxIDcuNDIwOTUxOCAzNC44NTYzMTQgNy40MTk5MjE5IDMzLjI1TDcuNDE5OTIxOSAzMC44NTE1NjJMNy40MTk5MjE5IDMwLjg0OTYwOUM3LjQyMDI1NSAyOS4yNDQwMzkgNi41NjA0NjgyIDI3Ljc1NDAwNCA1LjE2OTkyMTkgMjYuOTUxMTcyTDUuMTYyMTA5NCAyNi45NDUzMTJMNS4xMDkzNzUgMjYuOTE2MDE2TDYuMTMyODEyNSAyNS4xNDA2MjVMNi4xODU1NDY5IDI1LjE3MTg3NUM3LjU3NDIzNTEgMjUuOTcxMDEyIDkuMjg5NjQ5NCAyNS45NzA1NzggMTAuNjc3NzM0IDI1LjE2OTkyMkwxMi43NDgwNDcgMjMuOTgwNDY5TDEyLjc1IDIzLjk3ODUxNkMxNC4xNDExMDkgMjMuMTc1MzU5IDE1LjAwMTAzIDIxLjY4NDQzOSAxNSAyMC4wNzgxMjVMMTUgMjAgeiBNIDE2IDI3IEEgNSA1IDAgMCAwIDE2IDM3IEEgNSA1IDAgMCAwIDE2IDI3IHoiLz48L3N2Zz4=)',
      popup: 'userChromejs_options'
    });

    let mp = UC.rebuild.elBuilder(aDocument, 'menupopup', {
      id: 'userChromejs_options',
      onpopupshowing: 'UC.rebuild.onpopup(event);',
      oncontextmenu: 'event.preventDefault();'
    });
    toolbaritem.appendChild(mp);

    let mg = mp.appendChild(aDocument.createXULElement('menugroup'));
    mg.setAttribute('id', 'uc-menugroup');

    let mi1 = UC.rebuild.elBuilder(aDocument, 'menuitem', {
      id: 'userChromejs_openChromeFolder',
      label: '打开 Chrome 目录',
      class: 'menuitem-iconic',
      flex: '1',
      style: 'list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPgo8cGF0aCBkPSJNLjI1NiAzLjY1MnY3Ljc0NWEyLjU4IDIuNTggMCAwMDIuNTgxIDIuNTgxaDEwLjMyNmEyLjU4IDIuNTggMCAwMDIuNTgxLTIuNTgxVjQuOTQzYTIuNTgxIDIuNTgxIDAgMDAtMi41ODEtMi41ODJINi45MzZMNS40OTkgMS4yMTJhLjY0OC42NDggMCAwMC0uNDAzLS4xNDFIMi44MzdBMi41OCAyLjU4IDAgMDAuMjU2IDMuNjUyem0xLjI5IDBjMC0uNzEzLjU3OC0xLjI5MSAxLjI5MS0xLjI5MWgyLjAzMmwxLjEyMS44OTctMS4xNDQgMS4wNGgtMy4zdi0uNjQ2em01LjkyOSAwaDUuNjg4Yy43MTMgMCAxLjI5MS41NzggMS4yOTEgMS4yOTF2Ni40NTRhMS4yOSAxLjI5IDAgMDEtMS4yOTEgMS4yOUgyLjgzN2ExLjI5IDEuMjkgMCAwMS0xLjI5MS0xLjI5VjUuNTg4aDMuNTVjLjE2IDAgLjMxNS0uMDYuNDM0LS4xNjhsMS45NDUtMS43Njh6Ii8+Cjwvc3ZnPgo=)',
      oncommand: 'Services.dirsvc.get(\'UChrm\', Ci.nsIFile).launch();'
    });
    mg.appendChild(mi1);

    let tb = UC.rebuild.elBuilder(aDocument, 'toolbarbutton', {
      id: 'userChromejs_restartApp',
      tooltiptext: '重启 ' + _uc.BROWSERNAME,
      style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMy42NyAxMS4xNDggQyAzLjY3IDEwLjI3MiAzLjg0OCA5LjQzNiA0LjE3MSA4LjY3NCBDIDQuNDkzIDcuOTEyIDQuOTYxIDcuMjI1IDUuNTM5IDYuNjQ2IEwgNC43ODUgNS44OTMgTCA0LjAzMSA1LjEzOSBDIDMuMjM2IDUuOTM3IDIuNjE1IDYuODc2IDIuMTkzIDcuODk3IEMgMS43NzEgOC45MTggMS41NDcgMTAuMDIyIDEuNTQ3IDExLjE0OCBDIDEuNTQ3IDEzLjMxNCAyLjM1NyAxNS4yODggMy42OSAxNi43ODYgQyA1LjAyNCAxOC4yODQgNi44ODIgMTkuMzA3IDguOTc5IDE5LjU2NyBMIDguOTc5IDE4LjQ5NSBMIDguOTc5IDE3LjQyMiBDIDcuNDc3IDE3LjE2NyA2LjE0OSAxNi4zODcgNS4xOTggMTUuMjc2IEMgNC4yNDYgMTQuMTY1IDMuNjcgMTIuNzI0IDMuNjcgMTEuMTQ4IFogTSAxOC41MzQgMTEuMTQ4IEMgMTguNTM0IDguODAyIDE3LjU4NCA2LjY3OCAxNi4wNDcgNS4xNDEgQyAxNC41MSAzLjYwNCAxMi4zODcgMi42NTQgMTAuMDQgMi42NTQgQyAxMC4wMDkgMi42NTQgOS45NzcgMi42NTcgOS45NDUgMi42NTkgQyA5LjkxMyAyLjY2MiA5Ljg4MSAyLjY2NSA5Ljg0OSAyLjY2NSBMIDEwLjQyOCAyLjA4NyBMIDExLjAwNyAxLjUwOCBMIDEwLjI1OSAwLjc1NCBMIDkuNTEgMCBMIDcuNjUyIDEuODU4IEwgNS43OTQgMy43MTYgTCA3LjY1MiA1LjU3NCBMIDkuNTEgNy40MzIgTCAxMC4yNTkgNi42ODQgTCAxMS4wMDcgNS45MzUgTCAxMC40MzQgNS4zNjIgTCA5Ljg2IDQuNzg4IEMgOS44OTIgNC43ODggOS45MjQgNC43ODYgOS45NTQgNC43ODMgQyA5Ljk4NSA0Ljc4MSAxMC4wMTQgNC43NzggMTAuMDQgNC43NzggQyAxMS43OTggNC43NzggMTMuMzkgNS40OTIgMTQuNTQzIDYuNjQ1IEMgMTUuNjk2IDcuNzk4IDE2LjQxIDkuMzkxIDE2LjQxIDExLjE0OCBDIDE2LjQxIDEyLjcyNCAxNS44MzQgMTQuMTY2IDE0Ljg4MyAxNS4yNzYgQyAxMy45MzIgMTYuMzg3IDEyLjYwNSAxNy4xNjcgMTEuMTAyIDE3LjQyMiBMIDExLjEwMiAxOC40OTUgTCAxMS4xMDIgMTkuNTY3IEMgMTMuMTk5IDE5LjMwNyAxNS4wNTcgMTguMjg1IDE2LjM5MSAxNi43ODYgQyAxNy43MjUgMTUuMjg4IDE4LjUzNCAxMy4zMTQgMTguNTM0IDExLjE0OCBaIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLCAwLjEyMDQ0MSwgMC4yNTc5MzEpIi8+Cjwvc3ZnPg==)',
      oncommand: 'UC.rebuild.restart();'
    });
    mg.appendChild(tb);

    let mn = UC.rebuild.elBuilder(aDocument, 'menu', {
      id: 'uc-manageMenu',
      label: '设置',
      class: 'menuitem-iconic',
      style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAADJUlEQVQ4ja1TS0wTQRgean0/ovFgTDxpjDc9Gg8mvSrnKhFSC8VpCuyyu22Xbdm2s7Rdt48t7kIhEJEIYiKKphZK0CoRLVYlHiAEFYMng4+bF6nUjgfbuiocTPwuM5P83/d/8z8AWAMIIX3xWvHHCYxG44a1OOuCIIhd2rfZbN7yTwIURe0+D8lAbSO3aLI21xgMBn2dzXbQZLM/MNkcEwRNnyw6rFhTAEK4ESGkc/L8IacgY1Hpw1xbbLWBFT5QrRe/+GM92Bfpxg4Xkotf3LSuGAAA1DcypC/cnWuL9a5yQQXzUifmApewR4pjUenLESzKQAi3rUmmaXqrpYF0WBqYDrtXynnDceyR1JW7E5Opqcwz9Ul2pr+zb+gdF2jHnlAnvkC6piw2WmikHCeKEj+dmWDTuSZXEPsiXdgb6Sr4o/HlV4uLZ5LJZDnz0tLSkeE7YyMt/nbcFuvBrqCCqyGdhhBuLAtF2jvE1osd+UCsZ8Xhi3yfnMqYNYZ1pcB0Or1X6bm64BLVvCcczwflrrcsy+4sBVaMjo7u6R248ZDiJaz0Ds4PDAxs1woAAIDBYNADAMBIIsU6BRm7RWUlm31x+rduAQCAEFICDkEu+MTYuMZJGUajcQNCQBeU2ivZNrng8ssfNYNb7FQ9caCusSUrRLsLFtL9ppogdhUnuCxWSniursHnFtWCwyvlqmttNUA7U1bSeYnxSNgXin91CtFCdT1hLwkghPSltYAQ7rcy/LI3HM+7RaUAKfdnjuP2lB0NjyQq3X45R7eK2ImiuIkV8mdNVsZspnaXYqpq4XGzjXneIsjY7g1hkvPjvsHhm9o6AlVVN2ezL6oyz2fsATn+yemLYModxDWQfm2luAmTjXlsaXbnWvwxTPNS4XZy/Nrj6em6ZDJ57Lc50mJyKlNDugLfPJKaY4UovsB4MeEKYE+oI0/z4mr3laFUKpXa/BfxV3uRHgCg43n/YZITvtfTPEYh9f1Y+tGDy4M3X1oZTx4yXsyjYFhT/PV3DSG0Y3Z+oen6rcT92fn5Uwgh3dzc3L7xe5P9T57OXE4kEkfXJf8P/ABlOH7kn81/zwAAAABJRU5ErkJggg==)'
    });
    mp.appendChild(mn);

    let mp2 = mn.appendChild(aDocument.createXULElement('menupopup'));

    let mi2 = UC.rebuild.elBuilder(aDocument, 'menuitem', {
      id: 'showToolsMenu',
      label: '切换显示模式',
      class: 'menuitem-iconic',
      style: 'list-style-image: url(data:image/svg+xml;base64,PHN2ZyB0PSIxNjQ2Nzg1OTE5MTE5IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjIxMTQiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNMTI4IDUyMi42NjY2NjdjMTcuMDY2NjY3IDAgMzItMTQuOTMzMzMzIDMyLTMydi0xNzAuNjY2NjY3YzAtNi40IDQuMjY2NjY3LTEwLjY2NjY2NyAxMC42NjY2NjctMTAuNjY2NjY3aDY1Mi44bC04My4yIDgzLjJjLTEyLjggMTIuOC0xMi44IDM0LjEzMzMzMyAwIDQ2LjkzMzMzNCA2LjQgNi40IDE0LjkzMzMzMyAxMC42NjY2NjcgMjMuNDY2NjY2IDEwLjY2NjY2NnMxNy4wNjY2NjctNC4yNjY2NjcgMjMuNDY2NjY3LTEwLjY2NjY2NmwxNDUuMDY2NjY3LTE0NS4wNjY2NjdjMTIuOC0xMi44IDEyLjgtMzQuMTMzMzMzIDAtNDYuOTMzMzMzbC0xNDUuMDY2NjY3LTE0NS4wNjY2NjdjLTEyLjgtMTIuOC0zNC4xMzMzMzMtMTIuOC00Ni45MzMzMzMgMC0xMi44IDEyLjgtMTIuOCAzNC4xMzMzMzMgMCA0Ni45MzMzMzNsOTMuODY2NjY2IDkzLjg2NjY2N0gxNzAuNjY2NjY3Yy00MC41MzMzMzMgMC03NC42NjY2NjcgMzQuMTMzMzMzLTc0LjY2NjY2NyA3NC42NjY2Njd2MTcwLjY2NjY2NmMwIDE5LjIgMTQuOTMzMzMzIDM0LjEzMzMzMyAzMiAzNC4xMzMzMzR6TTkwNi42NjY2NjcgNTAxLjMzMzMzM2MtMTcuMDY2NjY3IDAtMzIgMTQuOTMzMzMzLTMyIDMydjE3MC42NjY2NjdjMCA2LjQtNC4yNjY2NjcgMTAuNjY2NjY3LTEwLjY2NjY2NyAxMC42NjY2NjdIMjExLjJsODMuMi04My4yYzEyLjgtMTIuOCAxMi44LTM0LjEzMzMzMyAwLTQ2LjkzMzMzNC0xMi44LTEyLjgtMzQuMTMzMzMzLTEyLjgtNDYuOTMzMzMzIDBsLTE0NS4wNjY2NjcgMTQ1LjA2NjY2N2MtMTIuOCAxMi44LTEyLjggMzQuMTMzMzMzIDAgNDYuOTMzMzMzbDE0NS4wNjY2NjcgMTQ1LjA2NjY2N2M2LjQgNi40IDE0LjkzMzMzMyAxMC42NjY2NjcgMjMuNDY2NjY2IDEwLjY2NjY2N3MxNy4wNjY2NjctNC4yNjY2NjcgMjMuNDY2NjY3LTEwLjY2NjY2N2MxMi44LTEyLjggMTIuOC0zNC4xMzMzMzMgMC00Ni45MzMzMzNsLTkzLjg2NjY2Ny05My44NjY2NjdoNjYzLjQ2NjY2N2M0MC41MzMzMzMgMCA3NC42NjY2NjctMzQuMTMzMzMzIDc0LjY2NjY2Ny03NC42NjY2Njd2LTE3MC42NjY2NjZjMC0xOS4yLTEyLjgtMzQuMTMzMzMzLTMyLTM0LjEzMzMzNHoiIHAtaWQ9IjIxMTUiPjwvcGF0aD48L3N2Zz4=)',
      oncommand: 'UC.rebuild.toggleUI();'
    });
    mp2.appendChild(mi2);

    let sep = mp.appendChild(aDocument.createXULElement('menuseparator'));
    sep.setAttribute('id', 'uc-menuseparator');

    let mi = UC.rebuild.elBuilder(aDocument, 'menu', {
      id: 'userChromejs_Tools_Menu',
      label: 'userChromeJS 管理器',
      tooltiptext: 'UC 脚本管理器',
      class: 'menu-iconic',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC',
    });
    aDocument.getElementById(AppConstants.MOZ_APP_NAME !== 'thunderbird' ? 'devToolsSeparator' : 'prefSep').insertAdjacentElement('afterend', mi);//taskPopup

    let menupopup = aDocument.getElementById('userChromejs_options');
    UC.rebuild.menues.forEach(menu => {
      menupopup.insertBefore(menu, aDocument.getElementById('uc-menuseparator'));            
    })

    let pi = aDocument.createProcessingInstruction(
      'xml-stylesheet',
      'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(`
      #userChromejs_options menuitem[restartless="true"] {
        color: blue;
      }
      #uc-menugroup .menu-iconic-icon {margin-left:2px;}
      `.replace(/[\r\n\t]/g, '')) + '"'
    );
    aDocument.insertBefore(pi, aDocument.documentElement);

    aDocument.defaultView.setTimeout((() => UC.rebuild.toggleUI(false, true)), 1000);

    const viewCache = aDocument.getElementById('appMenu-viewCache')?.content || aDocument.getElementById('appMenu-multiView');

    if (viewCache) {          
      const userChromeJsPanel = aDocument.createXULElement('panelview');
      userChromeJsPanel.id = 'appMenu-userChromeJsView';
      userChromeJsPanel.className = 'PanelUI-subView';
      userChromeJsPanel.addEventListener('ViewShowing', UC.rebuild.onHamPopup);
      const subviewBody = aDocument.createXULElement('vbox');
      subviewBody.className = 'panel-subview-body';
      subviewBody.appendChild(UC.rebuild.createMenuItem(aDocument, 'openChrome', 'url(chrome://browser/skin/folder.svg)', '打开 Chrome 目录', 'Services.dirsvc.get(\'UChrm\', Ci.nsIFile).launch();'));
      subviewBody.appendChild(UC.rebuild.createMenuItem(aDocument, 'restart', 'url(chrome://browser/skin/reload.svg)', '重启 ' + _uc.BROWSERNAME, 'UC.rebuild.restart();'));
      subviewBody.appendChild(aDocument.createXULElement('toolbarseparator'));
      const enabledMenuItem = UC.rebuild.createMenuItem(aDocument, 'enabled', null, 'Enabled', 'xPref.set(_uc.PREF_ENABLED, !!this.checked)');
      enabledMenuItem.type = 'checkbox';
      subviewBody.appendChild(enabledMenuItem);
      const scriptsSeparator = aDocument.createXULElement('toolbarseparator');
      scriptsSeparator.id = 'appMenu-userChromeJS-scriptsSeparator';
      subviewBody.appendChild(scriptsSeparator);
      userChromeJsPanel.appendChild(subviewBody);
      viewCache.appendChild(userChromeJsPanel);

      const scriptsButton = aDocument.createXULElement('toolbarbutton');
      scriptsButton.id = 'appMenu-userChromeJS-button';
      scriptsButton.className = 'subviewbutton subviewbutton-iconic subviewbutton-nav';
      scriptsButton.label = '用户脚本';
      scriptsButton.style.listStyleImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC)';
      scriptsButton.setAttribute('closemenu', 'none');
      scriptsButton.setAttribute('oncommand', 'PanelUI.showSubView(\'appMenu-userChromeJsView\', this)');

      const addonsButton = aDocument.getElementById('appMenu-extensions-themes-button') ?? aDocument.getElementById('appmenu_addons') ?? viewCache.querySelector('#appMenu-extensions-themes-button');
      addonsButton.parentElement.insertBefore(scriptsButton, addonsButton);
    }

    return toolbaritem;
  }
}

UC.rebuild.init();
