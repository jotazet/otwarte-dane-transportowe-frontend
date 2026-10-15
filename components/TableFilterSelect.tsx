"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { MdOutlineSortByAlpha } from "react-icons/md";

import { selectMenuPaperSx } from "@/lib/ui/selectMenu";

type TableFilterSelectProps = {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  emptyLabel: string;
  ariaLabel: string;
};

/** Ikona jak przy TableSortLabel - tuż obok nagłówka, bez ramki/szarego tła. */
export function TableFilterSelect({
  value,
  onChange,
  options,
  emptyLabel,
  ariaLabel,
}: TableFilterSelectProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const currentLabel = value === "" ? emptyLabel : value;
  const buttonLabel = `${ariaLabel}: ${currentLabel}`;

  function pick(next: string) {
    onChange(next);
    setAnchorEl(null);
  }

  return (
    <>
      <Tooltip title={buttonLabel}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          aria-label={buttonLabel}
          aria-haspopup="true"
          aria-expanded={open ? "true" : "false"}
          sx={{
            p: 0.25,
            ml: 0.125,
            flexShrink: 0,
            color: value ? "primary.main" : "text.secondary",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <MdOutlineSortByAlpha
            size={18}
            aria-hidden
            color="currentColor"
            style={{ display: "block", opacity: open ? 1 : 0.85 }}
          />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              borderRadius: "16px",
              mt: 0.75,
              minWidth: 200,
              ...selectMenuPaperSx,
              border: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => pick("")}
          selected={value === ""}
          sx={{
            fontStyle: "italic",
            color: "text.secondary",
            fontSize: "0.8125rem",
          }}
        >
          {emptyLabel}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem
            key={opt}
            onClick={() => pick(opt)}
            selected={value === opt}
            sx={{ fontSize: "0.8125rem" }}
          >
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
