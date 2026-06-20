"use client";

import type { ReactNode } from "react";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingBlock } from "@/components/layout/LoadingBlock";
import { ForbiddenState } from "@/components/layout/ForbiddenState";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRoleAccess } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";

type AccessGateDict = {
  requiresLogin: string;
  login: string;
  forbidden: string;
  home?: string;
};

type Mode = "hide" | "empty" | "forbidden";

export function AccessGate({
  roles,
  children,
  mode = "empty",
  locale,
  dict,
  requireAuth,
  forbiddenAlternateHref,
  forbiddenAlternateLabel,
}: {
  roles?: AppRole[];
  children: ReactNode;
  mode?: Mode;
  locale?: string;
  dict?: AccessGateDict;
  /** When true, any authenticated user passes (ignores roles). */
  requireAuth?: boolean;
  forbiddenAlternateHref?: string;
  forbiddenAlternateLabel?: string;
}) {
  const auth = useAuth();

  if (auth.status === "loading") {
    if (mode === "hide") return null;
    return <LoadingBlock />;
  }

  if (auth.status !== "authenticated") {
    if (mode === "hide") return null;
    if (dict && locale) {
      return (
        <EmptyState
          title={dict.requiresLogin}
          actionLabel={dict.login}
          actionHref={`/${locale}/login`}
        />
      );
    }
    return null;
  }

  if (requireAuth) return <>{children}</>;

  if (roles?.length) {
    const user = {
      roles: auth.user.roles,
      isDjangoAdmin: auth.user.isDjangoAdmin,
    };
    if (!hasRoleAccess(user, roles)) {
      if (mode === "hide") return null;
      if (dict && locale) {
        return (
          <ForbiddenState
            message={dict.forbidden}
            loginHref={`/${locale}`}
            loginLabel={dict.home ?? dict.login}
            alternateHref={forbiddenAlternateHref}
            alternateLabel={forbiddenAlternateLabel}
          />
        );
      }
      return null;
    }
  }

  return <>{children}</>;
}

/** @deprecated Use AccessGate */
export function RoleGate(props: { roles: AppRole[]; children: ReactNode }) {
  return <AccessGate roles={props.roles} mode="hide">{props.children}</AccessGate>;
}
