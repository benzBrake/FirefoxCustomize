# CopyCat

一个 Appmenu.uc.js / anobtn.uc.js 的平替脚本。

## 参考配置

[点击查看参考配置](_copycat.js)，使用参考配置后脚本菜单预览：

![参考配置截图](/images/demo_config.png)

## 使用说明

1. 脚本会在**chrome**目录下创建一个`_copycat.js`，这就是配置文件，如果你想修改路径，在**about:config**中创建一个字符串`userChromeJS.CopyCat.FILE_PATH`，内容填写为配置文件的相对路径，比如`UserConfig\_copycat.js`
2. 如果想隐藏内置的菜单，，在**about:config**中创建一个布尔值`userChromeJS.CopyCat.hideInternal`，并设置为**true**

2. 脚本配置和**addMenuPlus**类似，但略有不同，仅支持**css**指令和**menus**指令

## 配置示例

示例：移动菜单栏

```javascript
// 隐藏不想要的菜单和模块
css(`
#CopyCat-Function-Group, #CopyCat-ChromeFolder-Sep, #CopyCat-InsertPoint, #toolbar-menubar, #toggle_toolbar-menubar, #TabsToolbar > .titlebar-spacer[type="pre-tabs"] {
    display: none;
}
`)
// 隐藏菜单栏后会丢失控制按钮，强制显示
css(`
:root:not([chromehidden~="menubar"], [inFullscreen]) #toolbar-menubar[autohide="false"] + #TabsToolbar > .titlebar-buttonbox-container {
    display: -moz-box !important;
    display: flex !important;
}
`)
menus([
{
    command: 'file-menu',
    image: 'chrome://devtools/content/debugger/images/folder.svg'
}, {
    command: 'edit-menu',
    image: 'chrome://global/skin/icons/edit.svg'
}, {
    command: 'view-menu',
    image: 'chrome://devtools/skin/images/command-frames.svg',
    style: 'fill-opacity: 0;'
}, {
    command: 'history-menu',
    image: 'chrome://browser/skin/history.svg'
}, {
    command: 'bookmarksMenu',
    image: 'chrome://browser/skin/bookmark.svg'
}, {
    command: 'tools-menu',
    image: 'chrome://devtools/skin/images/tool-application.svg'
}, {
    command: 'helpMenu',
    insertAfter: 'CopyCat-MoreTools-Item', // 指定菜单插入位置
    image: 'chrome://global/skin/icons/help.svg'
}    
])
```

