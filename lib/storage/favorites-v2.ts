import { CONTENT } from "../../content";
import type { ToneId } from "../../content/schemas";

export const FAVORITES_V2_KEY = "wesh-ard:v2:favorites";
export const LEGACY_KEYS = ["wesh-ard:favorites:v1", "wesh-ard-favorites-v1", "wesh_favs_v02", "wesh-ard-repaired-favorites-v03"];
export interface FavoriteItem {
  id: string; text: string; situationId: string | null; tone: ToneId | null;
  orphaned: boolean; legacyId?: string;
}
export interface FavoriteEnvelope { schemaVersion: 2; migratedLegacy: true; items: FavoriteItem[] }
const responses = CONTENT.flatMap(s => s.replies.map(r => ({ ...r, situationId: s.id })));
const byId = new Map(responses.map(r => [r.id, r]));
const byText = new Map(responses.map(r => [r.text, r]));
export function orphanId(text: string) {
  // Text forms the stable identity; never trust a conflicting imported ID.
  return `orphan:${text}`;
}
export function parseFavorites(raw: string | null): FavoriteItem[] {
  if (!raw || raw.length > 2_000_000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    const entries: unknown = Array.isArray(data) ? data : data && typeof data === "object" &&
      "schemaVersion" in data && data.schemaVersion === 2 && "items" in data ? data.items : [];
    if (!Array.isArray(entries)) return [];
    const items: FavoriteItem[] = [];
    for (const entry of entries.slice(0, 5000)) {
      if (!entry || typeof entry !== "object" || typeof entry.text !== "string" || !entry.text.trim() || entry.text.length > 4000) continue;
      const text: string = entry.text;
      const knownId = typeof entry.id === "string" ? byId.get(entry.id) : undefined;
      // A stale ID must never overwrite the user's original text.
      const response = knownId?.text === text ? knownId : byText.get(text);
      items.push(response ? {
        id: response.id, text, situationId: response.situationId, tone: response.tones[0], orphaned: false
      } : {
        id: orphanId(text), text, situationId: null, tone: null, orphaned: true,
        ...(typeof entry.id === "string" ? { legacyId: entry.id.slice(0, 200) } : {})
      });
    }
    return [...new Map(items.map(item => [item.id, item])).values()];
  } catch { return []; }
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function saveFavorites(storage: StorageLike, items: FavoriteItem[]) {
  const raw = JSON.stringify({ schemaVersion: 2, migratedLegacy: true, items } satisfies FavoriteEnvelope);
  try {
    storage.setItem(FAVORITES_V2_KEY, raw);
    return storage.getItem(FAVORITES_V2_KEY) === raw;
  } catch { return false; }
}
export function migrateFavorites(storage: StorageLike) {
  const items: FavoriteItem[] = [];
  const errors: string[] = [];
  let keys = [FAVORITES_V2_KEY, ...LEGACY_KEYS];
  try {
    const current = storage.getItem(FAVORITES_V2_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (parsed && typeof parsed === "object" && "schemaVersion" in parsed && parsed.schemaVersion === 2 &&
        "migratedLegacy" in parsed && parsed.migratedLegacy === true && "items" in parsed && Array.isArray(parsed.items)) {
        keys = [FAVORITES_V2_KEY];
      } else errors.push(FAVORITES_V2_KEY);
    }
  } catch { errors.push(FAVORITES_V2_KEY); }
  for (const key of keys) {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        if (raw.length > 2_000_000) { errors.push(key); continue; }
        try {
          const parsed: unknown = JSON.parse(raw);
          const entries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && "items" in parsed ? parsed.items : null;
          if (!Array.isArray(entries) || entries.length > 5000) errors.push(key);
        } catch { errors.push(key); }
      }
      items.push(...parseFavorites(raw));
    }
    catch { errors.push(key); }
  }
  const merged = [...new Map(items.map(item => [item.id, item])).values()];
  const persisted = errors.length === 0 && saveFavorites(storage, merged);
  return { items: merged, persisted, readErrors: errors };
}
