import { ALL_STAGES, type StageId, type ToneId } from "../schemas";
import { response, scene } from "./helpers";
export function snippets(id: string, advice: string, avoid: string[], texts: string[], stages: StageId[] = ALL_STAGES, tones: ToneId[] = ["casual"]) {
 return scene(id,advice,avoid,texts.map(text => response(text,tones,stages,tones.includes("romantic") || tones.includes("tender") ? 2 : 1)));
}
