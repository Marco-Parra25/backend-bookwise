/**
 * Utilidades para sistema de recomendaciones
 */

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

export function toTagArray(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(normalize).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => normalize(t))
    .filter(Boolean);
}

