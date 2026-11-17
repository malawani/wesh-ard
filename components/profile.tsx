"use client";
import { useState } from "react";
import { TONES, type Intensity } from "../content/schemas";
import { DEFAULT_PROFILE, type Profile } from "../lib/storage/personalization";
export function ProfilePage({ value, onSave, onBack }: { value: Profile; onSave: (p: Profile) => boolean; onBack: () => void }) {
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState("");
  return <section className="flow"><button type="button" className="text-button" onClick={onBack}>رجوع</button><h1 id="page-title" tabIndex={-1}>ملفي في الكلام</h1>
    <p>نستخدم تفضيلاتك كبداية للاختيارات، وتقدر تغيّرها لكل موقف. ما نحفظ نصوص البحث أو رسائلك الخاصة.</p>
    <form className="customization" onSubmit={e => { e.preventDefault(); setMessage(onSave(draft) ? "حُفظت تفضيلاتك في هذا المتصفح" : "تفضيلاتك متاحة لهذه الجلسة فقط"); }}>
      <div className="choice-group"><label htmlFor="profile-tone">النبرة المفضلة</label><select id="profile-tone" value={draft.tone} onChange={e => setDraft({ ...draft, tone: e.target.value as Profile["tone"] })}><option value="all">كل النبرات المناسبة</option>{Object.entries(TONES).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <div className="choice-group"><label htmlFor="profile-length">الطول المفضل</label><select id="profile-length" value={draft.length} onChange={e => setDraft({ ...draft, length: e.target.value as Profile["length"] })}><option value="all">أي طول مناسب</option><option value="short">قصير</option><option value="medium">متوسط</option><option value="long">طويل</option></select></div>
      <div className="choice-group"><label htmlFor="profile-intensity">الجرأة المفضلة</label><select id="profile-intensity" value={draft.intensity} onChange={e => setDraft({ ...draft, intensity: Number(e.target.value) as Intensity })}><option value={1}>خفيف</option><option value={2}>متوسط</option><option value={3}>واضح</option></select></div>
      <label className="check-option"><input type="checkbox" checked={draft.reduceExaggeration} onChange={e => setDraft({ ...draft, reduceExaggeration: e.target.checked })} /> تقليل المبالغة: استبعاد أعلى درجة جرأة</label>
      <label className="check-option"><input type="checkbox" checked={draft.saveFeedback} onChange={e => setDraft({ ...draft, saveFeedback: e.target.checked })} /> حفظ تقييماتي في هذا المتصفح</label>
      <p>بدون حفظ التقييمات تبقى خلال الجلسة فقط. إلغاء الحفظ عند الضغط على الزر يزيل نسختها المحلية. تؤثر التقييمات على الترتيب بعد تقييم ثلاث عبارات مختلفة.</p>
      <button type="submit" className="primary-button">حفظ تفضيلاتي</button><button type="button" className="secondary-button" onClick={() => setDraft({ ...DEFAULT_PROFILE })}>استعادة الخيارات الافتراضية</button>
      <p role="status">{message}</p>
    </form>
  </section>;
}
