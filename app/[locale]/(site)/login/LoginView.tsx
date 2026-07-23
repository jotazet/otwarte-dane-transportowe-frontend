"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MdLock } from "react-icons/md";

import { PasswordTextField } from "@/components/PasswordTextField";
import { OdtLogo } from "@/components/OdtLogo";
import { useAuth } from "@/lib/auth/AuthContext";

export function LoginView({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    username: string;
    password: string;
    login: string;
    backHome: string;
    invalidCredentials: string;
    loginFailed: string;
    showPassword?: string;
    hidePassword?: string;
  };
}) {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const destination =
    returnUrl && returnUrl.startsWith(`/${locale}`) ? returnUrl : `/${locale}`;

  React.useEffect(() => {
    if (auth.status === "authenticated") router.replace(destination);
  }, [auth.status, destination, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await auth.login({ username: username.trim(), password });
      router.replace(destination);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "INVALID_CREDENTIALS") {
        setError(labels.invalidCredentials);
      } else {
        setError(labels.loginFailed);
      }
      setPending(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        py: { xs: 4, sm: 6 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={2.25}>
              <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <OdtLogo sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                    ODT
                  </Typography>
                </Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                  {labels.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {labels.subtitle}
                </Typography>
              </Stack>

              <Divider />

              {error ? <Alert severity="error">{error}</Alert> : null}

              <Box component="form" onSubmit={submit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label={labels.username}
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    fullWidth
                    required
                    autoFocus
                    disabled={pending}
                  />
                  <PasswordTextField
                    label={labels.password}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    fullWidth
                    required
                    disabled={pending}
                    showPasswordLabel={labels.showPassword}
                    hidePasswordLabel={labels.hidePassword}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={pending || !username.trim() || !password}
                    startIcon={<MdLock size={20} aria-hidden />}
                    sx={{ fontWeight: 800, textTransform: "none", borderRadius: 2 }}
                  >
                    {labels.login}
                  </Button>
                </Stack>
              </Box>

              <Link
                component={NextLink}
                href={`/${locale}`}
                underline="hover"
                sx={{ alignSelf: "center", fontWeight: 700 }}
              >
                {labels.backHome}
              </Link>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
