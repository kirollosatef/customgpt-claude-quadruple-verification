/**
 * Inference-Based Verification (Cycle 5) — Second-opinion AI review.
 *
 * Calls a lightweight model to verify response quality.
 * Opt-in, disabled by default. Requires API key to function.
 * Fail-open: if API call fails, approve with warning.
 */

/**
 * Verify a response using a second AI model (Cycle 5).
 * @param {string} response - The AI response to verify
 * @param {string} originalRequest - The original user request
 * @param {object} config - Plugin configuration
 * @returns {Promise<{pass: boolean, reasoning: string, model: string, skipped?: boolean}>}
 */
export async function verifyCycle5(response, originalRequest, config) {
  const cycle5Config = (config && config.cycle5) || {};
  
  // Check if enabled
  if (cycle5Config.enabled !== true) {
    return { pass: true, reasoning: 'Cycle 5 disabled', model: 'none', skipped: true };
  }
  
  // Check minimum response length threshold
  const minTokens = cycle5Config.minResponseTokens || 500;
  const estimatedTokens = Math.ceil(response.length / 4);
  if (estimatedTokens < minTokens) {
    return {
      pass: true,
      reasoning: `Response too short for Cycle 5 (${estimatedTokens} < ${minTokens} tokens)`,
      model: 'none',
      skipped: true
    };
  }
  
  // Get API key from config or environment
  const apiKey = cycle5Config.apiKey || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) {
    return {
      pass: true,
      reasoning: 'No API key configured for Cycle 5',
      model: 'none',
      skipped: true
    };
  }
  
  const model = cycle5Config.model || 'claude-haiku-4-5-20251001';
  
  try {
    const result = await callVerificationModel(response, originalRequest, model, apiKey);
    return result;
  } catch (err) {
    // Fail-open: approve with warning
    process.stderr.write(`[quadruple-verify][cycle5] WARNING: Inference verification failed: ${err.message}\n`);
    return {
      pass: true,
      reasoning: `Cycle 5 API call failed (fail-open): ${err.message}`,
      model,
      skipped: false
    };
  }
}

/**
 * Call the verification model API.
 * @param {string} response
 * @param {string} request
 * @param {string} model
 * @param {string} apiKey
 * @returns {Promise<{pass: boolean, reasoning: string, model: string}>}
 */
async function callVerificationModel(response, request, model, apiKey) {
  const prompt = `You are a verification assistant. Review the following AI response for quality, correctness, and completeness.

Original request: ${request.slice(0, 500)}

Response to verify (first 2000 chars): ${response.slice(0, 2000)}

Evaluate:
1. Does the response address the request?
2. Is the response factually reasonable?
3. Are there obvious errors or hallucinations?

Respond with JSON: {"pass": true/false, "reasoning": "brief explanation"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(10000)
  });
  
  if (!res.ok) {
    throw new Error(`API returned ${res.status}: ${res.statusText}`);
  }
  
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  
  // Try to parse JSON from the response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        pass: parsed.pass !== false,
        reasoning: parsed.reasoning || 'No reasoning provided',
        model
      };
    }
  } catch {
    // JSON parse failed, fall through
  }
  
  return {
    pass: true,
    reasoning: `Could not parse verification response: ${text.slice(0, 100)}`,
    model
  };
}
