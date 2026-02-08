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

    function buildDocumentsMap(docs) {
        var map = {};
        if (!docs || !docs.length) return map;
        for (var i = 0; i < docs.length; i++) {
            var d = docs[i];
            if (!d || !d.url) continue;

            var u = String(d.url);
            map[u] = d;

            var path = null;
            try {
                if (u.indexOf('http://') === 0 || u.indexOf('https://') === 0) {
                    path = new URL(u).pathname;
                } else {
                    path = (u.charAt(0) === '/') ? u : ('/' + u);
                }
            } catch (e) {
                path = (u.charAt(0) === '/') ? u : ('/' + u);
            }

            if (path) {
                map[path] = d;
                try {
                    map[(window.location ? window.location.origin : '') + path] = d;
                } catch (e2) { }
            }

            // with/without trailing slash
            function addAlt(key) {
                if (!key) return;
                if (key.slice(-1) === '/') map[key.slice(0, -1)] = d;
                else map[key + '/'] = d;
            }

            addAlt(u);
            addAlt(path);
            try { addAlt((window.location ? window.location.origin : '') + path); } catch (e3) { }
        }
        return map;
    }

    function stripDatePrefix(text) {
        if (!text) return '';
        return String(text).replace(/^\d{4}\/\d{2}\/\d{2}\s*-\s*/g, '');
    }

    function patchDisqusRecommendations(lang) {
        if (lang !== 'en') return;

        // Requires documents_en from search-lunr include.
        if (typeof window.documents_en === 'undefined') return;
        if (!window.documents_en || !window.documents_en.length) return;

        if (!window.__i18n_documents_en_map) {
            window.__i18n_documents_en_map = buildDocumentsMap(window.documents_en);
        }
        var map = window.__i18n_documents_en_map;

        // Header
        var h = document.querySelector('.recommendations-unit-title');
        if (h && h.textContent && h.textContent.indexOf('Также на') !== -1) {
            var forum = h.querySelector('.recommendations-forum');
            var name = forum ? (forum.textContent || '').trim() : '';
            h.innerHTML = 'Also on <strong class="recommendations-forum">' + name + '</strong>';
        }

        var posts = document.querySelectorAll('[data-role="recommended-post"][data-link]');
        for (var i = 0; i < posts.length; i++) {
            var el = posts[i];
            var link = el.getAttribute('data-link');
            if (!link) continue;
            var doc = map[link];
            if (!doc) {
                try {
                    var p = new URL(link).pathname;
                    doc = map[p] || map[(window.location ? window.location.origin : '') + p];
                } catch (e4) { }
            }
            if (!doc) continue;

            var title = (doc.title || '').trim();
            var body = stripDatePrefix((doc.body || '').trim());
            if (!title && !body) continue;

            var tNode = el.querySelector('[data-role="recommend-thread-title"]');
            if (tNode && title) {
                tNode.textContent = title;
                tNode.setAttribute('data-content', title);
            }
            var titleH3 = el.querySelector('.recommend-post-title');
            if (titleH3 && title) titleH3.setAttribute('title', title);
            var img = el.querySelector('img');
            if (img && title) {
                img.setAttribute('alt', title);
                img.setAttribute('title', title);
            }

            var sNode = el.querySelector('[data-role="recommend-description-snippet"]');
            if (sNode && body) {
                var snippet = body;
                if (snippet.length > 260) snippet = snippet.slice(0, 257) + '...';
                sNode.textContent = snippet;
            }
        }
    }

    function observeDisqusRecommendations() {
        if (window.__i18n_disqus_rec_observer) return;
        try {
            var obs = new MutationObserver(function () {
                var lang = normalize(document.documentElement.getAttribute('data-lang')) || 'en';
                patchDisqusRecommendations(lang);
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            window.__i18n_disqus_rec_observer = obs;
        } catch (e) { }
    }

    function buildEnImageUrl(url) {
        if (!url) return null;
        var u = String(url);
        if (u.indexOf('_en.') !== -1) return null;
        var m = u.match(/^(.*)\.(png|jpe?g|gif|webp)(\?.*)?$/i);
        if (!m) return null;
        return m[1] + '_en.' + m[2] + (m[3] || '');
    }

    function applyImageVariants(lang) {
        // IMG src swap
        try {
            var imgs = document.querySelectorAll('img');
            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                if (!img || !img.getAttribute) continue;
                if (!img.hasAttribute('data-i18n-src-ru')) {
                    img.setAttribute('data-i18n-src-ru', img.getAttribute('src') || '');
                }

                var ruSrc = img.getAttribute('data-i18n-src-ru') || (img.getAttribute('src') || '');
                if (lang === 'ru') {
                    if (ruSrc && img.getAttribute('src') !== ruSrc) img.setAttribute('src', ruSrc);
                    continue;
                }

                // EN
                var cached = img.getAttribute('data-i18n-src-en');
                if (cached) {
                    if (img.getAttribute('src') !== cached) img.setAttribute('src', cached);
                    continue;
                }

                var candidate = buildEnImageUrl(ruSrc);
                if (!candidate) continue;

                (function (el, cand) {
                    try {
                        var probe = new Image();
                        probe.onload = function () {
                            el.setAttribute('data-i18n-src-en', cand);
                            if ((normalize(document.documentElement.getAttribute('data-lang')) || 'en') === 'en') {
                                el.setAttribute('src', cand);
                            }
                        };
                        probe.onerror = function () { };
                        probe.src = cand;
                    } catch (e) { }
                })(img, candidate);
            }
        } catch (e1) { }

        // Background-image swap for known blocks
        try {
            var els = document.querySelectorAll('.topfirstimage');
            for (var j = 0; j < els.length; j++) {
                var el2 = els[j];
                if (!el2 || !el2.style) continue;
                var bg = el2.style.backgroundImage || '';
                if (!el2.hasAttribute('data-i18n-bg-ru')) {
                    el2.setAttribute('data-i18n-bg-ru', bg);
                }
                var ruBg = el2.getAttribute('data-i18n-bg-ru') || bg;
                if (lang === 'ru') {
                    if (ruBg !== bg) el2.style.backgroundImage = ruBg;
                    continue;
                }

                var cachedBg = el2.getAttribute('data-i18n-bg-en');
                if (cachedBg) {
                    if (bg !== cachedBg) el2.style.backgroundImage = cachedBg;
                    continue;
                }

                var urlm = ruBg.match(/url\((['"]?)(.*?)\1\)/i);
                if (!urlm || !urlm[2]) continue;
                var candidateBgUrl = buildEnImageUrl(urlm[2]);
                if (!candidateBgUrl) continue;
                var candidateBg = 'url("' + candidateBgUrl + '")';

                (function (node, candUrl, candBg) {
                    try {
                        var probe2 = new Image();
                        probe2.onload = function () {
                            node.setAttribute('data-i18n-bg-en', candBg);
                            if ((normalize(document.documentElement.getAttribute('data-lang')) || 'en') === 'en') {
                                node.style.backgroundImage = candBg;
                            }
                        };
                        probe2.onerror = function () { };
                        probe2.src = candUrl;
                    } catch (e) { }
                })(el2, candidateBgUrl, candidateBg);
            }
        } catch (e2) { }
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

        patchDisqusRecommendations(l);
        observeDisqusRecommendations();

        applyImageVariants(l);

        // Refresh Disqus widgets (recommendations/comments) after manual language change.
        if (persist) {
            try {
                if (typeof window.__disqusReset === 'function') {
                    window.__disqusReset(l);
                }
            } catch (e2) { }
        }
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
