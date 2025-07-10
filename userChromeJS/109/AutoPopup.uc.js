// ==UserScript==
// @name           AutoPopup.uc.js
// @description    Auto popup menulist/menupopup
// @compatibility  Firefox 109
// @author         GOLF-AT, modified by gsf, aborix, Ryan & AI
// @version        2025.07.10
// ==/UserScript==

(function () {
    if (window.AutoPopupInitialized) {
        return;
    }
    window.AutoPopupInitialized = true;

    const showDelay = 200;
    const hideDelay = 500;
    const alwaysPop = false;

    var overElt = null; // The element that triggered the current popup/is being hovered
    var PopElt = null;  // The actual popup/panel element that is currently open
    var PopTimer = null;
    var HideTimer = null;

    var blackIDs = [];

    var whiteIDs = [
        { id: 'omnibar-defaultEngine', popMenu: 'omnibar-engine-menu', run: function (overElem) { document.getElementById('omnibar-in-urlbar').click(0); } },
        { id: 'ucjs_zoom_statuslabel', popMenu: 'ucjs_zoom-context', run: null },
        { id: 'UserScriptLoader-icon', popMenu: 'UserScriptLoader-popup', run: null },
        { id: 'PanelUI-menu-button', popMenu: 'appMenu-popup', run: null },
        {
            id: 'unified-extensions-button',
            toggle: function (event) { gUnifiedExtensions.togglePanel(event); },
            getPopup: function () { return gUnifiedExtensions.panel; }
        }, {
            id: 'alltabs-button',
            open: function (event) { gTabsPanel.showAllTabsPanel(event, "alltabs-button"); return document.getElementById('customizationui-widget-panel'); },
            close: function () { document.getElementById('customizationui-widget-panel')?.hidePopup() },
        }
    ];

    // --- Helper functions ---
    const popupPos = ['after_start', 'end_before', 'before_start', 'start_before'];
    const searchBar = window.BrowserSearch ? BrowserSearch.searchBar : null;
    function IsButton (elt) { return elt && (elt.localName == 'toolbarbutton' || elt.localName == 'button'); }
    function IsWidgetBtn (elt) { return IsButton(elt) && ((elt.hasAttribute('widget-id') && elt.getAttribute('widget-type') == 'view') || elt.id == 'fxa-toolbar-menu-button' || elt.id == 'library-button' || elt.id == 'alltabs-button'); }
    function IsSearchBtn (elt) { return (elt && elt.className == 'searchbar-search-button'); }
    function IsPanelMenuBtn (elt) { return elt && elt.id == 'PanelUI-menu-button'; }
    function IsDownloadBtn (elt) { return elt && elt.id == 'downloads-button'; }
    function IsMenuBtn (elt) { return IsPanelMenuBtn(elt) || IsDownloadBtn(elt) || IsWidgetBtn(elt) || (IsButton(elt) && getPopupMenu(elt)); }
    function IsOverflowBtn (elt) { return elt && elt.id == 'nav-bar-overflow-button'; }
    function IsUrlbarDropmarker (elt) { return elt && elt.classList && elt.classList.contains('urlbar-history-dropmarker'); }
    function IsCustomizationBtn (elt) { return IsButton(elt) && elt.className == 'customizationmode-button'; }
    function IsAutoComplete (elt) { try { return elt.getAttribute('type').substring(0, 12) == 'autocomplete'; } catch (e) { return false; } }
    function isBlackNode (elt) { return blackIDs.some(function (css) { try { var nodes = document.querySelectorAll(css); } catch (e) { return false; } for (var node of nodes) { if (node == elt) return true; } return false; }); }

    // Gets the popup element associated with a triggering element.
    function getPopupMenu (elt) {
        if (!elt) return null;
        // Check if it's a specific whiteIDs button with a defined popup getter
        let config = whiteIDs.find(c => c.id === elt.id);
        if (config) {
            if (config.getPopup) return config.getPopup();
            const popupId = config.panelId || config.popMenu;
            if (popupId) return document.getElementById(popupId);
        }
        // General popup discovery
        var nodes = elt.childNodes;
        if (nodes) {
            for (let node of nodes) {
                if (node.localName == 'menupopup' || node.localName == 'panel') return node;
            }
        }
        var s = elt.getAttribute('popup');
        return s ? document.getElementById(s) : null;
    }

    // Finds the element that can trigger a popup/menu based on mouseover target
    function getPopupNode (node) {
        for (; node != null; node = node.parentNode) {
            // If it's a specific button that's part of whiteIDs, let getTargetButton handle it
            if (node.id && whiteIDs.some(c => c.id === node.id)) return node;

            // Common popup triggers
            if (node.localName == 'menupopup' || node.localName == 'popup' || node.localName == 'menulist' || IsAutoComplete(node) || IsMenuBtn(node) || IsUrlbarDropmarker(node)) {
                return node;
            } else if (node.localName == 'dropmarker' && node.getAttribute('type') == 'menu' && node.parentNode.firstChild.localName == 'menupopup') {
                return node;
            } else if (node.localName == 'menu') {
                return (node.parentNode.localName == 'menubar') ? node : null;
            } else if (IsButton(node)) {
                // For buttons, check if there's an associated dropmarker or popup attribute
                let dropmarker = node.nextSibling;
                if (dropmarker && dropmarker.localName == 'dropmarker' && dropmarker.width > 0 && dropmarker.height > 0) return node;
                if (node.hasAttribute('popup') || node.hasAttribute('onclick') || node.hasAttribute('oncommand')) return node; // Simple check for buttons that might trigger popups
            }

            // Stop at certain containers to avoid going too far up the DOM tree
            if (node.localName == 'toolbar' || node.localName == 'window') break;
        }
        return null;
    }

    function getPopupPos (elt) { // unchanged, omitted for brevity
        if (elt.id == 'bookmarks-menu-button') return null;
        var x, y, pos, i;
        for (pos = 0, x = elt.screenX, y = elt.screenY; elt != null; elt = elt.parentNode) {
            if (elt.localName == 'window' || !elt.parentNode) break;
            else if (elt.localName != 'toolbar' && elt.localName != 'hbox' && elt.localName != 'vbox');
            else if (elt.height >= 3 * elt.width) {
                if (elt.height >= 45) { pos = 9; break; }
            } else if (elt.width >= 3 * elt.height) {
                if (elt.width >= 45) { pos = 8; break; }
            }
        }
        try { i = (pos & 1) ? (x <= elt.width / 2 + elt.screenX ? 1 : 3) : (y <= elt.height / 2 + elt.screenY ? 0 : 2); } catch (e) { i = 0; }
        return popupPos[i];
    }

    function AutoPopup (aEvent) {
        PopTimer = null;
        if (!overElt) return; // Should not happen if called correctly

        let config = whiteIDs.find(c => c.id === overElt.id);
        if (config) {
            if (config.open) {
                PopElt = config.open(aEvent);
                return;
            } else if (config.toggle) {
                if (!overElt.hasAttribute("open")) {
                    config.toggle(aEvent);
                }
                PopElt = config.getPopup();
                return;
            }
            if (config.run) { config.run(overElt); return; }
        }

        // General popup logic for non-whiteIDs elements
        if (!PopElt) PopElt = getPopupMenu(overElt) || overElt; // Try to get the popup again if not already set

        // This block needs to handle all the different ways to open a popup that are not a simple hidePopup/showPopup
        if (overElt.localName == 'dropmarker') { PopElt.showPopup(); }
        else if (overElt.localName == 'menulist') { overElt.open = true; }
        else if (IsPanelMenuBtn(overElt)) { PopElt = document.getElementById('appMenu-popup'); PanelUI.show(); }
        else if (IsWidgetBtn(overElt)) { PopElt = document.getElementById('customizationui-widget-panel'); if (overElt.hasAttribute('onmousedown')) overElt.dispatchEvent(new MouseEvent('mousedown')); else overElt.dispatchEvent(new UIEvent('command')); }
        else if (IsDownloadBtn(overElt)) { PopElt = document.getElementById('downloadsPanel'); DownloadsPanel.showPanel(); }
        else if (IsSearchBtn(overElt)) { searchBar.openSuggestionsPanel(); }
        else if (IsOverflowBtn(overElt)) { PopElt = document.getElementById('widget-overflow'); if (!overElt.open) overElt.click(); }
        else if (overElt.id == 'sidebar-switcher-target') { PopElt = document.getElementById('sidebarMenu-popup'); if (!overElt.classList.contains('active')) SidebarUI.toggleSwitcherPanel(); }
        else if (IsUrlbarDropmarker(overElt)) { PopElt = gURLBar.panel; if (!gURLBar.textbox.hasAttribute('open')) overElt.click(); }
        else if (IsCustomizationBtn(overElt)) { overElt.open = true; } // Generic open attribute
        else {
            try {
                let Pos = getPopupPos(overElt);
                // Ensure PopElt is not null before attempting to openPopup
                if (PopElt) {
                    PopElt.removeAttribute('hidden');
                    PopElt.openPopup(overElt, Pos, 0, 0, false, false, null);
                } else {
                    console.warn("[AutoPopup] PopElt is null for:", overElt.id || overElt.localName);
                }
            } catch (e) {
                console.error("[AutoPopup] Error opening generic popup:", e);
                PopElt = null; // Reset PopElt if opening fails
            }
        }
    }

    function HidePopup () {
        HideTimer = null;
        if (!overElt) return; // Nothing to hide or state already cleared

        let config = whiteIDs.find(c => c.id === overElt.id);
        try {
            if (config?.close) {
                config.close();
            } else if (config?.toggle) {
                // If it's a toggle button, and its associated panel is open, toggle it closed
                let panel = config.getPopup();
                if (panel && overElt.hasAttribute("open")) { // Check button's 'open' attribute
                    config.toggle();
                }
            } else if (PopElt) {
                // General popup hiding logic
                if (overElt.localName == 'menulist') {
                    overElt.open = false;
                } else if (typeof PopElt.hidePopup === 'function') {
                    PopElt.hidePopup();
                } else if (PopElt.popupBoxObject) {
                    PopElt.popupBoxObject.hidePopup();
                } else if (IsSearchBtn(overElt)) {
                    searchBar.textbox.closePopup();
                } else if (IsUrlbarDropmarker(overElt)) {
                    if (gURLBar.textbox.hasAttribute('open')) overElt.click();
                } else if (IsCustomizationBtn(overElt)) {
                    overElt.open = false;
                } else if (IsOverflowBtn(overElt) || overElt.id == 'sidebar-switcher-target') {
                    if (overElt.open) overElt.click(); // Click again to close
                } else {
                    // Fallback for panels/popups without a specific hide method
                    if (PopElt.state === "open") {
                        // This part should be rarely hit if specific methods are correct
                        PopElt.hidePopup();
                    }
                }
            }
        } catch (e) {
            console.error("[AutoPopup] Error in HidePopup:", e);
        }

        // Always clear state after attempting to hide
        overElt = PopElt = null;
    }

    function MouseOver (e) {
        if (!alwaysPop && !document.hasFocus()) return;

        let target = e.originalTarget;

        // 1. If mouse is already within the currently open popup, cancel hide timer and do nothing.
        if (PopElt && (target === PopElt || PopElt.contains(target))) {
            if (HideTimer) clearTimeout(HideTimer); HideTimer = null;
            return;
        }

        // 2. Determine the element that should trigger a popup
        let newOverElt = null;
        let config = whiteIDs.find(c => c.id === target.id); // Check if target is a whiteID button
        if (config) {
            newOverElt = target;
        } else {
            // If not a specific whiteID button, try to find a general popup-triggering node
            newOverElt = getPopupNode(target);
        }

        // If no valid new triggering element found, or if it's disabled/blacklisted, trigger hide for current popup
        if (!newOverElt || newOverElt.disabled || isBlackNode(newOverElt)) {
            MouseOut(e); // Mouse has moved to an invalid/non-popup-triggering area
            return;
        }

        // If we are still hovering over the same element, just clear hide timer and return
        if (newOverElt === overElt) {
            if (HideTimer) clearTimeout(HideTimer); HideTimer = null;
            return;
        }

        // We are moving to a new valid element.
        // Clear any pending show/hide timers for the old element.
        if (PopTimer) clearTimeout(PopTimer); PopTimer = null;
        if (HideTimer) clearTimeout(HideTimer); HideTimer = null;

        // If there was an old element, hide its popup immediately.
        if (overElt) {
            HidePopup();
        }

        // Set the new element and schedule its popup.
        overElt = newOverElt;
        PopElt = null; // PopElt will be set inside AutoPopup if successfully opened
        PopTimer = setTimeout(() => AutoPopup(e), showDelay);
    }

    function MouseOut (e) {
        if (PopTimer) { clearTimeout(PopTimer); PopTimer = null; }

        if (overElt && !HideTimer) {
            // Check if the mouse is moving to the associated popup/panel or the element itself
            let relatedTarget = e.relatedTarget;
            if (relatedTarget) {
                // Is the relatedTarget the currently open popup or contained within it?
                // Or is it the overElt itself or contained within it?
                if ((PopElt && (relatedTarget === PopElt || PopElt.contains(relatedTarget))) ||
                    (relatedTarget === overElt || overElt.contains(relatedTarget))) {
                    return; // Don't hide if moving between trigger and its popup, or within trigger
                }
            }
            // Mouse has moved outside the active area (trigger or its popup)
            HideTimer = setTimeout(HidePopup, hideDelay);
        }
    }

    window.addEventListener('mouseover', MouseOver, true);
    window.addEventListener('mouseout', MouseOut, true);
})();
