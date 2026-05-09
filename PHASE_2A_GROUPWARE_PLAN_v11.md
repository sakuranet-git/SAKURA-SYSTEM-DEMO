# SAKURA SYSTEM デモ環境 Phase 2-A: グループウェア追加
## 確認書 v11 — Codex 第9回レビュー指摘修正版

**作成日**: 2026-05-09
**作成者**: Claude (Opus 4.7)
**改訂履歴**: v1〜v10 → **v11（Codex 第9回 5指摘 反映）**
**対象**: SAKURA-SYSTEM-DEMO v0.1.7 → v0.2.0
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当

---

## 0. v10 → v11 主要変更点（Codex 第9回反映）

| # | Codex 第9回指摘 | v11 対応 |
|---|---|---|
| 1 | Q6 と §13.1 が矛盾 | **§14 Q6 文言を「業務ロジックは触らない（認証部分のみ変更）」に修正** |
| 2 | customer_records delete ALLOW が広すぎる | **§4.1 リスク・期限・撤廃方針を明記＋緊急対応フロー追加** |
| 3 | archived 済みデータの通常 update が可能 | **§5 全 demo_* に `resource.data.archived == false` 追加** |
| 4 | create 時 archivedAt/archivedBy 混入可 | **§5 全 demo_* に `!('archivedAt' in request.resource.data)` 追加** |
| 5 | 通常 update で archivedAt/archivedBy 改変可 | **§5 全 demo_* 通常 update に同上ガード追加** |

---

## 1. 既存フィールド 完全棚卸し（v10 と同じ）

### 1.1 customer_records（41 フィールド）
```
status, dateReq, dateWork, timeWorkStart, timeWorkEnd, taskType,
name, kana, email, agency, staff, tel1, tel2, zip, address,
plan, cafNumber, accessKey, provider, constDate, pcCount, connStatus,
wanLanIp, routerIp, wifiIp, mailIdPass, serverIp, serverUserPass, copierIp,
innovEraUrl, innovEra, doraCoon,
memo, feeBase, feeTravel, feeParts, amount,
isDemo, created_by, created_by_name, seededAt, id
```

### 1.2 invoices（22 フィールド）
```
invoiceNumber, status, invDate, billingMonth,
clientName, clientContact, clientEmail, clientAddress,
paymentMethod, note, items, subtotal, tax, total,
updatedAt, isDemo, deleted, deletedAt, locked, lockedAt, seededAt, id
```

### 1.3 audit_log 既存形式（7 フィールド）
```
invoiceId, invoiceNumber, action, clientName, total, timestamp, isDemo
```

---

## 2. Phase 区分（v11 確定・文言精緻化）

| Phase | 内容 | 既存業務ロジック | 既存認証コード | 新規 |
|---|---|:-:|:-:|:-:|
| **v0.1.8** | 認証移行（Email/Password + demo_sessions）+ 互換 Rules + invitation_codes 廃止 | ❌ 触らない | ✅ 認証部分のみ変更 | demo_sessions |
| **v0.2.0** | グループウェア追加 + ナビ統合 | ❌ 触らない | ❌ 既存維持 | demo_* 群 |
| **Phase 2-D（後続）** | 既存業務ロジックの camelCase + archived 統一・移行スクリプト・厳格 Rules | ✅ 大改修 | - | - |

**Phase 2-A（v0.1.8 + v0.2.0）の不変条件**:
- 既存 stampRecordOwner / collectFormData / saveInvoice / deleteInvoice / deleteRecord 等の **業務ロジックは一切変更しない**
- 既存の Firestore データ構造は **一切変更しない**
- 認証コード（signInAnonymously → signInWithEmailAndPassword）は変更する
- ナビバーへのグループウェアボタン追加は v0.2.0 で実施（業務ロジックには影響しない UI 追加のみ）

---

## 3. 共通関数（v10 と同じ）

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

## 4. 互換 Rules（既存 collection・v11 修正版）

### 4.1 customer_records（delete ALLOW のリスク明文化）
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

  // ⚠️ 暫定許可（Phase 2-A 限定）
  // 既存 ordersystem.html (line 1990 deleteRecord) が物理 delete を使用しており、
  // Phase 2-A では業務ロジックを触らない方針のため一時的に許可。
  // リスク: 任意の demo_user が任意のレコードを物理削除可能
  // 期限: Phase 2-D で archived 論理削除へ移行・本許可を撤廃する
  // 緊急対応: 不正利用検知時は demo_sessions.disabled=true で当該ユーザーを即遮断
  allow delete: if isDemoUser();
}
```

### 4.2 invoices（変更なし・既存も論理削除のみ）
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
  allow delete: if false;
}
```

### 4.3 audit_log 既存形式（変更なし）
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

### 4.4 invitation_codes（即時廃止・変更なし）
```javascript
match /invitation_codes/{codeId} {
  allow read, write: if false;
}
```

