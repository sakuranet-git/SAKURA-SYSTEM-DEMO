/**
 * config.js — SAKURA デモ環境 Firebase設定ブリッジ
 * 実際の設定は firebase-config.demo.js から読み込む（gitignore済み）
 * ⚠️ このファイルに API キーを直接書かないこと
 */
if (typeof DEMO_FIREBASE_CONFIG === 'undefined') {
    document.body.innerHTML = '<h1 style="color:red;padding:40px">⛔ firebase-config.demo.js が読み込まれていません。サーバーへのアップロードを確認してください。</h1>';
    throw new Error('FATAL: firebase-config.demo.js not loaded');
}
const FIREBASE_CONFIG = DEMO_FIREBASE_CONFIG;
