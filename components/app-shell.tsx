"use client";
import { useEffect, useRef, useState } from "react";
import type { RouteId, SituationContent } from "../content/schemas";
import { FAVORITES_V2_KEY, migrateFavorites, parseFavorites, saveFavorites, type FavoriteItem } from "../lib/storage/favorites-v2";
import { Home, SiteHeader } from "./home";
import { Favorites, Results } from "./results";
import { Customization, SituationPicker, type Choices } from "./wizard";

type Step = "home" | "situation" | "customize" | "results";
const defaults: Choices = { stage: "getting_to_know", tone: "casual", intensity: 1, length: "all" };
export function AppShell() {
  const [step, setStep] = useState<Step>("home");
  const [showFavorites, setShowFavorites] = useState(false);
  const [route, setRoute] = useState<RouteId>("reply");
  const [situation, setSituation] = useState<SituationContent | null>(null);
  const [query, setQuery] = useState("");
  const [choices, setChoices] = useState<Choices>(defaults);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState({ message: "", event: 0 });
  const [storageWarning, setStorageWarning] = useState("");
  const navigated = useRef(false);
  const writable = useRef(true);
  function announce(message: string) { setStatus(s => ({ message, event: s.event + 1 })); }
  useEffect(() => {
    try {
      const migration = migrateFavorites(window.localStorage);
      setFavorites(migration.items);
      if (!migration.persisted) {
        writable.current = false;
        setStorageWarning("تعذّر تأكيد حفظ المفضلة. ستبقى تغييراتك لهذه الجلسة، ولم نحذف البيانات القديمة.");
      }
    } catch {
      writable.current = false;
      setStorageWarning("المتصفح لا يسمح بالحفظ المحلي. المفضلة متاحة لهذه الجلسة.");
    }
    setLoaded(true);
    function sync(event: StorageEvent) {
      if (event.key === FAVORITES_V2_KEY || event.key === null) setFavorites(parseFavorites(event.newValue));
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!navigated.current) return;
    window.scrollTo({ top: 0 });
    document.getElementById("page-title")?.focus({ preventScroll: true });
  }, [step, showFavorites]);
  function go(next: Step) { navigated.current = true; setShowFavorites(false); setStep(next); }
  function openRoute(next: RouteId) { setRoute(next); setQuery(""); setSituation(null); setChoices(defaults); go("situation"); }
  function choose(item: SituationContent) { setRoute(item.canonicalRoute); setSituation(item); go("customize"); }
  function updateFavorite(item: FavoriteItem) {
    if (!loaded) return;
    const saved = favorites.some(f => f.id === item.id);
    const next = saved ? favorites.filter(f => f.id !== item.id) : [item, ...favorites];
    setFavorites(next);
    let persisted = false;
    try { persisted = writable.current && saveFavorites(window.localStorage, next); } catch { /* blocked storage */ }
    if (!persisted) setStorageWarning("تغيّر المفضلة لهذه الجلسة فقط؛ تعذّر تأكيد الحفظ في المتصفح.");
    announce(saved ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
  }
  const actions = { favorites, onFavorite: updateFavorite, onStatus: announce, storageReady: loaded };
  return <>
    <SiteHeader count={favorites.length} active={showFavorites} onHome={() => go("home")} onFavorites={() => { navigated.current = true; setShowFavorites(true); }} />
    <main className="shell site-main" id="main-content">
      {storageWarning && <p className="notice" role="status">{storageWarning}</p>}
      {showFavorites ? <Favorites {...actions} onBack={() => setShowFavorites(false)} /> : <>
        {step === "home" && <Home onRoute={openRoute} onSituation={item => { setChoices(defaults); choose(item); }} />}
        {step === "situation" && <SituationPicker route={route} query={query} onQuery={setQuery} onChoose={choose} onBack={() => go("home")} onGuide={() => setRoute("guide")} />}
        {step === "customize" && situation && <Customization situation={situation} choices={choices} onChange={setChoices} onBack={() => go("situation")} onSubmit={() => go("results")} />}
        {step === "results" && situation && <Results {...actions} situation={situation} choices={choices} onChange={setChoices} onBack={() => go("customize")} onNew={() => openRoute(route)} />}
      </>}
      <div className="sr-only" role="status"><span key={status.event}>{status.message}</span></div>
    </main>
  </>;
}
