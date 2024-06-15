# 适用于 Firefox 127 + 以及更高版本的脚本

如果你的脚本在 Firefox 127 版本失效，下面可能帮到你

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

