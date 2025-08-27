import React from 'react';
import { Link } from 'react-router-dom';
import './ArtistList.css';

export default function ArtistList({ items }) {
  // items が未定義や null の時は空配列に
  const list = Array.isArray(items) ? items : [];

  if (!items) {
    // まだフェッチ中など
    return <div className="artist-list">読み込み中…</div>;
  }

  if (list.length === 0) {
    return <div className="artist-list">該当するアーティストがいません。</div>;
  }

  return (
    <div className="artist-list">
      {list.map((artist) => (
        <div key={artist.id} className="artist-card">
          <img
            src={artist.image || artist.image_url}
            alt={artist.name}
            className="artist-image"
          />
          <h2 className="artist-name">{artist.name}</h2>
          <p className="artist-listeners">{artist.genre ?? '—'}</p>
          <Link to={`/artist/${artist.id}`} className="artist-link">
            詳細を見る
          </Link>
        </div>
      ))}
    </div>
  );
}
