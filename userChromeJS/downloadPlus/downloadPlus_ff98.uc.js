// ==UserScript==
// @name            DownloadPlus_ff98.uc.js
// @description     修改整合自（w13998686967、ywzhaiqi、黒仪大螃蟹、Alice0775、紫云飞）
// @author          Ryan
// @include         main
// @include         chrome://browser/content/places/places.xhtml
// @include         chrome://mozapps/content/downloads/unknownContentType.xhtml
// @version         0.0.1
// @startup         window.DownloadPlus.init();
// @compatibility   Firefox 98
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            20220717 修复另存为不提示文件名，修复改名后点保存会弹出保存对话框，修复 Firefox 104 OS is not defined
// @note            20220612 完成另存为，改名，转换编码，显示精确大小
// @note            20220611 完成调用第三方 App 下载
// @note            20220610 开始重写代码，完成保存并打开，从硬盘删除
// ==/UserScript==
(function (globalConfig, globalCss) {
    if (window.DownloadPlus) return;
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

    if (!window.CustomizableUI) Cu.import("resource:///modules/CustomizableUI.jsm");
    if (!window.Services) Cu.import("resource://gre/modules/Services.jsm");
    if (!window.OS) Cu.import("resource://gre/modules/osfile/osfile_async_front.jsm")
    if (!window.FileUtils) Cu.import("resource://gre/modules/FileUtils.jsm");

    const LANG = {
        'zh-CN': {
            "save and open": "保存并打开",
            "save as": "另存为",
            "save to": "保存到",
            "dobule click to copy link": "双击复制链接",
            "convert tooltip": "Ctrl+点击转换url编码\n左键:UNICODE\n右键:GB2312",
            "remove from disk": "从硬盘删除",
            "button aria2": "Aria2",
            "button idm": "IDM",
            "button thunder": "迅雷",
            "file not found": "文件未找到 %s",
            "desktop": "桌面",
            "disk label": "%s 盘",
            "only support firefox 98 and above": "仅支持 Firefox 98（包括） 以上"
        }
    }

    const _LOCALE = LANG.hasOwnProperty(Services.locale.appLocaleAsBCP47) ? Services.locale.appLocaleAsBCP47 : 'zh-CN';

    const QUICK_SAVE_LIST = [
        [Services.dirsvc.get('Desk', Ci.nsIFile).path, $L("desktop")],
        ["C:\\", $L("disk label", "C")],
        ["D:\\", $L("disk label", "D")],
        ["E:\\", $L("disk label", "E")],
        ["F:\\", $L("disk label", "F")]
    ]; // 快捷保存列表



    const EXTRA_APP = {
        "aria2": {
            "config": "enable aria2 button",
            "label": $L("button aria2"),
            "exec": "\\chrome\\resources\\tools\\Aria2\\aria2c.exe",
            "text": '-x 8 -k 10M --load-cookies={cookiePath} --referer={referer} -d {path} {link}',
        },
        "idm": {
            config: "enable idm button",
            label: $L("button idm"),
            exec: "C:\\Program\ Files\ (x86)\\Internet\ Download\ Manager\\IDMan.exe", // 需要修改 IDM 路径
            text: '/d {link}',
        },
        "thunder": {
            config: "enable thunder button",
            label: $L("button thunder"),
            exec: "C:\\Program\ Files\ (x86)\\Thunder\\Thunder.exe", // 需要修改迅雷路径
            text: '{link}',
        }
    }

    window.DownloadPlus = {
        _urls: [],
        get appVersion() {
            return Services.appinfo.version.split(".")[0]
        },
        get dialogElement() {
            return document.documentElement.getButton ? document.documentElement : document.getElementById('unknownContentType');
        },
        get topWin() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        init: function () {
            if (this.appVersion < 98) {
                this.log($L("only support firefox 98 and above"));
                this.destroy();
            }
            switch (location.href) {
                case 'chrome://browser/content/browser.xhtml':
                    if (globalConfig["enable save and open"]) this.saveAndOpenMain.init();
                    if (globalConfig["download complete notice"]) this.downloadCompleteNotice.init();
                    if (globalConfig["auto close blank tab"]) this.autoCloseBlankTab.init();
                    if (globalConfig["enable rename"]) this.changeNameMainInit();
                    break;
                case 'chrome://mozapps/content/downloads/unknownContentType.xhtml':
                    this.addExtraAppButtons();
                    if (globalConfig["enable double click to copy link"]) this.dblClickToCopyLink();
                    if (globalConfig["enable rename"]) this.downloadDialogChangeName();
                    if (globalConfig["show extract size"]) this.downloadDialogShowExtractSize();
                    window.sizeToContent();
                    break;
                case 'chrome://browser/content/places/places.xhtml':
                    if (globalConfig["remove file menuitem"]) this.removeFileEnhance.init();
                    break;

            }
            this.style = addStyle(globalCss);
        },
        destroy: function () {
            switch (location.href) {
                case 'chrome://browser/content/browser.xhtml':
                    if (globalConfig["enable save and open"]) this.saveAndOpenMain.destroy();
                    if (globalConfig["download complete notice"]) this.downloadCompleteNotice.destroy();
                    if (globalConfig["auto close blank tab"]) this.autoCloseBlankTab.destroy();
                    break;
                case 'chrome://mozapps/content/downloads/unknownContentType.xhtml':
                    break;
                case 'chrome://browser/content/places/places.xhtml':
                    if (globalConfig["remove file menuitem"]) this.removeFileEnhance.destroy();
                    break;
            }
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
        },
        handleRelativePath: function (path) {
            let OS = this.topWin.OS;
            if (path) {
                let handled = false;
                Object.keys(OS.Constants.Path).forEach(key => {
                    if (path.includes("{" + key + "}")) {
                        path = path.replace("{" + key + "}", OS.Constants.Path[key]);
                        handled = true;
                    }
                })
                if (!handled) {
                    path = path.replace(/\//g, '\\').toLocaleLowerCase();
                    var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                    if (/^(\\)/.test(path)) {
                        path = ffdir + path;
                    }
                }
                return path;
            }
        },
        exec: function (path, arg) {
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var a;
                if (typeof arg == "undefined") arg = []; // fix slice error
                if (typeof arg == 'string' || arg instanceof String) {
                    a = arg.split(/\s+/)
                } else if (Array.isArray(arg)) {
                    a = arg;
                } else {
                    a = [arg];
                }

                file.initWithPath(path);
                if (!file.exists()) {
                    DownloadPlus.alert($L("file not found", path), "error");
                    Cu.reportError($L("file not found", path));
                    return;
                }

                if (file.isExecutable()) {
                    process.init(file);
                    process.runw(false, a, a.length);
                } else {
                    file.launch();
                }
            } catch (e) {
                this.log(e);
            }
        },
        copy: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
        },
        dblClickToCopyLink: function (e) {
            var s = document.querySelector("#source"),
                l = s.previousSibling;
            l.innerHTML = l.innerHTML + "(" + $L("dobule click to copy link") + ")";
            s.value = dialog.mLauncher.source.spec;
            s.setAttribute("crop", "center");
            s.setAttribute("tooltiptext", $L("dobule click to copy link"));
            s.style.setProperty('cursor', 'pointer');
            l.setAttribute("ondblclick", 'DownloadPlus.copy(dialog.mLauncher.source.spec);');
            s.setAttribute("ondblclick", 'DownloadPlus.copy(dialog.mLauncher.source.spec);');
        },
        changeNameMainInit: function () {
            const obsService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
            const RESPONSE_TOPIC = 'http-on-examine-response';

            var respObserver = {
                observing: false,
                observe: function (subject, topic, data) {
                    try {
                        let channel = subject.QueryInterface(Ci.nsIHttpChannel);
                        let header = channel.contentDispositionHeader;
                        let associatedWindow = channel.notificationCallbacks
                            .getInterface(Components.interfaces.nsILoadContext)
                            .associatedWindow;
                        associatedWindow.localStorage.setItem(channel.URI.spec, header.split("=")[1]);
                    } catch (ex) { };
                },
                start: function () {
                    if (!this.observing) {
                        obsService.addObserver(this, RESPONSE_TOPIC, false);
                        this.observing = true;
                    }
                },
                stop: function () {
                    if (this.observing) {
                        obsService.removeObserver(this, RESPONSE_TOPIC, false);
                        this.observing = false;
                    }
                }
            };

            respObserver.start();
            addEventListener("beforeunload", function () {
                respObserver.stop();
            })
        },
        downloadDialogChangeName: function () {
            document.querySelector("#mode").addEventListener("select", function () {
                if (dialog.dialogElement("save").selected) {
                    let rename = globalConfig["enable rename"],
                        encodingConvert = globalConfig["enable encoding convert"];
                    if (!document.querySelector("#locationtext")) {
                        if (rename || encodingConvert) {
                            var orginalString = "";
                            if (encodingConvert) {
                                try {
                                    orginalString = (opener.localStorage.getItem(dialog.mLauncher.source.spec) ||
                                        dialog.mLauncher.source.asciiSpec.substring(dialog.mLauncher.source.asciiSpec.lastIndexOf("/"))).replace(/[\/:*?"<>|]/g, "");
                                    opener.localStorage.removeItem(dialog.mLauncher.source.spec)
                                } catch (e) {
                                    orginalString = dialog.mLauncher.suggestedFileName;
                                }
                            }
                            var location = document.querySelector("#location"), locationtext;
                            if (encodingConvert)
                                locationtext = document.createXULElement("menulist");
                            else
                                locationtext = document.createElementNS("http://www.w3.org/1999/xhtml", "html:input");
                            locationtext.id = "locationtext";
                            if (rename && encodingConvert)
                                locationtext.setAttribute("editable", "true");
                            locationtext.setAttribute("style", "margin-top:-2px;margin-bottom:-3px");
                            locationtext.setAttribute("tooltiptext", $L("convert tooltip"));
                            location.parentNode.insertBefore(locationtext, location);
                            locationtext.addEventListener("click", function (e) {
                                if (e.ctrlKey) {
                                    if (e.button == 0)
                                        this.value = decodeURIComponent(this.value);
                                    if (e.button == 2) {
                                        e.preventDefault();
                                        converter.charset = "GB2312";
                                        this.value = converter.ConvertToUnicode(unescape(this.value));
                                    }
                                }
                            }, false);
                            if (rename)
                                locationtext.value = dialog.mLauncher.suggestedFileName;
                            if (encodingConvert) {
                                locationtext.addEventListener("command", function (e) {
                                    if (rename)
                                        locationtext.value = e.target.value;
                                    document.title = "Opening " + e.target.value;
                                });
                                let menupopup = locationtext.appendChild(document.createXULElement("menupopup"));
                                let menuitem = menupopup.appendChild(document.createXULElement("menuitem"));
                                menuitem.value = dialog.mLauncher.suggestedFileName;
                                menuitem.label = "Original: " + menuitem.value;
                                if (!rename)
                                    locationtext.value = menuitem.value;
                                let converter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
                                    .getService(Components.interfaces.nsIScriptableUnicodeConverter);

                                function createMenuitem(encoding) {
                                    converter.charset = encoding;
                                    let menuitem = menupopup.appendChild(document.createXULElement("menuitem"));
                                    menuitem.value = converter.ConvertToUnicode(orginalString).replace(/^"(.+)"$/, "$1");
                                    menuitem.label = encoding + ": " + menuitem.value;
                                }
                                ["GB18030", "BIG5", "Shift-JIS"].forEach(function (item) {
                                    createMenuitem(item)
                                });
                            }
                        }
                    }
                    document.querySelector("#location").hidden = true;
                    document.querySelector("#locationtext").hidden = false;
                } else {
                    document.querySelector("#locationtext").hidden = true;
                    document.querySelector("#location").hidden = false;
                }
            }, false)
            dialog.dialogElement("save").selected && dialog.dialogElement("save").click();
            window.addEventListener("dialogaccept", function (event) {
                if ((document.querySelector("#locationtext").value != dialog.mLauncher.suggestedFileName) && dialog.dialogElement("save").selected) {
                    event.stopPropagation();
                    var mainwin = DownloadPlus.topWin;
                    mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, document, (document.querySelector("#locationtext") ? document.querySelector("#locationtext").value : dialog.mLauncher.suggestedFileName), null, null, false, null, null, null, null, null, true, null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                    close();
                }
            }, true);
        },
        downloadDialogShowExtractSize: () => {
            Cu.import("resource://gre/modules/DownloadUtils.jsm");
            function DU_convertByteUnits(aBytes) {
                let unitIndex = 0;
                while ((aBytes >= 999.5) && (unitIndex < 3)) {
                    aBytes /= 1024;
                    unitIndex++;
                }
                return [(aBytes > 0) && (aBytes < 100) && (unitIndex != 0) ? (aBytes < 10 ? (parseInt(aBytes * 100) / 100).toFixed(2) : (parseInt(aBytes * 10) / 10).toFixed(1)) : parseInt(aBytes), ['bytes', 'KB', 'MB', 'GB'][unitIndex]];
            }
            eval("DownloadUtils.convertByteUnits = " + DU_convertByteUnits.toString());
        },
        saveAndOpenView: {
            onDownloadChanged: function (dl) {
                if (dl.progress != 100) return;
                if (window.DownloadPlus._urls.indexOf(dl.source.url) > -1) {
                    let target = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                    target.initWithPath(dl.target.path);
                    target.launch();
                    window.DownloadPlus._urls[window.DownloadPlus._urls.indexOf(dl.source.url)] = "";
                }
            },
            onDownloadAdded: function (dl) { },
            onDownloadRemoved: function (dl) { },
        },
        saveAndOpenMain: {
            init: function () {
                Cu.import("resource://gre/modules/Downloads.jsm");
                Downloads.getList(Downloads.ALL).then(list => { list.addView(window.DownloadPlus.saveAndOpenView).then(null, Cu.reportError); });
            },
            destroy: function () {
                window.DownloadPlus._urls = [];
                Cu.import("resource://gre/modules/Downloads.jsm");
                Downloads.getList(Downloads.ALL).then(list => { list.removeView(window.DownloadPlus.saveAndOpenView).then(null, Cu.reportError); });
            }
        },
        addExtraAppButtons: function () {
            let refEl = this.dialogElement.getButton("accept").nextSibling;
            if (globalConfig["enable save and open"]) {
                let saveAndOpen = this.dialogElement.getButton('extra1');
                saveAndOpen.parentNode.insertBefore(saveAndOpen, this.dialogElement.getButton("accept").nextSibling);
                saveAndOpen.setAttribute("hidden", "false");
                saveAndOpen.setAttribute("label", $L("save and open"));
                saveAndOpen.addEventListener("command", () => {
                    Services.wm.getMostRecentWindow("navigator:browser").DownloadPlus._urls.push(dialog.mLauncher.source.asciiSpec);
                    document.querySelector("#save").click();
                    window.DownloadPlus.dialogElement.getButton("accept").disabled = 0;
                    window.DownloadPlus.dialogElement.getButton("accept").click()
                });
                refEl = saveAndOpen;
            }
            if (globalConfig["enable save as"]) {
                let saveAs = this.dialogElement.getButton('extra2');
                saveAs.setAttribute("hidden", "false");
                saveAs.setAttribute("label", $L("save as"));
                saveAs.addEventListener("command", () => {
                    var mainwin = DownloadPlus.topWin;
                    // 感谢 ycls006
                    mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, null, (document.querySelector("#locationtext") ? document.querySelector("#locationtext").value : dialog.mLauncher.suggestedFileName), null, null, false, null, null, null, null, null, false, null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                    close();
                });
                refEl.insertAdjacentElement('afterend', saveAs);
                refEl = saveAs;
            }
            refEl || (refEl = this.dialogElement.getButton("accept").nextSibling);
            if (globalConfig["enable save to"]) {
                let shadowRoot = document.getElementById('unknownContentType').shadowRoot,
                    link = $CNS(document, 'http://www.w3.org/1999/xhtml', 'html:link', {
                        rel: 'stylesheet',
                        href: 'chrome://global/content/widgets.css'
                    });
                shadowRoot.insertBefore(link, shadowRoot.firstChild);
                let saveTo = $C(document, 'button', {
                    label: $L("save to"),
                    hidde: false,
                    type: 'menu'
                }),
                    saveToMenu = $C(document, 'menupopup', {});
                // saveTo.appendChild(document.createXULElement('dropmarker'));
                saveTo.appendChild(saveToMenu);
                QUICK_SAVE_LIST.forEach(function (dir) {
                    var [name, dir] = [dir[1], dir[0]];
                    var item = saveToMenu.appendChild(document.createXULElement("menuitem"));
                    item.setAttribute("label", (name || (dir.match(/[^\\/]+$/) || [dir])[0]));
                    item.setAttribute("image", "moz-icon:file:///" + dir + "\\");
                    item.setAttribute("class", "menuitem-iconic");
                    item.onclick = function () {
                        var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                        var path = dir.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path);
                        path = path.endsWith("\\") ? path : path + "\\";
                        file.initWithPath(path + (document.querySelector("#locationtext") ? document.querySelector("#locationtext").value : document.querySelector("#location").value).trim());
                        if (typeof dialog.mLauncher.saveToDisk === 'function') {
                            dialog.mLauncher.saveToDisk(file, 1);
                        } else {
                            dialog.mLauncher.MIMEInfo.preferredAction = dialog.mLauncher.MIMEInfo.saveToDisk;
                            dialog.mLauncher.saveDestinationAvailable(file);
                        }
                        dialog.onCancel = function () { };
                        close();
                    };
                })
                refEl.insertAdjacentElement('afterend', saveTo);
                refEl = saveTo;
            }
            Object.keys(EXTRA_APP).forEach(function (key) {
                let app = EXTRA_APP[key];
                if (app.label && app.exec && app.text && app.config && globalConfig[app.config]) {
                    let btn = $C(document, 'button', app);
                    btn.setAttribute("hidden", "false");
                    btn.setAttribute("onclick", "window.DownloadPlus.handleExtraAppBtnClick(event);");
                    refEl.insertAdjacentElement('afterend', btn);
                    refEl = btn;
                }
            });
        },
        handleExtraAppBtnClick: async function (event) {
            let target = event.target;
            let exec = DownloadPlus.handleRelativePath(target.getAttribute('exec')) || "",
                text = target.getAttribute('text') || "",
                header = "",
                cookie = $Cookie(dialog.mLauncher.source.asciiSpec) || "",
                referer = dialog.mSourcePath || gBrowser?.currentURI?.spec || "",
                link = dialog.mLauncher.source.asciiSpec,
                path = Services.prefs.getStringPref("browser.download.lastDir", ""),
                regEx = new RegExp("^data");
            if (regEx.test(link)) {
                internalSave(link, null, "", null, null, false, null, null, null, null, null, false, null, PrivateBrowsingUtils.isBrowserPrivate(gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                return;
            }
            if (exec.length) {
                if (path.length == 0) {
                    let [title] = await document.l10n.formatValues([
                        { id: "choose-download-folder-title" },
                    ]);
                    // firefox 选择保存目录对话框
                    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
                    fp.init(window, title, Ci.nsIFilePicker.modeGetFolder);
                    let result = await new Promise(resolve => fp.open(resolve));
                    if (result != Ci.nsIFilePicker.returnOK) {
                        return;
                    }
                    path = fp.file.path;
                    Services.prefs.setStringPref("browser.download.lastDir", path);
                }
                if (text.indexOf("{cookiePath}") >= 0) {
                    // 无法读取 Firefox 的 cookies.sqlite
                    // text = text.replace("{cookiePath}", FileUtils.getDir("ProfD", ["cookies.sqlite"], true).path);
                    text = text.replace("{cookiePath}", $Cookie(dialog.mLauncher.source.asciiSpec, true));
                }

                if (cookie.length) {
                    header += "Cookie: " + cookie + "\r\n";
                }

                if (referer.length) {
                    header += "Referer: " + referer + "\r\n";
                }

                text = text.replace("{header}", header).replace("{cookie}", cookie).replace("{referer}", referer).replace("{link}", link).replace("{path}", path);

                window.DownloadPlus.exec(exec, text);
            }
            window.close();
        },
        removeFile: function (event) {
            function removeSelectFile(path) {
                let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                try {
                    file.initWithPath(path);
                } catch (e) {

                }
                if (!file.exists()) {
                    if (/\..{0,10}(\.part)$/.test(file.path))
                        file.initWithPath(file.path.replace(".part", ""));
                    else
                        file.initWithPath(file.path + ".part");
                }
                if (file.exists()) {
                    file.permissions |= 0666;
                    file.remove(0);
                }
            }

            var ddBox = document.getElementById("downloadsRichListBox");
            if (!(ddBox && ddBox._placesView)) {
                ddBox = document.getElementById("downloadsListBox");
            }
            if (!ddBox) return;
            var len = ddBox.selectedItems.length;

            for (var i = len - 1; i >= 0; i--) {
                let sShell = ddBox.selectedItems[i]._shell;
                let path = sShell.download.target.path;
                removeSelectFile(path);
                sShell.doCommand("cmd_delete");
            }
        },
        removeFileEnhance: {
            init: function () {
                window.DownloadPlus.clearHistoryOnDelete = Services.prefs.getIntPref("browser.download.clearHistoryOnDelete");
                Services.prefs.setIntPref("browser.download.clearHistoryOnDelete", 2);
                let context = $("downloadsContextMenu");
                context.insertBefore(
                    $C(document, "menuitem", {
                        id: 'downloadRemoveFromHistoryEnhanceMenuItem',
                        class: 'downloadRemoveFromHistoryMenuItem',
                        onclick: "window.DownloadPlus.removeFile()",
                        label: $L("remove from disk")
                    }),
                    context.querySelector(".downloadRemoveFromHistoryMenuItem")
                );
            },
            destroy: function () {
                Services.prefs.setIntPref("browser.download.clearHistoryOnDelete", window.DownloadPlus.clearHistoryOnDelete);
                let context = $("downloadsContextMenu");
                context.removeChild(context.querySelector("#downloadRemoveFromHistoryEnhanceMenuItem"));
            }
        },
        downloadCompleteNotice: {
            DL_START: null,
            DL_DONE: "file:///C:/WINDOWS/Media/chimes.wav",
            DL_CANCEL: null,
            DL_FAILED: null,

            _list: null,
            init: function sampleDownload_init() {
                XPCOMUtils.defineLazyModuleGetter(window, "Downloads",
                    "resource://gre/modules/Downloads.jsm");


                window.addEventListener("unload", this, false);

                //**** 监视下载
                if (!this._list) {
                    Downloads.getList(Downloads.ALL).then(list => {
                        this._list = list;
                        return this._list.addView(this);
                    }).then(null, Cu.reportError);
                }
            },

            uninit: function () {
                window.removeEventListener("unload", this, false);
                if (this._list) {
                    this._list.removeView(this);
                }
            },

            onDownloadAdded: function (aDownload) {
                //**** 开始下载
                if (this.DL_START);
                this.playSoundFile(this.DL_START);
            },

            onDownloadChanged: function (aDownload) {
                //**** 取消下载
                if (aDownload.canceled && this.DL_CANCEL)
                    this.playSoundFile(this.DL_CANCEL)
                //**** 下载失败
                if (aDownload.error && this.DL_FAILED)
                    this.playSoundFile(this.DL_FAILED)
                //**** 完成下载
                if (aDownload.succeeded && this.DL_DONE)
                    this.playSoundFile(this.DL_DONE)
            },

            playSoundFile: function (aFilePath) {
                if (!aFilePath)
                    return;
                var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .createInstance(Components.interfaces["nsIIOService"]);
                try {
                    var uri = ios.newURI(aFilePath, "UTF-8", null);
                } catch (e) {
                    return;
                }
                var file = uri.QueryInterface(Components.interfaces.nsIFileURL).file;
                if (!file.exists())
                    return;

                this.play(uri);
            },

            play: function (aUri) {
                var sound = Components.classes["@mozilla.org/sound;1"]
                    .createInstance(Components.interfaces["nsISound"]);
                sound.play(aUri);
            },

            handleEvent: function (event) {
                switch (event.type) {
                    case "unload":
                        this.uninit();
                        break;
                }
            }
        },
        autoCloseBlankTab: {
            eventListener: {
                onStateChange(aBrowser, aWebProgress, aRequest, aStateFlags, aStatus) {
                    if (!aRequest || !aWebProgress.isTopLevel) return;
                    let location;
                    try {
                        aRequest.QueryInterface(Ci.nsIChannel);
                        location = aRequest.URI;
                    } catch (ex) { }
                    if ((aStateFlags & Ci.nsIWebProgressListener.STATE_STOP) &&
                        (aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) &&
                        location && location.spec !== 'about:blank' &&
                        aBrowser.documentURI && aBrowser.documentURI.spec === 'about:blank' &&
                        Components.isSuccessCode(aStatus) && !aWebProgress.isLoadingDocument
                    ) {
                        setTimeout(() => {
                            gBrowser.removeTab(gBrowser.getTabForBrowser(aBrowser));
                        }, 100);
                    }
                }
            },
            init: function () {
                gBrowser.addProgressListener(this.eventListener);
            },
            destroy: function () {
                gBrowser.removeProgressListener(this.eventListener);
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
                this.appVersion >= 78 ? "chrome://global/skin/icons/info.svg" : "chrome://global/skin/icons/information-32.png", aTitle || "DownloadPlus",
                aMsg + "", !!callback, "", callback);
        },
        log: function () {
            Cu.reportError(Array.prototype.slice.call(arguments));
        },
    }

    if (typeof gBrowserInit !== "undefined") {
        if (gBrowserInit.delayedStartupFinished) window.DownloadPlus.init();
        else {
            let delayedListener = (subject, topic) => {
                if (topic == "browser-delayed-startup-finished" && subject == window) {
                    Services.obs.removeObserver(delayedListener, topic);
                    window.DownloadPlus.init();
                }
            };
            Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
        }
    } else {
        window.DownloadPlus.init();
    }

    function inArray(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return true;
            }
        }
        return false;
    }

    function $(id, aDoc) {
        aDoc || (aDoc = document);
        return aDoc.getElementById(id);
    }

    function $C(doc, tag, props, isHTML = false) {
        let el = isHTML ? doc.createElement(tag) : doc.createXULElement(tag);
        for (let prop in props) {
            el.setAttribute(prop, props[prop])
        }
        return el;
    }

    function $CNS(doc, namespace, type, props) {
        if (!type) return null;
        doc || (doc = document);
        namespace || (namespace = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
        let el = doc.createElementNS(namespace, type);
        for (let prop in props) {
            el.setAttribute(prop, props[prop])
        }
        return el;
    }

    function $L(key, replace) {
        let str = LANG[_LOCALE].hasOwnProperty(key) ? LANG[_LOCALE][key] : (LANG['en-US'].hasOwnProperty(key) ? LANG['en-US'][key] : "undefined");
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }


    function $Cookie(link, saveToFile) {
        saveToFile || (saveToFile = false);
        if (!link) return "";
        let uri = Services.io.newURI(link, null, null),
            cookies = Services.cookies.getCookiesFromHost(uri.host, {}),
            cookieSavePath = DownloadPlus.handleRelativePath(globalConfig["cookie save path"]);
        if (saveToFile) {
            let string = cookies.map(formatCookie).join('');
            let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
            file.initWithPath(cookieSavePath);
            file.append(uri.host + ".txt");
            if (!file.exists()) {
                file.create(0, 0644);
            }
            let foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
            foStream.write(string, string.length);
            foStream.close();
            return file.path;
        } else {
            return cookies.map((el) => el.name + ':' + el.value).join("; ");
        }

        function formatCookie(co) {
            // 转换成 netscape 格式，抄袭自 cookie_txt 扩展
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

    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

})({
    "remove file menuitem": true, // 下载管理增加超级删除菜单
    "download complete notice": true, // 下载完成后播放提示音
    "auto close blank tab": true, // 自动关闭空白的标签页
    "enable rename": true, // 启用重命名
    "enable encoding convert": false, // 启用编码转换
    "enable double click to copy link": true, // 下载对话框双击来源复制链接
    "show extract size": false, // 下载对话框显示文件精确大小 不知道哪个版本开始自带显示
    "default select save button": true, // 下载对话框默认选择保存按钮
    "enable save and open": true, // 下载对话框新增保存并打开按钮
    "enable save as": true, // 下载对话框增加另存为按钮
    "enable save to": true, // 显示快捷保存按钮
    "cookie save path": "\\chrome\\resources\\cookies", // cookie 保存路径，可以是相对路径，相对于配置目录
    "enable aria2 button": false, // 下载对话框增加aria2按钮
    "enable idm button": true, // 下载对话框增加idm按钮
    "enable thunder button": false, // 下载对话框增加thunder按钮
}, `
@-moz-document url("chrome://mozapps/content/downloads/unknownContentType.xhtml") {
    #locationtext {
        outline: none;
        margin-left: 10px;
        border: 1px solid var(--in-content-box-border-color, ThreeDDarkShadow);
    }
}
`);