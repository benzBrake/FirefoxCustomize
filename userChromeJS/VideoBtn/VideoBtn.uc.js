// ==UserScript==
// @name            VideoBtn.uc.js
// @description     VideoBtn 视频一键下载
// @author          Ryan
// @version         0.1.3
// @compatibility   Firefox 78
// @shutdown        window.VideoBtn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @version         0.1.3 忘记修复了什么
// @version         0.1.2 修复新窗口菜单样式异常
// @version         0.1.1 修复新窗口报错，强制 Cookies 保存到临时路径
// @version         0.1.0 初始版本
// ==/UserScript==
(function (css) {

    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;
    const Downloads = globalThis.Downloads || Cu.import("resource://gre/modules/Downloads.jsm").Downloads;
    const TopWindow = Services.wm.getMostRecentWindow("navigator:browser");

    if (window.VideoBtn) {
        window.VideoBtn.destroy();
        delete window.VideoBtn;
    }

    const LANG = {
        'zh-CN': {
            "videobtn btn name": "VideoBtn 视频下载",
            "open downloads folder": "打开下载文件夹",
            "set downloads folder": "设置下载文件夹",
            "use you-get to download video": "you-get",
            "use you-get to download album": "you-get 专辑下载",
            "use yt-dlp to download video": "yt-dlp",
            "use yt-dlp to download 1080p video": "yt-dlp 1080p",
            "use yt-dlp to download audio": "yt-dlp 音频",
            "use yt-dlp to download subtitle": "yt-dlp 字幕",
            "use yt-dlp to download album": "yt-dlp 专辑",
            "use bbdown to donload video": "bbdown",
            "bbdown login": "登录 bbdown",
            "choose path": "选择目录",
            "set video save path": "设置视频保存路径",
            "operation canceled": "操作取消",
            "operation complete": "操作完成",
            "set video save path canceled": "取消设置视频路径",
            "set video save path ok": "新的视频保存路径为：%s",
            "show in page context menu": "在右键菜单显示",
        }
    }

    /** 相对路径，相对于配置目录 Relative path to profile directory */

    const MENU_CONFIG = [{
        class: 'showFirstText',
        group: [{
            label: $L("open downloads folder"),
            class: 'folder',
            condition: 'normal',
            onclick: "event.target.ownerGlobal.VideoBtn.openDownloadsFolder();"
        }, {
            label: $L("set downloads folder"),
            tooltiptext: $L("set downloads folder"),
            class: 'option',
            condition: 'normal',
            oncommand: 'event.target.ownerGlobal.VideoBtn.setDownloadsFolder();',
        }]
    }, {}, {
        label: $L("use you-get to download video"),
        tool: '\\you-get.exe',
        condition: 'normal link',
        text: '-o %SAVE_PATH% -c %COOKIES_PATH% %LINK_OR_URL%',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJncmVlbiI+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPjxwYXRoIGQ9Ik0xNyA5LjJsNS4yMTMtMy42NWEuNS41IDAgMCAxIC43ODcuNDF2MTIuMDhhLjUuNSAwIDAgMS0uNzg3LjQxTDE3IDE0LjhWMTlhMSAxIDAgMCAxLTEgMUgyYTEgMSAwIDAgMS0xLTFWNWExIDEgMCAwIDEgMS0xaDE0YTEgMSAwIDAgMSAxIDF2NC4yem0wIDMuMTU5bDQgMi44VjguODRsLTQgMi44di43MTh6TTMgNnYxMmgxMlY2SDN6bTIgMmgydjJINVY4eiIvPjwvc3ZnPg=='
    }, {
        label: $L("use you-get to download album"),
        tool: '\\you-get.exe',
        condition: 'normal link',
        text: '-l -o %SAVE_PATH% -c %COOKIES_PATH% %LINK_OR_URL%',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJncmVlbiI+PHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIvPjxwYXRoIGQ9Ik0xNyA5LjJsNS4yMTMtMy42NWEuNS41IDAgMCAxIC43ODcuNDF2MTIuMDhhLjUuNSAwIDAgMS0uNzg3LjQxTDE3IDE0LjhWMTlhMSAxIDAgMCAxLTEgMUgyYTEgMSAwIDAgMS0xLTFWNWExIDEgMCAwIDEgMS0xaDE0YTEgMSAwIDAgMSAxIDF2NC4yem0wIDMuMTU5bDQgMi44VjguODRsLTQgMi44di43MTh6TTMgNnYxMmgxMlY2SDN6bTIgMmgydjJINVY4eiIvPjwvc3ZnPg=='
    }, {}, {
        label: $L("use yt-dlp to download video"),
        condition: 'normal link',
        tool: '\\yt-dlp.exe',
        text: "--cookies-from-browser firefox:%PROFILE_PATH% -P %SAVE_PATH% -o %(title)s.%(ext)s  --merge-output-format mp4 %LINK_OR_URL%",
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZWQiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
    }, {
        label: $L("use yt-dlp to download 1080p video"),
        condition: 'normal link',
        tool: '\\yt-dlp.exe',
        text: '--cookies-from-browser firefox:%PROFILE_PATH% -P %SAVE_PATH% -o %(title)s.%(ext)s  --merge-output-format mp4 -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" %LINK_OR_URL%',
        'image': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZWQiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
    }, {
        label: $L("use yt-dlp to download audio"),
        condition: 'normal link',
        tool: '\\yt-dlp.exe',
        text: '--cookies-from-browser firefox:%PROFILE_PATH% -P %SAVE_PATH% -o %(title)s.%(ext)s -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 %LINK_OR_URL%',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZWQiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
    }, {
        label: $L("use yt-dlp to download subtitle"),
        condition: 'normal link',
        tool: '\\yt-dlp.exe',
        text: '--cookies-from-browser firefox:%PROFILE_PATH% -P %SAVE_PATH% -o %(title)s.%(ext)s  --skip-download --write-sub --write-auto-sub --sub-lang en,en-US,zh-CN,zh-TW --convert-subs srt %LINK_OR_URL%',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZWQiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
    }, {
        label: $L("use yt-dlp to download album"),
        condition: 'normal link',
        tool: '\\yt-dlp.exe',
        text: '--cookies-from-browser firefox:%PROFILE_PATH% -P %SAVE_PATH% -o %(title)s.%(ext)s   --merge-output-format mp4 --yes-playlist %LINK_OR_URL%',
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZWQiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTcgOS4ybDUuMjEzLTMuNjVhLjUuNSAwIDAgMSAuNzg3LjQxdjEyLjA4YS41LjUgMCAwIDEtLjc4Ny40MUwxNyAxNC44VjE5YTEgMSAwIDAgMS0xIDFIMmExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjQuMnptMCAzLjE1OWw0IDIuOFY4Ljg0bC00IDIuOHYuNzE4ek0zIDZ2MTJoMTJWNkgzem0yIDJoMnYySDVWOHoiLz48L3N2Zz4='
    }, {

    }, {
        class: 'showFirstText',
        group: [{
            label: $L("use bbdown to donload video"),
            condition: 'normal link',
            tool: '\\BBDown.exe',
            text: '--work-dir %SAVE_PATH% %LINK_OR_URL%',
            image: 'chrome://devtools/skin/images/tool-webconsole.svg',
        }, {
            label: $L("bbdown login"),
            tooltiptext: $L("bbdown login"),
            tool: '\\BBDown.exe',
            text: 'login',
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTAgMTFWOGw1IDQtNSA0di0zSDF2LTJoOXptLTcuNTQyIDRoMi4xMjRBOC4wMDMgOC4wMDMgMCAwIDAgMjAgMTIgOCA4IDAgMCAwIDQuNTgyIDlIMi40NThDMy43MzIgNC45NDMgNy41MjIgMiAxMiAyYzUuNTIzIDAgMTAgNC40NzcgMTAgMTBzLTQuNDc3IDEwLTEwIDEwYy00LjQ3OCAwLTguMjY4LTIuOTQzLTkuNTQyLTd6Ii8+PC9zdmc+',
        }]
    }, {}, {
        label: "About Video Btn",
        url: 'https://kkp.disk.st/firefox-one-click-download-web-video-scheme-videobtn.html',
        condition: 'normal link',
        where: 'tab',
        style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=)'
    }];

    window.VideoBtn = {
        ENV_PATHS: [],
        $C: $C,
        $L: $L,
        get appVersion() { return Services.appinfo.version.split(".")[0]; },
        get debug() { return Services.prefs.getBoolPref("userChromeJS.VideoBtn.debug", false); },
        get BIN_PATH() {
            return this.handleRelativePath(Services.prefs.getStringPref(this.PREF_BIN_PATH, "\\chrome\\UserTools"));
        },
        set BIN_PATH(path) {
            Services.prefs.setStringPref(this.PREF_BIN_PATH, path);
        },
        get SAVE_PATH() {
            return this.handleRelativePath(Services.prefs.getStringPref(this.PREF_SAVE_PATH, this._DEFAULT_SAVE_PATH));
        },
        set SAVE_PATH(path) {
            Services.prefs.setStringPref(this.PREF_SAVE_PATH, path);
        },
        get COOKIES_SAVE_PATH() { return this.handleRelativePath("{tmpDir}"); },
        async init() {
            // 读取默认路径
            await this.makePaths();
            // 初始化正则表达式
            this.makeRegExp();

            if (!MENU_CONFIG) {
                this.error($L("menu config some mistake"));
                return;
            }

            $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
            gBrowser.tabpanels.addEventListener("mouseup", this, false);

            this.style = addStyle(css);
            this.makeMenu();
        },
        async makePaths() {
            ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
                var path = Services.dirsvc.get(key, Ci.nsIFile);
                this.ENV_PATHS[key] = path.path;
            });

            this._DEFAULT_SAVE_PATH = await Downloads.getSystemDownloadsDirectory();
        },
        makeRegExp() {
            // 初始化正则
            let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
            let rTITLE = "%TITLE" + he + "%|%t\\b";
            let rTITLES = "%TITLES" + he + "%|%t\\b";
            let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
            let rHOST = "%HOST" + he + "%|%h\\b";
            let rSEL = "%SEL" + he + "%|%s\\b";
            let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
            let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
            let rExt = "%EOL" + he + "%";
            let rRLT_OR_UT = "%RLT_OR_UT" + he + "%";
            let rCOOKIES_PATH = "%COOKIES_PATH" + he + "%";
            let rSAVE_PATH = "%SAVE_PATH" + he + "%";
            let rPROFILE_PATH = "%PROFILE_PATH" + he + "%";

            this.rTITLE = new RegExp(rTITLE, "i");
            this.rTITLES = new RegExp(rTITLES, "i");
            this.rURL = new RegExp(rURL, "i");
            this.rHOST = new RegExp(rHOST, "i");
            this.rSEL = new RegExp(rSEL, "i");
            this.rLINK = new RegExp(rLINK, "i");
            this.rCLIPBOARD = new RegExp(rCLIPBOARD, "i");;
            this.rExt = new RegExp(rExt, "i");
            this.rRLT_OR_UT = new RegExp(rRLT_OR_UT, "i");
            this.rCOOKIES_PATH = new RegExp(rCOOKIES_PATH, "i");
            this.rSAVE_PATH = new RegExp(rSAVE_PATH, "i");
            this.rPROFILE_PATH = new RegExp(rPROFILE_PATH, "i");

            this.regexp = new RegExp(
                [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rCLIPBOARD, rExt, rRLT_OR_UT, rCOOKIES_PATH, rSAVE_PATH, rPROFILE_PATH].join("|"), "ig");
        },
        makeMenu() {
            let popup = $C(document, 'menupopup', {
                class: 'VideoBtn-Popup'
            });
            MENU_CONFIG.forEach(obj => popup.appendChild(this.newMenuitem(document, obj)));
            if (Services.prefs.getBoolPref("userChromeJS.VideoBtn.showInContextMenu", false) && !$("VideoBtn-Context", document)) {
                let ins = [...$J("#contentAreaContextMenu").childNodes].filter(el => el.localName.toLocaleLowerCase() === "menuseparator").pop() || $("#contentAreaContextMenu").lastChild;
                let fragment = document.createDocumentFragment();
                fragment.append($C(document, 'menuseparator', {
                    class: 'VideoBtn-Hidden',
                    id: 'VideoBtn-RefNode'
                }));
                fragment.append($C(document, 'menu', {
                    id: 'VideoBtn-Context',
                    class: 'menu-iconic VideoBtn',
                    label: $L("videobtn btn name"),
                    tooltiptext: $L("videobtn btn name"),
                    condition: 'normal link',
                }));
                let menu = fragment.getElementById('VideoBtn-Context');
                menu.appendChild(popup.cloneNode(true));
                ins.after(fragment);
            }
            let mp = $("mainPopupSet", document);
            popup.setAttribute("id", "VideoBtn-Button-Popup");
            mp.appendChild(popup);
            if (CustomizableUI.getPlacementOfWidget("VideoBtn-Button", true)) return;
            CustomizableUI.createWidget({
                id: "VideoBtn-Button",
                type: 'button',
                localized: false,
                removeable: true,
                defaultArea: CustomizableUI.AREA_NAVBAR,
                onCreated: node => {
                    $A(node, {
                        label: $L("videobtn btn name"),
                        tooltiptext: $L("videobtn btn name"),
                        type: 'menu',
                    });
                    node.addEventListener('mouseover', (event) => {
                        let menupopup = node.ownerDocument.querySelector("#VideoBtn-Button-Popup");
                        if (menupopup.parentNode.id !== "VideoBtn-Button") {
                            event.target.appendChild(menupopup);;
                        }
                        if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY < (event.target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "after_end");
                        } else if (event.clientX < (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "before_start");
                        } else if (event.clientX > (event.target.ownerGlobal.innerWidth / 2) && event.clientY > (event.target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "before_start");
                        } else {
                            menupopup.removeAttribute("position", "after_end");
                        }
                    });
                }
            });
        },
        destroy() {
            if (this.debug) this.log($L("VideoBtn: destroying element"));
            $JJ('.VideoBtn-Replacement[original-id]').forEach(item => {
                // 还原移动的菜单
                let orgId = item.getAttribute('original-id') || "";
                if (orgId.length) {
                    let org = $(orgId);
                    item.parentNode.insertBefore(org, item);
                    item.parentNode.removeChild(item);
                }
            });
            CustomizableUI.destroyWidget("VideBtn-Button");
            $R($J("#VideBtn-RefNode"));
            $R($J("#VideBtn-Context"));
            $R($J("#VideoBtn-Button-Popup"));
            $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
            gBrowser.tabpanels.removeEventListener("mouseup", this, false);
            if (this.style && this.style.url && this.style.type) {
                removeStyle(this.style);
                this.style = null;
            }
            delete window.VideoBtn;
        },
        openDownloadsFolder() {
            this.exec(this.SAVE_PATH);
        },
        setDownloadsFolder() {
            choosePathAndSave($L("set video save path"), this.PREF_SAVE_PATH, null, null, $L("set video save path canceled"), $L("set video save path ok"));
        },
        convertText: function (text) {
            var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                link: { href: "", host: "" },
                target: { alt: "", title: "" },
                __noSuchMethod__: function (id, args) {
                    return ""
                },
            };

            var bw = gBrowser.selectedBrowser;

            return text.replace(this.regexp, function (str) {
                str = str.toUpperCase().replace("%LINK", "%RLINK");
                if (str.indexOf("_HTMLIFIED") >= 0)
                    return htmlEscape(convert(str.replace("_HTMLIFIED", "")));
                if (str.indexOf("_HTML") >= 0)
                    return htmlEscape(convert(str.replace("_HTML", "")));
                if (str.indexOf("_ENCODE") >= 0)
                    return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                return convert(str);
            });

            function convert(str) {
                switch (str) {
                    case "%T":
                        return bw.contentTitle; // 当前网页标题
                    case "%TITLE%":
                        return bw.contentTitle; // 当前网页标题
                    case "%TITLES%":
                        return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, ""); // 当前网页简化标题
                    case "%U":
                        return bw.documentURI.spec; // 当前网页链接
                    case "%URL%":
                        return bw.documentURI.spec; // 当前网页链接
                    case "%H":
                        return bw.documentURI.host; // 当前网页域名
                    case "%HOST%":
                        return bw.documentURI.host; // 当前网页域名
                    case "%S":
                        return context.textSelected || VideoBtn.selectedText || ""; // 当前选中文本
                    case "%SEL%":
                        return context.textSelected || VideoBtn.selectedText || ""; // 当前选中文本
                    case "%L":
                        return context.linkURL || ""; // 当前鼠标指向链接，右键菜单时可用
                    case "%RLINK%":
                        return context.linkURL || ""; // 当前鼠标指向链接，右键菜单时可用
                    case "%RLINK_HOST%":
                        return context.link.host || ""; // 当前鼠标指向链接域名部分，右键菜单时可用
                    case "%RLINK_TEXT%":
                        return context.linkText() || ""; // 当前鼠标指向链接标题，右键菜单时可用
                    case "%RLINK_OR_URL%":
                        return context.linkURL || bw.documentURI.spec; // 当前鼠标指向链接，没有就读取当前网页链接
                    case "%RLT_OR_UT%":
                        return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                    case "%P":
                        return readFromClipboard() || ""; // 剪贴板内容
                    case "%CLIPBOARD%":
                        return readFromClipboard() || ""; // 剪贴板内容
                    case "%COOKIES_PATH%":
                        return VideoBtn.saveCookie(bw.documentURI); // Nescape 格式 Cookie 保存路径
                    case "%SAVE_PATH%":
                        return VideoBtn.SAVE_PATH.replace("\\", "/"); // 视频保存路径
                    case "%PROFILE_PATH%":
                        return PathUtils.profileDir; // 配置文件路径
                    case "%EOL%":
                        return "\r\n";
                }
                return str;
            }

            function htmlEscape(s) {
                return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
            }
        },
        newMenuPopup(doc, obj) {
            if (!obj) return;
            let popup = $C(doc, 'menupopup');
            obj.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) popup.appendChild(el);
            });
            popup.classList.add("VideoBtn-Popup");
            return popup;
        },
        newMenuGroup(doc, obj) {
            if (!obj) return;
            let group = $C(doc, 'menugroup', obj, ["group", "popup"]);
            obj.group.forEach(o => {
                var el = this.newMenuitem(doc, o);
                if (el) group.appendChild(el);
            })
            group.classList.add("VideoBtn-Group");
            return group;
        },
        newMenuitem(doc, obj) {
            if (!obj) return;
            if (obj.group) {
                return this.newMenuGroup(doc, obj);
            }
            let item
            if (obj.popup) {
                item = $C(doc, "menu", obj, ["popup"]);
                item.classList.add("menu-iconic");
                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    } else {
                        eval("(" + obj.onBuild + ").call(el, doc, item)")
                    }
                }
                item.appendChild(this.newMenuPopup(doc, obj.popup));
            } else {

                let classList = [],
                    tagName = obj.type || 'menuitem';
                if (['separator', 'menuseparator'].includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.image && !obj.command) {
                    return $C(doc, 'menuseparator', obj, ['type', 'group', 'popup']);
                }

                if (['checkbox', 'radio'].includes(obj.type)) tagName = 'menuitem';
                if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
                classList.push(tagName + '-iconic');
                classList.push('VideoBtn');

                if (obj.tool) {
                    obj.exec = this.handleRelativePath(obj.tool, this.BIN_PATH);
                    delete obj.tool;
                }

                if (obj.exec) {
                    obj.exec = this.handleRelativePath(obj.exec);
                }

                if (obj.command) {
                    // 移动菜单
                    let org = $(obj.command, doc);
                    if (org) {
                        let replacement = $C(doc, 'menuseparator', { hidden: true, class: 'VideoBtn-Replacement', 'original-id': obj.command });
                        org.parentNode.insertBefore(replacement, org);
                        return org;
                    } else {
                        return $C(doc, 'menuseparator', { hidden: true });
                    }
                } else {
                    item = $C(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                    if (classList.length) item.setAttribute('class', classList.join(' '));
                    $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type']);
                    item.setAttribute('label', obj.label || obj.command || obj.oncommand);
                }

                if (!obj.onclick)
                    item.setAttribute("onclick", "checkForMiddleClick(this, event)");

                if (obj.onBuild) {
                    if (typeof obj.onBuild === "function") {
                        obj.onBuild(doc, item);
                    }
                }

                if (this.debug) this.log('createMenuItem', tagName, item);
            }

            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)")
                }
            }

            if (obj.oncommand || obj.command)
                return item;

            item.setAttribute("oncommand", "event.target.ownerGlobal.VideoBtn.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            return item;
        },
        onCommand: function (event) {
            event.stopPropagation();
            let item = event.target;
            if (item.hasAttribute("precommand")) {
                eval(item.getAttribute('precommand'));
            }
            let text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "",
                where = item.getAttribute("where") || "";
            if (exec) this.exec(exec, this.convertText(text));
            else if (edit) this.edit(edit);
            else if (url) this.openCommand(event, url, where);
            if (item.hasAttribute("postcommand")) {
                eval(item.getAttribute('postcommand'));
            }
        },
        handleEvent(event) {
            switch (event.type) {
                case "popupshowing":
                    if (event.target != event.currentTarget) return;
                    if (event.target.id == 'contentAreaContextMenu') {
                        var state = [];
                        if (gContextMenu.onTextInput)
                            state.push("input");
                        if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                            state.push("select");
                        if (gContextMenu.onLink || !event.target.querySelector("#context-openlinkincurrent").getAttribute("hidden")?.length)
                            state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                        if (gContextMenu.onCanvas)
                            state.push("canvas image");
                        if (gContextMenu.onImage)
                            state.push("image");
                        if (gContextMenu.onVideo || gContextMenu.onAudio)
                            state.push("media");
                        event.currentTarget.querySelector("#VideoBtn-RefNode")?.setAttribute("VideoBtn", state.join(" "));
                    }
                    break;
                case 'mouseup':
                    // 鼠标按键释放时读取选中文本
                    try {
                        gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                            this.selectedText = r.selectedText;
                        })
                    } catch (e) { }
                    break;
            }
        },
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log('openCommand', 'url is invalid', url);
            }
            if (uri.scheme === "javascript") {
                try {
                    loadURI(url);
                } catch (e) {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                if (this.appVersion < 78) {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } else {
                    openUILinkIn(uri.spec, where, {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(uri.spec) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            )
                    });
                }
            } else if (event.button == 1) {
                if (this.appVersion < 78) {
                    openNewTabWith(uri.spec);
                } else {
                    openNewTabWith(uri.spec, 'tab', {
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } else {
                if (this.appVersion < 78)
                    openUILink(uri.spec, event);
                else {
                    openUILink(uri.spec, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            }
        },
        edit: function (edit) {
            if (this.debug) this.log('edit', edit);
            if (this.prefs.get("view_source.editor.path"))
                this.exec(this.prefs.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg) {
            if (this.debug) this.log('exec', path, arg);
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
                    this.error($L("file not found").replace("%s", path))
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
        handleRelativePath: function (path, parentPath) {
            if (path) {
                let handled = false;
                path = this.replaceArray(path, [
                    "{homeDir}",
                    "{libDir}",
                    "{localProfileDir}",
                    "{profileDir}",
                    "{tmpDir}"
                ], [
                    "{Home}",
                    "{GreD}",
                    "{ProfLD}",
                    "{ProfD}",
                    "{TmpD}"
                ]);
                ["GreD", "ProfD", "ProfLD", "UChrm", "TmpD", "Home", "Desk", "Favs", "LocalAppData"].forEach(key => {
                    if (path.includes("{" + key + "}")) {
                        path = path.replace("{" + key + "}", this.ENV_PATHS[key] || "");
                        handled = true;
                    }
                })
                if (!handled) {
                    path = path.replace(/\//g, '\\').toLocaleLowerCase();
                    if (/^(\\)/.test(path)) {
                        if (!parentPath) {
                            parentPath = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                        }
                        path = parentPath + path;
                        path = path.replace("\\\\", "\\");
                    }
                }
                return path;
            }
        },
        replaceArray: function (replaceString, find, replace) {
            var regex;
            for (var i = 0; i < find.length; i++) {
                regex = new RegExp(find[i], "g");
                replaceString = replaceString.replace(regex, replace[i]);
            }
            return replaceString;
        },
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(this.handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    if (this.debug) this.error(e);
                    return;
                }
                // if (!aFile.exists() || !aFile.isExecutable()) {
                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = this.getURLSpecFromFile(aFile);
                        menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                    } else {
                        menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            if (obj.keyword) {
                let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                if (engine) {
                    if (isPromise(engine)) {
                        engine.then(function (engine) {
                            if (engine.iconURI) menu.setAttribute("image", engine.iconURI.spec);
                        });
                    } else if (engine.iconURI) {
                        menu.setAttribute("image", engine.iconURI.spec);
                    }
                    return;
                }
            }
            var setIconCallback = function (url) {
                let uri, iconURI;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) { this.log(e) }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ?
                                "moz-anno:favicon:" + aURI.spec :
                                "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
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
        getURLSpecFromFile(aFile) {
            var aURL;
            if (typeof userChrome !== "undefined" && typeof userChrome.getURLSpecFromFile !== "undefined") {
                aURL = userChrome.getURLSpecFromFile(aFile);
            } else if (this.appVersion < 92) {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
            } else {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
            }
            return aURL;
        },
        saveCookie(uri) {
            let { host } = uri;
            let cookies = Services.cookies.getCookiesFromHost(host, {});
            let string = cookies.map(formatCookie).join('');
            let file = getNSIFile(this.COOKIES_SAVE_PATH);
            file.append(`${host}.txt`);
            if (file.exists()) {
                file.remove(0);
            }

            saveFile(file, string);
            return file.path;

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
        },
        copyText: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
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
                this.appVersion >= 78 ? "chrome://global/skin/icons/info.svg" : "chrome://global/skin/icons/information-32.png", aTitle || "VideoBtn",
                aMsg + "", !!callback, "", callback);
        },
        error: TopWindow.console.error,
        log: TopWindow.console.log,
        PREF_BIN_PATH: 'userChromeJS.VideoBtn.binPath',
        PREF_SAVE_PATH: 'userChromeJS.VideoBtn.savePath',
    }

    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function $J(selector, aDoc) {
        return (aDoc || document).querySelector(selector);
    }

    function $JJ(selector, aDoc) {
        return (aDoc || document).querySelectorAll(selector);
    }

    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    function $R(el) {
        if (el && el.parentNode) {
            try {
                el.parentNode.removeChild(el);
                return true;
            } catch (e) {
                this.error(e);
            }
        }
        return false;
    }

    function $L(str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else
            return "";
    }

    function $S(str, replace) {
        str || (str = '');
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    function addStyle(cssOrStyle, type) {
        try {
            let style;
            if (typeof cssOrStyle === "string") {
                style = {
                    type: type || sss.AUTHOR_SHEET,
                    url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(cssOrStyle))
                };
            }
            if (typeof cssOrStyle === "object" && cssOrStyle.url && cssOrStyle.type) {
                style = cssOrStyle;
            }
            if (sss.sheetRegistered(style.url, style.type))
                sss.unregisterSheet(style.url, style.type)
            sss.loadAndRegisterSheet(style.url, style.type);
        } catch (e) {
            TopWindow.console.error(e);
        }
        return false;
    }

    function removeStyle(style) {
        if (typeof style === "object" && style.url && style.type) {
            sss.unregisterSheet(style.url, style.type);
            return true;
        }
        return false;
    }

    function choosePathAndSave(title, prefKey, mode, filter, textIfCancel, textIfOk) {
        title = title || $L("choose path");
        textIfCancel = textIfCancel || $L("operation canceled");
        textIfOk = textIfOk || $L("operation complete");
        mode = mode || Ci.nsIFilePicker.modeGetFolder;
        let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
        fp.init(window, title, mode);
        if (filter) {
            let { title, param } = filter;
            fp.appendFilter(title, param);
        }
        fp.open(res => {
            if (res != Ci.nsIFilePicker.returnOK) {
                VideoBtn.alert(textIfCancel);
                return;
            }
            Services.prefs.setStringPref(prefKey, fp.file.path);
            VideoBtn.alert($S(textIfOk, fp.file.path));
        });
    }

    function getNSIFile(path) {
        var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile)
        try {
            file.initWithPath(path);
            return file;
        } catch (e) { }
    }

    function saveFile(fileOrName, data) {
        var file;
        if (typeof fileOrName == "string") {
            file = Services.dirsvc.get('UChrm', Ci.nsIFile);
            file.appendRelativePath(fileOrName);
        } else {
            file = fileOrName;
        }

        var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        suConverter.charset = 'UTF-8';
        data = suConverter.ConvertFromUnicode(data);

        var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
        foStream.write(data, data.length);
        foStream.close();
    }

    // 延时启动
    if (gBrowserInit.delayedStartupFinished) window.VideoBtn.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.VideoBtn.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
    .VideoBtn-Hidden {
        display: none !important;
    }
    #VideoBtn-Button,#VideoBtn-Context {
        list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBIMjRWMjRIMHoiLz48cGF0aCBkPSJNMTYgNGMuNTUyIDAgMSAuNDQ4IDEgMXY0LjJsNS4yMTMtMy42NWMuMjI2LS4xNTguNTM4LS4xMDMuNjk3LjEyNC4wNTguMDg0LjA5LjE4NC4wOS4yODZ2MTIuMDhjMCAuMjc2LS4yMjQuNS0uNS41LS4xMDMgMC0uMjAzLS4wMzItLjI4Ny0uMDlMMTcgMTQuOFYxOWMwIC41NTItLjQ0OCAxLTEgMUgyYy0uNTUyIDAtMS0uNDQ4LTEtMVY1YzAtLjU1Mi40NDgtMSAxLTFoMTR6bS0xIDJIM3YxMmgxMlY2em0tNSAydjRoM2wtNCA0LTQtNGgzVjhoMnptMTEgLjg0MWwtNCAyLjh2LjcxOGw0IDIuOFY4Ljg0eiIvPjwvc3ZnPg==);
    }
    #VideoBtn-RefNode[VideoBtn] + .VideoBtn:not(menuseparator):not(menugroup),
    #contentAreaContextMenu #VideoBtn-Menu~menuseparator {
        visibility: collapse;
    }
    #VideoBtn-RefNode[VideoBtn~="link"] + .VideoBtn[condition~="link"],
    #VideoBtn-RefNode[VideoBtn~="image"] +.VideoBtn[condition~="image"],
    #VideoBtn-RefNode[VideoBtn~="canvas"] + .VideoBtn[condition~="canvas"],
    #VideoBtn-RefNode[VideoBtn~="select"] +.VideoBtn[condition~="select"],
    #VideoBtn-RefNode[VideoBtn~="input"] + .VideoBtn[condition~="input"],
    #VideoBtn-RefNode[VideoBtn~="mailto"] + .VideoBtn[condition~="mailto"],
    #VideoBtn-RefNode[VideoBtn=""] + .VideoBtn[condition~="normal"] {
        visibility: visible;
    }
    .VideoBtn-Group > .menuitem-iconic {
        padding-block: 0.5em;
    }
    
    .VideoBtn-Group > .menuitem-iconic:first-child {
        padding-inline-start: 1em;
    }
    .VideoBtn-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
    .VideoBtn-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
    .VideoBtn-Group > :is(menu, menuitem) > .menu-accel-container {
        display: none;
    }

    .VideoBtn-Group.showFirstText > :is(menu, menuitem):first-child,
    .VideoBtn-Group.showText > :is(menu, menuitem) {
        -moz-box-flex: 1;
        padding-inline-end: .5em;
    }
    .VideoBtn-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
        padding-left: 0;
        -moz-box-flex: 0;
    }
    .VideoBtn-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) > .menu-iconic-left {
        margin-inline-start: 8px;
        margin-inline-end: 8px;
    }
    .VideoBtn-Popup menuseparator+menuseparator {
        visibility: collapse;
    }
    .VideoBtn-Popup menuseparator:last-child {
        /* 懒得研究为什么多了一个分隔符 */
        visibility: collapse;
    }

    .VideoBtn-Popup .menuitem-iconic.folder {
        list-style-image: url(chrome://global/skin/icons/folder.svg) !important;
    }

    .VideoBtn-Popup .menuitem-iconic.reload {
        list-style-image: url(chrome://global/skin/icons/reload.svg) !important;
    }

    .VideoBtn-Popup .menuitem-iconic.option {
        list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
    }

    .VideoBtn-Popup menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon {
        display: block !important;
    }
`);