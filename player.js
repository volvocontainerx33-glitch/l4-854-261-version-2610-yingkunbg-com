function setupMoviePlayer(source) {
  var shell = document.querySelector('.player-shell');

  if (!shell) {
    return;
  }

  var video = shell.querySelector('video');
  var buttons = Array.prototype.slice.call(shell.querySelectorAll('[data-player-start]'));
  var loaded = false;
  var hls = null;

  function playVideo() {
    shell.classList.add('is-playing');

    if (!loaded) {
      loaded = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    var result = video.play();

    if (result && typeof result.catch === 'function') {
      result.catch(function () {});
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', playVideo);
  });

  video.addEventListener('click', function () {
    if (!loaded || video.paused) {
      playVideo();
    }
  });

  window.addEventListener('pagehide', function () {
    if (hls && typeof hls.destroy === 'function') {
      hls.destroy();
    }
  });
}
