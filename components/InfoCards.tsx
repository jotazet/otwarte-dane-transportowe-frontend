"use client";

import Grid from "@mui/material/Grid";
import {
  MdGavel,
  MdHandshake,
  MdIntegrationInstructions,
  MdLink,
  MdPerson,
  MdPublic,
} from "react-icons/md";

import { SectionCard } from "@/components/SectionCard";
import type { Dictionary } from "@/i18n/getDictionary";

export function InfoCards({ dict }: { dict: Dictionary }) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdPublic size={32} aria-hidden />}
          title={dict.openDataTitle}
          description={dict.openDataDesc}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdIntegrationInstructions size={32} aria-hidden />}
          title={dict.standardsTitle}
          description={dict.standardsDesc}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdHandshake size={32} aria-hidden />}
          title={dict.collaborationTitle}
          description={dict.collaborationDesc}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdGavel size={32} aria-hidden />}
          title={dict.legalBasisTitle}
          description={dict.legalBasisDesc}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdLink size={32} aria-hidden />}
          title={dict.supportTitle}
          description={dict.supportDesc}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SectionCard
          icon={<MdPerson size={32} aria-hidden />}
          title={dict.aboutMeTitle}
          description={dict.aboutMeDesc}
        />
      </Grid>
    </Grid>
  );
}
