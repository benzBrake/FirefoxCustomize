# userChrome.js 环境



注意：这里是可能不够新，最新的在：https://github.com/benzBrake/userChrome.js-Loader

基于 alice0775 环境打包，引用了Dummy的反签名代码，加入了来自`xiaoxiaoflood/firefox-scripts`环境的 Bootstrap Loader，支持 onlyonce 属性，使用这个 userChrome.js 可以安装适配过的传统扩展，部分适配`xiaoxiaoflood`/`mrOtherGuy`这个两个环境的脚本也可以无需移植就能使用。

之前是从 Firefox 100开始改的，实际上可以向下兼容，具体版本没有测试。

## 如何选择版本

如果你的火狐版本大于 102 请选择`fx100.zip`

如果你的火狐版本大于 72 请选择`fx72.zip`

最后才选择`fx57.zip`

## 如何下载

初次使用 Github 的人大部分不会下载，先进入文件页面，然后点右上角的下载按钮，具体看动图。

![从Github下载文件](download-from-github.gif)

## 使用说明

解压后最多有两个目录

![压缩包预览](zip-preview.png)

`program`目录里的东西要解压到 Firefox.exe 所在目录，`profile`目录里的文件要解压到配置文件夹，具体操作可以参照录像。

https://mp4.ziyuan.wang/view.php/d9d70dc1b8022a0bba92d4dd54abafc9.mp4

#### 如何查找 Firefox.exe 所在目录 和 配置文件夹？看图

**应用程序二进制文件**那一行就是 firefox.exe 的实际路径

![排障信息](support.jpg)

## 安装 userChrome.js 环境后如何安装脚本？

### 从哪里可以下载脚本

| 序号 | 地址                                                         | 程度 |
| ---- | ------------------------------------------------------------ | ---- |
| 1    | https://github.com/alice0775/userChrome.js                   | 100% |
| 2    | https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS | 90%  |
| 3    | https://github.com/Endor8/userChrome.js                      | 大量 |
| 4    | https://github.com/xiaoxiaoflood/firefox-scripts/            | 少量 |
| 5    | https://github.com/aminomancer/uc.css.js/tree/master/JS      | 少量 |
| 6    | https://github.com/Aris-t2/CustomJSforFx                     | 少量 |

具体**下载操作可以参照最上边的动图**。

### 下载脚本后怎么用

下载 `.uc.js` 后缀的文件保存到**配置文件夹**下的**chrome**文件夹下

![安装脚本](install-scripts.png)

## 兼容的传统扩展

https://github.com/xiaoxiaoflood/firefox-scripts/tree/master/extensions

