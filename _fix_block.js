const fs = require('fs');
const p = 'src/lib/r2.ts';
let s = fs.readFileSync(p, 'utf8');
const marker = 'const scanOutcome = await ';
const idx = s.indexOf(marker);
if (idx === -1) { console.error('marker not found'); process.exit(1); }
// find end of the call by locating the first ');' after idx
const end = s.indexOf(');', idx);
if (end === -1) { console.error('call end not found'); process.exit(1); }
const before = s.slice(0, s.lastIndexOf('\n', idx));
const after = s.slice(end + 2);
const block = [
  '        // 3) 内容扫描（可选/必需）',
  '        const scanOutcome = await _maybeScanFile(',
  '            file,',
  '            _requireContentScan,',
  '            _scanFile',
  '        );'
].join('\n');
s = before + '\n' + block + after;
fs.writeFileSync(p, s);
console.log('replaced block at', idx, 'to', end);
