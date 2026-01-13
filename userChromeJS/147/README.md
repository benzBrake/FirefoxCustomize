# 适用于 Firefox 147 + 以及更高版本的脚本

如果你的脚本在 Firefox 147 版本失效，下面可能帮到你

1. `showAlertNotification is undefined`

   我看 Bugzilla 好些 bug 报告都没回复，估计不想修 BUG 直接删了？

   可以通过`showAlert`代替

   js脚本开头引入依组件

   ```javascript
   const AlertNotification = Components.Constructor(
     "@mozilla.org/alert-notification;1",
     "nsIAlertNotification",
     "initWithObject"
   );
   ```

   然后之前`showAlertNotification`的地方改一下

   ```javascript
    try {
         const title = 'Message Title';
         const body = 'Message Body';
         const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(
           Ci.nsIAlertsService
         );
   
         /**
          * @backward-compat { version 147 }
          * Remove `alertsService.showAlertNotification` call once Firefox 147
          * makes it to the release channel.
          */
   
         if (Services.vc.compare(AppConstants.MOZ_APP_VERSION, "147.0a1") >= 0) {
           alertsService.showAlert(
             new AlertNotification({
               title,
               text: body,
             })
           );
         } else {
           alertsService.showAlertNotification(null, title, body, false, "", null);
         }
       } catch (err) {
         console.error("Failed to show system notification", err);
       }
     }
   ```

   