# SAKURA SYSTEM デモ環境 Phase 2-B 実装プラン v5
## 「SAKURA OS デモ版追加」確認書 v5 — Codex 第4回レビュー反映版・実装前ゲート承認

**作成日**: 2026-05-10
**作成者**: Claude (Opus 4.7) — プランニング担当
**対象**: SAKURA-SYSTEM-DEMO **v0.2.0 → v0.3.0**
**ステータス**: 🟢 **実装前ゲート承認・Sonnet 実装着手可能**（Codex 第4回 承認 + ユーザー Q1-Q9 回答待ち）
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当
**前提**: Phase 2-A（v0.2.0 グループウェア）デプロイ完了済み
**改訂理由**: Codex 第4回レビューの微修正 1 点（`referrerpolicy="same-origin"` → `no-referrer`）を v5 に反映（v1〜v4 は残置・本書は新規ファイル）

---

## 0. レビュー観点サマリー（Codex 向け）

v5 は Codex 第4回レビュー（v4 承認）で示された微修正 1 点（`referrerpolicy="same-origin"` → `no-referrer`）を反映した **実装前ゲート承認版**。Codex 第4回最終OK条件 15 項目すべて充足を §17.4 で確認済。

### 0.1 Codex 第1回レビュー反映状況サマリー（v1→v2・継続維持）

| # | Codex 第1回 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | iframe sandbox 設計の危険性（同一オリジンでの矛盾） | §3.4 / §10.3 | ✅ 修正済（v2） |
| 2 | ニュース取得プロキシ未定義（本番流用リスク） | §5.8 | ✅ 固定ダミー方式（v2） |
| 3 | 既存4ファイル変更表現の修正（業務ロジック非変更明記） | §8 | ✅ 修正済（v2） |
| 4 | SAKURA AI 削除判断の補強（将来復帰導線） | §4.4 | ✅ 二択化（v2）→ v3 で B案固定 |
| 5 | 新規 Firestore コレクション不要の補強（localStorage key prefix） | §6.5 | ✅ 修正済（v2） |
| 6 | localStorage 壁紙保存の厳格化（base64 禁止・プリセットID のみ） | §5.6 / §6.5 | ✅ 修正済（v2） |
| 7 | 外部APIの扱い厳格化（CSP・allowlist 検査） | §5.7 / §10.8 | ✅ 修正済（v2） |

### 0.2 Codex 第2回レビュー反映状況サマリー（v2→v3・継続維持）

| # | Codex 第2回 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | SAKURA AI は二択をやめ B 案固定 | §4.4 / §2.1 / §18 Q2 | ✅ B案確定・A案廃案 |
| 2 | iframe URL allowlist の具体値を明記（4件存在確認済） | §3.4 / §10.3 | ✅ 4件確定・NGリスト明記 |
| 3 | sandbox は主防御ではなく補助と明記 | §3.4.3 / §3.4.6 | ✅ 主防御 = allowlist + 通信ゼロ + CSP |
| 4 | CSP connect-src の具体値を明記 | §5.7.1 | ✅ ニュース外部ドメイン除外・最終確定 |
| 5 | localStorage key の具体一覧を確定 | §6.5.2 | ✅ key 名統一 |
| 6 | DEMO バナー追加対象の明記 | §8 / §10.4 | ✅ sakura-os.html のみ |
| 7 | Playwright 通信 allowlist 条件を具体化 | §10.8 | ✅ ALLOWED_HOSTS 統合方式・T-OS-14 追加 |
| 8 | SAKURA AI 関連通信ゼロを Playwright で明示検査 | §10.8 | ✅ T-OS-15 新規追加 |

### 0.3 Codex 第3回レビュー反映状況サマリー（v3→v4・本改訂）

| # | Codex 第3回 指摘（具体値の明示提示） | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | iframe allowlist 4件の実コード/擬似コード提示（NG/OK 対比付き） | §3.4.2 / §3.4.4 | ✅ JS コードブロック + NG例コード提示 |
| 2 | sandbox 最終値を Codex 推奨「最小限版」に変更（基本3属性 + 拡張属性切り分け） | §3.4.3 | ✅ 基本値 / 拡張値を分離・Q4 で判断要請 |
| 3 | CSP connect-src 具体値（実装時最小化方針付き） | §5.7.1 | ✅ 暫定値提示 + 観測フェーズで最小化 |
| 4 | localStorage 5 必須 + 拡張 split | §6.5.2 | ✅ コア5件 / 拡張3件を明確に分離 |
| 5 | ALLOWED_HOSTS + NG_PATTERNS 両方提示・Playwright 完全コード | §10.8 | ✅ 両配列を JS で提示・T-OS-14/15 完全コード |
| 6 | T-OS-14 / T-OS-15 検査条件明記 + Playwright 完全コード | §10.8.4 / §10.8.5 | ✅ 完全な spec ファイルとして提示 |

### 0.4 Codex 第4回レビュー反映状況サマリー（v4→v5・本改訂・最終）

| # | Codex 第4回 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | iframe allowlist 4件確定 — 承認 | §3.4.2 / §3.4.4 | ✅ 承認継続 |
| 2 | sandbox 基本値 `allow-scripts allow-same-origin allow-forms` — 承認 | §3.4.3 | ✅ 承認継続 |
| 3 | **微修正候補: `referrerpolicy="same-origin"` → `no-referrer`** | §3.4.3 / §3.4.4 | ✅ **v5 で `no-referrer` に変更** |
| 4 | 最終OK条件 15 項目すべて充足 | §17.4 | ✅ 15/15 全条件充足 |

> **referrerpolicy 変更根拠**: Codex 第4回推奨「既存ページが referrer に依存していないことを確認後、`no-referrer` を推奨」に従い、SAKURA OS の iframe は自オリジン内のみ・同一オリジン Firestore のみ・referrer 依存ゼロを確認したため `no-referrer` を採用。より安全側の防御層。

---

## 1. 目的・背景

### 1.1 目的

デモ環境（demo.sakuranet-co.jp）に **SAKURA OS（OS 風ランチャー）** を追加し、
OEM・代理店候補者に「フルスタック UI 体験」を提供する。

### 1.2 背景

| 項目 | 状況 |
|------|------|
| Phase 1 | デモ環境基盤（v0.1.x）完成・本番分離済み |
| Phase 2-A | グループウェア追加（v0.2.0）デプロイ済み |
| Phase 2-B | **本書: SAKURA OS デモ版追加**（v0.3.0） |
| Phase 2-B.1 | ニュース proxy 検討・付箋メモ等 |
| Phase 2-C 以降 | 別プラン |
| Phase 2-D | 既存業務ロジック改修（customer_records 物理 delete 撤廃等） |
| Phase 2-E | SAKURA AI デモ化（B 案無効タイルからの復帰先） |

### 1.3 鉄則の継承（Phase 2-A から）

- ✅ 本番（sakuranet-co.jp）と**完全分離**（別 Firebase プロジェクト）
- ✅ 既存業務ロジック**非破壊**
- ✅ Email/Password + `demo_sessions` 認証（v0.1.8 以来）
- ✅ 全新規コレクションは `demo_*` プレフィックス（本 Phase では新規コレクション**なし**）
- ✅ クリーンルーム実装（本番コードを参照するが**コピーしない**）
- ✅ **本番 PHP API（gw_api.php / get_wallpapers.php / sakura-ai 配下）一切呼ばない**
- ✅ **localStorage キーは `sakura_demo_os_` prefix 統一**
- ✅ **iframe URL allowlist + 通信ゼロ Playwright 検査**（**主防御**）
- ✅ **sandbox は補助的役割**（主防御ではない）

---

## 2. 本番との差分一覧（何を使う・何を削る・何を置き換える）

### 2.1 機能差分マトリクス（v3 と同等・SAKURA AI は B案固定継続）

| # | 機能 | 本番 SAKURA OS | デモ版 SAKURA OS | 判定 |
|---|------|---------------|----------------|:---:|
| 1 | 認証 | `gw_api.php?module=user`（PHP API） | `signInWithEmailAndPassword` + `demo_sessions` | 🔄 置換 |
| 2 | Firestore（本番 DB） | `sakura-net-db` プロジェクト直結 | `firebase-config.demo.js`（デモ専用） | 🔄 置換 |
| 3 | カレンダーデータソース | `customer_records`（顧客作業日） | `demo_calendar_events`（read only） | 🔄 置換 |
| 4 | タスクデータソース | `customer_records.dateWork` フィルタ | `demo_todos`（read only） | 🔄 置換 |
| 5 | 顧客管理アプリ起動 URL | `/system/ordersystem.html` | `ordersystem.html`（同ディレクトリ相対） | 🔄 置換 |
| 6 | 申込み管理 | `sakuranethikari.html` | **削除**（デモに該当ファイルなし） | ❌ 削除 |
| 7 | 利用明細 | `usagelog.html` | **削除** | ❌ 削除 |
| 8 | 通話明細 | `calllog.html` | **削除** | ❌ 削除 |
| 9 | **SAKURA AI（左パネルアイコン）** | あり | **B案固定: 準備中無効タイル**（クリックでモーダルのみ） | 🔵 無効化 |
| 10 | SAKURA AI パネル（右側 iframe） | あり | **削除**（DOM 上もネットワーク上も無接続） | ❌ 削除 |
| 11 | SAKURA MUSIC | `sakuramusic/music.html` | **削除** | ❌ 削除 |
| 12 | グループウェア | `groupware.html` | `groupware.html`（v0.2.0 で追加済み） | ✅ 流用 |
| 13 | 請求書 | `invoice/invoice.html` | `invoice.html`（同ディレクトリ） | ✅ 流用 |
| 14 | 時計（日本時間・干支・元号） | あり | あり（同ロジック・コピー不可・再実装） | ✅ 再実装 |
| 15 | 天気（Open-Meteo / 大阪） | 外部 API 直叩き | 同上（API キー不要・CORS OK・CSP 許可） | ✅ そのまま |
| 16 | **ニュース** | Yahoo RSS + プロキシ | **v0.3.0 では固定ダミー配列（§5.8）** | 🔄 簡略化 |
| 17 | 為替（open.er-api.com） | 外部 API | 同上（CSP 許可） | ✅ そのまま |
| 18 | 壁紙（プリセット 9 種） | あり | あり（CSS グラデのみ・本番と同等） | ✅ 流用 |
| 19 | 壁紙アップロード | IndexedDB 保存 | **v0.3.0 では削除**（§5.6・§6.5） | ❌ 削除 |
| 20 | 壁紙カスタムURL入力 | あり | **v0.3.0 では削除**（Codex 推奨・Q6） | ❌ 削除 |
| 21 | サーバー壁紙取得 | `/system/sakura-ai/get_wallpapers.php` | **削除**（PHP API 厳禁） | ❌ 削除 |
| 22 | スライドショー | あり（IndexedDB） | **v0.3.0 ではプリセット切替のみ**（base64 保存禁止） | 🔄 簡略化 |
| 23 | マスコット動画 | `/system/sakura-ai/assets/*.mp4` | **削除**（SAKURA AI ごと撤去） | ❌ 削除 |
| 24 | 付箋メモ（IndexedDB） | あり | **v0.3.0 では削除**（Phase 2-B.1 で検討） | ❌ 削除 |
| 25 | iframe アプリウィンドウ | 同一ドメイン | **同一ドメイン + URL allowlist 4件のみ**（§3.4） | ✅ 強化 |
| 26 | タスクバー | あり | あり | ✅ 流用 |
| 27 | テーマ切替（dark/light） | あり | あり（localStorage `sakura_demo_os_theme`） | ✅ 流用 |
| 28 | DEMO バナー | なし | **sakura-os.html にのみ追加**（既存4ページは設置済・変更なし） | ➕ 追加（OS のみ） |
| 29 | ログアウト | `index.php?logout=1` | `firebase.auth().signOut()` → `index.html` | 🔄 置換 |

### 2.2 集計（v4・v3 と同じ）

| 区分 | 件数 |
|------|:---:|
| ✅ そのまま流用 | 7 |
| ✅ 構造参考・再実装（クリーンルーム） | 4 |
| 🔄 置換（API/URL 差し替え） | 8 |
| 🔄 簡略化（v0.3.0 で機能縮小） | 2 |
| ❌ 削除 | 7 |
| 🔵 無効化（B案準備中タイル） | 1（SAKURA AI） |
| ➕ 新規追加 | 1（DEMO バナー・OS のみ） |

---

## 3. 認証フロー

### 3.1 本番からの置換（gw_api.php → Firebase demo_sessions）

