import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { logEntry, logPreTool, logPostTool, logStop } from '../scripts/lib/audit-logger.mjs';

describe('Audit Logger', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'quadruple-verify-test-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create log file and write JSONL entry', () => {
    const config = { auditDir: tempDir };
    logEntry({
      event: 'pre-tool',
      tool: 'Write',
      decision: 'approve',
      violations: [],
      metadata: { filePath: '/test.js' }
    }, config);

    // Find the log file
    const files = readdirSync(tempDir);
    assert.ok(files.length > 0, 'Should create at least one log file');

    const logContent = readFileSync(join(tempDir, files[0]), 'utf-8');
    const lines = logContent.trim().split('\n');
    assert.equal(lines.length, 1);

    const entry = JSON.parse(lines[0]);
    assert.equal(entry.event, 'pre-tool');
    assert.equal(entry.tool, 'Write');
    assert.equal(entry.decision, 'approve');
    assert.ok(entry.timestamp);
    assert.ok(entry.sessionId);
  });

  it('should append multiple entries to same session file', () => {
    const config = { auditDir: tempDir };

    logPreTool('Write', 'approve', [], { filePath: '/a.js' }, config);
    logPreTool('Edit', 'block', [{ ruleId: 'no-todo', message: 'blocked' }], {}, config);
    logPostTool('Bash', { command: 'npm test' }, config);

    const files = readdirSync(tempDir);
    const logContent = readFileSync(join(tempDir, files[0]), 'utf-8');
    const lines = logContent.trim().split('\n');
    assert.equal(lines.length, 3);
  });

  it('should include violations in log entry', () => {
    const config = { auditDir: tempDir };
    const violations = [
      { ruleId: 'no-eval', cycle: 2, message: 'eval is bad' },
      { ruleId: 'no-todo', cycle: 1, message: 'no TODOs' }
    ];

    logPreTool('Write', 'block', violations, {}, config);

    const files = readdirSync(tempDir);
    const logContent = readFileSync(join(tempDir, files[0]), 'utf-8');
    const entry = JSON.parse(logContent.trim());
    assert.equal(entry.violations.length, 2);
    assert.equal(entry.violations[0].ruleId, 'no-eval');
  });

  it('should not throw on log failure', () => {
    const config = { auditDir: '/nonexistent/impossible/path/that/will/fail' };
    // Should not throw - audit logging must never block
    assert.doesNotThrow(() => {
      logEntry({
        event: 'test',
        tool: 'test',
        decision: 'approve'
      }, config);
    });
  });
});
