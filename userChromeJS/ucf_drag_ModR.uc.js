// ==UserScript==
// @name            ucf_drag_ModR.uc.js
// @description     鼠标拖拽 Drag & Go，来自于 Mozilla-Russia 论坛，Ryan 修改自用
// @author          Ryan, Dumby
// @include         main
// @version         2024.03.06
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @referenceURL    https://forum.mozilla-russia.org/viewtopic.php?pid=797234#p797234
// @note            2024.03.06 增加复制链接文本
// @note            2024.02.29 修复站内搜索失效
// @onlyonce
// ==/UserScript==
(function () {
    if (window.UCFDrag) {
        return;
    }

    window.UCFDrag = {
        debug: false,
        gestures: {
            link: [
                {
                    dir: "U",
                    name: "打开链接（新标签，前台）",
                    cmd(val) {
                        window.openTrustedLinkIn(val, "tab", this.opts);
                    }
                },
                {
                    dir: "R",
                    name: "打开链接（新标签，后台）",
                    cmd(val) {
                        window.openTrustedLinkIn(val, "tabshifted", this.opts);
                    }
                },
                {
                    dir: "RD",
                    name: "另存链接",
                    cmd(val) {
                        this.saveAs(val);
                    }
                },
                {
                    dir: "L",
                    name: "复制链接文本",
                    cmd(val) {
                        this.copyString(this.linkText);
                    }
                },
                {
                    dir: "L",
                    shift: true,
                    name: "复制链接",
                    cmd(val) {
                        this.copyString(val);
                    }
                },
                {
                    dir: "D",
                    name: "打开链接（当前标签）",
                    cmd(val) {
                        window.openTrustedLinkIn(val, "current", this.opts);
                    }
                },
                {
                    dir: "LD",
                    name: "以站搜站（新标签，前台）",
                    cmd(val) {
                        if (!val) return;
                        var TERM = "https://www.similarsites.com/site/" + new URL(val).hostname.replace(/^www./, '');
                        if (val)
                            window.openTrustedLinkIn(TERM, "tab", this.opts);
                    }
                },
                {
                    dir: "LD",
                    name: "网页历史（新标签，前台）",
                    shift: true,
                    cmd(val) {
                        if (!val) return;
                        var TERM = "https://web.archive.org/web/*/" + new URL(val).hostname.replace(/^www./, '');
                        if (val)
                            window.openTrustedLinkIn(TERM, "tab", this.opts);
                    }
                },
            ],
            text: [
                {
                    dir: "U",
                    name: "搜索文本（新标签，前台）",
                    cmd(val) {
                        this.searchWithEngine(val, "tab", "@default");
                    }
                },
                {
                    dir: "U",
                    shift: true,
                    name: "搜索文本（新标签，后台）",
                    cmd(val) {
                        this.searchWithEngine(val, "tabshifted", "@default");
                    }
                },
                {
                    dir: "R",
                    name: "百度搜索（新标签，前台）",
                    cmd(val) {
                        this.searchWithEngine(val, 'tab', '百度');
                    }
                },
                {
                    dir: "U",
                    shift: true,
                    name: "百度搜索（新标签，后台）",
                    cmd(val) {
                        this.searchWithEngine(val, 'tabshifted', '百度');
                    }
                },
                {
                    dir: "RD",
                    name: "另存文本",
                    cmd(val) {
                        this.saveText(val);
                    }
                },
                {
                    dir: "D",
                    name: "站内搜索（当前标签）",
                    cmd(val, event) {
                        var currentPageUrl = event.originalTarget.currentURI.spec;
                        var TERM = "site:" + new URL(currentPageUrl).hostname.replace(/^www./, '') + " " + val;
                        if (val)
                            this.searchWithEngine(TERM, 'current', '@default');
                    }
                },
                {
                    dir: "D",
                    name: "站内搜索（新标签，前台）",
                    ctrl: true,
                    cmd(val, event) {
                        var currentPageUrl = event.originalTarget.currentURI.spec;
                        var TERM = "site:" + new URL(currentPageUrl).hostname.replace(/^www./, '') + " " + val;
                        if (val)
                            this.searchWithEngine(TERM, 'tab', '@default');
                    }
                },
                {
                    dir: "L",
                    name: "复制文本",
                    cmd(val) {
                        this.copyString(val);
                    }
                },
                {
                    dir: "LD",
                    name: "剑桥词典（新标签，前台）",
                    cmd(val) {
                        var TERM = "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/" + val;
                        if (val)
                            window.openTrustedLinkIn(TERM, "tab", this.opts);
                    }
                },
                {
                    dir: "LD",
                    shift: true,
                    name: "剑桥词典（新标签，后台）",
                    cmd(val) {
                        var TERM = "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/" + val;
                        if (val)
                            window.openTrustedLinkIn(TERM, "tabshifted", this.opts);
                    }
                }
            ],
            image: [
                {
                    dir: "U",
                    name: "打开图像（新标签，前台）",
                    cmd() {
                        window.openTrustedLinkIn(this.val, "tab", this.opts);
                    }
                },
                {
                    dir: "R",
                    name: "打开图像（新标签，后台）",
                    cmd() {
                        window.openTrustedLinkIn(this.val, "tabshifted", this.opts);
                    }
                },
                {
                    dir: "RD",
                    name: "另存图像",
                    cmd(val) {
                        this.saveAs(val);
                    }
                },
                {
                    dir: "L",
                    name: "复制图片链接",
                    cmd(val) {
                        this.copyString(val);
                    }
                },
                {
                    dir: "LD",
                    name: "谷歌搜图（新标签，前台）",
                    cmd(val) {
                        var TERM = "https://lens.google.com/uploadbyurl?url=" + val;
                        if (val)
                            window.openTrustedLinkIn(TERM, "tab", this.opts);
                    }
                },
                {
                    dir: "LD",
                    shift: true,
                    name: "Yandex搜图（新标签，前台）",
                    cmd(val) {
                        var TERM = "https://yandex.com/images/search?source=collections&rpt=imageview&url=" + val;
                        if (val)
                            window.openTrustedLinkIn(TERM, "tabshifted", this.opts);
                    }
                },
            ]
        },
        searchWithEngine(val, where, engine, addToHistory) {
            val || (val = this.val);
            var engine = this.getEngineByName(engine);
            var submission = engine.getSubmission(val, null);
            window.openTrustedLinkIn(submission.uri.spec, where, { postData: submission.postData, ...this.opts });
            if (addToHistory) {
                this.updateSearchbarHistory(val);
            }
        },
        getEngineByName(aEngineName) {
            const UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                createInstance(Ci.nsIScriptableUnicodeConverter);
            UI.charset = "UTF-8";
            const nsIBSS = Ci.nsIBrowserSearchService || Ci.nsISearchService;
            const searchService = Cc["@mozilla.org/browser/search-service;1"].getService(nsIBSS);
            if (aEngineName.toUpperCase() == "CURRENT") {
                var searchbar = this.searchbar;
                if (searchbar) return searchbar.currentEngine;
            } else {
                try {
                    aEngineName = UI.ConvertToUnicode(aEngineName)
                } catch (e) { }
                var engine = searchService.getEngineByName(aEngineName);
                if (engine) return engine;
            }
            //Default
            return searchService.defaultEngine;
        },
        copyToSearchBar(searchText) {
            var searchbar = this.searchbar;
            if (!searchbar)
                return;
            searchbar.value = searchText;
        },
        updateSearchbarHistory(searchText) {
            this.copyToSearchBar(searchText);

            //var event = document.createEvent("UIEvents");
            //event.initUIEvent("input", true, true, window, 0);
            var searchbar = this.searchbar;
            //searchbar.dispatchEvent(event);
            if (typeof searchbar.FormHistory == "object") {
                if (searchText && !window.PrivateBrowsingUtils.isWindowPrivate(window)) {
                    searchbar.FormHistory.update({
                        op: "bump",
                        fieldname: searchbar._textbox.getAttribute("autocompletesearchparam"),
                        value: searchText
                    }, {
                        handleError: function (aError) {
                            Components.utils.reportError("Saving search to form history failed: " + aError.message);
                        }
                    });
                }
            } else {
                if (searchText) {
                    searchbar._textbox._formHistSvc
                        .addEntry(searchbar._textbox.getAttribute("autocompletesearchparam"),
                            searchText);
                }
            }
        },
        copyString(text) {
            const cs = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
            cs.copyString(text);
        },
        saveAs(aURL, aFileName, aReferrer, aSourceDocument, aContentType, aContentDisposition) {
            const { gBrowser, PrivateBrowsingUtils, internalSave, saveImageURL, saveURL } = win;
            let createContentPrincipal = Services.scriptSecurityManager.createContentPrincipal || Services.scriptSecurityManager.createCodebasePrincipal;
            let aPrincipal = createContentPrincipal(Services.io.newURI(aURL), {});
            let isPrivate = PrivateBrowsingUtils.isBrowserPrivate(gBrowser.selectedBrowser);
            const firefoxVer = parseFloat(Services.appinfo.version);
            const imageLinkRegExp = /(.+)\.(png|jpg|jpeg|gif|bmp)$/i;
            if (aReferrer instanceof HTMLDocument) {
                aReferrer = aReferrer.documentURIObject;
            } else if (typeof aReferrer == 'string') {
                aReferrer = Services.io.newURI(aReferrer);
            }
            if (firefoxVer >= 70) {
                let referrerInfo = Cc["@mozilla.org/referrer-info;1"].createInstance(Ci.nsIReferrerInfo);
                referrerInfo.init(
                    Ci.nsIHttpChannel.REFERRER_POLICY_NO_REFERRER_WHEN_DOWNGRADE,
                    true,
                    aReferrer
                );
                aReferrer = referrerInfo;
            }
            if (imageLinkRegExp.test(aURL) || /^image\//i.test(aContentType)) {
                if (firefoxVer >= 102.3) {
                    let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else if (firefoxVer >= 84) {
                    let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, cookieJarSettings, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else if (firefoxVer >= 77) {
                    if (/^data:/.test(aURL)) {
                        internalSave(aURL, null, "index.png", aContentDisposition, aContentType, true, null, null, aReferrer, aSourceDocument, false, null, isPrivate, aPrincipal);
                    } else {
                        internalSave(aURL, null, null, aContentDisposition, aContentType, false, null, null, aReferrer, aSourceDocument, false, null, isPrivate, aPrincipal);
                    }
                } else {
                    if (/^data:/.test(aURL)) {
                        saveImageURL(aURL, "index.png", null, true, false, aReferrer, aSourceDocument, aContentType, aContentDisposition, isPrivate, aPrincipal);
                    } else {
                        saveImageURL(aURL, null, null, false, false, aReferrer, aSourceDocument, aContentType, aContentDisposition, isPrivate, aPrincipal);
                    }
                }
            } else {
                if (firefoxVer >= 102.3) {
                    let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    saveURL(aURL, null, aFileName, null, true, false, aReferrer, cookieJarSettings, aSourceDocument, isPrivate, aPrincipal);
                } else if (firefoxVer >= 84) {
                    let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    saveURL(aURL, aFileName, null, true, false, aReferrer, cookieJarSettings, aSourceDocument, isPrivate, aPrincipal);
                } else {
                    saveURL(aURL, aFileName, null, true, false, aReferrer, aSourceDocument, isPrivate, aPrincipal);
                }
            }
        },
        saveText: async function saveText(text) {
            const { Cc, Ci, gBrowser } = win;;
            const { nsIFilePicker } = Ci;
            var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
            fp.init(win, "Select a File", Ci.nsIFilePicker.modeSave);
            fp.appendFilters(nsIFilePicker.filterText);
            fp.defaultString = gBrowser.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "") + '.txt';
            switch (await new Promise(resolve => { fp.open(rv => { resolve(rv); }); })) {
                case (nsIFilePicker.returnOK):
                case (nsIFilePicker.returnReplace):
                    file = fp.file;
                    break;
                case (nsIFilePicker.returnCancel):
                default:
                    return null;
            }
            var strm = Cc["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Ci.nsIFileOutputStream);
            var convert = Cc['@mozilla.org/intl/scriptableunicodeconverter']
                .getService(Ci.nsIScriptableUnicodeConverter);
            convert.charset = "UTF-8";
            ext = convert.ConvertFromUnicode(text);
            try {
                strm.init(file, 0x02 | 0x08 | 0x20, parseInt(664, 8), 0); // write, create, truncate
                strm.write(text, text.length);
                strm.flush();
            } catch (ex) {
                alert('failed:\n' + ex);
                file = null;
            }
            strm.close();

            return file;
        },
        getDroppedURL_Fixup: function getDroppedURL_Fixup(url) {
            if (!url) return null;
            if (/^h?.?.p(s?):(.+)$/i.test(url)) {
                url = "http" + RegExp.$1 + ':' + RegExp.$2;
                if (!RegExp.$2) return null;
            }
            try {
                url = Services.uriFixup.getFixupURIInfo(url, Services.uriFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP).preferredURI.spec;
                // valid urls don't contain spaces ' '; if we have a space it
                // isn't a valid url, or if it's a javascript: or data: url,
                // bail out
                if (!url ||
                    !url.length ||
                    url.indexOf(" ", 0) != -1 ||
                    /^\s*javascript:/.test(url) ||
                    /^\s*data:/.test(url) && !/^\s*data:image\//.test(url))
                    return null;
                return url;
            } catch (e) {
                return null;
            }
        },
        printDataTransferTypes: function (e) {
            var dt = e.dataTransfer;
            console.info("print dataTransfer type:");
            var types = dt.types;
            for (var i = 0; i < types.length; i += 1) {
                console.info(types[i] + ": " + dt.getData(types[i]));
            }
        },
        opts: {
            //relatedToCurrent: true,
            triggeringPrincipal: Cu.getObjectPrincipal(this),
            get userContextId() {
                return parseInt(window.gBrowser.selectedBrowser.getAttribute("usercontextid"));
            },
            get private() {
                return window.PrivateBrowsingUtils.isWindowPrivate(win);
            }
        },
        dragstart(e) {
            win = e.view.windowRoot.ownerGlobal;
            //if (!window.gBrowser.currentURI.spec.startsWith("http")) return;
            if (!e.dataTransfer.mozItemCount || !window.gBrowser.selectedBrowser.matches(":hover"))
                return;

            if (this.debug)
                this.printDataTransferTypes(e);

            var dt = e.dataTransfer;
            this.gesture = this.gestures.link;
            this.dir = this.val = this.linkText = "";


            var url = dt.getData("text/x-moz-url-data");
            if (url) {
                this.val = url;
                if (this.imageLinkRe.test(url)) {
                    this.gesture = this.gestures.image;
                } else {
                    var promiseUrl = dt.getData("application/x-moz-file-promise-url");
                    var dragHTML = dt.getData("text/html");
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(dragHTML, "text/html");
                    var onImage = doc.getRootNode().body?.firstElementChild?.tagName == "IMG" || doc.getRootNode().body?.firstElementChild.querySelectorAll("img").length;
                    if (onImage && e.ctrlKey) {
                        // force to image type when ctrlKey is pressed
                        this.gesture = this.gestures.image;
                        this.val = promiseUrl;
                    } else {
                        this.linkText = doc.querySelector('a').innerText || doc.querySelector('a').href;
                    }
                }
            } else {
                var txt = dt.getData("text/plain");
                if (txt) {
                    this.val = txt;
                    if (false) {
                        // 未来加入特殊文本处理 比如网盘链接
                    } else {
                        if (!this.textLinkRe.test(txt)) this.gesture = this.gestures.text;
                        if (this.imageLinkRe.test(txt)) this.gesture = this.gestures.image;
                    }
                }
                else return;
            }
            this.x = e.screenX; this.y = e.screenY;
            this.drag(true);
        },
        drag(init) {
            var meth = `${init ? "add" : "remove"}EventListener`;
            for (var type of this.events) win[meth](type, this, true);
            init || window.StatusPanel.panel.setAttribute("inactive", true);
        },
        events: ["dragover", "drop", "dragend"],
        dragover(e) {
            var { x, y } = this, cx = e.screenX, cy = e.screenY;
            var dx = cx - x, ax = Math.abs(dx), dy = cy - y, ay = Math.abs(dy);
            if (ax < 10 && ay < 10) return;

            this.x = cx; this.y = cy;
            var dir = ax > ay ? dx > 0 ? "R" : "L" : dy > 0 ? "D" : "U";
            if (this.dir.endsWith(dir)) return;

            dir = this.dir += dir;
            var obj = filterGestures(this.gesture, dir, e), txtArray = [];
            if (!obj.length) {
                txtArray.push("未知手势：" + dir);
            } else {
                obj.forEach(g => {
                    txtArray.push("鼠标手势：" + dir + " " + g.name)
                });
            }


            window.StatusPanel._labelElement.value = txtArray.join(", ");
            window.StatusPanel.panel.removeAttribute("inactive");
        },
        dragend(e) {
            var dt = e.dataTransfer;
            this.drag();
            var obj = filterGestures(this.gesture, this.dir, e)
            if (this.debug) console.info(this.dir, this.obj);
            if (!obj.length || dt.mozUserCancelled) return;

            var x = e.screenX, y = e.screenY;
            var wx = window.mozInnerScreenX, wy = window.mozInnerScreenY;
            if (x > wx && y > wy && x < wx + window.innerWidth && y < wy + window.innerHeight) {
                obj.forEach(g => {
                    g.cmd.call(this, this.val, e)
                })
            }
        },
        textLinkRe: /^([a-z]+:\/\/)?([a-z]([a-z0-9\-]*\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-z][a-z0-9_]*)?$|^custombutton:\/\/\S+$/,
        imageLinkRe: /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg|avif|webp))/,
        observe(w) {
            this.drop = () => this.drag();
            this.handleEvent = e => this[e.type](e);
            var unload = e => {
                var w = e.target.ownerGlobal;
                w.gBrowser.tabpanels.removeEventListener("dragstart", this, true);
                // if (w == win) win = null;
            }
            (this.observe = w => {
                //if (!w.toolbar.visible) return;
                w.gBrowser.tabpanels.addEventListener("dragstart", this, true);
                w.addEventListener("unload", unload, { once: true });
            })(w);
        },
        init(topic, self) {
            delete this.init;
            Services.obs.addObserver(self = this, topic);
            Services.obs.addObserver(function quit(s, t) {
                Services.obs.removeObserver(self, topic);
                Services.obs.removeObserver(quit, t);
            }, "quit-application-granted");
        }
    }

    function filterGestures(gesture, dir, event) {
        let obj = gesture.filter(g => g.dir === dir);
        if (event.shiftKey) {
            obj = obj.filter(g => g.shift);
        } else {
            obj = obj.filter(g => !g.shift);
        }
        if (event.ctrlKey) {
            obj = obj.filter(g => g.ctrl);
        } else {
            obj = obj.filter(g => !g.ctrl);
        }
        return obj;
    }

    window.UCFDrag.init("browser-delayed-startup-finished");
})();