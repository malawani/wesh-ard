import { test, expect } from "@playwright/test";

test("choose, customize, copy, favorite, reload, remove, and preserve old source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    if (!localStorage.getItem("fixture-seeded")) {
      localStorage.setItem("wesh-ard:favorites:v1", JSON.stringify([{ id: "unknown-old", text: "كلامي المحفوظ من قبل" }]));
      localStorage.setItem("fixture-seeded", "true");
    }
  });
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
  await expect(page.getByText(/تعذّر تأكيد حفظ المفضلة/)).toBeVisible();
  await page.getByRole("button", { name: "قالت: اشتقت لك", exact: true }).click();
  await page.getByRole("button", { name: "عرض العبارات", exact: true }).click();
  await page.locator(".response-card").first().getByRole("button", { name: "حفظ في المفضلة", exact: true }).click();
  await expect(page.getByText(/تغيّر المفضلة لهذه الجلسة فقط/)).toBeVisible();
  await page.getByRole("button", { name: /^المفضلة/ }).click();
  await expect(page.locator(".response-card")).toHaveCount(1);
});
