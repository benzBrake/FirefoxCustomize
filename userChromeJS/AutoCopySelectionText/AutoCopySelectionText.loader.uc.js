// ==UserScript==
// @name           AutoCopySelectionTextLegacyAdapter.uc.js
// @description    为 alice0775 原版 userChrome.js 适配 AutoCopySelectionText.uc.mjs
// @author         Ryan
// @include        main
// @skip           true
// @version        2026.04.07
// @note           Register ACST actor for original .uc.js-only loaders and import AutoCopySelectionText.uc.mjs in window scope
// ==/UserScript==
(function () {
    "use strict";

    if (typeof window === "undefined" || window !== window.top) {
        return;
    }

    const { Services } = globalThis;
    const Ci = Components.interfaces;
    const console = Cu.getGlobalForObject(Services).console;
    const LOG_PREFIX = "[AutoCopySelectionTextLegacyAdapter]";
    const globalState = Cu.getGlobalForObject(Services);
    const ACTOR_NAME = "ACST";
    const ACTOR_FLAG = "__autoCopySelectionTextLegacyActorRegistered";
    const RESOURCE_ALIAS = "autocopyselectiontext-legacy";
    const MODULE_FILE_NAME = "AutoCopySelectionText.uc.mjs";
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
            sibling.append(MODULE_FILE_NAME);
            pushCandidate(sibling);

            const derived = currentFile.parent.clone();
            derived.append(currentFile.leafName.replace(/(?:\\.loader|LegacyAdapter)?\\.uc\\.js$/i, ".uc.mjs"));
            pushCandidate(derived);
        }

        const rootFile = chromeDir.clone();
        rootFile.append(MODULE_FILE_NAME);
        pushCandidate(rootFile);

        const userChromeJSFile = chromeDir.clone();
        userChromeJSFile.append("UserChromeJS");
        userChromeJSFile.append(MODULE_FILE_NAME);
        pushCandidate(userChromeJSFile);

        const found = findFileRecursive(chromeDir.clone(), MODULE_FILE_NAME);
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
        throw new Error(`Module file not found: ${MODULE_FILE_NAME}`);
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
        log("imported AutoCopySelectionText.uc.mjs into window scope");
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
        log("waiting for delayed startup before importing AutoCopySelectionText.uc.mjs");
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
            },
            allFrames: true,
            matches: ["*://*/*", "file:///*", "about:*", "view-source:*"],
            messageManagerGroups: ["browsers"],
        });
        globalState[ACTOR_FLAG] = true;
        log(`registered actor "${ACTOR_NAME}"`);
    }

    try {
        const moduleFile = resolveModuleFile();
        const moduleURI = getResourceModuleURI(moduleFile);
        registerActor(moduleURI);
        whenBrowserReady(() => {
            importIntoWindow(moduleURI).catch(ex => error("failed to import module", ex));
        });
    } catch (ex) {
        error("adapter initialization failed", ex);
    }
})();
