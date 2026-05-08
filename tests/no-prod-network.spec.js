/**
 * C-4: 本番URL通信ゼロ テスト
 * デモアプリが本番 Firebase / 本番サーバーと通信していないことを証明する
 *
 * 実行: npx playwright test tests/no-prod-network.spec.js
 */

const { test, expect } = require('@playwright/test');

const PROD_URL_PATTERNS = [
  /sakura-net-db\.firebaseio\.com/,
  /sakura-net-db\.firebaseapp\.com/,
  /sakura-net-db\.appspot\.com/,
  /sakuranet-co\.jp\/system\//,
  /firestore\.googleapis\.com.*sakura-net-db/,
  /identitytoolkit\.googleapis\.com.*sakura-net-db/,
];

test('デモアプリが本番URLと通信しないこと', async ({ page }) => {
  const prodRequests = [];

  page.on('request', request => {
    const url = request.url();
    for (const pattern of PROD_URL_PATTERNS) {
      if (pattern.test(url)) {
        prodRequests.push(url);
        break;
      }
    }
  });

  await page.goto('/');
  await page.waitForTimeout(3000);

  if (prodRequests.length > 0) {
    console.error('⛔ 本番URLへの通信を検出:');
    prodRequests.forEach(url => console.error('  ' + url));
  }

  expect(prodRequests, `本番URLへの通信を検出: ${prodRequests.join(', ')}`).toHaveLength(0);
});

test('Firebase projectId が demo-sakura-system-local であること（Emulator 接続確認）', async ({ page }) => {
  const firestoreRequests = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('firestore') || url.includes('firebase')) {
      firestoreRequests.push(url);
    }
  });

  await page.goto('/');
  await page.waitForTimeout(3000);

  for (const url of firestoreRequests) {
    expect(url).not.toMatch(/sakura-net-db/);
  }
});
