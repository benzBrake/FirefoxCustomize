// ==UserScript==
// @name            saveUCJS.uc.js
// @description     右键添加保存 UC 脚本菜单
// @charset         UTF-8
// @include         main
// @version         0.2.0
// @compatibility   Firefox 149
// @note            去除 FileUtils 依赖
// @note            2026-06-29 兼容 .uc.mjs 脚本下载
// @note            2026-06-29 修复下载/写入错误处理与工具菜单版本检查逻辑
// @note            2026-03-29 修复 Firefox 149+ 兼容性：更新 gBrowser.currentURI 和 gContextMenu.linkURL API，移除 hidden 属性以适配新版 XUL 渲染行为
// @note            Nightlyで使っているSaveUserChromeJS.uc.jsが60で動かなかったので作成
// @homepageURL     https://github.com/alice0775/userChrome.js/
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

    let file;

    if (addCxtMenu) {
        areaMenu.addEventListener('popupshowing', function () {
            const _areaMenu = document.getElementById('ucjs_getUCJS_areamenu');
            if (_areaMenu) this.removeChild(_areaMenu);

            // Firefox 新版本兼容修复
            const currentURI = gBrowser.selectedBrowser?.currentURI?.spec || gBrowser.currentURI.spec;
            if (!currentURI.startsWith(github)) return;

            // 获取链接 URL（兼容新旧 API）
            const linkURL = gContextMenu.linkInfo?.linkUrl || gContextMenu.linkURL;
            createMenu(false, linkURL);
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
        let url = file ? file : tool ? subloader : gBrowser.selectedBrowser?.currentURI?.spec || gBrowser.currentURI.spec;
        url = url.replace('/blob/', '/raw/');

        // Firefox 149+ 兼容：只在 JS 文件时才创建菜单
        if (!(/\.(js|mjs|jsm)$/i.test(getURLPath(url)))) return;

        const menu = document.createXULElement('menuitem');
        menu.setAttribute('id', tool ? 'ucjs_getUCJS_toolmenu' : 'ucjs_getUCJS_areamenu');
        menu.setAttribute('label', tool ? '更新UC脚本' : '保存UC脚本');
        menu.setAttribute('tooltiptext', tool ? 'Alice 0775的下标加载程序脚本 ' : '保存为脚本');
        menu.addEventListener('click', function () { getFile(skip, url, check) }, false);
        tool ? parentMenu.appendChild(menu) : parentMenu.insertBefore(menu, saveLink ? saveLink : parentMenu.firstChild);
    }

    function getFile(skip, url, check) {
        const title = getURLFileName(url);
        const date = new Date();
        const stamp = '?' + date.getTime();
        const xhr = new XMLHttpRequest();
        xhr.responseType = '';
        xhr.timeout = 30000;
        xhr.open('GET', url + stamp);
        xhr.send();
        xhr.onload = function () {
            if (xhr.status < 200 || xhr.status >= 300) {
                alert(`UC脚本下载失败：HTTP ${xhr.status}\n${url}`);
                return;
            }
            if (!xhr.responseText) {
                alert(`UC脚本下载失败：返回内容为空\n${url}`);
                return;
            }
            if (check) {
                const version = extractVersion(xhr.responseText);
                if (!version) {
                    alert(`无法识别远端版本号\n${url}`);
                    return;
                }
                const presentVer = verCheck();
                if (presentVer && Services.vc.compare(presentVer, version) >= 0) {
                    alert('最新版本已在使用中');
                    return;
                }
                Services.prefs.setStringPref('userChrome.subloader.version', version);
            }
            saveUCJS(skip, xhr.responseText, title)
        }
        xhr.onerror = function () {
            alert(`UC脚本下载失败：网络错误\n${url}`);
        }
        xhr.ontimeout = function () {
            alert(`UC脚本下载失败：请求超时\n${url}`);
        }
    }

    function extractVersion(str) {
        const match = str?.match(/\b(?:v|@version\s+)?(\d+\.\d+\.\d+)(?=\D|$)/);
        return match ? match[1] : null;
    }

    function getURLPath(url) {
        try {
            return new URL(url).pathname;
        } catch (e) {
            return url.split(/[?#]/)[0];
        }
    }

    function getURLFileName(url) {
        const name = getURLPath(url).split('/').pop();
        return decodeURIComponent(name || 'userChrome.js');
    }

    function saveUCJS(skip, str, title) {
        const string = str.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\n', 'g'), `\r\n`);
        const oTitle = (title == 'userChrome.js.uc.js') ? 'userChrome.js' : title;
        if (!skip) {
            const nsIFilePicker = Components.interfaces.nsIFilePicker;
            const fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
            // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
            fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                ? window.browsingContext
                : window, '选择一个文件', Components.interfaces.nsIFilePicker.modeSave);
            const ext = title.split(".").pop().toLowerCase();
            fp.displayDirectory = Services.dirsvc.get('UChrm', Ci.nsIFile);
            switch (ext) {
                case 'js':
                    fp.appendFilter('userChrome.js', '*.uc.js');
                    fp.defaultExtension = 'uc.js';
                    break;
                case "mjs":
                    fp.appendFilter('userChrome.mjs', '*.uc.mjs');
                    fp.appendFilter('ES Module', '*.mjs;*.sys.mjs');
                    fp.defaultExtension = title.endsWith('.uc.mjs') ? 'uc.mjs' : 'mjs';
                    break;
                case "jsm":
                    fp.appendFilter('JavaScript Module', '*.jsm');
                    fp.defaultExtension = '.jsm';
            }
            fp.defaultString = oTitle;
            const result = fp.open(_saveUCJS);

            function _saveUCJS(result) {
                if (result == nsIFilePicker.returnOK || result == Ci.nsIFilePicker.returnReplace) {
                    writeFile(fp.file.path, string)
                }
            }
        } else {
            writeFile(PathUtils.join(PathUtils.profileDir, "chrome", oTitle), string)
        }
    }

    function writeFile(path, string) {
        IOUtils.writeUTF8(path, string, {
            mode: 'overwrite'
        }).then(function () {
            setTimeout(function () {
                if (urgeRestart && window.confirm('UC脚本保存完成，重启后生效. Firefox要立即重启吗？')) restart();
            }, 100);
        }).catch(function (e) {
            console.error(e);
            alert(`UC脚本保存失败：\n${e}`);
        });
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
        return extractVersion(data.toString());
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
