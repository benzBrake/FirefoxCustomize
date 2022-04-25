// ==UserScript==
// @name           moveReloadIntoUrlbar.uc.js
// @description    移动刷新按钮到地址栏
// @compatibility  Firefox 57
// @author         Ryan, GOLF-AT
// @startup        UC.moveReloadIntoURL.init();
// @shutdown       UC.moveReloadIntoURL.unload();
// @homepage       https://github.com/benzBrake/FirefoxCustomize
// @version        1.2
// @note           1.2 改成可热插拔，兼容夜间模式，图片内置到脚本
// @note           1.1 20220424 修复，兼容性未知，FF 100 测试通过
// @note           1.0 20171104
// @onlyonce
// ==/UserScript==

UC.moveReloadIntoURL = {
    init: function () {
        try {
            this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
            this.paBtns = document.getElementById("pageActionButton");
            this.reloadBtn = document.getElementById("reload-button");
            this.btn = document.getElementById('new-stop-reload-button');
            if (!!this.btn || !this.paBtns || !this.reloadBtn) return;

            let btn = document.createXULElement('hbox');
            let img = document.createXULElement('image');
            btn.setAttribute("id", "new-stop-reload-button");
            btn.setAttribute("class", "urlbar-page-action urlbar-addon-page-action");
            img.setAttribute('class', 'urlbar-icon');
            btn.appendChild(img);

            btn.addEventListener("click", function (e) {
                let r = UC.moveReloadIntoURL.reloadBtn;
                if (r && r.getAttribute('displaystop'))
                    BrowserStop();
                else
                    BrowserReloadOrDuplicate();
            }, false);
            this.paBtns.parentNode.appendChild(btn);
            this.btn = document.getElementById('new-stop-reload-button');
            this.reloadBtn.addEventListener('DOMAttrModified', this.reloadBtnAttr);
            this.reloadBtnAttr();
            this.reloadBtn.parentNode.hidden = true;
            this.setStyle();
        } catch (e) { alert(e) }
    },

    unload: function () {
        if (this.reloadBtn) {
            this.reloadBtn.removeEventListener('DOMAttrModified', this.reloadBtnAttr)
            this.reloadBtn.parentNode.hidden = false;
        }
        if (this.btn) this.btn.parentNode.removeChild(this.btn);
        this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
        delete UC.moveReloadIntoURL;
    },

    reloadBtnAttr: function (e) {
        btn = UC.moveReloadIntoURL.btn;
        if (btn && (!e || e.attrName == 'displaystop')) {
            var newVal = e ? e.newValue : document.getElementById(
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