```
【本番】
sakura-os.html
  → fetch('gw_api.php?module=user', { action:'me' })
  → ユーザー名取得 or index.php へ転送

【デモ版】
sakura-os.html
  → firebase.initializeApp(DEMO_FIREBASE_CONFIG)
  → firebase.auth().onAuthStateChanged(user => ...)
      ├─ user == null:
      │     → location.href = 'index.html'
      │
      └─ user != null:
            → db.collection('demo_sessions').doc(user.uid).get()
            → snap.data() の検証:
                ・exists == true
                ・active == true
                ・disabled != true
                ・expiresAt > now
                ・email == user.email
              ├─ NG:
              │     → firebase.auth().signOut()
              │     → location.href = 'index.html'
              │
              └─ OK:
                    → currentUser = user.email
                    → emergencyStopCheck()
                    → init()  // OS 起動
```

### 3.2 緊急停止チェック（既存 4 ページと同一）

```javascript
db.collection('demo_config').doc('emergency_stop').get().then(snap => {
  if (snap.exists && snap.data().enabled) {
    const reason = snap.data().reason || 'メンテナンス中です。';
    document.body.innerHTML = `<div ...>⛔ デモ環境停止中</div><p>${reason}</p>`;
  }
}).catch(() => {});
```

### 3.3 ログアウト動作

```javascript
function doLogout() {
  if (!confirm('ログアウトしますか？')) return;
  // OS 設定の保持/削除方針 → §6.5 参照（既定: テーマ・壁紙ID は保持、起動済アプリ状態は削除）
  firebase.auth().signOut()
    .then(() => location.href = 'index.html')
    .catch(() => location.href = 'index.html');
}
```

---

### 3.4 iframe URL allowlist 設計（Codex 第3回 指摘1/2 対応・実コード明示提示）

#### 3.4.1 背景の整理（多層防御の位置付け）

**Codex 第1回**:
- 同一オリジン iframe で sandbox を厳しくすると Firebase Auth・localStorage が壊れる可能性
- 逆に `allow-scripts allow-same-origin` を緩く付けると sandbox の防御効果が弱くなる
- → 「sandbox を無理に付けて壊すより、URL allowlist + 本番通信ゼロ検査を優先」

**Codex 第2回**:
- → **「sandbox は主防御ではなく補助」と明確に位置付ける**
- → **主防御は URL allowlist + 本番通信ゼロ検査 + CSP の 3 重多層防御**

**Codex 第3回（指摘1）**:
- iframe allowlist の **実コード/擬似コード** を明示的に提示せよ
- 「任意 URL を受け取らない」「query parameter で src 指定しない」「`/system/...` 禁止」を **コード上で示せ**
- `appId → 固定パスの map` 構造を採用、`location.origin` で origin 確認すること

#### 3.4.2 iframe 許可 URL 一覧（厳格固定 = allowlist・4 件・存在確認済）

| # | id（appId） | URL（相対パス） | 用途 | 存在確認 |
|:-:|---|---|---|:-:|
| 1 | `customer` | `ordersystem.html` | 顧客管理アプリ | ✅ 存在確認済 |
| 2 | `invoice` | `invoice.html` | 請求書アプリ | ✅ 存在確認済 |
| 3 | `groupware` | `groupware.html` | グループウェアアプリ | ✅ 存在確認済 |
| 4 | `manual` | `manual-user.html` | 使い方ガイド | ✅ 存在確認済 |

> **存在確認ステータス（v3 引継）**:
> - `manual-user.html` 存在 ✅
> - `manual-admin.html` 存在 ✅（allowlist 対象外・別経路）
> - 全 4 件のファイル存在を Sonnet 実装着手前に再確認すること

#### 3.4.3 sandbox 属性の最終値（Codex 第3回 指摘2 対応・基本値 / 拡張値を分離）

> **重要**: sandbox は **主防御ではなく補助** である。
> **主防御**: ① URL allowlist（§3.4.2）／② 本番通信ゼロ Playwright 検査（§10.8）／③ CSP（§5.7）の 3 重多層防御。
> sandbox は「ユーザー入力 URL を誤って iframe に流し込んだ場合の最終フェイルセーフ」「誤遷移防止補助」という位置付け。

**Codex 第3回推奨：基本値（最小限版・v4 デフォルト採用）**

```html
<!-- v4 デフォルト：Codex 推奨「最小限版」 -->
<iframe
  src="ordersystem.html"
  sandbox="allow-scripts allow-same-origin allow-forms"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

| 属性 | 必要理由 |
|------|---------|
| `allow-scripts` | アプリ JS 実行（必須） |
| `allow-same-origin` | Firebase Auth state 維持・localStorage 共有（同一オリジン） |
| `allow-forms` | 顧客登録・請求書作成等のフォーム送信 |

> **Codex 注釈**: `allow-same-origin` + `allow-scripts` の組合せは sandbox の防御効果を弱めるが、**主防御が allowlist + 通信ゼロ検査 + CSP** であるため許容。sandbox は補助的な役割。

**業務必要時に追加検討（実機検証必須）**

実機検証で **必要が確認できた場合のみ** 最小限追加する：

| 拡張属性 | 想定用途 | 実機検証要否 |
|---------|---------|:---:|
| `allow-popups` | 請求書 PDF プレビューを別タブで開く | ⚠️ 必須 |
| `allow-downloads` | 請求書 PDF DL（顧客送付用） | ⚠️ 必須 |
| `allow-modals` | confirm/alert ダイアログ（顧客削除確認等） | ⚠️ 必須 |

> **追加判断のフロー（Sonnet 実装時）**:
> 1. まず基本値 `sandbox="allow-scripts allow-same-origin allow-forms"` で実装
> 2. 各アプリ（顧客管理・請求書・グループウェア・マニュアル）で手動 E2E 実施
> 3. 機能が壊れた箇所を特定（例: 請求書 PDF DL が動かない）
> 4. 必要最小限の属性のみ追加（例: `allow-downloads` のみ追加 → `allow-scripts allow-same-origin allow-forms allow-downloads`）
> 5. 全属性を一括で追加するのは **禁止**（最終フェイルセーフを弱めるため）

**v3 値との比較表**

| 候補 | sandbox 値 | v4 採用判断 |
|------|---|:---:|
| **v4 基本値（Codex 推奨・採用）** | **`allow-scripts allow-same-origin allow-forms`** | ✅ **採用（デフォルト）** |
| v4 拡張候補 1 | `allow-scripts allow-same-origin allow-forms allow-downloads` | 🟡 実機検証で PDF DL が必要なら追加 |
| v4 拡張候補 2 | `allow-scripts allow-same-origin allow-forms allow-modals` | 🟡 実機検証で confirm が必要なら追加 |
| v4 拡張候補 3 | `allow-scripts allow-same-origin allow-forms allow-popups` | 🟡 実機検証でポップアップが必要なら追加 |
| v3 値（参考） | `allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads` | ❌ **不採用**（一括追加で sandbox 効果さらに弱化） |
| v2 値（参考） | `allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox` | ❌ 不採用（escape-sandbox は不要） |

> **v3 → v4 変更点**: Codex 第3回の「最小限版が望ましい」推奨に従い、**基本値を `allow-scripts allow-same-origin allow-forms` の3属性のみ** にダウングレード。拡張属性は実機検証で個別に追加判断。
> **Q4（§18）でユーザー判断要請**: 「基本3属性で実装着手し、実機検証で必要分だけ追加」を採用するか確認。

#### 3.4.4 openApp() 実装方針（Codex 第3回 指摘1 対応・OK/NG コード対比）

##### ✅ OK 例（v4 採用・Codex 推奨に完全準拠）

```javascript
// ============================================
// ✅ OK: v4 採用実装 — appId → 固定パス map 方式
// ============================================

// 固定パス map（外部入力で書き換え不可・const 凍結）
const APP_ALLOWLIST = Object.freeze({
  customer:  Object.freeze({ url: 'ordersystem.html', title: '顧客管理',     icon: '📋', size: [1200, 720] }),
  invoice:   Object.freeze({ url: 'invoice.html',     title: '請求書',       icon: '🧾', size: [1200, 760] }),
  groupware: Object.freeze({ url: 'groupware.html',   title: 'グループウェア', icon: '🏢', size: [1400, 820] }),
  manual:    Object.freeze({ url: 'manual-user.html', title: '使い方ガイド',  icon: '📖', size: [900,  640] })
});

/**
 * appId のみを受け取り、allowlist から相対パスを取得して iframe を生成する。
 * 任意 URL 文字列は一切受け取らない。
 *
 * @param {string} appId - APP_ALLOWLIST のキー（'customer' | 'invoice' | 'groupware' | 'manual'）
 */
function openApp(appId) {
  // ① appId が許可済みキー以外なら無視（任意キー注入不可）
  const app = APP_ALLOWLIST[appId];
  if (!app) {
    console.warn('[SAKURA OS] Unknown appId rejected:', appId);
    return;
  }

  // ② allowlist の URL を相対パスとして new URL() で正規化
  //    → 親ページの origin と組み合わせて絶対 URL 化される
  const resolved = new URL(app.url, location.href);

  // ③ origin が自オリジンであることを再検証（多重防御）
  if (resolved.origin !== location.origin) {
    console.error('[SAKURA OS] Cross-origin rejected:', resolved.origin);
    return;
  }

  // ④ iframe を生成し、src には正規化済み絶対 URL を設定
  const iframe = document.createElement('iframe');
  iframe.src = resolved.href;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-forms'; // §3.4.3 基本値
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer';

  createWindow(appId, app, iframe);
}
```

##### ❌ NG 例（v4 で **絶対に書いてはいけない** コード集・Codex 厳命）

```javascript
// ============================================
// ❌ NG-1: 任意 URL を受け取って iframe.src に代入
// ============================================
function openAppBAD_1(url) {
  const iframe = document.createElement('iframe');
  iframe.src = url;  // ❌ 任意 URL を受け取っている
  document.body.appendChild(iframe);
}
// 攻撃例: openAppBAD_1('https://sakuranet-co.jp/system/sakura-os.html')

// ============================================
// ❌ NG-2: query parameter で src 指定
// ============================================
function openAppBAD_2() {
  const params = new URLSearchParams(location.search);
  const src = params.get('app');  // ❌ URL クエリから iframe src 取得
  const iframe = document.createElement('iframe');
  iframe.src = src;
  document.body.appendChild(iframe);
}
// 攻撃例: ?app=https://evil.example.com → iframe で外部読み込み

// ============================================
// ❌ NG-3: 本番ドメイン absolute URL
// ============================================
const APP_ALLOWLIST_BAD_3 = {
  customer: { url: 'https://sakuranet-co.jp/system/ordersystem.html' }  // ❌ 本番直接参照
};

// ============================================
// ❌ NG-4: /system/ 配下を相対パスで指定
// ============================================
const APP_ALLOWLIST_BAD_4 = {
  customer: { url: '/system/ordersystem.html' }  // ❌ 本番パスへの絶対パス
};

// ============================================
// ❌ NG-5: sakura-ai/ への参照
// ============================================
const APP_ALLOWLIST_BAD_5 = {
  ai: { url: 'sakura-ai/' }  // ❌ SAKURA AI 配下を allowlist に含める
};

// ============================================
// ❌ NG-6: PHP API への参照
// ============================================
const APP_ALLOWLIST_BAD_6 = {
  api: { url: 'gw_api.php' },              // ❌ 本番 PHP API
  wp:  { url: 'get_wallpapers.php' }       // ❌ 壁紙 PHP API
};

// ============================================
// ❌ NG-7: 文字列連結で URL 構築（テンプレート注入リスク）
// ============================================
function openAppBAD_7(name) {
  const iframe = document.createElement('iframe');
  iframe.src = `${name}.html`;  // ❌ name に '../system/admin' 等が入りうる
  document.body.appendChild(iframe);
}
```

##### NG / OK 早見表

| パターン | 判定 |
|---------|:---:|
| `iframe.src = userInputUrl` | ❌ NG |
| `iframe.src = location.search からの値` | ❌ NG |
| `iframe.src = 'https://sakuranet-co.jp/...'` | ❌ NG |
| `iframe.src = '/system/...'` | ❌ NG |
| `iframe.src = 'sakura-ai/...'` | ❌ NG |
| `iframe.src = 'gw_api.php'` / `get_wallpapers.php` | ❌ NG |
| `iframe.src = APP_ALLOWLIST[appId].url` | ✅ OK |
| `new URL(app.url, location.href)` で origin 再検証 | ✅ OK |
| `Object.freeze(APP_ALLOWLIST)` で凍結 | ✅ OK |

#### 3.4.5 Firebase Auth が iframe 内で動くかのテスト項目

- [ ] iframe 内で `firebase.auth().currentUser` が null でない（親と共有）
- [ ] iframe 内で `firebase.firestore().collection('demo_*').get()` が成功
- [ ] iframe 内 localStorage が親と同一値を読める（同一オリジン）
- [ ] iframe を最小化→復元しても認証状態維持
- [ ] iframe 内でログアウトすると親も signOut 状態になる（onAuthStateChanged 連動）

#### 3.4.6 多層防御まとめ（v4 確認・継続維持）

```
主防御（3 重）
├── ① URL allowlist        → APP_ALLOWLIST 4 件のみ・任意 URL 不可（§3.4.2 / §3.4.4）
├── ② 通信ゼロ Playwright  → ALLOWED_HOSTS + NG_PATTERNS 二重防御で fail（§10.8）
└── ③ CSP                  → connect-src / frame-src で許可先限定（§5.7）

