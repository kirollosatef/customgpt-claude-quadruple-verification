/**
 * Truncate a string to `maxLength` characters and append a suffix.
 * If the string is already within the limit, return it as-is.
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * Convert a human-readable title into a URL-safe slug.
 * Strips special characters, collapses whitespace/dashes, lowercases.
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Convert a camelCase or PascalCase identifier to kebab-case.
 * Handles consecutive uppercase letters (acronyms) correctly.
 */
export function camelToKebab(str: string): string {
  return (
    str
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase()
  );
}

/**
 * Parse a URL query string into a key-value object.
 * Handles URI-encoded values and keys with no value.
 */
export function parseQueryString(qs: string): Record<string, string> {
  if (!qs) return {};

  const result: Record<string, string> = {};
  const cleaned = qs.startsWith("?") ? qs.slice(1) : qs;
  const pairs = cleaned.split("&");

  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    const value = rest.join("=");
    result[key] = value ? decodeURIComponent(value) : "";
  }

  return result;
}

/**
 * Wrap text at word boundaries so no line exceeds `width` characters.
 * Preserves existing newlines. Does not break individual words that exceed `width`.
 */
export function wordWrap(text: string, width: number): string {
  const paragraphs = text.split("\n");

  return paragraphs
    .map((para) => {
      const words = para.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if (currentLine.length === 0) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= width) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.join("\n");
    })
    .join("\n");
}
