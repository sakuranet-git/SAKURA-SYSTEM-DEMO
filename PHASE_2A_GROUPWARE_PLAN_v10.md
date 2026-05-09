# SAKURA SYSTEM デモ環境 Phase 2-A: グループウェア追加
## 確認書 v10 — 2層分離・既存非破壊版（最終版）

**作成日**: 2026-05-09
**作成者**: Claude (Opus 4.7)
**改訂履歴**: v1〜v10（Codex 8回レビュー反映）
**対象**: SAKURA-SYSTEM-DEMO v0.1.7 → v0.2.0
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当

---

## 0. 本書の位置付け

本書は Opus による Phase 2-A の最終プラン納品物です。
Sonnet は新セッションで本書を読み、Q1-Q7 のユーザー判断と Codex 最終承認を得てから実装着手してください。

---

## 1. 既存フィールド 完全棚卸し

### 1.1 customer_records（ordersystem.html line 1509-1531 抽出）
```
status, dateReq, dateWork, timeWorkStart, timeWorkEnd, taskType,
name, kana, email, agency, staff, tel1, tel2, zip, address,
plan, cafNumber, accessKey, provider, constDate, pcCount, connStatus,
wanLanIp, routerIp, wifiIp, mailIdPass, serverIp, serverUserPass, copierIp,
innovEraUrl, innovEra, doraCoon,
memo, feeBase, feeTravel, feeParts, amount,
isDemo, created_by, created_by_name, seededAt, id
```
全 41 フィールド（snake_case 維持）

### 1.2 invoices（invoice.html line 2313-2335 抽出）
```
invoiceNumber, status, invDate, billingMonth,
clientName, clientContact, clientEmail, clientAddress,
paymentMethod, note, items, subtotal, tax, total,
updatedAt, isDemo,
deleted, deletedAt, locked, lockedAt, seededAt, id
```
全 22 フィールド

### 1.3 audit_log 既存形式（invoice.html line 2294-2301）
```
invoiceId, invoiceNumber, action, clientName, total, timestamp, isDemo
```
全 7 フィールド

---

## 2. Phase 区分（v10 確定）

| Phase | 内容 | 既存改修 | 新規追加 |
|---|---|:-:|:-:|
| **v0.1.8** | 認証移行（Email/Password + demo_sessions）+ 互換 Rules + invitation_codes 廃止 | ❌ | demo_sessions のみ |
| **v0.2.0** | グループウェア追加（demo_todos / demo_board_posts / demo_calendar_events / demo_audit_log）+ ナビ統合 | ❌ | §4 全部 |
| **Phase 2-D（後続）** | 既存 ordersystem/invoice の camelCase + archived 統一・移行スクリプト・厳格 Rules | ✅ | - |

⚠️ Phase 2-A（v0.1.8 + v0.2.0）では既存 ordersystem.html / invoice.html のコードに **一切手を入れない**。

---

## 3. 共通関数（Firestore Rules ヘッダ）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function sessionPath() { return /databases/$(database)/documents/demo_sessions/$(request.auth.uid); }
    function sessionData() { return get(sessionPath()).data; }

    function validDemoSession() {
      return request.auth != null
        && request.auth.uid != null
        && request.auth.token.email != null
        && exists(sessionPath())
        && sessionData().active == true
        && sessionData().disabled != true
        && sessionData().role in ['demo_user', 'demo_admin']
        && sessionData().expiresAt > request.time
        && sessionData().email == request.auth.token.email;
    }
    function isDemoUser() { return validDemoSession(); }
    function isDemoAdmin() { return validDemoSession() && sessionData().role == 'demo_admin'; }
    function hasIsDemo() { return request.resource.data.isDemo == true; }
    function timestampValid(field) { return field is timestamp && field <= request.time; }
