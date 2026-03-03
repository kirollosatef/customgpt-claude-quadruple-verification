import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseFindings, ADVISORY_PROMPT, runAdvisory } from '../scripts/lib/llm-advisor.mjs';

// ─── parseFindings ───────────────────────────────────────────────────────────

describe('LLM Advisor — parseFindings()', () => {
  it('parses a valid JSON array', () => {
    const input = '[{"severity":"high","category":"security","description":"SQL injection","line_hint":"15"}]';
    const result = parseFindings(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, 'high');
    assert.equal(result[0].category, 'security');
  });

  it('parses empty array', () => {
    const result = parseFindings('[]');
    assert.deepEqual(result, []);
  });

  it('parses JSON in code block', () => {
    const input = '```json\n[{"severity":"low","category":"quality","description":"test","line_hint":"1"}]\n```';
    const result = parseFindings(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, 'low');
  });

  it('extracts array from surrounding text', () => {
    const input = 'Here are the findings:\n[{"severity":"medium","category":"performance","description":"slow loop","line_hint":"42"}]\nEnd of analysis.';
    const result = parseFindings(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].category, 'performance');
  });

  it('returns empty array for null/undefined', () => {
    assert.deepEqual(parseFindings(null), []);
    assert.deepEqual(parseFindings(undefined), []);
    assert.deepEqual(parseFindings(''), []);
  });

  it('returns empty array for invalid JSON', () => {
    assert.deepEqual(parseFindings('not json at all'), []);
    assert.deepEqual(parseFindings('{invalid}'), []);
  });

  it('handles multiple findings', () => {
    const input = JSON.stringify([
      { severity: 'high', category: 'security', description: 'XSS', line_hint: '10' },
      { severity: 'medium', category: 'quality', description: 'Missing null check', line_hint: '25' },
      { severity: 'low', category: 'performance', description: 'Unnecessary loop', line_hint: '40' }
    ]);
    const result = parseFindings(input);
    assert.equal(result.length, 3);
  });
});

// ─── ADVISORY_PROMPT ─────────────────────────────────────────────────────────

describe('LLM Advisor — ADVISORY_PROMPT', () => {
  it('instructs to check security vulnerabilities', () => {
    assert.ok(ADVISORY_PROMPT.includes('Security vulnerabilities'));
  });

  it('instructs to check logic errors', () => {
    assert.ok(ADVISORY_PROMPT.includes('Logic errors'));
  });

  it('instructs to check performance', () => {
    assert.ok(ADVISORY_PROMPT.includes('Performance concerns'));
  });

  it('instructs to return JSON array', () => {
    assert.ok(ADVISORY_PROMPT.includes('Return a JSON array'));
    assert.ok(ADVISORY_PROMPT.includes('Return ONLY the JSON array'));
  });
});

// ─── runAdvisory guard conditions ────────────────────────────────────────────

describe('LLM Advisor — runAdvisory() guards', () => {
  it('returns empty when llm.enabled is false', async () => {
    const result = await runAdvisory('some content', { llm: { enabled: false } });
    assert.deepEqual(result, []);
  });

  it('returns empty when config has no llm key', async () => {
    const result = await runAdvisory('some content', {});
    assert.deepEqual(result, []);
  });

  it('returns empty when content is too short', async () => {
    const result = await runAdvisory('short', { llm: { enabled: true } });
    assert.deepEqual(result, []);
  });

  it('returns empty when content is empty', async () => {
    const result = await runAdvisory('', { llm: { enabled: true } });
    assert.deepEqual(result, []);
  });

  it('returns empty when ANTHROPIC_API_KEY is not set', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const result = await runAdvisory('a'.repeat(100), { llm: { enabled: true } });
      assert.deepEqual(result, []);
    } finally {
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });
});
