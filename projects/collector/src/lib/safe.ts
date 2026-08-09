/**
 * Defensive read routines for untrusted values. Ported from the research
 * collector (safe.js).
 *
 * The precise guarantee these helpers give (and the only one that is
 * technically enforceable): values are read exclusively at descriptor
 * level — accessor properties are skipped, never invoked, and nothing is
 * ever written. Proxies are transparent in JavaScript and cannot be
 * detected; a proxied value observes our descriptor reads and `Object.keys`
 * calls through its traps. What the helpers guarantee against a proxy is
 * containment, not invisibility: every access is wrapped, a throwing trap
 * becomes a structured collection error instead of an escaping throw, and
 * caps bound how much a hostile value can feed us.
 *
 * Known duplication: the fixed probe sources (passive-probe.ts,
 * shim-map-probe.ts) inline private copies of these routines because a
 * single eval expression cannot import anything. A behavioral change here
 * usually needs mirroring there — the passivity harness covers both sides.
 */
import { appendError, type CollectionError } from './errors';
import type { CollectorLimits } from './constants';

const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/u;
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export interface SafeContext {
  limits: CollectorLimits;
  errors: CollectionError[];
  stage: string;
  path?: string;
  state?: { entries: number };
}

export type ReadResult =
  | { status: 'invalid' | 'missing' | 'accessor' | 'error' }
  | { status: 'data'; value: unknown };

export function isObjectLike(value: unknown): value is object {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

export function readDataProperty(value: unknown, key: string, context?: SafeContext): ReadResult {
  if (!isObjectLike(value)) {
    return { status: 'invalid' };
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      return { status: 'missing' };
    }
    if (!('value' in descriptor)) {
      if (context) {
        appendError(context.errors, context.limits, context.stage, 'accessor-skipped', {
          path: context.path ? `${context.path}.${key}` : String(key),
        });
      }
      return { status: 'accessor' };
    }
    return { status: 'data', value: descriptor.value };
  } catch {
    if (context) {
      appendError(context.errors, context.limits, context.stage, 'property-unavailable', {
        path: context.path ? `${context.path}.${key}` : String(key),
      });
    }
    return { status: 'error' };
  }
}

export function dataValue(value: unknown, key: string, context?: SafeContext): unknown {
  const result = readDataProperty(value, key, context);
  return result.status === 'data' ? result.value : undefined;
}

export function safeOwnKeys(value: unknown, context?: SafeContext): string[] {
  if (!isObjectLike(value)) {
    return [];
  }
  let keys: string[];
  try {
    keys = Object.keys(value);
  } catch {
    if (context) {
      appendError(context.errors, context.limits, context.stage, 'keys-unavailable', {
        path: context.path,
      });
    }
    return [];
  }

  const remaining = context?.state
    ? Math.max(0, context.limits.maxEntries - context.state.entries)
    : keys.length;
  const maximum = Math.min(context?.limits.maxObjectKeys ?? keys.length, remaining);
  if (context && keys.length > maximum) {
    appendError(context.errors, context.limits, context.stage, 'object-key-limit', {
      path: context.path,
      observed: keys.length,
      retained: maximum,
    });
  }
  const retained = keys.slice(0, maximum).filter(isSafeDynamicKey);
  if (context?.state) {
    context.state.entries += retained.length;
  }
  return retained;
}

export function safeArrayLength(value: unknown, context?: SafeContext): number | null {
  let isArray = false;
  try {
    isArray = Array.isArray(value);
  } catch {
    if (context) {
      appendError(context.errors, context.limits, context.stage, 'array-unavailable', {
        path: context.path,
      });
    }
    return null;
  }
  if (!isArray) {
    return null;
  }
  const lengthResult = readDataProperty(value, 'length', context);
  if (
    lengthResult.status !== 'data' ||
    typeof lengthResult.value !== 'number' ||
    !Number.isSafeInteger(lengthResult.value) ||
    lengthResult.value < 0
  ) {
    return null;
  }
  const remaining = context?.state
    ? Math.max(0, context.limits.maxEntries - context.state.entries)
    : lengthResult.value;
  const maximum = Math.min(context?.limits.maxArrayItems ?? lengthResult.value, remaining);
  if (context && lengthResult.value > maximum) {
    appendError(context.errors, context.limits, context.stage, 'array-item-limit', {
      path: context.path,
      observed: lengthResult.value,
      retained: maximum,
    });
  }
  const retained = Math.min(lengthResult.value, maximum);
  if (context?.state) {
    context.state.entries += retained;
  }
  return retained;
}

export function boundedString(
  value: unknown,
  context?: SafeContext,
  code = 'string-limit',
): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const maximum = context?.limits.maxStringLength ?? value.length;
  if (context && value.length > maximum) {
    appendError(context.errors, context.limits, context.stage, code, {
      path: context.path,
      observed: value.length,
      retained: maximum,
    });
  }
  return value.slice(0, maximum);
}

export function isSafeDynamicKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= 512 &&
    !BLOCKED_KEYS.has(key) &&
    !CONTROL_PATTERN.test(key)
  );
}

export function defineSafe(output: object, key: string, value: unknown): void {
  if (isSafeDynamicKey(key)) {
    Object.defineProperty(output, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }
}

export function createContext(
  limits: CollectorLimits,
  errors: CollectionError[],
  stage: string,
  path?: string,
): SafeContext {
  return { limits, errors, stage, path, state: { entries: 0 } };
}

export function childContext(context: SafeContext, path: string): SafeContext {
  return { ...context, path };
}
