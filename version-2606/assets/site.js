(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  ready(function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("is-open");
      });
    }

    document.querySelectorAll(".site-search-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (input && normalize(input.value) === "") {
          event.preventDefault();
          input.focus();
        }
      });
    });

    initHero();
    initFilters();
    initPlayer();
  });

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function initFilters() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-page-search]"));
    var selects = Array.prototype.slice.call(document.querySelectorAll("[data-filter-name]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));

    function apply() {
      var text = normalize(searchInputs.length ? searchInputs[0].value : query);
      var activeFilters = {};

      selects.forEach(function (select) {
        activeFilters[select.getAttribute("data-filter-name")] = normalize(select.value);
      });

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var visible = !text || haystack.indexOf(text) !== -1;

        Object.keys(activeFilters).forEach(function (name) {
          var filterValue = activeFilters[name];
          if (filterValue && normalize(card.getAttribute("data-" + name)) !== filterValue) {
            visible = false;
          }
        });

        card.classList.toggle("is-hidden", !visible);
      });
    }

    searchInputs.forEach(function (input) {
      if (query && !input.value) {
        input.value = query;
      }
      input.addEventListener("input", apply);
    });

    selects.forEach(function (select) {
      select.addEventListener("change", apply);
    });

    if (cards.length) {
      apply();
    }
  }

  function initPlayer() {
    document.querySelectorAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play]");
      var streamUrl = player.getAttribute("data-stream");
      var attached = false;
      var hls = null;

      if (!video || !streamUrl) {
        return;
      }

      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      function attach() {
        if (attached) {
          playVideo();
          return;
        }

        attached = true;
        player.classList.add("is-playing");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          video.addEventListener("loadedmetadata", playVideo, { once: true });
          playVideo();
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
          return;
        }

        video.src = streamUrl;
        video.addEventListener("loadedmetadata", playVideo, { once: true });
        playVideo();
      }

      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          attach();
        });
      }

      video.addEventListener("click", function () {
        if (!attached) {
          attach();
        }
      });

      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
          hls = null;
        }
      });
    });
  }
})();
