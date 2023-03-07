// =====================addmenuplus 配置 感谢 runningcheese ======================
app([{
    'insertAfter': 'appMenu-settings-button',
}, {
    'id': 'appMenu-certificate-manager-button',
    'label': locale.includes("zh-") ? '证书管理器' : 'Certificate Manager',
    'insertAfter': 'appMenu-settings-button',
    'oncommand': `window.open('chrome://pippki/content/certManager.xhtml', 'mozilla:certmanager', 'chrome,resizable=yes,all,width=830,height=400');`,
    'image': 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI1IDJDMTIuMjk2ODc1IDIgMiAxMi4yOTY4NzUgMiAyNUMyIDM3LjcwMzEyNSAxMi4yOTY4NzUgNDggMjUgNDhDMzcuNzAzMTI1IDQ4IDQ4IDM3LjcwMzEyNSA0OCAyNUM0OCAxMi4yOTY4NzUgMzcuNzAzMTI1IDIgMjUgMiBaIE0gMjUgNEMzNi41NzgxMjUgNCA0NiAxMy40MjE4NzUgNDYgMjVDNDYgMzYuNTc4MTI1IDM2LjU3ODEyNSA0NiAyNSA0NkMxMy40MjE4NzUgNDYgNCAzNi41NzgxMjUgNCAyNUM0IDEzLjQyMTg3NSAxMy40MjE4NzUgNCAyNSA0IFogTSAyNSA4QzIwLjAzNTE1NiA4IDE2IDEyLjAzNTE1NiAxNiAxN0wxNiAyMUwyMiAyMUwyMiAxN0MyMiAxNS4zNDc2NTYgMjMuMzQ3NjU2IDE0IDI1IDE0QzI2LjY1MjM0NCAxNCAyOCAxNS4zNDc2NTYgMjggMTdMMjggMjFMMzQgMjFMMzQgMTdDMzQgMTIuMDM1MTU2IDI5Ljk2NDg0NCA4IDI1IDggWiBNIDI1IDEwQzI4Ljg2NzE4OCAxMCAzMiAxMy4xMzI4MTMgMzIgMTdMMzIgMTlMMzAgMTlMMzAgMTdDMzAgMTQuMjM4MjgxIDI3Ljc2MTcxOSAxMiAyNSAxMkMyMi4yMzgyODEgMTIgMjAgMTQuMjM4MjgxIDIwIDE3TDIwIDE5TDE4IDE5TDE4IDE3QzE4IDEzLjEzMjgxMyAyMS4xMzI4MTMgMTAgMjUgMTAgWiBNIDE2IDIyQzEzLjc5Mjk2OSAyMiAxMiAyMy43OTI5NjkgMTIgMjZMMTIgMzZDMTIgMzguMjA3MDMxIDEzLjc5Mjk2OSA0MCAxNiA0MEwzNCA0MEMzNi4yMDcwMzEgNDAgMzggMzguMjA3MDMxIDM4IDM2TDM4IDI2QzM4IDIzLjc5Mjk2OSAzNi4yMDcwMzEgMjIgMzQgMjIgWiBNIDE2IDI0TDM0IDI0QzM1LjEwNTQ2OSAyNCAzNiAyNC44OTQ1MzEgMzYgMjZMMzYgMzZDMzYgMzcuMTA1NDY5IDM1LjEwNTQ2OSAzOCAzNCAzOEwxNiAzOEMxNC44OTQ1MzEgMzggMTQgMzcuMTA1NDY5IDE0IDM2TDE0IDI2QzE0IDI0Ljg5NDUzMSAxNC44OTQ1MzEgMjQgMTYgMjQgWiBNIDE3IDI2QzE2LjQ0OTIxOSAyNiAxNiAyNi40NDkyMTkgMTYgMjdMMTYgMzVDMTYgMzUuNTUwNzgxIDE2LjQ0OTIxOSAzNiAxNyAzNkMxNy41NTA3ODEgMzYgMTggMzUuNTUwNzgxIDE4IDM1TDE4IDI3QzE4IDI2LjQ0OTIxOSAxNy41NTA3ODEgMjYgMTcgMjYgWiBNIDI1IDI2QzIzLjg5NDUzMSAyNiAyMyAyNi44OTQ1MzEgMjMgMjhDMjMgMjguNzE0ODQ0IDIzLjM4MjgxMyAyOS4zNzUgMjQgMjkuNzMwNDY5TDI0IDM1TDI2IDM1TDI2IDI5LjczMDQ2OUMyNi42MTcxODggMjkuMzcxMDk0IDI3IDI4LjcxNDg0NCAyNyAyOEMyNyAyNi44OTQ1MzEgMjYuMTA1NDY5IDI2IDI1IDI2WiIgLz4NCjwvc3ZnPg=='
}, {
    'id': 'appMenu-advanced-settings-button',
    // 'label': locale.includes("zh-") ? '高级首选项' : 'about:config',
    'data-l10n-href': 'toolkit/about/config.ftl',
    'data-l10n-id': 'about-config-page-title',
    'insertAfter': 'appMenu-settings-button',
    'oncommand': `openTrustedLinkIn('about:config', gBrowser.currentURI.spec === AboutNewTab.newTabURL || gBrowser.currentURI.spec === HomePage.get(window) ? "current" : "tab")`,
}, {
    'id': 'appMenu-restart-button2',
    // 'label': locale.includes("zh-") ? '重启' : 'Restart',
    'data-l10n-href': 'toolkit/about/aboutSupport.ftl',
    'data-l10n-id': 'restart-button-label',
    'insertBefore': 'appMenu-quit-button2',
    'oncommand': `if (event.shiftKey || (AppConstants.platform == "macosx" ? event.metaKey : event.ctrlKey)) Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`,
    'onclick': `if (event.button === 0) return; Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`
}])
css('#main-window[appname="Floorp"] #appMenu-restart-button2 { display: none;}');
nav({
    label: locale.includes("zh-") ? "复制所有标签标题+地址" : "Copy All Tabs Title+URL",
    // insertAfter: 'toolbar-context-openANewTab',
    class: "copy",
    condition: "tabs",
    oncommand: function () {
        var text = "";
        var tabs = gBrowser.mTabContainer ? gBrowser.mTabContainer.childNodes : gBrowser.tabs; // Firefox 61 删除了 mTabContainer
        for (var i = 0, l = tabs.length, doc; i < l; i++) {
            doc = tabs[i].linkedBrowser.contentDocument;
            if (doc) {
                text += doc.title + "\n" + doc.location.href + "\n";
            } else {
                doc = tabs[i].linkedBrowser
                text += doc.contentTitle + "\n" + doc.currentURI.spec + "\n";
            }
        }
        addMenu.copy(text);
    }
})
// SSL小锁右键菜单 Start ============================================================
ident([
    {
        label: locale.includes("zh-") ? '解除网页限制' : 'Remove web pages limit',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTAuMDM3IDAuNTI2IEMgNC44MTEgMC41MjYgMC41NzIgNC43NjQgMC41NzIgOS45OTEgQyAwLjU3MiAxNS4yMTggNC44MTEgMTkuNDU2IDEwLjAzNyAxOS40NTYgQyAxNS4yNjUgMTkuNDU2IDE5LjUwMiAxNS4yMTggMTkuNTAyIDkuOTkxIEMgMTkuNTAyIDQuNzY0IDE1LjI2NSAwLjUyNiAxMC4wMzcgMC41MjYgWiBNIDEwLjAzNyAxNy44NSBDIDUuNjk4IDE3Ljg1IDIuMTc4IDE0LjMzMSAyLjE3OCA5Ljk5MSBDIDIuMTc4IDguMTExIDIuODM5IDYuMzgzIDMuOTQyIDUuMDMxIEwgMTQuOTk4IDE2LjA4NiBDIDEzLjY0NiAxNy4xODkgMTEuOTE4IDE3Ljg1IDEwLjAzNyAxNy44NSBaIE0gMTYuMTMzIDE0Ljk1MiBMIDUuMDc3IDMuODk2IEMgNi40MjkgMi43OTMgOC4xNTcgMi4xMzEgMTAuMDM3IDIuMTMxIEMgMTQuMzc3IDIuMTMxIDE3Ljg5NyA1LjY1MiAxNy44OTcgOS45OTEgQyAxNy44OTcgMTEuODcyIDE3LjIzNSAxMy42IDE2LjEzMyAxNC45NTIgWiIgc3R5bGU9IiIvPgo8L3N2Zz4=",
        url: "javascript:(function(bookmarklets)%7Bfor(var%20i=0;i%3Cbookmarklets.length;i++)%7Bvar%20code=bookmarklets%5Bi%5D.url;if(code.indexOf(%22javascript:%22)!=-1)%7Bcode=code.replace(%22javascript:%22,%22%22);eval(code)%7Delse%7Bcode=code.replace(/%5Es+%7Cs+$/g,%22%22);if(code.length%3E0)%7Bwindow.open(code)%7D%7D%7D%7D)(%5B%7Btitle:%22%E7%A0%B4%E9%99%A4%E5%8F%B3%E9%94%AE%E8%8F%9C%E5%8D%95%E9%99%90%E5%88%B6%22,url:%22javascript:function%20applyWin(a)%7Bif(typeof%20a.__nnANTImm__===%5Cx22undefined%5Cx22)%7Ba.__nnANTImm__=%7B%7D;a.__nnANTImm__.evts=%5B%5Cx22mousedown%5Cx22,%5Cx22mousemove%5Cx22,%5Cx22copy%5Cx22,%5Cx22contextmenu%5Cx22%5D;a.__nnANTImm__.initANTI=function()%7Ba.__nnantiflag__=true;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.addEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__)%7D;a.__nnANTImm__.clearANTI=function()%7Bdelete%20a.__nnantiflag__;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.removeEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__);delete%20a.__nnANTImm__%7D;a.__nnANTImm__.fnANTI=function(b)%7Bb.stopPropagation();return%20true%7D;a.addEventListener(%5Cx22unload%5Cx22,function(b)%7Ba.removeEventListener(%5Cx22unload%5Cx22,arguments.callee,false);if(a.__nnantiflag__===true)%7Ba.__nnANTImm__.clearANTI()%7D%7D,false)%7Da.__nnantiflag__===true?a.__nnANTImm__.clearANTI():a.__nnANTImm__.initANTI()%7DapplyWin(top);var%20fs=top.document.querySelectorAll(%5Cx22frame,%20iframe%5Cx22);for(var%20i=0,len=fs.length;i%3Clen;i++)%7Bvar%20win=fs%5Bi%5D.contentWindow;try%7Bwin.document%7Dcatch(ex)%7Bcontinue%7DapplyWin(fs%5Bi%5D.contentWindow)%7D;void%200;%22%7D,%7Btitle:%22%E7%A0%B4%E9%99%A4%E9%80%89%E6%8B%A9%E5%A4%8D%E5%88%B6%E9%99%90%E5%88%B6%22,url:%22javascript:(function()%7Bvar%20doc=document;var%20bd=doc.body;bd.onselectstart=bd.oncopy=bd.onpaste=bd.onkeydown=bd.oncontextmenu=bd.onmousemove=bd.onselectstart=bd.ondragstart=doc.onselectstart=doc.oncopy=doc.onpaste=doc.onkeydown=doc.oncontextmenu=null;doc.onselectstart=doc.oncontextmenu=doc.onmousedown=doc.onkeydown=function%20()%7Breturn%20true;%7D;with(document.wrappedJSObject%7C%7Cdocument)%7Bonmouseup=null;onmousedown=null;oncontextmenu=null;%7Dvar%20arAllElements=document.getElementsByTagName(%5Cx27*%5Cx27);for(var%20i=arAllElements.length-1;i%3E=0;i--)%7Bvar%20elmOne=arAllElements;with(elmOne.wrappedJSObject%7C%7CelmOne)%7Bonmouseup=null;onmousedown=null;%7D%7Dvar%20head=document.getElementsByTagName(%5Cx27head%5Cx27)%5B0%5D;if(head)%7Bvar%20style=document.createElement(%5Cx27style%5Cx27);style.type=%5Cx27text/css%5Cx27;style.innerHTML=%5Cx22html,*%7B-moz-user-select:auto!important;%7D%5Cx22;head.appendChild(style);%7Dvoid(0);%7D)();%22%7D%5D)"
    }, {
        label: locale.includes("zh-") ? "编辑当前页面" : 'Edit current page',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTUuNjk0IDEuNzE4IEMgMTQuOTE5IDEuNzIgMTQuMTc0IDIuMDMxIDEzLjYzIDIuNTg0IEwgMi4zOTUgMTMuODE3IEwgMi4zNTEgMTQuMDQgTCAxLjU3NCAxNy45NDggTCAxLjM1MiAxOC45OTEgTCAyLjM5NiAxOC43NjkgTCA2LjMwMyAxNy45OTEgTCA2LjUyNCAxNy45NDcgTCAxNy43NTkgNi43MTQgQyAxOC45MTUgNS41NzggMTguOTE1IDMuNzE4IDE3Ljc1OSAyLjU4MyBDIDE3LjIxNCAyLjAzMSAxNi40NzEgMS43MiAxNS42OTQgMS43MTggWiBNIDE1LjY5NCAzLjA3MiBDIDE2LjA1MiAzLjA3MiAxNi40MTMgMy4yMzYgMTYuNzYgMy41ODMgQyAxNy40NTEgNC4yNzQgMTcuNDUxIDUuMDIyIDE2Ljc2IDUuNzE1IEwgMTYuMjUgNi4yMDMgTCAxNC4xMzkgNC4wOTMgTCAxNC42MjkgMy41ODMgQyAxNC45NzYgMy4yMzYgMTUuMzM2IDMuMDcyIDE1LjY5NCAzLjA3MiBaIE0gMTMuMTQxIDUuMDkzIEwgMTUuMjQ5IDcuMjAyIEwgNi42NTkgMTUuNzkzIEMgNi4xOTQgMTQuODg2IDUuNDU2IDE0LjE0OCA0LjU0OCAxMy42ODQgWiBNIDMuNjM5IDE0LjgzOSBDIDQuNDg5IDE1LjE4MSA1LjE2MyAxNS44NTUgNS41MDMgMTYuNzA1IEwgMy4xNzIgMTcuMTcxIFoiIHN0eWxlPSJzdHJva2UtbWl0ZXJsaW1pdDogMTsgc3Ryb2tlLXdpZHRoOiAwcHg7Ii8+Cjwvc3ZnPg==",
        url: "javascript:document.body.contentEditable%20=%20'true';%20document.designMode='on';%20void%200"
    }, {
        label: locale.includes("zh-") ? "http 转 https" : "http to https",
        url: "javascript:(function(){document.location.href=document.location.href.replace('http:','https:')})();",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy44NzEgMTYuODE3IEwgNC40NDcgMTYuODE3IEwgMy44MjkgMTYuMTk5IEwgMy44MjkgMTAuNzM3IEwgNC40NDcgMTAuMTE5IEwgMTEuNjA2IDEwLjExOSBMIDExLjg4MSA5LjY0MSBDIDEyLjExNSA5LjIzMyAxMi40NjkgOC45NzMgMTIuODYgOC44MzMgQyAxMi44NTUgOC44MzIgMTIuODUxIDguODMxIDEyLjg0NiA4LjgzMSBMIDEyLjg0NiA1LjczOSBDIDEyLjg0NiAzLjQ2NiAxMC45OTcgMS42MTcgOC43MjQgMS42MTcgQyA2LjQ1MSAxLjYxNyA0LjYwMiAzLjQ2NiA0LjYwMiA1LjczOSBMIDQuNjAyIDguODMxIEMgMy40NjMgOC44MzEgMi41NDEgOS43NTQgMi41NDEgMTAuODkyIEwgMi41NDEgMTYuMDQ0IEMgMi41NDEgMTcuMTgzIDMuNDYzIDE4LjEwNSA0LjYwMiAxOC4xMDUgTCA4LjA2NCAxOC4xMDUgQyA3Ljg0MyAxNy43MTUgNy43NzUgMTcuMjU2IDcuODcxIDE2LjgxNyBaIE0gNS44OSA1LjczOSBDIDUuODkgNC4xNzYgNy4xNjEgMi45MDUgOC43MjQgMi45MDUgQyAxMC4yODcgMi45MDUgMTEuNTU4IDQuMTc2IDExLjU1OCA1LjczOSBMIDExLjU1OCA4LjgzMSBMIDUuODkgOC44MzEgTCA1Ljg5IDUuNzM5IFoiIHN0eWxlPSIiLz4KICA8cGF0aCBkPSJNIDE3Ljk2OSAxNi4zMTggTCAxNC41NTcgMTAuMzY5IEMgMTQuMDg5IDkuNTU0IDEyLjg5MyA5LjU1NCAxMi40MjUgMTAuMzY5IEwgOS4wMTMgMTYuMzE4IEMgOC41NTMgMTcuMTE3IDkuMTQyIDE4LjEwNSAxMC4wNzggMTguMTA1IEwgMTYuOTAzIDE4LjEwNSBDIDE3LjgzOCAxOC4xMDUgMTguNDI3IDE3LjExNyAxNy45NjkgMTYuMzE4IFogTSAxNC4xMzQgMTQuMzY5IEMgMTQuMTM0IDE0Ljg2NSAxMy41OTcgMTUuMTc0IDEzLjE2OCAxNC45MjcgQyAxMi45NjkgMTQuODEyIDEyLjg0NiAxNC41OTkgMTIuODQ2IDE0LjM2OSBMIDEyLjg0NiAxMi41NjggQyAxMi44NDYgMTIuMDczIDEzLjM4MiAxMS43NjMgMTMuODEyIDEyLjAxMSBDIDE0LjAxMiAxMi4xMjYgMTQuMTM0IDEyLjMzOSAxNC4xMzQgMTIuNTY4IEwgMTQuMTM0IDE0LjM2OSBaIE0gMTMuNDkgMTcuMDc1IEMgMTIuOTk1IDE3LjA3NSAxMi42ODQgMTYuNTM5IDEyLjkzMiAxNi4xMDkgQyAxMy4wNDcgMTUuOTEgMTMuMjU5IDE1Ljc4NyAxMy40OSAxNS43ODcgQyAxMy45ODYgMTUuNzg3IDE0LjI5NSAxNi4zMjQgMTQuMDQ4IDE2Ljc1MyBDIDEzLjkzMiAxNi45NTIgMTMuNzIgMTcuMDc1IDEzLjQ5IDE3LjA3NSBaIiBzdHlsZT0iIi8+Cjwvc3ZnPg==",
    }, {}, {
        label: locale.includes("zh-") ? "网页存档查询" : "Search in archive.org",
        url: "https://web.archive.org/web/*/%URL%",
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMyAxMEgyVjQuMDAzQzIgMy40NDkgMi40NTUgMyAyLjk5MiAzaDE4LjAxNkEuOTkuOTkgMCAwIDEgMjIgNC4wMDNWMTBoLTF2MTAuMDAxYS45OTYuOTk2IDAgMCAxLS45OTMuOTk5SDMuOTkzQS45OTYuOTk2IDAgMCAxIDMgMjAuMDAxVjEwem0xNiAwSDV2OWgxNHYtOXpNNCA1djNoMTZWNUg0em01IDdoNnYySDl2LTJ6Ii8+PC9zdmc+"
    }, {
        label: locale.includes("zh-") ? "存档当前网页" : "Save page to archive.org",
        url: "https://web.archive.org/save/%URL%",
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMyAxMEgyVjQuMDAzQzIgMy40NDkgMi40NTUgMyAyLjk5MiAzaDE4LjAxNkEuOTkuOTkgMCAwIDEgMjIgNC4wMDNWMTBoLTF2MTAuMDAxYS45OTYuOTk2IDAgMCAxLS45OTMuOTk5SDMuOTkzQS45OTYuOTk2IDAgMCAxIDMgMjAuMDAxVjEwem0xNiAwSDV2OWgxNHYtOXpNNCA1djNoMTZWNUg0em01IDdoNnYySDl2LTJ6Ii8+PC9zdmc+"
    }, {}, {
        label: locale.includes("zh-") ? "页面自动滚屏" : "Auto scroll",
        url: "javascript:var%20_ss_interval_pointer;_ss_speed=3;_ss_speed_pairs=[[0,0],[1,200.0],[1,120.0],[1,72.0],[1,43.2],[1,25.9],[2,31.0],[4,37.2],[8,44.8],[8,26.4],[16,32.0]];_ss_last_onkeypress=document.onkeypress;_ss_stop=function(){clearTimeout(_ss_interval_pointer)};_ss_start=function(){_ss_abs_speed=Math.abs(_ss_speed);_ss_direction=_ss_speed/_ss_abs_speed;_ss_speed_pair=_ss_speed_pairs[_ss_abs_speed];_ss_interval_pointer=setInterval('scrollBy(0,'+_ss_direction*_ss_speed_pair[0]+');%20if((pageYOffset<=1)||(pageYOffset==document.height-innerHeight))%20_ss_speed=0;',_ss_speed_pair[1]);};_ss_adj=function(q){_ss_speed+=q;if(Math.abs(_ss_speed)>=_ss_speed_pairs.length)_ss_speed=(_ss_speed_pairs.length-1)*(_ss_speed/Math.abs(_ss_speed))};_ss_quit=function(){_ss_stop();document.onkeypress=_ss_last_onkeypress;};document.onkeypress=function(e){if((e.charCode==113)||(e.keyCode==27)){_ss_quit();return;};if(e.charCode>=48&&e.charCode<=57)_ss_speed=e.charCode-48;else%20switch(e.charCode){case%2095:_ss_adj(-2);case%2045:_ss_adj(-1);break;case%2043:_ss_adj(2);case%2061:_ss_adj(1);break;};_ss_stop();_ss_start();};_ss_stop();_ss_start();",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTYuOTE4IDQuMjMzIEwgMTAuMjIxIDEwLjkzMSBMIDMuNTIzIDQuMjMzIE0gMy41MjMgMTUuMzk2IEwgMTYuOTE4IDE1LjM5NiIgc3R5bGU9InN0cm9rZS13aWR0aDogMnB4OyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyBzdHJva2UtbGluZWNhcDogcm91bmQ7IiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTSAxNy42MjUgNC45NCBMIDEwLjIyMSAxMi4zNDUgTCAyLjgxNiA0Ljk0IEwgNC4yMyAzLjUyNiBMIDEwLjIyMSA5LjUxNyBMIDE2LjIxMSAzLjUyNiBaIE0gMTYuOTE4IDE2LjM5NiBMIDMuNTIzIDE2LjM5NiBMIDMuNTIzIDE0LjM5NiBMIDE2LjkxOCAxNC4zOTYgWiIgc3R5bGU9IiIvPgo8L3N2Zz4="
    }, {
        label: locale.includes("zh-") ? "页面自动刷新" : "Auto refresh",
        url: "javascript:(function(p){open('','',p).document.write('%3Cbody%20id=1%3E%3Cnobr%20id=2%3E%3C/nobr%3E%3Chr%3E%3Cnobr%20id=3%3E%3C/nobr%3E%3Chr%3E%3Ca%20href=%22#%22onclick=%22return!(c=t)%22%3EForce%3C/a%3E%3Cscript%3Efunction%20i(n){return%20d.getElementById(n)}function%20z(){c+=0.2;if(c%3E=t){c=0;e.location=u;r++}x()}function%20x(){s=t-Math.floor(c);m=Math.floor(s/60);s-=m*60;i(1).style.backgroundColor=(r==0||c/t%3E2/3?%22fcc%22:c/t%3C1/3?%22cfc%22:%22ffc%22);i(2).innerHTML=%22Reloads:%20%22+r;i(3).innerHTML=%22Time:%20%22+m+%22:%22+(s%3C10?%220%22+s:s)}c=r=0;d=document;e=opener.top;u=prompt(%22URL%22,e.location.href);t=u?prompt(%22Seconds%22,60):0;setInterval(%22z()%22,200);if(!t){window.close()}%3C/script%3E%3C/body%3E')})('status=0,scrollbars=0,width=100,height=115,left=1,top=1')",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuMTQ1IDkuNjUxIEMgMTcuMTQzIDkuNjQyIDE3LjAwNyA4Ljg3NSAxNi45MTUgOC41NDggQyAxNi44MjIgOC4yMTkgMTYuNzE5IDcuOTI4IDE2LjU4NiA3LjYyNSBDIDE2LjMyNSA3LjAxOSAxNi4wMTQgNi41MTEgMTUuNjExIDYuMDE4IEMgMTUuMjE2IDUuNTIyIDE0Ljc5MyA1LjEyMiAxNC4yODYgNC43NTIgQyAxMy43ODUgNC4zNzkgMTMuMjc4IDQuMDk3IDEyLjY5OCAzLjg2NSBDIDEyLjEyMSAzLjYyNyAxMS41NjEgMy40NzYgMTAuOTQgMy4zOTQgQyAxMC4zMTkgMy4zMDcgOS43MzcgMy4zIDkuMTA3IDMuMzc5IEMgOC40NzQgMy40NTMgNy44OTYgMy41OTkgNy4yODggMy44NTMgQyA2LjY3NSA0LjEgNi4xMjUgNC40MTUgNS41NjMgNC44NTcgQyA1LjQzNyA0Ljk1NSA1LjMyNiA1LjA0OCA1LjIwNSA1LjE1NCBDIDUuMDg4IDUuMjU5IDQuOTgyIDUuMzYgNC44NjggNS40NzQgQyA0Ljc1NiA1LjU4NiA0LjY1OSA1LjY5MSA0LjU1NiA1LjgxIEMgNC40NTIgNS45MyA0LjM2IDYuMDQzIDQuMjY0IDYuMTY5IEMgNC4xNjggNi4yOTQgNC4wODQgNi40MTIgMy45OTYgNi41NDQgQyAzLjk2NiA2LjU5IDMuOTM3IDYuNjM0IDMuOTA4IDYuNjc4IEwgNi4wNjYgNi42NzggTCA2LjA2NiA4LjI1NCBMIDEuMzMzIDguMjU0IEwgMS4zMzMgMy41MiBMIDIuOTA5IDMuNTIgTCAyLjkwOSA1LjM1MiBDIDIuOTQzIDUuMzA1IDIuOTc4IDUuMjU4IDMuMDEyIDUuMjEzIEMgMy4xMjMgNS4wNjkgMy4yNDYgNC45MTcgMy4zNjYgNC43NzggQyAzLjQ4NyA0LjYzOSAzLjYyMyA0LjQ5MyAzLjc1MyA0LjM2MSBDIDMuODgxIDQuMjMzIDQuMDI0IDQuMDk4IDQuMTYyIDMuOTc1IEMgNC4yOTkgMy44NTMgNC40NTEgMy43MjcgNC41OTcgMy42MTMgQyA1LjI0OSAzLjExMSA1Ljk4MyAyLjY4OCA2LjY5MSAyLjM5NSBDIDcuNDA0IDIuMTA3IDguMTg2IDEuOTA3IDguOTE4IDEuODE1IEMgOS42NTIgMS43MyAxMC40MzYgMS43MzkgMTEuMTU0IDEuODM0IEMgMTEuODcyIDEuOTM2IDEyLjYyMSAyLjEzNyAxMy4yOSAyLjQwNSBDIDEzLjk1OCAyLjY3OSAxNC42MzUgMy4wNTcgMTUuMjIgMy40ODQgQyAxNS44MDEgMy45MTYgMTYuMzcgNC40NTYgMTYuODM3IDUuMDI4IEMgMTcuMjk4IDUuNjA1IDE3LjcxOSA2LjI5NCAxOC4wMyA2Ljk5NiBDIDE4LjMzMyA3LjY5OSAxOC42MjUgOS4xMjQgMTguNjI1IDkuMTI0IEMgMTguNjQzIDkuMTcyIDE3LjE0MiA5LjYyNSAxNy4xNDUgOS42NTEgWiBNIDE3LjE0NSA5LjY1MSBDIDE3LjE0NSA5LjY1MSAxNy4xNDUgOS42NTEgMTcuMTQ1IDkuNjUxIEMgMTcuMTQ1IDkuNjUxIDE3LjE0NSA5LjY1MSAxNy4xNDUgOS42NTEgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGQ9Ik0gMi44NzkgMTEuMTk4IEMgMi44ODEgMTEuMjA3IDMuMDE3IDExLjk3NCAzLjEwOSAxMi4zMDIgQyAzLjIwMiAxMi42MyAzLjMwNSAxMi45MjEgMy40MzggMTMuMjI0IEMgMy42OTkgMTMuODMxIDQuMDExIDE0LjMzOSA0LjQxMyAxNC44MzEgQyA0LjgwOCAxNS4zMjggNS4yMzEgMTUuNzI4IDUuNzM4IDE2LjA5OCBDIDYuMjQgMTYuNDcxIDYuNzQ4IDE2Ljc1IDcuMzI2IDE2Ljk4NSBDIDcuOTA0IDE3LjIyIDguNDY0IDE3LjM3NCA5LjA4NSAxNy40NTYgQyA5LjcwNSAxNy41NDQgMTAuMjg4IDE3LjU1MSAxMC45MTggMTcuNDcxIEMgMTEuNTQ5IDE3LjM5OSAxMi4xMjcgMTcuMjUxIDEyLjczNyAxNi45OTggQyAxMy4zNTEgMTYuNzUgMTMuODk5IDE2LjQzNiAxNC40NiAxNS45OTQgQyAxNC41ODYgMTUuODk2IDE0LjY5OCAxNS44MDIgMTQuODE4IDE1LjY5NiBDIDE0LjkzOCAxNS41OSAxNS4wNDIgMTUuNDkyIDE1LjE1MyAxNS4zNzkgQyAxNS4yNjYgMTUuMjY0IDE1LjM2NiAxNS4xNTggMTUuNDY4IDE1LjA0IEMgMTUuNTcxIDE0LjkyMiAxNS42NjIgMTQuODA4IDE1Ljc2IDE0LjY4IEMgMTUuODU2IDE0LjU1NiAxNS45NCAxNC40MzggMTYuMDI4IDE0LjMwNSBDIDE2LjA1OCAxNC4yNiAxNi4wODcgMTQuMjE2IDE2LjExNSAxNC4xNzIgTCAxMy45NTggMTQuMTcyIEwgMTMuOTU4IDEyLjU5NiBMIDE4LjY5MSAxMi41OTYgTCAxOC42OTEgMTcuMzI5IEwgMTcuMTE1IDE3LjMyOSBMIDE3LjExNSAxNS40OTggQyAxNy4wODEgMTUuNTQ1IDE3LjA0NiAxNS41OTEgMTcuMDExIDE1LjYzNyBDIDE2LjkwMSAxNS43OCAxNi43NzkgMTUuOTMyIDE2LjY1OCAxNi4wNzIgQyAxNi41MzYgMTYuMjEyIDE2LjQgMTYuMzU4IDE2LjI3MyAxNi40ODcgQyAxNi4xNDMgMTYuNjE4IDE1Ljk5OSAxNi43NTMgMTUuODYyIDE2Ljg3NSBDIDE1LjcyNSAxNi45OTcgMTUuNTc0IDE3LjEyMiAxNS40MjggMTcuMjM2IEMgMTQuNzc1IDE3Ljc0IDE0LjA0IDE4LjE2MiAxMy4zMzMgMTguNDU2IEMgMTIuNjIxIDE4Ljc0MyAxMS44NCAxOC45NDMgMTEuMTA4IDE5LjAzNSBDIDEwLjM3NCAxOS4xMjEgOS41ODkgMTkuMTEyIDguODcxIDE5LjAxNiBDIDguMTUyIDE4LjkxNCA3LjQwMiAxOC43MTYgNi43MzQgMTguNDQ1IEMgNi4wNjYgMTguMTc0IDUuMzg5IDE3Ljc5MyA0LjgwNCAxNy4zNjYgQyA0LjIyMyAxNi45MzQgMy42NTQgMTYuMzk0IDMuMTg3IDE1LjgyIEMgMi43MjcgMTUuMjQ1IDIuMzA1IDE0LjU1NyAxLjk5NCAxMy44NTMgQyAxLjY5MSAxMy4xNSAxLjM5OSAxMS43MjUgMS4zOTkgMTEuNzI1IEMgMS4zODEgMTEuNjc3IDIuODgyIDExLjIyNCAyLjg3OSAxMS4xOTggWiBNIDIuODc5IDExLjE5OCBDIDIuODc5IDExLjE5OCAyLjg3OSAxMS4xOTggMi44NzkgMTEuMTk4IEMgMi44NzkgMTEuMTk4IDIuODc5IDExLjE5OCAyLjg3OSAxMS4xOTggWiIgc3R5bGU9IiIvPgo8L3N2Zz4="
    }, {}, {
        label: locale.includes("zh-") ? "页面另存为" : " Save page",
        command: "Browser:SavePage",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMS40MDQgMy45NDggQyAxLjQwNCAzLjIxMiAxLjcwMiAyLjU0NSAyLjE4NSAyLjA2MyBDIDIuNjY3IDEuNTggMy4zMzQgMS4yODIgNC4wNyAxLjI4MiBMIDguODk5IDEuMjgyIEwgMTMuNzI4IDEuMjgyIEMgMTQuMTQ2IDEuMjgyIDE0LjU1NSAxLjM2NSAxNC45MzQgMS41MjIgQyAxNS4zMTMgMS42NzggMTUuNjYxIDEuOTA5IDE1Ljk1NyAyLjIwNSBMIDE2Ljk0MyAzLjE5MSBMIDE3LjkyOSA0LjE3NyBDIDE4LjIyNSA0LjQ3MyAxOC40NTYgNC44MjEgMTguNjEzIDUuMiBDIDE4Ljc2OSA1LjU3OSAxOC44NTIgNS45ODggMTguODUyIDYuNDA2IEwgMTguODUyIDExLjIzNSBMIDE4Ljg1MiAxNi4wNjQgQyAxOC44NTIgMTYuODAxIDE4LjU1NCAxNy40NjcgMTguMDcxIDE3Ljk0OSBDIDE3LjU4OSAxOC40MzIgMTYuOTIyIDE4LjczIDE2LjE4NiAxOC43MyBMIDEwLjEyOCAxOC43MyBMIDQuMDcgMTguNzMgQyAzLjMzNCAxOC43MyAyLjY2NyAxOC40MzIgMi4xODUgMTcuOTQ5IEMgMS43MDIgMTcuNDY3IDEuNDA0IDE2LjggMS40MDQgMTYuMDY0IEwgMS40MDQgMTAuMDA2IFogTSA0LjA3IDIuNzM2IEMgMy43MzYgMi43MzYgMy40MzMgMi44NzIgMy4yMTMgMy4wOTEgQyAyLjk5NCAzLjMxMSAyLjg1OCAzLjYxNCAyLjg1OCAzLjk0OCBMIDIuODU4IDEwLjAwNiBMIDIuODU4IDE2LjA2NCBDIDIuODU4IDE2LjM5OSAyLjk5NCAxNi43MDIgMy4yMTMgMTYuOTIxIEMgMy40MzMgMTcuMTQgMy43MzYgMTcuMjc2IDQuMDcgMTcuMjc2IEwgNC4xOTEgMTcuMjc2IEwgNC4zMTIgMTcuMjc2IEwgNC4zMTIgMTQuNzMyIEwgNC4zMTIgMTIuMTg3IEMgNC4zMTIgMTEuNTg1IDQuNTU2IDExLjAzOSA0Ljk1MSAxMC42NDUgQyA1LjM0NSAxMC4yNSA1Ljg5MSAxMC4wMDYgNi40OTMgMTAuMDA2IEwgMTAuMTI4IDEwLjAwNiBMIDEzLjc2MyAxMC4wMDYgQyAxNC4zNjYgMTAuMDA2IDE0LjkxMSAxMC4yNSAxNS4zMDUgMTAuNjQ1IEMgMTUuNyAxMS4wMzkgMTUuOTQ0IDExLjU4NSAxNS45NDQgMTIuMTg3IEwgMTUuOTQ0IDE0LjczMiBMIDE1Ljk0NCAxNy4yNzYgTCAxNi4wNjUgMTcuMjc2IEwgMTYuMTg2IDE3LjI3NiBDIDE2LjUyMSAxNy4yNzYgMTYuODI0IDE3LjE0IDE3LjA0MyAxNi45MjEgQyAxNy4yNjIgMTYuNzAyIDE3LjM5OCAxNi4zOTkgMTcuMzk4IDE2LjA2NCBMIDE3LjM5OCAxMS4yMzUgTCAxNy4zOTggNi40MDYgQyAxNy4zOTggNi4xODEgMTcuMzU0IDUuOTYgMTcuMjY5IDUuNzU2IEMgMTcuMTg1IDUuNTUyIDE3LjA2MSA1LjM2NSAxNi45MDEgNS4yMDYgTCAxNS45MTUgNC4yMiBMIDE0LjkyOCAzLjIzMyBDIDE0LjgwMyAzLjEwOCAxNC42NiAzLjAwMyAxNC41MDQgMi45MjMgQyAxNC4zNDggMi44NDMgMTQuMTggMi43ODcgMTQuMDA1IDIuNzU4IEwgMTQuMDA1IDQuMDggTCAxNC4wMDUgNS40MDIgQyAxNC4wMDUgNi4wMDQgMTMuNzYxIDYuNTQ5IDEzLjM2NiA2Ljk0NCBDIDEyLjk3MiA3LjMzOSAxMi40MjcgNy41ODMgMTEuODI0IDcuNTgzIEwgOS42NDMgNy41ODMgTCA3LjQ2MiA3LjU4MyBDIDYuODYgNy41ODMgNi4zMTQgNy4zMzkgNS45MiA2Ljk0NCBDIDUuNTI1IDYuNTQ5IDUuMjgxIDYuMDA0IDUuMjgxIDUuNDAyIEwgNS4yODEgNC4wNjkgTCA1LjI4MSAyLjczNiBMIDQuNjc2IDIuNzM2IFogTSAxNC40OSAxNy4yNzYgTCAxNC40OSAxNC43MzIgTCAxNC40OSAxMi4xODcgQyAxNC40OSAxMS45ODcgMTQuNDA5IDExLjgwNSAxNC4yNzcgMTEuNjczIEMgMTQuMTQ1IDExLjU0MiAxMy45NjQgMTEuNDYgMTMuNzYzIDExLjQ2IEwgMTAuMTI4IDExLjQ2IEwgNi40OTMgMTEuNDYgQyA2LjI5MyAxMS40NiA2LjExMSAxMS41NDIgNS45NzkgMTEuNjczIEMgNS44NDggMTEuODA1IDUuNzY2IDExLjk4NyA1Ljc2NiAxMi4xODcgTCA1Ljc2NiAxNC43MzIgTCA1Ljc2NiAxNy4yNzYgTCAxMC4xMjggMTcuMjc2IFogTSA2LjczNSAyLjczNiBMIDYuNzM1IDQuMDY5IEwgNi43MzUgNS40MDIgQyA2LjczNSA1LjYwMyA2LjgxNyA1Ljc4NCA2Ljk0OCA1LjkxNiBDIDcuMDggNi4wNDcgNy4yNjIgNi4xMjkgNy40NjIgNi4xMjkgTCA5LjY0MyA2LjEyOSBMIDExLjgyNCA2LjEyOSBDIDEyLjAyNSA2LjEyOSAxMi4yMDcgNi4wNDcgMTIuMzM4IDUuOTE2IEMgMTIuNDcgNS43ODQgMTIuNTUxIDUuNjAzIDEyLjU1MSA1LjQwMiBMIDEyLjU1MSA0LjA2OSBMIDEyLjU1MSAyLjczNiBMIDkuNjQzIDIuNzM2IFoiIHN0eWxlPSIiLz4KPC9zdmc+"
    }
])
new function () {
    var CatGroup = IdentGroup({
        class: 'showFirstText',
    });
    CatGroup([{
        label: locale.includes("zh-") ? "其他浏览器中打开" : "Open in other browser",
        id: 'identity-contextmenu-openwithbrowser',
        accesskey: 'e',
        onclick: function (event) {
            let prefs = addMenu.prefs, browser = prefs.getStringPref("chooseBrowser", "");
            function isFileExists(path) {
                if (!path || path === "") return false;
                let app = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                app.initWithPath(path);
                return app.exists();
            }

            if (event.button == 0) {
                let href = addMenu.convertText("%RLINK_OR_URL%");
                if (!isFileExists(browser)) {
                    event.target.nextSibling.click();
                    return;
                }
                if (href.startsWith('http')) {
                    addMenu.exec(browser, href);
                } else {
                    addMenu.exec(browser);
                }
            }
        },
        image: 'chrome://devtools/skin/images/browsers/edge.svg'
    }, {
        id: 'identity-contextmenu-openwithbrowser-changebrowser',
        label: locale.includes("zh-") ? "更换浏览器" : "Change browser",
        tooltiptext: locale.includes("zh-") ? "更换浏览器" : "Change browser",
        style: 'list-style-image: url("chrome://global/skin/icons/settings.svg");',
        oncommand: function (event) {
            const prefs = addMenu.prefs, locale = addMenu.locale;
            function chooseBrowser() {
                let fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                fp.init(window, locale.includes("zh-") ? "设置浏览器路径" : "Set browser path", Ci.nsIFilePicker.modeOpen);
                fp.appendFilter(locale.includes("zh-") ? "执行文件" : "Executable file", "*.exe"); // 非 Windows 必须注释这一行，不过不一定能用
                fp.open(res => {
                    if (res != Ci.nsIFilePicker.returnOK) return;
                    prefs.setStringPref("chooseBrowser", fp.file.path);
                });
            }

            alert(locale.includes("zh-") ? "请先设置浏览器的路径!!!" : "Please set browser path first!!!");
            chooseBrowser();
        }
    }])
}
// SSL小锁右键菜单 End ============================================================
// 标签右键菜单 Start ============================================================
new function () {
    var groupMenu = new TabGroup({
        insertAfter: 'context_reopenInContainer',
        class: 'showFirstText'
    });
    groupMenu([{
        label: locale.includes("zh-") ? "其他浏览器中打开" : "Open in other browser",
        accesskey: 'o',
        onclick: function (event) {
            document.getElementById('identity-contextmenu-openwithbrowser').click();
        },
        image: 'data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI0LjM3NSAyQzE4LjY5NTMxMyAyIDE0LjQxMDE1NiAzLjk4MDQ2OSAxMS4zMTI1IDYuMzQzNzVDMy40NTMxMjUgMTIuMzM1OTM4IDIuNjg3NSAyMi40Njg3NSAyLjY4NzUgMjIuNDY4NzVDMi42NDQ1MzEgMjIuOTI5Njg4IDIuOTIxODc1IDIzLjM2MzI4MSAzLjM2MzI4MSAyMy41MTE3MTlDMy44MDA3ODEgMjMuNjYwMTU2IDQuMjg1MTU2IDIzLjQ4ODI4MSA0LjUzMTI1IDIzLjA5Mzc1QzQuNTMxMjUgMjMuMDkzNzUgNy40MTc5NjkgMTguNjI1IDEyLjQzNzUgMTUuNUMxNC4xMzY3MTkgMTQuNDQxNDA2IDE2LjMwNDY4OCAxMy42Njc5NjkgMTguNSAxMy4xMjVDMTcuNjMyODEzIDEzLjUxMTcxOSAxNC42MzY3MTkgMTQuOTYwOTM4IDExLjgxMjUgMTguMjVDOS4yNjE3MTkgMjEuMjE4NzUgNy44MTI1IDI1LjI2MTcxOSA3LjgxMjUgMjkuNUM3LjgxMjUgMzAuNTY2NDA2IDcuNzkyOTY5IDMyLjYxMzI4MSA4LjQwNjI1IDM0Ljc4MTI1QzguOTc2NTYzIDM2LjgwMDc4MSAxMC4wNzgxMjUgMzguNzYxNzE5IDExLjA5Mzc1IDQwLjI1QzE0LjAzNTE1NiA0NC41NTQ2ODggMTguMzU5Mzc1IDQ2LjM1NTQ2OSAyMC40Mzc1IDQ3LjAzMTI1QzIyLjgzMjAzMSA0Ny44MDg1OTQgMjUuMjkyOTY5IDQ4IDI3LjU2MjUgNDhDMzUuNjkxNDA2IDQ4IDQxLjEyNSA0NC42NTYyNSA0MS4xMjUgNDQuNjU2MjVDNDEuNDI1NzgxIDQ0LjQ2ODc1IDQxLjYwMTU2MyA0NC4xMzY3MTkgNDEuNTkzNzUgNDMuNzgxMjVMNDEuNTkzNzUgMzQuNTMxMjVDNDEuNjAxNTYzIDM0LjE1NjI1IDQxLjM5ODQzOCAzMy44MTI1IDQxLjA3MDMxMyAzMy42MzI4MTNDNDAuNzQyMTg4IDMzLjQ1NzAzMSA0MC4zMzk4NDQgMzMuNDc2NTYzIDQwLjAzMTI1IDMzLjY4NzVDNDAuMDMxMjUgMzMuNjg3NSAzNy44OTg0MzggMzUuMTQwNjI1IDM1Ljg0Mzc1IDM1Ljc1QzM0LjI5Njg3NSAzNi4yMTA5MzggMzMuMDM1MTU2IDM2LjgxMjUgMjguNzE4NzUgMzYuODEyNUMyMi42MDkzNzUgMzYuODEyNSAyMC4wMjczNDQgMzQuNjk1MzEzIDE4Ljc4MTI1IDMyLjY1NjI1QzE3Ljk4ODI4MSAzMS4zNTU0NjkgMTcuNzgxMjUgMzAuMjkyOTY5IDE3LjcxODc1IDI5LjUzMTI1TDQ0LjMxMjUgMjkuNTMxMjVDNDQuODYzMjgxIDI5LjUzMTI1IDQ1LjMxMjUgMjkuMDgyMDMxIDQ1LjMxMjUgMjguNTMxMjVMNDUuMzEyNSAyMy45Mzc1QzQ1LjMxMjUgMjMuOTI1NzgxIDQ1LjMxMjUgMjMuOTE3OTY5IDQ1LjMxMjUgMjMuOTA2MjVDNDUuMzEyNSAyMy45MDYyNSA0NS4yMjI2NTYgMjAuMzM5ODQ0IDQ0LjQ2ODc1IDE3LjI1QzQ0LjA2NjQwNiAxNS42MDE1NjMgNDMuNDQ5MjE5IDEzLjkxMDE1NiA0Mi42MjUgMTIuNTMxMjVDNDAuODUxNTYzIDkuNTU0Njg4IDM5LjEwMTU2MyA3LjMyODEyNSAzNS4xMjUgNC44NzVDMzEuMDE1NjI1IDIuMzM5ODQ0IDI2LjUzOTA2MyAyIDI0LjM3NSAyIFogTSAyNC4zNzUgNEMyNi4zMDQ2ODggNCAzMC40NDE0MDYgNC4zNTkzNzUgMzQuMDYyNSA2LjU5Mzc1QzM3LjgyMDMxMyA4LjkxMDE1NiAzOS4xOTUzMTMgMTAuNjk1MzEzIDQwLjkwNjI1IDEzLjU2MjVDNDEuNTg1OTM4IDE0LjcwNzAzMSA0Mi4xNjc5NjkgMTYuMjM4MjgxIDQyLjUzMTI1IDE3LjcxODc1QzQzLjIwNzAzMSAyMC40ODgyODEgNDMuMzEyNSAyMy45Mzc1IDQzLjMxMjUgMjMuOTM3NUw0My4zMTI1IDI3LjUzMTI1TDE2LjY4NzUgMjcuNTMxMjVDMTYuMTYwMTU2IDI3LjUzMTI1IDE1LjcxODc1IDI3Ljk0MTQwNiAxNS42ODc1IDI4LjQ2ODc1QzE1LjY4NzUgMjguNDY4NzUgMTUuNDY4NzUgMzEuMDgyMDMxIDE3LjA2MjUgMzMuNjg3NUMxOC42NTYyNSAzNi4yOTI5NjkgMjIuMTIxMDk0IDM4LjgxMjUgMjguNzE4NzUgMzguODEyNUMzMy4yNDIxODggMzguODEyNSAzNS4wNDY4NzUgMzguMDU4NTk0IDM2LjQwNjI1IDM3LjY1NjI1QzM3LjYwNTQ2OSAzNy4zMDA3ODEgMzguNzI2NTYzIDM2Ljc1MzkwNiAzOS41OTM3NSAzNi4yODEyNUwzOS41OTM3NSA0My4xNTYyNUMzOC45Mzc1IDQzLjUzOTA2MyAzNC41OTc2NTYgNDYgMjcuNTYyNSA0NkMyNS40MDYyNSA0NiAyMy4xNjc5NjkgNDUuODA4NTk0IDIxLjA2MjUgNDUuMTI1QzE5LjIxMDkzOCA0NC41MjM0MzggMTUuMzE2NDA2IDQyLjg4MjgxMyAxMi43NSAzOS4xMjVDMTEuODIwMzEzIDM3Ljc2MTcxOSAxMC43ODkwNjMgMzUuOTM3NSAxMC4zMTI1IDM0LjI1QzkuNzkyOTY5IDMyLjQxMDE1NiA5LjgxMjUgMzAuNTc4MTI1IDkuODEyNSAyOS41QzkuODEyNSAyNS43MTg3NSAxMS4xMDkzNzUgMjIuMDk3NjU2IDEzLjMxMjUgMTkuNTMxMjVDMTQuMzkwNjI1IDE4LjI3MzQzOCAxNS41MjczNDQgMTcuMzUxNTYzIDE2LjU5Mzc1IDE2LjU5Mzc1QzE2LjU3ODEyNSAxNi42MjUgMTYuNTc4MTI1IDE2LjYyMTA5NCAxNi41NjI1IDE2LjY1NjI1QzE1LjcxNDg0NCAxOC42NTYyNSAxNS41IDIwLjYyNSAxNS41IDIwLjYyNUMxNS40NzI2NTYgMjAuOTA2MjUgMTUuNTY2NDA2IDIxLjE4MzU5NCAxNS43NTc4MTMgMjEuMzk0NTMxQzE1Ljk0OTIxOSAyMS42MDE1NjMgMTYuMjE4NzUgMjEuNzE4NzUgMTYuNSAyMS43MTg3NUwzMi4wOTM3NSAyMS43MTg3NUMzMi42MDE1NjMgMjEuNzIyNjU2IDMzLjAzMTI1IDIxLjM0NzY1NiAzMy4wOTM3NSAyMC44NDM3NUMzMy4wOTM3NSAyMC44NDM3NSAzMy4zNTU0NjkgMTguMjg5MDYzIDMyLjI1IDE1LjY4NzVDMzEuMTQ0NTMxIDEzLjA4NTkzOCAyOC40NDE0MDYgMTAuNDA2MjUgMjMuMjUgMTAuNDA2MjVDMTkuMzQ3NjU2IDEwLjQwNjI1IDE0LjczODI4MSAxMS43MTg3NSAxMS4zNzUgMTMuODEyNUM4LjkyMTg3NSAxNS4zMzk4NDQgNy4wMjM0MzggMTcuMTI1IDUuNTkzNzUgMTguNjU2MjVDNi41MTk1MzEgMTUuNDY4NzUgOC4zODI4MTMgMTEuMDk3NjU2IDEyLjUzMTI1IDcuOTM3NUMxNS4zNTkzNzUgNS43ODEyNSAxOS4xNTYyNSA0IDI0LjM3NSA0IFogTSAyMy4yNSAxMi40MDYyNUMyNy44MDA3ODEgMTIuNDA2MjUgMjkuNTMxMjUgMTQuNDEwMTU2IDMwLjQwNjI1IDE2LjQ2ODc1QzMwLjk4MDQ2OSAxNy44MTY0MDYgMzEuMDgyMDMxIDE4LjkzMzU5NCAzMS4wOTM3NSAxOS43MTg3NUwxNy43ODEyNSAxOS43MTg3NUMxNy44OTQ1MzEgMTkuMDgyMDMxIDE3LjkyOTY4OCAxOC41NjI1IDE4LjQwNjI1IDE3LjQzNzVDMTkuMTA5Mzc1IDE1Ljc3NzM0NCAyMC4yODEyNSAxNC4zNzUgMjAuMjgxMjUgMTQuMzc1QzIwLjQ3NjU2MyAxNC4xNjAxNTYgMjAuNTY2NDA2IDEzLjg3MTA5NCAyMC41MzEyNSAxMy41ODIwMzFDMjAuNDkyMTg4IDEzLjI5Mjk2OSAyMC4zMzU5MzggMTMuMDM1MTU2IDIwLjA5Mzc1IDEyLjg3NUMyMS4xNzE4NzUgMTIuNjg3NSAyMi4yNzM0MzggMTIuNDA2MjUgMjMuMjUgMTIuNDA2MjVaIiAvPg0KPC9zdmc+'
    }, {
        label: locale.includes("zh-") ? "更换浏览器" : "Change browser",
        tooltiptext: locale.includes("zh-") ? "更换浏览器" : "Change browser",
        style: 'list-style-image: url("chrome://global/skin/icons/settings.svg");',
        onclick: function (event) {
            document.getElementById('identity-contextmenu-openwithbrowser-changebrowser').click();
        },
    }]);
}
tab([{
    "data-l10n-id": 'move-to-new-window',
    command: 'context_openTabInWindow',
    insertAfter: 'context_moveTabOptions',
}])
new function () {
    var groupMenu = new TabGroup({
        insertAfter: 'context_moveTabOptions',
    });
    groupMenu([{
        "data-l10n-id": 'move-to-start',
        class: "showText",
        command: "context_moveToStart"
    }, {
        "data-l10n-id": 'move-to-end',
        class: "showText",
        command: "context_moveToEnd"
    }]);
    css('#context_moveTabOptions{ display: none }')
}
new function () {
    var groupMenu = new TabGroup({
        class: 'showText',
        insertBefore: 'context_bookmarkSelectedTabs',
        onshowing: function (item) {
            item.hidden = gBrowser.currentURI.spec.startsWith('file')
        }
    });
    groupMenu([{
        id: 'addMenu-tab-title',
        label: locale.includes("zh-") ? '复制标题' : 'Copy title',
        class: 'copy',
        text: "%TITLE%",
    }, {
        id: 'addMenu-tab-link',
        label: locale.includes("zh-") ? '复制URL' : 'Copy URL',
        class: 'copy',
        text: "%URL%",
    }]);
}
new function () {
    var groupMenu = new TabGroup({
        class: 'showFirstText',
        insertBefore: 'context_bookmarkSelectedTabs',
        onshowing: function (item) {
            item.hidden = gBrowser.currentURI.spec.startsWith('file')
        }
    });
    groupMenu([{
        label: locale.includes("zh-") ? "复制标题+URL" : "Copy Title & Link",
        text: "%TITLE%\n%URL%",
        image: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg==",
    }, {
        label: locale.includes("zh-") ? "复制标题+URL[MD]" : "Copy Title & Link as markdown",
        text: "[%TITLE%](%URL%)",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuMTM4IDQuMzI3IEMgMTcuMjIxIDQuMzI3IDE3LjMwMiA0LjMzNiAxNy4zOCA0LjM1MiBDIDE3LjQ1OCA0LjM2OCAxNy41MzMgNC4zOTEgMTcuNjA1IDQuNDIxIEMgMTcuNjc3IDQuNDUxIDE3Ljc0NSA0LjQ4OSAxNy44MDkgNC41MzIgQyAxNy44NzMgNC41NzUgMTcuOTMyIDQuNjI0IDE3Ljk4NiA0LjY3OCBDIDE4LjA0MSA0LjczMyAxOC4wOSA0Ljc5MiAxOC4xMzMgNC44NTYgQyAxOC4xNzYgNC45MiAxOC4yMTMgNC45ODkgMTguMjQzIDUuMDYgQyAxOC4yNzQgNS4xMzIgMTguMjk3IDUuMjA3IDE4LjMxMyA1LjI4NSBDIDE4LjMyOSA1LjM2MyAxOC4zMzcgNS40NDQgMTguMzM3IDUuNTI3IEwgMTguMzM3IDYuNzI3IEwgMTguMzM3IDcuOTI2IEwgMTguMzM3IDkuMTI2IEwgMTguMzM3IDEwLjMyNSBMIDE4LjMzNyAxMS41MjUgTCAxOC4zMzcgMTIuNzI0IEwgMTguMzM3IDEzLjkyNCBMIDE4LjMzNyAxNS4xMjMgQyAxOC4zMzcgMTUuMjA2IDE4LjMyOSAxNS4yODcgMTguMzEzIDE1LjM2NSBDIDE4LjI5NyAxNS40NDQgMTguMjc0IDE1LjUxOSAxOC4yNDMgMTUuNTkxIEMgMTguMjEzIDE1LjY2MyAxOC4xNzYgMTUuNzMxIDE4LjEzMyAxNS43OTUgQyAxOC4wOSAxNS44NTkgMTguMDQxIDE1LjkxOCAxNy45ODYgMTUuOTcyIEMgMTcuOTMyIDE2LjAyNyAxNy44NzMgMTYuMDc2IDE3LjgwOSAxNi4xMTkgQyAxNy43NDUgMTYuMTYyIDE3LjY3NyAxNi4xOTkgMTcuNjA1IDE2LjIyOSBDIDE3LjUzMyAxNi4yNiAxNy40NTggMTYuMjgzIDE3LjM4IDE2LjI5OSBDIDE3LjMwMiAxNi4zMTUgMTcuMjIxIDE2LjMyMyAxNy4xMzggMTYuMzIzIEwgMTUuMzM5IDE2LjMyMyBMIDEzLjU0IDE2LjMyMyBMIDExLjc0MSAxNi4zMjMgTCA5Ljk0MSAxNi4zMjMgTCA4LjE0MiAxNi4zMjMgTCA2LjM0MiAxNi4zMjMgTCA0LjU0MyAxNi4zMjMgTCAyLjc0MyAxNi4zMjMgQyAyLjY2MSAxNi4zMjMgMi41OCAxNi4zMTUgMi41MDIgMTYuMjk5IEMgMi40MjQgMTYuMjgzIDIuMzQ4IDE2LjI2IDIuMjc2IDE2LjIyOSBDIDIuMjA1IDE2LjE5OSAyLjEzNyAxNi4xNjIgMi4wNzMgMTYuMTE5IEMgMi4wMDkgMTYuMDc2IDEuOTUgMTYuMDI3IDEuODk1IDE1Ljk3MiBDIDEuODQxIDE1LjkxOCAxLjc5MiAxNS44NTkgMS43NDkgMTUuNzk1IEMgMS43MDYgMTUuNzMxIDEuNjY4IDE1LjY2MyAxLjYzOCAxNS41OTEgQyAxLjYwOCAxNS41MTkgMS41ODQgMTUuNDQ0IDEuNTY4IDE1LjM2NSBDIDEuNTUyIDE1LjI4NyAxLjU0NCAxNS4yMDYgMS41NDQgMTUuMTIzIEwgMS41NDQgMTMuOTI0IEwgMS41NDQgMTIuNzI0IEwgMS41NDQgMTEuNTI1IEwgMS41NDQgMTAuMzI1IEwgMS41NDQgOS4xMjYgTCAxLjU0NCA3LjkyNiBMIDEuNTQ0IDYuNzI3IEwgMS41NDQgNS41MjcgQyAxLjU0NCA1LjQ0NCAxLjU1MiA1LjM2MyAxLjU2OCA1LjI4NSBDIDEuNTg0IDUuMjA3IDEuNjA4IDUuMTMyIDEuNjM4IDUuMDYgQyAxLjY2OCA0Ljk4OCAxLjcwNiA0LjkyIDEuNzQ5IDQuODU2IEMgMS43OTIgNC43OTIgMS44NDEgNC43MzMgMS44OTUgNC42NzggQyAxLjk1IDQuNjI0IDIuMDA5IDQuNTc1IDIuMDczIDQuNTMyIEMgMi4xMzcgNC40ODkgMi4yMDUgNC40NTIgMi4yNzYgNC40MjEgQyAyLjM0OCA0LjM5MSAyLjQyNCA0LjM2OCAyLjUwMiA0LjM1MiBDIDIuNTggNC4zMzYgMi42NjEgNC4zMjcgMi43NDMgNC4zMjcgTCA0LjU0MyA0LjMyNyBMIDYuMzQyIDQuMzI3IEwgOC4xNDIgNC4zMjcgTCA5Ljk0MSA0LjMyNyBMIDExLjc0MSA0LjMyNyBMIDEzLjU0IDQuMzI3IEwgMTUuMzM5IDQuMzI3IFogTSAyLjc0MyAzLjEyOCBDIDIuNTc3IDMuMTI4IDIuNDE2IDMuMTQ1IDIuMjYgMy4xNzcgQyAyLjEwNCAzLjIwOSAxLjk1NCAzLjI1NiAxLjgxIDMuMzE3IEMgMS42NjcgMy4zNzggMS41MyAzLjQ1MiAxLjQwMiAzLjUzOCBDIDEuMjc1IDMuNjI0IDEuMTU2IDMuNzIzIDEuMDQ3IDMuODMxIEMgMC45MzggMy45NCAwLjg0IDQuMDU5IDAuNzU0IDQuMTg2IEMgMC42NjggNC4zMTQgMC41OTMgNC40NTEgMC41MzMgNC41OTQgQyAwLjQ3MiA0LjczOCAwLjQyNSA0Ljg4OCAwLjM5MyA1LjA0NCBDIDAuMzYxIDUuMiAwLjM0NCA1LjM2MiAwLjM0NCA1LjUyNyBMIDAuMzQ0IDYuNzI3IEwgMC4zNDQgNy45MjYgTCAwLjM0NCA5LjEyNiBMIDAuMzQ0IDEwLjMyNSBMIDAuMzQ0IDExLjUyNSBMIDAuMzQ0IDEyLjcyNCBMIDAuMzQ0IDEzLjkyNCBMIDAuMzQ0IDE1LjEyMyBDIDAuMzQ0IDE1LjI4OSAwLjM2MSAxNS40NSAwLjM5MyAxNS42MDcgQyAwLjQyNSAxNS43NjMgMC40NzIgMTUuOTE0IDAuNTMzIDE2LjA1NyBDIDAuNTkzIDE2LjIgMC42NjggMTYuMzM2IDAuNzU0IDE2LjQ2NCBDIDAuODQgMTYuNTkyIDAuOTM4IDE2LjcxMSAxLjA0NyAxNi44MTkgQyAxLjE1NiAxNi45MjggMS4yNzUgMTcuMDI2IDEuNDAyIDE3LjExMyBDIDEuNTMgMTcuMTk5IDEuNjY2IDE3LjI3MyAxLjgxIDE3LjMzNCBDIDEuOTUzIDE3LjM5NSAyLjEwNCAxNy40NDIgMi4yNiAxNy40NzMgQyAyLjQxNiAxNy41MDUgMi41NzcgMTcuNTIyIDIuNzQzIDE3LjUyMiBMIDQuNTQyIDE3LjUyMiBMIDYuMzQyIDE3LjUyMiBMIDguMTQxIDE3LjUyMiBMIDkuOTQxIDE3LjUyMiBMIDExLjc0IDE3LjUyMiBMIDEzLjU0IDE3LjUyMiBMIDE1LjMzOSAxNy41MjIgTCAxNy4xMzggMTcuNTIyIEMgMTcuMzA0IDE3LjUyMiAxNy40NjYgMTcuNTA1IDE3LjYyMiAxNy40NzMgQyAxNy43NzggMTcuNDQyIDE3LjkyOCAxNy4zOTUgMTguMDcyIDE3LjMzNCBDIDE4LjIxNSAxNy4yNzMgMTguMzUyIDE3LjE5OSAxOC40NzkgMTcuMTEzIEMgMTguNjA3IDE3LjAyNiAxOC43MjUgMTYuOTI4IDE4LjgzNCAxNi44MTkgQyAxOC45NDIgMTYuNzExIDE5LjA0MSAxNi41OTIgMTkuMTI3IDE2LjQ2NCBDIDE5LjIxMyAxNi4zMzYgMTkuMjg3IDE2LjIgMTkuMzQ4IDE2LjA1NyBDIDE5LjQwOSAxNS45MTMgMTkuNDU2IDE1Ljc2MiAxOS40ODggMTUuNjA2IEMgMTkuNTIgMTUuNDUgMTkuNTM3IDE1LjI4OSAxOS41MzcgMTUuMTIzIEwgMTkuNTM3IDEzLjkyNCBMIDE5LjUzNyAxMi43MjQgTCAxOS41MzcgMTEuNTI1IEwgMTkuNTM3IDEwLjMyNSBMIDE5LjUzNyA5LjEyNiBMIDE5LjUzNyA3LjkyNiBMIDE5LjUzNyA2LjcyNyBMIDE5LjUzNyA1LjUyNyBDIDE5LjUzNyA1LjM2MiAxOS41MiA1LjIgMTkuNDg4IDUuMDQ0IEMgMTkuNDU2IDQuODg4IDE5LjQwOSA0LjczNyAxOS4zNDggNC41OTMgQyAxOS4yODcgNC40NSAxOS4yMTMgNC4zMTMgMTkuMTI3IDQuMTg2IEMgMTkuMDQxIDQuMDU4IDE4Ljk0MiAzLjk0IDE4LjgzNCAzLjgzMSBDIDE4LjcyNSAzLjcyMiAxOC42MDcgMy42MjQgMTguNDc5IDMuNTM4IEMgMTguMzUyIDMuNDUxIDE4LjIxNSAzLjM3NyAxOC4wNzIgMy4zMTYgQyAxNy45MjggMy4yNTYgMTcuNzc4IDMuMjA5IDE3LjYyMSAzLjE3NyBDIDE3LjQ2NSAzLjE0NSAxNy4zMDMgMy4xMjggMTcuMTM4IDMuMTI4IEwgMTUuMzM4IDMuMTI4IEwgMTMuNTM5IDMuMTI4IEwgMTEuNzM5IDMuMTI4IEwgOS45NCAzLjEyOCBMIDguMTQxIDMuMTI4IEwgNi4zNDIgMy4xMjggTCA0LjU0MiAzLjEyOCBaIiBzdHlsZT0iIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNIDExLjMxNSAxMC41IEMgMTEuMzQ1IDEwLjQ3MSAxMS4zNzYgMTAuNDQ2IDExLjQxIDEwLjQyNCBDIDExLjQ0MyAxMC40MDIgMTEuNDc4IDEwLjM4MyAxMS41MTQgMTAuMzY4IEMgMTEuNTUgMTAuMzU0IDExLjU4NyAxMC4zNDMgMTEuNjI1IDEwLjMzNSBDIDExLjY2MyAxMC4zMjggMTEuNzAyIDEwLjMyNCAxMS43NCAxMC4zMjQgQyAxMS43NzkgMTAuMzI0IDExLjgxNyAxMC4zMjggMTEuODU1IDEwLjMzNSBDIDExLjg5MyAxMC4zNDMgMTEuOTMgMTAuMzU0IDExLjk2NiAxMC4zNjggQyAxMi4wMDIgMTAuMzgzIDEyLjAzNyAxMC40MDIgMTIuMDcxIDEwLjQyNCBDIDEyLjEwNCAxMC40NDYgMTIuMTM1IDEwLjQ3MSAxMi4xNjUgMTAuNSBMIDEyLjQxMSAxMC43NDcgTCAxMi42NTggMTAuOTk0IEwgMTIuOTA1IDExLjI0MSBMIDEzLjE1MiAxMS40ODggTCAxMy4zOTggMTEuNzM1IEwgMTMuNjQ1IDExLjk4MiBMIDEzLjg5MiAxMi4yMjkgTCAxNC4xMzkgMTIuNDc2IEwgMTQuMzg1IDEyLjIyOSBMIDE0LjYzMiAxMS45ODIgTCAxNC44NzkgMTEuNzM1IEwgMTUuMTI2IDExLjQ4OCBMIDE1LjM3MiAxMS4yNDEgTCAxNS42MTkgMTAuOTk0IEwgMTUuODY2IDEwLjc0NyBMIDE2LjExMyAxMC41IEMgMTYuMTUzIDEwLjQ2IDE2LjE5OCAxMC40MjYgMTYuMjQ1IDEwLjQgQyAxNi4yOTIgMTAuMzc0IDE2LjM0MSAxMC4zNTUgMTYuMzkxIDEwLjM0MiBDIDE2LjQ0MSAxMC4zMyAxNi40OTIgMTAuMzI0IDE2LjU0MyAxMC4zMjQgQyAxNi41OTQgMTAuMzI1IDE2LjY0NSAxMC4zMzIgMTYuNjk0IDEwLjM0NSBDIDE2Ljc0MiAxMC4zNTggMTYuNzkgMTAuMzc3IDE2LjgzNCAxMC40MDIgQyAxNi44NzggMTAuNDI2IDE2LjkyIDEwLjQ1NyAxNi45NTcgMTAuNDkzIEMgMTYuOTk0IDEwLjUyOSAxNy4wMjcgMTAuNTcgMTcuMDU0IDEwLjYxNiBDIDE3LjA4MSAxMC42NjIgMTcuMTAzIDEwLjcxMyAxNy4xMTggMTAuNzY5IEMgMTcuMTI1IDEwLjc5NSAxNy4xMyAxMC44MjEgMTcuMTM0IDEwLjg0OCBDIDE3LjEzNyAxMC44NzQgMTcuMTM5IDEwLjkgMTcuMTM5IDEwLjkyNiBDIDE3LjEzOCAxMC45NTIgMTcuMTM2IDEwLjk3OCAxNy4xMzMgMTEuMDA0IEMgMTcuMTI5IDExLjAzIDE3LjEyNCAxMS4wNTUgMTcuMTE4IDExLjA4IEMgMTcuMTExIDExLjEwNiAxNy4xMDMgMTEuMTMgMTcuMDkzIDExLjE1NCBDIDE3LjA4MyAxMS4xNzggMTcuMDcyIDExLjIwMiAxNy4wNTkgMTEuMjI0IEMgMTcuMDQ2IDExLjI0NyAxNy4wMzEgMTEuMjY4IDE3LjAxNSAxMS4yODkgQyAxNi45OTkgMTEuMzEgMTYuOTgyIDExLjMzIDE2Ljk2MyAxMS4zNDkgTCAxNi42NjMgMTEuNjQ5IEwgMTYuMzYzIDExLjk0OSBMIDE2LjA2MyAxMi4yNDkgTCAxNS43NjQgMTIuNTQ5IEwgMTUuNDY0IDEyLjg0OSBMIDE1LjE2NCAxMy4xNDkgTCAxNC44NjQgMTMuNDQ5IEwgMTQuNTY0IDEzLjc0OSBDIDE0LjUzNCAxMy43NzkgMTQuNTAzIDEzLjgwNCAxNC40NyAxMy44MjYgQyAxNC40MzYgMTMuODQ4IDE0LjQwMSAxMy44NjYgMTQuMzY1IDEzLjg4MSBDIDE0LjMyOSAxMy44OTYgMTQuMjkyIDEzLjkwNyAxNC4yNTQgMTMuOTE0IEMgMTQuMjE2IDEzLjkyMSAxNC4xNzcgMTMuOTI1IDE0LjEzOSAxMy45MjUgQyAxNC4xIDEzLjkyNSAxNC4wNjIgMTMuOTIxIDE0LjAyNCAxMy45MTQgQyAxMy45ODYgMTMuOTA3IDEzLjk0OSAxMy44OTYgMTMuOTEzIDEzLjg4MSBDIDEzLjg3NyAxMy44NjcgMTMuODQyIDEzLjg0OCAxMy44MDkgMTMuODI2IEMgMTMuNzc1IDEzLjgwNCAxMy43NDMgMTMuNzc5IDEzLjcxNCAxMy43NDkgTCAxMy40MTQgMTMuNDQ5IEwgMTMuMTE0IDEzLjE0OSBMIDEyLjgxNCAxMi44NDkgTCAxMi41MTUgMTIuNTQ5IEwgMTIuMjE1IDEyLjI0OSBMIDExLjkxNSAxMS45NDkgTCAxMS42MTUgMTEuNjQ5IEwgMTEuMzE1IDExLjM0OSBDIDExLjI4NSAxMS4zMiAxMS4yNiAxMS4yODkgMTEuMjM4IDExLjI1NSBDIDExLjIxNiAxMS4yMjIgMTEuMTk3IDExLjE4NyAxMS4xODMgMTEuMTUxIEMgMTEuMTY4IDExLjExNSAxMS4xNTcgMTEuMDc4IDExLjE1IDExLjA0IEMgMTEuMTQzIDExLjAwMiAxMS4xMzkgMTAuOTY0IDExLjEzOSAxMC45MjUgQyAxMS4xMzkgMTAuODg3IDExLjE0MyAxMC44NDggMTEuMTUgMTAuODEgQyAxMS4xNTcgMTAuNzcyIDExLjE2OCAxMC43MzUgMTEuMTgzIDEwLjY5OSBDIDExLjE5NyAxMC42NjMgMTEuMjE2IDEwLjYyNyAxMS4yMzggMTAuNTk0IEMgMTEuMjYgMTAuNTYxIDExLjI4NSAxMC41MjkgMTEuMzE1IDEwLjUgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTSAxNC4xMzkgNi43MjYgQyAxNC4xOCA2LjcyNiAxNC4yMjEgNi43MyAxNC4yNiA2LjczOCBDIDE0LjI5OSA2Ljc0NiAxNC4zMzcgNi43NTggMTQuMzczIDYuNzczIEMgMTQuNDA5IDYuNzg5IDE0LjQ0MyA2LjgwNyAxNC40NzUgNi44MjkgQyAxNC41MDcgNi44NTEgMTQuNTM2IDYuODc1IDE0LjU2MyA2LjkwMiBDIDE0LjU5MSA2LjkzIDE0LjYxNSA2Ljk1OSAxNC42MzcgNi45OTEgQyAxNC42NTkgNy4wMjMgMTQuNjc3IDcuMDU3IDE0LjY5MiA3LjA5MyBDIDE0LjcwNyA3LjEyOSAxNC43MTkgNy4xNjcgMTQuNzI3IDcuMjA2IEMgMTQuNzM1IDcuMjQ1IDE0LjczOSA3LjI4NSAxNC43MzkgNy4zMjYgTCAxNC43MzkgNy45MjYgTCAxNC43MzkgOC41MjYgTCAxNC43MzkgOS4xMjYgTCAxNC43MzkgOS43MjUgTCAxNC43MzkgMTAuMzI1IEwgMTQuNzM5IDEwLjkyNSBMIDE0LjczOSAxMS41MjUgTCAxNC43MzkgMTIuMTI0IEMgMTQuNzM5IDEyLjE4MiAxNC43MzEgMTIuMjM3IDE0LjcxNyAxMi4yODkgQyAxNC43MDMgMTIuMzQgMTQuNjgyIDEyLjM4OSAxNC42NTUgMTIuNDMzIEMgMTQuNjI5IDEyLjQ3NyAxNC41OTYgMTIuNTE3IDE0LjU2IDEyLjU1MyBDIDE0LjUyMyAxMi41ODggMTQuNDgzIDEyLjYxOSAxNC40MzkgMTIuNjQ0IEMgMTQuMzk1IDEyLjY3IDE0LjM0OCAxMi42ODkgMTQuMjk5IDEyLjcwMyBDIDE0LjI1IDEyLjcxNyAxNC4yIDEyLjcyNCAxNC4xNDggMTIuNzI1IEMgMTQuMDk3IDEyLjcyNiAxNC4wNDQgMTIuNzIgMTMuOTkyIDEyLjcwNyBDIDEzLjk0MSAxMi42OTQgMTMuODg5IDEyLjY3MyAxMy44MzkgMTIuNjQ0IEMgMTMuODE2IDEyLjYzMSAxMy43OTQgMTIuNjE2IDEzLjc3MyAxMi42IEMgMTMuNzUyIDEyLjU4NCAxMy43MzIgMTIuNTY3IDEzLjcxNCAxMi41NDggQyAxMy42OTYgMTIuNTMgMTMuNjc4IDEyLjUxIDEzLjY2MyAxMi40OSBDIDEzLjY0NyAxMi40NjkgMTMuNjMzIDEyLjQ0OCAxMy42MiAxMi40MjUgQyAxMy42MDcgMTIuNDAzIDEzLjU5NiAxMi4zNzkgMTMuNTg2IDEyLjM1NSBDIDEzLjU3NiAxMi4zMzEgMTMuNTY3IDEyLjMwNyAxMy41NiAxMi4yODEgQyAxMy41NTMgMTIuMjU2IDEzLjU0OCAxMi4yMyAxMy41NDQgMTIuMjA0IEMgMTMuNTQxIDEyLjE3OCAxMy41MzkgMTIuMTUxIDEzLjUzOSAxMi4xMjQgTCAxMy41MzkgMTEuNTI1IEwgMTMuNTM5IDEwLjkyNSBMIDEzLjUzOSAxMC4zMjUgTCAxMy41MzkgOS43MjUgTCAxMy41MzkgOS4xMjYgTCAxMy41MzkgOC41MjYgTCAxMy41MzkgNy45MjYgTCAxMy41MzkgNy4zMjYgQyAxMy41MzkgNy4yODUgMTMuNTQzIDcuMjQ0IDEzLjU1MSA3LjIwNSBDIDEzLjU1OSA3LjE2NyAxMy41NzEgNy4xMjkgMTMuNTg2IDcuMDkzIEMgMTMuNjAxIDcuMDU3IDEzLjYyIDcuMDIzIDEzLjY0MSA2Ljk5MSBDIDEzLjY2MyA2Ljk1OSAxMy42ODggNi45MjkgMTMuNzE1IDYuOTAyIEMgMTMuNzQyIDYuODc1IDEzLjc3MiA2Ljg1IDEzLjgwNCA2LjgyOSBDIDEzLjgzNiA2LjgwNyAxMy44NyA2Ljc4OSAxMy45MDYgNi43NzMgQyAxMy45NDIgNi43NTggMTMuOTc5IDYuNzQ2IDE0LjAxOCA2LjczOCBDIDE0LjA1NyA2LjczIDE0LjA5OCA2LjcyNiAxNC4xMzkgNi43MjYgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGQ9Ik0gNC42MTQgMTMuOTI0IEwgNC42MTQgMTMuMzI2IEwgNC42MTQgMTIuNzI4IEwgNC42MTQgMTIuMTI5IEwgNC42MTQgMTEuNTMxIEwgNC42MTQgMTAuOTMzIEwgNC42MTQgMTAuMzM0IEwgNC42MTQgOS43MzYgTCA0LjYxNCA5LjEzNyBMIDQuNjIzIDkuMTM3IEwgNC42MzEgOS4xMzcgTCA0LjYzOSA5LjEzNyBMIDQuNjQ4IDkuMTM3IEwgNC42NTYgOS4xMzcgTCA0LjY2NSA5LjEzNyBMIDQuNjczIDkuMTM3IEwgNC42ODIgOS4xMzcgTCA0Ljg5NiA5LjYyMyBMIDUuMTEgMTAuMTA5IEwgNS4zMjQgMTAuNTk1IEwgNS41MzggMTEuMDggTCA1Ljc1MiAxMS41NjYgTCA1Ljk2NyAxMi4wNTEgTCA2LjE4MSAxMi41MzcgTCA2LjM5NSAxMy4wMjMgTCA2LjUxMSAxMy4wMjMgTCA2LjYyNyAxMy4wMjMgTCA2Ljc0MyAxMy4wMjMgTCA2Ljg1OSAxMy4wMjMgTCA2Ljk3NSAxMy4wMjMgTCA3LjA5MSAxMy4wMjMgTCA3LjIwNyAxMy4wMjMgTCA3LjMyMyAxMy4wMjMgTCA3LjUzNiAxMi41MzcgTCA3Ljc0OSAxMi4wNTEgTCA3Ljk2MiAxMS41NjYgTCA4LjE3NSAxMS4wOCBMIDguMzg4IDEwLjU5NCBMIDguNjAxIDEwLjEwOCBMIDguODEzIDkuNjIyIEwgOS4wMjYgOS4xMzYgTCA5LjAzNCA5LjEzNiBMIDkuMDQzIDkuMTM2IEwgOS4wNTEgOS4xMzYgTCA5LjA2IDkuMTM2IEwgOS4wNjggOS4xMzYgTCA5LjA3NyA5LjEzNiBMIDkuMDg1IDkuMTM2IEwgOS4wOTQgOS4xMzYgTCA5LjA5NCA5LjczNCBMIDkuMDk0IDEwLjMzMyBMIDkuMDk0IDEwLjkzMSBMIDkuMDk0IDExLjUzIEwgOS4wOTQgMTIuMTI4IEwgOS4wOTQgMTIuNzI3IEwgOS4wOTQgMTMuMzI1IEwgOS4wOTQgMTMuOTI0IEwgOS4yNTUgMTMuOTI0IEwgOS40MTYgMTMuOTI0IEwgOS41NzcgMTMuOTI0IEwgOS43MzggMTMuOTI0IEwgOS44OTggMTMuOTI0IEwgMTAuMDU5IDEzLjkyNCBMIDEwLjIyIDEzLjkyNCBMIDEwLjM4MSAxMy45MjQgTCAxMC4zODEgMTMuMDI0IEwgMTAuMzgxIDEyLjEyNSBMIDEwLjM4MSAxMS4yMjUgTCAxMC4zODEgMTAuMzI2IEwgMTAuMzgxIDkuNDI2IEwgMTAuMzgxIDguNTI3IEwgMTAuMzgxIDcuNjI3IEwgMTAuMzgxIDYuNzI4IEwgMTAuMjAxIDYuNzI4IEwgMTAuMDIxIDYuNzI4IEwgOS44NDEgNi43MjggTCA5LjY2MSA2LjcyOCBMIDkuNDgxIDYuNzI4IEwgOS4zMDEgNi43MjggTCA5LjEyMSA2LjcyOCBMIDguOTQxIDYuNzI4IEwgOC42ODQgNy4zMTIgTCA4LjQyOCA3Ljg5NiBMIDguMTcxIDguNDggTCA3LjkxNSA5LjA2NCBMIDcuNjU5IDkuNjQ3IEwgNy40MDMgMTAuMjMxIEwgNy4xNDYgMTAuODE1IEwgNi44OSAxMS4zOTkgTCA2Ljg4NCAxMS4zOTkgTCA2Ljg3OCAxMS4zOTkgTCA2Ljg3MiAxMS4zOTkgTCA2Ljg2NiAxMS4zOTkgTCA2Ljg2IDExLjM5OSBMIDYuODU1IDExLjM5OSBMIDYuODQ5IDExLjM5OSBMIDYuODQzIDExLjM5OSBMIDYuNTg2IDEwLjgxNSBMIDYuMzMgMTAuMjMxIEwgNi4wNzMgOS42NDcgTCA1LjgxNyA5LjA2NCBMIDUuNTYxIDguNDggTCA1LjMwNSA3Ljg5NiBMIDUuMDQ4IDcuMzEyIEwgNC43OTIgNi43MjggTCA0LjYxMSA2LjcyOCBMIDQuNDMgNi43MjggTCA0LjI0OCA2LjcyOCBMIDQuMDY3IDYuNzI4IEwgMy44ODYgNi43MjggTCAzLjcwNSA2LjcyOCBMIDMuNTI0IDYuNzI4IEwgMy4zNDMgNi43MjggTCAzLjM0MyA3LjYyNyBMIDMuMzQzIDguNTI3IEwgMy4zNDMgOS40MjYgTCAzLjM0MyAxMC4zMjYgTCAzLjM0MyAxMS4yMjUgTCAzLjM0MyAxMi4xMjUgTCAzLjM0MyAxMy4wMjQgTCAzLjM0MyAxMy45MjQgTCAzLjUwMiAxMy45MjQgTCAzLjY2MSAxMy45MjQgTCAzLjgxOSAxMy45MjQgTCAzLjk3OCAxMy45MjQgTCA0LjEzNyAxMy45MjQgTCA0LjI5NiAxMy45MjQgTCA0LjQ1NSAxMy45MjQgWiIgc3R5bGU9IiIvPgo8L3N2Zz4="
    }, {
        label: locale.includes("zh-") ? "复制标题+URL[BBS]" : "Copy Title & Link as bbcode",
        text: "[url=%URL%]%TITLE%[/url]",
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTI0IDRDMTIuOTU0IDQgNCAxMi45NTQgNCAyNEM0IDM1LjA0NiAxMi45NTQgNDQgMjQgNDRDMzUuMDQ2IDQ0IDQ0IDM1LjA0NiA0NCAyNEM0NCAxMi45NTQgMzUuMDQ2IDQgMjQgNCB6IE0gMjQgN0MzMy4zNzQgNyA0MSAxNC42MjYgNDEgMjRDNDEgMzMuMzc0IDMzLjM3NCA0MSAyNCA0MUMxNC42MjYgNDEgNyAzMy4zNzQgNyAyNEM3IDE0LjYyNiAxNC42MjYgNyAyNCA3IHogTSAyMS41IDE0QzE5LjU4NTA0NSAxNCAxOCAxNS41ODUwNDUgMTggMTcuNUwxOCAyMy4yNTM5MDYgQSAxLjUwMDE1IDEuNTAwMTUgMCAwIDAgMTcuOTc4NTE2IDIzLjUyMzQzOCBBIDEuNTAwMTUgMS41MDAxNSAwIDAgMCAxOCAyMy43NDAyMzRMMTggMzAuNUMxOCAzMi40MTQ5NTUgMTkuNTg1MDQ1IDM0IDIxLjUgMzRMMjcgMzRDMzAuMjk1ODY1IDM0IDMzIDMxLjI5NTg2NSAzMyAyOEMzMyAyNS43MjYzODkgMzEuNjY3MzIgMjMuODAyMTM0IDI5Ljc4NzEwOSAyMi43ODUxNTZDMzAuNTAxMzgxIDIxLjg1Njk4NiAzMSAyMC43NTE5MTEgMzEgMTkuNUMzMSAxNi40ODAyMjYgMjguNTE5Nzc0IDE0IDI1LjUgMTRMMjEuNSAxNCB6IE0gMjEuNSAxN0wyNS41IDE3QzI2Ljg5ODIyNiAxNyAyOCAxOC4xMDE3NzQgMjggMTkuNUMyOCAyMC44OTgyMjYgMjYuODk4MjI2IDIyIDI1LjUgMjJMMjEgMjJMMjEgMTcuNUMyMSAxNy4yMDQ5NTUgMjEuMjA0OTU1IDE3IDIxLjUgMTcgeiBNIDIxIDI1TDI1LjUgMjVMMjcgMjVDMjguNjc0MTM1IDI1IDMwIDI2LjMyNTg2NSAzMCAyOEMzMCAyOS42NzQxMzUgMjguNjc0MTM1IDMxIDI3IDMxTDIxLjUgMzFDMjEuMjA0OTU1IDMxIDIxIDMwLjc5NTA0NSAyMSAzMC41TDIxIDI1IHoiIC8+DQo8L3N2Zz4="
    }]);
}
new function () {
    var groupMenu = new TabGroup({
        class: 'showFirstText',
        insertAfter: 'context_bookmarkTab',
        onshowing: function (item) {
            item.hidden = gBrowser.currentURI.spec.startsWith('file') || !gBrowser.getIcon(gBrowser.selectedTab);
        }
    });
    groupMenu([{
        label: locale.includes("zh-") ? "复制 Favicon 链接" : "Copy favicon Link",
        text: "%FAVICON%",
        accesskey: "f",
        image: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg==",
    }, {
        label: locale.includes("zh-") ? "复制 Favicon Base64" : "Copy favicon data url",
        text: "%FAVICON_BASE64%",
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOS44MDMwNyAzLjA0MzFDMTAuMDU1NCAzLjE1NTI1IDEwLjE2OTEgMy40NTA3MyAxMC4wNTY5IDMuNzAzMDdMNi4wNTY5MSAxMi43MDMxQzUuOTQ0NzUgMTIuOTU1NCA1LjY0OTI3IDEzLjA2OTEgNS4zOTY5MyAxMi45NTY5QzUuMTQ0NTkgMTIuODQ0OCA1LjAzMDk0IDEyLjU0OTMgNS4xNDMwOSAxMi4yOTY5TDkuMTQzMDkgMy4yOTY5M0M5LjI1NTI1IDMuMDQ0NTkgOS41NTA3MyAyLjkzMDk0IDkuODAzMDcgMy4wNDMxWk00LjMzMjE4IDUuMzc2M0M0LjUzODU3IDUuNTU5NzYgNC41NTcxNiA1Ljg3NTc5IDQuMzczNyA2LjA4MjE4TDIuNjY4OTggOEw0LjM3MzcgOS45MTc4MkM0LjU1NzE2IDEwLjEyNDIgNC41Mzg1NyAxMC40NDAyIDQuMzMyMTggMTAuNjIzN0M0LjEyNTc5IDEwLjgwNzIgMy44MDk3NSAxMC43ODg2IDMuNjI2MyAxMC41ODIyTDEuNjI2MyA4LjMzMjE4QzEuNDU3OSA4LjE0Mjc0IDEuNDU3OSA3Ljg1NzI2IDEuNjI2MyA3LjY2NzgyTDMuNjI2MyA1LjQxNzgyQzMuODA5NzUgNS4yMTE0MyA0LjEyNTc5IDUuMTkyODQgNC4zMzIxOCA1LjM3NjNaTTExLjY2NzggNS4zNzYzQzExLjg3NDIgNS4xOTI4NCAxMi4xOTAyIDUuMjExNDMgMTIuMzczNyA1LjQxNzgyTDE0LjM3MzcgNy42Njc4MkMxNC41NDIxIDcuODU3MjYgMTQuNTQyMSA4LjE0Mjc0IDE0LjM3MzcgOC4zMzIxOEwxMi4zNzM3IDEwLjU4MjJDMTIuMTkwMiAxMC43ODg2IDExLjg3NDIgMTAuODA3MiAxMS42Njc4IDEwLjYyMzdDMTEuNDYxNCAxMC40NDAyIDExLjQ0MjggMTAuMTI0MiAxMS42MjYzIDkuOTE3ODJMMTMuMzMxIDhMMTEuNjI2MyA2LjA4MjE4QzExLjQ0MjggNS44NzU3OSAxMS40NjE0IDUuNTU5NzYgMTEuNjY3OCA1LjM3NjNaIi8+Cjwvc3ZnPgo="
    }]);
}
page([{
    command: 'context_closeTabsToTheStart',
    insertAfter: 'context_closeTabOptions'
}, {
    command: 'context_closeTabsToTheEnd',
    insertAfter: 'context_closeTabOptions'
}, {
    command: 'context_closeOtherTabs',
    insertAfter: 'context_closeTabOptions'
}]);
css("#context_closeTabOptions { display: none }");
// 标签页右键菜单 End =============================================================
// 页面右键菜单 Start ================================================================
// 站内搜索
new function () {
    var groupMenuNormal = new PageGroup({
        insertBefore: 'inspect-separator',
        class: 'showFirstText',
        label: locale.includes("zh-") ? '站内搜索...' : 'Site search...',
        condition: 'normal',
        onshowing: function (item) {
            item.hidden = !gBrowser.currentURI.spec.startsWith('http');
        }
    }),
        groupMenuSelect = new PageGroup({
            id: 'addMenu-site-search-selected',
            class: 'showFirstText',
            label: locale.includes("zh-") ? '站内搜索...' : 'Site search...',
            condition: 'select',
            insertAfter: 'context-searchselect',
            onshowing: function (item) {
                item.hidden = !gBrowser.currentURI.spec.startsWith('http');
            }
        });
    var items = [{
        label: locale.includes("zh-") ? '站内搜索' : 'Site search',
        oncommand: function (e) {
            const locale = addMenu.locale;
            var sel = (gContextMenu || { textSelected: "" }).textSelected;
            if (!e.shiftKey && sel.length == 0) sel = prompt(locale.includes("zh-") ? '站内搜索:' : 'Site search:', '');
            if (sel) {
                Services.search.getDefault().then(
                    engine => {
                        let submission = engine.getSubmission('site:' + encodeURIComponent(gBrowser.currentURI.host) + ' ' + sel, null, 'search');
                        openLinkIn(submission.uri.spec, 'tab', {
                            private: false,
                            postData: submission.postData,
                            inBackground: false,
                            relatedToCurrent: true,
                            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                        });
                    }
                );
            }
        },
        image: "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDggNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTIwLjUzNTY5LDMuMzYwNDRjLTkuNDkyOTQsMCAtMTcuMjM3NzcsNy43MjE0NiAtMTcuMjM3NzcsMTcuMTg1NzNjMCw5LjQ2NDI3IDcuNzQ0ODMsMTcuMTg1NzMgMTcuMjM3NzcsMTcuMTg1NzNjMy45MTg4MSwwIDcuNDk3NjQsLTEuMzY3MDEgMTAuMzk4NzgsLTMuNTc4MTNsOS44MTA3Miw5Ljc4MTFhMi4yOTg2LDIuMjkxNjYgMCAxIDAgMy4yNTAwMywtMy4yNDAyMmwtOS44MTA3MiwtOS43ODExYzIuMjE3ODEsLTIuODkyMzggMy41ODg5NiwtNi40NjA0IDMuNTg4OTYsLTEwLjM2NzM4YzAsLTkuNDY0MjcgLTcuNzQ0ODMsLTE3LjE4NTczIC0xNy4yMzc3NywtMTcuMTg1NzN6bTAsNC41ODI4NmM3LjAwODY4LDAgMTIuNjQxMDMsNS42MTUzNiAxMi42NDEwMywxMi42MDI4N2MwLDYuOTg3NTEgLTUuNjMyMzUsMTIuNjAyODcgLTEyLjY0MTAzLDEyLjYwMjg3Yy03LjAwODY4LDAgLTEyLjY0MTAzLC01LjYxNTM2IC0xMi42NDEwMywtMTIuNjAyODdjMCwtNi45ODc1MSA1LjYzMjM1LC0xMi42MDI4NyAxMi42NDEwMywtMTIuNjAyODd6bS02Ljg5NTExLDEwLjMxMTQ0YTIuMjk4MzcsMi4yOTE0MyAwIDAgMCAwLDQuNTgyODZhMi4yOTgzNywyLjI5MTQzIDAgMCAwIDAsLTQuNTgyODZ6bTYuODk1MTEsMGEyLjI5ODM3LDIuMjkxNDMgMCAwIDAgMCw0LjU4Mjg2YTIuMjk4MzcsMi4yOTE0MyAwIDAgMCAwLC00LjU4Mjg2em02Ljg5NTExLDBhMi4yOTgzNywyLjI5MTQzIDAgMCAwIDAsNC41ODI4NmEyLjI5ODM3LDIuMjkxNDMgMCAwIDAgMCwtNC41ODI4NnoiLz48L3N2Zz4=",
    }, {
        label: locale.includes("zh-") ? '百度站内搜索' : 'Baidu site search',
        onshowing: function (item) {
            item.hidden = !gBrowser.currentURI.host.includes("www.baidu.com");
        },
        oncommand: function (e) {
            const locale = addMenu.locale;
            var sel = (gContextMenu || { textSelected: "" }).textSelected;
            if (!e.shiftKey && sel.length == 0) sel = prompt(locale.includes("zh-") ? '百度站内搜索:' : 'Baidu site search:', '');
            if (sel) {
                let url = 'https://www.baidu.com/s?wd=site:' + encodeURIComponent(gBrowser.currentURI.host) + ' ' + sel;
                addMenu.openCommand({ 'target': this }, url, 'tab');
            }
        },
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiI+DQogIDxwYXRoIGZpbGw9IiMxNTY1YzAiIGQ9Ik0zNi4wOTQgMzEuMzVjLTEuNjk1LTEuNS0zLjc1NC0zLjIyNS02LjY2LTcuMzUtMS44NjUtMi42NDctMy41MTItNC01LjkzNC00LTIuNjY0IDAtNC4xMTcgMS4yNS01LjU1MiAzLjI3OS0yLjEgMi45NzEtMi45MjUgMy45NzEtNS4wODggNS42NzUtLjc4Ni42MTktNC44NjEgMy4xNzItNC44NiA3LjY3MUM4LjAwMSA0MS44NzUgMTEuNzUzIDQ0IDE1LjE1NSA0NGM0LjQ2OSAwIDUuNDM5LTEgOC4zNDUtMSAzLjYzMyAwIDUuNTcgMSA4LjQ3NiAxQzM3Ljc4OSA0NCAzOSAzOS42MjUgMzkgMzYuODcyIDM5IDM0LjI1IDM3Ljc4OSAzMi44NSAzNi4wOTQgMzEuMzV6TTExLjM4OSAyNC44ODVjMy4xMjQtLjY5NCAzLjYxNi0zLjczOSAzLjYxMS01LjczMi0uMDAyLS42OTYtLjA2NC0xLjI2My0uMDk2LTEuNTU4LS4xOTgtMS42NzgtMi4wMjctNC41NS00LjU1MS00LjU5NC0uMTItLjAwMi0uMjQyLjAwMi0uMzY1LjAxMy0zLjQxMi4zMTQtMy45MTEgNS40MTItMy45MTEgNS40MTItLjA1Ni4yODctLjA4Mi42MTMtLjA3OC45NjMuMDMxIDIuMjYzIDEuMzU2IDUuNTI3IDQuMjc0IDUuNjFDMTAuNjIzIDI1LjAwOCAxMC45OTQgMjQuOTczIDExLjM4OSAyNC44ODVNMTkuNTAzIDE2QzIxLjk5IDE2IDI0IDEzLjMxNSAyNCA5Ljk5OCAyNCA2LjY4MSAyMS45OSA0IDE5LjUwMyA0IDE3LjAxNSA0IDE1IDYuNjgxIDE1IDkuOTk4IDE1IDEzLjMxNSAxNy4wMTUgMTYgMTkuNTAzIDE2TTI5LjUyMiAxNi45NjRjLjIyMS4wMzEuNDM2LjA0MS42NDUuMDMzIDIuNjk2LS4xMDMgNC40MTYtMy4yNzYgNC43ODEtNS43MjMuMDM3LS4yNDEuMDU0LS40ODYuMDUyLS43MzMtLjAxNS0yLjQ0MS0xLjgzMS01LjAxMi0zLjc5OS01LjQ5LTIuMTc3LS41MzItNC44OTMgMy4xNzMtNS4xMzggNS41OS0uMDM3LjM3LS4wNTkuNzM5LS4wNjMgMS4xMDNDMjUuOTc1IDE0LjI5NiAyNi44NDEgMTYuNTk5IDI5LjUyMiAxNi45NjRNNDEuOTg0IDIxLjE0MmMwLTEuMjgxLTEuMDA0LTUuMTQyLTQuNzQyLTUuMTQyQzMzLjQ5NiAxNiAzMyAxOS42NDQgMzMgMjIuMjE5YzAgMi40MS4xODcgNS43NTIgNC41NzggNS43ODEuMDg3LjAwMS4xNzYgMCAuMjY3LS4wMDIgNC4wMjctLjA5NCA0LjE4My00LjIwMyA0LjE1Mi02LjEzOEM0MS45OTMgMjEuNTYxIDQxLjk4NCAyMS4zMTUgNDEuOTg0IDIxLjE0MiIgLz4NCiAgPHBhdGggZmlsbD0iI2ZmZiIgZD0iTTI0IDMxdjcuNWMwIDAgMCAxLjg3NSAyLjYyNSAyLjVIMzNWMzFoLTIuNjI1djcuNWgtMi43NWMwIDAtLjg3NS0uMTI1LTEtLjc1VjMxSDI0ek0yMCAyN3Y0aC0zYy0yLjEyNS4zNzUtNCAyLjI1LTMuOTk5IDQuODc1QzEzLjAwMSAzNS45MTcgMTMgMzUuOTU4IDEzIDM2YzAgMi43NSAxLjg3NSA0LjYyNSA0IDVoNS42MjVWMjdIMjB6TTIwIDM4Ljc1aC0yLjM3NWMtLjc1IDAtMi0xLjEyNS0yLTIuNzVzMS4yNS0yLjc1IDItMi43NUgyMFYzOC43NXoiIC8+DQo8L3N2Zz4="
    }, {
        label: locale.includes("zh-") ? '谷歌站内搜索' : 'Google site search',
        oncommand: function (e) {
            var sel = (gContextMenu || { textSelected: "" }).textSelected;
            if (!e.shiftKey && sel.length == 0) sel = prompt(locale.includes("zh-") ? '谷歌站内搜索:' : 'Google site search:', '');
            if (sel) {
                let url = 'https://www.google.com/search?q=site:' + encodeURIComponent(gBrowser.currentURI.host) + ' ' + sel;
                addMenu.openCommand({ 'target': this }, url, 'tab');
            }
        },
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA0OCA0OCI+DQogIDxwYXRoIGZpbGw9IiNGRkMxMDciIGQ9Ik00My42MTEsMjAuMDgzSDQyVjIwSDI0djhoMTEuMzAzYy0xLjY0OSw0LjY1Ny02LjA4LDgtMTEuMzAzLDhjLTYuNjI3LDAtMTItNS4zNzMtMTItMTJjMC02LjYyNyw1LjM3My0xMiwxMi0xMmMzLjA1OSwwLDUuODQyLDEuMTU0LDcuOTYxLDMuMDM5bDUuNjU3LTUuNjU3QzM0LjA0Niw2LjA1MywyOS4yNjgsNCwyNCw0QzEyLjk1NSw0LDQsMTIuOTU1LDQsMjRjMCwxMS4wNDUsOC45NTUsMjAsMjAsMjBjMTEuMDQ1LDAsMjAtOC45NTUsMjAtMjBDNDQsMjIuNjU5LDQzLjg2MiwyMS4zNSw0My42MTEsMjAuMDgzeiIvPg0KICA8cGF0aCBmaWxsPSIjRkYzRDAwIiBkPSJNNi4zMDYsMTQuNjkxbDYuNTcxLDQuODE5QzE0LjY1NSwxNS4xMDgsMTguOTYxLDEyLDI0LDEyYzMuMDU5LDAsNS44NDIsMS4xNTQsNy45NjEsMy4wMzlsNS42NTctNS42NTdDMzQuMDQ2LDYuMDUzLDI5LjI2OCw0LDI0LDRDMTYuMzE4LDQsOS42NTYsOC4zMzcsNi4zMDYsMTQuNjkxeiIvPg0KICA8cGF0aCBmaWxsPSIjNENBRjUwIiBkPSJNMjQsNDRjNS4xNjYsMCw5Ljg2LTEuOTc3LDEzLjQwOS01LjE5MmwtNi4xOS01LjIzOEMyOS4yMTEsMzUuMDkxLDI2LjcxNSwzNiwyNCwzNmMtNS4yMDIsMC05LjYxOS0zLjMxNy0xMS4yODMtNy45NDZsLTYuNTIyLDUuMDI1QzkuNTA1LDM5LjU1NiwxNi4yMjcsNDQsMjQsNDR6Ii8+DQogIDxwYXRoIGZpbGw9IiMxOTc2RDIiIGQ9Ik00My42MTEsMjAuMDgzSDQyVjIwSDI0djhoMTEuMzAzYy0wLjc5MiwyLjIzNy0yLjIzMSw0LjE2Ni00LjA4Nyw1LjU3MWMwLjAwMS0wLjAwMSwwLjAwMi0wLjAwMSwwLjAwMy0wLjAwMmw2LjE5LDUuMjM4QzM2Ljk3MSwzOS4yMDUsNDQsMzQsNDQsMjRDNDQsMjIuNjU5LDQzLjg2MiwyMS4zNSw0My42MTEsMjAuMDgzeiIvPg0KPC9zdmc+"
    }];
    groupMenuNormal(items);
    groupMenuSelect(items);
    css("#contentAreaContextMenu[addMenu=\"select\"] > #inspect-separator, #frame-sep {display: none}");
}
new function () {
    var groupMenu = PageGroup({
        id: 'addMenu-inspect-page',
        class: 'showFirstText',
        insertBefore: 'inspect-separator',
        label: locale.includes("zh-") ? '检查页面' : 'Inspect node',
        condition: 'normal',
        onpopupshowing: syncHidden
    });
    groupMenu([{
        label: locale.includes("zh-") ? '检查页面' : 'Inspect node',
        oncommand: 'gContextMenu.inspectNode();',
        image: "chrome://devtools/skin/images/tool-inspector.svg",
        accesskey: 'i'
    }, {
        label: locale.includes("zh-") ? '查看页面代码' : 'View page source',
        oncommand: 'BrowserViewSource(gContextMenu.browser);',
        image: "chrome://devtools/skin/images/tool-styleeditor.svg",
        accesskey: 'v'
    }, {
        label: locale.includes("zh-") ? '查看页面信息' : 'View page info',
        oncommand: 'gContextMenu.viewInfo();',
        image: "chrome://global/skin/icons/info.svg",
        accesskey: 'o'
    }, {
        label: locale.includes("zh-") ? "检查无障碍环境属性" : "Checking accessibility properties",
        oncommand: "gContextMenu.inspectA11Y();",
        image: "chrome://devtools/skin/images/tool-accessibility.svg",
        accesskey: "c"
    }]);
    css('#context-viewsource, #context-inspect-a11y, #context-inspect, #context-viewpartialsource-selection, #contentAreaContextMenu[addMenu="input"] #inspect-separator { display: none }');
}


