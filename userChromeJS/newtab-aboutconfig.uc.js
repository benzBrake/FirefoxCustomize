// ==UserScript==
// @name            newtab-aboutconfig.uc.js
// @description     Restore browser.newtab.url in about:config
// @author          TheRealPSV
// @include         main
// @shutdown        window.NewTabAboutConfig.destroy();
// @onlyonce
// @compatibility   Firefox 136
// @version         1.0.0
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize
// @downloadURL     https://github.com/benzBrake/FirefoxCustomize/raw/refs/heads/master/userChromeJS/newtab-aboutconfig.uc.js
// @originalURL     https://github.com/xiaoxiaoflood/firefox-scripts/raw/refs/heads/master/chrome/newtab-aboutconfig.uc.js
// ==/UserScript==
if (!window.NewTabAboutConfig) {
  const { AboutNewTab } = ChromeUtils.importESModule(
    "resource:///modules/AboutNewTab.sys.mjs"
  );

  window.NewTabAboutConfig = {
    NEW_TAB_CONFIG_PATH: "browser.newtab.url",
    init: function () {
      // 获取偏好值，如果存在
      let prefValue = Services.prefs.getStringPref(this.NEW_TAB_CONFIG_PATH, "");
      this.newTabURL = prefValue;

      // 如果偏好值不存在，则设置为默认值 about:blank
      if (!this.newTabURL) {
        this.newTabURL = "about:blank";
        Services.prefs.setStringPref(this.NEW_TAB_CONFIG_PATH, this.newTabURL);
      }

      // 设置浏览器的主页，并添加监听以在配置更改时更新
      try {
        AboutNewTab.newTabURL = this.newTabURL;
        this.prefObserver = {
          observe: (subject, topic, data) => {
            if (topic === "nsPref:changed" && data === this.NEW_TAB_CONFIG_PATH) {
              let newValue = Services.prefs.getStringPref(this.NEW_TAB_CONFIG_PATH, "");
              AboutNewTab.newTabURL = newValue;
            }
          }
        };
        Services.prefs.addObserver(this.NEW_TAB_CONFIG_PATH, this.prefObserver);
      } catch (e) {
        console.error(e);
      } // Browser Console
    },

    destroy: function () {
      Services.prefs.removeObserver(this.NEW_TAB_CONFIG_PATH, this.prefObserver);
    },
  };

  window.NewTabAboutConfig.init();
}
