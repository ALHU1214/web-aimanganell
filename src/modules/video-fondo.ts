import { $ } from './utils';

interface VideoOpts {
  fade?: boolean;
}

function setupVideo(video: HTMLVideoElement | null, src?: string, opts?: VideoOpts): void {
  if (!video || !src) {
    if (video) video.style.display = 'none';
    return;
  }
  opts = opts || {};
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.loop = true;

  const small = window.matchMedia('(max-width:760px)').matches;
  if (small) {
    video.style.display = 'none';
    return;
  }

  video.preload = 'auto';
  video.src = src;

  if (opts.fade) {
    video.style.transition = 'opacity .35s linear';
    video.addEventListener('timeupdate', () => {
      if (!video.duration || isNaN(video.duration)) return;
      const edge = Math.min(video.currentTime, video.duration - video.currentTime);
      video.style.opacity = edge < 0.5 ? String(0.6 + 0.4 * (edge / 0.5)) : '1';
    });
  }
  video.addEventListener('pause', () => {
    video.play().catch(() => {});
  });

  video.play().catch(() => {
    const arrancar = (): void => {
      video.play().catch(() => {});
      ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => {
        window.removeEventListener(ev, arrancar);
      });
    };
    ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => {
      window.addEventListener(ev, arrancar, { once: false, passive: true });
    });
  });
}

/* ---------- 2 · vídeo de fondo del hero (solo la home) ---------- */
export function initVideosFondo(config: AMConfig): void {
  setupVideo($('#hero-video') as HTMLVideoElement | null, config.heroVideo, { fade: true });
}
