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

        var nav = [];
        try {
            if (Array.isArray(navigator.languages) && navigator.languages.length) nav = nav.concat(navigator.languages);
            if (navigator.language) nav.push(navigator.language);
        } catch (e2) { }

        for (var i = 0; i < nav.length; i++) {
            var n = normalize(nav[i]);
            if (n === 'ru') return 'ru';
            if (n === 'en') return 'en';
        }

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
        var node = document.querySelector('.article-headline [data-lang="' + lang + '"]');
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
