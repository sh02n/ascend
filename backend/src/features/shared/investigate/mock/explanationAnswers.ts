export const explanationAnswers: Record<string, string> = {
  "Why is this review ring suspicious?":
    "The strongest indicators are the unusually concentrated review timing, limited reviewer history, high review similarity, and almost exclusive interaction with a single product.",
  "Which evidence contributed most?":
    "The review burst contributed most because 73 reviews from 18 reviewers appeared within 12 minutes for one ASIN. The 4.97 average rating and similar review text strengthen that signal.",
  "Could this be a legitimate promotion?":
    "It could be, especially if there was a documented campaign or influencer launch. The risk remains high because legitimate promotions usually produce more varied timing, ratings, and review language.",
  "What evidence is still missing?":
    "The main gaps are verified purchase status, shipping confirmation, longer reviewer histories, and reviewer device metadata. These would help separate genuine customers from coordinated review accounts.",
  "Why recommend suppressing reviews?":
    "Suppressing reviews limits ranking manipulation while the trust and safety team verifies whether the reviews came from real, independent customers. It is a reversible containment step.",
  "What would lower the risk score?":
    "The score would fall if the reviews were verified purchases, shipment records confirmed delivery, reviewer histories showed normal diverse activity, and text similarity dropped after deduplication.",
};
