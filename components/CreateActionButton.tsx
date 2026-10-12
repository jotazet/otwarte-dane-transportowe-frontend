"use client";

import Button from "@mui/material/Button";
import NextLink from "next/link";
import { MdAdd } from "react-icons/md";

import { AccessGate } from "@/components/AccessGate";
import type { AppRole } from "@/lib/auth/roles";

export function CreateActionButton({
  href,
  label,
  roles,
}: {
  href: string;
  label: string;
  roles: AppRole[];
}) {
  return (
    <AccessGate roles={roles}>
      <Button
        component={NextLink}
        href={href}
        prefetch={false}
        variant="contained"
        startIcon={<MdAdd size={20} aria-hidden />}
        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
      >
        {label}
      </Button>
    </AccessGate>
  );
}
