# SAKURA SYSTEM デモ環境 Phase 2-B 実装プラン v1
## 「SAKURA OS デモ版追加」確認書 v1

**作成日**: 2026-05-10
**作成者**: Claude (Opus 4.7) — プランニング担当
**対象**: SAKURA-SYSTEM-DEMO **v0.2.0 → v0.3.0**
**ステータス**: 🟡 **Codex レビュー待ち**（v1 作成完了）
**役割分担**: 本書 = Opus 担当 / 実装作業 = Sonnet 担当
**前提**: Phase 2-A（v0.2.0 グループウェア）デプロイ完了済み

---

## 0. レビュー観点サマリー（Codex 向け）

本書は Phase 2-A v12 と同等の厳密性で記述する。Codex は以下を中心にレビューすること：

1. **本番コードの完全分離**（gw_api.php 呼ばない・本番 Firebase に触れない）
2. **SAKURA AI 削除判断の妥当性**
3. **iframe sandbox 属性の安全性**（同一ドメイン内のみ）
4. **新規 Firestore コレクション不要の判断**（既存 demo_calendar_events / demo_todos read のみ）
5. **既存 4 ファイル（ordersystem/invoice/groupware/index）への変更が「ナビバー追記のみ」で完結すること**

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
| Phase 2-C 以降 | 別プラン |
| Phase 2-D | 既存業務ロジック改修（customer_records 物理 delete 撤廃等） |

### 1.3 鉄則の継承（Phase 2-A から）

- ✅ 本番（sakuranet-co.jp）と**完全分離**（別 Firebase プロジェクト）
- ✅ 既存業務ロジック**非破壊**
- ✅ Email/Password + `demo_sessions` 認証（v0.1.8 以来）
- ✅ 全新規コレクションは `demo_*` プレフィックス（本 Phase では新規コレクション**なし**）
- ✅ クリーンルーム実装（本番コードを参照するが**コピーしない**）

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
| 6 | 申込み管理 | `sakuranethikari.html`（本番のみ） | **削除**（デモに該当ファイルなし） | ❌ 削除 |
| 7 | 利用明細 | `usagelog.html`（本番のみ） | **削除**（デモに該当ファイルなし） | ❌ 削除 |
| 8 | 通話明細 | `calllog.html`（本番のみ） | **削除**（デモに該当ファイルなし） | ❌ 削除 |
| 9 | SAKURA AI（左パネルアイコン） | あり | **削除**（§4 で詳述） | ❌ 削除 |
| 10 | SAKURA AI パネル（右側 iframe） | あり | **削除** | ❌ 削除 |
| 11 | SAKURA MUSIC | `sakuramusic/music.html` | **削除**（デモに該当ファイルなし） | ❌ 削除 |
| 12 | グループウェア | `groupware.html` | `groupware.html`（v0.2.0 で追加済み） | ✅ 流用 |
| 13 | 請求書 | `invoice/invoice.html` | `invoice.html`（同ディレクトリ） | ✅ 流用 |
| 14 | 時計（日本時間・干支・元号） | あり | あり（同ロジック・コピー不可・再実装） | ✅ 流用 |
| 15 | 天気（Open-Meteo / 大阪） | 外部 API 直叩き | 同上（API キー不要・CORS OK） | ✅ そのまま |
| 16 | ニュース（Yahoo RSS + プロキシ） | 外部 API 経由 | 同上 | ✅ そのまま |
| 17 | 為替（open.er-api.com） | 外部 API | 同上 | ✅ そのまま |
| 18 | 壁紙（プリセット 9 種） | あり | あり（CSS グラデのみ・本番と同等） | ✅ 流用 |
| 19 | 壁紙アップロード | IndexedDB 保存 | localStorage に変更（§5 で詳述） | 🔄 簡略化 |
| 20 | サーバー壁紙取得 | `/system/sakura-ai/get_wallpapers.php` | **削除**（PHP API なし） | ❌ 削除 |
| 21 | スライドショー | あり（IndexedDB） | あり（localStorage） | 🔄 簡略化 |
| 22 | マスコット動画 | `/system/sakura-ai/assets/*.mp4` | **削除**（SAKURA AI ごと撤去） | ❌ 削除 |
| 23 | 付箋メモ（IndexedDB） | あり | **第一版では削除**（複雑度抑制・将来判断） | ❌ 削除 |
| 24 | iframe アプリウィンドウ | 同一ドメイン | 同一ドメイン | ✅ 流用 |
| 25 | タスクバー | あり | あり | ✅ 流用 |
| 26 | テーマ切替（dark/light） | あり | あり | ✅ 流用 |
| 27 | DEMO バナー | なし | **追加必須**（既存 4 ページと統一） | ➕ 追加 |
| 28 | ログアウト | `index.php?logout=1` | `firebase.auth().signOut()` → `index.html` | 🔄 置換 |

