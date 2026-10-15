/**
 * Polish typesetting: a one-letter word (a, i, o, u, w, z) must not end a line, so the space
 * after it becomes a no-break space and the word moves to the next line with what follows.
 */
const SINGLE_LETTER_WORD = /(?<=^|[\s(„"])([aiouwzAIOUWZ]) /g;

export function bindSingleLetterWords(text: string): string {
  return text.replace(SINGLE_LETTER_WORD, "$1 ");
}

/** The same for every string of a dictionary, nested maps included. */
export function bindSingleLetterWordsDeep<T>(value: T): T {
  if (typeof value === "string") return bindSingleLetterWords(value) as T;
  if (Array.isArray(value)) return value.map(bindSingleLetterWordsDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, bindSingleLetterWordsDeep(item)]),
    ) as T;
  }
  return value;
}
