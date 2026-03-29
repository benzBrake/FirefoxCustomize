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

## 配套 CSS

用于仿 Firefox 橙按钮

```css
#navigator-toolbox:has(#TabsToolbar-customization-target > #CopyCat-Btn:first-child) #CopyCat-Btn {
    width: 90px;
    border: none !important;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    padding-inline: 0.5em;
    margin-inline: 0.5em;
    background-clip: padding-box !important;
    height: 32px;
    border-radius: 0 0 6px 6px;

    &>.toolbarbutton-icon {
        list-style-image: url("chrome://devtools/skin/images/browsers/firefox.svg") !important;
        fill: white;
        --toolbarbutton-hover-background: transparent;
        --toolbarbutton-active-background: transparent;
        padding: 0 !important;
        height: 16px !important;
        width: 16px !important;
        appearance: none;
    }

    &::after {
        content: "Firefox";
        display: flex !important;
        display: -moz-box !important;
        align-items: center;
        -moz-box-align: center;
        padding-inline: 4px 0;
        color: white !important;
        font-weight: bold !important;
        text-shadow: 0 0 1px rgba(0, 0, 0, 0.7), 0 1px 1.5px rgba(0, 0, 0, 0.5) !important;
        margin-block: 0px !important;
        border: unset !important;
        box-shadow: unset !important;
        height: 100% !important;
    }

    &:not([open=true]) {
        background-image: linear-gradient(rgb(247, 182, 82), rgb(215, 98, 10) 95%);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset, 0 0 0 1px rgba(255, 255, 255, 0.25) inset;
    }

    &:hover:not([open=true]):not(:active) {
        background-image: radial-gradient(farthest-side at center bottom, rgba(252, 240, 89, 0.5) 10%, rgba(252, 240, 89, 0) 70%), radial-gradient(farthest-side at center bottom, rgb(236, 133, 0), rgba(255, 229, 172, 0)), linear-gradient(rgb(246, 170, 69), rgb(209, 74, 0) 95%);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset, 0 0 2px 1px rgba(250, 234, 169, 0.7) inset, 0 -1px 0 rgba(250, 234, 169, 0.5) inset;
    }

    &[open] {
        background-image: linear-gradient(rgb(246, 170, 69), rgb(209, 74, 0) 95%);
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.4) inset, 0 1px 1px rgba(0, 0, 0, 0.2) inset;
    }
}
```

效果：

![Firefox 橙](images/firefox_orange.png)