```

---

## 4. 互換 Rules（既存 collection・最小変更）

### 4.1 customer_records
```javascript
function customerLegacyFieldsValid() {
  let allowed = [
    'status','dateReq','dateWork','timeWorkStart','timeWorkEnd','taskType',
    'name','kana','email','agency','staff','tel1','tel2','zip','address',
    'plan','cafNumber','accessKey','provider','constDate','pcCount','connStatus',
    'wanLanIp','routerIp','wifiIp','mailIdPass','serverIp','serverUserPass','copierIp',
    'innovEraUrl','innovEra','doraCoon',
    'memo','feeBase','feeTravel','feeParts','amount',
    'isDemo','created_by','created_by_name',
    'seededAt','id'
  ];
  return request.resource.data.keys().hasOnly(allowed);
}

match /customer_records/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && customerLegacyFieldsValid();
  allow update: if isDemoUser() && hasIsDemo() && customerLegacyFieldsValid()
                 && request.resource.data.isDemo == resource.data.isDemo;
  allow delete: if isDemoUser();  // Phase 2-A は維持・Phase 2-D で archived 化
}
```

### 4.2 invoices
```javascript
function invoiceLegacyFieldsValid() {
  let allowed = [
    'invoiceNumber','status','invDate','billingMonth',
    'clientName','clientContact','clientEmail','clientAddress',
    'paymentMethod','note','items','subtotal','tax','total',
    'updatedAt','isDemo',
    'deleted','deletedAt','locked','lockedAt',
    'seededAt','id'
  ];
  return request.resource.data.keys().hasOnly(allowed);
}

match /invoices/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && invoiceLegacyFieldsValid();
  allow update: if isDemoUser() && hasIsDemo() && invoiceLegacyFieldsValid();
  allow delete: if false;  // 既存も論理削除のみだったため即時 false 化
}
```

### 4.3 audit_log（既存形式維持）
```javascript
function auditLegacyFieldsValid() {
  let allowed = ['invoiceId','invoiceNumber','action','clientName','total','timestamp','isDemo'];
  return request.resource.data.keys().hasOnly(allowed);
}

match /audit_log/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && auditLegacyFieldsValid();
  allow update, delete: if false;
}
```

### 4.4 invitation_codes（即時廃止）
```javascript
match /invitation_codes/{codeId} {
  allow read, write: if false;
}
```

---

## 5. 新規 Rules（demo_ プレフィックス・厳格仕様）

### 5.1 demo_todos
```javascript
function demoTodoFieldsValid() {
  let allowed = ['title','done','priority','dueDate','memo','isDemo',
                 'createdAt','updatedAt','createdBy','updatedBy',
                 'archived','archivedAt','archivedBy'];
  return request.resource.data.keys().hasOnly(allowed)
      && request.resource.data.title is string
      && request.resource.data.title.size() <= 200
      && (!('memo' in request.resource.data) || request.resource.data.memo.size() <= 3000);
}
function demoTodoUpdateInvariants() {
  return request.resource.data.isDemo == resource.data.isDemo
      && request.resource.data.createdBy == resource.data.createdBy
      && request.resource.data.createdAt == resource.data.createdAt
      && request.resource.data.updatedBy == request.auth.uid
      && timestampValid(request.resource.data.updatedAt);
}
function demoTodoArchiveOneWay() {
  return resource.data.archived == false
      && request.resource.data.archived == true
      && request.resource.data.archivedBy == request.auth.uid
      && timestampValid(request.resource.data.archivedAt);
}

