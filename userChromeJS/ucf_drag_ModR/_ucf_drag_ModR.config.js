({
    version: 1,
    actions: {
        "openLinkForeground": { type: "builtin", name: "open", args: {
  "where": "tab"
} },
        "openLinkBackground": { type: "builtin", name: "open", args: {
  "where": "tabshifted"
} },
        "openLinkCurrent": { type: "builtin", name: "open", args: {
  "where": "current"
} },
        "saveUrl": { type: "builtin", name: "saveUrl", args: {} },
        "copyLinkText": { type: "builtin", name: "copy", args: {
  "valueSource": "linkText"
} },
        "copyValue": { type: "builtin", name: "copy", args: {} },
        "searchDefaultForeground": { type: "builtin", name: "search", args: {
  "engine": "@default",
  "where": "tab"
} },
        "searchDefaultBackground": { type: "builtin", name: "search", args: {
  "engine": "@default",
  "where": "tabshifted"
} },
        "searchBaiduForeground": { type: "builtin", name: "search", args: {
  "engine": "百度",
  "where": "tab"
} },
        "searchBaiduBackground": { type: "builtin", name: "search", args: {
  "engine": "百度",
  "where": "tabshifted"
} },
        "saveText": { type: "builtin", name: "saveText", args: {} },
        "siteSearchCurrent": { type: "builtin", name: "siteSearch", args: {
  "engine": "@default",
  "where": "current"
} },
        "siteSearchForeground": { type: "builtin", name: "siteSearch", args: {
  "engine": "@default",
  "where": "tab"
} },
        "openSimilarSites": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tab",
  "prefix": "https://www.similarsites.com/site/",
  "valueSource": "value",
  "transform": "hostnameNoWWW"
} },
        "openWebArchive": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tab",
  "prefix": "https://web.archive.org/web/*/",
  "valueSource": "value",
  "transform": "hostnameNoWWW"
} },
        "openCambridgeForeground": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tab",
  "prefix": "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/",
  "valueSource": "value",
  "transform": "encode"
} },
        "openCambridgeBackground": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tabshifted",
  "prefix": "https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD/",
  "valueSource": "value",
  "transform": "encode"
} },
        "openGoogleLens": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tab",
  "prefix": "https://lens.google.com/uploadbyurl?url=",
  "valueSource": "value",
  "transform": "encode"
} },
        "openLenso": { type: "builtin", name: "openBuiltUrl", args: {
  "where": "tabshifted",
  "prefix": "https://lenso.ai/en/search-by-url?url=",
  "valueSource": "value",
  "transform": "encode"
} }
    },
    gestures: {
        link: [
            { dir: "U", name: "打开链接（新标签，前台）", action: "searchDefaultForeground" },
            { dir: "R", name: "打开链接（新标签，后台）", action: "openLinkBackground" },
            { dir: "RD", name: "另存链接", action: "saveUrl" },
            { dir: "L", name: "复制链接文本", action: "copyLinkText" },
            { dir: "L", shift: true, name: "复制链接", action: "copyValue" },
            { dir: "D", name: "打开链接（当前标签）", action: "openLinkCurrent" },
            { dir: "LD", name: "以站搜站（新标签，前台）", action: "openSimilarSites" },
            { dir: "LD", shift: true, name: "网页历史（新标签，前台）", action: "openWebArchive" }
        ],
        text: [
            { dir: "U", name: "搜索文本（新标签，前台）", action: "searchDefaultBackground" },
            { dir: "U", shift: true, name: "搜索文本（新标签，后台）", action: "searchDefaultBackground" },
            { dir: "R", name: "百度搜索（新标签，前台）", action: "searchBaiduForeground" },
            { dir: "U", shift: true, name: "百度搜索（新标签，后台）", action: "searchBaiduBackground" },
            { dir: "RD", name: "另存文本", action: "saveText" },
            { dir: "D", name: "站内搜索（当前标签）", action: "siteSearchCurrent" },
            { dir: "D", ctrl: true, name: "站内搜索（新标签，前台）", action: "siteSearchForeground" },
            { dir: "L", name: "复制文本", action: "copyValue" },
            { dir: "LD", name: "剑桥词典（新标签，前台）", action: "openCambridgeForeground" },
            { dir: "LD", shift: true, name: "剑桥词典（新标签，后台）", action: "openCambridgeBackground" }
        ],
        image: [
            { dir: "U", name: "打开图像（新标签，前台）", action: "openLinkForeground" },
            { dir: "R", name: "打开图像（新标签，后台）", action: "openLinkBackground" },
            { dir: "RD", name: "另存图像", action: "saveUrl" },
            { dir: "L", name: "复制图片链接", action: "copyValue" },
            { dir: "LD", name: "谷歌搜图（新标签，前台）", action: "openGoogleLens" },
            { dir: "LD", shift: true, name: "AI 反向图像搜索（新标签，前台）", action: "openLenso" }
        ]
    }
})