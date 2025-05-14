import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useMusicPlayer } from "../contexts/MusicPlayerContext"
import api from "../services/api"

const UserAlbumPage = () => {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const { playSong, currentSong, togglePlay } = useMusicPlayer()
  const [cssLoaded, setCssLoaded] = useState(false)


  useEffect(() => {
    import("./UserAlbumPage.css").then(() => {
      setCssLoaded(true)
    })
    const fetchAlbumData = async () => {
      try {
        const [response] = await Promise.all([
          api.getSongsUserAlbums(id)
        ])
        setAlbum(response.data)
        setSongs(response.data.songs || [])
      } catch (error) {
        console.error("Error fetching album data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlbumData()
  }, [id])

  const handlePlaySong = (song, index) => {
    if (currentSong?.id === song.id) {
      togglePlay()
      return
    }

    const contextUri = `user-album:${album.id}`
    playSong({
      id: song.id,
      name: song.title,
      artists: song.artists || [],
      album: {
        name: album.title,
        image: album.cover_image || ""
      },
      duration: song.duration || 0,
      audio: song.audio_file,
      image: song.image || album.cover_image,
      contextUri,
      contextSongs: songs
    })
  }

  const handleRemoveSong = async (songId) => {
    try {
      await api.removeSongFromUserAlbum(id, songId)
      setSongs(songs.filter(song => song.id !== songId))
    } catch (error) {
      console.error("Error removing song:", error)
    }
  }

  if (loading) {
    return <div className="loading-spinner" />
  }

  if (!album) {
    return <div className="not-found">Album not found</div>
  }

  return (
    <div className="user-album-page">
      <div className="album-header">
        <div className="album-cover">
          {album.cover_image ? (
            <img src={album.cover_image} alt={album.title} />
          ) : (
            <div className="default-cover">
              <span>{album.title.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="album-info">
          <h1 className="album-title">{album.title}</h1>
          <p className="album-description">{album.description}</p>
          <p className="album-meta">{songs.length} songs</p>
        </div>
      </div>

      <div className="album-songs">
        <div className="songs-header">
          <div className="header-number">#</div>
          <div className="header-title">Title</div>
          <div className="header-actions">Actions</div>
        </div>

        <div className="songs-list">
          {songs.map((song, index) => (
            <div key={song.id} className="song-item">
              <div className="song-number">
                <span>{index + 1}</span>
                <button className="play-btn play-btn-a" onClick={() => handlePlaySong(song, index)}>
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                </button>
              </div>
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">
                  {song.artists?.map(artist => artist.name).join(", ")}
                </div>
              </div>
              <div className="song-actions">
                <button className="remove-btn" onClick={() => handleRemoveSong(song.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6L18 6 17 6 7 6 6 6 5 6 6 19C6 20.1 6.9 21 8 21L16 21C17.1 21 18 20.1 18 19L19 6Z" fill="currentColor" />
                    <path d="M16 4L15 4 9 4 8 4 8 3C8 2.4 8.4 2 9 2L15 2C15.6 2 16 2.4 16 3L16 4Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserAlbumPage