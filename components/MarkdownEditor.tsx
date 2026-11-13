"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { useColorScheme } from "@mui/material/styles";

import { MarkdownContent } from "@/components/MarkdownContent";

import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// The editor's own preview renders raw HTML from the Markdown (rehype-raw, no sanitising),
// and a post is opened here by people other than its author. The preview is the renderer
// of the published post instead: no raw HTML, and it shows what readers will see.
const editorComponents = {
  preview: (source: string) => <MarkdownContent content={source} />,
};

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  disabled,
  helperText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
}) {
  const { mode } = useColorScheme();
  const colorMode = mode === "dark" ? "dark" : "light";

  return (
    <Box>
      <InputLabel htmlFor={id} shrink sx={{ position: "relative", mb: 1 }}>
        {label}
      </InputLabel>
      <Box
        data-color-mode={colorMode}
        sx={{
          "& .w-md-editor": {
            borderRadius: 1,
            borderColor: "divider",
            boxShadow: "none",
          },
          "& .w-md-editor-toolbar": {
            borderColor: "divider",
          },
        }}
      >
        <MDEditor
          value={value}
          onChange={(next) => onChange(next ?? "")}
          preview="live"
          components={editorComponents}
          height={360}
          visibleDragbar={false}
          // md-editor puts its own `id` on the wrapper div; the textarea needs it for the label.
          textareaProps={{
            id,
            disabled,
            placeholder: label,
            "aria-describedby": helperText ? `${id}-helper` : undefined,
          }}
        />
      </Box>
      {helperText ? <FormHelperText id={`${id}-helper`}>{helperText}</FormHelperText> : null}
    </Box>
  );
}
