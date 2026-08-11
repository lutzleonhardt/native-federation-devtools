/**
 * Minimal semver ordering for concrete version tags — the registry stores
 * resolved versions ('18.3.1'), never ranges, so this is a comparator,
 * not a range evaluator. Non-semver tags order after every semver tag,
 * among themselves lexicographically; the store sorts version rows itself
 * because the registry's same-tag tie order is not reliable.
 */
const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** Ascending semver order; use `compareSemver(b, a)` for descending. */
export function compareSemver(a: string, b: string): number {
  const parsedA = SEMVER_PATTERN.exec(a);
  const parsedB = SEMVER_PATTERN.exec(b);
  if (parsedA === null || parsedB === null) {
    if (parsedA === null && parsedB === null) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    return parsedA === null ? -1 : 1;
  }
  for (let part = 1; part <= 3; part += 1) {
    const difference = Number(parsedA[part]) - Number(parsedB[part]);
    if (difference !== 0) {
      return difference;
    }
  }
  return comparePrerelease(parsedA[4], parsedB[4]);
}

/** Semver rule: a release outranks any prerelease of the same triple. */
function comparePrerelease(a: string | undefined, b: string | undefined): number {
  if (a === undefined || b === undefined) {
    return a === b ? 0 : a === undefined ? 1 : -1;
  }
  const partsA = a.split('.');
  const partsB = b.split('.');
  const shared = Math.min(partsA.length, partsB.length);
  for (let index = 0; index < shared; index += 1) {
    const partA = partsA[index];
    const partB = partsB[index];
    const numericA = /^\d+$/.test(partA);
    const numericB = /^\d+$/.test(partB);
    if (numericA && numericB) {
      const difference = Number(partA) - Number(partB);
      if (difference !== 0) {
        return difference;
      }
    } else if (numericA !== numericB) {
      // Numeric identifiers always rank below alphanumeric ones.
      return numericA ? -1 : 1;
    } else if (partA !== partB) {
      return partA < partB ? -1 : 1;
    }
  }
  return partsA.length - partsB.length;
}
