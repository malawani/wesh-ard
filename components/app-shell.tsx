"use client";

import { useEffect, useRef, useState } from "react";
import type { Route, Situation, Stage, ToneFilter } from "../lib/catalog";
import type { Suggestion } from "../lib/engine";
import { FAVORITES_KEY, readFavorites, toggleFavorite } from "../lib/favorites";
import { Home, SiteHeader } from "./home";
import { Favorites, Results } from "./results";
import { Customization, SituationPicker } from "./wizard";

type Step = "home" | "situation" | "customize" | "results";

export function AppShell() {
  const [step, setStep] = useState<Step>("home");
  const [showFavorites, setShowFavorites] = useState(false);
  const [route, setRoute] = useState<Route>("reply");
  const [situation, setSituation] = useState<Situation | null>(null);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage>("early");
  const [tone, setTone] = useState<ToneFilter>("soft");
  const [favorites, setFavorites] = useState<Suggestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState({ message: "", event: 0 });
  const navigated = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    try { setFavorites(readFavorites(window.localStorage.getItem(FAVORITES_KEY))); } catch { /* storage can be blocked */ }
    setLoaded(true);
    function sync(event: StorageEvent) {
      if (event.key === FAVORITES_KEY || event.key === null) setFavorites(readFavorites(event.newValue));
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!loaded || !dirty.current) return;
    dirty.current = false;
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      setStatus(previous => ({ message: "المفضلة متاحة في هذه الجلسة. تعذّر الحفظ في المتصفح.", event: previous.event + 1 }));
    }
  }, [favorites, loaded]);

  useEffect(() => {
    if (!navigated.current) return;
    window.scrollTo({ top: 0 });
    document.getElementById("page-title")?.focus({ preventScroll: true });
  }, [step, showFavorites]);

  function announce(message: string) {
    setStatus(previous => ({ message, event: previous.event + 1 }));
  }

  function go(next: Step) {
    navigated.current = true;
    setShowFavorites(false);
    setStep(next);
  }

  function openRoute(nextRoute: Route) {
    setRoute(nextRoute);
    setQuery("");
    setSituation(null);
    setStage("early");
    setTone("soft");
    go("situation");
  }

  function choose(item: Situation) {
    setRoute(item.route);
    setSituation(item);
    go("customize");
  }

  function openPopular(item: Situation) {
    setQuery("");
    setStage("early");
    setTone("soft");
    choose(item);
  }

  function updateFavorite(item: Suggestion) {
    const saved = favorites.some(existing => existing.id === item.id);
    dirty.current = true;
    setFavorites(previous => toggleFavorite(previous, item));
    announce(saved ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
  }

  const actions = { favorites, onFavorite: updateFavorite, onStatus: announce };
  return (
    <>
      <SiteHeader count={favorites.length} active={showFavorites} onHome={() => go("home")} onFavorites={() => { navigated.current = true; setShowFavorites(true); }} />
      <main className="shell site-main" id="main-content">
        {showFavorites ? <Favorites {...actions} onBack={() => setShowFavorites(false)} /> : (
          <>
            {step === "home" && <Home onRoute={openRoute} onSituation={openPopular} />}
            {step === "situation" && <SituationPicker route={route} query={query} onQuery={setQuery} onChoose={choose} onBack={() => go("home")} onGuide={() => setRoute("guide")} />}
            {step === "customize" && situation && <Customization situation={situation} stage={stage} tone={tone} onStage={setStage} onTone={setTone} onBack={() => go("situation")} onSubmit={() => go("results")} />}
            {step === "results" && situation && <Results {...actions} situation={situation} stage={stage} tone={tone} onTone={setTone} onBack={() => go("customize")} onNew={() => openRoute(route)} />}
          </>
        )}
        <div className="sr-only" role="status"><span key={status.event}>{status.message}</span></div>
      </main>
    </>
  );
}
