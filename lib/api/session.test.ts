import { afterEach, describe, expect, it, vi } from "vitest";

import { postSession, SESSION_CHANGE_PASSWORD, SESSION_REFRESH } from "@/lib/api/session";

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentInit(fetchMock: ReturnType<typeof stubFetch>): RequestInit {
  const init = fetchMock.mock.calls[0]?.[1];
  if (!init) throw new Error("fetch was not called with an init");
  return init;
}

describe("postSession", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends credentials and the CSRF header, without a body or a Bearer token", async () => {
    const fetchMock = stubFetch(Response.json({ access: "a" }));

    await expect(postSession(SESSION_REFRESH)).resolves.toEqual({ access: "a" });

    const init = sentInit(fetchMock);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json", "X-ODT-CSRF": "1" });
  });

  it("adds the JSON body and the access token as a Bearer token", async () => {
    const fetchMock = stubFetch(Response.json({ access: "new" }));
    const body = { current_password: "old", new_password: "new" };

    await postSession(SESSION_CHANGE_PASSWORD, body, "token");

    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/api\/auth\/session\/change-password\/$/);
    const init = sentInit(fetchMock);
    expect(init.credentials).toBe("include");
    expect(init.body).toBe(JSON.stringify(body));
    expect(init.headers).toEqual({
      Accept: "application/json",
      "X-ODT-CSRF": "1",
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
  });
});
