// ==UserScript==
// @name           moveReloadIntoUrlbar.uc.js
// @description    移动刷新按钮到地址栏
// @compatibility  Firefox 57
// @author         Ryan, GOLF-AT
// @include        main
// @startup        window.moveReloadIntoURL.init(win);
// @shutdown       window.moveReloadIntoURL.unload();
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @version        1.2.2
// @note           1.2.2 修复 Firefox 103 兼容性
// @note           1.2 改成可热插拔，兼容夜间模式，图片内置到脚本
// @note           1.1 20220424 修复，兼容性未知，FF 100 测试通过
// @note           1.0 20171104
// @onlyonce
// ==/UserScript==
(function () {
    if (window.moveReloadIntoURL) {
        window.moveReloadIntoURL.unload();
        delete window.moveReloadIntoURL;
    }
    window.moveReloadIntoURL = {
        init: function (win) {
            this.doc = doc = win ? win.document : document;
            try {
                this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
                this.paBtns = doc.getElementById("pageActionButton");
                this.reloadBtn = doc.getElementById("reload-button");
                this.btn = doc.getElementById('new-stop-reload-button');
                if (!!this.btn || !this.paBtns || !this.reloadBtn) return;

                let btn = doc.createXULElement('hbox');
                let img = doc.createXULElement('image');
                btn.setAttribute("id", "new-stop-reload-button");
                btn.setAttribute("class", "urlbar-page-action urlbar-addon-page-action");
                btn.setAttribute("tooltiptext", Services.locale.appLocaleAsBCP47.includes("zh-") ? '左键：刷新\r\n右键：强制刷新' : 'Left click: refresh page\nRight click: force refresh page')
                img.setAttribute('class', 'urlbar-icon');
                btn.appendChild(img);

                btn.addEventListener("click", function (e) {
                    let r = window.moveReloadIntoURL.reloadBtn;
                    if (r && r.getAttribute('displaystop'))
                        e.target.ownerGlobal.BrowserStop();
                    else
                        if (e.button == 2) {
                            e.target.ownerGlobal.BrowserReloadSkipCache();
                        } else {
                            e.target.ownerGlobal.BrowserReload();
                        }

                }, false);
                this.paBtns.after(btn);
                this.btn = doc.getElementById('new-stop-reload-button');
                this.reloadBtn.addEventListener('DOMAttrModified', this.reloadBtnAttr);
                this.reloadBtnAttr();
                this.reloadBtn.parentNode.hidden = true;
                this.setStyle();
            } catch (e) { Cu.reportError(e); }
        },

        unload: function () {
            if (this.reloadBtn) {
                this.reloadBtn.removeEventListener('DOMAttrModified', this.reloadBtnAttr)
                this.reloadBtn.parentNode.hidden = false;
            }
            if (this.btn) this.btn.parentNode.removeChild(this.btn);
            this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
            delete window.moveReloadIntoURL;
        },

        reloadBtnAttr: function (e) {
            let doc = e ? e.ownerDocument : this.doc;
            btn = window.moveReloadIntoURL.btn;
            if (btn && (!e || e.attrName == 'displaystop')) {
                var newVal = e ? e.newValue : doc.getElementById(
                    "reload-button").getAttribute('displaystop');
                if (newVal)
                    btn.style.listStyleImage = "url('data:image/svg+xml;base64,PCEtLSBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljCiAgIC0gTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcwogICAtIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDE2IDE2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+CiAgPHBhdGggZD0ibTkuMTA4IDcuNzc2IDQuNzA5LTQuNzA5YS42MjYuNjI2IDAgMCAwLS44ODQtLjg4NUw4LjI0NCA2Ljg3MWwtLjQ4OCAwLTQuNjg5LTQuNjg4YS42MjUuNjI1IDAgMSAwLS44ODQuODg1TDYuODcgNy43NTRsMCAuNDkxLTQuNjg3IDQuNjg3YS42MjYuNjI2IDAgMCAwIC44ODQuODg1TDcuNzU0IDkuMTNsLjQ5MSAwIDQuNjg3IDQuNjg3YS42MjcuNjI3IDAgMCAwIC44ODUgMCAuNjI2LjYyNiAwIDAgMCAwLS44ODVMOS4xMDggOC4yMjNsMC0uNDQ3eiIvPgo8L3N2Zz4K')";
                else
                    btn.style.listStyleImage = "url('data:image/svg+xml;base64,PCEtLSBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljCiAgIC0gTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcwogICAtIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDE2IDE2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+CiAgPHBhdGggZD0iTTEwLjcwNyA2IDE0LjcgNmwuMy0uMyAwLTMuOTkzYS41LjUgMCAwIDAtLjg1NC0uMzU0bC0xLjQ1OSAxLjQ1OUE2Ljk1IDYuOTUgMCAwIDAgOCAxQzQuMTQxIDEgMSA0LjE0MSAxIDhzMy4xNDEgNyA3IDdhNi45NyA2Ljk3IDAgMCAwIDYuOTY4LTYuMzIyLjYyNi42MjYgMCAwIDAtLjU2Mi0uNjgyLjYzNS42MzUgMCAwIDAtLjY4Mi41NjJBNS43MjYgNS43MjYgMCAwIDEgOCAxMy43NWMtMy4xNzEgMC01Ljc1LTIuNTc5LTUuNzUtNS43NVM0LjgyOSAyLjI1IDggMi4yNWE1LjcxIDUuNzEgMCAwIDEgMy44MDUgMS40NDVsLTEuNDUxIDEuNDUxYS41LjUgMCAwIDAgLjM1My44NTR6Ii8+Cjwvc3ZnPgo=')";
            }
        },

        setStyle: function () {
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            @-moz-document url('chrome://browser/content/browser.xhtml') {
                #new-stop-reload-button {
                    -moz-box-ordinal-group: 999;
                    display: -moz-box !important;
                }
                #new-stop-reload-button .urlbar-icon {
                    -moz-context-properties: fill, fill-opacity !important;
                    fill: currentColor !important;
                }
            }
          `)),
                type: this.sss.AGENT_SHEET
            }
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
    }

    window.moveReloadIntoURL.init(window);
})();