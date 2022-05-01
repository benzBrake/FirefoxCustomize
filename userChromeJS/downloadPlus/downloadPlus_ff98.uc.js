// ==UserScript==
// @name           下载增强(FF98+)
// @description    下载增强整合修复版
// @author         Ryan 再次修改整合 (w13998686967、ywzhaiqi、黒仪大螃蟹、Alice0775、紫云飞)
// @include        chrome://browser/content/browser.xhtml
// @include        chrome://browser/content/places/places.xul
// @include        chrome://browser/content/places/places.xhtml
// @include        chrome://mozapps/content/downloads/unknownContentType.xul
// @include        chrome://mozapps/content/downloads/unknownContentType.xhtml
// @include        chrome://mozapps/content/downloads/downloads.xul
// @include        chrome://mozapps/content/downloads/downloads.xhtml
// @version        2022.05.01 修正 因为我这里 Bug 1750484 用不了， 暂时修一修从硬盘删除文件
// @version        2022.04.09 修正 保存并且打开
// @version        2022.04.06 修正 另存为功能
// @version        2022.03.18 修正 FF98 下完全不能用，加入第三方下载工具功能
// @version        2014.11.02 增加多个功能
// @version        2014.06.06 add delay to fix for new userChrome.js
// ==/UserScript==

