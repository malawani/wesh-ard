import { test, expect } from "@playwright/test";
import { CONTENT } from "../../content";

test("choose, customize, copy, favorite, reload, remove, and preserve old source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    if (!localStorage.getItem("fixture-seeded")) {
      localStorage.setItem("wesh-ard:favorites:v1", JSON.stringify([{ id: "unknown-old", text: "كلامي المحفوظ من قبل" }]));
      localStorage.setItem("fixture-seeded", "true");
    }
  });
  await page.goto("./");
  await page.getByRole("button", { name: "وش أرد؟ وصلتك رسالة وتبي رد يناسبها." }).click();
  await page.getByRole("button", { name: "قالت: اشتقت لك", exact: true }).click();
  await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption("mutual_crush");
  await page.getByText("دلع وحنان", { exact: true }).click();
  await expect(page.getByLabel("دلع وحنان", { exact: true })).toBeChecked();
  await page.getByText("خيارات إضافية", { exact: true }).click();
  await page.getByLabel("درجة الجرأة", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  const first = page.locator(".response-card").first();
  const text = await first.locator(".response-text").innerText();
  await first.getByRole("button", { name: "نسخ العبارة", exact: true }).click();
  await expect(first.getByRole("button", { name: "تم النسخ", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  await first.getByRole("button", { name: "حفظ في المفضلة", exact: true }).click();
  await expect(first.getByRole("button", { name: "إزالة من المفضلة", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.getByText("كلامي المحفوظ من قبل", { exact: true })).toBeVisible();
  await expect(page.getByText("عبارة محفوظة من إصدار سابق", { exact: true })).toBeVisible();
  await page.locator(".response-card").filter({ hasText: text }).getByRole("button", { name: "إزالة من المفضلة", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("wesh-ard:favorites:v1"))).toContain("كلامي المحفوظ من قبل");
});

test("Arabic search, refusal guidance, RTL, no horizontal scroll and keyboard focus", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "وش أرد؟ الرئيسية", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "وش أرد؟ وصلتك رسالة وتبي رد يناسبها." }).click();
  const search = page.getByLabel("ابحث عن موقف أو اكتب الرسالة", { exact: true });
  await search.fill("قالت لي ليش مهتم فيني؟");
  await expect(page.locator(".situation-card").first()).toHaveText(/ليه تعجبك/);
  await search.fill("قالت لا تتواصل معي، اشتقت لك بس");
  await expect(page.getByText("احترم طلب التوقف عن التواصل.", { exact: true })).toBeVisible();
  await expect(page.locator(".situation-card")).toHaveCount(0);
  await page.getByRole("button", { name: "عرض إرشاد طلب المساحة", exact: true }).click();
  await expect(page.getByText("لا ترسل رسائل متكررة بعد طلب التوقف.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("blocked storage shows warning and keeps favorites usable for this session", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("blocked", "QuotaExceededError"); };
  });
  await page.goto("./");
  await expect(page.getByText(/تعذّر تأكيد حفظ المفضلة/)).toBeVisible();
  await page.getByRole("button", { name: "قالت: اشتقت لك", exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await page.locator(".response-card").first().getByRole("button", { name: "حفظ في المفضلة", exact: true }).click();
  await expect(page.getByText(/تغيّر المفضلة لهذه الجلسة فقط/)).toBeVisible();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.locator(".response-card")).toHaveCount(1);
});

test("new situation applies distinct married and first-contact replies", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.getByRole("button", { name: "وش أرد؟ وصلتك رسالة وتبي رد يناسبها." }).click();
  await page.getByRole("button", { name: "قالت: وش أنا بالنسبة لك؟", exact: true }).click();
  await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption("married");
  await page.getByText("كل النبرات المناسبة", { exact: true }).click();
  await page.getByText("خيارات إضافية", { exact: true }).click();
  await page.getByLabel("درجة الجرأة", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await expect(page.locator(".response-text").filter({ hasText: "أنتِ زوجتي وشريكتي" })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `reports/preview-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "تعديل الاختيارات", exact: true }).click();
  await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption("first_contact");
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await expect(page.locator(".response-text").filter({ hasText: /زوجتي|خطيبتي|حبيبتي/ })).toHaveCount(0);
});

test("flirting refusal remains distinct from invitation and can be saved", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "وش أرد؟ وصلتك رسالة وتبي رد يناسبها." }).click();
  const search = page.getByLabel("ابحث عن موقف أو اكتب الرسالة", { exact: true });
  await search.fill("قالت لا تغازلني");
  await expect(page.locator(".situation-card")).toHaveCount(1);
  await page.getByRole("button", { name: "قالت: لا تغازلني", exact: true }).click();
  await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption("married");
  await expect(page.getByLabel("رومانسي", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("درجة الجرأة", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/توقف عن الغزل فورًا/)).toBeVisible();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  const card = page.locator(".response-card").filter({ hasText: "حاضر، بوقف الغزل." });
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: "حفظ في المفضلة", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.getByText("حاضر، بوقف الغزل.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "وش أرد؟ الرئيسية", exact: true }).click();
  await page.getByRole("button", { name: "وش أرد؟ وصلتك رسالة وتبي رد يناسبها." }).click();
  await search.fill("غازلني");
  await expect(page.locator(".situation-card").first()).toHaveText("قالت: غازلني");
  await page.getByRole("button", { name: "قالت: غازلني", exact: true }).click();
  await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption("mutual_crush");
  await page.getByText("شاعري وفخم", { exact: true }).click();
  await page.getByText("خيارات إضافية", { exact: true }).click();
  await page.getByLabel("درجة الجرأة", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await expect(page.getByText("في حضورك هدوء يشبه أول نسمة بعد يوم طويل.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("new opening route and situation-specific apology work", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "كيف أفتح سالفة؟", exact: true }).click();
  await page.getByRole("button", { name: "سؤال عن كتاب", exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await expect(page.locator(".response-card")).toHaveCount(3);
  const old = await page.locator(".response-text").first().innerText();
  await page.locator(".response-card").first().getByRole("button", { name: "رؤية بديل مناسب", exact: true }).click();
  expect(await page.locator(".response-text").first().innerText()).not.toBe(old);
  await page.getByRole("button", { name: "عرض كل العبارات المناسبة", exact: true }).click();
  await expect(page.locator(".response-card")).toHaveCount(8);
  await page.getByRole("button", { name: "وش أرد؟ الرئيسية", exact: true }).click();
  await page.getByRole("button", { name: "أبي أعتذر", exact: true }).click();
  await page.getByLabel("عن وش تبي تعتذر؟", { exact: true }).selectOption("apology-reason:cancel");
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await expect(page.locator(".response-text").first()).toContainText("ألغيت الموعد");
});

test("profile and opted-in ratings survive reload without storing searches", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "ملفي في الكلام", exact: true }).click();
  await page.getByLabel("النبرة المفضلة", { exact: true }).selectOption("all");
  await page.getByLabel("الطول المفضل", { exact: true }).selectOption("short");
  await page.getByLabel("حفظ تقييماتي في هذا المتصفح", { exact: true }).check();
  await page.getByRole("button", { name: "حفظ تفضيلاتي", exact: true }).click();
  await page.getByRole("button", { name: "وش أرد؟ الرئيسية", exact: true }).click();
  await page.getByRole("button", { name: "كيف أفتح سالفة؟", exact: true }).click();
  await page.getByRole("button", { name: "سؤال عن كتاب", exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  const first = page.locator(".response-card").first();
  await first.getByRole("button", { name: "مو أسلوبي", exact: true }).click();
  await expect(first.getByRole("button", { name: "مو أسلوبي", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wesh-ard:v2:feedback") ?? "{}").ratings)).toBeTruthy();
  await page.getByLabel("موقف أو كلمة من الرسالة", { exact: true }).fill("نص بحث خاص لا يحفظ");
  expect(await page.evaluate(() => Object.values(localStorage).join(" "))).not.toContain("نص بحث خاص لا يحفظ");
  await page.getByRole("button", { name: "ملفي في الكلام", exact: true }).click();
  await expect(page.getByLabel("الطول المفضل", { exact: true })).toHaveValue("short");
  await page.getByLabel("حفظ تقييماتي في هذا المتصفح", { exact: true }).uncheck();
  await page.getByRole("button", { name: "حفظ تفضيلاتي", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("wesh-ard:v2:feedback"))).toBeNull();
});

test("all twelve paths expose their complete situations and usable results", async ({ page }) => {
  const { CONTENT } = await import("../../content");
  const { ROUTES } = await import("../../content/schemas");
  for (const [route, label] of Object.entries(ROUTES)) {
    await page.goto("./");
    if (["reply", "send", "guide"].includes(route)) await page.locator(`.route-${route}`).click();
    else await page.getByRole("button", { name: label, exact: true }).click();
    const situations = CONTENT.filter(s => s.canonicalRoute === route);
    await expect(page.locator(".situation-card")).toHaveCount(situations.length);
    const first = situations[0];
    await page.getByRole("button", { name: first.title, exact: true }).click();
    const stage = first.replies.find(r => !r.tags.includes("legacy-retained-only"))!.allowedStages[0];
    await page.getByLabel("مرحلة العلاقة", { exact: true }).selectOption(stage);
    await page.getByText("كل النبرات المناسبة", { exact: true }).click();
    await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
    expect(await page.locator(".response-card").count()).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("about, privacy and missing pages return the intended content", async ({ page }) => {
  await page.goto("./about/");
  await expect(page.getByRole("heading", { name: "عن «وش أرد؟»", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "الخصوصية", exact: true }).click();
  await expect(page.getByRole("heading", { name: "سياسة الخصوصية", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تفضيلات الأسلوب والتقييمات", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "العودة للرئيسية", exact: true }).click();
  await expect(page.getByRole("heading", { name: /لكل موقف/ })).toBeVisible();
  await page.goto("./404.html");
  await expect(page.getByRole("heading")).toBeVisible();
});

test("phrase explanation opens with keyboard and copy includes only the phrase", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./");
  await page.getByRole("button", { name: "قالت: اشتقت لك", exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  const card = page.locator(".response-card").first();
  const summary = card.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(card.locator("details")).toHaveAttribute("open", "");
  for (const heading of ["المعنى المباشر","المعنى الضمني المحتمل","الأثر النفسي المحتمل","حدود التفسير"]) await expect(card.locator("dt").filter({ hasText: heading })).toBeVisible();
  const phrase = await card.locator(".response-text").innerText();
  await card.getByRole("button", { name: "نسخ العبارة", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(phrase);
  await card.getByRole("button", { name: "حفظ في المفضلة", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  const saved = page.locator(".response-card").filter({ hasText: phrase });
  await saved.locator("summary").click();
  await expect(saved.locator("dd").first()).toContainText("افتقد حديثها");
  await saved.locator("summary").focus();
  await saved.locator("summary").press("Enter");
  await expect(saved.locator("details")).not.toHaveAttribute("open", "");
});

test("old saved wording and pending phrases never receive a mismatched or invented explanation", async ({ page }) => {
  const previous = "وأنا اشتقت لك وودي أشوفك قريب.";
  await page.addInitScript(text => {
    localStorage.setItem("wesh-ard:v2:favorites", JSON.stringify({ schemaVersion: 2, migratedLegacy: true, items: [{ id: "miss:direct:0", text }] }));
  }, previous);
  await page.goto("./");
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.getByText(previous, { exact: true })).toBeVisible();
  await page.locator(".response-card summary").click();
  await expect(page.getByText("لا يتوفر شرح لهذه النسخة المحفوظة من العبارة. احتفظنا بنصها كما حفظته.", { exact: true })).toBeVisible();
  await expect(page.locator(".response-card dd")).toHaveCount(0);
  await page.getByRole("button", { name: "وش أرد؟ الرئيسية", exact: true }).click();
  const pendingSituation = CONTENT.find(s => s.replies.every(r => !r.analysis));
  if (!pendingSituation) return;
  await page.locator(`.route-${pendingSituation.canonicalRoute}`).click();
  await page.getByRole("button", { name: pendingSituation.title, exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  const pendingCard = page.locator(".response-card").first();
  await pendingCard.locator("summary").click();
  await expect(pendingCard.getByText("لم يُضف شرح لهذه العبارة بعد.", { exact: true })).toBeVisible();
});
