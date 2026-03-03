/**
 * LLM Advisor — Optional advisory analysis via Claude Haiku API.
 *
 * When config.llm.enabled is true, this module sends code content to Claude
 * Haiku for deeper security and quality analysis. Findings are advisory only
 * (never block operations) and are logged to the audit trail.
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY environment variable
 *   - config.llm.enabled === true
 *
 * Design:
 *   - Uses Node.js built-in https module (zero npm dependencies)
 *   - Hard timeout (default 5s) — fail-open on timeout or error
 *   - Advisory mode only — findings are informational, never blocking
 *
 * Zero dependencies — Node.js built-ins only.
 */

import { request } from 'node:https';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_TIMEOUT_MS = 5000;
const API_URL = 'api.anthropic.com';
const API_PATH = '/v1/messages';
const API_VERSION = '2023-06-01';

const ADVISORY_PROMPT = `You are a code security and quality reviewer. Analyze the following code for:
1. Security vulnerabilities (injection, auth issues, data exposure)
2. Logic errors or potential bugs
3. Performance concerns
4. Missing error handling

Return a JSON array of findings. Each finding should have:
- "severity": "high" | "medium" | "low"
- "category": "security" | "quality" | "performance" | "error-handling"
- "description": brief description of the issue
- "line_hint": approximate location if identifiable

If no issues found, return an empty array: []
Return ONLY the JSON array, no other text.`;

/**
 * Run LLM advisory analysis on code content.
 *
 * @param {string} content - The code content to analyze
 * @param {object} config - Plugin configuration
 * @param {object} metadata - Context (file path, tool name, etc.)
 * @returns {Promise<Array>} Advisory findings array (empty on failure)
 */
export async function runAdvisory(content, config = {}, metadata = {}) {
  const llmConfig = config.llm || {};

  // Guard: only run if explicitly enabled
  if (!llmConfig.enabled) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    process.stderr.write('[quadruple-verify] LLM advisory skipped: ANTHROPIC_API_KEY not set\n');
    return [];
  }

  // Skip very short content (not worth analyzing)
  if (!content || content.length < 50) return [];

  const model = llmConfig.model || DEFAULT_MODEL;
  const timeoutMs = llmConfig.maxLatencyMs || DEFAULT_TIMEOUT_MS;

  // Truncate content to avoid excessive API costs
  const truncated = content.length > 4000 ? content.slice(0, 4000) + '\n... (truncated)' : content;

  const contextPrefix = metadata.filePath
    ? `File: ${metadata.filePath}\n\n`
    : '';

  try {
    const response = await callClaudeAPI({
      apiKey,
      model,
      timeoutMs,
      systemPrompt: ADVISORY_PROMPT,
      userMessage: `${contextPrefix}${truncated}`
    });

    // Parse the response as JSON array
    const findings = parseFindings(response);
    return findings;
  } catch (err) {
    // Fail open — advisory failures are silent
    process.stderr.write(`[quadruple-verify] LLM advisory error: ${err.message}\n`);
    return [];
  }
}

/**
 * Call the Claude API using Node.js built-in https module.
 * @returns {Promise<string>} The text response from Claude
 */
function callClaudeAPI({ apiKey, model, timeoutMs, systemPrompt, userMessage }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    const options = {
      hostname: API_URL,
      port: 443,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: timeoutMs
    };

    const req = request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.content && parsed.content[0] && parsed.content[0].text) {
            resolve(parsed.content[0].text);
          } else if (parsed.error) {
            reject(new Error(`API error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
          } else {
            reject(new Error('Unexpected API response format'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`LLM advisory timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(new Error(`LLM advisory request failed: ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Parse Claude's response into a findings array.
 * Handles various response formats gracefully.
 */
function parseFindings(response) {
  if (!response || typeof response !== 'string') return [];

  try {
    // Try to extract JSON array from the response
    const trimmed = response.trim();

    // Direct JSON array
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }

    // JSON in code block
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // Fallback: try to find array in the text
    const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    return [];
  } catch {
    return [];
  }
}

// Export internals for testing
export { callClaudeAPI, parseFindings, ADVISORY_PROMPT };
