// 运行：node --test userChromeJS/addMenuPlus/tests/async-state.test.mjs
// 执行生产源码中的方法；DOM/Firefox 服务用最小替身，真实 popup 时序仍需 Firefox 验证。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

class MenuNode {
    constructor(attrs = {}, localName = "menuitem") {
        this.attrs = { ...attrs };
        this.localName = this.nodeName = localName;
        this.children = [];
        this.observers = new Set();
        this.isConnected = true;
        this.style = { display: "flex", visibility: "visible" };
        this.state = "open";
        this.listeners = new Map();
    }
    get id() { return this.getAttribute("id"); }
    get parentElement() { return this.parentNode; }
    getAttribute(key) { return this.attrs[key] ?? null; }
    hasAttribute(key) { return key in this.attrs; }
    setAttribute(key, value) { this.attrs[key] = String(value); this.changed(key); }
    removeAttribute(key) { if (this.hasAttribute(key)) { delete this.attrs[key]; this.changed(key); } }
    changed(key) {
        for (const observer of this.observers) {
            if (!observer.filter.includes(key)) continue;
            observer.records.push({ attributeName: key });
            queueMicrotask(() => {
                const records = observer.takeRecords();
                if (records.length) observer.callback(records);
            });
        }
    }
    append(node) { node.parentNode = this; this.children.push(node); return node; }
    remove() { this.isConnected = false; }
    addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
    dispatchEvent(event) {
        event.target = this;
        for (const fn of this.listeners.get(event.type) || []) fn(event);
        return !event.defaultPrevented;
    }
    removeEventListener() {}
    closest() { return this.localName === "menu" && this.disabled ? this : this.parentNode?.closest(); }
    querySelectorAll(selector) {
        const descendants = this.children.flatMap(node => [node, ...node.querySelectorAll("all")]);
        if (selector === "all" || selector === "menu, menuitem, menugroup") return descendants;
        if (selector === "menugroup.addMenu") return descendants.filter(n => n.localName === "menugroup");
        if (selector === ".addMenu[onshowinglabel]") return descendants.filter(n => n.hasAttribute("onshowinglabel"));
        if (selector === '[data-addmenu-command]') return descendants.filter(n => n.hasAttribute('data-addmenu-command'));
        if (selector.includes("[command]")) return descendants.filter(n =>
            (n.hasAttribute("command") || n.hasAttribute("data-addmenu-command")) &&
            (!selector.includes('sync-hidden="false"') || n.getAttribute("sync-hidden") !== "false"));
        return [];
    }
}
for (const key of ["hidden", "collapsed", "disabled"]) {
    Object.defineProperty(MenuNode.prototype, key, {
        get() { return this.hasAttribute(key) && this.getAttribute(key) !== "false"; },
        set(value) { if (value) this.setAttribute(key, "true"); else this.removeAttribute(key); }
    });
}

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

