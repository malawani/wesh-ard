import { CATALOG } from "./catalog";
import { TONES, type Suggestion } from "./engine";

export const FAVORITES_KEY = "wesh-ard:favorites:v1";

function isSuggestion(value: unknown): value is Suggestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Suggestion>;
  return typeof item.id === "string" && Boolean(item.id.trim()) &&
    typeof item.text === "string" && Boolean(item.text.trim()) &&
    TONES.some(tone => tone === item.tone) &&
    CATALOG.some(situation => situation.id === item.situationId);
}

export function readFavorites(raw: string | null): Suggestion[] {
  try {
    const saved: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(saved)) return [];
    return [...new Map(saved.filter(isSuggestion).map(item => [item.id, item])).values()];
  } catch {
    return [];
  }
}

export function toggleFavorite(items: Suggestion[], item: Suggestion): Suggestion[] {
  return items.some(saved => saved.id === item.id)
    ? items.filter(saved => saved.id !== item.id)
    : [item, ...items];
}
