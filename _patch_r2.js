const fs = require('fs');
const p = 'src/lib/r2.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/maybeScanFile\(/g, '_maybeScanFile(');
s = s.replace(/_scanFile,\s*\)/g, '_scanFile)');
fs.writeFileSync(p, s);
console.log('patched');
