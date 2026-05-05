import { getJson, postJson } from "@/lib/api/http";

export type BlogPostListItem = {
  id: number;
  title: string;
  content: string;
  /** `null` albo string: zwykle pełny `http(s)://…/internal-media/blog/images/...` (zob. `lib/blogImage.ts`). */
  image?: string | null;
  author_username?: string | null;
  updated_at?: string | null;
  date?: string | null;
  tags?: string[];
  reactions_summary?: Record<string, number>;
};

export type BlogPost = BlogPostListItem & {
  your_reaction?: string | null;
};

type ListResponse = unknown[] | { results?: unknown[] };

function normalizeList(value: ListResponse): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as any).results)) {
    return (value as any).results;
  }
  return [];
}

export async function fetchBlogPosts(): Promise<BlogPostListItem[]> {
  const json = await getJson<ListResponse>("/api/blog/posts/");
  return normalizeList(json) as BlogPostListItem[];
}

export async function fetchBlogPost(id: number): Promise<BlogPost> {
  return await getJson<BlogPost>(`/api/blog/posts/${id}/`);
}

export async function reactToPost(postId: number, reaction: string | null) {
  await postJson<void>(`/api/blog/reactions/${postId}/`, { reaction });
}

