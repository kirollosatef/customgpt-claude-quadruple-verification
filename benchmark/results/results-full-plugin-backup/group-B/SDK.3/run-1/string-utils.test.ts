import {
  truncate,
  slugify,
  camelToKebab,
  parseQueryString,
  wordWrap,
} from "./string-utils";

// ── Test 1: truncate ─────────────────────────────────────────────────────────

describe("truncate", () => {
  it("truncates long strings and appends ellipsis", () => {
    expect(truncate("Hello, World!", 5)).toBe("Hello...");
  });

  it("returns the original string if within maxLength", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

// ── Test 2: slugify ──────────────────────────────────────────────────────────

describe("slugify", () => {
  it("converts a title to a URL-safe slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters but keeps digits", () => {
    expect(slugify("Price: $100 & Up!")).toBe("price-100-up");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("foo   ---  bar")).toBe("foo-bar");
  });
});

// ── Test 3: camelToKebab ─────────────────────────────────────────────────────

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("backgroundColor")).toBe("background-color");
  });

  it("handles consecutive uppercase letters (acronyms)", () => {
    expect(camelToKebab("getHTTPResponse")).toBe("get-http-response");
  });

  it("returns lowercase single words unchanged", () => {
    expect(camelToKebab("color")).toBe("color");
  });
});

// ── Test 4: parseQueryString ─────────────────────────────────────────────────

describe("parseQueryString", () => {
  it("parses a query string with leading ?", () => {
    expect(parseQueryString("?foo=bar&baz=qux")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("decodes URI-encoded values", () => {
    expect(parseQueryString("name=John%20Doe&city=New%20York")).toEqual({
      name: "John Doe",
      city: "New York",
    });
  });

  it("handles empty string", () => {
    expect(parseQueryString("")).toEqual({});
  });
});

// ── Test 5: wordWrap ─────────────────────────────────────────────────────────

describe("wordWrap", () => {
  it("wraps text at the specified width", () => {
    const input = "The quick brown fox jumps over the lazy dog";
    const expected = "The quick\nbrown fox\njumps over\nthe lazy\ndog";
    expect(wordWrap(input, 10)).toBe(expected);
  });

  it("preserves existing newlines", () => {
    const input = "line one\nline two";
    expect(wordWrap(input, 80)).toBe("line one\nline two");
  });

  it("handles single long word exceeding width", () => {
    expect(wordWrap("supercalifragilistic", 10)).toBe("supercalifragilistic");
  });
});
