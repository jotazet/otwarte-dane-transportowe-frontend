"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import * as React from "react";
import {
  MdAdd,
  MdArrowForward,
  MdArticle,
  MdAssignment,
  MdCloudUpload,
  MdCode,
  MdDataset,
  MdWbCloudy,
  MdManageAccounts,
  MdMonitorHeart,
  MdRoute,
  MdRuleFolder,
  MdTrain,
} from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/locales";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuthUserClaims } from "@/lib/auth/permissions";
import {
  hasAdminAccess,
  hasBlogManageAccess,
  hasDataProviderAccess,
  hasHelperAccess,
} from "@/lib/auth/permissions";
import { paths } from "@/lib/nav/routes";

const HOME_MOTIVATION_KEYS = [
  "homeMotivation1",
  "homeMotivation2",
  "homeMotivation3",
  "homeMotivation4",
  "homeMotivation5",
] as const;

type HomeCard = { title: string; body: string; href: string; icon: React.ReactNode; key: string };

function buildRoleCards(
  dict: Dictionary,
  p: ReturnType<typeof paths>,
  user: Pick<AuthUserClaims, "roles" | "isDjangoAdmin">,
): HomeCard[] {
  const cards: HomeCard[] = [];

  if (hasBlogManageAccess(user)) {
    cards.push({
      key: "blog",
      title: dict.blog,
      body: dict.blogIntro,
      href: p.blog,
      icon: <MdArticle size={28} aria-hidden />,
    });
    cards.push({
      key: "blog-new",
      title: dict.createPost,
      body: dict.homeCreatePostHint ?? dict.blogIntro,
      href: p.blogNew,
      icon: <MdAdd size={28} aria-hidden />,
    });
  }
  if (hasDataProviderAccess(user)) {
    cards.push({
      key: "my-feeds",
      title: dict.myFeeds,
      body: dict.myFeedsSubtitle ?? dict.dataIntro,
      href: p.mySubmissions,
      icon: <MdWbCloudy size={28} aria-hidden />,
    });
    cards.push({
      key: "add-feed",
      title: dict.addNewFeed,
      body: dict.staticSubmissionHint,
      href: p.mySubmissionsNew(),
      icon: <MdCloudUpload size={28} aria-hidden />,
    });
  }
  if (hasHelperAccess(user)) {
    cards.push({
      key: "queue",
      title: dict.submissions,
      body: dict.submissionsQueueHint,
      href: p.queue,
      icon: <MdAssignment size={28} aria-hidden />,
    });
    cards.push({
      key: "providers",
      title: dict.providers,
      body: dict.providersDesc,
      href: p.casesProviders,
      icon: <MdRuleFolder size={28} aria-hidden />,
    });
  }
  if (hasHelperAccess(user) || hasAdminAccess(user)) {
    cards.push({
      key: "feed-ops",
      title: dict.feedOps,
      body: dict.feedOpsDesc,
      href: p.feedOps,
      icon: <MdMonitorHeart size={28} aria-hidden />,
    });
  }
  if (hasAdminAccess(user)) {
    cards.push({
      key: "planner-admin",
      title: dict.plannerAdminTitle,
      body: dict.plannerAdminHomeCardBody,
      href: p.plannerAdmin,
      icon: <MdRoute size={28} aria-hidden />,
    });
    cards.push({
      key: "users",
      title: dict.users,
      body: dict.usersDesc,
      href: p.users,
      icon: <MdManageAccounts size={28} aria-hidden />,
    });
  }

  return cards;
}

