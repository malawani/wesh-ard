import { describe, it, expect } from "vitest";
import { DEFAULT_PROFILE, PROFILE_KEY, FEEDBACK_KEY, readProfile, readFeedback, persistPersonalization } from "../../lib/storage/personalization";
import { recommend } from "../../lib/recommendation";

describe("Local preferences and ratings", () => {
 it("validates preferences without trusting unknown fields or versions", () => {
  expect(readProfile("{broken")).toEqual(DEFAULT_PROFILE);
  expect(readProfile(JSON.stringify({ schemaVersion: 3, profile: { tone: "romantic" } }))).toEqual(DEFAULT_PROFILE);
  const p = readProfile(JSON.stringify({ schemaVersion: 2, profile: { tone: "poetic", length: "long", intensity: 3, saveFeedback: true, reduceExaggeration: true, privateText: "must not survive" } }));
  expect(p).toEqual({ tone: "poetic", length: "long", intensity: 3, saveFeedback: true, reduceExaggeration: true });
  expect(readProfile(JSON.stringify({ schemaVersion: 2, profile: { tone: "__proto__", intensity: 99 } }))).toEqual(DEFAULT_PROFILE);
 });
 it("only accepts known response IDs and explicit rating values", () => {
  expect(readFeedback("bad-json")).toEqual({});
  expect(readFeedback(JSON.stringify({ schemaVersion: 2, ratings: { "miss:soft:0": "liked", unknown: "liked", "photo:soft:0": "private message" } }))).toEqual({ "miss:soft:0": "liked" });
 });
 it("verifies storage writes and never reports blocked writes as saved", () => {
  const map = new Map<string,string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string,value: string) => { map.set(key,value); } };
  expect(persistPersonalization(storage, PROFILE_KEY, DEFAULT_PROFILE)).toBe(true);
  expect(persistPersonalization(storage, FEEDBACK_KEY, { "miss:soft:0": "liked" })).toBe(true);
  expect(map.get(PROFILE_KEY)).not.toContain("privateText");
  expect(persistPersonalization({ getItem: () => null, setItem: () => {} }, PROFILE_KEY, DEFAULT_PROFILE)).toBe(false);
 });
 it("reducing exaggeration excludes degree-three content without broadening relationship stages", () => {
  const input = { situationId: "flirt", relationshipStage: "love" as const, preferredTone: "all" as const, intensity: 3 as const, length: "all" as const };
  expect(recommend(input).suggestions.some(r => r.intensity === 3)).toBe(true);
  const reduced = recommend({ ...input, reduceExaggeration: true });
  expect(reduced.suggestions.every(r => r.intensity <= 2 && r.allowedStages.includes("love"))).toBe(true);
 });
});
describe("Situation-specific context", () => {
 const base = { relationshipStage: "getting_to_know" as const, preferredTone: "all" as const, intensity: 1 as const, length: "all" as const };
 it("changes photo suggestions by the selected focus", () => {
  const detail = recommend({ ...base, situationId: "photo", optionalContext: "photo-focus:details" });
  const light = recommend({ ...base, situationId: "photo", optionalContext: "photo-focus:light" });
  expect(detail.suggestions.some(r => r.id === "photo:v2:1")).toBe(true);
  expect(detail.suggestions.some(r => r.id === "photo:soft:0")).toBe(false);
  expect(light.suggestions.some(r => r.id === "photo:soft:0")).toBe(true);
  expect(light.suggestions.some(r => r.id === "photo:v2:1")).toBe(false);
 });
 it("puts a cancellation-specific apology first and ignores unrecognized context", () => {
  expect(recommend({ ...base, situationId: "sorry", optionalContext: "apology-reason:cancel" }).suggestions[0].id).toBe("sorry:context:cancel");
  expect(recommend({ ...base, preferredTone: "casual", situationId: "sorry", optionalContext: "apology-reason:cancel" }).suggestions[0].id).toBe("sorry:context:cancel");
  expect(recommend({ ...base, situationId: "sorry", optionalContext: "invented-context" }).appliedFilters.context).toBeNull();
 });
});
