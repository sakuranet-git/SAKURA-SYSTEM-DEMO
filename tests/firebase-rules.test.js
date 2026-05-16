/**
 * Firebase Security Rules テスト (v3.3)
 * Firebase Emulator Suite が必要: npm run emulator
 *
 * 実行: npm run test:rules
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

// ─── ヘルパー ────────────────────────────────────────────────────────────────

async function setupSession(uid, email, role = 'demo_user') {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('demo_sessions').doc(uid).set({
      active: true,
      disabled: false,
      role,
      expiresAt: new Date(Date.now() + 86400000),
      email,
    });
  });
}

async function seedDoc(collection, docId, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection(collection).doc(docId).set(data);
  });
}

// ─── 既存コレクション ─────────────────────────────────────────────────────────

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

describe('デモユーザー（認証済み・セッション有り）', () => {
  const UID = 'demo-user-legacy';
  const EMAIL = 'legacy@sakura-demo.test';

  beforeEach(async () => {
    await setupSession(UID, EMAIL);
  });

  test('customer_records への読み取りは許可される', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('customer_records').get());
  });

  test('customer_records への isDemo=true 書き込みは許可される', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('customer_records').add({
      name: 'テスト顧客', isDemo: true, status: 'active',
    }));
  });
});

describe('デモフラグなしデータへの書き込みは拒否', () => {
  const UID = 'demo-user-legacy2';
  const EMAIL = 'legacy2@sakura-demo.test';

  beforeEach(async () => {
    await setupSession(UID, EMAIL);
  });

  test('isDemo フラグなし顧客レコードへの書き込みは拒否される', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('customer_records').add({ name: '本物の顧客' }));
  });
});

// ─── demo_business_cards: 19項目テスト ───────────────────────────────────────

describe('demo_business_cards (TC-01〜TC-19)', () => {
  const UID        = 'card-user-001';
  const EMAIL      = 'carduser@sakura-demo.test';
  const OTHER_UID  = 'card-user-002';
  const OTHER_EMAIL = 'other@sakura-demo.test';

  const baseCard = (uid = UID) => ({
    name:      '伏見 彰',
    company:   '株式会社さくらねっと',
    isDemo:    true,
    archived:  false,
    createdBy: uid,
    createdAt: new Date(),
  });

  beforeEach(async () => {
    await setupSession(UID, EMAIL);
    await setupSession(OTHER_UID, OTHER_EMAIL);
  });

  // ── 読み取り ──────────────────────────────────────────────────────

  test('TC-01: 未認証ユーザーは読み取り不可', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('demo_business_cards').get());
  });

  test('TC-02: セッションなし認証ユーザーは読み取り不可', async () => {
    const db = testEnv.authenticatedContext('no-session-uid', { email: 'nosession@test.com' }).firestore();
    await assertFails(db.collection('demo_business_cards').get());
  });

  test('TC-03: 有効セッションユーザーは読み取り可能', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('demo_business_cards').get());
  });

  // ── 作成 ─────────────────────────────────────────────────────────

  test('TC-04: 正常データの create は許可', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('demo_business_cards').add(baseCard(UID)));
  });

  test('TC-05: isDemo=false の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), isDemo: false,
    }));
  });

  test('TC-06: name 欠如の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    const card = baseCard(UID);
    delete card.name;
    await assertFails(db.collection('demo_business_cards').add(card));
  });

  test('TC-07: company 欠如の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    const card = baseCard(UID);
    delete card.company;
    await assertFails(db.collection('demo_business_cards').add(card));
  });

  test('TC-08: 禁止フィールド追加の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), extraField: 'injected',
    }));
  });

  test('TC-09: name 101文字の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), name: 'あ'.repeat(101),
    }));
  });

  test('TC-10: tags 13個の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), tags: Array.from({ length: 13 }, (_, i) => `tag${i}`),
    }));
  });

  test('TC-11: tags に number を含む create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), tags: ['重要', 42],
    }));
  });

  test('TC-12: createdBy が他人の create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add(baseCard(OTHER_UID)));
  });

  test('TC-13: archived=true での create は拒否', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), archived: true,
    }));
  });

  // ── 更新 ─────────────────────────────────────────────────────────

  test('TC-14: 正常 update (memo 変更) は許可', async () => {
    await seedDoc('demo_business_cards', 'card-tc14', baseCard(UID));
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('demo_business_cards').doc('card-tc14').update({
      memo:      '備考を追加',
      updatedBy: UID,
      updatedAt: new Date(),
    }));
  });

  test('TC-15: isDemo を変更する update は拒否', async () => {
    await seedDoc('demo_business_cards', 'card-tc15', baseCard(UID));
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').doc('card-tc15').update({
      isDemo:    false,
      updatedBy: UID,
      updatedAt: new Date(),
    }));
  });

  test('TC-16: createdBy を変更する update は拒否', async () => {
    await seedDoc('demo_business_cards', 'card-tc16', baseCard(UID));
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').doc('card-tc16').update({
      createdBy: OTHER_UID,
      updatedBy: UID,
      updatedAt: new Date(),
    }));
  });

  // ── アーカイブ ───────────────────────────────────────────────────

  test('TC-17: 他人のカードのアーカイブは拒否', async () => {
    await seedDoc('demo_business_cards', 'card-tc17', baseCard(UID));
    const db = testEnv.authenticatedContext(OTHER_UID, { email: OTHER_EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').doc('card-tc17').update({
      archived:   true,
      archivedAt: new Date(),
      archivedBy: OTHER_UID,
      updatedBy:  OTHER_UID,
      updatedAt:  new Date(),
    }));
  });

  test('TC-18: 自分のカードのアーカイブは許可', async () => {
    await seedDoc('demo_business_cards', 'card-tc18', baseCard(UID));
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('demo_business_cards').doc('card-tc18').update({
      archived:   true,
      archivedAt: new Date(),
      archivedBy: UID,
      updatedBy:  UID,
      updatedAt:  new Date(),
    }));
  });

  // ── 削除 ─────────────────────────────────────────────────────────

  test('TC-19: delete は常に拒否', async () => {
    await seedDoc('demo_business_cards', 'card-tc19', baseCard(UID));
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').doc('card-tc19').delete());
  });

  // ── v3.4 driveOriginalUrl（空文字固定）─────────────────────────────

  test('TC-20: driveOriginalUrl="" の create は許可', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertSucceeds(db.collection('demo_business_cards').add({
      ...baseCard(UID), driveOriginalUrl: '',
    }));
  });

  test('TC-21: driveOriginalUrl に URL を入れた create は拒否（空文字固定違反）', async () => {
    const db = testEnv.authenticatedContext(UID, { email: EMAIL }).firestore();
    await assertFails(db.collection('demo_business_cards').add({
      ...baseCard(UID), driveOriginalUrl: 'https://drive.google.com/file/d/abc',
    }));
  });
});
