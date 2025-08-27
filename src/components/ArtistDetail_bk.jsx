import React from 'react';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ArtistDetail() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    fetch('/artists.json')
      .then((res) => res.json())
      .then((json) => {
        const found = json.find((a) => a.id === id);
        setArtist(found);
      });
  }, [id]);

  if (!artist) return <p>アーティストが見つかりません</p>;

  return (
    <div>
      <h1>{artist.name}</h1>
      <img src={artist.image} alt={artist.name} width={180} />
      <p>
        <strong>ジャンル：</strong>
        {artist.genre}
      </p>
      <p>{artist.bio}</p>
      <h3>代表曲：</h3>
      <ul>
        {artist.songs.map((song, idx) => (
          <li key={idx}>{song}</li>
        ))}
      </ul>
    </div>
  );
}

export default ArtistDetail;
