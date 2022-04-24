// ==UserScript==
// @name           move_reload_into_urlbar
// @description    移动刷新按钮到地址栏
// @compatibility  Firefox 57+
// @author         Ryan, GOLF-AT
// @note           20220424修复，兼容性未知，FF 100 测试通过
// @version        1.0.20220424

(function() {
    function moveReloadIntoURL() {
        try {
            var btn0 = document.getElementById("page-action-buttons");
            var btn1 = document.getElementById("reload-button");
            if (!btn0 || !btn1) return;

            var btn = document.createXULElement('toolbarbutton');

            btn.setAttribute("id", "stop_reload_button");
            btn.setAttribute("class", "urlbar-page-action urlbar-addon-page-action");

            btn.addEventListener("click", function(e) {
                var btn = document.getElementById("reload-button");
                if (btn && btn.getAttribute('displaystop'))
                    BrowserStop();
                else
                    BrowserReloadOrDuplicate(event);
            }, false);
            btn0.parentNode.appendChild(btn);
            
            btn1.addEventListener('DOMAttrModified', reloadBtnAttr);
            reloadBtnAttr(); 
            btn1.parentNode.hidden = true;
        }catch(e){ alert(e) }
    }

    function reloadBtnAttr(e) {
        btn = document.getElementById("stop_reload_button");
        if (btn && (!e || e.attrName=='displaystop')) {
            var newVal = e ? e.newValue : document.getElementById(
                "reload-button").getAttribute('displaystop');
            if (newVal)
                btn.style.listStyleImage = "url('chrome://global/skin/icons/close.svg')";
            else
                btn.style.listStyleImage = "url('chrome://global/skin/icons/reload.svg')";
        }
    }

    moveReloadIntoURL();
})();
