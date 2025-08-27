// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ArtistDetail from './components/ArtistDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artist/:id" element={<ArtistDetail />} />
        <Route path="/admin/new" element={<AdminNew />} /> {/* ← 追加 */}
      </Routes>
    </BrowserRouter>
  );
}
