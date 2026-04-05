//修改自Firefox 自定义快捷 RunningCheese 版 for 90+

function getSearchHost (uri) {
    try {
        if (!uri) return "";
        if (uri.schemeIs("http") || uri.schemeIs("https") || uri.schemeIs("ftp")) {
            return uri.asciiHost || uri.host || "";
        }
    } catch (ex) { }
    return "";
}

function isSearchEngineHost (host) {
    return /(^|\.)google\.[^./]+$|(^|\.)baidu\.com$|(^|\.)bing\.com$/.test(host);
}

function buildSearchURL (engine, keyword, host = "") {
    const query = encodeURIComponent(keyword);
    switch (engine) {
        case "site-google":
            return "https://www.google.com/search?q=" + encodeURIComponent("site:" + host + " " + keyword);
        case "site-baidu":
            return "https://www.baidu.com/s?wd=" + encodeURIComponent("site:" + host + " " + keyword);
        case "baidu":
            return "https://www.baidu.com/s?wd=" + query;
        case "google":
            return "https://www.google.com/search?q=" + query;
        case "bing":
            return "https://www.bing.com/search?q=" + query;
    }
    return "";
}

function showSearchModal (win, keyword, canSearchCurrentSite, siteEngine, host, isZh) {
    const options = [];
    if (canSearchCurrentSite) {
        options.push({
            value: siteEngine === "baidu" ? "site-baidu" : "site-google",
            label: isZh
                ? `站内搜索 (${siteEngine === "baidu" ? "百度" : "谷歌"})`
                : `Site search (${siteEngine === "baidu" ? "Baidu" : "Google"})`
        });
    }
    options.push(
        { value: "baidu", label: isZh ? "百度" : "Baidu" },
        { value: "google", label: isZh ? "谷歌" : "Google" },
        { value: "bing", label: isZh ? "必应" : "Bing" }
    );

    const defaultMode = canSearchCurrentSite ? options[0].value : siteEngine;
    let selectedMode = defaultMode;
    let keywordInput = null;

    KeyChanger.showModal({
        id: "keychanger-search-modal",
        window: win,
        title: isZh ? "搜索" : "Search",
        subtitle: canSearchCurrentSite
            ? (isZh ? `当前站点: ${host}` : `Current site: ${host}`)
            : (isZh ? "当前页面不支持站内搜索" : "Site search is unavailable on this page"),
        width: 420,
        confirmText: isZh ? "搜索" : "Search",
        cancelText: isZh ? "取消" : "Cancel",
        buildBody: function (body, api) {
            keywordInput = api.createElement("input", {
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #c9d3e0",
                outline: "none",
                background: "#ffffff",
                color: "#111827",
                fontSize: "14px"
            }, {
                type: "text",
                value: keyword,
                placeholder: isZh ? "输入搜索关键词" : "Enter search keyword"
            });
            keywordInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter" && !event.isComposing) {
                    event.preventDefault();
                    event.stopPropagation();
                    api.submit();
                }
            });

            const optionGroup = api.createElement("div", {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px"
            });
            const updateSelection = () => {
                optionGroup.querySelectorAll("label").forEach(label => {
                    const radio = label.querySelector("input");
                    const isChecked = !!radio?.checked;
                    api.setStyles(label, isChecked ? {
                        borderColor: "#2563eb",
                        background: "#eff6ff",
                        boxShadow: "inset 0 0 0 1px rgba(37, 99, 235, 0.18)"
                    } : {
                        borderColor: "#d7deea",
                        background: "#ffffff",
                        boxShadow: "none"
                    });
                });
            };

            for (const option of options) {
                const label = api.createElement("label", {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #d7deea",
                    background: "#ffffff",
                    cursor: "pointer",
                    userSelect: "none"
                });
                const radio = api.createElement("input", null, {
                    type: "radio",
                    name: "keychanger-search-mode",
                    value: option.value,
                    checked: option.value === defaultMode
                });
                radio.addEventListener("change", function () {
                    selectedMode = option.value;
                    updateSelection();
                });
                const text = api.createElement("span", {
                    fontSize: "13px",
                    color: "#1f2937"
                }, {
                    textContent: option.label
                });

                label.appendChild(radio);
                label.appendChild(text);
                optionGroup.appendChild(label);
            }

            body.appendChild(keywordInput);
            body.appendChild(optionGroup);
            updateSelection();
        },
        onConfirm: function () {
            const finalKeyword = keywordInput?.value.trim() || "";
            if (!finalKeyword) {
                keywordInput?.focus();
                return false;
            }

            const url = buildSearchURL(selectedMode, finalKeyword, host);
            if (!url) {
                return false;
            }
            KeyChanger.openCommand(url, "tab");
        },
        onMount: function () {
            keywordInput?.focus();
            keywordInput?.select();
        }
    });
}

