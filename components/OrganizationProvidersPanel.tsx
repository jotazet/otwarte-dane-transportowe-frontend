"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { MdEdit } from "react-icons/md";

import { TableCard } from "@/components/TableCard";
import { getJson } from "@/lib/api/http";
import type { DataProviderRecord } from "@/lib/api/cases";
import { fetchAllPages } from "@/lib/api/types";
import type { Dictionary } from "@/i18n/getDictionary";
import { useAuth } from "@/lib/auth/AuthContext";
import { text } from "@/lib/format";
import { tableHeadRowSx } from "@/lib/ui/tableSx";

export function OrganizationProvidersPanel({
  locale,
  dict,
  organizationId,
  linked,
}: {
  locale: string;
  dict: Dictionary;
  organizationId: number;
  linked: { id?: number; name?: string | null; website?: string | null; contact_email?: string | null }[];
}) {
  const { apiJson } = useAuth();
  const router = useRouter();
  const [allProviders, setAllProviders] = React.useState<DataProviderRecord[]>([]);
  const linkedIds = linked.map((p) => p.id).filter((x): x is number => typeof x === "number");
  const [selectedIds, setSelectedIds] = React.useState<number[]>(linkedIds);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      setSelectedIds(linkedIds);
    })();
  }, [linkedIds.join(",")]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPages<DataProviderRecord>(
          (path) => getJson(path),
          "/api/cases/data-providers/",
        );
        if (!cancelled) setAllProviders(list);
      } catch {
        if (!cancelled) setAllProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveLinks() {
    setError(null);
    setSaving(true);
    try {
      await apiJson("PATCH", `/api/cases/transport-organizations/${organizationId}/`, {
        data_provider_ids: selectedIds,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const options = allProviders;
  const selected = options.filter((p) => selectedIds.includes(p.id));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {dict.providers}
        </Typography>
        <Button component={NextLink} href={`/${locale}/cases/data-providers/new`} prefetch={false} variant="outlined" size="small">
          {dict.createProvider}
        </Button>
      </Stack>
      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : null}
      <Autocomplete
        multiple
        options={options}
        value={selected}
        onChange={(_, v) => setSelectedIds(v.map((p) => p.id))}
        getOptionLabel={(o) => o.name}
        renderInput={(params) => (
          <TextField {...params} label={dict.linkProviders} placeholder={dict.search} />
        )}
        disabled={saving}
      />
      <Button variant="contained" size="small" onClick={() => void saveLinks()} disabled={saving} sx={{ alignSelf: "flex-start" }}>
        {dict.saveLinks}
      </Button>

      {linked.some((p) => p.id) ? (
        <TableCard>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>{dict.providers}</TableCell>
                <TableCell>{dict.website}</TableCell>
                <TableCell>{dict.contact}</TableCell>
                <TableCell sx={{ width: 56 }}>{dict.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linked.map((p, idx) =>
                p.id ? (
                  <TableRow key={`${p.id}-${idx}`} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{text(p.name)}</TableCell>
                    <TableCell>{text(p.website)}</TableCell>
                    <TableCell>{text(p.contact_email)}</TableCell>
                    <TableCell>
                      <Tooltip title={dict.edit}>
                        <IconButton
                          component={NextLink}
                          href={`/${locale}/cases/data-providers/${p.id}`}
                          prefetch={false}
                          size="small"
                          color="primary"
                          aria-label={dict.edit}
                        >
                          <MdEdit size={20} aria-hidden />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ) : null,
              )}
            </TableBody>
          </Table>
        </TableCard>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {dict.noLinkedProviders}
        </Typography>
      )}
    </Stack>
  );
}