function harness(file, options = {}) {
    const module = file.endsWith(".mjs");
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
    function method(name) {
        const start = source.indexOf(`        ${name}:`);
        assert.ok(start >= 0, `missing production method ${name}`);
        const rest = source.slice(start);
        const next = /\n        \w+:/.exec(rest);
        return rest.slice(0, next.index);
    }
    const popup = new MenuNode({ id: "menu_ToolsPopup" }, "menupopup");
    const original = new MenuNode();
    const item = popup.append(new MenuNode({ command: "original", label: "placeholder" }));
    const timers = new Map(), errors = [], observers = new Set();
    const dummy = new MenuNode();
    const wrap = node => ({
        get: () => node,
        attr(key, value) {
            if (arguments.length === 1) return node.getAttribute(key);
            node.setAttribute(key, value); return this;
        },
        removeAttr(key) { node.removeAttribute(key); return this; },
        hasAttr: key => node.hasAttribute(key),
        parent: () => wrap(node.parentNode),
        children: () => node.children.map(wrap),
        off() { return this; }, remove: () => node.remove()
    });
    const document = {
        getElementById: id => id === "original" ? original : null,
        createEvent: () => ({
            ...(options.legacyCommand ? {} : { button: 0 }),
            initCommandEvent(type, bubbles, cancelable, view, detail, ctrlKey, altKey, shiftKey, metaKey, ...rest) {
                Object.assign(this, { type, bubbles, cancelable, view, detail, ctrlKey, altKey, shiftKey, metaKey });
                if ('button' in this) this.button = rest.shift();
                [this.sourceEvent, this.inputSource] = rest;
            },
            stopPropagation() { this.stopped = true; },
            preventDefault() { this.defaultPrevented = true; }
        }),
        removeEventListener() {}
    };
    const context = vm.createContext({
        console: { error: (...args) => errors.push(args), log() {} },
        window: { nsContextMenu: { prototype: { showHideSeparators() {} } } },
        document,
        $: value => module ? wrap(typeof value === "string" ? dummy : value) :
            value === "identity-box-contextmenu" ? null : dummy,
        $$: (selector, parent) => {
            const result = (parent?.querySelectorAll(selector) || []).map(node => module ? wrap(node) : node);
            result.remove = () => result.forEach(node => node.remove());
            return result;
        },
        getComputedStyle: node => node.style,
        enableFileRefreshing: !!options.refresh,
        enableConvertHiddenStyleToAttribue: !!options.convertCSS,
        onshowinglabelMaxLength: 15,
        lprintf: s => s, $L: s => s,
        getBooleanAttribute: (node, key) => node[key],
        setBooleanAttribute: (node, key, value) => { node[key] = value; },
        syncBooleanAttribute: (node, original, key) => { node[key] = original[key]; },
        setTimeout(fn, delay) { const id = Symbol(); timers.set(id, { fn, delay }); return id; },
        clearTimeout: id => timers.delete(id),
        PanelUI: { mainView: dummy },
        gBrowser: { tabContainer: dummy, tabpanels: dummy },
        CustomizableUI: { getWidget() { return null; } },
        MutationObserver: class {
            constructor(callback) { this.callback = callback; this.records = []; }
            observe(node, options) {
                this.node = node; this.filter = options.attributeFilter;
                node.observers.add(this); observers.add(this);
            }
            takeRecords() { return this.records.splice(0); }
            disconnect() { this.node.observers.delete(this); observers.delete(this); this.records = []; }
        }
    });
    const names = ["restoreMenuVisibility", "syncMenuVisibility", "syncCommandState", "handleEvent",
        "setDefaultLabel", "removeMenuitem", "destroy", "updateModifiedFile"];
    if (module) names.push('bindMenuCommand');
    const owner = vm.runInContext(`({${names.map(method).join("\n")}})`, context);
    Object.assign(owner, {
        customShowings: [], _menuGeneration: 1, supportLocalization: true,
        undoMods() {}, shouldDestroyWidget: () => false,
        convertText: text => text, ContextMenu: {}
    });
    context.window.addMenu = context.addMenu = owner;
    const event = (type, target = popup) => owner.handleEvent({ type, target, currentTarget: target });
    return {
        source, module, context, owner, popup, original, item, timers, errors, observers, event,
        showing(fn, node = item) {
            owner.customShowings.push({ insertPoint: "addMenu-tool-insertpoint", item: node, fn });
        },
        async flushTimers() {
            for (const [id, { fn }] of [...timers]) { timers.delete(id); await fn(); }
        },
        startup() {
            const start = source.lastIndexOf("    const instance = window.addMenu;");
            vm.runInContext(source.slice(start, source.indexOf("})(`", start)), context);
        }
    };
}

test('模块：原生弹出同步不能覆盖回调设置的禁用状态及标题', async () => {
    const h = harness('addMenuPlus.uc.mjs');
    h.item.removeAttribute('command');
    h.owner.bindMenuCommand(h.item, { command: 'original' });
    h.original.setAttribute('label', '原生标题');
    h.showing(node => {
        assert.equal(node.getAttribute('label'), '原生标题');
        node.disabled = true;
        node.setAttribute('label', '动态标题');
    });
    await h.event('popupshowing');
    // 模拟 nsXULPopupManager::UpdateMenuItems 在 popupshowing 后的同步。
    for (const node of h.popup.children) {
        if (node.getAttribute('command') === 'original') {
            node.disabled = h.original.disabled;
            node.setAttribute('label', h.original.getAttribute('label'));
        }
    }
    assert.equal(h.item.disabled, true);
    assert.equal(h.item.getAttribute('label'), '动态标题');
});

