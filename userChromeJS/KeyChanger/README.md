# KeyChanger

[English Version](README-en.md)

Firefox 下超强自定义快捷键脚本。

## AI 问配置

不会写代码也能轻松配置快捷键！直接向 AI 描述你的需求，AI 会帮你生成对应的配置代码。

### 使用步骤

1. **打开任意 AI 对话工具**（如 ChatGPT、Claude、Kimi、通义千问等）
2. **将脚本源码路径([https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/KeyChanger](https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/KeyChanger))以及 `_keychanger.js` 配置文件的内容发给 AI**，让它先了解当前配置
3. **用自然语言描述你想要的快捷键**，例如：
   - "我想按 F4 复制当前标签页"
   - "我想按 Ctrl+Shift+A 关闭右侧所有标签页"
   - "我想按 Alt+T 打开一个新的标签页并跳转到 Google"
4. **AI 会生成对应的配置代码**，复制代码粘贴到 `_keychanger.js` 中即可
5. **重新载入配置**

### 对话示例

以下是一个真实的 AI 对话截图，演示了如何通过自然语言描述来生成快捷键配置：

![AI 问配置示例](ai_chat_demo.png)

> **提示：** 如果生成的快捷键与已有配置冲突，AI 会提醒你更换组合键。

默认配置文件为 `profiledir\chrome\_keychanger.js`，可以通过修改`keyChanger.FILE_PATH`来指定配置文件路径。

## 下载安装

[点击这里](KeyChanger.uc.js)下载脚本，保存到`profiledir\chrome`下，然后[点击这里](_keychanger.js)下载示例配置

`KeyChanger_fx70.uc.js`是 JSActor 版本，将来使用可视化配置（目前没时间实现）必须使用这个版本（136+暂时无法使用，还没找到修复的办法）。

## 配置格式

### 通用配置格式

```js
keys['CTRL+ALT+P'] = function() {
	// 你的函数
}
```

`CTRL+ALT+P`是你要用到的组合键，`//你的函数`处填写函数代码

### 新版配置格式

`KeyChanger_fx70.uc.js`除了可以使用原来配置格式，还可以使用内置命令方式。

```
keys['F4'] = {
    oncommand: "internal",
    params: [
        'tab',
        'duplicate'
    ]
}; //复制当前标签页
```

目前内置的命令还在持续更新中，将来会写到这个文档里。

### 示例配置

[_keychanger.js](_keychanger.js)