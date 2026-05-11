# SAKURA SYSTEM デモ環境 Phase 2-B 実装プラン v3
## 「SAKURA OS デモ版追加」確認書 v3 — Codex 第2回レビュー反映版

**作成日**: 2026-05-10
**作成者**: Claude (Opus 4.7) — プランニング担当
**対象**: SAKURA-SYSTEM-DEMO **v0.2.0 → v0.3.0**
**ステータス**: 🟡 **Codex 第3回レビュー待ち**（v3 改訂完了・Codex 第2回 全8指摘反映済）
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当
**前提**: Phase 2-A（v0.2.0 グループウェア）デプロイ完了済み
**改訂理由**: Codex 第2回レビューで指摘された 8 項目を v3 に反映（v1, v2 は残置・本書は新規ファイル）

---

## 0. レビュー観点サマリー（Codex 向け）

本書は Phase 2-A v12 と同等の厳密性で記述する。Codex 第2回レビューを受け v3 で以下を全面強化：

1. **SAKURA AI は B案固定（A案廃案）**（§4.4 / §2.1 改訂）— 二択を消去・準備中無効タイル確定
2. **iframe URL allowlist 4 件確定**（§3.4）— `manual-user.html` 存在確認済・NG リスト明記
3. **sandbox は主防御ではなく補助と明記**（§3.4 改訂）— 主防御は URL allowlist + 通信ゼロ検査 + CSP
4. **CSP connect-src 具体値最終確定**（§5.7 改訂）— ニュース外部ドメイン除外
5. **localStorage キー名 Codex 推奨に統一**（§6.5 改訂）— `slideshow_interval` / `open_windows`
6. **DEMO バナー対象は sakura-os.html のみ**（§8 / §10.4 改訂）— 既存 4 ページは設置済・触らない
7. **Playwright 通信 allowlist 統合方式に発展**（§10.8 改訂）— ALLOWED_HOSTS 配列方式 + T-OS-14/15 追加（合計 15 項目）
8. **SAKURA AI 関連通信ゼロを Playwright で明示検査**（§10.8 改訂）— T-OS-15 新規追加

---

## 0.1 Codex 第1回レビュー反映状況サマリー（v1→v2・継続維持）

| # | Codex 第1回 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | iframe sandbox 設計の危険性（同一オリジンでの矛盾） | §3.4 / §10.3 | ✅ 修正済（v2） |
| 2 | ニュース取得プロキシ未定義（本番流用リスク） | §5.8 | ✅ 固定ダミー方式（v2） |
| 3 | 既存4ファイル変更表現の修正（業務ロジック非変更明記） | §8 | ✅ 修正済（v2） |
| 4 | SAKURA AI 削除判断の補強（将来復帰導線） | §4.4 | ✅ 二択化（v2）→ v3 で B案固定 |
| 5 | 新規 Firestore コレクション不要の補強（localStorage key prefix） | §6.5 | ✅ 修正済（v2） |
| 6 | localStorage 壁紙保存の厳格化（base64 禁止・プリセットID のみ） | §5.6 / §6.5 | ✅ 修正済（v2） |
| 7 | 外部APIの扱い厳格化（CSP・allowlist 検査） | §5.7 / §10.8 | ✅ 修正済（v2） |

## 0.2 Codex 第2回レビュー反映状況サマリー（v2→v3・本改訂）

| # | Codex 第2回 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | SAKURA AI は二択をやめ B 案固定 | §4.4 / §2.1 / §18 Q2 | ✅ B案確定・A案廃案 |
| 2 | iframe URL allowlist の具体値を明記（4件存在確認済） | §3.4 / §10.3 | ✅ 4件確定・NGリスト明記 |
| 3 | sandbox は主防御ではなく補助と明記 | §3.4.3 / §3.4.6 | ✅ 主防御 = allowlist + 通信ゼロ + CSP / 最終 sandbox 値変更 |
| 4 | CSP connect-src の具体値を明記 | §5.7.1 | ✅ ニュース外部ドメイン除外・最終確定 |
| 5 | localStorage key の具体一覧を確定 | §6.5.2 | ✅ `slideshow_interval` / `open_windows` に統一 |
| 6 | DEMO バナー追加対象の明記 | §8 / §10.4 | ✅ sakura-os.html のみ・既存4ページは触らない |
| 7 | Playwright 通信 allowlist 条件を具体化 | §10.8 | ✅ ALLOWED_HOSTS 統合方式・T-OS-14 追加 |
| 8 | SAKURA AI 関連通信ゼロを Playwright で明示検査 | §10.8 | ✅ T-OS-15 新規追加 |

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

### 2.1 機能差分マトリクス（v3 で SAKURA AI を B案固定）

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

### 2.2 集計（v3）

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

### 3.4 iframe URL allowlist 設計（Codex 第1回 指摘1 + 第2回 指摘2/3 対応）

#### 3.4.1 背景（Codex 指摘の整理）

**Codex 第1回**:
- 同一オリジン iframe で sandbox を厳しくすると Firebase Auth・localStorage が壊れる可能性
- 逆に `allow-scripts allow-same-origin` を緩く付けると sandbox の防御効果が弱くなる
- → 「sandbox を無理に付けて壊すより、URL allowlist + 本番通信ゼロ検査を優先」

**Codex 第2回（追加）**:
- 同一ドメイン内で Firebase Auth 付きページを iframe 表示する場合、sandbox を厳しくすると壊れる
- `allow-same-origin` + `allow-scripts` は防御効果が弱くなる
- → **「sandbox は主防御ではなく補助」と明確に位置付ける**
- → **主防御は URL allowlist + 本番通信ゼロ検査 + CSP の 3 重多層防御**

#### 3.4.2 iframe 許可 URL 一覧（厳格固定 = allowlist・4 件）

| # | id | URL（相対） | 用途 | 存在確認 |
|:-:|---|---|---|:-:|
| 1 | `customer` | `ordersystem.html` | 顧客管理アプリ | ✅ 存在確認済 |
| 2 | `invoice` | `invoice.html` | 請求書アプリ | ✅ 存在確認済 |
| 3 | `groupware` | `groupware.html` | グループウェアアプリ | ✅ 存在確認済 |
| 4 | `manual` | `manual-user.html` | 使い方ガイド | ✅ 存在確認済 |

