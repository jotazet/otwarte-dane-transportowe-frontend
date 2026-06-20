import { notFound } from "next/navigation";
import { MdDataset } from "react-icons/md";

import { FeedSubmissionDetail } from "@/components/FeedSubmissionDetail";
import { AppPage } from "@/components/layout/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { RealtimeSubmissionDetail } from "@/components/RealtimeSubmissionDetail";
import { resolvePageLocale } from "@/lib/i18n/resolvePageLocale";
import { dataSubmissionDetail } from "@/lib/nav/breadcrumbTrails";
import { parseSubmissionRouteParams } from "@/lib/nav/submissionRoutes";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; context: string; kind: string; id: string }>;
}) {
  const { locale, dict } = await resolvePageLocale(params);
  const { context, kind, id } = await params;
  const parsed = parseSubmissionRouteParams(context, kind, id);
  if (!parsed) notFound();

  const { listContext, kind: submissionKind, submissionId } = parsed;
  const titlePrefix = submissionKind === "feed" ? dict.feedSubmissions : dict.realtimeSubmissions;

  return (
    <AppPage
      locale={locale}
      backLabel={dict.back}
      breadcrumbs={dataSubmissionDetail(locale, dict, listContext, submissionId)}
    >
      <PageHeader
        title={`${titlePrefix} #${submissionId}`}
        subtitle={dict.dataSubtitle}
        icon={<MdDataset size={28} aria-hidden />}
      />
      {submissionKind === "feed" ? (
        <FeedSubmissionDetail
          locale={locale}
          dict={dict}
          submissionId={submissionId}
          listContext={listContext}
        />
      ) : (
        <RealtimeSubmissionDetail
          locale={locale}
          dict={dict}
          submissionId={submissionId}
          listContext={listContext}
        />
      )}
    </AppPage>
  );
}
