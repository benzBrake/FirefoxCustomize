// ==UserScript==
// @name            UnifiedExtensionsSearch.uc.js
// @description     在扩展面板中搜索扩展
// @author          Ryan
// @include         main
// @version         0.1.2
// @compatibility   Firefox 126
// @destroy         window.UnifiedExtensionsSearch.onUnload();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @license         MIT
// @charset         UTF-8
// @note            0.1.2 修复搜索框显示横向滚动条的问题
// @note            0.1.1 整理代码，优化搜索效果
// ==/UserScript==
(window.UnifiedExtensionsSearch = {
    timer: [],
    init: function (v, c, on, cre) {
        if (!v) return;
        this.view = v;
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(c) + '"'
        );
        this.style = document.insertBefore(pi, document.documentElement);
        on.call(this.view, 'ViewHiding', this, false);
        on.call(window, 'unload', this, false);
        let w = cre(document, 'html:div', {
            id: 'unified-extensions-search-input-container',
            class: 'unified-extensions-search-input-container',
            role: 'searchbox',
        });
        let i = cre(document, 'html:input', {
            id: 'unified-extensions-search-input',
            class: 'unified-extensions-search-input',
            role: 'search',
            contenteditable: true,
            empty: true
        });
        this.input = {
            el: w.appendChild(i),
            set val (v) {
                this.el.innerHTML = v;
                this.el.setAttribute('empty', v.length == 0);
            },
            get val () {
                return this.el.textContent;
            },
            setAttribute (k, v) {
                this.el.setAttribute(k, v);
            },
        };
        on.call(i, ['input', 'change', 'keypress'], this, false);
        let cl = cre(document, 'html:button', {
            id: 'unified-extensions-search-clear',
            class: 'unified-extensions-search-clear',
            role: 'button',
        });
        this.btn = w.appendChild(cl);
        cl.addEventListener('click', this, false);
        v.querySelector('.panel-subview-body[context="unified-extensions-context-menu"]').before(w);
    },
    handleEvent (event) {
        const { type } = event;
        // 防止回车换行
        if (type == 'keypress') {
            if (event.keyCode == 13) {
                event.preventDefault();
                event.stopPropagation();
            }
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
        this.input.val = '';
        this.resetExtensions();
    },
    onInput () {
        if (this.input.val) {
            this.input.setAttribute("empty", false);
            this.searchExtensions();
        } else {
            this.input.val = '';
            this.resetExtensions();
        }
    },
    searchExtensions () {
        let val = this.input.val.trim();
        if (val) {
            let search = val.toLowerCase().split(' ');
            let items = this.view.querySelectorAll('.unified-extensions-item');
            for (let item of items) {
                let name = item.querySelector('.unified-extensions-item-name').textContent.toLowerCase();
                if (search.every(s => name.includes(s))) {
                    item.removeAttribute("hidden");
                } else {
                    item.setAttribute("hidden", "true");
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
        this.input.val = '';
        this.resetExtensions();
    },
    onUnload () {
        window.removeEventListener('unload', this, false);
        off.call(this.view, 'ViewHiding', this, false);
        remove(this.style);
        remove(view.querySelector('#unified-extensions-search-input-container'));
        function off (type, fn, arg) {
            if (!Array.isArray(type)) type = [type];
            type.forEach(t => this.removeEventListener(t, fn, arg));
        }
        function remove (el) {
            el && el.parentNode && el.parentNode.removeChild(el);
        }
        delete window.UnifiedExtensionsSearch;

    }
}).init(gUnifiedExtensions.panel && PanelMultiView.getViewNode(
    document,
    "unified-extensions-view"
), `
#unified-extensions-search-input-container {
    min-height: 20px;
    margin: 5px 10px;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    appearance: none !important;
    background-color: var(--toolbar-field-background-color) !important;
    color: inherit !important;
    border: 1px solid var(--input-border-color) !important;
    border-radius: 4px !important;
}
#unified-extensions-search-input {
    flex-grow: 1;
    height: 100%;
    padding: 5px;
    line-height: 20px;
    font-size: 16px;
    max-width: calc(100% - 40px);
    overflow-x: scorll;
    scrollbar-width: none;
    outline: none;
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
    &:hover {
        background-color: var(--toolbarbutton-hover-background);
    }
    &:active {
        background-color: var(--toolbarbutton-active-background);
    }
}
:root[lwt-toolbar-field="dark"] #unified-extensions-search-clear {
    filter: invert(1);
}
.unified-extensions-item[hidden=true] {
    display: none;
    visibility: collapse;
    opacity: 0;
}
`, function (type, fn, arg) {
    if (!Array.isArray(type)) type = [type];
    type.forEach(t => this.addEventListener(t, fn, arg));
}, function (doc, tag, attrs) {
    let el = tag.startsWith('html:') ? doc.createElement(tag) : doc.createXULElement(tag);
    for (let [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
    }
    return el;
});