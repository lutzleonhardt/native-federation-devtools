/**
 * Structured collection errors with caps. Ported from the research
 * collector (errors.js). Every error that crosses the page boundary is
 * re-projected through `projectCollectionError` so that page-controlled
 * error objects cannot smuggle arbitrary data into a snapshot.
 */
import { DEFAULT_LIMITS, type CollectorLimits } from './constants';

export type CollectionErrorDetail =
  | string
  | number
  | boolean
  | null
  | { [key: string]: CollectionErrorDetail };

export interface CollectionError {
  stage: string;
  code: string;
  detail?: CollectionErrorDetail;
}

const TOKEN_PATTERN = /^[a-z0-9][a-z0-9._-]*$/u;

export function createCollectionError(
  stage: unknown,
  code: unknown,
  detail?: unknown,
): CollectionError {
  const error: CollectionError = {
    stage: safeToken(stage, 'collector'),
    code: safeToken(code, 'unknown'),
  };

  const safeDetail = projectErrorDetail(detail, 0, new WeakSet());
  if (safeDetail !== undefined) {
    error.detail = safeDetail;
  }

  return error;
}

export function appendError(
  errors: CollectionError[],
  limits: CollectorLimits,
  stage: string,
  code: string,
  detail?: unknown,
): void {
  if (errors.length < limits.maxErrors) {
    errors.push(createCollectionError(stage, code, detail));
  }
}

/** Re-projects an untrusted error-shaped value into a bounded CollectionError. */
export function projectCollectionError(value: unknown): CollectionError {
  const stage = readData(value, 'stage');
  const code = readData(value, 'code');
  const detail = readData(value, 'detail');
  return createCollectionError(stage, code, detail);
}

function safeToken(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const bounded = value.slice(0, 80).toLowerCase();
  return TOKEN_PATTERN.test(bounded) ? bounded : fallback;
}

function projectErrorDetail(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): CollectionErrorDetail | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.slice(0, DEFAULT_LIMITS.maxErrorDetailLength);
  }
  if (typeof value === 'boolean' || value === null) {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (depth >= 2 || (typeof value !== 'object' && typeof value !== 'function')) {
    return undefined;
  }
  if (seen.has(value)) {
    return '[cycle]';
  }
  seen.add(value);

  const output: { [key: string]: CollectionErrorDetail } = {};
  let keys: string[];
  try {
    keys = Object.keys(value).slice(0, 12);
  } catch {
    return '[unavailable]';
  }
  for (const key of keys) {
    if (!isSafeDetailKey(key)) {
      continue;
    }
    const item = readData(value, key);
    const projected = projectErrorDetail(item, depth + 1, seen);
    if (projected !== undefined) {
      output[key] = projected;
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function isSafeDetailKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length <= 64 &&
    key !== '__proto__' &&
    key !== 'prototype' &&
    key !== 'constructor' &&
    !/[\u0000-\u001f\u007f]/u.test(key)
  );
}

function readData(value: unknown, key: string): unknown {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return undefined;
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && 'value' in descriptor ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}