補助防御
└── ④ sandbox              → 誤遷移防止・最終フェイルセーフ（§3.4.3 基本3属性）
```

---

## 4. アプリ一覧（SAKURA AI は B案固定継続）

### 4.1 デモ版アプリ一覧（左パネル「アプリケーション」グリッド）

| # | id | 表示名 | アイコン | URL | サイズ | 状態 |
|:-:|---|---|:-:|---|---|:-:|
| 1 | `customer` | 顧客管理 | 📋 | `ordersystem.html` | 1200×720 | ✅ 有効 |
| 2 | `invoice` | 請求書 | 🧾 | `invoice.html` | 1200×760 | ✅ 有効 |
| 3 | `groupware` | グループウェア | 🏢 | `groupware.html` | 1400×820 | ✅ 有効 |
| 4 | `manual` | 使い方ガイド | 📖 | `manual-user.html` | 900×640 | ✅ 有効 |
| 5 | `ai` | SAKURA AI | 🤖 | — | — | 🚫 **準備中（B案・無効・モーダルのみ）** |

### 4.2 本番から削除するアプリ（v3 と同じ）

| 削除アプリ | 削除根拠 |
|------------|---------|
| 申込み管理（hikari） | デモ環境にファイル不存在・ビジネス判断（OEM 体験対象外） |
| 利用明細（usage） | 同上・PII リスクあり |
| 通話明細（call） | 同上・通信明細データはデモ価値が低い |
| SAKURA MUSIC | エンタメ機能・OEM 体験で混乱を招く |
| **SAKURA AI（本体機能）** | **§4.3 / §4.4 の方針で B 案無効タイル化（本体機能としては削除）** |

### 4.3 SAKURA AI 削除判断（重要設計ポイント・v3 から継続）

#### 削除妥当性（Codex 第1回で OK 判定された 4 理由）

1. **Codex Relay / App Server / Cloudflare Tunnel 依存**
   - 本番 SAKURA AI は Codex Relay + App Server + Cloudflare Tunnel を介して動作
   - これらをデモ環境に持ち込むのは現実的でない（サーバー常駐系は OEM 不向き）

2. **本番 Firestore 通信リスク**
   - SAKURA AI は本番 `sakura-net-db` を参照する設計
   - デモから iframe で読み込むと**本番への通信が発生する可能性**
   - Phase 1 の「本番通信ゼロ検証（Playwright）」に違反する

3. **ローカル PC 常駐系は OEM 不向き**
   - Ollama / qwen3:8b 等のモデルはユーザー PC でのセットアップ前提
   - OEM・代理店向けデモ環境には適合しない

4. **SAKURA OS の目的外**
   - SAKURA OS は「ランチャー」が本旨
   - AI 統合は将来 Phase 2-E で別途デモ化を検討

---

### 4.4 SAKURA AI の v0.3.0 採用方式 — **B案固定（v3 から継続・v4 維持）**

#### 4.4.1 結論

> **v3 で B 案「準備中無効タイル」に固定済。v4 でも継続維持。A 案（完全削除）は廃案。**

#### 4.4.2 B 案採用理由（v3 と同じ）

| 観点 | 内容 |
|------|------|
| OEM 訴求 | 「本番には SAKURA AI もある」ことを OEM 候補者に視覚的に示せる |
| 通信安全性 | relay / iframe / 外部通信ゼロ・本番 Firestore 接続なし |
| Phase 2-E 復帰 | タイル UI が既に存在するため、将来 AI デモ復帰時に最小コスト |
| 営業デモ自然さ | 「動かしてみたら Coming Soon」は OEM 営業の常套・違和感低 |
| 実装重量 | タイル + モーダルのみ（約 30 行・Sonnet で 0.3h） |

#### 4.4.3 B 案実装条件（厳守・v3 から継続）

- ✅ 左パネル「アプリケーション」グリッドに `🤖 SAKURA AI` タイルを表示（disabled クラス・グレーアウト）
- ✅ クリックしても **iframe を開かない**
- ✅ クリックしても **`sakura-ai` 配下へ通信しない**（`/system/sakura-ai/`・`*.sakura-ai.*` 全て）
- ✅ クリックしても **`codex-relay` へ通信しない**
- ✅ クリックすると「**SAKURA AI はデモ版では準備中です。本番環境でご体験ください。**」とモーダル表示するだけ
- ✅ モーダル閉じて終了（その後何も起きない）
- ✅ 右側 AI パネル（本番にあるもの）は **DOM ごと存在しない**
- ✅ マスコット動画も **DOM ごと存在しない**
- ✅ Playwright で **SAKURA AI 関連通信ゼロ**を検査（§10.8 T-OS-15）

#### 4.4.4 B 案実装イメージ

```html
<div class="app-tile app-tile-disabled" id="app-tile-ai" onclick="showAiPlaceholder()">
  <div class="app-icon">🤖</div>
  <div class="app-name">SAKURA AI</div>
  <div class="app-status">準備中</div>
</div>
```

```javascript
function showAiPlaceholder() {
  // iframe を開かない・relay/sakura-ai/codex-relay へ通信しない
  // Notion 風モーダル（DESIGN.md 準拠）を表示
  showModal({
    title: 'SAKURA AI（準備中）',
    body:  'SAKURA AI はデモ版では準備中です。本番環境でご体験ください。',
    actions: [{ label: '閉じる', primary: true, onClick: closeModal }]
  });
  // ↑ alert ではなくカスタムモーダル（T-OS-15 で text=「デモ版では準備中」を検査）
}
```

```css
.app-tile-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  position: relative;
}
.app-tile-disabled .app-status {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  background: rgba(221, 91, 0, 0.12);  /* Notion warn orange */
  color: #dd5b00;
  padding: 2px 6px;
  border-radius: 4px;
}
```

---

## 5. Firestore 連携方針

### 5.1 結論: **既存 demo_* コレクションを read のみで使用**（新規コレクション不要）

### 5.2 連携詳細

| OS 機能 | 使用コレクション | 操作 | 備考 |
|---------|----------------|:---:|------|
| デスクトップカレンダー | `demo_calendar_events` | read | startAt フィールドで日付絞込 |
| 本日のタスク | `demo_todos` | read | done==false でフィルタ |
| 申込み管理シミュ | （なし） | — | 機能ごと削除 |
| 通話明細シミュ | （なし） | — | 機能ごと削除 |

### 5.3 read 専用設計の理由

- SAKURA OS は**ランチャー**であり、データ書き込み機能を持つアプリは iframe 内で別途完結する
- グループウェア（`groupware.html`）が demo_* への write を担う
- SAKURA OS 自体が demo_* に write しないため、Rules 変更不要

### 5.4 customer_records は使わない

本番 SAKURA OS は `customer_records` を `dateWork` でフィルタしてカレンダー表示するが、デモ版では：

- ❌ `customer_records` は OS から参照しない（顧客管理アプリ内で完結）
- ✅ デモ版カレンダーは `demo_calendar_events` を使う（グループウェアと一貫）
- 理由: customer_records は Phase 2-D で改修対象（snake/camel 統一・物理 delete 廃止予定）。OS が read 依存すると改修時に巻き込まれる。

### 5.5 onSnapshot 採用（リアルタイム反映）

```javascript
// デスクトップカレンダー
db.collection('demo_calendar_events')
  .where('archived', '==', false)
  .onSnapshot(snap => {
    calendarEvents = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderDesktopCalendar();
  });

// 本日のタスク
db.collection('demo_todos')
  .where('archived', '==', false)
  .where('done', '==', false)
  .onSnapshot(snap => {
    todoList = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderTodayTasks();
  });
```

### 5.6 unsubscribe（メモリリーク防止）+ 壁紙保存方針

```javascript
window.addEventListener('beforeunload', () => {
  unsubCalendar?.();
  unsubTodos?.();
}, { once: true });
```

#### 壁紙保存ルール（厳格化・v3 から継続）

- ❌ `localStorage.setItem('wallpaper', '<base64-image>')` は**禁止**（容量逼迫・パフォーマンス劣化）
- ❌ ユーザー画像アップロード機能は**実装しない**
- ❌ カスタム URL 入力欄も**実装しない**（Codex 推奨に従う）
- ✅ プリセット 9 種から 1 つ選んで **ID のみ保存**
  - 例: `localStorage.setItem('sakura_demo_os_wallpaper_id', 'gradient_3')`
- ✅ スライドショーもプリセット ID 配列のみ（ただし v4 では拡張扱い・§6.5.2 参照）

---

### 5.7 外部 API CSP 設計（Codex 第3回 指摘3 対応・実装時最小化方針付き）

#### 5.7.1 connect-src CSP 暫定値（v4 提示・実装時 Playwright 観測で最小化）

**v4 提示の暫定 CSP（実装着手時の初期値）**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src  'self' 'unsafe-inline' https://www.gstatic.com;
  style-src   'self' 'unsafe-inline';
  img-src     'self' data:;
  connect-src 'self'
              https://*.googleapis.com
              https://*.firebaseio.com
              https://firestore.googleapis.com
              https://identitytoolkit.googleapis.com
              https://securetoken.googleapis.com
              https://api.open-meteo.com
              https://open.er-api.com;
  frame-src   'self';
  font-src    'self' data:;
  object-src  'none';
  base-uri    'self';
  form-action 'self';
">
```

**connect-src 許可ホスト一覧（OK 表）**

| 許可ホスト | 用途 | 残す根拠 |
|--------|------|---|
| `'self'` | 同一オリジン（demo.sakuranet-co.jp） | 自オリジン Firestore SDK + 自前リソース |
| `https://www.gstatic.com` | Firebase JS SDK CDN | script-src 用（connect は SDK 内部で使用） |
| `https://*.googleapis.com` | Firebase / Firestore / Auth ベース | 暫定広めに許可 → 実装時最小化 |
| `https://*.firebaseio.com` | Firebase Realtime DB（保険） | 使わない予定だが SDK が叩く可能性 |
| `https://firestore.googleapis.com` | Firestore API | 確実に必要 |
| `https://identitytoolkit.googleapis.com` | Firebase Auth | 確実に必要 |
| `https://securetoken.googleapis.com` | Firebase Auth トークン更新 | 確実に必要 |
| `https://api.open-meteo.com` | 天気 API（無認証） | 確実に必要 |
| `https://open.er-api.com` | 為替 API（無認証） | 確実に必要 |

**connect-src 明示的に許可しない（NG 表・Codex 厳命）**

| 禁止ホスト | 理由 |
|--------|------|
| `https://sakuranet-co.jp` | 本番ドメイン全般 |
| `https://sakuranet-co.jp/system/` | 本番システム配下 |
| `https://sakura-net-db.*` | 本番 Firebase プロジェクト |
| `https://api.rss2json.com` | v0.3.0 ニュース固定ダミー → 不要 |
| `https://corsproxy.io` | 同上 |
| `*.sakura-ai.*` 全て | SAKURA AI 撤去 |
| Ollama / Codex Relay 系 | SAKURA AI バックエンド |
| `gw_api.php` を含む本番 PHP API | 本番 PHP 全般 |
| `get_wallpapers.php` | 本番 PHP API |
| ワイルドカード `*` | Codex 厳命「禁止」 |

> ニュースが固定ダミーなので、外部ニュース系ドメイン（rss2json / corsproxy / Yahoo RSS）は **CSP に含めない**。

##### 実装時最小化方針（Codex 第3回 指摘3 対応）

**Phase 1: 暫定値で動作確認（Sonnet 実装着手）**
1. 上記の暫定 CSP（`*.googleapis.com` ワイルドカード許容）で sakura-os.html を実装
2. 主要 4 アプリ起動 + Firebase Auth + Firestore read を一通り動作

**Phase 2: Playwright で実際に通信した URL を観測（Sonnet 検証フェーズ）**
```javascript
// 観測スクリプト（実装後に一度だけ実行）
const observed = new Set();
page.on('request', req => {
  const u = new URL(req.url());
  if (u.hostname.endsWith('googleapis.com')) observed.add(u.hostname);
});
await page.goto('https://demo.sakuranet-co.jp/sakura-os.html');
// ログイン→4アプリ open→close→logout
console.log('Observed googleapis hosts:', [...observed]);
// 例: ['firestore.googleapis.com', 'identitytoolkit.googleapis.com',
//      'securetoken.googleapis.com', 'firebaseapp.com']
```

**Phase 3: 観測結果で `*.googleapis.com` を具体ホスト列挙に置換（v0.3.0 リリース前）**
```html
<!-- 最終版 connect-src（観測結果で特定された値のみ） -->
connect-src 'self'
            https://www.googleapis.com
            https://firestore.googleapis.com
            https://identitytoolkit.googleapis.com
            https://securetoken.googleapis.com
            https://api.open-meteo.com
            https://open.er-api.com;
```

