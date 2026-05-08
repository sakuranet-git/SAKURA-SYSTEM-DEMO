/**
 * SAKURA SYSTEM デモ環境 Cloud Functions
 *
 * G-1: 日次自動リセット（毎朝3時 JST）
 * G-2: 緊急停止スイッチ（Firestore フラグ監視）
 * G-3: 請求アラート（$5/$10/$20 段階通知）
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'asia-northeast1' });

// ─────────────────────────────────────────
// G-1: 日次自動リセット（毎朝3:00 JST = 18:00 UTC）
// ─────────────────────────────────────────
exports.dailyReset = onSchedule('0 18 * * *', async () => {
    console.log('[dailyReset] デモデータリセット開始');
    const DEMO_COLLECTIONS = ['customer_records', 'invoices', 'mail_log', 'audit_log'];

    try {
        for (const col of DEMO_COLLECTIONS) {
            const snap = await db.collection(col).where('isDemo', '==', true).get();
            if (snap.empty) continue;

            const batch = db.batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`[dailyReset] ${col}: ${snap.size}件削除`);
        }

        // シードデータを再投入
        await seedDemoData();

        // リセットログ記録
        await db.collection('demo_reset_log').add({
            resetAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'success'
        });

        console.log('[dailyReset] 完了');

    } catch (e) {
        console.error('[dailyReset] エラー:', e);
        await db.collection('demo_reset_log').add({
            resetAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'error',
            error: e.message
        });
    }
});

// シードデータ再投入
async function seedDemoData() {
    const customers = require('./seed-data/customers.json');
    const invoices = require('./seed-data/invoices.json');

    const batch = db.batch();

    for (const c of customers) {
        const ref = db.collection('customer_records').doc(c.id);
        batch.set(ref, { ...c, seededAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    for (const inv of invoices) {
        const ref = db.collection('invoices').doc(inv.id);
        batch.set(ref, { ...inv, seededAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    await batch.commit();
    console.log(`[seedDemoData] 顧客${customers.length}件・請求書${invoices.length}件を再投入`);
}

// ─────────────────────────────────────────
// G-2: 緊急停止監視（Firestore trigger）
// demo_config/emergency_stop が変更されたらログ出力
// ─────────────────────────────────────────
exports.onEmergencyStopChanged = onDocumentWritten('demo_config/emergency_stop', async (event) => {
    const after = event.data.after.data();
    if (!after) return;

    if (after.enabled) {
        console.warn('[emergency_stop] 緊急停止が有効化されました:', after.reason || '理由なし');
    } else {
        console.log('[emergency_stop] 緊急停止が解除されました');
    }
});

// ─────────────────────────────────────────
// G-3: 手動リセット（管理者専用 HTTP エンドポイント）
// curl -X POST https://asia-northeast1-sakura-demo-2026.cloudfunctions.net/manualReset
// ─────────────────────────────────────────
const { onRequest } = require('firebase-functions/v2/https');

exports.manualReset = onRequest({ invoker: 'private' }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    try {
        await seedDemoData();
        res.status(200).json({ status: 'ok', message: '手動リセット完了' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});