function promptSearch (event, siteEngine = "google") {
    const win = event?.target?.ownerGlobal || window;
    const { currentURI } = win.gBrowser.selectedTab.linkedBrowser;
    const host = getSearchHost(currentURI);
    const canSearchCurrentSite = !!host && !isSearchEngineHost(host);
    const isZh = Services.locale.appLocaleAsBCP47.includes("zh-");
    const keyword = KeyChanger.getSelectedText().trim();
    showSearchModal(win, keyword, canSearchCurrentSite, siteEngine, host, isZh);
}

//F1-12键
//--------------------------------------------------------------------------------------------------------------------------------------------
// 新建标签页并光标定位到地址栏
keys['F2'] = {
    oncommand: "internal",
    params: [
        'tab',
        'prev'
    ]
}; // 上一个标签页 (内置命令演示)
keys['F3'] = function () {
    gBrowser.getFindBar().then(function (findBarInstance) {
        if (findBarInstance.getAttribute('hidden')) {
            gBrowser.tabContainer.advanceSelectedTab(1, true);
        } else {
            findBarInstance.getElement('find-next').doCommand();
        }
    });
}; // 下一个标签页
keys['F4'] = {
    oncommand: "internal",
    params: [
        'tab',
        'duplicate'
    ]
}; //复制当前标签页
//keys['F5'] =""; // 原生功能：刷新
//keys['F6'] =""; // 原生功能：定位到地址栏
//keys['F7'] =""; // 原生功能：启用浏览光标
keys['F8'] = function () {
    KeyChanger.loadURI("javascript:document.body.contentEditable%20=%20'true';%20document.designMode='on';%20void%200");
}; //编辑当前页面
//keys['F9'] = function() {};// 原生功能：进入阅读模式
keys['F10'] = function () {
    KeyChanger.loadURI("javascript:(function(bookmarklets)%7Bfor(var%20i=0;i%3Cbookmarklets.length;i++)%7Bvar%20code=bookmarklets%5Bi%5D.url;if(code.indexOf(%22javascript:%22)!=-1)%7Bcode=code.replace(%22javascript:%22,%22%22);eval(code)%7Delse%7Bcode=code.replace(/%5Es+%7Cs+$/g,%22%22);if(code.length%3E0)%7Bwindow.open(code)%7D%7D%7D%7D)(%5B%7Btitle:%22%E7%A0%B4%E9%99%A4%E5%8F%B3%E9%94%AE%E8%8F%9C%E5%8D%95%E9%99%90%E5%88%B6%22,url:%22javascript:function%20applyWin(a)%7Bif(typeof%20a.__nnANTImm__===%5Cx22undefined%5Cx22)%7Ba.__nnANTImm__=%7B%7D;a.__nnANTImm__.evts=%5B%5Cx22mousedown%5Cx22,%5Cx22mousemove%5Cx22,%5Cx22copy%5Cx22,%5Cx22contextmenu%5Cx22%5D;a.__nnANTImm__.initANTI=function()%7Ba.__nnantiflag__=true;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.addEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__)%7D;a.__nnANTImm__.clearANTI=function()%7Bdelete%20a.__nnantiflag__;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.removeEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__);delete%20a.__nnANTImm__%7D;a.__nnANTImm__.fnANTI=function(b)%7Bb.stopPropagation();return%20true%7D;a.addEventListener(%5Cx22unload%5Cx22,function(b)%7Ba.removeEventListener(%5Cx22unload%5Cx22,arguments.callee,false);if(a.__nnantiflag__===true)%7Ba.__nnANTImm__.clearANTI()%7D%7D,false)%7Da.__nnantiflag__===true?a.__nnANTImm__.clearANTI():a.__nnANTImm__.initANTI()%7DapplyWin(top);var%20fs=top.document.querySelectorAll(%5Cx22frame,%20iframe%5Cx22);for(var%20i=0,len=fs.length;i%3Clen;i++)%7Bvar%20win=fs%5Bi%5D.contentWindow;try%7Bwin.document%7Dcatch(ex)%7Bcontinue%7DapplyWin(fs%5Bi%5D.contentWindow)%7D;void%200;%22%7D,%7Btitle:%22%E7%A0%B4%E9%99%A4%E9%80%89%E6%8B%A9%E5%A4%8D%E5%88%B6%E9%99%90%E5%88%B6%22,url:%22javascript:(function()%7Bvar%20doc=document;var%20bd=doc.body;bd.onselectstart=bd.oncopy=bd.onpaste=bd.onkeydown=bd.oncontextmenu=bd.onmousemove=bd.onselectstart=bd.ondragstart=doc.onselectstart=doc.oncopy=doc.onpaste=doc.onkeydown=doc.oncontextmenu=null;doc.onselectstart=doc.oncontextmenu=doc.onmousedown=doc.onkeydown=function%20()%7Breturn%20true;%7D;with(document.wrappedJSObject%7C%7Cdocument)%7Bonmouseup=null;onmousedown=null;oncontextmenu=null;%7Dvar%20arAllElements=document.getElementsByTagName(%5Cx27*%5Cx27);for(var%20i=arAllElements.length-1;i%3E=0;i--)%7Bvar%20elmOne=arAllElements;with(elmOne.wrappedJSObject%7C%7CelmOne)%7Bonmouseup=null;onmousedown=null;%7D%7Dvar%20head=document.getElementsByTagName(%5Cx27head%5Cx27)%5B0%5D;if(head)%7Bvar%20style=document.createElement(%5Cx27style%5Cx27);style.type=%5Cx27text/css%5Cx27;style.innerHTML=%5Cx22html,*%7B-moz-user-select:auto!important;%7D%5Cx22;head.appendChild(style);%7Dvoid(0);%7D)();%22%7D%5D)");
}; //解除网页限制
//keys['F11'] =""; // 原生功能：全屏模式
//keys['F12'] =""; // 原生功能：开发者工具

