// ==UserScript==
// @name        MenubarReplaceWithButton.uc.js
// @description 把主菜单替换成按钮
// @author      unknown
// @version     0.1.3
// @include     main
// @note        20260705 一级菜单不再创建 menu-iconic-left 占位节点
// @note        20260705 一级菜单改用无图标菜单结构，并移除 menu-icon 节点
// ==/UserScript==

(function () {
    if (location != "chrome://browser/content/browser.xhtml") return;

    const BUTTON_ID = "main-menubar_button";
    const POPUP_ID = "main-menubar_popup";

    try {
        CustomizableUI.createWidget({
            id: BUTTON_ID,
            type: "custom",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onBuild(aDocument) {
                let toolbaritem = aDocument.createXULElement("toolbarbutton");
                setButtonAttributes(toolbaritem);
                return toolbaritem;
            },
        });
    } catch (e) {}

    window.addEventListener("MozAfterPaint", init, { once: true });

    function init() {
        let mainMenuBarButton = document.getElementById(BUTTON_ID);
        let menubar = document.getElementById("main-menubar");
        if (!mainMenuBarButton || !menubar) return;

        setButtonAttributes(mainMenuBarButton);

        let menupopup = document.getElementById(POPUP_ID);
        if (!menupopup) {
            menupopup = document.createXULElement("menupopup");
            menupopup.setAttribute("id", POPUP_ID);
            menupopup.setAttribute("position", "after_start");
        }

        if (menupopup.parentNode !== mainMenuBarButton) {
            mainMenuBarButton.append(menupopup);
        }
        menupopup.removeAttribute("onpopupshowing");
        menupopup.removeAttribute("onpopuphiding");

        moveMenubarMenus(menubar, menupopup);
        installPopupHandlers(mainMenuBarButton, menupopup);
    }

    function setButtonAttributes(toolbaritem) {
        let label = Services.locale.appLocaleAsBCP47.includes("zh")
            ? "主菜单"
            : "メニューバー";
        let props = {
            id: BUTTON_ID,
            class: "toolbarbutton-1 chromeclass-toolbar-additional",
            removable: false,
            label,
            tooltiptext: label,
            style: 'list-style-image: url("chrome://global/skin/icons/more.svg");',
            type: "menu",
        };
        for (let p in props) {
            toolbaritem.setAttribute(p, props[p]);
        }
        toolbaritem.removeAttribute("popup");
    }

    function moveMenubarMenus(menubar, menupopup) {
        let menus = Array.from(menubar.childNodes).filter(node => node.nodeName === "menu");
        for (let menu of menus) {
            normalizeTopLevelMenu(menu);
            menupopup.append(menu);
        }
    }

    function normalizeTopLevelMenu(menu) {
        menu.removeAttribute("class");

        let menutxt = menu.firstChild;
        if (!menutxt?.classList?.contains("menubar-text")) return;

        menutxt.classList.remove("menubar-text");
        menutxt.classList.add("menu-text");
        menutxt.setAttribute("flex", "1");

        for (let child of Array.from(menu.children)) {
            if (
                child.classList?.contains("menu-iconic-left") ||
                child.classList?.contains("menu-icon")
            ) {
                child.remove();
            }
        }

        if (!menutxt.nextElementSibling?.classList?.contains("menu-accel-container")) {
            menutxt.after(MozXULElement.parseXULToFragment(`
<hbox class="menu-accel-container" anonid="accel" aria-hidden="true">
    <label class="menu-iconic-accel"/>
</hbox>
<hbox align="center" class="menu-right" aria-hidden="true">
    <image/>
</hbox>
            `));
        }
    }

    function installPopupHandlers(mainMenuBarButton, menupopup) {
        if (menupopup._menubarReplaceWithButtonInstalled) return;
        menupopup._menubarReplaceWithButtonInstalled = true;

        mainMenuBarButton.addEventListener("dragover", () => {
            mainMenuBarButton.openMenu(true);
        });

        mainMenuBarButton.addEventListener("dragleave", event => {
            if (event.relatedTarget && !event.relatedTarget.closest("menupopup")) {
                mainMenuBarButton.openMenu(false);
            }
        });

        window.addEventListener(
            "keydown",
            event => {
                if (
                    event.getModifierState("Shift") ||
                    event.getModifierState("Control") ||
                    event.getModifierState("Meta") ||
                    (event.key !== "Alt" && event.key !== "F10")
                ) {
                    return;
                }

                event.stopPropagation();
                event.preventDefault();
                if (event.repeat) return;

                if (menupopup.state === "open") {
                    mainMenuBarButton.openMenu(false);
                } else {
                    mainMenuBarButton.openMenu(true);
                }
            },
            true
        );

        menupopup.addEventListener("popupshowing", function (event) {
            if (event.target === menupopup) {
                mainMenuBarButton.setAttribute("open", "true");
            }

            if (AppConstants.platform != "macosx") {
                if (event.target.parentNode?.parentNode == this) {
                    this.setAttribute(
                        "openedwithkey",
                        event.target.parentNode.openedWithKey
                    );
                }
            }

            handlePopupShowing(event);
        });

        menupopup.addEventListener("popuphiding", event => {
            if (event.target === menupopup) {
                mainMenuBarButton.removeAttribute("open");
            }
        });

        menupopup.addEventListener("command", handleCommand);

        document
            .getElementById("menu_EditPopup")
            ?.addEventListener("popuphidden", () => {
                updateEditUIVisibility();
            });
    }

    function handleCommand(event) {
        switch (event.target.id) {
            case "menu_preferences":
            case "menu_settings":
                openPreferences(undefined);
                break;

            case "menu_pageStyleNoStyle":
                gPageStyleMenu.disableStyle();
                break;
            case "menu_pageStylePersistentOnly":
                gPageStyleMenu.switchStyleSheet(null);
                break;
            case "repair-text-encoding":
                BrowserCommands.forceEncodingDetection();
                break;
            case "enterFullScreenItem":
            case "exitFullScreenItem":
                BrowserCommands.fullScreen();
                break;
            case "documentDirection-swap":
                gBrowser.selectedBrowser.sendMessageToActor(
                    "SwitchDocumentDirection",
                    {},
                    "SwitchDocumentDirection",
                    "roots"
                );
                break;

            case "sync-tabs-menuitem":
                gSync.openSyncedTabsPanel();
                break;
            case "hiddenTabsMenu":
                gTabsPanel.showHiddenTabsPanel(event, "hidden-tabs-menuitem");
                break;
            case "sync-setup":
            case "sync-enable":
            case "sync-unverifieditem":
                gSync.openPrefs("menubar");
                break;
            case "sync-syncnowitem":
                gSync.doSync(event);
                break;
            case "sync-reauthitem":
                gSync.openSignInAgainPage("menubar");
                break;
            case "menu_openFirefoxView":
                FirefoxViewHandler.openTab();
                break;
            case "hiddenUndoCloseWindow":
                SessionWindowUI.undoCloseWindow(0);
                break;

            case "menu_openHelp":
                openHelpLink("firefox-help");
                break;
            case "menu_layout_debugger":
                toOpenWindowByType(
                    "mozapp:layoutdebug",
                    "chrome://layoutdebug/content/layoutdebug.xhtml"
                );
                break;
            case "feedbackPage":
                openFeedbackPage();
                break;
            case "helpSafeMode":
                safeModeRestart();
                break;
            case "troubleShooting":
                openTroubleshootingPage();
                break;
            case "menu_HelpPopup_reportPhishingtoolmenu":
                openUILink(gSafeBrowsing.getReportURL("Phish"), event, {
                    triggeringPrincipal:
                        Services.scriptSecurityManager.createNullPrincipal({}),
                });
                break;
            case "menu_HelpPopup_reportPhishingErrortoolmenu":
                gSafeBrowsing.reportFalseDeceptiveSite();
                break;
            case "helpSwitchDevice":
                openSwitchingDevicesPage();
                break;
            case "aboutName":
                openAboutDialog();
                break;
            case "helpPolicySupport":
                openTrustedLinkIn(Services.policies.getSupportMenu().URL.href, "tab");
                break;

            case "menu_setAsDefault":
                if (AppConstants.platform == "macosx") {
                    Glean.browserApplicationmenu.setAsDefault.record();
                    ShellService.setAsDefault().catch(async _ => {});
                }
                break;
        }
    }

    function handlePopupShowing(event) {
        switch (event.target.id) {
            case "menu_FilePopup":
                gFileMenu.onPopupShowing(event);
                break;
            case "menu_newUserContextPopup":
                createUserContextMenu(event);
                break;
            case "menu_EditPopup":
                updateEditUIVisibility();
                break;
            case "view-menu-popup":
                ToolbarContextMenu.onViewToolbarsPopupShowing(event);
                break;
            case "pageStyleMenuPopup":
                gPageStyleMenu.fillPopup(event.target);
                break;
            case "historyMenuPopup":
                if (!event.target.parentNode._placesView) {
                    new HistoryMenu(event);
                }
                window.AIWindow?.appMenu?.(event, window);
                break;
            case "historyUndoPopup":
                document
                    .getElementById("history-menu")
                    ._placesView.populateUndoSubmenu();
                break;
            case "historyUndoWindowPopup":
                document
                    .getElementById("history-menu")
                    ._placesView.populateUndoWindowSubmenu();
                break;
            case "bookmarksMenuPopup":
                BookmarkingUI.onMainMenuPopupShowing(event);
                if (!event.target.parentNode._placesView) {
                    new PlacesMenu(
                        event,
                        `place:parent=${PlacesUtils.bookmarks.menuGuid}`
                    );
                }
                break;
            case "bookmarksToolbarFolderPopup":
                if (!event.target.parentNode._placesView) {
                    new PlacesMenu(
                        event,
                        `place:parent=${PlacesUtils.bookmarks.toolbarGuid}`
                    );
                }
                break;
            case "otherBookmarksFolderPopup":
                if (!event.target.parentNode._placesView) {
                    new PlacesMenu(
                        event,
                        `place:parent=${PlacesUtils.bookmarks.unfiledGuid}`
                    );
                }
                break;
            case "mobileBookmarksFolderPopup":
                if (!event.target.parentNode._placesView) {
                    new PlacesMenu(
                        event,
                        `place:parent=${PlacesUtils.bookmarks.mobileGuid}`
                    );
                }
                break;
            case "menu_HelpPopup":
                buildHelpMenu();
                break;
            case "menu_ProfilesPopup":
                gProfiles.onPopupShowing(event);
                break;
        }
    }
})();
