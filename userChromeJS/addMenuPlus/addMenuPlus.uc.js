// ==UserScript==
// @name           addMenuPlus.uc.js
// @description    通过配置文件增加修改菜单，修复版
// @namespace      http://d.hatena.ne.jp/Griever/
// @author         Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 57
// @charset        UTF-8
// @version        0.1.3
// @startup        window.addMenu.init();
// @shutdown       window.addMenu.destroy();
// @config         window.addMenu.edit(addMenu.FILE);
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @ohomepageURL   https://github.com/ywzhaiqi/userChromeJS/tree/master/addmenuPlus
// @oohomepageURL  https://github.com/Griever/userChromeJS/tree/master/addMenu
// @reviewURL      http://bbs.kafan.cn/thread-1554431-1-1.html
// @downloadURL    https://github.com/ywzhaiqi/userChromeJS/raw/master/addmenuPlus/addMenuPlus.uc.js
// @note           0.1.3 修正 Firefox 78 (?应该是吧) openUILinkIn 参数变更；Firefox 92 getURLSpecFromFile 废止，切换到 getURLSpecFromActualFile；添加到文件菜单的 app/appmenu 菜单自动移动到汉堡菜单, 修复 keyword 调用搜索引擎失效的问题，没有 label 并使用 keyword 调用搜索引擎时设置 label 为搜素引擎名称；增加 onshowinglabel 属性，增加本地化属性 data-l10n-href 以及 data-l10n-id；修正右键未显示时无法获取选中文本，增加菜单类型 nav （navigator-toolbox的右键菜单），兼容 textLink_e10s.uc.js，增加移动的菜单无需重启浏览器即可还原，增加 identity-box 右键菜单, getSelectionText 完美修复，支持内置页面，修复右键菜单获取选中文本不完整
// @note           0.1.2 增加多语言；修复 %I %IMAGE_URL% %IMAGE_BASE64% 转换为空白字符串；GroupMenu 增加 onshowing 事件
// @note           0.1.1 Places keywords API を使うようにした
// @note           0.1.0 menugroup をとりあえず利用できるようにした
// @note           0.0.9 Firefox 29 の Firefox Button 廃止に伴いファイルメニューに追加するように変更
// @note           0.0.8 Firefox 25 の getShortcutOrURI 廃止に仮対応
// @note           0.0.7 Firefox 21 の Favicon 周りの変更に対応
// @note           0.0.6 Firefox 19 に合わせて修正
// @note           0.0.5 Remove E4X
// @note           0.0.4 設定ファイルから CSS を追加できるようにした
// @note           0.0.4 label の無い menu を splitmenu 風の動作にした
// @note           0.0.4 Vista でアイコンがズレる問題を修正…したかも
// @note           0.0.4 %SEL% の改行が消えてしまうのを修正
// @note           0.0.3 keyword の新しい書式で古い書式が動かない場合があったのを修正
// @note           %URL_HTMLIFIED%, %EOL_ENCODE% が変換できなかったミスを修正
// @note           %LINK_OR_URL% 変数を作成（リンク URL がなければページの URL を返す）
// @note           タブの右クリックメニューでは %URL% や %SEL% はそのタブのものを返すようにした
// @note           keyword で "g %URL%" のような記述を可能にした
// @note           ツールの再読み込みメニューの右クリックで設定ファイルを開くようにした
// @note           修复支持57+
// ==/UserScript==


/***** 説明 *****
 * 
 * _addMenu.js Demo: https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS/addMenuPlus/_addmenu.js

 ◆ 脚本说明 ◆
 通过配置文件自定义菜单
 在编写的时候，参考了 Copy URL Lite+，得到了作者允许。
 ・http://www.code-404.net/articles/browsers/copy-url-lite


 ◆ 如何使用？ ◆
 配置（_addmenu.js） 文件，请放在Chrome目录下。
 后缀名 .uc.js 可选。

 启动后，在浏览器中加载配置文件，并添加菜单。
 可以从“工具”菜单重新读取配置文件。


 ◆ 格式 ◆
 page, tab, tool, app 関数にメニューの素となるオブジェクトを渡す。
 オブジェクトのプロパティがそのまま menuitem の属性になります。

 ○exec
 启动外部应用程序。
 パラメータは text プロパティを利用します。
 自动显示该应用程序的图标。

 ○keyword
 指定了关键字的书签和搜索引擎。
 text プロパティがあればそれを利用して検索などをします。
 自动显示搜索引擎的图标。

 ○text（変数が利用可能）
 复制你想要的字符串到剪贴板。（Copy URL Lite+ 互換）
 keyword, exec があればそれらの補助に使われます。

 ○url（可用的变量）
 打开你想要的网址。
 内容によっては自動的にアイコンが付きます。

 ○where
 keyword, url でのページの開き方を指定できます（current, tab, tabshifted, window）
 省略するとブックマークのように左クリックと中クリックを使い分けられます。

 ○condition
 メニューを表示する条件を指定します。（Copy URL Lite+ 互換）
 省略すると url や text プロパティから自動的に表示/非表示が決まります。

 ○onshowing
 菜单显示时执行的函数

 ○onshowinglabel
 菜单显示时更新标签

 page/PageMenu: select, link, mailto, image, media, input, noselect, nolink, nomailto, noimage, nomedia, noinput から組み合わせて使います。
 nav/NavMenu: menubar, tabs, navbar, personal, nomenubar, notabs, nonavbar, nopersonal 配合使用

 ○oncommand, command
 これらがある時は condition 以外の特殊なプロパティは無視されます。


 ◆ サブメニュー ◆
 PageMenu, TabMenu, ToolMenu, AppMenu, NavMenu 関数を使って自由に追加できます。


 ◆ 利用可能な変数 ◆
 %EOL%            改行(\r\n)
 %TITLE%          ページタイトル
 %URL%            URI
 %SEL%            選択範囲の文字列
 %RLINK%          リンクアンカー先の URL
 %IMAGE_URL%      画像の URL
 %IMAGE_ALT%      画像の alt 属性
 %IMAGE_TITLE%    画像の title 属性
 %IMAGE_BASE64%   画像の DataURL
 %SVG_BASE64%     SVG の DataURL
 %LINK%           リンクアンカー先の URL
 %LINK_TEXT%      リンクのテキスト
 %RLINK_TEXT%     リンクのテキスト
 %MEDIA_URL%      メディアの URL
 %CLIPBOARD%      クリップボードの内容
 %FAVICON%        Favicon の URL
 %EMAIL%          リンク先の E-mail アドレス
 %HOST%           ページのホスト(ドメイン)
 %LINK_HOST%      リンクのホスト(ドメイン)
 %RLINK_HOST%     リンクのホスト(ドメイン)
 %LINK_OR_URL%    リンクの URL が取れなければページの URL
 %RLINK_OR_URL%   リンクの URL が取れなければページの URL

 %XXX_HTMLIFIED%  HTML エンコードされた上記変数（XXX → TITLE などに読み替える）
 %XXX_HTML%       HTML エンコードされた上記変数
 %XXX_ENCODE%     URI  エンコードされた上記変数

 ◇ 簡易的な変数 ◇
 %h               ページのホスト(ドメイン)
 %i               画像の URL
 %l               リンクの URL
 %m               メディアの URL
 %p               クリップボードの内容
 %s               選択文字列
 %t               ページのタイトル
 %u               ページの URL

 基本的に Copy URL Lite+ の変数はそのまま使えます。
 大文字・小文字は区別しません。

 */

