"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  MdArticle,
  MdClose,
  MdDataset,
  MdHome,
  MdInfoOutline,
  MdMenu,
  MdRuleFolder,
} from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { OdtLogo } from "@/components/OdtLogo";

const DRAWER_WIDTH = 320;

export function MuiAppShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const nav = React.useMemo(
    () =>
      [
        {
          href: `/${locale}/blog`,
          label: dict.blog,
          icon: <MdArticle size={22} aria-hidden />,
        },
        {
          href: `/${locale}/cases`,
          label: dict.cases,
          icon: <MdRuleFolder size={22} aria-hidden />,
        },
        {
          href: `/${locale}/data`,
          label: dict.data,
          icon: <MdDataset size={22} aria-hidden />,
        },
        {
          href: `/${locale}/info`,
          label: dict.info,
          icon: <MdInfoOutline size={22} aria-hidden />,
        },
      ] as const,
    [dict.blog, dict.cases, dict.data, dict.info, locale],
  );

  function isActive(href: string) {
    if (pathname === href) return true;
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname.startsWith(`${href}/`);
  }

  const drawer = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
      role="presentation"
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: 56,
          px: 2,
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: 700, lineHeight: 1.2, flex: 1, minWidth: 0 }}
        >
          {dict.appName}
        </Typography>
        <IconButton
          aria-label={dict.close}
          onClick={() => setMobileOpen(false)}
          edge="end"
          size="small"
        >
          <MdClose size={22} />
        </IconButton>
      </Toolbar>
      <List
        sx={{ py: 1.5, px: 1, flex: 1 }}
        component="nav"
        aria-label={dict.menu}
      >
        <ListItemButton
          component={NextLink}
          href={`/${locale}`}
          selected={isActive(`/${locale}`)}
          onClick={() => setMobileOpen(false)}
          sx={{
            borderRadius: "12px",
            mb: 0.5,
            py: 1.25,
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "& .MuiListItemIcon-root": { color: "inherit" },
              "&:hover": { bgcolor: "primary.dark" },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
            <MdHome size={22} aria-hidden />
          </ListItemIcon>
          <ListItemText
            primary={dict.home}
            slotProps={{ primary: { sx: { fontWeight: 500 } } }}
          />
        </ListItemButton>
        <Divider sx={{ my: 1, mx: 1 }} />
        {nav.map((item) => (
          <ListItemButton
            key={item.href}
            component={NextLink}
            href={item.href}
            selected={isActive(item.href)}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: "12px",
              mb: 0.5,
              py: 1.25,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": { color: "inherit" },
                "&:hover": { bgcolor: "primary.dark" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { sx: { fontWeight: 500 } } }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Desktop: stretch w pionie — podkreślenie na dolnej krawędzi (na szarej linii AppBara). Mobile: center. */}
          <Box>
            <Toolbar
              disableGutters
              sx={{
                gap: { xs: 1, md: 1.5 },
                minHeight: { xs: 56, md: 64 },
                py: { xs: 1, md: 0 },
                px: 0,
                alignItems: { xs: "center", md: "stretch" },
                flexWrap: "nowrap",
              }}
            >
              {!isMdUp ? (
                <IconButton
                  color="inherit"
                  aria-label={dict.menu}
                  aria-haspopup="true"
                  aria-expanded={mobileOpen}
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  size="large"
                  sx={{
                    alignSelf: "center",
                    color: "text.primary",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <MdMenu size={24} aria-hidden />
                </IconButton>
              ) : null}

              <Box
                component={NextLink}
                href={`/${locale}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  textDecoration: "none",
                  color: "primary.main",
                  minWidth: 0,
                  flex: "0 0 auto",
                  alignSelf: { xs: "auto", md: "stretch" },
                  pr: { md: 0.5 },
                }}
              >
                <OdtLogo sx={{ fontSize: 36, flexShrink: 0, color: "primary.main" }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.15,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {dict.appName}
                  </Typography>
                </Box>
              </Box>

              {isMdUp ? (
                <Box
                  component="nav"
                  aria-label={dict.menu}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: { xs: "center", md: "stretch" },
                    justifyContent: "flex-start",
                    gap: 0.25,
                    minWidth: 0,
                  }}
                >
                  {nav.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Button
                        key={item.href}
                        component={NextLink}
                        href={item.href}
                        prefetch
                        variant="text"
                        color="inherit"
                        disableRipple
                        sx={{
                          textTransform: "none",
                          fontWeight: active ? 600 : 500,
                          fontSize: "0.9375rem",
                          lineHeight: 1.25,
                          px: 2,
                          py: { xs: 1.25, md: 0 },
                          minWidth: "auto",
                          minHeight: 0,
                          height: { md: "100%" },
                          alignSelf: { xs: "auto", md: "stretch" },
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: active ? "primary.main" : "text.secondary",
                          bgcolor: "transparent",
                          borderRadius: 0,
                          borderBottom: "2px solid",
                          borderColor: active ? "primary.main" : "transparent",
                          boxShadow: "none",
                          mb: "-1px",
                          "&:hover": {
                            bgcolor: "transparent",
                            color: active ? "primary.main" : "text.primary",
                            borderColor: active ? "primary.main" : "divider",
                          },
                          "&:active": { bgcolor: "transparent" },
                          "&.Mui-focusVisible": {
                            bgcolor: "transparent",
                            boxShadow: (t) => `inset 0 0 0 2px ${t.palette.primary.main}`,
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ flex: 1 }} />
              )}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                  alignSelf: { xs: "auto", md: "stretch" },
                }}
              >
                <LocaleSwitcher locale={locale} languageLabel={dict.language} />
              </Box>
            </Toolbar>
          </Box>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            elevation: 12,
            sx: {
              width: DRAWER_WIDTH,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
              bgcolor: "background.paper",
              borderTopRightRadius: "16px",
              borderBottomRightRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "none",
            },
          },
        }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, overflowX: "clip" }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
          minHeight: { xs: 56, md: 64 },
          display: "flex",
          alignItems: "center",
          py: 0,
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: "md", lineHeight: 1.45 }}
          >
            {dict.footer}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