### 2.2 集計

| 区分 | 件数 |
|------|:---:|
| ✅ そのまま流用 | 9 |
| ✅ 構造参考・再実装（クリーンルーム） | 5 |
| 🔄 置換（API/URL 差し替え） | 8 |
| ❌ 削除 | 9 |
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
  firebase.auth().signOut()
    .then(() => location.href = 'index.html')
    .catch(() => location.href = 'index.html');
}
```

---

## 4. アプリ一覧（SAKURA AI 削除判断含む）

### 4.1 デモ版アプリ一覧（左パネル「アプリケーション」グリッド）

| # | id | 表示名 | アイコン | URL | サイズ |
|---|-----|--------|:---:|-----|------|
| 1 | `customer` | 顧客管理 | 📋 | `ordersystem.html` | 1200×720 |
| 2 | `invoice` | 請求書 | 🧾 | `invoice.html` | 1200×760 |
| 3 | `groupware` | グループウェア | 🏢 | `groupware.html` | 1400×820 |
| 4 | `manual` | 使い方ガイド | 📖 | `manual-user.html` | 900×640 |

### 4.2 本番から削除するアプリ（一覧根拠）

| 削除アプリ | 削除根拠 |
|------------|---------|
| 申込み管理（hikari） | デモ環境にファイル不存在・ビジネス判断（OEM 体験対象外） |
| 利用明細（usage） | 同上・PII リスクあり |
| 通話明細（call） | 同上・通信明細データはデモ価値が低い |
| SAKURA MUSIC | エンタメ機能・OEM 体験で混乱を招く |
| **SAKURA AI** | **§4.3 で個別判断** |

### 4.3 SAKURA AI 削除判断（重要設計ポイント）

#### 判断: **完全削除**（左パネルアイコン・右側 AI パネル・マスコット動画 すべて）

#### 削除理由（4 点）

1. **デモ環境に SAKURA AI 本体がない**
   - `/system/sakura-ai/` は本番のみ存在（Ollama サーバー連携あり）
   - デモにマウントしても 404 / 通信エラーになり UX 悪化

2. **本番通信リスク**
   - SAKURA AI は本番 Firestore（`sakura-net-db`）を参照する設計
   - デモから iframe で読み込むと**本番への通信が発生する可能性**
   - これは Phase 1 の「本番通信ゼロ検証（Playwright）」に違反する

3. **OEM 体験のスコープ外**
   - SAKURA AI は将来別フェーズ（Phase 2-E 想定）でデモ化を検討
   - 第一版で含めると「動かない機能」が混入し信頼を損なう

4. **複雑度削減**
   - マスコット動画・吹き出し・キャラ切り替えは実装重量が大きい（〜400 行）
   - 削除により実装工数を約 4h 削減・テスト対象も縮小

#### 削除する具体的要素

- `<div id="ai-panel">` および `<iframe id="ai-iframe">`
- `APPS` 配列の `id:'ai'` エントリ
- `<div id="mascot-float">` 全体（マスコット浮遊動画）
- `wp_server_images`（`/system/sakura-ai/get_wallpapers.php` 取得ロジック）
- `window.addEventListener('message', ...)` の AI 連携ハンドラ
- マスコット関連の `*.mp4` 参照すべて

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

### 5.6 unsubscribe（メモリリーク防止）

```javascript
window.addEventListener('beforeunload', () => {
  unsubCalendar?.();
  unsubTodos?.();
}, { once: true });
```

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
4. 手動確認: ブラウザ DevTools Network タブで `sakura-net-db` へのアクセスがないこと

### 6.3 流用可能な構造（参考のみ・コピー禁止）

- 左パネル：時計・天気・アプリグリッド・為替（CSS 構造を参考）
- メイン：ニュース・カレンダー・タスク（レイアウトを参考）
- ウィンドウシステム：ドラッグ・リサイズ・最小化・最大化・タスクバー
- 壁紙パネル：プリセット 9 種・カスタム URL

### 6.4 クリーンルーム実装で注意すべきポイント

| 項目 | 注意点 |
|------|-------|
| 関数名 | 本番と同名でも独立に書く（`init`, `openApp` 等は OK） |
| 定数 | `APPS` 配列・`WALLPAPERS` 配列はデモ専用に再定義 |
| Firebase 初期化 | `DEMO_FIREBASE_CONFIG`（firebase-config.demo.js）のみ |
| API URL | デモ用に書き換え（PHP は使わない） |
| マジックナンバー | レイアウト寸法・タイマー秒数等は本番と同等で OK |

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
- OS から書き込むケースは **localStorage**（壁紙・テーマ設定）のみで完結
- audit_log への書き込みも不要（read 操作は audit 対象外）

### 7.4 Rules 検証

実装完了時に既存ユニットテスト `tests/firebase-rules.test.js`（T01〜T40）が**全 PASS** することを再確認。
SAKURA OS 追加で挙動変化なし。

---

## 8. 既存ファイルへの影響範囲

### 8.1 ナビバー更新が必要なファイル

| ファイル | 変更内容 | 業務ロジック影響 |
|---------|---------|:---:|
| `ordersystem.html` | ナビに「🖥️ SAKURA OS」リンク 1 行追加 | ❌ なし |
| `invoice.html` | 同上 | ❌ なし |
| `groupware.html` | 同上 | ❌ なし |
| `index.html` | （任意）機能カードに SAKURA OS 追記 | ❌ なし |

### 8.2 ナビバー追記の差分（具体例）

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

### 8.3 影響範囲チェックリスト（Sonnet 実装後・自己検証用）

- [ ] `ordersystem.html` の業務ロジック（顧客 CRUD）が変更されていない
- [ ] `invoice.html` の請求書ロジック・PDF 生成が変更されていない
- [ ] `groupware.html` の Firestore 連携が変更されていない
- [ ] `index.html` のログインフォーム・初回認証フローが変更されていない
- [ ] ナビバーのアクティブ表示（青色）が各ページで正しい
- [ ] manual-user.html・manual-admin.html は変更不要（任意で SAKURA OS 説明を追記しても良いが本 Phase では対象外）

### 8.4 変更しないファイル一覧

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
| `demo_os_news_cache`（ニュース API キャッシュ） | ❌ | 外部 API 直接で十分 |
| `demo_os_wallpapers`（共有壁紙） | ❌ | プリセット 9 種で十分 |

理由: SAKURA OS は**ランチャー**として動作し、データ管理は各アプリ（groupware/invoice/ordersystem）が責務を持つ。

---

## 10. セキュリティチェックリスト

### 10.1 本番完全分離（Phase 1 鉄則の継承）

- [ ] `firebase-config.demo.js` のみ使用・本番 config がコード内に存在しない
- [ ] `gw_api.php` を呼ばない（PHP API 完全削除）
- [ ] `/system/sakura-ai/` への参照ゼロ
- [ ] `sakuranet-co.jp` への通信ゼロ（`demo.sakuranet-co.jp` 同ドメイン内のみ）
- [ ] 外部 API は読み取り専用・認証情報なし（Open-Meteo / rss2json / open.er-api.com）

### 10.2 認証・セッション

- [ ] `onAuthStateChanged` で未認証時 `index.html` へ即リダイレクト
- [ ] `demo_sessions/{uid}` 検証 5 項目すべて実施
- [ ] `demo_config/emergency_stop` チェック（既存 4 ページと同実装）
- [ ] ログアウト時に確認ダイアログ → `signOut()` → `index.html`

### 10.3 iframe sandbox

- [ ] `sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"`
- [ ] iframe `src` は同一ドメイン（`demo.sakuranet-co.jp`）の HTML のみ
- [ ] 外部サイトを iframe で開かない（本番 SAKURA OS の `/system/` 配下を除き、デモ版は完全自己完結）