location.href.startsWith('chrome://browser/content/browser.x') && (function (css) {

    var useScraptchpad = true; // 如果不存在编辑器，则使用代码片段速记器，否则设置编辑器路径
    var enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
    var onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
    var enableidentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单

    let { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;
    if (window.addMenu) {
        window.addMenu.destroy();
        delete window.addMenu;
    }

    const LANG = {
        'zh-CN': {
            'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件' +
                '\n\n' +
                'tab({\n    label: "addMenuPlus 配置",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
            'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
            'custom showing method error': 'addMenuPlus 自定义显示错误',
            'url is invalid': 'URL 不正确: %s',
            'config file': '配置文件',
            'not exists': ' 不存在',
            'check config file with line': '\n请重新检查配置文件第 %s 行',
            'file not found': '文件不存在: %s',
            'config has reload': '配置已经重新载入',
            'please set editor path': '请先设置编辑器的路径!!!',
            'set global editor': '设置全局脚本编辑器',
            'executable files': '执行文件',
            'could not load': '无法载入：%s'
        },
        'en-US': {
            'config example': '// This is an addMenuPlus configuration file.\n' +
                '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                '\n\n' +
                'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
            'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
            'addmenuplus label': 'addMenuPlus',
            'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
            'custom showing method error': 'addMenuPlus customize popupshow error',
            'url is invalid': 'URL is invalid: %s',
            'config file': 'Configuration file',
            'not exists': ' not exists',
            'check config file with line': '\nPlease recheck line %s of the configuration file',
            'file not found': 'File not found: %s',
            'config has reload': 'The configuration has been reloaded',
            'please set editor path': 'Please set the path to the editor first!!!',
            'set global editor': 'Setting up the global script editor',
            'executable files': 'Executable files',
            'could not load': 'Could not load：%s'
        },
    }

    window.addMenu = {
        get prefs() {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch("addMenu.")
        },
        get appVersion() {
            return Services.appinfo.version.split(".")[0]
        },
        get FILE() {
            try {
                // addMenu.FILE_PATH があればそれを使う
                path = this.prefs.getStringPref("FILE_PATH")
            } catch (e) {
                path = '_addmenu.js';
            }

            aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);

            if (!aFile.exists()) {
                saveFile(aFile, $L('config example'));
                alert($L('example is empty'));
                addMenu.openCommand({ target: this }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
            }

            this._modifiedTime = aFile.lastModifiedTime;
            delete this.FILE;
            return this.FILE = aFile;
        },
        get focusedWindow() {
            return (gContextMenu && gContextMenu.target) ? gContextMenu.target.ownerDocument.defaultView : document.commandDispatcher.focusedWindow || content;
        },
        get supportLocalization() {
            delete this.supportLocalization;
            return this.supportLocalization = typeof Localization === "function";
        },
        get locale() {
            delete this.locale;
            try {
                this.locale = Services.prefs.getCharPref("general.useragent.locale", "en-US");
            } catch (e) {
                this.locale = "en-US";
            }
            return this.locale;
        },
        init: function () {
            let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
            let rTITLE = "%TITLE" + he + "%|%t\\b";
            let rTITLES = "%TITLES" + he + "%|%t\\b";
            let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
            let rHOST = "%HOST" + he + "%|%h\\b";
            let rSEL = "%SEL" + he + "%|%s\\b";
            let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
            let rIMAGE = "%IMAGE(?:_URL|_ALT|_TITLE)" + he + "%|%i\\b";
            let rIMAGE_BASE64 = "%IMAGE_BASE64" + he + "%|%i\\b";
            let rSVG_BASE64 = "%SVG_BASE64" + he + "%|%i\\b";
            let rMEDIA = "%MEDIA_URL" + he + "%|%m\\b";
            let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
            let rFAVICON = "%FAVICON" + he + "%";
            let rEMAIL = "%EMAIL" + he + "%";
            let rExt = "%EOL" + he + "%";

            let rFAVICON_BASE64 = "%FAVICON_BASE64" + he + "%";
            let rRLT_OR_UT = "%RLT_OR_UT" + he + "%"; // 链接文本或网页标题

            this.rTITLE = new RegExp(rTITLE, "i");
            this.rTITLES = new RegExp(rTITLES, "i");
            this.rURL = new RegExp(rURL, "i");
            this.rHOST = new RegExp(rHOST, "i");
            this.rSEL = new RegExp(rSEL, "i");
            this.rLINK = new RegExp(rLINK, "i");
            this.rIMAGE = new RegExp(rIMAGE, "i");
            this.rMEDIA = new RegExp(rMEDIA, "i");
            this.rCLIPBOARD = new RegExp(rCLIPBOARD, "i");
            this.rFAVICON = new RegExp(rFAVICON, "i");
            this.rEMAIL = new RegExp(rEMAIL, "i");
            this.rExt = new RegExp(rExt, "i");
            this.rFAVICON_BASE64 = new RegExp(rFAVICON_BASE64, "i");
            this.rIMAGE_BASE64 = new RegExp(rIMAGE_BASE64, "i");
            this.rSVG_BASE64 = new RegExp(rSVG_BASE64, "i");
            this.rRLT_OR_UT = new RegExp(rRLT_OR_UT, "i");

            this.regexp = new RegExp(
                [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rIMAGE, rIMAGE_BASE64, rMEDIA, rSVG_BASE64, rCLIPBOARD, rFAVICON, rFAVICON_BASE64, rEMAIL, rExt, rRLT_OR_UT].join("|"), "ig");

            // 增加菜单类型请在这里加入插入点，同时修改 rebuild 函数里的菜单类型
            var ins;
            ins = $("context-viewsource");
            ins.parentNode.insertBefore(
                $C("menuseparator", { id: "addMenu-page-insertpoint", class: "addMenu-insert-point" }), ins.nextSibling);
            ins = $("context_closeTab");
            ins.parentNode.insertBefore(
                $C("menuseparator", { id: "addMenu-tab-insertpoint", class: "addMenu-insert-point" }), ins.nextSibling);
            ins = $("prefSep") || $("webDeveloperMenu");
            ins.parentNode.insertBefore(
                $C("menuseparator", { id: "addMenu-tool-insertpoint", class: "addMenu-insert-point" }), ins.nextSibling);
            ins = $("toolbar-context-undoCloseTab") || $("toolbarItemsMenuSeparator");
            ins.parentNode.insertBefore(
                $C("menuseparator", { id: "addMenu-nav-insertpoint", class: "addMenu-insert-point" }), ins.nextSibling);
            ins = $("appmenu-quit") || $("appMenu-quit-button") || $("appMenu-quit-button2") || $("menu_FileQuitItem");
            ins.parentNode.insertBefore(
                $C(ins.localName === "toolbarbutton" ? "toolbarseparator" : "menuseparator", { id: "addMenu-app-insertpoint", class: "addMenu-insert-point" }), ins);
            ins = $("devToolsSeparator");
            ins.parentNode.insertBefore($C("menuitem", {
                id: "addMenu-rebuild",
                label: $L('addmenuplus label'),
                tooltiptext: $L('addmenuplus tooltip'),
                oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
                onclick: "if (event.button == 2) { event.preventDefault(); addMenu.edit(addMenu.FILE); }",
            }), ins);
            $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
            $("tabContextMenu").addEventListener("popupshowing", this, false);
            $("toolbar-context-menu").addEventListener("popupshowing", this, false);
            $("menu_ToolsPopup").addEventListener("popupshowing", this, false);

            // 单击三杠按钮时移动菜单到 AppMenu
            PanelUI.mainView.addEventListener("ViewShowing", this.moveToAppMenu, { once: true });

            this.identityBox = $('identity-icon') || $('identity-box')
            if (enableidentityBoxContextMenu && this.identityBox) {
                // SSL 小锁右键菜单
                this.identityBox.addEventListener("click", this, false);
                this.identityBox.setAttribute('contextmenu', false);
                var popup = ins.appendChild($C('menupopup', {
                    id: 'identity-box-contextmenu'
                }));
                popup.appendChild($C("menuseparator", { id: "addMenu-identity-insertpoint", class: "addMenu-insert-point" }));
                $("mainPopupSet").appendChild(popup);
            }

            // 内容进程运行 JS
            function frameScript() {
                const { Services } = Components.utils.import(
                    "resource://gre/modules/Services.jsm"
                );
                content.addMenu_Content = {
                    init: function () {
                        addMessageListener("addMenu_getSelectedText", this);
                        addMessageListener("addMenu_destroy", this);
                    },
                    getSelection: function (win, focusedElement) {
                        win || (win = content);
                        var selection = win.getSelection().toString();
                        if (!selection) {
                            let element = focusedElement;
                            let isOnTextInput = function (elem) {
                                return elem instanceof HTMLTextAreaElement ||
                                    (elem instanceof HTMLInputElement && elem.mozIsTextField(true));
                            };

                            if (isOnTextInput(element)) {
                                selection = element.value.substring(element.selectionStart,
                                    element.selectionEnd);
                            }
                        }

                        return selection;
                    },
                    receiveMessage: function (message) {
                        switch (message.name) {
                            case 'addMenu_getSelectedText':
                                const focusedElement = Services.focus.focusedElement;
                                let data = { text: this.getSelection(content, focusedElement) }
                                sendSyncMessage("addMenu_selectionData", data);
                                break;
                            case 'addMenu_destroy':
                                this.destroy();
                                break;
                        }
                    },
                    destroy() {
                        removeMessageListener("addMenu_getSelectedText", this);
                        removeMessageListener("addMenu_destroy", this);
                        delete content.addMenu_Content;
                    }
                }
                content.addMenu_Content.init();
            }
            let frameScriptURI = 'data:application/javascript,'
                + encodeURIComponent('(' + frameScript.toString() + ')()');
            window.messageManager.loadFrameScript(frameScriptURI, true);
            window.messageManager.addMessageListener("addMenu_selectionData", this);

            // 响应鼠标键释放事件（eg：获取选中文本）
            (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);

            this.style = addStyle(css);
            this.rebuild();
        },
        uninit: function () {
            $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
            $("tabContextMenu").removeEventListener("popupshowing", this, false);
            $("toolbar-context-menu").removeEventListener("popupshowing", this, false);
            $("menu_ToolsPopup").removeEventListener("popupshowing", this, false);
        },
        destroy: function () {
            this.uninit();
            window.messageManager.broadcastAsyncMessage("addMenu_destroy");
            window.messageManager.removeMessageListener("addMenu_selectionData", this);
            (gBrowser.mPanelContainer || gBrowser.tabpanels).removeEventListener("mouseup", this, false);
            this.removeMenuitem();
            $$('#addMenu-rebuild, .addMenu-insert-point').forEach(function (e) {
                e.parentNode.removeChild(e)
            });
            if ($('identity-box-contextmenu')) {
                var popup = $('identity-box-contextmenu');
                popup.parentNode.removeChild(popup);
            }
            if (this.identityBox) {
                this.identityBox.removeAttribute('contextmenu');
                this.identityBox.removeEventListener("click", this, false);
            }

            if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
            if (this.style2 && this.style2.parentNode) this.style2.parentNode.removeChild(this.style2);
            delete window.addMenu;
        },
        handleEvent: function (event) {
            switch (event.type) {
                case "popupshowing":
                    if (event.target != event.currentTarget) return;

                    if (enableFileRefreshing) {
                        this.updateModifiedFile();
                    }

                    if (event.target.id == 'contentAreaContextMenu') {
                        var state = [];
                        if (gContextMenu.onTextInput)
                            state.push("input");
                        if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                            state.push("select");
                        if (gContextMenu.onLink || event.target.querySelector("#context-openlinkincurrent").getAttribute("hidden") !== "true")
                            state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                        if (gContextMenu.onCanvas)
                            state.push("canvas image");
                        if (gContextMenu.onImage)
                            state.push("image");
                        if (gContextMenu.onVideo || gContextMenu.onAudio)
                            state.push("media");
                        event.currentTarget.setAttribute("addMenu", state.join(" "));

                        event.target.querySelectorAll(`.addMenu[condition]`).forEach(m => {
                            // 显示时自动更新标签
                            if (m.hasAttribute('onshowinglabel')) {
                                onshowinglabelMaxLength = onshowinglabelMaxLength || 15;
                                var sel = addMenu.convertText(m.getAttribute('onshowinglabel'))
                                if (sel && sel.length > 15)
                                    sel = sel.substr(0, 15) + "...";
                                m.setAttribute('label', sel);
                            }
                        });

                        this.customShowings.forEach(function (obj) {
                            var curItem = obj.item;
                            try {
                                eval('(' + obj.fnSource + ').call(curItem, curItem)');
                            } catch (ex) {
                                console.error($L('custom showing method error'), obj.fnSource);
                            }
                        });
                    }

                    if (event.target.id === "toolbar-context-menu") {
                        let triggerNode = event.target.triggerNode;
                        var state = [];
                        const map = {
                            'toolbar-menubar': 'menubar',
                            'TabsToolbar': 'tabs',
                            'nav-bar': 'navbar',
                            'PersonalToolbar': 'personal',
                        }
                        Object.keys(map).map(e => $(e).contains(triggerNode) && state.push(map[e]));
                        if (triggerNode && triggerNode.localName === "toolbarbutton") {
                            state.push("button");
                        }
                        event.currentTarget.setAttribute("addMenu", state.join(" "));
                    }
                    break;
                case 'mouseup':
                    // 鼠标按键释放时读取选中文本
                    try {
                        gBrowser.selectedTab.linkedBrowser.messageManager.sendAsyncMessage("addMenu_getSelectedText");
                    } catch (e) { }
                    break;
                case 'click':
                    if (event.button == 2 && event.target.id === this.identityBox.id)
                        $("identity-box-contextmenu").openPopup(event.target, "after_pointer", 0, 0, true, false);

                    break;
            }
        },
        receiveMessage(message) {
            switch (message.name) {
                case 'addMenu_selectionData':
                    this._selectedTXT = message.data.text;
                    break;
            }
        },
        updateModifiedFile: function () {
            if (!this.FILE.exists()) return;

            if (this._modifiedTime != this.FILE.lastModifiedTime) {
                this._modifiedTime = this.FILE.lastModifiedTime;

                setTimeout(function () {
                    addMenu.rebuild(true);
                }, 10);
            }
        },
        onCommand: function (event) {
            var menuitem = event.target;
            var text = menuitem.getAttribute("text") || "";
            var keyword = menuitem.getAttribute("keyword") || "";
            var url = menuitem.getAttribute("url") || "";
            var where = menuitem.getAttribute("where") || "";
            var exec = menuitem.getAttribute("exec") || "";

            if (keyword) {
                let param = (text ? (text = this.convertText(text)) : "");
                let engine = keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(keyword);
                if (engine) {
                    if (isPromise(engine)) {
                        engine.then(function (engine) {
                            let submission = engine.getSubmission(param);
                            addMenu.openCommand(event, submission.uri.spec, where);
                        });
                    } else {
                        let submission = engine.getSubmission(param);
                        this.openCommand(event, submission.uri.spec, where);
                    }
                } else {
                    PlacesUtils.keywords.fetch(keyword || '').then(entry => {
                        if (!entry) return;
                        // 文字化けの心配が…
                        let newurl = entry.url.href.replace('%s', encodeURIComponent(param));
                        this.openCommand(event, newurl, where);
                    });
                }
            } else if (url)
                this.openCommand(event, this.convertText(url), where);
            else if (exec)
                this.exec(exec, this.convertText(text));
            else if (text)
                this.copy(this.convertText(text));
        },
        openCommand: function (event, url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log(U($L('url is invalid')).replace("%s", url));
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
                    openUILinkIn(uri.spec, 'tab');
                } else {
                    openUILinkIn(uri.spec, 'tab', {
                        triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                            Services.scriptSecurityManager.createNullPrincipal({}) :
                            Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } else {
                if (addMenu.appVersion < 78)
                    openUILink(uri.spec, event);
                else {
                    openUILink(uri.spec, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            }
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
                    Cu.reportError($L("file not found").replace("%s", path));
                    return;
                }

                if (file.isExecutable()) {
                    process.init(file);
                    process.runw(false, a, a.length);
                } else {
                    file.launch();
                }
            } catch (e) {
                this.log(e);
            }
        },
        handleRelativePath: function (path) {
            if (path) {
                path = path.replace(/\//g, '\\').toLocaleLowerCase();
                var ffdir = Cc['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path;
                if (/^(\\)/.test(path)) {
                    return ffdir + path;
                } else {
                    return path;
                }
            }
        },
        moveToAppMenu: async function (_e) {
            let ins = document.getElementById('addMenu-app-insertpoint');
            if (ins && ins.localName === 'menuseparator') {
                let separator = $('appMenu-quit-button2').previousSibling;
                if (separator) {
                    ins.remove();
                    // addMenu.removeMenuitem();
                    ins = $C('toolbarseparator', {
                        'id': 'addMenu-app-insertpoint',
                        class: "addMenu-insert-point"
                    });
                    separator.parentNode.insertBefore(ins, separator);
                    addMenu.rebuild();
                }
            }
        },
        rebuild: function (isAlert) {
            var aFile = this.FILE;

            if (!aFile || !aFile.exists() || !aFile.isFile()) {
                this.log(aFile ? aFile.path : U($L('config file')) + U($L('not exists')));
                return;
            }

            // 增加菜单类型需要修改这里
            var aiueo = [
                { current: "page", submenu: "PageMenu", insertId: "addMenu-page-insertpoint" },
                { current: "tab", submenu: "TabMenu", insertId: "addMenu-tab-insertpoint" },
                { current: "tool", submenu: "ToolMenu", insertId: "addMenu-tool-insertpoint" },
                { current: "nav", submenu: "NavMenu", insertId: "addMenu-nav-insertpoint" },
                { current: "app", submenu: "AppMenu", insertId: "addMenu-app-insertpoint" },
                { current: "group", submenu: "GroupMenu", insertId: "addMenu-page-insertpoint" },
            ];

            if (enableidentityBoxContextMenu) aiueo.push({ current: "ident", submenu: "IdentMenu", insertId: "addMenu-identity-insertpoint" });

            var data = loadText(aFile);

            var sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));

            sandbox.Components = Components;
            sandbox.Cc = Cc;
            sandbox.Ci = Ci;
            sandbox.Cr = Cr;
            sandbox.Cu = Cu;
            sandbox.Services = Services;
            try {
                sandbox.locale = Services.prefs.getCharPref("general.useragent.locale", "zh-CN");
            } catch (e) {
                sandbox.locale = "en-US";
            }


            var includeSrc = "";
            sandbox.include = function (aLeafName) {
                var data = loadFile(aLeafName);
                if (data)
                    includeSrc += data + "\n";
            };
            sandbox._css = [];

            aiueo.forEach(function ({ current, submenu }) {
                sandbox["_" + current] = [];
                if (submenu != 'GroupMenu') {
                    sandbox[current] = function (itemObj) {
                        ps(itemObj, sandbox["_" + current]);
                    }
                }
                sandbox[submenu] = function (menuObj) {
                    if (!menuObj)
                        menuObj = {};
                    menuObj._items = [];
                    if (submenu == 'GroupMenu')
                        menuObj._group = true;
                    sandbox["_" + current].push(menuObj);
                    return function (itemObj) {
                        ps(itemObj, menuObj._items);
                    }
                }
            }, this);

            function ps(item, array) {
                ("join" in item && "unshift" in item) ? [].push.apply(array, item) :
                    array.push(item);
            }

            try {
                var lineFinder = new Error();
                Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\n" + data, sandbox, "1.8");
                Cu.evalInSandbox(includeSrc, sandbox, "1.8");
            } catch (e) {
                let line = e.lineNumber - lineFinder.lineNumber - 1;
                this.alert(e + $L("check config file with line", line), null, function () {
                    addMenu.edit(addMenu.FILE, line);
                });
                return this.log(e);
            }
            if (this.style2 && this.style2.parentNode)
                this.style2.parentNode.removeChild(this.style2);
            if (sandbox._css.length)
                this.style2 = addStyle(sandbox._css.join("\n"));
            this.removeMenuitem();

            this.customShowings = [];

            aiueo.forEach(function ({ current, submenu, insertId }) {
                if (!sandbox["_" + current] || sandbox["_" + current].length == 0) return;
                let insertPoint = $(insertId);
                this.createMenuitem(sandbox["_" + current], insertPoint);
            }, this);

            if (isAlert) this.alert(U($L('config has reload')));
        },
        newGroupMenu: function (menuObj) {
            var group = $C('menugroup');

            // 增加 onshowing 事件
            if (menuObj.onshowing) {
                this.customShowings.push({
                    item: group,
                    fnSource: menuObj.onshowing
                });
                delete menuObj.onshowing;
            }

            Object.keys(menuObj).map(function (key) {
                var val = menuObj[key];
                if (key === "_items") return;
                if (key === "_group") return;
                if (typeof val == "function")
                    menuObj[key] = val = "(" + val.toString() + ").call(this, event);";
                group.setAttribute(key, val);
            }, this);
            let cls = group.classList;
            cls.add('addMenu');

            // 表示 / 非表示の設定
            if (menuObj.condition)
                this.setCondition(group, menuObj.condition);

            menuObj._items.forEach(function (obj) {
                group.appendChild(this.newMenuitem(obj, { isMenuGroup: true }));
            }, this);
            return group;
        },
        newMenu: function (menuObj, opt) {
            opt || (opt = {});
            if (menuObj._group) {
                return this.newGroupMenu(menuObj);
            }
            var isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                menuitemType = isAppMenu ? "toolbarbutton" : "menu",
                menu = $C(menuitemType),
                popup,
                panelId;

            // fix for appmenu
            const viewCache = ($('appMenu-viewCache') && $('appMenu-viewCache').content) || $('appMenu-multiView');
            if (isAppMenu && viewCache) {
                menu.setAttribute('closemenu', "none");
                panelId = menuObj.id ? menuObj.id + "-panel" : "addMenu-panel-" + Math.floor(Math.random() * 900000 + 99999);
                popup = viewCache.appendChild($C('panelview', {
                    'id': panelId,
                    'class': 'addMenu PanelUI-subView'
                }));
                popup = popup.appendChild($C('vbox', {
                    class: 'panel-subview-body',
                    panelId: panelId
                }));
            } else {
                popup = menu.appendChild($C("menupopup"));
            }
            for (let key in menuObj) {
                let val = menuObj[key];
                if (key === "_items") continue;

                if (!isAppMenu && key === 'onshowing') {
                    this.customShowings.push({
                        item: menu,
                        fnSource: menuObj.onshowing.toString()
                    });
                    delete menuObj.onshowing;
                    continue;
                }

                if (typeof val == "function")
                    menuObj[key] = val = "(" + val.toString() + ").call(this, event);"
                menu.setAttribute(key, val);

            }

            let cls = menu.classList;
            cls.add("addMenu");
            if (isAppMenu) {
                cls.add("subviewbutton");
                cls.add("subviewbutton-nav");
            } else {
                cls.add("menu-iconic");
            }


            // 表示 / 非表示の設定
            if (menuObj.condition)
                this.setCondition(menu, menuObj.condition);

            menuObj._items.forEach(function (obj) {
                popup.appendChild(this.newMenuitem(obj, opt));
            }, this);

            // menu に label が無い場合、最初の menuitem の label 等を持ってくる
            // menu 部分をクリックで実行できるようにする(splitmenu みたいな感じ)
            if (isAppMenu) {
                menu.setAttribute('oncommand', `PanelUI.showSubView('${panelId}', this)`);
            } else if (!menu.hasAttribute('label')) {
                let firstItem = menu.querySelector('menuitem');
                if (firstItem) {
                    let command = firstItem.getAttribute('command');
                    if (command)
                        firstItem = document.getElementById(command) || firstItem;
                    ['label', 'accesskey', 'image', 'icon'].forEach(function (n) {
                        if (!menu.hasAttribute(n) && firstItem.hasAttribute(n))
                            menu.setAttribute(n, firstItem.getAttribute(n));
                    }, this);
                    menu.setAttribute('onclick', "\
                    if (event.target != event.currentTarget) return;\
                    var firstItem = event.currentTarget.querySelector('menuitem');\
                    if (!firstItem) return;\
                    if (event.button === 1) {\
                        checkForMiddleClick(firstItem, event);\
                    } else {\
                        firstItem.doCommand();\
                        closeMenus(event.currentTarget);\
                    }\
                ");
                }
            }
            return menu;
        },
        newMenuitem: function (obj, opt) {
            opt || (opt = {});

            var menuitem,
                isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                menuitemType = isAppMenu ? "toolbarbutton" : "menuitem",
                noDefaultLabel = false;

            // label == separator か必要なプロパティが足りない場合は区切りとみなす
            if (obj.label === "separator" ||
                (!obj.label && !obj.image && !obj.text && !obj.keyword && !obj.url && !obj.oncommand && !obj.command)) {
                menuitem = $C(separatorType);
            } else if (obj.oncommand || obj.command) {
                let org = obj.command ? document.getElementById(obj.command) : null;
                if (org && org.localName === separatorType) {
                    menuitem = $C(separatorType);
                } else {
                    menuitem = $C(menuitemType);
                    if (obj.command)
                        menuitem.setAttribute("command", obj.command);

                    noDefaultLabel = !obj.label;
                    if (noDefaultLabel)
                        obj.label = obj.command || obj.oncommand;
                }
            } else {
                menuitem = $C(menuitemType);

                // property fix
                noDefaultLabel = !obj.label;
                if (noDefaultLabel)
                    obj.label = obj.exec || obj.keyword || obj.url || obj.text;

                if (obj.keyword && !obj.text) {
                    let index = obj.keyword.search(/\s+/);
                    if (index > 0) {
                        obj.text = obj.keyword.substr(index).trim();
                        obj.keyword = obj.keyword.substr(0, index);
                    }
                }

                if (obj.where && /\b(tab|tabshifted|window|current)\b/i.test(obj.where))
                    obj.where = RegExp.$1.toLowerCase();

                if (obj.where && !("acceltext" in obj))
                    obj.acceltext = obj.where;

                if (!obj.condition && (obj.url || obj.text)) {
                    // 表示 / 非表示の自動設定
                    let condition = "";
                    if (this.rSEL.test(obj.url || obj.text)) condition += " select";
                    if (this.rLINK.test(obj.url || obj.text)) condition += " link";
                    if (this.rEMAIL.test(obj.url || obj.text)) condition += " mailto";
                    if (this.rIMAGE.test(obj.url || obj.text)) condition += " image";
                    if (this.rMEDIA.test(obj.url || obj.text)) condition += " media";
                    if (condition)
                        obj.condition = condition;
                }

                if (obj.exec) {
                    obj.exec = this.handleRelativePath(obj.exec);
                }
            }

            // 右键第一层菜单添加 onpopupshowing 事件
            if (opt.isTopMenuitem && obj.onshowing) {
                this.customShowings.push({
                    item: menuitem,
                    fnSource: obj.onshowing.toString()
                });
                delete obj.onshowing;
            }


            for (let key in obj) {
                let val = obj[key];
                if (key === "command") continue;
                if (typeof val == "function")
                    obj[key] = val = "(" + val.toString() + ").call(this, event);";
                menuitem.setAttribute(key, val);
            }

            if (noDefaultLabel && menuitem.localName !== separatorType) {
                if (this.supportLocalization && obj['data-l10n-href'] && obj["data-l10n-href"].endsWith(".ftl") && obj['data-l10n-id']) {
                    // Localization 支持
                    let strings = new Localization([obj["data-l10n-href"]]);
                    strings.formatValue([obj['data-l10n-id']]).then(
                        text => {
                            menuitem.setAttribute('label', text || menuitem.getAttribute("label"));
                        }
                    )
                } else if (obj.keyword) {
                    // 调用搜索引擎 Label hack 
                    let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                    if (isPromise(engine)) {
                        engine.then(s => {
                            if (s && s._name) menuitem.setAttribute('label', s._name);
                        });
                    } else {
                        if (engine && engine._name) menuitem.setAttribute('label', engine._name);
                    }
                }
            }

            /** obj を属性にする
             for (let [key, val] in Iterator(obj)) {
            if (key === "command") continue;
            if (typeof val == "function")
                obj[key] = val = "(" + val.toString() + ").call(this, event);";
                menuitem.setAttribute(key, val);
            }**/

            var cls = menuitem.classList;
            cls.add("addMenu");

            if (isAppMenu) {
                if (menuitem.localName == "toolbarbutton") cls.add("subviewbutton");
            } else {
                cls.add("menuitem-iconic");
            }
            // 表示 / 非表示の設定
            if (obj.condition)
                this.setCondition(menuitem, obj.condition);

            // separator はここで終了
            if (menuitem.localName == "menuseparator")
                return menuitem;

            if (!obj.onclick)
                menuitem.setAttribute("onclick", "checkForMiddleClick(this, event)");

            // 给 MenuGroup 的菜单加上 tooltiptext
            if (opt.isMenuGroup && !obj.tooltiptext && obj.label) {
                menuitem.setAttribute('tooltiptext', obj.label);
            }

            // oncommand, command はここで終了
            if (obj.oncommand || obj.command)
                return menuitem;

            menuitem.setAttribute("oncommand", "addMenu.onCommand(event);");

            // 可能ならばアイコンを付ける
            this.setIcon(menuitem, obj);

            return menuitem;
        },
        createMenuitem: function (itemArray, insertPoint) {

            var chldren = $A(insertPoint.parentNode.children);
            //Symbol.iterator
            for (let obj of itemArray) {

                if (!obj) continue;
                let menuitem;
                // clone menuitem and set attribute

                if (obj.id && (menuitem = $(obj.id))) {

                    let dupMenuitem;
                    let isDupMenu = (obj.clone != false);
                    if (isDupMenu) {
                        dupMenuitem = menuitem.cloneNode(true);

                        // 隐藏原菜单
                        // menuitem.classList.add("addMenuHide");
                    } else {
                        dupMenuitem = menuitem;
                        // 增加用于还原已移动菜单的标记
                        if (dupMenuitem)
                            dupMenuitem.parentNode.insertBefore($C(insertPoint.localName, {
                                'original-id': dupMenuitem.getAttribute('id'),
                                hidden: true,
                                class: 'addMenuOriginal',
                            }), dupMenuitem);
                    }
                    for (let key in obj) {
                        let val = obj[key];
                        if (typeof val == "function")
                            obj[key] = val = "(" + val.toString() + ").call(this, event);";

                        dupMenuitem.setAttribute(key, val);

                    }

                    // 如果没有则添加 menuitem-iconic 或 menu-iconic，给菜单添加图标用。
                    let type = dupMenuitem.nodeName,
                        cls = dupMenuitem.classList;
                    if (type == 'menuitem' || type == 'menu')
                        if (!cls.contains(type + '-iconic'))
                            cls.add(type + '-iconic');

                    if (!cls.contains('addMenu'))
                        cls.add('addMenu');
                    if (!isDupMenu && !cls.contains('addMenuNot'))
                        cls.add('addMenuNot');

                    // // 没有插入位置的默认放在原来那个菜单的后面
                    // if(isDupMenu && !obj.insertAfter && !obj.insertBefore && !obj.position){
                    //     obj.insertAfter = obj.id;
                    // }
                    let noMove = !isDupMenu;
                    insertMenuItem(obj, dupMenuitem, noMove);
                    continue;
                }

                menuitem = obj._items ? this.newMenu(obj, { insertPoint: insertPoint }) : this.newMenuitem(obj, { isTopMenuitem: true, insertPoint: insertPoint });

                insertMenuItem(obj, menuitem);

            }

            function insertMenuItem(obj, menuitem, noMove) {
                let ins;
                if (obj.parent && (ins = $(obj.parent))) {
                    ins.appendChild(menuitem);
                    return;
                }
                if (obj.insertAfter && (ins = $(obj.insertAfter))) {
                    ins.parentNode.insertBefore(menuitem, ins.nextSibling);
                    return;
                }
                if (obj.insertBefore && (ins = $(obj.insertBefore))) {
                    ins.parentNode.insertBefore(menuitem, ins);
                    return;
                }
                if (obj.position && parseInt(obj.position, 10) > 0) {
                    (ins = chldren[parseInt(obj.position, 10) - 1]) ?
                        ins.parentNode.insertBefore(menuitem, ins) :
                        insertPoint.parentNode.appendChild(menuitem);
                    return;
                }
                if (!noMove) {
                    insertPoint.parentNode.insertBefore(menuitem, insertPoint);
                }
            }
        },
        removeMenuitem: function () {
            var remove = function (e) {
                if (e.classList.contains('addMenuNot')) return;
                e.parentNode.removeChild(e);
            };

            $$('.addMenuOriginal').forEach((e) => {
                let id = e.getAttribute('original-id');
                if (id && $(id))
                    e.parentNode.insertBefore($(id), e);
                e.parentNode.removeChild(e);
            });

            $$('menu.addMenu, menugroup.addMenu').forEach(remove);
            $$('.addMenu').forEach(remove);
            // 恢复原隐藏菜单
            $$('.addMenuHide').forEach(function (e) {
                e.classList.remove('addMenuHide');
            });
        },

        setIcon: function (menu, obj) {
            if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                return;

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
        setCondition: function (menu, condition) {
            if (/\bnormal\b/i.test(condition)) {
                menu.setAttribute("condition", "normal");
            } else {
                let match = condition.toLowerCase().match(/\b(?:no)?(?:select|link|mailto|image|canvas|media|input)\b/ig);
                if (!match || !match[0])
                    return;
                match = match.filter(function (c, i, a) {
                    return a.indexOf(c) === i
                });
                menu.setAttribute("condition", match.join(" "));
            }
        },
        convertText: function (text) {
            var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                link: { href: "", host: "" },
                target: { alt: "", title: "" },
                __noSuchMethod__: function (id, args) {
                    return ""
                },
            };
            let tab = document.popupNode || TabContextMenu ? TabContextMenu.contextTab : null;
            var bw = (tab && tab.linkedBrowser) || context.browser || gBrowser.selectedTab.linkedBrowser;

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
                    case "%L":
                        return context.linkURL || "";
                    case "%RLINK%":
                        return context.linkURL || "";
                    case "%RLINK_HOST%":
                        return context.link.host || "";
                    case "%RLINK_TEXT%":
                        return context.linkText() || "";
                    case "%RLINK_OR_URL%":
                        return context.linkURL || bw.documentURI.spec;
                    case "%RLT_OR_UT%":
                        return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                    case "%IMAGE_ALT%":
                        return context.target.alt || "";
                    case "%IMAGE_TITLE%":
                        return context.target.title || "";
                    case "%I":
                        return context.imageURL || context.mediaURL || "";
                    case "%IMAGE_URL%":
                        return context.imageURL || context.mediaURL || "";
                    case "%IMAGE_BASE64%":
                        return typeof context.imageURL === "undefined" ? img2base64(context.mediaURL) : img2base64(context.imageURL);
                    case "%SVG_BASE64%":
                        let url = context.linkURL || bw.documentURI.spec || "";
                        return url.endsWith("svg") ? svg2base64(url) : "";
                    case "%M":
                        return context.mediaURL || "";
                    case "%MEDIA_URL%":
                        return context.mediaURL || "";
                    case "%P":
                        return readFromClipboard() || "";
                    case "%CLIPBOARD%":
                        return readFromClipboard() || "";
                    case "%FAVICON%":
                        return gBrowser.getIcon(tab ? tab : null) || "";
                    case "%FAVICON_BASE64%":
                        return img2base64(gBrowser.getIcon(tab ? tab : null));
                    case "%EMAIL%":
                        return getEmailAddress() || "";
                    case "%EOL%":
                        return "\r\n";
                }
                return str;
            }

            function htmlEscape(s) {
                return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
            }

            function getEmailAddress() {
                var url = context.linkURL;
                if (!url || !/^mailto:([^?]+).*/i.test(url)) return "";
                var addresses = RegExp.$1;
                try {
                    var characterSet = context.target.ownerDocument.characterSet;
                    const textToSubURI = Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI);
                    addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
                } catch (ex) { }
                return addresses;
            }

            function img2base64(imgSrc, imgType) {
                if (typeof imgSrc == 'undefined') return "";
                imgType = imgType || "image/png";
                const NSURI = "http://www.w3.org/1999/xhtml";
                var img = new Image();
                var that = this;
                var canvas,
                    isCompleted = false;
                img.onload = function () {
                    var width = this.naturalWidth,
                        height = this.naturalHeight;
                    if (that.appVersion <= 72) {
                        canvas = document.createXULElementNS(NSURI, "canvas");
                    } else {
                        canvas = document.createElementNS(NSURI, "canvas")
                    }
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0);
                    isCompleted = true;
                };
                img.onerror = function () {
                    Cu.reportError($L('could not load', imgSrc));
                    isCompleted = true;
                };
                img.src = imgSrc;

                var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                while (!isCompleted) {
                    thread.processNextEvent(true);
                }

                var data = canvas ? canvas.toDataURL(imgType) : "";
                canvas = null;
                return data;
            }

            function svg2base64(svgSrc) {
                if (typeof svgSrc == 'undefined') return "";
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", svgSrc, false);
                xmlhttp.send();
                var svg = xmlhttp.responseText;
                // svg string to data url
                var svg64 = "data:image/svg+xml;base64," + btoa(svg);
                return svg64;
            }
        },
        getSelectedText() {
            return this._selectedTXT;
        },
        /**
         * 获取选区
         * @param {*} win 
         * @returns 
         * @deprecated use getSelectedText instead
         */
        getSelection: function (win) {
            // from getBrowserSelection Fx19
            win || (win = this.focusedWindow);
            var selection = this.getRangeAll(win).join(" ");
            if (!selection) {
                let element = document.commandDispatcher.focusedElement;
                let isOnTextInput = function (elem) {
                    return elem instanceof HTMLTextAreaElement ||
                        (elem instanceof HTMLInputElement && elem.mozIsTextField(true));
                };

                if (isOnTextInput(element)) {
                    selection = element.QueryInterface(Ci.nsIDOMNSEditableElement)
                        .editor.selection.toString();
                }
            }

            if (selection) {
                selection = selection.replace(/^\s+/, "")
                    .replace(/\s+$/, "")
                    .replace(/\s+/g, " ");
            }
            return selection;
        },
        /**
         * 
         * @param {*} win 
         * @returns
         * @deprecated 
         */
        getRangeAll: function (win) {
            win || (win = this.focusedWindow);
            var sel = win.getSelection();
            var res = [];
            for (var i = 0; i < sel.rangeCount; i++) {
                res.push(sel.getRangeAt(i));
            };
            return res;
        },
        getInputSelection: function (elem) {
            if (elem instanceof HTMLTextAreaElement || elem instanceof HTMLInputElement && elem.mozIsTextField(false))
                return elem.value.substring(elem.selectionStart, elem.selectionEnd);
            return "";
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
        edit: function (aFile, aLineNumber) {
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;

            var editor;
            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) { }

            if (!editor || !editor.exists()) {
                if (useScraptchpad && this.appVersion <= 72) {
                    this.openScriptInScratchpad(window, aFile);
                    return;
                } else {
                    alert($L('please set editor path'));
                    var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                    fp.init(window, $L('set global editor'), fp.modeOpen);
                    fp.appendFilter($L('executable files'), "*.exe");

                    if (typeof fp.show !== 'undefined') {
                        if (fp.show() == fp.returnCancel || !fp.file)
                            return;
                        else {
                            editor = fp.file;
                            Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        }
                    } else {
                        fp.open(res => {
                            if (res != Ci.nsIFilePicker.returnOK) return;
                            editor = fp.file;
                            Services.prefs.setCharPref("view_source.editor.path", editor.path);
                        });
                    }
                }
            }

            var aURL = this.getURLSpecFromFile(aFile);
            var aDocument = null;
            var aCallBack = null;
            var aPageDescriptor = null;
            gViewSourceUtils.openInExternalEditor({
                URL: aURL,
                lineNumber: aLineNumber
            }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
        },
        /**
         * 使用 Scratchpad 编辑
         * @param {*} parentWindow 
         * @param {*} file
         * @deprecated 
         */
        openScriptInScratchpad: function (parentWindow, file) {
            let spWin = window.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
            spWin.top.moveTo(0, 0);
            spWin.top.resizeTo(screen.availWidth, screen.availHeight);

            spWin.addEventListener("load", function spWinLoaded() {
                spWin.removeEventListener("load", spWinLoaded, false);

                let Scratchpad = spWin.Scratchpad;
                Scratchpad.setFilename(file.path);
                Scratchpad.addObserver({
                    onReady: function () {
                        Scratchpad.removeObserver(this);
                        Scratchpad.importFromFile.call(Scratchpad, file);
                    }
                });
            }, false);
        },
        copy: function (aText) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
            //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
        },
        copyLink: function (copyURL, copyLabel) {
            // generate the Unicode and HTML versions of the Link
            var textUnicode = copyURL;
            var textHtml = ("<a href=\"" + copyURL + "\">" + copyLabel + "</a>");

            // make a copy of the Unicode
            var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
            if (!str) return false; // couldn't get string obj
            str.data = textUnicode; // unicode string?

            // make a copy of the HTML
            var htmlstring = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
            if (!htmlstring) return false; // couldn't get string obj
            htmlstring.data = textHtml;

            // add Unicode & HTML flavors to the transferable widget
            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            if (!trans) return false; //no transferable widget found

            trans.addDataFlavor("text/unicode");
            trans.setTransferData("text/unicode", str, textUnicode.length * 2); // *2 because it's unicode

            trans.addDataFlavor("text/html");
            trans.setTransferData("text/html", htmlstring, textHtml.length * 2); // *2 because it's unicode

            // copy the transferable widget!
            var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            if (!clipboard) return false; // couldn't get the clipboard

            clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
            return true;
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
                this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "addMenuPlus",
                aMsg + "", !!callback, "", callback);
        },
        $$: function (exp, context, aPartly) {
            context || (context = this.focusedWindow.document);
            var doc = context.ownerDocument || context;
            var elements = $$(exp, doc);
            if (arguments.length <= 2)
                return elements;
            var sel = doc.defaultView.getSelection();
            return elements.filter(function (q) {
                return sel.containsNode(q, aPartly)
            });
        },
        log: log,
    };

    function $(id) {
        return document.getElementById(id);
    }

    function $$(exp, doc) {
        return Array.prototype.slice.call((doc || document).querySelectorAll(exp));
    }

    function $A(args) {
        return Array.prototype.slice.call(args);
    }

    function log() {
        console.log(Array.prototype.slice.call(arguments));
    }

    function U(text) {
        return 1 < 'あ'.length ? decodeURIComponent(escape(text)) : text
    };

    function $C(name, attr) {
        const appVersion = Services.appinfo.version.split(".")[0];
        attr || (attr = {});
        var el;
        if (appVersion >= 69) {
            el = document.createXULElement(name);
        } else {
            el = document.createElement(name);
        }
        if (attr) Object.keys(attr).forEach(function (n) {
            el.setAttribute(n, attr[n])
        });
        return el;
    }

    function loadText(aFile) {
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

    function loadFile(aLeafName) {
        var aFile = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIDirectoryService)
            .QueryInterface(Ci.nsIProperties)
            .get('UChrm', Ci.nsIFile);
        aFile.appendRelativePath(aLeafName);
        if (!aFile.exists() || !aFile.isFile()) return null;
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

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
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

    function $L(key, replace) {
        const _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN");
        let str = LANG[_LOCALE].hasOwnProperty(key) ? LANG[_LOCALE][key] : (LANG['en-US'].hasOwnProperty(key) ? LANG['en-US'][key] : "undefined");
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str || "";
    }

    function isDef(v) {
        return v !== undefined && v !== null
    }

    function isPromise(val) {
        return (
            isDef(val) &&
            typeof val.then === 'function' &&
            typeof val.catch === 'function'
        )
    }

    if (gBrowserInit.delayedStartupFinished) window.addMenu.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.addMenu.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
.addMenuHide
  { display: none !important; }
#contentAreaContextMenu:not([addMenu~="select"]) .addMenu[condition~="select"],
#contentAreaContextMenu:not([addMenu~="link"])   .addMenu[condition~="link"],
#contentAreaContextMenu:not([addMenu~="mailto"]) .addMenu[condition~="mailto"],
#contentAreaContextMenu:not([addMenu~="image"])  .addMenu[condition~="image"],
#contentAreaContextMenu:not([addMenu~="canvas"])  .addMenu[condition~="canvas"],
#contentAreaContextMenu:not([addMenu~="media"])  .addMenu[condition~="media"],
#contentAreaContextMenu:not([addMenu~="input"])  .addMenu[condition~="input"],
#contentAreaContextMenu[addMenu~="select"] .addMenu[condition~="noselect"],
#contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="nolink"],
#contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="nomailto"],
#contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="noimage"],
#contentAreaContextMenu[addMenu~="canvas"]  .addMenu[condition~="nocanvas"],
#contentAreaContextMenu[addMenu~="media"]  .addMenu[condition~="nomedia"],
#contentAreaContextMenu[addMenu~="input"]  .addMenu[condition~="noinput"],
#contentAreaContextMenu:not([addMenu=""])  .addMenu[condition~="normal"]
  { display: none; }
#toolbar-context-menu:not([addMenu~="menubar"]) .addMenu[condition~="menubar"],
#toolbar-context-menu:not([addMenu~="tabs"]) .addMenu[condition~="tabs"],
#toolbar-context-menu:not([addMenu~="navbar"]) .addMenu[condition~="navbar"],
#toolbar-context-menu:not([addMenu~="personal"]) .addMenu[condition~="personal"],
#toolbar-context-menu:not([addMenu~="button"]) .addMenu[condition~="button"],
#toolbar-context-menu[addMenu~="menubar"] .addMenu[condition~="nomenubar"],
#toolbar-context-menu[addMenu~="tabs"] .addMenu[condition~="notabs"],
#toolbar-context-menu[addMenu~="navbar"] .addMenu[condition~="nonavbar"],
#toolbar-context-menu[addMenu~="personal"] .addMenu[condition~="nopersonal"],
#toolbar-context-menu[addMenu~="button"] .addMenu[condition~="nobutton"],
#toolbar-context-menu:not([addMenu=""]) .addMenu[condition~="normal"]
  { display: none !important; }
.addMenu-insert-point
  { display: none !important; }
.addMenu[url] {
  list-style-image: url("chrome://mozapps/skin/places/defaultFavicon.png");
}
.addMenu.exec,
.addMenu[exec] {
  list-style-image: url("chrome://devtools/content/debugger/images/window.svg");
}
.addMenu.copy,
menuitem.addMenu[text]:not([url]):not([keyword]):not([exec])
{
  list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik00IDJDMi44OTUgMiAyIDIuODk1IDIgNEwyIDE3QzIgMTcuNTUyIDIuNDQ4IDE4IDMgMThDMy41NTIgMTggNCAxNy41NTIgNCAxN0w0IDRMMTcgNEMxNy41NTIgNCAxOCAzLjU1MiAxOCAzQzE4IDIuNDQ4IDE3LjU1MiAyIDE3IDJMNCAyIHogTSA4IDZDNi44OTUgNiA2IDYuODk1IDYgOEw2IDIwQzYgMjEuMTA1IDYuODk1IDIyIDggMjJMMjAgMjJDMjEuMTA1IDIyIDIyIDIxLjEwNSAyMiAyMEwyMiA4QzIyIDYuODk1IDIxLjEwNSA2IDIwIDZMOCA2IHogTSA4IDhMMjAgOEwyMCAyMEw4IDIwTDggOCB6Ii8+PC9zdmc+);
  -moz-image-region: rect(0pt, 16px, 16px, 0px);
}
.addMenu.checkbox .menu-iconic-icon {
  -moz-appearance: checkbox;
}
.addMenu > .menu-iconic-left {
  -moz-appearance: menuimage;
}
.addMenu > .menu-iconic-left > .menu-iconic-icon {
    -moz-context-properties: fill, fill-opacity !important;
    fill: currentColor !important;
}
menugroup.addMenu {
  padding-bottom: 2px;
}
menugroup.addMenu > .menuitem-iconic.fixedSize {
    -moz-box-flex: 0;
}
menugroup.addMenu > .menuitem-iconic.noIcon > .menu-iconic-left {
    display: none !important;
}
menugroup.addMenu > .menuitem-iconic {
  -moz-box-flex: 1;
  -moz-box-pack: center;
  -moz-box-align: center;
  padding-block: 0.5em;
  padding-inline-start: 1em; 
}
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left {
  -moz-appearance: none;
  padding-top: 2px;
}
menugroup.addMenu > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
  width: 16px;
  height: 16px;
}
menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-text,
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child) > .menu-iconic-text,
menugroup.addMenu > .menuitem-iconic > .menu-accel-container {
  display: none;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) {
    padding-left: 0;
    -moz-box-flex: 0;
}
menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > .menu-iconic-left {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
}
#addMenu-app-insertpoint+toolbarseparator {
    display: none;
}
`);