> **v3 → v4 変更点**: Codex 第3回「暫定値を提示し、実装時に Playwright 観測で最小化」推奨に従い、暫定値とプロセスを併記。`securetoken.googleapis.com`（トークン更新）を追加。`script-src` の `https://*.googleapis.com` は v3 で削除済を維持。

#### 5.7.2 外部 API 失敗時のフォールバック表示

| API | 失敗時挙動 |
|-----|-----------|
| 天気（Open-Meteo） | 「気温データ取得失敗」テキスト表示・絵文字`☁️`のまま |
| 為替（open.er-api.com） | 「為替取得失敗」テキスト表示・前回値があれば `(stale)` バッジ付き表示 |
| ニュース（固定ダミー） | API 呼び出しがないので失敗ケースなし |

```javascript
async function fetchWeather() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?...');
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.warn('[SAKURA OS] Weather fetch failed:', e);
    return { error: true, message: '気温データ取得失敗' };
  }
}
```

#### 5.7.3 通信先 allowlist 検査（Playwright・§10.8 で完全コード提示）

- §10.8 のテスト項目で `page.on('request', ...)` を使い、許可外ドメインへの通信があった場合 fail
- v4 では ALLOWED_HOSTS + NG_PATTERNS 二重配列方式（§10.8 完全コード）

---

### 5.8 ニュース機能の方針（v3 から継続）

#### 5.8.1 v0.3.0 採用方式: 固定ダミーニュース（静的配列）

```javascript
const DEMO_NEWS = [
  { title: 'デモ環境へようこそ — SAKURA OS でフルスタック体験',           url: '#', date: '2026-05-10' },
  { title: '顧客管理アプリで顧客登録・編集・カレンダー連携をお試しください', url: '#', date: '2026-05-10' },
  { title: '請求書アプリで複数 PDF 添付・複数宛先送信をお試しください',   url: '#', date: '2026-05-10' },
  { title: 'グループウェアで掲示板・カレンダー・タスク・申請をお試しください', url: '#', date: '2026-05-10' },
  { title: '本番環境のお問い合わせは sakuranet-co.jp までどうぞ',          url: '#', date: '2026-05-10' }
];

// ニュースティッカー描画は DEMO_NEWS をそのまま使う
// 外部 API 呼び出しは一切しない
```

#### 5.8.2 禁止事項（Codex 厳命）

- ❌ 本番 `/system/.../*.php` プロキシ呼出
- ❌ SAKURA AI 側 PHP 流用
- ❌ `sakuranet-co.jp/system` 配下呼出
- ❌ `rss2json` / `corsproxy.io` 依存
- ❌ どうしても入れる場合でも本番 PHP 流用は厳禁

#### 5.8.3 将来計画（Phase 2-B.1 以降）

- 必要なら **demo 専用** `demo_news_proxy.php` を**新規作成**（本番流用禁止）
- もしくは Cloud Functions で proxy（API キー不要・公開 RSS 用）
- v0.3.0 では検討すらしない（スコープ外）

---

## 6. クリーンルーム実装方針

### 6.1 原則

- ✅ 本番 `sakura-os.html` を**読んで構造・UI 仕様を把握**する
- ❌ コードを**そのままコピー＆ペーストしない**
- ✅ Sonnet が**ゼロから書き起こす**（Phase 2-A の groupware.html と同方針）
- ✅ 本番設定（Firebase config / API キー / URL）が一切混入しないこと

### 6.2 検証手順（実装後・Sonnet 担当）

1. `scripts/check-no-prod-config.js` 実行 → 本番 Firebase config 検出ゼロ確認
2. `scripts/detect-pii.js` 実行 → PII 検出ゼロ確認
3. `tests/no-prod-network.spec.js` 実行 → 本番ドメインへの通信ゼロ確認
4. **§10.8 Playwright 15 項目**を全 PASS 確認
5. 手動確認: ブラウザ DevTools Network タブで `sakura-net-db` / `sakuranet-co.jp/system` へのアクセスがないこと

### 6.3 流用可能な構造（参考のみ・コピー禁止）

- 左パネル：時計・天気・アプリグリッド・為替（CSS 構造を参考）
- メイン：ニュース（**固定ダミーに置換**）・カレンダー・タスク（レイアウトを参考）
- ウィンドウシステム：ドラッグ・リサイズ・最小化・最大化・タスクバー
- 壁紙パネル：プリセット 9 種**のみ**（カスタム URL 欄・アップロードなし）

### 6.4 クリーンルーム実装で注意すべきポイント

| 項目 | 注意点 |
|------|-------|
| 関数名 | 本番と同名でも独立に書く（`init`, `openApp` 等は OK） |
| 定数 | `APP_ALLOWLIST`・`WALLPAPERS` 配列はデモ専用に再定義 |
| Firebase 初期化 | `DEMO_FIREBASE_CONFIG`（firebase-config.demo.js）のみ |
| API URL | デモ用に書き換え（PHP は使わない・固定ダミーニュース使用） |
| マジックナンバー | レイアウト寸法・タイマー秒数等は本番と同等で OK |
| **localStorage key** | **必ず `sakura_demo_os_` prefix（§6.5）** |
| **iframe URL** | **`APP_ALLOWLIST` 由来のみ（§3.4）** |

---

### 6.5 localStorage キー設計（Codex 第3回 指摘4 対応・コア5 + 拡張3 split）

#### 6.5.1 prefix ルール

- **すべての localStorage キーに `sakura_demo_os_` prefix を付ける**
- **既存の本番系キー名（`sakura-net-db`, `gw_*`, `wp_*`, `mascot_*` 等）は絶対に使わない**
- グループウェア等の他デモ画面と key 衝突しないよう、SAKURA OS 専用 prefix を遵守

#### 6.5.2 v0.3.0 で使用する localStorage キー一覧（v4・コア5 必須 + 拡張3 split）

##### A. コア5 キー（**v0.3.0 で確実実装・Codex 第3回 指摘4 で確定**）

```javascript
// ============================================
// ✅ v0.3.0 コア5 必須 keys（Codex 指定と完全一致）
// ============================================
const CORE_KEYS = Object.freeze([
  'sakura_demo_os_theme',                  // 'dark' | 'light'
  'sakura_demo_os_wallpaper_id',           // string (preset id)
  'sakura_demo_os_slideshow_enabled',      // '0' | '1'
  'sakura_demo_os_slideshow_interval',     // string (seconds, default '30')
  'sakura_demo_os_open_windows'            // string (JSON array of appIds)
]);
```

| key | 値の型 | 用途 | logout 時 |
|-----|--------|------|:---:|
| `sakura_demo_os_theme` | `'dark' \| 'light'` | テーマ設定 | 保持 |
| `sakura_demo_os_wallpaper_id` | `string`（プリセット ID） | 選択中の壁紙ID | 保持 |
| `sakura_demo_os_slideshow_enabled` | `'0' \| '1'` | スライドショー ON/OFF | 保持 |
| `sakura_demo_os_slideshow_interval` | `string` | 切替秒数（既定 30） | 保持 |
| `sakura_demo_os_open_windows` | `string`（JSON 配列） | 起動中ウィンドウ id 群 | **削除** |

##### B. 拡張3 キー（**v0.3.0 では実装しない・将来 v0.3.x で検討**）

```javascript
// ============================================
// ⏸ v0.3.0 では実装しない・将来 v0.3.x 候補
// ============================================
const FUTURE_KEYS = Object.freeze([
  'sakura_demo_os_slideshow_ids',          // JSON array of preset ids（部分集合）
  'sakura_demo_os_window_layout',          // JSON of window x/y/w/h per appId
  'sakura_demo_os_last_seen_at'            // ISO datetime
]);
```

| 拡張 key | v0.3.0 採用？ | 理由 |
|---------|:---:|---|
| `sakura_demo_os_slideshow_ids` | ❌ 不採用（v0.3.0） | プリセット 9 種全てローテで十分・選択 UI 後回し |
| `sakura_demo_os_window_layout` | ❌ 不採用（v0.3.0） | 既定サイズで起動・位置記憶は v0.3.x 検討 |
| `sakura_demo_os_last_seen_at` | ❌ 不採用（v0.3.0） | analytics 用途は Phase 2-C+ |

> **v3 → v4 変更点（Codex 第3回 指摘4 対応）**:
> - v3 では 8 keys を「保持/削除」マトリクスのみで提示
> - v4 では **コア5（必須・Codex 指定と完全一致）** と **拡張3（v0.3.x 検討）** を**明確に split**
> - これにより v0.3.0 実装スコープが明確化・拡張要件は将来へ送る

#### 6.5.3 logout 時の保持/削除方針

```javascript
function clearOsTransientStateOnLogout() {
  // 削除対象（個人状態に近いもの）
  ['sakura_demo_os_open_windows'].forEach(k => localStorage.removeItem(k));
  // 保持対象（テーマ・壁紙ID・スライドショー設定 4 件）→ 何もしない
}
```

> 注釈: 同 OEM 端末を複数人で順次デモる想定もあるため、起動済ウィンドウは logout で消す。
> テーマ・壁紙・スライドショー設定は個人特定情報ではないため保持し、次のデモ準備時間を短縮する。

#### 6.5.4 値の禁止事項（Codex 第3回 指摘4 対応・禁止 prefix 一覧網羅）

##### 禁止される **値** の型

```javascript
// ❌ NG: base64 画像
localStorage.setItem('sakura_demo_os_wallpaper_data', 'data:image/png;base64,iVBOR...');
// ❌ NG: 外部 URL
localStorage.setItem('sakura_demo_os_wallpaper_url', 'https://example.com/img.jpg');
// ❌ NG: 本番 URL
localStorage.setItem('sakura_demo_os_link', 'https://sakuranet-co.jp/system/...');
```

##### 禁止される **prefix** 一覧（Codex 第3回 で網羅指定）

```javascript
const FORBIDDEN_KEY_PREFIXES = Object.freeze([
  'sakura-net-db',      // ❌ 本番 Firebase プロジェクト名
  'sakura_ai',          // ❌ SAKURA AI 系（sakura_ai_* も含む）
  'codex',              // ❌ Codex Relay 系（codex_*, codex-* も含む）
  'relay',              // ❌ Relay 系
  'gw_',                // ❌ 本番グループウェア系
  'wp_',                // ❌ 本番 SAKURA OS 系
  'wallpaper_',         // ❌ 本番壁紙系
  'mascot_',            // ❌ 本番マスコット系
  'sticky_',            // ❌ 本番付箋系
  'ai_'                 // ❌ AI 系
]);
```

##### 禁止される **値の内容** 一覧

```javascript
const FORBIDDEN_VALUE_PATTERNS = Object.freeze([
  /^data:image\/[a-z]+;base64,/i,         // ❌ base64 画像
  /^https?:\/\//i,                         // ❌ http(s) 始まりの URL（外部 URL 全般）
  /sakuranet-co\.jp/i,                     // ❌ 本番ドメイン
  /sakura-net-db/i,                        // ❌ 本番 Firebase
  /sakura-ai/i,                            // ❌ SAKURA AI 系
  /codex-relay/i                           // ❌ Codex Relay
]);
```

#### 6.5.5 グローバル localStorage ラッパー（Codex 第3回 指摘4 対応・実装版）

```javascript
const SAFE_PREFIX = 'sakura_demo_os_';

const FORBIDDEN_KEY_PREFIXES = [
  'sakura-net-db','sakura_ai','codex','relay',
  'gw_','wp_','wallpaper_','mascot_','sticky_','ai_'
];

const FORBIDDEN_VALUE_PATTERNS = [
  /^data:image\/[a-z]+;base64,/i,
  /^https?:\/\//i,
  /sakuranet-co\.jp/i,
  /sakura-net-db/i,
  /sakura-ai/i,
  /codex-relay/i
];

function lsSet(key, value) {
  if (typeof key !== 'string') {
    throw new Error('[SAKURA OS] Non-string key rejected');
  }
  if (!key.startsWith(SAFE_PREFIX)) {
    throw new Error(`[SAKURA OS] Forbidden localStorage key (no prefix): ${key}`);
  }
  for (const bad of FORBIDDEN_KEY_PREFIXES) {
    if (key.includes(bad)) {
      throw new Error(`[SAKURA OS] Forbidden key fragment '${bad}' in: ${key}`);
    }
  }
  if (typeof value === 'string') {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        throw new Error(`[SAKURA OS] Forbidden value pattern in key: ${key}`);
      }
    }
  }
  localStorage.setItem(key, value);
}

function lsGet(key) {
  if (typeof key !== 'string' || !key.startsWith(SAFE_PREFIX)) return null;
  return localStorage.getItem(key);
}

function lsRemove(key) {
  if (typeof key !== 'string' || !key.startsWith(SAFE_PREFIX)) return;
  localStorage.removeItem(key);
}
```