### 10.4 DEMO バナー

- [ ] 全画面表示時もバナー消えない（`position:fixed; z-index:99999`）
- [ ] バナー文言は既存 4 ページと同一テキスト

### 10.5 機密情報

- [ ] 本番 API キーがソース内に存在しない（`scripts/check-no-prod-config.js` で検証）
- [ ] PII データシード不要（`scripts/detect-pii.js` 適用対象外だが念のため）
- [ ] localStorage に保存するデータ：壁紙設定・テーマのみ（個人情報ゼロ）

### 10.6 通信ゼロ検証

- [ ] `tests/no-prod-network.spec.js` 拡張（`sakura-os.html` の起動を含める）
- [ ] Playwright で SAKURA OS 起動 → 各アプリ open → close → 本番ドメインへの通信ゼロ確認

### 10.7 緊急停止スイッチ

- [ ] `demo_config/emergency_stop.enabled == true` 時、即座に画面差し替え
- [ ] 既存 4 ページと同じテキスト・スタイル

---

## 11. Codex レビュー用 Q&A（判断ポイント）

### Q1. クリーンルーム実装方針

**質問**: 本番 `sakura-os.html`（1949 行）を「構造参考・コードコピーなし」で再実装する方針は妥当か。Phase 2-A の `groupware.html` と同方針で OK か。