match /demo_todos/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid()
                 && request.resource.data.createdBy == request.auth.uid
                 && request.resource.data.archived == false
                 && timestampValid(request.resource.data.createdAt);
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && request.resource.data.archived == resource.data.archived;
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && demoTodoArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;
  allow delete: if false;
}
```

### 5.2 demo_board_posts
```javascript
function demoBoardFieldsValid() {
  let allowed = ['title','body','category','isDemo',
                 'createdAt','updatedAt','createdBy','updatedBy',
                 'archived','archivedAt','archivedBy'];
  return request.resource.data.keys().hasOnly(allowed)
      && request.resource.data.title is string
      && request.resource.data.title.size() <= 200
      && request.resource.data.body is string
      && request.resource.data.body.size() <= 3000;
}
function demoBoardUpdateInvariants() {
  return request.resource.data.isDemo == resource.data.isDemo
      && request.resource.data.createdBy == resource.data.createdBy
      && request.resource.data.createdAt == resource.data.createdAt
      && request.resource.data.updatedBy == request.auth.uid
      && timestampValid(request.resource.data.updatedAt);
}
function demoBoardArchiveOneWay() {
  return resource.data.archived == false
      && request.resource.data.archived == true
      && request.resource.data.archivedBy == request.auth.uid
      && timestampValid(request.resource.data.archivedAt);
}

match /demo_board_posts/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && demoBoardFieldsValid()
                 && request.resource.data.createdBy == request.auth.uid
                 && request.resource.data.archived == false
                 && timestampValid(request.resource.data.createdAt);
  allow update: if isDemoUser() && hasIsDemo() && demoBoardFieldsValid() && demoBoardUpdateInvariants()
                 && request.resource.data.archived == resource.data.archived;
  allow update: if isDemoUser() && hasIsDemo() && demoBoardFieldsValid() && demoBoardUpdateInvariants()
                 && demoBoardArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;
  allow delete: if false;
}
```

### 5.3 demo_calendar_events
```javascript
function demoCalendarFieldsValid() {
  let allowed = ['title','startAt','endAt','allDay','memo','isDemo',
                 'createdAt','updatedAt','createdBy','updatedBy',
                 'archived','archivedAt','archivedBy'];
  return request.resource.data.keys().hasOnly(allowed)
      && request.resource.data.title is string
      && request.resource.data.title.size() <= 200
      && (!('memo' in request.resource.data) || request.resource.data.memo.size() <= 3000)
      && request.resource.data.startAt is timestamp
      && request.resource.data.endAt is timestamp;
}
function demoCalendarUpdateInvariants() {
  return request.resource.data.isDemo == resource.data.isDemo
      && request.resource.data.createdBy == resource.data.createdBy
      && request.resource.data.createdAt == resource.data.createdAt
      && request.resource.data.updatedBy == request.auth.uid
      && timestampValid(request.resource.data.updatedAt);
}
function demoCalendarArchiveOneWay() {
  return resource.data.archived == false
      && request.resource.data.archived == true
      && request.resource.data.archivedBy == request.auth.uid
      && timestampValid(request.resource.data.archivedAt);
}

match /demo_calendar_events/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && demoCalendarFieldsValid()
                 && request.resource.data.createdBy == request.auth.uid
                 && request.resource.data.archived == false
                 && timestampValid(request.resource.data.createdAt);
  allow update: if isDemoUser() && hasIsDemo() && demoCalendarFieldsValid() && demoCalendarUpdateInvariants()
                 && request.resource.data.archived == resource.data.archived;
  allow update: if isDemoUser() && hasIsDemo() && demoCalendarFieldsValid() && demoCalendarUpdateInvariants()
                 && demoCalendarArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;
  allow delete: if false;
}
```

### 5.4 demo_audit_log
```javascript
function demoAuditFieldsValid() {
  let allowed = ['actorUid','action','collection','docId','isDemo','createdAt'];
  return request.resource.data.keys().hasOnly(allowed)
      && request.resource.data.actorUid == request.auth.uid
      && request.resource.data.isDemo == true
      && request.resource.data.action in ['create','update','archive']
      && request.resource.data.collection in ['demo_todos','demo_board_posts','demo_calendar_events']
      && timestampValid(request.resource.data.createdAt);
}
match /demo_audit_log/{docId} {
  allow read: if isDemoUser();
  allow create: if isDemoUser() && hasIsDemo() && demoAuditFieldsValid();
  allow update, delete: if false;
}
```

---

## 6. demo_sessions / demo_config / 全拒否

```javascript
match /demo_sessions/{uid} {
  allow get: if request.auth != null && request.auth.uid == uid;
  allow list, create, update, delete: if false;
}

