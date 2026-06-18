(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('.menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        mobileNav.classList.toggle('open');
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var index = 0;
    function showSlide(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }
    var prev = document.querySelector('.hero-prev');
    var next = document.querySelector('.hero-next');
    if (prev) prev.addEventListener('click', function () { showSlide(index - 1); });
    if (next) next.addEventListener('click', function () { showSlide(index + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { showSlide(i); });
    });
    if (slides.length > 1) {
      setInterval(function () { showSlide(index + 1); }, 5000);
    }

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }
    function applyFilters(scope) {
      var search = normalize((scope.querySelector('.filter-search') || {}).value);
      var selectors = Array.prototype.slice.call(scope.querySelectorAll('.filter-select'));
      var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
      cards.forEach(function (card) {
        var haystack = normalize([
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.year,
          card.dataset.genre,
          card.dataset.tags,
          card.textContent
        ].join(' '));
        var passSearch = !search || haystack.indexOf(search) !== -1;
        var passSelect = selectors.every(function (select) {
          var key = select.dataset.filter;
          var value = normalize(select.value);
          return !value || normalize(card.dataset[key]) === value;
        });
        card.style.display = passSearch && passSelect ? '' : 'none';
      });
    }
    Array.prototype.slice.call(document.querySelectorAll('.page-main, .main-stack')).forEach(function (scope) {
      var controls = scope.querySelectorAll('.filter-search, .filter-select');
      Array.prototype.slice.call(controls).forEach(function (control) {
        control.addEventListener('input', function () { applyFilters(scope); });
        control.addEventListener('change', function () { applyFilters(scope); });
      });
    });

    Array.prototype.slice.call(document.querySelectorAll('.player-box')).forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('.play-overlay');
      var stream = box.getAttribute('data-stream');
      var hlsInstance = null;
      function startVideo() {
        if (!video || !stream) return;
        box.classList.add('playing');
        if (!box.dataset.loaded) {
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(stream);
            hlsInstance.attachMedia(video);
          } else {
            video.src = stream;
          }
          box.dataset.loaded = 'true';
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            box.classList.remove('playing');
          });
        }
      }
      if (button) button.addEventListener('click', startVideo);
      if (video) {
        video.addEventListener('click', function () {
          if (!box.dataset.loaded || video.paused) startVideo();
        });
        video.addEventListener('pause', function () {
          if (!video.ended) box.classList.remove('playing');
        });
        video.addEventListener('play', function () {
          box.classList.add('playing');
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) hlsInstance.destroy();
      });
    });
  });
})();
