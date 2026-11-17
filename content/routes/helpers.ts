import { MANIFEST } from "../manifest";
import { ALL_STAGES, messageLength, type SituationContent, type ResponseContent, type StageId, type ToneId, type Intensity } from "../schemas";
export type DraftResponse = { text: string; tones: ToneId[]; stages?: StageId[]; intensity?: Intensity };
export function response(text: string, tones: ToneId[], stages: StageId[] = ALL_STAGES, intensity: Intensity = 1): DraftResponse {
  return { text, tones, stages, intensity };
}
export function scene(id: string, advice: string, avoid: string[], replies: DraftResponse[], sensitivity: SituationContent["sensitivity"] = "normal"): SituationContent {
  const entry = MANIFEST.find(m => m.id === id);
  if (!entry) throw new Error(`Unknown manifest entry: ${id}`);
  return {
    ...entry, description: advice, intent: entry.canonicalRoute === "reply" ? "اختيار رد على رسالة واردة" : entry.canonicalRoute === "guide" ? "اختيار تصرف وجملة مناسبة" : `صياغة مبادرة مناسبة: ${entry.title}`, trigger: entry.title,
    keywords: entry.title.split(/\s+/).filter(t => !["قالت:", "لي", "وش"].includes(t)),
    advice, actions: [], avoid, sensitivity,
    replies: replies.map((r, i): ResponseContent => ({
      id: `${id}:r${String(i + 1).padStart(3, "0")}`, text: r.text, tones: r.tones,
      allowedStages: r.stages ?? ALL_STAGES, intensity: r.intensity ?? 1,
      length: messageLength(r.text), dialect: "sa", tags: ["v2", id]
    }))
  };
}
export function guide(id: string, advice: string, actions: string[], avoid: string[], replies: DraftResponse[], sensitivity: SituationContent["sensitivity"] = "careful"): SituationContent {
  return { ...scene(id, advice, avoid, replies, sensitivity), actions };
}
