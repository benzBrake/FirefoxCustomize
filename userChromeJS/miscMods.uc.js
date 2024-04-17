// ==UserScript==
// @name            miscMods.uc.js
// @description     没有分类的脚本合集，粘贴并转到增加 Access Key，中键单击地址栏复制当前地址，右键地址栏收藏按钮打开书签管理，右键刷新按钮强制刷新，右键 xiaoxiaoflood 的扩展管理管理器打开扩展管理页面，右键 Styloaix 按钮打开主题管理，中键下载按钮提示保存 URL，右键下载按钮打开下载历史，右键下载按钮打开下载管理，左键侧边栏按钮打开书签侧边栏，中键侧边栏按钮切换侧边栏方向，右键侧边栏按钮打开历史侧边栏，CTRL + F 开关侧边栏，只有一个标签时退出浏览器页提示（需要打开关闭浏览器时提示的功能），双击侧边栏标题切换侧边栏显示位置
// @license         MIT License
// @compatibility   Firefox 90
// @version         20240417
// @charset         UTF-8
// @include         chrome://browser/content/browser.xul
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            20240417 Bug 1880914  Move Browser* helper functions used from global menubar and similar commands to a single object in a separate file, loaded as-needed

// ==/UserScript==
(function () {
    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    let config = {
        "urlbar paste and go add accesskey": { // 地址栏右键粘贴并前往增加 AccessKey
            enabled: true, // true 是启用， false 是禁用
            key: 'S'
        },
        "urlbar middle click copy url": true,
        "searchbar paste and go add accesskey": { // 搜索框右键粘贴并搜索增加 AccessKey
            enabled: true, // true 是启用， false 是禁用
            key: 'S'
        },
        "star button box add middle and right click": true, // 书签按钮点击功能
        "reload button right click to force reload": true, // 右键点击刷新按钮强制刷新
        "right click panel ui button to open sidebar": true, // 右键点击三道杠按钮打开侧边栏
        "right click extensions options menu button to open addons management": false, // https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js
        "right click styloaix button to open themes management": true, // https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/styloaix.uc.js
        "downloads button add middle and right click": true, // 中键点击保存剪贴板链接，右键打开下载管理
        "modify sidebar button behavior": true, // 左键侧边栏按钮打开书签侧边栏，中键侧边栏按钮切换侧边栏方向，右键侧边栏按钮打开历史侧边栏, 双击侧边栏标题按钮切换侧边栏方向
        "ctrl f to toggle findbar": true, // Ctrl + F 开关查找栏,
    }

    function MiscUtils() {
        Services.obs.addObserver(this, 'domwindowopened', false);
    }

    MiscUtils.prototype = {
        observe: function (aSubject, aTopic, aData) {
            aSubject.addEventListener('load', this, true);
        },
        handleEvent: function (aEvent) {
            if (aEvent.type === "load") {
                let document = aEvent.originalTarget;
                if (document.location.href.startsWith('chrome://browser/content/browser.x')) {
                    this.init(document, document.ownerGlobal);
                }
            }
        },
        init: function (document, window) {
            if (config["urlbar paste and go add accesskey"].enabled) {
                let accesskey = config["urlbar paste and go add accesskey"].accesskey || 'S';
                let input = CustomizableUI.getWidget('urlbar-input').forWindow(window).node;
                if (input)
                    input.addEventListener("contextmenu", function () {
                        document.getElementById('paste-and-go').setAttribute('accesskey', accesskey);
                    });
            }
            if (config["urlbar middle click copy url"].enabled) {
                let input = CustomizableUI.getWidget('urlbar-input').forWindow(window).node;
                if (input)
                    input.addEventListener('click', function () {
                        if (e.button == 1)
                            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(gBrowser.currentURI.spec);
                    });
            }
            if (config["searchbar paste and go add accesskey"].enabled) {
                let accesskey = config["urlbar paste and go add accesskey"].accesskey || 'S';
                let input = CustomizableUI.getWidget('searchbar').forWindow(window).node;
                if (input)
                    input.addEventListener("contextmenu", function () {
                        document.querySelector('.searchbar-paste-and-search').setAttribute('accesskey', accesskey);
                    });
            }
            if (config["star button box add middle and right click"]) {
                let star = CustomizableUI.getWidget('star-button-box').forWindow(window).node;
                if (star) {
                    let callback = function () {
                        star.removeEventListener('mouseover', callback);
                        star.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? "左键：将此页加入书签(CTRL+D)\n中键：显示/隐藏书签工具栏\n右键：打开书签管理器" : "Left click: show extensions options menu(CTRL+D)\nMiddle click: toggle places toolbar\nRight click: open addons management")
                        let clickFn = function (e) {
                            if (e.button === 0) {
                                return;
                            } else if (e.button === 1) {
                                e.preventDefault();
                                e.stopPropagation();
                                var bar = document.getElementById("PersonalToolbar"); setToolbarVisibility(bar, bar.collapsed);
                            } else if (e.button === 2) {
                                e.preventDefault();
                                e.stopPropagation();
                                PlacesCommandHook.showPlacesOrganizer('AllBookmarks');
                            }
                        }
                        star.addEventListener('click', clickFn, true);
                    }
                    star.addEventListener('mouseover', callback);
                }
            }
            if (config["reload button right click to force reload"]) {
                let reload = CustomizableUI.getWidget('reload-button').forWindow(window).node;
                if (reload) {
                    let callback = function () {
                        reload.removeEventListener('mouseover', callback);
                        reload.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：刷新\n右键：强制刷新' : 'Left click: refresh page\nRight click: force refresh page');
                        let clickFn = function (event) {
                            if (event.button == 2) {
                                const global = event.target.ownerGlobal;
                                event.preventDefault();
                                "BrowserReloadSkipCache" in global ? global.BrowserReloadSkipCache() : global.BrowserReloadWithFlags(Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
                            }
                        }
                        reload.addEventListener('click', clickFn);
                    };
                    reload.addEventListener('mouseover', callback);
                }
            }
            if (config["right click panel ui button to open sidebar"]) {
                var OpenAllTabs = document.getElementById('PanelUI-menu-button');
                if (!OpenAllTabs) return;
                OpenAllTabs.addEventListener("click", function (e) {
                    if (e.button == 2) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.getElementById("sidebar-button")) {
                            document.getElementById("sidebar-button").click();
                        } else {
                            SidebarUI.toggle("viewBookmarksSidebar");
                        }
                        Services.prefs.setBoolPref("sidebar.position_start", false);
                    }
                }, false);

            }
            if (config["right click extensions options menu button to open addons management"] && CustomizableUI.getPlacementOfWidget('eom-button', true)) {
                let eom = CustomizableUI.getWidget('eom-button').forWindow(window).node;
                let callback = function () {
                    eom.removeEventListener('mouseover', callback);
                    eom.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：拓展选项菜单\n右键：扩展管理' : 'Left click: show extensions options menu\nRight click: open addons management');
                    let clickFn = function (event) {
                        if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                            event.preventDefault();
                            event.target.ownerGlobal.BrowserOpenAddonsMgr('addons://list/extension');
                        }
                    }
                    eom.addEventListener('click', clickFn);
                };
                eom.addEventListener('mouseover', callback);
            }
            if (config["right click styloaix button to open themes management"] && CustomizableUI.getPlacementOfWidget('styloaix-button', true)) {
                let btn = CustomizableUI.getWidget('styloaix-button').forWindow(window).node;
                let callback = function () {
                    btn.removeEventListener('mouseover', callback);
                    btn.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：拓展选项菜单\n右键：扩展管理' : 'Left click: show extensions options menu\nRight click: open addons management');
                    let clickFn = function (event) {
                        if (event.button == 2 && event.target.localName == 'toolbarbutton') {
                            event.preventDefault();
                            event.target.ownerGlobal.BrowserOpenAddonsMgr('addons://list/theme');
                        }
                    }
                    btn.addEventListener('click', clickFn);
                };
                btn.addEventListener('mouseover', callback);
            }
            if (config["downloads button add middle and right click"]) {
                let btn = CustomizableUI.getWidget('downloads-button').forWindow(window).node;
                if (btn) {
                    btn.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：拓展选项菜单\n右键：扩展管理' : 'Left click: show extensions options menu\nRight click: open addons management');
                    let clickFn = function (e) {
                        if (e.button == 1) {
                            e.preventDefault();
                            e.stopPropagation();

                            var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                .getService(Components.interfaces.nsIPromptService);

                            var check = { value: false };               // default the checkbox to false
                            var input = { value: readFromClipboard() || "" };                  // default the edit field to Bob
                            var result = prompts.prompt(null, "保存 URL", "请输入 URL?", input, null, check);
                            if (!result)
                                return;
                            let cookieJarSettings = gBrowser.selectedBrowser.cookieJarSettings;
                            //saveURL(aURL, aOriginalURL, aFileName, aFilePickerTitleKey, aShouldBypassCache,
                            //        aSkipPrompt, aReferrer, aCookieJarSettings,
                            //        aSourceDocument,
                            //        aIsContentWindowPrivate,
                            //        aPrincipal)
                            saveURL(
                                result,
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
                    }
                    btn.addEventListener('click', clickFn);
                }
            }
            if (config["modify sidebar button behavior"]) {
                let btn = CustomizableUI.getWidget('sidebar-button').forWindow(window).node;
                if (btn) {
                    btn.setAttribute('tooltiptext', Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：显示书签侧边栏\n中键：切换侧边栏方向\n右键：显示历史侧边栏' : 'Left click: show bookmarks sidebar\nMiddle click: toogle sidebar postion\nRight click: show history sidebar');
                    let clickFn = function (e) {
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
                    btn.addEventListener('click', clickFn);
                }

                if (document.getElementById("sidebar-header")) {
                    let header = document.getElementById("sidebar-header");
                    header.addEventListener('dblclick', ({ target }) => {
                        if (target !== header) return;
                        Services.prefs.setBoolPref("sidebar.position_start", !Services.prefs.getBoolPref("sidebar.position_start"));
                    });
                }

                if (window.SidebarModoki) {
                    let header = document.getElementById("SM_header");
                    if (!header) {
                        // 使用 MutationObserver 等待 SM_header
                        let observer = new MutationObserver(function (mutations) {
                            mutations.forEach(function (mutation) {
                                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                                    // mutation 的 ID 是 SM_header
                                    header = document.getElementById("SM_header");
                                    if (header) {
                                        addEvent(header);
                                        observer.disconnect();
                                    }
                                }
                            });
                        });
                    } else {
                        addEvent(header);
                    }

                    function addEvent(header) {
                        header.addEventListener('dblclick', ({ target }) => {
                            if (target !== header) return;
                            Services.prefs.setBoolPref("sidebar.position_start", !Services.prefs.getBoolPref("sidebar.position_start"));
                        });
                    }
                }
            }
            if (config["ctrl f to toggle findbar"]) {
                document.getElementById('cmd_find').setAttribute('oncommand', 'if (!gFindBar || gFindBar.hidden) { gLazyFindCommand("onFindCommand") } else { gFindBar.close() }');
            }
        }
    }

    const miscUtils = new MiscUtils();

    if (gBrowserInit.delayedStartupFinished) miscUtils.init(document, window); else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                miscUtils.init(subject.document, subject);
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();