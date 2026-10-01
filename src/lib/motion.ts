// Spring-driven card motion. Writes CSS custom properties straight onto the
// element so pointer movement never triggers a React render.

type Key = 'rx' | 'ry' | 'gx' | 'gy' | 'go' | 'bx' | 'by';
type Values = Record<Key, number>;

const KEYS: Key[] = ['rx', 'ry', 'gx', 'gy', 'go', 'bx', 'by'];
const REST: Values = { rx: 0, ry: 0, gx: 50, gy: 50, go: 0, bx: 50, by: 50 };

const INTERACT = { stiffness: 0.066, damping: 0.25 };
const SNAP_BACK = { stiffness: 0.01, damping: 0.06 };

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const adjust = (v: number, fromMin: number, fromMax: number, toMin: number, toMax: number) =>
  toMin + ((toMax - toMin) * (v - fromMin)) / (fromMax - fromMin);

export class CardMotion {
  private cur: Values = { ...REST };
  private vel: Values = { rx: 0, ry: 0, gx: 0, gy: 0, go: 0, bx: 0, by: 0 };
  private target: Values = { ...REST };
  private params = INTERACT;
  private raf = 0;
  private last = 0;

  constructor(private el: HTMLElement) {
    this.apply();
  }

  /** Point at a location on the card, in percent (0–100) of its width/height. */
  pointAt(px: number, py: number) {
    px = clamp(px);
    py = clamp(py);
    const cx = px - 50;
    const cy = py - 50;
    this.params = INTERACT;
    this.target = {
      rx: -(cx / 3.5),
      ry: cy / 2.5,
      gx: px,
      gy: py,
      go: 1,
      bx: adjust(px, 0, 100, 37, 63),
      by: adjust(py, 0, 100, 33, 67),
    };
    this.start();
  }

  reset() {
    this.params = SNAP_BACK;
    this.target = { ...REST };
    this.start();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min((now - this.last) / 16.667, 4);
    this.last = now;
    const { stiffness, damping } = this.params;
    let moving = false;

    for (const k of KEYS) {
      const delta = this.target[k] - this.cur[k];
      this.vel[k] += (delta * stiffness - this.vel[k] * damping) * dt;
      this.cur[k] += this.vel[k] * dt;
      if (Math.abs(delta) > 0.01 || Math.abs(this.vel[k]) > 0.01) {
        moving = true;
      } else {
        this.cur[k] = this.target[k];
        this.vel[k] = 0;
      }
    }

    this.apply();
    this.raf = moving ? requestAnimationFrame(this.tick) : 0;
  };

  private apply() {
    const { rx, ry, gx, gy, go, bx, by } = this.cur;
    const fromCenter = clamp(Math.hypot(gy - 50, gx - 50) / 50, 0, 1);
    const s = this.el.style;
    s.setProperty('--pointer-x', `${gx}%`);
    s.setProperty('--pointer-y', `${gy}%`);
    s.setProperty('--pointer-from-center', `${fromCenter}`);
    s.setProperty('--pointer-from-left', `${gx / 100}`);
    s.setProperty('--pointer-from-top', `${gy / 100}`);
    s.setProperty('--card-opacity', `${clamp(go, 0, 1)}`);
    s.setProperty('--rotate-x', `${rx}deg`);
    s.setProperty('--rotate-y', `${ry}deg`);
    s.setProperty('--background-x', `${bx}%`);
    s.setProperty('--background-y', `${by}%`);
  }
}
