// src/components/ArtistDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ArtistDetail() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/artist/${id}`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setArtist)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  if (loading) return <p>読み込み中…</p>;
  if (error) return <p style={{ color: 'crimson' }}>エラー: {error}</p>;
  if (!artist) return <p>アーティストが見つかりません</p>;

  return (
    <div>
      <h1>{artist.name}</h1>
      <img
        src={artist.image || artist.image_url}
        alt={artist.name}
        width={180}
      />
      <p>
        <strong>ジャンル：</strong>
        {artist.genre}
      </p>
      <p>{artist.bio}</p>
      <h3>代表曲：</h3>
      <ul>
        {(artist.songs || []).map((s) => (
          <li key={s.id ?? s.title}>{s.title ?? s}</li>
        ))}
      </ul>
    </div>
  );
}
