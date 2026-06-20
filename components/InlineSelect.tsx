"use client";

import * as React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import type { SxProps, Theme } from "@mui/material/styles";

import { selectMenuPaperSx } from "@/lib/ui/selectMenu";

/** Wewnętrzna wartość MUI Select dla opcji API `""` - MUI nie traktuje pustego stringa jako „filled”. */
const EMPTY_SENTINEL = "\u0000";

function toInternalValue(external: string) {
  return external === "" ? EMPTY_SENTINEL : external;
}

function toExternalValue(internal: string) {
  return internal === EMPTY_SENTINEL ? "" : internal;
}

export type InlineSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type InlineSelectProps = {
  label: string;
  value: string;
  options: InlineSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  sx?: SxProps<Theme>;
};

export function InlineSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  fullWidth = false,
  required = false,
  sx,
}: InlineSelectProps) {
  const id = React.useId();
  const labelId = `${id}-label`;
  const [open, setOpen] = React.useState(false);

  const displayText = React.useMemo(() => {
    const option = options.find((o) => o.value === value);
    return option?.label ?? "";
  }, [options, value]);

  /** Etykieta unosi się, gdy w polu widać tekst (np. „Brak” przy value `""`) lub lista jest otwarta. */
  const labelFloated = open || displayText !== "";

  React.useEffect(() => {
    if (!open) return;
    const closeOnScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".MuiMenu-paper, .MuiPopover-paper")) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("scroll", closeOnScroll, true);
    return () => window.removeEventListener("scroll", closeOnScroll, true);
  }, [open]);

  function handleChange(event: SelectChangeEvent) {
    onChange(toExternalValue(event.target.value));
  }

  function renderValue(internalSelected: string) {
    const external = toExternalValue(internalSelected);
    const option = options.find((o) => o.value === external);
    return option?.label ?? "";
  }

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} required={required} sx={sx}>
      <InputLabel id={labelId} shrink={labelFloated}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={toInternalValue(value)}
        label={label}
        notched={labelFloated}
        displayEmpty
        renderValue={renderValue}
        onChange={handleChange}
        MenuProps={{
          disablePortal: false,
          disableScrollLock: true,
          transitionDuration: 0,
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
          slotProps: {
            paper: {
              sx: selectMenuPaperSx,
            },
          },
        }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={option.value !== "" ? option.value : `__empty__-${index}`}
            value={toInternalValue(option.value)}
            disabled={option.disabled}
          >
            {option.label || "\u00A0"}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
