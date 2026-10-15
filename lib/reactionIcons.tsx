import {
  FaRegFaceAngry,
  FaRegFaceGrinSquint,
  FaRegFaceSadTear,
  FaRegFaceSurprise,
} from "react-icons/fa6";
import { MdFavorite, MdThumbDown, MdThumbUp } from "react-icons/md";

import type { Dictionary } from "@/i18n/getDictionary";

export const reactionMdIcons = {
  like: MdThumbUp,
  dislike: MdThumbDown,
  love: MdFavorite,
  haha: FaRegFaceGrinSquint,
  wow: FaRegFaceSurprise,
  sad: FaRegFaceSadTear,
  angry: FaRegFaceAngry,
} as const;

/** Accessible name of a reaction with its count, e.g. "Heart, number of reactions: 3". */
export function reactionCountLabel(
  dict: Pick<Dictionary, "blogReactionLabels" | "blogReactionCountLabel">,
  reaction: BlogReactionKey,
  count: number,
) {
  return dict.blogReactionCountLabel
    .replace("{reaction}", dict.blogReactionLabels[reaction])
    .replace("{count}", String(count));
}

/** Kolejność jak w API / panelu reakcji na stronie wpisu. */
export const blogReactionOrder = [
  "like",
  "dislike",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
] as const;

export type BlogReactionKey = (typeof blogReactionOrder)[number];
