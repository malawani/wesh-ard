"use client";
import { useState } from "react";
import { CONTENT } from "../content";
import { ROUTES as ROUTE_LABELS, type RouteId as Route, type SituationContent as Situation } from "../content/schemas";
import { asksToStopContact } from "../lib/engine";
import { searchContent } from "../lib/search";
import { Icon } from "./icon";

export const ROUTES = [
  { id: "reply", title: "وش أرد؟", description: "وصلتك رسالة وتبي رد يناسبها.", heading: "اختر الموقف اللي صار" },
  { id: "send", title: "وش أرسل؟", description: "ودّك تبادر وتدور على الكلام المناسب.", heading: "وش ودّك تقول؟" },
  { id: "guide", title: "وش أسوي بالموقف؟", description: "موقف محيّرك وتبي تعرف كيف تتصرف.", heading: "وش الموقف اللي محيّرك؟" }
] as const;

const popular = ["miss", "sorry", "chat", "space"].map(id => CONTENT.find(situation => situation.id === id)!);

export function SiteHeader({ count, onHome, onFavorites, onProfile, active }: {
  count: number; onHome: () => void; onFavorites: () => void; onProfile: () => void; active: boolean;
}) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <button type="button" className="brand" onClick={onHome} aria-label="وش أرد؟ الرئيسية">
          <span className="brand-mark"><Icon name="brand" size={24} /></span>
          <span>وش أرد؟</span>
        </button>
        <div className="header-actions"><button type="button" className="text-button" onClick={onProfile}>ملفي في الكلام</button>
        <button type="button" className="secondary-button favorite-nav" onClick={onFavorites} aria-current={active ? "page" : undefined}>
          <Icon name="heart" size={19} /> المفضلة {count > 0 && <span className="favorite-count">{count}</span>}
        </button></div>
      </div>
    </header>
  );
}

export function Home({ onRoute, onSituation }: { onRoute: (route: Route) => void; onSituation: (situation: Situation) => void }) {
  const [query, setQuery] = useState("");
  const matches = query.trim() ? searchContent(query).slice(0, 8) : [];
  const more = (Object.keys(ROUTE_LABELS) as Route[]).filter(id => !["reply", "send", "guide"].includes(id) && CONTENT.some(s => s.canonicalRoute === id));
  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <h1 id="page-title" tabIndex={-1}>لكل موقف،<br /><span>كلام يليق فيه.</span></h1>
          <p>احتَرت وش تقول؟ اختر الموقف، وحدد أسلوبك، وخذ كلامًا يناسبك.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-orbit art-orbit-outer" /><span className="art-orbit art-orbit-inner" />
          <span className="art-spark art-spark-top"><Icon name="spark" size={26} /></span>
          <span className="art-spark art-spark-bottom"><Icon name="spark" size={20} /></span>
          <span className="art-dot" />
          <div className="envelope">
            <div className="envelope-back" />
            <div className="letter"><span>اشتقت لك</span><i /><i /><i /></div>
            <div className="envelope-fold envelope-left" />
            <div className="envelope-fold envelope-right" />
            <div className="envelope-fold envelope-bottom" />
            <div className="envelope-seal"><Icon name="heart" size={24} /></div>
          </div>
          <span className="art-message"><Icon name="reply" size={27} /></span>
        </div>
      </section>

      <section className="route-section" aria-labelledby="routes-title">
        <h2 id="routes-title">وش تحتاج اليوم؟</h2>
        <div className="route-grid">
          {ROUTES.map(route => (
            <button type="button" className={`route-card route-${route.id}`} key={route.id} onClick={() => onRoute(route.id)}>
              <span className="route-icon"><Icon name={route.id} size={26} /></span>
              <span className="route-arrow"><Icon name="arrow" size={18} /></span>
              <span className="route-title">{route.title}</span>
              <span className="route-description">{route.description}</span>
            </button>
          ))}
        </div>
      </section>

      {more.length > 0 && <section className="explore-section" aria-labelledby="explore-title"><h2 id="explore-title">استكشف أكثر</h2>
        <div className="special-routes">{more.map(id => <button type="button" className="situation-card" key={id} onClick={() => onRoute(id)}>{ROUTE_LABELS[id]}<Icon name="arrow" size={17} /></button>)}</div>
      </section>}
      <section className="popular" aria-labelledby="popular-title">
        <h2 id="popular-title"><Icon name="spark" size={17} /> مواقف شائعة</h2>
        <div className="chips">
          {popular.map(situation => (
            <button type="button" className="chip" key={situation.id} onClick={() => onSituation(situation)}>{situation.title}</button>
          ))}
        </div>
      </section>
      <section className="home-search" aria-labelledby="home-search-title"><h2 id="home-search-title">ابحث بسرعة</h2>
        <label htmlFor="home-search">موقف أو كلمة من الرسالة</label><div className="search-field"><Icon name="search" /><input id="home-search" maxLength={500} value={query} placeholder="مثل: أعتذر عن تأخري" onChange={e => setQuery(e.target.value)} /></div>
        {asksToStopContact(query) ? <p className="notice">إذا طلب الطرف الآخر وقف التواصل، توقف عن إرسال الرسائل؛ لا يلزم إرسال رد لتأكيد التوقف.</p> : query.trim() && <>
          <p role="status">{matches.length ? "أقرب المواقف المتاحة" : "ما لقينا موقفًا مطابقًا. جرّب وصفًا آخر."}</p>
          <div className="situation-grid">{matches.map(s => <button type="button" className="situation-card" key={s.id} onClick={() => onSituation(s)}>{s.title}<Icon name="arrow" size={17} /></button>)}</div>
        </>}
      </section>
    </>
  );
}
