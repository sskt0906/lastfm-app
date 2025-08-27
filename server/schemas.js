// server/schemas.js (ESM)
import { z } from 'zod';

// 文字列の共通トリム（ZodEffects）
const trimmed = z.string().transform((v) => v.trim());

// 必須文字列（空文字不可）
const nonEmpty = (field, max) =>
  trimmed
    .pipe(z.string().min(1, `${field} is required`))
    .pipe(max ? z.string().max(max) : z.string());

// オプショナル文字列（"" のときは undefined に正規化）
const optionalText = trimmed
  .transform((v) => (v === '' ? undefined : v))
  .optional();

// パラメータ: /api/artist/:id
export const ArtistParamsSchema = z.object({
  id: nonEmpty('id', 64),
});

// クエリ: GET /api/artists
export const ListQuerySchema = z
  .object({
    q: z
      .string()
      .optional()
      .default('')
      .transform((v) => v.trim()),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1).default(1)),
    pageSize: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10))
      .pipe(z.number().int().min(1).max(50).default(10)),
  })
  .strict();

// 文字列配列 or "A,B" の両対応（空は []）
const songsFlexible = z.union([
  z.array(trimmed).default([]),
  trimmed.transform((s) =>
    s === ''
      ? []
      : s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
  ),
]);

// POST /api/artists
export const CreateArtistSchema = z
  .object({
    id: nonEmpty('id', 64),
    name: nonEmpty('name', 128),
    image: optionalText, // もしURL限定にしたいなら .pipe(z.string().url()).optional()
    genre: optionalText,
    bio: optionalText,
    songs: songsFlexible.optional().default([]),
  })
  .strict();

// PATCH /api/artist/:id（部分更新）
// "" を undefined に正規化して「未指定」と同義にする
export const UpdateArtistSchema = z
  .object({
    name: optionalText,
    image: optionalText,
    genre: optionalText,
    bio: optionalText,
    songs: z
      .union([
        z.array(trimmed),
        trimmed.transform((s) =>
          s === ''
            ? []
            : s
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
        ),
      ])
      .optional(),
  })
  .strict()
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: 'At least one field is required to update',
  });
