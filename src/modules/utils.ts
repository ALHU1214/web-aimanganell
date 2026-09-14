export function $<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode): T | null {
  return (r || document).querySelector<T>(s);
}

export function $$<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode): T[] {
  return Array.prototype.slice.call((r || document).querySelectorAll<T>(s));
}
