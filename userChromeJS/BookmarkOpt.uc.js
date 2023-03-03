// ==UserScript==
// @name            BookmarkOpt.uc.js
// @description     书签操作增强，添加书签到此处/更新书签，复制标题，复制Markdown格式链接，增加显示/隐藏书签工具栏按钮
// @author          Ryan
// @include         main
// @include         chrome://browser/content/places/places.xhtml
// @include         chrome://browser/content/places/places.xul
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/bookmarks/bookmarksPanel.xul
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/places/historySidebar.xul
// @version         1.3.4
// @shutdown        window.BookmarkOpt.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @version         1.3.4 新增中建点击添加书签功能（userChromeJS.BookmarkOpt.insertBookmarkByMiddleClick，默认不启用）
// @version         1.3.3 还原显示隐藏书签工具栏按钮
// @version         1.3.2 增加双击地址栏显示/隐藏书签工具栏的开关（userChromeJS.BookmarkOpt.doubleClickToShow）
// @version         1.3.1 去除显示隐藏书签工具栏按钮
// @version         1.3 尝试兼容 Firefox 57+
// @version         1.2.2 修改界面语言读取方式
// @version         1.2.1 新增显示隐藏书签工具栏按钮
// @version         1.2 修复黑夜模式更新书签图标不变色，增加获取 GUID
// @version         1.1 修复无法热插拔，添加书签使用新 API、修复部分情况无法添加，复制标题和复制链接支持书签文件夹和历史分类，临时移除双击地址栏 显示/隐藏书签工具栏
// @version         1.0 初始化版本
// ==/UserScript==
(function (css) {
    var firstUpperCase = ([first, ...rest]) => first ? first.toUpperCase() + rest.join('') : '';

    const LANG = {
        'zh-CN': {
            "add bookmark here": "添加书签到此处",
            "add bookmark here tooltip": "左键：添加到最后\nShift+左键：添加到最前",
            "update current bookmark": "替换为当前网址",
            "update current bookmark tooltip": "左键：替换当前网址\n中键：替换当前地址和标题\n右键：替换当前网址和自定义当前标题",
            "update current bookmark prompt": "更新当前书签标题，原标题为：\n %s",
            "copy bookmark title": "复制标题",
            "copy bookmark link": "复制链接",
            "show node type": "节点类型",
            "show node guid": "节点 ID",
            "toggle personalToolbar": "显示/隐藏书签工具栏"
        },
        'en-US': {
            "add bookmark here": "Add Bookmark Here",
            "add bookmark here tooltip": "Left click: add bookmark to the end.\nShift + Left click: add bookmark to the first.",
            "update current bookmark tooltip": "Left click：replace with current url\nMiddle click：replace with current title and bookmark\nRight click：replace with current url and custom title.",
            "update current bookmark prompt": "Update current bookmark's title, original title is \n %s",
            "copy bookmark title": "Copy Title",
            "copy bookmark link": "Copy URL",
            "show node type": "Node type",
            "show node guid": "Node guid",
            "toggle personalToolbar": "Toggle PersonalToolbar"
        }
    }



    // 右键菜单
    const PLACES_CONTEXT_ITEMS = [{
        id: 'placesContext_add:bookmark',
        label: $L("add bookmark here"),
        tooltiptext: $L("add bookmark here tooltip"),
        accesskey: "h",
        insertBefore: "placesContext_show_bookmark:info",
        condition: "toolbar folder bookmark",
        oncommand: "window.BookmarkOpt.operate(event, 'add', this.parentNode.triggerNode)"
    }, {
        id: "placesContext_update_bookmark:info",
        label: $L("update current bookmark"),
        tooltiptext: $L("update current bookmark tooltip"),
        accesskey: "u",
        insertBefore: "placesContext_show_bookmark:info",
        condition: "bookmark",
        oncommand: "window.BookmarkOpt.operate(event, 'update', this.parentNode.triggerNode)",
    }, {
        id: "placesContext_copyTitle",
        label: $L("copy bookmark title"),
        insertBefore: "placesContext_paste_group",
        condition: "container uri",
        accesskey: "A",
        oncommand: "window.BookmarkOpt.operate(event, 'copyTitle', this.parentNode.triggerNode)",
    }, {
        id: "placesContext_copyLink",
        label: $L("copy bookmark link"),
        insertBefore: "placesContext_paste_group",
        condition: "container uri",
        accesskey: "L",
        text: "[%TITLE%](%URL%)",
        oncommand: "window.BookmarkOpt.operate(event, 'copyUrl', this.parentNode.triggerNode)",
        accesskey: "L"
    }, {
        class: 'placesContext_showNodeInfo',
        label: $L("show node type"),
        condition: 'shift',
        oncommand: 'window.BookmarkOpt.operate(event, "nodeType")',
        insertBefore: 'placesContext_openSeparator',
        style: 'list-style-image: url(chrome://global/skin/icons/info.svg)',
    }, {
        class: 'placesContext_showNodeInfo',
        label: $L("show node guid"),
        condition: 'shift',
        oncommand: 'window.BookmarkOpt.operate(event, "nodeGuid")',
        insertBefore: 'placesContext_openSeparator',
        style: 'list-style-image: url(chrome://global/skin/icons/info.svg)',
    }];

    // 书签弹出面板菜单
    const PLACES_POPUP_ITEMS = [{
        'label': $L("add bookmark here"),
        'tooltiptext': $L("add bookmark here tooltip"),
        'image': "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        oncommand: "window.BookmarkOpt.operate(event, 'panelAdd', this.parentNode)"
    }, {

    }];

    const BTN_CFG = {
        id: "BookmarkOpt-Toggle-PersonalToolbar",
        label: $L("toggle personalToolbar"),
        tooltiptext: $L("toggle personalToolbar"),
        style: 'list-style-image: url("chrome://browser/skin/bookmarks-toolbar.svg");',
        class: 'toolbarbutton-1 chromeclass-toolbar-additional',
        onclick: function (event) {
            event.target.disabled = true;
            var t = setTimeout(function () {
                clearTimeout(t);
                const toolbar = event.target.ownerDocument.getElementById("PersonalToolbar");
                event.target.ownerGlobal.setToolbarVisibility(toolbar, toolbar.collapsed);
                event.target.disabled = false;
            }, 50);
        }
    }

    window.BookmarkOpt = {
        items: [],
        get topWin() {
            const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            return wm.getMostRecentWindow("navigator:browser");
        },
        get isMain() {
            return location.href.startsWith("chrome://browser/content/browser.x");
        },
        addPlacesContextItems: function (ins) {
            PLACES_CONTEXT_ITEMS.forEach(p => {
                let item = $C('menuitem', p, document);
                if (!p.condition) item.setAttribute('condition', 'normal');
                this.items.push(item);
                var refNode = ($(p.insertBefore) || ins || $('#placesContext').firstChild);
                if (!refNode.classList.contains('menuitem-iconic')) {
                    item.classList.remove('menuitem-iconic');
                }
                refNode.before(item);
            });
        },
        handlePlacesContextEvent: function (event) {
            let target = event.target;
            if (event.type === 'popuphidden') {
                target.removeAttribute("bmopt");
            } else if (event.type === 'popupshowing') {
                target.querySelectorAll(".bmopt").forEach(m => m.removeAttribute('hidden'));
                target.querySelectorAll(".bmopt").forEach(m => m.removeAttribute('disabled'));
                let state = [],
                    triggerNode = event.currentTarget.triggerNode,
                    view = PlacesUIUtils.getViewForNode(triggerNode),
                    aNode = view ? view.selectedNode : {};
                if (triggerNode.id == "PlacesToolbarItems") {
                    state.push("toolbar");
                } else {
                    ['bookmark', 'container', 'day', 'folder', 'historyContainer', 'host', 'query', 'separator', 'tagQuery'].forEach(condition => {
                        eval("if (PlacesUtils.nodeIs" + firstUpperCase(condition) + "(aNode)) state.push(condition)");
                    });
                    if (PlacesUtils.nodeIsURI(aNode)) state.push("uri");
                }
                if (event.shiftKey) state.push('shift');
                target.setAttribute("bmopt", state.join(" "));
            }
        },
        handlePlacesToolbarEvent: (event) => {
            let { target } = event;
            if (event.type === 'popuphidden') {
                // 防止影响其他方式添加书签
                BookmarkOpt.clearPanelItems(target, true);
            } else if (event.type === 'popupshowing') {
                let firstItem = target.firstChild;
                if (firstItem && firstItem.classList.contains('bmopt-panel')) return;
                let last;
                PLACES_POPUP_ITEMS.forEach(c => {
                    let item;
                    if (c.label) {
                        item = $C('menuitem', c, event.target.ownerDocument);
                        item.classList.add('bmopt-panel');
                    } else {
                        item = $C('menuseparator', {
                            'class': 'bmopt-separator'
                        }, event.target.ownerDocument);
                    }
                    if (last) {
                        last.after(item);
                    } else {
                        firstItem.parentNode.insertBefore(item, firstItem);
                    }
                    last = item;
                });
            } else if (event.type === "click" && event.button === 1) {
                if (Services.prefs.getBoolPref("userChromeJS.BookmarkOpt.insertBookmarkByMiddleClick", false)) {
                    event.preventDefault();
                    event.stopPropagation();
                    window.BookmarkOpt.operate(event, 'panelAdd', target);
                }
            }
        },
        clearPanelItems: function (target, doNotRecursive = false) {
            var menuitems = (target || document).querySelectorAll((doNotRecursive ? ":scope>" : "") + "[class*='bmopt']");
            for (let menuitem of menuitems) {
                menuitem.parentNode.removeChild(menuitem);
            }
        },
        operate: function (event, aMethod, aTriggerNode) {
            let popupNode = aTriggerNode || PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
            if (!popupNode) return;
            let view = PlacesUIUtils.getViewForNode(popupNode),
                aNode;

            if (view && view.selectedNode) {
                aNode = view.selectedNode;
            } else {
                aNode = popupNode._placesNode;
            }

            let aWin = BookmarkOpt.topWin,
                currentTitle = aWin.gBrowser.contentTitle,
                currentUrl = aWin.gBrowser.currentURI.spec,
                nodeIsFolder = PlacesUtils.nodeIsFolder(aNode),
                nodeIsHistoryFolder = PlacesUtils.nodeIsHistoryContainer(aNode),
                panelTriggered = false;

            switch (aMethod) {
                case 'panelAdd':
                    BookmarkOpt.clearPanelItems(aTriggerNode);
                    panelTriggered = true;
                case 'add':
                    var info = {
                        title: currentTitle,
                        url: currentUrl,
                        index: nodeIsFolder ? (event.shiftKey ? 0 : PlacesUtils.bookmarks.DEFAULT_INDEX) : (event.shiftKey ? aNode.bookmarkIndex : aNode.bookmarkIndex + 1),
                        parentGuid: nodeIsFolder ? aNode.targetFolderGuid || aNode.bookmarkGuid : aNode.parent.targetFolderGuid || aNode.parent.bookmarkGuid
                    };
                    try {
                        PlacesUtils.bookmarks.insert(info);
                    } catch (e) {
                        aWin.console.error(e);
                    }
                    if (panelTriggered) {
                        closeMenus(aTriggerNode);
                    }
                    break;
                case 'update':
                    if (!aNode.bookmarkGuid) return;
                    var info = {
                        guid: aNode.bookmarkGuid,
                        title: aNode.title,
                        url: currentUrl,
                    }
                    if (event.button === 1) {
                        info.title = currentTitle;
                    } else if (event.button === 2) {
                        const title = window.prompt($L("update current bookmark prompt", aNode.title), currentTitle);
                        if (title === null) return;
                        if (title !== aNode.title)
                            info.title = title;
                    }
                    try {
                        PlacesUtils.bookmarks.update(info);
                    } catch (e) {
                        aWin.console.error(e);
                    }
                    break;
                case 'copyTitle':
                    var format = "%TITLE%"
                case 'copyUrl':
                case 'copy':
                    format || (format = event.target.getAttribute("text") || "%URL%")
                    let strs = [];
                    if (aNode.hasChildren) {
                        // aNode.childChild will cause error, use follow lines instead
                        let folder = nodeIsHistoryFolder ? aNode : PlacesUtils.getFolderContents(aNode.targetFolderGuid).root;
                        for (let i = 0; i < folder.childCount; i++) {
                            strs.push(convertText(folder.getChild(i), format));
                        }
                    } else {
                        strs.push(convertText(aNode, format));
                    }
                    copyText(strs.join("\n"));
                    function convertText(node, text) {
                        return text.replace(BookmarkOpt.regexp, function (str) {
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
                                case "%TITLE%":
                                    return node.title.replaceAll(/\[/g, "【").replaceAll(/\]/g, "】");
                                case "%U":
                                case "%URL%":
                                    return node.uri;
                                case "%H":
                                case "%HOST%":
                                    throw new Error("Not yet implemented");
                                    break;
                            }
                        }
                    }
                    break;
                case 'nodeType':
                    let state = [];
                    ['bookmark', 'container', 'day', 'folder', 'historyContainer', 'host', 'query', 'separator', 'tagQuery'].forEach(condition => {
                        eval("if (PlacesUtils.nodeIs" + firstUpperCase(condition) + "(aNode)) state.push(condition)");
                    });
                    if (PlacesUtils.nodeIsURI(aNode)) state.push('uri');
                    alert(state.join(" "));
                    break;
                case 'nodeGuid':
                    alert(aNode.bookmarkGuid);
                    break;
            }
        },
        handleUrlBarEvent: (event) => {
            let { target, button } = event;
            switch (event.type) {
                case 'dblclick':
                    if (Services.prefs.getBoolPref("userChromeJS.BookmarkOpt.doubleClickToShow", true)) {
                        if (target.id === "urlbar-input" && button == 0) {
                            var bar = target.ownerGlobal.document.getElementById("PersonalToolbar");
                            target.ownerGlobal.setToolbarVisibility(bar, bar.collapsed);
                        }
                    }
                    break;
            }
        },
        init: function () {
            let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
            let rTITLE = "%TITLE" + he + "%|%t\\b";
            let rURL = "%URL" + he + "%|%u\\b";
            let rHOST = "%HOST" + he + "%|%h\\b";
            this.rTITLE = new RegExp(rTITLE, "i");
            this.rURL = new RegExp(rURL, "i");
            this.rHOST = new RegExp(rHOST, "i");
            this.regexp = new RegExp(
                [rTITLE, rURL, rHOST].join("|"), "ig");

            this.addPlacesContextItems($("placesContext_createBookmark"));
            $('placesContext').addEventListener('popupshowing', this.handlePlacesContextEvent, false);
            $('placesContext').addEventListener('popuphidden', this.handlePlacesContextEvent, false);
            if (this.isMain) {
                $('PlacesToolbarItems').addEventListener('popupshowing', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').addEventListener('popuphidden', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').addEventListener('click', this.handlePlacesToolbarEvent, false);
                document.getElementById('urlbar').addEventListener('dblclick', BookmarkOpt.handleUrlBarEvent, false);

                if (typeof BTN_CFG !== 'undefined' && 'id' in BTN_CFG) {
                    if (!(CustomizableUI.getWidget(BTN_CFG.id) && CustomizableUI.getWidget(BTN_CFG.id).forWindow(window)?.node)) {
                        CustomizableUI.createWidget({
                            id: BTN_CFG.id,
                            removable: true,
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onCreated: node => {
                                $A(node, BTN_CFG);
                            }
                        });
                    }
                }
            }
            this.style = addStyle(css);
        },
        destroy: function () {
            $('placesContext').removeEventListener('popupshowing', this.handlePlacesContextEvent, false);
            $('placesContext').removeEventListener('popuphidden', this.handlePlacesContextEvent, false);
            $('placesContext').removeAttribute('bmopt');
            this.items.forEach(element => {
                element.remove();
            });
            if (this.isMain) {
                if (typeof BTN_CFG !== 'undefined' && 'id' in BTN_CFG) {
                    CustomizableUI.destroyWidget(BTN_CFG.id);
                }
                this.clearPanelItems(this.topWin.document);
                let m = $("BookmarOpt-menu-options");
                if (m) m.parentNode.removeChild(m);
                $('PlacesToolbarItems').removeEventListener('popupshowing', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').removeEventListener('popuphidden', this.handlePlacesToolbarEvent, false);
                $('PlacesToolbarItems').removeEventListener('click', this.handlePlacesToolbarEvent, false);
                document.getElementById('urlbar').removeEventListener('dblclick', BookmarkOpt.handleUrlBarEvent, false);
                if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
                delete window.BookmarkOpt;
            }
        }
    }

    function $(id, aDoc) {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }

    function $C(type, props = {}, aDoc) {
        const appVersion = Services.appinfo.version.split(".")[0];
        var el;
        if (appVersion >= 69) {
            el = aDoc.createXULElement(type);
        } else {
            el = aDoc.createElement(type);
        }
        el = $A(el, props);
        el.classList.add('bmopt');
        if (type === "menu" || type === "menuitem") {
            el.classList.add(type + "-iconic");
        }
        return el;
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

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    function copyText(aText) {
        const cHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
        cHelper.copyString(aText);
    }

    function $L(key, replace) {
        const _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN");
        let str = LANG[_LOCALE].hasOwnProperty(key) ? LANG[_LOCALE][key] : (LANG['en-US'].hasOwnProperty(key) ? LANG['en-US'][key] : "undefined");
        if (typeof str === "undefined") {
            str = firstUpperCase(key);
        }
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str;
    }

    window.BookmarkOpt.init();
})(`
.bmopt-separator+menuseparator{
    display: none;
}
#placesContext .bmopt[condition] {
    visibility: collapse;
}
#placesContext[bmopt~="bookmark"] .bmopt[condition~="bookmark"],
#placesContext[bmopt~="container"] .bmopt[condition~="container"],
#placesContext[bmopt~="day"] .bmopt[condition~="day"],
#placesContext[bmopt~="folder"] .bmopt[condition~="folder"],
#placesContext[bmopt~="historyContainer"] .bmopt[condition~="historyContainer"],
#placesContext[bmopt~="host"] .bmopt[condition~="host"],
#placesContext[bmopt~="query"] .bmopt[condition~="query"],
#placesContext[bmopt~="separator"] .bmopt[condition~="separator"],
#placesContext[bmopt~="tagQuery"] .bmopt[condition~="tagQuery"],
#placesContext[bmopt~="uri"] .bmopt[condition~="uri"],
#placesContext[bmopt~="toolbar"] .bmopt[condition~="toolbar"],
#placesContext[bmopt~="shift"] .bmopt[condition~="shift"] {
    visibility: visible;
}
`)