# SAKURA SYSTEM デモ環境 Phase 2-B 実装プラン v2
## 「SAKURA OS デモ版追加」確認書 v2 — Codex 第1回レビュー反映版

**作成日**: 2026-05-10
**作成者**: Claude (Opus 4.7) — プランニング担当
**対象**: SAKURA-SYSTEM-DEMO **v0.2.0 → v0.3.0**
**ステータス**: 🟡 **Codex 第2回レビュー待ち**（v2 改訂完了・全7指摘反映済）
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当
**前提**: Phase 2-A（v0.2.0 グループウェア）デプロイ完了済み
**改訂理由**: Codex 第1回レビューで指摘された 7 項目を v2 に反映（v1 は残置・本書は新規ファイル）

---

## 0. レビュー観点サマリー（Codex 向け）

本書は Phase 2-A v12 と同等の厳密性で記述する。Codex 第1回レビューを受け v2 で以下を全面強化：

1. **iframe URL allowlist 設計**（§3.4 新規）— sandbox 属性の具体値・許可URL固定
2. **ニュース機能を初版は固定ダミー化**（§5.8 新規）— 本番 PHP プロキシ流用厳禁
3. **既存4ファイル変更を「ナビバー UI 追記のみ・業務ロジック非変更」と明記**（§8 改訂）
4. **SAKURA AI 削除を二択化**（§4.4 新規）— A案完全削除 / B案準備中無効タイル
5. **localStorage キー prefix `sakura_demo_os_` 統一**（§6.5 新規）
6. **壁紙はプリセットID保存のみ**（§5 / §6 改訂）— カスタムURL・アップロード機能 v0.3.0 では削除
7. **外部 API CSP 設計・通信allowlist検査**（§5.7 新規）
8. **Playwright テスト項目 13 件追加**（§10.8 新規）

---

## 0.1 Codex 第1回レビュー反映状況サマリー

| # | Codex 指摘 | 反映先セクション | 状態 |
|:-:|---|---|:-:|
| 1 | iframe sandbox 設計の危険性（同一オリジンでの矛盾） | §3.4 / §10.3 | ✅ 修正済 |
| 2 | ニュース取得プロキシ未定義（本番流用リスク） | §5.8 | ✅ 固定ダミー方式へ |
| 3 | 既存4ファイル変更表現の修正（業務ロジック非変更明記） | §8 | ✅ 修正済 |
| 4 | SAKURA AI 削除判断の補強（将来復帰導線） | §4.4 | ✅ 二択化 |
| 5 | 新規 Firestore コレクション不要の補強（localStorage key prefix） | §6.5 | ✅ 修正済 |
| 6 | localStorage 壁紙保存の厳格化（base64 禁止・プリセットID のみ） | §5.6 / §6.5 | ✅ 修正済 |
| 7 | 外部APIの扱い厳格化（CSP・allowlist 検査） | §5.7 / §10.8 | ✅ 修正済 |

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
| Phase 2-E | SAKURA AI デモ化（必要なら） |

### 1.3 鉄則の継承（Phase 2-A から）

- ✅ 本番（sakuranet-co.jp）と**完全分離**（別 Firebase プロジェクト）
- ✅ 既存業務ロジック**非破壊**
- ✅ Email/Password + `demo_sessions` 認証（v0.1.8 以来）
- ✅ 全新規コレクションは `demo_*` プレフィックス（本 Phase では新規コレクション**なし**）
- ✅ クリーンルーム実装（本番コードを参照するが**コピーしない**）
- ✅ **本番 PHP API（gw_api.php / get_wallpapers.php / sakura-ai 配下）一切呼ばない**
- ✅ **localStorage キーは `sakura_demo_os_` prefix 統一**
- ✅ **iframe URL allowlist + 通信ゼロ Playwright 検査**

---

## 2. 本番との差分一覧（何を使う・何を削る・何を置き換える）

