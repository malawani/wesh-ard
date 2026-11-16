import { describe, it, expect } from "vitest";
import { CONTENT, CONTENT_BY_ID } from "../../content";
import { ALL_STAGES, TONES, SENSITIVE_TONES } from "../../content/schemas";
import { recommend, availableTones } from "../../lib/recommendation";
import { validateContent } from "../../lib/validation/content";
import { searchContent } from "../../lib/search";
import { migrateStage } from "../../lib/migration/stages";
import { FAVORITES_V2_KEY, LEGACY_KEYS, migrateFavorites, parseFavorites, saveFavorites, type StorageLike } from "../../lib/storage/favorites-v2";

function memory(initial: Record<string, string> = {}): StorageLike & { data: Map<string,string> } {
  const data = new Map(Object.entries(initial));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } };
}
const base = { situationId: "love", relationshipStage: "getting_to_know" as const, preferredTone: "all" as const, intensity: 3 as const, length: "all" as const };
describe("V2 content contract", () => {
  it("preserves every source response and runtime variant with its original ID", () => {
    const report = validateContent();
    expect(report.errors).toEqual([]);
    expect(report.legacyBaseResponses).toBe(180);
    expect(report.responses).toBe(report.uniqueTexts);
    expect(report.remainingSituations).not.toContain("reply-031");
  });
  it("fails release validation while phases 2–7 are pending", () => {
    expect(validateContent(undefined, true).valid).toBe(false);
    expect(validateContent().releaseComplete).toBe(false);
  });
  it("rejects duplicate text, wrong lengths, empty eligibility and lost legacy IDs", () => {
    const broken = structuredClone(CONTENT);
    broken[0].replies[0].text = broken[1].replies[0].text;
    broken[0].replies[0].length = "long";
    broken[0].replies[0].allowedStages = [];
    const errors = validateContent(broken).errors.join("\n");
    for (const reason of ["Duplicate text", "Incorrect length", "Invalid stages", "Lost legacy response"]) expect(errors).toContain(reason);
  });
});
describe("V2 recommendation constraints", () => {
  it("never broadens the stage or intensity, including all fallbacks", () => {
    for (const situation of CONTENT) for (const stage of ALL_STAGES) for (const preferredTone of Object.keys(TONES) as (keyof typeof TONES)[]) {
      const result = recommend({ situationId: situation.id, relationshipStage: stage, preferredTone, intensity: 1, length: "long" });
      for (const r of result.suggestions) {
        expect(r.allowedStages).toContain(stage);
        expect(r.intensity).toBeLessThanOrEqual(1);
        if (situation.sensitivity !== "normal") expect(r.tones.every(t => SENSITIVE_TONES.includes(t))).toBe(true);
      }
    }
  });
  it("never offers love declarations in early acquaintance", () => {
    const result = recommend(base);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every(r => !r.text.includes("أحبك"))).toBe(true);
  });
  it("applies length before fallback and includes a real long message", () => {
    const result = recommend({ ...base, relationshipStage: "love", preferredTone: "romantic", length: "long" });
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every(r => r.length === "long")).toBe(true);
    expect(result.fallbackReason).toBeUndefined();
  });
  it("does not offer romantic tones for refusal or requests for space", () => {
    for (const id of ["space", "reject", "sorry", "upset"]) {
      expect(availableTones(id, "love").every(t => SENSITIVE_TONES.includes(t))).toBe(true);
      const result = recommend({ ...base, situationId: id, preferredTone: "romantic" });
      expect(result.suggestions.every(r => r.tones.every(t => SENSITIVE_TONES.includes(t)))).toBe(true);
    }
  });
  it("new commitment replies remain exclusive to the chosen stage", () => {
    const married = recommend({ ...base, situationId: "reply-012", relationshipStage: "married" });
    expect(married.suggestions.some(r => r.text.includes("زوجتي"))).toBe(true);
    const first = recommend({ ...base, situationId: "reply-012", relationshipStage: "first_contact" });
    expect(first.suggestions.some(r => /زوجتي|خطيبتي|حبيبتي/.test(r.text))).toBe(false);
  });
  it("respects a request to stop flirting at every stage, even with romantic filters", () => {
    for (const relationshipStage of ALL_STAGES) {
      const result = recommend({ ...base, situationId: "reply-023", relationshipStage, preferredTone: "romantic" });
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.every(r => r.tones.every(t => SENSITIVE_TONES.includes(t)))).toBe(true);
      expect(availableTones("reply-023", relationshipStage).every(t => SENSITIVE_TONES.includes(t))).toBe(true);
    }
  });
  it("does not assume reciprocal feelings in early-stage replies to hints", () => {
    for (const situationId of ["reply-029", "reply-030"]) {
      const result = recommend({ ...base, situationId, relationshipStage: "one_sided" });
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.every(r => !r.tones.includes("romantic") && !r.text.includes("أحبك"))).toBe(true);
    }
    const committed = recommend({ ...base, situationId: "reply-030", relationshipStage: "love", preferredTone: "romantic" });
    expect(committed.suggestions.some(r => r.text.includes("أحبك"))).toBe(true);
  });
  it("returns an explainable empty result for unknown IDs", () => {
    const r = recommend({ ...base, situationId: "nonexistent" });
    expect(r.selectedSituation).toBeNull(); expect(r.suggestions).toEqual([]); expect(r.fallbackReason).toBeTruthy();
  });
  it("ratings only reorder after three explicit ratings", () => {
    const before = recommend({ ...base, relationshipStage: "love" });
    const last = before.suggestions.at(-1)!;
    const early = recommend({ ...base, relationshipStage: "love", feedback: { [last.id]: "liked" } });
    expect(early.suggestions.map(r => r.id)).toEqual(before.suggestions.map(r => r.id));
    const ranked = recommend({ ...base, relationshipStage: "love", feedback: { [last.id]: "liked", unused1: "disliked", unused2: "disliked" } });
    expect(ranked.suggestions[0].id).toBe(last.id);
  });
});
describe("Arabic search", () => {
  it("uses Saudi synonyms and weights the full question", () => {
    expect(searchContent("قالت لي ليش مهتم فيني؟", "reply")[0]?.id).toBe("why");
    expect(searchContent("وحشتيني", "reply")[0]?.id).toBe("miss");
  });
  it("finds the new situations from natural Saudi phrases", () => {
    for (const [query, id] of [
      ["قالت لي ليش تبتسم؟", "reply-021"], ["قالت خجلت", "reply-022"],
      ["قالت ابي غزل", "reply-024"], ["قالت دللني", "reply-025"],
      ["تشوفني كيوت؟", "reply-026"], ["من الاجمل؟", "reply-027"],
      ["اسلوبك مختلف", "reply-028"], ["احس بيننا شي", "reply-029"],
      ["قاعده افكر فيك", "reply-030"]
    ]) expect(searchContent(query, "reply")[0]?.id).toBe(id);
  });
  it("distinguishes stopping flirtation from asking for it or stopping all contact", () => {
    for (const query of ["لا تغازلني", "قالت غازلني قبل، بس الحين لا تغازلني", "ما أبي غزل", "وقف الغزل"]) {
      expect(searchContent(query).map(s => s.id)).toEqual(["reply-023"]);
    }
    expect(searchContent("غازلني", "reply")[0]?.id).toBe("reply-024");
    expect(searchContent("لا تغازلني", "send")).toEqual([]);
    expect(searchContent("لا تغازلني ولا تتواصل معي").map(s => s.id)).toEqual(["space"]);
  });
  it("gives stop-contact requests priority over romantic terms", () => {
    expect(searchContent("قالت لا تتواصل معي، اشتقت لك بس", "reply")).toEqual([]);
    expect(searchContent("قالت لا تتواصل معي، اشتقت لك بس")[0]?.id).toBe("space");
    expect(searchContent("قالت ما أحبك", "reply")).toEqual([]);
  });
  it("keeps routes separate and handles whitespace and unknown queries", () => {
    expect(searchContent("   ", "send")).toHaveLength(CONTENT.filter(s => s.canonicalRoute === "send").length);
    expect(searchContent("xyz-928")).toEqual([]);
    expect(searchContent("صباح", "send").every(s => s.canonicalRoute === "send")).toBe(true);
  });
});
describe("Data migration and preservation", () => {
  const old = { id: "miss:soft:0", text: "وأنا والله فقدت سوالفك.", situationId: "miss", tone: "soft" };
  it("merges supported legacy keys without deleting any source", () => {
    const initial = Object.fromEntries(LEGACY_KEYS.map(key => [key, JSON.stringify([old, old])]));
    const storage = memory(initial);
    const migration = migrateFavorites(storage);
    expect(migration.persisted).toBe(true); expect(migration.items).toHaveLength(1);
    for (const key of LEGACY_KEYS) expect(storage.data.get(key)).toBe(initial[key]);
    expect(migrateFavorites(storage).items).toEqual(migration.items);
  });
  it("does not resurrect deleted migrated favorites on next load", () => {
    const storage = memory({ [LEGACY_KEYS[0]]: JSON.stringify([old]) });
    migrateFavorites(storage);
    expect(saveFavorites(storage, [])).toBe(true);
    expect(migrateFavorites(storage).items).toEqual([]);
    expect(storage.data.has(LEGACY_KEYS[0])).toBe(true);
  });
  it("preserves unknown or conflicting IDs as copyable text", () => {
    const results = parseFavorites(JSON.stringify([{ id: old.id, text: "عبارتي المحفوظة القديمة" }, { id: "unknown", text: "عبارتي المحفوظة القديمة" }]));
    expect(results).toHaveLength(1); expect(results[0].orphaned).toBe(true);
    expect(results[0].text).toBe("عبارتي المحفوظة القديمة"); expect(results[0].situationId).toBeNull();
  });
  it("handles invalid JSON, incomplete objects, unknown properties and duplicate IDs", () => {
    expect(parseFavorites("{broken")).toEqual([]);
    expect(parseFavorites(JSON.stringify([null, {}, { id: "bad" }, old, old]))).toHaveLength(1);
    expect(parseFavorites(JSON.stringify([{ ...old, unknown: "ignore" }]))[0]).not.toHaveProperty("unknown");
  });
  it("does not claim success when writing or reading is blocked", () => {
    const storage = memory({ [LEGACY_KEYS[0]]: JSON.stringify([old]) });
    storage.setItem = () => { throw new Error("quota"); };
    const result = migrateFavorites(storage);
    expect(result.persisted).toBe(false); expect(result.items[0].text).toBe(old.text);
    const denied = migrateFavorites({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    expect(denied.persisted).toBe(false);
  });
  it("never overwrites malformed or future-version V2 data", () => {
    for (const raw of ["{broken", '{"schemaVersion":3,"items":[]}']) {
      const storage = memory({ [FAVORITES_V2_KEY]: raw, [LEGACY_KEYS[0]]: JSON.stringify([old]) });
      expect(migrateFavorites(storage).persisted).toBe(false);
      expect(storage.data.get(FAVORITES_V2_KEY)).toBe(raw);
    }
  });
  it("preserves runtime stage-variant IDs too", () => {
    const r = CONTENT_BY_ID.get("love")!.replies.find(r => r.id === "love:direct:0:early")!;
    expect(parseFavorites(JSON.stringify([{ id: r.id, text: r.text }]))[0].id).toBe(r.id);
  });
  it("keeps legacy serious stage ambiguous until the user chooses", () => {
    expect(migrateStage("serious")).toBe("legacy_serious");
    expect(migrateStage("early")).toBe("getting_to_know");
    expect(migrateStage("mutual")).toBe("mutual_crush");
    expect(migrateStage("married")).toBe("married");
    expect(migrateStage("__proto__")).toBeNull();
  });
});
