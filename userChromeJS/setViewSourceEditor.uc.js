// ==UserScript==
// @name        setViewSourceEditor.uc.js
// @description 设置默认编辑器为Notepad2，仅兼容 xiaoxiaoflood 的 userChromeJS 环境
// @author      Ryan
// @shutdown    UC.setViewSourceEditor.destroy();
// @homepageURL https://github.com/benzBrake/FirefoxCustomize
// @onlyonce
// ==/UserScript==

// 需要把 Notepad2 放在 配置目录\chrome\resources\bin\Notepad2 文件夹内
(function () {
    UC.setViewSourceEditor = {
        init: function () {
            let UChrm = Services.dirsvc.get('UChrm', Ci.nsIFile);
            xPref.set('view_source.editor.path', UChrm.path + "\\resources\\tools\\Notepad2\\Notepad2.exe");
        },
        destroy: function () {
            xPref.clear('view_source.editor.path');
        }
    }
    UC.setViewSourceEditor.init();
})()
