"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { EmptyState } from "@/components/layout/EmptyState";
import { ForbiddenState } from "@/components/layout/ForbiddenState";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { paths } from "@/lib/nav/routes";

export function SubmissionDetailAuthGate({
  locale,
  dict,
  error,
  hasData,
  forbidden,
  children,
}: {
  locale: string;
  dict: Dictionary;
  error: string | null;
  hasData: boolean;
  forbidden?: boolean;
  children: ReactNode;
}) {
  const auth = useAuth();
  const pathname = usePathname() || "";
  const loginHref =
    pathname.startsWith(`/${locale}`)
      ? paths(locale).login(pathname)
      : paths(locale).login();

  if (auth.status === "loading") {
    return <LoadingBlock label={dict.loading} />;
  }

  if (auth.status !== "authenticated") {
    return (
      <EmptyState
        title={dict.requiresLogin}
        actionLabel={dict.login}
        actionHref={loginHref}
      />
    );
  }

  if (forbidden) {
    return (
      <ForbiddenState
        message={dict.forbidden}
        loginHref={paths(locale).home}
        loginLabel={dict.home ?? dict.login}
      />
    );
  }

  if (error && !hasData) return <ForbiddenState message={error} />;
  if (!hasData) return <LoadingBlock label={dict.loading} />;

  return <>{children}</>;
}
