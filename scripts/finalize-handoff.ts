import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { MANIFEST } from "../content/manifest";
import { ROUTES, STAGES, TONES } from "../content/schemas";
import { validateContent } from "../lib/validation/content";
const content = validateContent(undefined, true);
const e2e = JSON.parse(readFileSync("reports/e2e-results.json", "utf8")) as { stats: { expected: number; unexpected: number; flaky: number; skipped: number } };
const unitLog = readFileSync("reports/final/unit-tests.log", "utf8");
const match = unitLog.match(/Tests\s+(\d+) passed/);
if (!content.valid || !match || e2e.stats.unexpected || e2e.stats.flaky || e2e.stats.skipped) throw new Error("Handoff requires passing content, unit and browser evidence");
const units = Number(match[1]);
const generatedAt = new Date().toISOString();
const routeRows = Object.entries(ROUTES).map(([id,label]) => `| ${id} | ${label} | ${content.routes[id]} |`).join("\n");
const stageRows = Object.entries(STAGES).map(([id,label]) => `- ${id}: ${label}`).join("\n");
const toneRows = Object.entries(TONES).map(([id,label]) => `| ${id} | ${label} | ${content.tones[id]} |`).join("\n");
const manifestRows = MANIFEST.map(m => `| ${m.id} | ${m.canonicalRoute} | ${m.title} |`).join("\n");
const text = `# التسليم النهائي للتنفيذ المحلي — وش أرد؟ Expansion V2

تاريخ التوليد: ${generatedAt}. تاريخ التسليم: 17 نوفمبر 2026، الرياض.

اكتملت مكتبة المحتوى والميزات البرمجية وفحوص النسخة المحلية. لم ننشر الموقع العام. تبقى معاينة staging على الاستضافة المقصودة وإذن النشر الصريح قبل اكتمال إجراءات الإطلاق. هذا الملف يولّد من البيانات وتقارير الاختبارات؛ لا يعلن نجاحًا لمجرد أرقام الواجهة.

## المنتج

واجهة عربية RTL بهوية وردية وخمرية تساعد على اختيار كلام سعودي طبيعي للمواقف الاجتماعية والعاطفية. التقنية بقيت Next.js App Router وReact وTypeScript strict وCSS وVitest، مع Playwright. لا حسابات أو AI API أو قاعدة بيانات أو قراءة محادثات خارجية أو إرسال رسائل آلي.

## المحتوى الفعلي

- المواقف: ${content.situations}، وكل موقف له canonical ID واحد.
- العبارات القابلة للترشيح: ${content.responses}، والفريدة بعد التطبيع: ${content.uniqueTexts}.
- السجلات الكلية: ${content.responseRecords}، منها ${content.retainedOnlyCount} محفوظة للتوافق فقط وخارج عدد الترشيحات.
- النصوص الأساسية الأصلية المحفوظة: ${content.legacyBaseResponses}، ومعرّفات نتائج التشغيل القديمة: ${content.legacyRuntimeIds}.
- كل موقف له ثماني عبارات قابلة للترشيح على الأقل.
- الأطوال: ${JSON.stringify(content.lengths)}.
- لا حالات تشابه عالية غير مراجعة. حالة المصدر القديمة بين رد الشوق ومبادرة الشوق موثقة في CONTENT_PURPOSES.md، والفحص ليس إثباتًا آليًا لجودة المعنى أو اللهجة.

| المعرّف | المسار | المواقف |
| --- | --- | ---: |
${routeRows}

## البنية

content/manifest.ts هو عقد المواقف. content/routes يحتوي دفعات النصوص المكتوبة يدويًا ودوالًا تضيف metadata فقط. content/legacy يحفظ المصدر والمعرّفات والنصوص والإضافات. content/context.ts يربط أسئلة المواقف بالردود ويحتفظ بالاعتذارين القديمين غير المرشحين.

lib/recommendation منفصل عن الواجهة، وlib/search للتطبيع والمرادفات والأوزان، وlib/storage وlib/migration للتفضيلات والمفضلة والترحيل. scripts/validate-content.ts يولد التقارير والتقدم من الملفات الفعلية. الاختبارات مقسمة إلى المصدر القديم وV2 والتخصيص والمتصفح.

## مراحل العلاقة

${stageRows}

المراحل تغير أهلية الردود. لا تستخدم المرحلة لاستنتاج مشاعر الطرف الآخر. خريطة serious القديمة تبقى legacy_serious إذا كانت هناك إعدادات قديمة بحاجة لترحيل، ولا نختار خطوبة أو زواجًا نيابة عن المستخدم. المصدر القديم لم يكن يحفظ المرحلة أصلًا.

## النبرات

| المعرّف | الاسم | عدد الأوصاف المستخدمة |
| --- | --- | ---: |
${toneRows}

قد تحمل العبارة أكثر من نبرة؛ مجموع عمود النبرات لا يساوي عدد العبارات. لا تعرض الواجهة نبرة بلا محتوى مؤهل للموقف والمرحلة. الجرأة حد أعلى للنتائج، وتقليل المبالغة يستبعد الدرجة الثالثة. نخفي التحكم بالجرأة في المواقف الحساسة وحين لا يوجد اختلاف فعلي في درجات المحتوى.

## الترشيح والسياق والبحث

1. تحديد الموقف والتحقق من أهلية المرحلة وحساسية المحتوى.
2. استبعاد النصين القديمين الموسومين legacy-retained-only من الترشيح، مع إبقائهما للمفضلة.
3. تطبيق سؤال السياق إن اختير؛ تعطى العبارة الخاصة بالسبب أولوية على العبارة العامة.
4. فلترة النبرة والحد الأعلى للجرأة والطول.
5. عند الحاجة يوسع الطول ثم يختار نبرة مناسبة مع تفسير البديل، دون رفع الجرأة أو تجاوز المرحلة.
6. إزالة التكرار وترتيب التقييمات المحلية بعد ثلاث عبارات مقيمة.

أسئلة السياق موجودة للصورة والزعل وفتح السالفة والاعتذار؛ لا يُضاف سؤال لاستدراج تواصل بعد طلب المساحة. حد الواجهة سؤالان إضافيان. لا نحفظ اختيار السياق أو النص الحر بين الزيارات.

البحث يطبع الألف والياء والتاء المربوطة والتشكيل والمسافات، ويستخدم كلمات ومرادفات وأوزانًا. طلب عدم الغزل يختلف عن طلب وقف التواصل؛ وإذا اجتمعا يقدم وقف التواصل. لا يزعم المحرك فهمًا نفسيًا للمشاعر.

## المفضلة والترحيل

المصدر الفعلي القديم wesh-ard:favorites:v1. المفتاح الجديد wesh-ard:v2:favorites بحاوية schemaVersion: 2. تقرأ أداة الترحيل أيضًا المفاتيح التاريخية المحتملة المذكورة في المواصفات، دون الادعاء أنها كانت مستخدمة فعلًا.

النقل يدمج ويزيل التكرار ويكتب ثم يتحقق بالقراءة. لا يحذف المصدر. migratedLegacy تجعل V2 مرجعًا بعد النجاح حتى لا تعود العبارات المحذوفة. النصوص غير المطابقة تحفظ كنصوص قديمة قابلة للنسخ والحذف. فشل القراءة أو الكتابة أو إصدار مستقبلي لا يُعلن نجاحًا ولا يُكتب فوق المصدر التالف. التفاصيل وحدود الحجم في MIGRATION.md.

## ملف الكلام والتقييمات

التفضيلات في wesh-ard:v2:profile بعد ضغط حفظ صريح: النبرة والطول والجرأة وتقليل المبالغة وخيار حفظ التقييمات. التقييمات في الجلسة افتراضيًا، وفي wesh-ard:v2:feedback فقط عند اختيار حفظها. تتكون من معرّف العبارة وقيمة liked أو disliked، بلا نص خاص. إلغاء الحفظ مع الضغط على الزر يزيل النسخة المحلية إن سمح المتصفح.

أزرار أعجبتني ومو أسلوبي تغير التقييم ويمكن التراجع عنها. البدائل تأتي من النتائج المؤهلة نفسها، وتستبدل البطاقة فعلًا. زر عرض كل العبارات المناسبة يفتح بقية النتائج دون تغيير الحدود. لا تزامن بين الأجهزة أو عناوين الاستضافة.

## نتائج الاختبارات

- اختبارات الوحدة والترحيل والمحتوى: ${units} ناجحة.
- Playwright: ${e2e.stats.expected} ناجحة، ${e2e.stats.unexpected} إخفاقات، ${e2e.stats.flaky} اختبارات متذبذبة، ${e2e.stats.skipped} متجاوزة.
- فحص الأنواع: ناجح، الدليل reports/final/typecheck.log.
- البناء الثابت: ناجح، الدليل reports/final/build.log.
- validate:content وvalidate:release: ناجحان، والتقارير في reports/.
- جميع المسارات اختُبرت على الكمبيوتر والجوال، والنسخ الفعلي للحافظة والحفظ والتحديث والإزالة والمصدر القديم ومنع التخزين والبحث والسياق والتفضيلات والتقييمات والبدائل والصفحات ولوحة المفاتيح وRTL.
- راجعت لقطات الجوال بصريًا؛ الاختبارات تفحص عدم التمرير الأفقي في الحالات المعروضة. ليست هذه شهادة تغطية كل جهاز أو كل تركيب محتوى ممكن.

أدلة الفحص محفوظة في reports/final، ولقطات الواجهة في reports/preview-mobile.png وpreview-desktop.png.

## التشغيل وإضافة المحتوى

Node.js 20.19 أو أحدث. نفذ npm ci ثم npm run dev وافتح localhost:3000. أو npm run build ثم npm run start لمعاينة التصدير الثابت. README يحتوي أوامر البيئة الحالية واختبارات المتصفح.

لإضافة محتوى: اتخذ قرارًا واضحًا بشأن manifest والعدد، واكتب نصوصًا فريدة فعلًا، وحدد المراحل والنبرات والجرأة والطول، ثم شغّل typecheck وtest وvalidate:release وbuild وtest:e2e. لا تعدل نصًا محفوظًا بمعرّف منشور إلى معنى جديد؛ استخدم معرّفًا جديدًا وخطة توافق. aliases وrelatedRoutes لا تزيد الأعداد.

## النشر والتراجع

المعاينة تمت محليًا على out/ بالبناء الإنتاجي. لم نتصل بحساب الاستضافة لنشره ولم نغير نطاقًا. قبل النشر العام يلزم اختبار staging بالعنوان المقصود ومساره، لأن localStorage مرتبط بالعنوان والمتصفح. يلزم إذن صريح قبل النشر.

GitHub Pages يختبر الأنواع والوحدة والمحتوى الكامل والمتصفح قبل بناء نسخة Pages بالـbasePath الخاص بها. دفع main أو workflow_dispatch قد ينشر وفق إعدادات المستودع؛ لم ندفع أي فرع في هذه الجلسة.

نقطة المصدر الأصلي ad5e02a. الوسوم phase-1-verified وbatch-2-1-verified وbatch-2-2-verified تحفظ المراحل السابقة. وسم v2-local-verified يحفظ النسخة النهائية المختبرة محليًا.

للتراجع راجع نسخة مستقلة أو فرعًا من الوسم المطلوب، ولا تمسح بيانات المتصفح. V1 يقرأ المفتاح القديم فقط، لذلك لن يرى ما حفظ حصريًا في V2؛ ليس الرجوع ترحيلًا عكسيًا. احتفظ بنسخة بيانات قبل أي تغيير استضافة. لا تُعاد كتابة مفاتيح المصدر تلقائيًا.

## ما لم ينفذ

- لا نشر عام أو اختبار staging على استضافة خارجية؛ النسخة المحلية جاهزة لهذه الخطوة.
- لا تصدير واستيراد مفضلة؛ كان اختياريًا في المواصفات.
- لا تجربة مستخدمين أو مراجعة إقليمية مستقلة. المقترحات الإضافية في PROPOSALS_NOT_IMPLEMENTED.md باقية للمناقشة ولم تنفذ كميزات خارج المتطلبات.

## سجل المواقف

| المعرّف | المسار | العنوان |
| --- | --- | --- |
${manifestRows}
`;
writeFileSync("docs/FINAL_HANDOFF.md", text);
writeFileSync("reports/final/verification-summary.json", JSON.stringify({ generatedAt, version: "2.0.0", content: { valid: content.valid, situations: content.situations, responses: content.responses, responseRecords: content.responseRecords, retainedOnlyCount: content.retainedOnlyCount, routes: content.routes }, unitTestsPassed: units, e2e: e2e.stats, publicDeploymentPerformed: false, stagingOnTargetHostPerformed: false }, null, 2) + "\n");
for (const name of ["content-validation.json","release-validation.json","content-validation.md","release-validation.md"]) copyFileSync(`reports/${name}`, `reports/final/${name}`);
console.log(JSON.stringify({ handoff: "docs/FINAL_HANDOFF.md", situations: content.situations, responses: content.responses, unitTests: units, browserTests: e2e.stats.expected }));