**Opus 推奨**: 🟢 **OK**
- Phase 2-A で実証済み・Sonnet が完遂
- 「構造の参考」は ToS・著作権上問題なし（自社コード）
- コピーすると本番 Firebase config / API URL の混入リスクあり

---

### Q2. SAKURA AI 削除判断

**質問**: SAKURA AI（左アイコン・右パネル・マスコット動画すべて）を**完全削除**する方針は妥当か。
それとも「UI だけ残してデモ版 AI なし」の表示にすべきか。

**Opus 推奨**: 🟢 **完全削除**
- §4.3 の 4 理由（ファイル不在・本番通信リスク・スコープ外・複雑度削減）
- 「UI だけ残す」は「動かない機能を見せる」ことになり OEM 体験を損なう
- 将来必要なら Phase 2-E 等で AI デモ専用版を別途検討

**Codex 否認時の代替案**: 「Coming Soon」アイコンとして残し、クリック時に「デモ環境では未提供」モーダル表示

---

### Q3. Firestore コレクション戦略

**質問**: 既存 `demo_calendar_events` / `demo_todos` を **read のみ** で使う方針で OK か。
それとも `demo_os_*` 専用コレクションを新設すべきか。

**Opus 推奨**: 🟢 **既存 read のみ**
- グループウェアとデータ一貫性が取れる（同じカレンダー・同じタスクが OS でも見える）
- 新規コレクションは Rules 拡張・seed・Phase 2-D 対象拡大を招く
- write しないため Rules 影響ゼロ

---

### Q4. iframe アプリウィンドウ方式

**質問**: アプリ起動時 iframe で同一ドメイン HTML を表示する方式は妥当か。
セキュリティ上の懸念はあるか。

**Opus 推奨**: 🟢 **OK**
- 全 iframe `src` は `demo.sakuranet-co.jp` 配下のみ（外部不可）
- sandbox 属性で `allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals`
- 同一オリジンのため `localStorage` / `firebase auth state` を iframe 間で共有可
- 注意: iframe 内アプリ起動時に**重複して認証チェックが走る** → これは v0.1.8 の各アプリの onAuthStateChanged で既に動作実証済み

---

### Q5. 外部 API（天気・ニュース・為替）の扱い

**質問**: 外部 API（Open-Meteo / rss2json / corsproxy.io / open.er-api.com）をそのまま使う方針で OK か。
セキュリティ上の問題はないか。

**Opus 推奨**: 🟢 **OK**
- 全て認証不要・無料の公開 API
- API キーがソース内に存在しない（漏洩リスクゼロ）
- 通信はクライアントブラウザから直接（デモサーバーを経由しない）
- 注意点: rss2json / corsproxy.io はサードパーティ依存・将来停止リスクあり → エラー時はスタブ表示でフォールバック

