const fs = require('fs');
let s = fs.readFileSync('scratch/test-router.ts', 'utf8');
// Retire le helper module-level (placé avant async function main)
s = s.replace(/function fire\(opts: any\) \{[\s\S]*?\n\}\n\nasync function main\(\) \{/, 'async function main() {');
// Insère le helper dans main, juste après la définition de router
s = s.replace(
  "const router = (await import('../api/[[...path]]')).default;",
  "const router = (await import('../api/[[...path]]')).default;\n  function fire(opts: any) {\n    const r = makeRes();\n    const req = makeReq(opts);\n    return router(req, r).then(() => r);\n  }"
);
fs.writeFileSync('scratch/test-router.ts', s);
console.log('fire() dans main:', /function fire/.test(s.slice(s.indexOf('async function main')));
