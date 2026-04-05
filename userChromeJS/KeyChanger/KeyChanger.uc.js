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
// @note           2026.04.05 统一命令调用契约(event / this=window)，新增通用 modal
// @note           2026.03.04 整理代码
// @note           2026.01.13 Bug 1369833 Remove `alertsService.showAlertNotification` call once Firefox 147
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
    const useScratchpad = true;

    const AlertNotification = Components.Constructor(
        "@mozilla.org/alert-notification;1",
        "nsIAlertNotification",
        "initWithObject"
    );

    const AlertImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwMDAwMDAiPjxkZWZzPjxwYXRoIGlkPSJmZU5vdGljZVB1c2gwIiBkPSJNMTcgMTFhNCA0IDAgMSAxIDAtOGE0IDQgMCAwIDEgMCA4Wk01IDVoNnYySDV2MTJoMTJ2LTZoMnY2YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjdhMiAyIDAgMCAxIDItMloiLz48L2RlZnM+PGcgaWQ9ImZlTm90aWNlUHVzaDEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiPjxnIGlkPSJmZU5vdGljZVB1c2gyIj48bWFzayBpZD0iZmVOb3RpY2VQdXNoMyIgZmlsbD0iIzAwMDAwMCI+PHVzZSBocmVmPSIjZmVOb3RpY2VQdXNoMCIvPjwvbWFzaz48dXNlIGlkPSJmZU5vdGljZVB1c2g0IiBmaWxsPSIjMDAwMDAwIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGhyZWY9IiNmZU5vdGljZVB1c2gwIi8+PC9nPjwvZz48L3N2Zz4=';

    const versionGE = (v) => {
        return Services.vc.compare(Services.appinfo.version, v) >= 0;
    }

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
        commandSandbox: null, // 保存当前配置文件的执行上下文，供快捷键命令复用
        activeModal: null, // 当前打开的通用弹窗

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
                    if (typeof content !== "undefined" && content && content.getSelection) {
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

        // 兼容旧配置中的拼写错误接口。
        getSelctionText: function () {
            return this.getSelectedText();
        },

        getSelectionText: function () {
            return this.getSelectedText();
        },

        /**
         * 创建一个可复用的快捷键沙箱
         * @returns {Object}
         */
        createSandbox: function () {
            const sandbox = Cu.Sandbox(window, {
                sandboxPrototype: window,
                sameZoneAs: window,
                freezeBuiltins: false
            });
            /* toSource() is not available in sandbox */
            Cu.evalInSandbox(`
                Function.prototype.toSource = window.Function.prototype.toSource;
                Object.defineProperty(Function.prototype, "toSource", { enumerable: false });
                Object.prototype.toSource = window.Object.prototype.toSource;
                Object.defineProperty(Object.prototype, "toSource", { enumerable: false });
                Array.prototype.toSource = window.Array.prototype.toSource;
                Object.defineProperty(Array.prototype, "toSource", { enumerable: false });
            `, sandbox);
            return sandbox;
        },

        destroySandbox: function (sandbox) {
            if (!sandbox) return;
            try {
                Cu.nukeSandbox(sandbox);
            } catch (ex) { }
        },

        replaceCommandSandbox: function (sandbox) {
            const previousSandbox = this.commandSandbox;
            this.commandSandbox = sandbox;
            if (previousSandbox && previousSandbox !== sandbox) {
                this.destroySandbox(previousSandbox);
            }
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

            // 在专用沙箱中执行配置文件，保留配置里的辅助函数与共享变量
            const sandbox = this.createSandbox();
            try {
                const keys = Cu.evalInSandbox(
                    'var keys = this.__keyChangerKeys = {};\n' + str + ';\nthis.__keyChangerKeys;',
                    sandbox
                );
                if (!keys) {
                    this.destroySandbox(sandbox);
                    return null;
                }

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
                    if (cmd && typeof cmd === 'object') { // 处理对象形式的命令，通常用于内置命令
                        Object.keys(cmd).forEach(function (a) {
                            if (a === 'oncommand' && cmd[a] === "internal") {
                                elem.addEventListener('command', (event) => KeyChanger.internalCommand(event));
                                delete cmd[a];
                            } else {
                                elem.setAttribute(a, cmd[a]);
                            }
                        });
                    } else { // 处理函数或字符串形式的命令
                        // 命令按名称回查到当前配置沙箱中执行，避免丢失 helper 和共享变量。
                        elem.dataset.commandType = typeof cmd === "function" ? "function" : "script";
                        elem.dataset.commandName = n;
                        elem.addEventListener('command', (event) => {
                            // event.target 在某些情况下可能为 undefined，使用 event.currentTarget 更稳定
                            const commandTarget = event.currentTarget || event.target;
                            KeyChanger.executeCommand(
                                commandTarget.dataset.commandName,
                                event,
                                commandTarget.dataset.commandType
                            );
                        });
                    }
                    dFrag.appendChild(elem);
                });
                this.replaceCommandSandbox(sandbox);
                return dFrag;
            } catch (e) {
                this.destroySandbox(sandbox);
                this.log("快捷键配置解析失败:", e);
                return null;
            }
        },

        /**
         * 在工具菜单中创建脚本控制菜单项
         */
        createMenuitem: function () {
            if (document.getElementById('toolsbar_KeyChanger_rebuild')) return;

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
            const params = commandTarget && commandTarget.getAttribute
                ? commandTarget.getAttribute('params')
                : "";
            if (!params) {
                this.log("内置命令参数为空");
                return;
            }
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
            if (!params || typeof params !== "string") {
                return "";
            }

            const args = params.split(',').map(s => s.trim()).filter(Boolean);
            if (!args.length) {
                return "";
            }

            let cmd = INTERNAL_MAP;
            for (let i = 0; i < args.length; i++) {
                if (cmd && Object.prototype.hasOwnProperty.call(cmd, args[i])) {
                    cmd = cmd[args[i]];
                } else {
                    return "";
                }
            }
            return cmd;
        },

        /**
         * 执行配置文件中定义的快捷键命令
         * 函数命令按 this === window、首参为 event 的约定执行；
         * 字符串命令作为脚本执行，并显式暴露 event 全局变量。
         * @param {string} commandName
         * @param {Event} event
         * @param {string} commandType
         */
        executeCommand: function (commandName, event, commandType = "script") {
            if (!commandName) {
                this.log("快捷键命令为空");
                return;
            }

            const sandbox = this.commandSandbox;
            if (!sandbox) {
                this.log("快捷键配置沙箱尚未初始化");
                return;
            }

            const commandKey = JSON.stringify(commandName);
            sandbox.event = event;
            try {
                if (commandType === "function") {
                    Cu.evalInSandbox(`this.__keyChangerKeys[${commandKey}].call(window, event);`, sandbox);
                } else {
                    Cu.evalInSandbox(`eval(this.__keyChangerKeys[${commandKey}]);`, sandbox);
                }
            } catch (e) {
                this.log("快捷键命令执行失败:", e);
            } finally {
                try {
                    delete sandbox.event;
                } catch (ex) {
                    sandbox.event = undefined;
                }
            }
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
            if (!url || typeof url !== "string") {
                this.log("openCommand 缺少有效 URL");
                return;
            }

            const isJavaScriptURL = url.startsWith("javascript:");
            const isWebURL = /^(f|ht)tps?:/.test(url);
            const where = aWhere || 'tab';

            const fixup = aAllowThirdPartyFixup && typeof aAllowThirdPartyFixup === "object"
                ? { ...aAllowThirdPartyFixup }
                : {};

            // 如果是网页且未指定容器，则继承当前标签的容器
            if (!fixup.userContextId && isWebURL) {
                fixup.userContextId = gBrowser.selectedBrowser.contentPrincipal.userContextId
                    || gBrowser.selectedBrowser.getAttribute("userContextId")
                    || null;
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
                return;
            }

            _openTrustedLinkIn(url, where, fixup);
        },

        /**
         * 兼容旧配置中对 loadURI 的调用
         * @param {string} url
         * @param {string} where
         * @param {object} params
         */
        loadURI: function (url, where = "current", params = {}) {
            this.openCommand(url, where, params);
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
                if (useScratchpad && this.appVersion <= 72) {
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
                let args = [];
                if (typeof arg === 'string') {
                    const trimmedArg = arg.trim();
                    args = trimmedArg ? trimmedArg.split(/\s+/) : [];
                } else if (Array.isArray(arg)) {
                    args = arg.map(v => String(v));
                } else if (arg !== undefined && arg !== null) {
                    args = [String(arg)];
                }
                file.initWithPath(path);
                process.init(file);
                process.run(false, args, args.length);
            } catch (e) {
                this.log("执行外部程序失败:", e);
            }
        },

        closeModal: function () {
            const modal = this.activeModal;
            if (!modal) return;
            this.activeModal = null;
            try {
                modal.close();
            } catch (e) {
                this.log("关闭弹窗失败:", e);
            }
        },

        /**
         * 显示一个可复用的通用弹窗壳
         * @param {object} options
         * @returns {object|null}
         */
        showModal: function (options = {}) {
            const modalOptions = options && typeof options === "object" ? options : {};
            const modalWindow = modalOptions.window || window;
            const doc = modalWindow?.document;
            if (!doc || !doc.documentElement) {
                this.log("showModal 缺少可用窗口");
                return null;
            }

            this.closeModal();

            const width = typeof modalOptions.width === "number"
                ? `${modalOptions.width}px`
                : (modalOptions.width || "420px");
            const applyStyles = (node, styles) => {
                if (styles) {
                    Object.assign(node.style, styles);
                }
                return node;
            };
            const createElement = (tag, styles, props) => {
                const node = doc.createElement(tag);
                applyStyles(node, styles);
                if (props) {
                    for (const [key, value] of Object.entries(props)) {
                        if (key === "dataset" && value && typeof value === "object") {
                            Object.assign(node.dataset, value);
                        } else if (key === "attributes" && value && typeof value === "object") {
                            for (const [attr, attrValue] of Object.entries(value)) {
                                node.setAttribute(attr, attrValue);
                            }
                        } else if (key === "textContent") {
                            node.textContent = value;
                        } else {
                            node[key] = value;
                        }
                    }
                }
                return node;
            };

            const overlay = createElement("div", {
                position: "fixed",
                inset: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                background: "rgba(15, 23, 42, 0.42)",
                zIndex: "2147483647",
                fontFamily: "\"Segoe UI\", \"Microsoft YaHei UI\", sans-serif"
            }, {
                id: modalOptions.id || "keychanger-modal"
            });
            const panel = createElement("div", {
                width,
                maxWidth: "calc(100vw - 32px)",
                background: "#ffffff",
                border: "1px solid #d8dee9",
                borderRadius: "12px",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
                color: "#1f2937",
                overflow: "hidden"
            });
            const header = createElement("div", {
                padding: "16px 18px 0"
            });
            const title = createElement("div", {
                fontSize: "18px",
                fontWeight: "700",
                lineHeight: "1.4"
            }, {
                textContent: modalOptions.title || "KeyChanger"
            });
            const subtitle = createElement("div", {
                marginTop: "6px",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "#6b7280",
                display: modalOptions.subtitle ? "" : "none"
            }, {
                textContent: modalOptions.subtitle || ""
            });
            const body = createElement("div", {
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
            });
            const actions = createElement("div", {
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "0 18px 18px"
            });
            const cancelButton = createElement("button", {
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                cursor: "pointer",
                fontSize: "13px"
            }, {
                type: "button",
                textContent: modalOptions.cancelText || "取消"
            });
            const confirmButton = createElement("button", {
                padding: "8px 14px",
                borderRadius: "10px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600"
            }, {
                type: "button",
                textContent: modalOptions.confirmText || "确定"
            });

            let isClosed = false;
            const close = () => {
                if (isClosed) return;
                isClosed = true;
                overlay.removeEventListener("click", onOverlayClick);
                doc.removeEventListener("keydown", onKeyDown, true);
                overlay.remove();
                if (this.activeModal?.overlay === overlay) {
                    this.activeModal = null;
                }
            };
            const api = {
                window: modalWindow,
                document: doc,
                overlay,
                panel,
                body,
                confirmButton,
                cancelButton,
                close: () => close(),
                submit: () => handleConfirm(),
                createElement,
                setStyles: applyStyles
            };
            const finishConfirm = (result) => {
                if (result === false) {
                    return false;
                }
                close();
                return true;
            };
            const handleConfirm = () => {
                try {
                    if (typeof modalOptions.onConfirm !== "function") {
                        close();
                        return;
                    }
                    const result = modalOptions.onConfirm(api);
                    if (result && typeof result.then === "function") {
                        result.then(finishConfirm).catch((e) => {
                            this.log("弹窗确认失败:", e);
                        });
                        return;
                    }
                    finishConfirm(result);
                } catch (e) {
                    this.log("弹窗确认失败:", e);
                }
            };
            const onOverlayClick = (event) => {
                if (event.target === overlay) {
                    close();
                }
            };
            const onKeyDown = (event) => {
                if (isClosed) return;
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }
            };

            try {
                if (typeof modalOptions.buildBody === "function") {
                    modalOptions.buildBody(body, api);
                }
            } catch (e) {
                this.log("构建弹窗内容失败:", e);
                return null;
            }

            cancelButton.addEventListener("click", () => close());
            confirmButton.addEventListener("click", () => handleConfirm());
            overlay.addEventListener("click", onOverlayClick);
            doc.addEventListener("keydown", onKeyDown, true);

            header.appendChild(title);
            header.appendChild(subtitle);
            actions.appendChild(cancelButton);
            actions.appendChild(confirmButton);
            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(actions);
            overlay.appendChild(panel);
            doc.documentElement.appendChild(overlay);

            this.activeModal = {
                window: modalWindow,
                overlay,
                close
            };

            if (typeof modalOptions.onMount === "function") {
                modalWindow.setTimeout(() => {
                    if (!isClosed) {
                        try {
                            modalOptions.onMount(api);
                        } catch (e) {
                            this.log("弹窗挂载回调失败:", e);
                        }
                    }
                }, 0);
            }

            return api;
        },

        /**
         * 显示桌面通知
         *
         * 【兼容两种调用方式】
         *
         * 1️⃣ 旧用法（保持不变）：
         * alert(aMsg, aTitle, aCallback)
         *
         * @param {string} aMsg
         *        消息内容
         * @param {string} [aTitle]
         *        消息标题
         * @param {Function} [aCallback]
         *        点击消息后的回调函数
         *
         * 2️⃣ 新用法（Object 参数）：
         * alert(aAlertObject, aCallback)
         *
         * @param {Object} aAlertObject
         *        通知配置对象
         * @param {string} [aAlertObject.title]
         *        消息标题（默认："KeyChanger"）
         * @param {string} aAlertObject.text
         *        消息内容
         * @param {boolean} [aAlertObject.textClickable]
         *        消息内容是否可点击（默认：false）
         * @param {string} [aAlertObject.imageURL]
         *        通知图标 URL
         * @param {Function} [aCallback]
         *        点击消息后的回调函数
         */
        alert: function (aMsg, aTitle, aCallback) {
            let alertOptions = {};
            let callback = null;

            // === 新模式：alert(aAlertObject, aCallback)
            if (typeof aMsg === 'object' && aMsg !== null) {
                alertOptions = {
                    title: aMsg.title || "KeyChanger",
                    text: aMsg.text + "",
                    textClickable: !!aMsg.textClickable,
                    imageURL: aMsg.imageURL || AlertImage,
                };
                callback = aTitle; // 第二个参数是 callback
            }
            // === 旧模式：alert(aMsg, aTitle, aCallback)
            else {
                alertOptions = {
                    title: aTitle || "KeyChanger",
                    text: aMsg + "",
                    textClickable: !!aCallback,
                    imageURL: AlertImage,
                };
                callback = aCallback;
            }

            const callbackObject = callback
                ? {
                    observe: function (subject, topic, data) {
                        if (topic === "alertclickcallback") {
                            callback.call(null);
                        }
                    },
                }
                : null;

            const alertsService = Cc["@mozilla.org/alerts-service;1"]
                .getService(Ci.nsIAlertsService);

            if (versionGE("147a1")) {
                let alert = new AlertNotification({
                    imageURL: alertOptions.imageURL,
                    title: alertOptions.title,
                    text: alertOptions.text,
                    textClickable: alertOptions.textClickable,
                });

                alertsService.showAlert(
                    alert,
                    callbackObject && callbackObject.observe
                        ? callbackObject.observe
                        : null
                );
            } else {
                alertsService.showAlertNotification(
                    alertOptions.imageURL,
                    alertOptions.title,
                    alertOptions.text,
                    alertOptions.textClickable,
                    "",
                    callbackObject
                );
            }
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
                sb = this.createSandbox();
                window.addEventListener("unload", () => {
                    setTimeout(() => {
                        Cu.nukeSandbox(sb);
                    }, 0);
                }, { once: true });
            }
            this.sb = sb;
            window.addEventListener("unload", () => {
                this.closeModal();
                const sandbox = this.commandSandbox;
                this.commandSandbox = null;
                this.destroySandbox(sandbox);
            }, { once: true });
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
        const cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
        let data = "";
        try {
            fstream.init(aFile, -1, 0, 0);
            cstream.init(fstream, "UTF-8", 0, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

            const str = {};
            while (cstream.readString(0xffffffff, str) !== 0) {
                data += str.value;
            }
        } catch (e) {
            Services.console.logStringMessage("[KeyChanger] loadText 解码失败: " + e);
        } finally {
            try {
                cstream.close();
            } catch (ex) {}
            try {
                fstream.close();
            } catch (ex) {}
        }
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
