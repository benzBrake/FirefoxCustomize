// ==UserScript==
// @name         saveUCJS.uc.js
// @description  右键添加保存 UC 脚本菜单
// @charset      UTF-8
// @include      main
// @note         Nightlyで使っているSaveUserChromeJS.uc.jsが60で動かなかったので作成
// @homepageURL  https://github.com/alice0775/userChrome.js/
// ==/UserScript==
(function () {
    "use strict";
    // config
    const addToolMenu = false // Menüeintrag zum aktualisieren des Subscriptloaders dem Menü Extra hinzufügen
    const skipDialogTool = true // Bei Aktualisierung aus dem Extra Menü, Dialogfeld "Speichern unter" nicht anzeigen
    const addCxtMenu = true // Menüeintrag dem Hauptkontextmenü hinzufügen 
    const skipDialogCxt = false // Beim Speichern aus dem Kontextmenü, Dialogfeld "Speichern unter" nicht anzeigen
    const urgeRestart = true // Nach dem runter laden, Neustarten Dialog mit OK anzeigen
    //	config ここまで
    const subloader = 'https://github.com/alice0775/userChrome.js/blob/master/userChrome.js';
    const areaMenu = document.getElementById('contentAreaContextMenu');
    const toolMenu = document.getElementById('menu_ToolsPopup');
    const saveLink = document.getElementById('context-savelink');
    const github = 'https://github.com/';
    Cu.import('resource://gre/modules/FileUtils.jsm');

    let file;

    if (addCxtMenu) {
        areaMenu.addEventListener('popupshowing', function () {
            const _areaMenu = document.getElementById('ucjs_getUCJS_areamenu');
            if (_areaMenu) this.removeChild(_areaMenu);
            if (!gBrowser.currentURI.spec.startsWith(github)) return;
            createMenu(false, gContextMenu.linkURL);
        }, false);
    }

    if (addToolMenu) {
        const _toolMenu = document.getElementById('ucjs_getUCJS_toolmenu');
        if (_toolMenu) toolMenu.removeChild(_toolMenu);
        createMenu(true);
    }

    function createMenu(tool, file) {
        const parentMenu = tool ? toolMenu : areaMenu;
        const skip = tool ? skipDialogTool : skipDialogCxt;
        const check = tool ? true : false;
        let url = file ? file : tool ? subloader : gBrowser.currentURI.spec;
        url = url.replace('/blob/', '/raw/');
        const menu = document.createXULElement('menuitem');
        menu.setAttribute('hidden', /(\.js|\.mjs|\.jsm)$/.test(url) ? 'false' : 'true');
        menu.setAttribute('id', tool ? 'ucjs_getUCJS_toolmenu' : 'ucjs_getUCJS_areamenu');
        menu.setAttribute('label', tool ? '更新UC脚本' : '保存UC脚本');
        menu.setAttribute('tooltiptext', tool ? 'Alice 0775的下标加载程序脚本 ' : '保存为脚本');
        menu.addEventListener('click', function () { getFile(skip, url, check) }, false);
        tool ? parentMenu.appendChild(menu) : parentMenu.insertBefore(menu, saveLink ? saveLink : parentMenu.firstChild);
    }

    function getFile(skip, url, check) {
        const title = url.split(/\//)[url.split(/\//).length - 1]
        const date = new Date();
        const stamp = '?' + date.getTime();
        const xhr = new XMLHttpRequest();
        xhr.responseType = '';
        xhr.open('GET', url + stamp);
        xhr.send();
        xhr.onload = function () {
            if (check) {
                const version = xhr.responseText.split(/\r\n/)[0].match(/(\d+\.\d+\.\d{2})/)[0]
                if (PresentVer == version) {
                    alert('最新版本已在使用中');
                    return;
                } else {
                    Services.prefs.setStringPref('userChrome.subloader.version', version);
                }
            }
            saveUCJS(skip, xhr.responseText, title)
        }
    }

    function saveUCJS(skip, str, title) {
        const string = str.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\n', 'g'), `\r\n`);
        const oTitle = (title == 'userChrome.js.uc.js') ? 'userChrome.js' : title;
        if (!skip) {
            const nsIFilePicker = Components.interfaces.nsIFilePicker;
            const fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
            // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
            try {
                fp.init(window.browsingContext, '选择一个文件', Components.interfaces.nsIFilePicker.modeSave);
            } catch (e) {
                fp.init(window, '选择一个文件', Components.interfaces.nsIFilePicker.modeSave);
            }
            const ext = title.split(".").pop();
            fp.displayDirectory = Services.dirsvc.get('UChrm', Ci.nsIFile);
            switch (ext) {
                case 'js':
                    fp.appendFilter('userChrome.js', '*.uc.js');
                    fp.defaultExtension = 'uc.js';
                    break;
                case "mjs":
                    fp.appendFilter('ES Module', '*.sys.mjs');
                    fp.defaultExtension = 'sys.mjs';
                    break;
                case "jsm":
                    fp.appendFilter('JavaScript Module', '*.jsm');
                    fp.defaultExtension = '.jsm';
            }
            fp.defaultString = oTitle;
            const result = fp.open(_saveUCJS);
            
            function _saveUCJS(result) {
                if (result == nsIFilePicker.returnOK || result == Ci.nsIFilePicker.returnReplace) {
                    file = fp.file;
                    writeFile(file, string)
                }
            }
        } else {
            file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            let path = FileUtils.getFile("UChrm", [oTitle]);
            file.initWithPath(path);
            writeFile(file, string)
        }
    }

    function writeFile(file, string) {
        const charset = 'UTF-8';
        const fileStream = Components.classes['@mozilla.org/network/file-output-stream;1']
            .createInstance(Components.interfaces.nsIFileOutputStream);
        fileStream.init(file, 0x02 | 0x08 | 0x20, -1, 0);
        const converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1']
            .createInstance(Components.interfaces.nsIConverterOutputStream);
        converterStream.init(
            fileStream,
            charset,
            string.length,
            Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
        );
        converterStream.writeString(string);
        converterStream.close();
        fileStream.close();
        setTimeout(function () {
            if (urgeRestart && window.confirm('UC脚本保存完成，重启后生效. Firefox要立即重启吗？')) restart();
        }, 100);
    }

    function verCheck() {
        const file = Services.dirsvc.get('UChrm', Ci.nsIFile);
        file.append('userChrome.js');
        if (file.exists() === false) return false;
        const fstream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
        const sstream = Cc['@mozilla.org/scriptableinputstream;1'].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(file, -1, 0, 0);
        sstream.init(fstream);

        let data = sstream.read(sstream.available());
        try {
            data = decodeURIComponent(escape(data));
        } catch (e) { }
        sstream.close();
        fstream.close();
        if (data === 'undefined') return false;
        data = data.toString().split(/\r\n/)[0].match(/(\d+\.\d+\.\d{2})/)[0]
        return data;
    }

    function restart() {
        Services.appinfo.invalidateCachesOnRestart();

        let cancelQuit = Cc['@mozilla.org/supports-PRBool;1'].createInstance(Ci.nsISupportsPRBool);
        Services.obs.notifyObservers(cancelQuit, 'quit-application-requested', 'restart');

        if (cancelQuit.data)
            return;

        if (Services.appinfo.inSafeMode)
            Services.startup.restartInSafeMode(Ci.nsIAppStartup.eAttemptQuit);
        else
            Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
    }
})()