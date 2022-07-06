// ==UserScript==
// @name            miscMods.uc.js
// @description     没有分类的脚本合集，粘贴并转到增加 Access Key，中键单击地址栏复制当前地址，右键地址栏收藏按钮打开书签管理，右键刷新按钮强制刷新，右键 xiaoxiaoflood 的扩展管理管理器打开扩展管理页面，右键 Styloaix 按钮打开主题管理，中键下载按钮调用 you-get 下载视频，右键下载按钮打开下载管理，左键侧边栏按钮打开书签侧边栏，中键侧边栏按钮切换侧边栏方向，右键侧边栏按钮打开历史侧边栏，CTRL + F 开关侧边栏
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function () {
    if (!location.href.startsWith("chrome://browser/content/browser.x")) return;

    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

    const WIDGET_ATTRS = {
        "urlbar-input": {
            el: "#paste-and-go",
            initEvent: "contextmenu",
            accesskey: 'S'
        },
        "urlbar-middle-click": {
            el: "#urlbar",
            onclick: function (e) {
                if (e.button == 1) copy(gBrowser.currentURI.spec);
            },
        },
        "searchbar": {
            el: ".searchbar-paste-and-search",
            initEvent: "contextmenu",
            accesskey: 'S'
        },
        "star-button-box": {
            el: "#star-button-box",
            initEvent: 'mouseover',
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? "左键：将此页加入书签(CTRL+D)\n中键：显示/隐藏书签工具栏\n右键：打开书签管理器" : "Left click: show extensions options menu(CTRL+D)\nMiddle click: toggle places toolbar\nRight click: open addons management",
            onclick: function (e) {
                if (e.button === 0) {
                    BrowserPageActions.doCommandForAction(PageActions.actionForID('bookmark'), e, this);
                } else if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    var bar = document.getElementById("PersonalToolbar"); setToolbarVisibility(bar, bar.collapsed);
                } else if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    PlacesCommandHook.showPlacesOrganizer('AllBookmarks');
                }
            },
        },
        "reload-button": {
            el: "#reload-button",
            initEvent: "mouseover",
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：刷新\n右键：强制刷新' : 'Left click: refresh page\nRight click: force refresh page',
            onclick: function (event) {
                if (event.button == 2) {
                    event.preventDefault();
                    event.target.ownerGlobal.BrowserReloadSkipCache();
                }
            }
        },
        "eom-button": {
            el: "#eom-button",
            initEvent: "mouseover",
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：拓展选项菜单\n右键：扩展管理' : 'Left click: show extensions options menu\nRight click: open addons management',
            onclick: function (event) {
                if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                    event.preventDefault();
                    event.target.ownerGlobal.BrowserOpenAddonsMgr('addons://list/extension');
                }
            },
        },
        "styloaix-button": {
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：管理 Styloaix 样式\n右键：主题管理' : 'Left click: show extensions options menu\nRight click: open themes management',
            onclick: function (event) {
                if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                    event.preventDefault();
                    event.target.ownerGlobal.BrowserOpenAddonsMgr('addons://list/theme');
                }
            },
        },
        "downloads-button": {
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：显示下载进度\n中键：下载视频\n右键：打开下载历史（CTRL + J）' : 'Left click: show download progress\nMiddle click: download video\nRight click: open download management(CTRL + J)',
            onclick: function (e) {
                if (e.button == 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    let cookiesPath, binPath, savePath, win = e.target.ownerGlobal, uri = win.gBrowser.selectedBrowser.currentURI;
                    const PREF_BRANCH = "userChrome.navbar.youGetBtn.", PREF_COOKIES = "COOKIESPATH", PREF_BIN = "BINPATH", PREF_SAVE = "SAVEPATH";
                    const prefs = Services.prefs.getBranch(PREF_BRANCH);

                    // 请在 about:config 中修改 cookies 存储路径 Please change cookies store path in about:config
                    try {
                        cookiesPath = prefs.getStringPref(PREF_COOKIES);
                    } catch (e) {
                        cookiesPath = "cookies";
                    }

                    cookiesPath = handleRelativePath(cookiesPath);
                    const aCookiesDir = Services.dirsvc.get("UChrm", Ci.nsIFile);
                    aCookiesDir.appendRelativePath(cookiesPath);

                    if (!aCookiesDir.exists()) aCookiesDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0o666);

                    if (!aCookiesDir.isReadable() || !aCookiesDir.isWritable()) {
                        alert(Services.locale.appLocaleAsBCP47.includes("zh-") ? "Cookies 保存目录不可读写" : "Cookies storage directory cannot be read or written");
                        return;
                    }

                    // 非网页不响应，可以细化为匹配 you-get.exe 支持的网站，我懒得写正则了
                    if (uri.spec.startsWith('http')) {
                        binPath = prefs.getStringPref(PREF_BIN, "");
                        savePath = prefs.getStringPref(PREF_SAVE, "");

                        function setYouGetPath() {
                            alert(Services.locale.appLocaleAsBCP47.includes("zh-") ? "请先设置 you-get.exe 的路径!!!" : "Please set you-get.exe path first!!!");
                            if (Services.locale.appLocaleAsBCP47.includes("zh-")) {
                                openUrl({ 'target': this }, 'https://lussac.lanzoui.com/b00nc5aab', 'tab');
                            } else {
                                openUrl({ 'target': this }, 'https://github.com/LussacZheng/you-get.exe/releases', 'tab');
                            }

                            choosePathAndSave(Services.locale.appLocaleAsBCP47.includes("zh-") ? "设置 you-get.exe 路径" : "Set you-get.exe path", PREF_BRANCH + PREF_BIN, Ci.nsIFilePicker.modeOpen, {
                                title: Services.locale.appLocaleAsBCP47.includes("zh-") ? "执行文件" : "Executable file",
                                param: "*.exe"
                            })
                        }

                        // 转换成 netscape 格式，抄袭自 cookie_txt 扩展
                        function formatCookie(co) {
                            return [
                                [
                                    co.isHttpOnly ? '#HttpOnly_' : '',
                                    co.host
                                ].join(''),
                                co.isDomain ? 'TRUE' : 'FALSE',
                                co.path,
                                co.isSecure ? 'TRUE' : 'FALSE',
                                co.expires,
                                co.name,
                                co.value + '\n'
                            ].join('\t');
                        }

                        // 保存 cookie 并返回路径
                        function saveCookie(host) {
                            if (!host) return;
                            let cookies = Services.cookies.getCookiesFromHost(host, {});
                            let string = cookies.map(formatCookie).join('');

                            let file = aCookiesDir.clone();
                            file.append(`${host}.txt`);
                            if (file.exists()) {
                                file.remove(0);
                            }
                            file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);

                            // 保存文件，抄袭自 saveUCJS.uc.js
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
                            return file.path;
                        }


                        if (!binPath) {
                            setYouGetPath();
                            try {
                                binPath = prefs.getStringPref(PREF_BIN);
                            } catch (e) {
                                return;
                            }
                        }
                        if (!savePath) {
                            choosePathAndSave(Services.locale.appLocaleAsBCP47.includes("zh-") ? "设置视频保存路径" : "Set video save path", PREF_BRANCH + PREF_SAVE)
                            try {
                                savePath = prefs.getStringPref(PREF_SAVE);
                            } catch (e) {
                                return;
                            }
                        }
                        let youGet = Services.dirsvc.get("UChrm", Ci.nsIFile);
                        try {
                            binPath = handleRelativePath(binPath);
                            youGet.appendRelativePath(binPath);
                        } catch (e) {
                            setYouGetPath();
                            return;
                        }
                        let p = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);

                        let commandArgs = ['-c', saveCookie(uri.host), '-o', savePath, uri.spec];

                        p.init(youGet);
                        p.runw(false, commandArgs, commandArgs.length);
                    }
                } else if (e.button == 2 && !e.shiftKey) {
                    // 右键打开下载历史
                    e.preventDefault();
                    e.stopPropagation();
                    DownloadsPanel.showDownloadsHistory();
                }
            },
        },
        "sidebar-button": {
            tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：显示书签侧边栏\n中键：切换侧边栏方向\n右键：显示历史侧边栏' : 'Left click: show bookmarks sidebar\nMiddle click: toogle sidebar postion\nRight click: show history sidebar',
            onclick: function (e) {
                e.preventDefault();
                e.stopPropagation();
                switch (e.button) {
                    case 2:
                        SidebarUI.toggle("viewHistorySidebar");
                        break;
                    case 1:
                        Services.prefs.setBoolPref("sidebar.position_start", !Services.prefs.getBoolPref("sidebar.position_start"));
                        break;
                    case 0:
                        SidebarUI.toggle("viewBookmarksSidebar")
                        break;
                }

            }
        },
        "cmd_find": {
            el: "#cmd_find",
            oncommand: 'if (!gFindBar || gFindBar.hidden) { gLazyFindCommand("onFindCommand") } else { gFindBar.close() }'
        }
    }

    const DELAY_EXEC = {
        "reload styloaix": {
            command: function () {
                if (UC && UC.styloaix) UC.styloaix.toggleAll({ reload: true });
            }
        },
        "warn on quit": {
            command: function () {
                location.href.startsWith('chrome://browser/content/browser.x') && setTimeout(() => {
                    const { BrowserGlue } = ChromeUtils.import('resource:///modules/BrowserGlue.jsm');
                    const gTabbrowserBundle = Services.strings.createBundle('chrome://browser/locale/tabbrowser.properties');
                    eval('BrowserGlue.prototype._onQuitRequest = ' +
                        BrowserGlue.prototype._onQuitRequest.toString()
                            .replace('pagecount >= 2', 'pagecount >= 1')
                    );
                }, 1000);
            }
        },
    }

    function $(sel, aDoc) {
        if (!sel) return false;
        let doc = aDoc || document;
        return doc.querySelector(sel);
    }

    Array.prototype.contain = function (val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) {
                return true;
            }
        }
        return false;
    };

    function applyAttrs(node, obj) {
        for (let key in obj) {
            if (key === 'el' || key === 'event') continue;
            if (['onclick', 'ondblclick', 'onblur'].contain(key)) {
                node.addEventListener(key.replace(/^on/, ""), obj[key], false);
            } else {
                node.setAttribute(key, obj[key]);
            }
            node.setAttribute(key, obj[key]);
        }
    }

    function handleRelativePath(path) {
        if (path) {
            path = path.replace(/\//g, '\\').toLocaleLowerCase();
            var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
            if (/^(\\)/.test(path)) {
                return ffdir + path;
            } else {
                return path;
            }
        }
    }

    function choosePathAndSave(title, prefKey, mode, filter) {
        title = title || Services.locale.appLocaleAsBCP47.includes("zh-") ? "选择目录" : "Choose path";
        mode = mode || Ci.nsIFilePicker.modeGetFolder;
        let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
        fp.init(window, title, mode);
        if (filter) {
            let { title, param } = filter;
            fp.appendFilter(title, param);
        }
        fp.open(res => {
            if (res != Ci.nsIFilePicker.returnOK) return;
            Services.prefs.setStringPref(prefKey, fp.file.path + '\\');
        });
    }

    function openUrl(event, url, where, postData) {
        var uri;
        postData = postData || null;
        try {
            uri = Services.io.newURI(url, null, null);
        } catch (e) {
            return this.log("链接有误：%s".replace("%s", url));
        }
        if (uri.scheme === "javascript") {
            try {
                loadURI(url);
            } catch (e) {
                gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
            }
        } else if (where) {
            openUILinkIn(uri.spec, where, {
                postData: postData,
                triggeringPrincipal: where === 'current' ?
                    gBrowser.selectedBrowser.contentPrincipal : (
                        /^(f|ht)tps?:/.test(uri.spec) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    )
            });
        } else if (event.button == 1) {
            openUILinkIn(uri.spec, 'tab', {
                postData: postData,
                triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                    Services.scriptSecurityManager.createNullPrincipal({}) :
                    Services.scriptSecurityManager.getSystemPrincipal()
            });
        } else {
            openUILinkIn(uri.spec, 'tab', {
                inBackground: false,
                postData: postData,
                triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
            });
        }
    }

    function init() {
        for (let widget in WIDGET_ATTRS) {
            let obj = WIDGET_ATTRS[widget];
            try {
                let { node } = CustomizableUI.getWidget(widget)?.forWindow(window),
                    { el, initEvent, arg } = obj;
                arg || (arg = false)
                let callback = (e) => {
                    if (e.type == "click" && e.button !== 2) return;
                    var timer = setInterval(() => {
                        if (el && $(el)) {
                            clearInterval(timer);
                            applyAttrs($(el), obj);
                            node.removeEventListener(initEvent, callback, arg);
                        }
                    }, 10)
                }
                node = node || $(el);
                if (!node) return;
                if (initEvent) {
                    node.addEventListener(initEvent, callback, arg);
                } else {
                    applyAttrs(node, obj);
                }
            } catch (e) {
                Cu.reportError(e)
            }
        }

        for (let key in DELAY_EXEC) {
            let obj = DELAY_EXEC[key],
                delay = obj.delay || 300;
            if (obj.command) {
                Number.isInteger(delay) && setTimeout(obj.command, delay);
            }
        }
    }

    function copy(aText) {
        Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
    }

    if (gBrowserInit.delayedStartupFinished) init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();