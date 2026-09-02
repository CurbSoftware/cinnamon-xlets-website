// The single client script. Wired from BaseLayout.astro via one <script src>.
// Motion rules: vanilla IntersectionObserver and CSS only, everything visible
// with JS blocked, everything instant under prefers-reduced-motion.
import { timeIn, scheduleAt } from '../components/sections/home/time';

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Reveal on scroll: one observer, threshold 0.12, reveal and forget. */
function initReveal(): void {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('reveal-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/** Nav condenses into a translucent blur surface past 24px of scroll. */
function initHeader(): void {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-condensed', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/** Theme toggle buttons (components/layout/ThemeToggle.astro). */
function initThemeToggle(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  buttons.forEach((button) => {
    const label = button.querySelector('[data-theme-label]');
    const sync = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      if (label) label.textContent = dark ? 'Dark' : 'Light';
    };
    sync();
    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('xlets-theme', next);
      } catch {
        /* private mode: the toggle still works for this page view */
      }
      sync();
    });
  });
}

/** Copy buttons on CopyBlock pre blocks. Progressive enhancement: the
 *  buttons ship hidden and only appear when JS can back them. */
function initCopyButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-copy]');
  buttons.forEach((button) => {
    const target = document.getElementById(button.dataset.copy ?? '');
    const status = button.parentElement?.querySelector('[data-copy-status]');
    if (!target) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      const text = target.textContent ?? '';
      const done = () => {
        if (status) {
          status.textContent = 'Copied.';
          window.setTimeout(() => {
            status.textContent = '';
          }, 2000);
        }
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
    });
  });
}

function fallbackCopy(text: string, done: () => void): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch {
    /* clipboard unavailable: the commands are still selectable text */
  }
  ta.remove();
}

// Home page live time and motion. The same helpers run at build time (see
// components/sections/home/time.ts) so every clock ships with a correct
// no-JS fallback baked into the HTML.

/** Run fn now, then again just after every minute boundary. */
function onMinuteTick(fn: () => void): void {
  fn();
  const schedule = () => {
    const now = new Date();
    const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 20;
    window.setTimeout(() => {
      fn();
      schedule();
    }, ms);
  };
  schedule();
}

/** Set every [data-clock] element under scope to its zone's HH:MM.
 *  data-clock="local" (or absent) means the system zone. */
function updateClocks(scope: ParentNode, now: Date): void {
  scope.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
    const zone = el.dataset.clock;
    el.textContent = timeIn(zone && zone !== 'local' ? zone : undefined, now);
  });
}

/** Ticker: keeps the duplicated marquee groups (and the sr-only line) on
 *  the same live minute-precision times. The loop itself is pure CSS. */
export function initTicker(): void {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  onMinuteTick(() => updateClocks(ticker, new Date()));
}

/** Hero clocks plus the color-schedule card: minute updates, with a 62s CSS
 *  transition so the card background ramps continuously between stops. */
export function initClocks(): void {
  const hero = document.querySelector('.hero');
  const card = document.querySelector<HTMLElement>('[data-color-card]');
  if (!hero && !card) return;
  onMinuteTick(() => {
    const now = new Date();
    if (hero) updateClocks(hero, now);
    if (card) {
      const s = scheduleAt(now);
      card.style.setProperty('--card-bg', s.color);
      card.style.setProperty('--card-ink', s.ink);
      const next = card.querySelector('[data-color-next]');
      if (next) next.textContent = `NEXT ${s.next.name} ${s.nextTime}`;
    }
  });
}

/** Hero pointer parallax. Contract: the composition root carries
 *  data-parallax-root; each depth plane carries data-parallax="N", the
 *  pixel shift at full pointer deflection (1|3|6|10). rAF-throttled,
 *  pointer-position proportional, disabled on touch and reduced motion. */
export function initParallax(): void {
  const root = document.querySelector<HTMLElement>('[data-parallax-root]');
  if (!root) return;
  if (reducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const planes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (!planes.length) return;

  let raf = 0;
  let x = 0;
  let y = 0;
  const apply = () => {
    raf = 0;
    for (const plane of planes) {
      const depth = Number(plane.dataset.parallax) || 0;
      plane.style.transform = `translate3d(${(x * depth).toFixed(2)}px, ${(y * depth).toFixed(2)}px, 0)`;
    }
  };
  const queue = () => {
    if (!raf) raf = window.requestAnimationFrame(apply);
  };

  root.addEventListener('pointermove', (event) => {
    const rect = root.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    queue();
  });
  root.addEventListener('pointerleave', () => {
    x = 0;
    y = 0;
    queue();
  });
}

function init(): void {
  initReveal();
  initHeader();
  initThemeToggle();
  initCopyButtons();
  initTicker();
  initClocks();
  initParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
