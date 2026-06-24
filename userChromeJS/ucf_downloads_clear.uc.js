// ==UserScript==
// @name            ucf_downloads_clear.uc.js
// @description     在下载面板添加“清空下载记录”按钮
// @include         main
// @compatibility   Firefox 136+
// @homepageURL     https://github.com/VicDobrov/UserChromeFiles/blob/main/profile_ucf_dobrov/chrome/user_chrome_files/custom_scripts/ucf_downloads_clear.js
// ==/UserScript==

(function () {
    "use strict";

    if (window.cleardownloadsbutton) {
        window.cleardownloadsbutton.destructor?.();
    }

    window.cleardownloadsbutton = {
        STYLE: "data:text/css;charset=utf-8," + encodeURIComponent(`
            vbox#downloadsFooterButtons {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                grid-auto-rows: auto 1fr !important;
                align-items: stretch !important;
                grid-template-areas: "a a" "b c" !important;
            }
            vbox#downloadsFooterButtons > toolbarseparator:first-of-type {
                grid-area: a !important;
                align-self: start !important;
            }
            vbox#downloadsFooterButtons > #downloadsHistory {
                grid-area: c !important;
            }
            vbox#downloadsFooterButtons > #ucf-cleardownloads-btn {
                grid-area: b !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn,
            #downloadsFooterButtons > #downloadsHistory {
                min-height: 32px !important;
                padding-block: 0 !important;
                padding-inline: 12px !important;
                margin: 0 !important;
                -moz-box-flex: 1 !important;
                -moz-box-pack: center !important;
                -moz-box-align: center !important;
                justify-content: center !important;
                text-align: center !important;
                border: 1px solid color-mix(in srgb, currentColor 18%, transparent) !important;
                border-radius: 4px !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn > .button-box,
            #downloadsFooterButtons > #downloadsHistory > .button-box {
                -moz-box-pack: center !important;
                -moz-box-align: center !important;
                justify-content: center !important;
                text-align: center !important;
                width: 100% !important;
            }
            #downloadsFooterButtons.panel-footer.panel-footer-menulike > #ucf-cleardownloads-btn,
            #downloadsFooterButtons.panel-footer.panel-footer-menulike > #downloadsHistory {
                margin-top: 4px !important;
            }
            #downloadsFooterButtons > #downloadsHistory {
                background-color: color-mix(in srgb, currentColor 6%, transparent) !important;
            }
            #downloadsFooterButtons > #downloadsHistory:hover {
                background-color: color-mix(in srgb, currentColor 10%, transparent) !important;
            }
            #downloadsFooterButtons > #downloadsHistory:hover:active {
                background-color: color-mix(in srgb, currentColor 14%, transparent) !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn {
                --ucf-danger-bg: color-mix(in srgb, #d70022 13%, transparent);
                --ucf-danger-bg-hover: color-mix(in srgb, #d70022 19%, transparent);
                --ucf-danger-bg-active: color-mix(in srgb, #d70022 25%, transparent);
                --ucf-danger-border: color-mix(in srgb, #d70022 36%, transparent);
                --ucf-danger-text: light-dark(#9f0018, #ff9aa8);
                color: var(--ucf-danger-text) !important;
                background-color: var(--ucf-danger-bg) !important;
                border-color: var(--ucf-danger-border) !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn:not([disabled="true"]):hover {
                background-color: var(--ucf-danger-bg-hover) !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn:not([disabled="true"]):hover:active {
                background-color: var(--ucf-danger-bg-active) !important;
            }
            #downloadsFooterButtons > #ucf-cleardownloads-btn[disabled="true"] {
                color: color-mix(in srgb, var(--ucf-danger-text) 55%, currentColor) !important;
                background-color: color-mix(in srgb, var(--ucf-danger-bg) 55%, transparent) !important;
                border-color: color-mix(in srgb, var(--ucf-danger-border) 55%, transparent) !important;
                pointer-events: none !important;
            }
        `),

        init() {
            this.panel = DownloadsPanel?.panel;
            if (!this.panel) {
                return;
            }
            this.panel.addEventListener("popupshowing", this);
            if (typeof setUnloadMap === "function") {
                setUnloadMap("cleardownloadsbutton", this.destructor, this);
            } else {
                window.addEventListener("unload", () => this.destructor(), { once: true });
            }
        },

        handleEvent(event) {
            this[event.type]?.(event);
        },

        centerButtonBox(button) {
            const buttonBox = button?.querySelector?.(".button-box");
            if (!buttonBox) {
                return;
            }
            buttonBox.setAttribute("pack", "center");
            buttonBox.setAttribute("align", "center");
        },

        ensureButton() {
            if (this.btn?.isConnected) {
                this.centerButtonBox(this.btn);
                this.centerButtonBox(DownloadsView?.downloadsHistory);
                return true;
            }
            const downloadsHistory = DownloadsView?.downloadsHistory;
            if (!downloadsHistory) {
                return false;
            }
            this.centerButtonBox(downloadsHistory);
            windowUtils.loadSheetUsingURIString(this.STYLE, windowUtils.USER_SHEET);
            const btn = this.btn = document.createXULElement("button");
            btn.id = "ucf-cleardownloads-btn";
            btn.className = "downloadsPanelFooterButton subviewbutton panel-subview-footer-button toolbarbutton-1";
            btn.setAttribute("label", "清空下载记录");
            btn.setAttribute("disabled", "true");
            downloadsHistory.after(btn);
            this.centerButtonBox(btn);
            btn.addEventListener("command", this);
            return true;
        },

        command() {
            DownloadsCommon.getData(window, true).removeFinished();
            PlacesUtils.history.removeVisitsByFilter({
                transition: PlacesUtils.history.TRANSITIONS.DOWNLOAD,
            }).catch(Cu.reportError);
            this.btn.disabled = true;
        },

        async setbutton() {
            const { _downloads } = await DownloadsCommon.getData(window, true)._promiseList;
            for (const download of _downloads) {
                if (download.stopped && !(download.canceled && download.hasPartialData)) {
                    this.btn.disabled = false;
                    return;
                }
            }
            this.btn.disabled = true;
        },

        popupshowing(event) {
            if (event.target !== this.panel) {
                return;
            }
            if (!this.ensureButton()) {
                this.destructor();
                return;
            }
            this.setbutton();
            const list = DownloadsCommon.getData(window, true);
            list.addView(this);
            this.panel.addEventListener("popuphiding", event => {
                if (event.target !== this.panel) {
                    return;
                }
                list.removeView(this);
            }, { once: true });
        },

        onDownloadChanged() {
            this.setbutton();
        },

        onDownloadRemoved() {
            if (!this.btn.disabled) {
                this.setbutton();
            }
        },

        destructor() {
            this.panel?.removeEventListener("popupshowing", this);
            this.btn?.removeEventListener("command", this);
            this.btn?.remove();
            if (window.cleardownloadsbutton === this) {
                delete window.cleardownloadsbutton;
            }
        }
    };

    window.cleardownloadsbutton.init();
})();
