"use client";

import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

const pulse = keyframes`
  from { transform: scale(1); opacity: 0.6; }
  to { transform: scale(2.8); opacity: 0; }
`;

/** A state in a bordered box: a colour dot next to the title, the explanation below. */
export function StatusPanel({
  color,
  title,
  body,
}: {
  /** A palette path, such as `"success.main"`. */
  color: string;
  title: string;
  body: string;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        columnGap: 1.5,
        alignItems: "center",
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {/* Keyed by colour, so the ring plays again when the state changes. */}
      <Box
        key={color}
        aria-hidden
        sx={{
          position: "relative",
          width: 10,
          height: 10,
          borderRadius: "50%",
          color,
          bgcolor: "currentColor",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            bgcolor: "currentColor",
            // Three rings, then still: WCAG 2.2.2 allows motion that starts by itself
            // only if it stops within five seconds.
            animation: `${pulse} 1.5s ease-out 3`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        }}
      />
      <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ gridColumn: 2 }}>
        {body}
      </Typography>
    </Box>
  );
}
