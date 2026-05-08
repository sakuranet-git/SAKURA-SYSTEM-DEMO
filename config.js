/**
 * config.js — SAKURA デモ環境 Firebase設定
 * ⚠️ DEMO専用。本番(sakura-net-db)とは完全に分離されています。
 */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDv26kaVwKjxMSmVeyoc4MdYodgBywNXDc",
    authDomain: "sakura-demo-2026.firebaseapp.com",
    projectId: "sakura-demo-2026",
    storageBucket: "sakura-demo-2026.firebasestorage.app",
    messagingSenderId: "1087579014177",
    appId: "1:1087579014177:web:cf9a3b9da8fae0e67b8f60"
};

// 起動時安全チェック
if (typeof window !== 'undefined' && FIREBASE_CONFIG.projectId !== 'sakura-demo-2026') {
    document.body.innerHTML = '<h1 style="color:red;padding:40px">⛔ 設定エラー：デモプロジェクト以外への接続を検出。起動を停止しました。</h1>';
    throw new Error('FATAL: Wrong Firebase project: ' + FIREBASE_CONFIG.projectId);
}
