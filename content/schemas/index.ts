export const ROUTES = {
  reply: "وش أرد؟", send: "وش أرسل؟", guide: "وش أسوي بالموقف؟",
  open: "كيف أفتح سالفة؟", continue: "كيف أكمل السالفة؟", flirt: "غزل ودلع",
  confession: "تلميحات واعترافات", reconcile: "عتاب ومصالحة", care: "اهتمام واحتواء",
  occasions: "مناسبات وذكريات", meeting: "قبل اللقاء وبعده", quick: "ردود سريعة وذكية"
} as const;
export type RouteId = keyof typeof ROUTES;
export const STAGES = {
  first_contact: "أول تواصل", getting_to_know: "بداية تعارف",
  friendship_possible: "صداقة مع احتمال إعجاب", one_sided: "إعجاب من طرف واحد",
  mutual_crush: "إعجاب متبادل", serious_dating: "تعارف جاد ونية ارتباط",
  love: "علاقة حب", engaged: "خطوبة", married: "زواج"
} as const;
export type StageId = keyof typeof STAGES;
export const TONES = {
  casual: "عفوي وطبيعي", romantic: "رومانسي", tender: "دلع وحنان",
  confident: "ثقيل وواثق", bold_respectful: "جريء ومحترم", deep: "عميق ومؤثر",
  poetic: "شاعري وفخم", playful: "مرح ومشاكس", mature: "راقٍ وناضج",
  supportive: "داعم ومطمئن", clear: "واضح وصريح", subtle: "تلميح لطيف"
} as const;
export type ToneId = keyof typeof TONES;
export type MessageLength = "short" | "medium" | "long";
export type Intensity = 1 | 2 | 3;
export interface ResponseContent {
  id: string; text: string; tones: ToneId[]; allowedStages: StageId[];
  intensity: Intensity; length: MessageLength; dialect: "sa"; tags: string[];
  legacyId?: string;
}
export interface ContextQuestion {
  id: string; title: string; choices: { value: string; label: string }[]; optional: boolean;
}
export interface SituationContent {
  id: string; canonicalRoute: RouteId; relatedRoutes?: RouteId[]; title: string;
  description: string; intent: string; trigger: string; keywords: string[];
  contextQuestions?: ContextQuestion[];
  advice: string; actions: string[]; avoid: string[];
  sensitivity: "normal" | "careful" | "boundary_sensitive";
  replies: ResponseContent[];
}
export const ALL_STAGES = Object.keys(STAGES) as StageId[];
export const CLOSE_STAGES: StageId[] = ["mutual_crush", "serious_dating", "love", "engaged", "married"];
export const COMMITTED_STAGES: StageId[] = ["love", "engaged", "married"];
export const SENSITIVE_TONES: ToneId[] = ["casual", "mature", "supportive", "clear"];
export function messageLength(text: string): MessageLength {
  const count = [...text].length;
  return count <= 65 ? "short" : count <= 160 ? "medium" : "long";
}
