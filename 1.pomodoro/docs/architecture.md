# アーキテクチャ概要

## 1. 全体方針

タイマーの時間進行はブラウザ側（JavaScript）で管理し、Flask はトップページの配信と静的ファイルの提供に徹します。

---

## 2. レイヤ構成

アプリケーションは以下の 4 層で構成されます。

```
┌─────────────────────────────────────────┐
│  Web 層（Flask）                         │
│  - トップページ配信（GET /）              │
│  - 静的ファイル配信                       │
├─────────────────────────────────────────┤
│  フロントエンド UI 層                     │
│  - DOM イベントの登録（handlers.js）      │
│  - 画面描画（render.js）                  │
├─────────────────────────────────────────┤
│  フロントエンド Domain 層                 │
│  - タイマー状態管理（timerState.js）      │
│  - 状態遷移ロジック（timerReducer.js）    │
│  - 時間計算（timeMath.js）                │
│  - 設定バリデーション（settings.js）      │
├─────────────────────────────────────────┤
│  Ports 層（副作用の抽象化）               │
│  - 現在時刻取得（clock.js）               │
│  - 状態の保存・復元（storage.js）         │
│  - 通知（notifier.js）                    │
└─────────────────────────────────────────┘
```

---

## 3. ディレクトリ構成

```
1.pomodoro/
├── app.py                          # エントリーポイント
├── requirements.txt
├── pytest.ini
├── package.json
├── pomodoro_app/
│   ├── __init__.py                 # create_app() ファクトリ
│   ├── config.py                   # DefaultConfig / TestingConfig
│   ├── routes.py                   # Blueprint: GET /
│   ├── repositories/
│   │   └── session_repository.py  # InMemorySessionRepository
│   └── services/
│       └── session_service.py     # SessionService
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js                 # エントリーポイント
│       ├── domain/
│       │   ├── timerState.js
│       │   ├── timerReducer.js
│       │   ├── timeMath.js
│       │   └── settings.js
│       ├── ports/
│       │   ├── clock.js
│       │   ├── storage.js
│       │   └── notifier.js
│       └── ui/
│           ├── handlers.js
│           └── render.js
└── tests/
    ├── python/
    │   ├── conftest.py
    │   ├── test_routes.py
    │   └── test_session_repository.py
    └── js/
        ├── timeMath.test.js
        └── timerReducer.test.js
```

---

## 4. データの流れ

1. Flask が `GET /` リクエストに対して `index.html` を返す
2. ブラウザで `main.js` が起動し、localStorage から状態を復元または初期状態を生成する
3. ユーザー操作を `ui/handlers.js` が受け取る
4. `domain/timerReducer.js` の純粋関数が次の状態を返す
5. `ui/render.js` が DOM を更新して画面を再描画する
6. 新しい状態を `ports/storage.js` 経由で localStorage に保存する
7. `main.js` の `syncTicker()` が `setInterval`（250ms 間隔）を開始・停止する

---

## 5. Flask アプリケーション構成

### app factory（`pomodoro_app/__init__.py`）

```python
def create_app(config_object=DefaultConfig):
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config_object)
    app.register_blueprint(main_blueprint)
    return app
```

- テスト時は `TestingConfig` を渡して設定を差し替え可能
- Blueprint `main_blueprint` を登録

### 設定クラス（`pomodoro_app/config.py`）

| クラス           | SECRET_KEY | TESTING |
|------------------|------------|---------|
| `DefaultConfig`  | `"dev"`    | `False` |
| `TestingConfig`  | `"dev"`    | `True`  |

---

## 6. バックエンド層構成（現状）

### Repository 層

`InMemorySessionRepository` がセッション一覧をメモリ上で管理します。現時点では永続化は行われていません。

### Service 層

`SessionService` が `InMemorySessionRepository` を受け取り、`list_sessions()` を委譲します。

> **注意**: 現時点では `SessionService` と `InMemorySessionRepository` はルートから利用されていません。将来の API 実装のために骨格として存在します。

---

## 7. 設計原則

- **時間計算は純粋関数**: `targetEpochMs` と現在時刻の差分から `remainingSeconds` を算出
- **状態遷移は UI から分離**: reducer 関数群（`timerReducer.js`）に集約
- **副作用は ports に閉じ込める**: `clock.js`、`storage.js`、`notifier.js`
- **Flask は入口に徹する**: HTML 配信と静的ファイル提供のみ
- **永続化は adapter と repository で隠蔽**: 将来の SQLite 移行を想定
