import { mkdirSync, writeFileSync } from "node:fs";
import { CATALOG } from "../content/legacy/catalog-v1";
import { getSuggestions } from "../content/legacy/engine-v1";
const responses = CATALOG.flatMap(s => Object.entries(s.responses).flatMap(([tone, texts]) => texts.map((text, i) => ({ id: `${s.id}:${tone}:${i}`, text, situationId: s.id }))));
const variants = new Map(CATALOG.flatMap(s => (["early", "mutual", "love", "serious"] as const).flatMap(stage => getSuggestions(s, stage, "all"))).map(r => [r.id, r]));
const snapshot = { situations: CATALOG.map(s => ({ id: s.id, route: s.route, title: s.title })), responses, runtimeResponses: [...variants.values()], storageKeys: ["wesh-ard:favorites:v1"] };
mkdirSync("reports", { recursive: true });
writeFileSync("content/legacy/baseline.json", JSON.stringify(snapshot, null, 2) + "\n");
console.log(JSON.stringify({ situations: snapshot.situations.length, baseResponses: responses.length, runtimeDistinctIds: variants.size }));
