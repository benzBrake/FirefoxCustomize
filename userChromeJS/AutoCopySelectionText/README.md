# AutoCopySelectionText

自动复制选中文本的 Firefox 用户脚本。

## 文件说明

- **AutoCopySelectionText.uc.mjs** - Firefox 136+ 版本（推荐使用，ESM 模块）
- **AutoCopySelectionText.loader.uc.js** - alice0775 userChrome.js 加载器适配器
- **AutoCopySelectionText.uc.js** - Firefox 70+ 版本（传统 UC 脚本，**不要使用，已经过时**）

### Loader 适配器(**AutoCopySelectionText.loader.uc.js**)作用

`AutoCopySelectionText.uc.mjs `在alice0775 原版 userChrome.js 环境中无法加载，需要使`AutoCopySelectionText.loader.uc.js`来加载`AutoCopySelectionText.uc.mjs`。

**使用场景**：

- 如果您使用的是 alice0775 的 userChrome.js 加载器，需要安装此 loader 文件
- 如果您使用的是支持 ESM 的现代加载器，可以直接加载 `.uc.mjs` 文件，无需 loader

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
