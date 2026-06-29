# UserCSSLoader

Firefox userChromeJS 脚本，用于管理 Firefox 界面自定义 CSS。通过 `nsIStyleSheetService` 将样式注入浏览器界面层（等价于 `userChrome.css` / `userContent.css` 的功能），支持样式变量配置、编辑器联动，以及从 GreasyFork 一键安装。

## 和 GreasyFork 上的其他 CSS 有什么区别？

GreasyFork 上大部分 CSS（Stylus/Stylish 系）是用来**修改网页外观**的，而 UserCSSLoader 管理的 CSS 是用来**修改 Firefox 浏览器自身的界面**（工具栏、标签页、地址栏、菜单等）。两者目标完全不同，CSS 选择器和作用域也不同。

简单来说：

| | UserCSSLoader 样式 | GreasyFork 常见 CSS（Stylus 等） |
|--|--|--|
| 作用对象 | Firefox 浏览器界面本身 | 网页内容 |
| 等价于 | `userChrome.css` / `userContent.css` | Stylus / Stylish 扩展的样式 |
| 选择器示例 | `#navigator-toolbox`、`#TabsToolbar`、`.tabbrowser-tab` | `div.post`、`a.link`、`body.dark` |
| 运行环境 | 需要 userChromeJS 加载器 | 需要浏览器扩展 |

## 文件说明

| 文件 | 说明 |
|------|------|
| `UserCSSLoader.uc.js` | 主脚本（Firefox 80+） |
| `UserCSSLoader.sys.mjs` | JSWindow Actor 模块，用于 GreasyFork 远程安装功能 |
| `locales/zh-CN/UserCSSLoader.ftl` | 简体中文语言包 |
| `locales/en-US/UserCSSLoader.ftl` | 英文语言包 |

## 快速开始

1. 将脚本安装到 Firefox（需要 userChromeJS 加载器）
2. 启动 Firefox 后，工具栏会出现 User CSS Loader 按钮
3. 点击按钮 → 打开样式文件夹，放入 `.css` 文件即可生效

## 样式类型

通过文件后缀名区分样式注册到 Firefox 的哪一层：

| 后缀 | 类型 | 说明 |
|------|------|------|
| `.css` | AUTHOR_SHEET | 默认，可影响网页和浏览器界面 |
| `.us.css` | USER_SHEET | 用户层，优先级较高，可覆盖 AUTHOR_SHEET |
| `.ag.css` | AGENT_SHEET | Agent 层，优先级最高，可覆盖所有样式 |

编写 Firefox 界面样式时，通常使用默认的 `.css` 即可；需要覆盖浏览器内置样式时使用 `.ag.css`。

## 样式元数据

在 CSS 文件头部使用 `==UserStyle==` 块声明元数据：

```css
/* ==UserStyle==
 * @name            My Firefox Theme
 * @name:zh-CN       我的 Firefox 主题
 * @description     Customizes Firefox toolbar and tabs appearance
 * @description:zh-CN  自定义 Firefox 工具栏和标签页外观
 * @author          YourName
 * @version         1.0.0
 * @homepageURL     https://github.com/yourname/my-firefox-theme
 * @icon            https://example.com/icon.png
==/UserStyle== */

/* --- 修改 Firefox 界面的 CSS 规则 --- */

#navigator-toolbox {
  background-color: #1a1a2e !important;
}
```

### 支持的字段

| 字段 | 说明 |
|------|------|
| `@name` | 样式名称（支持多语言，如 `@name:zh-CN`） |
| `@description` | 样式描述（支持多语言） |
| `@author` | 作者 |
| `@version` | 版本号 |
| `@homepageURL` | 主页链接（菜单中会显示"打开主页"按钮） |
| `@icon` | 图标 URL（支持 `data:`、`chrome://`、`resource://` 协议） |
| `@downloadURL` | 下载地址 |

## 样式变量 (@var)

UserCSSLoader 支持在元数据中声明样式变量，用户可以在对话框中修改变量值，无需编辑 CSS 文件。

### 语法

```
@var <type> <name> "<label>" <default-value>
```

### 支持的类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `text` | 文本输入框 | `@var text bg_color "Background color" #ff0000` |
| `checkbox` | 复选框（值为 `1` 或 `0`） | `@var checkbox compact "Compact mode" 0` |

### 使用示例

```css
/* ==UserStyle==
 * @name            Compact Toolbar
 * @name:zh-CN       紧凑工具栏
 * @description     Makes the Firefox toolbar more compact
 * @author          YourName
 * @version         1.0.0
 * @var text toolbar_height "Toolbar height" 28px
 * @var text bg_color "Background color" #2b2b2b
 * @var checkbox compact_mode "Compact mode" 0
==/UserStyle== */

#navigator-toolbox {
  --uc-toolbar-height: 28px;
  --uc-bg-color: #2b2b2b;
}
```

变量值注入后，会在样式之前自动插入一段 `:root` 规则来覆盖默认值：

```css
:root {
  --toolbar_height: 40px;
  --bg_color: "#333333";
  --compact_mode: 1;
}
```

