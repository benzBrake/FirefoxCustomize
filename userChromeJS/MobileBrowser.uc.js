// ==UserScript==
// @name            MobileBrowser.uc.js
// @description     在独立窗口中以 iPhone 14 竖屏尺寸打开当前页面
// @license         MIT License
// @compatibility   Firefox 152
// @version         0.1.10
// @charset         UTF-8
// @include         main
// @include         chrome://browser/content/browser.xhtml
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            2026-07-14 初始版本，使用 Firefox 响应式设计模式模拟 iPhone 14 竖屏窗口
// ==/UserScript==

(function () {
    "use strict";

    const Services = globalThis.Services || ChromeUtils.importESModule(
        "resource://gre/modules/Services.sys.mjs"
    ).Services;
    const CustomizableUI = globalThis.CustomizableUI || ChromeUtils.importESModule(
        "resource:///modules/CustomizableUI.sys.mjs"
    ).CustomizableUI;
    const PrivateBrowsingUtils = ChromeUtils.importESModule(
        "resource://gre/modules/PrivateBrowsingUtils.sys.mjs"
    ).PrivateBrowsingUtils;

    const BUTTON_ID = "MobileBrowser-button";
    const WINDOW_MARKER = "mobilebrowser-window";
    const RESPONSIVE_TRIGGER = "mobile-browser-button";
    const INITIAL_PLACEMENT_PREF = "userChromeJS.MobileBrowser.initialPlacement";
    const INITIAL_PLACEMENT_POSITION = 2;
    const MOBILE = Object.freeze({
        width: 390,
        height: 844,
        pixelRatio: 3,
        orientationType: "portrait-primary",
        orientationAngle: 0,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 " +
            "Mobile/15E148 Safari/604.1",
    });

    // 视口之外还需要容纳浏览器工具栏和响应式设计工具栏。
    const WINDOW_EXTRA = Object.freeze({ width: 48, height: 210 });
    const MOBILE_ICON = `data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<path fill="context-fill" d="M7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2H7zm0 2h10v16H7V3zm4 18h2v-2h-2v2z"/>' +
        '</svg>'
    )}`;

    let mobileWindow = null;
    let openingPromise = null;

    function getWindowFromNode (node) {
        return node?.documentGlobal || node?.relevantGlobal ||
            node?.ownerDocument?.defaultView || window;
    }

    function isOpen (win) {
        return !!win && !win.closed;
    }

    function findMobileWindow () {
        if (isOpen(mobileWindow)) {
            return mobileWindow;
        }

        mobileWindow = null;
        const windows = Services.wm.getEnumerator("navigator:browser");
        while (windows.hasMoreElements()) {
            const win = windows.getNext();
            if (!isOpen(win)) {
                continue;
            }
            if (win.document?.documentElement?.getAttribute(WINDOW_MARKER) === "true") {
                mobileWindow = win;
                break;
            }
        }
        return mobileWindow;
    }

    function markMobileWindow (win) {
        win.document?.documentElement?.setAttribute(WINDOW_MARKER, "true");
        win.addEventListener("unload", () => {
            if (mobileWindow === win) {
                mobileWindow = null;
            }
        }, { once: true });
    }

    function waitForDelayedStartup (win) {
        if (win.gBrowserInit?.delayedStartupFinished) {
            return Promise.resolve(win);
        }

        return new Promise((resolve, reject) => {
            let settled = false;

            const cleanup = () => {
                Services.obs.removeObserver(observer, "browser-delayed-startup-finished");
                Services.obs.removeObserver(observer, "domwindowclosed");
            };
            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(win);
            };
            const onWindowClosed = () => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                reject(new Error("移动浏览器窗口在启动完成前被关闭"));
            };
            const observer = {
                observe (subject, topic) {
                    if (subject !== win) {
                        return;
                    }
                    if (topic === "browser-delayed-startup-finished") {
                        finish();
                    } else if (topic === "domwindowclosed") {
                        onWindowClosed();
                    }
                },
            };

            Services.obs.addObserver(observer, "browser-delayed-startup-finished");
            Services.obs.addObserver(observer, "domwindowclosed");

            // 处理添加 observer 与启动完成之间的极短竞态。
            if (win.gBrowserInit?.delayedStartupFinished) {
                finish();
            } else if (!isOpen(win)) {
                onWindowClosed();
            }
        });
    }

    function getDevToolsRequire () {
        const { require } = ChromeUtils.importESModule(
            "resource://devtools/shared/loader/Loader.sys.mjs"
        );
        if (typeof require !== "function") {
            throw new Error("Firefox DevTools loader 不可用");
        }
        return require;
    }

    function getResponsiveUIManager () {
        return getDevToolsRequire()(
            "resource://devtools/client/responsive/manager.js"
        );
    }

    function waitForResponsiveDeviceList (ui) {
        const store = ui.toolWindow?.store;
        if (!store) {
            return Promise.resolve(null);
        }

        const getTerminalState = () => {
            const devices = store.getState()?.devices;
            return devices?.listState === "LOADED" ||
                devices?.listState === "ERROR" ? devices : null;
        };
        const currentState = getTerminalState();
        if (currentState) {
            return Promise.resolve(currentState);
        }

        return new Promise(resolve => {
            const unsubscribe = store.subscribe(() => {
                const devices = getTerminalState();
                if (devices) {
                    unsubscribe();
                    resolve(devices);
                }
            });
        });
    }

    async function openResponsiveUI (ResponsiveUIManager, win, tab) {
        const existingUI = ResponsiveUIManager.getResponsiveUIForTab(tab);
        if (existingUI) {
            return existingUI;
        }

        const require = getDevToolsRequire();
        const asyncStorage = require(
            "resource://devtools/shared/async-storage.js"
        );
        let savedDeviceState = null;
        try {
            savedDeviceState = await asyncStorage.getItem(
                "devtools.responsive.deviceState"
            );
        } catch (ex) {
            console.warn("MobileBrowser: 读取 RDM 设备状态失败", ex);
        }

        const opening = ResponsiveUIManager.openIfNeeded(win, tab, {
            trigger: RESPONSIVE_TRIGGER,
        });
        let ui = ResponsiveUIManager.getResponsiveUIForTab(tab);
        let originalOnChangeDevice = null;
        let wrappedOnChangeDevice = null;
        let resolveDeviceRestored = null;
        const deviceRestored = savedDeviceState && ui ? new Promise(resolve => {
            resolveDeviceRestored = resolve;
            originalOnChangeDevice = ui.onChangeDevice;
            wrappedOnChangeDevice = async function (event) {
                try {
                    return await originalOnChangeDevice.call(this, event);
                } finally {
                    if (this.onChangeDevice === wrappedOnChangeDevice) {
                        this.onChangeDevice = originalOnChangeDevice;
                    }
                    resolveDeviceRestored();
                }
            };
            ui.onChangeDevice = wrappedOnChangeDevice;
        }) : null;
        ui = await opening;

        const devices = await waitForResponsiveDeviceList(ui);
        const savedDeviceExists = savedDeviceState &&
            devices?.types?.includes(savedDeviceState.deviceType) &&
            devices[savedDeviceState.deviceType]?.some(
                device => device.name === savedDeviceState.device
            );
        if (savedDeviceExists && deviceRestored) {
            await deviceRestored;
        } else if (ui.onChangeDevice === wrappedOnChangeDevice) {
            ui.onChangeDevice = originalOnChangeDevice;
        }

        return ui;
    }

    function syncResponsiveToolbar (ui) {
        const toolWindow = ui.toolWindow;
        const store = toolWindow?.store;
        if (!store || typeof toolWindow.dispatch !== "function") {
            return Promise.resolve();
        }

        const require = getDevToolsRequire();
        const { REMOVE_DEVICE_ASSOCIATION } = require(
            "resource://devtools/client/responsive/actions/index.js"
        );
        const { changePixelRatio, changeViewportAngle } = require(
            "resource://devtools/client/responsive/actions/viewports.js"
        );
        const { changeUserAgent, toggleTouchSimulation } = require(
            "resource://devtools/client/responsive/actions/ui.js"
        );
        const viewportId = store.getState()?.viewports?.[0]?.id ?? 0;

        return Promise.resolve()
            .then(() => toolWindow.dispatch({
                type: REMOVE_DEVICE_ASSOCIATION,
                id: viewportId,
            }))
            .then(() => toolWindow.dispatch(
                changePixelRatio(viewportId, MOBILE.pixelRatio)
            ))
            .then(() => toolWindow.dispatch(
                changeViewportAngle(viewportId, MOBILE.orientationAngle)
            ))
            .then(() => toolWindow.dispatch(changeUserAgent(MOBILE.userAgent)))
            .then(() => toolWindow.dispatch(toggleTouchSimulation(true)));
    }

    function setMobileConfiguration (ui) {
        return Promise.resolve()
            .then(() => ui.updateDPPX(MOBILE.pixelRatio))
            .then(() => ui.updateScreenOrientation(
                MOBILE.orientationType,
                MOBILE.orientationAngle
            ))
            .then(() => ui.updateMaxTouchPointsEnabled(true))
            .then(() => ui.updateTouchSimulation(true, false))
            .then(() => ui.updateUserAgent(MOBILE.userAgent))
            .then(() => ui.setViewportSize({
                width: MOBILE.width,
                height: MOBILE.height,
            }))
            .then(() => syncResponsiveToolbar(ui));
    }

    function resizeMobileWindow (win) {
        const screen = win.screen;
        const availableWidth = Math.max(320, (screen.availWidth || MOBILE.width) - 16);
        const availableHeight = Math.max(480, (screen.availHeight || MOBILE.height) - 16);
        const width = Math.min(MOBILE.width + WINDOW_EXTRA.width, availableWidth);
        const height = Math.min(MOBILE.height + WINDOW_EXTRA.height, availableHeight);

        try {
            win.resizeTo(width, height);

            const left = Number.isFinite(screen.availLeft) ? screen.availLeft : 0;
            const top = Number.isFinite(screen.availTop) ? screen.availTop : 0;
            win.moveTo(
                Math.max(left, left + Math.floor((availableWidth - width) / 2)),
                Math.max(top, top + Math.floor((availableHeight - height) / 2))
            );
        } catch (ex) {
            console.warn("MobileBrowser: 调整移动窗口尺寸失败", ex);
        }
    }

    function loadCurrentPage (ui, url, triggeringPrincipal) {
        const viewportBrowser = ui.getViewportBrowser();
        if (!viewportBrowser || !url) {
            return Promise.resolve();
        }

        const currentURL = viewportBrowser.currentURI?.spec || "";
        if (currentURL === url) {
            return ui.reloadSelectedTab();
        }

        const uri = Services.io.newURI(url);
        return Promise.resolve(viewportBrowser.loadURI(uri, {
            triggeringPrincipal,
        }));
    }

    async function configureWindow (win, url, triggeringPrincipal) {
        const ResponsiveUIManager = getResponsiveUIManager();
        const tab = win.gBrowser.selectedTab;
        const ui = await openResponsiveUI(ResponsiveUIManager, win, tab);

        await setMobileConfiguration(ui);
        await loadCurrentPage(ui, url, triggeringPrincipal);
        resizeMobileWindow(win);
        win.focus();
        return win;
    }

    async function openMobileWindow (sourceWindow) {
        const sourceBrowser = sourceWindow.gBrowser?.selectedBrowser;
        const url = sourceBrowser?.currentURI?.spec || "about:blank";
        const triggeringPrincipal = sourceBrowser?.contentPrincipal ||
            Services.scriptSecurityManager.getSystemPrincipal();
        const existingWindow = findMobileWindow();

        if (existingWindow) {
            await waitForDelayedStartup(existingWindow);
            return configureWindow(existingWindow, url, triggeringPrincipal);
        }

        const newWindow = OpenBrowserWindow({
            openerWindow: sourceWindow,
            private: PrivateBrowsingUtils.isWindowPrivate(sourceWindow),
            aiWindow: false,
            args: (() => {
                const args = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
                args.data = "about:blank";
                return args;
            })(),
        });
        mobileWindow = newWindow;

        try {
            await waitForDelayedStartup(newWindow);
            markMobileWindow(newWindow);
            return await configureWindow(newWindow, url, triggeringPrincipal);
        } catch (ex) {
            if (isOpen(newWindow)) {
                newWindow.close();
            }
            if (mobileWindow === newWindow) {
                mobileWindow = null;
            }
            throw ex;
        }
    }

    function handleCommand (event) {
        const sourceWindow = getWindowFromNode(event.currentTarget || event.target);
        if (!sourceWindow.gBrowser) {
            return;
        }

        if (openingPromise) {
            openingPromise.then(win => win?.focus()).catch(console.error);
            return;
        }

        openingPromise = openMobileWindow(sourceWindow)
            .catch(ex => {
                console.error("MobileBrowser: 打开移动窗口失败", ex);
            })
            .finally(() => {
                openingPromise = null;
            });
    }

    function init () {

        try {
            CustomizableUI.createWidget({
                id: BUTTON_ID,
                removable: true,
                defaultArea: CustomizableUI.AREA_NAVBAR,
                type: "button",
                localized: false,
                label: "移动浏览器",
                tooltiptext: "以 iPhone 14 竖屏尺寸打开当前页面",
                onCreated: node => {
                    node.classList.add("chromeclass-toolbar-additional");
                    node.style.listStyleImage = `url("${MOBILE_ICON}")`;
                },
                onCommand: handleCommand,
            });
        } catch (ex) {
            console.error(ex);
        }

        const widget = CustomizableUI.getWidget(BUTTON_ID);
        widget?.forWindow(window)?.node;

        // 首次安装时放到后退/前进按钮之后，避免导航栏过宽时被溢出隐藏。
        // 完成首次放置后不再强制位置，保留用户后续自定义工具栏的结果。
        const initialPlacementDone = Services.prefs.getBoolPref(
            INITIAL_PLACEMENT_PREF,
            false
        );
        if (!initialPlacementDone) {
            CustomizableUI.addWidgetToArea(
                BUTTON_ID,
                CustomizableUI.AREA_NAVBAR,
                INITIAL_PLACEMENT_POSITION
            );
            Services.prefs.setBoolPref(INITIAL_PLACEMENT_PREF, true);
        } else if (!CustomizableUI.getPlacementOfWidget(BUTTON_ID)) {
            CustomizableUI.addWidgetToArea(BUTTON_ID, CustomizableUI.AREA_NAVBAR);
        }
    }

    if (globalThis.gBrowserInit?.delayedStartupFinished) {
        init();
    } else {
        const delayedListener = (subject, topic) => {
            if (topic === "browser-delayed-startup-finished" && subject === window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
