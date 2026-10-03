export const LOSS_COLOR = "#ef4444";
export const CUMULATIVE_LINE_COLOR = "#e2e8f0";

const ASSET_COLORS: { pattern: RegExp; color: string }[] = [
  { pattern: /^(US100|NAS100|NASDAQ|USTEC|NDX|NQ|MNQ)/, color: "#3b82f6" },
  { pattern: /^(XAU|GOLD|GC|MGC)/, color: "#facc15" },
  { pattern: /^(USOIL|UKOIL|WTI|BRENT|XTI|XBR|CRUDE|OIL|CL|MCL)/, color: "#b45309" },
  { pattern: /^(BTC|XBT)/, color: "#f7931a" },
];

const CURRENCY_COLORS: Record<string, string> = {
  EUR: "#8b5cf6",
  GBP: "#ec4899",
  JPY: "#06b6d4",
  AUD: "#14b8a6",
  CHF: "#d946ef",
  CAD: "#f472b6",
  NZD: "#a78bfa",
};

const CURRENCY_CODES = new Set(["USD", ...Object.keys(CURRENCY_COLORS)]);

const FALLBACK_COLORS = [
  "#94a3b8",
  "#c084fc",
  "#67e8f9",
  "#fda4af",
  "#a5b4fc",
  "#fdba74",
  "#5eead4",
  "#f0abfc",
];

// 브로커별 접미사(.b, .x, +, - 등) 제거: "US100.x" -> "US100", "USOIL+" -> "USOIL"
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().replace(/[.+\-_#!].*$/, "").toUpperCase();
}

function getCurrencyColor(normalized: string): string | undefined {
  const match = normalized.match(/^([A-Z]{3})([A-Z]{3})/);
  if (!match) return undefined;
  const [, base, quote] = match;
  if (!CURRENCY_CODES.has(base) || !CURRENCY_CODES.has(quote)) return undefined;
  const key = base === "USD" ? quote : base;
  return CURRENCY_COLORS[key];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getSymbolColor(symbol: string): string {
  const normalized = normalizeSymbol(symbol);

  for (const { pattern, color } of ASSET_COLORS) {
    if (pattern.test(normalized)) return color;
  }

  const currencyColor = getCurrencyColor(normalized);
  if (currencyColor) return currencyColor;

  return FALLBACK_COLORS[hashString(normalized) % FALLBACK_COLORS.length];
}
