// ==UserScript==
// @name           addMenuPlusLegacyAdapter.uc.js
// @description    为 alice0775 原版 userChrome.js 适配 addMenuPlus.uc.mjs
// @author         Ryan
// @include        main
// @skip           true
// @version        2026.04.07
// @note           Register AddMenu actor for original .uc.js-only loaders and import addMenuPlus.uc.mjs in window scope
// ==/UserScript==
(function () {
    "use strict";

    if (typeof window === "undefined" || window !== window.top) {
        return;
    }

    const { Services } = globalThis;
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const console = Cu.getGlobalForObject(Services).console;
    const LOG_PREFIX = "[addMenuPlusLegacyAdapter]";
    const globalState = Cu.getGlobalForObject(Services);
    const ACTOR_NAME = "AddMenu";
    const ACTOR_FLAG = "__addMenuPlusLegacyActorRegistered";
    const RESOURCE_ALIAS = "addmenuplus-legacy";
    const DEBUG = false;

    function log (...args) {
        if (DEBUG) {
            console.log(LOG_PREFIX, ...args);
        }
    }

    function error (...args) {
        console.error(LOG_PREFIX, ...args);
    }

    function getCurrentScriptFile () {
        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        const spec = (Components.stack.filename || Error().fileName || "").split("?")[0];
        if (!spec.startsWith("file://")) {
            return null;
        }
        return fph.getFileFromURLSpec(spec);
    }

    function findFileRecursive (dir, leafName, maxDepth = 6) {
        if (!dir?.exists() || !dir.isDirectory() || maxDepth < 0) {
            return null;
        }
        const entries = dir.directoryEntries;
        while (entries.hasMoreElements()) {
            const entry = entries.getNext().QueryInterface(Ci.nsIFile);
            if (entry.isFile() && entry.leafName === leafName) {
                return entry;
            }
            if (entry.isDirectory()) {
                const found = findFileRecursive(entry, leafName, maxDepth - 1);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    function getCandidateFiles () {
        const chromeDir = Services.dirsvc.get("UChrm", Ci.nsIFile);
        const currentFile = getCurrentScriptFile();
        const candidates = [];
        const pushCandidate = file => {
            if (!file) {
                return;
            }
            const path = file.path;
            if (!candidates.some(candidate => candidate.path === path)) {
                candidates.push(file);
            }
        };

        if (currentFile?.parent) {
            const sibling = currentFile.parent.clone();
            sibling.append("addMenuPlus.uc.mjs");
            pushCandidate(sibling);

            const derived = currentFile.parent.clone();
            derived.append(currentFile.leafName.replace(/(?:\.loader|LegacyAdapter)?\.uc\.js$/i, ".uc.mjs"));
            pushCandidate(derived);
        }

        const rootFile = chromeDir.clone();
        rootFile.append("addMenuPlus.uc.mjs");
        pushCandidate(rootFile);

        const userChromeJSFile = chromeDir.clone();
        userChromeJSFile.append("UserChromeJS");
        userChromeJSFile.append("addMenuPlus.uc.mjs");
        pushCandidate(userChromeJSFile);

        const found = findFileRecursive(chromeDir.clone(), "addMenuPlus.uc.mjs");
        pushCandidate(found);

        return candidates;
    }

    function resolveModuleFile () {
        for (const file of getCandidateFiles()) {
            if (file.exists()) {
                log(`resolved module file: ${file.path}`);
                return file;
            }
        }
        throw new Error("Module file not found: addMenuPlus.uc.mjs");
    }

    function getResourceModuleURI (file) {
        const resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsISubstitutingProtocolHandler);
        const baseURI = Services.io.newFileURI(file.parent);
        resourceHandler.setSubstitution(RESOURCE_ALIAS, baseURI);
        log(`registered resource alias: resource://${RESOURCE_ALIAS}/ -> ${file.parent.path}`);
        return `resource://${RESOURCE_ALIAS}/${encodeURIComponent(file.leafName)}?${file.lastModifiedTime}`;
    }

    async function importIntoWindow (moduleURI) {
        const script = await ChromeUtils.compileScript(`data:,"use strict";import(${JSON.stringify(moduleURI)}).catch(console.error)`);
        if (!script) {
            return;
        }
        script.executeInGlobal(window, { reportExceptions: true });
        log("imported addMenuPlus.uc.mjs into window scope");
    }

    function ensureToolbarButton () {
        const widgetId = "addMenu-button";
        const logWidgetState = (stage) => {
            let widget = null;
            let placement = null;
            let node = null;
            try {
                widget = window.CustomizableUI?.getWidget?.(widgetId) || null;
                placement = window.CustomizableUI?.getPlacementOfWidget?.(widgetId) || null;
                node = widget?.forWindow(window)?.node || window.document.getElementById(widgetId);
            } catch (ex) { }
            log(`toolbar button state [${stage}]`, {
                widget: !!widget,
                placement,
                node: !!node,
                delayedStartupFinished: !!window.gBrowserInit?.delayedStartupFinished,
            });
        };

        const attempt = () => {
            const addMenu = window.addMenu;
            if (!addMenu) {
                log("toolbar button recovery waiting for window.addMenu");
                return false;
            }
            try {
                logWidgetState("before-initButton");
                const ready = addMenu.initButton?.();
                log(`toolbar button recovery attempt: ${ready ? "ready" : "pending"}`);
                logWidgetState("after-initButton");
                if (ready) {
                    addMenu.rebuild?.();
                }
                return !!ready;
            } catch (ex) {
                error("toolbar button recovery failed", ex);
                return false;
            }
        };

        [0, 150, 500, 1000].forEach(delay => {
            setTimeout(() => {
                attempt();
            }, delay);
        });
    }

    function whenBrowserReady (callback) {
        if (window.gBrowserInit?.delayedStartupFinished) {
            callback();
            return;
        }

        const topic = "browser-delayed-startup-finished";
        const observer = (subject, observedTopic) => {
            if (observedTopic !== topic || subject !== window) {
                return;
            }
            Services.obs.removeObserver(observer, topic);
            callback();
        };

        Services.obs.addObserver(observer, topic);
        window.addEventListener("unload", () => {
            try {
                Services.obs.removeObserver(observer, topic);
            } catch (ex) { }
        }, { once: true });
        log("waiting for delayed startup before importing addMenuPlus.uc.mjs");
    }

    function registerActor (moduleURI) {
        if (globalState[ACTOR_FLAG]) {
            log(`skip actor registration because "${ACTOR_NAME}" is already registered`);
            return;
        }
        ChromeUtils.registerWindowActor(ACTOR_NAME, {
            parent: {
                esModuleURI: moduleURI,
            },
            child: {
                esModuleURI: moduleURI,
                events: {
                    contextmenu: {
                        capture: true,
                    },
                },
            },
            allFrames: true,
        });
        globalState[ACTOR_FLAG] = true;
        log(`registered actor "${ACTOR_NAME}"`);
    }

    try {
        const moduleFile = resolveModuleFile();
        const moduleURI = getResourceModuleURI(moduleFile);
        registerActor(moduleURI);
        whenBrowserReady(() => {
            importIntoWindow(moduleURI)
                .then(() => ensureToolbarButton())
                .catch(ex => error("failed to import module", ex));
        });
    } catch (ex) {
        error("adapter initialization failed", ex);
    }
})();