page([{
    id: "context-media-eme-learnmore-fork",
    insertBefore: "context-media-eme-separator",
    command: "context-media-eme-learnmore",
}]);

css('#context-media-eme-learnmore-fork{ display: none } #context-media-eme-learnmore-fork[hidden="true"] + #context-media-eme-separator { display: none }')

// 页面右键菜单 End ==============================================================
// 链接右键菜单 Start ============================================================
//打开链接的各种方法
new function () {
    var groupMenu = GroupMenu({
        id: 'addMenu-openLink-tab',
        class: 'showText',
        label: locale.includes("zh-") ? "打开链接..." : "Open Link...",
        condition: 'link',
        insertBefore: 'context-openlinkincurrent',
        onshowing: function () {
            // open in private tab need privateTab.uc.js https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js
            let privateBtn = document.getElementById('addMenu-openLink-tab-private')
            if (privateBtn) {
                if (window.privateTab !== "undefined") privateBtn.hidden = false;
                else if (typeof UC !== "undefined" && typeof UC.privateTab !== "undefined") privateBtn.hidden = false
                else privateBtn.hidden = true;
            }
        }
    });
    groupMenu([{
        label: locale.includes("zh-") ? "打开链接" : "Open Link",
        oncommand: 'gContextMenu.openLinkInCurrent();',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMjggMTI4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMjggMTI4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7c3Ryb2tlOmN1cnJlbnRDb2xvcjtzdHJva2Utd2lkdGg6MztzdHJva2UtbWl0ZXJsaW1pdDoxMDt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xOS4xLDcuNGMtNi41LDAtMTEuNyw1LjItMTEuNywxMS43djEyLjZ2NzcuM2MwLDYuNSw1LjIsMTEuNywxMS43LDExLjdoODkuOGM2LjUsMCwxMS43LTUuMiwxMS43LTExLjdWMTkuMQoJYzAtNi41LTUuMi0xMS43LTExLjctMTEuN0MxMDguOSw3LjQsMTkuMSw3LjQsMTkuMSw3LjR6IE0xOS4xLDEyLjhoODkuOGMzLjUsMCw2LjMsMi44LDYuMyw2LjN2MTMuNUgxMi44VjE5LjEKCUMxMi44LDE1LjYsMTUuNiwxMi44LDE5LjEsMTIuOHogTTIyLjcsMjBjLTEuNSwwLTIuNywxLjItMi43LDIuN2MwLDEuNSwxLjIsMi43LDIuNywyLjdoMy42YzEuNSwwLDIuNy0xLjIsMi43LTIuNwoJYzAtMS41LTEuMi0yLjctMi43LTIuN0gyMi43eiBNMzcsMjBjLTEuNSwwLTIuNywxLjItMi43LDIuN2MwLDEuNSwxLjIsMi43LDIuNywyLjdoMy42YzEuNSwwLDIuNy0xLjIsMi43LTIuNwoJYzAtMS41LTEuMi0yLjctMi43LTIuN0gzN3ogTTEyLjgsMzcuOWgxMDIuNHY3MWMwLDMuNS0yLjgsNi4zLTYuMyw2LjNIMTkuMWMtMy41LDAtNi4zLTIuOC02LjMtNi4zQzEyLjgsMTA4LjksMTIuOCwzNy45LDEyLjgsMzcuOQoJeiBNNDIuNCw2NEMzNSw2NCwyOSw3MCwyOSw3Ny41QzI5LDg0LjksMzUsOTEsNDIuNCw5MWgxMC4zYzEuNSwwLDIuNy0xLjIsMi43LTIuN3MtMS4yLTIuNy0yLjctMi43SDQyLjRjLTQuNSwwLTguMS0zLjYtOC4xLTguMQoJYzAtNC41LDMuNi04LjEsOC4xLTguMWgxMC4zYzEuNSwwLDIuNy0xLjIsMi43LTIuN2MwLTEuNS0xLjItMi43LTIuNy0yLjdDNTIuOCw2NCw0Mi40LDY0LDQyLjQsNjR6IE03NS4yLDY0CgljLTEuNSwwLTIuNywxLjItMi43LDIuN2MwLDEuNSwxLjIsMi43LDIuNywyLjdoMTAuM2M0LjUsMCw4LjEsMy42LDguMSw4LjFjMCw0LjUtMy42LDguMS04LjEsOC4xSDc1LjJjLTEuNSwwLTIuNywxLjItMi43LDIuNwoJYzAsMS41LDEuMiwyLjcsMi43LDIuN2gxMC4zQzkzLDkxLDk5LDg0LjksOTksNzcuNUM5OSw3MCw5Myw2NCw4NS42LDY0Qzg1LjYsNjQsNzUuMiw2NCw3NS4yLDY0eiBNNTUsNzQuOGMtMS41LDAtMi43LDEuMi0yLjcsMi43CgljMCwxLjUsMS4yLDIuNywyLjcsMi43aDE4YzEuNSwwLDIuNy0xLjIsMi43LTIuN2MwLTEuNS0xLjItMi43LTIuNy0yLjdINTV6Ii8+Cjwvc3ZnPgo=",
        accesskey: "O"
    }, {
        label: locale.includes("zh-") ? "新标签打开" : "Open in New Tab",
        accesskey: "N",
        oncommand: function (event) {
            const containerTab = document.getElementById('context-openlinkincontainertab');
            if (containerTab) {
                if (containerTab.hidden === true)
                    gContextMenu.openLinkInTab(event);
                else
                    document.getElementById('context-openlinkincontainertab').doCommand();
            }
        },
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNMyAxYy0xLjA5OSAwLTIgLjktMiAydjEwYzAgMS4wOTkuOSAyIDIgMmg0LjI5NWE1LjcwMiA1LjcwMiAwIDAgMS0uNjctMUgzYy0uNTYzIDAtMS0uNDM3LTEtMVYzYzAtLjU2My40MzctMSAxLTFoM3YxLjVDNiA0LjMyMyA2LjY3OCA1IDcuNSA1SDE0djEuNTk4Yy4zNTguMTgyLjY5My40MDUgMSAuNjYyVjNjMC0xLjA5OS0uOS0yLTItMkgzem00IDFoNmMuNTYzIDAgMSAuNDM3IDEgMXYxSDcuNWEuNDkzLjQ5MyAwIDAgMS0uNS0uNVYyeiIvPgogIDxwYXRoIGQ9Ik0xMS41IDdBNC41IDQuNSAwIDAgMCA3IDExLjVhNC41IDQuNSAwIDAgMCA0LjUgNC41IDQuNSA0LjUgMCAwIDAgNC41LTQuNUE0LjUgNC41IDAgMCAwIDExLjUgN3ptMCAyYS41LjUgMCAwIDEgLjUuNVYxMWgxLjVhLjUuNSAwIDAgMSAuNS41LjUuNSAwIDAgMS0uNS41SDEydjEuNWEuNS41IDAgMCAxLS41LjUuNS41IDAgMCAxLS41LS41VjEySDkuNWEuNS41IDAgMCAxLS41LS41LjUuNSAwIDAgMSAuNS0uNUgxMVY5LjVhLjUuNSAwIDAgMSAuNS0uNXoiLz4KPC9zdmc+Cg==",
    }]);
    css("#context-openlinkintab,#context-openlinkincontainertab,#context-openlinkincurrent { display:none }");
};
new function () {
    var groupMenu = GroupMenu({
        id: 'addMenu-openLink-tab-private',
        class: 'showText',
        label: locale.includes("zh-") ? "打开链接..." : "Open Link...",
        condition: 'link',
        insertBefore: 'context-openlinkincurrent',
        onshowing: function () {
            // open in private tab need privateTab.uc.js https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js
            let privateBtn = document.getElementById('addMenu-openLink-tab-private')
            if (privateBtn) {
                if (window.privateTab !== "undefined") privateBtn.hidden = false;
                else if (typeof UC !== "undefined" && typeof UC.privateTab !== "undefined") privateBtn.hidden = false
                else privateBtn.hidden = true;
            }
        }
    });
    groupMenu([{
        id: 'addMenu-openLink-tab-private',
        label: locale.includes("zh-") ? "无痕标签打开" : "Open in Private Tab",
        accesskey: "Q",
        oncommand: "var dom = document.getElementById('openLinkInPrivateTab'); if (dom) dom.doCommand();",
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNTAgNTAiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+PHBhdGggZD0iTTIxLjk4MDQ2OSAyQzE4LjEzNjcxOSAyLjA4NTkzOCAxNS4zNzUgMy4xOTkyMTkgMTMuNzY1NjI1IDUuMzEyNUMxMS45NDkyMTkgNy43MDMxMjUgMTEuNjMyODEzIDExLjI2NTYyNSAxMi43OTY4NzUgMTYuMTk1MzEzQzEyLjM4NjcxOSAxNi43MjY1NjMgMTIuMDExNzE5IDE3LjU3NDIxOSAxMi4xMDkzNzUgMTguNzM0Mzc1QzEyLjQwMjM0NCAyMC44OTg0MzggMTMuMjI2NTYzIDIxLjc4OTA2MyAxMy44OTg0MzggMjIuMTUyMzQ0QzE0LjIzNDM3NSAyMy45NTMxMjUgMTUuMjE4NzUgMjUuODYzMjgxIDE2LjEwMTU2MyAyNi43NjU2MjVDMTYuMTA1NDY5IDI2Ljk4ODI4MSAxNi4xMDkzNzUgMjcuMjAzMTI1IDE2LjExMzI4MSAyNy40MTc5NjlDMTYuMTMyODEzIDI4LjM3NSAxNi4xNDQ1MzEgMjkuMjAzMTI1IDE2LjAxOTUzMSAzMC4yNjU2MjVDMTUuNDcyNjU2IDMxLjY3MTg3NSAxMy40NDE0MDYgMzIuNDc2NTYzIDExLjA5Mzc1IDMzLjQwNjI1QzcuMTkxNDA2IDM0Ljk1MzEyNSAyLjMzNTkzOCAzNi44Nzg5MDYgMiA0Mi45NDkyMTlMMS45NDUzMTMgNDRMMjUuMzcxMDk0IDQ0QzI1LjE3OTY4OCA0My42MDU0NjkgMjUuMDE1NjI1IDQzLjE5NTMxMyAyNC44NTkzNzUgNDIuNzgxMjVDMjQuNTY2NDA2IDM5LjI1IDIyLjUgMzUuODAwNzgxIDIyLjUgMzUuODAwNzgxTDI0LjY2Nzk2OSAzMy45MDIzNDRDMjQuMzkwNjI1IDMzLjM0NzY1NiAyNC4wNTg1OTQgMzIuOTI1NzgxIDIzLjczMDQ2OSAzMi41ODIwMzFMMjUuNTg5ODQ0IDMxLjU1MDc4MUMyNS43MzgyODEgMzEuMjY1NjI1IDI1LjkwNjI1IDMwLjk5MjE4OCAyNi4wNzQyMTkgMzAuNzE4NzVDMjYuMjgxMjUgMzAuMzc4OTA2IDI2LjUwMzkwNiAzMC4wNTA3ODEgMjYuNzM0Mzc1IDI5LjczNDM3NUMyNi43ODkwNjMgMjkuNjY0MDYzIDI2LjgzNTkzOCAyOS41ODk4NDQgMjYuODkwNjI1IDI5LjUxOTUzMUMyNy4xNzk2ODggMjkuMTQwNjI1IDI3LjQ4ODI4MSAyOC43NzM0MzggMjcuODEyNSAyOC40MjU3ODFDMjcuODA0Njg4IDI3Ljg3ODkwNiAyNy44MDA3ODEgMjcuMzQzNzUgMjcuODAwNzgxIDI2Ljc1MzkwNkMyOC42Njc5NjkgMjUuODM5ODQ0IDI5LjU4OTg0NCAyMy45MjU3ODEgMjkuOTcyNjU2IDIyLjE5MTQwNkMzMC42OTE0MDYgMjEuODUxNTYzIDMxLjU4OTg0NCAyMC45Njg3NSAzMS43OTY4NzUgMTguNjgzNTk0QzMxLjg5MDYyNSAxNy41NTg1OTQgMzEuNTgyMDMxIDE2LjczMDQ2OSAzMS4xNTYyNSAxNi4xOTkyMTlDMzEuODE2NDA2IDE0LjEyODkwNiAzMi45Mzc1IDkuNTM1MTU2IDMxLjA5Mzc1IDYuNDg4MjgxQzMwLjI1MzkwNiA1LjEwMTU2MyAyOC45NDE0MDYgNC4yMzA0NjkgMjcuMTgzNTk0IDMuODgyODEzQzI2LjIxODc1IDIuNjY0MDYzIDI0LjM5ODQzOCAyIDIxLjk4MDQ2OSAyIFogTSAyMiA0QzIzLjg5MDYyNSA0IDI1LjI1MzkwNiA0LjQ3NjU2MyAyNS43MzQzNzUgNS4zMDQ2ODhMMjUuOTgwNDY5IDUuNzIyNjU2TDI2LjQ1NzAzMSA1Ljc4OTA2M0MyNy44MzU5MzggNS45ODQzNzUgMjguNzkyOTY5IDYuNTUwNzgxIDI5LjM3ODkwNiA3LjUyMzQzOEMzMC42NjQwNjMgOS42NDA2MjUgMzAuMDA3ODEzIDEzLjUgMjkuMDU4NTk0IDE2LjE2MDE1NkwyOC43NDIxODggMTYuOTg0Mzc1TDI5LjUzNTE1NiAxNy4zODI4MTNDMjkuNjI1IDE3LjQ0NTMxMyAyOS44NjMyODEgMTcuNzg5MDYzIDI5LjgwNDY4OCAxOC41MDc4MTNDMjkuNjY3OTY5IDE5Ljk4ODI4MSAyOS4xOTkyMTkgMjAuMzgyODEzIDI5LjA5NzY1NiAyMC40MDIzNDRMMjguMjM0Mzc1IDIwLjQwMjM0NEwyOC4xMDkzNzUgMjEuMjYxNzE5QzI3LjgzNTkzOCAyMy4xODM1OTQgMjYuNjgzNTk0IDI1LjE1NjI1IDI2LjMwNDY4OCAyNS40MzM1OTRMMjUuODAwNzgxIDI1LjcxODc1TDI1LjgwMDc4MSAyNi4zMDA3ODFDMjUuODAwNzgxIDI3LjMyMDMxMyAyNS44MTI1IDI4LjE5NTMxMyAyNS44NDM3NSAyOS4xMjEwOTRMMjIgMzEuMjUzOTA2TDE4LjEwNTQ2OSAyOS4wOTM3NUMxOC4xMjUgMjguNTAzOTA2IDE4LjEyMTA5NCAyNy45NDUzMTMgMTguMTA5Mzc1IDI3LjM3ODkwNkMxOC4xMDU0NjkgMjcuMDM1MTU2IDE4LjA5NzY1NiAyNi42Nzk2ODggMTguMDk3NjU2IDI2LjI5Njg3NUwxOC4wMzUxNTYgMjUuNzM0Mzc1TDE3LjYwOTM3NSAyNS40Mzc1QzE3LjIxNDg0NCAyNS4xNjc5NjkgMTUuOTcyNjU2IDIzLjE3MTg3NSAxNS43OTY4NzUgMjEuMzA0Njg4TDE1Ljc4MTI1IDIwLjQwNjI1TDE0Ljg3NSAyMC40MDYyNUMxNC43MzA0NjkgMjAuMzUxNTYzIDE0LjI4NTE1NiAxOS44Nzg5MDYgMTQuMDkzNzUgMTguNTE1NjI1QzE0LjAyNzM0NCAxNy42Nzk2ODggMTQuNDUzMTI1IDE3LjMzMjAzMSAxNC40NTMxMjUgMTcuMzMyMDMxTDE1LjA0Njg3NSAxNi45Mzc1TDE0Ljg3MTA5NCAxNi4yNTM5MDZDMTMuNzA3MDMxIDExLjY2Nzk2OSAxMy44NjcxODggOC40ODQzNzUgMTUuMzU5Mzc1IDYuNTIzNDM4QzE2LjU3ODEyNSA0LjkyMTg3NSAxOC44MjAzMTMgNC4wNzAzMTMgMjIgNCBaIE0gMzggMjZDMzEuMzkwNjI1IDI2IDI2IDMxLjM5NDUzMSAyNiAzOEMyNiA0NC42MDU0NjkgMzEuMzkwNjI1IDUwIDM4IDUwQzQ0LjYwOTM3NSA1MCA1MCA0NC42MDU0NjkgNTAgMzhDNTAgMzEuMzk0NTMxIDQ0LjYwOTM3NSAyNiAzOCAyNiBaIE0gMzggMjhDNDMuNTIzNDM4IDI4IDQ4IDMyLjQ3NjU2MyA0OCAzOEM0OCA0My41MjM0MzggNDMuNTIzNDM4IDQ4IDM4IDQ4QzMyLjQ3NjU2MyA0OCAyOCA0My41MjM0MzggMjggMzhDMjggMzIuNDc2NTYzIDMyLjQ3NjU2MyAyOCAzOCAyOCBaIE0gMTcuNzczNDM4IDMxLjE5NTMxM0wyMC4yNjk1MzEgMzIuNTgyMDMxTDE3Ljk4ODI4MSAzNS40MTc5NjlMMTYuMTIxMDk0IDMzLjE1MjM0NEMxNi44NDM3NSAzMi42MTcxODggMTcuNDE0MDYzIDMxLjk4NDM3NSAxNy43NzM0MzggMzEuMTk1MzEzIFogTSAzNyAzMkwzNyAzN0wzMiAzN0wzMiAzOUwzNyAzOUwzNyA0NEwzOSA0NEwzOSAzOUw0NCAzOUw0NCAzN0wzOSAzN0wzOSAzMiBaIE0gMTQuMzc1IDM0LjE3OTY4OEwxNy4yMzA0NjkgMzcuNjM2NzE5QzE3LjQxNzk2OSAzNy44NjcxODggMTcuNzA3MDMxIDM4LjAwMzkwNiAxOC4wMDc4MTMgMzhDMTguMzA4NTk0IDM4IDE4LjU4OTg0NCAzNy44NTkzNzUgMTguNzgxMjUgMzcuNjI1TDIwLjc0MjE4OCAzNS4xODc1TDIxLjUgMzUuODAwNzgxQzIxLjUgMzUuODAwNzgxIDE5Ljc0NjA5NCAzOC44MTI1IDE5LjI0MjE4OCA0Mkw0LjEyMTA5NCA0MkM0Ljg1NTQ2OSAzOC4wMjczNDQgOC4zOTg0MzggMzYuNjI1IDExLjgyODEyNSAzNS4yNjU2MjVDMTIuNzE0ODQ0IDM0LjkxNDA2MyAxMy41NzgxMjUgMzQuNTY2NDA2IDE0LjM3NSAzNC4xNzk2ODhaIi8+PC9zdmc+"
    }, {
        label: locale.includes("zh-") ? '隐私窗口' : 'Private window',
        oncommand: 'gContextMenu.openLinkInPrivateWindow();',
        accesskey: 'P',
        image: "chrome://browser/skin/privateBrowsing.svg"
    }]);
    css("#openLinkInPrivateTab,#context-openlinkprivate { display:none }");
};
new function () {
    var groupMenu = GroupMenu({
        id: 'addMenu-openLink-window',
        class: 'showText',
        label: locale.includes("zh-") ? "打开链接..." : "Open Link...",
        condition: 'link',
        insertBefore: 'context-openlinkinusercontext-menu',
        onpopupshowing: syncHidden
    });
    groupMenu([{
        label: locale.includes("zh-") ? '新窗口打开' : 'New window',
        oncommand: 'gContextMenu.openLink();',
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNMy41IDFBMi41IDIuNSAwIDAgMCAxIDMuNXY5QTIuNSAyLjUgMCAwIDAgMy41IDE1aDlhMi41IDIuNSAwIDAgMCAyLjUtMi41di05QTIuNSAyLjUgMCAwIDAgMTIuNSAxaC05em0wIDFoOUExLjUgMS41IDAgMCAxIDE0IDMuNVY0SDJ2LS41QTEuNSAxLjUgMCAwIDEgMy41IDJ6TTIgNWgxMnY3LjVhMS41IDEuNSAwIDAgMS0xLjUgMS41aC05QTEuNSAxLjUgMCAwIDEgMiAxMi41VjV6Ii8+Cjwvc3ZnPgo=",
        accesskey: "W"
    }, {
        label: locale.includes("zh-") ? "其他浏览器" : "Other browser",
        id: 'context-open-with-browser',
        tooltiptext: locale.includes("zh-") ? "左键打开，右键设置浏览器路径" : "Left click: open in other browser\nRight click: set browser path",
        onclick: function (event) {
            if (event.button == 0) {
                document.getElementById('identity-contextmenu-openwithbrowser').click();
            } else if (event.button == 2) {
                document.getElementById('identity-contextmenu-openwithbrowser-changebrowser').click();
            }
        },
        image: "chrome://devtools/skin/images/browsers/edge.svg",
        accesskey: 'e'
    }])
    css("#context-openlink { display: none }");
};

