import { CONTENT } from "../../content";
import { TONES, type ToneId, type Intensity, type MessageLength } from "../../content/schemas";
import type { StorageLike } from "./favorites-v2";
export const PROFILE_KEY = "wesh-ard:v2:profile";
export const FEEDBACK_KEY = "wesh-ard:v2:feedback";
export type Rating = "liked" | "disliked";
export type Feedback = Record<string, Rating>;
export interface Profile { tone: ToneId | "all"; length: MessageLength | "all"; intensity: Intensity; reduceExaggeration: boolean; saveFeedback: boolean }
export const DEFAULT_PROFILE: Profile = { tone: "casual", length: "all", intensity: 1, reduceExaggeration: false, saveFeedback: false };
const ids = new Set(CONTENT.flatMap(s => s.replies.map(r => r.id)));
export function readProfile(raw: string | null): Profile {
  if (!raw || raw.length > 10000) return { ...DEFAULT_PROFILE };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("schemaVersion" in data) || data.schemaVersion !== 2 || !("profile" in data) || !data.profile || typeof data.profile !== "object") return { ...DEFAULT_PROFILE };
    const p = data.profile as Record<string,unknown>;
    return {
      tone: p.tone === "all" || typeof p.tone === "string" && Object.hasOwn(TONES, p.tone) ? p.tone as Profile["tone"] : DEFAULT_PROFILE.tone,
      length: ["all", "short", "medium", "long"].includes(String(p.length)) ? p.length as Profile["length"] : DEFAULT_PROFILE.length,
      intensity: p.intensity === 1 || p.intensity === 2 || p.intensity === 3 ? p.intensity : 1,
      reduceExaggeration: p.reduceExaggeration === true, saveFeedback: p.saveFeedback === true
    };
  } catch { return { ...DEFAULT_PROFILE }; }
}
export function readFeedback(raw: string | null): Feedback {
  if (!raw || raw.length > 300000) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("schemaVersion" in data) || data.schemaVersion !== 2 || !("ratings" in data) || !data.ratings || typeof data.ratings !== "object" || Array.isArray(data.ratings)) return {};
    return Object.fromEntries(Object.entries(data.ratings).slice(0, 5000).filter(([id, value]) => ids.has(id) && (value === "liked" || value === "disliked")));
  } catch { return {}; }
}
export function persistPersonalization(storage: StorageLike, key: typeof PROFILE_KEY | typeof FEEDBACK_KEY, value: Profile | Feedback): boolean {
  const raw = JSON.stringify(key === PROFILE_KEY ? { schemaVersion: 2, profile: value } : { schemaVersion: 2, ratings: value });
  try { storage.setItem(key, raw); return storage.getItem(key) === raw; } catch { return false; }
}