function OverviewCards({
  cards,
  dict,
  outlined,
  perRowLg = 3,
}: {
  cards: readonly {
    title: string;
    body: string;
    href: string;
    icon: React.ReactNode;
    key?: string;
  }[];
  dict: Dictionary;
  outlined?: boolean;
  /** Cards in a row on large screens. */
  perRowLg?: 3 | 4;
}) {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {cards.map((c) => (
        <Grid size={{ xs: 12, sm: 6, lg: 12 / perRowLg }} key={c.key ?? c.href}>
          <Card sx={{ height: "100%", ...(outlined ? { borderColor: "primary.light" } : {}) }}>
            <CardActionArea
              component={Link}
              href={c.href}
              sx={{ height: "100%", alignItems: "stretch" }}
            >
              <CardContent>
                <Box sx={{ color: "primary.main" }}>{c.icon}</Box>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {c.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  {c.body}
                </Typography>
                {!outlined ? (
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
                ) : null}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function HomePageView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const auth = useAuth();
  const p = paths(locale);

  const publicCards = [
    {
      key: "blog",
      title: dict.blog,
      body: dict.blogIntro,
      href: p.blog,
      icon: <MdArticle size={28} aria-hidden />,
    },
    {
      key: "data",
      title: dict.data,
      body: dict.dataIntro,
      href: p.data,
      icon: <MdDataset size={28} aria-hidden />,
    },
    {
      key: "cases",
      title: dict.cases,
      body: dict.casesIntro,
      href: p.cases,
      icon: <MdRuleFolder size={28} aria-hidden />,
    },
    {
      key: "developers",
      title: dict.developers,
      body: dict.developersIntro,
      href: p.developers,
      icon: <MdCode size={28} aria-hidden />,
    },
  ] as const;

  const isLoading = auth.status === "loading";
  const isAuthenticated = auth.status === "authenticated";
  const roleCards = isAuthenticated
    ? buildRoleCards(dict, p, { roles: auth.user.roles, isDjangoAdmin: auth.user.isDjangoAdmin })
    : [];

  // Losowa wiadomość motywacyjna wybierana raz po zamontowaniu (Math.random poza renderem).
  const [motivationKey, setMotivationKey] = React.useState<(typeof HOME_MOTIVATION_KEYS)[number]>(
    HOME_MOTIVATION_KEYS[0],
  );
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setMotivationKey(
        HOME_MOTIVATION_KEYS[Math.floor(Math.random() * HOME_MOTIVATION_KEYS.length)],
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = isAuthenticated ? auth.user.firstName?.trim() || null : null;
  const greeting = firstName
    ? dict.homeGreeting.replace("{name}", firstName)
    : dict.homeGreetingNoName;

  return (
    <Box>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, sm: 7 } }}>
          <Box sx={{ maxWidth: 720 }}>
            {isLoading ? (
              <>
                <Skeleton variant="text" width="55%" height={48} />
                <Skeleton variant="text" width="80%" height={32} sx={{ mt: 2 }} />
              </>
            ) : isAuthenticated ? (
              <>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{ fontWeight: 500, letterSpacing: "-0.02em" }}
                >
                  {greeting}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mt: 2, fontWeight: 500, lineHeight: 1.5 }}
                >
                  {dict[motivationKey]}
                </Typography>
              </>
            ) : (
              <>
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
                    href={p.data}
                    variant="contained"
                    size="large"
                    color="primary"
                  >
                    {dict.browseData}
                  </Button>
                  <Button
                    component={Link}
                    href={p.info}
                    variant="outlined"
                    size="large"
                    color="primary"
                  >
                    {dict.learnMore}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
        {isAuthenticated && roleCards.length > 0 ? (
          <>
            <Typography variant="h5" component="h2" gutterBottom>
              {dict.homeRolePanel ?? dict.account}
            </Typography>
            <OverviewCards cards={roleCards} dict={dict} outlined />
          </>
        ) : null}

        {(!isAuthenticated || roleCards.length === 0) && (
          <>
            <Typography variant="h5" component="h2" gutterBottom>
              {dict.sectionOverview}
            </Typography>
            <OverviewCards cards={publicCards} dict={dict} perRowLg={4} />
          </>
        )}
      </Container>
    </Box>
  );
}
