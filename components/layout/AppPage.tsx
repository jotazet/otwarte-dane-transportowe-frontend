"use client";

import type { ReactNode } from "react";

import { AppBreadcrumbs, type BreadcrumbItem } from "@/components/layout/AppBreadcrumbs";
import { PageSection } from "@/components/PageSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolveBackHref } from "@/lib/nav/breadcrumbTrails";
import { paths } from "@/lib/nav/routes";
import { breadcrumbLd } from "@/lib/seo/structuredData";

export function AppPage({
  children,
  breadcrumbs,
  locale,
  backLabel,
  breadcrumbsLabel,
  maxWidth = "lg",
}: {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  locale: string;
  backLabel: string;
  breadcrumbsLabel: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const homeHref = paths(locale).home;
  const backHref = breadcrumbs?.length ? resolveBackHref(breadcrumbs, homeHref) : homeHref;

  return (
    <PageSection maxWidth={maxWidth}>
      <JsonLd data={breadcrumbLd(breadcrumbs ?? [])} />
      {breadcrumbs?.length ? (
        <AppBreadcrumbs
          items={breadcrumbs}
          backHref={backHref}
          backLabel={backLabel}
          label={breadcrumbsLabel}
        />
      ) : null}
      {children}
    </PageSection>
  );
}