> **存在確認ステータス（v3 事前検証）**:
> - `manual-user.html` 存在 ✅
> - `manual-admin.html` 存在 ✅（allowlist 対象外・別経路）
> - 全 4 件のファイル存在を Sonnet 実装着手前に再確認すること

**禁止事項（NGリスト・明示的に列挙）**:
- ❌ 任意 URL を iframe で開く機能を実装しない（ユーザー入力 URL の iframe 表示禁止）
- ❌ 外部ドメイン URL を iframe で開かない
- ❌ `/system/` 配下（本番）を iframe で開かない
- ❌ `https://sakuranet-co.jp/...` 配下（本番）を iframe で開かない
- ❌ `sakura-ai/` 配下を iframe で開かない
- ❌ `gw_api.php` を iframe で開かない（そもそも PHP API は呼ばない）
- ❌ `get_wallpapers.php` を iframe で開かない
- ✅ allowlist にない id を `openApp()` に渡された場合は無視＋console.warn

#### 3.4.3 sandbox 属性の最終値（Codex 第2回 指摘3 対応・主防御から補助へ）

> **重要**: sandbox は **主防御ではなく補助** である。
> **主防御**: ① URL allowlist（§3.4.2）／② 本番通信ゼロ Playwright 検査（§10.8）／③ CSP（§5.7）の 3 重多層防御。
> sandbox は「ユーザー入力 URL を誤って iframe に流し込んだ場合の最終フェイルセーフ」「誤遷移防止補助」という位置付け。

**最終 sandbox 値（v0.3.0 採用・Codex 候補値ベース）**:

```html
<iframe
  src="ordersystem.html"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
  loading="lazy"
  referrerpolicy="same-origin"
></iframe>
```

| 属性 | 必要理由 |
|------|---------|
| `allow-same-origin` | Firebase Auth state を iframe 内で維持・localStorage 共有 |
| `allow-scripts` | アプリ JS 実行（必須） |
| `allow-forms` | 顧客登録・請求書作成等のフォーム送信 |
| `allow-popups` | PDF プレビュー・新規タブ操作 |
| `allow-modals` | confirm/alert ダイアログ |
| `allow-downloads` | 請求書 PDF ダウンロード |

**v2 から削除した属性**:
- ❌ `allow-popups-to-escape-sandbox` — Codex 第2回で「不要・最小限版で十分」とされたため削除

**Codex 候補値との比較**:

| 候補 | 値 | 採用判断 |
|------|---|:---:|
| Codex 最小限案 | `allow-scripts allow-same-origin allow-forms` | ❌ 不採用（PDF DL・モーダル・ポップアップ業務に必要） |
| **v3 採用値** | **`allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads`** | ✅ **採用** |
| v2 値（参考） | `allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox` | ❌ 不採用（escape-sandbox は不要） |

> Codex 注釈: `allow-same-origin` + `allow-scripts` の組合せは sandbox の防御効果を弱めるが、**主防御が allowlist + 通信ゼロ検査 + CSP** であるため許容。sandbox は補助的な役割。

#### 3.4.4 openApp() 実装方針（allowlist チェック）

```javascript
const APP_ALLOWLIST = {
  customer: { url: 'ordersystem.html', title: '顧客管理',     icon: '📋', size: [1200,720] },
  invoice:  { url: 'invoice.html',     title: '請求書',       icon: '🧾', size: [1200,760] },
  groupware:{ url: 'groupware.html',   title: 'グループウェア', icon: '🏢', size: [1400,820] },
  manual:   { url: 'manual-user.html', title: '使い方ガイド',  icon: '📖', size: [900,640]  }
};

function openApp(id) {
  const app = APP_ALLOWLIST[id];
  if (!app) {
    console.warn('[SAKURA OS] Unknown app id:', id);
    return;
  }
  // app.url は allowlist 由来なので任意 URL 注入不可
  createWindow(id, app);
}
```

#### 3.4.5 Firebase Auth が iframe 内で動くかのテスト項目

- [ ] iframe 内で `firebase.auth().currentUser` が null でない（親と共有）
- [ ] iframe 内で `firebase.firestore().collection('demo_*').get()` が成功
- [ ] iframe 内 localStorage が親と同一値を読める（同一オリジン）
- [ ] iframe を最小化→復元しても認証状態維持
- [ ] iframe 内でログアウトすると親も signOut 状態になる（onAuthStateChanged 連動）

#### 3.4.6 多層防御まとめ（Codex 第2回 指摘3 対応）

```
主防御（3 重）
├── ① URL allowlist        → APP_ALLOWLIST 4 件のみ・任意 URL 不可（§3.4.2）
├── ② 通信ゼロ Playwright  → ALLOWED_HOSTS 配列で禁止ドメインへの request 即 fail（§10.8）
└── ③ CSP                  → connect-src / frame-src で許可先限定（§5.7）

補助防御
└── ④ sandbox              → 誤遷移防止・最終フェイルセーフ（§3.4.3）
```

---

## 4. アプリ一覧（SAKURA AI は B案固定）

### 4.1 デモ版アプリ一覧（左パネル「アプリケーション」グリッド）

| # | id | 表示名 | アイコン | URL | サイズ | 状態 |
|:-:|---|---|:-:|---|---|:-:|
| 1 | `customer` | 顧客管理 | 📋 | `ordersystem.html` | 1200×720 | ✅ 有効 |
| 2 | `invoice` | 請求書 | 🧾 | `invoice.html` | 1200×760 | ✅ 有効 |
| 3 | `groupware` | グループウェア | 🏢 | `groupware.html` | 1400×820 | ✅ 有効 |
| 4 | `manual` | 使い方ガイド | 📖 | `manual-user.html` | 900×640 | ✅ 有効 |
| 5 | `ai` | SAKURA AI | 🤖 | — | — | 🚫 **準備中（B案・無効・モーダルのみ）** |

### 4.2 本番から削除するアプリ（一覧根拠）

| 削除アプリ | 削除根拠 |
|------------|---------|
| 申込み管理（hikari） | デモ環境にファイル不存在・ビジネス判断（OEM 体験対象外） |
| 利用明細（usage） | 同上・PII リスクあり |
| 通話明細（call） | 同上・通信明細データはデモ価値が低い |
| SAKURA MUSIC | エンタメ機能・OEM 体験で混乱を招く |
| **SAKURA AI（本体機能）** | **§4.3 / §4.4 の方針で B 案無効タイル化（本体機能としては削除）** |

