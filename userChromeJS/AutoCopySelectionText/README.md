# AutoCopySelectionText

自动复制选中文本的 Firefox 用户脚本。

## 文件说明

- **AutoCopySelectionText.uc.js** - Firefox 70+ 版本
- **AutoCopySelectionText.uc.mjs** - Firefox 136+ 版本（推荐使用）

## 功能特性

- 自动复制选中的文本
- 当 ScrLk（Scroll Lock）亮起时不复制
- 支持文本框开关
- 支持长按延时
- 支持 Firefox 内置页面

## 配置选项

```javascript
const ACST_COPY_SUCCESS_NOTICE = "Auto Copied!";      // 复制成功提示
const ACST_WAIT_TIME = 0;                              // 等待时间
const ACST_BLACK_LIST = ["input", "textarea"];         // 黑名单
const ACST_SHOW_SUCCESS_NOTICE = true;                 // 显示成功提示
const ACST_COPY_WITHOUT_RELEASE_KEY = false;           // 释放按键前复制
const ACST_COPY_AS_PLAIN_TEXT = false;                 // 纯文本复制
```

## 主项目文档

返回 [主项目 README](../README.md)
