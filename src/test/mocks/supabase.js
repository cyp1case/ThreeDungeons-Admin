import { vi } from "vitest";

const tables = {
  residents: [],
  cohorts: [],
  attempts: [],
  resident_cohorts: [],
  programs: [],
};

export function setSupabaseMockData(data) {
  Object.assign(tables, data);
}

export function createSupabaseMock(initialData = {}) {
  setSupabaseMockData(initialData);

  function createChain(tableName) {
    const chain = {
      select: vi.fn().mockImplementation(() => chain),
      eq: vi.fn().mockImplementation(() => chain),
      order: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: null, error: null }),
      ),
    };
    chain.then = (onFulfilled) => {
      const rows = tables[tableName] ?? [];
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
    };
    return chain;
  }

  const from = vi.fn((table) => createChain(table));

  return {
    from,
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  };
}
