"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { MdLogout, MdPerson, MdSettings } from "react-icons/md";

import { useAuth } from "@/lib/auth/AuthContext";
import { formatRoles } from "@/lib/auth/roleLabels";
import { paths } from "@/lib/nav/routes";

type DictionaryShape = {
  login: string;
  account: string;
  logout: string;
  accountSettings?: string;
  roleAdmin?: string;
  roleHelper?: string;
  roleDataProvider?: string;
  roleBlogger?: string;
  roleEditor?: string;
};

export function AuthButton({
  locale,
  labels,
  roleLabels,
}: {
  locale: string;
  labels: { login: string; account: string; logout: string };
  roleLabels?: Partial<DictionaryShape>;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const dict = { ...labels, ...roleLabels };
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (auth.status === "loading") {
    return (
      <Skeleton
        variant="circular"
        width={32}
        height={32}
        animation="wave"
        sx={{ flexShrink: 0 }}
        aria-hidden
      />
    );
  }

  if (auth.status !== "authenticated") {
    const loginHref = `/${locale}/login?returnUrl=${encodeURIComponent(pathname || `/${locale}`)}`;
    return (
      <Tooltip title={labels.login}>
        <IconButton
          component={NextLink}
          href={loginHref}
          prefetch={false}
          size="small"
          aria-label={labels.login}
          sx={{ flexShrink: 0 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "action.selected", color: "text.secondary" }}>
            <MdPerson size={18} aria-hidden />
          </Avatar>
        </IconButton>
      </Tooltip>
    );
  }

  const displayName =
    [auth.user.firstName, auth.user.lastName].filter(Boolean).join(" ") ||
    auth.user.username ||
    labels.account;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  return (
    <>
      <Tooltip title={displayName}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={labels.account}
          aria-haspopup="true"
          aria-expanded={open}
          sx={{ flexShrink: 0 }}
        >
          <Avatar sx={{ width: 32, height: 32, fontWeight: 800, bgcolor: "primary.main" }}>
            {initials || <MdPerson size={18} aria-hidden />}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { dense: true },
          paper: { sx: { minWidth: 240, mt: 0.5 } },
        }}
      >
        <MenuItem disabled>
          <ListItemText
            primary={displayName}
            secondary={formatRoles(auth.user.roles, dict) || "-"}
            slotProps={{
              primary: { sx: { fontWeight: 700 } },
              secondary: { sx: { fontSize: 12 } },
            }}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          component={NextLink}
          href={paths(locale).account}
          prefetch={false}
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <MdSettings size={20} aria-hidden />
          </ListItemIcon>
          <ListItemText primary={dict.accountSettings ?? labels.account} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            auth.logout();
          }}
        >
          <ListItemIcon>
            <MdLogout size={20} aria-hidden />
          </ListItemIcon>
          <ListItemText primary={labels.logout} />
        </MenuItem>
      </Menu>
    </>
  );
}
