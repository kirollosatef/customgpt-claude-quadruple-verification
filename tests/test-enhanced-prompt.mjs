import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hooksPath = resolve(__dirname, '..', 'hooks', 'hooks.json');

// ─── Enhanced Stop Prompt Structure ──────────────────────────────────────────

describe('Enhanced Stop Prompt', () => {
  const hooks = JSON.parse(readFileSync(hooksPath, 'utf-8'));
  const stopHooks = hooks.hooks.Stop[0].hooks;
  const promptHook = stopHooks.find(h => h.type === 'prompt');
  const prompt = promptHook.prompt;

  it('exists as a prompt-type hook in Stop', () => {
    assert.ok(promptHook, 'Should have a prompt hook in Stop');
    assert.equal(promptHook.type, 'prompt');
  });

  it('contains CODE QUALITY REVIEW section', () => {
    assert.ok(prompt.includes('=== CODE QUALITY REVIEW ==='), 'Should have Code Quality section');
    assert.ok(prompt.includes('incomplete implementations'), 'Should check for incomplete implementations');
    assert.ok(prompt.includes('placeholder logic'), 'Should check for placeholder logic');
    assert.ok(prompt.includes('error handling'), 'Should check for error handling');
    assert.ok(prompt.includes('Edge cases'), 'Should check for edge cases');
  });

  it('contains SECURITY REVIEW section', () => {
    assert.ok(prompt.includes('=== SECURITY REVIEW ==='), 'Should have Security section');
    assert.ok(prompt.includes('Hardcoded credentials'), 'Should check for hardcoded credentials');
    assert.ok(prompt.includes('Injection vulnerabilities'), 'Should check for injection');
    assert.ok(prompt.includes('Unsafe deserialization'), 'Should check for unsafe deserialization');
    assert.ok(prompt.includes('Insecure cryptography'), 'Should check for insecure crypto');
    assert.ok(prompt.includes('test files and examples have different risk profiles'), 'Should note context-awareness');
  });

  it('contains RESEARCH CLAIMS section', () => {
    assert.ok(prompt.includes('=== RESEARCH CLAIMS ==='), 'Should have Research Claims section');
    assert.ok(prompt.includes('statistical claims'), 'Should check for statistical claims');
    assert.ok(prompt.includes('<!-- VERIFIED -->'), 'Should reference VERIFIED tag');
    assert.ok(prompt.includes('Perplexity MCP, WebSearch, or WebFetch'), 'Should list multiple search tools');
  });

  it('contains COMPLETENESS CHECK section', () => {
    assert.ok(prompt.includes('=== COMPLETENESS CHECK ==='), 'Should have Completeness section');
    assert.ok(prompt.includes('fully implement what was asked'), 'Should check for full implementation');
    assert.ok(prompt.includes('files you mentioned but did not create'), 'Should check for missing files');
  });

  it('outputs minimal verification result', () => {
    assert.ok(prompt.includes('**Verification**: PASS'), 'Should include pass indicator');
    assert.ok(prompt.includes('Do not include a full table'), 'Should specify minimal output');
  });

  it('skips for structured data and conversational responses', () => {
    assert.ok(prompt.includes('Skip entirely when returning structured data'), 'Should skip for structured data');
  });
});

// ─── Default Rules Config v2 ─────────────────────────────────────────────────

describe('Default Rules Config v2.0.0', () => {
  const configPath = resolve(__dirname, '..', 'config', 'default-rules.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  it('is version 2.0.0', () => {
    assert.equal(config.version, '2.0.0');
  });

  it('has cycle3.sections configuration', () => {
    assert.ok(config.cycle3.sections, 'Should have cycle3.sections');
    assert.equal(config.cycle3.sections.codeQuality, true);
    assert.equal(config.cycle3.sections.security, true);
    assert.equal(config.cycle3.sections.research, true);
    assert.equal(config.cycle3.sections.completeness, true);
  });

  it('has cycle4.acceptedVerificationTags', () => {
    assert.ok(Array.isArray(config.cycle4.acceptedVerificationTags));
    assert.ok(config.cycle4.acceptedVerificationTags.includes('<!-- PERPLEXITY_VERIFIED -->'));
    assert.ok(config.cycle4.acceptedVerificationTags.includes('<!-- VERIFIED -->'));
    assert.ok(config.cycle4.acceptedVerificationTags.includes('<!-- WEBSEARCH_VERIFIED -->'));
    assert.ok(config.cycle4.acceptedVerificationTags.includes('<!-- CLAIMS_VERIFIED -->'));
  });

  it('has output.quiet enabled by default', () => {
    assert.equal(config.output.quiet, true);
  });

  it('has llm config disabled by default', () => {
    assert.equal(config.llm.enabled, false);
    assert.equal(config.llm.model, 'claude-haiku-4-5-20251001');
    assert.equal(config.llm.advisoryMode, true);
    assert.equal(config.llm.maxLatencyMs, 5000);
  });
});
