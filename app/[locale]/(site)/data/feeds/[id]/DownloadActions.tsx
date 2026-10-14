"use client";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { MdCheck, MdContentCopy, MdFileDownload } from "react-icons/md";

import { useCopyToClipboard } from "@/lib/ui/useCopyToClipboard";

export function DownloadActions({
  url,
  labels,
}: {
  url: string;
  labels: { downloadFile: string; copyLink: string; openLinkError: string };
}) {
  const { copied, copy } = useCopyToClipboard();

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
          <MdFileDownload size={22} />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.copyLink}>
        <IconButton
          type="button"
          onClick={() => void copy(url)}
          color="primary"
          size="small"
          aria-label={labels.copyLink}
        >
          {copied ? <MdCheck size={22} /> : <MdContentCopy size={20} />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
