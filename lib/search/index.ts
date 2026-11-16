import { CONTENT } from "../../content";
import type { RouteId } from "../../content/schemas";
import { asksToStopContact, normalizeArabic } from "../engine";
import { ARABIC_SYNONYMS } from "./arabic-synonyms";
const ignored = new Set("قال قالت لي لها هو هي انا انت وش ايش كيف في من على و او ان كان ابي ابغى".split(" "));
const negation = new Set(["ما", "لا", "مو", "مب", "ماني"]);
const index = CONTENT.map(s => ({
  situation: s, title: normalizeArabic(s.title),
  terms: new Set(normalizeArabic([s.title, ...s.keywords].join(" ")).split(" ").filter(t => !ignored.has(t))),
  aliases: (ARABIC_SYNONYMS[s.id] ?? []).map(normalizeArabic)
}));
export function searchContent(query: string, route?: RouteId) {
  const input = normalizeArabic(query);
  const pool = index.filter(e => !route || e.situation.canonicalRoute === route || e.situation.relatedRoutes?.includes(route));
  if (!input) return pool.map(e => e.situation);
  if (asksToStopContact(input)) return pool.filter(e => e.situation.id === "space").map(e => e.situation);
  // A request to stop flirting takes priority over affectionate words in the same message.
  // It is a specific boundary, not a request to end every kind of communication.
  if (/(?:^| )(?:لا تغازلني|ما ابي غزل|ما ابغي غزل|ما ابغي تغازلني|ما ابغى غزل|وقف الغزل)(?: |$)/.test(input)) {
    return pool.filter(e => e.situation.id === "reply-023").map(e => e.situation);
  }
  const tokens = input.split(" ");
  return pool.map(entry => {
    let score = entry.title === input ? 100 : 0;
    for (const phrase of entry.aliases) {
      const position = ` ${input} `.indexOf(` ${phrase} `);
      if (position < 0) continue;
      const preceding = input.slice(0, position).trim().split(" ").at(-1) ?? "";
      if (!negation.has(preceding)) score += 20 + phrase.split(" ").length * 10;
    }
    for (const [i, token] of tokens.entries()) {
      if (ignored.has(token) || negation.has(tokens[i - 1])) continue;
      const options = token.startsWith("و") && token.length > 4 ? [token, token.slice(1)] : [token];
      if (options.some(t => entry.terms.has(t))) score += 6;
      else if (tokens.length === 1 && token.length >= 3 && [...entry.terms].some(t => t.startsWith(token))) score += 2;
    }
    // Explicit non-reciprocation must not turn into a declaration of love.
    if (/ما احبك|ما ابادلك|ما ابي نكمل|خلينا اصدقاء/.test(input) && !["reject", "space"].includes(entry.situation.id)) score = 0;
    return { ...entry, score };
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).map(e => e.situation);
}
