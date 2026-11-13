/**
 * Saves a `Blob` as a file. The `<a>` element is attached to the DOM (some browsers,
 * Firefox among them, need it) and `revokeObjectURL` is deferred so the download is not cut off.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/** File name from a `Content-Disposition` header (`filename*=` as in RFC 6266, or `filename=`). */
export function contentDispositionFileName(header: string | null): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*[^']*'[^']*'([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // Malformed percent-encoding: fall back to the plain parameter.
    }
  }
  const quoted = /filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(header);
  if (quoted) return quoted[1].replace(/\\(.)/g, "$1");
  const plain = /filename\s*=\s*([^;\s]+)/i.exec(header);
  return plain ? plain[1] : null;
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/xml": "xml",
  "text/xml": "xml",
  "application/json": "json",
  "application/x-protobuf": "pb",
  "application/protobuf": "pb",
};

/** Usual file extension of a static data type or a realtime protocol (backend enum values). */
const EXTENSION_BY_FEED_FORMAT: Record<string, string> = {
  gtfs: "zip",
  netex: "zip",
  gtfs_rt: "pb",
  siri: "xml",
  gbfs: "json",
};

/**
 * Name to save a downloaded feed file under. The backend names the file after the
 * source URL's last path segment, which may have no extension (`/api/gtfs`). Such a
 * name, or `fallbackBase` when the header is not readable, gets an extension from
 * the Content-Type or, failing that, the usual one of `feedFormat`.
 */
export function feedDownloadFileName({
  serverName,
  contentType,
  fallbackBase,
  feedFormat,
}: {
  serverName: string | null;
  contentType: string;
  fallbackBase: string;
  feedFormat: string;
}): string {
  const name = serverName?.trim() || "";
  if (/\.[a-z0-9]{1,8}$/i.test(name)) return name;
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  const extension =
    EXTENSION_BY_CONTENT_TYPE[mediaType] ?? EXTENSION_BY_FEED_FORMAT[feedFormat] ?? null;
  const base = name || fallbackBase;
  return extension ? `${base}.${extension}` : base;
}
