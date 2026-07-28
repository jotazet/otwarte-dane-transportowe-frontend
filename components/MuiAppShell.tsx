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
import Skeleton from "@mui/material/Skeleton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  MdArticle,
  MdClose,
  MdDataset,
  MdHome,
  MdInfoOutline,
  MdLogout,
  MdMenu,
  MdPerson,
  MdRuleFolder,
  MdSettings,
} from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { AuthButton } from "@/components/AuthButton";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { OdtLogo } from "@/components/OdtLogo";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { navActiveHref, paths } from "@/lib/nav/routes";

const DRAWER_WIDTH = 320;
const TOOLBAR_GAP_PX = 8;

function drawerItemSx() {
  return {
    borderRadius: "12px",
    mb: 0.5,
    py: 1.25,
    "&.Mui-selected": {
      bgcolor: "primary.main",
      color: "primary.contrastText",
      "& .MuiListItemIcon-root": { color: "inherit" },
      "&:hover": { bgcolor: "primary.dark" },
    },
  } as const;
}

export function MuiAppShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MuiAppShellInner locale={locale} dict={dict}>
        {children}
      </MuiAppShellInner>
    </AuthProvider>
  );
}

function MuiAppShellInner({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobileNav = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [compactActions, setCompactActions] = React.useState(false);
  const [compactActionsReady, setCompactActionsReady] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const hamburgerRef = React.useRef<HTMLButtonElement>(null);
  const logoRef = React.useRef<HTMLAnchorElement>(null);
  const actionsMeasureRef = React.useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const p = paths(locale);
  const loginHref = `/${locale}/login?returnUrl=${encodeURIComponent(pathname || `/${locale}`)}`;

  const updateToolbarLayout = React.useCallback(() => {
    const toolbar = toolbarRef.current;
    const hamburger = hamburgerRef.current;
    const logo = logoRef.current;
    const actions = actionsMeasureRef.current;
    if (!toolbar || !logo || !actions) return;

    if (isMobileNav) {
      if (hamburger) {
        const reservedWidth =
          hamburger.offsetWidth + logo.offsetWidth + actions.offsetWidth + TOOLBAR_GAP_PX * 3;
        setCompactActions(reservedWidth > toolbar.clientWidth);
      }
    } else {
      setCompactActions(false);
    }

    setCompactActionsReady(true);
  }, [isMobileNav]);

  const nav = React.useMemo(
    () => [
      { href: p.blog, label: dict.blog, icon: <MdArticle size={22} aria-hidden /> },
      { href: p.cases, label: dict.cases, icon: <MdRuleFolder size={22} aria-hidden /> },
      { href: p.data, label: dict.data, icon: <MdDataset size={22} aria-hidden /> },
      { href: p.info, label: dict.info, icon: <MdInfoOutline size={22} aria-hidden /> },
    ],
    [dict.blog, dict.cases, dict.data, dict.info, p.blog, p.cases, p.data, p.info],
  );

  const activeHref = React.useMemo(() => {
    const candidates = [p.home, ...nav.map((n) => n.href)];
    return navActiveHref(pathname, locale, candidates);
  }, [locale, nav, pathname, p.home]);

  function isActive(href: string) {
    return activeHref === href;
  }

  const navButtonSx = (active: boolean) =>
    ({
      textTransform: "none",
      fontWeight: active ? 600 : 500,
      fontSize: "0.9375rem",
      lineHeight: 1.25,
      whiteSpace: "nowrap",
      flexShrink: 0,
      px: { md: 1.25, lg: 2 },
      py: 0,
      minWidth: "auto",
      minHeight: 0,
      height: "100%",
      alignSelf: "stretch",
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
    }) as const;

  React.useLayoutEffect(() => {
    // Pomiar layoutu przed paintem — synchroniczny setState jest tu zamierzony (unika migotania).
    if (auth.status === "loading") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompactActionsReady(false);
    }

    updateToolbarLayout();
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const observer = new ResizeObserver(updateToolbarLayout);
    observer.observe(toolbar);
    if (logoRef.current) observer.observe(logoRef.current);
    if (actionsMeasureRef.current) observer.observe(actionsMeasureRef.current);

    return () => observer.disconnect();
  }, [updateToolbarLayout, auth.status, locale, dict.appName, nav]);

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
          bgcolor: "background.default",
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          {dict.appName}
        </Typography>
        <ColorModeToggle
          darkModeLabel={dict.darkMode}
          lightModeLabel={dict.lightMode}
          size="small"
        />
        <IconButton aria-label={dict.close} onClick={() => setMobileOpen(false)} edge="end" size="small">
          <MdClose size={22} />
        </IconButton>
      </Toolbar>
      <List sx={{ py: 1.5, px: 1, flex: 1 }} component="nav" aria-label={dict.menu}>
        <ListItemButton
          component={NextLink}
          href={p.home}
          selected={isActive(p.home)}
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
          <ListItemText primary={dict.home} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
        </ListItemButton>
        <Divider sx={{ my: 1, mx: 1 }} />
        {nav.map((item) => (
          <ListItemButton
            key={item.href}
            component={NextLink}
            href={item.href}
            selected={isActive(item.href)}
            onClick={() => setMobileOpen(false)}
            sx={drawerItemSx()}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
          </ListItemButton>
        ))}
        {compactActionsReady && compactActions ? (
          <>
            <Divider sx={{ my: 1, mx: 1 }} />
            {auth.status === "loading" ? (
              <ListItemButton disabled sx={drawerItemSx()}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Skeleton variant="circular" width={22} height={22} animation="wave" />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton width="60%" animation="wave" />}
                  slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                />
              </ListItemButton>
            ) : auth.status === "authenticated" ? (
              <>
                <ListItemButton
                  component={NextLink}
                  href={p.account}
                  selected={isActive(p.account)}
                  onClick={() => setMobileOpen(false)}
                  sx={drawerItemSx()}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                    <MdSettings size={22} aria-hidden />
                  </ListItemIcon>
                  <ListItemText primary={dict.myAccount} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    auth.logout();
                  }}
                  sx={drawerItemSx()}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                    <MdLogout size={22} aria-hidden />
                  </ListItemIcon>
                  <ListItemText primary={dict.logout} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                </ListItemButton>
              </>
            ) : (
              <ListItemButton
                component={NextLink}
                href={loginHref}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                sx={drawerItemSx()}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                  <MdPerson size={22} aria-hidden />
                </ListItemIcon>
                <ListItemText primary={dict.login} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
              </ListItemButton>
            )}
          </>
        ) : null}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          <Box>
            <Toolbar
              ref={toolbarRef}
              disableGutters
              sx={{
                gap: { xs: 1, md: 0 },
                minHeight: { xs: 56, md: 64 },
                py: { xs: 1, md: 0 },
                px: 0,
                alignItems: { xs: "center", md: "stretch" },
                flexWrap: "nowrap",
                position: "relative",
                display: { xs: "flex", md: "grid" },
                gridTemplateColumns: { md: "auto minmax(0, 1fr) auto" },
                columnGap: { md: 2 },
              }}
            >
              <IconButton
                ref={hamburgerRef}
                color="inherit"
                aria-label={dict.menu}
                aria-haspopup="true"
                aria-expanded={mobileOpen}
                edge="start"
                onClick={() => setMobileOpen(true)}
                size="large"
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  alignSelf: "center",
                  color: "text.primary",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <MdMenu size={24} aria-hidden />
              </IconButton>

              <Box
                ref={logoRef}
                component={NextLink}
                href={p.home}
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

              <Box
                component="nav"
                aria-label={dict.menu}
                sx={{
                  display: { xs: "none", md: "flex" },
                  minWidth: 0,
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  gap: 0.25,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  "&::-webkit-scrollbar": { display: "none" },
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
                      sx={navButtonSx(active)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>

              <Box sx={{ display: { xs: "flex", md: "none" }, flex: 1, minWidth: 0 }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexShrink: 0,
                  alignSelf: { xs: "auto", md: "center" },
                  justifySelf: { md: "end" },
                }}
              >
                {auth.status === "loading" || !compactActionsReady || !compactActions ? (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {auth.status === "loading" ? (
                      <Skeleton variant="circular" width={32} height={32} animation="wave" aria-hidden />
                    ) : (
                      <AuthButton
                        locale={locale}
                        labels={{ login: dict.login, account: dict.account, logout: dict.logout }}
                        roleLabels={dict}
                      />
                    )}
                  </Box>
                ) : null}
                <LocaleSwitcher locale={locale} languageLabel={dict.language} />
                <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
                  <ColorModeToggle darkModeLabel={dict.darkMode} lightModeLabel={dict.lightMode} />
                </Box>
              </Box>
              <Box
                ref={actionsMeasureRef}
                aria-hidden
                sx={{
                  position: "absolute",
                  visibility: "hidden",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                <Box sx={{ width: 40, height: 40, flexShrink: 0 }} />
                <LocaleSwitcher locale={locale} languageLabel={dict.language} />
                <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
                  <ColorModeToggle darkModeLabel={dict.darkMode} lightModeLabel={dict.lightMode} />
                </Box>
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
          bgcolor: "background.default",
          minHeight: { xs: 56, md: 64 },
          display: "flex",
          alignItems: "center",
          py: 0,
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "md", lineHeight: 1.45 }}>
            {dict.footer}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
