import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const UserAlbumsPage = () => {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [newAlbumName, setNewAlbumName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [cssLoaded, setCssLoaded] = useState(false)

  useEffect(() => {
    import("./UserAlbumsPage.css").then(() => {
      setCssLoaded(true)
    })
    const fetchUserAlbums = async () => {
      try {
        const response = await api.getUserAlbums()
        setAlbums(response.data)
      } catch (error) {
        console.error("Error fetching user albums:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserAlbums()
  }, [])

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return

    try {
      const response = await api.createUserAlbum({
        title: newAlbumName,
        description: "My personal album"
      })
      setAlbums([...albums, response.data])
      setNewAlbumName("")
      setShowCreateForm(false)
    } catch (error) {
      console.error("Error creating album:", error)
    }
  }

  const handleDeleteAlbum = async (albumId) => {
    try {
      await api.deleteUserAlbum(albumId)
      setAlbums(albums.filter(album => album.id !== albumId))
    } catch (error) {
      console.error("Error deleting album:", error)
    }
  }

  if (loading) {
    return <div className="loading-spinner" />
  }

  return (
    <div className="user-albums-page">
      <div className="page-header">
        <h1>My Albums</h1>
      </div>
      <button
        className="create-album-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? "Cancel" : "Create New Album"}
      </button>

      {showCreateForm && (
        <div className="create-album-form">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Album name"
            className="album-name-input"
          />
          <button
            onClick={handleCreateAlbum}
            className="submit-album-btn"
          >
            Create
          </button>
        </div>
      )}

      <div className="albums-grid">
        {albums.map(album => (
          <div key={album.id} className="album-card">
            <Link to={`/my-album/${album.id}`} className="album-link">
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
                <h3 className="album-title">{album.title}</h3>
                <p className="album-song-count">{album.songs.length || 0} songs</p>
              </div>
            </Link>
            <button
              className="delete-album-btn"
              onClick={() => handleDeleteAlbum(album.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                background: "rgba(255, 0, 0, 0.1)",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer"
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="red"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "18px", height: "18px" }}
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
                <path d="M5 6l2-2h10l2 2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UserAlbumsPage