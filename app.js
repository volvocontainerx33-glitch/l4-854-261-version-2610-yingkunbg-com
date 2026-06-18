(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
      document.body.classList.toggle('is-menu-open', mobileNav.classList.contains('is-open'));
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-slide-dot]'));
  var current = 0;
  var timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    current = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  }

  function startSlider() {
    if (slides.length < 2) {
      return;
    }

    window.clearInterval(timer);
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
      startSlider();
    });
  });

  showSlide(0);
  startSlider();

  var filterForms = Array.prototype.slice.call(document.querySelectorAll('[data-filter-form]'));

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function applyFilters(form) {
    var scopeSelector = form.getAttribute('data-filter-form');
    var scope = document.querySelector(scopeSelector) || document;
    var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
    var keyword = normalize(form.querySelector('[name="q"]') && form.querySelector('[name="q"]').value);
    var region = normalize(form.querySelector('[name="region"]') && form.querySelector('[name="region"]').value);
    var year = normalize(form.querySelector('[name="year"]') && form.querySelector('[name="year"]').value);
    var genre = normalize(form.querySelector('[name="genre"]') && form.querySelector('[name="genre"]').value);
    var shown = 0;

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardRegion = normalize(card.getAttribute('data-region'));
      var cardYear = normalize(card.getAttribute('data-year'));
      var cardGenre = normalize(card.getAttribute('data-genre'));
      var matched = true;

      if (keyword && text.indexOf(keyword) === -1) {
        matched = false;
      }

      if (region && cardRegion !== region) {
        matched = false;
      }

      if (year && cardYear !== year) {
        matched = false;
      }

      if (genre && cardGenre !== genre) {
        matched = false;
      }

      card.hidden = !matched;

      if (matched) {
        shown += 1;
      }
    });

    var empty = scope.querySelector('[data-empty-state]');
    if (empty) {
      empty.classList.toggle('is-visible', shown === 0);
    }
  }

  filterForms.forEach(function (form) {
    var params = new URLSearchParams(window.location.search);
    var queryInput = form.querySelector('[name="q"]');

    if (queryInput && params.get('q')) {
      queryInput.value = params.get('q');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      applyFilters(form);
    });

    Array.prototype.slice.call(form.elements).forEach(function (element) {
      element.addEventListener('input', function () {
        applyFilters(form);
      });

      element.addEventListener('change', function () {
        applyFilters(form);
      });
    });

    applyFilters(form);
  });
})();