### 2.1 機能差分マトリクス

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
| 9 | SAKURA AI（左パネルアイコン） | あり | **§4.4 で二択**（A:完全削除 / B:準備中タイル） | ❌/🔵 |
| 10 | SAKURA AI パネル（右側 iframe） | あり | **削除**（A/B どちらでも撤去） | ❌ 削除 |
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
| 28 | DEMO バナー | なし | **追加必須**（既存 4 ページと統一） | ➕ 追加 |
| 29 | ログアウト | `index.php?logout=1` | `firebase.auth().signOut()` → `index.html` | 🔄 置換 |

### 2.2 集計

| 区分 | 件数 |
|------|:---:|
| ✅ そのまま流用 | 7 |
| ✅ 構造参考・再実装（クリーンルーム） | 4 |
| 🔄 置換（API/URL 差し替え） | 8 |
| 🔄 簡略化（v0.3.0 で機能縮小） | 2 |
| ❌ 削除 | 7 |
| ❌/🔵 二択（SAKURA AI） | 1 |
| ➕ 新規追加 | 1（DEMO バナー） |

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

### 3.4 【新規】iframe URL allowlist 設計（Codex 第1回 指摘1 対応）

#### 3.4.1 背景（Codex 指摘）

- 同一オリジン iframe で sandbox を厳しくすると Firebase Auth・localStorage が壊れる可能性
- 逆に `allow-scripts allow-same-origin` を緩く付けると sandbox の防御効果が弱くなる
- → **「sandbox を無理に付けて壊すより、URL allowlist + 本番通信ゼロ検査を優先」**（Codex 推奨）

#### 3.4.2 iframe 許可 URL 一覧（厳格固定 = allowlist）

| # | id | URL（相対） | 用途 | 備考 |
|:-:|---|---|---|---|
| 1 | `customer` | `ordersystem.html` | 顧客管理アプリ | 同一オリジン |
| 2 | `invoice` | `invoice.html` | 請求書アプリ | 同一オリジン |
| 3 | `groupware` | `groupware.html` | グループウェアアプリ | 同一オリジン |
| 4 | `manual` | `manual-user.html` | 使い方ガイド | 同一オリジン |

**禁止事項**:
- ❌ 任意 URL を iframe で開く機能を実装しない
- ❌ 外部ドメイン URL を iframe で開かない
- ❌ `/system/` 配下（本番）を iframe で開かない
- ❌ ユーザー入力 URL の iframe 表示禁止
- ✅ allowlist にない id を `openApp()` に渡された場合は無視＋console.warn

#### 3.4.3 sandbox 属性の具体値（最終確定）

