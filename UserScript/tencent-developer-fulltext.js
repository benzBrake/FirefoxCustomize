// ==UserScript==
// @name         腾讯开发者社区查看全文
// @namespace    https://github.com/benzbrake/FirefoxCustomize
// @version      0.1
// @description  腾讯开发者社区不关注查看全文
// @author       Ryan
// @match        https://cloud.tencent.com/developer/article/*
// @icon         https://cloud.tencent.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(() => {
        document.querySelector(".J-articlePanel .com-markdown-collpase-main").removeAttribute("style");
    }, 300);
})();