// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { validate } from './validate.js';
import {
  CreateArtistSchema,
  UpdateArtistSchema,
  ArtistParamsSchema,
  ListQuerySchema,
} from './schemas.js';

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 5174);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.options('*', cors({ origin: CLIENT_URL }));

// /api/artists 一覧 & 検索 + ページング
app.get('/api/artists', async (req, res) => {
  try {
    const { q, page, pageSize } = req.query; // ここは zod によって型が担保済み

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { genre: { contains: q } },
            {
              songs: { some: { title: { contains: q } } },
            },
          ],
        }
      : undefined;

    const baseSelect = {
      id: true,
      name: true,
      image_url: true,
      genre: true,
      bio: true,
      songs: { select: { title: true } }, // BigIntを返さない
    };

    const [total, rows] = await Promise.all([
      prisma.artist.count({ where }),
      prisma.artist.findMany({
        where,
        select: baseSelect,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image_url ?? null,
      genre: a.genre ?? null,
      bio: a.bio ?? null,
      songs: a.songs.map((s) => s.title),
    }));

    res.json({ items, total, page, pageSize });
  } catch (e) {
    console.error('GET /api/artists failed:', e);
    res
      .status(500)
      .json({ error: 'internal_error', detail: String(e?.message ?? e) });
  }
});

// /api/artist/:id 詳細
app.get('/api/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image_url: true,
        genre: true,
        bio: true,
        songs: { select: { title: true } }, // BigInt を返さない
      },
    });
    if (!artist) return res.status(404).json({ error: 'Not found' });

    const payload = {
      id: artist.id,
      name: artist.name,
      image: artist.image_url ?? null,
      genre: artist.genre ?? null,
      bio: artist.bio ?? null,
      songs: artist.songs.map((s) => s.title),
    };
    res.json(payload);
  } catch (e) {
    console.error('/api/artist/:id error:', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ===== ここから追記（/api/artists POST, /api/artist/:id PATCH/DELETE）=====

// CREATE: POST /api/artists
app.post('/api/artists', async (req, res) => {
  try {
    const { id, name, image, genre, bio, songs = [] } = req.body || {};
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    const created = await prisma.artist.create({
      data: {
        id,
        name,
        image_url: image ?? null,
        genre: genre ?? null,
        bio: bio ?? null,
        ...(Array.isArray(songs) && songs.length
          ? {
              songs: {
                createMany: {
                  data: songs.map((t) => ({ title: t })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        image_url: true,
        genre: true,
        bio: true,
        songs: { select: { title: true } },
      },
    });

    return res.status(201).json({
      id: created.id,
      name: created.name,
      image: created.image_url,
      genre: created.genre,
      bio: created.bio,
      songs: created.songs.map((s) => s.title),
    });
  } catch (e) {
    if (e.code === 'P2002') {
      // unique違反（id重複など）
      return res.status(409).json({ error: 'Artist id already exists' });
    }
    console.error('POST /api/artists error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// UPDATE: PATCH /api/artist/:id（部分更新）
// body: { name?, image?, genre?, bio?, songs? } ※songs配列を渡すと入れ替え
app.patch('/api/artist/:id', async (req, res) => {
  const { id } = req.params;
  const { name, image, genre, bio, songs } = req.body || {};
  try {
    // まず本体更新（渡ってきたキーだけ）
    const updated = await prisma.artist.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image_url: image } : {}),
        ...(genre !== undefined ? { genre } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
      select: { id: true }, // 次で最新を取り直すので最小限
    });

    // songs が配列で来たら「丸ごと入れ替え」
    if (Array.isArray(songs)) {
      await prisma.$transaction([
        prisma.song.deleteMany({ where: { artist_id: id } }),
        ...(songs.length
          ? [
              prisma.song.createMany({
                data: songs
                  .filter(Boolean)
                  .map((t) => ({ artist_id: id, title: t })),
                skipDuplicates: true,
              }),
            ]
          : []),
      ]);
    }

    // 最新スナップショットを返却
    const fresh = await prisma.artist.findUnique({
      where: { id: updated.id },
      select: {
        id: true,
        name: true,
        image_url: true,
        genre: true,
        bio: true,
        songs: { select: { title: true } },
      },
    });

    return res.json({
      id: fresh.id,
      name: fresh.name,
      image: fresh.image_url,
      genre: fresh.genre,
      bio: fresh.bio,
      songs: fresh.songs.map((s) => s.title),
    });
  } catch (e) {
    if (e.code === 'P2025') {
      // Not found
      return res.status(404).json({ error: 'Artist not found' });
    }
    console.error('PATCH /api/artist/:id error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// DELETE: DELETE /api/artist/:id
app.delete('/api/artist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
      prisma.song.deleteMany({ where: { artist_id: id } }), // 参照制約回避
      prisma.artist.delete({ where: { id } }),
    ]);
    return res.status(204).end();
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Artist not found' });
    }
    console.error('DELETE /api/artist/:id error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/featured', async (_req, res) => {
  try {
    const rows = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        image_url: true,
        genre: true,
        bio: true,
        popularity: true,
        songs: { select: { title: true } },
      },
      orderBy: { popularity: 'desc' },
      take: 5,
    });

    const items = rows.map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image_url ?? null,
      genre: a.genre ?? null,
      bio: a.bio ?? null,
      popularity: a.popularity,
      songs: a.songs.map((s) => s.title),
    }));

    res.json({ items });
  } catch (e) {
    console.error('GET /api/featured failed:', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
