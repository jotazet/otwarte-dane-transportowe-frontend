import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function DetailField({
  label,
  value,
  emptyFallback = "-",
}: {
  label: string;
  value: string;
  emptyFallback?: string;
}) {
  const display = value.trim() ? value : emptyFallback;
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2">{display}</Typography>
    </Stack>
  );
}
