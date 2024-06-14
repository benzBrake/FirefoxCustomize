// ==UserScript==
// @name            CopyCat.uc.js
// @description     CopyCat 资源管理
// @author          Ryan
// @version         0.2.6
// @compatibility   Firefox 78
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/browser.xul
// @shutdown        window.CopyCat.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @note            0.2.6 Bug 1880914  Move Browser* helper functions used from global menubar and similar commands to a single object in a separate file, loaded as-needed
// @note            0.2.5 移除 panelview 支持，修复关闭第一个窗口后新窗口无法弹出菜单的bug
// @note            0.2.4 Uncaught NS_ERROR_XPC_BAD_CONVERT_JS: Could not convert JavaScript argument arg 0 [nsIFilePicker.init]
// @note            0.2.3 完善 Debug 日志
// @note            0.2.2 Bug 1815439 - Remove useless loadURI wrapper from browser.js
// @note            0.2.1 修复 openUILinkIn 被移除
// @note            0.2.0 修正点击按钮无法关闭菜单
// @note            0.1.9 新增隐藏内置菜单选项 （userChromeJS.CopyCat.hideInternal）
// @note            0.1.8 支持切换 panelview 到 menupopup （userChromeJS.CopyCat.buildPanel），修复运行参数问题
// @note            0.1.7 主题设置分离到 CopyCatTheme.uc.js
// @note            0.1.6 分离菜单配置
// @note            0.1.5 重写部分代码，摆脱 osfile_async_front.jsm 依赖，预防性修改
// @note            0.1.4 Firefox Nightly 20220713 OS is not defined
// @note            0.1.3 修改主题列表 tooltiptext，尝试修复有时候 CSS 未加载
// @note            0.1.2 新增移动菜单功能，本地化覆盖所有菜单
// @note            0.1.1 修复 bug，自动读取主题选项
// @note            0.1.0 初始版本
// ==/UserScript==

