// ==UserScript==
// @name            可移动多功能截图按钮
// @description     修改自 QuickSnapshot.uc.js，可热插拔
// @author          Ryan, Runningcheese
// @include         main
// @shutdown        UC.QuickSnapshot.unload();
// @compatibility   Firefox 90 +
// @homepage        https://github.com/benzBrake/FirefoxCustomize
// @update          2022-04-17 修改为可热插拔（不知道非 xiaoxiaoflood 的 userChrome 环境是否可用）
// @onlyonce
// ==/UserScript==
UC.QuickSnapshot = {
    menuJson: [
        'xul:menupopup',
        { id: 'QuickSnapshot_pop' },
        ['xul:menuitem', {
            label: '隐藏火狐截图',
            oncommand: 'event.stopPropagation(); UC.QuickSnapshot.takeSnapshot(true);',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gNy4zNjcgNC43OCBMIDMuODM3IDQuNzggTCAzLjgzNyA4LjI5NyBMIDUuNjAyIDguMjk3IEwgNS42MDIgNi41MzggTCA3LjM2NyA2LjUzOCBNIDE2LjE5MSA4LjI5NyBMIDE0LjQyNiA4LjI5NyBMIDE0LjQyNiAxMC4wNTUgTCAxMi42NiAxMC4wNTUgTCAxMi42NiAxMS44MTQgTCAxNi4xOTEgMTEuODE0IE0gMTcuOTU1IDEzLjU3MiBMIDIuMDczIDEzLjU3MiBMIDIuMDczIDMuMDIxIEwgMTcuOTU1IDMuMDIxIE0gMTcuOTU1IDEuMjYzIEwgMi4wNzMgMS4yNjMgQyAxLjA5MyAxLjI2MyAwLjMwOCAyLjA0NiAwLjMwOCAzLjAyMSBMIDAuMzA4IDEzLjU3MiBDIDAuMzA4IDE0LjU0MyAxLjA5NyAxNS4zMzIgMi4wNzMgMTUuMzMyIEwgOC4yNDkgMTUuMzMyIEwgOC4yNDkgMTcuMDkgTCA2LjQ4NCAxNy4wOSBMIDYuNDg0IDE4Ljg0OSBMIDEzLjU0NCAxOC44NDkgTCAxMy41NDQgMTcuMDkgTCAxMS43NzggMTcuMDkgTCAxMS43NzggMTUuMzMyIEwgMTcuOTU1IDE1LjMzMiBDIDE4LjkzIDE1LjMzMiAxOS43MiAxNC41NDMgMTkuNzIgMTMuNTcyIEwgMTkuNzIgMy4wMjEgQyAxOS43MiAyLjA1IDE4LjkzIDEuMjYzIDE3Ljk1NSAxLjI2MyIgc3R5bGU9IiIvPgo8L3N2Zz4='
        }],
        ['xul:menuitem', {
            label: '滚动截图工具',
            oncommand: 'event.stopPropagation(); ScreenshotsUtils.notify(window, "shortcut")',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzVhNWE1YSIgc3Ryb2tlLXdpZHRoPSI0IiB0cmFuc2Zvcm09Im1hdHJpeCgwLjQ2MjQ2LCAwLCAwLCAwLjQ2MTE2NiwgLTEuMjMyMjc5LCAtMS4wMTUzNjIpIiBzdHlsZT0iIj4KICAgIDxwYXRoIGQ9Ik0xNiA2SDhhMiAyIDAgMCAwLTIgMnY4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0eWxlPSJzdHJva2U6IHJnYigwLCAwLCAwKTsiLz4KICAgIDxwYXRoIGQ9Ik0xNiA0Mkg4YTIgMiAwIDAgMS0yLTJ2LTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3R5bGU9InN0cm9rZTogcmdiKDAsIDAsIDApOyIvPgogICAgPHBhdGggZD0iTTMyIDQyaDhhMiAyIDAgMCAwIDItMnYtOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgICA8cGF0aCBkPSJNMzIgNmg4YTIgMiAwIDAgMSAyIDJ2OCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgICA8cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjIiIHN0eWxlPSJzdHJva2U6IHJnYigwLCAwLCAwKTsiLz4KICA8L2c+Cjwvc3ZnPg=='
        }],
        ['xul:menuitem', {
            label: '颜色拾取工具',
            oncommand: 'event.stopPropagation(); UC.QuickSnapshot.pickColor();',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIGZpbGw9Im5vbmUiIHRyYW5zZm9ybT0ibWF0cml4KDAuOTAxOTYxLCAwLCAwLCAwLjkwMTk2MSwgLTAuOTk3MzMzLCAtMC43OTcyNzQpIiBzdHlsZT0iIj4KICAgIDxwYXRoIGQ9Ik0xMiAyMmE4IDggMCAwIDEtOC04YzAtMy41MDIgMi43MS02LjMwMyA1LjA5My04Ljg3TDEyIDJsMi45MDcgMy4xM0MxNy4yOSA3LjY5OCAyMCAxMC40OTkgMjAgMTRhOCA4IDAgMCAxLTggOHoiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgPC9nPgo8L3N2Zz4='
        }],
        ['xul:menuseparator', {}],
        ['xul:menuitem', {
            label: '录制动态图片',
            oncommand: 'event.stopPropagation(); UC.QuickSnapshot.captuerGif();',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzVhNWE1YSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHRyYW5zZm9ybT0ibWF0cml4KDAuODEwOTI0LCAwLCAwLCAwLjgwMDE4NywgMC4zMDcyMTEsIDAuNDcwNDkyKSIgc3R5bGU9IiI+CiAgICA8cGF0aCBkPSJNMjMgN2wtNyA1bDcgNVY3eiIgc3R5bGU9InN0cm9rZTogcmdiKDAsIDAsIDApOyIvPgogICAgPHJlY3QgeD0iMSIgeT0iNSIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE0IiByeD0iMiIgcnk9IjIiIHN0eWxlPSJzdHJva2U6IHJnYigwLCAwLCAwKTsiLz4KICA8L2c+Cjwvc3ZnPg=='
        }],
        ['xul:menuitem', {
            label: '完整截图工具',
            oncommand: 'event.stopPropagation(); UC.QuickSnapshot.fsCapture();',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIHN0cm9rZT0iIzVhNWE1YSIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgdHJhbnNmb3JtPSJtYXRyaXgoMC40NjAyMzIsIDAsIDAsIDAuNDYwMjMyLCAtMS4xNzY3MjMsIC0wLjgyNjA3OCkiIHN0eWxlPSIiPgogICAgPHBhdGggZD0iTTYgMTBoMzJ2MzIiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDQuMTA2MjFweDsgc3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgICA8cGF0aCBkPSJNMTAuNTQ4IDM3LjQ1Mkw0Mi4zODUgNS42MTUiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDQuMTA2MjFweDsgc3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgICA8cGF0aCBkPSJNNDIgMzhIMTBWNiIgc3R5bGU9InN0cm9rZS13aWR0aDogNC4xMDYyMXB4OyBzdHJva2U6IHJnYigwLCAwLCAwKTsiLz4KICA8L2c+Cjwvc3ZnPg=='
        }],
        ['xul:menuitem', {
            label: '打开系统画图',
            oncommand: 'event.stopPropagation(); UC.QuickSnapshot.msPaint();',
            class: 'menuitem-iconic',
            image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIHZpZXdCb3g9IjAgMCAyMCAyMCIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTguMzY3IDkuOTIyIEMgMTguMzY3IDkuNjc0IDE4LjI2OSA5LjQzOCAxOC4wOTQgOS4yNjMgTCA5Ljc1MiAwLjkyMSBDIDkuMzg5IDAuNTU3IDguNzk5IDAuNTU3IDguNDM1IDAuOTIxIEwgNS41NDMgMy44MTIgTCAzLjcyOCAxLjk5NyBDIDMuMjIgMS40OSAyLjM1NSAxLjcyMiAyLjE2OSAyLjQxNSBDIDIuMDgzIDIuNzM2IDIuMTc1IDMuMDc5IDIuNDExIDMuMzE0IEwgNC4yMjYgNS4xMjkgTCAwLjk3MSA4LjM4NSBDIDAuMTI0IDkuMjM0IDAuMTI0IDEwLjYwOSAwLjk3MSAxMS40NTggTCA3LjU1OCAxOC4wNDQgQyA4LjQwNiAxOC44OTMgOS43ODIgMTguODkzIDEwLjYzMSAxOC4wNDQgTCAxOC4wOTQgMTAuNTggQyAxOC4yNjkgMTAuNDA1IDE4LjM2NyAxMC4xNjkgMTguMzY3IDkuOTIyIFogTSA5LjMxNCAxNi43MjcgQyA5LjE5MiAxNi44NDggOC45OTYgMTYuODQ4IDguODc1IDE2LjcyNyBMIDIuMjg4IDEwLjE0MSBDIDIuMTY3IDEwLjAyIDIuMTY3IDkuODIzIDIuMjg4IDkuNzAyIEwgNS41NDMgNi40NDcgTCA3LjIzNCA4LjEzNyBDIDYuMzA4IDEwLjA3OCA3LjgzMiAxMi4yOTQgOS45NzcgMTIuMTI1IEMgMTAuNjM5IDEyLjA3MiAxMS4yNjEgMTEuNzg2IDExLjczMSAxMS4zMTcgQyAxMy4yNTIgOS43OTYgMTIuNTU2IDcuMTk5IDEwLjQ3OCA2LjY0MiBDIDkuODM1IDYuNDcgOS4xNTIgNi41MzMgOC41NTEgNi44MiBMIDYuODYxIDUuMTI5IEwgOS4wOTMgMi44OTcgTCAxNi4xMTkgOS45MjIgWiBNIDkuNzU1IDguNDEgQyAxMC40NzIgOC40MSAxMC45MTkgOS4xODcgMTAuNTYgOS44MDcgQyAxMC4yMDEgMTAuNDI3IDkuMzA1IDEwLjQyNiA4Ljk0OCA5LjgwNiBDIDguNzM3IDkuNDQxIDguNzk5IDguOTggOS4wOTcgOC42ODMgQyA5LjI3MSA4LjUwNyA5LjUwOCA4LjQwOSA5Ljc1NSA4LjQwOSBaIE0gMTguMTc1IDEzLjM0IEMgMTcuODExIDEyLjk3NSAxNy4yMjIgMTIuOTc1IDE2Ljg1NyAxMy4zNCBDIDE2LjY3MSAxMy41MjYgMTUuMDMzIDE1LjIxOSAxNS4wMzMgMTcuMTAyIEMgMTUuMDMzIDE5LjAxNCAxNy4xMDIgMjAuMjA5IDE4Ljc1OCAxOS4yNTMgQyAxOS41MjYgMTguODA5IDIwIDE3Ljk5IDIwIDE3LjEwMiBDIDIwIDE1LjIxOSAxOC4zNjIgMTMuNTI2IDE4LjE3NSAxMy4zNCBaIE0gMTcuNTE2IDE3LjcyMyBDIDE3LjE3NCAxNy43MjMgMTYuODk1IDE3LjQ0NSAxNi44OTUgMTcuMTAyIEMgMTYuODk1IDE2LjU2NSAxNy4xOTMgMTUuOTY1IDE3LjUxNSAxNS40ODEgQyAxNy44MzcgMTUuOTY1IDE4LjEzNyAxNi41NjcgMTguMTM3IDE3LjEwMiBDIDE4LjEzNiAxNy40NDUgMTcuODU5IDE3LjcyMyAxNy41MTYgMTcuNzIzIFoiIHN0eWxlPSIiLz4KPC9zdmc+'
        }]
    ],
    jsonToDom: function(json, doc, nodes) {
        var namespaces = {
            html: 'http://www.w3.org/1999/xhtml',
            xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'
        };
        var defaultNamespace = namespaces.html;

        function namespace(name) {
            var m = /^(?:(.*):)?(.*)$/.exec(name);
            return [namespaces[m[1]], m[2]];
        }

        function tag(name, attr) {
            if (Array.isArray(name)) {
                var frag = doc.createDocumentFragment();
                Array.prototype.forEach.call(arguments, function(arg) {
                    if (!Array.isArray(arg[0]))
                        frag.appendChild(tag.apply(null, arg));
                    else
                        arg.forEach(function(arg) {
                            frag.appendChild(tag.apply(null, arg));
                        });
                });
                return frag;
            }

            var args = Array.prototype.slice.call(arguments, 2);
            var vals = namespace(name);
            var elem = doc.createElementNS(vals[0] || defaultNamespace, vals[1]);

            for (var key in attr) {
                var val = attr[key];
                if (nodes && key == 'id')
                    nodes[val] = elem;

                vals = namespace(key);
                if (typeof val == 'function')
                    elem.addEventListener(key.replace(/^on/, ''), val, false);
                else
                    elem.setAttributeNS(vals[0] || '', vals[1], val);
            }
            args.forEach(function(e) {
                try {
                    elem.appendChild(
                        Object.prototype.toString.call(e) == '[object Array]' ?
                        tag.apply(null, e) :
                        e instanceof doc.defaultView.Node ?
                        e :
                        doc.createTextNode(e)
                    );
                } catch (ex) {
                    elem.appendChild(doc.createTextNode(ex));
                }
            });
            return elem;
        }
        return tag.apply(null, json);
    },
    getToolsPath: function(uri) {
        // 获取工具路径
        let path = Services.dirsvc.get('UChrm', Ci.nsIFile).parent.parent.path + "\\Tools";
        if (uri) {
            uri = "\\" + uri;
            uri = uri.replace('\\\\\\\\', '\\\\');
        }
        return path + uri;
    },
    getSysPath(uri) {
        // 获取 Windows 路径
        let path = Services.dirsvc.get('SysD', Ci.nsIFile).path;
        if (uri) {
            uri = "\\" + uri;
            uri = uri.replace('\\\\\\\\', '\\\\');
        }
        return path + uri;
    },
    launchPath: function(path) {
        // 运行文件
        let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
        file.initWithPath(path.replace(/^\./, path));
        file.launch();
    },
    takeSnapshot: function(minimize = false) {
        if (minimize) {
            window.minimize();
        }
        this.launchPath(this.getToolsPath("Snapshot.exe"));
    },
    pickColor: function() {
        this.launchPath(this.getToolsPath("Colors\\Colors.exe"));
    },
    captuerGif: function() {
        this.launchPath(this.getToolsPath("ScreenToGif.exe"));
    },
    fsCapture: function() {
        this.launchPath(this.getToolsPath("FSCapture\\FSCapture.exe"));
    },
    msPaint: function() {
        this.launchPath(this.getSysPath("mspaint.exe"));
    },
    init: function() {
        this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
        CustomizableUI.createWidget({
            id: 'QuickSnapshot',
            defaultArea: CustomizableUI.AREA_NAVBAR,
            label: '截图',
            tooltiptext: '左键：截图\n右键：截图菜单',
            onCreated: function(aNode) {
                aNode.setAttribute('oncommand', 'UC.QuickSnapshot.takeSnapshot();');
                aNode.appendChild(UC.QuickSnapshot.jsonToDom(UC.QuickSnapshot.menuJson, aNode.ownerDocument, {}));
                aNode.setAttribute('contextmenu', 'QuickSnapshot_pop');
            }
        });
        this.setStyle();
        this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
    },
    setStyle: function() {
        this.STYLE = {
            url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
            @-moz-document url('${_uc.BROWSERCHROME}') {
                #QuickSnapshot .toolbarbutton-icon {
                    list-style-image:url(data:image/svg+xml;base64,PHN2ZyB0PSIxNjQ2Nzg2NTg2NTc4IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE0MjMiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij48cGF0aCBkPSJNODg5LjQ3MiAxNDguMjY2NjY3YTQyLjY2NjY2NyA0Mi42NjY2NjcgMCAwIDEtMTMuNTY4IDU4Ljc5NDY2NmwtMjgyLjg4IDE3Ni43MjUzMzQgMTcxLjMwNjY2NyAxMDcuMDA4IDIuMjYxMzMzIDAuMDg1MzMzYTIwMi42NjY2NjcgMjAyLjY2NjY2NyAwIDEgMS0xMTUuNDEzMzMzIDI5Ljc4MTMzM2wtMTM4LjYyNC04Ni41NzA2NjYtMTM5LjE3ODY2NyA4Ni45MTJhMjAyLjY2NjY2NyAyMDIuNjY2NjY3IDAgMSAxLTExMi41NTQ2NjctMzAuMjkzMzM0bDE3MS4yMjEzMzQtMTA2LjkyMjY2Ni0yODIuNzk0NjY3LTE3Ni43MjUzMzRhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMS0xNS45NTczMzMtNTQuNGwyLjM4OTMzMy00LjM5NDY2NmE0Mi42NjY2NjcgNDIuNjY2NjY3IDAgMCAxIDU4Ljc5NDY2Ny0xMy41NjhsMzE4LjA4IDE5OC43ODQgMzE4LjEyMjY2Ni0xOTguNzg0YTQyLjY2NjY2NyA0Mi42NjY2NjcgMCAwIDEgNTguNzk0NjY3IDEzLjU2OHpNMjY2LjY2NjY2NyA1NzZhMTE3LjMzMzMzMyAxMTcuMzMzMzMzIDAgMSAwIDAgMjM0LjY2NjY2NyAxMTcuMzMzMzMzIDExNy4zMzMzMzMgMCAwIDAgMC0yMzQuNjY2NjY3eiBtNDkwLjY2NjY2NiAwYTExNy4zMzMzMzMgMTE3LjMzMzMzMyAwIDEgMCAwIDIzNC42NjY2NjcgMTE3LjMzMzMzMyAxMTcuMzMzMzMzIDAgMCAwIDAtMjM0LjY2NjY2N3oiIHAtaWQ9IjE0MjQiPjwvcGF0aD48L3N2Zz4=);
                }
            }
          `)),
            type: _uc.sss.USER_SHEET
        }
    },
    unload: function() {
        CustomizableUI.destroyWidget('QuickSnapshot');
        this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
        delete UC.QuickSnapshot;
    }
}
UC.QuickSnapshot.init();