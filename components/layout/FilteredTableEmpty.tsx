import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function FilteredTableEmpty({
  hasAnyData,
  error,
  emptyMessage,
  noMatchMessage,
}: {
  hasAnyData: boolean;
  error: string | null;
  emptyMessage: string;
  noMatchMessage: string;
}) {
  if (error) return null;
  if (!hasAnyData) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {noMatchMessage}
      </Typography>
    </Box>
  );
}
