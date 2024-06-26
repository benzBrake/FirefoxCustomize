// ==UserScript==
// @name            ucf_autoPopup.uc.js
// @description     自动弹出菜单，来自于 Mozilla-Russia 论坛
// @author          Vitaliy V
// @include         main
// @version         2024.06.25
// @homepageURL     https://forum.mozilla-russia.org/viewtopic.php?pid=810204#p810204
// @onlyonce
// @note            因为俄文看不懂，作者到底是谁不知道
// ==/UserScript==
(async (
    id = Symbol("mouseover_openpopup"),
    delay = 300,
    hidedelay = 1000,
    btnSelectors = [
        "#PanelUI-menu-button",
        "#library-button",
        "#fxa-toolbar-menu-button",
        "#nav-bar-overflow-button",
        "#star-button-box",
        "#pageActionButton",
        "#unified-extensions-button",
        "#downloads-button",
        "#alltabs-button",
    ],
    excludeBtnSelectors = [
        "#tabs-newtab-button",
        "#new-tab-button",
        "#back-button",
        "#forward-button",
    ],
    areaSelectors = [
        "toolbar",
    ],
    hideAreaSelectors = [
        // "#PlacesToolbarItems",
    ],
) => (this[id] = {
    timer: null,
    hidetimer: null,
    hideArea: [],
    open_: false,
    get popups() {
        delete this.popups;
        return this.popups = new Set();
    },
    get btnSelectors() {
        delete this.btnSelectors;
        return this.btnSelectors = btnSelectors.join(",");
    },
    get ExtensionParent() {
        delete this.ExtensionParent;
        return this.ExtensionParent = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs").ExtensionParent;
    },
    get browserActionFor() {
        delete this.browserActionFor;
        return this.browserActionFor = this.ExtensionParent.apiManager.global.browserActionFor;
    },
    get exclude() {
        delete this.exclude;
        return this.exclude = excludeBtnSelectors.join(",");
    },
    async init() {
        await delayedStartupPromise;
        for (let elm of (this.areasList = document.querySelectorAll(areaSelectors.join(",")))) {
            elm.addEventListener("mouseover", this);
            elm.addEventListener("mouseout", this);
            elm.addEventListener("mousedown", this);
        }
        for (let elm of (this.popupsList = document.querySelectorAll("toolbar, popupset")))
            elm.addEventListener("popupshown", this);
        setUnloadMap(id, this.destructor, this);
        if (!hideAreaSelectors.length) return;
        this.popupShown_ = this.popupShown.bind(this);
        this.popupHidden_ = this.popupHidden.bind(this);
        for (let elm of (this.hideArea = document.querySelectorAll(hideAreaSelectors.join(","))))
            elm.addEventListener("popupshown", this.popupShown_);
    },
    destructor() {
        for (let elm of this.areasList) {
            elm.removeEventListener("mouseover", this);
            elm.removeEventListener("mouseout", this);
            elm.removeEventListener("mousedown", this);
        }
        for (let elm of this.popupsList)
            elm.removeEventListener("popupshown", this);
        for (let elm of this.hideArea)
            elm.removeEventListener("popupshown", this.popupShown_);
    },
    popupShown({target}) {
        if (!this.open_) {
            this.open_ = true;
            gBrowser.tabpanels.addEventListener("mouseenter", this);
        }
        target.addEventListener("mouseenter", this);
        target.addEventListener("popuphidden", this.popupHidden_, { once: true });
    },
    popupHidden({target}) {
        target.removeEventListener("mouseenter", this);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    mouseenter({currentTarget}) {
        clearTimeout(this.hidetimer);
        if (currentTarget != gBrowser.tabpanels) return;
        this.hidetimer = setTimeout(() => {
            this.hidePopup();
            gBrowser.tabpanels.removeEventListener("mouseenter", this);
            this.open_ = false;
        }, hidedelay);
    },
    popuphidden({target}) {
        this.popups.delete(target);
    },
    popupshown({target}) {
        if (target.localName === "tooltip") return;
        this.popups.add(target);
        target.addEventListener("popuphidden", this, { once: true });
    },
    hidePopup() {
        this.popups.forEach(p => p.hidePopup?.());
        this.popups.clear();
    },
    mousedown() {
        clearTimeout(this.timer);
    },
    mouseout() {
        clearTimeout(this.timer);
    },
    mouseover({target}) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (target?.matches?.(`${this.exclude},:is(menupopup,panel) :scope`) ?? true) return;
            let extensionid, isbtn = target.matches(this.btnSelectors) || !!(target.parentElement.matches(this.btnSelectors) && (target = target.parentElement));
            if (!target.hasAttribute("open")
            && (isbtn
            || target.menupopup
            || target.getAttribute("widget-type") === "view"
            || target.classList.contains("toolbarbutton-combined-buttons-dropmarker")
            || ((extensionid = target.dataset?.extensionid) && this.browserActionFor(this.ExtensionParent.WebExtensionPolicy.getByID(extensionid).extension).action.tabContext.get(gBrowser.selectedTab).popup))) {
                this.hidePopup();
                let params = { bubbles: false, cancelable: true, };
                target.dispatchEvent(new MouseEvent("mousedown", params));
                target.dispatchEvent(new MouseEvent("click", params));
            }
        }, delay);
    },
}).init())();