---

## 7. Firestore Rules への影響

### 7.1 結論: **Rules 変更なし**

### 7.2 判断根拠

| 操作 | 必要権限 | 既存 Rules で許可済みか |
|------|---------|:---:|
| `demo_sessions/{uid}` get | `request.auth.uid == uid` | ✅（v0.1.8 で実装済み） |
| `demo_config/emergency_stop` read | `read: if true` | ✅ |
| `demo_calendar_events` read | `isDemoUser()` | ✅（v0.2.0 で実装済み） |
| `demo_todos` read | `isDemoUser()` | ✅（v0.2.0 で実装済み） |
| `customer_records` read | `isDemoUser()` | ✅（参照するなら）— **本 Phase では使わない** |

### 7.3 SAKURA OS は **write を一切しない**

- カレンダー・タスクの追加/編集はグループウェア (`groupware.html`) の責務
- OS から書き込むケースは **localStorage**（`sakura_demo_os_*`）のみで完結
- audit_log への書き込みも不要（read 操作は audit 対象外）

### 7.4 Rules 検証

実装完了時に既存ユニットテスト `tests/firebase-rules.test.js`（T01〜T40）が**全 PASS** することを再確認。
SAKURA OS 追加で挙動変化なし。

### 7.5 将来 Firestore コレクションが必要になるケース（参考・本 Phase は不要）

| 機能 | 必要コレクション例 | 実装時期 |
|------|-----------------|---------|
| ウィンドウ配置のサーバー保存（端末横断） | `demo_os_user_layout` | Phase 2-B.1+ |
| ユーザー別壁紙設定のサーバー保存 | `demo_os_user_settings` | Phase 2-B.1+ |
| ユーザー別ショートカット | `demo_os_user_shortcuts` | Phase 2-B.1+ |
| スライドショー設定のサーバー保存 | `demo_os_user_settings` | Phase 2-B.1+ |
| OS 起動 analytics | `demo_os_sessions` | Phase 2-C+ |

**v0.3.0 ではすべて localStorage 方針のため新規コレクション不要。**

---

## 8. 既存ファイルへの影響範囲（v3 から継続維持）

### 8.1 結論

> **既存4ファイルは業務ロジックに触れず、ナビバーに SAKURA OS への導線を追加するのみ。**
> **DEMO バナーは既存4ページに既に設置済 — v0.3.0 で touchしない。**
> **DEMO バナー追加対象は新規 `sakura-os.html` のみ。**

### 8.2 ナビバー更新が必要なファイル

| ファイル | 変更内容 | 業務ロジック影響 | UI 影響 | DEMO バナー |
|---------|---------|:---:|:---:|:---:|
| `ordersystem.html` | ナビに `<a href="sakura-os.html">🖥️ SAKURA OS</a>` 1 行追加 | ❌ なし | ✅ ナビバーのみ | 🟢 既設置済・変更なし |
| `invoice.html` | 同上 | ❌ なし | ✅ ナビバーのみ | 🟢 既設置済・変更なし |
| `groupware.html` | 同上 | ❌ なし | ✅ ナビバーのみ | 🟢 既設置済・変更なし |
| `index.html` | （任意）機能カードに SAKURA OS 追記 | ❌ なし | ✅ カード追加のみ | 🟢 既設置済・変更なし |
| **`sakura-os.html`** | **新規作成** | ❌ なし（新規） | ➕ 全画面新規 UI | ➕ **新規追加（必須）** |

> **DEMO バナー設置状況の事前検証**:
> - `ordersystem.html` L1017: 「⚠️ これはデモ環境です。入力データは架空のものです。本番環境とは完全に分離されています。」確認済 ✅
> - `invoice.html` / `groupware.html` / `index.html` も同テキストで設置済 ✅
> - **既存 4 ページのバナーは触らない**（変更により壊れるリスクを避ける）

### 8.3 ナビバー追記の差分（具体例）

#### Before（v0.2.0 ordersystem.html L1019-L1025）
```html
<nav style="position:fixed;...">
  <a href="ordersystem.html" style="...background:#0075de;color:#fff;">👥 顧客管理</a>
  <a href="invoice.html"     style="...">📄 請求書</a>
  <a href="groupware.html"   style="...">🏢 グループウェア</a>
  <a href="manual-user.html" target="_blank" style="...">📖 使い方ガイド</a>
  <a href="javascript:void(0)" onclick="..." style="...">🚪 ログアウト</a>
</nav>
```

#### After（v0.3.0 ordersystem.html）
```html
<nav style="position:fixed;...">
  <a href="ordersystem.html" style="...background:#0075de;color:#fff;">👥 顧客管理</a>
  <a href="invoice.html"     style="...">📄 請求書</a>
  <a href="groupware.html"   style="...">🏢 グループウェア</a>
  <a href="sakura-os.html"   style="...">🖥️ SAKURA OS</a>  <!-- ✨ 追加 -->
  <a href="manual-user.html" target="_blank" style="...">📖 使い方ガイド</a>
  <a href="javascript:void(0)" onclick="..." style="...">🚪 ログアウト</a>
</nav>
```

### 8.4 変更対象ファイル一覧（Codex 要件）

```
sakura-os.html    : ✨ 新規作成（DEMO バナー新規設置含む）
ordersystem.html  : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック・DEMO バナー非変更）
invoice.html      : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック・DEMO バナー非変更）
groupware.html    : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック・DEMO バナー非変更）
index.html        : （任意）機能カード追加（業務ロジック・DEMO バナー非変更）
```

> **重要**: 既存 4 ページの DEMO バナーは **既に設置済** のため、v0.3.0 では一切変更しない。
> 「壊れていないものは触らない」原則を徹底する。

### 8.5 影響範囲チェックリスト（Sonnet 実装後・自己検証用）

- [ ] `ordersystem.html` の業務ロジック（顧客 CRUD）が変更されていない
- [ ] `invoice.html` の請求書ロジック・PDF 生成が変更されていない
- [ ] `groupware.html` の Firestore 連携・掲示板・カレンダー・タスクが変更されていない
- [ ] `index.html` のログインフォーム・初回認証フローが変更されていない
- [ ] **既存 4 ページの DEMO バナーが触られていない**（テキスト・スタイル・位置すべて v0.2.0 のまま）
- [ ] ナビバーのアクティブ表示（青色）が各ページで正しい
- [ ] manual-user.html・manual-admin.html は変更不要（任意で SAKURA OS 説明を追記しても良いが本 Phase では対象外）

### 8.6 Playwright 既存回帰テスト（必須）

| テスト | 内容 |
|--------|------|
| ordersystem regression | ナビバー追加後も顧客検索・登録・編集・削除が壊れていない |
| invoice regression | ナビバー追加後も請求書作成・PDF 生成・送信が壊れていない |
| groupware regression | ナビバー追加後も掲示板・カレンダー・タスク・申請が壊れていない |
| nav links | 全ページのナビバーから sakura-os.html に遷移できる |
| **DEMO banner unchanged** | **既存 4 ページの DEMO バナー文言・スタイルが v0.2.0 と完全一致** |

### 8.7 変更しないファイル一覧

- `firestore.rules` — 変更なし
- `firebase.json` — 変更なし
- `firestore.indexes.json` — 変更なし（既存 index で間に合う）
- `tools/seed-firestore.html` — 変更なし（OS は read のみのため seed 不要）
- `firebase-config.demo.js` — 変更なし
- `config.js` — 変更なし
- `functions/index.js` — 変更なし（OS リセット対象データなし）
- `manual-admin.html` / `manual-user.html` — 本 Phase は変更なし（v0.3.x で追記検討）
- **`ordersystem.html` / `invoice.html` / `groupware.html` / `index.html` の `<body>` 直後 DEMO バナー** — 変更なし

---

## 9. 新規 Firestore コレクション

### 結論: **なし**

| 候補 | 必要か | 判断 |
|------|:---:|------|
| `demo_os_settings`（壁紙・テーマ ユーザー別） | ❌ | localStorage で十分・サーバー保存不要 |
| `demo_os_sessions`（誰がいつ起動したか） | ❌ | analytics は本 Phase 対象外 |
| `demo_os_news_cache`（ニュース API キャッシュ） | ❌ | 固定ダミー方式のため不要 |
| `demo_os_wallpapers`（共有壁紙） | ❌ | プリセット 9 種で十分 |

---

## 10. セキュリティチェックリスト

### 10.1 本番完全分離（Phase 1 鉄則の継承）

- [ ] `firebase-config.demo.js` のみ使用・本番 config がコード内に存在しない
- [ ] `gw_api.php` を呼ばない（PHP API 完全削除）
- [ ] `/system/sakura-ai/` への参照ゼロ
- [ ] `get_wallpapers.php` への参照ゼロ
- [ ] `sakuranet-co.jp` への通信ゼロ（`demo.sakuranet-co.jp` 同ドメイン内のみ）
- [ ] `sakura-net-db` Firebase プロジェクトへの通信ゼロ
- [ ] 外部 API は読み取り専用・認証情報なし（Open-Meteo / open.er-api.com）
- [ ] **ニュースは固定ダミー**（外部 RSS / proxy 一切呼ばない）
- [ ] **SAKURA AI 関連通信ゼロ**（codex-relay / *.sakura-ai.* / sakura-ai 配下 全て）

### 10.2 認証・セッション

- [ ] `onAuthStateChanged` で未認証時 `index.html` へ即リダイレクト
- [ ] `demo_sessions/{uid}` 検証 5 項目すべて実施
- [ ] `demo_config/emergency_stop` チェック（既存 4 ページと同実装）
- [ ] ログアウト時に確認ダイアログ → `signOut()` → `index.html`
- [ ] logout 時に `sakura_demo_os_open_windows` を削除

### 10.3 iframe sandbox / allowlist（v4 改訂）

- [ ] `sandbox="allow-scripts allow-same-origin allow-forms"`（§3.4.3 基本値）
- [ ] iframe `src` は `APP_ALLOWLIST`（4件）の URL のみ
  - `ordersystem.html` / `invoice.html` / `groupware.html` / `manual-user.html`
- [ ] `Object.freeze(APP_ALLOWLIST)` で凍結（§3.4.4 OK 例）
- [ ] `new URL(app.url, location.href)` で origin 再検証
- [ ] 任意 URL を iframe で開く UI を実装しない
- [ ] query parameter で iframe.src を設定しない
- [ ] 文字列連結で iframe.src を構築しない（`${name}.html` 等禁止）
- [ ] 外部サイトを iframe で開かない（本番 SAKURA OS の `/system/` 配下を含めて開かない）
- [ ] iframe 内で Firebase Auth が壊れない（§3.4.5 テスト項目）
- [ ] **sandbox は補助的役割**として位置付け、主防御は allowlist + 通信ゼロ + CSP（§3.4.6）
- [ ] sandbox 拡張属性（allow-popups / allow-downloads / allow-modals）は実機検証で必要時のみ追加

### 10.4 DEMO バナー（v3 から継続）

- [ ] **対象は `sakura-os.html` のみ**（既存 4 ページは既設置済・変更なし）
- [ ] **SAKURA OS では全画面表示時もバナー消えない**（`position:fixed; z-index:99999`）
- [ ] バナー文言は既存 4 ページと同一テキスト：「⚠️ これはデモ環境です。入力データは架空のものです。本番環境とは完全に分離されています。」
- [ ] バナースタイル（背景色・文字色・パディング）も既存 4 ページと統一
- [ ] 既存 4 ページの DEMO バナーは触らない（変更ゼロを Playwright でも検証）

### 10.5 機密情報

- [ ] 本番 API キーがソース内に存在しない（`scripts/check-no-prod-config.js` で検証）
- [ ] PII データシード不要（`scripts/detect-pii.js` 適用対象外だが念のため）
- [ ] localStorage に保存するデータ：壁紙ID・テーマ・スライドショー設定のみ（個人情報ゼロ）
- [ ] localStorage キーは `sakura_demo_os_` prefix のみ + コア5 + 拡張3 のみ（§6.5）
- [ ] localStorage に base64 画像・外部 URL・本番 URL を保存しない（§6.5.4）
- [ ] `lsSet/lsGet/lsRemove` ラッパー経由でしか localStorage を触らない（§6.5.5）

### 10.6 通信ゼロ検証

- [ ] `tests/no-prod-network.spec.js` 拡張（`sakura-os.html` の起動を含める）
- [ ] Playwright で SAKURA OS 起動 → 各アプリ open → close → 本番ドメインへの通信ゼロ確認
- [ ] ALLOWED_HOSTS + NG_PATTERNS 二重防御で許可外ドメインへの通信を即 fail（§10.8）

### 10.7 緊急停止スイッチ

- [ ] `demo_config/emergency_stop.enabled == true` 時、即座に画面差し替え
- [ ] 既存 4 ページと同じテキスト・スタイル

---

### 10.8 Playwright テスト項目（v4 で完全コード提示・15 項目）