//Shift 组合键
keys['Shift+F1'] = function (event) {
    var document = event.target.ownerDocument;
    if (!document.getElementById('menu_browserToolbox')) {
        let { require } = "import" in Cu ? Cu.import("resource://devtools/shared/loader/Loader.jsm", {}) : ChromeUtils.importESModule("resource://devtools/shared/loader/Loader.sys.mjs");
        require("devtools/client/framework/devtools-browser");
    };
    document.getElementById('menu_browserToolbox').click();
};

//Alt 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------
keys["Alt+F1"] = function () {
    if (gBrowser.selectedTab.getAttribute("pinned") !== "true") {
        gBrowser.removeCurrentTab();
    }
}; //关闭当前标签页
keys["Alt+F2"] = function () {
    gBrowser.removeTabsToTheEndFrom(gBrowser.selectedTab);
}; //关闭右侧所有标签页
keys["Alt+F3"] = function () {
    gBrowser.removeAllTabsBut(gBrowser.selectedTab);
}; //关闭其他标签页

keys['Alt+F'] = function () {
    var bar = document.getElementById("PersonalToolbar");
    setToolbarVisibility(bar, bar.collapsed);
}; //显示或隐藏书签栏， 自带按键 Ctrl+Shift+B
keys['Alt+G'] = function (event) {
    promptSearch(event, "google");
}; //搜索（网页默认 Google 站内）
// 注意：Alt+B 可能被 Firefox / 系统菜单 access key 抢占，若要稳定触发请改键位或调整 ui.key.menuAccessKey。
keys['Alt+B'] = function (event) {
    promptSearch(event, "baidu");
}; //搜索（网页默认 Baidu 站内）
keys['Alt+I'] = function (event) {
    event.target.ownerGlobal.BrowserPageInfo();
}; //查看页面信息
keys['Alt+Z'] = function () {
    try {
        document.getElementById('History:UndoCloseTab').doCommand();
    } catch (ex) {
        if ('undoRemoveTab' in gBrowser) gBrowser.undoRemoveTab();
        else throw "Session Restore feature is disabled."
    }
}; //恢复关闭标签页
keys['Alt+V'] = function (event) {
    let url = readFromClipboard();
    try {
        switchToTabHavingURI(url, true);
    } catch (ex) {
        var reg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
        if (!reg.test(url)) {
            url = 'https://www.baidu.com/s?wd=' + encodeURIComponent(url);
        } else {
            if (url.substring(4, 0).toLowerCase() == "http") {
                url = encodeURIComponent(url);
            } else {
                url = 'http://' + encodeURIComponent(url);
            }
        }
        switchToTabHavingURI(url, true);
    }
    event.preventDefault();
    event.stopPropagation();
}; //打开剪切板地址
keys['Alt+C'] = function () {
    (function () {
        var gClipboardHelper = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
        var txt = "";
        var url = gBrowser.currentURI.spec;
        var title = gBrowser.contentTitle;
        txt += "[" + title + "]" + "(" + url + ")";
        gClipboardHelper.copyString(txt);
    })();
} //复制当前网页 Markdown 链接
keys['Ctrl+Shift+Alt+C'] = function () {
    (function () {
        var gClipboardHelper = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
        var txt = "";
        gBrowser.tabs.forEach(function (tab) {
            var url = gBrowser.getBrowserForTab(tab).currentURI.spec;
            txt += "[" + tab.label + "]" + "(" + url + ")" + "\r\r"
        });
        gClipboardHelper.copyString(txt);
    })();
} //复制所有网页 Markdown 链接
//Ctrl+Shift 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------
keys['Ctrl+Shift+F5'] = function () {
    gBrowser.tabs.forEach(t => gBrowser.reloadTab(t));
}
//keys['Ctrl+Shift+A'] = 原生快捷键：打开附加组件栏
//keys['Ctrl+Shift+S'] = 原生快捷键：打开火狐自带的截图功能
//keys['Ctrl+Shift+D'] = 原生快捷键：保存当前所有标签
// keys['Ctrl+Shift+N'] = function () {
//     document.getElementById("Tools:PrivateBrowsing").doCommand();
// };

//Ctrl+Alt 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------
keys['Ctrl+Alt+P'] = (event) => {
    if (event.target.ownerGlobal === window) {
        gBrowser.selectedTab.pinned
            ? gBrowser.unpinMultiSelectedTabs()
            : gBrowser.pinMultiSelectedTabs();
    }
} // 固定标签页
keys['Ctrl+Shift+Q'] = (event) => {
    if (event.target.ownerGlobal === window) {
        console.log(KeyChanger.getSelectedText());
    }
}
keys['Ctrl+Shift+Q'] = (event) => {
    BrowserOpenTab();
    gBrowser.removeAllTabsBut(gBrowser.selectedTab);
}
