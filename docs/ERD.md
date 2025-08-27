# ER 図 (Prisma schema 抜粋)

```prisma
model Artist {
  id        String  @id
  name      String
  image_url String?
  bio       String?
  genre     String?
  songs     Song[]
}

model Song {
  id        BigInt  @id @default(autoincrement())
  artist_id String
  title     String
  track_no  Int?
  artist    Artist  @relation(fields: [artist_id], references: [id])

  @@unique([artist_id, title])
}
```
