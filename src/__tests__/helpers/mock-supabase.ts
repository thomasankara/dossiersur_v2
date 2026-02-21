import { vi } from "vitest";

/**
 * Chainable mock simulating Supabase client query builder.
 * Usage: `const sb = createMockSupabase({ returnData, returnError })`
 */
export function createChainableMock(options: {
  returnData?: unknown;
  returnError?: { message: string } | null;
} = {}) {
  const { returnData = null, returnError = null } = options;
  const result = { data: returnData, error: returnError };

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    "from", "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "is", "not", "in", "gt", "lt", "gte", "lte",
    "like", "ilike", "or", "filter",
    "single", "maybeSingle", "limit", "order", "range",
  ];

  for (const method of methods) {
    chain[method] = vi.fn();
  }

  // All methods return the chain, except terminal ones
  for (const method of methods) {
    chain[method]!.mockImplementation(() => {
      if (method === "single" || method === "maybeSingle") {
        return Promise.resolve(result);
      }
      return chain;
    });
  }

  // Override from() to return the chain
  chain["from"]!.mockImplementation(() => chain);

  // Make the chain thenable (for cases like `await supabase.from(...).insert(...)`)
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) => resolve(result),
    enumerable: false,
  });

  return chain;
}

export function createMockSupabase(options: {
  returnData?: unknown;
  returnError?: { message: string } | null;
  user?: { id: string; email?: string } | null;
} = {}) {
  const { user = { id: "user-123", email: "test@example.com" } } = options;
  const chain = createChainableMock(options);

  return {
    ...chain,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: "https://accounts.google.com/oauth" },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test/path" }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://storage.example.com/signed" },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  };
}