css(`#contentAreaContextMenu:not([addMenu~="link"]) #context-sep-open { display: none }`);

//复制链接地址
new function () {
    var groupMenu = GroupMenu({
        id: 'addMenu-copy-link',
        class: 'showFirstText',
        insertAfter: 'context-copylink',
        label: locale.includes("zh-") ? '复制链接...' : 'Copy Link...',
        condition: 'link',
        onpopupshowing: syncHidden
    });
    groupMenu([{
        label: locale.includes("zh-") ? '复制链接' : 'Copy Link',
        oncommand: "Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper).copyString(decodeURIComponent(gContextMenu.linkURL));;",
        image: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg==",
        accesskey: "L"
    }, {
        label: locale.includes("zh-") ? '链接另存为' : 'Save link as',
        oncommand: "gContextMenu.saveLink();",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMS40MDQgMy45NDggQyAxLjQwNCAzLjIxMiAxLjcwMiAyLjU0NSAyLjE4NSAyLjA2MyBDIDIuNjY3IDEuNTggMy4zMzQgMS4yODIgNC4wNyAxLjI4MiBMIDguODk5IDEuMjgyIEwgMTMuNzI4IDEuMjgyIEMgMTQuMTQ2IDEuMjgyIDE0LjU1NSAxLjM2NSAxNC45MzQgMS41MjIgQyAxNS4zMTMgMS42NzggMTUuNjYxIDEuOTA5IDE1Ljk1NyAyLjIwNSBMIDE2Ljk0MyAzLjE5MSBMIDE3LjkyOSA0LjE3NyBDIDE4LjIyNSA0LjQ3MyAxOC40NTYgNC44MjEgMTguNjEzIDUuMiBDIDE4Ljc2OSA1LjU3OSAxOC44NTIgNS45ODggMTguODUyIDYuNDA2IEwgMTguODUyIDExLjIzNSBMIDE4Ljg1MiAxNi4wNjQgQyAxOC44NTIgMTYuODAxIDE4LjU1NCAxNy40NjcgMTguMDcxIDE3Ljk0OSBDIDE3LjU4OSAxOC40MzIgMTYuOTIyIDE4LjczIDE2LjE4NiAxOC43MyBMIDEwLjEyOCAxOC43MyBMIDQuMDcgMTguNzMgQyAzLjMzNCAxOC43MyAyLjY2NyAxOC40MzIgMi4xODUgMTcuOTQ5IEMgMS43MDIgMTcuNDY3IDEuNDA0IDE2LjggMS40MDQgMTYuMDY0IEwgMS40MDQgMTAuMDA2IFogTSA0LjA3IDIuNzM2IEMgMy43MzYgMi43MzYgMy40MzMgMi44NzIgMy4yMTMgMy4wOTEgQyAyLjk5NCAzLjMxMSAyLjg1OCAzLjYxNCAyLjg1OCAzLjk0OCBMIDIuODU4IDEwLjAwNiBMIDIuODU4IDE2LjA2NCBDIDIuODU4IDE2LjM5OSAyLjk5NCAxNi43MDIgMy4yMTMgMTYuOTIxIEMgMy40MzMgMTcuMTQgMy43MzYgMTcuMjc2IDQuMDcgMTcuMjc2IEwgNC4xOTEgMTcuMjc2IEwgNC4zMTIgMTcuMjc2IEwgNC4zMTIgMTQuNzMyIEwgNC4zMTIgMTIuMTg3IEMgNC4zMTIgMTEuNTg1IDQuNTU2IDExLjAzOSA0Ljk1MSAxMC42NDUgQyA1LjM0NSAxMC4yNSA1Ljg5MSAxMC4wMDYgNi40OTMgMTAuMDA2IEwgMTAuMTI4IDEwLjAwNiBMIDEzLjc2MyAxMC4wMDYgQyAxNC4zNjYgMTAuMDA2IDE0LjkxMSAxMC4yNSAxNS4zMDUgMTAuNjQ1IEMgMTUuNyAxMS4wMzkgMTUuOTQ0IDExLjU4NSAxNS45NDQgMTIuMTg3IEwgMTUuOTQ0IDE0LjczMiBMIDE1Ljk0NCAxNy4yNzYgTCAxNi4wNjUgMTcuMjc2IEwgMTYuMTg2IDE3LjI3NiBDIDE2LjUyMSAxNy4yNzYgMTYuODI0IDE3LjE0IDE3LjA0MyAxNi45MjEgQyAxNy4yNjIgMTYuNzAyIDE3LjM5OCAxNi4zOTkgMTcuMzk4IDE2LjA2NCBMIDE3LjM5OCAxMS4yMzUgTCAxNy4zOTggNi40MDYgQyAxNy4zOTggNi4xODEgMTcuMzU0IDUuOTYgMTcuMjY5IDUuNzU2IEMgMTcuMTg1IDUuNTUyIDE3LjA2MSA1LjM2NSAxNi45MDEgNS4yMDYgTCAxNS45MTUgNC4yMiBMIDE0LjkyOCAzLjIzMyBDIDE0LjgwMyAzLjEwOCAxNC42NiAzLjAwMyAxNC41MDQgMi45MjMgQyAxNC4zNDggMi44NDMgMTQuMTggMi43ODcgMTQuMDA1IDIuNzU4IEwgMTQuMDA1IDQuMDggTCAxNC4wMDUgNS40MDIgQyAxNC4wMDUgNi4wMDQgMTMuNzYxIDYuNTQ5IDEzLjM2NiA2Ljk0NCBDIDEyLjk3MiA3LjMzOSAxMi40MjcgNy41ODMgMTEuODI0IDcuNTgzIEwgOS42NDMgNy41ODMgTCA3LjQ2MiA3LjU4MyBDIDYuODYgNy41ODMgNi4zMTQgNy4zMzkgNS45MiA2Ljk0NCBDIDUuNTI1IDYuNTQ5IDUuMjgxIDYuMDA0IDUuMjgxIDUuNDAyIEwgNS4yODEgNC4wNjkgTCA1LjI4MSAyLjczNiBMIDQuNjc2IDIuNzM2IFogTSAxNC40OSAxNy4yNzYgTCAxNC40OSAxNC43MzIgTCAxNC40OSAxMi4xODcgQyAxNC40OSAxMS45ODcgMTQuNDA5IDExLjgwNSAxNC4yNzcgMTEuNjczIEMgMTQuMTQ1IDExLjU0MiAxMy45NjQgMTEuNDYgMTMuNzYzIDExLjQ2IEwgMTAuMTI4IDExLjQ2IEwgNi40OTMgMTEuNDYgQyA2LjI5MyAxMS40NiA2LjExMSAxMS41NDIgNS45NzkgMTEuNjczIEMgNS44NDggMTEuODA1IDUuNzY2IDExLjk4NyA1Ljc2NiAxMi4xODcgTCA1Ljc2NiAxNC43MzIgTCA1Ljc2NiAxNy4yNzYgTCAxMC4xMjggMTcuMjc2IFogTSA2LjczNSAyLjczNiBMIDYuNzM1IDQuMDY5IEwgNi43MzUgNS40MDIgQyA2LjczNSA1LjYwMyA2LjgxNyA1Ljc4NCA2Ljk0OCA1LjkxNiBDIDcuMDggNi4wNDcgNy4yNjIgNi4xMjkgNy40NjIgNi4xMjkgTCA5LjY0MyA2LjEyOSBMIDExLjgyNCA2LjEyOSBDIDEyLjAyNSA2LjEyOSAxMi4yMDcgNi4wNDcgMTIuMzM4IDUuOTE2IEMgMTIuNDcgNS43ODQgMTIuNTUxIDUuNjAzIDEyLjU1MSA1LjQwMiBMIDEyLjU1MSA0LjA2OSBMIDEyLjU1MSAyLjczNiBMIDkuNjQzIDIuNzM2IFoiIHN0eWxlPSIiLz4KPC9zdmc+",
        accesskey: "K"
    }, {
        label: locale.includes("zh-") ? '收藏链接' : 'Bookmark link',
        oncommand: "gContextMenu.bookmarkLink();",
        accesskey: 'B',
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOC44MDgwMiAyLjEwMTc5QzguNDc3ODkgMS40MzI4NyA3LjUyNDAzIDEuNDMyODcgNy4xOTM5IDIuMTAxNzlMNS42NzI4MSA1LjE4Mzg0TDIuMjcxNTYgNS42NzgwN0MxLjUzMzM2IDUuNzg1MzQgMS4yMzg2MSA2LjY5MjUxIDEuNzcyNzcgNy4yMTMyTDQuMjMzOTQgOS42MTIyNEwzLjY1Mjk0IDEyLjk5OTdDMy41MjY4NCAxMy43MzUgNC4yOTg1MyAxNC4yOTU2IDQuOTU4NzkgMTMuOTQ4NUw4LjAwMDk2IDEyLjM0OTFMOC40ODI5IDEyLjYwMjVDOC4xODU5NyAxMi4zMjg0IDggMTEuOTM1OSA4IDExLjVDOCAxMS40NDQ2IDguMDAzIDExLjM5IDguMDA4ODQgMTEuMzM2MkM3Ljg2MjM2IDExLjMzNDkgNy43MTU2NCAxMS4zNjk0IDcuNTgyMTUgMTEuNDM5NUw0LjY3MjggMTIuOTY5MUw1LjIyODQzIDkuNzI5NDdDNS4yNzg1MSA5LjQzNzUxIDUuMTgxNzEgOS4xMzk2MSA0Ljk2OTYgOC45MzI4NUwyLjYxNTg4IDYuNjM4NTRMNS44Njg2NCA2LjE2NTg5QzYuMTYxNzggNi4xMjMyOSA2LjQxNTE5IDUuOTM5MTggNi41NDYyOCA1LjY3MzU1TDguMDAwOTYgMi43MjYwNUw4LjczMzUxIDQuMjEwMzZDOC45NTc4MiA0LjA3Njc1IDkuMjE5OTUgNCA5LjUgNEg5Ljc0NDg1TDguODA4MDIgMi4xMDE3OVpNOS41IDVDOS4yMjM4NiA1IDkgNS4yMjM4NiA5IDUuNUM5IDUuNzc2MTQgOS4yMjM4NiA2IDkuNSA2SDE0LjVDMTQuNzc2MSA2IDE1IDUuNzc2MTQgMTUgNS41QzE1IDUuMjIzODYgMTQuNzc2MSA1IDE0LjUgNUg5LjVaTTkuNSA4QzkuMjIzODYgOCA5IDguMjIzODYgOSA4LjVDOSA4Ljc3NjE0IDkuMjIzODYgOSA5LjUgOUgxNC41QzE0Ljc3NjEgOSAxNSA4Ljc3NjE0IDE1IDguNUMxNSA4LjIyMzg2IDE0Ljc3NjEgOCAxNC41IDhIOS41Wk05LjUgMTFDOS4yMjM4NiAxMSA5IDExLjIyMzkgOSAxMS41QzkgMTEuNzc2MSA5LjIyMzg2IDEyIDkuNSAxMkgxNC41QzE0Ljc3NjEgMTIgMTUgMTEuNzc2MSAxNSAxMS41QzE1IDExLjIyMzkgMTQuNzc2MSAxMSAxNC41IDExSDkuNVoiLz4KPC9zdmc+Cg==",
        accesskey: 'B'
    }, {
        label: locale.includes("zh-") ? "复制链接HTML" : "Copy link as html",
        text: '<a href="%l" target="_blank">%LINK_TEXT%</a>',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuMTM2IDUuMTY3IEMgMTcuMjE5IDUuMTY3IDE3LjMgNS4xNzYgMTcuMzc4IDUuMTkyIEMgMTcuNDU2IDUuMjA4IDE3LjUzMSA1LjIzMSAxNy42MDMgNS4yNjEgQyAxNy42NzUgNS4yOTEgMTcuNzQzIDUuMzI4IDE3LjgwNyA1LjM3MSBDIDE3Ljg3IDUuNDE0IDE3LjkzIDUuNDYzIDE3Ljk4NCA1LjUxOCBDIDE4LjAzOSA1LjU3MiAxOC4wODggNS42MzIgMTguMTMgNS42OTYgQyAxOC4xNzMgNS43NTkgMTguMjEgNS44MjcgMTguMjQxIDUuODk5IEMgMTguMjcxIDUuOTcxIDE4LjI5NSA2LjA0NiAxOC4zMTEgNi4xMjQgQyAxOC4zMjcgNi4yMDIgMTguMzM1IDYuMjgzIDE4LjMzNSA2LjM2NiBMIDE4LjMzNSA3LjU2NiBMIDE4LjMzNSA4Ljc2NiBMIDE4LjMzNSA5Ljk2NSBMIDE4LjMzNSAxMS4xNjUgTCAxOC4zMzUgMTIuMzY1IEwgMTguMzM1IDEzLjU2NCBMIDE4LjMzNSAxNC43NjQgTCAxOC4zMzUgMTUuOTYzIEMgMTguMzM1IDE2LjA0NiAxOC4zMjcgMTYuMTI3IDE4LjMxMSAxNi4yMDUgQyAxOC4yOTUgMTYuMjg0IDE4LjI3MSAxNi4zNTkgMTguMjQxIDE2LjQzMSBDIDE4LjIxIDE2LjUwMyAxOC4xNzMgMTYuNTcxIDE4LjEzIDE2LjYzNCBDIDE4LjA4OCAxNi42OTggMTguMDM5IDE2Ljc1OCAxNy45ODQgMTYuODEyIEMgMTcuOTMgMTYuODY3IDE3Ljg3MSAxNi45MTYgMTcuODA3IDE2Ljk1OSBDIDE3Ljc0MyAxNy4wMDIgMTcuNjc1IDE3LjAzOSAxNy42MDMgMTcuMDY5IEMgMTcuNTMxIDE3LjEgMTcuNDU2IDE3LjEyMyAxNy4zNzggMTcuMTM5IEMgMTcuMyAxNy4xNTUgMTcuMjE5IDE3LjE2MyAxNy4xMzYgMTcuMTYzIEwgMTUuMzM3IDE3LjE2MyBMIDEzLjUzOCAxNy4xNjMgTCAxMS43MzkgMTcuMTYzIEwgOS45MzkgMTcuMTYzIEwgOC4xNCAxNy4xNjMgTCA2LjM0IDE3LjE2MyBMIDQuNTQxIDE3LjE2MyBMIDIuNzQxIDE3LjE2MyBDIDIuNjU4IDE3LjE2MyAyLjU3NyAxNy4xNTUgMi40OTkgMTcuMTM5IEMgMi40MjEgMTcuMTIzIDIuMzQ1IDE3LjEgMi4yNzMgMTcuMDY5IEMgMi4yMDIgMTcuMDM5IDIuMTMzIDE3LjAwMiAyLjA2OSAxNi45NTkgQyAyLjAwNiAxNi45MTYgMS45NDYgMTYuODY3IDEuODkyIDE2LjgxMiBDIDEuODM4IDE2Ljc1OCAxLjc4OSAxNi42OTkgMS43NDYgMTYuNjM1IEMgMS43MDMgMTYuNTcxIDEuNjY1IDE2LjUwMyAxLjYzNSAxNi40MzEgQyAxLjYwNSAxNi4zNTkgMS41ODEgMTYuMjg0IDEuNTY1IDE2LjIwNSBDIDEuNTQ5IDE2LjEyNyAxLjU0MSAxNi4wNDYgMS41NDEgMTUuOTYzIEwgMS41NDEgMTQuNzYzIEwgMS41NDEgMTMuNTY0IEwgMS41NDEgMTIuMzY0IEwgMS41NDEgMTEuMTY1IEwgMS41NDEgOS45NjUgTCAxLjU0MSA4Ljc2NiBMIDEuNTQxIDcuNTY2IEwgMS41NDEgNi4zNjYgQyAxLjU0MSA2LjI4MyAxLjU0OSA2LjIwMyAxLjU2NSA2LjEyNSBDIDEuNTgxIDYuMDQ3IDEuNjA1IDUuOTcxIDEuNjM1IDUuODk5IEMgMS42NjUgNS44MjggMS43MDIgNS43NTkgMS43NDUgNS42OTUgQyAxLjc4OCA1LjYzMiAxLjgzNyA1LjU3MiAxLjg5MiA1LjUxOCBDIDEuOTQ2IDUuNDY0IDIuMDA1IDUuNDE1IDIuMDY5IDUuMzcyIEMgMi4xMzMgNS4zMjkgMi4yMDIgNS4yOTIgMi4yNzQgNS4yNjEgQyAyLjM0NSA1LjIzMSAyLjQyMSA1LjIwOCAyLjQ5OSA1LjE5MiBDIDIuNTc3IDUuMTc2IDIuNjU4IDUuMTY3IDIuNzQxIDUuMTY3IEwgNC41NCA1LjE2NyBMIDYuMzQgNS4xNjcgTCA4LjEzOSA1LjE2NyBMIDkuOTM5IDUuMTY3IEwgMTEuNzM4IDUuMTY3IEwgMTMuNTM4IDUuMTY3IEwgMTUuMzM3IDUuMTY3IFogTSAyLjc0MSAzLjk2NyBDIDIuNTc2IDMuOTY3IDIuNDE0IDMuOTg0IDIuMjU4IDQuMDE2IEMgMi4xMDIgNC4wNDggMS45NTIgNC4wOTUgMS44MDggNC4xNTYgQyAxLjY2NSA0LjIxNyAxLjUyOCA0LjI5MSAxLjQgNC4zNzcgQyAxLjI3MyA0LjQ2MyAxLjE1NCA0LjU2MiAxLjA0NSA0LjY3IEMgMC45MzcgNC43NzkgMC44MzggNC44OTggMC43NTIgNS4wMjUgQyAwLjY2NiA1LjE1MyAwLjU5MiA1LjI4OSAwLjUzMSA1LjQzMyBDIDAuNDcgNS41NzcgMC40MjMgNS43MjcgMC4zOTEgNS44ODMgQyAwLjM1OSA2LjAzOSAwLjM0MiA2LjIwMSAwLjM0MiA2LjM2NiBMIDAuMzQyIDcuNTY2IEwgMC4zNDIgOC43NjUgTCAwLjM0MiA5Ljk2NSBMIDAuMzQyIDExLjE2NCBMIDAuMzQyIDEyLjM2NCBMIDAuMzQyIDEzLjU2NCBMIDAuMzQyIDE0Ljc2NCBMIDAuMzQyIDE1Ljk2MyBDIDAuMzQyIDE2LjEyOSAwLjM1OSAxNi4yOSAwLjM5MSAxNi40NDcgQyAwLjQyMyAxNi42MDMgMC40NyAxNi43NTQgMC41MzEgMTYuODk3IEMgMC41OTIgMTcuMDQxIDAuNjY2IDE3LjE3NyAwLjc1MiAxNy4zMDQgQyAwLjgzOCAxNy40MzIgMC45MzcgMTcuNTUxIDEuMDQ1IDE3LjY1OSBDIDEuMTU0IDE3Ljc2OCAxLjI3MyAxNy44NjYgMS40IDE3Ljk1MiBDIDEuNTI4IDE4LjAzOCAxLjY2NSAxOC4xMTMgMS44MDggMTguMTczIEMgMS45NTIgMTguMjM0IDIuMTAyIDE4LjI4MSAyLjI1OCAxOC4zMTMgQyAyLjQxNCAxOC4zNDUgMi41NzYgMTguMzYyIDIuNzQxIDE4LjM2MiBMIDQuNTQxIDE4LjM2MiBMIDYuMzQgMTguMzYyIEwgOC4xNCAxOC4zNjIgTCA5LjkzOSAxOC4zNjIgTCAxMS43MzkgMTguMzYyIEwgMTMuNTM4IDE4LjM2MiBMIDE1LjMzNyAxOC4zNjIgTCAxNy4xMzYgMTguMzYyIEMgMTcuMzAyIDE4LjM2MiAxNy40NjMgMTguMzQ1IDE3LjYyIDE4LjMxMyBDIDE3Ljc3NiAxOC4yODEgMTcuOTI2IDE4LjIzNCAxOC4wNyAxOC4xNzMgQyAxOC4yMTQgMTguMTEzIDE4LjM1IDE4LjAzOCAxOC40NzcgMTcuOTUyIEMgMTguNjA1IDE3Ljg2NiAxOC43MjQgMTcuNzY4IDE4LjgzMiAxNy42NTkgQyAxOC45NDEgMTcuNTUxIDE5LjAzOSAxNy40MzIgMTkuMTI2IDE3LjMwNCBDIDE5LjIxMiAxNy4xNzcgMTkuMjg2IDE3LjA0MSAxOS4zNDcgMTYuODk3IEMgMTkuNDA4IDE2Ljc1NCAxOS40NTUgMTYuNjAzIDE5LjQ4NiAxNi40NDcgQyAxOS41MTggMTYuMjkgMTkuNTM1IDE2LjEyOCAxOS41MzUgMTUuOTYzIEwgMTkuNTM1IDE0Ljc2NCBMIDE5LjUzNSAxMy41NjQgTCAxOS41MzUgMTIuMzY0IEwgMTkuNTM1IDExLjE2NCBMIDE5LjUzNSA5Ljk2NSBMIDE5LjUzNSA4Ljc2NSBMIDE5LjUzNSA3LjU2NiBMIDE5LjUzNSA2LjM2NiBDIDE5LjUzNSA2LjIwMSAxOS41MTggNi4wMzkgMTkuNDg2IDUuODgyIEMgMTkuNDU1IDUuNzI2IDE5LjQwOCA1LjU3NSAxOS4zNDcgNS40MzIgQyAxOS4yODYgNS4yODggMTkuMjEyIDUuMTUyIDE5LjEyNiA1LjAyNSBDIDE5LjAzOSA0Ljg5NyAxOC45NDEgNC43NzggMTguODMyIDQuNjcgQyAxOC43MjQgNC41NjEgMTguNjA1IDQuNDYzIDE4LjQ3NyA0LjM3NyBDIDE4LjM1IDQuMjkxIDE4LjIxNCA0LjIxNiAxOC4wNyA0LjE1NiBDIDE3LjkyNyA0LjA5NSAxNy43NzYgNC4wNDggMTcuNjIgNC4wMTYgQyAxNy40NjMgMy45ODQgMTcuMzAxIDMuOTY3IDE3LjEzNiAzLjk2NyBMIDE1LjMzNyAzLjk2NyBMIDEzLjUzOCAzLjk2NyBMIDExLjczOSAzLjk2NyBMIDkuOTM5IDMuOTY3IEwgOC4xNCAzLjk2NyBMIDYuMzQgMy45NjcgTCA0LjU0MSAzLjk2NyBaIiBzdHlsZT0iIi8+CiAgPHBhdGggZD0iTSA5LjA3OSA4LjQ4OCBMIDguNzIxIDguODQ2IEwgOC4zNjIgOS4yMDUgTCA4LjAwMyA5LjU2NCBMIDcuNjQ0IDkuOTIzIEwgNy4yODYgMTAuMjgxIEwgNi45MjcgMTAuNjQgTCA2LjU2OCAxMC45OTkgTCA2LjIwOSAxMS4zNTggTCA2LjU2OCAxMS43MTYgTCA2LjkyNyAxMi4wNzUgTCA3LjI4NiAxMi40MzMgTCA3LjY0NCAxMi43OTIgTCA4LjAwMyAxMy4xNSBMIDguMzYyIDEzLjUwOSBMIDguNzIxIDEzLjg2NyBMIDkuMDc5IDE0LjIyNiBMIDguOTg2IDE0LjQxMyBMIDguODkyIDE0LjYgTCA4Ljc5OCAxNC43ODcgTCA4LjcwNCAxNC45NzUgTCA4LjYxMSAxNS4xNjIgTCA4LjUxNyAxNS4zNDkgTCA4LjQyMyAxNS41MzYgTCA4LjMyOSAxNS43MjMgTCA3Ljc4NCAxNS4xNzcgTCA3LjIzOCAxNC42MzIgTCA2LjY5MiAxNC4wODYgTCA2LjE0NiAxMy41NDEgTCA1LjYwMSAxMi45OTUgTCA1LjA1NSAxMi40NSBMIDQuNTA5IDExLjkwNCBMIDMuOTYzIDExLjM1OCBMIDQuNTA5IDEwLjgxMiBMIDUuMDU1IDEwLjI2NyBMIDUuNjAxIDkuNzIxIEwgNi4xNDYgOS4xNzUgTCA2LjY5MiA4LjYyOSBMIDcuMjM4IDguMDgzIEwgNy43ODQgNy41MzcgTCA4LjMyOSA2Ljk5MSBMIDguNDIzIDcuMTc4IEwgOC41MTcgNy4zNjYgTCA4LjYxMSA3LjU1MyBMIDguNzA0IDcuNzQgTCA4Ljc5OCA3LjkyNyBMIDguODkyIDguMTE0IEwgOC45ODYgOC4zMDEgWiBNIDEwLjU3NSAxNC4yMjYgTCAxMC45MzMgMTMuODY4IEwgMTEuMjkyIDEzLjUwOSBMIDExLjY1MSAxMy4xNTEgTCAxMi4wMSAxMi43OTIgTCAxMi4zNjggMTIuNDM0IEwgMTIuNzI3IDEyLjA3NSBMIDEzLjA4NSAxMS43MTcgTCAxMy40NDQgMTEuMzU4IEwgMTMuMDg1IDExIEwgMTIuNzI3IDEwLjY0MSBMIDEyLjM2OCAxMC4yODIgTCAxMi4wMSA5LjkyMyBMIDExLjY1MSA5LjU2NSBMIDExLjI5MiA5LjIwNiBMIDEwLjkzMyA4Ljg0NyBMIDEwLjU3NSA4LjQ4OCBMIDEwLjY2OSA4LjMwMSBMIDEwLjc2MiA4LjExNCBMIDEwLjg1NiA3LjkyNyBMIDEwLjk0OSA3Ljc0IEwgMTEuMDQzIDcuNTUzIEwgMTEuMTM2IDcuMzY2IEwgMTEuMjMgNy4xNzkgTCAxMS4zMjQgNi45OTEgTCAxMS44NyA3LjUzNyBMIDEyLjQxNSA4LjA4MyBMIDEyLjk2MSA4LjYyOSBMIDEzLjUwNyA5LjE3NSBMIDE0LjA1MyA5LjcyMSBMIDE0LjU5OCAxMC4yNjcgTCAxNS4xNDQgMTAuODEzIEwgMTUuNjkgMTEuMzU4IEwgMTUuMTQ0IDExLjkwNCBMIDE0LjU5OCAxMi40NSBMIDE0LjA1MyAxMi45OTYgTCAxMy41MDcgMTMuNTQxIEwgMTIuOTYxIDE0LjA4NyBMIDEyLjQxNSAxNC42MzIgTCAxMS44NyAxNS4xNzggTCAxMS4zMjQgMTUuNzIzIEwgMTEuMjMgMTUuNTM2IEwgMTEuMTM2IDE1LjM0OSBMIDExLjA0MyAxNS4xNjIgTCAxMC45NDkgMTQuOTc1IEwgMTAuODU2IDE0Ljc4OCBMIDEwLjc2MiAxNC42IEwgMTAuNjY5IDE0LjQxMyBaIiBzdHlsZT0iIi8+Cjwvc3ZnPg==",
        accesskey: "H"
    }, {
        label: locale.includes("zh-") ? '复制链接 MARKDOWN' : 'Copy link as markdown type',
        text: '[%RLT_OR_UT%](%RLINK_OR_URL%)',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuMTM4IDQuMzI3IEMgMTcuMjIxIDQuMzI3IDE3LjMwMiA0LjMzNiAxNy4zOCA0LjM1MiBDIDE3LjQ1OCA0LjM2OCAxNy41MzMgNC4zOTEgMTcuNjA1IDQuNDIxIEMgMTcuNjc3IDQuNDUxIDE3Ljc0NSA0LjQ4OSAxNy44MDkgNC41MzIgQyAxNy44NzMgNC41NzUgMTcuOTMyIDQuNjI0IDE3Ljk4NiA0LjY3OCBDIDE4LjA0MSA0LjczMyAxOC4wOSA0Ljc5MiAxOC4xMzMgNC44NTYgQyAxOC4xNzYgNC45MiAxOC4yMTMgNC45ODkgMTguMjQzIDUuMDYgQyAxOC4yNzQgNS4xMzIgMTguMjk3IDUuMjA3IDE4LjMxMyA1LjI4NSBDIDE4LjMyOSA1LjM2MyAxOC4zMzcgNS40NDQgMTguMzM3IDUuNTI3IEwgMTguMzM3IDYuNzI3IEwgMTguMzM3IDcuOTI2IEwgMTguMzM3IDkuMTI2IEwgMTguMzM3IDEwLjMyNSBMIDE4LjMzNyAxMS41MjUgTCAxOC4zMzcgMTIuNzI0IEwgMTguMzM3IDEzLjkyNCBMIDE4LjMzNyAxNS4xMjMgQyAxOC4zMzcgMTUuMjA2IDE4LjMyOSAxNS4yODcgMTguMzEzIDE1LjM2NSBDIDE4LjI5NyAxNS40NDQgMTguMjc0IDE1LjUxOSAxOC4yNDMgMTUuNTkxIEMgMTguMjEzIDE1LjY2MyAxOC4xNzYgMTUuNzMxIDE4LjEzMyAxNS43OTUgQyAxOC4wOSAxNS44NTkgMTguMDQxIDE1LjkxOCAxNy45ODYgMTUuOTcyIEMgMTcuOTMyIDE2LjAyNyAxNy44NzMgMTYuMDc2IDE3LjgwOSAxNi4xMTkgQyAxNy43NDUgMTYuMTYyIDE3LjY3NyAxNi4xOTkgMTcuNjA1IDE2LjIyOSBDIDE3LjUzMyAxNi4yNiAxNy40NTggMTYuMjgzIDE3LjM4IDE2LjI5OSBDIDE3LjMwMiAxNi4zMTUgMTcuMjIxIDE2LjMyMyAxNy4xMzggMTYuMzIzIEwgMTUuMzM5IDE2LjMyMyBMIDEzLjU0IDE2LjMyMyBMIDExLjc0MSAxNi4zMjMgTCA5Ljk0MSAxNi4zMjMgTCA4LjE0MiAxNi4zMjMgTCA2LjM0MiAxNi4zMjMgTCA0LjU0MyAxNi4zMjMgTCAyLjc0MyAxNi4zMjMgQyAyLjY2MSAxNi4zMjMgMi41OCAxNi4zMTUgMi41MDIgMTYuMjk5IEMgMi40MjQgMTYuMjgzIDIuMzQ4IDE2LjI2IDIuMjc2IDE2LjIyOSBDIDIuMjA1IDE2LjE5OSAyLjEzNyAxNi4xNjIgMi4wNzMgMTYuMTE5IEMgMi4wMDkgMTYuMDc2IDEuOTUgMTYuMDI3IDEuODk1IDE1Ljk3MiBDIDEuODQxIDE1LjkxOCAxLjc5MiAxNS44NTkgMS43NDkgMTUuNzk1IEMgMS43MDYgMTUuNzMxIDEuNjY4IDE1LjY2MyAxLjYzOCAxNS41OTEgQyAxLjYwOCAxNS41MTkgMS41ODQgMTUuNDQ0IDEuNTY4IDE1LjM2NSBDIDEuNTUyIDE1LjI4NyAxLjU0NCAxNS4yMDYgMS41NDQgMTUuMTIzIEwgMS41NDQgMTMuOTI0IEwgMS41NDQgMTIuNzI0IEwgMS41NDQgMTEuNTI1IEwgMS41NDQgMTAuMzI1IEwgMS41NDQgOS4xMjYgTCAxLjU0NCA3LjkyNiBMIDEuNTQ0IDYuNzI3IEwgMS41NDQgNS41MjcgQyAxLjU0NCA1LjQ0NCAxLjU1MiA1LjM2MyAxLjU2OCA1LjI4NSBDIDEuNTg0IDUuMjA3IDEuNjA4IDUuMTMyIDEuNjM4IDUuMDYgQyAxLjY2OCA0Ljk4OCAxLjcwNiA0LjkyIDEuNzQ5IDQuODU2IEMgMS43OTIgNC43OTIgMS44NDEgNC43MzMgMS44OTUgNC42NzggQyAxLjk1IDQuNjI0IDIuMDA5IDQuNTc1IDIuMDczIDQuNTMyIEMgMi4xMzcgNC40ODkgMi4yMDUgNC40NTIgMi4yNzYgNC40MjEgQyAyLjM0OCA0LjM5MSAyLjQyNCA0LjM2OCAyLjUwMiA0LjM1MiBDIDIuNTggNC4zMzYgMi42NjEgNC4zMjcgMi43NDMgNC4zMjcgTCA0LjU0MyA0LjMyNyBMIDYuMzQyIDQuMzI3IEwgOC4xNDIgNC4zMjcgTCA5Ljk0MSA0LjMyNyBMIDExLjc0MSA0LjMyNyBMIDEzLjU0IDQuMzI3IEwgMTUuMzM5IDQuMzI3IFogTSAyLjc0MyAzLjEyOCBDIDIuNTc3IDMuMTI4IDIuNDE2IDMuMTQ1IDIuMjYgMy4xNzcgQyAyLjEwNCAzLjIwOSAxLjk1NCAzLjI1NiAxLjgxIDMuMzE3IEMgMS42NjcgMy4zNzggMS41MyAzLjQ1MiAxLjQwMiAzLjUzOCBDIDEuMjc1IDMuNjI0IDEuMTU2IDMuNzIzIDEuMDQ3IDMuODMxIEMgMC45MzggMy45NCAwLjg0IDQuMDU5IDAuNzU0IDQuMTg2IEMgMC42NjggNC4zMTQgMC41OTMgNC40NTEgMC41MzMgNC41OTQgQyAwLjQ3MiA0LjczOCAwLjQyNSA0Ljg4OCAwLjM5MyA1LjA0NCBDIDAuMzYxIDUuMiAwLjM0NCA1LjM2MiAwLjM0NCA1LjUyNyBMIDAuMzQ0IDYuNzI3IEwgMC4zNDQgNy45MjYgTCAwLjM0NCA5LjEyNiBMIDAuMzQ0IDEwLjMyNSBMIDAuMzQ0IDExLjUyNSBMIDAuMzQ0IDEyLjcyNCBMIDAuMzQ0IDEzLjkyNCBMIDAuMzQ0IDE1LjEyMyBDIDAuMzQ0IDE1LjI4OSAwLjM2MSAxNS40NSAwLjM5MyAxNS42MDcgQyAwLjQyNSAxNS43NjMgMC40NzIgMTUuOTE0IDAuNTMzIDE2LjA1NyBDIDAuNTkzIDE2LjIgMC42NjggMTYuMzM2IDAuNzU0IDE2LjQ2NCBDIDAuODQgMTYuNTkyIDAuOTM4IDE2LjcxMSAxLjA0NyAxNi44MTkgQyAxLjE1NiAxNi45MjggMS4yNzUgMTcuMDI2IDEuNDAyIDE3LjExMyBDIDEuNTMgMTcuMTk5IDEuNjY2IDE3LjI3MyAxLjgxIDE3LjMzNCBDIDEuOTUzIDE3LjM5NSAyLjEwNCAxNy40NDIgMi4yNiAxNy40NzMgQyAyLjQxNiAxNy41MDUgMi41NzcgMTcuNTIyIDIuNzQzIDE3LjUyMiBMIDQuNTQyIDE3LjUyMiBMIDYuMzQyIDE3LjUyMiBMIDguMTQxIDE3LjUyMiBMIDkuOTQxIDE3LjUyMiBMIDExLjc0IDE3LjUyMiBMIDEzLjU0IDE3LjUyMiBMIDE1LjMzOSAxNy41MjIgTCAxNy4xMzggMTcuNTIyIEMgMTcuMzA0IDE3LjUyMiAxNy40NjYgMTcuNTA1IDE3LjYyMiAxNy40NzMgQyAxNy43NzggMTcuNDQyIDE3LjkyOCAxNy4zOTUgMTguMDcyIDE3LjMzNCBDIDE4LjIxNSAxNy4yNzMgMTguMzUyIDE3LjE5OSAxOC40NzkgMTcuMTEzIEMgMTguNjA3IDE3LjAyNiAxOC43MjUgMTYuOTI4IDE4LjgzNCAxNi44MTkgQyAxOC45NDIgMTYuNzExIDE5LjA0MSAxNi41OTIgMTkuMTI3IDE2LjQ2NCBDIDE5LjIxMyAxNi4zMzYgMTkuMjg3IDE2LjIgMTkuMzQ4IDE2LjA1NyBDIDE5LjQwOSAxNS45MTMgMTkuNDU2IDE1Ljc2MiAxOS40ODggMTUuNjA2IEMgMTkuNTIgMTUuNDUgMTkuNTM3IDE1LjI4OSAxOS41MzcgMTUuMTIzIEwgMTkuNTM3IDEzLjkyNCBMIDE5LjUzNyAxMi43MjQgTCAxOS41MzcgMTEuNTI1IEwgMTkuNTM3IDEwLjMyNSBMIDE5LjUzNyA5LjEyNiBMIDE5LjUzNyA3LjkyNiBMIDE5LjUzNyA2LjcyNyBMIDE5LjUzNyA1LjUyNyBDIDE5LjUzNyA1LjM2MiAxOS41MiA1LjIgMTkuNDg4IDUuMDQ0IEMgMTkuNDU2IDQuODg4IDE5LjQwOSA0LjczNyAxOS4zNDggNC41OTMgQyAxOS4yODcgNC40NSAxOS4yMTMgNC4zMTMgMTkuMTI3IDQuMTg2IEMgMTkuMDQxIDQuMDU4IDE4Ljk0MiAzLjk0IDE4LjgzNCAzLjgzMSBDIDE4LjcyNSAzLjcyMiAxOC42MDcgMy42MjQgMTguNDc5IDMuNTM4IEMgMTguMzUyIDMuNDUxIDE4LjIxNSAzLjM3NyAxOC4wNzIgMy4zMTYgQyAxNy45MjggMy4yNTYgMTcuNzc4IDMuMjA5IDE3LjYyMSAzLjE3NyBDIDE3LjQ2NSAzLjE0NSAxNy4zMDMgMy4xMjggMTcuMTM4IDMuMTI4IEwgMTUuMzM4IDMuMTI4IEwgMTMuNTM5IDMuMTI4IEwgMTEuNzM5IDMuMTI4IEwgOS45NCAzLjEyOCBMIDguMTQxIDMuMTI4IEwgNi4zNDIgMy4xMjggTCA0LjU0MiAzLjEyOCBaIiBzdHlsZT0iIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNIDExLjMxNSAxMC41IEMgMTEuMzQ1IDEwLjQ3MSAxMS4zNzYgMTAuNDQ2IDExLjQxIDEwLjQyNCBDIDExLjQ0MyAxMC40MDIgMTEuNDc4IDEwLjM4MyAxMS41MTQgMTAuMzY4IEMgMTEuNTUgMTAuMzU0IDExLjU4NyAxMC4zNDMgMTEuNjI1IDEwLjMzNSBDIDExLjY2MyAxMC4zMjggMTEuNzAyIDEwLjMyNCAxMS43NCAxMC4zMjQgQyAxMS43NzkgMTAuMzI0IDExLjgxNyAxMC4zMjggMTEuODU1IDEwLjMzNSBDIDExLjg5MyAxMC4zNDMgMTEuOTMgMTAuMzU0IDExLjk2NiAxMC4zNjggQyAxMi4wMDIgMTAuMzgzIDEyLjAzNyAxMC40MDIgMTIuMDcxIDEwLjQyNCBDIDEyLjEwNCAxMC40NDYgMTIuMTM1IDEwLjQ3MSAxMi4xNjUgMTAuNSBMIDEyLjQxMSAxMC43NDcgTCAxMi42NTggMTAuOTk0IEwgMTIuOTA1IDExLjI0MSBMIDEzLjE1MiAxMS40ODggTCAxMy4zOTggMTEuNzM1IEwgMTMuNjQ1IDExLjk4MiBMIDEzLjg5MiAxMi4yMjkgTCAxNC4xMzkgMTIuNDc2IEwgMTQuMzg1IDEyLjIyOSBMIDE0LjYzMiAxMS45ODIgTCAxNC44NzkgMTEuNzM1IEwgMTUuMTI2IDExLjQ4OCBMIDE1LjM3MiAxMS4yNDEgTCAxNS42MTkgMTAuOTk0IEwgMTUuODY2IDEwLjc0NyBMIDE2LjExMyAxMC41IEMgMTYuMTUzIDEwLjQ2IDE2LjE5OCAxMC40MjYgMTYuMjQ1IDEwLjQgQyAxNi4yOTIgMTAuMzc0IDE2LjM0MSAxMC4zNTUgMTYuMzkxIDEwLjM0MiBDIDE2LjQ0MSAxMC4zMyAxNi40OTIgMTAuMzI0IDE2LjU0MyAxMC4zMjQgQyAxNi41OTQgMTAuMzI1IDE2LjY0NSAxMC4zMzIgMTYuNjk0IDEwLjM0NSBDIDE2Ljc0MiAxMC4zNTggMTYuNzkgMTAuMzc3IDE2LjgzNCAxMC40MDIgQyAxNi44NzggMTAuNDI2IDE2LjkyIDEwLjQ1NyAxNi45NTcgMTAuNDkzIEMgMTYuOTk0IDEwLjUyOSAxNy4wMjcgMTAuNTcgMTcuMDU0IDEwLjYxNiBDIDE3LjA4MSAxMC42NjIgMTcuMTAzIDEwLjcxMyAxNy4xMTggMTAuNzY5IEMgMTcuMTI1IDEwLjc5NSAxNy4xMyAxMC44MjEgMTcuMTM0IDEwLjg0OCBDIDE3LjEzNyAxMC44NzQgMTcuMTM5IDEwLjkgMTcuMTM5IDEwLjkyNiBDIDE3LjEzOCAxMC45NTIgMTcuMTM2IDEwLjk3OCAxNy4xMzMgMTEuMDA0IEMgMTcuMTI5IDExLjAzIDE3LjEyNCAxMS4wNTUgMTcuMTE4IDExLjA4IEMgMTcuMTExIDExLjEwNiAxNy4xMDMgMTEuMTMgMTcuMDkzIDExLjE1NCBDIDE3LjA4MyAxMS4xNzggMTcuMDcyIDExLjIwMiAxNy4wNTkgMTEuMjI0IEMgMTcuMDQ2IDExLjI0NyAxNy4wMzEgMTEuMjY4IDE3LjAxNSAxMS4yODkgQyAxNi45OTkgMTEuMzEgMTYuOTgyIDExLjMzIDE2Ljk2MyAxMS4zNDkgTCAxNi42NjMgMTEuNjQ5IEwgMTYuMzYzIDExLjk0OSBMIDE2LjA2MyAxMi4yNDkgTCAxNS43NjQgMTIuNTQ5IEwgMTUuNDY0IDEyLjg0OSBMIDE1LjE2NCAxMy4xNDkgTCAxNC44NjQgMTMuNDQ5IEwgMTQuNTY0IDEzLjc0OSBDIDE0LjUzNCAxMy43NzkgMTQuNTAzIDEzLjgwNCAxNC40NyAxMy44MjYgQyAxNC40MzYgMTMuODQ4IDE0LjQwMSAxMy44NjYgMTQuMzY1IDEzLjg4MSBDIDE0LjMyOSAxMy44OTYgMTQuMjkyIDEzLjkwNyAxNC4yNTQgMTMuOTE0IEMgMTQuMjE2IDEzLjkyMSAxNC4xNzcgMTMuOTI1IDE0LjEzOSAxMy45MjUgQyAxNC4xIDEzLjkyNSAxNC4wNjIgMTMuOTIxIDE0LjAyNCAxMy45MTQgQyAxMy45ODYgMTMuOTA3IDEzLjk0OSAxMy44OTYgMTMuOTEzIDEzLjg4MSBDIDEzLjg3NyAxMy44NjcgMTMuODQyIDEzLjg0OCAxMy44MDkgMTMuODI2IEMgMTMuNzc1IDEzLjgwNCAxMy43NDMgMTMuNzc5IDEzLjcxNCAxMy43NDkgTCAxMy40MTQgMTMuNDQ5IEwgMTMuMTE0IDEzLjE0OSBMIDEyLjgxNCAxMi44NDkgTCAxMi41MTUgMTIuNTQ5IEwgMTIuMjE1IDEyLjI0OSBMIDExLjkxNSAxMS45NDkgTCAxMS42MTUgMTEuNjQ5IEwgMTEuMzE1IDExLjM0OSBDIDExLjI4NSAxMS4zMiAxMS4yNiAxMS4yODkgMTEuMjM4IDExLjI1NSBDIDExLjIxNiAxMS4yMjIgMTEuMTk3IDExLjE4NyAxMS4xODMgMTEuMTUxIEMgMTEuMTY4IDExLjExNSAxMS4xNTcgMTEuMDc4IDExLjE1IDExLjA0IEMgMTEuMTQzIDExLjAwMiAxMS4xMzkgMTAuOTY0IDExLjEzOSAxMC45MjUgQyAxMS4xMzkgMTAuODg3IDExLjE0MyAxMC44NDggMTEuMTUgMTAuODEgQyAxMS4xNTcgMTAuNzcyIDExLjE2OCAxMC43MzUgMTEuMTgzIDEwLjY5OSBDIDExLjE5NyAxMC42NjMgMTEuMjE2IDEwLjYyNyAxMS4yMzggMTAuNTk0IEMgMTEuMjYgMTAuNTYxIDExLjI4NSAxMC41MjkgMTEuMzE1IDEwLjUgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTSAxNC4xMzkgNi43MjYgQyAxNC4xOCA2LjcyNiAxNC4yMjEgNi43MyAxNC4yNiA2LjczOCBDIDE0LjI5OSA2Ljc0NiAxNC4zMzcgNi43NTggMTQuMzczIDYuNzczIEMgMTQuNDA5IDYuNzg5IDE0LjQ0MyA2LjgwNyAxNC40NzUgNi44MjkgQyAxNC41MDcgNi44NTEgMTQuNTM2IDYuODc1IDE0LjU2MyA2LjkwMiBDIDE0LjU5MSA2LjkzIDE0LjYxNSA2Ljk1OSAxNC42MzcgNi45OTEgQyAxNC42NTkgNy4wMjMgMTQuNjc3IDcuMDU3IDE0LjY5MiA3LjA5MyBDIDE0LjcwNyA3LjEyOSAxNC43MTkgNy4xNjcgMTQuNzI3IDcuMjA2IEMgMTQuNzM1IDcuMjQ1IDE0LjczOSA3LjI4NSAxNC43MzkgNy4zMjYgTCAxNC43MzkgNy45MjYgTCAxNC43MzkgOC41MjYgTCAxNC43MzkgOS4xMjYgTCAxNC43MzkgOS43MjUgTCAxNC43MzkgMTAuMzI1IEwgMTQuNzM5IDEwLjkyNSBMIDE0LjczOSAxMS41MjUgTCAxNC43MzkgMTIuMTI0IEMgMTQuNzM5IDEyLjE4MiAxNC43MzEgMTIuMjM3IDE0LjcxNyAxMi4yODkgQyAxNC43MDMgMTIuMzQgMTQuNjgyIDEyLjM4OSAxNC42NTUgMTIuNDMzIEMgMTQuNjI5IDEyLjQ3NyAxNC41OTYgMTIuNTE3IDE0LjU2IDEyLjU1MyBDIDE0LjUyMyAxMi41ODggMTQuNDgzIDEyLjYxOSAxNC40MzkgMTIuNjQ0IEMgMTQuMzk1IDEyLjY3IDE0LjM0OCAxMi42ODkgMTQuMjk5IDEyLjcwMyBDIDE0LjI1IDEyLjcxNyAxNC4yIDEyLjcyNCAxNC4xNDggMTIuNzI1IEMgMTQuMDk3IDEyLjcyNiAxNC4wNDQgMTIuNzIgMTMuOTkyIDEyLjcwNyBDIDEzLjk0MSAxMi42OTQgMTMuODg5IDEyLjY3MyAxMy44MzkgMTIuNjQ0IEMgMTMuODE2IDEyLjYzMSAxMy43OTQgMTIuNjE2IDEzLjc3MyAxMi42IEMgMTMuNzUyIDEyLjU4NCAxMy43MzIgMTIuNTY3IDEzLjcxNCAxMi41NDggQyAxMy42OTYgMTIuNTMgMTMuNjc4IDEyLjUxIDEzLjY2MyAxMi40OSBDIDEzLjY0NyAxMi40NjkgMTMuNjMzIDEyLjQ0OCAxMy42MiAxMi40MjUgQyAxMy42MDcgMTIuNDAzIDEzLjU5NiAxMi4zNzkgMTMuNTg2IDEyLjM1NSBDIDEzLjU3NiAxMi4zMzEgMTMuNTY3IDEyLjMwNyAxMy41NiAxMi4yODEgQyAxMy41NTMgMTIuMjU2IDEzLjU0OCAxMi4yMyAxMy41NDQgMTIuMjA0IEMgMTMuNTQxIDEyLjE3OCAxMy41MzkgMTIuMTUxIDEzLjUzOSAxMi4xMjQgTCAxMy41MzkgMTEuNTI1IEwgMTMuNTM5IDEwLjkyNSBMIDEzLjUzOSAxMC4zMjUgTCAxMy41MzkgOS43MjUgTCAxMy41MzkgOS4xMjYgTCAxMy41MzkgOC41MjYgTCAxMy41MzkgNy45MjYgTCAxMy41MzkgNy4zMjYgQyAxMy41MzkgNy4yODUgMTMuNTQzIDcuMjQ0IDEzLjU1MSA3LjIwNSBDIDEzLjU1OSA3LjE2NyAxMy41NzEgNy4xMjkgMTMuNTg2IDcuMDkzIEMgMTMuNjAxIDcuMDU3IDEzLjYyIDcuMDIzIDEzLjY0MSA2Ljk5MSBDIDEzLjY2MyA2Ljk1OSAxMy42ODggNi45MjkgMTMuNzE1IDYuOTAyIEMgMTMuNzQyIDYuODc1IDEzLjc3MiA2Ljg1IDEzLjgwNCA2LjgyOSBDIDEzLjgzNiA2LjgwNyAxMy44NyA2Ljc4OSAxMy45MDYgNi43NzMgQyAxMy45NDIgNi43NTggMTMuOTc5IDYuNzQ2IDE0LjAxOCA2LjczOCBDIDE0LjA1NyA2LjczIDE0LjA5OCA2LjcyNiAxNC4xMzkgNi43MjYgWiIgc3R5bGU9IiIvPgogIDxwYXRoIGQ9Ik0gNC42MTQgMTMuOTI0IEwgNC42MTQgMTMuMzI2IEwgNC42MTQgMTIuNzI4IEwgNC42MTQgMTIuMTI5IEwgNC42MTQgMTEuNTMxIEwgNC42MTQgMTAuOTMzIEwgNC42MTQgMTAuMzM0IEwgNC42MTQgOS43MzYgTCA0LjYxNCA5LjEzNyBMIDQuNjIzIDkuMTM3IEwgNC42MzEgOS4xMzcgTCA0LjYzOSA5LjEzNyBMIDQuNjQ4IDkuMTM3IEwgNC42NTYgOS4xMzcgTCA0LjY2NSA5LjEzNyBMIDQuNjczIDkuMTM3IEwgNC42ODIgOS4xMzcgTCA0Ljg5NiA5LjYyMyBMIDUuMTEgMTAuMTA5IEwgNS4zMjQgMTAuNTk1IEwgNS41MzggMTEuMDggTCA1Ljc1MiAxMS41NjYgTCA1Ljk2NyAxMi4wNTEgTCA2LjE4MSAxMi41MzcgTCA2LjM5NSAxMy4wMjMgTCA2LjUxMSAxMy4wMjMgTCA2LjYyNyAxMy4wMjMgTCA2Ljc0MyAxMy4wMjMgTCA2Ljg1OSAxMy4wMjMgTCA2Ljk3NSAxMy4wMjMgTCA3LjA5MSAxMy4wMjMgTCA3LjIwNyAxMy4wMjMgTCA3LjMyMyAxMy4wMjMgTCA3LjUzNiAxMi41MzcgTCA3Ljc0OSAxMi4wNTEgTCA3Ljk2MiAxMS41NjYgTCA4LjE3NSAxMS4wOCBMIDguMzg4IDEwLjU5NCBMIDguNjAxIDEwLjEwOCBMIDguODEzIDkuNjIyIEwgOS4wMjYgOS4xMzYgTCA5LjAzNCA5LjEzNiBMIDkuMDQzIDkuMTM2IEwgOS4wNTEgOS4xMzYgTCA5LjA2IDkuMTM2IEwgOS4wNjggOS4xMzYgTCA5LjA3NyA5LjEzNiBMIDkuMDg1IDkuMTM2IEwgOS4wOTQgOS4xMzYgTCA5LjA5NCA5LjczNCBMIDkuMDk0IDEwLjMzMyBMIDkuMDk0IDEwLjkzMSBMIDkuMDk0IDExLjUzIEwgOS4wOTQgMTIuMTI4IEwgOS4wOTQgMTIuNzI3IEwgOS4wOTQgMTMuMzI1IEwgOS4wOTQgMTMuOTI0IEwgOS4yNTUgMTMuOTI0IEwgOS40MTYgMTMuOTI0IEwgOS41NzcgMTMuOTI0IEwgOS43MzggMTMuOTI0IEwgOS44OTggMTMuOTI0IEwgMTAuMDU5IDEzLjkyNCBMIDEwLjIyIDEzLjkyNCBMIDEwLjM4MSAxMy45MjQgTCAxMC4zODEgMTMuMDI0IEwgMTAuMzgxIDEyLjEyNSBMIDEwLjM4MSAxMS4yMjUgTCAxMC4zODEgMTAuMzI2IEwgMTAuMzgxIDkuNDI2IEwgMTAuMzgxIDguNTI3IEwgMTAuMzgxIDcuNjI3IEwgMTAuMzgxIDYuNzI4IEwgMTAuMjAxIDYuNzI4IEwgMTAuMDIxIDYuNzI4IEwgOS44NDEgNi43MjggTCA5LjY2MSA2LjcyOCBMIDkuNDgxIDYuNzI4IEwgOS4zMDEgNi43MjggTCA5LjEyMSA2LjcyOCBMIDguOTQxIDYuNzI4IEwgOC42ODQgNy4zMTIgTCA4LjQyOCA3Ljg5NiBMIDguMTcxIDguNDggTCA3LjkxNSA5LjA2NCBMIDcuNjU5IDkuNjQ3IEwgNy40MDMgMTAuMjMxIEwgNy4xNDYgMTAuODE1IEwgNi44OSAxMS4zOTkgTCA2Ljg4NCAxMS4zOTkgTCA2Ljg3OCAxMS4zOTkgTCA2Ljg3MiAxMS4zOTkgTCA2Ljg2NiAxMS4zOTkgTCA2Ljg2IDExLjM5OSBMIDYuODU1IDExLjM5OSBMIDYuODQ5IDExLjM5OSBMIDYuODQzIDExLjM5OSBMIDYuNTg2IDEwLjgxNSBMIDYuMzMgMTAuMjMxIEwgNi4wNzMgOS42NDcgTCA1LjgxNyA5LjA2NCBMIDUuNTYxIDguNDggTCA1LjMwNSA3Ljg5NiBMIDUuMDQ4IDcuMzEyIEwgNC43OTIgNi43MjggTCA0LjYxMSA2LjcyOCBMIDQuNDMgNi43MjggTCA0LjI0OCA2LjcyOCBMIDQuMDY3IDYuNzI4IEwgMy44ODYgNi43MjggTCAzLjcwNSA2LjcyOCBMIDMuNTI0IDYuNzI4IEwgMy4zNDMgNi43MjggTCAzLjM0MyA3LjYyNyBMIDMuMzQzIDguNTI3IEwgMy4zNDMgOS40MjYgTCAzLjM0MyAxMC4zMjYgTCAzLjM0MyAxMS4yMjUgTCAzLjM0MyAxMi4xMjUgTCAzLjM0MyAxMy4wMjQgTCAzLjM0MyAxMy45MjQgTCAzLjUwMiAxMy45MjQgTCAzLjY2MSAxMy45MjQgTCAzLjgxOSAxMy45MjQgTCAzLjk3OCAxMy45MjQgTCA0LjEzNyAxMy45MjQgTCA0LjI5NiAxMy45MjQgTCA0LjQ1NSAxMy45MjQgWiIgc3R5bGU9IiIvPgo8L3N2Zz4=",
        accesskey: "M"
    }]);
    css('#context-copylink, #context-bookmarklink, #context-savelink { display: none; }');
    css('#context-sendlinktodevice[hidden="true"]+#context-sep-sendlinktodevice { display: none; }')
}
//复制链接文本
new function () {
    var groupMenu = GroupMenu({
        id: 'context-copytext-group',
        class: 'showText',
        condition: 'link',
        insertBefore: 'context-bookmarklink',
        onpopupshowing: syncHidden
    });
    groupMenu([{
        label: locale.includes("zh-") ? "复制文字" : "Copy Text",
        accesskey: 'T',
        text: "%LINK_TEXT%",
        class: 'copy'
    }, {
        label: locale.includes("zh-") ? "文字和链接" : "Copy Text and Link",
        accesskey: 'E',
        text: "%LINK_TEXT%\n%l",
        image: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg=="
    }]);
};
// 链接右键菜单 End ==============================================================
// 图像右键菜单 Start ============================================================
// 打开图像
new function () {
    var groupMenu = GroupMenu({
        id: 'context-view-image',
        class: 'showText',
        label: locale.includes("zh-") ? '打开图像...' : 'View image...',
        condition: 'image',
        insertBefore: 'context-viewimage'
    });
    groupMenu([{
        label: locale.includes("zh-") ? '打开图像' : 'View image in new tab',
        oncommand: "document.getElementById('context-viewimage').click();",
        accesskey: 'I',
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0xMy41MjQgMi4yODZBMi40NzYgMi40NzYgMCAwIDEgMTYgNC43NjJ2OC43NjJBMi40NzcgMi40NzcgMCAwIDEgMTMuNTI0IDE2SDQuNzYyYTIuNDc2IDIuNDc2IDAgMCAxLTIuNDc2LTIuNDc2VjguNzYzYy4zNjEuMTUxLjc0NC4yNiAxLjE0My4zMjJ2NC40MzljMCAuMTU5LjAyNy4zMTEuMDc4LjQ1Mmw0LjQzNi00LjM0M2ExLjcxNCAxLjcxNCAwIDAgMSAyLjMwMS0uMDg5bC4wOTguMDg5IDQuNDM2IDQuMzQ0Yy4wNTEtLjE0Mi4wNzktLjI5NC4wNzktLjQ1M1Y0Ljc2MmMwLS43MzYtLjU5Ny0xLjMzMy0xLjMzMy0xLjMzM0g5LjA4NWE0LjkxNiA0LjkxNiAwIDAgMC0uMzIyLTEuMTQzaDQuNzYxWm0tNC43MTcgOC4xMDktLjA2NC4wNTQtNC40MjQgNC4zMzNjLjEzOC4wNDkuMjg4LjA3NS40NDMuMDc1aDguNzYyYy4xNTUgMCAuMzA0LS4wMjYuNDQyLS4wNzVsLTQuNDIzLTQuMzMzYS41NzQuNTc0IDAgMCAwLS43MzYtLjA1NFptMi44MTQtNS40NDNhMS43MTcgMS43MTcgMCAxIDEtLjAwMiAzLjQzNCAxLjcxNyAxLjcxNyAwIDAgMSAuMDAyLTMuNDM0Wk00LjE5IDBhNC4xOSA0LjE5IDAgMSAxIC4wMDEgOC4zOEE0LjE5IDQuMTkgMCAwIDEgNC4xOSAwWm03LjQzMSA2LjA5NWEuNTczLjU3MyAwIDEgMCAwIDEuMTQ2LjU3My41NzMgMCAwIDAgMC0xLjE0NlpNNC4xOSAxLjUyM2wtLjA2OC4wMDZhLjM4MS4zODEgMCAwIDAtLjMwNi4zMDdsLS4wMDYuMDY4LS4wMDEgMS45MDUtMS45MDYuMDAxLS4wNjkuMDA2YS4zOC4zOCAwIDAgMC0uMzA2LjMwNmwtLjAwNi4wNjguMDA2LjA2OWEuMzgxLjM4MSAwIDAgMCAuMzA2LjMwNmwuMDY5LjAwNkgzLjgxdjEuOTA4bC4wMDcuMDY4Yy4wMjguMTU2LjE1LjI3OC4zMDYuMzA3bC4wNjguMDA2LjA2OS0uMDA2YS4zODIuMzgyIDAgMCAwIC4zMDYtLjMwN2wuMDA2LS4wNjhWNC41NzFINi40OGwuMDY4LS4wMDZhLjM4LjM4IDAgMCAwIC4zMDYtLjMwNmwuMDA3LS4wNjktLjAwNy0uMDY4YS4zNzkuMzc5IDAgMCAwLS4zMDYtLjMwNkw2LjQ4IDMuODFsLTEuOTA5LS4wMDFWMS45MDRsLS4wMDYtLjA2OGEuMzgyLjM4MiAwIDAgMC0uMzA2LS4zMDdsLS4wNjktLjAwNloiLz4KPC9zdmc+Cg=="
    }, {
        label: locale.includes("zh-") ? '发送图像' : 'Send image by email',
        accesskey: 'G',
        oncommand: 'gContextMenu.sendMedia();',
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTAuMDAzOTA2MjUgM0wwLjAwMzkwNjI1IDM1TDIgMzVMMiA1TDQ1IDVMNDUgMyBaIE0gNCA3TDQgMzlMMjcgMzlMMjcgMzdMNiAzN0w2IDM0Ljk4MDQ2OUwxOC44MDg1OTQgMjQuODUxNTYzQzE5Ljg0Mzc1IDI1Ljc1NzgxMyAyMS43NTc4MTMgMjcuNDIxODc1IDIyIDI3LjYzMjgxM0MyMy41MjM0MzggMjguOTYwOTM4IDI1LjE0MDYyNSAyOS4yOTY4NzUgMjYuMTc1NzgxIDI5LjI5Njg3NUMyNy4yMTA5MzggMjkuMjk2ODc1IDI4LjgyODEyNSAyOC45NjA5MzggMzAuMzU1NDY5IDI3LjYzMjgxM0MzMS41MzkwNjMgMjYuNjAxNTYzIDQzLjE3OTY4OCAxNi40NTMxMjUgNDYgMTMuOTk2MDk0TDQ2IDMxTDQ4IDMzTDQ4IDcgWiBNIDYgOUw0NiA5TDQ2IDExLjM0Mzc1QzQ0Ljk2NDg0NCAxMi4yNDYwOTQgMzAuMzEyNSAyNS4wMTk1MzEgMjkuMDQyOTY5IDI2LjEyNUMyNy45MjE4NzUgMjcuMTAxNTYzIDI2Ljc4MTI1IDI3LjI5Njg3NSAyNi4xNzU3ODEgMjcuMjk2ODc1QzI1LjU3MDMxMyAyNy4yOTY4NzUgMjQuNDMzNTk0IDI3LjA5NzY1NiAyMy4zMTI1IDI2LjEyNUMyMi4wMDc4MTMgMjQuOTg4MjgxIDYuNDQxNDA2IDExLjQyMTg3NSA2IDExLjAzNTE1NiBaIE0gNiAxMy42ODc1QzcuNjk1MzEzIDE1LjE2Nzk2OSAxMi43MTg3NSAxOS41NDY4NzUgMTcuMjczNDM4IDIzLjUxNTYyNUw2IDMyLjQyOTY4OCBaIE0gMzkuOTg4MjgxIDI5Ljk4ODI4MUMzOS41ODIwMzEgMjkuOTkyMTg4IDM5LjIxODc1IDMwLjIzODI4MSAzOS4wNjI1IDMwLjYxMzI4MUMzOC45MTAxNTYgMzAuOTkyMTg4IDM5IDMxLjQyMTg3NSAzOS4yOTI5NjkgMzEuNzA3MDMxTDQ0LjU4NTkzOCAzN0wzMSAzN0wzMSAzOUw0NC41ODU5MzggMzlMMzkuMjkyOTY5IDQ0LjI5Mjk2OUMzOS4wMzEyNSA0NC41NDI5NjkgMzguOTI1NzgxIDQ0LjkxNzk2OSAzOS4wMTk1MzEgNDUuMjY1NjI1QzM5LjEwOTM3NSA0NS42MTcxODggMzkuMzgyODEzIDQ1Ljg5MDYyNSAzOS43MzQzNzUgNDUuOTgwNDY5QzQwLjA4MjAzMSA0Ni4wNzQyMTkgNDAuNDU3MDMxIDQ1Ljk2ODc1IDQwLjcwNzAzMSA0NS43MDcwMzFMNDguNDE0MDYzIDM4TDQwLjcwNzAzMSAzMC4yOTI5NjlDNDAuNTE5NTMxIDMwLjA5NzY1NiA0MC4yNjE3MTkgMjkuOTkyMTg4IDM5Ljk4ODI4MSAyOS45ODgyODFaIiAvPg0KPC9zdmc+"
    }]);
    css("#context-viewimage, #context-sendimage { display: none }");
};
// 保存图像
new function () {
    var groupMenu = GroupMenu({
        id: 'context-save-image',
        class: 'showText',
        label: locale.includes("zh-") ? '保存图像...' : 'Save image...',
        condition: 'image',
        insertBefore: 'context-saveimage'
    });
    groupMenu([{
        label: locale.includes("zh-") ? '保存图像' : 'Save image',
        oncommand: 'document.getElementById("context-saveimage").doCommand();',
        accesskey: 'v',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMS40MDQgMy45NDggQyAxLjQwNCAzLjIxMiAxLjcwMiAyLjU0NSAyLjE4NSAyLjA2MyBDIDIuNjY3IDEuNTggMy4zMzQgMS4yODIgNC4wNyAxLjI4MiBMIDguODk5IDEuMjgyIEwgMTMuNzI4IDEuMjgyIEMgMTQuMTQ2IDEuMjgyIDE0LjU1NSAxLjM2NSAxNC45MzQgMS41MjIgQyAxNS4zMTMgMS42NzggMTUuNjYxIDEuOTA5IDE1Ljk1NyAyLjIwNSBMIDE2Ljk0MyAzLjE5MSBMIDE3LjkyOSA0LjE3NyBDIDE4LjIyNSA0LjQ3MyAxOC40NTYgNC44MjEgMTguNjEzIDUuMiBDIDE4Ljc2OSA1LjU3OSAxOC44NTIgNS45ODggMTguODUyIDYuNDA2IEwgMTguODUyIDExLjIzNSBMIDE4Ljg1MiAxNi4wNjQgQyAxOC44NTIgMTYuODAxIDE4LjU1NCAxNy40NjcgMTguMDcxIDE3Ljk0OSBDIDE3LjU4OSAxOC40MzIgMTYuOTIyIDE4LjczIDE2LjE4NiAxOC43MyBMIDEwLjEyOCAxOC43MyBMIDQuMDcgMTguNzMgQyAzLjMzNCAxOC43MyAyLjY2NyAxOC40MzIgMi4xODUgMTcuOTQ5IEMgMS43MDIgMTcuNDY3IDEuNDA0IDE2LjggMS40MDQgMTYuMDY0IEwgMS40MDQgMTAuMDA2IFogTSA0LjA3IDIuNzM2IEMgMy43MzYgMi43MzYgMy40MzMgMi44NzIgMy4yMTMgMy4wOTEgQyAyLjk5NCAzLjMxMSAyLjg1OCAzLjYxNCAyLjg1OCAzLjk0OCBMIDIuODU4IDEwLjAwNiBMIDIuODU4IDE2LjA2NCBDIDIuODU4IDE2LjM5OSAyLjk5NCAxNi43MDIgMy4yMTMgMTYuOTIxIEMgMy40MzMgMTcuMTQgMy43MzYgMTcuMjc2IDQuMDcgMTcuMjc2IEwgNC4xOTEgMTcuMjc2IEwgNC4zMTIgMTcuMjc2IEwgNC4zMTIgMTQuNzMyIEwgNC4zMTIgMTIuMTg3IEMgNC4zMTIgMTEuNTg1IDQuNTU2IDExLjAzOSA0Ljk1MSAxMC42NDUgQyA1LjM0NSAxMC4yNSA1Ljg5MSAxMC4wMDYgNi40OTMgMTAuMDA2IEwgMTAuMTI4IDEwLjAwNiBMIDEzLjc2MyAxMC4wMDYgQyAxNC4zNjYgMTAuMDA2IDE0LjkxMSAxMC4yNSAxNS4zMDUgMTAuNjQ1IEMgMTUuNyAxMS4wMzkgMTUuOTQ0IDExLjU4NSAxNS45NDQgMTIuMTg3IEwgMTUuOTQ0IDE0LjczMiBMIDE1Ljk0NCAxNy4yNzYgTCAxNi4wNjUgMTcuMjc2IEwgMTYuMTg2IDE3LjI3NiBDIDE2LjUyMSAxNy4yNzYgMTYuODI0IDE3LjE0IDE3LjA0MyAxNi45MjEgQyAxNy4yNjIgMTYuNzAyIDE3LjM5OCAxNi4zOTkgMTcuMzk4IDE2LjA2NCBMIDE3LjM5OCAxMS4yMzUgTCAxNy4zOTggNi40MDYgQyAxNy4zOTggNi4xODEgMTcuMzU0IDUuOTYgMTcuMjY5IDUuNzU2IEMgMTcuMTg1IDUuNTUyIDE3LjA2MSA1LjM2NSAxNi45MDEgNS4yMDYgTCAxNS45MTUgNC4yMiBMIDE0LjkyOCAzLjIzMyBDIDE0LjgwMyAzLjEwOCAxNC42NiAzLjAwMyAxNC41MDQgMi45MjMgQyAxNC4zNDggMi44NDMgMTQuMTggMi43ODcgMTQuMDA1IDIuNzU4IEwgMTQuMDA1IDQuMDggTCAxNC4wMDUgNS40MDIgQyAxNC4wMDUgNi4wMDQgMTMuNzYxIDYuNTQ5IDEzLjM2NiA2Ljk0NCBDIDEyLjk3MiA3LjMzOSAxMi40MjcgNy41ODMgMTEuODI0IDcuNTgzIEwgOS42NDMgNy41ODMgTCA3LjQ2MiA3LjU4MyBDIDYuODYgNy41ODMgNi4zMTQgNy4zMzkgNS45MiA2Ljk0NCBDIDUuNTI1IDYuNTQ5IDUuMjgxIDYuMDA0IDUuMjgxIDUuNDAyIEwgNS4yODEgNC4wNjkgTCA1LjI4MSAyLjczNiBMIDQuNjc2IDIuNzM2IFogTSAxNC40OSAxNy4yNzYgTCAxNC40OSAxNC43MzIgTCAxNC40OSAxMi4xODcgQyAxNC40OSAxMS45ODcgMTQuNDA5IDExLjgwNSAxNC4yNzcgMTEuNjczIEMgMTQuMTQ1IDExLjU0MiAxMy45NjQgMTEuNDYgMTMuNzYzIDExLjQ2IEwgMTAuMTI4IDExLjQ2IEwgNi40OTMgMTEuNDYgQyA2LjI5MyAxMS40NiA2LjExMSAxMS41NDIgNS45NzkgMTEuNjczIEMgNS44NDggMTEuODA1IDUuNzY2IDExLjk4NyA1Ljc2NiAxMi4xODcgTCA1Ljc2NiAxNC43MzIgTCA1Ljc2NiAxNy4yNzYgTCAxMC4xMjggMTcuMjc2IFogTSA2LjczNSAyLjczNiBMIDYuNzM1IDQuMDY5IEwgNi43MzUgNS40MDIgQyA2LjczNSA1LjYwMyA2LjgxNyA1Ljc4NCA2Ljk0OCA1LjkxNiBDIDcuMDggNi4wNDcgNy4yNjIgNi4xMjkgNy40NjIgNi4xMjkgTCA5LjY0MyA2LjEyOSBMIDExLjgyNCA2LjEyOSBDIDEyLjAyNSA2LjEyOSAxMi4yMDcgNi4wNDcgMTIuMzM4IDUuOTE2IEMgMTIuNDcgNS43ODQgMTIuNTUxIDUuNjAzIDEyLjU1MSA1LjQwMiBMIDEyLjU1MSA0LjA2OSBMIDEyLjU1MSAyLjczNiBMIDkuNjQzIDIuNzM2IFoiIHN0eWxlPSIiLz4KPC9zdmc+",
    }, {
        label: '设为背景',
        oncommand: 'document.getElementById("context-setDesktopBackground").doCommand();',
        accesskey: 'S',
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0xMi4yODYgNS4zMjFhMS42MDggMS42MDggMCAxIDEtMy4yMTYgMCAxLjYwOCAxLjYwOCAwIDAgMSAzLjIxNiAwWm0tMS4wNzIgMGEuNTM2LjUzNiAwIDEgMC0xLjA3MS4wMDEuNTM2LjUzNiAwIDAgMCAxLjA3MS0uMDAxWk0uNSAzLjcxNEEzLjIxNCAzLjIxNCAwIDAgMSAzLjcxNC41aDguNTcyQTMuMjE0IDMuMjE0IDAgMCAxIDE1LjUgMy43MTR2OC41NzJhMy4yMTQgMy4yMTQgMCAwIDEtMy4yMTQgMy4yMTRIMy43MTRBMy4yMTQgMy4yMTQgMCAwIDEgLjUgMTIuMjg2VjMuNzE0Wm0zLjIxNC0yLjE0M2MtMS4xODMgMC0yLjE0My45Ni0yLjE0MyAyLjE0M3Y4LjU3MmMwIC4zOTkuMTEuNzczLjMgMS4wOTNsNS4wMDMtNC45MTZhMS42MDUgMS42MDUgMCAwIDEgMi4yNTIgMGw1LjAwMyA0LjkxNmMuMTktLjMyLjMtLjY5NC4zLTEuMDkzVjMuNzE0YzAtMS4xODMtLjk2LTIuMTQzLTIuMTQzLTIuMTQzSDMuNzE0Wm0wIDEyLjg1OGg4LjU3MmMuMzk1IDAgLjc2Ni0uMTA4IDEuMDg0LS4yOTRMOC4zNzUgOS4yMjdhLjUzNC41MzQgMCAwIDAtLjc1IDBMMi42MyAxNC4xMzVjLjMxOC4xODYuNjg5LjI5NCAxLjA4NC4yOTRaIi8+Cjwvc3ZnPgo="
    }]);
    css("#context-saveimage, #context-setDesktopBackground, #context-sep-setbackground { display: none }");
};
// 复制图像
page([{
    label: "复制 SVG Base64",
    insertBefore: "context-viewimageinfo",
    condition: "normal",
    class: "copy",
    text: "%SVG_BASE64%",
    onshowing: function (item) {
        let uri = gBrowser.currentURI.spec;
        if (!uri.endsWith(".svg")) {
            item.hidden = true;
        } else {
            item.hidden = false;
        }
    }
}]);
new function () {
    var groupMenu = GroupMenu({
        id: 'context-copy-image',
        class: 'showFirstText',
        label: locale.includes("zh-") ? '复制图像...' : 'Copy image...',
        condition: 'image',
        insertBefore: 'context-copyimage-contents',
        onshowing: function (item) {
            item.hidden = item.firstChild.hidden;
        }
    });
    groupMenu([{
        command: 'context-copyimage-contents',
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBzdHlsZT0iZmlsbDpjb250ZXh0LWZpbGw7ZmlsbC1vcGFjaXR5OmNvbnRleHQtZmlsbC1vcGFjaXR5IiBkPSJNNiAwYTIgMiAwIDAgMC0yIDJ2LjVhLjUuNSAwIDAgMCAxIDBWMmExIDEgMCAwIDEgMS0xaC41YS41LjUgMCAwIDAgMC0xSDZ6bTIuNSAwYS41LjUgMCAwIDAgMCAxaDNhLjUuNSAwIDAgMCAwLTFoLTN6bTUgMGEuNS41IDAgMCAwIDAgMWguNWExIDEgMCAwIDEgMSAxdi41YS41LjUgMCAwIDAgMSAwVjJhMiAyIDAgMCAwLTItMmgtLjV6TTIgNGEyIDIgMCAwIDAtMiAydjYuNUEzLjUgMy41IDAgMCAwIDMuNSAxNkgxMGEyIDIgMCAwIDAgMi0ydi0xaC0xdjFhMSAxIDAgMCAxLTEgMUgzLjVBMi41IDIuNSAwIDAgMSAxIDEyLjVWNmExIDEgMCAwIDEgMS0xaDFWNEgyem0yLjUgMGEuNS41IDAgMCAwLS41LjV2M2EuNS41IDAgMCAwIDEgMHYtM2EuNS41IDAgMCAwLS41LS41em0xMSAwYS41LjUgMCAwIDAtLjUuNXYzYS41LjUgMCAwIDAgMSAwdi0zYS41LjUgMCAwIDAtLjUtLjV6bS0xMSA1YS41LjUgMCAwIDAtLjUuNXYuNWEyIDIgMCAwIDAgMiAyaC41YS41LjUgMCAwIDAgMC0xSDZhMSAxIDAgMCAxLTEtMXYtLjVhLjUuNSAwIDAgMC0uNS0uNXptMTEgMGEuNS41IDAgMCAwLS41LjV2LjVhMSAxIDAgMCAxLTEgMWgtLjVhLjUuNSAwIDAgMCAwIDFoLjVhMiAyIDAgMCAwIDItMnYtLjVhLjUuNSAwIDAgMC0uNS0uNXptLTcgMmEuNS41IDAgMCAwIDAgMWgzYS41LjUgMCAwIDAgMC0xaC0zeiIvPgo8L3N2Zz4K"
    }, {
        label: '图像链接',
        text: '%IMAGE_URL%',
        accesskey: 'O',
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPgogIDxwYXRoIGQ9Ik02IDdDMy4yMzkgNyAxIDkuMjM5IDEgMTJDMSAxNC43NjEgMy4yMzkgMTcgNiAxN0wxMCAxN0wxMCAxNUw2IDE1QzQuMzQzIDE1IDMgMTMuNjU3IDMgMTJDMyAxMC4zNDMgNC4zNDMgOSA2IDlMMTAgOUwxMCA3TDYgNyB6IE0gMTQgN0wxNCA5TDE4IDlDMTkuNjU3IDkgMjEgMTAuMzQzIDIxIDEyQzIxIDEzLjY1NyAxOS42NTcgMTUgMTggMTVMMTQgMTVMMTQgMTdMMTggMTdDMjAuNzYxIDE3IDIzIDE0Ljc2MSAyMyAxMkMyMyA5LjIzOSAyMC43NjEgNyAxOCA3TDE0IDcgeiBNIDcgMTFMNyAxM0wxNyAxM0wxNyAxMUw3IDExIHoiIC8+Cjwvc3ZnPg=="
    }, {
        label: '复制图像base64',
        text: "%IMAGE_BASE64%",
        condition: "image",
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTUgNUw1IDI3TDI3IDI3TDI3IDUgWiBNIDcgN0wyNSA3TDI1IDI1TDcgMjUgWiBNIDEzLjIxODc1IDExLjkzNzVMMTEuMDMxMjUgMTQuNDY4NzVDMTAuMzc1IDE1LjIyMjY1NiAxMCAxNi4xODc1IDEwIDE3LjE4NzVMMTAgMTcuNUMxMCAxOC44NjcxODggMTEuMTMyODEzIDIwIDEyLjUgMjBMMTMuNSAyMEMxNC44NjcxODggMjAgMTYgMTguODY3MTg4IDE2IDE3LjVDMTYgMTYuMTMyODEzIDE0Ljg2NzE4OCAxNSAxMy41IDE1TDEzLjIxODc1IDE1TDE0LjcxODc1IDEzLjI1IFogTSAyMCAxMkwyMCAxNUwxOSAxNUwxOSAxMi4wMzEyNUwxNyAxMi4wMzEyNUwxNyAxN0wyMCAxN0wyMCAyMEwyMiAyMEwyMiAxMiBaIE0gMTIuMDYyNSAxN0wxMy41IDE3QzEzLjc4NTE1NiAxNyAxNCAxNy4yMTQ4NDQgMTQgMTcuNUMxNCAxNy43ODUxNTYgMTMuNzg1MTU2IDE4IDEzLjUgMThMMTIuNSAxOEMxMi4yMTQ4NDQgMTggMTIgMTcuNzg1MTU2IDEyIDE3LjVMMTIgMTcuMTg3NUMxMiAxNy4xMjEwOTQgMTIuMDU0Njg4IDE3LjA2NjQwNiAxMi4wNjI1IDE3WiIgLz4NCjwvc3ZnPg=="
    }]);
    css("#context-copyimage-contents, #context-copyimage { display: none }");
};
// 搜索图像
new function () {
    var items = [{
        label: locale.includes("zh-") ? "以图搜图" : "Search image",
        image: "chrome://global/skin/icons/search-glass.svg",
        accesskey: "D",
        oncommand: "this.nextSibling.click();"
    }, {
        label: locale.includes("zh-") ? '谷歌搜图' : 'Google',
        where: 'tab',
        condition: 'image',
        url: "https://lens.google.com/uploadbyurl?url=%IMAGE_URL%",
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA0OCA0OCI+DQogIDxwYXRoIGZpbGw9IiNGRkMxMDciIGQ9Ik00My42MTEsMjAuMDgzSDQyVjIwSDI0djhoMTEuMzAzYy0xLjY0OSw0LjY1Ny02LjA4LDgtMTEuMzAzLDhjLTYuNjI3LDAtMTItNS4zNzMtMTItMTJjMC02LjYyNyw1LjM3My0xMiwxMi0xMmMzLjA1OSwwLDUuODQyLDEuMTU0LDcuOTYxLDMuMDM5bDUuNjU3LTUuNjU3QzM0LjA0Niw2LjA1MywyOS4yNjgsNCwyNCw0QzEyLjk1NSw0LDQsMTIuOTU1LDQsMjRjMCwxMS4wNDUsOC45NTUsMjAsMjAsMjBjMTEuMDQ1LDAsMjAtOC45NTUsMjAtMjBDNDQsMjIuNjU5LDQzLjg2MiwyMS4zNSw0My42MTEsMjAuMDgzeiIvPg0KICA8cGF0aCBmaWxsPSIjRkYzRDAwIiBkPSJNNi4zMDYsMTQuNjkxbDYuNTcxLDQuODE5QzE0LjY1NSwxNS4xMDgsMTguOTYxLDEyLDI0LDEyYzMuMDU5LDAsNS44NDIsMS4xNTQsNy45NjEsMy4wMzlsNS42NTctNS42NTdDMzQuMDQ2LDYuMDUzLDI5LjI2OCw0LDI0LDRDMTYuMzE4LDQsOS42NTYsOC4zMzcsNi4zMDYsMTQuNjkxeiIvPg0KICA8cGF0aCBmaWxsPSIjNENBRjUwIiBkPSJNMjQsNDRjNS4xNjYsMCw5Ljg2LTEuOTc3LDEzLjQwOS01LjE5MmwtNi4xOS01LjIzOEMyOS4yMTEsMzUuMDkxLDI2LjcxNSwzNiwyNCwzNmMtNS4yMDIsMC05LjYxOS0zLjMxNy0xMS4yODMtNy45NDZsLTYuNTIyLDUuMDI1QzkuNTA1LDM5LjU1NiwxNi4yMjcsNDQsMjQsNDR6Ii8+DQogIDxwYXRoIGZpbGw9IiMxOTc2RDIiIGQ9Ik00My42MTEsMjAuMDgzSDQyVjIwSDI0djhoMTEuMzAzYy0wLjc5MiwyLjIzNy0yLjIzMSw0LjE2Ni00LjA4Nyw1LjU3MWMwLjAwMS0wLjAwMSwwLjAwMi0wLjAwMSwwLjAwMy0wLjAwMmw2LjE5LDUuMjM4QzM2Ljk3MSwzOS4yMDUsNDQsMzQsNDQsMjRDNDQsMjIuNjU5LDQzLjg2MiwyMS4zNSw0My42MTEsMjAuMDgzeiIvPg0KPC9zdmc+",
    }, {
        label: locale.includes("zh-") ? 'Yandex搜图' : 'Yandex',
        where: 'tab',
        condition: 'image',
        url: "https://yandex.com/images/search?source=collections&url=%IMAGE_URL%&rpt=imageview",
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABI0lEQVQ4jZ3OvUrDYBjF8f8m6FbBltJakyZv0i9BXBxcnJ3ES3DyAoRugkWr96Gbm1chuLgVFxGkWhDphxbSkhyXClJoTfOOz/uc33Mg5htanMhDcqjPXBrb7Mrn8BFWpv8iw3NURG8ZKjOB0KUhH3WzHP2dBzlqKqGRzc3cmu0s6zIoMtxPNWvKIBXYmwsAvFrcqYT6S3i/Mxm6nxZf/4YBnjLsq4YGBc4A6stsq4w+HJqxgMnFYduhB9DJcKkyeljFjw28p2mogkYpdrRBa+zRih0G6KSxQ4Pk8iIPDdY4XggA+Ha4lUHy6fVypBYG+mscqIyCHNcLhwGCPFX5KMhzkQyw2IwcJMN5YkAuCosJgVGBrQlwlaxBkapcFNqcztv7Ae/0dba36CN6AAAAAElFTkSuQmCC"
    }, {
        label: locale.includes("zh-") ? 'TinEye搜图' : 'TinEye',
        where: 'tab',
        condition: 'image',
        url: "https://www.tineye.com/search?url=%IMAGE_URL%",
        image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik0xMiA0QzQgNCAxIDEyIDEgMTJDMSAxMiA0IDIwIDEyIDIwQzIwIDIwIDIzIDEyIDIzIDEyQzIzIDEyIDIwIDQgMTIgNCB6IE0gMTIgNkMxNy4yNzYgNiAxOS45NDQ1OTQgMTAuMjY3MDk0IDIwLjgwODU5NCAxMS45OTYwOTRDMTkuOTQzNTk0IDEzLjcxMzA5NCAxNy4yNTUgMTggMTIgMThDNi43MjQgMTggNC4wNTU0MDYyIDEzLjczMjkwNiAzLjE5MTQwNjIgMTIuMDAzOTA2QzQuMDU3NDA2MiAxMC4yODY5MDYgNi43NDUgNiAxMiA2IHogTSAxMiA4QzkuNzkxIDggOCA5Ljc5MSA4IDEyQzggMTQuMjA5IDkuNzkxIDE2IDEyIDE2QzE0LjIwOSAxNiAxNiAxNC4yMDkgMTYgMTJDMTYgOS43OTEgMTQuMjA5IDggMTIgOCB6IE0gMTIgMTBDMTMuMTA1IDEwIDE0IDEwLjg5NSAxNCAxMkMxNCAxMy4xMDUgMTMuMTA1IDE0IDEyIDE0QzEwLjg5NSAxNCAxMCAxMy4xMDUgMTAgMTJDMTAgMTAuODk1IDEwLjg5NSAxMCAxMiAxMCB6Ii8+PC9zdmc+"
    }, {
        label: locale.includes("zh-") ? '解析二维码' : 'Parse QR code',
        where: 'tab',
        condition: 'image',
        url: "https://zxing.org/w/decode?u=%IMAGE_URL%",
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAHOUlEQVRYhb2XS0xT2xrHFwGDidFEAxMIAwfiQGOMjnyAr0gcmHDPQBM9MTExKviIRnRAAhqVEyImngmkEoOCkUSDGOUmwLFG8QH4aC3t3qUtbSl9QEtLA7ZFpAV+d1C6LQrqfZy7m1+/tf7f/1vrS/bOfgiRdABHme+YmQ0zM7NxVlIGMDM7SP6PxxnlxwwwNXVUzHdMT0/z/2TO5rHYFLFYjNhUjKlYjMR8aiqOMo8l8j9g6uv4q3fqO89ULBZvIhqNHo1Go/ydvH79mpaWFp4/f050cjI5d1R8+fKFnzP5C57vefXqFQMDA6xZswYhBEIIXr16leyJiYmJCf5TPk9MMDHxeTZOMPE5Hv2BAJ2dnQgh8Pv9rFu3Tmng8ePHiv/z5wnE+Pg4/0tcLhfj4+NYLBalAZ1Ox5s3bzh16hR5eXn4fD7FL8KRCJFIhEg4OYYJRyKEw/F5OBwmEgkTCYeVeZwI4UiYSCQenU4njx494tKlS0oDw/5hzp8/z/79+ykqKkKlUtHR0aHUi1AoRDKfPn1CkiT++KOCzZs3sXbtWjZv3kxvby/Pnj3D7/fzbU0oFMLpdNLZ2UllZSX5+flKAyUlJRQXF5Obm8vhw4exWCxcuHABl8tFKBRCfBobY2yWYDDI7du32b17N7t27ZpDIBDg5MmT1NfXMzg4iMvlwmKxcPfuXex2O42NjZSWlnLgwAHy8/Nxu91KbU9PDxUVFVRVVdHd3c2uXbtob29nbGwMMTo6SoKBgQFsNhvBYFC5CUajUWRZRpZlwuEwHo+HoaEhAKxWK0IIfD4fACdOnGDp0qXk5eUp9UajkVAoBMDIyAj9/f1Eo1FevnyJz+dDBINBgsEgGo2GoaEh1q9fT3V1tbKAw+FQruDW1lYOHTpEUVHRvA0AVFZWzmkgNTWVO3fuYLfbuXLlCps2bcLpdCKEoL6+HhEIjDAyMkJtba2yUXID09PTBINB0tPTEUJQUVFBWVkZQgiWL19OMBhUnhEHDx5U1kiQnZ2N3W4nEAhgNBpRqVRKrr29HeH3+/H7/ZSXl9PS0sKqVauUBp4+fUpubi65ubmkpKQghCAzM5OMjAyEEKSmpir53Nxcli1bRmFhIZ2dndy/f5+0tDQePHhAYg+/349er6e+vp6bN2/i9/sRPp8Pn8/HkydPCIfDNDU1IcsyAP39/ahUKlQqFYsWLeLUqVOoVCoKCwsRQrBkyRIln5OTgxCCY8eO8f79e/bs2UNJSQmJ9RdCeL1evF4vPp+PGzduYLPZAHjx4gVlZWUKx48f5+zZs3R2dvL06VPOnDlDUVERZWVlhMNhrl+/zurVq9mwYQP79u1DCMGjR4/wer14h7wMzUavNz4eGhrCO+RFDA4OotPpaGxs5MSJE1RVVdHU1MS5c+fYsWOHQiAQoLi4mKamJkwmEx0dHXg8Hnbs2EFdXR3Dw8NzroGVK1ficDgYHBz8IcLj8fDixQuysrL46692du/eTVZWFqWlpYyNjaHX67/j9OnTbNy4UTlVaWlpqNVqpYGMjAy6urpwu91JePC43Xg8Htxuj6ILs8nM6Ogo09PTaLVaACYnJ3G5XDQ3NyOEYMuWLVy9epXMzMw5V/iKFSuYnJxk8eLFcxo4fvw4LpfrlxDv3r2jtbWVbdu2sXfvXtRqNQ0NDTx7pqa5uZkVK1bQ3d3NwMAAFouF2tpaSkpKlNNlNBoxmUxEo1FCoRBlZWW0tbUxMDDwS4i+vj7evX2HRqPh5cuX7Ny5k7q6OkpKSsjOzubw4cM4HI4k+r+ZO3C73cp9Q6/Xf5d3OPpx9H+rxRF2ux273Y5erwegoaEBtVrNhw8fqKmpobm5mYRnIcrLy5EkCQCTyfRTfzLCZrNis1mRJIny8nLq6+uRjTLXrl2jvLycf7a0YLNZsVptWK2z0WadHVux2mwUFBSgVquZnp5Gp9PNem3YlJqE15qUi2uir6+Pvr4+LBYLeXl5VFdX09fXx6VLl9i+fTu3bt0i4VmIkydP0tHRQVdX10+93yLMFjNmsxmTycTw8DCybMRsNmMwGLBabTidTsxms4LFbMZsscSj2YzZYsbpdNLd/ZbLly/P8f4KwmQyYTKZ6DX2Mjw8jCRJJLSHDx/icDioq6tTtPlwu1wcOXKEvK15X/Xehf0mk4ne2SiMRiNGoxFZlhkcHOTevXsktI8fP2IwGMjJyeHt27eKnowsy6Snp9PQ0MC5c+fQ6XTz+hZCxF82JCRZwm63s3XrVnS6j8hSXG9rayMlJQWtVotW+xFJlpBkGVmSlBeVlpYWNBoNv/32DwoKCuK6lECKry/F6+IxrhkkKSYMBsNRg8GAwWBAo9FQU1ODVqsloRkMBv788wYajQaNRjNHT67TarVcvHiR338/OK9nAeLfiT09evQ9PfT06GfpUdDre5LmX3P6b7wL1f+IOd+HOp2O/5aP/4Z33i/k+Hn++0ne818wW8F9OkLXLgAAAABJRU5ErkJggg=="
    }];
    var menu = GroupMenu({
        id: 'addMenu-search-image',
        class: 'showFirstText',
        label: locale.includes("zh-") ? "以图搜图..." : "Search image...",
        insertBefore: "context-searchselect",
        condition: 'image',
    });
    menu(items);
};
// 图像右键菜单 End ==============================================================
// 文本右键菜单 Start ============================================================
new function () {
    var groupMenu = new GroupMenu({
        class: 'showFirstText',
        condition: 'select',
        insertAfter: 'context-copy',
        onshowing: function (item) {
            document.getElementById("context-print-selection-new").setAttribute("tooltiptext", document.getElementById("context-print-selection-new").label);
            document.getElementById("context-viewpartialsource-selection-new").setAttribute("tooltiptext", document.getElementById("context-viewpartialsource-selection-new").label);
            item.removeAttribute("onshowing");
        },
    });
    groupMenu([{
        'data-l10n-href': 'textActions.ftl',
        'data-l10n-id': 'text-action-copy',
        tooltiptext: locale.includes("zh-") ? '左键：复制\nShift + 左键：复制存文本' : 'Left click: copy content\nShift + Left click: copy plain text',
        class: 'copy',
        oncommand: function (event) {
            if (event.button === 0) {
                if (event.shiftKey)
                    addMenu.copy(addMenu.convertText("%s"));
                else
                    document.getElementById('cmd_copy').doCommand();
            }
        }
    }, {
        label: locale.includes("zh-") ? '保存文本' : 'Save slected text quickly',
        tooltiptext: locale.includes("zh-") ? '左键：快速保存选定文本\n中键：快速保存选定文本并打开' : 'Left click: save slected text quickly\nMiddle click: save selected text quickly and open it',
        style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMS40MDQgMy45NDggQyAxLjQwNCAzLjIxMiAxLjcwMiAyLjU0NSAyLjE4NSAyLjA2MyBDIDIuNjY3IDEuNTggMy4zMzQgMS4yODIgNC4wNyAxLjI4MiBMIDguODk5IDEuMjgyIEwgMTMuNzI4IDEuMjgyIEMgMTQuMTQ2IDEuMjgyIDE0LjU1NSAxLjM2NSAxNC45MzQgMS41MjIgQyAxNS4zMTMgMS42NzggMTUuNjYxIDEuOTA5IDE1Ljk1NyAyLjIwNSBMIDE2Ljk0MyAzLjE5MSBMIDE3LjkyOSA0LjE3NyBDIDE4LjIyNSA0LjQ3MyAxOC40NTYgNC44MjEgMTguNjEzIDUuMiBDIDE4Ljc2OSA1LjU3OSAxOC44NTIgNS45ODggMTguODUyIDYuNDA2IEwgMTguODUyIDExLjIzNSBMIDE4Ljg1MiAxNi4wNjQgQyAxOC44NTIgMTYuODAxIDE4LjU1NCAxNy40NjcgMTguMDcxIDE3Ljk0OSBDIDE3LjU4OSAxOC40MzIgMTYuOTIyIDE4LjczIDE2LjE4NiAxOC43MyBMIDEwLjEyOCAxOC43MyBMIDQuMDcgMTguNzMgQyAzLjMzNCAxOC43MyAyLjY2NyAxOC40MzIgMi4xODUgMTcuOTQ5IEMgMS43MDIgMTcuNDY3IDEuNDA0IDE2LjggMS40MDQgMTYuMDY0IEwgMS40MDQgMTAuMDA2IFogTSA0LjA3IDIuNzM2IEMgMy43MzYgMi43MzYgMy40MzMgMi44NzIgMy4yMTMgMy4wOTEgQyAyLjk5NCAzLjMxMSAyLjg1OCAzLjYxNCAyLjg1OCAzLjk0OCBMIDIuODU4IDEwLjAwNiBMIDIuODU4IDE2LjA2NCBDIDIuODU4IDE2LjM5OSAyLjk5NCAxNi43MDIgMy4yMTMgMTYuOTIxIEMgMy40MzMgMTcuMTQgMy43MzYgMTcuMjc2IDQuMDcgMTcuMjc2IEwgNC4xOTEgMTcuMjc2IEwgNC4zMTIgMTcuMjc2IEwgNC4zMTIgMTQuNzMyIEwgNC4zMTIgMTIuMTg3IEMgNC4zMTIgMTEuNTg1IDQuNTU2IDExLjAzOSA0Ljk1MSAxMC42NDUgQyA1LjM0NSAxMC4yNSA1Ljg5MSAxMC4wMDYgNi40OTMgMTAuMDA2IEwgMTAuMTI4IDEwLjAwNiBMIDEzLjc2MyAxMC4wMDYgQyAxNC4zNjYgMTAuMDA2IDE0LjkxMSAxMC4yNSAxNS4zMDUgMTAuNjQ1IEMgMTUuNyAxMS4wMzkgMTUuOTQ0IDExLjU4NSAxNS45NDQgMTIuMTg3IEwgMTUuOTQ0IDE0LjczMiBMIDE1Ljk0NCAxNy4yNzYgTCAxNi4wNjUgMTcuMjc2IEwgMTYuMTg2IDE3LjI3NiBDIDE2LjUyMSAxNy4yNzYgMTYuODI0IDE3LjE0IDE3LjA0MyAxNi45MjEgQyAxNy4yNjIgMTYuNzAyIDE3LjM5OCAxNi4zOTkgMTcuMzk4IDE2LjA2NCBMIDE3LjM5OCAxMS4yMzUgTCAxNy4zOTggNi40MDYgQyAxNy4zOTggNi4xODEgMTcuMzU0IDUuOTYgMTcuMjY5IDUuNzU2IEMgMTcuMTg1IDUuNTUyIDE3LjA2MSA1LjM2NSAxNi45MDEgNS4yMDYgTCAxNS45MTUgNC4yMiBMIDE0LjkyOCAzLjIzMyBDIDE0LjgwMyAzLjEwOCAxNC42NiAzLjAwMyAxNC41MDQgMi45MjMgQyAxNC4zNDggMi44NDMgMTQuMTggMi43ODcgMTQuMDA1IDIuNzU4IEwgMTQuMDA1IDQuMDggTCAxNC4wMDUgNS40MDIgQyAxNC4wMDUgNi4wMDQgMTMuNzYxIDYuNTQ5IDEzLjM2NiA2Ljk0NCBDIDEyLjk3MiA3LjMzOSAxMi40MjcgNy41ODMgMTEuODI0IDcuNTgzIEwgOS42NDMgNy41ODMgTCA3LjQ2MiA3LjU4MyBDIDYuODYgNy41ODMgNi4zMTQgNy4zMzkgNS45MiA2Ljk0NCBDIDUuNTI1IDYuNTQ5IDUuMjgxIDYuMDA0IDUuMjgxIDUuNDAyIEwgNS4yODEgNC4wNjkgTCA1LjI4MSAyLjczNiBMIDQuNjc2IDIuNzM2IFogTSAxNC40OSAxNy4yNzYgTCAxNC40OSAxNC43MzIgTCAxNC40OSAxMi4xODcgQyAxNC40OSAxMS45ODcgMTQuNDA5IDExLjgwNSAxNC4yNzcgMTEuNjczIEMgMTQuMTQ1IDExLjU0MiAxMy45NjQgMTEuNDYgMTMuNzYzIDExLjQ2IEwgMTAuMTI4IDExLjQ2IEwgNi40OTMgMTEuNDYgQyA2LjI5MyAxMS40NiA2LjExMSAxMS41NDIgNS45NzkgMTEuNjczIEMgNS44NDggMTEuODA1IDUuNzY2IDExLjk4NyA1Ljc2NiAxMi4xODcgTCA1Ljc2NiAxNC43MzIgTCA1Ljc2NiAxNy4yNzYgTCAxMC4xMjggMTcuMjc2IFogTSA2LjczNSAyLjczNiBMIDYuNzM1IDQuMDY5IEwgNi43MzUgNS40MDIgQyA2LjczNSA1LjYwMyA2LjgxNyA1Ljc4NCA2Ljk0OCA1LjkxNiBDIDcuMDggNi4wNDcgNy4yNjIgNi4xMjkgNy40NjIgNi4xMjkgTCA5LjY0MyA2LjEyOSBMIDExLjgyNCA2LjEyOSBDIDEyLjAyNSA2LjEyOSAxMi4yMDcgNi4wNDcgMTIuMzM4IDUuOTE2IEMgMTIuNDcgNS43ODQgMTIuNTUxIDUuNjAzIDEyLjU1MSA1LjQwMiBMIDEyLjU1MSA0LjA2OSBMIDEyLjU1MSAyLjczNiBMIDkuNjQzIDIuNzM2IFoiIHN0eWxlPSIiLz4KPC9zdmc+)',
        onclick: function (event) {
            const locale = addMenu.locale;
            const NetUtil = globalThis.NetUtil || Cu.import("resource://gre/modules/NetUtil.jsm").NetUtil;
            const FileUtils = globalThis.FileUtils || Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;

            var data = addMenu.convertText("%SEL%");

            var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
            fp.init(window, locale.includes("zh-") ? "另存为" : "Save as", Ci.nsIFilePicker.modeSave);
            fp.appendFilter(locale.includes("zh-") ? "文本文件" : "Text file", "*.txt");
            fp.defaultString = addMenu.convertText("%TITLES%") + '.txt';
            fp.open(res => {
                if (res != Ci.nsIFilePicker.returnOK) return;
                var aFile = fp.file;
                var ostream = FileUtils.openSafeFileOutputStream(aFile);
                var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
                converter.charset = "gbk";
                var istream = converter.convertToInputStream(data);
                NetUtil.asyncCopy(istream, ostream, function (status) {
                    if (!Components.isSuccessCode(status)) {
                        // Handle error!
                        return;
                    }
                    if (event.button == 1)
                        aFile.launch();
                });
            });
        }
    }, {
        id: 'context-print-selection-new',
        command: 'context-print-selection',
        'data-l10n-href': 'browserContext.ftl',
        'data-l10n-id': 'main-context-menu-print-selection',
        style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+DQogIDxwYXRoIGQ9Ik0xNi41IDVDMTQuMDMyNDk5IDUgMTIgNy4wMzI0OTkxIDEyIDkuNUwxMiAxMUwxMC41IDExQzYuOTI4MDYxOSAxMSA0IDEzLjkyODA2MiA0IDE3LjVMNCAzMS41QzQgMzMuOTY3NTAxIDYuMDMyNDk5MSAzNiA4LjUgMzZMMTIgMzZMMTIgMzguNUMxMiA0MC45Njc1MDEgMTQuMDMyNDk5IDQzIDE2LjUgNDNMMzEuNSA0M0MzMy45Njc1MDEgNDMgMzYgNDAuOTY3NTAxIDM2IDM4LjVMMzYgMzZMMzkuNSAzNkM0MS45Njc1MDEgMzYgNDQgMzMuOTY3NTAxIDQ0IDMxLjVMNDQgMTcuNUM0NCAxMy45MjgwNjIgNDEuMDcxOTM4IDExIDM3LjUgMTFMMzYgMTFMMzYgOS41QzM2IDcuMDMyNDk5MSAzMy45Njc1MDEgNSAzMS41IDVMMTYuNSA1IHogTSAxNi41IDhMMzEuNSA4QzMyLjM0NjQ5OSA4IDMzIDguNjUzNTAwOSAzMyA5LjVMMzMgMTFMMTUgMTFMMTUgOS41QzE1IDguNjUzNTAwOSAxNS42NTM1MDEgOCAxNi41IDggeiBNIDEwLjUgMTRMMzcuNSAxNEMzOS40NTAwNjIgMTQgNDEgMTUuNTQ5OTM4IDQxIDE3LjVMNDEgMzEuNUM0MSAzMi4zNDY0OTkgNDAuMzQ2NDk5IDMzIDM5LjUgMzNMMzYgMzNMMzYgMjkuNUMzNiAyNy4wMzI0OTkgMzMuOTY3NTAxIDI1IDMxLjUgMjVMMTYuNSAyNUMxNC4wMzI0OTkgMjUgMTIgMjcuMDMyNDk5IDEyIDI5LjVMMTIgMzNMOC41IDMzQzcuNjUzNTAwOSAzMyA3IDMyLjM0NjQ5OSA3IDMxLjVMNyAxNy41QzcgMTUuNTQ5OTM4IDguNTQ5OTM4MSAxNCAxMC41IDE0IHogTSAxNi41IDI4TDMxLjUgMjhDMzIuMzQ2NDk5IDI4IDMzIDI4LjY1MzUwMSAzMyAyOS41TDMzIDM4LjVDMzMgMzkuMzQ2NDk5IDMyLjM0NjQ5OSA0MCAzMS41IDQwTDE2LjUgNDBDMTUuNjUzNTAxIDQwIDE1IDM5LjM0NjQ5OSAxNSAzOC41TDE1IDI5LjVDMTUgMjguNjUzNTAxIDE1LjY1MzUwMSAyOCAxNi41IDI4IHoiIC8+DQo8L3N2Zz4=)',
    }, {
        id: 'context-viewpartialsource-selection-new',
        'data-l10n-href': 'browserContext.ftl',
        'data-l10n-id': "main-context-menu-view-selection-source",
        command: 'context-viewpartialsource-selection',
        style: 'list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzAgMzAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTE1IDJDOC4zODQ0MjM5IDIgMyA3LjM4NDQyODcgMyAxNEMzIDIwLjYxNTU3MSA4LjM4NDQyMzkgMjYgMTUgMjZMMjUgMjZDMjYuMTA1IDI2IDI3IDI1LjEwNSAyNyAyNEwyNyAxNEMyNyA3LjM4NDQyODcgMjEuNjE1NTc2IDIgMTUgMiB6IE0gMTUgNEMyMC41MzQ2OTcgNCAyNSA4LjQ2NTMwNyAyNSAxNEMyNSAxOS41MzQ2OTMgMjAuNTM0Njk3IDI0IDE1IDI0QzkuNDY1MzAzNCAyNCA1IDE5LjUzNDY5MyA1IDE0QzUgOC40NjUzMDcgOS40NjUzMDM0IDQgMTUgNCB6IE0gMTUuOTUzMTI1IDYuOTg2MzI4MSBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMTUuMDEzNjcyIDcuODM1OTM3NUwxMy4wMTM2NzIgMTkuODM1OTM4IEEgMS4wMDAxIDEuMDAwMSAwIDEgMCAxNC45ODYzMjggMjAuMTY0MDYyTDE2Ljk4NjMyOCA4LjE2NDA2MjUgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDE1Ljk1MzEyNSA2Ljk4NjMyODEgeiBNIDEwLjk4MDQ2OSA5Ljk4ODI4MTIgQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDEwLjE2Nzk2OSAxMC40NDUzMTJMOC4xNjc5Njg4IDEzLjQ0NTMxMiBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgOC4xNjc5Njg4IDE0LjU1NDY4OEwxMC4xNjc5NjkgMTcuNTU0Njg4IEEgMS4wMDAxIDEuMDAwMSAwIDEgMCAxMS44MzIwMzEgMTYuNDQ1MzEyTDEwLjIwMTE3MiAxNEwxMS44MzIwMzEgMTEuNTU0Njg4IEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAxMC45ODA0NjkgOS45ODgyODEyIHogTSAxOC45ODgyODEgOS45ODgyODEyIEEgMS4wMDAxIDEuMDAwMSAwIDAgMCAxOC4xNjc5NjkgMTEuNTU0Njg4TDE5Ljc5ODgyOCAxNEwxOC4xNjc5NjkgMTYuNDQ1MzEyIEEgMS4wMDAxIDEuMDAwMSAwIDEgMCAxOS44MzIwMzEgMTcuNTU0Njg4TDIxLjgzMjAzMSAxNC41NTQ2ODggQSAxLjAwMDEgMS4wMDAxIDAgMCAwIDIxLjgzMjAzMSAxMy40NDUzMTJMMTkuODMyMDMxIDEwLjQ0NTMxMiBBIDEuMDAwMSAxLjAwMDEgMCAwIDAgMTguOTg4MjgxIDkuOTg4MjgxMiB6IiAvPg0KPC9zdmc+)'
    }]);
    css("#context-copy, #context-print-selection, #context-viewpartialsource-selection, #context-sep-selectall { visibility: collapse }");
}
// 搜索文本
new function () {
    var items = [{
        id: 'addMenu-sitesearch-insertpoint',
        label: 'separator',
    }, {
        label: locale.includes("zh-") ? '生成二维码' : 'Generate QR code',
        where: 'tab',
        url: "https://my.tv.sohu.com/user/a/wvideo/getQRCode.do?text=%s",
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTMgM0wzIDlMOSA5TDkgM0wzIDMgeiBNIDExIDNMMTEgNUwxMyA1TDEzIDNMMTEgMyB6IE0gMTUgM0wxNSA5TDIxIDlMMjEgM0wxNSAzIHogTSA1IDVMNyA1TDcgN0w1IDdMNSA1IHogTSAxNyA1TDE5IDVMMTkgN0wxNyA3TDE3IDUgeiBNIDExIDdMMTEgOUwxMyA5TDEzIDdMMTEgNyB6IE0gMyAxMUwzIDEzTDUgMTNMNSAxMUwzIDExIHogTSA3IDExTDcgMTNMOSAxM0w5IDExTDcgMTEgeiBNIDExIDExTDExIDEzTDEzIDEzTDEzIDExTDExIDExIHogTSAxMyAxM0wxMyAxNUwxNSAxNUwxNSAxM0wxMyAxMyB6IE0gMTUgMTNMMTcgMTNMMTcgMTFMMTUgMTFMMTUgMTMgeiBNIDE3IDEzTDE3IDE1TDE5IDE1TDE5IDEzTDE3IDEzIHogTSAxOSAxM0wyMSAxM0wyMSAxMUwxOSAxMUwxOSAxMyB6IE0gMTkgMTVMMTkgMTdMMjEgMTdMMjEgMTVMMTkgMTUgeiBNIDE5IDE3TDE3IDE3TDE3IDE5TDE5IDE5TDE5IDE3IHogTSAxOSAxOUwxOSAyMUwyMSAyMUwyMSAxOUwxOSAxOSB6IE0gMTcgMTlMMTUgMTlMMTUgMjFMMTcgMjFMMTcgMTkgeiBNIDE1IDE5TDE1IDE3TDEzIDE3TDEzIDE5TDE1IDE5IHogTSAxMyAxOUwxMSAxOUwxMSAyMUwxMyAyMUwxMyAxOSB6IE0gMTMgMTdMMTMgMTVMMTEgMTVMMTEgMTdMMTMgMTcgeiBNIDE1IDE3TDE3IDE3TDE3IDE1TDE1IDE1TDE1IDE3IHogTSAzIDE1TDMgMjFMOSAyMUw5IDE1TDMgMTUgeiBNIDUgMTdMNyAxN0w3IDE5TDUgMTlMNSAxNyB6IiAvPg0KPC9zdmc+"
    }];
    var menu = PageMenu({
        id: 'addMenu-search-select',
        condition: 'select',
        image: "data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTMgNC41IEEgMS41IDEuNSAwIDAgMCAxLjUgNiBBIDEuNSAxLjUgMCAwIDAgMyA3LjUgQSAxLjUgMS41IDAgMCAwIDQuNSA2IEEgMS41IDEuNSAwIDAgMCAzIDQuNSB6IE0gNyA1TDcgN0wyMiA3TDIyIDVMNyA1IHogTSAzIDEwLjUgQSAxLjUgMS41IDAgMCAwIDEuNSAxMiBBIDEuNSAxLjUgMCAwIDAgMyAxMy41IEEgMS41IDEuNSAwIDAgMCA0LjUgMTIgQSAxLjUgMS41IDAgMCAwIDMgMTAuNSB6IE0gNyAxMUw3IDEzTDEzLjEwNTQ2OSAxM0MxNC4zNjc0NjkgMTEuNzY0IDE2LjA5NCAxMSAxOCAxMUw3IDExIHogTSAxOCAxM0MxNS4yIDEzIDEzIDE1LjIgMTMgMThDMTMgMjAuOCAxNS4yIDIzIDE4IDIzQzE5IDIzIDIwLjAwMDc4MSAyMi42OTkyMTkgMjAuODAwNzgxIDIyLjE5OTIxOUwyMi41OTk2MDkgMjRMMjQgMjIuNTk5NjA5TDIyLjE5OTIxOSAyMC44MDA3ODFDMjIuNjk5MjE5IDIwLjAwMDc4MSAyMyAxOSAyMyAxOEMyMyAxNS4yIDIwLjggMTMgMTggMTMgeiBNIDE4IDE1QzE5LjcgMTUgMjEgMTYuMyAyMSAxOEMyMSAxOS43IDE5LjcgMjEgMTggMjFDMTYuMyAyMSAxNSAxOS43IDE1IDE4QzE1IDE2LjMgMTYuMyAxNSAxOCAxNSB6IE0gMyAxNi41IEEgMS41IDEuNSAwIDAgMCAxLjUgMTggQSAxLjUgMS41IDAgMCAwIDMgMTkuNSBBIDEuNSAxLjUgMCAwIDAgNC41IDE4IEEgMS41IDEuNSAwIDAgMCAzIDE2LjUgeiBNIDcgMTdMNyAxOUwxMS4wODAwNzggMTlDMTEuMDMzMDc4IDE4LjY3MyAxMSAxOC4zNCAxMSAxOEMxMSAxNy42NiAxMS4wMzMwNzggMTcuMzI3IDExLjA4MDA3OCAxN0w3IDE3IHoiIC8+DQo8L3N2Zz4=",
        accesskey: 'S',
        insertBefore: 'context-searchselect',
        onshowinglabel: locale.includes("zh-") ? "搜索: %SEL%" : "Search %SEL% by",
        onshowing: function (item) {
            let searchConfigFile = Services.dirsvc.get('UChrm', Ci.nsIFile), searchJson = false, popupNode = item.querySelector('menupopup');
            searchConfigFile.append("UserConfig"); // 配置文件存放在 UserConfig 目录下
            if (searchConfigFile.exists()) {
                searchConfigFile.append("_allsearch.json"); // 配置文件名为 _allsearch.json
            }
            popupNode.querySelectorAll('.auto-generated').forEach(m => { m.parentNode.removeChild(m); });
            let ins = popupNode.firstChild;
            if (searchConfigFile.exists()) {
                var searchConfig = loadText(searchConfigFile);
                try {
                    searchJson = JSON.parse(searchConfig);
                } catch (e) {
                    addMenu.error(e);
                }
                if (searchJson)
                    searchJson.forEach(g => {
                        if (Array.isArray(g.list) && g.list.length) {
                            let obj = {
                                label: g.nameZh || g.name,
                                class: "auto-generated search-menu showFirstText",
                                hidden: g.data.visible === false,
                                onclick: function (event) {
                                    if (event.target != event.currentTarget) return; var firstItem = event.currentTarget.querySelector('menuitem'); if (!firstItem) return; if (event.button === 1) { checkForMiddleClick(firstItem, event); } else { firstItem.doCommand(); closeMenus(event.currentTarget); }
                                },
                            }

                            let items;
                            obj._items = items = g.list.map(e => {
                                return {
                                    label: e.nameZh || e.name,
                                    where: 'tab',
                                    url: e.url,
                                    hidden: e.data.visible === false
                                }
                            });

                            // 显示为横排菜单，如果想显示成三级菜单，注释下面这三句
                            // obj._group = true;
                            // obj.class = ((obj.class || "") + " search-menu-group").trim();
                            // items.unshift({
                            //     label: g.nameZh || g.name,
                            //     hidden: g.data.visible === false,
                            //     onclick: function (event) {
                            //         if (event.target != event.currentTarget) return;
                            //         let nextSib = event.target.nextSibling;
                            //         while (nextSib) {
                            //             if (nextSib.hidden === false)
                            //                 nextSib.click(event);
                            //             nextSib = nextSib.nextSibling;
                            //         }
                            //     },
                            // })

                            let menu = addMenu.newMenu(obj, {
                                isTopMenuitem: true,
                                insertPoint: ins
                            }, document);
                            ins.parentNode.insertBefore(menu, ins);
                        }
                    });
            } else {
                Services.search.getVisibleEngines().then(
                    engines => engines.forEach((item) => {
                        let alias = item._definedAliases[0] || item._metaData.alias;
                        if (alias) {
                            let menuitem = addMenu.newMenuitem({
                                label: item._name,
                                class: "auto-generated",
                                where: 'tab',
                                text: "%s",
                                keyword: alias
                            }, {
                                isTopMenuitem: true,
                                insertPoint: ins
                            }, document);
                            ins.parentNode.insertBefore(menuitem, ins);
                        }
                    }));
            }
        }
    });
    menu(items);
    css("#context-searchselect { display: none } #contentAreaContextMenu #addMenu-search-select .menu-accel-container { visibility: hidden; }");
    function loadText(aFile) {
        var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(aFile, -1, 0, 0);
        sstream.init(fstream);

        var data = sstream.read(sstream.available());
        try {
            data = decodeURIComponent(escape(data));
        } catch (e) { }
        sstream.close();
        fstream.close();
        return data;
    }
};
// 文本右键菜单 End ==============================================================
// 输入右键菜单 Start ============================================================
//快捷回复
new function () {
    var items = [{
        label: locale.includes("zh-") ? "当前日期和时间" : "Current Date and Time",
        condition: "input",
        position: 2,
        oncommand: function () {
            var localnow = new Date();
            var yy = localnow.getFullYear();
            var mm = localnow.getMonth() + 1;
            if (mm < 10) mm = '0' + mm;
            var dd = localnow.getDate();
            if (dd < 10) dd = '0' + dd;
            var hh = localnow.getHours();
            if (hh < 10) hh = '0' + hh;
            var mi = localnow.getMinutes();
            if (mi < 10) mi = '0' + mi;
            var localnowstr = '【' + yy + '.' + mm + '.' + dd + ' - ' + hh + ':' + mi + '】';
            addMenu.copy(localnowstr);
            goDoCommand("cmd_paste");
        },
    }, {
        label: locale.includes("zh-") ? "用户名" : "Username",
        tooltiptext: locale.includes("zh-") ? "左键：填写用户名\n右键：设置用户名" : "Left click: paste username\nRight click: set username",
        onclick: function (event) {
            const locale = addMenu.locale;
            function setPref(pref) {
                pref = pref || ""
                var text = prompt(locale.includes("zh-") ? '设置用户名:' : 'Set username:', pref);
                if (text) Services.prefs.setStringPref('userChromeJS.addMenuPlus.username', text);
            }
            if (event.button == 0) {
                let pref = Services.prefs.getStringPref('userChromeJS.addMenuPlus.username', null);
                if (pref) { addMenu.copy(pref); goDoCommand("cmd_paste"); }
                else { setPref() }
            }
            if (event.button == 2) {
                setPref();
            }
        },
        image: " "
    }, {
        label: locale.includes("zh-") ? "邮箱" : "Email",
        tooltiptext: locale.includes("zh-") ? "左键：填写邮箱\n右键：设置邮箱" : "Left click: paste Email\nRight click: set Email",
        onclick: function (event) {
            const locale = addMenu.locale;
            function setPref(pref) {
                pref = pref || ""
                var text = prompt(locale.includes("zh-") ? '设置邮箱:' : 'Set Email:', pref);
                if (text) Services.prefs.setStringPref('userChromeJS.addMenuPlus.email', text);
            }
            if (event.button == 0) {
                let pref = Services.prefs.getStringPref('userChromeJS.addMenuPlus.email', null);
                if (pref) { addMenu.copy(pref); goDoCommand("cmd_paste"); }
                else { setPref() }
            }
            if (event.button == 2) {
                setPref();
            }
        },
        image: " "
    }, {
        label: locale.includes("zh-") ? "网站" : "Webstie",
        tooltiptext: locale.includes("zh-") ? "左键：填写网站\n右键：设置网站" : "Left click: paste WebSite\nRight click: set Website",
        onclick: function (event) {
            function setPref(pref) {
                pref = pref || ""
                var text = prompt(locale.includes("zh-") ? '设置网站:' : 'Set Website:', pref);
                if (text) Services.prefs.setStringPref('userChromeJS.addMenuPlus.website', text);
            }
            if (event.button == 0) {
                let pref = Services.prefs.getStringPref('userChromeJS.addMenuPlus.website', null);
                if (pref) { addMenu.copy(pref); goDoCommand("cmd_paste"); }
                else { setPref() }
            }
            if (event.button == 2) {
                setPref();
            }
        },
        image: " "
    }, {}, {
        label: "不明觉厉~~~",
        input_text: "虽然不知道LZ在说什么但是感觉很厉害的样子～",
        image: " "
    }, {
        label: "不用客气~~~",
        input_text: "不用客气，大家互相帮助……\n\u256E\uFF08\u256F\u25C7\u2570\uFF09\u256D",
        image: " "
    }, {
        label: "反馈情况再说",
        input_text: "Mark，看反馈情况再说。。。",
        image: " "
    }, {
        label: "看起来很不错",
        input_text: "看起来很不错哦，收藏之~~~\n谢谢LZ啦！！！",
        image: " "
    }, {
        label: "谢谢楼主分享",
        input_text: "谢谢楼主的分享!这个绝对要顶！！！",
        image: " "
    }, {
        label: "楼上正解~~~",
        input_text: "楼上正解……\u0285\uFF08\u00B4\u25D4\u0C6A\u25D4\uFF09\u0283",
        image: " "
    }, {
        label: "坐等楼下解答",
        input_text: "坐等楼下高手解答~~~⊙_⊙",
        image: " "
    }, {
        label: "这个要支持~~~",
        input_text: "很好、很强大，这个一定得支持！！！",
        image: " "
    }, {
        label: "不明真相的~~~",
        input_text: "不明真相的围观群众~~~\u0285\uFF08\u00B4\u25D4\u0C6A\u25D4\uFF09\u0283",
        image: " "
    }, {
        label: "没图没真相~~~",
        input_text: "没图没真相，纯支持下了~~~",
        image: " "
    }, {
        label: "嘿嘿~~~",
        input_text: "\u2606\u002E\u3002\u002E\u003A\u002A\u0028\u563F\u00B4\u0414\uFF40\u563F\u0029\u002E\u3002\u002E\u003A\u002A\u2606",
        image: " "
    }];
    var menu = PageMenu({
        id: "quick_input",
        label: locale.includes("zh-") ? "快速输入..." : "Quick Input",
        condition: "input",
        insertAfter: 'context-sep-navigation',
        // position: 1,
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiANCgkgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbDpzcGFjZT0icHJlc2VydmUiIGZpbGw9ImNvbnRleHQtZmlsbCIgZmlsbC1vcGFjaXR5PSJjb250ZXh0LWZpbGwtb3BhY2l0eSI+DQo8cGF0aCBkPSJNMTkwLjMsNDUuMkw5OCwxMzcuNUg2NC43di0zMy4zTDE1NywxMS45YzEuMy0xLjMsMy0xLjksNC43LTEuOWMxLjcsMCwzLjQsMC42LDQuNywxLjlsMjMuOSwyMy45YzEuMywxLjMsMS45LDMsMS45LDQuNw0KCUMxOTIuMiw0Mi4yLDE5MS42LDQzLjksMTkwLjMsNDUuMnogTTE2MS43LDI5LjRsLTgwLjQsODAuNHYxMS4xaDExLjFsODAuNC04MC40TDE2MS43LDI5LjRMMTYxLjcsMjkuNHogTTEwMC43LDM3LjdIMzEuNHYxMzNoMTMzDQoJdi02OS4zYzAtNC42LDMuNy04LjMsOC4zLTguM2M0LjYsMCw4LjMsMy43LDguMyw4LjN2NzQuOGMwLDYuMS01LDExLjEtMTEuMSwxMS4xSDI1LjljLTYuMSwwLTExLjEtNS0xMS4xLTExLjFWMzIuMg0KCWMwLTYuMSw1LTExLjEsMTEuMS0xMS4xaDc0LjhjNC42LDAsOC4zLDMuNyw4LjMsOC4zUzEwNS4zLDM3LjcsMTAwLjcsMzcuN3oiLz4NCjwvc3ZnPg0K",
        oncommand: function (event) {
            var input_text = event.target.getAttribute('input_text');
            if (input_text) {
                addMenu.copy(input_text);
                goDoCommand("cmd_paste");
            }
        }
    });
    menu(items);
};
//颜文字输入
var Specialcharacters = PageMenu({
    id: "quick_inputemoji",
    label: locale.includes("zh-") ? "颜文字输入" : "Emoji",
    condition: "input",
    insertAfter: "quick_input",
    oncommand: function (event) {
        var input_text = event.target.getAttribute('input_text');
        if (input_text) {
            addMenu.copy(input_text);
            goDoCommand("cmd_paste");
        }
    },
    image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTAuMDc0IDAuNDQzIEMgOC43NDkgMC40NDMgNy40ODYgMC43MTIgNi4zMzcgMS4xOTggQyA1LjE4OSAxLjY4NCA0LjE1NSAyLjM4NiAzLjI4NiAzLjI1NSBDIDIuNDE4IDQuMTI0IDEuNzE1IDUuMTU4IDEuMjI5IDYuMzA2IEMgMC43NDMgNy40NTUgMC40NzQgOC43MTggMC40NzQgMTAuMDQzIEMgMC40NzUgMTEuODkxIDAuOTc1IDEzLjU2NSAxLjgyNSAxNC45NzkgQyAyLjY3NSAxNi4zOTQgMy44NzUgMTcuNTQ4IDUuMjc1IDE4LjM1NiBDIDYuNjc1IDE5LjE2NSA4LjI3NSAxOS42MjcgOS45MjUgMTkuNjU1IEMgMTEuNTc1IDE5LjY4NCAxMy4yNzUgMTkuMjggMTQuODc1IDE4LjM1NiBDIDE1LjYxOCAxNy45MjggMTYuMjg5IDE3LjQwOCAxNi44NzggMTYuODE2IEMgMTcuNDY3IDE2LjIyNCAxNy45NzUgMTUuNTYgMTguMzg5IDE0Ljg0MiBDIDE4LjgwMyAxNC4xMjUgMTkuMTI1IDEzLjM1MyAxOS4zNDIgMTIuNTQ3IEMgMTkuNTYgMTEuNzQxIDE5LjY3NSAxMC45IDE5LjY3NCAxMC4wNDIgQyAxOS42NzQgOC43MTcgMTkuNDA1IDcuNDU1IDE4LjkxOSA2LjMwNiBDIDE4LjQzNCA1LjE1OCAxNy43MzEgNC4xMjQgMTYuODYyIDMuMjU1IEMgMTUuOTk0IDIuMzg3IDE0Ljk1OSAxLjY4NCAxMy44MSAxLjE5OCBDIDEyLjY2MiAwLjcxMiAxMS4zOTkgMC40NDMgMTAuMDc0IDAuNDQzIFogTSAxMC4wNzQgMTcuNjQyIEMgOC42MTIgMTcuNjU5IDcuMjgxIDE3LjI3OCA2LjE1NCAxNi42MTggQyA1LjAyNyAxNS45NTggNC4xMDIgMTUuMDE5IDMuNDQ5IDEzLjkxOCBDIDIuNzk3IDEyLjgxNyAyLjQxNyAxMS41NTUgMi4zNzkgMTAuMjQ5IEMgMi4zNDEgOC45NDMgMi42NDYgNy41OTMgMy4zNjIgNi4zMTggQyAzLjcwMyA1LjcxMyA0LjExOSA1LjE2NiA0LjU5NSA0LjY4NyBDIDUuMDcxIDQuMjA4IDUuNjA3IDMuNzk2IDYuMTg3IDMuNDYxIEMgNi43NjcgMy4xMjYgNy4zOTIgMi44NjggOC4wNDUgMi42OTUgQyA4LjY5OCAyLjUyMiA5LjM4IDIuNDM1IDEwLjA3NCAyLjQ0MyBDIDExLjUzNyAyLjQyNyAxMi44NjcgMi44MDcgMTMuOTk0IDMuNDY3IEMgMTUuMTIyIDQuMTI3IDE2LjA0NyA1LjA2NyAxNi42OTkgNi4xNjcgQyAxNy4zNTEgNy4yNjggMTcuNzMyIDguNTMxIDE3Ljc3IDkuODM3IEMgMTcuODA3IDExLjE0MyAxNy41MDMgMTIuNDkyIDE2Ljc4NiAxMy43NjcgQyAxNi40NDYgMTQuMzczIDE2LjAzIDE0LjkxOSAxNS41NTQgMTUuMzk4IEMgMTUuMDc4IDE1Ljg3OCAxNC41NDEgMTYuMjg5IDEzLjk2MSAxNi42MjQgQyAxMy4zODEgMTYuOTYgMTIuNzU2IDE3LjIxOCAxMi4xMDMgMTcuMzkxIEMgMTEuNDUgMTcuNTYzIDEwLjc2OCAxNy42NSAxMC4wNzQgMTcuNjQyIFogTSA3LjU3NSA5Ljc5MyBDIDcuNzgyIDkuNzkzIDcuOTc5IDkuNzQ0IDguMTU5IDkuNjU2IEMgOC4zMzggOS41NjcgOC41IDkuNDM5IDguNjM1IDkuMjgxIEMgOC43NzEgOS4xMjMgOC44OCA4LjkzNCA4Ljk1NiA4LjcyNCBDIDkuMDMyIDguNTE1IDkuMDc0IDguMjg1IDkuMDc0IDguMDQzIEMgOS4wNzQgNy44MDEgOS4wMzIgNy41NzEgOC45NTYgNy4zNjEgQyA4Ljg4IDcuMTUyIDguNzcxIDYuOTY0IDguNjM1IDYuODA1IEMgOC40OTkgNi42NDcgOC4zMzcgNi41MTkgOC4xNTggNi40MyBDIDcuOTc4IDYuMzQyIDcuNzgxIDYuMjkzIDcuNTc0IDYuMjkzIEMgNy4zNjcgNi4yOTMgNy4xNyA2LjM0MiA2Ljk5IDYuNDMgQyA2LjgxMSA2LjUxOSA2LjY0OSA2LjY0NyA2LjUxMyA2LjgwNSBDIDYuMzc3IDYuOTY0IDYuMjY4IDcuMTUyIDYuMTkyIDcuMzYyIEMgNi4xMTYgNy41NzEgNi4wNzQgNy44MDIgNi4wNzQgOC4wNDMgQyA2LjA3NCA4LjI4NSA2LjExNiA4LjUxNSA2LjE5MiA4LjcyNCBDIDYuMjY4IDguOTM0IDYuMzc4IDkuMTIyIDYuNTE0IDkuMjgxIEMgNi42NSA5LjQzOSA2LjgxMSA5LjU2NyA2Ljk5MSA5LjY1NiBDIDcuMTcxIDkuNzQ0IDcuMzY4IDkuNzkzIDcuNTc1IDkuNzkzIFogTSAxMi41NzQgOS43OTMgQyAxMi43ODIgOS43OTMgMTIuOTc5IDkuNzQ0IDEzLjE1OSA5LjY1NiBDIDEzLjMzOCA5LjU2NyAxMy41IDkuNDM5IDEzLjYzNSA5LjI4MSBDIDEzLjc3MSA5LjEyMyAxMy44OCA4LjkzNCAxMy45NTYgOC43MjQgQyAxNC4wMzIgOC41MTUgMTQuMDc0IDguMjg1IDE0LjA3NCA4LjA0MyBDIDE0LjA3NCA3LjgwMSAxNC4wMzIgNy41NzEgMTMuOTU2IDcuMzYxIEMgMTMuODggNy4xNTIgMTMuNzcxIDYuOTY0IDEzLjYzNSA2LjgwNSBDIDEzLjQ5OSA2LjY0NyAxMy4zMzcgNi41MTkgMTMuMTU4IDYuNDMgQyAxMi45NzggNi4zNDIgMTIuNzgxIDYuMjkzIDEyLjU3NCA2LjI5MyBDIDEyLjM2NyA2LjI5MyAxMi4xNyA2LjM0MiAxMS45OSA2LjQzMSBDIDExLjgxMSA2LjUxOSAxMS42NSA2LjY0NyAxMS41MTQgNi44MDYgQyAxMS4zNzggNi45NjQgMTEuMjY4IDcuMTUzIDExLjE5MiA3LjM2MiBDIDExLjExNiA3LjU3MSAxMS4wNzQgNy44MDIgMTEuMDc0IDguMDQzIEMgMTEuMDc0IDguMjg1IDExLjExNiA4LjUxNSAxMS4xOTIgOC43MjQgQyAxMS4yNjggOC45MzMgMTEuMzc4IDkuMTIyIDExLjUxNCA5LjI4IEMgMTEuNjUgOS40MzkgMTEuODExIDkuNTY3IDExLjk5IDkuNjU1IEMgMTIuMTcgOS43NDQgMTIuMzY3IDkuNzkzIDEyLjU3NCA5Ljc5MyBaIE0gMTQuNDE1IDExLjM3OSBDIDE0LjMyMyAxMS4zMzMgMTQuMjI2IDExLjMwNyAxNC4xMyAxMS4zIEMgMTQuMDMzIDExLjI5MyAxMy45MzcgMTEuMzA1IDEzLjg0NiAxMS4zMzMgQyAxMy43NTUgMTEuMzYyIDEzLjY2OSAxMS40MDggMTMuNTk0IDExLjQ3IEMgMTMuNTE5IDExLjUzMSAxMy40NTUgMTEuNjA4IDEzLjQwNyAxMS42OTkgQyAxMy4zOTkgMTEuNzE2IDEzLjM0IDExLjgyMyAxMy4yMTkgMTEuOTc2IEMgMTMuMDk3IDEyLjEyOCAxMi45MTMgMTIuMzI1IDEyLjY1MiAxMi41MiBDIDEyLjM5MiAxMi43MTUgMTIuMDU1IDEyLjkwOCAxMS42MyAxMy4wNTIgQyAxMS4yMDUgMTMuMTk3IDEwLjY5MSAxMy4yOTIgMTAuMDc1IDEzLjI5MiBDIDkuNDYyIDEzLjI5MiA4Ljk1IDEzLjE5OCA4LjUyNiAxMy4wNTUgQyA4LjEwMiAxMi45MTIgNy43NjYgMTIuNzIgNy41MDUgMTIuNTI2IEMgNy4yNDQgMTIuMzMyIDcuMDU5IDEyLjEzNiA2LjkzNiAxMS45ODMgQyA2LjgxMyAxMS44MyA2Ljc1MyAxMS43MiA2Ljc0MiAxMS43IEMgNi42NzcgMTEuNTcxIDYuNTgzIDExLjQ3MiA2LjQ3NCAxMS40MDMgQyA2LjM2NSAxMS4zMzQgNi4yNCAxMS4yOTYgNi4xMTQgMTEuMjg5IEMgNS45ODggMTEuMjgyIDUuODYgMTEuMzA3IDUuNzQ0IDExLjM2MyBDIDUuNjI4IDExLjQyIDUuNTI0IDExLjUwNyA1LjQ0NSAxMS42MjggQyA1LjQwOSAxMS42ODQgNS4zOCAxMS43NDQgNS4zNiAxMS44MDcgQyA1LjM0IDExLjg2OSA1LjMyOCAxMS45MzMgNS4zMjQgMTEuOTk4IEMgNS4zMiAxMi4wNjIgNS4zMjUgMTIuMTI4IDUuMzM4IDEyLjE5MiBDIDUuMzUxIDEyLjI1NiA1LjM3MyAxMi4zMTggNS40MDMgMTIuMzc4IEMgNS40MTYgMTIuNDAzIDUuNSAxMi41NjYgNS42NzMgMTIuNzk3IEMgNS44NDYgMTMuMDI4IDYuMTA3IDEzLjMyNiA2LjQ3NCAxMy42MjIgQyA2Ljg0MSAxMy45MTcgNy4zMTMgMTQuMjEgNy45MDggMTQuNDI5IEMgOC41MDIgMTQuNjQ3IDkuMjE5IDE0Ljc5MiAxMC4wNzUgMTQuNzkyIEMgMTAuOTMyIDE0Ljc5MiAxMS42NDkgMTQuNjQ3IDEyLjI0MyAxNC40MjkgQyAxMi44MzggMTQuMjEgMTMuMzEgMTMuOTE4IDEzLjY3NiAxMy42MjIgQyAxNC4wNDMgMTMuMzI2IDE0LjMwNCAxMy4wMjcgMTQuNDc2IDEyLjc5NiBDIDE0LjY0OSAxMi41NjUgMTQuNzMzIDEyLjQwMiAxNC43NDUgMTIuMzc3IEMgMTQuNzkxIDEyLjI4NSAxNC44MTYgMTIuMTg5IDE0LjgyMyAxMi4wOTIgQyAxNC44MjkgMTEuOTk2IDE0LjgxNiAxMS45IDE0Ljc4NiAxMS44MSBDIDE0Ljc1NyAxMS43MTkgMTQuNzEgMTEuNjM1IDE0LjY0NyAxMS41NjEgQyAxNC41ODUgMTEuNDg4IDE0LjUwNyAxMS40MjUgMTQuNDE1IDExLjM3OSBaIiBzdHlsZT0iIi8+CiAgPHBhdGggZD0iTSAyMC4xNzQgMTAuMDQyIEMgMjAuMTQxIDEzLjU5NyAxOC4xODYgMTYuOTgzIDE1LjEyNSAxOC43ODkgQyAxMS43ODQgMjAuNjY5IDcuOTIxIDIwLjQ2MSA1LjAyNSAxOC43ODkgQyAyLjEyOSAxNy4xMTggMC4wMTYgMTMuODc3IC0wLjAyNiAxMC4wNDMgQyAtMC4wMDQgNy4yOSAxLjEzMiA0LjcwMSAyLjkzMiAyLjkwMSBDIDQuNzMyIDEuMTAxIDcuMzIxIC0wLjA1NyAxMC4wNzQgLTAuMDU3IEMgMTIuODI3IC0wLjA1NyAxNS40MTUgMS4xMDEgMTcuMjE1IDIuOTAxIEMgMTkuMDE2IDQuNzAxIDIwLjE1MiA3LjI4OSAyMC4xNzQgMTAuMDQyIFogTSAxNi41MDggMy42MDggQyAxNC44MzQgMS45MzQgMTIuNjIyIDAuOTQzIDEwLjA3NCAwLjk0MyBDIDcuNTI1IDAuOTQzIDUuMzE0IDEuOTM0IDMuNjM5IDMuNjA4IEMgMS45NjUgNS4yODMgMC45NTIgNy40OTQgMC45NzQgMTAuMDQzIEMgMC45MzMgMTMuNTk5IDIuODIxIDE2LjM2MiA1LjUyNSAxNy45MjMgQyA4LjIyOSAxOS40ODQgMTEuNTY2IDE5LjczOCAxNC42MjUgMTcuOTIzIEMgMTcuNTA0IDE2LjI5OSAxOS4yMDkgMTMuMzQ3IDE5LjE3NCAxMC4wNDIgQyAxOS4xOTYgNy40OTQgMTguMTgzIDUuMjgyIDE2LjUwOCAzLjYwOCBaIE0gMTAuMDc2IDE4LjE0MiBDIDcuMDE0IDE4LjEzNCA0LjM4MSAxNi40NyAzLjAxOSAxNC4xNzMgQyAxLjY1NyAxMS44NzUgMS40NjEgOC43NjQgMi45MjYgNi4wNzMgQyA0LjM4IDMuNTU4IDcuMTcgMS45NDcgMTAuMDcyIDEuOTQzIEMgMTMuMTM0IDEuOTUxIDE1Ljc2NyAzLjYxNSAxNy4xMjkgNS45MTIgQyAxOC40OTEgOC4yMSAxOC42ODcgMTEuMzIxIDE3LjIyMiAxNC4wMTIgQyAxNS43NjggMTYuNTI3IDEyLjk3OSAxOC4xMzggMTAuMDc2IDE4LjE0MiBaIE0gMTYuMzUgMTMuNTIyIEMgMTcuNzUyIDExLjExMyAxNy41MTcgOC41MjkgMTYuMjY5IDYuNDIyIEMgMTUuMDIgNC4zMTYgMTIuODY2IDIuODY5IDEwLjA4IDIuOTQzIEMgNy40MzEgMi44NzcgNS4wNjYgNC4yMzYgMy43OTggNi41NjMgQyAyLjM5NiA4Ljk3MiAyLjYzMSAxMS41NTYgMy44NzkgMTMuNjYzIEMgNS4xMjggMTUuNzY5IDcuMjgyIDE3LjIxNiAxMC4wNjggMTcuMTQyIEMgMTIuNzE4IDE3LjIwOCAxNS4wODIgMTUuODQ5IDE2LjM1IDEzLjUyMiBaIE0gNS41NzQgOC4wNDMgQyA1LjU3NCA3LjQ3IDUuODA4IDYuODYgNi4xMzQgNi40OCBDIDYuNDY2IDYuMDkzIDcuMDQ0IDUuNzkzIDcuNTc0IDUuNzkzIEMgOC4xMDQgNS43OTMgOC42ODIgNi4wOTMgOS4wMTQgNi40OCBDIDkuMzQgNi44NiA5LjU3NCA3LjQ3IDkuNTc0IDguMDQzIEMgOS41NzQgOC42MTYgOS4zNDEgOS4yMjYgOS4wMTUgOS42MDYgQyA4LjY4MyA5Ljk5MyA4LjEwNSAxMC4yOTMgNy41NzUgMTAuMjkzIEMgNy4wNDUgMTAuMjkzIDYuNDY2IDkuOTkzIDYuMTM0IDkuNjA2IEMgNS44MDggOS4yMjYgNS41NzQgOC42MTYgNS41NzQgOC4wNDMgWiBNIDYuODkzIDguOTU1IEMgNy4xMDQgOS4yMDEgNy4yNzYgOS4yOTMgNy41NzUgOS4yOTMgQyA3Ljg3MyA5LjI5MyA4LjA0NSA5LjIwMSA4LjI1NSA4Ljk1NSBDIDguNDcyIDguNzAyIDguNTc0IDguNDM3IDguNTc0IDguMDQzIEMgOC41NzQgNy42NDkgOC40NzIgNy4zODQgOC4yNTUgNy4xMzEgQyA4LjA0NCA2Ljg4NSA3Ljg3MiA2Ljc5MyA3LjU3NCA2Ljc5MyBDIDcuMjc2IDYuNzkzIDcuMTA0IDYuODg1IDYuODkzIDcuMTMxIEMgNi42NzYgNy4zODQgNi41NzQgNy42NDkgNi41NzQgOC4wNDMgQyA2LjU3NCA4LjQzNyA2LjY3NiA4LjcwMiA2Ljg5MyA4Ljk1NSBaIE0gMTAuNTc0IDguMDQzIEMgMTAuNTc0IDcuNDcgMTAuODA4IDYuODYxIDExLjEzNCA2LjQ4IEMgMTEuNDY2IDYuMDkzIDEyLjA0NCA1Ljc5MyAxMi41NzQgNS43OTMgQyAxMy4xMDQgNS43OTMgMTMuNjgyIDYuMDkzIDE0LjAxNCA2LjQ4IEMgMTQuMzQgNi44NiAxNC41NzQgNy40NyAxNC41NzQgOC4wNDMgQyAxNC41NzQgOC42MTYgMTQuMzQxIDkuMjI2IDE0LjAxNSA5LjYwNiBDIDEzLjY4MyA5Ljk5MyAxMy4xMDQgMTAuMjkzIDEyLjU3NCAxMC4yOTMgQyAxMi4wNDQgMTAuMjkzIDExLjQ2NiA5Ljk5MyAxMS4xMzQgOS42MDYgQyAxMC44MDggOS4yMjUgMTAuNTc0IDguNjE2IDEwLjU3NCA4LjA0MyBaIE0gMTEuODkzIDguOTU1IEMgMTIuMTA0IDkuMjAxIDEyLjI3NiA5LjI5MyAxMi41NzQgOS4yOTMgQyAxMi44NzMgOS4yOTMgMTMuMDQ0IDkuMjAxIDEzLjI1NSA4Ljk1NSBDIDEzLjQ3MiA4LjcwMiAxMy41NzQgOC40MzcgMTMuNTc0IDguMDQzIEMgMTMuNTc0IDcuNjQ5IDEzLjQ3MiA3LjM4NCAxMy4yNTUgNy4xMzEgQyAxMy4wNDQgNi44ODUgMTIuODcyIDYuNzkzIDEyLjU3NCA2Ljc5MyBDIDEyLjI3NiA2Ljc5MyAxMi4xMDQgNi44ODUgMTEuODkzIDcuMTMxIEMgMTEuNjc2IDcuMzg0IDExLjU3NCA3LjY1IDExLjU3NCA4LjA0MyBDIDExLjU3NCA4LjQzNiAxMS42NzYgOC43MDIgMTEuODkzIDguOTU1IFogTSAxNS4xOTIgMTIuNjAxIEMgMTUuMTU4IDEyLjY2OCAxNC44MDIgMTMuMzU2IDEzLjk5IDE0LjAxMSBDIDEzLjIxNSAxNC42MzYgMTEuOSAxNS4yOTIgMTAuMDc1IDE1LjI5MiBDIDguMjUxIDE1LjI5MiA2LjkzNSAxNC42MzYgNi4xNiAxNC4wMTEgQyA1LjM0OCAxMy4zNTcgNC45ODUgMTIuNjU5IDQuOTU3IDEyLjYwNCBDIDQuODA5IDEyLjIzOCA0LjgzOSAxMS43MDIgNS4wMjYgMTEuMzU1IEMgNS4yOTUgMTEuMDIgNS43NzggMTAuNzcgNi4xNDEgMTAuNzkgQyA2LjUwNCAxMC44MSA2Ljk1OCAxMS4xMTEgNy4xODggMTEuNDc0IEMgNy4yMjEgMTEuNTM3IDcuMzY1IDExLjc5OCA3LjgwNCAxMi4xMjQgQyA4LjI4NCAxMi40ODIgOC45NTQgMTIuNzkyIDEwLjA3NSAxMi43OTIgQyAxMS4yMDEgMTIuNzkyIDExLjg3MyAxMi40NzkgMTIuMzUyIDEyLjEyIEMgMTIuNzkgMTEuNzkyIDEyLjk1MSAxMS40OTIgMTIuOTY2IDExLjQ2NCBDIDEzLjEyOCAxMS4yMDQgMTMuNDI5IDEwLjk0MSAxMy42OTUgMTAuODU3IEMgMTMuOTYgMTAuNzczIDE0LjM1OCAxMC44MTQgMTQuNjQxIDEwLjkzMyBDIDE0LjkwNSAxMS4wOTEgMTUuMTczIDExLjM4OCAxNS4yNjEgMTEuNjUzIEMgMTUuMzQ5IDExLjkxOCAxNS4zMSAxMi4zMTYgMTUuMTkyIDEyLjYwMSBaIE0gMTQuMzEyIDExLjk2NyBDIDE0LjI4IDExLjg3MSAxNC4yOTIgMTEuODUzIDE0LjE5IDExLjgyNSBDIDE0LjEwNiAxMS43NTkgMTQuMDk1IDExLjc3OSAxMy45OTcgMTEuODEgQyAxMy44OTkgMTEuODQxIDEzLjg3OSAxMS44MzEgMTMuODQ5IDExLjkzNCBDIDEzLjgxMiAxMi4wMDEgMTMuNTU2IDEyLjQ2OCAxMi45NTIgMTIuOTIgQyAxMi4zODkgMTMuMzQyIDExLjQxMiAxMy43OTIgMTAuMDc1IDEzLjc5MiBDIDguNzQ1IDEzLjc5MiA3Ljc3IDEzLjM0NiA3LjIwNyAxMi45MjcgQyA2LjYwMiAxMi40NzcgNi4zMjQgMTEuOTc4IDYuMzAxIDExLjkzNSBDIDYuMjcgMTEuNzgyIDYuMjI4IDExLjc5NiA2LjA4NiAxMS43ODkgQyA1Ljk0NSAxMS43ODEgNS45MSAxMS43NTMgNS44NjQgMTEuOTAxIEMgNS43NTcgMTIuMDAzIDUuNzU1IDEyLjA0IDUuODQ5IDEyLjE1MiBDIDUuODczIDEyLjIgNi4xMzIgMTIuNzA1IDYuNzg3IDEzLjIzMyBDIDcuNDggMTMuNzkxIDguNDc1IDE0LjI5MiAxMC4wNzUgMTQuMjkyIEMgMTEuNjc1IDE0LjI5MiAxMi42NyAxMy43OSAxMy4zNjIgMTMuMjMyIEMgMTQuMDE3IDEyLjcwNCAxNC4yNzQgMTIuMjAxIDE0LjI5NyAxMi4xNTUgQyAxNC4zNjMgMTIuMDczIDE0LjM0MyAxMi4wNjMgMTQuMzEyIDExLjk2NyBaIiBzdHlsZT0iZmlsbDogbm9uZTsiLz4KPC9zdmc+"
});

