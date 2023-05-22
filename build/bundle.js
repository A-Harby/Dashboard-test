
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert$1(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert$1(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function getUserAgent() {
        if (typeof navigator === "object" && "userAgent" in navigator) {
            return navigator.userAgent;
        }
        if (typeof process === "object" && "version" in process) {
            return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
        }
        return "<environment undetectable>";
    }

    var distWeb$a = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getUserAgent: getUserAgent
    });

    var register_1 = register;

    function register(state, name, method, options) {
      if (typeof method !== "function") {
        throw new Error("method for before hook must be a function");
      }

      if (!options) {
        options = {};
      }

      if (Array.isArray(name)) {
        return name.reverse().reduce(function (callback, name) {
          return register.bind(null, state, name, callback, options);
        }, method)();
      }

      return Promise.resolve().then(function () {
        if (!state.registry[name]) {
          return method(options);
        }

        return state.registry[name].reduce(function (method, registered) {
          return registered.hook.bind(null, method, options);
        }, method)();
      });
    }

    var add = addHook;

    function addHook(state, kind, name, hook) {
      var orig = hook;
      if (!state.registry[name]) {
        state.registry[name] = [];
      }

      if (kind === "before") {
        hook = function (method, options) {
          return Promise.resolve()
            .then(orig.bind(null, options))
            .then(method.bind(null, options));
        };
      }

      if (kind === "after") {
        hook = function (method, options) {
          var result;
          return Promise.resolve()
            .then(method.bind(null, options))
            .then(function (result_) {
              result = result_;
              return orig(result, options);
            })
            .then(function () {
              return result;
            });
        };
      }

      if (kind === "error") {
        hook = function (method, options) {
          return Promise.resolve()
            .then(method.bind(null, options))
            .catch(function (error) {
              return orig(error, options);
            });
        };
      }

      state.registry[name].push({
        hook: hook,
        orig: orig,
      });
    }

    var remove = removeHook;

    function removeHook(state, name, method) {
      if (!state.registry[name]) {
        return;
      }

      var index = state.registry[name]
        .map(function (registered) {
          return registered.orig;
        })
        .indexOf(method);

      if (index === -1) {
        return;
      }

      state.registry[name].splice(index, 1);
    }

    // bind with array of arguments: https://stackoverflow.com/a/21792913
    var bind = Function.bind;
    var bindable = bind.bind(bind);

    function bindApi(hook, state, name) {
      var removeHookRef = bindable(remove, null).apply(
        null,
        name ? [state, name] : [state]
      );
      hook.api = { remove: removeHookRef };
      hook.remove = removeHookRef;
      ["before", "error", "after", "wrap"].forEach(function (kind) {
        var args = name ? [state, kind, name] : [state, kind];
        hook[kind] = hook.api[kind] = bindable(add, null).apply(null, args);
      });
    }

    function HookSingular() {
      var singularHookName = "h";
      var singularHookState = {
        registry: {},
      };
      var singularHook = register_1.bind(null, singularHookState, singularHookName);
      bindApi(singularHook, singularHookState, singularHookName);
      return singularHook;
    }

    function HookCollection() {
      var state = {
        registry: {},
      };

      var hook = register_1.bind(null, state);
      bindApi(hook, state);

      return hook;
    }

    var collectionHookDeprecationMessageDisplayed = false;
    function Hook() {
      if (!collectionHookDeprecationMessageDisplayed) {
        console.warn(
          '[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4'
        );
        collectionHookDeprecationMessageDisplayed = true;
      }
      return HookCollection();
    }

    Hook.Singular = HookSingular.bind();
    Hook.Collection = HookCollection.bind();

    var beforeAfterHook = Hook;
    // expose constructors as a named property for TypeScript
    var Hook_1 = Hook;
    var Singular = Hook.Singular;
    var Collection = Hook.Collection;
    beforeAfterHook.Hook = Hook_1;
    beforeAfterHook.Singular = Singular;
    beforeAfterHook.Collection = Collection;

    /*!
     * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
     *
     * Copyright (c) 2014-2017, Jon Schlinkert.
     * Released under the MIT License.
     */

    function isObject(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    }

    function isPlainObject(o) {
      var ctor,prot;

      if (isObject(o) === false) return false;

      // If has modified constructor
      ctor = o.constructor;
      if (ctor === undefined) return true;

      // If has modified prototype
      prot = ctor.prototype;
      if (isObject(prot) === false) return false;

      // If constructor does not have an Object-specific method
      if (prot.hasOwnProperty('isPrototypeOf') === false) {
        return false;
      }

      // Most likely a plain Object
      return true;
    }

    function lowercaseKeys(object) {
        if (!object) {
            return {};
        }
        return Object.keys(object).reduce((newObj, key) => {
            newObj[key.toLowerCase()] = object[key];
            return newObj;
        }, {});
    }

    function mergeDeep(defaults, options) {
        const result = Object.assign({}, defaults);
        Object.keys(options).forEach((key) => {
            if (isPlainObject(options[key])) {
                if (!(key in defaults))
                    Object.assign(result, { [key]: options[key] });
                else
                    result[key] = mergeDeep(defaults[key], options[key]);
            }
            else {
                Object.assign(result, { [key]: options[key] });
            }
        });
        return result;
    }

    function removeUndefinedProperties(obj) {
        for (const key in obj) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }
        return obj;
    }

    function merge(defaults, route, options) {
        if (typeof route === "string") {
            let [method, url] = route.split(" ");
            options = Object.assign(url ? { method, url } : { url: method }, options);
        }
        else {
            options = Object.assign({}, route);
        }
        // lowercase header names before merging with defaults to avoid duplicates
        options.headers = lowercaseKeys(options.headers);
        // remove properties with undefined values before merging
        removeUndefinedProperties(options);
        removeUndefinedProperties(options.headers);
        const mergedOptions = mergeDeep(defaults || {}, options);
        // mediaType.previews arrays are merged, instead of overwritten
        if (defaults && defaults.mediaType.previews.length) {
            mergedOptions.mediaType.previews = defaults.mediaType.previews
                .filter((preview) => !mergedOptions.mediaType.previews.includes(preview))
                .concat(mergedOptions.mediaType.previews);
        }
        mergedOptions.mediaType.previews = mergedOptions.mediaType.previews.map((preview) => preview.replace(/-preview/, ""));
        return mergedOptions;
    }

    function addQueryParameters(url, parameters) {
        const separator = /\?/.test(url) ? "&" : "?";
        const names = Object.keys(parameters);
        if (names.length === 0) {
            return url;
        }
        return (url +
            separator +
            names
                .map((name) => {
                if (name === "q") {
                    return ("q=" + parameters.q.split("+").map(encodeURIComponent).join("+"));
                }
                return `${name}=${encodeURIComponent(parameters[name])}`;
            })
                .join("&"));
    }

    const urlVariableRegex = /\{[^}]+\}/g;
    function removeNonChars(variableName) {
        return variableName.replace(/^\W+|\W+$/g, "").split(/,/);
    }
    function extractUrlVariableNames(url) {
        const matches = url.match(urlVariableRegex);
        if (!matches) {
            return [];
        }
        return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
    }

    function omit(object, keysToOmit) {
        return Object.keys(object)
            .filter((option) => !keysToOmit.includes(option))
            .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
    }

    // Based on https://github.com/bramstein/url-template, licensed under BSD
    // TODO: create separate package.
    //
    // Copyright (c) 2012-2014, Bram Stein
    // All rights reserved.
    // Redistribution and use in source and binary forms, with or without
    // modification, are permitted provided that the following conditions
    // are met:
    //  1. Redistributions of source code must retain the above copyright
    //     notice, this list of conditions and the following disclaimer.
    //  2. Redistributions in binary form must reproduce the above copyright
    //     notice, this list of conditions and the following disclaimer in the
    //     documentation and/or other materials provided with the distribution.
    //  3. The name of the author may not be used to endorse or promote products
    //     derived from this software without specific prior written permission.
    // THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
    // WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
    // MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
    // EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
    // INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
    // BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
    // OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    // NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
    // EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    /* istanbul ignore file */
    function encodeReserved(str) {
        return str
            .split(/(%[0-9A-Fa-f]{2})/g)
            .map(function (part) {
            if (!/%[0-9A-Fa-f]/.test(part)) {
                part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
            }
            return part;
        })
            .join("");
    }
    function encodeUnreserved(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return "%" + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }
    function encodeValue(operator, value, key) {
        value =
            operator === "+" || operator === "#"
                ? encodeReserved(value)
                : encodeUnreserved(value);
        if (key) {
            return encodeUnreserved(key) + "=" + value;
        }
        else {
            return value;
        }
    }
    function isDefined(value) {
        return value !== undefined && value !== null;
    }
    function isKeyOperator(operator) {
        return operator === ";" || operator === "&" || operator === "?";
    }
    function getValues(context, operator, key, modifier) {
        var value = context[key], result = [];
        if (isDefined(value) && value !== "") {
            if (typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean") {
                value = value.toString();
                if (modifier && modifier !== "*") {
                    value = value.substring(0, parseInt(modifier, 10));
                }
                result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
            }
            else {
                if (modifier === "*") {
                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
                        });
                    }
                    else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                result.push(encodeValue(operator, value[k], k));
                            }
                        });
                    }
                }
                else {
                    const tmp = [];
                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            tmp.push(encodeValue(operator, value));
                        });
                    }
                    else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                tmp.push(encodeUnreserved(k));
                                tmp.push(encodeValue(operator, value[k].toString()));
                            }
                        });
                    }
                    if (isKeyOperator(operator)) {
                        result.push(encodeUnreserved(key) + "=" + tmp.join(","));
                    }
                    else if (tmp.length !== 0) {
                        result.push(tmp.join(","));
                    }
                }
            }
        }
        else {
            if (operator === ";") {
                if (isDefined(value)) {
                    result.push(encodeUnreserved(key));
                }
            }
            else if (value === "" && (operator === "&" || operator === "?")) {
                result.push(encodeUnreserved(key) + "=");
            }
            else if (value === "") {
                result.push("");
            }
        }
        return result;
    }
    function parseUrl(template) {
        return {
            expand: expand.bind(null, template),
        };
    }
    function expand(template, context) {
        var operators = ["+", "#", ".", "/", ";", "?", "&"];
        return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
            if (expression) {
                let operator = "";
                const values = [];
                if (operators.indexOf(expression.charAt(0)) !== -1) {
                    operator = expression.charAt(0);
                    expression = expression.substr(1);
                }
                expression.split(/,/g).forEach(function (variable) {
                    var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
                    values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
                });
                if (operator && operator !== "+") {
                    var separator = ",";
                    if (operator === "?") {
                        separator = "&";
                    }
                    else if (operator !== "#") {
                        separator = operator;
                    }
                    return (values.length !== 0 ? operator : "") + values.join(separator);
                }
                else {
                    return values.join(",");
                }
            }
            else {
                return encodeReserved(literal);
            }
        });
    }

    function parse(options) {
        // https://fetch.spec.whatwg.org/#methods
        let method = options.method.toUpperCase();
        // replace :varname with {varname} to make it RFC 6570 compatible
        let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
        let headers = Object.assign({}, options.headers);
        let body;
        let parameters = omit(options, [
            "method",
            "baseUrl",
            "url",
            "headers",
            "request",
            "mediaType",
        ]);
        // extract variable names from URL to calculate remaining variables later
        const urlVariableNames = extractUrlVariableNames(url);
        url = parseUrl(url).expand(parameters);
        if (!/^http/.test(url)) {
            url = options.baseUrl + url;
        }
        const omittedParameters = Object.keys(options)
            .filter((option) => urlVariableNames.includes(option))
            .concat("baseUrl");
        const remainingParameters = omit(parameters, omittedParameters);
        const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
        if (!isBinaryRequest) {
            if (options.mediaType.format) {
                // e.g. application/vnd.github.v3+json => application/vnd.github.v3.raw
                headers.accept = headers.accept
                    .split(/,/)
                    .map((preview) => preview.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${options.mediaType.format}`))
                    .join(",");
            }
            if (options.mediaType.previews.length) {
                const previewsFromAcceptHeader = headers.accept.match(/[\w-]+(?=-preview)/g) || [];
                headers.accept = previewsFromAcceptHeader
                    .concat(options.mediaType.previews)
                    .map((preview) => {
                    const format = options.mediaType.format
                        ? `.${options.mediaType.format}`
                        : "+json";
                    return `application/vnd.github.${preview}-preview${format}`;
                })
                    .join(",");
            }
        }
        // for GET/HEAD requests, set URL query parameters from remaining parameters
        // for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters
        if (["GET", "HEAD"].includes(method)) {
            url = addQueryParameters(url, remainingParameters);
        }
        else {
            if ("data" in remainingParameters) {
                body = remainingParameters.data;
            }
            else {
                if (Object.keys(remainingParameters).length) {
                    body = remainingParameters;
                }
            }
        }
        // default content-type for JSON if body is set
        if (!headers["content-type"] && typeof body !== "undefined") {
            headers["content-type"] = "application/json; charset=utf-8";
        }
        // GitHub expects 'content-length: 0' header for PUT/PATCH requests without body.
        // fetch does not allow to set `content-length` header, but we can set body to an empty string
        if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
            body = "";
        }
        // Only return body/request keys if present
        return Object.assign({ method, url, headers }, typeof body !== "undefined" ? { body } : null, options.request ? { request: options.request } : null);
    }

    function endpointWithDefaults(defaults, route, options) {
        return parse(merge(defaults, route, options));
    }

    function withDefaults$2(oldDefaults, newDefaults) {
        const DEFAULTS = merge(oldDefaults, newDefaults);
        const endpoint = endpointWithDefaults.bind(null, DEFAULTS);
        return Object.assign(endpoint, {
            DEFAULTS,
            defaults: withDefaults$2.bind(null, DEFAULTS),
            merge: merge.bind(null, DEFAULTS),
            parse,
        });
    }

    const VERSION$f = "7.0.5";

    const userAgent = `octokit-endpoint.js/${VERSION$f} ${getUserAgent()}`;
    // DEFAULTS has all properties set that EndpointOptions has, except url.
    // So we use RequestParameters and add method as additional required property.
    const DEFAULTS = {
        method: "GET",
        baseUrl: "https://api.github.com",
        headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": userAgent,
        },
        mediaType: {
            format: "",
            previews: [],
        },
    };

    const endpoint = withDefaults$2(null, DEFAULTS);

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var browser = createCommonjsModule(function (module, exports) {

    // ref: https://github.com/tc39/proposal-global
    var getGlobal = function () {
    	// the only reliable means to get the global object is
    	// `Function('return this')()`
    	// However, this causes CSP violations in Chrome apps.
    	if (typeof self !== 'undefined') { return self; }
    	if (typeof window !== 'undefined') { return window; }
    	if (typeof commonjsGlobal !== 'undefined') { return commonjsGlobal; }
    	throw new Error('unable to locate global object');
    };

    var globalObject = getGlobal();

    module.exports = exports = globalObject.fetch;

    // Needed for TypeScript and Webpack.
    if (globalObject.fetch) {
    	exports.default = globalObject.fetch.bind(globalObject);
    }

    exports.Headers = globalObject.Headers;
    exports.Request = globalObject.Request;
    exports.Response = globalObject.Response;
    });

    class Deprecation extends Error {
      constructor(message) {
        super(message); // Maintains proper stack trace (only available on V8)

        /* istanbul ignore next */

        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        }

        this.name = 'Deprecation';
      }

    }

    // Returns a wrapper function that returns a wrapped callback
    // The wrapper function should do some stuff, and return a
    // presumably different callback function.
    // This makes sure that own properties are retained, so that
    // decorations and such are not lost along the way.
    var wrappy_1 = wrappy;
    function wrappy (fn, cb) {
      if (fn && cb) return wrappy(fn)(cb)

      if (typeof fn !== 'function')
        throw new TypeError('need wrapper function')

      Object.keys(fn).forEach(function (k) {
        wrapper[k] = fn[k];
      });

      return wrapper

      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret = fn.apply(this, args);
        var cb = args[args.length-1];
        if (typeof ret === 'function' && ret !== cb) {
          Object.keys(cb).forEach(function (k) {
            ret[k] = cb[k];
          });
        }
        return ret
      }
    }

    var once_1 = wrappy_1(once);
    var strict = wrappy_1(onceStrict);

    once.proto = once(function () {
      Object.defineProperty(Function.prototype, 'once', {
        value: function () {
          return once(this)
        },
        configurable: true
      });

      Object.defineProperty(Function.prototype, 'onceStrict', {
        value: function () {
          return onceStrict(this)
        },
        configurable: true
      });
    });

    function once (fn) {
      var f = function () {
        if (f.called) return f.value
        f.called = true;
        return f.value = fn.apply(this, arguments)
      };
      f.called = false;
      return f
    }

    function onceStrict (fn) {
      var f = function () {
        if (f.called)
          throw new Error(f.onceError)
        f.called = true;
        return f.value = fn.apply(this, arguments)
      };
      var name = fn.name || 'Function wrapped with `once`';
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f
    }
    once_1.strict = strict;

    const logOnceCode = once_1((deprecation) => console.warn(deprecation));
    const logOnceHeaders = once_1((deprecation) => console.warn(deprecation));
    /**
     * Error with extra properties to help with debugging
     */
    class RequestError extends Error {
        constructor(message, statusCode, options) {
            super(message);
            // Maintains proper stack trace (only available on V8)
            /* istanbul ignore next */
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
            this.name = "HttpError";
            this.status = statusCode;
            let headers;
            if ("headers" in options && typeof options.headers !== "undefined") {
                headers = options.headers;
            }
            if ("response" in options) {
                this.response = options.response;
                headers = options.response.headers;
            }
            // redact request credentials without mutating original request options
            const requestCopy = Object.assign({}, options.request);
            if (options.request.headers.authorization) {
                requestCopy.headers = Object.assign({}, options.request.headers, {
                    authorization: options.request.headers.authorization.replace(/ .*$/, " [REDACTED]"),
                });
            }
            requestCopy.url = requestCopy.url
                // client_id & client_secret can be passed as URL query parameters to increase rate limit
                // see https://developer.github.com/v3/#increasing-the-unauthenticated-rate-limit-for-oauth-applications
                .replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]")
                // OAuth tokens can be passed as URL query parameters, although it is not recommended
                // see https://developer.github.com/v3/#oauth2-token-sent-in-a-header
                .replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
            this.request = requestCopy;
            // deprecations
            Object.defineProperty(this, "code", {
                get() {
                    logOnceCode(new Deprecation("[@octokit/request-error] `error.code` is deprecated, use `error.status`."));
                    return statusCode;
                },
            });
            Object.defineProperty(this, "headers", {
                get() {
                    logOnceHeaders(new Deprecation("[@octokit/request-error] `error.headers` is deprecated, use `error.response.headers`."));
                    return headers || {};
                },
            });
        }
    }

    var distWeb$9 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        RequestError: RequestError
    });

    const VERSION$e = "6.2.3";

    function getBufferResponse(response) {
        return response.arrayBuffer();
    }

    function fetchWrapper(requestOptions) {
        const log = requestOptions.request && requestOptions.request.log
            ? requestOptions.request.log
            : console;
        if (isPlainObject(requestOptions.body) ||
            Array.isArray(requestOptions.body)) {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        let headers = {};
        let status;
        let url;
        const fetch = (requestOptions.request && requestOptions.request.fetch) ||
            globalThis.fetch ||
            /* istanbul ignore next */ browser;
        return fetch(requestOptions.url, Object.assign({
            method: requestOptions.method,
            body: requestOptions.body,
            headers: requestOptions.headers,
            redirect: requestOptions.redirect,
        }, 
        // `requestOptions.request.agent` type is incompatible
        // see https://github.com/octokit/types.ts/pull/264
        requestOptions.request))
            .then(async (response) => {
            url = response.url;
            status = response.status;
            for (const keyAndValue of response.headers) {
                headers[keyAndValue[0]] = keyAndValue[1];
            }
            if ("deprecation" in headers) {
                const matches = headers.link && headers.link.match(/<([^>]+)>; rel="deprecation"/);
                const deprecationLink = matches && matches.pop();
                log.warn(`[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${headers.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`);
            }
            if (status === 204 || status === 205) {
                return;
            }
            // GitHub API returns 200 for HEAD requests
            if (requestOptions.method === "HEAD") {
                if (status < 400) {
                    return;
                }
                throw new RequestError(response.statusText, status, {
                    response: {
                        url,
                        status,
                        headers,
                        data: undefined,
                    },
                    request: requestOptions,
                });
            }
            if (status === 304) {
                throw new RequestError("Not modified", status, {
                    response: {
                        url,
                        status,
                        headers,
                        data: await getResponseData(response),
                    },
                    request: requestOptions,
                });
            }
            if (status >= 400) {
                const data = await getResponseData(response);
                const error = new RequestError(toErrorMessage(data), status, {
                    response: {
                        url,
                        status,
                        headers,
                        data,
                    },
                    request: requestOptions,
                });
                throw error;
            }
            return getResponseData(response);
        })
            .then((data) => {
            return {
                status,
                url,
                headers,
                data,
            };
        })
            .catch((error) => {
            if (error instanceof RequestError)
                throw error;
            else if (error.name === "AbortError")
                throw error;
            throw new RequestError(error.message, 500, {
                request: requestOptions,
            });
        });
    }
    async function getResponseData(response) {
        const contentType = response.headers.get("content-type");
        if (/application\/json/.test(contentType)) {
            return response.json();
        }
        if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
            return response.text();
        }
        return getBufferResponse(response);
    }
    function toErrorMessage(data) {
        if (typeof data === "string")
            return data;
        // istanbul ignore else - just in case
        if ("message" in data) {
            if (Array.isArray(data.errors)) {
                return `${data.message}: ${data.errors.map(JSON.stringify).join(", ")}`;
            }
            return data.message;
        }
        // istanbul ignore next - just in case
        return `Unknown error: ${JSON.stringify(data)}`;
    }

    function withDefaults$1(oldEndpoint, newDefaults) {
        const endpoint = oldEndpoint.defaults(newDefaults);
        const newApi = function (route, parameters) {
            const endpointOptions = endpoint.merge(route, parameters);
            if (!endpointOptions.request || !endpointOptions.request.hook) {
                return fetchWrapper(endpoint.parse(endpointOptions));
            }
            const request = (route, parameters) => {
                return fetchWrapper(endpoint.parse(endpoint.merge(route, parameters)));
            };
            Object.assign(request, {
                endpoint,
                defaults: withDefaults$1.bind(null, endpoint),
            });
            return endpointOptions.request.hook(request, endpointOptions);
        };
        return Object.assign(newApi, {
            endpoint,
            defaults: withDefaults$1.bind(null, endpoint),
        });
    }

    const request$1 = withDefaults$1(endpoint, {
        headers: {
            "user-agent": `octokit-request.js/${VERSION$e} ${getUserAgent()}`,
        },
    });

    var distWeb$8 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        request: request$1
    });

    const VERSION$d = "5.0.5";

    function _buildMessageForResponseErrors(data) {
        return (`Request failed due to following response errors:\n` +
            data.errors.map((e) => ` - ${e.message}`).join("\n"));
    }
    class GraphqlResponseError extends Error {
        constructor(request, headers, response) {
            super(_buildMessageForResponseErrors(response));
            this.request = request;
            this.headers = headers;
            this.response = response;
            this.name = "GraphqlResponseError";
            // Expose the errors and response data in their shorthand properties.
            this.errors = response.errors;
            this.data = response.data;
            // Maintains proper stack trace (only available on V8)
            /* istanbul ignore next */
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
        }
    }

    const NON_VARIABLE_OPTIONS = [
        "method",
        "baseUrl",
        "url",
        "headers",
        "request",
        "query",
        "mediaType",
    ];
    const FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
    const GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
    function graphql(request, query, options) {
        if (options) {
            if (typeof query === "string" && "query" in options) {
                return Promise.reject(new Error(`[@octokit/graphql] "query" cannot be used as variable name`));
            }
            for (const key in options) {
                if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key))
                    continue;
                return Promise.reject(new Error(`[@octokit/graphql] "${key}" cannot be used as variable name`));
            }
        }
        const parsedOptions = typeof query === "string" ? Object.assign({ query }, options) : query;
        const requestOptions = Object.keys(parsedOptions).reduce((result, key) => {
            if (NON_VARIABLE_OPTIONS.includes(key)) {
                result[key] = parsedOptions[key];
                return result;
            }
            if (!result.variables) {
                result.variables = {};
            }
            result.variables[key] = parsedOptions[key];
            return result;
        }, {});
        // workaround for GitHub Enterprise baseUrl set with /api/v3 suffix
        // https://github.com/octokit/auth-app.js/issues/111#issuecomment-657610451
        const baseUrl = parsedOptions.baseUrl || request.endpoint.DEFAULTS.baseUrl;
        if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
            requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
        }
        return request(requestOptions).then((response) => {
            if (response.data.errors) {
                const headers = {};
                for (const key of Object.keys(response.headers)) {
                    headers[key] = response.headers[key];
                }
                throw new GraphqlResponseError(requestOptions, headers, response.data);
            }
            return response.data.data;
        });
    }

    function withDefaults(request, newDefaults) {
        const newRequest = request.defaults(newDefaults);
        const newApi = (query, options) => {
            return graphql(newRequest, query, options);
        };
        return Object.assign(newApi, {
            defaults: withDefaults.bind(null, newRequest),
            endpoint: newRequest.endpoint,
        });
    }

    withDefaults(request$1, {
        headers: {
            "user-agent": `octokit-graphql.js/${VERSION$d} ${getUserAgent()}`,
        },
        method: "POST",
        url: "/graphql",
    });
    function withCustomRequest(customRequest) {
        return withDefaults(customRequest, {
            method: "POST",
            url: "/graphql",
        });
    }

    const REGEX_IS_INSTALLATION_LEGACY = /^v1\./;
    const REGEX_IS_INSTALLATION = /^ghs_/;
    const REGEX_IS_USER_TO_SERVER = /^ghu_/;
    async function auth$5(token) {
        const isApp = token.split(/\./).length === 3;
        const isInstallation = REGEX_IS_INSTALLATION_LEGACY.test(token) ||
            REGEX_IS_INSTALLATION.test(token);
        const isUserToServer = REGEX_IS_USER_TO_SERVER.test(token);
        const tokenType = isApp
            ? "app"
            : isInstallation
                ? "installation"
                : isUserToServer
                    ? "user-to-server"
                    : "oauth";
        return {
            type: "token",
            token: token,
            tokenType,
        };
    }

    /**
     * Prefix token for usage in the Authorization header
     *
     * @param token OAuth token or JSON Web Token
     */
    function withAuthorizationPrefix(token) {
        if (token.split(/\./).length === 3) {
            return `bearer ${token}`;
        }
        return `token ${token}`;
    }

    async function hook$5(token, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        endpoint.headers.authorization = withAuthorizationPrefix(token);
        return request(endpoint);
    }

    const createTokenAuth = function createTokenAuth(token) {
        if (!token) {
            throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
        }
        if (typeof token !== "string") {
            throw new Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
        }
        token = token.replace(/^(token|bearer) +/i, "");
        return Object.assign(auth$5.bind(null, token), {
            hook: hook$5.bind(null, token),
        });
    };

    const VERSION$c = "4.2.0";

    class Octokit$1 {
        constructor(options = {}) {
            const hook = new Collection();
            const requestDefaults = {
                baseUrl: request$1.endpoint.DEFAULTS.baseUrl,
                headers: {},
                request: Object.assign({}, options.request, {
                    // @ts-ignore internal usage only, no need to type
                    hook: hook.bind(null, "request"),
                }),
                mediaType: {
                    previews: [],
                    format: "",
                },
            };
            // prepend default user agent with `options.userAgent` if set
            requestDefaults.headers["user-agent"] = [
                options.userAgent,
                `octokit-core.js/${VERSION$c} ${getUserAgent()}`,
            ]
                .filter(Boolean)
                .join(" ");
            if (options.baseUrl) {
                requestDefaults.baseUrl = options.baseUrl;
            }
            if (options.previews) {
                requestDefaults.mediaType.previews = options.previews;
            }
            if (options.timeZone) {
                requestDefaults.headers["time-zone"] = options.timeZone;
            }
            this.request = request$1.defaults(requestDefaults);
            this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
            this.log = Object.assign({
                debug: () => { },
                info: () => { },
                warn: console.warn.bind(console),
                error: console.error.bind(console),
            }, options.log);
            this.hook = hook;
            // (1) If neither `options.authStrategy` nor `options.auth` are set, the `octokit` instance
            //     is unauthenticated. The `this.auth()` method is a no-op and no request hook is registered.
            // (2) If only `options.auth` is set, use the default token authentication strategy.
            // (3) If `options.authStrategy` is set then use it and pass in `options.auth`. Always pass own request as many strategies accept a custom request instance.
            // TODO: type `options.auth` based on `options.authStrategy`.
            if (!options.authStrategy) {
                if (!options.auth) {
                    // (1)
                    this.auth = async () => ({
                        type: "unauthenticated",
                    });
                }
                else {
                    // (2)
                    const auth = createTokenAuth(options.auth);
                    // @ts-ignore  ¯\_(ツ)_/¯
                    hook.wrap("request", auth.hook);
                    this.auth = auth;
                }
            }
            else {
                const { authStrategy, ...otherOptions } = options;
                const auth = authStrategy(Object.assign({
                    request: this.request,
                    log: this.log,
                    // we pass the current octokit instance as well as its constructor options
                    // to allow for authentication strategies that return a new octokit instance
                    // that shares the same internal state as the current one. The original
                    // requirement for this was the "event-octokit" authentication strategy
                    // of https://github.com/probot/octokit-auth-probot.
                    octokit: this,
                    octokitOptions: otherOptions,
                }, options.auth));
                // @ts-ignore  ¯\_(ツ)_/¯
                hook.wrap("request", auth.hook);
                this.auth = auth;
            }
            // apply plugins
            // https://stackoverflow.com/a/16345172
            const classConstructor = this.constructor;
            classConstructor.plugins.forEach((plugin) => {
                Object.assign(this, plugin(this, options));
            });
        }
        static defaults(defaults) {
            const OctokitWithDefaults = class extends this {
                constructor(...args) {
                    const options = args[0] || {};
                    if (typeof defaults === "function") {
                        super(defaults(options));
                        return;
                    }
                    super(Object.assign({}, defaults, options, options.userAgent && defaults.userAgent
                        ? {
                            userAgent: `${options.userAgent} ${defaults.userAgent}`,
                        }
                        : null));
                }
            };
            return OctokitWithDefaults;
        }
        /**
         * Attach a plugin (or many) to your Octokit instance.
         *
         * @example
         * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
         */
        static plugin(...newPlugins) {
            var _a;
            const currentPlugins = this.plugins;
            const NewOctokit = (_a = class extends this {
                },
                _a.plugins = currentPlugins.concat(newPlugins.filter((plugin) => !currentPlugins.includes(plugin))),
                _a);
            return NewOctokit;
        }
    }
    Octokit$1.VERSION = VERSION$c;
    Octokit$1.plugins = [];

    var distWeb$7 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Octokit: Octokit$1
    });

    const VERSION$b = "6.0.0";

    /**
     * Some “list” response that can be paginated have a different response structure
     *
     * They have a `total_count` key in the response (search also has `incomplete_results`,
     * /installation/repositories also has `repository_selection`), as well as a key with
     * the list of the items which name varies from endpoint to endpoint.
     *
     * Octokit normalizes these responses so that paginated results are always returned following
     * the same structure. One challenge is that if the list response has only one page, no Link
     * header is provided, so this header alone is not sufficient to check wether a response is
     * paginated or not.
     *
     * We check if a "total_count" key is present in the response data, but also make sure that
     * a "url" property is not, as the "Get the combined status for a specific ref" endpoint would
     * otherwise match: https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref
     */
    function normalizePaginatedListResponse(response) {
        // endpoints can respond with 204 if repository is empty
        if (!response.data) {
            return {
                ...response,
                data: [],
            };
        }
        const responseNeedsNormalization = "total_count" in response.data && !("url" in response.data);
        if (!responseNeedsNormalization)
            return response;
        // keep the additional properties intact as there is currently no other way
        // to retrieve the same information.
        const incompleteResults = response.data.incomplete_results;
        const repositorySelection = response.data.repository_selection;
        const totalCount = response.data.total_count;
        delete response.data.incomplete_results;
        delete response.data.repository_selection;
        delete response.data.total_count;
        const namespaceKey = Object.keys(response.data)[0];
        const data = response.data[namespaceKey];
        response.data = data;
        if (typeof incompleteResults !== "undefined") {
            response.data.incomplete_results = incompleteResults;
        }
        if (typeof repositorySelection !== "undefined") {
            response.data.repository_selection = repositorySelection;
        }
        response.data.total_count = totalCount;
        return response;
    }

    function iterator$1(octokit, route, parameters) {
        const options = typeof route === "function"
            ? route.endpoint(parameters)
            : octokit.request.endpoint(route, parameters);
        const requestMethod = typeof route === "function" ? route : octokit.request;
        const method = options.method;
        const headers = options.headers;
        let url = options.url;
        return {
            [Symbol.asyncIterator]: () => ({
                async next() {
                    if (!url)
                        return { done: true };
                    try {
                        const response = await requestMethod({ method, url, headers });
                        const normalizedResponse = normalizePaginatedListResponse(response);
                        // `response.headers.link` format:
                        // '<https://api.github.com/users/aseemk/followers?page=2>; rel="next", <https://api.github.com/users/aseemk/followers?page=2>; rel="last"'
                        // sets `url` to undefined if "next" URL is not present or `link` header is not set
                        url = ((normalizedResponse.headers.link || "").match(/<([^>]+)>;\s*rel="next"/) || [])[1];
                        return { value: normalizedResponse };
                    }
                    catch (error) {
                        if (error.status !== 409)
                            throw error;
                        url = "";
                        return {
                            value: {
                                status: 200,
                                headers: {},
                                data: [],
                            },
                        };
                    }
                },
            }),
        };
    }

    function paginate(octokit, route, parameters, mapFn) {
        if (typeof parameters === "function") {
            mapFn = parameters;
            parameters = undefined;
        }
        return gather(octokit, [], iterator$1(octokit, route, parameters)[Symbol.asyncIterator](), mapFn);
    }
    function gather(octokit, results, iterator, mapFn) {
        return iterator.next().then((result) => {
            if (result.done) {
                return results;
            }
            let earlyExit = false;
            function done() {
                earlyExit = true;
            }
            results = results.concat(mapFn ? mapFn(result.value, done) : result.value.data);
            if (earlyExit) {
                return results;
            }
            return gather(octokit, results, iterator, mapFn);
        });
    }

    const composePaginateRest = Object.assign(paginate, {
        iterator: iterator$1,
    });

    const paginatingEndpoints = [
        "GET /app/hook/deliveries",
        "GET /app/installations",
        "GET /enterprises/{enterprise}/actions/runner-groups",
        "GET /enterprises/{enterprise}/dependabot/alerts",
        "GET /enterprises/{enterprise}/secret-scanning/alerts",
        "GET /events",
        "GET /gists",
        "GET /gists/public",
        "GET /gists/starred",
        "GET /gists/{gist_id}/comments",
        "GET /gists/{gist_id}/commits",
        "GET /gists/{gist_id}/forks",
        "GET /installation/repositories",
        "GET /issues",
        "GET /licenses",
        "GET /marketplace_listing/plans",
        "GET /marketplace_listing/plans/{plan_id}/accounts",
        "GET /marketplace_listing/stubbed/plans",
        "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
        "GET /networks/{owner}/{repo}/events",
        "GET /notifications",
        "GET /organizations",
        "GET /orgs/{org}/actions/cache/usage-by-repository",
        "GET /orgs/{org}/actions/permissions/repositories",
        "GET /orgs/{org}/actions/required_workflows",
        "GET /orgs/{org}/actions/runner-groups",
        "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories",
        "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners",
        "GET /orgs/{org}/actions/runners",
        "GET /orgs/{org}/actions/secrets",
        "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/actions/variables",
        "GET /orgs/{org}/actions/variables/{name}/repositories",
        "GET /orgs/{org}/blocks",
        "GET /orgs/{org}/code-scanning/alerts",
        "GET /orgs/{org}/codespaces",
        "GET /orgs/{org}/codespaces/secrets",
        "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/dependabot/alerts",
        "GET /orgs/{org}/dependabot/secrets",
        "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/events",
        "GET /orgs/{org}/failed_invitations",
        "GET /orgs/{org}/hooks",
        "GET /orgs/{org}/hooks/{hook_id}/deliveries",
        "GET /orgs/{org}/installations",
        "GET /orgs/{org}/invitations",
        "GET /orgs/{org}/invitations/{invitation_id}/teams",
        "GET /orgs/{org}/issues",
        "GET /orgs/{org}/members",
        "GET /orgs/{org}/members/{username}/codespaces",
        "GET /orgs/{org}/migrations",
        "GET /orgs/{org}/migrations/{migration_id}/repositories",
        "GET /orgs/{org}/outside_collaborators",
        "GET /orgs/{org}/packages",
        "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
        "GET /orgs/{org}/projects",
        "GET /orgs/{org}/public_members",
        "GET /orgs/{org}/repos",
        "GET /orgs/{org}/secret-scanning/alerts",
        "GET /orgs/{org}/teams",
        "GET /orgs/{org}/teams/{team_slug}/discussions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/invitations",
        "GET /orgs/{org}/teams/{team_slug}/members",
        "GET /orgs/{org}/teams/{team_slug}/projects",
        "GET /orgs/{org}/teams/{team_slug}/repos",
        "GET /orgs/{org}/teams/{team_slug}/teams",
        "GET /projects/columns/{column_id}/cards",
        "GET /projects/{project_id}/collaborators",
        "GET /projects/{project_id}/columns",
        "GET /repos/{org}/{repo}/actions/required_workflows",
        "GET /repos/{owner}/{repo}/actions/artifacts",
        "GET /repos/{owner}/{repo}/actions/caches",
        "GET /repos/{owner}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/runs",
        "GET /repos/{owner}/{repo}/actions/runners",
        "GET /repos/{owner}/{repo}/actions/runs",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
        "GET /repos/{owner}/{repo}/actions/secrets",
        "GET /repos/{owner}/{repo}/actions/variables",
        "GET /repos/{owner}/{repo}/actions/workflows",
        "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
        "GET /repos/{owner}/{repo}/assignees",
        "GET /repos/{owner}/{repo}/branches",
        "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
        "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
        "GET /repos/{owner}/{repo}/code-scanning/alerts",
        "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
        "GET /repos/{owner}/{repo}/code-scanning/analyses",
        "GET /repos/{owner}/{repo}/codespaces",
        "GET /repos/{owner}/{repo}/codespaces/devcontainers",
        "GET /repos/{owner}/{repo}/codespaces/secrets",
        "GET /repos/{owner}/{repo}/collaborators",
        "GET /repos/{owner}/{repo}/comments",
        "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/commits",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-suites",
        "GET /repos/{owner}/{repo}/commits/{ref}/status",
        "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
        "GET /repos/{owner}/{repo}/contributors",
        "GET /repos/{owner}/{repo}/dependabot/alerts",
        "GET /repos/{owner}/{repo}/dependabot/secrets",
        "GET /repos/{owner}/{repo}/deployments",
        "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
        "GET /repos/{owner}/{repo}/environments",
        "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
        "GET /repos/{owner}/{repo}/events",
        "GET /repos/{owner}/{repo}/forks",
        "GET /repos/{owner}/{repo}/hooks",
        "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
        "GET /repos/{owner}/{repo}/invitations",
        "GET /repos/{owner}/{repo}/issues",
        "GET /repos/{owner}/{repo}/issues/comments",
        "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/issues/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
        "GET /repos/{owner}/{repo}/keys",
        "GET /repos/{owner}/{repo}/labels",
        "GET /repos/{owner}/{repo}/milestones",
        "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
        "GET /repos/{owner}/{repo}/notifications",
        "GET /repos/{owner}/{repo}/pages/builds",
        "GET /repos/{owner}/{repo}/projects",
        "GET /repos/{owner}/{repo}/pulls",
        "GET /repos/{owner}/{repo}/pulls/comments",
        "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
        "GET /repos/{owner}/{repo}/releases",
        "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
        "GET /repos/{owner}/{repo}/releases/{release_id}/reactions",
        "GET /repos/{owner}/{repo}/secret-scanning/alerts",
        "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
        "GET /repos/{owner}/{repo}/stargazers",
        "GET /repos/{owner}/{repo}/subscribers",
        "GET /repos/{owner}/{repo}/tags",
        "GET /repos/{owner}/{repo}/teams",
        "GET /repos/{owner}/{repo}/topics",
        "GET /repositories",
        "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
        "GET /repositories/{repository_id}/environments/{environment_name}/variables",
        "GET /search/code",
        "GET /search/commits",
        "GET /search/issues",
        "GET /search/labels",
        "GET /search/repositories",
        "GET /search/topics",
        "GET /search/users",
        "GET /teams/{team_id}/discussions",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /teams/{team_id}/discussions/{discussion_number}/reactions",
        "GET /teams/{team_id}/invitations",
        "GET /teams/{team_id}/members",
        "GET /teams/{team_id}/projects",
        "GET /teams/{team_id}/repos",
        "GET /teams/{team_id}/teams",
        "GET /user/blocks",
        "GET /user/codespaces",
        "GET /user/codespaces/secrets",
        "GET /user/emails",
        "GET /user/followers",
        "GET /user/following",
        "GET /user/gpg_keys",
        "GET /user/installations",
        "GET /user/installations/{installation_id}/repositories",
        "GET /user/issues",
        "GET /user/keys",
        "GET /user/marketplace_purchases",
        "GET /user/marketplace_purchases/stubbed",
        "GET /user/memberships/orgs",
        "GET /user/migrations",
        "GET /user/migrations/{migration_id}/repositories",
        "GET /user/orgs",
        "GET /user/packages",
        "GET /user/packages/{package_type}/{package_name}/versions",
        "GET /user/public_emails",
        "GET /user/repos",
        "GET /user/repository_invitations",
        "GET /user/ssh_signing_keys",
        "GET /user/starred",
        "GET /user/subscriptions",
        "GET /user/teams",
        "GET /users",
        "GET /users/{username}/events",
        "GET /users/{username}/events/orgs/{org}",
        "GET /users/{username}/events/public",
        "GET /users/{username}/followers",
        "GET /users/{username}/following",
        "GET /users/{username}/gists",
        "GET /users/{username}/gpg_keys",
        "GET /users/{username}/keys",
        "GET /users/{username}/orgs",
        "GET /users/{username}/packages",
        "GET /users/{username}/projects",
        "GET /users/{username}/received_events",
        "GET /users/{username}/received_events/public",
        "GET /users/{username}/repos",
        "GET /users/{username}/ssh_signing_keys",
        "GET /users/{username}/starred",
        "GET /users/{username}/subscriptions",
    ];

    function isPaginatingEndpoint(arg) {
        if (typeof arg === "string") {
            return paginatingEndpoints.includes(arg);
        }
        else {
            return false;
        }
    }

    /**
     * @param octokit Octokit instance
     * @param options Options passed to Octokit constructor
     */
    function paginateRest(octokit) {
        return {
            paginate: Object.assign(paginate.bind(null, octokit), {
                iterator: iterator$1.bind(null, octokit),
            }),
        };
    }
    paginateRest.VERSION = VERSION$b;

    var distWeb$6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        composePaginateRest: composePaginateRest,
        isPaginatingEndpoint: isPaginatingEndpoint,
        paginateRest: paginateRest,
        paginatingEndpoints: paginatingEndpoints
    });

    const Endpoints = {
        actions: {
            addCustomLabelsToSelfHostedRunnerForOrg: [
                "POST /orgs/{org}/actions/runners/{runner_id}/labels",
            ],
            addCustomLabelsToSelfHostedRunnerForRepo: [
                "POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
            ],
            addSelectedRepoToOrgSecret: [
                "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
            ],
            addSelectedRepoToOrgVariable: [
                "PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
            ],
            addSelectedRepoToRequiredWorkflow: [
                "PUT /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories/{repository_id}",
            ],
            approveWorkflowRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve",
            ],
            cancelWorkflowRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
            ],
            createEnvironmentVariable: [
                "POST /repositories/{repository_id}/environments/{environment_name}/variables",
            ],
            createOrUpdateEnvironmentSecret: [
                "PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
            createOrUpdateRepoSecret: [
                "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
            ],
            createOrgVariable: ["POST /orgs/{org}/actions/variables"],
            createRegistrationTokenForOrg: [
                "POST /orgs/{org}/actions/runners/registration-token",
            ],
            createRegistrationTokenForRepo: [
                "POST /repos/{owner}/{repo}/actions/runners/registration-token",
            ],
            createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
            createRemoveTokenForRepo: [
                "POST /repos/{owner}/{repo}/actions/runners/remove-token",
            ],
            createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
            createRequiredWorkflow: ["POST /orgs/{org}/actions/required_workflows"],
            createWorkflowDispatch: [
                "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
            ],
            deleteActionsCacheById: [
                "DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}",
            ],
            deleteActionsCacheByKey: [
                "DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}",
            ],
            deleteArtifact: [
                "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
            ],
            deleteEnvironmentSecret: [
                "DELETE /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            deleteEnvironmentVariable: [
                "DELETE /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
            ],
            deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
            deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
            deleteRepoSecret: [
                "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}",
            ],
            deleteRepoVariable: [
                "DELETE /repos/{owner}/{repo}/actions/variables/{name}",
            ],
            deleteRequiredWorkflow: [
                "DELETE /orgs/{org}/actions/required_workflows/{required_workflow_id}",
            ],
            deleteSelfHostedRunnerFromOrg: [
                "DELETE /orgs/{org}/actions/runners/{runner_id}",
            ],
            deleteSelfHostedRunnerFromRepo: [
                "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}",
            ],
            deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
            deleteWorkflowRunLogs: [
                "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
            ],
            disableSelectedRepositoryGithubActionsOrganization: [
                "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}",
            ],
            disableWorkflow: [
                "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable",
            ],
            downloadArtifact: [
                "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
            ],
            downloadJobLogsForWorkflowRun: [
                "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
            ],
            downloadWorkflowRunAttemptLogs: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs",
            ],
            downloadWorkflowRunLogs: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
            ],
            enableSelectedRepositoryGithubActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}",
            ],
            enableWorkflow: [
                "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable",
            ],
            getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
            getActionsCacheUsage: ["GET /repos/{owner}/{repo}/actions/cache/usage"],
            getActionsCacheUsageByRepoForOrg: [
                "GET /orgs/{org}/actions/cache/usage-by-repository",
            ],
            getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
            getAllowedActionsOrganization: [
                "GET /orgs/{org}/actions/permissions/selected-actions",
            ],
            getAllowedActionsRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions/selected-actions",
            ],
            getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
            getEnvironmentPublicKey: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key",
            ],
            getEnvironmentSecret: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            getEnvironmentVariable: [
                "GET /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
            ],
            getGithubActionsDefaultWorkflowPermissionsOrganization: [
                "GET /orgs/{org}/actions/permissions/workflow",
            ],
            getGithubActionsDefaultWorkflowPermissionsRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions/workflow",
            ],
            getGithubActionsPermissionsOrganization: [
                "GET /orgs/{org}/actions/permissions",
            ],
            getGithubActionsPermissionsRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions",
            ],
            getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
            getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
            getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
            getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
            getPendingDeploymentsForRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
            ],
            getRepoPermissions: [
                "GET /repos/{owner}/{repo}/actions/permissions",
                {},
                { renamed: ["actions", "getGithubActionsPermissionsRepository"] },
            ],
            getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
            getRepoRequiredWorkflow: [
                "GET /repos/{org}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}",
            ],
            getRepoRequiredWorkflowUsage: [
                "GET /repos/{org}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/timing",
            ],
            getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
            getRepoVariable: ["GET /repos/{owner}/{repo}/actions/variables/{name}"],
            getRequiredWorkflow: [
                "GET /orgs/{org}/actions/required_workflows/{required_workflow_id}",
            ],
            getReviewsForRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
            ],
            getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
            getSelfHostedRunnerForRepo: [
                "GET /repos/{owner}/{repo}/actions/runners/{runner_id}",
            ],
            getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
            getWorkflowAccessToRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions/access",
            ],
            getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
            getWorkflowRunAttempt: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}",
            ],
            getWorkflowRunUsage: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing",
            ],
            getWorkflowUsage: [
                "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing",
            ],
            listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
            listEnvironmentSecrets: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
            ],
            listEnvironmentVariables: [
                "GET /repositories/{repository_id}/environments/{environment_name}/variables",
            ],
            listJobsForWorkflowRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
            ],
            listJobsForWorkflowRunAttempt: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
            ],
            listLabelsForSelfHostedRunnerForOrg: [
                "GET /orgs/{org}/actions/runners/{runner_id}/labels",
            ],
            listLabelsForSelfHostedRunnerForRepo: [
                "GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
            ],
            listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
            listOrgVariables: ["GET /orgs/{org}/actions/variables"],
            listRepoRequiredWorkflows: [
                "GET /repos/{org}/{repo}/actions/required_workflows",
            ],
            listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
            listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
            listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
            listRequiredWorkflowRuns: [
                "GET /repos/{owner}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/runs",
            ],
            listRequiredWorkflows: ["GET /orgs/{org}/actions/required_workflows"],
            listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
            listRunnerApplicationsForRepo: [
                "GET /repos/{owner}/{repo}/actions/runners/downloads",
            ],
            listSelectedReposForOrgSecret: [
                "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
            ],
            listSelectedReposForOrgVariable: [
                "GET /orgs/{org}/actions/variables/{name}/repositories",
            ],
            listSelectedRepositoriesEnabledGithubActionsOrganization: [
                "GET /orgs/{org}/actions/permissions/repositories",
            ],
            listSelectedRepositoriesRequiredWorkflow: [
                "GET /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories",
            ],
            listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
            listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
            listWorkflowRunArtifacts: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
            ],
            listWorkflowRuns: [
                "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
            ],
            listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
            reRunJobForWorkflowRun: [
                "POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun",
            ],
            reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
            reRunWorkflowFailedJobs: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs",
            ],
            removeAllCustomLabelsFromSelfHostedRunnerForOrg: [
                "DELETE /orgs/{org}/actions/runners/{runner_id}/labels",
            ],
            removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
                "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
            ],
            removeCustomLabelFromSelfHostedRunnerForOrg: [
                "DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}",
            ],
            removeCustomLabelFromSelfHostedRunnerForRepo: [
                "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}",
            ],
            removeSelectedRepoFromOrgSecret: [
                "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
            ],
            removeSelectedRepoFromOrgVariable: [
                "DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
            ],
            removeSelectedRepoFromRequiredWorkflow: [
                "DELETE /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories/{repository_id}",
            ],
            reviewPendingDeploymentsForRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
            ],
            setAllowedActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/selected-actions",
            ],
            setAllowedActionsRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions",
            ],
            setCustomLabelsForSelfHostedRunnerForOrg: [
                "PUT /orgs/{org}/actions/runners/{runner_id}/labels",
            ],
            setCustomLabelsForSelfHostedRunnerForRepo: [
                "PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
            ],
            setGithubActionsDefaultWorkflowPermissionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/workflow",
            ],
            setGithubActionsDefaultWorkflowPermissionsRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions/workflow",
            ],
            setGithubActionsPermissionsOrganization: [
                "PUT /orgs/{org}/actions/permissions",
            ],
            setGithubActionsPermissionsRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions",
            ],
            setSelectedReposForOrgSecret: [
                "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories",
            ],
            setSelectedReposForOrgVariable: [
                "PUT /orgs/{org}/actions/variables/{name}/repositories",
            ],
            setSelectedReposToRequiredWorkflow: [
                "PUT /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories",
            ],
            setSelectedRepositoriesEnabledGithubActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/repositories",
            ],
            setWorkflowAccessToRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions/access",
            ],
            updateEnvironmentVariable: [
                "PATCH /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
            ],
            updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
            updateRepoVariable: [
                "PATCH /repos/{owner}/{repo}/actions/variables/{name}",
            ],
            updateRequiredWorkflow: [
                "PATCH /orgs/{org}/actions/required_workflows/{required_workflow_id}",
            ],
        },
        activity: {
            checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
            deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
            deleteThreadSubscription: [
                "DELETE /notifications/threads/{thread_id}/subscription",
            ],
            getFeeds: ["GET /feeds"],
            getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
            getThread: ["GET /notifications/threads/{thread_id}"],
            getThreadSubscriptionForAuthenticatedUser: [
                "GET /notifications/threads/{thread_id}/subscription",
            ],
            listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
            listNotificationsForAuthenticatedUser: ["GET /notifications"],
            listOrgEventsForAuthenticatedUser: [
                "GET /users/{username}/events/orgs/{org}",
            ],
            listPublicEvents: ["GET /events"],
            listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
            listPublicEventsForUser: ["GET /users/{username}/events/public"],
            listPublicOrgEvents: ["GET /orgs/{org}/events"],
            listReceivedEventsForUser: ["GET /users/{username}/received_events"],
            listReceivedPublicEventsForUser: [
                "GET /users/{username}/received_events/public",
            ],
            listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
            listRepoNotificationsForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/notifications",
            ],
            listReposStarredByAuthenticatedUser: ["GET /user/starred"],
            listReposStarredByUser: ["GET /users/{username}/starred"],
            listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
            listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
            listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
            listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
            markNotificationsAsRead: ["PUT /notifications"],
            markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
            markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
            setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
            setThreadSubscription: [
                "PUT /notifications/threads/{thread_id}/subscription",
            ],
            starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
            unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"],
        },
        apps: {
            addRepoToInstallation: [
                "PUT /user/installations/{installation_id}/repositories/{repository_id}",
                {},
                { renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] },
            ],
            addRepoToInstallationForAuthenticatedUser: [
                "PUT /user/installations/{installation_id}/repositories/{repository_id}",
            ],
            checkToken: ["POST /applications/{client_id}/token"],
            createFromManifest: ["POST /app-manifests/{code}/conversions"],
            createInstallationAccessToken: [
                "POST /app/installations/{installation_id}/access_tokens",
            ],
            deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
            deleteInstallation: ["DELETE /app/installations/{installation_id}"],
            deleteToken: ["DELETE /applications/{client_id}/token"],
            getAuthenticated: ["GET /app"],
            getBySlug: ["GET /apps/{app_slug}"],
            getInstallation: ["GET /app/installations/{installation_id}"],
            getOrgInstallation: ["GET /orgs/{org}/installation"],
            getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
            getSubscriptionPlanForAccount: [
                "GET /marketplace_listing/accounts/{account_id}",
            ],
            getSubscriptionPlanForAccountStubbed: [
                "GET /marketplace_listing/stubbed/accounts/{account_id}",
            ],
            getUserInstallation: ["GET /users/{username}/installation"],
            getWebhookConfigForApp: ["GET /app/hook/config"],
            getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
            listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
            listAccountsForPlanStubbed: [
                "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
            ],
            listInstallationReposForAuthenticatedUser: [
                "GET /user/installations/{installation_id}/repositories",
            ],
            listInstallations: ["GET /app/installations"],
            listInstallationsForAuthenticatedUser: ["GET /user/installations"],
            listPlans: ["GET /marketplace_listing/plans"],
            listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
            listReposAccessibleToInstallation: ["GET /installation/repositories"],
            listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
            listSubscriptionsForAuthenticatedUserStubbed: [
                "GET /user/marketplace_purchases/stubbed",
            ],
            listWebhookDeliveries: ["GET /app/hook/deliveries"],
            redeliverWebhookDelivery: [
                "POST /app/hook/deliveries/{delivery_id}/attempts",
            ],
            removeRepoFromInstallation: [
                "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
                {},
                { renamed: ["apps", "removeRepoFromInstallationForAuthenticatedUser"] },
            ],
            removeRepoFromInstallationForAuthenticatedUser: [
                "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
            ],
            resetToken: ["PATCH /applications/{client_id}/token"],
            revokeInstallationAccessToken: ["DELETE /installation/token"],
            scopeToken: ["POST /applications/{client_id}/token/scoped"],
            suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
            unsuspendInstallation: [
                "DELETE /app/installations/{installation_id}/suspended",
            ],
            updateWebhookConfigForApp: ["PATCH /app/hook/config"],
        },
        billing: {
            getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
            getGithubActionsBillingUser: [
                "GET /users/{username}/settings/billing/actions",
            ],
            getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
            getGithubPackagesBillingUser: [
                "GET /users/{username}/settings/billing/packages",
            ],
            getSharedStorageBillingOrg: [
                "GET /orgs/{org}/settings/billing/shared-storage",
            ],
            getSharedStorageBillingUser: [
                "GET /users/{username}/settings/billing/shared-storage",
            ],
        },
        checks: {
            create: ["POST /repos/{owner}/{repo}/check-runs"],
            createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
            get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
            getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
            listAnnotations: [
                "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
            ],
            listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
            listForSuite: [
                "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
            ],
            listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
            rerequestRun: [
                "POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest",
            ],
            rerequestSuite: [
                "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest",
            ],
            setSuitesPreferences: [
                "PATCH /repos/{owner}/{repo}/check-suites/preferences",
            ],
            update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"],
        },
        codeScanning: {
            deleteAnalysis: [
                "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}",
            ],
            getAlert: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
                {},
                { renamedParameters: { alert_id: "alert_number" } },
            ],
            getAnalysis: [
                "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}",
            ],
            getCodeqlDatabase: [
                "GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}",
            ],
            getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
            listAlertInstances: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
            ],
            listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
            listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
            listAlertsInstances: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
                {},
                { renamed: ["codeScanning", "listAlertInstances"] },
            ],
            listCodeqlDatabases: [
                "GET /repos/{owner}/{repo}/code-scanning/codeql/databases",
            ],
            listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
            updateAlert: [
                "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
            ],
            uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"],
        },
        codesOfConduct: {
            getAllCodesOfConduct: ["GET /codes_of_conduct"],
            getConductCode: ["GET /codes_of_conduct/{key}"],
        },
        codespaces: {
            addRepositoryForSecretForAuthenticatedUser: [
                "PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
            ],
            addSelectedRepoToOrgSecret: [
                "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
            ],
            codespaceMachinesForAuthenticatedUser: [
                "GET /user/codespaces/{codespace_name}/machines",
            ],
            createForAuthenticatedUser: ["POST /user/codespaces"],
            createOrUpdateOrgSecret: [
                "PUT /orgs/{org}/codespaces/secrets/{secret_name}",
            ],
            createOrUpdateRepoSecret: [
                "PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
            ],
            createOrUpdateSecretForAuthenticatedUser: [
                "PUT /user/codespaces/secrets/{secret_name}",
            ],
            createWithPrForAuthenticatedUser: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces",
            ],
            createWithRepoForAuthenticatedUser: [
                "POST /repos/{owner}/{repo}/codespaces",
            ],
            deleteForAuthenticatedUser: ["DELETE /user/codespaces/{codespace_name}"],
            deleteFromOrganization: [
                "DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}",
            ],
            deleteOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}"],
            deleteRepoSecret: [
                "DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
            ],
            deleteSecretForAuthenticatedUser: [
                "DELETE /user/codespaces/secrets/{secret_name}",
            ],
            exportForAuthenticatedUser: [
                "POST /user/codespaces/{codespace_name}/exports",
            ],
            getCodespacesForUserInOrg: [
                "GET /orgs/{org}/members/{username}/codespaces",
            ],
            getExportDetailsForAuthenticatedUser: [
                "GET /user/codespaces/{codespace_name}/exports/{export_id}",
            ],
            getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
            getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
            getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
            getPublicKeyForAuthenticatedUser: [
                "GET /user/codespaces/secrets/public-key",
            ],
            getRepoPublicKey: [
                "GET /repos/{owner}/{repo}/codespaces/secrets/public-key",
            ],
            getRepoSecret: [
                "GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
            ],
            getSecretForAuthenticatedUser: [
                "GET /user/codespaces/secrets/{secret_name}",
            ],
            listDevcontainersInRepositoryForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/codespaces/devcontainers",
            ],
            listForAuthenticatedUser: ["GET /user/codespaces"],
            listInOrganization: [
                "GET /orgs/{org}/codespaces",
                {},
                { renamedParameters: { org_id: "org" } },
            ],
            listInRepositoryForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/codespaces",
            ],
            listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
            listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
            listRepositoriesForSecretForAuthenticatedUser: [
                "GET /user/codespaces/secrets/{secret_name}/repositories",
            ],
            listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
            listSelectedReposForOrgSecret: [
                "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
            ],
            preFlightWithRepoForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/codespaces/new",
            ],
            publishForAuthenticatedUser: [
                "POST /user/codespaces/{codespace_name}/publish",
            ],
            removeRepositoryForSecretForAuthenticatedUser: [
                "DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
            ],
            removeSelectedRepoFromOrgSecret: [
                "DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
            ],
            repoMachinesForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/codespaces/machines",
            ],
            setCodespacesBilling: ["PUT /orgs/{org}/codespaces/billing"],
            setRepositoriesForSecretForAuthenticatedUser: [
                "PUT /user/codespaces/secrets/{secret_name}/repositories",
            ],
            setSelectedReposForOrgSecret: [
                "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
            ],
            startForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/start"],
            stopForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/stop"],
            stopInOrganization: [
                "POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop",
            ],
            updateForAuthenticatedUser: ["PATCH /user/codespaces/{codespace_name}"],
        },
        dependabot: {
            addSelectedRepoToOrgSecret: [
                "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
            ],
            createOrUpdateOrgSecret: [
                "PUT /orgs/{org}/dependabot/secrets/{secret_name}",
            ],
            createOrUpdateRepoSecret: [
                "PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
            ],
            deleteOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}"],
            deleteRepoSecret: [
                "DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
            ],
            getAlert: ["GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
            getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
            getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
            getRepoPublicKey: [
                "GET /repos/{owner}/{repo}/dependabot/secrets/public-key",
            ],
            getRepoSecret: [
                "GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
            ],
            listAlertsForEnterprise: [
                "GET /enterprises/{enterprise}/dependabot/alerts",
            ],
            listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
            listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
            listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
            listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
            listSelectedReposForOrgSecret: [
                "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
            ],
            removeSelectedRepoFromOrgSecret: [
                "DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
            ],
            setSelectedReposForOrgSecret: [
                "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
            ],
            updateAlert: [
                "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
            ],
        },
        dependencyGraph: {
            createRepositorySnapshot: [
                "POST /repos/{owner}/{repo}/dependency-graph/snapshots",
            ],
            diffRange: [
                "GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}",
            ],
        },
        emojis: { get: ["GET /emojis"] },
        enterpriseAdmin: {
            addCustomLabelsToSelfHostedRunnerForEnterprise: [
                "POST /enterprises/{enterprise}/actions/runners/{runner_id}/labels",
            ],
            enableSelectedOrganizationGithubActionsEnterprise: [
                "PUT /enterprises/{enterprise}/actions/permissions/organizations/{org_id}",
            ],
            listLabelsForSelfHostedRunnerForEnterprise: [
                "GET /enterprises/{enterprise}/actions/runners/{runner_id}/labels",
            ],
        },
        gists: {
            checkIsStarred: ["GET /gists/{gist_id}/star"],
            create: ["POST /gists"],
            createComment: ["POST /gists/{gist_id}/comments"],
            delete: ["DELETE /gists/{gist_id}"],
            deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
            fork: ["POST /gists/{gist_id}/forks"],
            get: ["GET /gists/{gist_id}"],
            getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
            getRevision: ["GET /gists/{gist_id}/{sha}"],
            list: ["GET /gists"],
            listComments: ["GET /gists/{gist_id}/comments"],
            listCommits: ["GET /gists/{gist_id}/commits"],
            listForUser: ["GET /users/{username}/gists"],
            listForks: ["GET /gists/{gist_id}/forks"],
            listPublic: ["GET /gists/public"],
            listStarred: ["GET /gists/starred"],
            star: ["PUT /gists/{gist_id}/star"],
            unstar: ["DELETE /gists/{gist_id}/star"],
            update: ["PATCH /gists/{gist_id}"],
            updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"],
        },
        git: {
            createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
            createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
            createRef: ["POST /repos/{owner}/{repo}/git/refs"],
            createTag: ["POST /repos/{owner}/{repo}/git/tags"],
            createTree: ["POST /repos/{owner}/{repo}/git/trees"],
            deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
            getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
            getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
            getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
            getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
            getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
            listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
            updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"],
        },
        gitignore: {
            getAllTemplates: ["GET /gitignore/templates"],
            getTemplate: ["GET /gitignore/templates/{name}"],
        },
        interactions: {
            getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
            getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
            getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
            getRestrictionsForYourPublicRepos: [
                "GET /user/interaction-limits",
                {},
                { renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] },
            ],
            removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
            removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
            removeRestrictionsForRepo: [
                "DELETE /repos/{owner}/{repo}/interaction-limits",
            ],
            removeRestrictionsForYourPublicRepos: [
                "DELETE /user/interaction-limits",
                {},
                { renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] },
            ],
            setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
            setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
            setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
            setRestrictionsForYourPublicRepos: [
                "PUT /user/interaction-limits",
                {},
                { renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] },
            ],
        },
        issues: {
            addAssignees: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees",
            ],
            addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
            checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
            checkUserCanBeAssignedToIssue: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}",
            ],
            create: ["POST /repos/{owner}/{repo}/issues"],
            createComment: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
            ],
            createLabel: ["POST /repos/{owner}/{repo}/labels"],
            createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
            deleteComment: [
                "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}",
            ],
            deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
            deleteMilestone: [
                "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}",
            ],
            get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
            getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
            getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
            getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
            getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
            list: ["GET /issues"],
            listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
            listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
            listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
            listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
            listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
            listEventsForTimeline: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
            ],
            listForAuthenticatedUser: ["GET /user/issues"],
            listForOrg: ["GET /orgs/{org}/issues"],
            listForRepo: ["GET /repos/{owner}/{repo}/issues"],
            listLabelsForMilestone: [
                "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
            ],
            listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
            listLabelsOnIssue: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
            ],
            listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
            lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
            removeAllLabels: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels",
            ],
            removeAssignees: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees",
            ],
            removeLabel: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
            ],
            setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
            unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
            update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
            updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
            updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
            updateMilestone: [
                "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}",
            ],
        },
        licenses: {
            get: ["GET /licenses/{license}"],
            getAllCommonlyUsed: ["GET /licenses"],
            getForRepo: ["GET /repos/{owner}/{repo}/license"],
        },
        markdown: {
            render: ["POST /markdown"],
            renderRaw: [
                "POST /markdown/raw",
                { headers: { "content-type": "text/plain; charset=utf-8" } },
            ],
        },
        meta: {
            get: ["GET /meta"],
            getAllVersions: ["GET /versions"],
            getOctocat: ["GET /octocat"],
            getZen: ["GET /zen"],
            root: ["GET /"],
        },
        migrations: {
            cancelImport: ["DELETE /repos/{owner}/{repo}/import"],
            deleteArchiveForAuthenticatedUser: [
                "DELETE /user/migrations/{migration_id}/archive",
            ],
            deleteArchiveForOrg: [
                "DELETE /orgs/{org}/migrations/{migration_id}/archive",
            ],
            downloadArchiveForOrg: [
                "GET /orgs/{org}/migrations/{migration_id}/archive",
            ],
            getArchiveForAuthenticatedUser: [
                "GET /user/migrations/{migration_id}/archive",
            ],
            getCommitAuthors: ["GET /repos/{owner}/{repo}/import/authors"],
            getImportStatus: ["GET /repos/{owner}/{repo}/import"],
            getLargeFiles: ["GET /repos/{owner}/{repo}/import/large_files"],
            getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}"],
            getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
            listForAuthenticatedUser: ["GET /user/migrations"],
            listForOrg: ["GET /orgs/{org}/migrations"],
            listReposForAuthenticatedUser: [
                "GET /user/migrations/{migration_id}/repositories",
            ],
            listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories"],
            listReposForUser: [
                "GET /user/migrations/{migration_id}/repositories",
                {},
                { renamed: ["migrations", "listReposForAuthenticatedUser"] },
            ],
            mapCommitAuthor: ["PATCH /repos/{owner}/{repo}/import/authors/{author_id}"],
            setLfsPreference: ["PATCH /repos/{owner}/{repo}/import/lfs"],
            startForAuthenticatedUser: ["POST /user/migrations"],
            startForOrg: ["POST /orgs/{org}/migrations"],
            startImport: ["PUT /repos/{owner}/{repo}/import"],
            unlockRepoForAuthenticatedUser: [
                "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock",
            ],
            unlockRepoForOrg: [
                "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
            ],
            updateImport: ["PATCH /repos/{owner}/{repo}/import"],
        },
        orgs: {
            addSecurityManagerTeam: [
                "PUT /orgs/{org}/security-managers/teams/{team_slug}",
            ],
            blockUser: ["PUT /orgs/{org}/blocks/{username}"],
            cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
            checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
            checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
            checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
            convertMemberToOutsideCollaborator: [
                "PUT /orgs/{org}/outside_collaborators/{username}",
            ],
            createInvitation: ["POST /orgs/{org}/invitations"],
            createWebhook: ["POST /orgs/{org}/hooks"],
            deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
            enableOrDisableSecurityProductOnAllOrgRepos: [
                "POST /orgs/{org}/{security_product}/{enablement}",
            ],
            get: ["GET /orgs/{org}"],
            getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
            getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
            getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
            getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
            getWebhookDelivery: [
                "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}",
            ],
            list: ["GET /organizations"],
            listAppInstallations: ["GET /orgs/{org}/installations"],
            listBlockedUsers: ["GET /orgs/{org}/blocks"],
            listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
            listForAuthenticatedUser: ["GET /user/orgs"],
            listForUser: ["GET /users/{username}/orgs"],
            listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
            listMembers: ["GET /orgs/{org}/members"],
            listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
            listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
            listPendingInvitations: ["GET /orgs/{org}/invitations"],
            listPublicMembers: ["GET /orgs/{org}/public_members"],
            listSecurityManagerTeams: ["GET /orgs/{org}/security-managers"],
            listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
            listWebhooks: ["GET /orgs/{org}/hooks"],
            pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
            redeliverWebhookDelivery: [
                "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
            ],
            removeMember: ["DELETE /orgs/{org}/members/{username}"],
            removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
            removeOutsideCollaborator: [
                "DELETE /orgs/{org}/outside_collaborators/{username}",
            ],
            removePublicMembershipForAuthenticatedUser: [
                "DELETE /orgs/{org}/public_members/{username}",
            ],
            removeSecurityManagerTeam: [
                "DELETE /orgs/{org}/security-managers/teams/{team_slug}",
            ],
            setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
            setPublicMembershipForAuthenticatedUser: [
                "PUT /orgs/{org}/public_members/{username}",
            ],
            unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
            update: ["PATCH /orgs/{org}"],
            updateMembershipForAuthenticatedUser: [
                "PATCH /user/memberships/orgs/{org}",
            ],
            updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
            updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"],
        },
        packages: {
            deletePackageForAuthenticatedUser: [
                "DELETE /user/packages/{package_type}/{package_name}",
            ],
            deletePackageForOrg: [
                "DELETE /orgs/{org}/packages/{package_type}/{package_name}",
            ],
            deletePackageForUser: [
                "DELETE /users/{username}/packages/{package_type}/{package_name}",
            ],
            deletePackageVersionForAuthenticatedUser: [
                "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            deletePackageVersionForOrg: [
                "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            deletePackageVersionForUser: [
                "DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getAllPackageVersionsForAPackageOwnedByAnOrg: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
                {},
                { renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] },
            ],
            getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions",
                {},
                {
                    renamed: [
                        "packages",
                        "getAllPackageVersionsForPackageOwnedByAuthenticatedUser",
                    ],
                },
            ],
            getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions",
            ],
            getAllPackageVersionsForPackageOwnedByOrg: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
            ],
            getAllPackageVersionsForPackageOwnedByUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}/versions",
            ],
            getPackageForAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}",
            ],
            getPackageForOrganization: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}",
            ],
            getPackageForUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}",
            ],
            getPackageVersionForAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getPackageVersionForOrganization: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getPackageVersionForUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            listPackagesForAuthenticatedUser: ["GET /user/packages"],
            listPackagesForOrganization: ["GET /orgs/{org}/packages"],
            listPackagesForUser: ["GET /users/{username}/packages"],
            restorePackageForAuthenticatedUser: [
                "POST /user/packages/{package_type}/{package_name}/restore{?token}",
            ],
            restorePackageForOrg: [
                "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}",
            ],
            restorePackageForUser: [
                "POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}",
            ],
            restorePackageVersionForAuthenticatedUser: [
                "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
            ],
            restorePackageVersionForOrg: [
                "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
            ],
            restorePackageVersionForUser: [
                "POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
            ],
        },
        projects: {
            addCollaborator: ["PUT /projects/{project_id}/collaborators/{username}"],
            createCard: ["POST /projects/columns/{column_id}/cards"],
            createColumn: ["POST /projects/{project_id}/columns"],
            createForAuthenticatedUser: ["POST /user/projects"],
            createForOrg: ["POST /orgs/{org}/projects"],
            createForRepo: ["POST /repos/{owner}/{repo}/projects"],
            delete: ["DELETE /projects/{project_id}"],
            deleteCard: ["DELETE /projects/columns/cards/{card_id}"],
            deleteColumn: ["DELETE /projects/columns/{column_id}"],
            get: ["GET /projects/{project_id}"],
            getCard: ["GET /projects/columns/cards/{card_id}"],
            getColumn: ["GET /projects/columns/{column_id}"],
            getPermissionForUser: [
                "GET /projects/{project_id}/collaborators/{username}/permission",
            ],
            listCards: ["GET /projects/columns/{column_id}/cards"],
            listCollaborators: ["GET /projects/{project_id}/collaborators"],
            listColumns: ["GET /projects/{project_id}/columns"],
            listForOrg: ["GET /orgs/{org}/projects"],
            listForRepo: ["GET /repos/{owner}/{repo}/projects"],
            listForUser: ["GET /users/{username}/projects"],
            moveCard: ["POST /projects/columns/cards/{card_id}/moves"],
            moveColumn: ["POST /projects/columns/{column_id}/moves"],
            removeCollaborator: [
                "DELETE /projects/{project_id}/collaborators/{username}",
            ],
            update: ["PATCH /projects/{project_id}"],
            updateCard: ["PATCH /projects/columns/cards/{card_id}"],
            updateColumn: ["PATCH /projects/columns/{column_id}"],
        },
        pulls: {
            checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
            create: ["POST /repos/{owner}/{repo}/pulls"],
            createReplyForReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
            ],
            createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
            createReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
            ],
            deletePendingReview: [
                "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            deleteReviewComment: [
                "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}",
            ],
            dismissReview: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals",
            ],
            get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
            getReview: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
            list: ["GET /repos/{owner}/{repo}/pulls"],
            listCommentsForReview: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
            ],
            listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
            listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
            listRequestedReviewers: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            listReviewComments: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
            ],
            listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
            listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
            merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
            removeRequestedReviewers: [
                "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            requestReviewers: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            submitReview: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events",
            ],
            update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
            updateBranch: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
            ],
            updateReview: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            updateReviewComment: [
                "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}",
            ],
        },
        rateLimit: { get: ["GET /rate_limit"] },
        reactions: {
            createForCommitComment: [
                "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions",
            ],
            createForIssue: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions",
            ],
            createForIssueComment: [
                "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
            ],
            createForPullRequestReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
            ],
            createForRelease: [
                "POST /repos/{owner}/{repo}/releases/{release_id}/reactions",
            ],
            createForTeamDiscussionCommentInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
            ],
            createForTeamDiscussionInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
            ],
            deleteForCommitComment: [
                "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
            ],
            deleteForIssue: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
            ],
            deleteForIssueComment: [
                "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
            ],
            deleteForPullRequestComment: [
                "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
            ],
            deleteForRelease: [
                "DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}",
            ],
            deleteForTeamDiscussion: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
            ],
            deleteForTeamDiscussionComment: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
            ],
            listForCommitComment: [
                "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
            ],
            listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
            listForIssueComment: [
                "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
            ],
            listForPullRequestReviewComment: [
                "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
            ],
            listForRelease: [
                "GET /repos/{owner}/{repo}/releases/{release_id}/reactions",
            ],
            listForTeamDiscussionCommentInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
            ],
            listForTeamDiscussionInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
            ],
        },
        repos: {
            acceptInvitation: [
                "PATCH /user/repository_invitations/{invitation_id}",
                {},
                { renamed: ["repos", "acceptInvitationForAuthenticatedUser"] },
            ],
            acceptInvitationForAuthenticatedUser: [
                "PATCH /user/repository_invitations/{invitation_id}",
            ],
            addAppAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
            addStatusCheckContexts: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            addTeamAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            addUserAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
            checkVulnerabilityAlerts: [
                "GET /repos/{owner}/{repo}/vulnerability-alerts",
            ],
            codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
            compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
            compareCommitsWithBasehead: [
                "GET /repos/{owner}/{repo}/compare/{basehead}",
            ],
            createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
            createCommitComment: [
                "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments",
            ],
            createCommitSignatureProtection: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
            ],
            createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
            createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
            createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
            createDeploymentBranchPolicy: [
                "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
            ],
            createDeploymentStatus: [
                "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
            ],
            createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
            createForAuthenticatedUser: ["POST /user/repos"],
            createFork: ["POST /repos/{owner}/{repo}/forks"],
            createInOrg: ["POST /orgs/{org}/repos"],
            createOrUpdateEnvironment: [
                "PUT /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
            createPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployment"],
            createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
            createRelease: ["POST /repos/{owner}/{repo}/releases"],
            createTagProtection: ["POST /repos/{owner}/{repo}/tags/protection"],
            createUsingTemplate: [
                "POST /repos/{template_owner}/{template_repo}/generate",
            ],
            createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
            declineInvitation: [
                "DELETE /user/repository_invitations/{invitation_id}",
                {},
                { renamed: ["repos", "declineInvitationForAuthenticatedUser"] },
            ],
            declineInvitationForAuthenticatedUser: [
                "DELETE /user/repository_invitations/{invitation_id}",
            ],
            delete: ["DELETE /repos/{owner}/{repo}"],
            deleteAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
            ],
            deleteAdminBranchProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            deleteAnEnvironment: [
                "DELETE /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
            deleteBranchProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
            deleteCommitSignatureProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
            ],
            deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
            deleteDeployment: [
                "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}",
            ],
            deleteDeploymentBranchPolicy: [
                "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
            ],
            deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
            deleteInvitation: [
                "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}",
            ],
            deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
            deletePullRequestReviewProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
            deleteReleaseAsset: [
                "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}",
            ],
            deleteTagProtection: [
                "DELETE /repos/{owner}/{repo}/tags/protection/{tag_protection_id}",
            ],
            deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
            disableAutomatedSecurityFixes: [
                "DELETE /repos/{owner}/{repo}/automated-security-fixes",
            ],
            disableLfsForRepo: ["DELETE /repos/{owner}/{repo}/lfs"],
            disableVulnerabilityAlerts: [
                "DELETE /repos/{owner}/{repo}/vulnerability-alerts",
            ],
            downloadArchive: [
                "GET /repos/{owner}/{repo}/zipball/{ref}",
                {},
                { renamed: ["repos", "downloadZipballArchive"] },
            ],
            downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
            downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
            enableAutomatedSecurityFixes: [
                "PUT /repos/{owner}/{repo}/automated-security-fixes",
            ],
            enableLfsForRepo: ["PUT /repos/{owner}/{repo}/lfs"],
            enableVulnerabilityAlerts: [
                "PUT /repos/{owner}/{repo}/vulnerability-alerts",
            ],
            generateReleaseNotes: [
                "POST /repos/{owner}/{repo}/releases/generate-notes",
            ],
            get: ["GET /repos/{owner}/{repo}"],
            getAccessRestrictions: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
            ],
            getAdminBranchProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
            getAllStatusCheckContexts: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
            ],
            getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
            getAppsWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
            ],
            getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
            getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
            getBranchProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
            getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
            getCollaboratorPermissionLevel: [
                "GET /repos/{owner}/{repo}/collaborators/{username}/permission",
            ],
            getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
            getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
            getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
            getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
            getCommitSignatureProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
            ],
            getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
            getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
            getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
            getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
            getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
            getDeploymentBranchPolicy: [
                "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
            ],
            getDeploymentStatus: [
                "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}",
            ],
            getEnvironment: [
                "GET /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
            getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
            getPages: ["GET /repos/{owner}/{repo}/pages"],
            getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
            getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
            getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
            getPullRequestReviewProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
            getReadme: ["GET /repos/{owner}/{repo}/readme"],
            getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
            getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
            getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
            getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
            getStatusChecksProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            getTeamsWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
            ],
            getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
            getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
            getUsersWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
            ],
            getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
            getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
            getWebhookConfigForRepo: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/config",
            ],
            getWebhookDelivery: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}",
            ],
            listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
            listBranches: ["GET /repos/{owner}/{repo}/branches"],
            listBranchesForHeadCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
            ],
            listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
            listCommentsForCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
            ],
            listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
            listCommitStatusesForRef: [
                "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
            ],
            listCommits: ["GET /repos/{owner}/{repo}/commits"],
            listContributors: ["GET /repos/{owner}/{repo}/contributors"],
            listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
            listDeploymentBranchPolicies: [
                "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
            ],
            listDeploymentStatuses: [
                "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
            ],
            listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
            listForAuthenticatedUser: ["GET /user/repos"],
            listForOrg: ["GET /orgs/{org}/repos"],
            listForUser: ["GET /users/{username}/repos"],
            listForks: ["GET /repos/{owner}/{repo}/forks"],
            listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
            listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
            listLanguages: ["GET /repos/{owner}/{repo}/languages"],
            listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
            listPublic: ["GET /repositories"],
            listPullRequestsAssociatedWithCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
            ],
            listReleaseAssets: [
                "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
            ],
            listReleases: ["GET /repos/{owner}/{repo}/releases"],
            listTagProtection: ["GET /repos/{owner}/{repo}/tags/protection"],
            listTags: ["GET /repos/{owner}/{repo}/tags"],
            listTeams: ["GET /repos/{owner}/{repo}/teams"],
            listWebhookDeliveries: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
            ],
            listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
            merge: ["POST /repos/{owner}/{repo}/merges"],
            mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
            pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
            redeliverWebhookDelivery: [
                "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
            ],
            removeAppAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            removeCollaborator: [
                "DELETE /repos/{owner}/{repo}/collaborators/{username}",
            ],
            removeStatusCheckContexts: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            removeStatusCheckProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            removeTeamAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            removeUserAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
            replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
            requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
            setAdminBranchProtection: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            setAppAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            setStatusCheckContexts: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            setTeamAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            setUserAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
            transfer: ["POST /repos/{owner}/{repo}/transfer"],
            update: ["PATCH /repos/{owner}/{repo}"],
            updateBranchProtection: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
            updateDeploymentBranchPolicy: [
                "PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
            ],
            updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
            updateInvitation: [
                "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}",
            ],
            updatePullRequestReviewProtection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
            updateReleaseAsset: [
                "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}",
            ],
            updateStatusCheckPotection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
                {},
                { renamed: ["repos", "updateStatusCheckProtection"] },
            ],
            updateStatusCheckProtection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
            updateWebhookConfigForRepo: [
                "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config",
            ],
            uploadReleaseAsset: [
                "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
                { baseUrl: "https://uploads.github.com" },
            ],
        },
        search: {
            code: ["GET /search/code"],
            commits: ["GET /search/commits"],
            issuesAndPullRequests: ["GET /search/issues"],
            labels: ["GET /search/labels"],
            repos: ["GET /search/repositories"],
            topics: ["GET /search/topics"],
            users: ["GET /search/users"],
        },
        secretScanning: {
            getAlert: [
                "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
            ],
            getSecurityAnalysisSettingsForEnterprise: [
                "GET /enterprises/{enterprise}/code_security_and_analysis",
            ],
            listAlertsForEnterprise: [
                "GET /enterprises/{enterprise}/secret-scanning/alerts",
            ],
            listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
            listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
            listLocationsForAlert: [
                "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
            ],
            patchSecurityAnalysisSettingsForEnterprise: [
                "PATCH /enterprises/{enterprise}/code_security_and_analysis",
            ],
            postSecurityProductEnablementForEnterprise: [
                "POST /enterprises/{enterprise}/{security_product}/{enablement}",
            ],
            updateAlert: [
                "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
            ],
        },
        teams: {
            addOrUpdateMembershipForUserInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            addOrUpdateProjectPermissionsInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}",
            ],
            addOrUpdateRepoPermissionsInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            checkPermissionsForProjectInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/projects/{project_id}",
            ],
            checkPermissionsForRepoInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            create: ["POST /orgs/{org}/teams"],
            createDiscussionCommentInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
            ],
            createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
            deleteDiscussionCommentInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            deleteDiscussionInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
            getByName: ["GET /orgs/{org}/teams/{team_slug}"],
            getDiscussionCommentInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            getDiscussionInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            getMembershipForUserInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            list: ["GET /orgs/{org}/teams"],
            listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
            listDiscussionCommentsInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
            ],
            listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
            listForAuthenticatedUser: ["GET /user/teams"],
            listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
            listPendingInvitationsInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/invitations",
            ],
            listProjectsInOrg: ["GET /orgs/{org}/teams/{team_slug}/projects"],
            listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
            removeMembershipForUserInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            removeProjectInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}",
            ],
            removeRepoInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            updateDiscussionCommentInOrg: [
                "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            updateDiscussionInOrg: [
                "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"],
        },
        users: {
            addEmailForAuthenticated: [
                "POST /user/emails",
                {},
                { renamed: ["users", "addEmailForAuthenticatedUser"] },
            ],
            addEmailForAuthenticatedUser: ["POST /user/emails"],
            block: ["PUT /user/blocks/{username}"],
            checkBlocked: ["GET /user/blocks/{username}"],
            checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
            checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
            createGpgKeyForAuthenticated: [
                "POST /user/gpg_keys",
                {},
                { renamed: ["users", "createGpgKeyForAuthenticatedUser"] },
            ],
            createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
            createPublicSshKeyForAuthenticated: [
                "POST /user/keys",
                {},
                { renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] },
            ],
            createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
            createSshSigningKeyForAuthenticatedUser: ["POST /user/ssh_signing_keys"],
            deleteEmailForAuthenticated: [
                "DELETE /user/emails",
                {},
                { renamed: ["users", "deleteEmailForAuthenticatedUser"] },
            ],
            deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
            deleteGpgKeyForAuthenticated: [
                "DELETE /user/gpg_keys/{gpg_key_id}",
                {},
                { renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] },
            ],
            deleteGpgKeyForAuthenticatedUser: ["DELETE /user/gpg_keys/{gpg_key_id}"],
            deletePublicSshKeyForAuthenticated: [
                "DELETE /user/keys/{key_id}",
                {},
                { renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] },
            ],
            deletePublicSshKeyForAuthenticatedUser: ["DELETE /user/keys/{key_id}"],
            deleteSshSigningKeyForAuthenticatedUser: [
                "DELETE /user/ssh_signing_keys/{ssh_signing_key_id}",
            ],
            follow: ["PUT /user/following/{username}"],
            getAuthenticated: ["GET /user"],
            getByUsername: ["GET /users/{username}"],
            getContextForUser: ["GET /users/{username}/hovercard"],
            getGpgKeyForAuthenticated: [
                "GET /user/gpg_keys/{gpg_key_id}",
                {},
                { renamed: ["users", "getGpgKeyForAuthenticatedUser"] },
            ],
            getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
            getPublicSshKeyForAuthenticated: [
                "GET /user/keys/{key_id}",
                {},
                { renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] },
            ],
            getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
            getSshSigningKeyForAuthenticatedUser: [
                "GET /user/ssh_signing_keys/{ssh_signing_key_id}",
            ],
            list: ["GET /users"],
            listBlockedByAuthenticated: [
                "GET /user/blocks",
                {},
                { renamed: ["users", "listBlockedByAuthenticatedUser"] },
            ],
            listBlockedByAuthenticatedUser: ["GET /user/blocks"],
            listEmailsForAuthenticated: [
                "GET /user/emails",
                {},
                { renamed: ["users", "listEmailsForAuthenticatedUser"] },
            ],
            listEmailsForAuthenticatedUser: ["GET /user/emails"],
            listFollowedByAuthenticated: [
                "GET /user/following",
                {},
                { renamed: ["users", "listFollowedByAuthenticatedUser"] },
            ],
            listFollowedByAuthenticatedUser: ["GET /user/following"],
            listFollowersForAuthenticatedUser: ["GET /user/followers"],
            listFollowersForUser: ["GET /users/{username}/followers"],
            listFollowingForUser: ["GET /users/{username}/following"],
            listGpgKeysForAuthenticated: [
                "GET /user/gpg_keys",
                {},
                { renamed: ["users", "listGpgKeysForAuthenticatedUser"] },
            ],
            listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
            listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
            listPublicEmailsForAuthenticated: [
                "GET /user/public_emails",
                {},
                { renamed: ["users", "listPublicEmailsForAuthenticatedUser"] },
            ],
            listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
            listPublicKeysForUser: ["GET /users/{username}/keys"],
            listPublicSshKeysForAuthenticated: [
                "GET /user/keys",
                {},
                { renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] },
            ],
            listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
            listSshSigningKeysForAuthenticatedUser: ["GET /user/ssh_signing_keys"],
            listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
            setPrimaryEmailVisibilityForAuthenticated: [
                "PATCH /user/email/visibility",
                {},
                { renamed: ["users", "setPrimaryEmailVisibilityForAuthenticatedUser"] },
            ],
            setPrimaryEmailVisibilityForAuthenticatedUser: [
                "PATCH /user/email/visibility",
            ],
            unblock: ["DELETE /user/blocks/{username}"],
            unfollow: ["DELETE /user/following/{username}"],
            updateAuthenticated: ["PATCH /user"],
        },
    };

    const VERSION$a = "7.0.1";

    function endpointsToMethods(octokit, endpointsMap) {
        const newMethods = {};
        for (const [scope, endpoints] of Object.entries(endpointsMap)) {
            for (const [methodName, endpoint] of Object.entries(endpoints)) {
                const [route, defaults, decorations] = endpoint;
                const [method, url] = route.split(/ /);
                const endpointDefaults = Object.assign({ method, url }, defaults);
                if (!newMethods[scope]) {
                    newMethods[scope] = {};
                }
                const scopeMethods = newMethods[scope];
                if (decorations) {
                    scopeMethods[methodName] = decorate(octokit, scope, methodName, endpointDefaults, decorations);
                    continue;
                }
                scopeMethods[methodName] = octokit.request.defaults(endpointDefaults);
            }
        }
        return newMethods;
    }
    function decorate(octokit, scope, methodName, defaults, decorations) {
        const requestWithDefaults = octokit.request.defaults(defaults);
        /* istanbul ignore next */
        function withDecorations(...args) {
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
            let options = requestWithDefaults.endpoint.merge(...args);
            // There are currently no other decorations than `.mapToData`
            if (decorations.mapToData) {
                options = Object.assign({}, options, {
                    data: options[decorations.mapToData],
                    [decorations.mapToData]: undefined,
                });
                return requestWithDefaults(options);
            }
            if (decorations.renamed) {
                const [newScope, newMethodName] = decorations.renamed;
                octokit.log.warn(`octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`);
            }
            if (decorations.deprecated) {
                octokit.log.warn(decorations.deprecated);
            }
            if (decorations.renamedParameters) {
                // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
                const options = requestWithDefaults.endpoint.merge(...args);
                for (const [name, alias] of Object.entries(decorations.renamedParameters)) {
                    if (name in options) {
                        octokit.log.warn(`"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`);
                        if (!(alias in options)) {
                            options[alias] = options[name];
                        }
                        delete options[name];
                    }
                }
                return requestWithDefaults(options);
            }
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
            return requestWithDefaults(...args);
        }
        return Object.assign(withDecorations, requestWithDefaults);
    }

    function restEndpointMethods(octokit) {
        const api = endpointsToMethods(octokit, Endpoints);
        return {
            rest: api,
        };
    }
    restEndpointMethods.VERSION = VERSION$a;

    /**
      * This file contains the Bottleneck library (MIT), compiled to ES2017, and without Clustering support.
      * https://github.com/SGrondin/bottleneck
      */

    var light = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	module.exports = factory() ;
    }(commonjsGlobal, (function () {
    	var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

    	function getCjsExportFromNamespace (n) {
    		return n && n['default'] || n;
    	}

    	var load = function(received, defaults, onto = {}) {
    	  var k, ref, v;
    	  for (k in defaults) {
    	    v = defaults[k];
    	    onto[k] = (ref = received[k]) != null ? ref : v;
    	  }
    	  return onto;
    	};

    	var overwrite = function(received, defaults, onto = {}) {
    	  var k, v;
    	  for (k in received) {
    	    v = received[k];
    	    if (defaults[k] !== void 0) {
    	      onto[k] = v;
    	    }
    	  }
    	  return onto;
    	};

    	var parser = {
    		load: load,
    		overwrite: overwrite
    	};

    	var DLList;

    	DLList = class DLList {
    	  constructor(incr, decr) {
    	    this.incr = incr;
    	    this.decr = decr;
    	    this._first = null;
    	    this._last = null;
    	    this.length = 0;
    	  }

    	  push(value) {
    	    var node;
    	    this.length++;
    	    if (typeof this.incr === "function") {
    	      this.incr();
    	    }
    	    node = {
    	      value,
    	      prev: this._last,
    	      next: null
    	    };
    	    if (this._last != null) {
    	      this._last.next = node;
    	      this._last = node;
    	    } else {
    	      this._first = this._last = node;
    	    }
    	    return void 0;
    	  }

    	  shift() {
    	    var value;
    	    if (this._first == null) {
    	      return;
    	    } else {
    	      this.length--;
    	      if (typeof this.decr === "function") {
    	        this.decr();
    	      }
    	    }
    	    value = this._first.value;
    	    if ((this._first = this._first.next) != null) {
    	      this._first.prev = null;
    	    } else {
    	      this._last = null;
    	    }
    	    return value;
    	  }

    	  first() {
    	    if (this._first != null) {
    	      return this._first.value;
    	    }
    	  }

    	  getArray() {
    	    var node, ref, results;
    	    node = this._first;
    	    results = [];
    	    while (node != null) {
    	      results.push((ref = node, node = node.next, ref.value));
    	    }
    	    return results;
    	  }

    	  forEachShift(cb) {
    	    var node;
    	    node = this.shift();
    	    while (node != null) {
    	      (cb(node), node = this.shift());
    	    }
    	    return void 0;
    	  }

    	  debug() {
    	    var node, ref, ref1, ref2, results;
    	    node = this._first;
    	    results = [];
    	    while (node != null) {
    	      results.push((ref = node, node = node.next, {
    	        value: ref.value,
    	        prev: (ref1 = ref.prev) != null ? ref1.value : void 0,
    	        next: (ref2 = ref.next) != null ? ref2.value : void 0
    	      }));
    	    }
    	    return results;
    	  }

    	};

    	var DLList_1 = DLList;

    	var Events;

    	Events = class Events {
    	  constructor(instance) {
    	    this.instance = instance;
    	    this._events = {};
    	    if ((this.instance.on != null) || (this.instance.once != null) || (this.instance.removeAllListeners != null)) {
    	      throw new Error("An Emitter already exists for this object");
    	    }
    	    this.instance.on = (name, cb) => {
    	      return this._addListener(name, "many", cb);
    	    };
    	    this.instance.once = (name, cb) => {
    	      return this._addListener(name, "once", cb);
    	    };
    	    this.instance.removeAllListeners = (name = null) => {
    	      if (name != null) {
    	        return delete this._events[name];
    	      } else {
    	        return this._events = {};
    	      }
    	    };
    	  }

    	  _addListener(name, status, cb) {
    	    var base;
    	    if ((base = this._events)[name] == null) {
    	      base[name] = [];
    	    }
    	    this._events[name].push({cb, status});
    	    return this.instance;
    	  }

    	  listenerCount(name) {
    	    if (this._events[name] != null) {
    	      return this._events[name].length;
    	    } else {
    	      return 0;
    	    }
    	  }

    	  async trigger(name, ...args) {
    	    var e, promises;
    	    try {
    	      if (name !== "debug") {
    	        this.trigger("debug", `Event triggered: ${name}`, args);
    	      }
    	      if (this._events[name] == null) {
    	        return;
    	      }
    	      this._events[name] = this._events[name].filter(function(listener) {
    	        return listener.status !== "none";
    	      });
    	      promises = this._events[name].map(async(listener) => {
    	        var e, returned;
    	        if (listener.status === "none") {
    	          return;
    	        }
    	        if (listener.status === "once") {
    	          listener.status = "none";
    	        }
    	        try {
    	          returned = typeof listener.cb === "function" ? listener.cb(...args) : void 0;
    	          if (typeof (returned != null ? returned.then : void 0) === "function") {
    	            return (await returned);
    	          } else {
    	            return returned;
    	          }
    	        } catch (error) {
    	          e = error;
    	          {
    	            this.trigger("error", e);
    	          }
    	          return null;
    	        }
    	      });
    	      return ((await Promise.all(promises))).find(function(x) {
    	        return x != null;
    	      });
    	    } catch (error) {
    	      e = error;
    	      {
    	        this.trigger("error", e);
    	      }
    	      return null;
    	    }
    	  }

    	};

    	var Events_1 = Events;

    	var DLList$1, Events$1, Queues;

    	DLList$1 = DLList_1;

    	Events$1 = Events_1;

    	Queues = class Queues {
    	  constructor(num_priorities) {
    	    this.Events = new Events$1(this);
    	    this._length = 0;
    	    this._lists = (function() {
    	      var j, ref, results;
    	      results = [];
    	      for (j = 1, ref = num_priorities; (1 <= ref ? j <= ref : j >= ref); 1 <= ref ? ++j : --j) {
    	        results.push(new DLList$1((() => {
    	          return this.incr();
    	        }), (() => {
    	          return this.decr();
    	        })));
    	      }
    	      return results;
    	    }).call(this);
    	  }

    	  incr() {
    	    if (this._length++ === 0) {
    	      return this.Events.trigger("leftzero");
    	    }
    	  }

    	  decr() {
    	    if (--this._length === 0) {
    	      return this.Events.trigger("zero");
    	    }
    	  }

    	  push(job) {
    	    return this._lists[job.options.priority].push(job);
    	  }

    	  queued(priority) {
    	    if (priority != null) {
    	      return this._lists[priority].length;
    	    } else {
    	      return this._length;
    	    }
    	  }

    	  shiftAll(fn) {
    	    return this._lists.forEach(function(list) {
    	      return list.forEachShift(fn);
    	    });
    	  }

    	  getFirst(arr = this._lists) {
    	    var j, len, list;
    	    for (j = 0, len = arr.length; j < len; j++) {
    	      list = arr[j];
    	      if (list.length > 0) {
    	        return list;
    	      }
    	    }
    	    return [];
    	  }

    	  shiftLastFrom(priority) {
    	    return this.getFirst(this._lists.slice(priority).reverse()).shift();
    	  }

    	};

    	var Queues_1 = Queues;

    	var BottleneckError;

    	BottleneckError = class BottleneckError extends Error {};

    	var BottleneckError_1 = BottleneckError;

    	var BottleneckError$1, DEFAULT_PRIORITY, Job, NUM_PRIORITIES, parser$1;

    	NUM_PRIORITIES = 10;

    	DEFAULT_PRIORITY = 5;

    	parser$1 = parser;

    	BottleneckError$1 = BottleneckError_1;

    	Job = class Job {
    	  constructor(task, args, options, jobDefaults, rejectOnDrop, Events, _states, Promise) {
    	    this.task = task;
    	    this.args = args;
    	    this.rejectOnDrop = rejectOnDrop;
    	    this.Events = Events;
    	    this._states = _states;
    	    this.Promise = Promise;
    	    this.options = parser$1.load(options, jobDefaults);
    	    this.options.priority = this._sanitizePriority(this.options.priority);
    	    if (this.options.id === jobDefaults.id) {
    	      this.options.id = `${this.options.id}-${this._randomIndex()}`;
    	    }
    	    this.promise = new this.Promise((_resolve, _reject) => {
    	      this._resolve = _resolve;
    	      this._reject = _reject;
    	    });
    	    this.retryCount = 0;
    	  }

    	  _sanitizePriority(priority) {
    	    var sProperty;
    	    sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
    	    if (sProperty < 0) {
    	      return 0;
    	    } else if (sProperty > NUM_PRIORITIES - 1) {
    	      return NUM_PRIORITIES - 1;
    	    } else {
    	      return sProperty;
    	    }
    	  }

    	  _randomIndex() {
    	    return Math.random().toString(36).slice(2);
    	  }

    	  doDrop({error, message = "This job has been dropped by Bottleneck"} = {}) {
    	    if (this._states.remove(this.options.id)) {
    	      if (this.rejectOnDrop) {
    	        this._reject(error != null ? error : new BottleneckError$1(message));
    	      }
    	      this.Events.trigger("dropped", {args: this.args, options: this.options, task: this.task, promise: this.promise});
    	      return true;
    	    } else {
    	      return false;
    	    }
    	  }

    	  _assertStatus(expected) {
    	    var status;
    	    status = this._states.jobStatus(this.options.id);
    	    if (!(status === expected || (expected === "DONE" && status === null))) {
    	      throw new BottleneckError$1(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
    	    }
    	  }

    	  doReceive() {
    	    this._states.start(this.options.id);
    	    return this.Events.trigger("received", {args: this.args, options: this.options});
    	  }

    	  doQueue(reachedHWM, blocked) {
    	    this._assertStatus("RECEIVED");
    	    this._states.next(this.options.id);
    	    return this.Events.trigger("queued", {args: this.args, options: this.options, reachedHWM, blocked});
    	  }

    	  doRun() {
    	    if (this.retryCount === 0) {
    	      this._assertStatus("QUEUED");
    	      this._states.next(this.options.id);
    	    } else {
    	      this._assertStatus("EXECUTING");
    	    }
    	    return this.Events.trigger("scheduled", {args: this.args, options: this.options});
    	  }

    	  async doExecute(chained, clearGlobalState, run, free) {
    	    var error, eventInfo, passed;
    	    if (this.retryCount === 0) {
    	      this._assertStatus("RUNNING");
    	      this._states.next(this.options.id);
    	    } else {
    	      this._assertStatus("EXECUTING");
    	    }
    	    eventInfo = {args: this.args, options: this.options, retryCount: this.retryCount};
    	    this.Events.trigger("executing", eventInfo);
    	    try {
    	      passed = (await (chained != null ? chained.schedule(this.options, this.task, ...this.args) : this.task(...this.args)));
    	      if (clearGlobalState()) {
    	        this.doDone(eventInfo);
    	        await free(this.options, eventInfo);
    	        this._assertStatus("DONE");
    	        return this._resolve(passed);
    	      }
    	    } catch (error1) {
    	      error = error1;
    	      return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    	    }
    	  }

    	  doExpire(clearGlobalState, run, free) {
    	    var error, eventInfo;
    	    if (this._states.jobStatus(this.options.id === "RUNNING")) {
    	      this._states.next(this.options.id);
    	    }
    	    this._assertStatus("EXECUTING");
    	    eventInfo = {args: this.args, options: this.options, retryCount: this.retryCount};
    	    error = new BottleneckError$1(`This job timed out after ${this.options.expiration} ms.`);
    	    return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    	  }

    	  async _onFailure(error, eventInfo, clearGlobalState, run, free) {
    	    var retry, retryAfter;
    	    if (clearGlobalState()) {
    	      retry = (await this.Events.trigger("failed", error, eventInfo));
    	      if (retry != null) {
    	        retryAfter = ~~retry;
    	        this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
    	        this.retryCount++;
    	        return run(retryAfter);
    	      } else {
    	        this.doDone(eventInfo);
    	        await free(this.options, eventInfo);
    	        this._assertStatus("DONE");
    	        return this._reject(error);
    	      }
    	    }
    	  }

    	  doDone(eventInfo) {
    	    this._assertStatus("EXECUTING");
    	    this._states.next(this.options.id);
    	    return this.Events.trigger("done", eventInfo);
    	  }

    	};

    	var Job_1 = Job;

    	var BottleneckError$2, LocalDatastore, parser$2;

    	parser$2 = parser;

    	BottleneckError$2 = BottleneckError_1;

    	LocalDatastore = class LocalDatastore {
    	  constructor(instance, storeOptions, storeInstanceOptions) {
    	    this.instance = instance;
    	    this.storeOptions = storeOptions;
    	    this.clientId = this.instance._randomIndex();
    	    parser$2.load(storeInstanceOptions, storeInstanceOptions, this);
    	    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    	    this._running = 0;
    	    this._done = 0;
    	    this._unblockTime = 0;
    	    this.ready = this.Promise.resolve();
    	    this.clients = {};
    	    this._startHeartbeat();
    	  }

    	  _startHeartbeat() {
    	    var base;
    	    if ((this.heartbeat == null) && (((this.storeOptions.reservoirRefreshInterval != null) && (this.storeOptions.reservoirRefreshAmount != null)) || ((this.storeOptions.reservoirIncreaseInterval != null) && (this.storeOptions.reservoirIncreaseAmount != null)))) {
    	      return typeof (base = (this.heartbeat = setInterval(() => {
    	        var amount, incr, maximum, now, reservoir;
    	        now = Date.now();
    	        if ((this.storeOptions.reservoirRefreshInterval != null) && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
    	          this._lastReservoirRefresh = now;
    	          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
    	          this.instance._drainAll(this.computeCapacity());
    	        }
    	        if ((this.storeOptions.reservoirIncreaseInterval != null) && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
    	          ({
    	            reservoirIncreaseAmount: amount,
    	            reservoirIncreaseMaximum: maximum,
    	            reservoir
    	          } = this.storeOptions);
    	          this._lastReservoirIncrease = now;
    	          incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
    	          if (incr > 0) {
    	            this.storeOptions.reservoir += incr;
    	            return this.instance._drainAll(this.computeCapacity());
    	          }
    	        }
    	      }, this.heartbeatInterval))).unref === "function" ? base.unref() : void 0;
    	    } else {
    	      return clearInterval(this.heartbeat);
    	    }
    	  }

    	  async __publish__(message) {
    	    await this.yieldLoop();
    	    return this.instance.Events.trigger("message", message.toString());
    	  }

    	  async __disconnect__(flush) {
    	    await this.yieldLoop();
    	    clearInterval(this.heartbeat);
    	    return this.Promise.resolve();
    	  }

    	  yieldLoop(t = 0) {
    	    return new this.Promise(function(resolve, reject) {
    	      return setTimeout(resolve, t);
    	    });
    	  }

    	  computePenalty() {
    	    var ref;
    	    return (ref = this.storeOptions.penalty) != null ? ref : (15 * this.storeOptions.minTime) || 5000;
    	  }

    	  async __updateSettings__(options) {
    	    await this.yieldLoop();
    	    parser$2.overwrite(options, options, this.storeOptions);
    	    this._startHeartbeat();
    	    this.instance._drainAll(this.computeCapacity());
    	    return true;
    	  }

    	  async __running__() {
    	    await this.yieldLoop();
    	    return this._running;
    	  }

    	  async __queued__() {
    	    await this.yieldLoop();
    	    return this.instance.queued();
    	  }

    	  async __done__() {
    	    await this.yieldLoop();
    	    return this._done;
    	  }

    	  async __groupCheck__(time) {
    	    await this.yieldLoop();
    	    return (this._nextRequest + this.timeout) < time;
    	  }

    	  computeCapacity() {
    	    var maxConcurrent, reservoir;
    	    ({maxConcurrent, reservoir} = this.storeOptions);
    	    if ((maxConcurrent != null) && (reservoir != null)) {
    	      return Math.min(maxConcurrent - this._running, reservoir);
    	    } else if (maxConcurrent != null) {
    	      return maxConcurrent - this._running;
    	    } else if (reservoir != null) {
    	      return reservoir;
    	    } else {
    	      return null;
    	    }
    	  }

    	  conditionsCheck(weight) {
    	    var capacity;
    	    capacity = this.computeCapacity();
    	    return (capacity == null) || weight <= capacity;
    	  }

    	  async __incrementReservoir__(incr) {
    	    var reservoir;
    	    await this.yieldLoop();
    	    reservoir = this.storeOptions.reservoir += incr;
    	    this.instance._drainAll(this.computeCapacity());
    	    return reservoir;
    	  }

    	  async __currentReservoir__() {
    	    await this.yieldLoop();
    	    return this.storeOptions.reservoir;
    	  }

    	  isBlocked(now) {
    	    return this._unblockTime >= now;
    	  }

    	  check(weight, now) {
    	    return this.conditionsCheck(weight) && (this._nextRequest - now) <= 0;
    	  }

    	  async __check__(weight) {
    	    var now;
    	    await this.yieldLoop();
    	    now = Date.now();
    	    return this.check(weight, now);
    	  }

    	  async __register__(index, weight, expiration) {
    	    var now, wait;
    	    await this.yieldLoop();
    	    now = Date.now();
    	    if (this.conditionsCheck(weight)) {
    	      this._running += weight;
    	      if (this.storeOptions.reservoir != null) {
    	        this.storeOptions.reservoir -= weight;
    	      }
    	      wait = Math.max(this._nextRequest - now, 0);
    	      this._nextRequest = now + wait + this.storeOptions.minTime;
    	      return {
    	        success: true,
    	        wait,
    	        reservoir: this.storeOptions.reservoir
    	      };
    	    } else {
    	      return {
    	        success: false
    	      };
    	    }
    	  }

    	  strategyIsBlock() {
    	    return this.storeOptions.strategy === 3;
    	  }

    	  async __submit__(queueLength, weight) {
    	    var blocked, now, reachedHWM;
    	    await this.yieldLoop();
    	    if ((this.storeOptions.maxConcurrent != null) && weight > this.storeOptions.maxConcurrent) {
    	      throw new BottleneckError$2(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
    	    }
    	    now = Date.now();
    	    reachedHWM = (this.storeOptions.highWater != null) && queueLength === this.storeOptions.highWater && !this.check(weight, now);
    	    blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
    	    if (blocked) {
    	      this._unblockTime = now + this.computePenalty();
    	      this._nextRequest = this._unblockTime + this.storeOptions.minTime;
    	      this.instance._dropAllQueued();
    	    }
    	    return {
    	      reachedHWM,
    	      blocked,
    	      strategy: this.storeOptions.strategy
    	    };
    	  }

    	  async __free__(index, weight) {
    	    await this.yieldLoop();
    	    this._running -= weight;
    	    this._done += weight;
    	    this.instance._drainAll(this.computeCapacity());
    	    return {
    	      running: this._running
    	    };
    	  }

    	};

    	var LocalDatastore_1 = LocalDatastore;

    	var BottleneckError$3, States;

    	BottleneckError$3 = BottleneckError_1;

    	States = class States {
    	  constructor(status1) {
    	    this.status = status1;
    	    this._jobs = {};
    	    this.counts = this.status.map(function() {
    	      return 0;
    	    });
    	  }

    	  next(id) {
    	    var current, next;
    	    current = this._jobs[id];
    	    next = current + 1;
    	    if ((current != null) && next < this.status.length) {
    	      this.counts[current]--;
    	      this.counts[next]++;
    	      return this._jobs[id]++;
    	    } else if (current != null) {
    	      this.counts[current]--;
    	      return delete this._jobs[id];
    	    }
    	  }

    	  start(id) {
    	    var initial;
    	    initial = 0;
    	    this._jobs[id] = initial;
    	    return this.counts[initial]++;
    	  }

    	  remove(id) {
    	    var current;
    	    current = this._jobs[id];
    	    if (current != null) {
    	      this.counts[current]--;
    	      delete this._jobs[id];
    	    }
    	    return current != null;
    	  }

    	  jobStatus(id) {
    	    var ref;
    	    return (ref = this.status[this._jobs[id]]) != null ? ref : null;
    	  }

    	  statusJobs(status) {
    	    var k, pos, ref, results, v;
    	    if (status != null) {
    	      pos = this.status.indexOf(status);
    	      if (pos < 0) {
    	        throw new BottleneckError$3(`status must be one of ${this.status.join(', ')}`);
    	      }
    	      ref = this._jobs;
    	      results = [];
    	      for (k in ref) {
    	        v = ref[k];
    	        if (v === pos) {
    	          results.push(k);
    	        }
    	      }
    	      return results;
    	    } else {
    	      return Object.keys(this._jobs);
    	    }
    	  }

    	  statusCounts() {
    	    return this.counts.reduce(((acc, v, i) => {
    	      acc[this.status[i]] = v;
    	      return acc;
    	    }), {});
    	  }

    	};

    	var States_1 = States;

    	var DLList$2, Sync;

    	DLList$2 = DLList_1;

    	Sync = class Sync {
    	  constructor(name, Promise) {
    	    this.schedule = this.schedule.bind(this);
    	    this.name = name;
    	    this.Promise = Promise;
    	    this._running = 0;
    	    this._queue = new DLList$2();
    	  }

    	  isEmpty() {
    	    return this._queue.length === 0;
    	  }

    	  async _tryToRun() {
    	    var args, cb, error, reject, resolve, returned, task;
    	    if ((this._running < 1) && this._queue.length > 0) {
    	      this._running++;
    	      ({task, args, resolve, reject} = this._queue.shift());
    	      cb = (await (async function() {
    	        try {
    	          returned = (await task(...args));
    	          return function() {
    	            return resolve(returned);
    	          };
    	        } catch (error1) {
    	          error = error1;
    	          return function() {
    	            return reject(error);
    	          };
    	        }
    	      })());
    	      this._running--;
    	      this._tryToRun();
    	      return cb();
    	    }
    	  }

    	  schedule(task, ...args) {
    	    var promise, reject, resolve;
    	    resolve = reject = null;
    	    promise = new this.Promise(function(_resolve, _reject) {
    	      resolve = _resolve;
    	      return reject = _reject;
    	    });
    	    this._queue.push({task, args, resolve, reject});
    	    this._tryToRun();
    	    return promise;
    	  }

    	};

    	var Sync_1 = Sync;

    	var version = "2.19.5";
    	var version$1 = {
    		version: version
    	};

    	var version$2 = /*#__PURE__*/Object.freeze({
    		version: version,
    		default: version$1
    	});

    	var require$$2 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$3 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$4 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var Events$2, Group, IORedisConnection$1, RedisConnection$1, Scripts$1, parser$3;

    	parser$3 = parser;

    	Events$2 = Events_1;

    	RedisConnection$1 = require$$2;

    	IORedisConnection$1 = require$$3;

    	Scripts$1 = require$$4;

    	Group = (function() {
    	  class Group {
    	    constructor(limiterOptions = {}) {
    	      this.deleteKey = this.deleteKey.bind(this);
    	      this.limiterOptions = limiterOptions;
    	      parser$3.load(this.limiterOptions, this.defaults, this);
    	      this.Events = new Events$2(this);
    	      this.instances = {};
    	      this.Bottleneck = Bottleneck_1;
    	      this._startAutoCleanup();
    	      this.sharedConnection = this.connection != null;
    	      if (this.connection == null) {
    	        if (this.limiterOptions.datastore === "redis") {
    	          this.connection = new RedisConnection$1(Object.assign({}, this.limiterOptions, {Events: this.Events}));
    	        } else if (this.limiterOptions.datastore === "ioredis") {
    	          this.connection = new IORedisConnection$1(Object.assign({}, this.limiterOptions, {Events: this.Events}));
    	        }
    	      }
    	    }

    	    key(key = "") {
    	      var ref;
    	      return (ref = this.instances[key]) != null ? ref : (() => {
    	        var limiter;
    	        limiter = this.instances[key] = new this.Bottleneck(Object.assign(this.limiterOptions, {
    	          id: `${this.id}-${key}`,
    	          timeout: this.timeout,
    	          connection: this.connection
    	        }));
    	        this.Events.trigger("created", limiter, key);
    	        return limiter;
    	      })();
    	    }

    	    async deleteKey(key = "") {
    	      var deleted, instance;
    	      instance = this.instances[key];
    	      if (this.connection) {
    	        deleted = (await this.connection.__runCommand__(['del', ...Scripts$1.allKeys(`${this.id}-${key}`)]));
    	      }
    	      if (instance != null) {
    	        delete this.instances[key];
    	        await instance.disconnect();
    	      }
    	      return (instance != null) || deleted > 0;
    	    }

    	    limiters() {
    	      var k, ref, results, v;
    	      ref = this.instances;
    	      results = [];
    	      for (k in ref) {
    	        v = ref[k];
    	        results.push({
    	          key: k,
    	          limiter: v
    	        });
    	      }
    	      return results;
    	    }

    	    keys() {
    	      return Object.keys(this.instances);
    	    }

    	    async clusterKeys() {
    	      var cursor, end, found, i, k, keys, len, next, start;
    	      if (this.connection == null) {
    	        return this.Promise.resolve(this.keys());
    	      }
    	      keys = [];
    	      cursor = null;
    	      start = `b_${this.id}-`.length;
    	      end = "_settings".length;
    	      while (cursor !== 0) {
    	        [next, found] = (await this.connection.__runCommand__(["scan", cursor != null ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 10000]));
    	        cursor = ~~next;
    	        for (i = 0, len = found.length; i < len; i++) {
    	          k = found[i];
    	          keys.push(k.slice(start, -end));
    	        }
    	      }
    	      return keys;
    	    }

    	    _startAutoCleanup() {
    	      var base;
    	      clearInterval(this.interval);
    	      return typeof (base = (this.interval = setInterval(async() => {
    	        var e, k, ref, results, time, v;
    	        time = Date.now();
    	        ref = this.instances;
    	        results = [];
    	        for (k in ref) {
    	          v = ref[k];
    	          try {
    	            if ((await v._store.__groupCheck__(time))) {
    	              results.push(this.deleteKey(k));
    	            } else {
    	              results.push(void 0);
    	            }
    	          } catch (error) {
    	            e = error;
    	            results.push(v.Events.trigger("error", e));
    	          }
    	        }
    	        return results;
    	      }, this.timeout / 2))).unref === "function" ? base.unref() : void 0;
    	    }

    	    updateSettings(options = {}) {
    	      parser$3.overwrite(options, this.defaults, this);
    	      parser$3.overwrite(options, options, this.limiterOptions);
    	      if (options.timeout != null) {
    	        return this._startAutoCleanup();
    	      }
    	    }

    	    disconnect(flush = true) {
    	      var ref;
    	      if (!this.sharedConnection) {
    	        return (ref = this.connection) != null ? ref.disconnect(flush) : void 0;
    	      }
    	    }

    	  }
    	  Group.prototype.defaults = {
    	    timeout: 1000 * 60 * 5,
    	    connection: null,
    	    Promise: Promise,
    	    id: "group-key"
    	  };

    	  return Group;

    	}).call(commonjsGlobal$1);

    	var Group_1 = Group;

    	var Batcher, Events$3, parser$4;

    	parser$4 = parser;

    	Events$3 = Events_1;

    	Batcher = (function() {
    	  class Batcher {
    	    constructor(options = {}) {
    	      this.options = options;
    	      parser$4.load(this.options, this.defaults, this);
    	      this.Events = new Events$3(this);
    	      this._arr = [];
    	      this._resetPromise();
    	      this._lastFlush = Date.now();
    	    }

    	    _resetPromise() {
    	      return this._promise = new this.Promise((res, rej) => {
    	        return this._resolve = res;
    	      });
    	    }

    	    _flush() {
    	      clearTimeout(this._timeout);
    	      this._lastFlush = Date.now();
    	      this._resolve();
    	      this.Events.trigger("batch", this._arr);
    	      this._arr = [];
    	      return this._resetPromise();
    	    }

    	    add(data) {
    	      var ret;
    	      this._arr.push(data);
    	      ret = this._promise;
    	      if (this._arr.length === this.maxSize) {
    	        this._flush();
    	      } else if ((this.maxTime != null) && this._arr.length === 1) {
    	        this._timeout = setTimeout(() => {
    	          return this._flush();
    	        }, this.maxTime);
    	      }
    	      return ret;
    	    }

    	  }
    	  Batcher.prototype.defaults = {
    	    maxTime: null,
    	    maxSize: null,
    	    Promise: Promise
    	  };

    	  return Batcher;

    	}).call(commonjsGlobal$1);

    	var Batcher_1 = Batcher;

    	var require$$4$1 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$8 = getCjsExportFromNamespace(version$2);

    	var Bottleneck, DEFAULT_PRIORITY$1, Events$4, Job$1, LocalDatastore$1, NUM_PRIORITIES$1, Queues$1, RedisDatastore$1, States$1, Sync$1, parser$5,
    	  splice = [].splice;

    	NUM_PRIORITIES$1 = 10;

    	DEFAULT_PRIORITY$1 = 5;

    	parser$5 = parser;

    	Queues$1 = Queues_1;

    	Job$1 = Job_1;

    	LocalDatastore$1 = LocalDatastore_1;

    	RedisDatastore$1 = require$$4$1;

    	Events$4 = Events_1;

    	States$1 = States_1;

    	Sync$1 = Sync_1;

    	Bottleneck = (function() {
    	  class Bottleneck {
    	    constructor(options = {}, ...invalid) {
    	      var storeInstanceOptions, storeOptions;
    	      this._addToQueue = this._addToQueue.bind(this);
    	      this._validateOptions(options, invalid);
    	      parser$5.load(options, this.instanceDefaults, this);
    	      this._queues = new Queues$1(NUM_PRIORITIES$1);
    	      this._scheduled = {};
    	      this._states = new States$1(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
    	      this._limiter = null;
    	      this.Events = new Events$4(this);
    	      this._submitLock = new Sync$1("submit", this.Promise);
    	      this._registerLock = new Sync$1("register", this.Promise);
    	      storeOptions = parser$5.load(options, this.storeDefaults, {});
    	      this._store = (function() {
    	        if (this.datastore === "redis" || this.datastore === "ioredis" || (this.connection != null)) {
    	          storeInstanceOptions = parser$5.load(options, this.redisStoreDefaults, {});
    	          return new RedisDatastore$1(this, storeOptions, storeInstanceOptions);
    	        } else if (this.datastore === "local") {
    	          storeInstanceOptions = parser$5.load(options, this.localStoreDefaults, {});
    	          return new LocalDatastore$1(this, storeOptions, storeInstanceOptions);
    	        } else {
    	          throw new Bottleneck.prototype.BottleneckError(`Invalid datastore type: ${this.datastore}`);
    	        }
    	      }).call(this);
    	      this._queues.on("leftzero", () => {
    	        var ref;
    	        return (ref = this._store.heartbeat) != null ? typeof ref.ref === "function" ? ref.ref() : void 0 : void 0;
    	      });
    	      this._queues.on("zero", () => {
    	        var ref;
    	        return (ref = this._store.heartbeat) != null ? typeof ref.unref === "function" ? ref.unref() : void 0 : void 0;
    	      });
    	    }

    	    _validateOptions(options, invalid) {
    	      if (!((options != null) && typeof options === "object" && invalid.length === 0)) {
    	        throw new Bottleneck.prototype.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
    	      }
    	    }

    	    ready() {
    	      return this._store.ready;
    	    }

    	    clients() {
    	      return this._store.clients;
    	    }

    	    channel() {
    	      return `b_${this.id}`;
    	    }

    	    channel_client() {
    	      return `b_${this.id}_${this._store.clientId}`;
    	    }

    	    publish(message) {
    	      return this._store.__publish__(message);
    	    }

    	    disconnect(flush = true) {
    	      return this._store.__disconnect__(flush);
    	    }

    	    chain(_limiter) {
    	      this._limiter = _limiter;
    	      return this;
    	    }

    	    queued(priority) {
    	      return this._queues.queued(priority);
    	    }

    	    clusterQueued() {
    	      return this._store.__queued__();
    	    }

    	    empty() {
    	      return this.queued() === 0 && this._submitLock.isEmpty();
    	    }

    	    running() {
    	      return this._store.__running__();
    	    }

    	    done() {
    	      return this._store.__done__();
    	    }

    	    jobStatus(id) {
    	      return this._states.jobStatus(id);
    	    }

    	    jobs(status) {
    	      return this._states.statusJobs(status);
    	    }

    	    counts() {
    	      return this._states.statusCounts();
    	    }

    	    _randomIndex() {
    	      return Math.random().toString(36).slice(2);
    	    }

    	    check(weight = 1) {
    	      return this._store.__check__(weight);
    	    }

    	    _clearGlobalState(index) {
    	      if (this._scheduled[index] != null) {
    	        clearTimeout(this._scheduled[index].expiration);
    	        delete this._scheduled[index];
    	        return true;
    	      } else {
    	        return false;
    	      }
    	    }

    	    async _free(index, job, options, eventInfo) {
    	      var e, running;
    	      try {
    	        ({running} = (await this._store.__free__(index, options.weight)));
    	        this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
    	        if (running === 0 && this.empty()) {
    	          return this.Events.trigger("idle");
    	        }
    	      } catch (error1) {
    	        e = error1;
    	        return this.Events.trigger("error", e);
    	      }
    	    }

    	    _run(index, job, wait) {
    	      var clearGlobalState, free, run;
    	      job.doRun();
    	      clearGlobalState = this._clearGlobalState.bind(this, index);
    	      run = this._run.bind(this, index, job);
    	      free = this._free.bind(this, index, job);
    	      return this._scheduled[index] = {
    	        timeout: setTimeout(() => {
    	          return job.doExecute(this._limiter, clearGlobalState, run, free);
    	        }, wait),
    	        expiration: job.options.expiration != null ? setTimeout(function() {
    	          return job.doExpire(clearGlobalState, run, free);
    	        }, wait + job.options.expiration) : void 0,
    	        job: job
    	      };
    	    }

    	    _drainOne(capacity) {
    	      return this._registerLock.schedule(() => {
    	        var args, index, next, options, queue;
    	        if (this.queued() === 0) {
    	          return this.Promise.resolve(null);
    	        }
    	        queue = this._queues.getFirst();
    	        ({options, args} = next = queue.first());
    	        if ((capacity != null) && options.weight > capacity) {
    	          return this.Promise.resolve(null);
    	        }
    	        this.Events.trigger("debug", `Draining ${options.id}`, {args, options});
    	        index = this._randomIndex();
    	        return this._store.__register__(index, options.weight, options.expiration).then(({success, wait, reservoir}) => {
    	          var empty;
    	          this.Events.trigger("debug", `Drained ${options.id}`, {success, args, options});
    	          if (success) {
    	            queue.shift();
    	            empty = this.empty();
    	            if (empty) {
    	              this.Events.trigger("empty");
    	            }
    	            if (reservoir === 0) {
    	              this.Events.trigger("depleted", empty);
    	            }
    	            this._run(index, next, wait);
    	            return this.Promise.resolve(options.weight);
    	          } else {
    	            return this.Promise.resolve(null);
    	          }
    	        });
    	      });
    	    }

    	    _drainAll(capacity, total = 0) {
    	      return this._drainOne(capacity).then((drained) => {
    	        var newCapacity;
    	        if (drained != null) {
    	          newCapacity = capacity != null ? capacity - drained : capacity;
    	          return this._drainAll(newCapacity, total + drained);
    	        } else {
    	          return this.Promise.resolve(total);
    	        }
    	      }).catch((e) => {
    	        return this.Events.trigger("error", e);
    	      });
    	    }

    	    _dropAllQueued(message) {
    	      return this._queues.shiftAll(function(job) {
    	        return job.doDrop({message});
    	      });
    	    }

    	    stop(options = {}) {
    	      var done, waitForExecuting;
    	      options = parser$5.load(options, this.stopDefaults);
    	      waitForExecuting = (at) => {
    	        var finished;
    	        finished = () => {
    	          var counts;
    	          counts = this._states.counts;
    	          return (counts[0] + counts[1] + counts[2] + counts[3]) === at;
    	        };
    	        return new this.Promise((resolve, reject) => {
    	          if (finished()) {
    	            return resolve();
    	          } else {
    	            return this.on("done", () => {
    	              if (finished()) {
    	                this.removeAllListeners("done");
    	                return resolve();
    	              }
    	            });
    	          }
    	        });
    	      };
    	      done = options.dropWaitingJobs ? (this._run = function(index, next) {
    	        return next.doDrop({
    	          message: options.dropErrorMessage
    	        });
    	      }, this._drainOne = () => {
    	        return this.Promise.resolve(null);
    	      }, this._registerLock.schedule(() => {
    	        return this._submitLock.schedule(() => {
    	          var k, ref, v;
    	          ref = this._scheduled;
    	          for (k in ref) {
    	            v = ref[k];
    	            if (this.jobStatus(v.job.options.id) === "RUNNING") {
    	              clearTimeout(v.timeout);
    	              clearTimeout(v.expiration);
    	              v.job.doDrop({
    	                message: options.dropErrorMessage
    	              });
    	            }
    	          }
    	          this._dropAllQueued(options.dropErrorMessage);
    	          return waitForExecuting(0);
    	        });
    	      })) : this.schedule({
    	        priority: NUM_PRIORITIES$1 - 1,
    	        weight: 0
    	      }, () => {
    	        return waitForExecuting(1);
    	      });
    	      this._receive = function(job) {
    	        return job._reject(new Bottleneck.prototype.BottleneckError(options.enqueueErrorMessage));
    	      };
    	      this.stop = () => {
    	        return this.Promise.reject(new Bottleneck.prototype.BottleneckError("stop() has already been called"));
    	      };
    	      return done;
    	    }

    	    async _addToQueue(job) {
    	      var args, blocked, error, options, reachedHWM, shifted, strategy;
    	      ({args, options} = job);
    	      try {
    	        ({reachedHWM, blocked, strategy} = (await this._store.__submit__(this.queued(), options.weight)));
    	      } catch (error1) {
    	        error = error1;
    	        this.Events.trigger("debug", `Could not queue ${options.id}`, {args, options, error});
    	        job.doDrop({error});
    	        return false;
    	      }
    	      if (blocked) {
    	        job.doDrop();
    	        return true;
    	      } else if (reachedHWM) {
    	        shifted = strategy === Bottleneck.prototype.strategy.LEAK ? this._queues.shiftLastFrom(options.priority) : strategy === Bottleneck.prototype.strategy.OVERFLOW_PRIORITY ? this._queues.shiftLastFrom(options.priority + 1) : strategy === Bottleneck.prototype.strategy.OVERFLOW ? job : void 0;
    	        if (shifted != null) {
    	          shifted.doDrop();
    	        }
    	        if ((shifted == null) || strategy === Bottleneck.prototype.strategy.OVERFLOW) {
    	          if (shifted == null) {
    	            job.doDrop();
    	          }
    	          return reachedHWM;
    	        }
    	      }
    	      job.doQueue(reachedHWM, blocked);
    	      this._queues.push(job);
    	      await this._drainAll();
    	      return reachedHWM;
    	    }

    	    _receive(job) {
    	      if (this._states.jobStatus(job.options.id) != null) {
    	        job._reject(new Bottleneck.prototype.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
    	        return false;
    	      } else {
    	        job.doReceive();
    	        return this._submitLock.schedule(this._addToQueue, job);
    	      }
    	    }

    	    submit(...args) {
    	      var cb, fn, job, options, ref, ref1, task;
    	      if (typeof args[0] === "function") {
    	        ref = args, [fn, ...args] = ref, [cb] = splice.call(args, -1);
    	        options = parser$5.load({}, this.jobDefaults);
    	      } else {
    	        ref1 = args, [options, fn, ...args] = ref1, [cb] = splice.call(args, -1);
    	        options = parser$5.load(options, this.jobDefaults);
    	      }
    	      task = (...args) => {
    	        return new this.Promise(function(resolve, reject) {
    	          return fn(...args, function(...args) {
    	            return (args[0] != null ? reject : resolve)(args);
    	          });
    	        });
    	      };
    	      job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    	      job.promise.then(function(args) {
    	        return typeof cb === "function" ? cb(...args) : void 0;
    	      }).catch(function(args) {
    	        if (Array.isArray(args)) {
    	          return typeof cb === "function" ? cb(...args) : void 0;
    	        } else {
    	          return typeof cb === "function" ? cb(args) : void 0;
    	        }
    	      });
    	      return this._receive(job);
    	    }

    	    schedule(...args) {
    	      var job, options, task;
    	      if (typeof args[0] === "function") {
    	        [task, ...args] = args;
    	        options = {};
    	      } else {
    	        [options, task, ...args] = args;
    	      }
    	      job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    	      this._receive(job);
    	      return job.promise;
    	    }

    	    wrap(fn) {
    	      var schedule, wrapped;
    	      schedule = this.schedule.bind(this);
    	      wrapped = function(...args) {
    	        return schedule(fn.bind(this), ...args);
    	      };
    	      wrapped.withOptions = function(options, ...args) {
    	        return schedule(options, fn, ...args);
    	      };
    	      return wrapped;
    	    }

    	    async updateSettings(options = {}) {
    	      await this._store.__updateSettings__(parser$5.overwrite(options, this.storeDefaults));
    	      parser$5.overwrite(options, this.instanceDefaults, this);
    	      return this;
    	    }

    	    currentReservoir() {
    	      return this._store.__currentReservoir__();
    	    }

    	    incrementReservoir(incr = 0) {
    	      return this._store.__incrementReservoir__(incr);
    	    }

    	  }
    	  Bottleneck.default = Bottleneck;

    	  Bottleneck.Events = Events$4;

    	  Bottleneck.version = Bottleneck.prototype.version = require$$8.version;

    	  Bottleneck.strategy = Bottleneck.prototype.strategy = {
    	    LEAK: 1,
    	    OVERFLOW: 2,
    	    OVERFLOW_PRIORITY: 4,
    	    BLOCK: 3
    	  };

    	  Bottleneck.BottleneckError = Bottleneck.prototype.BottleneckError = BottleneckError_1;

    	  Bottleneck.Group = Bottleneck.prototype.Group = Group_1;

    	  Bottleneck.RedisConnection = Bottleneck.prototype.RedisConnection = require$$2;

    	  Bottleneck.IORedisConnection = Bottleneck.prototype.IORedisConnection = require$$3;

    	  Bottleneck.Batcher = Bottleneck.prototype.Batcher = Batcher_1;

    	  Bottleneck.prototype.jobDefaults = {
    	    priority: DEFAULT_PRIORITY$1,
    	    weight: 1,
    	    expiration: null,
    	    id: "<no-id>"
    	  };

    	  Bottleneck.prototype.storeDefaults = {
    	    maxConcurrent: null,
    	    minTime: 0,
    	    highWater: null,
    	    strategy: Bottleneck.prototype.strategy.LEAK,
    	    penalty: null,
    	    reservoir: null,
    	    reservoirRefreshInterval: null,
    	    reservoirRefreshAmount: null,
    	    reservoirIncreaseInterval: null,
    	    reservoirIncreaseAmount: null,
    	    reservoirIncreaseMaximum: null
    	  };

    	  Bottleneck.prototype.localStoreDefaults = {
    	    Promise: Promise,
    	    timeout: null,
    	    heartbeatInterval: 250
    	  };

    	  Bottleneck.prototype.redisStoreDefaults = {
    	    Promise: Promise,
    	    timeout: null,
    	    heartbeatInterval: 5000,
    	    clientTimeout: 10000,
    	    Redis: null,
    	    clientOptions: {},
    	    clusterNodes: null,
    	    clearDatastore: false,
    	    connection: null
    	  };

    	  Bottleneck.prototype.instanceDefaults = {
    	    datastore: "local",
    	    connection: null,
    	    id: "<no-id>",
    	    rejectOnDrop: true,
    	    trackDoneStatus: false,
    	    Promise: Promise
    	  };

    	  Bottleneck.prototype.stopDefaults = {
    	    enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
    	    dropWaitingJobs: true,
    	    dropErrorMessage: "This limiter has been stopped."
    	  };

    	  return Bottleneck;

    	}).call(commonjsGlobal$1);

    	var Bottleneck_1 = Bottleneck;

    	var lib = Bottleneck_1;

    	return lib;

    })));
    });

    // @ts-ignore
    async function errorRequest(octokit, state, error, options) {
        if (!error.request || !error.request.request) {
            // address https://github.com/octokit/plugin-retry.js/issues/8
            throw error;
        }
        // retry all >= 400 && not doNotRetry
        if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
            const retries = options.request.retries != null ? options.request.retries : state.retries;
            const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
            throw octokit.retry.retryRequest(error, retries, retryAfter);
        }
        // Maybe eventually there will be more cases here
        throw error;
    }

    // @ts-ignore
    // @ts-ignore
    async function wrapRequest$1(state, request, options) {
        const limiter = new light();
        // @ts-ignore
        limiter.on("failed", function (error, info) {
            const maxRetries = ~~error.request.request.retries;
            const after = ~~error.request.request.retryAfter;
            options.request.retryCount = info.retryCount + 1;
            if (maxRetries > info.retryCount) {
                // Returning a number instructs the limiter to retry
                // the request after that number of milliseconds have passed
                return after * state.retryAfterBaseValue;
            }
        });
        return limiter.schedule(requestWithGraphqlErrorHandling.bind(null, request), options);
    }
    // @ts-ignore
    async function requestWithGraphqlErrorHandling(request, options) {
        const response = await request(request, options);
        if (response.data &&
            response.data.errors &&
            /Something went wrong while executing your query/.test(response.data.errors[0].message)) {
            // simulate 500 request error for retry handling
            const error = new RequestError(response.data.errors[0].message, 500, {
                request: options,
                response,
            });
            throw error;
        }
        return response;
    }

    const VERSION$9 = "4.1.1";
    function retry(octokit, octokitOptions) {
        const state = Object.assign({
            enabled: true,
            retryAfterBaseValue: 1000,
            doNotRetry: [400, 401, 403, 404, 422],
            retries: 3,
        }, octokitOptions.retry);
        if (state.enabled) {
            octokit.hook.error("request", errorRequest.bind(null, octokit, state));
            octokit.hook.wrap("request", wrapRequest$1.bind(null, state));
        }
        return {
            retry: {
                retryRequest: (error, retries, retryAfter) => {
                    error.request.request = Object.assign({}, error.request.request, {
                        retries: retries,
                        retryAfter: retryAfter,
                    });
                    return error;
                },
            },
        };
    }
    retry.VERSION = VERSION$9;

    const VERSION$8 = "5.0.1";

    const noop = () => Promise.resolve();
    // @ts-expect-error
    function wrapRequest(state, request, options) {
        return state.retryLimiter.schedule(doRequest, state, request, options);
    }
    // @ts-expect-error
    async function doRequest(state, request, options) {
        const isWrite = options.method !== "GET" && options.method !== "HEAD";
        const { pathname } = new URL(options.url, "http://github.test");
        const isSearch = options.method === "GET" && pathname.startsWith("/search/");
        const isGraphQL = pathname.startsWith("/graphql");
        const retryCount = ~~request.retryCount;
        const jobOptions = retryCount > 0 ? { priority: 0, weight: 0 } : {};
        if (state.clustering) {
            // Remove a job from Redis if it has not completed or failed within 60s
            // Examples: Node process terminated, client disconnected, etc.
            // @ts-expect-error
            jobOptions.expiration = 1000 * 60;
        }
        // Guarantee at least 1000ms between writes
        // GraphQL can also trigger writes
        if (isWrite || isGraphQL) {
            await state.write.key(state.id).schedule(jobOptions, noop);
        }
        // Guarantee at least 3000ms between requests that trigger notifications
        if (isWrite && state.triggersNotification(pathname)) {
            await state.notifications.key(state.id).schedule(jobOptions, noop);
        }
        // Guarantee at least 2000ms between search requests
        if (isSearch) {
            await state.search.key(state.id).schedule(jobOptions, noop);
        }
        const req = state.global.key(state.id).schedule(jobOptions, request, options);
        if (isGraphQL) {
            const res = await req;
            if (res.data.errors != null &&
                // @ts-expect-error
                res.data.errors.some((error) => error.type === "RATE_LIMITED")) {
                const error = Object.assign(new Error("GraphQL Rate Limit Exceeded"), {
                    response: res,
                    data: res.data,
                });
                throw error;
            }
        }
        return req;
    }

    var triggersNotificationPaths = [
        "/orgs/{org}/invitations",
        "/orgs/{org}/invitations/{invitation_id}",
        "/orgs/{org}/teams/{team_slug}/discussions",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
        "/repos/{owner}/{repo}/collaborators/{username}",
        "/repos/{owner}/{repo}/commits/{commit_sha}/comments",
        "/repos/{owner}/{repo}/issues",
        "/repos/{owner}/{repo}/issues/{issue_number}/comments",
        "/repos/{owner}/{repo}/pulls",
        "/repos/{owner}/{repo}/pulls/{pull_number}/comments",
        "/repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
        "/repos/{owner}/{repo}/pulls/{pull_number}/merge",
        "/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        "/repos/{owner}/{repo}/releases",
        "/teams/{team_id}/discussions",
        "/teams/{team_id}/discussions/{discussion_number}/comments",
    ];

    function routeMatcher$1(paths) {
        // EXAMPLE. For the following paths:
        /* [
            "/orgs/{org}/invitations",
            "/repos/{owner}/{repo}/collaborators/{username}"
        ] */
        const regexes = paths.map((path) => path
            .split("/")
            .map((c) => (c.startsWith("{") ? "(?:.+?)" : c))
            .join("/"));
        // 'regexes' would contain:
        /* [
            '/orgs/(?:.+?)/invitations',
            '/repos/(?:.+?)/(?:.+?)/collaborators/(?:.+?)'
        ] */
        const regex = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})[^/]*$`;
        // 'regex' would contain:
        /*
          ^(?:(?:\/orgs\/(?:.+?)\/invitations)|(?:\/repos\/(?:.+?)\/(?:.+?)\/collaborators\/(?:.+?)))[^\/]*$
      
          It may look scary, but paste it into https://www.debuggex.com/
          and it will make a lot more sense!
        */
        return new RegExp(regex, "i");
    }

    // @ts-expect-error
    // Workaround to allow tests to directly access the triggersNotification function.
    const regex = routeMatcher$1(triggersNotificationPaths);
    const triggersNotification = regex.test.bind(regex);
    const groups = {};
    // @ts-expect-error
    const createGroups = function (Bottleneck, common) {
        groups.global = new Bottleneck.Group({
            id: "octokit-global",
            maxConcurrent: 10,
            ...common,
        });
        groups.search = new Bottleneck.Group({
            id: "octokit-search",
            maxConcurrent: 1,
            minTime: 2000,
            ...common,
        });
        groups.write = new Bottleneck.Group({
            id: "octokit-write",
            maxConcurrent: 1,
            minTime: 1000,
            ...common,
        });
        groups.notifications = new Bottleneck.Group({
            id: "octokit-notifications",
            maxConcurrent: 1,
            minTime: 3000,
            ...common,
        });
    };
    function throttling(octokit, octokitOptions) {
        const { enabled = true, Bottleneck = light, id = "no-id", timeout = 1000 * 60 * 2, // Redis TTL: 2 minutes
        connection, } = octokitOptions.throttle || {};
        if (!enabled) {
            return {};
        }
        const common = { connection, timeout };
        if (groups.global == null) {
            createGroups(Bottleneck, common);
        }
        const state = Object.assign({
            clustering: connection != null,
            triggersNotification,
            minimumSecondaryRateRetryAfter: 5,
            retryAfterBaseValue: 1000,
            retryLimiter: new Bottleneck(),
            id,
            ...groups,
        }, octokitOptions.throttle);
        const isUsingDeprecatedOnAbuseLimitHandler = typeof state.onAbuseLimit === "function" && state.onAbuseLimit;
        if (typeof (isUsingDeprecatedOnAbuseLimitHandler
            ? state.onAbuseLimit
            : state.onSecondaryRateLimit) !== "function" ||
            typeof state.onRateLimit !== "function") {
            throw new Error(`octokit/plugin-throttling error:
        You must pass the onSecondaryRateLimit and onRateLimit error handlers.
        See https://octokit.github.io/rest.js/#throttling

        const octokit = new Octokit({
          throttle: {
            onSecondaryRateLimit: (retryAfter, options) => {/* ... */},
            onRateLimit: (retryAfter, options) => {/* ... */}
          }
        })
    `);
        }
        const events = {};
        const emitter = new Bottleneck.Events(events);
        // @ts-expect-error
        events.on("secondary-limit", isUsingDeprecatedOnAbuseLimitHandler
            ? function (...args) {
                octokit.log.warn("[@octokit/plugin-throttling] `onAbuseLimit()` is deprecated and will be removed in a future release of `@octokit/plugin-throttling`, please use the `onSecondaryRateLimit` handler instead");
                // @ts-expect-error
                return state.onAbuseLimit(...args);
            }
            : state.onSecondaryRateLimit);
        // @ts-expect-error
        events.on("rate-limit", state.onRateLimit);
        // @ts-expect-error
        events.on("error", (e) => octokit.log.warn("Error in throttling-plugin limit handler", e));
        // @ts-expect-error
        state.retryLimiter.on("failed", async function (error, info) {
            const [state, request, options] = info.args;
            const { pathname } = new URL(options.url, "http://github.test");
            const shouldRetryGraphQL = pathname.startsWith("/graphql") && error.status !== 401;
            if (!(shouldRetryGraphQL || error.status === 403)) {
                return;
            }
            const retryCount = ~~request.retryCount;
            request.retryCount = retryCount;
            // backward compatibility
            options.request.retryCount = retryCount;
            const { wantRetry, retryAfter = 0 } = await (async function () {
                if (/\bsecondary rate\b/i.test(error.message)) {
                    // The user has hit the secondary rate limit. (REST and GraphQL)
                    // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#secondary-rate-limits
                    // The Retry-After header can sometimes be blank when hitting a secondary rate limit,
                    // but is always present after 2-3s, so make sure to set `retryAfter` to at least 5s by default.
                    const retryAfter = Math.max(~~error.response.headers["retry-after"], state.minimumSecondaryRateRetryAfter);
                    const wantRetry = await emitter.trigger("secondary-limit", retryAfter, options, octokit, retryCount);
                    return { wantRetry, retryAfter };
                }
                if (error.response.headers != null &&
                    error.response.headers["x-ratelimit-remaining"] === "0") {
                    // The user has used all their allowed calls for the current time period (REST and GraphQL)
                    // https://docs.github.com/en/rest/reference/rate-limit (REST)
                    // https://docs.github.com/en/graphql/overview/resource-limitations#rate-limit (GraphQL)
                    const rateLimitReset = new Date(~~error.response.headers["x-ratelimit-reset"] * 1000).getTime();
                    const retryAfter = Math.max(Math.ceil((rateLimitReset - Date.now()) / 1000), 0);
                    const wantRetry = await emitter.trigger("rate-limit", retryAfter, options, octokit, retryCount);
                    return { wantRetry, retryAfter };
                }
                return {};
            })();
            if (wantRetry) {
                request.retryCount++;
                return retryAfter * state.retryAfterBaseValue;
            }
        });
        octokit.hook.wrap("request", wrapRequest.bind(null, state));
        return {};
    }
    throttling.VERSION = VERSION$8;
    throttling.triggersNotification = triggersNotification;

    var btoaBrowser = function _btoa(str) {
      return btoa(str)
    };

    function oauthAuthorizationUrl$1(options) {
        const clientType = options.clientType || "oauth-app";
        const baseUrl = options.baseUrl || "https://github.com";
        const result = {
            clientType,
            allowSignup: options.allowSignup === false ? false : true,
            clientId: options.clientId,
            login: options.login || null,
            redirectUrl: options.redirectUrl || null,
            state: options.state || Math.random().toString(36).substr(2),
            url: "",
        };
        if (clientType === "oauth-app") {
            const scopes = "scopes" in options ? options.scopes : [];
            result.scopes =
                typeof scopes === "string"
                    ? scopes.split(/[,\s]+/).filter(Boolean)
                    : scopes;
        }
        result.url = urlBuilderAuthorize(`${baseUrl}/login/oauth/authorize`, result);
        return result;
    }
    function urlBuilderAuthorize(base, options) {
        const map = {
            allowSignup: "allow_signup",
            clientId: "client_id",
            login: "login",
            redirectUrl: "redirect_uri",
            scopes: "scope",
            state: "state",
        };
        let url = base;
        Object.keys(map)
            // Filter out keys that are null and remove the url key
            .filter((k) => options[k] !== null)
            // Filter out empty scopes array
            .filter((k) => {
            if (k !== "scopes")
                return true;
            if (options.clientType === "github-app")
                return false;
            return !Array.isArray(options[k]) || options[k].length > 0;
        })
            // Map Array with the proper URL parameter names and change the value to a string using template strings
            // @ts-ignore
            .map((key) => [map[key], `${options[key]}`])
            // Finally, build the URL
            .forEach(([key, value], index) => {
            url += index === 0 ? `?` : "&";
            url += `${key}=${encodeURIComponent(value)}`;
        });
        return url;
    }

    var distWeb$5 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        oauthAuthorizationUrl: oauthAuthorizationUrl$1
    });

    var oauthAuthorizationUrl = /*@__PURE__*/getAugmentedNamespace(distWeb$5);

    var request = /*@__PURE__*/getAugmentedNamespace(distWeb$8);

    var requestError = /*@__PURE__*/getAugmentedNamespace(distWeb$9);

    function _interopDefault$2 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }




    var btoa$1 = _interopDefault$2(btoaBrowser);

    const VERSION$7 = "2.0.5";

    function requestToOAuthBaseUrl(request) {
      const endpointDefaults = request.endpoint.DEFAULTS;
      return /^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl) ? "https://github.com" : endpointDefaults.baseUrl.replace("/api/v3", "");
    }
    async function oauthRequest(request, route, parameters) {
      const withOAuthParameters = {
        baseUrl: requestToOAuthBaseUrl(request),
        headers: {
          accept: "application/json"
        },
        ...parameters
      };
      const response = await request(route, withOAuthParameters);
      if ("error" in response.data) {
        const error = new requestError.RequestError(`${response.data.error_description} (${response.data.error}, ${response.data.error_uri})`, 400, {
          request: request.endpoint.merge(route, withOAuthParameters),
          headers: response.headers
        });
        // @ts-ignore add custom response property until https://github.com/octokit/request-error.js/issues/169 is resolved
        error.response = response;
        throw error;
      }
      return response;
    }

    function getWebFlowAuthorizationUrl({
      request: request$1 = request.request,
      ...options
    }) {
      const baseUrl = requestToOAuthBaseUrl(request$1);
      // @ts-expect-error TypeScript wants `clientType` to be set explicitly ¯\_(ツ)_/¯
      return oauthAuthorizationUrl.oauthAuthorizationUrl({
        ...options,
        baseUrl
      });
    }

    async function exchangeWebFlowCode(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        code: options.code,
        redirect_uri: options.redirectUrl
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.access_token,
        scopes: response.data.scope.split(/\s+/).filter(Boolean)
      };
      if (options.clientType === "github-app") {
        if ("refresh_token" in response.data) {
          const apiTimeInMs = new Date(response.headers.date).getTime();
          authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp(apiTimeInMs, response.data.refresh_token_expires_in);
        }
        delete authentication.scopes;
      }
      return {
        ...response,
        authentication
      };
    }
    function toTimestamp(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    async function createDeviceCode(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const parameters = {
        client_id: options.clientId
      };
      if ("scopes" in options && Array.isArray(options.scopes)) {
        parameters.scope = options.scopes.join(" ");
      }
      return oauthRequest(request$1, "POST /login/device/code", parameters);
    }

    async function exchangeDeviceCode(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        device_code: options.code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        token: response.data.access_token,
        scopes: response.data.scope.split(/\s+/).filter(Boolean)
      };
      if ("clientSecret" in options) {
        authentication.clientSecret = options.clientSecret;
      }
      if (options.clientType === "github-app") {
        if ("refresh_token" in response.data) {
          const apiTimeInMs = new Date(response.headers.date).getTime();
          authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp$1(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp$1(apiTimeInMs, response.data.refresh_token_expires_in);
        }
        delete authentication.scopes;
      }
      return {
        ...response,
        authentication
      };
    }
    function toTimestamp$1(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    async function checkToken(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await request$1("POST /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${btoa$1(`${options.clientId}:${options.clientSecret}`)}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: options.token,
        scopes: response.data.scopes
      };
      if (response.data.expires_at) authentication.expiresAt = response.data.expires_at;
      if (options.clientType === "github-app") {
        delete authentication.scopes;
      }
      return {
        ...response,
        authentication
      };
    }

    async function refreshToken(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        grant_type: "refresh_token",
        refresh_token: options.refreshToken
      });
      const apiTimeInMs = new Date(response.headers.date).getTime();
      const authentication = {
        clientType: "github-app",
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: toTimestamp$2(apiTimeInMs, response.data.expires_in),
        refreshTokenExpiresAt: toTimestamp$2(apiTimeInMs, response.data.refresh_token_expires_in)
      };
      return {
        ...response,
        authentication
      };
    }
    function toTimestamp$2(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    async function scopeToken(options) {
      const {
        request: optionsRequest,
        clientType,
        clientId,
        clientSecret,
        token,
        ...requestOptions
      } = options;
      const request$1 = optionsRequest || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await request$1("POST /applications/{client_id}/token/scoped", {
        headers: {
          authorization: `basic ${btoa$1(`${clientId}:${clientSecret}`)}`
        },
        client_id: clientId,
        access_token: token,
        ...requestOptions
      });
      const authentication = Object.assign({
        clientType,
        clientId,
        clientSecret,
        token: response.data.token
      }, response.data.expires_at ? {
        expiresAt: response.data.expires_at
      } : {});
      return {
        ...response,
        authentication
      };
    }

    async function resetToken(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      const response = await request$1("PATCH /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.token,
        scopes: response.data.scopes
      };
      if (response.data.expires_at) authentication.expiresAt = response.data.expires_at;
      if (options.clientType === "github-app") {
        delete authentication.scopes;
      }
      return {
        ...response,
        authentication
      };
    }

    async function deleteToken(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      return request$1("DELETE /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
    }

    async function deleteAuthorization(options) {
      const request$1 = options.request || /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      return request$1("DELETE /applications/{client_id}/grant", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
    }

    var VERSION_1 = VERSION$7;
    var checkToken_1 = checkToken;
    var createDeviceCode_1 = createDeviceCode;
    var deleteAuthorization_1 = deleteAuthorization;
    var deleteToken_1 = deleteToken;
    var exchangeDeviceCode_1 = exchangeDeviceCode;
    var exchangeWebFlowCode_1 = exchangeWebFlowCode;
    var getWebFlowAuthorizationUrl_1 = getWebFlowAuthorizationUrl;
    var refreshToken_1 = refreshToken;
    var resetToken_1 = resetToken;
    var scopeToken_1 = scopeToken;


    var distNode$1 = /*#__PURE__*/Object.defineProperty({
    	VERSION: VERSION_1,
    	checkToken: checkToken_1,
    	createDeviceCode: createDeviceCode_1,
    	deleteAuthorization: deleteAuthorization_1,
    	deleteToken: deleteToken_1,
    	exchangeDeviceCode: exchangeDeviceCode_1,
    	exchangeWebFlowCode: exchangeWebFlowCode_1,
    	getWebFlowAuthorizationUrl: getWebFlowAuthorizationUrl_1,
    	refreshToken: refreshToken_1,
    	resetToken: resetToken_1,
    	scopeToken: scopeToken_1
    }, '__esModule', {value: true});

    async function getOAuthAccessToken(state, options) {
        const cachedAuthentication = getCachedAuthentication(state, options.auth);
        if (cachedAuthentication)
            return cachedAuthentication;
        // Step 1: Request device and user codes
        // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-1-app-requests-the-device-and-user-verification-codes-from-github
        const { data: verification } = await createDeviceCode_1({
            clientType: state.clientType,
            clientId: state.clientId,
            request: options.request || state.request,
            // @ts-expect-error the extra code to make TS happy is not worth it
            scopes: options.auth.scopes || state.scopes,
        });
        // Step 2: User must enter the user code on https://github.com/login/device
        // See https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-2-prompt-the-user-to-enter-the-user-code-in-a-browser
        await state.onVerification(verification);
        // Step 3: Exchange device code for access token
        // See https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-3-app-polls-github-to-check-if-the-user-authorized-the-device
        const authentication = await waitForAccessToken(options.request || state.request, state.clientId, state.clientType, verification);
        state.authentication = authentication;
        return authentication;
    }
    function getCachedAuthentication(state, auth) {
        if (auth.refresh === true)
            return false;
        if (!state.authentication)
            return false;
        if (state.clientType === "github-app") {
            return state.authentication;
        }
        const authentication = state.authentication;
        const newScope = (("scopes" in auth && auth.scopes) || state.scopes).join(" ");
        const currentScope = authentication.scopes.join(" ");
        return newScope === currentScope ? authentication : false;
    }
    async function wait(seconds) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
    async function waitForAccessToken(request, clientId, clientType, verification) {
        try {
            const options = {
                clientId,
                request,
                code: verification.device_code,
            };
            // WHY TYPESCRIPT WHY ARE YOU DOING THIS TO ME
            const { authentication } = clientType === "oauth-app"
                ? await exchangeDeviceCode_1({
                    ...options,
                    clientType: "oauth-app",
                })
                : await exchangeDeviceCode_1({
                    ...options,
                    clientType: "github-app",
                });
            return {
                type: "token",
                tokenType: "oauth",
                ...authentication,
            };
        }
        catch (error) {
            // istanbul ignore if
            // @ts-ignore
            if (!error.response)
                throw error;
            // @ts-ignore
            const errorType = error.response.data.error;
            if (errorType === "authorization_pending") {
                await wait(verification.interval);
                return waitForAccessToken(request, clientId, clientType, verification);
            }
            if (errorType === "slow_down") {
                await wait(verification.interval + 5);
                return waitForAccessToken(request, clientId, clientType, verification);
            }
            throw error;
        }
    }

    async function auth$4(state, authOptions) {
        return getOAuthAccessToken(state, {
            auth: authOptions,
        });
    }

    async function hook$4(state, request, route, parameters) {
        let endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept request to retrieve codes or token
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        const { token } = await getOAuthAccessToken(state, {
            request,
            auth: { type: "oauth" },
        });
        endpoint.headers.authorization = `token ${token}`;
        return request(endpoint);
    }

    const VERSION$6 = "4.0.4";

    function createOAuthDeviceAuth(options) {
        const requestWithDefaults = options.request ||
            request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-oauth-device.js/${VERSION$6} ${getUserAgent()}`,
                },
            });
        const { request: request$1$1 = requestWithDefaults, ...otherOptions } = options;
        const state = options.clientType === "github-app"
            ? {
                ...otherOptions,
                clientType: "github-app",
                request: request$1$1,
            }
            : {
                ...otherOptions,
                clientType: "oauth-app",
                request: request$1$1,
                scopes: options.scopes || [],
            };
        if (!options.clientId) {
            throw new Error('[@octokit/auth-oauth-device] "clientId" option must be set (https://github.com/octokit/auth-oauth-device.js#usage)');
        }
        if (!options.onVerification) {
            throw new Error('[@octokit/auth-oauth-device] "onVerification" option must be a function (https://github.com/octokit/auth-oauth-device.js#usage)');
        }
        // @ts-ignore too much for tsc / ts-jest ¯\_(ツ)_/¯
        return Object.assign(auth$4.bind(null, state), {
            hook: hook$4.bind(null, state),
        });
    }

    const VERSION$5 = "2.1.1";

    // @ts-nocheck there is only place for one of us in this file. And it's not you, TS
    async function getAuthentication(state) {
        // handle code exchange form OAuth Web Flow
        if ("code" in state.strategyOptions) {
            const { authentication } = await exchangeWebFlowCode_1({
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                onTokenCreated: state.onTokenCreated,
                ...state.strategyOptions,
                request: state.request,
            });
            return {
                type: "token",
                tokenType: "oauth",
                ...authentication,
            };
        }
        // handle OAuth device flow
        if ("onVerification" in state.strategyOptions) {
            const deviceAuth = createOAuthDeviceAuth({
                clientType: state.clientType,
                clientId: state.clientId,
                onTokenCreated: state.onTokenCreated,
                ...state.strategyOptions,
                request: state.request,
            });
            const authentication = await deviceAuth({
                type: "oauth",
            });
            return {
                clientSecret: state.clientSecret,
                ...authentication,
            };
        }
        // use existing authentication
        if ("token" in state.strategyOptions) {
            return {
                type: "token",
                tokenType: "oauth",
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                onTokenCreated: state.onTokenCreated,
                ...state.strategyOptions,
            };
        }
        throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
    }

    async function auth$3(state, options = {}) {
        if (!state.authentication) {
            // This is what TS makes us do ¯\_(ツ)_/¯
            state.authentication =
                state.clientType === "oauth-app"
                    ? await getAuthentication(state)
                    : await getAuthentication(state);
        }
        if (state.authentication.invalid) {
            throw new Error("[@octokit/auth-oauth-user] Token is invalid");
        }
        const currentAuthentication = state.authentication;
        // (auto) refresh for user-to-server tokens
        if ("expiresAt" in currentAuthentication) {
            if (options.type === "refresh" ||
                new Date(currentAuthentication.expiresAt) < new Date()) {
                const { authentication } = await refreshToken_1({
                    clientType: "github-app",
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    refreshToken: currentAuthentication.refreshToken,
                    request: state.request,
                });
                state.authentication = {
                    tokenType: "oauth",
                    type: "token",
                    ...authentication,
                };
            }
        }
        // throw error for invalid refresh call
        if (options.type === "refresh") {
            if (state.clientType === "oauth-app") {
                throw new Error("[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens");
            }
            if (!currentAuthentication.hasOwnProperty("expiresAt")) {
                throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
            }
            await state.onTokenCreated?.(state.authentication, {
                type: options.type,
            });
        }
        // check or reset token
        if (options.type === "check" || options.type === "reset") {
            const method = options.type === "check" ? checkToken_1 : resetToken_1;
            try {
                const { authentication } = await method({
                    // @ts-expect-error making TS happy would require unnecessary code so no
                    clientType: state.clientType,
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    token: state.authentication.token,
                    request: state.request,
                });
                state.authentication = {
                    tokenType: "oauth",
                    type: "token",
                    // @ts-expect-error TBD
                    ...authentication,
                };
                if (options.type === "reset") {
                    await state.onTokenCreated?.(state.authentication, {
                        type: options.type,
                    });
                }
                return state.authentication;
            }
            catch (error) {
                // istanbul ignore else
                if (error.status === 404) {
                    error.message = "[@octokit/auth-oauth-user] Token is invalid";
                    // @ts-expect-error TBD
                    state.authentication.invalid = true;
                }
                throw error;
            }
        }
        // invalidate
        if (options.type === "delete" || options.type === "deleteAuthorization") {
            const method = options.type === "delete" ? deleteToken_1 : deleteAuthorization_1;
            try {
                await method({
                    // @ts-expect-error making TS happy would require unnecessary code so no
                    clientType: state.clientType,
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    token: state.authentication.token,
                    request: state.request,
                });
            }
            catch (error) {
                // istanbul ignore if
                if (error.status !== 404)
                    throw error;
            }
            state.authentication.invalid = true;
            return state.authentication;
        }
        return state.authentication;
    }

    /**
     * The following endpoints require an OAuth App to authenticate using its client_id and client_secret.
     *
     * - [`POST /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#check-a-token) - Check a token
     * - [`PATCH /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#reset-a-token) - Reset a token
     * - [`POST /applications/{client_id}/token/scoped`](https://docs.github.com/en/rest/reference/apps#create-a-scoped-access-token) - Create a scoped access token
     * - [`DELETE /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#delete-an-app-token) - Delete an app token
     * - [`DELETE /applications/{client_id}/grant`](https://docs.github.com/en/rest/reference/apps#delete-an-app-authorization) - Delete an app authorization
     *
     * deprecated:
     *
     * - [`GET /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#check-an-authorization) - Check an authorization
     * - [`POST /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#reset-an-authorization) - Reset an authorization
     * - [`DELETE /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#revoke-an-authorization-for-an-application) - Revoke an authorization for an application
     * - [`DELETE /applications/{client_id}/grants/{access_token}`](https://docs.github.com/en/rest/reference/apps#revoke-a-grant-for-an-application) - Revoke a grant for an application
     */
    const ROUTES_REQUIRING_BASIC_AUTH = /\/applications\/[^/]+\/(token|grant)s?/;
    function requiresBasicAuth(url) {
        return url && ROUTES_REQUIRING_BASIC_AUTH.test(url);
    }

    async function hook$3(state, request, route, parameters = {}) {
        const endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept OAuth Web/Device flow request
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        if (requiresBasicAuth(endpoint.url)) {
            const credentials = btoaBrowser(`${state.clientId}:${state.clientSecret}`);
            endpoint.headers.authorization = `basic ${credentials}`;
            return request(endpoint);
        }
        // TS makes us do this ¯\_(ツ)_/¯
        const { token } = state.clientType === "oauth-app"
            ? await auth$3({ ...state, request })
            : await auth$3({ ...state, request });
        endpoint.headers.authorization = "token " + token;
        return request(endpoint);
    }

    function createOAuthUserAuth({ clientId, clientSecret, clientType = "oauth-app", request: request$1$1 = request$1.defaults({
        headers: {
            "user-agent": `octokit-auth-oauth-app.js/${VERSION$5} ${getUserAgent()}`,
        },
    }), onTokenCreated, ...strategyOptions }) {
        const state = Object.assign({
            clientType,
            clientId,
            clientSecret,
            onTokenCreated,
            strategyOptions,
            request: request$1$1,
        });
        // @ts-expect-error not worth the extra code needed to appease TS
        return Object.assign(auth$3.bind(null, state), {
            // @ts-expect-error not worth the extra code needed to appease TS
            hook: hook$3.bind(null, state),
        });
    }
    createOAuthUserAuth.VERSION = VERSION$5;

    var distWeb$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createOAuthUserAuth: createOAuthUserAuth,
        requiresBasicAuth: requiresBasicAuth
    });

    async function auth$2(state, authOptions) {
        if (authOptions.type === "oauth-app") {
            return {
                type: "oauth-app",
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                headers: {
                    authorization: `basic ${btoaBrowser(`${state.clientId}:${state.clientSecret}`)}`,
                },
            };
        }
        if ("factory" in authOptions) {
            const { type, ...options } = {
                ...authOptions,
                ...state,
            };
            // @ts-expect-error TODO: `option` cannot be never, is this a bug?
            return authOptions.factory(options);
        }
        const common = {
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            request: state.request,
            ...authOptions,
        };
        // TS: Look what you made me do
        const userAuth = state.clientType === "oauth-app"
            ? await createOAuthUserAuth({
                ...common,
                clientType: state.clientType,
            })
            : await createOAuthUserAuth({
                ...common,
                clientType: state.clientType,
            });
        return userAuth();
    }

    async function hook$2(state, request, route, parameters) {
        let endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept OAuth Web/Device flow request
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        if (state.clientType === "github-app" && !requiresBasicAuth(endpoint.url)) {
            throw new Error(`[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint.method} ${endpoint.url}" is not supported.`);
        }
        const credentials = btoaBrowser(`${state.clientId}:${state.clientSecret}`);
        endpoint.headers.authorization = `basic ${credentials}`;
        try {
            return await request(endpoint);
        }
        catch (error) {
            /* istanbul ignore if */
            if (error.status !== 401)
                throw error;
            error.message = `[@octokit/auth-oauth-app] "${endpoint.method} ${endpoint.url}" does not support clientId/clientSecret basic authentication.`;
            throw error;
        }
    }

    const VERSION$4 = "5.0.5";

    function createOAuthAppAuth(options) {
        const state = Object.assign({
            request: request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-oauth-app.js/${VERSION$4} ${getUserAgent()}`,
                },
            }),
            clientType: "oauth-app",
        }, options);
        // @ts-expect-error not worth the extra code to appease TS
        return Object.assign(auth$2.bind(null, state), {
            hook: hook$2.bind(null, state),
        });
    }

    var distWeb$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createOAuthAppAuth: createOAuthAppAuth,
        createOAuthUserAuth: createOAuthUserAuth
    });

    function t(t,n,r,e,i,a,o){try{var u=t[a](o),c=u.value;}catch(t){return void r(t)}u.done?n(c):Promise.resolve(c).then(e,i);}function n(n){return function(){var r=this,e=arguments;return new Promise((function(i,a){var o=n.apply(r,e);function u(n){t(o,i,a,u,c,"next",n);}function c(n){t(o,i,a,u,c,"throw",n);}u(void 0);}))}}function r(t){for(var n=new ArrayBuffer(t.length),r=new Uint8Array(n),e=0,i=t.length;e<i;e++)r[e]=t.charCodeAt(e);return n}function e(t){return t.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function i(t){return e(btoa(JSON.stringify(t)))}var a=function(){var t=n((function*(t){var{privateKey:n,payload:a}=t;if(/BEGIN RSA PRIVATE KEY/.test(n))throw new Error("[universal-github-app-jwt] Private Key is in PKCS#1 format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#readme");var o,u={name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}},c=(o=n.trim().split("\n").slice(1,-1).join(""),r(atob(o))),p=yield crypto.subtle.importKey("pkcs8",c,u,!1,["sign"]),f=function(t,n){return "".concat(i(t),".").concat(i(n))}({alg:"RS256",typ:"JWT"},a),l=r(f),s=function(t){for(var n="",r=new Uint8Array(t),i=r.byteLength,a=0;a<i;a++)n+=String.fromCharCode(r[a]);return e(btoa(n))}(yield crypto.subtle.sign(u.name,p,l));return "".concat(f,".").concat(s)}));return function(n){return t.apply(this,arguments)}}();function o(t){return u.apply(this,arguments)}function u(){return (u=n((function*(t){var{id:n,privateKey:r,now:e=Math.floor(Date.now()/1e3)}=t,i=e-30,o=i+600,u={iat:i,exp:o,iss:n};return {appId:n,expiration:o,token:yield a({privateKey:r,payload:u})}}))).apply(this,arguments)}

    var iterator = function (Yallist) {
      Yallist.prototype[Symbol.iterator] = function* () {
        for (let walker = this.head; walker; walker = walker.next) {
          yield walker.value;
        }
      };
    };

    var yallist = Yallist;

    Yallist.Node = Node;
    Yallist.create = Yallist;

    function Yallist (list) {
      var self = this;
      if (!(self instanceof Yallist)) {
        self = new Yallist();
      }

      self.tail = null;
      self.head = null;
      self.length = 0;

      if (list && typeof list.forEach === 'function') {
        list.forEach(function (item) {
          self.push(item);
        });
      } else if (arguments.length > 0) {
        for (var i = 0, l = arguments.length; i < l; i++) {
          self.push(arguments[i]);
        }
      }

      return self
    }

    Yallist.prototype.removeNode = function (node) {
      if (node.list !== this) {
        throw new Error('removing node which does not belong to this list')
      }

      var next = node.next;
      var prev = node.prev;

      if (next) {
        next.prev = prev;
      }

      if (prev) {
        prev.next = next;
      }

      if (node === this.head) {
        this.head = next;
      }
      if (node === this.tail) {
        this.tail = prev;
      }

      node.list.length--;
      node.next = null;
      node.prev = null;
      node.list = null;

      return next
    };

    Yallist.prototype.unshiftNode = function (node) {
      if (node === this.head) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var head = this.head;
      node.list = this;
      node.next = head;
      if (head) {
        head.prev = node;
      }

      this.head = node;
      if (!this.tail) {
        this.tail = node;
      }
      this.length++;
    };

    Yallist.prototype.pushNode = function (node) {
      if (node === this.tail) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var tail = this.tail;
      node.list = this;
      node.prev = tail;
      if (tail) {
        tail.next = node;
      }

      this.tail = node;
      if (!this.head) {
        this.head = node;
      }
      this.length++;
    };

    Yallist.prototype.push = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        push(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.unshift = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        unshift(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.pop = function () {
      if (!this.tail) {
        return undefined
      }

      var res = this.tail.value;
      this.tail = this.tail.prev;
      if (this.tail) {
        this.tail.next = null;
      } else {
        this.head = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.shift = function () {
      if (!this.head) {
        return undefined
      }

      var res = this.head.value;
      this.head = this.head.next;
      if (this.head) {
        this.head.prev = null;
      } else {
        this.tail = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.forEach = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.head, i = 0; walker !== null; i++) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.next;
      }
    };

    Yallist.prototype.forEachReverse = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.prev;
      }
    };

    Yallist.prototype.get = function (n) {
      for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.next;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.getReverse = function (n) {
      for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.prev;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.map = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.head; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.next;
      }
      return res
    };

    Yallist.prototype.mapReverse = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.tail; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.prev;
      }
      return res
    };

    Yallist.prototype.reduce = function (fn, initial) {
      var acc;
      var walker = this.head;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.head) {
        walker = this.head.next;
        acc = this.head.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = 0; walker !== null; i++) {
        acc = fn(acc, walker.value, i);
        walker = walker.next;
      }

      return acc
    };

    Yallist.prototype.reduceReverse = function (fn, initial) {
      var acc;
      var walker = this.tail;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.tail) {
        walker = this.tail.prev;
        acc = this.tail.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = this.length - 1; walker !== null; i--) {
        acc = fn(acc, walker.value, i);
        walker = walker.prev;
      }

      return acc
    };

    Yallist.prototype.toArray = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.head; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.next;
      }
      return arr
    };

    Yallist.prototype.toArrayReverse = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.tail; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.prev;
      }
      return arr
    };

    Yallist.prototype.slice = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
        walker = walker.next;
      }
      for (; walker !== null && i < to; i++, walker = walker.next) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.sliceReverse = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
        walker = walker.prev;
      }
      for (; walker !== null && i > from; i--, walker = walker.prev) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
      if (start > this.length) {
        start = this.length - 1;
      }
      if (start < 0) {
        start = this.length + start;
      }

      for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
        walker = walker.next;
      }

      var ret = [];
      for (var i = 0; walker && i < deleteCount; i++) {
        ret.push(walker.value);
        walker = this.removeNode(walker);
      }
      if (walker === null) {
        walker = this.tail;
      }

      if (walker !== this.head && walker !== this.tail) {
        walker = walker.prev;
      }

      for (var i = 0; i < nodes.length; i++) {
        walker = insert(this, walker, nodes[i]);
      }
      return ret;
    };

    Yallist.prototype.reverse = function () {
      var head = this.head;
      var tail = this.tail;
      for (var walker = head; walker !== null; walker = walker.prev) {
        var p = walker.prev;
        walker.prev = walker.next;
        walker.next = p;
      }
      this.head = tail;
      this.tail = head;
      return this
    };

    function insert (self, node, value) {
      var inserted = node === self.head ?
        new Node(value, null, node, self) :
        new Node(value, node, node.next, self);

      if (inserted.next === null) {
        self.tail = inserted;
      }
      if (inserted.prev === null) {
        self.head = inserted;
      }

      self.length++;

      return inserted
    }

    function push (self, item) {
      self.tail = new Node(item, self.tail, null, self);
      if (!self.head) {
        self.head = self.tail;
      }
      self.length++;
    }

    function unshift (self, item) {
      self.head = new Node(item, null, self.head, self);
      if (!self.tail) {
        self.tail = self.head;
      }
      self.length++;
    }

    function Node (value, prev, next, list) {
      if (!(this instanceof Node)) {
        return new Node(value, prev, next, list)
      }

      this.list = list;
      this.value = value;

      if (prev) {
        prev.next = this;
        this.prev = prev;
      } else {
        this.prev = null;
      }

      if (next) {
        next.prev = this;
        this.next = next;
      } else {
        this.next = null;
      }
    }

    try {
      // add if support for Symbol.iterator is present
      iterator(Yallist);
    } catch (er) {}

    // A linked list to keep track of recently-used-ness


    const MAX = Symbol('max');
    const LENGTH = Symbol('length');
    const LENGTH_CALCULATOR = Symbol('lengthCalculator');
    const ALLOW_STALE = Symbol('allowStale');
    const MAX_AGE = Symbol('maxAge');
    const DISPOSE = Symbol('dispose');
    const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
    const LRU_LIST = Symbol('lruList');
    const CACHE = Symbol('cache');
    const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

    const naiveLength = () => 1;

    // lruList is a yallist where the head is the youngest
    // item, and the tail is the oldest.  the list contains the Hit
    // objects as the entries.
    // Each Hit object has a reference to its Yallist.Node.  This
    // never changes.
    //
    // cache is a Map (or PseudoMap) that matches the keys to
    // the Yallist.Node object.
    class LRUCache {
      constructor (options) {
        if (typeof options === 'number')
          options = { max: options };

        if (!options)
          options = {};

        if (options.max && (typeof options.max !== 'number' || options.max < 0))
          throw new TypeError('max must be a non-negative number')
        // Kind of weird to have a default max of Infinity, but oh well.
        this[MAX] = options.max || Infinity;

        const lc = options.length || naiveLength;
        this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
        this[ALLOW_STALE] = options.stale || false;
        if (options.maxAge && typeof options.maxAge !== 'number')
          throw new TypeError('maxAge must be a number')
        this[MAX_AGE] = options.maxAge || 0;
        this[DISPOSE] = options.dispose;
        this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
        this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
        this.reset();
      }

      // resize the cache when the max changes.
      set max (mL) {
        if (typeof mL !== 'number' || mL < 0)
          throw new TypeError('max must be a non-negative number')

        this[MAX] = mL || Infinity;
        trim(this);
      }
      get max () {
        return this[MAX]
      }

      set allowStale (allowStale) {
        this[ALLOW_STALE] = !!allowStale;
      }
      get allowStale () {
        return this[ALLOW_STALE]
      }

      set maxAge (mA) {
        if (typeof mA !== 'number')
          throw new TypeError('maxAge must be a non-negative number')

        this[MAX_AGE] = mA;
        trim(this);
      }
      get maxAge () {
        return this[MAX_AGE]
      }

      // resize the cache when the lengthCalculator changes.
      set lengthCalculator (lC) {
        if (typeof lC !== 'function')
          lC = naiveLength;

        if (lC !== this[LENGTH_CALCULATOR]) {
          this[LENGTH_CALCULATOR] = lC;
          this[LENGTH] = 0;
          this[LRU_LIST].forEach(hit => {
            hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
            this[LENGTH] += hit.length;
          });
        }
        trim(this);
      }
      get lengthCalculator () { return this[LENGTH_CALCULATOR] }

      get length () { return this[LENGTH] }
      get itemCount () { return this[LRU_LIST].length }

      rforEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].tail; walker !== null;) {
          const prev = walker.prev;
          forEachStep(this, fn, walker, thisp);
          walker = prev;
        }
      }

      forEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].head; walker !== null;) {
          const next = walker.next;
          forEachStep(this, fn, walker, thisp);
          walker = next;
        }
      }

      keys () {
        return this[LRU_LIST].toArray().map(k => k.key)
      }

      values () {
        return this[LRU_LIST].toArray().map(k => k.value)
      }

      reset () {
        if (this[DISPOSE] &&
            this[LRU_LIST] &&
            this[LRU_LIST].length) {
          this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
        }

        this[CACHE] = new Map(); // hash of items by key
        this[LRU_LIST] = new yallist(); // list of items in order of use recency
        this[LENGTH] = 0; // length of items in the list
      }

      dump () {
        return this[LRU_LIST].map(hit =>
          isStale(this, hit) ? false : {
            k: hit.key,
            v: hit.value,
            e: hit.now + (hit.maxAge || 0)
          }).toArray().filter(h => h)
      }

      dumpLru () {
        return this[LRU_LIST]
      }

      set (key, value, maxAge) {
        maxAge = maxAge || this[MAX_AGE];

        if (maxAge && typeof maxAge !== 'number')
          throw new TypeError('maxAge must be a number')

        const now = maxAge ? Date.now() : 0;
        const len = this[LENGTH_CALCULATOR](value, key);

        if (this[CACHE].has(key)) {
          if (len > this[MAX]) {
            del(this, this[CACHE].get(key));
            return false
          }

          const node = this[CACHE].get(key);
          const item = node.value;

          // dispose of the old one before overwriting
          // split out into 2 ifs for better coverage tracking
          if (this[DISPOSE]) {
            if (!this[NO_DISPOSE_ON_SET])
              this[DISPOSE](key, item.value);
          }

          item.now = now;
          item.maxAge = maxAge;
          item.value = value;
          this[LENGTH] += len - item.length;
          item.length = len;
          this.get(key);
          trim(this);
          return true
        }

        const hit = new Entry(key, value, len, now, maxAge);

        // oversized objects fall out of cache automatically.
        if (hit.length > this[MAX]) {
          if (this[DISPOSE])
            this[DISPOSE](key, value);

          return false
        }

        this[LENGTH] += hit.length;
        this[LRU_LIST].unshift(hit);
        this[CACHE].set(key, this[LRU_LIST].head);
        trim(this);
        return true
      }

      has (key) {
        if (!this[CACHE].has(key)) return false
        const hit = this[CACHE].get(key).value;
        return !isStale(this, hit)
      }

      get (key) {
        return get$1(this, key, true)
      }

      peek (key) {
        return get$1(this, key, false)
      }

      pop () {
        const node = this[LRU_LIST].tail;
        if (!node)
          return null

        del(this, node);
        return node.value
      }

      del (key) {
        del(this, this[CACHE].get(key));
      }

      load (arr) {
        // reset the cache
        this.reset();

        const now = Date.now();
        // A previous serialized cache has the most recent items first
        for (let l = arr.length - 1; l >= 0; l--) {
          const hit = arr[l];
          const expiresAt = hit.e || 0;
          if (expiresAt === 0)
            // the item was created without expiration in a non aged cache
            this.set(hit.k, hit.v);
          else {
            const maxAge = expiresAt - now;
            // dont add already expired items
            if (maxAge > 0) {
              this.set(hit.k, hit.v, maxAge);
            }
          }
        }
      }

      prune () {
        this[CACHE].forEach((value, key) => get$1(this, key, false));
      }
    }

    const get$1 = (self, key, doUse) => {
      const node = self[CACHE].get(key);
      if (node) {
        const hit = node.value;
        if (isStale(self, hit)) {
          del(self, node);
          if (!self[ALLOW_STALE])
            return undefined
        } else {
          if (doUse) {
            if (self[UPDATE_AGE_ON_GET])
              node.value.now = Date.now();
            self[LRU_LIST].unshiftNode(node);
          }
        }
        return hit.value
      }
    };

    const isStale = (self, hit) => {
      if (!hit || (!hit.maxAge && !self[MAX_AGE]))
        return false

      const diff = Date.now() - hit.now;
      return hit.maxAge ? diff > hit.maxAge
        : self[MAX_AGE] && (diff > self[MAX_AGE])
    };

    const trim = self => {
      if (self[LENGTH] > self[MAX]) {
        for (let walker = self[LRU_LIST].tail;
          self[LENGTH] > self[MAX] && walker !== null;) {
          // We know that we're about to delete this one, and also
          // what the next least recently used key will be, so just
          // go ahead and set it now.
          const prev = walker.prev;
          del(self, walker);
          walker = prev;
        }
      }
    };

    const del = (self, node) => {
      if (node) {
        const hit = node.value;
        if (self[DISPOSE])
          self[DISPOSE](hit.key, hit.value);

        self[LENGTH] -= hit.length;
        self[CACHE].delete(hit.key);
        self[LRU_LIST].removeNode(node);
      }
    };

    class Entry {
      constructor (key, value, length, now, maxAge) {
        this.key = key;
        this.value = value;
        this.length = length;
        this.now = now;
        this.maxAge = maxAge || 0;
      }
    }

    const forEachStep = (self, fn, node, thisp) => {
      let hit = node.value;
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE])
          hit = undefined;
      }
      if (hit)
        fn.call(thisp, hit.value, hit.key, self);
    };

    var lruCache = LRUCache;

    async function getAppAuthentication({ appId, privateKey, timeDifference, }) {
        try {
            const appAuthentication = await o({
                id: +appId,
                privateKey,
                now: timeDifference && Math.floor(Date.now() / 1000) + timeDifference,
            });
            return {
                type: "app",
                token: appAuthentication.token,
                appId: appAuthentication.appId,
                expiresAt: new Date(appAuthentication.expiration * 1000).toISOString(),
            };
        }
        catch (error) {
            if (privateKey === "-----BEGIN RSA PRIVATE KEY-----") {
                throw new Error("The 'privateKey` option contains only the first line '-----BEGIN RSA PRIVATE KEY-----'. If you are setting it using a `.env` file, make sure it is set on a single line with newlines replaced by '\n'");
            }
            else {
                throw error;
            }
        }
    }

    // https://github.com/isaacs/node-lru-cache#readme
    function getCache() {
        return new lruCache({
            // cache max. 15000 tokens, that will use less than 10mb memory
            max: 15000,
            // Cache for 1 minute less than GitHub expiry
            maxAge: 1000 * 60 * 59,
        });
    }
    async function get(cache, options) {
        const cacheKey = optionsToCacheKey(options);
        const result = await cache.get(cacheKey);
        if (!result) {
            return;
        }
        const [token, createdAt, expiresAt, repositorySelection, permissionsString, singleFileName,] = result.split("|");
        const permissions = options.permissions ||
            permissionsString.split(/,/).reduce((permissions, string) => {
                if (/!$/.test(string)) {
                    permissions[string.slice(0, -1)] = "write";
                }
                else {
                    permissions[string] = "read";
                }
                return permissions;
            }, {});
        return {
            token,
            createdAt,
            expiresAt,
            permissions,
            repositoryIds: options.repositoryIds,
            repositoryNames: options.repositoryNames,
            singleFileName,
            repositorySelection: repositorySelection,
        };
    }
    async function set(cache, options, data) {
        const key = optionsToCacheKey(options);
        const permissionsString = options.permissions
            ? ""
            : Object.keys(data.permissions)
                .map((name) => `${name}${data.permissions[name] === "write" ? "!" : ""}`)
                .join(",");
        const value = [
            data.token,
            data.createdAt,
            data.expiresAt,
            data.repositorySelection,
            permissionsString,
            data.singleFileName,
        ].join("|");
        await cache.set(key, value);
    }
    function optionsToCacheKey({ installationId, permissions = {}, repositoryIds = [], repositoryNames = [], }) {
        const permissionsString = Object.keys(permissions)
            .sort()
            .map((name) => (permissions[name] === "read" ? name : `${name}!`))
            .join(",");
        const repositoryIdsString = repositoryIds.sort().join(",");
        const repositoryNamesString = repositoryNames.join(",");
        return [
            installationId,
            repositoryIdsString,
            repositoryNamesString,
            permissionsString,
        ]
            .filter(Boolean)
            .join("|");
    }

    function toTokenAuthentication({ installationId, token, createdAt, expiresAt, repositorySelection, permissions, repositoryIds, repositoryNames, singleFileName, }) {
        return Object.assign({
            type: "token",
            tokenType: "installation",
            token,
            installationId,
            permissions,
            createdAt,
            expiresAt,
            repositorySelection,
        }, repositoryIds ? { repositoryIds } : null, repositoryNames ? { repositoryNames } : null, singleFileName ? { singleFileName } : null);
    }

    async function getInstallationAuthentication(state, options, customRequest) {
        const installationId = Number(options.installationId || state.installationId);
        if (!installationId) {
            throw new Error("[@octokit/auth-app] installationId option is required for installation authentication.");
        }
        if (options.factory) {
            const { type, factory, oauthApp, ...factoryAuthOptions } = {
                ...state,
                ...options,
            };
            // @ts-expect-error if `options.factory` is set, the return type for `auth()` should be `Promise<ReturnType<options.factory>>`
            return factory(factoryAuthOptions);
        }
        const optionsWithInstallationTokenFromState = Object.assign({ installationId }, options);
        if (!options.refresh) {
            const result = await get(state.cache, optionsWithInstallationTokenFromState);
            if (result) {
                const { token, createdAt, expiresAt, permissions, repositoryIds, repositoryNames, singleFileName, repositorySelection, } = result;
                return toTokenAuthentication({
                    installationId,
                    token,
                    createdAt,
                    expiresAt,
                    permissions,
                    repositorySelection,
                    repositoryIds,
                    repositoryNames,
                    singleFileName,
                });
            }
        }
        const appAuthentication = await getAppAuthentication(state);
        const request = customRequest || state.request;
        const { data: { token, expires_at: expiresAt, repositories, permissions: permissionsOptional, repository_selection: repositorySelectionOptional, single_file: singleFileName, }, } = await request("POST /app/installations/{installation_id}/access_tokens", {
            installation_id: installationId,
            repository_ids: options.repositoryIds,
            repositories: options.repositoryNames,
            permissions: options.permissions,
            mediaType: {
                previews: ["machine-man"],
            },
            headers: {
                authorization: `bearer ${appAuthentication.token}`,
            },
        });
        /* istanbul ignore next - permissions are optional per OpenAPI spec, but we think that is incorrect */
        const permissions = permissionsOptional || {};
        /* istanbul ignore next - repositorySelection are optional per OpenAPI spec, but we think that is incorrect */
        const repositorySelection = repositorySelectionOptional || "all";
        const repositoryIds = repositories
            ? repositories.map((r) => r.id)
            : void 0;
        const repositoryNames = repositories
            ? repositories.map((repo) => repo.name)
            : void 0;
        const createdAt = new Date().toISOString();
        await set(state.cache, optionsWithInstallationTokenFromState, {
            token,
            createdAt,
            expiresAt,
            repositorySelection,
            permissions,
            repositoryIds,
            repositoryNames,
            singleFileName,
        });
        return toTokenAuthentication({
            installationId,
            token,
            createdAt,
            expiresAt,
            repositorySelection,
            permissions,
            repositoryIds,
            repositoryNames,
            singleFileName,
        });
    }

    async function auth$1(state, authOptions) {
        switch (authOptions.type) {
            case "app":
                return getAppAuthentication(state);
            // @ts-expect-error "oauth" is not supperted in types
            case "oauth":
                state.log.warn(
                // @ts-expect-error `log.warn()` expects string
                new Deprecation(`[@octokit/auth-app] {type: "oauth"} is deprecated. Use {type: "oauth-app"} instead`));
            case "oauth-app":
                return state.oauthApp({ type: "oauth-app" });
            case "installation":
                return getInstallationAuthentication(state, {
                    ...authOptions,
                    type: "installation",
                });
            case "oauth-user":
                // @ts-expect-error TODO: infer correct auth options type based on type. authOptions should be typed as "WebFlowAuthOptions | OAuthAppDeviceFlowAuthOptions | GitHubAppDeviceFlowAuthOptions"
                return state.oauthApp(authOptions);
            default:
                // @ts-expect-error type is "never" at this point
                throw new Error(`Invalid auth type: ${authOptions.type}`);
        }
    }

    const PATHS = [
        "/app",
        "/app/hook/config",
        "/app/hook/deliveries",
        "/app/hook/deliveries/{delivery_id}",
        "/app/hook/deliveries/{delivery_id}/attempts",
        "/app/installations",
        "/app/installations/{installation_id}",
        "/app/installations/{installation_id}/access_tokens",
        "/app/installations/{installation_id}/suspended",
        "/marketplace_listing/accounts/{account_id}",
        "/marketplace_listing/plan",
        "/marketplace_listing/plans",
        "/marketplace_listing/plans/{plan_id}/accounts",
        "/marketplace_listing/stubbed/accounts/{account_id}",
        "/marketplace_listing/stubbed/plan",
        "/marketplace_listing/stubbed/plans",
        "/marketplace_listing/stubbed/plans/{plan_id}/accounts",
        "/orgs/{org}/installation",
        "/repos/{owner}/{repo}/installation",
        "/users/{username}/installation",
    ];
    // CREDIT: Simon Grondin (https://github.com/SGrondin)
    // https://github.com/octokit/plugin-throttling.js/blob/45c5d7f13b8af448a9dbca468d9c9150a73b3948/lib/route-matcher.js
    function routeMatcher(paths) {
        // EXAMPLE. For the following paths:
        /* [
            "/orgs/{org}/invitations",
            "/repos/{owner}/{repo}/collaborators/{username}"
        ] */
        const regexes = paths.map((p) => p
            .split("/")
            .map((c) => (c.startsWith("{") ? "(?:.+?)" : c))
            .join("/"));
        // 'regexes' would contain:
        /* [
            '/orgs/(?:.+?)/invitations',
            '/repos/(?:.+?)/(?:.+?)/collaborators/(?:.+?)'
        ] */
        const regex = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})[^/]*$`;
        // 'regex' would contain:
        /*
          ^(?:(?:\/orgs\/(?:.+?)\/invitations)|(?:\/repos\/(?:.+?)\/(?:.+?)\/collaborators\/(?:.+?)))[^\/]*$
      
          It may look scary, but paste it into https://www.debuggex.com/
          and it will make a lot more sense!
        */
        return new RegExp(regex, "i");
    }
    const REGEX = routeMatcher(PATHS);
    function requiresAppAuth(url) {
        return !!url && REGEX.test(url);
    }

    const FIVE_SECONDS_IN_MS = 5 * 1000;
    function isNotTimeSkewError(error) {
        return !(error.message.match(/'Expiration time' claim \('exp'\) must be a numeric value representing the future time at which the assertion expires/) ||
            error.message.match(/'Issued at' claim \('iat'\) must be an Integer representing the time that the assertion was issued/));
    }
    async function hook$1(state, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        const url = endpoint.url;
        // Do not intercept request to retrieve a new token
        if (/\/login\/oauth\/access_token$/.test(url)) {
            return request(endpoint);
        }
        if (requiresAppAuth(url.replace(request.endpoint.DEFAULTS.baseUrl, ""))) {
            const { token } = await getAppAuthentication(state);
            endpoint.headers.authorization = `bearer ${token}`;
            let response;
            try {
                response = await request(endpoint);
            }
            catch (error) {
                // If there's an issue with the expiration, regenerate the token and try again.
                // Otherwise rethrow the error for upstream handling.
                if (isNotTimeSkewError(error)) {
                    throw error;
                }
                // If the date header is missing, we can't correct the system time skew.
                // Throw the error to be handled upstream.
                if (typeof error.response.headers.date === "undefined") {
                    throw error;
                }
                const diff = Math.floor((Date.parse(error.response.headers.date) -
                    Date.parse(new Date().toString())) /
                    1000);
                state.log.warn(error.message);
                state.log.warn(`[@octokit/auth-app] GitHub API time and system time are different by ${diff} seconds. Retrying request with the difference accounted for.`);
                const { token } = await getAppAuthentication({
                    ...state,
                    timeDifference: diff,
                });
                endpoint.headers.authorization = `bearer ${token}`;
                return request(endpoint);
            }
            return response;
        }
        if (requiresBasicAuth(url)) {
            const authentication = await state.oauthApp({ type: "oauth-app" });
            endpoint.headers.authorization = authentication.headers.authorization;
            return request(endpoint);
        }
        const { token, createdAt } = await getInstallationAuthentication(state, 
        // @ts-expect-error TBD
        {}, request);
        endpoint.headers.authorization = `token ${token}`;
        return sendRequestWithRetries(state, request, endpoint, createdAt);
    }
    /**
     * Newly created tokens might not be accessible immediately after creation.
     * In case of a 401 response, we retry with an exponential delay until more
     * than five seconds pass since the creation of the token.
     *
     * @see https://github.com/octokit/auth-app.js/issues/65
     */
    async function sendRequestWithRetries(state, request, options, createdAt, retries = 0) {
        const timeSinceTokenCreationInMs = +new Date() - +new Date(createdAt);
        try {
            return await request(options);
        }
        catch (error) {
            if (error.status !== 401) {
                throw error;
            }
            if (timeSinceTokenCreationInMs >= FIVE_SECONDS_IN_MS) {
                if (retries > 0) {
                    error.message = `After ${retries} retries within ${timeSinceTokenCreationInMs / 1000}s of creating the installation access token, the response remains 401. At this point, the cause may be an authentication problem or a system outage. Please check https://www.githubstatus.com for status information`;
                }
                throw error;
            }
            ++retries;
            const awaitTime = retries * 1000;
            state.log.warn(`[@octokit/auth-app] Retrying after 401 response to account for token replication delay (retry: ${retries}, wait: ${awaitTime / 1000}s)`);
            await new Promise((resolve) => setTimeout(resolve, awaitTime));
            return sendRequestWithRetries(state, request, options, createdAt, retries);
        }
    }

    const VERSION$3 = "4.0.9";

    function createAppAuth(options) {
        if (!options.appId) {
            throw new Error("[@octokit/auth-app] appId option is required");
        }
        if (!Number.isFinite(+options.appId)) {
            throw new Error("[@octokit/auth-app] appId option must be a number or numeric string");
        }
        if (!options.privateKey) {
            throw new Error("[@octokit/auth-app] privateKey option is required");
        }
        if ("installationId" in options && !options.installationId) {
            throw new Error("[@octokit/auth-app] installationId is set to a falsy value");
        }
        const log = Object.assign({
            warn: console.warn.bind(console),
        }, options.log);
        const request$1$1 = options.request ||
            request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-app.js/${VERSION$3} ${getUserAgent()}`,
                },
            });
        const state = Object.assign({
            request: request$1$1,
            cache: getCache(),
        }, options, options.installationId
            ? { installationId: Number(options.installationId) }
            : {}, {
            log,
            oauthApp: createOAuthAppAuth({
                clientType: "github-app",
                clientId: options.clientId || "",
                clientSecret: options.clientSecret || "",
                request: request$1$1,
            }),
        });
        // @ts-expect-error not worth the extra code to appease TS
        return Object.assign(auth$1.bind(null, state), {
            hook: hook$1.bind(null, state),
        });
    }

    var distWeb$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createAppAuth: createAppAuth,
        createOAuthUserAuth: createOAuthUserAuth
    });

    async function auth(reason) {
        return {
            type: "unauthenticated",
            reason,
        };
    }

    function isRateLimitError(error) {
        if (error.status !== 403) {
            return false;
        }
        /* istanbul ignore if */
        if (!error.response) {
            return false;
        }
        return error.response.headers["x-ratelimit-remaining"] === "0";
    }

    const REGEX_ABUSE_LIMIT_MESSAGE = /\babuse\b/i;
    function isAbuseLimitError(error) {
        if (error.status !== 403) {
            return false;
        }
        return REGEX_ABUSE_LIMIT_MESSAGE.test(error.message);
    }

    async function hook(reason, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        return request(endpoint).catch((error) => {
            if (error.status === 404) {
                error.message = `Not found. May be due to lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (isRateLimitError(error)) {
                error.message = `API rate limit exceeded. This maybe caused by the lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (isAbuseLimitError(error)) {
                error.message = `You have triggered an abuse detection mechanism. This maybe caused by the lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (error.status === 401) {
                error.message = `Unauthorized. "${endpoint.method} ${endpoint.url}" failed most likely due to lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (error.status >= 400 && error.status < 500) {
                error.message = error.message.replace(/\.?$/, `. May be caused by lack of authentication (${reason}).`);
            }
            throw error;
        });
    }

    const createUnauthenticatedAuth = function createUnauthenticatedAuth(options) {
        if (!options || !options.reason) {
            throw new Error("[@octokit/auth-unauthenticated] No reason passed to createUnauthenticatedAuth");
        }
        return Object.assign(auth.bind(null, options.reason), {
            hook: hook.bind(null, options.reason),
        });
    };

    var distWeb$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createUnauthenticatedAuth: createUnauthenticatedAuth
    });

    /*! fromentries. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
    var fromentries = function fromEntries (iterable) {
      return [...iterable].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj
      }, {})
    };

    var OAuthAppAuth = /*@__PURE__*/getAugmentedNamespace(distWeb$3);

    var core = /*@__PURE__*/getAugmentedNamespace(distWeb$7);

    var universalUserAgent = /*@__PURE__*/getAugmentedNamespace(distWeb$a);

    var authOauthUser = /*@__PURE__*/getAugmentedNamespace(distWeb$4);

    var OAuthMethods = distNode$1;

    var authUnauthenticated = /*@__PURE__*/getAugmentedNamespace(distWeb$1);

    function _interopDefault$1 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }







    var fromEntries = _interopDefault$1(fromentries);

    const VERSION$2 = "4.2.0";

    function addEventHandler(state, eventName, eventHandler) {
      if (Array.isArray(eventName)) {
        for (const singleEventName of eventName) {
          addEventHandler(state, singleEventName, eventHandler);
        }
        return;
      }
      if (!state.eventHandlers[eventName]) {
        state.eventHandlers[eventName] = [];
      }
      state.eventHandlers[eventName].push(eventHandler);
    }

    const OAuthAppOctokit = core.Octokit.defaults({
      userAgent: `octokit-oauth-app.js/${VERSION$2} ${universalUserAgent.getUserAgent()}`
    });

    async function emitEvent(state, context) {
      const {
        name,
        action
      } = context;
      if (state.eventHandlers[`${name}.${action}`]) {
        for (const eventHandler of state.eventHandlers[`${name}.${action}`]) {
          await eventHandler(context);
        }
      }
      if (state.eventHandlers[name]) {
        for (const eventHandler of state.eventHandlers[name]) {
          await eventHandler(context);
        }
      }
    }

    async function getUserOctokitWithState(state, options) {
      return state.octokit.auth({
        type: "oauth-user",
        ...options,
        async factory(options) {
          const octokit = new state.Octokit({
            authStrategy: authOauthUser.createOAuthUserAuth,
            auth: options
          });
          const authentication = await octokit.auth({
            type: "get"
          });
          await emitEvent(state, {
            name: "token",
            action: "created",
            token: authentication.token,
            scopes: authentication.scopes,
            authentication,
            octokit
          });
          return octokit;
        }
      });
    }

    function getWebFlowAuthorizationUrlWithState(state, options) {
      let allowSignup;
      if (options.allowSignup === undefined && state.allowSignup === undefined) {
        allowSignup = true;
      } else if (options.allowSignup === undefined && state.allowSignup !== undefined) {
        allowSignup = state.allowSignup;
      } else if (state.allowSignup === undefined && options.allowSignup !== undefined) {
        allowSignup = options.allowSignup;
      } else {
        allowSignup = options.allowSignup || state.allowSignup;
      }
      const optionsWithDefaults = {
        clientId: state.clientId,
        request: state.octokit.request,
        ...options,
        allowSignup,
        redirectUrl: options.redirectUrl || state.redirectUrl,
        scopes: options.scopes || state.defaultScopes
      };
      return OAuthMethods.getWebFlowAuthorizationUrl({
        clientType: state.clientType,
        ...optionsWithDefaults
      });
    }

    async function createTokenWithState(state, options) {
      const authentication = await state.octokit.auth({
        type: "oauth-user",
        ...options
      });
      await emitEvent(state, {
        name: "token",
        action: "created",
        token: authentication.token,
        scopes: authentication.scopes,
        authentication,
        octokit: new state.Octokit({
          authStrategy: OAuthAppAuth.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: authentication.token,
            scopes: authentication.scopes,
            refreshToken: authentication.refreshToken,
            expiresAt: authentication.expiresAt,
            refreshTokenExpiresAt: authentication.refreshTokenExpiresAt
          }
        })
      });
      return {
        authentication
      };
    }

    async function checkTokenWithState(state, options) {
      const result = await OAuthMethods.checkToken({
        // @ts-expect-error not worth the extra code to appease TS
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        ...options
      });
      Object.assign(result.authentication, {
        type: "token",
        tokenType: "oauth"
      });
      return result;
    }

    async function resetTokenWithState(state, options) {
      const optionsWithDefaults = {
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        ...options
      };
      if (state.clientType === "oauth-app") {
        const response = await OAuthMethods.resetToken({
          clientType: "oauth-app",
          ...optionsWithDefaults
        });
        const authentication = Object.assign(response.authentication, {
          type: "token",
          tokenType: "oauth"
        });
        await emitEvent(state, {
          name: "token",
          action: "reset",
          token: response.authentication.token,
          scopes: response.authentication.scopes || undefined,
          authentication: authentication,
          octokit: new state.Octokit({
            authStrategy: authOauthUser.createOAuthUserAuth,
            auth: {
              clientType: state.clientType,
              clientId: state.clientId,
              clientSecret: state.clientSecret,
              token: response.authentication.token,
              scopes: response.authentication.scopes
            }
          })
        });
        return {
          ...response,
          authentication
        };
      }
      const response = await OAuthMethods.resetToken({
        clientType: "github-app",
        ...optionsWithDefaults
      });
      const authentication = Object.assign(response.authentication, {
        type: "token",
        tokenType: "oauth"
      });
      await emitEvent(state, {
        name: "token",
        action: "reset",
        token: response.authentication.token,
        authentication: authentication,
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return {
        ...response,
        authentication
      };
    }

    async function refreshTokenWithState(state, options) {
      if (state.clientType === "oauth-app") {
        throw new Error("[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps");
      }
      const response = await OAuthMethods.refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        refreshToken: options.refreshToken
      });
      const authentication = Object.assign(response.authentication, {
        type: "token",
        tokenType: "oauth"
      });
      await emitEvent(state, {
        name: "token",
        action: "refreshed",
        token: response.authentication.token,
        authentication: authentication,
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return {
        ...response,
        authentication
      };
    }

    async function scopeTokenWithState(state, options) {
      if (state.clientType === "oauth-app") {
        throw new Error("[@octokit/oauth-app] app.scopeToken() is not supported for OAuth Apps");
      }
      const response = await OAuthMethods.scopeToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        ...options
      });
      const authentication = Object.assign(response.authentication, {
        type: "token",
        tokenType: "oauth"
      });
      await emitEvent(state, {
        name: "token",
        action: "scoped",
        token: response.authentication.token,
        authentication: authentication,
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return {
        ...response,
        authentication
      };
    }

    async function deleteTokenWithState(state, options) {
      const optionsWithDefaults = {
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        ...options
      };
      const response = state.clientType === "oauth-app" ? await OAuthMethods.deleteToken({
        clientType: "oauth-app",
        ...optionsWithDefaults
      }) :
      // istanbul ignore next
      await OAuthMethods.deleteToken({
        clientType: "github-app",
        ...optionsWithDefaults
      });
      await emitEvent(state, {
        name: "token",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "token.deleted" event. The access for the token has been revoked.`
          }
        })
      });
      return response;
    }

    async function deleteAuthorizationWithState(state, options) {
      const optionsWithDefaults = {
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        ...options
      };
      const response = state.clientType === "oauth-app" ? await OAuthMethods.deleteAuthorization({
        clientType: "oauth-app",
        ...optionsWithDefaults
      }) :
      // istanbul ignore next
      await OAuthMethods.deleteAuthorization({
        clientType: "github-app",
        ...optionsWithDefaults
      });
      await emitEvent(state, {
        name: "token",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "token.deleted" event. The access for the token has been revoked.`
          }
        })
      });
      await emitEvent(state, {
        name: "authorization",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "authorization.deleted" event. The access for the app has been revoked.`
          }
        })
      });
      return response;
    }

    // @ts-ignore - requires esModuleInterop flag
    async function handleRequest(app, {
      pathPrefix = "/api/github/oauth"
    }, request) {
      if (request.method === "OPTIONS") {
        return {
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "*",
            "access-control-allow-headers": "Content-Type, User-Agent, Authorization"
          }
        };
      }
      // request.url may include ?query parameters which we don't want for `route`
      // hence the workaround using new URL()
      const {
        pathname
      } = new URL(request.url, "http://localhost");
      const route = [request.method, pathname].join(" ");
      const routes = {
        getLogin: `GET ${pathPrefix}/login`,
        getCallback: `GET ${pathPrefix}/callback`,
        createToken: `POST ${pathPrefix}/token`,
        getToken: `GET ${pathPrefix}/token`,
        patchToken: `PATCH ${pathPrefix}/token`,
        patchRefreshToken: `PATCH ${pathPrefix}/refresh-token`,
        scopeToken: `POST ${pathPrefix}/token/scoped`,
        deleteToken: `DELETE ${pathPrefix}/token`,
        deleteGrant: `DELETE ${pathPrefix}/grant`
      };
      // handle unknown routes
      if (!Object.values(routes).includes(route)) {
        return null;
      }
      let json;
      try {
        const text = await request.text();
        json = text ? JSON.parse(text) : {};
      } catch (error) {
        return {
          status: 400,
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*"
          },
          text: JSON.stringify({
            error: "[@octokit/oauth-app] request error"
          })
        };
      }
      const {
        searchParams
      } = new URL(request.url, "http://localhost");
      const query = fromEntries(searchParams);
      const headers = request.headers;
      try {
        var _headers$authorizatio6;
        if (route === routes.getLogin) {
          const {
            url
          } = app.getWebFlowAuthorizationUrl({
            state: query.state,
            scopes: query.scopes ? query.scopes.split(",") : undefined,
            allowSignup: query.allowSignup ? query.allowSignup === "true" : undefined,
            redirectUrl: query.redirectUrl
          });
          return {
            status: 302,
            headers: {
              location: url
            }
          };
        }
        if (route === routes.getCallback) {
          if (query.error) {
            throw new Error(`[@octokit/oauth-app] ${query.error} ${query.error_description}`);
          }
          if (!query.code) {
            throw new Error('[@octokit/oauth-app] "code" parameter is required');
          }
          const {
            authentication: {
              token
            }
          } = await app.createToken({
            code: query.code
          });
          return {
            status: 200,
            headers: {
              "content-type": "text/html"
            },
            text: `<h1>Token created successfully</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`
          };
        }
        if (route === routes.createToken) {
          const {
            code,
            redirectUrl
          } = json;
          if (!code) {
            throw new Error('[@octokit/oauth-app] "code" parameter is required');
          }
          const result = await app.createToken({
            code,
            redirectUrl
          });
          // @ts-ignore
          delete result.authentication.clientSecret;
          return {
            status: 201,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            },
            text: JSON.stringify(result)
          };
        }
        if (route === routes.getToken) {
          var _headers$authorizatio;
          const token = (_headers$authorizatio = headers.authorization) === null || _headers$authorizatio === void 0 ? void 0 : _headers$authorizatio.substr("token ".length);
          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }
          const result = await app.checkToken({
            token
          });
          // @ts-ignore
          delete result.authentication.clientSecret;
          return {
            status: 200,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            },
            text: JSON.stringify(result)
          };
        }
        if (route === routes.patchToken) {
          var _headers$authorizatio2;
          const token = (_headers$authorizatio2 = headers.authorization) === null || _headers$authorizatio2 === void 0 ? void 0 : _headers$authorizatio2.substr("token ".length);
          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }
          const result = await app.resetToken({
            token
          });
          // @ts-ignore
          delete result.authentication.clientSecret;
          return {
            status: 200,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            },
            text: JSON.stringify(result)
          };
        }
        if (route === routes.patchRefreshToken) {
          var _headers$authorizatio3;
          const token = (_headers$authorizatio3 = headers.authorization) === null || _headers$authorizatio3 === void 0 ? void 0 : _headers$authorizatio3.substr("token ".length);
          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }
          const {
            refreshToken
          } = json;
          if (!refreshToken) {
            throw new Error("[@octokit/oauth-app] refreshToken must be sent in request body");
          }
          const result = await app.refreshToken({
            refreshToken
          });
          // @ts-ignore
          delete result.authentication.clientSecret;
          return {
            status: 200,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            },
            text: JSON.stringify(result)
          };
        }
        if (route === routes.scopeToken) {
          var _headers$authorizatio4;
          const token = (_headers$authorizatio4 = headers.authorization) === null || _headers$authorizatio4 === void 0 ? void 0 : _headers$authorizatio4.substr("token ".length);
          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }
          const result = await app.scopeToken({
            token,
            ...json
          });
          // @ts-ignore
          delete result.authentication.clientSecret;
          return {
            status: 200,
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            },
            text: JSON.stringify(result)
          };
        }
        if (route === routes.deleteToken) {
          var _headers$authorizatio5;
          const token = (_headers$authorizatio5 = headers.authorization) === null || _headers$authorizatio5 === void 0 ? void 0 : _headers$authorizatio5.substr("token ".length);
          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }
          await app.deleteToken({
            token
          });
          return {
            status: 204,
            headers: {
              "access-control-allow-origin": "*"
            }
          };
        }
        // route === routes.deleteGrant
        const token = (_headers$authorizatio6 = headers.authorization) === null || _headers$authorizatio6 === void 0 ? void 0 : _headers$authorizatio6.substr("token ".length);
        if (!token) {
          throw new Error('[@octokit/oauth-app] "Authorization" header is required');
        }
        await app.deleteAuthorization({
          token
        });
        return {
          status: 204,
          headers: {
            "access-control-allow-origin": "*"
          }
        };
      } catch (error) {
        return {
          status: 400,
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*"
          },
          text: JSON.stringify({
            error: error.message
          })
        };
      }
    }

    function parseRequest(request) {
      const {
        method,
        url,
        headers
      } = request;
      async function text() {
        const text = await new Promise((resolve, reject) => {
          let bodyChunks = [];
          request.on("error", reject).on("data", chunk => bodyChunks.push(chunk)).on("end", () => resolve(Buffer.concat(bodyChunks).toString()));
        });
        return text;
      }
      return {
        method,
        url,
        headers,
        text
      };
    }

    function sendResponse(octokitResponse, response) {
      response.writeHead(octokitResponse.status, octokitResponse.headers);
      response.end(octokitResponse.text);
    }

    function onUnhandledRequestDefault$1(request) {
      return {
        status: 404,
        headers: {
          "content-type": "application/json"
        },
        text: JSON.stringify({
          error: `Unknown route: ${request.method} ${request.url}`
        })
      };
    }

    function onUnhandledRequestDefaultNode(request, response) {
      const octokitRequest = parseRequest(request);
      const octokitResponse = onUnhandledRequestDefault$1(octokitRequest);
      sendResponse(octokitResponse, response);
    }
    function createNodeMiddleware$1(app, {
      pathPrefix,
      onUnhandledRequest
    } = {}) {
      if (onUnhandledRequest) {
        app.octokit.log.warn("[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version.");
      }
      onUnhandledRequest ?? (onUnhandledRequest = onUnhandledRequestDefaultNode);
      return async function (request, response, next) {
        const octokitRequest = parseRequest(request);
        const octokitResponse = await handleRequest(app, {
          pathPrefix
        }, octokitRequest);
        if (octokitResponse) {
          sendResponse(octokitResponse, response);
        } else if (typeof next === "function") {
          next();
        } else {
          onUnhandledRequest(request, response);
        }
      };
    }

    function parseRequest$1(request) {
      // @ts-ignore Worker environment supports fromEntries/entries.
      const headers = Object.fromEntries(request.headers.entries());
      return {
        method: request.method,
        url: request.url,
        headers,
        text: () => request.text()
      };
    }

    function sendResponse$1(octokitResponse) {
      return new Response(octokitResponse.text, {
        status: octokitResponse.status,
        headers: octokitResponse.headers
      });
    }

    async function onUnhandledRequestDefaultWebWorker(request) {
      const octokitRequest = parseRequest$1(request);
      const octokitResponse = onUnhandledRequestDefault$1(octokitRequest);
      return sendResponse$1(octokitResponse);
    }
    function createWebWorkerHandler(app, {
      pathPrefix,
      onUnhandledRequest
    } = {}) {
      if (onUnhandledRequest) {
        app.octokit.log.warn("[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version.");
      }
      onUnhandledRequest ?? (onUnhandledRequest = onUnhandledRequestDefaultWebWorker);
      return async function (request) {
        const octokitRequest = parseRequest$1(request);
        const octokitResponse = await handleRequest(app, {
          pathPrefix
        }, octokitRequest);
        return octokitResponse ? sendResponse$1(octokitResponse) : await onUnhandledRequest(request);
      };
    }
    /** @deprecated */
    function createCloudflareHandler(...args) {
      args[0].octokit.log.warn("[@octokit/oauth-app] `createCloudflareHandler` is deprecated, use `createWebWorkerHandler` instead");
      return createWebWorkerHandler(...args);
    }

    function parseRequest$2(request) {
      const {
        method
      } = request.requestContext.http;
      let url = request.rawPath;
      const {
        stage
      } = request.requestContext;
      if (url.startsWith("/" + stage)) url = url.substring(stage.length + 1);
      if (request.rawQueryString) url += "?" + request.rawQueryString;
      const headers = request.headers;
      const text = async () => request.body || "";
      return {
        method,
        url,
        headers,
        text
      };
    }

    function sendResponse$2(octokitResponse) {
      return {
        statusCode: octokitResponse.status,
        headers: octokitResponse.headers,
        body: octokitResponse.text
      };
    }

    async function onUnhandledRequestDefaultAWSAPIGatewayV2(event) {
      const request = parseRequest$2(event);
      const response = onUnhandledRequestDefault$1(request);
      return sendResponse$2(response);
    }
    function createAWSLambdaAPIGatewayV2Handler(app, {
      pathPrefix,
      onUnhandledRequest
    } = {}) {
      if (onUnhandledRequest) {
        app.octokit.log.warn("[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version.");
      }
      onUnhandledRequest ?? (onUnhandledRequest = onUnhandledRequestDefaultAWSAPIGatewayV2);
      return async function (event) {
        const request = parseRequest$2(event);
        const response = await handleRequest(app, {
          pathPrefix
        }, request);
        return response ? sendResponse$2(response) : onUnhandledRequest(event);
      };
    }

    class OAuthApp {
      static defaults(defaults) {
        const OAuthAppWithDefaults = class extends this {
          constructor(...args) {
            super({
              ...defaults,
              ...args[0]
            });
          }
        };
        return OAuthAppWithDefaults;
      }
      constructor(options) {
        const Octokit = options.Octokit || OAuthAppOctokit;
        this.type = options.clientType || "oauth-app";
        const octokit = new Octokit({
          authStrategy: OAuthAppAuth.createOAuthAppAuth,
          auth: {
            clientType: this.type,
            clientId: options.clientId,
            clientSecret: options.clientSecret
          }
        });
        const state = {
          clientType: this.type,
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          // @ts-expect-error defaultScopes not permitted for GitHub Apps
          defaultScopes: options.defaultScopes || [],
          allowSignup: options.allowSignup,
          baseUrl: options.baseUrl,
          redirectUrl: options.redirectUrl,
          log: options.log,
          Octokit,
          octokit,
          eventHandlers: {}
        };
        this.on = addEventHandler.bind(null, state);
        // @ts-expect-error TODO: figure this out
        this.octokit = octokit;
        this.getUserOctokit = getUserOctokitWithState.bind(null, state);
        this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(null, state);
        this.createToken = createTokenWithState.bind(null, state);
        this.checkToken = checkTokenWithState.bind(null, state);
        this.resetToken = resetTokenWithState.bind(null, state);
        this.refreshToken = refreshTokenWithState.bind(null, state);
        this.scopeToken = scopeTokenWithState.bind(null, state);
        this.deleteToken = deleteTokenWithState.bind(null, state);
        this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
      }
    }
    OAuthApp.VERSION = VERSION$2;

    var OAuthApp_1 = OAuthApp;
    var createAWSLambdaAPIGatewayV2Handler_1 = createAWSLambdaAPIGatewayV2Handler;
    var createCloudflareHandler_1 = createCloudflareHandler;
    var createNodeMiddleware_1 = createNodeMiddleware$1;
    var createWebWorkerHandler_1 = createWebWorkerHandler;
    var handleRequest_1 = handleRequest;


    var distNode = /*#__PURE__*/Object.defineProperty({
    	OAuthApp: OAuthApp_1,
    	createAWSLambdaAPIGatewayV2Handler: createAWSLambdaAPIGatewayV2Handler_1,
    	createCloudflareHandler: createCloudflareHandler_1,
    	createNodeMiddleware: createNodeMiddleware_1,
    	createWebWorkerHandler: createWebWorkerHandler_1,
    	handleRequest: handleRequest_1
    }, '__esModule', {value: true});

    var indentString = (string, count = 1, options) => {
    	options = {
    		indent: ' ',
    		includeEmptyLines: false,
    		...options
    	};

    	if (typeof string !== 'string') {
    		throw new TypeError(
    			`Expected \`input\` to be a \`string\`, got \`${typeof string}\``
    		);
    	}

    	if (typeof count !== 'number') {
    		throw new TypeError(
    			`Expected \`count\` to be a \`number\`, got \`${typeof count}\``
    		);
    	}

    	if (typeof options.indent !== 'string') {
    		throw new TypeError(
    			`Expected \`options.indent\` to be a \`string\`, got \`${typeof options.indent}\``
    		);
    	}

    	if (count === 0) {
    		return string;
    	}

    	const regex = options.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;

    	return string.replace(regex, options.indent.repeat(count));
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var os = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    const extractPathRegex = /\s+at.*(?:\(|\s)(.*)\)?/;
    const pathRegex = /^(?:(?:(?:node|(?:internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)\.js:\d+:\d+)|native)/;
    const homeDir = typeof os.homedir === 'undefined' ? '' : os.homedir();

    var cleanStack = (stack, options) => {
    	options = Object.assign({pretty: false}, options);

    	return stack.replace(/\\/g, '/')
    		.split('\n')
    		.filter(line => {
    			const pathMatches = line.match(extractPathRegex);
    			if (pathMatches === null || !pathMatches[1]) {
    				return true;
    			}

    			const match = pathMatches[1];

    			// Electron
    			if (
    				match.includes('.app/Contents/Resources/electron.asar') ||
    				match.includes('.app/Contents/Resources/default_app.asar')
    			) {
    				return false;
    			}

    			return !pathRegex.test(match);
    		})
    		.filter(line => line.trim() !== '')
    		.map(line => {
    			if (options.pretty) {
    				return line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDir, '~')));
    			}

    			return line;
    		})
    		.join('\n');
    };

    const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');

    class AggregateError extends Error {
    	constructor(errors) {
    		if (!Array.isArray(errors)) {
    			throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
    		}

    		errors = [...errors].map(error => {
    			if (error instanceof Error) {
    				return error;
    			}

    			if (error !== null && typeof error === 'object') {
    				// Handle plain error objects with message property and/or possibly other metadata
    				return Object.assign(new Error(error.message), error);
    			}

    			return new Error(error);
    		});

    		let message = errors
    			.map(error => {
    				// The `stack` property is not standardized, so we can't assume it exists
    				return typeof error.stack === 'string' ? cleanInternalStack(cleanStack(error.stack)) : String(error);
    			})
    			.join('\n');
    		message = '\n' + indentString(message, 4);
    		super(message);

    		this.name = 'AggregateError';

    		Object.defineProperty(this, '_errors', {value: errors});
    	}

    	* [Symbol.iterator]() {
    		for (const error of this._errors) {
    			yield error;
    		}
    	}
    }

    var aggregateError = AggregateError;

    var Algorithm;
    (function (Algorithm) {
        Algorithm["SHA1"] = "sha1";
        Algorithm["SHA256"] = "sha256";
    })(Algorithm || (Algorithm = {}));

    const getAlgorithm = (signature) => {
        return signature.startsWith("sha256=") ? "sha256" : "sha1";
    };

    const enc = new TextEncoder();
    function hexToUInt8Array(string) {
        // convert string to pairs of 2 characters
        const pairs = string.match(/[\dA-F]{2}/gi);
        // convert the octets to integers
        const integers = pairs.map(function (s) {
            return parseInt(s, 16);
        });
        return new Uint8Array(integers);
    }
    function UInt8ArrayToHex(signature) {
        return Array.prototype.map
            .call(new Uint8Array(signature), (x) => x.toString(16).padStart(2, "0"))
            .join("");
    }
    function getHMACHashName(algorithm) {
        return {
            [Algorithm.SHA1]: "SHA-1",
            [Algorithm.SHA256]: "SHA-256",
        }[algorithm];
    }
    async function importKey(secret, algorithm) {
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/HmacImportParams
        return crypto.subtle.importKey("raw", // raw format of the key - should be Uint8Array
        enc.encode(secret), {
            // algorithm details
            name: "HMAC",
            hash: { name: getHMACHashName(algorithm) },
        }, false, // export = false
        ["sign", "verify"] // what this key can do
        );
    }
    async function sign$1(options, payload) {
        const { secret, algorithm } = typeof options === "object"
            ? {
                secret: options.secret,
                algorithm: options.algorithm || Algorithm.SHA256,
            }
            : { secret: options, algorithm: Algorithm.SHA256 };
        if (!secret || !payload) {
            throw new TypeError("[@octokit/webhooks-methods] secret & payload required for sign()");
        }
        if (!Object.values(Algorithm).includes(algorithm)) {
            throw new TypeError(`[@octokit/webhooks] Algorithm ${algorithm} is not supported. Must be  'sha1' or 'sha256'`);
        }
        const signature = await crypto.subtle.sign("HMAC", await importKey(secret, algorithm), enc.encode(payload));
        return `${algorithm}=${UInt8ArrayToHex(signature)}`;
    }
    async function verify$1(secret, eventPayload, signature) {
        if (!secret || !eventPayload || !signature) {
            throw new TypeError("[@octokit/webhooks-methods] secret, eventPayload & signature required");
        }
        const algorithm = getAlgorithm(signature);
        return await crypto.subtle.verify("HMAC", await importKey(secret, algorithm), hexToUInt8Array(signature.replace(`${algorithm}=`, "")), enc.encode(eventPayload));
    }

    const createLogger = (logger) => ({
        debug: () => { },
        info: () => { },
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        ...logger,
    });

    // THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY
    // make edits in scripts/generate-types.ts
    const emitterEventNames = [
        "branch_protection_rule",
        "branch_protection_rule.created",
        "branch_protection_rule.deleted",
        "branch_protection_rule.edited",
        "check_run",
        "check_run.completed",
        "check_run.created",
        "check_run.requested_action",
        "check_run.rerequested",
        "check_suite",
        "check_suite.completed",
        "check_suite.requested",
        "check_suite.rerequested",
        "code_scanning_alert",
        "code_scanning_alert.appeared_in_branch",
        "code_scanning_alert.closed_by_user",
        "code_scanning_alert.created",
        "code_scanning_alert.fixed",
        "code_scanning_alert.reopened",
        "code_scanning_alert.reopened_by_user",
        "commit_comment",
        "commit_comment.created",
        "create",
        "delete",
        "dependabot_alert",
        "dependabot_alert.created",
        "dependabot_alert.dismissed",
        "dependabot_alert.fixed",
        "dependabot_alert.reintroduced",
        "dependabot_alert.reopened",
        "deploy_key",
        "deploy_key.created",
        "deploy_key.deleted",
        "deployment",
        "deployment.created",
        "deployment_status",
        "deployment_status.created",
        "discussion",
        "discussion.answered",
        "discussion.category_changed",
        "discussion.created",
        "discussion.deleted",
        "discussion.edited",
        "discussion.labeled",
        "discussion.locked",
        "discussion.pinned",
        "discussion.transferred",
        "discussion.unanswered",
        "discussion.unlabeled",
        "discussion.unlocked",
        "discussion.unpinned",
        "discussion_comment",
        "discussion_comment.created",
        "discussion_comment.deleted",
        "discussion_comment.edited",
        "fork",
        "github_app_authorization",
        "github_app_authorization.revoked",
        "gollum",
        "installation",
        "installation.created",
        "installation.deleted",
        "installation.new_permissions_accepted",
        "installation.suspend",
        "installation.unsuspend",
        "installation_repositories",
        "installation_repositories.added",
        "installation_repositories.removed",
        "installation_target",
        "installation_target.renamed",
        "issue_comment",
        "issue_comment.created",
        "issue_comment.deleted",
        "issue_comment.edited",
        "issues",
        "issues.assigned",
        "issues.closed",
        "issues.deleted",
        "issues.demilestoned",
        "issues.edited",
        "issues.labeled",
        "issues.locked",
        "issues.milestoned",
        "issues.opened",
        "issues.pinned",
        "issues.reopened",
        "issues.transferred",
        "issues.unassigned",
        "issues.unlabeled",
        "issues.unlocked",
        "issues.unpinned",
        "label",
        "label.created",
        "label.deleted",
        "label.edited",
        "marketplace_purchase",
        "marketplace_purchase.cancelled",
        "marketplace_purchase.changed",
        "marketplace_purchase.pending_change",
        "marketplace_purchase.pending_change_cancelled",
        "marketplace_purchase.purchased",
        "member",
        "member.added",
        "member.edited",
        "member.removed",
        "membership",
        "membership.added",
        "membership.removed",
        "merge_group",
        "merge_group.checks_requested",
        "meta",
        "meta.deleted",
        "milestone",
        "milestone.closed",
        "milestone.created",
        "milestone.deleted",
        "milestone.edited",
        "milestone.opened",
        "org_block",
        "org_block.blocked",
        "org_block.unblocked",
        "organization",
        "organization.deleted",
        "organization.member_added",
        "organization.member_invited",
        "organization.member_removed",
        "organization.renamed",
        "package",
        "package.published",
        "package.updated",
        "page_build",
        "ping",
        "project",
        "project.closed",
        "project.created",
        "project.deleted",
        "project.edited",
        "project.reopened",
        "project_card",
        "project_card.converted",
        "project_card.created",
        "project_card.deleted",
        "project_card.edited",
        "project_card.moved",
        "project_column",
        "project_column.created",
        "project_column.deleted",
        "project_column.edited",
        "project_column.moved",
        "projects_v2_item",
        "projects_v2_item.archived",
        "projects_v2_item.converted",
        "projects_v2_item.created",
        "projects_v2_item.deleted",
        "projects_v2_item.edited",
        "projects_v2_item.reordered",
        "projects_v2_item.restored",
        "public",
        "pull_request",
        "pull_request.assigned",
        "pull_request.auto_merge_disabled",
        "pull_request.auto_merge_enabled",
        "pull_request.closed",
        "pull_request.converted_to_draft",
        "pull_request.dequeued",
        "pull_request.edited",
        "pull_request.labeled",
        "pull_request.locked",
        "pull_request.opened",
        "pull_request.queued",
        "pull_request.ready_for_review",
        "pull_request.reopened",
        "pull_request.review_request_removed",
        "pull_request.review_requested",
        "pull_request.synchronize",
        "pull_request.unassigned",
        "pull_request.unlabeled",
        "pull_request.unlocked",
        "pull_request_review",
        "pull_request_review.dismissed",
        "pull_request_review.edited",
        "pull_request_review.submitted",
        "pull_request_review_comment",
        "pull_request_review_comment.created",
        "pull_request_review_comment.deleted",
        "pull_request_review_comment.edited",
        "pull_request_review_thread",
        "pull_request_review_thread.resolved",
        "pull_request_review_thread.unresolved",
        "push",
        "registry_package",
        "registry_package.published",
        "registry_package.updated",
        "release",
        "release.created",
        "release.deleted",
        "release.edited",
        "release.prereleased",
        "release.published",
        "release.released",
        "release.unpublished",
        "repository",
        "repository.archived",
        "repository.created",
        "repository.deleted",
        "repository.edited",
        "repository.privatized",
        "repository.publicized",
        "repository.renamed",
        "repository.transferred",
        "repository.unarchived",
        "repository_dispatch",
        "repository_import",
        "repository_vulnerability_alert",
        "repository_vulnerability_alert.create",
        "repository_vulnerability_alert.dismiss",
        "repository_vulnerability_alert.reopen",
        "repository_vulnerability_alert.resolve",
        "secret_scanning_alert",
        "secret_scanning_alert.created",
        "secret_scanning_alert.reopened",
        "secret_scanning_alert.resolved",
        "security_advisory",
        "security_advisory.performed",
        "security_advisory.published",
        "security_advisory.updated",
        "security_advisory.withdrawn",
        "sponsorship",
        "sponsorship.cancelled",
        "sponsorship.created",
        "sponsorship.edited",
        "sponsorship.pending_cancellation",
        "sponsorship.pending_tier_change",
        "sponsorship.tier_changed",
        "star",
        "star.created",
        "star.deleted",
        "status",
        "team",
        "team.added_to_repository",
        "team.created",
        "team.deleted",
        "team.edited",
        "team.removed_from_repository",
        "team_add",
        "watch",
        "watch.started",
        "workflow_dispatch",
        "workflow_job",
        "workflow_job.completed",
        "workflow_job.in_progress",
        "workflow_job.queued",
        "workflow_run",
        "workflow_run.completed",
        "workflow_run.in_progress",
        "workflow_run.requested",
    ];

    function handleEventHandlers(state, webhookName, handler) {
        if (!state.hooks[webhookName]) {
            state.hooks[webhookName] = [];
        }
        state.hooks[webhookName].push(handler);
    }
    function receiverOn(state, webhookNameOrNames, handler) {
        if (Array.isArray(webhookNameOrNames)) {
            webhookNameOrNames.forEach((webhookName) => receiverOn(state, webhookName, handler));
            return;
        }
        if (["*", "error"].includes(webhookNameOrNames)) {
            const webhookName = webhookNameOrNames === "*" ? "any" : webhookNameOrNames;
            const message = `Using the "${webhookNameOrNames}" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.on${webhookName.charAt(0).toUpperCase() + webhookName.slice(1)}() method instead`;
            throw new Error(message);
        }
        if (!emitterEventNames.includes(webhookNameOrNames)) {
            state.log.warn(`"${webhookNameOrNames}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`);
        }
        handleEventHandlers(state, webhookNameOrNames, handler);
    }
    function receiverOnAny(state, handler) {
        handleEventHandlers(state, "*", handler);
    }
    function receiverOnError(state, handler) {
        handleEventHandlers(state, "error", handler);
    }

    // Errors thrown or rejected Promises in "error" event handlers are not handled
    // as they are in the webhook event handlers. If errors occur, we log a
    // "Fatal: Error occurred" message to stdout
    function wrapErrorHandler(handler, error) {
        let returnValue;
        try {
            returnValue = handler(error);
        }
        catch (error) {
            console.log('FATAL: Error occurred in "error" event handler');
            console.log(error);
        }
        if (returnValue && returnValue.catch) {
            returnValue.catch((error) => {
                console.log('FATAL: Error occurred in "error" event handler');
                console.log(error);
            });
        }
    }

    // @ts-ignore to address #245
    function getHooks(state, eventPayloadAction, eventName) {
        const hooks = [state.hooks[eventName], state.hooks["*"]];
        if (eventPayloadAction) {
            hooks.unshift(state.hooks[`${eventName}.${eventPayloadAction}`]);
        }
        return [].concat(...hooks.filter(Boolean));
    }
    // main handler function
    function receiverHandle(state, event) {
        const errorHandlers = state.hooks.error || [];
        if (event instanceof Error) {
            const error = Object.assign(new aggregateError([event]), {
                event,
                errors: [event],
            });
            errorHandlers.forEach((handler) => wrapErrorHandler(handler, error));
            return Promise.reject(error);
        }
        if (!event || !event.name) {
            throw new aggregateError(["Event name not passed"]);
        }
        if (!event.payload) {
            throw new aggregateError(["Event payload not passed"]);
        }
        // flatten arrays of event listeners and remove undefined values
        const hooks = getHooks(state, "action" in event.payload ? event.payload.action : null, event.name);
        if (hooks.length === 0) {
            return Promise.resolve();
        }
        const errors = [];
        const promises = hooks.map((handler) => {
            let promise = Promise.resolve(event);
            if (state.transform) {
                promise = promise.then(state.transform);
            }
            return promise
                .then((event) => {
                return handler(event);
            })
                .catch((error) => errors.push(Object.assign(error, { event })));
        });
        return Promise.all(promises).then(() => {
            if (errors.length === 0) {
                return;
            }
            const error = new aggregateError(errors);
            Object.assign(error, {
                event,
                errors,
            });
            errorHandlers.forEach((handler) => wrapErrorHandler(handler, error));
            throw error;
        });
    }

    function removeListener(state, webhookNameOrNames, handler) {
        if (Array.isArray(webhookNameOrNames)) {
            webhookNameOrNames.forEach((webhookName) => removeListener(state, webhookName, handler));
            return;
        }
        if (!state.hooks[webhookNameOrNames]) {
            return;
        }
        // remove last hook that has been added, that way
        // it behaves the same as removeListener
        for (let i = state.hooks[webhookNameOrNames].length - 1; i >= 0; i--) {
            if (state.hooks[webhookNameOrNames][i] === handler) {
                state.hooks[webhookNameOrNames].splice(i, 1);
                return;
            }
        }
    }

    function createEventHandler(options) {
        const state = {
            hooks: {},
            log: createLogger(options && options.log),
        };
        if (options && options.transform) {
            state.transform = options.transform;
        }
        return {
            on: receiverOn.bind(null, state),
            onAny: receiverOnAny.bind(null, state),
            onError: receiverOnError.bind(null, state),
            removeListener: removeListener.bind(null, state),
            receive: receiverHandle.bind(null, state),
        };
    }

    /**
     * GitHub sends its JSON with no indentation and no line break at the end
     */
    function toNormalizedJsonString(payload) {
        const payloadString = JSON.stringify(payload);
        return payloadString.replace(/[^\\]\\u[\da-f]{4}/g, (s) => {
            return s.substr(0, 3) + s.substr(3).toUpperCase();
        });
    }

    async function sign(secret, payload) {
        return sign$1(secret, typeof payload === "string" ? payload : toNormalizedJsonString(payload));
    }

    async function verify(secret, payload, signature) {
        return verify$1(secret, typeof payload === "string" ? payload : toNormalizedJsonString(payload), signature);
    }

    async function verifyAndReceive(state, event) {
        // verify will validate that the secret is not undefined
        const matchesSignature = await verify$1(state.secret, typeof event.payload === "object"
            ? toNormalizedJsonString(event.payload)
            : event.payload, event.signature);
        if (!matchesSignature) {
            const error = new Error("[@octokit/webhooks] signature does not match event payload and secret");
            return state.eventHandler.receive(Object.assign(error, { event, status: 400 }));
        }
        return state.eventHandler.receive({
            id: event.id,
            name: event.name,
            payload: typeof event.payload === "string"
                ? JSON.parse(event.payload)
                : event.payload,
        });
    }

    const WEBHOOK_HEADERS = [
        "x-github-event",
        "x-hub-signature-256",
        "x-github-delivery",
    ];
    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#delivery-headers
    function getMissingHeaders(request) {
        return WEBHOOK_HEADERS.filter((header) => !(header in request.headers));
    }

    // @ts-ignore to address #245
    function getPayload(request) {
        // If request.body already exists we can stop here
        // See https://github.com/octokit/webhooks.js/pull/23
        if (request.body) {
            if (typeof request.body !== "string") {
                console.warn("[@octokit/webhooks] Passing the payload as a JSON object in `request.body` is deprecated and will be removed in a future release of `@octokit/webhooks`, please pass it as a a `string` instead.");
            }
            return Promise.resolve(request.body);
        }
        return new Promise((resolve, reject) => {
            let data = "";
            request.setEncoding("utf8");
            // istanbul ignore next
            request.on("error", (error) => reject(new aggregateError([error])));
            request.on("data", (chunk) => (data += chunk));
            request.on("end", () => {
                try {
                    // Call JSON.parse() only to check if the payload is valid JSON
                    JSON.parse(data);
                    resolve(data);
                }
                catch (error) {
                    error.message = "Invalid JSON";
                    error.status = 400;
                    reject(new aggregateError([error]));
                }
            });
        });
    }

    async function middleware(webhooks, options, request, response, next) {
        let pathname;
        try {
            pathname = new URL(request.url, "http://localhost").pathname;
        }
        catch (error) {
            response.writeHead(422, {
                "content-type": "application/json",
            });
            response.end(JSON.stringify({
                error: `Request URL could not be parsed: ${request.url}`,
            }));
            return;
        }
        const isUnknownRoute = request.method !== "POST" || pathname !== options.path;
        const isExpressMiddleware = typeof next === "function";
        if (isUnknownRoute) {
            if (isExpressMiddleware) {
                return next();
            }
            else {
                return options.onUnhandledRequest(request, response);
            }
        }
        // Check if the Content-Type header is `application/json` and allow for charset to be specified in it
        // Otherwise, return a 415 Unsupported Media Type error
        // See https://github.com/octokit/webhooks.js/issues/158
        if (!request.headers["content-type"] ||
            !request.headers["content-type"].startsWith("application/json")) {
            response.writeHead(415, {
                "content-type": "application/json",
                accept: "application/json",
            });
            response.end(JSON.stringify({
                error: `Unsupported "Content-Type" header value. Must be "application/json"`,
            }));
            return;
        }
        const missingHeaders = getMissingHeaders(request).join(", ");
        if (missingHeaders) {
            response.writeHead(400, {
                "content-type": "application/json",
            });
            response.end(JSON.stringify({
                error: `Required headers missing: ${missingHeaders}`,
            }));
            return;
        }
        const eventName = request.headers["x-github-event"];
        const signatureSHA256 = request.headers["x-hub-signature-256"];
        const id = request.headers["x-github-delivery"];
        options.log.debug(`${eventName} event received (id: ${id})`);
        // GitHub will abort the request if it does not receive a response within 10s
        // See https://github.com/octokit/webhooks.js/issues/185
        let didTimeout = false;
        const timeout = setTimeout(() => {
            didTimeout = true;
            response.statusCode = 202;
            response.end("still processing\n");
        }, 9000).unref();
        try {
            const payload = await getPayload(request);
            await webhooks.verifyAndReceive({
                id: id,
                name: eventName,
                payload: payload,
                signature: signatureSHA256,
            });
            clearTimeout(timeout);
            if (didTimeout)
                return;
            response.end("ok\n");
        }
        catch (error) {
            clearTimeout(timeout);
            if (didTimeout)
                return;
            const err = Array.from(error)[0];
            const errorMessage = err.message
                ? `${err.name}: ${err.message}`
                : "Error: An Unspecified error occurred";
            response.statusCode = typeof err.status !== "undefined" ? err.status : 500;
            options.log.error(error);
            response.end(JSON.stringify({
                error: errorMessage,
            }));
        }
    }

    function onUnhandledRequestDefault(request, response) {
        response.writeHead(404, {
            "content-type": "application/json",
        });
        response.end(JSON.stringify({
            error: `Unknown route: ${request.method} ${request.url}`,
        }));
    }

    function createNodeMiddleware(webhooks, { path = "/api/github/webhooks", onUnhandledRequest = onUnhandledRequestDefault, log = createLogger(), } = {}) {
        const deprecateOnUnhandledRequest = (request, response) => {
            console.warn("[@octokit/webhooks] `onUnhandledRequest()` is deprecated and will be removed in a future release of `@octokit/webhooks`");
            return onUnhandledRequest(request, response);
        };
        return middleware.bind(null, webhooks, {
            path,
            onUnhandledRequest: deprecateOnUnhandledRequest,
            log,
        });
    }

    // U holds the return value of `transform` function in Options
    class Webhooks {
        constructor(options) {
            if (!options || !options.secret) {
                throw new Error("[@octokit/webhooks] options.secret required");
            }
            const state = {
                eventHandler: createEventHandler(options),
                secret: options.secret,
                hooks: {},
                log: createLogger(options.log),
            };
            this.sign = sign.bind(null, options.secret);
            this.verify = (eventPayload, signature) => {
                if (typeof eventPayload === "object") {
                    console.warn("[@octokit/webhooks] Passing a JSON payload object to `verify()` is deprecated and the functionality will be removed in a future release of `@octokit/webhooks`");
                }
                return verify(options.secret, eventPayload, signature);
            };
            this.on = state.eventHandler.on;
            this.onAny = state.eventHandler.onAny;
            this.onError = state.eventHandler.onError;
            this.removeListener = state.eventHandler.removeListener;
            this.receive = state.eventHandler.receive;
            this.verifyAndReceive = (options) => {
                if (typeof options.payload === "object") {
                    console.warn("[@octokit/webhooks] Passing a JSON payload object to `verifyAndReceive()` is deprecated and the functionality will be removed in a future release of `@octokit/webhooks`");
                }
                return verifyAndReceive(state, options);
            };
        }
    }

    var distWeb = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Webhooks: Webhooks,
        createEventHandler: createEventHandler,
        createNodeMiddleware: createNodeMiddleware,
        emitterEventNames: emitterEventNames
    });

    var authApp = /*@__PURE__*/getAugmentedNamespace(distWeb$2);

    var webhooks$1 = /*@__PURE__*/getAugmentedNamespace(distWeb);

    var pluginPaginateRest = /*@__PURE__*/getAugmentedNamespace(distWeb$6);

    const VERSION$1 = "13.1.2";

    function webhooks(appOctokit, options
    // Explict return type for better debugability and performance,
    // see https://github.com/octokit/app.js/pull/201
    ) {
      return new webhooks$1.Webhooks({
        secret: options.secret,
        transform: async event => {
          if (!("installation" in event.payload) || typeof event.payload.installation !== "object") {
            const octokit = new appOctokit.constructor({
              authStrategy: authUnauthenticated.createUnauthenticatedAuth,
              auth: {
                reason: `"installation" key missing in webhook event payload`
              }
            });
            return {
              ...event,
              octokit
            };
          }
          const installationId = event.payload.installation.id;
          const octokit = await appOctokit.auth({
            type: "installation",
            installationId,
            factory(auth) {
              return new auth.octokit.constructor({
                ...auth.octokitOptions,
                authStrategy: authApp.createAppAuth,
                ...{
                  auth: {
                    ...auth,
                    installationId
                  }
                }
              });
            }
          });
          // set `x-github-delivery` header on all requests sent in response to the current
          // event. This allows GitHub Support to correlate the request with the event.
          // This is not documented and not considered public API, the header may change.
          // Once we document this as best practice on https://docs.github.com/en/rest/guides/best-practices-for-integrators
          // we will make it official
          /* istanbul ignore next */
          octokit.hook.before("request", options => {
            options.headers["x-github-delivery"] = event.id;
          });
          return {
            ...event,
            octokit
          };
        }
      });
    }

    async function getInstallationOctokit(app, installationId) {
      return app.octokit.auth({
        type: "installation",
        installationId: installationId,
        factory(auth) {
          const options = {
            ...auth.octokitOptions,
            authStrategy: authApp.createAppAuth,
            ...{
              auth: {
                ...auth,
                installationId: installationId
              }
            }
          };
          return new auth.octokit.constructor(options);
        }
      });
    }

    function eachInstallationFactory(app) {
      return Object.assign(eachInstallation.bind(null, app), {
        iterator: eachInstallationIterator.bind(null, app)
      });
    }
    async function eachInstallation(app, callback) {
      const i = eachInstallationIterator(app)[Symbol.asyncIterator]();
      let result = await i.next();
      while (!result.done) {
        await callback(result.value);
        result = await i.next();
      }
    }
    function eachInstallationIterator(app) {
      return {
        async *[Symbol.asyncIterator]() {
          const iterator = pluginPaginateRest.composePaginateRest.iterator(app.octokit, "GET /app/installations");
          for await (const {
            data: installations
          } of iterator) {
            for (const installation of installations) {
              const installationOctokit = await getInstallationOctokit(app, installation.id);
              yield {
                octokit: installationOctokit,
                installation
              };
            }
          }
        }
      };
    }

    function eachRepositoryFactory(app) {
      return Object.assign(eachRepository.bind(null, app), {
        iterator: eachRepositoryIterator.bind(null, app)
      });
    }
    async function eachRepository(app, queryOrCallback, callback) {
      const i = eachRepositoryIterator(app, callback ? queryOrCallback : undefined)[Symbol.asyncIterator]();
      let result = await i.next();
      while (!result.done) {
        if (callback) {
          await callback(result.value);
        } else {
          await queryOrCallback(result.value);
        }
        result = await i.next();
      }
    }
    function singleInstallationIterator(app, installationId) {
      return {
        async *[Symbol.asyncIterator]() {
          yield {
            octokit: await app.getInstallationOctokit(installationId)
          };
        }
      };
    }
    function eachRepositoryIterator(app, query) {
      return {
        async *[Symbol.asyncIterator]() {
          const iterator = query ? singleInstallationIterator(app, query.installationId) : app.eachInstallation.iterator();
          for await (const {
            octokit
          } of iterator) {
            const repositoriesIterator = pluginPaginateRest.composePaginateRest.iterator(octokit, "GET /installation/repositories");
            for await (const {
              data: repositories
            } of repositoriesIterator) {
              for (const repository of repositories) {
                yield {
                  octokit: octokit,
                  repository
                };
              }
            }
          }
        }
      };
    }

    class App$1 {
      static defaults(defaults) {
        const AppWithDefaults = class extends this {
          constructor(...args) {
            super({
              ...defaults,
              ...args[0]
            });
          }
        };
        return AppWithDefaults;
      }
      constructor(options) {
        const Octokit = options.Octokit || core.Octokit;
        const authOptions = Object.assign({
          appId: options.appId,
          privateKey: options.privateKey
        }, options.oauth ? {
          clientId: options.oauth.clientId,
          clientSecret: options.oauth.clientSecret
        } : {});
        this.octokit = new Octokit({
          authStrategy: authApp.createAppAuth,
          auth: authOptions,
          log: options.log
        });
        this.log = Object.assign({
          debug: () => {},
          info: () => {},
          warn: console.warn.bind(console),
          error: console.error.bind(console)
        }, options.log);
        // set app.webhooks depending on whether "webhooks" option has been passed
        if (options.webhooks) {
          // @ts-expect-error TODO: figure this out
          this.webhooks = webhooks(this.octokit, options.webhooks);
        } else {
          Object.defineProperty(this, "webhooks", {
            get() {
              throw new Error("[@octokit/app] webhooks option not set");
            }
          });
        }
        // set app.oauth depending on whether "oauth" option has been passed
        if (options.oauth) {
          this.oauth = new distNode.OAuthApp({
            ...options.oauth,
            clientType: "github-app",
            Octokit
          });
        } else {
          Object.defineProperty(this, "oauth", {
            get() {
              throw new Error("[@octokit/app] oauth.clientId / oauth.clientSecret options are not set");
            }
          });
        }
        this.getInstallationOctokit = getInstallationOctokit.bind(null, this);
        this.eachInstallation = eachInstallationFactory(this);
        this.eachRepository = eachRepositoryFactory(this);
      }
    }
    App$1.VERSION = VERSION$1;

    var App_1 = App$1;

    const VERSION = "2.0.14";

    const Octokit = Octokit$1.plugin(restEndpointMethods, paginateRest, retry, throttling).defaults({
        userAgent: `octokit.js/${VERSION}`,
        throttle: {
            onRateLimit,
            onSecondaryRateLimit,
        },
    });
    // istanbul ignore next no need to test internals of the throttle plugin
    function onRateLimit(retryAfter, options, octokit) {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        if (options.request.retryCount === 0) {
            // only retries once
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
        }
    }
    // istanbul ignore next no need to test internals of the throttle plugin
    function onSecondaryRateLimit(retryAfter, options, octokit) {
        octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
        if (options.request.retryCount === 0) {
            // only retries once
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
        }
    }

    App_1.defaults({ Octokit });
    OAuthApp_1.defaults({ Octokit });

    /* src/components/Card.svelte generated by Svelte v3.55.1 */

    const file$8 = "src/components/Card.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* eslint-disable no-use-before-define */

    /**
     * Base class for inheritance.
     */
    class Base {
      /**
       * Extends this object and runs the init method.
       * Arguments to create() will be passed to init().
       *
       * @return {Object} The new object.
       *
       * @static
       *
       * @example
       *
       *     var instance = MyType.create();
       */
      static create(...args) {
        return new this(...args);
      }

      /**
       * Copies properties into this object.
       *
       * @param {Object} properties The properties to mix in.
       *
       * @example
       *
       *     MyType.mixIn({
       *         field: 'value'
       *     });
       */
      mixIn(properties) {
        return Object.assign(this, properties);
      }

      /**
       * Creates a copy of this object.
       *
       * @return {Object} The clone.
       *
       * @example
       *
       *     var clone = instance.clone();
       */
      clone() {
        const clone = new this.constructor();
        Object.assign(clone, this);
        return clone;
      }
    }

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    class WordArray extends Base {
      /**
       * Initializes a newly created word array.
       *
       * @param {Array} words (Optional) An array of 32-bit words.
       * @param {number} sigBytes (Optional) The number of significant bytes in the words.
       *
       * @example
       *
       *     var wordArray = CryptoJS.lib.WordArray.create();
       *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
       *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
       */
      constructor(words = [], sigBytes = words.length * 4) {
        super();

        let typedArray = words;
        // Convert buffers to uint8
        if (typedArray instanceof ArrayBuffer) {
          typedArray = new Uint8Array(typedArray);
        }

        // Convert other array views to uint8
        if (
          typedArray instanceof Int8Array
          || typedArray instanceof Uint8ClampedArray
          || typedArray instanceof Int16Array
          || typedArray instanceof Uint16Array
          || typedArray instanceof Int32Array
          || typedArray instanceof Uint32Array
          || typedArray instanceof Float32Array
          || typedArray instanceof Float64Array
        ) {
          typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        }

        // Handle Uint8Array
        if (typedArray instanceof Uint8Array) {
          // Shortcut
          const typedArrayByteLength = typedArray.byteLength;

          // Extract bytes
          const _words = [];
          for (let i = 0; i < typedArrayByteLength; i += 1) {
            _words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
          }

          // Initialize this word array
          this.words = _words;
          this.sigBytes = typedArrayByteLength;
        } else {
          // Else call normal init
          this.words = words;
          this.sigBytes = sigBytes;
        }
      }

      /**
       * Creates a word array filled with random bytes.
       *
       * @param {number} nBytes The number of random bytes to generate.
       *
       * @return {WordArray} The random word array.
       *
       * @static
       *
       * @example
       *
       *     var wordArray = CryptoJS.lib.WordArray.random(16);
       */
      static random(nBytes) {
        const words = [];

        const r = (m_w) => {
          let _m_w = m_w;
          let _m_z = 0x3ade68b1;
          const mask = 0xffffffff;

          return () => {
            _m_z = (0x9069 * (_m_z & 0xFFFF) + (_m_z >> 0x10)) & mask;
            _m_w = (0x4650 * (_m_w & 0xFFFF) + (_m_w >> 0x10)) & mask;
            let result = ((_m_z << 0x10) + _m_w) & mask;
            result /= 0x100000000;
            result += 0.5;
            return result * (Math.random() > 0.5 ? 1 : -1);
          };
        };

        for (let i = 0, rcache; i < nBytes; i += 4) {
          const _r = r((rcache || Math.random()) * 0x100000000);

          rcache = _r() * 0x3ade67b7;
          words.push((_r() * 0x100000000) | 0);
        }

        return new WordArray(words, nBytes);
      }

      /**
       * Converts this word array to a string.
       *
       * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
       *
       * @return {string} The stringified word array.
       *
       * @example
       *
       *     var string = wordArray + '';
       *     var string = wordArray.toString();
       *     var string = wordArray.toString(CryptoJS.enc.Utf8);
       */
      toString(encoder = Hex) {
        return encoder.stringify(this);
      }

      /**
       * Concatenates a word array to this word array.
       *
       * @param {WordArray} wordArray The word array to append.
       *
       * @return {WordArray} This word array.
       *
       * @example
       *
       *     wordArray1.concat(wordArray2);
       */
      concat(wordArray) {
        // Shortcuts
        const thisWords = this.words;
        const thatWords = wordArray.words;
        const thisSigBytes = this.sigBytes;
        const thatSigBytes = wordArray.sigBytes;

        // Clamp excess bits
        this.clamp();

        // Concat
        if (thisSigBytes % 4) {
          // Copy one byte at a time
          for (let i = 0; i < thatSigBytes; i += 1) {
            const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
          }
        } else {
          // Copy one word at a time
          for (let i = 0; i < thatSigBytes; i += 4) {
            thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
          }
        }
        this.sigBytes += thatSigBytes;

        // Chainable
        return this;
      }

      /**
       * Removes insignificant bits.
       *
       * @example
       *
       *     wordArray.clamp();
       */
      clamp() {
        // Shortcuts
        const { words, sigBytes } = this;

        // Clamp
        words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
        words.length = Math.ceil(sigBytes / 4);
      }

      /**
       * Creates a copy of this word array.
       *
       * @return {WordArray} The clone.
       *
       * @example
       *
       *     var clone = wordArray.clone();
       */
      clone() {
        const clone = super.clone.call(this);
        clone.words = this.words.slice(0);

        return clone;
      }
    }

    /**
     * Hex encoding strategy.
     */
    const Hex = {
      /**
       * Converts a word array to a hex string.
       *
       * @param {WordArray} wordArray The word array.
       *
       * @return {string} The hex string.
       *
       * @static
       *
       * @example
       *
       *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
       */
      stringify(wordArray) {
        // Shortcuts
        const { words, sigBytes } = wordArray;

        // Convert
        const hexChars = [];
        for (let i = 0; i < sigBytes; i += 1) {
          const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          hexChars.push((bite >>> 4).toString(16));
          hexChars.push((bite & 0x0f).toString(16));
        }

        return hexChars.join('');
      },

      /**
       * Converts a hex string to a word array.
       *
       * @param {string} hexStr The hex string.
       *
       * @return {WordArray} The word array.
       *
       * @static
       *
       * @example
       *
       *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
       */
      parse(hexStr) {
        // Shortcut
        const hexStrLength = hexStr.length;

        // Convert
        const words = [];
        for (let i = 0; i < hexStrLength; i += 2) {
          words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
        }

        return new WordArray(words, hexStrLength / 2);
      },
    };

    /**
     * Latin1 encoding strategy.
     */
    const Latin1 = {
      /**
       * Converts a word array to a Latin1 string.
       *
       * @param {WordArray} wordArray The word array.
       *
       * @return {string} The Latin1 string.
       *
       * @static
       *
       * @example
       *
       *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
       */
      stringify(wordArray) {
        // Shortcuts
        const { words, sigBytes } = wordArray;

        // Convert
        const latin1Chars = [];
        for (let i = 0; i < sigBytes; i += 1) {
          const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          latin1Chars.push(String.fromCharCode(bite));
        }

        return latin1Chars.join('');
      },

      /**
       * Converts a Latin1 string to a word array.
       *
       * @param {string} latin1Str The Latin1 string.
       *
       * @return {WordArray} The word array.
       *
       * @static
       *
       * @example
       *
       *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
       */
      parse(latin1Str) {
        // Shortcut
        const latin1StrLength = latin1Str.length;

        // Convert
        const words = [];
        for (let i = 0; i < latin1StrLength; i += 1) {
          words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
        }

        return new WordArray(words, latin1StrLength);
      },
    };

    /**
     * UTF-8 encoding strategy.
     */
    const Utf8 = {
      /**
       * Converts a word array to a UTF-8 string.
       *
       * @param {WordArray} wordArray The word array.
       *
       * @return {string} The UTF-8 string.
       *
       * @static
       *
       * @example
       *
       *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
       */
      stringify(wordArray) {
        try {
          return decodeURIComponent(escape(Latin1.stringify(wordArray)));
        } catch (e) {
          throw new Error('Malformed UTF-8 data');
        }
      },

      /**
       * Converts a UTF-8 string to a word array.
       *
       * @param {string} utf8Str The UTF-8 string.
       *
       * @return {WordArray} The word array.
       *
       * @static
       *
       * @example
       *
       *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
       */
      parse(utf8Str) {
        return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
      },
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize
     *
     *     The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    class BufferedBlockAlgorithm extends Base {
      constructor() {
        super();
        this._minBufferSize = 0;
      }

      /**
       * Resets this block algorithm's data buffer to its initial state.
       *
       * @example
       *
       *     bufferedBlockAlgorithm.reset();
       */
      reset() {
        // Initial values
        this._data = new WordArray();
        this._nDataBytes = 0;
      }

      /**
       * Adds new data to this block algorithm's buffer.
       *
       * @param {WordArray|string} data
       *
       *     The data to append. Strings are converted to a WordArray using UTF-8.
       *
       * @example
       *
       *     bufferedBlockAlgorithm._append('data');
       *     bufferedBlockAlgorithm._append(wordArray);
       */
      _append(data) {
        let m_data = data;

        // Convert string to WordArray, else assume WordArray already
        if (typeof m_data === 'string') {
          m_data = Utf8.parse(m_data);
        }

        // Append
        this._data.concat(m_data);
        this._nDataBytes += m_data.sigBytes;
      }

      /**
       * Processes available data blocks.
       *
       * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
       *
       * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
       *
       * @return {WordArray} The processed data.
       *
       * @example
       *
       *     var processedData = bufferedBlockAlgorithm._process();
       *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
       */
      _process(doFlush) {
        let processedWords;

        // Shortcuts
        const { _data: data, blockSize } = this;
        const dataWords = data.words;
        const dataSigBytes = data.sigBytes;
        const blockSizeBytes = blockSize * 4;

        // Count blocks ready
        let nBlocksReady = dataSigBytes / blockSizeBytes;
        if (doFlush) {
          // Round up to include partial blocks
          nBlocksReady = Math.ceil(nBlocksReady);
        } else {
          // Round down to include only full blocks,
          // less the number of blocks that must remain in the buffer
          nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
        }

        // Count words ready
        const nWordsReady = nBlocksReady * blockSize;

        // Count bytes ready
        const nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

        // Process blocks
        if (nWordsReady) {
          for (let offset = 0; offset < nWordsReady; offset += blockSize) {
            // Perform concrete-algorithm logic
            this._doProcessBlock(dataWords, offset);
          }

          // Remove processed words
          processedWords = dataWords.splice(0, nWordsReady);
          data.sigBytes -= nBytesReady;
        }

        // Return processed words
        return new WordArray(processedWords, nBytesReady);
      }

      /**
       * Creates a copy of this object.
       *
       * @return {Object} The clone.
       *
       * @example
       *
       *     var clone = bufferedBlockAlgorithm.clone();
       */
      clone() {
        const clone = super.clone.call(this);
        clone._data = this._data.clone();

        return clone;
      }
    }

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize
     *
     *     The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    class Hasher extends BufferedBlockAlgorithm {
      constructor(cfg) {
        super();

        this.blockSize = 512 / 32;

        /**
         * Configuration options.
         */
        this.cfg = Object.assign(new Base(), cfg);

        // Set initial values
        this.reset();
      }

      /**
       * Creates a shortcut function to a hasher's object interface.
       *
       * @param {Hasher} SubHasher The hasher to create a helper for.
       *
       * @return {Function} The shortcut function.
       *
       * @static
       *
       * @example
       *
       *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
       */
      static _createHelper(SubHasher) {
        return (message, cfg) => new SubHasher(cfg).finalize(message);
      }

      /**
       * Creates a shortcut function to the HMAC's object interface.
       *
       * @param {Hasher} SubHasher The hasher to use in this HMAC helper.
       *
       * @return {Function} The shortcut function.
       *
       * @static
       *
       * @example
       *
       *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
       */
      static _createHmacHelper(SubHasher) {
        return (message, key) => new HMAC(SubHasher, key).finalize(message);
      }

      /**
       * Resets this hasher to its initial state.
       *
       * @example
       *
       *     hasher.reset();
       */
      reset() {
        // Reset data buffer
        super.reset.call(this);

        // Perform concrete-hasher logic
        this._doReset();
      }

      /**
       * Updates this hasher with a message.
       *
       * @param {WordArray|string} messageUpdate The message to append.
       *
       * @return {Hasher} This hasher.
       *
       * @example
       *
       *     hasher.update('message');
       *     hasher.update(wordArray);
       */
      update(messageUpdate) {
        // Append
        this._append(messageUpdate);

        // Update the hash
        this._process();

        // Chainable
        return this;
      }

      /**
       * Finalizes the hash computation.
       * Note that the finalize operation is effectively a destructive, read-once operation.
       *
       * @param {WordArray|string} messageUpdate (Optional) A final message update.
       *
       * @return {WordArray} The hash.
       *
       * @example
       *
       *     var hash = hasher.finalize();
       *     var hash = hasher.finalize('message');
       *     var hash = hasher.finalize(wordArray);
       */
      finalize(messageUpdate) {
        // Final message update
        if (messageUpdate) {
          this._append(messageUpdate);
        }

        // Perform concrete-hasher logic
        const hash = this._doFinalize();

        return hash;
      }
    }

    /**
     * HMAC algorithm.
     */
    class HMAC extends Base {
      /**
       * Initializes a newly created HMAC.
       *
       * @param {Hasher} SubHasher The hash algorithm to use.
       * @param {WordArray|string} key The secret key.
       *
       * @example
       *
       *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
       */
      constructor(SubHasher, key) {
        super();

        const hasher = new SubHasher();
        this._hasher = hasher;

        // Convert string to WordArray, else assume WordArray already
        let _key = key;
        if (typeof _key === 'string') {
          _key = Utf8.parse(_key);
        }

        // Shortcuts
        const hasherBlockSize = hasher.blockSize;
        const hasherBlockSizeBytes = hasherBlockSize * 4;

        // Allow arbitrary length keys
        if (_key.sigBytes > hasherBlockSizeBytes) {
          _key = hasher.finalize(key);
        }

        // Clamp excess bits
        _key.clamp();

        // Clone key for inner and outer pads
        const oKey = _key.clone();
        this._oKey = oKey;
        const iKey = _key.clone();
        this._iKey = iKey;

        // Shortcuts
        const oKeyWords = oKey.words;
        const iKeyWords = iKey.words;

        // XOR keys with pad constants
        for (let i = 0; i < hasherBlockSize; i += 1) {
          oKeyWords[i] ^= 0x5c5c5c5c;
          iKeyWords[i] ^= 0x36363636;
        }
        oKey.sigBytes = hasherBlockSizeBytes;
        iKey.sigBytes = hasherBlockSizeBytes;

        // Set initial values
        this.reset();
      }

      /**
       * Resets this HMAC to its initial state.
       *
       * @example
       *
       *     hmacHasher.reset();
       */
      reset() {
        // Shortcut
        const hasher = this._hasher;

        // Reset
        hasher.reset();
        hasher.update(this._iKey);
      }

      /**
       * Updates this HMAC with a message.
       *
       * @param {WordArray|string} messageUpdate The message to append.
       *
       * @return {HMAC} This HMAC instance.
       *
       * @example
       *
       *     hmacHasher.update('message');
       *     hmacHasher.update(wordArray);
       */
      update(messageUpdate) {
        this._hasher.update(messageUpdate);

        // Chainable
        return this;
      }

      /**
       * Finalizes the HMAC computation.
       * Note that the finalize operation is effectively a destructive, read-once operation.
       *
       * @param {WordArray|string} messageUpdate (Optional) A final message update.
       *
       * @return {WordArray} The HMAC.
       *
       * @example
       *
       *     var hmac = hmacHasher.finalize();
       *     var hmac = hmacHasher.finalize('message');
       *     var hmac = hmacHasher.finalize(wordArray);
       */
      finalize(messageUpdate) {
        // Shortcut
        const hasher = this._hasher;

        // Compute HMAC
        const innerHash = hasher.finalize(messageUpdate);
        hasher.reset();
        const hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

        return hmac;
      }
    }

    const parseLoop = (base64Str, base64StrLength, reverseMap) => {
      const words = [];
      let nBytes = 0;
      for (let i = 0; i < base64StrLength; i += 1) {
        if (i % 4) {
          const bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
          const bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
          const bitsCombined = bits1 | bits2;
          words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
          nBytes += 1;
        }
      }
      return WordArray.create(words, nBytes);
    };

    /**
     * Base64 encoding strategy.
     */
    const Base64 = {
      /**
       * Converts a word array to a Base64 string.
       *
       * @param {WordArray} wordArray The word array.
       *
       * @return {string} The Base64 string.
       *
       * @static
       *
       * @example
       *
       *     const base64String = CryptoJS.enc.Base64.stringify(wordArray);
       */
      stringify(wordArray) {
        // Shortcuts
        const { words, sigBytes } = wordArray;
        const map = this._map;

        // Clamp excess bits
        wordArray.clamp();

        // Convert
        const base64Chars = [];
        for (let i = 0; i < sigBytes; i += 3) {
          const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          const byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
          const byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

          const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

          for (let j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j += 1) {
            base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
          }
        }

        // Add padding
        const paddingChar = map.charAt(64);
        if (paddingChar) {
          while (base64Chars.length % 4) {
            base64Chars.push(paddingChar);
          }
        }

        return base64Chars.join('');
      },

      /**
       * Converts a Base64 string to a word array.
       *
       * @param {string} base64Str The Base64 string.
       *
       * @return {WordArray} The word array.
       *
       * @static
       *
       * @example
       *
       *     const wordArray = CryptoJS.enc.Base64.parse(base64String);
       */
      parse(base64Str) {
        // Shortcuts
        let base64StrLength = base64Str.length;
        const map = this._map;
        let reverseMap = this._reverseMap;

        if (!reverseMap) {
          this._reverseMap = [];
          reverseMap = this._reverseMap;
          for (let j = 0; j < map.length; j += 1) {
            reverseMap[map.charCodeAt(j)] = j;
          }
        }

        // Ignore padding
        const paddingChar = map.charAt(64);
        if (paddingChar) {
          const paddingIndex = base64Str.indexOf(paddingChar);
          if (paddingIndex !== -1) {
            base64StrLength = paddingIndex;
          }
        }

        // Convert
        return parseLoop(base64Str, base64StrLength, reverseMap);
      },

      _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    };

    // Constants table
    const T = [];

    // Compute constants
    for (let i = 0; i < 64; i += 1) {
      T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
    }

    const FF = (a, b, c, d, x, s, t) => {
      const n = a + ((b & c) | (~b & d)) + x + t;
      return ((n << s) | (n >>> (32 - s))) + b;
    };

    const GG = (a, b, c, d, x, s, t) => {
      const n = a + ((b & d) | (c & ~d)) + x + t;
      return ((n << s) | (n >>> (32 - s))) + b;
    };

    const HH = (a, b, c, d, x, s, t) => {
      const n = a + (b ^ c ^ d) + x + t;
      return ((n << s) | (n >>> (32 - s))) + b;
    };

    const II = (a, b, c, d, x, s, t) => {
      const n = a + (c ^ (b | ~d)) + x + t;
      return ((n << s) | (n >>> (32 - s))) + b;
    };

    /**
     * MD5 hash algorithm.
     */
    class MD5Algo extends Hasher {
      _doReset() {
        this._hash = new WordArray([
          0x67452301,
          0xefcdab89,
          0x98badcfe,
          0x10325476,
        ]);
      }

      _doProcessBlock(M, offset) {
        const _M = M;

        // Swap endian
        for (let i = 0; i < 16; i += 1) {
          // Shortcuts
          const offset_i = offset + i;
          const M_offset_i = M[offset_i];

          _M[offset_i] = (
            (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff)
              | (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
          );
        }

        // Shortcuts
        const H = this._hash.words;

        const M_offset_0 = _M[offset + 0];
        const M_offset_1 = _M[offset + 1];
        const M_offset_2 = _M[offset + 2];
        const M_offset_3 = _M[offset + 3];
        const M_offset_4 = _M[offset + 4];
        const M_offset_5 = _M[offset + 5];
        const M_offset_6 = _M[offset + 6];
        const M_offset_7 = _M[offset + 7];
        const M_offset_8 = _M[offset + 8];
        const M_offset_9 = _M[offset + 9];
        const M_offset_10 = _M[offset + 10];
        const M_offset_11 = _M[offset + 11];
        const M_offset_12 = _M[offset + 12];
        const M_offset_13 = _M[offset + 13];
        const M_offset_14 = _M[offset + 14];
        const M_offset_15 = _M[offset + 15];

        // Working varialbes
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];

        // Computation
        a = FF(a, b, c, d, M_offset_0, 7, T[0]);
        d = FF(d, a, b, c, M_offset_1, 12, T[1]);
        c = FF(c, d, a, b, M_offset_2, 17, T[2]);
        b = FF(b, c, d, a, M_offset_3, 22, T[3]);
        a = FF(a, b, c, d, M_offset_4, 7, T[4]);
        d = FF(d, a, b, c, M_offset_5, 12, T[5]);
        c = FF(c, d, a, b, M_offset_6, 17, T[6]);
        b = FF(b, c, d, a, M_offset_7, 22, T[7]);
        a = FF(a, b, c, d, M_offset_8, 7, T[8]);
        d = FF(d, a, b, c, M_offset_9, 12, T[9]);
        c = FF(c, d, a, b, M_offset_10, 17, T[10]);
        b = FF(b, c, d, a, M_offset_11, 22, T[11]);
        a = FF(a, b, c, d, M_offset_12, 7, T[12]);
        d = FF(d, a, b, c, M_offset_13, 12, T[13]);
        c = FF(c, d, a, b, M_offset_14, 17, T[14]);
        b = FF(b, c, d, a, M_offset_15, 22, T[15]);

        a = GG(a, b, c, d, M_offset_1, 5, T[16]);
        d = GG(d, a, b, c, M_offset_6, 9, T[17]);
        c = GG(c, d, a, b, M_offset_11, 14, T[18]);
        b = GG(b, c, d, a, M_offset_0, 20, T[19]);
        a = GG(a, b, c, d, M_offset_5, 5, T[20]);
        d = GG(d, a, b, c, M_offset_10, 9, T[21]);
        c = GG(c, d, a, b, M_offset_15, 14, T[22]);
        b = GG(b, c, d, a, M_offset_4, 20, T[23]);
        a = GG(a, b, c, d, M_offset_9, 5, T[24]);
        d = GG(d, a, b, c, M_offset_14, 9, T[25]);
        c = GG(c, d, a, b, M_offset_3, 14, T[26]);
        b = GG(b, c, d, a, M_offset_8, 20, T[27]);
        a = GG(a, b, c, d, M_offset_13, 5, T[28]);
        d = GG(d, a, b, c, M_offset_2, 9, T[29]);
        c = GG(c, d, a, b, M_offset_7, 14, T[30]);
        b = GG(b, c, d, a, M_offset_12, 20, T[31]);

        a = HH(a, b, c, d, M_offset_5, 4, T[32]);
        d = HH(d, a, b, c, M_offset_8, 11, T[33]);
        c = HH(c, d, a, b, M_offset_11, 16, T[34]);
        b = HH(b, c, d, a, M_offset_14, 23, T[35]);
        a = HH(a, b, c, d, M_offset_1, 4, T[36]);
        d = HH(d, a, b, c, M_offset_4, 11, T[37]);
        c = HH(c, d, a, b, M_offset_7, 16, T[38]);
        b = HH(b, c, d, a, M_offset_10, 23, T[39]);
        a = HH(a, b, c, d, M_offset_13, 4, T[40]);
        d = HH(d, a, b, c, M_offset_0, 11, T[41]);
        c = HH(c, d, a, b, M_offset_3, 16, T[42]);
        b = HH(b, c, d, a, M_offset_6, 23, T[43]);
        a = HH(a, b, c, d, M_offset_9, 4, T[44]);
        d = HH(d, a, b, c, M_offset_12, 11, T[45]);
        c = HH(c, d, a, b, M_offset_15, 16, T[46]);
        b = HH(b, c, d, a, M_offset_2, 23, T[47]);

        a = II(a, b, c, d, M_offset_0, 6, T[48]);
        d = II(d, a, b, c, M_offset_7, 10, T[49]);
        c = II(c, d, a, b, M_offset_14, 15, T[50]);
        b = II(b, c, d, a, M_offset_5, 21, T[51]);
        a = II(a, b, c, d, M_offset_12, 6, T[52]);
        d = II(d, a, b, c, M_offset_3, 10, T[53]);
        c = II(c, d, a, b, M_offset_10, 15, T[54]);
        b = II(b, c, d, a, M_offset_1, 21, T[55]);
        a = II(a, b, c, d, M_offset_8, 6, T[56]);
        d = II(d, a, b, c, M_offset_15, 10, T[57]);
        c = II(c, d, a, b, M_offset_6, 15, T[58]);
        b = II(b, c, d, a, M_offset_13, 21, T[59]);
        a = II(a, b, c, d, M_offset_4, 6, T[60]);
        d = II(d, a, b, c, M_offset_11, 10, T[61]);
        c = II(c, d, a, b, M_offset_2, 15, T[62]);
        b = II(b, c, d, a, M_offset_9, 21, T[63]);

        // Intermediate hash value
        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
      }
      /* eslint-ensable no-param-reassign */

      _doFinalize() {
        // Shortcuts
        const data = this._data;
        const dataWords = data.words;

        const nBitsTotal = this._nDataBytes * 8;
        const nBitsLeft = data.sigBytes * 8;

        // Add padding
        dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - (nBitsLeft % 32));

        const nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
        const nBitsTotalL = nBitsTotal;
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
          (((nBitsTotalH << 8) | (nBitsTotalH >>> 24)) & 0x00ff00ff)
            | (((nBitsTotalH << 24) | (nBitsTotalH >>> 8)) & 0xff00ff00)
        );
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
          (((nBitsTotalL << 8) | (nBitsTotalL >>> 24)) & 0x00ff00ff)
            | (((nBitsTotalL << 24) | (nBitsTotalL >>> 8)) & 0xff00ff00)
        );

        data.sigBytes = (dataWords.length + 1) * 4;

        // Hash final blocks
        this._process();

        // Shortcuts
        const hash = this._hash;
        const H = hash.words;

        // Swap endian
        for (let i = 0; i < 4; i += 1) {
          // Shortcut
          const H_i = H[i];

          H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff)
            | (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00);
        }

        // Return final computed hash
        return hash;
      }

      clone() {
        const clone = super.clone.call(this);
        clone._hash = this._hash.clone();

        return clone;
      }
    }

    /**
     * This key derivation function is meant to conform with EVP_BytesToKey.
     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
     */
    class EvpKDFAlgo extends Base {
      /**
       * Initializes a newly created key derivation function.
       *
       * @param {Object} cfg (Optional) The configuration options to use for the derivation.
       *
       * @example
       *
       *     const kdf = CryptoJS.algo.EvpKDF.create();
       *     const kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
       *     const kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
       */
      constructor(cfg) {
        super();

        /**
         * Configuration options.
         *
         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
         * @property {number} iterations The number of iterations to perform. Default: 1
         */
        this.cfg = Object.assign(
          new Base(),
          {
            keySize: 128 / 32,
            hasher: MD5Algo,
            iterations: 1,
          },
          cfg,
        );
      }

      /**
       * Derives a key from a password.
       *
       * @param {WordArray|string} password The password.
       * @param {WordArray|string} salt A salt.
       *
       * @return {WordArray} The derived key.
       *
       * @example
       *
       *     const key = kdf.compute(password, salt);
       */
      compute(password, salt) {
        let block;

        // Shortcut
        const { cfg } = this;

        // Init hasher
        const hasher = cfg.hasher.create();

        // Initial values
        const derivedKey = WordArray.create();

        // Shortcuts
        const derivedKeyWords = derivedKey.words;
        const { keySize, iterations } = cfg;

        // Generate key
        while (derivedKeyWords.length < keySize) {
          if (block) {
            hasher.update(block);
          }
          block = hasher.update(password).finalize(salt);
          hasher.reset();

          // Iterations
          for (let i = 1; i < iterations; i += 1) {
            block = hasher.finalize(block);
            hasher.reset();
          }

          derivedKey.concat(block);
        }
        derivedKey.sigBytes = keySize * 4;

        return derivedKey;
      }
    }

    /* eslint-disable no-use-before-define */

    /**
     * Abstract base cipher template.
     *
     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
     */
    class Cipher extends BufferedBlockAlgorithm {
      /**
       * Initializes a newly created cipher.
       *
       * @param {number} xformMode Either the encryption or decryption transormation mode constant.
       * @param {WordArray} key The key.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @example
       *
       *     const cipher = CryptoJS.algo.AES.create(
       *       CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray }
       *     );
       */
      constructor(xformMode, key, cfg) {
        super();

        /**
         * Configuration options.
         *
         * @property {WordArray} iv The IV to use for this operation.
         */
        this.cfg = Object.assign(new Base(), cfg);

        // Store transform mode and key
        this._xformMode = xformMode;
        this._key = key;

        // Set initial values
        this.reset();
      }

      /**
       * Creates this cipher in encryption mode.
       *
       * @param {WordArray} key The key.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {Cipher} A cipher instance.
       *
       * @static
       *
       * @example
       *
       *     const cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
       */
      static createEncryptor(key, cfg) {
        return this.create(this._ENC_XFORM_MODE, key, cfg);
      }

      /**
       * Creates this cipher in decryption mode.
       *
       * @param {WordArray} key The key.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {Cipher} A cipher instance.
       *
       * @static
       *
       * @example
       *
       *     const cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
       */
      static createDecryptor(key, cfg) {
        return this.create(this._DEC_XFORM_MODE, key, cfg);
      }

      /**
       * Creates shortcut functions to a cipher's object interface.
       *
       * @param {Cipher} cipher The cipher to create a helper for.
       *
       * @return {Object} An object with encrypt and decrypt shortcut functions.
       *
       * @static
       *
       * @example
       *
       *     const AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
       */
      static _createHelper(SubCipher) {
        const selectCipherStrategy = (key) => {
          if (typeof key === 'string') {
            return PasswordBasedCipher;
          }
          return SerializableCipher;
        };

        return {
          encrypt(message, key, cfg) {
            return selectCipherStrategy(key).encrypt(SubCipher, message, key, cfg);
          },

          decrypt(ciphertext, key, cfg) {
            return selectCipherStrategy(key).decrypt(SubCipher, ciphertext, key, cfg);
          },
        };
      }

      /**
       * Resets this cipher to its initial state.
       *
       * @example
       *
       *     cipher.reset();
       */
      reset() {
        // Reset data buffer
        super.reset.call(this);

        // Perform concrete-cipher logic
        this._doReset();
      }

      /**
       * Adds data to be encrypted or decrypted.
       *
       * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
       *
       * @return {WordArray} The data after processing.
       *
       * @example
       *
       *     const encrypted = cipher.process('data');
       *     const encrypted = cipher.process(wordArray);
       */
      process(dataUpdate) {
        // Append
        this._append(dataUpdate);

        // Process available blocks
        return this._process();
      }

      /**
       * Finalizes the encryption or decryption process.
       * Note that the finalize operation is effectively a destructive, read-once operation.
       *
       * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
       *
       * @return {WordArray} The data after final processing.
       *
       * @example
       *
       *     const encrypted = cipher.finalize();
       *     const encrypted = cipher.finalize('data');
       *     const encrypted = cipher.finalize(wordArray);
       */
      finalize(dataUpdate) {
        // Final data update
        if (dataUpdate) {
          this._append(dataUpdate);
        }

        // Perform concrete-cipher logic
        const finalProcessedData = this._doFinalize();

        return finalProcessedData;
      }
    }
    Cipher._ENC_XFORM_MODE = 1;
    Cipher._DEC_XFORM_MODE = 2;
    Cipher.keySize = 128 / 32;
    Cipher.ivSize = 128 / 32;

    /**
     * Abstract base block cipher mode template.
     */
    class BlockCipherMode extends Base {
      /**
       * Initializes a newly created mode.
       *
       * @param {Cipher} cipher A block cipher instance.
       * @param {Array} iv The IV words.
       *
       * @example
       *
       *     const mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
       */
      constructor(cipher, iv) {
        super();

        this._cipher = cipher;
        this._iv = iv;
      }

      /**
       * Creates this mode for encryption.
       *
       * @param {Cipher} cipher A block cipher instance.
       * @param {Array} iv The IV words.
       *
       * @static
       *
       * @example
       *
       *     const mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
       */
      static createEncryptor(cipher, iv) {
        return this.Encryptor.create(cipher, iv);
      }

      /**
       * Creates this mode for decryption.
       *
       * @param {Cipher} cipher A block cipher instance.
       * @param {Array} iv The IV words.
       *
       * @static
       *
       * @example
       *
       *     const mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
       */
      static createDecryptor(cipher, iv) {
        return this.Decryptor.create(cipher, iv);
      }
    }

    function xorBlock(words, offset, blockSize) {
      const _words = words;
      let block;

      // Shortcut
      const iv = this._iv;

      // Choose mixing block
      if (iv) {
        block = iv;

        // Remove IV for subsequent blocks
        this._iv = undefined;
      } else {
        block = this._prevBlock;
      }

      // XOR blocks
      for (let i = 0; i < blockSize; i += 1) {
        _words[offset + i] ^= block[i];
      }
    }

    /**
     * Cipher Block Chaining mode.
     */

    /**
     * Abstract base CBC mode.
     */
    class CBC extends BlockCipherMode {
    }
    /**
     * CBC encryptor.
     */
    CBC.Encryptor = class extends CBC {
      /**
       * Processes the data block at offset.
       *
       * @param {Array} words The data words to operate on.
       * @param {number} offset The offset where the block starts.
       *
       * @example
       *
       *     mode.processBlock(data.words, offset);
       */
      processBlock(words, offset) {
        // Shortcuts
        const cipher = this._cipher;
        const { blockSize } = cipher;

        // XOR and encrypt
        xorBlock.call(this, words, offset, blockSize);
        cipher.encryptBlock(words, offset);

        // Remember this block to use with next block
        this._prevBlock = words.slice(offset, offset + blockSize);
      }
    };
    /**
     * CBC decryptor.
     */
    CBC.Decryptor = class extends CBC {
      /**
       * Processes the data block at offset.
       *
       * @param {Array} words The data words to operate on.
       * @param {number} offset The offset where the block starts.
       *
       * @example
       *
       *     mode.processBlock(data.words, offset);
       */
      processBlock(words, offset) {
        // Shortcuts
        const cipher = this._cipher;
        const { blockSize } = cipher;

        // Remember this block to use with next block
        const thisBlock = words.slice(offset, offset + blockSize);

        // Decrypt and XOR
        cipher.decryptBlock(words, offset);
        xorBlock.call(this, words, offset, blockSize);

        // This block becomes the previous block
        this._prevBlock = thisBlock;
      }
    };

    /**
     * PKCS #5/7 padding strategy.
     */
    const Pkcs7 = {
      /**
       * Pads data using the algorithm defined in PKCS #5/7.
       *
       * @param {WordArray} data The data to pad.
       * @param {number} blockSize The multiple that the data should be padded to.
       *
       * @static
       *
       * @example
       *
       *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
       */
      pad(data, blockSize) {
        // Shortcut
        const blockSizeBytes = blockSize * 4;

        // Count padding bytes
        const nPaddingBytes = blockSizeBytes - (data.sigBytes % blockSizeBytes);

        // Create padding word
        const paddingWord = (nPaddingBytes << 24)
          | (nPaddingBytes << 16)
          | (nPaddingBytes << 8)
          | nPaddingBytes;

        // Create padding
        const paddingWords = [];
        for (let i = 0; i < nPaddingBytes; i += 4) {
          paddingWords.push(paddingWord);
        }
        const padding = WordArray.create(paddingWords, nPaddingBytes);

        // Add padding
        data.concat(padding);
      },

      /**
       * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
       *
       * @param {WordArray} data The data to unpad.
       *
       * @static
       *
       * @example
       *
       *     CryptoJS.pad.Pkcs7.unpad(wordArray);
       */
      unpad(data) {
        const _data = data;

        // Get number of padding bytes from last byte
        const nPaddingBytes = _data.words[(_data.sigBytes - 1) >>> 2] & 0xff;

        // Remove padding
        _data.sigBytes -= nPaddingBytes;
      },
    };

    /**
     * Abstract base block cipher template.
     *
     * @property {number} blockSize
     *
     *    The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
     */
    class BlockCipher extends Cipher {
      constructor(xformMode, key, cfg) {
        /**
         * Configuration options.
         *
         * @property {Mode} mode The block mode to use. Default: CBC
         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
         */
        super(xformMode, key, Object.assign(
          {
            mode: CBC,
            padding: Pkcs7,
          },
          cfg,
        ));

        this.blockSize = 128 / 32;
      }

      reset() {
        let modeCreator;

        // Reset cipher
        super.reset.call(this);

        // Shortcuts
        const { cfg } = this;
        const { iv, mode } = cfg;

        // Reset block mode
        if (this._xformMode === this.constructor._ENC_XFORM_MODE) {
          modeCreator = mode.createEncryptor;
        } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
          modeCreator = mode.createDecryptor;
          // Keep at least one block in the buffer for unpadding
          this._minBufferSize = 1;
        }

        this._mode = modeCreator.call(mode, this, iv && iv.words);
        this._mode.__creator = modeCreator;
      }

      _doProcessBlock(words, offset) {
        this._mode.processBlock(words, offset);
      }

      _doFinalize() {
        let finalProcessedBlocks;

        // Shortcut
        const { padding } = this.cfg;

        // Finalize
        if (this._xformMode === this.constructor._ENC_XFORM_MODE) {
          // Pad data
          padding.pad(this._data, this.blockSize);

          // Process final blocks
          finalProcessedBlocks = this._process(!!'flush');
        } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
          // Process final blocks
          finalProcessedBlocks = this._process(!!'flush');

          // Unpad data
          padding.unpad(finalProcessedBlocks);
        }

        return finalProcessedBlocks;
      }
    }

    /**
     * A collection of cipher parameters.
     *
     * @property {WordArray} ciphertext The raw ciphertext.
     * @property {WordArray} key The key to this ciphertext.
     * @property {WordArray} iv The IV used in the ciphering operation.
     * @property {WordArray} salt The salt used with a key derivation function.
     * @property {Cipher} algorithm The cipher algorithm.
     * @property {Mode} mode The block mode used in the ciphering operation.
     * @property {Padding} padding The padding scheme used in the ciphering operation.
     * @property {number} blockSize The block size of the cipher.
     * @property {Format} formatter
     *    The default formatting strategy to convert this cipher params object to a string.
     */
    class CipherParams extends Base {
      /**
       * Initializes a newly created cipher params object.
       *
       * @param {Object} cipherParams An object with any of the possible cipher parameters.
       *
       * @example
       *
       *     var cipherParams = CryptoJS.lib.CipherParams.create({
       *         ciphertext: ciphertextWordArray,
       *         key: keyWordArray,
       *         iv: ivWordArray,
       *         salt: saltWordArray,
       *         algorithm: CryptoJS.algo.AES,
       *         mode: CryptoJS.mode.CBC,
       *         padding: CryptoJS.pad.PKCS7,
       *         blockSize: 4,
       *         formatter: CryptoJS.format.OpenSSL
       *     });
       */
      constructor(cipherParams) {
        super();

        this.mixIn(cipherParams);
      }

      /**
       * Converts this cipher params object to a string.
       *
       * @param {Format} formatter (Optional) The formatting strategy to use.
       *
       * @return {string} The stringified cipher params.
       *
       * @throws Error If neither the formatter nor the default formatter is set.
       *
       * @example
       *
       *     var string = cipherParams + '';
       *     var string = cipherParams.toString();
       *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
       */
      toString(formatter) {
        return (formatter || this.formatter).stringify(this);
      }
    }

    /**
     * OpenSSL formatting strategy.
     */
    const OpenSSLFormatter = {
      /**
       * Converts a cipher params object to an OpenSSL-compatible string.
       *
       * @param {CipherParams} cipherParams The cipher params object.
       *
       * @return {string} The OpenSSL-compatible string.
       *
       * @static
       *
       * @example
       *
       *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
       */
      stringify(cipherParams) {
        let wordArray;

        // Shortcuts
        const { ciphertext, salt } = cipherParams;

        // Format
        if (salt) {
          wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
        } else {
          wordArray = ciphertext;
        }

        return wordArray.toString(Base64);
      },

      /**
       * Converts an OpenSSL-compatible string to a cipher params object.
       *
       * @param {string} openSSLStr The OpenSSL-compatible string.
       *
       * @return {CipherParams} The cipher params object.
       *
       * @static
       *
       * @example
       *
       *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
       */
      parse(openSSLStr) {
        let salt;

        // Parse base64
        const ciphertext = Base64.parse(openSSLStr);

        // Shortcut
        const ciphertextWords = ciphertext.words;

        // Test for salt
        if (ciphertextWords[0] === 0x53616c74 && ciphertextWords[1] === 0x65645f5f) {
          // Extract salt
          salt = WordArray.create(ciphertextWords.slice(2, 4));

          // Remove salt from ciphertext
          ciphertextWords.splice(0, 4);
          ciphertext.sigBytes -= 16;
        }

        return CipherParams.create({ ciphertext, salt });
      },
    };

    /**
     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
     */
    class SerializableCipher extends Base {
      /**
       * Encrypts a message.
       *
       * @param {Cipher} cipher The cipher algorithm to use.
       * @param {WordArray|string} message The message to encrypt.
       * @param {WordArray} key The key.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {CipherParams} A cipher params object.
       *
       * @static
       *
       * @example
       *
       *     var ciphertextParams = CryptoJS.lib.SerializableCipher
       *       .encrypt(CryptoJS.algo.AES, message, key);
       *     var ciphertextParams = CryptoJS.lib.SerializableCipher
       *       .encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
       *     var ciphertextParams = CryptoJS.lib.SerializableCipher
       *       .encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
       */
      static encrypt(cipher, message, key, cfg) {
        // Apply config defaults
        const _cfg = Object.assign(new Base(), this.cfg, cfg);

        // Encrypt
        const encryptor = cipher.createEncryptor(key, _cfg);
        const ciphertext = encryptor.finalize(message);

        // Shortcut
        const cipherCfg = encryptor.cfg;

        // Create and return serializable cipher params
        return CipherParams.create({
          ciphertext,
          key,
          iv: cipherCfg.iv,
          algorithm: cipher,
          mode: cipherCfg.mode,
          padding: cipherCfg.padding,
          blockSize: encryptor.blockSize,
          formatter: _cfg.format,
        });
      }

      /**
       * Decrypts serialized ciphertext.
       *
       * @param {Cipher} cipher The cipher algorithm to use.
       * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
       * @param {WordArray} key The key.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {WordArray} The plaintext.
       *
       * @static
       *
       * @example
       *
       *     var plaintext = CryptoJS.lib.SerializableCipher
       *       .decrypt(CryptoJS.algo.AES, formattedCiphertext, key,
       *         { iv: iv, format: CryptoJS.format.OpenSSL });
       *     var plaintext = CryptoJS.lib.SerializableCipher
       *       .decrypt(CryptoJS.algo.AES, ciphertextParams, key,
       *         { iv: iv, format: CryptoJS.format.OpenSSL });
       */
      static decrypt(cipher, ciphertext, key, cfg) {
        let _ciphertext = ciphertext;

        // Apply config defaults
        const _cfg = Object.assign(new Base(), this.cfg, cfg);

        // Convert string to CipherParams
        _ciphertext = this._parse(_ciphertext, _cfg.format);

        // Decrypt
        const plaintext = cipher.createDecryptor(key, _cfg).finalize(_ciphertext.ciphertext);

        return plaintext;
      }

      /**
       * Converts serialized ciphertext to CipherParams,
       * else assumed CipherParams already and returns ciphertext unchanged.
       *
       * @param {CipherParams|string} ciphertext The ciphertext.
       * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
       *
       * @return {CipherParams} The unserialized ciphertext.
       *
       * @static
       *
       * @example
       *
       *     var ciphertextParams = CryptoJS.lib.SerializableCipher
       *       ._parse(ciphertextStringOrParams, format);
       */
      static _parse(ciphertext, format) {
        if (typeof ciphertext === 'string') {
          return format.parse(ciphertext, this);
        }
        return ciphertext;
      }
    }
    /**
     * Configuration options.
     *
     * @property {Formatter} format
     *
     *    The formatting strategy to convert cipher param objects to and from a string.
     *    Default: OpenSSL
     */
    SerializableCipher.cfg = Object.assign(
      new Base(),
      { format: OpenSSLFormatter },
    );

    /**
     * OpenSSL key derivation function.
     */
    const OpenSSLKdf = {
      /**
       * Derives a key and IV from a password.
       *
       * @param {string} password The password to derive from.
       * @param {number} keySize The size in words of the key to generate.
       * @param {number} ivSize The size in words of the IV to generate.
       * @param {WordArray|string} salt
       *     (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
       *
       * @return {CipherParams} A cipher params object with the key, IV, and salt.
       *
       * @static
       *
       * @example
       *
       *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
       *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
       */
      execute(password, keySize, ivSize, salt) {
        let _salt = salt;

        // Generate random salt
        if (!_salt) {
          _salt = WordArray.random(64 / 8);
        }

        // Derive key and IV
        const key = EvpKDFAlgo.create({ keySize: keySize + ivSize }).compute(password, _salt);

        // Separate key and IV
        const iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
        key.sigBytes = keySize * 4;

        // Return params
        return CipherParams.create({ key, iv, salt: _salt });
      },
    };

    /**
     * A serializable cipher wrapper that derives the key from a password,
     * and returns ciphertext as a serializable cipher params object.
     */
    class PasswordBasedCipher extends SerializableCipher {
      /**
       * Encrypts a message using a password.
       *
       * @param {Cipher} cipher The cipher algorithm to use.
       * @param {WordArray|string} message The message to encrypt.
       * @param {string} password The password.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {CipherParams} A cipher params object.
       *
       * @static
       *
       * @example
       *
       *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher
       *       .encrypt(CryptoJS.algo.AES, message, 'password');
       *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher
       *       .encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
       */
      static encrypt(cipher, message, password, cfg) {
        // Apply config defaults
        const _cfg = Object.assign(new Base(), this.cfg, cfg);

        // Derive key and other params
        const derivedParams = _cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

        // Add IV to config
        _cfg.iv = derivedParams.iv;

        // Encrypt
        const ciphertext = SerializableCipher.encrypt
          .call(this, cipher, message, derivedParams.key, _cfg);

        // Mix in derived params
        ciphertext.mixIn(derivedParams);

        return ciphertext;
      }

      /**
       * Decrypts serialized ciphertext using a password.
       *
       * @param {Cipher} cipher The cipher algorithm to use.
       * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
       * @param {string} password The password.
       * @param {Object} cfg (Optional) The configuration options to use for this operation.
       *
       * @return {WordArray} The plaintext.
       *
       * @static
       *
       * @example
       *
       *     var plaintext = CryptoJS.lib.PasswordBasedCipher
       *       .decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password',
       *         { format: CryptoJS.format.OpenSSL });
       *     var plaintext = CryptoJS.lib.PasswordBasedCipher
       *       .decrypt(CryptoJS.algo.AES, ciphertextParams, 'password',
       *         { format: CryptoJS.format.OpenSSL });
       */
      static decrypt(cipher, ciphertext, password, cfg) {
        let _ciphertext = ciphertext;

        // Apply config defaults
        const _cfg = Object.assign(new Base(), this.cfg, cfg);

        // Convert string to CipherParams
        _ciphertext = this._parse(_ciphertext, _cfg.format);

        // Derive key and other params
        const derivedParams = _cfg.kdf
          .execute(password, cipher.keySize, cipher.ivSize, _ciphertext.salt);

        // Add IV to config
        _cfg.iv = derivedParams.iv;

        // Decrypt
        const plaintext = SerializableCipher.decrypt
          .call(this, cipher, _ciphertext, derivedParams.key, _cfg);

        return plaintext;
      }
    }
    /**
     * Configuration options.
     *
     * @property {KDF} kdf
     *     The key derivation function to use to generate a key and IV from a password.
     *     Default: OpenSSL
     */
    PasswordBasedCipher.cfg = Object.assign(SerializableCipher.cfg, { kdf: OpenSSLKdf });

    // Lookup tables
    const _SBOX = [];
    const INV_SBOX = [];
    const _SUB_MIX_0 = [];
    const _SUB_MIX_1 = [];
    const _SUB_MIX_2 = [];
    const _SUB_MIX_3 = [];
    const INV_SUB_MIX_0 = [];
    const INV_SUB_MIX_1 = [];
    const INV_SUB_MIX_2 = [];
    const INV_SUB_MIX_3 = [];

    // Compute lookup tables

    // Compute double table
    const d = [];
    for (let i = 0; i < 256; i += 1) {
      if (i < 128) {
        d[i] = i << 1;
      } else {
        d[i] = (i << 1) ^ 0x11b;
      }
    }

    // Walk GF(2^8)
    let x = 0;
    let xi = 0;
    for (let i = 0; i < 256; i += 1) {
      // Compute sbox
      let sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
      sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
      _SBOX[x] = sx;
      INV_SBOX[sx] = x;

      // Compute multiplication
      const x2 = d[x];
      const x4 = d[x2];
      const x8 = d[x4];

      // Compute sub bytes, mix columns tables
      let t = (d[sx] * 0x101) ^ (sx * 0x1010100);
      _SUB_MIX_0[x] = (t << 24) | (t >>> 8);
      _SUB_MIX_1[x] = (t << 16) | (t >>> 16);
      _SUB_MIX_2[x] = (t << 8) | (t >>> 24);
      _SUB_MIX_3[x] = t;

      // Compute inv sub bytes, inv mix columns tables
      t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
      INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
      INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
      INV_SUB_MIX_2[sx] = (t << 8) | (t >>> 24);
      INV_SUB_MIX_3[sx] = t;

      // Compute next counter
      if (!x) {
        xi = 1;
        x = xi;
      } else {
        x = x2 ^ d[d[d[x8 ^ x2]]];
        xi ^= d[d[xi]];
      }
    }

    // Precomputed Rcon lookup
    const RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

    /**
     * AES block cipher algorithm.
     */
    class AESAlgo extends BlockCipher {
      _doReset() {
        let t;

        // Skip reset of nRounds has been set before and key did not change
        if (this._nRounds && this._keyPriorReset === this._key) {
          return;
        }

        // Shortcuts
        this._keyPriorReset = this._key;
        const key = this._keyPriorReset;
        const keyWords = key.words;
        const keySize = key.sigBytes / 4;

        // Compute number of rounds
        this._nRounds = keySize + 6;
        const nRounds = this._nRounds;

        // Compute number of key schedule rows
        const ksRows = (nRounds + 1) * 4;

        // Compute key schedule
        this._keySchedule = [];
        const keySchedule = this._keySchedule;
        for (let ksRow = 0; ksRow < ksRows; ksRow += 1) {
          if (ksRow < keySize) {
            keySchedule[ksRow] = keyWords[ksRow];
          } else {
            t = keySchedule[ksRow - 1];

            if (!(ksRow % keySize)) {
              // Rot word
              t = (t << 8) | (t >>> 24);

              // Sub word
              t = (_SBOX[t >>> 24] << 24)
                | (_SBOX[(t >>> 16) & 0xff] << 16)
                | (_SBOX[(t >>> 8) & 0xff] << 8)
                | _SBOX[t & 0xff];

              // Mix Rcon
              t ^= RCON[(ksRow / keySize) | 0] << 24;
            } else if (keySize > 6 && ksRow % keySize === 4) {
              // Sub word
              t = (_SBOX[t >>> 24] << 24)
                | (_SBOX[(t >>> 16) & 0xff] << 16)
                | (_SBOX[(t >>> 8) & 0xff] << 8)
                | _SBOX[t & 0xff];
            }

            keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
          }
        }

        // Compute inv key schedule
        this._invKeySchedule = [];
        const invKeySchedule = this._invKeySchedule;
        for (let invKsRow = 0; invKsRow < ksRows; invKsRow += 1) {
          const ksRow = ksRows - invKsRow;

          if (invKsRow % 4) {
            t = keySchedule[ksRow];
          } else {
            t = keySchedule[ksRow - 4];
          }

          if (invKsRow < 4 || ksRow <= 4) {
            invKeySchedule[invKsRow] = t;
          } else {
            invKeySchedule[invKsRow] = INV_SUB_MIX_0[_SBOX[t >>> 24]]
              ^ INV_SUB_MIX_1[_SBOX[(t >>> 16) & 0xff]]
              ^ INV_SUB_MIX_2[_SBOX[(t >>> 8) & 0xff]]
              ^ INV_SUB_MIX_3[_SBOX[t & 0xff]];
          }
        }
      }

      encryptBlock(M, offset) {
        this._doCryptBlock(
          M, offset, this._keySchedule, _SUB_MIX_0, _SUB_MIX_1, _SUB_MIX_2, _SUB_MIX_3, _SBOX,
        );
      }

      decryptBlock(M, offset) {
        const _M = M;

        // Swap 2nd and 4th rows
        let t = _M[offset + 1];
        _M[offset + 1] = _M[offset + 3];
        _M[offset + 3] = t;

        this._doCryptBlock(
          _M,
          offset,
          this._invKeySchedule,
          INV_SUB_MIX_0,
          INV_SUB_MIX_1,
          INV_SUB_MIX_2,
          INV_SUB_MIX_3,
          INV_SBOX,
        );

        // Inv swap 2nd and 4th rows
        t = _M[offset + 1];
        _M[offset + 1] = _M[offset + 3];
        _M[offset + 3] = t;
      }

      _doCryptBlock(M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
        const _M = M;

        // Shortcut
        const nRounds = this._nRounds;

        // Get input, add round key
        let s0 = _M[offset] ^ keySchedule[0];
        let s1 = _M[offset + 1] ^ keySchedule[1];
        let s2 = _M[offset + 2] ^ keySchedule[2];
        let s3 = _M[offset + 3] ^ keySchedule[3];

        // Key schedule row counter
        let ksRow = 4;

        // Rounds
        for (let round = 1; round < nRounds; round += 1) {
          // Shift rows, sub bytes, mix columns, add round key
          const t0 = SUB_MIX_0[s0 >>> 24]
            ^ SUB_MIX_1[(s1 >>> 16) & 0xff]
            ^ SUB_MIX_2[(s2 >>> 8) & 0xff]
            ^ SUB_MIX_3[s3 & 0xff]
            ^ keySchedule[ksRow];
          ksRow += 1;
          const t1 = SUB_MIX_0[s1 >>> 24]
            ^ SUB_MIX_1[(s2 >>> 16) & 0xff]
            ^ SUB_MIX_2[(s3 >>> 8) & 0xff]
            ^ SUB_MIX_3[s0 & 0xff]
            ^ keySchedule[ksRow];
          ksRow += 1;
          const t2 = SUB_MIX_0[s2 >>> 24]
            ^ SUB_MIX_1[(s3 >>> 16) & 0xff]
            ^ SUB_MIX_2[(s0 >>> 8) & 0xff]
            ^ SUB_MIX_3[s1 & 0xff]
            ^ keySchedule[ksRow];
          ksRow += 1;
          const t3 = SUB_MIX_0[s3 >>> 24]
            ^ SUB_MIX_1[(s0 >>> 16) & 0xff]
            ^ SUB_MIX_2[(s1 >>> 8) & 0xff]
            ^ SUB_MIX_3[s2 & 0xff]
            ^ keySchedule[ksRow];
          ksRow += 1;

          // Update state
          s0 = t0;
          s1 = t1;
          s2 = t2;
          s3 = t3;
        }

        // Shift rows, sub bytes, add round key
        const t0 = (
          (SBOX[s0 >>> 24] << 24)
            | (SBOX[(s1 >>> 16) & 0xff] << 16)
            | (SBOX[(s2 >>> 8) & 0xff] << 8)
            | SBOX[s3 & 0xff]
        ) ^ keySchedule[ksRow];
        ksRow += 1;
        const t1 = (
          (SBOX[s1 >>> 24] << 24)
            | (SBOX[(s2 >>> 16) & 0xff] << 16)
            | (SBOX[(s3 >>> 8) & 0xff] << 8)
            | SBOX[s0 & 0xff]
        ) ^ keySchedule[ksRow];
        ksRow += 1;
        const t2 = (
          (SBOX[s2 >>> 24] << 24)
            | (SBOX[(s3 >>> 16) & 0xff] << 16)
            | (SBOX[(s0 >>> 8) & 0xff] << 8)
            | SBOX[s1 & 0xff]
        ) ^ keySchedule[ksRow];
        ksRow += 1;
        const t3 = (
          (SBOX[s3 >>> 24] << 24)
            | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]
        ) ^ keySchedule[ksRow];
        ksRow += 1;

        // Set output
        _M[offset] = t0;
        _M[offset + 1] = t1;
        _M[offset + 2] = t2;
        _M[offset + 3] = t3;
      }
    }
    AESAlgo.keySize = 256 / 32;

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
     */
    const AES = BlockCipher._createHelper(AESAlgo);

    /* src/components/RunResult.svelte generated by Svelte v3.55.1 */

    const { console: console_1$2 } = globals;
    const file$7 = "src/components/RunResult.svelte";

    // (64:0) <Card>
    function create_default_slot$2(ctx) {
    	let h3;
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(/*items*/ ctx[0]);
    			attr_dev(h3, "class", "card svelte-csngm4");
    			set_style(h3, "border", "15px solid " + /*color*/ ctx[1]);
    			add_location(h3, file$7, 64, 2, 1752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1) set_data_dev(t, /*items*/ ctx[0]);

    			if (dirty & /*color*/ 2) {
    				set_style(h3, "border", "15px solid " + /*color*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(64:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, color, items*/ 1027) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RunResult', slots, []);
    	let { repo } = $$props;
    	let repo_name = repo.repo;
    	let repo_workflow = repo.workflow;
    	let data = 'U2FsdGVkX19JiO2zWIvUIWor4+MboPmBcBMe2UqUUNG0zQ7SLX6s7L+YqXzAuzQlN6Rs370dOkyX5iP9PKU+nSaHVS5/s30i641uD4dJvKKZEsv1GHuc1/c8Qm6eTR6I9LhbOWz0m0g9mfeCqtGw7g==';

    	const octokit = new Octokit({
    			auth: AES.decrypt(data, "password").toString(Utf8)
    		});

    	function workflow(owner, repo) {
    		return workflow = octokit.request("GET /repos/{owner}/{repo}/actions/workflows", { owner, repo });
    	}

    	function run_list(owner, repo, id) {
    		return octokit.request("GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs", { owner, repo, workflow_id: id });
    	}

    	async function run() {
    		let workflow_id;
    		const owner = "threefoldtech";
    		const workflow_ob = await workflow(owner, repo_name);

    		for (let i = 0; i < workflow_ob.data["workflows"].length; i++) {
    			if (workflow_ob.data["workflows"][i].name === repo_workflow) {
    				workflow_id = workflow_ob.data["workflows"][i].id;
    			}
    		}

    		return await run_list(owner, repo_name, workflow_id);
    	}

    	let items = "Loading";
    	let color = "darkgoldenrod";

    	(async () => {
    		const runlist = await run();
    		console.log(runlist);
    		$$invalidate(0, items = runlist.data["workflow_runs"][0]["conclusion"]);
    		$$invalidate(1, color = items === "success" ? "#31A82D" : "#DB3334");
    		$$invalidate(0, items = items === null ? "Working" : items);
    		$$invalidate(1, color = items === "Working" ? "darkgoldenrod" : color);
    	})();

    	$$self.$$.on_mount.push(function () {
    		if (repo === undefined && !('repo' in $$props || $$self.$$.bound[$$self.$$.props['repo']])) {
    			console_1$2.warn("<RunResult> was created without expected prop 'repo'");
    		}
    	});

    	const writable_props = ['repo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<RunResult> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('repo' in $$props) $$invalidate(2, repo = $$props.repo);
    	};

    	$$self.$capture_state = () => ({
    		Octokit,
    		Card,
    		AES,
    		Utf8,
    		repo,
    		repo_name,
    		repo_workflow,
    		data,
    		octokit,
    		workflow,
    		run_list,
    		run,
    		items,
    		color
    	});

    	$$self.$inject_state = $$props => {
    		if ('repo' in $$props) $$invalidate(2, repo = $$props.repo);
    		if ('repo_name' in $$props) repo_name = $$props.repo_name;
    		if ('repo_workflow' in $$props) repo_workflow = $$props.repo_workflow;
    		if ('data' in $$props) data = $$props.data;
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, color, repo];
    }

    class RunResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { repo: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RunResult",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get repo() {
    		throw new Error("<RunResult>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set repo(value) {
    		throw new Error("<RunResult>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FinalReport.svelte generated by Svelte v3.55.1 */
    const file$6 = "src/components/FinalReport.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each Repo as repo}
    function create_each_block$2(ctx) {
    	let div;
    	let p;
    	let t0_value = /*repo*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let runresult;
    	let t2;
    	let current;

    	runresult = new RunResult({
    			props: { repo: /*repo*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(runresult.$$.fragment);
    			t2 = space();
    			attr_dev(p, "class", "name-display svelte-hgupy");
    			add_location(p, file$6, 9, 6, 162);
    			attr_dev(div, "class", "repo svelte-hgupy");
    			add_location(div, file$6, 8, 4, 137);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    			mount_component(runresult, div, null);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*Repo*/ 1) && t0_value !== (t0_value = /*repo*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			const runresult_changes = {};
    			if (dirty & /*Repo*/ 1) runresult_changes.repo = /*repo*/ ctx[1];
    			runresult.$set(runresult_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(runresult.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(runresult.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(runresult);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(8:2) {#each Repo as repo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	let each_value = /*Repo*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "repo svelte-hgupy");
    			add_location(div, file$6, 6, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Repo*/ 1) {
    				each_value = /*Repo*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FinalReport', slots, []);
    	let { Repo = [] } = $$props;
    	const writable_props = ['Repo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FinalReport> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Repo' in $$props) $$invalidate(0, Repo = $$props.Repo);
    	};

    	$$self.$capture_state = () => ({ RunResult, Repo });

    	$$self.$inject_state = $$props => {
    		if ('Repo' in $$props) $$invalidate(0, Repo = $$props.Repo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Repo];
    }

    class FinalReport extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { Repo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FinalReport",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get Repo() {
    		throw new Error("<FinalReport>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Repo(value) {
    		throw new Error("<FinalReport>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/components/Pie.svelte generated by Svelte v3.55.1 */

    const file$5 = "src/components/Pie.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let circle0;
    	let circle1;
    	let circle1_r_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			attr_dev(circle0, "r", /*radius*/ ctx[3]);
    			attr_dev(circle0, "cx", /*radius*/ ctx[3]);
    			attr_dev(circle0, "cy", /*radius*/ ctx[3]);
    			attr_dev(circle0, "fill", /*bgColor*/ ctx[1]);
    			add_location(circle0, file$5, 14, 2, 406);
    			attr_dev(circle1, "r", circle1_r_value = /*radius*/ ctx[3] / 2);
    			attr_dev(circle1, "cx", /*radius*/ ctx[3]);
    			attr_dev(circle1, "cy", /*radius*/ ctx[3]);
    			attr_dev(circle1, "fill", /*bgColor*/ ctx[1]);
    			attr_dev(circle1, "stroke", /*fgColor*/ ctx[2]);
    			attr_dev(circle1, "stroke-width", /*radius*/ ctx[3]);
    			attr_dev(circle1, "stroke-dasharray", /*dashArray*/ ctx[4]);
    			add_location(circle1, file$5, 15, 2, 469);
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[5]);
    			add_location(svg, file$5, 13, 0, 361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle0);
    			append_dev(svg, circle1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle0, "r", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle0, "cx", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle0, "cy", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*bgColor*/ 2) {
    				attr_dev(circle0, "fill", /*bgColor*/ ctx[1]);
    			}

    			if (dirty & /*radius*/ 8 && circle1_r_value !== (circle1_r_value = /*radius*/ ctx[3] / 2)) {
    				attr_dev(circle1, "r", circle1_r_value);
    			}

    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle1, "cx", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle1, "cy", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*bgColor*/ 2) {
    				attr_dev(circle1, "fill", /*bgColor*/ ctx[1]);
    			}

    			if (dirty & /*fgColor*/ 4) {
    				attr_dev(circle1, "stroke", /*fgColor*/ ctx[2]);
    			}

    			if (dirty & /*radius*/ 8) {
    				attr_dev(circle1, "stroke-width", /*radius*/ ctx[3]);
    			}

    			if (dirty & /*dashArray*/ 16) {
    				attr_dev(circle1, "stroke-dasharray", /*dashArray*/ ctx[4]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*viewBox*/ 32) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[5]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let viewBox;
    	let radius;
    	let halfCircumference;
    	let pieSize;
    	let dashArray;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pie', slots, []);
    	let { size = 200 } = $$props;
    	let { percent = 0 } = $$props;
    	let { bgColor = "#1e7145" } = $$props;
    	let { fgColor = "#b91d47" } = $$props;
    	const writable_props = ['size', 'percent', 'bgColor', 'fgColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pie> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('percent' in $$props) $$invalidate(6, percent = $$props.percent);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('fgColor' in $$props) $$invalidate(2, fgColor = $$props.fgColor);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		percent,
    		bgColor,
    		fgColor,
    		pieSize,
    		halfCircumference,
    		dashArray,
    		radius,
    		viewBox
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('percent' in $$props) $$invalidate(6, percent = $$props.percent);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('fgColor' in $$props) $$invalidate(2, fgColor = $$props.fgColor);
    		if ('pieSize' in $$props) $$invalidate(7, pieSize = $$props.pieSize);
    		if ('halfCircumference' in $$props) $$invalidate(8, halfCircumference = $$props.halfCircumference);
    		if ('dashArray' in $$props) $$invalidate(4, dashArray = $$props.dashArray);
    		if ('radius' in $$props) $$invalidate(3, radius = $$props.radius);
    		if ('viewBox' in $$props) $$invalidate(5, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 1) {
    			$$invalidate(5, viewBox = `0 0 ${size} ${size}`);
    		}

    		if ($$self.$$.dirty & /*size*/ 1) {
    			$$invalidate(3, radius = size / 2);
    		}

    		if ($$self.$$.dirty & /*radius*/ 8) {
    			$$invalidate(8, halfCircumference = Math.PI * radius);
    		}

    		if ($$self.$$.dirty & /*halfCircumference, percent*/ 320) {
    			$$invalidate(7, pieSize = halfCircumference * (percent / 100));
    		}

    		if ($$self.$$.dirty & /*halfCircumference, pieSize*/ 384) {
    			$$invalidate(4, dashArray = `0 ${halfCircumference - pieSize} ${pieSize}`);
    		}
    	};

    	return [
    		size,
    		bgColor,
    		fgColor,
    		radius,
    		dashArray,
    		viewBox,
    		percent,
    		pieSize,
    		halfCircumference
    	];
    }

    class Pie extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			size: 0,
    			percent: 6,
    			bgColor: 1,
    			fgColor: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pie",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get size() {
    		throw new Error("<Pie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Pie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get percent() {
    		throw new Error("<Pie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set percent(value) {
    		throw new Error("<Pie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Pie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Pie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fgColor() {
    		throw new Error("<Pie>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fgColor(value) {
    		throw new Error("<Pie>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Chart.svelte generated by Svelte v3.55.1 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/components/Chart.svelte";

    function create_fragment$4(ctx) {
    	let body;
    	let pie;
    	let current;

    	pie = new Pie({
    			props: { size: 200, percent: /*$store*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			body = element("body");
    			create_component(pie.$$.fragment);
    			attr_dev(body, "class", "svelte-npgpwm");
    			add_location(body, file$4, 78, 0, 2028);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			mount_component(pie, body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pie_changes = {};
    			if (dirty & /*$store*/ 1) pie_changes.percent = /*$store*/ ctx[0];
    			pie.$set(pie_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pie.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pie.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(pie);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $store;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chart', slots, []);
    	let { repo } = $$props;
    	let repo_name = repo.repo;
    	let repo_workflow = repo.workflow;
    	let data = 'U2FsdGVkX19JiO2zWIvUIWor4+MboPmBcBMe2UqUUNG0zQ7SLX6s7L+YqXzAuzQlN6Rs370dOkyX5iP9PKU+nSaHVS5/s30i641uD4dJvKKZEsv1GHuc1/c8Qm6eTR6I9LhbOWz0m0g9mfeCqtGw7g==';

    	const octokit = new Octokit({
    			auth: AES.decrypt(data, "password").toString(Utf8)
    		});

    	function workflow(owner, repo) {
    		return workflow = octokit.request("GET /repos/{owner}/{repo}/actions/workflows", { owner, repo });
    	}

    	function run_list(owner, repo, id) {
    		return octokit.request("GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs", { owner, repo, workflow_id: id });
    	}

    	async function run() {
    		let workflow_id;
    		const owner = "threefoldtech";
    		const workflow_ob = await workflow(owner, repo_name);

    		for (let i = 0; i < workflow_ob.data["workflows"].length; i++) {
    			if (workflow_ob.data["workflows"][i].name === repo_workflow) {
    				workflow_id = workflow_ob.data["workflows"][i].id;
    			}
    		}

    		const run_list_ob = await run_list(owner, repo_name, workflow_id);
    		return run_list_ob;
    	}

    	async function run_details() {
    		const runlist = await run();
    		let size = runlist.data["workflow_runs"].length;
    		let fail = 0;

    		for (let i = 0; i < size; i++) {
    			if (runlist.data["workflow_runs"][i]["conclusion"] == "failure") {
    				fail += 1;
    			}
    		}

    		return fail;
    	}

    	let result = 0;
    	const store = tweened(0, { duration: 1000 });
    	validate_store(store, 'store');
    	component_subscribe($$self, store, value => $$invalidate(0, $store = value));

    	(async () => {
    		let result = await run_details();
    		console.log(result);
    		store.set(result);
    	})();

    	$$self.$$.on_mount.push(function () {
    		if (repo === undefined && !('repo' in $$props || $$self.$$.bound[$$self.$$.props['repo']])) {
    			console_1$1.warn("<Chart> was created without expected prop 'repo'");
    		}
    	});

    	const writable_props = ['repo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('repo' in $$props) $$invalidate(2, repo = $$props.repo);
    	};

    	$$self.$capture_state = () => ({
    		Octokit,
    		tweened,
    		Pie,
    		AES,
    		Utf8,
    		repo,
    		repo_name,
    		repo_workflow,
    		data,
    		octokit,
    		workflow,
    		run_list,
    		run,
    		run_details,
    		result,
    		store,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ('repo' in $$props) $$invalidate(2, repo = $$props.repo);
    		if ('repo_name' in $$props) repo_name = $$props.repo_name;
    		if ('repo_workflow' in $$props) repo_workflow = $$props.repo_workflow;
    		if ('data' in $$props) data = $$props.data;
    		if ('result' in $$props) result = $$props.result;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$store, store, repo];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { repo: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get repo() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set repo(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/RunList.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/RunList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (94:2) <Card>
    function create_default_slot$1(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let t1_value = /*detials*/ ctx[10].number + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*detials*/ ctx[10].result + "";
    	let t3;
    	let t4;
    	let p2;
    	let t5_value = /*detials*/ ctx[10].time.toLocaleString() + "";
    	let t5;
    	let t6;
    	let a;
    	let t7;
    	let a_href_value;
    	let t8;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("Run Number:");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			p2 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			a = element("a");
    			t7 = text("Logs");
    			t8 = space();
    			add_location(p0, file$3, 95, 6, 2516);
    			set_style(p1, "color", /*detials*/ ctx[10].color);
    			add_location(p1, file$3, 96, 6, 2557);
    			add_location(p2, file$3, 97, 6, 2618);
    			attr_dev(a, "href", a_href_value = /*detials*/ ctx[10].url);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noreferrer");
    			add_location(a, file$3, 98, 6, 2663);
    			attr_dev(div, "class", "cards svelte-16a9fnl");
    			add_location(div, file$3, 94, 4, 2490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(div, t4);
    			append_dev(div, p2);
    			append_dev(p2, t5);
    			append_dev(div, t6);
    			append_dev(div, a);
    			append_dev(a, t7);
    			insert_dev(target, t8, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*runs*/ 1 && t1_value !== (t1_value = /*detials*/ ctx[10].number + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*runs*/ 1 && t3_value !== (t3_value = /*detials*/ ctx[10].result + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*runs*/ 1) {
    				set_style(p1, "color", /*detials*/ ctx[10].color);
    			}

    			if (dirty & /*runs*/ 1 && t5_value !== (t5_value = /*detials*/ ctx[10].time.toLocaleString() + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*runs*/ 1 && a_href_value !== (a_href_value = /*detials*/ ctx[10].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(94:2) <Card>",
    		ctx
    	});

    	return block;
    }

    // (93:0) {#each runs as detials}
    function create_each_block$1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};

    			if (dirty & /*$$scope, runs*/ 8193) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(93:0) {#each runs as detials}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*runs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*runs*/ 1) {
    				each_value = /*runs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RunList', slots, []);
    	let { repo } = $$props;
    	let repo_name = repo.repo;
    	let repo_workflow = repo.workflow;
    	let data = 'U2FsdGVkX19JiO2zWIvUIWor4+MboPmBcBMe2UqUUNG0zQ7SLX6s7L+YqXzAuzQlN6Rs370dOkyX5iP9PKU+nSaHVS5/s30i641uD4dJvKKZEsv1GHuc1/c8Qm6eTR6I9LhbOWz0m0g9mfeCqtGw7g==';

    	const octokit = new Octokit({
    			auth: AES.decrypt(data, "password").toString(Utf8)
    		});

    	function workflow(owner, repo) {
    		return workflow = octokit.request("GET /repos/{owner}/{repo}/actions/workflows", { owner, repo });
    	}

    	function run_list(owner, repo, id) {
    		return octokit.request("GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs", { owner, repo, workflow_id: id });
    	}

    	async function run() {
    		let workflow_id;
    		const owner = "threefoldtech";
    		const workflow_ob = await workflow(owner, repo_name);

    		for (let i = 0; i < workflow_ob.data["workflows"].length; i++) {
    			if (workflow_ob.data["workflows"][i].name === repo_workflow) {
    				workflow_id = workflow_ob.data["workflows"][i].id;
    			}
    		}

    		const run_list_ob = await run_list(owner, repo_name, workflow_id);
    		return run_list_ob;
    	}

    	async function run_details() {
    		let runs = [];
    		const runlist = await run();
    		let color = "darkgoldenrod";
    		let number, result, time, url = "Loading";

    		let size = runlist.data["workflow_runs"].length > 5
    		? 5
    		: runlist.data["workflow_runs"].length;

    		for (let i = 0; i < size; i++) {
    			number = runlist.data["workflow_runs"][i]["run_number"];
    			result = runlist.data["workflow_runs"][i]["conclusion"];
    			time = new Date(runlist.data["workflow_runs"][i]["run_started_at"]);
    			url = await fetch(runlist.data["workflow_runs"][i]["jobs_url"]).then(response => response.json()).then(json => json["jobs"][0]["html_url"]);
    			color = result === "success" ? "darkgreen" : "crimson";
    			runs.push({ number, result, time, url, color });
    		}

    		return runs;
    	}

    	let runs = [];

    	(async () => {
    		$$invalidate(0, runs = await run_details());
    		console.log(runs);
    	})();

    	$$self.$$.on_mount.push(function () {
    		if (repo === undefined && !('repo' in $$props || $$self.$$.bound[$$self.$$.props['repo']])) {
    			console_1.warn("<RunList> was created without expected prop 'repo'");
    		}
    	});

    	const writable_props = ['repo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<RunList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('repo' in $$props) $$invalidate(1, repo = $$props.repo);
    	};

    	$$self.$capture_state = () => ({
    		Octokit,
    		Card,
    		AES,
    		Utf8,
    		repo,
    		repo_name,
    		repo_workflow,
    		data,
    		octokit,
    		workflow,
    		run_list,
    		run,
    		run_details,
    		runs
    	});

    	$$self.$inject_state = $$props => {
    		if ('repo' in $$props) $$invalidate(1, repo = $$props.repo);
    		if ('repo_name' in $$props) repo_name = $$props.repo_name;
    		if ('repo_workflow' in $$props) repo_workflow = $$props.repo_workflow;
    		if ('data' in $$props) data = $$props.data;
    		if ('runs' in $$props) $$invalidate(0, runs = $$props.runs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [runs, repo];
    }

    class RunList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { repo: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RunList",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get repo() {
    		throw new Error("<RunList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set repo(value) {
    		throw new Error("<RunList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/CollapsibleSection.svelte generated by Svelte v3.55.1 */

    const file$2 = "src/components/CollapsibleSection.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h3;
    	let button;
    	let t0;
    	let t1;
    	let svg;
    	let path0;
    	let path1;
    	let t2;
    	let div0;
    	let div0_hidden_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			button = element("button");
    			t0 = text(/*headerText*/ ctx[0]);
    			t1 = space();
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t2 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(path0, "class", "vert svelte-1xy6o65");
    			attr_dev(path0, "d", "M10 1V19");
    			attr_dev(path0, "stroke", "black");
    			attr_dev(path0, "stroke-width", "2");
    			add_location(path0, file$2, 11, 8, 252);
    			attr_dev(path1, "d", "M1 10L19 10");
    			attr_dev(path1, "stroke", "black");
    			attr_dev(path1, "stroke-width", "2");
    			add_location(path1, file$2, 12, 8, 327);
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "class", "svelte-1xy6o65");
    			add_location(svg, file$2, 10, 6, 206);
    			attr_dev(button, "aria-expanded", /*expanded*/ ctx[1]);
    			attr_dev(button, "class", "svelte-1xy6o65");
    			add_location(button, file$2, 8, 4, 107);
    			attr_dev(h3, "class", "svelte-1xy6o65");
    			add_location(h3, file$2, 7, 2, 98);
    			attr_dev(div0, "class", "contents");
    			div0.hidden = div0_hidden_value = !/*expanded*/ ctx[1];
    			add_location(div0, file$2, 17, 2, 422);
    			attr_dev(div1, "class", "collapsible svelte-1xy6o65");
    			add_location(div1, file$2, 6, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, button);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*headerText*/ 1) set_data_dev(t0, /*headerText*/ ctx[0]);

    			if (!current || dirty & /*expanded*/ 2) {
    				attr_dev(button, "aria-expanded", /*expanded*/ ctx[1]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*expanded*/ 2 && div0_hidden_value !== (div0_hidden_value = !/*expanded*/ ctx[1])) {
    				prop_dev(div0, "hidden", div0_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CollapsibleSection', slots, ['default']);
    	let { headerText } = $$props;
    	let expanded = false;

    	$$self.$$.on_mount.push(function () {
    		if (headerText === undefined && !('headerText' in $$props || $$self.$$.bound[$$self.$$.props['headerText']])) {
    			console.warn("<CollapsibleSection> was created without expected prop 'headerText'");
    		}
    	});

    	const writable_props = ['headerText'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CollapsibleSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, expanded = !expanded);

    	$$self.$$set = $$props => {
    		if ('headerText' in $$props) $$invalidate(0, headerText = $$props.headerText);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ headerText, expanded });

    	$$self.$inject_state = $$props => {
    		if ('headerText' in $$props) $$invalidate(0, headerText = $$props.headerText);
    		if ('expanded' in $$props) $$invalidate(1, expanded = $$props.expanded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [headerText, expanded, $$scope, slots, click_handler];
    }

    class CollapsibleSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { headerText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CollapsibleSection",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get headerText() {
    		throw new Error("<CollapsibleSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerText(value) {
    		throw new Error("<CollapsibleSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ReportList.svelte generated by Svelte v3.55.1 */
    const file$1 = "src/components/ReportList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (11:2) <CollapsibleSection headerText={repo.name}>
    function create_default_slot(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let runlist;
    	let t;
    	let div1;
    	let chart;
    	let current;

    	runlist = new RunList({
    			props: { repo: /*repo*/ ctx[1] },
    			$$inline: true
    		});

    	chart = new Chart({
    			props: { repo: /*repo*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(runlist.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(chart.$$.fragment);
    			attr_dev(div0, "class", "repo svelte-12vb76d");
    			add_location(div0, file$1, 13, 8, 325);
    			attr_dev(div1, "class", "chart svelte-12vb76d");
    			add_location(div1, file$1, 16, 8, 396);
    			attr_dev(div2, "class", "repo svelte-12vb76d");
    			add_location(div2, file$1, 12, 6, 298);
    			attr_dev(div3, "class", "content svelte-12vb76d");
    			add_location(div3, file$1, 11, 4, 270);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			mount_component(runlist, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(chart, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const runlist_changes = {};
    			if (dirty & /*Repo*/ 1) runlist_changes.repo = /*repo*/ ctx[1];
    			runlist.$set(runlist_changes);
    			const chart_changes = {};
    			if (dirty & /*Repo*/ 1) chart_changes.repo = /*repo*/ ctx[1];
    			chart.$set(chart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(runlist.$$.fragment, local);
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(runlist.$$.fragment, local);
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(runlist);
    			destroy_component(chart);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(11:2) <CollapsibleSection headerText={repo.name}>",
    		ctx
    	});

    	return block;
    }

    // (9:0) {#each Repo as repo}
    function create_each_block(ctx) {
    	let section;
    	let collapsiblesection;
    	let t;
    	let current;

    	collapsiblesection = new CollapsibleSection({
    			props: {
    				headerText: /*repo*/ ctx[1].name,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(collapsiblesection.$$.fragment);
    			t = space();
    			attr_dev(section, "class", "svelte-12vb76d");
    			add_location(section, file$1, 9, 0, 210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(collapsiblesection, section, null);
    			append_dev(section, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const collapsiblesection_changes = {};
    			if (dirty & /*Repo*/ 1) collapsiblesection_changes.headerText = /*repo*/ ctx[1].name;

    			if (dirty & /*$$scope, Repo*/ 17) {
    				collapsiblesection_changes.$$scope = { dirty, ctx };
    			}

    			collapsiblesection.$set(collapsiblesection_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapsiblesection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapsiblesection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(collapsiblesection);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:0) {#each Repo as repo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*Repo*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Repo*/ 1) {
    				each_value = /*Repo*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ReportList', slots, []);
    	let { Repo = [] } = $$props;
    	const writable_props = ['Repo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ReportList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Repo' in $$props) $$invalidate(0, Repo = $$props.Repo);
    	};

    	$$self.$capture_state = () => ({ Chart, RunList, CollapsibleSection, Repo });

    	$$self.$inject_state = $$props => {
    		if ('Repo' in $$props) $$invalidate(0, Repo = $$props.Repo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Repo];
    }

    class ReportList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { Repo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReportList",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get Repo() {
    		throw new Error("<ReportList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Repo(value) {
    		throw new Error("<ReportList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let main;
    	let div1;
    	let finalreport;
    	let t2;
    	let h1;
    	let t4;
    	let div2;
    	let reportlist;
    	let current;

    	finalreport = new FinalReport({
    			props: { Repo: /*Repo*/ ctx[0] },
    			$$inline: true
    		});

    	reportlist = new ReportList({
    			props: { Repo: /*Repo*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Test Dashboard";
    			t1 = space();
    			main = element("main");
    			div1 = element("div");
    			create_component(finalreport.$$.fragment);
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "Statistics";
    			t4 = space();
    			div2 = element("div");
    			create_component(reportlist.$$.fragment);
    			add_location(h2, file, 20, 2, 629);
    			attr_dev(div0, "class", "nav svelte-wgert1");
    			add_location(div0, file, 19, 0, 609);
    			attr_dev(div1, "class", "cards svelte-wgert1");
    			add_location(div1, file, 23, 2, 687);
    			set_style(h1, "text-align", "center");
    			add_location(h1, file, 26, 2, 745);
    			attr_dev(div2, "class", "cards svelte-wgert1");
    			add_location(div2, file, 27, 2, 795);
    			attr_dev(main, "class", "container");
    			add_location(main, file, 22, 0, 660);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			mount_component(finalreport, div1, null);
    			append_dev(main, t2);
    			append_dev(main, h1);
    			append_dev(main, t4);
    			append_dev(main, div2);
    			mount_component(reportlist, div2, null);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(finalreport.$$.fragment, local);
    			transition_in(reportlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(finalreport.$$.fragment, local);
    			transition_out(reportlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(finalreport);
    			destroy_component(reportlist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let Repo = [
    		{
    			name: "Dashboard",
    			repo: "tfgrid_dashboard",
    			workflow: "Selenium Tests"
    		},
    		{
    			name: "Weblets",
    			repo: "grid_weblets",
    			workflow: "build"
    		},
    		{
    			name: "TSClient",
    			repo: "grid3_client_ts",
    			workflow: "grid3-nightly"
    		},
    		{
    			name: "Terraform",
    			repo: "terraform-provider-grid",
    			workflow: "Run Tests"
    		},
    		{
    			name: "Proxy",
    			repo: "tfgridclient_proxy",
    			workflow: "Integration tests"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ FinalReport, ReportList, Repo });

    	$$self.$inject_state = $$props => {
    		if ('Repo' in $$props) $$invalidate(0, Repo = $$props.Repo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Repo];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
