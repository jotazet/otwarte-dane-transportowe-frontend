"use client";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { MdArrowBack } from "react-icons/md";

export type BreadcrumbItem = { label: string; href?: string };

export function AppBreadcrumbs({
  items,
  backHref,
  backLabel,
}: {
  items: BreadcrumbItem[];
  backHref: string;
  backLabel: string;
}) {
  const router = useRouter();
  const handleBack = React.useCallback(() => {
    router.push(backHref);
  }, [router, backHref]);

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minHeight: 40 }}>
      <Tooltip title={backLabel}>
        <IconButton onClick={handleBack} size="small" aria-label={backLabel} sx={{ flexShrink: 0 }}>
          <MdArrowBack size={22} aria-hidden />
        </IconButton>
      </Tooltip>
      <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 14, flex: 1, minWidth: 0 }}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          if (last || !item.href) {
            return (
              <Typography
                key={`${item.label}-${i}`}
                color="text.primary"
                sx={{ fontWeight: last ? 600 : 400 }}
              >
                {item.label}
              </Typography>
            );
          }
          return (
            <Link
              key={`${item.label}-${i}`}
              component={NextLink}
              href={item.href}
              underline="hover"
              color="inherit"
              prefetch={false}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Stack>
  );
}
