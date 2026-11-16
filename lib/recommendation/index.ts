import { CONTENT_BY_ID } from "../../content";
import { SENSITIVE_TONES, type StageId, type ToneId, type Intensity, type MessageLength, type ResponseContent } from "../../content/schemas";
import { normalizeArabic } from "../engine";

export interface RecommendationInput {
  situationId: string; relationshipStage: StageId; preferredTone: ToneId | "all";
  intensity: Intensity; length: MessageLength | "all"; optionalContext?: string;
  feedback?: Record<string, "liked" | "disliked">;
}
const neighbors: Record<ToneId, ToneId[]> = {
  casual: ["mature", "clear"], romantic: ["tender", "deep"], tender: ["romantic", "supportive"],
  confident: ["clear", "mature"], bold_respectful: ["confident", "romantic"], deep: ["mature", "romantic"],
  poetic: ["romantic", "deep"], playful: ["casual"], mature: ["clear", "supportive"],
  supportive: ["mature", "casual"], clear: ["mature", "casual"], subtle: ["casual", "tender"]
};
export function eligibleResponses(situationId: string, stage: StageId): ResponseContent[] {
  const situation = CONTENT_BY_ID.get(situationId);
  if (!situation) return [];
  return situation.replies.filter(r => r.allowedStages.includes(stage) &&
    (situation.sensitivity === "normal" || r.tones.some(t => SENSITIVE_TONES.includes(t))));
}
export function availableTones(situationId: string, stage: StageId): ToneId[] {
  const s = CONTENT_BY_ID.get(situationId);
  return [...new Set(eligibleResponses(situationId, stage).flatMap(r => r.tones))]
    .filter(t => s?.sensitivity === "normal" || SENSITIVE_TONES.includes(t));
}
export function recommend(input: RecommendationInput) {
  const selectedSituation = CONTENT_BY_ID.get(input.situationId) ?? null;
  const candidates = eligibleResponses(input.situationId, input.relationshipStage)
    .filter(r => r.intensity <= input.intensity);
  const matchTone = (r: ResponseContent, tones: ToneId[] | "all") => tones === "all" || r.tones.some(t => tones.includes(t));
  let tone: ToneId[] | "all" = input.preferredTone === "all" ? "all" : [input.preferredTone];
  let length = input.length;
  let suggestions = candidates.filter(r => matchTone(r, tone) && (length === "all" || r.length === length));
  let fallbackReason: string | undefined;
  if (!suggestions.length && length !== "all") {
    length = "all";
    suggestions = candidates.filter(r => matchTone(r, tone));
    fallbackReason = "عرضنا أطوالًا أخرى لعدم توفر عبارة مناسبة بالطول المختار.";
  }
  if (!suggestions.length && input.preferredTone !== "all") {
    tone = neighbors[input.preferredTone].filter(t => availableTones(input.situationId, input.relationshipStage).includes(t));
    suggestions = candidates.filter(r => matchTone(r, tone));
    fallbackReason = "استخدمنا نبرة قريبة متاحة لهذا الموقف ومرحلة العلاقة، وبجرأة لا تتجاوز اختيارك.";
  }
  const seen = new Set<string>();
  suggestions = suggestions.filter(r => {
    const text = normalizeArabic(r.text);
    if (seen.has(text)) return false;
    seen.add(text); return true;
  });
  // Three explicit ratings are required before feedback changes future ordering.
  const feedback = Object.keys(input.feedback ?? {}).length >= 3 ? input.feedback : undefined;
  const score = (r: ResponseContent) => feedback?.[r.id] === "liked" ? 2 : feedback?.[r.id] === "disliked" ? -2 : 0;
  suggestions.sort((a, b) => score(b) - score(a) || b.intensity - a.intensity);
  return {
    selectedSituation, suggestions,
    appliedFilters: { stage: input.relationshipStage, tones: tone, length, maxIntensity: input.intensity },
    advice: selectedSituation?.advice ?? "", avoid: selectedSituation?.avoid ?? [],
    fallbackReason: suggestions.length ? fallbackReason : "لا توجد عبارة مناسبة لهذه الاختيارات. جرّب نبرة أخرى؛ لن نتجاوز حدود المرحلة أو الجرأة."
  };
}
