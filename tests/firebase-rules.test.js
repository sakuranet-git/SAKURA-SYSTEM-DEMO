/**
 * C-3: Firebase Security Rules テスト
 * Firebase Emulator Suite が必要: firebase emulators:start
 *
 * 実行: npx jest tests/firebase-rules.test.js
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'demo-sakura-system-local';
let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('未認証ユーザー', () => {
  test('customer_records への読み取りは拒否される', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('customer_records').get());
  });

  test('customer_records への書き込みは拒否される', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('customer_records').add({ name: 'test' }));
  });

  test('invoices への読み取りは拒否される', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('invoices').get());
  });
});

describe('デモユーザー（認証済み・isDemo=true）', () => {
  test('customer_records への読み取りは許可される', async () => {
    const db = testEnv.authenticatedContext('demo-user-001', { isDemo: true }).firestore();
    await assertSucceeds(db.collection('customer_records').get());
  });

  test('customer_records への書き込みは許可される', async () => {
    const db = testEnv.authenticatedContext('demo-user-001', { isDemo: true }).firestore();
    await assertSucceeds(db.collection('customer_records').add({ name: 'テスト顧客', isDemo: true }));
  });
});

describe('管理者以外はデモフラグなしデータへアクセス不可', () => {
  test('isDemo フラグなし顧客レコードへの書き込みは拒否される', async () => {
    const db = testEnv.authenticatedContext('demo-user-001', { isDemo: true }).firestore();
    await assertFails(db.collection('customer_records').add({ name: '本物の顧客' }));
  });
});
