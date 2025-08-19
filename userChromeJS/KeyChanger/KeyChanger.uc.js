// ==UserScript==
// @name           KeyChanger.uc.js
// @author         Griever
// @namespace      http://d.hatena.ne.jp/Griever/
// @include        main
// @sandbox        true
// @description    快捷键配置脚本
// @description:en Additional shortcuts for Firefox
// @license        MIT License
// @charset        UTF-8
// @version        2025.03.29
// @note           2025.03.29 fix event.target is undefined
// @note           2024.04.13 修复 openCommand 几个问题
// @note           2023.07.27 修复 openCommand 不遵循容器设定
// @note           2023.07.16 优化 openCommand 函数
// @note           2023.06.17 修复 gBrowser.loadURI 第一个参数类型修改为 URI, Bug 1815439 - Remove useless loadURI wrapper from browser.js
// @note           2023.03.15 修复 openUILinkIn 被移除
// @note           2022.11.27 修复 gBrowser is undefined
// @note           2022.06.03 新增 getSelctionText()，修增 saveFile 不存在
// @note           0.0.2 メニューを右クリックで設定ファイルを開けるようにした
// @note           0.0.2 Meta キーを装飾キーに使えるようになったかもしれない（未テスト）
// @note           0.0.2 Windows キーを装飾キーに使えるようになったかもしれない（未テスト Firefox 17 以降）
// @note           2018.1.25.2 Firefox59+ 修复
// ==/UserScript==

