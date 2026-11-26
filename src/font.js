export const FONT = '"Press Start 2P"';
const unit = (sc) => sc * 5;
export function textWidth(s, sc) { return s.length * unit(sc); }
export function drawText(ctx, s, x, y, sc, color, { align = 'left', shadow = null } = {}) {
  const px = unit(sc); ctx.save(); ctx.font = `${px}px ${FONT}`; ctx.textBaseline = 'top'; ctx.textAlign = align;
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + Math.max(1, px / 8), y + Math.max(1, px / 8)); }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore(); return s.length * px;
}
export async function loadFont() {
  const f = new FontFace('Press Start 2P', 'url(assets/fonts/PressStart2P.woff2)'); await f.load(); document.fonts.add(f);
}