变量的配置保存在脚本同目录下的 `UserCSSLoader.json` 文件中。

## 通过 GreasyFork 分享和安装样式

UserCSSLoader 可以直接从 GreasyFork 页面一键安装 Firefox 界面样式。

### 编写可安装的样式

要让样式支持 UserCSSLoader 一键安装，需要满足两个条件：

1. **在 `==UserStyle==` 注释块中添加 `@usercssloader true`**
2. **包含 `@name` 元数据字段**

#### 完整示例

这是一个修改 Firefox 标签页背景色的界面样式：

```css
/* ==UserStyle==
 * @name            Dark Tab Bar
 * @name:zh-CN       深色标签栏
 * @description     Changes the tab bar to a dark theme
 * @description:zh-CN  将标签栏改为深色主题
 * @author          YourName
 * @version         1.0.0
 * @homepageURL     https://github.com/yourname/dark-tab-bar
 * @var text bg_color "Tab bar background" #1a1a2e
 * @usercssloader true
==/UserStyle== */

/* --- 修改 Firefox 界面 --- */

#TabsToolbar {
  background-color: var(--uc-bg-color, #1a1a2e) !important;
}

.tab-background {
  border-radius: 8px 8px 0 0 !important;
}
```

**注意：** `@usercssloader true` 必须放在 `==UserStyle==` 注释块内，避免被 CSS 解析器当作无效的 at-rule 处理。

### 上传到 GreasyFork

1. **注册 GreasyFork 账号**：访问 [greasyfork.org](https://greasyfork.org) 注册
2. **新建脚本**：点击"发布脚本"→"新建脚本"
3. **填写信息**：
   - **名称**：填写样式名称
   - **描述**：务必说明这是 Firefox **界面样式**（非网页样式），例如："Customizes Firefox browser UI - changes tab bar appearance"
   - **代码**：将包含 `@usercssloader true` 的完整 CSS 代码粘贴进去
   - **许可证**：选择合适的开源许可证
4. **分类和标签**：
   - 添加标签 `usercssloader`、`firefox-ui`、`userchromejs`、`firefox-interface` 等关键词，方便区分于网页样式
5. **发布**

### 安装流程

当安装了 UserCSSLoader 的用户访问 GreasyFork 上的样式页面时：

1. UserCSSLoader 的 JSWindow Actor 自动检测页面代码中是否包含 `@usercssloader true` 标记
2. 如果检测到，在页面的安装区域注入绿色的 **「安装到 UserCSSLoader」** 按钮
3. 点击按钮后，确认安装目标文件名
4. CSS 代码被下载并保存到本地样式文件夹（`profile/chrome/UserStyles/`）
5. 通过 `nsIStyleSheetService` 注册，立即生效

安装过程中：
- 如果本地已存在同名文件，会提示是否覆盖
- 如果本地文件内容与远程一致，提示"已重新加载"而非重复写入

> **未安装 UserCSSLoader 的用户**访问该页面时不会看到安装按钮，但仍然可以手动复制代码到本地样式文件夹使用。

## 功能说明

### 按钮操作

| 操作 | 效果 |
|------|------|
| 左键 | 打开样式菜单 |
| 中键 | 启用/禁用所有样式 |
| Shift + 中键 | 重载所有样式 |

### 快捷键

| 快捷键 | 功能 |
|------|------|
| Alt + R | 重载所有样式 |

### 菜单功能

每个样式条目包含以下操作（鼠标悬停显示图标）：

- **启用/禁用**：勾选框切换样式开关（中键点击不关闭菜单）
- **打开主页**：跳转到样式的 `@homepageURL`
- **样式设置**：打开变量配置对话框（仅包含 `@var` 的样式）
- **修改样式类型**：在 AUTHOR_SHEET / USER_SHEET / AGENT_SHEET 之间切换
- **编辑样式**：用外部编辑器打开 CSS 文件
- **删除样式**：删除 CSS 文件

### 编辑器联动

当 `userChromeJS.UserCSSLoader.reloadOnEdit` 为 `true`（默认）时，编辑器关闭后样式会自动重载。

编辑器路径通过 `about:config` 中的 `view_source.editor.path` 设置。

## about:config 配置

| 配置项 | 默认值 | 说明 |
|------|------|------|
| `userChromeJS.UserCSSLoader.FOLDER` | `UserStyles` | CSS 文件夹路径（相对于 chrome 文件夹） |
| `userChromeJS.UserCSSLoader.reloadOnEdit` | `true` | 编辑器关闭后自动重载样式 |
| `userChromeJS.UserCSSLoader.showInToolsMenu` | `false` | 显示在工具菜单中而非工具栏按钮 |
| `userChromeJS.UserCSSLoader.useResourceProtocol` | `false` | 使用 `resource://` 协议加载 CSS |
| `userChromeJS.UserCSSLoader.allDisabled` | `false` | 全局禁用所有样式 |
| `userChromeJS.UserCSSLoader.stylesDisabled` | `[]` | 单独禁用的样式列表（JSON 数组） |

## 主项目文档

返回 [主项目 README](../README.md)
