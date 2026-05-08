# SAKURA SYSTEM デモ環境 リリースノート

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
