import { response, scene } from "./helpers";
export function repair(id: string, advice: string, avoid: string[], texts: string[]) {
 return scene(id, advice, avoid, texts.map(text => response(text,["mature","clear"])), "careful");
}
