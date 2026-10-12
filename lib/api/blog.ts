import { getJson, postJson } from "@/lib/api/http";
import { fetchAllPages, normalizeList, type ApiListResponse } from "@/lib/api/types";

export type BlogPostListItem = {
  id: number;
  title: string;
  content: string;
  /** `null` albo string: zwykle pełny `http(s)://…/internal-media/blog/images/...` (zob. `lib/blogImage.ts`). */
  image?: string | null;
  author_username?: string | null;
  author_id?: number;
  updated_at?: string | null;
  date?: string | null;
  tags?: string[];
  reactions_summary?: Record<string, number>;
};

export type BlogPost = BlogPostListItem & {
  your_reaction?: string | null;
  author_id?: number;
};

export const BLOG_LIST_PAGE_SIZE = 12;

export function blogListTotalPages(
  count: number | null,
  page: number,
  hasNext: boolean,
  pageSize = BLOG_LIST_PAGE_SIZE,
): number {
  if (count != null) return Math.max(1, Math.ceil(count / pageSize));
  return Math.max(page, hasNext ? page + 1 : page);
}

export type BlogPostsPage = {
  posts: BlogPostListItem[];
  count: number | null;
  next: string | null;
  previous: string | null;
};

export async function fetchBlogPosts(options?: {
  page?: number;
  pageSize?: number;
}): Promise<BlogPostsPage> {
  const q = new URLSearchParams();
  if (options?.page) q.set("page", String(options.page));
  if (options?.pageSize) q.set("page_size", String(options.pageSize));
  const suffix = q.toString() ? `?${q}` : "";
  const json = await getJson<ApiListResponse<BlogPostListItem>>(`/api/blog/posts/${suffix}`);
  const posts = normalizeList(json) as BlogPostListItem[];
  const meta = Array.isArray(json) ? null : json;
  return {
    posts,
    count: meta && typeof meta === "object" && "count" in meta ? (meta.count as number) : null,
    next: meta && typeof meta === "object" && "next" in meta ? (meta.next as string | null) : null,
    previous:
      meta && typeof meta === "object" && "previous" in meta
        ? (meta.previous as string | null)
        : null,
  };
}

/**
 * Wszystkie posty, bez paginacji — używane przez sitemapę.
 * `revalidate` przekazujemy dalej, żeby trasa sitemapy nie stawała się dynamiczna
 * przez domyślne `cache: "no-store"` w `getJson`.
 */
export async function fetchAllBlogPosts(opts?: {
  revalidate?: number;
}): Promise<BlogPostListItem[]> {
  return await fetchAllPages<BlogPostListItem>((p) => getJson(p, opts), "/api/blog/posts/");
}

export async function fetchBlogPost(id: number): Promise<BlogPost> {
  return await getJson<BlogPost>(`/api/blog/posts/${id}/`);
}

export async function reactToPost(postId: number, reaction: string | null) {
  await postJson<void>(`/api/blog/reactions/${postId}/`, { reaction });
}

/**
 * Reakcje bieżącego odwiedzającego dla podanych postów.
 *
 * MUSI być wywoływane z przeglądarki. Backend rozpoznaje odwiedzającego po
 * jego adresie IP, więc wywołanie server-side (SSR) opisywałoby serwer
 * frontendu — identycznie dla wszystkich. Z tego samego powodu nie wolno
 * używać pola `your_reaction` z odpowiedzi pobranej w komponencie serwerowym.
 *
 * Zwraca mapę `{ "<postId>": "<reaction>" }`; brak klucza = brak reakcji.
 */
export async function fetchMyReactions(postIds: number[]): Promise<Record<string, string>> {
  if (!postIds.length) return {};
  const q = new URLSearchParams({ post_ids: postIds.join(",") });
  return await getJson<Record<string, string>>(`/api/blog/reactions/mine/?${q}`);
}
