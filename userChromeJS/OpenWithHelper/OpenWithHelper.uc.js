// ==UserScript==
// @name           OpenWithHelper.uc.js
// @version        1.0.0a1
// @author         Ryan
// @include        main
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    使用第三方应用打开网页
// ==/UserScript==
if (location.href.startsWith("chrome://browser/content/browser.x")) {
    (async function (CSS, REGEXP, DEFINED_DIRS /* 预定义的一些路径 */, FILE_PATH /* 配置文件路径 */, WHERE_MAP, GE_90 /* 版本号大于等于 90 */, $, $C, $R, $RLP, $USF, $LOADURI /* 打开 JAVASCRIPT 地址函数 */, $ALERT, $COOKIE, $RSTR, $SAVE, $ESCAPE_CMD, LANGUAGE) {
        const { LANG, LOCALE } = LANGUAGE;
        const DEFAULT_SAVE_DIR = DEFINED_DIRS['Desk']; // 默认保存路径为桌面
        if (window.OpenWithHelper) return;
        window.OpenWithHelper = {
            get saveDir() {
                let dir = Services.prefs.getStringPref("userChromeJS.OpenWithHelper.SAVE_DIR", DEFAULT_SAVE_DIR);
                if (dir.startsWith("{") && dir.endsWith("}")) {
                    let matched = (dir.match(/^\{[^\}]+\}$/) || ["", ""])[1]
                    if (matched.length > 0 && Object.keys(DEFINED_DIRS).includes(matched)) {
                        return DEFINED_DIRS[matched]
                    }
                }
                return dir;
            },
            set saveDir(dir) {
                dir = dir.replace(/[\\\/]*$/g, ""); // 处理 Windows 下反斜杠的问题
                for (let [key, value] of Object.entries(DEFINED_DIRS)) {
                    if (dir === value) {
                        dir = "{" + key + "}";
                    }
                }
                Services.prefs.setStringPref("userChromeJS.OpenWithHelper.SAVE_DIR", dir);
            },
            getAppList: async function () {
                let APPS_LIST;
                try {
                    if (!await IOUtils.exists(FILE_PATH)) {
                        await IOUtils.writeUTF8(FILE_PATH, JSON.stringify([]));
                        APPS_LIST = [];
                    } else {
                        let data = await IOUtils.readUTF8(FILE_PATH);
                        APPS_LIST = JSON.parse(data);
                    }
                } catch (e) {
                    APPS_LIST = [];
                }
                return APPS_LIST;
            },
            openSaveDir() {
                this.exec(this.saveDir);
            },
            async changeSaveDir(event) {
                const mode = Ci.nsIFilePicker.modeGetFolder, title = formatStr("change download dir"), textIfCanceled = formatStr("Operaction Canceled!"), textIfOK = formatStr("Operaction Succeeded!");
                async function openFilePickerDialog() {
                    return new Promise(resolve => {
                        // 使用 Promise 让回调看起来不那么难受
                        const fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(window, title, mode);
                        fp.open(async result => {
                            if (result === Ci.nsIFilePicker.returnOK) {
                                resolve({ result, path: fp.file.path });
                            } else {
                                resolve({ result, path: null });
                            }
                        });
                    });
                }
                let status = await openFilePickerDialog();
                if (status.result === Ci.nsIFilePicker.returnOK) {
                    this.saveDir = status.path;
                    $ALERT(textIfOK);
                } else {
                    // Ci.nsIFilePicker.returnCancel
                    $ALERT(textIfCanceled);
                }
            },
            init: async function () {
                var pi = document.createProcessingInstruction(
                    'xml-stylesheet',
                    'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(CSS) + '"'
                );
                this.style = document.insertBefore(pi, document.documentElement);

                // 准备弹出菜单
                let menupopup = $C('menupopup', { class: 'owh-popup' });
                menupopup.appendChild($C('menuseparator', { class: 'owh-separator' }));
                menupopup.appendChild($C("menuitem", { label: formatStr("open download dir"), class: "folder", oncommand: "OpenWithHelper.openSaveDir(event);" }));
                menupopup.appendChild($C("menuitem", { label: formatStr("change download dir"), class: "settings", oncommand: "OpenWithHelper.changeSaveDir(event);" }));
                menupopup.appendChild($C('menuitem', { label: formatStr("manage applications"), class: "settings", url: 'chrome://userchrome/content/utils/ManageApps.html', where: 'tab', oncommand: 'OpenWithHelper.onCommand(event);' }));
                menupopup.appendChild($C('menuitem', { label: formatStr("about open with helper"), class: "info", url: 'https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS/OpenWithHelper', where: 'tab', oncommand: 'OpenWithHelper.onCommand(event);' }));

                this.menupopup = menupopup;
                await this.insertMenu();

                let tp = (gBrowser.mPanelContainer /* 屎山 */ || gBrowser.tabpanels);["mouseup", "keydown"].forEach(type => tp.addEventListener(type, this, false));

                $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
            },
            insertMenu: async function (isAlert) {
                $R($('OpenWithHelper-Btn-Popup'));
                $R($('OpenWithHelper-Ctx-Menu'));
                $R($('OpenWithHelper-Tab-Menu'));
                await this.reloadApps();
                menupopup = this.menupopup;
                // 插入菜单
                let BTN_POPUP = menupopup.cloneNode(true);
                BTN_POPUP.id = 'OpenWithHelper-Btn-Popup';
                $('mainPopupSet')?.appendChild(BTN_POPUP);

                let CTX_POPUP = menupopup.cloneNode(true);
                CTX_POPUP.id = 'OpenWithHelper-Ctx-Popup';
                let CTX_MENU = $C('menu', { id: 'OpenWithHelper-Ctx-Menu', label: formatStr("open with application") });
                // remove the comment to hide context menu icon for firefox 90+
                // if (GE_90) {
                //     CTX_MENU.classList.remove("menu-iconic");
                // }
                CTX_MENU.addEventListener('click', function (e) {
                    // 增加右键一级菜单点击功能
                    if(e.target !== e.currentTarget) return;
                    CTX_MENU.querySelector("[dynamic=true][exec]").doCommand();
                }, false)
                CTX_MENU.appendChild(CTX_POPUP);
                $('contentAreaContextMenu')?.insertBefore(CTX_MENU, $('#contentAreaContextMenu > menuseparator:last-child'));
                let TAB_POPUP = menupopup.cloneNode(true);
                TAB_POPUP.id = 'OpenWithHelper-Tab-Popup';
                let TAB_MENU = $C('menu', { id: 'OpenWithHelper-Tab-Menu', label: formatStr("open with application") });
                TAB_MENU.appendChild(TAB_POPUP);
                $('tabContextMenu')?.insertBefore(TAB_MENU, $('context_reopenInContainer')?.nextElementSibling);
                if (isAlert) {
                    $ALERT(formatStr("menu refreshed"));
                }
            },
            reloadApps: async function () {
                let { menupopup } = this;
                menupopup.querySelectorAll("[dynamic=true]").forEach(el => {
                    el.parentNode.removeChild(el);
                });
                let insertPoint = menupopup.querySelector(".owh-separator");
                (await this.getAppList()).forEach((app) => {
                    if (Object.keys(app).length === 0) {
                        let sep = menupopup.insertBefore($C("menuseparator", app), insertPoint);
                        sep.setAttribute("dynamic", true);
                        return;
                    }
                    if (!"exec" in app && !"url" in app) return;
                    let { label, exec, url, text, oncommand } = app;
                    if ("exec" in app) app.filename = exec.split(/\\|\//).pop();
                    if (typeof label === "undefined") {
                        if (typeof exec === "string") {
                            // 没有标签则取可执行文件的名字为标签
                            label = exec.split(/\\|\//).pop();
                        } else if (typeof url === "string") {
                            // 没有标签则取 url 为标签
                            label = url;
                        } else {
                            label = text;
                        }
                    }
                    if (typeof exec !== "undefined") {
                        app.exec = $RLP(exec);
                    }
                    if (typeof oncommand === "undefined") {
                        app.oncommand = 'OpenWithHelper.onCommand(event);';
                    }
                    Object.assign(app, { label, dynamic: true });
                    let menuitem = $C('menuitem', app);
                    this.setIcon(menuitem, app);
                    this.setCondition(menuitem, app.condition);
                    menupopup.insertBefore(menuitem, insertPoint);
                });
                this.menupopup = menupopup;
            },
            destroy: function () {
                (gBrowser.mPanelContainer || gBrowser.tabpanels).removeEventListener("mouseup", this, false);
                document.querySelectorAll(".owh-popup").forEach(el => {
                    if (el.parentNode)
                        el.parentNode.removeChild(el)
                });
                CustomizableUI.destroyWidget('OpenWithHelper-Btn');
            },
            handleEvent: function (event) {
                let isSelectKeyDown = false;
                switch (event.type) {
                    case "keydown":
                        // 如果不是 Ctrl + A 则返回
                        if (!event.ctrlKey || event.keyCode !== 65) isSelectKeyDown = true;
                    case "mouseup":
                        if (event.button !== 0 && !isSelectKeyDown) return;
                        // 鼠标按键释放时读取选中文本
                        if (content) {
                            this.selectedText = content.getSelection().toString();
                        } else {
                            try {
                                // 这个 API 有问题
                                gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                                    this.selectedText = r.selectedText;
                                })
                            } catch (e) { }
                        }
                        break;
                    case "popupshowing":
                        if (event.target != event.currentTarget) return;
                        if (event.target.id == 'contentAreaContextMenu') {
                            var state = [];
                            if (gContextMenu.onTextInput)
                                state.push("input");
                            if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                                state.push("select");
                            if (gContextMenu.onLink || event.target.querySelector("#context-openlinkincurrent").getAttribute("hidden") !== "true" /* 兼容 textLink.uc.js */)
                                state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                            if (gContextMenu.onCanvas)
                                state.push("canvas image");
                            if (gContextMenu.onImage)
                                state.push("image");
                            if (gContextMenu.onVideo || gContextMenu.onAudio)
                                state.push("media");
                            $("OpenWithHelper-Ctx-Menu").setAttribute("openWith", state.join(" "));
                        }
                        break;
                }
            },
            convertText(text) {
                var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                    link: {
                        href: "",
                        host: ""
                    },
                    target: {
                        alt: "",
                        title: ""
                    },
                    __noSuchMethod__: function (id, args) {
                        return ""
                    },
                };
                let tab = TabContextMenu.contextTab || gBrowser.selectedTab || document.popupNode;
                var bw = gContextMenu ? context.browser : tab.linkedBrowser;

                return text.replace(REGEXP, function (str) {
                    str = str.toUpperCase().replace("%LINK", "%RLINK");
                    if (str.indexOf("_HTMLIFIED") >= 0)
                        return htmlEscape(convert(str.replace("_HTMLIFIED", "")));
                    if (str.indexOf("_HTML") >= 0)
                        return htmlEscape(convert(str.replace("_HTML", "")));
                    if (str.indexOf("_ENCODE") >= 0)
                        return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                    if (str.indexOf("_TXT") >= 0) {
                        // 相比 addMenu 新增保存为 TXT 文件后缀 eg  %COOKIE_HOST_TXT% 保存当前网站的 COOKIE 为 域名.TXT 文件
                        let data = convert(str.replace("_TXT", ""));
                        let filename = (convert("%RLINK_HOST%") || convert("%H")) + ".txt";
                        let filepath = PathUtils.join(DEFINED_DIRS["TmpD"], filename);
                        $SAVE(filepath, data);
                        return filepath;
                    }
                    if (str.indexOf("_QUOT") >= 0)
                        return convert(str.replace("_QUOT", "")).replace(/"/g, '\\"');
                    return convert(str);
                });

                function convert(str) {
                    switch (str) {
                        case "%T":
                            return bw.contentTitle;
                        case "%TITLE%":
                            return bw.contentTitle;
                        case "%TITLES%":
                            return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "");
                        case "%U":
                            return bw.documentURI.spec;
                        case "%URL%":
                            return bw.documentURI.spec;
                        case "%H":
                            return bw.documentURI.host;
                        case "%HOST%":
                            return bw.documentURI.host;
                        case "%S":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%SEL%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%SL":
                        case "%SEL_OR_LT%":
                        case "%SEL_OR_LINK_TEXT%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || context.linkText();
                        case "%L":
                            return context.linkURL || "";
                        case "%RLINK%":
                            return context.linkURL || "";
                        case "%RLINK_HOST%":
                            return context.link.host || "";
                        case "%RLINK_TEXT%":
                            return context.linkText() || "";
                        case "%RLINK_OR_URL%":
                            return context?.linkURL || bw?.documentURI?.spec || "";
                        case "%RLT_OR_UT%":
                            return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                        case "%IMAGE_ALT%":
                            return context.target.alt || "";
                        case "%IMAGE_TITLE%":
                            return context.target.title || "";
                        case "%I":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_URL%":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%M":
                            return context.mediaURL || "";
                        case "%MEDIA_URL%":
                            return context.mediaURL || "";
                        case "%P":
                            return readFromClipboard() || "";
                        case "%CLIPBOARD%":
                            return readFromClipboard() || "";
                        case "%PD":
                        case "%PROFILE_DIR%":
                            // 配置文件夹路径
                            return PathUtils.profileDir || "";
                        case "%SD":
                        case "%SAVE_DIR%":
                            return OpenWithHelper.saveDir || DEFAULT_SAVE_DIR;
                        case "%COOKIE%":
                            return $COOKIE(OpenWithHelper.convertText("%LINK_OR_URL%"));
                        case "%CN":
                        case "%COOKIE_NETSCAPE%":
                            let netscapeStyle = true; // Nescapte 格式 Cookie
                        case "%CH":
                        case "%COOKIE_HOST%":
                            let cookiesURL = OpenWithHelper.convertText("%LINK_OR_URL%");
                            let cookiesURI;
                            try {
                                cookiesURI = Services.io.newURI(cookiesURL, null, null);
                            } catch (e) {
                                cookiesURI = {
                                    host: $RSTR(10)
                                }
                            }
                            let cookies = $COOKIE(cookiesURI.prePath, netscapeStyle);
                            return cookies;
                        case "%CS":
                        case "%COOKIES_SQLITE%":
                            // 读取 Firefox Cookies 文件 cookies.sqlite 的路径
                            return PathUtils.join(PathUtils.profileDir, "cookies.sqlite");
                        case "%EOL%":
                            return "\r\n";
                    }
                    return str;
                }

                function htmlEscape(s) {
                    return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
                }

            },
            onCommand: function (event) {
                let url = event.target.getAttribute('url') || "";
                let where = event.target.getAttribute('where') || "";
                let text = event.target.getAttribute('text') || "";
                let exec = event.target.getAttribute('exec') || "";
                if (url) {
                    this.openCommand(event, url, where);
                } else if (exec) {
                    this.exec(exec, this.convertText(text));
                }
            },
            openCommand: function (event, url, where, aPostData, aReferrerInfo) {
                // 整改完毕，addMenuPlus.uc.js 也会更新到这个函数
                var uri;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    return this.log('Url is invalid: %s').replace("%s", url);
                }
                if (uri.scheme === "javascript") {
                    $LOADURI(url);
                    return;
                }
                where = where || WHERE_MAP[event.button] || "tab";
                aAllowThirdPartyFixup = {
                    triggeringPrincipal: where === 'current' ?
                        gBrowser.selectedBrowser.contentPrincipal : (
                            /^(f|ht)tps?:/.test(url) ?
                                Services.scriptSecurityManager.createNullPrincipal({}) :
                                Services.scriptSecurityManager.getSystemPrincipal()
                        ),
                    postData: aPostData,
                    referrerInfo: aReferrerInfo
                }

                openTrustedLinkIn(url, where, aAllowThirdPartyFixup);
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
                        this.error("File not found: %s".replace("%s", path));
                        return;
                    }

                    // Linux 下目录也是 executable
                    if (!file.isDirectory() && file.isExecutable()) {
                        process.init(file);
                        process.runw(false, a, a.length);
                    } else {
                        file.launch();
                    }
                } catch (e) {
                    this.log(e);
                }
            },
            setIcon: function (menu, obj) {
                for (let attr of ["image", "src", "icon"]) {
                    if (menu.getAttribute(attr)) {
                        menu.style.listStyleImage = "url(" + menu.getAttribute(attr) + ")";
                        menu.removeAttribute(attr);
                        return;
                    }
                }

                if (obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(obj.exec);
                    } catch (e) {
                        return;
                    }
                    // if (!aFile.exists() || !aFile.isExecutable()) {
                    if (!aFile.exists()) {
                        menu.setAttribute("disabled", "true");
                    } else if (aFile.isFile()) {
                        let fileURL = $USF(aFile);
                        menu.style.listStyleImage = `url("moz-icon://${fileURL}?size=16")`;
                    } else {
                        menu.style.listStyleImage = `url("chrome://global/skin/icons/folder.svg")`;
                    }
                    return;
                }

                var setIconCallback = function (url) {
                    let uri, iconURI;
                    try {
                        uri = Services.io.newURI(url, null, null);
                    } catch (e) {
                        this.log(e)
                    }
                    if (!uri) return;

                    menu.setAttribute("scheme", uri.scheme);
                    PlacesUtils.favicons.getFaviconDataForPage(uri, {
                        onComplete: function (aURI, aDataLen, aData, aMimeType) {
                            try {
                                // javascript: URI の host にアクセスするとエラー
                                let iconURL = aURI && aURI.spec ?
                                    "moz-anno:favicon:" + aURI.spec :
                                    "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico";
                                menu.setAttribute("image", iconURL);
                            } catch (e) { }
                        }
                    });
                }

                PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                    let url;
                    if (entry) {
                        url = entry.url.href;
                    } else {
                        url = (obj.url + '').replace(this.regexp, "");
                    }
                    setIconCallback(url);
                }, e => {
                    this.log(e)
                }).catch(e => { });
            },
            setCondition: function (menu, condition) {
                condition || (condition = "button tab normal");
                let beforeProcessConditons = condition.split(' ');
                let conditions = [];
                for (let i = 0; i < beforeProcessConditons.length; i++) {
                    let c = beforeProcessConditons[i] || "";
                    if (c === "normal") {
                        conditions.push("normal");
                    } else if (["button", "tab", "select", "link", "mailto", "image", "canvas", "media", "input"].includes(c.replace(/^no/, ""))) {
                        conditions.push(c);
                    }
                }
                // hack，没写完（配合的 CSS 也没写完），凑合用
                if ((menu.getAttribute("text") || "").includes("%LINK")) {
                    conditions.push("link");
                }
                if ((menu.getAttribute("text") || "").includes("%SEL")) {
                    conditions.push("select");
                }
                if ((menu.getAttribute("text") || "").includes("URL%") && !conditions.includes("notab")) {
                    conditions.push("tab");
                }
                if (!conditions.includes("nobutton")) {
                    conditions.push("button");
                }
                if (conditions.length) {
                    menu.setAttribute("condition", conditions.join(" "));
                }
            },
            alert: $ALERT,
            log: console.log,
            error: console.error
        }

        window.OpenWithHelper.init();

        function formatStr() {
            let key = arguments[0];
            if (key) {
                if (!LANG[LOCALE].hasOwnProperty(key)) return capitalize(key);
                let str = LANG[LOCALE][key];
                for (let i = 1; i < arguments.length; i++) {
                    str = str.replace("%s", arguments[i]);
                }
                return str;
            } else return "";
        }

        function capitalize(s) {
            return s && s[0].toUpperCase() + s.slice(1);
        }

        if (!(CustomizableUI.getWidget('OpenWithHelper-Btn') && CustomizableUI.getWidget('OpenWithHelper-Btn').forWindow(window)?.node)) {
            try {
                CustomizableUI.createWidget({
                    id: 'OpenWithHelper-Btn',
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    localized: false,
                    onCreated: node => {
                        for (let [key, value] of Object.entries({
                            label: formatStr("open with helper"),
                            tooltiptext: formatStr("open with helper tooltip"),
                            contextmenu: false,
                            type: "menu",
                        })) {
                            node.setAttribute(key, value);
                        }
                        node.addEventListener("mouseover", (event) => {
                            // 调整弹出菜单位置，按钮放在浏览器4个角都不一样
                            const menupopup = node.ownerDocument.querySelector("#OpenWithHelper-Btn-Popup");

                            if (!menupopup) return;

                            if (menupopup.parentNode.id !== "OpenWithHelper-Btn") {
                                event.target.appendChild(menupopup);
                            }

                            const { innerWidth: w, innerHeight: h } = event.target.ownerGlobal;
                            const x = event.clientX;
                            const y = event.clientY;

                            let position;
                            if (x > w / 2) {
                                position = y < h / 2 ? 'after_end' : 'before_start';
                            } else {
                                position = 'before_start';
                            }

                            if (position) {
                                menupopup.setAttribute("position", position);
                            } else {
                                menupopup.removeAttribute("position");
                            }
                        });
                    },
                    onDestroyed: node => {

                    }
                });
            } catch (e) { }
        } else {
            return;
        }
    })(`
#OpenWithHelper-Btn,
#OpenWithHelper-Ctx-Menu,
#OpenWithHelper-Tab-Menu {
    list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIwIiB5PSIwIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjM1KSI+DQogIDxwYXRoIGZpbGw9IiM5MGE0YWUiIGQ9Ik02LDMzdjVjMCwxLjcsMS4zLDMsMywzaDMwYzEuNywwLDMtMS4zLDMtM3YtNUg2eiIgLz4NCiAgPHBhdGggZmlsbD0iI2NmZDhkYyIgZD0iTTQyLDMzYy0wLjEsMS43LTEuNSwzLTMuMSwzSDljLTEuNiwwLTMtMS4zLTMtM1YxMGMwLTEuNywxLjMtMywzLTNoMjkuOWMxLjYsMCwzLDEuMywzLjEsM0w0MiwzM0w0MiwzM3oiIC8+DQogIDxwYXRoIGZpbGw9IiM1NDZlN2EiIGQ9Ik0yMiwyMGgtMy41Yy0xLjksMC0zLjUtMS42LTMuNS0zLjVzMS42LTMuNSwzLjUtMy41czMuNSwxLjYsMy41LDMuNVYyMHogTTE4LjUsMTVjLTAuOCwwLTEuNSwwLjctMS41LDEuNSBzMC43LDEuNSwxLjUsMS41SDIwdi0xLjVDMjAsMTUuNywxOS4zLDE1LDE4LjUsMTV6IiAvPg0KICA8cGF0aCBmaWxsPSIjNTQ2ZTdhIiBkPSJNMjkuNSwyMEgyNnYtMy41YzAtMS45LDEuNi0zLjUsMy41LTMuNXMzLjUsMS42LDMuNSwzLjVTMzEuNCwyMCwyOS41LDIweiBNMjgsMThoMS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNSBTMzAuMywxNSwyOS41LDE1UzI4LDE1LjcsMjgsMTYuNVYxOHoiIC8+DQogIDxwYXRoIGZpbGw9IiM1NDZlN2EiIGQ9Ik0xOC41LDMwYy0xLjksMC0zLjUtMS42LTMuNS0zLjVzMS42LTMuNSwzLjUtMy41SDIydjMuNUMyMiwyOC40LDIwLjQsMzAsMTguNSwzMHogTTE4LjUsMjUgYy0wLjgsMC0xLjUsMC43LTEuNSwxLjVzMC43LDEuNSwxLjUsMS41czEuNS0wLjcsMS41LTEuNVYyNUgxOC41eiIgLz4NCiAgPHBhdGggZmlsbD0iIzU0NmU3YSIgZD0iTTI5LjUsMzBjLTEuOSwwLTMuNS0xLjYtMy41LTMuNVYyM2gzLjVjMS45LDAsMy41LDEuNiwzLjUsMy41UzMxLjQsMzAsMjkuNSwzMHogTTI4LDI1djEuNSBjMCwwLjgsMC43LDEuNSwxLjUsMS41czEuNS0wLjcsMS41LTEuNVMzMC4zLDI1LDI5LjUsMjVIMjh6IiAvPg0KICA8cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSI1IiB4PSIyMCIgeT0iMTkiIGZpbGw9IiM1NDZlN2EiIC8+DQogIDxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjIiIHg9IjIxIiB5PSIxOCIgZmlsbD0iIzU0NmU3YSIgLz4NCiAgPHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iNSIgeD0iMjYiIHk9IjE5IiBmaWxsPSIjNTQ2ZTdhIiAvPg0KICA8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSIyIiB4PSIyMSIgeT0iMjMiIGZpbGw9IiM1NDZlN2EiIC8+DQo8L3N2Zz4=)
}
#OpenWithHelper-Btn-Popup menuitem:is([text*="%URL"]) {
    display: none;
}
.owh-popup menugroup > .menuitem-iconic {
    -moz-box-flex: 1;
    -moz-box-pack: center;
    -moz-box-align: center;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    padding-block: 6px;
    padding-inline-start: 1em;
}
.owh-popup menugroup > .menuitem-iconic > .menu-iconic-left {
    -moz-appearance: none;
    padding-top: 0;
}
.owh-popup menugroup > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
    width: 16px;
    height: 16px;
}
.owh-popup menuitem[style*="file:///"]:is([filename="MyChrome.exe"], [filename="chrome.exe"]) {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMTUpIj48cGF0aCBmaWxsPSIjNGNhZjUwIiBkPSJNNDQsMjRjMCwxMS4wNDQtOC45NTYsMjAtMjAsMjBTNCwzNS4wNDQsNCwyNFMxMi45NTYsNCwyNCw0UzQ0LDEyLjk1Niw0NCwyNHoiLz48cGF0aCBmaWxsPSIjZmZjMTA3IiBkPSJNMjQsNHYyMGw4LDRsLTguODQzLDE2YzAuMzE3LDAsMC41MjYsMCwwLjg0MywwYzExLjA1MywwLDIwLTguOTQ3LDIwLTIwUzM1LjA1Myw0LDI0LDR6Ii8+PHBhdGggZmlsbD0iIzNkZGFiNCIgZD0iTTQ0LDI0YzAsMTEuMDQ0LTguOTU2LDIwLTIwLDIwUzQsMzUuMDQ0LDQsMjRTMTIuOTU2LDQsMjQsNFM0NCwxMi45NTYsNDQsMjR6Ii8+PHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTI0LDR2MjBsOCw0bC04Ljg0MywxNmMwLjMxNywwLDAuNTI2LDAsMC44NDMsMGMxMS4wNTMsMCwyMC04Ljk0NywyMC0yMFMzNS4wNTMsNCwyNCw0eiIvPjxwYXRoIGZpbGw9IiNmNTUzNzYiIGQ9Ik00MS44NCwxNUgyNHYxM2wtMy0xTDcuMTYsMTMuMjZINy4xNEMxMC42OCw3LjY5LDE2LjkxLDQsMjQsNEMzMS44LDQsMzguNTUsOC40OCw0MS44NCwxNXoiLz48cGF0aCBmaWxsPSIjZWIwMDAwIiBkPSJNNy4xNTgsMTMuMjY0bDguODQzLDE0Ljg2MkwyMSwyN0w3LjE1OCwxMy4yNjR6Ii8+PHBhdGggZmlsbD0iIzAwYjU2OSIgZD0iTTIzLjE1Nyw0NGw4LjkzNC0xNi4wNTlMMjgsMjVMMjMuMTU3LDQ0eiIvPjxwYXRoIGZpbGw9IiNlYjAwMDAiIGQ9Ik00MS44NjUsMTVIMjRsLTEuNTc5LDQuNThMNDEuODY1LDE1eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0zMywyNGMwLDQuOTY5LTQuMDMxLDktOSw5cy05LTQuMDMxLTktOXM0LjAzMS05LDktOVMzMywxOS4wMzEsMzMsMjR6Ii8+PHBhdGggZmlsbD0iI2E2NGFmZiIgZD0iTTMxLDI0YzAsMy44NjctMy4xMzMsNy03LDdzLTctMy4xMzMtNy03czMuMTMzLTcsNy03UzMxLDIwLjEzMywzMSwyNHoiLz48L3N2Zz4=) !important;
}
.owh-popup menuitem[filename="you-get.exe"][style*="file:///"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDQ4IDQ4IiB0cmFuc2Zvcm09InNjYWxlKDEuMjUpIj48cGF0aCBmaWxsPSIjOEJDMzRBIiBkPSJNMzgsNDJIMTBjLTIuMjA5LDAtNC0xLjc5MS00LTRWMTBjMC0yLjIwOSwxLjc5MS00LDQtNGgyOGMyLjIwOSwwLDQsMS43OTEsNCw0djI4QzQyLDQwLjIwOSw0MC4yMDksNDIsMzgsNDIiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMzEgMjRMMjAgMTYgMjAgMzJ6Ii8+PC9zdmc+) !important;
}
.owh-popup menuitem[filename="yt-dlp.exe"][style*="file:///"] {
    list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHRyYW5zZm9ybT0ic2NhbGUoMS40KSI+PHBhdGggZmlsbD0iI2ZmNjk3YiIgZD0iTTg2LjIsMTA0SDQxLjhDMzIsMTA0LDI0LDk2LDI0LDg2LjJWNDEuOEMyNCwzMiwzMiwyNCw0MS44LDI0aDQ0LjRDOTYsMjQsMTA0LDMyLDEwNCw0MS44djQ0LjRDMTA0LDk2LDk2LDEwNCw4Ni4yLDEwNHoiLz48cGF0aCBmaWxsPSIjZmY2OTdiIiBkPSJNODYuMiwxMDRINDEuOEMzMiwxMDQsMjQsOTYsMjQsODYuMlY0MS44QzI0LDMyLDMyLDI0LDQxLjgsMjRoNDQuNEM5NiwyNCwxMDQsMzIsMTA0LDQxLjh2NDQuNEMxMDQsOTYsOTYsMTA0LDg2LjIsMTA0eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNCw0MS44djE0LjdjMTQuNS0xMS4xLDQxLjItMjQuOSw3OS41LTE5QzEwMS41LDI5LjcsOTQuNiwyNCw4Ni4yLDI0SDQxLjhDMzIsMjQsMjQsMzIsMjQsNDEuOHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNTMuNSA0OUw1My41IDc5IDc5LjUgNjR6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNDQ0YjU0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iNiIgZD0iTTg2LjIsMTA0SDQxLjhDMzIsMTA0LDI0LDk2LDI0LDg2LjJWNDEuOEMyNCwzMiwzMiwyNCw0MS44LDI0aDQ0LjRDOTYsMjQsMTA0LDMyLDEwNCw0MS44djQ0LjRDMTA0LDk2LDk2LDEwNCw4Ni4yLDEwNHoiLz48L3N2Zz4=) !important;
}
.owh-popup menuitem[filename="lux.exe"][style*="file:///"]{
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjQsIDEuMSkiPg0KICA8cGF0aCBmaWxsPSIjMDBiNTY5IiBkPSJNMjksMTZIMTl2LTVjMC0yLjc2MSwyLjIzOS01LDUtNWgwYzIuNzYxLDAsNSwyLjIzOSw1LDVWMTZ6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNNDIuNzU0LDI5LjU2NEMzOS42ODEsMjcuMTE1LDMyLjk1MSwyNiwyOCwyNnYtNGM1LjM4OCwwLDEzLjEzOCwxLjE2MiwxNy4yNDYsNC40MzZMNDIuNzU0LDI5LjU2NHoiIC8+DQogIDxwYXRoIGZpbGw9IiNmNWJjMDAiIGQ9Ik0yOC43NDMsMjMuODU3bC0xLjQ4Ni0zLjcxNEMzMS4zLDE4LjUyNiwzNiwxMi40MzIsMzYsN2g0QzQwLDEzLjU4MSwzNC43MzksMjEuNDU4LDI4Ljc0MywyMy44NTd6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNNDMsNDRoLTRjMC01Ljk1Mi03LjA1Ny0xMi0xMS0xMnYtNEMzNC4yNzIsMjgsNDMsMzYuMDYzLDQzLDQ0eiIgLz4NCiAgPHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTUuMjQ2LDI5LjU2NGwtMi40OTItMy4xMjhDNi44NjIsMjMuMTYyLDE0LjYxMiwyMiwyMCwyMnY0QzE1LjA0OSwyNiw4LjMxOSwyNy4xMTUsNS4yNDYsMjkuNTY0eiIgLz4NCiAgPHBhdGggZmlsbD0iI2Y1YmMwMCIgZD0iTTE5LjI1NywyMy44NTdDMTMuMjYxLDIxLjQ1OCw4LDEzLjU4MSw4LDdoNGMwLDUuNDMyLDQuNywxMS41MjYsOC43NDMsMTMuMTQzTDE5LjI1NywyMy44NTd6IiAvPg0KICA8cGF0aCBmaWxsPSIjZjViYzAwIiBkPSJNOSw0NEg1YzAtNy45MzgsOC43MjgtMTYsMTUtMTZ2NEMxNi4wNTcsMzIsOSwzOC4wNDgsOSw0NHoiIC8+DQogIDxwYXRoIGZpbGw9IiMzZGRhYjQiIGQ9Ik0yNCw5TDI0LDljLTUuNTIzLDAtMTAsNC40NzctMTAsMTB2MWM1LDUsMTUsNSwyMCwwdi0xQzM0LDEzLjQ3NywyOS41MjMsOSwyNCw5eiIgLz4NCiAgPHBhdGggZmlsbD0iIzNkZGFiNCIgZD0iTTE0LDIwdjl2NWMwLDUuNTIzLDQuNDc3LDEwLDEwLDEwczEwLTQuNDc3LDEwLTEwdi01di05QzI5LDE1LDE5LDE1LDE0LDIweiIgLz4NCiAgPHBhdGggZmlsbD0iIzAwYjU2OSIgZD0iTTE0LDIwYzUsNSwxNSw1LDIwLDBDMjksMTUsMTksMTUsMTQsMjB6IiAvPg0KICA8cGF0aCBmaWxsPSIjMDBiNTY5IiBkPSJNMjQsNDRjMC44OTYsMCwxLjc2MS0wLjEyNCwyLjU4Ni0wLjM0N0wyNCwyOWwtMi41ODYsMTQuNjUzQzIyLjIzOSw0My44NzYsMjMuMTA0LDQ0LDI0LDQ0eiIgLz4NCjwvc3ZnPg==) !important;
}
.owh-popup menuitem.folder {
    list-style-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBmaWxsPSIjZmVkYzc3IiBkPSJNMiAxLjUgMSAyIC41IDN2MTBsLjUgMSAxIC41aDEybDEtLjUuNS0xVjQuNWwtLjUtMS0xLS41SDcuNWwtMi0xLjV6Ii8+CiAgPHBhdGggZmlsbD0iI2E5N2EwNCIgZD0ibTIuNSAxLS4xNjQuMDA2QTIuNSAyLjUgMCAwIDAgMCAzLjV2OWwuMDA2LjE2NEEyLjUgMi41IDAgMCAwIDIuNSAxNWgxMWwuMTY0LS4wMDZBMi41IDIuNSAwIDAgMCAxNiAxMi41VjVsLS4wMDYtLjE2NC0uMDE2LS4xNjJBMi41IDIuNSAwIDAgMCAxMy41IDIuNUg3LjY2OEw2LjA2NiAxLjNsLS4xMzQtLjA4OWExLjUgMS41IDAgMCAwLS43NjYtLjIxem0wIDFoMi42NjZsLjA4LjAwNmMuMDguMDEzLjE1Ni4wNDUuMjIuMDk0bDEuMjI4LjkyMi0xLjI2IDEuMzI0LS4wNi4wNTJhLjQ5OS40OTkgMCAwIDEtLjMwMi4xMDJMMSA0LjQ5OFYzLjVsLjAwOC0uMTQ1QTEuNDk5IDEuNDk5IDAgMCAxIDIuNSAyem01LjExNyAxLjVIMTMuNWwuMTQ0LjAwOEMxNC40MDUgMy41OCAxNSA0LjIyIDE1IDV2Ny41bC0uMDA4LjE0NEExLjQ5OSAxLjQ5OSAwIDAgMSAxMy41IDE0aC0xMWwtLjE0NS0uMDA3QTEuNDk5IDEuNDk5IDAgMCAxIDEgMTIuNVY1LjQ5OGw0LjA3Mi4wMDEuMTUzLS4wMDdhMS41IDEuNSAwIDAgMCAuOTMzLS40NTd6Ii8+Cjwvc3ZnPgo=);
}
.owh-popup menuitem.info {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJzY2FsZSgxLjIpIj4NCiAgPHBhdGggZmlsbD0iIzIxOTZmMyIgZD0iTTQ0LDI0YzAsMTEuMDQ1LTguOTU1LDIwLTIwLDIwUzQsMzUuMDQ1LDQsMjRTMTIuOTU1LDQsMjQsNFM0NCwxMi45NTUsNDQsMjR6IiAvPg0KICA8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjIgMjJoNHYxMWgtNFYyMnpNMjYuNSAxNi41YzAgMS4zNzktMS4xMjEgMi41LTIuNSAyLjVzLTIuNS0xLjEyMS0yLjUtMi41UzIyLjYyMSAxNCAyNCAxNCAyNi41IDE1LjEyMSAyNi41IDE2LjV6IiAvPg0KPC9zdmc+);
}
.owh-popup menuitem.settings {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB0cmFuc2Zvcm09InNjYWxlKDEuMDUpIj4NCiAgPHBhdGggZmlsbD0iIzMyQkVBNiIgZD0iTTUwNC4xLDI1NkM1MDQuMSwxMTksMzkzLDcuOSwyNTYsNy45QzExOSw3LjksNy45LDExOSw3LjksMjU2QzcuOSwzOTMsMTE5LDUwNC4xLDI1Niw1MDQuMUMzOTMsNTA0LjEsNTA0LjEsMzkzLDUwNC4xLDI1NnoiIC8+DQogIDxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik00MTYuMiwyNzUuM3YtMzguNmwtMzYuNi0xMS41Yy0zLjEtMTIuNC04LTI0LjEtMTQuNS0zNC44bDE3LjgtMzQuMUwzNTUuNiwxMjlsLTM0LjIsMTcuOGMtMTAuNi02LjQtMjIuMi0xMS4yLTM0LjYtMTQuM2wtMTEuNi0zNi44aC0zOC43bC0xMS42LDM2LjhjLTEyLjMsMy4xLTI0LDcuOS0zNC42LDE0LjNMMTU2LjQsMTI5TDEyOSwxNTYuNGwxNy44LDM0LjFjLTYuNCwxMC43LTExLjQsMjIuMy0xNC41LDM0LjhsLTM2LjYsMTEuNXYzOC42bDM2LjQsMTEuNWMzLjEsMTIuNSw4LDI0LjMsMTQuNSwzNS4xTDEyOSwzNTUuNmwyNy4zLDI3LjNsMzMuNy0xNy42YzEwLjgsNi41LDIyLjcsMTEuNSwzNS4zLDE0LjZsMTEuNCwzNi4yaDM4LjdsMTEuNC0zNi4yYzEyLjYtMy4xLDI0LjQtOC4xLDM1LjMtMTQuNmwzMy43LDE3LjZsMjcuMy0yNy4zbC0xNy42LTMzLjhjNi41LTEwLjgsMTEuNC0yMi42LDE0LjUtMzUuMUw0MTYuMiwyNzUuM3ogTTI1NiwzNDAuOGMtNDYuNywwLTg0LjYtMzcuOS04NC42LTg0LjZjMC00Ni43LDM3LjktODQuNiw4NC42LTg0LjZjNDYuNywwLDg0LjUsMzcuOSw4NC41LDg0LjZDMzQwLjUsMzAzLDMwMi43LDM0MC44LDI1NiwzNDAuOHoiIC8+DQo8L3N2Zz4=);
}
#OpenWithHelper-Tab-Menu menuitem[dynamic=true]:not([condition~="tab"]),
#OpenWithHelper-Tab-Menu menuitem[dynamic=true][condition~="notab"],
#OpenWithHelper-Ctx-Menu menuitem[dynamic=true][condition],
#OpenWithHelper-Btn-Popup menuitem[dynamic=true]:not([condition~="button"]),
#OpenWithHelper-Btn-Popup menuitem[dynamic=true][condition~="nobutton"] {
    display: none;
}
#OpenWithHelper-Ctx-Menu[openWith=""] menuitem[dynamic=true][condition~="normal"],
#OpenWithHelper-Ctx-Menu[openWith~="select"] menuitem[dynamic=true][condition~="select"],
#OpenWithHelper-Ctx-Menu[openWith~="input"] menuitem[dynamic=true][condition~="select"],
#OpenWithHelper-Ctx-Menu[openWith~="link"] menuitem[dynamic=true][condition~="link"],
#OpenWithHelper-Ctx-Menu[openWith~="image"] menuitem[dynamic=true][condition~="image"],
#OpenWithHelper-Ctx-Menu[openWith~="media"] menuitem[dynamic=true][condition~="media"],
#OpenWithHelper-Ctx-Menu[openWith~="canvas"] menuitem[dynamic=true][condition~="canvas"]{
    display: flex;
    display: -moz-box;
}

`, (function () {
        // 初始化正则
        let he = "(?:_HTML(?:IFIED)?|_ENCODE|_QUOT|_TXT)?";
        let rTITLE = "%TITLE" + he + "%|%t\\b";
        let rTITLES = "%TITLES" + he + "%|%t\\b";
        let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
        let rSEL = "%SEL" + he + "%|%s\\b";
        let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
        let rExt = "%EOL" + he + "%";
        let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
        let rRLT_OR_UT = "%RLT_OR_UT" + he + "%";
        let rCOOKIE = "%COOKIE" + he + "%";
        let rCOOKIE_NESCAPE = "%COOKIE_NETSCAPE" + he + "%|%cn\\b";
        let rCOOKIE_HOST = "%COOKIE_HOST" + he + "%|%ch\\b";
        let rCOOKIES_SQLITE = "%COOKIES_SQLITE" + he + "%|%cs\\b";
        let rSAVE_DIR = "%SAVE_DIR" + he + "%|%sd\\b";
        let rPROFILE_DIR = "%PROFILE_DIR" + he + "%|%pd\\b";

        return new RegExp([rTITLE, rTITLES, rURL, rSEL, rLINK, rCLIPBOARD, rExt, rRLT_OR_UT, rCOOKIE, rCOOKIE_NESCAPE, rCOOKIE_HOST, rCOOKIES_SQLITE, rSAVE_DIR, rPROFILE_DIR].join("|"), "ig");
    })(), (function () {
        let PATHS = [];
        ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
            let path = Services.dirsvc.get(key, Ci.nsIFile);
            PATHS[key] = path.path;
        });
        return PATHS;
    })(), PathUtils.join(PathUtils.profileDir, "chrome", ...(Services.prefs.getStringPref("userChromeJS.OpenWithHelper.FILE_PATH", "_openwith.json").replace(/\\/g, "/").split("/"))),
        ["current", "tab", "tabshifted"],
        Services.vc.compare(Services.appinfo.version, "89.0.2"),
        function $(sel) {
            return /^[\.#]/.test(sel) ? document.querySelector(sel) : document.getElementById(sel);
        },
        function createXULElement(tag, attrs) {
            const el = document.createXULElement(tag);
            for (const key in attrs) el.setAttribute(key, attrs[key]);
            const iconicTags = ["menu", "menuitem"];
            if (iconicTags.includes(el.tagName.toLowerCase())) {
                el.classList.add(`${el.tagName.toLowerCase()}-iconic`);
            }
            return el;
        },
        function (target) {
            if (target && target.parentNode && typeof target.parentNode.removeChild === "function")
                return target.parentNode.removeChild(target);
        },
        (function () {
            return function handleRelativePath(path, parentPath) {
                if (path) {
                    var ffdir = parentPath ? parentPath : Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
                    // windows 的目录分隔符不一样
                    if (AppConstants.platform === "win") {
                        path = path.replace(/\//g, '\\');
                        if (/^(\\)/.test(path)) {
                            return ffdir + path;
                        }
                    } else {
                        path = path.replace(/\\/g, '//');
                        if (/^(\/\/)/.test(path)) {
                            return ffdir + path.replace(/^\/\//, "/");
                        }
                    }
                    return path;
                }
            }
        })(),
        (function () {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);

            const getFileURLSpec = "getURLSpecFromFile" in fph ?
                f => fph.getURLSpecFromFile(f) :
                f => fph.getURLSpecFromActualFile(f);

            return getFileURLSpec;
        })(),
        (function () {
            if ("loadURI" in window) {
                return (url) => {
                    gBrowser.loadURI(url instanceof Ci.nsIURI ? url.spec : url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else {
                return (url) => {
                    try {
                        gBrowser.loadURI(url instanceof Ci.nsIURI ? url : Services.io.newURI(url, null, null), { triggeringPrincipal: gBrowser.contentPrincipal });
                    } catch (ex) {
                        console.error(ex);
                    }
                }
            }
        })(), function alert(aMsg, aTitle, aCallback) {
            var callback = aCallback ? {
                observe: function (subject, topic, data) {
                    if ("alertclickcallback" != topic)
                        return;
                    aCallback.call(null);
                }
            } : null;
            var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            alertsService.showAlertNotification(
                Services.vc.compare(Services.appinfo.version, "77.0.1") ? "chrome://devtools/skin/images/browsers/firefox.svg" : "chrome://global/skin/icons/information-32.png", aTitle || "Open With Helper",
                aMsg + "", !!callback, "", callback);
        }, function collectCookies(url, NetscapeStyle) {
            let uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) { return ""; }

            let cookies = Services.cookies.getCookiesFromHost(uri.host, {});

            if (NetscapeStyle) {
                return cookies.map(formatCookieNetscapeStyle).join("");
            } else {
                return cookies.map(formatCookie).join("; ");
            }

            function formatCookie(cookiePair) {
                return cookiePair.name + "=" + cookiePair.value;
            }

            function formatCookieNetscapeStyle(cookiePair) {
                return [
                    [
                        cookiePair.isHttpOnly ? '#HttpOnly_' : '',
                        cookiePair.host
                    ].join(''),
                    cookiePair.isDomain ? 'TRUE' : 'FALSE',
                    cookiePair.path,
                    cookiePair.isSecure ? 'TRUE' : 'FALSE',
                    cookiePair.expires,
                    cookiePair.name,
                    cookiePair.value + '\n'
                ].join('\t');
            }
        }, function randomString(e) {
            e = e || 32;
            var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
                a = t.length,
                n = "";
            for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
            return n
        }, function saveFile(path, data) {
            let isCompleted = false, fileExists = false, isError = false;
            IOUtils.exists(path).then(() => {
                isCompleted = true;
                fileExists = true;
            }).catch(() => {
                isCompleted = true;
            });

            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (!isCompleted) {
                thread.processNextEvent(true);
            }

            if (fileExists) {
                isCompleted = false;
                IOUtils.remove(path).then(() => {
                    isCompleted = true;
                }).catch((e) => {
                    isCompleted = true;
                    isError = true;
                    console.error(e);
                });

                var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                while (!isCompleted) {
                    thread.processNextEvent(true);
                }

                if (isError) return;
            }

            isCompleted = false;
            IOUtils.writeUTF8(path, data).then(() => {
                isCompleted = true;
            }).catch((e) => {
                isCompleted = true;
                console.error(e);
            })

            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (!isCompleted) {
                thread.processNextEvent(true);
            }
        }, function escapeCommandLineArg(arg) {
            // 需要转义的字符
            const specialChars = ['\\', '"', '\'', '&', '|', '>', '<', '^', '~', '*', '?', '[', ']', '(', ')', '{', '}', '$', ';', '#'];

            let escapedArg = '';
            for (let i = 0; i < arg.length; i++) {
                const char = arg.charAt(i);
                if (specialChars.includes(char)) {
                    // 如果是特殊字符，则添加转义字符
                    escapedArg += '\\' + char;
                } else {
                    escapedArg += char;
                }
            }

            return escapedArg;
        }, (function () {
            let LANG = {
                "zh-CN": {
                    "open with helper": "打开助手",
                    "open with helper tooltip": "使用其他应用打开内容",
                    "open with application": "在其他应用中打开",
                    "open download dir": "打开下载目录",
                    "change download dir": "更改下载目录",
                    "manage applications": "管理应用",
                    "about open with helper": "关于打开助手",
                    "menu refreshed": "菜单已刷新!",
                    "Operaction Canceled!": "操作已取消!",
                    "Operaction Failed!": "操作失败!",
                },
                "en-US": {
                    "open with helper": "Open With Helper",
                    "open with helper tooltip": "Open content with applications",
                    "open with application": "Open With Application",
                    "open download dir": "Open Download Dir",
                    "change download dir": "Change Download Dir",
                    "manage applications": "Manage Applications",
                    "about open with helper": "About Open With Helper",
                    "menu refreshed": "Menu Refreshed!",
                }
            };
            // 读取语言代码
            let _locale;
            try {
                let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
                if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
                    _locales = osPrefs.getRegionalPrefsLocales();
                else
                    _locales = osPrefs.regionalPrefsLocales;
                for (let i = 0; i < _locales.length; i++) {
                    if (LANG.hasOwnProperty(_locales[i])) {
                        _locale = _locales[i];
                        break;
                    }
                }
            } catch (e) { }
            return {
                LANG,
                LOCALE: _locale || "en-US"
            }
        })())
}