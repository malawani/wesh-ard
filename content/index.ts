import { withContext } from "./context";
import { FLIRT_BATCH_1 } from "./routes/flirt-001-010";
import { CONTINUE_BATCH_3 } from "./routes/continue-021-025";
import { CONTINUE_BATCH_2 } from "./routes/continue-011-020";
import { CONTINUE_BATCH_1 } from "./routes/continue-001-010";
import { OPEN_BATCH_3 } from "./routes/open-021-025";
import { OPEN_BATCH_2 } from "./routes/open-011-020";
import { OPEN_BATCH_1 } from "./routes/open-001-010";
import { GUIDE_BATCH_3 } from "./routes/guide-031-040";
import { GUIDE_BATCH_2 } from "./routes/guide-021-030";
import { GUIDE_BATCH_1 } from "./routes/guide-011-020";
import { SEND_BATCH_4 } from "./routes/send-041-042";
import { SEND_BATCH_3 } from "./routes/send-031-040";
import { SEND_BATCH_2 } from "./routes/send-021-030";
import { SEND_BATCH_1 } from "./routes/send-011-020";
import { CATALOG } from "./legacy/catalog-v1";
import { getSuggestions } from "./legacy/engine-v1";
import { ADDITIONS } from "./legacy/additions";
import { REPLY_BATCH_1 } from "./routes/reply-011-020";
import { REPLY_BATCH_5 } from "./routes/reply-051-055";
import { REPLY_BATCH_4 } from "./routes/reply-041-050";
import { REPLY_BATCH_3 } from "./routes/reply-031-040";
import { REPLY_BATCH_2 } from "./routes/reply-021-030";
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
export const CONTENT: SituationContent[] = [...LEGACY_CONTENT, ...REPLY_BATCH_1, ...REPLY_BATCH_2, ...REPLY_BATCH_3, ...REPLY_BATCH_4, ...REPLY_BATCH_5, ...SEND_BATCH_1, ...SEND_BATCH_2, ...SEND_BATCH_3, ...SEND_BATCH_4, ...GUIDE_BATCH_1, ...GUIDE_BATCH_2, ...GUIDE_BATCH_3, ...OPEN_BATCH_1, ...OPEN_BATCH_2, ...OPEN_BATCH_3, ...CONTINUE_BATCH_1, ...CONTINUE_BATCH_2, ...CONTINUE_BATCH_3, ...FLIRT_BATCH_1].map(withContext);
export const CONTENT_BY_ID = new Map(CONTENT.map(s => [s.id, s]));
