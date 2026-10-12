"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { buildPageRange, pageHref } from "@/lib/ui/pagination";

export function BlogPagination({
  locale,
  page,
  totalPages,
  labels,
}: {
  locale: string;
  page: number;
  totalPages: number;
  labels: { prev: string; next: string; page: string };
}) {
  if (totalPages <= 1) return null;

  const basePath = `/${locale}/blog`;
  const items = buildPageRange(page, totalPages);

  return (
    <Stack
      direction="row"
      spacing={0.75}
      useFlexGap
      sx={{ alignItems: "center", justifyContent: "center", flexWrap: "wrap", py: 2 }}
    >
      <Button
        component={NextLink}
        href={pageHref(basePath, page - 1)}
        prefetch={false}
        variant="outlined"
        size="small"
        disabled={page <= 1}
        aria-label={labels.prev}
      >
        {labels.prev}
      </Button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <Typography
            key={`ellipsis-${index}`}
            variant="body2"
            color="text.secondary"
            sx={{ px: 0.5 }}
          >
            …
          </Typography>
        ) : (
          <Button
            key={item}
            component={NextLink}
            href={pageHref(basePath, item)}
            prefetch={false}
            variant={item === page ? "contained" : "outlined"}
            size="small"
            aria-label={labels.page.replace("{n}", String(item))}
            aria-current={item === page ? "page" : undefined}
            sx={{ minWidth: 40 }}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        component={NextLink}
        href={pageHref(basePath, page + 1)}
        prefetch={false}
        variant="outlined"
        size="small"
        disabled={page >= totalPages}
        aria-label={labels.next}
      >
        {labels.next}
      </Button>
    </Stack>
  );
}
