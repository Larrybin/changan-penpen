const fs = require('fs');
const p = 'src/lib/r2.ts';
let s = fs.readFileSync(p, 'utf8');
const startMarker = 'function normalizeFolder';
const start = s.indexOf(startMarker);
if (start === -1) { console.error('normalizeFolder not found'); process.exit(1); }
const braceStart = s.indexOf('{', start);
if (braceStart === -1) { console.error('brace not found'); process.exit(1); }
// find the end brace of this function by finding the first '\n}' after braceStart
const endBrace = s.indexOf('\n}', braceStart);
if (endBrace === -1) { console.error('end brace not found'); process.exit(1); }
const after = s.slice(endBrace + 2); // skip closing brace
const before = s.slice(0, start);
const block = `function normalizeFolder(folder: string | undefined) {
    const val = (folder ?? "uploads").trim();
    let start = 0;
    let end = val.length - 1;
    // 去掉前导 '/'
    while (start <= end && val.charCodeAt(start) === 47 /* '/' */) start++;
    // 去掉尾随 '/'
    while (end >= start && val.charCodeAt(end) === 47 /* '/' */) end--;
    const normalized = val.slice(start, end + 1);
    return normalized || "uploads";
}
`;
s = before + block + after;
fs.writeFileSync(p, s);
console.log('normalizeFolder replaced from', start, 'to', endBrace);
