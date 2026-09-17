# 适用于 Firefox 127 + 以及更高版本的脚本

如果你的脚本在 Firefox 127 版本失效，下面可能帮到你

## Browser 开头的命令改名

Firefox 127 通过 [Bug 1880914](https://bugzilla.mozilla.org/show_bug.cgi?id=1880914) 将全局作用域中的 `Browser*` 命令迁移到 `BrowserCommands` 对象。例如：

```javascript
BrowserOpenTab();
```

修改为

```javascript
BrowserCommands.openTab();
```

可以使用一个函数适配新老版本：

```javascript
function BrowserEx(command, ...args) {
    if (parseInt(Services.appinfo.version) < 127) {
        const legacyCommand = "Browser" + command[0].toUpperCase() + command.slice(1);
        return window[legacyCommand](...args);
    }
    return BrowserCommands[command](...args);
}
```

比如要刷新网页：

```javascript
BrowserEx("reload");
```

1.把所有

```
let where = window.whereToOpenLink(aEvent, false, true); 
```

修改为

```
let where = (BrowserUtils || window).whereToOpenLink(aEvent, false, true); 
```

2.把所有

```
let historyPopup = document.getElementById('goPopup');
```

修改为

```
let historyPopup = document.getElementById('historyMenuPopup') || document.getElementById('goPopup');
```

如果你不需要向下兼容，按需删除`||`后的内容 

