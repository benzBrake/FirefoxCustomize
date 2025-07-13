// ==UserScript==
// @name        setViewSourceEditor.uc.js
// @description 设置默认编辑器为Notepad4
// @author      Ryan
// @shutdown    window.setViewSourceEditor.destroy();
// @homepageURL https://github.com/benzBrake/FirefoxCustomize
// @onlyonce
// ==/UserScript==

// 需要把 Notepad4 放在 配置目录\chrome\UserTools\NotePad4文件夹内
(function () {
    window.setViewSourceEditor = {
        originalEditor: "",
        init: function () {
            if (!Services.prefs.getBoolPref('userChromeJS.setViewSourceEditor.enabled', true)) return;
            this.originalEditor = Services.prefs.getStringPref('view_source.editor.path', '');
            let targetPath = PathUtils.join(PathUtils.profileDir, "chrome", "UserTools", "Notepad4", "Notepad4.exe");
            let targetFile = new FileUtils.File(targetPath);
            if (targetFile.exists()) {
                console.log("Set view_source.editor.path to: " + targetPath);
                Services.prefs.setStringPref('view_source.editor.path', targetPath);
            }
            Services.prefs.addObserver('userChromeJS.setViewSourceEditor.enabled', this);
            window.addEventListener("unload", () => {
                this.destroy();
            }, false);
        },
        observe: function (subject, topic) {
            if (topic == 'nsPref:changed' && subject.getBoolPref("userChromeJS.setViewSourceEditor.enabled", true) == false) {
                Services.prefs.removeObserver('userChromeJS.setViewSourceEditor.enabled', this);
                this.destroy();
            }
        },
        destroy: function () {
            console.log("Restore original editor to: " + this.originalEditor);
            Services.prefs.setStringPref('view_source.editor.path', this.originalEditor);
        }
    }
    window.setViewSourceEditor.init();

})()