#### 10.8.1 通信 allowlist + ブラックリスト 二重防御方式（Codex 第3回 指摘5 対応）

##### A. ALLOWED_HOSTS 配列（許可 — マッチしないと fail）

```javascript
// ============================================
// ✅ ALLOWED_HOSTS — このいずれにもマッチしないホストへの通信は即 fail
// ============================================
const ALLOWED_HOSTS = [
  /^demo\.sakuranet-co\.jp$/,                  // 自オリジン
  /^www\.gstatic\.com$/,                       // Firebase JS SDK CDN
  /\.googleapis\.com$/,                        // Firebase / Firestore / Auth ベース
  /\.firebaseio\.com$/,                        // Firebase Realtime DB（保険）
  /^firestore\.googleapis\.com$/,              // Firestore 明示
  /^identitytoolkit\.googleapis\.com$/,        // Auth 明示
  /^securetoken\.googleapis\.com$/,            // トークン更新明示
  /^api\.open-meteo\.com$/,                    // 天気
  /^open\.er-api\.com$/                        // 為替
];
```

##### B. NG_PATTERNS 配列（禁止 — マッチしたら即 fail・二重防御）

```javascript
// ============================================
// ❌ NG_PATTERNS — このいずれかにマッチする URL は即 fail（二重防御）
// ============================================
const NG_PATTERNS = [
  /sakuranet-co\.jp\/system/i,                 // 本番システム配下
  /sakura-net-db/i,                            // 本番 Firebase プロジェクト
  /gw_api\.php/i,                              // 本番 PHP API
  /get_wallpapers\.php/i,                      // 本番壁紙 PHP API
  /sakura-ai/i,                                // SAKURA AI 系（パス・サブドメイン両方）
  /codex-relay/i,                              // Codex Relay
  /calllog/i,                                  // 通話明細
  /usagelog/i,                                 // 利用明細
  /cybozu/i,                                   // サイボウズ系
  /cbag/i,                                     // サイボウズ系
  /ag\.exe/i                                   // サイボウズエージェント
];
```

##### C. 二重防御の評価ロジック

```javascript
// ============================================
// 判定: ALLOWED_HOSTS 不一致 OR NG_PATTERNS 一致 → fail
// ============================================
function assertSafeRequest(url) {
  const u = new URL(url);

  // 二重防御 ① — NG_PATTERNS にマッチしたら即 fail
  for (const ng of NG_PATTERNS) {
    if (ng.test(url)) {
      throw new Error(`[NG_PATTERN] Blocked URL matched ${ng}: ${url}`);
    }
  }

  // 二重防御 ② — ALLOWED_HOSTS のいずれにもマッチしなければ fail
  const allowed = ALLOWED_HOSTS.some(re => re.test(u.hostname));
  if (!allowed) {
    throw new Error(`[NOT_ALLOWED] Disallowed host: ${u.hostname} (url=${url})`);
  }
}
```

#### 10.8.2 v0.3.0 全 15 テスト項目（v4・Codex 第3回 指摘5/6 対応）

```
[ ] T-OS-01  SAKURA OS ロード時に `sakura-net-db` 通信ゼロ
[ ] T-OS-02  SAKURA OS ロード時に `sakuranet-co.jp/system` 通信ゼロ
[ ] T-OS-03  SAKURA OS ロード時に `gw_api.php` 通信ゼロ
[ ] T-OS-04  SAKURA OS ロード時に `get_wallpapers.php` 通信ゼロ
[ ] T-OS-05  許可外 iframe URL（例: 'https://example.com'）が openApp で開けない
[ ] T-OS-06  iframe 内で ordersystem.html が表示できる
[ ] T-OS-07  iframe 内で invoice.html が表示できる
[ ] T-OS-08  iframe 内で groupware.html が表示できる
[ ] T-OS-09  Firebase Auth が iframe 内で壊れない（currentUser != null）
[ ] T-OS-10  localStorage key が `sakura_demo_os_` prefix のみ（他 prefix を書こうとすると throw）
[ ] T-OS-11  SAKURA AI 関連通信ゼロ（codex relay / app server / *.sakura-ai.* 系）
[ ] T-OS-12  ニュース機能で本番 proxy 通信ゼロ（rss2json / corsproxy.io へのリクエストなし）
[ ] T-OS-13  既存4ページのナビ追加後も既存機能が壊れない（顧客 CRUD / 請求書発行 / 掲示板 等）
[ ] T-OS-14  ALLOWED_HOSTS 配列外 + NG_PATTERNS 一致の通信が一切発生しない（包括二重防御）
[ ] T-OS-15  SAKURA AI タイルクリックでモーダル表示・iframe 不生成・SAKURA AI 通信ゼロ
```

#### 10.8.3 Playwright spec ファイル雛形（共通ヘッダー）

```javascript
// tests/sakura-os/sakura-os.spec.js
const { test, expect } = require('@playwright/test');

const ALLOWED_HOSTS = [
  /^demo\.sakuranet-co\.jp$/,
  /^www\.gstatic\.com$/,
  /\.googleapis\.com$/,
  /\.firebaseio\.com$/,
  /^firestore\.googleapis\.com$/,
  /^identitytoolkit\.googleapis\.com$/,
  /^securetoken\.googleapis\.com$/,
  /^api\.open-meteo\.com$/,
  /^open\.er-api\.com$/
];

const NG_PATTERNS = [
  /sakuranet-co\.jp\/system/i,
  /sakura-net-db/i,
  /gw_api\.php/i,
  /get_wallpapers\.php/i,
  /sakura-ai/i,
  /codex-relay/i,
  /calllog/i,
  /usagelog/i,
  /cybozu/i,
  /cbag/i,
  /ag\.exe/i
];

const DEMO_URL = 'https://demo.sakuranet-co.jp/sakura-os.html';
const DEMO_LOGIN = 'https://demo.sakuranet-co.jp/index.html';
const DEMO_USER = process.env.DEMO_USER || 'demo@sakuranet-co.jp';
const DEMO_PASS = process.env.DEMO_PASS || '<set-in-env>';

async function loginIfNeeded(page) {
  await page.goto(DEMO_LOGIN);
  if (await page.locator('input[type=email]').isVisible().catch(() => false)) {
    await page.fill('input[type=email]', DEMO_USER);
    await page.fill('input[type=password]', DEMO_PASS);
    await page.click('button[type=submit]');
    await page.waitForURL(/index\.html/);
  }
}
```

#### 10.8.4 T-OS-14 完全コード（包括二重防御）— Codex 第3回 指摘6 対応

**T-OS-14 検査条件（Codex 指定）**
- ALLOWED_HOSTS 配列にマッチしない全 request を即 fail
- NG_PATTERNS にマッチする URL も即 fail（二重防御）
- 一連の操作: ログイン → 4 アプリ全 open → close → wait
- どこでも fail がないこと

```javascript
test('T-OS-14: ALLOWED_HOSTS + NG_PATTERNS 二重防御', async ({ page }) => {
  const violations = [];

  page.on('request', req => {
    const url = req.url();

    // 二重防御 ① — NG_PATTERNS
    for (const ng of NG_PATTERNS) {
      if (ng.test(url)) {
        violations.push({ kind: 'NG_PATTERN', pattern: ng.toString(), url });
        return;
      }
    }

    // 二重防御 ② — ALLOWED_HOSTS
    try {
      const u = new URL(url);
      const allowed = ALLOWED_HOSTS.some(re => re.test(u.hostname));
      if (!allowed) {
        violations.push({ kind: 'NOT_ALLOWED', host: u.hostname, url });
      }
    } catch (e) {
      violations.push({ kind: 'INVALID_URL', url });
    }
  });

  await loginIfNeeded(page);
  await page.goto(DEMO_URL);
  await page.waitForLoadState('networkidle');

  // 4 アプリを全て開く
  for (const appId of ['customer', 'invoice', 'groupware', 'manual']) {
    await page.click(`#app-tile-${appId}`);
    await page.waitForLoadState('networkidle');
  }

  // 4 アプリを全て閉じる
  const closeButtons = page.locator('[data-window-close]');
  const closeCount = await closeButtons.count();
  for (let i = closeCount - 1; i >= 0; i--) {
    await closeButtons.nth(i).click();
  }

  // 追加待機（遅延通信検査）
  await page.waitForTimeout(2000);

  // 違反があれば全て表示して fail
  if (violations.length > 0) {
    console.error('[T-OS-14] Violations:', JSON.stringify(violations, null, 2));
  }
  expect(violations).toEqual([]);
});
```

#### 10.8.5 T-OS-15 完全コード（SAKURA AI タイル B案検証）— Codex 第3回 指摘6 対応

**T-OS-15 検査条件（Codex 指定）**
- SAKURA AI タイルクリック時:
  - モーダル表示（テキスト「デモ版では準備中」を含む）
  - iframe 要素が新規生成されない
  - SAKURA AI 関連 URL（`sakura-ai`, `codex-relay`, `*.sakura-ai.*`）への通信ゼロ
- モーダル閉じた後も追加通信ゼロ

```javascript
test('T-OS-15: SAKURA AI タイル B案検証（モーダル + 通信ゼロ + iframe 不生成）', async ({ page }) => {
  const aiBanned = [
    /sakura-ai/i,
    /codex-relay/i,
    /\.sakura-ai\./i
  ];
  const aiViolations = [];

  page.on('request', req => {
    const url = req.url();
    for (const b of aiBanned) {
      if (b.test(url)) {
        aiViolations.push({ pattern: b.toString(), url });
        return;
      }
    }
  });

  await loginIfNeeded(page);
  await page.goto(DEMO_URL);
  await page.waitForLoadState('networkidle');

  // ベースライン: AI タイルクリック前の iframe 数を記録
  const iframeCountBefore = await page.locator('iframe').count();

  // 🤖 SAKURA AI タイルをクリック
  await page.click('#app-tile-ai');

  // モーダルが「デモ版では準備中」を含む形で表示される
  await expect(page.locator('text=デモ版では準備中')).toBeVisible({ timeout: 3000 });

  // iframe が新規生成されていない（数が増えていない）
  const iframeCountAfter = await page.locator('iframe').count();
  expect(iframeCountAfter).toBe(iframeCountBefore);

  // モーダルを閉じる
  await page.click('button:has-text("閉じる")');
  await expect(page.locator('text=デモ版では準備中')).not.toBeVisible();

  // モーダル閉じた後も追加通信が発生しないことを確認
  await page.waitForTimeout(2000);

  // SAKURA AI 関連通信が一切発生していない
  if (aiViolations.length > 0) {
    console.error('[T-OS-15] SAKURA AI traffic detected:', JSON.stringify(aiViolations, null, 2));
  }
  expect(aiViolations).toEqual([]);
});
```

#### 10.8.6 T-OS-10 補強（localStorage prefix 強制 + 禁止値検査）

```javascript
test('T-OS-10: localStorage prefix 強制 + 禁止 prefix/値', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto(DEMO_URL);
  await page.waitForLoadState('networkidle');

  // ① 許可された prefix なら OK
  await page.evaluate(() => {
    window.lsSet('sakura_demo_os_theme', 'dark');
  });
  expect(await page.evaluate(() => localStorage.getItem('sakura_demo_os_theme'))).toBe('dark');

  // ② prefix なし → throw
  const noPrefixError = await page.evaluate(() => {
    try { window.lsSet('theme', 'dark'); return null; } catch (e) { return e.message; }
  });
  expect(noPrefixError).toMatch(/Forbidden localStorage key/);

  // ③ 禁止 prefix（sakura-net-db） → throw
  const forbiddenPrefixError = await page.evaluate(() => {
    try { window.lsSet('sakura_demo_os_sakura-net-db_x', 'v'); return null; } catch (e) { return e.message; }
  });
  expect(forbiddenPrefixError).toMatch(/Forbidden key fragment/);

  // ④ 禁止値（base64 image） → throw
  const base64Error = await page.evaluate(() => {
    try { window.lsSet('sakura_demo_os_x', 'data:image/png;base64,iVBOR'); return null; } catch (e) { return e.message; }
  });
  expect(base64Error).toMatch(/Forbidden value pattern/);

  // ⑤ 禁止値（外部 URL） → throw
  const urlError = await page.evaluate(() => {
    try { window.lsSet('sakura_demo_os_x', 'https://evil.example.com'); return null; } catch (e) { return e.message; }
  });
  expect(urlError).toMatch(/Forbidden value pattern/);
});
```

---

## 11. Codex レビュー用 Q&A（判断ポイント）

### Q1. クリーンルーム実装方針

**質問**: 本番 `sakura-os.html`（1949 行）を「構造参考・コードコピーなし」で再実装する方針は妥当か。Phase 2-A の `groupware.html` と同方針で OK か。

**Opus 推奨**: 🟢 **OK**

---

### Q2. SAKURA AI 削除方式 — **B案固定（v3 で確定・v4 維持）**

**質問**: SAKURA AI を **B案「準備中無効タイル」固定** で OK か。

**Opus 推奨**: 🟢 **B案で確定**

---

### Q3. Firestore コレクション戦略

**質問**: 既存 `demo_calendar_events` / `demo_todos` を **read のみ** で使う方針で OK か。

**Opus 推奨**: 🟢 **既存 read のみ**

---

### Q4. iframe URL allowlist + sandbox 基本値（v4 改訂・最重要）

**質問**: §3.4 の iframe URL allowlist（4件）+ sandbox **基本値 `allow-scripts allow-same-origin allow-forms`** で OK か。実機検証で必要があれば拡張属性（allow-popups / allow-downloads / allow-modals）を**最小限追加**する方針で OK か。

**Opus 推奨**: 🟢 **基本3属性で実装着手・実機検証で必要分のみ追加**
- v4 で Codex 第3回推奨「最小限版」に変更
- 一括追加（v3 値）は不採用

**ユーザー判断**: 以下のいずれかを選択
- (A) 基本3属性で実装着手 → 実機検証で必要分のみ追加（**Opus 推奨**）
- (B) v3 値（6属性）で最初から実装

---

### Q5. 外部 API（天気・為替）+ ニュース固定ダミー

**質問**: 天気（Open-Meteo）/ 為替（open.er-api.com）のみ外部 API、ニュースは v0.3.0 では固定ダミーで OK か。CSP は暫定値で実装着手し、Playwright 観測後に最小化する方針で OK か。

**Opus 推奨**: 🟢 **OK**

---

### Q6. 壁紙：プリセットのみ（URL入力もアップロードも削除）

**質問**: v0.3.0 では壁紙はプリセット 9 種から ID 選択のみ・URL 入力欄もアップロードも実装しない方針で OK か。

**Opus 推奨**: 🟢 **OK**

---

### Q7. 付箋メモ削除

**質問**: 本番にある付箋メモ（IndexedDB 保存）はデモ版から削除する方針で OK か。

**Opus 推奨**: 🟢 **OK（v0.3.0 では削除）**

---

### Q8. localStorage コア5 + 拡張3 split（v4 改訂）

**質問**: localStorage キーは **コア5 必須キー（v0.3.0 確実実装）** + **拡張3キー（v0.3.x 検討・本 Phase 不採用）** に分割する方針で OK か。コア5: `theme / wallpaper_id / slideshow_enabled / slideshow_interval / open_windows`。

**Opus 推奨**: 🟢 **OK**
- Codex 第3回指定の必須5件と完全一致
- 拡張3件は v0.3.x 以降で実装可否を再判断

---

### Q9. 既存4ファイルは「ナビバー追記のみ・業務ロジック非変更・DEMO バナー非変更」

**質問**: ordersystem.html / invoice.html / groupware.html / index.html のナビバーに SAKURA OS リンク 1 行追加・DEMO バナーは触らない方針で OK か。

**Opus 推奨**: 🟢 **OK**

---

## 12. バージョン番号

### 12.1 採番

| 項目 | 値 |
|------|---|
| 新バージョン | **v0.3.0** |
| 旧バージョン | v0.2.0（グループウェア） |
| Bump 区分 | minor（新規機能追加・破壊的変更なし） |

### 12.2 RELEASE_NOTES.md 更新

```markdown
## v0.3.0 (2026-05-XX) — SAKURA OS デモ版追加（Phase 2-B 完了）

