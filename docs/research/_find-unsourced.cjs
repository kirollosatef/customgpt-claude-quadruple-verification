const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '_test-report.md'), 'utf-8');

const CLAIM_PATTERNS = [
  { src: '\\d+(\\.\\d+)?\\s*%', flags: 'g' },
  { src: '\\d+(\\.\\d+)?x\\b', flags: 'g' },
  { src: '\\d+-fold\\b', flags: 'gi' },
  { src: '\\b\\d{1,3}(,\\d{3})+\\b', flags: 'g' },
  { src: '\\$\\s*\\d+(\\.\\d+)?\\s*(million|billion|trillion|[MBTmbt])\\b', flags: 'gi' },
  { src: '\\b(study|survey|report)\\s+(by|from|at)\\b', flags: 'gi' },
  { src: '\\b[A-Z][a-z]+\\s+(University|Institute|Lab)\\b', flags: 'g' },
  { src: '\\b\\d+(\\.\\d+)?\\s*times\\s+(more|less|faster|slower|higher|lower|greater|better|worse)\\b', flags: 'gi' },
  { src: '\\b(in|since|by|from)\\s+\\d{4}\\b', flags: 'gi' }
];

const SOURCE_PATTERNS = [
  /\[.*?\]\(https?:\/\/[^\s)]+\)/,
  /https?:\/\/[^\s)>\]]+/,
  /\[(Source|Ref|Verified):?[^\]]*\]/i
];

const PROXIMITY = 300;

function hasNearbySource(content, idx) {
  const start = Math.max(0, idx - PROXIMITY);
  const end = Math.min(content.length, idx + PROXIMITY);
  const win = content.slice(start, end);
  return SOURCE_PATTERNS.some(p => p.test(win));
}

const claims = [];
const seen = new Set();
for (const pat of CLAIM_PATTERNS) {
  const gp = new RegExp(pat.src, pat.flags);
  let m;
  while ((m = gp.exec(content)) !== null) {
    const key = m.index + ':' + m[0];
    if (!seen.has(key)) {
      seen.add(key);
      claims.push({ text: m[0], index: m.index });
    }
  }
}

const unsourced = claims.filter(c => !hasNearbySource(content, c.index));
console.log('Total claims: ' + claims.length + ', Unsourced: ' + unsourced.length);
unsourced.forEach(c => {
  const before = content.slice(0, c.index);
  const line = before.split('\n').length;
  const lineContent = content.split('\n')[line-1] || '';
  console.log('  Line ' + line + ', char ' + c.index + ': "' + c.text + '" => ' + lineContent.trim().substring(0, 150));
});
