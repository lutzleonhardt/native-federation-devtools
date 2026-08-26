/**
 * Shared text helpers of the source-scanning guards.
 *
 * `splitSourceLayers` is a single-pass tokenizer over a TypeScript source
 * that separates what the file SAYS (string literals) from what it DOES
 * (code) and what it DOCUMENTS (comments). Both returned layers keep every
 * newline and the character offsets of what they retain, so line numbers
 * stay stable. Known limits, accepted for a guard: template-literal
 * `${...}` interpolations are treated as string text (a nested backtick
 * inside one would end the literal early), and a regex literal is only
 * recognised through the escaped-slash rule below.
 */

export interface SourceLayers {
  /** Comments blanked; code and string literals intact (import specifiers stay readable). */
  code: string;
  /** Everything but string literals (quotes and contents) blanked. */
  strings: string;
}

type State = 'code' | 'line-comment' | 'block-comment' | 'single' | 'double' | 'template';

const QUOTE: Record<'single' | 'double' | 'template', string> = {
  single: "'",
  double: '"',
  template: '`',
};

export function splitSourceLayers(source: string): SourceLayers {
  const code: string[] = [];
  const strings: string[] = [];
  const emit = (char: string, toCode: boolean, toStrings: boolean): void => {
    const keep = char === '\n';
    code.push(keep || toCode ? char : ' ');
    strings.push(keep || toStrings ? char : ' ');
  };

  let state: State = 'code';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    switch (state) {
      case 'code': {
        // A `//` is a comment start unless it follows `\` (regex literal
        // `\/\//`) or `:` (a bare URL in code); strings are handled below.
        const previous = index > 0 ? source[index - 1] : '';
        if (char === '/' && next === '/' && previous !== '\\' && previous !== ':') {
          state = 'line-comment';
          emit(char, false, false);
        } else if (char === '/' && next === '*') {
          state = 'block-comment';
          emit(char, false, false);
          emit(next, false, false);
          index += 1;
        } else if (char === "'" || char === '"' || char === '`') {
          state = char === "'" ? 'single' : char === '"' ? 'double' : 'template';
          emit(char, true, true);
        } else {
          emit(char, true, false);
        }
        index += 1;
        break;
      }
      case 'line-comment': {
        if (char === '\n') {
          state = 'code';
        }
        emit(char, false, false);
        index += 1;
        break;
      }
      case 'block-comment': {
        if (char === '*' && next === '/') {
          state = 'code';
          emit(char, false, false);
          emit(next, false, false);
          index += 2;
        } else {
          emit(char, false, false);
          index += 1;
        }
        break;
      }
      case 'single':
      case 'double':
      case 'template': {
        if (char === '\\' && index + 1 < source.length) {
          emit(char, true, true);
          emit(next, true, true);
          index += 2;
        } else {
          if (char === QUOTE[state] || (char === '\n' && state !== 'template')) {
            // Closing quote, or an unterminated line string — recover.
            state = 'code';
          }
          emit(char, true, true);
          index += 1;
        }
        break;
      }
    }
  }
  return { code: code.join(''), strings: strings.join('') };
}

/** Blank every character of `text` except newlines — keeps line numbers. */
function blank(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

/** Replace HTML comments with whitespace, keeping line numbers. */
export function stripHtmlComments(template: string): string {
  return template.replace(/<!--[\s\S]*?-->/g, blank);
}

/** 1-based line of a character offset. */
export function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
}
