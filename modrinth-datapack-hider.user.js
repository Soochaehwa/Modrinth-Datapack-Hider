// ==UserScript==
// @name        Modrinth Datapack Hider
// @namespace   Violentmonkey Scripts
// @match       https://modrinth.com/*
// @version     1.0
// @author      Soochaehwa
// @license     MIT
// @description Hide datapacks on mods and plugins
// @run-at      document-start
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

(() => {
    'use strict';
    const ROUTE_REGEX = /^(?:\/(?:mods|plugins)|\/(?:mod|plugin)\/[^\/]+(?:\/|$))/;

    const ENABLE_KEY = 'datapack_hider_enabled';
    let enabled = typeof GM_getValue === 'function' ? GM_getValue(ENABLE_KEY, true) : true;

    let styleEl = null;
    const styleText = `
      :root[data-hide-datapack] article:has(a[href^="/datapack/"]) {
        display: none !important;
      }
    `;

    function onRoute() {
        const onTargetRoute = ROUTE_REGEX.test(location.pathname);
        if (onTargetRoute && enabled) {
            document.documentElement.setAttribute('data-hide-datapack', 'true');
            ensureStyle();
        } else {
            document.documentElement.removeAttribute('data-hide-datapack');
            removeStyle();
        }
    }

    function ensureStyle() {
        if (styleEl || !enabled) return;
        styleEl = document.createElement('style');
        styleEl.textContent = styleText;
        (document.head || document.documentElement).appendChild(styleEl);
    }

    function removeStyle() {
        if (styleEl) {
            styleEl.remove();
            styleEl = null;
        }
    }

    function fireRouteChange() {
        window.dispatchEvent(new Event('locationchange'));
    }
    ['pushState', 'replaceState'].forEach(k => {
        const orig = history[k];
        history[k] = function () {
            const ret = orig.apply(this, arguments);
            fireRouteChange();
            return ret;
        };
    });
    window.addEventListener('popstate', fireRouteChange);
    window.addEventListener('locationchange', onRoute);

    onRoute();

    let menuId = null;
    function registerMenu() {
        const label = `Datapack hider: ${enabled ? 'ON' : 'OFF'}`;
        menuId = GM_registerMenuCommand(label, () => {
            enabled = !enabled;
            if (typeof GM_setValue === 'function') GM_setValue(ENABLE_KEY, enabled);
            if (typeof GM_unregisterMenuCommand === 'function' && menuId != null) {
                GM_unregisterMenuCommand(menuId);
            }
            registerMenu();
            onRoute();
        });
    }
    registerMenu();
})();
