import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminNew() {
  const [form, setForm] = useState({
    id: '',
    name: '',
    genre: '',
    image: '',
    bio: '',
    songs: '', // カンマ区切り
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const payload = {
        id: form.id.trim(),
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
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} ${t}`);
      }
      const created = await res.json();

      // 一覧へ戻るときに再フェッチ要求のフラグを渡す
      navigate('/', { state: { refresh: true } });

      // もしくは詳細へ遷移したければこちら
      // navigate(`/artist/${created.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '20px auto' }}>
      <h1>アーティスト新規登録</h1>
      {err && <p style={{ color: 'crimson' }}>エラー: {err}</p>}
      <form onSubmit={onSubmit}>
        <div>
          <label>ID（英小文字・ハイフン推奨）</label>
          <input name="id" value={form.id} onChange={onChange} required />
        </div>
        <div>
          <label>名前</label>
          <input name="name" value={form.name} onChange={onChange} required />
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
          <label>曲（カンマ区切り）</label>
          <input
            name="songs"
            value={form.songs}
            onChange={onChange}
            placeholder="ROSIER, I for You"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '保存中…' : '作成'}
        </button>
      </form>
    </div>
  );
}
