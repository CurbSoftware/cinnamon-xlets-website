// Time and schedule helpers shared by the hero micro-desktop and the ticker.
// The same functions run at build time (baked fallbacks, correct at build,
// no-JS safe) and in src/scripts/main.ts (minute-precision live updates).

export interface City {
  label: string;
  tz: string;
}

/** Vancouver, London, Tokyo in the hero grid; UTC joins in the ticker. */
export const CITIES: City[] = [
  { label: 'VANCOUVER', tz: 'America/Vancouver' },
  { label: 'LONDON', tz: 'Europe/London' },
  { label: 'TOKYO', tz: 'Asia/Tokyo' },
  { label: 'UTC', tz: 'UTC' },
];

/** HH:MM in the given IANA zone; undefined zone means system-local time. */
export function timeIn(tz?: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

export interface ScheduleStop {
  /** minutes after local midnight */
  at: number;
  name: string;
  color: string;
}

/** Color Timer Clock clock-card schedule: time-of-day stops wrapping over
 *  midnight. Stop colors are product data (a color schedule the desklet can
 *  actually hold), not theme colors; this schedule is the one place on the
 *  site where an amber stop exists. */
export const SCHEDULE: ScheduleStop[] = [
  { at: 0, name: 'NIGHT', color: '#31415e' },
  { at: 390, name: 'MORNING', color: '#b4722c' },
  { at: 510, name: 'FOCUS', color: '#2f6b4a' },
  { at: 1050, name: 'EVENING', color: '#8f4a52' },
  { at: 1320, name: 'NIGHT', color: '#31415e' },
];

export interface ScheduleState {
  /** interpolated stop color for now */
  color: string;
  /** near-black or near-white ink keeping contrast on color */
  ink: string;
  /** the stop the ramp is heading toward */
  next: ScheduleStop;
  /** that stop's time of day, HH:MM */
  nextTime: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** WCAG relative luminance of a hex color. */
function luminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function hhmm(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Where the schedule stands right now: ramp color, readable ink, next stop.
 *  Linear sRGB interpolation between the surrounding stops. */
export function scheduleAt(now: Date = new Date()): ScheduleState {
  const t = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let from = SCHEDULE[SCHEDULE.length - 1];
  let to = SCHEDULE[0];
  let span = SCHEDULE[0].at + 1440 - from.at;
  let elapsed = t >= from.at ? t - from.at : t + 1440 - from.at;
  for (let i = 0; i < SCHEDULE.length; i++) {
    const cur = SCHEDULE[i];
    const nxt = SCHEDULE[(i + 1) % SCHEDULE.length];
    const end = nxt.at > cur.at ? nxt.at : nxt.at + 1440;
    if (t >= cur.at && t < end) {
      from = cur;
      to = nxt;
      span = end - cur.at;
      elapsed = t - cur.at;
      break;
    }
  }
  const k = span > 0 ? elapsed / span : 0;
  const [ar, ag, ab] = hexToRgb(from.color);
  const [br, bg, bb] = hexToRgb(to.color);
  const color = `#${[lerp(ar, br, k), lerp(ag, bg, k), lerp(ab, bb, k)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
  return {
    color,
    ink: luminance(color) > 0.179 ? '#101512' : '#f2f7f5',
    next: to,
    nextTime: hhmm(to.at),
  };
}
