// ==UserScript==
// @name           000-xiaoxiaoflood.uc.js
// @description    alice0775 UC 环境运行 xiaoxiaoflood 脚本的依赖（不是所有脚本都能运行）
// @namespace      https://github.com/benzBrake/FirefoxCustomize/
// @author         Ryan
// @include        *
// @license        MIT License
// @compatibility  Firefox 68
// @charset        UTF-8
// @version        0.0.1
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    var win = document.ownerGlobal;
    const Services = globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
    
    try {
        let { AppConstants } = ChromeUtils.import('resource://gre/modules/AppConstants.jsm');
    } catch(e) {
        let { AppConstants } = ChromeUtils.importESModule('resource://gre/modules/AppConstants.sys.mjs');
    }
    

    if (!win.xPref)
        win.xPref = {
            // Retorna o valor da preferência, seja qual for o tipo, mas não
            // testei com tipos complexos como nsIFile, não sei como detectar
            // uma preferência assim, na verdade nunca vi uma
            get: function (prefPath, def = false, valueIfUndefined, setDefault = true) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            if (valueIfUndefined != undefined)
                                return this.set(prefPath, valueIfUndefined, setDefault);
                            else
                                return undefined;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    return undefined;
                }
                return;
            },

            set: function (prefPath, value, def = false) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                switch (typeof value) {
                    case 'string':
                        return sPrefs.setStringPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },

            lock: function (prefPath, value) {
                let sPrefs = Services.prefs;
                this.lockedBackupDef[prefPath] = this.get(prefPath, true);
                if (sPrefs.prefIsLocked(prefPath))
                    sPrefs.unlockPref(prefPath);

                this.set(prefPath, value, true);
                sPrefs.lockPref(prefPath);
            },

            lockedBackupDef: {},

            unlock: function (prefPath) {
                Services.prefs.unlockPref(prefPath);
                let bkp = this.lockedBackupDef[prefPath];
                if (bkp == undefined)
                    Services.prefs.deleteBranch(prefPath);
                else
                    this.set(prefPath, bkp, true);
            },

            clear: Services.prefs.clearUserPref,

            // Detecta mudanças na preferência e retorna:
            // return[0]: valor da preferência alterada
            // return[1]: nome da preferência alterada
            // Guardar chamada numa var se quiser interrompê-la depois
            addListener: function (prefPath, trat) {
                this.observer = function (aSubject, aTopic, prefPath) {
                    return trat(xPref.get(prefPath), prefPath);
                }

                Services.prefs.addObserver(prefPath, this.observer);
                return {
                    prefPath: prefPath,
                    observer: this.observer
                };
            },

            // Encerra pref observer
            // Só precisa passar a var definida quando adicionou
            removeListener: function (obs) {
                Services.prefs.removeObserver(obs.prefPath, obs.observer);
            }
        }

    if (!win.UC)
        win.UC = {
            webExts: new Map(),
            sidebar: new Map()
        }

    if (!win._uc)
        win._uc = {
            BROWSERCHROME: AppConstants.MOZ_APP_NAME == 'thunderbird' ? 'chrome://messenger/content/messenger.xhtml' : 'chrome://browser/content/browser.xhtml',
            BROWSERTYPE: AppConstants.MOZ_APP_NAME == 'thunderbird' ? 'mail:3pane' : 'navigator:browser',
            BROWSERNAME: AppConstants.MOZ_APP_NAME.charAt(0).toUpperCase() + AppConstants.MOZ_APP_NAME.slice(1),

            chromedir: Services.dirsvc.get('UChrm', Ci.nsIFile),
            sss: Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),

            windows: function (fun, onlyBrowsers = true) {
                let windows = Services.wm.getEnumerator(onlyBrowsers ? this.BROWSERTYPE : null);
                while (windows.hasMoreElements()) {
                    let win = windows.getNext();
                    if (!win._uc)
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

            createElement: function (doc, tag, atts, XUL = true) {
                let el = XUL ? doc.createXULElement(tag) : doc.createElement(tag);
                for (let att in atts) {
                    el.setAttribute(att, atts[att]);
                }
                return el
            },

            get isFaked() {
                return true;
            }
        }
})()