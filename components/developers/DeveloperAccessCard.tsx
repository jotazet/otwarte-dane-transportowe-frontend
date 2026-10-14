import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { MdCheckCircle, MdPublic, MdVpnKey } from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import { PLANNER_ANONYMOUS_LIMITS } from "@/lib/api/planner";
import { formatNumber } from "@/lib/format";
import { renderRichText } from "@/lib/richText";

type AccessCardDict = Pick<
  Dictionary,
  | "developersAccessTitle"
  | "developersNoSignUpTitle"
  | "developersNoSignUpBody"
  | "developersApiKeyTitle"
  | "developersApiKeyBody"
  | "developersBrowserTitle"
  | "developersBrowserBody"
  | "developersLimitsTitle"
  | "developersLimitLabels"
  | "developersLimitPerMinute"
  | "developersLimitsExceeded"
>;

export function DeveloperAccessCard({ locale, dict }: { locale: string; dict: AccessCardDict }) {
  const facts = [
    {
      icon: <MdCheckCircle aria-hidden />,
      title: dict.developersNoSignUpTitle,
      body: dict.developersNoSignUpBody,
    },
    {
      icon: <MdVpnKey aria-hidden />,
      title: dict.developersApiKeyTitle,
      body: dict.developersApiKeyBody,
    },
    {
      icon: <MdPublic aria-hidden />,
      title: dict.developersBrowserTitle,
      body: dict.developersBrowserBody,
    },
  ];
  const limits = Object.entries(PLANNER_ANONYMOUS_LIMITS) as [
    keyof typeof PLANNER_ANONYMOUS_LIMITS,
    number,
  ][];

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h6" component="h2">
          {dict.developersAccessTitle}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {facts.map((fact) => (
            <Grid key={fact.title} size={{ xs: 12, md: 4 }}>
              <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 24 } }}>
                {fact.icon}
              </Box>
              <Typography variant="subtitle1" component="h3" sx={{ mt: 1, fontWeight: 500 }}>
                {fact.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                {renderRichText(fact.body)}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="text.secondary" component="h3" sx={{ mt: 3 }}>
          {dict.developersLimitsTitle}
        </Typography>
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {limits.map(([group, perMinute]) => (
            <Grid key={group} size={{ xs: 12, sm: 4 }}>
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, px: 2, py: 1.5 }}>
                <Typography variant="h5" component="p">
                  {dict.developersLimitPerMinute.replace(
                    "{count}",
                    formatNumber(perMinute, locale),
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dict.developersLimitLabels[group]}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {dict.developersLimitsExceeded}
        </Typography>
      </CardContent>
    </Card>
  );
}
