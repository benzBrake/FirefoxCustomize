# 适用于 Firefox 139 + 以及更高版本的脚本

如果你的脚本在 Firefox 139 版本失效，下面可能帮到你

1. call to Function() blocked by CSP

   往脚本注解加入

   ```
   @sandbox     true
   ```

   即可解决大部分，如果实在不行，可以使用这个函数来运行函数字符串

   ```
   const runJS = (code, sandbox = window) => {
       try {
           Services.scriptloader.loadSubScript("data:application/javascript;," + encodeURIComponent(code), sandbox);
       } catch (e) {
           console.error(e);
       }
   }
   ```
   
   
