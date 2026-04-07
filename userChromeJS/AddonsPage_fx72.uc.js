// ==UserScript==
// @name            AddonsPage.uc.js
// @description     附件组件页面右键新增查看所在目录，详细信息页面新增安装地址或路径，新增 uc脚本管理页面。
// @author          ywzhaiqi
// @include         main
// @charset         utf-8
// @compatibility   Firefox 72
// @version         2026.04.06
// @downloadURL     https://raw.github.com/ywzhaiqi/userChromeJS/master/AddonsPage/AddonsPage.uc.js
// @homepageURL     https://github.com/ywzhaiqi/userChromeJS/tree/master/AddonsPage
// @reviewURL       http://bbs.kafan.cn/thread-1617407-1-1.html
// @optionsURL      about:config?filter=view_source.editor.path
// @note            2026.04.06 Fix multi-window provider handoff and add debug pref
// @note            2025.04.04 Fx137 fix lazy is undefined
// @note            2025.03.08 Add English / Japanese String
// @note            2025.01.31 Remove Cu.import, per Bug 1881888 
// @note            2023.07.12 Removed Services.jsm, per Bug 1780695
// @note            2022.11.18 支持 fx-autoconfig
// @note            2022.10.01 支持隐藏自身
// @note            2022.09.27 Fx106
// @note            2022.02.04 Fx98
// @note            2021.03.31 Fx89
// @note            2021.02.05 Fx87
// @note            2021.01.30 Fx85
// @note            2020.06.28 Fx78
// @note            2019.12.07
// @note            - 附件组件页面右键新增查看所在目录（支持扩展、主题、插件）、复制名字。Greasemonkey、Scriptish 自带已经存在
// @note            - 附件组件详细信息页面新增GM脚本、扩展、主题安装地址和插件路径，右键即复制
// @note            - 新增 uc脚本管理页面
// @note            - uc脚本管理界面
// @note            - 启用禁用需要 rebuild_userChrome.uc.js (已经不需要了)
// @note            - 编辑命令需要首先设置 view_source.editor.path 的路径
// @note            - 图标请自行添加样式，详细信息见主页
// @note            其它信息见主页
// ==/UserScript==
(function () {
    "use strict";

    const Services = globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
    const apLazy = {};
    try {
        ChromeUtils.defineESModuleGetters(apLazy, {
            AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
            AddonManagerPrivate: "resource://gre/modules/AddonManager.sys.mjs",
        });
    } catch (e) {
        XPCOMUtils.defineLazyModuleGetters(apLazy, {
            AddonManager: "resource://gre/modules/AddonManager.jsm",
            AddonManagerPrivate: "resource://gre/modules/AddonManager.jsm",
        });
    }
    if (!window.AddonManager) {
        window.AddonManager = apLazy.AddonManager;
    }
    if (!window.AddonManagerPrivate) {
        window.AddonManagerPrivate = apLazy.AddonManagerPrivate;
    }
    const iconURL = "chrome://mozapps/skin/extensions/extensionGeneric.svg";  // uc 脚本列表的图标
    const AM_FILENAME = Components.stack.filename.split("/").pop().split("?")[0];
    const APP_VERSION = parseFloat(Services.appinfo.version);
    const EXCLUED_SCRIPTS = [AM_FILENAME];
    const LOG_PREFIX = "[AddonsPage_fx72]";
    const UNLOAD_HANDLER_KEY = "__AddonsPageFx72UnloadHandler";
    const DETAIL_OBSERVER_KEY = "__AddonsPageFx72DetailObserver";
    const DETAIL_REFRESH_TIMER_KEY = "__AddonsPageFx72DetailRefreshTimer";
    const DETAIL_REFRESH_TOKEN_KEY = "__AddonsPageFx72DetailRefreshToken";
    const DETAIL_RENDERING_KEY = "__AddonsPageFx72DetailRendering";
    const DEBUG_PREF = "userChromeJS.AddonsPage_fx72.debug";
    const DEBUG = (() => {
        try {
            return Services.prefs.getBoolPref(DEBUG_PREF);
        } catch (e) {
            return false;
        }
    })();

    function debugLog (...args) {
        if (!DEBUG) {
            return;
        }
        try {
            console.log(LOG_PREFIX, ...args);
        } catch (e) {
            try {
                Services.console.logStringMessage([LOG_PREFIX, ...args.map(debugStringify)].join(" "));
            } catch (ex) { }
        }
    }

    function debugWarn (...args) {
        if (!DEBUG) {
            return;
        }
        try {
            console.warn(LOG_PREFIX, ...args);
        } catch (e) {
            debugLog(...args);
        }
    }

    function debugStringify (value) {
        if (typeof value === "string") {
            return value;
        }
        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    }

    if (window.AM_Helper) {  // 修改调试用，重新载入无需重启
        window.AM_Helper.uninit();
        delete window.AM_Helper;
    }
    if (window.userChromeJSAddon) {
        window.userChromeJSAddon.uninit();
        delete window.userChromeJSAddon;
    }
    if (window[UNLOAD_HANDLER_KEY]) {
        window.removeEventListener("unload", window[UNLOAD_HANDLER_KEY], false);
        delete window[UNLOAD_HANDLER_KEY];
    }

    const LANG = {
        "en-US": {
            "set editor path": 'Set the editor path to "view_source.editor.path" in about:config',
            "edit": "Edit",
            "browse directory": "Browse Directory",
            "open url": "Open Install URL",
            "copy name": "Copy Name"
        },
        "ja": {
            "set editor path": "about:configでview_source.editor.pathにエディターのパスを設定してください",
            "edit": "編集",
            "browse directory": "ディレクトリを開く",
            "open url": "インストール元URLを開く",
            "copy name": "名前をコピー"
        },
        'zh-CN': {
            "set editor path": "请打开 about:config 页面并设置 view_source.editor.path 的值为编辑器路径。",
            "edit": "编辑",
            "browse directory": "浏览路径",
            "open url": "打开安装网址",
            "copy name": "复制名称"
        }
    };

    window.AM_Helper = {
        init () {
            document.addEventListener("DOMContentLoaded", this, false);
        },
        uninit () {
            document.removeEventListener("DOMContentLoaded", this, false);
            this.disconnectDetailObserver(document);
            const htmlBrowser = document.getElementById("html-view-browser");
            if (htmlBrowser && htmlBrowser.contentDocument) {
                this.disconnectDetailObserver(htmlBrowser.contentDocument);
            }
        },
        handleEvent (event) {
            switch (event.type) {
                case "DOMContentLoaded":
                    this.onDOMContentLoaded(event);
                    break;

                case "click":
                    this.onClick(event);
                    break;
                case "change":
                    this.onChange(event);
                    break;
            }
        },

        onDOMContentLoaded (event) {
            const doc = event.target;
            if (!["about:addons"].includes(doc.URL))
                return;

            const htmlBrowser = doc.getElementById("html-view-browser");
            if (htmlBrowser) {
                htmlBrowser.addEventListener("load", event => {
                    const cDoc = htmlBrowser.contentDocument;
                    if (cDoc) {
                        this.replace_l10n_setAttributes(cDoc);
                        this.injectCategory(cDoc);
                        this.ensureDetailObserver(cDoc);
                        this.scheduleDetailInfoRefresh(cDoc, "htmlBrowser.load");
                    }
                });

                // Fx85- #html-view要素が無くなってloading属性で遷移検出できなくなったのでイベント駆動に変更
                doc.addEventListener("ViewChanged", event => {
                    const cDoc = htmlBrowser.contentDocument;
                    if (cDoc) {
                        this.ensureDetailObserver(cDoc);
                        this.injectView(cDoc);
                    }
                });

            } else if (doc.querySelector('title[data-l10n-id="addons-page-title"]')) {
                // Fx87-
                this.replace_l10n_setAttributes(doc);
                this.injectCategory(doc);
                this.ensureDetailObserver(doc);
                this.scheduleDetailInfoRefresh(doc, "DOMContentLoaded");

                const loadedEvent = event => {
                    this.injectView(doc);
                };
                doc.addEventListener("ViewChanged", loadedEvent);   // -Fx88
                doc.addEventListener("view-loaded", loadedEvent);   // Fx89-
            }
        },

        browseDir (aAddon) {
            switch (aAddon.type) {
                case "plugin":
                    var pathes = aAddon.pluginFullpath;
                    for (var i = 0; i < pathes.length; i++) {
                        this.revealPath(pathes[i]);
                    }
                    return;
                case "userchromejs":
                    var file = aAddon._script.file;
                    if (file.exists())
                        file.reveal();
                    return;
            }

            // addon
            var nsLocalFile = Components.Constructor("@mozilla.org/file/local;1", "nsIFile", "initWithPath");

            var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
            dir.append("extensions");
            dir.append(aAddon.id);
            var fileOrDir = dir.path + (dir.exists() ? "" : ".xpi");
            try {
                (new nsLocalFile(fileOrDir)).reveal();
            } catch (ex) {
                var addonDir = /.xpi$/.test(fileOrDir) ? dir.parent : dir;
                try {
                    if (addonDir.exists()) {
                        addonDir.launch();
                    }
                } catch (ex) {
                    var uri = Services.io.newFileURI(addonDir);
                    var protSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
                        getService(Ci.nsIExternalProtocolService);
                    protSvc.loadUrl(uri);
                }
            }
        },
        editScript (aAddon) {
            if (aAddon.type == "userchromejs") {
                var path = aAddon._script.file.path;
                this.launchEditor(path);
            }
        },
        launchEditor (path) {
            var editor = Services.prefs.getStringPref("view_source.editor.path");
            if (!editor) {
                alert($L("set editor path"));
                return;
            }

            var appfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            appfile.initWithPath(editor);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            process.init(appfile);
            process.runw(false, [path], 1, {});
        },
        copyName (aAddon) {
            this.copyToClipboard(aAddon.name);
        },

        // Fx78: ローカライズ出来ないと動作しない対策
        replace_l10n_setAttributes (doc) {
            if (!doc.l10n) return;

            const tr1 = {
                "userchromejs-heading": "userChrome JS",
                "addon-category-userchromejs": "userChrome JS", // fx 106
            }
            const tr2 = {
                "userchromejs-enabled-heading": "extension-enabled-heading",
                "userchromejs-disabled-heading": "extension-disabled-heading",
            };

            const true_l10n_setAttributes = doc.l10n.setAttributes;
            doc.l10n.setAttributes = (elem, id, ...args) => {
                if (id in tr1) {
                    elem.textContent = tr1[id];
                } else {
                    if (id in tr2) {
                        id = tr2[id];
                    }
                    true_l10n_setAttributes.call(doc.l10n, elem, id, ...args);
                }
            }
        },

        disconnectDetailObserver (doc) {
            if (!doc) {
                return;
            }

            if (doc[DETAIL_REFRESH_TIMER_KEY] && doc.defaultView) {
                doc.defaultView.clearTimeout(doc[DETAIL_REFRESH_TIMER_KEY]);
                doc[DETAIL_REFRESH_TIMER_KEY] = 0;
            }
            if (doc[DETAIL_OBSERVER_KEY]) {
                try {
                    doc[DETAIL_OBSERVER_KEY].disconnect();
                } catch (e) { }
                delete doc[DETAIL_OBSERVER_KEY];
            }
            delete doc[DETAIL_RENDERING_KEY];
            delete doc[DETAIL_REFRESH_TOKEN_KEY];
        },

        ensureDetailObserver (doc) {
            if (!doc || doc[DETAIL_OBSERVER_KEY] || typeof MutationObserver !== "function") {
                return;
            }

            const root = doc.getElementById("main") || doc.body;
            if (!root) {
                return;
            }

            const observer = new MutationObserver(() => {
                if (doc[DETAIL_RENDERING_KEY]) {
                    return;
                }
                this.scheduleDetailInfoRefresh(doc, "mutation");
            });
            observer.observe(root, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ["current-view", "loading"],
            });
            doc[DETAIL_OBSERVER_KEY] = observer;
            debugLog("ensureDetailObserver(): attached", {
                href: String(doc.URL || ""),
            });
        },

        scheduleDetailInfoRefresh (doc, reason = "unknown", attempt = 0) {
            if (!doc || !doc.defaultView) {
                return;
            }

            const win = doc.defaultView;
            const token = `${Date.now()}:${Math.random()}`;
            doc[DETAIL_REFRESH_TOKEN_KEY] = token;
            if (doc[DETAIL_REFRESH_TIMER_KEY]) {
                win.clearTimeout(doc[DETAIL_REFRESH_TIMER_KEY]);
            }

            const run = () => {
                if (doc[DETAIL_REFRESH_TOKEN_KEY] !== token) {
                    return;
                }

                const applied = this.setUrlOrPath(doc);
                if (!applied && attempt < 8) {
                    const nextAttempt = attempt + 1;
                    const delay = nextAttempt < 3 ? 80 : 160;
                    doc[DETAIL_REFRESH_TIMER_KEY] = win.setTimeout(() => {
                        this.scheduleDetailInfoRefresh(doc, reason, nextAttempt);
                    }, delay);
                    return;
                }

                doc[DETAIL_REFRESH_TIMER_KEY] = 0;
                debugLog("scheduleDetailInfoRefresh(): completed", {
                    reason,
                    attempt,
                    applied,
                });
            };

            doc[DETAIL_REFRESH_TIMER_KEY] = win.setTimeout(run, attempt ? 40 : 0);
        },

        getDetailViewState (doc) {
            const detail = doc.querySelector(
                '#main [current-view="detail"], #main[current-view="detail"], addon-details, #main addon-details'
            );
            const card = (detail && detail.querySelector("addon-card")) ||
                doc.querySelector('#main [current-view="detail"] addon-card, #main[current-view="detail"] addon-card, addon-details addon-card');
            const addon = card && card.addon;
            const section = (detail && detail.querySelector('section[name="details"]')) ||
                doc.querySelector('#main [current-view="detail"] section[name="details"], #main[current-view="detail"] section[name="details"], addon-details section[name="details"]');

            return {
                detail,
                card,
                addon,
                section,
            };
        },

        injectView (doc) {
            const header = doc.getElementById("page-header");
            if (!header) return;
            doc.querySelectorAll("addon-card").forEach(card => {
                const addon = card.addon;
                if (addon.type === "userchromejs") {
                    // 有効・無効スイッチを追加

                    const input = $C(doc, "input", {
                        type: "checkbox",
                        action: "AM-switch",
                        class: "toggle-button extension-enable-button",
                        "data-l10n-id": "extension-enable-addon-button-label",
                        "aria-label": "Enable",
                    });
                    input.checked = !addon.userDisabled;
                    input.addEventListener("click", this, true);
                    input.addEventListener("change", this);

                    const name = card.querySelector(".addon-name-container");
                    name.insertBefore(input, name.querySelector(".more-options-button"));
                }

                /* …メニュー追加 */
                const optionMenu = card.querySelector('panel-list[role="menu"]');
                if (optionMenu) {
                    $C(doc, "panel-item-separator", {}, optionMenu);
                    let item;

                    if (addon.type === "userchromejs") {
                        item = $C(doc, "panel-item", {
                            action: "AM-edit-script",
                            "#text": $L("edit"),
                        }, optionMenu);
                        item.addEventListener("click", this, true);
                    }

                    item = $C(doc, "panel-item", {
                        action: "AM-browse-dir",
                        "#text": $L("browse directory")
                    }, optionMenu);
                    item.addEventListener("click", this, true);

                    if (this.getInstallURL(addon)) {
                        item = $C(doc, "panel-item", {
                            action: "AM-open-url",
                            "#text": $L("open url")
                        }, optionMenu);
                        item.addEventListener("click", this, true);
                    }

                    item = $C(doc, "panel-item", {
                        action: "AM-copy-name",
                        "#text": $L("copy name")
                    }, optionMenu);
                    item.addEventListener("click", this, true);
                }
            });

            this.scheduleDetailInfoRefresh(doc, "injectView");
        },

        injectCategory (doc) {
            // Fx76 about:addonsのサイドバーhtml化でカテゴリーが自動で挿入されなくなった対策
            const cat = doc.getElementById("categories");
            if (cat && !doc.querySelector('.category[name="userchromejs"]')) {
                // 拡張ボタンを複製して作る
                const ucjsBtn = cat.querySelector('.category[name="extension"]').cloneNode(false);
                ucjsBtn.removeAttribute("aria-selected");
                ucjsBtn.removeAttribute("tabindex");
                ucjsBtn.removeAttribute("data-l10n-id");
                ucjsBtn.setAttribute("viewid", "addons://list/userchromejs");
                ucjsBtn.setAttribute("name", "userchromejs");
                ucjsBtn.setAttribute("title", "userChrome JS");

                $C(doc, "span", {
                    class: "category-name",
                    "#text": "userChrome JS"
                }, ucjsBtn);

                const localeBtn = cat.querySelector('.category[name="locale"]');
                localeBtn.parentElement.insertBefore(ucjsBtn, localeBtn);
            }
        },

        getTargetAddon (target) {
            const card = target.closest("[addon-id]");
            return (card && card.addon) ? card.addon : null;
        },

        onClick (event) {
            event.stopPropagation();
            const target = event.target;
            const action = target.getAttribute("action");
            const addon = this.getTargetAddon(target);
            if (action === "AM-open-url") {
                event.preventDefault();
                const href = target.getAttribute("href");
                const url = href || (addon && this.getInstallURL(addon));
                if (url) {
                    this.openUrl(url);
                }
                return;
            }
            if (action && addon) {
                switch (action) {
                    case "AM-edit-script":
                        this.editScript(addon);
                        break;
                    case "AM-browse-dir":
                        this.browseDir(addon);
                        break;
                    case "AM-copy-name":
                        this.copyName(addon);
                        break;

                    case "AM-switch":
                        break;
                }
            }

            const panel = target.closest("panel-list");
            if (panel && panel.hasAttribute("open")) {
                panel.removeAttribute("open");
            }
        },

        onChange (event) {
            event.stopPropagation();
            const target = event.target;
            const addon = this.getTargetAddon(target);
            if (addon) {
                if (target.checked) {
                    addon.enable();
                } else {
                    addon.disable();
                }
            }
        },

        getInstallURL (aAddon) {
            if (!aAddon) return null;

            var url = null;
            switch (aAddon.type) {
                case "extension":
                case "theme":
                    url = (/*aAddon.contributionURL ||*/ aAddon.reviewURL) || null;
                    return url && url.replace(/\/developers|\/reviews/g, "") || (aAddon.creator && aAddon.creator.url);
                case "greasemonkey-user-script":
                    return aAddon._script._downloadURL || aAddon._script._updateURL;
                case "userscript":
                    url = aAddon._downloadURL || aAddon._updateURL;
                    return url;
                case "userchromejs":
                    return aAddon.homepageURL || aAddon.reviewURL || aAddon.downloadURL || aAddon.updateURL;
                default:
                    return aAddon.homepageURL;
            }
        },

        getPath (aAddon) {
            if (!aAddon) return false;

            let path = aAddon.pluginFullpath;
            if (!path && aAddon._script && aAddon._script.file) {
                path = aAddon._script.file.path;
            }
            if (Array.isArray(path)) {
                path = path[0];
            }
            return path || false;
        },

        getOptionsURL (aAddon) {
            if (!aAddon) return null;

            return aAddon.optionsURL ||
                (aAddon._script && aAddon._script.optionsURL) ||
                null;
        },

        getBackendLabel (aAddon) {
            if (!aAddon || !aAddon._backend || !aAddon._backend.kind) {
                return null;
            }

            switch (aAddon._backend.kind) {
                case "userChrome_js":
                    return "userChrome.js";
                case "_uc":
                    return "_uc.js";
                case "_ucUtils":
                    return "_ucUtils";
                default:
                    return aAddon._backend.kind;
            }
        },

        getNoteValue (aAddon) {
            if (!aAddon) {
                return null;
            }

            const value = aAddon.note ||
                aAddon.notes ||
                (aAddon._script && (aAddon._script.note || aAddon._script.notes));
            if (Array.isArray(value)) {
                return value.filter(Boolean).join("\n");
            }
            return value || null;
        },

        getDetailRows (aAddon) {
            if (!aAddon) return [];

            const installURL = this.getInstallURL(aAddon);
            const pluginPath = this.getPath(aAddon);
            const rows = [];
            const pushRow = (id, label, value, isLink = false) => {
                if (!value) return;
                rows.push({ id, label, value, isLink });
            };

            switch (aAddon.type) {
                case "extension":
                case "theme":
                case "greasemonkey-user-script":
                    pushRow("install-page", "安装页面", installURL, true);
                    break;
                case "plugin":
                    pushRow("path", "路径", pluginPath, true);
                    break;
                case "userchromejs":
                    pushRow("path", "路径", pluginPath, true);
                    pushRow("version", "版本", aAddon.version);
                    pushRow("author", "作者", aAddon.author);
                    pushRow("note", "备注", this.getNoteValue(aAddon));
                    pushRow("review", "评论页面", aAddon.reviewURL, true);
                    pushRow("download", "下载链接", aAddon.downloadURL || aAddon.updateURL, true);
                    pushRow("options", "Options URL", this.getOptionsURL(aAddon), true);
                    break;
                default:
                    pushRow("homepage", "Homepage", aAddon.homepageURL, true);
                    pushRow("path", "Path", pluginPath, true);
                    break;
            }

            return rows;
        },

        appendDetailRow (doc, section, rowInfo) {
            const row = $C(doc, "div", {
                id: `detail-${rowInfo.id}-row`,
                class: "addon-detail-row userchromejs-detail-row",
                style: "display: flex; align-items: flex-start; gap: 12px;",
            });
            $C(doc, "label", {
                class: "detail-row-label",
                style: "flex: 0 0 88px; min-width: 88px; margin: 0; text-align: left;",
                "#text": rowInfo.label
            }, row);
            const valueBox = $C(doc, "div", {
                class: "userchromejs-detail-value",
                style: "flex: 1 1 auto; min-width: 0;",
            }, row);

            if (rowInfo.isLink) {
                const link = $C(doc, "a", {
                    href: rowInfo.value,
                    action: "AM-open-url",
                    style: "display: block; text-align: left; overflow-wrap: anywhere; word-break: break-word;",
                    "#text": rowInfo.value
                }, valueBox);
                link.addEventListener("click", this);
            } else {
                $C(doc, "span", {
                    style: `display: block; text-align: left; overflow-wrap: anywhere; word-break: break-word;${rowInfo.value.includes("\n") ? " white-space: pre-wrap;" : ""}`,
                    "#text": rowInfo.value
                }, valueBox);
            }

            section.appendChild(row);
        },

        normalizeDetailText (text) {
            return String(text || "")
                .replace(/\s+/g, " ")
                .trim();
        },

        syncDescriptionVisibility (detailState) {
            if (!detailState || !detailState.card) {
                return;
            }

            const root = detailState.card;
            const contents = root.querySelector(".card-contents");
            const summary = root.querySelector(".addon-description, addon-description");
            const detailDescription = root.querySelector(".addon-detail-description, addon-detail-description");
            const detailWrapper = root.querySelector(".addon-detail-description-wrapper");
            if (!detailDescription) {
                return;
            }

            const shouldHide = !!detailState.addon &&
                detailState.addon.type === "userchromejs" &&
                summary &&
                this.normalizeDetailText(summary.textContent) &&
                this.normalizeDetailText(summary.textContent) === this.normalizeDetailText(detailDescription.textContent);

            if (detailWrapper) {
                detailWrapper.hidden = shouldHide;
            } else {
                detailDescription.hidden = shouldHide;
            }
            if (contents) {
                contents.style.paddingBottom = shouldHide ? "8px" : "";
            }
        },

        setUrlOrPath (doc) {
            const detailState = this.getDetailViewState(doc);
            const addon = detailState.addon;
            const section = detailState.section;
            if (!addon || !section) {
                debugLog("setUrlOrPath(): detail not ready", {
                    hasDetail: !!detailState.detail,
                    hasCard: !!detailState.card,
                    hasAddon: !!addon,
                    hasSection: !!section,
                });
                return false;
            }

            doc[DETAIL_RENDERING_KEY] = true;
            section.querySelectorAll(".userchromejs-detail-row").forEach(node => node.remove());

            const rows = this.getDetailRows(addon);
            rows.forEach(rowInfo => this.appendDetailRow(doc, section, rowInfo));
            this.syncDescriptionVisibility(detailState);
            if (doc.defaultView) {
                doc.defaultView.setTimeout(() => {
                    delete doc[DETAIL_RENDERING_KEY];
                }, 0);
            } else {
                delete doc[DETAIL_RENDERING_KEY];
            }
            debugLog("setUrlOrPath(): rows rendered", {
                id: addon.id || null,
                type: addon.type || null,
                count: rows.length,
            });
            return true;
        },

        openUrl (url) {
            if (/^(https?|about|chrome|resource|file|moz-extension):/i.test(url)) {
                openURL(url);
            } else {
                this.revealPath(url);
            }
        },

        revealPath (path) {
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            file.initWithPath(path);
            if (file.exists())
                file.reveal();
        },
        copyToClipboard (aString) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].
                getService(Ci.nsIClipboardHelper).copyString(aString);
        }
    };

    window.userChromeJSAddon = {
        scripts: [],
        unloads: [],
        isProviderOwner: false,
        iconURLCache: new Map(),
        iconBlobURLs: new Set(),

        init () {
            const hasType = this.isAddonTypeRegistered();
            debugLog("init()", {
                href: String(window.location),
                hasAddonType: !!hasType,
            });
            this.logBackendDiagnostics("init(): backend diagnostics", window);
            this.initScripts();
            if (hasType) {
                debugLog("provider already registered, skip registerProvider()");
            } else {
                this.registerProvider();
                this.addStyle();
            }
        },
        isAddonTypeRegistered () {
            try {
                if (typeof AddonManager.hasAddonType === "function") {
                    return AddonManager.hasAddonType("userchromejs");
                }
            } catch (ex) {
                console.error(ex);
            }
            return !!(AddonManager.addonTypes &&
                Object.prototype.hasOwnProperty.call(AddonManager.addonTypes, "userchromejs"));
        },
        ensureProviderRegistration () {
            if (this.isAddonTypeRegistered()) {
                debugLog("ensureProviderRegistration(): provider already registered");
                return false;
            }
            debugLog("ensureProviderRegistration(): registering provider in this window", {
                href: String(window.location),
            });
            this.registerProvider();
            this.addStyle();
            return true;
        },
        handoffProviderToOtherWindow () {
            const enumerator = Services.wm.getEnumerator("navigator:browser");
            while (enumerator.hasMoreElements()) {
                const win = enumerator.getNext();
                if (!win || win === window || win.closed) {
                    continue;
                }
                try {
                    if (win.userChromeJSAddon &&
                        typeof win.userChromeJSAddon.ensureProviderRegistration === "function") {
                        const adopted = win.userChromeJSAddon.ensureProviderRegistration();
                        if (adopted) {
                            debugLog("handoffProviderToOtherWindow(): provider adopted", {
                                href: String(win.location || ""),
                            });
                        }
                        return;
                    }
                } catch (ex) {
                    console.error(ex);
                }
            }
            debugLog("handoffProviderToOtherWindow(): no other window available");
        },
        uninit () {
            debugLog("uninit()", {
                href: String(window.location),
                unloadCount: this.unloads.length,
            });
            this.releaseIconURLs();
            this.scripts = [];
            this.unloads.splice(0).forEach(function (func) { func(); });
        },
        releaseIconURLs () {
            this.iconBlobURLs.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) { }
            });
            this.iconBlobURLs.clear();
            this.iconURLCache.clear();
        },
        normalizeIconURL (url) {
            if (!url || typeof url !== "string") {
                return iconURL;
            }
            if (!url.startsWith("data:")) {
                return url;
            }
            if (this.iconURLCache.has(url)) {
                return this.iconURLCache.get(url);
            }

            try {
                const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
                if (!match) {
                    return url;
                }
                const mime = match[1] || "application/octet-stream";
                const isBase64 = !!match[2];
                const body = match[3] || "";
                const bytes = isBase64
                    ? Uint8Array.from(atob(body), c => c.charCodeAt(0))
                    : new TextEncoder().encode(decodeURIComponent(body));
                const blobURL = URL.createObjectURL(new Blob([bytes], { type: mime }));
                this.iconBlobURLs.add(blobURL);
                this.iconURLCache.set(url, blobURL);
                return blobURL;
            } catch (e) {
                console.error(e);
                return url;
            }
        },
        describeWindow (win) {
            if (!win || win.closed) {
                return {
                    href: null,
                    closed: true,
                };
            }

            const info = {
                href: null,
                hasUserChromeJs: false,
                ucjsDone: false,
                ucjsScripts: null,
                ucjsOverlays: null,
                hasUc: false,
                ucIsFaked: null,
                ucScripts: null,
                hasUcUtils: false,
            };

            try {
                info.href = String(win.location);
            } catch (e) { }
            try {
                info.hasUserChromeJs = !!win.userChrome_js;
                if (win.userChrome_js) {
                    info.ucjsDone = !!win.userChrome_js.getScriptsDone;
                    info.ucjsScripts = Array.isArray(win.userChrome_js.scripts) ? win.userChrome_js.scripts.length : null;
                    info.ucjsOverlays = Array.isArray(win.userChrome_js.overlays) ? win.userChrome_js.overlays.length : null;
                }
            } catch (e) { }
            try {
                info.hasUc = !!win._uc;
                if (win._uc) {
                    info.ucIsFaked = !!win._uc.isFaked;
                    info.ucScripts = win._uc.scripts ? Object.keys(win._uc.scripts).length : null;
                }
            } catch (e) { }
            try {
                info.hasUcUtils = typeof win._ucUtils === "object" && !!win._ucUtils;
            } catch (e) { }

            return info;
        },
        dumpWindowState (label, preferredWindow) {
            debugWarn(label, this.getLiveBrowserWindows(preferredWindow).map(win => this.describeWindow(win)));
        },
        collectBackendDiagnostics (preferredWindow) {
            return this.getLiveBrowserWindows(preferredWindow).map(win => {
                const info = this.describeWindow(win);
                let backend = null;
                let rawCount = null;

                try {
                    backend = this.getBackendFromWindow(win);
                    if (backend) {
                        rawCount = this.getBackendScripts(backend).length;
                    }
                } catch (e) {
                    rawCount = "error: " + e;
                }

                return {
                    href: info.href,
                    userChrome_js: {
                        exists: info.hasUserChromeJs,
                        done: info.ucjsDone,
                        scripts: info.ucjsScripts,
                        overlays: info.ucjsOverlays,
                    },
                    _uc: {
                        exists: info.hasUc,
                        isFaked: info.ucIsFaked,
                        scripts: info.ucScripts,
                    },
                    _ucUtils: info.hasUcUtils,
                    detectedBackend: backend ? backend.kind : null,
                    backendScriptCount: rawCount,
                };
            });
        },
        logBackendDiagnostics (label, preferredWindow) {
            debugWarn(label, this.collectBackendDiagnostics(preferredWindow));
        },
        getLiveBrowserWindows (preferredWindow) {
            const wins = [];
            const seen = new Set();
            const appendWindow = win => {
                if (!win || win.closed || seen.has(win)) {
                    return;
                }
                try {
                    if (win.document.documentElement.getAttribute("windowtype") !== "navigator:browser") {
                        return;
                    }
                } catch (e) {
                    return;
                }
                seen.add(win);
                wins.push(win);
            };

            appendWindow(preferredWindow);
            appendWindow(window);

            const enumerator = Services.wm.getEnumerator("navigator:browser");
            while (enumerator.hasMoreElements()) {
                appendWindow(enumerator.getNext());
            }

            return wins;
        },
        getBackendFromWindow (win) {
            try {
                if (win.userChrome_js) {
                    const ucjs = win.userChrome_js;
                    if (Array.isArray(ucjs.scripts) && Array.isArray(ucjs.overlays) &&
                        (ucjs.getScriptsDone || ucjs.scripts.length || ucjs.overlays.length)) {
                        return {
                            kind: "userChrome_js",
                            ownerWindow: win,
                        };
                    }
                }
            } catch (e) { }

            try {
                if (win._uc && !win._uc.isFaked && win._uc.scripts) {
                    return {
                        kind: "_uc",
                        ownerWindow: win,
                    };
                }
            } catch (e) { }

            try {
                if (typeof win._ucUtils === "object" && win._ucUtils) {
                    return {
                        kind: "_ucUtils",
                        ownerWindow: win,
                    };
                }
            } catch (e) { }

            return null;
        },
        resolveBackend (preferredWindow, preferredKind, scriptName) {
            const preferred = [];
            const fallback = [];

            for (const win of this.getLiveBrowserWindows(preferredWindow)) {
                const backend = this.getBackendFromWindow(win);
                if (!backend) {
                    continue;
                }
                if (scriptName && !this.backendHasScript(backend, scriptName)) {
                    continue;
                }
                if (!preferredKind || backend.kind === preferredKind) {
                    preferred.push(backend);
                } else {
                    fallback.push(backend);
                }
            }

            const backend = preferred[0] || fallback[0] || null;
            if (!backend) {
                debugWarn("resolveBackend(): no backend", {
                    preferredKind: preferredKind || null,
                    scriptName: scriptName || null,
                });
                this.dumpWindowState("resolveBackend(): window snapshot", preferredWindow);
            }
            return backend;
        },
        resolveChromeURL (str) {
            const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
            try {
                return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec;
            } catch (e) {
                console.error(e);
                return "";
            }
        },
        getBackendScripts (backend) {
            if (!backend) {
                return [];
            }

            switch (backend.kind) {
                case "userChrome_js":
                    return backend.ownerWindow.userChrome_js.scripts.concat(backend.ownerWindow.userChrome_js.overlays);
                case "_uc":
                    return Object.values(backend.ownerWindow._uc.scripts);
                case "_ucUtils":
                    return backend.ownerWindow._ucUtils.getScriptData().map(script => {
                        let aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                        let path = this.resolveChromeURL(`chrome://userscripts/content/${script.filename}`);
                        path = path.replace("file:///", "").replace(/\//g, '\\');
                        aFile.initWithPath(path);
                        return Object.assign({}, script, {
                            file: aFile
                        });
                    });
            }

            return [];
        },
        getScriptFromBackend (backend, scriptName) {
            if (!backend) {
                return null;
            }

            if (backend.kind === "_uc") {
                const script = backend.ownerWindow._uc.scripts[scriptName];
                if (script) {
                    return script;
                }
            }

            return this.getBackendScripts(backend).find(script => script.filename === scriptName) || null;
        },
        backendHasScript (backend, scriptName) {
            return !!this.getScriptFromBackend(backend, scriptName);
        },
        splitPrefList (value) {
            return (value || "").split(",").filter(Boolean);
        },
        joinPrefList (list) {
            return list.filter((name, index, arr) => !!name && arr.indexOf(name) === index).join(",");
        },
        restoreDisabledState (arr) {
            var disable = [];
            for (var i = 0, len = arr.length; i < len; i++) {
                disable[arr[i]] = true;
            }
            return disable;
        },
        getScriptEnabled (backend, script) {
            if (!script) {
                return false;
            }
            if (script.hasOwnProperty("isEnabled")) {
                return !!script.isEnabled;
            }

            switch (backend.kind) {
                case "userChrome_js":
                    return !(backend.ownerWindow.userChrome_js.scriptDisable &&
                        backend.ownerWindow.userChrome_js.scriptDisable[script.filename]);
                case "_uc":
                    return !this.splitPrefList(xPref.get(backend.ownerWindow._uc.PREF_SCRIPTSDISABLED, "")).includes(script.filename);
                case "_ucUtils":
                    if (script.hasOwnProperty("enabled")) {
                        return !!script.enabled;
                    }
                    return true;
            }

            return true;
        },
        setUserChromeDisabled (scriptName, disabled) {
            const next = this.splitPrefList(Services.prefs.getStringPref("userChrome.disable.script", "")).filter(name => name !== scriptName);
            if (disabled) {
                next.push(scriptName);
            }

            Services.prefs.setStringPref("userChrome.disable.script", this.joinPrefList(next));

            const state = this.restoreDisabledState(next);
            this.getLiveBrowserWindows().forEach(win => {
                try {
                    if (win.userChrome_js) {
                        win.userChrome_js.scriptDisable = state;
                    }
                } catch (e) { }
            });

            return !state[scriptName];
        },
        setUcDisabled (uc, scriptName, disabled) {
            const next = this.splitPrefList(xPref.get(uc.PREF_SCRIPTSDISABLED, "")).filter(name => name !== scriptName);
            if (disabled) {
                next.unshift(scriptName);
            }
            xPref.set(uc.PREF_SCRIPTSDISABLED, this.joinPrefList(next));
        },
        applyUserDisabled (addon, disabled) {
            const backend = addon.resolveBackend();
            if (!backend) {
                return !disabled;
            }

            switch (backend.kind) {
                case "userChrome_js":
                    return this.setUserChromeDisabled(addon.name, disabled);
                case "_ucUtils": {
                    const currentScript = this.getScriptFromBackend(backend, addon.name) || addon._script;
                    const currentEnabled = this.getScriptEnabled(backend, currentScript);
                    if (currentEnabled === !disabled) {
                        return currentEnabled;
                    }
                    const obj = backend.ownerWindow._ucUtils.toggleScript(addon.name);
                    if (obj && typeof obj.enabled === "boolean") {
                        return obj.enabled;
                    }
                    if (obj && typeof obj.isEnabled === "boolean") {
                        return obj.isEnabled;
                    }
                    return !disabled;
                }
                default:
                    return !disabled;
            }
        },
        enableLegacyScript (addon, backend) {
            backend = backend || this.resolveBackend(addon._backend && addon._backend.ownerWindow, "_uc", addon.name);
            if (!backend || backend.kind !== "_uc") {
                return;
            }

            const uc = backend.ownerWindow._uc;
            let script = this.getScriptFromBackend(backend, addon.name) || addon._script;
            if (!script) {
                return;
            }

            this.setUcDisabled(uc, script.filename, false);
            if (!Array.isArray(uc.everLoaded) || !uc.everLoaded.includes(script.id)) {
                script = uc.getScriptData(script.file);
                Services.obs.notifyObservers(null, "startupcache-invalidate");
                uc.windows((doc, win, loc) => {
                    if (win._uc && script.regex.test(loc.href)) {
                        uc.loadScript(script, win);
                    }
                }, false);
            }
            addon._script = script;
        },
        disableLegacyScript (addon, backend) {
            backend = backend || this.resolveBackend(addon._backend && addon._backend.ownerWindow, "_uc", addon.name);
            if (!backend || backend.kind !== "_uc") {
                return;
            }

            const uc = backend.ownerWindow._uc;
            const script = this.getScriptFromBackend(backend, addon.name) || addon._script;
            if (!script) {
                return;
            }

            this.setUcDisabled(uc, script.filename, true);
            if (script.isRunning && !!script.shutdown) {
                uc.windows((doc, win, loc) => {
                    if (script.regex.test(loc.href)) {
                        try {
                            eval(script.shutdown);
                        } catch (ex) {
                            Cu.reportError(ex);
                        }
                        if (script.onlyonce) {
                            return true;
                        }
                    }
                }, false);
                script.isRunning = false;
            }
        },
        initScripts () {
            this.scripts = [];
            debugLog("initScripts(): start", {
                href: String(window.location),
            });
            this.logBackendDiagnostics("initScripts(): before resolveBackend", window);
            const backend = this.resolveBackend(window);
            if (!backend) {
                debugWarn("initScripts(): no backend, scripts list stays empty");
                return this.scripts;
            }

            const rawScripts = this.getBackendScripts(backend);
            debugLog("initScripts(): backend resolved", {
                kind: backend.kind,
                ownerHref: String(backend.ownerWindow.location),
                rawCount: rawScripts.length,
            });

            rawScripts.forEach((script) => {
                if (!EXCLUED_SCRIPTS.includes(script.filename)) {
                    this.scripts.push(new ScriptAddon(script, backend));
                }
            });

            debugLog("initScripts(): completed", {
                kind: backend.kind,
                filteredCount: this.scripts.length,
                excluded: EXCLUED_SCRIPTS.slice(),
            });
            if (!this.scripts.length) {
                this.logBackendDiagnostics("initScripts(): empty result diagnostics", backend.ownerWindow);
                this.dumpWindowState("initScripts(): empty result window snapshot", backend.ownerWindow);
            }

            return this.scripts;
        },
        getScriptById (aId) {
            this.initScripts();
            for (var i = 0; i < this.scripts.length; i++) {
                if (this.scripts[i].id == aId)
                    return this.scripts[i];
            }
            return null;
        },
        registerProvider () {
            const provider = {
                async getAddonByID (aId) {
                    const addon = userChromeJSAddon.getScriptById(aId);
                    debugLog("provider.getAddonByID()", {
                        id: aId,
                        found: !!addon,
                    });
                    return addon;
                },

                async getAddonsByTypes (aTypes) {
                    debugLog("provider.getAddonsByTypes()", {
                        types: aTypes || null,
                    });
                    if (aTypes && !aTypes.includes("userchromejs")) {
                        return [];
                    } else {
                        userChromeJSAddon.initScripts();
                        debugLog("provider.getAddonsByTypes(): result", {
                            count: userChromeJSAddon.scripts.length,
                        });
                        return userChromeJSAddon.scripts;
                    }
                },
            };

            AddonManagerPrivate.registerProvider(provider, [
                AddonManagerPrivate.AddonType ?
                    new AddonManagerPrivate.AddonType(
                        "userchromejs",
                        "",
                        "userChrome JS",
                        AddonManager.VIEW_TYPE_LIST,
                        9000
                    ) :
                    "userchromejs"
            ]);
            this.isProviderOwner = true;
            debugLog("registerProvider(): registered");

            this.unloads.push(() => {
                debugLog("registerProvider(): unregister");
                this.isProviderOwner = false;
                AddonManagerPrivate.unregisterProvider(provider);
                this.handoffProviderToOtherWindow();
            });
        },
        addStyle () {
            let styleService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
            if (APP_VERSION > 110) {
                let toggleCss = `
                    input[type="checkbox"].toggle-button {
                        --button-height: 16px;
                        --button-half-height: 8px;
                        --button-width: 26px;
                        --button-border-width: 1px;
                        /* dot-size = button-height - 2*dot-margin - 2*button-border-width */
                        --dot-size: 10px;
                        --dot-margin: 2px;
                        /* --dot-transform-x = button-width - 2*dot-margin - dot-size - 2*button-border-width */
                        --dot-transform-x: 10px;
                        --border-color: hsla(210,4%,10%,.14);
                    }
                    
                    input[type="checkbox"].toggle-button {
                        appearance: none;
                        padding: 0;
                        margin: 0;
                        border: var(--button-border-width) solid var(--border-color);
                        height: var(--button-height);
                        width: var(--button-width);
                        border-radius: var(--button-half-height);
                        background: var(--in-content-button-background);
                        box-sizing: border-box;
                    }
                    input[type="checkbox"].toggle-button:enabled:hover {
                        background: var(--in-content-button-background-hover);
                        border-color: var(--border-color);
                    }
                    input[type="checkbox"].toggle-button:enabled:active {
                        background: var(--in-content-button-background-active);
                        border-color: var(--border-color);
                    }
                    input[type="checkbox"].toggle-button:checked {
                        background: var(--in-content-primary-button-background);
                        border-color: var(--in-content-primary-button-background-hover);
                    }
                    input[type="checkbox"].toggle-button:checked:hover {
                        background: var(--in-content-primary-button-background-hover);
                        border-color: var(--in-content-primary-button-background-active);
                    }
                    input[type="checkbox"].toggle-button:checked:active {
                        background: var(--in-content-primary-button-background-active);
                        border-color: var(--in-content-primary-button-background-active);
                    }
                    input[type="checkbox"].toggle-button::before {
                        display: block;
                        content: "";
                        background: #fff;
                        height: var(--dot-size);
                        width: var(--dot-size);
                        margin: var(--dot-margin);
                        border-radius: 50%;
                        outline: 1px solid var(--border-color);
                        transition: transform 100ms;
                        transform: translate(0, calc(50% - var(--dot-size) / 2));
                    }
                    input[type="checkbox"].toggle-button:checked::before {
                        transform: translate(var(--dot-transform-x), calc(50% - var(--dot-size) / 2));
                    }
                    input[type="checkbox"].toggle-button:-moz-locale-dir(rtl)::before,
                    input[type="checkbox"].toggle-button:dir(rtl)::before {
                        scale: -1;
                    }
                `;
                let toggleURI = Services.io.newURI("data:text/css," + encodeURIComponent(toggleCss));
                styleService.loadAndRegisterSheet(toggleURI, Ci.nsIStyleSheetService.AUTHOR_SHEET);
                this.unloads.push(function () {
                    styleService.unregisterSheet(toggleURI, Ci.nsIStyleSheetService.AUTHOR_SHEET);
                });
            }
            let data = `@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
                @namespace html url(http://www.w3.org/1999/xhtml);
                @-moz-document url("about:addons"), url("chrome://mozapps/content/extensions/extensions.xul") {
                    #category-userchromejs > .category-icon {
                        list-style-image: url(chrome://mozapps/skin/extensions/experimentGeneric.svg);
                    }
                }
                @-moz-document url("about:addons"), url("chrome://mozapps/content/extensions/aboutaddons.html") {
                    html|*.category[name="userchromejs"] {
                        background-image: url(chrome://mozapps/skin/extensions/category-extensions.svg);
                    }
                    .userchromejs-detail-row {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    .userchromejs-detail-row > .detail-row-label {
                        flex: 0 0 128px;
                        min-width: 128px;
                        margin: 0;
                        text-align: left;
                        whitespace: nowrap;
                    }
                    .userchromejs-detail-value {
                        flex: 1 1 auto;
                        min-width: 0;
                    }
                    .userchromejs-detail-value > a,
                    .userchromejs-detail-value > span {
                        display: block;
                        text-align: left;
                        overflow-wrap: anywhere;
                        word-break: break-word;
                    }
                    .addon-detail-row-homepage {
                        justify-content: flex-start !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                    .addon-detail-row-homepage > label {
                        flex: 0 0 88px !important;
                        min-width: 88px !important;
                        margin: 0 !important;
                        text-align: left !important;
                    }
                    .addon-detail-row-homepage > a {
                        display: block !important;
                        flex: 1 1 auto !important;
                        min-width: 0 !important;
                        text-align: left !important;
                        overflow-wrap: anywhere !important;
                        word-break: break-word !important;
                    }
                }`;

            let styleURI = Services.io.newURI("data:text/css," + encodeURIComponent(data), null, null);
            styleService.loadAndRegisterSheet(styleURI, Ci.nsIStyleSheetService.USER_SHEET);

            this.unloads.push(function () {
                styleService.unregisterSheet(styleURI, Ci.nsIStyleSheetService.USER_SHEET);
            });
        },
    };

    function ScriptAddon (aScript, aBackend) {
        this._script = aScript;
        this._backend = {
            kind: aBackend.kind,
            ownerWindow: aBackend.ownerWindow,
        };

        this.id = "ucjs:" + this._script.filename;  //this._script.url.replace(/\//g, "|");
        this.name = this._script.filename;
        this.description = this._script.description || "";
        this.enabled = userChromeJSAddon.getScriptEnabled(aBackend, this._script);

        // 我修改过的 userChrome.js 新增的
        this.version = this._script.version || "";
        this.author = this._script.author || null;
        this.homepageURL = this._script.homepageURL || null;
        this.reviewURL = this._script.reviewURL || null;
        this.reviewCount = 0;
        this.fullDescription = this._script.fullDescription || null;
        this.downloadURL = this._script.downloadURL || null;

        const resolvedIconURL = userChromeJSAddon.normalizeIconURL(this._script.iconURL || this._script.icon || iconURL);
        this.iconURL = resolvedIconURL;
        this.icon32URL = resolvedIconURL;
        this.icon64URL = resolvedIconURL;
        this.icons = {
            32: resolvedIconURL,
            64: resolvedIconURL,
        };
    }

    ScriptAddon.prototype = {
        version: null,
        type: "userchromejs",
        isCompatible: true,
        blocklistState: Ci.nsIBlocklistService.STATE_NOT_BLOCKED,
        appDisabled: false,
        scope: AddonManager.SCOPE_PROFILE,
        name: null,
        creator: null,
        pendingOperations: AddonManager.PENDING_NONE,  // 必须，否则所有都显示 restart
        operationsRequiringRestart: AddonManager.OP_NEEDS_RESTART_ENABLE | AddonManager.OP_NEEDS_RESTART_DISABLE | AddonManager.OP_NEEDS_RESTART_UNINSTALL,
        // operationsRequiringRestart: AddonManager.OP_NEEDS_RESTART_DISABLE,

        get optionsURL () {
            if (this.isActive && this._script.optionsURL)
                return this._script.optionsURL;
        },
        resolveBackend () {
            const backend = userChromeJSAddon.resolveBackend(
                this._backend && this._backend.ownerWindow,
                this._backend && this._backend.kind,
                this.name
            );
            if (backend) {
                this._backend = {
                    kind: backend.kind,
                    ownerWindow: backend.ownerWindow,
                };
                const script = userChromeJSAddon.getScriptFromBackend(backend, this.name);
                if (script) {
                    this._script = script;
                }
            }
            return backend;
        },
        refreshState () {
            const backend = this.resolveBackend();
            if (backend) {
                this.enabled = userChromeJSAddon.getScriptEnabled(backend, this._script);
            }
            return this.enabled;
        },

        get isActive () {
            return !this.userDisabled ? true : false;
        },
        get userDisabled () {
            this.refreshState();
            return !this.enabled ? true : false;
        },
        set userDisabled (val) {
            if (val == !this.enabled) {
                return val;
            }

            AddonManagerPrivate.callAddonListeners(val ? 'onEnabling' : 'onDisabling', this, false);

            if (this.pendingOperations == AddonManager.PENDING_NONE) {
                this.pendingOperations = val ? AddonManager.PENDING_DISABLE : AddonManager.PENDING_ENABLE;
            } else {
                this.pendingOperations = AddonManager.PENDING_NONE;
            }

            this.enabled = userChromeJSAddon.applyUserDisabled(this, val);

            AddonManagerPrivate.callAddonListeners(val ? 'onEnabled' : 'onDisabled', this);
        },
        get permissions () {
            // var perms = AddonManager.PERM_CAN_UNINSTALL;
            // perms |= this.userDisabled ? AddonManager.PERM_CAN_ENABLE : AddonManager.PERM_CAN_DISABLE;
            var perms = this.userDisabled ? AddonManager.PERM_CAN_ENABLE : AddonManager.PERM_CAN_DISABLE;
            // if (this.updateURL) perms |= AddonManager.PERM_CAN_UPGRADE;
            return perms;
        },

        uninstall () {
            AddonManagerPrivate.callAddonListeners("onUninstalling", this, false);
            this.needsUninstall = true;
            this.pendingOperations |= AddonManager.PENDING_UNINSTALL;
            AddonManagerPrivate.callAddonListeners("onUninstalled", this);
        },
        cancelUninstall () {
            this.needsUninstall = false;
            this.pendingOperations ^= AddonManager.PENDING_UNINSTALL;
            AddonManagerPrivate.callAddonListeners("onOperationCancelled", this);
        },

        // Fx62.0-
        async enable () {
            const backend = this.resolveBackend();
            if (backend && backend.kind === "_uc") {
                userChromeJSAddon.enableLegacyScript(this, backend);
            }
            this.userDisabled = false;
        },
        async disable () {
            const backend = this.resolveBackend();
            if (backend && backend.kind === "_uc") {
                userChromeJSAddon.disableLegacyScript(this, backend);
            }
            this.userDisabled = true;
        },
    };

    function $C (doc, tag, attrs, parent, reference) {
        let node;

        if (tag instanceof Node) {
            node = tag;
        } else if (tag === "#text") {
            node = doc.createTextNode(attrs);
            attrs = null;
        } else if (tag === "panel-item" && parseInt(APP_VERSION) === 110) {
            node = new (doc.ownerGlobal.customElements.get("panel-item"));
        } else {
            node = doc.createElement(tag);
        }

        if (attrs) {
            Object.entries(attrs).forEach(([name, val]) => {
                if (name === "#text") {
                    node.appendChild(doc.createTextNode(val));
                } else {
                    node.setAttribute(name, val);
                }
            });
        }
        // if(parent instanceof Node) {
        if (parent && typeof parent.insertBefore === "function") { // fx 106
            parent.insertBefore(node, reference);
        }
        return node;
    }

    if (!window.xPref) {
        window.xPref = {
            // Retorna o valor da preferência, seja qual for o tipo, mas não
            // testei com tipos complexos como nsIFile, não sei como detectar
            // uma preferência assim, na verdade nunca vi uma
            get: function (prefPath, def = false, valueIfUndefined, setDefault = true) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                try {
                    switch (sPrefs.getPrefType(prefPath)) {
                        case 0:
                            if (valueIfUndefined != undefined)
                                return this.set(prefPath, valueIfUndefined, setDefault);
                            else
                                return undefined;
                        case 32:
                            return sPrefs.getStringPref(prefPath);
                        case 64:
                            return sPrefs.getIntPref(prefPath);
                        case 128:
                            return sPrefs.getBoolPref(prefPath);
                    }
                } catch (ex) {
                    return undefined;
                }
                return;
            },

            set: function (prefPath, value, def = false) {
                let sPrefs = def ?
                    Services.prefs.getDefaultBranch(null) :
                    Services.prefs;

                switch (typeof value) {
                    case 'string':
                        return sPrefs.setStringPref(prefPath, value) || value;
                    case 'number':
                        return sPrefs.setIntPref(prefPath, value) || value;
                    case 'boolean':
                        return sPrefs.setBoolPref(prefPath, value) || value;
                }
                return;
            },

            lock: function (prefPath, value) {
                let sPrefs = Services.prefs;
                this.lockedBackupDef[prefPath] = this.get(prefPath, true);
                if (sPrefs.prefIsLocked(prefPath))
                    sPrefs.unlockPref(prefPath);

                this.set(prefPath, value, true);
                sPrefs.lockPref(prefPath);
            },

            lockedBackupDef: {},

            unlock: function (prefPath) {
                Services.prefs.unlockPref(prefPath);
                let bkp = this.lockedBackupDef[prefPath];
                if (bkp == undefined)
                    Services.prefs.deleteBranch(prefPath);
                else
                    this.set(prefPath, bkp, true);
            },

            clear: Services.prefs.clearUserPref,

            // Detecta mudanças na preferência e retorna:
            // return[0]: valor da preferência alterada
            // return[1]: nome da preferência alterada
            // Guardar chamada numa var se quiser interrompê-la depois
            addListener: function (prefPath, trat) {
                this.observer = function (aSubject, aTopic, prefPath) {
                    return trat(xPref.get(prefPath), prefPath);
                }

                Services.prefs.addObserver(prefPath, this.observer);
                return {
                    prefPath: prefPath,
                    observer: this.observer
                };
            },

            // Encerra pref observer
            // Só precisa passar a var definida quando adicionou
            removeListener: function (obs) {
                Services.prefs.removeObserver(obs.prefPath, obs.observer);
            }
        }
    }

    function $L () {
        const _LOCALE = getLocale() || "zh-CN";
        let str = arguments[0];
        if (str) {
            if (!arguments.length) return "";
            str = LANG[_LOCALE][str] || str;
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace("%s", arguments[i]);
            }
            return str;
        } else return "";
    }

    function getLocale () {
        let LOCALE = Services.prefs.getCharPref("general.useragent.locale", "");
        if (!LOCALE) {
            let sLocales = Services.locale.appLocalesAsBCP47;
            for (let key in sLocales) {
                if (LANG.hasOwnProperty(sLocales[key])) {
                    LOCALE = sLocales[key];
                    break;
                }
            }
        }
        return LOCALE;
    }

    window[UNLOAD_HANDLER_KEY] = function () {
        debugLog("window unload cleanup", {
            href: String(window.location),
        });
        try {
            if (window.AM_Helper) {
                window.AM_Helper.uninit();
            }
        } catch (ex) {
            console.error(ex);
        }
        try {
            if (window.userChromeJSAddon) {
                window.userChromeJSAddon.uninit();
            }
        } catch (ex) {
            console.error(ex);
        }
        window.removeEventListener("unload", window[UNLOAD_HANDLER_KEY], false);
        delete window[UNLOAD_HANDLER_KEY];
    };
    window.addEventListener("unload", window[UNLOAD_HANDLER_KEY], false);

    AM_Helper.init();

    userChromeJSAddon.init();
})();