Specialcharacters([{
    id: "spe-charaters",
    style: "display:none;"
}]);


var SPE4 = PageMenu({
    label: "卖萌",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE4([{
    label: "｡◕‿◕｡",
    input_text: "｡◕‿◕｡"
}, {
    label: "(●'‿'●) ",
    input_text: "(●'‿'●) "
}, {
    label: "(ง •̀_•́)ง",
    input_text: "(ง •̀_•́)ง"
}, {
    label: "(๑•̀ω•́๑)",
    input_text: "(๑•̀ω•́๑)"
}, {
    label: "(๑¯∀¯๑)",
    input_text: "(๑¯∀¯๑)"
}, {
    label: "(๑•̀ㅂ•́)و✧",
    input_text: "(๑•̀ㅂ•́)و✧"
}, {
    label: "(๑•́ ₃ •̀๑) ",
    input_text: "(๑•́ ₃ •̀๑) "
}, {
    label: "_(:з」∠)_",
    input_text: "_(:з」∠)_"
}, {
    label: "(ฅ´ω`ฅ)",
    input_text: "(ฅ´ω`ฅ)"
}, {
    label: " (¬､¬)",
    input_text: " (¬､¬) "
}, {
    label: " ( ˙ε ˙ ) ",
    input_text: " ( ˙ε ˙ )"
}, {
    label: "(๑¯ิε ¯ิ๑) ",
    input_text: "(๑¯ิε ¯ิ๑) "
}, {
    label: "_(•̀ω•́ 」∠)_",
    input_text: "_(•̀ω•́ 」∠)_"
},

]);

var SPE6 = PageMenu({
    label: "不开心",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE6([{
    label: "Ծ‸Ծ",
    input_text: "Ծ‸Ծ"
}, {
    label: "●﹏●",
    input_text: "●﹏●"
}, {
    label: "≥﹏≤",
    input_text: "≥﹏≤"
}, {
    label: "◔ ‸◔？",
    input_text: "◔ ‸◔？"
}, {
    label: "ᕙ(⇀‸↼‵‵)ᕗ ",
    input_text: "ᕙ(⇀‸↼‵‵)ᕗ "
}, {
    label: "ヘ(-ω-ヘ)",
    input_text: "ヘ(-ω-ヘ)"
}, {
    label: "(￣_￣|||)",
    input_text: "(￣_￣|||)"
}, {
    label: "(눈_눈)",
    input_text: "(눈_눈)"
}, {
    label: "o(╥﹏╥)o",
    input_text: "o(╥﹏╥)o"
}, {
    label: "(￣▽￣*)b",
    input_text: "(￣▽￣*)b"
}, {
    label: "(｡•ˇ‸ˇ•｡)",
    input_text: "(｡•ˇ‸ˇ•｡)"
}, {
    label: "(｡•́︿•̀｡)",
    input_text: "(｡•́︿•̀｡)"
}, {
    label: "Σ(๑０ω０๑) ",
    input_text: "Σ(๑０ω０๑)"
}, {
    label: "( ´◔‸◔`)",
    input_text: "( ´◔‸◔`)"
}, {
    label: "( ´･ᴗ･` )",
    input_text: "( ´･ᴗ･` )"
}, {
    label: "( ⊙⊙)!!",
    input_text: "( ⊙⊙)!!"
}, {
    label: "(｡ì _ í｡)",
    input_text: "(｡ì _ í｡)"
},

]);

var SPE5 = PageMenu({
    label: "Emoji",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE5([{
    label: "😂",
    input_text: "😂"
}, {
    label: "😍",
    input_text: "😍"
}, {
    label: "😘",
    input_text: "😘"
}, {
    label: "😝",
    input_text: "😝"
}, {
    label: "😒",
    input_text: "😒"
}, {
    label: "😓",
    input_text: "😓"
}, {
    label: "😭",
    input_text: "😭"
}, {
    label: "😱",
    input_text: "😱"
}, {
    label: "😡",
    input_text: "😡"
}, {
    label: "😎",
    input_text: "😎"
}, {
    label: "❤️",
    input_text: "❤️"
}, {
    label: "💔",
    input_text: "💔"
}, {
    label: "👍",
    input_text: "👍"
}, {
    label: "👎",
    input_text: "👎"
}, {
    label: "👌",
    input_text: "👌"
}, {
    label: "🤝",
    input_text: "🤝"
},

]);

var SPE7 = PageMenu({
    label: "表情包",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE7([{
    label: "Instereting",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl9t6ejgzj2050050jr7.jpg"/>'
}, {
    label: "辣眼睛",
    input_text: '<img src="https://tva3.sinaimg.cn/large/7a6a15d5gy1fcl8r7n590j20d10cbk1y.jpg"/>'
}, {
    label: "爱心发射",
    input_text: '<img src="https://tva1.sinaimg.cn/large/7a6a15d5gy1fcl8s0pnqnj2060060aah.jpg"/>'
}, {
    label: "不错不错",
    input_text: '<img src="https://tva4.sinaimg.cn/large/7a6a15d5gy1fcl9wbtpwgg2046046jtp.gif"/>'
}, {
    label: "我不能接受",
    input_text: '<img src="https://tva4.sinaimg.cn/large/7a6a15d5gy1fcl8sipccsj208w06k0tf.jpg"/>'
}, {
    label: "可以，这很清真",
    input_text: '<img src="https://tva3.sinaimg.cn/large/7a6a15d5gy1fcl9i616lcj205i04wglr.jpg"/>'
}, {
    label: "不可以，这不清真",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl9ii6wkwj206l05wgm5.jpg"/>'
}, {
    label: "厉害了，我的哥",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl9jhl9btj20dc0a0aa7.jpg"/>'
}, {
    label: "老哥，稳",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl9jsvmwhj204e04e0sk.jpg"/>'
}, {
    label: "尼克杨问题号脸",
    input_text: '<img src="https://tva1.sinaimg.cn/large/7a6a15d5gy1fcl6ba3jznj208k086glk.jpg"/>'
}, {
    label: "在座的各位都是垃圾",
    input_text: '<img src="https://tva1.sinaimg.cn/large/7a6a15d5gy1fcl8ogllg0j206r03tt8o.jpg"/>'
}, {
    label: "别说了....我",
    input_text: '<img src="https://tva4.sinaimg.cn/large/7a6a15d5gy1fcl9kl6q47g207u078av3.gif"/>'
}, {
    label: "exo me?",
    input_text: '<img src="https://tva4.sinaimg.cn/large/7a6a15d5gy1fcl9l01y74j205k05kq2s.jpg"/>'
}, {
    label: "哎呦，好叼哦",
    input_text: '<img src="https://tva3.sinaimg.cn/large/7a6a15d5gy1fcmq68293hj205k063js0.jpg"/>'
}, {
    label: "又在背后说我帅",
    input_text: '<img src="https://tva1.sinaimg.cn/large/7a6a15d5gy1fcl9thd9a2j204404fglg.jpg"/>'
}, {
    label: "鸡年大吉吧",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl9vw59yaj204w050glj.jpg"/>'
}, {
    label: "如此厚颜无耻之人",
    input_text: '<img src="https://tva2.sinaimg.cn/large/7a6a15d5gy1fcl8q2ekhkg208w06oe81.gif"/>'
},]);

var SPE1 = PageMenu({
    label: "特殊图形",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE1([{
    label: "❤♥♡",
    input_text: "❤♥♡"
}, {
    label: "☻☺",
    input_text: "☻☺"
}, {
    label: "♂♀",
    input_text: "♂♀"
}, {
    label: "★☆",
    input_text: "★☆"
}, {
    label: "■◻",
    input_text: "■◻"
}, {
    label: "●○",
    input_text: "●○"
}, {
    label: "▲▼",
    input_text: "▲▼"
}, {
    label: "►◄",
    input_text: "►◄"
}, {
    label: "√×",
    input_text: "√×"
}, {
    label: "♪♫♬♩",
    input_text: "♪♫♬♩"
}, {
    label: "♠♥♣♦",
    input_text: "♠♥♣♦"
},]);

var SPE3 = PageMenu({
    label: "特殊字符",
    condition: "input",
    insertBefore: "spe-charaters",
});
SPE3([{
    label: "©®™",
    input_text: "©®™"
}, {
    label: "のあぃ",
    input_text: "のあぃ"
}, {
    label: "•",
    input_text: "•"
}, {
    label: "×÷",
    input_text: "×÷"
}, {
    label: "≠≈",
    input_text: "≠≈"
}, {
    label: "↑↓",
    input_text: "↑↓"
}, {
    label: "←→",
    input_text: "←→"
}, {
    label: "»«",
    input_text: "»«"
}, {
    label: "「」",
    input_text: "「」"
}, {
    label: "『』",
    input_text: "『』"
}, {
    label: "℃℉",
    input_text: "℃℉"
},]);
// 输入右键菜单 End ==============================================================
//隐藏相同项。必须，不能删除
function syncHidden(event) {
    Array.from(event.target.children).forEach(function (elem) {
        var command = elem.getAttribute('command');
        if (!command) return;
        var original = document.getElementById(command);
        if (!original) {
            elem.hidden = true;
            return;
        };
        elem.hidden = original.hidden;
        elem.collapsed = original.collapsed;
        elem.disabled = original.disabled;
    });
};