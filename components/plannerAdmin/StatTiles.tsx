import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** A row of numbers with their labels, wrapping into as many columns as fit. */
export function StatTiles({
  items,
  minWidth = 150,
}: {
  items: { label: string; value: string }[];
  minWidth?: number;
}) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 1.25,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            gap: 0.25,
            px: 1.75,
            py: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography component="dt" variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            component="dd"
            sx={{ m: 0, fontSize: "1.375rem", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
