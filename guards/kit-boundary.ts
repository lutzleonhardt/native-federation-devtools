/**
 * Kit boundary rule (T9-AC-04): the view kit renders kit-local contracts
 * only — no file under shared/kit/ may import from the store module.
 * The view-model builders of the view tasks map store types into the kit
 * contracts; the kit itself stays store-blind.
 */

export interface StoreImport {
  line: number;
  specifier: string;
}

// Matches the module specifier of an import/export-from statement.
const IMPORT_FROM = /from\s+['"]([^'"]+)['"]/;
// A store import has 'store' as a path segment (e.g. '../store/ingest').
const STORE_SEGMENT = /(^|\/)store(\/|$)/;

export function findStoreImports(content: string): StoreImport[] {
  const imports: StoreImport[] = [];
  content.split('\n').forEach((text, index) => {
    const match = IMPORT_FROM.exec(text);
    if (match && STORE_SEGMENT.test(match[1])) {
      imports.push({ line: index + 1, specifier: match[1] });
    }
  });
  return imports;
}
