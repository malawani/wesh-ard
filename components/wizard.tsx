import { CATALOG, type Route, type Situation, type Stage, type Tone, type ToneFilter } from "../lib/catalog";
import { asksToStopContact, normalizeArabic, searchSituations, suggestSituation, TONES } from "../lib/engine";
import { ROUTES } from "./home";
import { Icon } from "./icon";

export const STAGES = [
  { id: "early", label: "بداية تعارف" },
  { id: "mutual", label: "إعجاب متبادل" },
  { id: "love", label: "علاقة حب" },
  { id: "serious", label: "خطوبة أو زواج" }
] as const;

const labels: Record<Tone, readonly [string, string]> = {
  soft: ["عفوي", "هادئ"],
  sweet: ["دلع ورومانسي", "متفهّم"],
  direct: ["واضح ومباشر", "صريح"]
};

export function toneLabel(tone: Tone, sensitive: boolean) {
  return labels[tone][Number(sensitive)];
}

export function StepHeader({ step, title, onBack }: { step: 1 | 2 | 3; title: string; onBack: () => void }) {
  return (
    <div className="step-header">
      <button type="button" className="text-button back-button" onClick={onBack}><Icon name="back" size={18} /> رجوع</button>
      <ol className="steps" aria-label="خطوات اختيار الرد">
        {["الموقف", "الأسلوب", "النتائج"].map((item, index) => <li key={item} aria-current={step === index + 1 ? "step" : undefined}>{item}</li>)}
      </ol>
      <h1 id="page-title" tabIndex={-1}>{title}</h1>
    </div>
  );
}

export function SituationPicker({ route, query, onQuery, onChoose, onBack, onGuide }: {
  route: Route; query: string; onQuery: (query: string) => void; onChoose: (situation: Situation) => void; onBack: () => void; onGuide: () => void;
}) {
  const matches = searchSituations(query, route);
  const suggestion = suggestSituation(query, route);
  const stopRequested = asksToStopContact(query);
  const hasQuery = Boolean(normalizeArabic(query));
  return (
    <section className="flow">
      <StepHeader step={1} title={ROUTES.find(item => item.id === route)!.heading} onBack={onBack} />
      <div className="search-section">
        <label htmlFor="situation-search">ابحث عن موقف أو اكتب الرسالة</label>
        <div className="search-field">
          <Icon name="search" size={22} />
          <input id="situation-search" value={query} maxLength={500} autoComplete="off" placeholder={route === "reply" ? "مثال: قالت لي اشتقت لك" : "اكتب كلمة أو وصفًا قصيرًا"} onChange={event => onQuery(event.target.value)} />
          {query && <button type="button" className="icon-button" aria-label="مسح البحث" onClick={() => onQuery("")}><Icon name="close" size={19} /></button>}
        </div>
      </div>
      {stopRequested && <div className="notice"><Icon name="shield" /><div><strong>احترم طلب التوقف عن التواصل.</strong><p>إذا طلب منك الطرف الآخر عدم التواصل، توقف عن إرسال الرسائل.</p>{route !== "guide" && <button type="button" className="text-button" onClick={onGuide}>عرض إرشاد طلب المساحة <Icon name="arrow" size={17} /></button>}</div></div>}
      {stopRequested ? (
        route === "guide" && <Advice situation={CATALOG.find(item => item.id === "space")!} />
      ) : <>
      {suggestion && (
        <button type="button" className="suggested" onClick={() => onChoose(suggestion)}>
          <Icon name="spark" size={22} />
          <span><small>اقتراح موقف</small><strong>{suggestion.title}</strong></span>
          <Icon name="arrow" size={19} />
        </button>
      )}
      <h2 className="section-label">{hasQuery ? "نتائج البحث" : "المواقف المتاحة"}</h2>
      {matches.length > 0 ? (
        <div className="situation-grid">
          {matches.map(situation => <button type="button" className="situation-card" key={situation.id} onClick={() => onChoose(situation)}>{situation.title}<Icon name="arrow" size={17} /></button>)}
        </div>
      ) : (
        <div className="empty-state"><p>ما لقينا موقفًا مطابقًا. جرّب كلمة ثانية أو اختر موقفًا من القائمة.</p><button type="button" className="secondary-button" onClick={() => onQuery("")}>عرض كل المواقف</button></div>
      )}
      </>}
    </section>
  );
}

export function ToneSelector({ sensitive, value, onChange, name }: { sensitive: boolean; value: ToneFilter; onChange: (tone: ToneFilter) => void; name: string }) {
  return (
    <fieldset className="choice-group">
      <legend>نبرة الكلام</legend>
      <div className="choices">
        {([...TONES, "all"] as const).map(tone => (
          <label className="choice" key={tone}>
            <input type="radio" name={name} value={tone} checked={value === tone} onChange={() => onChange(tone)} />
            <span>{tone === "all" ? "كل النبرات" : toneLabel(tone, sensitive)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Advice({ situation }: { situation: Situation }) {
  return (
    <aside className="advice" aria-label="إرشاد للموقف">
      <div><Icon name="bulb" size={22} /><span><strong>نصيحة للموقف</strong><p>{situation.tip}</p></span></div>
      <div><Icon name="shield" size={22} /><span><strong>وش تتجنّب</strong><p>{situation.avoid}</p></span></div>
    </aside>
  );
}

export function Customization({ situation, stage, tone, onStage, onTone, onBack, onSubmit }: {
  situation: Situation; stage: Stage; tone: ToneFilter; onStage: (stage: Stage) => void; onTone: (tone: ToneFilter) => void;
  onBack: () => void; onSubmit: () => void;
}) {
  return (
    <section className="flow">
      <StepHeader step={2} title={situation.title} onBack={onBack} />
      {situation.route === "guide" && <Advice situation={situation} />}
      <form className="customization" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
        <fieldset className="choice-group">
          <legend>مرحلة العلاقة</legend>
          <div className="choices">
            {STAGES.map(option => <label className="choice" key={option.id}><input type="radio" name="stage" value={option.id} checked={stage === option.id} onChange={() => onStage(option.id)} /><span>{option.label}</span></label>)}
          </div>
        </fieldset>
        <ToneSelector sensitive={situation.sensitive} value={tone} onChange={onTone} name="custom-tone" />
        <button type="submit" className="primary-button">عرض العبارات <Icon name="arrow" size={20} /></button>
      </form>
    </section>
  );
}
