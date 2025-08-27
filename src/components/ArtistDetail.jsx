import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: '',
    genre: '',
    image: '',
    bio: '',
    songs: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/artist/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArtist(data);
      // 編集フォームへ反映
      setForm({
        name: data.name ?? '',
        genre: data.genre ?? '',
        image: data.image ?? '',
        bio: data.bio ?? '',
        songs: (data.songs || []).join(', '),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        genre: form.genre.trim() || null,
        image: form.image.trim() || null,
        bio: form.bio.trim() || null,
        songs: form.songs
          ? form.songs
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      const res = await fetch(`/api/artist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setArtist(updated);
      setEdit(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('このアーティストを削除します。よろしいですか？'))
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/artist/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      // 一覧へ戻り、再フェッチフラグを渡す
      navigate('/', { state: { refresh: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>読み込み中…</p>;
  if (error) return <p style={{ color: 'crimson' }}>エラー: {error}</p>;
  if (!artist) return <p>アーティストが見つかりません</p>;

  return (
    <div style={{ maxWidth: 720, margin: '20px auto' }}>
      {!edit ? (
        <>
          <h1>{artist.name}</h1>
          {artist.image && (
            <img
              src={artist.image}
              alt={artist.name}
              width={180}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <p>
            <strong>ジャンル：</strong>
            {artist.genre ?? '-'}
          </p>
          <p>{artist.bio}</p>
          <h3>代表曲：</h3>
          <ul>
            {(artist.songs || []).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEdit(true)}>編集</button>
            <button
              onClick={onDelete}
              disabled={saving}
              style={{ color: 'white', background: 'crimson' }}
            >
              {saving ? '削除中…' : '削除'}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>編集: {artist.id}</h1>
          <div>
            <label>名前</label>
            <input name="name" value={form.name} onChange={onChange} />
          </div>
          <div>
            <label>ジャンル</label>
            <input name="genre" value={form.genre} onChange={onChange} />
          </div>
          <div>
            <label>画像URL</label>
            <input name="image" value={form.image} onChange={onChange} />
          </div>
          <div>
            <label>紹介文</label>
            <textarea name="bio" value={form.bio} onChange={onChange} />
          </div>
          <div>
            <label>曲（カンマ区切りで“入れ替え”）</label>
            <input name="songs" value={form.songs} onChange={onChange} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button onClick={() => setEdit(false)} disabled={saving}>
              キャンセル
            </button>
          </div>
        </>
      )}
    </div>
  );
}
