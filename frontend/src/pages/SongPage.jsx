"use client"

import { useState, useEffect, use } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMusicPlayer } from "../contexts/MusicPlayerContext"
import "./SongPage.css"
import api from "../services/api"
import HeartFilledIcon from '../components/HeartFilledIcon';
import HeartOutlineIcon from '../components/HeartOutlineIcon';
import { useRef } from "react"


const SongPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const { playSong, currentSong, isPlaying, togglePlay,updateFavorites } = useMusicPlayer()
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [addResult, setAddResult] = useState("");
  const dropdownRef = useRef();
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const [userAlbums, setUserAlbums] = useState([]);
  const [addingAlbum, setAddingAlbum] = useState(false);
  const [addAlbumResult, setAddAlbumResult] = useState("");
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const albumDropdownRef = useRef();

  const FAVORITE_TYPE = {
    SONG: 'song',
    ALBUM: 'album'
  };
  useEffect(() => {
    const fetchSongData = async () => {
      try {
        setLoading(true)
        
        // Fetch song details
        const songRes = await api.getSong(id)
        setSong(songRes.data)
        setLoading(false)
        try {
          const favRes = await api.checkFavoriteStatus(id,'song')
        } catch (err) {
          console.error("Error checking favorite status:", err)
        }
      } catch (error) {
        console.error("Error fetching song data:", error)
        setLoading(false)
      }
    }

    fetchSongData()
  }, [id])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPlaylistDropdown(false);
      }
      if (albumDropdownRef.current && !albumDropdownRef.current.contains(event.target)) {
        setShowAlbumDropdown(false);
        setShowCreateAlbum(false);
      }
    }
    if (showPlaylistDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPlaylistDropdown]);

  const handleShowPlaylists = async () => {
    setShowPlaylistDropdown((v) => !v);
    if (userPlaylists.length === 0) {
      try {
        const res = await api.getUserPlaylists();
        setUserPlaylists(res.data);
      } catch (err) {
        setAddResult("Failed to load playlists");
      }
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    setAddingPlaylist(true);
    setAddResult("");
    try {
      await api.addSongToPlaylist(playlistId, song.id);
      setAddResult("Added to playlist!");
      setShowPlaylistDropdown(false);
    } catch (err) {
      setAddResult("Failed to add song");
    } finally {
      setAddingPlaylist(false);
      setTimeout(() => setAddResult(""), 2000);
    }
  };

  const handleShowAlbums = async () => {
    setShowAlbumDropdown((v) => !v);
    if (userAlbums.length === 0) {
      try {
        const res = await api.getUserAlbums();
        setUserAlbums(res.data);
      } catch (err) {
        setAddAlbumResult("Failed to load albums");
      }
    }
  };

  const handleAddToAlbum = async (albumId) => {
    setAddingAlbum(true);
    setAddAlbumResult("");
    try {
      await api.addSongToUserAlbum(albumId, song.id);
      setAddAlbumResult("Added to album!");
      setShowAlbumDropdown(false);
    } catch (err) {
      setAddAlbumResult("Failed to add song");
    } finally {
      setAddingAlbum(false);
      setTimeout(() => setAddAlbumResult(""), 2000);
    }
  };

  const handleCreateAlbumAndAdd = async () => {
    if (!newAlbumName.trim()) return;
    setAddingAlbum(true);
    setAddAlbumResult("");
    try {
      const res = await api.createUserAlbum({ title: newAlbumName, description: "My personal album" });
      await api.addSongToUserAlbum(res.data.id, song.id);
      setAddAlbumResult("Created album & added song!");
      setUserAlbums([...userAlbums, res.data]);
      setShowAlbumDropdown(false);
      setShowCreateAlbum(false);
      setNewAlbumName("");
    } catch (err) {
      setAddAlbumResult("Failed to create album or add song");
    } finally {
      setAddingAlbum(false);
      setTimeout(() => setAddAlbumResult(""), 2000);
    }
  };

  // Thêm vào hàm handleToggleFavorite
  const handleToggleFavorite = async (e, songId, isCurrentlyFavorite) => {
    e.stopPropagation();
    const newState = !isCurrentlyFavorite;

    // Optimistic UI update
    setSong({ ...song, is_favorite: newState });

    // Update localStorage
    localStorage.setItem(`favorite_${FAVORITE_TYPE.SONG}_${songId}`, JSON.stringify(newState));

    try {
      // Gọi API để đồng bộ với server
      await api.addFavoriteSong(songId, FAVORITE_TYPE.SONG);

      // Cập nhật context nếu cần
      updateFavorites && updateFavorites(songId, FAVORITE_TYPE.SONG, newState ? 'add' : 'remove');
    } catch (err) {
      // Rollback nếu có lỗi
      setSong({ ...song, is_favorite: isCurrentlyFavorite });

      localStorage.setItem(`favorite_${FAVORITE_TYPE.SONG}_${songId}`, JSON.stringify(isCurrentlyFavorite));

      console.error('Toggle favorite failed:', err);
      alert('Failed to update favorite. Please try again.');
    }
  };
  const handlePlayClick = () => {
    if (currentSong?.id === song.id) {
      togglePlay()
    } else {
      playSong({
        id: song.id,
        name: song.name,
        artists: song.artists || [],
        album: song.album || { 
          title: "",
          artist: {
            name: "",
            image: ""
        },
        cover_image: "",
        release_date: "" 
      },
        duration: song.duration || 0,
        audio: song.audio_file || song.preview_url,
        image: song.image || song.album?.image || song.album?.cover_image
      })
    }
  }

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }  
  


  if (loading) {
    return (
      <div className="song-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="song-error">
        <h2>Song not found</h2>
        <p>The song you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    )
  }

  return (
    <div className="song-page-s">
      <div className="song-header-s">
        <div className="song-cover-s">
          <img 
            src={song.image || song.album?.cover_image || "/placeholder.svg"} 
            alt={song.title} 
            className="song-image-s" 
          />
        </div>
        
        <div className="song-info-s">
          <h1 className="song-title-s">{song.title}</h1>
          
          <div className="song-artists-s">
            {song.artists.map((artist, index) => (
              <span key={artist.id}>
                <Link to={`/artist/${artist.id}`} className="artist-link">
                  {artist.name}
                </Link>
                {index < song.artists.length - 1 && ', '}
              </span>
            ))}
          </div>
          
          <div className="song-album-s">
            From the album: <Link to={`/album/${song.album?.id}`}>{song.album?.title}</Link>
          </div>
          
          <div className="song-meta-s">
            <span>{song.duration}</span>
            {/* <span>•</span>
            <span>{song.popularity}% popularity</span> */}
          </div>
          
          <div className="song-actions">
            <button
              className={`song-action-btn play${currentSong?.id === song.id && isPlaying ? ' playing' : ''}`}
              onClick={handlePlayClick}
              title={currentSong?.id === song.id && isPlaying ? 'Pause' : 'Play'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            </button>
            <div style={{position: 'relative', display: 'inline-block'}} ref={albumDropdownRef}>
              <button
                className="song-action-btn add"
                title="Add to Album"
                onClick={handleShowAlbums}
                disabled={addingAlbum}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              {showAlbumDropdown && (
                <div className="playlist-dropdown">
                  {userAlbums.length === 0 ? (
                    <div className="playlist-dropdown-item">No albums</div>
                  ) : (
                    userAlbums.map((al) => (
                      <div
                        key={al.id}
                        className="playlist-dropdown-item"
                        onClick={() => handleAddToAlbum(al.id)}
                        style={{cursor: addingAlbum ? 'not-allowed' : 'pointer', opacity: addingAlbum ? 0.6 : 1}}
                      >
                        {al.title}
                      </div>
                    ))
                  )}
                  <div className="playlist-dropdown-item" style={{borderTop: '1px solid #333', marginTop: 4, paddingTop: 8, color: '#1db954', fontWeight: 600, cursor: 'pointer'}} onClick={() => setShowCreateAlbum(true)}>
                    + Create new album
                  </div>
                  {showCreateAlbum && (
                    <div style={{padding: '10px 12px'}}>
                      <input
                        type="text"
                        value={newAlbumName}
                        onChange={e => setNewAlbumName(e.target.value)}
                        placeholder="Album name"
                        style={{width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #444', marginBottom: 8, background: '#181818', color: '#fff'}}
                        disabled={addingAlbum}
                      />
                      <button
                        style={{width: '100%', padding: '7px 0', borderRadius: 4, background: '#1db954', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'}}
                        onClick={handleCreateAlbumAndAdd}
                        disabled={addingAlbum}
                      >
                        Create & Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className={`song-action-btn heart${song.is_favorite ? ' active' : ''}`}
              onClick={(e) => handleToggleFavorite(e, song.id, song.is_favorite)}
              aria-label={song.is_favorite ? "Remove from favorites" : "Add to favorites"}
              title={song.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              {song.is_favorite ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              )}
            </button>
            {addAlbumResult && <div className="add-result-msg">{addAlbumResult}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongPage