import { CATALOG, type Route, type Situation, type Stage, type Tone, type ToneFilter } from "./catalog-v1";

export const TONES = ["soft", "sweet", "direct"] as const;

const stopWords = new Set("قال قالت قالي قالتلي لي ابي ابغى ودي كيف وش ايش مو من في على او هو هي انا انت ان كان هذا هذي مره مر وقت شي كلام يوم رد رساله ردت ارسلت معي منك لك لها ما انه انها اني".split(" "));
const broadWords = new Set("ليه ليش سبب حب مشاعر غياب تعبان اهتمام اول مختلف صعب وقت نفس موعد".split(" "));
const negations = new Set(["ما", "مو", "مب", "لا", "ماني"]);
const aliases: Record<string, readonly string[]> = {
  miss: ["وحشتيني", "وحشتني", "فاقدك", "مشتاقه لك", "اشتقتلك", "فقدتك"],
  photo: ["صورتها", "صورتك", "صورت لي", "صورتني"],
  crush: ["احسك معجب", "معجب فيني", "اعجابك فيني"],
  love: ["احبج", "احبك موت", "تحبيني"],
  why: ["وش يعجبك فيني", "ليه تعجبك", "ليه معجب فيني", "ليش تعجبك", "ليش انا اعجبك"],
  voice: ["مقطع صوتي", "تسجيل صوتي", "رساله صوتيه"],
  bored: ["طفشانه", "طفشانه مره", "زهقانه", "مليت"],
  cold: ["ردت ببرود", "رد بارد", "ترد ببرود", "ردود مختصره"],
  upset: ["زعلانه منك", "زعلانه مني", "متضايقه منك", "ضايقتني"],
  night: ["تصبح على خير", "تصبحين على خير", "بنام", "نوم العوافي"],
  morning: ["صباح الخير", "صبحك الله", "رساله صباحيه"],
  chat: ["افتح سالفه", "ابدا سوالف", "اكسر الصمت"],
  flirt: ["اغازلها", "اغازل", "امدحها"],
  hint: ["المح باعجابي", "المح لها", "المح اني معجب"],
  confess: ["اعترف لها", "اعترف بمشاعري", "اقولها احبك"],
  missing: ["اشتقت لها", "وحشتني", "اشتقتلها"],
  meet: ["نطلع قهوه", "اقترح لقاء", "اقابلها"],
  support: ["اطمن عليها", "اواسيها", "ادعمها", "تعبانه"],
  thanks: ["اشكرها", "اقدر وقفتها", "شكرا", "هدتني"],
  sorry: ["اعتذر", "اعتذر لها", "سامحيني", "زعلتها"],
  misunderstand: ["سوء فهم", "فهمتني غلط", "فهمتها غلط", "سوء تفاهم"],
  space: ["خليها على راحتها", "خليني لحالي", "اتركني لحالي", "لا تكلمني", "لا تراسلني", "لا تتواصل معي", "ما تكلمني", "احتاج مساحه", "ابي مساحه", "ابي وقت لنفسي", "لا تتواصل", "وقف التواصل"],
  fading: ["قل اهتمامها", "ما صارت تهتم", "ما عادت تهتم", "تغيرت علي"],
  jealous: ["غرت عليها", "حسيت بالغيره", "اغار عليها"],
  stress: ["يوم صعب", "تمر بظروف", "تحتاج فضفضه", "تعبانه نفسيا"],
  reject: ["ما احبك", "ما ابادلك الشعور", "ما تحبني", "ما تبادلني الشعور", "ما تبي علاقه", "مو مهتمه فيني", "لا تحبني"],
  first: ["اول لقاء", "اول موعد", "اول مره بنلتقي"],
  busy: ["مشغوله بالدوام", "ما عندها وقت", "دوامها"],
  bounds: ["اوضح حدودي", "احط حدود", "تجاوزت حدودي"],
  again: ["بعد انقطاع", "ارجع التواصل", "نرجع نتواصل", "بعد فتره"],
};

export function normalizeArabic(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const contactStop = /(?:^| )(?:لا تكلمني|لا تراسلني|لا تتواصل(?: معي)?|لا عاد تكلمني|وقف التواصل|اتركني(?: لحالي)?|خليني لحالي)(?: |$)/;

export function asksToStopContact(input: string): boolean {
  return contactStop.test(normalizeArabic(input));
}

function phraseIndex(input: string, phrase: string): number {
  return ` ${input} `.indexOf(` ${phrase} `);
}

const indexed = CATALOG.map(situation => {
  const title = normalizeArabic(situation.title);
  const related = (aliases[situation.id] ?? []).map(normalizeArabic);
  const terms = new Set([...title.split(" "), ...situation.keywords.map(normalizeArabic), ...related.filter(alias => !alias.includes(" "))]);
  const words = [...terms].filter(term => term && !stopWords.has(term));
  return { situation, title, words, phrases: related.filter(phrase => phrase.includes(" ")) };
});

function rank(query: string, route: Route, allowPartial: boolean) {
  const input = normalizeArabic(query);
  if (!input) return [];

  const tokens = input.split(" ");
  const usable = tokens.filter(token => !stopWords.has(token));
  const stopRequested = asksToStopContact(input);
  return indexed
    .filter(entry => entry.situation.route === route)
    .map(({ situation, title, words, phrases }) => {
      if (stopRequested) return { situation, score: situation.id === "space" ? 100 : 0 };
      let score = input === title ? 100 : 0;
      for (const phrase of phrases) {
        const index = phraseIndex(input, phrase);
        const preceding = index > 0 ? input.slice(0, index).trimEnd().split(" ").at(-1) ?? "" : "";
        if (index >= 0 && !negations.has(preceding)) score = Math.max(score, 16 + phrase.split(" ").length * 15);
      }
      const exact = new Set<string>();
      for (const [index, token] of tokens.entries()) {
        if (negations.has(tokens[index - 1])) continue;
        const candidates = token.length >= 5 && token.startsWith("و") ? [token, token.slice(1)] : [token];
        for (const candidate of candidates) {
          if (words.includes(candidate)) exact.add(candidate);
        }
      }
      for (const word of exact) score += broadWords.has(word) ? 1 : 6;
      if (allowPartial && !score && usable.length === 1 && usable[0].length >= 3) {
        if (words.some(word => !broadWords.has(word) && word.startsWith(usable[0]))) score = 3;
      }
      return { situation, score };
    })
    .filter(item => item.score >= (allowPartial ? 1 : 6))
    .sort((a, b) => b.score - a.score);
}

export function searchSituations(query: string, route: Route): Situation[] {
  if (!normalizeArabic(query)) return CATALOG.filter(situation => situation.route === route);
  return rank(query, route, true).map(item => item.situation);
}

export function suggestSituation(query: string, route: Route): Situation | null {
  const [best, second] = rank(query, route, false);
  if (!best || best.score === second?.score) return null;
  return best.situation;
}

type Pair = readonly [string, string];
type Variants = Partial<Record<Stage, Partial<Record<Tone, Pair>>>>;

// Keep all source phrases in catalog.ts. Overrides replace only the affected tone and stage.
const stageVariants: Record<string, Variants> = {
  love: {
    early: { direct: ["كلامك أسعدني، وأنا مهتم أعرفك أكثر.", "أقدّر صراحتك، وودي نأخذ وقتنا ونتعرف على بعض."] },
    mutual: { direct: ["أنتِ تعنين لي كثير، وودي نتكلم عن اللي بيننا براحتنا.", "أنا بعد عندي مشاعر لك وأقدّر صراحتك."] },
    serious: { direct: ["وأنا أحبك، وأقدّر كل اللي نبنيه مع بعض.", "أحبك، وأبيك تحسين فيها بتصرفاتي معك كل يوم."] }
  },
  miss: {
    early: {
      sweet: ["يا زين رسالتك، فقدت سوالفك بعد.", "ضحكت لما قريت رسالتك، وأنا بعد فقدت السوالف."],
      direct: ["وأنا فقدت سوالفك وودي نكملها قريب.", "وأنا مشتاق أسولف معك، متى يناسبك؟"]
    },
    serious: { sweet: ["يا بعد قلبي، حتى يومي العادي أحبه أكثر وأنتِ معي.", "وأنا اشتقت لك ولتفاصيل يومنا مع بعض."] }
  },
  flirt: {
    early: { sweet: ["يا زين خفة دمك، السوالف معك ما تنمل.", "عفويتك حلوة وتخلّي الكلام معك سهل."] },
    love: { sweet: ["يا حلو ضحكتك، أحب اللحظة اللي أسمعها فيها.", "كل ما طرى اسمك ابتسمت من غير ما أحس."] },
    serious: { direct: ["أحب فيك طريقتك اللي تخلّين فيها أيامنا العادية حلوة.", "كل يوم معك ألاحظ شي جديد أحبه فيك."] }
  },
  confess: {
    early: { direct: ["بصراحة أنتِ تعجبيني، وإذا يناسبك ودي أعرفك أكثر.", "ارتحت لك وودي نتعرف أكثر، وخذي راحتك بالرد."] },
    love: { direct: ["أبي أقولها بوضوح، أحبك وأقدّر اللي بيننا.", "عندي مشاعر واضحة لك، وودي أعبّر عنها أكثر."] },
    serious: { direct: ["أحبك وأقدّر علاقتنا، وودي أقولها لك أكثر.", "أنا ممتن لوجودك معي وأبي أعبّر لك عن هالشي بصراحة."] }
  },
  missing: {
    early: { direct: ["فقدت سوالفك، ودي نسولف إذا عندك وقت.", "طريتي على بالي اليوم وحبيت أقول إني مشتاق للسوالف."] },
    serious: { soft: ["فقدت قعدتنا اليوم، عسى يومك حلو.", "اشتقت لك، وش صار معك اليوم؟"] }
  },
  meet: {
    early: { sweet: ["سوالفك تنحب، وش رايك نكملها على قهوة إذا يناسبك؟", "ودي نسولف وجه لوجه، إذا الفكرة تريحك."] },
    serious: { direct: ["ودي نطلع سوا هالأسبوع، أي يوم يناسبك؟", "خلّينا نرتّب لنا وقت نسولف فيه، وش يناسبك؟"] }
  },
  jealous: {
    early: { sweet: ["أقدّر إني أقدر أتكلم معك بصراحة، وحبيت أشرح وش حسّيت.", "يهمني نفهم الموقف بهدوء، ويمكن أنا فهمته بطريقة ثانية."] }
  },
  space: {
    early: { direct: ["أحترم طلبك، وبعطيك مساحتك.", "وصل طلبك، وبوقف التواصل."] }
  }
};

export interface Suggestion {
  id: string;
  text: string;
  tone: Tone;
  situationId: string;
}

export function getSuggestions(situation: Situation, stage: Stage, filter: ToneFilter): Suggestion[] {
  const tones = filter === "all" ? TONES : [filter];
  return tones.flatMap(tone => {
    const variant = stageVariants[situation.id]?.[stage]?.[tone];
    const phrases = variant ?? situation.responses[tone];
    return phrases.map((text, index) => ({
      id: `${situation.id}:${tone}:${index}${variant ? `:${stage}` : ""}`,
      text,
      tone,
      situationId: situation.id
    }));
  });
}
