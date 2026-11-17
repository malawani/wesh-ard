import { REPLY_EXPANSION_03 } from "./batches/reply-expansion-03";
import { REPLY_EXPANSION_02 } from "./batches/reply-expansion-02";
import { REPLY_EXPANSION_01 } from "./batches/reply-expansion-01";
import { GUIDE_LEGACY_B } from "./batches/guide-legacy-b";
import { GUIDE_LEGACY_A } from "./batches/guide-legacy-a";
import { messageLength, type ResponseContent, type SituationContent } from "../schemas";
import { SEND_LEGACY_C } from "./batches/send-legacy-c";
import { SEND_LEGACY_B } from "./batches/send-legacy-b";
import { SEND_LEGACY_A } from "./batches/send-legacy-a";
import { REPLY_LEGACY_REST } from "./batches/reply-legacy-rest";
import { REPLY_LEGACY_REVIEWS } from "./batches/reply-legacy";
import type { EditorialReview } from "./types";
export const EDITORIAL_REVIEWS: EditorialReview[] = [...REPLY_LEGACY_REVIEWS, ...REPLY_LEGACY_REST, ...SEND_LEGACY_A, ...SEND_LEGACY_B, ...SEND_LEGACY_C, ...GUIDE_LEGACY_A, ...GUIDE_LEGACY_B, ...REPLY_EXPANSION_01, ...REPLY_EXPANSION_02, ...REPLY_EXPANSION_03];
export const REVIEWS_BY_ID = new Map(EDITORIAL_REVIEWS.map(r => [r.id,r]));
if (REVIEWS_BY_ID.size !== EDITORIAL_REVIEWS.length) throw new Error("Duplicate editorial review IDs");
export function isKnownEarlierText(id: string, text: string): boolean {
  const review = REVIEWS_BY_ID.get(id);
  return review?.sourceText === text;
}
export function reviewedTextMatches(id: string, text: string): boolean {
  const review = REVIEWS_BY_ID.get(id);
  return Boolean(review && (review.sourceText === text || review.finalText === text));
}
export function applyEditorial(situation: SituationContent): SituationContent {
  return { ...situation, replies: situation.replies.map((r): ResponseContent => {
    const review = REVIEWS_BY_ID.get(r.id);
    if (!review) return r;
    if (r.text !== review.sourceText && r.text !== review.finalText) throw new Error(`Stale review for ${r.id}`);
    return { ...r, ...review.classification, text: review.finalText, length: messageLength(review.finalText), analysis: review.analysis };
  }) };
}
