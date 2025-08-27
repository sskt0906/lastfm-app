// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import ArtistList from '../components/ArtistList';

export default function Home() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  // /admin/new から戻ってきたときに再フェッチ
  useEffect(() => {
    if (location.state?.refresh) {
      setReloadTick((n) => n + 1);
      // 一度使ったらフラグを消す（戻る戻るで何回も発火しないように）
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    const ctrl = new AbortController();
    const url = query
      ? `/api/artists?q=${encodeURIComponent(query)}`
      : '/api/artists';

    setLoading(true);
    setError(null);

    fetch(url, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setItems(json))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [query, reloadTick]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <SearchForm onSearch={(q) => setQuery(q)} />
        <Link to="/admin/new">
          <button>新規登録</button>
        </Link>
      </div>
      {loading && <p>読み込み中…</p>}
      {error && <p style={{ color: 'crimson' }}>エラー: {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p>該当するアーティストはいません</p>
      )}
      {!loading && !error && items.length > 0 && <ArtistList items={items} />}
    </div>
  );
}
