(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var active = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(active - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(active + 1);
        play();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        play();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', play);
    play();
  }

  var filterBar = document.querySelector('[data-filter-bar]');
  var cardList = document.querySelector('[data-card-list]');

  if (filterBar && cardList) {
    var input = filterBar.querySelector('[data-filter-input]');
    var region = filterBar.querySelector('[data-filter-region]');
    var type = filterBar.querySelector('[data-filter-type]');
    var year = filterBar.querySelector('[data-filter-year]');
    var empty = document.querySelector('[data-empty-state]');
    var cards = Array.prototype.slice.call(cardList.querySelectorAll('[data-search-card]'));

    function getParam(name) {
      return new URLSearchParams(window.location.search).get(name) || '';
    }

    function lower(value) {
      return String(value || '').trim().toLowerCase();
    }

    function match(card, query, wantedRegion, wantedType, wantedYear) {
      var content = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags'),
        card.textContent
      ].join(' ').toLowerCase();
      var cardRegion = card.getAttribute('data-region') || '';
      var cardType = card.getAttribute('data-type') || '';
      var cardYear = card.getAttribute('data-year') || '';
      return (!query || content.indexOf(query) > -1) &&
        (!wantedRegion || cardRegion === wantedRegion) &&
        (!wantedType || cardType === wantedType) &&
        (!wantedYear || cardYear === wantedYear);
    }

    function apply() {
      var query = lower(input ? input.value : '');
      var wantedRegion = region ? region.value : '';
      var wantedType = type ? type.value : '';
      var wantedYear = year ? year.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var ok = match(card, query, wantedRegion, wantedType, wantedYear);
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    var initialQuery = getParam('q');
    if (initialQuery && input) {
      input.value = initialQuery;
    }

    [input, region, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }
})();

window.initMoviePlayer = function (streamUrl) {
  var player = document.querySelector('[data-player]');
  if (!player) {
    return;
  }

  var video = player.querySelector('video');
  var cover = player.querySelector('.player-cover');
  var button = player.querySelector('.player-start');
  var errorBox = player.querySelector('.player-error');
  var started = false;
  var hls = null;

  function fail() {
    if (errorBox) {
      errorBox.hidden = false;
    }
  }

  function reveal() {
    if (cover) {
      cover.classList.add('is-hidden');
    }
    if (errorBox) {
      errorBox.hidden = true;
    }
    video.setAttribute('controls', 'controls');
  }

  function attach() {
    if (started) {
      return;
    }
    started = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      reveal();
      var directPlay = video.play();
      if (directPlay && directPlay.catch) {
        directPlay.catch(function () {});
      }
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        reveal();
        var hlsPlay = video.play();
        if (hlsPlay && hlsPlay.catch) {
          hlsPlay.catch(function () {});
        }
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
          fail();
        }
      });
      return;
    }

    fail();
  }

  if (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      attach();
    });
  }

  if (cover) {
    cover.addEventListener('click', attach);
  }

  if (video) {
    video.addEventListener('click', function () {
      if (!started) {
        attach();
      }
    });
  }

  window.addEventListener('pagehide', function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
};
