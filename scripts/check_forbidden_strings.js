#!/usr/bin/env node
/**
 * v3.4 名刺管理: GAS / Drive / Storage 文字列混入検査
 * cards.html に Google Drive / GAS 経由のコード文字列が出現したら deploy 失敗
 * 本スクリプトと package.json は検査対象外
 */

const fs = require('fs');
const path = require('path');

const TARGETS = [
  path.resolve(__dirname, '..', 'cards.html'),
];

const FORBIDDEN = [
  'script' + '.google.com',
  'uploadCard' + 'WithOcr',
  'file' + 'Id',
  'folder' + 'Id',
  'Drive' + 'App',
  'google.com/' + 'drive',
];

let violations = 0;

for (const file of TARGETS) {
  if (!fs.existsSync(file)) {
    console.log(`skip (not found): ${path.basename(file)}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const needle of FORBIDDEN) {
    lines.forEach((line, idx) => {
      if (line.includes(needle)) {
        console.error(`✗ ${path.basename(file)}:${idx + 1}  禁止文字列「${needle}」検出`);
        console.error(`    ${line.trim().slice(0, 120)}`);
        violations++;
      }
    });
  }
}

if (violations > 0) {
  console.error(`\n❌ ${violations} 件の禁止文字列を検出しました。deploy を中止します。`);
  process.exit(1);
}

console.log('✓ check_forbidden_strings: 禁止文字列なし');