### 4.3 SAKURA AI 削除判断（重要設計ポイント）

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

### 4.4 【Codex 第2回 指摘1】 SAKURA AI の v0.3.0 採用方式 — **B案固定（A案廃案）**

#### 4.4.1 結論

> **v3 では B 案「準備中無効タイル」に固定する。A 案（完全削除）は廃案。**

#### 4.4.2 B 案採用理由（Codex 第2回 推奨）

| 観点 | 内容 |
|------|------|
| OEM 訴求 | 「本番には SAKURA AI もある」ことを OEM 候補者に視覚的に示せる |
| 通信安全性 | relay / iframe / 外部通信ゼロ・本番 Firestore 接続なし |
| Phase 2-E 復帰 | タイル UI が既に存在するため、将来 AI デモ復帰時に最小コスト |
| 営業デモ自然さ | 「動かしてみたら Coming Soon」は OEM 営業の常套・違和感低 |
| 実装重量 | タイル + モーダルのみ（約 30 行・Sonnet で 0.3h） |

#### 4.4.3 B 案実装条件（厳守）

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
  alert('SAKURA AI はデモ版では準備中です。本番環境でご体験ください。');
  // ↑ alert を Notion 風モーダルに置き換える（DESIGN.md 準拠）
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

#### 4.4.5 v2 → v3 変更点

| 項目 | v2 | v3 |
|------|----|----|
| 採用方式 | A案 / B案 二択（ユーザー選択要請） | **B案固定** |
| Q2 ユーザー判断要請 | 「A or B どちら？」 | **「B案で確定。OK か？」**（選択肢消去） |
| Opus 推奨 | A案 | **B案** |
| §2.1 #9 行 | 「§4.4 で二択」 | **「B案固定: 準備中無効タイル」** |

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

### 5.6 unsubscribe（メモリリーク防止）+ 壁紙保存方針（Codex 第1回 指摘6 対応）

```javascript
window.addEventListener('beforeunload', () => {
  unsubCalendar?.();
  unsubTodos?.();
}, { once: true });
```

#### 壁紙保存ルール（厳格化）

- ❌ `localStorage.setItem('wallpaper', '<base64-image>')` は**禁止**（容量逼迫・パフォーマンス劣化）
- ❌ ユーザー画像アップロード機能は**実装しない**
- ❌ カスタム URL 入力欄も**実装しない**（Codex 推奨に従う）
- ✅ プリセット 9 種から 1 つ選んで **ID のみ保存**
  - 例: `localStorage.setItem('sakura_demo_os_wallpaper_id', 'gradient_3')`
- ✅ スライドショーもプリセット ID 配列のみ
  - 例: `localStorage.setItem('sakura_demo_os_slideshow_ids', '["gradient_1","gradient_3","gradient_5"]')`

---

### 5.7 外部 API CSP 設計（Codex 第1回 指摘7 + 第2回 指摘4 対応・最終確定）

#### 5.7.1 connect-src CSP 許可リスト（v3 最終確定）

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com;
  style-src  'self' 'unsafe-inline';
  img-src    'self' data: https:;
  connect-src 'self'
              https://*.googleapis.com
              https://*.firebaseio.com
              https://firestore.googleapis.com
              https://identitytoolkit.googleapis.com
              https://api.open-meteo.com
              https://open.er-api.com;
  frame-src  'self';
  font-src   'self' data:;
">
```

> **v2 → v3 変更点**: `script-src` から `https://*.googleapis.com` を削除（Codex 第2回推奨に合わせ最小限化）。
> Firebase JS SDK は `https://www.gstatic.com` から CDN 配信されるため、googleapis 系は connect-src のみで十分。

| 許可先 | 用途 | 範囲 |
|--------|------|:---:|
| `'self'` | 同一オリジン（demo.sakuranet-co.jp） | script / connect / frame |
| `https://www.gstatic.com` | Firebase JS SDK CDN | script |
| `*.googleapis.com` / `*.firebaseio.com` | Firebase SDK バックエンド | connect |
| `firestore.googleapis.com` | Firestore | connect |
| `identitytoolkit.googleapis.com` | Firebase Auth | connect |
| `api.open-meteo.com` | 天気 API（無認証） | connect |
| `open.er-api.com` | 為替 API（無認証） | connect |

#### 5.7.2 明示的に **許可しない**（CSP 違反になるべき・Codex 第2回 指摘4 対応で網羅）

- ❌ `https://sakuranet-co.jp` （本番ドメイン全般）
- ❌ `https://sakuranet-co.jp/system/` （本番システム配下）
- ❌ `https://sakura-net-db.*` （本番 Firebase プロジェクト）
- ❌ `https://api.rss2json.com` （v0.3.0 ニュース固定ダミーのため不要）
- ❌ `https://corsproxy.io` （同上）
- ❌ `*.sakura-ai.*` 系全て（撤去）
- ❌ Ollama / Codex Relay 系全て
- ❌ `gw_api.php` を含む本番 PHP API
- ❌ `get_wallpapers.php`

> ニュースが固定ダミーなので、外部ニュース系ドメイン（rss2json / corsproxy / Yahoo RSS）は **CSP に含めない**。

#### 5.7.3 外部 API 失敗時のフォールバック表示

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

#### 5.7.4 通信先 allowlist 検査（Playwright）

- §10.8 のテスト項目で `page.on('request', ...)` を使い、許可外ドメインへの通信があった場合 fail
- v3 では ALLOWED_HOSTS 配列方式に発展（§10.8 参照）

---

### 5.8 ニュース機能の方針変更（Codex 第1回 指摘2 対応・最重要修正）

#### 5.8.1 v1 案の問題点

- v1 では「Yahoo RSS + プロキシ（rss2json / corsproxy.io）」と記載
- Codex 指摘: **「本番 PHP API 流用に見えて危険」**「本番 `/system/.../*.php` プロキシ呼出禁止」
- → v0.3.0 では **完全に固定ダミー配列に切り替える**

#### 5.8.2 v0.3.0 採用方式: 固定ダミーニュース（静的配列）

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

#### 5.8.3 禁止事項（Codex 厳命）