match /demo_config/{docId} {
  allow read: if true;        // 緊急停止チェック用（認証前必要）
  allow write: if false;
}

match /{document=**} {
  allow read, write: if false;
}
```

---

## 7. 認証モデル（Email/Password 事前発行）

### 7.1 demo_sessions ドキュメント構造
```
demo_sessions/{uid} = {
  active: true,
  role: 'demo_user',                      // 'demo_user' | 'demo_admin'
  label: 'OEMパートナー候補A社',
  email: 'oem-001@sakura-demo.local',     // Auth uid と一致するメール
  expiresAt: <Timestamp>,                 // 発行日 + 90日
  disabled: false,
  createdAt: <Timestamp>,
  createdBy: 'admin@...'
}
```

### 7.2 アカウント運用ルール
- 1 商談 = 1 アカウント（使い回し禁止）
- 命名: `{partnerCode}@sakura-demo.local`
- 期限: デフォルト 90 日
- パスワード: 初回受け渡し後は管理台帳に**平文保存しない**
- 受け渡し: 個別連絡（暗号化チャット推奨）
- 停止: demo_sessions.active = false が先、Auth 削除は最後
- 緊急停止: demo_config.emergency_stop + demo_sessions 全 disabled
- 月次棚卸し: 期限切れ・disabled の確認

---

## 8. クライアント実装変更

### 8.1 v0.1.8: 認証部分のみ変更

**index.html**:
```html
<!-- BEFORE: 招待コード -->
<input type="text" id="inviteCode">

