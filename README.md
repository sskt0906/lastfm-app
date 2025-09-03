Last.fm 風 音楽検索アプリ (Portfolio)

バックエンド (Express + Prisma + MySQL) と
フロントエンド (React + Vite) を Docker でまとめたポートフォリオアプリです。

機能概要:
- アーティストの 一覧 / 詳細 / 検索 / ページング
- CRUD API（作成 / 更新 / 削除）
- Prisma + MySQL スキーマ設計
- Zod による API リクエストバリデーション
- Docker Compose でワンコマンド起動

--------------------------------------------------
ドキュメント
- docs/DETAIL.md : 技術詳細
- docs/SETUP.md  : セットアップガイド
- docs/ERD.md    : ER 図

--------------------------------------------------
クイックスタート
前提: Docker / Docker Compose がインストール済み

1. リポジトリ取得
   git clone <your-repo-url>.git
   cd <repo-name>

2. 環境変数のサンプルを実ファイルにコピー
   cp client/.env.example client/.env
   cp server/.env.example server/.env

3. コンテナ起動（ビルド込み）
   docker compose up -d --build

4. 動作確認（別ターミナルで実行）
   curl http://localhost:5174/api/health        # => {"ok":true}
   curl "http://localhost:5174/api/artists"     # 一覧レスポンス

フロントの表示（例）
- http://localhost:5173 （Vite）
- API: http://localhost:5174

※ ポートは docker-compose.yml に依存します。

--------------------------------------------------
プロジェクト構成

.
├─ client/                 # React + Vite
│  ├─ src/
│  ├─ .env.example         # フロント用サンプル環境変数
│  └─ ...
├─ public/
│  └─ artists.json         # Seed 用の初期データ
├─ server/                 # Express API
│  ├─ index.js             # ルーティング（/api/...）
│  ├─ prisma/
│  │  ├─ schema.prisma     # Prisma スキーマ
│  │  └─ seed.js           # Seed スクリプト
│  ├─ schemas.js           # Zod スキーマ（バリデーション）
│  ├─ validate.js          # Zod バリデーション共通ミドルウェア
│  ├─ .env.example         # サーバー用サンプル環境変数
│  └─ package.json
├─ docker-compose.yml
└─ README.txt

--------------------------------------------------
主要エンドポイント

GET    /api/health                         ヘルスチェック
GET    /api/artists?q=&page=&pageSize=     検索 + ページング（items,total,page,pageSize）
GET    /api/artist/:id                     アーティスト詳細
POST   /api/artists                        追加 { id,name,genre,image,bio,songs[] }
PATCH  /api/artist/:id                     更新（部分更新・songs は入れ替え可）
DELETE /api/artist/:id                     削除

サンプル:
# 追加
curl -X POST http://localhost:5174/api/artists \
  -H "Content-Type: application/json" \
  -d '{"id":"luna-sea","name":"LUNA SEA","genre":"Rock","songs":["ROSIER","I for You"]}'

# 更新（名前だけ）
curl -X PATCH http://localhost:5174/api/artist/luna-sea \
  -H "Content-Type: application/json" \
  -d '{"name":"LUNA SEA（改）"}'

# 更新（曲を入れ替え）
curl -X PATCH http://localhost:5174/api/artist/luna-sea \
  -H "Content-Type: application/json" \
  -d '{"songs":["TRUE BLUE","gravity"]}'

# 削除
curl -X DELETE http://localhost:5174/api/artist/luna-sea -i

--------------------------------------------------
環境変数

両プロジェクトとも .env.example を同梱。そのまま .env にコピーして編集してください。

client/.env
例: VITE_API_BASE=http://localhost:5174
例: VITE_LASTFM_API_KEY=（ダミー値）

server/.env
例: DATABASE_URL=mysql://app:apppass@db:3306/lastfm
例: PORT=5174
例: CLIENT_URL=http://localhost:5173

※ セキュリティ上、実キーはコミットしない方針です（.env は .gitignore）。

--------------------------------------------------
Prisma スキーマ抜粋

model Artist {
  id        String  @id
  name      String
  image_url String?
  bio       String?
  genre     String?
  songs     Song[]

  @@index([name])
  @@index([genre])
}

model Song {
  id        BigInt  @id @default(autoincrement())
  artist_id String
  title     String
  track_no  Int?
  artist    Artist  @relation(fields: [artist_id], references: [id])

  @@unique([artist_id, title])
  @@index([title])
}

設計意図（要約）:
- フロント実装を簡単にするため Artist.genre は文字列で保持（正規化は後日拡張可能）
- Song は (artist_id, title) をユニークにして重複登録を防止
- 検索用に Artist.name / genre / Song.title にインデックス

--------------------------------------------------
よくあるトラブル

- P1001: Can't reach database server at db:3306
  → docker compose up -d が未実行 / db のヘルスチェック待ちの可能性。少し待ってから再実行。

- Empty reply from server / 500 internal_error
  → server のログを確認: docker compose logs -f server

- フロントが API に繋がらない
  → client/.env の VITE_API_BASE を確認（デフォルト http://localhost:5174）

--------------------------------------------------
ライセンス
MIT（予定）

