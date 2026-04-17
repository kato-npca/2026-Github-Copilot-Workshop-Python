# フロントエンドモジュールドキュメント

## 1. 概要

フロントエンドは ES モジュール形式で構成されており、`domain`・`ports`・`ui` の 3 層に分割されています。

```
static/js/
├── main.js          # エントリーポイント
├── domain/          # 純粋関数によるタイマーロジック
│   ├── timerState.js
│   ├── timerReducer.js
│   ├── timeMath.js
│   └── settings.js
├── ports/           # 副作用の抽象化
│   ├── clock.js
│   ├── storage.js
│   └── notifier.js
└── ui/              # DOM 操作
    ├── handlers.js
    └── render.js
```

---

## 2. エントリーポイント

### `main.js`

アプリケーションの起動と状態管理ループを担当します。

**主な処理:**

1. `loadState()` で localStorage から状態を読み込む（なければ `createInitialState()` で初期状態を生成）
2. `restoreTimerState()` で実行中タイマーの残り時間を補正
3. `bindHandlers()` で UI イベントハンドラを登録
4. `setState()` で初期描画を実行
5. `syncTicker()` でタイマーの tick 管理（250ms 間隔の `setInterval`）

**主な変数:**

| 変数       | 型              | 説明                                       |
|------------|-----------------|--------------------------------------------|
| `state`    | `TimerState`    | 現在のタイマー状態                         |
| `tickerId` | `number \| null`| `setInterval` の ID。停止中は `null`       |

**`setState(nextState)` の処理フロー:**

```
setState(nextState)
  → state = nextState
  → renderTimer(state)   // 画面を再描画
  → saveState(state)     // localStorage に保存
  → syncTicker()         // setInterval の開始・停止を同期
```

---

## 3. Domain 層

### `timerState.js`

タイマーの初期状態を生成します。

#### `DEFAULT_SETTINGS`

```js
{
  focusSeconds: 1500,      // 25分
  shortBreakSeconds: 300,  // 5分
  longBreakSeconds: 900,   // 15分
  longBreakInterval: 4,    // 4回ごとに長休憩
}
```

#### `createInitialState(settings?)`

カスタム設定（省略可）を受け取り、初期状態オブジェクトを返します。

```js
createInitialState()
// → { mode: "focus", isRunning: false, completedFocusCount: 0,
//     remainingSeconds: 1500, targetEpochMs: null, settings: DEFAULT_SETTINGS }
```

---

### `timerReducer.js`

タイマー状態遷移のロジックを純粋関数として提供します。すべての関数は新しい状態オブジェクトを返し、引数を変更しません。

#### `startTimer(state, nowEpochMs)`

タイマーを開始します。

- `isRunning === true` または `remainingSeconds <= 0` の場合は同じ state を返す
- `targetEpochMs = nowEpochMs + remainingSeconds * 1000` を計算して設定

#### `pauseTimer(state, nowEpochMs)`

タイマーを一時停止します。

- `isRunning === false` の場合は同じ state を返す
- `remainingSeconds` を現在時刻から再計算し、`targetEpochMs` を `null` にリセット

#### `resetTimer(state)`

現在のモードをそのままに、残り時間を設定値に戻します。

- 内部で `transitionToMode(state, state.mode)` を呼び出す

#### `transitionToMode(state, mode)`

指定したモードに切り替えます。

- サポートされていないモード値は `"focus"` に補正される
- `isRunning` を `false`、`targetEpochMs` を `null` にリセット
- `remainingSeconds` をそのモードの設定値に設定

**サポートされるモード**: `"focus"` / `"shortBreak"` / `"longBreak"`

#### `tickTimer(state, nowEpochMs)`

タイマーを 1 tick 進めます（250ms ごとに呼ばれる）。

- `isRunning === false` または `targetEpochMs === null` の場合は同じ state を返す
- `remainingSeconds` が変化していない場合は同じ state を返す（不要な再描画を防止）
- `remainingSeconds` が 0 になった場合は `isRunning` を `false` に設定

#### `restoreTimerState(snapshot, nowEpochMs)`

localStorage から読み込んだスナップショットを元に状態を復元します。

- `snapshot` が `null` の場合は `createInitialState()` を返す
- 実行中だった場合（`isRunning === true` かつ `targetEpochMs` が数値）は `tickTimer()` で残り時間を補正
- `completedFocusCount` は 0 以上の整数でなければ `0` に補正

---

### `timeMath.js`

時間計算のユーティリティ関数です。

#### `getRemainingSeconds(targetEpochMs, nowEpochMs)`

`targetEpochMs` と `nowEpochMs` の差分から残り秒数を計算します。

- `targetEpochMs === null` の場合は `0` を返す
- `Math.ceil` で切り上げ、`Math.max(..., 0)` で負にならないよう保護

```js
getRemainingSeconds(Date.now() + 5000, Date.now())  // → 5
getRemainingSeconds(null, Date.now())               // → 0
```

#### `formatSeconds(totalSeconds)`

秒数を `"MM:SS"` 形式の文字列に変換します。

```js
formatSeconds(1500)  // → "25:00"
formatSeconds(65)    // → "01:05"
formatSeconds(0)     // → "00:00"
```

---

### `settings.js`

設定値のバリデーションを行います。

#### `validateSettings(settings)`

Settings オブジェクトのすべての値が正の整数であれば `true` を返します。