<!-- AFTER: Email/Password -->
<input type="email" id="email" autocomplete="username">
<input type="password" id="password" autocomplete="current-password">
```
```javascript
const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
const sessionDoc = await db.collection('demo_sessions').doc(cred.user.uid).get();
if (!sessionDoc.exists || !sessionDoc.data().active || sessionDoc.data().disabled
    || sessionDoc.data().expiresAt.toDate() < new Date()) {
  showError('アクセス権限がありません');
  await firebase.auth().signOut();
  return;
}
sessionStorage.setItem('demo_authorized', 'true');
window.location.href = 'ordersystem.html';
```

**ordersystem.html / invoice.html**:
- 匿名認証 `signInAnonymously()` を削除
- 起動時に `firebase.auth().currentUser` チェック・未認証なら index.html へ
- **業務ロジックは一切変更しない**（既存 stampRecordOwner / collectFormData 等そのまま）

### 8.2 v0.2.0: グループウェア追加（クリーンルーム実装）
- groupware.html を新規スクラッチで作成
- 本番 groupware.html はコピー禁止・参照のみ
- demo_ プレフィックス collection のみ使用
- camelCase / createdBy=uid / archived 論理削除
- TODO / 掲示板 / カレンダー の3機能 + ダッシュボード
- ナビバー統合（顧客管理 / 請求書 / グループウェア / 使い方ガイド / ログアウト）
- DEMOバナー / 起動時 projectId 検証 / Browser Storage cleanup

---

## 9. Browser Storage 包括対策

```javascript
(async function browserCleanup() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  Object.keys(localStorage).filter(k => k.includes('sakura-net-db')).forEach(k => localStorage.removeItem(k));
  Object.keys(sessionStorage).filter(k => k.includes('sakura-net-db')).forEach(k => sessionStorage.removeItem(k));
  if ('indexedDB' in window) {
    const dbs = await indexedDB.databases?.() || [];
    dbs.filter(d => d.name?.includes('sakura-net-db')).forEach(d => indexedDB.deleteDatabase(d.name));
  }
})();
```

---

## 10. 禁止文字列 CI 検査（28項目）

```
sakura-net-db
sakuranet-co.jp/system
/system/groupware.html
gw_api.php
gw_files.php
gw_calendar_sync.php
cybozu_sync.php
cybozu_config.php
cbag
ag.exe
calllog
usagelog
chat_messages
chat_channels
wallpapers/
wallpepers/
config-secret
本番 apiKey 文字列
本番 authDomain 文字列
本番 storageBucket 文字列
本番 messagingSenderId 文字列
本番 measurementId 文字列
本番 firebaseConfig オブジェクト
demo.sakuranet-co.jp 以外の本番ドメイン
@sakuranet-co.jp 実メールパターン
060/070/080/090- 実電話番号パターン
本番由来住所文字列
実顧客名ブラックリスト
```

---

## 11. Rules Unit Test ケース（30件）

### 11.1 認証関連（8件）
| # | シナリオ | 期待 |
|---|---|:-:|
| T01 | 未認証で全コレクション read/write | DENY |
| T02 | demo_sessions なしで read/write | DENY |
| T03 | demo_sessions.active=false で read/write | DENY |
| T04 | demo_sessions.disabled=true で read/write | DENY |
| T05 | demo_sessions.expiresAt 過去 で read/write | DENY |
| T06 | demo_sessions.role 不正値 | DENY |
| T07 | demo_sessions.email != Auth Email | DENY |
| T08 | request.auth.token.email == null | DENY |

### 11.2 demo_sessions 自体（4件）
| # | シナリオ | 期待 |
|---|---|:-:|
| T09 | 自分の demo_sessions get | ALLOW |
| T10 | 他人の demo_sessions get | DENY |
| T11 | demo_sessions list | DENY |
| T12 | demo_sessions create/update/delete | DENY |

### 11.3 既存 collection 互換（10件）
| # | シナリオ | 期待 |
|---|---|:-:|
| T13 | customer_records 既存フィールドで保存 | ALLOW |
| T14 | customer_records created_by_name 含む保存 | ALLOW |
| T15 | customer_records 未定義フィールド付加 | DENY |
| T16 | customer_records isDemo 不変違反 | DENY |
| T17 | customer_records 物理 delete | ALLOW（Phase 2-A 維持） |
| T18 | invoices 既存フィールドで保存 | ALLOW |
| T19 | invoices locked / deleted フィールド維持 | ALLOW |
| T20 | invoices 物理 delete | DENY |
| T21 | audit_log 既存形式 create | ALLOW |
| T22 | audit_log update/delete | DENY |

### 11.4 新規 demo_ コレクション（8件）
| # | シナリオ | 期待 |
|---|---|:-:|
| T23 | demo_todos 正常 create | ALLOW |
| T24 | demo_todos createdBy != auth.uid | DENY |
| T25 | demo_todos 許可外フィールド付加 | DENY |
| T26 | demo_todos archived: true → false 巻戻し | DENY |
| T27 | demo_todos 他人レコードを archive 試行 | DENY |
| T28 | demo_todos 物理 delete | DENY |
| T29 | demo_board_posts 同パターン | 上記と同じ |
| T30 | demo_calendar_events 同パターン | 上記と同じ |

---

## 12. Playwright テストカテゴリ（90件想定）

### 12.1 認証フロー（10件）
- 正規アカウント sign-in → ordersystem へ遷移
- 無効アカウント sign-in → エラー表示
- 期限切れアカウント → エラー表示
- disabled アカウント → エラー表示
- ログアウト → index へ戻る
- 等

### 12.2 既存機能 回帰テスト（30件）
- customer_records: 新規・編集・検索・一覧表示・削除
- invoices: 新規作成・編集・PDF出力・論理削除・確定済み保護
- 既存 seed ロード
- 各種 navigation
- 等

### 12.3 新規グループウェア機能（30件）
- TODO CRUD（作成・編集・完了・archive）
- 掲示板 CRUD
- カレンダー CRUD
- ダッシュボード集約表示
- 等

### 12.4 セキュリティ・ネットワーク（20件）
- sakura-net-db 通信ゼロ
- sakuranet-co.jp/system 通信ゼロ
- 本番 *.php 通信ゼロ
- ServiceWorker 登録ゼロ
- CacheStorage 内容空（または demo URL のみ）
- localStorage に本番キーゼロ
- IndexedDB に本番DB ゼロ
- DevTools で projectId 改ざん試行 → Rules 拒否
- DevTools で isDemo:false 書込試行 → Rules 拒否
- 等

---

## 13. デプロイ順序

### 13.1 v0.1.8 デプロイ
```
1. Firebase Console
   - Authentication > Email/Password ON
   - Authentication > 匿名 OFF
   - Authentication > 3アカウント発行（demo-001@/oem-001@/agent-001@）
   - Firestore > demo_sessions コレクション・3ドキュメント手動作成
   - Firestore > Rules を §3-§6 互換版に更新・公開
   - Firestore > invitation_codes コレクション削除

