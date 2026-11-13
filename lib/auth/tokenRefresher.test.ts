import { describe, expect, it, vi } from "vitest";

import type { Tokens } from "@/lib/auth/AuthContext";
import { createTokenRefresher } from "@/lib/auth/tokenRefresher";

/** A refresher over an in-memory store, as AuthContext wires it to localStorage. */
function setup(
  stored: Tokens | null,
  request: (refresh: string) => Promise<{ access: string; refresh?: string }>,
) {
  const store = { tokens: stored };
  const deps = {
    readStored: vi.fn(() => store.tokens),
    request: vi.fn(request),
    apply: vi.fn((tokens: Tokens) => {
      store.tokens = tokens;
    }),
    clear: vi.fn(() => {
      store.tokens = null;
    }),
  };
  return { store, deps, refresh: createTokenRefresher(deps) };
}

const OLD = { access: "access-1", refresh: "refresh-1" };

describe("createTokenRefresher", () => {
  it("replaces the rotated refresh token with the new one", async () => {
    const { store, deps, refresh } = setup(OLD, async () => ({
      access: "access-2",
      refresh: "refresh-2",
    }));
    await expect(refresh()).resolves.toEqual({ access: "access-2", refresh: "refresh-2" });
    expect(deps.request).toHaveBeenCalledWith("refresh-1");
    expect(store.tokens).toEqual({ access: "access-2", refresh: "refresh-2" });
  });

  it("keeps the refresh token when the backend does not rotate it", async () => {
    const { store, refresh } = setup(OLD, async () => ({ access: "access-2" }));
    await refresh();
    expect(store.tokens).toEqual({ access: "access-2", refresh: "refresh-1" });
  });

  it("sends one request for concurrent refreshes", async () => {
    let resolve: (value: { access: string; refresh: string }) => void = () => {};
    const { deps, refresh } = setup(
      OLD,
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const first = refresh();
    const second = refresh();
    resolve({ access: "access-2", refresh: "refresh-2" });
    const results = await Promise.all([first, second]);
    expect(deps.request).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
  });

  it("refreshes again once the previous refresh has finished", async () => {
    let n = 1;
    const { deps, refresh } = setup(OLD, async () => {
      n += 1;
      return { access: `access-${n}`, refresh: `refresh-${n}` };
    });
    await refresh();
    await refresh();
    expect(deps.request).toHaveBeenCalledTimes(2);
    expect(deps.request).toHaveBeenLastCalledWith("refresh-2");
  });

  it("adopts the pair another tab stored while its own refresh failed", async () => {
    const other = { access: "access-tab", refresh: "refresh-tab" };
    const { store, deps, refresh } = setup(OLD, async () => {
      // The other tab rotated refresh-1 first, so the backend has blacklisted it.
      store.tokens = other;
      throw new Error("401");
    });
    await expect(refresh()).resolves.toEqual(other);
    expect(deps.clear).not.toHaveBeenCalled();
    expect(deps.apply).toHaveBeenCalledWith(other);
  });

  it("ends the session when the refresh token is refused", async () => {
    const { store, deps, refresh } = setup(OLD, async () => {
      throw new Error("401");
    });
    await expect(refresh()).resolves.toBeNull();
    expect(deps.clear).toHaveBeenCalledTimes(1);
    expect(store.tokens).toBeNull();
  });

  it("does not call the API without a stored refresh token", async () => {
    const { deps, refresh } = setup(null, async () => ({ access: "x" }));
    await expect(refresh()).resolves.toBeNull();
    expect(deps.request).not.toHaveBeenCalled();
    expect(deps.clear).not.toHaveBeenCalled();
  });
});
