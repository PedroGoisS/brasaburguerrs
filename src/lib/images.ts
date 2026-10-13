const MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Valida e reduz a imagem (máx. 900px) para economizar espaço. */
export async function readImage(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error(`"${file.name}": use JPG, PNG ou WEBP.`);
  if (file.size > MAX) throw new Error(`"${file.name}": a imagem deve ter no máximo 2 MB.`);
  const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
