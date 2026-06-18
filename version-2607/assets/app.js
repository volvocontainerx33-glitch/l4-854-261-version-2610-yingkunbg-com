(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var mobilePanel = document.querySelector(".mobile-panel");

    if (menuButton && mobilePanel) {
        menuButton.addEventListener("click", function () {
            mobilePanel.classList.toggle("is-open");
        });
    }

    document.querySelectorAll(".site-search").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            var input = form.querySelector("input[name='q']");
            var value = input ? input.value.trim() : "";
            if (!value) {
                event.preventDefault();
                return;
            }
            event.preventDefault();
            var action = form.getAttribute("action") || "./search.html";
            window.location.href = action + "?q=" + encodeURIComponent(value);
        });
    });

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var current = 0;

    function activateHero(index) {
        if (!slides.length) {
            return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, itemIndex) {
            slide.classList.toggle("is-active", itemIndex === current);
        });
        dots.forEach(function (dot, itemIndex) {
            dot.classList.toggle("is-active", itemIndex === current);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            activateHero(index);
        });
    });

    if (slides.length > 1) {
        window.setInterval(function () {
            activateHero(current + 1);
        }, 6200);
    }

    var filterRoot = document.querySelector(".filter-root");
    if (filterRoot) {
        var searchInput = filterRoot.querySelector(".library-search");
        var selects = Array.prototype.slice.call(filterRoot.querySelectorAll(".filter-select"));
        var cards = Array.prototype.slice.call(filterRoot.querySelectorAll(".movie-card"));
        var empty = filterRoot.querySelector(".no-result");
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";

        if (searchInput && query) {
            searchInput.value = query;
        }

        function matchCard(card) {
            var text = [
                card.getAttribute("data-title") || "",
                card.getAttribute("data-region") || "",
                card.getAttribute("data-type") || "",
                card.getAttribute("data-year") || "",
                card.getAttribute("data-tags") || ""
            ].join(" ").toLowerCase();
            var term = searchInput ? searchInput.value.trim().toLowerCase() : "";
            if (term && text.indexOf(term) === -1) {
                return false;
            }
            return selects.every(function (select) {
                var value = select.value;
                var key = select.getAttribute("data-filter");
                if (!value || value === "all") {
                    return true;
                }
                return (card.getAttribute("data-" + key) || "") === value;
            });
        }

        function filterCards() {
            var visible = 0;
            cards.forEach(function (card) {
                var ok = matchCard(card);
                card.style.display = ok ? "" : "none";
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        if (searchInput) {
            searchInput.addEventListener("input", filterCards);
        }
        selects.forEach(function (select) {
            select.addEventListener("change", filterCards);
        });
        filterCards();
    }
})();

function initPlayer(id, src) {
    var box = document.getElementById(id);
    if (!box) {
        return;
    }

    var video = box.querySelector("video");
    var button = box.querySelector(".player-overlay");
    var attached = false;
    var hls = null;

    function attachMedia() {
        if (!video || attached) {
            return Promise.resolve();
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            return Promise.resolve();
        }
        if (window.Hls && window.Hls.isSupported()) {
            hls = new Hls({ enableWorker: true });
            hls.loadSource(src);
            hls.attachMedia(video);
            return new Promise(function (resolve) {
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    resolve();
                });
            });
        }
        video.src = src;
        return Promise.resolve();
    }

    function start() {
        if (!video) {
            return;
        }
        if (button) {
            button.classList.add("is-hidden");
        }
        attachMedia().then(function () {
            var playResult = video.play();
            if (playResult && playResult.catch) {
                playResult.catch(function () {
                    if (button) {
                        button.classList.remove("is-hidden");
                    }
                });
            }
        });
    }

    if (button) {
        button.addEventListener("click", start);
    }
    if (video) {
        video.addEventListener("click", function () {
            if (video.paused) {
                start();
            }
        });
    }
}
