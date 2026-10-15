import type { BreadcrumbItem } from "@/components/layout/AppBreadcrumbs";
import type { Dictionary } from "@/i18n/getDictionary";
import { paths, type SubmissionListContext } from "@/lib/nav/routes";

export function resolveBackHref(items: BreadcrumbItem[], fallbackHref: string): string {
  for (let i = items.length - 2; i >= 0; i--) {
    if (items[i].href) return items[i].href!;
  }
  return fallbackHref;
}

export function dataCatalog(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.data }];
}

export function dataFeedDetail(
  locale: string,
  dict: Dictionary,
  orgId: number,
  label: string,
): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.data, href: p.data }, { label }];
}

export function dataMySubmissionsList(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.data, href: p.data }, { label: dict.myFeeds }];
}

export function dataMySubmissions(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [
    { label: dict.data, href: p.data },
    { label: dict.myFeeds, href: p.mySubmissions },
  ];
}

export function dataMySubmissionsNew(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [...dataMySubmissions(locale, dict), { label: dict.addNewFeed }];
}

export function dataQueue(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.data, href: p.data }, { label: dict.submissions }];
}

export function dataFeedOps(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.feedOps }];
}

export function dataSubmissionDetail(
  locale: string,
  dict: Dictionary,
  ctx: SubmissionListContext,
  id: number,
): BreadcrumbItem[] {
  const base = ctx === "queue" ? dataQueue(locale, dict) : dataMySubmissions(locale, dict);
  return [...base, { label: `#${id}` }];
}

export function casesRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.cases }];
}

export function casesAddOrganization(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.cases, href: p.cases }, { label: dict.addOrganization }];
}

export function casesOrganization(
  locale: string,
  dict: Dictionary,
  orgId: number,
  label: string,
  options?: { linkOrg?: boolean },
): BreadcrumbItem[] {
  const p = paths(locale);
  return [
    { label: dict.cases, href: p.cases },
    options?.linkOrg === false ? { label } : { label, href: p.casesOrg(orgId) },
  ];
}

export function casesOrganizationEdit(
  locale: string,
  dict: Dictionary,
  orgId: number,
  orgLabel: string,
): BreadcrumbItem[] {
  return [...casesOrganization(locale, dict, orgId, orgLabel), { label: dict.edit }];
}

export function casesStatusNew(
  locale: string,
  dict: Dictionary,
  orgId: number,
  orgLabel: string,
): BreadcrumbItem[] {
  return [...casesOrganization(locale, dict, orgId, orgLabel), { label: dict.addStatus }];
}

export function casesStatusEdit(
  locale: string,
  dict: Dictionary,
  orgId: number,
  orgLabel: string,
): BreadcrumbItem[] {
  return [...casesOrganization(locale, dict, orgId, orgLabel), { label: dict.edit }];
}

export function casesProvidersList(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.cases, href: p.cases }, { label: dict.providers }];
}

export function casesProviders(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [
    { label: dict.cases, href: p.cases },
    { label: dict.providers, href: p.casesProviders },
  ];
}

export function casesProviderNew(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [...casesProviders(locale, dict), { label: dict.createProvider }];
}

export function casesProviderDetail(
  locale: string,
  dict: Dictionary,
  providerId: number,
  label: string,
): BreadcrumbItem[] {
  return [...casesProviders(locale, dict), { label }];
}

export function blogRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.blog }];
}

export function blogNew(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.blog, href: p.blog }, { label: dict.createPost }];
}

export function blogPost(
  locale: string,
  dict: Dictionary,
  postId: number,
  title: string,
): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.blog, href: p.blog }, { label: title }];
}

export function blogEdit(
  locale: string,
  dict: Dictionary,
  postId: number,
  title: string,
): BreadcrumbItem[] {
  const p = paths(locale);
  return [
    { label: dict.blog, href: p.blog },
    { label: title, href: p.blogPost(postId) },
    { label: dict.edit },
  ];
}

export function usersRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.users }];
}

export function userNew(locale: string, dict: Dictionary): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.users, href: p.users }, { label: dict.addUser }];
}

export function userDetail(
  locale: string,
  dict: Dictionary,
  userId: number,
  label: string,
): BreadcrumbItem[] {
  const p = paths(locale);
  return [{ label: dict.users, href: p.users }, { label }];
}

export function infoRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.info }];
}

export function developersRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.developers }];
}

export function accountRoot(locale: string, dict: Dictionary): BreadcrumbItem[] {
  return [{ label: dict.accountSettings }];
}