- ❌ 本番 `/system/.../*.php` プロキシ呼出
- ❌ SAKURA AI 側 PHP 流用
- ❌ `sakuranet-co.jp/system` 配下呼出
- ❌ `rss2json` / `corsproxy.io` 依存
- ❌ どうしても入れる場合でも本番 PHP 流用は厳禁

#### 5.8.4 将来計画（Phase 2-B.1 以降）

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

### 6.5 localStorage キー設計（Codex 第1回 指摘5 + 第2回 指摘5 対応）

#### 6.5.1 prefix ルール

- **すべての localStorage キーに `sakura_demo_os_` prefix を付ける**
- **既存の本番系キー名（`sakura-net-db`, `gw_*`, `wp_*`, `mascot_*` 等）は絶対に使わない**
- グループウェア等の他デモ画面と key 衝突しないよう、SAKURA OS 専用 prefix を遵守

#### 6.5.2 v0.3.0 で使用する localStorage キー一覧（v3 最終確定・Codex 第2回推奨に統一）

| key | 値の型 | 用途 | logout 時の挙動 |
|-----|--------|------|:---:|
| `sakura_demo_os_theme` | `'dark' \| 'light'` | テーマ設定 | 保持（次回ログイン時に復元） |
| `sakura_demo_os_wallpaper_id` | `string`（プリセット ID） | 選択中の壁紙ID | 保持 |
| `sakura_demo_os_slideshow_enabled` | `'0' \| '1'` | スライドショー ON/OFF | 保持 |
| `sakura_demo_os_slideshow_interval` | `string` | 切替秒数（既定 30） | 保持 |
| `sakura_demo_os_slideshow_ids` | `string`（JSON 配列） | スライドショー対象プリセット ID 群 | 保持 |
| `sakura_demo_os_open_windows` | `string`（JSON 配列） | 起動中ウィンドウ id 群（再起動復元用） | **削除**（プライバシー配慮） |
| `sakura_demo_os_window_layout` | `string`（JSON） | ウィンドウ位置・サイズ | **削除** |
| `sakura_demo_os_last_seen_at` | `string`（ISO） | 最終起動日時 | 保持（任意） |

> **v2 → v3 変更点（Codex 第2回 指摘5 対応）**:
> - `sakura_demo_os_slideshow_interval_sec` → **`sakura_demo_os_slideshow_interval`**（`_sec` 削除）
> - `sakura_demo_os_open_apps` → **`sakura_demo_os_open_windows`**（windows へ名称統一）

#### 6.5.3 logout 時の保持/削除方針

```javascript
function clearOsTransientStateOnLogout() {
  // 削除対象（個人状態に近いもの）
  ['sakura_demo_os_open_windows',
   'sakura_demo_os_window_layout'].forEach(k => localStorage.removeItem(k));
  // 保持対象（テーマ・壁紙ID 等の好み設定）→ 何もしない
}
```

> 注釈: 同 OEM 端末を複数人で順次デモる想定もあるため、起動済ウィンドウ等は logout で消す。
> テーマ・壁紙は個人特定情報ではないため保持し、次のデモ準備時間を短縮する。

#### 6.5.4 値の禁止事項（Codex 第2回 指摘5 対応で網羅）

- ❌ **base64 画像** をいかなる key にも保存しない（容量逼迫・パフォーマンス劣化）
- ❌ **外部 URL**（カスタム壁紙 URL を含む）を保存しない
- ❌ **本番 URL**（`sakuranet-co.jp/...`）を保存しない
- ❌ `sakura-net-db` prefix の key は使わない
- ❌ `sakura_ai_*` prefix の key は使わない
- ❌ いずれの prefix なしの裸キー（`theme`, `wallpaper` 等）は使わない

#### 6.5.5 禁止 prefix 一覧（Sonnet 実装時の防止）

- ❌ `sakura-net-db*`
- ❌ `gw_*`（本番グループウェア系）
- ❌ `wp_*` / `wallpaper_*`（本番 SAKURA OS 系）
- ❌ `mascot_*` / `ai_*` / `sakura_ai_*`（SAKURA AI 系）
- ❌ `sticky_*`（付箋系）
- ❌ いずれの prefix なしの裸キー

実装時に **「`sakura_demo_os_` で始まらない key を localStorage に書こうとしたら fail させる」グローバルラッパー**を入れる方針：

```javascript
const SAFE_PREFIX = 'sakura_demo_os_';
function lsSet(key, value) {
  if (!key.startsWith(SAFE_PREFIX)) {
    throw new Error(`[SAKURA OS] Forbidden localStorage key: ${key}`);
  }
  localStorage.setItem(key, value);
}
function lsGet(key) {
  if (!key.startsWith(SAFE_PREFIX)) return null;
  return localStorage.getItem(key);
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

以下の機能を追加する場合は新規 `demo_os_*` コレクションが必要になる旨を明記：

| 機能 | 必要コレクション例 | 実装時期 |
|------|-----------------|---------|
| ウィンドウ配置のサーバー保存（端末横断） | `demo_os_user_layout` | Phase 2-B.1+ |
| ユーザー別壁紙設定のサーバー保存 | `demo_os_user_settings` | Phase 2-B.1+ |
| ユーザー別ショートカット | `demo_os_user_shortcuts` | Phase 2-B.1+ |
| スライドショー設定のサーバー保存 | `demo_os_user_settings` | Phase 2-B.1+ |
| OS 起動 analytics | `demo_os_sessions` | Phase 2-C+ |

**v0.3.0 ではすべて localStorage 方針のため新規コレクション不要。**

---

## 8. 既存ファイルへの影響範囲（Codex 第1回 指摘3 + 第2回 指摘6 対応）

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
- **`ordersystem.html` / `invoice.html` / `groupware.html` / `index.html` の `<body>` 直後 DEMO バナー** — 変更なし（v0.2.0 設置済を維持）

---

## 9. 新規 Firestore コレクション

### 結論: **なし**

| 候補 | 必要か | 判断 |
|------|:---:|------|
| `demo_os_settings`（壁紙・テーマ ユーザー別） | ❌ | localStorage で十分・サーバー保存不要 |
| `demo_os_sessions`（誰がいつ起動したか） | ❌ | analytics は本 Phase 対象外 |
| `demo_os_news_cache`（ニュース API キャッシュ） | ❌ | 固定ダミー方式のため不要 |
| `demo_os_wallpapers`（共有壁紙） | ❌ | プリセット 9 種で十分 |

理由: SAKURA OS は**ランチャー**として動作し、データ管理は各アプリ（groupware/invoice/ordersystem）が責務を持つ。
将来的に必要となるケースは §7.5 を参照。

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
- [ ] logout 時に `sakura_demo_os_open_windows` / `sakura_demo_os_window_layout` を削除

### 10.3 iframe sandbox / allowlist（Codex 第2回 指摘2/3 対応）

- [ ] `sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"`（§3.4.3 最終値）
- [ ] iframe `src` は `APP_ALLOWLIST`（4件）の URL のみ
  - `ordersystem.html` / `invoice.html` / `groupware.html` / `manual-user.html`