2. ローカル
   - index.html を Email/Password 入力に変更
   - ordersystem.html / invoice.html / seed-firestore.html の認証コード変更
   - 既存業務ロジックは変更なし
   - WinSCP で 4 ファイルアップロード

3. 検証（Sonnet が手動 + Playwright）
   - ログイン → 全画面動作
   - 既存機能の回帰確認
```

### 13.2 v0.2.0 デプロイ
```
1. Firebase Console
   - Firestore Rules > §5 demo_* を追加（既存 §4 はそのまま）

2. ローカル
   - groupware.html クリーンルーム実装
   - tools/seed-firestore.html v2（demo_* シード追加）
   - ナビバー 4 ページ対応に拡張
   - マニュアル更新

3. 検証
   - グループウェア全機能
   - 既存機能の回帰確認
   - Playwright 全件
```

---

## 14. ユーザー判断要請（Q1-Q7）

| # | 質問 | 必要回答 |
|---|---|---|
| Q1 | 認証モデル変更（Email/Password 方式）OK | OK / NG |
| Q2 | 段階移行（v0.1.8 → v0.2.0 → Phase 2-D）OK | OK / NG |
| Q3 | パートナー再連絡（Email + Password 配布）OK | OK / NG |
| Q4 | アカウント期限 90 日 OK | OK / 別期限 |
| Q5 | 新規 collection 名 `demo_*` プレフィックス OK | OK / 別命名 |
| Q6 | Phase 2-A では既存 ordersystem/invoice のコードを **一切触らない** OK | OK / NG |
| Q7 | 既存改修は Phase 2-D（後続）に隔離 OK | OK / NG |

---

## 15. 工数（v10 確定）

| カテゴリ | 工数 |
|---|:-:|
| **v0.1.8: 認証移行** | 4h |
| **v0.2.0: グループウェア追加** | 22h |
| **合計** | **26-30h** |

---

## 16. レビュー履歴

| 版 | 日付 | レビュー | 主な変更 |
|---|---|---|---|
| v1 | 2026-05-09 | 初版 | プラン作成 |
| v2 | 2026-05-09 | Codex 1回 | クリーンルーム実装方針確定 |
| v3 | 2026-05-09 | Codex 2回 | 多層防御強化 |
| v4 | 2026-05-09 | Codex 3回 | validDemoSession 導入 |
| v5 | 2026-05-09 | Codex 4回 | Email/Password 認証採用 |
| v6 | 2026-05-09 | Codex 5回 | demo_sessions 詳細化 |
| v7 | 2026-05-09 | Codex 6回 | request.time / email 一致 |
| v8 | 2026-05-09 | Codex 7回 | get() 削減・最終仕上げ |
| v9 | 2026-05-09 | Codex 8回 | 既存互換性問題発覚 |
| **v10** | **2026-05-09** | **最終版** | **2層分離・既存非破壊・Sonnet 引継ぎ** |

---

**本書をもって Opus の Phase 2-A プラン納品とします。**

Sonnet は新セッションで本書 + ユーザー Q1-Q7 回答 + Codex 最終承認を確認後、§13 のデプロイ順序に従って実装してください。
