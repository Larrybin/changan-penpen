const fs = require('fs');
const p = 'src/lib/r2.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('function normalizeFolder(_folder: string | undefined)', 'function normalizeFolder(folder: string | undefined)');
fs.writeFileSync(p, s);
console.log('param renamed');
