// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchForm from '../components/SearchForm.jsx';
import ArtistList from '../components/ArtistList.jsx';
import useDebounce from '../hooks/useDebounce.js';

export default function Home() {
  const [artists, setArtists] = useState([]);
  const [sp, setSp] = useSearchParams();
  const [query, setQuery] = useState(sp.get('q') || ''); // URL→初期値
  const debounced = useDebounce(query, 200); // 入力のデバウンス

  useEffect(() => {
    fetch('/artists.json')
      .then((r) => r.json())
      .then(setArtists);
  }, []);

  // 入力変化のたびにURLを更新（空ならqを消す）
  useEffect(() => {
    const q = query.trim();
    const next = new URLSearchParams(sp);
    if (q) next.set('q', q);
    else next.delete('q');
    // 同一値で履歴を汚さない
    if (next.toString() !== sp.toString()) setSp(next, { replace: true });
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // 実際の絞り込みは“デバウンス後の値”で
  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const genre = (a.genre || '').toLowerCase();
      const songs = (a.songs || []).join(' ').toLowerCase();
      return name.includes(q) || genre.includes(q) || songs.includes(q);
    });
  }, [artists, debounced]);

  return (
    <div>
      <SearchForm
        query={query}
        onChangeQuery={setQuery}
        onClear={() => setQuery('')}
      />
      {/* 件数とゼロ件UI */}
      {filtered.length === 0 ? (
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          <strong>該当なし。</strong>{' '}
          キーワードを短くするか、ジャンル名・曲名でも試してみてください。
        </div>
      ) : (
        <p style={{ opacity: 0.7, margin: '8px 0' }}>{filtered.length} 件</p>
      )}
      <ArtistList items={filtered} />
    </div>
  );
}
