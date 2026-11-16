"use client";
import { useEffect, useRef, useState } from "react";
import { CONTENT_BY_ID } from "../content";
import { STAGES, TONES, type SituationContent } from "../content/schemas";
import { recommend } from "../lib/recommendation";
import type { FavoriteItem } from "../lib/storage/favorites-v2";
import { Icon } from "./icon";
import { Advice, StepHeader, ToneSelector, type Choices } from "./wizard";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.className = "clipboard-fallback";
    const focused = document.activeElement;
    document.body.append(field);
    try {
      field.select();
      field.setSelectionRange(0, text.length);
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    }
  }
}

type ResponseActions = {
  favorites: FavoriteItem[]; onFavorite: (item: FavoriteItem) => void;
  onStatus: (message: string) => void; storageReady: boolean;
};
function ResponseCard({ item, saved, onFavorite, onStatus, storageReady, isFavorites = false }: {
  item: FavoriteItem; saved: boolean; isFavorites?: boolean;
} & Omit<ResponseActions, "favorites">) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manual = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => clearTimeout(timeout.current), []);
  useEffect(() => { if (copyState === "manual") { manual.current?.focus(); manual.current?.select(); } }, [copyState]);
  async function handleCopy() {
    clearTimeout(timeout.current);
    if (await copyText(item.text)) {
      setCopyState("copied"); onStatus("تم النسخ");
      timeout.current = setTimeout(() => setCopyState("idle"), 2400);
    } else { setCopyState("manual"); onStatus("تعذّر النسخ التلقائي. انسخ النص يدويًا."); }
  }
  const situation = item.situationId ? CONTENT_BY_ID.get(item.situationId) : undefined;
  return <article className="response-card">
    <div className="response-top"><span className="tone-tag">{item.orphaned ? "عبارة محفوظة من إصدار سابق" : isFavorites ? situation?.title : item.tone ? TONES[item.tone] : "عبارة محفوظة"}</span>
      <button type="button" disabled={!storageReady} className={`icon-button save-button${saved ? " is-saved" : ""}`} aria-pressed={saved} aria-label={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"} onClick={() => onFavorite(item)}><Icon name="heart" size={23} /></button>
    </div>
    <p className="response-text">{item.text}</p>
    <button type="button" className="secondary-button copy-button" onClick={handleCopy}><Icon name={copyState === "copied" ? "check" : "copy"} size={17} />{copyState === "copied" ? "تم النسخ" : "نسخ العبارة"}</button>
    {copyState === "manual" && <label className="manual-copy">تعذّر النسخ التلقائي. انسخ النص يدويًا.<textarea ref={manual} readOnly value={item.text} rows={3} /></label>}
  </article>;
}
export function Results({ situation, choices, onChange, onBack, onNew, ...actions }: ResponseActions & {
  situation: SituationContent; choices: Choices; onChange: (c: Choices) => void; onBack: () => void; onNew: () => void;
}) {
  const result = recommend({ situationId: situation.id, relationshipStage: choices.stage, preferredTone: choices.tone, intensity: choices.intensity, length: choices.length });
  return <section className="flow">
    <StepHeader step={3} title={situation.title} onBack={onBack} />
    <p className="current-stage">{STAGES[choices.stage]}</p>
    <div className="result-controls"><ToneSelector situation={situation} choices={choices} onChange={onChange} name="result-tone" /></div>
    {result.fallbackReason && <p className="notice" role="status">{result.fallbackReason}</p>}
    {result.suggestions.length ? <div className="response-grid">{result.suggestions.map(response => {
      const item: FavoriteItem = { id: response.id, text: response.text, situationId: situation.id, tone: response.tones[0], orphaned: false };
      return <ResponseCard key={item.id} item={item} saved={actions.favorites.some(f => f.id === item.id)} {...actions} />;
    })}</div> : <div className="empty-state"><p>ما عندنا عبارة مناسبة لهذي الاختيارات.</p><button type="button" className="secondary-button" onClick={onBack}>تعديل الاختيارات</button></div>}
    <Advice situation={situation} />
    <div className="flow-actions"><button type="button" className="secondary-button" onClick={onBack}>تعديل الاختيارات</button><button type="button" className="text-button" onClick={onNew}>اختيار موقف آخر <Icon name="arrow" size={20} /></button></div>
  </section>;
}
export function Favorites({ onBack, ...actions }: ResponseActions & { onBack: () => void }) {
  return <section className="flow">
    <button type="button" className="text-button back-button" onClick={onBack}><Icon name="back" size={18} /> رجوع</button>
    <h1 id="page-title" className="favorites-title" tabIndex={-1}>المفضلة</h1>
    {!actions.storageReady ? <p role="status">جارٍ تحميل المفضلة…</p> : actions.favorites.length ? <div className="response-grid">{actions.favorites.map(item => <ResponseCard key={item.id} item={item} saved isFavorites {...actions} />)}</div>
      : <div className="empty-state favorites-empty"><Icon name="heart" size={34} /><h2>مفضلتك فاضية</h2><p>اضغط القلب بجانب أي عبارة تعجبك عشان تلقاها هنا.</p><button type="button" className="secondary-button" onClick={onBack}>رجوع</button></div>}
  </section>;
}
