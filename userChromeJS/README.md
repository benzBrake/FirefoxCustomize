# userChromeJS

收集并涂改大佬的userChromeJS脚本。

## Why stopped updating the script?

I'm short of money, so I'm busy making money now. Currently I can only try to fix the scripts to ESR 128.

## Want to support this project?

**[[ Paypal Me \]](https://www.paypal.me/brakepay)** [ **[Buy me a coffee](https://www.buymeacoffee.com/buyryanacoffie)** ]

## 说明

~~自从2020年11月开始就基于 xiaoxiaoflood 的 [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts/) 来修改脚本。~~

自从 2022年12月1日开始基于 [alice0775](https://github.com/alice0775/userChrome.js) 的 UC 环境来修脚本。

Since December 1, 2022, I have been modifying scripts based on [alice0775's](https://github.com/alice0775/userChrome.js) userChrome.js Loader.

你可以安装我打包好的 [UC 环境](Loader)，从2024年5月7日起，我这里打包的 UC环境有限度的兼容[@xiaoxiaoflood/firefox-scripts](https://github.com/xiaoxiaoflood/firefox-scripts)和[@aminomancer/uc.css.js](https://github.com/aminomancer/uc.css.js)这两个仓库的脚本，并且也能安装适配过的传统扩展。

You can install my packaged [userChrome.js Loader](Loader). Starting from May 7, 2024, the userChrome.js Loader here has limited compatibility with scripts from [@xiaoxiaoflood/firefox-scripts](https://github.com/xiaoxiaoflood/firefox-scripts) and [@aminomancer/uc.css.js](https://github.com/aminomancer/uc.css.js) repositories, and can also install adapted legacy extensions.

我的当前 Firefox 版本 Firefox 143.0b6。

My current Firefox version is Firefox 143.0b6.

最低支持 Firefox 101 的脚本就会放 101 目录里，不过版本可能不太准确。

Scripts that support Firefox 101 at minimum will be placed in the 101 directory, although the version may not be accurate.

## 使用 Claude Code 修改脚本

本项目包含详细的 [CLAUDE.md](CLAUDE.md) 开发规范文档，定义了：

- **@compatibility 规则**：脚本的最低兼容 Firefox 版本规范
- **@note 规则**：脚本修改历史记录格式
- **@compatibility 变更工作流**：版本升级时的归档和修改流程
- **版本兼容性文档清单**：Firefox 126/127/129/135/136/139/147/149 等版本的 API 变化参考

**使用方法：**

在与 Claude Code 对话时，可以直接这样说：

> 请遵循项目根目录的 CLAUDE.md 规范文档修改代码

Claude Code 会自动：
- 遵循 `@compatibility` 和 `@note` 格式规范
- 在升级兼容性版本时自动归档旧版本
- 参考对应版本的兼容性文档进行 API 修改
- 使用符合项目规范的提交信息格式

这样可以确保脚本修改始终遵循项目的统一规范。

### 标志

⛔ 为不可用状态

🅰️ 仅可以在 [alice0775](https://github.com/alice0775/userChrome.js) 的 userChromeJS 环境中使用。Can only be used in [alice0775's](https://github.com/alice0775/userChrome.js) userChrome.js Loader.

❌ 仅可以在 [xiaoxiaoflood](https://github.com/xiaoxiaoflood/firefox-scripts/) 的 userChromeJS 环境中使用。Can only be used in [xiaoxiaoflood's](https://github.com/xiaoxiaoflood/firefox-scripts/) userChrome.js Loader.

Ⓜ️ 仅可以在 [MrOtherGuy](https://github.com/MrOtherGuy/fx-autoconfig) 的 userChromeJS 环境中使用。Can only be used in [MrOtherGuy](https://github.com/MrOtherGuy/fx-autoconfig)'s userChromeJS environment.

### 脚本列表

PS：源链接不代表真正出处，只是说明原版从哪下载的，没有的就是我写的或者忘记了。

P.S.: The source links do not necessarily represent the true origin, they simply indicate where the original version was downloaded from. If no source is provided, it means that either I wrote it or forgot its origin.

V：代表收集、修改时或者测试时的我所使用的最低Firefox版本，并不代表脚本的最低兼容脚本(兼容更低版本的脚本在版本号文件夹里)

V: Represents the minimum Firefox version I used when collecting, modifying, or testing, and does not necessarily represent the minimum compatible version of the script. Scripts compatible with lower versions are placed in version-specific folders.

| ℹ️    | V    | 脚本                                                         | 说明                                                         | 源                                                           |
| ---- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
|      | 136  | [aboutconfig_menu](136/aboutconfig_menu.uc.js)               | 修改 about:config 配置的快捷菜单                             | [📃](https://github.com/garywill/aboutconfig-menu/raw/refs/heads/master/aboutconfig_menu.uc.js) |
|      | 57   | [addMenuPlus](addMenuPlus)                                   | 自定义火狐菜单，也支持工具按钮移动                           | [📃](https://github.com/ywzhaiqi/userChromeJS/tree/master/addmenuPlus) |
|      | 72   | [AddonsPage](AddonsPage_fx72.uc.js)                          | 附加组件页面管理 userChromeJS 脚本<br />~~xiaoxiaoflod 的 userChromeJS 环境仅可展示，不可管理~~**已经解决**<br />仅在 Firefox 100 中测试过 | [📃](https://u6.getuploader.com/script/download/2051)         |
|      | 72   | [adjustPanelViewPosition](72/adjustPanelViewPosition.uc.js)  | 自动调整弹出面板的位置                                       |                                                              |
|      | 128  | [allow_search_with_empty_text](patchForBug1894910_allow_search_with_empty_text.uc.js) | 恢复搜索栏为空时回车会跳转到搜索页的功能                     | [📃](https://github.com/alice0775/userChrome.js/blob/master/135/patchForBug1894910_allow_search_with_empty_text.uc.js) |
|      | 120  | [AutoCompleteDeleteButton](AutoCompleteDeleteButton.uc.js) | 为网页输入框的表单历史下拉添加删除按钮                       |                                                              |
|      | 90   | [AutoHideTabsToolbar](AutoHideTabsToolbar.uc.js)             | 只有一个标签时隐藏标签栏                                     | [📃](https://forum.mozilla-russia.org/viewtopic.php?id=76642) |
|      | 108  | [BMMultiColumn](BMMultiColumn.uc.js)                         | 多列书签，修复与我的`BookmarkOpt.uc.js`共同使用会报错        | [📃](https://bbs.kafan.cn/thread-2114879-1-1.html)            |
|      | 74   | [BookmarkOpt](BookmarkOpt.uc.js)                             | 书签操作增强，添加”添加书签到此处“和“更新书签为当前网址“<br />融合了`AddBMHere.uc.js`、`AddBookmarkHere.uc.js`、`UpdateBookmarkLite.uc.js`侧边栏添加“复制标题”和“复制链接”<br />增加了一个【显示/隐藏书签工具栏】的按钮<br />低版本Firefox有的功能不能用，建议升级 Firefox |                                                              |
|      | 100  | [browsertoolbox](browsertoolbox.uc.js)                       | 新增一个打开“浏览器内容工具箱”的按钮                         | [📃](https://github.com/Endor8/userChrome.js/blob/master/Firefox-96/browsertoolbox.uc.js) |
|      | 90   | [ColorfulTabs](ColorfulTabs.uc.js)                           | 多彩标签页                                                   |                                                              |
|      |      | [contextMenuSlideDown](contextMenuSlideDown.uc.js)           | 给弹出菜单增加载入动画                                       | [📃](https://github.com/Lockframe/Firefox-WinUI/blob/main/optional-js/contextMenuSlideDown.uc.js) |
|      | 100  | [CopyCat](CopyCat/CopyCat.uc.js)                             | 给 Firefox 增加一个按钮，类似于 AnoBtn                       |                                                              |
|      | 100  | [CopyCatTheme](CopyCatTheme/CopyCatTheme.uc.js)              | 读取 Firefox CSS 主题                                        |                                                              |
|      | 57   | [CopyPlainText](CopyPlainText.uc.js)                         | 右键菜单复制和Ctrl+C强制复制纯文本                           |                                                              |
|      | 108  | [CustomButtons](CustomButtons.uc.js)                         | 替代 [Firefox_ToolBarButtons](70/Firefox_ToolBarButtons.uc.js) |                                                              |
|      |      | [dav_LinkifiesLocationBar](dav_LinkifiesLocationBar.uc.js)   | 多级地址栏，源自 *locationbar2* 扩展                         | [📃](https://github.com/sdavidg/firefoxChromeScripts)         |
|      | 72   | [downloadPlus_ff98](downloadPlus/downloadPlus_ff98.uc.js)    | 下载功能增强，保存并打开，第三方工具，另存为<br />复制下载连接，永久删除文件，下载完成播放通知，我主要用另存为和保存并打开，别的功能真的很少用，有问题也别找我，不会修 |                                                              |
|      | 96   | [ExtensionsOptionsMenu](ExtensionsOptionsMenu)               | 汉化版拓展管理器，两个版本，建议使用通用版                   |                                                              |
|      | 100  | [extensionStylesheetLoader](extensionStylesheetLoader.uc.js) | CSS 无需定义 url 即可应用到 WebExtensions 扩展，原版仅能在MrOtherGuy 的 UC 环境使用 | [📃](https://github.com/aminomancer/uc.css.js/blob/master/JS/extensionStylesheetLoader.uc.js) |
|      | 57   | [HomeEndFixer](HomeEndFixer.uc.js)                           | 让 Home / End 按键全局生效（部分全局鼠标手势软胶通过模拟点击 Home / End 实现回到顶部，前往底部，但是默认情况下焦点在输入框内 Home/ End 按键不生效会导致鼠标手势失效，而这个脚本可以让这两个按键全局生效） |                                                              |
|      | 70   | [KeyChanger](KeyChanger/KeyChanger.uc.js)                    | 自定义按键，配置参考 [_keychanger.js](KeyChanger/_keychanger.js) | [📃](https://github.com/Griever/userChromeJS/blob/master/KeyChanger/KeyChanger.uc.js) |
|      | 90   | [LinkGopher](LinkGopher.uc.js)                               | 提取链接，代替 LinkGopher 扩展                               |                                                              |
|      | 107  | [LocationBar](LocationBar.uc.js)                             | 地址栏内新增一个工具栏                                       |                                                              |
|      | 100  | [MenubarReplaceWithButton](MenubarReplaceWithButton.uc.js)   | 把主菜单替换成按钮                                           | [📃](https://u6.getuploader.com/script/download/2051)         |

下面的不能用了的话，请一定不要找我，因为我不用了，你们可以顺着源链接过去找原作者修复

|  ℹ️   | V    | 脚本                                                         | 说明                                                         |                              源                              |
| :--: | ---- | ------------------------------------------------------------ | ------------------------------------------------------------ | :----------------------------------------------------------: |
|      | 68   | [AddBookmarkHere](68/AddBookmarkHere.uc.js)                  | 添加 "添加书签到此处" 到书签栏右键菜单（仅在 Firefox 100 中测试过），如果想使用 WebExtension 版[看这里](https://github.com/benzBrake/FirefoxCustomize/tree/master/extensions/addbookmarkhere)，已经被 BookmarkOpt.uc.js 替代 |                                                              |
|      | 90   | [addToolbarInsideLocationBar](addToolbarInsideLocationBar.uc.js) | 添加一个地址内工具栏                                         | [📃](https://github.com/alice0775/userChrome.js/blob/master/zzz-addToolbarInsideLocationBar.uc.js) |
|      | 57   | [AutoCopySelectionText](AutoCopySelectionText/AutoCopySelectionText.uc.js) | 自动复制选中文本（ScrLk 亮起时不复制）                       |                                                              |
|      | 57   | [AutoPopup](109/AutoPopup.uc.js)                             | 自动弹出菜单，好像是从阳光盒子定制版里拉出来的               |                                                              |
|      | 69   | [autoPopup++](autoPopup++.uc.js)                             | 自动弹出菜单增强版                                           |      [📃](https://bbs.kafan.cn/thread-1866855-1-1.html)       |
|      | 57   | [ReloadAllTabs](57/ReloadAllTabs.uc.js)                      | 标签页右键菜单添加"刷新所有标签页"（已归档）                  |                                                              |
|      | 127  | [AutoSaveScreenshot](127/AutoSaveScreenshot.uc.js)           | 一键保存截图，左键单击保存可见范围，Shift+左键保存整个页面   | [📃](https://www.camp-firefox.de/forum/thema/138011-automatischer-screenshot/?postID=1250968#post1250968) |
|      | 95   | [bookmarksmenu_scrollbar](bookmarksmenu_scrollbar.uc.js)     | 书签弹出菜单显示滚动条，修改兼容BMMultiColumn.uc.js          | [📃](https://github.com/alice0775/userChrome.js/blob/master/95/bookmarksmenu_scrollbar.uc.js) |
|  ⛔   | 68   | [downloadPlus](68/downloadPlus.uc.js)                        | 下载功能增强，第三方工具，另存为，复制下载连接（没记错最多支持到73）。 |                                                              |
|      | 90   | [downloadsBtnMod](90/downloadsBtnMod.uc.js)                  | 下载按钮功能增强，中键调用 lux.exe/you-get.exe，右键打开下载管理 |                                                              |
|  ⛔   | 70   | [Firefox_ToolBarButtons](70/Firefox_ToolBarButtons.uc.js)    | 给Firefox添加20多个按钮，有重启，打开配置文件夹，窗口置顶等  |                                                              |
|      | 100  | [moveReloadIntoUrl](moveReloadIntoUrl.uc.js)                 | 移动刷新按钮到地址栏                                         |                                                              |
|  ❌   | 78   | [OpenWith](78/OpenWith.uc.js)                                | 使用其他浏览器打开网页                                       |                                                              |
|      | 100  | [PersonalToolbarAutoHide](90/PersonalToolbarAutoHide.uc.js)  | 自动隐藏书签栏                                               |                                                              |
|      | 117  | [BaiduTranslator](117/BaiduTranslator.uc.js)                 | 从DeeplTranslator修改而来，百度翻译选中文本                  |                                                              |
|      | 90   | [QuickSnapshot](90/QuickSnapshot_Mod.uc.js)                  | 可移动多功能截图按钮，改成可热插拔了，被[CustomButtons](CustomButtons.uc.js)替代了 | [📃](https://github.com/runningcheese/RunningCheese-Firefox/blob/master/userChrome.js/QuickSnapshot.uc.js) |
|      | 136  | [revivalOldHistorySidebar](136/revivalOldHistorySidebar.uc.js) | 新版历史侧边栏改回旧版布局                                   | [📃](https://github.com/alice0775/userChrome.js/blob/master/136/revivalOldHistorySidebar.uc.js) |
|  ❌   | 96   | [rightClickOpenClipboard](90/rightClickOpenClipboard.uc.js)  | 右键新增标签页按钮打开剪贴板链接（非链接自动搜索）<br />新窗口不生效，已经被 TabPlus.uc.js 替代 |                                                              |
|      | 90   | [showPersonalToolbarOnDemand](90/showPersonalToolbarOnDemand.uc.js) | 按需显示书签工具栏（主要是为了解决在新标签页在显示书签工具栏的功能不能用于`about:blank`），这个 BUG 已经在 Firefox 108 修复了 |                                                              |
|  ⛔   | 70   | [verticalAddOnBar](70/verticalAddOnBar.uc.js)               | 增加一个类似 vivaldi 的侧边工具栏（已不再使用）             |                                                              |
|  ⛔   | 134  | [verticalTabsPane](134/verticalTabsPane.uc.js)              | 垂直标签栏面板，类似 Edge 的垂直标签页（不再跟随作者更新）     | [📃](https://github.com/aminomancer/uc.css.js/blob/master/JS/verticalTabsPane.uc.js) |
|  ⛔   | 134  | [unreadTabMods](134/unreadTabMods.uc.js)                    | 未读标签页样式增强，添加标记已读/未读菜单（不再跟随作者更新） | [📃](https://github.com/aminomancer/uc.css.js/blob/master/JS/unreadTabMods.uc.js) |
|  ❌   | 78   | [SyncStyles](78/SyncStyles.uc.js)                            | 非浏览器主窗口的窗口自动读取浏览器主窗口 CSS 属性，这个脚本主要是为了 CopyCatTheme.uc.js 服务，已合并，所以不再单独维护 |                                                              |
|      | 100  | [UpdateBookmarkLite](90/UpdateBookmarkLite.uc.js)            | 给工具栏书签新增替换书签功能，已经被 BookmarkOpt.uc.js 替代  |      [📃](https://bbs.kafan.cn/thread-2233641-1-1.html)       |
|      | 90   | [YouGetBtn](90/YouGetBtn.uc.js)                              | 鉴于 Video DownloadHelper 下载高清需要付费<br />就做了这个小脚本调用 you-get.exe 下载视频 |                                                              |

## 特殊说明

（2022.07.01）91.11ESR 安装 [xiaoxiaoflood userChromeJS 环境 6.23 版](https://github.com/xiaoxiaoflood/firefox-scripts/tree/7f4e96000baf44398e7308b0aed24781ec29ea82) 之后，启动Firefox时提示“读取配置文件失败，请联系您的系统管理员”，并且也不能安装老式扩展，可以点[这里](91.11ESR/xiaoxiaoflood)查看可用的版本

## 脚本使用

### sidebarAttrubesDetector.uc.js

Firefox 支持 has 选择器后用不上了，直接使用 CSS 即可：https://github.com/benzBrake/FirefoxCustomize/blob/master/UserStyles/hide_tabstoolbar_when_tst_shown_fx122.css

（别吐槽英文了，瞌睡打的英文）

安装这个 UC 脚本后，浏览器主窗口会增加`sidebarCommand`属性

我主要用来在Tree Style Tab打开的情况下隐藏横向标签栏，参考 CSS 如下：

```css
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #navigator-toolbox {
     display: grid;
     border: none !important;
     grid-template-columns: auto 1fr;
     grid-template-areas: "navbar navbar titlebar" "PersonalToolbar PersonalToolbar PersonalToolbar";
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #TabsToolbar>.toolbar-items {
     visibility: collapse;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #titlebar {
     grid-area: titlebar;
     -moz-appearance: none !important;
     background-color: var(--sidra-toolbar-bgcolor, var(--toolbar-bgcolor));
     background-image: var(--toolbar-bgimage);
     background-clip: padding-box;
     color: var(--toolbar-color);
     height: 100%;
     -moz-box-align: center;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #titlebar {
     -moz-box-orient: horizontal !important;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar:not([inactive="true"])+#TabsToolbar>.titlebar-buttonbox-container {
     visibility: collapse !important;
}
:root:not([chromehidden~="menubar"], [operatingsystem="linux"], [operatingsystem="macosx"]) #main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar:not([inactive])+#TabsToolbar .titlebar-spacer {
     display: none;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar {
     -moz-box-ordinal-group: 3;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar[autohide="true"][inactive="true"]:not([customizing="true"]) {
     max-width: 0 !important;
     min-width: 0 !important;
     width: 0 !important;
     padding: 0 !important;
     margin: 0 !important;
     opacity: 0 !important;
}
:root[inFullscreen] #main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar {
     visibility: visible !important;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar:not([inactive="true"]) {
     background: var(--titlebar-background);
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #main-menubar {
     -moz-box-flex: 1 !important;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar #main-menubar>menu {
     appearance: none !important;
     background-color: transparent !important;
     padding-inline: 2px;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #nav-bar {
     grid-area: navbar;
     max-width: unset;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #urlbar-container {
     max-width: unset !important;
}
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #PersonalToolbar {
     grid-area: PersonalToolbar;
}
/* 总是隐藏标签栏拖拽区域，书签工具栏也可以拖拽的 */
#main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #TabsToolbar .titlebar-spacer, #main-window[sidebarCommand="treestyletab_piro_sakura_ne_jp-sidebar-action"]:not([sidebarHidden="true"]) #toolbar-menubar>spacer {
     width: 0 !important;
     visibility: collapse;
}
```

效果如图所示：

![TST](Screenshots/TST.gif)

## Views Counter

<div align='center'><a href='https://www.websitecounterfree.com'><img src='https://www.websitecounterfree.com/c.php?d=9&id=56124&s=1' border='0' alt='Free Website Counter'></a><br / ><small><a href='https://www.websitecounterfree.com' title="Free Website Counter">Free Website Counter Since:2024.06.30</a></small></div>
