(() => {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-site-nav]');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      navigation.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let index = 0;

    const showSlide = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-current', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-current', dotIndex === index);
      });
    };

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => showSlide(dotIndex));
    });

    if (slides.length > 1) {
      window.setInterval(() => showSlide(index + 1), 5000);
    }
  }

  const searchInputs = Array.from(document.querySelectorAll('[data-search-input]'));

  searchInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const value = input.value.trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll('[data-search-card]'));

      cards.forEach((card) => {
        const text = `${card.dataset.title || ''} ${card.dataset.tags || ''} ${card.textContent || ''}`.toLowerCase();
        card.classList.toggle('is-hidden', value.length > 0 && !text.includes(value));
      });
    });
  });

  const players = Array.from(document.querySelectorAll('[data-player]'));

  players.forEach((player) => {
    const video = player.querySelector('video');
    const button = player.querySelector('[data-play]');
    const message = player.querySelector('[data-player-message]');
    const stream = video ? video.getAttribute('data-stream') : '';
    let attached = false;
    let hls = null;

    const showMessage = (text) => {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.classList.add('is-visible');
    };

    const attachStream = () => {
      if (!video || !stream || attached) {
        return;
      }

      attached = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_event, data) => {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            showMessage('播放暂时不可用，请稍后再试');
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else {
        showMessage('播放暂时不可用，请更换浏览器再试');
      }
    };

    const playOrPause = () => {
      if (!video) {
        return;
      }

      attachStream();

      if (video.paused) {
        const request = video.play();
        if (request && typeof request.catch === 'function') {
          request.catch(() => showMessage('播放暂时不可用，请稍后再试'));
        }
      } else {
        video.pause();
      }
    };

    attachStream();

    if (button) {
      button.addEventListener('click', playOrPause);
    }

    if (video) {
      video.addEventListener('play', () => player.classList.add('is-playing'));
      video.addEventListener('pause', () => player.classList.remove('is-playing'));
      video.addEventListener('ended', () => player.classList.remove('is-playing'));
    }

    window.addEventListener('beforeunload', () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
})();
