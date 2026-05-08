#!/usr/bin/env node
/**
 * C-1: 本番設定リーク検出スクリプト
 * 本番 Firebase の projectId / apiKey がコードに混入していたらデプロイを即停止する
 *
 * 本番 apiKey は環境変数 SAKURA_PROD_API_KEY で渡す（ソースに書かない）
 * ローカル: .env.local に設定 / CI: GitHub Secrets に設定
 */

const fs = require('fs');
const path = require('path');

// 設定値として代入されている場合のみ検出（コメント内は除外）
const PROD_PATTERNS = [
  { label: '本番 projectId',     pattern: /projectId\s*[:=]\s*["']sakura-net-db["']/ },
  { label: '本番 authDomain',    pattern: /authDomain\s*[:=]\s*["']sakura-net-db\.firebaseapp\.com["']/ },
  { label: '本番 storageBucket', pattern: /storageBucket\s*[:=]\s*["']sakura-net-db/ },
];

// 本番 apiKey が環境変数で渡されている場合のみ追加検査
if (process.env.SAKURA_PROD_API_KEY) {
  const escaped = process.env.SAKURA_PROD_API_KEY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  PROD_PATTERNS.push({ label: '本番 apiKey', pattern: new RegExp(escaped) });
} else {
  console.warn('⚠️  SAKURA_PROD_API_KEY が未設定のため apiKey チェックをスキップ');
  console.warn('   .env.local に SAKURA_PROD_API_KEY=<本番apiKey> を追加してください');
}

const SCAN_EXTENSIONS = ['.js', '.html', '.php', '.json', '.ts'];
const IGNORE_DIRS = ['node_modules', '.git', 'trash', 'backups'];
const IGNORE_FILES = [
  'check-no-prod-config.js',
  'preflight.js',
  'no-prod-network.spec.js',
  '.gitleaks.toml',
];

function scanDir(dir) {
  const violations = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      violations.push(...scanDir(fullPath));
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name)) && !IGNORE_FILES.includes(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const { label, pattern } of PROD_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`[${label}] ${fullPath}`);
        }
      }
    }
  }
  return violations;
}

const root = path.resolve(__dirname, '..');
const violations = scanDir(root);

if (violations.length > 0) {
  console.error('\n⛔ 本番設定リーク検出 — デプロイを停止します\n');
  violations.forEach(v => console.error('  ' + v));
  console.error('\n本番設定を削除してから再実行してください。\n');
  process.exit(1);
}

console.log('✅ 本番設定リーク検出: 問題なし');
process.exit(0);
