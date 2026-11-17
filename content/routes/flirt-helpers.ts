import { ALL_STAGES, CLOSE_STAGES, COMMITTED_STAGES, type ToneId, type SituationContent } from "../schemas";
import { response, scene } from "./helpers";
export function compliments(id: string, advice: string, avoid: string[], entries: [text: string, tone: ToneId, intensity?: 1 | 2 | 3][]): SituationContent {
 return scene(id, advice, avoid, entries.map(([text,tone,intensity]) => response(text,[tone], tone === "romantic" ? COMMITTED_STAGES : tone === "casual" ? ALL_STAGES : CLOSE_STAGES, intensity ?? (tone === "casual" ? 1 : 2))));
}
