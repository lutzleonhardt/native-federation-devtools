import type { RegistryEvidenceId } from './model';

export type RegistryIdTuplePart = string | number | boolean | null;

/** JSON array encoding is structural: delimiters and control characters stay unambiguous. */
export function encodeRegistryIdTuple(parts: readonly RegistryIdTuplePart[]): string {
  return JSON.stringify(parts);
}

/** Builds a branded ID whose final tuple element is the equal-key occurrence ordinal. */
export function registryEvidenceId<Kind extends string>(
  kind: Kind,
  key: readonly RegistryIdTuplePart[],
  ordinal: number,
): RegistryEvidenceId<Kind> {
  return `${kind}:${encodeRegistryIdTuple([...key, ordinal])}` as RegistryEvidenceId<Kind>;
}

/** Returns the next source-order ordinal for a structural key without collapsing records. */
export function nextEqualKeyOrdinal(
  occurrences: Map<string, number>,
  key: readonly RegistryIdTuplePart[],
): number {
  const encoded = encodeRegistryIdTuple(key);
  const ordinal = occurrences.get(encoded) ?? 0;
  occurrences.set(encoded, ordinal + 1);
  return ordinal;
}
