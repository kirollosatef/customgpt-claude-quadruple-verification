import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectSensitiveAccess, captureSystemState, logSystemEvent } from '../scripts/lib/system-monitor.mjs';

describe('System Monitor', () => {

  describe('detectSensitiveAccess', () => {
    it('should detect /etc/passwd access', () => {
      const result = detectSensitiveAccess('cat /etc/passwd');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'etc-passwd'));
    });

    it('should detect /etc/shadow access', () => {
      const result = detectSensitiveAccess('cat /etc/shadow');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'etc-shadow'));
    });

    it('should detect SSH key access', () => {
      const result = detectSensitiveAccess('cat ~/.ssh/id_rsa');
      assert.ok(result.length >= 1);
      assert.ok(result.some(d => d.id === 'ssh-keys' || d.id === 'ssh-dir'));
    });

    it('should detect .env file access', () => {
      const result = detectSensitiveAccess('cat .env');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'env-file'));
    });

    it('should detect AWS credentials access', () => {
      const result = detectSensitiveAccess('cat ~/.aws/credentials');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'aws-credentials'));
    });

    it('should detect kube config access', () => {
      const result = detectSensitiveAccess('cat ~/.kube/config');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'kube-config'));
    });

    it('should detect bash history access', () => {
      const result = detectSensitiveAccess('cat ~/.bash_history');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'bash-history'));
    });

    it('should detect Windows SAM access (forward slash)', () => {
      const result = detectSensitiveAccess('type system32/config/SAM');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'win-sam'));
    });

    it('should detect Windows SAM access (backslash)', () => {
      const sep = String.fromCharCode(92);
      const result = detectSensitiveAccess('type system32' + sep + 'config' + sep + 'SAM');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'win-sam'));
    });

    it('should detect npmrc access', () => {
      const result = detectSensitiveAccess('cat .npmrc');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'npm-token'));
    });

    it('should detect git-credentials access', () => {
      const result = detectSensitiveAccess('cat ~/.git-credentials');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'git-credentials'));
    });

    it('should return empty for benign commands', () => {
      const result = detectSensitiveAccess('ls /tmp');
      assert.equal(result.length, 0);
    });

    it('should handle null/empty input', () => {
      assert.deepEqual(detectSensitiveAccess(null), []);
      assert.deepEqual(detectSensitiveAccess(''), []);
      assert.deepEqual(detectSensitiveAccess(undefined), []);
    });

    it('should detect docker config access', () => {
      const result = detectSensitiveAccess('cat ~/.docker/config.json');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'docker-config'));
    });

    it('should detect GPG directory access', () => {
      const result = detectSensitiveAccess('ls ~/.gnupg/');
      assert.ok(result.length > 0);
      assert.ok(result.some(d => d.id === 'gnupg-dir'));
    });
  });

  describe('captureSystemState', () => {
    it('should return a state object with expected fields', () => {
      const state = captureSystemState();
      assert.ok(state.platform);
      assert.ok(typeof state.processCount === 'number');
      assert.ok(Array.isArray(state.snapshot));
    });

    it('should capture at least one process', () => {
      const state = captureSystemState();
      assert.ok(state.processCount > 0 || state.processCount === -1);
    });
  });

  describe('logSystemEvent', () => {
    it('should call logFn with event data', () => {
      let logged = null;
      const mockLog = (name, data) => { logged = { name, data }; };
      
      logSystemEvent('sensitive-access', { path: '/etc/passwd' }, mockLog);
      assert.ok(logged);
      assert.equal(logged.name, 'system-monitor');
      assert.equal(logged.data.eventType, 'sensitive-access');
      assert.equal(logged.data.path, '/etc/passwd');
    });

    it('should fail-open if logFn throws', () => {
      const badLog = () => { throw new Error('log failure'); };
      // Should not throw
      logSystemEvent('test', {}, badLog);
    });

    it('should handle non-function logFn gracefully', () => {
      // Should not throw
      logSystemEvent('test', {}, null);
      logSystemEvent('test', {}, 'not-a-function');
    });
  });
});
