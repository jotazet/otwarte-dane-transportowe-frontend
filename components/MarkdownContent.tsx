"use client";

import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import type { Theme } from "@mui/material/styles";
import NextLink from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function bodyTypographySx(t: Theme) {
  const base = t.typography.body1.fontSize ?? "1rem";
  return {
    lineHeight: 1.75,
    fontSize: `calc(${base} * 1.06)`,
  };
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <Box
      sx={(t) => ({
        ...bodyTypographySx(t),
        "& > *:first-of-type": { mt: 0 },
        "& > *:last-child": { mb: 0 },
        "& p": { my: 0, "& + p": { mt: 2 } },
        "& h1, & h2, & h3, & h4": {
          fontWeight: 600,
          lineHeight: 1.3,
          mt: 3,
          mb: 1.5,
          "&:first-of-type": { mt: 0 },
        },
        "& h1": { fontSize: "1.5rem" },
        "& h2": { fontSize: "1.3rem" },
        "& h3": { fontSize: "1.15rem" },
        "& h4": { fontSize: "1.05rem" },
        "& ul, & ol": { my: 1.5, pl: 3 },
        "& li": { my: 0.5 },
        "& li > p": { my: 0 },
        "& blockquote": {
          my: 2,
          pl: 2,
          borderLeft: 3,
          borderColor: "divider",
          color: "text.secondary",
        },
        "& pre": {
          my: 2,
          p: 2,
          borderRadius: 1,
          overflow: "auto",
          bgcolor: "action.hover",
          fontSize: "0.9em",
        },
        "& code": {
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: "0.9em",
        },
        "& :not(pre) > code": {
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          bgcolor: "action.hover",
        },
        "& hr": {
          my: 3,
          border: 0,
          borderTop: 1,
          borderColor: "divider",
        },
        "& table": {
          width: "100%",
          my: 2,
          borderCollapse: "collapse",
          display: "block",
          overflowX: "auto",
        },
        "& th, & td": {
          border: 1,
          borderColor: "divider",
          px: 1.5,
          py: 1,
          textAlign: "left",
        },
        "& th": { fontWeight: 600, bgcolor: "action.hover" },
        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
      })}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const isInternal = href?.startsWith("/");
            if (isInternal && href) {
              return (
                <MuiLink component={NextLink} href={href} underline="hover">
                  {children}
                </MuiLink>
              );
            }
            return (
              <MuiLink href={href} underline="hover" target="_blank" rel="noopener noreferrer">
                {children}
              </MuiLink>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
