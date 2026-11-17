/* Thin typed wrappers around the sakuga-vfx custom elements (MIT). */

export type SakugaDoneCapable = { done: (keep?: number) => void };
export type SakugaToast = SakugaDoneCapable & { show: (message?: string, ms?: number) => void; hide: () => void };
export type SakugaTabs = EventTarget & { value: string };

export function toast(message: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('global-toast') as SakugaToast | null;
  el?.show(message);
}

export function markDone(button: SakugaDoneCapable | null) {
  button?.done(0); // check stays until the next click
}
