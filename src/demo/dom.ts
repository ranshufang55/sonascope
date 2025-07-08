export function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing workbench element: ${id}`);
  return node as T;
}
export function setText(id: string, value: string): void {
  element(id).textContent = value;
}
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function canvasSize(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
  pixelRatio: number;
} {
  const rect = canvas.getBoundingClientRect();
  return {
    width: Math.max(1, Math.min(2048, Math.round(rect.width))),
    height: Math.max(1, Math.min(1024, Math.round(rect.height))),
    pixelRatio: Math.min(1.5, globalThis.devicePixelRatio || 1),
  };
}