- [ ] 任意 URL を iframe で開く UI を実装しない
- [ ] 外部サイトを iframe で開かない（本番 SAKURA OS の `/system/` 配下を含めて開かない）
- [ ] iframe 内で Firebase Auth が壊れない（§3.4.5 テスト項目）
- [ ] **sandbox は補助的役割**として位置付け、主防御は allowlist + 通信ゼロ + CSP（§3.4.6）

### 10.4 DEMO バナー（Codex 第2回 指摘6 対応）

- [ ] **対象は `sakura-os.html` のみ**（既存 4 ページは既設置済・変更なし）
- [ ] **SAKURA OS では全画面表示時もバナー消えない**（`position:fixed; z-index:99999`）
- [ ] バナー文言は既存 4 ページと同一テキスト：「⚠️ これはデモ環境です。入力データは架空のものです。本番環境とは完全に分離されています。」
- [ ] バナースタイル（背景色・文字色・パディング）も既存 4 ページと統一
- [ ] 既存 4 ページの DEMO バナーは触らない（変更ゼロを Playwright でも検証）

### 10.5 機密情報

- [ ] 本番 API キーがソース内に存在しない（`scripts/check-no-prod-config.js` で検証）
- [ ] PII データシード不要（`scripts/detect-pii.js` 適用対象外だが念のため）
- [ ] localStorage に保存するデータ：壁紙ID・テーマ・スライドショー設定のみ（個人情報ゼロ）
- [ ] localStorage キーは `sakura_demo_os_` prefix のみ（§6.5）
- [ ] localStorage に base64 画像・外部 URL・本番 URL を保存しない（§6.5.4）

### 10.6 通信ゼロ検証

- [ ] `tests/no-prod-network.spec.js` 拡張（`sakura-os.html` の起動を含める）
- [ ] Playwright で SAKURA OS 起動 → 各アプリ open → close → 本番ドメインへの通信ゼロ確認
- [ ] ALLOWED_HOSTS 配列方式で許可外ドメインへの通信を即 fail（§10.8）

### 10.7 緊急停止スイッチ

- [ ] `demo_config/emergency_stop.enabled == true` 時、即座に画面差し替え
- [ ] 既存 4 ページと同じテキスト・スタイル

---

### 10.8 Playwright テスト項目（v3 で 15 項目に発展・Codex 第2回 指摘7/8 対応）

#### 10.8.1 通信 allowlist 設計（ALLOWED_HOSTS 統合方式）

```javascript
const ALLOWED_HOSTS = [
  /\.googleapis\.com$/,
  /\.firebaseio\.com$/,
  /^api\.open-meteo\.com$/,
  /^open\.er-api\.com$/,
  /^demo\.sakuranet-co\.jp$/,
  /^www\.gstatic\.com$/   // Firebase JS SDK CDN
];

page.on('request', req => {
  const url = new URL(req.url());
  const ok = ALLOWED_HOSTS.some(re => re.test(url.hostname));
  if (!ok) throw new Error('Disallowed host: ' + url.hostname);
});
```

**禁止ドメイン（明示・許可リストにない全てが禁止だが、特に重要なものを列挙）**:

| 禁止 | 理由 |
|------|------|
| `sakuranet-co.jp/system` | 本番 |
| `sakura-net-db` 系 | 本番 Firebase |
| `*.sakura-ai.*` 系全て | SAKURA AI 関連 |
| `codex-relay` | SAKURA AI バックエンド |
| `gw_api.php` | 本番 PHP API |
| `get_wallpapers.php` | 本番 PHP API |
| `rss2json` | ニュース proxy（不要） |
| `corsproxy.io` | ニュース proxy（不要） |

**許可ドメイン（ALLOWED_HOSTS にマッチするもののみ）**:

| 許可 | 用途 |
|------|------|
| `*.googleapis.com` | Firebase / Firestore / Auth |
| `*.firebaseio.com` | Firebase Realtime DB（使わないが SDK が叩く可能性） |
| `firestore.googleapis.com` | Firestore（googleapis.com サブドメイン） |
| `identitytoolkit.googleapis.com` | Firebase Auth（googleapis.com サブドメイン） |
| `api.open-meteo.com` | 天気 API |
| `open.er-api.com` | 為替 API |
| `demo.sakuranet-co.jp` | 自オリジン |
| `www.gstatic.com` | Firebase JS SDK CDN |

#### 10.8.2 テスト項目（v3 で 15 項目）

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
[ ] T-OS-14  【新規】ALLOWED_HOSTS 配列外のドメインへの通信が一切発生しない（包括テスト）
[ ] T-OS-15  【新規】SAKURA AI タイルクリックでモーダル表示・iframe/外部通信ゼロ（B案検証）
```

#### 10.8.3 Playwright 実装雛形（ALLOWED_HOSTS 統合方式）

```javascript
const ALLOWED_HOSTS = [
  /\.googleapis\.com$/,
  /\.firebaseio\.com$/,
  /^api\.open-meteo\.com$/,
  /^open\.er-api\.com$/,
  /^demo\.sakuranet-co\.jp$/,
  /^www\.gstatic\.com$/
];

test('T-OS-14 allowlist comprehensive', async ({ page }) => {
  page.on('request', req => {
    const url = new URL(req.url());
    const ok = ALLOWED_HOSTS.some(re => re.test(url.hostname));
    if (!ok) throw new Error('Disallowed host: ' + url.hostname);
  });
  await page.goto('https://demo.sakuranet-co.jp/sakura-os.html');
  // login → open all 4 apps → close all → wait
  // ALLOWED_HOSTS にマッチしない通信があれば即 fail
});

