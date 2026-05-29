export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return hex.replace(/^(#[0-9A-Fa-f]{6}).*$/, '$1') + a;
}