---

## 5. 新規 Rules（demo_ プレフィックス・v11 厳格化版）

### 5.1 demo_todos（archived ガード強化）
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

  // ✨ create: archived 系フィールド完全禁止
  allow create: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid()
                 && request.resource.data.createdBy == request.auth.uid
                 && request.resource.data.archived == false
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data)
                 && timestampValid(request.resource.data.createdAt);

  // ✨ 通常 update: archived 済みデータは編集不可・archive 系フィールド改変禁止
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && resource.data.archived == false                                  // archived 済みは編集禁止
                 && request.resource.data.archived == false                          // archive 化禁止（archive 操作は別ルートで）
                 && !('archivedAt' in request.resource.data)                         // archivedAt 混入禁止
                 && !('archivedBy' in request.resource.data);                        // archivedBy 混入禁止

  // ✨ archive 操作専用 update（archived: false → true 一方向）
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && demoTodoArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;

  allow delete: if false;
}
```

### 5.2 demo_board_posts（archived ガード強化）
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
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data)
                 && timestampValid(request.resource.data.createdAt);

  allow update: if isDemoUser() && hasIsDemo() && demoBoardFieldsValid() && demoBoardUpdateInvariants()
                 && resource.data.archived == false
                 && request.resource.data.archived == false
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data);

  allow update: if isDemoUser() && hasIsDemo() && demoBoardFieldsValid() && demoBoardUpdateInvariants()
                 && demoBoardArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;

  allow delete: if false;
}
```

### 5.3 demo_calendar_events（archived ガード強化）
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
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data)
                 && timestampValid(request.resource.data.createdAt);

  allow update: if isDemoUser() && hasIsDemo() && demoCalendarFieldsValid() && demoCalendarUpdateInvariants()
                 && resource.data.archived == false
                 && request.resource.data.archived == false
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data);

  allow update: if isDemoUser() && hasIsDemo() && demoCalendarFieldsValid() && demoCalendarUpdateInvariants()
                 && demoCalendarArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;

  allow delete: if false;
}
```

### 5.4 demo_audit_log（変更なし）
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

## 6. demo_sessions / demo_config / 全拒否（v10 と同じ）

```javascript
match /demo_sessions/{uid} {
  allow get: if request.auth != null && request.auth.uid == uid;
  allow list, create, update, delete: if false;
}

match /demo_config/{docId} {
  allow read: if true;
  allow write: if false;
}

match /{document=**} {
  allow read, write: if false;
}
```

---

## 7. 認証モデル / 運用ルール（v10 と同じ）

§7.1〜§7.2 は v10 §7 と同じ。要点：
- demo_sessions ドキュメント構造（active/role/label/email/expiresAt/disabled）
- 1 商談 = 1 アカウント、期限 90 日
- パスワード平文管理台帳禁止
- 停止は demo_sessions.active=false が先、Auth 削除は最後
- 緊急停止は demo_config + demo_sessions.disabled 併用
- 月次棚卸し

---

## 8. クライアント実装変更（v11 文言精緻化）

### 8.1 v0.1.8: 認証部分のみ変更
**index.html**: 招待コード入力を Email/Password 入力に置換
**ordersystem.html / invoice.html / seed-firestore.html**:
- 認証コード（`signInAnonymously` 除去・session 確認追加）のみ変更
- **stampRecordOwner / collectFormData / saveInvoice / deleteInvoice / deleteRecord 等の業務ロジックは一切変更しない**
- 既存 Firestore 書込みフィールド構造は維持

### 8.2 v0.2.0: グループウェア追加
- groupware.html クリーンルーム実装（demo_ プレフィックスのみ）
- ナビバーに「グループウェア」ボタン追加（既存ファイルへの追加変更だが、業務ロジックには触らない）

---

## 9. Browser Storage 包括対策（v10 と同じ）

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

## 10. 禁止文字列 CI 検査（28項目・v10 と同じ）

省略（v10 §10 と同じ 28 項目）

---

## 11. Rules Unit Test ケース（v11・38件に拡張）

### 11.1 認証関連（8件・v10 と同じ）
T01-T08（v10 と同じ）

### 11.2 demo_sessions 自体（4件・v10 と同じ）
T09-T12（v10 と同じ）

### 11.3 既存 collection 互換（10件・v10 と同じ）
T13-T22（v10 と同じ）

### 11.4 新規 demo_ コレクション（8件・v10 と同じ）
T23-T30（v10 と同じ）

### 11.5 ✨ v11 追加：archived ガードテスト（8件）
| # | シナリオ | 期待 |
|---|---|:-:|
| **T31** | demo_todos archived 済みデータを通常 update | **DENY** |
| **T32** | demo_todos create 時 archivedAt 含めて送信 | **DENY** |
| **T33** | demo_todos create 時 archivedBy 含めて送信 | **DENY** |
| **T34** | demo_todos 通常 update で archivedAt 改変 | **DENY** |
| **T35** | demo_todos 通常 update で archivedBy 改変 | **DENY** |
| **T36** | demo_board_posts T31 同パターン | **DENY** |
| **T37** | demo_calendar_events T31 同パターン | **DENY** |
| **T38** | archived 済みデータを再度 archive 試行 | **DENY** |

---

## 12. Playwright テストカテゴリ（90件想定・v10 と同じ）

§12 は v10 §12 と同じ（認証フロー10件 / 既存回帰30件 / 新規グループウェア30件 / セキュリティ20件）

---

## 13. デプロイ順序（v11 文言精緻化）

### 13.1 v0.1.8 デプロイ
```
1. Firebase Console
   - Authentication > Email/Password ON
   - Authentication > 匿名 OFF
   - Authentication > 3アカウント発行
   - Firestore > demo_sessions コレクション・3ドキュメント手動作成
   - Firestore > Rules を §3-§6 互換版に更新・公開
   - Firestore > invitation_codes コレクション削除

