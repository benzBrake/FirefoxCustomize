// ==UserScript==
// @name           BookmarkOpt.uc.js
// @description    增加添加书签到此处和更新书签
// @author         Ryan
// @include        main
// @version        1.0
// @startup        window.BookmarkOpt.init();
// @shutdown       window.BookmarkOpt.destroy();
// @homepage       https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note           合并 AddBookmarkHere 和 UpdateBookmarkLite
// ==/UserScript==
(function (css) {
    /**
     * 选取 DOM
     * @param {string} id 
     */
    let $ = (id, aDoc) => {
        id = id || "";
        let doc = aDoc || document;
        if (id.startsWith('#')) id = id.substring(1, id.length);
        return doc.getElementById(id);
    }
    /**
     * 创建 Element
     * @param {string} type Element 类型 
     * @param {object} props Element 属性
     * @param {*} aDoc 
     */
    let $C = (type, props = {}, aDoc) => {
        let doc = aDoc || document;
        let el = doc.createXULElement(type);
        for (let p in props) {
            if (type === 'menuitem' && p === 'image') el.classList.add('menuitem-iconic');
            el.setAttribute(p, props[p]);
        }
        return el;
    }

    if (window.BookmarkOpt) {
        window.BookmarkOpt.destroy();
        delete window.BookmarkOpt;
    }

    // 右键菜单
    let PLACES_CONTEXT_ITEMS = [{
        'label': "添加书签到此处",
        'tooltiptext': "左键：添加到最后\nShift+左键：添加到最前",
        'accesskey': "h",
        'image': "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        oncommand: "window.BookmarkOpt.handleEvent(event, 'add')"
    }, {
        'id': "placesContext_update_bookmark:info",
        'label': "替换为当前网址",
        'tooltiptext': '左键：替换当前网址\n中键：替换当前地址和标题\n右键：替换当前网址和自定义当前标题',
        'accesskey': "u",
        'image': "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+DQogIDxwYXRoIGQ9Ik0zMi40NzA3MDMgNS45ODYzMjgxIEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMxLjQzOTQ1MyA2LjQzOTQ1MzFMMjcuNDM5NDUzIDEwLjQzOTQ1MyBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAyNy40Mzk0NTMgMTIuNTYwNTQ3TDMxLjQzOTQ1MyAxNi41NjA1NDcgQSAxLjUwMDE1IDEuNTAwMTUgMCAxIDAgMzMuNTYwNTQ3IDE0LjQzOTQ1M0wzMi4xMjEwOTQgMTNMMzYuNSAxM0MzNy44OTgyMjYgMTMgMzkgMTQuMTAxNzc0IDM5IDE1LjVMMzkgMzMuNUMzOSAzNC44OTgyMjYgMzcuODk4MjI2IDM2IDM2LjUgMzZMMjguNSAzNiBBIDEuNTAwMTUgMS41MDAxNSAwIDEgMCAyOC41IDM5TDM2LjUgMzlDMzkuNTE5Nzc0IDM5IDQyIDM2LjUxOTc3NCA0MiAzMy41TDQyIDE1LjVDNDIgMTIuNDgwMjI2IDM5LjUxOTc3NCAxMCAzNi41IDEwTDMyLjEyMTA5NCAxMEwzMy41NjA1NDcgOC41NjA1NDY5IEEgMS41MDAxNSAxLjUwMDE1IDAgMCAwIDMyLjQ3MDcwMyA1Ljk4NjMyODEgeiBNIDkuNSA2QzcuNTg1MDQ1MiA2IDYgNy41ODUwNDUyIDYgOS41TDYgMTIuNUM2IDE0LjQxNDk1NSA3LjU4NTA0NTIgMTYgOS41IDE2TDIxLjUgMTZDMjMuNDE0OTU1IDE2IDI1IDE0LjQxNDk1NSAyNSAxMi41TDI1IDkuNUMyNSA3LjU4NTA0NTIgMjMuNDE0OTU1IDYgMjEuNSA2TDkuNSA2IHogTSA5LjUgOUwyMS41IDlDMjEuNzk1MDQ1IDkgMjIgOS4yMDQ5NTQ4IDIyIDkuNUwyMiAxMi41QzIyIDEyLjc5NTA0NSAyMS43OTUwNDUgMTMgMjEuNSAxM0w5LjUgMTNDOS4yMDQ5NTQ4IDEzIDkgMTIuNzk1MDQ1IDkgMTIuNUw5IDkuNUM5IDkuMjA0OTU0OCA5LjIwNDk1NDggOSA5LjUgOSB6IE0gOS41IDE5QzcuNTg1MDQ1MiAxOSA2IDIwLjU4NTA0NSA2IDIyLjVMNiAyNS41QzYgMjcuNDE0OTU1IDcuNTg1MDQ1MiAyOSA5LjUgMjlMMjEuNSAyOUMyMy40MTQ5NTUgMjkgMjUgMjcuNDE0OTU1IDI1IDI1LjVMMjUgMjIuNUMyNSAyMC41ODUwNDUgMjMuNDE0OTU1IDE5IDIxLjUgMTlMOS41IDE5IHogTSA5LjUgMjJMMjEuNSAyMkMyMS43OTUwNDUgMjIgMjIgMjIuMjA0OTU1IDIyIDIyLjVMMjIgMjUuNUMyMiAyNS43OTUwNDUgMjEuNzk1MDQ1IDI2IDIxLjUgMjZMOS41IDI2QzkuMjA0OTU0OCAyNiA5IDI1Ljc5NTA0NSA5IDI1LjVMOSAyMi41QzkgMjIuMjA0OTU1IDkuMjA0OTU0OCAyMiA5LjUgMjIgeiBNIDkuNSAzMkM3LjU4NTA0NTIgMzIgNiAzMy41ODUwNDUgNiAzNS41TDYgMzguNUM2IDQwLjQxNDk1NSA3LjU4NTA0NTIgNDIgOS41IDQyTDIxLjUgNDJDMjMuNDE0OTU1IDQyIDI1IDQwLjQxNDk1NSAyNSAzOC41TDI1IDM1LjVDMjUgMzMuNTg1MDQ1IDIzLjQxNDk1NSAzMiAyMS41IDMyTDkuNSAzMiB6IE0gMTAuOTEyMTA5IDM1TDE2LjA4NTkzOCAzNSBBIDEuNSAxLjUgMCAwIDAgMTcuNSAzNiBBIDEuNSAxLjUgMCAwIDAgMTguOTEyMTA5IDM1TDIxLjUgMzVDMjEuNzk1MDQ1IDM1IDIyIDM1LjIwNDk1NSAyMiAzNS41TDIyIDM3LjA4NTkzOCBBIDEuNSAxLjUgMCAwIDAgMjEuNSAzNyBBIDEuNSAxLjUgMCAwIDAgMjAuMDg1OTM4IDM5TDE0LjkxMjEwOSAzOSBBIDEuNSAxLjUgMCAwIDAgMTMuNSAzNyBBIDEuNSAxLjUgMCAwIDAgMTIuMDg1OTM4IDM5TDkuNSAzOUM5LjIwNDk1NDggMzkgOSAzOC43OTUwNDUgOSAzOC41TDkgMzUuOTE0MDYyIEEgMS41IDEuNSAwIDAgMCA5LjUgMzYgQSAxLjUgMS41IDAgMCAwIDEwLjkxMjEwOSAzNSB6IiAvPg0KPC9zdmc+",
        oncommand: "window.BookmarkOpt.handleEvent(event, 'update')",
    }];

    // 书签弹出面板菜单
    let PLACES_POPUP_ITEMS = [{
        'label': "添加书签到此处",
        'tooltiptext': "左键：添加到最后\nShift+左键：添加到最前",
        'image': "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        oncommand: "window.BookmarkOpt.handleEvent(event, 'panelAdd', this.parentNode)"
    }, {

    }];

    window.BookmarkOpt = {
        items: [],
        addPlaceContextItem: function (refNode) {
            refNode = refNode || $('#placesContext_show_bookmark:info');
            PLACES_CONTEXT_ITEMS.forEach(p => {
                let item = $C('menuitem', p, document, refNode);
                this.items.push(item);
                refNode.insertAdjacentElement('beforebegin', item);
            });

            // 文件夹右键隐藏更新书签菜单
            $('#placesContext').addEventListener('popupshowing', function (event) {
                let popupNode = event.target.triggerNode;
                $('placesContext_update_bookmark:info').hidden = (popupNode._placesNode || popupNode.node).type !== 0;
            });
        },
        addPanelItem: function (event) {
            $('PlacesToolbarItems').addEventListener('popupshowing', this.handlePanelItem, false);
            $('PlacesToolbarItems').addEventListener('popuphidden', this.handlePanelItem, false);
        },
        handlePanelItem: function (event) {
            if (event.type === 'popuphidden') {
                // 防止影响其他方式添加书签
                BookmarkOpt.clearPanelItems(event.target);
            } else if (event.type === 'popupshowing') {
                let firstItem = event.target.firstChild;
                if (firstItem?.classList.contains('bmopt-panel')) return;
                let last;
                PLACES_POPUP_ITEMS.forEach(c => {
                    let item;
                    if (c.label) {
                        item = $C('menuitem', c);
                        item.classList.add('bmopt-panel');
                    } else {
                        item = $C('menuseparator', {
                            'class': 'bmopt-separator'
                        })
                    }
                    if (last) {
                        last.insertAdjacentElement('afterend', item);
                    } else {
                        firstItem.parentNode.insertBefore(item, firstItem);
                    }
                    last = item;
                });
            }
        },
        clearPanelItems: function (aDoc) {
            let menuitems = (aDoc || document).querySelectorAll(".bmopt-panel"),
                menuseparators = (aDoc || document).querySelectorAll(".bmopt-separator");
            for (let menuitem of menuitems) {
                menuitem.parentNode.removeChild(menuitem);
            }
            for (let menuseparator of menuseparators) {
                menuseparator.parentNode.removeChild(menuseparator);
            }
        },
        handleEvent: function (event, method, parentNode) {
            let popupNode = parentNode || PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
            if (!popupNode) return;
            let view = PlacesUIUtils.getViewForNode(popupNode),
                selectedNode = view.selectNode || popupNode._placesNode,
                pageTitle = gBrowser.contentTitle,
                isFolder = selectedNode?.type !== 0

            switch (method) {
                case 'panelAdd':
                    BookmarkOpt.clearPanelItems(parentNode); // 新增的项目会影响书签插入，必须清掉
                case 'add':
                    let iid, aid;
                    if (selectedNode) {
                        if (isFolder) {
                            iid = selectedNode.itemId;
                            aid = event.shiftKey ? 0 : BookmarkOpt.bmService.DEFAULT_INDEX;
                        } else {
                            iid = BookmarkOpt.bmService.getFolderIdForItem(selectedNode.itemId);
                            var id = selectedNode.itemId;
                            aid = event.shiftKey ? id : id + 1;
                        }
                    } else {
                        iid = view.result.root.folderItemId;
                        aid = event.shiftKey ? 0 : BookmarkOpt.bmService.DEFAULT_INDEX;
                    }
                    var uri = Services.io.newURI(gBrowser.currentURI.spec, null, null);
                    this.bmService.insertBookmark(iid, uri, aid, pageTitle);
                    break;
                case 'update':
                    let guid = selectedNode.bookmarkGuid;
                    if (!guid) return;
                    let info = {
                        guid,
                        title: selectedNode.title,
                        url: gBrowser.currentURI.spec,
                    }
                    if (event.button === 1) {
                        info.title = pageTitle;
                    } else if (event.button === 2) {
                        const title = window.prompt('更新当前书签标题，原标题为：\n' + selectedNode.title, pageTitle);
                        if (title === null) return;
                        if (title !== selectedNode.title)
                            info.title = title;
                    }
                    PlacesUtils.bookmarks.update(info);
                    break;
                default:
                    break;
            }
        },
        setStyle() {
            this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css)),
                type: 1
            }
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
        init: function () {
            this.bmService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
            if (location.href.startsWith("chrome://browser/content/browser.x")) {
                this.addPlaceContextItem();
                this.addPanelItem();
            }
        },
        destroy: function () {
            this.clearPanelItems();
            this.items.array.forEach(element => {
                element.remove();
            });
            this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            delete window.BookmarkOpt;
        },
    }
    window.BookmarkOpt.init();
})(`
.bmopt-separator+menuseparator{
    display: none;
}
`)