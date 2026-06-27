// ==UserScript==
// @name            ColorfulTabs.uc.js
// @description     多彩标签
// @license         MIT License
// @compatibility   Firefox 152
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @shutdown        window.ColorfulTabs.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            20260627 优化取色算法，增加域名级 SQLite 缓存，减少颜色闪烁
// @note            20230930 Bug 1849904 - Convert a bunch of psuedo-boolean tab strip attributes to be standard boolean attributes
// ==/UserScript==
(function (css) {
    const { Sqlite } = ChromeUtils.importESModule("resource://gre/modules/Sqlite.sys.mjs");

    const BLACK_LIST = [
        "chrome://global/skin/icons/info.svg",
        "chrome://branding/content/icon32.png",
    ];
    const RENDER_ALL = true;
    const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const MAX_UNUSED_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
    const DB_FILE_NAME = "ColorfulTabs.db";
    const RELATED_TAB_ATTRS = new Set(["image", "busy", "selected", "visuallyselected"]);
    const FILE_URL_PREFIX = "file://";

    class ColorfulTabs {
        constructor() {
            this.style = addStyle(css);
            this.colorCache = new Map();
            this.pendingTabs = new Set();
            this.taskTokens = new WeakMap();
            this.pendingWrites = new Map();
            this.flushScheduled = false;
            this.closed = false;
            this.destroyPromise = null;
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext("2d", { willReadFrequently: true });
            this.db = null;
            this.dbReady = this.initDatabase();
            this.handleWindowUnload = () => {
                this.destroy().catch(Cu.reportError);
            };

            gBrowser.tabContainer.addEventListener("TabAttrModified", this, false);
            gBrowser.tabContainer.addEventListener("TabOpen", this, false);
            gBrowser.tabContainer.addEventListener("TabSelect", this, false);
            window.addEventListener("unload", this.handleWindowUnload, { once: true });
            if (typeof setUnloadMap === "function") {
                setUnloadMap("ColorfulTabs", this.handleWindowUnload);
            }

            if (RENDER_ALL) {
                document.getElementById("TabsToolbar")?.setAttribute("renderall", "true");
            }

            this.refreshAllTabs();
        }

        handleEvent(event) {
            const tab = event.target;
            if (!tab || !tab.isConnected) {
                return;
            }

            switch (event.type) {
                case "TabOpen":
                case "TabSelect":
                    this.scheduleRefresh(tab);
                    break;
                case "TabAttrModified":
                    if (this.shouldRefreshFromAttrEvent(event)) {
                        this.scheduleRefresh(tab);
                    }
                    break;
            }
        }

        shouldRefreshFromAttrEvent(event) {
            const changed = event.detail?.changed;
            if (!changed) {
                return true;
            }
            if (Array.isArray(changed)) {
                return changed.some(attr => RELATED_TAB_ATTRS.has(attr));
            }
            return String(changed)
                .split(",")
                .map(attr => attr.trim())
                .some(attr => RELATED_TAB_ATTRS.has(attr));
        }

        refreshAllTabs() {
            for (const tab of gBrowser.tabs) {
                this.scheduleRefresh(tab);
            }
        }

        scheduleRefresh(tab) {
            if (!tab?.isConnected || this.closed) {
                return;
            }

            this.pendingTabs.add(tab);
            if (this.flushScheduled) {
                return;
            }
            this.flushScheduled = true;
            window.requestAnimationFrame(() => this.flushPendingTabs());
        }

        flushPendingTabs() {
            this.flushScheduled = false;
            const tabs = Array.from(this.pendingTabs);
            this.pendingTabs.clear();
            for (const tab of tabs) {
                this.refreshTab(tab);
            }
        }

        async refreshTab(tab) {
            if (!tab?.isConnected || this.closed) {
                return;
            }

            const imageSrc = tab.getAttribute("image") || "";
            if (!imageSrc || BLACK_LIST.includes(imageSrc)) {
                this.clearColor(tab);
                return;
            }

            const host = this.getTabHost(tab);
            if (!host) {
                this.clearColor(tab);
                return;
            }

            const token = Symbol("ColorfulTabsTask");
            this.taskTokens.set(tab, token);

            let cachedEntry = null;
            try {
                cachedEntry = await this.getCachedColor(host, imageSrc);
            } catch (error) {
                Cu.reportError(error);
            }

            if (!this.isCurrentTask(tab, token)) {
                return;
            }

            if (cachedEntry?.rgb) {
                this.applyColor(tab, cachedEntry.rgb);
                if (!cachedEntry.expired && this.isSameIcon(cachedEntry.iconUrl, imageSrc)) {
                    return;
                }
            }

            const rgb = await this.extractColorFromImage(imageSrc);
            if (!this.isCurrentTask(tab, token)) {
                return;
            }

            if (!rgb) {
                if (!cachedEntry?.rgb) {
                    this.clearColor(tab);
                }
                return;
            }

            this.applyColor(tab, rgb);
            this.upsertColor(host, imageSrc, rgb).catch(Cu.reportError);
        }

        isCurrentTask(tab, token) {
            return tab?.isConnected && !this.closed && this.taskTokens.get(tab) === token;
        }

        getTabHost(tab) {
            const browser = tab?.linkedBrowser;
            const uri = browser?.currentURI || browser?.documentURI || browser?.contentPrincipal?.URI;
            if (!uri) {
                return "";
            }
            const scheme = (uri.scheme || "").toLowerCase();
            if (!/^https?$/.test(scheme)) {
                return "";
            }
            try {
                return uri.asciiHost || uri.host || "";
            } catch (_error) {
                return "";
            }
        }

        applyColor(tab, rgb) {
            if (!tab?.isConnected || !rgb) {
                return;
            }
            tab.setAttribute("colorful", "true");
            tab.style.setProperty("--colorful-tab-background", this.toRgbString(rgb));
        }

        clearColor(tab) {
            if (!tab?.style) {
                return;
            }
            tab.removeAttribute("colorful");
            tab.style.removeProperty("--colorful-tab-background");
        }

        toRgbString(rgb) {
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }

        async getCachedColor(host, imageSrc) {
            if (this.closed) {
                return null;
            }
            const now = Date.now();
            const inMemory = this.colorCache.get(host) || null;
            if (inMemory) {
                inMemory.lastUsedAt = now;
                if (inMemory.rgb) {
                    return {
                        rgb: inMemory.rgb,
                        iconUrl: inMemory.iconUrl,
                        expired: now - inMemory.updatedAt > CACHE_TTL_MS || !this.isSameIcon(inMemory.iconUrl, imageSrc),
                    };
                }
            }

            const db = await this.dbReady;
            if (!db || this.closed) {
                if (inMemory) {
                    return {
                        rgb: inMemory.rgb,
                        iconUrl: inMemory.iconUrl,
                        expired: now - inMemory.updatedAt > CACHE_TTL_MS || !this.isSameIcon(inMemory.iconUrl, imageSrc),
                    };
                }
                return null;
            }

            const row = await db.executeCached(
                `SELECT host, icon_url, r, g, b, updated_at, last_used_at
                 FROM colors
                 WHERE host = :host`,
                { host },
                resultRow => ({
                    host: resultRow.getResultByName("host"),
                    iconUrl: resultRow.getResultByName("icon_url"),
                    rgb: {
                        r: resultRow.getResultByName("r"),
                        g: resultRow.getResultByName("g"),
                        b: resultRow.getResultByName("b"),
                    },
                    updatedAt: resultRow.getResultByName("updated_at"),
                    lastUsedAt: resultRow.getResultByName("last_used_at"),
                })
            );

            const entry = row?.[0] || null;
            if (!entry) {
                return inMemory
                    ? {
                        rgb: inMemory.rgb,
                        iconUrl: inMemory.iconUrl,
                        expired: now - inMemory.updatedAt > CACHE_TTL_MS || !this.isSameIcon(inMemory.iconUrl, imageSrc),
                    }
                    : null;
            }

            entry.lastUsedAt = now;
            this.colorCache.set(host, entry);
            this.touchLastUsed(host).catch(Cu.reportError);

            return {
                rgb: entry.rgb,
                iconUrl: entry.iconUrl,
                expired: now - entry.updatedAt > CACHE_TTL_MS || !this.isSameIcon(entry.iconUrl, imageSrc),
            };
        }

        isSameIcon(a, b) {
            return (a || "") === (b || "");
        }

        async upsertColor(host, imageSrc, rgb) {
            if (this.closed) {
                return;
            }
            const now = Date.now();
            const entry = {
                host,
                iconUrl: imageSrc,
                rgb: this.cloneRgb(rgb),
                updatedAt: now,
                lastUsedAt: now,
            };
            this.colorCache.set(host, entry);

            const db = await this.dbReady;
            if (!db || this.closed) {
                return;
            }

            const previousWrite = this.pendingWrites.get(host) || Promise.resolve();
            const nextWrite = previousWrite
                .catch(() => { })
                .then(() => db.executeCached(
                    `INSERT INTO colors (host, icon_url, r, g, b, updated_at, last_used_at)
                     VALUES (:host, :icon_url, :r, :g, :b, :updated_at, :last_used_at)
                     ON CONFLICT(host) DO UPDATE SET
                         icon_url = excluded.icon_url,
                         r = excluded.r,
                         g = excluded.g,
                         b = excluded.b,
                         updated_at = excluded.updated_at,
                         last_used_at = excluded.last_used_at`,
                    {
                        host,
                        icon_url: imageSrc,
                        r: entry.rgb.r,
                        g: entry.rgb.g,
                        b: entry.rgb.b,
                        updated_at: now,
                        last_used_at: now,
                    }
                ))
                .finally(() => {
                    if (this.pendingWrites.get(host) === nextWrite) {
                        this.pendingWrites.delete(host);
                    }
                });

            this.pendingWrites.set(host, nextWrite);
            await nextWrite;
        }

        async touchLastUsed(host) {
            const db = await this.dbReady;
            if (!db || this.closed) {
                return;
            }
            const entry = this.colorCache.get(host);
            if (!entry) {
                return;
            }
            await db.executeCached(
                `UPDATE colors
                 SET last_used_at = :last_used_at
                 WHERE host = :host`,
                {
                    host,
                    last_used_at: entry.lastUsedAt,
                }
            );
        }

        cloneRgb(rgb) {
            return {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
            };
        }

        async extractColorFromImage(imageSrc) {
            if (!this.context || !imageSrc || BLACK_LIST.includes(imageSrc)) {
                return null;
            }

            const img = document.createElement("img");
            img.decoding = "async";
            img.src = imageSrc;

            try {
                await this.waitForImage(img);
            } catch (_error) {
                return null;
            }

            const width = img.naturalWidth || img.width || img.offsetWidth;
            const height = img.naturalHeight || img.height || img.offsetHeight;
            if (!width || !height) {
                return null;
            }

            const canvas = this.canvas;
            const context = this.context;
            canvas.width = width;
            canvas.height = height;
            context.clearRect(0, 0, width, height);

            try {
                context.drawImage(img, 0, 0, width, height);
                const imageData = context.getImageData(0, 0, width, height);
                return this.normalizeRgb(this.computeWeightedColor(imageData));
            } catch (_error) {
                return null;
            } finally {
                canvas.width = 1;
                canvas.height = 1;
            }
        }

        async waitForImage(img) {
            if (img.complete && (img.naturalWidth || img.naturalHeight)) {
                return;
            }

            if (typeof img.decode === "function") {
                try {
                    await img.decode();
                    if (img.naturalWidth || img.naturalHeight) {
                        return;
                    }
                } catch (_error) {
                }
            }

            await new Promise((resolve, reject) => {
                const cleanup = () => {
                    img.removeEventListener("load", onLoad);
                    img.removeEventListener("error", onError);
                };
                const onLoad = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    reject(new Error("favicon load failed"));
                };
                img.addEventListener("load", onLoad, { once: true });
                img.addEventListener("error", onError, { once: true });
            });
        }

        computeWeightedColor(imageData) {
            const data = imageData?.data;
            if (!data?.length) {
                return null;
            }

            let totalWeight = 0;
            let totalR = 0;
            let totalG = 0;
            let totalB = 0;
            const step = data.length > 4096 ? 8 : 4;

            for (let i = 0; i < data.length; i += step) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a < 96) {
                    continue;
                }

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;

                if (brightness > 245 || brightness < 18) {
                    continue;
                }
                if (saturation < 0.08 && brightness > 220) {
                    continue;
                }
                if (saturation < 0.05 && brightness < 48) {
                    continue;
                }
                if (saturation < 0.12 && brightness >= 80 && brightness <= 200) {
                    continue;
                }

                const alphaWeight = a / 255;
                const saturationWeight = 0.45 + saturation * 1.55;
                const brightnessWeight = 1 - Math.abs(brightness - 152) / 255;
                const weight = Math.max(0.15, alphaWeight * saturationWeight * (0.35 + brightnessWeight));

                totalWeight += weight;
                totalR += r * weight;
                totalG += g * weight;
                totalB += b * weight;
            }

            if (!totalWeight) {
                return null;
            }

            return {
                r: Math.round(totalR / totalWeight),
                g: Math.round(totalG / totalWeight),
                b: Math.round(totalB / totalWeight),
            };
        }

        normalizeRgb(rgb) {
            if (!rgb) {
                return null;
            }

            let { h, s, l } = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            s = Math.max(s, 0.42);
            l = Math.min(0.68, Math.max(0.40, l));
            return this.hslToRgb(h, s, l);
        }

        rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0;
            let s = 0;
            const l = (max + min) / 2;

            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    default:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }

            return { h, s, l };
        }

        hslToRgb(h, s, l) {
            if (s === 0) {
                const value = Math.round(l * 255);
                return { r: value, g: value, b: value };
            }

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            return {
                r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
                g: Math.round(hue2rgb(p, q, h) * 255),
                b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
            };
        }

        async initDatabase() {
            try {
                const db = await Sqlite.openConnection({
                    path: this.getDatabasePath(),
                });
                if (this.closed) {
                    await db.close();
                    return null;
                }
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS colors (
                        host TEXT PRIMARY KEY,
                        icon_url TEXT NOT NULL DEFAULT '',
                        r INTEGER NOT NULL,
                        g INTEGER NOT NULL,
                        b INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        last_used_at INTEGER NOT NULL
                    )
                `);
                if (this.closed) {
                    await db.close();
                    return null;
                }
                this.db = db;
                if (!this.closed) {
                    this.cleanupOldEntries().catch(Cu.reportError);
                }
                return db;
            } catch (error) {
                Cu.reportError(error);
                return null;
            }
        }

        getScriptDirPath() {
            const filename = Components.stack.filename || "";
            if (filename.startsWith(FILE_URL_PREFIX)) {
                return PathUtils.parent(this.fileUrlToPath(filename));
            }

            const script = window.userChrome_js?.scripts?.find(item => item.filename === "ColorfulTabs.uc.js");
            if (script?.file?.path) {
                return PathUtils.parent(script.file.path);
            }

            return PathUtils.join(Services.dirsvc.get("UChrm", Ci.nsIFile).path, "UserChromeJS");
        }

        getDatabasePath() {
            return PathUtils.join(this.getScriptDirPath(), DB_FILE_NAME);
        }

        fileUrlToPath(url) {
            return Services.io.newURI(url).QueryInterface(Ci.nsIFileURL).file.path;
        }

        async cleanupOldEntries() {
            const db = await this.dbReady;
            if (!db || this.closed) {
                return;
            }
            await db.executeCached(
                `DELETE FROM colors
                 WHERE last_used_at < :cutoff`,
                {
                    cutoff: Date.now() - MAX_UNUSED_RETENTION_MS,
                }
            );
        }

        async destroy() {
            if (this.destroyPromise) {
                return this.destroyPromise;
            }

            this.destroyPromise = (async () => {
                this.closed = true;
                this.pendingTabs.clear();
                this.colorCache.clear();
                this.taskTokens = new WeakMap();
                this.pendingWrites.clear();

                gBrowser.tabContainer.removeEventListener("TabAttrModified", this, false);
                gBrowser.tabContainer.removeEventListener("TabOpen", this, false);
                gBrowser.tabContainer.removeEventListener("TabSelect", this, false);
                window.removeEventListener("unload", this.handleWindowUnload, { once: true });

                document.getElementById("TabsToolbar")?.removeAttribute("renderall");

                if (this.style?.parentNode) {
                    this.style.parentNode.removeChild(this.style);
                }

                let db = this.db;
                if (!db) {
                    try {
                        db = await this.dbReady;
                    } catch (error) {
                        Cu.reportError(error);
                    }
                }

                this.db = null;
                if (db) {
                    try {
                        await db.close();
                    } catch (error) {
                        Cu.reportError(error);
                    }
                }
            })();

            return this.destroyPromise;
        }
    }

    function addStyle(styleText) {
        const pi = document.createProcessingInstruction(
            "xml-stylesheet",
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(styleText) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    if (gBrowserInit.delayedStartupFinished) {
        window.ColorfulTabs = new ColorfulTabs();
    } else {
        const delayedListener = (subject, topic) => {
            if (topic === "browser-delayed-startup-finished" && subject === window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.ColorfulTabs = new ColorfulTabs();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})(`
#TabsToolbar:not([brighttext]) #tabbrowser-tabs .tabbrowser-tab[visuallyselected][colorful] .tab-background {
    background: -moz-linear-gradient(left, color-mix(in srgb, var(--colorful-tab-background) 30%, white), color-mix(in srgb, var(--colorful-tab-background) 50%, white)) !important;
}
#TabsToolbar[renderall]:not([brighttext]) #tabbrowser-tabs .tabbrowser-tab[colorful] .tab-background {
    background: -moz-linear-gradient(left, color-mix(in srgb, var(--colorful-tab-background) 30%, white), color-mix(in srgb, var(--colorful-tab-background) 50%, white)) !important;
}
`);
