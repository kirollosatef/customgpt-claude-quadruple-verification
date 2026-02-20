import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getToolCapabilities, checkCapabilities } from '../scripts/lib/capability-gate.mjs';

describe('Capability Gate', () => {
  describe('getToolCapabilities', () => {
    it('should return filesystem for Write tool', () => {
      assert.deepEqual(getToolCapabilities('Write'), ['filesystem']);
    });

    it('should return filesystem for Edit tool', () => {
      assert.deepEqual(getToolCapabilities('Edit'), ['filesystem']);
    });

    it('should return shell, filesystem, network for Bash', () => {
      const caps = getToolCapabilities('Bash');
      assert.ok(caps.includes('shell'));
      assert.ok(caps.includes('filesystem'));
      assert.ok(caps.includes('network'));
    });

    it('should return network for WebFetch', () => {
      assert.deepEqual(getToolCapabilities('WebFetch'), ['network']);
    });

    it('should return mcp for MCP tools', () => {
      assert.deepEqual(getToolCapabilities('mcp__perplexity__search'), ['mcp']);
      assert.deepEqual(getToolCapabilities('mcp_custom_tool'), ['mcp']);
    });

    it('should return empty array for unknown tools', () => {
      assert.deepEqual(getToolCapabilities('UnknownTool'), []);
    });

    it('should handle case insensitivity', () => {
      assert.deepEqual(getToolCapabilities('WRITE'), ['filesystem']);
      assert.deepEqual(getToolCapabilities('bash'), ['shell', 'filesystem', 'network']);
    });
  });

  describe('checkCapabilities', () => {
    it('should allow tools when all capabilities are permitted', () => {
      const config = { capabilities: { allowed: ['filesystem', 'shell', 'network', 'mcp'] } };
      const result = checkCapabilities('Bash', config);
      assert.equal(result.allowed, true);
      assert.equal(result.missing.length, 0);
    });

    it('should block tools with disallowed capabilities', () => {
      const config = { capabilities: { allowed: ['filesystem'] } };
      const result = checkCapabilities('Bash', config);
      assert.equal(result.allowed, false);
      assert.ok(result.missing.includes('shell'));
      assert.ok(result.missing.includes('network'));
    });

    it('should block MCP tools when mcp not in allowed list', () => {
      const config = { capabilities: { allowed: ['filesystem', 'shell', 'network'] } };
      const result = checkCapabilities('mcp__perplexity__search', config);
      assert.equal(result.allowed, false);
      assert.deepEqual(result.missing, ['mcp']);
    });

    it('should fail-closed for unknown tools by default', () => {
      const config = { capabilities: { allowed: ['filesystem'] } };
      const result = checkCapabilities('UnknownTool', config);
      assert.equal(result.allowed, false);
      assert.deepEqual(result.missing, ['unknown']);
    });

    it('should fail-open for unknown tools when failClosed is false', () => {
      const config = { capabilities: { allowed: ['filesystem'], failClosed: false } };
      const result = checkCapabilities('UnknownTool', config);
      assert.equal(result.allowed, true);
    });

    it('should allow everything when capabilities enforcement is disabled', () => {
      const config = { capabilities: { enabled: false, allowed: [] } };
      const result = checkCapabilities('Bash', config);
      assert.equal(result.allowed, true);
    });

    it('should use default allowed list when none specified', () => {
      const result = checkCapabilities('Write', {});
      assert.equal(result.allowed, true);
    });
  });
});
