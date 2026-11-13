"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { MdAdd, MdDelete } from "react-icons/md";

import { InlineSelect } from "@/components/InlineSelect";
import { PasswordTextField } from "@/components/PasswordTextField";
import type { Dictionary } from "@/i18n/getDictionary";
import { authTypeOptions } from "@/lib/data/authTypes";
import {
  hideOriginalOnAuthChange,
  isHideOriginalLockedByAuth,
  resolveHideOriginal,
} from "@/lib/data/hideOriginalAuth";
import {
  isNoSourceUpdate,
  SOURCE_UPDATE_INTERVAL_MIN,
  sourceUpdateIntervalMax,
} from "@/lib/data/intervalChoices";
import {
  emptyEndpoint,
  endpointTypesFor,
  parseEndpointInterval,
  type RealtimeProtocol,
  type RtEndpointDraft,
} from "@/lib/data/realtimeEndpoints";

type EndpointsEditorDict = Pick<
  Dictionary,
  | "feedTypes"
  | "feedUrl"
  | "sourceUpdateInterval"
  | "sourceUpdateIntervalRange"
  | "delete"
  | "authType"
  | "authTypeNone"
  | "authValue"
  | "showPassword"
  | "hidePassword"
  | "original"
  | "hideOriginal"
  | "addEndpoint"
>;

/**
 * Rows of realtime endpoints, shared by the submission form and the submission detail.
 * `canAddRemove` allows adding and removing rows; `sourceLocked` leaves only the interval editable.
 */
export function RealtimeEndpointsEditor({
  dict,
  protocol,
  endpoints,
  onChange,
  authValueHint,
  disabled = false,
  canAddRemove = true,
  sourceLocked = false,
}: {
  dict: EndpointsEditorDict;
  protocol: RealtimeProtocol;
  endpoints: RtEndpointDraft[];
  onChange: (rows: RtEndpointDraft[]) => void;
  authValueHint: string;
  disabled?: boolean;
  canAddRemove?: boolean;
  sourceLocked?: boolean;
}) {
  const typeOptions = endpointTypesFor(protocol).map((t) => ({ value: t, label: t }));
  const authOptions = authTypeOptions(dict);
  const sourceDisabled = disabled || sourceLocked;

  function update(idx: number, patch: Partial<RtEndpointDraft>) {
    onChange(endpoints.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  return (
    <Stack spacing={2}>
      {endpoints.map((ep, idx) => {
        const intervalInvalid = ep.interval.trim() !== "" && parseEndpointInterval(ep) === null;
        return (
          <Stack
            key={ep.uid}
            spacing={1}
            sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ alignItems: { md: "flex-start" } }}
            >
              <InlineSelect
                label={dict.feedTypes}
                value={ep.endpoint_type}
                onChange={(v) => update(idx, { endpoint_type: v })}
                disabled={sourceDisabled}
                sx={{ minWidth: 220 }}
                options={typeOptions}
              />
              <TextField
                label={dict.feedUrl}
                value={ep.url}
                onChange={(e) => update(idx, { url: e.target.value })}
                disabled={sourceDisabled}
                sx={{ flex: 1 }}
              />
              <TextField
                label={dict.sourceUpdateInterval}
                type="number"
                value={ep.interval}
                onChange={(e) => {
                  const v = e.target.value;
                  update(idx, {
                    interval: v,
                    hide_original: isNoSourceUpdate(v) ? false : ep.hide_original,
                  });
                }}
                disabled={disabled}
                required
                error={intervalInvalid}
                helperText={intervalInvalid ? dict.sourceUpdateIntervalRange : undefined}
                slotProps={{
                  htmlInput: {
                    min: SOURCE_UPDATE_INTERVAL_MIN,
                    max: sourceUpdateIntervalMax(ep.storedInterval),
                    step: 1,
                    inputMode: "numeric",
                  },
                }}
                sx={{ minWidth: 160 }}
              />
              {canAddRemove ? (
                // The span lets the tooltip work on a disabled button; describeChild keeps
                // the name on the button instead of an aria-label on the span.
                <Tooltip title={dict.delete} describeChild>
                  <Box component="span" sx={{ display: "inline-flex", mt: { md: 1 } }}>
                    <IconButton
                      aria-label={dict.delete}
                      color="error"
                      disabled={disabled || endpoints.length <= 1}
                      onClick={() => onChange(endpoints.filter((_, i) => i !== idx))}
                    >
                      <MdDelete aria-hidden />
                    </IconButton>
                  </Box>
                </Tooltip>
              ) : null}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <InlineSelect
                label={dict.authType}
                value={ep.auth_type}
                onChange={(v) =>
                  update(idx, { auth_type: v, hide_original: hideOriginalOnAuthChange(v) })
                }
                disabled={sourceDisabled}
                sx={{ minWidth: 200 }}
                options={authOptions}
              />
              {ep.auth_type ? (
                <PasswordTextField
                  label={dict.authValue}
                  value={ep.auth_value}
                  onChange={(e) => update(idx, { auth_value: e.target.value })}
                  disabled={sourceDisabled}
                  helperText={authValueHint}
                  sx={{ flex: 1 }}
                  autoComplete="new-password"
                  showPasswordLabel={dict.showPassword}
                  hidePasswordLabel={dict.hidePassword}
                />
              ) : null}
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ep.is_original}
                    onChange={(e) => update(idx, { is_original: e.target.checked })}
                    disabled={sourceDisabled}
                  />
                }
                label={dict.original}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={resolveHideOriginal(ep.auth_type, ep.hide_original)}
                    onChange={(e) => update(idx, { hide_original: e.target.checked })}
                    disabled={
                      sourceDisabled ||
                      isHideOriginalLockedByAuth(ep.auth_type) ||
                      isNoSourceUpdate(ep.interval)
                    }
                  />
                }
                label={dict.hideOriginal}
              />
            </Stack>
          </Stack>
        );
      })}
      {canAddRemove ? (
        <Button
          type="button"
          variant="outlined"
          startIcon={<MdAdd aria-hidden />}
          disabled={disabled}
          onClick={() => onChange([...endpoints, emptyEndpoint(protocol)])}
        >
          {dict.addEndpoint}
        </Button>
      ) : null}
    </Stack>
  );
}
