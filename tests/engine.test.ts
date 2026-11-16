import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { CATALOG, type Stage } from "../lib/catalog";
import { asksToStopContact, getSuggestions, normalizeArabic, searchSituations, suggestSituation, TONES } from "../lib/engine";
import { readFavorites, toggleFavorite } from "../lib/favorites";

const love = CATALOG.find(item => item.id === "love")!;
const space = CATALOG.find(item => item.id === "space")!;

describe("Catalog integrity", () => {
  it("contains exactly 30 situations", () => assert.equal(CATALOG.length, 30));

  it("contains 10 situations per route", () => {
    for (const route of ["reply", "send", "guide"]) {
      assert.equal(CATALOG.filter(item => item.route === route).length, 10);
    }
  });

  it("has unique situation IDs", () => {
    assert.equal(new Set(CATALOG.map(item => item.id)).size, CATALOG.length);
  });

  it("contains exactly 180 response entries and two per tone", () => {
    const entries = CATALOG.flatMap(item => TONES.flatMap(tone => {
      assert.equal(item.responses[tone].length, 2);
      return item.responses[tone];
    }));
    assert.equal(entries.length, 180);
  });

  it("has no empty responses", () => {
    for (const item of CATALOG) for (const tone of TONES) for (const phrase of item.responses[tone]) {
      assert.ok(phrase.trim());
    }
  });

  it("has tips and cautions for all situations", () => {
    for (const item of CATALOG) {
      assert.ok(item.tip.trim());
      assert.ok(item.avoid.trim());
    }
  });
});

describe("Arabic text normalization", () => {
  it("normalizes Arabic letter variants", () => assert.equal(normalizeArabic("إشتِقت"), "اشتقت"));
  it("removes punctuation and tatweel", () => assert.equal(normalizeArabic("أحــبك!!!"), "احبك"));
  it("normalizes spaces", () => assert.equal(normalizeArabic("  اشتقت   لك  "), "اشتقت لك"));
  it("matches ة with ه", () => assert.equal(normalizeArabic("مَساحة"), "مساحه"));
});

describe("Situation search", () => {
  it("finds longing situations", () => {
    assert.ok(searchSituations("اشتقت", "reply").some(item => item.id === "miss"));
  });

  it("finds a situation from casual text", () => {
    assert.equal(suggestSituation("قالت لي اشتقت لك", "reply")?.id, "miss");
    assert.equal(suggestSituation("والله وحشتيني", "reply")?.id, "miss");
  });

  it("does not return other routes", () => {
    const results = searchSituations("صباح", "send");
    assert.ok(results.length);
    assert.ok(results.every(item => item.route === "send"));
  });

  it("returns null when no match exists", () => {
    assert.equal(suggestSituation("xyz-unmatched-input-928", "reply"), null);
  });

  it("prefers a specific question over its generic terms", () => {
    assert.equal(suggestSituation("قالت ليه معجب فيني", "reply")?.id, "why");
    assert.equal(suggestSituation("ليه", "reply"), null);
  });

  it("recognizes a refusal without suggesting a romantic reply", () => {
    assert.equal(suggestSituation("قالت ما أحبك", "reply"), null);
    assert.equal(suggestSituation("قالت ما أحبك", "guide")?.id, "reject");
  });

  it("treats an explicit request to stop as a boundary", () => {
    const message = "قالت لا تتواصل معي، اشتقت لك بس";
    assert.ok(asksToStopContact(message));
    assert.equal(suggestSituation(message, "guide")?.id, "space");
    assert.deepEqual(searchSituations(message, "reply"), []);
  });

  it("provides all ten manual options for a blank search", () => {
    assert.equal(searchSituations("   ", "send").length, 10);
  });
});

describe("Response selection", () => {
  it("returns two responses per tone", () => {
    assert.equal(getSuggestions(love, "love", "direct").length, 2);
  });

  it("adjusts romantic direct replies for early dating", () => {
    assert.ok(getSuggestions(love, "early", "direct").every(item => !item.text.includes("أحبك")));
  });

  it("keeps clear boundaries in sensitive situations", () => {
    const results = getSuggestions(space, "early", "direct");
    assert.equal(results.length, 2);
    assert.ok(results.some(item => item.text.includes("أحترم")));
  });

  it("does not duplicate suggestions when showing all", () => {
    const ids = getSuggestions(love, "early", "all").map(item => item.id);
    assert.equal(new Set(ids).size, 6);
  });

  it("assigns distinct stable IDs when the same tone changes by stage", () => {
    const stages: Stage[] = ["early", "mutual", "love", "serious"];
    const replies = stages.flatMap(stage => getSuggestions(love, stage, "direct"));
    assert.equal(new Set(replies.map(item => item.id)).size, 8);
    assert.equal(new Set(replies.map(item => item.text)).size, 8);
  });

  it("keeps every tone populated for every stage and situation", () => {
    const stages: Stage[] = ["early", "mutual", "love", "serious"];
    for (const stage of stages) for (const item of CATALOG) {
      const results = getSuggestions(item, stage, "all");
      assert.equal(results.length, 6);
      assert.equal(new Set(results.map(result => result.text)).size, 6);
      for (const tone of TONES) assert.equal(results.filter(result => result.tone === tone).length, 2);
    }
  });
});

describe("Favorites storage", () => {
  const [item] = getSuggestions(love, "early", "direct");

  it("preserves saved phrases after reloading and removes them by stable ID", () => {
    const saved = toggleFavorite([], item);
    assert.deepEqual(readFavorites(JSON.stringify(saved)), [item]);
    assert.deepEqual(toggleFavorite(saved, item), []);
  });

  it("ignores invalid data and duplicate IDs", () => {
    assert.deepEqual(readFavorites("{invalid"), []);
    assert.deepEqual(readFavorites(null), []);
    assert.deepEqual(readFavorites(JSON.stringify([item, item, { id: "bad" }, null])), [item]);
  });
});
