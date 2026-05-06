import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTOMATION_THRESHOLD,
  buildSessionMemoryKey,
  clearSessionMemory,
  readSessionMemory,
  writeSessionMemory,
} from '@shared/index';

function createMemoryStorage(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

describe('session memory', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('builds deterministic keys that keep structurally different expressions separate', () => {
    const sharedDescriptor = {
      mode: 'truth-table',
      variables: ['a', 'b'],
    };

    const keyA = buildSessionMemoryKey({
      ...sharedDescriptor,
      expression: 'a && b',
    });
    const keyB = buildSessionMemoryKey({
      ...sharedDescriptor,
      expression: 'a && b',
    });
    const keyC = buildSessionMemoryKey({
      ...sharedDescriptor,
      expression: 'b && a',
    });
    const keyD = buildSessionMemoryKey({
      ...sharedDescriptor,
      mode: 'venn',
      expression: 'a && b',
    });

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
    expect(keyA).not.toBe(keyD);
  });

  it('tracks solve counts and only autofills after the automation threshold', () => {
    const storage = createMemoryStorage();
    const descriptor = {
      mode: 'truth-table',
      expression: 'a',
      variables: ['a'],
    };
    const payload = [true, false];

    const first = writeSessionMemory(descriptor, payload, {
      storage,
      expectedLength: 2,
      threshold: AUTOMATION_THRESHOLD,
    });
    expect(first.solveCount).toBe(1);
    expect(first.canAutofill).toBe(false);

    const second = writeSessionMemory(descriptor, payload, {
      storage,
      expectedLength: 2,
      threshold: AUTOMATION_THRESHOLD,
    });
    expect(second.solveCount).toBe(2);
    expect(second.canAutofill).toBe(true);

    const loaded = readSessionMemory(descriptor, {
      storage,
      expectedLength: 2,
      threshold: AUTOMATION_THRESHOLD,
    });
    expect(loaded.solveCount).toBe(2);
    expect(loaded.payload).toEqual(payload);
    expect(loaded.canAutofill).toBe(true);
  });

  it('clears malformed and stale storage safely', () => {
    const storage = createMemoryStorage();
    const descriptor = {
      mode: 'venn',
      expression: 'a',
      variables: ['a'],
    };
    const key = buildSessionMemoryKey(descriptor);

    storage.setItem(key, '{bad json');
    expect(
      readSessionMemory(descriptor, {
        storage,
        expectedLength: 2,
        threshold: AUTOMATION_THRESHOLD,
      }),
    ).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(
      key,
      JSON.stringify({
        mode: 'venn',
        expression: 'a',
        variables: ['a'],
        solveCount: 3,
        payload: [0],
        updatedAt: new Date().toISOString(),
      }),
    );
    expect(
      readSessionMemory(descriptor, {
        storage,
        expectedLength: 2,
        threshold: AUTOMATION_THRESHOLD,
      }),
    ).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it('supports manual clearing of remembered answers', () => {
    const storage = createMemoryStorage();
    const descriptor = {
      mode: 'truth-table',
      expression: 'a',
      variables: ['a'],
    };

    writeSessionMemory(descriptor, [true, false], {
      storage,
      expectedLength: 2,
      threshold: AUTOMATION_THRESHOLD,
    });

    clearSessionMemory(descriptor, { storage });
    expect(
      readSessionMemory(descriptor, {
        storage,
        expectedLength: 2,
        threshold: AUTOMATION_THRESHOLD,
      }),
    ).toBeNull();
    expect(Object.keys(storage.dump())).toHaveLength(0);
  });
});
