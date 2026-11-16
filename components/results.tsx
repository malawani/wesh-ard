"use client";

import { useEffect, useRef, useState } from "react";
import { CATALOG, type Situation, type Stage, type ToneFilter } from "../lib/catalog";
import { getSuggestions, type Suggestion } from "../lib/engine";
import { Icon } from "./icon";
import { Advice, StepHeader, STAGES, ToneSelector, toneLabel } from "./wizard";

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

function ResponseCard({ response, situation, saved, onFavorite, onStatus, isFavorites = false }: {
  response: Suggestion; situation: Situation; saved: boolean; onFavorite: (item: Suggestion) => void;
  onStatus: (message: string) => void; isFavorites?: boolean;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manual = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => clearTimeout(timeout.current), []);
  useEffect(() => {
    if (copyState === "manual") {
      manual.current?.focus();
      manual.current?.select();
    }
  }, [copyState]);

  async function handleCopy() {
    clearTimeout(timeout.current);
    if (await copyText(response.text)) {
      setCopyState("copied");
      onStatus("تم النسخ");
      timeout.current = setTimeout(() => setCopyState("idle"), 2400);
    } else {
      setCopyState("manual");
      manual.current?.select();
      onStatus("تعذّر النسخ التلقائي. انسخ النص يدويًا.");
    }
  }

  return (
    <article className="response-card">
      <div className="response-top">
        <span className="tone-tag">{isFavorites ? situation.title : toneLabel(response.tone, situation.sensitive)}</span>
        <button type="button" className={`icon-button save-button${saved ? " is-saved" : ""}`} aria-pressed={saved} aria-label={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"} onClick={() => onFavorite(response)}><Icon name="heart" size={23} /></button>
      </div>
      <p className="response-text">{response.text}</p>
      <button type="button" className="secondary-button copy-button" onClick={handleCopy}>
        <Icon name={copyState === "copied" ? "check" : "copy"} size={17} />{copyState === "copied" ? "تم النسخ" : "نسخ العبارة"}
      </button>
      {copyState === "manual" && (
        <label className="manual-copy">تعذّر النسخ التلقائي. انسخ النص يدويًا.
          <textarea ref={manual} readOnly value={response.text} rows={2} />
        </label>
      )}
    </article>
  );
}

type ResponseActions = {
  favorites: Suggestion[]; onFavorite: (item: Suggestion) => void; onStatus: (message: string) => void;
};

export function Results({ situation, stage, tone, onTone, onBack, onNew, ...actions }: ResponseActions & {
  situation: Situation; stage: Stage; tone: ToneFilter; onTone: (tone: ToneFilter) => void; onBack: () => void; onNew: () => void;
}) {
  return (
    <section className="flow">
      <StepHeader step={3} title={situation.title} onBack={onBack} />
      <p className="current-stage">{STAGES.find(option => option.id === stage)?.label}</p>
      <div className="result-controls"><ToneSelector sensitive={situation.sensitive} value={tone} onChange={onTone} name="result-tone" /></div>
      <div className="response-grid">
        {getSuggestions(situation, stage, tone).map(response => (
          <ResponseCard key={response.id} response={response} situation={situation} saved={actions.favorites.some(item => item.id === response.id)} onFavorite={actions.onFavorite} onStatus={actions.onStatus} />
        ))}
      </div>
      <Advice situation={situation} />
      <div className="flow-actions">
        <button type="button" className="secondary-button" onClick={onBack}>تعديل الاختيارات</button>
        <button type="button" className="text-button" onClick={onNew}>اختيار موقف آخر <Icon name="arrow" size={17} /></button>
      </div>
    </section>
  );
}

export function Favorites({ favorites, onBack, onFavorite, onStatus }: ResponseActions & { onBack: () => void }) {
  return (
    <section className="flow">
      <button type="button" className="text-button back-button" onClick={onBack}><Icon name="back" size={18} /> رجوع</button>
      <h1 id="page-title" className="favorites-title" tabIndex={-1}>المفضلة</h1>
      {favorites.length ? (
        <div className="response-grid">
          {favorites.map(response => (
            <ResponseCard key={response.id} response={response} situation={CATALOG.find(item => item.id === response.situationId)!} saved onFavorite={onFavorite} onStatus={onStatus} isFavorites />
          ))}
        </div>
      ) : (
        <div className="empty-state favorites-empty">
          <Icon name="heart" size={34} /><h2>مفضلتك فاضية</h2><p>اضغط القلب بجانب أي عبارة تعجبك عشان تلقاها هنا.</p>
          <button type="button" className="secondary-button" onClick={onBack}>رجوع</button>
        </div>
      )}
    </section>
  );
}
