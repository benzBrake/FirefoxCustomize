// @name			AutoPopup
// @description		自动弹出菜单
// @charset       	UTF-8
// @include			main
// ==/UserScript==

(function () {

    const showDelay = 200;   // delay of showing popups
    const hideDelay = 500;   // delay of hiding popups
    const AlwaysPop = false; // show popups also when window is not focused

    var overElt = null;
    var PopElt = null;
    var PopTimer = null;
    var HideTimer = null;

    // elements are CSS selector strings
    var BlackIDs = ['#back-button', '#forward-button', '#pocket-button', '#alltabs-button', '#sidebar-button', '#tabs-newtab-button', '#nav-bar-overflow-button', '#ublock0_raymondhill_net-browser-action', '#tab-session-manager_sienori-browser-action', '#treestyletab_piro_sakura_ne_jp-browser-action', '#switchyomega_feliscatus_addons_mozilla_org-browser-action', '#firefox_tampermonkey_net-browser-action', '#xstyle-amo_addon_firefoxcn_net-browser-action', '#_a9c2ad37-e940-4892-8dce-cd73c6cbbc0c_-browser-action', '#_f5335293-04b7-4506-a920-067103625775_-browser-action', '#_2016d4d5-91c2-41b8-b729-6401d7a1a8c5_-browser-action', '#headereditor-amo_addon_firefoxcn_net-browser-action', '#pagezipper_printwhatyoulike_com-browser-action', '#glitterdrag_harytfw-browser-action', '#enhancerforyoutube_maximerf_addons_mozilla_org-browser-action', '#_e2488817-3d73-4013-850d-b66c5e42d505_-browser-action', '#firefox-extension_sourcegraph_com-browser-action', '#wrapper-_00bf2902-f122-479e-a925-cdd0242e0ee3_-browser-action', '#zoompage-we_dw-dev-browser-action', '#_478a6f63-10b3-41e4-8216-ec5e7b3486fc_-browser-action', '#_646d57f4-d65c-4f0d-8e80-5800b92cfdaa_-browser-action', '#_e4f9e020-98d8-4b9d-a117-3e40184de553_-browser-action', '#juraj_masiar_gmail_com_scrollanywhere-browser-action', '#agentx_epistemex_com-browser-action', '#textarea-cache-lite_wildsky_cc-browser-action', '#wrapper-content-farm-terminator_danny0838_addons_mozilla_org-browser-action', '#weibopic_ac-browser-action', '#_a8332c60-5b6d-41ee-bfc8-e9bb331d34ad_-browser-action', '#content-farm-terminator_danny0838_addons_mozilla_org-browser-action', '#_cd7e22de-2e34-40f0-aeff-cec824cbccac_-browser-action', '#download-filename-encoding_qw_linux-2g64_local-browser-action', '#wrapper-_5556f97e-11a5-46b0-9082-32ad74aaa920_-browser-action', '#wrapper-_5546f97e-11a5-46b0-9082-32ad74aaa920_-browser-action', '#_d1b377eb-1b72-4aaa-a724-ba69bbac9a34_-browser-action', '#_b9db16a4-6edc-47ec-a1f4-b86292ed211d_-browser-action', '#_d6363e09-b7b4-4c41-bd5f-802872ac38b9_-browser-action', '#wrapper-_356ecbb5-8ec8-48b0-a835-8eb8288e3288_-browser-action', '#_7a7a4a92-a2a0-41d1-9fd7-1e92480d612d_-browser-action', '#notes_mozilla_com-browser-action', '#_aecec67f-0d10-4fa7-b7c7-609a2db280cf_-browser-action', '.tabs-newtab-button.toolbarbutton-1', '#new-tab-button', '#extension_one-tab_com-browser-action', '.scrollbutton-up', '#aunsen_live_com-browser-action', '.scrollbutton-down', '#addon_darkreader_org-browser-action', '#_08cc31c0-b1cb-461c-8ba2-95edd9e76a02_-browser-action', '#fdm_ffext2_freedownloadmanager_org-browser-action', '#fxa-toolbar-menu-button', '#weibo-picture-store_ext_hub_moe-browser-action', '#_af37054b-3ace-46a2-ac59-709e4412bec6_-browser-action', '#githublisten111_gmail_com-browser-action', '#umatrix_raymondhill_net-browser-action', '#smartproxy_salarcode_com-browser-action'];

    // whitelist, and trigger action
    var whiteIDs = [
        {
            id: 'omnibar-defaultEngine',
            popMemu: 'omnibar-engine-menu',
            run: function (overElem) {
                document.getElementById('omnibar-in-urlbar').click(0);
            }
        },
        {
            id: 'ucjs_zoom_statuslabel',
            popMemu: 'ucjs_zoom-context',
            run: null
        },
        {
            id: 'UserScriptLoader-icon',
            popMemu: 'UserScriptLoader-popup',
            run: null
        },
        {
            id: 'readLater',
            popMemu: 'readLater-popup',
            run: null
            //function(overElem) {PopElt.popup();}
        },
        {
            id: 'foxyproxy-toolbar-icon',
            popMemu: 'foxyproxy-toolbarbutton-popup',
            run: null
        }
    ];
    var whitesInx = -1;

    const popupPos = ['after_start', 'end_before', 'before_start', 'start_before'];
    const searchBar = window.BrowserSearch ? BrowserSearch.searchBar : null;

    function IsButton(elt) {
        return elt && (elt.localName == 'toolbarbutton' || elt.localName == 'button');
    }

    function IsWidgetBtn(elt) {
        return IsButton(elt) &&
            ((elt.hasAttribute('widget-id') && elt.getAttribute('widget-type') == 'view')
                || elt.id == 'fxa-toolbar-menu-button' || elt.id == 'library-button'
                || elt.id == 'alltabs-button');
    }

    function IsSearchBtn(elt) {
        return (elt && elt.className == 'searchbar-search-button') || whitesInx == 0;
    }

    function IsPanelMenuBtn(elt) {
        return elt && elt.id == 'PanelUI-menu-button';
    }

    function IsDownloadBtn(elt) {
        return elt && elt.id == 'downloads-button';
    }

    function IsMenuBtn(elt) {
        return IsPanelMenuBtn(elt) || IsDownloadBtn(elt) || IsWidgetBtn(elt)
            || (IsButton(elt) && getPopupMenu(elt));
    }

    function IsOverflowBtn(elt) {
        return elt && elt.id == 'nav-bar-overflow-button';
    }

    function IsUrlbarDropmarker(elt) {
        return elt && elt.classList && elt.classList.contains('urlbar-history-dropmarker');
    }

    function IsCustomizationBtn(elt) {
        return IsButton(elt) && elt.className == 'customizationmode-button';
    }

    function IsAutoComplete(elt) {
        try {
            return elt.getAttribute('type').substr(0, 12) == 'autocomplete';
        } catch (e) { }
    }

    function isBlackNode(elt) {
        return BlackIDs.some(function (css) {
            try {
                var nodes = document.querySelectorAll(css);
            } catch (e) {
                return false;
            }
            for (var node of nodes) {
                if (node == elt)
                    return true;
            }
            return false;
        })
    }

    function getPopupNode(node) {
        if (whitesInx > -1 && PopElt)
            return PopElt;

        if (IsSearchBtn(node) || IsOverflowBtn(node) || node.id == 'sidebar-switcher-target')
            return node;

        var elt, isPop, s;

        for (; node != null; node = node.parentNode) {
            if (node == PopElt)
                return node;

            isPop = false; // node isn't popup node
            s = node.localName;
            if (s == 'menupopup' || s == 'popup' || s == 'menulist'
                || IsAutoComplete(node) || IsMenuBtn(node) || IsUrlbarDropmarker(node)) {
                isPop = true;
            } else if (s == 'dropmarker' && node.getAttribute('type') == 'menu'
                && node.parentNode.firstChild.localName == 'menupopup') {
                isPop = true;
            } else if (s == 'menu') {
                isPop = (node.parentNode.localName == 'menubar');
            } else if (IsButton(node)) {
                for (elt = node; (elt = elt.nextSibling) != null;) {
                    if (elt.localName == 'dropmarker' && elt.width > 0 && elt.height > 0)
                        break;
                }
                if (elt)
                    break;
            }
            if (isPop)
                break;
        }
        if (PopElt && node) {
            // whether node is child of PopElt
            for (elt = node.parentNode; elt != null; elt = elt.parentNode) {
                if (elt == PopElt)
                    return PopElt;
            }
        }
        return isPop ? node : null;
    }

    function getPopupMenu(elt) {
        if (whitesInx > -1 && PopElt)
            return PopElt;

        var node = elt ? elt.querySelector('menupopup, panel') : null;
        if (node) return node;

        var s = elt.getAttribute('popup');
        return s ? document.getElementById(s) : null;
    }

    function getPopupPos(elt) {
        if (elt.id == 'bookmarks-menu-button')
            return null;

        var x, y, pos, i;
        for (pos = 0, x = elt.screenX, y = elt.screenY;
            elt != null; elt = elt.parentNode) {
            if (elt.localName == 'window' || !elt.parentNode)
                break;
            else if (elt.localName != 'toolbar' && elt.localName != 'hbox'
                && elt.localName != 'vbox');
            else if (elt.height >= 3 * elt.width) {
                if (elt.height >= 45) {
                    pos = 9;
                    break;
                }
            } else if (elt.width >= 3 * elt.height) {
                if (elt.width >= 45) {
                    pos = 8;
                    break;
                }
            }
        }
        try {
            i = (pos & 1) ?   // is pos odd?
                (x <= elt.width / 2 + elt.screenX ? 1 : 3) :
                (y <= elt.height / 2 + elt.screenY ? 0 : 2);
        } catch (e) {
            i = 0;
        }
        return popupPos[i];
    }

    function AutoPopup() {
        PopTimer = null;
        if (!overElt)
            return;

        if (whitesInx > -1 && PopElt && whiteIDs[whitesInx].run) {
            whiteIDs[whitesInx].run(overElt);
            return;
        }
        if (!PopElt)
            PopElt = overElt;
        if (overElt.localName == 'dropmarker') {
            PopElt.showPopup();
        } else if (overElt.localName == 'menulist') {
            overElt.open = true;
        } else if (IsPanelMenuBtn(overElt)) {
            PopElt = document.getElementById('appMenu-popup');
            PanelUI.show();
        } else if (IsWidgetBtn(overElt)) {
            PopElt = document.getElementById('customizationui-widget-panel');
            if (overElt.hasAttribute('onmousedown'))
                overElt.dispatchEvent(new MouseEvent('mousedown'));
            else
                overElt.dispatchEvent(new UIEvent('command'));
        } else if (IsDownloadBtn(overElt)) {
            PopElt = document.getElementById('downloadsPanel');
            DownloadsPanel.showPanel();
        } else if (IsSearchBtn(overElt)) {
            searchBar.openSuggestionsPanel();
        } else if (IsOverflowBtn(overElt)) {
            PopElt = document.getElementById('widget-overflow');
            if (!overElt.open)
                overElt.click();
        } else if (overElt.id == 'sidebar-switcher-target') {
            PopElt = document.getElementById('sidebarMenu-popup');
            if (!overElt.classList.contains('active'))
                SidebarUI.toggleSwitcherPanel();
        } else if (IsUrlbarDropmarker(overElt)) {
            PopElt = gURLBar.panel;
            if (!gURLBar.textbox.hasAttribute('open'))
                overElt.click();
        } else {
            PopElt = getPopupMenu(overElt);
            if (IsCustomizationBtn(overElt))
                overElt.open = true;
            else {
                try {
                    let Pos = getPopupPos(overElt);
                    PopElt.removeAttribute('hidden');
                    PopElt.openPopup(overElt, Pos, 0, 0, false, false, null);
                } catch (e) {
                    PopElt = null;
                }
            }
        }
    }

    function HidePopup() {
        try {
            if (overElt.localName == 'dropmarker') {
                try {
                    PopElt.parentNode.closePopup();
                } catch (e) {
                    try {
                        PopElt.hidePopup();
                    } catch (e) { }
                }
            } else if (overElt.localName == 'menulist')
                PopElt.open = false;
            else if (PopElt && PopElt.hidePopup)
                PopElt.hidePopup();
            else if (PopElt.popupBoxObject)
                PopElt.popupBoxObject.hidePopup();
            else if (IsSearchBtn(overElt))
                searchBar.textbox.closePopup();
            else if (IsPanelMenuBtn(overElt))
                PanelUI.hide();
        } catch (e) { }

        HideTimer = null;
        overElt = PopElt = null;
    }

    function MouseOver(e) {
        if (!AlwaysPop && !document.hasFocus())
            return;
        var popNode, n = e.originalTarget;

        whitesInx = -1;
        if (n.hasAttribute('id') && whiteIDs.some(function (k, i, me) {
            if (k.id == n.id) {
                overElt = n;
                whitesInx = i;
                PopElt = document.getElementById(k.popMemu);
                PopTimer = setTimeout(AutoPopup, showDelay);
                return true;
            }
        }))
            return;

        popNode = getPopupNode(e.originalTarget);
        if (!popNode || (popNode && popNode.disabled) || isBlackNode(popNode)) {
            MouseOut();
            return;
        }
        if (HideTimer) {
            window.clearTimeout(HideTimer);
            HideTimer = null;
        }
        try {
            if (IsAutoComplete(popNode)) {
                return;
            };
            for (var elt = popNode; elt != null; elt = elt.parentNode) {
                if (elt.localName == 'menupopup' || elt.localName == 'popup')
                    return;
            }
        } catch (e) { }
        if (PopElt && popNode == PopElt && PopElt != overElt)
            return;
        if (overElt && popNode != overElt)
            HidePopup();
        overElt = popNode;
        PopElt = null;
        PopTimer = setTimeout(AutoPopup, showDelay);
    }

    function MouseOut() {
        if (PopTimer) {
            window.clearTimeout(PopTimer);
            PopTimer = null;
        }
        if (!HideTimer && PopElt)
            HideTimer = window.setTimeout(HidePopup, hideDelay);
    }

    window.addEventListener('mouseover', MouseOver, false);

})();