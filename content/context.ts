import { ALL_STAGES, messageLength, type SituationContent, type ContextQuestion, type ResponseContent } from "./schemas";
interface Definition { question: ContextQuestion; groups: Record<string, string[]> }
const DEFINITIONS: Record<string, Definition> = {
 photo: { question: { id: "photo-focus", title: "وش نوع المدح اللي تقصده؟", optional: true, choices: [{ value: "light", label: "مدح خفيف" }, { value: "flirt", label: "غزل واضح" }, { value: "details", label: "مدح التفاصيل" }] }, groups: {
  light: ["photo:soft:0", "photo:sweet:1"], flirt: ["photo:sweet:0", "photo:direct:0", "photo:direct:1", "photo:v2:2"], details: ["photo:soft:1", "photo:v2:1"]
 } },
 upset: { question: { id: "upset-reason", title: "وش تعرف عن سبب الزعل؟", optional: true, choices: [{ value: "known", label: "أعرف السبب" }, { value: "unknown", label: "ما أعرف السبب" }, { value: "mistake", label: "أخطأت وأحتاج أعتذر" }] }, groups: {
  known: ["upset:soft:1", "upset:sweet:0", "upset:sweet:1"], unknown: ["upset:soft:0", "upset:v2:1"], mistake: ["upset:direct:1", "upset:v2:2"]
 } },
 chat: { question: { id: "chat-context", title: "وش سياق بداية السالفة؟", optional: true, choices: [{ value: "first", label: "أول تعارف" }, { value: "previous", label: "بيننا سوالف سابقة" }, { value: "absence", label: "بعد غياب" }] }, groups: {
  first: ["chat:soft:1", "chat:v2:1"], previous: ["chat:sweet:0", "chat:sweet:1", "chat:v2:2"], absence: ["chat:soft:0", "chat:direct:0"]
 } },
 sorry: { question: { id: "apology-reason", title: "عن وش تبي تعتذر؟", optional: true, choices: [{ value: "delay", label: "تأخر" }, { value: "hurt", label: "كلام جارح" }, { value: "misunderstanding", label: "سوء فهم" }, { value: "cancel", label: "إلغاء موعد" }] }, groups: {
  delay: ["sorry:v2:2", "sorry:context:delay"], hurt: ["sorry:soft:0", "sorry:direct:0", "sorry:context:hurt"], misunderstanding: ["sorry:context:misunderstanding"], cancel: ["sorry:context:cancel"]
 } }
};
const apologyExtras: Record<string,string> = {
 delay: "تأخرت عن الوقت اللي وعدتك فيه بدون ما أخبرك، أعتذر وببلغك مبكرًا لو تغير وقتي مرة ثانية.",
 hurt: "كلمتي كانت جارحة، وأنا أعتذر عنها؛ بغيّر طريقة اعتراضي بدل ما أعيد نفس الأذى.",
 misunderstanding: "أعتذر عن الصياغة اللي سببت اللبس؛ بأوضح قصدي بعد ما أسمع كيف وصل لك الكلام.",
 cancel: "آسف إني ألغيت الموعد بوقت متأخر، وأتفهم لو ما ودك ترتبين بديلًا الحين."
};
export function withContext(situation: SituationContent): SituationContent {
 const definition = DEFINITIONS[situation.id];
 if (!definition) return situation;
 const extras: ResponseContent[] = situation.id === "sorry" ? Object.entries(apologyExtras).map(([value,text]) => ({ id: `sorry:context:${value}`, text, tones: ["mature", "clear"], allowedStages: ALL_STAGES, intensity: 1, length: messageLength(text), dialect: "sa", tags: ["v2", "context-authored"] })) : [];
 return { ...situation, contextQuestions: [definition.question], replies: [...situation.replies, ...extras].map(r => {
  const groups = Object.entries(definition.groups).filter(([,ids]) => ids.includes(r.id)).map(([value]) => `context:${definition.question.id}:${value}`);
  return { ...r, tags: [...r.tags, ...groups] };
 }) };
}
