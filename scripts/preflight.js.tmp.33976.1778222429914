#!/usr/bin/env node
/**
 * C.5: preflight チェック
 * ローカル起動前に projectId とエミュレータ接続を強制確認する
 * 誤って本番 Firebase に接続しようとしたら即停止する
 */

const http = require('http');

const ALLOWED_PROJECT_IDS = [
  'demo-sakura-system-local',
  'sakura-demo-2026',
];

const PROD_PROJECT_ID = 'sakura-net-db';
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8080;

// 1. FIREBASE_PROJECT_ID チェック
const projectId = process.env.GCLOUD_PROJECT
  || process.env.FIREBASE_PROJECT_ID
  || process.env.FIRESTORE_EMULATOR_PROJECT_ID
  || 'demo-sakura-system-local';

if (projectId === PROD_PROJECT_ID) {
  console.error('\n⛔ FATAL: 本番 projectId が設定されています。起動を停止します。');
  console.error(`  検出: ${projectId}`);
  process.exit(1);
}

if (!ALLOWED_PROJECT_IDS.includes(projectId)) {
  console.error(`\n⚠️  不明な projectId: ${projectId}`);
  console.error(`  許可リスト: ${ALLOWED_PROJECT_IDS.join(', ')}`);
  process.exit(1);
}

// 2. ローカル環境でエミュレータ起動確認
const isLocal = process.env.NODE_ENV !== 'production';
if (!isLocal) {
  console.log('✅ preflight: 本番モード（エミュレータチェックをスキップ）');
  process.exit(0);
}

const req = http.get(`http://${EMULATOR_HOST}:${EMULATOR_PORT}`, (res) => {
  console.log(`✅ preflight: Firestore Emulator 起動確認済み（port ${EMULATOR_PORT}）`);
  console.log(`✅ preflight: projectId = ${projectId}`);
  process.exit(0);
});

req.on('error', () => {
  console.error(`\n⛔ Firestore Emulator が起動していません（port ${EMULATOR_PORT}）`);
  console.error('  先に以下を実行してください:');
  console.error('  npm run emulator');
  console.error('  または: firebase emulators:start --only firestore,auth\n');
  process.exit(1);
});

req.setTimeout(3000, () => {
  req.destroy();
  console.error(`\n⛔ Emulator への接続がタイムアウトしました（${EMULATOR_HOST}:${EMULATOR_PORT}）\n`);
  process.exit(1);
});