**追加リスク**: corsproxy.io は無料プランで利用制限あり。デモ環境で多数のユーザーが同時アクセスするとレート制限の可能性。
→ Phase 2-B では現状維持・Phase 2-D 以降で自前プロキシ検討。

---

### Q6. 壁紙機能の簡略化

**質問**: 壁紙機能を**プリセット 9 種 + localStorage カスタム URL のみ**に簡略化する方針で OK か。
本番の IndexedDB アップロード機能は不要か。

**Opus 推奨**: 🟢 **localStorage のみで OK**
- IndexedDB は本番で 5MB 超え対策のため使用 → デモ版は OEM 体験用で大量画像不要
- localStorage（5MB 上限）で十分・実装シンプル
- カスタム URL 入力で外部画像も使用可能
- スライドショーは初期版では削除（複雑度削減）→ Phase 2-B.1 で追加検討

**注意**: localStorage に Base64 画像保存は容量逼迫の元 → Phase 2-B 第一版は **URL 入力のみ・ファイルアップロード機能は削除**。

---

### Q7. 付箋メモの扱い

**質問**: 本番にある付箋メモ（IndexedDB 保存）はデモ版に含めるか。

**Opus 推奨**: 🟡 **第一版では削除**
- グループウェアの掲示板で代替可能
- IndexedDB 連携は実装重量大
- 必要なら Phase 2-B.1 で `demo_sticky_notes` コレクション新設して追加

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
- v0.3.1（仮想）: ナビバーへの同 OS 反映
- v0.3.x（パッチ）: バグ修正のみ

ただし、本 Phase ではナビバー追加も同時実施するため **v0.3.0 で全て完結**。

### 12.3 RELEASE_NOTES.md 更新

```markdown
## v0.3.0 (2026-05-XX) — SAKURA OS デモ版追加（Phase 2-B 完了）

### 追加（Phase 2-B 実装）

**SAKURA OS（OS 風ランチャー・クリーンルーム実装）**
- `sakura-os.html` 新規作成
  - 左パネル：時計・天気・アプリグリッド・為替・カレンダー・本日のタスク
  - メイン：ニュースティッカー・デスクトップ
  - タスクバー：起動中アプリ・ユーザー名・ログアウト
  - 壁紙：プリセット 9 種 + カスタム URL（localStorage）
  - テーマ：dark/light 切替
  - SAKURA AI / SAKURA MUSIC / 申込み管理 / 利用明細 / 通話明細 / マスコット / 付箋 → デモ版から削除
  - Email/Password + demo_sessions 認証（v0.1.8 と同一方式）
  - Firestore: `demo_calendar_events` / `demo_todos` read only
- 既存業務ロジック非破壊（ordersystem / invoice / groupware）

**ナビゲーションバー更新（4 ページ対応）**
- `ordersystem.html` — ナビに「🖥️ SAKURA OS」追加
- `invoice.html` — 同上
- `groupware.html` — 同上
- `index.html` — 機能カードに SAKURA OS 追記（任意）

**Firestore Rules**（変更なし）
- v0.1.8 / v0.2.0 で既にデプロイ済みの v12 Rules で完結

**バックアップ**
- `backups/v0.2.0/` に v0.2.0 時点のファイルを保存
```

---

## 13. 工数見積もり

### 13.1 詳細工数

| 作業項目 | 工数 |
|---------|:----:|
| **A. sakura-os.html 新規作成（クリーンルーム）** | |
| ┣ 認証・セッション検証・緊急停止 | 1.5h |
| ┣ 左パネル UI（時計・天気・アプリグリッド） | 2.0h |
| ┣ メインエリア UI（ニュース・為替・カレンダー） | 2.0h |
| ┣ ウィンドウシステム（iframe・ドラッグ・リサイズ） | 2.5h |
| ┣ タスクバー・ログアウト・テーマ切替 | 1.0h |
| ┣ 壁紙パネル（プリセット 9 種 + カスタム URL） | 1.0h |
| ┣ Firestore 連携（demo_calendar_events / demo_todos） | 1.5h |
| ┣ 外部 API（天気・ニュース・為替）のフォールバック実装 | 1.0h |
| ┣ DEMO バナー追加・既存ページとスタイル統一 | 0.5h |
| **B. ナビバー更新（既存 3〜4 ファイル）** | 1.0h |
| **C. テスト・検証** | |
| ┣ 本番通信ゼロ検証（Playwright 拡張） | 1.0h |
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
| **合計** | **約 18-20h** |

