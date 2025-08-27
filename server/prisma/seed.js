// prisma/seed.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // artists.json の探索（/app/public を優先）
  const candidates = [
    '/app/public/artists.json',
    path.resolve(__dirname, '../public/artists.json'),
    path.resolve(__dirname, '../../public/artists.json'),
  ];
  let jsonPath = null;
  for (const p of candidates) {
    try {
      await fs.access(p);
      jsonPath = p;
      break;
    } catch {}
  }
  if (!jsonPath) throw new Error('artists.json が見つかりませんでした');

  const raw = await fs.readFile(jsonPath, 'utf-8');
  /** @type {{id:string,name:string,image?:string,genre?:string,bio?:string,songs?:string[]}[]} */
  const artists = JSON.parse(raw);

  // ★ Genreテーブルは使わない → Artist.genre 文字列に保存
  for (const a of artists) {
    const pop = Math.floor(Math.random() * 100) + 1; // 1〜100 のダミー人気度
    await prisma.artist.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        image_url: a.image ?? null,
        bio: a.bio ?? null,
        genre: a.genre ?? null, // ← 文字列でそのまま
        popularity: pop, // 追加
      },
      create: {
        id: a.id,
        name: a.name,
        image_url: a.image ?? null,
        bio: a.bio ?? null,
        genre: a.genre ?? null, // ← 文字列でそのまま
        popularity: pop, // 追加
      },
    });

    const titles = (a.songs ?? []).filter(Boolean);
    if (titles.length) {
      await prisma.song.createMany({
        data: titles.map((t) => ({ artist_id: a.id, title: t })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`Seed 完了: artists=${artists.length}`);
}

main()
  .catch((e) => {
    console.error('Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
