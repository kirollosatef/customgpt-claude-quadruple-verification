const { slugify, truncate, deepMerge, retry } = require("./utils");

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------
describe("slugify", () => {
  // --- normal cases ---
  test("converts a simple phrase to a slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("lowercases all characters", () => {
    expect(slugify("FOO BAR BAZ")).toBe("foo-bar-baz");
  });

  test("trims leading and trailing whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  test("collapses multiple spaces into a single hyphen", () => {
    expect(slugify("a   b")).toBe("a-b");
  });

  test("removes special characters", () => {
    expect(slugify("hello! @world#")).toBe("hello-world");
  });

  test("collapses consecutive hyphens left after removal", () => {
    expect(slugify("foo--bar---baz")).toBe("foo-bar-baz");
  });

  test("handles mixed whitespace (tabs, newlines)", () => {
    expect(slugify("hello\t\nworld")).toBe("hello-world");
  });

  // --- edge cases ---
  test("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  test("returns empty string for whitespace-only input", () => {
    expect(slugify("   ")).toBe("");
  });

  test("returns empty string when all characters are special", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  test("preserves hyphens that are already correct", () => {
    expect(slugify("already-slugged")).toBe("already-slugged");
  });

  test("handles underscores (\\w includes _)", () => {
    expect(slugify("hello_world")).toBe("hello_world");
  });

  test("handles numbers", () => {
    expect(slugify("version 2.0 release")).toBe("version-20-release");
  });

  test("coerces non-string input via toString()", () => {
    expect(slugify(123)).toBe("123");
    expect(slugify(true)).toBe("true");
  });

  test("handles single character input", () => {
    expect(slugify("A")).toBe("a");
  });

  test("handles unicode / accented characters (stripped by regex)", () => {
    // non-word chars get removed; only ASCII word chars survive
    expect(slugify("café résumé")).toBe("caf-rsum");
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe("truncate", () => {
  // --- normal cases ---
  test("truncates a long string and appends default suffix", () => {
    expect(truncate("Hello, World!", 8)).toBe("Hello...");
  });

  test("returns original string when length equals maxLen", () => {
    expect(truncate("abcde", 5)).toBe("abcde");
  });

  test("returns original string when shorter than maxLen", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });

  test("uses custom suffix", () => {
    expect(truncate("abcdefghij", 7, "…")).toBe("abcdef…");
  });

  test("uses empty suffix", () => {
    expect(truncate("abcdefghij", 5, "")).toBe("abcde");
  });

  // --- edge cases ---
  test("returns only suffix when maxLen equals suffix length", () => {
    expect(truncate("Hello, World!", 3)).toBe("...");
  });

  test("handles maxLen of 0 with empty suffix", () => {
    expect(truncate("hello", 0, "")).toBe("");
  });

  test("handles empty input string", () => {
    expect(truncate("", 5)).toBe("");
  });

  test("handles single character string that exceeds maxLen", () => {
    // maxLen=2, suffix="..." → slice(0, 2-3) = slice(0,-1) = ""
    // result is "" + "..." = "..."
    // This is technically longer than maxLen but is the function's behavior
    expect(truncate("x", 0)).toBe("...");
  });

  test("handles maxLen of 1 with default suffix", () => {
    // slice(0, 1-3) = slice(0, -2) → "abcd" + "..." = "abcd..."
    // The function doesn't clamp — negative slice index chops from end of the string
    const result = truncate("abcdef", 1);
    expect(result).toBe("abcd...");
  });

  test("suffix longer than maxLen still appends full suffix", () => {
    const result = truncate("abcdefgh", 2, "---");
    // slice(0, 2-3) = slice(0, -1) = "abcdefg" wait, str is "abcdefgh"
    // Actually slice(0, -1) = "abcdefg" + "---" – but the string IS longer than maxLen=2
    // so it enters the branch. slice(0, 2-3) = slice(0, -1) = "abcdefg"
    expect(result).toBe("abcdefg---");
  });

  test("truncates at exact boundary with multi-char suffix", () => {
    expect(truncate("abcdefghij", 8, "..")).toBe("abcdef..");
  });
});

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------
describe("deepMerge", () => {
  // --- normal cases ---
  test("merges two flat objects", () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  test("source values overwrite target values", () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  test("deeply merges nested objects", () => {
    const target = { a: { x: 1, y: 2 } };
    const source = { a: { y: 3, z: 4 } };
    expect(deepMerge(target, source)).toEqual({ a: { x: 1, y: 3, z: 4 } });
  });

  test("merges multiple levels deep", () => {
    const target = { a: { b: { c: 1, d: 2 } } };
    const source = { a: { b: { d: 3, e: 4 } } };
    expect(deepMerge(target, source)).toEqual({ a: { b: { c: 1, d: 3, e: 4 } } });
  });

  // --- arrays are NOT deep-merged (replaced wholesale) ---
  test("replaces arrays instead of merging them", () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3, 4] })).toEqual({ a: [3, 4] });
  });

  test("replaces array in target with object in source", () => {
    // source[key] is an object → deep merge branch, but target[key] is an array
    // result[key] = deepMerge(result[key]||{}, source[key])
    // arrays spread as objects with numeric keys, then merge
    expect(deepMerge({ a: [1, 2] }, { a: { x: 1 } })).toEqual({ a: { "0": 1, "1": 2, x: 1 } });
  });

  // --- edge cases ---
  test("source with empty object leaves target key intact", () => {
    // deepMerge({x:1}, {}) for the nested call
    expect(deepMerge({ a: { x: 1 } }, { a: {} })).toEqual({ a: { x: 1 } });
  });

  test("merging two empty objects returns empty object", () => {
    expect(deepMerge({}, {})).toEqual({});
  });

  test("merging into empty target copies source", () => {
    expect(deepMerge({}, { a: 1, b: { c: 2 } })).toEqual({ a: 1, b: { c: 2 } });
  });

  test("merging empty source returns copy of target", () => {
    const target = { a: 1 };
    const result = deepMerge(target, {});
    expect(result).toEqual({ a: 1 });
    expect(result).not.toBe(target); // should be a new object
  });

  test("does not mutate the original target", () => {
    const target = { a: { x: 1 } };
    const source = { a: { y: 2 } };
    deepMerge(target, source);
    expect(target).toEqual({ a: { x: 1 } });
  });

  test("does not mutate the original source", () => {
    const source = { a: { x: 1 } };
    deepMerge({}, source);
    expect(source).toEqual({ a: { x: 1 } });
  });

  test("handles null values in source (overwrites)", () => {
    expect(deepMerge({ a: { x: 1 } }, { a: null })).toEqual({ a: null });
  });

  test("handles undefined values in source (overwrites)", () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: undefined });
  });

  test("source nested object where target key is a primitive", () => {
    // target has a:1 (not object), source has a:{x:2}
    // enters deep merge branch → deepMerge({}, {x:2})
    expect(deepMerge({ a: 1 }, { a: { x: 2 } })).toEqual({ a: { x: 2 } });
  });

  test("source primitive where target key is an object", () => {
    expect(deepMerge({ a: { x: 1 } }, { a: 42 })).toEqual({ a: 42 });
  });

  test("handles boolean and number source values", () => {
    expect(deepMerge({ a: true }, { a: false, b: 0 })).toEqual({ a: false, b: 0 });
  });
});

