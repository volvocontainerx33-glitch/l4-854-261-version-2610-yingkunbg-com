(function () {
    var qs = function (s, root) { return (root || document).querySelector(s); };
    var qsa = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = qs('[data-menu-toggle]');
        var panel = qs('[data-mobile-panel]');
        if (toggle && panel) {
            toggle.addEventListener('click', function () {
                panel.classList.toggle('open');
            });
        }

        var slides = qsa('[data-hero-slide]');
        var dots = qsa('[data-hero-dot]');
        if (slides.length) {
            var current = 0;
            var show = function (index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, i) { slide.classList.toggle('active', i === current); });
                dots.forEach(function (dot, i) { dot.classList.toggle('active', i === current); });
            };
            dots.forEach(function (dot, i) { dot.addEventListener('click', function () { show(i); }); });
            window.setInterval(function () { show(current + 1); }, 5200);
        }

        qsa('[data-filter-input]').forEach(function (input) {
            var target = qs(input.getAttribute('data-filter-target')) || document;
            var queryName = input.getAttribute('data-read-query');
            if (queryName) {
                var value = new URLSearchParams(window.location.search).get(queryName);
                if (value) input.value = value;
            }
            var apply = function () {
                var term = input.value.trim().toLowerCase();
                qsa('[data-card]', target).forEach(function (card) {
                    var hay = (card.getAttribute('data-search') || '').toLowerCase();
                    card.classList.toggle('is-hidden', term && hay.indexOf(term) === -1);
                });
            };
            input.addEventListener('input', apply);
            apply();
        });

        qsa('.player-shell').forEach(function (shell) {
            var video = qs('video', shell);
            var cover = qs('.player-cover', shell);
            var src = shell.getAttribute('data-stream');
            var ready = false;
            var attach = function (done) {
                if (!video || !src) return;
                if (ready) {
                    if (done) done();
                    return;
                }
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    ready = true;
                    if (done) done();
                    return;
                }
                var useHls = function () {
                    if (window.Hls && window.Hls.isSupported()) {
                        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                        hls.loadSource(src);
                        hls.attachMedia(video);
                        ready = true;
                        if (done) done();
                    } else {
                        video.src = src;
                        ready = true;
                        if (done) done();
                    }
                };
                if (window.Hls) {
                    useHls();
                } else {
                    var script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
                    script.onload = useHls;
                    script.onerror = useHls;
                    document.head.appendChild(script);
                }
            };
            var start = function () {
                attach(function () {
                    if (cover) cover.classList.add('hidden');
                    var play = video.play();
                    if (play && play.catch) play.catch(function () {});
                });
            };
            if (cover) cover.addEventListener('click', start);
            if (video) video.addEventListener('click', function () {
                if (video.paused) start();
            });
        });
    });
})();
