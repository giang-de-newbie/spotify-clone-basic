import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useMusicPlayer } from "../contexts/MusicPlayerContext"
import api from "../services/api"
import "./AlbumPage.css"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import HeartFilledIcon from '../components/HeartFilledIcon';
import HeartOutlineIcon from '../components/HeartOutlineIcon';

const AlbumPage = () => {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const { playSong, currentSong, togglePlay,updateFavorites } = useMusicPlayer()
  const [cssLoaded, setCssLoaded] = useState(false)

  const FAVORITE_TYPE = {
    SONG: 'song',
    ALBUM: 'album'
  };

  // Thêm vào hàm handleToggleFavorite
  const handleToggleFavorite = async (e, songId, isCurrentlyFavorite, type) => {
    e.stopPropagation();
    const newState = !isCurrentlyFavorite;

    // Optimistic UI update
    setSongs(prev => prev.map(song =>
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
      setSongs(prev => prev.map(song =>
        song.id === songId ? { ...song, is_favorite: isCurrentlyFavorite } : song
      ));
      localStorage.setItem(`favorite_${type}_${songId}`, JSON.stringify(isCurrentlyFavorite));

      console.error('Toggle favorite failed:', err);
    }
  };

  useEffect(() => {
    import("./AlbumPage.css").then(() => {
      setCssLoaded(true)
    })
    const fetchAlbumAndSongs = async () => {
      try {
        setLoading(true)
        const [albumRes, songsRes] = await Promise.all([
          api.getAlbum(id),
          api.getAlbumSongs(id)
        ])
        setAlbum(albumRes.data || [])
        setSongs(songsRes.data || [])
      } catch (error) {
        console.error("Error fetching album or songs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlbumAndSongs()
  }, [id])


  const handlePlaySong = async (song, index) => {
    if (!song || !songs || songs.length === 0) return

    if (currentSong?.id === song.id) {
      togglePlay()
      return
    }

    const contextUri = `album:${album.id}`
    const contextSongs = songs
    try {
      await playSong({
        ...song,
        audio: song.audio_file,
        contextSongs: songs,
        contextUri: `artist:${id}:song:${song.id}`,
      });
    } catch (err) {
      console.error('Playback failed:', err);
    }
  }

  const downloadAllSongs = async () => {
    if (!songs.length || downloadingAll) return

    setDownloadingAll(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder(`${album.title} - ${album.artist.name}`)

      // Add cover image to the zip
      if (album.cover_image) {
        try {
          const imageResponse = await fetch(album.cover_image)
          const imageBlob = await imageResponse.blob()
          folder.file(`cover.jpg`, imageBlob)
        } catch (error) {
          console.error("Error downloading cover image:", error)
        }
      }

      // Add all songs to the zip
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i]
        if (song.audio_file) {
          try {
            const response = await fetch(song.audio_file)
            const blob = await response.blob()
            const extension = song.audio_file.split('.').pop().toLowerCase()
            const fileName = `${i + 1}. ${song.title}.${extension}`
            folder.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading song ${song.title}:`, error)
          }
        }
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `${album.title} - ${album.artist.name}.zip`)
    } catch (error) {
      console.error("Error creating zip file:", error)
    } finally {
      setDownloadingAll(false)
    }
  }

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatReleaseDate = (dateString) => {
    const date = new Date(dateString)
    return date.getFullYear()
  }
  const downloadSong = async (e, song) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await fetch(song.audio_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${song.title}.mp3`; // hoặc lấy extension từ URL
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  if (loading) {
    return <div className="playlist-loading"><div className="loading-spinner" /></div>
  }

  if (!album) {
    return (
      <div className="playlist-error">
        <h2>Album not found</h2>
      </div>
    )
  }
  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <div className="playlist-cover">
          <img src={album.cover_image} alt={album.title} className="playlist-image" />
        </div>
        <div className="playlist-info">
          <div className="playlist-type">Album</div>
          <h1 className="playlist-name">{album.title}</h1>
          <div className="playlist-meta">
            <span className="playlist-owner">{album.artist.name}</span>
            <span className="meta-separator">•</span>
            <span className="playlist-year">{formatReleaseDate(album.release_date)}</span>
            <span className="meta-separator">•</span>
            <span className="playlist-songs">{album.songs_count} songs</span>
          </div>
        </div>
      </div>

      <div className="playlist-actions">
        {songs.length > 0 && (
          <>
            <button className="play-all-button" onClick={() => handlePlaySong(songs[0], 0)}> <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" /></svg> </button>
            <button
              className="download-all-button"
              onClick={downloadAllSongs}
              disabled={downloadingAll}
            >
              {downloadingAll ? (
                <span>Downloading...</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="download-icon">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                  </svg>
                  <span>Download All</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div className="playlist-songs">
        <div className="songs-header album-songs-header">
          <div className="song-number">#</div>
          <div className="song-title">Title</div>
          <div className="song-duration">
            <svg viewBox="0 0 16 16" className="duration-icon">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" />
              <path d="M8 3.25a.75.75 0 0 1 .75.75v3.25H11a.75.75 0 0 1 0 1.5H7.25V4A.75.75 0 0 1 8 3.25z" />
            </svg>
          </div>
          <div className="song-download">Download</div>
        </div>

        <div className="songs-list">
          {songs.map((song, index) => (
            <div key={song.id} className="song-item album-song-item" onDoubleClick={() => handlePlaySong(song, index)}>
              <div className="song-number">
                <span className="song-index">{index + 1}</span>
                <button className="song-play-button" onClick={() => handlePlaySong(song, index)}>
                  <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor" /></svg>
                </button>
              </div>

              <div className="song-title album-song-title">
                <div className="song-info">
                  <div className="song-name">{song.title}</div>
                  <div className="song-artist">{song.artists[0].name}</div>
                </div>
              </div>

              <div className="song-duration">{song.duration}</div>

              <div className="song-download download-button">
                {song.audio_file && (
                  <button
                    onClick={(e) => downloadSong(e, song)}
                    className="download-button"
                    title="Download"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="download-icon">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                    </svg>
                  </button>
                )}
                <button
                  className="favorite-btn"
                  onClick={(e) => handleToggleFavorite(e, song.id, song.is_favorite, FAVORITE_TYPE.SONG)}
                >
                  {song.is_favorite ? (
                    <HeartFilledIcon />
                  ) : (
                    <HeartOutlineIcon />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlbumPage