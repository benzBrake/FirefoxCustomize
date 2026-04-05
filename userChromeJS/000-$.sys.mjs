// ==UserScript==
// @name         000-$.sys.mjs
// @description  jQuery-like DOM selector for single element with Proxy wrapper
// @author       Ryan
// @version      1.0.2
// @skip         true
// @note         2026-04-05 fix element input, event listener removal, and contextual fragment insertion
// @note         2025-06-13 never load in global
// @note         2025-06-10 fix bug of hasClass
// @note         2025-06-03 remove selectorCache
// ==/UserScript==
const $cache = new WeakMap();
const $ = (sel, doc) => {
    if (typeof sel === 'undefined') return null;

    if (typeof sel === 'string' && !(/^[:#]|[, >\.\[\(]/.test(sel))) {
        sel = `#${sel}`;
    }

    // Find cached elements in Map
    if (typeof sel !== 'string' && sel.nodeType) {
        if ($cache.has(sel)) return $cache.get(sel);
    }

    // Find the DOM element
    const el = (typeof sel === 'string')
        ? (doc || document).querySelector(sel)
        : sel.nodeType ? sel : null;

    if (!el) return null;

    // Store event listeners with options to support reliable removal.
    const eventListeners = new Map();

    // Helper function to unwrap proxy to native element
    const unwrap = (el) => el?.$self || el;

    // Proxy wrapper
    const proxy = new Proxy(el, {
        get (target, prop) {
            // Native DOM compatibility cases
            switch (prop) {
                case '$self':
                    return target;
                case 'native':
                    return (methodName) => (...args) => {
                        if (typeof target[methodName] !== 'function') {
                            throw new TypeError(`${String(methodName)} is not a function`);
                        }
                        const unwrappedArgs = args.map(unwrap);
                        return target[methodName](...unwrappedArgs);
                    };
                case 'get':
                    return () => target;
                case 'next':
                    return () => {
                        const nextEl = target.nextElementSibling;
                        return nextEl ? $(nextEl) : null;
                    };
                case 'prev':
                    return () => {
                        const prevEl = target.previousElementSibling;
                        return prevEl ? $(prevEl) : null;
                    };
                case 'parent':
                    return () => $(target.parentElement);
                case 'children':
                    return () => Array.from(target.children).map(el => $(el));
                case 'remove':
                    return () => {
                        target.remove();
                        $cache.delete(target);
                        return null;
                    };
                case 'before':
                case 'after':
                case 'append':
                    return (...nodes) => {
                        const ownerDocument = target.ownerDocument;
                        const range = ownerDocument.createRange();
                        range.selectNode(target);
                        const fragment = ownerDocument.createDocumentFragment();
                        nodes.forEach(node => {
                            if (typeof node === 'string') {
                                fragment.append(range.createContextualFragment(node));
                            } else {
                                fragment.appendChild(unwrap(node));
                            }
                        });
                        target[prop](fragment);
                        return proxy;
                    };
                // Class methods cases
                case 'addClass':
                case 'removeClass':
                case 'toggleClass':
                    return (...args) => {
                        target.classList[prop.replace('Class', '')](...args);
                        return proxy;
                    };
                case 'hasClass':
                    return (className) => target.classList.contains(className);
                // Attribute methods cases
                case 'attr':
                    return (name, value) => {
                        if (value === undefined) {
                            return target.getAttribute(name);
                        } else {
                            target.setAttribute(name, value);
                            return proxy;
                        }
                    };
                case 'hasAttr':
                    return (name) => target.hasAttribute(name);
                case 'removeAttr':
                    return (name) => {
                        target.removeAttribute(name);
                        return proxy;
                    };
                // Event methods cases
                case 'on':
                    return (event, handler, options) => {
                        const finalOptions = options ?? false;

                        target.addEventListener(event, handler, finalOptions);
                        eventListeners.has(event) || eventListeners.set(event, new Set());
                        eventListeners.get(event).add({
                            handler,
                            options: finalOptions,
                        });
                        return proxy;
                    };
                case 'off':
                    return (event, handler) => {
                        const listeners = eventListeners.get(event);
                        if (!listeners) return proxy;

                        if (handler) {
                            for (const listener of listeners) {
                                if (listener.handler !== handler) continue;

                                target.removeEventListener(event, listener.handler, listener.options);
                                listeners.delete(listener);
                            }

                            if (!listeners.size) {
                                eventListeners.delete(event);
                            }
                        } else {
                            listeners.forEach(listener => {
                                target.removeEventListener(event, listener.handler, listener.options);
                            });
                            eventListeners.delete(event);
                        }
                        return proxy;
                    };
                // Other methods cases
                case 'matches':
                    return (selector) => target.matches(selector);
                case 'css':
                    return (styles) => {
                        Object.assign(target.style, styles);
                        return proxy;
                    };
                case 'html':
                    return (content) => {
                        if (content === undefined) {
                            return target.innerHTML;
                        } else {
                            target.innerHTML = content;
                            return proxy;
                        }
                    };
                case 'text':
                    return (content) => {
                        if (content === undefined) {
                            return target.textContent;
                        } else {
                            target.textContent = content;
                            return proxy;
                        }
                    };
            }

            // Fallback to native Element
            const value = Reflect.get(target, prop);
            return typeof value === 'function'
                ? value.bind(target)
                : value;
        },
    });

    // Store proxied object
    if (typeof sel !== 'string') {
        $cache.set(el, proxy);
    }

    return proxy;
};

const $$ = (sel, doc) => {
    if (typeof sel === 'string') {
        const elements = (doc || document).querySelectorAll(sel);
        return {
            elements: Array.from(elements),
            length: elements.length,
            forEach (callback) {
                this.elements.forEach((el, index) => {
                    callback($(el), index, this.elements);
                });
                return this;
            },
            remove () {
                this.elements.forEach(el => el.remove());
                return this;
            }
        };
    }
    return {
        elements: [],
        length: 0,
        forEach () { return this; },
        remove () { return this; }
    };
};
export { $, $$ };
