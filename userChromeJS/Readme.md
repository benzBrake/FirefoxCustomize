# userChromeJS

收集并涂改大佬的userChromeJS脚本。

## 说明
自从2020年11月开始就基于 xiaoxiaoflood 的 [userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts/) 来修改脚本。

我的当前 Firefox 版本 Firefox 100.0.1

最低支持 101 版本就会放 101 目录里

### 标志

⛔ 为不可用状态

❌ 仅可以在 xiaoxiaoflood 的 userChromeJS 环境中使用。

Ⓜ️ 仅可以在 MrOtherGuy 的 userChromeJS 环境中使用。

### 脚本列表

PS：源链接不代表真正出处，只是说明原版从哪下载的，没有的就是我写的或者忘记了

V：代表收集、修改时或者测试时的我所使用的最低Firefox版本，并不代表脚本的最低兼容脚本

| ℹ️    | V    | 脚本                                                         | 说明                                                         | 源                                                           |
| ---- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
|      | 68   | [AddBookmarkHere](AddBookmarkHere.uc.js)                     | 添加 "添加书签到此处" 到书签栏右键菜单（仅在 Firefox 100 中测试过），如果想使用 WebExtension 版[看这里](https://github.com/benzBrake/FirefoxCustomize/tree/master/extensions/addbookmarkhere) |                                                              |
|      | 68   | [addMenuPlus](addMenuPlus)                                   | 自定义火狐菜单，也支持工具按钮移动                           | [📃](https://github.com/ywzhaiqi/userChromeJS/tree/master/addmenuPlus) |
|      | 70   | [AddonsPage](AddonsPage_fx72.uc.js)                          | 附加组件页面管理 userChromeJS 脚本<br />~~xiaoxiaoflod 的 userChromeJS 环境仅可展示，不可管理~~**已经解决**<br />仅在 Firefox 100 中测试过 | [📃](https://u6.getuploader.com/script/download/2051)         |
|      | 100  | [AutoPopup](AutoPopup.uc.js)                                 | 自动弹出菜单，好像是从阳光盒子定制版里拉出来的               |                                                              |
|      | 100  | [BookmarkOpt](BookmarkOpt.uc.js)                             | 书签操作增强，添加”添加书签到此处“和“更新书签为当前网址“<br />融合了`AddBMHere.uc.js`、`AddBookmarkHere.uc.js`、`UpdateBookmarkLite.uc.js`侧边栏添加“复制标题”和“复制链接” |                                                              |
|      | 100  | [browsertoolbox](browsertoolbox.uc.js)                       | 新增一个打开“浏览器内容工具箱”的按钮                         | [📃](https://github.com/Endor8/userChrome.js/blob/master/Firefox-96/browsertoolbox.uc.js) |
| ⛔    | 68   | [downloadPlus](68/downloadPlus.uc.js)                        | 下载功能增强，第三方工具，另存为，复制下载连接（没记错最多支持到73）。 |                                                              |
|      | 98   | [downloadPlus_ff98](downloadPlus/downloadPlus_ff98.uc.js)    | 下载功能增强，保存并打开，第三方工具，另存为<br />复制下载连接，永久删除文件，下载完成播放通知，我主要用另存为和保存并打开，别的功能真的很少用，有问题也别找我，不会修 |                                                              |
| ❌    | 96   | [extensionOptionsMenu](extensionOptionsMenu.uc.js)           | 汉化版拓展管理器                                             | [📃](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js) |
|      | 70   | [KeyChanger](KeyChanger/KeyChanger.uc.js)                    | 自定义按键，配置参考 [_keychanger.js](KeyChanger/_keychanger.js) | [📃](https://github.com/Griever/userChromeJS/blob/master/KeyChanger/KeyChanger.uc.js) |
|      | 100  | [MenubarReplaceWithButton](MenubarReplaceWithButton.uc.js)   | 把主菜单替换成按钮                                           | [📃](https://u6.getuploader.com/script/download/2051)         |
|      | 100  | [movablePanelUIButton](movablePanelUIButton.uc.js)           | 可移动 PanelUI 按钮，改成可热插拔了                          | [📃](https://bbs.kafan.cn/thread-2231475-1-1.html)            |
|      | 100  | [moveReloadIntoUrl](moveReloadIntoUrl.uc.js)                 | 移动刷新按钮到地址栏                                         |                                                              |
|      | 100  | [OpenWith.uc.js](OpenWith.uc.js)                             | 使用其他浏览器打开当前地址                                   | [📃](https://bbs.kafan.cn/thread-2114879-1-1.html)            |
| ❌    | 96   | [privateTab](privateTab.uc.js)                               | 添加无痕标签功能，支持自定义无痕身份的名字                   | [📃](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js) |
|      | 90   | [QuickSnapshot](QuickSnapshot_Mod.uc.js)                     | 可移动多功能截图按钮，改成可热插拔了                         | [📃](https://github.com/runningcheese/RunningCheese-Firefox/blob/master/userChrome.js/QuickSnapshot.uc.js) |
| ❌    | 96   | [rebuild_userChrome](rebuild_userChrome.uc.js)               | 汉化版脚本管理器                                             | [📃]()                                                        |
|      | 98   | [restoreOldStyleCleanHistory](restoreOldStyleCleanHistory.uc.js) | 还原清除历史记录为旧版对话框                                 |                                                              |
|      | 98   | [restoreOldStyleLaunchApp](restoreOldStyleLaunchApplication.uc.js) | 还原调用第三方软件为旧版对话框                               | [📃](https://bbs.kafan.cn/thread-2231355-1-1.html)            |
| ❌    | 96   | [rightClickOpenClipboard](rightClickOpenClipboard.uc.js)     | 右键新增标签页按钮打开剪贴板链接（非链接自动搜索）           |                                                              |
|      | 68   | [saveUCJS](saveUCJS.uc.js)                                   | 快速保存 github 上的 UC 脚本                                 |                                                              |
| ❌    | 96   | [setViewSourceEditor](setViewSourceEditor.uc.js)             | 打开Firefox自动设置编辑器路径（用于便携版FF）                |                                                              |
|      | 100  | [showLimitedTimeTheme](showLimitedTimeTheme.uc.js)           | 主题中心显示过期的限时主题                                   | [📃](https://bbs.kafan.cn/thread-2234549-1-1.html)            |
|      | 90   | [TabPlus](TabPlus.uc.js)                                     | TabMixPlus 极度简陋 userChromeJS 版本<br />需要配置 about:config 才能启用响应功能，不能直接使用<br />PS: Tab Mix Plus 复活了，支持 FF78+ https://github.com/onemen/TabMixPlus | [📃](https://github.com/runningcheese/RunningCheese-Firefox/blob/master/userChrome.js/Tabplus.uc.js) |
|      | 100  | [textZoomPerDomain](textZoomPerDomain_e10s.uc.js)            | 分域名设定字体大小                                           | [📃](https://github.com/alice0775/userChrome.js/blob/master/100/textZoomPerDomain_e10s.uc.js) |
|      | 100  | [ToolbarAutoHide](ToolbarAutoHide.uc.js)                     | 自动隐藏 标签栏/工具栏/书签栏                                | [📃](https://u6.getuploader.com/script/download/2061)         |
|      | 100  | [UndoCloseTabButtonN](UndoCloseTabButtonN.uc.js)             | 查看已关闭的标签页和窗口                                     | [📃](https://u6.getuploader.com/script/download/2043)         |
|      | 70   | [verticalAddOnBar](verticalAddOnBar.uc.js)                   | 增加一个类似 vivaldi 的侧边工具栏                            |                                                              |
|      | 100  | [verticalTabsPane](verticalTabsPane.uc.js)                   | 垂直标签栏，原版只能在 MrOtherGuy 的 UC 环境使用，修改版应该通用了，并且把默认快捷键修改为 Ctrl+F1 了 | [📃](https://github.com/aminomancer/uc.css.js/blob/master/JS/verticalTabsPane.uc.js) |
|      | 100  | [YouGetBtn](YouGetBtn.uc.js)                                 | 鉴于 Video DownloadHelper 下载高清需要付费<br />就做了这个小脚本调用 you-get.exe 下载视频 |                                                              |

下面的不能用了的话，请一定不要找我，因为我不用了，你们可以顺着源链接过去找原作者修复

| ℹ️    | V    | 脚本                                                      | 说明                                                         | 源                                                |
| ---- | ---- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
|      | 68   | [AddBookmarkHere](68/AddBookmarkHere.uc.js)               | 添加 "添加书签到此处" 到书签栏右键菜单（仅在 Firefox 100 中测试过），如果想使用 WebExtension 版[看这里](https://github.com/benzBrake/FirefoxCustomize/tree/master/extensions/addbookmarkhere) |                                                   |
| ⛔    | 70   | [Firefox_ToolBarButtons](70/Firefox_ToolBarButtons.uc.js) | 给Firefox添加20多个按钮，有重启，打开配置文件夹，窗口置顶等  |                                                   |
|      | 100  | [PersonalToolbarAutoHide](PersonalToolbarAutoHide.uc.js)  | 自动隐藏书签栏                                               |                                                   |
|      | 100  | [UpdateBookmarkLite](90/UpdateBookmarkLite.uc.js)         | 给工具栏书签新增替换书签功能                                 | [📃](https://bbs.kafan.cn/thread-2233641-1-1.html) |
