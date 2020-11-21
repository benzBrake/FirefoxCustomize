// ==UserScript==
// @name		设置默认代码编辑器
// @description	设置默认代码编辑器为 Notepad2
// @filename	setViewSourceEditor.uc.js
// @author		Ryan
// @shutdown	UC.setViewSourceEditor.destroy();
// @homepageURL	https://github.com/benzBrake/FirefoxCustomize
// @onlyonce
// ==/UserScript==

// 需要把 Notepad2 放在 local 目录下的 Notepad2 文件夹内
(function () {
    UC.setViewSourceEditor = {
        init: function() {
            xPref.set('view_source.editor.path', _uc.chromedir.path + "\\Local\\Notepad2\\Notepad2.exe");
        },
        destroy: function() {
            xPref.clear('view_source.editor.path');
        }
    }
    UC.setViewSourceEditor.init();
})()
