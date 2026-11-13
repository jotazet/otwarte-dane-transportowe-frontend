"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { InlineSelect } from "@/components/InlineSelect";
import type { Dictionary } from "@/i18n/getDictionary";
import { submissionsPaths } from "@/lib/api/submissions";
import { fetchAllPages } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { requiresStaticSubmission, type RealtimeProtocol } from "@/lib/data/realtimeEndpoints";
import { text } from "@/lib/format";
import { formatApiError } from "@/lib/formatApiError";

export type EligibleStaticRow = {
  id: number;
  transport_organization: number;
  data_type: string;
  name?: string;
  allowed_realtime_protocols?: string[];
};

/**
 * Published static submissions of an organization that a realtime feed of `protocol`
 * can link to. `orgId` null (or GBFS) loads nothing.
 */
export function useEligibleStatics(
  orgId: number | null,
  protocol: RealtimeProtocol,
  dict: Dictionary,
): { statics: EligibleStaticRow[]; loading: boolean; error: string | null } {
  const { apiJson, status } = useAuth();
  const path =
    status === "authenticated" && orgId !== null && requiresStaticSubmission(protocol)
      ? submissionsPaths.eligibleStatic(orgId, protocol === "gtfs_rt" ? "gtfs" : "netex")
      : null;
  const [result, setResult] = React.useState<{
    path: string;
    statics: EligibleStaticRow[];
    error: string | null;
  } | null>(null);

  React.useEffect(() => {
    if (!path) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchAllPages<EligibleStaticRow>((p) => apiJson("GET", p), path);
        if (!cancelled) setResult({ path, statics: list, error: null });
      } catch (e) {
        if (!cancelled) setResult({ path, statics: [], error: formatApiError(e, dict) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiJson, path, dict]);

  // A result for an earlier organization or protocol does not count.
  const current = path && result?.path === path ? result : null;
  return {
    statics: current?.statics ?? [],
    loading: path !== null && current === null,
    error: current?.error ?? null,
  };
}

export function RealtimeStaticSubmissionSelect({
  dict,
  statics,
  loading,
  error,
  value,
  onChange,
  disabled = false,
  currentId = null,
}: {
  dict: Pick<
    Dictionary,
    "loadingEligibleStatic" | "staticSubmission" | "staticSubmissionSelectHint" | "unnamed"
  >;
  statics: EligibleStaticRow[];
  loading: boolean;
  error: string | null;
  value: number | "";
  onChange: (value: number | "") => void;
  disabled?: boolean;
  /** The static submission already linked: the eligible list leaves it out, as it is taken. */
  currentId?: number | null;
}) {
  const options = statics.map((s) => ({
    value: String(s.id),
    label: `#${s.id} - ${s.name ? text(s.name) : dict.unnamed} - ${s.data_type} (${(s.allowed_realtime_protocols ?? []).join(", ")})`,
  }));
  if (currentId !== null && !statics.some((s) => s.id === currentId)) {
    options.unshift({ value: String(currentId), label: `#${currentId}` });
  }
  return (
    <Stack spacing={0.5}>
      {loading ? (
        <Typography variant="body2" color="text.secondary">
          {dict.loadingEligibleStatic}
        </Typography>
      ) : null}
      {error ? <Alert severity="warning">{error}</Alert> : null}
      <InlineSelect
        fullWidth
        disabled={disabled || loading || !options.length}
        required
        label={dict.staticSubmission}
        value={value === "" ? "" : String(value)}
        onChange={(v) => onChange(v === "" ? "" : Number(v))}
        options={[{ value: "", label: "" }, ...options]}
      />
      <Typography variant="caption" color="text.secondary">
        {dict.staticSubmissionSelectHint}
      </Typography>
    </Stack>
  );
}
