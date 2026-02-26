/**
 * Self-Correction Loop — Track repeated violations and provide fix hints.
 *
 * When the same file is blocked multiple times, this module:
 *   1. Generates structured correction hints from violations
 *   2. Tracks correction attempts per file
 *   3. Escalates with all prior violations after 3+ attempts
 */

/**
 * Session-level correction state.
 */
let correctionState = {};

/**
 * Build a structured correction hint from violations.
 * @param {Array<{ruleId: string, message: string, remediation?: string}>} violations
 * @returns {string} Formatted hint text
 */
export function buildCorrectionHint(violations) {
  if (!violations || violations.length === 0) return "";
  
  const hints = violations.map((v, i) => {
    const fix = v.remediation || "Review and fix the flagged code";
    return `${i + 1}. [${v.ruleId}] ${fix}`;
  });
  
  return "Correction hints:\n" + hints.join("\n");
}

/**
 * Track a correction attempt for a file.
 * @param {string} filePath - The file being corrected
 * @param {Array<{ruleId: string, message: string}>} violations
 * @returns {{ attempts: number, isEscalated: boolean }}
 */
export function trackCorrectionAttempt(filePath, violations) {
  const key = filePath || "__unknown__";
  
  if (!correctionState[key]) {
    correctionState[key] = {
      attempts: 0,
      history: []
    };
  }
  
  correctionState[key].attempts += 1;
  correctionState[key].history.push({
    timestamp: Date.now(),
    violations: violations.map(v => ({ ruleId: v.ruleId, message: v.message }))
  });
  
  // Keep only last 10 attempts to prevent unbounded growth
  if (correctionState[key].history.length > 10) {
    correctionState[key].history = correctionState[key].history.slice(-10);
  }
  
  return {
    attempts: correctionState[key].attempts,
    isEscalated: correctionState[key].attempts >= 3
  };
}

/**
 * Build an escalated message with all prior violations for a file.
 * Called when 3+ correction attempts have been made.
 * @param {string} filePath
 * @returns {string} Escalated correction message
 */
export function escalateIfNeeded(filePath) {
  const key = filePath || "__unknown__";
  const state = correctionState[key];
  
  if (!state || state.attempts < 3) return "";
  
  const allRuleIds = new Set();
  for (const attempt of state.history) {
    for (const v of attempt.violations) {
      allRuleIds.add(v.ruleId);
    }
  }
  
  return [
    `ESCALATION: File "${key}" has been blocked ${state.attempts} times.`,
    `Recurring violations: ${[...allRuleIds].join(", ")}`,
    `Please carefully address ALL of the above rules before retrying.`,
    `Consider a different approach if the same violations keep occurring.`
  ].join("\n");
}

/**
 * Get current correction state (for testing/debugging).
 * @returns {object}
 */
export function getCorrectionState() {
  return { ...correctionState };
}

/**
 * Reset correction state (for testing or session reset).
 */
export function resetCorrectionState() {
  correctionState = {};
}
