# 适用于 Firefox 135 + 以及更高版本的脚本

如果你的脚本在 Firefox135版本失效，下面可能帮到你

1. // Bug 1937080 Block inline event handlers in Nightly and collect telemetry

   > 报错 Content-Security-Policy：由于违反了下列指令：“script-src-attr 'none' 'report-sample'”，此页面的事件句柄（script-src-attr）无法执行

   禁用用了行内事件触发器，只能通过`addEventListener`来添加事件了

   把

   ```javascript
   item.setAttribute('onxxxx', "fn() { // 函数内容 }");
   ```

   替换为

   ```javascript
   item.addEventListener('xxxx', fn() {
       // 函数内容
   });
   ```