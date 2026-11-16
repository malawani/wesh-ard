import { CATALOG, type Route, type Situation } from "../lib/catalog";
import { Icon } from "./icon";

export const ROUTES = [
  { id: "reply", title: "وش أرد؟", description: "وصلتك رسالة وتبي رد يناسبها.", heading: "اختر الموقف اللي صار" },
  { id: "send", title: "وش أرسل؟", description: "ودّك تبادر وتدور على الكلام المناسب.", heading: "وش ودّك تقول؟" },
  { id: "guide", title: "وش أسوي بالموقف؟", description: "موقف محيّرك وتبي تعرف كيف تتصرف.", heading: "وش الموقف اللي محيّرك؟" }
] as const;

const popular = ["miss", "sorry", "chat", "space"].map(id => CATALOG.find(situation => situation.id === id)!);

export function SiteHeader({ count, onHome, onFavorites, active }: {
  count: number; onHome: () => void; onFavorites: () => void; active: boolean;
}) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <button type="button" className="brand" onClick={onHome} aria-label="وش أرد؟ الرئيسية">
          <span className="brand-mark"><Icon name="brand" size={24} /></span>
          <span>وش أرد؟</span>
        </button>
        <button type="button" className="secondary-button favorite-nav" onClick={onFavorites} aria-current={active ? "page" : undefined}>
          <Icon name="heart" size={19} /> المفضلة {count > 0 && <span className="favorite-count">{count}</span>}
        </button>
      </div>
    </header>
  );
}

export function Home({ onRoute, onSituation }: { onRoute: (route: Route) => void; onSituation: (situation: Situation) => void }) {
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

      <section className="popular" aria-labelledby="popular-title">
        <h2 id="popular-title"><Icon name="spark" size={17} /> مواقف شائعة</h2>
        <div className="chips">
          {popular.map(situation => (
            <button type="button" className="chip" key={situation.id} onClick={() => onSituation(situation)}>{situation.title}</button>
          ))}
        </div>
      </section>
    </>
  );
}
