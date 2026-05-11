# SAKURA SYSTEM デモ環境 リリースノート

## v0.3.1 (2026-05-11) — 使い方ガイド ログイン情報更新

### 変更
- `manual-user.html` SECTION 02 を現行の Email/Password 方式に更新
  - 旧: 招待コード方式（v0.1.8 で廃止済み・内容が古かった）
  - 新: メールアドレス + パスワード方式（デモアカウント3件の表を追加）

### WinSCP アップロード対象（v0.3.1）
サーバーパス: `/home/sakura-nets/www/demo/`

| ファイル | 変更 |
|---------|------|
| `manual-user.html` | ログイン方法・デモアカウント情報を更新 |

---

## v0.3.0 (2026-05-11) — SAKURA OS 追加（Phase 2-B 完了）

### 追加（Phase 2-B 実装）

**SAKURA OS デモ版（クリーンルーム実装）**
- `sakura-os.html` 新規作成（OS 風ランチャー）
  - 認証: Email/Password + `demo_sessions` 検証（v0.1.8 と同一方式）
  - 緊急停止チェック: `demo_config/emergency_stop`
  - 左パネル: 時計（JST・和暦・曜日）/ 天気（Open-Meteo・大阪）/ アプリグリッド / 為替（open.er-api.com）
  - メインパネル: ニュース固定ダミー（外部 API なし）/ カレンダーウィジェット / タスクウィジェット
  - ウィンドウマネージャー: ドラッグ / リサイズ / 最小化 / 最大化 / 閉じる
  - タスクバー: 起動中アプリ一覧
  - 壁紙: CSS グラデーション 9 種プリセット / スライドショー（プリセット ID のみ保存）
  - SAKURA AI: B案（準備中タイル + モーダルのみ・iframe/通信ゼロ）
  - DEMO バナー（赤・固定）新規設置

**セキュリティ実装（Codex 4 回レビュー承認済み）**
- iframe URL allowlist: `APP_ALLOWLIST` 4 件固定・任意 URL 受け付けない
- `iframe sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="no-referrer"`
- localStorage ラッパー: `lsSet/lsGet/lsRemove`（`sakura_demo_os_` prefix 強制・禁止値検査）
- CSP メタタグ: `default-src 'self'` ベース・本番ドメイン禁止
- 本番 PHP API（gw_api.php / get_wallpapers.php）・sakura-ai 配下への通信ゼロ

**Firestore 連携（read only）**
- `demo_calendar_events` onSnapshot（デスクトップカレンダー表示）
- `demo_todos` onSnapshot（本日のタスク表示）
- 新規コレクション不要（Rules 変更なし）

**ナビゲーションバー更新（3ページ）**
- `ordersystem.html` — ナビに「🖥️ SAKURA OS」追加（業務ロジック変更なし）
- `invoice.html` — ナビに「🖥️ SAKURA OS」追加（業務ロジック変更なし）
- `groupware.html` — ナビに「🖥️ SAKURA OS」追加（業務ロジック変更なし）

**バックアップ**
- `backups/v0.2.0/` に v0.2.0 時点のファイルを保存済み

### WinSCP アップロード対象（v0.3.0）

サーバーパス: `/home/sakura-nets/www/demo/`

| ファイル | 変更 |
|---------|------|
| `sakura-os.html` | ✨ 新規（SAKURA OS デモ版） |
| `ordersystem.html` | ナビバーのみ変更（SAKURA OS リンク追加） |
| `invoice.html` | ナビバーのみ変更（SAKURA OS リンク追加） |
| `groupware.html` | ナビバーのみ変更（SAKURA OS リンク追加） |

---

## v0.2.0 (2026-05-10) — グループウェア追加（Phase 2-A 完了）

### 追加（Phase 2-A §8.2 実装）

**グループウェア機能（クリーンルーム実装）**
- `groupware.html` 新規作成
  - ダッシュボード・掲示板・タスク管理・カレンダー 4タブ構成
  - Firestore: `demo_board_posts` / `demo_todos` / `demo_calendar_events` / `demo_audit_log` 使用
  - 既存の業務ロジック（ordersystem / invoice）には一切変更なし
  - Email/Password + demo_sessions 認証（v0.1.8 と同一方式）
  - 全操作に `isDemo: true` 付与・論理削除（archived）のみ・物理 delete 禁止

**ナビゲーションバー更新（4ページ対応）**
- `ordersystem.html` — ナビに「🏢 グループウェア」追加（認証コード・ナビ以外変更なし）
- `invoice.html` — ナビに「🏢 グループウェア」追加（認証コード・ナビ以外変更なし）

**シードデータ更新（v2）**
- `tools/seed-firestore.html` — グループウェア用シードデータ追加
  - 掲示板: 3件（お知らせ・業務連絡・雑談）
  - タスク: 3件（高・中・低 優先度）
  - カレンダー: 3件（今後の予定）

**Firestore Rules**（変更なし）
- v0.1.8 で既にデプロイ済みの v12 Rules（demo_* コレクション対応済み）

**バックアップ**
- `backups/v0.1.8/` に v0.1.8 時点のファイルを保存済み

