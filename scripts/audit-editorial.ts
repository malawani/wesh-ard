import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { CONTENT } from "../content";
const path = "content/editorial/baseline.json";
const records = CONTENT.flatMap(s => s.replies.map(r => ({ ...r, situationId: s.id, route: s.canonicalRoute, situationTitle: s.title, sensitivity: s.sensitivity })));
if (!existsSync(path)) {
 mkdirSync("content/editorial", { recursive: true });
 writeFileSync(path, JSON.stringify({ capturedAt: new Date().toISOString(), sourceCommit: "f29b03f", records }, null, 2) + "\n");
}
const routes = Object.fromEntries([...new Set(records.map(r => r.route))].map(route => [route, records.filter(r => r.route === route).length]));
console.log(JSON.stringify({ situations: CONTENT.length, records: records.length, recommendable: records.filter(r => !r.tags.includes("legacy-retained-only")).length, routes }, null, 2));
