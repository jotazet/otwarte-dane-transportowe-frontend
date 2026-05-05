import {
  FaRegFaceAngry,
  FaRegFaceGrinSquint,
  FaRegFaceSadTear,
  FaRegFaceSurprise,
} from "react-icons/fa6";
import { MdFavorite, MdThumbDown, MdThumbUp } from "react-icons/md";

export const reactionMdIcons = {
  like: MdThumbUp,
  dislike: MdThumbDown,
  love: MdFavorite,
  haha: FaRegFaceGrinSquint,
  wow: FaRegFaceSurprise,
  sad: FaRegFaceSadTear,
  angry: FaRegFaceAngry,
} as const;

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