// ---------------------------------------------------------------------------
// retry
// ---------------------------------------------------------------------------
describe("retry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --- normal cases ---
  test("returns a function", () => {
    const wrapped = retry(() => {});
    expect(typeof wrapped).toBe("function");
  });

  test("calls the inner function and returns its result on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const wrapped = retry(fn);
    const result = await wrapped("arg1", "arg2");
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  test("retries on failure and succeeds on second attempt", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");

    const wrapped = retry(fn, 3, 10);
    const promise = wrapped();

    // advance past the delay after first failure
    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("retries up to maxAttempts and then throws", async () => {
    const error = new Error("persistent failure");
    const fn = jest.fn().mockRejectedValue(error);

    const wrapped = retry(fn, 3, 10);
    const promise = wrapped();

    // Attach the catch handler immediately to prevent unhandled rejection
    const catchPromise = promise.catch(() => {});

    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(10);
    await catchPromise;

    await expect(promise).rejects.toThrow("persistent failure");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("succeeds on the last possible attempt", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("1"))
      .mockRejectedValueOnce(new Error("2"))
      .mockResolvedValueOnce("finally");

    const wrapped = retry(fn, 3, 10);
    const promise = wrapped();

    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result).toBe("finally");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // --- arguments forwarding ---
  test("forwards all arguments to the wrapped function on every attempt", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");

    const wrapped = retry(fn, 2, 10);
    const promise = wrapped("a", "b", "c");

    await jest.advanceTimersByTimeAsync(10);
    await promise;

    expect(fn).toHaveBeenNthCalledWith(1, "a", "b", "c");
    expect(fn).toHaveBeenNthCalledWith(2, "a", "b", "c");
  });

  // --- default parameters ---
  test("uses default maxAttempts of 3", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    const wrapped = retry(fn); // default maxAttempts=3, delay=1000

    const promise = wrapped();
    const catchPromise = promise.catch(() => {});

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await catchPromise;

    await expect(promise).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // --- single attempt (maxAttempts = 1) ---
  test("throws immediately with maxAttempts=1 (no retries)", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("once"));
    const wrapped = retry(fn, 1, 10);

    await expect(wrapped()).rejects.toThrow("once");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // --- works with sync functions that throw ---
  test("handles synchronous functions that throw", async () => {
    let calls = 0;
    const fn = jest.fn(() => {
      calls++;
      if (calls < 3) throw new Error("sync fail");
      return "sync ok";
    });

    const wrapped = retry(fn, 3, 10);
    const promise = wrapped();

    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result).toBe("sync ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // --- works with sync functions returning values ---
  test("handles synchronous functions that return a value", async () => {
    const fn = jest.fn().mockReturnValue(42);
    const wrapped = retry(fn, 3, 10);

    const result = await wrapped();
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // --- delay behavior ---
  test("waits the specified delay between retries", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");

    const wrapped = retry(fn, 2, 500);
    const promise = wrapped();

    // not enough time yet
    await jest.advanceTimersByTimeAsync(499);
    expect(fn).toHaveBeenCalledTimes(1);

    // now the delay elapses
    await jest.advanceTimersByTimeAsync(1);

    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // --- preserves the original error ---
  test("throws the last error from the original function", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("error-1"))
      .mockRejectedValueOnce(new Error("error-2"));

    const wrapped = retry(fn, 2, 10);
    const promise = wrapped();
    const catchPromise = promise.catch(() => {});

    await jest.advanceTimersByTimeAsync(10);
    await catchPromise;

    await expect(promise).rejects.toThrow("error-2");
  });

  // --- return value types ---
  test("resolves with undefined when function returns undefined", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = retry(fn);
    const result = await wrapped();
    expect(result).toBeUndefined();
  });

  test("resolves with null when function returns null", async () => {
    const fn = jest.fn().mockResolvedValue(null);
    const wrapped = retry(fn);
    const result = await wrapped();
    expect(result).toBeNull();
  });
});
