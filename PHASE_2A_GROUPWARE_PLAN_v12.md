# SAKURA SYSTEM デモ環境 Phase 2-A: グループウェア追加
## 確認書 v12 — 実装着手承認版（Codex 第10回最終承認）

**作成日**: 2026-05-09
**作成者**: Claude (Opus 4.7)
**改訂履歴**: v1〜v11 → **v12（Codex 最終承認版）**
**対象**: SAKURA-SYSTEM-DEMO v0.1.7 → v0.2.0
**ステータス**: 🟢 **Codex 微修正承認・Sonnet 実装着手可**
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当

---

## 0. v11 → v12 主要変更点（Codex 第10回最終指摘・2件）

| # | Codex 第10回指摘 | v12 対応 |
|---|---|---|
| 1 | demo_* create 時 updatedAt/updatedBy 混入可 | **§5 全 demo_* create に `!('updatedAt' in ...)` `!('updatedBy' in ...)` 追加（推奨A）** |
| 2 | customer_records delete 撤廃を Phase 2-D タスク化 | **§19 Phase 2-D 必須タスクリスト新設・チケット化** |

---

## 1〜4. 既存仕様（v11 と同じ）

§1 既存フィールド棚卸し / §2 Phase 区分 / §3 共通関数 / §4 互換 Rules は **v11 と同じ**。

---

## 5. 新規 Rules（demo_ プレフィックス・v12 最終版）

