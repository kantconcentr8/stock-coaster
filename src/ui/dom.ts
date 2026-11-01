type Attrs = Record<string, string>;

/** Create an element; all text is set via textContent (never HTML). */
export function el(tag: string, attrs: Attrs = {}, children: (Node | string)[] = []): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function show(screenId: string): void {
  document.getElementById(screenId)?.removeAttribute('hidden');
}

export function hide(screenId: string): void {
  document.getElementById(screenId)?.setAttribute('hidden', '');
}
