// ==UserScript==
// @name            添加书签到此处
// @namespace       about:userchromejs/addbookmarkhere
// @description     添加 "添加书签到此处" 到书签栏右键菜单
// @compatibility   Firefox 68
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @shutdown        window.AddBookmarkHere.uninit()
// @author          Ryan, zbinlin
// @homepage        http://mozcp.com
// @version         0.0.4
// ==/UserScript==

/**
 * 点击菜单同时按下 Shift 键会添加到文件夹最上方或者当前书签的前面
 * ******************************** Changelog ********************************
 *  version: 0.0.4
 *  * 修复书签条目右键添加失败
 *  version: 0.0.3
 *  * 修复新版 Firefox 兼容性，仅在 Firefox 100 中测试过
 * version: 0.0.2
 *  * 兼容 Firefox 21+
 *
 * version: 0.0.1
 *  * 初始化
 * ***************************************************************************
 */

"use strict";

(function () {
    if (window.AddBookmarkHere) return;
    var AddBookmarkHere = {
        PARENT_NODE: "placesContext",
        REF_NODE: "",
        init: function () {
            var parentNode = document.getElementById(this.PARENT_NODE);
            if (!parentNode) return;
            var self = this;
            window.addEventListener("unload", function _(e) {
                window.removeEventListener("unload", _, false);
                self.uninit();
            }, false);
            var refNode;
            if (this.REF_NODE !== "") {
                var refNode = document.getElementById(this.REF_NODE);
            }
            this.addContextMenu(parentNode, refNode);
            /*
            var node = document.getElementById("placesContext_createBookmark");
            if (!node) return;
            node.removeAttribute("forcehideselection");
            node.setAttribute("selection", "any"); 
            node.removeAttribute("command");
            node.setAttribute("oncommand", "AddBookmarkHere.addBookmark(event);");
            */
        },
        addContextMenu: function (parentNode, afterNode) {
            var menuitem = document.createXULElement("menuitem");
            menuitem.id = "placesContext_add:bookmark";
            menuitem.setAttribute("label", Services.locale.appLocaleAsBCP47.includes("zh-") ? "添加书签到此处" : "Add Bookmark Here");
            menuitem.setAttribute("accesskey", "h");
            menuitem.setAttribute("selection", "any");
            menuitem.setAttribute("class", "menuitem-iconic");
            menuitem.setAttribute("style", "list-style-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==)");
            menuitem.addEventListener("command", this, false);
            if (typeof refNode !== "undefined") {
                parentNode.insertBefore(menuitem, afterNode);
            } else {
                parentNode.appendChild(menuitem);
            }
        },
        handleEvent: function (e) {
            var popupNode = PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
            if (!popupNode) return;
            var view = PlacesUIUtils.getViewForNode(popupNode);
            if (!view) return;
            var bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
            var selectedNode = view.selectedNode;
            var iid, aid;
            if (selectedNode) {
                if (PlacesUtils.nodeIsFolder(selectedNode) /* Firefox 21+ 不兼容 && !PlacesUtils.nodeIsLivemarkContainer(selectedNode) && !PlacesUtils.isReadonlyFolder(selectedNode) */) {
                    iid = selectedNode.itemId;
                    aid = e.shiftKey ? 0 : bookmarks.DEFAULT_INDEX;
                } else {
                    iid = bookmarks.getFolderIdForItem(selectedNode.itemId);
                    var id = selectedNode.itemId;
                    aid = e.shiftKey ? id : id + 1;
                }
            } else {
                iid = view.result.root.folderItemId;
                aid = e.shiftKey ? 0 : bookmarks.DEFAULT_INDEX;
            };
            var uri = Services.io.newURI(gBrowser.currentURI.spec, null, null);
            var title = gBrowser.contentTitle
            bookmarks.insertBookmark(iid, uri, aid, title);
        },
        uninit: function () {
            var self = this;
            try {
                var menuitem = document.getElementById("placesContext_add:bookmark");
                menuitem.removeEventListener("command", self, false);
                menuitem.remove();
                delete window.AddBookmarkHere;
            } catch (ex) {
            }
        }
    };
    AddBookmarkHere.init();
    window.AddBookmarkHere = AddBookmarkHere;
})();
