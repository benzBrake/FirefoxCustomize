// ==UserScript==
// @name           KeyChanger.uc.js
// @author         Griever
// @namespace      http://d.hatena.ne.jp/Griever/
// @include        main
// @description    Additional shortcuts for Firefox
// @license        MIT License
// @charset        UTF-8
// @version        2022.05.05
// @note           0.0.2 メニューを右クリックで設定ファイルを開けるようにした
// @note           0.0.2 Meta キーを装飾キーに使えるようになったかもしれない（未テスト）
// @note           0.0.2 Windows キーを装飾キーに使えるようになったかもしれない（未テスト Firefox 17 以降）
// @note           2018.1.25.2 Firefox59+ 修复
// ==/UserScript==

location.href.startsWith("chrome://browser/content/browser.x") && (function () {
    var useScraptchpad = true;  // If the editor does not exist, use the code snippet shorthand, otherwise set the editor path
    //let {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
    window.KeyChanger = {
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get file() {
            try {
                path = this.prefs.getStringPref("FILE_PATH")
            } catch (e) {
                path = '_keychanger.js';
            }
            aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);
            if (!aFile.exists()) {
                saveFile(aFile, '');
                alert('_keychanger.js 配置为空');
            }
            delete this.file;
            return this.file = aFile;
        },
        get FILE() {
            return this.file;
        },
        isBuilding: false,
        makeKeyset: function (isAlert) {
            KeyChanger.isBuilding = true;
            var s = new Date();
            var keys = this.makeKeys();
            if (!keys) {
                isBuilding = false;
                return this.alert('KeyChanger', 'Load error.');
            }
            var keyset = document.getElementById('keychanger-keyset');
            if (keyset)
                keyset.parentNode.removeChild(keyset);
            keyset = document.createXULElement('keyset');
            keyset.setAttribute('id', 'keychanger-keyset');
            keyset.appendChild(keys);

            var df = document.createDocumentFragment();
            Array.prototype.slice.call(document.getElementsByTagName('keyset')).forEach(function (elem) {
                df.appendChild(elem);
            });
            var insPos = document.getElementById('mainPopupSet');
            insPos.parentNode.insertBefore(keyset, insPos);
            insPos.parentNode.insertBefore(df, insPos);
            var e = new Date() - s;
            if (isAlert) {
                this.alert('KeyChanger: Loaded', e + 'ms');
            }
            setTimeout(function () {
                KeyChanger.isBuilding = false;
            }, 100);

        },
        makeKeys: function () {
            var str = this.loadText(this.file);
            if (!str)
                return null;

            var sandbox = new Components.utils.Sandbox(new XPCNativeWrapper(window));
            var keys = Components.utils.evalInSandbox('var keys = {};\n' + str + ';\nkeys;', sandbox);
            if (!keys)
                return null;
            var dFrag = document.createDocumentFragment();

            Object.keys(keys).forEach(function (n) {
                let keyString = n.toUpperCase().split("+");
                let modifiers = "", key, keycode, k;

                for (let i = 0, l = keyString.length; i < l; i++) {
                    k = keyString[i];
                    switch (k) {
                        case "CTRL":
                        case "CONTROL":
                        case "ACCEL":
                            modifiers += "accel,";
                            break;
                        case "SHIFT":
                            modifiers += "shift,";
                            break;
                        case "ALT":
                        case "OPTION":
                            modifiers += "alt,";
                            break;
                        case "META":
                        case "COMMAND":
                            modifiers += "meta,";
                            break;
                        case "OS":
                        case "WIN":
                        case "WINDOWS":
                        case "HYPER":
                        case "SUPER":
                            modifiers += "os,";
                            break;
                        case "":
                            key = "+";
                            break;
                        case "BACKSPACE":
                        case "BKSP":
                        case "BS":
                            keycode = "VK_BACK";
                            break;
                        case "RET":
                        case "ENTER":
                            keycode = "VK_RETURN";
                            break;
                        case "ESC":
                            keycode = "VK_ESCAPE";
                            break;
                        case "PAGEUP":
                        case "PAGE UP":
                        case "PGUP":
                        case "PUP":
                            keycode = "VK_PAGE_UP";
                            break;
                        case "PAGEDOWN":
                        case "PAGE DOWN":
                        case "PGDN":
                        case "PDN":
                            keycode = "VK_PAGE_DOWN";
                            break;
                        case "TOP":
                            keycode = "VK_UP";
                            break;
                        case "BOTTOM":
                            keycode = "VK_DOWN";
                            break;
                        case "INS":
                            keycode = "VK_INSERT";
                            break;
                        case "DEL":
                            keycode = "VK_DELETE";
                            break;
                        default:
                            if (k.length === 1) {
                                key = k;
                            } else if (k.indexOf("VK_") === -1) {
                                keycode = "VK_" + k;
                            } else {
                                keycode = k;
                            }
                            break;
                    }
                }
                let elem = document.createXULElement('key');
                if (modifiers !== '')
                    elem.setAttribute('modifiers', modifiers.slice(0, -1));
                if (key)
                    elem.setAttribute('key', key);
                else if (keycode)
                    elem.setAttribute('keycode', keycode);

                let cmd = keys[n];
                switch (typeof cmd) {
                    case 'function':
                        elem.setAttribute('oncommand', '(' + cmd.toString() + ').call(this, event);');
                        break;
                    case 'object':
                        Object.keys(cmd).forEach(function (a) {
                            elem.setAttribute(a, cmd[a]);
                        }, this);
                        break;
                    default:
                        elem.setAttribute('oncommand', cmd);
                }
                dFrag.appendChild(elem);
            }, this);
            return dFrag;
        },
        createMenuitem: function () {
            var menuitem = document.createXULElement('menuitem');
            menuitem.setAttribute('id', 'toolsbar_KeyChanger_rebuild');
            menuitem.setAttribute('label', 'KeyChanger');
            menuitem.setAttribute('tooltiptext', '左键：重载配置\n右键：编辑配置');
            menuitem.setAttribute('oncommand', 'setTimeout(function(){ KeyChanger.makeKeyset(true); }, 10);');
            menuitem.setAttribute('onclick', 'if (event.button == 2) { event.preventDefault();KeyChanger.edit(KeyChanger.file); }');
            var insPos = document.getElementById('devToolsSeparator');
            insPos.parentNode.insertBefore(menuitem, insPos);
        },
        loadText: function (aFile) {
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);

            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) {
            }
            sstream.close();
            fstream.close();
            return data;
        },
        openCommand: function (url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log(U(this.t('urlIsInvalid')).replace("%s", url));
            }
            if (uri.scheme === "javascript") {
                try {
                    loadURI(url);
                } catch (e) {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                try {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } catch (e) {
                    let aAllowThirdPartyFixup = {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(uri.spec) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            )
                    }
                    openUILinkIn(uri.spec, where, aAllowThirdPartyFixup);
                }
            } else {
                let aAllowThirdPartyFixup = {
                    inBackground: false,
                    postData: postData || null,
                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                }
                openUILinkIn(uri.spec, 'tab', aAllowThirdPartyFixup);
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
                "chrome://global/skin/icons/information-32.png", aTitle || "addMenu",
                aMsg + "", !!callback, "", callback);
        },
        edit: function (aFile, aLineNumber) {
            if (KeyChanger.isBuilding) return;
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;

            var editor;
            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) { }

            if (!editor || !editor.exists()) {
                if (useScraptchpad && this.appVersion <= 72) {
                    this.openScriptInScratchpad(window, aFile);
                    return;
                } else {
                    function setPath() {
                        var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(window, "设置全局脚本编辑器", fp.modeOpen);
                        fp.appendFilter("执行文件", "*.exe");

                        if (typeof fp.show !== 'undefined') {
                            if (fp.show() == fp.returnCancel || !fp.file)
                                return;
                            else {
                                editor = fp.file;
                                Services.prefs.setCharPref("view_source.editor.path", editor.path);
                            }
                        } else {
                            fp.open(res => {
                                if (res != Ci.nsIFilePicker.returnOK) return;
                                editor = fp.file;
                                Services.prefs.setCharPref("view_source.editor.path", editor.path);
                            });
                        }
                    }
                    KeyChanger.alert("请先设置编辑器的路径!!!", "提示", setPath);

                }
            }

            var aURL = "";
            if (typeof userChrome !== "undefined") {
                aURL = userChrome.getURLSpecFromFile(aFile);
            } else {
                var fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
                aURL = fph.getURLSpecFromActualFile(aFile);
            }

            var aDocument = null;
            var aCallBack = null;
            var aPageDescriptor = null;
            gViewSourceUtils.openInExternalEditor({
                URL: aURL,
                lineNumber: aLineNumber
            }, aPageDescriptor, aDocument, aLineNumber, aCallBack);

        },
        openScriptInScratchpad: function (parentWindow, file) {
            let spWin = window.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
            spWin.top.moveTo(0, 0);
            spWin.top.resizeTo(screen.availWidth, screen.availHeight);
            spWin.addEventListener("load", function spWinLoaded() {
                spWin.removeEventListener("load", spWinLoaded, false);

                let Scratchpad = spWin.Scratchpad;
                Scratchpad.setFilename(file.path);
                Scratchpad.addObserver({
                    onReady: function () {
                        Scratchpad.removeObserver(this);
                        Scratchpad.importFromFile.call(Scratchpad, file);
                    }
                });
            }, false);
        },
        exec: function (path, arg) {
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var a = (typeof arg == 'string' || arg instanceof String) ? arg.split(/\s+/) : [arg];
                file.initWithPath(path);
                process.init(file);
                process.run(false, a, a.length);
            } catch (e) {
                this.log(e);
            }
        },
        get prefs() {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch("keyChanger.")
        },
        log: function () {
            Services.console.logStringMessage("[KeyChanger] " + Array.prototype.slice.call(arguments));
        },
    };

    window.KeyChanger.createMenuitem();
    window.KeyChanger.makeKeyset();

})();