location.href.startsWith("chrome://browser/content/browser.x") && (function (css, i18n, sss, SEPARATOR_TYPE) {
    const { LANG, LOCALE } = i18n;
    var lprintf = (f, ...args) => { return sprintf(f in LANG ? LANG[f] : f, ...args); };


    const CustomizableUI = globalThis.CustomizableUI || Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    const PRE_MENUS = [{
        class: 'showFirstText',
        group: [{
            label: lprintf("chrome-folder"),
            exec: '\\chrome',
        }, {
            label: lprintf("restart-firefox"),
            tooltiptext: lprintf("restart-firefox"),
            class: 'reload',
            oncommand: 'Services.startup.quit(Services.startup.eAttemptQuit | Services.startup.eRestart);',
        }]
    }, {
        id: 'CopyCat-ChromeFolder-Sep'
    }, {
        id: 'CopyCat-InsertPoint'
    }, {
        class: 'showFirstText',
        group: [{
            label: lprintf("modify-copycat-js"),
            image: "chrome://browser/skin/preferences/category-general.svg",
            oncommand: 'CopyCat.editConfig();'
        }, {
            label: lprintf("reload-copycat-js"),
            tooltiptext: lprintf("reload-copycat-js"),
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
            oncommand: 'CopyCat.rebuild(true);'
        }]
    }, {
        label: lprintf("about-copycat"),
        where: 'tab',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADHUlEQVQ4T22TX0jaURTH9zP/tObsNwfVbLNly9mouRepwbKC9WCbQcUop7V6KgrBBkFRKPZQBNG2SGbh1stsgbUtsRWMdFFs5ZQiVlMLJQLXcKUii7TQnSs5LCZcvPd37vlwzvd8L3Yu7heJRIhwvAtLHAqFeIeHh5dQODEx0Ucmk82w1cL6imHYcSwNi20gmQ77Vo/HI1heXt4xmUxbDofDTyAQMA6HgxcXF7Pz8/Ov0un0abg3AJB9lBsFoORwODywsrLCamtrm4HkX+hzLH7yj5WVlaX19vY+zM3NtQO4FUEwSE6AC0qr1covLy/Xud3uoFQqZWVkZCRDLOL1eg+NRuPu0tKSF0FZLBZ1ampKBJBPcFYgAB/KHhCJRJNzc3MeCoVCWl9fb8rMzLx1cHAQgN4pgUBgv7u7e2xwcHALQaqqqhgajaYSx3EpArw0fDSkCR8IUW8EABBtNlsLlUq9KJPJRktKSpj19fWPLRbLl4KCgrcnmkWgqkqIbWPBYNDS2dlp6u/vt8cAdru9BUCU7OzsgerqaoZKpZKtrq5+A8DYiR5hpVJ5u6Ojg4/5/X6nWCx+bTAYkHAYqmBjY6M5PT39usvlsqWkpKQdHR2FFArF+PDwsCsGkEgkzJGRkYYooLa2dlSv1+/GAxgMBhME3QYx2QsLC0Yo932cZcJ1dXVMtVrdgFqwyuXyz319fT/iW0DilZaWqnQ6nZjJZN5obGx8odVqd9AdWOGenp47MPJ7SET17OwsQyAQ6P+nAfTJaW9vb1pcXDQVFRVNxkScn59/xOfzndEx7u3tPQel34EOu2iMZrP5CdiXzOPxXtFotARQvCEpKYlaU1OjAdBv0Iw5pBqqxJPx5n9GWltbu19RUTHudDr/cLlcGpFIxMBcATT3nJycC6mpqRQA+7Oyss5PTExI2Gz2DMTk8VZ+Bupzurq6psFp7jNWjtoaRnoNDCWE5O9wlkWtfOYxPfX5fEJ4Ez9Becfm5qYPxaECemFh4c08bt4VnIZ/gE+nH1McJPacJTD7/OPj48soRiKR9qGlJdi+gXXqOf8FiAp+x+cxAKgAAAAASUVORK5CYII=',
        url: 'https://kkp.disk.st/firefox-ryan-personal-customization.html'

    }];

    window.CopyCatUtils = {
        get platform() {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        get debug() {
            return this.prefs.get("userChromeJS.CopyCat.debug", false);
        },
        get TOOLS_RELATIVE_PATH() {
            delete this.TOOLS_RELATIVE_PATH;
            return this.TOOLS_RELATIVE_PATH = "\\chrome\\UserTools";
        },
        get TOOLS_PATH() {
            delete this.TOOLS_PATH;
            return this.TOOLS_PATH = handleRelativePath(this.TOOLS_RELATIVE_PATH);
        },
        get FILE() {
            var path = CopyCatUtils.prefs.get("userChromeJS.CopyCat.FILE_PATH", "_copycat.js")
            var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);
            if (!aFile.exists()) {
                saveFile(aFile, '');
                CopyCatUtils.alert('配置文件为空');
            }
            delete this.FILE;
            return this.FILE = aFile;
        },
        prefs: {
            get: function (prefPath, defaultValue) {
                const sPrefs = Services.prefs;
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
                let o = (q, w, e) => (b(CopyCatUtils.prefs.get(e), e));
                Services.prefs.addObserver(a, o);
                return { pref: a, observer: o }
            },
            removeListener: (a) => (Services.prefs.removeObserver(a.pref, a.observer))
        },
        log: function (...args) {
            if (this.debug) {
                console.log('[CopyCatButton]', ...args);
            }
        },
        error: function (...args) {
            console.error('[CopyCatButton]', ...args);
        },
    }

    window.CopyCat = {
        STYLE: {
            url: makeURI("data:text/css;charset=utf-8," + encodeURIComponent(css)),
            type: Services.vc.compare(Services.appinfo.version, "118.0.2") ? sss.USER_SHEET : sss.AUTHOR_SHEET
        },
        init: function () {
            // load stylesheet
            if (!sss.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
                sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
            }

            // create CopyCat button
            if (!(CustomizableUI.getWidget('CopyCat-Btn') && CustomizableUI.getWidget('CopyCat-Btn').forWindow(window)?.node)) {
                CopyCatUtils.log("Creating CopyCat button");
                CustomizableUI.createWidget({
                    id: 'CopyCat-Btn',
                    removable: true,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    type: "custom",
                    onBuild: doc => this.createButton(doc)
                });
            }

            this.btn = CustomizableUI.getWidget('CopyCat-Btn').forWindow(window)?.node;
            if (!this.btn) {
                CopyCatUtils.log("Cannot get the CopyCat Button");
                return;
            }
            this.btn.addEventListener("mouseover", this);
            $('CopyCat-Btn', this.btn)?.addEventListener("popupshowing", this);
            this.NEED_REBULD = true;
            window.addEventListener("beforeunload", async () => {
                await this.destroy();
            });
        },
        handleEvent: function (event) {
            switch (event.type) {
                case "popupshowing":
                    CopyCatUtils.log("CopyCat Panel showing!");
                    let menupopup = event.target;
                    if (menupopup.id !== "CopyCat-Popup") return;
                    if (menupopup.getAttribute("inited") !== "true") {
                        PRE_MENUS.forEach(obj => {
                            let menuitem = this.newMenuitem(event.target.ownerDocument, obj);
                            menupopup.appendChild(menuitem);
                        });
                        menupopup.setAttribute("inited", true);
                    }
                    menupopup.setAttribute("HideNoneDynamicItems", CopyCatUtils.prefs.get("userChromeJS.CopyCat.hideInternal", false));
                    if (this.NEED_REBULD) {
                        this.rebuild();
                        this.NEED_REBULD = false;
                    }
                    break;
                case "mouseover":
                    if (event.target.id !== "CopyCat-Btn") return;
                    let win = event.target.ownerGlobal;
                    let mp = event.target.querySelector(":scope>menupopup");
                    if (event.clientX > (win.innerWidth / 2) && event.clientY < (win.innerHeight / 2)) {
                        mp.setAttribute("position", "after_end");
                    } else if (event.clientX < (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
                        mp.setAttribute("position", "before_start");
                    } else if (event.clientX > (win.innerWidth / 2) && event.clientY > (win.innerHeight / 2)) {
                        mp.setAttribute("position", "before_start");
                    } else {
                        mp.removeAttribute("position", "after_end");
                    }
                    break;
            }
        },
        createButton(doc) {
            let btn = createElement(doc, 'toolbarbutton', {
                id: 'CopyCat-Btn',
                label: lprintf("copycat-brand"),
                tooltiptext: lprintf("copycat-btn-tooltip"),
                type: 'menu',
                class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                onclick: function (event) {
                    if (event.target.id !== "CopyCat-Btn") return;
                    if (event.button === 2) {
                        if (window.AM_Helper) {
                            event.preventDefault();
                            const b = 'openAddonsMgr';
                            eval(`${parseInt(Services.appinfo.version) < 126
                                ? "Browser" + b[0].toUpperCase() + b.slice(1)
                                : "BrowserAddonUI." + b}("addons://list/userchromejs")`);
                        }
                    }
                }
            });
            btn.appendChild(createElement(doc, "menupopup", {
                id: "CopyCat-Popup",
                class: "CopyCat-Popup"
            }));
            return btn;
        },
        newMenugroup: function (doc, obj) {
            if (!doc || !obj) return;
            let group = createElement(doc, "menugroup", obj, ["group"]);
            group.classList.add("CopyCat-Group");
            obj.group.forEach(o => {
                group.appendChild(this.newMenuitem(doc, o));
            })
            CopyCatUtils.log("Creating Menugroup: " + (obj.label || "<empty label>"), group);
            return group;
        },
        newMenupopup: function (doc, obj) {
            if (!doc || !obj) return;
            let aItem;

            aItem = createElement(doc, "menu", obj, ["popup", "onBuild"]);
            CopyCatUtils.log("Creating Menu " + (obj.label || "<empty label>"), aItem);
            aItem.classList.add("menu-iconic");
            let menupopup = aItem.appendChild(createElement(doc, "menupopup"));
            obj.popup.forEach(mObj => menupopup.appendChild(this.newMenuitem(doc, mObj)));

            if (obj.onBuild) {
                if (typeof obj.onBuild === "function") {
                    obj.onBuild(doc, item);
                } else {
                    eval("(" + obj.onBuild + ").call(item, doc, item)")
                }
            }
            return aItem;
        },
        newMenuitem: function (doc, obj) {
            if (!doc || !obj) return;
            if (obj.group) {
                return this.newMenugroup(doc, obj);
            }
            if (obj.popup) {
                return this.newMenupopup(doc, obj);
            }
            let classList = [], tagName = obj.type || "menuitem";
            // 分隔符
            if (SEPARATOR_TYPE.includes(obj.type) || !obj.group && !obj.popup && !obj.label && !obj.labelRef && !obj.tooltiptext && !obj.image && !obj.content && !obj.command && !obj.pref) {
                return createElement(doc, "menuseparator", obj, ['type', 'group', 'popup']);
            }
            if (['checkbox', 'radio'].includes(obj.type)) tagName = "menuitem";
            if (obj.class) obj.class.split(' ').forEach(c => {
                if (!classList.includes(c)) classList.push(c);
            });

            if (obj.type && obj.type.startsWith("html:")) {
                tagName = obj.type;
                delete obj.type;
            }

            classList.push("menuitem-iconic");

            if (obj.tool) {
                obj.exec = handleRelativePath(obj.tool, CopyCatUtils.TOOLS_PATH);
                delete obj.tool;
            }

            if (obj.exec) {
                obj.exec = handleRelativePath(obj.exec);
            }

            if (obj.command) {
                // 移动菜单
                obj.clone = obj.clone || false;
                let org = $(obj.command, doc),
                    dest;
                if (org) {
                    dest = dest = obj.clone ? org.cloneNode(true) : org;
                    if (dest.localName === "menu") {
                        // fix close menu
                        if (dest.hasAttribute('closemenu'))
                            dest.setAttribute('orgClosemenu', dest.getAttribute('closemenu'));
                        dest.setAttribute('closemenu', 'none');
                    }
                    if ('class' in obj) {
                        // fix menu icon
                        dest.setAttribute('orgClass', dest.getAttribute('class'));
                        dest.setAttribute('class', obj.class);
                        if (obj.class.split(' ').includes("menu-iconic")) {
                            // fix menu left icon
                            if (!dest.querySelector(':scope>.menu-iconic-left')) {
                                let left = dest.insertBefore(createElement(doc, 'hbox', {
                                    class: 'menu-iconic-left',
                                    align: 'center',
                                    pack: 'center',
                                    'aria-hidden': true
                                }), dest.firstChild);
                                left.appendChild(createElement(doc, 'image', {
                                    class: 'menu-iconic-icon'
                                }));
                                dest.setAttribute('removeMenuLeft', 'true');
                            }

                            // fix menu-text
                            let nextEl = dest.querySelector(":scope>.menu-text")
                            if (nextEl && nextEl.localName.toLowerCase() === "label") {
                                if (!nextEl.classList.contains("menu-iconic-text")) {
                                    nextEl.setAttribute('orgClass', nextEl.getAttribute("class"));
                                    nextEl.setAttribute('class', 'menu-iconic-text');
                                }
                            }
                        }
                    }

                    // Support attribute insert for clone node
                    ["image", "style", "label", "tooltiptext", "type"].forEach(attr => {
                        if (attr in obj) {
                            dest.setAttribute('org' + attr.slice(0, 1).toUpperCase() + attr.slice(1), org.getAttribute(attr));
                            org.setAttribute(attr, obj[attr]);
                        }
                    });

                    // fix menu-right
                    if (!obj.clone && obj["menu-right"]) {
                        dest.setAttribute("removeMenuRight", "true");
                        let right = dest.appendChild(createElement(doc, 'hbox', {
                            class: 'menu-right',
                            align: 'center',
                            'aria-hidden': true
                        }));
                        right.appendChild(createElement(doc, 'image'));
                    }
                    if ('onBuild' in obj && typeof dest !== 'undefined') {
                        if (typeof obj.onBuild === "function") {
                            obj.onBuild(doc, org);
                        } else {
                            eval("(" + obj.onBuild + ").call(org, doc, dest)")
                        }
                    }
                    let replacement = createElement(doc, 'menuseparator', {
                        hidden: true, class: 'CopyCat-Replacement', 'original-id': obj.command
                    });
                    if (!obj.clone) {
                        dest.setAttribute('restoreBeforeUnload', 'true');
                        dest.restoreHolder = replacement;
                        dest.parentNode.insertBefore(replacement, dest);
                        CopyCatUtils.log('Moving Item: ' + obj.command, dest);
                    } else {
                        CopyCatUtils.log('Cloning Item: ' + obj.command, dest);
                    }

                    return dest;
                } else if (!'placehoder' in obj || obj.placeholder) {
                    return createElement(doc, 'menuseparator', {
                        class: "CopyCat-Replacement",
                        hidden: true
                    });
                } else {
                    return;
                }
            } else {
                item = createElement(doc, tagName, obj, ['popup', 'onpopupshowing', 'class', 'exec', 'edit', 'group', 'onBuild']);
                if (classList.length) item.setAttribute('class', classList.join(' '));
                applyAttr(item, obj, ['class', 'defaultValue', 'popup', 'onpopupshowing', 'type', 'value']);
                let label = obj.label || obj.command || obj.oncommand || "";
                if (label)
                    item.setAttribute('label', label);

                if (obj.pref) {
                    let type = obj.type || CopyCatUtils.prefs.getType(obj.pref) || 'prompt';
                    const defaultVal = {
                        string: '',
                        prompt: '',
                        radio: '',
                        int: 0,
                        bool: false,
                        boolean: false
                    }
                    item.setAttribute('type', type);

                    // 设置默认值
                    if (!obj.defaultValue) item.setAttribute('defaultValue', defaultVal[type]);
                    if (type === 'checkbox') {
                        item.setAttribute('checked', !!CopyCatUtils.prefs.get(obj.pref, obj.defaultValue !== undefined ? obj.default : false));
                    } else {
                        let value = CopyCatUtils.prefs.get(obj.pref);
                        if (type === "prompt") {
                            item.setAttribute('value', value);
                            item.setAttribute('label', sprintf(obj.labelRef || obj.label, value));
                        }
                    }
                }
            }

            if (obj.content) {
                item.innerHTML = obj.content;
                item.removeAttribute('content');
            }

            if (obj.oncommand || obj.command) return item;

            item.setAttribute("oncommand", "CopyCat.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(item, obj);

            CopyCatUtils.log("Creating Item: ", (item.label || "<empty label>"), item);

            return item;
        },
        setIcon: function (menu, obj) {
            if (menu.getAttribute("type") === "checkbox") return;
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon")) return;
            if (obj.edit || obj.exec) {
                var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                try {
                    aFile.initWithPath(handleRelativePath(obj.edit) || obj.exec);
                } catch (e) {
                    CopyCatUtils.error(e);
                    return;
                }
                // if (!aFile.exists() || !aFile.isExecutable()) {
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
                } catch (e) { }
                if (!uri) return;

                menu.setAttribute("scheme", uri.scheme);
                PlacesUtils.favicons.getFaviconDataForPage(uri, {
                    onComplete: function (aURI, aDataLen, aData, aMimeType) {
                        try {
                            // javascript: URI の host にアクセスするとエラー
                            menu.setAttribute("image", aURI && aURI.spec ? "moz-anno:favicon:" + aURI.spec : "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
                        } catch (e) {
                        }
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
                console.error(e)
            }).catch(e => {
                console.error(e)
            });
        },
        rebuild: function (isAlert = false) {
            if (this.initializing) return;
            let menupopup = $('CopyCat-Popup', this.btn);
            this.uninit(menupopup);
            this.makeMenus(menupopup);
            this.initializing = false;
            if (isAlert || this.NEED_ALERT) {
                this.NEED_ALERT = false;
                alerts(lprintf("reload-copycat-js-complete"));
            }
        },
        makeMenus(menupopup) {
            if (typeof menupopup === "undefined") return;
            let data = loadText(CopyCatUtils.FILE.path);
            if (!data) return null;

            let sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
            sandbox.Components = Components;
            sandbox.Cc = Cc;
            sandbox.Ci = Ci;
            sandbox.Cr = Cr;
            sandbox.Cu = Cu;
            sandbox.Services = Services;
            sandbox.CopyCatUtils = CopyCatUtils;
            sandbox.CopyCat = this;
            sandbox.lprintf = lprintf;
            sandbox.locale = LOCALE;
            sandbox['_menus'] = [];
            sandbox['_css'] = [];
            sandbox['_lang'] = {
                __noSuchMethod__: function () {
                    return "";
                }
            };
            sandbox['menus'] = function (itemObj) {
                ps(itemObj, sandbox['_menus']);
            }

            function ps(item, array) {
                ("join" in item && "unshift" in item) ? [].push.apply(array, item) : array.push(item);
            }

            try {
                var lineFinder = new Error();
                Cu.evalInSandbox("function setLocale(locale) { this.locale = locale }; function css(code){ this._css.push(code+'') };\nfunction lang(obj) { Object.assign(this._lang, obj); }" + data, sandbox, "1.8");
            } catch (e) {
                let line = e.lineNumber - lineFinder.lineNumber - 1;
                alerts(e + lprintf("check-config-file-with-line", line), null, function () {
                    this.edit(CopyCatUtils.FILE, line);
                });
                return console.error(e);
            }

            let { ownerDocument: aDoc } = menupopup;

            sandbox._menus.forEach((itemObj) => {
                this.insertMenuitem(aDoc, itemObj, this.newMenuitem(aDoc, itemObj));
            });

            this._lang = sandbox._lang;

            ["label", "tooltiptext"].forEach((attr) => {
                $$(`.CopyCat-Popup [${attr}Ref]`, menupopup, (btn) => {
                    if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                });
                $$(`.CopyCat-Popup [${attr}Ref]`, menupopup, (btn) => {
                    if (btn.hasAttribute(attr + "Ref")) setText(btn, attr);
                });
            });


            function setText(item, attr) {
                var ref = item.getAttribute(attr + "Ref");
                if (sandbox._lang[sandbox.locale]) {
                    if (sandbox._lang[sandbox.locale][ref]) {
                        item.setAttribute(attr, sandbox._lang[sandbox.locale][ref]);
                    } else {
                        item.setAttribute(attr, capitalizeFirstLetter(ref));
                    }
                }
            }

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            if (sandbox._css.length) {
                // windows((doc, win, location) => {
                //     if (win.CopyCat) {
                //         if (win.CopyCat.STYLE2) removeElement(win.CopyCat.STYLE2);
                //         win.CopyCat.STYLE2 = addStyle(sandbox._css.join("\n"))
                //     }
                // });
            }
        },
        onCommand(event) {
            event.stopPropagation();
            let item = event.target;
            let precommand = item.getAttribute('precommand') || "",
                postcommand = item.getAttribute("postcommand") || "",
                pref = item.getAttribute("pref") || "",
                text = item.getAttribute("text") || "",
                exec = item.getAttribute("exec") || "",
                edit = item.getAttribute("edit") || "",
                url = item.getAttribute("url") || "",
                where = item.getAttribute("where") || "";
            if (precommand) eval(precommand);
            if (pref)
                this.handlePref(event, pref);
            else if (edit)
                this.edit(handleRelativePath(edit));
            else if (exec)
                this.exec(exec, text);
            else if (url)
                this.openCommand(event, url, where);
            if (postcommand) eval(postcommand);

            if (event.button !== 2 && event.target.getAttribute("closemenu") !== "none") {
                closeMenus(event.target.closest("menupopup"));
            }
        },
        handlePref: function (event, pref) {
            let item = event.target;
            if (item.getAttribute('type') === 'checkbox') {
                let setVal = CopyCatUtils.prefs.get(pref, false, !!item.getAttribute('defaultValue'));
                CopyCatUtils.prefs.set(pref, !setVal);
                item.setAttribute('checked', !setVal);
            } else if (item.getAttribute('type') === 'radio') {
                if (item.hasAttribute('value')) {
                    CopyCatUtils.prefs.set(pref, item.getAttribute('value'));
                }
            } else if (item.getAttribute('type') === 'prompt') {
                let type = item.getAttribute('valueType') || 'string',
                    val = prompt(item.getAttribute('label'), CopyCatUtils.prefs.get(pref, item.getAttribute('default') || ""));
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
                    CopyCatUtils.prefs.set(pref, val);
                }
            }
        },
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return console.error('openCommand', 'url is invalid', url);
            }
            if (uri.scheme === "javascript") {
                try {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                } catch (e) {
                    gBrowser.loadURI(uri, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                if (CopyCatUtils.appVersion < 78) {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } else {
                    openTrustedLinkIn(uri.spec, where, {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ? gBrowser.selectedBrowser.contentPrincipal : (/^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal())
                    });
                }
            } else if (event.button == 1) {
                if (typeof openNewTabWith !== "undefined") {
                    openNewTabWith(uri.spec);
                } else {
                    openTrustedLinkIn(uri.spec, 'tab', {
                        postData: postData || null,
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ? Services.scriptSecurityManager.createNullPrincipal({}) : Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } else {
                if (CopyCatUtils.appVersion < 78) openUILink(uri.spec, event); else {
                    openUILink(uri.spec, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            }
        },
        editConfig: function () {
            this.edit(CopyCatUtils.FILE.path);
        },
        edit: function (path, aLineNumber) {
            let aFile = getFile(path), editor;
            if (!aFile) {
                console.error("Param is invalid", "CopyCat.edit", path);
                return;
            }

            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) { }

            if (!editor || !editor.exists()) {
                alert(lprintf('please-set-editor-path'));
                let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
                fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                    ? window.browsingContext
                    : window, lprintf('set global editor'), fp.modeOpen);

                fp.appendFilters(Ci.nsIFilePicker.filterApps);

                var isCompleted = false;
                if (typeof fp.show !== 'undefined') {
                    if (fp.show() == fp.returnCancel || !fp.file)
                        return;
                    else {
                        editor = fp.file;
                        Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        isCompleted = true;
                    }
                } else {
                    fp.open(res => {
                        if (res != Ci.nsIFilePicker.returnOK) return;
                        editor = fp.file;
                        Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        isCompleted = true;
                    });
                }
                var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                while (!isCompleted) {
                    thread.processNextEvent(true);
                }
            }

            let aURL = getURLSpecFromFile(aFile);
            let aDocument = null;
            let aCallBack = null;
            let aPageDescriptor = null;
            gViewSourceUtils.openInExternalEditor({
                URL: aURL,
                lineNumber: aLineNumber
            }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
        },
        exec: function (path, arg) {
            let aFile = getFile(path);
            if (!aFile) {
                CopyCatUtils.error(lprintf("param is invalid", "this.exec", path));
                return;
            }
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var a;
                if (typeof arg == "undefined") arg = []; // fix slice error
                if (typeof arg == 'string' || arg instanceof String) {
                    if (arg === "") a = []
                    else a = arg.split(/\s+/)
                } else if (Array.isArray(arg)) {
                    a = arg;
                } else {
                    a = [arg];
                }

                if (!aFile.exists()) {
                    console.error(lprintf("file not found", path));
                    return;
                }

                // Linux 下目录也是 executable
                if (!aFile.isDirectory() && aFile.isExecutable()) {
                    process.init(aFile);
                    process.runw(false, a, a.length);
                } else {
                    aFile.launch();
                }
            } catch (e) {
                CopyCatUtils.error(e);
            }
        },
        copyText: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
        },
        insertMenuitem(doc, obj, item) {
            if (!item) {
                CopyCatUtils.log("Item to be inserted is null!");
                return;
            } else {
                CopyCatUtils.log("Inserting item: " + item.getAttribute('label'), item);
            }
            if (item.getAttribute('restoreBeforeUnload') !== 'true') {
                item.classList.add('CopyCat-Dynamic');
            }

            const aPopup = $('CopyCat-Popup', doc);
            if (obj && obj.insertBefore && $(obj.insertBefore, doc)) {
                $(obj.insertBefore, doc).before(item)
            } else if (obj && obj.insertAfter && $(obj.insertAfter, doc)) {
                $(obj.insertBefore, doc).after(item)
            } else if ($('#CopyCat-InsertPoint', aPopup)) {
                aPopup.insertBefore(item, $('#CopyCat-InsertPoint', aPopup));
            } else {
                aPopup.appendChild(item);
            }
        },
        uninit: function (menupopup) {
            if (this.initializing) return;
            if (!menupopup) return;
            restoreMenusInPopup(menupopup);
            function restoreMenusInPopup(menupopup) {
                $$('[restoreBeforeUnload="true"]', menupopup, item => {
                    item.removeAttribute("closemenu");
                    item.getAttributeNames().filter(attr => attr.startsWith("org")).forEach(attr => {
                        item.setAttribute(attr.substring(3, attr.length).toLowerCase(), item.getAttribute(attr));
                        item.removeAttribute(attr);
                    });
                    let labels = [...item.childNodes].filter(el => el.localName.toLowerCase() === "label");
                    if (labels.length) {
                        labels.forEach(label => {
                            label.getAttributeNames().filter(attr => attr.startsWith("org")).forEach(attr => {
                                label.setAttribute(attr.substring(3, attr.length).toLowerCase(), label.getAttribute(attr));
                                label.removeAttribute(attr);
                            });
                        })
                    }
                    if (item.getAttribute("removeMenuLeft") == "true") {
                        removeElement(item.querySelector(":scope > .menu-iconic-left"));
                        item.removeAttribute("removeMenuLeft");
                        item.classList.remove("menu-iconic");
                        let label = item.querySelector(':scope>.menu-iconic-text');
                        if (label) label.className = 'menu-text';
                    }
                    if (item.getAttribute("removeMenuRight") == "true") {
                        removeElement(item.querySelector(":scope > .menu-right"));
                        item.removeAttribute("removeMenuRight")
                    }
                    let { restoreHolder } = item;
                    if (restoreHolder) {
                        restoreHolder.parentNode.insertBefore(item, restoreHolder);
                        removeElement(restoreHolder);
                        item.restoreHolder = null;
                    }
                    item.removeAttribute("restoreBeforeUnload");
                });
            }
            $$(".CopyCat-Dynamic", menupopup, (elm) => removeElement(elm));
        },
        destroy: async function () {
            CustomizableUI.destroyWidget("CopyCat-Btn");
            if (sss.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
                sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            }
        }
    }

    if (gBrowserInit.delayedStartupFinished) window.CopyCat.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.CopyCat.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

    /**
     * 选取 DOM 元素
     * 
     * @param {string} s id 或者 css 选择器
     * @param {Document|null} d 指定 document，不提供就是全局 document
     * @returns 
     */
    function $(s, d) {
        return /[#\.[:]/i.test(s.trim()) ? (d || document).querySelector(s) : (d instanceof HTMLDocument ? d : d.ownerDocument || document).getElementById(s);
    }

    function $$(s, d, fn) {
        let elems = /[#\.[:]/i.test(s.trim()) ? (d || document).querySelectorAll(s) : (d instanceof HTMLDocument ? d : d.ownerDocument || document).getElementsByTagName(s);
        if (typeof fn === "function") {
            [...elems].forEach(el => fn.call(el, el));
        } return elems;
    }

    /**
     * 创建 DOM 元素
     * 
     * @param {Document} d HTML 文档
     * @param {string} t DOM 元素标签
     * @param {Object} o DOM 元素属性键值对
     * @param {Array} s 跳过属性
     * @returns 
     */
    function createElement(d, t, o = {}, s = []) {
        if (!d) return;
        let e = /^html:/.test(t) ? d.createElement(t) : d.createXULElement(t);
        return applyAttr(e, o, s);
    }


    /**
     * 给 DOM 元素应用属性
     * 
     * @param {HTMLElement} e DOM 元素
     * @param {Object|null} o 属性键值对，使用 Object 方式存储
     * @param {Object|null} s 跳过属性
     * @returns 
     */
    function applyAttr(e, o = {}, s = []) {
        for (let [k, v] of Object.entries(o)) {
            if (s.includes(k)) continue;
            if (typeof v == "function") {
                e.setAttribute(k, typeof v === 'function' ? "(" + v.toString() + ").call(this, event);" : v);
            } else {
                e.setAttribute(k, v);
            }
        }
        return e;
    }


    /**
     * 删除 HTML 元素
     * 
     * @param {HTMLElement} e HTML 元素
     * @returns 
     */
    function removeElement(e) {
        return e && e.parentNode && e.parentNode.removeChild(e);
    }

    /**
     * 右下角通知
     * 
     * @param {string} aMsg 消息内容
     * @param {string|null} aTitle 消息标题，不提供则为 CopyCat Button
     * @param {Function} aCallback 回掉函数
     */
    function alerts(aMsg, aTitle, aCallback) {
        var callback = aCallback ? {
            observe: function (subject, topic, data) {
                if ("alertclickcallback" != topic)
                    return;
                aCallback.call(null);
            }
        } : null;
        var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        alertsService.showAlertNotification(
            "chrome://devtools/skin/images/browsers/firefox.svg", aTitle || "CopyCat Button",
            aMsg + "", !!callback, "", callback);
    }

    /**
     * 格式化字符串
     * 
     * @param {string} f 格式字符串
     * @param  {...any} args 剩余参数，只能是数字和字符串
     * @returns 
     */
    function sprintf(f, ...args) {
        let s = f; for (let a of args) s = s.replace(/%[sd]/, a); return s;
    }


    /**
     * 获取 file:/// 链接
     * @param {Ci.nsIFile} f 
     * @returns 
     */
    function getURLSpecFromFile(f) {
        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        return fph.getURLSpecFromActualFile(f);
    }

    /**
     * 读取文件内容
     * 
     * @param {string} path 
     * @returns 
     */
    function loadText(path) {
        var aFile = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIDirectoryService)
            .QueryInterface(Ci.nsIProperties)
            .get('UChrm', Ci.nsIFile);
        aFile.initWithPath(path);
        var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(aFile, -1, 0, 0);
        sstream.init(fstream);
        var data = sstream.read(sstream.available());
        try {
            data = decodeURIComponent(escape(data));
        } catch (e) { }
        sstream.close();
        fstream.close();
        return data;
    }


    /**
     * 保存内容到文件
     * 
     * @param {string} path 
     * @param {string} data 
     */
    function saveText(path, data) {
        var aFile = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIDirectoryService)
            .QueryInterface(Ci.nsIProperties)
            .get('UChrm', Ci.nsIFile);
        aFile.initWithPath(path);
        var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        suConverter.charset = 'UTF-8';
        data = suConverter.ConvertFromUnicode(data);

        var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0);
        foStream.write(data, data.length);
        foStream.close();
    }

    function getFile(path) {
        let aFile;
        if (path instanceof Ci.nsIFile) {
            aFile = path;
        } else if (typeof path === "string") {
            aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            aFile.initWithPath(path);
        }
        return aFile;
    }

    function handleRelativePath(path, parentPath) {
        if (path) {
            var ffdir = parentPath ? parentPath : PathUtils.profileDir
            // windows 的目录分隔符不一样
            if (CopyCatUtils.platform === "win") {
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
})(`
@-moz-document url-prefix("chrome://browser/content/browser.x") {
#CopyCat-Btn {
    list-style-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPg0KICA8cGF0aCBkPSJNMjYuNDYwOTM4IDQuNDY2Nzk2OUMyNC42Njg4IDQuNTI1NjUwMyAyMyA1Ljk4MzQ3NjIgMjMgNy45NDUzMTI1TDIzIDE0LjcwNzAzMUMyMyAxNS4xNTgwNjUgMjMuMTg1NTI3IDE1LjU2MDU3MiAyMy4yNDIxODggMTZMMjEuNSAxNkMxNS45MzM0NjkgMTYgMTAuOTkyNzczIDE4LjgwODA1MyA4IDIzLjA2ODM1OUw4IDE5LjVDOCAxNi41MTY0MzggOS4wMDE4MzgxIDEzLjU3Mzk5MiAxMC42ODk0NTMgMTEuNDQ3MjY2QzEyLjM3NzA2OCA5LjMyMDUzODYgMTQuNjY3MzM2IDggMTcuNSA4IEEgMS41MDAxNSAxLjUwMDE1IDAgMSAwIDE3LjUgNUMxMy43MDU2NjQgNSAxMC40OTU0NzkgNi44NjU1MDc5IDguMzM5ODQzOCA5LjU4MjAzMTJDNi4xODQyMDg4IDEyLjI5ODU1NSA1IDE1Ljg1NjU2MiA1IDE5LjVMNSAzMi41IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDUuMDA3ODEyNSAzMi42Njk5MjJDNS4wOTE5ODEyIDM4LjM3NDEzIDkuMzYzMDQxNCA0My4wODM3MzEgMTQuODc1IDQzLjg3MTA5NCBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAxNS41IDQ0TDM5LjUgNDRDNDEuNDE0OTU1IDQ0IDQzIDQyLjQxNDk1NSA0MyA0MC41QzQzIDM4LjM1Nzc0IDQxLjc2MzY0MiAzNi40ODI0ODggMzkuOTU3MDMxIDM1LjU4MDA3OEwzOS45NTUwNzggMzUuNTc4MTI1QzM5LjMxNzM0OCAzNS4yNTg1MzUgMzQuMjAzNTU5IDMyLjg5MDAyMSAzNC4wMTc1NzggMjQuOTMzNTk0QzM5LjAzOTM3MSAyNC40MTYwMzYgNDMgMjAuMTU4MTg4IDQzIDE0Ljk5ODA0N0w0MyA3Ljk0NTMxMjVDNDMgNS4zMjkyMzQ0IDQwLjAzNDQyNCAzLjYxMDE0NCAzNy43NjM2NzIgNC45MDgyMDMxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM3LjQwMDM5MSA1LjE5NzI2NTZMMzQuODM3ODkxIDhMMzEuMTYwMTU2IDhMMjguNTk5NjA5IDUuMTk3MjY1NiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyOC4yMzYzMjggNC45MDgyMDMxQzI3LjY2ODUxNyA0LjU4MzYxODIgMjcuMDU4MzE2IDQuNDQ3MTc5MSAyNi40NjA5MzggNC40NjY3OTY5IHogTSAzOS41ODIwMzEgNy40NDMzNTk0QzM5LjY1MzY2MiA3LjQzNDYzNzUgMzkuNzIwNDk3IDcuNDQwODM4NyAzOS43NzUzOTEgNy40NzI2NTYyQzM5LjkxMjg4IDcuNTUyMzQ3NSA0MCA3LjcxNzM1MTYgNDAgNy45NDUzMTI1TDQwIDE0Ljk5ODA0N0M0MCAxOS4wMzcxNTUgMzYuNjQxNzA3IDIyLjI1MDg3OCAzMi41MzEyNSAyMS45ODQzNzVDMjguODMzOTc4IDIxLjc0NDYwMSAyNiAxOC40Nzk0NDggMjYgMTQuNzA3MDMxTDI2IDcuOTQ1MzEyNUMyNiA3LjUzNzAzNTkgMjYuMjk4MjMyIDcuMzc3NzQwNSAyNi42NDI1NzggNy41MDM5MDYyTDI5LjM5MjU3OCAxMC41MTE3MTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMzAuNSAxMUwzNS41IDExIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM2LjYwNzQyMiAxMC41MTE3MTlMMzkuMzU3NDIyIDcuNTAzOTA2MkMzOS40MzM5NzIgNy40NzU3MjYzIDM5LjUxMDQgNy40NTIwODEyIDM5LjU4MjAzMSA3LjQ0MzM1OTQgeiBNIDI5LjUgMTMgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTYgQSAxLjUgMS41IDAgMCAwIDI5LjUgMTMgeiBNIDM2LjUgMTMgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTYgQSAxLjUgMS41IDAgMCAwIDM2LjUgMTMgeiBNIDIzLjk3NjU2MiAxOC45Mjc3MzRDMjUuMjc0ODM3IDIxLjg0NTY2NSAyNy44MTIzMzggMjQuMTI3MiAzMS4wMTM2NzIgMjQuNzk2ODc1QzMxLjE1NzkzOSAzNC4yNDk0NzUgMzcuOTM3OTQ2IDM3LjkyMzAzNCAzOC42MTMyODEgMzguMjYxNzE5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDM4LjYxNTIzNCAzOC4yNjE3MTlDMzkuNDMzMjA4IDM4LjY2OTc5NSA0MCAzOS41MDcyNTUgNDAgNDAuNUM0MCA0MC43OTUwNDUgMzkuNzk1MDQ1IDQxIDM5LjUgNDFMMjguOTQ3MjY2IDQxQzI4Ljk3MjY1IDQwLjgzMTU5NSAyOSA0MC42NjMxMzMgMjkgNDAuNDg4MjgxQzI5IDM3Ljk1Mzg3MyAyNy4yNDc0NiAzNS44MDYzMSAyNC44OTg0MzggMzUuMTg1NTQ3QzI0LjI1MzAwMiAzMC41NzUzNDUgMjAuMjgxOTg2IDI3IDE1LjUgMjdMMTQuNSAyNyBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAxNC41IDMwTDE1LjUgMzBDMTkuMDczNTkxIDMwIDIxLjk0MDg4NSAzMi44NDAxODcgMjEuOTk0MTQxIDM2LjQwMDM5MSBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMi4xMDM1MTYgMzcuMDcwMzEyIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDIyLjExMTMyOCAzNy4wOTE3OTcgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjIuMTMyODEyIDM3LjEzODY3MiBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyMy42NDY0ODQgMzguMDEzNjcyQzI0Ljk3MjQ2NiAzOC4wODMzODYgMjYgMzkuMTQyMzY0IDI2IDQwLjQ4ODI4MUMyNiA0MC43ODgzIDI1Ljc4NzQ3IDQxIDI1LjQ4ODI4MSA0MUwxNi41IDQxQzExLjc4NzYxIDQxIDggMzcuMjEyMzkgOCAzMi41QzggMjUuMDY4MTgyIDE0LjA2ODE4MiAxOSAyMS41IDE5TDIzLjUgMTkgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMjMuOTc2NTYyIDE4LjkyNzczNCB6Ii8+DQo8L3N2Zz4=);
}
#CopyCat-Btn > .toolbarbutton {
    -moz-context-properties: fill, fill-opacity, stroke, stroke-opacity !important;
    fill: var(--lwt-toolbarbutton-icon-fill, currentColor) !important;
}
.CopyCat-Group .menuitem-iconic,
.CopyCat-Popup menugroup .menuitem-iconic {
    padding-block: 4px;
}

.CopyCat-Popup .menu-iconic > .menu-iconic-left {
    order: -1;
    -moz-box-ordinal-group: 0;
}

.CopyCat-Group > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup > .menuitem-iconic:first-child,
.CopyCat-Popup menugroup:not(.showFirstText) > .menuitem-iconic {
    padding-inline-start: 1em;
}

.CopyCat-Popup .menu-iconic > .menu-iconic-left ~ .menu-iconic-left /** 不想研究为什么会多了一个结构 */,
.CopyCat-Group:not(.showText):not(.showFirstText) > :is(menu, menuitem):not(.showText) > label,
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child) > label,
.CopyCat-Group > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menugroup > :is(menu, menuitem) > .menu-accel-container,
.CopyCat-Popup menuseparator + menuseparator,
.CopyCat-Popup .hidden {
    display: none;
}

.CopyCat-Group.showFirstText > :is(menu, menuitem):first-child,
.CopyCat-Group.showText > :is(menu, menuitem) {
    -moz-box-flex: 1;
    flex: 1;
    padding-inline-end: .5em;
}
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) {
    padding-left: 0;
    -moz-box-flex: 0;
    flex: 0;
}
.CopyCat-Group.showFirstText > :is(menu, menuitem):not(:first-child):not(.showText) > .menu-iconic-left {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
}
.CopyCat-View menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon,
.CopyCat-Popup menuitem:is([type="checkbox"], [checked="true"], [type="radio"]) > .menu-iconic-left > .menu-iconic-icon {
    display: block !important;
}
.subviewbutton.reload,
.CopyCat-Popup .menuitem-iconic.reload {
    list-style-image: url(chrome://global/skin/icons/reload.svg) !important;
}
.CopyCat-Popup .menuitem-iconic.option {
    list-style-image: url(chrome://global/skin/icons/settings.svg) !important;
}
.CopyCat-Popup menu:not(.menu-iconic),
.CopyCat-Popup menuitem:not(.menuitem-iconic) {
    padding-inline-start: 36px;
}
.CopyCat-Popup menu:not(.menu-iconic) > label {
    margin-left: 0 !important;
}
.CopyCat-Popup menu > label {
    -moz-box-flex: 1 !important;
    flex: 1 !important;
}
.CopyCat-Popup menu > label.menu-text ~ label {
    display: none;
}
#CopyCat-Popup[HideNoneDynamicItems="true"] :is(menu, menuitem, menuseparator, menugroup):not(.CopyCat-Dynamic) {
    display: none;
    visibility: collapsed;
}
}
`, (function () {
    let LANG = {
        'zh-CN': {
            "copycat-brand": "CopyCat",
            "copycat-btn-tooltip": "左键：快捷功能\n右键：管理 UC 脚本",
            "chrome-folder": "Chrome 文件夹",
            "restart-firefox": "重启 Firefox",
            "about-copycat": "关于 CopyCat",
            'check-config-file-with-line': '\n请重新检查配置文件第 %s 行',
            "modify-copycat-js": "修改 _copycat.js",
            "reload-copycat-js": "重载 _copycat.js",
            "reload-copycat-js-complete": "重载 _copycat.js 完成",
            "save-config": "保存配置",
            "please-set-editor-path": "请设置编辑器路径",
            "set global editor": "设置全局编辑器"
        }
    }
    let LOCALE;
    try {
        let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
        if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
            _locales = osPrefs.getRegionalPrefsLocales();
        else
            _locales = osPrefs.regionalPrefsLocales;
        for (let i = 0; i < _locales.length; i++) {
            if (LANG.hasOwnProperty(_locales[i])) {
                LOCALE = _locales[i];
                break;
            }
        }
    } catch (e) { }
    LOCALE = Object.keys(LANG).includes(LOCALE) ? LOCALE : "zh-CN";
    return {
        LANG: LANG[LOCALE],
        LOCALE
    };
})(), Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService), ["separator", "menuseparator"])