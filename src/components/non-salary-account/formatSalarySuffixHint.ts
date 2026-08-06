import {
  RECOMMENDATION_FALLBACK_BODY,
} from './constants';

/**
 * Joins one or more last-4-digit salary suffixes into a quoted hint string.
 * Returns `null` when no usable suffixes are provided so callers can fall back
 * to generic copy instead of rendering an empty trailing phrase.
 *
 * Examples:
 *   ['1234']          -> '"1234"'
 *   ['1234', '4678']  -> '"1234" or "4678"'
 *   ['1', '2', '3']   -> '"1", "2" or "3"'
 */
export function formatSalarySuffixHint(suffixes: string[]): string | null {
  const cleaned = suffixes
    .map((suffix) => suffix.trim())
    .filter((suffix) => suffix.length > 0);

  if (cleaned.length === 0) return null;

  const quoted = cleaned.map((suffix) => `"${suffix}"`);
  if (quoted.length === 1) return quoted[0];
  if (quoted.length === 2) return `${quoted[0]} or ${quoted[1]}`;

  const head = quoted.slice(0, -1).join(', ');
  const tail = quoted[quoted.length - 1];
  return `${head} or ${tail}`;
}

/**
 * Builds the user-facing recommendation body shown in the success callout.
 * Falls back to a generic message when the backend returns no suffixes.
 */
export function buildRecommendationMessage(suffixes: string[]): string {
  const hint = formatSalarySuffixHint(suffixes);
  if (!hint) return RECOMMENDATION_FALLBACK_BODY;
  return `${RECOMMENDATION_FALLBACK_BODY}, use your salary account ending with ${hint}.`;
}
