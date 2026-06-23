"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { buildPageRange } from "@/lib/ui/pagination";

/** Client-side (callback) pagination for auth-gated lists. */
export function ListPagination({
  page,
  totalPages,
  onPageChange,
  labels,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: { prev: string; next: string; page: string };
}) {
  if (totalPages <= 1) return null;

  const items = buildPageRange(page, totalPages);

  return (
    <Stack
      direction="row"
      spacing={0.75}
      useFlexGap
      sx={{ alignItems: "center", justifyContent: "center", flexWrap: "wrap", py: 2 }}
    >
      <Button
        variant="outlined"
        size="small"
        disabled={page <= 1}
        aria-label={labels.prev}
        onClick={() => onPageChange(page - 1)}
      >
        {labels.prev}
      </Button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <Typography key={`ellipsis-${index}`} variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
            …
          </Typography>
        ) : (
          <Button
            key={item}
            variant={item === page ? "contained" : "outlined"}
            size="small"
            aria-label={labels.page.replace("{n}", String(item))}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            sx={{ minWidth: 40 }}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="outlined"
        size="small"
        disabled={page >= totalPages}
        aria-label={labels.next}
        onClick={() => onPageChange(page + 1)}
      >
        {labels.next}
      </Button>
    </Stack>
  );
}
