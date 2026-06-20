/** Maks. wysokość listy opcji - mieści się na ekranie i przewija się wewnątrz menu. */
export const SELECT_MENU_MAX_HEIGHT = "min(280px, 40vh)";

export const selectMenuPaperSx = {
  maxHeight: SELECT_MENU_MAX_HEIGHT,
  overflow: "auto",
} as const;
