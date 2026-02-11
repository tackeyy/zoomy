# zoomy — Zoom をターミナルから。

[\[English\]](README.md)

Server-to-Server OAuth を使って Zoom リソースを管理する CLI ツール。JSON 出力、カスタマイズ可能なミーティングトピック、スクリプト連携に対応。

## 特徴

- **ミーティング** — トピック自動生成付きのミーティング作成・取得・更新・削除、日付フィルタ付きの一覧取得
- **カスタマイズ可能なトピック** — 日時フォーマットと参加者名を使ったテンプレートベースのトピック生成
- **JSON 出力** — スクリプトや自動化のための `--json` フラグ
- **Server-to-Server OAuth** — ブラウザログイン不要、トークン自動更新
- **タイムゾーン対応** — トピックの日時フォーマットに任意のタイムゾーンを設定可能

## インストール

### npm（グローバル）

```bash
npm install -g github:tackeyy/zoomy
```

### クローンしてインストール

```bash
git clone https://github.com/tackeyy/zoomy.git
cd zoomy
npm install -g .
```

## クイックスタート

### 1. Zoom Server-to-Server OAuth アプリの作成

1. [Zoom Marketplace](https://marketplace.zoom.us/) にログイン
2. **Develop** > **Build App** > **Server-to-Server OAuth** > **Create**
3. アプリ名を入力（例: `zoomy`）

### 2. スコープの設定

**Scopes** タブで **+ Add Scopes** をクリックし、以下を追加:

- `meeting:write:meeting` — ミーティング作成・更新・削除
- `meeting:read:list_meetings` — ミーティング一覧取得
- `meeting:read:meeting` — ミーティング詳細取得

![Zoom Scopes](docs/images/zoom-scopes.png)

### 3. アプリの有効化

**Activation** タブで **Activate your app** をクリック。

### 4. 環境変数の設定

```bash
cp .env.example .env
```

**App Credentials** タブの情報を `.env` に設定:

```bash
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

### 5. 実行

```bash
zoomy create --start "2026-02-10T10:00:00" --duration 60 --with "田中様"
```

## コマンド

### `create` — ミーティングを作成

```bash
zoomy create --start <datetime> --duration <minutes> [--with <name>] [--json]
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--start <datetime>` | Yes | 開始時刻（ISO 8601 形式、例: `2026-02-10T10:00:00`） |
| `--duration <minutes>` | Yes | 所要時間（分、最大 1440） |
| `--with <name>` | No | 参加者名（トピックに使用） |
| `--json` | No | JSON 形式で出力 |

例:

```bash
# 参加者あり — トピック: "2026/02/10 10:00 | 田中様"
zoomy create --start "2026-02-10T10:00:00" --duration 60 --with "田中様"

# 参加者なし — トピック: "2026/02/10 10:00"
zoomy create --start "2026-02-10T10:00:00" --duration 30

# JSON 出力
zoomy create --start "2026-02-10T10:00:00" --duration 60 --with "田中様" --json
```

### `list` — ミーティング一覧を取得

```bash
zoomy list [--from <date>] [--to <date>] [--json]
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `--from <date>` | No | 開始日フィルタ（`YYYY-MM-DD`） |
| `--to <date>` | No | 終了日フィルタ（`YYYY-MM-DD`） |
| `--json` | No | JSON 形式で出力 |

例:

```bash
zoomy list
zoomy list --from "2026-02-10" --to "2026-02-14"
zoomy list --json
```

### `get` — ミーティング詳細を取得

```bash
zoomy get <meetingId> [--json]
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `<meetingId>` | Yes | ミーティング ID |
| `--json` | No | JSON 形式で出力 |

例:

```bash
zoomy get 12345678901
zoomy get 12345678901 --json
```

### `update` — ミーティングを更新

```bash
zoomy update <meetingId> [--topic <topic>] [--start <datetime>] [--duration <minutes>] [--json]
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `<meetingId>` | Yes | ミーティング ID |
| `--topic <topic>` | No | 新しいトピック |
| `--start <datetime>` | No | 新しい開始時刻（ISO 8601 形式） |
| `--duration <minutes>` | No | 新しい所要時間（分、最大 1440） |
| `--json` | No | JSON 形式で出力 |

`--topic`、`--start`、`--duration` のうち少なくとも1つが必要です。

例:

```bash
zoomy update 12345678901 --topic "新しいトピック"
zoomy update 12345678901 --start "2026-02-15T14:00:00" --duration 90
zoomy update 12345678901 --topic "更新済み" --json
```

### `delete` — ミーティングを削除

```bash
zoomy delete <meetingId>
```

| フラグ | 必須 | 説明 |
|---|---|---|
| `<meetingId>` | Yes | ミーティング ID |

例:

```bash
zoomy delete 12345678901
```

## 設定

### 環境変数

| 変数 | デフォルト | 説明 |
|---|---|---|
| `ZOOM_ACCOUNT_ID` | *（必須）* | Zoom アカウント ID |
| `ZOOM_CLIENT_ID` | *（必須）* | OAuth クライアント ID |
| `ZOOM_CLIENT_SECRET` | *（必須）* | OAuth クライアントシークレット |
| `ZOOM_TIMEZONE` | `Asia/Tokyo` | トピック内の日時に使用するタイムゾーン |
| `ZOOM_DATE_FORMAT` | `yyyy/MM/dd HH:mm` | トピック内の日時フォーマット |
| `ZOOM_TOPIC_TEMPLATE` | `{{date}} \| {{with}}` | `--with` 指定時のトピックテンプレート |
| `ZOOM_TOPIC_TEMPLATE_NO_WITH` | `{{date}}` | `--with` 未指定時のトピックテンプレート |

## 出力形式

### テキスト（デフォルト）

```
Meeting created!
  Topic:    2026/02/10 10:00 | 田中様
  Start:    2026-02-10T10:00:00Z
  Duration: 60 min
  Join URL: https://zoom.us/j/123456789
```

### JSON

```bash
zoomy create --start "2026-02-10T10:00:00" --duration 60 --with "田中様" --json
```

```json
{
  "id": 123456789,
  "topic": "2026/02/10 10:00 | 田中様",
  "start_time": "2026-02-10T10:00:00Z",
  "duration": 60,
  "join_url": "https://zoom.us/j/123456789"
}
```

## 開発

```bash
npm install
npm test
```

テストには [Vitest](https://vitest.dev/) を使用しています。

## ライセンス

ISC

## リンク

- [GitHub リポジトリ](https://github.com/tackeyy/zoomy)
- [Zoom API ドキュメント](https://developers.zoom.us/docs/api/)
- [Zoom Server-to-Server OAuth](https://developers.zoom.us/docs/internal-apps/s2s-oauth/)
