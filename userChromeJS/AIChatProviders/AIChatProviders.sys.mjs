// ==UserScript==
// @name           AIChatProviders.sys.mjs
// @description    AIChatProviders 系统桥接模块与 Kimi 内容 actor
// @compatibility  Firefox 153
// @version        0.1.0
// @skip           true
// @license        MIT License
// @note           2026-10-31 添加统一提问分流、草稿保护与内容进程输入适配
// @note           2026-10-31 重命名为 AIChatProviders，统一模块与 actor 标识
// ==/UserScript==

const ACTOR = "AIChatProviders";
const MODULE = import.meta.url;
const PROVIDER = "https://www.kimi.com/";
const HOSTS = new Set(["www.kimi.com", "kimi.com", "kimi.moonshot.cn"]);
const { setTimeout, clearTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");

function isKimi(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && HOSTS.has(parsed.hostname) && !parsed.port;
    } catch { return false; }
}

function deadline(promise, ms, message) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
    ]).finally(() => clearTimeout(timer));
}

// 主进程共享单例：多个浏览器窗口只安装一次 hook。
export const AIChatProviders = {
    windows: new Set(),
    busy: new WeakSet(),
    requests: new WeakMap(),
    attach(win) {
        if (this.windows.has(win)) return;
        if (!this.windows.size) {
            const { GenAI } = ChromeUtils.importESModule("resource:///modules/GenAI.sys.mjs");
            for (const method of ["handleAskChat", "prepareChatPromptPrefix", "buildChatPrompt"]) {
                if (typeof GenAI[method] !== "function") throw new Error(`AIChatProviders: 缺少 ${method}`);
            }
            ChromeUtils.registerWindowActor(ACTOR, {
                parent: { esModuleURI: MODULE },
                child: { esModuleURI: MODULE },
                matches: [...HOSTS].map(host => `https://${host}/*`),
                allFrames: false,
                // 原生聊天侧栏使用独立的 message manager group。
                messageManagerGroups: ["browsers", "chatbot-browser"],
                safeForUntrustedWebProcess: true,
            });
            this.genAI = GenAI;
            this.original = GenAI.handleAskChat;
            this.previousProvider = GenAI.chatProviders.get(PROVIDER);
            this.provider = { id: "kimi", name: "Kimi", maxLength: 24000 };
            GenAI.chatProviders.set(PROVIDER, this.provider);
            const owner = this;
            this.wrapper = function (promptObj, context) {
                const provider = Services.prefs.getStringPref("browser.ml.chat.provider", "");
                if (!isKimi(provider)) return owner.original.call(this, promptObj, context);
                return owner.ask(promptObj, context, provider);
            };
            GenAI.handleAskChat = this.wrapper;
        }
        this.windows.add(win);
        this.updatePicker(win, true);
    },
    updatePicker(win, add) {
        // 更新已经打开的下拉框，不调用 renderProviders，避免重新加载现有聊天。
        const doc = win.SidebarController?.browser?.contentDocument;
        if (doc?.documentURI !== "chrome://browser/content/genai/chat.html") return;
        const select = doc.getElementById("provider");
        if (!select) return;
        const existing = [...select.options].find(option => option.value === PROVIDER);
        if (add && !existing) {
            const option = doc.createElement("option");
            option.value = PROVIDER;
            option.textContent = "Kimi";
            option.dataset.aiChatProviders = "true";
            select.insertBefore(option, select.querySelector("hr"));
        } else if (!add && existing?.dataset.aiChatProviders && !existing.selected) {
            existing.remove();
        }
    },
    async ask(item, context, provider) {
        const win = context.window?.browsingContext?.topChromeWindow ?? context.window;
        if (!this.windows.has(win)) return;
        if (this.busy.has(win)) {
            this.notify(win, "正在准备上一个问题，请稍后再试。");
            return;
        }
        this.busy.add(win);
        const active = () => this.windows.has(win) && !win.closed &&
            Services.prefs.getStringPref("browser.ml.chat.provider", "") === provider;
        let targetContext;
        let request;
        try {
            await this.genAI.prepareChatPromptPrefix();
            const prompt = this.genAI.buildChatPrompt(item, { ...context }, win.document);
            if (!prompt?.trim()) throw new Error("提示词为空。");
            if (prompt.length > 32000) throw new Error("提示词过长，请减少选中文本后重试。");
            if (!active()) return;
            let browser;
            if (Services.prefs.getBoolPref("browser.ml.chat.sidebar", true)) {
                await deadline(win.SidebarController.show("viewGenaiChatSidebar"), 15000, "打开侧栏超时。");
                browser = await deadline(win.SidebarController.browser.contentWindow.browserPromise,
                    15000, "侧栏尚未就绪。");
            } else {
                browser = win.gBrowser.addTab(PROVIDER, {
                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                }).linkedBrowser;
                win.gBrowser.selectedTab = win.gBrowser.getTabForBrowser(browser);
            }
            if (!browser || !active()) return;
            // 不重载已打开的 Kimi，以保留当前会话和草稿。
            const until = Date.now() + 20000;
            let actor;
            while (Date.now() < until && active() && browser.isConnected) {
                const wgp = browser.browsingContext?.currentWindowGlobal;
                if (wgp && !wgp.isInitialDocument && isKimi(wgp.documentURI?.spec)) {
                    actor = wgp.getActor(ACTOR);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (!active()) return;
            if (!actor) throw new Error("Kimi 未加载完成，请打开侧栏、完成登录后重试。");
            targetContext = browser.browsingContext;
            request = { id: Services.uuid.generateUUID().toString(), active };
            this.requests.set(targetContext, request);
            const result = await deadline(actor.sendQuery("Fill", { prompt, requestId: request.id }), 12000,
                "未收到填写结果，请先检查 Kimi 输入框，避免重复操作。");
            if (!active()) return;
            if (!result?.ok) throw new Error(result?.error || "无法填写 Kimi 输入框。");
            browser.focus();
        } catch (error) {
            if (active()) this.notify(win, error.message || String(error));
        } finally {
            if (targetContext && this.requests.get(targetContext) === request) this.requests.delete(targetContext);
            this.busy.delete(win);
        }
    },
    notify(win, message) {
        Services.prompt.alert(win, "AIChatProviders", message);
    },
    detach(win) {
        if (!this.windows.delete(win)) return;
        this.updatePicker(win, false);
        if (this.windows.size) return;
        if (this.genAI.handleAskChat === this.wrapper) this.genAI.handleAskChat = this.original;
        if (this.genAI.chatProviders.get(PROVIDER) === this.provider) {
            if (this.previousProvider) this.genAI.chatProviders.set(PROVIDER, this.previousProvider);
            else this.genAI.chatProviders.delete(PROVIDER);
        }
        ChromeUtils.unregisterWindowActor(ACTOR);
    },
};

export class AIChatProvidersParent extends JSWindowActorParent {
    receiveMessage({ name, data }) {
        if (name !== "CanFill") return false;
        const request = AIChatProviders.requests.get(this.browsingContext);
        return !!request && request.id === data?.requestId && request.active();
    }
}

export class AIChatProvidersChild extends JSWindowActorChild {
    async receiveMessage({ name, data }) {
        if (name !== "Fill" || !isKimi(this.document?.documentURI)) return { ok: false, error: "页面不是 Kimi。" };
        if (typeof data?.prompt !== "string" || !data.prompt.trim() || data.prompt.length > 32000) {
            return { ok: false, error: "提示词无效或过长。" };
        }
        if (this.filling) return { ok: false, error: "输入框正在处理上一个问题。" };
        this.filling = true;
        try {
            const doc = this.document;
            const win = this.contentWindow;
            const until = Date.now() + 8000;
            let editor;
            while (!this.dead && Date.now() < until) {
                const candidates = [...doc.querySelectorAll(
                    '.chat-input-editor[contenteditable="true"], [contenteditable="true"][role="textbox"], .tiptap[contenteditable="true"], [data-lexical-editor="true"], textarea, [contenteditable="true"]'
                )].filter(el => el.getClientRects().length && !el.disabled && !el.readOnly &&
                    el.getAttribute("aria-hidden") !== "true");
                // 多个可编辑区域时不能猜测，避免填入搜索框或聊天标题。
                if (candidates.length === 1) { editor = candidates[0]; break; }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.dead) return { ok: false, error: "页面已关闭。" };
            if (!editor) return { ok: false, error: "未找到唯一的 Kimi 输入框，请完成登录并关闭其他编辑框后重试。" };
            if (!await this.sendQuery("CanFill", { requestId: data.requestId })) {
                return { ok: false, error: "提问已取消，请重新选择服务后重试。" };
            }
            if (this.dead) return { ok: false, error: "页面已关闭。" };
            const text = () => "value" in editor ? editor.value : editor.textContent;
            if (text().trim()) return { ok: false, error: "Kimi 输入框已有草稿，请发送或清空后重试。" };
            if (!isKimi(doc.documentURI) || !editor.isConnected) return { ok: false, error: "页面已切换。" };
            editor.focus();
            if (editor.localName === "textarea") {
                const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, "value").set;
                setter.call(editor, data.prompt);
                editor.dispatchEvent(new win.InputEvent("input", { bubbles: true, inputType: "insertText", data: data.prompt }));
            } else {
                // 通过浏览器编辑命令触发 beforeinput/input，保持富文本编辑器内部状态同步。
                const selection = win.getSelection();
                const range = doc.createRange();
                range.selectNodeContents(editor);
                selection.removeAllRanges();
                selection.addRange(range);
                if (!doc.execCommand("insertText", false, data.prompt)) {
                    return { ok: false, error: "Kimi 编辑器拒绝插入，请手动输入。" };
                }
            }
            await new Promise(resolve => setTimeout(resolve, 150));
            if (this.dead || !editor.isConnected) return { ok: false, error: "输入框已重建，请检查页面上的草稿。" };
            // 富文本编辑器可能将换行转换为段落；核对非空白内容，发现不完整时不重试覆盖。
            if (text().replace(/\s/g, "") !== data.prompt.replace(/\s/g, "")) {
                return { ok: false, error: "Kimi 未完整保留输入内容，请检查页面上的草稿。" };
            }
            return { ok: true };
        } finally { this.filling = false; }
    }
    didDestroy() { this.dead = true; }
}