### WinSCP アップロード対象（v0.2.0）

サーバーパス: `/home/sakura-nets/www/demo/`

| ファイル | 変更 |
|---------|------|
| `groupware.html` | ✨ 新規 |
| `ordersystem.html` | ナビバーのみ変更 |
| `invoice.html` | ナビバーのみ変更 |
| `tools/seed-firestore.html` | グループウェアシードデータ追加 |

---

## v0.1.8 (2026-05-09) — 認証移行（Email/Password + demo_sessions）

### 変更（Phase 2-A §13.1 実装）

**認証モデル変更**
- 匿名認証（Anonymous Auth）→ Email/Password 認証に移行
- `demo_sessions` コレクションによるセッション検証（active / disabled / expiresAt チェック）
- 招待コード（invitation_codes）廃止

**変更ファイル**
- `index.html` — 招待コード入力フォーム → Email/Password ログインフォームに置換
- `ordersystem.html` — 認証コードのみ変更（業務ロジック・データモデル変更なし）
- `invoice.html` — 認証コードのみ変更（業務ロジック・データモデル変更なし）
- `tools/seed-firestore.html` — 管理者 Email/Password 入力欄追加・招待コード投入削除
- `firestore.rules` — v12 仕様に更新（validDemoSession / フィールド allowlist / demo_* Rules）

**Firebase Console 必須作業**（ユーザー手動）
- Authentication > Email/Password プロバイダ ON
- Authentication > 匿名 プロバイダ OFF
- Firestore > `demo_sessions` コレクション・3アカウント分ドキュメント作成
- Firestore > Rules を本バージョンの内容で更新・公開
- Firestore > `invitation_codes` コレクション削除

**バックアップ**
- `backups/v0.1.7/` に v0.1.7 時点のファイルを保存済み

---

## Phase 2-A プラン v12 (2026-05-09) — 🟢 Codex 最終承認版

### 最終承認
- `PHASE_2A_GROUPWARE_PLAN_v12.md` 追加（実装着手承認版）
- Codex 第10回最終レビュー「微修正で承認」を全反映：
  - demo_* create 時 updatedAt/updatedBy/archivedAt/archivedBy 混入禁止
  - Phase 2-D 必須タスク 6件をチケット化（§19 新設）
- Rules Unit Test に T39-T40 追加
- **Codex 10回レビュー完了**

### Codex 最終判定
```
2層分離方針: 承認
Email/Password + demo_sessions: 承認
demo_* collection 方針: 承認
既存業務ロジック非破壊: 承認
Sonnet 実装着手: 🟢 OK
```

---

## Phase 2-A プラン v11 (2026-05-09) — Codex 第9回指摘修正

### 修正
- `PHASE_2A_GROUPWARE_PLAN_v11.md` 追加
- Codex 第9回レビューの5指摘を反映：
  - Q6 と §13.1 の矛盾解消（業務ロジックは触らない・認証コードのみ変更）
  - customer_records delete ALLOW のリスク・期限・緊急対応明記
  - demo_* 通常 update で archived 済みデータ編集禁止
  - create 時 archivedAt/archivedBy 混入禁止
  - 通常 update で archivedAt/archivedBy 改変禁止
- Rules Unit Test に archived ガードテスト 8件追加（T31-T38）

---

## Phase 2-A プラン納品 (2026-05-09) — Opus 担当

### 追加
- `PHASE_2A_GROUPWARE_PLAN_v10.md` — グループウェア追加プラン最終版
- Codex 8回レビュー反映済み・2層分離戦略
- 既存 ordersystem/invoice 非破壊・新規 demo_* 厳格仕様
- Email/Password 認証 + demo_sessions ベース validDemoSession
- 実装フェーズ: v0.1.8（認証移行）→ v0.2.0（グループウェア）→ Phase 2-D（後続・既存改修）
- 役割分担: プラン = Opus / 実装 = Sonnet

---

## v0.1.7 (2026-05-08) — トップページに使い方ガイド導線追加

### 追加
- `index.html` の機能一覧の下に「📖 はじめての方へ — 使い方ガイドを見る」カード追加
- ホバー時の浮き上がりエフェクト・Notionデザイン準拠
- ログイン前のユーザーがガイドにアクセス可能に

---

## v0.1.6 (2026-05-08) — ログアウト機能追加

### 追加
- ナビゲーションバーに「🚪 ログアウト」ボタン追加（ordersystem.html / invoice.html）
- 確認ダイアログ後、sessionStorage クリア + Firebase 匿名認証サインアウト + index.html へリダイレクト
- オレンジ色（#dd5b00）でセマンティック表示

---

## v0.1.5 (2026-05-08) — ナビゲーションバー追加

### 追加
- `ordersystem.html` / `invoice.html` にページ切替ナビバー追加
- ボタン: 顧客管理 / 請求書 / 使い方ガイド
- DEMOバナー直下に固定配置・現在ページがアクティブ表示
- 既存UIには影響なし

---

## v0.1.4 (2026-05-08) — マニュアル追加

