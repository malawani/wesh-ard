import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { CONTENT } from "../content";
import { EDITORIAL_REVIEWS } from "../content/editorial";
import type { EditorialReview } from "../content/editorial/types";
import type { ResponseContent, SituationContent } from "../content/schemas";
export interface InventoryRecord extends ResponseContent { situationId: string; route: string; situationTitle: string; sensitivity: string }
export function validateEditorial(records: InventoryRecord[], content: SituationContent[], reviews: EditorialReview[]) {
 const errors: string[] = [];
 const final = content.flatMap(s => s.replies.map(r => ({ ...r, situationId: s.id, route: s.canonicalRoute })));
 const originals = new Map(records.map(r => [r.id, r]));
 const current = new Map(final.map(r => [r.id, r]));
 const reviewed = new Set<string>();
 const identical = new Map<string,string>();
 const fields = ["directMeaning","possibleImplicitMeaning","possiblePsychologicalImpact","interpretationLimits"] as const;
 if (current.size !== final.length) errors.push("Duplicate current response IDs");
 if (final.length !== records.length) errors.push("Record count changed during editorial work");
 for (const old of records) {
  const r = current.get(old.id);
  if (!r) errors.push(`Lost response: ${old.id}`);
  else if (r.situationId !== old.situationId || r.route !== old.route) errors.push(`Changed response linkage: ${old.id}`);
 }
 for (const r of final) if (!originals.has(r.id)) errors.push(`Added response outside scope: ${r.id}`);
 const log = reviews.map(review => {
  if (reviewed.has(review.id)) errors.push(`Duplicate review: ${review.id}`);
  reviewed.add(review.id);
  const old = originals.get(review.id), now = current.get(review.id);
  if (!old || !now) errors.push(`Unknown review ID: ${review.id}`);
  if (old && review.sourceText !== old.text) errors.push(`Review source mismatch: ${review.id}`);
  if (now && review.finalText !== now.text) errors.push(`Review final text mismatch: ${review.id}`);
  if ((review.sourceText === review.finalText) !== (review.decision === "keep")) errors.push(`Wrong keep/edit decision: ${review.id}`);
  if (review.decision === "edit" && !review.reason?.trim()) errors.push(`Missing edit reason: ${review.id}`);
  const classificationChanged = old && now ? (["tones","allowedStages","intensity","dialect"] as const).filter(key => JSON.stringify(old[key]) !== JSON.stringify(now[key])) : [];
  if (classificationChanged.length && !review.classificationReason?.trim()) errors.push(`Missing classification reason: ${review.id}`);
  for (const field of fields) {
   const value = review.analysis?.[field];
   if (typeof value !== "string" || value.trim().length < 12 || /lorem ipsum|TODO|placeholder|شرح تجريبي/i.test(value)) errors.push(`Incomplete explanation ${field}: ${review.id}`);
   if (now?.analysis?.[field] !== value) errors.push(`Wrong attached explanation ${field}: ${review.id}`);
   if (review.decision === "edit" && value?.includes(review.sourceText)) errors.push(`Explanation quotes superseded text: ${review.id}`);
  }
  const signature = JSON.stringify(review.analysis);
  if (identical.has(signature)) errors.push(`Repeated whole explanation: ${review.id} / ${identical.get(signature)}`);
  identical.set(signature,review.id);
  return { id: review.id, situationId: old?.situationId, route: old?.route, decision: review.decision, sourceText: review.sourceText, finalText: review.finalText, reason: review.reason ?? null, classificationChanged, classificationBefore: old ? { tones: old.tones, allowedStages: old.allowedStages, intensity: old.intensity, dialect: old.dialect } : null, classificationAfter: now ? { tones: now.tones, allowedStages: now.allowedStages, intensity: now.intensity, dialect: now.dialect } : null, classificationReason: review.classificationReason ?? null };
 });
 for (const r of final) if (!reviewed.has(r.id)) {
  if (r.text !== originals.get(r.id)?.text) errors.push(`Unlogged text change: ${r.id}`);
  if (r.analysis) errors.push(`Unlogged explanation: ${r.id}`);
 }
 const pending = records.filter(r => !reviewed.has(r.id)).map(r => r.id);
 return { valid: errors.length === 0, complete: errors.length === 0 && pending.length === 0, total: records.length, reviewed: reviews.length, kept: log.filter(r => r.decision === "keep").length, edited: log.filter(r => r.decision === "edit").length, reclassified: log.filter(r => r.classificationChanged.length > 0).length, explained: reviews.length, pending, nextBatch: pending.slice(0,12), errors, log };
}
function run() {
 const baseline = JSON.parse(readFileSync("content/editorial/baseline.json","utf8")) as { records: InventoryRecord[] };
 const report = validateEditorial(baseline.records, CONTENT, EDITORIAL_REVIEWS);
 const timestamp = new Date().toISOString();
 mkdirSync("reports/editorial", { recursive: true });
 const requireComplete = process.argv.includes("--complete");
 const name = requireComplete ? "coverage-complete" : "coverage";
 writeFileSync(`reports/editorial/${name}.json`, JSON.stringify({ generatedAt: timestamp, ...report },null,2)+"\n");
 if (!requireComplete) {
  writeFileSync("content/editorial/progress.json", JSON.stringify({ generatedAt: timestamp, total: report.total, reviewed: report.reviewed, kept: report.kept, edited: report.edited, reclassified: report.reclassified, explained: report.explained, complete: report.complete, reviewedIds: report.log.map(r => r.id), pendingIds: report.pending, nextBatch: report.nextBatch },null,2)+"\n");
  writeFileSync("reports/editorial/review-log.json", JSON.stringify(report.log,null,2)+"\n");
  writeFileSync("docs/editorial/PROGRESS.md", `# تقدم المراجعة\\n\\nآخر فحص: ${timestamp}\\n\\nالموجود فعليًا: ${report.total}. المراجع: ${report.reviewed}.\\nالمُبقى: ${report.kept}. المعدل نصه: ${report.edited}. المصحح تصنيفه: ${report.reclassified} (قد يتقاطع مع الإبقاء أو التعديل).\\nالشروح المكتملة: ${report.explained}. المتبقي: ${report.pending.length}.\\nاكتمال المهمة: ${report.complete ? "نعم" : "لا"}.\\n\\nالدفعة التالية: ${report.nextBatch.join(", ")}.\\n\\nالمعرفات الكاملة في content/editorial/progress.json، والسجل قبل/بعد وأسباب التعديل في reports/editorial/review-log.json.\\n\\nفحص المنجز: ${report.valid ? "ناجح" : "فاشل"}.\\n${report.errors.join("\\n")}\\n`.replace(/\\n/g,"\n"));
 }
 console.log(JSON.stringify({ total: report.total, reviewed: report.reviewed, kept: report.kept, edited: report.edited, reclassified: report.reclassified, explained: report.explained, pending: report.pending.length, valid: report.valid, complete: report.complete, errors: report.errors },null,2));
 if (!report.valid || requireComplete && !report.complete) process.exitCode = 1;
}
if (process.argv[1]?.endsWith("validate-editorial.ts")) run();
