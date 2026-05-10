# Phase 2-D GitHub Issues 登録テンプレート

Phase 2-A 完了後に登録が必要な 6件のタスク（§19）。
登録先: https://github.com/sakuranet-git/SAKURA-SYSTEM-DEMO/issues/new

---

## 2D-01 🔴 高優先度

**タイトル:**
```
[Phase 2-D] customer_records 物理 delete を撤廃（archived 論理削除へ移行）
```

**本文:**
```
## 概要
customer_records コレクションの物理削除（delete）を廃止し、
archived フラグによる論理削除へ移行する。

## 背景
Phase 2-A では暫定的に物理削除を許可しているが、
データ保全の観点から論理削除に統一する必要がある。

## 対応内容
- customer_records に archived / archivedAt / archivedBy フィールド追加
- ordersystem.html の削除処理を論理削除に変更
- Firestore Rules の delete: if false; に変更
- 既存データへの archived: false 付与（2D-05 移行スクリプトで対応）

## 期限
Phase 2-A 公開後 30日以内

## 関連
- 2D-05 移行スクリプトと並行実施
- 2D-06 Rules 厳格化の前提
```

---

## 2D-02 🟡 中優先度

**タイトル:**
```
[Phase 2-D] customer_records フィールド allowlist 厳格化（snake_case → camelCase 統一）
```

**本文:**
```
## 概要
customer_records の 41フィールド allowlist を見直し、
命名規則を camelCase に統一する。

## 対応内容
- フィールド命名規則を snake_case → camelCase に統一
- Firestore Rules の customerLegacyFieldsValid() を更新
- ordersystem.html のフィールド参照を更新

## 期限
Phase 2-A 公開後 60日以内

## 関連
- 2D-05 移行スクリプトで既存データ変換
```

---

## 2D-03 🟡 中優先度

**タイトル:**
```
[Phase 2-D] invoices の deleted/deletedAt → archived/archivedAt/archivedBy に統一
```

**本文:**
```
## 概要
invoices コレクションの論理削除フィールドを
demo_* コレクションと同一の命名規則（archived系）に統一する。

## 対応内容
- deleted → archived
- deletedAt → archivedAt
- archivedBy フィールド追加
- invoice.html の削除処理を更新
- Firestore Rules の invoiceLegacyFieldsValid() を更新

## 期限
Phase 2-A 公開後 60日以内

## 関連
- 2D-05 移行スクリプトで既存データ変換
```

---

## 2D-04 🟡 中優先度

**タイトル:**
```
[Phase 2-D] audit_log を v8 形式（actorUid / collection / docId）に統一
```

**本文:**
```
## 概要
既存の audit_log コレクションのフィールド構造を
demo_audit_log と同じ v8 形式に統一する。

## 対応内容
- audit_log に actorUid / collection / docId フィールド追加
- 既存の invoiceId / invoiceNumber / action / clientName / total を整理
- Firestore Rules の auditLegacyFieldsValid() を更新

## 期限
Phase 2-A 公開後 60日以内
```

---

## 2D-05 🔴 高優先度

**タイトル:**
```
[Phase 2-D] 既存データ一括移行スクリプト作成・実行（snake→camel・物理→論理削除統一）
```

**本文:**
```
## 概要
2D-01〜2D-04 の変更に伴う既存 Firestore データの一括移行スクリプトを作成・実行する。

## 対応内容
- customer_records: snake_case → camelCase 変換 + archived: false 付与
- invoices: deleted/deletedAt → archived/archivedAt 変換 + archivedBy 付与
- audit_log: v8 形式フィールド追加
- tools/ 以下に migration スクリプト HTML を追加

## 期限
2D-01〜2D-04 と並行実施

## 注意
本番データに影響を与えないようデモ環境のみで実行
```

---

## 2D-06 🔴 高優先度

**タイトル:**
```
[Phase 2-D] Firestore Rules 厳格化（互換版撤廃・全コレクションに demo_* 同水準適用）
```

**本文:**
```
## 概要
現在の「互換 Rules」（customer_records / invoices の緩い allowlist）を撤廃し、
demo_* コレクションと同水準の厳格な Rules に移行する。

## 対応内容
- customerLegacyFieldsValid() → camelCase 統一後の厳格版に置換
- invoiceLegacyFieldsValid() → archived 統一後の厳格版に置換
- customer_records の delete: if isDemoUser() → delete: if false; に変更
- Rules Unit Test を更新

## 期限
2D-05 完了後

## 前提
2D-01〜2D-05 完了が必須
```

---

## 登録方法

1. 上記 URL からIssueを新規作成
2. タイトル・本文をコピペ
3. Labels に `phase-2d` / 優先度ラベルを付与（任意）
4. 6件登録後このファイルを削除またはアーカイブ