```html
<iframe
  src="ordersystem.html"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox"
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
| `allow-downloads` | 請求書 PDF ダウンロード |
| `allow-modals` | confirm/alert ダイアログ |
| `allow-popups-to-escape-sandbox` | popup でログアウト等の遷移を妨げない |

> Codex 注釈: `allow-same-origin` + `allow-scripts` の組合せは sandbox の防御効果を弱めるが、**同一オリジン allowlist** + **Playwright 通信ゼロ検査** で多層防御する方針。

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

---

## 4. アプリ一覧（SAKURA AI 削除判断含む）

### 4.1 デモ版アプリ一覧（左パネル「アプリケーション」グリッド）

| # | id | 表示名 | アイコン | URL | サイズ | 状態 |
|:-:|---|---|:-:|---|---|:-:|
| 1 | `customer` | 顧客管理 | 📋 | `ordersystem.html` | 1200×720 | ✅ 有効 |
| 2 | `invoice` | 請求書 | 🧾 | `invoice.html` | 1200×760 | ✅ 有効 |
| 3 | `groupware` | グループウェア | 🏢 | `groupware.html` | 1400×820 | ✅ 有効 |
| 4 | `manual` | 使い方ガイド | 📖 | `manual-user.html` | 900×640 | ✅ 有効 |
| 5 | `ai`（B案採用時のみ） | SAKURA AI | 🤖 | — | — | 🚫 準備中（無効・モーダルのみ） |

### 4.2 本番から削除するアプリ（一覧根拠）

| 削除アプリ | 削除根拠 |
|------------|---------|
| 申込み管理（hikari） | デモ環境にファイル不存在・ビジネス判断（OEM 体験対象外） |
| 利用明細（usage） | 同上・PII リスクあり |
| 通話明細（call） | 同上・通信明細データはデモ価値が低い |
| SAKURA MUSIC | エンタメ機能・OEM 体験で混乱を招く |
| **SAKURA AI** | **§4.3 / §4.4 で個別判断（A/B 二択）** |

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

### 4.4 【新規】SAKURA AI の v0.3.0 採用方式（A案 / B案 二択・Codex 第1回 指摘4 対応）

ユーザー Q2 で以下のいずれかを選択してください。

#### A案: 完全削除（Opus 推奨・シンプル最優先）

| 項目 | 内容 |
|------|------|
| 左パネルアイコン | `APPS` 配列に `id:'ai'` を含めない |
| 右側 AI パネル | DOM 要素ごと存在しない |
| マスコット動画 | DOM 要素ごと存在しない |
| iframe / relay 接続 | 一切なし |
| 通信 | 一切なし |
| 実装重量 | 最小 |
| 将来復帰 | Phase 2-E で別途検討 |

#### B案: 「準備中」無効タイル（将来復帰導線あり）

| 項目 | 内容 |
|------|------|
| 左パネルアイコン | グレーアウトで `🤖 SAKURA AI`（disabled クラス） |
| 右側 AI パネル | なし |
| マスコット動画 | なし |
| クリック時の挙動 | モーダル表示「SAKURA AI はデモ版では未提供です。本番環境でご体験ください。」のみ |
| iframe / relay 接続 | 一切なし（DOM 上もネットワーク上も無接続） |
| 外部通信 | 一切なし |
| 実装重量 | 軽（タイル + モーダルのみ・約 30 行） |
| メリット | OEM に「本番には AI もある」ことを示唆できる |
| デメリット | 「動かない機能」を見せることに違和感を覚える可能性 |

#### Opus 推奨: **A案（完全削除）**

理由:
- 「動かない機能を見せない」が OEM デモの基本姿勢
- B案でも「動かないものを見せる」点は同じで、本番訴求はマニュアルや別資料で代替可能
- 実装・テスト・将来撤去の手間も最小

#### Q2 ユーザー判断要請

→ §18 Q2 を参照。**A案 / B案 のどちらかを選択してください。**

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

### 5.7 【新規】外部 API CSP 設計（Codex 第1回 指摘7 対応）

#### 5.7.1 connect-src CSP 許可リスト（最小限）

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://*.googleapis.com;
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

| 許可先 | 用途 |
|--------|------|
| `'self'` | 同一オリジン（demo.sakuranet-co.jp） |
| `*.googleapis.com` / `*.firebaseio.com` | Firebase SDK |
| `firestore.googleapis.com` | Firestore |
| `identitytoolkit.googleapis.com` | Firebase Auth |
| `api.open-meteo.com` | 天気 API（無認証） |
| `open.er-api.com` | 為替 API（無認証） |

#### 5.7.2 明示的に **許可しない**（CSP違反になるべき）

- ❌ `https://sakuranet-co.jp` （本番ドメイン）
- ❌ `https://sakura-net-db.*` （本番 Firebase）
- ❌ `https://api.rss2json.com` （本書 v0.3.0 ではニュース固定ダミーのため不要）
- ❌ `https://corsproxy.io` （同上）
- ❌ `*.sakura-ai.*` 系（撤去）
- ❌ Ollama / Codex Relay 系全て

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

---

### 5.8 【新規】ニュース機能の方針変更（Codex 第1回 指摘2 対応・最重要修正）

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
4. **§10.8 Playwright 13 項目**を全 PASS 確認
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

### 6.5 【新規】localStorage キー設計（Codex 第1回 指摘5 対応）

#### 6.5.1 prefix ルール

- **すべての localStorage キーに `sakura_demo_os_` prefix を付ける**
- **既存の本番系キー名（`sakura-net-db`, `gw_*`, `wp_*`, `mascot_*` 等）は絶対に使わない**
- グループウェア等の他デモ画面と key 衝突しないよう、SAKURA OS 専用 prefix を遵守

