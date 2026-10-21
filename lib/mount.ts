import { mount, unmount, type Component } from 'svelte';

/**
 * Mount a Svelte component inside a shadow root on `host`, so Skroutz CSS
 * cannot leak in. Components use `<svelte:options css="injected" />`; Svelte
 * then appends their styles to this shadow root.
 */
export function mountShadow<P extends Record<string, unknown>>(host: HTMLElement, comp: Component<P>, props: P): () => void {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const target = document.createElement('div');
  root.appendChild(target);
  const app = mount(comp, { target, props });
  return () => {
    void unmount(app);
    target.remove();
  };
}

export function fmtEuro(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '–';
  return n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

/** 0 = red, 1 = green. */
export function heatColor(c: number): string {
  const x = Math.max(0, Math.min(1, c));
  return `hsl(${Math.round(x * 120)} 70% 40%)`;
}
