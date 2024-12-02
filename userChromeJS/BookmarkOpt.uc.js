// ==UserScript==
// @name            BookmarkOpt.uc.js
// @long-description
// @description
/*
书签操作增强

添加书签到此处/更新书签，复制标题，复制Markdown格式链接，增加显示/隐藏书签工具栏按钮，中按点击书签工具栏文件夹收藏当前页面到该文件夹下,书签工具栏更多菜单自动适应弹出位置，Shift+右键可复制查看内部 ID

开关：
userChromeJS.BookmarkOpt.enableToggleButton: 显示/隐藏书签工具栏按钮
userChromeJS.BookmarkOpt.doubleClickToShow: 双击地址栏切换书签工具栏
userChromeJS.BookmarkOpt.insertBookmarkByMiddleClickIconOnly: 中键点击书签工具栏的图标（书签，文件夹均可）添加书签
*/
// @author          Ryan
// @
// @include         main
// @include         chrome://browser/content/places/places.xhtml
// @include         chrome://browser/content/places/places.xul
// @include         chrome://browser/content/places/bookmarksSidebar.xhtml
// @include         chrome://browser/content/bookmarks/bookmarksPanel.xul
// @include         chrome://browser/content/places/historySidebar.xhtml
// @include         chrome://browser/content/history/history-panel.xul
// @version         1.4.3
// @compatibility   Firefox 74
// @shutdown        window.BookmarkOpt.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            1.4.3 修复 1.4.1 无效修复的问题
// @note            1.4.2 Bug 1904909
// @note            1.4.1 修复中键添加书签任何位置也会添加书签的 BUG，修复快速点击中键两次导致图标无法回复的 BUG
// @note            1.4.0 重写，中键点击图标添加书签后当前书签图标显示为成功图标，1s后自动恢复，移除无用的 userChromeJS.BookmarkOpt.insertBookmarkByMiddleClick 开关，增加 userChromeJS.BookmarkOpt.enableToggleButton 开关（用于控制 显示/隐藏书签工具栏按钮），去除中键单击地址栏复制当前地址
// @note            1.3.8 添加书签到此处支持 PlacesChevron
// @note            1.3.7 中键单击地址栏复制当前地址，修改切换书签栏按钮图标
// @note            1.3.6 书签工具栏更多菜单自动适应弹出位置
// @note            1.3.5 新增中建点击图标才添加书签的功能（userChromeJS.BookmarkOpt.insertBookmarkByMiddleClickIconOnly，默认不启用）
// @note            1.3.4 新增中建点击添加书签功能（userChromeJS.BookmarkOpt.insertBookmarkByMiddleClick，默认不启用）
// @note            1.3.3 还原显示隐藏书签工具栏按钮
// @note            1.3.2 增加双击地址栏显示/隐藏书签工具栏的开关（userChromeJS.BookmarkOpt.doubleClickToShow）
// @note            1.3.1 去除显示隐藏书签工具栏按钮
// @note            1.3 尝试兼容 Firefox 57+
// @note            1.2.2 修改界面语言读取方式
// @note            1.2.1 新增显示隐藏书签工具栏按钮
// @note            1.2 修复黑夜模式更新书签图标不变色，增加获取 GUID
// @note            1.1 修复无法热插拔，添加书签使用新 API、修复部分情况无法添加，复制标题和复制链接支持书签文件夹和历史分类，临时移除双击地址栏 显示/隐藏书签工具栏
// @note            1.0 初始化版本
// ==/UserScript==
(async function (css, imp, ucfirst, add_style, copy_text, $, create_el, add_events, remove_events) {
    const Services = imp("Services");
    const PlacesUIUtils = imp("PlacesUIUtils");
    const PlacesUtils = imp("PlacesUtils");
    // Bug 1904909 PlacesUtils::GatherDataText and GatherDataHtml should not recurse into queries
    if (typeof PlacesUtils.nodeIsFolder === "undefined") PlacesUtils.nodeIsFolder = PlacesUtils.nodeIsFolderOrShortcut;
    const LANG = {
        'zh-CN': {
            "add bookmark here": "添加书签到此处",
            "add bookmark here tooltip": "左键：添加到最后\nShift+左键：添加到最前",
            "update current bookmark": "替换为当前网址",
            "update current bookmark tooltip": "左键：替换当前网址\n中键：替换当前地址和标题\n右键：替换当前网址和自定义当前标题",
            "update current bookmark prompt": "更新当前书签标题，原标题为：\n %s",
            "copy bookmark title": "复制标题",
            "copy bookmark link": "复制链接 [MARKDOWN]",
            "show node type": "节点类型",
            "show node guid": "节点 ID",
            "toggle personalToolbar": "显示/隐藏书签工具栏",
            "auto hide": "自动隐藏"
        },
        'en-US': {
            "add bookmark here": "Add Bookmark Here",
            "add bookmark here tooltip": "Left click: add bookmark to the end.\nShift + Left click: add bookmark to the first.",
            "update current bookmark tooltip": "Left click：replace with current url\nMiddle click：replace with current title and bookmark\nRight click：replace with current url and custom title.",
            "update current bookmark prompt": "Update current bookmark's title, original title is \n %s",
            "copy bookmark title": "Copy Title",
            "copy bookmark link": "Copy URL [MARKDOWN]",
            "show node type": "Node type",
            "show node guid": "Node guid",
            "toggle personalToolbar": "Toggle PersonalToolbar",
            "auto hide": "Auto hide"
        }
    }

    let _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN");
    const LOCALE = LANG.hasOwnProperty(_LOCALE) ? _LOCALE : 'zh-CN'

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

    if (window.BookmarkOpt) {
        window.BookmarkOpt.destroy();
        delete window.BookmarkOpt;
    }

    var isMouseDown = false;

    window.BookmarkOpt = {
        items: [],
        get topWin () {
            return Services.wm.getMostRecentWindow("navigator:browser");
        },
        X_MAIN: 'chrome://browser/content/browser.xhtml',
        X_PLACES: 'chrome://browser/content/places/places.xhtml',
        XUL_PLACES: 'chrome://browser/content/places/places.xul',
        X_BOOKMARK_SB: 'chrome://browser/content/places/bookmarksSidebar.xhtml',
        XUL_BOOKMARK_SB: 'chrome://browser/content/bookmarks/bookmarksPanel.xul',
        X_HISTORY_SB: 'chrome://browser/content/places/historySidebar.xhtml',
        XUL_HISTORY_SB: 'chrome://browser/content/history/history-panel.xul',
        init () {
            let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
            let rTITLE = "%TITLE" + he + "%|%t\\b";
            let rURL = "%URL" + he + "%|%u\\b";
            let rHOST = "%HOST" + he + "%|%h\\b";
            this.rTITLE = new RegExp(rTITLE, "i");
            this.rURL = new RegExp(rURL, "i");
            this.rHOST = new RegExp(rHOST, "i");
            this.regexp = new RegExp(
                [rTITLE, rURL, rHOST].join("|"), "ig");

            if (!this.style) {
                this.style = add_style(css);
            }
            switch (location.href) {
                case this.X_MAIN:
                    if (!$("urlbar").getAttribute("bmopt-inited")) {
                        add_events($('urlbar'), ['dblclick'], this, false);
                        $('urlbar').setAttribute('bmopt-inited', true);
                    }
                    if (!$("PlacesToolbar").getAttribute("bmopt-inited")) {
                        add_events($('PlacesToolbar'), ['popupshowing', 'popuphidden'], this, false);
                        $('PlacesToolbar').setAttribute('bmopt-inited', true);
                        this.PlacesChevronObserver = new MutationObserver(mutations => {
                            mutations.forEach(mutation => {
                                if (mutation.type === 'attributes' && mutation.attributeName === 'collapsed') {
                                    if (mutation.target.getAttribute("collapsed") === "true") {
                                        this.isObservingPlacesChevron = false;
                                        remove_events(mutation.target, ['mouseover'], this, false);
                                    } else {
                                        this.isObservingPlacesChevron = true;
                                        add_events(mutation.target, ['mouseover'], this, false);
                                    }
                                }
                            })
                        });
                        this.PlacesChevronObserver.observe(document.getElementById("PlacesChevron"), { attributes: true });
                        add_events($('PlacesChevronPopup'), ['popuphidden'], this, false);
                    }
                    if ($('PlacesToolbarItems')) {
                        add_events($('PlacesToolbarItems'), ['mousedown', 'click'], this, false);
                        add_events(document, ['mouseup'], this, false);
                    }
                    if (Services.prefs.getBoolPref("userChromeJS.BookmarkOpt.enableToggleButton", false)) {
                        if (!(CustomizableUI.getWidget('BookmarkOpt-Toggle-PersonalToolbar') && CustomizableUI.getWidget('BookmarkOpt-Toggle-PersonalToolbar').forWindow(window)?.node)) {
                            CustomizableUI.createWidget({
                                id: 'BookmarkOpt-Toggle-PersonalToolbar',
                                removable: true,
                                defaultArea: CustomizableUI.AREA_NAVBAR,
                                type: "custom",
                                onBuild: (doc) => {
                                    let btn = create_el('toolbarbutton', {
                                        id: 'BookmarkOpt-Toggle-PersonalToolbar',
                                        label: $L("toggle personalToolbar"),
                                        tooltiptext: $L("toggle personalToolbar"),
                                        style: 'list-style-image: url("chrome://browser/skin/bookmarks-toolbar.svg");',
                                        class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                                    }, doc);
                                    add_events(btn, ['click'], this, false);
                                    return btn;
                                }
                            })
                        }
                    }
                case this.X_PLACES:
                case this.XUL_PLACES:
                case this.X_BOOKMARK_SB:
                case this.XUL_BOOKMARK_SB:
                case this.X_HISTORY_SB:
                case this.XUL_HISTORY_SB:
                    if (!$("placesContext").getAttribute("bmopt-inited")) {
                        const ins = $("placesContext_createBookmark");
                        PLACES_CONTEXT_ITEMS.forEach(prop => {
                            let item = create_el('menuitem', prop, document);
                            if (!prop.condition) item.setAttribute('condition', 'normal');
                            this.items.push(item);
                            var refNode = ($(prop.insertBefore) || ins || $('#placesContext').firstChild);
                            if (!refNode.classList.contains('menuitem-iconic')) {
                                item.classList.remove('menuitem-iconic');
                            }
                            refNode.before(item);
                        });
                        add_events($("placesContext"), ['popupshowing', 'popuphidden'], this, false);
                    }
                    break;
            }
        },
        destroy () {
            if (this.style && this.style.parentNode) {
                this.style.parentNode.removeChild(this.style);
                this.style = null;
            }
            switch (location.href) {
                case this.X_MAIN:
                    remove_events($('urlbar'), ['dblclick'], this, false);
                    $('urlbar').removeAttribute('bmopt-inited');
                    this.items.forEach(item => {
                        item.parentNode.removeChild(item);
                    })
                    remove_events($('PlacesToolbar'), ['popupshowing', 'popuphidden'], this, false);
                    if ($('PlacesToolbar')) {
                        $('PlacesToolbar').removeAttribute('bmopt-inited');
                        remove_events($('PlacesChevronPopup'), ['popuphidden'], this, false);
                        try {
                            CustomizableUI.destroyWidget("BookmarkOpt-Toggle-PersonalToolbar");
                        } catch (ex) { }
                    }
                    if ($('PlacesToolbarItems')) {
                        remove_events($('PlacesToolbarItems'), ['mousedown', 'click', this]);
                        remove_events(document, ['mouseup'], this, false);
                    }
                    if (this.PlacesChevronObserver) {
                        this.PlacesChevronObserver.disconnect();
                    }
                case this.X_PLACES:
                case this.XUL_PLACES:
                case this.X_BOOKMARK_SB:
                case this.XUL_BOOKMARK_SB:
                case this.X_HISTORY_SB:
                case this.XUL_HISTORY_SB:
                    remove_events($("placesContext"), ['popupshowing', 'popuphidden'], this, false);
                    $('placesContext').removeAttribute('bmopt-inited');
                    this.clearPanelItems(document);
                    break;
            }
        },
        handleEvent (event) {
            const { target, button, type } = event;
            const { document: doc, setToolbarVisibility } = target.ownerGlobal;
            switch (type) {
                case 'click':
                    if (button == 1 && isMouseDown) {
                        let addBookmark = false;
                        if (Services.prefs.getBoolPref("userChromeJS.BookmarkOpt.insertBookmarkByMiddleClickIconOnly", false)
                            && !target.hasAttribute("query") /* 排除最近访问 */
                        ) {
                            let targetRect = target.getBoundingClientRect();
                            let x = event.clientX - target.getBoundingClientRect().left; // 鼠标点击位置相对于当前书签
                            let icon = target.tagName.toLowerCase() === "toolbarbutton" ? target.querySelector(":scope>image") : target.firstChild;
                            let iconRect = icon.getBoundingClientRect();
                            let paddingLeft = iconRect.left - targetRect.left;
                            if (x < paddingLeft + iconRect.width) {
                                // 点击的是标签，不覆盖默认的功能：打开全部
                                addBookmark = true;
                            }
                        }
                        if (addBookmark) {
                            event.preventDefault();
                            event.stopPropagation();
                            this.operate(event, 'add', target, (...args) => {
                                let icon = target.tagName === "toolbarbutton" ? target.querySelector(":scope>image") : target.firstChild.firstChild;
                                if (icon.hasAttribute('src') && !icon.getAttribute('src').endsWith('N3oiLz48L3N2Zz4=')) {
                                    icon.setAttribute('original-src', icon.getAttribute('src'));
                                }
                                icon.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InNjYWxlKDEuMSkiPjxsaW5lYXJHcmFkaWVudCBpZD0iNXp6TUdWUW5OX1F5UllXR21KVXNRYSIgeDE9IjkuODU4IiB4Mj0iMzguMTQyIiB5MT0iOS44NTgiIHkyPSIzOC4xNDIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMyMWFkNjQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwODgyNDIiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjNXp6TUdWUW5OX1F5UllXR21KVXNRYSkiIGQ9Ik00NCwyNGMwLDExLjA0NS04Ljk1NSwyMC0yMCwyMFM0LDM1LjA0NSw0LDI0UzEyLjk1NSw0LDI0LDRTNDQsMTIuOTU1LDQ0LDI0eiIvPjxwYXRoIGQ9Ik0zMi4xNzIsMTYuMTcyTDIyLDI2LjM0NGwtNS4xNzItNS4xNzJjLTAuNzgxLTAuNzgxLTIuMDQ3LTAuNzgxLTIuODI4LDBsLTEuNDE0LDEuNDE0Yy0wLjc4MSwwLjc4MS0wLjc4MSwyLjA0NywwLDIuODI4bDgsOGMwLjc4MSwwLjc4MSwyLjA0NywwLjc4MSwyLjgyOCwwbDEzLTEzYzAuNzgxLTAuNzgxLDAuNzgxLTIuMDQ3LDAtMi44MjhMMzUsMTYuMTcyQzM0LjIxOSwxNS4zOTEsMzIuOTUzLDE1LjM5MSwzMi4xNzIsMTYuMTcyeiIgb3BhY2l0eT0iLjA1Ii8+PHBhdGggZD0iTTIwLjkzOSwzMy4wNjFsLTgtOGMtMC41ODYtMC41ODYtMC41ODYtMS41MzYsMC0yLjEyMWwxLjQxNC0xLjQxNGMwLjU4Ni0wLjU4NiwxLjUzNi0wLjU4NiwyLjEyMSwwTDIyLDI3LjA1MWwxMC41MjUtMTAuNTI1YzAuNTg2LTAuNTg2LDEuNTM2LTAuNTg2LDIuMTIxLDBsMS40MTQsMS40MTRjMC41ODYsMC41ODYsMC41ODYsMS41MzYsMCwyLjEyMWwtMTMsMTNDMjIuNDc1LDMzLjY0NiwyMS41MjUsMzMuNjQ2LDIwLjkzOSwzMy4wNjF6IiBvcGFjaXR5PSIuMDciLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjEuMjkzLDMyLjcwN2wtOC04Yy0wLjM5MS0wLjM5MS0wLjM5MS0xLjAyNCwwLTEuNDE0bDEuNDE0LTEuNDE0YzAuMzkxLTAuMzkxLDEuMDI0LTAuMzkxLDEuNDE0LDBMMjIsMjcuNzU4bDEwLjg3OS0xMC44NzljMC4zOTEtMC4zOTEsMS4wMjQtMC4zOTEsMS40MTQsMGwxLjQxNCwxLjQxNGMwLjM5MSwwLjM5MSwwLjM5MSwxLjAyNCwwLDEuNDE0bC0xMywxM0MyMi4zMTcsMzMuMDk4LDIxLjY4MywzMy4wOTgsMjEuMjkzLDMyLjcwN3oiLz48L3N2Zz4=');
                                setTimeout(() => {
                                    Array.from(target.querySelectorAll('image[src$="LjcwN3oiLz48L3N2Zz4="]')).forEach(function (aImage) {
                                        if (aImage.hasAttribute('original-src')) {
                                            aImage.setAttribute('src', aImage.getAttribute('original-src'));
                                            aImage.removeAttribute('original-src');
                                        } else {
                                            aImage.removeAttribute('src');
                                        }
                                    });
                                }, 1000);
                            });
                        }
                    }
                    if (target.id !== "BookmarkOpt-Toggle-PersonalToolbar") break;
                case 'dblclick':
                    if (Services.prefs.getBoolPref('userChromeJS.BookmarkOpt.doubleClickToShow', true) || target.id === "BookmarkOpt-Toggle-PersonalToolbar") {
                        target.diabled = true;
                        setTimeout(function () {
                            var bar = $("PersonalToolbar", doc);
                            setToolbarVisibility(bar, !!bar.collapsed);
                            target.disabled = false;
                        }, 50);
                        break;
                    }
                    break;
                case 'popupshowing':
                    if (target.id === 'placesContext') {
                        let state = [],
                            triggerNode = event.currentTarget.triggerNode,
                            view = PlacesUIUtils.getViewForNode(triggerNode),
                            aNode = view ? view.selectedNode : {};

                        if (aNode) {
                            ['bookmark', 'container', 'day', 'folder', 'historyContainer', 'host', 'query', 'separator', 'tagQuery'].forEach(condition => {
                                eval("if (PlacesUtils.nodeIs" + ucfirst(condition) + "(aNode)) state.push(condition)");
                            });
                            if (PlacesUtils.nodeIsURI(aNode)) state.push("uri");
                        }
                        if (event.shiftKey) state.push('shift');
                        target.setAttribute('bmopt', state.join(" "));
                    } else {
                        let firstItem = target.firstChild;
                        if (firstItem && firstItem.classList.contains('bmopt')) return;
                        let last;
                        PLACES_POPUP_ITEMS.forEach(c => {
                            let item;
                            if (c.label) {
                                item = create_el('menuitem', c, doc);
                                item.classList.add('bmopt-panel');
                            } else {
                                item = create_el('menuseparator', {
                                    'class': 'bmopt-separator'
                                }, event.target.ownerDocument);
                            }
                            if (last) {
                                last.after(item);
                            } else if (firstItem) {
                                firstItem.parentNode.insertBefore(item, firstItem);
                            } else {
                                target.appendChild(item);
                            }
                            last = item;
                        });
                    }
                    break;
                case 'popuphidden':
                    if (target.id === "placesContext") {
                        target.setAttribute('bmopt', '');
                    } else {
                        this.clearPanelItems(target, true);
                    }
                    break;
                case 'mousedown':
                    if (button === 1) {
                        if (target.id === "PlacesToolbar" || target.id === "PlacesToolbarItems" || target.id === "PlacesChevron" || (target.classList.contains('bookmark-item') && !target.hasAttribute("query"))) {
                            isMouseDown = true;
                        }
                        !Services.prefs.getBoolPref("browser.bookmarks.openInTabClosesMenu", true) && target.setAttribute("closemenu", "none");
                    }
                    break;
                case 'mouseup':
                    setTimeout(() => {
                        isMouseDown = false;
                    }, 50);
                    break;
                case 'mouseover':
                    if (target.id === "PlacesChevron") {
                        if (target.getAttribute("open") == "true") return;
                        const menupopup = target.querySelector(":scope>menupopup");
                        if (event.clientX > (target.ownerGlobal.innerWidth / 2) && event.clientY < (target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "after_end");
                        } else if (event.clientX < (target.ownerGlobal.innerWidth / 2) && event.clientY > (target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "before_start");
                        } else if (event.clientX > (target.ownerGlobal.innerWidth / 2) && event.clientY > (target.ownerGlobal.innerHeight / 2)) {
                            menupopup.setAttribute("position", "before_start");
                        } else {
                            menupopup.removeAttribute("position", "after_end");
                        }
                    }
                    break;
            }
        },
        clearPanelItems: function (target, do_not_recursive = false) {
            var menuitems = (target || document).querySelectorAll((do_not_recursive ? ":scope>" : "") + "[class*='bmopt']");
            for (let menuitem of menuitems) {
                menuitem.parentNode.removeChild(menuitem);
            }
        },
        operate (event, aMethod, aTriggerNode, callback) {
            let popupNode = aTriggerNode || PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
            if (!popupNode) return;
            let view = PlacesUIUtils.getViewForNode(popupNode),
                aNode;

            if (view && view.selectedNode) {
                aNode = view.selectedNode;
            } else {
                aNode = popupNode._placesNode;
            }

            let aWin = this.topWin,
                currentTitle = aWin.gBrowser.contentTitle,
                currentUrl = aWin.gBrowser.currentURI.spec,
                nodeIsFolder = PlacesUtils.nodeIsFolder(aNode),
                nodeIsHistoryFolder = PlacesUtils.nodeIsHistoryContainer(aNode),
                panelTriggered = false;

            switch (aMethod) {
                case 'panelAdd':
                    // 清除新增的添加到到此处菜单，有可能会影响添加顺序
                    this.clearPanelItems(aTriggerNode);
                    panelTriggered = true;
                case 'add':
                    var info = {
                        title: currentTitle,
                        url: currentUrl,
                        index: nodeIsFolder ? (event.shiftKey ? 0 : PlacesUtils.bookmarks.DEFAULT_INDEX) : (event.shiftKey ? aNode.bookmarkIndex : aNode.bookmarkIndex + 1),
                        parentGuid: nodeIsFolder ? aNode.targetFolderGuid || aNode.bookmarkGuid : aNode.parent.targetFolderGuid || aNode.parent.bookmarkGuid
                    };
                    try {
                        PlacesUtils.bookmarks.insert(info).then((...args) => {
                            if (callback) {
                                callback(...args);
                            }
                        });
                    } catch (e) {
                        aWin.console.error(e);
                    }
                    if (Services.prefs.getBoolPref("browser.bookmarks.openInTabClosesMenu") || panelTriggered) {
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
                        PlacesUtils.bookmarks.update(info).then((...args) => {
                            if (callback) {
                                callback(...args);
                            }
                        });
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
                        let folder = nodeIsHistoryFolder ? aNode : PlacesUtils.getFolderContents(aNode.targetFolderGuid).root;
                        for (let i = 0; i < folder.childCount; i++) {
                            let child = folder.getChild(i);

                            if (PlacesUtils.nodeIsFolder(child)) continue; // 跳过书签文件夹
                            strs.push(convertText(child, format));
                        }
                    } else {
                        strs.push(convertText(aNode, format));
                    }
                    copy_text(strs.join("\n"));
                    if (callback) {
                        callback(...args);
                    }
                    function convertText (node, text) {
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
                        function convert (str) {
                            switch (str) {
                                case "%T":
                                case "%TITLE%":
                                    return node.title.replaceAll(/\[/g, "【").replaceAll(/\]/g, "】");
                                case "%U":
                                case "%URL%":
                                    return node.uri;
                                case "%H":
                                case "%HOST%":
                                    return Services.io.newURI(node.uri, null, null).host;
                                default:
                                    return '';
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
        }
    }

    window.BookmarkOpt.init();
    function $L (key, replace) {
        let str = LANG[LOCALE].hasOwnProperty(key) ? LANG[LOCALE][key] : (LANG['en-US'].hasOwnProperty(key) ? LANG['en-US'][key] : "undefined");
        if (typeof str === "undefined") {
            str = firstUpperCase(key);
        }
        if (typeof replace !== "undefined") {
            str = str.replace("%s", replace);
        }
        return str;
    }
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
    `, function imp (name) {
    if (name in globalThis) return globalThis[name];
    var url = `resource:///modules/${name}.`;
    try { var exp = ChromeUtils.importESModule(url + "sys.mjs"); }
    catch { exp = ChromeUtils.import(url + "jsm"); }
    return exp[name];
}, ([first, ...rest]) => first ? first.toUpperCase() + rest.join('') : '', (css) => {
    const pi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
    );
    return document.insertBefore(pi, document.documentElement);
}, (aText) => {
    const cHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    cHelper.copyString(aText);
}, (id, aDoc) => {
    id = id || "";
    let doc = aDoc || document;
    if (id.includes("[" || id.includes("."))) {
        return doc.querySelector(id);
    }
    return doc.getElementById(id.startsWith("#") ? id.substring(1) : id);
}, (type, props = {}, aDoc) => {
    const el = aDoc.createXULElement(type);
    for (let [key, value] of Object.entries(props)) {
        el.setAttribute(key, value);
    }
    el.classList.add('bmopt');
    if (type === "menu" || type === "menuitem") {
        el.classList.add(type + "-iconic");
    }
    return el;
}, (target, types = [], ...args) => Array.isArray(types) && types.forEach(t => target.addEventListener(t, ...args)),
    (target, types = [], ...args) => Array.isArray(types) && types.forEach(t => target.removeEventListener(t, ...args)));