#### 6.5.2 v0.3.0 で使用する localStorage キー一覧（確定）

| key | 値の型 | 用途 | logout 時の挙動 |
|-----|--------|------|:---:|
| `sakura_demo_os_theme` | `'dark' \| 'light'` | テーマ設定 | 保持（次回ログイン時に復元） |
| `sakura_demo_os_wallpaper_id` | `string`（プリセット ID） | 選択中の壁紙ID | 保持 |
| `sakura_demo_os_slideshow_enabled` | `'0' \| '1'` | スライドショー ON/OFF | 保持 |
| `sakura_demo_os_slideshow_ids` | `string`（JSON 配列） | スライドショー対象プリセット ID 群 | 保持 |
| `sakura_demo_os_slideshow_interval_sec` | `string` | 切替秒数（既定 30） | 保持 |
| `sakura_demo_os_open_apps` | `string`（JSON 配列） | 起動中アプリ id 群（再起動復元用） | **削除**（プライバシー配慮） |
| `sakura_demo_os_window_layout` | `string`（JSON） | ウィンドウ位置・サイズ | **削除** |
| `sakura_demo_os_last_seen_at` | `string`（ISO） | 最終起動日時 | 保持（任意） |

#### 6.5.3 logout 時の保持/削除方針

```javascript
function clearOsTransientStateOnLogout() {
  // 削除対象（個人状態に近いもの）
  ['sakura_demo_os_open_apps',
   'sakura_demo_os_window_layout'].forEach(k => localStorage.removeItem(k));
  // 保持対象（テーマ・壁紙ID 等の好み設定）→ 何もしない
}
```

> 注釈: 同 OEM 端末を複数人で順次デモる想定もあるため、起動済アプリ等は logout で消す。
> テーマ・壁紙は個人特定情報ではないため保持し、次のデモ準備時間を短縮する。

#### 6.5.4 禁止 prefix 一覧（Sonnet 実装時の防止）

- ❌ `sakura-net-db*`
- ❌ `gw_*`（本番グループウェア系）
- ❌ `wp_*` / `wallpaper_*`（本番 SAKURA OS 系）
- ❌ `mascot_*` / `ai_*`（SAKURA AI 系）
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

## 8. 既存ファイルへの影響範囲（Codex 第1回 指摘3 対応）

### 8.1 結論

> **既存4ファイルは業務ロジックに触れず、ナビバーに SAKURA OS への導線を追加するのみ。**

これは UI 変更（ナビバーへのリンク 1 行追加）ではあるが、業務ロジックには一切触れない。
v1 で「ナビバー追記のみで完結」と書いたのは不正確だったため、v2 では UI 変更である点も含めて明示する。

### 8.2 ナビバー更新が必要なファイル

