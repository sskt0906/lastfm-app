// src/components/SearchForm.jsx
import React from 'react';
import './SearchForm.css';

export default function SearchForm({ query, onChangeQuery, onClear }) {
  const onSubmit = (e) => e.preventDefault();
  return (
    <form className="search-form-container" onSubmit={onSubmit}>
      <input
        className="search-form-input"
        type="text"
        placeholder="アーティスト名・曲・ジャンルで検索"
        value={query}
        onChange={(e) => onChangeQuery(e.target.value)} // 即時反映
      />
      {query && (
        <button
          type="button"
          className="search-form-button"
          onClick={onClear}
          aria-label="検索語をクリア"
        >
          クリア
        </button>
      )}
      <button className="search-form-button" type="submit">
        検索
      </button>
    </form>
  );
}
