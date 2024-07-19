### SidebarModoki.uc.js

脚本前边这一段（大约是70行）是定义侧边栏网页的配置项，支持 Firefox 内置页面，扩展页面和网页。

最新版已经支持从 JSON 文件读取：`SM_TABS_FILE: "chrome/UserConfig/_sidebar_modoki.json",`自行修改路径就可以， **JSON 文件不支持注释**，示例文件：[_sidebar_modoki.json](_sidebar_modoki.json)

| 字段         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| addon-id     | 扩展 ID，指明这个Tab要链接到扩展的页面（Firefox 的扩展地址是随机生成的，填写脚本会自动读取对应的地址） |
| src          | 网页地址，支持 Firefox 内置页面，扩展页面和网页。如果填写addon-id，必须填写扩展页面相对地址 |
| image        | 图标地址，支持 Firefox 内置图标，网页图标和base64编码的图标  |
| label        | Tab 名称                                                     |
| data-l10n-id | firefox 多语言属性，自动从对应 ID 读取相应的文本             |
| shortcut     | 快捷键，不知道还管用不，好久没用过了                         |

```
  TABS: [{
    src: "chrome://browser/content/places/bookmarksSidebar.xhtml",
    "data-l10n-id": "library-bookmarks-menu",
    image: "chrome://browser/skin/bookmark-star-on-tray.svg",
    // shortcut: { key: "Q", modifiers: "accel,alt" } // uncomment to enable shortcut
  }, {
    src: "chrome://browser/content/places/historySidebar.xhtml",
    "data-l10n-id": "appmenuitem-history",
    image: "chrome://browser/skin/history.svg",
    shortcut: { key: "h", modifiers: "accel", replace: true }
  }, {
    src: "chrome://browser/content/downloads/contentAreaDownloadsView.xhtml?SM",
    "data-l10n-id": "appmenuitem-downloads",
    image: "chrome://browser/skin/downloads/downloads.svg",
  }],
```

### 自动隐藏（仅支持 2024.07.17之后的版本）

```css
#browser:has(#SM_toolbox[open=true]) {
  position: relative;
}
#SM_toolbox[open=true][style*="--width"] {
  --uc-autohide-sidebar-delay: 600ms; /* Wait 0.6s before hiding sidebar */
  --uc-autohide-transition-duration: 115ms;
  --uc-autohide-transition-type: linear;
  --sidebar-background-color: transparent;
  transition: width var(--uc-autohide-transition-duration) var(--uc-autohide-transition-type) var(--uc-autohide-sidebar-delay);
  will-change: width;
  position: absolute;
  height: 100%;
  top: 0;
  z-index: 1;
  border-top: 1px solid var(--uc-appcontent-border-color, rgb(80, 80, 80));
  min-width: unset;
}
#SM_toolbox[open=true][style*="--width"] > #SM_content {
  width: calc(100% - var(--width));
}
#SM_toolbox[open=true][style*="--width"]:not([positionend=true]) {
  border-right: 1px solid var(--uc-appcontent-border-color, rgb(80, 80, 80));
  left: 0;
}
#SM_toolbox[open=true][style*="--width"]:not([positionend=true]):not([moz-collapsed]) ~ #appcontent {
  margin-inline-start: 34px;
}
#SM_toolbox[open=true][style*="--width"][positionend=true] {
  right: 0;
}
#SM_toolbox[open=true][style*="--width"][positionend=true]:not([moz-collapsed]) ~ #appcontent {
  margin-inline-end: 34px;
}
#SM_toolbox[open=true][style*="--width"]:not(:hover, :focus, :focus-within, :active, [disiable-auto-hide=true]) {
  --width: 34px !important ;
}
#SM_toolbox[open=true][style*="--width"] ~ #SM_splitter {
  visibility: collapse;
}
#SM_toolbox[positionend=true] {
  border-left: 1px solid var(--uc-appcontent-border-color, rgb(80, 80, 80));
}
```

