const fs = require('fs');
const s = fs.readFileSync('src/lib/seo.ts','utf8').split(/\r?\n/);
for (let i=0;i<s.length;i++) {
  if (s[i].includes("replace(/(?:^['\"]|['\"]$)/g, \"\")")) {
    console.log((i+1)+":"+s[i]);
  }
}