### 追加（Phase 2-B 実装）

**SAKURA OS（OS 風ランチャー・クリーンルーム実装）**
- `sakura-os.html` 新規作成
  - 左パネル：時計・天気・アプリグリッド（4件 allowlist + SAKURA AI 準備中タイル）・為替・カレンダー・本日のタスク
  - メイン：ニュースティッカー（固定ダミー）・デスクトップ
  - タスクバー：起動中アプリ・ユーザー名・ログアウト
  - 壁紙：プリセット 9 種（ID 保存のみ・カスタム URL 欄なし・アップロードなし）
  - テーマ：dark/light 切替（localStorage `sakura_demo_os_theme`）
  - **SAKURA AI: B案準備中無効タイル**（クリックでモーダル表示・iframe/外部通信ゼロ）
  - SAKURA MUSIC / 申込み管理 / 利用明細 / 通話明細 / マスコット / 付箋 → デモ版から削除
  - DEMO バナー新規設置（既存 4 ページは触らない）
  - Email/Password + demo_sessions 認証（v0.1.8 と同一方式）
  - Firestore: `demo_calendar_events` / `demo_todos` read only
  - localStorage: `sakura_demo_os_` prefix 統一・コア5キー（必須）
  - sandbox 基本値: `allow-scripts allow-same-origin allow-forms`（実機検証で必要時のみ拡張）
- 既存業務ロジック非破壊（ordersystem / invoice / groupware）
- 既存 DEMO バナー非変更（v0.2.0 設置済を維持）

**ナビゲーションバー更新（4 ページ対応・業務ロジック非変更・DEMO バナー非変更）**
- `ordersystem.html` / `invoice.html` / `groupware.html` — ナビに「🖥️ SAKURA OS」追加
- `index.html` — 機能カードに SAKURA OS 追記（任意）

**Firestore Rules**（変更なし）
- v0.1.8 / v0.2.0 で既にデプロイ済みの v12 Rules で完結

