menus([{
    label: "修改配置文件",
    image: 'chrome://browser/skin/preferences/category-general.svg',
    popup: [{
        label: "设置编辑器",
        image: 'chrome://browser/skin/preferences/category-general.svg',
        oncommand: async function () {
            let editor = await new Promise(resolve => {
                let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
                try {
                    fp.init(window.browsingContext, "Select Editor", Ci.nsIFilePicker.modeOpen);
                } catch (e) {
                    fp.init(window, "Select Editor", Ci.nsIFilePicker.modeOpen);
                }
                fp.appendFilters(Ci.nsIFilePicker.filterApps);
                fp.appendFilters(Ci.nsIFilePicker.filterAll);
                fp.open(async (result) => {
                    if (result == Ci.nsIFilePicker.returnOK) {
                        Services.prefs.setComplexValue("view_source.editor.path", Ci.nsIFile, fp.file);
                        resolve(fp.file);
                    } else {
                        resolve(null);
                    }
                })
            });
            let alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
            if (editor) {
                alertsService.showAlertNotification(
                    "chrome://global/skin/icons/info.svg", "CopyCat",
                    "编辑器设置成功", false, "", null);
            } else {
                alertsService.showAlertNotification(
                    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4NCiAgPHBhdGggZmlsbD0iI0UwNEY1RiIgZD0iTTUwNC4xLDI1NkM1MDQuMSwxMTksMzkzLDcuOSwyNTYsNy45QzExOSw3LjksNy45LDExOSw3LjksMjU2QzcuOSwzOTMsMTE5LDUwNC4xLDI1Niw1MDQuMUMzOTMsNTA0LjEsNTA0LjEsMzkzLDUwNC4xLDI1NnoiIC8+DQogIDxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0yODUsMjU2bDcyLjUtODQuMmM3LjktOS4yLDYuOS0yMy0yLjMtMzFjLTkuMi03LjktMjMtNi45LTMwLjksMi4zTDI1NiwyMjIuNGwtNjguMi03OS4yYy03LjktOS4yLTIxLjgtMTAuMi0zMS0yLjNjLTkuMiw3LjktMTAuMiwyMS44LTIuMywzMUwyMjcsMjU2bC03Mi41LDg0LjJjLTcuOSw5LjItNi45LDIzLDIuMywzMWM0LjEsMy42LDkuMiw1LjMsMTQuMyw1LjNjNi4yLDAsMTIuMy0yLjYsMTYuNi03LjZsNjguMi03OS4ybDY4LjIsNzkuMmM0LjMsNSwxMC41LDcuNiwxNi42LDcuNmM1LjEsMCwxMC4yLTEuNywxNC4zLTUuM2M5LjItNy45LDEwLjItMjEuOCwyLjMtMzFMMjg1LDI1NnoiIC8+DQo8L3N2Zz4=", "CopyCat",
                    "编辑器设置失败", false, "", null);
            }

        }
    }, {
        class: 'showText',
        group: [{
            label: "菜单",
            oncommand: async function () {
                if (!window.addMenu) return;
                const regex = /include\("([^"]+)"\)/gm;
                let paths = [];
                paths.push(addMenu.FILE.path);
                let fileExists = await IOUtils.exists(addMenu.FILE.path);
                if (fileExists) {
                    let text = await IOUtils.readUTF8(addMenu.FILE.path), m;
                    while ((m = regex.exec(text)) !== null) {
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        let path = m[1];
                        if (!path.startsWith("\\")) {
                            path = "\\" + path;
                        }
                        paths.push(addMenu.handleRelativePath(path, addMenu.FILE.parent.path));
                    }
                    paths.forEach(p => {
                        setTimeout(async () => {
                            addMenu.edit(await IOUtils.getFile(p));
                        }, 10);
                    })
                }
            },
            flex: "1",
            image: "chrome://browser/skin/menu.svg"
        },
        {
            label: "重新载入配置文件",
            tooltiptext: "重新载入配置文件",
            oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
        }
        ]
    },
    {
        label: "使用横排菜单",
        type: "checkbox",
        pref: "addMenu.Menu.Horizontal.Enabled",
        defaultValue: false,
        postcommand: function () {
            setTimeout(() => {
                addMenu.rebuild(true);
            }, 10);
        }
    },
    {
        class: 'showText',
        group: [{
            label: "快捷键",
            oncommand: "KeyChanger.edit(KeyChanger.FILE);",
            flex: "1",
            image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0gMTcuNjggMi44NDIgTCA5Ljk1IDIuODQyIEwgMi4yMiAyLjg0MiBDIDEuNzQ3IDIuODQyIDEuMzE4IDMuMDM1IDEuMDA3IDMuMzQ3IEMgMC42OTUgMy42NTggMC41MDIgNC4wODggMC41MDIgNC41NiBMIDAuNTAyIDEwLjE0MyBMIDAuNTAyIDE1LjcyNSBDIDAuNTAyIDE2LjE5OCAwLjY5NSAxNi42MjcgMS4wMDcgMTYuOTM4IEMgMS4zMTggMTcuMjUgMS43NDcgMTcuNDQzIDIuMjIgMTcuNDQzIEwgOS45NSAxNy40NDMgTCAxNy42OCAxNy40NDMgQyAxOC4xNTIgMTcuNDQzIDE4LjU4MSAxNy4yNSAxOC44OTMgMTYuOTM4IEMgMTkuMjA0IDE2LjYyNyAxOS4zOTcgMTYuMTk4IDE5LjM5NyAxNS43MjUgTCAxOS4zOTcgMTAuMTQzIEwgMTkuMzk3IDQuNTYgQyAxOS4zOTcgNC4wODggMTkuMjA0IDMuNjU4IDE4Ljg5MyAzLjM0NyBDIDE4LjU4MSAzLjAzNSAxOC4xNTIgMi44NDIgMTcuNjggMi44NDIgWiBNIDE3LjY4IDE1LjcyNSBMIDkuOTUgMTUuNzI1IEwgMi4yMiAxNS43MjUgTCAyLjIyIDEwLjE0MyBMIDIuMjIgNC41NiBMIDkuOTUgNC41NiBMIDE3LjY4IDQuNTYgTCAxNy42OCAxMC4xNDMgWiBNIDcuMzczIDYuMjc4IEwgOC4yMzIgNi4yNzggTCA5LjA5MSA2LjI3OCBMIDkuMDkxIDcuMTM3IEwgOS4wOTEgNy45OTUgTCA4LjIzMiA3Ljk5NSBMIDcuMzczIDcuOTk1IEwgNy4zNzMgNy4xMzcgWiBNIDMuOTM4IDYuMjc4IEwgNC43OTcgNi4yNzggTCA1LjY1NSA2LjI3OCBMIDUuNjU1IDcuMTM3IEwgNS42NTUgNy45OTUgTCA0Ljc5NyA3Ljk5NSBMIDMuOTM4IDcuOTk1IEwgMy45MzggNy4xMzcgWiBNIDYuNTE0IDEzLjE0OSBMIDkuOTUgMTMuMTQ5IEwgMTMuMzg1IDEzLjE0OSBMIDEzLjM4NSAxMy41NzggTCAxMy4zODUgMTQuMDA3IEwgOS45NSAxNC4wMDcgTCA2LjUxNCAxNC4wMDcgTCA2LjUxNCAxMy41NzggWiBNIDEwLjgwOSA2LjI3OCBMIDExLjY2NyA2LjI3OCBMIDEyLjUyNiA2LjI3OCBMIDEyLjUyNiA3LjEzNyBMIDEyLjUyNiA3Ljk5NSBMIDExLjY2NyA3Ljk5NSBMIDEwLjgwOSA3Ljk5NSBMIDEwLjgwOSA3LjEzNyBaIE0gNy4zNzMgOS43MTMgTCA4LjIzMiA5LjcxMyBMIDkuMDkxIDkuNzEzIEwgOS4wOTEgMTAuNTcyIEwgOS4wOTEgMTEuNDMxIEwgOC4yMzIgMTEuNDMxIEwgNy4zNzMgMTEuNDMxIEwgNy4zNzMgMTAuNTcyIFogTSAzLjkzOCA5LjcxMyBMIDQuNzk3IDkuNzEzIEwgNS42NTUgOS43MTMgTCA1LjY1NSAxMC41NzIgTCA1LjY1NSAxMS40MzEgTCA0Ljc5NyAxMS40MzEgTCAzLjkzOCAxMS40MzEgTCAzLjkzOCAxMC41NzIgWiBNIDEwLjgwOSA5LjcxMyBMIDExLjY2NyA5LjcxMyBMIDEyLjUyNiA5LjcxMyBMIDEyLjUyNiAxMC41NzIgTCAxMi41MjYgMTEuNDMxIEwgMTEuNjY3IDExLjQzMSBMIDEwLjgwOSAxMS40MzEgTCAxMC44MDkgMTAuNTcyIFogTSAxNC4yNDQgNi4yNzggTCAxNS4xMDMgNi4yNzggTCAxNS45NjIgNi4yNzggTCAxNS45NjIgNy4xMzcgTCAxNS45NjIgNy45OTUgTCAxNS4xMDMgNy45OTUgTCAxNC4yNDQgNy45OTUgTCAxNC4yNDQgNy4xMzcgWiBNIDE0LjI0NCA5LjcxMyBMIDE1LjEwMyA5LjcxMyBMIDE1Ljk2MiA5LjcxMyBMIDE1Ljk2MiAxMC41NzIgTCAxNS45NjIgMTEuNDMxIEwgMTUuMTAzIDExLjQzMSBMIDE0LjI0NCAxMS40MzEgTCAxNC4yNDQgMTAuNTcyIFoiIHN0eWxlPSIiLz4KPC9zdmc+"
        },
        {
            label: "重新载入配置文件",
            tooltiptext: "重新载入配置文件",
            oncommand: 'setTimeout(function(){ KeyChanger.makeKeyset(true);},10)',
            style: "list-style-image: url(chrome://browser/skin/preferences/category-sync.svg);",
        }
        ]
    }, {
        label: "按钮功能",
        edit: "\\chrome\\UserChromeJS\\miscMods.uc.js"
    }, {
        label: "拖拽手势",
        edit: "\\chrome\\UserChromeJS\\ucf_drag_ModR.uc.js"
    }, {
        label: "新侧边栏网页",
        edit: "\\chrome\\UserConfig\\_sidebar_modoki.json"
    }, {
        label: 'user.js',
        edit: '\\user.js',
    }, {
        label: 'userChrome.css',
        edit: '\\chrome\\userChrome.css'
    }, {
        label: 'userContent.css',
        edit: '\\chrome\\userContent.css'
    },
    {}, {
        label: "便携配置",
        exec: "\\..\\CopyCat.exe",
        text: "-set"
    }
    ]
}, {
    command: "CopyCatTheme-Menu",
    class: 'menu-iconic',
    style: "list-style-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPg0KICA8cGF0aCBkPSJNMTUuNTkzNzUgMi45Njg3NUMxNS4wNjI1IDIuOTg0Mzc1IDE0LjUxNTYyNSAzLjA0Mjk2OSAxMy45Njg3NSAzLjEyNUwxMy45Mzc1IDMuMTI1QzguNjEzMjgxIDMuOTk2MDk0IDQuMzAwNzgxIDguMTkxNDA2IDMuMjE4NzUgMTMuNUMyLjg5NDUzMSAxNS4wMTE3MTkgMi45MTQwNjMgMTYuNDIxODc1IDMuMTI1IDE3LjgxMjVDMy4xMzI4MTMgMTcuODE2NDA2IDMuMTI1IDE3LjgzNTkzOCAzLjEyNSAxNy44NDM3NUMzLjQ1MzEyNSAyMC4xOTE0MDYgNi41IDIxLjIxODc1IDguMjE4NzUgMTkuNUM5LjQ0OTIxOSAxOC4yNjk1MzEgMTEuMjY5NTMxIDE4LjI2OTUzMSAxMi41IDE5LjVDMTMuNzMwNDY5IDIwLjczMDQ2OSAxMy43MzA0NjkgMjIuNTUwNzgxIDEyLjUgMjMuNzgxMjVDMTAuNzgxMjUgMjUuNSAxMS44MDg1OTQgMjguNTQ2ODc1IDE0LjE1NjI1IDI4Ljg3NUMxNC4xNjQwNjMgMjguODc1IDE0LjE4MzU5NCAyOC44NjcxODggMTQuMTg3NSAyOC44NzVDMTUuNTY2NDA2IDI5LjA4NTkzOCAxNi45Njg3NSAyOS4wOTc2NTYgMTguNDY4NzUgMjguNzgxMjVDMTguNDgwNDY5IDI4Ljc4MTI1IDE4LjQ4ODI4MSAyOC43ODEyNSAxOC41IDI4Ljc4MTI1QzIzLjgyNDIxOSAyNy43ODkwNjMgMjguMDA3ODEzIDIzLjM3NSAyOC44NzUgMTguMDYyNUwyOC44NzUgMTguMDMxMjVDMzAuMDA3ODEzIDEwLjM5MDYyNSAyNC40MjE4NzUgMy43MTg3NSAxNy4xNTYyNSAzLjAzMTI1QzE2LjYzNjcxOSAyLjk4MDQ2OSAxNi4xMjUgMi45NTMxMjUgMTUuNTkzNzUgMi45Njg3NSBaIE0gMTUuNjI1IDQuOTY4NzVDMTYuMDc4MTI1IDQuOTUzMTI1IDE2LjUyNzM0NCA0Ljk2MDkzOCAxNi45Njg3NSA1QzIzLjE2NDA2MyA1LjU2NjQwNiAyNy44NzUgMTEuMjE0ODQ0IDI2LjkwNjI1IDE3Ljc1QzI2LjE3NTc4MSAyMi4yMjY1NjMgMjIuNTg1OTM4IDI1Ljk5MjE4OCAxOC4xMjUgMjYuODEyNUwxOC4wOTM3NSAyNi44MTI1QzE2LjgxNjQwNiAyNy4wODU5MzggMTUuNjM2NzE5IDI3LjA4OTg0NCAxNC40Mzc1IDI2LjkwNjI1QzEzLjYxNzE4OCAyNi44MDQ2ODggMTMuMjM4MjgxIDI1Ljg4NjcxOSAxMy45MDYyNSAyNS4yMTg3NUMxNS44NzUgMjMuMjUgMTUuODc1IDIwLjA2MjUgMTMuOTA2MjUgMTguMDkzNzVDMTEuOTM3NSAxNi4xMjUgOC43NSAxNi4xMjUgNi43ODEyNSAxOC4wOTM3NUM2LjExMzI4MSAxOC43NjE3MTkgNS4xOTUzMTMgMTguMzgyODEzIDUuMDkzNzUgMTcuNTYyNUM0LjkxMDE1NiAxNi4zNjMyODEgNC45MTQwNjMgMTUuMTgzNTk0IDUuMTg3NSAxMy45MDYyNUM2LjEwNTQ2OSA5LjQxNzk2OSA5Ljc3MzQzOCA1LjgyNDIxOSAxNC4yNSA1LjA5Mzc1QzE0LjcxODc1IDUuMDIzNDM4IDE1LjE3MTg3NSA0Ljk4NDM3NSAxNS42MjUgNC45Njg3NSBaIE0gMTQgN0MxMi44OTQ1MzEgNyAxMiA3Ljg5NDUzMSAxMiA5QzEyIDEwLjEwNTQ2OSAxMi44OTQ1MzEgMTEgMTQgMTFDMTUuMTA1NDY5IDExIDE2IDEwLjEwNTQ2OSAxNiA5QzE2IDcuODk0NTMxIDE1LjEwNTQ2OSA3IDE0IDcgWiBNIDIxIDlDMTkuODk0NTMxIDkgMTkgOS44OTQ1MzEgMTkgMTFDMTkgMTIuMTA1NDY5IDE5Ljg5NDUzMSAxMyAyMSAxM0MyMi4xMDU0NjkgMTMgMjMgMTIuMTA1NDY5IDIzIDExQzIzIDkuODk0NTMxIDIyLjEwNTQ2OSA5IDIxIDkgWiBNIDkgMTFDNy44OTQ1MzEgMTEgNyAxMS44OTQ1MzEgNyAxM0M3IDE0LjEwNTQ2OSA3Ljg5NDUzMSAxNSA5IDE1QzEwLjEwNTQ2OSAxNSAxMSAxNC4xMDU0NjkgMTEgMTNDMTEgMTEuODk0NTMxIDEwLjEwNTQ2OSAxMSA5IDExIFogTSAyMyAxNkMyMS44OTQ1MzEgMTYgMjEgMTYuODk0NTMxIDIxIDE4QzIxIDE5LjEwNTQ2OSAyMS44OTQ1MzEgMjAgMjMgMjBDMjQuMTA1NDY5IDIwIDI1IDE5LjEwNTQ2OSAyNSAxOEMyNSAxNi44OTQ1MzEgMjQuMTA1NDY5IDE2IDIzIDE2IFogTSAxOSAyMUMxNy44OTQ1MzEgMjEgMTcgMjEuODk0NTMxIDE3IDIzQzE3IDI0LjEwNTQ2OSAxNy44OTQ1MzEgMjUgMTkgMjVDMjAuMTA1NDY5IDI1IDIxIDI0LjEwNTQ2OSAyMSAyM0MyMSAyMS44OTQ1MzEgMjAuMTA1NDY5IDIxIDE5IDIxWiIvPg0KPC9zdmc+);"
},
{
    command: "TabPlus-menu",
    class: 'menu-iconic',
    image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB0cmFuc2Zvcm09InNjYWxlKDEuMTUpIj4NCiAgPHBhdGggZD0iTTUuNzUgM0M1LjM5NSAzIDUuMDY1NzE4OCAzLjE4OTA5MzcgNC44ODY3MTg4IDMuNDk2MDkzOEwzLjEzNjcxODggNi40OTYwOTM4QzMuMDQ3NzE4OCA2LjY0OTA5MzcgMyA2LjgyMyAzIDdMMyAxOUMzIDIwLjEwMyAzLjg5NyAyMSA1IDIxTDEyLjI5NDkyMiAyMUMxMi4xMDU5MjIgMjAuMzY2IDEyIDE5LjY5NSAxMiAxOUw1IDE5TDUgOUwxOSA5TDE5IDEyQzE5LjY5NSAxMiAyMC4zNjYgMTIuMTA1OTIyIDIxIDEyLjI5NDkyMkwyMSA3QzIxIDYuODIzIDIwLjk1MjI4MSA2LjY0OTA5MzggMjAuODYzMjgxIDYuNDk2MDkzOEwxOS4xMTMyODEgMy40OTYwOTM4QzE4LjkzNDI4MSAzLjE4OTA5MzcgMTguNjA1IDMgMTguMjUgM0w1Ljc1IDMgeiBNIDYuMzI0MjE4OCA1TDE3LjY3NTc4MSA1TDE4Ljg0MTc5NyA3TDUuMTU4MjAzMSA3TDYuMzI0MjE4OCA1IHogTSA5IDExTDkgMTNMMTUgMTNMMTUgMTFMOSAxMSB6IE0gMTguMDQ4ODI4IDE0QzE3LjkxOTgyOCAxNCAxNy44MTE4NzUgMTQuMDk2NjA5IDE3Ljc5Njg3NSAxNC4yMjQ2MDlMMTcuNjc5Njg4IDE1LjIzNjMyOEMxNy4xOTU2ODcgMTUuNDA0MzI4IDE2Ljc1NzkwNiAxNS42NjAyODEgMTYuMzc4OTA2IDE1Ljk4ODI4MUwxNS40NDMzNTkgMTUuNTgyMDMxQzE1LjMyNTM1OSAxNS41MzEwMzEgMTUuMTg3MDQ3IDE1LjU3ODQ1MyAxNS4xMjMwNDcgMTUuNjg5NDUzTDE0LjE4NzUgMTcuMzEwNTQ3QzE0LjEyMzUgMTcuNDIxNTQ3IDE0LjE1Mjg1OSAxNy41NjM2MjUgMTQuMjU1ODU5IDE3LjY0MDYyNUwxNS4wNjI1IDE4LjI0MDIzNEMxNS4wMTQ1IDE4LjQ4NzIzNCAxNC45ODQzNzUgMTguNzQgMTQuOTg0Mzc1IDE5QzE0Ljk4NDM3NSAxOS4yNiAxNS4wMTQ1IDE5LjUxMjc2NiAxNS4wNjI1IDE5Ljc1OTc2NkwxNC4yNTU4NTkgMjAuMzU5Mzc1QzE0LjE1Mjg1OSAyMC40MzYzNzUgMTQuMTIyNSAyMC41Nzg0NTMgMTQuMTg3NSAyMC42ODk0NTNMMTUuMTIzMDQ3IDIyLjMxMDU0N0MxNS4xODcwNDcgMjIuNDIyNTQ3IDE1LjMyNTM1OSAyMi40NjcwMTYgMTUuNDQzMzU5IDIyLjQxNjAxNkwxNi4zNzg5MDYgMjIuMDExNzE5QzE2Ljc1NzkwNiAyMi4zNDA3MTkgMTcuMTk1Njg3IDIyLjU5NTY3MiAxNy42Nzk2ODggMjIuNzYzNjcyTDE3Ljc5Njg3NSAyMy43NzUzOTFDMTcuODExODc1IDIzLjkwMzM5MSAxNy45MTk4MjggMjQgMTguMDQ4ODI4IDI0TDE5LjkyMTg3NSAyNEMyMC4wNTA4NzUgMjQgMjAuMTU4ODI4IDIzLjkwMzM5MSAyMC4xNzM4MjggMjMuNzc1MzkxTDIwLjI4OTA2MiAyMi43NjM2NzJDMjAuNzczMDYzIDIyLjU5NTY3MiAyMS4yMTI3OTcgMjIuMzM5NzE5IDIxLjU5MTc5NyAyMi4wMTE3MTlMMjIuNTI3MzQ0IDIyLjQxNzk2OUMyMi42NDUzNDQgMjIuNDY4OTY5IDIyLjc4MzY1NiAyMi40MjE1NDcgMjIuODQ3NjU2IDIyLjMxMDU0N0wyMy43ODMyMDMgMjAuNjg5NDUzQzIzLjg0NzIwMyAyMC41Nzc0NTMgMjMuODE3ODQ0IDIwLjQzNTM3NSAyMy43MTQ4NDQgMjAuMzU5Mzc1TDIyLjkwODIwMyAxOS43NTk3NjZDMjIuOTU2MjAzIDE5LjUxMjc2NiAyMi45ODQzNzUgMTkuMjYgMjIuOTg0Mzc1IDE5QzIyLjk4NDM3NSAxOC43NCAyMi45NTYyMDMgMTguNDg3MjM0IDIyLjkwODIwMyAxOC4yNDAyMzRMMjMuNzE0ODQ0IDE3LjY0MDYyNUMyMy44MTc4NDQgMTcuNTYzNjI1IDIzLjg0ODIwMyAxNy40MjE1NDcgMjMuNzgzMjAzIDE3LjMxMDU0N0wyMi44NDc2NTYgMTUuNjg5NDUzQzIyLjc4MzY1NiAxNS41Nzg0NTMgMjIuNjQ1MzQ0IDE1LjUzMTAzMSAyMi41MjczNDQgMTUuNTgyMDMxTDIxLjU5MTc5NyAxNS45ODgyODFDMjEuMjEyNzk3IDE1LjY2MDI4MSAyMC43NzMwNjIgMTUuNDA0MzI4IDIwLjI4OTA2MiAxNS4yMzYzMjhMMjAuMTczODI4IDE0LjIyNDYwOUMyMC4xNTg4MjggMTQuMDk2NjA5IDIwLjA1MDg3NSAxNCAxOS45MjE4NzUgMTRMMTguMDQ4ODI4IDE0IHogTSAxOC45ODQzNzUgMTdDMjAuMDg4Mzc1IDE3IDIwLjk4NDM3NSAxNy44OTUgMjAuOTg0Mzc1IDE5QzIwLjk4NDM3NSAyMC4xMDQgMjAuMDg4Mzc1IDIxIDE4Ljk4NDM3NSAyMUMxNy44ODAzNzUgMjEgMTYuOTg0Mzc1IDIwLjEwNCAxNi45ODQzNzUgMTlDMTYuOTg0Mzc1IDE3Ljg5NSAxNy44ODAzNzUgMTcgMTguOTg0Mzc1IDE3IHoiLz4NCjwvc3ZnPg=="
}, {
    command: "tabmix-menu"
}, {}, {
    class: 'showFirstText',
    group: [{
        label: "浏览器内容工具箱",
        oncommand: function (event) {
            var doc = event.target.ownerDocument;
            if (!doc.getElementById('menu_browserToolbox')) {
                let {
                    require
                } = Cu.import("resource://devtools/shared/loader/Loader.jsm", {});
                require("devtools/client/framework/devtools-browser");
            };
            doc.getElementById('menu_browserToolbox').click();
        },
        image: "chrome://devtools/skin/images/tool-inspector.svg"
    },
    {
        label: "修复浏览器内容工具箱",
        tooltiptext: "修复浏览器内容工具箱",
        oncommand: function () {
            let targetPath;
            if (CopyCatUtils.appVersion >= 100) {
                // 先记录一下，下边的也能用
                targetPath = PathUtils.join(
                    PathUtils.profileDir,
                    "chrome_debugger_profile"
                );
            } else {
                targetPath = FileUtils.getFile("ProfD", [
                    "chrome_debugger_profile"
                ], false).path;
            }
            IOUtils.setPermissions(targetPath,
                0o660);
            IOUtils.remove(targetPath, {
                recursive: true
            });
        },
        image: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTIwLjcxLDMuMjljLTEuMDQtMS4wNC0yLjUtMS41NS00LjEyLTEuNDVjLTEuNSwwLjEtMi45NSwwLjc0LTMuOTgsMS43N2MtMS4wNiwxLjA2LTEuNDksMi4zNS0xLjI1LDMuNzJjMC4wNCwwLjI0LDAuMSwwLjQ3LDAuMTgsMC43MWwtMy41LDMuNWMtMC4yNC0wLjA4LTAuNDctMC4xNC0wLjcxLTAuMThjLTEuMzctMC4yNC0yLjY2LDAuMTktMy43MiwxLjI1Yy0xLjAzLDEuMDMtMS42NywyLjQ4LTEuNzcsMy45OGMtMC4xLDEuNjIsMC40MSwzLjA4LDEuNDUsNC4xMmMwLjk1LDAuOTUsMi4yNiwxLjQ2LDMuNzEsMS40NmMwLjEzLDAsMC4yNywwLDAuNDEtMC4wMWMxLjUtMC4xLDIuOTUtMC43NCwzLjk4LTEuNzdjMS4wNi0xLjA2LDEuNDktMi4zNSwxLjI1LTMuNzJjLTAuMDQtMC4yNC0wLjEtMC40Ny0wLjE4LTAuNzFsMy41LTMuNWMwLjI0LDAuMDgsMC40NywwLjE0LDAuNzEsMC4xOGMwLjI1LDAuMDUsMC40OSwwLjA3LDAuNzMsMC4wN2MxLjEsMCwyLjEyLTAuNDUsMi45OS0xLjMyYzEuMDMtMS4wMywxLjY3LTIuNDgsMS43Ny0zLjk4QzIyLjI2LDUuNzksMjEuNzUsNC4zMywyMC43MSwzLjI5eiBNMTguOTgsOS45N2MtMC4zOSwwLjM5LTAuNzksMC42My0xLjIzLDAuN2MtMC4yNCwwLjA1LTAuNDgsMC4wNS0wLjc0LDBjLTAuNDYtMC4wOC0wLjk1LTAuMy0xLjQ1LTAuNjVsLTEuNDMsMS40M2wtMi42OCwyLjY4bC0xLjQzLDEuNDNjMC4zNSwwLjUsMC41NywwLjk5LDAuNjUsMS40NWMwLjAyLDAuMTMsMC4wNCwwLjI2LDAuMDQsMC4zOWMwLDAuMS0wLjAxLDAuMi0wLjAyLDAuMjljLTAuMDcsMC40Ni0wLjMxLDAuODgtMC43MSwxLjI4Yy0wLjY5LDAuNjktMS42OCwxLjEyLTIuNywxLjE5Yy0wLjYzNCwwLjA0My0xLjIxNS0wLjA3NC0xLjcyMS0wLjMwNGwyLjE0OC0yLjE0OWMwLjM5MS0wLjM5MSwwLjM5MS0xLjAyMywwLTEuNDE0cy0xLjAyMy0wLjM5MS0xLjQxNCwwbC0yLjE0OCwyLjE0OWMtMC4yMzEtMC41MDYtMC4zNDgtMS4wODgtMC4zMDUtMS43MjJjMC4wNy0xLjAyLDAuNS0yLjAxLDEuMTgtMi42OWMwLjQxLTAuNDEsMC44NC0wLjY1LDEuMy0wLjcxYzAuMDktMC4wMiwwLjE5LTAuMDMsMC4yOS0wLjAzYzAuMTIsMCwwLjI1LDAuMDEsMC4zOCwwLjA0YzAuNDYsMC4wOCwwLjk1LDAuMywxLjQ1LDAuNjVsMS40My0xLjQzbDIuNjgtMi42OGwxLjQzLTEuNDNjLTAuMzUtMC41LTAuNTctMC45OS0wLjY1LTEuNDVjLTAuMDQtMC4yNC0wLjA1LTAuNDYtMC4wMi0wLjY4YzAuMDctMC40NiwwLjMxLTAuODgsMC43MS0xLjI4YzAuNjktMC42OSwxLjY4LTEuMTIsMi43LTEuMTljMC4xLTAuMDEsMC4xOS0wLjAxLDAuMjgtMC4wMWMwLjUzLDAsMS4wMSwwLjEsMS40NCwwLjMxaDAuMDA1bC0yLjE1MywyLjE1M2MtMC4zOTEsMC4zOTEtMC4zOTEsMS4wMjMsMCwxLjQxNEMxNi40ODgsNy45MDIsMTYuNzQ0LDgsMTcsOHMwLjUxMi0wLjA5OCwwLjcwNy0wLjI5M2wyLjE2My0yLjE2M1Y1LjU1YzAuMjMsMC41LDAuMzMsMS4xLDAuMjksMS43M0MyMC4wOSw4LjMsMTkuNjYsOS4yOSwxOC45OCw5Ljk3eiIvPg0KPC9zdmc+"
    }
    ]
}, {
    label: "实用工具",
    image: 'data:image/svg+xml;base64,77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCiAgPHBhdGggZD0iTTcuNjI4OTA2MiAzLjA0Mjk2ODhMNi4yMTQ4NDM4IDQuNDU3MDMxMkwxMS4wOTU3MDMgOS4zMzc4OTA2TDIuNzM2MzI4MSAxNy42OTcyNjZDMS43NTQzMjgxIDE4LjY4MDI2NiAxLjc1MzMyODEgMjAuMjc5NzE5IDIuNzM2MzI4MSAyMS4yNjE3MTlDMy4yMTIzMjgxIDIxLjczODcxOSAzLjg0NjUzMTMgMjIgNC41MTk1MzEyIDIyQzUuMTkyNTMxMyAyMiA1LjgyNDc4MTMgMjEuNzM3NzE5IDYuMzAwNzgxMiAyMS4yNjE3MTlMMTQuNjYwMTU2IDEyLjkwMjM0NEwxOC41ODU5MzggMTYuODI4MTI1TDE5LjI5Mjk2OSAxNi4xMjEwOTRMMjIuODI0MjE5IDEyLjU4OTg0NEwxOC45MTk5MjIgOC42NDQ1MzEyTDIwLjI4MTI1IDcuMjgxMjVMMTkuNjYyMTA5IDYuNjYyMTA5NEwxNy4zMzc4OTEgNC4zMzc4OTA2TDE2LjcxODc1IDMuNzE4NzVMMTUuMzczMDQ3IDUuMDYyNUwxMy4zNzUgMy4wNDI5Njg4TDcuNjI4OTA2MiAzLjA0Mjk2ODggeiBNIDkuNjI4OTA2MiA1LjA0Mjk2ODhMMTIuNTM5MDYyIDUuMDQyOTY4OEwyMC4wMDM5MDYgMTIuNTgyMDMxTDE4LjU4NTkzOCAxNEw5LjYyODkwNjIgNS4wNDI5Njg4IHoiIC8+DQo8L3N2Zz4=',
    closemenu: true,
    contextmenu: false,
    popup: [{
        label: "浏览实用工具",
        exec: "\\chrome\\UserTools"
    }, {}, {
        label: "配置优化",
        exec: '\\chrome\\UserTools\\speedyfox.exe',
    }, {
        label: "鼠标手势",
        exec: '\\chrome\\UserTools\\MouseInc\\MouseInc.exe'
    }, {
        label: "Notepad2",
        exec: '\\chrome\\UserTools\\Notepad2\\Notepad2.exe'
    }, {
        label: "复制扩展清单",
        tooltiptext: "左键：名称 + 相关网页\nShift+左键：Markdown 表格",
        image: "chrome://mozapps/skin/extensions/extension.svg",
        onclick: function (e) {
            e.preventDefault();
            Cu.import("resource://gre/modules/addons/AddonRepository.jsm");
            AddonManager.getAddonsByTypes(['extension']).then(
                addons => {

                    return addons.map(addon => {
                        let data = [],
                            repositoryAddon = AddonRepository._parseAddon(addon);
                        if (addon.isBuiltin) return data;
                        data['url'] = addon.homepageURL || addon.installTelemetryInfo?.sourceURL || '';;
                        ["name", command, "isWebExtension", "version", "isActive"].forEach(k => {
                            data[k] = addon[k] || '';
                        });
                        data['name'] = data['name'].replaceAll('|', '丨');
                        data['description'] = repositoryAddon.fullDescription.replaceAll('|', '丨');
                        return data;
                    });
                }
            ).then(arr => arr = arr.filter(m => !!m.id)).then(arr => {
                let text = e.shiftKey ? "| 名称 | 版本 | 介绍 | 默 | \n| ---- | ---- | ---- | ---- |\n" : "",
                    glue = e.shiftKey ? "|" : " ";
                arr.forEach(item => {
                    let nameWithUrl = item.name;
                    if (item.url) {
                        nameWithUrl = `[${item.name}](${item.url})`;
                    }
                    let line = (e.shiftKey ? [nameWithUrl, item.version, item.description, item.isActive ? '✔' : '✘'] : [item.name, item.version, item.url, item.isActive ? '✔' : '✘']).join(glue);
                    if (e.shiftKey) line = [glue, glue].join(line);
                    text += line + '\n';
                })
                CopyCat.copyText(text);
            });
        }
    }, {
        label: "复制UC脚本清单",
        tooltiptextRef: "左键：名称 + 主页\nShift+左键：Markdown 表格",
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC",
        onclick: function (e) {
            e.preventDefault();
            if (e.button > 0) return;
            var scripts;
            if (window.userChrome_js) {
                scripts = window.userChrome_js.scripts.concat(window.userChrome_js.overlays);

                scripts = scripts.map(script => {
                    let meta = readScriptInfo(script.file);
                    return {
                        filename: script.filename,
                        url: script.url.indexOf("http") === 0 ? script.url : "",
                        isEnabled: !userChrome_js.scriptDisable[this.name],
                        description: script.description,
                        version: meta.version.split(" ")[0],
                        charset: meta.charset,
                        url: meta.homepage || meta.homepageURL || meta.downloadURL || ""
                    }
                });
            } else if (window._uc && !window._uc.isFaked) {
                scripts = Object.values(_uc.scripts);
            } else if (typeof _ucUtils === 'object') {
                scripts = _ucUtils.getScriptData().map(script => {
                    let aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    let path = resolveChromeURL(`chrome://userscripts/content/${script.filename}`);
                    path = path.replace("file:///", "").replace(/\//g, '\\\\');
                    aFile.initWithPath(path);
                    return Object.assign(script, {
                        file: aFile
                    });
                });
                function resolveChromeURL (str) {
                    const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                    try {
                        return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec
                    } catch (e) {
                        console.error(e);
                        return ""
                    }
                }
            }
            let text = e.shiftKey ? "| 名称 | 版本 | 介绍 | 默 | \n| ---- | ---- | ---- | ---- |\n" : "",
                glue = e.shiftKey ? "|" : " ";
            scripts.forEach(item => {
                let line = (e.shiftKey ? [item.url ? `[${item.filename}](${item.url})` : item.filename, item.version, item.description, item.isEnabled ? '✔' : '✘'] : [item.filename, item.url]).join(glue);
                if (e.shiftKey) line = [glue, glue].join(line);
                text += line + '\n';
            })
            CopyCat.copyText(text);

            function readFile (aFile, metaOnly) {
                if (!aFile) {
                    console.error($L("param is invalid", "readFile", "aFile"));
                    return;
                }
                let stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
                stream.init(aFile, 0x01, 0, 0);
                let cvstream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
                cvstream.init(stream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
                let content = '', data = {};
                while (cvstream.readString(4096, data)) {
                    content += data.value;
                    if (metaOnly && (content.indexOf('// ==/UserScript==' || content.indexOf('==/UserStyle=='))) > 0) {
                        break;
                    }
                }
                cvstream.close();
                return content.replace(/\r\n?/g, '\n');
            }

            function readScriptInfo (aFile) {
                let header = readFile(aFile, true);
                let def = ['', ''];
                return {
                    filename: aFile.leafName || '',
                    name: (header.match(/@name\s+(.+)\s*$/im) || def)[1],
                    charset: (header.match(/@charset\s+(.+)\s*$/im) || def)[1],
                    version: (header.match(/@version\s+(.+)\s*$/im) || def)[1],
                    description: (header.match(/@description\s+(.+)\s*$/im) || def)[1],
                    homepage: (header.match(/@homepage\s+(.+)\s*$/im) || def)[1],
                    homepageURL: (header.match(/@homepageURL\s+(.+)\s*$/im) || def)[1],
                    downloadURL: (header.match(/@downloadURL\s+(.+)\s*$/im) || def)[1],
                    updateURL: (header.match(/@updateURL\s+(.+)\s*$/im) || def)[1],
                    optionsURL: (header.match(/@optionsURL\s+(.+)\s*$/im) || def)[1],
                    author: (header.match(/@author\s+(.+)\s*$/im) || def)[1],
                    license: (header.match(/@license\s+(.+)\s*$/im) || def)[1],
                    licenseURL: (header.match(/@licenseURL\s+(.+)\s*$/im) || def)[1],
                }
            }
        }
    }]
}])