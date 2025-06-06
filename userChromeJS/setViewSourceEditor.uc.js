// ==UserScript==
// @name        setViewSourceEditor.uc.js
// @description 设置默认编辑器为Notepad2
// @author      Ryan
// @shutdown    window.setViewSourceEditor.destroy();
// @homepageURL https://github.com/benzBrake/FirefoxCustomize
// @onlyonce
// ==/UserScript==

// 需要把 Notepad2 放在 配置目录\chrome\UserTools\NotePad2文件夹内
(function () {
    window.setViewSourceEditor = {
        init: function () {
            let targetPath = PathUtils.join(PathUtils.profileDir, "chrome", "UserTools", "NotePad2", "Notepad2.exe");
            let targetFile = new FileUtils.File(targetPath);
            if (targetFile.exists()) {
                Services.prefs.setStringPref('view_source.editor.path', targetPath);
            }
        },
        destroy: function () {
            Services.prefs.setStringPref('view_source.editor.path', "");
        }
    }
    window.setViewSourceEditor.init();
})()
