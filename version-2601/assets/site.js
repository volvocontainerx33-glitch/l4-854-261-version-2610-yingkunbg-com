(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var menuButton = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (menuButton && nav) {
      menuButton.addEventListener("click", function () {
        nav.classList.toggle("is-open");
      });
    }

    var topButton = document.querySelector("[data-scroll-top]");
    if (topButton) {
      topButton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    setupHero();
    setupSearch();
  });

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle("is-active", current === active);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle("is-active", current === active);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(active - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(active + 1);
        restart();
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

  function setupSearch() {
    var form = document.querySelector("[data-search-form]");
    var results = document.querySelector("[data-search-results]");
    if (!form || !results || !window.SITE_MOVIES) {
      return;
    }

    function movieCard(movie) {
      var tags = movie.tags.slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");

      return [
        "<article class=\"movie-card\">",
        "<a href=\"" + escapeHtml(movie.url) + "\">",
        "<figure>",
        "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
        "<span class=\"play-hover\">▶</span>",
        "</figure>",
        "<div class=\"card-body\">",
        "<div class=\"tag-row\">" + tags + "</div>",
        "<h3>" + escapeHtml(movie.title) + "</h3>",
        "<p>" + escapeHtml(movie.oneLine) + "</p>",
        "<div class=\"meta-row\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
        "</div>",
        "</a>",
        "</article>"
      ].join("");
    }

    function runSearch() {
      var formData = new FormData(form);
      var keyword = String(formData.get("keyword") || "").trim().toLowerCase();
      var region = String(formData.get("region") || "");
      var year = String(formData.get("year") || "");
      var type = String(formData.get("type") || "");

      if (!keyword && !region && !year && !type) {
        results.innerHTML = "";
        return;
      }

      var matched = window.SITE_MOVIES.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.oneLine].concat(movie.tags).join(" ").toLowerCase();
        return (!keyword || haystack.indexOf(keyword) !== -1)
          && (!region || movie.region === region)
          && (!year || movie.year === year)
          && (!type || movie.type === type);
      }).slice(0, 24);

      if (!matched.length) {
        results.innerHTML = "<div class=\"search-empty\">暂无匹配影片</div>";
        return;
      }

      results.innerHTML = matched.map(movieCard).join("");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runSearch();
    });

    form.addEventListener("input", runSearch);
    form.addEventListener("change", runSearch);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.initPlayer = function (videoId, mediaUrl) {
    var video = document.getElementById(videoId);
    var button = document.querySelector("[data-play-button='" + videoId + "']");
    var attached = false;
    var hls = null;

    if (!video) {
      return;
    }

    function attachMedia() {
      if (attached) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = mediaUrl;
        attached = true;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(mediaUrl);
        hls.attachMedia(video);
        attached = true;
        return;
      }

      video.src = mediaUrl;
      attached = true;
    }

    function playMedia() {
      attachMedia();
      if (button) {
        button.classList.add("is-hidden");
      }
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", playMedia);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        playMedia();
      }
    });

    video.addEventListener("play", function () {
      if (button) {
        button.classList.add("is-hidden");
      }
    });

    video.addEventListener("error", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  };
})();
