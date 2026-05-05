"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdLanguage } from "react-icons/md";

import type { Locale } from "@/i18n/locales";

function hrefForLocale(pathname: string, target: Locale) {
  const withoutLocale = pathname.replace(/^\/(pl|en|de)(\/|$)/, "/");
  return `/${target}${withoutLocale === "/" ? "" : withoutLocale}`;
}

export function LocaleSwitcher({
  locale,
  languageLabel,
}: {
  locale: Locale;
  languageLabel: string;
}) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const pathname = usePathname() || "/";
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLabel = locale === "pl" ? "Polski" : locale === "de" ? "Deutsch" : "English";

  const triggerProps = {
    "aria-label": `${languageLabel}: ${currentLabel}`,
    "aria-haspopup": true as const,
    "aria-expanded": open,
    onClick: (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget),
  };

  const menu = (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        list: { dense: true },
        paper: {
          sx: {
            minWidth: 180,
            mt: 0.5,
          },
        },
      }}
    >
      <MenuItem
        component={Link}
        href={hrefForLocale(pathname, "pl")}
        onClick={() => setAnchorEl(null)}
        selected={locale === "pl"}
      >
        Polski
      </MenuItem>
      <MenuItem
        component={Link}
        href={hrefForLocale(pathname, "en")}
        onClick={() => setAnchorEl(null)}
        selected={locale === "en"}
      >
        English
      </MenuItem>
      <MenuItem
        component={Link}
        href={hrefForLocale(pathname, "de")}
        onClick={() => setAnchorEl(null)}
        selected={locale === "de"}
      >
        Deutsch
      </MenuItem>
    </Menu>
  );

  if (isMdUp) {
    return (
      <>
        <Button
          {...triggerProps}
          variant="outlined"
          size="small"
          startIcon={<MdLanguage size={20} aria-hidden />}
          sx={{ flexShrink: 0, textTransform: "none", fontWeight: 600 }}
        >
          {currentLabel}
        </Button>
        {menu}
      </>
    );
  }

  return (
    <>
      <IconButton
        {...triggerProps}
        color="primary"
        size="large"
        sx={{ flexShrink: 0 }}
      >
        <MdLanguage size={24} aria-hidden />
      </IconButton>
      {menu}
    </>
  );
}
