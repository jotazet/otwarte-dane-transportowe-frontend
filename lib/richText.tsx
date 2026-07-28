import type { ReactNode } from "react";
import MuiLink from "@mui/material/Link";

const ANCHOR_RE = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
const HREF_RE = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

/**
 * Bezpiecznie renderuje zaufany tekst (ze słownika i18n) zawierający wyłącznie
 * proste kotwice `<a href=…>…</a>` — bez `dangerouslySetInnerHTML`.
 * Tekst poza kotwicami trafia jako węzły tekstowe React (auto-escape), a z kotwicy
 * honorowany jest jedynie atrybut `href`; `target`/`rel` wyliczamy z protokołu.
 * Nieznane/niebezpieczne `href` (np. `javascript:`) są pomijane — renderowany jest sam tekst.
 */
export function renderRichText(input: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  ANCHOR_RE.lastIndex = 0;
  while ((match = ANCHOR_RE.exec(input)) !== null) {
    if (match.index > lastIndex) nodes.push(input.slice(lastIndex, match.index));

    const label = match[1] ?? "";
    const hrefMatch = HREF_RE.exec(match[0]);
    const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? "").trim();
    const safe = /^(https?:|mailto:|\/)/i.test(href);

    if (safe && href) {
      const external = /^https?:/i.test(href);
      nodes.push(
        <MuiLink
          key={`a-${key++}`}
          href={href}
          underline="hover"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </MuiLink>,
      );
    } else {
      nodes.push(label);
    }
    lastIndex = ANCHOR_RE.lastIndex;
  }

  if (lastIndex < input.length) nodes.push(input.slice(lastIndex));
  return nodes;
}