2. ローカル
   - index.html を Email/Password 入力に変更
   - ordersystem.html / invoice.html / seed-firestore.html の【認証コード部分のみ】変更
     ※ stampRecordOwner / collectFormData / deleteRecord / saveInvoice / deleteInvoice 等の業務ロジックは触らない
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
   - ナビバーを 4 ページ対応に拡張（既存業務ロジックには触らない・UI 追加のみ）
   - マニュアル更新

3. 検証
   - グループウェア全機能
   - 既存機能の回帰確認
   - Playwright 全件
```

---

## 14. ユーザー判断要請（v11 文言精緻化）

| # | 質問 | 必要回答 |
|---|---|---|
| Q1 | 認証モデル変更（Email/Password 方式）OK | OK / NG |
| Q2 | 段階移行（v0.1.8 → v0.2.0 → Phase 2-D）OK | OK / NG |
| Q3 | パートナー再連絡（Email + Password 配布）OK | OK / NG |
| Q4 | アカウント期限 90 日 OK | OK / 別期限 |
| Q5 | 新規 collection 名 `demo_*` プレフィックス OK | OK / 別命名 |
| **Q6** | **Phase 2-A では既存 ordersystem/invoice の【業務ロジック・データモデル】は触らない（認証コード部分のみ変更）OK** | OK / NG |
| Q7 | 既存業務ロジックの改修は Phase 2-D（後続）に隔離 OK | OK / NG |

---

## 15. 工数（v11 微増・テスト追加分）

| カテゴリ | 工数 |
|---|:-:|
| **v0.1.8: 認証移行** | 4h |
| **v0.2.0: グループウェア追加** | 22h |
| **v11 追加分: Rules ユニットテスト 8件** | +1h |
| **合計** | **27-31h** |

---

## 16. レビュー履歴

| 版 | 日付 | レビュー | 主な変更 |
|---|---|---|---|
| v1〜v9 | 2026-05-09 | Codex 1〜7回 | プラン段階的精緻化 |
| v10 | 2026-05-09 | Codex 8回 | 2層分離・既存非破壊版 |
| **v11** | **2026-05-09** | **Codex 9回** | **Q6 文言修正・archived ガード強化（5件）** |

---

## 17. v11 採用必須修正チェックリスト（Codex 第9回反映確認）

- [x] Q6 を「業務ロジックは触らない（認証部分のみ変更）」に修正（§14）
- [x] §13.1 との矛盾解消・stampRecordOwner 等は触らない明記（§8.1, §13.1）
- [x] customer_records delete ALLOW のリスク・期限・撤廃方針・緊急対応明記（§4.1）
- [x] demo_* 通常 update に `resource.data.archived == false` 追加（§5.1-§5.3）
- [x] create 時 `!('archivedAt' in request.resource.data)` 等の混入禁止（§5.1-§5.3）
- [x] 通常 update で archivedAt / archivedBy 改変禁止（§5.1-§5.3）
- [x] Rules Unit Test に archived 済み通常編集 DENY 追加（T31, T36, T37）
- [x] Rules Unit Test に create 時 archivedAt 混入 DENY 追加（T32, T33）

---

## 18. レビュー記入欄（Codex 第10回・最終）

### 18.1 全体評価
- [ ] 実装着手承認 / [ ] 微修正で承認 / [ ] 大修正要 / [ ] 却下

### 18.2 v11 修正項目の評価
- §14 Q6 文言修正: __ / 5
- §4.1 customer_records delete 文言: __ / 5
- §5 demo_* archived ガード: __ / 5
- T31-T38 追加テスト: __ / 5

### 18.3 残課題

---

**v11 確認書、以上です。**

Codex 第9回指摘 5項目を全て反映。承認後 Sonnet 担当に引継ぎ・実装着手します。
