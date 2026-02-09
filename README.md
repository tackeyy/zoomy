# zoom-cli

Zoom ミーティングの作成・一覧取得を行う CLI ツール。Server-to-Server OAuth で認証。

## セットアップ

### 1. 依存関係のインストール

```bash
cd ~/dev/zoom-cli
npm install
```

### 2. Zoom Server-to-Server OAuth アプリの作成

1. [Zoom Marketplace](https://marketplace.zoom.us/) にログイン
2. **Develop** → **Build App** → **Server-to-Server OAuth** を選択して **Create**
3. アプリ名を入力（例: `zoom-cli`）

### 3. スコープの設定

Scopes タブで **+ Add Scopes** をクリックし、以下を検索して追加:

- `meeting:write:meeting` — ミーティング作成用
- `meeting:read:list_meetings` — ミーティング一覧取得用

![Zoom Scopes 設定画面](docs/images/zoom-scopes.png)

### 4. アプリの有効化

**Activation** タブで **Activate your app** をクリック。

### 5. `.env` の作成

App Credentials タブに表示される Account ID / Client ID / Client Secret を `.env` に設定:

```bash
cp .env.example .env
```

```bash
# 認証（必須）
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret

# 設定（任意）
ZOOM_TIMEZONE=Asia/Tokyo
ZOOM_DATE_FORMAT=yyyy/MM/dd HH:mm
ZOOM_TOPIC_TEMPLATE={{date}} | {{with}}
ZOOM_TOPIC_TEMPLATE_NO_WITH={{date}}
```

## 使い方

### ミーティング作成

```bash
# 相手ありの場合 → タイトル: "2026/02/10 10:00 | 田中様"
npx tsx src/index.ts create --start "2026-02-10T10:00:00" --duration 60 --with "田中様"

# 相手なしの場合 → タイトル: "2026/02/10 10:00"
npx tsx src/index.ts create --start "2026-02-10T10:00:00" --duration 60

# JSON出力
npx tsx src/index.ts create --start "2026-02-10T10:00:00" --duration 60 --with "田中様" --json
```

### ミーティング一覧

```bash
npx tsx src/index.ts list
npx tsx src/index.ts list --from "2026-02-10" --to "2026-02-14"
npx tsx src/index.ts list --json
```

## 設定

| 環境変数 | デフォルト | 説明 |
|---|---|---|
| `ZOOM_TIMEZONE` | `Asia/Tokyo` | タイムゾーン |
| `ZOOM_DATE_FORMAT` | `yyyy/MM/dd HH:mm` | トピック内の日時フォーマット |
| `ZOOM_TOPIC_TEMPLATE` | `{{date}} \| {{with}}` | `--with` 指定時のトピックテンプレート |
| `ZOOM_TOPIC_TEMPLATE_NO_WITH` | `{{date}}` | `--with` 未指定時のトピックテンプレート |
