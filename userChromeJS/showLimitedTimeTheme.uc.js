// ==UserScript==
// @name        显示限时主题
// @include     about:addons
// ==/UserScript==
location.href === 'about:addons' && (() => {
  for(const theme of BuiltInThemes.builtInThemeMap) {
    delete theme[1].expiry;
  }
})();