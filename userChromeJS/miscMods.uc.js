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

    const WIDGET_ATTRS = {
        "urlbar-input": {
            el: "#paste-and-go",
            initEvent: "contextmenu",
            accesskey: 'S'
        },
        "urlbar-middle-click": {
            el: "#urlbar",
            onclick: function (e) {
                if (e.button == 1) copyText(gBrowser.currentURI.spec);
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

                    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);

                    var check = { value: false };               // default the checkbox to false
                    var input = { value: readFromClipboard() || "" };                  // default the edit field to Bob
                    var result = prompts.prompt(null, "Save Specified Url", "Please Input a URL?", input, null, check);
                    if (!result)
                        return;
                    let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                    //saveURL(aURL, aOriginalURL, aFileName, aFilePickerTitleKey, aShouldBypassCache,
                    //        aSkipPrompt, aReferrer, aCookieJarSettings,
                    //        aSourceDocument,
                    //        aIsContentWindowPrivate,
                    //        aPrincipal)
                    saveURL(
                        url,
                        null,
                        null,
                        null,
                        true,
                        false,
                        null,
                        cookieJarSettings,
                        null,
                        PrivateBrowsingUtils.isWindowPrivate(window),
                        Services.scriptSecurityManager.createNullPrincipal({})
                    );
                } else if (e.button == 2 && !e.shiftKey) {
                    // 右键打开下载历史
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof ucjs_downloadManager === "undefined")
                        DownloadsPanel.showDownloadsHistory();
                    else
                        ucjs_downloadManager.openDownloadManager(true);
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
                if (typeof UC !== "undefined" && typeof UC.styloaix !== "undefined") UC.styloaix.toggleAll({ reload: true });
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

    function init() {
        for (let widget in WIDGET_ATTRS) {
            let obj = WIDGET_ATTRS[widget];
            try {
                let oWidget = CustomizableUI.getWidget(widget);
                if (oWidget) {
                    let { node } = oWidget.forWindow(window),
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
                } else {
                    Cu.reportError(widget + " is not exists");
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

    function copyText(aText) {
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