(function () {
    var dpConfig = {
        addDownload: false, // 新建下载 (不能用，不会修)
        addDownloadEncoding: true, //(新建下载)弹窗             false,不弹窗
        removeFile: true, // 从硬盘中删除
        downloadNotice: false, // 下载完成通知
        showExtractSize: true, // 精确显示文件大小
        closeBlankTab: true, // 自动关闭下载产生的空白标签
        showSaveAndOpen: true, // 保存并且打开
        enableReName: true, // 启用改名功能
        renameLockSave: false, //true,(下载改名)自动锁定保存文件 false,不锁定 (不知道有什么用没修)
        reNameEncodingConvert: false, //true,(下载改名)开启下拉菜单选项 false,关闭下拉菜单选项
        showDownloadSpeed: false, // 显示下载速度 (不能用了)
        showSaveAs: true, // 另存为
        enableExtraApp: true, // 启用第三方工具下载
        extraAppPath: "C:\\Program\ Files\ (x86)\\Internet\ Download\ Manager\\IDMan.exe", // 下载工具路径
        extraAppParam: "/d {{url}}", // 下载工具参数 {{url}} 代表传递的下载链接
        showSaveTo: false, //保存到...
        showCompeleteUrl: true, // 显示完整下载链接
        dobuleClickToSave: true, // 下载弹出窗口双击保存文件项执行下载 (这个也没修)
    }

    var dpText = {
        newDownload: "新建下载",
        extraAppName: "IDM",
        canNotUseExtra: "此类链接不支持调用第三方工具下载",
        notExist: " 不存在: ",
        removeFromDisk: "从硬盘中删除",
        saveAndOpen: "保存并打开",
        ctrlToConvertEncode: "Ctrl+点击转换url编码\n左键:UNICODE\n右键:GB2312",
        saveAs: "另存为",
        dobuleClickToCopy: "双击复制链接"
    }

    if (!window.Services) Components.utils.import("resource://gre/modules/Services.jsm");
    if (!window.DownloadUtils) Components.utils.import("resource://gre/modules/DownloadUtils.jsm");

    Services.prefs.setBoolPref("browser.download.improvements_to_download_panel", false);

    switch (location.href) {
        case "chrome://browser/content/browser.xhtml":
            setTimeout(function () {
                if (dpConfig.addDownload) addDownload(); // 新建下载
                if (dpConfig.removeFile) downloadsPanelRemoveFile(); // 从硬盘中删除
                if (dpConfig.downloadNotice) downloadSoundPlay(); // 下载完成提示音
                if (dpConfig.showExtractSize) downloadFileSize(); // 精确显示文件大小
                if (dpConfig.closeBlankTab) autoCloseBlankTab(); // 自动关闭下载产生的空白标签
                if (dpConfig.showSaveAndOpen) saveAndOpenMain(); // 跟下面的 saveAndOpen 配合使用
                if (dpConfig.enableReName) downloadReNameMain(); // 跟下面的 downloadRename 配合使用
                if (dpConfig.showDownloadSpeed) downloadSpeed(); //下载面板显示下载速度
            }, 200);
            break;
        case "chrome://mozapps/content/downloads/unknownContentType.xul":
        case "chrome://mozapps/content/downloads/unknownContentType.xhtml":
            setTimeout(function () {
                if (dpConfig.showSaveAndOpen) saveAndOpen(); // 保存并打开
                if (dpConfig.enableReName) downloadReName(); // 下载改名
                if (dpConfig.showSaveAs) downloadSaveAs(); // 另存为...
                if (dpConfig.enableExtraApp) downloadDialogExtraApp(); // 第三方工具下载
                if (dpConfig.showSaveTo) downloadSaveTo(); // 保存到...
                if (dpConfig.showCompeleteUrl) downloadShowCompleteURL(); // 下载弹出窗口双击链接复制完整链接
                if (dpConfig.dobuleClickToSave) doubleClickToSave(); // 下载弹出窗口双击保存文件项执行下载
                if (dpConfig.defaultActionToSave) defaultActionToSave(); // 默认选中下载
                window.sizeToContent(); // 下载弹出窗口大小自适应(确保在添加的按钮之后加载)
            }, 200);
            break;
        case "chrome://browser/content/places/places.xul":
        case "chrome://browser/content/places/places.xhtml":
            setTimeout(function () {
                if (dpConfig.addDownload) addDownload(); // 新建下载(我的足迹)
                if (dpConfig.removeFile) downloadsPanelRemoveFile(); // 从硬盘中删除(我的足迹)
            }, 200);
            break;
    }

    const dialogElement = document.documentElement.getButton ? document.documentElement : document.getElementById('unknownContentType');

    // 下载完成提示音
    function downloadSoundPlay() {
        var downloadPlaySound = {

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
        }
        downloadPlaySound.init();
    }

    //新建下载
    function addDownload() {
        var createDownloadDialog = function () {
            let win = Services.wm.getMostRecentBrowserWindow();
            if (dpConfig.encoding)
                win.openDialog("data:application/vnd.mozilla.xul+xml;charset=UTF-8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPD94bWwtc3R5bGVzaGVldCBocmVmPSJjaHJvbWU6Ly9nbG9iYWwvc2tpbi8iIHR5cGU9InRleHQvY3NzIj8+Cjx3aW5kb3cgeG1sbnM9Imh0dHA6Ly93d3cubW96aWxsYS5vcmcva2V5bWFzdGVyL2dhdGVrZWVwZXIvdGhlcmUuaXMub25seS54dWwiIHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiB0aXRsZT0i5paw5bu65LiL6L295Lu75YqhIj4KCTxoYm94IGFsaWduPSJjZW50ZXIiIHRvb2x0aXB0ZXh0PSJodHRwOi8vd3d3LmV4YW1wbGUuY29tL1sxLTEwMC0zXSAgKFvlvIDlp4st57uT5p2fLeS9jeaVsF0pIj4KCQk8bGFiZWwgdmFsdWU9IuaJuemHj+S7u+WKoSI+PC9sYWJlbD4KCQk8dGV4dGJveCBmbGV4PSIxIi8+Cgk8L2hib3g+Cgk8dGV4dGJveCBpZD0idXJscyIgbXVsdGlsaW5lPSJ0cnVlIiBmbGV4PSIxIi8+Cgk8aGJveCBkaXI9InJldmVyc2UiPgoJCTxidXR0b24gbGFiZWw9IuW8gOWni+S4i+i9vSIvPgoJPC9oYm94PgoJPHNjcmlwdD4KCQk8IVtDREFUQVsKCQlmdW5jdGlvbiBQYXJzZVVSTHMoKSB7CgkJCXZhciBiYXRjaHVybCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoInRleHRib3giKS52YWx1ZTsKCQkJaWYgKC9cW1xkKy1cZCsoLVxkKyk/XF0vLnRlc3QoYmF0Y2h1cmwpKSB7CgkJCQlmb3IgKHZhciBtYXRjaCA9IGJhdGNodXJsLm1hdGNoKC9cWyhcZCspLShcZCspLT8oXGQrKT9cXS8pLCBpID0gbWF0Y2hbMV0sIGogPSBtYXRjaFsyXSwgayA9IG1hdGNoWzNdLCB1cmxzID0gW107IGkgPD0gajsgaSsrKSB7CgkJCQkJdXJscy5wdXNoKGJhdGNodXJsLnJlcGxhY2UoL1xbXGQrLVxkKygtXGQrKT9cXS8sIChpICsgIiIpLmxlbmd0aCA8IGsgPyAoZXZhbCgiMTBlIiArIChrIC0gKGkgKyAiIikubGVuZ3RoKSkgKyAiIikuc2xpY2UoMikgKyBpIDogaSkpOwoJCQkJfQoJCQkJZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiI3VybHMiKS52YWx1ZSA9IHVybHMuam9pbigiXG4iKTsKCQkJfSBlbHNlIHsKCQkJCWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIiN1cmxzIikudmFsdWUgPSBiYXRjaHVybDsKCQkJfQoJCX0KCQl2YXIgb3duZXIgPSB3aW5kb3cub3BlbmVyOwoJCXdoaWxlKG93bmVyLm9wZW5lciAmJiAhb3duZXIubG9jYXRpb24uc3RhcnRXaXRoKCJjaHJvbWU6Ly9icm93c2VyL2NvbnRlbnQvYnJvd3Nlci54IikpewoJCQlvd25lciA9IG93bmVyLm9wZW5lcjsKCQl9CnZhciBtYWlud2luID0gQ29tcG9uZW50cy5jbGFzc2VzWyJAbW96aWxsYS5vcmcvYXBwc2hlbGwvd2luZG93LW1lZGlhdG9yOzEiXS5nZXRTZXJ2aWNlKENvbXBvbmVudHMuaW50ZXJmYWNlcy5uc0lXaW5kb3dNZWRpYXRvcikuZ2V0TW9zdFJlY2VudFdpbmRvdygibmF2aWdhdG9yOmJyb3dzZXIiKTsJCQlkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCJ0ZXh0Ym94IikuYWRkRXZlbnRMaXN0ZW5lcigia2V5dXAiLCBQYXJzZVVSTHMsIGZhbHNlKTsKCQlkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCJidXR0b24iKS5hZGRFdmVudExpc3RlbmVyKCJjb21tYW5kIiwgZnVuY3Rpb24gKCkgewkJZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiI3VybHMiKS52YWx1ZS5zcGxpdCgiXG4iKS5mb3JFYWNoKGZ1bmN0aW9uICh1cmwpIHsKCQkJCW93bmVyLnNhdmVVUkwodXJsICwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbWFpbndpbi5kb2N1bWVudCk7CgkJCX0pOwoJCQljbG9zZSgpCgkJfSwgZmFsc2UpOwoJCWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoInRleHRib3giKS52YWx1ZSA9IG93bmVyLnJlYWRGcm9tQ2xpcGJvYXJkKCk7CgkJUGFyc2VVUkxzKCk7CgkJXV0+Cgk8L3NjcmlwdD4KPC93aW5kb3c+", "name", "top=" + (window.screenY + window.innerHeight / 4 - 50) + ",left=" + (window.screenX + window.innerWidth / 2 - 250));
            else
                win.openDialog("data:application/vnd.mozilla.xul+xml;charset=UTF-8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPD94bWwtc3R5bGVzaGVldCBocmVmPSJjaHJvbWU6Ly9nbG9iYWwvc2tpbi8iIHR5cGU9InRleHQvY3NzIj8+Cjx3aW5kb3cgeG1sbnM9Imh0dHA6Ly93d3cubW96aWxsYS5vcmcva2V5bWFzdGVyL2dhdGVrZWVwZXIvdGhlcmUuaXMub25seS54dWwiIHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiB0aXRsZT0i5paw5bu65LiL6L295Lu75YqhIj4KCTxoYm94IGFsaWduPSJjZW50ZXIiIHRvb2x0aXB0ZXh0PSJodHRwOi8vd3d3LmV4YW1wbGUuY29tL1sxLTEwMC0zXSAgKFvlvIDlp4st57uT5p2fLeS9jeaVsF0pIj4KCQk8bGFiZWwgdmFsdWU9IuaJuemHj+S7u+WKoSI+PC9sYWJlbD4KCQk8dGV4dGJveCBmbGV4PSIxIi8+Cgk8L2hib3g+Cgk8dGV4dGJveCBpZD0idXJscyIgbXVsdGlsaW5lPSJ0cnVlIiBmbGV4PSIxIi8+Cgk8aGJveCBkaXI9InJldmVyc2UiPgoJCTxidXR0b24gbGFiZWw9IuW8gOWni+S4i+i9vSIvPgoJPC9oYm94PgoJPHNjcmlwdD4KCQk8IVtDREFUQVsKCQlmdW5jdGlvbiBQYXJzZVVSTHMoKSB7CgkJCXZhciBiYXRjaHVybCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoInRleHRib3giKS52YWx1ZTsKCQkJaWYgKC9cW1xkKy1cZCsoLVxkKyk/XF0vLnRlc3QoYmF0Y2h1cmwpKSB7CgkJCQlmb3IgKHZhciBtYXRjaCA9IGJhdGNodXJsLm1hdGNoKC9cWyhcZCspLShcZCspLT8oXGQrKT9cXS8pLCBpID0gbWF0Y2hbMV0sIGogPSBtYXRjaFsyXSwgayA9IG1hdGNoWzNdLCB1cmxzID0gW107IGkgPD0gajsgaSsrKSB7CgkJCQkJdXJscy5wdXNoKGJhdGNodXJsLnJlcGxhY2UoL1xbXGQrLVxkKygtXGQrKT9cXS8sIChpICsgIiIpLmxlbmd0aCA8IGsgPyAoZXZhbCgiMTBlIiArIChrIC0gKGkgKyAiIikubGVuZ3RoKSkgKyAiIikuc2xpY2UoMikgKyBpIDogaSkpOwoJCQkJfQoJCQkJZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiI3VybHMiKS52YWx1ZSA9IHVybHMuam9pbigiXG4iKTsKCQkJfSBlbHNlIHsKCQkJCWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIiN1cmxzIikudmFsdWUgPSBiYXRjaHVybDsKCQkJfQoJCX0KCQl2YXIgb3duZXIgPSB3aW5kb3cub3BlbmVyOwoJCXdoaWxlKG93bmVyLm9wZW5lciAmJiBvd25lci5sb2NhdGlvbiAhPSAiY2hyb21lOi8vYnJvd3Nlci9jb250ZW50L2Jyb3dzZXIueHVsIil7CgkJCW93bmVyID0gb3duZXIub3BlbmVyOwoJCX0KdmFyIG1haW53aW4gPSBDb21wb25lbnRzLmNsYXNzZXNbIkBtb3ppbGxhLm9yZy9hcHBzaGVsbC93aW5kb3ctbWVkaWF0b3I7MSJdLmdldFNlcnZpY2UoQ29tcG9uZW50cy5pbnRlcmZhY2VzLm5zSVdpbmRvd01lZGlhdG9yKS5nZXRNb3N0UmVjZW50V2luZG93KCJuYXZpZ2F0b3I6YnJvd3NlciIpOwkJCWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoInRleHRib3giKS5hZGRFdmVudExpc3RlbmVyKCJrZXl1cCIsIFBhcnNlVVJMcywgZmFsc2UpOwoJCWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoImJ1dHRvbiIpLmFkZEV2ZW50TGlzdGVuZXIoImNvbW1hbmQiLCBmdW5jdGlvbiAoKSB7CQlkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCIjdXJscyIpLnZhbHVlLnNwbGl0KCJcbiIpLmZvckVhY2goZnVuY3Rpb24gKHVybCkgewoJCQkJb3duZXIuc2F2ZVVSTCh1cmwgLCBudWxsLCBudWxsLCBudWxsLCB0cnVlLCBudWxsLCBtYWlud2luLmRvY3VtZW50KTsKCQkJfSk7CgkJCWNsb3NlKCkKCQl9LCBmYWxzZSk7CgkJZG9jdW1lbnQucXVlcnlTZWxlY3RvcigidGV4dGJveCIpLnZhbHVlID0gb3duZXIucmVhZEZyb21DbGlwYm9hcmQoKTsKCQlQYXJzZVVSTHMoKTsKCQldXT4KCTwvc2NyaXB0Pgo8L3dpbmRvdz4=", "name", "top=" + (window.screenY + window.innerHeight / 4 - 50) + ",left=" + (window.screenX + window.innerWidth / 2 - 250));
        }

        location.href.startsWith('chrome://browser/content/browser.x') && (function () {
            document.getElementById('downloads-button').parentNode.addEventListener('click', function (e) {
                if (e.target.id == "downloads-button" || e.target.id == "downloads-indicator") {
                    if (e.button == 2) {
                        if (!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)) {
                            createDownloadDialog();
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                }
            }, false);
        })();

        location.href.startsWith("chrome://browser/content/places/places.x") && (function () {
            var button = document.querySelector("#placesToolbar").insertBefore(document.createXULElement("toolbarbutton"), document.querySelector("#clearDownloadsButton"));
            button.id = "createNewDownload";
            button.label = dpText.newDownload;
            button.style.paddingRight = "9px";
            button.addEventListener("command", createDownloadDialog, false);
            window.addEventListener("mouseover", function (e) {
                button.style.display = (document.getElementById("searchFilter").attributes.getNamedItem("collection").value == "downloads") ? "-moz-box" : "none";
            }, false);
        })();
    }

    function dpCreateElement(doc, tag, props, isHTML = false) {
        let el = isHTML ? doc.createElement(tag) : doc.createXULElement(tag);
        for (let prop in props) {
            el.setAttribute(prop, props[prop])
        }
        return el;
    }

    function removeFileFromDisk() {
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

        if (location.href == 'chrome://browser/content/places/places.xhtml') {
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
        } else {
            try {
                let sShell = document.getElementById("panelDownloadsContextMenu")._anchorNode._shell;
                let path = sShell.download.target.path;
                removeSelectFile(path);
                sShell.doCommand("cmd_delete");
            } catch (e) { }
        }
    }

    function removeFileInit() {
        // 来自 https://github.com/aminomancer/uc.css.js/blob/master/JS/downloadsDeleteFileCommand.uc.js
        // if (!("DownloadsViewUI" in window)) return;
        // Make the menuitem.
        let context = document.getElementById("downloadsContextMenu");
        context.insertBefore(
            dpCreateElement(document, "menuitem", {
                onclick: '(' + removeFileFromDisk.toString() + ')()',
                class: "downloadDeleteFileMenuItem",
                label: dpText.removeFromDisk
            }),
            context.querySelector(".downloadRemoveFromHistoryMenuItem")
        );
        let clearDownloads = context.querySelector(
            `[data-l10n-id="downloads-cmd-clear-downloads"]`
        );
        if (clearDownloads.getAttribute("accesskey") === "D")
            clearDownloads.setAttribute("accesskey", "C");

        // Add the class method for the command.
        if (
            !DownloadsViewUI.DownloadElementShell.prototype.hasOwnProperty(
                "downloadsCmd_deleteFile"
            )
        )
            DownloadsViewUI.DownloadElementShell.prototype.downloadsCmd_deleteFile =
                async function downloadsCmd_deleteFile() {
                    let { download } = this;
                    let { path } = download.target;
                    let { succeeded } = download;
                    let indicator = DownloadsCommon.getIndicatorData(this.element.ownerGlobal);
                    // Remove the download view.
                    await DownloadsCommon.deleteDownload(download);
                    if (succeeded) {
                        // Temp files are made "read-only" by DownloadIntegration.downloadDone, so reset the permission bits to read/write.
                        // This won't be necessary after 1733587 since Downloads won't ever be temporary.
                        let info = await IOUtils.stat(path);
                        await IOUtils.setPermissions(path, 0o660);
                        await IOUtils.remove(path, {
                            ignoreAbsent: true,
                            recursive: info.type === "directory",
                        });
                    }
                    if (!indicator._hasDownloads)
                        indicator.attention = DownloadsCommon.ATTENTION_NONE;
                };
        // Add a class method for the panel's class (extends the class above) to handle a special case.
        if (
            "DownloadsViewItem" in window &&
            !DownloadsViewItem.prototype.hasOwnProperty("downloadsCmd_deleteFile")
        ) {
            DownloadsViewItem.prototype.downloadsCmd_deleteFile =
                async function downloadsCmd_deleteFile() {
                    await DownloadsViewUI.DownloadElementShell.prototype.downloadsCmd_deleteFile.call(
                        this
                    );
                    // Protects against an unusual edge case where the user:
                    // 1) downloads a file with Firefox; 2) deletes the file from outside of Firefox, e.g., a file manager;
                    // 3) downloads the same file from the same source; 4) opens the downloads panel and uses the menuitem to delete one of those 2 files;
                    // Under those conditions, Firefox will make 2 view items even though there's only 1 file.
                    // Using this method will only delete the view item it was called on, because this instance is not aware of other view items with identical targets.
                    // So the remaining view item needs to be refreshed to hide the "Delete" option.
                    // That example only concerns 2 duplicate view items but you can have an arbitrary number, so iterate over all items...
                    for (let viewItem of DownloadsView._visibleViewItems.values()) {
                        viewItem.download.refresh().catch(Cu.reportError);
                    }
                    // Don't use DownloadsPanel.hidePanel for this method because it will remove
                    // the view item from the list, which is already sufficient feedback.
                };
        }
        // Show/hide the menuitem based on whether there's any file to delete.
        if (DownloadsViewUI.updateContextMenuForElement.name === "updateContextMenuForElement")
            eval(
                `DownloadsViewUI.updateContextMenuForElement = function ` +
                DownloadsViewUI.updateContextMenuForElement
                    .toSource()
                    .replace(/^updateContextMenuForElement/, "")
                    .replace(
                        /(let download = element\._shell\.download;)/,
                        `$1\n    contextMenu.querySelector(".downloadDeleteFileMenuItem").hidden =\n      !(download.target.exists || download.target.partFileExists);\n`
                    )
            );
    }

    // 从硬盘中删除
    function downloadsPanelRemoveFile() {
        if ("gBrowserInit" in window) {
            if (gBrowserInit.delayedStartupFinished) removeFileInit();
            else {
                let delayedListener = (subject, topic) => {
                    if (topic == "browser-delayed-startup-finished" && subject == window) {
                        Services.obs.removeObserver(delayedListener, topic);
                        removeFileInit();
                    }
                };
                Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
            }
        } else removeFileInit();
    }

    //精确显示文件大小
    function downloadFileSize() {
        location.href.startsWith('chrome://browser/content/browser.x') && (DownloadUtils.convertByteUnits =
            function DU_convertByteUnits(aBytes) {
                let unitIndex = 0;
                while ((aBytes >= 999.5) && (unitIndex < 3)) {
                    aBytes /= 1024;
                    unitIndex++;
                }
                return [(aBytes > 0) && (aBytes < 100) && (unitIndex != 0) ? (aBytes < 10 ? (parseInt(aBytes * 100) / 100).toFixed(2) : (parseInt(aBytes * 10) / 10).toFixed(1)) : parseInt(aBytes), ['bytes', 'KB', 'MB', 'GB'][unitIndex]];
            });
    }

    // 自动关闭下载产生的空白标签
    function autoCloseBlankTab() {
        gBrowser.addTabsProgressListener({
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
        });
    }

    // 保存并打开
    function saveAndOpen() {
        var saveAndOpen = dialogElement.getButton("extra2");
        saveAndOpen.parentNode.insertBefore(saveAndOpen, dialogElement.getButton("accept").nextSibling);
        saveAndOpen.setAttribute("hidden", "false");
        saveAndOpen.setAttribute("label", dpText.saveAndOpen);
        saveAndOpen.addEventListener("command", () => {
            Services.wm.getMostRecentWindow("navigator:browser").saveAndOpen.urls.push(dialog.mLauncher.source.asciiSpec);
            document.querySelector("#save").click();
            dialogElement.getButton("accept").disabled = 0;
            dialogElement.getButton("accept").click()
        });
    }

    //作用于 main 窗口
    function saveAndOpenMain() {
        Components.utils.import("resource://gre/modules/Downloads.jsm");
        window.saveAndOpen = {
            urls: [],
            init: function () {
                Downloads.getList(Downloads.ALL).then(list => {
                    list.addView({
                        onDownloadChanged: function (dl) {
                            if (dl.progress != 100) return;
                            if (window.saveAndOpen.urls.indexOf(dl.source.url) > -1) {
                                let target = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                                target.initWithPath(dl.target.path);
                                target.launch();
                                window.saveAndOpen.urls[window.saveAndOpen.urls.indexOf(dl.source.url)] = "";
                            }
                        },
                        onDownloadAdded: function () { },
                        onDownloadRemoved: function () { },
                    });
                }).then(null, Cu.reportError);
            }

        }
        window.saveAndOpen.init();
    }

    // 下载改名
    function downloadReName() {
        //注:同时关闭改名和下拉菜单会导致下载文件的文件名不显示(非要关闭请默认在28行最前面加//来注释掉该功能)
        if (!location.href.startsWith("chrome://mozapps/content/downloads/unknownContentType.x")) return;
        document.querySelector("#mode").addEventListener("select", function () {
            if (dialog.dialogElement("save").selected) {
                if (!document.querySelector("#locationtext")) {
                    if (dpConfig.enableReName || dpConfig.reNameEncodingConvert) {
                        var orginalString = "";
                        if (dpConfig.reNameEncodingConvert) {
                            try {
                                orginalString = (opener.localStorage.getItem(dialog.mLauncher.source.spec) ||
                                    dialog.mLauncher.source.asciiSpec.substring(dialog.mLauncher.source.asciiSpec.lastIndexOf("/"))).replace(/[\/:*?"<>|]/g, "");
                                opener.localStorage.removeItem(dialog.mLauncher.source.spec)
                            } catch (e) {
                                orginalString = dialog.mLauncher.suggestedFileName;
                            }
                        }
                        var location = document.querySelector("#location"),
                            locationtext;
                        if (dpConfig.reNameEncodingConvert)
                            locationtext = document.createXULElement("menulist");
                        else
                            locationtext = document.createElementNS("http://www.w3.org/1999/xhtml", "html:input");
                        locationtext.id = "locationtext";
                        if (dpConfig.enableReName && dpConfig.reNameEncodingConvert)
                            locationtext.setAttribute("editable", "true");
                        locationtext.setAttribute("style", "margin-top:-2px;margin-bottom:-3px");
                        locationtext.setAttribute("tooltiptext", dpText.ctrlToConvertEncode);
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
                        if (dpConfig.enableReName)
                            locationtext.value = dialog.mLauncher.suggestedFileName;
                        if (dpConfig.reNameEncodingConvert) {
                            locationtext.addEventListener("command", function (e) {
                                if (dpConfig.enableReName)
                                    locationtext.value = e.target.value;
                                document.title = "Opening " + e.target.value;
                            });
                            let menupopup = locationtext.appendChild(document.createXULElement("menupopup"));
                            let menuitem = menupopup.appendChild(document.createXULElement("menuitem"));
                            menuitem.value = dialog.mLauncher.suggestedFileName;
                            menuitem.label = "Original: " + menuitem.value;
                            if (!dpConfig.enableReName)
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
        if (dpConfig.renameLockSave)
            dialog.dialogElement("save").click();
        else
            dialog.dialogElement("save").selected && dialog.dialogElement("save").click();
        window.addEventListener("dialogaccept", function (event) {
            if ((document.querySelector("#locationtext").value != dialog.mLauncher.suggestedFileName) && dialog.dialogElement("save").selected) {
                event.stopPropagation();
                var mainwin = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
                // 感谢 ycls006
                mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, document.querySelector("#locationtext").value, null, null, false, null, null, null, null, null, Services.prefs.getBoolPref("browser.download.useDownloadDir", false), null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
                document.documentElement.removeAttribute("ondialogaccept");
            }
        }, true);
    }

    //作用于 main 窗口
    function downloadReNameMain() {
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
    }

    // 另存为...
    function downloadSaveAs() {
        var saveas = dialogElement.getButton("extra1");
        saveas.setAttribute("hidden", "false");
        saveas.setAttribute("label", dpText.saveAs);
        saveas.addEventListener("command", function () {
            var mainwin = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
            // 感谢 ycls006
            mainwin.eval("(" + mainwin.internalSave.toString().replace("let ", "").replace("var fpParams", "fileInfo.fileExt=null;fileInfo.fileName=aDefaultFileName;var fpParams") + ")")(dialog.mLauncher.source.asciiSpec, null, (document.querySelector("#locationtext") ? document.querySelector("#locationtext").value : dialog.mLauncher.suggestedFileName), null, null, false, null, null, null, null, null, false, null, mainwin.PrivateBrowsingUtils.isBrowserPrivate(mainwin.gBrowser.selectedBrowser), Services.scriptSecurityManager.getSystemPrincipal());
            close();
        }, false);
    }

    function downloadDialogExtraApp() {
        var extra = dialogElement._buttons.cancel.parentNode.insertBefore(document.createXULElement("button"), dialogElement._buttons.cancel);
        let url = dialog.mLauncher.source.spec;
        extra.classList.toggle("dialog-button");
        extra.label = dpText.extraAppName;
        extra.addEventListener("command", function () {
            let regEx = new RegExp("^data");
            if (regEx.test(url)) {
                alert(dpText.canNotUseExtra);
                return;
            }
            parameter = dpConfig.extraAppParam.replace("{{url}}", url);
            let extraApp = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
            try {
                extraApp.initWithPath(dpConfig.extraAppPath);
            } catch (E) {
                alert(dpText.extraAppName + dpText.notExist + dpConfig.extraAppPath);
                return;
            }

            let p = Components.classes["@mozilla.org/process/util;1"]
                .createInstance(Components.interfaces.nsIProcess);
            let commandArgs = parameter.split(" ");
            p.init(extraApp);
            p.run(false, commandArgs, commandArgs.length);
            dialog.mDialog.dialog = null;
            window.close();
        });
    }

    // 保存到...
    function downloadSaveTo() {
        //目录路径的反斜杠\要双写\\
        //第一次使用要修改路径，否则无法下载
        //如果使用Firefox3.6 + userChromeJS v1.2,则路径中的汉字要转义为\u6C49\u5B57编码类型,否则会出现乱码
        var cssStr = (function () {
            /*
                        button[label="\4FDD\5B58\5230"] .box-inherit.button-box{
                            position: relative;
                        }
                        button[label="\4FDD\5B58\5230"] dropmarker{
                            position: absolute;
                            top: 0px;
                            right: 2px;
                        }
                    */
        }).toString().replace(/^.+\s|.+$/g, "");
        var shadowRoot = document.getElementById('unknownContentType').shadowRoot;
        if (shadowRoot) {
            var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'html:style');
            style.textContent = cssStr;
            shadowRoot.insertBefore(style, shadowRoot.firstChild);
        } else {
            var style = document.createProcessingInstruction("xml-stylesheet", "type=\"text/css\"" + " href=\"data:text/css;base64," + btoa(cssStr) + "\"");
            document.insertBefore(style, document.firstChild);
        }
        var link = document.createElementNS('http://www.w3.org/1999/xhtml', 'html:link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'chrome://global/content/widgets.css');
        shadowRoot.insertBefore(link, shadowRoot.firstChild);

        var dir = [
            [Services.dirsvc.get('Desk', Ci.nsIFile).path, "桌面"],
            ["C:\\", "C盘"],
            ["D:\\", "D盘"],
            ["E:\\", "E盘"],
            ["F:\\", "F盘"]
        ];
        var saveTo = dialogElement._buttons.cancel.parentNode.insertBefore(document.createXULElement("button"), dialogElement._buttons.cancel);
        var saveToMenu = saveTo.appendChild(document.createXULElement("menupopup"));
        saveTo.classList.toggle("dialog-button");
        saveTo.label = "\u4FDD\u5B58\u5230";
        saveTo.type = "menu";
        saveTo.querySelector('.box-inherit.button-box').appendChild(document.createXULElement('dropmarker'));
        dir.forEach(function (dir) {
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
    }

    // 下载弹出窗口双击链接复制完整链接
    function downloadShowCompleteURL() {
        var s = document.querySelector("#source");
        s.value = dialog.mLauncher.source.spec;
        s.setAttribute("crop", "center");
        s.setAttribute("tooltiptext", dpText.dobuleClickToCopy);
        s.style.setProperty('cursor', 'pointer');
        s.setAttribute("ondblclick", 'Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper).copyString(dialog.mLauncher.source.spec)')
    }

    // 下载弹出窗口双击保存文件项执行下载
    function doubleClickToSave() {
        addEventListener("dblclick", function (event) {
            event.target.nodeName === "radio" && dialogElement.getButton("accept").click()
        }, false)
    }

    function downloadSpeed() {
        var appVersion = Services.appinfo.version.split(".")[0];
        if (appVersion >= 38 && DownloadsViewItem.prototype._updateProgress) {
            eval("DownloadsViewItem.prototype._updateProgress = " +
                DownloadsViewItem.prototype._updateProgress.toString().replace('status.text', 'status.tip'));
        } else if (appVersion < 38 && DownloadsViewItem.prototype._updateStatusLine) {
            eval("DownloadsViewItem.prototype._updateStatusLine = " +
                DownloadsViewItem.prototype._updateStatusLine.toString().replace('[statusTip', '[status'));
        }
    }
})()