**バックアップ**
- `backups/v0.2.0/` に v0.2.0 時点のファイルを保存
```

---

## 13. 工数見積もり

### 13.1 詳細工数（v4・v3 と同じ・但し検証フェーズ拡充）

| 作業項目 | 工数 |
|---------|:----:|
| **A. sakura-os.html 新規作成（クリーンルーム）** | |
| ┣ 認証・セッション検証・緊急停止 | 1.5h |
| ┣ 左パネル UI（時計・天気・アプリグリッド・為替） | 2.0h |
| ┣ メインエリア UI（ニュース固定ダミー・カレンダー） | 1.5h |
| ┣ ウィンドウシステム（iframe allowlist・ドラッグ・リサイズ） | 2.5h |
| ┣ タスクバー・ログアウト・テーマ切替 | 1.0h |
| ┣ 壁紙パネル（プリセット 9 種・スライドショー切替・ID 保存のみ） | 0.8h |
| ┣ Firestore 連携（demo_calendar_events / demo_todos） | 1.5h |
| ┣ 外部 API（天気・為替）のフォールバック実装 + CSP | 1.0h |
| ┣ localStorage ラッパー（lsSet/lsGet/lsRemove + 禁止値検査） | 0.5h |
| ┣ DEMO バナー新規設置（OS のみ・既存 4 ページは触らない） | 0.3h |
| ┣ SAKURA AI B案タイル + モーダル実装 | 0.3h |
| **B. ナビバー更新（既存 3〜4 ファイル・DEMO バナー非変更）** | 1.0h |
| **C. テスト・検証** | |
| ┣ 本番通信ゼロ検証（Playwright T-OS-01..04 / 11 / 12） | 1.0h |
| ┣ iframe / allowlist 検証（T-OS-05..09） | 1.0h |
| ┣ localStorage prefix + 禁止値検証（T-OS-10 補強版） | 0.5h |
| ┣ 既存回帰テスト + DEMO banner unchanged（T-OS-13） | 0.7h |
| ┣ ALLOWED_HOSTS + NG_PATTERNS 二重防御検査（T-OS-14） | 0.7h |
| ┣ SAKURA AI タイル B案検証（T-OS-15） | 0.5h |
| ┣ scripts/check-no-prod-config.js / detect-pii.js 実行 | 0.5h |
| ┣ **CSP 観測フェーズ + 最小化** | 0.5h |
| ┣ **sandbox 基本値で実機検証 + 拡張要否判断** | 0.5h |
| ┣ 手動 E2E（ログイン → OS 起動 → 各アプリ起動 → SAKURA AI モーダル → ログアウト） | 1.0h |
| ┣ レスポンシブ確認（PC のみ・スマホ対象外） | 0.5h |
| **D. ドキュメント・バックアップ** | |
| ┣ RELEASE_NOTES.md 更新 | 0.5h |
| ┣ backups/v0.2.0/ にバックアップ作成 | 0.3h |
| ┣ memory `project_demo_environment.md` 更新 | 0.2h |
| **E. デプロイ準備** | |
| ┣ WinSCP アップロード手順記載 | 0.3h |
| ┣ ユーザー手動作業の整理（Firestore Console 不要を明記） | 0.2h |
| **合計** | **約 21-24h** |

### 13.2 工数比較

| Phase | 主要作業 | 工数 |
|-------|---------|:---:|
| Phase 2-A v0.1.8 | 認証移行 | 4h |
| Phase 2-A v0.2.0 | グループウェア | 22h |
| Phase 2-B v0.3.0（v3） | SAKURA OS（B案 + T-OS-14/15） | 20-23h |
| **Phase 2-B v0.3.0（v4）** | **SAKURA OS（v3 + CSP 観測 + sandbox 拡張判断）** | **21-24h** |

v3 比較で +1h（CSP 観測 0.5h + sandbox 拡張判断 0.5h）

### 13.3 着手前提条件

- [x] Phase 2-A v0.2.0 デプロイ完了済み
- [x] `demo_calendar_events` / `demo_todos` に seed データあり（v0.2.0 で投入済み）
- [x] `manual-user.html` 存在確認済（iframe allowlist 4件目）
- [x] 既存 4 ページの DEMO バナー設置確認済（v3 では触らない）
- [ ] **Codex 第4回（最終）レビュー完了（v4 ベース）**
- [ ] **ユーザー Q1-Q9 回答受領**（Q4 は sandbox 基本値で OK か拡張値か判断要請）

---

## 14. 着手手順（Sonnet 向け）

1. 本書 v4（または Codex 第4回レビュー後の vN）を再読
2. ユーザーの Q1-Q9 回答を確認（Q4 は sandbox 基本値 / 拡張値の判断回答）
3. memory `project_demo_environment.md` を確認
4. `backups/v0.2.0/` を作成
5. **既存 4 ページの DEMO バナー位置を再確認**（変更しないため）
6. `manual-user.html` の存在を再確認
7. `sakura-os.html` を**ゼロから書き起こし**（本番をコピーしない）
8. localStorage ラッパー（`lsSet/lsGet/lsRemove` + 禁止値検査）を最初に組み込む
9. iframe APP_ALLOWLIST を `Object.freeze` で実装（4件固定）
10. `openApp()` を §3.4.4 OK 例どおりに実装
11. CSP `<meta http-equiv>` を **§5.7.1 暫定値** で設定
12. ニュースは固定ダミー配列で実装（外部 API 呼ばない）
13. SAKURA AI B案タイル + モーダルを実装（iframe/外部通信ゼロ確認）
14. **DEMO バナーを sakura-os.html にのみ新規設置**（既存 4 ページは触らない）
15. `scripts/check-no-prod-config.js` `scripts/detect-pii.js` を実行
16. 既存 3 ファイル（ordersystem/invoice/groupware）のナビバーに SAKURA OS リンクを追加
    - DEMO バナーは絶対に触らない
17. Playwright T-OS-01..15 全 PASS 確認（v4 で 15 項目・完全コード提示済）
18. **CSP 観測フェーズ実施 → connect-src 最小化（§5.7.1 Phase 2/3）**
19. **sandbox 基本値で実機検証 → 必要があれば最小限の拡張属性追加**
20. 手動 E2E
21. RELEASE_NOTES.md を v0.3.0 で更新
22. WinSCP でアップロード（ユーザー手動・Sonnet が手順を案内）

---

## 15. デプロイ手順（WinSCP）

### 15.1 サーバーパス

```
/home/sakura-nets/www/demo/
```

### 15.2 アップロード対象（v0.3.0）

| ファイル | 変更 | 備考 |
|---------|------|------|
| `sakura-os.html` | ✨ 新規 | 必須（DEMO バナー新規含む） |
| `ordersystem.html` | ナビバーのみ変更 | 必須（DEMO バナー非変更） |
| `invoice.html` | ナビバーのみ変更 | 必須（DEMO バナー非変更） |
| `groupware.html` | ナビバーのみ変更 | 必須（DEMO バナー非変更） |
| `index.html` | （任意）機能カード追記 | 任意（DEMO バナー非変更） |

### 15.3 ユーザー手動作業

- ❌ Firestore Console 作業：**不要**（Rules / Index / Collection 全て既存利用）
- ❌ Firebase Authentication 設定：**不要**（v0.1.8 で完了済み）
- ❌ Functions デプロイ：**不要**（リセット対象データなし）
- ✅ WinSCP で 4〜5 ファイルアップロード**のみ**

---

## 16. レビュー履歴

| 版 | 日付 | レビュー | 主な変更 |
|---|---|---|---|
| v1 | 2026-05-10 | Opus 初稿（Codex 第1回レビュー対象） | Phase 2-A v12 と同水準の構成で初稿作成 |
| v2 | 2026-05-10 | Codex 第1回レビュー反映 | iframe allowlist / ニュース固定ダミー / localStorage key prefix / SAKURA AI 二択 / 壁紙アップロード削除 / Playwright テスト 13 項目追加 |
| v3 | 2026-05-10 | Codex 第2回レビュー反映 | SAKURA AI B案固定（A案廃案）/ iframe allowlist 4件確定 / sandbox は補助と明記・最終値変更 / CSP connect-src 最終確定 / localStorage key 名統一 / DEMO バナーは sakura-os.html のみ / Playwright ALLOWED_HOSTS 統合方式 / T-OS-14/15 追加（合計 15 項目） |
| v4 | 2026-05-10 | Codex 第3回レビュー反映（実装前ゲート承認待ち） | iframe allowlist NG/OK コード対比提示 / sandbox 最小限版 / CSP 暫定値 + 観測フェーズ / localStorage コア5 + 拡張3 split / ALLOWED_HOSTS + NG_PATTERNS 二重防御 / T-OS-14 / T-OS-15 完全 Playwright spec コード提示 |
| **v5** | **2026-05-10** | **Codex 第4回レビュー反映（実装前ゲート承認）** | **`referrerpolicy="same-origin"` → `no-referrer` に変更（§3.4.3 HTML サンプル + §3.4.4 JS サンプル両方）。Codex 第4回最終OK条件 15 項目すべて充足確認（§17.4）。実装前ゲート承認 → Sonnet 実装着手可能** |

---

## 17. 採用必須修正チェックリスト

### 17.1 Codex 第1回 v1→v2（7項目・継続維持）

- [x] iframe sandbox 属性の具体値とURL allowlistを明記（§3.4）
- [x] ニュース取得を削除・固定ダミー・demo専用proxyのどれにするか決定 → 固定ダミー採用（§5.8）
- [x] SAKURA AI は削除で確定し、通信ゼロをテストに入れる（§4.4 + §10.8 T-OS-11）
- [x] 壁紙アップロードは初版削除、プリセットID保存のみにする（§5.6 / §6.5）
- [x] localStorage key prefix を定義（§6.5）
- [x] 既存4ファイル変更は「ナビバーUI追記のみ、業務ロジック非変更」と明記（§8.1）
- [x] Playwright の iframe / 外部通信 / 既存回帰テストを追加（§10.8 / 13項目）

**全 7 項目 ✅ 対応済**

### 17.2 Codex 第2回 v2→v3（8項目・継続維持）

- [x] SAKURA AI は二択をやめて B 案固定（§4.4 / §2.1 / §18 Q2）
- [x] iframe URL allowlist の具体値を明記（§3.4.2）
- [x] sandbox は主防御ではなく補助と明記（§3.4.3 / §3.4.6）
- [x] CSP connect-src の具体値を明記（§5.7.1）
- [x] localStorage key の具体一覧を確定（§6.5.2）
- [x] DEMO バナー追加対象の明記（§8 / §10.4）
- [x] Playwright 通信 allowlist 条件を具体化（§10.8.1）
- [x] SAKURA AI 関連通信ゼロを Playwright で明示検査（§10.8.2）

**全 8 項目 ✅ 対応済**

### 17.3 Codex 第3回 v3→v4（6項目・本改訂）

Codex が v3 で挙げた「v4 で具体コード/値を明示提示すべき項目」全てに対し、v4 で対応完了：

- [x] **§3.4 iframe allowlist 4件の実コード/擬似コード提示**（§3.4.4）— OK 例（appId → 固定パス map / Object.freeze / new URL origin 検証）+ NG 例 7 種を完全コードで提示
- [x] **sandbox 最終値を Codex 推奨「最小限版」に変更**（§3.4.3）— 基本3属性 `allow-scripts allow-same-origin allow-forms` + 拡張3属性（実機検証で最小限追加）に切り分け
- [x] **§5.7 CSP connect-src 具体値**（§5.7.1）— 暫定値提示 + ワイルドカード `*` 不採用 + 実装時 Playwright 観測 → 最小化フロー Phase 1/2/3 で明記
- [x] **§6.5 localStorage key 一覧の固定**（§6.5.2）— Codex 必須5件をコア（v0.3.0 確実）/ 拡張3件は v0.3.x 候補に整理 + 禁止 prefix 10種 / 禁止値パターン 6種を網羅
- [x] **§10.8 ALLOWED_HOSTS + NG_PATTERNS 両方提示**（§10.8.1）— ALLOWED_HOSTS 9 件 + NG_PATTERNS 11 件を JS 配列で両方提示・二重防御の評価関数を提示
- [x] **T-OS-14 / T-OS-15 検査条件明記 + Playwright 完全コード**（§10.8.4 / §10.8.5）— 共通ヘッダー + 各テストの完全な spec ファイルコードを提示

**全 6 項目 ✅ 対応済**

### 17.4 Codex 第4回 v4→v5（1項目・本改訂）

Codex 第4回レビューで挙げられた微修正候補に対し、v5 で対応完了：

- [x] **`referrerpolicy="same-origin"` を `no-referrer` に変更**（§3.4.3 HTML サンプル + §3.4.4 JS サンプル）— 既存ページの referrer 依存ゼロを確認の上、より安全側の `no-referrer` を採用

**全 1 項目 ✅ 対応済**

### 17.5 Codex 第4回 最終OK条件 15 項目（v5 で全条件充足確認）

Codex 第4回レビューで提示された「実装前ゲート承認のための 15 条件」すべてが v5 で充足：

- [x] iframe allowlist は 4 件固定（§3.4.2 / §3.4.4）
- [x] 任意 URL 入力なし（§3.4.4 OK 例 + NG 例 7 種）
- [x] query parameter で iframe URL 指定不可（§3.4.4 NG-2 で明示禁止）
- [x] sandbox は補助と明記（§3.4.3 / §3.4.6 多層防御図）
- [x] CSP connect-src に `*` なし（§5.7.1 暫定 CSP 全列挙）
- [x] CSP connect-src に `sakuranet-co.jp/system` なし（§5.7.1 NG 表で明示）
- [x] CSP connect-src に `sakura-ai` なし（§5.7.1 NG 表で明示）
- [x] localStorage key は `sakura_demo_os_` prefix のみ（§6.5.5 lsSet ラッパーで強制）
- [x] base64 / 外部 URL / 本番 URL を localStorage に保存しない（§6.5.4 FORBIDDEN_VALUE_PATTERNS）
- [x] ALLOWED_HOSTS に本番 system 系なし（§10.8.1 A — 9 件のみ・自オリジン + Firebase + 天気 + 為替のみ）
- [x] NG_PATTERNS に `sakura-net-db`, `gw_api.php`, `get_wallpapers.php`, `sakura-ai`, `codex-relay` あり（§10.8.1 B — 11 件で網羅）
- [x] T-OS-14 で allowlist 外通信を失敗扱い（§10.8.4 完全コード）
- [x] T-OS-15 で SAKURA AI 関連通信ゼロ検査（§10.8.5 完全コード）
- [x] SAKURA AI は準備中無効タイルのみ（§4.4 B案固定）
- [x] 既存 4 ページは業務ロジック非変更（§8 ナビバー追記のみ・DEMO バナー非変更）

**全 15 項目 ✅ 充足 → 実装前ゲート承認**

### 17.6 累計テスト項目（v5 時点・15項目・v4 と同数）

| # | 項目 | 由来 |
|:-:|---|:-:|
| T-OS-01 | `sakura-net-db` 通信ゼロ | v2 |
| T-OS-02 | `sakuranet-co.jp/system` 通信ゼロ | v2 |
| T-OS-03 | `gw_api.php` 通信ゼロ | v2 |
| T-OS-04 | `get_wallpapers.php` 通信ゼロ | v2 |
| T-OS-05 | 許可外 iframe URL が openApp で開けない | v2 |
| T-OS-06 | iframe で ordersystem.html 表示 OK | v2 |
| T-OS-07 | iframe で invoice.html 表示 OK | v2 |
| T-OS-08 | iframe で groupware.html 表示 OK | v2 |
| T-OS-09 | Firebase Auth が iframe で壊れない | v2 |
| T-OS-10 | localStorage key prefix 強制（v4 で禁止値検査追加・§10.8.6） | v2 + v4 補強 |
| T-OS-11 | SAKURA AI 関連通信ゼロ（包括） | v2 |
| T-OS-12 | ニュース proxy 通信ゼロ | v2 |
| T-OS-13 | 既存回帰テスト + DEMO banner unchanged | v2 |
| T-OS-14 | ALLOWED_HOSTS + NG_PATTERNS 二重防御（v4 で完全コード提示） | v3 + v4 完全実装化 |
| T-OS-15 | SAKURA AI タイル B案検証（v4 で完全コード提示） | v3 + v4 完全実装化 |

---

## 18. ユーザー判断要請（Q1-Q9・要回答）

| # | 質問 | 既定推奨 | 必要回答 |
|---|---|---|---|
| Q1 | クリーンルーム実装方針（本番コードコピーなし）OK | OK | OK / NG |
| Q2 | SAKURA AI: B案準備中無効タイルで確定 OK | B案確定 | OK / NG |
| Q3 | demo_calendar_events / demo_todos を read のみで使用 OK | OK | OK / NG |
| **Q4** | **iframe URL allowlist + sandbox 基本3属性で実装着手・実機検証で必要分のみ追加 OK（v4 改訂）** | **基本3属性（A）** | **A: 基本3属性 + 実機追加 / B: v3 値（6属性）一括** |
| Q5 | 外部 API は天気・為替のみ・ニュース固定ダミー・CSP は暫定値→観測で最小化 OK | OK | OK / NG |
| Q6 | 壁紙：プリセットのみ（URL入力もアップロードも削除）OK | OK | OK / NG |
| Q7 | 付箋メモ v0.3.0 では削除 OK | OK | OK / NG |
| **Q8** | **localStorage コア5 必須 + 拡張3 split（v4 改訂・拡張は v0.3.x 検討）OK** | **OK** | **OK / NG** |
| Q9 | 既存4ファイル変更は「ナビバー追記のみ・業務ロジック非変更・DEMO バナー非変更」OK | OK | OK / NG |

> **Q4 v3→v4 変更点**: v3 では sandbox 最終値（6属性）の OK/NG 確認だったが、v4 では Codex 第3回推奨に従い **「基本3属性で実装着手・実機検証で必要分のみ追加（A）」 vs 「v3 値（6属性）一括（B）」** の二択判断要請に変更。Opus 推奨は **A**。
> **Q8 v3→v4 変更点**: v3 では key 8 件の保持/削除マトリクスの OK/NG だったが、v4 では **コア5 + 拡張3 split** 方針の OK/NG に変更。

---

## 19. Codex 第4回ステータス更新（実装前ゲート承認）

```
判定: v4 方針 OK / iframe & sandbox 承認 / 微修正 1 点 → v5 で反映
      → 🟢 実装前ゲート承認・Sonnet 実装着手可能

v4 → v5 反映項目（Codex 第4回 微修正 1 点）:
  1. referrerpolicy="same-origin" → "no-referrer"  → §3.4.3 HTML + §3.4.4 JS

採用必須修正チェックリスト（§17）:
  - 第1回（v1→v2）7項目 ✅ 継続対応済
  - 第2回（v2→v3）8項目 ✅ 継続対応済
  - 第3回（v3→v4）6項目 ✅ 継続対応済
  - 第4回（v4→v5）1項目 ✅ 対応済（referrerpolicy 変更）

Codex 第4回最終OK条件 15 項目（§17.5）:
  ✅ 全 15 項目充足 → 実装前ゲート承認

Playwright テスト項目（§10.8）: 15項目（v4 と同数・全項目完全コード提示済）
ユーザー判断要請（§18）: Q1-Q9（Q4 は A/B 二択判断・Q8 は split 方針確認）

事前検証済ファクト:
  - manual-user.html 存在 ✅
  - manual-admin.html 存在 ✅
  - 既存 4 ページの DEMO バナー設置済 ✅
  - iframe allowlist 4 件の相対パス実在 ✅
  - referrer 依存ゼロ確認済（no-referrer 採用根拠）✅

実装前ゲート承認:
  - 🟢 Codex 第4回承認・最終OK条件 15/15 充足
  - ユーザー Q1-Q9 回答（特に Q4 / Q8）→ Sonnet 実装着手
  - 工数: 約 21-24h
```

---

**v4 確認書、以上です。**

Phase 2-A v12 と同水準の構成・粒度で記述、かつ Codex 第1回（7点）+ 第2回（8点）+ 第3回（6点・具体値の明示提示）レビュー指摘を全反映。
コードブロック・OK/NG 対比・表形式を多用し、Codex 第4回（最終）レビューでそのまま承認可否判断ができる完成度。
Codex 第4回レビュー OK → ユーザー Q1-Q9 回答（特に Q4 / Q8）→ Sonnet 実装着手の流れを想定。
