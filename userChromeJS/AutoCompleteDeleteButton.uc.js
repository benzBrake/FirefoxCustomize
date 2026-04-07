// ==UserScript==
// @name            AutoCompleteDeleteButton.uc.js
// @description     为网页输入框的表单历史下拉添加删除按钮
// @license         MIT License
// @compatibility   Firefox 120
// @version         0.1.5
// @charset         UTF-8
// @include         main
// @note            仅作用于网页 input/textarea 的 PopupAutoComplete 表单历史下拉
// ==/UserScript==

(function () {
  "use strict";

  const { classes: Cc, interfaces: Ci } = Components;

  const POPUP_ID = "PopupAutoComplete";
  const ITEM_SELECTOR = ".autocomplete-richlistitem";
  const BUTTON_CONTAINER_CLASS = "ac-delete-button-container";
  const BUTTON_CLASS = "ac-delete-button";
  const XHTML_NS = "http://www.w3.org/1999/xhtml";
  const DEBUG = false;

  const lazy = {};
  ChromeUtils.defineESModuleGetters(lazy, {
    FormHistory: "resource://gre/modules/FormHistory.sys.mjs",
  });

  let styleUri = null;
  let refreshTimer = 0;
  let popupObserver = null;
  let initObserver = null;

  const style = `
    #PopupAutoComplete .autocomplete-richlistitem {
      position: relative;
      padding-inline-end: 34px !important;
    }

    #PopupAutoComplete .${BUTTON_CONTAINER_CLASS} {
      position: absolute;
      inset-inline-end: 6px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      pointer-events: none;
    }

    #PopupAutoComplete .${BUTTON_CLASS} {
      appearance: none;
      -moz-default-appearance: none;
      border: 0;
      margin: 0;
      padding: 0;
      width: 20px;
      height: 20px;
      min-width: 20px;
      min-height: 20px;
      border-radius: 4px;
      background: transparent center / 12px 12px no-repeat;
      background-image: url("chrome://global/skin/icons/close.svg");
      opacity: 0;
      pointer-events: auto;
      cursor: pointer;
      color: inherit;
      fill: currentColor;
    }

    #PopupAutoComplete .autocomplete-richlistitem:hover .${BUTTON_CLASS},
    #PopupAutoComplete .autocomplete-richlistitem[selected="true"] .${BUTTON_CLASS} {
      opacity: 0.72;
    }

    #PopupAutoComplete .${BUTTON_CLASS}:hover {
      opacity: 1 !important;
      background-color: color-mix(in srgb, currentColor 14%, transparent);
    }

    #PopupAutoComplete .${BUTTON_CLASS}:active {
      background-color: color-mix(in srgb, currentColor 22%, transparent);
    }
  `;

  function log(...args) {
    if (!DEBUG) {
      return;
    }

    const text = `[AutoCompleteDeleteButton] ${args
      .map(value => {
        if (typeof value == "string") {
          return value;
        }
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      })
      .join(" ")}`;
    console.log(text);
    Services.console.logStringMessage(text);
  }

  function registerStyle() {
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );

    styleUri = Services.io.newURI(
      "data:text/css;charset=UTF-8," + encodeURIComponent(style)
    );

    if (!sss.sheetRegistered(styleUri, sss.AUTHOR_SHEET)) {
      sss.loadAndRegisterSheet(styleUri, sss.AUTHOR_SHEET);
      log("Style registered");
    } else {
      log("Style already registered");
    }
  }

  function getPopup() {
    return document.getElementById(POPUP_ID);
  }

  function getFormFillController() {
    try {
      return Cc["@mozilla.org/satchel/form-fill-controller;1"].getService(
        Ci.nsIFormFillController
      );
    } catch (error) {
      log("Failed to get form-fill-controller service:", error);
      return null;
    }
  }

  function getRichlistbox(popup) {
    return popup?.querySelector(".autocomplete-richlistbox") || null;
  }

  function getRows(popup) {
    return Array.from(popup?.querySelectorAll(ITEM_SELECTOR) || []).filter(
      item => !item.collapsed
    );
  }

  function getControlledElement() {
    try {
      return getFormFillController()?.controlledElement || null;
    } catch (error) {
      log("Failed to get controlled element:", error);
      return null;
    }
  }

  function getAutocompleteInput(popup = getPopup()) {
    try {
      if (!popup) {
        return null;
      }

      const input = popup.input || null;
      if (input) {
        return input;
      }

      if (popup.QueryInterface) {
        const popupInterface = popup.QueryInterface(Ci.nsIAutoCompletePopup);
        return popupInterface?.input || null;
      }

      return null;
    } catch (error) {
      log("Failed to get popup input:", error);
      return null;
    }
  }

  function describeElement(element) {
    if (!element) {
      return null;
    }
    return {
      localName: element.localName || "",
      type: element.getAttribute?.("type") || "",
      name: element.getAttribute?.("name") || "",
      id: element.id || "",
      value: "value" in element ? String(element.value).slice(0, 80) : "",
    };
  }

  function isTextControl(element) {
    if (!element || !element.localName) {
      return false;
    }
    return (
      element.localName === "input" ||
      element.localName === "textarea"
    );
  }

  function getFieldName(element, popup = getPopup()) {
    const input = getAutocompleteInput(popup);
    try {
      const searchParam = input?.searchParam || "";
      if (searchParam) {
        return String(searchParam);
      }
    } catch (error) {
      log("Failed to read popup input searchParam:", error);
    }

    if (!element) {
      return "";
    }
    return element.getAttribute("name") || element.id || "";
  }

  function safeParseJSON(text) {
    if (!text || typeof text != "string") {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function getRowMeta(item, index) {
    const comment = item.getAttribute("ac-comment") || "";
    const styleName = item.getAttribute("originaltype") || "";
    return {
      index,
      value: item.getAttribute("ac-value") || "",
      label: item.getAttribute("ac-label") || "",
      comment,
      styleName,
      parsedComment: safeParseJSON(comment),
    };
  }

  function isAllowedStyleName(styleName) {
    return !styleName || styleName === "default" || styleName === "fromhistory";
  }

  function isLikelyFormHistoryItem(item, index) {
    if (!item || item.localName != "richlistitem") {
      return false;
    }

    const meta = getRowMeta(item, index);
    if (!meta.value) {
      return false;
    }

    if (!isAllowedStyleName(meta.styleName)) {
      return false;
    }

    if (meta.parsedComment && typeof meta.parsedComment == "object") {
      return false;
    }

    if (
      meta.comment &&
      !meta.parsedComment &&
      meta.comment.trim() &&
      meta.comment.trim() !== meta.value &&
      meta.comment.trim() !== meta.label
    ) {
      return false;
    }

    return true;
  }

  function explainRowDecision(item, index) {
    const meta = getRowMeta(item, index);
    const reasons = [];

    if (!item || item.localName != "richlistitem") {
      reasons.push("not-richlistitem");
    }
    if (!meta.value) {
      reasons.push("empty-value");
    }
    if (!isAllowedStyleName(meta.styleName)) {
      reasons.push(`style:${meta.styleName}`);
    }
    if (meta.parsedComment && typeof meta.parsedComment == "object") {
      reasons.push("json-comment");
    }
    if (
      meta.comment &&
      !meta.parsedComment &&
      meta.comment.trim() &&
      meta.comment.trim() !== meta.value &&
      meta.comment.trim() !== meta.label
    ) {
      reasons.push("nontrivial-comment");
    }

    return {
      allowed: reasons.length === 0,
      reasons,
      meta: {
        index: meta.index,
        value: meta.value,
        label: meta.label,
        comment: meta.comment,
        styleName: meta.styleName,
      },
    };
  }

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function setSelectedItem(popup, item) {
    const richlistbox = getRichlistbox(popup);
    if (!richlistbox || !item) {
      return false;
    }

    const index = richlistbox.getIndexOfItem(item);
    if (index < 0) {
      log("Failed to find row index for selected item");
      return false;
    }

    richlistbox.selectedIndex = index;
    log("Selected row", { index, value: item.getAttribute("ac-value") || "" });
    return true;
  }

  function getControllerFromPopup(popup) {
    try {
      const input = getAutocompleteInput(popup);
      if (input?.controller) {
        return input.controller;
      }

      if (input?.QueryInterface) {
        const autoCompleteInput = input.QueryInterface(Ci.nsIAutoCompleteInput);
        if (autoCompleteInput?.controller) {
          return autoCompleteInput.controller;
        }
      }

      const formFillController = getFormFillController();
      if (formFillController?.controller) {
        return formFillController.controller;
      }

      return null;
    } catch (error) {
      log("Failed to get controller:", error);
      return null;
    }
  }

  function removeItemFromDOM(item) {
    if (!item?.parentNode) {
      return;
    }

    const popup = getPopup();
    item.remove();
    log("Removed row from DOM", { value: item.getAttribute("ac-value") || "" });

    if (popup?.popupOpen) {
      const rows = getRows(popup);
      if (!rows.length) {
        try {
          popup.closePopup();
        } catch (error) {
          log("popup.closePopup() failed:", error);
        }
      }
    }
  }

  async function deleteViaFormHistory(item) {
    const popup = getPopup();
    const element = getControlledElement();
    const input = getAutocompleteInput(popup);
    if (!isTextControl(element) && !input) {
      log("Fallback delete skipped: no controlled element and no popup input");
      return false;
    }

    const value = item.getAttribute("ac-value") || "";
    const fieldname = getFieldName(element, popup);
    if (!value) {
      log("Fallback delete skipped: missing value", {
        value,
        fieldname,
      });
      return false;
    }

    try {
      if (fieldname) {
        log("Fallback FormHistory removal", { fieldname, value });
        await lazy.FormHistory.update({
          op: "remove",
          fieldname,
          value,
        });
      } else {
        log("Fallback FormHistory removal by value only", { value });
        await lazy.FormHistory.update({
          op: "remove",
          value,
        });
      }
      return true;
    } catch (error) {
      log("Fallback FormHistory removal failed:", error);
      return false;
    }
  }

  async function deleteItem(item) {
    const popup = getPopup();
    if (!popup || !popup.popupOpen) {
      log("Delete skipped: popup missing or closed");
      return;
    }

    log("Delete requested", explainRowDecision(item, -1));

    if (!setSelectedItem(popup, item)) {
      return;
    }

    const controller = getControllerFromPopup(popup);
    let removed = false;

    try {
      if (controller?.handleDelete) {
        log("Calling controller.handleDelete()");
        removed = controller.handleDelete();
        log("controller.handleDelete() result", { removed });
      } else {
        log("Popup controller missing handleDelete()", {
          hasController: !!controller,
          controllerType: controller?.constructor?.name || typeof controller,
        });
      }
    } catch (error) {
      log("controller.handleDelete() failed:", error);
    }

    if (!removed) {
      removed = await deleteViaFormHistory(item);
      if (removed) {
        if (getControllerFromPopup(popup) && isTextControl(getControlledElement())) {
          refreshPopup();
        } else {
          removeItemFromDOM(item);
        }
      }
    }

    if (removed) {
      log("Delete succeeded");
      scheduleEnhance();
    } else {
      log("Delete failed");
    }
  }

  function createDeleteButton(item) {
    const container = document.createElementNS(XHTML_NS, "div");
    container.className = BUTTON_CONTAINER_CLASS;
    container.tabIndex = -1;

    const button = document.createElementNS(XHTML_NS, "button");
    button.className = BUTTON_CLASS;
    button.type = "button";
    button.title = "删除此历史记录";
    button.setAttribute("aria-label", "删除此历史记录");
    button.tabIndex = -1;
    button.setAttribute("focusable", "false");
    button.setAttribute("draggable", "false");

    for (const type of ["mousedown", "mouseup"]) {
      button.addEventListener(
        type,
        event => {
          stopEvent(event);
        },
        true
      );
    }

    for (const type of ["keydown", "keyup", "keypress"]) {
      button.addEventListener(
        type,
        event => {
          stopEvent(event);
        },
        true
      );
    }

    button.addEventListener(
      "command",
      event => {
        stopEvent(event);
      },
      true
    );

    button.addEventListener(
      "focus",
      event => {
        stopEvent(event);
        const popup = getPopup();
        const input = getAutocompleteInput(popup);
        try {
          if (input?.selectTextRange && typeof input.selectionEnd == "number") {
            input.selectTextRange(input.selectionEnd, input.selectionEnd);
          }
        } catch (error) {
          log("Failed to restore input focus state:", error);
        }
      },
      true
    );

    button.addEventListener("click", async event => {
      stopEvent(event);
      log("Delete button clicked");
      await deleteItem(item);
    });

    container.appendChild(button);
    return container;
  }

  function ensureDeleteButton(item, index) {
    const decision = explainRowDecision(item, index);
    if (!decision.allowed) {
      log("Row rejected", decision);
      item.querySelector(`.${BUTTON_CONTAINER_CLASS}`)?.remove();
      return;
    }

    if (item.querySelector(`.${BUTTON_CONTAINER_CLASS}`)) {
      log("Row already has button", decision.meta);
      return;
    }

    item.appendChild(createDeleteButton(item));
    log("Button appended", decision.meta);
  }

  function enhancePopup() {
    const popup = getPopup();
    if (!popup || !popup.popupOpen) {
      log("Enhance skipped: popup missing or closed");
      return;
    }

    const rows = getRows(popup);
    log("Enhancing popup", {
      rowCount: rows.length,
      controlledElement: describeElement(getControlledElement()),
      searchParam: (() => {
        try {
          return getAutocompleteInput(popup)?.searchParam || "";
        } catch {
          return "";
        }
      })(),
    });

    rows.forEach((item, index) => {
      ensureDeleteButton(item, index);
    });
  }

  function scheduleEnhance() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = 0;
      enhancePopup();
    }, 0);
  }

  function refreshPopup() {
    const popup = getPopup();
    const controller = getControllerFromPopup(popup);
    const element = getControlledElement();
    const input = getAutocompleteInput(popup);

    if (!popup || !controller) {
      log("Refresh skipped", {
        hasPopup: !!popup,
        hasController: !!controller,
        controlledElement: describeElement(element),
        hasInput: !!input,
      });
      return;
    }

    try {
      const value =
        (isTextControl(element) && element.value) ||
        input?.textValue ||
        "";
      log("Refreshing popup", {
        value,
        controlledElement: describeElement(element),
        hasInput: !!input,
      });
      controller.startSearch(value);
    } catch (error) {
      log("controller.startSearch() failed:", error);
    }
  }

  function installPopupObserver(popup) {
    if (popupObserver) {
      popupObserver.disconnect();
    }

    popupObserver = new MutationObserver(() => {
      if (popup.popupOpen) {
        log("Popup mutation observed");
        scheduleEnhance();
      }
    });

    popupObserver.observe(popup, {
      childList: true,
      subtree: true,
    });
    log("Popup observer installed");
  }

  function bindPopup(popup) {
    if (!popup || popup.hasAttribute("ac-delete-button-bound")) {
      if (popup) {
        log("Popup already bound");
      }
      return;
    }

    popup.setAttribute("ac-delete-button-bound", "true");
    log("Binding popup", {
      id: popup.id,
      className: popup.className,
    });

    popup.addEventListener(
      "popupshown",
      () => {
        log("popupshown", {
          controlledElement: describeElement(getControlledElement()),
          searchParam: (() => {
            try {
              return getAutocompleteInput(popup)?.searchParam || "";
            } catch {
              return "";
            }
          })(),
          rowCount: getRows(popup).length,
        });
        scheduleEnhance();
      },
      true
    );
    popup.addEventListener(
      "input",
      () => {
        log("Popup input event");
        scheduleEnhance();
      },
      true
    );
    popup.addEventListener("popuphidden", () => {
      log("popuphidden");
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = 0;
      }
    });

    const richlistbox = getRichlistbox(popup);
    if (richlistbox) {
      richlistbox.addEventListener(
        "mousemove",
        () => {
          scheduleEnhance();
        },
        true
      );
      richlistbox.addEventListener(
        "select",
        () => {
          log("Richlistbox select", {
            selectedIndex: richlistbox.selectedIndex,
          });
          scheduleEnhance();
        },
        true
      );
    } else {
      log("Richlistbox not found while binding popup");
    }

    installPopupObserver(popup);
  }

  function watchForPopup() {
    if (initObserver) {
      return;
    }

    initObserver = new MutationObserver(() => {
      const popup = getPopup();
      if (popup) {
        log("Popup discovered later");
        bindPopup(popup);
      }
    });

    initObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    log("Watching for popup creation");
  }

  function init() {
    log("Init start");
    registerStyle();

    const popup = getPopup();
    if (!popup) {
      log("PopupAutoComplete not found");
      watchForPopup();
      return;
    }

    bindPopup(popup);
    log("Initialized");
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }
})();