| ファイル | 変更内容 | 業務ロジック影響 | UI 影響 |
|---------|---------|:---:|:---:|
| `ordersystem.html` | ナビに `<a href="sakura-os.html">🖥️ SAKURA OS</a>` 1 行追加 | ❌ なし | ✅ ナビバーのみ |
| `invoice.html` | 同上 | ❌ なし | ✅ ナビバーのみ |
| `groupware.html` | 同上 | ❌ なし | ✅ ナビバーのみ |
| `index.html` | （任意）機能カードに SAKURA OS 追記 | ❌ なし | ✅ カード追加のみ |

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
ordersystem.html  : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック非変更）
invoice.html      : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック非変更）
groupware.html    : <nav> 内に sakura-os.html リンク 1 行追加（業務ロジック非変更）
index.html        : （任意）機能カード追加（業務ロジック非変更）
```

### 8.5 影響範囲チェックリスト（Sonnet 実装後・自己検証用）

- [ ] `ordersystem.html` の業務ロジック（顧客 CRUD）が変更されていない
- [ ] `invoice.html` の請求書ロジック・PDF 生成が変更されていない
- [ ] `groupware.html` の Firestore 連携・掲示板・カレンダー・タスクが変更されていない
- [ ] `index.html` のログインフォーム・初回認証フローが変更されていない
- [ ] ナビバーのアクティブ表示（青色）が各ページで正しい
- [ ] manual-user.html・manual-admin.html は変更不要（任意で SAKURA OS 説明を追記しても良いが本 Phase では対象外）

### 8.6 Playwright 既存回帰テスト（必須）

| テスト | 内容 |
|--------|------|
| ordersystem regression | ナビバー追加後も顧客検索・登録・編集・削除が壊れていない |
| invoice regression | ナビバー追加後も請求書作成・PDF 生成・送信が壊れていない |
| groupware regression | ナビバー追加後も掲示板・カレンダー・タスク・申請が壊れていない |
| nav links | 全ページのナビバーから sakura-os.html に遷移できる |

### 8.7 変更しないファイル一覧

- `firestore.rules` — 変更なし
- `firebase.json` — 変更なし
- `firestore.indexes.json` — 変更なし（既存 index で間に合う）
- `tools/seed-firestore.html` — 変更なし（OS は read のみのため seed 不要）
- `firebase-config.demo.js` — 変更なし
- `config.js` — 変更なし
- `functions/index.js` — 変更なし（OS リセット対象データなし）
- `manual-admin.html` / `manual-user.html` — 本 Phase は変更なし（v0.3.x で追記検討）

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

### 10.2 認証・セッション

- [ ] `onAuthStateChanged` で未認証時 `index.html` へ即リダイレクト
- [ ] `demo_sessions/{uid}` 検証 5 項目すべて実施
- [ ] `demo_config/emergency_stop` チェック（既存 4 ページと同実装）
- [ ] ログアウト時に確認ダイアログ → `signOut()` → `index.html`
- [ ] logout 時に `sakura_demo_os_open_apps` / `sakura_demo_os_window_layout` を削除

### 10.3 iframe sandbox / allowlist

- [ ] `sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox"`（§3.4.3）
- [ ] iframe `src` は `APP_ALLOWLIST`（4件）の URL のみ
- [ ] 任意 URL を iframe で開く UI を実装しない
- [ ] 外部サイトを iframe で開かない（本番 SAKURA OS の `/system/` 配下を含めて開かない）
- [ ] iframe 内で Firebase Auth が壊れない（§3.4.5 テスト項目）

### 10.4 DEMO バナー

- [ ] 全画面表示時もバナー消えない（`position:fixed; z-index:99999`）
- [ ] バナー文言は既存 4 ページと同一テキスト

### 10.5 機密情報

- [ ] 本番 API キーがソース内に存在しない（`scripts/check-no-prod-config.js` で検証）
- [ ] PII データシード不要（`scripts/detect-pii.js` 適用対象外だが念のため）
- [ ] localStorage に保存するデータ：壁紙ID・テーマ・スライドショー設定のみ（個人情報ゼロ）
- [ ] localStorage キーは `sakura_demo_os_` prefix のみ（§6.5）

### 10.6 通信ゼロ検証

- [ ] `tests/no-prod-network.spec.js` 拡張（`sakura-os.html` の起動を含める）
- [ ] Playwright で SAKURA OS 起動 → 各アプリ open → close → 本番ドメインへの通信ゼロ確認

### 10.7 緊急停止スイッチ

- [ ] `demo_config/emergency_stop.enabled == true` 時、即座に画面差し替え
- [ ] 既存 4 ページと同じテキスト・スタイル

---

