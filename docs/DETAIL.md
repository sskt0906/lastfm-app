# 技術詳細 (DETAIL)

このアプリは **音楽アーティスト管理 API + React フロント** で構成されています。  
ポートフォリオとして「実務イメージが湧く」ことを意識して設計しました。

---

## 使用技術

- **バックエンド**: Node.js (Express), Prisma ORM, MySQL 8
- **フロントエンド**: React 18, Vite
- **バリデーション**: Zod
- **インフラ**: Docker / docker-compose

---

## Prisma Schema 抜粋

```prisma
datasource db { provider = "mysql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Artist {
  id        String  @id
  name      String
  image_url String?
  bio       String?
  genre     String?      // 文字列保持（タグ運用を優先）
  songs     Song[]

  @@index([name])
  @@index([genre])
}

model Song {
  id        BigInt @id @default(autoincrement())
  artist_id String
  title     String
  artist    Artist @relation(fields: [artist_id], references: [id])

  @@unique([artist_id, title])
  @@index([title])
}
```
