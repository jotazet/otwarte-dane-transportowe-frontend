"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { usePathname } from "next/navigation";
import { MdLanguage } from "react-icons/md";

import { locales, type Locale } from "@/i18n/locales";

const LOCALE_LABELS: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
  bg: "Български",
};

function hrefForLocale(pathname: string, target: Locale) {
  const withoutLocale = pathname.replace(/^\/(pl|en|de|bg)(\/|$)/, "/");
  return `/${target}${withoutLocale === "/" ? "" : withoutLocale}`;
}

export function LocaleSwitcher({
  locale,
  languageLabel,
}: {
  locale: Locale;
  languageLabel: string;
}) {
  const pathname = usePathname() || "/";
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLabel = LOCALE_LABELS[locale] ?? "English";

  const triggerProps = {
    "aria-label": `${languageLabel}: ${currentLabel}`,
    "aria-haspopup": true as const,
    "aria-expanded": open,
    onClick: (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget),
  };

  // Plain links on purpose: a client-side navigation keeps the root layout, so `<html lang>`
  // would stay on the previous locale.
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
      {locales.map((target) => (
        <MenuItem
          key={target}
          component="a"
          href={hrefForLocale(pathname, target)}
          hrefLang={target}
          lang={target}
          onClick={() => setAnchorEl(null)}
          selected={locale === target}
        >
          {LOCALE_LABELS[target]}
        </MenuItem>
      ))}
    </Menu>
  );

  const trigger = (
    <Tooltip title={`${languageLabel}: ${currentLabel}`}>
      <IconButton
        {...triggerProps}
        color="inherit"
        size="large"
        sx={{
          flexShrink: 0,
          color: "text.primary",
          borderRadius: 2,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <MdLanguage size={24} aria-hidden />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {trigger}
      {menu}
    </>
  );
}
