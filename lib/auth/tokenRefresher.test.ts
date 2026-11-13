import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/http";
import { createTokenRefresher } from "@/lib/auth/tokenRefresher";

const MISSING = new ApiError(401, "HTTP 401", "auth.refresh_cookie_missing");
const INVALID = new ApiError(401, "HTTP 401", "auth.refresh_cookie_invalid");

/** Runs `fn` at once, as `withRefreshLock` does without the Web Locks API. */
const noLock = <T>(fn: () => Promise<T>) => fn();

/** A lock shared by several refreshers, as `navigator.locks` is by the site's tabs. */
function sharedLock() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(fn);
    tail = run.catch(() => {});
    return run;
  };
}

/**
 * The browser's refresh cookie and the backend's rotation: every refresh replaces the cookie
 * and blacklists the old token. `send` returns the cookie the request left with and a function
 * that answers it, so a test can interleave two tabs.
 */
function cookieServer() {
  const server = { cookie: 1, requests: 0 };
  const answer = (sent: number) => {
    if (sent !== server.cookie) throw INVALID;
    server.cookie += 1;
    return { access: `access-${server.cookie}` };
  };
  const request = async () => {
    server.requests += 1;
    const sent = server.cookie;
    await Promise.resolve();
    return answer(sent);
  };
  return { server, request };
}

function setup(request: () => Promise<{ access: string }>, withLock = noLock) {
  const deps = {
    request: vi.fn(request),
    withLock,
    apply: vi.fn(),
    clear: vi.fn(),
  };
  return { deps, refresh: createTokenRefresher(deps) };
}

describe("createTokenRefresher", () => {
  it("applies the access token of the rotated cookie", async () => {
    const { server, request } = cookieServer();
    const { deps, refresh } = setup(request);
    await expect(refresh()).resolves.toBe("access-2");
    expect(deps.apply).toHaveBeenCalledWith("access-2");
    expect(server.cookie).toBe(2);
  });

  it("sends one request for concurrent refreshes in a tab", async () => {
    const { server, request } = cookieServer();
    const { refresh } = setup(request);
    const results = await Promise.all([refresh(), refresh()]);
    expect(server.requests).toBe(1);
    expect(results).toEqual(["access-2", "access-2"]);
  });

  it("refreshes again once the previous refresh has finished", async () => {
    const { server, request } = cookieServer();
    const { refresh } = setup(request);
    await refresh();
    await expect(refresh()).resolves.toBe("access-3");
    expect(server.requests).toBe(2);
  });

  it("runs the refreshes of two tabs one after the other under the shared lock", async () => {
    const { server, request } = cookieServer();
    const lock = sharedLock();
    const tabA = setup(request, lock);
    const tabB = setup(request, lock);
    const results = await Promise.all([tabA.refresh(), tabB.refresh()]);
    // The second tab's request left with the cookie the first one set: no retry needed.
    expect(results).toEqual(["access-2", "access-3"]);
    expect(server.requests).toBe(2);
    expect(tabB.deps.clear).not.toHaveBeenCalled();
  });

  it("retries once when another tab rotated the cookie during the request", async () => {
    const { server, request } = cookieServer();
    const tabA = setup(request);
    const tabB = setup(request);
    // Without a lock both leave with cookie 1; tab A rotates it first.
    const results = await Promise.all([tabA.refresh(), tabB.refresh()]);
    expect(results).toEqual(["access-2", "access-3"]);
    expect(tabB.deps.request).toHaveBeenCalledTimes(2);
    expect(tabB.deps.clear).not.toHaveBeenCalled();
    expect(server.cookie).toBe(3);
  });

  it("ends the session when the retry is refused too", async () => {
    const { deps, refresh } = setup(async () => {
      throw INVALID;
    });
    await expect(refresh()).resolves.toBeNull();
    expect(deps.request).toHaveBeenCalledTimes(2);
    expect(deps.clear).toHaveBeenCalledTimes(1);
    expect(deps.apply).not.toHaveBeenCalled();
  });

  it("treats a missing cookie as no session, without a retry", async () => {
    const { deps, refresh } = setup(async () => {
      throw MISSING;
    });
    await expect(refresh()).resolves.toBeNull();
    expect(deps.request).toHaveBeenCalledTimes(1);
    expect(deps.clear).toHaveBeenCalledExactlyOnceWith(MISSING);
  });

  it("does not retry other failures and passes them on", async () => {
    const offline = new ApiError(0, "Connection failed");
    const { deps, refresh } = setup(async () => {
      throw offline;
    });
    await expect(refresh()).resolves.toBeNull();
    expect(deps.request).toHaveBeenCalledTimes(1);
    expect(deps.clear).toHaveBeenCalledExactlyOnceWith(offline);
  });
});
