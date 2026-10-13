"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MdCheck, MdContentCopy, MdSend } from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import { fetchWithTimeout } from "@/lib/api/http";
import { codeBlockSx } from "@/lib/ui/codeSx";

type ExampleKey = keyof Dictionary["developersExampleLabels"];

/** Requests that answer on any deployment: no IDs that exist only in some feeds. */
const EXAMPLES: { key: ExampleKey; path: string; params: Record<string, string> }[] = [
  { key: "feeds", path: "/api/data_manager/feeds/", params: {} },
  { key: "stopSearch", path: "/api/planner/v1/stops/search/", params: { q: "dworzec" } },
  { key: "status", path: "/api/planner/v1/status/", params: {} },
];

const LANGUAGES = [
  { value: "curl", label: "curl" },
  { value: "js", label: "JavaScript" },
  { value: "python", label: "Python" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];

type Result =
  { kind: "response"; status: number; ok: boolean; ms: number; body: string } | { kind: "failed" };

type QuickStartDict = Pick<
  Dictionary,
  | "developersQuickStartTitle"
  | "developersApiBaseUrl"
  | "developersCopyApiBaseUrl"
  | "developersRequest"
  | "developersExampleLabels"
  | "developersCodeLanguage"
  | "developersCopyCode"
  | "developersCopied"
  | "developersSendRequest"
  | "developersSendRequestHint"
  | "developersResponse"
  | "developersResponseEmpty"
  | "developersResponseLoading"
  | "developersResponseTime"
  | "developersResponseFailed"
  | "developersCopyResponse"
>;

function snippet(baseUrl: string, example: (typeof EXAMPLES)[number], language: Language) {
  const query = new URLSearchParams(example.params).toString();
  const url = `${baseUrl}${example.path}${query ? `?${query}` : ""}`;
  if (language === "curl") return `curl "${url}"`;
  if (language === "js")
    return `const res = await fetch("${url}");\nconst data = await res.json();`;
  const params = Object.entries(example.params)
    .map(([key, value]) => `"${key}": "${value}"`)
    .join(", ");
  return params
    ? `import requests\n\ndata = requests.get(\n    "${baseUrl}${example.path}",\n    params={${params}},\n).json()`
    : `import requests\n\ndata = requests.get("${url}").json()`;
}

function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // The browser refused clipboard access; the text stays selectable.
    }
  }

  return (
    <Tooltip title={copied ? copiedLabel : label}>
      <IconButton type="button" size="small" onClick={copy} aria-label={label}>
        {copied ? <MdCheck size={18} aria-hidden /> : <MdContentCopy size={18} aria-hidden />}
      </IconButton>
    </Tooltip>
  );
}

export function DeveloperQuickStart({
  apiBaseUrl,
  dict,
}: {
  apiBaseUrl: string;
  dict: QuickStartDict;
}) {
  const [example, setExample] = useState(EXAMPLES[0]);
  const [language, setLanguage] = useState<Language>("curl");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // Ignores a response that arrives after the visitor picked another request.
  const requestIdRef = useRef(0);

  const code = snippet(apiBaseUrl, example, language);
  const query = new URLSearchParams(example.params).toString();
  const url = `${apiBaseUrl}${example.path}${query ? `?${query}` : ""}`;

  function pickExample(next: (typeof EXAMPLES)[number]) {
    requestIdRef.current += 1;
    setExample(next);
    setResult(null);
    setLoading(false);
  }

  async function send() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setResult(null);
    const started = performance.now();
    let next: Result;
    try {
      const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Not JSON: show the body as it came.
      }
      next = {
        kind: "response",
        status: res.status,
        ok: res.ok,
        ms: Math.round(performance.now() - started),
        body,
      };
    } catch {
      next = { kind: "failed" };
    }
    if (requestId !== requestIdRef.current) return;
    setResult(next);
    setLoading(false);
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h6" component="h2">
          {dict.developersQuickStartTitle}
        </Typography>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {dict.developersApiBaseUrl}
            </Typography>
            <Stack
              direction="row"
              sx={[codeBlockSx, { alignItems: "center", gap: 1, mt: 1, pl: 2, pr: 0.5, py: 0.5 }]}
            >
              <Box component="code" sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                {apiBaseUrl}
              </Box>
              <CopyButton
                text={apiBaseUrl}
                label={dict.developersCopyApiBaseUrl}
                copiedLabel={dict.developersCopied}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {dict.developersRequest}
            </Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
              {EXAMPLES.map((item) => {
                const selected = item.key === example.key;
                return (
                  <Chip
                    key={item.key}
                    label={dict.developersExampleLabels[item.key]}
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => pickExample(item)}
                    aria-pressed={selected}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box sx={[codeBlockSx, { overflow: "hidden" }]}>
            <Stack
              direction="row"
              sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", pr: 0.5 }}
            >
              <Tabs
                value={language}
                onChange={(_, value: Language) => setLanguage(value)}
                aria-label={dict.developersCodeLanguage}
                variant="scrollable"
                scrollButtons={false}
                sx={{ flex: 1, minHeight: 40 }}
              >
                {LANGUAGES.map((item) => (
                  <Tab
                    key={item.value}
                    value={item.value}
                    label={item.label}
                    id={`quickstart-tab-${item.value}`}
                    aria-controls="quickstart-code"
                    sx={{ minHeight: 40, textTransform: "none" }}
                  />
                ))}
              </Tabs>
              <CopyButton
                text={code}
                label={dict.developersCopyCode}
                copiedLabel={dict.developersCopied}
              />
            </Stack>
            <Box
              component="pre"
              id="quickstart-code"
              role="tabpanel"
              aria-labelledby={`quickstart-tab-${language}`}
              sx={{ m: 0, p: 2, overflowX: "auto", font: "inherit" }}
            >
              <code>{code}</code>
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
            sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
          >
            <Button
              variant="contained"
              startIcon={<MdSend aria-hidden />}
              onClick={send}
              loading={loading}
              sx={{ flexShrink: 0 }}
            >
              {dict.developersSendRequest}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {dict.developersSendRequestHint}
            </Typography>
          </Stack>

          <Box sx={[codeBlockSx, { overflow: "hidden" }]}>
            <Stack
              direction="row"
              aria-live="polite"
              sx={{
                alignItems: "center",
                gap: 1.5,
                minHeight: 40,
                pl: 2,
                pr: 0.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {dict.developersResponse}
              </Typography>
              {result?.kind === "response" ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: result.ok ? "success.main" : "error.main" }}
                  >
                    {result.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dict.developersResponseTime.replace("{ms}", String(result.ms))}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <CopyButton
                    text={result.body}
                    label={dict.developersCopyResponse}
                    copiedLabel={dict.developersCopied}
                  />
                </>
              ) : null}
            </Stack>
            <Box
              role="region"
              aria-label={dict.developersResponse}
              tabIndex={0}
              sx={{
                maxHeight: 300,
                overflow: "auto",
                overscrollBehavior: "contain",
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: -2,
                },
              }}
            >
              {loading ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  {dict.developersResponseLoading}
                </Typography>
              ) : result?.kind === "failed" ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {dict.developersResponseFailed}
                </Alert>
              ) : result ? (
                <Box component="pre" sx={{ m: 0, p: 2, font: "inherit" }}>
                  <code>{result.body}</code>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 3, textAlign: "center" }}
                >
                  {dict.developersResponseEmpty}
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
