// ==UserScript==
// @name            UnifiedExtensionsSearch.uc.js
// @description     在扩展面板中搜索扩展
// @author          Ryan
// @include         main
// @version         0.1
// @compatibility   Firefox 126
// @destroy         window.UnifiedExtensionsSearch.onUnload();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// ==/UserScript==
(window.UnifiedExtensionsSearch = {
    timer: [],
    init: function (v, c) {
        if (!v) return;
        this.view = v;
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(c) + '"'
        );
        this.style = document.insertBefore(pi, document.documentElement);
        ["ViewHiding"].forEach(t => v.addEventListener(t, this, false));
        window.addEventListener("unload", this, false); // Corrected line
        let w = document.createElement('html:div');
        for (let [k, v] of Object.entries({
            id: 'unified-extensions-search-input-container',
            class: 'unified-extensions-search-input-container',
            role: 'searchbox',
        })) { w.setAttribute(k, v) }
        let i = document.createElement('html:div');
        for (let [k, v] of Object.entries({
            id: 'unified-extensions-search-input',
            class: 'unified-extensions-search-input',
            role: 'search',
            contenteditable: true,
            empty: true
        })) { i.setAttribute(k, v) }
        this.input = w.appendChild(i);
        ['input', 'change', 'keypress'].forEach(e => i.addEventListener(e, this, false));
        let cl = document.createElement('html:button');
        for (let [k, v] of Object.entries({
            id: 'unified-extensions-search-clear',
            class: 'unified-extensions-search-clear',
            role: 'button',
        })) { cl.setAttribute(k, v) }
        this.btn = w.appendChild(cl);
        cl.addEventListener('click', this, false);
        v.querySelector('.panel-subview-body[context="unified-extensions-context-menu"]').before(w);
    },
    handleEvent (event) {
        const { type } = event;
        // 防止回车换行
        if (type == 'keypress' && event.keyCode == 13) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (this.timer[type]) clearTimeout(this.timer[type]);
        this.timer[type] = setTimeout(() => {
            this.timer[type] = null;
            let fnName = 'on' + type[0].toUpperCase() + type.slice(1);
            if (this[fnName])
                this[fnName](event);
            else
                console.log(`UnifiedExtensionsSearch.uc.js: Unhandled event: ${type}`)
        }, 100);
    },
    onViewHiding () {
        this.input.textContent = '';
        this.input.setAttribute("empty", true);
        this.resetExtensions();
    },
    onInput () {
        let val = this.input.textContent;
        if (val) {
            this.input.setAttribute("empty", false);
            this.searchExtensions();
        } else {
            this.input.setAttribute("empty", true);
            this.input.innerHTML = '';
            this.resetExtensions();
        }
    },
    searchExtensions () {
        let val = this.input.textContent.trim();
        if (val) {
            let search = val.toLowerCase();
            let items = this.view.querySelectorAll('.unified-extensions-item');
            for (let item of items) {
                let name = item.querySelector('.unified-extensions-item-name').textContent.toLowerCase();
                if (name.includes(search)) {
                    item.removeAttribute("hidden");
                } else {
                    item.setAttribute("hidden", true);
                }
            }
        }
    },
    resetExtensions () {
        let items = document.querySelectorAll('.unified-extensions-item');
        for (let item of items) {
            item.removeAttribute("hidden");
        }
    },
    onClick () {
        if (this.input.getAttribute('empty') === "true") return;
        this.input.innerHTML = '';
        this.input.setAttribute("empty", true);
        this.resetExtensions();
    },
    onUnload () {
        window.removeEventListener('unload', this, false);
        if (this.style && this.style.parentNode) {
            this.style.parentNode.removeChild(this.style);
            this.style = null;
        }
        ["ViewHiding"].forEach(t => this.view.removeEventListener(t, this, false));
        let c = view.querySelector('#unified-extensions-search-input-container');
        if (c && c.parentNode) c.parentNode.removeChild(c);
        delete window.UnifiedExtensionsSearch;
    }
}).init(gUnifiedExtensions.panel && PanelMultiView.getViewNode(
    document,
    "unified-extensions-view"
), `
#unified-extensions-search-input-container {
    min-height: 20px;
    margin:5px 10px;
    border: 1px solid var(--panel-border-color);
    display: flex;
    flex-direction: row;
    overflow: hidden;
}
#unified-extensions-search-input {
    flex-grow: 1;
    border-right-width: 1px;
    border-right-color: var(--panel-border-color);
    height: 100%;
    padding: 5px;
    line-height: 20px;
    font-size: 16px;
    &[empty="true"] {
        &+#unified-extensions-search-clear {
            background-position: -30px 50%, 8px 50%;
        }
    }
}
#unified-extensions-search-clear {
    width: 20px;
    height: 20px;
    padding: 5px;
    flex-shrink: 0;
    background-image: url(chrome://global/skin/icons/close.svg), url(chrome://global/skin/icons/search-glass.svg);
    background-position: 8px 50%, 30px 50%;
    background-repeat: no-repeat no-repeat;
    transition: background-position 0.2s ease-in-out;
}
.unified-extensions-item[hidden=true] {
    display: none;
    visibility: collapse;
    opacity: 0;
}
`);