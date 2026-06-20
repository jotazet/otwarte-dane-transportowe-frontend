"use client";

import type { ReactNode } from "react";
import Stack from "@mui/material/Stack";

import { AppBreadcrumbs, type BreadcrumbItem } from "@/components/layout/AppBreadcrumbs";
import { PageSection } from "@/components/PageSection";
import { resolveBackHref } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";

export function AppPage({
  children,
  breadcrumbs,
  locale,
  backLabel,
  maxWidth = "lg",
}: {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  locale: string;
  backLabel: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const homeHref = paths(locale).home;
  const backHref = breadcrumbs?.length ? resolveBackHref(breadcrumbs, homeHref) : homeHref;

  return (
    <PageSection maxWidth={maxWidth}>
      {breadcrumbs?.length ? (
        <AppBreadcrumbs items={breadcrumbs} backHref={backHref} backLabel={backLabel} />
      ) : null}
      <Stack spacing={3}>{children}</Stack>
    </PageSection>
  );
}
