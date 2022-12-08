// ==UserScript==
// @name Novels Reading Helper
// @author Ryan
// @version 1.0
// @encoding utf-8
// @license https://creativecommons.org/licenses/by-sa/4.0/
// @icon https://gcore.jsdelivr.net/gh/benzBrake/FirefoxCustomize@master/images/FireDoge.ico
// @homepage https://github.com/benzBrake/FirefoxCustomize/tree/master/UserScript
// @match https://www.jhssd.com/*/*.html
// @match https://www.bidige.com/book/*/*.html
// @grant GM_addStyle
// ==/UserScript==
"use strict";
(function () {
    const { document, location, console } = window;
    const Rules = {
        "www.jhssd.com": {
            style: `body > :not([class^="main"]), .footer {
                display: none !important;
            }`,
            contentSel: '#nr',
            exec: function () {
                let content = document.querySelector("#nr").querySelector(":nth-child(4)");
                if (content)
                    [...content.querySelectorAll('span')].map(e => {
                        return {
                            search: e.outerHTML,
                            replace: getComputedStyle(e, ':before').getPropertyValue('content').replace(/"/g, "")
                        }
                    }).forEach(pair => {
                        content.innerHTML = content.innerHTML.replaceAll(pair.search, pair.replace);
                    });
            }
        },
        "wap.jhssd.com": {
            contentSel: '#nr',
            exec: function () {
                console.log("exec");
                let content = document.querySelector("#nr");
                if (content)
                    [...content.querySelectorAll('span')].map(e => {
                        return {
                            search: e.outerHTML,
                            replace: getComputedStyle(e, ':before').getPropertyValue('content').replace(/"/g, "")
                        }
                    }).forEach(pair => {
                        content.innerHTML = content.innerHTML.replaceAll(pair.search, pair.replace);
                    });
            }
        },
        "www.bidige.com": {
            "style": `#wrapper > :not(#content_read) {
                display: none;
            }`,
            "contentSel": "#content" // 内容选择器
        }
    }

    // 插入公共样式
    GM_addStyle(`
    .flex {
        display: flex;
    }
    .j-center {
        justify-content: center;
    }
    .nrh-toolbar {
        position: fixed;
        z-index: 999;
        width: 100%;
        height: var(--toolbar-height, 32px);
        top: calc(0px - var(--toolbar-height, 32px));
        transition: top .5s ease-in-out;
        box-shadow: 0px 0px 8px -5px hsla(240, 4%, 0%, 0.5), 0px 0px 15px 0px hsla(0, 0%, 0%, 0.2) !important;
    }
    .nrh-toolbar.sticky {
        top: 0;
    }
    .nrh-container {
        width: 100%;
        height: var(--toolbar-height, 32px);
        background-color: var(--toolbar-background, #fff);
    }
    .nrh-button {
        padding: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-size: 16px;
        user-select:none;
    }
    .nrh-button:hover {
        background-color: var(--toolbar-background-hover, #B5B9C8);
    }
    .nrh-zoom-level {
        height: 24px;
        padding: 4px;
        outline: none;
        width: 32px;
        cursor: default;
        text-align: center;
    }
    .input-error{
        outline: 1px solid red;
      }
    `);

    window.NrhToolBar = {
        init(domain) {
            let _config = Rules[domain] || {};
            this.config = Object.assign({
                toolbarInsertPoint: "body",
                contentSel: "body"
            }, _config);
            console.log(this.config);
            // 插入专用样式
            if (this.config.style)
                GM_addStyle(this.config.style);
            let insertPoint = document.querySelector(this.config.toolbarInsertPoint);
            if (insertPoint && !this.inited) {
                this.inited = true;
                this.toolbar = insertPoint.appendChild(
                    $C("div", {
                        class: "nrh-toolbar sticky",
                        style: "--toolbar-height: 32px"
                    })
                );
                this.container = this.toolbar?.appendChild($C("div", { class: "nrh-container flex j-center" }));
                this.initZoom();
                this.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                window.addEventListener("scroll", this);
            } else {
                console.error("Cannot find a insert point: " + sel || "html");
            }
            // 运行自定义函数
            if (this.config.exec && typeof this.config.exec === "function") {
                this.config.exec();
            }
        },
        initZoom() {
            this.contentEl = document.querySelector(this.config.contentSel);
            if (!this.contentEl) return;
            this.zoomLevel = parseInt(localStorage.getItem("zoomLevel") || getComputedStyle(this.contentEl).getPropertyValue("font-size")); // 读取默认字号
            this.zoomContainer = $C("div", {
                class: "nrh-zoom flex j-center",
            });
            this.container.appendChild(this.zoomContainer);
            let zoomOut = $C('span', {
                class: "nrh-zoom-out nrh-button",
                zoom: "-",
                content: "-"
            });
            zoomOut.addEventListener('click', this);
            let zoomOut5 = $C('span', {
                class: "nrh-zoom-out nrh-button",
                zoom: "-",
                content: "--",
                step: 5
            });
            zoomOut5.addEventListener('click', this);
            this.zoomContainer.appendChild(zoomOut5);
            this.zoomContainer.appendChild(zoomOut);
            let zoomInput = $C('input', {
                class: "nrh-zoom-level",
                value: this.zoomLevel,
                readonly: "readonly"
            });
            this.zoomContainer.appendChild(zoomInput);
            let zoomIn = $C('span', {
                class: "nrh-zoom-in nrh-button",
                zoom: "+",
                content: "+"
            });
            zoomIn.addEventListener('click', this);
            let zoomIn5 = $C('span', {
                class: "nrh-zoom-in nrh-button",
                zoom: "+",
                content: "++",
                step: 5,
                style: "letter-spacing: -3px;"
            });
            zoomIn5.addEventListener('click', this);
            this.zoomContainer.appendChild(zoomIn);
            this.zoomContainer.appendChild(zoomIn5);
            var that = this;
            setTimeout(function () {
                that.setZoomLevel(that.zoomLevel);
            }, 300);
        },
        getZoomLevel() {
            return this.zoomLevel;
        },
        setZoomLevel(level) {
            if (level < 1) level = 1;
            this.zoomLevel = level;
            this.contentEl.style.setProperty("font-size", level + "px");
            this.zoomContainer.querySelector("input").value = level;
            localStorage.setItem("zoomLevel", level); // 存储字号
        },
        handleEvent(event) {
            let { target } = event;
            switch (event.type) {
                case "scroll":
                    var st = window.pageYOffset || document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
                    if (st > this.lastScrollTop + 200) {
                        // 向下滚动
                        this.toolbar?.classList.remove("sticky");
                    } else {
                        // 向上滚动
                        this.toolbar?.classList.add("sticky");
                    }
                    var t;
                    clearTimeout(t);
                    t = setTimeout(() => {
                        var t = this.lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
                    }, 200);
                    break;
                case "click":
                    event.preventDefault();
                    event.stopPropagation();
                    if (target.hasAttribute("zoom")) {
                        let step = parseInt(target.getAttribute("step") || "1");
                        switch (target.getAttribute("zoom")) {
                            case "-":
                                this.setZoomLevel(this.getZoomLevel() - step);
                                break;
                            case "+":
                                this.setZoomLevel(this.getZoomLevel() + step);
                                break;
                            case "custom":
                                this.zoomContainer.classList.add("custom");
                                break;
                        }
                    }
                    break;
            }
        }
    }

    window.NrhToolBar.init(location.host);

    function $C(tag, attrs, skipAttrs) {
        let el = document.createElement(tag);
        attrs = attrs || {};
        // check skipAttrs if is array
        if (!skipAttrs || skipAttrs.constructor !== Array) {
            skipAttrs = [];
        }
        skipAttrs.push("content");
        for (let p in attrs) {
            if (skipAttrs.indexOf(p) === -1) {
                el.setAttribute(p, attrs[p]);

            }
        }
        if (attrs.content)
            el.innerHTML = attrs.content;
        return el;
    }
})();