// 脚本主体包裹在 IIFE (立即调用函数表达式) 中，避免污染全局作用域
// 通过参数传入一些预先处理好的函数和对象，用于处理版本兼容性问题
location.href.startsWith("chrome://browser/content/browser.x") && (function (INTERNAL_MAP, getURLSpecFromFile, _openTrustedLinkIn, syncify) {

    // true: 若无外部编辑器则使用代码片段速记器(Scratchpad) | false: 提示设置编辑器路径
    const useScraptchpad = true;

    /**
     * @class KeyChanger
     * @description 核心对象，管理所有与快捷键相关的功能
     */
    window.KeyChanger = {
        /**
         * 获取 Firefox 主版本号
         * @returns {string}
         */
        get appVersion () {
            return Services.appinfo.version.split(".")[0];
        },

        /**
         * 获取快捷键配置文件对象 (_keychanger.js)
         * 这是一个懒加载属性，第一次访问时会确定路径并检查文件是否存在
         * @returns {Ci.nsIFile}
         */
        get FILE () {
            delete this.FILE; // 确保只执行一次
            let path;
            try {
                // 尝试从 about:config 读取自定义路径
                path = this.prefs.getStringPref("FILE_PATH");
            } catch (e) {
                // 默认路径为 UChrm 目录下的 _keychanger.js
                path = '_keychanger.js';
            }
            const aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);

            if (!aFile.exists()) {
                saveFile(aFile, '//\n// KeyChanger 配置示例, 更多说明请参考 Github\n//\n\nkeys["ctrl+alt+t"] = function(win,ev){\n    gBrowser.addTab("about:config");\n};\n');
                this.alert('KeyChanger 配置文件已创建', '提示', () => this.edit(aFile));
            }
            return this.FILE = aFile;
        },

        /**
         * 获取脚本的 about:config 分支
         * @returns {Ci.nsIPrefBranch}
         */
        get prefs () {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch("keyChanger.");
        },

        isBuilding: false, // 标记是否正在构建快捷键，防止重复执行
        _selectedText: "", // 用于存储当前页面选中的文本
        KEYSETID: "keychanger-keyset", // 动态创建的 <keyset> 元素的 ID

        /**
         * 初始化事件监听器，用于捕获选中的文本
         */
        addEventListener: function () {
            (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);
        },

        /**
         * 事件处理函数
         * @param {Event} event
         */
        handleEvent: function (event) {
            switch (event.type) {
                case 'mouseup':
                    // 兼容不同 Firefox 版本获取选中内容的方式
                    if (content) {
                        this.setSelectedText(content.getSelection().toString());
                    } else {
                        try {
                            gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                                this.setSelectedText(r.selectedText);
                            });
                        } catch (e) { /* 忽略错误 */ }
                    }
                    break;
            }
        },

        /**
         * 获取存储的选中文字
         * @returns {string}
         */
        getSelectedText: function () {
            return this._selectedText || "";
        },

        /**
         * 设置存储的选中文字
         * @param {string} text
         */
        setSelectedText: function (text) {
            this._selectedText = text;
        },

        /**
         * 创建并应用快捷键集合
         * @param {boolean} isAlert - 是否在完成后弹窗提示
         */
        makeKeyset: function (isAlert) {
            this.isBuilding = true;
            const s = new Date();

            const keys = this.makeKeys();
            if (!keys) {
                this.isBuilding = false;
                return this.alert('KeyChanger', '配置文件加载错误。');
            }

            // 移除旧的 keyset
            $R(document.getElementById(this.KEYSETID));

            // 创建新的 keyset 并插入快捷键
            const keyset = $C(document, "keyset", { id: this.KEYSETID });
            keyset.appendChild(keys);

            // 为确保快捷键优先级，将所有 keyset 重新插入到 DOM 中
            const df = document.createDocumentFragment();
            Array.from(document.getElementsByTagName('keyset')).forEach(elem => df.appendChild(elem));

            const insPos = document.getElementById('mainPopupSet');
            insPos.parentNode.insertBefore(keyset, insPos);
            insPos.parentNode.insertBefore(df, insPos); // 将原有的 keyset 插回

            const e = new Date() - s;
            if (isAlert) {
                this.alert('KeyChanger: 配置已重载', `耗时: ${e}ms`);
            }
            setTimeout(() => { this.isBuilding = false; }, 100);
        },

        /**
         * 解析配置文件，生成 XUL <key> 元素
         * @returns {DocumentFragment|null}
         */
        makeKeys: function () {
            const str = loadText(this.FILE);
            if (!str) return null;

            // 在沙箱中执行配置文件，以隔离作用域并获取配置对象
            const sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
            const keys = Cu.evalInSandbox('var keys = {};\n' + str + ';\nkeys;', sandbox);
            if (!keys) return null;

            const dFrag = document.createDocumentFragment();

            Object.keys(keys).forEach(n => {
                const keyString = n.toUpperCase().split("+");
                let modifiers = "", key, keycode;

                // 解析修饰键和主键
                keyString.forEach(k => {
                    switch (k) {
                        case "CTRL": case "CONTROL": case "ACCEL": modifiers += "accel,"; break;
                        case "SHIFT": modifiers += "shift,"; break;
                        case "ALT": case "OPTION": modifiers += "alt,"; break;
                        case "META": case "COMMAND": modifiers += "meta,"; break;
                        case "OS": case "WIN": case "WINDOWS": case "HYPER": case "SUPER": modifiers += "os,"; break;
                        case "": key = "+"; break; // 处理 "++" 这种情况
                        // 特殊按键名转换为 Keycode
                        case "BACKSPACE": case "BKSP": case "BS": keycode = "VK_BACK"; break;
                        case "RET": case "ENTER": keycode = "VK_RETURN"; break;
                        case "ESC": keycode = "VK_ESCAPE"; break;
                        case "PAGEUP": case "PAGE UP": case "PGUP": case "PUP": keycode = "VK_PAGE_UP"; break;
                        case "PAGEDOWN": case "PAGE DOWN": case "PGDN": case "PDN": keycode = "VK_PAGE_DOWN"; break;
                        case "TOP": keycode = "VK_UP"; break;

                        case "BOTTOM": keycode = "VK_DOWN"; break;
                        case "INS": keycode = "VK_INSERT"; break;
                        case "DEL": keycode = "VK_DELETE"; break;
                        default:
                            if (k.length === 1) key = k; // 单字符按键
                            else if (!k.startsWith("VK_")) keycode = "VK_" + k; // 非 VK_ 前缀的转为 Keycode
                            else keycode = k; // 已经是 Keycode
                            break;
                    }
                });

                const elem = document.createXULElement('key');
                if (modifiers) elem.setAttribute('modifiers', modifiers.slice(0, -1));
                if (key) elem.setAttribute('key', key);
                else if (keycode) elem.setAttribute('keycode', keycode);

                const cmd = keys[n];
                switch (typeof cmd) {
                    case 'object': // 处理对象形式的命令，通常用于内置命令
                        Object.keys(cmd).forEach(function (a) {
                            if (a === 'oncommand' && cmd[a] === "internal") {
                                elem.addEventListener('command', (event) => KeyChanger.internalCommand(event));
                                delete cmd[a];
                            } else {
                                elem.setAttribute(a, cmd[a]);
                            }
                        });
                        break;
                    default: // 处理函数或字符串形式的命令
                        // 安全提示: 下方的 eval 会执行配置文件中定义的代码。请确保配置文件来源可靠。
                        // 这是脚本的核心功能，允许用户高度自定义快捷键行为。
                        elem.dataset.oncommand = typeof cmd === "function" ? cmd.toString() : cmd;
                        elem.addEventListener('command', (event) => {
                            // event.target 在某些情况下可能为 undefined，使用 event.currentTarget 更稳定
                            const commandTarget = event.currentTarget || event.target;
                            Cu.evalInSandbox('(' + commandTarget.dataset.oncommand + ')(window, event)', KeyChanger.sb);
                        });
                }
                dFrag.appendChild(elem);
            });
            return dFrag;
        },

        /**
         * 在工具菜单中创建脚本控制菜单项
         */
        createMenuitem: function () {
            const menuitem = $C(document, 'menuitem', {
                id: 'toolsbar_KeyChanger_rebuild',
                label: 'KeyChanger',
                tooltiptext: '左键：重载配置\n右键：编辑配置'
            });

            menuitem.addEventListener('command', () => {
                setTimeout(() => this.makeKeyset(true), 10);
            });
            menuitem.addEventListener('click', (event) => {
                if (event.button == 2) {
                    event.preventDefault();
                    this.edit(this.FILE);
                }
            });

            const insPos = document.getElementById('devToolsSeparator');
            if (insPos) {
                insPos.parentNode.insertBefore(menuitem, insPos);
            }
        },

        /**
         * 执行内置命令
         * @param {Event} event
         */
        internalCommand: function (event) {
            const commandTarget = event.currentTarget || event.target;
            const params = commandTarget.getAttribute('params');
            const cmd = this.internalParamsParse(params);
            if (typeof cmd === "function") {
                cmd.call(this, event);
            } else {
                this.log("内置命令未找到或不完整:", params);
            }
        },

        /**
         * 解析内置命令参数
         * @param {string} params - 如 "tab,close,current"
         * @returns {Function|string}
         */
        internalParamsParse: function (params) {
            const args = params.split(',');
            let cmd = INTERNAL_MAP;
            for (let i = 0; i < args.length; i++) {
                if (cmd.hasOwnProperty(args[i])) {
                    cmd = cmd[args[i]];
                } else {
                    return "";
                }
            }
            return cmd;
        },

        /**
         * 打开链接的通用函数，处理不同协议和打开方式
         * @param {string} url - 要打开的 URL
         * @param {string} aWhere - 打开位置 (tab, window, current)
         * @param {object} aAllowThirdPartyFixup - 附加参数
         * @param {*} aPostData - POST 数据
         * @param {*} aReferrerInfo - 引用信息
         */
        openCommand: function (url, aWhere, aAllowThirdPartyFixup = {}, aPostData, aReferrerInfo) {
            const isJavaScriptURL = url.startsWith("javascript:");
            const isWebURL = /^(f|ht)tps?:/.test(url);
            const where = aWhere || 'tab';

            const fixup = { ...aAllowThirdPartyFixup };

            // 如果是网页且未指定容器，则继承当前标签的容器
            if (!fixup.userContextId && isWebURL) {
                fixup.userContextId = gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.getAttribute("userContextId") || null;
            }

            if (aPostData) fixup.postData = aPostData;
            if (aReferrerInfo) fixup.referrerInfo = aReferrerInfo;

            // 设置触发主体 (triggeringPrincipal)，这是现代 Firefox 的安全要求
            fixup.triggeringPrincipal = (() => {
                if (where === 'current' && !isJavaScriptURL) {
                    return gBrowser.selectedBrowser.contentPrincipal;
                }
                const userContextId = isWebURL ? fixup.userContextId : null;
                return isWebURL
                    ? Services.scriptSecurityManager.createNullPrincipal({ userContextId })
                    : Services.scriptSecurityManager.getSystemPrincipal();
            })();

            if (isJavaScriptURL) {
                // javascript: 协议特殊处理
                _openTrustedLinkIn(url, 'current', {
                    allowPopups: true,
                    inBackground: fixup.inBackground || false,
                    allowInheritPrincipal: true,
                    private: PrivateBrowsingUtils.isWindowPrivate(window),
                    userContextId: fixup.userContextId,
                });
            } else if (where) {
                _openTrustedLinkIn(url, where, fixup);
            } else {
                // 默认情况
                openUILink(url, {}, {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                });
            }
        },

        /**
         * 使用配置的外部编辑器打开文件
         * @param {Ci.nsIFile} aFile - 文件对象
         * @param {number} aLineNumber - 打开后跳转的行号
         */
        edit: function (aFile, aLineNumber) {
            if (this.isBuilding) return;
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;

            let editor;
            try {
                // 从 about:config 获取编辑器路径
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) { }

            if (!editor || !editor.exists()) {
                if (useScraptchpad && this.appVersion <= 72) {
                    // 旧版 Firefox 可回退到代码片段速记器
                    this.openScriptInScratchpad(window, aFile);
                    return;
                } else {
                    // 提示用户设置编辑器
                    const setPath = () => {
                        const fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
                            ? window.browsingContext
                            : window, "设置全局脚本编辑器", fp.modeOpen);
                        fp.appendFilters(Ci.nsIFilePicker.filterApps);

                        const file = syncify(() => new Promise(resolve => {
                            if (typeof fp.show !== 'undefined') {
                                resolve(fp.show() === fp.returnOK ? fp.file : null);
                            } else {
                                fp.open(res => resolve(res === Ci.nsIFilePicker.returnOK ? fp.file : null));
                            }
                        }));

                        if (file) {
                            Services.prefs.setCharPref("view_source.editor.path", file.path);
                            // 再次尝试打开
                            this.edit(aFile, aLineNumber);
                        } else {
                            this.alert("未设置编辑器的路径！", "提示");
                        }
                    };
                    this.alert("请先设置编辑器的路径！", "提示");
                    setPath();
                    return;
                }
            }

            const aURL = getURLSpecFromFile(aFile);
            gViewSourceUtils.openInExternalEditor({ URL: aURL, lineNumber: aLineNumber }, null, null, aLineNumber, null);
        },

        /**
         * @deprecated 在代码片段速记器中打开脚本 (仅适用于 Firefox 72 及更早版本)
         */
        openScriptInScratchpad: function (parentWindow, file) {
            this.alert("代码片段速记器 (Scratchpad) 已被废弃，请设置外部编辑器。");
            const spWin = window.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
            spWin.addEventListener("load", function spWinLoaded () {
                spWin.removeEventListener("load", spWinLoaded, false);
                const Scratchpad = spWin.Scratchpad;
                Scratchpad.setFilename(file.path);
                Scratchpad.addObserver({
                    onReady: function () {
                        Scratchpad.removeObserver(this);
                        Scratchpad.importFromFile.call(Scratchpad, file);
                    }
                });
            }, false);
        },

        /**
         * 执行外部程序
         * 安全警告：此功能非常强大，但也非常危险。请确保执行的程序是可信的。
         * @param {string} path - 程序路径
         * @param {string|Array} arg - 程序参数
         */
        exec: function (path, arg) {
            const file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            const process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                const args = (typeof arg === 'string') ? arg.split(/\s+/) : [arg];
                file.initWithPath(path);
                process.init(file);
                process.run(false, args, args.length);
            } catch (e) {
                this.log("执行外部程序失败:", e);
            }
        },

        /**
         * 显示桌面通知
         * @param {string} aMsg - 消息内容
         * @param {string} aTitle - 消息标题
         * @param {Function} aCallback - 点击消息后的回调函数
         */
        alert: function (aMsg, aTitle, aCallback) {
            const callback = aCallback ? {
                observe: function (subject, topic, data) {
                    if ("alertclickcallback" === topic) {
                        aCallback.call(null);
                    }
                }
            } : null;
            const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            alertsService.showAlertNotification(
                "chrome://global/skin/icons/information-32.png", aTitle || "KeyChanger",
                aMsg + "", !!callback, "", callback
            );
        },

        /**
         * 在浏览器控制台输出日志
         * @param {...any} args - 要输出的内容
         */
        log: function (...args) {
            Services.console.logStringMessage("[KeyChanger] " + args.join(' '));
        },

        /**
         * 脚本初始化入口
         */
        init: function () {
            let sb = window.userChrome_js?.sb;
            if (!sb) {
                sb = Cu.Sandbox(window, {
                    sandboxPrototype: window,
                    sameZoneAs: window,
                });
                /* toSource() is not available in sandbox */
                Cu.evalInSandbox(`
                    Function.prototype.toSource = window.Function.prototype.toSource;
                    Object.defineProperty(Function.prototype, "toSource", {enumerable : false})
                    Object.prototype.toSource = window.Object.prototype.toSource;
                    Object.defineProperty(Object.prototype, "toSource", {enumerable : false})
                    Array.prototype.toSource = window.Array.prototype.toSource;
                    Object.defineProperty(Array.prototype, "toSource", {enumerable : false})
                `, sb);
                window.addEventListener("unload", () => {
                    setTimeout(() => {
                        Cu.nukeSandbox(sb);
                    }, 0);
                }, { once: true });
            }
            this.sb = sb;
            this.createMenuitem();
            this.makeKeyset();
            this.addEventListener();
        }
    };

    // =================================================================================
    // 辅助函数
    // =================================================================================

    /**
     * 保存文本数据到文件
     * @param {Ci.nsIFile|string} fileOrName - nsIFile 对象或相对于 UChrm 目录的文件名
     * @param {string} data - 要写入的字符串数据
     */
    function saveFile (fileOrName, data) {
        let file;
        if (typeof fileOrName === "string") {
            file = Services.dirsvc.get('UChrm', Ci.nsIFile);
            file.appendRelativePath(fileOrName);
        } else {
            file = fileOrName;
        }

        const suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        suConverter.charset = 'UTF-8';
        data = suConverter.ConvertFromUnicode(data);

        const foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0); // 写入、创建、截断
        foStream.write(data, data.length);
        foStream.close();
    }

    /**
     * 从文件读取文本内容
     * @param {Ci.nsIFile} aFile - nsIFile 文件对象
     * @returns {string} - 文件内容
     */
    function loadText (aFile) {
        if (!aFile.exists()) return "";
        const fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        const sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(aFile, -1, 0, 0);
        sstream.init(fstream);

        let data = sstream.read(sstream.available());
        try {
            // 尝试将数据从 UTF-8 字节流解码为 JS 字符串
            data = decodeURIComponent(escape(data));
        } catch (e) {
            console.error("KeyChanger: loadText 解码失败", e);
        }
        sstream.close();
        fstream.close();
        return data;
    }

    /**
     * 创建一个 XUL 元素并设置属性 (Create a XUL element)
     * @param {Document} aDoc - 文档对象
     * @param {string} tag - 元素标签名
     * @param {object} attrs - 属性对象
     * @returns {Element}
     */
    function $C (aDoc, tag, attrs) {
        const el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs);
    }

    /**
     * 为元素设置属性 (Apply attributes)
     * @param {Element} el - 目标元素
     * @param {object} obj - 属性对象
     * @returns {Element}
     */
    function $A (el, obj) {
        if (obj) {
            for (const [key, val] of Object.entries(obj)) {
                el.setAttribute(key, val);
            }
        }
        return el;
    }

    /**
     * 从 DOM 中移除一个元素 (Remove element)
     * @param {Element} el - 要移除的元素
     */
    function $R (el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    // =================================================================================
    // 初始化脚本
    // =================================================================================
    if (gBrowserInit.delayedStartupFinished) {
        window.KeyChanger.init();
    } else {
        const delayedListener = (subject, topic) => {
            if (topic === "browser-delayed-startup-finished" && subject === window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.KeyChanger.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

})({
    // ---------------------------------------------------------------------------------
    // 内置命令映射 (INTERNAL_MAP)
    // 在配置文件中可以通过 { oncommand: "internal", params: "tab,close,current" } 方式调用
    // ---------------------------------------------------------------------------------
    tab: {
        close: {
            current: function () { gBrowser.removeTab(gBrowser.selectedTab); },
            all: function () { gBrowser.removeTabs(gBrowser.tabs); },
            other: function () { gBrowser.removeAllTabsBut(gBrowser.selectedTab); },
            toEnd: function () { gBrowser.removeTabsToTheEndFrom(gBrowser.selectedTab); },
            toStart: function () { gBrowser.removeTabsToTheStartFrom(gBrowser.selectedTab); },
        },
        pin: {
            current: function () { gBrowser.pinTab(gBrowser.selectedTab); },
            all: function () { Array.from(gBrowser.tabs).forEach(t => gBrowser.pinTab(t)); }
        },
        unpin: {
            current: function () { gBrowser.unpinTab(gBrowser.selectedTab); },
            all: function () { Array.from(gBrowser.tabs).forEach(t => gBrowser.unpinTab(t)); }
        },
        "toggle-pin": {
            current: function () {
                const tab = gBrowser.selectedTab;
                if (tab.pinned) gBrowser.unpinTab(tab);
                else gBrowser.pinTab(tab);
            }
        },
        undo: function () {
            try {
                undoCloseTab();
            } catch (ex) {
                $('History:UndoCloseTab').doCommand();
            }
        },
        prev: function () { gBrowser.tabContainer.advanceSelectedTab(-1, true); },
        next: function () { gBrowser.tabContainer.advanceSelectedTab(1, true); },
        duplicate: function () { duplicateTabIn(gBrowser.selectedTab, 'tab'); }
    }
}, (function () {
    // ---------------------------------------------------------------------------------
    // 兼容性辅助函数：getURLSpecFromFile
    // 修复 Firefox 92+ Bug 1723723，getURLSpecFromFile 被 getURLSpecFromActualFile 替代
    // ---------------------------------------------------------------------------------
    const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
    return "getURLSpecFromFile" in fph
        ? f => fph.getURLSpecFromFile(f)
        : f => fph.getURLSpecFromActualFile(f);
})(), (() => {
    // ---------------------------------------------------------------------------------
    // 兼容性辅助函数：_openTrustedLinkIn
    // 修复 Firefox 117+ Bug 1817443，全局函数 openUILinkIn 被移除
    // ---------------------------------------------------------------------------------
    return "openTrustedLinkIn" in window
        ? (url, where, params) => openTrustedLinkIn(url, where, params)
        : (url, where, params) => openUILinkIn(url, where, params);
})(), function (promiser) {
    // promiser 是一个无参函数，返回 Promise
    // 例如：() => OpenWithHelper.selectDirectory("choose-directory")
    let isDone = false;            // 标记 Promise 是否已经完成
    let result;                    // 存储成功时的结果
    let error;                     // 存储错误信息
    const threadManager = Cc["@mozilla.org/thread-manager;1"].getService();
    const mainThread = threadManager.mainThread;
    // 调用传入的异步函数，并将结果/错误分别存储
    promiser()
        .then(res => {
            result = res;
            isDone = true;
        })
        .catch(err => {
            error = err;
            isDone = true;
        });
    // 轮询主线程事件，阻塞直到 Promise 执行完毕
    while (!isDone) {
        mainThread.processNextEvent(true);
    }
    // 如果有错误，则抛出错误
    if (error) {
        throw error;
    }
    // 返回结果
    return result;
});
