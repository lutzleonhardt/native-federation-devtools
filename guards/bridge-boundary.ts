/**
 * Bridge boundary rule (contributes to XC-03): only the devtools-bridge
 * library and the plain-JS extension bootstrap may reference `chrome.*`.
 */

export interface ChromeReference {
  line: number;
  text: string;
}

// Matches `chrome.<identifier>` API access; deliberately does not match
// `chrome-extension://` URLs.
const CHROME_API = /\bchrome\s*\.\s*[A-Za-z_$]/;

export function findChromeReferences(content: string): ChromeReference[] {
  const references: ChromeReference[] = [];
  content.split('\n').forEach((text, index) => {
    if (CHROME_API.test(text)) {
      references.push({ line: index + 1, text: text.trim() });
    }
  });
  return references;
}