test('T-OS-15 SAKURA AI tile no traffic', async ({ page }) => {
  const aiBanned = [/sakura-ai/, /codex-relay/, /\.sakura-ai\./];
  page.on('request', req => {
    for (const b of aiBanned) {
      if (b.test(req.url())) throw new Error('SAKURA AI traffic detected: ' + req.url());
    }
  });
  await page.goto('https://demo.sakuranet-co.jp/sakura-os.html');
  // login → click 🤖 SAKURA AI tile → modal appears
  await page.click('#app-tile-ai');
  // モーダル文言確認
  await expect(page.locator('text=デモ版では準備中')).toBeVisible();
  // モーダル閉じる
  // SAKURA AI 系通信ゼロのまま終了確認
});
```

---

## 11. Codex レビュー用 Q&A（判断ポイント）

### Q1. クリーンルーム実装方針

**質問**: 本番 `sakura-os.html`（1949 行）を「構造参考・コードコピーなし」で再実装する方針は妥当か。Phase 2-A の `groupware.html` と同方針で OK か。

**Opus 推奨**: 🟢 **OK**
- Phase 2-A で実証済み・Sonnet が完遂
- 「構造の参考」は ToS・著作権上問題なし（自社コード）
- コピーすると本番 Firebase config / API URL の混入リスクあり

---

### Q2. SAKURA AI 削除方式 — **B案固定（v3 で確定）**

**質問**: SAKURA AI を **B案「準備中無効タイル」固定** で OK か。

**Opus 推奨**: 🟢 **B案で確定**（v2 では A案推奨だったが Codex 第2回で B案に変更）
- OEM 候補者に「本番には SAKURA AI もある」ことを示せる
- relay/iframe/外部通信ゼロ
- Phase 2-E で AI デモ復帰時の導線として機能
- 営業デモとして「Coming Soon」は自然

---

### Q3. Firestore コレクション戦略

**質問**: 既存 `demo_calendar_events` / `demo_todos` を **read のみ** で使う方針で OK か。

**Opus 推奨**: 🟢 **既存 read のみ**
- グループウェアとデータ一貫性が取れる
- 新規コレクションは Rules 拡張・seed・Phase 2-D 対象拡大を招く
- write しないため Rules 影響ゼロ

---

### Q4. iframe URL allowlist + sandbox 具体値（v3 改訂）

**質問**: §3.4 の iframe URL allowlist（4件）+ sandbox 最終値で OK か。

**Opus 推奨**: 🟢 **OK**
- allowlist: `ordersystem.html` / `invoice.html` / `groupware.html` / `manual-user.html` のみ（4件全て存在確認済）
- sandbox 最終値: `allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads`
  - v2 から `allow-popups-to-escape-sandbox` を削除（Codex 第2回推奨）
- **sandbox は主防御ではなく補助** と明記（Codex 第2回指摘3対応）
- 主防御は URL allowlist + 通信ゼロ Playwright + CSP の 3 重多層防御

---

### Q5. 外部 API（天気・為替）+ ニュース固定ダミー

**質問**: 天気（Open-Meteo）/ 為替（open.er-api.com）のみ外部 API、ニュースは v0.3.0 では固定ダミーで OK か。

**Opus 推奨**: 🟢 **OK**
- ニュースは固定ダミー（§5.8）
- CSP connect-src で許可ドメイン限定（§5.7・v3 で最終確定）
- 外部ニュース系ドメイン（rss2json / corsproxy / Yahoo RSS）は CSP に含めない
- フォールバック表示あり（§5.7.3）
- Phase 2-B.1 以降で demo 専用 proxy 検討

---

### Q6. 壁紙：プリセットのみ（URL入力もアップロードも削除）

**質問**: v0.3.0 では壁紙はプリセット 9 種から ID 選択のみ・URL 入力欄もアップロードも実装しない方針で OK か。

**Opus 推奨**: 🟢 **OK**
- localStorage に base64 保存は容量リスク
- カスタム URL 入力は Codex 推奨どおり削除
- スライドショーもプリセット ID のみ
- 将来必要なら Phase 2-B.1 で IndexedDB or Storage 連携検討

---

### Q7. 付箋メモ削除

**質問**: 本番にある付箋メモ（IndexedDB 保存）はデモ版から削除する方針で OK か。

**Opus 推奨**: 🟢 **OK（v0.3.0 では削除）**
- グループウェアの掲示板で代替可能
- IndexedDB 連携は実装重量大
- 必要なら Phase 2-B.1 で `demo_sticky_notes` コレクション新設して追加

---

### Q8. localStorage key prefix `sakura_demo_os_` 統一（v3 で名称統一）

**質問**: localStorage キーは全て `sakura_demo_os_` prefix で統一・他 prefix は書き込み禁止する方針で OK か。

**Opus 推奨**: 🟢 **OK**
- 本番系 key（`sakura-net-db`, `gw_*`, `wp_*`, `mascot_*` 等）と衝突回避
- グローバルラッパー `lsSet/lsGet` で強制（§6.5.5）
- Codex 第2回推奨に合わせ key 名統一（v3 改訂）:
  - `slideshow_interval_sec` → **`slideshow_interval`**
  - `open_apps` → **`open_windows`**
- Playwright T-OS-10 で検査

---

### Q9. 既存4ファイルは「ナビバー追記のみ・業務ロジック非変更・DEMO バナー非変更」

**質問**: ordersystem.html / invoice.html / groupware.html / index.html のナビバーに SAKURA OS リンク 1 行追加・DEMO バナーは触らない方針で OK か。

**Opus 推奨**: 🟢 **OK**
- §8 で変更対象・差分・業務ロジック非変更を明記
- **DEMO バナーは既存 4 ページに既設置済 — 変更しない**（Codex 第2回指摘6対応）
- DEMO バナー追加は新規 `sakura-os.html` のみ
- Playwright 既存回帰テスト + DEMO banner unchanged テストで保証

---

## 12. バージョン番号

### 12.1 採番

| 項目 | 値 |
|------|---|
| 新バージョン | **v0.3.0** |
| 旧バージョン | v0.2.0（グループウェア） |
| Bump 区分 | minor（新規機能追加・破壊的変更なし） |

### 12.2 命名規則

- v0.3.0: SAKURA OS デモ版本体追加
- v0.3.x（パッチ）: バグ修正のみ

ナビバー追加も同時実施するため **v0.3.0 で全て完結**。

### 12.3 RELEASE_NOTES.md 更新

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
  - localStorage: `sakura_demo_os_` prefix 統一
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

### 13.1 詳細工数（v3 改訂後）

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
| ┣ localStorage ラッパー（`sakura_demo_os_` prefix 強制） | 0.3h |
| ┣ DEMO バナー新規設置（OS のみ・既存 4 ページは触らない） | 0.3h |
| ┣ **SAKURA AI B案タイル + モーダル実装** | 0.3h |
| **B. ナビバー更新（既存 3〜4 ファイル・DEMO バナー非変更）** | 1.0h |
| **C. テスト・検証** | |
| ┣ 本番通信ゼロ検証（Playwright T-OS-01..04 / 11 / 12） | 1.0h |
| ┣ iframe / allowlist 検証（T-OS-05..09） | 1.0h |
| ┣ localStorage prefix 検証（T-OS-10） | 0.3h |
| ┣ 既存回帰テスト + DEMO banner unchanged（T-OS-13） | 0.7h |
| ┣ **ALLOWED_HOSTS 統合検査（T-OS-14）** | 0.5h |
| ┣ **SAKURA AI タイル通信ゼロ検査（T-OS-15）** | 0.3h |
| ┣ scripts/check-no-prod-config.js / detect-pii.js 実行 | 0.5h |
| ┣ 手動 E2E（ログイン → OS 起動 → 各アプリ起動 → SAKURA AI モーダル → ログアウト） | 1.0h |
| ┣ レスポンシブ確認（PC のみ・スマホ対象外） | 0.5h |
| **D. ドキュメント・バックアップ** | |
| ┣ RELEASE_NOTES.md 更新 | 0.5h |
| ┣ backups/v0.2.0/ にバックアップ作成 | 0.3h |
| ┣ memory `project_demo_environment.md` 更新 | 0.2h |
| **E. デプロイ準備** | |
| ┣ WinSCP アップロード手順記載 | 0.3h |
| ┣ ユーザー手動作業の整理（Firestore Console 不要を明記） | 0.2h |
| **合計** | **約 20-23h** |

### 13.2 工数比較（Phase 2-A 実績との対比）

| Phase | 主要作業 | 工数 |
|-------|---------|:---:|
| Phase 2-A v0.1.8 | 認証移行 | 4h |
| Phase 2-A v0.2.0 | グループウェア | 22h |
| Phase 2-B v0.3.0（v2） | SAKURA OS | 19-22h |
| **Phase 2-B v0.3.0（v3）** | **SAKURA OS（B案 + T-OS-14/15）** | **20-23h** |

v2 比較で +1h（B案実装 0.3h + T-OS-14 0.5h + T-OS-15 0.3h - 軽微な見直し）

### 13.3 着手前提条件

- [x] Phase 2-A v0.2.0 デプロイ完了済み
- [x] `demo_calendar_events` / `demo_todos` に seed データあり（v0.2.0 で投入済み）
- [x] `manual-user.html` 存在確認済（iframe allowlist 4件目）
- [x] 既存 4 ページの DEMO バナー設置確認済（v3 では触らない）
- [ ] **Codex 第3回レビュー完了（v3 ベース）**
- [ ] **ユーザー Q1-Q9 回答受領**（Q2 は B案確定の OK/NG 確認のみ）

---

## 14. 着手手順（Sonnet 向け）

1. 本書 v3（または Codex 第3回レビュー後の vN）を再読
2. ユーザーの Q1-Q9 回答を確認（Q2 は B案で確定の OK 確認のみ）
3. memory `project_demo_environment.md` を確認
4. `backups/v0.2.0/` を作成
5. **既存 4 ページの DEMO バナー位置を再確認**（変更しないため）
6. `manual-user.html` の存在を再確認
7. `sakura-os.html` を**ゼロから書き起こし**（本番をコピーしない）
8. localStorage ラッパー（`sakura_demo_os_` 強制）を最初に組み込む
9. iframe APP_ALLOWLIST を実装（4件固定）
10. CSP `<meta http-equiv>` を設定
11. ニュースは固定ダミー配列で実装（外部 API 呼ばない）
12. **SAKURA AI B案タイル + モーダルを実装**（iframe/外部通信ゼロ確認）
13. **DEMO バナーを sakura-os.html にのみ新規設置**（既存 4 ページは触らない）
14. `scripts/check-no-prod-config.js` `scripts/detect-pii.js` を実行
15. 既存 3 ファイル（ordersystem/invoice/groupware）のナビバーに SAKURA OS リンクを追加
    - DEMO バナーは絶対に触らない
16. Playwright T-OS-01..15 全 PASS 確認（v3 で 15 項目）
17. 手動 E2E
18. RELEASE_NOTES.md を v0.3.0 で更新
19. WinSCP でアップロード（ユーザー手動・Sonnet が手順を案内）

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
| **v3** | **2026-05-10** | **Codex 第2回レビュー反映** | **SAKURA AI B案固定（A案廃案） / iframe allowlist 4件確定（manual-user.html 存在確認済） / sandbox は補助と明記・最終値変更 / CSP connect-src 最終確定 / localStorage key 名統一（slideshow_interval / open_windows） / DEMO バナーは sakura-os.html のみ（既存 4 ページ非変更） / Playwright ALLOWED_HOSTS 統合方式 / T-OS-14/15 追加（合計 15 項目）** |

---

## 17. 採用必須修正チェックリスト

### 17.1 Codex 第1回 v1→v2（7項目・継続維持）

Codex が v1 で挙げた「v2 で直すべき項目」全てに対し、v2 で対応完了：

- [x] iframe sandbox 属性の具体値とURL allowlistを明記（§3.4）
- [x] ニュース取得を削除・固定ダミー・demo専用proxyのどれにするか決定 → 固定ダミー採用（§5.8）
- [x] SAKURA AI は削除で確定し、通信ゼロをテストに入れる（§4.4 + §10.8 T-OS-11）
- [x] 壁紙アップロードは初版削除、プリセットID保存のみにする（§5.6 / §6.5）
- [x] localStorage key prefix を定義（§6.5）
- [x] 既存4ファイル変更は「ナビバーUI追記のみ、業務ロジック非変更」と明記（§8.1）
- [x] Playwright の iframe / 外部通信 / 既存回帰テストを追加（§10.8 / 13項目）

**全 7 項目 ✅ 対応済**

### 17.2 Codex 第2回 v2→v3（8項目・本改訂）

Codex が v2 で挙げた「v3 で直すべき項目」全てに対し、v3 で対応完了：

- [x] **SAKURA AI は二択をやめて B 案固定**（§4.4 / §2.1 / §18 Q2）— A案廃案・選択肢消去
- [x] **iframe URL allowlist の具体値を明記**（§3.4.2）— 4件確定（manual-user.html 存在確認済）・NGリスト網羅
- [x] **sandbox は主防御ではなく補助と明記**（§3.4.3 / §3.4.6）— 主防御 = allowlist + 通信ゼロ + CSP / sandbox 最終値変更（escape-sandbox 削除）
- [x] **CSP connect-src の具体値を明記**（§5.7.1）— 最終確定・ニュース外部ドメイン除外
- [x] **localStorage key の具体一覧を確定**（§6.5.2）— `slideshow_interval` / `open_windows` に名称統一
- [x] **DEMO バナー追加対象の明記**（§8 / §10.4）— sakura-os.html のみ・既存 4 ページは触らない
- [x] **Playwright 通信 allowlist 条件を具体化**（§10.8.1）— ALLOWED_HOSTS 統合方式・T-OS-14 追加
- [x] **SAKURA AI 関連通信ゼロを Playwright で明示検査**（§10.8.2）— T-OS-15 新規追加

**全 8 項目 ✅ 対応済**

### 17.3 累計テスト項目（v3 時点・15項目）

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
| T-OS-10 | localStorage key prefix 強制 | v2 |
| T-OS-11 | SAKURA AI 関連通信ゼロ（包括） | v2 |
| T-OS-12 | ニュース proxy 通信ゼロ | v2 |
| T-OS-13 | 既存回帰テスト + DEMO banner unchanged | v2 |
| **T-OS-14** | **ALLOWED_HOSTS 配列外通信ゼロ（包括）** | **v3 新規** |
| **T-OS-15** | **SAKURA AI タイル B案検証（モーダル + 通信ゼロ）** | **v3 新規** |

---

## 18. ユーザー判断要請（Q1-Q9・要回答）

| # | 質問 | 既定推奨 | 必要回答 |
|---|---|---|---|
| Q1 | クリーンルーム実装方針（本番コードコピーなし）OK | OK | OK / NG |
| **Q2** | **SAKURA AI: B案準備中無効タイルで確定 OK（A案廃案）** | **B案確定** | **OK / NG**（選択肢消去） |
| Q3 | demo_calendar_events / demo_todos を read のみで使用 OK | OK | OK / NG |
| Q4 | iframe URL allowlist + sandbox 最終値（§3.4・v3 改訂）OK | OK | OK / NG |
| Q5 | 外部 API は天気・為替のみ・ニュース固定ダミー OK | OK | OK / NG |
| Q6 | 壁紙：プリセットのみ（URL入力もアップロードも削除）OK | OK | OK / NG |
| Q7 | 付箋メモ v0.3.0 では削除 OK | OK | OK / NG |
| Q8 | localStorage key prefix `sakura_demo_os_` 統一 + 名称変更（slideshow_interval / open_windows）OK | OK | OK / NG |
| Q9 | 既存4ファイル変更は「ナビバー追記のみ・業務ロジック非変更・DEMO バナー非変更」OK | OK | OK / NG |

> **Q2 v2→v3 変更点**: v2 では「A案 / B案 のどちらにするか」と二択を要請したが、Codex 第2回推奨により **B案で確定** に変更。Q2 は B案で進めて OK か NG かのみの確認となる。

---

## 19. Codex 第2回ステータス更新

```
判定: v2 方針 OK / v2 実装 NG → v3 で全反映済 → 実装判断 🟡 Codex 第3回レビュー待ち

