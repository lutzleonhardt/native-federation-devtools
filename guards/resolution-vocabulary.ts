/**
 * Resolution vocabulary rule (T11-AC-05, contributes to XC-06): the
 * resolution UI states what the captured registry and import map prove —
 * declarations, mappings, resolutions, sources. It never claims delivery
 * (what the browser loaded, fetched, or executed) or cost (bytes, cache
 * hits): the capture holds no such evidence.
 *
 * Templates are scanned as rendered text (HTML comments excluded); sources
 * are scanned in their string literals only, so doctrine comments that
 * NAME the forbidden words stay legal.
 */
import { lineOf, splitSourceLayers, stripHtmlComments } from './source-text';

export const FORBIDDEN_VOCABULARY =
  /\b(served by|loaded|delivered|downloaded|fetched|executed|wire cost|byte size|cache hit)\b/gi;

export type VocabularyFileKind = 'template' | 'source';

export interface VocabularyViolation {
  line: number;
  term: string;
  text: string;
}

export function findVocabularyViolations(
  content: string,
  kind: VocabularyFileKind,
): VocabularyViolation[] {
  const haystack =
    kind === 'template' ? stripHtmlComments(content) : splitSourceLayers(content).strings;
  const lines = content.split('\n');
  const violations: VocabularyViolation[] = [];
  for (const match of haystack.matchAll(FORBIDDEN_VOCABULARY)) {
    const line = lineOf(haystack, match.index);
    violations.push({ line, term: match[0], text: lines[line - 1].trim() });
  }
  return violations;
}
