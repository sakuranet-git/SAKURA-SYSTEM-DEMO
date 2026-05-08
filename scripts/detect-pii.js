#!/usr/bin/env node
/**
 * C-5: PII（個人情報）検出スクリプト
 * シードデータに実在する個人情報が混入していないか検査する
 */

const fs = require('fs');
const path = require('path');

const PII_PATTERNS = [
  // 実在する日本の電話番号（市外局番が固定電話・携帯の実在パターン）
  { label: '電話番号（要確認）', pattern: /(?:0[789]0|0[1-9][0-9])-\d{4}-\d{4}/ },
  // 実在メールドメイン（デモ用以外）
  { label: '実在メールアドレス', pattern: /[\w.+-]+@(?!demo\.sakuranet\.example|example\.com|test\.local)[\w-]+\.[a-z]{2,}/i },
  // マイナンバー形式
  { label: 'マイナンバー形式', pattern: /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/ },
  // クレジットカード番号形式
  { label: 'カード番号形式', pattern: /\b(?:\d{4}[\s-]){3}\d{4}\b/ },
  // 実在銀行口座番号（7桁）
  { label: '銀行口座番号形式', pattern: /口座番号[^\d]*\d{7}/ },
];

const SCAN_DIRS = ['seed-data', 'data'];
const SCAN_EXTENSIONS = ['.json', '.csv', '.js'];

function scanFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf8');

  for (const { label, pattern } of PII_PATTERNS) {
    const matches = content.match(new RegExp(pattern, 'g'));
    if (matches) {
      violations.push({ file: filePath, label, count: matches.length, sample: matches[0] });
    }
  }
  return violations;
}

const root = path.resolve(__dirname, '..');
const violations = [];

for (const dir of SCAN_DIRS) {
  const scanPath = path.join(root, dir);
  if (!fs.existsSync(scanPath)) continue;

  const files = fs.readdirSync(scanPath, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(scanPath, file);
    if (fs.statSync(fullPath).isFile() && SCAN_EXTENSIONS.includes(path.extname(file))) {
      violations.push(...scanFile(fullPath));
    }
  }
}

if (violations.length > 0) {
  console.error('\n⛔ PII 検出 — シードデータを確認してください\n');
  violations.forEach(v => {
    console.error(`  [${v.label}] ${v.file}`);
    console.error(`    サンプル: ${v.sample} (${v.count}件)`);
  });
  console.error('\nシードデータを架空データに差し替えてから再実行してください。\n');
  process.exit(1);
}

console.log('✅ PII 検出: 問題なし');
process.exit(0);
