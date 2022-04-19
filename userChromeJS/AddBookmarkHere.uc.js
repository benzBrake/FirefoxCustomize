// ==UserScript==
// @name            添加书签到此处
// @namespace       about:userchromejs/addbookmarkhere
// @description     添加 "添加书签到此处" 到书签栏右键菜单
// @include         chrome://browser/content/browser.xhtml
// @include         chrome://browser/content/places/places.xhtml
// @shutdown        window.AddBookmarkHere.uninit()
// @author          Ryan, zbinlin
// @homepage        http://mozcp.com
// @version         0.0.3
// ==/UserScript==

/**
 * ******************************** Changelog ********************************
 * version: 0.0.3
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
        init: function () {
            var refNode = document.getElementById("placesContext_new:bookmark");
            if (!refNode) return;
            var self = this;
            window.addEventListener("unload", function _(e) {
                window.removeEventListener("unload", _, false);
                self.uninit();
            }, false);
            this.addContextMenu(refNode.parentNode, refNode);
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
            menuitem.addEventListener("command", this, false);
            parentNode.insertBefore(menuitem, afterNode);
        },
        handleEvent: function (e) {
            var popupNode = e.currentTarget.parentNode.triggerNode;
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
                    var id = bookmarks.getItemIndex(selectedNode.itemId);
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
