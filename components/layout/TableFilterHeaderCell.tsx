import Box from "@mui/material/Box";
import TableCell from "@mui/material/TableCell";

import { TableFilterSelect } from "@/components/TableFilterSelect";

export function TableFilterHeaderCell({
  label,
  minWidth,
  filterValue,
  onFilterChange,
  options,
  emptyLabel,
}: {
  label: string;
  minWidth?: number;
  filterValue: string;
  onFilterChange: (value: string) => void;
  options: string[];
  emptyLabel: string;
}) {
  return (
    <TableCell sx={minWidth != null ? { minWidth } : undefined}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: "0.8125rem",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </Box>
        <TableFilterSelect
          value={filterValue}
          onChange={onFilterChange}
          options={options}
          emptyLabel={emptyLabel}
          ariaLabel={label}
        />
      </Box>
    </TableCell>
  );
}
