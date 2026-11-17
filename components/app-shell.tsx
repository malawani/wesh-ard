"use client";
import { useEffect, useRef, useState } from "react";
import type { RouteId, SituationContent } from "../content/schemas";
import { FAVORITES_V2_KEY, migrateFavorites, parseFavorites, saveFavorites, type FavoriteItem } from "../lib/storage/favorites-v2";
import { Home, SiteHeader } from "./home";
import { Favorites, Results } from "./results";
import { Customization, SituationPicker, type Choices } from "./wizard";
import { ProfilePage } from "./profile";
import { DEFAULT_PROFILE, PROFILE_KEY, FEEDBACK_KEY, readProfile, readFeedback, persistPersonalization, type Profile, type Feedback, type Rating } from "../lib/storage/personalization";
import { availableTones } from "../lib/recommendation";

type Step = "home" | "situation" | "customize" | "results";
const defaults: Choices = { stage: "getting_to_know", tone: "casual", intensity: 1, length: "all" };
export function AppShell() {
  const [step, setStep] = useState<Step>("home");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [feedback, setFeedback] = useState<Feedback>({});
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
      const savedProfile = readProfile(window.localStorage.getItem(PROFILE_KEY));
      setProfile(savedProfile);
      if (savedProfile.saveFeedback) setFeedback(readFeedback(window.localStorage.getItem(FEEDBACK_KEY)));
    } catch { /* Preferences remain in this session. Favorites have a separate warning. */ }
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
  }, [step, showFavorites, showProfile]);
  function go(next: Step) { navigated.current = true; setShowProfile(false); setShowFavorites(false); setStep(next); }
  function preferredChoices(): Choices { return { stage: "getting_to_know", tone: profile.tone, intensity: profile.intensity, length: profile.length }; }
  function openRoute(next: RouteId) { setRoute(next); setQuery(""); setSituation(null); setChoices(preferredChoices()); go("situation"); }
  function choose(item: SituationContent) {
    setRoute(item.canonicalRoute); setSituation(item);
    setChoices(previous => ({ ...previous, context: undefined, tone: previous.tone === "all" || availableTones(item.id, previous.stage).includes(previous.tone) ? previous.tone : "all" }));
    go("customize");
  }
  function saveProfile(next: Profile) {
    setProfile(next);
    let saved = false;
    try {
      saved = persistPersonalization(window.localStorage, PROFILE_KEY, next);
      if (next.saveFeedback) saved = persistPersonalization(window.localStorage, FEEDBACK_KEY, feedback) && saved;
      else window.localStorage.removeItem(FEEDBACK_KEY);
    } catch { saved = false; }
    if (!saved) setStorageWarning("تفضيلاتك متاحة لهذه الجلسة فقط؛ تعذّر تأكيد حفظها محليًا.");
    announce(saved ? "تم حفظ تفضيلاتك في هذا المتصفح" : "تفضيلاتك متاحة لهذه الجلسة فقط");
    return saved;
  }
  function rate(id: string, rating: Rating) {
    const next = { ...feedback };
    if (next[id] === rating) delete next[id]; else next[id] = rating;
    setFeedback(next);
    if (profile.saveFeedback) {
      let saved = false;
      try { saved = persistPersonalization(window.localStorage, FEEDBACK_KEY, next); } catch { /* blocked storage */ }
      if (!saved) setStorageWarning("تقييماتك متاحة لهذه الجلسة؛ تعذّر حفظها في المتصفح.");
    }
    announce(rating === "liked" ? "تم تحديث إعجابك بالعبارة" : "تم تحديث تفضيلك لأسلوب مختلف");
  }
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
    <SiteHeader count={favorites.length} active={showFavorites} onHome={() => go("home")} onProfile={() => { navigated.current = true; setShowFavorites(false); setShowProfile(true); }} onFavorites={() => { navigated.current = true; setShowProfile(false); setShowFavorites(true); }} />
    <main className="shell site-main" id="main-content">
      {storageWarning && <p className="notice" role="status">{storageWarning}</p>}
      {showProfile ? <ProfilePage value={profile} onSave={saveProfile} onBack={() => setShowProfile(false)} /> : showFavorites ? <Favorites {...actions} onBack={() => setShowFavorites(false)} /> : <>
        {step === "home" && <Home onRoute={openRoute} onSituation={item => { setChoices(preferredChoices()); choose(item); }} />}
        {step === "situation" && <SituationPicker route={route} query={query} onQuery={setQuery} onChoose={choose} onBack={() => go("home")} onGuide={() => setRoute("guide")} />}
        {step === "customize" && situation && <Customization situation={situation} choices={choices} onChange={setChoices} onBack={() => go("situation")} onSubmit={() => go("results")} />}
        {step === "results" && situation && <Results {...actions} feedback={feedback} onRate={rate} reduceExaggeration={profile.reduceExaggeration} situation={situation} choices={choices} onChange={setChoices} onBack={() => go("customize")} onNew={() => openRoute(route)} />}
      </>}
      <div className="sr-only" role="status"><span key={status.event}>{status.message}</span></div>
    </main>
  </>;
}
