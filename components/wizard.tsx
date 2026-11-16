import { CONTENT_BY_ID } from "../content";
import { STAGES, TONES, type RouteId, type SituationContent, type StageId, type ToneId, type Intensity, type MessageLength } from "../content/schemas";
import { asksToStopContact, normalizeArabic } from "../lib/engine";
import { availableTones } from "../lib/recommendation";
import { searchContent } from "../lib/search";
import { ROUTES } from "./home";
import { Icon } from "./icon";

export interface Choices { stage: StageId; tone: ToneId | "all"; intensity: Intensity; length: MessageLength | "all" }
export function StepHeader({ step, title, onBack }: { step: 1 | 2 | 3; title: string; onBack: () => void }) {
  return <div className="step-header">
    <button type="button" className="text-button back-button" onClick={onBack}><Icon name="back" size={18} /> رجوع</button>
    <ol className="steps" aria-label="خطوات اختيار الرد">{["الموقف", "الأسلوب", "النتائج"].map((item, i) => <li key={item} aria-current={step === i + 1 ? "step" : undefined}>{item}</li>)}</ol>
    <h1 id="page-title" tabIndex={-1}>{title}</h1>
  </div>;
}
export function SituationPicker({ route, query, onQuery, onChoose, onBack, onGuide }: {
  route: RouteId; query: string; onQuery: (value: string) => void; onChoose: (s: SituationContent) => void;
  onBack: () => void; onGuide: () => void;
}) {
  const matches = searchContent(query, route);
  const stop = asksToStopContact(query);
  return <section className="flow">
    <StepHeader step={1} title={ROUTES.find(r => r.id === route)?.heading ?? "اختر الموقف"} onBack={onBack} />
    <div className="search-section"><label htmlFor="situation-search">ابحث عن موقف أو اكتب الرسالة</label>
      <div className="search-field"><Icon name="search" size={22} />
        <input id="situation-search" value={query} maxLength={500} autoComplete="off" placeholder="مثال: قالت لي اشتقت لك" onChange={e => onQuery(e.target.value)} />
        {query && <button type="button" className="icon-button" aria-label="مسح البحث" onClick={() => onQuery("")}><Icon name="close" size={19} /></button>}
      </div>
    </div>
    {stop ? <div className="notice"><Icon name="shield" /><div><strong>احترم طلب التوقف عن التواصل.</strong><p>توقف عن إرسال الرسائل؛ لا يلزم إرسال رد لتأكيد التوقف.</p>{route !== "guide" && <button type="button" className="text-button" onClick={onGuide}>عرض إرشاد طلب المساحة</button>}</div></div> : <>
      <h2 className="section-label">{normalizeArabic(query) ? "نتائج البحث" : "المواقف المتاحة"}</h2>
      <p className="sr-only" role="status">{matches.length} مواقف متاحة</p>
      {matches.length ? <div className="situation-grid">{matches.map(s => <button type="button" className="situation-card" key={s.id} onClick={() => onChoose(s)}>{s.title}<Icon name="arrow" size={17} /></button>)}</div>
        : <div className="empty-state"><p>ما لقينا موقفًا مطابقًا. جرّب وصفًا ثانيًا.</p><button type="button" className="secondary-button" onClick={() => onQuery("")}>عرض كل المواقف</button></div>}
    </>}
    {stop && route === "guide" && <Advice situation={CONTENT_BY_ID.get("space")!} />}
  </section>;
}
export function Advice({ situation }: { situation: SituationContent }) {
  return <aside className="advice" aria-label="إرشاد للموقف">
    <div><Icon name="bulb" size={22} /><span><strong>نصيحة للموقف</strong><p>{situation.advice}</p>
      {situation.actions.length > 0 && <ul>{situation.actions.map(a => <li key={a}>{a}</li>)}</ul>}</span></div>
    <div><Icon name="shield" size={22} /><span><strong>وش تتجنّب</strong>{situation.avoid.map(a => <p key={a}>{a}</p>)}</span></div>
  </aside>;
}
export function ToneSelector({ situation, choices, onChange, name }: {
  situation: SituationContent; choices: Choices; onChange: (c: Choices) => void; name: string;
}) {
  const tones = availableTones(situation.id, choices.stage);
  return <fieldset className="choice-group"><legend>نبرة الكلام</legend><div className="choices">
    {[...tones, "all" as const].map(tone => <label className="choice" key={tone}>
      <input type="radio" name={name} value={tone} checked={choices.tone === tone} onChange={() => onChange({ ...choices, tone })} />
      <span>{tone === "all" ? "كل النبرات المناسبة" : TONES[tone]}</span>
    </label>)}
  </div></fieldset>;
}
export function Customization({ situation, choices, onChange, onBack, onSubmit }: {
  situation: SituationContent; choices: Choices; onChange: (c: Choices) => void; onBack: () => void; onSubmit: () => void;
}) {
  function setStage(stage: StageId) {
    const tones = availableTones(situation.id, stage);
    onChange({ ...choices, stage, tone: choices.tone === "all" || tones.includes(choices.tone) ? choices.tone : "all" });
  }
  return <section className="flow">
    <StepHeader step={2} title={situation.title} onBack={onBack} />
    {situation.sensitivity !== "normal" && <Advice situation={situation} />}
    <form className="customization" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      <div className="choice-group"><label htmlFor="relationship-stage">مرحلة العلاقة</label>
        <select id="relationship-stage" value={choices.stage} onChange={e => setStage(e.target.value as StageId)}>{Object.entries(STAGES).map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>
      </div>
      <ToneSelector situation={situation} choices={choices} onChange={onChange} name="custom-tone" />
      <details className="advanced-options"><summary>خيارات إضافية</summary>
        {situation.sensitivity === "normal" && <div className="choice-group"><label htmlFor="intensity">درجة الجرأة</label><select id="intensity" aria-describedby="intensity-hint" value={choices.intensity} onChange={e => onChange({ ...choices, intensity: Number(e.target.value) as Intensity })}><option value={1}>خفيف</option><option value={2}>متوسط</option><option value={3}>واضح</option></select><p id="intensity-hint">لن تتجاوز النتائج هذه الدرجة، وقد تكون أخف.</p></div>}
        <div className="choice-group"><label htmlFor="message-length">طول الرسالة</label><select id="message-length" value={choices.length} onChange={e => onChange({ ...choices, length: e.target.value as Choices["length"] })}><option value="all">أي طول مناسب</option><option value="short">قصير</option><option value="medium">متوسط</option><option value="long">طويل</option></select></div>
      </details>
      <button type="submit" className="primary-button">عرض العبارات <Icon name="arrow" size={20} /></button>
    </form>
  </section>;
}
