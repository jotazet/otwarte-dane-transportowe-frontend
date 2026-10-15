"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdContentCopy, MdFileDownload } from "react-icons/md";

import { visuallyHiddenSx } from "@/lib/ui/visuallyHidden";

export function DownloadActions({
  url,
  labels,
}: {
  url: string;
  labels: { downloadFile: string; copyLink: string; linkCopied: string; openLinkError: string };
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  if (!url || url === "-") return <Typography component="span">-</Typography>;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Tooltip title={labels.downloadFile}>
        <IconButton
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          size="small"
          aria-label={labels.downloadFile}
        >
          <MdFileDownload size={22} aria-hidden />
        </IconButton>
      </Tooltip>
      <Tooltip title={copied ? labels.linkCopied : labels.copyLink}>
        <IconButton
          type="button"
          onClick={copy}
          color="primary"
          size="small"
          aria-label={labels.copyLink}
        >
          {copied ? <MdCheck size={22} aria-hidden /> : <MdContentCopy size={20} aria-hidden />}
        </IconButton>
      </Tooltip>
      <Box component="span" role="status" sx={visuallyHiddenSx}>
        {copied ? labels.linkCopied : ""}
      </Box>
    </Stack>
  );
}
