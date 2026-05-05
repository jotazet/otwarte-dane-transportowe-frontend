"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {
  MdArrowForward,
  MdArticle,
  MdDataset,
  MdInfoOutline,
  MdRuleFolder,
  MdTrain,
} from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";

export function HomePageView({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const cards = [
    {
      title: dict.blog,
      body: dict.blogIntro,
      href: `/${locale}/blog`,
      icon: <MdArticle size={28} aria-hidden />,
    },
    {
      title: dict.cases,
      body: dict.casesIntro,
      href: `/${locale}/cases`,
      icon: <MdRuleFolder size={28} aria-hidden />,
    },
    {
      title: dict.data,
      body: dict.dataIntro,
      href: `/${locale}/data`,
      icon: <MdDataset size={28} aria-hidden />,
    },
    {
      title: dict.info,
      body: dict.infoIntro,
      href: `/${locale}/info`,
      icon: <MdInfoOutline size={28} aria-hidden />,
    },
  ] as const;

  return (
    <Box>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          background: (t) =>
            `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.grey[50]} 100%)`,
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, sm: 7 } }}>
          <Box sx={{ maxWidth: 720 }}>
            <Chip
              icon={<MdTrain size={18} aria-hidden />}
              label={dict.heroEyebrow}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="h3" component="h1" sx={{ mt: 3, fontWeight: 500 }}>
              {dict.heroTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {dict.heroBody}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                component={Link}
                href={`/${locale}/data`}
                variant="contained"
                size="large"
                color="primary"
              >
                {dict.browseData}
              </Button>
              <Button
                component={Link}
                href={`/${locale}/info`}
                variant="outlined"
                size="large"
                color="primary"
              >
                {dict.learnMore}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {dict.sectionOverview}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {cards.map((c) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={c.href}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea component={Link} href={c.href} sx={{ height: "100%", alignItems: "stretch" }}>
                  <CardContent>
                    <Box sx={{ color: "primary.main" }}>{c.icon}</Box>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                      {c.body}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center", mt: 2, color: "primary.main" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {dict.open}
                      </Typography>
                      <MdArrowForward size={18} aria-hidden />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
