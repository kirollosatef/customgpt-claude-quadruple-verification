/**
 * Content Boundary — External content wrapping and injection detection.
 *
 * Wraps untrusted content from WebFetch/WebSearch/MCP in boundary markers,
 * detects prompt injection patterns, normalizes homoglyphs, and sanitizes
 * existing markers. Non-blocking — returns warnings for audit trail.
 *
 * Zero dependencies — Node.js built-ins only.
 */

// ─── Boundary Markers ──────────────────────────────────────────────────────

const BOUNDARY_START = '<!-- EXTERNAL_CONTENT_START -->';
const BOUNDARY_END = '<!-- EXTERNAL_CONTENT_END -->';

/**
 * Wrap external content in boundary markers for context isolation.
 * @param {string} content - The untrusted content to wrap
 * @returns {string} Content wrapped in boundary markers
 */
export function wrapExternalContent(content) {
  if (!content || typeof content !== 'string') return '';
  const sanitized = sanitizeMarkers(content);
  return `${BOUNDARY_START}\n${sanitized}\n${BOUNDARY_END}`;
}

// ─── Injection Pattern Detection ────────────────────────────────────────────

const INJECTION_PATTERNS = [
  { id: 'ignore-previous', pattern: /ignore\s+(?:all\s+)?previous\s+instructions/i, description: 'Attempts to override prior instructions' },
  { id: 'disregard-above', pattern: /disregard\s+(?:all\s+)?(?:above|previous|prior)/i, description: 'Attempts to disregard context' },
  { id: 'system-override', pattern: /system\s+(?:override|prompt|message)\s*:/i, description: 'Attempts to inject system-level directives' },
  { id: 'you-are-now', pattern: /you\s+are\s+now\s+(?:a|an|the)\b/i, description: 'Attempts to reassign agent identity' },
  { id: 'forget-everything', pattern: /forget\s+(?:all|everything)\s+(?:you|above|previous)/i, description: 'Attempts to wipe agent context' },
  { id: 'new-instructions', pattern: /(?:new|updated|revised)\s+instructions\s*:/i, description: 'Attempts to inject replacement instructions' },
  { id: 'act-as', pattern: /(?:act|behave|respond)\s+as\s+(?:if\s+)?(?:you\s+(?:are|were)|a|an)/i, description: 'Attempts to change agent behavior' },
  { id: 'pretend-you-are', pattern: /pretend\s+(?:that\s+)?you\s+are/i, description: 'Attempts to override agent persona' },
  { id: 'override-safety', pattern: /(?:override|disable|bypass|turn\s+off)\s+(?:safety|security|guard|filter|restriction)/i, description: 'Attempts to disable safety measures' },
  { id: 'ignore-all-rules', pattern: /ignore\s+(?:all\s+)?(?:rules|guidelines|policies|constraints)/i, description: 'Attempts to bypass policy constraints' },
  { id: 'bypass-restrictions', pattern: /bypass\s+(?:all\s+)?(?:restriction|limitation|filter|check)/i, description: 'Attempts to bypass operational restrictions' },
  { id: 'jailbreak-attempt', pattern: /(?:DAN|do\s+anything\s+now|developer\s+mode|god\s+mode)\b/i, description: 'Known jailbreak technique keywords' },
  { id: 'hidden-instruction', pattern: /\[(?:INST|SYS|SYSTEM)\]/i, description: 'Attempts to inject instruction delimiters' },
];

/**
 * Detect prompt injection patterns in content.
 * @param {string} content - Content to scan
 * @returns {Array<{id: string, description: string, match: string}>} Detected patterns
 */
export function detectInjectionPatterns(content) {
  if (!content || typeof content !== 'string') return [];

  // Fold homoglyphs before scanning to catch evasion attempts
  const normalized = foldHomoglyphs(content);
  const detections = [];

  for (const { id, pattern, description } of INJECTION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      detections.push({ id, description, match: match[0] });
    }
  }

  return detections;
}

// ─── Homoglyph Folding ─────────────────────────────────────────────────────

/**
 * Normalize homoglyphs to their ASCII equivalents.
 * Converts fullwidth ASCII (U+FF01-FF5E) and common lookalike characters
 * to standard ASCII to prevent evasion via visual spoofing.
 * @param {string} content - Content to normalize
 * @returns {string} Normalized content
 */
export function foldHomoglyphs(content) {
  if (!content || typeof content !== 'string') return '';

  let result = '';
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);

    // Fullwidth ASCII variants: U+FF01 (!) to U+FF5E (~) → U+0021 to U+007E
    if (code >= 0xFF01 && code <= 0xFF5E) {
      result += String.fromCharCode(code - 0xFF01 + 0x0021);
      continue;
    }

    // Fullwidth space U+3000 → regular space
    if (code === 0x3000) {
      result += ' ';
      continue;
    }

    // Common Cyrillic/Greek lookalikes → Latin
    const LOOKALIKE_MAP = {
      0x0410: 'A', 0x0430: 'a', // Cyrillic А/а
      0x0412: 'B', 0x0432: 'b', // Cyrillic В/в (visually similar to B)
      0x0421: 'C', 0x0441: 'c', // Cyrillic С/с
      0x0415: 'E', 0x0435: 'e', // Cyrillic Е/е
      0x041D: 'H', 0x043D: 'h', // Cyrillic Н/н
      0x041A: 'K', 0x043A: 'k', // Cyrillic К/к
      0x041C: 'M', 0x043C: 'm', // Cyrillic М/м
      0x041E: 'O', 0x043E: 'o', // Cyrillic О/о
      0x0420: 'P', 0x0440: 'p', // Cyrillic Р/р
      0x0422: 'T', 0x0442: 't', // Cyrillic Т/т
      0x0425: 'X', 0x0445: 'x', // Cyrillic Х/х
      0x0392: 'B',              // Greek Beta
      0x0395: 'E',              // Greek Epsilon
      0x0397: 'H',              // Greek Eta
      0x039A: 'K',              // Greek Kappa
      0x039C: 'M',              // Greek Mu
      0x039D: 'N',              // Greek Nu
      0x039F: 'O',              // Greek Omicron
      0x03A1: 'P',              // Greek Rho
      0x03A4: 'T',              // Greek Tau
      0x03A7: 'X',              // Greek Chi
    };

    if (LOOKALIKE_MAP[code]) {
      result += LOOKALIKE_MAP[code];
      continue;
    }

    result += content[i];
  }

  return result;
}

// ─── Marker Sanitization ────────────────────────────────────────────────────

/**
 * Sanitize content by escaping any existing boundary markers.
 * Prevents marker injection attacks where external content contains
 * fake boundary markers to break out of the sandbox.
 * @param {string} content - Content to sanitize
 * @returns {string} Content with markers escaped
 */
export function sanitizeMarkers(content) {
  if (!content || typeof content !== 'string') return '';
  return content
    .replace(/<!-- EXTERNAL_CONTENT_START -->/g, '<!-- EXTERNAL_CONTENT_START [escaped] -->')
    .replace(/<!-- EXTERNAL_CONTENT_END -->/g, '<!-- EXTERNAL_CONTENT_END [escaped] -->');
}