### 10.8 【新規】Playwright テスト項目（13項目・Codex 第1回 必須）

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
```

#### 10.8.1 Playwright 実装雛形

```javascript
test('T-OS-01..04 prod-zero traffic', async ({ page }) => {
  const banned = [/sakura-net-db/, /sakuranet-co\.jp\/system/, /gw_api\.php/, /get_wallpapers\.php/];
  page.on('request', req => {
    for (const b of banned) {
      if (b.test(req.url())) throw new Error('Banned URL hit: ' + req.url());
    }
  });
  await page.goto('https://demo.sakuranet-co.jp/sakura-os.html');
  // login → openApp → close → wait
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

### Q2. SAKURA AI 削除方式（A案 / B案）

**質問**: SAKURA AI を**完全削除（A案）** か **準備中タイル（B案）** どちらにするか。

**Opus 推奨**: 🟢 **A案（完全削除）**
- 動かない機能を見せないのが OEM デモの基本姿勢
- B案は実装コストは小さいが「動かない機能」を見せるのは同じ
- 将来必要なら Phase 2-E で AI デモ専用版を別途検討

---

### Q3. Firestore コレクション戦略

**質問**: 既存 `demo_calendar_events` / `demo_todos` を **read のみ** で使う方針で OK か。

**Opus 推奨**: 🟢 **既存 read のみ**
- グループウェアとデータ一貫性が取れる
- 新規コレクションは Rules 拡張・seed・Phase 2-D 対象拡大を招く
- write しないため Rules 影響ゼロ

---

### Q4. iframe URL allowlist + sandbox 具体値

**質問**: §3.4 の iframe URL allowlist（4件）+ sandbox 属性具体値で OK か。

**Opus 推奨**: 🟢 **OK**
- allowlist: `ordersystem.html` / `invoice.html` / `groupware.html` / `manual-user.html` のみ
- sandbox: `allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-popups-to-escape-sandbox`
- Codex 推奨「sandbox を無理に付けて壊すより allowlist + 通信ゼロ検査優先」を採用

---

### Q5. 外部 API（天気・為替）+ ニュース固定ダミー

**質問**: 天気（Open-Meteo）/ 為替（open.er-api.com）のみ外部 API、ニュースは v0.3.0 では固定ダミーで OK か。

**Opus 推奨**: 🟢 **OK**
- ニュースは固定ダミー（§5.8）
- CSP connect-src で許可ドメイン限定（§5.7）
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

### Q8. localStorage key prefix `sakura_demo_os_` 統一

**質問**: localStorage キーは全て `sakura_demo_os_` prefix で統一・他 prefix は書き込み禁止する方針で OK か。

**Opus 推奨**: 🟢 **OK**
- 本番系 key（`sakura-net-db`, `gw_*`, `wp_*`, `mascot_*` 等）と衝突回避
- グローバルラッパー `lsSet/lsGet` で強制（§6.5.4）
- Playwright T-OS-10 で検査

---

### Q9. 既存4ファイルは「ナビバー追記のみ・業務ロジック非変更」

**質問**: ordersystem.html / invoice.html / groupware.html / index.html のナビバーに SAKURA OS リンク 1 行追加（業務ロジック非変更）方針で OK か。

**Opus 推奨**: 🟢 **OK**
- §8 で変更対象・差分・業務ロジック非変更を明記
- Playwright 既存回帰テストで保証

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
  - 左パネル：時計・天気・アプリグリッド（4件・allowlist）・為替・カレンダー・本日のタスク
  - メイン：ニュースティッカー（固定ダミー）・デスクトップ
  - タスクバー：起動中アプリ・ユーザー名・ログアウト
  - 壁紙：プリセット 9 種（ID 保存のみ・カスタム URL 欄なし・アップロードなし）
  - テーマ：dark/light 切替（localStorage `sakura_demo_os_theme`）
  - SAKURA AI / SAKURA MUSIC / 申込み管理 / 利用明細 / 通話明細 / マスコット / 付箋 → デモ版から削除
  - Email/Password + demo_sessions 認証（v0.1.8 と同一方式）
  - Firestore: `demo_calendar_events` / `demo_todos` read only
  - localStorage: `sakura_demo_os_` prefix 統一
- 既存業務ロジック非破壊（ordersystem / invoice / groupware）

**ナビゲーションバー更新（4 ページ対応・業務ロジック非変更）**
- `ordersystem.html` / `invoice.html` / `groupware.html` — ナビに「🖥️ SAKURA OS」追加
- `index.html` — 機能カードに SAKURA OS 追記（任意）

**Firestore Rules**（変更なし）
- v0.1.8 / v0.2.0 で既にデプロイ済みの v12 Rules で完結

**バックアップ**
- `backups/v0.2.0/` に v0.2.0 時点のファイルを保存
```

---

## 13. 工数見積もり

### 13.1 詳細工数（v2 改訂後）

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
| ┣ DEMO バナー追加・既存ページとスタイル統一 | 0.5h |
| **B. ナビバー更新（既存 3〜4 ファイル）** | 1.0h |
| **C. テスト・検証** | |
| ┣ 本番通信ゼロ検証（Playwright T-OS-01..04 / 11 / 12） | 1.0h |
| ┣ iframe / allowlist 検証（T-OS-05..09） | 1.0h |
| ┣ localStorage prefix 検証（T-OS-10） | 0.3h |
| ┣ 既存回帰テスト（T-OS-13） | 0.7h |
| ┣ scripts/check-no-prod-config.js / detect-pii.js 実行 | 0.5h |
| ┣ 手動 E2E（ログイン → OS 起動 → 各アプリ起動 → ログアウト） | 1.0h |
| ┣ レスポンシブ確認（PC のみ・スマホ対象外） | 0.5h |
| **D. ドキュメント・バックアップ** | |
| ┣ RELEASE_NOTES.md 更新 | 0.5h |
| ┣ backups/v0.2.0/ にバックアップ作成 | 0.3h |
| ┣ memory `project_demo_environment.md` 更新 | 0.2h |
| **E. デプロイ準備** | |
| ┣ WinSCP アップロード手順記載 | 0.3h |
| ┣ ユーザー手動作業の整理（Firestore Console 不要を明記） | 0.2h |
| **合計** | **約 19-22h** |

### 13.2 工数比較（Phase 2-A 実績との対比）

| Phase | 主要作業 | 工数 |
|-------|---------|:---:|
| Phase 2-A v0.1.8 | 認証移行 | 4h |
| Phase 2-A v0.2.0 | グループウェア | 22h |
| **Phase 2-B v0.3.0** | **SAKURA OS（本書 v2）** | **19-22h** |

v1 比較で +1〜2h（Playwright 13 項目テスト・CSP 設計・localStorage ラッパー追加分）

### 13.3 着手前提条件

- [x] Phase 2-A v0.2.0 デプロイ完了済み
- [x] `demo_calendar_events` / `demo_todos` に seed データあり（v0.2.0 で投入済み）
- [ ] **Codex 第2回レビュー完了（v2 ベース）**
- [ ] **ユーザー Q1-Q9 回答受領**

---

## 14. 着手手順（Sonnet 向け）

1. 本書 v2（または Codex 第2回レビュー後の vN）を再読
2. ユーザーの Q1-Q9 回答を確認
3. memory `project_demo_environment.md` を確認
4. `backups/v0.2.0/` を作成
5. `sakura-os.html` を**ゼロから書き起こし**（本番をコピーしない）
6. localStorage ラッパー（`sakura_demo_os_` 強制）を最初に組み込む
7. iframe APP_ALLOWLIST を実装
8. CSP `<meta http-equiv>` を設定
9. ニュースは固定ダミー配列で実装（外部 API 呼ばない）
10. `scripts/check-no-prod-config.js` `scripts/detect-pii.js` を実行
11. 既存 3 ファイル（ordersystem/invoice/groupware）のナビバーに SAKURA OS リンクを追加
12. Playwright T-OS-01..13 全 PASS 確認
13. 手動 E2E
14. RELEASE_NOTES.md を v0.3.0 で更新
15. WinSCP でアップロード（ユーザー手動・Sonnet が手順を案内）

---

## 15. デプロイ手順（WinSCP）

### 15.1 サーバーパス

```
/home/sakura-nets/www/demo/
```

### 15.2 アップロード対象（v0.3.0）

| ファイル | 変更 | 備考 |
|---------|------|------|
| `sakura-os.html` | ✨ 新規 | 必須 |
| `ordersystem.html` | ナビバーのみ変更 | 必須 |
| `invoice.html` | ナビバーのみ変更 | 必須 |
| `groupware.html` | ナビバーのみ変更 | 必須 |
| `index.html` | （任意）機能カード追記 | 任意 |

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
| **v2** | **2026-05-10** | **Codex 第1回レビュー反映** | **iframe allowlist / ニュース固定ダミー / localStorage key prefix / SAKURA AI 二択 / 壁紙アップロード削除 / Playwright テスト13項目追加** |

---

## 17. 採用必須修正チェックリスト（Codex 第1回 v1→v2）

Codex が v1 で挙げた「v2 で直すべき項目」全てに対し、v2 で対応完了：

- [x] iframe sandbox 属性の具体値とURL allowlistを明記（§3.4）
- [x] ニュース取得を削除・固定ダミー・demo専用proxyのどれにするか決定 → 固定ダミー採用（§5.8）
- [x] SAKURA AI は削除で確定し、通信ゼロをテストに入れる（§4.4 + §10.8 T-OS-11）
- [x] 壁紙アップロードは初版削除、プリセットID保存のみにする（§5.6 / §6.5）
- [x] localStorage key prefix を定義（§6.5）
- [x] 既存4ファイル変更は「ナビバーUI追記のみ、業務ロジック非変更」と明記（§8.1）
- [x] Playwright の iframe / 外部通信 / 既存回帰テストを追加（§10.8 / 13項目）

**全項目 ✅ 対応済**

---

## 18. ユーザー判断要請（Q1-Q9・要回答）

| # | 質問 | 既定推奨 | 必要回答 |
|---|---|---|---|
| Q1 | クリーンルーム実装方針（本番コードコピーなし）OK | OK | OK / NG |
| Q2 | SAKURA AI: A案完全削除 / B案準備中無効タイル | A案 | A / B |
| Q3 | demo_calendar_events / demo_todos を read のみで使用 OK | OK | OK / NG |
| Q4 | iframe URL allowlist + sandbox 具体値（§3.4）OK | OK | OK / NG |
| Q5 | 外部 API は天気・為替のみ・ニュース固定ダミー OK | OK | OK / NG |
| Q6 | 壁紙：プリセットのみ（URL入力もアップロードも削除）OK | OK | OK / NG |
| Q7 | 付箋メモ v0.3.0 では削除 OK | OK | OK / NG |
| Q8 | localStorage key prefix `sakura_demo_os_` 統一 OK | OK | OK / NG |
| Q9 | 既存4ファイル変更は「ナビバー追記のみ・業務ロジック非変更」OK | OK | OK / NG |

---

## 19. Codex 第1回ステータス更新

```
判定: v1 方針 OK / v1 実装 NG → v2 で全反映済 → 実装判断 🟡 Codex 第2回レビュー待ち

v1 → v2 反映項目（Codex 第1回 必須7点）:
  1. iframe sandbox 設計の危険性          → §3.4 allowlist + sandbox 具体値で対応
  2. ニュース取得プロキシ未定義            → §5.8 固定ダミー方式へ変更
  3. 既存4ファイル変更表現の修正           → §8.1 業務ロジック非変更明記
  4. SAKURA AI 削除判断の補強              → §4.4 A案/B案 二択化
  5. 新規 Firestore コレクション不要の補強  → §6.5 localStorage key prefix 設計 + §7.5 将来コレクション要件
  6. localStorage 壁紙保存の厳格化          → §5.6 / §6.5 プリセット ID のみ保存
  7. 外部APIの扱い厳格化                   → §5.7 CSP + §10.8 Playwright allowlist 検査

採用必須修正チェックリスト（§17）: 全7項目 ✅ 対応済
Playwright テスト項目（§10.8）: 13項目追加済
ユーザー判断要請（§18）: Q1-Q9 に拡張済

Sonnet 実装着手: 🟡 待機（Codex 第2回 OK + ユーザー Q1-Q9 回答 後）
```

---

**v2 確認書、以上です。**

Phase 2-A v12 と同水準の構成・粒度で記述、かつ Codex 第1回レビュー指摘 7 点を全反映。
Codex 第2回レビュー受領 → ユーザー Q1-Q9 回答 → v3（必要時）or 実装着手判定 の流れを想定。
