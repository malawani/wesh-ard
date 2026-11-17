import type { PhraseAnalysis, ResponseContent } from "../schemas";
export type ClassificationPatch = Partial<Pick<ResponseContent, "tones" | "allowedStages" | "intensity" | "dialect">>;
export interface EditorialReview {
 id: string; sourceText: string; finalText: string; decision: "keep" | "edit";
 reason?: string; classification?: ClassificationPatch; classificationReason?: string;
 analysis: PhraseAnalysis;
}
export type ExplanationFields = [direct: string, implicit: string, impact: string, limits: string];
function analysis(fields: ExplanationFields): PhraseAnalysis {
 return { directMeaning: fields[0], possibleImplicitMeaning: fields[1], possiblePsychologicalImpact: fields[2], interpretationLimits: fields[3] };
}
export function keep(id: string, text: string, fields: ExplanationFields, classification?: ClassificationPatch, classificationReason?: string): EditorialReview {
 return { id, sourceText: text, finalText: text, decision: "keep", analysis: analysis(fields), ...(classification ? { classification, classificationReason } : {}) };
}
export function edit(id: string, sourceText: string, finalText: string, reason: string, fields: ExplanationFields, classification?: ClassificationPatch, classificationReason?: string): EditorialReview {
 return { id, sourceText, finalText, decision: "edit", reason, analysis: analysis(fields), ...(classification ? { classification, classificationReason } : {}) };
}
