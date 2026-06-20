"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { useColorScheme } from "@mui/material/styles";

import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  disabled,
  helperText,
}: {
  id?: string;
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
          id={id}
          value={value}
          onChange={(next) => onChange(next ?? "")}
          preview="live"
          height={360}
          visibleDragbar={false}
          textareaProps={{ disabled, placeholder: label }}
        />
      </Box>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </Box>
  );
}