### 追加
- `manual-admin.html` — 管理者マニュアル（Notionデザイン準拠・全8セクション）
- `manual-user.html` — デモ利用者ガイド（Notionデザイン準拠・全6セクション）

### マニュアル内容
- 管理者用: デモ概要・招待コード管理・データリセット・緊急停止・ファイル更新・トラブル対応
- 利用者用: ログイン手順・顧客管理・請求書作成・PDF出力・利用規約

---

## v0.1.3 (2026-05-08) — 全ページ匿名認証対応

### 修正
- `ordersystem.html` に Firebase Auth SDK + 匿名認証追加（顧客データ読み込み対応）
- `invoice.html` に Firebase Auth SDK + 匿名認証追加（請求書データ読み込み対応）

---

## v0.1.2 (2026-05-08) — ログイン認証エラー修正

### 修正
- `index.html` に Firebase Auth SDK 追加（firebase-auth.js）
- `startDemo()` に匿名認証（signInAnonymously）を追加
- 招待コード使用回数の更新（Firestore write）が認証エラーで失敗していた問題を修正

---

## v0.1.1 (2026-05-08) — シードデータ投入完了

### 修正
- `tools/seed-firestore.html` に Firebase Anonymous Auth を追加（匿名認証後にFirestore書き込み）
- `firestore.rules` を isAuthed() + hasIsDemo() パターンに簡略化
- Firebase Console: 匿名認証プロバイダ有効化・Firestoreルール更新

### 投入データ確認済み
- 招待コード 3件（SAKURA-DEMO-2026 / SAKURA-OEM-001 / SAKURA-AGENT-001）
- 架空顧客データ 5件
- 架空請求書データ 4件

---

## v0.1.0 (2026-05-08) — 初回構築

### Phase A: 準備
- 本番環境バックアップ取得（SAKURA-PORTAL / 請求書）
- デモ用 Firebase プロジェクト `sakura-demo-2026` 新規作成
- Firestore・Authentication 有効化
- `firebase-config.demo.js` 作成（gitignore済み）

### Phase B: 基盤
- サブドメイン `demo.sakuranet-co.jp` 設定（WEB公開フォルダ: `~/www/demo/`）
- GitHub リポジトリ `SAKURA-SYSTEM-DEMO`（Private）作成・初回 push

### Phase C: ガード・検出スクリプト
- `scripts/check-no-prod-config.js` — 本番設定リーク検出
- `scripts/detect-pii.js` — 個人情報検出
- `scripts/preflight.js` — 起動時 projectId 強制確認
- `.gitleaks.toml` — git シークレットスキャン設定
- `tests/firebase-rules.test.js` — Firebase Rules ユニットテスト
- `tests/no-prod-network.spec.js` — 本番通信ゼロ検証

### Phase C.5: ローカル安全設定
- Firebase Emulator Suite 設定（Firestore:8080 / Auth:9099 / UI:4000）
- `.firebaserc` プロジェクトエイリアス設定

### Phase D: コード実装
- `ordersystem.html` — デモ Firebase・isDemo:true・DEMOバナー
- `invoice.html` — DEMOバナー・isDemo:true・PDF透かし
- `config.js` — デモ専用 Firebase 設定ブリッジ
- 全APIキーを git から除去（`firebase-config.demo.js` 分離）

### Phase E: シードデータ
- `seed-data/customers.json` — 架空顧客5件（PII検出ゼロ確認済み）
- `seed-data/invoices.json` — 架空請求書4件

### Phase F: UX
- `index.html` — 招待コード認証・利用規約同意・デモ開始フロー
- Driver.js チュートリアル（使い方ガイド・初回自動起動）
- `seed-data/invitation_codes.json` — 招待コード3種

### Phase G: 自動リセット・監視
- `functions/index.js` — Cloud Functions（日次リセット・緊急停止・手動リセット）
- 緊急停止スイッチ（Firestore: `demo_config/emergency_stop`）
- 毎朝3時 JST に自動リセット・シードデータ再投入

---

## セキュリティ対策サマリー

| 対策 | 実装状態 |
|------|---------|
| Firebase 完全分離（別プロジェクト） | ✅ |
| サブドメイン分離 | ✅ |
| 起動時 projectId 強制チェック | ✅ |
| 本番設定リーク検出スクリプト | ✅ |
| isDemo フラグ全書き込み付与 | ✅ |
| 招待制アクセス | ✅ |
| PII 検出スクリプト | ✅ |
| PDF DEMO透かし | ✅ |
| 本番通信ゼロ検証（Playwright） | ✅ |
| Firebase Rules（isDemo必須） | ✅ |
| 日次自動リセット | ✅（Functions要デプロイ） |
| 緊急停止スイッチ | ✅ |
| git API キー除外 | ✅ |

---

## デプロイ手順（WinSCP）

サーバーパス: `/home/sakura-nets/www/demo/`

アップロード必須ファイル：
1. `index.html`
2. `ordersystem.html`
3. `invoice.html`
4. `config.js`
5. `firebase-config.demo.js` ← **gitignoreのため手動アップロード必須**

Cloud Functions デプロイ：
```
firebase use demo
firebase deploy --only functions
```