v2 → v3 反映項目（Codex 第2回 必須8点）:
  1. SAKURA AI 二択を B案固定                    → §4.4 / §2.1 / §18 Q2 で B案確定・A案廃案
  2. iframe URL allowlist の具体値明記          → §3.4.2 で 4件確定（manual-user.html 存在確認済）+ NGリスト網羅
  3. sandbox は主防御ではなく補助と明記          → §3.4.3 / §3.4.6 で多層防御明示・最終 sandbox 値変更（escape-sandbox 削除）
  4. CSP connect-src 具体値最終確定              → §5.7.1 でニュース外部ドメイン除外・最終値確定
  5. localStorage key 具体一覧確定               → §6.5.2 で slideshow_interval / open_windows に名称統一
  6. DEMO バナー対象明記                         → §8 / §10.4 で sakura-os.html のみ（既存 4 ページは触らない）
  7. Playwright 通信 allowlist 統合方式          → §10.8.1 で ALLOWED_HOSTS 配列方式・T-OS-14 追加
  8. SAKURA AI 関連通信ゼロを Playwright で検査  → §10.8.2 で T-OS-15 新規追加

採用必須修正チェックリスト（§17）:
  - 第1回（v1→v2）7項目 ✅ 継続対応済
  - 第2回（v2→v3）8項目 ✅ 全項目対応済

Playwright テスト項目（§10.8）: 15項目（v2 13項目 + v3 +2項目）
ユーザー判断要請（§18）: Q1-Q9（Q2 は B案確定の OK/NG のみ・選択肢消去）

事前検証済ファクト:
  - manual-user.html 存在 ✅
  - manual-admin.html 存在 ✅
  - 既存 4 ページの DEMO バナー設置済 ✅（ordersystem.html L1017 等）

Sonnet 実装着手: 🟡 待機（Codex 第3回 OK + ユーザー Q1-Q9 回答 後）
```

---

**v3 確認書、以上です。**

Phase 2-A v12 と同水準の構成・粒度で記述、かつ Codex 第1回（7点）+ 第2回（8点）レビュー指摘を全反映。
Codex 第3回レビュー受領 → ユーザー Q1-Q9 回答 → v4（必要時）or 実装着手判定 の流れを想定。