### 5.1 demo_todos（v12 完全版）
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

  // ✨ v12: create 時は updatedAt/updatedBy/archivedAt/archivedBy 全て混入禁止
  allow create: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid()
                 && request.resource.data.createdBy == request.auth.uid
                 && request.resource.data.archived == false
                 && !('updatedAt' in request.resource.data)
                 && !('updatedBy' in request.resource.data)
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data)
                 && timestampValid(request.resource.data.createdAt);

  // 通常 update（archived 済みは編集禁止・archive 系フィールド改変禁止）
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && resource.data.archived == false
                 && request.resource.data.archived == false
                 && !('archivedAt' in request.resource.data)
                 && !('archivedBy' in request.resource.data);

  // archive 操作専用 update（archived: false → true 一方向）
  allow update: if isDemoUser() && hasIsDemo() && demoTodoFieldsValid() && demoTodoUpdateInvariants()
                 && demoTodoArchiveOneWay()
                 && resource.data.createdBy == request.auth.uid;

  allow delete: if false;
}
```

### 5.2 demo_board_posts（v12 完全版）
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
                 && !('updatedAt' in request.resource.data)
                 && !('updatedBy' in request.resource.data)
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

### 5.3 demo_calendar_events（v12 完全版）
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
                 && !('updatedAt' in request.resource.data)
                 && !('updatedBy' in request.resource.data)
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

### 5.4 demo_audit_log（v11 と同じ）
v11 §5.4 と同じ。

---

## 6〜10. 既存仕様（v11 と同じ）

§6〜§10 は **v11 と同じ**。

---

## 11. Rules Unit Test ケース（v12・40件に拡張）

### 11.1〜11.5（v11 T01-T38 と同じ）
- T01-T08 認証関連
- T09-T12 demo_sessions
- T13-T22 既存 collection 互換
- T23-T30 新規 demo_* 基本
- T31-T38 archived ガード

### 11.6 ✨ v12 追加：create 時 updatedAt/updatedBy 混入 DENY（2件）
| # | シナリオ | 期待 |
|---|---|:-:|
| **T39** | demo_todos create 時に updatedAt 含めて送信 | **DENY** |
| **T40** | demo_todos create 時に updatedBy 含めて送信 | **DENY** |

---

## 12〜18. 既存仕様（v11 と同じ）

§12〜§18 は **v11 と同じ**。

---

## 19. ✨ v12 新設：Phase 2-D 必須タスクチケット

実装後に必ず実施すべき後続タスクを明示化（v12 で新設）。

| # | タスク | 優先度 | 期限目安 | 担当 |
|---|---|:-:|---|---|
| 2D-01 | **customer_records の物理 delete を撤廃**（archived 論理削除へ移行）| 🔴 高 | Phase 2-A 公開後 30日以内 | Sonnet |
| 2D-02 | customer_records の field allowlist を厳格化（snake → camel 統一）| 🟡 中 | Phase 2-A 公開後 60日以内 | Sonnet |
| 2D-03 | invoices の `deleted/deletedAt` を `archived/archivedAt/archivedBy` に統一 | 🟡 中 | Phase 2-A 公開後 60日以内 | Sonnet |
| 2D-04 | audit_log を v8 形式（actorUid / collection / docId）に統一 | 🟡 中 | Phase 2-A 公開後 60日以内 | Sonnet |
| 2D-05 | 既存データ一括移行スクリプト（snake → camel・物理→論理）の作成・実行 | 🔴 高 | 2D-01〜2D-04 と並行 | Sonnet |
| 2D-06 | Rules 厳格化：互換版を撤廃し、demo_* と同水準の field allowlist を customer_records / invoices にも適用 | 🔴 高 | 2D-05 完了後 | Sonnet |

**重要**: 上記 6 タスクは Phase 2-A 公開時にチケット化（GitHub Issues 推奨）し、進捗管理する。

---

## 20. レビュー履歴

| 版 | 日付 | レビュー | 主な変更 |
|---|---|---|---|
| v1〜v9 | 2026-05-09 | Codex 1〜7回 | プラン段階的精緻化 |
| v10 | 2026-05-09 | Codex 8回 | 2層分離・既存非破壊版 |
| v11 | 2026-05-09 | Codex 9回 | Q6 文言修正・archived ガード強化 |
| **v12** | **2026-05-09** | **Codex 10回（最終）** | **create 時 updatedAt/updatedBy 混入禁止・Phase 2-D タスク化** |

---

## 21. 採用必須修正チェックリスト（Codex 第10回反映確認）

- [x] demo_* create 時 updatedAt/updatedBy 混入禁止（§5.1-§5.3）
- [x] Rules Unit Test に T39-T40 追加（§11.6）
- [x] customer_records delete 撤廃を Phase 2-D タスク化（§19）
- [x] Phase 2-D タスクリストを GitHub Issues 推奨として明記（§19）

---

## 22. Codex 最終ステータス

```
判定: 微修正で承認 → v12 で全反映済み
2層分離方針: 承認
Email/Password + demo_sessions: 承認
demo_* collection 方針: 承認
既存業務ロジック非破壊: 承認
Sonnet 実装着手: 🟢 OK（v12 で承認条件全て達成）
```

---

## 23. ユーザー判断要請（Q1-Q7・v11 と同じ）

| # | 質問 | 必要回答 |
|---|---|---|
| Q1 | 認証モデル変更（Email/Password 方式）OK | OK / NG |
| Q2 | 段階移行（v0.1.8 → v0.2.0 → Phase 2-D）OK | OK / NG |
| Q3 | パートナー再連絡（Email + Password 配布）OK | OK / NG |
| Q4 | アカウント期限 90 日 OK | OK / 別期限 |
| Q5 | 新規 collection 名 `demo_*` プレフィックス OK | OK / 別命名 |
| Q6 | Phase 2-A では既存 ordersystem/invoice の【業務ロジック・データモデル】は触らない（認証コード部分のみ変更）OK | OK / NG |
| Q7 | 既存業務ロジックの改修は Phase 2-D（後続）に隔離 OK | OK / NG |

---

## 24. 工数（v12・最終）

| カテゴリ | 工数 |
|---|:-:|
| **v0.1.8: 認証移行** | 4h |
| **v0.2.0: グループウェア追加** | 22h |
| **v12 追加: Rules ユニットテスト 2件** | +0.5h |
| **合計** | **27-31h** |

---

## 25. 着手手順（Sonnet 向け）

1. 本書 v12 を再読
2. ユーザー Q1-Q7 への回答を確認
3. memory `project_demo_environment.md` を確認
4. 環境前提検証（§1 v10 既存）を実施
5. 全項目 ✅ で着手可
6. §13 デプロイ順序を厳守
7. Phase 2-A 完了後、§19 Phase 2-D タスクを GitHub Issues に登録

---

**v12 確認書、以上です。**

Codex 第10回最終レビューで「微修正で承認」を得た仕様を全反映。
ユーザー Q1-Q7 への回答後、Sonnet による実装着手が可能です。