for (const legacyCommand of [false, true]) {
    test(`模块：命令转发保留修饰键和来源，遵守禁用状态（旧接口=${legacyCommand}）`, () => {
        const h = harness('addMenuPlus.uc.mjs', { legacyCommand });
        h.item.removeAttribute('command');
        h.owner.bindMenuCommand(h.item, { command: 'original' });
        const received = [];
        h.original.addEventListener('command', e => received.push(e));
        const event = h.context.document.createEvent('XULCommandEvent');
        Object.assign(event, { type: 'command', detail: 0, ctrlKey: true, altKey: true,
            shiftKey: true, metaKey: true, inputSource: 2, button: 1 });
        h.item.dispatchEvent(event);
        assert.equal(received.length, 1);
        const forwarded = received[0];
        for (const key of ['ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'inputSource']) {
            assert.equal(forwarded[key], event[key]);
        }
        if (!legacyCommand) assert.equal(forwarded.button, 1);
        assert.equal(forwarded.sourceEvent, event);
        assert.equal(event.stopped, true);
        h.item.disabled = true;
        h.item.dispatchEvent(event);
        assert.equal(received.length, 1);
    });
}

test('模块：显式 oncommand 不追加命令转发；空 disabled 属性也可同步', async () => {
    const h = harness('addMenuPlus.uc.mjs');
    h.item.removeAttribute('command');
    h.owner.bindMenuCommand(h.item, { command: 'original', oncommand() {} });
    assert.equal(h.item.listeners.has('command'), false);
    h.original.setAttribute('disabled', '');
    await h.event('popupshowing');
    assert.equal(h.item.disabled, true);
});

for (const file of ["addMenuPlus.uc.mjs", "addMenuPlus.uc.js"]) {
    test(`${file}: 原菜单状态先同步，回调状态及 CSS 隐藏最后生效`, async () => {
        const h = harness(file, { convertCSS: true });
        h.original.disabled = true;
        let calls = 0;
        h.showing(node => {
            calls++;
            assert.equal(node.disabled, true);
            node.hidden = node.collapsed = true;
            node.disabled = false;
        });
        await h.event("popupshowing");
        await h.flushTimers();
        assert.equal(calls, 1);
        assert.equal(h.item.hidden, true);
        assert.equal(h.item.collapsed, true);
        assert.equal(h.item.disabled, false);
        h.owner.customShowings = [];
        h.original.disabled = false;
        await h.event("popupshowing");
        assert.equal(h.item.hidden, false);
        assert.equal(h.item.collapsed, false);
        h.item.style.display = "none";
        await h.event("popupshowing");
        assert.equal(h.item.hidden, true);
        await h.event("popuphidden");
        assert.equal(h.item.hidden, false); // CSS 转换仅在当前弹出期间有效
    });

    test(`${file}: 分组禁用同步不会覆盖 onshowing`, async () => {
        const h = harness(file);
        const group = h.popup.append(new MenuNode({}, "menugroup"));
        const child = group.append(new MenuNode({ command: "original" }));
        h.original.hidden = true;
        h.showing(() => {
            assert.equal(child.disabled, true);
            child.disabled = false;
            child.hidden = true;
        }, group);
        await h.event("popupshowing");
        await h.flushTimers();
        assert.equal(child.disabled, false);
        assert.equal(child.hidden, true);
    });

    test(`${file}: 关闭或重建菜单后没有旧同步写入`, async () => {
        const h = harness(file);
        await h.event("popupshowing");
        h.popup.state = "closed";
        await h.event("popuphidden");
        h.owner.removeMenuitem();
        const replacement = new MenuNode({ command: "original", hidden: "true", disabled: "true" });
        h.popup.children = [];
        h.popup.append(replacement);
        await h.flushTimers();
        assert.equal(replacement.hidden, true);
        assert.equal(replacement.disabled, true);
    });

    test(`${file}: 启动延时保留，旧实例不能重建新实例，销毁清理定时器`, async () => {
        const h = harness(file);
        let rebuilds = 0;
        h.owner.init = async () => {};
        h.owner.rebuild = () => { rebuilds++; };
        h.startup();
        await Promise.resolve();
        assert.deepEqual([...h.timers.values()].map(t => t.delay), h.module ? [1000, 3000] : [1000, 2000, 5000]);
        h.context.window.addMenu = { rebuild() { throw Error("touched replacement"); } };
        await h.flushTimers();
        assert.equal(rebuilds, 0);
        h.context.window.addMenu = h.owner;
        // 另一个上下文运行启动片段，避免重复声明 const instance。
        const live = harness(file);
        live.owner.init = async () => {};
        live.owner.rebuild = () => { rebuilds++; };
        live.startup();
        await Promise.resolve();
        const queued = [...live.timers.values()];
        live.owner.destroy();
        assert.equal(live.timers.size, 0);
        for (const task of queued) await task.fn(); // 即使已经出队也不能重建
        assert.equal(rebuilds, 0);
        assert.equal(live.errors.length, 0);
    });

    for (const source of ["engine", "localization"]) {
        for (const change of ["none", "custom", "same-value", "removed", "rebuilt", "replaced", "reject"]) {
            test(`${file}: ${source} 默认标签 / ${change}`, async () => {
                const h = harness(file);
                const result = deferred();
                h.owner.searchService = { getEngineByAlias: () => result.promise };
                h.context.Localization = class {
                    formatValue(id) { assert.equal(id, "test-label"); return result.promise; }
                };
                const config = source === "engine" ? { keyword: "test" } : {
                    "data-l10n-href": "test.ftl", "data-l10n-id": "test-label"
                };
                const task = h.owner.setDefaultLabel(h.item, config);
                if (change === "custom") h.item.setAttribute("label", "custom label");
                if (change === "same-value") h.item.setAttribute("label", "placeholder");
                if (change === "removed") h.item.isConnected = false;
                if (change === "rebuilt") h.owner.removeMenuitem();
                if (change === "replaced") h.context.window.addMenu = {};
                if (change === "reject") result.reject(Error("lookup failed"));
                else result.resolve(source === "engine" ? { _name: "resolved label" } : "resolved label");
                await task;
                assert.equal(h.item.getAttribute("label"), change === "none" ? "resolved label" :
                    change === "custom" ? "custom label" : "placeholder");
                assert.equal(h.observers.size, 0);
                assert.equal(h.errors.length, change === "reject" ? 1 : 0);
            });
        }
    }
}

test("模块：初始化完成后才开始计算延时重建", async () => {
    const h = harness("addMenuPlus.uc.mjs");
    const initialized = deferred();
    let rebuilds = 0;
    h.owner.init = () => initialized.promise;
    h.owner.rebuild = () => { rebuilds++; };
    h.startup();
    assert.equal(h.timers.size, 0);
    const flushing = h.flushTimers();
    assert.equal(rebuilds, 0);
    initialized.resolve();
    await Promise.resolve();
    assert.deepEqual([...h.timers.values()].map(t => t.delay), [1000, 3000]);
    await h.flushTimers();
    await flushing;
    assert.equal(rebuilds, 2);
});

for (const action of ["close", "rebuild", "reopen", "replace"]) {
    test(`模块：等待文件刷新期间 ${action} 后不继续旧显示流程`, async () => {
        const h = harness("addMenuPlus.uc.mjs", { refresh: true });
        const refreshing = deferred();
        h.owner.updateModifiedFile = () => refreshing.promise;
        let calls = 0;
        h.showing(() => { calls++; });
        const pending = h.event("popupshowing");
        let reopened;
        if (action === "close") await h.event("popuphidden");
        if (action === "rebuild") h.owner.removeMenuitem();
        if (action === "reopen") reopened = h.event("popupshowing");
        if (action === "replace") h.context.window.addMenu = {};
        refreshing.resolve();
        await pending;
        await reopened;
        assert.equal(calls, action === "reopen" ? 1 : 0);
    });
}