```js
validateSettings({ focusSeconds: 1500, shortBreakSeconds: 300, longBreakSeconds: 900, longBreakInterval: 4 })
// → true

validateSettings({ focusSeconds: -1, ... })
// → false
```

---

## 4. Ports 層

### `clock.js`

現在時刻の取得を抽象化します。

#### `systemClock()`

`Date.now()` を返します。テストでは差し替えが可能です。

---

### `storage.js`

localStorage への状態の保存・復元を担当します。

- **ストレージキー**: `"pomodoro-state"`

#### `saveState(state)`

状態を JSON 文字列にして localStorage に保存します。失敗した場合は `console.warn` を出力して無視します。

#### `loadState()`

localStorage から状態を読み込み、JSON パースして返します。

- 値が存在しない場合は `null` を返す
- パースに失敗した場合は `console.warn` を出力して `null` を返す

---

### `notifier.js`

タイマー完了時の通知を担当します。

#### `notifyTimerCompleted()`

現時点ではスタブ実装です（常に `undefined` を返します）。将来的に通知音やブラウザ通知が実装される予定です。

---

## 5. UI 層

### `handlers.js`

DOM イベントとタイマーロジックを接続します。

#### `bindHandlers({ getState, setState, clock })`

以下のボタンにイベントリスナーを登録します。

| 要素 ID         | イベント | 処理                                                   |
|-----------------|----------|--------------------------------------------------------|
| `start-button`  | `click`  | `startTimer(getState(), clock())` を呼び出す           |
| `pause-button`  | `click`  | `pauseTimer(getState(), clock())` を呼び出す           |
| `reset-button`  | `click`  | `resetTimer(getState())` を呼び出す                    |
| `[data-mode]`   | `click`  | `transitionToMode(getState(), button.dataset.mode)` を呼び出す |

---

### `render.js`

タイマー状態を受け取り、DOM を更新して画面を再描画します。

#### `renderTimer(state)`

以下の DOM 要素を更新します。

| 要素 ID                   | 更新内容                                         |
|---------------------------|--------------------------------------------------|
| `mode-label`              | モード名（`"Focus"` / `"Short Break"` / `"Long Break"`） |
| `mode-description`        | モードの説明文（日本語）                         |
| `timer-display`           | 残り時間（`"MM:SS"` 形式）                       |
| `cycle-count`             | 完了した集中セッション数                         |
| `focus-setting`           | 集中時間設定値（`"25 分"` 形式）                 |
| `short-break-setting`     | 短い休憩設定値（`"5 分"` 形式）                  |
| `long-break-setting`      | 長い休憩設定値（`"15 分"` 形式）                 |
| `long-break-interval-setting` | 長い休憩までの回数（`"4 回"` 形式）          |
| `session-status`          | ステータスバッジ（ラベルと `data-status` 属性）  |
| `timer-ring-progress`     | プログレスリングの `stroke-dashoffset`           |
| `[data-mode]` ボタン群    | `aria-pressed` 属性（アクティブなモードに `"true"`）|

**プログレスリング計算:**

```
RING_CIRCUMFERENCE = 2 * Math.PI * 90  // ≈ 565.49
progress = remainingSeconds / totalSeconds
offset = RING_CIRCUMFERENCE * (1 - progress)
```

---

## 6. テンプレート

### `templates/index.html`

Flask の `render_template()` で返される単一ページのテンプレートです。

**主要な DOM 要素（JavaScript から参照されるもの）:**

| 要素 ID / セレクタ          | 種類     | 役割                              |
|-----------------------------|----------|-----------------------------------|
| `start-button`              | `button` | タイマー開始                      |
| `pause-button`              | `button` | 一時停止                          |
| `reset-button`              | `button` | リセット                          |
| `[data-mode]` ボタン群      | `button` | モード切替タブ                    |
| `timer-display`             | `p`      | 残り時間表示                      |
| `mode-label`                | `p`      | モード名表示                      |
| `mode-description`          | `p`      | モード説明表示                    |
| `session-status`            | `p`      | ステータスバッジ                  |
| `cycle-count`               | `dd`     | 完了セッション数表示              |
| `focus-setting`             | `strong` | 集中時間設定値表示                |
| `short-break-setting`       | `strong` | 短い休憩設定値表示                |
| `long-break-setting`        | `strong` | 長い休憩設定値表示                |
| `long-break-interval-setting`| `strong`| 長休憩間隔設定値表示              |
| `timer-ring-progress`       | `circle` | SVG プログレスリング              |

---

## 7. スタイルシート

### `static/css/style.css`

**デザイントークン（CSS カスタムプロパティ）:**

- スペーシング: `--space-xs`〜`--space-2xl`
- 角丸: `--radius-sm`〜`--radius-full`
- シャドウ: `--shadow-sm`〜`--shadow-lg`
- トランジション: `--transition-fast`、`--transition-base`
- カラー: `--bg`、`--surface`、`--text`、`--accent`（`#ef4444`）、`--success`（`#22c55e`）など

**レスポンシブ対応:**

- `768px` 以下: 2カラムグリッドを 1カラムに変更
- `480px` 以下: ボタンを縦並び、プログレスリングを `65vw` に拡大

**アクセシビリティ:**

- `prefers-reduced-motion` メディアクエリでアニメーションを無効化
- ダークモード（`prefers-color-scheme: dark`）に対応
