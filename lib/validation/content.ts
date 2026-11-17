import { CONTENT } from "../../content";
import { MANIFEST } from "../../content/manifest";
import baseline from "../../content/legacy/baseline.json";
import { ALL_STAGES, ROUTES, STAGES, TONES, SENSITIVE_TONES, messageLength, type SituationContent } from "../../content/schemas";
import { normalizeArabic } from "../engine";
import { REVIEWS_BY_ID } from "../../content/editorial";
export const ROUTE_TARGETS = { reply: 55, send: 42, guide: 40, open: 25, continue: 25, flirt: 25, confession: 20, reconcile: 22, care: 20, occasions: 16, meeting: 15, quick: 15 };
export function validateContent(content: SituationContent[] = CONTENT, release = false) {
  const errors: string[] = [], warnings: string[] = [];
  const ids = new Set<string>(), responseIds = new Set<string>(), normalized = new Map<string, string>();
  const toneCounts = Object.fromEntries(Object.keys(TONES).map(t => [t, 0]));
  const routeCounts = Object.fromEntries(Object.keys(ROUTES).map(r => [r, 0]));
  const stageCounts = Object.fromEntries(ALL_STAGES.map(s => [s, 0]));
  const lengthCounts = { short: 0, medium: 0, long: 0 };
  let responseCount = 0, retainedOnlyCount = 0;
  const manifestIds = new Set(MANIFEST.map(m => m.id));
  if (MANIFEST.length !== 320 || manifestIds.size !== 320) errors.push("Manifest must have 320 unique IDs");
  for (const [route, count] of Object.entries(ROUTE_TARGETS)) {
    if (MANIFEST.filter(m => m.canonicalRoute === route).length !== count) errors.push(`Manifest route count: ${route}`);
  }
  for (const s of content) {
    if (ids.has(s.id)) errors.push(`Duplicate situation ID: ${s.id}`);
    ids.add(s.id);
    const entry = MANIFEST.find(m => m.id === s.id);
    if (!entry || entry.canonicalRoute !== s.canonicalRoute) errors.push(`Unknown/wrong route: ${s.id}`);
    if (!Object.hasOwn(ROUTES, s.canonicalRoute)) errors.push(`Unknown route: ${s.id}`);
    else routeCounts[s.canonicalRoute]++;
    for (const value of [s.title, s.description, s.intent, s.trigger, s.advice, ...s.avoid]) {
      if (!value?.trim()) errors.push(`Empty situation field: ${s.id}`);
    }
    if (s.replies.filter(r => !r.tags.includes("legacy-retained-only")).length < 8) errors.push(`Fewer than eight recommendable responses: ${s.id}`);
    if (s.canonicalRoute === "guide" && s.actions.length < 2) errors.push(`Missing behavioral options: ${s.id}`);
    if ((s.contextQuestions?.length ?? 0) > 2) errors.push(`Too many context questions: ${s.id}`);
    const contextTags = new Set(s.contextQuestions?.flatMap(q => q.choices.map(c => `context:${q.id}:${c.value}`)) ?? []);
    if (s.sensitivity !== "normal" && (!s.advice || !s.avoid.length)) errors.push(`Missing sensitive guidance: ${s.id}`);
    for (const r of s.replies) {
      const active = !r.tags.includes("legacy-retained-only");
      if (active) responseCount++; else {
        retainedOnlyCount++;
        if (!r.legacyId) errors.push(`Only preserved legacy content may be retained-only: ${r.id}`);
      }
      if (r.tags.some(t => t.startsWith("context:") && !contextTags.has(t))) errors.push(`Unknown context choice: ${r.id}`);
      if (responseIds.has(r.id)) errors.push(`Duplicate response ID: ${r.id}`);
      responseIds.add(r.id);
      const text = normalizeArabic(r.text);
      if (!text || /lorem ipsum|placeholder|نص تجريبي|عبارة وهمية/i.test(r.text)) errors.push(`Empty or placeholder: ${r.id}`);
      if ([...r.text].length > 400) errors.push(`Response over 400 characters: ${r.id}`);
      if (normalized.has(text)) errors.push(`Duplicate text: ${r.id} / ${normalized.get(text)}`);
      normalized.set(text, r.id);
      if (!r.allowedStages.length || r.allowedStages.some(stage => !Object.hasOwn(STAGES, stage))) errors.push(`Invalid stages: ${r.id}`);
      if (active) r.allowedStages.forEach(stage => { stageCounts[stage] = (stageCounts[stage] ?? 0) + 1; });
      if (!r.tones.length || r.tones.some(t => !Object.hasOwn(TONES, t))) errors.push(`Invalid tones: ${r.id}`);
      if (active) r.tones.forEach(t => { toneCounts[t] = (toneCounts[t] ?? 0) + 1; });
      if (s.sensitivity !== "normal" && r.tones.some(t => !SENSITIVE_TONES.includes(t))) errors.push(`Unsuitable sensitive tone: ${r.id}`);
      if (![1, 2, 3].includes(r.intensity)) errors.push(`Invalid intensity: ${r.id}`);
      if (messageLength(r.text) !== r.length || !Object.hasOwn(lengthCounts, r.length)) errors.push(`Incorrect length: ${r.id}`);
      else if (active) lengthCounts[r.length]++;
      if (r.dialect !== "sa") errors.push(`Invalid dialect: ${r.id}`);
      if (s.canonicalRoute === "quick" && (r.length !== "short" || r.text.split(/\s+/).length > 12)) errors.push(`Quick response too long: ${r.id}`);
      if (s.id === "quick-001" && r.text.split(/\s+/).length > 5) errors.push(`Greeting exceeds five words: ${r.id}`);
    }
  }
  const actual = new Map(content.flatMap(s => s.replies).map(r => [r.id, r.text]));
  for (const legacy of [...baseline.responses, ...baseline.runtimeResponses]) {
    const review = REVIEWS_BY_ID.get(legacy.id);
    const expected = review?.sourceText === legacy.text ? review.finalText : legacy.text;
    if (actual.get(legacy.id) !== expected) errors.push(`Lost legacy response: ${legacy.id}`);
  }
  for (const s of baseline.situations) if (!ids.has(s.id)) errors.push(`Lost legacy situation: ${s.id}`);
  const pairs: { a: string; b: string; similarity: number }[] = [];
  const responses = content.flatMap(s => s.replies);
  const tokens = responses.map(r => new Set(normalizeArabic(r.text).split(" ")));
  for (let i = 0; i < responses.length; i++) for (let j = i + 1; j < responses.length; j++) {
    if (Math.min(tokens[i].size, tokens[j].size) < 4) continue;
    const common = [...tokens[i]].filter(t => tokens[j].has(t)).length;
    const similarity = common / (tokens[i].size + tokens[j].size - common);
    if (similarity >= .72) pairs.push({ a: responses[i].id, b: responses[j].id, similarity: Math.round(similarity * 100) / 100 });
  }
  const reviewedSimilarPairs = pairs.filter(p => [p.a,p.b].sort().join("|") === ["miss:direct:0", "missing:direct:0"].sort().join("|"));
  const unreviewedSimilarPairs = pairs.filter(p => !reviewedSimilarPairs.includes(p));
  if (unreviewedSimilarPairs.length) warnings.push(`${unreviewedSimilarPairs.length} similar pairs require editorial review; similarity is not a semantic proof.`);
  const pending = MANIFEST.filter(m => !ids.has(m.id));
  const missingTones = Object.entries(toneCounts).filter(([, n]) => n === 0).map(([t]) => t);
  if (missingTones.length) (release ? errors : warnings).push(`Missing tones: ${missingTones.join(", ")}`);
  if (release) {
    if (content.length !== 320) errors.push(`Release requires 320 situations; actual ${content.length}`);
    if (responseCount < 2560) errors.push(`Release requires >=2560 responses; actual ${responseCount}`);
    for (const [route, n] of Object.entries(ROUTE_TARGETS)) if (routeCounts[route] !== n) errors.push(`Incomplete route ${route}`);
  }
  return {
    mode: release ? "release" : "incremental", valid: errors.length === 0, releaseComplete: errors.length === 0 && pending.length === 0 && responseCount >= 2560 && missingTones.length === 0,
    situations: content.length, responses: responseCount, responseRecords: responseCount + retainedOnlyCount, retainedOnlyCount,
    uniqueTexts: new Set(content.flatMap(s => s.replies).filter(r => !r.tags.includes("legacy-retained-only")).map(r => normalizeArabic(r.text))).size,
    legacyBaseResponses: baseline.responses.length, legacyRuntimeIds: baseline.runtimeResponses.length,
    routes: routeCounts, tones: toneCounts, stages: stageCounts, lengths: lengthCounts,
    errors, warnings, similarPairs: pairs, reviewedSimilarPairs, remainingSituations: pending.map(m => m.id), nextBatch: pending.slice(0, 10).map(m => m.id)
  };
}
