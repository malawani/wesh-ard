import { mkdirSync, writeFileSync } from "node:fs";
import { validateContent, ROUTE_TARGETS } from "../lib/validation/content";
const report = validateContent(undefined, process.argv.includes("--release"));
const timestamp = new Date().toISOString();
const reportName = report.mode === "release" ? "release-validation" : "content-validation";
mkdirSync("reports", { recursive: true });
mkdirSync("docs", { recursive: true });
writeFileSync(`reports/${reportName}.json`, JSON.stringify({ generatedAt: timestamp, ...report }, null, 2) + "\n");
writeFileSync(`reports/${reportName}.md`, `# Content validation\n\nGenerated: ${timestamp}\n\nMode: ${report.mode}\nValid: ${report.valid}\nV2 complete: ${report.releaseComplete}\nSituations: ${report.situations}/320\nResponses: ${report.responses}/2560\nUnique normalized texts: ${report.uniqueTexts}\nTotal preserved records: ${report.responseRecords}\nRetained-only legacy records: ${report.retainedOnlyCount}\n\n## Errors\n\n${report.errors.join("\n") || "None"}\n\n## Warnings\n\n${report.warnings.join("\n") || "None"}\n\n## Tone counts (multi-label)\n\n${Object.entries(report.tones).map(([t,n]) => `- ${t}: ${n}`).join("\n")}\n\nSee JSON for all similarity candidates.\n`);
if (report.mode === "release") {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.valid ? 0 : 1);
}
writeFileSync("content/progress.json", JSON.stringify({ version: 2, targetSituations: 320, targetResponses: 2560, completedSituations: report.situations, completedResponses: report.responses, uniqueTexts: report.uniqueTexts, completedRoutes: Object.entries(report.routes).filter(([r,n]) => n === ROUTE_TARGETS[r as keyof typeof ROUTE_TARGETS]).map(([r]) => r), nextBatch: report.nextBatch, generatedAt: timestamp, releaseComplete: report.releaseComplete }, null, 2) + "\n");
const phaseRows = [
  ["المرحلة 2: توسعة المسارات الأصلية", ["reply", "send", "guide"]],
  ["المرحلة 3: المحادثة", ["open", "continue"]],
  ["المرحلة 4: الغزل والاعتراف", ["flirt", "confession"]],
  ["المرحلة 5: المصالحة والاهتمام", ["reconcile", "care"]],
  ["المرحلة 6: المناسبات واللقاءات", ["occasions", "meeting"]],
  ["المرحلة 7: الردود السريعة", ["quick"]]
] as const;
writeFileSync("docs/CONTENT_PROGRESS.md", `# تقدم المحتوى\n\nآخر فحص: ${timestamp}\n\nالمواقف الفعلية: ${report.situations}/320.\nالعبارات القابلة للترشيح: ${report.responses}، والفريدة بعد التطبيع: ${report.uniqueTexts}.\nالسجلات الكلية: ${report.responseRecords}؛ منها ${report.retainedOnlyCount} محفوظة للتوافق القديم فقط ولا تدخل عدد الترشيحات.\nالنصوص الأصلية المحفوظة: ${report.legacyBaseResponses}، ومعرّفات نتائج التشغيل القديمة: ${report.legacyRuntimeIds}.\n\nالمرحلتان 0 و1: التدقيق والحفظ والترحيل ونموذج البيانات.\n${phaseRows.map(([label,routes]) => `${label}: ${routes.every(r => report.routes[r] === ROUTE_TARGETS[r]) ? "مكتملة محتوى" : "قيد التنفيذ"} (${routes.map(r => `${r}: ${report.routes[r]}/${ROUTE_TARGETS[r]}`).join("، ")}).`).join("\n")}\n\nالمتبقي: ${report.remainingSituations.length} موقفًا.\nالدفعة التالية: ${report.nextBatch.join(", ") || "لا توجد دفعات محتوى ناقصة؛ راجع FINAL_HANDOFF.md للتحقق والتسليم"}.\n\nفحص المحتوى: ${report.valid ? "ناجح" : "فاشل"}.\nاكتمال شروط مكتبة V2: ${report.releaseComplete ? "نعم" : "لا"}. هذا فحص المحتوى؛ نتائج التطبيق والمتصفح مستقلة في تقارير الاختبار.\n\n${report.warnings.join("\n") || "لا تحذيرات تشابه غير مراجعة."}\nحالات التشابه المراجعة: ${report.reviewedSimilarPairs.length}؛ راجع CONTENT_GUIDELINES.md.\n`);

console.log(JSON.stringify({ valid: report.valid, releaseComplete: report.releaseComplete, situations: report.situations, responses: report.responses, errors: report.errors, warnings: report.warnings }, null, 2));
if (!report.valid) process.exitCode = 1;
