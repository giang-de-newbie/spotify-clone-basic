import { useState, useEffect } from "react";
import { useMusicPlayer } from "../contexts/MusicPlayerContext";
import api from "../services/api";
import HeartFilledIcon from '../components/HeartFilledIcon';
import HeartOutlineIcon from '../components/HeartOutlineIcon';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState({ songs: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const { playSong, currentSong, isPlaying } = useMusicPlayer();
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    import("./FavoritesPage.css").then(() => {
      setCssLoaded(true)
    })
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const [songsResponse] = await Promise.all([
          api.getFavoriteSongs()
        ]);
        console.log(songsResponse.data);
        setFavorites({
          songs: songsResponse.data.songs || [],
          albums: songsResponse.data.albums || []
        });
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handlePlaySong = (song, index) => {
    if (currentSong?.id === song.id) {
      // Handle pause logic if needed
      return;
    }

    playSong({
      ...song,
      audio: song.audio_file,
      contextSongs: favorites.songs,
      contextUri: `favorites:song:${song.id}`,
    });
  };

  const handlePlayAlbum = async (album) => {
    try {
      const response = await api.getAlbumSongs(album.id);
      const songs = response.data || [];

      if (songs.length > 0) {
        playSong({
          ...songs[0],
          audio: songs[0].audio_file,
          contextSongs: songs,
          contextUri: `album:${album.id}`,
        });
      }
    } catch (error) {
      console.error("Error playing album:", error);
    }
  };

  const handleRemoveFavorite = async (e, id, type) => {
    e.stopPropagation();

    try {
      // Fix: Call removeFavorite instead of addFavoriteSong
      await api.addFavoriteSong(id, type);
      
      // Fix: Map the type parameter to the correct state property
      const stateKey = type === 'song' ? 'songs' : type === 'album' ? 'albums' : type;
      
      setFavorites(prev => ({
        ...prev,
        [stateKey]: prev[stateKey].filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error(`Error removing favorite ${type}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div className="favorites-header-content">
          <h1 className="favorites-title">My Favorites</h1>
          <p className="favorites-description">
            {favorites.songs.length} songs • {favorites.albums.length} albums
          </p>
        </div>
      </div>

      <div className="action-buttons">
        <button className="play-button">
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Favorite songs Section */}
      {favorites.songs.length > 0 && (
        <>
          <h2 className="section-title">Favorite Songs</h2>
          <div className="songs-grid">
            {favorites.songs.map((song, index) => (
              <div 
                key={`song-${song.id}`}
                className="song-card"
                onClick={() => handlePlaySong(song, index)}
              >
                <div className="song-cover">
                  <img 
                    src={song.image || song.album?.image || '/default-song-cover.jpg'} 
                    alt={song.title} 
                    className="song-image-f" 
                  />
                  <button 
                    className="song-play-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song, index);
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    className="song-favorite-button"
                    onClick={(e) => handleRemoveFavorite(e, song.id, 'song')}
                  >
                    <HeartFilledIcon />
                  </button>
                </div>
                <div className="song-info">
                  <div className="song-title" title={song.title}>{song.title}</div>
                  <div className="song-artist" title={song.artists?.map(artist => artist.name).join(", ")}>
                    {song.artists?.map(artist => artist.name).join(", ")}
                  </div>
                  <div className="song-duration">{song.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Albums section would go here */}

      {favorites.songs.length === 0 && favorites.albums.length === 0 && (
        <div className="no-favorites">
          <p>You haven't added any favorites yet.</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;