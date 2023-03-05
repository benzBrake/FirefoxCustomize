// ==UserScript==
// @name                 dav_LinkifiesLocationBar
// @version              1.1
// @description          dav_LinkifiesLocationBar
// @shutdown             dav_LinkifiesLocationBar.globalShutdown();
// @reviewURL            https://github.com/sdavidg/firefoxChromeScripts
// ==/UserScript==

/*
Idea based on
https://addons.mozilla.org/en-US/firefox/addon/locationbar%C2%B2/
https://github.com/simonlindholm/locationbar2
*/
setTimeout(function () {
    if (location.href != 'chrome://browser/content/browser.xhtml') return;

    const colorizeExtensionFile = false,
        selectUrlbarText = true,
        pathnameArrow = true,
        fontMonospace = true,
        usePunycode = true;

    //https://stackoverflow.com/questions/183485/converting-punycode-with-dash-character-to-unicode/301287#301287
    var punycode = new function () { this.utf16 = { decode: function (r) { for (var o, e, t = [], n = 0, f = r.length; n < f;) { if (55296 == (63488 & (o = r.charCodeAt(n++)))) { if (e = r.charCodeAt(n++), 55296 != (64512 & o) || 56320 != (64512 & e)) throw new RangeError("UTF-16(decode): Illegal UTF-16 sequence"); o = ((1023 & o) << 10) + (1023 & e) + 65536 } t.push(o) } return t }, encode: function (r) { for (var o, e = [], t = 0, n = r.length; t < n;) { if (55296 == (63488 & (o = r[t++]))) throw new RangeError("UTF-16(encode): Illegal UTF-16 value"); o > 65535 && (o -= 65536, e.push(String.fromCharCode(o >>> 10 & 1023 | 55296)), o = 56320 | 1023 & o), e.push(String.fromCharCode(o)) } return e.join("") } }; var r = 36, o = 700, e = 1, t = 26, n = 38, f = 2147483647; function h(r, o) { return r + 22 + 75 * (r < 26) - ((0 != o) << 5) } function a(f, h, a) { var i; for (f = a ? Math.floor(f / o) : f >> 1, f += Math.floor(f / h), i = 0; f > (r - e) * t >> 1; i += r)f = Math.floor(f / (r - e)); return Math.floor(i + (r - e + 1) * f / (f + n)) } this.decode = function (o, n) { var h, i, u, c, d, l, p, g, s, C, v, w, y, A, E = [], M = [], R = o.length; for (h = 128, u = 0, c = 72, (d = o.lastIndexOf("-")) < 0 && (d = 0), l = 0; l < d; ++l) { if (n && (M[E.length] = o.charCodeAt(l) - 65 < 26), o.charCodeAt(l) >= 128) throw new RangeError("Illegal input >= 0x80"); E.push(o.charCodeAt(l)) } for (p = d > 0 ? d + 1 : 0; p < R;) { for (g = u, s = 1, C = r; ; C += r) { if (p >= R) throw RangeError("punycode_bad_input(1)"); if ((v = (A = o.charCodeAt(p++)) - 48 < 10 ? A - 22 : A - 65 < 26 ? A - 65 : A - 97 < 26 ? A - 97 : r) >= r) throw RangeError("punycode_bad_input(2)"); if (v > Math.floor((f - u) / s)) throw RangeError("punycode_overflow(1)"); if (u += v * s, v < (w = C <= c ? e : C >= c + t ? t : C - c)) break; if (s > Math.floor(f / (r - w))) throw RangeError("punycode_overflow(2)"); s *= r - w } if (c = a(u - g, i = E.length + 1, 0 === g), Math.floor(u / i) > f - h) throw RangeError("punycode_overflow(3)"); h += Math.floor(u / i), u %= i, n && M.splice(u, 0, o.charCodeAt(p - 1) - 65 < 26), E.splice(u, 0, h), u++ } if (n) for (u = 0, y = E.length; u < y; u++)M[u] && (E[u] = String.fromCharCode(E[u]).toUpperCase().charCodeAt(0)); return this.utf16.encode(E) }, this.encode = function (o, n) { var i, u, c, d, l, p, g, s, C, v, w, y; n && (y = this.utf16.decode(o)); var A = (o = this.utf16.decode(o.toLowerCase())).length; if (n) for (p = 0; p < A; p++)y[p] = o[p] != y[p]; var E, M, R = []; for (i = 128, u = 0, l = 72, p = 0; p < A; ++p)o[p] < 128 && R.push(String.fromCharCode(y ? (E = o[p], M = y[p], (E -= (E - 97 < 26) << 5) + ((!M && E - 65 < 26) << 5)) : o[p])); for (c = d = R.length, d > 0 && R.push("-"); c < A;) { for (g = f, p = 0; p < A; ++p)(w = o[p]) >= i && w < g && (g = w); if (g - i > Math.floor((f - u) / (c + 1))) throw RangeError("punycode_overflow (1)"); for (u += (g - i) * (c + 1), i = g, p = 0; p < A; ++p) { if ((w = o[p]) < i && ++u > f) return Error("punycode_overflow(2)"); if (w == i) { for (s = u, C = r; !(s < (v = C <= l ? e : C >= l + t ? t : C - l)); C += r)R.push(String.fromCharCode(h(v + (s - v) % (r - v), 0))), s = Math.floor((s - v) / (r - v)); R.push(String.fromCharCode(h(s, n && y[p] ? 1 : 0))), l = a(u, c + 1, c == d), u = 0, ++c } } ++u, ++i } return R.join("") }, this.ToASCII = function (r) { for (var o = r.split("."), e = [], t = 0; t < o.length; ++t) { var n = o[t]; e.push(n.match(/[^A-Za-z0-9-]/) ? "xn--" + punycode.encode(n) : n) } return e.join(".") }, this.toUnicode = function (r) { for (var o = r.split("."), e = [], t = 0; t < o.length; ++t) { var n = o[t]; e.push(n.match(/^xn--/) ? punycode.decode(n.slice(4)) : n) } return e.join(".") } };

    function getWindow() {
        return window;
    }
    function getMostRecentWindow() {
        var win = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow("navigator:browser");
        return win;
    }
    var localWindow = getWindow();
    localWindow.dav_LinkifiesLocationBar = {};

    var styleBase = `
        @namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");

        .claseLocationBar{
           display: block;
           position: absolute;
           top: calc((100% - 24px) / 2);
           height: 24px;
           width: 100%;
           line-height: 24px;
           white-space:nowrap;
           overflow:hidden;
        }
        .claseLocationBar span{
            position: relative;
           margin: 0 1px;
           display: inline-block;
        }
        .claseLocationBar span:hover{
            text-decoration: underline;
            cursor: pointer;
        }
        .claseLocationBar .label_pathname {
            margin-inline: unset !important;
        }
        locationBarTag{
          display: inline;
        }
        /*************************************
        *************** COLORS ***************
        *************************************/
        .claseLocationBar span.protocol{
           font-weight: normal;
           color: #777777;
           margin-right: -1px;
        }
        .claseLocationBar .subdomain {
           font-weight: bold;
           color: #C68007;
        }
        .claseLocationBar span.hostname{
           font-weight: bold;
           color: red;
        }
        .claseLocationBar span.port{
           color: #5F58A3;
        }
        .claseLocationBar span.pathname{
           color: black;
        }
        .claseLocationBar span.hash{
           color: #1054C9;
           margin-left: -1px;
        }
        .claseLocationBar span.search{
           color: #03AA03;
           margin-left: -1px;
        }
        .claseLocationBar .extension{
            color: rgb(96,86,143);
        }
    `;

    var style_fontMonospace = !fontMonospace ? "" : `
        @namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
        .urlbar-input-box[dav_LinkifiesLocationBar]{
          font-family: monospace ;
          margin-top: 4px;
        }
        .claseLocationBar{
         margin-top: -4px;
         line-height: 28px;
        }
        .claseLocationBar .pathname:after{
          top: 10px;
        }
        .claseLocationBar span.port{
            margin-left: -1px;
        }
        .claseLocationBar .subdomain {
          margin-right: -1px;
        }
        .claseLocationBar span.hostname{
          margin-right: 1px;
        }
    `;

    var style_pathnameArrow = !pathnameArrow ? "" : `
        @namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
        .claseLocationBar span.pathname{
            padding-left:9px;
            margin: 0 2px;
        }
        .claseLocationBar .pathname:before{
            content:' ';
            display: block;
            position: absolute;
            border-style: solid;
            border-width: 4px 4px 4px 7px;
            border-color: transparent transparent transparent #6fa880;
            border-color: transparent transparent transparent #5ba8bf;
            top: 10px;
            left: 0px;
        }
        .claseLocationBar .label_pathname{
            display: none;
        }
    `;

    var stylexul = `
        .urlbar-input-box[dav_LinkifiesLocationBar] #urlbar-input:focus ~ .claseLocationBar{
           display: none !important;
        }
        .urlbar-input-box[dav_LinkifiesLocationBar]  #urlbar-input:focus{
           opacity: 1;
        }
        .urlbar-input-box[dav_LinkifiesLocationBar]  #urlbar-input{
           opacity: 0;
        }
    `;

    /*
    AGENT_SHEET: 0
    USER_SHEET: 1
    AUTHOR_SHEET: 2
    */
    var CSS_Loader = {
        sss: Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService),
        load: function (cssCode) {
            this.unload(cssCode);
            var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(cssCode), null, null);
            this.sss.loadAndRegisterSheet(uri, this.sss.AGENT_SHEET);
        },
        unload: function (cssCode) {
            var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(cssCode), null, null);
            if (this.sss.sheetRegistered(uri, this.sss.AGENT_SHEET)) {
                this.sss.unregisterSheet(uri, this.sss.AGENT_SHEET);
            }
        }
    }

    const CLIKS = {
        left: 0,
        middle: 1,
        right: 2
    }

    function extend() {
        var copy, target = {};
        for (var i = 0, l = arguments.length; i < l; i++) {
            var options = arguments[i];
            for (var name in options) {
                copy = options[name];
                if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
        return target;
    }

    var styleString = (style) => {
        return Object.keys(style).reduce((prev, curr) => {
            return `${prev += curr.split(/(?=[A-Z])/).join('-').toLowerCase()}:${style[curr]};`
        }, '');
    };

    function createElement(elto) {
        elto = extend({
            attrArray: {},
            evtListener: [],
            estilos: {}
        }, elto);

        var node = getWindow().document.createXULElement(elto.type);

        Object.keys(elto.attrArray).forEach(key => {
            if (key == "innerHTML") {
                node.innerHTML = encodeHTML(elto.attrArray[key]);
            }
            else {
                node.setAttribute(key, elto.attrArray[key]);
            }
        });

        elto.evtListener.forEach(evt => {
            node.addEventListener(evt.type, evt.funcion, false);
        });

        let estilo = styleString(elto.estilos);
        if (estilo) {
            node.setAttribute("style", estilo);
        }

        return node;
    }

    function encodeHTML(text) {
        return decodeURI(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function appendPart(text, clase) {
        if (!text) return;

        if (clase == "pathname") {
            let sp = createElement({
                type: "label",
                attrArray: {
                    class: "label_pathname",
                    innerHTML: "/"
                }
            });
            divLocationBar.appendChild(sp);
        }
        let sp = createElement({
            type: "span",
            attrArray: {
                class: clase,
                innerHTML: text
            },
            evtListener: [{
                type: "click",
                funcion: clickPart
            }]
        });
        divLocationBar.appendChild(sp);
        sp.setAttribute("href", divLocationBar.textContent);
        return sp;
    }

    function clickPart(evt) {
        if (evt.button == CLIKS.right) return;

        let target = evt.target;
        if (target.className != "protocol") {
            let href = target.getAttribute("href");
            var where = evt.button == CLIKS.middle || evt.ctrlKey ? "tab" : "current";
            evt.view.openLinkIn(href, where, {
                allowThirdPartyFixup: true,
                targetBrowser: gBrowser.selectedBrowser,
                indicateErrorPageLoad: true,
                allowPinnedTabHostChange: true,
                disallowInheritPrincipal: true,
                allowPopups: false,
                triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
            });

            evt.stopPropagation();
        }
    }

    function borraPrevio() {
        var divPrevio = localWindow.document.querySelector(".claseLocationBar");
        if (divPrevio) {
            divPrevio.parentNode.removeChild(divPrevio)
        }
    }

    var debounce = (fn, ms = 0) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    var pintaLocation = debounce(pintaLocation_, 50);

    function pintaLocation_() {
        divLocationBar.innerHTML = '';

        var urlBarInput = getWindow().document.querySelector("#urlbar-input").value;
        var urlGBrowser = gBrowser.currentURI.displaySpec;

        if (urlGBrowser.startsWith("about")) {
            divLocationBar.innerHTML = encodeHTML(urlBarInput);
            return;
        }

        var url = urlGBrowser.indexOf(urlBarInput) != -1 ? urlGBrowser : urlBarInput;

        try {
            var { protocol, hostname, port, pathname, hash, search } = new URL(url);
        } catch (e) {
            divLocationBar.innerHTML = encodeHTML(urlBarInput);
            return;
        }
        if (usePunycode) {
            hostname = punycode.toUnicode(hostname);
        }


        var partido = hostname.split(".");
        var subdomain;
        if (partido.length > 2 && !partido.every(v => v == v - 0))//chequeamos que no sean todos numeros, porque entonces es una IP
        {
            subdomain = partido.splice(0, partido.length - 2).join(".");
            hostname = partido.join(".");
        }

        appendPart(protocol + "//", "protocol");
        if (subdomain) {
            appendPart(subdomain + ".", "subdomain");
        }
        appendPart(hostname, "hostname");
        if (port) {
            appendPart(":" + port, "port");
        }
        var arrayPathname = pathname.split("/");
        var arrayPathnameLength = arrayPathname.length;
        arrayPathname.forEach((elto, index) => {
            if (elto) {
                let sp = appendPart(elto, "pathname");
                if (colorizeExtensionFile && index == arrayPathnameLength - 1) {
                    let arrayDot = elto.split(".");
                    if (arrayDot.length > 1) {
                        let extension = arrayDot.pop();
                        sp.innerHTML = "";
                        sp.appendChild(createElement({
                            type: "locationBarTag",
                            attrArray: {
                                href: sp.getAttribute("href"),
                                innerHTML: arrayDot.join(".")
                            }
                        }));
                        sp.appendChild(createElement({
                            type: "locationBarTag",
                            attrArray: {
                                class: "extension",
                                href: sp.getAttribute("href"),
                                innerHTML: "." + extension
                            }
                        }));
                    }
                }
            }
        });
        appendPart(search, "search");
        appendPart(hash, "hash");
    }

    /******************* INIT ***************************/
    var urlbarInput = getWindow().document.querySelector("#urlbar-input");
    var timeMouseMove = -1;
    function hideDivLocatonBar() {
        urlbarInput.focus();
    }
    var divLocationBar = createElement({
        type: "div",
        attrArray: {
            class: "claseLocationBar"
        },
        evtListener: [{
            type: "click",
            funcion: function (evt) {
                hideDivLocatonBar()
                if (selectUrlbarText) {
                    urlbarInput.select();
                }
            }
        }, {
            type: "mouseenter",
            funcion: function (evt) {
                //esto es el ratón entrando por encima
                if (evt.screenY == divLocationBar.screenY) {
                    timeMouseMove = setTimeout(hideDivLocatonBar, 500);
                }
            }
        }, {
            type: "mouseleave",
            funcion: function (evt) {
                clearTimeout(timeMouseMove);
            }
        }]
    });

    borraPrevio();
    urlbarInput.parentNode.appendChild(divLocationBar);
    urlbarInput.parentNode.setAttribute("dav_LinkifiesLocationBar", true);
    urlbarInput.addEventListener("blur", pintaLocation);
    pintaLocation();

    var last_displaySpec = "";
    var intevalID = setInterval(function () {
        //console.log("setInterval", intevalID,  localWindow == window, localWindow == getMostRecentWindow());
        let actual_displaySpec = gBrowser.currentURI.displaySpec;
        if (last_displaySpec != actual_displaySpec) {
            last_displaySpec = actual_displaySpec;
            pintaLocation();
        }
    }, 50);
    CSS_Loader.load(styleBase);
    CSS_Loader.load(style_pathnameArrow);
    // CSS_Loader.load(style_fontMonospace);
    CSS_Loader.load(stylexul);
    /******************* END INIT ***************************/
    dav_LinkifiesLocationBar.shutdown = function (win) {
        borraPrevio();
        clearTimeout(intevalID);
        urlbarInput.parentNode.removeAttribute("dav_LinkifiesLocationBar");
        CSS_Loader.unload(styleBase);
        CSS_Loader.unload(style_pathnameArrow);
        // CSS_Loader.unload(style_fontMonospace);
        CSS_Loader.unload(stylexul);
        urlbarInput.removeEventListener("blur", pintaLocation);
    }

    dav_LinkifiesLocationBar.globalShutdown = function () {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var ws = wm.getEnumerator(null);
        while (ws.hasMoreElements()) {
            var w = ws.getNext();
            w.dav_LinkifiesLocationBar.shutdown(w);
        }
    }
}, 10);