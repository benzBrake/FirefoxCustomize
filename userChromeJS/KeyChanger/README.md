# KeyChanger

Firefox 下超强自定义快捷键脚本。

默认配置文件为 `profiledir\chrome\_keychanger.js`，可以通过修改`keyChanger.FILE_PATH`来指定配置文件路径。

## 下载安装

[点击这里](KeyChanger.uc.js)下载脚本，保存到`profiledir\chrome`下，然后[点击这里](_keychanger.js)下载默认配置

`KeyChanger_fx70.uc.js`是 JSActor 版本，将来使用可视化配置（目前没时间实现）必须使用这个版本。

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