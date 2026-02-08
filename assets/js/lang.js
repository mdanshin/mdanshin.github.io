// Site language switcher (RU/EN)
(function () {
    'use strict';

    var STORAGE_KEY = 'site_lang';

    function normalize(lang) {
        if (!lang) return null;
        var s = String(lang).toLowerCase();
        if (s.indexOf('ru') === 0) return 'ru';
        if (s.indexOf('en') === 0) return 'en';
        if (s === 'ru' || s === 'en') return s;
        return null;
    }

    function detectDefault() {
        try {
            var stored = normalize(localStorage.getItem(STORAGE_KEY));
            if (stored) return stored;
        } catch (e) { }

        // Use the user's default/preferred language (first in the list).
        try {
            var primary = null;
            if (Array.isArray(navigator.languages) && navigator.languages.length) primary = navigator.languages[0];
            if (!primary && navigator.language) primary = navigator.language;
            return normalize(primary) || 'en';
        } catch (e2) { }

        return 'en';
    }

    function updateSwitchers(lang) {
        var btns = document.querySelectorAll('[data-set-lang]');
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            var bLang = normalize(b.getAttribute('data-set-lang'));
            var active = bLang === lang;
            if (b.classList) b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
    }

    function updateDocumentTitle(lang) {
        var selectors = [
            '.article-headline [data-lang="' + lang + '"]',
            '[data-page-title] [data-lang="' + lang + '"]'
        ];

        var node = null;
        for (var i = 0; i < selectors.length; i++) {
            node = document.querySelector(selectors[i]);
            if (node) break;
        }

        if (!node) return;
        var text = (node.textContent || '').trim();
        if (!text) return;

        var parts = document.title.split(' | ');
        if (parts.length > 1) {
            document.title = text + ' | ' + parts.slice(1).join(' | ');
        } else {
            document.title = text;
        }
    }

    function applyI18nAttributes(lang) {
        // Placeholder
        var nodes = document.querySelectorAll('[data-i18n-placeholder-ru][data-i18n-placeholder-en]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var val = (lang === 'ru') ? el.getAttribute('data-i18n-placeholder-ru') : el.getAttribute('data-i18n-placeholder-en');
            if (val != null) el.setAttribute('placeholder', val);
        }

        // Value (for input/button)
        nodes = document.querySelectorAll('[data-i18n-value-ru][data-i18n-value-en]');
        for (var j = 0; j < nodes.length; j++) {
            var el2 = nodes[j];
            var val2 = (lang === 'ru') ? el2.getAttribute('data-i18n-value-ru') : el2.getAttribute('data-i18n-value-en');
            if (val2 == null) continue;
            if (typeof el2.value !== 'undefined') {
                el2.value = val2;
            } else {
                el2.setAttribute('value', val2);
            }
        }

        // Title
        nodes = document.querySelectorAll('[data-i18n-title-ru][data-i18n-title-en]');
        for (var k = 0; k < nodes.length; k++) {
            var el3 = nodes[k];
            var val3 = (lang === 'ru') ? el3.getAttribute('data-i18n-title-ru') : el3.getAttribute('data-i18n-title-en');
            if (val3 != null) el3.setAttribute('title', val3);
        }

        // Aria-label
        nodes = document.querySelectorAll('[data-i18n-aria-label-ru][data-i18n-aria-label-en]');
        for (var m = 0; m < nodes.length; m++) {
            var el4 = nodes[m];
            var val4 = (lang === 'ru') ? el4.getAttribute('data-i18n-aria-label-ru') : el4.getAttribute('data-i18n-aria-label-en');
            if (val4 != null) el4.setAttribute('aria-label', val4);
        }
    }

    function setLang(lang, persist) {
        var l = normalize(lang) || 'en';
        var el = document.documentElement;
        el.setAttribute('data-lang', l);
        el.setAttribute('lang', l);

        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, l); } catch (e) { }
        }

        updateSwitchers(l);
        updateDocumentTitle(l);
        applyI18nAttributes(l);
    }

    function bind() {
        document.addEventListener('click', function (e) {
            var t = e.target;
            if (!t) return;
            var btn = (t.closest && t.closest('[data-set-lang]')) ? t.closest('[data-set-lang]') : null;
            if (!btn) return;
            e.preventDefault();
            setLang(btn.getAttribute('data-set-lang'), true);
        });
    }

    function init() {
        var initial = normalize(document.documentElement.getAttribute('data-lang')) || detectDefault();
        setLang(initial, false);
        bind();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