### 13.2 工数比較（Phase 2-A 実績との対比）

| Phase | 主要作業 | 工数 |
|-------|---------|:---:|
| Phase 2-A v0.1.8 | 認証移行 | 4h |
| Phase 2-A v0.2.0 | グループウェア | 22h |
| **Phase 2-B v0.3.0** | **SAKURA OS（本書）** | **18-20h** |

Phase 2-A グループウェアより工数小：
- ✅ 認証は v0.1.8 で確立済み（コピーで OK）
- ✅ Firestore Rules 変更なし（Rules 設計工数ゼロ）
- ✅ write 機能なし（CRUD 実装ゼロ）
- ⚠️ ただし iframe ウィンドウシステム・ドラッグ/リサイズは新規実装

### 13.3 着手前提条件

- [x] Phase 2-A v0.2.0 デプロイ完了済み
- [x] `demo_calendar_events` / `demo_todos` に seed データあり（v0.2.0 で投入済み）
- [ ] Codex 本書レビュー完了
- [ ] ユーザー Q1-Q7 回答受領

---

## 14. 着手手順（Sonnet 向け）

1. 本書 v1（または Codex 修正後の vN）を再読
2. ユーザーの Q1-Q7 回答を確認
3. memory `project_demo_environment.md` を確認
4. `backups/v0.2.0/` を作成
5. `sakura-os.html` を**ゼロから書き起こし**（本番をコピーしない）
6. `scripts/check-no-prod-config.js` `scripts/detect-pii.js` を実行
7. 既存 3 ファイル（ordersystem/invoice/groupware）のナビバーに SAKURA OS リンクを追加
8. 手動 E2E + Playwright（本番通信ゼロ検証）
9. RELEASE_NOTES.md を v0.3.0 で更新
10. WinSCP でアップロード（ユーザー手動・Sonnet が手順を案内）

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
| **v1** | **2026-05-10** | **Opus 初稿（Codex レビュー待ち）** | **Phase 2-A v12 と同水準の構成で初稿作成** |

---

## 17. 採用必須修正チェックリスト（v1 → vN 用）

- [ ] Codex 第 1 回レビュー反映
- [ ] ユーザー Q1-Q7 回答反映
- [ ] 工数再見積もり

---

## 18. ユーザー判断要請（Q1-Q7・要回答）

| # | 質問 | 必要回答 |
|---|---|---|
| Q1 | クリーンルーム実装方針（本番コードコピーなし）OK | OK / NG |
| Q2 | SAKURA AI 完全削除（左アイコン・右パネル・マスコット動画）OK | OK / NG |
| Q3 | demo_calendar_events / demo_todos を read のみで使用 OK | OK / NG |
| Q4 | iframe アプリウィンドウ方式（同一ドメイン）OK | OK / NG |
| Q5 | 外部 API（天気・ニュース・為替）そのまま使用 OK | OK / NG |
| Q6 | 壁紙：プリセット + URL のみ（ファイルアップロード削除）OK | OK / NG |
| Q7 | 付箋メモ機能 第一版では削除 OK | OK / NG |

---

## 19. Codex 最終ステータス（v1 時点）

```
判定: 未レビュー（v1 初稿）
クリーンルーム方針: 推奨
SAKURA AI 完全削除: 推奨
demo_* read のみ: 推奨
新規コレクション: なし（推奨）
Rules 変更: なし（推奨）
既存業務ロジック非破壊: 維持（v0.2.0 と同方針）
Sonnet 実装着手: 🟡 待機（Codex レビュー後に判定）
```

---

**v1 確認書、以上です。**

Phase 2-A v12 と同水準の構成・粒度で記述。
Codex レビュー受領 → ユーザー Q1-Q7 回答 → v2 作成 → Sonnet 実装着手の流れを想定。
