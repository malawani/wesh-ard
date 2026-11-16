import { CATALOG } from "./legacy/catalog-v1";
import { getSuggestions } from "./legacy/engine-v1";
import { ADDITIONS } from "./legacy/additions";
import { REPLY_BATCH_1 } from "./routes/reply-011-020";
import { ALL_STAGES, CLOSE_STAGES, COMMITTED_STAGES, messageLength, type ResponseContent, type SituationContent, type StageId, type ToneId } from "./schemas";

const BOUNDARIES = new Set(["space", "reject", "bounds", "again"]);
const stageMap: Record<string, StageId[]> = {
  early: ["getting_to_know", "friendship_possible", "one_sided"], mutual: ["mutual_crush"],
  love: ["love"], serious: ["engaged", "married"]
};
function legacyStages(text: string, tone: string, sensitive: boolean): StageId[] {
  if (/أحبك|احبك|حبنا|علاقتنا|نبنيه مع بعض/.test(text)) return COMMITTED_STAGES;
  if (!sensitive && tone === "sweet") return CLOSE_STAGES;
  if (/أحب |ودي أسمع|ودي أشوف|اشتقت|مشتاق|جاذبية|إعجابي|حضورك|أفتقد/.test(text)) return CLOSE_STAGES;
  return ALL_STAGES;
}
const LEGACY_CONTENT: SituationContent[] = CATALOG.map(old => {
  const all = new Map<string, ResponseContent>();
  for (const stage of ["early", "mutual", "love", "serious"] as const) {
    for (const response of getSuggestions(old, stage, "all")) {
      const variant = response.id.split(":").length === 4;
      const tones: ToneId[] = old.sensitive
        ? [response.tone === "direct" ? "clear" : response.tone === "sweet" ? "supportive" : "casual"]
        : [response.tone === "soft" ? "casual" : response.tone === "sweet" ? "tender" : "clear"];
      const allowed = legacyStages(response.text, response.tone, old.sensitive);
      const allowedStages = variant ? stageMap[stage].filter(s => !/أحبك|احبك|حبنا|علاقتنا/.test(response.text) || COMMITTED_STAGES.includes(s)) : allowed;
      all.set(response.id, {
        id: response.id, legacyId: response.id, text: response.text, tones,
        allowedStages, intensity: !old.sensitive && response.tone === "sweet" ? 2 : 1,
        length: messageLength(response.text), dialect: "sa", tags: [variant ? "legacy-variant" : "legacy"]
      });
    }
  }
  // Preserve all six original responses even when every old stage had an override.
  for (const tone of ["soft", "sweet", "direct"] as const) {
    old.responses[tone].forEach((text, i) => {
      const id = `${old.id}:${tone}:${i}`;
      if (!all.has(id)) all.set(id, {
        id, legacyId: id, text, tones: [old.sensitive ? tone === "direct" ? "clear" : "supportive" : tone === "sweet" ? "tender" : tone === "direct" ? "clear" : "casual"],
        allowedStages: legacyStages(text, tone, old.sensitive), intensity: !old.sensitive && tone === "sweet" ? 2 : 1,
        length: messageLength(text), dialect: "sa", tags: ["legacy"]
      });
    });
  }
  const additions: ResponseContent[] = ADDITIONS[old.id].map((entry, i) => ({
    id: `${old.id}:v2:${i + 1}`, text: entry.text, tones: entry.tones,
    allowedStages: entry.stages ?? (entry.intensity && entry.intensity > 1 ? CLOSE_STAGES : ALL_STAGES),
    intensity: entry.intensity ?? 1, length: messageLength(entry.text), dialect: "sa", tags: ["v2"]
  }));
  return {
    id: old.id, canonicalRoute: old.route, title: old.title,
    description: old.tip, intent: old.route === "reply" ? "الرد على رسالة واردة" : old.route === "send" ? "إنشاء رسالة مبادرة" : "اختيار تصرف وجملة مناسبة",
    trigger: old.title, keywords: old.keywords, advice: old.tip, avoid: [old.avoid],
    actions: old.route === "guide" ? [old.tip, "اختر عبارة تعبّر عن موقفك الحقيقي، أو اكتفِ بالتصرف دون إرسال رسالة."] : [],
    sensitivity: BOUNDARIES.has(old.id) ? "boundary_sensitive" : old.sensitive ? "careful" : "normal",
    replies: [...all.values(), ...additions]
  };
});
export const CONTENT: SituationContent[] = [...LEGACY_CONTENT, ...REPLY_BATCH_1];
export const CONTENT_BY_ID = new Map(CONTENT.map(s => [s.id, s]));
