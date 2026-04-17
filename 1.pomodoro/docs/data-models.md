# データモデル仕様

## 1. フロントエンドの状態モデル

タイマーのすべての状態は単一のオブジェクト（`state`）で管理されます。

### タイマー状態オブジェクト

| フィールド            | 型               | 説明                                                                 |
|-----------------------|------------------|----------------------------------------------------------------------|
| `mode`                | `string`         | 現在のモード。`"focus"` / `"shortBreak"` / `"longBreak"` のいずれか |
| `isRunning`           | `boolean`        | タイマーが動作中かどうか                                             |
| `remainingSeconds`    | `number`         | 残り秒数（整数）                                                     |
| `targetEpochMs`       | `number \| null` | タイマー終了予定のエポックミリ秒。停止中は `null`                    |
| `completedFocusCount` | `number`         | 完了した集中セッションの回数（0 以上の整数）                         |
| `settings`            | `Settings`       | タイマーの設定値                                                     |

**初期値例:**

```json
{
  "mode": "focus",
  "isRunning": false,
  "remainingSeconds": 1500,
  "targetEpochMs": null,
  "completedFocusCount": 0,
  "settings": {
    "focusSeconds": 1500,
    "shortBreakSeconds": 300,
    "longBreakSeconds": 900,
    "longBreakInterval": 4
  }
}
```

---

### Settings オブジェクト

| フィールド           | 型       | デフォルト値 | 説明                                     |
|----------------------|----------|--------------|------------------------------------------|
| `focusSeconds`       | `number` | `1500`（25分）| 集中セッションの秒数                     |
| `shortBreakSeconds`  | `number` | `300`（5分）  | 短い休憩の秒数                           |
| `longBreakSeconds`   | `number` | `900`（15分） | 長い休憩の秒数                           |
| `longBreakInterval`  | `number` | `4`           | 長い休憩が入るまでの集中セッション回数   |

すべてのフィールドは正の整数である必要があります（`validateSettings()` で検証）。

---

## 2. localStorage への永続化

状態オブジェクト全体を JSON シリアライズして保存します。

- **キー**: `"pomodoro-state"`
- **値**: タイマー状態オブジェクトの JSON 文字列

**保存・復元の動作:**

- `saveState(state)`: `localStorage.setItem("pomodoro-state", JSON.stringify(state))`
- `loadState()`: `localStorage.getItem("pomodoro-state")` をパースして返す。失敗時は `null` を返す

**実行中タイマーの復元:**

ページ再読込時、`isRunning === true` かつ `targetEpochMs` が数値であれば、復元時刻と `targetEpochMs` の差分から残り秒数を再計算します（`restoreTimerState()` 内の `tickTimer()` 呼び出し）。

---

## 3. バックエンドのデータモデル（現状）

### InMemorySessionRepository

セッション一覧をメモリ上の配列で管理します。

```python
class InMemorySessionRepository:
    def __init__(self):
        self._sessions = []  # 空リストで初期化

    def list_sessions(self):
        return list(self._sessions)  # コピーを返す
```

> **注意**: 現時点では永続化は実装されていません。アプリ再起動でデータは消えます。将来的には SQLite などへの移行が計画されています。

---

## 4. モードの種類

| 値            | 表示名      | 説明               |
|---------------|-------------|--------------------|
| `"focus"`     | Focus       | 集中セッション     |
| `"shortBreak"`| Short Break | 短い休憩           |
| `"longBreak"` | Long Break  | 長い休憩           |

---

## 5. セッションステータス

`render.js` で画面に表示されるステータスバッジの状態です。

| `isRunning` | `remainingSeconds` | ラベル  | `data-status` |
|-------------|---------------------|---------|---------------|
| `true`      | 任意                | 実行中  | `"running"`   |
| `false`     | `0`                 | 完了    | `"done"`      |
| `false`     | `> 0`               | 停止中  | `"stopped"`   |
