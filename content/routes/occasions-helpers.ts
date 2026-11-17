import { ALL_STAGES, type StageId } from "../schemas";
import { response, scene } from "./helpers";
export function occasion(id: string, advice: string, avoid: string[], texts: string[], stages: StageId[] = ALL_STAGES) {
 return scene(id,advice,avoid,texts.map(text => response(text,["casual","mature"],stages)));
}
