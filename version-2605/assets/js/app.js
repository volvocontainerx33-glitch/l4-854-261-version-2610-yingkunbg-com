document.addEventListener("DOMContentLoaded", function () {
    initMobileNavigation();
    initHeroCarousel();
    initFilters();
    initVideoPlayer();
});

function initMobileNavigation() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");

    if (!button || !menu) {
        return;
    }

    button.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
    });
}

function initHeroCarousel() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
        return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
        current = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === current);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === current);
        });
    }

    function go(step) {
        show(current + step);
        restart();
    }

    function restart() {
        if (timer) {
            window.clearInterval(timer);
        }

        timer = window.setInterval(function () {
            show(current + 1);
        }, 5000);
    }

    if (prev) {
        prev.addEventListener("click", function () {
            go(-1);
        });
    }

    if (next) {
        next.addEventListener("click", function () {
            go(1);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            show(index);
            restart();
        });
    });

    restart();
}

function initFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));

    scopes.forEach(function (scope) {
        var input = scope.querySelector("[data-filter-input]");
        var sort = scope.querySelector("[data-sort-select]");
        var count = scope.querySelector("[data-filter-count]");
        var grid = document.querySelector("[data-card-grid]");
        var viewButtons = Array.prototype.slice.call(scope.querySelectorAll("[data-view-toggle]"));

        if (!grid) {
            return;
        }

        var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));

        if (input && input.hasAttribute("data-url-query")) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");

            if (q) {
                input.value = q;
            }
        }

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function applyFilter() {
            var query = normalize(input ? input.value : "");
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.year,
                    card.dataset.type,
                    card.dataset.tags
                ].join(" "));
                var matched = !query || haystack.indexOf(query) !== -1;
                card.classList.toggle("is-hidden", !matched);

                if (matched) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = String(visible);
            }
        }

        function applySort() {
            if (!sort) {
                return;
            }

            var mode = sort.value;
            var ordered = cards.slice();

            ordered.sort(function (a, b) {
                if (mode === "title") {
                    return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
                }

                if (mode === "year-desc" || mode === "year-asc") {
                    var ay = parseInt(a.dataset.year || "0", 10) || 0;
                    var by = parseInt(b.dataset.year || "0", 10) || 0;
                    return mode === "year-desc" ? by - ay : ay - by;
                }

                return 0;
            });

            ordered.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        if (input) {
            input.addEventListener("input", applyFilter);
        }

        if (sort) {
            sort.addEventListener("change", function () {
                applySort();
                applyFilter();
            });
        }

        viewButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                var view = button.getAttribute("data-view-toggle");
                grid.classList.toggle("is-list", view === "list");
                viewButtons.forEach(function (item) {
                    item.classList.toggle("is-active", item === button);
                });
            });
        });

        applySort();
        applyFilter();
    });
}

function initVideoPlayer() {
    var player = document.querySelector("[data-player]");

    if (!player) {
        return;
    }

    var video = player.querySelector("video");
    var button = player.querySelector("[data-play-button]");

    if (!video || !button) {
        return;
    }

    var started = false;
    var hlsInstance = null;

    function hideOverlay() {
        button.classList.add("is-hidden");
    }

    function showOverlay() {
        if (!started) {
            button.classList.remove("is-hidden");
        }
    }

    function startPlayback() {
        var source = video.getAttribute("data-src");

        if (!source) {
            return;
        }

        if (!started) {
            started = true;

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 60
                });

                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);

                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(function () {
                        button.classList.remove("is-hidden");
                    });
                });

                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        hlsInstance.destroy();
                        hlsInstance = null;
                        video.src = source;
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                video.addEventListener("loadedmetadata", function () {
                    video.play().catch(showOverlay);
                }, { once: true });
            } else {
                video.src = source;
                video.play().catch(showOverlay);
            }
        } else {
            video.play().catch(showOverlay);
        }

        hideOverlay();
    }

    button.addEventListener("click", startPlayback);
    video.addEventListener("play", hideOverlay);
    video.addEventListener("pause", function () {
        if (video.currentTime === 0 || video.ended) {
            showOverlay();
        }
    });
    video.addEventListener("ended", showOverlay);

    window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
