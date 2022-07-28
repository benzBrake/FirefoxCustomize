// ==UserScript==
// @name            DownloadPlus_ff98.uc.js
// @description     修改整合自（w13998686967、ywzhaiqi、黒仪大螃蟹、Alice0775、紫云飞）
// @author          Ryan
// @include         main
// @include         chrome://browser/content/places/places.xhtml
// @include         chrome://browser/content/places/places.xul
// @include         chrome://mozapps/content/downloads/unknownContentType.xhtml
// @include         chrome://mozapps/content/downloads/unknownContentType.xul
// @version         0.0.2
// @startup         window.DownloadPlus.init();
// @compatibility   Firefox 72
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @note            20220728 预防性修改，防止 Services.jsm 被删除后脚本无法使用（Bug 1667455），增加日志输出开关，修复 FlashGot 配置项无效，改回老方式添加样式，重写改名和编码转换代码，重写双击复制完整链接代码，调整 FlashGot 相关代码结构，修改右下角通知图标，根据个人喜好调节部分样式
// @note            20220727 FlashGot 测试版，还未测试兼容性 (感谢 pouriap 继续改进 FlashGot)
// @note            20220719 修复 72~98 无法使用
// @note            20220717 修复另存为不提示文件名，修复改名后点保存会弹出保存对话框，修复 Firefox 104 OS is not defined
// @note            20220612 完成另存为，改名，转换编码，显示精确大小
// @note            20220611 完成调用第三方 App 下载
// @note            20220610 开始重写代码，完成保存并打开，从硬盘删除
// ==/UserScript==
(function (globalConfig, globalCss, globalDebug) {
    if (window.DownloadPlus) return;
    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const OS = globalThis.OS || Cu.import("resource://gre/modules/osfile/osfile_async_front.jsm").OS;
    const FileUtils = globalThis.FileUtils || Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;

    const LANG = {
        'zh-CN': {
            "remove from disk": "从硬盘删除",
            "file not found": "文件未找到 %s",
            "original name": "默认编码: ",
            "encoding convert tooltip": "点击转换编码",
            "complete link": "链接：",
            "dobule click to copy link": "双击复制链接",
            "use flashgot to download": "FlashGot",
            "default download manager": "（默认）",
            "download by default download manager": "FlashGot 默认",
            "force reload download managers list": "重新读取下载工具列表",
            "reloading download managers list": "正在重新读取下载工具列表，请稍后！",
            "set to default download manger": "设置 %s 为默认下载器",
            "save and open": "保存并打开",
            "save as": "另存为",
            "save to": "保存到",
            "desktop": "桌面",
            "disk label": "%s 盘",
            "button aria2": "Aria2",
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
    }

    window.DownloadPlus = {
        _urls: [],
        FLASHGOT_STRUCTURE: `{num};{download-manager};0;;\n{referer}\n{url}\n{description}\n{cookies}\n{post-data}\n{filename}\n{extension}\n{download-page-referer}\n{download-page-cookies}\n\n\n{user-agent}`,
        get appVersion() {
            return Services.appinfo.version.split(".")[0]
        },
        get dialogElement() {
            return document.documentElement.getButton ? document.documentElement : document.getElementById('unknownContentType');
        },
        get topWin() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get flashgotPath() {
            var flashgotPref,
                flashgotPath;
            try {
                flashgotPref = Services.prefs.getStringPref(this.PREF_FLASHGOT);
            } catch (e) {
                if (globalDebug) this.error(e);
                flashgotPref = "\\chrome\\resources\\tools\\FlashGot.exe";
            }
            flashgotPref = this.handleRelativePath(flashgotPref);
            var flashgotPath = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            flashgotPath.initWithPath(flashgotPref);
            if (flashgotPath.exists())
                return flashgotPath.path;
            else
                return false;
        },
        init: function () {
            if (globalDebug) this.log("DownloadPlus init: " + location.href);
            this.$L = $L;
            switch (location.href) {
                case 'chrome://browser/content/browser.xul':
                case 'chrome://browser/content/browser.xhtml':
                    if (globalConfig["enable save and open"]) this.saveAndOpenMain.init();
                    if (globalConfig["download complete notice"]) this.downloadCompleteNotice.init();
                    if (globalConfig["auto close blank tab"]) this.autoCloseBlankTab.init();
                    if (globalConfig["enable rename"]) this.changeNameMainInit();
                    this.loadDownloadManagersList();
                    break;
                case 'chrome://mozapps/content/downloads/unknownContentType.xul':
                case 'chrome://mozapps/content/downloads/unknownContentType.xhtml':
                    this.addExtraElements();
                    if (globalConfig["enable double click to copy link"]) this.dblClickToCopyLink();
                    if (globalConfig["enable rename"]) this.downloadDialogChangeName();
                    if (globalConfig["show extract size"]) this.downloadDialogShowExtractSize();
                    window.sizeToContent();
                    break;
                case 'chrome://browser/content/places/places.xul':
                case 'chrome://browser/content/places/places.xhtml':
                    if (globalConfig["remove file menuitem"]) this.removeFileEnhance.init();
                    break;

            }
            // this.styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
            // this.STYLE = {
            //     url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(globalCss)),
            //     type: this.styleSheetService.AGENT_SHEET
            // }
            // this.styleSheetService.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
            this.style = addStyle(globalCss);
            if (this.appVersion >= 98 && this.appVersion <= 102) {
                Services.prefs.setBoolPref("browser.download.improvements_to_download_panel", false);
            }
        },
        destroy: function () {
            if (globalDebug) this.log("DownloadPlus destroy: " + location.href);
            switch (location.href) {
                case 'chrome://browser/content/browser.xul':
                case 'chrome://browser/content/browser.xhtml':
                    if (globalConfig["enable save and open"]) this.saveAndOpenMain.destroy();
                    if (globalConfig["download complete notice"]) this.downloadCompleteNotice.destroy();
                    if (globalConfig["auto close blank tab"]) this.autoCloseBlankTab.destroy();
                    if (globalConfig["enable rename"]) this.changeNameMainDestroy();
                    break;
                case 'chrome://mozapps/content/downloads/unknownContentType.xul':
                case 'chrome://mozapps/content/downloads/unknownContentType.xhtml':
                    break;
                case 'chrome://browser/content/places/places.xul':
                case 'chrome://browser/content/places/places.xhtml':
                    if (globalConfig["remove file menuitem"]) this.removeFileEnhance.destroy();
                    break;
            }
            // this.styleSheetService.unregisterSheet(this.STYLE.url, this.STYLE.type);
            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
        },
        handleRelativePath: function (path) {
            if (globalDebug) this.log("DownloadPlus handling path: " + path);
            const OS = this.topWin.OS;
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
                if (globalDebug) this.log("DownloadPlus handle path complete: " + path);
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
                this.error(e);
            }
        },
        copyText: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
        },
        dblClickToCopyLink: function (e) {
            var h = $C(document, 'hbox', { align: 'center' });
            document.querySelector("#source").parentNode.after(h);
            var label = h.appendChild($C(document, 'label', {
                innerHTML: $L("complete link"),
                style: 'margin-top: 1px'
            }));
            var description = h.appendChild($C(document, 'description', {
                id: 'completeLinkDescription',
                class: 'plain',
                flex: 1,
                crop: 'center',
                value: dialog.mLauncher.source.spec,
                tooltiptext: $L("dobule click to copy link"),
            }));
            [label, description].forEach(el => el.setAttribute("ondblclick", 'DownloadPlus.copyText(dialog.mLauncher.source.spec);'))
        },
        changeNameMainInit: function () {
            const obsService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
            const RESPONSE_TOPIC = 'http-on-examine-response';

            this.respObserver = {
                observing: false,
                observe: function (subject, topic, data) {
                    try {
                        let channel = subject.QueryInterface(Ci.nsIHttpChannel);
                        let header = channel.contentDispositionHeader;
                        let associatedWindow = channel.notificationCallbacks
                            .getInterface(Components.interfaces.nsILoadContext)
                            .associatedWindow;
                        associatedWindow.localStorage.setItem(channel.URI.spec, header.split("=")[1]);
                    } catch (e) { };
                },
                start: function () {
                    if (!this.observing) {
                        obsService.addObserver(this, RESPONSE_TOPIC, false);
                        this.observing = true;
                        if (globalDebug) DownloadPlus.log("DownloadPlus change name monitor started!");
                    }
                },
                stop: function () {
                    if (this.observing) {
                        obsService.removeObserver(this, RESPONSE_TOPIC, false);
                        this.observing = false;
                        if (globalDebug) DownloadPlus.log("DownloadPlus change name monitor stopped!");
                    }
                }
            };

            this.respObserver.start();
            addEventListener("beforeunload", function () {
                DownloadPlus.respObserver.stop();
            })
        },
        changeNameMainDestroy: function () {
            if (this.respObserver)
                DownloadPlus.respObserver.stop();
        },
        downloadDialogChangeName: function () {
            let locationHbox = $C(document, 'hbox', {
                id: 'locationHbox',
                flex: 1,
                align: 'center',
            })
            let location = $('location');
            location.hidden = true;
            location.after(locationHbox);
            let locationText = locationHbox.appendChild($CNS(document, "http://www.w3.org/1999/xhtml", "html:input", {
                id: "locationText",
                value: dialog.mLauncher.suggestedFileName,
                flex: 1
            })), encodingConvertButton = locationHbox.appendChild($C(document, 'button', {
                id: 'encodingConvertButton',
                type: 'menu',
                tooltiptext: $L("encoding convert tooltip")
            }));
            let converter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
                .getService(Components.interfaces.nsIScriptableUnicodeConverter);
            let menupopup = $C(document, 'menupopup', {}), orginalString;
            menupopup.appendChild($C(document, 'menuitem', {
                value: dialog.mLauncher.suggestedFileName,
                label: $L("original name") + dialog.mLauncher.suggestedFileName,
                selected: true,
                default: true,
            }));
            try {
                orginalString = (opener.localStorage.getItem(dialog.mLauncher.source.spec) ||
                    dialog.mLauncher.source.asciiSpec.substring(dialog.mLauncher.source.asciiSpec.lastIndexOf("/"))).replace(/[\/:*?"<>|]/g, "");
                opener.localStorage.removeItem(dialog.mLauncher.source.spec)
            } catch (e) {
                orginalString = dialog.mLauncher.suggestedFileName;
            }
            function createMenuitem(encoding) {
                converter.charset = encoding;
                let menuitem = menupopup.appendChild(document.createXULElement("menuitem"));
                menuitem.value = converter.ConvertToUnicode(orginalString).replace(/^"(.+)"$/, "$1");
                menuitem.label = encoding + ": " + menuitem.value;
            }
            ["GB18030", "BIG5", "Shift-JIS"].forEach(function (item) {
                createMenuitem(item)
            });
            menupopup.addEventListener('click', (event) => {
                let { target } = event;
                if (target.localName === "menuitem") {
                    locationText.value = target.value;
                }
            });
            encodingConvertButton.appendChild(menupopup);
            $('mode').addEventListener("select", () => {
                if (dialog.dialogElement("save").selected) {
                    location.hidden = true;
                    locationHbox.hidden = false;
                } else {
                    location.hidden = false;
                    locationHbox.hidden = true;
                }
            });
            dialog.dialogElement("save").selected && dialog.dialogElement("save").click();
            window.addEventListener("dialogaccept", function (event) {
                if ((document.querySelector("#locationText").value != dialog.mLauncher.suggestedFileName) && dialog.dialogElement("save").selected) {
                    event.stopPropagation();
                    var mainwin = DownloadPlus.topWin,
                        fileName = document.querySelector("#locationText") ? document.querySelector("#locationText").value : dialog.mLauncher.suggestedFileName;
                    if (globalDebug) this.log("DownloadPlus change name and save: " + fileName);
                    mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, document, fileName, null, null, false, null, null, null, null, null, true, null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                    close();
                }
            }, true);
            if (globalDebug) this.log("DownloadPlus change name init complete.");
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
            if (globalDebug) this.log("DownloadPlus show extract size init complete.");
        },
        saveAndOpenView: {
            onDownloadChanged: function (dl) {
                if (dl.progress != 100) return;
                if (window.DownloadPlus._urls.indexOf(dl.source.url) > -1) {
                    let target = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                    if (globalDebug) this.log("DownloadPlus opening: " + dl.target.path);
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
                this.Downloads = globalThis.Downloads || Cu.import("resource://gre/modules/Downloads.jsm").Downloads;
                this.Downloads.getList(Downloads.ALL).then(list => { list.addView(window.DownloadPlus.saveAndOpenView).then(null, Cu.reportError); });
                if (globalDebug) DownloadPlus.log("DownloadPlus show extract size init complete.");
            },
            destroy: function () {
                window.DownloadPlus._urls = [];
                this.Downloads.getList(Downloads.ALL).then(list => { list.removeView(window.DownloadPlus.saveAndOpenView).then(null, Cu.reportError); });
                if (globalDebug) DownloadPlus.log("DownloadPlus show extract size destroy complete.");
            }
        },
        addExtraElements: function () {
            setTimeout(() => {
                dialog.dialogElement("basicBox").setAttribute("collapsed", true);
                dialog.dialogElement("normalBox").setAttribute("collapsed", false);
            }, 90);
            var refEl = this.dialogElement.getButton("accept");
            refEl.setAttribute('accesskey', 'C');
            this.dialogElement.getButton("cancel").setAttribute('accesskey', 'Q');
            if (globalConfig["enable save and open"]) {
                let saveAndOpen = $C(document, 'button', {
                    id: 'save-and-open',
                    label: $L("save and open"),
                    accesskey: 'P',
                    hidden: false,
                });
                saveAndOpen.addEventListener('click', () => {
                    Services.wm.getMostRecentWindow("navigator:browser").DownloadPlus._urls.push(dialog.mLauncher.source.asciiSpec);
                    document.querySelector("#save").click();
                    window.DownloadPlus.dialogElement.getButton("accept").disabled = 0;
                    window.DownloadPlus.dialogElement.getButton("accept").click();
                });
                refEl = refEl.insertAdjacentElement('afterend', saveAndOpen);
                if (globalDebug) this.log("DownloadPlus save and open init complete.");
            }
            if (globalConfig["elable flashgot integration"]) {
                if (this.flashgotPath) {
                    let modeGroup = dialog.dialogElement('mode');
                    let flashgotHbox = $C(document, 'hbox');
                    modeGroup.appendChild(flashgotHbox);
                    let flashgotRadio = $C(document, 'radio', {
                        id: 'flashgot',
                        label: $L("use flashgot to download"),
                        accesskey: 'F',
                    });
                    flashgotHbox.appendChild(flashgotRadio);
                    let flashgotDeck = $C(document, 'deck', {
                        id: 'flashgotDeck',
                        flex: 1
                    });
                    flashgotHbox.appendChild(flashgotDeck);
                    let flashgotListHbox = $C(document, 'hbox', {
                        flex: 1,
                        align: 'center'
                    })
                    flashgotDeck.appendChild(flashgotListHbox);
                    let flashgotHandler = $C(document, 'menulist', {
                        id: 'flashgotHandler',
                        flex: 1,
                        native: true
                    });
                    flashgotListHbox.appendChild(flashgotHandler);
                    let flashgotPopup = $C(document, 'menupopup', {});
                    flashgotHandler.appendChild(flashgotPopup);

                    this.refreshDownloadManagersPopup(flashgotPopup);

                    let flashgotDownloadByDefault = $C(document, 'toolbarbutton', {
                        id: 'flashgotDownloadByDefault',
                        tooltiptext: $L("download by default download manager"),
                        class: "toolbarbutton-1",
                        style: 'list-style-image: url(chrome://browser/skin/downloads/downloads.svg)',
                        accesskey: "D",
                        onclick: function (event) {
                            var flashgotPopup = event.target.ownerDocument.getElementById("flashgotHandler").querySelector("menupopup");
                            event.target.ownerGlobal.DownloadPlus.handleFlashGotBtnClick({ target: flashgotPopup.querySelector('[selected="true"]') });
                        }
                    });

                    let flashgotReloadManagers = $C(document, 'toolbarbutton', {
                        id: 'flasgotReload',
                        tooltiptext: $L("force reload download managers list"),
                        class: "toolbarbutton-1",
                        style: 'list-style-image: url(chrome://global/skin/icons/reload.svg)',
                        accesskey: "R",
                        onclick: function (event) {
                            let { target } = event;
                            let { ownerGlobal: win, ownerDocument: aDoc } = target;
                            let hbox = aDoc.getElementById("flashgot").parentNode;
                            let popup = target.parentNode.querySelector("menupopup");
                            hbox.childNodes.forEach(el => el.setAttribute('disabled', true));
                            win.DownloadPlus.loadDownloadManagersList(true, true);
                            setTimeout(() => {
                                win.DownloadPlus.refreshDownloadManagersPopup(popup)
                                hbox.childNodes.forEach(el => el.disabled = false);
                            }, 5500);
                        }
                    });

                    let flashgotSetDefault = $C(document, 'toolbarbutton', {
                        id: "flasgotSetDefault",
                        class: "toolbarbutton-1",
                        accesskey: "D",
                        style: 'list-style-image: url(chrome://global/skin/icons/settings.svg)',
                        onclick: function (event) {
                            let { target } = event;
                            let { ownerGlobal: win } = target;
                            let popup = target.parentNode.querySelector("menupopup");
                            let selectedManager = popup.querySelector('[selected="true"]');
                            if (selectedManager && selectedManager.hasAttribute("manager")) {
                                let { Services } = win;
                                Services.prefs.setStringPref(win.DownloadPlus.PREF_FLASHGOT_DEFAULT, selectedManager.getAttribute("manager"));
                                win.DownloadPlus.refreshDownloadManagersPopup(popup);
                            }
                        },
                        onmouseover: function (event) {
                            let { target } = event;
                            let { ownerGlobal: win } = target;
                            let popup = target.parentNode.querySelector("menupopup");
                            let selectedManager = popup.querySelector('[selected="true"]');
                            this.setAttribute('tooltiptext', win.DownloadPlus.$L("set to default download manger", selectedManager.getAttribute("label")));
                        }
                    });
                    flashgotHbox.appendChild(flashgotDownloadByDefault);
                    flashgotHbox.appendChild(flashgotReloadManagers);
                    flashgotHbox.appendChild(flashgotSetDefault);
                    function flashgotDefaultDownload(event) {
                        window.DownloadPlus.handleFlashGotBtnClick({ target: flashgotPopup.querySelector('[selected="true"]') });
                    }
                    dialog.onOK = (function () {
                        var cached_function = dialog.onOK;
                        return function () {
                            if (flashgotRadio.selected)
                                return flashgotDefaultDownload.apply(this, arguments);
                            else
                                return cached_function.apply(this, arguments);
                        };
                    })();
                    // disable remember choice when downloadplus radio is selected
                    dialog.dialogElement('mode').addEventListener("select", function (event) {
                        const flashGotRadio = $('flashgot');
                        const rememberChoice = $('rememberChoice');
                        const flashgot = $('flashgot');
                        var other = true;
                        if (flashGotRadio && flashGotRadio.selected) {
                            rememberChoice.disabled = true;
                            other = false;
                        }
                        if (flashgot && flashgot.selected) {
                            other = false;
                        }
                        if (other) {
                            rememberChoice.disabled = false;
                        }
                    });
                    if (globalDebug) this.log("DownloadPlus flashgot init complete.");
                } else {
                    if (globalDebug) this.error("DownloadPlus flashgot init failed, open about:config and set " + this.PREF_FLASHGOT);
                }
            }

            if (globalConfig["enable save as"]) {
                let saveAs = $C(document, 'button', {
                    id: 'saveAs',
                    label: $L("save as"),
                    accesskey: 'E'
                })
                saveAs.addEventListener("command", () => {
                    var mainwin = DownloadPlus.topWin;
                    // 感谢 ycls006
                    mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, null, (document.querySelector("#locationText") ? document.querySelector("#locationText").value : dialog.mLauncher.suggestedFileName), null, null, false, null, null, null, null, null, false, null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                    close();
                });
                refEl = refEl.insertAdjacentElement('afterend', saveAs);
                if (globalDebug) DownloadPlus.log("DownloadPlus save as init complete.");
            }
            let shadowRoot = document.getElementById('unknownContentType').shadowRoot,
                link = $CNS(document, 'http://www.w3.org/1999/xhtml', 'html:link', {
                    rel: 'stylesheet',
                    href: 'chrome://global/content/widgets.css'
                });
            shadowRoot.insertBefore(link, shadowRoot.firstChild);
            refEl || (refEl = this.dialogElement.getButton("accept").nextSibling);
            if (globalConfig["enable save to"]) {
                let saveTo = $C(document, 'button', {
                    label: $L("save to"),
                    class: 'dialog-button',
                    hidden: false,
                    type: 'menu',
                    accesskey: 'T'
                }), saveToMenu = $C(document, 'menupopup', {});
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
                        file.initWithPath(path + (document.querySelector("#locationText") ? document.querySelector("#locationText").value : document.querySelector("#location").value).trim());
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
                if (globalDebug) DownloadPlus.log("DownloadPlus save to init complete.");
            }
            Object.keys(EXTRA_APP).forEach(function (key) {
                let app = EXTRA_APP[key];
                if (app.label && app.exec && app.text && app.config && globalConfig[app.config]) {
                    let btn = $C(document, 'button', app);
                    btn.setAttribute("hidden", "false");
                    btn.classList.add('dialog-button');
                    btn.setAttribute("onclick", "window.DownloadPlus.handleExtraAppBtnClick(event);");
                    refEl.insertAdjacentElement('afterend', btn);
                    refEl = btn;
                    if (globalDebug) DownloadPlus.log("DownloadPlus estra app [" + app.label + "] init complete.");
                }

            });
        },
        loadDownloadManagersList(forceLoad, notify) {
            this.FLASHGOT_DOWNLOAD_MANSGERS = [];
            if (notify) this.alert($L("reloading download managers list"));
            if (this.flashgotPath) {
                try {
                    let prefVal = Services.prefs.getStringPref(this.PREF_FLASHGOT_DOWNLOAD_MANAGERS);
                    this.FLASHGOT_DOWNLOAD_MANSGERS = prefVal.split(",");
                } catch (e) { forceLoad = true }
                if (forceLoad) {
                    // get download managers list from flashgot
                    var dmPathTextPath = PathUtils.join(this.handleRelativePath("{tmpDir}\\.flashgot.dm.txt"));
                    this.exec(this.flashgotPath, ["-o", dmPathTextPath]);
                    let that = this;
                    setTimeout(function () {
                        var dmText = readFile(dmPathTextPath);
                        that.FLASHGOT_DOWNLOAD_MANSGERS = dmText.split("\n").filter(l => l.includes("|OK")).map(l => l.replace("|OK", ""))
                        removeFile(dmPathTextPath);
                        Services.prefs.setStringPref(that.PREF_FLASHGOT_DOWNLOAD_MANAGERS, that.FLASHGOT_DOWNLOAD_MANSGERS.join(","));
                    }, 5000);
                }
                if (globalDebug) DownloadPlus.log("DownloadPlus load download managers list complete.");
            }
        },
        refreshDownloadManagersPopup(flashgotPopup) {
            if (!flashgotPopup) return;
            // remove all download managers items
            flashgotPopup.querySelectorAll("menuitem").forEach(el => el.parentNode.removeChild(el));
            this.topWin.DownloadPlus.FLASHGOT_DOWNLOAD_MANSGERS.forEach(m => {
                let menuitemDownload = $C(document, 'menuitem', {
                    label: m,
                    manager: m,
                    id: "dm-" + hashText(m),
                    onclick: function (event) {
                        let { target } = event;
                        let { ownerDocument: aDoc, ownerGlobal: win } = target;
                        target.parentNode.querySelectorAll("menuitem").forEach(el => el.removeAttribute("selected"));
                        if (target.getAttribute('default')) {
                            setTimeout(() => {
                                aDoc.querySelector("#flashgotHandler").setAttribute('label', target.label + win.DownloadPlus.$L("default download manager"));
                            }, 20);
                        } else {
                            aDoc.querySelector("#flashgotHandler").setAttribute('label', target.label);
                        }
                        target.setAttribute("selected", true);
                        aDoc.querySelector("#flashgot").click();
                    }
                });
                flashgotPopup.appendChild(menuitemDownload);
            });

            let defaultElement;
            try {
                let name = Services.prefs.getStringPref(this.PREF_FLASHGOT_DEFAULT);
                let el;
                if (name) el = flashgotPopup.querySelector('#dm-' + hashText(name));
                defaultElement = el || flashgotPopup.firstChild;
            } catch (e) {
                console.error(e);
                defaultElement = flashgotPopup.firstChild;
            }
            if (defaultElement) {
                defaultElement.setAttribute('selected', true);
                defaultElement.setAttribute('default', true);
                $("flashgotHandler").setAttribute('label', defaultElement.getAttribute('label') + $L("default download manager"));
            }
        },
        handleFlashGotBtnClick: function (event) {
            let { target } = event;
            if (target.hasAttribute("manager")) {
                // make string support replace with array
                function replaceArray(replaceString, find, replace) {
                    var regex;
                    for (var i = 0; i < find.length; i++) {
                        regex = new RegExp(find[i], "g");
                        replaceString = replaceString.replace(regex, replace[i]);
                    }
                    return replaceString;
                };
                var { targetFile: partFile } = dialog.mLauncher; // Future may be take use of part file
                var { asciiSpec, username, userPass } = dialog.mLauncher.source,
                    fileName = (document.querySelector("#locationText") ? document.querySelector("#locationText").value : dialog.mLauncher.suggestedFileName),
                    { userAgent } = navigator;
                var initData = replaceArray(this.FLASHGOT_STRUCTURE, [
                    '{num}',
                    '{download-manager}',
                    '{referer}',
                    '{url}',
                    '{description}',
                    '{cookies}',
                    '{post-data}',
                    '{filename}',
                    '{extension}',
                    '{download-page-referer}',
                    '{download-page-cookies}',
                    '{user-agent}'
                ], [
                    1,
                    target.getAttribute("manager"),
                    dialog.mSourcePath || "",
                    asciiSpec,
                    "",
                    $Cookie(asciiSpec),
                    "", // need to implement
                    fileName,
                    dialog.mLauncher.MIMEInfo.primaryExtension,
                    "", // need to implement
                    $Cookie(dialog.mSourcePath) || "",
                    userAgent // need to implement custom agent
                ])
                var initFilePath = this.handleRelativePath("{tmpDir}\\" + hashText(asciiSpec) + ".dl.properties")
                saveFile(initFilePath, initData);
                this.exec(this.flashgotPath, initFilePath);
                if (globalDebug) this.log("DownloadPlus calling flashgot", this.flashgotPath, initFilePath);
            } else {
                this.alert($L("operate not support"));
            }
            close();
        },
        handleExtraAppBtnClick: async function (event) {
            let target = event.target;
            let exec = DownloadPlus.handleRelativePath(target.getAttribute('exec')) || "",
                text = target.getAttribute('text') || "",
                header = "",
                cookie = $Cookie(dialog.mLauncher.source.asciiSpec) || "",
                referer = dialog.mSourcePath || gBrowser.currentURI.spec || "",
                link = dialog.mLauncher.source.asciiSpec,
                path = Services.prefs.getStringPref("browser.download.lastDir", ""),
                regEx = new RegExp("^data");
            if (regEx.test(link)) {
                internalSave(link, null, "", null, null, false, null, null, null, null, null, false, null, PrivateBrowsingUtils.isBrowserPrivate(gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                return;
            }
            if (exec.length) {
                if (path.length == 0) {
                    let title;
                    if (document.l10n) {
                        [title] = await document.l10n.formatValues([
                            { id: "choose-download-folder-title" },
                        ]);
                    }
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
                if (window.DownloadPlus.appVersion >= 98) {
                    window.DownloadPlus.clearHistoryOnDelete = Services.prefs.getIntPref("browser.download.clearHistoryOnDelete");
                    Services.prefs.setIntPref("browser.download.clearHistoryOnDelete", 2);
                }
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
                if (window.DownloadPlus.appVersion >= 98)
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
                    if (!aRequest || aWebProgress && !aWebProgress.isTopLevel) return;
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
                this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "DownloadPlus",
                aMsg + "", !!callback, "", callback);
        },
        error: function () {
            Cu.reportError(Array.prototype.slice.call(arguments));
        },
        log: function () {
            console.log(Array.prototype.slice.call(arguments));
        },
        PREF_FLASHGOT_DEFAULT: 'userChromeJS.downloadPlus.flashgotDefaultManager',
        PREF_FLASHGOT_DOWNLOAD_MANAGERS: 'userChromeJS.downloadPlus.flashgotManagers',
        PREF_FLASHGOT: 'userChromeJS.downloadPlus.flashgotPath'
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
            let val = props[prop];
            if (prop === 'innerHTML') {
                el.innerHTML = val;
            } else {
                if (typeof val === "function") {
                    val = "(" + val.toString() + ").call(this, event);";
                }
                el.setAttribute(prop, val);
            }
        }
        if (inArray(['menu', 'menuitem'], tag))
            el.classList.add(tag + "-iconic");
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
        if (!LANG[_LOCALE]) return key;
        let str = LANG[_LOCALE].hasOwnProperty(key) ? LANG[_LOCALE][key] : key;
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
            cookieSavePath = DownloadPlus.handleRelativePath("{tmpDir}");
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

    function saveFile(aFileOrPath, data, encoding) {
        encoding || (encoding = "UTF-8");
        var aFile;
        if (typeof aFileOrPath == "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);;
            aFile.initWithPath(aFileOrPath);
        } else {
            aFile = aFileOrPath;
        }
        var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        suConverter.charset = encoding;
        data = suConverter.ConvertFromUnicode(data);
        var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        foStream.init(aFile, 0x02 | 0x08 | 0x20, 0664, 0);
        foStream.write(data, data.length);
        foStream.close();
    }

    function readFile(aFileOrPath, encoding) {
        encoding || (encoding = "UTF-8");
        var aFile;
        if (typeof aFileOrPath == "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);;
            aFile.initWithPath(aFileOrPath);
        } else {
            aFile = aFileOrPath;
        }
        if (aFile.exists()) {
            let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
            stream.init(aFile, 0x01, 0, 0);
            let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
            cvstream.init(stream, encoding, 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            let content = '',
                data = {};
            while (cvstream.readString(4096, data)) {
                content += data.value;
            }
            cvstream.close();
            return content.replace(/\r\n?/g, '\n');
        } else {
            return "";
        }
    }

    function removeFile(aFileOrPath) {
        var aFile;
        if (typeof aFileOrPath == "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);;
            aFile.initWithPath(aFileOrPath);
        } else {
            aFile = aFileOrPath;
        }
        if (aFile.exists()) {
            aFile.permissions |= 0666;
            aFile.remove(0);
            return true;
        } else {
            return false;
        }
    }

    function hashText(text, type) {
        if (!(typeof text == 'string' || text instanceof String)) {
            text = "";
        }
        var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

        converter.charset = "UTF-8";
        var result = {};
        var data = converter.convertToByteArray(text, result);

        if (Ci.nsICryptoHash[type]) {
            type = Ci.nsICryptoHash[type]
        } else {
            type = 2;
        }
        var hasher = Cc["@mozilla.org/security/hash;1"].createInstance(
            Ci.nsICryptoHash
        );

        text = null;
        hasher.init(type);
        hasher.update(data, data.length);
        var hash = hasher.finish(false);
        str = data = hasher = null;

        function toHexString(charCode) {
            return ("0" + charCode.toString(16)).slice(-2);
        }

        return Array.from(hash, (c, i) => toHexString(hash.charCodeAt(i))).join("");
    }
})({
    "remove file menuitem": true, // 下载管理增加超级删除菜单
    "download complete notice": true, // 下载完成后播放提示音
    "auto close blank tab": true, // 自动关闭空白的标签页
    "enable rename": true, // 启用重命名
    "enable double click to copy link": true, // 下载对话框双击来源复制链接
    "show extract size": false, // 下载对话框显示文件精确大小 不知道哪个版本开始自带显示
    "enable save and open": true, // 下载对话框新增保存并打开按钮
    "enable save as": true, // 下载对话框增加另存为按钮
    "enable save to": true, // 显示快捷保存按钮
    "enable aria2 button": false, // 下载对话框增加aria2按钮
    "elable flashgot integration": true, // 下载对话框增加 FlashGot 功能
}, `
@-moz-document url-prefix("chrome://mozapps/content/downloads/unknownContentType.x") {
    #location {
        padding: 3px 0;
    }
    #location,
    #locationHbox {
        height: 22px;
    }
    #locationText {
        border: 1px solid var(--in-content-box-border-color, ThreeDDarkShadow);
        padding-inline: 5px;
        flex: 1;
        appearance: none;
        padding-block: 2px;
        margin: 0;
    }
    #locationHbox {
        display: flex;
    }
    #locationHbox[hidden="true"] {
        visibility: collapse;
    }
    #encodingConvertButton {
        min-width: unset;
        list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik0zLjYwMzUxNTYgMkwwIDEyLjc5Mjk2OUwwIDEzTDEgMTNMMSAxMi45NTcwMzFMMS45ODYzMjgxIDEwTDcuMDE5NTMxMiAxMEw4IDEyLjk1NTA3OEw4IDEzTDkgMTNMOSAxMi43OTQ5MjJMNS40MTYwMTU2IDJMNC41IDJMMy42MDM1MTU2IDIgeiBNIDQuMzIyMjY1NiAzTDQuNSAzTDQuNjk1MzEyNSAzTDYuNjg3NSA5TDIuMzIwMzEyNSA5TDQuMzIyMjY1NiAzIHogTSAxMSA1TDExIDZMMTMuNSA2QzE0LjMzNTAxNSA2IDE1IDYuNjY0OTg0OSAxNSA3LjVMMTUgOC4wOTM3NUMxNC44NDI3NSA4LjAzNzEzMzUgMTQuNjc1NjcgOCAxNC41IDhMMTEuNSA4QzEwLjY3NzQ2OSA4IDEwIDguNjc3NDY4NiAxMCA5LjVMMTAgMTEuNUMxMCAxMi4zMjI1MzEgMTAuNjc3NDY5IDEzIDExLjUgMTNMMTMuNjcxODc1IDEzQzE0LjE0NjI5NyAxMyAxNC42MDQ0ODYgMTIuODYwMDg0IDE1IDEyLjYxMTMyOEwxNSAxM0wxNiAxM0wxNiAxMS43MDcwMzFMMTYgOS41TDE2IDcuNUMxNiA2LjEyNTAxNTEgMTQuODc0OTg1IDUgMTMuNSA1TDExIDUgeiBNIDExLjUgOUwxNC41IDlDMTQuNzgxNDY5IDkgMTUgOS4yMTg1MzE0IDE1IDkuNUwxNSAxMS4yOTI5NjlMMTQuNzMyNDIyIDExLjU2MDU0N0MxNC40NTEwNzQgMTEuODQxODk1IDE0LjA2OTE3MSAxMiAxMy42NzE4NzUgMTJMMTEuNSAxMkMxMS4yMTg1MzEgMTIgMTEgMTEuNzgxNDY5IDExIDExLjVMMTEgOS41QzExIDkuMjE4NTMxNCAxMS4yMTg1MzEgOSAxMS41IDkgeiIvPjwvc3ZnPg==);
        border-radius: 0;
        margin-block: 0;
        margin-inline: 0;
        outline: none;
        appearance: none;
        border: 1px solid var(--in-content-box-border-color, ThreeDDarkShadow);
    }
    #completeLinkDescription {
        max-width: 340px;
        cursor:pointer;
    }
    menupopup > menuitem, menupopup > menu {
        padding-block: 4px;
    }
    [disabled="true"] {
        color: GrayText !important;
    }
}
`,
    false);