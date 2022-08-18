// ==UserScript==
// @name            CopyPlainText.uc.js
// @description     右键菜单复制和Ctrl+C强制复制纯文本
// @author          Ryan
// @include         main
// @version         0.0.1
// @compatibility   Firefox 72
// @shutdown        window.CopyPlainText.destroy()
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// ==/UserScript==
(function () {
    if (window.CopyPlainText)
        window.CopyPlainText.destroy();
    window.CopyPlainText = {
        noIndent: false,
        get platform() {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        init: function () {
            function frameScript() {
                const { Services } = Components.utils.import(
                    "resource://gre/modules/Services.jsm"
                );

                // From addMenuPlus.uc.js
                function getSelection(win, focusedElement) {
                    win || (win = content);
                    var selection = win.getSelection().toString();
                    if (!selection) {
                        let element = focusedElement;
                        let isOnTextInput = function (elem) {
                            return elem instanceof HTMLTextAreaElement ||
                                (elem instanceof HTMLInputElement && elem.mozIsTextField(true));
                        };

                        if (isOnTextInput(element)) {
                            selection = element.value.substring(element.selectionStart,
                                element.selectionEnd);
                        }
                    }

                    return selection;
                }

                function receiveMessage(message) {
                    switch (message.name) {
                        case 'cpt_copy':
                            const focusedElement = Services.focus.focusedElement;
                            let data = { text: getSelection(content, focusedElement) }
                            sendSyncMessage("cpt_selectionData", data);
                            break;
                        case 'cpt_destroy':
                            removeMessageListener("cpt_copy", receiveMessage);
                            removeMessageListener("cpt_destroy", receiveMessage);
                            getSelection = null;
                            receiveMessage = null;
                            break;
                    }
                }
                addMessageListener("cpt_copy", receiveMessage);
                addMessageListener("cpt_destroy", receiveMessage);
            }
            let frameScriptURI = 'data:application/javascript,'
                + encodeURIComponent('(' + frameScript.toString() + ')()');
            window.messageManager.loadFrameScript(frameScriptURI, true);
            window.messageManager.addMessageListener("cpt_selectionData", this);

            this.copyCMD = document.getElementById('editMenuCommands').appendChild($C(document, 'command', {
                id: 'cmd_copy_new',
                oncommand: function (event) {
                    event.target.ownerGlobal.gBrowser.selectedBrowser.messageManager.sendAsyncMessage("cpt_copy");
                }
            }));

            // add menuitem to contextmenu
            this.copyMenu = document.getElementById('context-copy').cloneNode(false);
            $A(this.copyMenu, {
                id: 'context-copy-new',
                command: 'cmd_copy_new'
            })
            document.getElementById('context-copy').after(this.copyMenu);
            document.getElementById('contentAreaContextMenu').addEventListener('popupshowing', this, false);

            // hide original copy text menuitem
            this.style = addStyle(`
            #context-copy {
                display: none !important;
            }
            `);

            // add keyboard event, replace ctrl+c behavior
            document.addEventListener('keyup', this, false);
        },
        destroy: function () {
            window.messageManager.broadcastAsyncMessage("cpt_destroy");
            window.messageManager.removeMessageListener("cpt_selectionData", this);
            removeNode(this.style);
            removeNode(this.copyCMD);
            removeNode(this.copyMenu);
            document.getElementById('contentAreaContextMenu').removeEventListener('popupshowing', this, false);
            document.removeEventListener('keyup', this, false);
            delete window.CopyPlainText;
        },
        handleEvent(event) {
            switch (event.type) {
                case 'keyup':
                    if (event.key === "c" && event.ctrlKey) {
                        event.preventDefault();
                        event.target.ownerGlobal.gBrowser.selectedBrowser.messageManager.sendAsyncMessage("cpt_copy");
                    }
                    break;
                case 'popupshowing':
                    if (gContextMenu.isContentSelected || gContextMenu.isTextSelected) {
                        this.copyMenu.hidden = false;
                    } else {
                        this.copyMenu.hidden = true;
                    }
                    break;
            }

        },
        receiveMessage(message) {
            switch (message.name) {
                case 'cpt_selectionData':
                    if (message.data.text) {
                        let after = this.prepareText(message.data.text);
                        Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(after);
                    }

                    break;
            }
        },
        prepareText: function (text) {
            text = text.trim()
                .replace(/[\r\n]+/g, '\n')
                .replace(/[ \t\f\v]+/g, ' ');
            this.noIndent && (text = text.replace(/\n /g, '\n'));
            this.platform === 'win' && (text = text.replace(/\n/g, '\r\n'));

            return text;
        }
    }

    /**
     * 创建 DOM 元素
     * @param {string} tag DOM 元素标签
     * @param {object} attr 属性对象
     * @param {array} skipAttrs 跳过属性
     * @returns 
     */
    function $C(aDoc, tag, attrs, skipAttrs) {
        const appVersion = Services.appinfo.version.split(".")[0];
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        aDoc || (aDoc = document);
        var el;
        if (appVersion >= 69) {
            el = aDoc.createXULElement(tag);
        } else {
            el = aDoc.createElement(tag);
        }
        return $A(el, attrs, skipAttrs);
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

    function removeNode(node) {
        if (node && node.parentNode)
            node.parentNode.removeChild(node);
    }

    setTimeout(function () {
        window.CopyPlainText.init();
    }, 3000)

})()