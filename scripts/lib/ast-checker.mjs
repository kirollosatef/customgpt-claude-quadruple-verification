/**
 * AST Checker — Context-aware rule checking that skips matches
 * inside comments and string literals to reduce false positives.
 *
 * Uses regex-based stripping (no external dependencies required).
 * Optional acorn integration for more accurate JS/TS parsing.
 */

// ─── Language Detection ─────────────────────────────────────────────────────

const JS_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);
const PY_EXTENSIONS = new Set(['.py', '.pyi']);

/**
 * Determine the language family from file extension.
 * @param {string} fileExt
 * @returns {'js' | 'python' | 'unknown'}
 */
export function detectLanguage(fileExt) {
  if (JS_EXTENSIONS.has(fileExt)) return 'js';
  if (PY_EXTENSIONS.has(fileExt)) return 'python';
  return 'unknown';
}

// ─── Comment and String Stripping ───────────────────────────────────────────

/**
 * Strip comments and string literals from JavaScript/TypeScript code.
 * Replaces them with whitespace of equal length to preserve positions.
 * @param {string} content
 * @returns {string}
 */
export function stripJsCommentsAndStrings(content) {
  // Order matters: template literals, multi-line comments, single-line comments, strings
  return content.replace(
    /`(?:[^`\\]|\\.)*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    match => ' '.repeat(match.length)
  );
}

/**
 * Strip comments and string literals from Python code.
 * Replaces them with whitespace of equal length to preserve positions.
 * @param {string} content
 * @returns {string}
 */
export function stripPyCommentsAndStrings(content) {
  // Triple-quoted strings first, then single-quoted, then comments
  return content.replace(
    /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[^\n]*/g,
    match => ' '.repeat(match.length)
  );
}

/**
 * Strip comments and strings from content based on language.
 * @param {string} content
 * @param {string} fileExt
 * @returns {string} Content with comments/strings replaced by spaces
 */
export function stripCommentsAndStrings(content, fileExt) {
  const lang = detectLanguage(fileExt);
  if (lang === 'js') return stripJsCommentsAndStrings(content);
  if (lang === 'python') return stripPyCommentsAndStrings(content);
  return content; // Unknown language — return as-is
}

/**
 * Check if a match at a given index is inside a comment or string.
 * @param {string} content - Original content
 * @param {number} matchIndex - Character index of the match
 * @param {string} fileExt - File extension
 * @returns {boolean} True if the match is inside a comment or string
 */
export function isInCommentOrString(content, matchIndex, fileExt) {
  const stripped = stripCommentsAndStrings(content, fileExt);
  // If the position is whitespace in stripped content, it was in a comment/string
  return stripped[matchIndex] === ' ' && content[matchIndex] !== ' ';
}
