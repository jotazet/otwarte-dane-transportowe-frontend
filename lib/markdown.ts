import removeMd from "remove-markdown";

export const BLOG_EXCERPT_LENGTH = 400;

/** Plain text from Markdown (no syntax markers). */
export function stripMarkdown(value: string): string {
  const plain = removeMd(value, {
    stripListLeaders: true,
    listUnicodeChar: "",
    gfm: true,
  });
  return plain.replace(/\s+/g, " ").trim();
}

export function blogExcerpt(content: string, maxLength = BLOG_EXCERPT_LENGTH): string {
  const plain = stripMarkdown(content);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trim()}…`;
}
