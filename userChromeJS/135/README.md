# 适用于 Firefox 135 + 以及更高版本的脚本

如果你的脚本在 Firefox135 版本失效，下面可能帮到你

1. // Bug 1937080 Block inline event handlers in Nightly and collect telemetry

   > 报错 Content-Security-Policy：由于违反了下列指令：“script-src-attr 'none' 'report-sample'”，此页面的事件句柄（script-src-attr）无法执行

   禁用用了行内事件触发器，只能通过`addEventListener`来添加事件了

   把

   ```javascript
   item.setAttribute("onxxxx", "fn() { // 函数内容 }");
   ```

   替换为

   ```javascript
   item.addEventListener('xxxx', fn() {
       // 函数内容
   });
   ```

   现在有个问题，比如`CopyCat.uc.js`读取外部配置文件大量使用`onxxx`怎么办?
   这是修改前的函数

   ```
   function applyAttr (e, o = {}, s = []) {
       for (let [k, v] of Object.entries(o)) {
           if (s.includes(k)) continue;
            e.setAttribute(k, v);
       }
       return e;
   }
   ```

   这是修改后的函数，主要是将 inline handler 转换为真的 funciton

   ```
   function applyAttr (e, o = {}, s = []) {
       for (let [k, v] of Object.entries(o)) {
           if (s.includes(k)) continue;
           if (k.startsWith('on')) {
               let fn;
               if (typeof v === 'function') {
                   fn = v;
               } else {
                   if (typeof v === 'string' && (v.startsWith('function') || v.startsWith('async function'))) {
                       fn = new Function(
                           v.match(/\(([^)]*)/)[1],
                           v.replace(v.match(/[^)]*/) + ")", "").replace(/[^{]*\{/, "")
                               .replace(/}$/, '')
                       )
                   } else {
                       fn = new Function('event', v);
                   }
               }
               e.addEventListener(k.slice(2).toLocaleLowerCase(), fn, false);
           } else {
               e.setAttribute(k, v);
           }
       }
       return e;
   }
   ```
