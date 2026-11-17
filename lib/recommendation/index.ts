import { CONTENT_BY_ID } from "../../content";
import { SENSITIVE_TONES, type StageId, type ToneId, type Intensity, type MessageLength, type ResponseContent } from "../../content/schemas";
import { normalizeArabic } from "../engine";

export interface RecommendationInput {
  situationId: string; relationshipStage: StageId; preferredTone: ToneId | "all";
  intensity: Intensity; length: MessageLength | "all"; optionalContext?: string;
  feedback?: Record<string, "liked" | "disliked">;
  reduceExaggeration?: boolean;
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
  return situation.replies.filter(r => !r.tags.includes("legacy-retained-only") && r.allowedStages.includes(stage) &&
    (situation.sensitivity === "normal" || r.tones.some(t => SENSITIVE_TONES.includes(t))));
}
export function availableTones(situationId: string, stage: StageId): ToneId[] {
  const s = CONTENT_BY_ID.get(situationId);
  return [...new Set(eligibleResponses(situationId, stage).flatMap(r => r.tones))]
    .filter(t => s?.sensitivity === "normal" || SENSITIVE_TONES.includes(t));
}
export function recommend(input: RecommendationInput) {
  const selectedSituation = CONTENT_BY_ID.get(input.situationId) ?? null;
  const validContexts = selectedSituation?.contextQuestions?.flatMap(q => q.choices.map(c => `${q.id}:${c.value}`)) ?? [];
  const context = input.optionalContext && validContexts.includes(input.optionalContext) ? input.optionalContext : null;
  const maxIntensity = input.reduceExaggeration ? Math.min(input.intensity, 2) : input.intensity;
  const stageCandidates = eligibleResponses(input.situationId, input.relationshipStage)
    .filter(r => r.intensity <= maxIntensity)
    .filter(r => !context || !r.tags.some(t => t.startsWith("context:")) || r.tags.includes(`context:${context}`));
  const targeted = context ? stageCandidates.filter(r => r.tags.includes(`context:${context}`)) : [];
  const candidates = targeted.length ? targeted : stageCandidates;
  const matchTone = (r: ResponseContent, tones: ToneId[] | "all") => tones === "all" || r.tones.some(t => tones.includes(t));
  let tone: ToneId[] | "all" = input.preferredTone === "all" ? "all" : [input.preferredTone];
  let length = input.length;
  let suggestions = candidates.filter(r => matchTone(r, tone) && (length === "all" || r.length === length));
  let fallbackReason: string | undefined = context && !targeted.length ? "لا تتوفر عبارة مخصصة لهذا التفصيل ضمن حدود المرحلة والجرأة؛ عرضنا عبارات عامة مناسبة للموقف." : undefined;
  if (!suggestions.length && length !== "all") {
    length = "all";
    suggestions = candidates.filter(r => matchTone(r, tone));
    fallbackReason = "عرضنا أطوالًا أخرى لعدم توفر عبارة مناسبة بالطول المختار.";
  }
  if (!suggestions.length && input.preferredTone !== "all") {
    const unsuitableTone = selectedSituation !== null && selectedSituation.sensitivity !== "normal" && !SENSITIVE_TONES.includes(input.preferredTone);
    const alternatives = unsuitableTone ? SENSITIVE_TONES : neighbors[input.preferredTone];
    tone = alternatives.filter(t => availableTones(input.situationId, input.relationshipStage).includes(t));
    suggestions = candidates.filter(r => matchTone(r, tone));
    fallbackReason = unsuitableTone
      ? "النبرة المختارة لا تناسب هذا الموقف؛ عرضنا نبرات تحترم حدوده ومرحلة العلاقة، وبجرأة لا تتجاوز اختيارك."
      : "استخدمنا نبرة قريبة متاحة لهذا الموقف ومرحلة العلاقة، وبجرأة لا تتجاوز اختيارك.";
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
  const contextScore = (r: ResponseContent) => context && r.tags.includes(`context:${context}`) ? 1 : 0;
  suggestions.sort((a, b) => contextScore(b) - contextScore(a) || score(b) - score(a) || b.intensity - a.intensity);
  return {
    selectedSituation, suggestions,
    appliedFilters: { stage: input.relationshipStage, tones: tone, length, maxIntensity, context },
    advice: selectedSituation?.advice ?? "", avoid: selectedSituation?.avoid ?? [],
    fallbackReason: suggestions.length ? fallbackReason : "لا توجد عبارة مناسبة لهذه الاختيارات. جرّب نبرة أخرى؛ لن نتجاوز حدود المرحلة أو الجرأة."
  };
}
