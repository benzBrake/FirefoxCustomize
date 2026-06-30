'use strict';

const USERCSSLOADER_INSTALL_TYPES = {
    true: {
        type: 'author',
        suffix: '.css',
    },
    author: {
        type: 'author',
        suffix: '.css',
    },
    user: {
        type: 'user',
        suffix: '.us.css',
    },
    agent: {
        type: 'agent',
        suffix: '.ag.css',
    },
};
const INSTALL_AREA_SELECTOR = '#install-area';
const SCRIPT_TABS_SELECTOR = '#script-links';
const SOURCE_DOWNLOAD_SELECTOR = '#install-area a.install-link[data-install-format="css"][href]';
const INSTALL_LINK_ATTR = 'data-usercssloader-install-link';
const INSTALL_HELP_ATTR = 'data-usercssloader-install-help';
const STYLE_NAME_RE = /^\s*\*\s*@name(?::[^\s]+)?\s+(.+?)\s*$/im;
const INSTALL_STYLE_ID = 'usercssloader-install-style';

function isGreasyForkScriptPage(win) {
    const { location } = win || {};
    if (!location) {
        return false;
    }
    return location.hostname === 'greasyfork.org' && /\/scripts\/\d+/i.test(location.pathname);
}

function isCodePage(win) {
    return /\/code(?:[/?#]|$)/i.test(win?.location?.pathname || '');
}

function getInstallArea(doc) {
    return doc?.querySelector(INSTALL_AREA_SELECTOR) || null;
}

function getSourceDownloadURL(win) {
    if (!win?.document) {
        return null;
    }

    const sourceLink = win.document.querySelector(SOURCE_DOWNLOAD_SELECTOR);
    if (sourceLink?.href) {
        return new win.URL(sourceLink.href, win.location.href);
    }

    return null;
}

function getCodePageURL(win) {
    if (!win?.document) {
        return null;
    }
    if (isCodePage(win)) {
        return new win.URL(win.location.href);
    }

    const codeLink = win.document.querySelector(`${SCRIPT_TABS_SELECTOR} a[href*="/code"]`);
    if (codeLink?.href) {
        return new win.URL(codeLink.href, win.location.href);
    }

    const pathname = (win.location.pathname || '').replace(/\/$/, '');
    return new win.URL(`${pathname}/code`, win.location.origin);
}

function extractCodeTextFromDocument(doc) {
    return doc?.querySelector('.code-container pre, pre.prettyprint')?.textContent || '';
}

function getStyleName(codeText, fallback = '') {
    return codeText.match(STYLE_NAME_RE)?.[1]?.trim() || fallback;
}

function normalizeInstalledFileName(fileName) {
    let normalized = String(fileName || '')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/[. ]+$/g, '');

    if (!normalized) {
        normalized = 'greasyfork_style';
    }

    if (!normalized.toLowerCase().endsWith('.css')) {
        normalized += '.css';
    }

    return normalized;
}

function buildStyleFileName(baseName, suffix = '.css') {
    const normalizedSuffix = USERCSSLOADER_INSTALL_TYPES[Object.keys(USERCSSLOADER_INSTALL_TYPES)
        .find(key => USERCSSLOADER_INSTALL_TYPES[key].suffix === suffix)]?.suffix || '.css';
    let normalizedBase = String(baseName || '')
        .replace(/(?:\.(?:user|as|ag|us))?\.css$/i, '')
        .replace(/[. ]+$/g, '');

    if (!normalizedBase) {
        normalizedBase = 'greasyfork_style';
    }

    return normalizeInstalledFileName(`${normalizedBase}${normalizedSuffix}`);
}

function buildInstallFileNameFromPageURL(pageURL, fallback = '', suffix = '.css') {
    try {
        const pathname = new URL(pageURL).pathname || '';
        const match = pathname.match(/\/scripts\/(\d+)-([^/]+)/i);
        if (match) {
            const scriptId = match[1];
            const slug = decodeURIComponent(match[2] || '')
                .replace(/[^a-zA-Z0-9._-]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (scriptId && slug) {
                return buildStyleFileName(`${scriptId}-${slug}`, suffix);
            }
        }
    } catch (ex) {
        Cu.reportError(ex);
    }

    return buildStyleFileName(fallback || 'greasyfork_style', suffix);
}

function buildInstallFileName(win, suffix = '.css') {
    const pathname = win?.location?.pathname || '';
    const slug = pathname.match(/\/scripts\/\d+-([^/]+)/i)?.[1] || '';
    const normalized = slug
        .replace(/-/g, '_')
        .replace(/[^\w.-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    return buildStyleFileName(normalized || 'greasyfork_style', suffix);
}

async function fetchSourceText(win, sourceURL) {
    const response = await win.fetch(sourceURL.href, {
        credentials: 'same-origin',
    });
    if (!response.ok) {
        throw new Error(`UserCSSLoader source fetch failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
}

async function fetchCodeText(win, codeURL) {
    const response = await win.fetch(codeURL.href, {
        credentials: 'same-origin',
    });
    if (!response.ok) {
        throw new Error(`UserCSSLoader code page fetch failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new win.DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    return extractCodeTextFromDocument(parsed) || parsed.body?.textContent || html;
}

function ensureInlineStyle(win) {
    if (win.document.getElementById(INSTALL_STYLE_ID)) {
        return;
    }

    const style = win.document.createElement('style');
    style.id = INSTALL_STYLE_ID;
    style.textContent = `
#install-area .install-link[${INSTALL_LINK_ATTR}] {
    appearance: none !important;
    background: #060 !important;
    border: 0 !important;
    border-radius: .3em 0 0 .3em !important;
    box-shadow: none !important;
    box-sizing: border-box;
    color: #fff !important;
    cursor: pointer;
    display: inline-block;
    font: inherit;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    padding: .45em 1em;
    text-decoration: none !important;
    vertical-align: middle;
    white-space: nowrap;
}

#install-area .install-link[${INSTALL_LINK_ATTR}]:hover,
#install-area .install-link[${INSTALL_LINK_ATTR}]:focus-visible {
    background: #070 !important;
}

#install-area .install-link[${INSTALL_LINK_ATTR}] + .install-help-link[${INSTALL_HELP_ATTR}] {
    margin-inline-start: 0;
}

#install-area .install-help-link[${INSTALL_HELP_ATTR}] {
    background: #080;
    border-radius: 0 .3em .3em 0;
    box-sizing: border-box;
    color: #fff;
    cursor: default;
    display: inline-block;
    font: inherit;
    font-weight: 700;
    line-height: 1.4;
    min-width: 2.6em;
    padding: .45em .75em;
    text-align: center;
    text-decoration: none;
    user-select: none;
    vertical-align: middle;
}
`;
    (win.document.head || win.document.documentElement).appendChild(style);
}

function createInstallLink(win, installData, actor) {
    const link = win.document.createElement('button');
    link.className = 'install-link';
    link.type = 'button';
    link.textContent = '安装到 UserCSSLoader';
    link.setAttribute(INSTALL_LINK_ATTR, 'true');
    link.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (!win.confirm(
            `确定要把“${installData.styleName}”安装到 UserCSSLoader 吗？\n\n目标文件：${installData.fileName}`
        )) {
            return;
        }
        try {
            let result = await actor.sendQuery('UserCSSLoader:InstallStyle', installData);
            if (result?.status === 'exists') {
                const overwrite = win.confirm(
                    `本地已存在同名样式：${result.fileName}\n\n是否覆盖现有文件并重新加载样式？`
                );
                if (!overwrite) {
                    return;
                }
                result = await actor.sendQuery('UserCSSLoader:InstallStyle', {
                    ...installData,
                    overwrite: true,
                });
            }

            if (result?.status === 'installed' || result?.status === 'updated' || result?.status === 'unchanged') {
                const actionText = result.status === 'installed'
                    ? '已安装'
                    : result.status === 'updated'
                        ? '已覆盖更新'
                        : '本地文件内容一致，已重新加载';
                win.alert(`${actionText}：${result.fileName}`);
                return;
            }

            throw new Error(result?.error || 'Unknown install result');
        } catch (ex) {
            Cu.reportError(ex);
            win.alert(`安装失败：${ex.message || ex}`);
        }
    });
    return link;
}

function createHelpPlaceholder(win) {
    const help = win.document.createElement('span');
    help.className = 'install-help-link';
    help.textContent = '?';
    help.title = '后续将改为帮助链接';
    help.setAttribute(INSTALL_HELP_ATTR, 'true');
    help.setAttribute('aria-disabled', 'true');
    return help;
}

function ensureInstallLink(win, installData, actor) {
    const installArea = getInstallArea(win.document);
    if (!installArea || installArea.querySelector(`[${INSTALL_LINK_ATTR}]`)) {
        return;
    }

    ensureInlineStyle(win);
    installArea.appendChild(win.document.createTextNode(' '));
    installArea.appendChild(createInstallLink(win, installData, actor));
    installArea.appendChild(createHelpPlaceholder(win));
}

function parseUserCSSLoaderInstall(codeText) {
    const lines = String(codeText || '').split(/\r\n|\r|\n/);
    for (const line of lines) {
        const match = line.match(/^\s*(?:(?:\/\/|\/\*|\*)\s*)?@usercssloader\s+([^\s*]+)\b/i);
        if (!match) {
            continue;
        }

        const value = match[1].toLowerCase();
        return USERCSSLOADER_INSTALL_TYPES[value] || null;
    }

    return null;
}

export class UserCSSLoaderActorParent extends JSWindowActorParent {
    receiveMessage({ name, data }) {
        if (name !== 'UserCSSLoader:InstallStyle') {
            return null;
        }

        const windowGlobal = this.manager?.browsingContext?.currentWindowGlobal;
        const browser = windowGlobal?.rootFrameLoader?.ownerElement;
        const win =
            browser?.documentGlobal ||
            browser?.relevantGlobal ||
            browser?.ownerDocument?.defaultView ||
            null;
        return win?.UserCSSLoader?.installRemoteStyle?.(data) || {
            status: 'error',
            error: 'UserCSSLoader is not available in chrome window.',
        };
    }
}

export class UserCSSLoaderActorChild extends JSWindowActorChild {
    handleEvent(event) {
        if (event.type !== 'DOMContentLoaded') {
            return;
        }
        this.injectInstallLink().catch(ex => {
            Cu.reportError(ex);
        });
    }

    async injectInstallLink() {
        const win = this.contentWindow;
        if (!win || !isGreasyForkScriptPage(win) || !getInstallArea(win.document)) {
            return;
        }

        const sourceURL = getSourceDownloadURL(win);
        let codeText = '';
        if (sourceURL) {
            try {
                codeText = await fetchSourceText(win, sourceURL);
            } catch (ex) {
                Cu.reportError(ex);
            }
        }

        let installMeta = parseUserCSSLoaderInstall(codeText);
        if (!installMeta) {
            codeText = isCodePage(win)
                ? extractCodeTextFromDocument(win.document)
                : await fetchCodeText(win, getCodePageURL(win));
            installMeta = parseUserCSSLoaderInstall(codeText);
        }

        if (!installMeta) {
            return;
        }

        const sourceHref = sourceURL?.href || '';
        const fileName = buildInstallFileNameFromPageURL(win.location.href, buildInstallFileName(win, installMeta.suffix), installMeta.suffix);
        ensureInstallLink(win, {
            codeText,
            fileName,
            installType: installMeta.type,
            sourceURL: win.location.href,
            codeURL: sourceHref || getCodePageURL(win)?.href || win.location.href,
            styleName: getStyleName(codeText, win.document.querySelector('h2')?.textContent?.trim() || 'GreasyFork Style'),
        }, this);
    }
}
