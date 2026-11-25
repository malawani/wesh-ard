import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { CONTENT, RESPONSES_BY_ID } from "../../content";
import { EDITORIAL_REVIEWS, REVIEWS_BY_ID } from "../../content/editorial";
import { parseFavorites, migrateFavorites, saveFavorites, FAVORITES_V2_KEY, favoriteIdentity } from "../../lib/storage/favorites-v2";
import { validateEditorial, type InventoryRecord } from "../../scripts/validate-editorial";
const baseline = JSON.parse(readFileSync("content/editorial/baseline.json","utf8")) as { records: InventoryRecord[] };

describe("Editorial coverage and source integrity", () => {
 it("requires complete editorial coverage for every library record", () => {
  const report = validateEditorial(baseline.records, CONTENT, EDITORIAL_REVIEWS);
  expect(report.errors).toEqual([]);
  expect(report.total).toBe(2602);
  expect(report.complete).toBe(true);
  expect(report.pending).toEqual([]);
  expect(report.pending.length + report.reviewed).toBe(report.total);
  for (const id of report.pending) expect(REVIEWS_BY_ID.has(id)).toBe(false);
 });
 it("detects missing fields, obsolete analysis binding and unlogged edits", () => {
  const reviews = structuredClone(EDITORIAL_REVIEWS);
  reviews[0].analysis.interpretationLimits = "";
  const final = structuredClone(CONTENT);
  final[0].replies[0].text = "تغيير لا يظهر في سجل المراجعة";
  const report = validateEditorial(baseline.records, final, reviews);
  expect(report.errors.join("\n")).toContain("Incomplete explanation");
  expect(report.errors.join("\n")).toContain("Review final text mismatch");
  expect(validateEditorial(baseline.records, CONTENT.slice(1), EDITORIAL_REVIEWS).errors.join("\n")).toContain("Lost response");
 });
 it("keeps accepted text unchanged and binds edits to their new explanations", () => {
  const kept = RESPONSES_BY_ID.get("photo:soft:0")!;
  expect(kept.text).toBe("ما شاء الله، طالعة حلوة.");
  expect(kept.analysis?.directMeaning).toContain("الصورة");
  const edited = RESPONSES_BY_ID.get("cold:soft:0")!;
  expect(edited.text).toBe("إذا وقتك مو مناسب، نقدر نتكلم بعدين.");
  expect(edited.analysis?.interpretationLimits).toContain("مشغولة فعلًا");
  expect(REVIEWS_BY_ID.get(edited.id)?.reason).toBeTruthy();
  for (const response of RESPONSES_BY_ID.values()) {
   if (!REVIEWS_BY_ID.has(response.id)) expect(response.analysis).toBeUndefined();
  }
 });
});
describe("Saved personal text survives editorial changes", () => {
 const review = REVIEWS_BY_ID.get("miss:direct:0")!;
 it("preserves the published old text and its canonical ID without substituting edited wording", () => {
  const saved = parseFavorites(JSON.stringify([{ id: review.id, text: review.sourceText }]));
  expect(saved[0].id).toBe(review.id);
  expect(saved[0].text).toBe(review.sourceText);
  expect(saved[0].orphaned).toBe(false);
  expect(saved[0].text).not.toBe(RESPONSES_BY_ID.get(review.id)?.text);
 });
 it("retains both saved versions of one ID across storage and repeatable migration", () => {
  const versions = parseFavorites(JSON.stringify([{ id: review.id, text: review.sourceText },{ id: review.id, text: review.finalText }]));
  expect(versions).toHaveLength(2);
  expect(new Set(versions.map(favoriteIdentity)).size).toBe(2);
  const storageData = new Map<string,string>();
  const storage = { getItem: (key: string) => storageData.get(key) ?? null, setItem: (key: string,value: string) => { storageData.set(key,value); } };
  expect(saveFavorites(storage,versions)).toBe(true);
  expect(migrateFavorites(storage).items).toEqual(versions);
  expect(parseFavorites(storageData.get(FAVORITES_V2_KEY)!)).toEqual(versions);
 });
 it("does not turn arbitrary user text under a known ID into reviewed library content", () => {
  const custom = "هذه جملتي الشخصية وليست من المكتبة";
  const saved = parseFavorites(JSON.stringify([{ id: review.id, text: custom }]));
  expect(saved[0].text).toBe(custom);
  expect(saved[0].orphaned).toBe(true);
  expect(saved[0].legacyId).toBe(review.id);
 });
});
