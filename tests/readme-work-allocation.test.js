const assert = require('node:assert/strict');
const fs = require('node:fs');

const readmePath = require('node:path').join(__dirname, '..', 'README.md');
const readme = fs.readFileSync(readmePath, 'utf8');

assert.match(readme, /A 分支/);
assert.match(readme, /謝秉芸/);
assert.match(readme, /B 分支/);
assert.match(readme, /黃宣綺/);
assert.match(readme, /C 分支/);
assert.match(readme, /黃宥甄/);
assert.match(readme, /## 怎麼玩/);
assert.match(readme, /WASD/);
assert.match(readme, /滑鼠/);
assert.match(readme, /E/);
assert.match(readme, /Esc/);
assert.match(readme, /317/);
assert.match(readme, /0217/);
assert.match(readme, /電梯卡/);
