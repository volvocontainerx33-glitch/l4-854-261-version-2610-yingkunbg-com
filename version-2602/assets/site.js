(() => {
    const nav = document.querySelector('[data-main-nav]');
    const menuButton = document.querySelector('[data-menu-toggle]');

    if (menuButton && nav) {
        menuButton.addEventListener('click', () => {
            nav.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-back-top]').forEach((button) => {
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const carousel = document.querySelector('[data-hero-carousel]');
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
        const prev = carousel.querySelector('[data-hero-prev]');
        const next = carousel.querySelector('[data-hero-next]');
        let index = 0;
        let timer = null;

        const show = (nextIndex) => {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        };

        const start = () => {
            stop();
            timer = window.setInterval(() => show(index + 1), 5000);
        };

        const stop = () => {
            if (timer) {
                window.clearInterval(timer);
            }
        };

        prev?.addEventListener('click', () => {
            show(index - 1);
            start();
        });

        next?.addEventListener('click', () => {
            show(index + 1);
            start();
        });

        dots.forEach((dot, dotIndex) => {
            dot.addEventListener('click', () => {
                show(dotIndex);
                start();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    const panels = document.querySelectorAll('[data-filter-panel]');
    panels.forEach((panel) => {
        const scope = panel.closest('main') || document;
        const cards = Array.from(scope.querySelectorAll('.movie-card'));
        const searchInput = panel.querySelector('[data-filter-search]');
        const categorySelect = panel.querySelector('[data-filter-category]');
        const yearSelect = panel.querySelector('[data-filter-year]');
        const typeSelect = panel.querySelector('[data-filter-type]');
        const resetButton = panel.querySelector('[data-filter-reset]');
        const count = panel.querySelector('[data-filter-count]');

        const matchesYear = (cardYear, selectedYear) => {
            if (!selectedYear) {
                return true;
            }
            if (selectedYear === '2020') {
                const yearNumber = Number(cardYear);
                return Number.isFinite(yearNumber) && yearNumber <= 2020;
            }
            return cardYear === selectedYear;
        };

        const apply = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            const category = categorySelect?.value || '';
            const year = yearSelect?.value || '';
            const type = typeSelect?.value || '';
            let visible = 0;

            cards.forEach((card) => {
                const haystack = [
                    card.dataset.title,
                    card.dataset.tags,
                    card.dataset.region,
                    card.dataset.year,
                    card.dataset.type,
                    card.textContent,
                ].join(' ').toLowerCase();
                const okQuery = !query || haystack.includes(query);
                const okCategory = !category || card.dataset.category === category;
                const okYear = matchesYear(card.dataset.year || '', year);
                const okType = !type || (card.dataset.type || '').includes(type);
                const isVisible = okQuery && okCategory && okYear && okType;

                card.classList.toggle('is-hidden', !isVisible);
                if (isVisible) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = `显示 ${visible} / ${cards.length} 部`;
            }
        };

        [searchInput, categorySelect, yearSelect, typeSelect].forEach((control) => {
            control?.addEventListener('input', apply);
            control?.addEventListener('change', apply);
        });

        resetButton?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.value = '';
            if (yearSelect) yearSelect.value = '';
            if (typeSelect) typeSelect.value = '';
            apply();
        });

        apply();
    });

    const hlsScriptUrl = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
    let hlsLoadingPromise = null;

    const loadHls = () => {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }
        if (!hlsLoadingPromise) {
            hlsLoadingPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = hlsScriptUrl;
                script.async = true;
                script.onload = () => resolve(window.Hls);
                script.onerror = () => reject(new Error('Hls.js 加载失败'));
                document.head.appendChild(script);
            });
        }
        return hlsLoadingPromise;
    };

    const initPlayer = async (video, source, status) => {
        if (!source) {
            if (status) status.textContent = '当前影片未配置播放源。';
            return;
        }

        try {
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                await video.play();
                if (status) status.textContent = '正在使用浏览器原生 HLS 播放。';
                return;
            }

            const Hls = await loadHls();
            if (Hls && Hls.isSupported()) {
                if (video._siteHls) {
                    video._siteHls.destroy();
                }
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                video._siteHls = hls;
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => undefined);
                    if (status) status.textContent = 'HLS 初始化完成，正在播放。';
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (status && data?.fatal) {
                        status.textContent = '播放源加载异常，请稍后重试。';
                    }
                });
                return;
            }

            video.src = source;
            await video.play();
            if (status) status.textContent = '已尝试直接加载播放源。';
        } catch (error) {
            if (status) {
                status.textContent = error?.message || '播放器初始化失败。';
            }
        }
    };

    document.querySelectorAll('[data-player-shell]').forEach((shell) => {
        const video = shell.querySelector('video[data-m3u8]');
        const button = shell.querySelector('[data-play-m3u8]');
        const status = shell.querySelector('[data-player-status]');
        const source = video?.dataset.m3u8 || '';

        const play = () => {
            button?.classList.add('is-hidden');
            if (status) status.textContent = '正在初始化播放源...';
            if (video) {
                initPlayer(video, source, status);
            }
        };

        button?.addEventListener('click', play);
        video?.addEventListener('play', () => button?.classList.add('is-hidden'));
    });
})();
