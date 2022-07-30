// ==UserScript==
// @name            VideoBtn.uc.js
// @description     VideoBtn 视频一键下载
// @author          Ryan
// @version         0.1.0
// @compatibility   Firefox 78 +
// @startup         window.VideoBtn.init();
// @shutdown        window.VideoBtn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @version         0.1.0 初始版本
// ==/UserScript==
location.href.startsWith('chrome://browser/content/browser.x') && (function (css, debug) {

    Cu.import("resource:///modules/CustomizableUI.jsm");
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/osfile/osfile_async_front.jsm");


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
    if (!window.cPref) {
        window.cPref = {
            get: function (prefPath, defaultValue, setDefaultValueIfUndefined) {
                const sPrefs = Services.prefs;
                setDefaultValueIfUndefined = setDefaultValueIfUndefined || false;
                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            return defaultValue;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    if (setDefaultValueIfUndefined && typeof defaultValue !== undefined) this.set(prefPath, defaultValue);
                    return defaultValue;
                }
                return
            },
            getType: function (prefPath) {
                const sPrefs = Services.prefs;
                const map = {
                    0: undefined,
                    32: 'string',
                    64: 'int',
                    128: 'boolean'
                }
                try {
                    return map[sPrefs.getPrefType(prefPath)];
                } catch (ex) {
                    return map[0];
                }
            },
            set: function (prefPath, value) {
                const sPrefs = Services.prefs;
                switch (typeof value) {
                    case 'string':
                        return sPrefs.setCharPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },
            addListener: (a, b) => {
                let o = (q, w, e) => (b(cPref.get(e), e));
                Services.prefs.addObserver(a, o);
                return { pref: a, observer: o }
            },
            removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        };
    }

    /** 相对路径，相对于配置目录 Relative path to profile directory */
    const DEFAULT_TOOLS_PATH = "\\chrome\\resources\\tools";
    const DEFAULT_COOKIES_PATH = "\\chrome\\resources\\cookies"

    const MENU_CONFIG = {
        id: 'VideoBtn-btn',
        type: cPref.get("userChromeJS.VideoBtn.showInContextMenu", false) ? 'toolbarbutton' : 'menu',
        label: $L("videobtn btn name"),
        tooltiptext: $L("videobtn btn name"),
        condition: 'normal link',
        style: "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBIMjRWMjRIMHoiLz48cGF0aCBkPSJNMTYgNGMuNTUyIDAgMSAuNDQ4IDEgMXY0LjJsNS4yMTMtMy42NWMuMjI2LS4xNTguNTM4LS4xMDMuNjk3LjEyNC4wNTguMDg0LjA5LjE4NC4wOS4yODZ2MTIuMDhjMCAuMjc2LS4yMjQuNS0uNS41LS4xMDMgMC0uMjAzLS4wMzItLjI4Ny0uMDlMMTcgMTQuOFYxOWMwIC41NTItLjQ0OCAxLTEgMUgyYy0uNTUyIDAtMS0uNDQ4LTEtMVY1YzAtLjU1Mi40NDgtMSAxLTFoMTR6bS0xIDJIM3YxMmgxMlY2em0tNSAydjRoM2wtNCA0LTQtNGgzVjhoMnptMTEgLjg0MWwtNCAyLjh2LjcxOGw0IDIuOFY4Ljg0eiIvPjwvc3ZnPg==);",
        popup: [{
            class: 'showFirstText',
            group: [{
                label: $L("open downloads folder"),
                class: 'folder',
                condition: 'normal',
                onclick: "VideoBtn.openDownloadsFolder();"
            }, {
                label: $L("set downloads folder"),
                tooltiptext: $L("set downloads folder"),
                class: 'option',
                condition: 'normal',
                oncommand: 'VideoBtn.setDownloadsFolder();',
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
            label: $L("show in page context menu"),
            type: 'checkbox',
            pref: 'userChromeJS.VideoBtn.showInContextMenu',
            condition: 'normal link',
        }, {
            label: "About Video Btn",
            url: 'https://kkp.disk.st/firefox-one-click-download-web-video-scheme-videobtn.html',
            condition: 'normal link',
            where: 'tab',
            style: 'list-style-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=)'
        }]
    }

    window.VideoBtn = {
        PREF_LISTENER: [],
        THEME_LIST: [],
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get win() {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        get btnId() {
            if (!this._btnId) this._btnId = 1;
            return this._btnId++;
        },
        get debug() {
            if (this._debug) {
                this._debug = debug;
            }
            return this._debug;
        },
        get menuCfg() {
            if (!this._menuCfg) this._menuCfg = cloneObj(MENU_CONFIG);
            return this._menuCfg;
        },
        get BIN_PATH() {
            return this.handleRelativePath(cPref.get(this.PREF_BIN_PATH, this._DEFAULT_BIN_PATH));
        },
        get SAVE_PATH() {
            return this.handleRelativePath(cPref.get(this.PREF_SAVE_PATH, this._DEFAULT_SAVE_PATH));
        },
        get COOKIE_SAVE_PATH() {
            return this.handleRelativePath(cPref.get(this.PREF_COOKIE_SAVE_PATH, this._DEFAULT_COOKIE_SAVE_PATH));
        },
        async init() {
            if (this.debug) this.log("VideoBtn init");
            this._DEFAULT_BIN_PATH = DEFAULT_TOOLS_PATH;
            this._DEFAULT_SAVE_PATH = await Downloads.getSystemDownloadsDirectory();
            this._DEFAULT_COOKIE_SAVE_PATH = DEFAULT_COOKIES_PATH;
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

            if (!MENU_CONFIG) {
                if (this.debug) this.log($L("menu config some mistake"));
                return;
            }

            $("contentAreaContextMenu").addEventListener("popupshowing", this, false);

            gBrowser.tabpanels.addEventListener("mouseup", this, false);

            this.rebuild();
        },
        uninit() {
            if (this.mainEl) {
                $JJ('.VideoBtn-Replacement[original-id]').forEach(item => {
                    // 还原移动的菜单
                    let orgId = item.getAttribute('original-id') || "";
                    if (orgId.length) {
                        let org = $(orgId);
                        item.parentNode.insertBefore(org, item);
                        item.parentNode.removeChild(item);
                    }
                })
                if (this.debug) this.log($L("destroying element"), this.mainEl);
                if (this.mainEl.localName == 'toolbarbutton')
                    CustomizableUI.destroyWidget(this.mainEl.id);
                else
                    this.mainEl.parentNode.removeChild(this.mainEl);
            }
            if (this.style && this.style.parentNode) {
                if (this.debug) this.log($L("unregister style"), this.style);
                this.style.parentNode.removeChild(this.style);
                this.style = null;
            }
            this.PREF_LISTENER.forEach(l => cPref.removeListener(l));
            this.PREF_LISTENER = [];
        },
        rebuild() {
            this.uninit();
            this.style = addStyle(css);
            this.mainEl = this.createMainEl();
            this.addPrefListener(this.PREF_SWITCH_TO_CONTEXTMENU, function (value, pref) {
                setTimeout(function () {
                    VideoBtn.rebuild();
                }, 10);
            });
        },
        destroy() {
            this.uninit();
            $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
            gBrowser.tabpanels.removeEventListener("mouseup", this, false);
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
        saveCookie(uri) {
            let { host } = uri;
            let cookies = Services.cookies.getCookiesFromHost(host, {});
            let string = cookies.map(formatCookie).join('');
            let file = getNSIFile(this.COOKIE_SAVE_PATH);
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
        createMainEl() {
            if (!this.menuCfg) {
                if (this.debug) this.log($L("no menu configuration"));
                return;
            }
            if (this.debug) this.log($L("creating menuitems"));
            if (cPref.get(this.PREF_SWITCH_TO_CONTEXTMENU, false)) {
                let menu = this.createMenu(this.menuCfg);
                let ins = $("context-savepage") || $("context-savelink");
                if (ins) {
                    ins.after(menu);
                } else {
                    $('contentAreaContextMenu').appendChild(menu);
                }
                return menu;
            } else {
                return this.createButton(this.menuCfg);
            }
        },
        createButton(obj, aDoc) {
            obj.id = obj.id || "VideoBtn-Button-" + this.btnId;
            obj.label = obj.label || "VideoBtn";
            obj.defaultArea = obj.defaultArea || CustomizableUI.AREA_NAVBAR;
            obj.class = obj.class ? obj.class + ' videobtn-button' : 'videobtn-button';
            CustomizableUI.createWidget({
                id: obj.id,
                type: 'custom',
                localized: false,
                defaultArea: obj.defaultArea,
                onBuild: function (doc) {
                    let btn;
                    try {
                        btn = $C(doc, 'toolbarbutton', obj, ['type', 'group', 'popup']);
                        'toolbarbutton-1 chromeclass-toolbar-additional'.split(' ').forEach(c => btn.classList.add(c));
                        if (obj.popup) {
                            let id = obj.id + '-popup';
                            btn.setAttribute('type', 'menu');
                            btn.setAttribute('menu', id);
                            let popup = $C(doc, 'menupopup', { id: id, class: 'VideoBtn-Popup' });
                            btn.appendChild(popup);
                            obj.popup.forEach(child => popup.appendChild(VideoBtn.createMenu(child, doc, popup, true)));
                        }
                        if (obj.onBuild && typeof obj.onBuild == 'function') obj.onBuild(btn, aDoc);
                    } catch (e) {
                        VideoBtn.error(e);
                    }
                    return btn;
                }
            });
            return CustomizableUI.getWidget(obj.id).forWindow(window).node;
        },
        createMenu(obj, aDoc, parent) {
            if (!obj) return;
            aDoc = aDoc || parent?.ownerDocument || this.win.document;
            let el;
            if (obj.group) {
                el = $C(aDoc, 'menugroup', obj, ['group', 'popup']);
                el.classList.add('VideoBtn-Group');
                obj.group.forEach(child => el.appendChild(VideoBtn.createMenu(child, aDoc, el)));

                // menugroup 无需嵌套在 menu 中
                return el;
            } else if (obj.popup) {
                el = $C(aDoc, 'menupopup', obj, ['group', 'popup']);
                el.classList.add('VideoBtn-Popup');
                obj.popup.forEach(child => el.appendChild(VideoBtn.createMenu(child, aDoc, el)));
            }

            let item = this.createMenuItem(obj, aDoc, parent);
            item.classList.add('VideoBtn')
            if (el) item.appendChild(el);
            return item;
        },
        createMenuItem: function (obj, aDoc, parent) {
            if (!obj) return;
            aDoc = aDoc || parent?.ownerDocument || this.win.document;
            let item,
                classList = [],
                tagName = obj.type || 'menuitem';
            if (inObject(['separator', 'menuseparator'], obj.type) || !obj.group && !obj.popup && !obj.label && !obj.image && !obj.command && !obj.pref) {
                return $C(aDoc, 'menuseparator', obj, ['type', 'group', 'popup']);
            }
            if (inObject['checkbox', 'radio'], obj.type) tagName = 'menuitem';
            if (obj.group) tagName = 'menu';
            if (obj.popup) tagName = 'menu';
            if (obj.class) obj.class.split(' ').forEach(c => classList.push(c));
            classList.push(tagName + '-iconic');

            if (obj.tool) {
                obj.exec = this.BIN_PATH + obj.tool;
                delete obj.tool;
            }
            if (obj.exec) {
                obj.exec = this.handleRelativePath(obj.exec);
            }

            if (obj.command) {
                // 移动菜单
                let org = $(obj.command, aDoc);
                if (org) {
                    let replacement = $C(aDoc, 'menuseparator', { hidden: true, class: 'VideoBtn-Replacement', 'original-id': obj.command });
                    org.parentNode.insertBefore(replacement, org);
                    return org;
                } else {
                    return $C(aDoc, 'menuseparator', { hidden: true });
                }
            } else {
                item = $C(aDoc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group']);
                if (classList.length) item.setAttribute('class', classList.join(' '));
                $A(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type']);
                item.setAttribute('label', obj.label || obj.command || obj.oncommand);

                if (obj.pref) {
                    let type = cPref.getType(obj.pref) || obj.type || 'unknown';
                    const map = {
                        string: 'prompt',
                        int: 'prompt',
                        boolean: 'checkbox',
                    }
                    const defaultVal = {
                        string: '',
                        int: 0,
                        bool: false
                    }
                    if (map[type]) item.setAttribute('type', map[type]);
                    if (!obj.defaultValue) item.setAttribute('defaultValue', defaultVal[type]);
                    if (map[type] === 'checkbox') {
                        item.setAttribute('checked', !!cPref.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                        this.addPrefListener(obj.pref, function (value, pref) {
                            item.setAttribute('checked', value);
                            if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                        });
                    } else {
                        let value = cPref.get(obj.pref);
                        if (value) {
                            item.setAttribute('value', value);
                            item.setAttribute('label', $S(obj.label, value));
                        }
                        this.addPrefListener(obj.pref, function (value, pref) {
                            item.setAttribute('label', $S(obj.label, value || item.getAttribute('default')));
                            if (item.hasAttribute('postcommand')) eval(item.getAttribute('postcommand'));
                        });
                    }
                }
            }


            if (!obj.pref && !obj.onclick)
                item.setAttribute("onclick", "checkForMiddleClick(this, event)");

            if (debug) this.log('createMenuItem', tagName, item);

            if (obj.oncommand || obj.command)
                return item;

            item.setAttribute("oncommand", "VideoBtn.onCommand(event);");

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
            let pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "";
            where = item.getAttribute("where") || "";
            if (pref) this.handlePref(event, pref);
            else if (exec) this.exec(exec, this.convertText(text));
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
                        event.currentTarget.setAttribute("VideoBtn", state.join(" "));
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
        handlePref(event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = cPref.get(pref, false, !!item.getAttribute('defaultValue'));
                cPref.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), cPref.get(pref, item.getAttribute('default') || ""));
                if (val) {
                    switch (type) {
                        case 'int':
                            val = parseInt(val);
                            break;
                        case 'boolean':
                            val = !!val;
                            break;
                        case 'string':
                        default:
                            val = "" + val;
                            break;
                    }
                    cPref.set(pref, val);
                }

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
            if (debug) this.log('edit', edit);
            if (cPref.get("view_source.editor.path"))
                this.exec(cPref.get("view_source.editor.path"), this.handleRelativePath(edit));
            else
                this.exec(this.handleRelativePath(edit));
        },
        exec: function (path, arg) {
            if (debug) this.log('exec', path, arg);
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
        addPrefListener(pref, callback) {
            this.PREF_LISTENER[pref] = cPref.addListener(pref, callback);
        },
        handleRelativePath: function (path, parentPath) {
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
        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(obj.edit ? this.handleRelativePath(obj.edit) : obj.exec);
                } catch (e) {
                    return;
                }

                if (!aFile.exists()) {
                    menu.setAttribute("disabled", "true");
                } else {
                    if (aFile.isFile()) {
                        let fileURL = getURLSpecFromFile(aFile);
                        menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                    } else {
                        menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                    }
                }
                return;
            }

            var setIconCallback = function (url) {
                let uri, iconURI;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) { }
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
                VideoBtn.error(e)
            }).catch(e => { });

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
        error: function () {
            Cu.reportError(Array.prototype.slice.call(arguments));
        },
        log: function () {
            this.win.console.log(Array.prototype.slice.call(arguments));
        },
        PREF_SWITCH_TO_CONTEXTMENU: 'userChromeJS.VideoBtn.showInContextMenu',
        PREF_BIN_PATH: 'userChromeJS.VideoBtn.binPath',
        PREF_SAVE_PATH: 'userChromeJS.VideoBtn.savePath',
        PREF_COOKIE_SAVE_PATH: 'userChromeJS.VideoBtn.cookiesPath',
    }

    /**
    * 获取  DOM 元素
    * @param {string} id 
    * @param {Document} aDoc 
    * @returns 
    */
    function $(id, aDoc) {
        return (aDoc || document).getElementById(id);
    }

    function $J(selector, aDoc) {
        return (aDoc || document).querySelector(selector);
    }

    function $JJ(selector, aDoc) {
        return (aDoc || document).querySelectorAll(selector);
    }

    /**
     * 创建 DOM 元素
     * @param {string} tag DOM 元素标签
     * @param {object} attr 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns 
     */
    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

    /**
     * 应用属性
     * @param {Element} el DOM 对象
     * @param {object} obj 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns 
     */
    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!inObject(skipAttrs, key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    /**
     * 获取本地化文本
     * @param {string} str 
     * @param {string|null} replace 
     * @returns 
     */
    function $L(str, replace) {
        const LOCALE = LANG[Services.locale.defaultLocale] ? Services.locale.defaultLocale : 'zh-CN';
        if (str) {
            str = LANG[LOCALE][str] || str;
            return $S(str, replace);
        } else
            return "";
    }

    function $toogleText() {
        if (cPref.get("userChromeJS.VideoBtn.showInContextMenu", false))
            return $L("show in page context menu");
        return $L("show in navigation bar");
    }

    /**
     * 替换 %s 为指定文本
     * @param {string} str 
     * @param {string} replace 
     * @returns 
     */
    function $S(str, replace) {
        str || (str = '');
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    /**
    * 数组/对象中是否包含某个关键字
     * @param {object} obj 
     * @param {any} key 
    * @returns 
    */
    function inObject(obj, key) {
        if (obj.indexOf) {
            return obj.indexOf(key) > -1;
        } else if (obj.hasAttribute) {
            return obj.hasAttribute(key);
        } else {
            for (var i = 0; i < obj.length; i++) {
                if (obj[i] === key) return true;
            }
            return false;
        }
    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    /**
     * 克隆对象
     * @param {object} o 
     * @returns 
     */
    function cloneObj(o) {
        if (typeof (o) === typeof (1) || typeof ('') === typeof (o) || typeof (o) === typeof (true) ||
            typeof (o) === typeof (undefined)) {
            return o
        }
        if (Array.isArray(o)) {
            let arr = []
            for (let key in o) {
                arr.push(cloneObj(o[key]))
            }
            return arr
        }
        if (typeof (o) === typeof ({})) {
            if (o === null) {
                return o
            }
            let obj = {}
            for (let key in o) {
                obj[key] = cloneObj(o[key])
            }
            return obj
        }
        return o;
    }

    function getURLSpecFromFile(aFile) {
        var aURL;
        if (typeof userChrome !== "undefined" && typeof userChrome.getURLSpecFromFile !== "undefined") {
            aURL = userChrome.getURLSpecFromFile(aFile);
        } else if (this.appVersion < 92) {
            aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
        } else {
            aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
        }
        return aURL;
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

    window.VideoBtn.init();
    setTimeout(function () { window.VideoBtn.rebuild(); }, 1000);//1秒
    setTimeout(function () { window.VideoBtn.rebuild(); }, 3000);//3秒
})(`
    #contentAreaContextMenu[VideoBtn] .VideoBtn:not(menuseparator):not(menugroup) {
        visibility: collapse;
    }
    #contentAreaContextMenu[VideoBtn~="link"] .VideoBtn[condition~="link"],
    #contentAreaContextMenu[VideoBtn~="image"] .VideoBtn[condition~="image"],
    #contentAreaContextMenu[VideoBtn~="canvas"] .VideoBtn[condition~="canvas"],
    #contentAreaContextMenu[VideoBtn~="select"] .VideoBtn[condition~="select"],
    #contentAreaContextMenu[VideoBtn~="input"] .VideoBtn[condition~="input"],
    #contentAreaContextMenu[VideoBtn~="mailto"] .VideoBtn[condition~="mailto"],
    #contentAreaContextMenu[VideoBtn=""] .VideoBtn[condition~="normal"] {
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

    .VideoBtn-Popup .menu-iconic.skin,
    .VideoBtn-Popup .menuitem-iconic.skin {
        list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik03MDYuNTQ1IDEyOC4wMTlhNjMuOTg1IDYzLjk4NSAwIDAgMSA0OC41OTkgMjIuMzYzbDE3Mi44MzUgMjAxLjc2My02My45OTYgMTI3Ljg1Ny00MS4zNzQtNDEuMzcxYy02LjI1LTYuMjQ4LTE0LjQzNy05LjM3Mi0yMi42MjQtOS4zNzItOC4xODggMC0xNi4zNzQgMy4xMjQtMjIuNjI0IDkuMzcyYTMyLjAwNiAzMi4wMDYgMCAwIDAtOS4zNzUgMjIuNjI2djQwMi43MjdjMCAxNy42NzItMTQuMzI3IDMxLjk5OC0zMS45OTkgMzEuOTk4SDMyMC4wMWMtMTcuNjcxIDAtMzEuOTk4LTE0LjMyNi0zMS45OTgtMzEuOTk4VjQ2MS4yNTZjMC0xNy42NzItMTQuMzI4LTMxLjk5OC0zMi0zMS45OThhMzEuOTk3IDMxLjk5NyAwIDAgMC0yMi42MjQgOS4zNzJsLTQxLjM3MyA0MS4zNzFMOTYuMDIgMzUyLjAwN2wxNzIuODM1LTIwMS42NGE2My45ODcgNjMuOTg3IDAgMCAxIDQ4LjU5Mi0yMi4zNDhoNi41MDdhOTUuOTcgOTUuOTcgMCAwIDEgNTAuMTMgMTQuMTMyQzQyOC4zNyAxNzUuMzk0IDQ3NC4zMzggMTkyLjAxNSA1MTIgMTkyLjAxNXM4My42MjktMTYuNjIxIDEzNy45MTUtNDkuODY0YTk1Ljk2OCA5NS45NjggMCAwIDEgNTAuMTMtMTQuMTMyaDYuNW0wLTYzLjk5OGgtNi41YTE1OS44OSAxNTkuODkgMCAwIDAtODMuNTU3IDIzLjU1OEM1NjEuOTA0IDEyMSA1MjkuNTM3IDEyOC4wMTggNTEyIDEyOC4wMThjLTE3LjUzOCAwLTQ5LjkwNC03LjAxNy0xMDQuNDk1LTQwLjQ0NmExNTkuODgxIDE1OS44ODEgMCAwIDAtODMuNTUtMjMuNTVoLTYuNTA4YTEyNy44MjMgMTI3LjgyMyAwIDAgMC05Ny4xODIgNDQuNzAxTDQ3LjQyOCAzMTAuMzZjLTE5LjUyMiAyMi43NzQtMjAuNiA1Ni4wNS0yLjYxIDgwLjA0N0wxNDAuODE1IDUxOC40YTYzLjk5OCA2My45OTggMCAwIDAgODMuMTk5IDE3LjAyNXYzMjguNTU4YzAgNTIuOTMyIDQzLjA2IDk1Ljk5NSA5NS45OTUgOTUuOTk1aDQxNS45OGM1Mi45MzUgMCA5NS45OTYtNDMuMDYzIDk1Ljk5Ni05NS45OTVWNTM1LjQyNWE2NC4wMjggNjQuMDI4IDAgMCAwIDQyLjI0IDcuNzQ5IDY0LjAxNCA2NC4wMTQgMCAwIDAgNDYuOTktMzQuNTI4bDYzLjk5Ny0xMjcuODU3YzExLjUyMi0yMy4wMjggOC4xMjUtNTAuNzIyLTguNjMzLTcwLjI3OUw4MDMuNzQ0IDEwOC43NDdjLTI0LjMzNi0yOC40MjItNTkuNzctNDQuNzI2LTk3LjItNDQuNzI2eiIgcC1pZD0iMTI4MiI+PC9wYXRoPjwvc3ZnPg==) !important;
    }
`, false);