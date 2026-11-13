/**
 * Every error code the backend emits has a translation (hard rule 4, backend ADR 0006).
 *
 * lib/__fixtures__/backend-error-codes.json lists the codes found in the backend's Python code,
 * without tests, migrations, Celery task names in settings and the public journey-planner API
 * (access.py, params.py, planning.py and the public, lookup and schedule views), which this site
 * does not call. Regenerate it from this repository's root with the backend checked out next to it:
 *
 *   (cd ../OtwarteDaneTransportowe-backend && grep -rhoE --include='*.py' \
 *     --exclude-dir=tests --exclude-dir=migrations --exclude='settings*.py' \
 *     "'(auth|blog|feeds|fetch|gtfs_validation|realtime|users|planner)\.[a-z_]+'" \
 *     accounts blog cases data_manager OtwarteDaneTransportowe \
 *     planner/api/serializers.py planner/api/views.py planner/models.py \
 *     planner/otp_config.py planner/pipeline.py \
 *     | tr -d "'" | grep -v '\.urls$' | LC_ALL=C sort -u) \
 *     | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0, "utf8").trim().split("\n"), null, 2) + "\n")' \
 *     > lib/__fixtures__/backend-error-codes.json
 *
 * Codes built at runtime (`users.password_*` from Django's validator codes) are not found by the
 * grep. A code may live in any code map of the dictionary (`apiErrorCodes`,
 * `plannerAdminErrorCodes`, `realtimeRejectionReasons`): each screen picks its own.
 */
import { describe, expect, it } from "vitest";

import backendCodes from "@/lib/__fixtures__/backend-error-codes.json";
import { dictPl } from "@/i18n/lang/pl";

/** Codes with no translation yet; add one only with an issue that tracks it. */
const KNOWN_GAPS = new Set<string>([]);

/** Keys shaped like `<area>.<reason>` in every nested map of the Polish dictionary. */
function translatedCodes(): Set<string> {
  const codes = new Set<string>();
  for (const value of Object.values(dictPl)) {
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) if (key.includes(".")) codes.add(key);
    }
  }
  return codes;
}

describe("backend error codes", () => {
  const translated = translatedCodes();

  it("have a translation in pl.ts (other languages follow from the Dictionary type)", () => {
    const missing = backendCodes.filter((code) => !translated.has(code) && !KNOWN_GAPS.has(code));
    expect(missing).toEqual([]);
  });

  it("lists only gaps that are still missing", () => {
    const fixed = [...KNOWN_GAPS].filter((code) => translated.has(code));
    expect(fixed, "translated now: remove these from KNOWN_GAPS").toEqual([]);
  });
});
