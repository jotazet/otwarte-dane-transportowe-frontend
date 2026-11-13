import { describe, expect, it } from "vitest";

import { contentDispositionFileName, feedDownloadFileName } from "@/lib/download";

describe("contentDispositionFileName", () => {
  it("reads Django's quoted and RFC 5987 forms", () => {
    expect(contentDispositionFileName('attachment; filename="gtfs.zip"')).toBe("gtfs.zip");
    expect(contentDispositionFileName('attachment; filename="a \\"b\\".xml"')).toBe('a "b".xml');
    expect(contentDispositionFileName("attachment; filename*=utf-8''rozk%C5%82ad.zip")).toBe(
      "rozkład.zip",
    );
    expect(contentDispositionFileName("attachment; filename=feed.pb")).toBe("feed.pb");
  });

  it("returns null without a file name", () => {
    expect(contentDispositionFileName(null)).toBeNull();
    expect(contentDispositionFileName("attachment")).toBeNull();
  });
});

describe("feedDownloadFileName", () => {
  const base = { serverName: null, contentType: "", fallbackBase: "submission-7-static" };

  it("keeps a server name that has an extension", () => {
    expect(feedDownloadFileName({ ...base, serverName: "netex.xml", feedFormat: "netex" })).toBe(
      "netex.xml",
    );
  });

  it("adds the extension of the Content-Type", () => {
    expect(
      feedDownloadFileName({ ...base, contentType: "application/xml", feedFormat: "netex" }),
    ).toBe("submission-7-static.xml");
    expect(
      feedDownloadFileName({
        ...base,
        serverName: "gbfs",
        contentType: "application/json; charset=utf-8",
        feedFormat: "gbfs",
      }),
    ).toBe("gbfs.json");
  });

  it("falls back to the usual extension of the format", () => {
    const octet = { ...base, contentType: "application/octet-stream" };
    expect(feedDownloadFileName({ ...octet, serverName: "vehicles", feedFormat: "gtfs_rt" })).toBe(
      "vehicles.pb",
    );
    expect(feedDownloadFileName({ ...octet, feedFormat: "gtfs" })).toBe("submission-7-static.zip");
    expect(feedDownloadFileName({ ...octet, feedFormat: "other" })).toBe("submission-7-static");
  });
});
