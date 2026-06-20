"use client";

import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import NextLink from "next/link";

import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { paths } from "@/lib/nav/routes";

export function SubmissionDetailAuthGate({
  locale,
  dict,
  error,
  hasData,
  children,
}: {
  locale: string;
  dict: Dictionary;
  error: string | null;
  hasData: boolean;
  children: ReactNode;
}) {
  const auth = useAuth();

  if (auth.status !== "authenticated") {
    return (
      <Alert severity="info">
        <Link component={NextLink} href={paths(locale).login()} prefetch={false}>
          {dict.requiresLogin}
        </Link>
      </Alert>
    );
  }

  if (error && !hasData) return <Alert severity="error">{error}</Alert>;
  if (!hasData) return <LoadingBlock label={dict.loading} />;

  return <>{children}</>;
}
