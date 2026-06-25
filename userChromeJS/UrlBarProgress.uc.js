// ==UserScript==
// @name            UrlBarProgress.uc.js
// @description     在地址栏背景显示当前页面加载进度
// @license         MIT License
// @compatibility   Firefox 152
// @version         20260625.1
// @charset         UTF-8
// @include         main
// @homepageURL     https://github.com/VicDobrov/UserChromeFiles/blob/main/profile_ucf_dobrov/chrome/user_chrome_files/custom_scripts/LocationBarEnhancer.js
// @note            20260625 迁移为当前 userChrome.js loader 可直接加载的普通 .uc.js 脚本
// @note            20260625 改为每窗口初始化与清理，避免重复监听和样式残留
// ==/UserScript==
(function (css) {
    "use strict";

    const SCRIPT_ID = "urlbar-progress";
    const STYLE_ID = `${SCRIPT_ID}-style`;
    const MIN_FINISH_PROGRESS = 0.95;
    const COMPLETE_DELAY = 1000;
    const HIDE_DELAY = 1000;

    const Services = globalThis.Services || Cu.import("resource://gre/modules/Services.jsm").Services;

    function addStyle(doc) {
        const oldStyle = doc.getElementById(STYLE_ID);
        if (oldStyle) {
            oldStyle.remove();
        }

        const style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
        style.id = STYLE_ID;
        style.textContent = css;
        return doc.documentElement.appendChild(style);
    }

    function init() {
        if (window.UrlBarProgress) {
            window.UrlBarProgress.destroy();
        }

        const urlbar = document.getElementById("urlbar");
        const urlbarBackground = document.getElementById("urlbar-background")
            || urlbar?.querySelector(".urlbar-background")
            || document.querySelector(".urlbar-background");
        if (!urlbarBackground || !window.gBrowser) {
            return;
        }

        const style = addStyle(document);
        const timers = new Set();
        let pageProgress = 0;

        function setProgress(value) {
            const progress = Math.max(0, Math.min(1, Number(value) || 0));
            pageProgress = progress;
            urlbarBackground.style.backgroundSize = `${progress * 100}% 100%`;
            if (progress > 0) {
                urlbarBackground.setAttribute("urlbar-progress-loading", "true");
            } else {
                urlbarBackground.removeAttribute("urlbar-progress-loading");
            }
        }

        function resetProgress() {
            pageProgress = 0;
            urlbarBackground.style.backgroundSize = "0% 100%";
            urlbarBackground.removeAttribute("urlbar-progress-loading");
        }

        function delay(callback, timeout) {
            const timer = window.setTimeout(() => {
                timers.delete(timer);
                callback();
            }, timeout);
            timers.add(timer);
        }

        const listener = {
            onChangeTab() {
                resetProgress();
            },

            onProgressChange(browser, webProgress, request, curSelfProgress, maxSelfProgress, curTotalProgress, maxTotalProgress) {
                if (browser !== gBrowser.selectedBrowser || maxTotalProgress <= 0 || curTotalProgress < 0) {
                    return;
                }

                const progress = Math.max(pageProgress, curTotalProgress / maxTotalProgress);
                setProgress(progress);

                if (progress > 0.9) {
                    delay(() => {
                        if (pageProgress > MIN_FINISH_PROGRESS) {
                            setProgress(1);
                        }
                    }, COMPLETE_DELAY);
                }
            },

            onStateChange(browser, webProgress, request, stateFlags) {
                if (browser !== gBrowser.selectedBrowser) {
                    return;
                }

                const wpl = Ci.nsIWebProgressListener;
                if (stateFlags & wpl.STATE_START && stateFlags & wpl.STATE_IS_NETWORK) {
                    setProgress(0.08);
                    return;
                }

                if (stateFlags & wpl.STATE_STOP && stateFlags & wpl.STATE_IS_NETWORK) {
                    setProgress(1);
                    delay(resetProgress, HIDE_DELAY);
                }
            }
        };

        gBrowser.tabContainer.addEventListener("TabSelect", listener.onChangeTab);
        gBrowser.addTabsProgressListener(listener);
        resetProgress();

        window.UrlBarProgress = {
            destroy() {
                for (const timer of timers) {
                    window.clearTimeout(timer);
                }
                timers.clear();
                gBrowser.tabContainer.removeEventListener("TabSelect", listener.onChangeTab);
                gBrowser.removeTabsProgressListener(listener);
                urlbarBackground.style.removeProperty("background-size");
                urlbarBackground.removeAttribute("urlbar-progress-loading");
                style.remove();
                if (window.UrlBarProgress === this) {
                    delete window.UrlBarProgress;
                }
            }
        };

        window.addEventListener("unload", () => window.UrlBarProgress?.destroy(), { once: true });
    }

    if (gBrowserInit.delayedStartupFinished) {
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
})(`
#urlbar-background,
#urlbar .urlbar-background {
    background-image:
        repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0) 6px,
            rgba(255, 255, 255, .28) 6px,
            rgba(255, 255, 255, .28) 12px
        ),
        linear-gradient(to right, #72d3ff 0%, #bff7ee 70%, #e8fff6 100%);
    background-position: 0 0;
    background-repeat: repeat-x, no-repeat;
    background-size: 0% 100%;
    transition: background-size 350ms ease;
}

#urlbar-background[urlbar-progress-loading],
#urlbar .urlbar-background[urlbar-progress-loading] {
    animation: urlbar-progress-stripes 2s linear infinite;
}

@keyframes urlbar-progress-stripes {
    from {
        background-position: 0 0;
    }
    to {
        background-position: 51px 0;
    }
}
`);
