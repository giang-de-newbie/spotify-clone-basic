import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import HeartFilledIcon from '../components/HeartFilledIcon';
import HeartOutlineIcon from '../components/HeartOutlineIcon';
import api from '../services/api';
import JSZip from "jszip"
import { saveAs } from "file-saver"

const ArtistPage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [topSongs, setTopSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong, currentSong, isPlaying, favorites, updateFavorites } = useMusicPlayer();
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [cssLoaded, setCssLoaded] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSongId, setDownloadingSongId] = useState(null);
  const audioRef = useRef(null);
  const FAVORITE_TYPE = {
    SONG: 'song',
    ALBUM: 'album'
  };
  useEffect(() => {
    const fetchArtistData = async () => {
      import("./ArtistPage.css").then(() => {
        setCssLoaded(true)
      })
      try {
        setLoading(true);
        const response = await api.getUserProfile();
        const [artistRes, albumsRes, songsRes] = await Promise.all([
          api.getArtist(id),
          api.getArtistAlbums(id),
          api.getArtistTopSongs(id),
        ]);

        setArtist(artistRes.data);
        setAlbums(albumsRes.data.items);
        // console.log(albumUserRes.data);
        // Kiểm tra favorite từ cả API và localStorage
        const songsWithFavorites = await Promise.all(songsRes.data.songs.map(async (song) => {
          // Lấy trạng thái favorite từ server (nếu API hỗ trợ)
          const isFavoriteFromAPI = await api.checkFavoriteStatus(song.id, FAVORITE_TYPE.SONG)
            .then(res => res.data.is_favorite)
            .catch(() => false);

          // Kết hợp với localStorage nếu cần
          const isFavoriteFromLocal = JSON.parse(
            localStorage.getItem(`favorite_song_${song.id}`) || "false"
          );

          return {
            ...song,
            is_favorite: isFavoriteFromAPI || isFavoriteFromLocal
          };
        }));

        setTopSongs(songsWithFavorites);
      } catch (err) {
        console.error('Error loading artist data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  useEffect(() => {
    // Đồng bộ favorites khi component mount
    const syncFavorites = async () => {
      const syncedSongs = await Promise.all(topSongs.map(async song => {
        const serverStatus = await api.checkFavoriteStatus(song.id, FAVORITE_TYPE.SONG)
          .then(res => res.data.is_favorite)
          .catch(() => song.is_favorite);

        return {
          ...song,
          is_favorite: serverStatus
        };
      }));

      setTopSongs(syncedSongs);
    };

    if (topSongs.length > 0) {
      syncFavorites();
    }
  }, []);

  const formatDuration = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFollowers = (count) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M followers`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K followers`;
    return `${count} followers`;
  };

  const handlePlaySong = async (e, song) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!song.audio_file || loading) return;

    try {
      await playSong({
        ...song,
        audio: song.audio_file,
        contextSongs: topSongs,
        contextUri: `artist:${id}:song:${song.id}`,
      });
    } catch (err) {
      console.error('Playback failed:', err);
    }
  };

  const handlePlayArtist = async (e) => {
    e?.preventDefault();
    if (topSongs.length > 0) {
      await playSong({
        ...topSongs[0],
        audio: topSongs[0].audio_file,
        contextSongs: topSongs,
        contextUri: `artist:${id}`,
      });
    }
  };

  // Thêm vào hàm handleToggleFavorite
  const handleToggleFavorite = async (e, songId, isCurrentlyFavorite, type) => {
    e.stopPropagation();
    const newState = !isCurrentlyFavorite;

    // Optimistic UI update
    setTopSongs(prev => prev.map(song =>
      song.id === songId ? { ...song, is_favorite: newState } : song
    ));

    // Update localStorage
    localStorage.setItem(`favorite_${type}_${songId}`, JSON.stringify(newState));

    try {
      // Gọi API để đồng bộ với server
      await api.addFavoriteSong(songId, type);

      // Cập nhật context nếu cần
      updateFavorites && updateFavorites(songId, type, newState ? 'add' : 'remove');
    } catch (err) {
      // Rollback nếu có lỗi
      setTopSongs(prev => prev.map(song =>
        song.id === songId ? { ...song, is_favorite: isCurrentlyFavorite } : song
      ));
      localStorage.setItem(`favorite_${type}_${songId}`, JSON.stringify(isCurrentlyFavorite));

      console.error('Toggle favorite failed:', err);
      alert('Failed to update favorite. Please try again.');
    }
  };

  const downloadSong = async (e, song) => {
    e.stopPropagation();
    e.preventDefault();

    if (!song.audio_file) return;

    setDownloadingSongId(song.id);

    try {
      const response = await fetch(song.audio_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${song.title}.${song.audio_file.split('.').pop().split('?')[0]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download song. Please try again.');
    } finally {
      setDownloadingSongId(null);
    }
  };

  const downloadAllSongs = async () => {
    if (!topSongs.length || downloadingAll) return;

    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`${artist.name} - Top Songs`);

      // Thêm ảnh nghệ sĩ vào zip nếu có
      if (artist.image) {
        try {
          const imageResponse = await fetch(artist.image);
          const imageBlob = await imageResponse.blob();
          folder.file(`cover.jpg`, imageBlob);
        } catch (error) {
          console.error("Error downloading artist image:", error);
        }
      }

      // Thêm tất cả bài hát vào zip
      for (let i = 0; i < topSongs.length; i++) {
        const song = topSongs[i];
        if (song.audio_file) {
          try {
            const response = await fetch(song.audio_file);
            const blob = await response.blob();
            const extension = song.audio_file.split('.').pop().split('?')[0];
            const fileName = `${i + 1}. ${song.title}.${extension}`;
            folder.file(fileName, blob);
          } catch (error) {
            console.error(`Error downloading song ${song.title}:`, error);
          }
        }
      }

      // Tạo file zip và tải xuống
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${artist.name} - Top Songs.zip`);
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert('Failed to download all songs. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="artist-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="artist-error">
        <h2>Artist not found</h2>
        <p>The artist you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (

    <div className="artist-page">
      <div
        className="artist-header"
        style={{
          backgroundImage: `linear-gradient(transparent 0, rgba(0, 0, 0, 0.5)), url(${artist.image})`,
        }}
      >
        <div className="artist-header-content">
          <div className="artist-info">
            <div className="verified-badge">
              <svg viewBox="0 0 24 24" className="verified-icon">
                <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5.2 15.37l-1.93 1.93L12 15.03l-3.27 3.27-1.93-1.93L10.07 13 6.8 9.73l1.93-1.93L12 11.07l3.27-3.27 1.93 1.93L13.93 13l3.27 3.37z"></path>
              </svg>
              Verified Artist
            </div>
            <h1 className="artist-name">{artist.name}</h1>
            <div className="artist-followers">1 M Followers</div>
          </div>
        </div>
      </div>

      <div className="artist-actions">
        <button className="play-button" onClick={handlePlayArtist}>
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        </button>
        <button className="follow-button">Follow</button>
        {topSongs.length > 0 && (
          <button 
            className="download-all-button"
            onClick={downloadAllSongs}
            disabled={downloadingAll}
          >
            {downloadingAll ? (
              'Downloading...'
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="download-icon">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                </svg>
                Download All
              </>
            )}
          </button>
        )}
        <button className="more-button">
          <svg viewBox="0 0 16 16">
            <path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>
          </svg>
        </button>
      </div>

      <div className="popular-songs-section">
        <h2 className="section-title">Popular</h2>
        <div className="songs-list">
          {topSongs.map((song, index) => (
            <div
              key={song.id}
              className={`song-row ${currentSong?.id === song.id && isPlaying ? 'active' : ''}`}
              onClick={(e) => handlePlaySong(e, song)}
            >
              <div className="song-number">
                {currentSong?.id === song.id && isPlaying ? (
                  <div className="playing-animation">
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                  </div>
                ) : (
                  index + 1
                )}
              </div>
              <div className="song-info">
                <div className="song-name">{song.title}</div>
                <div className="song-artists">
                  {song.artists.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && ', '}
                      <Link to={`/artist/${a.id}`} className="artist-link" onClick={(e) => e.stopPropagation()}>
                        {a.name}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
              <div className="song-duration">{song.duration}</div>
              <div className="song-album">
                <Link to={`/album/${song.album.id}`} onClick={(e) => e.stopPropagation()}>
                  {song.album.name}
                </Link>
              </div>

              <div className="song-actions">
              <button
                  className="download-btn"
                  onClick={(e) => downloadSong(e, song)}
                  disabled={downloadingSongId === song.id}
                >
                  {downloadingSongId === song.id ? (
                    'Downloading...'
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button
                  className="add-to-album-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSong(song);
                    setShowAlbumModal(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 1a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2H9v5a1 1 0 1 1-2 0V9H2a1 1 0 0 1 0-2h5V2a1 1 0 0 1 1-1z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  className={`favorite-btn ${song.is_favorite ? 'active' : ''}`}
                  onClick={(e) => handleToggleFavorite(e, song.id, song.is_favorite, FAVORITE_TYPE.SONG)}
                >
                  {song.is_favorite ? (
                    <HeartFilledIcon className="heart-icon" />
                  ) : (
                    <HeartOutlineIcon className="heart-icon" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default ArtistPage;
